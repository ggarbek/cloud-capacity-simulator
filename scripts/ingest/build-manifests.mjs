#!/usr/bin/env node
/**
 * build-manifests.mjs — scan the committed rate shards under public/rates/ and
 * emit a single `public/rates/_manifest.json` describing their shape, coverage,
 * freshness, and join health.
 *
 * WHY: the weekly refresh (refresh-rates.yml) can partially succeed — a keyed
 * step (Azure specs, GCP rates) may be skipped when its secret is absent, or a
 * vendor API may hiccup. When that happens we need a POST-HOC, self-describing
 * record of exactly what landed, computed from the shards on disk (not from the
 * ingest run's own bookkeeping), so `validate-shards.mjs` can gate the commit
 * and the app can surface a data-health line. Each shard already carries its own
 * `generatedAt`, so this scan reports truth even for a step that didn't run this
 * cycle — the stale shard's timestamp shows how old it is.
 *
 * The join counts MIRROR the runtime join guard in
 * `src/data/rates/loadRegionRates.ts::buildCatalogFromShards` (~line 99):
 *   a rate row joins iff `spec present && spec.vcpus > 0 && spec.memoryGib > 0`.
 * That guard lives in exactly one place at runtime; we replicate the boolean
 * here (see JOIN_GUARD below) so the manifest's "joined / ratesWithoutSpec"
 * match what the app actually builds. If that guard ever changes, update this
 * mirror (and validate-shards' floor).
 *
 * Coverage percentages are the fraction of spec rows carrying real data:
 *   processorPct = specs with a non-empty processor string
 *                  (physicalProcessor || cpu || processor)
 *   networkPct   = specs with a non-zero network Mbps
 *                  (_network.json[sku] ?? spec.networkMbps)
 *   gpuFieldPct  = specs that carry a `gpus` field at all (presence, not > 0) —
 *                  GCP's doc-rule specs legitimately omit it, so this is 0 there.
 *
 * Run:  node scripts/ingest/build-manifests.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RATES_DIR = resolve(ROOT, 'public/rates');
const OUT = resolve(RATES_DIR, '_manifest.json');

/** The one place the join guard is mirrored. MUST match
 *  buildCatalogFromShards in src/data/rates/loadRegionRates.ts (~line 99). */
const JOIN_GUARD = (spec) => !!spec && spec.vcpus > 0 && spec.memoryGib > 0;

/** Provider dir → the display slug used for messages + a stable sample region. */
const CLOUDS = [
  { key: 'azure', dir: 'azure', sampleRegion: 'eastus' },
  { key: 'aws', dir: 'aws', sampleRegion: 'us-east-1' },
  { key: 'gcp', dir: 'gcp', sampleRegion: 'us-central1' },
];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const round = (n, d = 2) => Number.isFinite(n) ? Number(n.toFixed(d)) : 0;

function processorOf(spec) {
  return spec.physicalProcessor || spec.cpu || spec.processor || '';
}

function scanCloud({ dir, sampleRegion }) {
  const base = resolve(RATES_DIR, dir);
  const specsPath = resolve(base, '_specs.json');
  if (!existsSync(specsPath)) return null;

  const specsShard = readJson(specsPath);
  const specs = specsShard.specs ?? {};
  const specSkus = Object.keys(specs);
  const specRows = specSkus.length;

  const networkPath = resolve(base, '_network.json');
  const networkShard = existsSync(networkPath) ? readJson(networkPath) : { mbps: {} };
  const net = networkShard.mbps ?? {};
  const networkRows = Object.keys(net).length;

  // Coverage over spec rows.
  let procCount = 0;
  let netCount = 0;
  let gpuFieldCount = 0;
  for (const sku of specSkus) {
    const spec = specs[sku];
    if (String(processorOf(spec)).trim()) procCount++;
    const nv = net[sku] ?? spec.networkMbps ?? 0;
    if (Number(nv) > 0) netCount++;
    if ('gpus' in spec) gpuFieldCount++;
  }

  // Network fallback bookkeeping — how many network values came from the curated
  // _network.json table vs. carried inline on the spec (estimated / doc-rule).
  let curatedFallbackRows = 0;
  let estimatedRows = 0;
  for (const sku of specSkus) {
    if (Number(net[sku]) > 0) curatedFallbackRows++;
    else if (Number(specs[sku].networkMbps) > 0) estimatedRows++;
  }

  // Rates + join — scan every per-region shard (skip _-prefixed meta files).
  const files = readdirSync(base).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  let rateRows = 0;
  let joined = 0;
  let ratesWithoutSpec = 0;
  let regions = 0;
  let newestGeneratedAt = '';
  let oldestGeneratedAt = '';
  const pricedSkus = new Set();
  for (const file of files) {
    const shard = readJson(resolve(base, file));
    // Per-region shards are a flat { sku: { payg, ri1y, ri3y } } map; they carry
    // no own generatedAt, so freshness comes from the _index.json roll-up below.
    let anyPriced = false;
    for (const [sku, r] of Object.entries(shard)) {
      if (!r || typeof r.payg !== 'number') continue; // mirrors bake's rate guard
      anyPriced = true;
      rateRows++;
      pricedSkus.add(sku);
      if (JOIN_GUARD(specs[sku])) joined++;
      else ratesWithoutSpec++;
    }
    if (anyPriced) regions++;
  }

  // A spec that no region ever prices (availability-only or awaiting a keyed rate pull).
  let specsNeverPriced = 0;
  for (const sku of specSkus) if (!pricedSkus.has(sku)) specsNeverPriced++;

  // Freshness — prefer the per-provider _index.json roll-up (rates), else the
  // specs shard's own stamp. Each shard's own generatedAt carries truth even
  // when this cycle skipped that step.
  const idxPath = resolve(base, '_index.json');
  const ratesGeneratedAt = existsSync(idxPath)
    ? (readJson(idxPath).generatedAt ?? '')
    : (specsShard.generatedAt ?? '');
  newestGeneratedAt = ratesGeneratedAt;
  oldestGeneratedAt = ratesGeneratedAt;
  // Fold the specs + network stamps into the newest/oldest window so a stale
  // keyed spec pull is visible against fresh keyless rates.
  for (const ga of [specsShard.generatedAt, networkShard.generatedAt, ratesGeneratedAt]) {
    if (!ga) continue;
    if (!newestGeneratedAt || ga > newestGeneratedAt) newestGeneratedAt = ga;
    if (!oldestGeneratedAt || ga < oldestGeneratedAt) oldestGeneratedAt = ga;
  }

  return {
    specs: {
      rows: specRows,
      generatedAt: specsShard.generatedAt ?? '',
      coverage: {
        processorPct: round((procCount / (specRows || 1)) * 100),
        networkPct: round((netCount / (specRows || 1)) * 100),
        gpuFieldPct: round((gpuFieldCount / (specRows || 1)) * 100, 1),
      },
    },
    network: {
      rows: networkRows,
      generatedAt: networkShard.generatedAt ?? '',
      estimatedRows,
      curatedFallbackRows,
    },
    rates: {
      regions,
      rows: rateRows,
      newestGeneratedAt,
      oldestGeneratedAt,
    },
    join: {
      joined,
      ratesWithoutSpec,
      specsNeverPriced,
      sampleRegion,
    },
  };
}

const manifest = { version: 1, generatedAt: new Date().toISOString(), clouds: {} };
const report = [];
for (const cloud of CLOUDS) {
  const m = scanCloud(cloud);
  if (!m) {
    report.push(`${cloud.key}: no _specs.json — skipped`);
    continue;
  }
  manifest.clouds[cloud.key] = m;
  const share = m.rates.rows ? (m.join.ratesWithoutSpec / m.rates.rows) * 100 : 0;
  report.push(
    `${cloud.key}: ${m.specs.rows} specs (proc ${m.specs.coverage.processorPct}% · net ${m.specs.coverage.networkPct}%) · ` +
      `${m.rates.regions} regions · ${m.rates.rows.toLocaleString()} rates · ` +
      `${m.join.joined.toLocaleString()} joined · ${m.join.ratesWithoutSpec} rates-without-spec (${round(share)}%)`,
  );
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Shard manifest → ${OUT.replace(ROOT + '/', '')}`);
for (const line of report) console.log(`  ${line}`);

#!/usr/bin/env node
/**
 * validate-shards.mjs — integrity gate for a fresh rate-shard pull.
 *
 * WHY: the weekly refresh commits regenerated shards straight back to main. A
 * bad pull (a vendor API returning a truncated set, a schema change, a coverage
 * regression) would silently ship worse data than we already had. This gate runs
 * AFTER build-manifests.mjs and BEFORE the commit step, so a regression fails the
 * job and the good committed shards survive untouched.
 *
 * It compares the FRESH `public/rates/_manifest.json` against the PREVIOUS one
 * committed at HEAD (via `git show HEAD:public/rates/_manifest.json`). On the
 * very first run the committed manifest is absent → the gate passes (nothing to
 * compare against yet), only running the absolute schema checks.
 *
 * Exit 1 (fail the job) on any of:
 *   - specs / network / rates row count shrinking > 5% vs previous (per cloud)
 *   - processorPct or networkPct dropping > 1 point vs previous (per cloud)
 *   - ratesWithoutSpec / rates.rows above the per-cloud floor (see FLOOR below)
 *   - schema sample check failing on 20 spec records/cloud
 *
 * Run:  node scripts/ingest/validate-shards.mjs
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RATES_DIR = resolve(ROOT, 'public/rates');

// ── Thresholds ───────────────────────────────────────────────────────────────
const SHRINK_MAX = 0.05; // row counts may not drop more than 5% vs previous
const COVERAGE_DROP_MAX = 1.0; // processorPct / networkPct may not drop > 1 point

/**
 * Per-cloud ceiling on ratesWithoutSpec / rates.rows.
 *
 * Measured 2026-07 (build-manifests baseline): azure 12.13%, aws 0%, gcp 1.86%.
 * Azure is the driver — its rate feed carries ~9k SKUs the keyless spec pull
 * doesn't cover yet. Floor set a hair ABOVE Azure's current share so a normal
 * cycle passes but a real coverage cliff fails.
 *
 * TODO(B2): ratchet this down as B2's curated processor/spec map lands and the
 * Azure share falls. Target < 5% once specs cover the priced SKUs.
 */
const RATES_WITHOUT_SPEC_FLOOR = 0.14; // 14%

const SCHEMA_SAMPLE = 20; // spec records to schema-check per cloud

const CLOUDS = ['azure', 'aws', 'gcp'];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const failures = [];
const fail = (msg) => failures.push(msg);

// ── Load fresh + previous manifest ───────────────────────────────────────────
const fresh = readJson(resolve(RATES_DIR, '_manifest.json'));

let previous = null;
try {
  const raw = execSync('git show HEAD:public/rates/_manifest.json', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  previous = JSON.parse(raw);
} catch {
  console.log('No committed _manifest.json at HEAD — first run, skipping drift comparison.');
}

// ── Drift comparison (only when a previous manifest exists) ───────────────────
function checkShrink(cloud, label, prev, now) {
  if (!(prev > 0)) return; // no baseline to shrink from
  const drop = (prev - now) / prev;
  if (drop > SHRINK_MAX) {
    fail(`${cloud}: ${label} rows shrank ${(drop * 100).toFixed(1)}% (${prev} → ${now}, max ${SHRINK_MAX * 100}%).`);
  }
}
function checkCoverageDrop(cloud, label, prev, now) {
  if (prev == null || now == null) return;
  const drop = prev - now;
  if (drop > COVERAGE_DROP_MAX) {
    fail(`${cloud}: ${label} dropped ${drop.toFixed(2)} points (${prev} → ${now}, max ${COVERAGE_DROP_MAX}).`);
  }
}

if (previous) {
  for (const cloud of CLOUDS) {
    const p = previous.clouds?.[cloud];
    const n = fresh.clouds?.[cloud];
    if (!p) continue; // cloud newly added — nothing to compare
    if (!n) {
      fail(`${cloud}: present in previous manifest but MISSING from fresh manifest.`);
      continue;
    }
    checkShrink(cloud, 'specs', p.specs?.rows, n.specs?.rows);
    checkShrink(cloud, 'network', p.network?.rows, n.network?.rows);
    checkShrink(cloud, 'rates', p.rates?.rows, n.rates?.rows);
    checkCoverageDrop(cloud, 'processorPct', p.specs?.coverage?.processorPct, n.specs?.coverage?.processorPct);
    checkCoverageDrop(cloud, 'networkPct', p.specs?.coverage?.networkPct, n.specs?.coverage?.networkPct);
  }
}

// ── Absolute checks (always) ─────────────────────────────────────────────────
for (const cloud of CLOUDS) {
  const n = fresh.clouds?.[cloud];
  if (!n) {
    fail(`${cloud}: missing from fresh manifest (no _specs.json?).`);
    continue;
  }

  // ratesWithoutSpec share ceiling.
  const rows = n.rates?.rows ?? 0;
  const share = rows ? (n.join?.ratesWithoutSpec ?? 0) / rows : 0;
  if (share > RATES_WITHOUT_SPEC_FLOOR) {
    fail(
      `${cloud}: ratesWithoutSpec share ${(share * 100).toFixed(2)}% exceeds floor ${(RATES_WITHOUT_SPEC_FLOOR * 100).toFixed(0)}% ` +
        `(${n.join?.ratesWithoutSpec} of ${rows}). Spec coverage regressed vs the priced SKU set.`,
    );
  }

  // Schema sample on 20 spec records — read the shard directly (the manifest
  // only carries counts). vcpus & memoryGib numeric on every cloud; azure adds
  // `regions`, gcp adds `family` + `cpu`.
  let specsShard;
  try {
    specsShard = readJson(resolve(RATES_DIR, cloud, '_specs.json'));
  } catch {
    fail(`${cloud}: cannot read _specs.json for schema check.`);
    continue;
  }
  const entries = Object.entries(specsShard.specs ?? {}).slice(0, SCHEMA_SAMPLE);
  if (entries.length === 0) {
    fail(`${cloud}: _specs.json has zero spec records.`);
    continue;
  }
  for (const [sku, spec] of entries) {
    if (typeof spec.vcpus !== 'number') fail(`${cloud}: spec ${sku} vcpus not numeric.`);
    if (typeof spec.memoryGib !== 'number') fail(`${cloud}: spec ${sku} memoryGib not numeric.`);
    if (cloud === 'azure' && !Array.isArray(spec.regions)) {
      fail(`${cloud}: spec ${sku} missing \`regions\` array.`);
    }
    if (cloud === 'gcp') {
      if (typeof spec.family !== 'string' || !spec.family) fail(`${cloud}: spec ${sku} missing \`family\`.`);
      if (typeof spec.cpu !== 'string' || !spec.cpu) fail(`${cloud}: spec ${sku} missing \`cpu\`.`);
    }
  }
}

// ── Result ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\nvalidate-shards: ${failures.length} FAILURE(S) — refusing the pull:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\nThe previously committed shards survive; fix the ingest before re-running.');
  process.exit(1);
}

console.log('validate-shards: OK — all drift, coverage, floor, and schema checks passed.');
for (const cloud of CLOUDS) {
  const n = fresh.clouds?.[cloud];
  if (!n) continue;
  const rows = n.rates?.rows ?? 0;
  const share = rows ? ((n.join?.ratesWithoutSpec ?? 0) / rows) * 100 : 0;
  console.log(
    `  ${cloud}: ${n.specs?.rows} specs · ${rows.toLocaleString()} rates · ` +
      `proc ${n.specs?.coverage?.processorPct}% · net ${n.specs?.coverage?.networkPct}% · ` +
      `rates-without-spec ${share.toFixed(2)}%`,
  );
}

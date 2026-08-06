#!/usr/bin/env node
/**
 * build-live-catalog.mjs — consolidate the per-region rate shards into ONE
 * bundled artifact (`src/data/liveCatalog.generated.json`) that ships inside
 * the app build.
 *
 * WHY: the live shards under `public/rates/<provider>/` are the real, current
 * specs + network + per-region pricing, refreshed weekly by the
 * `refresh-rates.yml` GitHub Action. They used to be loaded lazily, one region
 * at a time, on a manual click. This script bakes ALL of them — every region,
 * cloud, and size — into a single module so the dashboard's default catalog is
 * fresh everywhere with no runtime fetch and no manual "Load". The same weekly
 * job re-runs this script, so each deploy carries the latest rates.
 *
 * The runtime (`src/data/liveCatalog.ts`) joins specs ⨝ network ⨝ rates into a
 * `UserVm[]` via the shared `buildCatalogFromShards`, so the join logic lives
 * in exactly one place (this script only concatenates).
 *
 * Region naming mirrors the rest of the catalog: Azure shard slugs (eastus2)
 * map to display names (East US 2) via DISPLAY_REGIONS; slugs with no display
 * match (edge / sovereign) are skipped, consistent with every other family.
 * AWS / GCP regions are already canonical slugs (us-east-1, africa-south1) and
 * pass through unchanged.
 *
 * Run:  node scripts/ingest/build-live-catalog.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const RATES_DIR = resolve(ROOT, 'public/rates');
const OUT = resolve(ROOT, 'src/data/liveCatalog.generated.json');

/** Canonical Azure display-region set — kept in sync with
 *  build-azure-mseries-seed.mjs (the catalog's region universe). */
const AZURE_DISPLAY_REGIONS = [
  'Australia Central', 'Australia Central 2', 'Australia East', 'Australia Southeast',
  'Austria East', 'Belgium Central', 'Brazil South', 'Brazil Southeast',
  'Canada Central', 'Canada East', 'Central India', 'Central US', 'Chile Central',
  'Denmark East', 'East Asia', 'East US', 'East US 2', 'France Central', 'France South',
  'Germany North', 'Germany West Central', 'India Central', 'Indonesia Central',
  'Israel Central', 'Italy North', 'Japan East', 'Japan West', 'Korea Central',
  'Korea South', 'Malaysia West', 'Mexico Central', 'New Zealand North',
  'North Central US', 'North Europe', 'Norway East', 'Norway West', 'Poland Central',
  'Qatar Central', 'South Africa North', 'South Africa West', 'South Central US',
  'South India', 'Southeast Asia', 'Spain Central', 'Sweden Central', 'Sweden South',
  'Switzerland North', 'Switzerland West', 'UAE Central', 'UAE North', 'UK South',
  'UK West', 'US Gov Arizona', 'US Gov Texas', 'US Gov Virginia', 'West Central US',
  'West Europe', 'West India', 'West US', 'West US 2', 'West US 3',
  'Jio India West', 'Jio India Central', 'Israel Northwest', 'India South Central',
];
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const azureSlugToDisplay = new Map(AZURE_DISPLAY_REGIONS.map((d) => [norm(d), d]));

/** Provider → shard dir, plus the region-name resolver for that provider. */
const PROVIDERS = [
  { provider: 'AWS', dir: 'aws', resolveRegion: (slug) => slug },
  { provider: 'Azure', dir: 'azure', resolveRegion: (slug) => azureSlugToDisplay.get(norm(slug)) ?? null },
  { provider: 'GCP', dir: 'gcp', resolveRegion: (slug) => slug },
];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const out = { _comment: '', asOf: '', providers: {} };
let grandRows = 0;
const report = [];

for (const { provider, dir, resolveRegion } of PROVIDERS) {
  const base = resolve(RATES_DIR, dir);
  const specsPath = resolve(base, '_specs.json');
  if (!existsSync(specsPath)) {
    report.push(`${provider}: no _specs.json — skipped`);
    continue;
  }
  const specsShard = readJson(specsPath);
  const networkPath = resolve(base, '_network.json');
  const network = existsSync(networkPath) ? readJson(networkPath).mbps ?? {} : {};

  const rates = {};
  let rows = 0;
  let skipped = 0;
  const files = readdirSync(base).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const region = resolveRegion(slug);
    if (!region) { skipped++; continue; } // Azure edge/sovereign slug with no display name
    const shard = readJson(resolve(base, file));
    // Merge into the resolved region (Azure display names can collapse 1:1; the
    // join later drops SKUs without a spec, so carrying every rate is safe).
    const bucket = (rates[region] ??= {});
    for (const [sku, r] of Object.entries(shard)) {
      if (!r || typeof r.payg !== 'number') continue;
      bucket[sku] = {
        payg: r.payg,
        ri1y: typeof r.ri1y === 'number' ? r.ri1y : null,
        ri3y: typeof r.ri3y === 'number' ? r.ri3y : null,
      };
      rows++;
    }
  }
  out.providers[provider] = { specs: specsShard.specs ?? {}, network, rates };
  grandRows += rows;
  report.push(
    `${provider}: ${Object.keys(rates).length} regions · ${Object.keys(specsShard.specs ?? {}).length} specs · ${rows.toLocaleString()} rate rows` +
      (skipped ? ` · ${skipped} edge slugs skipped` : ''),
  );
  // Track the freshest pull for the asOf stamp.
  const idxPath = resolve(base, '_index.json');
  if (existsSync(idxPath)) {
    const ga = readJson(idxPath).generatedAt;
    if (ga && ga > out.asOf) out.asOf = ga;
  } else if (specsShard.generatedAt && specsShard.generatedAt > out.asOf) {
    out.asOf = specsShard.generatedAt;
  }
}

out._comment =
  'GENERATED by scripts/ingest/build-live-catalog.mjs from public/rates/. Real specs + ' +
  'network + per-region pricing for every cloud/region/size. Do not hand-edit; re-run the script.';

// Embed the shard manifest (built by scripts/ingest/build-manifests.mjs) as
// `out.health` so the app's data-health line (src/data/dataHealth.ts) reads it
// straight from the baked catalog — no separate fetch. Tolerate absence (the
// manifest is a later CI step; a plain `build-live-catalog` run may precede it).
const manifestPath = resolve(RATES_DIR, '_manifest.json');
if (existsSync(manifestPath)) {
  out.health = readJson(manifestPath);
}

writeFileSync(OUT, JSON.stringify(out) + '\n');

console.log(`Live catalog → ${OUT.replace(ROOT + '/', '')}`);
for (const line of report) console.log(`  ${line}`);
console.log(`  total rate rows: ${grandRows.toLocaleString()} · asOf ${out.asOf.slice(0, 10)}`);

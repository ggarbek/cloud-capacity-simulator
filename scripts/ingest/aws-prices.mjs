#!/usr/bin/env node
// AWS EC2 rate ingestion — KEYLESS, public Price List Bulk API (CSV offer files).
//
// Pulls On-Demand (PAYG) + Reserved (1yr / 3yr) rates for every EC2 instance type
// in every (or a chosen set of) region(s), normalizes each to an HOURLY USD rate,
// and writes ONE sharded JSON per region under public/rates/aws/ — the SAME shape
// as the Azure ingest (`{ "<instanceType>": { payg, ri1y, ri3y } }`) so the app's
// lazy region loader treats AWS and Azure identically.
//
// === KEYLESS, no IAM keys ===
// Source: https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/
//   region_index.json            → per-region `currentVersionUrl`
//   <region>/index.csv           → flat price rows for that region
// The Price List **Bulk** API is public and keyless. We use its CSV variant (not
// the JSON one): per-region EC2 offer files are HUGE (JSON ~400 MB, CSV ~270 MB),
// far too big to `JSON.parse` into a string. The CSV is a flat row-per-rate file,
// so we STREAM it line-by-line and keep only the few columns we need — memory stays
// in the tens-of-KB regardless of the 270 MB on the wire. (The keyed Query API,
// api.pricing.amazonaws.com, would avoid the size but needs SigV4 + IAM keys; we
// deliberately don't take that path — keyless wins per scripts/ingest/README.md.)
//
// === What rate we pick ===
// BASE on-demand (PAYG): operatingSystem == "Linux", tenancy == "Shared",
//   preInstalledSw == "NA", capacitystatus == "Used", unit == "Hrs". That's the
//   plain Linux box-hour, the number people mean by "the on-demand price".
// Reserved (ri1y / ri3y): same Linux/Shared/NA filter, TermType == "Reserved",
//   OfferingClass == "standard", PurchaseOption == "No Upfront". No-Upfront RIs are
//   already a pure hourly rate (PricePerUnit on the "Hrs" row) — nothing to
//   amortize, so the hourly number is exact, not an approximation. (All/Partial
//   Upfront would require folding the lump "Upfront Fee" Quantity row across the
//   term hours; No Upfront sidesteps that and is the cleanest apples-to-apples
//   hourly comparison to PAYG.) 1yr → ri1y, 3yr → ri3y.
//
// What this does NOT do: hardware specs (vCPU / RAM / network). Rates only — specs
// come from the doc-derived AWS seed and join by instanceType at load time.
//
// Usage:
//   node scripts/ingest/aws-prices.mjs                       # every region (slow, GBs on the wire)
//   node scripts/ingest/aws-prices.mjs us-east-1 eu-west-1   # just these regions
//
// Automatable: a GitHub Action can run this on a cron and commit the refreshed
// shards — no backend, no secrets (the API needs none).

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'aws');
const HOST = 'https://pricing.us-east-1.amazonaws.com';
const REGION_INDEX = `${HOST}/offers/v1.0/aws/AmazonEC2/current/region_index.json`;

const regionFilter = process.argv.slice(2); // empty = all regions

/** Parse one CSV line into fields, honoring "quoted, commas". */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const round = (n) => (n == null ? null : Math.round(n * 1e6) / 1e6);

/**
 * Stream a region's index.csv, line by line, and reduce to
 * { instanceType: { payg, ri1y, ri3y } }.
 *
 * The CSV opens with a handful of metadata rows ("FormatVersion",… ) then ONE
 * header row whose first cell is "SKU"; every row after is a rate. We resolve
 * column indices from that header (AWS does append columns over time, so we never
 * hard-code positions).
 */
async function ingestRegion(regionCode, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AWS CSV ${res.status} for ${regionCode}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let col = null; // header index map, set when we hit the "SKU" header row
  const skus = {};
  let rows = 0;
  let bytes = 0;

  const idx = {}; // column-name → position, filled from header

  const handleLine = (line) => {
    if (!line) return;
    if (col == null) {
      // Still in the preamble; the header row's first field is exactly SKU.
      const fields = parseCsvLine(line);
      if (fields[0] === 'SKU') {
        col = fields;
        const want = [
          'TermType', 'Unit', 'PricePerUnit', 'Instance Type', 'Operating System',
          'Tenancy', 'Pre Installed S/W', 'CapacityStatus', 'LeaseContractLength',
          'PurchaseOption', 'OfferingClass',
        ];
        for (const w of want) idx[w] = col.indexOf(w);
      }
      return;
    }
    const f = parseCsvLine(line);
    const it = f[idx['Instance Type']];
    if (!it) return;
    // BASE-rate filter shared by PAYG + Reserved.
    if (f[idx['Operating System']] !== 'Linux') return;
    if (f[idx['Tenancy']] !== 'Shared') return;
    if (f[idx['Pre Installed S/W']] !== 'NA') return;
    if (f[idx['CapacityStatus']] !== 'Used') return;
    if (f[idx['Unit']] !== 'Hrs') return; // skip the lump "Upfront Fee" Quantity rows

    const price = parseFloat(f[idx['PricePerUnit']]);
    if (!Number.isFinite(price) || price <= 0) return;

    const term = f[idx['TermType']];
    const row = (skus[it] ??= { payg: null, ri1y: null, ri3y: null });

    if (term === 'OnDemand') {
      // Lowest non-zero on-demand hour is the base box rate.
      if (row.payg == null || price < row.payg) row.payg = round(price);
    } else if (term === 'Reserved') {
      if (f[idx['OfferingClass']] !== 'standard') return;
      if (f[idx['PurchaseOption']] !== 'No Upfront') return;
      const lease = f[idx['LeaseContractLength']];
      if (lease === '1yr' && (row.ri1y == null || price < row.ri1y)) row.ri1y = round(price);
      else if (lease === '3yr' && (row.ri3y == null || price < row.ri3y)) row.ri3y = round(price);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      handleLine(line);
      rows++;
      if (rows % 200000 === 0) {
        process.stdout.write(
          `\r  ${regionCode}: …${(bytes / 1e6).toFixed(0)} MB, ${Object.keys(skus).length} types`,
        );
      }
    }
  }
  handleLine(buf.replace(/\r$/, '')); // trailing line, no newline

  return skus;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Fetching region index → ${REGION_INDEX}`);
  const indexRes = await fetch(REGION_INDEX);
  if (!indexRes.ok) throw new Error(`region_index ${indexRes.status}`);
  const { regions } = await indexRes.json();

  let targets = Object.values(regions);
  if (regionFilter.length) {
    targets = targets.filter((r) => regionFilter.includes(r.regionCode));
    const found = targets.map((t) => t.regionCode);
    const missing = regionFilter.filter((r) => !found.includes(r));
    if (missing.length) console.warn(`  (not in AWS index, skipped: ${missing.join(', ')})`);
  }
  console.log(`Ingesting ${targets.length} region(s).\n`);

  const written = [];
  for (const { regionCode, currentVersionUrl } of targets) {
    // currentVersionUrl points at the .json file; swap to the streamable .csv.
    const csvUrl = `${HOST}${currentVersionUrl.replace(/index\.json$/, 'index.csv')}`;
    console.log(`→ ${regionCode}`);
    try {
      const skus = await ingestRegion(regionCode, csvUrl);
      const skuCount = Object.keys(skus).length;
      if (skuCount === 0) {
        console.log(`\r  ${regionCode}: no instance rates (skipped)        `);
        continue;
      }
      await writeFile(join(OUT_DIR, `${regionCode}.json`), JSON.stringify(skus));
      written.push({ region: regionCode, skuCount });
      console.log(`\r  ${regionCode}: ${skuCount} instance types ✓            `);
    } catch (e) {
      console.error(`\r  ${regionCode}: FAILED — ${e.message}`);
    }
  }

  written.sort((a, b) => a.region.localeCompare(b.region));
  await writeFile(
    join(OUT_DIR, '_index.json'),
    JSON.stringify(
      { provider: 'aws', generatedAt: new Date().toISOString(), regions: written },
      null,
      2,
    ),
  );
  console.log(`\n✓ Wrote ${written.length} region shard(s) → public/rates/aws/`);
  console.log(`  total instance-type rates: ${written.reduce((s, r) => s + r.skuCount, 0)}`);
}

main().catch((e) => {
  console.error('\nIngestion failed:', e.message);
  process.exit(1);
});

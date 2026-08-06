#!/usr/bin/env node
// Azure VM rate ingestion — KEYLESS, public Retail Prices API.
//
// Pulls Consumption (PAYG) + Reservation (1yr / 3yr) meters for every Azure VM
// SKU in every (or a chosen set of) region(s), normalizes each to an HOURLY USD
// rate, and writes ONE sharded JSON per region under public/rates/azure/.
//
// Why sharded: "all SKUs × all regions" is millions of rows. The app lazy-loads
// only the region(s) it prices against (see the loader, src/data/rates/*), so we
// never ship the whole cross-product into the bundle or localStorage.
//
// What this does NOT do: hardware specs (vCPU / RAM / network). The keyless price
// API carries rates only — specs come from the doc-derived seed and are joined by
// armSkuName at load time. See scripts/ingest/README.md.
//
// Usage:
//   node scripts/ingest/azure-prices.mjs                 # every region (slow, MBs)
//   node scripts/ingest/azure-prices.mjs eastus2 westeurope   # just these regions
//
// Automatable: a GitHub Action can run this on a cron and commit the refreshed
// shards — no backend, no secrets (the API needs none).

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'azure');
const API = 'https://prices.azure.com/api/retail/prices';
const API_VERSION = '2023-01-01-preview';
const HOURS_PER_YEAR = 8760; // for normalizing reservation term-totals to hourly

const regionFilter = process.argv.slice(2); // empty = all regions

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch with retry on throttling (429) / transient 5xx, honoring Retry-After. */
async function fetchRetry(url, attempt = 0) {
  const res = await fetch(url);
  if (res.status === 429 || res.status === 503 || res.status === 500) {
    if (attempt >= 8) throw new Error(`Azure API ${res.status} after ${attempt} retries`);
    const ra = Number(res.headers.get('retry-after'));
    const waitMs = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(60000, 1000 * 2 ** attempt);
    process.stdout.write(`\n  throttled (${res.status}) — waiting ${Math.round(waitMs / 1000)}s…`);
    await sleep(waitMs);
    return fetchRetry(url, attempt + 1);
  }
  return res;
}

/** Page through an OData $filter, following NextPageLink. */
async function fetchAll(filter) {
  const items = [];
  let url = `${API}?api-version=${API_VERSION}&$filter=${encodeURIComponent(filter)}`;
  let pages = 0;
  while (url) {
    const res = await fetchRetry(url);
    if (!res.ok) throw new Error(`Azure API ${res.status} on page ${pages}`);
    const json = await res.json();
    items.push(...(json.Items ?? []));
    url = json.NextPageLink ?? null;
    pages++;
    if (pages % 10 === 0) process.stdout.write(`\r  …${items.length} meters (${pages} pages)`);
  }
  return items;
}

/**
 * Reduce raw meters → { region: { armSkuName: { payg, ri1y, ri3y } } }.
 * - PAYG  = base Consumption meter (Linux/compute; no Spot / Low Priority / Windows suffix).
 * - ri1y  = 1-Year Reservation term-total ÷ 8760.
 * - ri3y  = 3-Year Reservation term-total ÷ (3 × 8760).
 */
function normalize(meters) {
  const byRegion = {};
  for (const m of meters) {
    const sku = m.armSkuName;
    const region = m.armRegionName;
    if (!sku || !region) continue;
    if (m.unitOfMeasure !== '1 Hour') continue;
    // Skip Windows-licensed + spot/low-priority/devtest variants for the base rate.
    const name = `${m.skuName ?? ''} ${m.meterName ?? ''} ${m.productName ?? ''}`;
    if (/windows/i.test(name)) continue;

    const bucket = (byRegion[region] ??= {});
    const row = (bucket[sku] ??= { payg: null, ri1y: null, ri3y: null });

    if (m.type === 'Consumption') {
      if (/\b(spot|low priority)\b/i.test(name)) continue;
      // Lowest non-zero consumption meter is the base PAYG compute rate.
      if (m.retailPrice > 0 && (row.payg == null || m.retailPrice < row.payg)) row.payg = m.retailPrice;
    } else if (m.type === 'Reservation') {
      if (m.reservationTerm === '1 Year') row.ri1y = round(m.retailPrice / HOURS_PER_YEAR);
      else if (m.reservationTerm === '3 Years') row.ri3y = round(m.retailPrice / (3 * HOURS_PER_YEAR));
    }
  }
  return byRegion;
}

const round = (n) => (n == null ? null : Math.round(n * 1e6) / 1e6);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Region-scoped runs are far faster; loop regions when a filter is given.
  const filters = regionFilter.length
    ? regionFilter.map((r) => `serviceName eq 'Virtual Machines' and armRegionName eq '${r}'`)
    : [`serviceName eq 'Virtual Machines'`];

  const merged = {};
  for (const f of filters) {
    console.log(`\nFetching: ${f}`);
    const meters = await fetchAll(f);
    console.log(`\n  ${meters.length} meters → normalizing`);
    const byRegion = normalize(meters);
    for (const [region, skus] of Object.entries(byRegion)) {
      merged[region] = { ...(merged[region] ?? {}), ...skus };
    }
  }

  const index = [];
  for (const [region, skus] of Object.entries(merged)) {
    const skuCount = Object.keys(skus).length;
    if (skuCount === 0) continue;
    await writeFile(join(OUT_DIR, `${region}.json`), JSON.stringify(skus));
    index.push({ region, skuCount });
  }
  index.sort((a, b) => a.region.localeCompare(b.region));
  await writeFile(
    join(OUT_DIR, '_index.json'),
    JSON.stringify({ provider: 'azure', generatedAt: new Date().toISOString(), regions: index }, null, 2),
  );
  console.log(`\n✓ Wrote ${index.length} region shards → public/rates/azure/`);
  console.log(`  total SKU-rates: ${index.reduce((s, r) => s + r.skuCount, 0)}`);
}

main().catch((e) => {
  console.error('\nIngestion failed:', e.message);
  process.exit(1);
});

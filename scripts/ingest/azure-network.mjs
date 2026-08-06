#!/usr/bin/env node
// Azure VM network-bandwidth ingestion — KEYLESS, from the published docs.
//
// Azure exposes per-size "Max Network Bandwidth (Mbps)" ONLY in documentation,
// not in any API. But the docs are open-source markdown on GitHub
// (MicrosoftDocs/azure-compute-docs), with a structured network table per series
// keyed by the exact SKU name — the same key we join specs + rates on. This
// parses every series file and emits a _network.json overlay, replacing the
// interpolated estimates baked into src/data/*Seed.ts with real per-size values.
//
// Keyless (raw GitHub files); automatable alongside the other ingest scripts.
//
// Usage:  node scripts/ingest/azure-network.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'azure');
const REPO = 'MicrosoftDocs/azure-compute-docs';
const TREE_API = `https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
// Authenticate the GitHub API call when a token is present (env GITHUB_TOKEN /
// GH_TOKEN, e.g. the auto-provided token in GitHub Actions). Unauthenticated
// api.github.com is 60 req/hr per IP — CI runners share IPs and hit 403; a token
// raises it to ~1,000/hr.
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const UA = {
  'User-Agent': 'capacity-sim-ingest',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

/** List every `*-series.md` under the VM sizes docs. */
async function listSeriesFiles() {
  const res = await fetch(TREE_API, { headers: UA });
  if (!res.ok) throw new Error(`GitHub tree API ${res.status} (rate limit? wait an hour)`);
  const json = await res.json();
  return (json.tree ?? [])
    .map((t) => t.path)
    .filter((p) => /articles\/virtual-machines\/sizes\/.*-series\.md$/.test(p));
}

/** Fetch a series file plus its first-level [!INCLUDE] targets, concatenated. */
async function fetchWithIncludes(path) {
  const main = await (await fetch(RAW + path, { headers: UA })).text();
  const dirUrl = RAW + path.slice(0, path.lastIndexOf('/') + 1);
  const incPaths = [...main.matchAll(/!INCLUDE\s*\[[^\]]*\]\(([^)]+)\)/gi)].map((m) => m[1]);
  const incs = await Promise.all(
    incPaths.map(async (p) => {
      try {
        const r = await fetch(new URL(p, dirUrl).href, { headers: UA });
        return r.ok ? await r.text() : '';
      } catch {
        return '';
      }
    }),
  );
  return main + '\n' + incs.join('\n');
}

/**
 * Parse a series markdown file → [ [sku, mbps], … ] from its network table.
 * Header wording + unit vary across doc generations:
 *   "Max Network Bandwidth (Mbps)" / "(Mb/s)"  (most families)
 *   "Max Bandwidth (Mbps)"                       (many GPU families)
 *   "Max Front-end Bandwidth (Mbps)"             (a few)
 *   "Expected network performance (Mbps)"        (legacy)
 * Distinguished from look-alike columns that must NOT match:
 *   "Memory Bandwidth (GB/s)"   → memory, excluded by name + unit
 *   "...Throughput (MBps/MB/s)" → disk BYTES (capital B); network is Mbps (bits)
 *   "RDMA Performance (Gb/s)"   → separate fabric, no "bandwidth" word
 * The unit test is CASE-SENSITIVE megabits (`Mb`, lowercase b) so disk MBps
 * (megaBYTES) can never be mistaken for network. Cells may carry a base/burst
 * pair ("12,500 / 40,000") — we take the max number as the ceiling.
 */
const BW_UNIT = /Mb(ps|\/s)/; // case-sensitive: megabits (network), not MBps (disk bytes)
const isBwHeader = (c) =>
  BW_UNIT.test(c) && /bandwidth|network performance/i.test(c) && !/memory\s+bandwidth/i.test(c);
// Strip markdown emphasis (**bold**, `code`) + footnote markers so bold-formatted
// tables (e.g. the FPGA series) parse like the rest.
const clean = (s) => s.replace(/<sup>.*?<\/sup>/gi, '').replace(/[*`]/g, '').trim();
const cellsOf = (line) => line.split('|').map(clean);

function parseNetworkTable(md) {
  const lines = md.split('\n');
  const hdr = lines.findIndex((l) => l.includes('|') && cellsOf(l).some(isBwHeader));
  if (hdr < 0) return [];
  const bwCol = cellsOf(lines[hdr]).findIndex(isBwHeader);
  if (bwCol < 0) return [];

  const out = [];
  for (let i = hdr + 2; i < lines.length && lines[i].includes('|'); i++) {
    const cells = cellsOf(lines[i]);
    const sku = cells[1];
    if (!sku || !/^[A-Za-z].*\d/.test(sku)) continue;
    const nums = (cells[bwCol] ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/g);
    if (!nums) continue;
    const mbps = Math.max(...nums.map(Number));
    if (mbps > 0) out.push([sku, Math.round(mbps)]);
  }
  return out;
}

// ── Curated legacy-network fallback (B2, S64) ─────────────────────────────
// Per-SKU "Expected/Max network bandwidth (Mbps)" TRANSCRIBED from Azure's
// previous-generation series docs. Applied ONLY to SKUs the live scrape missed
// (older families whose docs use INCLUDE files or non-standard table shapes the
// parser skips), so region availability + the spec sheet don't show a blank NIC
// for a legacy size. NEVER formula-fabricated — every value is copied from the
// documented "Max Network Bandwidth (Mbps)" column. SKUs filled from here are
// recorded in `estimatedSkus` and tagged source 'curated-fallback' so the UI
// labels them "(est.)". Verified 2026-07 against learn.microsoft.com/azure/
// virtual-machines/sizes/{general-purpose,memory-optimized}/<series>-series.
const LEGACY_NETWORK = {
  // Dv2 / DSv2 (general-purpose, Haswell/Broadwell). Doc table D1..D5.
  Standard_D1_v2: 750, Standard_D2_v2: 1500, Standard_D3_v2: 3000, Standard_D4_v2: 6000, Standard_D5_v2: 12000,
  Standard_DS1_v2: 750, Standard_DS2_v2: 1500, Standard_DS3_v2: 3000, Standard_DS4_v2: 6000, Standard_DS5_v2: 12000,
  // Dv3 / Dsv3 (Broadwell/Skylake). Doc table D2..D64_v3.
  Standard_D2_v3: 1000, Standard_D4_v3: 2000, Standard_D8_v3: 2000, Standard_D16_v3: 2000,
  Standard_D32_v3: 16000, Standard_D48_v3: 24000, Standard_D64_v3: 30000,
  Standard_D2s_v3: 1000, Standard_D4s_v3: 2000, Standard_D8s_v3: 2000, Standard_D16s_v3: 2000,
  Standard_D32s_v3: 16000, Standard_D48s_v3: 24000, Standard_D64s_v3: 30000,
  // Ev3 / Esv3 (memory-optimized, Broadwell/Skylake). Doc table E2..E64_v3.
  Standard_E2_v3: 1000, Standard_E4_v3: 2000, Standard_E8_v3: 4000, Standard_E16_v3: 8000,
  Standard_E20_v3: 10000, Standard_E32_v3: 16000, Standard_E48_v3: 24000, Standard_E64_v3: 30000, Standard_E64i_v3: 30000,
  Standard_E2s_v3: 1000, Standard_E4s_v3: 2000, Standard_E8s_v3: 4000, Standard_E16s_v3: 8000,
  Standard_E20s_v3: 10000, Standard_E32s_v3: 16000, Standard_E48s_v3: 24000, Standard_E64s_v3: 30000, Standard_E64is_v3: 30000,
};

async function mapLimit(items, limit, fn) {
  const results = [];
  let idx = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Listing series docs…');
  const files = await listSeriesFiles();
  console.log(`  ${files.length} series files`);

  const mbps = {};
  const noTable = [];
  let done = 0;
  await mapLimit(files, 8, async (path) => {
    const md = await fetchWithIncludes(path);
    done++;
    process.stdout.write(`\r  parsed ${done}/${files.length}`);
    const series = path.split('/sizes/')[1];
    const rows = parseNetworkTable(md);
    if (!rows.length) noTable.push(series);
    for (const [sku, v] of rows) {
      // Same SKU can appear in multiple files; keep the max ceiling seen.
      mbps[sku] = Math.max(mbps[sku] ?? 0, v);
    }
  });
  console.log('');

  // Scrape row-count guard: the docs carry ~1,000+ SKUs with a network table. A
  // sudden collapse means a docs reformat broke the parser — FAIL LOUDLY rather
  // than silently gut the shard (which would wipe network ceilings app-wide).
  const scrapedCount = Object.keys(mbps).length;
  if (scrapedCount < 900) {
    console.error(
      `\nNetwork scrape returned only ${scrapedCount} SKUs (< 900 threshold). ` +
        `A docs reformat likely broke the table parser — refusing to write a gutted shard.`,
    );
    process.exit(1);
  }

  // Curated legacy fallback: fill ONLY the SKUs the scrape missed, and record
  // them so downstream can label the value "(est.)".
  const estimatedSkus = [];
  for (const [sku, v] of Object.entries(LEGACY_NETWORK)) {
    if (mbps[sku] == null) {
      mbps[sku] = v;
      estimatedSkus.push(sku);
    }
  }
  estimatedSkus.sort();

  const skuCount = Object.keys(mbps).length;
  noTable.sort();
  await writeFile(
    join(OUT_DIR, '_network.json'),
    JSON.stringify(
      {
        provider: 'azure',
        source: `github.com/${REPO} (docs)`,
        generatedAt: new Date().toISOString(),
        // Series with no structured per-size bandwidth table in the docs (mostly
        // older GPU / confidential families). These fall back to the doc-estimate
        // in src/data/*Seed.ts — recorded here so the gap is never silent.
        seriesWithoutTable: noTable,
        // SKUs whose Mbps came from the curated LEGACY_NETWORK fallback (not the
        // live scrape) — transcribed from previous-gen docs, tagged so the UI
        // can show "(est.)". source 'curated-fallback'.
        estimatedSkus,
        estimatedSource: 'curated-fallback',
        mbps,
      },
      null,
      0,
    ),
  );
  console.log(`✓ ${files.length - noTable.length}/${files.length} files had a network table`);
  console.log(`✓ Scraped ${scrapedCount} SKUs; +${estimatedSkus.length} from curated legacy fallback`);
  console.log(`✓ Wrote ${skuCount} SKU network ceilings → public/rates/azure/_network.json`);
  console.log(`  ${noTable.length} series have no doc table (fall back to seed estimate):`);
  console.log('   ' + noTable.join(', '));
}

main().catch((e) => {
  console.error('\nNetwork ingestion failed:', e.message);
  process.exit(1);
});

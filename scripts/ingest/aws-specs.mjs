#!/usr/bin/env node
// AWS EC2 spec + network-bandwidth ingestion — KEYLESS, from the public Price
// List Bulk API product attributes, UNIONED across a strategic set of regions.
//
// Mirrors the Azure pair (azure-specs.mjs + azure-network.mjs) but in ONE script,
// because AWS publishes specs AND network performance in the SAME product
// attributes — no separate doc-scrape needed (unlike Azure, where Mbps lives only
// in the docs). We emit TWO files to keep the Azure output contract:
//   public/rates/aws/_specs.json   — { provider, source, generatedAt, specs }
//   public/rates/aws/_network.json — { provider, source, generatedAt, mbps, ... }
//
// === Why a multi-region UNION (not just us-east-1) ===
// Specs are region-INDEPENDENT (an m7i.xlarge is 4 vCPU / 16 GiB everywhere), but
// the SET of instance types OFFERED differs per region: newer families launch in a
// subset of regions first; GovCloud + China partitions carry partition-exclusive
// types; some legacy families only survive in their original region. us-east-1 is
// the widest single universe, but it is NOT the whole universe. We therefore union
// the instanceType sets across a DIVERSE ~12-region spread (commercial across every
// geo + GovCloud + China) — that captures essentially the entire commercial + gov +
// china catalog without fetching all 105 regions (each offer file is hundreds of MB).
//   Commercial: us-east-1 us-west-2 eu-west-1 eu-central-1 ap-southeast-1
//               ap-northeast-1 sa-east-1 ca-central-1 ap-south-1 me-central-1
//   GovCloud:   us-gov-west-1 us-gov-east-1
//   China:      cn-north-1 cn-northwest-1   (separate keyless Bulk endpoint, .com.cn)
// For each instanceType the FIRST region that carries it wins the spec row (specs
// are identical across regions + across the OS/tenancy/term variants within a CSV).
// Each type records `firstSeenRegion`; types absent from us-east-1 are reported.
//
// === KEYLESS, streamed ===
// The Bulk API is public/anonymous (no SigV4, no IAM keys) — unlike the Price List
// *Query* API (GetProducts) which needs signed requests. Per-region offer files are
// huge (JSON ~400 MB–1 GB; CSV ~270 MB row-per-rate). We STREAM the CSV line by
// line and keep only the product attributes we need — memory stays in the tens of
// KB regardless of the 270 MB on the wire. No multi-hundred-MB string is ever held.
//
// Attributes used per instance type (first product row per instanceType — specs are
// identical across the OS/tenancy/term variants):
//   Instance Type        "m7i.xlarge"
//   vCPU                 "4"                       → vcpus
//   Memory               "16 GiB"                  → memoryGib
//   Network Performance  "Up to 12500 Megabit"     → networkMbps (see mapping below)
//   GPU                  "8" (absent on non-GPU)   → gpus
//   Storage              "2 x 1900 NVMe SSD"/"EBS only" → localStorage (raw string)
//   Physical Processor, Clock Speed, Instance Family, Current Generation → metadata
//
// networkPerformance → Mbps mapping:
//   "X Gigabit"        → X * 1000
//   "X Megabit"        → X
//   "Up to X Gigabit"  → X * 1000   (a CEILING, like Azure's "Max bandwidth";
//   "Up to X Megabit"  → X           flagged per-SKU via _network.json.ceilingTypes[])
//   decimals handled   ("Up to 12.5 Gigabit" → 12500)
//   "NA" / missing     → null
//   Textual (legacy older generations — m1/m2/m3/m4/c1/c3/c4/d2/g2/i2/r3/t1/t2/x1/p2):
//     "Very Low"=100 · "Low"=250 · "Low to Moderate"=300 · "Moderate"=500 ·
//     "High"=1000  — DOCUMENTED ESTIMATES (AWS never published an exact Mbps for
//     these). Each is recorded in _network.json.textualGaps[] (sku → label) so the
//     gap is explicit. The numeric mbps is a flagged estimate, NOT a measured ceiling.
//
// Usage:  node scripts/ingest/aws-specs.mjs
//         node scripts/ingest/aws-specs.mjs us-east-1 eu-west-1   # override region set

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'aws');

// Commercial Bulk API (the "aws" partition index).
const COMMERCIAL_HOST = 'https://pricing.us-east-1.amazonaws.com';
const COMMERCIAL_INDEX = `${COMMERCIAL_HOST}/offers/v1.0/aws/AmazonEC2/current/region_index.json`;
// China Bulk API — separate keyless endpoint (.com.cn, "cn" partition). Captures
// cn-north-1 / cn-northwest-1 which the commercial index does not list.
const CHINA_HOST = 'https://pricing.cn-north-1.amazonaws.com.cn';
const CHINA_INDEX = `${CHINA_HOST}/offers/v1.0/cn/AmazonEC2/current/region_index.json`;

// Strategic, diverse union — every commercial geo + GovCloud + China. The first
// region listed (us-east-1) is treated as the "baseline" so region-exclusive types
// (present in the union but NOT in us-east-1) can be reported.
const DEFAULT_REGIONS = [
  'us-east-1', // baseline / widest single universe — keep FIRST
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'sa-east-1',
  'ca-central-1',
  'ap-south-1',
  'me-central-1',
  'us-gov-west-1',
  'us-gov-east-1',
  'cn-north-1',
  'cn-northwest-1',
];
const BASELINE_REGION = 'us-east-1';

const REGIONS = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_REGIONS;

/** Documented Mbps estimates for the legacy textual ratings (no exact value published). */
const TEXTUAL_MBPS = { 'very low': 100, low: 250, 'low to moderate': 300, moderate: 500, high: 1000 };

/**
 * Parse a networkPerformance attribute → { mbps, ceiling, textual }.
 *   numeric "X Gigabit/Megabit" (with optional "Up to" ceiling, decimals) → exact Mbps
 *   textual "Low/Moderate/High/…" → documented ESTIMATE (textual:true)
 *   "NA"/blank → null
 */
function parseNetworkMbps(raw) {
  if (!raw || raw === 'NA') return { mbps: null, ceiling: false, textual: false };
  const s = String(raw).trim();
  const ceiling = /^up to/i.test(s);
  const m = s.match(/([\d.]+)\s*(Gigabit|Megabit|Gbps|Mbps)/i);
  if (m) {
    const val = parseFloat(m[1]);
    const giga = /^g/i.test(m[2]);
    return { mbps: giga ? Math.round(val * 1000) : Math.round(val), ceiling, textual: false };
  }
  const key = s.toLowerCase();
  if (key in TEXTUAL_MBPS) return { mbps: TEXTUAL_MBPS[key], ceiling: false, textual: true };
  return { mbps: null, ceiling: false, textual: false };
}

const numFrom = (v) => {
  if (v == null || v === 'NA' || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
// "16 GiB" / "1,152 GiB" → 16 / 1152
const memGib = (v) => {
  if (!v || v === 'NA') return null;
  const m = String(v).replace(/,/g, '').match(/([\d.]+)\s*GiB/i);
  return m ? Number(m[1]) : null;
};

/** Parse one CSV line into fields, honoring "quoted, commas". */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
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

/**
 * Stream a region's index.csv and return Map<instanceType, attributes-row>.
 * Keeps only the FIRST product row per instanceType (specs are identical across the
 * OS/tenancy/term variants). Memory footprint stays tiny — one row per type.
 */
async function fetchRegionSpecs(host, currentVersionUrl, regionCode) {
  const csvUrl = `${host}${currentVersionUrl.replace(/index\.json$/, 'index.csv')}`;
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`CSV ${res.status} for ${regionCode}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let idx = null; // column-name → position, filled from the "SKU" header row
  const rows = new Map();
  let bytes = 0;
  let lineCount = 0;

  const want = [
    'Instance Type', 'vCPU', 'Memory', 'Network Performance', 'GPU', 'Storage',
    'GPU Memory', 'Physical Processor', 'Clock Speed', 'Instance Family', 'Current Generation',
  ];

  const handle = (line) => {
    if (!line) return;
    if (idx == null) {
      const fields = parseCsvLine(line);
      if (fields[0] === 'SKU') {
        idx = {};
        for (const w of want) idx[w] = fields.indexOf(w);
      }
      return;
    }
    const f = parseCsvLine(line);
    const it = f[idx['Instance Type']];
    if (!it || rows.has(it)) return;
    const vcpu = f[idx['vCPU']];
    const memory = f[idx['Memory']];
    if (vcpu == null || vcpu === '' || vcpu === 'NA') return; // bare-family aggregate rows
    if (memory == null || memory === '' || memory === 'NA') return;
    rows.set(it, {
      vcpu,
      memory,
      networkPerformance: f[idx['Network Performance']] || null,
      gpu: f[idx['GPU']] || null,
      gpuMemory: f[idx['GPU Memory']] || null,
      storage: f[idx['Storage']] || null,
      physicalProcessor: f[idx['Physical Processor']] || null,
      clockSpeed: f[idx['Clock Speed']] || null,
      instanceFamily: f[idx['Instance Family']] || null,
      currentGeneration: f[idx['Current Generation']] || null,
    });
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
      handle(line);
      if (++lineCount % 250000 === 0) {
        process.stdout.write(`\r  ${regionCode}: …${(bytes / 1e6).toFixed(0)} MB, ${rows.size} types`);
      }
    }
  }
  handle(buf.replace(/\r$/, ''));
  return rows;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('Fetching region indexes (commercial + china)…');
  const [commercialIdx, chinaIdx] = await Promise.all([
    fetch(COMMERCIAL_INDEX).then((r) => (r.ok ? r.json() : { regions: {} })).catch(() => ({ regions: {} })),
    fetch(CHINA_INDEX).then((r) => (r.ok ? r.json() : { regions: {} })).catch(() => ({ regions: {} })),
  ]);

  // Resolve each requested region to { host, currentVersionUrl }. Commercial index
  // first; fall back to the China index (cn-* live only there).
  const resolved = [];
  for (const code of REGIONS) {
    if (commercialIdx.regions?.[code]) {
      resolved.push({ regionCode: code, host: COMMERCIAL_HOST, currentVersionUrl: commercialIdx.regions[code].currentVersionUrl });
    } else if (chinaIdx.regions?.[code]) {
      resolved.push({ regionCode: code, host: CHINA_HOST, currentVersionUrl: chinaIdx.regions[code].currentVersionUrl });
    } else {
      console.warn(`  (region not found in either Bulk index, skipped: ${code})`);
    }
  }
  console.log(`Unioning instance types across ${resolved.length} region(s).\n`);

  // attributesByType: instanceType → { ...row, firstSeenRegion }
  const attributesByType = new Map();
  const regionsByType = new Map(); // instanceType → Set<region> (for diagnostics)
  const perRegionCounts = [];

  for (const { regionCode, host, currentVersionUrl } of resolved) {
    console.log(`→ ${regionCode}`);
    try {
      const rows = await fetchRegionSpecs(host, currentVersionUrl, regionCode);
      let added = 0;
      for (const [it, row] of rows) {
        if (!regionsByType.has(it)) regionsByType.set(it, new Set());
        regionsByType.get(it).add(regionCode);
        if (!attributesByType.has(it)) {
          attributesByType.set(it, { ...row, firstSeenRegion: regionCode });
          added++;
        }
      }
      perRegionCounts.push({ region: regionCode, typesInRegion: rows.size, newTypes: added });
      console.log(`\r  ${regionCode}: ${rows.size} types (${added} new to the union) ✓            `);
    } catch (e) {
      console.error(`\r  ${regionCode}: FAILED — ${e.message}`);
      perRegionCounts.push({ region: regionCode, error: e.message });
    }
  }

  // Build the output specs map.
  const specs = {};
  const mbpsMap = {};
  const ceilingTypes = [];
  const textualGaps = {};

  for (const [it, a] of attributesByType) {
    const vcpus = numFrom(a.vcpu);
    const memoryGib = memGib(a.memory);
    if (vcpus == null || memoryGib == null) continue;
    const net = parseNetworkMbps(a.networkPerformance);
    const gpus = numFrom(a.gpu);
    specs[it] = {
      vcpus,
      memoryGib,
      networkMbps: net.mbps,
      networkPerformanceRaw: a.networkPerformance ?? null,
      gpus: gpus || null,
      gpuMemoryGib: a.gpuMemory && a.gpuMemory !== 'NA' ? a.gpuMemory : null,
      localStorage: a.storage && a.storage !== 'NA' ? a.storage : null,
      physicalProcessor: a.physicalProcessor ?? null,
      clockSpeed: a.clockSpeed && a.clockSpeed !== 'NA' ? a.clockSpeed : null,
      category: a.instanceFamily ?? null,
      currentGeneration: a.currentGeneration === 'Yes',
      firstSeenRegion: a.firstSeenRegion,
    };
    if (net.mbps != null) {
      mbpsMap[it] = net.mbps;
      if (net.ceiling) ceilingTypes.push(it);
      if (net.textual) textualGaps[it] = String(a.networkPerformance).trim();
    }
  }

  // Region-exclusive types: present in the union but NOT in the baseline region.
  const baselineTypes = new Set(
    [...regionsByType.entries()].filter(([, regs]) => regs.has(BASELINE_REGION)).map(([it]) => it),
  );
  const exclusiveToOtherRegions = Object.keys(specs)
    .filter((it) => !baselineTypes.has(it))
    .map((it) => ({ instanceType: it, regions: [...regionsByType.get(it)].sort() }))
    .sort((a, b) => a.instanceType.localeCompare(b.instanceType));

  const typeCount = Object.keys(specs).length;
  const numericNet = Object.keys(mbpsMap).filter((it) => !(it in textualGaps)).length;
  const textualCount = Object.keys(textualGaps).length;
  const noNet = typeCount - numericNet - textualCount;
  ceilingTypes.sort();

  const source =
    `Price List Bulk API (keyless) — union of ${resolved.length} regions: ${resolved.map((r) => r.regionCode).join(', ')}`;

  await writeFile(
    join(OUT_DIR, '_specs.json'),
    JSON.stringify(
      {
        provider: 'aws',
        source,
        regions: resolved.map((r) => r.regionCode),
        baselineRegion: BASELINE_REGION,
        generatedAt: new Date().toISOString(),
        specs,
      },
      null,
      0,
    ),
  );
  await writeFile(
    join(OUT_DIR, '_network.json'),
    JSON.stringify(
      {
        provider: 'aws',
        source,
        regions: resolved.map((r) => r.regionCode),
        generatedAt: new Date().toISOString(),
        note:
          'mbps values flagged in `ceilingTypes` are "Up to" ceilings (best-case, not guaranteed). ' +
          'Instance types in `textualGaps` had only a textual rating (Low/Moderate/High) in the AWS ' +
          'data — their mbps is a DOCUMENTED ESTIMATE, not a measured value. Specs are unioned across ' +
          'a strategic multi-region set so region-exclusive (incl. GovCloud + China) types are covered.',
        ceilingTypes,
        textualGaps,
        mbps: mbpsMap,
      },
      null,
      0,
    ),
  );

  console.log('');
  console.log(`✓ Wrote specs for ${typeCount} instance types → public/rates/aws/_specs.json`);
  console.log(`✓ Wrote ${Object.keys(mbpsMap).length} network values → public/rates/aws/_network.json`);
  console.log('');
  console.log('Network coverage:');
  console.log(`  ${numericNet} types with an exact numeric Mbps (${ceilingTypes.length} of them "Up to" ceilings)`);
  console.log(`  ${textualCount} types textual-only (Low/Moderate/High → estimated Mbps · the gaps)`);
  console.log(`  ${noNet} types with no network value at all`);
  console.log('');
  console.log(`Region union: ${typeCount} types total · ${exclusiveToOtherRegions.length} NOT present in ${BASELINE_REGION}`);
  if (exclusiveToOtherRegions.length) {
    console.log(`  region-exclusive sample: ${exclusiveToOtherRegions.slice(0, 12).map((e) => e.instanceType).join(', ')}`);
  }

  // Spot-check the anchor.
  const anchor = specs['m7i.xlarge'];
  if (anchor) {
    console.log('');
    console.log(
      `  spot-check m7i.xlarge → ${anchor.vcpus} vCPU · ${anchor.memoryGib} GiB · ` +
        `${anchor.networkMbps} Mbps (${anchor.networkPerformanceRaw})`,
    );
  }
}

main().catch((e) => {
  console.error('\nAWS spec ingestion failed:', e.message);
  process.exit(1);
});

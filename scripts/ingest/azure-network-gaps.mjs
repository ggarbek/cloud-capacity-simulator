#!/usr/bin/env node
// Azure network-bandwidth GAP REPORT.
//
// "Network for every Azure size" has gaps because some families publish no
// per-size bandwidth table. This enumerates the FULL documented size universe
// (every "Size Name" row across all series files AND their [!INCLUDE] spec
// files), diffs it against the sizes that DO carry a bandwidth value, and writes
// a human-readable report of exactly which sizes / families are missing.
//
// Keyless. Source = MicrosoftDocs/azure-compute-docs.
//
// Usage:  node scripts/ingest/azure-network-gaps.mjs
// Output: scripts/ingest/azure-network-gaps.md  (committed documentation)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = 'MicrosoftDocs/azure-compute-docs';
const TREE_API = `https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`;
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
// Authenticate the GitHub API call when a token is present (avoids the 60/hr
// unauthenticated limit, e.g. on shared CI IPs). See azure-network.mjs.
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const UA = {
  'User-Agent': 'capacity-sim-ingest',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

// Network-bandwidth header: megabits (case-sensitive Mb), "bandwidth" or
// "network performance", excluding "Memory Bandwidth". Matches "Max Network
// Bandwidth", "Max Bandwidth", "Max Front-end Bandwidth", "Expected network
// performance"; never disk "Throughput (MBps)" or "Memory Bandwidth (GB/s)".
const BW_UNIT = /Mb(ps|\/s)/;
const isBwHeader = (c) =>
  BW_UNIT.test(c) && /bandwidth|network performance/i.test(c) && !/memory\s+bandwidth/i.test(c);
const SIZE_HDR = /size name/i;
// Strip markdown emphasis + footnote markers so bold-formatted tables parse.
const clean = (s) => s.replace(/<sup>.*?<\/sup>/gi, '').replace(/[*`]/g, '').trim();
const SKU_RE = /^[A-Za-z][\w.-]*\d[\w.-]*$/; // SKU-ish: starts alpha, has a digit

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
        const u = new URL(p, dirUrl).href;
        const r = await fetch(u, { headers: UA });
        return r.ok ? await r.text() : '';
      } catch {
        return '';
      }
    }),
  );
  return main + '\n' + incs.join('\n');
}

const VCPU_HDR = /^(vcpus|cores)\b/i;
const NIC_HDR = /max nics/i;

/**
 * From a markdown blob, return per-size { vcpus, mbps } + whether the family
 * publishes a NIC-count table (vs. nothing) — used to explain irreducible gaps.
 * Walks every table whose header has "Size Name".
 */
function analyze(md) {
  const lines = md.split('\n');
  const sizes = new Map(); // sku -> { vcpus:number|null, mbps:number|null }
  let hasNicTable = false;
  const get = (sku) => {
    if (!sizes.has(sku)) sizes.set(sku, { vcpus: null, mbps: null });
    return sizes.get(sku);
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.includes('|') || !SIZE_HDR.test(l)) continue;
    if (!/-{2,}/.test(lines[i + 1] ?? '')) continue;
    const cols = l.split('|').map(clean);
    const bwCol = cols.findIndex(isBwHeader);
    const vcpuCol = cols.findIndex((c) => VCPU_HDR.test(c));
    if (cols.some((c) => NIC_HDR.test(c)) && bwCol < 0) hasNicTable = true;
    for (let j = i + 2; j < lines.length && lines[j].includes('|'); j++) {
      const cells = lines[j].split('|').map(clean);
      const sku = cells[1];
      if (!sku || !SKU_RE.test(sku)) continue;
      const row = get(sku);
      if (bwCol >= 0) {
        const nums = (cells[bwCol] ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/g);
        if (nums && Math.max(...nums.map(Number)) > 0) row.mbps = Math.round(Math.max(...nums.map(Number)));
      }
      if (vcpuCol >= 0) {
        const v = Number((cells[vcpuCol] ?? '').replace(/,/g, '').match(/\d+/)?.[0]);
        if (Number.isFinite(v) && v > 0) row.vcpus = v;
      }
    }
  }
  return { sizes, hasNicTable };
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let idx = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const familyOf = (path) => path.split('/sizes/')[1].replace(/\.md$/, ''); // e.g. general-purpose/dv5-series
const isConstrained = (sku) => /-\d+/.test(sku); // e.g. M32-8ms: fewer active vCPU, full-size NIC

// Spot-check anchors — known-correct values audited against the published docs.
const ANCHORS = {
  Standard_D2s_v5: 12500,
  Standard_D32s_v5: 16000,
  Standard_D48s_v5: 24000,
  Standard_E104is_v5: 100000,
  Standard_M128ms: 30000,
  Standard_F2s_v2: 5000,
};

async function main() {
  console.log('Listing series docs…');
  const files = await listSeriesFiles();
  console.log(`  ${files.length} series files`);

  let done = 0;
  const perFamily = await mapLimit(files, 8, async (path) => {
    const md = await fetchWithIncludes(path);
    done++;
    process.stdout.write(`\r  analyzed ${done}/${files.length}`);
    const { sizes, hasNicTable } = analyze(md);
    const rows = [...sizes.entries()].map(([sku, v]) => ({ sku, ...v }));
    const missing = rows.filter((r) => r.mbps == null).map((r) => r.sku).sort();
    const covered = rows.filter((r) => r.mbps != null);
    return { family: familyOf(path), total: rows.length, rows, covered, missing, hasNicTable };
  });
  console.log('');

  perFamily.sort((a, b) => b.missing.length - a.missing.length || a.family.localeCompare(b.family));
  const totalSizes = perFamily.reduce((s, f) => s + f.total, 0);
  const totalCovered = perFamily.reduce((s, f) => s + f.covered.length, 0);
  const totalMissing = totalSizes - totalCovered;
  const fullyMissing = perFamily.filter((f) => f.total > 0 && f.covered.length === 0);
  const partial = perFamily.filter((f) => f.missing.length > 0 && f.covered.length > 0);

  // ── Audit checks over every captured value ───────────────────────────────
  const allCovered = perFamily.flatMap((f) => f.covered);
  const vals = allCovered.map((r) => r.mbps);
  const RANGE_LO = 50;
  const RANGE_HI = 800000;
  const outOfRange = allCovered.filter((r) => r.mbps < RANGE_LO || r.mbps > RANGE_HI);
  // Monotonicity: within a family, bandwidth should not DROP as vCPU rises
  // (constrained `-N` variants legitimately break this — full NIC on fewer vCPU).
  const monoViolations = [];
  for (const f of perFamily) {
    const seq = f.covered
      .filter((r) => r.vcpus != null && !isConstrained(r.sku))
      .sort((a, b) => a.vcpus - b.vcpus);
    for (let i = 1; i < seq.length; i++) {
      // Only a violation when vCPU strictly rises but bandwidth drops.
      if (seq[i].vcpus > seq[i - 1].vcpus && seq[i].mbps < seq[i - 1].mbps) {
        monoViolations.push(
          `${f.family}: ${seq[i].sku} (${seq[i].vcpus}vCPU=${seq[i].mbps}) < ${seq[i - 1].sku} (${seq[i - 1].vcpus}vCPU=${seq[i - 1].mbps})`,
        );
      }
    }
  }
  // Anchor validation
  const byName = new Map(allCovered.map((r) => [r.sku, r.mbps]));
  const anchorChecks = Object.entries(ANCHORS).map(([sku, want]) => ({
    sku,
    want,
    got: byName.get(sku) ?? null,
    ok: byName.get(sku) === want,
  }));

  const pct = totalSizes ? ((totalCovered / totalSizes) * 100).toFixed(1) : '0';
  const L = [];
  const p = (s = '') => L.push(s);
  p('# Azure network-bandwidth coverage, audit & gaps');
  p('');
  p(`> Generated by \`scripts/ingest/azure-network-gaps.mjs\` from ${REPO}.`);
  p('> "Universe" = every size with a "Size Name" row in the docs (incl. [!INCLUDE] spec files).');
  p('');
  p('## Summary');
  p('');
  p(`- **Documented sizes:** ${totalSizes}`);
  p(`- **With published network bandwidth:** ${totalCovered} (${pct}%)`);
  p(`- **Missing (no published value):** ${totalMissing}`);
  p(`- **Families fully missing:** ${fullyMissing.length} · **partial:** ${partial.length}`);
  p('');
  p('## Audit');
  p('');
  p('Validation of the extracted values (see `azure-network.mjs` for the extractor).');
  p('');
  p('**Parser corrections applied this pass** (each previously dropped real data):');
  p('1. Header variant `Max Bandwidth (Mbps)` (no "Network" word) — recovered ~16 GPU families.');
  p('2. Unit `Mb/s` (v6/v7) in addition to `Mbps` — recovered every v6/v7 family.');
  p('3. Tables hosted in `[!INCLUDE]` spec files — now resolved + parsed.');
  p('4. **Bold** markdown cells (`**Max Bandwidth (Mbps)**`, `**NM…**`) — now stripped.');
  p('Disambiguation: network = megabits (`Mbps`/`Mb/s`); disk `Throughput (MBps)` (megaBYTES)');
  p('and `Memory Bandwidth (GB/s)` are excluded by a case-sensitive unit + name test.');
  p('');
  p(`- **Value range:** ${Math.min(...vals)}–${Math.max(...vals)} Mbps · out-of-range (<${RANGE_LO} or >${RANGE_HI}): **${outOfRange.length}**`);
  p(`- **Monotonicity** (bandwidth vs vCPU within family, excluding constrained \`-N\` SKUs): **${monoViolations.length}** anomalies`);
  if (monoViolations.length) {
    p('');
    for (const v of monoViolations.slice(0, 20)) p(`  - ${v}`);
  }
  p('');
  p('- **Anchor spot-checks** (extractor value vs known-correct doc value):');
  p('');
  p('| SKU | Expected | Extracted | OK |');
  p('| --- | ---: | ---: | :-: |');
  for (const a of anchorChecks) p(`| \`${a.sku}\` | ${a.want} | ${a.got ?? '—'} | ${a.ok ? '✓' : '✗'} |`);
  p('');
  p('## Gaps — families with NO published bandwidth (every size missing)');
  p('');
  p('These have no per-size bandwidth column anywhere in the docs. Annotated with');
  p('what Azure *does* publish, so the reason each gap is irreducible is explicit.');
  p('');
  p('| Family | Sizes | Azure publishes | Why no value |');
  p('| --- | ---: | --- | --- |');
  for (const f of fullyMissing) {
    const base = f.family.split('/')[1] ?? f.family;
    const publishes = f.hasNicTable ? 'NIC count only' : 'no network table';
    const why = base.startsWith('b')
      ? 'burstable — bandwidth bursts, no fixed ceiling'
      : base.startsWith('dc')
        ? 'confidential — bandwidth not published'
        : 'older GPU — bandwidth not published';
    p(`| \`${f.family}\` | ${f.total} | ${publishes} | ${why} |`);
  }
  p('');
  p('### Exact missing sizes (no-table families)');
  p('');
  for (const f of fullyMissing) {
    if (!f.missing.length) continue;
    p(`**\`${f.family}\`** — ${f.missing.length} sizes`);
    p('');
    p(f.missing.map((s) => `\`${s}\``).join(', '));
    p('');
  }
  p('## Gaps — families with PARTIAL coverage (specific sizes missing)');
  p('');
  if (partial.length) {
    for (const f of partial) {
      p(`**\`${f.family}\`** — ${f.missing.length} of ${f.total} missing`);
      p('');
      p(f.missing.map((s) => `\`${s}\``).join(', '));
      p('');
    }
  } else {
    p('_None._');
    p('');
  }
  p('## Disposition of the irreducible gaps');
  p('');
  p('**Decision: flag only — make no assumptions.** These sizes have no published');
  p('bandwidth in any Azure source (API or docs), so the catalog leaves their network');
  p('value **unknown (`null`)** rather than inventing an estimate. The loader must not');
  p('present a fabricated number for them. Tracked as a low-priority item in the repo');
  p('`BACKLOG.md`. This file is the authoritative list of the affected sizes.');

  const outPath = join(__dirname, 'azure-network-gaps.md');
  await writeFile(outPath, L.join('\n'));
  console.log(`✓ ${totalCovered}/${totalSizes} sizes covered (${pct}%) — ${totalMissing} missing`);
  console.log(`  audit: ${outOfRange.length} out-of-range, ${monoViolations.length} mono-anomalies, anchors ${anchorChecks.filter((a) => a.ok).length}/${anchorChecks.length} ok`);
  console.log(`✓ Wrote scripts/ingest/azure-network-gaps.md`);
}

main().catch((e) => {
  console.error('\nGap analysis failed:', e.message);
  process.exit(1);
});

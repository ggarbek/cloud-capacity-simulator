#!/usr/bin/env node
// AWS EC2 instance-type coverage, AUDIT & gap report.
//
// Reads the multi-region-unioned spec output (aws-specs.mjs writes these):
//   public/rates/aws/_specs.json    — vCPU/memory/network/gpu/storage per type
//   public/rates/aws/_network.json  — mbps map + ceilingTypes + textualGaps
// and writes a human-readable report:
//   scripts/ingest/aws-coverage.md  — committed documentation
//
// Mirrors scripts/ingest/azure-network-gaps.md to the same bar:
//   - Summary: total types, # with vCPU+memory specs, # numeric network Mbps (%),
//     # textual-only, # no-value.
//   - Audit: anchor spot-checks vs known AWS-doc values (pass/fail), value-range
//     sanity, per-family vCPU→memory ratio sanity.
//   - Gaps: the exact types with NO numeric network — the legacy textual-only
//     families + the mac*.metal no-value set — grouped by family, every type listed.
//   - Region: the instance types found in the union that us-east-1 does NOT carry
//     (the whole point of the multi-region union).
//   - Disposition: FLAG, do not fabricate (same decision as Azure; in BACKLOG.md).
//
// Keyless: this script does NO network I/O — it audits the already-ingested JSON.
// Run `node scripts/ingest/aws-specs.mjs` first to (re)generate the inputs.
//
// Usage:  node scripts/ingest/aws-coverage.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RATES_DIR = join(__dirname, '..', '..', 'public', 'rates', 'aws');

// instanceType "m7i.16xlarge" → family "m7i"
const familyOf = (it) => it.split('.')[0];

// Anchor spot-checks — known-correct values from the AWS instance-type docs. vCPU +
// memory are exact; the network ceiling is the published "Up to" figure where the
// family advertises a ceiling (we record what the Bulk API returns and compare).
// vCPU + memory are exact from the AWS docs; networkMbps is the published "Up to"
// ceiling in Megabit. The last entry is a legacy textual-only type — we expect a
// flagged estimate, so its check passes when the type carries the estimated value
// AND is present in textualGaps (verified below).
const ANCHORS = [
  { it: 'm7i.xlarge', vcpus: 4, memoryGib: 16, networkMbps: 12500 },
  { it: 'c7g.xlarge', vcpus: 4, memoryGib: 8, networkMbps: 12500 },
  { it: 'r7i.2xlarge', vcpus: 8, memoryGib: 64, networkMbps: 12500 },
  { it: 'm7i.16xlarge', vcpus: 64, memoryGib: 256, networkMbps: 25000 },
  { it: 'c6g.medium', vcpus: 1, memoryGib: 2, networkMbps: 10000 }, // "Up to 10 Gigabit"
  { it: 'm5.large', vcpus: 2, memoryGib: 8, networkMbps: 10000 }, // "Up to 10 Gigabit"
  { it: 'c7gn.xlarge', vcpus: 4, memoryGib: 8, networkMbps: 40000 }, // "Up to 40 Gigabit"
  { it: 't2.micro', vcpus: 1, memoryGib: 1, networkMbps: 300, textual: true }, // legacy "Low to Moderate" → 300 estimate
];

async function main() {
  const specsDoc = JSON.parse(await readFile(join(RATES_DIR, '_specs.json'), 'utf8'));
  const netDoc = JSON.parse(await readFile(join(RATES_DIR, '_network.json'), 'utf8'));
  const specs = specsDoc.specs ?? {};
  const textualGaps = netDoc.textualGaps ?? {};
  const ceilingTypes = new Set(netDoc.ceilingTypes ?? []);
  const mbps = netDoc.mbps ?? {};

  const allTypes = Object.keys(specs).sort();
  const total = allTypes.length;

  // Coverage buckets.
  const withSpecs = allTypes.filter((it) => specs[it].vcpus != null && specs[it].memoryGib != null);
  const numericNet = allTypes.filter((it) => specs[it].networkMbps != null && !(it in textualGaps));
  const textualOnly = Object.keys(textualGaps).sort();
  // No value at all = no mbps published of any kind (textual types DO carry an
  // estimated mbps, so they are NOT in this set; the mac*.metal types are).
  const noValue = allTypes.filter((it) => specs[it].networkMbps == null && !(it in textualGaps));

  // ── Audit ────────────────────────────────────────────────────────────────
  // Anchor spot-checks.
  const anchorChecks = ANCHORS.map((a) => {
    const s = specs[a.it];
    const got = s ? { vcpus: s.vcpus, memoryGib: s.memoryGib, networkMbps: s.networkMbps } : null;
    const vcpuOk = got && got.vcpus === a.vcpus;
    const memOk = got && got.memoryGib === a.memoryGib;
    // Textual anchors must carry the estimated value AND be flagged in textualGaps.
    const netOk = a.textual
      ? got && got.networkMbps === a.networkMbps && a.it in textualGaps
      : a.networkMbps == null
        ? got != null
        : got && got.networkMbps === a.networkMbps;
    return { ...a, got, vcpuOk, memOk, netOk, present: got != null };
  });

  // Value-range sanity.
  // AWS's newest accelerator instances carry genuine multi-Tbps EFA networking
  // (p6-b300 = 6.4 Tbps, p5/p6 = 3.2 Tbps, g7e/trn1n = 1.6 Tbps), so the upper
  // bound is 8 Tbps — anything beyond that would be a parse error, not a real value.
  const RANGE_LO = 50;
  const RANGE_HI = 8_000_000;
  const netVals = numericNet.map((it) => specs[it].networkMbps);
  const outOfRange = numericNet.filter((it) => specs[it].networkMbps < RANGE_LO || specs[it].networkMbps > RANGE_HI);

  const vcpuVals = withSpecs.map((it) => specs[it].vcpus);
  const memVals = withSpecs.map((it) => specs[it].memoryGib);
  const badVcpu = withSpecs.filter((it) => !(specs[it].vcpus > 0 && specs[it].vcpus <= 1024));
  const badMem = withSpecs.filter((it) => !(specs[it].memoryGib > 0 && specs[it].memoryGib <= 65536));

  // Per-family vCPU→memory ratio sanity: within a family, GiB-per-vCPU should be
  // roughly constant (the family's memory class). A wild outlier (>3× the family
  // median ratio, or <1/3) is suspicious. Constrained/metal/accelerator rows can
  // legitimately differ, so this is reported, not failed.
  const byFamily = new Map();
  for (const it of withSpecs) {
    const fam = familyOf(it);
    if (!byFamily.has(fam)) byFamily.set(fam, []);
    byFamily.get(fam).push({ it, ratio: specs[it].memoryGib / specs[it].vcpus });
  }
  const ratioOutliers = [];
  for (const [fam, rows] of byFamily) {
    if (rows.length < 3) continue;
    const ratios = rows.map((r) => r.ratio).sort((a, b) => a - b);
    const med = ratios[Math.floor(ratios.length / 2)];
    if (!(med > 0)) continue;
    for (const r of rows) {
      if (r.ratio > med * 3.2 || r.ratio < med / 3.2) {
        ratioOutliers.push({ fam, it: r.it, ratio: r.ratio.toFixed(2), median: med.toFixed(2) });
      }
    }
  }

  // ── Gaps grouped by family ────────────────────────────────────────────────
  const groupByFamily = (types) => {
    const m = new Map();
    for (const it of types) {
      const fam = familyOf(it);
      if (!m.has(fam)) m.set(fam, []);
      m.get(fam).push(it);
    }
    return [...m.entries()]
      .map(([fam, list]) => ({ fam, list: list.sort() }))
      .sort((a, b) => b.list.length - a.list.length || a.fam.localeCompare(b.fam));
  };
  const textualByFamily = groupByFamily(textualOnly);
  const noValueByFamily = groupByFamily(noValue);

  // ── Region-exclusive types (not in the baseline region) ───────────────────
  const baselineRegion = specsDoc.baselineRegion ?? 'us-east-1';
  const exclusive = allTypes
    .filter((it) => specs[it].firstSeenRegion && specs[it].firstSeenRegion !== baselineRegion)
    .map((it) => ({ it, region: specs[it].firstSeenRegion }))
    .sort((a, b) => a.it.localeCompare(b.it));
  const exclusiveByRegion = new Map();
  for (const { it, region } of exclusive) {
    if (!exclusiveByRegion.has(region)) exclusiveByRegion.set(region, []);
    exclusiveByRegion.get(region).push(it);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const pct = (n) => (total ? ((n / total) * 100).toFixed(1) : '0');
  const L = [];
  const p = (s = '') => L.push(s);

  p('# AWS EC2 instance-type coverage, audit & gaps');
  p('');
  p(`> Generated by \`scripts/ingest/aws-coverage.mjs\` from the multi-region-unioned`);
  p(`> \`public/rates/aws/_specs.json\` + \`_network.json\` (written by \`aws-specs.mjs\`).`);
  p(`> Source: ${specsDoc.source ?? 'Price List Bulk API (keyless)'}`);
  p('> "Universe" = every EC2 instance type carried by ANY region in the union.');
  p('');
  p('## Summary');
  p('');
  p(`- **Instance types (union):** ${total}`);
  p(`- **With vCPU + memory specs:** ${withSpecs.length} (${pct(withSpecs.length)}%)`);
  p(`- **With numeric network Mbps:** ${numericNet.length} (${pct(numericNet.length)}%) — ${ceilingTypes.size} are "Up to" ceilings`);
  p(`- **Textual-only network (estimated Mbps, flagged):** ${textualOnly.length} (${pct(textualOnly.length)}%)`);
  p(`- **No network value at all:** ${noValue.length} (${pct(noValue.length)}%)`);
  p(`- **Regions unioned:** ${(specsDoc.regions ?? []).length} — \`${(specsDoc.regions ?? []).join('`, `')}\``);
  p(`- **Types not present in \`${baselineRegion}\` (region-exclusive):** ${exclusive.length}`);
  p('');
  p('## Audit');
  p('');
  p('Validation of the ingested values (see `aws-specs.mjs` for the extractor).');
  p('');
  p('AWS publishes specs AND network performance in the same Bulk-API product');
  p('attributes, so there is no separate doc-scrape to corroborate — the audit instead');
  p('cross-checks a handful of anchors against the published AWS instance-type pages and');
  p('runs structural sanity over every captured value.');
  p('');
  p('### Anchor spot-checks (ingested value vs known AWS-doc value)');
  p('');
  p('| Instance type | vCPU (exp/got) | Mem GiB (exp/got) | Net Mbps (exp/got) | OK |');
  p('| --- | :-: | :-: | :-: | :-: |');
  for (const a of anchorChecks) {
    const g = a.got;
    const netExp = a.networkMbps == null ? 'present' : a.textual ? `${a.networkMbps} (est.)` : a.networkMbps;
    const allOk = a.present && a.vcpuOk && a.memOk && a.netOk;
    p(
      `| \`${a.it}\` | ${a.vcpus} / ${g ? g.vcpus : '—'} | ${a.memoryGib} / ${g ? g.memoryGib : '—'} | ` +
        `${netExp} / ${g ? (g.networkMbps ?? '—') : '—'} | ${allOk ? '✓' : '✗'} |`,
    );
  }
  const anchorsPass = anchorChecks.filter((a) => a.present && a.vcpuOk && a.memOk && a.netOk).length;
  p('');
  p(`Anchors passing: **${anchorsPass}/${anchorChecks.length}**.`);
  p('');
  p('### Value-range & structural sanity');
  p('');
  p(`- **Network Mbps range:** ${netVals.length ? Math.min(...netVals) : '—'}–${netVals.length ? Math.max(...netVals) : '—'} Mbps · out-of-range (<${RANGE_LO} or >${RANGE_HI}): **${outOfRange.length}**`);
  p(`- **vCPU range:** ${vcpuVals.length ? Math.min(...vcpuVals) : '—'}–${vcpuVals.length ? Math.max(...vcpuVals) : '—'} · implausible (≤0 or >1024): **${badVcpu.length}**`);
  p(`- **Memory range:** ${memVals.length ? Math.min(...memVals) : '—'}–${memVals.length ? Math.max(...memVals) : '—'} GiB · implausible (≤0 or >65536): **${badMem.length}**`);
  p(`- **Per-family vCPU→memory ratio outliers** (>3.2× from the family median GiB/vCPU): **${ratioOutliers.length}**`);
  if (ratioOutliers.length) {
    p('');
    for (const o of ratioOutliers.slice(0, 25)) {
      p(`  - \`${o.it}\` (${o.fam}): ${o.ratio} GiB/vCPU vs family median ${o.median}`);
    }
    if (ratioOutliers.length > 25) p(`  - …and ${ratioOutliers.length - 25} more`);
  }
  p('');
  p('## Gaps — instance types with NO numeric network value');
  p('');
  p('Two disjoint sets. Same disposition as Azure: **flag, do not fabricate.**');
  p('');
  p('### Textual-only legacy families (estimated Mbps, flagged)');
  p('');
  p('These previous-generation families publish only a textual rating');
  p('(Very Low / Low / Low to Moderate / Moderate / High) — AWS never published an exact');
  p('Mbps. The ingest records a DOCUMENTED ESTIMATE and flags each in');
  p('`_network.json.textualGaps`. The numeric value is an estimate, not a measured ceiling.');
  p('');
  p('| Family | Types | Rating(s) |');
  p('| --- | ---: | --- |');
  for (const { fam, list } of textualByFamily) {
    const labels = [...new Set(list.map((it) => textualGaps[it]))].sort().join(' · ');
    p(`| \`${fam}\` | ${list.length} | ${labels} |`);
  }
  p('');
  p('Exact types:');
  p('');
  for (const { fam, list } of textualByFamily) {
    p(`**\`${fam}\`** — ${list.length} types`);
    p('');
    p(list.map((s) => `\`${s}\``).join(', '));
    p('');
  }
  const trueNoValueByFamily = noValueByFamily.filter((g) => g.list.some((it) => !(it in textualGaps)));
  p('### No network value published at all');
  p('');
  p('These carry no network figure of any kind (neither numeric nor textual) in the');
  p('Bulk-API attributes. Left **unknown (`null`)** — no estimate.');
  p('');
  p('| Family | Types |');
  p('| --- | ---: |');
  for (const { fam, list } of trueNoValueByFamily) {
    const onlyNoVal = list.filter((it) => !(it in textualGaps));
    p(`| \`${fam}\` | ${onlyNoVal.length} |`);
  }
  p('');
  p('Exact types:');
  p('');
  for (const { fam, list } of trueNoValueByFamily) {
    const onlyNoVal = list.filter((it) => !(it in textualGaps));
    p(`**\`${fam}\`** — ${onlyNoVal.length} types`);
    p('');
    p(onlyNoVal.map((s) => `\`${s}\``).join(', '));
    p('');
  }
  p('## Region coverage — types the union caught that the baseline missed');
  p('');
  p(`The union fetches a diverse multi-region set so region-exclusive types (newer`);
  p(`families launched outside \`${baselineRegion}\`, plus GovCloud + China partition`);
  p(`types) are captured. **${exclusive.length}** types are present in the union but NOT`);
  p(`in \`${baselineRegion}\`.`);
  p('');
  if (exclusive.length) {
    p('| First-seen region | Count | Types |');
    p('| --- | ---: | --- |');
    for (const [region, list] of [...exclusiveByRegion.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const shown = list.slice(0, 40).map((s) => `\`${s}\``).join(', ');
      p(`| \`${region}\` | ${list.length} | ${shown}${list.length > 40 ? `, …(+${list.length - 40})` : ''} |`);
    }
  } else {
    p('_None — the baseline region already carried every type in the union._');
  }
  p('');
  p('## Disposition of the irreducible gaps');
  p('');
  p('**Decision: flag only — make no assumptions.** The textual-only legacy types carry a');
  p('DOCUMENTED ESTIMATE (clearly flagged in `_network.json.textualGaps`), and the');
  p('no-value `mac*.metal` types are left `null`. AWS never published an exact Mbps for');
  p('either set, so the catalog must not present a fabricated number. Same decision as the');
  p('Azure network gaps. Tracked in the repo `BACKLOG.md`; this file is the authoritative');
  p('list of the affected types. Re-run `node scripts/ingest/aws-specs.mjs` then');
  p('`node scripts/ingest/aws-coverage.mjs` to refresh after an AWS catalog change.');

  const outPath = join(__dirname, 'aws-coverage.md');
  await writeFile(outPath, L.join('\n') + '\n');

  console.log(`✓ ${total} instance types · ${numericNet.length} numeric net (${pct(numericNet.length)}%) · ${textualOnly.length} textual · ${noValue.length} no-value`);
  console.log(`  audit: anchors ${anchorsPass}/${anchorChecks.length} · ${outOfRange.length} out-of-range · ${badVcpu.length}+${badMem.length} implausible spec · ${ratioOutliers.length} ratio outliers`);
  console.log(`  region: ${exclusive.length} types not in ${baselineRegion}`);
  console.log(`✓ Wrote scripts/ingest/aws-coverage.md`);
}

main().catch((e) => {
  console.error('\nCoverage report failed:', e.message);
  process.exit(1);
});

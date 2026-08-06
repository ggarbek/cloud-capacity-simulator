/**
 * specShowdownMath — PURE row assembly for the S65 Spec Showdown hero table.
 *
 * The Showdown is an at-a-glance side-by-side: columns = clouds (base first),
 * rows = the spec dimensions that actually separate sizes (vCPU, memory, network,
 * local NVMe, processor, GPU) plus one $/mo anchor row. This module turns a set
 * of per-cloud CatalogEntry picks (plus their monthly cost + match%) into a plain
 * data model the React component renders — no JSX, no engine, fully unit-tested.
 *
 * Design points that the tests pin:
 *  - null-safety: a 0-network / missing-disk / no-GPU side yields a "—" cell, not
 *    a crash or a fake 0 that wins "best".
 *  - best-in-row: numeric rows know their direction (more-is-better for vCPU /
 *    memory / network / disk; LESS-is-better for $/mo). Ties → no single winner.
 *  - delta-vs-base: every numeric cell carries a signed % delta vs the base
 *    column, formatted "+25%" / "−12%" / "—" (base itself, or non-comparable).
 *  - marker propagation: network `(est.)` (networkEstimated) and processor
 *    `(assumed)` / host-dependent (processorSource !== 'vendor' / processorOptions)
 *    flow through to the cell so the UI can hedge honestly.
 */
import type { CatalogEntry } from '../../types';
import { worstCaveat, type MatchCaveat } from '../../utils/matchCaveats'; // S66-SPECS
import type { BomPortResult } from '../../utils/bomPort'; // S66-SPECS
// S66 FIX-A — the ONE picked-pair match-% kernel (see pairMatchPct below).
import {
  vmFeatures,
  vmDistance,
  matchPct,
  CONFIDENTIAL_PEER_PENALTY,
} from '../../utils/equivalence';
import { CROSS_CATEGORY_PENALTY } from '../../utils/crossCloudEquivalency';
import { isConfidentialCapable } from '../../utils/acceleratorSpecs';

// ── Column input ─────────────────────────────────────────────────────────────

/** One cloud's pick, as fed into the showdown. */
export interface ShowdownColumnInput {
  provider: string;
  vm: CatalogEntry;
  isBase: boolean;
  /** Monthly cost at the active pricing term (region-matched), or null. */
  monthlyUsd?: number | null;
  /** Similarity to the base (0..100). Base = 100; null when no score. */
  matchPct?: number | null;
}

// ── Row model ────────────────────────────────────────────────────────────────

export type ShowdownRowKey =
  | 'vcpu'
  | 'mem'
  | 'memPerVcpu'
  | 'net'
  | 'disk'
  | 'processor'
  | 'gpu'
  | 'cost';

/** A single cell within a showdown row. */
export interface ShowdownCell {
  provider: string;
  isBase: boolean;
  /** The formatted display value (already unit-suffixed), or "—" when absent. */
  display: string;
  /** The raw comparable number for best/delta math, or null when not comparable
   *  (text rows, or a numeric dimension the side doesn't report). */
  value: number | null;
  /** Signed % delta vs the base cell, pre-formatted ("+25%", "−12%"), or null
   *  for the base column itself / non-comparable cells. */
  deltaPct: string | null;
  /** True when this cell holds the best value in its row (only for numeric rows
   *  with a unique winner). */
  best: boolean;
  /** Honest hedge marker for this cell — "(est.)" for estimated network,
   *  "(assumed)" / "host-dependent" for non-vendor processors. Empty otherwise. */
  marker?: string;
}

export interface ShowdownRow {
  key: ShowdownRowKey;
  label: string;
  /** true = a larger value is better (vCPU/mem/net/disk); false = smaller is
   *  better ($/mo). Text rows are neither and set this to null. */
  moreIsBetter: boolean | null;
  cells: ShowdownCell[];
}

// ── Numeric helpers ──────────────────────────────────────────────────────────

/** Positive finite read, else null (0 / missing / NaN → "not reported"). */
export function pos(n: number | null | undefined): number | null {
  return typeof n === 'number' && isFinite(n) && n > 0 ? n : null;
}

/** Compact spec-value formatter. Network lifts to Gbps at ≥ 1000 Mbps. */
export function fmtSpec(n: number | null, unit: string): string {
  if (n == null) return '—';
  if (unit === 'Mbps') {
    const gbps = n / 1000;
    return `${gbps % 1 === 0 ? gbps.toFixed(0) : gbps.toFixed(1)} Gbps`;
  }
  if (unit === 'USD') {
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }
  let s: string;
  if (n >= 1000) s = Math.round(n).toLocaleString('en-US');
  else if (Number.isInteger(n)) s = String(n);
  else s = n.toFixed(n < 10 ? 2 : 1);
  return unit ? `${s} ${unit}` : s;
}

/** Signed percentage delta of `v` vs `base`, formatted ("+25%", "−12%", "0%").
 *  Returns null when either side is null or base is 0. Uses a real minus sign. */
export function fmtDelta(v: number | null, base: number | null): string | null {
  if (v == null || base == null || base === 0) return null;
  const pct = Math.round(((v - base) / base) * 100);
  if (pct === 0) return '0%';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct)}%`;
}

/** The processor hedge marker for a VM, honest about provenance:
 *  - processorOptions present → "host-dependent" (two silicon options).
 *  - processorSource === 'curated' | 'inferred' → "(assumed)" (a real guess).
 *  - processorSource === 'vendor' → "" (vendor-published, no marker).
 *  - processorSource ABSENT → "" (no marker). S65 (Fix 4): only the live-shard join
 *    stamps `processorSource`, so every seed / uploaded / fixture row leaves it
 *    undefined. Marking those "(assumed)" mislabeled the whole default catalog and
 *    contradicted specInsights (absent → treated as vendor-published, no marker).
 *    Absent provenance is now unmarked to match that doctrine. */
export function processorMarker(vm: CatalogEntry): string {
  if (vm.processorOptions && vm.processorOptions.length > 1) return 'host-dependent';
  if (vm.processorSource && vm.processorSource !== 'vendor') return '(assumed)';
  return '';
}

/**
 * S66 FIX-A — the ONE match-% kernel for a PICKED (base, vm) pair. The dock
 * (CompareTable), the Specs showdown columns and the export match map all used
 * to score the same pair through slightly different paths (different row
 * resolution, no VmDistanceOpts), so the same pairing read ≈93% on the dock
 * and 94% on Specs. Every picked-pair surface scores through here now.
 *
 * Opts mirror the ranked paths' ladder (crossCloudEquivalency):
 *  — same effective category → plain vmDistance (the hard gate passes);
 *  — Confidential base vs a confidential-CAPABLE peer → the confidential
 *    bridge penalty (CONFIDENTIAL_PEER_PENALTY, ~89% ceiling);
 *  — any other cross-category pair → CROSS_CATEGORY_PENALTY, so a picked
 *    cross-category analog reads as the same finite "closest alternative" %
 *    the ranked panel showed, not a misleading 0%.
 *
 * Returns null only when a side is missing (defensive) — a scored pair always
 * yields a finite 1–100.
 */
export function pairMatchPct(base: CatalogEntry, vm: CatalogEntry): number | null {
  if (!base || !vm) return null;
  const a = vmFeatures(base);
  const b = vmFeatures(vm);
  if (a.category === b.category) return matchPct(vmDistance(a, b));
  if (a.category === 'Confidential' && isConfidentialCapable(vm)) {
    return matchPct(vmDistance(a, b, { crossCategoryPenalty: CONFIDENTIAL_PEER_PENALTY }));
  }
  return matchPct(vmDistance(a, b, { crossCategoryPenalty: CROSS_CATEGORY_PENALTY }));
}

// ── Row assembly ─────────────────────────────────────────────────────────────

interface NumericRowSpec {
  key: ShowdownRowKey;
  label: string;
  unit: string;
  moreIsBetter: boolean;
  read: (col: ShowdownColumnInput) => number | null;
  /** est./assumed marker for a cell, if any. */
  marker?: (col: ShowdownColumnInput) => string;
}

function assembleNumericRow(cols: ShowdownColumnInput[], spec: NumericRowSpec): ShowdownRow {
  const base = cols.find((c) => c.isBase) ?? cols[0];
  const baseVal = base ? spec.read(base) : null;
  const values = cols.map((c) => spec.read(c));

  // Best cell: unique extreme in the requested direction, ignoring nulls.
  const comparable = values.filter((v): v is number => v != null);
  let bestVal: number | null = null;
  if (comparable.length > 0) {
    bestVal = spec.moreIsBetter ? Math.max(...comparable) : Math.min(...comparable);
    // Suppress the badge on a tie (more than one column holds the extreme).
    const winners = comparable.filter((v) => v === bestVal).length;
    if (winners > 1) bestVal = null;
  }

  const cells: ShowdownCell[] = cols.map((c, i) => {
    const v = values[i];
    return {
      provider: c.provider,
      isBase: c.isBase,
      display: spec.unit === 'USD' ? fmtSpec(v, 'USD') + '/mo' : fmtSpec(v, spec.unit),
      value: v,
      deltaPct: c.isBase ? null : fmtDelta(v, baseVal),
      best: bestVal != null && v === bestVal && v != null,
      marker: spec.marker ? spec.marker(c) : '',
    };
  });

  return { key: spec.key, label: spec.label, moreIsBetter: spec.moreIsBetter, cells };
}

/** A text row (processor / GPU) — no best, no delta, just display + marker. */
function assembleTextRow(
  cols: ShowdownColumnInput[],
  key: ShowdownRowKey,
  label: string,
  read: (vm: CatalogEntry) => string,
  marker?: (vm: CatalogEntry) => string,
): ShowdownRow {
  const cells: ShowdownCell[] = cols.map((c) => {
    const txt = read(c.vm).trim();
    return {
      provider: c.provider,
      isBase: c.isBase,
      display: txt || '—',
      value: null,
      deltaPct: null,
      best: false,
      marker: marker ? marker(c.vm) : '',
    };
  });
  return { key, label, moreIsBetter: null, cells };
}

/** True when any column reports a real accelerator (a GPU/accelerator SKU). */
export function anyHasGpu(cols: ShowdownColumnInput[]): boolean {
  return cols.some((c) => {
    const acc = (c.vm.acceleratorType ?? '').trim();
    return acc !== '' && acc.toLowerCase() !== 'none';
  });
}

/** True when any column carries a non-null monthly cost. */
export function anyHasCost(cols: ShowdownColumnInput[]): boolean {
  return cols.some((c) => pos(c.monthlyUsd) != null);
}

/**
 * PURE — assemble the full showdown row set for a set of per-cloud columns.
 * Rows conditional on data: memPerVcpu always (derived), network/disk always
 * shown (null → "—"), GPU only when any side has one, $/mo only when any side
 * has a cost. Column order is preserved (caller passes base first).
 */
export function buildShowdownRows(cols: ShowdownColumnInput[]): ShowdownRow[] {
  if (cols.length === 0) return [];
  const rows: ShowdownRow[] = [];

  rows.push(
    assembleNumericRow(cols, {
      key: 'vcpu',
      label: 'vCPU',
      unit: 'vCPU',
      moreIsBetter: true,
      read: (c) => pos(c.vm.vcpus),
    }),
  );
  rows.push(
    assembleNumericRow(cols, {
      key: 'mem',
      label: 'Memory',
      unit: 'GiB',
      moreIsBetter: true,
      read: (c) => pos(c.vm.memoryGib),
    }),
  );
  rows.push(
    assembleNumericRow(cols, {
      key: 'memPerVcpu',
      label: 'GiB / vCPU',
      unit: '',
      moreIsBetter: true,
      read: (c) => {
        const mem = pos(c.vm.memoryGib);
        const cpu = pos(c.vm.vcpus);
        return mem != null && cpu != null ? mem / cpu : null;
      },
    }),
  );
  rows.push(
    assembleNumericRow(cols, {
      key: 'net',
      label: 'Network',
      unit: 'Mbps',
      moreIsBetter: true,
      read: (c) => pos(c.vm.networkMbps),
      marker: (c) => (c.vm.networkEstimated && pos(c.vm.networkMbps) != null ? '(est.)' : ''),
    }),
  );
  rows.push(
    assembleNumericRow(cols, {
      key: 'disk',
      label: 'Local NVMe',
      unit: 'GiB',
      moreIsBetter: true,
      read: (c) => pos(c.vm.localDiskGib),
    }),
  );

  rows.push(
    assembleTextRow(
      cols,
      'processor',
      'Processor',
      (vm) => vm.processor ?? '',
      (vm) => processorMarker(vm),
    ),
  );

  if (anyHasGpu(cols)) {
    rows.push(
      assembleTextRow(cols, 'gpu', 'GPU', (vm) => {
        const acc = (vm.acceleratorType ?? '').trim();
        return acc && acc.toLowerCase() !== 'none' ? acc : '—';
      }),
    );
  }

  if (anyHasCost(cols)) {
    rows.push(
      assembleNumericRow(cols, {
        key: 'cost',
        label: '$/mo',
        unit: 'USD',
        moreIsBetter: false,
        read: (c) => pos(c.monthlyUsd),
      }),
    );
  }

  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// S66-SPECS — the spec ANSWER math. Pure sentence-model builders behind the
// Specs page's VerdictBand (section 1 of the frozen page grammar) in BOTH
// modes, plus the per-cloud portfolio insight strip for VM-BoM mode. No JSX —
// the page renders these models through the shared ui/ primitives.
// ═══════════════════════════════════════════════════════════════════════════

/** Canonical provider casing for tone/label lookups ('azure' → 'Azure').
 *  Unknown providers pass through trimmed — never throw, never invent. */
export function canonicalProvider(p: string | null | undefined): string {
  const k = (p ?? '').trim().toLowerCase();
  if (k === 'azure') return 'Azure';
  if (k === 'aws') return 'AWS';
  if (k === 'gcp') return 'GCP';
  return (p ?? '').trim();
}

// ── Comparison-mode verdict ──────────────────────────────────────────────────

/** One gain/give-up sentence fragment with its data point baked in. */
export interface SpecDeltaPoint {
  key: ShowdownRowKey;
  /** e.g. "+2× network (25 vs 12.5 Gbps)" / "−50% memory (16 vs 32 GiB)" /
   *  "no local NVMe (600 GiB on base)". */
  text: string;
  /** Relative magnitude for ordering (bigger = more important). */
  magnitude: number;
}

export interface SpecsVerdictModel {
  tone: 'action' | 'warn' | 'neutral';
  baseProvider: string;
  baseSku: string;
  /** The closest non-base equivalent (highest matchPct), or null when only the
   *  base is picked — the page skips the band then. */
  best: { provider: string; sku: string; matchPct: number | null } | null;
  /** What you GAIN moving base → best, biggest first. */
  gains: SpecDeltaPoint[];
  /** What you GIVE UP moving base → best, biggest first. */
  giveUps: SpecDeltaPoint[];
  /** Every non-base column for the dataStrip (match% + $/mo at the active term). */
  perCloud: { provider: string; sku: string; matchPct: number | null; monthlyUsd: number | null }[];
  /** Worst comparability caveat per non-base cloud (amber chips). */
  chips: { label: string; detail?: string }[];
}

interface VerdictDim {
  key: ShowdownRowKey;
  noun: string;
  unit: string;
  read: (vm: CatalogEntry) => number | null;
}

const VERDICT_DIMS: VerdictDim[] = [
  { key: 'vcpu', noun: 'vCPU', unit: 'vCPU', read: (vm) => pos(vm.vcpus) },
  { key: 'mem', noun: 'memory', unit: 'GiB', read: (vm) => pos(vm.memoryGib) },
  { key: 'net', noun: 'network', unit: 'Mbps', read: (vm) => pos(vm.networkMbps) },
  { key: 'disk', noun: 'local NVMe', unit: 'GiB', read: (vm) => pos(vm.localDiskGib) },
];

/** "2×" when clean, "2.5×" otherwise. */
function fmtRatio(r: number): string {
  const rounded = Math.round(r * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}×`;
}

/**
 * PURE — the Comparison-mode spec verdict: closest equivalent + what you gain /
 * give up with the actual data points. Deltas are computed ONLY between two
 * real values; a null side yields an honest "no X (Y on base)" / "adds X (Y)"
 * fragment, never a fabricated percentage.
 */
export function specsVerdict(
  cols: ShowdownColumnInput[],
  caveatsByProvider?: Partial<Record<string, MatchCaveat[]>>,
): SpecsVerdictModel | null {
  if (cols.length === 0) return null;
  const base = cols.find((c) => c.isBase) ?? cols[0];
  const others = cols.filter((c) => c !== base);

  const baseModel = {
    baseProvider: canonicalProvider(base.provider),
    baseSku: base.vm.vmSizeName,
  };
  if (others.length === 0) {
    return { tone: 'neutral', ...baseModel, best: null, gains: [], giveUps: [], perCloud: [], chips: [] };
  }

  // Closest equivalent = highest matchPct; columns without a score rank last.
  const best = [...others].sort(
    (a, b) => (b.matchPct ?? -1) - (a.matchPct ?? -1),
  )[0];

  const gains: SpecDeltaPoint[] = [];
  const giveUps: SpecDeltaPoint[] = [];
  for (const dim of VERDICT_DIMS) {
    const bv = dim.read(base.vm);
    const tv = dim.read(best.vm);
    if (bv == null && tv == null) continue;
    if (bv == null && tv != null) {
      gains.push({ key: dim.key, text: `adds ${dim.noun} (${fmtSpec(tv, dim.unit)})`, magnitude: 1 });
      continue;
    }
    if (bv != null && tv == null) {
      giveUps.push({
        key: dim.key,
        text: `no ${dim.noun} (${fmtSpec(bv, dim.unit)} on base)`,
        magnitude: 1,
      });
      continue;
    }
    if (bv == null || tv == null) continue;
    const pct = Math.round(((tv - bv) / bv) * 100);
    if (pct === 0) continue;
    const pair = `(${fmtSpec(tv, dim.unit)} vs ${fmtSpec(bv, dim.unit)})`;
    if (pct > 0) {
      const head = tv / bv >= 1.75 ? `+${fmtRatio(tv / bv)}` : `+${pct}%`;
      gains.push({ key: dim.key, text: `${head} ${dim.noun} ${pair}`, magnitude: Math.abs(pct) / 100 });
    } else {
      giveUps.push({ key: dim.key, text: `−${Math.abs(pct)}% ${dim.noun} ${pair}`, magnitude: Math.abs(pct) / 100 });
    }
  }
  gains.sort((a, b) => b.magnitude - a.magnitude);
  giveUps.sort((a, b) => b.magnitude - a.magnitude);

  const chips: { label: string; detail?: string }[] = [];
  for (const o of others) {
    const worst = worstCaveat(caveatsByProvider?.[canonicalProvider(o.provider)] ?? caveatsByProvider?.[o.provider] ?? []);
    if (worst) chips.push({ label: `${canonicalProvider(o.provider)} · ${worst.label}`, detail: worst.detail });
  }

  return {
    tone: best.matchPct != null && best.matchPct >= 70 ? 'action' : 'warn',
    ...baseModel,
    best: {
      provider: canonicalProvider(best.provider),
      sku: best.vm.vmSizeName,
      matchPct: best.matchPct ?? null,
    },
    gains,
    giveUps,
    perCloud: others.map((o) => ({
      provider: canonicalProvider(o.provider),
      sku: o.vm.vmSizeName,
      matchPct: o.matchPct ?? null,
      monthlyUsd: pos(o.monthlyUsd),
    })),
    chips,
  };
}

// ── VM-BoM-mode verdict + insight strip ──────────────────────────────────────

/** The "strong match" threshold. S66 FIX-A — aligned to `pctTone`'s green band
 *  (≥85) so the "N of M lines ≥85%" headline counts EXACTLY the lines the pills
 *  below it color green (was 90, which excluded green 85–89% pills). */
export const STRONG_MATCH_PCT = 85;

/** Per-cloud portfolio spec stats over the whole ported BoM. */
export interface BomCloudSpecStat {
  provider: string;
  totalLines: number;
  matchedLines: number;
  /** Lines whose match is ≥ STRONG_MATCH_PCT. */
  strongLines: number;
  /** Lines with NO equivalent on this cloud. */
  unmatchedLines: number;
  /** Quantity-weighted average matchPct (from the ported scenario), or null. */
  avgMatchPct: number | null;
  /** Whole-BoM $/mo on this cloud, or null when nothing priced. */
  monthlyTotalUsd: number | null;
  anyEstimated: boolean;
  /** Weakest MATCHED line on this cloud (lowest matchPct), or null. */
  weakest: { sku: string; baseSku: string; matchPct: number } | null;
}

/** PURE — per-target-cloud spec stats across every ported BoM line. */
export function bomCloudStats(ported: BomPortResult): BomCloudSpecStat[] {
  return ported.targetScenarios.map((s) => {
    let strong = 0;
    let matched = 0;
    let unmatched = 0;
    let anyPriced = false;
    let weakest: BomCloudSpecStat['weakest'] = null;
    for (const line of s.lines) {
      if (line.matchVmSizeName == null) {
        unmatched += 1;
        continue;
      }
      matched += 1;
      if (line.monthlyUsd != null) anyPriced = true;
      if (line.matchPct != null) {
        if (line.matchPct >= STRONG_MATCH_PCT) strong += 1;
        if (weakest == null || line.matchPct < weakest.matchPct) {
          weakest = {
            sku: line.matchVmSizeName,
            baseSku: line.baseVmSizeName,
            matchPct: line.matchPct,
          };
        }
      }
    }
    return {
      provider: canonicalProvider(s.provider),
      totalLines: s.lines.length,
      matchedLines: matched,
      strongLines: strong,
      unmatchedLines: unmatched,
      avgMatchPct: s.avgMatchPct,
      monthlyTotalUsd: anyPriced ? s.monthlyTotalUsd : null,
      anyEstimated: s.anyEstimated,
      weakest,
    };
  });
}

export interface BomSpecsVerdictModel {
  tone: 'action' | 'warn' | 'neutral';
  totalLines: number;
  /** The cloud with the most ≥STRONG_MATCH_PCT lines (tie → higher avg match),
   *  or null when the port has no target clouds. */
  best: BomCloudSpecStat | null;
  perCloud: BomCloudSpecStat[];
}

/**
 * PURE — the VM-BoM-mode spec verdict: which cloud carries the portfolio best
 * (most ≥STRONG_MATCH_PCT lines), how weak its weakest line is, per-cloud
 * qty-weighted avg match for the dataStrip. Warn tone when any line has no
 * equivalent on the best cloud or its portfolio average is under 70%.
 *
 * S66 FIX-A perf (additive `stats`): the page can pass the `bomCloudStats`
 * result it already computed so the per-line walk isn't repeated here.
 */
export function bomSpecsVerdict(
  ported: BomPortResult,
  stats?: BomCloudSpecStat[],
): BomSpecsVerdictModel | null {
  const totalLines = ported.baseScenario.lines.length;
  if (totalLines === 0) return null;
  const perCloud = stats ?? bomCloudStats(ported);
  if (perCloud.length === 0) {
    return { tone: 'neutral', totalLines, best: null, perCloud };
  }
  const best = [...perCloud].sort(
    (a, b) => b.strongLines - a.strongLines || (b.avgMatchPct ?? -1) - (a.avgMatchPct ?? -1),
  )[0];
  const warn =
    best.unmatchedLines > 0 || (best.avgMatchPct != null && best.avgMatchPct < 70) || best.matchedLines === 0;
  return { tone: warn ? 'warn' : 'action', totalLines, best, perCloud };
}

/** The strip's per-cloud line model. S66 FIX-A — this IS the canonical
 *  `ShowdownInsight` shape (SpecShowdown re-exports it, so the import direction
 *  is math → component-free). `standout` renders with a ★ and is reserved for
 *  the genuinely LEADING cloud(s) only (the "Best at, not Top pick" doctrine);
 *  a non-leader's stat goes in `note` (plain, no star). */
export interface ShowdownInsight {
  provider: string;
  displayName: string;
  /** ★-worthy situational-best line — leaders only. */
  standout?: string;
  /** Plain informational stat for non-leading clouds (rendered without ★). */
  note?: string;
  weakness?: string;
}

/**
 * PURE — the VM-BoM Stands-out / Trails-on strip: one line per target cloud
 * with the data point (strong-line count or avg match; weakest line or
 * no-equivalent count). Clouds with nothing to say are filtered by the strip.
 *
 * S66 FIX-A: only the genuinely leading cloud(s) carry `standout` (most
 * ≥STRONG_MATCH_PCT lines; when no cloud has one, highest qty-weighted avg
 * match). Every other cloud's stat is a plain `note` — a ★ on every column
 * crowned everyone and meant nothing. Additive `stats` param mirrors
 * `bomSpecsVerdict`'s (pass the page's memoized `bomCloudStats`).
 */
export function bomShowdownInsights(
  ported: BomPortResult,
  stats?: BomCloudSpecStat[],
): ShowdownInsight[] {
  const total = ported.baseScenario.lines.length;
  const perCloud = stats ?? bomCloudStats(ported);
  const maxStrong = perCloud.reduce((mx, s) => Math.max(mx, s.strongLines), 0);
  const maxAvg = perCloud.reduce(
    (mx, s) => (s.matchedLines > 0 && s.avgMatchPct != null ? Math.max(mx, s.avgMatchPct) : mx),
    -1,
  );
  const isLeader = (s: BomCloudSpecStat): boolean =>
    maxStrong > 0
      ? s.strongLines === maxStrong
      : s.matchedLines > 0 && s.avgMatchPct != null && s.avgMatchPct === maxAvg;
  return perCloud.map((s) => {
    const stat =
      s.strongLines > 0
        ? `${s.strongLines} of ${total} line${total === 1 ? '' : 's'} ≥${STRONG_MATCH_PCT}% match`
        : s.matchedLines > 0 && s.avgMatchPct != null
          ? `≈${Math.round(s.avgMatchPct)}% avg match across ${s.matchedLines} line${s.matchedLines === 1 ? '' : 's'}`
          : undefined;
    const weakness =
      s.unmatchedLines > 0
        ? `${s.unmatchedLines} line${s.unmatchedLines === 1 ? '' : 's'} with no equivalent`
        : s.weakest && s.weakest.matchPct < STRONG_MATCH_PCT
          ? `weakest: ${s.weakest.sku} ≈${Math.round(s.weakest.matchPct)}%`
          : undefined;
    const lead = isLeader(s);
    return {
      provider: s.provider,
      displayName: s.provider,
      standout: lead ? stat : undefined,
      note: lead ? undefined : stat,
      weakness,
    };
  });
}

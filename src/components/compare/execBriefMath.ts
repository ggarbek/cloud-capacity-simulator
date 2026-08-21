/**
 * execBriefMath — pure verdict/assumptions math for the Executive Summary brief
 * (S65 EXEC). Extracted so the dollar-quantified verdict, the KPI savings figure
 * and the assumptions footer are unit-tested independently of React.
 *
 * The exec brief prices at the user's active commitment `term` and reasons over
 * the SAME `HorizonCost[]` matrix the cost visual draws (so the headline number
 * and the chart never disagree). Everything here is null-safe: a cloud with no
 * published rate simply drops out of the "cheapest" race rather than poisoning
 * the comparison, and a base with no rate yields a null saving (never a fabricated
 * or divide-by-zero figure).
 */
import type { HorizonCost } from '../../engine/competitive';
import type { MatchCaveat } from '../../utils/matchCaveats';
import { isStretch, matchCaveats, worstCaveat } from '../../utils/matchCaveats';
import type { BomPortResult } from '../../utils/bomPort';
import type { BomEntry, CatalogEntry } from '../../types';
import { categorize, matchCategory } from '../../utils/vmCategory';
import { vmFamily } from '../../utils/vmTaxonomy';
// S65 — the cheapest/savings arithmetic lives in ONE place (buildVerdictQuant);
// this module delegates to it so the brief, the exports and the price bars all
// round savings the same way (0.1%). utils/export is importable from components.
import { buildVerdictQuant } from '../../utils/export/execNarratives';
// S66-EXEC — term labels come from the ONE shared token source; `termLabel` is
// kept as an alias so existing call sites and tests keep one import path.
import { termLabelLong } from './ui/tokens';

export type BriefTerm = 'payg' | '1y' | '3y';

/** Human label for a commitment term. Delegates to the shared ui/tokens
 *  formatter (S66) so the exec brief, Pricing and exports all phrase terms
 *  identically. */
export function termLabel(term: BriefTerm): string {
  return termLabelLong(term);
}

/** The monthly cost a HorizonCost row prices at, at the applied term. `oneMonthBest`
 *  already reflects the term selection (with a PAYG fallback baked in by the
 *  engine), so we read it directly. null when the SKU has no rate at all. */
export function monthlyAtTerm(h: HorizonCost): number | null {
  return h.oneMonthBest;
}

export interface VerdictResult {
  /** The provider with the lowest monthly cost among priced clouds. */
  cheapestProvider: string | null;
  /** That provider's SKU. */
  cheapestSku: string | null;
  /** Lowest monthly cost across priced clouds (at the active term). */
  cheapestMonthly: number | null;
  /** The base cloud's monthly cost (at the active term), for the delta. */
  baseMonthly: number | null;
  /** Absolute monthly saving vs the base (base − cheapest). null when either
   *  side is unpriced. Never negative here: if the base IS the cheapest the
   *  saving is 0. */
  savingMonthly: number | null;
  /** Percent below base (0.1% resolution, ≥0), null when base is unpriced or
   *  zero. Aligned to buildVerdictQuant's rounding (the shared arithmetic). */
  savingPct: number | null;
  /** True when the cheapest priced cloud IS the base cloud. */
  baseIsCheapest: boolean;
  /** S65 — true when a rival IS priced but the BASE cloud has no published rate
   *  at this term. In that case there is no base to save against, so the brief
   *  must NOT claim the base "is already the least-cost option" — it renders an
   *  amber "no published base rate; cheapest priced option is X" line instead. */
  baseUnpriced: boolean;
}

/**
 * Resolve the dollar-quantified verdict from the cost matrix at the active term.
 *
 * @param horizons the per-provider cost matrix (already region-matched + termed).
 * @param baseProvider the base cloud (its row is the savings denominator).
 */
export function computeVerdict(
  horizons: HorizonCost[],
  baseProvider: string,
): VerdictResult {
  const baseRow = horizons.find((h) => h.provider === baseProvider) ?? null;
  const rawBaseMonthly = baseRow ? monthlyAtTerm(baseRow) : null;
  const baseMonthly = rawBaseMonthly != null && rawBaseMonthly > 0 ? rawBaseMonthly : null;

  // Delegate the cheapest + savings arithmetic to the ONE shared implementation
  // (buildVerdictQuant): it filters to priced candidates, picks the cheapest, and
  // computes $ + % savings vs the base at 0.1% resolution. computeVerdict only
  // adds the brief-specific framing flags (baseIsCheapest / baseUnpriced) on top.
  const quant = buildVerdictQuant(
    horizons.map((h) => ({ provider: h.provider, sku: h.sku, monthlyUsd: monthlyAtTerm(h) })),
    baseMonthly,
    '',
  );

  if (quant == null) {
    return {
      cheapestProvider: null,
      cheapestSku: null,
      cheapestMonthly: null,
      baseMonthly,
      savingMonthly: null,
      savingPct: null,
      baseIsCheapest: false,
      // A rival can't be priced when nothing is priced, so this is never "unpriced base".
      baseUnpriced: false,
    };
  }

  const baseIsCheapest = quant.cheapestProvider === baseProvider;
  // A rival IS priced (quant resolved) but the base has no rate → unpriced base.
  const baseUnpriced = baseMonthly == null && !baseIsCheapest;

  // Savings: never negative, and 0 when the base itself is the cheapest.
  let savingMonthly: number | null = null;
  let savingPct: number | null = null;
  if (quant.savingsVsBaseUsd != null) {
    savingMonthly = Math.max(0, quant.savingsVsBaseUsd);
    savingPct = quant.savingsVsBasePct != null ? Math.max(0, quant.savingsVsBasePct) : null;
  }

  return {
    cheapestProvider: quant.cheapestProvider,
    cheapestSku: quant.cheapestSku || null,
    cheapestMonthly: quant.monthlyUsd,
    baseMonthly,
    savingMonthly,
    savingPct,
    baseIsCheapest,
    baseUnpriced,
  };
}

/**
 * The verdict's supporting-line phrasing gate: is the winning cross-cloud analog
 * a genuine like-for-like, or a stretch we must caveat? Reads the caveats of the
 * cheapest (non-base) provider. When the base itself is cheapest there is no
 * cross-cloud stretch to warn about.
 *
 * @returns 'parity' when clean, 'stretch' when the closest analog carries a
 *          stretch/category-fallback caveat, 'base' when the base wins.
 */
export function verdictParity(
  verdict: VerdictResult,
  baseProvider: string,
  caveatsByProvider: Partial<Record<string, MatchCaveat[]>>,
): 'parity' | 'stretch' | 'base' {
  if (verdict.baseIsCheapest || verdict.cheapestProvider === baseProvider) return 'base';
  const cs = caveatsByProvider[verdict.cheapestProvider ?? ''] ?? [];
  return isStretch(cs) ? 'stretch' : 'parity';
}

export interface AssumptionsResult {
  /** Distinct one-line assumption phrases, ordered most→least severe. */
  lines: string[];
  /** True when any assumption is in play (drives whether the footer renders). */
  any: boolean;
}

/**
 * Collect the active assumptions across the comparison for the amber footer:
 * estimated rates (a horizon priced at a fallback), and comparability caveats
 * (assumed processors, cross-category / stretch analogs). Deduped, capped, and
 * ordered so the footer stays a single scannable line.
 */
export function collectAssumptions(
  horizons: HorizonCost[],
  caveatsByProvider: Partial<Record<string, MatchCaveat[]>>,
  baseProvider: string,
  term: BriefTerm,
): AssumptionsResult {
  const lines: string[] = [];
  const push = (s: string) => {
    if (s && !lines.includes(s)) lines.push(s);
  };

  // Stretch / cross-category analogs first — the most load-bearing caveat.
  for (const [provider, cs] of Object.entries(caveatsByProvider)) {
    if (provider === baseProvider || !cs || cs.length === 0) continue;
    if (isStretch(cs)) {
      push(`${provider} is the closest analog, not a like-for-like equivalent`);
    }
  }
  // Then any warn-level caveat detail (assumed processor gen, unknown storage…).
  for (const [provider, cs] of Object.entries(caveatsByProvider)) {
    if (provider === baseProvider || !cs) continue;
    for (const c of cs) {
      if (c.severity === 'warn' && !isStretch([c])) push(`${provider}: ${c.label.toLowerCase()}`);
    }
  }
  // Estimated / fallback rates — a committed term was requested but a priced row
  // fell back to PAYG (its `bestRateLabel` doesn't match the requested tier).
  if (term !== 'payg') {
    const wanted = term === '1y' ? '1y RI' : '3y RI';
    const anyFallback = horizons.some(
      (h) => (h.oneMonthBest ?? 0) > 0 && h.bestRateLabel === 'PAYG',
    );
    if (anyFallback) push(`some clouds lack ${wanted} pricing — priced at PAYG`);
  }

  return { lines: lines.slice(0, 4), any: lines.length > 0 };
}

// ── S66-EXEC — VM-BoM mode math ─────────────────────────────────────────────
// The BoM-mode Exec Summary renders the SAME skeleton as comparison mode; the
// selectors below are its data source, mirroring computeVerdict/collectAssumptions
// shape-for-shape so both modes phrase the answer identically.

// S66 integration — articleFor now lives in ui/tokens (the shared grammar
// module); imported for local use + re-exported so FIX-A-era importers keep
// working.
import { articleFor } from './ui/tokens';
export { articleFor };

// ── S66 FIX-A — ONE whole-BoM verdict core ──────────────────────────────────
// Both whole-BoM dollar verdicts (`bomVerdict` here — Exec Summary + exports —
// and `bomPriceVerdict` in charts/chartMath — the Pricing band) previously
// computed cheapest/savings independently with DIFFERENT honesty gates and
// DIFFERENT rounding (18.7% vs 19%). This core is the single implementation
// both delegate to:
//   — cheapest = lowest monthly total among scenarios with ≥1 priced line;
//   — a savings-vs-base delta is stated ONLY when BOTH the base and the
//     cheapest scenario are FULLY priced (every BoM line contributed to the
//     total) — otherwise savings are null plus a machine-readable
//     `suppressReason` and a per-cloud exclusions list every surface discloses;
//   — savingPct is rounded to a WHOLE percent HERE so every surface agrees.

/** Structural subset of `PortedScenario` the core consumes (keeps chartMath's
 *  test fixtures independent of the full bomPort type). */
export interface BomVerdictCoreScenario {
  provider: string;
  monthlyTotalUsd: number;
  matchedLines: number;
  unmatchedLines: number;
  /** Lines that contributed to monthlyTotalUsd (see PortedScenario.pricedLines). */
  pricedLines: number;
  anyEstimated: boolean;
  /** When present, exclusions carry the actual line SKUs (base BoM names). */
  lines?: { baseVmSizeName: string; matchVmSizeName: string | null; monthlyUsd: number | null }[];
}

/** Structural subset of `BomPortResult`. */
export interface BomVerdictCoreInput {
  baseProvider: string;
  baseScenario: BomVerdictCoreScenario;
  targetScenarios: BomVerdictCoreScenario[];
}

/** Why a savings-vs-base delta was withheld. */
export type BomSuppressReason =
  | 'base-unpriced' // no base line priced at all
  | 'base-partially-priced' // some base lines missing from its total
  | 'cheapest-partially-priced'; // the winning cloud's total is undercounted

/** One cloud's excluded lines — SKUs missing from its monthly total. */
export interface BomExclusion {
  provider: string;
  /** Base-BoM SKU names of the excluded lines (empty when the caller passed
   *  count-only scenarios without a `lines` array). */
  lines: string[];
  /** Lines with no equivalent on this cloud. */
  unmatched: number;
  /** Lines matched but with no resolvable rate. */
  unpriced: number;
}

export interface BomVerdictCoreResult {
  cheapestProvider: string | null;
  cheapestTotal: number | null;
  baseTotal: number | null;
  /** base − cheapest, ≥0; null when suppressed (see suppressReason). */
  savingMonthly: number | null;
  /** WHOLE percent below base (core-rounded so every surface agrees). */
  savingPct: number | null;
  baseIsCheapest: boolean;
  baseUnpriced: boolean;
  savingsSuppressed: boolean;
  suppressReason: BomSuppressReason | null;
  exclusionsByProvider: BomExclusion[];
  basePricedLines: number;
  baseTotalLines: number;
  anyUnmatched: boolean;
  /** Estimated rates among PRICED scenarios only (an unpriced scenario's flag
   *  can't taint totals it doesn't contribute to). */
  anyEstimated: boolean;
}

function exclusionOf(s: BomVerdictCoreScenario): BomExclusion | null {
  const totalLines = s.matchedLines + s.unmatchedLines;
  const unpriced = Math.max(0, Math.min(s.matchedLines, s.matchedLines - s.pricedLines));
  const unmatched = s.unmatchedLines;
  if (unmatched + unpriced === 0 || totalLines === 0) return null;
  const lines: string[] = [];
  if (s.lines) {
    for (const ln of s.lines) {
      if (ln.matchVmSizeName == null || ln.monthlyUsd == null) lines.push(ln.baseVmSizeName);
    }
  }
  return { provider: s.provider, lines, unmatched, unpriced };
}

/**
 * The ONE whole-BoM cheapest/savings arithmetic (see block comment above).
 * Cheapest selection delegates to `buildVerdictQuant` (same tiebreak + dollar
 * rounding as every other verdict surface); the honesty gates + whole-percent
 * rounding live here.
 */
export function bomVerdictCore(input: BomVerdictCoreInput): BomVerdictCoreResult {
  const scenarios = [input.baseScenario, ...input.targetScenarios];
  const base = input.baseScenario;
  const baseTotalLines = base.matchedLines + base.unmatchedLines;
  const fullyPriced = (s: BomVerdictCoreScenario): boolean => {
    const total = s.matchedLines + s.unmatchedLines;
    return total > 0 && s.pricedLines === total;
  };

  const baseTotal = base.pricedLines > 0 && base.monthlyTotalUsd > 0 ? base.monthlyTotalUsd : null;
  const anyUnmatched = scenarios.some((s) => s.unmatchedLines > 0);
  const anyEstimated = scenarios.some((s) => s.monthlyTotalUsd > 0 && s.anyEstimated);
  const exclusionsByProvider = scenarios
    .map(exclusionOf)
    .filter((e): e is BomExclusion => e != null);

  const quant = buildVerdictQuant(
    scenarios.map((s) => ({
      provider: s.provider,
      sku: '',
      monthlyUsd: s.pricedLines > 0 && s.monthlyTotalUsd > 0 ? s.monthlyTotalUsd : null,
    })),
    baseTotal,
    '',
  );

  const common = {
    baseTotal,
    exclusionsByProvider,
    basePricedLines: base.pricedLines,
    baseTotalLines,
    anyUnmatched,
    anyEstimated,
  };

  if (quant == null) {
    return {
      ...common,
      cheapestProvider: null,
      cheapestTotal: null,
      savingMonthly: null,
      savingPct: null,
      baseIsCheapest: false,
      baseUnpriced: false,
      savingsSuppressed: false,
      suppressReason: null,
    };
  }

  const baseIsCheapest = quant.cheapestProvider === input.baseProvider;
  const baseUnpriced = baseTotal == null && !baseIsCheapest;
  const cheapestScenario =
    scenarios.find((s) => s.provider === quant.cheapestProvider) ?? base;

  let savingMonthly: number | null = null;
  let savingPct: number | null = null;
  let suppressReason: BomSuppressReason | null = null;

  if (baseIsCheapest) {
    if (fullyPriced(base)) {
      savingMonthly = 0;
      savingPct = 0;
    } else {
      // "Base wins" off an undercounted base total is not a comparable claim.
      suppressReason = 'base-partially-priced';
    }
  } else if (baseTotal == null) {
    suppressReason = 'base-unpriced';
  } else if (!fullyPriced(base)) {
    suppressReason = 'base-partially-priced';
  } else if (!fullyPriced(cheapestScenario)) {
    suppressReason = 'cheapest-partially-priced';
  } else if (quant.savingsVsBaseUsd != null) {
    savingMonthly = Math.max(0, quant.savingsVsBaseUsd);
    savingPct =
      quant.savingsVsBasePct != null ? Math.round(Math.max(0, quant.savingsVsBasePct)) : null;
  }

  return {
    ...common,
    cheapestProvider: quant.cheapestProvider,
    cheapestTotal: quant.monthlyUsd,
    savingMonthly,
    savingPct,
    baseIsCheapest,
    baseUnpriced,
    savingsSuppressed: suppressReason != null,
    suppressReason,
  };
}

export interface BomVerdictResult {
  /** The cloud whose whole-BoM monthly total is lowest among priced scenarios. */
  cheapestProvider: string | null;
  /** That cloud's monthly BoM total. */
  cheapestTotal: number | null;
  /** The base cloud's monthly BoM total (null when no base line priced). */
  baseTotal: number | null;
  /** base − cheapest, ≥0; null when either side is unpriced OR the savings
   *  claim is suppressed (see savingsSuppressed / suppressReason). */
  savingMonthly: number | null;
  /** WHOLE percent below base (rounded in the shared core — every surface
   *  shows the same figure, e.g. 19%, never 18.7% on one page and 19% on another). */
  savingPct: number | null;
  baseIsCheapest: boolean;
  /** A rival IS priced but the base BoM total is unpriced — the verdict must
   *  state the missing base rate honestly, never claim a win either way. */
  baseUnpriced: boolean;
  /** S66 FIX-A — true when a savings statement was withheld because the base
   *  or the cheapest scenario's total does not cover every BoM line. */
  savingsSuppressed: boolean;
  suppressReason: string | null;
  /** Per-cloud excluded line SKUs (unmatched or unpriced) — the disclosure the
   *  bands/chips/footers render alongside any total. */
  exclusionsByProvider: { provider: string; lines: string[] }[];
  basePricedLines: number;
  baseTotalLines: number;
  /** Any scenario left lines unmatched (they're excluded from totals). */
  anyUnmatched: boolean;
  /** Any PRICED scenario used an estimated (RI-from-PAYG) rate. */
  anyEstimated: boolean;
}

/**
 * The whole-BoM dollar verdict at the ported term. Thin wrapper over the ONE
 * shared `bomVerdictCore` (which chartMath's `bomPriceVerdict` also derives
 * from), so the Exec Summary, the Pricing band and the exports agree on the
 * cheapest cloud, the honesty gates AND the whole-percent rounding. An
 * unpriced or partially-priced base yields null savings + a suppression
 * reason, never a claimed win.
 */
export function bomVerdict(ported: BomPortResult): BomVerdictResult {
  const core = bomVerdictCore(ported);
  return {
    cheapestProvider: core.cheapestProvider,
    cheapestTotal: core.cheapestTotal,
    baseTotal: core.baseTotal,
    savingMonthly: core.savingMonthly,
    savingPct: core.savingPct,
    baseIsCheapest: core.baseIsCheapest,
    baseUnpriced: core.baseUnpriced,
    savingsSuppressed: core.savingsSuppressed,
    suppressReason: core.suppressReason,
    exclusionsByProvider: core.exclusionsByProvider.map((e) => ({
      provider: e.provider,
      lines: e.lines,
    })),
    basePricedLines: core.basePricedLines,
    baseTotalLines: core.baseTotalLines,
    anyUnmatched: core.anyUnmatched,
    anyEstimated: core.anyEstimated,
  };
}

export interface BomLineStats {
  /** Σ matched lines across every scenario (base included). */
  matched: number;
  /** lines × scenarios — the "N of M" denominator. */
  totalCells: number;
  anyUnmatched: boolean;
}

/** The "Lines matched N of M" KPI: matched line-cells across every cloud in scope. */
export function bomLineStats(ported: BomPortResult, bomLineCount: number): BomLineStats {
  const scenarios = [ported.baseScenario, ...ported.targetScenarios];
  const matched = scenarios.reduce((n, s) => n + s.matchedLines, 0);
  return {
    matched,
    totalCells: bomLineCount * scenarios.length,
    anyUnmatched: scenarios.some((s) => s.unmatchedLines > 0),
  };
}

/** Quantity-weighted average match % across the TARGET clouds' matched lines
 *  (base excluded — it's 100% by definition). null when nothing matched. */
export function weightedTargetMatch(ported: BomPortResult, bom: BomEntry[]): number | null {
  let wSum = 0;
  let qSum = 0;
  for (const s of ported.targetScenarios) {
    s.lines.forEach((ln, i) => {
      if (ln.matchPct == null) return;
      const qty = bom[i]?.quantity ?? ln.quantity;
      wSum += ln.matchPct * qty;
      qSum += qty;
    });
  }
  return qSum > 0 ? wSum / qSum : null;
}

/** The cheapest priced cloud for one BoM line (base + targets), or null when no
 *  cloud priced it. Drives the per-line highlight chips. */
export function cheapestForLine(
  ported: BomPortResult,
  i: number,
): { provider: string; monthlyUsd: number } | null {
  let best: { provider: string; monthlyUsd: number } | null = null;
  const consider = (provider: string, usd: number | null | undefined) => {
    if (usd == null || usd <= 0) return;
    if (!best || usd < best.monthlyUsd) best = { provider, monthlyUsd: usd };
  };
  consider(ported.baseProvider, ported.baseScenario.lines[i]?.monthlyUsd ?? null);
  for (const s of ported.targetScenarios) consider(s.provider, s.lines[i]?.monthlyUsd ?? null);
  return best;
}

/** One cloud's qty-weighted portfolio story for the "What you get vs what you
 *  give up" grid in BoM mode — the per-cloud column data. */
export interface BomCloudStory {
  provider: string;
  isBase: boolean;
  /** Dominant families across the ported lines, qty-weighted, up to 3. */
  families: string[];
  /** Dominant category label (qty-weighted; "via" flagged when match ≠ display). */
  category: string | null;
  /** Qty-weighted match % of this cloud's matched lines (100 for the base). */
  avgMatchPct: number | null;
  matchedLines: number;
  totalLines: number;
  /** 2–3 honest gained-trait lines ("+ …"). */
  gains: string[];
  /** One honest give-up line ("− …"), or null when there's nothing to concede. */
  giveUp: string | null;
  /** Worst comparability caveat across this cloud's matched lines. */
  worstCaveat: MatchCaveat | null;
  monthlyTotalUsd: number | null;
  anyEstimated: boolean;
}

/** Resolve a provider's catalog row for a SKU (first hit — specs are region-free). */
function rowFor(userVms: CatalogEntry[], provider: string, sizeName: string): CatalogEntry | null {
  const p = provider.toLowerCase();
  return (
    userVms.find(
      (vm) => (vm.provider ?? '').toLowerCase() === p && vm.vmSizeName === sizeName,
    ) ?? null
  );
}

/** Top-N keys of a qty-weighted counter, by weight desc then name. */
function topKeys(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k]) => k);
}

function addWeighted(counts: Map<string, number>, key: string | null | undefined, qty: number) {
  if (!key) return;
  counts.set(key, (counts.get(key) ?? 0) + qty);
}

/** Category label for a VM, flagging when the MATCH category differs from the
 *  display one (GCP -highmem → "Memory Optimized · via General Purpose"). */
function categoryLabelOf(vm: CatalogEntry): string {
  const disp = vm.category ?? categorize(vm.provider, vm.family ?? vmFamily(vm));
  const match = matchCategory(vm);
  return match !== disp ? `${match} · via ${disp}` : disp;
}

/**
 * The qty-weighted per-cloud portfolio story for the BoM tradeoffs grid: what a
 * cloud's ported BoM is made of (dominant families/categories), how faithful the
 * port is (qty-weighted match %, matched-line count, worst caveat), what it gains
 * (portfolio $ delta, spec-footprint delta) and the one honest give-up line.
 *
 * Every figure derives from `ported` line data + the user VM catalog rows — no
 * number is fabricated: an unpriced cloud gets no cost gain line, unmatched lines
 * are named as the give-up, and spec deltas compare ONLY the line pairs that
 * matched (a fair like-for-like subset).
 *
 * S66 FIX-A perf (additive `opts`): the page can pass a pre-built catalog
 * `lookup` Map (key `${provider}|${vmSizeName}`) so row resolution is O(1)
 * instead of a full `userVms.find` scan over the region-exploded catalog per
 * line per cloud, and its already-memoized `verdict` so it isn't recomputed
 * here. Base rows are resolved ONCE and reused by every target column.
 */
export function bomTradeoffs(
  ported: BomPortResult,
  bom: BomEntry[],
  userVms: CatalogEntry[],
  opts?: { lookup?: Map<string, CatalogEntry>; verdict?: BomVerdictResult },
): BomCloudStory[] {
  const verdict = opts?.verdict ?? bomVerdict(ported);
  const resolveRow = (provider: string, name: string): CatalogEntry | null => {
    const hit = opts?.lookup?.get(`${provider}|${name}`);
    return hit ?? rowFor(userVms, provider, name);
  };
  // Base catalog rows, resolved once — reused by the base column AND every
  // target column's like-for-like spec footprint (was re-resolved per cloud).
  const baseRows: (CatalogEntry | null)[] = ported.baseScenario.lines.map((ln) =>
    resolveRow(ported.baseProvider, ln.baseVmSizeName),
  );
  const stories: BomCloudStory[] = [];

  // ── base column: the portfolio as authored ──
  {
    const s = ported.baseScenario;
    const famCounts = new Map<string, number>();
    const catCounts = new Map<string, number>();
    let vms = 0;
    let vcpus = 0;
    let memGib = 0;
    s.lines.forEach((ln, i) => {
      const row = baseRows[i];
      const qty = bom[i]?.quantity ?? ln.quantity;
      vms += qty;
      if (row) {
        addWeighted(famCounts, row.family ?? vmFamily(row), qty);
        addWeighted(catCounts, categoryLabelOf(row), qty);
        vcpus += (row.vcpus ?? 0) * qty;
        memGib += (row.memoryGib ?? 0) * qty;
      }
    });
    const gains: string[] = [];
    gains.push(
      `${s.lines.length} line${s.lines.length === 1 ? '' : 's'} · ${vms.toLocaleString('en-US')} VM${vms === 1 ? '' : 's'} as authored`,
    );
    if (vcpus > 0 || memGib > 0) {
      // Thousands-separated — the dock formats 31,488, so this line must too.
      gains.push(
        `${Math.round(vcpus).toLocaleString('en-US')} vCPU · ${Math.round(memGib).toLocaleString('en-US')} GiB total footprint`,
      );
    }
    stories.push({
      provider: ported.baseProvider,
      isBase: true,
      families: topKeys(famCounts, 3),
      category: topKeys(catCounts, 1)[0] ?? null,
      avgMatchPct: 100,
      matchedLines: s.matchedLines,
      totalLines: s.lines.length,
      gains,
      giveUp: null,
      worstCaveat: null,
      monthlyTotalUsd: s.monthlyTotalUsd > 0 ? s.monthlyTotalUsd : null,
      anyEstimated: s.anyEstimated,
    });
  }

  // ── target columns: the qty-weighted ported portfolio per cloud ──
  for (const s of ported.targetScenarios) {
    const famCounts = new Map<string, number>();
    const catCounts = new Map<string, number>();
    const allCaveats: MatchCaveat[] = [];
    let stretchLines = 0;
    // Spec footprint over MATCHED line pairs only (fair like-for-like subset).
    let baseVcpu = 0;
    let baseMem = 0;
    let tgtVcpu = 0;
    let tgtMem = 0;
    s.lines.forEach((ln, i) => {
      if (!ln.matchVmSizeName) return;
      const qty = bom[i]?.quantity ?? ln.quantity;
      const tgtRow = resolveRow(s.provider, ln.matchVmSizeName);
      const baseRow = baseRows[i];
      if (tgtRow) {
        addWeighted(famCounts, tgtRow.family ?? vmFamily(tgtRow), qty);
        addWeighted(catCounts, categoryLabelOf(tgtRow), qty);
        tgtVcpu += (tgtRow.vcpus ?? 0) * qty;
        tgtMem += (tgtRow.memoryGib ?? 0) * qty;
      }
      if (baseRow) {
        baseVcpu += (baseRow.vcpus ?? 0) * qty;
        baseMem += (baseRow.memoryGib ?? 0) * qty;
      }
      if (baseRow && tgtRow) {
        const cs = matchCaveats(baseRow, tgtRow);
        allCaveats.push(...cs);
        if (isStretch(cs)) stretchLines += 1;
      }
    });

    // Qty-weighted match for THIS cloud only.
    let wSum = 0;
    let qSum = 0;
    s.lines.forEach((ln, i) => {
      if (ln.matchPct == null) return;
      const qty = bom[i]?.quantity ?? ln.quantity;
      wSum += ln.matchPct * qty;
      qSum += qty;
    });
    const avgMatchPct = qSum > 0 ? wSum / qSum : null;

    // Gains — 2–3 honest lines, most decision-relevant first. The bill-delta
    // line is subject to the SAME honesty gate as the verdict core: both totals
    // must cover every line (an undercounted side fabricates the %), and the
    // percent is WHOLE so it can never disagree with the verdict's savingPct.
    const gains: string[] = [];
    const total = s.monthlyTotalUsd > 0 ? s.monthlyTotalUsd : null;
    const baseFullyPriced = verdict.basePricedLines === verdict.baseTotalLines;
    const thisFullyPriced = s.lines.length > 0 && s.pricedLines === s.lines.length;
    if (
      total != null &&
      verdict.baseTotal != null &&
      total < verdict.baseTotal &&
      baseFullyPriced &&
      thisFullyPriced
    ) {
      const pct = Math.round(((verdict.baseTotal - total) / verdict.baseTotal) * 100);
      gains.push(`Lowers the monthly bill ${pct}% vs ${ported.baseProvider}`);
    }
    const pctDelta = (tgt: number, base: number): number | null =>
      base > 0 ? Math.round(((tgt - base) / base) * 100) : null;
    const dV = pctDelta(tgtVcpu, baseVcpu);
    const dM = pctDelta(tgtMem, baseMem);
    if (dV != null && dM != null) {
      if (Math.abs(dV) <= 2 && Math.abs(dM) <= 2) {
        gains.push('Matches the base vCPU + memory footprint (±2%)');
      } else {
        const part = (d: number, unit: string) =>
          d === 0 ? `same ${unit}` : `${d > 0 ? '+' : ''}${d}% ${unit}`;
        gains.push(`${part(dV, 'vCPU')} · ${part(dM, 'memory')} across matched lines`);
      }
    }
    if (s.matchedLines === s.lines.length && s.lines.length > 0) {
      gains.push(`Every line has ${articleFor(s.provider)} ${s.provider} equivalent`);
    }

    // Give-up — the single most load-bearing concession.
    let giveUp: string | null = null;
    const unpricedLines = s.matchedLines - s.pricedLines;
    if (s.unmatchedLines > 0) {
      giveUp = `${s.unmatchedLines} of ${s.lines.length} line${s.lines.length === 1 ? '' : 's'} ha${s.unmatchedLines === 1 ? 's' : 've'} no ${s.provider} equivalent — excluded from totals`;
    } else if (unpricedLines > 0) {
      giveUp = `${unpricedLines} of ${s.lines.length} line${s.lines.length === 1 ? '' : 's'} ha${unpricedLines === 1 ? 's' : 've'} no resolvable ${s.provider} rate — excluded from totals`;
    } else if (stretchLines > 0) {
      giveUp = `${stretchLines} line${stretchLines === 1 ? '' : 's'} matched to the closest analog, not a true equivalent`;
    } else if (dM != null && dM < -2) {
      giveUp = `${dM}% memory across matched lines vs the base portfolio`;
    } else if (dV != null && dV < -2) {
      giveUp = `${dV}% vCPU across matched lines vs the base portfolio`;
    } else if (s.anyEstimated) {
      giveUp = 'Some reserved rates are estimated from PAYG';
    }

    stories.push({
      provider: s.provider,
      isBase: false,
      families: topKeys(famCounts, 3),
      category: topKeys(catCounts, 1)[0] ?? null,
      avgMatchPct,
      matchedLines: s.matchedLines,
      totalLines: s.lines.length,
      gains: gains.slice(0, 3),
      giveUp,
      worstCaveat: worstCaveat(allCaveats),
      monthlyTotalUsd: total,
      anyEstimated: s.anyEstimated,
    });
  }

  return stories;
}

/**
 * The BoM-mode assumptions footer: unmatched lines (named per cloud), estimated
 * reserved rates, and stretch analogs surfaced by the tradeoff stories. Same
 * dedupe/cap discipline as collectAssumptions so both modes' footers read alike.
 */
export function collectBomAssumptions(
  ported: BomPortResult,
  stories: BomCloudStory[] = [],
): AssumptionsResult {
  const lines: string[] = [];
  const push = (s: string) => {
    if (s && !lines.includes(s)) lines.push(s);
  };

  const scenarios = [ported.baseScenario, ...ported.targetScenarios];
  const unmatchedBy = scenarios.filter((s) => s.unmatchedLines > 0);
  if (unmatchedBy.length > 0) {
    const names = unmatchedBy.map((s) => `${s.provider} (${s.unmatchedLines})`).join(', ');
    push(`unmatched lines excluded from totals — ${names}`);
  }
  // S66 FIX-A — matched-but-unpriced lines are just as absent from a total as
  // unmatched ones; the footer names them per cloud instead of staying silent.
  const unpricedBy = scenarios
    .map((s) => ({ provider: s.provider, n: s.matchedLines - s.pricedLines }))
    .filter((x) => x.n > 0);
  if (unpricedBy.length > 0) {
    const names = unpricedBy.map((x) => `${x.provider} (${x.n})`).join(', ');
    push(`lines without a resolvable rate excluded from totals — ${names}`);
  }
  for (const st of stories) {
    if (!st.isBase && st.giveUp && st.giveUp.includes('closest analog')) {
      push(`${st.provider}: some lines matched to the closest analog, not a like-for-like equivalent`);
    }
  }
  if ([ported.baseScenario, ...ported.targetScenarios].some((s) => s.anyEstimated)) {
    push('some reserved rates are estimated from PAYG');
  }

  return { lines: lines.slice(0, 4), any: lines.length > 0 };
}

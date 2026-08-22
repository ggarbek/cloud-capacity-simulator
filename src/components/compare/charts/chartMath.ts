/**
 * chartMath — pure, null-safe helpers that turn engine/BoM shapes into the
 * geometry the C2 pricing visualizations render. Kept UI-free (no React, no
 * DOM) so they're trivially unit-tested and shared across the charts.
 *
 * Owned by Wave-1 item C2. Only the two functions below live here — normalized
 * $/vCPU · $/GiB math is a LATER wave (A2) selector on the engine, not here.
 */
import type { PriceBar } from '../../../engine/competitive';
import type { Term } from '../../../utils/costCalculator';
import { HOURS_PER_MONTH } from '../../../types';
// S65 — cheapest/savings arithmetic delegates to the ONE shared core so the
// price bars, the exec brief and the exports agree (same cheapest + rounding).
import { buildVerdictQuant } from '../../../utils/export/execNarratives';
// S66 FIX-A — the whole-BoM verdict arithmetic lives in ONE core (execBriefMath's
// bomVerdictCore); `bomPriceVerdict` below derives from it so the Pricing band
// and the Exec Summary can never disagree on cheapest/savings/suppression.
import { bomVerdictCore } from '../execBriefMath';

/** Hours per month — the SAME x730 convention `timeHorizonCosts`,
 *  `normalizedRates` and the inline normalized table use, so every $ surface in
 *  the pricing page reconciles (the S63 lesson). Cumulative month m = effective
 *  hourly rate × 730 × m; the year/3-year figures the horizon matrix shows are
 *  the same series sampled at m=12 / m=36 (730×12=8760, 730×36=26280).
 *  Re-exported from the canonical `types` constant (single source of truth) so
 *  chartMath's own consumers keep importing it from here unchanged. */
export { HOURS_PER_MONTH };

/** One commitment tier for the stepdown chart. `value` is the per-hour rate at
 *  that tier (null when the SKU has no rate for it — rendered "not published").
 *  `deltaPctVsPayg` is the negative % change vs the SKU's PAYG rate (e.g. -37
 *  for "37% cheaper than PAYG"); null when either PAYG or this tier is missing,
 *  or PAYG is zero (guarded — no divide-by-zero, no ±Infinity). */
export interface StepdownPoint {
  term: 'payg' | '1y' | '3y';
  value: number | null;
  deltaPctVsPayg: number | null;
}

/**
 * Descending commitment series (PAYG → 1y → 3y) for one price bar. Each point
 * carries its rate and the % delta vs the bar's own PAYG rate. Missing tiers
 * keep their slot (value null) so the chart can show a dashed "not published"
 * placeholder rather than dropping the row.
 */
export function stepdownSeries(bar: PriceBar): StepdownPoint[] {
  const payg = bar.payg;
  const deltaVsPayg = (rate: number | null): number | null => {
    if (rate == null || payg == null || payg === 0) return null;
    return ((rate - payg) / payg) * 100;
  };
  return [
    { term: 'payg', value: payg ?? null, deltaPctVsPayg: payg != null ? 0 : null },
    { term: '1y', value: bar.oneYr ?? null, deltaPctVsPayg: deltaVsPayg(bar.oneYr ?? null) },
    { term: '3y', value: bar.threeYr ?? null, deltaPctVsPayg: deltaVsPayg(bar.threeYr ?? null) },
  ];
}

/** One stacked-bar segment. `unmatched` flags the terminal hatched segment that
 *  represents BoM lines with no cross-cloud match (they carry no cost, so their
 *  `value` is 0 and they exist only as a labeled marker). */
export interface StackSegment {
  label: string;
  value: number;
  unmatched?: boolean;
}

/** Minimal shape stackedSegments consumes — a subset of bomPort's PortedScenario
 *  so the helper stays decoupled from the full type (and easy to unit-test). */
export interface StackableScenario {
  lines: {
    baseVmSizeName: string;
    matchVmSizeName: string | null;
    monthlyUsd: number | null;
  }[];
  unmatchedLines?: number;
}

const MAX_SEGMENTS = 5;

/**
 * Per-line monthly-cost segments for one scenario's stacked bar. Priced,
 * matched lines each become a segment; once more than `MAX_SEGMENTS` priced
 * segments exist the overflow collapses into a single "Other N lines" segment
 * (sum preserved). A terminal `unmatched` segment (value 0) is appended when the
 * scenario has any unmatched line, so the bar can show a hatched marker + count.
 *
 * Sum of the priced-segment values equals the scenario's monthly total (Σ of
 * non-null line costs) — asserted in tests.
 */
export function stackedSegments(scenario: StackableScenario): StackSegment[] {
  const priced: StackSegment[] = [];
  let unmatchedFromNullMatch = 0;
  for (const line of scenario.lines) {
    if (line.matchVmSizeName == null) {
      unmatchedFromNullMatch++;
      continue;
    }
    if (line.monthlyUsd == null) continue;
    priced.push({ label: line.baseVmSizeName, value: line.monthlyUsd });
  }
  // Largest-first so the collapsed tail is genuinely the smallest lines.
  priced.sort((a, b) => b.value - a.value);

  let segments: StackSegment[];
  if (priced.length > MAX_SEGMENTS) {
    const head = priced.slice(0, MAX_SEGMENTS - 1);
    const tail = priced.slice(MAX_SEGMENTS - 1);
    const tailSum = tail.reduce((s, seg) => s + seg.value, 0);
    segments = [...head, { label: `Other ${tail.length} lines`, value: tailSum }];
  } else {
    segments = priced;
  }

  const unmatchedCount = scenario.unmatchedLines ?? unmatchedFromNullMatch;
  if (unmatchedCount > 0) {
    segments.push({
      label: `${unmatchedCount} line${unmatchedCount === 1 ? '' : 's'} unmatched`,
      value: 0,
      unmatched: true,
    });
  }
  return segments;
}

// ────────────────────────────────────────────────────────────────────────
// S65 — Cumulative cost over time + crossovers + a dollar-quantified verdict.
//
// The pricing page previously showed only RATES (a snapshot). These helpers add
// the TIME axis the user was missing: "what will I actually pay over MY horizon,
// and when do decisions flip?" All money math uses the SAME effective-hourly ×
// 730 × months convention as `timeHorizonCosts`/`normalizedRates`, so a series'
// value at m=12 equals that surface's 1-year total and at m=36 its 3-year total.
// Pure — no React, no DOM. qty is intentionally NOT a parameter here: like the
// rate bars, this prices one unit; the interactive quantity knob stays a
// CostCalculator concern.
// ────────────────────────────────────────────────────────────────────────

/** Effective hourly rate a `PriceBar` charges under a commitment `term`. RI
 *  rates in the catalog are ALREADY effective-hourly (amortized), so no term
 *  arithmetic is needed — we simply pick the tier. Returns the PAYG rate as a
 *  fallback when the requested RI tier is unpublished (mirrors
 *  `timeHorizonCosts`), and flags that fallback via the second tuple slot. */
function rateForTerm(bar: PriceBar, term: Term): { rate: number | null; fellBack: boolean } {
  const tier = term === '3y' ? bar.threeYr : term === '1y' ? bar.oneYr : bar.payg;
  if (tier != null) return { rate: tier, fellBack: false };
  // Requested tier missing → fall back to PAYG (honest: label says so).
  if (term !== 'payg' && bar.payg != null) return { rate: bar.payg, fellBack: true };
  return { rate: null, fellBack: false };
}

function termRateLabel(term: Term, fellBack: boolean): string {
  if (term === 'payg') return 'PAYG';
  if (fellBack) return 'PAYG';
  return term === '3y' ? '3y RI' : '1y RI';
}

export interface CumulativePoint {
  month: number;
  usd: number;
}

export interface CumulativeSeries {
  provider: string;
  sku: string;
  term: 'payg' | '1y' | '3y';
  /** What was actually priced, e.g. "3y RI" or (on fallback) "PAYG". */
  rateLabel?: string;
  points: CumulativePoint[];
  /** True when this series' rate is not the true requested tier (RI tier missing
   *  → priced at PAYG) OR the bar carries an estimated flag. Rendered "(est.)". */
  estimated?: boolean;
}

/**
 * Cumulative $-over-time series per cloud for the selected `term`, from month 0
 * to `months` (default 36). One point per whole month; usd = effHourly × 730 ×
 * month, so the series reconciles exactly with the horizon matrix.
 *
 * Always includes the BASE cloud's PAYG series as the reference line (even when
 * `term !== 'payg'`), so the chart can show "what committing buys you vs just
 * paying as you go". When the selected term IS payg, the reference and the base
 * series coincide and we emit a single base series to avoid a duplicate line.
 *
 * A bar with no resolvable rate for the term (and no PAYG fallback) is dropped —
 * it has no line to draw.
 */
export function cumulativeCostSeries(
  bars: PriceBar[],
  term: Term,
  months = 36,
  baseProvider?: string,
): CumulativeSeries[] {
  const horizon = Math.max(1, Math.floor(months));
  const buildPoints = (rate: number): CumulativePoint[] => {
    const pts: CumulativePoint[] = [];
    for (let m = 0; m <= horizon; m++) pts.push({ month: m, usd: rate * HOURS_PER_MONTH * m });
    return pts;
  };
  const out: CumulativeSeries[] = [];

  // Reference PAYG line for the base cloud (only meaningful when committing).
  if (term !== 'payg' && baseProvider) {
    const baseBar = bars.find((b) => b.provider === baseProvider);
    if (baseBar && baseBar.payg != null) {
      out.push({
        provider: baseBar.provider,
        sku: baseBar.sku,
        term: 'payg',
        rateLabel: 'PAYG',
        points: buildPoints(baseBar.payg),
        estimated: (baseBar as PriceBar & { estimated?: boolean }).estimated === true,
      });
    }
  }

  // Selected-term series, one per cloud.
  for (const bar of bars) {
    const { rate, fellBack } = rateForTerm(bar, term);
    if (rate == null) continue;
    // S65 — when committing but the BASE bar has no RI tier for this term, its
    // selected-term rate falls back to PAYG — which is EXACTLY the dashed PAYG
    // reference line already emitted above. Emitting it again would draw two
    // identical base lines (and mislabel the fallback as an "(est.)" committed
    // series). Skip the duplicate: the reference line already represents it.
    if (term !== 'payg' && baseProvider && bar.provider === baseProvider && fellBack) continue;
    out.push({
      provider: bar.provider,
      sku: bar.sku,
      term,
      rateLabel: termRateLabel(term, fellBack),
      points: buildPoints(rate),
      estimated:
        fellBack || (bar as PriceBar & { estimated?: boolean }).estimated === true,
    });
  }
  return out;
}

export interface Crossover {
  /** Fractional month where the two cumulative lines intersect. */
  month: number;
  a: { provider: string; term: string };
  b: { provider: string; term: string };
  /** Cumulative $ both lines share at the crossover. */
  usdAt: number;
}

/** Slope (rate × 730) of a series — cumulative is linear, so slope = usd@m1. */
function slopeOf(s: CumulativeSeries): number {
  const p1 = s.points.find((p) => p.month === 1) ?? s.points[1];
  return p1 ? p1.usd : 0;
}

/**
 * Pairwise cumulative-line intersections at (interpolated) monthly resolution.
 * Because each line is linear through the origin's month-0 = $0, two lines only
 * cross when their slopes differ — and if both pass through (0,0) they only
 * "cross" at month 0, which is not decision-relevant. The decision-relevant
 * crossovers here are between lines with DIFFERENT month-0 values, but every
 * cumulative series starts at $0; so a genuine crossover requires the compared
 * series to differ in slope AND we report the earliest positive month where the
 * cheaper-early line is overtaken. Since all lines share (0,$0), lines with
 * different slopes never re-cross after month 0 — so the useful signal is the
 * PAYG-vs-committed pairing (same cloud) whose lines share the origin but where
 * the committed line is cheaper for all m>0: that is a permanent lead, not a
 * crossover. We therefore surface crossovers between DISTINCT clouds where the
 * ranking by cumulative cost flips within the horizon.
 *
 * Implementation: for every pair, find the smallest month m (1..maxMonth) where
 * the sign of (A−B) differs from the previous month; interpolate the exact
 * fractional month within that step. Dedupe near-identical months and cap to the
 * 3 earliest (most decision-relevant).
 */
export function findCrossovers(series: CumulativeSeries[]): Crossover[] {
  const found: Crossover[] = [];
  const maxMonth = series.reduce(
    (mx, s) => Math.max(mx, s.points.length ? s.points[s.points.length - 1].month : 0),
    0,
  );
  const usdAt = (s: CumulativeSeries, m: number): number => slopeOf(s) * m;

  for (let i = 0; i < series.length; i++) {
    for (let j = i + 1; j < series.length; j++) {
      const A = series[i];
      const B = series[j];
      // Two straight lines through the origin cross only at month 0 unless one is
      // offset — but cumulative lines all start at $0. So a "crossover" only
      // exists when a line is NOT through-origin, which cumulative never is.
      // Detect a sign change of (A-B) across whole-month samples to be robust to
      // any future non-linear series; interpolate the exact month.
      let prevDiff = usdAt(A, 0) - usdAt(B, 0); // 0 at month 0
      for (let m = 1; m <= maxMonth; m++) {
        const diff = usdAt(A, m) - usdAt(B, m);
        if (prevDiff === 0 && diff === 0) {
          prevDiff = diff;
          continue;
        }
        const crossed =
          (prevDiff < 0 && diff > 0) ||
          (prevDiff > 0 && diff < 0) ||
          (prevDiff !== 0 && diff === 0);
        if (crossed) {
          // Linear interpolation of the zero of diff between m-1 and m.
          const d0 = usdAt(A, m - 1) - usdAt(B, m - 1);
          const d1 = diff;
          const frac = d1 - d0 === 0 ? 0 : d0 / (d0 - d1);
          const month = m - 1 + Math.max(0, Math.min(1, frac));
          if (month > 0.001) {
            // The line that was CHEAPER just before the crossover is overtaken.
            const aWasCheaper = usdAt(A, m - 1) < usdAt(B, m - 1);
            const overtaker = aWasCheaper ? B : A;
            const overtaken = aWasCheaper ? A : B;
            found.push({
              month,
              a: { provider: overtaker.provider, term: overtaker.term },
              b: { provider: overtaken.provider, term: overtaken.term },
              usdAt: usdAt(A, month),
            });
          }
          break; // first crossover per pair is the decision-relevant one
        }
        prevDiff = diff;
      }
    }
  }

  // Dedupe near-identical months (same overtaker/overtaken within 0.5 mo).
  const deduped: Crossover[] = [];
  for (const c of found.sort((x, y) => x.month - y.month)) {
    const dup = deduped.some(
      (d) =>
        Math.abs(d.month - c.month) < 0.5 &&
        d.a.provider === c.a.provider &&
        d.b.provider === c.b.provider,
    );
    if (!dup) deduped.push(c);
  }
  return deduped.slice(0, 3);
}

export interface PriceVerdictModel {
  cheapest: { provider: string; sku: string; monthlyUsd: number; term: string } | null;
  baseMonthlyUsd: number | null;
  /** Absolute $/mo the cheapest cloud saves vs the base cloud (>=0), null when
   *  either side is unpriced or the base IS the cheapest (savings 0). */
  savingsUsd: number | null;
  savingsPct: number | null;
  /** Base cloud's 3y-vs-PAYG saving over 12 months (the "commitment matters"
   *  line), null when the base lacks a 3y or PAYG rate. */
  commitSavingsUsd: number | null;
  anyEstimated: boolean;
  anyStretch: boolean;
}

/**
 * A dollar-quantified verdict for the selected `term`: which equivalent is the
 * least-cost, how much (absolute + %) it beats the base cloud by, and — as a
 * second signal — how much committing 3-yr on the BASE cloud saves over a year
 * vs PAYG. Monthly figures use the same × 730 convention as every other surface.
 */
export function priceVerdict(bars: PriceBar[], term: Term, baseProvider: string): PriceVerdictModel {
  const monthly = (rate: number | null) => (rate != null ? rate * HOURS_PER_MONTH : null);

  // PriceBar-specific rate resolution stays here (rateForTerm knows the tier +
  // PAYG-fallback + estimated flags). We build monthly candidates from the bars,
  // then hand the cheapest/savings arithmetic to the shared `buildVerdictQuant`
  // core so this surface's cheapest pick + $/% savings agree with the exec brief.
  let anyEstimated = false;
  let anyStretch = false;
  const candidates: { provider: string; sku: string; monthlyUsd: number | null; label: string }[] = [];
  for (const bar of bars) {
    if (bar.stretch) anyStretch = true;
    const { rate, fellBack } = rateForTerm(bar, term);
    if (fellBack || (bar as PriceBar & { estimated?: boolean }).estimated === true) {
      anyEstimated = true;
    }
    candidates.push({ provider: bar.provider, sku: bar.sku, monthlyUsd: monthly(rate), label: termRateLabel(term, fellBack) });
  }

  const baseBar = bars.find((b) => b.provider === baseProvider);
  const baseMonthlyUsd = baseBar ? monthly(rateForTerm(baseBar, term).rate) : null;

  const quant = buildVerdictQuant(candidates, baseMonthlyUsd, term);
  let cheapest: PriceVerdictModel['cheapest'] = null;
  if (quant) {
    const src = candidates.find((c) => c.provider === quant.cheapestProvider && c.sku === quant.cheapestSku);
    cheapest = {
      provider: quant.cheapestProvider,
      sku: quant.cheapestSku,
      monthlyUsd: quant.monthlyUsd,
      term: src?.label ?? termRateLabel(term, false),
    };
  }

  // Only surface a saving when the cheapest is a DIFFERENT cloud that undercuts
  // the base (the price bars never show the base "saving" vs itself).
  let savingsUsd: number | null = null;
  let savingsPct: number | null = null;
  if (
    cheapest &&
    quant &&
    cheapest.provider !== baseProvider &&
    quant.savingsVsBaseUsd != null &&
    quant.savingsVsBaseUsd > 0
  ) {
    savingsUsd = quant.savingsVsBaseUsd;
    savingsPct = quant.savingsVsBasePct;
  }

  let commitSavingsUsd: number | null = null;
  if (baseBar && baseBar.payg != null && baseBar.threeYr != null) {
    const paygYr = baseBar.payg * HOURS_PER_MONTH * 12;
    const committedYr = baseBar.threeYr * HOURS_PER_MONTH * 12;
    const delta = paygYr - committedYr;
    if (delta > 0) commitSavingsUsd = delta;
  }

  return {
    cheapest,
    baseMonthlyUsd,
    savingsUsd,
    savingsPct,
    commitSavingsUsd,
    anyEstimated,
    anyStretch,
  };
}

// ────────────────────────────────────────────────────────────────────────
// S66-PRICING — whole-BoM verdict + cost-over-time adapter for VM-BoM mode.
//
// The S65 keystone (verdict + cumulative chart) only existed in Comparison
// mode; the BoM branch opened with a composition bar and tables. These two
// helpers give the BoM branch the SAME answer grammar: `bomPriceVerdict`
// quantifies "porting your N-line BoM to X costs $Y/mo — $Z below base", and
// `bomCostSeries` turns each cloud's BoM monthly total into a cumulative
// series the CostOverTimeChart can draw. Totals come STRAIGHT from
// `bomPortResult` (already priced at the active term on the ×730 convention) —
// nothing is re-priced here, so Pricing === Exec === Specs on the same dollars.
// Pure — no React, no DOM.
// ────────────────────────────────────────────────────────────────────────

/** Minimal structural subset of `PortedScenario` these helpers consume — keeps
 *  them decoupled from the full bomPort type and easy to unit-test. */
export interface BomVerdictScenario {
  provider: string;
  /** Σ monthly USD of the scenario's PRICED lines (unmatched/unpriced excluded). */
  monthlyTotalUsd: number;
  matchedLines: number;
  unmatchedLines: number;
  /** S66 FIX-A — lines that actually contributed to monthlyTotalUsd. A matched
   *  line with no resolvable rate counts as matched but NOT priced; every
   *  honesty gate/legend here keys off this, not just unmatchedLines. */
  pricedLines: number;
  anyEstimated: boolean;
  /** Optional line detail — when present (the real PortedScenario), exclusions
   *  can carry the actual SKUs. */
  lines?: { baseVmSizeName: string; matchVmSizeName: string | null; monthlyUsd: number | null }[];
}

/** Minimal structural subset of `BomPortResult`. */
export interface BomVerdictInput {
  baseProvider: string;
  baseScenario: BomVerdictScenario;
  targetScenarios: BomVerdictScenario[];
}

export interface BomPriceVerdictModel {
  term: Term;
  /** Total BoM lines (matched + unmatched on the base scenario). */
  lineCount: number;
  /** Least-cost priced scenario (base included), or null when nothing priced. */
  cheapest: { provider: string; monthlyUsd: number } | null;
  baseProvider: string;
  /** Base scenario's monthly total, or null when the base has no priced lines. */
  baseMonthlyUsd: number | null;
  /** $ /mo the cheapest cloud saves vs the base — null when the base is the
   *  cheapest, the base is unpriced, OR either side's total excludes lines
   *  (unmatched or unpriced — we never fabricate that delta). */
  savingsUsd: number | null;
  /** WHOLE percent (rounded in the shared core, so it always equals the Exec
   *  Summary's savingPct — never 18.7% on one surface and 19% on another). */
  savingsPct: number | null;
  /** >0 when the BASE scenario has UNMATCHED lines. Kept for shape-compat;
   *  suppression itself keys off savingsSuppressed/suppressReason (which also
   *  cover matched-but-unpriced lines). */
  baseUnmatchedLines: number;
  /** S66 FIX-A — true when a savings delta was withheld because the base or
   *  the cheapest scenario's total does not cover every BoM line. */
  savingsSuppressed: boolean;
  /** Machine-readable reason ('base-unpriced' | 'base-partially-priced' |
   *  'cheapest-partially-priced'), or null. */
  suppressReason: string | null;
  /** Every scenario (base included) whose total excludes lines — unmatched OR
   *  matched-but-unpriced. `lines` = total excluded; the split lets the band
   *  word each chip honestly. */
  exclusions: { provider: string; lines: number; unmatched: number; unpriced: number }[];
  /** True when any priced scenario used an estimated (derived) rate. */
  anyEstimated: boolean;
}

/**
 * Dollar-quantified verdict for the whole ported BoM at the active `term`.
 * S66 FIX-A: derives from the ONE shared `bomVerdictCore` (execBriefMath) —
 * the same cheapest pick, honesty gates (savings only when BOTH the base and
 * the cheapest scenario are fully priced) and whole-percent rounding as the
 * Exec Summary's `bomVerdict`, so the two surfaces can never split-brain.
 */
export function bomPriceVerdict(ported: BomVerdictInput, term: Term): BomPriceVerdictModel {
  const core = bomVerdictCore(ported);
  const base = ported.baseScenario;
  const lineCount = base.matchedLines + base.unmatchedLines;

  const cheapest: BomPriceVerdictModel['cheapest'] =
    core.cheapestProvider != null && core.cheapestTotal != null
      ? { provider: core.cheapestProvider, monthlyUsd: core.cheapestTotal }
      : null;

  // The Pricing band never shows the base "saving" vs itself — only a positive
  // cross-cloud delta that survived the core's honesty gates.
  const showSavings =
    cheapest != null &&
    !core.baseIsCheapest &&
    core.savingMonthly != null &&
    core.savingMonthly > 0;

  return {
    term,
    lineCount,
    cheapest,
    baseProvider: ported.baseProvider,
    baseMonthlyUsd: core.baseTotal,
    savingsUsd: showSavings ? core.savingMonthly : null,
    savingsPct: showSavings ? core.savingPct : null,
    baseUnmatchedLines: base.unmatchedLines,
    savingsSuppressed: core.savingsSuppressed,
    suppressReason: core.suppressReason,
    exclusions: core.exclusionsByProvider.map((e) => ({
      provider: e.provider,
      lines: e.unmatched + e.unpriced,
      unmatched: e.unmatched,
      unpriced: e.unpriced,
    })),
    anyEstimated: core.anyEstimated,
  };
}

/**
 * Cumulative $-over-time series per cloud for the ported BoM: each cloud's
 * line has slope = its BoM monthly total at the active term (usd@m = total ×
 * m), month 0 to `months`. Base scenario first, then targets in order.
 * Scenarios with no priced lines are dropped (no line to draw). The sku label
 * carries the PRICED-line count ("BoM · 3/5 lines") whenever any line is
 * missing from the total — unmatched OR matched-but-unpriced — so an
 * undercounted total is visible right in the chart legend (S66 FIX-A: keying
 * this off unmatchedLines alone let unpriced lines hide).
 */
export function bomCostSeries(
  ported: BomVerdictInput,
  term: Term,
  months = 36,
): CumulativeSeries[] {
  const horizon = Math.max(1, Math.floor(months));
  const out: CumulativeSeries[] = [];
  for (const s of [ported.baseScenario, ...ported.targetScenarios]) {
    if (s.monthlyTotalUsd <= 0 || s.pricedLines <= 0) continue;
    const total = s.matchedLines + s.unmatchedLines;
    const points: CumulativePoint[] = [];
    for (let m = 0; m <= horizon; m++) points.push({ month: m, usd: s.monthlyTotalUsd * m });
    out.push({
      provider: s.provider,
      sku:
        s.pricedLines < total
          ? `BoM · ${s.pricedLines}/${total} lines`
          : `BoM (${total} line${total === 1 ? '' : 's'})`,
      term,
      rateLabel: termRateLabel(term, false),
      points,
      estimated: s.anyEstimated,
    });
  }
  return out;
}

/**
 * S66 FIX-A — the honest "no crossover" explanation under the cost-over-time
 * chart, TERM-AWARE: the old copy always said "reserved rates are amortized,
 * so lines don't cross" — even at PAYG, where no reserved rate is on the chart
 * at all. Pure (tested); the chart renders it verbatim.
 */
export function noCrossoverNote(series: CumulativeSeries[]): string {
  const anyReserved = series.some((s) => s.rateLabel != null && s.rateLabel !== 'PAYG');
  return anyReserved
    ? 'No rank flip within 36 months — the cheapest option stays cheapest at every horizon (reserved rates are amortized into a flat effective hourly, so lines don’t cross).'
    : 'No rank flip within 36 months — each curve is a straight line at its monthly rate, so the cheapest option stays cheapest at every horizon.';
}

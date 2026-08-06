/**
 * BoM port (cross-cloud cost comparison) — pure helpers, no React / state.
 *
 * Given the user's committed VM-demand Bill of Materials (a list of
 * `{vmSizeName, quantity, region?}` lines authored on a BASE cloud) and the
 * live catalog (`state.userVms`), this maps every line to its best-match
 * equivalent VM on each OTHER target cloud, then prices the original and the
 * equivalent BoMs so the UI can answer "your Azure BoM would cost $X on AWS /
 * $Y on GCP at PAYG / 1yr / 3yr".
 *
 * Reuses the existing engines rather than reimplementing them:
 *   - `bestVmMatch` (src/utils/equivalence.ts) for the cross-cloud size match
 *     (same category gate + log-ratio spec distance) and `matchPct` for the
 *     0–100 similarity score.
 *   - `resolveDisplayRate` (src/utils/estimatedRate.ts) for the hourly rate at
 *     the chosen basis, honoring the opt-in RI estimate flag.
 *
 * Pricing convention mirrors `financial.ts`: monthly = hourly × HOURS_PER_MONTH
 * (730). A line whose base or equivalent VM carries no resolvable rate prices
 * to `null` (never a fabricated 0) — the no-stale-data / no-fabrication
 * doctrine.
 */
import { HOURS_PER_MONTH, type BomEntry, type CatalogEntry } from '../types';
import { bestVmMatch, matchPct } from './equivalence';
import { resolveDisplayRate } from './estimatedRate';
import type { RateType } from '../engine/insights';

/** Billing basis for the port. Maps onto the catalog's RateType. */
export type Term = 'payg' | '1y' | '3y';

/**
 * A run duration — expressed in either hours or months (730 h/month). Mirrors
 * `costCalculator.DurationSpec` so the Pricing page's duration selector can be
 * passed straight through. Optional everywhere: when omitted, the port prices
 * the plain monthly basis (current/legacy behavior, fully backward-compatible).
 */
export type DurationSpec = { hours: number } | { months: number };

/** Convert a DurationSpec to hours (months × 730). */
export function durationToHours(d: DurationSpec): number {
  if ('hours' in d) return d.hours;
  return d.months * HOURS_PER_MONTH;
}

const TERM_TO_RATE: Record<Term, RateType> = {
  payg: 'payg',
  '1y': 'ri1y',
  '3y': 'ri3y',
};

/** One BoM line ported (or attempted) to a single provider. */
export interface PortedLine {
  /** The original BoM line's SKU on the base cloud. */
  baseVmSizeName: string;
  quantity: number;
  region?: string;
  /** The matched equivalent SKU on this provider, or null when unmatched. */
  matchVmSizeName: string | null;
  /** 0–100 similarity of the match (100 for the base cloud's own line). */
  matchPct: number | null;
  /** Match quality band ('exact' | 'close' | 'loose'), or null when unmatched. */
  matchQuality: string | null;
  /** Monthly USD for this whole line (rate × 730 × quantity), or null when the
   *  match has no resolvable rate / there is no match. */
  monthlyUsd: number | null;
  /** Per-line HOURLY USD at the chosen term (per-unit rate × quantity), or null
   *  when unpriced. Multiply by 24 / 730 / 8760 for $/day · $/mo · $/yr, or by an
   *  arbitrary duration's hours for the run-duration total (`durationTotalUsd`).
   *  Optional so legacy callers that ignore it are unaffected. */
  hourlyUsd?: number | null;
  /** Total USD for this line over the requested DurationSpec (hourlyUsd ×
   *  durationHours), or null when unpriced. Only populated when `portBom` (etc.)
   *  is called with a `duration`; otherwise undefined. */
  durationTotalUsd?: number | null;
  /** True when the rate for this line was estimated (RI from PAYG). */
  estimated: boolean;
}

/** A full BoM priced on one provider. */
export interface PortedScenario {
  provider: string;
  lines: PortedLine[];
  /** Σ of the lines that priced (null line costs excluded). */
  monthlyTotalUsd: number;
  /** Σ of the lines' hourly costs (null line costs excluded). Always present —
   *  it's just monthlyTotalUsd / 730 in aggregate, but summed per-line so a
   *  $/hr · $/day · $/yr breakdown is exact. */
  hourlyTotalUsd: number;
  /** Σ of the lines' durationTotalUsd over the requested DurationSpec, or null
   *  when the scenario was built without a `duration`. */
  durationTotalUsd?: number | null;
  matchedLines: number;
  unmatchedLines: number;
  /** S66 — lines that actually CONTRIBUTED to `monthlyTotalUsd` (monthlyUsd
   *  non-null). A matched line whose rate didn't resolve counts as matched but
   *  NOT priced, so `pricedLines < matchedLines` flags a silently-undercounted
   *  total. A scenario is "fully priced" iff pricedLines === its line count. */
  pricedLines: number;
  /** Quantity-weighted average matchPct across matched lines, or null. */
  avgMatchPct: number | null;
  /** True when any priced line used an estimated rate. */
  anyEstimated: boolean;
}

export interface BomPortResult {
  baseProvider: string;
  baseScenario: PortedScenario;
  targetScenarios: PortedScenario[];
  verdict: {
    cheapestProvider: string | null;
    headline: string;
    insights: string[];
  };
}

/**
 * Distinct catalog rows by `vmSizeName` (first wins). Specs are region-free, so
 * deduping gives a clean candidate pool for `bestVmMatch`.
 */
export function uniqueBySize(vms: CatalogEntry[]): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const vm of vms) {
    const key = vm.vmSizeName;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(vm);
  }
  return out;
}

const sameProvider = (vm: CatalogEntry, provider: string): boolean =>
  (vm.provider ?? '').toLowerCase() === provider.toLowerCase();

/** Resolve the catalog row for a SKU on a provider, preferring a region match. */
function resolveBaseEntry(
  userVms: CatalogEntry[],
  provider: string,
  vmSizeName: string,
  region?: string,
): CatalogEntry | null {
  const matches = userVms.filter(
    (vm) => sameProvider(vm, provider) && vm.vmSizeName === vmSizeName,
  );
  if (matches.length === 0) return null;
  if (region) {
    const inRegion = matches.find((vm) => vm.region === region);
    if (inRegion) return inRegion;
  }
  return matches[0];
}

/**
 * Monthly USD for one VM at a term: resolved hourly rate × HOURS_PER_MONTH.
 * `usd` is null when no rate resolves (unpriced SKU / unestimated RI).
 */
export function monthlyCostOf(
  vm: CatalogEntry,
  term: Term,
  estimateOn: boolean,
): { usd: number | null; estimated: boolean } {
  const { value, estimated } = resolveDisplayRate(vm, TERM_TO_RATE[term], estimateOn);
  if (value == null) return { usd: null, estimated };
  return { usd: value * HOURS_PER_MONTH, estimated };
}

/**
 * Per-unit HOURLY USD for one VM at a term: the resolved per-hour rate itself.
 * `usd` is null when no rate resolves. The hourly rate is the single basis from
 * which $/day (×24), $/month (×730), $/year (×8760), and any run-duration total
 * (×durationHours) are derived in the UI — so we resolve it once here.
 */
export function hourlyCostOf(
  vm: CatalogEntry,
  term: Term,
  estimateOn: boolean,
): { usd: number | null; estimated: boolean } {
  const { value, estimated } = resolveDisplayRate(vm, TERM_TO_RATE[term], estimateOn);
  if (value == null) return { usd: null, estimated };
  return { usd: value, estimated };
}

/** Aggregate a list of ported lines into a scenario rollup for `provider`.
 *  `hasDuration` flags whether the lines carry a `durationTotalUsd` (the caller
 *  passed a DurationSpec) so the scenario's duration total stays null otherwise. */
function aggregate(
  provider: string,
  lines: PortedLine[],
  hasDuration: boolean,
): PortedScenario {
  let monthlyTotalUsd = 0;
  let hourlyTotalUsd = 0;
  let durationTotalUsd = 0;
  let matchedLines = 0;
  let unmatchedLines = 0;
  let pricedLines = 0;
  let anyEstimated = false;
  let pctWeightSum = 0;
  let pctQtySum = 0;
  for (const line of lines) {
    if (line.matchVmSizeName == null) {
      unmatchedLines++;
    } else {
      matchedLines++;
      if (line.matchPct != null) {
        pctWeightSum += line.matchPct * line.quantity;
        pctQtySum += line.quantity;
      }
    }
    if (line.monthlyUsd != null) {
      monthlyTotalUsd += line.monthlyUsd;
      pricedLines++;
    }
    if (line.hourlyUsd != null) hourlyTotalUsd += line.hourlyUsd;
    if (line.durationTotalUsd != null) durationTotalUsd += line.durationTotalUsd;
    if (line.estimated) anyEstimated = true;
  }
  const avgMatchPct = pctQtySum > 0 ? pctWeightSum / pctQtySum : null;
  return {
    provider,
    lines,
    monthlyTotalUsd,
    hourlyTotalUsd,
    durationTotalUsd: hasDuration ? durationTotalUsd : null,
    matchedLines,
    unmatchedLines,
    pricedLines,
    avgMatchPct,
    anyEstimated,
  };
}

/**
 * Price the BoM as-is on its base cloud. Each line maps to itself at 100%
 * match. Lines whose SKU isn't found in the catalog (or has no rate) price
 * to null but still count as "matched" to themselves.
 */
export function baseScenarioOf(
  bom: BomEntry[],
  userVms: CatalogEntry[],
  baseProvider: string,
  term: Term,
  estimateOn: boolean,
  duration?: DurationSpec,
): PortedScenario {
  const durationHours = duration != null ? durationToHours(duration) : null;
  const lines: PortedLine[] = bom.map((entry) => {
    const base = resolveBaseEntry(userVms, baseProvider, entry.vmSizeName, entry.region);
    if (!base) {
      return {
        baseVmSizeName: entry.vmSizeName,
        quantity: entry.quantity,
        region: entry.region,
        matchVmSizeName: entry.vmSizeName,
        matchPct: 100,
        matchQuality: 'exact',
        monthlyUsd: null,
        hourlyUsd: null,
        durationTotalUsd: durationHours != null ? null : undefined,
        estimated: false,
      };
    }
    const { usd, estimated } = monthlyCostOf(base, term, estimateOn);
    const { usd: hourly } = hourlyCostOf(base, term, estimateOn);
    const lineHourly = hourly != null ? hourly * entry.quantity : null;
    return {
      baseVmSizeName: entry.vmSizeName,
      quantity: entry.quantity,
      region: entry.region,
      matchVmSizeName: entry.vmSizeName,
      matchPct: 100,
      matchQuality: 'exact',
      monthlyUsd: usd != null ? usd * entry.quantity : null,
      hourlyUsd: lineHourly,
      durationTotalUsd:
        durationHours != null ? (lineHourly != null ? lineHourly * durationHours : null) : undefined,
      estimated,
    };
  });
  return aggregate(baseProvider, lines, durationHours != null);
}

/**
 * Port every BoM line from `baseProvider` to `targetProvider` and price the
 * equivalents. For each line: resolve the base catalog row, gather the target
 * provider's distinct candidates, `bestVmMatch` → the equivalent, then price
 * (equivalent rate × quantity).
 */
export function portBomToProvider(
  bom: BomEntry[],
  userVms: CatalogEntry[],
  baseProvider: string,
  targetProvider: string,
  term: Term,
  estimateOn: boolean,
  duration?: DurationSpec,
): PortedScenario {
  const durationHours = duration != null ? durationToHours(duration) : null;
  const candidates = uniqueBySize(userVms.filter((vm) => sameProvider(vm, targetProvider)));
  const lines: PortedLine[] = bom.map((entry) => {
    const blank: PortedLine = {
      baseVmSizeName: entry.vmSizeName,
      quantity: entry.quantity,
      region: entry.region,
      matchVmSizeName: null,
      matchPct: null,
      matchQuality: null,
      monthlyUsd: null,
      hourlyUsd: null,
      durationTotalUsd: durationHours != null ? null : undefined,
      estimated: false,
    };
    const base = resolveBaseEntry(userVms, baseProvider, entry.vmSizeName, entry.region);
    if (!base || candidates.length === 0) return blank;
    const match = bestVmMatch(base, candidates);
    if (!match) return blank;
    const { usd, estimated } = monthlyCostOf(match.vm, term, estimateOn);
    const { usd: hourly } = hourlyCostOf(match.vm, term, estimateOn);
    const lineHourly = hourly != null ? hourly * entry.quantity : null;
    return {
      baseVmSizeName: entry.vmSizeName,
      quantity: entry.quantity,
      region: entry.region,
      matchVmSizeName: match.vm.vmSizeName,
      matchPct: matchPct(match.distance),
      matchQuality: match.quality,
      monthlyUsd: usd != null ? usd * entry.quantity : null,
      hourlyUsd: lineHourly,
      durationTotalUsd:
        durationHours != null ? (lineHourly != null ? lineHourly * durationHours : null) : undefined,
      estimated,
    };
  });
  return aggregate(targetProvider, lines, durationHours != null);
}

const fmtUsd = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

/**
 * Port the BoM from `baseProvider` to every target, then rank by monthly total
 * and build a plain-language verdict (cheapest re-platform target + caveats).
 */
export function portBom(
  bom: BomEntry[],
  userVms: CatalogEntry[],
  baseProvider: string,
  targetProviders: string[],
  term: Term,
  estimateOn: boolean,
  duration?: DurationSpec,
): BomPortResult {
  const baseScenario = baseScenarioOf(bom, userVms, baseProvider, term, estimateOn, duration);
  const targetScenarios = targetProviders.map((p) =>
    portBomToProvider(bom, userVms, baseProvider, p, term, estimateOn, duration),
  );

  // Rank candidates (base + targets) by monthly total, but only consider a
  // target a real "cheapest" if it actually mapped at least one line.
  const rankable = [baseScenario, ...targetScenarios].filter(
    (s) => s.provider === baseProvider || s.matchedLines > 0,
  );
  rankable.sort((a, b) => a.monthlyTotalUsd - b.monthlyTotalUsd);
  const cheapest = rankable[0] ?? null;

  const insights: string[] = [];
  let headline = '';

  // S66 — a savings claim is honest only when BOTH sides' totals cover every
  // BoM line. A scenario with unmatched or unpriced lines has an undercounted
  // total; comparing dollars against it fabricates the delta.
  const lineCount = bom.length;
  const fullyPriced = (s: PortedScenario): boolean =>
    s.lines.length > 0 && s.pricedLines === s.lines.length;

  if (!cheapest) {
    headline = `Could not price this ${baseProvider} BoM on any target cloud.`;
  } else if (cheapest.provider === baseProvider) {
    headline = fullyPriced(baseScenario)
      ? `This ${baseProvider} BoM is already the cheapest option at ${fmtUsd(
          baseScenario.monthlyTotalUsd,
        )}/mo — no target cloud undercuts it.`
      : `This ${baseProvider} BoM prices lowest at ${fmtUsd(
          baseScenario.monthlyTotalUsd,
        )}/mo, but its total covers only ${baseScenario.pricedLines} of ${lineCount} lines — totals are not fully comparable.`;
  } else if (fullyPriced(baseScenario) && fullyPriced(cheapest)) {
    const saving = baseScenario.monthlyTotalUsd - cheapest.monthlyTotalUsd;
    const pct =
      baseScenario.monthlyTotalUsd > 0
        ? Math.round((saving / baseScenario.monthlyTotalUsd) * 100)
        : 0;
    headline = `Re-platforming this ${baseProvider} BoM to ${cheapest.provider} saves ~${fmtUsd(
      saving,
    )}/mo (~${pct}%).`;
  } else {
    headline = `${cheapest.provider} prices this BoM lowest at ${fmtUsd(
      cheapest.monthlyTotalUsd,
    )}/mo, but not every line priced on both clouds — no savings vs ${baseProvider} is claimed.`;
  }

  // Unpriced-line disclosure — matched lines whose rate didn't resolve are
  // silently missing from a scenario's total unless said out loud (base included).
  for (const s of [baseScenario, ...targetScenarios]) {
    const unpriced = s.matchedLines - s.pricedLines;
    if (unpriced > 0) {
      insights.push(
        `${unpriced} line${unpriced === 1 ? '' : 's'} on ${s.provider} ha${
          unpriced === 1 ? 's' : 've'
        } no resolvable rate — excluded from its total.`,
      );
    }
  }

  // Match-quality caveats per target — equivalents are spec analogs, not
  // identical SKUs, so flag the average fidelity for validation.
  for (const s of targetScenarios) {
    if (s.avgMatchPct != null && s.matchedLines > 0) {
      insights.push(
        `${s.provider} equivalents average ${Math.round(
          s.avgMatchPct,
        )}% spec-match — validate memory-critical lines.`,
      );
    }
    if (s.unmatchedLines > 0) {
      insights.push(
        `${s.unmatchedLines} line${s.unmatchedLines === 1 ? '' : 's'} could not be mapped to ${
          s.provider
        } (no in-category equivalent in the catalog).`,
      );
    }
    if (s.anyEstimated) {
      insights.push(
        `${s.provider} pricing includes estimated reserved rates for some lines.`,
      );
    }
  }

  return {
    baseProvider,
    baseScenario,
    targetScenarios,
    verdict: {
      cheapestProvider: cheapest ? cheapest.provider : null,
      headline,
      insights,
    },
  };
}

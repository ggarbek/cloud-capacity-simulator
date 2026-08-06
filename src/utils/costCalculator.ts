/**
 * costCalculator (v2.45) — pure cross-cloud cost model.
 *
 * Powers an interactive cost calculator: the user picks, per provider, a VM
 * size + region + quantity + a run duration + a commitment term (PAYG / 1-yr
 * RI / 3-yr RI). This module prices each line off the SAME public-catalog rate
 * helpers the rest of the app uses, rolls them up per provider, and synthesizes
 * an executive verdict ("GCP is the lowest at $X over 12 months; ~18% under
 * Azure; switching to a 3-yr RI would cut it a further …").
 *
 * Purity contract (same as src/engine/): no React, no DOM, no global state.
 * Rate lookup is REUSED from regionRates + estimatedRate — never reimplemented.
 */
import type { CatalogEntry } from '../types';
import { HOURS_PER_MONTH } from '../types';
import { regionRatesFor, regionsForVm, type RegionRate } from './regionRates';
import { resolveDisplayRate } from './estimatedRate';
import type { RateType } from '../engine/insights';

/** Commitment term the user selected for a line. */
export type Term = 'payg' | '1y' | '3y';

/** One calculator line: a quantity of a VM size in a region under a term. */
export interface CostLine {
  provider: string;
  vmSizeName: string;
  region: string;
  quantity: number;
  term: Term;
}

/** A run duration — expressed in either hours or months (730 h/month). */
export type DurationSpec = { hours: number } | { months: number };

/** A priced line: the raw rate, per-line hourly + total, and provenance. */
export interface PricedLine extends CostLine {
  /** Per-unit hourly USD at the chosen term, or null when unpriced. */
  hourlyUsd: number | null;
  /** True when the rate had to be estimated / fell back (RI from PAYG). */
  estimated: boolean;
  /** hourlyUsd × quantity, or null when unpriced. */
  lineHourly: number | null;
  /** lineHourly × durationHours, or null when unpriced. */
  lineTotal: number | null;
  /** The duration this line was priced over, in hours. */
  durationHours: number;
}

/** Per-provider rollup of priced lines. */
export interface ProviderTotal {
  provider: string;
  lines: PricedLine[];
  /** Σ lineTotal across priced lines (unpriced lines excluded). */
  totalUsd: number;
  /** Any line used an estimated rate. */
  anyEstimated: boolean;
  /** Any line had no rate at all (excluded from totalUsd). */
  anyMissing: boolean;
}

/** Executive verdict comparing the providers. */
export interface CostVerdict {
  /** Cheapest provider with at least one priced line, or null. */
  cheapestProvider: string | null;
  /** Providers ranked by totalUsd ascending (all-missing providers excluded). */
  ranking: { provider: string; totalUsd: number }[];
  /** One-line headline naming the cheapest + the gap to the next. */
  headline: string;
  /** Supporting bullets (gap, term-switch delta, close-call note). */
  insights: string[];
}

export interface CostResult {
  perProvider: ProviderTotal[];
  verdict: CostVerdict;
  durationHours: number;
}

/** Convert a DurationSpec to hours (months × 730). */
export function durationToHours(d: DurationSpec): number {
  if ('hours' in d) return d.hours;
  return d.months * HOURS_PER_MONTH;
}

/** Map a calculator term onto the matching RegionRate column. */
export function rateForTerm(rr: RegionRate, term: Term): number | null {
  if (term === '1y') return rr.ri1 ?? null;
  if (term === '3y') return rr.ri3 ?? null;
  return rr.payg ?? null;
}

/** Calculator Term → financial RateType (for the resolveDisplayRate fallback). */
function termToRateType(term: Term): RateType {
  if (term === '1y') return 'ri1y';
  if (term === '3y') return 'ri3y';
  return 'payg';
}

/**
 * Price one line. Resolves the per-unit hourly rate via the per-region rate
 * list (`regionRatesFor`) for the line's region; if that region carries no
 * rate row, falls back to `resolveDisplayRate` on the first catalog entry for
 * the (provider, vmSizeName). `estimated` is set when the rate came from a
 * fallback/estimate rather than the published per-region figure. When no rate
 * can be found at all, hourlyUsd/lineHourly/lineTotal are null (→ anyMissing).
 */
export function priceLine(
  vms: CatalogEntry[],
  line: CostLine,
  durationHours: number,
): PricedLine {
  const base: PricedLine = {
    ...line,
    hourlyUsd: null,
    estimated: false,
    lineHourly: null,
    lineTotal: null,
    durationHours,
  };

  // 1) Published per-region rate for this exact region.
  const regionRate = regionRatesFor(vms, line.provider, line.vmSizeName).find(
    (r) => r.region === line.region,
  );
  let hourly: number | null = null;
  let estimated = false;
  if (regionRate) {
    hourly = rateForTerm(regionRate, line.term);
    // A region row exists but the chosen term's column is empty — try the
    // estimate fallback below rather than reporting "missing".
  }

  // 2) Fallback: estimate from the catalog entry (PAYG × provider RI factor),
  //    used when the region row is missing OR the term column is empty.
  if (hourly == null) {
    const entry = vms.find(
      (v) =>
        (v.provider ?? '') === line.provider &&
        v.vmSizeName === line.vmSizeName &&
        (line.region ? (v.region ?? '') === line.region : true),
    ) ??
      vms.find(
        (v) => (v.provider ?? '') === line.provider && v.vmSizeName === line.vmSizeName,
      );
    if (entry) {
      const resolved = resolveDisplayRate(entry, termToRateType(line.term), true);
      if (resolved.value != null) {
        hourly = resolved.value;
        // Estimated when it's an RI term with no published per-region figure,
        // OR resolveDisplayRate itself estimated it.
        estimated = resolved.estimated || (line.term !== 'payg' && regionRate == null);
      }
    }
  }

  if (hourly == null) return base;

  const lineHourly = hourly * line.quantity;
  return {
    ...base,
    hourlyUsd: hourly,
    estimated,
    lineHourly,
    lineTotal: lineHourly * durationHours,
  };
}

/** Round to whole dollars. */
function roundUsd(n: number): number {
  return Math.round(n);
}

/** Round a percentage to one decimal. */
function roundPct(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format a duration (in hours) human-readably for verdict copy. */
function describeDuration(hours: number): string {
  if (hours % HOURS_PER_MONTH === 0) {
    const months = hours / HOURS_PER_MONTH;
    if (months === 12) return '12 months';
    if (months % 12 === 0) return `${months / 12} years`;
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${roundUsd(hours)} hours`;
}

/** Pretty-print a whole-dollar USD amount with thousands separators. */
function fmtUsd(n: number): string {
  return `$${roundUsd(n).toLocaleString('en-US')}`;
}

/**
 * Price every line, group by provider, sum each provider's total (excluding
 * unpriced lines), rank providers ascending, and synthesize the verdict.
 */
export function computeCost(
  vms: CatalogEntry[],
  lines: CostLine[],
  duration: DurationSpec,
): CostResult {
  const durationHours = durationToHours(duration);

  // Price + group by provider, preserving first-seen provider order.
  const byProvider = new Map<string, ProviderTotal>();
  for (const line of lines) {
    const priced = priceLine(vms, line, durationHours);
    let pt = byProvider.get(line.provider);
    if (!pt) {
      pt = {
        provider: line.provider,
        lines: [],
        totalUsd: 0,
        anyEstimated: false,
        anyMissing: false,
      };
      byProvider.set(line.provider, pt);
    }
    pt.lines.push(priced);
    if (priced.lineTotal != null) {
      pt.totalUsd += priced.lineTotal;
      if (priced.estimated) pt.anyEstimated = true;
    } else {
      pt.anyMissing = true;
    }
  }

  const perProvider = [...byProvider.values()];

  // Rank: only providers with at least one priced line (a fully-missing
  // provider has totalUsd 0 but no real data — exclude it from the verdict).
  const ranking = perProvider
    .filter((p) => p.lines.some((l) => l.lineTotal != null))
    .map((p) => ({ provider: p.provider, totalUsd: p.totalUsd }))
    .sort((a, b) => a.totalUsd - b.totalUsd);

  const verdict = buildVerdict(vms, perProvider, ranking, durationHours);

  return { perProvider, verdict, durationHours };
}

/** Synthesize the headline + insight bullets from the ranking. */
function buildVerdict(
  vms: CatalogEntry[],
  perProvider: ProviderTotal[],
  ranking: { provider: string; totalUsd: number }[],
  durationHours: number,
): CostVerdict {
  const durationLabel = describeDuration(durationHours);

  if (ranking.length === 0) {
    return {
      cheapestProvider: null,
      ranking,
      headline: 'No priced lines — add a VM, region, and quantity to compare costs.',
      insights: [],
    };
  }

  const cheapest = ranking[0];
  const insights: string[] = [];

  if (ranking.length === 1) {
    const headline = `${cheapest.provider} is the only priced option at ${fmtUsd(
      cheapest.totalUsd,
    )} over ${durationLabel}.`;
    addTermSwitchInsight(vms, perProvider, cheapest.provider, durationHours, insights);
    return { cheapestProvider: cheapest.provider, ranking, headline, insights };
  }

  const next = ranking[1];
  const gapPct =
    next.totalUsd > 0 ? ((next.totalUsd - cheapest.totalUsd) / next.totalUsd) * 100 : 0;
  const gapPctR = roundPct(gapPct);

  const headline = `${cheapest.provider} is the lowest at ${fmtUsd(
    cheapest.totalUsd,
  )} over ${durationLabel}; ~${gapPctR}% under ${next.provider} (${fmtUsd(
    next.totalUsd,
  )}).`;

  // Gap to the next provider.
  insights.push(
    `${cheapest.provider} undercuts ${next.provider} by ${fmtUsd(
      next.totalUsd - cheapest.totalUsd,
    )} (~${gapPctR}%) over ${durationLabel}.`,
  );

  // Close-call note: when the gap is small, price shouldn't be the deciding
  // factor — non-price attributes (perf, generation, ecosystem) should decide.
  if (gapPct < 8) {
    insights.push(
      `The gap is narrow (<8%) — within modeling noise; let performance, instance generation, or ecosystem fit decide rather than price alone.`,
    );
  }

  // Term-switch insight for the cheapest provider (PAYG vs 3-yr RI delta).
  addTermSwitchInsight(vms, perProvider, cheapest.provider, durationHours, insights);

  return { cheapestProvider: cheapest.provider, ranking, headline, insights };
}

/**
 * Add an insight comparing the cheapest provider's current cost against the
 * same lines re-priced at a 3-yr RI term — quantifying the commitment upside.
 * Only added when it would materially change cost AND isn't already 3-yr.
 */
function addTermSwitchInsight(
  vms: CatalogEntry[],
  perProvider: ProviderTotal[],
  provider: string,
  durationHours: number,
  insights: string[],
): void {
  const pt = perProvider.find((p) => p.provider === provider);
  if (!pt) return;
  const pricedLines = pt.lines.filter((l) => l.lineTotal != null);
  if (pricedLines.length === 0) return;

  // Already all-3y? Compare against PAYG instead, to show what the commitment
  // is saving. Otherwise compare the current mix against an all-3y re-price.
  const allThreeYr = pricedLines.every((l) => l.term === '3y');
  const targetTerm: Term = allThreeYr ? 'payg' : '3y';

  let targetTotal = 0;
  let anyTargetPriced = false;
  for (const l of pricedLines) {
    const re = priceLine(
      vms,
      { ...l, term: targetTerm },
      durationHours,
    );
    if (re.lineTotal != null) {
      targetTotal += re.lineTotal;
      anyTargetPriced = true;
    } else {
      // Can't re-price this line at the target term → keep its current cost so
      // the comparison stays apples-to-apples (no phantom savings).
      targetTotal += l.lineTotal!;
    }
  }
  if (!anyTargetPriced) return;

  const current = pt.totalUsd;
  const delta = current - targetTotal; // positive → target is cheaper
  if (current <= 0) return;
  const deltaPct = roundPct((Math.abs(delta) / current) * 100);

  if (Math.abs(delta) < 1 || deltaPct < 1) {
    return; // immaterial — don't clutter the verdict.
  }

  if (allThreeYr) {
    // Current is 3y; PAYG would cost MORE (delta negative) → quantify savings.
    if (delta < 0) {
      insights.push(
        `${provider}'s 3-yr RI commitment saves ~${fmtUsd(
          -delta,
        )} (~${deltaPct}%) versus pay-as-you-go.`,
      );
    }
  } else if (delta > 0) {
    insights.push(
      `Switching ${provider} to a 3-yr RI would cut its cost ~${fmtUsd(
        delta,
      )} (~${deltaPct}%) — material enough to weigh against the commitment.`,
    );
  }
}

/**
 * Thin reuse of `regionsForVm` for the calculator's region dropdown: the
 * distinct regions where (provider, vmSizeName) is available, in catalog order.
 */
export function comparableRegionsFor(
  vms: CatalogEntry[],
  provider: string,
  vmSizeName: string,
): string[] {
  return regionsForVm(vms, provider, vmSizeName);
}

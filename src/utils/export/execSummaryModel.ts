/**
 * execSummaryModel — the presentation-agnostic data models the Executive
 * Summary export (Wave 2 / C3) builds from the live CMA comparison + BoM state,
 * and that any exporter (PPTX / DOCX / print) renders from.
 *
 * The two builders below are PURE and fully serializable (no React, no DOM) so
 * they're trivially unit-testable and can run in a click handler. They consume
 * ONLY their passed args (zero re-derivation of engine state) — the caller
 * (CompetitivePage's exec block) already holds the memoized WinnerAnalysis /
 * HorizonCost[] / PriceBar[] / SpecDelta[] / BomPortResult, so we just map them
 * onto the frozen interfaces below.
 */
import type { Term } from '../costCalculator';
import type { WinnerAnalysis, HorizonCost, PriceBar, SpecDelta } from '../../engine/competitive';
import type { BomPortResult } from '../bomPort';
import type { BomEntry, CatalogEntry } from '../../types';
import { worstCaveat, type MatchCaveat } from '../matchCaveats';
import type { SpecComparison } from '../specInsights';
import type { MarketGapReport } from '../marketGaps';
import {
  buildVerdictQuant,
  verdictFromHorizons,
  buildFamilyStories,
  buildSizeShowdown,
  buildMarketGapsExport,
  buildLineHighlights,
  buildRecommendation,
  fmtUsdFull,
  type VerdictQuant,
  type FamilyStory,
  type SizeShowdown,
  type MarketGapsExport,
  type LineHighlight,
  type ExecRecommendation,
} from './execNarratives';
// S66 — shared screen formatters (frozen tokens); the scope line and rate labels
// must read identically to the on-screen term pills / verdict copy.
import { fmtPct, termLabelLong, termLabelShort } from '../../components/compare/ui/tokens';
// S66 fix-b — the SAME gated verdict math + qty-weighted match the on-screen
// Exec Summary uses (execBriefMath is the screen's selector module; read-only
// import so screen === deck by construction, never by parallel re-derivation).
import { bomVerdict, weightedTargetMatch } from '../../components/compare/execBriefMath';

/**
 * Collect the distinct comparability-caveat strings from a set of caveat lists,
 * one per source (a bar / horizon / ported line). We surface the WORST caveat's
 * detail per source (the single most important asterisk), attribute it to its
 * provider, and dedupe — so the export's `caveats[]` reads as a short, honest
 * list of "not apples-to-apples" notes rather than a firehose of every axis.
 */
function collectCaveatStrings(
  sources: { provider?: string; caveats?: MatchCaveat[] }[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sources) {
    const worst = worstCaveat(s.caveats ?? []);
    if (!worst) continue;
    const who = (s.provider ?? '').trim();
    const line = who ? `${who}: ${worst.detail}` : worst.detail;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

/** The full comparison-view export model (Specs / Pricing / Region across the
 *  selected clouds), captured at a point in time + commitment term. */
export interface ExecComparisonModel {
  mode: 'comparison';
  generatedAt: string;
  term: Term;
  baseline: { provider: string; sku: string };
  verdict: { headline: string; bestAt: { provider: string; tags: string[] }[] };
  kpis: { regionCount: number; costDeltaPct: number | null; specMatchPct: number | null; marketGaps: number };
  costMatrix: { provider: string; sku: string; monthly: number | null; paygMonthly: number | null; oneYear: number | null; threeYear: number | null; rateLabel: string }[];
  rateBars: { provider: string; sku: string; payg: number | null; oneYr: number | null; threeYr: number | null; region?: string; regionComparable?: boolean }[];
  specDeltas: { provider: string; metric: string; direction: 'more' | 'less'; detail: string }[];
  footprint: { totalMarks: number; perProvider: { provider: string; regions: number }[] };
  caveats: string[];
  // ── S65 — executive intelligence (additive) ──────────────────────────
  /** The quantified answer: cheapest option + $ / % savings vs base. */
  verdictQuant?: VerdictQuant;
  /** Per-cloud "what you're comparing" — family, category, generation,
   *  strengths, one tradeoff, match% + caveat. */
  familyStories?: FamilyStory[];
  /** Size-for-size table (vCPU / memory / network / NVMe / processor / $). */
  sizeShowdown?: SizeShowdown;
  /** The base cloud's regional market gaps vs the competitors. */
  marketGaps?: MarketGapsExport;
  // ── S66 — leadership arc (additive) ──────────────────────────────────
  /** The synthesized adopt / stay / validate / watch recommendation bullets. */
  recommendation?: ExecRecommendation;
  /** One-line scope statement ("{base} {sku} vs cross-cloud equivalents ·
   *  priced at {term}") for the title slide / brief header. */
  scope?: string;
}

/** The VM-BoM export model (the user's committed Bill of Materials ported
 *  cross-cloud, priced at a commitment term). */
export interface ExecBomModel {
  mode: 'bom';
  generatedAt: string;
  term: Term;
  baseProvider: string;
  verdict: { headline: string; insights: string[]; cheapestProvider: string | null };
  totals: { provider: string; monthlyUsd: number; avgMatchPct: number | null; matched: number; unmatched: number; estimated: boolean }[];
  lines: {
    index: number;
    baseSku: string;
    qty: number;
    region?: string;
    perCloud: { provider: string; sku: string | null; matchPct: number | null; monthlyUsd: number | null }[];
  }[];
  regionsCovered: number;
  caveats: string[];
  // ── S65 — executive intelligence (additive) ──────────────────────────
  /** The quantified answer: cheapest scenario total + $ / % savings vs base. */
  verdictQuant?: VerdictQuant;
  /** The few lines that drive cost / where a cheaper cloud exists. */
  lineHighlights?: LineHighlight[];
  /** The base cloud's regional market gaps (from BoM regions, else full-catalog). */
  marketGaps?: MarketGapsExport;
  // ── S66 — leadership arc (additive) ──────────────────────────────────
  /** The synthesized adopt / stay / validate / watch recommendation bullets. */
  recommendation?: ExecRecommendation;
  /** One-line scope statement ("{N}-line BoM ported from {base} to {clouds} ·
   *  priced at {term}") for the title slide / brief header. */
  scope?: string;
  // ── S66 fix-b — honest-savings gate + qty-weighted match (additive) ───
  /** QTY-WEIGHTED average spec match of the target clouds' matched lines — the
   *  SAME `weightedTargetMatch` figure the on-screen KPI shows (screen === deck).
   *  Label it "qty-weighted" wherever quoted. null when nothing matched. */
  avgTargetMatchPct?: number | null;
  /** True when the savings-vs-base claim is suppressed because either side's
   *  BoM total is undercounted (unmatched lines). When set, `verdictQuant`'s
   *  savings fields are nulled so no artifact can state "$X below base". */
  savingsSuppressed?: boolean;
  /** Why the savings figure is suppressed — disclosed in the Risks section. */
  suppressReason?: string | null;
}

/** Map a HorizonCost row's `bestRateLabel` (or the requested term) to a stable
 *  display label. Prefers the engine's own label when it isn't the placeholder;
 *  the fallback uses the SAME short term label the on-screen pills use. */
function rateLabelFor(h: HorizonCost, term: Term): string {
  if (h.bestRateLabel && h.bestRateLabel !== '—') return h.bestRateLabel;
  return termLabelShort(term);
}

/**
 * Build the comparison-mode export model. All inputs are the exec block's own
 * memos; nothing is re-derived.
 *
 * `costDeltaPct` = how much cheaper/pricier the cheapest non-base horizon is vs
 * the base at this term (negative = the cheapest analog undercuts the base).
 * `specMatchPct` is left null here (the comparison view doesn't carry a single
 * blended match %); the KPI hero surfaces best-at instead.
 */
export function buildExecComparisonModel(args: {
  analysis: WinnerAnalysis;
  horizons: HorizonCost[];
  bars: PriceBar[];
  awsDeltas: SpecDelta[];
  gcpDeltas: SpecDelta[];
  markCount: number;
  perProviderRegions: { provider: string; regions: number }[];
  baseline: string;
  baselineProvider: string;
  term: Term;
  // ── S65 — inputs for the executive intelligence (all optional so existing
  //         callers/tests keep working; enrichment is added when supplied) ──
  /** The base + target catalog rows, in display order, for family stories +
   *  the size showdown. When absent, those fields stay undefined. */
  compareRows?: { provider: string; row: CatalogEntry }[];
  /** specInsights comparison over the SAME rows (reuses standout/nuance/weakness). */
  specComparison?: SpecComparison | null;
  /** Match% per provider (base = 100). */
  matchByProvider?: Record<string, number | null>;
  /** Worst comparability caveat per provider. */
  caveatsByProvider?: Record<string, MatchCaveat[] | undefined>;
  /** The base-POV market-gap report (already scoped). */
  marketGapReport?: MarketGapReport | null;
}): ExecComparisonModel {
  const {
    analysis,
    horizons,
    bars,
    awsDeltas,
    gcpDeltas,
    markCount,
    perProviderRegions,
    baseline,
    baselineProvider,
    term,
    compareRows,
    specComparison,
    matchByProvider,
    caveatsByProvider,
    marketGapReport,
  } = args;

  // ── Verdict + situational best-at ─────────────────────────────────────
  const winners = analysis?.winners;
  const bestAtMap = new Map<string, string[]>();
  const pushBest = (provider: string | undefined, tag: string) => {
    if (!provider) return;
    const prev = bestAtMap.get(provider) ?? [];
    prev.push(tag);
    bestAtMap.set(provider, prev);
  };
  pushBest(winners?.cost?.provider, 'Lowest rate');
  pushBest(winners?.compute?.provider, 'Most compute');
  pushBest(winners?.memory?.provider, 'Most memory');
  pushBest(winners?.network?.provider, 'Fastest network');
  const bestAt = Array.from(bestAtMap.entries()).map(([provider, tags]) => ({ provider, tags }));

  const overall = winners?.overall ?? null;
  const headline = overall
    ? `${overall.provider} ${overall.sku} leads overall for this pairing; each cloud wins on specific dimensions below.`
    : `Cross-cloud comparison for ${baselineProvider} ${baseline} — situational strengths by dimension below.`;

  // ── Cost matrix + cost delta ──────────────────────────────────────────
  const costMatrix = (horizons ?? []).map((h) => ({
    provider: h.provider,
    sku: h.sku,
    monthly: h.oneMonthBest,
    // S65 — the TRUE PAYG monthly (not the term-applied monthly), so the
    // commitment-economics callout can compare PAYG-annual vs 3-yr effective
    // annual honestly. `oneMonthBest` at a committed term is the RI monthly,
    // which would make a "vs PAYG" saving compare a rate against itself.
    paygMonthly: h.oneMonthPayg,
    oneYear: h.oneYearBest,
    threeYear: h.threeYearBest,
    rateLabel: rateLabelFor(h, term),
  }));

  const baseHorizon = (horizons ?? []).find((h) => h.provider === baselineProvider);
  const baseMonthly = baseHorizon?.oneMonthBest ?? null;
  const otherMonthlies = (horizons ?? [])
    .filter((h) => h.provider !== baselineProvider && h.oneMonthBest != null)
    .map((h) => h.oneMonthBest as number);
  let costDeltaPct: number | null = null;
  if (baseMonthly != null && baseMonthly > 0 && otherMonthlies.length > 0) {
    const cheapest = Math.min(...otherMonthlies);
    costDeltaPct = Math.round(((cheapest - baseMonthly) / baseMonthly) * 1000) / 10;
  }

  // ── Rate bars (region-matched, from the exec memo) ────────────────────
  const rateBars = (bars ?? []).map((b) => ({
    provider: b.provider,
    sku: b.sku,
    payg: b.payg,
    oneYr: b.oneYr,
    threeYr: b.threeYr,
    region: b.region,
    regionComparable: b.regionComparable,
  }));

  // ── Spec deltas (AWS + GCP) → flattened, direction-tagged ─────────────
  const specDeltas: ExecComparisonModel['specDeltas'] = [];
  const collect = (provider: string, deltas: SpecDelta[]) => {
    for (const d of deltas ?? []) {
      specDeltas.push({
        provider,
        metric: d.dim,
        direction: d.equivalentBetter ? 'more' : 'less',
        detail: d.summary,
      });
    }
  };
  collect('AWS', awsDeltas);
  collect('GCP', gcpDeltas);

  // ── Comparability caveats — the honest asterisks ──────────────────────
  // Worst comparability caveat per contender (from the rate bars + cost
  // horizons, which carry the winning match's caveats), plus a geographic note
  // for any bar priced outside a region near the base. Deduped into one list.
  const caveats = collectCaveatStrings([...(bars ?? []), ...(horizons ?? [])]);
  for (const b of bars ?? []) {
    if (b.regionComparable === false) {
      const note = `${b.provider}: priced at ${b.region ?? 'its nearest available region'}, not a region near the ${baselineProvider} base — not a like-for-like geographic peer.`;
      if (!caveats.includes(note)) caveats.push(note);
    }
  }

  // ── S65 — executive intelligence (only when the caller supplies the rows) ──
  const monthlyByProvider: Record<string, number | null> = {};
  for (const h of horizons ?? []) monthlyByProvider[h.provider] = h.oneMonthBest;

  // Route through the `verdictFromHorizons` wrapper (the single horizons→verdict
  // path) instead of re-mapping the matrix inline — so the wrapper is the one
  // place that knows how to turn a cost matrix into the quantified verdict.
  const verdictQuant = verdictFromHorizons(horizons ?? [], baselineProvider, term) ?? undefined;

  const familyStories =
    compareRows && compareRows.length
      ? buildFamilyStories(
          compareRows,
          specComparison ?? null,
          matchByProvider ?? {},
          caveatsByProvider ?? {},
        )
      : undefined;

  const sizeShowdown =
    compareRows && compareRows.length ? buildSizeShowdown(compareRows, monthlyByProvider) : undefined;

  const marketGaps = marketGapReport ? buildMarketGapsExport(marketGapReport) : undefined;

  // ── S66 — the leadership arc: recommendation + scope line ─────────────
  // Average spec parity of the non-base analogs (the honest "NN% parity" the
  // adopt bullet quotes) — straight mean of the caller-supplied match %s.
  const targetMatches = Object.entries(matchByProvider ?? {})
    .filter(([p, v]) => p !== baselineProvider && v != null)
    .map(([, v]) => v as number);
  const avgTargetMatchPct = targetMatches.length
    ? targetMatches.reduce((a, b) => a + b, 0) / targetMatches.length
    : null;
  const baseCategory = compareRows?.find((r) => r.provider === baselineProvider)?.row.category ?? '';
  const recommendation = buildRecommendation({
    baseProvider: baselineProvider,
    baseLabel: `${baselineProvider} ${baseline}`,
    workload: baseCategory ? `${baseCategory.toLowerCase()} workloads` : undefined,
    term,
    verdict: verdictQuant ?? null,
    avgMatchPct: avgTargetMatchPct,
    caveats,
    marketGaps: marketGaps ?? null,
  });
  const scope = `${baselineProvider} ${baseline} vs cross-cloud equivalents · priced at ${termLabelLong(term)}`;

  return {
    mode: 'comparison',
    generatedAt: new Date().toISOString(),
    term,
    baseline: { provider: baselineProvider, sku: baseline },
    verdict: { headline, bestAt },
    kpis: {
      regionCount: markCount,
      costDeltaPct,
      specMatchPct: null,
      marketGaps: marketGaps?.gapCount ?? 0,
    },
    costMatrix,
    rateBars,
    specDeltas,
    footprint: { totalMarks: markCount, perProvider: perProviderRegions ?? [] },
    caveats,
    verdictQuant,
    familyStories,
    sizeShowdown,
    marketGaps,
    recommendation,
    scope,
  };
}

/**
 * S66 fix-b — the honest BoM headline, derived from the SAME gated verdict math
 * the screen uses (verdictQuant delegates to buildVerdictQuant, the core
 * execBriefMath.bomVerdict wraps). The engine's `ported.verdict.headline` is
 * NEVER passed through: with an unpriced base, bomPort's rankable sort can put a
 * $0 base first and the engine headline claims "already the cheapest at $0/mo".
 */
function honestBomHeadline(args: {
  n: number;
  baseProvider: string;
  term: Term;
  verdictQuant: VerdictQuant | undefined;
  baseTotal: number | null;
  savingsSuppressed: boolean;
  suppressReason: string | null;
}): string {
  const { n, baseProvider, term, verdictQuant: v, baseTotal, savingsSuppressed, suppressReason } = args;
  const termLong = termLabelLong(term);
  const lineWord = `${n}-line`;
  if (!v) {
    return `No published rates price this ${lineWord} BoM on ${baseProvider} or the selected clouds at ${termLong} — totals unavailable.`;
  }
  if (v.cheapestProvider === baseProvider) {
    return `${baseProvider} is already the least-cost home for this ${lineWord} BoM at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo).`;
  }
  // An entirely-unpriced base outranks the generic suppression sentence — the
  // reader's first fact is the missing base rate, not the incomparability.
  if (baseTotal == null) {
    return `No published rates price this ${lineWord} BoM on ${baseProvider}; ${v.cheapestProvider} carries the lowest priced total (${fmtUsdFull(v.monthlyUsd)}/mo at ${termLong}) — directional only.`;
  }
  if (savingsSuppressed) {
    return `${v.cheapestProvider} prices the lowest BoM total at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo), but ${suppressReason ?? 'unmatched lines are excluded from one side'} — totals are not directly comparable, so no savings vs ${baseProvider} is stated.`;
  }
  if (v.savingsVsBaseUsd != null && v.savingsVsBaseUsd > 0) {
    return `Porting this ${lineWord} BoM to ${v.cheapestProvider} costs ${fmtUsdFull(v.monthlyUsd)}/mo at ${termLong} — ${fmtUsdFull(v.savingsVsBaseUsd)}/mo (${fmtPct(v.savingsVsBasePct)}) below ${baseProvider}.`;
  }
  if (v.savingsVsBaseUsd != null) {
    return `${v.cheapestProvider} and ${baseProvider} are effectively at parity for this ${lineWord} BoM at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo) — a coin flip at list prices.`;
  }
  return `${v.cheapestProvider} carries the lowest priced BoM total at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo).`;
}

/**
 * Build the VM-BoM export model from the shared `BomPortResult`. Maps the base
 * scenario + each target scenario onto per-cloud totals, and every BoM line
 * onto its per-cloud match/price. Nothing is re-priced.
 */
export function buildExecBomModel(args: {
  ported: BomPortResult;
  bom: BomEntry[];
  regionsCovered: number;
  term: Term;
  /** S65 — base-POV market-gap report (from the BoM deployment regions where
   *  feasible, else the full-catalog view; the note distinguishes them). */
  marketGapReport?: MarketGapReport | null;
  /** S65 — a note qualifying the market-gap scope (e.g. "full-catalog view"). */
  marketGapNote?: string;
}): ExecBomModel {
  const { ported, bom, regionsCovered, term, marketGapReport, marketGapNote } = args;
  const scenarios = [ported.baseScenario, ...ported.targetScenarios];

  // ── Comparability caveats for the BoM port ────────────────────────────
  // PortedLine predates the shared caveat layer, so we derive the honest notes
  // from each TARGET scenario's aggregate signals: lines with no same-category
  // analog (unmatched), a weak average match (stretch — closest, not exact), and
  // estimated (PAYG-derived) rates. Deduped into one short list.
  const STRETCH_AVG_PCT = 60;
  const bomCaveats: string[] = [];
  for (const s of ported.targetScenarios) {
    if (s.unmatchedLines > 0) {
      bomCaveats.push(
        `${s.provider}: ${s.unmatchedLines} line${s.unmatchedLines === 1 ? '' : 's'} have no same-category equivalent — those lines are not priced on ${s.provider}.`,
      );
    }
    if (s.avgMatchPct != null && s.avgMatchPct < STRETCH_AVG_PCT) {
      bomCaveats.push(
        `${s.provider}: closest analogs average only ${Math.round(s.avgMatchPct)}% match — a stretch, not a like-for-like port.`,
      );
    }
    if (s.anyEstimated) {
      bomCaveats.push(
        `${s.provider}: some reserved-term rates are estimated from PAYG — directional, not a quoted RI price.`,
      );
    }
  }

  const totals = scenarios.map((s) => ({
    provider: s.provider,
    monthlyUsd: s.monthlyTotalUsd,
    avgMatchPct: s.avgMatchPct,
    matched: s.matchedLines,
    unmatched: s.unmatchedLines,
    estimated: s.anyEstimated,
  }));

  const lines: ExecBomModel['lines'] = bom.map((entry, i) => {
    const baseLine = ported.baseScenario.lines[i];
    const perCloud: ExecBomModel['lines'][number]['perCloud'] = [];
    // Base cloud first (its own line, 100% match).
    if (baseLine) {
      perCloud.push({
        provider: ported.baseProvider,
        sku: baseLine.matchVmSizeName,
        matchPct: baseLine.matchPct,
        monthlyUsd: baseLine.monthlyUsd,
      });
    }
    for (const s of ported.targetScenarios) {
      const tl = s.lines[i];
      perCloud.push({
        provider: s.provider,
        sku: tl?.matchVmSizeName ?? null,
        matchPct: tl?.matchPct ?? null,
        monthlyUsd: tl?.monthlyUsd ?? null,
      });
    }
    return {
      index: i,
      baseSku: entry.vmSizeName,
      qty: entry.quantity,
      region: entry.region,
      perCloud,
    };
  });

  // ── S65 — executive intelligence for the BoM ────────────────────────────
  // verdictQuant: cheapest scenario TOTAL vs the base scenario total.
  const baseTotal = ported.baseScenario.monthlyTotalUsd || null;
  let verdictQuant =
    buildVerdictQuant(
      scenarios.map((s) => ({ provider: s.provider, sku: `${s.provider} scenario`, monthlyUsd: s.monthlyTotalUsd || null })),
      baseTotal,
      term,
    ) ?? undefined;

  // ── S66 fix-b — honest-savings gate ────────────────────────────────────
  // Never state "$X below base" when either side's total is undercounted by
  // unmatched (excluded) lines. Consumes execBriefMath.bomVerdict's gate fields
  // when present (post-FIX-A API: savingsSuppressed / suppressReason /
  // exclusionsByProvider); falls back to an equivalent local gate so either
  // merge order compiles and stays honest.
  const bvRaw = bomVerdict(ported) as unknown as Record<string, unknown>;
  let savingsSuppressed = false;
  let suppressReason: string | null = null;
  if (typeof bvRaw.savingsSuppressed === 'boolean') {
    savingsSuppressed = bvRaw.savingsSuppressed;
    // The core's suppressReason is a machine token ('base-unpriced' /
    // 'base-partially-priced' / 'cheapest-partially-priced') — translate it
    // into the human sentence the artifacts print, built from the scenario
    // counts so the reader learns exactly what was excluded.
    const token = (bvRaw.suppressReason as string | null | undefined) ?? null;
    if (savingsSuppressed && token) {
      const cheapestScenario = scenarios.find(
        (s) => s.provider === verdictQuant?.cheapestProvider,
      );
      const excludedPhrase = (s: BomPortResult['baseScenario']): string => {
        const parts: string[] = [];
        if (s.unmatchedLines > 0) {
          parts.push(`${s.unmatchedLines} unmatched line${s.unmatchedLines === 1 ? '' : 's'}`);
        }
        const unpriced = Math.max(0, s.matchedLines - (s.pricedLines ?? s.matchedLines));
        if (unpriced > 0) parts.push(`${unpriced} unpriced line${unpriced === 1 ? '' : 's'}`);
        return parts.length > 0 ? parts.join(' and ') : 'lines missing from its total';
      };
      suppressReason =
        token === 'base-unpriced'
          ? `no published rate prices the ${ported.baseProvider} base BoM at this term`
          : token === 'base-partially-priced'
            ? `the ${ported.baseProvider} base total excludes ${excludedPhrase(ported.baseScenario)}`
            : cheapestScenario
              ? `the ${cheapestScenario.provider} total excludes ${excludedPhrase(cheapestScenario)}`
              : token;
    }
  } else if (verdictQuant && verdictQuant.cheapestProvider !== ported.baseProvider) {
    const cheapestScenario = scenarios.find((s) => s.provider === verdictQuant!.cheapestProvider);
    const reasons: string[] = [];
    if (ported.baseScenario.unmatchedLines > 0) {
      reasons.push(
        `the ${ported.baseProvider} base total excludes ${ported.baseScenario.unmatchedLines} unpriced line${ported.baseScenario.unmatchedLines === 1 ? '' : 's'}`,
      );
    }
    if (cheapestScenario && cheapestScenario.unmatchedLines > 0) {
      reasons.push(
        `the ${cheapestScenario.provider} total excludes ${cheapestScenario.unmatchedLines} unmatched line${cheapestScenario.unmatchedLines === 1 ? '' : 's'}`,
      );
    }
    if (reasons.length) {
      savingsSuppressed = true;
      suppressReason = reasons.join(' and ');
    }
  }
  if (savingsSuppressed && verdictQuant) {
    // Null the savings so NO consumer can print a "$X below base" claim.
    verdictQuant = { ...verdictQuant, savingsVsBaseUsd: null, savingsVsBasePct: null };
  }
  // Disclose the suppression + any per-provider exclusions in the Risks list.
  if (savingsSuppressed && suppressReason) {
    const line = `Savings vs ${ported.baseProvider} not stated — ${suppressReason}.`;
    if (!bomCaveats.includes(line)) bomCaveats.push(line);
  }
  const exclusions = bvRaw.exclusionsByProvider as { provider: string; lines: string[] }[] | undefined;
  if (Array.isArray(exclusions)) {
    for (const e of exclusions) {
      if (!e || !Array.isArray(e.lines) || e.lines.length === 0) continue;
      const line = `${e.provider}: excluded from totals — ${e.lines.join(', ')}`;
      if (!bomCaveats.includes(line)) bomCaveats.push(line);
    }
  }

  // lineHighlights: the lines that drive cost + where a cheaper cloud exists.
  const highlightLines = lines.map((ln) => {
    const baseEntry = ln.perCloud.find((c) => c.provider === ported.baseProvider);
    return {
      index: ln.index,
      baseSku: ln.baseSku,
      baseMonthlyUsd: baseEntry?.monthlyUsd ?? null,
      perCloud: ln.perCloud.map((c) => ({ provider: c.provider, monthlyUsd: c.monthlyUsd })),
    };
  });
  const lineHighlights = buildLineHighlights(highlightLines, ported.baseProvider);

  const marketGaps = marketGapReport
    ? buildMarketGapsExport(marketGapReport, marketGapNote)
    : undefined;

  // ── S66 — the leadership arc: recommendation + scope line ─────────────
  // S66 fix-b — ONE avg-match figure, the qty-weighted one the on-screen KPI
  // shows (weightedTargetMatch), labeled "qty-weighted" wherever quoted. The
  // old unweighted mean-of-per-cloud-averages disagreed with the screen.
  const avgTargetMatchPct = weightedTargetMatch(ported, bom);
  const targetProviders = ported.targetScenarios.map((s) => s.provider);
  const lineWord = `${bom.length}-line`;
  const recommendation = buildRecommendation({
    baseProvider: ported.baseProvider,
    baseLabel: `the ${lineWord} ${ported.baseProvider} BoM`,
    workload: 'placements in this VM portfolio',
    term,
    verdict: verdictQuant ?? null,
    avgMatchPct: avgTargetMatchPct,
    matchQualifier: 'qty-weighted',
    caveats: bomCaveats,
    marketGaps: marketGaps ?? null,
    savingsSuppressed,
    suppressReason,
  });
  const scope = `${lineWord} BoM ported from ${ported.baseProvider}${
    targetProviders.length ? ` to ${targetProviders.join(' and ')}` : ''
  } · priced at ${termLabelLong(term)}`;

  return {
    mode: 'bom',
    generatedAt: new Date().toISOString(),
    term,
    baseProvider: ported.baseProvider,
    verdict: {
      // S66 fix-b — NEVER the engine's `ported.verdict.headline` (it can claim
      // "already the cheapest at $0/mo" off an unpriced base). Derived from the
      // same gated verdict math the screen uses.
      headline: honestBomHeadline({
        n: bom.length,
        baseProvider: ported.baseProvider,
        term,
        verdictQuant,
        baseTotal,
        savingsSuppressed,
        suppressReason,
      }),
      insights: ported.verdict.insights,
      cheapestProvider: ported.verdict.cheapestProvider,
    },
    totals,
    lines,
    regionsCovered,
    caveats: bomCaveats,
    verdictQuant,
    lineHighlights: lineHighlights.length ? lineHighlights : undefined,
    marketGaps,
    recommendation,
    scope,
    avgTargetMatchPct,
    savingsSuppressed,
    suppressReason,
  };
}

/** Sanitize an arbitrary SKU / provider token into a filename-safe slug. */
export function sanitizeForFilename(s: string): string {
  return (s || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** ISO date (YYYY-MM-DD) from a model's `generatedAt` ISO string. */
export function isoDate(generatedAt: string): string {
  return (generatedAt || new Date().toISOString()).slice(0, 10);
}

/** Canonical export filename (no extension) for either model. */
export function execFileBase(model: ExecComparisonModel | ExecBomModel): string {
  const date = isoDate(model.generatedAt);
  if (model.mode === 'bom') {
    const prov = sanitizeForFilename(model.baseProvider);
    return `cma-bom-${prov}-${model.lines.length}lines-${date}`;
  }
  const prov = sanitizeForFilename(model.baseline.provider);
  const sku = sanitizeForFilename(model.baseline.sku);
  return `cma-exec-${prov}-${sku}-${date}`;
}

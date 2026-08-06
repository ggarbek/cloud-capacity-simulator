/**
 * execNarratives — PURE selectors that turn the CMA comparison / BoM state into
 * the EXECUTIVE-READABLE intelligence the exports (deck + doc) render:
 *
 *   - verdictQuant   — the quantified answer: cheapest option, $ + % savings.
 *   - familyStories  — per-cloud "what you're comparing" (family + category +
 *                      generation, strengths, one tradeoff, match% + caveat).
 *   - sizeShowdown   — a size-for-size table (vCPU / memory / GiB-per-vCPU /
 *                      network / local NVMe / processor / $ per month).
 *   - marketGaps     — the base cloud's regional gaps vs the competitors.
 *   - lineHighlights — (BoM) the few lines that drive cost / where a cloud wins.
 *   - recommendation — the synthesized adopt / stay / validate / watch
 *                      bullets a leadership reader acts on. Situational framing
 *                      only — never an unconditional crowned winner.
 *
 * These consume ONLY typed, already-derived inputs (CatalogEntry rows, the
 * shared HorizonCost[] and the MarketGapReport from marketGaps.ts, and a
 * SpecComparison from specInsights.ts). They never re-run the engine, touch the
 * DOM, or import React — so every field is trivially unit-tested. No emojis.
 */
import type { CatalogEntry } from '../../types';
import type { HorizonCost } from '../../engine/competitive';
import type { SpecComparison } from '../specInsights';
import type { MarketGapReport, GapProvider } from '../marketGaps';
import { worstCaveat, type MatchCaveat } from '../matchCaveats';
// Single source of truth for the ×730 convention — re-declaring risked drift.
import { HOURS_PER_MONTH } from '../../types';
// S66 — the SAME formatters the on-screen verdict/KPI surfaces use, so export
// copy formats every number identically to the screen (frozen shared tokens).
// fmtUsdFull = full-precision money for DECISION numbers (verdict sentences,
// cost-table cells, Δ-vs-cheapest) — re-exported for the exporters.
import { fmtPct, fmtUsdFull, termLabelLong } from '../../components/compare/ui/tokens';

export { fmtUsdFull };

/**
 * Format a Gbps figure honestly: one decimal for small (<10) or fractional rates
 * so a 0.4 Gbps NIC doesn't round to "0" and a 12.5 Gbps NIC doesn't round to
 * "13", but whole integers ≥10 stay clean ("100", not "100.0"). Mirrors the
 * spec-showdown formatter's semantics (kept local — no cross-file import). */
function fmtGbps(gbps: number): string {
  if (gbps < 10 || !Number.isInteger(gbps)) return (Math.round(gbps * 10) / 10).toString();
  return Math.round(gbps).toString();
}

/** Format a network figure given in Mbps as a Gbps string (400 → '0.4',
 *  12500 → '12.5', 100000 → '100'). Exported for the size-showdown test. */
export function formatNetworkGbps(mbps: number): string {
  return fmtGbps(mbps / 1000);
}

// ── verdictQuant ────────────────────────────────────────────────────────────

/** The quantified answer: the cheapest priced option at the term, and how much
 *  it saves vs the base. Shared shape for comparison + BoM. */
export interface VerdictQuant {
  cheapestProvider: string;
  cheapestSku: string;
  monthlyUsd: number;
  /** Absolute monthly saving vs the base (positive = cheaper than base). null
   *  when the base has no priced monthly to compare against. */
  savingsVsBaseUsd: number | null;
  /** Percent saving vs the base (positive = cheaper). null when base unpriced. */
  savingsVsBasePct: number | null;
  term: string;
}

/**
 * Quantify the verdict from a set of {provider, sku, monthlyUsd} candidates and
 * the base's monthly cost. The cheapest PRICED candidate wins; savings compare
 * it to the base (which is often — but not always — one of the candidates).
 * Returns null when nothing is priced.
 */
export function buildVerdictQuant(
  candidates: { provider: string; sku: string; monthlyUsd: number | null }[],
  baseMonthlyUsd: number | null,
  term: string,
): VerdictQuant | null {
  const priced = candidates.filter((c): c is { provider: string; sku: string; monthlyUsd: number } => c.monthlyUsd != null && c.monthlyUsd > 0);
  if (priced.length === 0) return null;
  const cheapest = priced.reduce((a, b) => (b.monthlyUsd < a.monthlyUsd ? b : a));
  let savingsVsBaseUsd: number | null = null;
  let savingsVsBasePct: number | null = null;
  if (baseMonthlyUsd != null && baseMonthlyUsd > 0) {
    savingsVsBaseUsd = Math.round((baseMonthlyUsd - cheapest.monthlyUsd) * 100) / 100;
    savingsVsBasePct = Math.round(((baseMonthlyUsd - cheapest.monthlyUsd) / baseMonthlyUsd) * 1000) / 10;
  }
  return {
    cheapestProvider: cheapest.provider,
    cheapestSku: cheapest.sku,
    monthlyUsd: Math.round(cheapest.monthlyUsd * 100) / 100,
    savingsVsBaseUsd,
    savingsVsBasePct,
    term,
  };
}

/** Convenience: derive verdictQuant straight from a HorizonCost[] (the cost
 *  matrix) — the cheapest `oneMonthBest` vs the base provider's `oneMonthBest`. */
export function verdictFromHorizons(horizons: HorizonCost[], baseProvider: string, term: string): VerdictQuant | null {
  const base = horizons.find((h) => h.provider === baseProvider);
  const candidates = horizons.map((h) => ({ provider: h.provider, sku: h.sku, monthlyUsd: h.oneMonthBest }));
  return buildVerdictQuant(candidates, base?.oneMonthBest ?? null, term);
}

// ── familyStories ───────────────────────────────────────────────────────────

export interface FamilyStory {
  provider: string;
  family: string;
  category: string;
  /** Processor / generation line; carries " (assumed)" when the processor is a
   *  curated/inferred estimate rather than a vendor-published string. */
  generation: string;
  sku: string;
  matchPct: number | null;
  /** Up to 3 strengths — the standout + the most decision-relevant nuances. */
  strengths: string[];
  /** The single honest tradeoff (a weakness), or null. */
  tradeoff: string | null;
  /** The worst comparability caveat's detail, or null (base cloud = null). */
  caveat: string | null;
}

/** Human generation/processor line for one VM, marking curated/inferred procs. */
export function generationLine(vm: CatalogEntry): string {
  const proc = (vm.processor || '').trim();
  const gen = (vm.vmGeneration || '').toString().trim();
  const assumed = vm.processorSource === 'curated' || vm.processorSource === 'inferred';
  const mark = assumed ? ' (assumed)' : '';
  if (proc && gen && !proc.toLowerCase().includes(gen.toLowerCase())) return `${proc} · ${gen}${mark}`;
  if (proc) return `${proc}${mark}`;
  if (gen) return gen;
  return 'Processor not published';
}

/**
 * Assemble the per-cloud family stories. One story per provided row (base first,
 * then targets), enriched from the matching `SpecComparison.vms` insight (keyed
 * by provider+vmSizeName) so the strengths reuse the on-screen standout/nuance
 * intelligence rather than a parallel heuristic.
 *
 * @param rows      the base + target catalog rows, in display order.
 * @param comparison the specInsights comparison over the SAME rows.
 * @param matchByProvider match% per provider (base = 100 / null).
 * @param caveatsByProvider worst comparability caveat per provider.
 */
export function buildFamilyStories(
  rows: { provider: string; row: CatalogEntry }[],
  comparison: SpecComparison | null,
  matchByProvider: Record<string, number | null>,
  caveatsByProvider: Record<string, MatchCaveat[] | undefined>,
): FamilyStory[] {
  const insightFor = (provider: string, sku: string) =>
    comparison?.vms.find((v) => v.provider === provider && v.vmSizeName === sku) ?? null;

  return rows.map(({ provider, row }) => {
    const ins = insightFor(provider, row.vmSizeName);
    const strengths: string[] = [];
    // Lead with the standout (the ONE dimension it clearly leads on), then fill
    // from the descriptive nuances (capped at 3 total).
    if (ins?.standout) strengths.push(capitalize(ins.standout));
    for (const n of ins?.nuances ?? []) {
      if (strengths.length >= 3) break;
      const line = n.detail || n.label;
      if (line && !strengths.some((s) => s.toLowerCase() === line.toLowerCase())) strengths.push(line);
    }
    // Guarantee at least one strength: fall back to the "best for" framing.
    if (strengths.length === 0 && ins?.bestFor) strengths.push(`Best for ${ins.bestFor.replace(/\.$/, '')}`);

    const tradeoff = ins?.weakness ? capitalize(ins.weakness) : null;
    const worst = worstCaveat(caveatsByProvider[provider] ?? []);
    const caveat = worst ? worst.detail : null;

    return {
      provider,
      family: row.family || row.series || row.vmSizeName,
      category: row.category || 'General Purpose',
      generation: generationLine(row),
      sku: row.vmSizeName,
      matchPct: matchByProvider[provider] ?? null,
      strengths: strengths.slice(0, 3),
      tradeoff,
      caveat,
    };
  });
}

function capitalize(s: string): string {
  const t = (s || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// ── sizeShowdown ────────────────────────────────────────────────────────────

export interface ShowdownRow {
  label: string;
  unit?: string;
  /** Value per provider (already formatted / raw number). null = not available. */
  byProvider: Record<string, string | number | null>;
  /** The provider with the best value on this row (highest for specs, lowest for
   *  $), or null when tied / not comparable. */
  bestProvider: string | null;
}

export interface SizeShowdown {
  rows: ShowdownRow[];
}

/**
 * Build the size-for-size table across the provided rows. Spec rows pick the
 * HIGHEST as best (more vCPU / RAM / network is better); the $/mo row picks the
 * LOWEST. Estimated network keeps an "(est.)" marker; curated/inferred
 * processors keep "(assumed)". Ties (or all-null) yield bestProvider = null.
 *
 * @param rows        base + target rows in display order.
 * @param monthlyByProvider $/mo at the term, per provider (from the cost matrix).
 */
export function buildSizeShowdown(
  rows: { provider: string; row: CatalogEntry }[],
  monthlyByProvider: Record<string, number | null>,
): SizeShowdown {
  const providers = rows.map((r) => r.provider);
  const rowBy: Record<string, CatalogEntry> = {};
  for (const r of rows) rowBy[r.provider] = r.row;

  const numericRow = (
    label: string,
    unit: string | undefined,
    pick: (vm: CatalogEntry) => number | null,
    fmt: (v: number) => string | number,
    higherIsBetter: boolean,
  ): ShowdownRow => {
    const byProvider: Record<string, string | number | null> = {};
    const nums: { provider: string; v: number }[] = [];
    for (const p of providers) {
      const vm = rowBy[p];
      const raw = vm ? pick(vm) : null;
      if (raw == null) {
        byProvider[p] = null;
      } else {
        byProvider[p] = fmt(raw);
        nums.push({ provider: p, v: raw });
      }
    }
    let bestProvider: string | null = null;
    if (nums.length >= 2) {
      const target = higherIsBetter ? Math.max(...nums.map((n) => n.v)) : Math.min(...nums.map((n) => n.v));
      const winners = nums.filter((n) => n.v === target);
      if (winners.length === 1) bestProvider = winners[0].provider;
    }
    return { label, unit, byProvider, bestProvider };
  };

  const rowsOut: ShowdownRow[] = [
    numericRow('vCPUs', undefined, (v) => v.vcpus || null, (v) => v, true),
    numericRow('Memory', 'GiB', (v) => v.memoryGib || null, (v) => Math.round(v), true),
    numericRow('Memory per vCPU', 'GiB', (v) => (v.vcpus ? v.memoryGib / v.vcpus : null), (v) => Math.round(v * 10) / 10, true),
    numericRow('Network', 'Gbps', (v) => (v.networkMbps ? v.networkMbps : null), (mbps) => formatNetworkGbps(mbps), true),
    numericRow('Local NVMe', 'GiB', (v) => (v.localDiskGib ? v.localDiskGib : null), (v) => Math.round(v), true),
    numericRow('Monthly cost', undefined, (v) => monthlyByProvider[v.provider ?? ''] ?? null, (v) => v, false),
  ];

  // Mark estimated network + assumed processor inline on the value strings.
  const netRow = rowsOut.find((r) => r.label === 'Network');
  if (netRow) {
    for (const p of providers) {
      const vm = rowBy[p];
      if (vm?.networkEstimated && netRow.byProvider[p] != null) netRow.byProvider[p] = `${netRow.byProvider[p]} (est.)`;
    }
  }

  // Processor is a text row (not numeric — no "best"); marks curated/inferred.
  const procRow: ShowdownRow = { label: 'Processor', byProvider: {}, bestProvider: null };
  for (const p of providers) {
    const vm = rowBy[p];
    procRow.byProvider[p] = vm ? generationLine(vm) : null;
  }
  // Slot processor just above the monthly-cost row for a clean read.
  rowsOut.splice(rowsOut.length - 1, 0, procRow);

  return { rows: rowsOut };
}

// ── marketGaps ──────────────────────────────────────────────────────────────

export interface MarketGapsExport {
  base: string;
  gapCount: number;
  perCompetitor: { provider: string; count: number; examples: string[] }[];
  sharedByAll: number;
  note?: string;
}

/**
 * Map a MarketGapReport into the export's compact market-gaps block, base-POV.
 * A "gap" = a metro a competitor serves that the base does NOT. S65 — we read
 * the report's `competitorGap` ONLY (base-absent, sole-competitor metros) and
 * count in the SAME metro unit the report standardized on (`baseGapMetros`), so
 * the deck's gap number equals the on-screen KPI/posture number exactly. The
 * per-competitor `count` is metro-deduped (`baseGapMetros.perCompetitor`); the
 * examples are the distinct metro names of that competitor's gap list. The old
 * `exclusive` concat is dropped: competitorGap already contains every base-absent
 * sole-competitor metro (they are the same set post-S65), so the union only
 * risked double-counting a base metro that shared a cluster name.
 *
 * @param report the base-POV MarketGapReport (already scoped by the caller).
 */
export function buildMarketGapsExport(report: MarketGapReport, note?: string): MarketGapsExport {
  const base = report.base;
  const competitors = report.competitors;

  const perCompetitor = competitors.map((provider) => {
    // Distinct gap metros (dedupe by city+country) — the same metro unit the
    // report counts in. The count comes straight from `baseGapMetros.perCompetitor`
    // so it can never drift from the report's headline total. (Falls back to the
    // dedupe below for a partial report that predates the baseGapMetros field.)
    const seen = new Set<string>();
    const cities: string[] = [];
    for (const l of report.competitorGap[provider as GapProvider] ?? []) {
      const key = `${l.city}::${l.country}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cities.push(l.city);
    }
    cities.sort();
    const count = report.baseGapMetros?.perCompetitor?.[provider as GapProvider] ?? cities.length;
    return { provider, count, examples: cities.slice(0, 3) };
  });

  return {
    base,
    // The metro-deduped headline (matches the KPI tile + posture strip exactly).
    gapCount: report.baseGapMetros?.total ?? perCompetitor.reduce((n, c) => n + c.count, 0),
    perCompetitor,
    sharedByAll: report.all,
    note,
  };
}

// ── lineHighlights (BoM) ────────────────────────────────────────────────────

export interface LineHighlight {
  index: number;
  baseSku: string;
  insight: string;
}

/**
 * The few BoM lines worth an executive's attention: the ones that drive the most
 * cost, and where a cheaper cloud exists for that line. Ranked by base-cost
 * share, capped at 5.
 *
 * @param lines base + per-cloud line prices (base monthly + per-provider monthly).
 * @param baseProvider the base cloud (its line prices anchor the share math).
 */
export function buildLineHighlights(
  lines: {
    index: number;
    baseSku: string;
    baseMonthlyUsd: number | null;
    perCloud: { provider: string; monthlyUsd: number | null }[];
  }[],
  baseProvider: string,
  cap = 5,
): LineHighlight[] {
  const baseTotal = lines.reduce((n, l) => n + (l.baseMonthlyUsd ?? 0), 0);
  if (baseTotal <= 0) return [];

  const scored = lines
    .filter((l) => (l.baseMonthlyUsd ?? 0) > 0)
    .map((l) => {
      const share = ((l.baseMonthlyUsd as number) / baseTotal) * 100;
      // Cheapest OTHER cloud on this line, vs the base cloud's price.
      const baseCost = l.baseMonthlyUsd as number;
      const others = l.perCloud.filter((c) => c.provider !== baseProvider && c.monthlyUsd != null && c.monthlyUsd > 0) as { provider: string; monthlyUsd: number }[];
      let cheaper: { provider: string; pct: number } | null = null;
      if (others.length) {
        const best = others.reduce((a, b) => (b.monthlyUsd < a.monthlyUsd ? b : a));
        if (best.monthlyUsd < baseCost) {
          cheaper = { provider: best.provider, pct: Math.round(((baseCost - best.monthlyUsd) / baseCost) * 1000) / 10 };
        }
      }
      return { line: l, share, cheaper };
    })
    .sort((a, b) => b.share - a.share)
    .slice(0, cap);

  return scored.map(({ line, share, cheaper }) => {
    const sharePart = `Line ${line.index + 1} (${line.baseSku}) drives ${Math.round(share)}% of total cost`;
    const cheaperPart = cheaper
      ? ` — ${cheaper.provider} is ${Math.abs(cheaper.pct)}% cheaper on it`
      : ` — ${baseProvider} is already the cheapest on it`;
    return { index: line.index, baseSku: line.baseSku, insight: `${sharePart}${cheaperPart}.` };
  });
}

// ── recommendation ────────────────────────────────────────────────────

export type RecommendationKind = 'adopt' | 'stay' | 'validate' | 'watch';

export interface RecommendationBullet {
  kind: RecommendationKind;
  text: string;
}

/** The leadership recommendation block: 3–5 situational bullets. */
export interface ExecRecommendation {
  bullets: RecommendationBullet[];
}

/** Terminate a caveat/detail string as a sentence (adds a period if missing). */
function endSentence(s: string): string {
  const t = (s || '').trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * Synthesize the recommendation a VP acts on, from data the model already
 * carries: the quantified cost verdict, the average spec parity of the analogs,
 * the honest comparability caveats, and the base cloud's market gaps.
 *
 * Framing rules (accuracy-first, never a crowned winner):
 *   - "Adopt X" only when a rival is PRICED cheaper than a PRICED base, and it
 *     is always scoped ("for cost-driven {workload}") and paired with a
 *     "stay on {base} where …" counterweight bullet.
 *   - An unpriced base can never yield an adopt call — it degrades to an honest
 *     "directional only" watch bullet. The unpriced-base wording ONLY fires when
 *     the base truly has no price (savings null): a PRICED base at ~zero savings
 *     is an honest "effectively at parity" read, never a data-provenance claim.
 *   - A suppressed savings figure (either side's BoM total undercounted by
 *     unmatched lines) never yields an adopt call or a "$X below" claim — it
 *     degrades to a watch bullet naming the suppression reason.
 *   - Caveats become "validate before committing" bullets verbatim (max 2).
 *   - Market gaps become the closing "watch coverage" bullet.
 * Bullet count is 3–5 by construction. Every number reuses the shared screen
 * formatters so deck/doc/screen agree to the character (decision dollars are
 * full-precision via fmtUsdFull).
 */
export function buildRecommendation(args: {
  baseProvider: string;
  /** Prose name for the base ("Azure Standard_M64s" / "the 12-line Azure BoM"). */
  baseLabel: string;
  /** Workload framing for the adopt bullet ("memory optimized workloads"). */
  workload?: string;
  term: string;
  verdict: VerdictQuant | null;
  /** Average spec match of the non-base analogs (null = unknown). */
  avgMatchPct: number | null;
  /** S66 fix-b — qualifier naming HOW avgMatchPct was averaged ("qty-weighted").
   *  Rendered before "spec parity"/"match" so the figure is honestly labeled. */
  matchQualifier?: string;
  /** Deduped comparability caveats, worst-first (provider-attributed strings). */
  caveats: string[];
  marketGaps: MarketGapsExport | null;
  /** S66 fix-b — true when the savings claim is suppressed because either side's
   *  total is undercounted (BoM unmatched lines). Mirrors bomVerdict's gate. */
  savingsSuppressed?: boolean;
  /** Why the savings figure is suppressed (disclosed verbatim). */
  suppressReason?: string | null;
}): ExecRecommendation {
  const { baseProvider, baseLabel, term, verdict, avgMatchPct, caveats, marketGaps } = args;
  const workload = (args.workload || '').trim() || 'this workload';
  const termLong = termLabelLong(term);
  const matchNoun = args.matchQualifier ? `${args.matchQualifier.trim()} ` : '';
  const bullets: RecommendationBullet[] = [];

  // 1 — the cost call: adopt / stay / parity / directional-watch. Never
  //     unconditional, and never a savings claim over an undercounted total.
  if (verdict && args.savingsSuppressed && verdict.cheapestProvider !== baseProvider) {
    bullets.push({
      kind: 'watch',
      text: `${verdict.cheapestProvider} prices lowest at ${termLong} (${fmtUsdFull(verdict.monthlyUsd)}/mo), but ${args.suppressReason ?? 'unmatched lines are excluded from one side of the comparison'} — totals are not directly comparable, so no savings figure is stated.`,
    });
  } else if (
    verdict &&
    verdict.cheapestProvider !== baseProvider &&
    verdict.savingsVsBaseUsd != null &&
    verdict.savingsVsBaseUsd > 0
  ) {
    const parity = avgMatchPct != null ? ` with ~${fmtPct(avgMatchPct)} ${matchNoun}spec parity` : '';
    bullets.push({
      kind: 'adopt',
      text: `Adopt ${verdict.cheapestProvider} for cost-driven ${workload} — saves ${fmtUsdFull(verdict.savingsVsBaseUsd)}/mo (${fmtPct(verdict.savingsVsBasePct)}) vs the ${baseProvider} base at ${termLong}${parity}.`,
    });
  } else if (verdict && verdict.cheapestProvider === baseProvider) {
    bullets.push({
      kind: 'stay',
      text: `Stay on ${baseLabel} — it is already the least-cost option of this set at ${termLong} (${fmtUsdFull(verdict.monthlyUsd)}/mo).`,
    });
  } else if (verdict && verdict.savingsVsBaseUsd != null) {
    // A PRICED base a rival matches to the rounding penny (~$0 savings) — an
    // honest parity read, never a "base is not priced" data-provenance lie.
    bullets.push({
      kind: 'watch',
      text: `${verdict.cheapestProvider} and the ${baseProvider} base are effectively at parity at ${termLong} (${fmtUsdFull(verdict.monthlyUsd)}/mo) — the ranking is a coin flip at list prices; decide on specs, coverage or platform fit.`,
    });
  } else if (verdict) {
    // A rival is the cheapest PRICED option but the base has no priced monthly
    // (savings null) — an honest directional read, not an adopt call.
    bullets.push({
      kind: 'watch',
      text: `${verdict.cheapestProvider} carries the lowest priced monthly (${fmtUsdFull(verdict.monthlyUsd)}/mo at ${termLong}); the ${baseProvider} base is not priced in this feed, so treat the ranking as directional.`,
    });
  } else {
    bullets.push({
      kind: 'watch',
      text: `No option in this set is priced at ${termLong} — validate live rates before acting on the comparison.`,
    });
  }

  // 2 — the give-up counterweight, whenever the cost call was an adopt.
  if (bullets[0].kind === 'adopt') {
    bullets.push({
      kind: 'stay',
      text:
        avgMatchPct != null && avgMatchPct < 100
          ? `Stay on ${baseProvider} where exact-SKU parity matters — the closest analogs average ${fmtPct(avgMatchPct)} ${matchNoun}match; they are spec equivalents, not identical hardware.`
          : `Stay on ${baseProvider} for workloads tied to its platform features — analogs are spec equivalents, not identical SKUs.`,
    });
  }

  // 3 — validate the worst honest asterisks before committing (max 2, and never
  //     crowd out the coverage bullet).
  for (const c of caveats.slice(0, 2)) {
    if (bullets.length >= 4) break;
    bullets.push({ kind: 'validate', text: `Validate before committing — ${endSentence(c)}` });
  }
  if (caveats.length === 0 && bullets.length < 4) {
    bullets.push({
      kind: 'validate',
      text: 'Validate memory- and latency-critical workloads on the target cloud before committing — analogs match on specs, not on runtime behavior.',
    });
  }

  // 4 — coverage watch (market gaps), always the closer.
  if (marketGaps && bullets.length < 5) {
    if (marketGaps.gapCount > 0) {
      const ex = marketGaps.perCompetitor.flatMap((c) => c.examples).slice(0, 3);
      bullets.push({
        kind: 'watch',
        text: `Watch coverage: competitors serve ${marketGaps.gapCount} metro${marketGaps.gapCount === 1 ? '' : 's'} ${marketGaps.base} does not${ex.length ? ` (e.g. ${ex.join(', ')})` : ''} — factor location needs into placement.`,
      });
    } else {
      bullets.push({
        kind: 'watch',
        text: `Coverage is not a blocker — no competitor-only metros vs ${marketGaps.base} in this comparison set.`,
      });
    }
  }

  return { bullets: bullets.slice(0, 5) };
}

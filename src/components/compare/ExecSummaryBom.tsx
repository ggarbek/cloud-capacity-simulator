/**
 * ExecSummaryBom — the VM-BoM-mode Executive Summary (S66 rewrite).
 *
 * A THIN composition of the S66 shared answer skeleton — the SAME section list,
 * order and visual grammar as comparison mode, only the data differs:
 *   1. VerdictBand — the whole-BoM money answer (pure `bomVerdict`).
 *   2. KpiRow — cheapest total · savings vs base · qty-weighted match ·
 *      lines matched · regions · market gaps.
 *   3. ONE cost visual — BomCostComposition under the same section framing +
 *      "See Pricing" link comparison mode uses for CommitmentStepdown.
 *   4. What you get vs what you give up — ExecBriefBomTradeoffs (qty-weighted
 *      portfolio story per cloud from `bomTradeoffs`).
 *   5. Per-line best-at — compact chips per line (collapse >5, click → Specs).
 *   6. Market posture — ExecBriefPosture (mode-independent).
 *   7. Amber assumptions footer — ExecBriefAssumptions via `collectBomAssumptions`.
 *
 * No private verdict band, KPI hero or formatter lives here anymore — everything
 * renders through ui/* primitives + execBriefMath selectors, so BoM mode cannot
 * drift from comparison mode. Accuracy-first: unpriced totals stay em-dashes,
 * unmatched lines are named, estimated rates are flagged.
 */
import { useMemo, useState } from 'react';
import type { BomPortResult } from '../../utils/bomPort';
import type { Term } from '../../utils/costCalculator';
import type { BomEntry, CatalogEntry } from '../../types';
import type { MarketGapReport } from '../../utils/marketGaps';
import { BomCostComposition } from './charts/BomCostComposition';
import { VerdictBand } from './ui/VerdictBand';
import { KpiRow, type KpiTileSpec } from './ui/KpiRow';
import { providerTone, fmtUsd, fmtPct, termLabelShort } from './ui/tokens';
import {
  bomVerdict,
  bomLineStats,
  bomTradeoffs,
  weightedTargetMatch,
  cheapestForLine,
  collectBomAssumptions,
  termLabel,
  type BomVerdictResult,
  type BomCloudStory,
} from './execBriefMath';
import { ExecBriefBomTradeoffs } from './ExecBriefTradeoffs';
import { ExecBriefPosture } from './ExecBriefPosture';
import { ExecBriefAssumptions } from './ExecBriefAssumptions';
// S66-FIX-C — the ONE four-shape money headline, shared with comparison mode.
import { buildMoneyHeadline } from './ExecBriefVerdict';

// S66 integration — BomVerdictResult natively carries the honesty-gate fields
// (savingsSuppressed / suppressReason / exclusionsByProvider with the excluded
// line SKUs + whole-% savingPct), so this file consumes it directly.

export function ExecSummaryBom({
  ported,
  bom,
  userVms,
  lookup,
  term,
  regionsCovered,
  marketGapReport,
  onGoTo,
  onSelectLine,
}: {
  ported: BomPortResult;
  bom: BomEntry[];
  userVms: CatalogEntry[];
  /** S66-FIX-C — optional memoized `${provider}|${vmSizeName}` catalog index
   *  (from the parent's deduped-catalog memo); forwarded to bomTradeoffs. */
  lookup?: Map<string, CatalogEntry>;
  term: Term;
  regionsCovered: number;
  marketGapReport: MarketGapReport;
  onGoTo: (tab: string) => void;
  onSelectLine: (row: number) => void;
}) {
  const v = useMemo(() => bomVerdict(ported), [ported]);
  const lineStats = useMemo(() => bomLineStats(ported, bom.length), [ported, bom.length]);
  const avgMatch = useMemo(() => weightedTargetMatch(ported, bom), [ported, bom]);
  // S66 — the memoized catalog lookup + the verdict computed above are passed
  // through so bomTradeoffs neither scans the full catalog nor recomputes the
  // whole-BoM verdict internally.
  const stories = useMemo(
    () => bomTradeoffs(ported, bom, userVms, { lookup, verdict: v }),
    [ported, bom, userVms, lookup, v],
  );
  const assumptions = useMemo(() => collectBomAssumptions(ported, stories), [ported, stories]);

  const nLines = bom.length;
  const bomPhrase = `${nLines}-line BoM`;

  // ── 1. Verdict band — the ONE shared four-shape money headline (S66-FIX-C:
  // built by the same buildMoneyHeadline as comparison mode; savings render
  // whole-% and are withheld when FIX-A marks them suppressed). ──
  const suppressed = v.savingsSuppressed === true;
  const { headline, tone } = buildMoneyHeadline({
    mode: 'bom',
    term,
    baseProvider: ported.baseProvider,
    baseNoun: bomPhrase,
    cheapestProvider: v.cheapestProvider,
    cheapestSku: null,
    cheapestMonthly: v.cheapestTotal,
    baseMonthly: v.baseTotal,
    savingMonthly: suppressed ? null : v.savingMonthly,
    savingPct: suppressed ? null : v.savingPct,
    baseUnpriced: v.baseUnpriced,
    baseWins:
      v.baseIsCheapest || (!suppressed && (v.savingMonthly == null || v.savingMonthly <= 0)),
  });

  const support =
    avgMatch != null ? (
      <span style={{ color: v.anyUnmatched ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
        {lineStats.matched} of {lineStats.totalCells} line-ports matched at{' '}
        {Math.round(avgMatch)}% qty-weighted spec match
        {v.anyUnmatched ? ' — unmatched lines are excluded from totals.' : '.'}
      </span>
    ) : (
      <span style={{ color: 'var(--text-secondary)' }}>
        Per-line spec evidence on Specs; totals priced at {termLabel(term)}.
      </span>
    );

  const chips: { label: string; detail?: string }[] = [];
  // S66-FIX-C — per-cloud exclusion chips from the upgraded bomVerdict (FIX-A):
  // name each cloud's unpriced-line count instead of one vague "unmatched
  // lines" chip. Falls back to the aggregate chip until the field exists.
  if (v.exclusionsByProvider && v.exclusionsByProvider.length > 0) {
    for (const e of v.exclusionsByProvider) {
      const n = e.lines.length;
      chips.push({
        label: `${n} line${n === 1 ? '' : 's'} unpriced on ${e.provider} — excluded from its total`,
        detail: `Unmatched or unpriced on ${e.provider}: ${e.lines.join(', ')}. Its total omits ${n === 1 ? 'this line' : 'these lines'}, so cross-cloud totals are not like-for-like.`,
      });
    }
  } else if (v.anyUnmatched) {
    chips.push({
      label: 'unmatched lines',
      detail: 'Some BoM lines have no equivalent on at least one cloud — they are excluded from that cloud’s total.',
    });
  }
  if (suppressed) {
    chips.push({
      label: 'savings not comparable',
      detail:
        v.suppressReason ??
        'The clouds price different subsets of your BoM lines, so a savings % would compare unlike totals.',
    });
  }
  if (v.anyEstimated) {
    chips.push({
      label: 'includes estimated rates',
      detail: 'Some reserved rates are estimated from PAYG where the vendor feed lacks a committed tier.',
    });
  }

  // ── 2. KPI strip — same tile grammar as comparison mode. ──
  const hasSaving = v.savingMonthly != null && v.savingMonthly > 0 && !suppressed;
  const marketGaps = marketGapReport.baseGapCounted;
  const tiles: KpiTileSpec[] = [
    {
      label: 'Cheapest total',
      value: v.cheapestTotal != null ? `${fmtUsd(v.cheapestTotal)}/mo` : '—',
      tone: 'good',
      chip: v.cheapestProvider
        ? {
            text: `${v.cheapestProvider} · ${termLabelShort(term)}`,
            fg: providerTone(v.cheapestProvider).fg,
          }
        : undefined,
      sub: v.cheapestProvider ? undefined : 'No priced lines',
    },
    {
      label: `Savings vs ${ported.baseProvider}`,
      value: hasSaving
        ? `${fmtUsd(v.savingMonthly)}/mo`
        : v.baseIsCheapest
          ? 'Base is cheapest'
          : '—',
      tone: hasSaving ? 'good' : 'neutral',
      // S66-FIX-C — whole-% at render (belt-and-suspenders over the core's
      // rounding); a suppressed saving names why instead of a bare dash.
      sub: hasSaving
        ? `${v.savingPct != null ? Math.round(v.savingPct) : '—'}% below your baseline`
        : suppressed
          ? (v.suppressReason ?? 'Savings not comparable — clouds price different line sets')
          : v.baseTotal != null
            ? 'No cheaper cross-cloud move'
            : 'Base unpriced',
    },
    {
      label: 'Avg spec match',
      value: fmtPct(avgMatch),
      tone:
        avgMatch == null ? 'neutral' : avgMatch >= 85 ? 'good' : avgMatch >= 65 ? 'neutral' : 'warn',
      sub: 'qty-weighted · base = 100%',
    },
    {
      label: 'Lines matched',
      value: `${lineStats.matched} / ${lineStats.totalCells}`,
      tone: lineStats.anyUnmatched ? 'warn' : 'neutral',
      sub: 'across every cloud in scope',
    },
    {
      label: 'Regions covered',
      value: String(regionsCovered),
      tone: 'neutral',
      sub: 'distinct BoM deployment regions',
    },
    {
      label: `${ported.baseProvider} market gaps`,
      value: String(marketGaps),
      tone: marketGaps > 0 ? 'warn' : 'neutral',
      sub:
        marketGaps > 0
          ? 'metros a rival serves, you don’t · market-wide, all sizes'
          : 'no competitor-only metros · market-wide, all sizes',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1 — Verdict band. */}
      <VerdictBand
        tone={tone}
        eyebrow={`Cost verdict · ${termLabelShort(term)} · whole BoM`}
        headline={headline}
        support={support}
        chips={chips.length > 0 ? chips : undefined}
      />

      {/* 2 — KPI strip. */}
      <KpiRow tiles={tiles} />

      {/* 3 — ONE cost visual: the per-cloud cost composition, framed exactly
          like comparison mode's "Commitment savings" section. */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="section-h">Cost composition</h2>
          <button
            type="button"
            onClick={() => onGoTo('pricing')}
            className="text-[10px] underline underline-offset-2 font-semibold"
            style={{ color: 'var(--interactive)' }}
          >
            See Pricing for the full breakdown →
          </button>
        </div>
        <BomCostComposition ported={ported} term={term} />
      </section>

      {/* 4 — What you get vs what you give up: qty-weighted portfolio story
          per cloud, in the identical tradeoff-card grammar. */}
      <ExecBriefBomTradeoffs stories={stories} />

      {/* 5 — Per-line best-at (BoM's counterpart to Situational best-at). */}
      <PerLineChips ported={ported} bom={bom} onSelectLine={onSelectLine} onGoTo={onGoTo} />

      {/* 6 — Market posture (mode-independent). */}
      <ExecBriefPosture report={marketGapReport} onGoToRegion={() => onGoTo('region-availability')} />

      {/* 7 — Assumptions footer (amber, honest). */}
      <ExecBriefAssumptions lines={assumptions.lines} />
    </div>
  );
}

/** Per-line highlight chips: the cheapest priced cloud per SKU line, collapse
 *  >5, click drills into the Specs page's line view. */
function PerLineChips({
  ported,
  bom,
  onSelectLine,
  onGoTo,
}: {
  ported: BomPortResult;
  bom: BomEntry[];
  onSelectLine: (row: number) => void;
  onGoTo: (tab: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (bom.length === 0) return null;
  const shown = expanded ? bom : bom.slice(0, 5);

  return (
    <section className="space-y-2">
      <h2 className="section-h">Per-line best-at</h2>
      <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
        <div className="flex flex-col gap-1.5">
          {shown.map((entry, i) => {
            const best = cheapestForLine(ported, i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectLine(i);
                  onGoTo('compare');
                }}
                className="flex items-center justify-between gap-x-3 text-left px-2 py-1 rounded transition-colors"
                style={{ border: '1px solid var(--border)', background: 'transparent' }}
              >
                <span
                  className="text-[11px] truncate"
                  style={{ color: 'var(--text-secondary)' }}
                  title={entry.vmSizeName}
                >
                  <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {i + 1}.
                  </span>{' '}
                  {entry.vmSizeName}
                  {entry.quantity > 1 && (
                    <span style={{ color: 'var(--text-muted)' }}> ×{entry.quantity}</span>
                  )}
                </span>
                {best ? (
                  <span className="text-[10px] whitespace-nowrap flex items-center gap-x-2">
                    <span style={{ color: providerTone(best.provider).fg }}>{best.provider}</span>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fmtUsd(best.monthlyUsd)}/mo
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                    no priced match
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {bom.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] mt-2 underline underline-offset-2"
            style={{ color: 'var(--interactive)' }}
          >
            {expanded ? 'Show fewer' : `Show all ${bom.length} lines`}
          </button>
        )}
      </div>
    </section>
  );
}

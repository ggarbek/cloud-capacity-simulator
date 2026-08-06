/**
 * BomCostComposition — one stacked horizontal bar per cloud (base + each target
 * scenario) whose segments are the per-line monthly costs of the ported BoM.
 * It answers "what makes up each cloud's monthly bill, and which cloud is
 * cheapest overall?" at a glance — the visual companion to CostCalculator's
 * BoM tables, shown above them.
 *
 * Segments come from `stackedSegments` (pure): priced lines each get a slice,
 * >5 collapse into "Other N lines", and unmatched lines become a terminal
 * hatched marker plus an amber "N lines unmatched" chip. Each bar ends with its
 * total $/mo and a Δ-vs-cheapest chip, mirroring CostCalculator's convention.
 *
 * Owned by Wave-1 item C2. Pure CSS — no chart lib.
 */
import type { BomPortResult, PortedScenario } from '../../../utils/bomPort';
import type { Term } from '../../../utils/costCalculator';
import { stackedSegments, type StackSegment } from './chartMath';
// S66-PRICING — shared tokens replace the private PROVIDER_FG / fmtUsd /
// fmtPct / TERM_LABEL copies.
import { fmtUsd, providerTone, termLabelShort } from '../ui/tokens';

/** Categorical palette for the per-line segments. Cycles + dims after ~5 so a
 *  long BoM still reads (the >5 collapse keeps segment count low in practice). */
const SEGMENT_PALETTE = [
  'var(--interactive)',
  'var(--accent-cyan)',
  'var(--accent-violet)',
  '#6EE7B7',
  '#FBBF24',
];

function segmentColor(i: number): string {
  const base = SEGMENT_PALETTE[i % SEGMENT_PALETTE.length];
  return base;
}

/** Dim repeats past the first cycle so wrap-around colours don't read as new. */
function segmentOpacity(i: number): number {
  const cycles = Math.floor(i / SEGMENT_PALETTE.length);
  return cycles === 0 ? 0.85 : Math.max(0.4, 0.85 - cycles * 0.2);
}

/** Signed delta-% label (the shared fmtPct is unsigned — deltas need the +). */
function fmtDeltaPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(v < 10 ? 1 : 0)}%`;
}

export function BomCostComposition({ ported, term }: { ported: BomPortResult; term: Term }) {
  const scenarios: PortedScenario[] = [ported.baseScenario, ...ported.targetScenarios];
  const priced = scenarios.filter((s) => s.monthlyTotalUsd > 0);
  if (priced.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No priced BoM lines yet. Add VM demand with resolvable rates to see the
        per-cloud cost composition.
      </div>
    );
  }
  const cheapest = Math.min(...priced.map((s) => s.monthlyTotalUsd));
  const cheapestProvider = priced.find((s) => s.monthlyTotalUsd === cheapest)?.provider ?? null;
  // Shared scale across every cloud's bar so widths compare cross-cloud.
  const maxTotal = Math.max(...priced.map((s) => s.monthlyTotalUsd), 0.01);

  return (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-[12px] font-semibold text-text-primary">
          BoM cost composition
        </h3>
        <span className="text-[9px] uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">
          per line · monthly · {termLabelShort(term)}
        </span>
      </div>
      <div className="space-y-4">
        {scenarios.map((scn) => (
          <ScenarioBar
            key={scn.provider}
            scenario={scn}
            maxTotal={maxTotal}
            isBase={scn.provider === ported.baseProvider}
            isCheapest={scn.monthlyTotalUsd > 0 && scn.monthlyTotalUsd === cheapest}
            cheapest={cheapest}
            cheapestProvider={cheapestProvider}
          />
        ))}
      </div>
    </div>
  );
}

function ScenarioBar({
  scenario,
  maxTotal,
  isBase,
  isCheapest,
  cheapest,
  cheapestProvider,
}: {
  scenario: PortedScenario;
  maxTotal: number;
  isBase: boolean;
  isCheapest: boolean;
  cheapest: number;
  cheapestProvider: string | null;
}) {
  const fg = providerTone(scenario.provider).fg;
  const segments = stackedSegments(scenario);
  const total = scenario.monthlyTotalUsd;
  const priced = total > 0;
  const barPct = priced ? Math.max(2, (total / maxTotal) * 100) : 0;
  const dUsd = priced ? total - cheapest : 0;
  const dPct = cheapest > 0 ? (dUsd / cheapest) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-x-3">
        <span className="text-[12px] font-semibold flex items-center gap-x-2" style={{ color: fg }}>
          {scenario.provider}
          {isBase && (
            <span className="text-[8px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
              base
            </span>
          )}
          {isCheapest && (
            <span className="text-[9px] uppercase tracking-[0.06em]" style={{ color: 'var(--interactive)' }}>
              ★ lowest
            </span>
          )}
          {scenario.anyEstimated && (
            <span
              className="text-[9px]"
              style={{ color: 'var(--text-muted)' }}
              title="Includes estimated reserved rates"
            >
              est.
            </span>
          )}
        </span>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {priced ? `${fmtUsd(total)}/mo` : '—'}
        </span>
      </div>

      {/* stacked composition bar — one slice per priced line, hatched terminal
          marker for unmatched lines */}
      <div
        className="relative flex"
        style={{
          height: 16,
          width: `${barPct}%`,
          minWidth: priced ? 24 : 0,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        {priced &&
          segments.map((seg, i) => (
            <Segment key={`${seg.label}-${i}`} seg={seg} index={i} total={total} />
          ))}
      </div>

      {/* legend + deltas */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px]">
        {priced ? (
          isCheapest ? (
            <span style={{ color: 'var(--interactive)' }}>cheapest of the priced clouds</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-amber)' }}>
                +{fmtUsd(dUsd)} ({fmtDeltaPct(dPct)})
              </span>{' '}
              vs {cheapestProvider}
            </span>
          )
        ) : (
          <span style={{ color: 'var(--accent-amber)' }}>no priced lines</span>
        )}
        {scenario.unmatchedLines > 0 && (
          <span
            className="px-2 rounded-full whitespace-nowrap"
            style={{
              background: 'rgba(251, 191, 36, 0.12)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(251, 191, 36, 0.30)',
            }}
            title="These BoM lines had no cross-cloud match and are excluded from the total"
          >
            {scenario.unmatchedLines} line{scenario.unmatchedLines === 1 ? '' : 's'} unmatched
          </span>
        )}
      </div>
    </div>
  );
}

function Segment({ seg, index, total }: { seg: StackSegment; index: number; total: number }) {
  if (seg.unmatched) {
    // Terminal hatched marker — a thin fixed sliver, doesn't distort the total.
    return (
      <div
        title={seg.label}
        style={{
          width: 14,
          flexShrink: 0,
          background:
            'repeating-linear-gradient(45deg, rgba(251,191,36,0.35) 0, rgba(251,191,36,0.35) 3px, transparent 3px, transparent 6px)',
          borderLeft: '1px solid rgba(251, 191, 36, 0.45)',
        }}
      />
    );
  }
  const pct = total > 0 ? (seg.value / total) * 100 : 0;
  return (
    <div
      title={`${seg.label} · ${fmtUsd(seg.value)}/mo`}
      style={{
        width: `${pct}%`,
        background: segmentColor(index),
        opacity: segmentOpacity(index),
        borderRight: '1px solid rgba(0,0,0,0.25)',
      }}
    />
  );
}

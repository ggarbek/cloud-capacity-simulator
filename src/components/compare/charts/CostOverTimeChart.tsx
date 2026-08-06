/**
 * CostOverTimeChart — the keystone the Pricing page was missing. Every
 * other pricing element is a snapshot of RATES; this is the only view with a
 * TIME axis: cumulative $ from month 0 to 36 per cloud at the selected commitment
 * term, so the reader sees "what will I actually pay over MY horizon" and where
 * lines cross (one cloud overtakes another; the base's PAYG reference vs a
 * committed line).
 *
 * Pure SVG/CSS — no chart lib. Geometry + crossovers come from `chartMath`
 * (cumulativeCostSeries / findCrossovers), which price on the SAME × 730
 * convention as timeHorizonCosts, so month 12 == the horizon matrix's 1-year
 * total and month 36 == its 3-year total. Themed via CSS vars (dark/light).
 * Degrades: 1 series still reads; 0 series shows an empty-state hint.
 *
 * S66-PRICING: additive `series` prop — when the caller already has cumulative
 * series (the VM-BoM adapter `bomCostSeries`, whose slope is each cloud's BoM
 * monthly total), the chart draws those instead of deriving series from `bars`.
 * Existing callers pass `bars` exactly as before. Provider tones + money
 * formatting now come from the shared ui/tokens (private copies deleted).
 *
 * Owned by S65 item PRICING.
 */
import { useMemo } from 'react';
import type { PriceBar } from '../../../engine/competitive';
import type { Term } from '../../../utils/costCalculator';
import {
  cumulativeCostSeries,
  findCrossovers,
  noCrossoverNote,
  type CumulativeSeries,
} from './chartMath';
import { fmtUsd, providerTone, termLabelLong } from '../ui/tokens';

function toneFor(provider: string): string {
  return providerTone(provider).fg;
}

const MONTHS = 36;
const TICKS = [6, 12, 24, 36];

// SVG viewport (responsive via width:100% + viewBox).
const W = 720;
const H = 260;
const PAD = { top: 16, right: 96, bottom: 30, left: 56 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Axis/legend money label. Delegates to the canonical `fmtUsd`; only the $0
 *  origin tick is special-cased ("$0", not "$0.00" — it's an axis, not a rate). */
function fmtK(v: number): string {
  return v === 0 ? '$0' : fmtUsd(v);
}

/** A stable dash key so the base PAYG reference line reads as "reference". */
function isReference(term: string, selectedTerm: Term): boolean {
  return selectedTerm !== 'payg' && term === 'payg';
}

export function CostOverTimeChart({
  bars,
  term,
  baseProvider,
  series: seriesProp,
}: {
  /** SKU rate bars (Comparison mode) — ignored when `series` is provided. */
  bars?: PriceBar[];
  term: Term;
  baseProvider: string;
  /** S66-PRICING (additive): pre-built cumulative series (VM-BoM mode). */
  series?: CumulativeSeries[];
}) {
  const series = useMemo(
    () => seriesProp ?? cumulativeCostSeries(bars ?? [], term, MONTHS, baseProvider),
    [seriesProp, bars, term, baseProvider],
  );
  const crossovers = useMemo(() => findCrossovers(series), [series]);

  const maxUsd = useMemo(() => {
    let mx = 0;
    for (const s of series) {
      const last = s.points[s.points.length - 1];
      if (last && last.usd > mx) mx = last.usd;
    }
    return mx;
  }, [series]);

  if (series.length === 0 || maxUsd <= 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No rates to project over time. Upload PAYG / 1y / 3y RI rates via the VM
        Library tab to see cumulative cost.
      </div>
    );
  }

  const x = (month: number) => PAD.left + (month / MONTHS) * PLOT_W;
  const y = (usd: number) => PAD.top + PLOT_H - (usd / maxUsd) * PLOT_H;

  // y-axis gridlines at 0/25/50/75/100% of max.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ usd: maxUsd * f, frac: f }));

  return (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[10px] text-text-muted mb-1" style={{ paddingLeft: 4 }}>
        Cumulative cost over time · {termLabelLong(term)}
        {series.some((s) => isReference(s.term, term)) && (
          <span> · dashed = {baseProvider} PAYG reference</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Cumulative cloud cost over 36 months"
        style={{ display: 'block' }}
      >
        {/* y gridlines + labels */}
        {yTicks.map((t) => (
          <g key={`y-${t.frac}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + PLOT_W}
              y1={y(t.usd)}
              y2={y(t.usd)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={t.frac === 0 ? undefined : '2 3'}
              opacity={0.6}
            />
            <text
              x={PAD.left - 6}
              y={y(t.usd) + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-muted)"
              className="tabular-nums"
            >
              {fmtK(t.usd)}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {TICKS.map((m) => (
          <g key={`x-${m}`}>
            <line
              x1={x(m)}
              x2={x(m)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.35}
            />
            <text
              x={x(m)}
              y={PAD.top + PLOT_H + 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--text-muted)"
            >
              {m}mo
            </text>
          </g>
        ))}
        <text
          x={PAD.left + PLOT_W / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={8}
          fill="var(--text-muted)"
          opacity={0.7}
        >
          months
        </text>

        {/* series lines */}
        {series.map((s, i) => {
          const tone = toneFor(s.provider);
          const ref = isReference(s.term, term);
          const d = s.points.map((p) => `${x(p.month)},${y(p.usd)}`).join(' ');
          const last = s.points[s.points.length - 1];
          // month-12 marker + value so the reader anchors on a 1-year figure.
          const m12 = s.points.find((p) => p.month === 12);
          return (
            <g key={`s-${i}-${s.provider}-${s.term}`}>
              <polyline
                points={d}
                fill="none"
                stroke={tone}
                strokeWidth={ref ? 1.5 : 2.25}
                strokeDasharray={ref ? '5 4' : undefined}
                opacity={ref ? 0.7 : 0.95}
                strokeLinejoin="round"
              />
              {m12 && !ref && (
                <circle cx={x(12)} cy={y(m12.usd)} r={2.5} fill={tone} />
              )}
              {/* end-of-line value label */}
              {last && (
                <text
                  x={x(MONTHS) + 6}
                  y={y(last.usd) + 3}
                  fontSize={9}
                  fill={tone}
                  className="tabular-nums"
                  fontWeight={ref ? 400 : 600}
                >
                  {fmtK(last.usd)}
                  {s.estimated ? ' (est.)' : ''}
                </text>
              )}
            </g>
          );
        })}

        {/* crossover markers */}
        {crossovers.map((c, i) => {
          const cx = x(c.month);
          const cy = y(c.usdAt);
          const labelUp = cy > PAD.top + 24;
          return (
            <g key={`x-cross-${i}`}>
              <circle cx={cx} cy={cy} r={3.5} fill="none" stroke="var(--text-primary)" strokeWidth={1.5} />
              <text
                x={cx}
                y={labelUp ? cy - 8 : cy + 14}
                textAnchor="middle"
                fontSize={8}
                fill="var(--text-secondary)"
                fontWeight={600}
              >
                mo {c.month.toFixed(0)}: {c.a.provider} overtakes {c.b.provider}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div
        className="mt-2 pt-2 border-t flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-text-muted"
        style={{ borderColor: 'var(--border)' }}
      >
        {series.map((s, i) => {
          const tone = toneFor(s.provider);
          const ref = isReference(s.term, term);
          const last = s.points[s.points.length - 1];
          return (
            <span key={`lg-${i}`} className="flex items-center gap-1">
              <span
                style={{
                  width: 14,
                  height: 0,
                  borderTop: `2px ${ref ? 'dashed' : 'solid'} ${tone}`,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: tone }}>
                {s.provider} {s.sku}
              </span>
              <span>
                · {s.rateLabel} · {last ? fmtK(last.usd) : '—'}@36mo
                {s.estimated ? ' (est.)' : ''}
              </span>
            </span>
          );
        })}
      </div>
      {/* S66 FIX-A — term-aware wording: only mentions amortized reserved rates
          when a reserved tier is actually plotted (at PAYG the honest reason is
          simply that every curve is linear). Pure copy from chartMath (tested). */}
      {crossovers.length === 0 && series.length > 1 && (
        <div className="text-[9px] text-text-muted mt-1" style={{ paddingLeft: 2 }}>
          {noCrossoverNote(series)}
        </div>
      )}
    </div>
  );
}

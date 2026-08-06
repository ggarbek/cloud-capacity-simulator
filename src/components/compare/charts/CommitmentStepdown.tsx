/**
 * CommitmentStepdown — for each provider's SKU, three descending horizontal
 * bars (PAYG → 1y RI → 3y RI) that make the commitment discount legible at a
 * glance: how much cheaper reserving 1 or 3 years is vs PAYG, per cloud.
 *
 * Data comes from `stepdownSeries` (pure). The currently-selected commitment
 * `term` is highlighted with the interactive accent so the user sees which tier
 * the sibling cost matrix is pricing at. Missing tiers render a dashed "not
 * published" placeholder rather than dropping the row. An amber note appears
 * when any tier carries an `estimated` flag (PriceBar has none today, so this
 * is inert until the engine supplies one — guarded, never fabricated).
 *
 * Owned by Wave-1 item C2. Pure SVG/CSS — no chart lib.
 */
import type { PriceBar } from '../../../engine/competitive';
import type { Term } from '../../../utils/costCalculator';
import { stepdownSeries, type StepdownPoint } from './chartMath';
// S66-PRICING — shared tokens replace the private PROVIDER_FG / term-label copies.
import { providerTone, termLabelShort } from '../ui/tokens';

const TERM_META: Record<StepdownPoint['term'], { label: string; matches: Term }> = {
  payg: { label: termLabelShort('payg'), matches: 'payg' },
  '1y': { label: termLabelShort('1y'), matches: '1y' },
  '3y': { label: termLabelShort('3y'), matches: '3y' },
};

/** PriceBar has no `estimated` field today; A later engine wave may add one.
 *  Read it defensively so the amber note lights up the moment it exists. */
function barIsEstimated(bar: PriceBar): boolean {
  return (bar as PriceBar & { estimated?: boolean }).estimated === true;
}

export function CommitmentStepdown({ bars, term }: { bars: PriceBar[]; term: Term }) {
  const priced = bars.filter((b) => b.payg != null || b.oneYr != null || b.threeYr != null);
  if (priced.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No commitment rates authored for these SKUs. Upload 1y / 3y RI rates via
        the VM Library tab to see the commitment step-down.
      </div>
    );
  }
  // Shared scale across every bar and tier so widths are cross-provider comparable.
  const maxRate = Math.max(
    0.01,
    ...priced.flatMap((b) =>
      [b.payg, b.oneYr, b.threeYr].filter((r): r is number => r != null),
    ),
  );
  const anyEstimated = priced.some(barIsEstimated);

  return (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="space-y-4">
        {priced.map((bar) => {
          const series = stepdownSeries(bar);
          const fg = providerTone(bar.provider).fg;
          return (
            <div key={`${bar.provider}-${bar.sku}`}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: fg }}
                  title={bar.label}
                >
                  {bar.label}
                </span>
                {bar.region && (
                  <span className="text-[9px] text-text-muted whitespace-nowrap">
                    {bar.region}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {series.map((pt) => (
                  <StepBar
                    key={pt.term}
                    point={pt}
                    maxRate={maxRate}
                    fg={fg}
                    current={TERM_META[pt.term].matches === term}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {anyEstimated && (
        <div
          className="mt-3 text-[9.5px] flex items-center gap-1.5"
          style={{ color: 'var(--status-warn)' }}
        >
          <span aria-hidden>▲</span>
          Some reserved rates are estimated (derived from PAYG), not vendor-published.
        </div>
      )}
    </div>
  );
}

function StepBar({
  point,
  maxRate,
  fg,
  current,
}: {
  point: StepdownPoint;
  maxRate: number;
  fg: string;
  current: boolean;
}) {
  const meta = TERM_META[point.term];
  const has = point.value != null;
  const pct = has ? Math.max(2, (point.value! / maxRate) * 100) : 0;
  const rateLabel = has
    ? `$${point.value!.toFixed(point.value! >= 10 ? 2 : 3)}/hr`
    : 'not published';
  const deltaLabel =
    point.deltaPctVsPayg != null && point.term !== 'payg'
      ? `${point.deltaPctVsPayg <= 0 ? '' : '+'}${Math.round(point.deltaPctVsPayg)}% vs PAYG`
      : null;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span
        className="whitespace-nowrap"
        style={{
          width: 46,
          flexShrink: 0,
          color: current ? 'var(--interactive)' : 'var(--text-muted)',
          fontWeight: current ? 700 : 400,
        }}
      >
        {meta.label}
      </span>
      <div
        className="flex-1 relative"
        style={{
          height: 14,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-sm)',
          outline: current ? '1px solid var(--interactive)' : 'none',
          outlineOffset: current ? 1 : 0,
        }}
      >
        {has ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              background: current ? 'var(--interactive)' : fg,
              borderRadius: 'var(--radius-sm)',
              opacity: current ? 0.95 : 0.7,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px dashed var(--border-light)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        )}
        {!has && (
          <span
            className="absolute inset-0 flex items-center pl-2 italic"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            not published
          </span>
        )}
      </div>
      <span
        className="font-mono tabular-nums whitespace-nowrap"
        style={{
          width: 96,
          textAlign: 'right',
          flexShrink: 0,
          color: has ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {has ? rateLabel : '—'}
      </span>
      <span
        className="tabular-nums whitespace-nowrap"
        style={{
          width: 92,
          textAlign: 'right',
          flexShrink: 0,
          color: 'var(--accent-cyan)',
          fontSize: 9,
        }}
      >
        {deltaLabel ?? ''}
      </span>
    </div>
  );
}

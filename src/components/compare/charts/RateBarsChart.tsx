/**
 * RateBarsChart — grouped rate bars per provider × commitment tier (PAYG /
 * 1y RI / 3y RI), extracted VERBATIM from CompetitivePage's Pricing view so it
 * can be reused (and, later, unit-tested) independently.
 *
 * Rendering is unchanged from the CompetitivePage originals (`PricingChart` /
 * `PricingRow` / `PricingBar`). The top-level component is exported as
 * `RateBarsChart`; a `PricingChart` alias is re-exported so the existing
 * CompetitivePage call site only changes its import, not its JSX.
 *
 * The provider-tone map + `providerTone` helper are re-declared here (they were
 * local + unexported in CompetitivePage) so this chart is self-contained. The
 * three provider hexes (Azure blue / AWS gold / GCP red) mirror the
 * CompetitivePage `PROVIDER_TONE` map exactly.
 */
import type { PriceBar } from '../../../engine/competitive';
import type { VmProvider } from '../../../types';
import { worstCaveat, isStretch } from '../../../utils/matchCaveats';

const PROVIDER_TONE: Record<VmProvider, { fg: string; bg: string; border: string }> = {
  Azure: {
    fg: '#93C5FD',
    bg: 'rgba(96, 165, 250, 0.10)',
    border: 'rgba(96, 165, 250, 0.30)',
  },
  AWS: {
    fg: '#FCD34D',
    bg: 'rgba(251, 191, 36, 0.10)',
    border: 'rgba(251, 191, 36, 0.30)',
  },
  GCP: {
    fg: '#FCA5A5',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
  },
  Custom: {
    fg: 'var(--interactive)',
    bg: 'rgba(129, 140, 248, 0.10)',
    border: 'var(--border-glow)',
  },
};

function providerTone(p: VmProvider) {
  return PROVIDER_TONE[p] ?? PROVIDER_TONE.Custom;
}

// ────────────────────────────────────────────────────────────────────────
// Pricing chart — grouped bars per provider × commitment tier.
// ────────────────────────────────────────────────────────────────────────
export function RateBarsChart({ bars }: { bars: PriceBar[] }) {
  // Compute a shared scale so all bars are comparable.
  const maxRate = Math.max(
    0.01,
    ...bars.flatMap((b) =>
      [b.payg, b.oneYr, b.threeYr].filter((r): r is number => r != null),
    ),
  );
  if (bars.every((b) => b.payg == null && b.oneYr == null && b.threeYr == null)) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No rates authored for these SKUs. Upload PAYG / 1y / 3y RI rates via
        the VM Library tab to populate the pricing chart.
      </div>
    );
  }
  return (
    <div
      className="glass"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      <div className="space-y-3">
        {bars.map((b) => (
          <PricingRow key={`${b.provider}-${b.sku}`} bar={b} maxRate={maxRate} />
        ))}
      </div>
      <div className="mt-3 pt-2 border-t flex gap-4 text-[9px] tracking-[0.04em] text-text-muted" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, background: 'var(--interactive)', borderRadius: 2, display: 'inline-block' }} />
          PAYG
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, background: '#93C5FD', borderRadius: 2, display: 'inline-block' }} />
          1y RI
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, background: '#FCD34D', borderRadius: 2, display: 'inline-block' }} />
          3y RI
        </span>
      </div>
    </div>
  );
}

function PricingRow({ bar, maxRate }: { bar: PriceBar; maxRate: number }) {
  const tone = providerTone(bar.provider);
  // Comparability asterisk — the winning match's worst warn-level caveat (a
  // stretch, a cross-category fallback, a burstable/arch mismatch, …). Rendered
  // as a small amber caption so a rate is never read as an apples-to-apples peer
  // when the underlying SKUs aren't a like-for-like swap.
  const worst = worstCaveat(bar.caveats ?? []);
  const caveatWarn = worst && worst.severity === 'warn' ? worst : null;
  const caveatText =
    caveatWarn &&
    (bar.stretch || isStretch(bar.caveats ?? [])
      ? 'closest alternative — not a true equivalent'
      : caveatWarn.label);
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span
          className="text-[10px] font-mono"
          style={{ color: tone.fg }}
          title={bar.label}
        >
          {bar.label}
        </span>
        {bar.region &&
          (bar.regionComparable === false ? (
            <span
              className="text-[9px] whitespace-nowrap"
              style={{ color: '#FBBF24' }}
              title={`No region near ${bar.baseRegion || 'the base region'} offers this SKU in the feed — showing its nearest available region (${bar.region}). Not an apples-to-apples geographic peer.`}
            >
              ⚠ {bar.region} · not near {bar.baseRegion || 'base'}
            </span>
          ) : (
            <span className="text-[9px] text-text-muted">{bar.region}</span>
          ))}
      </div>
      {caveatText && (
        <div
          className="text-[9px] mb-1 whitespace-nowrap"
          style={{ color: '#FBBF24' }}
          title={(bar.caveats ?? []).map((c) => c.detail).join(' · ')}
        >
          ⚠ {caveatText}
        </div>
      )}
      <div className="space-y-1">
        <PricingBar
          label="PAYG"
          rate={bar.payg}
          maxRate={maxRate}
          color="var(--interactive)"
        />
        <PricingBar
          label="1y RI"
          rate={bar.oneYr}
          maxRate={maxRate}
          color="#93C5FD"
        />
        <PricingBar
          label="3y RI"
          rate={bar.threeYr}
          maxRate={maxRate}
          color="#FCD34D"
        />
      </div>
    </div>
  );
}

function PricingBar({
  label,
  rate,
  maxRate,
  color,
}: {
  label: string;
  rate: number | null;
  maxRate: number;
  color: string;
}) {
  const pct = rate != null ? Math.max(2, (rate / maxRate) * 100) : 0;
  const rateLabel = rate != null ? `$${rate.toFixed(rate >= 10 ? 2 : 3)}/hr` : '—';
  // Per-term value label sits INSIDE the fill when it's wide enough to read the
  // number, otherwise just past the fill's edge (short bars) so it never clips.
  const labelInside = pct >= 34;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-text-muted" style={{ width: 44, flexShrink: 0 }}>
        {label}
      </span>
      <div
        className="flex-1 relative"
        style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}
      >
        {rate != null && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              background: color,
              borderRadius: 'var(--radius-sm)',
              opacity: 0.85,
            }}
          />
        )}
        {rate != null && (
          <span
            className="font-mono tabular-nums"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: labelInside ? undefined : `calc(${pct}% + 4px)`,
              right: labelInside ? 6 : undefined,
              display: 'flex',
              alignItems: 'center',
              fontSize: 9,
              lineHeight: 1,
              color: labelInside ? '#0B1120' : 'var(--text-secondary)',
              fontWeight: 600,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {rateLabel}
          </span>
        )}
      </div>
      <span
        className="font-mono text-text-primary"
        style={{ width: 90, textAlign: 'right', flexShrink: 0 }}
      >
        {rateLabel}
      </span>
    </div>
  );
}

/** Alias so the CompetitivePage call site only changes its import, not JSX. */
export { RateBarsChart as PricingChart };

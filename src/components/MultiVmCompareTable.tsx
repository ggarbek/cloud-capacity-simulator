/**
 * True multi-VM cross-cloud compare table.
 *
 * Renders ONE ROW PER base-cloud VM — the base name + key specs, then the
 * closest same-category analog on each other cloud with a ≈% similarity
 * badge (green ≥85 / amber ≥65 / red below). "— none" marks a product gap.
 *
 * The row math is the pure `buildCompareRows` helper (utils/multiVmCompare),
 * which itself reuses the shared `bestVmMatch` engine — so this matches the
 * apples-to-apples ≈% signal everywhere else on the page.
 */
import { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import {
  buildCompareRows,
  COMPARE_COLS,
  type CompareProvider,
} from '../utils/multiVmCompare';

const TONE: Record<CompareProvider, string> = {
  AWS: '#FBBF24',
  GCP: '#FCA5A5',
  Azure: '#60A5FA',
};
/** Tone for a 0–100 similarity score — green ≥85 / amber ≥65 / red below. */
function pctTone(pct: number): string {
  return pct >= 85 ? '#34D399' : pct >= 65 ? '#FBBF24' : '#F87171';
}
/** Cap on displayed rows — keep the table readable. */
const MAX_ROWS = 50;

export function MultiVmCompareTable({
  skus,
  baseProvider,
  onRemove,
  compact = false,
}: {
  skus: string[];
  baseProvider: CompareProvider;
  /** Optional per-row remove — pops the base VM from the compare list. */
  onRemove?: (sku: string) => void;
  /** Tighter padding + smaller type for the setup-page preview slot. */
  compact?: boolean;
}) {
  const { state } = useApp();
  const catalog = state.userVms ?? [];

  const rows = useMemo(
    () => buildCompareRows(skus, baseProvider, catalog).slice(0, MAX_ROWS),
    [skus, baseProvider, catalog],
  );

  // The two non-base clouds, base-cloud leading the header for orientation.
  const otherCols: CompareProvider[] = COMPARE_COLS.filter((p) => p !== baseProvider);
  const padY = compact ? 6 : 8;
  const padX = compact ? 9 : 11;
  const nameSize = compact ? 10 : 11;

  if (rows.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        Add a base-cloud VM to compare its cross-cloud analogs here.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `1.4fr ${otherCols.map(() => '1.2fr').join(' ')}${onRemove ? ' 26px' : ''}`,
          fontSize: 9.5,
          letterSpacing: '0.04em',
          color: 'var(--text-muted)',
          background: 'var(--tint-soft)',
          padding: `${padY}px ${padX}px`,
        }}
      >
        <div style={{ color: TONE[baseProvider], fontWeight: 700 }}>
          {baseProvider} · base
        </div>
        {otherCols.map((p) => (
          <div key={p} style={{ color: TONE[p], fontWeight: 700 }}>
            {p}
          </div>
        ))}
        {onRemove && <div />}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: compact ? 320 : 520, overflowY: 'auto' }}>
        {rows.map((r) => (
          <div
            key={r.base.vmSizeName}
            className="grid"
            style={{
              gridTemplateColumns: `1.4fr ${otherCols.map(() => '1.2fr').join(' ')}${onRemove ? ' 26px' : ''}`,
              padding: `${padY}px ${padX}px`,
              borderTop: '1px solid var(--border)',
              alignItems: 'start',
            }}
          >
            {/* Base VM + key specs */}
            <div style={{ paddingRight: 6, lineHeight: 1.35 }}>
              <div
                className="font-mono"
                style={{ fontSize: nameSize, color: 'var(--text-primary)', wordBreak: 'break-all' }}
              >
                {r.base.vmSizeName}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                {r.base.vcpus} vCPU · {r.base.memoryGib} GiB
                {r.base.networkMbps ? ` · ${networkLabel(r.base.networkMbps)}` : ''}
              </div>
            </div>

            {/* Closest analog per other cloud */}
            {otherCols.map((p) => {
              const a = r.analogs[p];
              return (
                <div key={p} style={{ paddingRight: 6, lineHeight: 1.35 }}>
                  {a ? (
                    <>
                      <div className="flex items-center" style={{ gap: 5 }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: nameSize,
                            color: 'var(--text-primary)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {a.vm.vmSizeName}
                        </span>
                        <span
                          className="text-[9px] font-semibold"
                          style={{ color: pctTone(a.pct), flexShrink: 0 }}
                          title="Similarity to the base size (specs · performance · hardware)"
                        >
                          ≈{a.pct}%
                        </span>
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                        {a.vm.vcpus} vCPU · {a.vm.memoryGib} GiB
                      </div>
                    </>
                  ) : (
                    <span
                      className="text-[11px]"
                      style={{ color: '#FBBF24', opacity: 0.85 }}
                      title={`No same-category (${r.category}) equivalent on ${p} — a product gap.`}
                    >
                      — none
                    </span>
                  )}
                </div>
              );
            })}

            {/* Per-row remove */}
            {onRemove && (
              <button
                onClick={() => onRemove(r.base.vmSizeName)}
                className="leading-none opacity-60 hover:opacity-100"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  alignSelf: 'start',
                  paddingTop: 1,
                }}
                title={`Remove ${r.base.vmSizeName} from the comparison`}
                aria-label={`Remove ${r.base.vmSizeName}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mbps → a terse "N Gbps" / "N Mbps" network label. */
function networkLabel(mbps: number): string {
  return mbps >= 1000 ? `${Math.round(mbps / 1000)} Gbps` : `${mbps} Mbps`;
}

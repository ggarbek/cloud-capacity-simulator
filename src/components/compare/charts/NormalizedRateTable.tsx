/**
 * NormalizedRateTable — a small cross-cloud table of unit-normalized rates:
 * $/vCPU/mo and $/GiB/mo per SKU, so clouds are compared on the same basis even
 * when their SKUs differ in size. Cheapest cell in each column is tinted green,
 * priciest amber, so the eye lands on the winner without reading every number.
 *
 * PURE PRESENTATION: this component takes `rows` via props and renders them. The
 * normalization math itself is a LATER wave (A2) selector — `normalizedRates`
 * on the engine — not this component's job. Callers compute rows and pass them
 * in; an optional `note` slot renders below (amber-callout friendly).
 *
 * Owned by Wave-1 item C2. Pure CSS — no chart lib.
 */
import type { ReactNode } from 'react';
// S66-PRICING — shared tokens replace the private PROVIDER_FG copy.
import { providerTone } from '../ui/tokens';

/** One cross-cloud row of unit-normalized rates. Rates are null when the SKU
 *  has no resolvable rate for the selected term. */
export interface NormalizedRow {
  provider: string;
  sku: string;
  usdPerVcpuMo: number | null;
  usdPerGibMo: number | null;
  matchPct?: number | null;
}

const CHEAP_BG = 'rgba(52, 211, 153, 0.14)';
const CHEAP_FG = '#6EE7B7';
const DEAR_BG = 'rgba(251, 191, 36, 0.12)';
const DEAR_FG = 'var(--accent-amber)';

/** Unit-rate formatter — keeps 3 decimals under $1 (normalized $/vCPU/mo and
 *  $/GiB/mo can be sub-dollar; the shared verdict-scale `fmtUsd` would round
 *  that precision away). Null → "n/a" (an unpriced cell, not a dash-able KPI). */
function fmtUsd(v: number | null): string {
  if (v == null) return 'n/a';
  if (v >= 100) return `$${v.toFixed(0)}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(3)}`;
}

/** Cell tint for min/max shading. Only shades when ≥2 distinct priced values. */
function shadeFor(
  value: number | null,
  min: number | null,
  max: number | null,
): { bg?: string; color?: string } {
  if (value == null || min == null || max == null || min === max) return {};
  if (value === min) return { bg: CHEAP_BG, color: CHEAP_FG };
  if (value === max) return { bg: DEAR_BG, color: DEAR_FG };
  return {};
}

export function NormalizedRateTable({
  rows,
  note,
  caption,
}: {
  rows: NormalizedRow[];
  note?: ReactNode;
  /** Optional slim heading — used when the table is shown as an always-visible
   *  price-performance strip (S65) rather than the stretch-gated fallback. */
  caption?: ReactNode;
}) {
  const hasMatch = rows.some((r) => r.matchPct != null);
  const vcpuVals = rows.map((r) => r.usdPerVcpuMo).filter((v): v is number => v != null);
  const gibVals = rows.map((r) => r.usdPerGibMo).filter((v): v is number => v != null);
  const vcpuMin = vcpuVals.length ? Math.min(...vcpuVals) : null;
  const vcpuMax = vcpuVals.length ? Math.max(...vcpuVals) : null;
  const gibMin = gibVals.length ? Math.min(...gibVals) : null;
  const gibMax = gibVals.length ? Math.max(...gibVals) : null;

  if (rows.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No normalized rates to show — no priced SKUs in this comparison.
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      {caption && (
        <div className="text-[10px] text-text-muted mb-2" style={{ fontWeight: 500 }}>
          {caption}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr
              className="text-[9px] uppercase tracking-[0.05em] text-text-muted"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <th className="text-left font-medium" style={{ padding: '4px 8px 6px 0' }}>
                Cloud · SKU
              </th>
              <th className="text-right font-medium" style={{ padding: '4px 0 6px 8px' }}>
                $/vCPU/mo
              </th>
              <th className="text-right font-medium" style={{ padding: '4px 0 6px 8px' }}>
                $/GiB/mo
              </th>
              {hasMatch && (
                <th className="text-right font-medium" style={{ padding: '4px 0 6px 8px' }}>
                  Match
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const fg = providerTone(r.provider).fg;
              const vcpuShade = shadeFor(r.usdPerVcpuMo, vcpuMin, vcpuMax);
              const gibShade = shadeFor(r.usdPerGibMo, gibMin, gibMax);
              return (
                <tr
                  key={`${r.provider}-${r.sku}`}
                  style={{ borderBottom: '1px solid var(--border-dark)' }}
                >
                  <td style={{ padding: '6px 8px 6px 0' }}>
                    <span className="font-semibold" style={{ color: fg }}>
                      {r.provider}
                    </span>
                    <span className="text-text-muted"> · </span>
                    <span className="font-mono text-text-secondary" title={r.sku}>
                      {r.sku}
                    </span>
                  </td>
                  <td
                    className="text-right tabular-nums font-mono"
                    style={{
                      padding: '6px 6px',
                      background: vcpuShade.bg,
                      color: vcpuShade.color ?? 'var(--text-primary)',
                      borderRadius: vcpuShade.bg ? 'var(--radius-sm)' : undefined,
                    }}
                  >
                    {fmtUsd(r.usdPerVcpuMo)}
                  </td>
                  <td
                    className="text-right tabular-nums font-mono"
                    style={{
                      padding: '6px 6px',
                      background: gibShade.bg,
                      color: gibShade.color ?? 'var(--text-primary)',
                      borderRadius: gibShade.bg ? 'var(--radius-sm)' : undefined,
                    }}
                  >
                    {fmtUsd(r.usdPerGibMo)}
                  </td>
                  {hasMatch && (
                    <td
                      className="text-right tabular-nums"
                      style={{ padding: '6px 0 6px 8px', color: 'var(--text-muted)' }}
                    >
                      {r.matchPct != null ? `${Math.round(r.matchPct)}%` : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(vcpuMin != null || gibMin != null) && (
        <div className="mt-2 flex gap-3 text-[9px] tracking-[0.04em] text-text-muted">
          <span className="flex items-center gap-1">
            <span
              style={{ width: 9, height: 9, background: CHEAP_BG, border: `1px solid ${CHEAP_FG}`, borderRadius: 2, display: 'inline-block' }}
            />
            lowest
          </span>
          <span className="flex items-center gap-1">
            <span
              style={{ width: 9, height: 9, background: DEAR_BG, border: `1px solid ${DEAR_FG}`, borderRadius: 2, display: 'inline-block' }}
            />
            highest
          </span>
        </div>
      )}
      {note && <div className="mt-3">{note}</div>}
    </div>
  );
}

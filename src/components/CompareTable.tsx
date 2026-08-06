/**
 * Persistent cross-cloud comparison table (v2.41).
 *
 * The numbered "comparison" zip-rows the user authors on the Comparison setup
 * page — one VM per cloud per row, paired by pick-order, with a per-row ≈%
 * similarity vs the base-cloud VM in that row. Extracted out of
 * `CrossCloudEquivalencyPanel`'s in-panel ComparisonBox so the SAME table can be
 * pinned to the top of At a Glance + VM Compare (and Executive Summary), driven
 * by the page-level `compareByProvider` state so it genuinely persists.
 *
 * On the persisted pages a row-toggle (① ② ③ …) selects which comparison row
 * anchors the page content below — `CompetitivePage` indexes its single-anchor
 * views (verdict / KPI / pricing / specs) by the active row, so toggling the row
 * re-scopes the whole page to that pairing.
 *
 * Kept self-contained (own tone map + the shared distance helpers) so it has no
 * dependency on the panel's internal layout vars.
 */
import { useState } from 'react';
import type { CatalogEntry } from '../types';
import { vmFeatures, describeMatch } from '../utils/equivalence';
// S66 FIX-A — the dock scores every picked pair through the ONE shared kernel
// (pairMatchPct) and colors it with the ONE shared pctTone, so the ≈% here can
// never disagree with the Specs verdict/showdown for the same pairing.
import { pairMatchPct } from './compare/specShowdownMath';
import { pctTone } from './compare/ui/tokens';

type P = 'Azure' | 'AWS' | 'GCP';

const TONE: Record<string, string> = {
  Azure: '#93C5FD',
  AWS: '#FCD34D',
  GCP: '#FCA5A5',
};
function tone(p: string): string {
  return TONE[p] ?? 'var(--interactive)';
}

export interface CompareTableProps {
  compareByProvider: Record<string, string[]>;
  /** The base cloud — its column leads and the ≈% is measured against it. */
  base: P;
  /** Clouds in display order; base must be first. */
  orderedClouds: P[];
  userVms: CatalogEntry[];
  /** ✕ / drag-out removal — by list position (duplicates allowed). */
  onRemoveAt?: (provider: P, index: number) => void;
  /** Drag within a column to re-pair. */
  onReorder?: (provider: P, from: number, to: number) => void;
  /** Persisted pages: show the row-toggle + highlight the active row. */
  showRowToggle?: boolean;
  activeRow?: number;
  onActiveRowChange?: (row: number) => void;
  /** Pin to the top of the scroll container. */
  sticky?: boolean;
  title?: string;
}

export function CompareTable({
  compareByProvider,
  base,
  orderedClouds,
  userVms,
  onRemoveAt,
  onReorder,
  showRowToggle = false,
  activeRow = 0,
  onActiveRowChange,
  sticky = false,
  title = 'Comparison',
}: CompareTableProps) {
  const [drag, setDrag] = useState<{ provider: P; index: number } | null>(null);

  const picks = compareByProvider;
  const clouds = orderedClouds;
  const others = clouds.filter((p) => p !== base);
  const maxRows = Math.max(0, ...clouds.map((p) => picks[p]?.length ?? 0));
  if (maxRows === 0) return null;

  // v2.41 — exact provider|size key, with a size-only fallback so the ≈% still
  // resolves for SKUs whose provider tag in the catalog differs from the column.
  // S66 FIX-A — FIRST catalog hit wins (was last-hit via overwriting set), the
  // same resolution order as every `userVms.find(...)` row lookup on the Specs
  // page — one of the two sources of the dock-93%-vs-Specs-94% drift.
  const byKey = new Map<string, CatalogEntry>();
  const byName = new Map<string, CatalogEntry>();
  for (const v of userVms) {
    const key = `${v.provider}|${v.vmSizeName}`;
    if (!byKey.has(key)) byKey.set(key, v);
    if (!byName.has(v.vmSizeName)) byName.set(v.vmSizeName, v);
  }
  const resolve = (provider: P, name: string) =>
    byKey.get(`${provider}|${name}`) ?? byName.get(name) ?? null;
  const matchInfo = (
    rowBaseName: string | undefined,
    p: P,
    name: string,
  ): { pct: number; why: string } | null => {
    if (!rowBaseName || p === base) return null;
    const a = resolve(base, rowBaseName);
    const b = resolve(p, name);
    if (!a || !b) return null;
    // The ONE picked-pair kernel (caveat-consistent VmDistanceOpts) — the other
    // source of the drift: the dock used a bare vmDistance with no opts.
    const pct = pairMatchPct(a, b);
    if (pct == null) return null;
    return { pct, why: describeMatch(vmFeatures(a), vmFeatures(b)) };
  };

  const handleDrop = (provider: P, toIndex: number) => {
    if (!drag || drag.provider !== provider) {
      setDrag(null);
      return;
    }
    onReorder?.(provider, drag.index, toIndex);
    setDrag(null);
  };

  const gridCols = `34px repeat(${clouds.length}, minmax(0, 1fr))`;

  const cell = (p: P, r: number, isBaseCol: boolean) => {
    const name = picks[p]?.[r];
    const t = tone(p);
    const dropProps = {
      onDragOver: (e: React.DragEvent) => {
        if (drag?.provider === p) e.preventDefault();
      },
      onDrop: () => handleDrop(p, r),
    };
    if (!name) {
      return (
        <div
          key={p}
          {...dropProps}
          className="px-2 py-1.5 text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          —
        </div>
      );
    }
    const info = isBaseCol ? null : matchInfo(picks[base]?.[r], p, name);
    return (
      <div
        key={p}
        draggable={!!onReorder}
        onDragStart={() => setDrag({ provider: p, index: r })}
        onDragEnd={(e) => {
          if (e.dataTransfer.dropEffect === 'none' && onRemoveAt) onRemoveAt(p, r);
          setDrag(null);
        }}
        {...dropProps}
        title={onReorder ? 'Drag to re-pair · drag out or ✕ to remove' : name}
        className="px-2 py-1 flex items-center justify-between gap-1.5"
        style={{
          cursor: onReorder ? 'grab' : 'default',
          borderRadius: 'var(--radius-md)',
          background: `${t}14`,
          border: `1px solid ${t}40`,
        }}
      >
        <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }} title={name}>
          {name}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {info != null && (
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{ color: pctTone(info.pct), cursor: 'help' }}
              title={info.why}
            >
              ≈{info.pct}%
            </span>
          )}
          {onRemoveAt && (
            <button
              type="button"
              onClick={() => onRemoveAt(p, r)}
              title="Remove from comparison"
              aria-label="Remove"
              className="leading-none opacity-60 hover:opacity-100 text-[11px]"
              style={{ color: t }}
            >
              ✕
            </button>
          )}
        </span>
      </div>
    );
  };

  const body = (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div>
          <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary">
            {title}
          </div>
          <div className="text-[10px] text-text-muted">
            Each row pairs the Nth pick from every cloud · ≈% is vs the{' '}
            <span style={{ color: tone(base) }}>{base}</span> VM in that row
            {onReorder ? ' · drag to re-pair, drag out or ✕ to remove' : ''}
          </div>
        </div>
        {showRowToggle && maxRows > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] tracking-[0.04em] font-semibold text-text-muted">
              VIEW ROW
            </span>
            {Array.from({ length: maxRows }).map((_, r) => {
              const on = r === activeRow;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onActiveRowChange?.(r)}
                  className="text-[11px] font-semibold tabular-nums transition-colors"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: on ? tone(base) : 'transparent',
                    color: on ? '#04111A' : 'var(--text-muted)',
                    border: `1px solid ${on ? tone(base) : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                  aria-pressed={on}
                  title={`View comparison row ${r + 1}`}
                >
                  {r + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Column header — cloud names, base leads. */}
      <div className="grid items-center mb-1" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
        <div />
        {clouds.map((p) => (
          <div
            key={p}
            className="px-2 text-[10px] font-semibold tracking-[0.04em] text-center"
            style={{ color: tone(p) }}
          >
            {p}
            {p === base && (
              <span className="text-text-muted font-normal normal-case tracking-normal"> · base</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {Array.from({ length: maxRows }).map((_, r) => {
          const isActive = showRowToggle && r === activeRow;
          return (
            <div
              key={r}
              className="grid items-center transition-colors"
              style={{
                gridTemplateColumns: gridCols,
                gap: 0,
                borderRadius: 'var(--radius-md)',
                padding: 2,
                background: isActive ? `${tone(base)}12` : 'transparent',
                outline: isActive ? `1px solid ${tone(base)}55` : '1px solid transparent',
              }}
            >
              <button
                type="button"
                onClick={() => onActiveRowChange?.(r)}
                disabled={!showRowToggle}
                className="inline-flex items-center justify-center text-[9px] font-semibold shrink-0"
                style={{
                  width: 17,
                  height: 17,
                  margin: '0 auto',
                  borderRadius: 999,
                  background: tone(base),
                  color: '#04111A',
                  cursor: showRowToggle ? 'pointer' : 'default',
                  opacity: showRowToggle && !isActive ? 0.5 : 1,
                }}
                title={showRowToggle ? `View comparison row ${r + 1}` : `Row ${r + 1}`}
              >
                {r + 1}
              </button>
              {cell(base, r, true)}
              {others.map((p) => cell(p, r, false))}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!sticky) return body;
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        paddingBottom: 4,
        background: 'var(--bg)',
      }}
    >
      {body}
    </div>
  );
}

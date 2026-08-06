/**
 * ChildRoster (v2.24) — a clickable list of a scope's children, fill-sorted.
 *
 * Generic: the parent builds the rows (regions in the fleet, zones in a
 * region, or clusters in a zone) with a drill `onClick`. Lets an operator
 * spot the hottest child and drill into it from the Inspector — the map
 * follows (clicks drive the lifted drill path / scope).
 */
import { utilTone } from '../fleetmapData';

export interface ChildRow {
  key: string;
  label: string;
  sub?: string;
  /** 0–100 fill (binding/memory) — drives the bar + tone. */
  pct: number;
  active?: boolean;
  onClick: () => void;
}

export function ChildRoster({ rows }: { rows: ChildRow[] }) {
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  return (
    <ul className="space-y-1">
      {sorted.map((r) => {
        const tone = utilTone(r.pct);
        return (
          <li key={r.key}>
            <button
              type="button"
              data-rack-no-deselect
              onClick={r.onClick}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 text-left transition-colors"
              style={{
                background: r.active ? 'rgba(129, 140, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${r.active ? 'var(--border-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
              }}
              title={`Drill into ${r.label}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-text-primary truncate">{r.label}</span>
                {r.sub && (
                  <span className="block text-[9.5px] text-text-muted truncate">{r.sub}</span>
                )}
              </span>
              <span
                style={{
                  position: 'relative',
                  width: 56,
                  height: 5,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--tint-soft-2)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: 'left',
                    transform: `scaleX(${Math.min(100, r.pct) / 100})`,
                    background: tone,
                    opacity: 0.85,
                  }}
                />
              </span>
              <span
                className="font-mono text-[10px] whitespace-nowrap"
                style={{ color: tone, minWidth: 40, textAlign: 'right' }}
              >
                {r.pct.toFixed(0)}%
              </span>
              <span aria-hidden="true" className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                ›
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

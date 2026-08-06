/**
 * Comparison dock (S54 · fluid scroll-morph S55).
 *
 * Behaves like the old page-pinned comparison table when you're at the TOP of a
 * Compare-family page (Specs / Pricing / Executive summary): the full table sits
 * inline at the top, on a SOLID surface. As you scroll down it does NOT snap —
 * it shrinks continuously, its height collapsing in lock-step with the scroll
 * position while a compact bubble crossfades in at the top-right corner. Scroll
 * back up (or hit ⤢ Expand) and the same scroll-linked values run in reverse,
 * so the table grows smoothly back into place.
 *
 * It carries a two-way mode toggle:
 *   • Comparison — the numbered cross-cloud zip-rows (the existing CompareTable).
 *   • VM BoM     — the committed VM-demand Bill of Materials ported across clouds
 *                  (PortedBomTable): base SKUs + best-match equivalents at the
 *                  same quantities, no region.
 *
 * Motion model — a single continuous progress `p = clamp(scrollTop / THRESHOLD)`
 * drives everything (rAF-throttled). The inline table collapses with `p` via a
 * `grid-template-rows: 1fr → 0fr` track (measurement-free, so page content below
 * rises with it instead of leaving a gap), and a fixed corner bubble fades +
 * scales in over the back half of the range. The overlap between the two is the
 * crossfade — no discrete swap, no jump. The VIEW ROW selector drives the
 * page-level `activeRow`, re-scoping the page below.
 */
import { useEffect, useRef, useState } from 'react';
import type { BomEntry, CatalogEntry } from '../../types';
import { CompareTable } from '../CompareTable';
import { PortedBomTable } from './PortedBomTable';

type P = 'Azure' | 'AWS' | 'GCP';

const TONE: Record<string, string> = {
  Azure: '#93C5FD',
  AWS: '#FCD34D',
  GCP: '#FCA5A5',
};
const tone = (p: string): string => TONE[p] ?? 'var(--interactive)';

/** Scroll distance (px) over which the dock fully condenses to the bubble.
 *  Shorter = collapses with fewer scroll lines (v2.52.14: 220 → 130). */
const COLLAPSE_PX = 130;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Smoothstep — gentle ease-in/ease-out, but largely linear through the middle
 *  so the motion stays tied to the scroll position (direct manipulation). */
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface FloatingCompareDockProps {
  compareByProvider: Record<string, string[]>;
  base: P;
  orderedClouds: P[];
  userVms: CatalogEntry[];
  activeRow: number;
  onActiveRowChange: (row: number) => void;
  onRemoveAt?: (provider: P, index: number) => void;
  onReorder?: (provider: P, from: number, to: number) => void;
  /** The committed VM-demand BoM (state.bom) — powers the VM BoM mode. */
  bom: BomEntry[];
  /** Report the effective mode (comparison ⇄ VM BoM) up so the page can re-scope
   *  the spec detail below to the BoM rows when VM BoM is active. */
  onModeChange?: (mode: 'comparison' | 'bom') => void;
  /** Jump to the simulator's VM Demand tab to edit the committed BoM — surfaced
   *  as a link on the VM BoM table so the user can change the BoM in place. */
  onEditBom?: () => void;
}

export function FloatingCompareDock({
  compareByProvider,
  base,
  orderedClouds,
  userVms,
  activeRow,
  onActiveRowChange,
  onRemoveAt,
  onReorder,
  bom,
  onModeChange,
  onEditBom,
}: FloatingCompareDockProps) {
  const rowCount = Math.max(0, ...orderedClouds.map((p) => compareByProvider[p]?.length ?? 0));
  const hasComparison = rowCount > 0;
  const hasBom = bom.length > 0;

  // Continuous scroll progress (0 = pinned-open at top, 1 = condensed bubble).
  const [p, setP] = useState(0);
  // Manual collapse — a button condenses the dock to the corner bubble WITHOUT
  // scrolling (so you don't have to scroll the page just to get it out of the
  // way). It overrides the scroll progress until you Expand again.
  const [forcedCollapsed, setForcedCollapsed] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [mode, setMode] = useState<'comparison' | 'bom'>(
    hasComparison ? 'comparison' : 'bom',
  );

  // The mode actually in effect (falls back when one side has no data).
  const effMode: 'comparison' | 'bom' =
    mode === 'comparison' && !hasComparison
      ? 'bom'
      : mode === 'bom' && !hasBom
        ? 'comparison'
        : mode;
  // Report it up so the page can re-scope the spec detail below to the BoM.
  useEffect(() => {
    onModeChange?.(effMode);
  }, [effMode, onModeChange]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef(0);

  // Scroll-link `p` to the nearest scrollable ancestor (the page's <main>), not
  // the window — programmatic scroll fires on it, and it's the surface that
  // actually overflows. rAF-throttled so the per-frame work stays cheap.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    let scroller: HTMLElement | null = null;
    let el = sentinel.parentElement;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
        scroller = el;
        break;
      }
      el = el.parentElement;
    }
    scrollerRef.current = scroller;
    const getTop = () => (scroller ? scroller.scrollTop : window.scrollY);
    const apply = () => {
      rafRef.current = 0;
      setP(clamp01(getTop() / COLLAPSE_PX));
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
    };
    apply();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!hasComparison && !hasBom) return null;

  const targets = orderedClouds.filter((p) => p !== base);

  const expandToTop = () => {
    const s = scrollerRef.current;
    if (s) s.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  // --- Interpolated motion values ---------------------------------------
  // `effP` is the scroll progress, but a manual collapse pins it to 1 (fully
  // condensed) regardless of scroll position. Height collapses across the whole
  // range (the dominant "shrink" gesture); the inline surface fades only over the
  // last stretch; the corner bubble fades + scales in just before the table is
  // gone (the crossfade handoff).
  const effP = forcedCollapsed ? 1 : p;
  const collapse = smooth(0, 1, effP); // 0 → 1 height collapse (drives the grid track)
  const inlineRows = `${(1 - collapse).toFixed(4)}fr`; // 1fr (open) → 0fr (gone)
  const inlineOpacity = 1 - smooth(0.62, 1, effP);
  const inlineGone = effP > 0.82;
  const bubble = smooth(0.48, 1, effP); // 0 → 1 corner-bubble presence
  const bubbleHidden = bubble <= 0.001;

  const SOLID: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border-glow)',
    overflow: 'hidden',
  };

  const modeBtn = (key: 'comparison' | 'bom', label: string, enabled: boolean) => {
    const on = effMode === key;
    return (
      <button
        key={key}
        type="button"
        disabled={!enabled}
        onClick={() => setMode(key)}
        className="text-[10px] tracking-[0.03em] font-semibold transition-colors"
        style={{
          padding: '4px 11px',
          borderRadius: 'var(--radius-pill)',
          background: on ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
          color: on ? 'var(--interactive)' : enabled ? 'var(--text-secondary)' : 'var(--text-muted)',
          border: `1px solid ${on ? 'var(--border-glow)' : 'transparent'}`,
          cursor: enabled ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : 0.45,
        }}
        aria-pressed={on}
      >
        {label}
      </button>
    );
  };

  const header = (showExpand: boolean) => (
    <div className="flex items-center gap-2 flex-wrap" style={{ padding: '8px 10px' }}>
      <div
        className="flex items-center gap-0.5 p-0.5"
        style={{
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)',
        }}
      >
        {modeBtn('comparison', 'Comparison', hasComparison)}
        {modeBtn('bom', 'VM BoM', hasBom)}
      </div>

      {(() => {
        // VIEW ROW deep-dives one line in the detail below — for BOTH the
        // comparison rows and the VM BoM lines (so VM BoM compares line-by-line
        // like a comparison).
        const n = effMode === 'bom' ? bom.length : rowCount;
        if (n <= 1) return null;
        const allActive = effMode === 'bom' && activeRow < 0;
        return (
          <div className="flex items-center gap-1">
            <span className="text-[9px] tracking-[0.04em] font-semibold text-text-muted">
              VIEW {effMode === 'bom' ? 'LINE' : 'ROW'}
            </span>
            {/* "All" — scope the page (Pricing total) to every BoM line at once. */}
            {effMode === 'bom' && (
              <button
                type="button"
                onClick={() => onActiveRowChange(-1)}
                className="text-[10px] font-semibold tracking-[0.03em] transition-colors"
                style={{
                  height: 22,
                  padding: '0 9px',
                  borderRadius: 999,
                  background: allActive ? tone(base) : 'transparent',
                  color: allActive ? '#04111A' : 'var(--text-muted)',
                  border: `1px solid ${allActive ? tone(base) : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
                aria-pressed={allActive}
                title="View all BoM lines (total cost of deploying every VM)"
              >
                All
              </button>
            )}
            {Array.from({ length: n }).map((_, r) => {
              const on = r === activeRow;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onActiveRowChange(r)}
                  className="text-[11px] font-semibold tabular-nums transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: on ? tone(base) : 'transparent',
                    color: on ? '#04111A' : 'var(--text-muted)',
                    border: `1px solid ${on ? tone(base) : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                  aria-pressed={on}
                  title={effMode === 'bom' ? `View BoM line ${r + 1}` : `View comparison row ${r + 1}`}
                >
                  {r + 1}
                </button>
              );
            })}
          </div>
        );
      })()}

      {showExpand ? (
        <button
          type="button"
          onClick={() => {
            setForcedCollapsed(false);
            expandToTop();
          }}
          className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold transition-colors"
          style={{
            padding: '4px 9px',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          title="Expand the comparison at the top of the page"
        >
          ⤢ Expand
        </button>
      ) : (
        // Inline (expanded) header — a collapse button condenses it to the corner
        // bubble immediately, no scrolling required.
        <button
          type="button"
          onClick={() => setForcedCollapsed(true)}
          className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold transition-colors"
          style={{
            padding: '4px 9px',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          title="Collapse to the corner (no scrolling needed)"
        >
          ⌃ Collapse
        </button>
      )}
    </div>
  );

  const tableBody = (
    // `overscrollBehavior: contain` keeps a scroll gesture INSIDE this table from
    // chaining to the page. Without it, reaching the table's scroll boundary
    // bubbled to the page, which advanced the dock's scroll-linked collapse
    // (gridTemplateRows 1fr→0fr), relaid-out this container, and snapped its
    // scrollTop back to 0 — the "keeps forcing me back to the top" bug.
    <div style={{ maxHeight: '52vh', overflow: 'auto', overscrollBehavior: 'contain', padding: '0 10px 10px' }}>
      {effMode === 'comparison' ? (
        <CompareTable
          compareByProvider={compareByProvider}
          base={base}
          orderedClouds={orderedClouds}
          userVms={userVms}
          onRemoveAt={onRemoveAt}
          onReorder={onReorder}
          showRowToggle
          activeRow={activeRow}
          onActiveRowChange={onActiveRowChange}
        />
      ) : (
        <div className="space-y-2">
          {onEditBom && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onEditBom}
                className="text-[11px] font-semibold underline underline-offset-2"
                style={{ color: 'var(--interactive)' }}
                title="Open the VM Demand tab to edit this Bill of Materials"
              >
                Edit BoM in VM Demand →
              </button>
            </div>
          )}
          <PortedBomTable
            bom={bom}
            userVms={userVms}
            base={base}
            targets={targets}
            activeRow={activeRow}
            onSelectRow={onActiveRowChange}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sentinel above the table — its parent chain locates the scroll surface. */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {/* Inline table — sticky at the top, continuously shrinking with scroll.
          A 1fr→0fr grid track drives the collapse (no height measurement), so
          the page content below rises with it (no dead gap); `contain` keeps
          the per-frame reflow scoped here. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'grid',
          gridTemplateRows: inlineRows,
          opacity: inlineOpacity,
          transform: reduce ? undefined : `translateY(${-6 * collapse}px)`,
          transformOrigin: 'top center',
          pointerEvents: inlineGone ? 'none' : 'auto',
          // NOTE: no `contain: layout paint` here — it forced an independent
          // relayout of the inner scroll container each time the collapse track
          // (gridTemplateRows) animated, which reset the table's scrollTop. The
          // collapse still animates fine without it; `overscrollBehavior: contain`
          // on the table body carries the scroll-isolation instead.
          willChange: p > 0 && p < 1 ? 'grid-template-rows, opacity' : undefined,
        }}
        aria-hidden={inlineGone}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ ...SOLID, borderRadius: 'var(--radius-lg)' }}>
            {header(false)}
            {tableBody}
          </div>
        </div>
      </div>

      {/* Corner bubble — fixed top-right, crossfading in as the table shrinks
          away. Only transform + opacity animate here (cheap, composited). */}
      <div
        style={{
          position: 'fixed',
          top: 64,
          right: 20,
          zIndex: 40,
          ...SOLID,
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          opacity: bubble,
          transform: reduce
            ? undefined
            : `translateY(${(1 - bubble) * -8}px) scale(${0.96 + 0.04 * bubble})`,
          transformOrigin: 'top right',
          pointerEvents: bubble > 0.5 ? 'auto' : 'none',
          visibility: bubbleHidden ? 'hidden' : 'visible',
          willChange: p > 0 && p < 1 ? 'transform, opacity' : undefined,
        }}
        aria-hidden={bubble < 0.5}
      >
        {header(true)}
      </div>
    </>
  );
}

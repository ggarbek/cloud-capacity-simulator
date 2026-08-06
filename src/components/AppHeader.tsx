import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { RunControl } from './RunControl';
import { buildFeedbackMailto, APP_VERSION } from '../utils/feedback';
import {
  buildSnapshot,
  downloadSnapshot,
  readSnapshotFile,
  summarizeSnapshot,
  type FleetSnapshot,
} from '../utils/saveLoad';
import {
  fetchDemoSnapshot,
  prepareSnapshotHydrate,
  DEMO_SUMMARY,
} from '../utils/demoSnapshot';

export type AppPage =
  | 'getting-started'
  | 'simulator'
  | 'competitive'
  | 'region-availability'
  | 'capacity-planning';

const PAGE_LABELS: Record<AppPage, string> = {
  'getting-started': 'Getting started',
  simulator: 'Simulator',
  // S47 — VM Competitive Offering + Region Availability were merged into one
  // page (the unified CompetitivePage shell, S45/S46), so the nav shows ONE
  // entry. Both routes still render that page; 'region-availability' stays a
  // valid route (deep-links / saved profiles) but is not a separate menu item.
  competitive: 'Cloud Market Analytics',
  'region-availability': 'Cloud Market Analytics',
  'capacity-planning': 'Capacity Planning',
};

const PAGE_ORDER: AppPage[] = [
  'getting-started',
  'simulator',
  'competitive',
  'capacity-planning',
];

// S47 — the header brand adapts to the active page: the big title + accent
// word + subtitle tag all change so the header reflects where you are (the
// VC suite mark stays constant). `competitive` + `region-availability` are
// the one merged "Cloud Market Analytics" page, so they share a title.
const PAGE_TITLE: Record<AppPage, { lead: string; accent: string; tag: string }> = {
  'getting-started': { lead: 'Getting', accent: 'Started', tag: 'Start here' },
  simulator: { lead: 'VM Capacity', accent: 'Simulator', tag: 'Fleet packing & economics' },
  competitive: { lead: 'Cloud Market', accent: 'Analytics', tag: 'Cross-cloud pricing & regions' },
  'region-availability': { lead: 'Cloud Market', accent: 'Analytics', tag: 'Cross-cloud pricing & regions' },
  'capacity-planning': { lead: 'Capacity', accent: 'Planning', tag: 'Fleet roadmap' },
};

interface AppHeaderProps {
  /** v2.8 — Top-level page nav. activePage drives the hamburger label; the
   *  menu items dispatch onPageChange. */
  activePage?: AppPage;
  onPageChange?: (p: AppPage) => void;
}

/* v2.21 (S29 redesign) — the ◧ ◨ ▤ pane-visibility toggle group is gone
 * with the three-pane workspace; the AdvancedShell's NavRail owns
 * navigation now. The header gained the primary Run action instead
 * (top of the dashboard = important page actions). */
export function AppHeader({
  activePage = 'simulator',
  onPageChange,
}: AppHeaderProps = {}) {
  const { state, dispatch } = useApp();
  const theme = state.ui.theme;

  return (
    <header
      className="flex items-center justify-between px-4 relative"
      style={{
        height: 56,
        // v3 substrate (S24 Pilot #2) — header flattened: the 40px backdrop
        // blur (the last glassmorphic surface) → a solid bar that matches the
        // flat panes. Solid bg-deep is opaque so scrolling content never
        // bleeds through; the bottom hairline does the separation.
        background: 'var(--bg-deep)',
        borderBottom: '1px solid var(--border)',
        // v2.12.1 — Establish a stacking context above the workspace so
        // the hamburger page-menu popover can't get trapped behind glass
        // surfaces in panes below.
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* v2.19.50 — Title block flex-shrinks first (min-w-0) so when the
          header gets narrow it's the brand that gets clipped, not the
          action buttons. Title + subtitle pinned to nowrap so they never
          wrap to two lines.
          v2.19.52 — PageMenu pulled OUT of the overflow-hidden title block
          so its popover isn't clipped — the previous arrangement made the
          hamburger appear empty (regression flagged by user). Outer flex
          row stays gap-3; the popover overlays underneath the brand. */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink">
        {onPageChange && (
          <div className="flex-shrink-0">
            <PageMenu activePage={activePage} onPageChange={onPageChange} />
          </div>
        )}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center font-bold text-base flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--interactive), var(--interactive-hover))',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            VC
          </div>
          <div className="min-w-0">
            <div
              className="font-semibold tracking-tight text-text-primary leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ fontSize: 19, letterSpacing: '-0.02em' }}
            >
              {PAGE_TITLE[activePage].lead}{' '}
              <span style={{ color: 'var(--interactive)' }}>
                {PAGE_TITLE[activePage].accent}
              </span>
            </div>
            <div
              className="text-[10px] font-mono text-text-muted tracking-[0.04em] leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {APP_VERSION} · {PAGE_TITLE[activePage].tag}
            </div>
          </div>
        </div>
      </div>
      {/* v2.19.50 — Nav pinned: flex-shrink-0 on the whole bar + nowrap on
          every action so labels never break across two lines. gap reduced
          from 4 to 3 to recoup some horizontal room. */}
      <nav className="flex items-center gap-3 text-sm text-text-secondary flex-shrink-0 whitespace-nowrap">
        {/* v2.22.4 — Simple/Advanced toggle removed: the NavRail's Results
            group (Overview + Fleet map) now covers what the Simple track did,
            so the single Advanced workspace is the only view. */}
        {/* Run is THE page action of the workspace, so it lives here:
            always visible, never buried in a setup tab. */}
        {activePage === 'simulator' && <RunControl />}
        {/* v2.19.49 — Promoted "Try Demo" out of the Save/Load nested menu
            into a dedicated header button. The demo was unfindable for
            new users buried inside a save-file menu. */}
        <TryDemoButton />
        {/* v2.19.45 — Save/Load fleet snapshot to/from a local JSON file.
            Complementary to the existing localStorage auto-persist — gives
            users a portable backup that survives cache clears and moves
            between browsers/computers. */}
        <SaveLoadMenu />
        {/* v2.19.40 — Feedback link replaces the old GitHub ↗ link. */}
        <a
          href={buildFeedbackMailto({ page: activePage })}
          className="text-text-secondary hover:text-interactive transition-colors flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
          style={{ lineHeight: 1.2 }}
          title="Send feedback or report a bug — opens your mail client with auto-filled context"
        >
          <span aria-hidden="true">💬</span>
          <span>Feedback</span>
        </a>
        <ThemeSwitch
          theme={theme}
          onToggle={() =>
            dispatch({ type: 'UI_SET', ui: { theme: theme === 'dark' ? 'light' : 'dark' } })
          }
        />
      </nav>
    </header>
  );
}

/**
 * v2.8 — Top-level page-nav menu. Hamburger button on the left side of the
 * header opens an inline popover listing the three suite pages: Simulator,
 * Competitive Offering, Capacity Planning. The active page is highlighted.
 * Click outside / pick a page / press Esc to close.
 */
function PageMenu({
  activePage,
  onPageChange,
}: {
  activePage: AppPage;
  onPageChange: (p: AppPage) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Switch page"
        aria-label="Open page menu"
        aria-expanded={open}
        className="flex items-center justify-center transition-all"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: open ? 'rgba(129, 140, 248, 0.12)' : 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          color: open ? 'var(--interactive)' : 'var(--text-secondary)',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ☰
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2"
          style={{
            // v2.12.1 — Bumped well above any glass surface in the dashboard
            // so the menu always renders on top. Also using a near-opaque
            // background instead of the standard glass surface — translucent
            // backgrounds against another glass pane underneath were making
            // the menu read as "stuck behind" content. Strong drop shadow
            // keeps the floating feel without relying on transparency.
            zIndex: 1000,
            minWidth: 220,
            // Theme-safe: var(--bg) is opaque in BOTH dark and light themes.
            // Layered on a glow tint so the menu stays distinct from the
            // canvas behind without relying on translucent glass.
            background: 'var(--bg)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-md)',
            boxShadow:
              '0 24px 48px -16px rgba(0,0,0,0.65), 0 0 0 1px rgba(129, 140, 248, 0.10), 0 0 32px -8px rgba(129, 140, 248, 0.25)',
            padding: 6,
          }}
        >
          <div
            className="px-3 pt-1 pb-2 text-[9px] tracking-[0.04em] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Capacity Suite
          </div>
          {PAGE_ORDER.map((p) => {
            // 'Cloud Market Analytics' (competitive) is active for either of the
            // two merged routes — the old region-availability deep-link lands here too.
            const isActive =
              p === activePage ||
              (p === 'competitive' && activePage === 'region-availability');
            // v2.19.44 — WIP badge for the pages that aren't finished yet.
            // Simulator + Getting started (v2.23) are stable; the others
            // ship as previews so users know not to rely on them.
            const isWip = p !== 'simulator' && p !== 'getting-started';
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onPageChange(p);
                  setOpen(false);
                }}
                className="w-full text-left transition-colors flex items-center justify-between gap-2"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(129, 140, 248, 0.14)' : 'transparent',
                  color: isActive ? 'var(--interactive)' : 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
                title={isWip ? `${PAGE_LABELS[p]} · work in progress, expect rough edges` : undefined}
              >
                <span>{PAGE_LABELS[p]}</span>
                <span className="flex items-center gap-1.5">
                  {isWip && (
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(251, 191, 36, 0.14)',
                        color: '#FCD34D',
                        border: '1px solid rgba(251, 191, 36, 0.40)',
                        fontWeight: 600,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      WIP
                    </span>
                  )}
                  {isActive && (
                    <span style={{ fontSize: 11, opacity: 0.85 }}>●</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemeSwitch({
  theme,
  onToggle,
}: {
  theme: 'light' | 'dark';
  onToggle: () => void;
}) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center gap-1 rounded-full text-[11px] font-medium px-1 py-1 transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <span
        className="px-2 py-0.5 rounded-full transition-all"
        style={{
          background: !isDark ? 'var(--interactive)' : 'transparent',
          color: !isDark ? '#04111A' : 'var(--text-muted)',
          boxShadow: !isDark ? '0 0 10px rgba(129, 140, 248, 0.4)' : 'none',
          fontWeight: !isDark ? 600 : 500,
        }}
      >
        ☀ Light
      </span>
      <span
        className="px-2 py-0.5 rounded-full transition-all"
        style={{
          background: isDark ? 'var(--interactive)' : 'transparent',
          color: isDark ? '#04111A' : 'var(--text-muted)',
          boxShadow: isDark ? '0 0 10px rgba(129, 140, 248, 0.4)' : 'none',
          fontWeight: isDark ? 600 : 500,
        }}
      >
        ☾ Dark
      </span>
    </button>
  );
}

/**
 * v2.19.49 — Promoted "Try Demo" button. Top-level header action so a
 * new user lands on the app and immediately sees a one-click "show me
 * what this does" affordance — no menu hunting required. Confirms
 * before overwriting any existing state.
 */
function TryDemoButton() {
  const { state, dispatch } = useApp();
  const onClick = async () => {
    // If the user already has authored content, ask before nuking it.
    const hasContent =
      state.userHardware.length > 0 ||
      state.fleetOrder.length > 0 ||
      state.bom.length > 0;
    if (hasContent) {
      const ok = window.confirm(
        `Load the demo scenario?\n\n${DEMO_SUMMARY}\n\n` +
          `This will REPLACE your current BoM, fleet, hardware, and fungibility settings. ` +
          `Use 💾 Save / Load → Export to file first if you want a backup.`,
      );
      if (!ok) return;
    }
    // v2.20.1 — the demo IS the walkthrough snapshot (zonal + spillover).
    const fetched = await fetchDemoSnapshot();
    if (!fetched.ok) {
      window.alert(fetched.error);
      return;
    }
    dispatch({ type: 'HYDRATE', state: prepareSnapshotHydrate(fetched.snapshot, state) });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 transition-all flex-shrink-0 whitespace-nowrap"
      style={{
        padding: '4px 12px',
        background: 'rgba(129, 140, 248, 0.18)',
        color: 'var(--interactive)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-pill)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '0.02em',
        boxShadow: 'var(--shadow-card)',
        lineHeight: 1.2,
      }}
      title={`Load a worked example so you can see the engine in action — ${DEMO_SUMMARY}`}
    >
      <span aria-hidden="true">▶</span>
      <span>Try Demo</span>
    </button>
  );
}

/**
 * v2.19.45 — Save / Load fleet snapshot menu.
 *
 * Header button opens an inline popover with Export + Import options.
 * Export builds a JSON snapshot from the current AppState and triggers
 * a browser download. Import opens a file picker, parses + validates
 * the file, and confirms before dispatching HYDRATE.
 *
 * Confirmation on import: replacing your current state is destructive,
 * so we show a window.confirm() with the snapshot's summary (BoM rows,
 * cluster count, server-type count, export date) before applying.
 */
function SaveLoadMenu() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss the toast after a few seconds.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onExport = () => {
    try {
      const snap = buildSnapshot(state, APP_VERSION);
      const filename = downloadSnapshot(snap);
      setMsg({ kind: 'ok', text: `Saved to ${filename}` });
    } catch (err) {
      setMsg({
        kind: 'err',
        text: `Export failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      });
    }
    setOpen(false);
  };

  const onImportClick = () => {
    fileRef.current?.click();
  };

  // v2.20.1 — ONE demo path: the bundled walkthrough snapshot (zonal +
  // spillover, the user-blessed scenario). Fetched from /public so the
  // ~30 MB payload is streamed by the browser rather than bundled.
  // Replaces both the synthetic "Load demo" and the separate "Load
  // walkthrough" items (they were two demos; the walkthrough won).
  const onLoadDemo = async () => {
    const fetched = await fetchDemoSnapshot();
    if (!fetched.ok) {
      setMsg({ kind: 'err', text: fetched.error });
      return;
    }
    const proceed = window.confirm(
      `Load the demo scenario?\n\n${DEMO_SUMMARY}\n\n` +
        `This will REPLACE your current BoM, fleet, hardware, VM catalog, fungibility, and equivalency. ` +
        `Export your current state first if you want a backup.`,
    );
    if (!proceed) return;
    dispatch({ type: 'HYDRATE', state: prepareSnapshotHydrate(fetched.snapshot, state) });
    setMsg({ kind: 'ok', text: `Demo loaded · ${fetched.summary} · hit ▶ Run simulation.` });
    setOpen(false);
  };

  const onFile = async (file: File) => {
    const result = await readSnapshotFile(file);
    if (!result.ok || !result.snapshot) {
      setMsg({ kind: 'err', text: result.error ?? 'Could not read snapshot.' });
      return;
    }
    const snap: FleetSnapshot = result.snapshot;
    const summary = summarizeSnapshot(snap);
    const proceed = window.confirm(
      `Replace your current state with this snapshot?\n\n${summary}\n\n` +
        `This will overwrite your BoM, fleet composition, hardware library, VM catalog, fungibility matrix, and equivalency table. ` +
        `Anything not in the snapshot stays as-is. ` +
        `You can re-export your current state first if you want a backup.`,
    );
    if (!proceed) return;
    // v2.20.1 — prepareSnapshotHydrate derives ui.activeRegion from the
    // snapshot's fleets/catalog and clears the stale pre-import result —
    // a raw HYDRATE left both behind (mis-scoped pricing + a lying result).
    dispatch({ type: 'HYDRATE', state: prepareSnapshotHydrate(snap, state) });
    setMsg({ kind: 'ok', text: `Imported ${file.name} · ${summary}` });
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="text-text-secondary hover:text-interactive transition-colors flex items-center gap-1.5 whitespace-nowrap"
        style={{ lineHeight: 1.2 }}
        title="Save your fleet to a file or load a previously saved snapshot"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden="true">💾</span>
        <span>Save / Load</span>
      </button>
      {open && (
        // v2.19.51 — Pin width + cancel the whitespace-nowrap cascade from
        // <nav>. Without `whiteSpace: 'normal'` the menu's description
        // strings stayed on single lines and blew the popover well past
        // the viewport width — Import from file ended up off-screen.
        // Fixed width (320px) + maxWidth clamp + display: flex column so
        // children stack predictably regardless of cascaded layout hints.
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            display: 'flex',
            flexDirection: 'column',
            whiteSpace: 'normal',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow:
              '0 24px 48px -16px rgba(0,0,0,0.65), 0 0 0 1px rgba(129, 140, 248, 0.10), 0 0 32px -8px rgba(129, 140, 248, 0.25)',
            padding: 6,
            zIndex: 1000,
          }}
        >
          <div
            className="px-3 pt-1 pb-2 text-[9px] tracking-[0.04em] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Fleet snapshot
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onExport}
            className="w-full text-left transition-colors"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--interactive)' }}>⤓</span>
              <span>Export to file</span>
            </div>
            <div
              className="text-[10px] text-text-muted mt-0.5"
              style={{ paddingLeft: 22 }}
            >
              Download a JSON of your current BoM, fleet, hardware, VMs &amp; rules
            </div>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onImportClick}
            className="w-full text-left transition-colors"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--interactive)' }}>⤒</span>
              <span>Import from file</span>
            </div>
            <div
              className="text-[10px] text-text-muted mt-0.5"
              style={{ paddingLeft: 22 }}
            >
              Replace current state with a previously-exported snapshot
            </div>
          </button>
          <div
            className="text-[9px] tracking-[0.04em] font-semibold px-3 pt-3 pb-1"
            style={{
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              marginTop: 4,
            }}
          >
            New to the app?
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onLoadDemo}
            className="w-full text-left transition-colors"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--interactive)' }}>▶</span>
              <span>Load demo</span>
            </div>
            <div
              className="text-[10px] text-text-muted mt-0.5 leading-snug"
              style={{ paddingLeft: 22 }}
            >
              {DEMO_SUMMARY}
            </div>
          </button>
          {/* v2.20.1 — the separate "Load walkthrough" item is gone: the
              walkthrough snapshot IS the demo now (one demo, the good one). */}
          <div
            className="text-[9.5px] text-text-muted leading-snug px-3 pt-2 pb-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}
          >
            Your work is also auto-saved to this browser&apos;s storage as you go.
            Export to a file when you want a portable backup or to move plans
            between browsers / computers.
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      {msg && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 240,
            maxWidth: 360,
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background:
              msg.kind === 'ok' ? 'rgba(129, 140, 248, 0.10)' : 'rgba(239, 68, 68, 0.10)',
            border: `1px solid ${
              msg.kind === 'ok' ? 'var(--border-glow)' : 'rgba(239, 68, 68, 0.45)'
            }`,
            color: msg.kind === 'ok' ? 'var(--interactive)' : '#FCA5A5',
            fontSize: 11,
            zIndex: 1000,
          }}
          role="status"
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}


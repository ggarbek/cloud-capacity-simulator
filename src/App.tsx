import { AppProvider } from './state/AppContext';
import { AppHeader } from './components/AppHeader';
import { AdvancedShell } from './components/AdvancedShell';
import { CompetitivePage } from './components/CompetitivePage';
import { CapacityPlanningPage } from './components/CapacityPlanningPage';
import { GettingStartedPage } from './components/GettingStartedPage';
import { useApp } from './state/AppContext';
import { buildFeedbackMailto } from './utils/feedback';
import { TerminalPanel } from './terminal/TerminalPanel';

/**
 * v2.8 — Top-level page router. AppHeader renders OUTSIDE the switch so
 * the page nav stays visible at all times.
 *
 * v2.21 (S29 redesign) — the Advanced workspace is now `AdvancedShell`:
 * a navigation rail + ONE surface at a time, with setup and results as
 * separate workspaces. The three-resizable-pane Workspace, its header
 * pane toggles, the CollapseRail, and the EmptyStateWelcome banner are
 * retired (the Results overview's empty state + Quick start own the
 * first-run path now). `git diff advanced-v1..HEAD -- src/App.tsx` shows
 * the full before/after.
 */
function PageRouter() {
  const { state, dispatch } = useApp();
  const page = state.ui.activePage;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      <AppHeader
        activePage={page}
        onPageChange={(p) => dispatch({ type: 'UI_SET', ui: { activePage: p } })}
      />
      {/* v2.22.4 — The Simulator page is the single Advanced workspace
          (NavRail shell: Set up pages + Results pages). The Simple track +
          its header toggle were retired once the Results group (Overview =
          the five answers + Fleet map) covered the same ground. */}
      {page === 'getting-started' && <GettingStartedPage />}
      {page === 'simulator' && <AdvancedShell />}
      {/* v2.30 — Both top-level entries route into ONE unified Competitive
          Offering sidebar shell; the menu item just picks the landing tab. */}
      {page === 'competitive' && <CompetitivePage initialTab="setup" />}
      {page === 'region-availability' && (
        <CompetitivePage initialTab="region-availability" />
      )}
      {page === 'capacity-planning' && <CapacityPlanningPage />}
      <CopyrightFooter />
      {/* v2.27 — the in-dashboard data assistant. Floats over every page,
          grounds its answers in the current page's data, and is sandboxed to
          the simulator (no engine internals, no personal info). */}
      <TerminalPanel />
    </div>
  );
}

/**
 * v3 substrate (S24 Pilot #2) — slim normal-flow footer bar at the bottom
 * of the 100vh column; panes scroll above it, it never overlaps content.
 * Carries the only legal signal + the feedback mailto.
 */
function CopyrightFooter() {
  const { state } = useApp();
  return (
    <div
      className="flex-shrink-0 flex items-center justify-end px-4 gap-1"
      style={{
        height: 22,
        fontSize: 10,
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        userSelect: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
      aria-label="Project attribution"
    >
      <span>Cloud Capacity Simulator · MIT licensed ·</span>
      <a
        href={buildFeedbackMailto({ page: state.ui.activePage })}
        style={{
          color: 'inherit',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 2,
        }}
        title="Send feedback or report a bug"
      >
        feedback
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PageRouter />
    </AppProvider>
  );
}

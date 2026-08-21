import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { NavRail } from './NavRail';
import { FleetMap, type DrillPath } from './fleetmap/FleetMap';
import { InsightsPane } from './InsightsPane';
import { ResizeHandle } from './ResizeHandle';
import { AnswersPanel } from './AnswersPanel';
import { ScenarioAnalysis } from './ScenarioAnalysis';
import { StartHerePage } from './StartHerePage';
import { GettingStartedPage } from './GettingStartedPage';
import { QuickStartTab } from './QuickStartTab';
import { ConfigureTab } from './ConfigureTab';
import { FleetTab } from './FleetTab';
import { HardwareTab } from './HardwareTab';
import { VmTab } from './VmTab';
import { FungibilityTab } from './FungibilityTab';
import { SIDE_PANEL_MIN, SIDE_PANEL_MAX } from '../state/AppState';
import { useRunSimulation } from '../utils/useRunSimulation';
import {
  fetchDemoSnapshot,
  prepareSnapshotHydrate,
  isDemoFleet,
  DEMO_SUMMARY,
} from '../utils/demoSnapshot';
import { listScopeOptions } from '../utils/scenario';
import { buildFleetHierarchy } from './fleetmap/fleetmapData';

/**
 * v2.21 — The Advanced shell, rebuilt around ONE principle: setup and
 * results are different jobs, so they get different workspaces.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ AppHeader: brand · mode · ▶ Run · demo / save / theme    │
 *   ├────────┬─────────────────────────────────────────────────┤
 *   │ NavRail│ ONE surface at a time:                          │
 *   │ Results│   overview — the five answers (AnswersPanel)    │
 *   │ Set up │   fleetmap — 3-altitude map + Inspector overlay │
 *   │        │   setup    — the active authoring page,         │
 *   │        │              centered at a readable width       │
 *   └────────┴─────────────────────────────────────────────────┘
 *
 * Replaces the three-resizable-pane Workspace (Configure | Viz | Insights
 * all mounted at once — 15-20 simultaneous regions). The plumbing is
 * untouched: same state, same tab components, same engine.
 */
export function AdvancedShell() {
  const { state } = useApp();
  const view = state.ui.workspaceView;
  return (
    <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      <NavRail />
      <main className="flex-1 flex flex-col min-w-0" style={{ minHeight: 0 }}>
        {view === 'setup' && <SetupSurface />}
        {view === 'overview' && <ResultsOverview />}
        {view === 'fleetmap' && <FleetMapView />}
        {view === 'scenario' && <ScenarioSurface />}
      </main>
    </div>
  );
}

/**
 * Setup workspace — renders the active authoring page at a readable
 * width. The tab components are unchanged (they already own their
 * scrolling + simple-baseline layouts); this surface just gives each one
 * the full content area instead of a 380px sidebar slice.
 */
// One-line "what this page is for" + a deep-link to the matching concept in
// the Glossary. Keyed by setup tab.
const SETUP_INTROS: Record<
  string,
  { text: string; conceptId: string; conceptLabel: string }
> = {
  quickstart: {
    text: 'Stand up a whole fleet from one form — pick a server, region, zones, and the VMs to run, then run it.',
    conceptId: 'quick-start-routing',
    conceptLabel: 'Quick start & automatic routing',
  },
  hardware: {
    text: 'Define the server types your fleet runs on — memory, cores, nodes per rack, network, and cost.',
    conceptId: 'hardware-nodes-racks',
    conceptLabel: 'Hardware, nodes & racks',
  },
  fungibility: {
    text: 'Set the routing policy: which VM families may land on which hardware, and in what order (Home, then Spillover).',
    conceptId: 'fungibility',
    conceptLabel: 'Fungibility — Home vs Spillover',
  },
  fleet: {
    text: 'Place racks of your servers into regions and availability zones — the physical shape of your fleet.',
    conceptId: 'fleet-clusters',
    conceptLabel: 'Fleet & clusters',
  },
  configure: {
    text: 'List the VMs to deploy — which sizes, how many, and where (a region, spread or pinned to zones).',
    conceptId: 'vm-demand',
    conceptLabel: 'VM demand (Bill of Materials)',
  },
  vms: {
    text: 'Browse the seeded VM library — specs and list pricing. Optional; sizes are pre-loaded.',
    conceptId: 'pricing-basis',
    conceptLabel: 'Pricing basis (PAYG / RI)',
  },
};

function SetupIntro({ tab }: { tab: string }) {
  const { dispatch } = useApp();
  const intro = SETUP_INTROS[tab];
  if (!intro) return null;
  return (
    <div
      className="flex items-start gap-3 flex-wrap"
      style={{
        margin: '4px 0 14px',
        padding: '10px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ flex: 1, minWidth: 220, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {intro.text}
      </span>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'UI_SET',
            ui: { activeSidebarTab: 'glossary', workspaceView: 'setup', helpConcept: intro.conceptId },
          })
        }
        className="flex-shrink-0"
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--interactive)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 0',
          whiteSpace: 'nowrap',
        }}
        title={`Open Glossary → Concepts → ${intro.conceptLabel}`}
      >
        Learn: {intro.conceptLabel} →
      </button>
    </div>
  );
}

function SetupSurface() {
  const { state } = useApp();
  const tab = state.ui.activeSidebarTab;
  return (
    // v2.21.2 — the setup surface OWNS the scroll. The deep tabs are plain
    // content divs (HardwareTab, VmTab, FungibilityTab, QuickStartTab) that
    // relied on the retired Sidebar's `overflow-y-auto` wrapper; without a
    // scroller here their content clipped at the viewport edge (the "can't
    // scroll down once the library is expanded" bug). ConfigureTab/FleetTab
    // size to `h-full` and fit exactly, so they don't double-scroll.
    <div
      className="flex-1 min-h-0 w-full overflow-y-auto"
      style={{ background: 'var(--bg)' }}
    >
      <div className="min-h-full w-full" style={{ maxWidth: 1020, margin: '0 auto' }}>
        {tab !== 'start-here' && tab !== 'glossary' && (
          <div style={{ padding: '14px 16px 0' }}>
            <SetupIntro tab={tab} />
          </div>
        )}
        {tab === 'start-here' && <StartHerePage kind="simulator" />}
        {tab === 'glossary' && <GettingStartedPage />}
        {tab === 'quickstart' && <QuickStartTab />}
        {tab === 'hardware' && <HardwareTab />}
        {tab === 'fleet' && <FleetTab />}
        {tab === 'fungibility' && <FungibilityTab />}
        {tab === 'configure' && <ConfigureTab />}
        {tab === 'vms' && <VmTab />}
      </div>
    </div>
  );
}

/**
 * Results › Overview — the five answers, leading. What the user most
 * needs sits at the top of the page (verdicts), drill-in below, and the
 * fleet map one click away. Pre-run it teaches instead of showing an
 * empty shell.
 */
function ResultsOverview() {
  const { state, dispatch } = useApp();
  const result = state.result;
  const rateType = state.ui.rateType;
  const { run, canRun, stale } = useRunSimulation();
  // "Where" scope — LOCAL to the Overview (independent of the fleet map's
  // ui.scope so the two don't fight). Scopes placement / financials / headroom.
  const [scopeId, setScopeId] = useState('fleet');

  const scopeOptions = useMemo(
    () => (result ? listScopeOptions(buildFleetHierarchy(state, result)) : []),
    [state, result],
  );
  // "Where" grouped into Fleet-wide + Regions / Zones / Clusters tiers —
  // mirrors the Scenario analysis tab's organization.
  const scopeGroups = useMemo(
    () => ({
      fleet: scopeOptions.filter((o) => o.kind === 'fleet'),
      regions: scopeOptions.filter((o) => o.kind === 'region'),
      zones: scopeOptions.filter((o) => o.kind === 'zone'),
      clusters: scopeOptions.filter((o) => o.kind === 'cluster'),
    }),
    [scopeOptions],
  );
  const scopeOpt = scopeOptions.find((o) => o.id === scopeId) ?? scopeOptions[0];
  const scope = scopeOpt?.scope ?? null;

  if (!result) return <OverviewEmptyState />;

  return (
    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 28px 56px' }}>
        <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 6 }}>
          <div className="min-w-0">
            <h1
              className="font-semibold"
              style={{
                fontSize: 24,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.15,
              }}
            >
              Results
            </h1>
            <div className="text-[12px]" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
              {scopeOpt && scopeOpt.kind !== 'fleet' ? scopeOpt.label : 'Fleet-wide'}
              {isDemoFleet(state) ? ' · demo fleet' : ''}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="flex items-center gap-1.5" title="Scope the results to a region, zone, or cluster">
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Where</span>
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  maxWidth: 220,
                }}
              >
                {scopeGroups.fleet.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
                {scopeGroups.regions.length > 0 && (
                  <optgroup label="Regions">
                    {scopeGroups.regions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </optgroup>
                )}
                {scopeGroups.zones.length > 0 && (
                  <optgroup label="Zones">
                    {scopeGroups.zones.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </optgroup>
                )}
                {scopeGroups.clusters.length > 0 && (
                  <optgroup label="Clusters">
                    {scopeGroups.clusters.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <RateSwitch
              rateType={rateType}
              onChange={(r) => dispatch({ type: 'UI_SET', ui: { rateType: r } })}
            />
            <button
              type="button"
              onClick={() => dispatch({ type: 'UI_SET', ui: { workspaceView: 'fleetmap' } })}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)',
                background: 'var(--tint-soft)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title="Open the rack visualization with per-node and financial drill-down"
            >
              <span aria-hidden="true">◨</span>
              <span>Open fleet map</span>
            </button>
          </div>
        </div>

        {stale && (
          <div
            className="flex items-center justify-between gap-3 flex-wrap"
            style={{
              margin: '10px 0 0',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.40)',
              color: 'var(--status-warn)',
              fontSize: 12,
            }}
          >
            <span>Inputs changed since this run — the answers below may be out of date.</span>
            <button
              type="button"
              onClick={run}
              disabled={!canRun}
              className="font-semibold underline"
              style={{ color: 'inherit', cursor: canRun ? 'pointer' : 'not-allowed' }}
            >
              ↻ Re-run now
            </button>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <AnswersPanel state={state} result={result} rateType={rateType} scope={scope} />
        </div>
      </div>
    </div>
  );
}

/**
 * Results › Scenario analysis — "what else could pack onto the fleet?"
 * Pick a VM size + scope (fleet / region / zone / cluster); see how many
 * more fit into the leftover capacity of the current run, where they'd
 * land, and what would be blocked. Additive — nothing is added to the
 * fleet. Pre-run it teaches (same empty state as Overview).
 */
function ScenarioSurface() {
  const { state, dispatch } = useApp();
  const result = state.result;
  const rateType = state.ui.rateType;

  if (!result) return <OverviewEmptyState />;

  return (
    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 28px 56px' }}>
        <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 6 }}>
          <div className="min-w-0">
            <h1
              className="font-semibold"
              style={{
                fontSize: 24,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.15,
              }}
            >
              Scenario analysis
            </h1>
            <div className="text-[12px]" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
              What else could pack onto the current fleet — headroom on top of the run
            </div>
          </div>
          <div className="flex-shrink-0">
            <RateSwitch
              rateType={rateType}
              onChange={(r) => dispatch({ type: 'UI_SET', ui: { rateType: r } })}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <ScenarioAnalysis state={state} result={result} rateType={rateType} />
        </div>
      </div>
    </div>
  );
}

/** Compact PAYG / 1y RI / 3y RI basis switch (capability parity with the
 *  Insights pane's rate selector — every $ figure on this page follows it). */
function RateSwitch({
  rateType,
  onChange,
}: {
  rateType: 'payg' | 'ri1y' | 'ri3y';
  onChange: (r: 'payg' | 'ri1y' | 'ri3y') => void;
}) {
  const opts: { id: 'payg' | 'ri1y' | 'ri3y'; label: string; hint: string }[] = [
    { id: 'payg', label: 'PAYG', hint: 'Pay-as-you-go hourly rates' },
    { id: 'ri1y', label: '1y RI', hint: '1-year reserved-instance equivalent rates' },
    { id: 'ri3y', label: '3y RI', hint: '3-year reserved-instance equivalent rates' },
  ];
  return (
    <div
      role="group"
      aria-label="Pricing basis"
      className="flex items-center gap-0.5 p-0.5"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--tint-soft)',
      }}
    >
      {opts.map((o) => {
        const active = rateType === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            title={o.hint}
            className="transition-colors"
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              background: active ? 'var(--interactive)' : 'transparent',
              color: active ? '#FFFFFF' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pre-run Overview — an empty state that teaches. One screen, three
 * paths, ordered by commitment: run what's configured / set up guided /
 * see the worked demo.
 */
function OverviewEmptyState() {
  const { state, dispatch } = useApp();
  const { run, canRun } = useRunSimulation();
  const hasContent =
    state.userHardware.length > 0 || state.fleetOrder.length > 0 || state.bom.length > 0;

  const onLoadDemo = async () => {
    if (hasContent) {
      const ok = window.confirm(
        `Load the demo scenario?\n\n${DEMO_SUMMARY}\n\n` +
          `This will REPLACE your current BoM, fleet, hardware, and fungibility settings. ` +
          `Use 💾 Save / Load → Export to file first if you want a backup.`,
      );
      if (!ok) return;
    }
    const fetched = await fetchDemoSnapshot();
    if (!fetched.ok) {
      window.alert(fetched.error);
      return;
    }
    dispatch({ type: 'HYDRATE', state: prepareSnapshotHydrate(fetched.snapshot, state) });
  };

  return (
    <div className="flex-1 overflow-y-auto grid place-items-center" style={{ minHeight: 0 }}>
      <div
        className="text-center"
        style={{ maxWidth: 460, padding: '48px 24px', margin: '0 auto' }}
      >
        <div
          aria-hidden="true"
          className="grid place-items-center mx-auto"
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--interactive-muted)',
            color: 'var(--interactive)',
            fontSize: 18,
            marginBottom: 14,
          }}
        >
          ▤
        </div>
        <h1
          className="font-semibold"
          style={{
            fontSize: 20,
            letterSpacing: '-0.015em',
            color: 'var(--text-primary)',
            lineHeight: 1.25,
          }}
        >
          No results yet
        </h1>
        <p
          className="text-[12.5px] leading-relaxed"
          style={{ color: 'var(--text-muted)', marginTop: 8 }}
        >
          Run a simulation and this page answers five questions: is the deployment
          supportable, where is it blocked, how much more can you sell, does new
          hardware make sense, and when does it pay back.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginTop: 18 }}>
          {canRun ? (
            <button type="button" onClick={run} className="btn-primary" style={{ padding: '8px 18px', fontSize: 12.5 }}>
              ▶ Run simulation
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'quickstart' } })
              }
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: 12.5 }}
              title="Server + region + zones + demand in one form, then Build & run"
            >
              ⚡ Set up with Quick start
            </button>
          )}
          <button
            type="button"
            onClick={onLoadDemo}
            className="transition-colors"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-glow)',
              background: 'transparent',
              color: 'var(--interactive)',
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title={`Loads the worked example — ${DEMO_SUMMARY}`}
          >
            ▶ See the demo
          </button>
        </div>
        {canRun && (
          <p className="text-[11px]" style={{ color: 'var(--text-dim)', marginTop: 12 }}>
            Your setup is ready — {state.bom.length} BoM row{state.bom.length === 1 ? '' : 's'} waiting to pack.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Results › Fleet map — the three-altitude fleet visualization (v2.21.1:
 * regions → zone aisles → rack elevations) with the Inspector floating on
 * the right. Node, stat, and scope clicks auto-open the Inspector
 * (reducer behavior, unchanged from the docked-pane era).
 */
function FleetMapView() {
  const { state, dispatch } = useApp();
  const hasResult = state.result !== null;
  const hasSelection =
    state.selectedNodeIds.length > 0 || state.selectedStat !== null;
  const showInspector = hasResult || hasSelection;
  const collapsed = state.ui.detailPaneCollapsed;
  // v2.24 — drill state is lifted here so the Inspector's rosters can drive
  // the map's altitude (the map + the inspector share one path).
  const [drillPath, setDrillPath] = useState<DrillPath>({});

  return (
    <div className="relative flex flex-1 min-w-0 overflow-hidden" style={{ minHeight: 0 }}>
      <FleetMap path={drillPath} setPath={setDrillPath} />
      {/* v2.21.1 — The Inspector: the old docked Insights pane, relocated
          to a floating overlay so the map keeps the full canvas. Same
          content (VM details | Financial tabs, scope banner, sections),
          same width preference (sidePanelWidth + left-edge resize), same
          auto-open on node/stat/scope selection. */}
      {showInspector && !collapsed && (
        <div
          className="absolute flex flex-col overflow-hidden"
          data-rack-no-deselect
          style={{
            // Top clears the fleet map's context bar (breadcrumb + KPIs)
            // so the floating panel never hides the scope readout.
            top: 56,
            right: 12,
            bottom: 12,
            width: Math.min(state.ui.sidePanelWidth, 560),
            maxWidth: 'calc(100% - 48px)',
            zIndex: 30,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            boxShadow:
              '0 24px 64px -24px rgba(0, 0, 0, 0.55), 0 4px 16px -8px rgba(0, 0, 0, 0.35)',
          }}
          role="complementary"
          aria-label="Inspector — VM and financial details"
        >
          <ResizeHandle
            direction="horizontal"
            side="left"
            min={SIDE_PANEL_MIN}
            max={SIDE_PANEL_MAX}
            current={state.ui.sidePanelWidth}
            onResize={(w) => dispatch({ type: 'UI_SET', ui: { sidePanelWidth: w } })}
          />
          <InsightsPane path={drillPath} setPath={setDrillPath} />
        </div>
      )}
      {showInspector && collapsed && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'UI_SET', ui: { detailPaneCollapsed: false } })}
          className="absolute flex items-center gap-1.5 transition-colors"
          style={{
            right: 16,
            bottom: 16,
            zIndex: 30,
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            boxShadow: 'var(--shadow-elevated)',
            cursor: 'pointer',
          }}
          title="Open the Inspector — VM and financial details for the current scope"
        >
          <span aria-hidden="true" style={{ color: 'var(--interactive)' }}>▤</span>
          <span>Inspector</span>
        </button>
      )}
    </div>
  );
}

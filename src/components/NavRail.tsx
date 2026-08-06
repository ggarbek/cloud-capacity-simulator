import { useApp } from '../state/AppContext';
import { computeTabAlerts } from '../utils/tabAlerts';
import type { TabAlerts } from '../utils/tabAlerts';

/**
 * v2.21 — The navigation spine of the Advanced shell.
 *
 * Dashboard doctrine (S29 redesign): the sidebar is for NAVIGATION ONLY —
 * persistent, globally relevant destinations grouped by intent. The
 * authoring surfaces it used to embed now render as full pages in the
 * content area. Two groups (v2.22.4 — Set up first, since the workflow
 * starts there; Results is where you land after a run):
 *
 *   SET UP  — Quick start + the four numbered authoring steps
 *             (1 Cluster builder · 2 VM fungibility · 3 Fleet builder · 4 VM demand).
 *   RESULTS — Overview (the five answers) + Fleet map (rack viz + drill).
 *
 * VM catalog sits at the bottom, in the rarely-used zone (it's an
 * appendix: VM rows are seeded natively; a run never requires opening it).
 *
 * Active state = tinted fill + ink text (no stripes, no glow). Alert dots
 * carry over from computeTabAlerts so "needs attention" still reads at a
 * glance. Collapses to a 56px icon strip (persisted ui.navCollapsed).
 */

type SetupTab = 'quickstart' | 'hardware' | 'fleet' | 'fungibility' | 'configure' | 'vms';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  hint: string;
  step?: number;
  alertKey?: keyof TabAlerts;
}

// ── Custom line icons (replace the emoji set) ─────────────────────────────
// One restrained 24-grid stroke icon per destination, drawn in currentColor
// so it inherits the rail's active/idle tint. 1.6px stroke, rounded joins —
// the Linear/Stripe register the v3 substrate calls for.
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const IconQuickStart = (
  <Svg><path d="M12 2 4 13h6l-1 9 9-12h-6l1-8Z" /></Svg>
);
const IconClusters = ( // stacked server units with status LEDs
  <Svg>
    <rect x="3.5" y="4" width="17" height="6.5" rx="1.5" />
    <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5" />
    <path d="M7 7.25h.01" />
    <path d="M7 16.75h.01" />
  </Svg>
);
const IconFungibility = ( // routing — two swapped arrows
  <Svg>
    <path d="M4 8.5h13" />
    <path d="M14 5.5 17 8.5l-3 3" />
    <path d="M20 15.5H7" />
    <path d="M10 12.5 7 15.5l3 3" />
  </Svg>
);
const IconFleet = ( // 2×2 rack grid
  <Svg>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </Svg>
);
const IconDemand = ( // bill of materials — list on a card
  <Svg>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 8.5h6" />
    <path d="M9 12h6" />
    <path d="M9 15.5h4" />
  </Svg>
);
const IconOverview = ( // dashboard panels
  <Svg>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1" />
  </Svg>
);
const IconFleetMap = ( // folded map
  <Svg>
    <path d="M9 4 3.5 6v13.5L9 17.5l6 2 5.5-2V4l-5.5 2L9 4Z" />
    <path d="M9 4v13.5" />
    <path d="M15 6v13.5" />
  </Svg>
);
const IconScenario = ( // sliders — the "what-if" tuner
  <Svg>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
    <circle cx="9" cy="7" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Svg>
);
const IconCatalog = ( // cloud
  <Svg>
    <path d="M7 18.5a4 4 0 0 1-.4-7.98 5.5 5.5 0 0 1 10.6-1.5A3.75 3.75 0 0 1 17 18.5H7Z" />
  </Svg>
);

type ResultView = 'overview' | 'fleetmap' | 'scenario';

const RESULT_ITEMS: { view: ResultView; item: NavItem }[] = [
  {
    view: 'overview',
    item: {
      icon: IconOverview,
      label: 'Run Results',
      hint: 'The five answers — supportable, blocked, sellable, investment, payback',
    },
  },
  {
    view: 'fleetmap',
    item: {
      icon: IconFleetMap,
      label: 'Fleet Map',
      hint: 'Rack visualization with per-node, per-zone, and financial drill-down',
    },
  },
  {
    view: 'scenario',
    item: {
      icon: IconScenario,
      label: 'Scenario Analysis',
      hint: 'What else could pack onto the fleet — add VM sizes + a scope',
    },
  },
];

const SETUP_ITEMS: { tab: SetupTab; item: NavItem }[] = [
  {
    tab: 'quickstart',
    item: {
      icon: IconQuickStart,
      label: 'Quick Start',
      hint: 'Guided setup in one form — server, region, zones, demand',
    },
  },
  {
    tab: 'hardware',
    item: {
      icon: IconClusters,
      label: 'Cluster Builder',
      hint: 'Step 1 — define the server clusters your fleet runs on',
      step: 1,
      alertKey: 'hardware',
    },
  },
  {
    tab: 'fungibility',
    item: {
      icon: IconFungibility,
      label: 'VM Fungibility',
      hint: 'Step 2 — which VM families may land on which hardware, and in what order',
      step: 2,
      alertKey: 'fungibility',
    },
  },
  {
    tab: 'fleet',
    item: {
      icon: IconFleet,
      label: 'Fleet Builder',
      hint: 'Step 3 — place racks into regions and availability zones',
      step: 3,
      alertKey: 'fleet',
    },
  },
  {
    tab: 'configure',
    item: {
      icon: IconDemand,
      label: 'VM Demand',
      hint: 'Step 4 — the Bill of Materials: which VMs, how many, where',
      step: 4,
      alertKey: 'bom',
    },
  },
];

const CATALOG_ITEM: { tab: SetupTab; item: NavItem } = {
  tab: 'vms',
  item: {
    icon: IconCatalog,
    label: 'VM Catalog',
    hint: 'Browse the seeded VM library — optional; sizes are pre-loaded',
    alertKey: 'vmLibrary',
  },
};

export function NavRail() {
  const { state, dispatch } = useApp();
  const collapsed = state.ui.navCollapsed;
  const view = state.ui.workspaceView;
  const tab = state.ui.activeSidebarTab;
  const alerts = computeTabAlerts(state);
  const hasResult = state.result !== null;

  const goView = (v: ResultView) =>
    dispatch({ type: 'UI_SET', ui: { workspaceView: v } });
  const goTab = (t: SetupTab) =>
    dispatch({ type: 'UI_SET', ui: { activeSidebarTab: t, workspaceView: 'setup' } });

  return (
    <nav
      className="flex-shrink-0 flex flex-col h-full"
      style={{
        width: collapsed ? 56 : 224,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        transition: 'width 180ms var(--ease-out)',
      }}
      aria-label="Workspace navigation"
    >
      <div className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'thin' }}>
        <GroupLabel collapsed={collapsed}>Set Up</GroupLabel>
        {SETUP_ITEMS.map(({ tab: t, item }) => (
          <RailButton
            key={t}
            item={item}
            collapsed={collapsed}
            active={view === 'setup' && tab === t}
            onClick={() => goTab(t)}
            alert={item.alertKey ? alerts[item.alertKey].alert : false}
            alertReason={item.alertKey ? alerts[item.alertKey].reason : ''}
          />
        ))}

        <GroupLabel collapsed={collapsed} top>
          Results
        </GroupLabel>
        {RESULT_ITEMS.map(({ view: v, item }) => (
          <RailButton
            key={v}
            item={item}
            collapsed={collapsed}
            active={view === v}
            onClick={() => goView(v)}
            badge={(v === 'overview' || v === 'scenario') && !hasResult ? 'await' : undefined}
            alert={false}
            alertReason=""
          />
        ))}
      </div>

      {/* Rarely-used zone — bottom of the rail, per the nav doctrine. */}
      <div
        className="flex-shrink-0 py-2"
        style={{ borderTop: '1px solid var(--border-dark)' }}
      >
        <RailButton
          item={CATALOG_ITEM.item}
          collapsed={collapsed}
          active={view === 'setup' && tab === 'vms'}
          onClick={() => goTab('vms')}
          alert={alerts.vmLibrary.alert}
          alertReason={alerts.vmLibrary.reason}
        />
        <button
          type="button"
          onClick={() => dispatch({ type: 'UI_SET', ui: { navCollapsed: !collapsed } })}
          className="w-full flex items-center gap-2.5 transition-colors"
          style={{
            padding: collapsed ? '8px 0' : '8px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--text-dim)',
            fontSize: 11,
            cursor: 'pointer',
          }}
          title={collapsed ? 'Expand the navigation rail' : 'Collapse to icons'}
          aria-label={collapsed ? 'Expand the navigation rail' : 'Collapse the navigation rail'}
        >
          <span aria-hidden="true" style={{ fontSize: 12 }}>
            {collapsed ? '»' : '«'}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}

function GroupLabel({
  children,
  collapsed,
  top = false,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  top?: boolean;
}) {
  if (collapsed) {
    // Collapsed rail: groups separate with a hairline instead of a label.
    return top ? (
      <div className="mx-3 my-2 h-px" style={{ background: 'var(--border-dark)' }} />
    ) : null;
  }
  return (
    <div
      className="px-4 pb-1 text-[10px] font-semibold tracking-[0.05em]"
      style={{ color: 'var(--text-dim)', paddingTop: top ? 16 : 2 }}
    >
      {children}
    </div>
  );
}

function RailButton({
  item,
  collapsed,
  active,
  onClick,
  alert,
  alertReason,
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
  alert: boolean;
  alertReason: string;
  badge?: 'await';
}) {
  const title = alert ? `${item.hint} — ${alertReason}` : item.hint;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full flex items-center gap-2.5 transition-colors"
      style={{
        padding: collapsed ? '9px 0' : '7px 10px',
        margin: collapsed ? '1px 0' : '1px 8px',
        width: collapsed ? '100%' : 'calc(100% - 16px)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: collapsed ? 0 : 'var(--radius-sm)',
        background: active ? 'var(--interactive-muted)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 12.5,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--tint-soft-2)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
      title={title}
      aria-current={active ? 'page' : undefined}
    >
      <span
        aria-hidden="true"
        className="relative flex-shrink-0 grid place-items-center"
        style={{
          width: 20,
          fontSize: 13,
          color: active ? 'var(--interactive)' : 'var(--text-muted)',
        }}
      >
        {item.icon}
        {/* In collapsed mode the dot rides the icon so it stays visible. */}
        {alert && collapsed && <AlertDot floating />}
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 truncate">{item.label}</span>
          <span className="ml-auto flex-shrink-0 flex items-center gap-1.5">
            {item.step !== undefined && (
              // The number badge stays pinned to the right edge; the alert dot
              // rides its corner (absolute) so the number never shifts whether
              // or not an alert is present.
              <span
                className="relative grid place-items-center font-mono"
                style={{
                  width: 16,
                  height: 16,
                  fontSize: 9.5,
                  fontWeight: 700,
                  borderRadius: '50%',
                  background: alert ? 'rgba(251, 191, 36, 0.16)' : 'var(--tint-soft-2)',
                  color: alert ? 'var(--status-warn)' : 'var(--text-dim)',
                  border: `1px solid ${alert ? 'rgba(251, 191, 36, 0.5)' : 'var(--border)'}`,
                }}
                aria-hidden="true"
              >
                {item.step}
                {alert && <AlertDot floating />}
              </span>
            )}
            {/* No-step items (the VM catalog) have no number to mark, so the
                dot rides inline there. */}
            {item.step === undefined && alert && <AlertDot />}
            {badge === 'await' && (
              <span
                className="text-[9px] font-semibold"
                style={{ color: 'var(--text-dim)' }}
                title="No simulation has been run yet"
              >
                —
              </span>
            )}
          </span>
        </>
      )}
    </button>
  );
}

function AlertDot({ floating = false }: { floating?: boolean }) {
  return (
    <span
      className={floating ? 'absolute' : 'inline-block'}
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--status-warn)',
        ...(floating ? { top: -2, right: -3 } : {}),
      }}
      role="img"
      aria-label="Needs attention"
    />
  );
}

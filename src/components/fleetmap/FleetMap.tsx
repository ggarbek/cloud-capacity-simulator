import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useApp } from '../../state/AppContext';
import {
  RACK_TILE_PCT_MIN,
  RACK_TILE_PCT_MAX,
  RACK_TILE_PCT_STEP,
  rackTilePxFromPct,
} from '../../state/AppState';
import { highlightedNodeIds } from '../StatDetailPanel';
import { useRunSimulation } from '../../utils/useRunSimulation';
import type { ScopeSelection } from '../../state/AppState';
import type { ClusterGroup, RegionGroup } from './fleetmapData';
import {
  buildFleetHierarchy,
  memPct,
  vcpuPct,
  utilTone,
  NO_REGION,
} from './fleetmapData';
import { RegionsLayer } from './RegionsLayer';
import { ZoneLayer, MiniUtil } from './ZoneLayer';
import { RackElevation } from './RackElevation';

/**
 * v2.21.1 — The fleet map: three altitudes over one simulation result.
 *
 *   1. Regions  — capacity card per region (auto-skipped for one region)
 *   2. Zones    — the region's datacenter floor: aisles of mini-racks
 *   3. Cluster  — full rack elevation, every node a server shelf
 *
 * Navigation = drilling. The breadcrumb walks back up; drilling also sets
 * the Insights scope (region / cluster) so the inspector always describes
 * what's on screen. Node clicks at the rack altitude select shelves
 * (NODE_TOGGLE — reducer clears scope per the existing mutual-exclusivity
 * rule, but the drill position is local state, so the view stays put).
 */

export interface DrillPath {
  region?: string;
  clusterId?: string;
}

export function FleetMap({
  path,
  setPath,
}: {
  path: DrillPath;
  setPath: Dispatch<SetStateAction<DrillPath>>;
}) {
  const { state, dispatch } = useApp();
  const result = state.result;

  const regions = useMemo(
    () => (result ? buildFleetHierarchy(state, result) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, state.fleets, state.fleetOrder],
  );

  const highlightSet = useMemo(
    () => (state.selectedStat && result ? highlightedNodeIds(state.selectedStat, result) : null),
    [state.selectedStat, result],
  );

  // ── Keep `state.ui.scope` in sync with the drill altitude. ──────────────
  // Drilling sets the scope, but selecting a shelf clears it (reducer
  // mutual-exclusivity). When the shelf is later deselected — by background
  // click, the Inspector's Clear button, or toggling the shelf off — the
  // scope used to stay `null`, so the Inspector wrongly read "Fleet-wide"
  // while the user was still viewing a single cluster. Whenever nothing is
  // node/stat-selected, re-assert the scope that matches the drill position
  // (and clear a stale scope when the drill resets, e.g. on re-entry).
  // Runs unconditionally (guards `result` internally) to satisfy hook rules.
  useEffect(() => {
    if (!result) return;
    if (state.selectedNodeIds.length > 0 || state.selectedStat !== null) return;
    const single = regions.length === 1;
    const rKey = path.region ?? (single ? regions[0]?.region : undefined);
    const rg = rKey !== undefined ? regions.find((r) => r.region === rKey) : undefined;
    const cg =
      path.clusterId && rg
        ? rg.zones.flatMap((z) => z.clusters).find((c) => c.clusterId === path.clusterId)
        : undefined;
    const cur = state.ui.scope;
    // v2.23.2 — A zone scope is a legitimate user selection at the zones
    // altitude (the zone-label toggle in ZoneLayer). Preserve it instead of
    // snapping back to the region/fleet drill — otherwise clicking a zone
    // header flickers straight back to "Fleet-wide". A cluster drill still
    // supersedes it; leaving the region clears it (rg/zone no longer match).
    const zoneScopeValid =
      cur?.kind === 'zone' && rg && rg.zones.some((z) => z.zone === cur.key);
    const want: ScopeSelection | null = cg
      ? { kind: 'cluster', key: cg.clusterId }
      : zoneScopeValid
      ? cur
      : rg && rg.region !== NO_REGION && !single
      ? { kind: 'region', key: rg.region }
      : null;
    const same =
      (!want && !cur) || (!!want && !!cur && want.kind === cur.kind && want.key === cur.key);
    if (!same) dispatch({ type: 'SCOPE_SET', scope: want });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, regions, path, state.selectedNodeIds.length, state.selectedStat, state.ui.scope]);

  if (!result) return <FleetMapEmpty />;

  // ── Resolve the altitude from the drill path (validated against the
  // current hierarchy so a re-run that removes a cluster can't strand us). ──
  const singleRegion = regions.length === 1;
  const regionGroup: RegionGroup | undefined = (() => {
    const key = path.region ?? (singleRegion ? regions[0].region : undefined);
    return key !== undefined ? regions.find((r) => r.region === key) : undefined;
  })();
  const clusterGroup: ClusterGroup | undefined =
    path.clusterId && regionGroup
      ? regionGroup.zones.flatMap((z) => z.clusters).find((c) => c.clusterId === path.clusterId)
      : undefined;
  const altitude: 'regions' | 'zones' | 'cluster' = clusterGroup
    ? 'cluster'
    : regionGroup
    ? 'zones'
    : 'regions';

  const drillRegion = (r: RegionGroup) => {
    setPath({ region: r.region });
    dispatch({
      type: 'SCOPE_SET',
      scope: r.region === NO_REGION ? null : { kind: 'region', key: r.region },
    });
  };
  const drillCluster = (c: ClusterGroup) => {
    setPath((p) => ({ region: p.region ?? regionGroup?.region, clusterId: c.clusterId }));
    dispatch({ type: 'SCOPE_SET', scope: { kind: 'cluster', key: c.clusterId } });
  };
  const upToZones = () => {
    setPath((p) => ({ region: p.region ?? regionGroup?.region }));
    dispatch({
      type: 'SCOPE_SET',
      scope:
        regionGroup && regionGroup.region !== NO_REGION && !singleRegion
          ? { kind: 'region', key: regionGroup.region }
          : null,
    });
  };
  const upToRegions = () => {
    setPath({});
    dispatch({ type: 'SCOPE_SET', scope: null });
  };

  // Scope of the KPI strip = whatever altitude is on screen.
  const scopeNodes = clusterGroup
    ? clusterGroup.nodes
    : regionGroup
    ? regionGroup.nodes
    : regions.flatMap((r) => r.nodes);
  const scopeUtil = clusterGroup?.util ?? regionGroup?.util ?? null;
  const mem = scopeUtil
    ? memPct(scopeUtil)
    : (() => {
        let used = 0;
        let total = 0;
        for (const n of scopeNodes) {
          used += n.memoryUsedGib;
          total += n.memoryTotalGib;
        }
        return total > 0 ? (used / total) * 100 : 0;
      })();
  const cpu = scopeUtil
    ? vcpuPct(scopeUtil)
    : (() => {
        let used = 0;
        let total = 0;
        for (const n of scopeNodes) {
          used += n.vcpusUsed;
          total += n.vcpusTotal;
        }
        return total > 0 ? (used / total) * 100 : 0;
      })();
  const occupied = scopeNodes.filter((n) => n.vmsPlaced.length > 0).length;
  const vms = scopeNodes.reduce((s, n) => s + n.vmsPlaced.length, 0);
  const unplaceable = result.vmsUnplaceable.reduce((s, u) => s + u.count, 0);

  const tile = rackTilePxFromPct(state.ui.rackTilePct);
  const shelfH = Math.max(18, Math.round(tile * 0.72));
  const setPct = (v: number) =>
    dispatch({
      type: 'UI_SET',
      ui: {
        rackTilePct: Math.max(RACK_TILE_PCT_MIN, Math.min(RACK_TILE_PCT_MAX, v)),
      },
    });

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ minHeight: 0, minWidth: 0 }}
      onClick={(e) => {
        // Background click clears the shelf / stat selection (same contract
        // as the legacy map). Buttons keep their own semantics. The
        // drill-scope sync effect re-asserts the cluster/region scope that
        // the cleared selection had nulled.
        const target = e.target as HTMLElement;
        if (target.closest('button, [data-rack-no-deselect]')) return;
        if (state.selectedNodeIds.length > 0) dispatch({ type: 'NODE_CLEAR' });
        if (state.selectedStat !== null) dispatch({ type: 'STAT_SELECT', stat: null });
      }}
    >
      {/* ── Context bar: breadcrumb · KPI readout · zoom ── */}
      <div
        className="flex items-center gap-3 flex-wrap flex-shrink-0"
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <nav className="flex items-center gap-1 min-w-0" aria-label="Fleet map breadcrumb">
          {!singleRegion && (
            <>
              <Crumb label="Fleet" active={altitude === 'regions'} onClick={upToRegions} />
              {regionGroup && <CrumbSep />}
            </>
          )}
          {regionGroup && (
            <Crumb
              label={regionGroup.label}
              active={altitude === 'zones'}
              onClick={upToZones}
            />
          )}
          {clusterGroup && (
            <>
              <CrumbSep />
              <Crumb
                label={`Cluster ${clusterGroup.index}`}
                active
                onClick={() => {}}
                title={clusterGroup.hwLabel}
              />
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {state.isStale && (
            <span
              className="text-[10px] font-semibold"
              style={{
                padding: '2px 9px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(251, 191, 36, 0.10)',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                color: 'var(--status-warn)',
              }}
              title="Inputs changed since this run — re-run from the top bar for fresh results"
            >
              ● stale
            </span>
          )}
          <MiniUtil label="mem" pct={mem} />
          <MiniUtil label="cpu" pct={cpu} />
          <span className="text-[10.5px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {occupied.toLocaleString()}/{scopeNodes.length.toLocaleString()} nodes
          </span>
          <span
            className="text-[10.5px] font-mono"
            style={{ color: 'var(--text-secondary)' }}
            title={
              unplaceable > 0
                ? `${vms.toLocaleString()} VMs placed in this scope · ${unplaceable.toLocaleString()} unplaceable fleet-wide (see Insights → Unplaceable)`
                : `${vms.toLocaleString()} VMs placed in this scope`
            }
          >
            {vms.toLocaleString()} VMs
            {unplaceable > 0 && (
              <span style={{ color: 'var(--status-warn)' }}> · {unplaceable.toLocaleString()} unplaced</span>
            )}
          </span>
          {altitude === 'cluster' && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--tint-soft)',
              }}
              role="group"
              aria-label="Shelf zoom"
            >
              <ZoomBtn
                label="−"
                onClick={() => setPct(state.ui.rackTilePct - RACK_TILE_PCT_STEP)}
                disabled={state.ui.rackTilePct <= RACK_TILE_PCT_MIN}
              />
              <span
                className="text-[10px] font-mono text-center"
                style={{ color: 'var(--text-muted)', minWidth: 34 }}
              >
                {state.ui.rackTilePct}%
              </span>
              <ZoomBtn
                label="+"
                onClick={() => setPct(state.ui.rackTilePct + RACK_TILE_PCT_STEP)}
                disabled={state.ui.rackTilePct >= RACK_TILE_PCT_MAX}
              />
            </span>
          )}
        </div>
      </div>

      {/* ── The map itself ── */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0, padding: '20px 20px 40px' }}>
        {altitude === 'regions' && (
          <RegionsLayer regions={regions} onDrillRegion={drillRegion} />
        )}
        {altitude === 'zones' && regionGroup && (
          <ZoneLayer region={regionGroup} onDrillCluster={drillCluster} />
        )}
        {altitude === 'cluster' && clusterGroup && (
          <div>
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 14 }}>
              <span
                className="font-semibold"
                style={{ fontSize: 14, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}
              >
                Cluster {clusterGroup.index}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {clusterGroup.hwLabel}
                {clusterGroup.fleet?.zone ? ` · ◈ ${clusterGroup.fleet.zone}` : ''} ·{' '}
                {clusterGroup.racks.length} rack{clusterGroup.racks.length === 1 ? '' : 's'} ·{' '}
                {clusterGroup.nodes.length} nodes
              </span>
              <span className="text-[10.5px]" style={{ color: 'var(--text-dim)' }}>
                · click a shelf for node detail (⌘-click to multi-select)
              </span>
            </div>
            <RackElevation cluster={clusterGroup} shelfH={shelfH} highlightSet={highlightSet} />
            <Legend counts={clusterGroup.counts} />
          </div>
        )}
      </div>
    </div>
  );
}

function Crumb({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-colors whitespace-nowrap"
      style={{
        fontSize: 12.5,
        fontWeight: active ? 600 : 500,
        letterSpacing: '-0.01em',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        border: 'none',
        cursor: active ? 'default' : 'pointer',
      }}
      title={title ?? (active ? undefined : `Go up to ${label}`)}
    >
      {label}
    </button>
  );
}

function CrumbSep() {
  return (
    <span aria-hidden="true" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
      ›
    </span>
  );
}

function ZoomBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label === '−' ? 'Shrink shelves' : 'Enlarge shelves'}
      className="text-[12px] font-semibold leading-none grid place-items-center"
      style={{
        width: 18,
        height: 18,
        borderRadius: 'var(--radius-pill)',
        color: disabled ? 'var(--text-dim)' : 'var(--interactive)',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

/** Node-state legend with live counts — doubles as the at-a-glance health
 *  readout for the open cluster. */
function Legend({ counts }: { counts: ClusterGroup['counts'] }) {
  const items: { label: string; color: string; n: number }[] = [
    { label: 'empty', color: 'var(--node-deployable)', n: counts.deployable },
    { label: 'partial', color: 'var(--node-partial)', n: counts.partial },
    { label: 'full', color: 'var(--node-full)', n: counts.full },
    { label: 'overhead', color: 'var(--node-reserved)', n: counts.reserved },
    { label: 'isolated', color: 'var(--node-isolated)', n: counts.isolated },
  ].filter((i) => i.n > 0);
  return (
    <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 16 }}>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
          <span
            aria-hidden="true"
            style={{ width: 7, height: 7, borderRadius: 2, background: i.color }}
          />
          {i.n.toLocaleString()} {i.label}
        </span>
      ))}
      <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
        · shelf fill = memory used · badge letter = binding constraint (M/C/N/S)
      </span>
    </div>
  );
}

function FleetMapEmpty() {
  const { run, canRun } = useRunSimulation();
  return (
    <div className="flex-1 grid place-items-center">
      <div className="text-center" style={{ maxWidth: 380, padding: 24 }}>
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
          ◨
        </div>
        <div
          className="font-semibold"
          style={{ fontSize: 18, letterSpacing: '-0.015em', color: 'var(--text-primary)' }}
        >
          No fleet map yet
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Run a simulation and this page becomes a drillable map of your fleet —
          regions, zones, and every rack down to the server shelf.
        </p>
        {canRun && (
          <button
            type="button"
            onClick={run}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 12.5, marginTop: 16 }}
          >
            ▶ Run simulation
          </button>
        )}
      </div>
    </div>
  );
}

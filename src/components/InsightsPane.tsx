/**
 * Fleet-map Inspector (v2.24) — altitude-adaptive.
 *
 * Shows the operator exactly the right detail for where they are on the map,
 * instead of the old one-size-fits-all "VM details / $ Financial" panel:
 *
 *   - Node selected → NodeDetailPanel (bottleneck · resource bars · placed VMs ·
 *                     "what else fits" with the hover-preview simulation).
 *   - Cluster       → node-state counts · util bars · binding summary · a
 *                     clickable NODE ROSTER (jump to a hot node) · what else
 *                     fits in this cluster (counts only).
 *   - Zone / Region → counts · util bars · a clickable CHILD ROSTER to drill.
 *   - Fleet-wide    → orientation: a regions/zones roster.
 *   - Plus fleet-wide Unplaceable + Spillover sections (data-driven).
 *
 * No `$` here — region/zone/fleet financials live on the Overview tab. The
 * drill `path` is owned by FleetMapView and shared with the map, so the
 * Inspector's rosters navigate the map (and vice-versa).
 */
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import { sellableCapacity } from '../engine/insights';
import type { UserVm } from '../types';
import { NodeDetailPanel } from './NodeDetailPanel';
import type { DrillPath } from './fleetmap/FleetMap';
import {
  buildFleetHierarchy,
  memPct,
  NO_REGION,
  type RegionGroup,
  type ZoneGroup,
  type ClusterGroup,
} from './fleetmap/fleetmapData';
import {
  Section,
  Hint,
  CloseButton,
  ScopeStats,
  UnplaceableBreakdown,
  SpilloverBreakdown,
  type SidebarTab,
} from './fleetmap/inspector/inspectorShared';
import { NodeRoster } from './fleetmap/inspector/NodeRoster';
import { ChildRoster, type ChildRow } from './fleetmap/inspector/ChildRoster';

export function InsightsPane({
  path = {},
  setPath,
}: {
  path?: DrillPath;
  setPath?: Dispatch<SetStateAction<DrillPath>>;
}) {
  const { state, dispatch } = useApp();
  const result = state.result;
  const fleets = fleetList(state);
  const scope = state.ui.scope;

  const regions = useMemo(
    () => (result ? buildFleetHierarchy(state, result) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, state.fleets, state.fleetOrder],
  );

  // BOM-provider-scoped catalog so the cluster "what else fits" never
  // recommends an AWS size for an Azure cluster (mirrors NodeDetailPanel).
  const sellableCatalog = useMemo(() => {
    const provider = state.ui.bomProvider;
    const region = provider ? state.ui.activeRegion[provider] : undefined;
    return state.userVms.filter((vm) => {
      if (provider && vm.provider && vm.provider !== provider) return false;
      if (region && vm.region && vm.region !== region) return false;
      return true;
    });
  }, [state.userVms, state.ui.bomProvider, state.ui.activeRegion]);

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <CloseButton />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-xs">
            <div className="text-[12px] font-medium text-text-secondary mb-1">
              No simulation results yet
            </div>
            <div className="text-[11px] text-text-muted leading-snug">
              Configure a BOM and fleet, then press{' '}
              <span className="text-interactive">Run simulation</span>. The Inspector populates here.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Altitude resolution (mirrors FleetMap: path + selection drive it;
  // zone is a scope-only sub-state within the zones altitude). ────────────
  const selectedNodes = result.nodeDetail.filter((n) => state.selectedNodeIds.includes(n.nodeId));
  const showNodeDetail = selectedNodes.length > 0;

  const single = regions.length === 1;
  const regionKey = path.region ?? (single ? regions[0]?.region : undefined);
  const regionGroup = regionKey !== undefined ? regions.find((r) => r.region === regionKey) : undefined;
  const clusterGroup =
    path.clusterId && regionGroup
      ? regionGroup.zones.flatMap((z) => z.clusters).find((c) => c.clusterId === path.clusterId)
      : undefined;
  const zoneGroup =
    !clusterGroup && scope?.kind === 'zone' && regionGroup
      ? regionGroup.zones.find((z) => z.zone === scope.key)
      : undefined;

  // ── Drill helpers — drive the shared path + scope (the FleetMap sync
  // effect agrees with these). ────────────────────────────────────────────
  const drillRegion = (r: RegionGroup) => {
    setPath?.({ region: r.region });
    dispatch({ type: 'SCOPE_SET', scope: r.region === NO_REGION ? null : { kind: 'region', key: r.region } });
  };
  const selectZone = (z: ZoneGroup) => {
    // Zone is scope-only — the map stays at the zones altitude and the sync
    // effect preserves a valid zone scope.
    dispatch({ type: 'SCOPE_SET', scope: { kind: 'zone', key: z.zone } });
  };
  const drillCluster = (c: ClusterGroup) => {
    setPath?.({ region: regionGroup?.region, clusterId: c.clusterId });
    dispatch({ type: 'SCOPE_SET', scope: { kind: 'cluster', key: c.clusterId } });
  };
  const jumpToTab = (tab: SidebarTab) => dispatch({ type: 'UI_SET', ui: { activeSidebarTab: tab } });

  // Node view is fully self-contained (NodeDetailPanel owns its header + close).
  if (showNodeDetail) return <NodeDetailPanel />;

  // ── Header label + Clear ──────────────────────────────────────────────
  // "Scoped" = drilled below the top. For a single-region fleet the region IS
  // the top (the sync effect leaves scope null there), so the base view reads
  // "Fleet-wide" with no Clear — header + state stay in agreement.
  const scoped =
    !!clusterGroup || !!zoneGroup || (!single && !!regionGroup && regionGroup.region !== NO_REGION);
  const headerLabel = !scoped
    ? 'Fleet-wide'
    : clusterGroup
    ? `Cluster ${clusterGroup.index} · ${clusterGroup.hwLabel}`
    : zoneGroup
    ? `Zone · ${zoneGroup.label}`
    : `Region · ${regionGroup!.label}`;
  const clear = () => {
    setPath?.({});
    dispatch({ type: 'SCOPE_SET', scope: null });
  };

  const unplaceableTotal = result.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
  const spilloverTotal = result.spilloverEvents.reduce((s, e) => s + e.count, 0);

  return (
    <div className="flex flex-col h-full">
      <InspectorHeader label={headerLabel} scoped={scoped} onClear={clear} />
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {clusterGroup ? (
          <ClusterInspector cluster={clusterGroup} catalog={sellableCatalog} />
        ) : zoneGroup ? (
          <ScopeOverview
            nodes={zoneGroup.nodes}
            childTitle="Clusters"
            rows={zoneGroup.clusters.map((c) => clusterRow(c, drillCluster))}
            nudge="Click a cluster to inspect its nodes."
          />
        ) : regionGroup ? (
          <RegionInspector region={regionGroup} onSelectZone={selectZone} onDrillCluster={drillCluster} />
        ) : (
          <ScopeOverview
            nodes={regions.flatMap((r) => r.nodes)}
            childTitle="Regions"
            rows={regions.map((r) => ({
              key: r.region,
              label: r.label,
              sub: `${r.clusterCount} cluster${r.clusterCount === 1 ? '' : 's'} · ${r.nodes.length} nodes`,
              pct: memPct(r.util),
              onClick: () => drillRegion(r),
            }))}
            nudge="Drill into a region, then a cluster, to inspect its nodes."
          />
        )}

        {/* Fleet-wide data-driven sections (kept). */}
        {unplaceableTotal > 0 && (
          <Section id="unplaceable" title={`Unplaceable · ${unplaceableTotal} VMs (fleet-wide)`}>
            <UnplaceableBreakdown entries={result.vmsUnplaceable} onJumpToTab={jumpToTab} />
          </Section>
        )}
        {spilloverTotal > 0 && (
          <Section id="spillover" title={`Spillover · ${spilloverTotal} VMs (fleet-wide)`}>
            <SpilloverBreakdown events={result.spilloverEvents} />
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function InspectorHeader({
  label,
  scoped,
  onClear,
}: {
  label: string;
  scoped: boolean;
  onClear: () => void;
}) {
  return (
    <div
      className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2 border-b border-border"
      style={{
        background: scoped ? 'rgba(129, 140, 248, 0.08)' : 'rgba(255,255,255,0.02)',
        borderLeft: scoped ? '3px solid var(--interactive)' : '3px solid transparent',
      }}
    >
      <span
        className="text-[9px] tracking-[0.04em] font-bold"
        style={{ color: scoped ? 'var(--interactive)' : 'var(--text-muted)' }}
      >
        Inspecting
      </span>
      <span className="font-bold text-text-primary truncate" style={{ fontSize: 13, letterSpacing: '-0.01em' }}>
        {label}
      </span>
      {scoped && (
        <button
          onClick={onClear}
          className="ml-auto text-[10px] tracking-[0.02em] text-text-muted hover:text-interactive"
          title="Back to fleet-wide"
        >
          Clear ✕
        </button>
      )}
      <CloseButton inline />
    </div>
  );
}

// ── Cluster ────────────────────────────────────────────────────────────────
function ClusterInspector({ cluster, catalog }: { cluster: ClusterGroup; catalog: UserVm[] }) {
  const { state } = useApp();
  const fleets = fleetList(state);
  const result = state.result!;
  const fits = useMemo(
    () =>
      sellableCapacity(result, fleets, catalog, { kind: 'cluster', key: cluster.clusterId }, {
        top: 6,
        rate: state.ui.rateType,
        matrix: state.userFungibility,
      }).filter((f) => f.fitCount > 0),
    [result, fleets, catalog, cluster.clusterId, state.ui.rateType, state.userFungibility],
  );
  return (
    <>
      <div className="px-4 py-3">
        <ScopeStats nodes={cluster.nodes} />
      </div>
      <Section id="cluster-nodes" title={`Nodes · ${cluster.nodes.length}`}>
        <NodeRoster nodes={cluster.nodes} />
      </Section>
      {fits.length > 0 && (
        <Section id="cluster-fits" title="What else fits here">
          <ul className="space-y-1">
            {fits.map((f) => (
              <li key={f.vmSizeName} className="flex items-baseline justify-between text-[11px] font-mono">
                <span className="text-text-primary truncate" title={f.vmSizeName}>
                  {f.vmSizeName.replace('Standard_', '')}
                </span>
                <span className="text-text-muted whitespace-nowrap ml-2">
                  up to {f.fitCount.toLocaleString()}×
                </span>
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-text-muted mt-2 leading-snug">
            Most of each size that could still pack into this cluster's leftover capacity, honoring
            fungibility. They share nodes — pick one, not all.
          </div>
        </Section>
      )}
    </>
  );
}

// ── Region (zones, or clusters when single-zone) ────────────────────────────
function RegionInspector({
  region,
  onSelectZone,
  onDrillCluster,
}: {
  region: RegionGroup;
  onSelectZone: (z: ZoneGroup) => void;
  onDrillCluster: (c: ClusterGroup) => void;
}) {
  // A single-zone region: skip the zone hop, list clusters directly.
  if (region.zones.length === 1) {
    const z = region.zones[0];
    return (
      <ScopeOverview
        nodes={region.nodes}
        childTitle="Clusters"
        rows={z.clusters.map((c) => clusterRow(c, onDrillCluster))}
        nudge="Click a cluster to inspect its nodes."
      />
    );
  }
  return (
    <ScopeOverview
      nodes={region.nodes}
      childTitle="Zones"
      rows={region.zones.map((z) => ({
        key: z.zone,
        label: z.label,
        sub: `${z.clusters.length} cluster${z.clusters.length === 1 ? '' : 's'} · ${z.nodes.length} nodes`,
        pct: memPct(z.util),
        onClick: () => onSelectZone(z),
      }))}
      nudge="Click a zone, then a cluster, to inspect its nodes."
    />
  );
}

// ── Generic scope overview (fleet / region / zone) ──────────────────────────
function ScopeOverview({
  nodes,
  childTitle,
  rows,
  nudge,
}: {
  nodes: import('../types').NodeDetail[];
  childTitle: string;
  rows: ChildRow[];
  nudge: string;
}) {
  return (
    <>
      <div className="px-4 py-3">
        <ScopeStats nodes={nodes} />
      </div>
      {rows.length > 0 && (
        <Section id={`scope-children-${childTitle.toLowerCase()}`} title={`${childTitle} · ${rows.length}`}>
          <ChildRoster rows={rows} />
          <Hint>{nudge}</Hint>
        </Section>
      )}
    </>
  );
}

function clusterRow(c: ClusterGroup, onDrill: (c: ClusterGroup) => void): ChildRow {
  return {
    key: c.clusterId,
    label: `Cluster ${c.index} · ${c.hwLabel}`,
    sub: `${c.nodes.length} node${c.nodes.length === 1 ? '' : 's'} · ${c.util.occupiedNodes} occupied`,
    pct: memPct(c.util),
    onClick: () => onDrill(c),
  };
}

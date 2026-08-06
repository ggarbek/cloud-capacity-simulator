import type { AppState } from '../../state/AppState';
import { fleetList } from '../../state/AppState';
import type { FleetSpec, NodeDetail, SimulatorResult } from '../../types';

/**
 * v2.21.1 — Fleet map data layer.
 *
 * Pure hierarchy + aggregation helpers for the three-altitude fleet map
 * (Regions → Zones/aisles → Rack elevation). Ported from RackMap's inline
 * grouping so the visual layers stay presentation-only. No React, no
 * dispatch — same convention as the engine helpers.
 */

export const NO_REGION = '__noregion__';
export const NO_ZONE = '__nozone__';

export interface RackBucket {
  rack: number;
  nodes: NodeDetail[];
}

export interface BucketUtil {
  occupiedNodes: number;
  totalNodes: number;
  memUsed: number;
  memTotal: number;
  vcpuUsed: number;
  vcpuTotal: number;
}

export interface StateCounts {
  deployable: number;
  reserved: number;
  partial: number;
  full: number;
  isolated: number;
  ofr: number;
}

export interface ClusterGroup {
  clusterId: string;
  /** 1-based "Cluster N" index, consistent with Fleet Builder + Insights. */
  index: number;
  fleet: FleetSpec | undefined;
  hwLabel: string;
  racks: RackBucket[];
  nodes: NodeDetail[];
  util: BucketUtil;
  counts: StateCounts;
  /** Heterogeneous rack (mixed per-node memory) — shelves show a memory chip. */
  isHetero: boolean;
}

export interface ZoneGroup {
  zone: string; // sentinel NO_ZONE when untagged
  label: string;
  clusters: ClusterGroup[];
  nodes: NodeDetail[];
  util: BucketUtil;
}

export interface RegionGroup {
  region: string; // sentinel NO_REGION when untagged
  label: string;
  zones: ZoneGroup[];
  nodes: NodeDetail[];
  util: BucketUtil;
  clusterCount: number;
  rackCount: number;
}

export function aggregateUtil(nodes: NodeDetail[]): BucketUtil {
  let occupiedNodes = 0;
  let memUsed = 0;
  let memTotal = 0;
  let vcpuUsed = 0;
  let vcpuTotal = 0;
  for (const n of nodes) {
    if (n.vmsPlaced.length > 0) occupiedNodes++;
    memUsed += n.memoryUsedGib;
    memTotal += n.memoryTotalGib;
    vcpuUsed += n.vcpusUsed;
    vcpuTotal += n.vcpusTotal;
  }
  return { occupiedNodes, totalNodes: nodes.length, memUsed, memTotal, vcpuUsed, vcpuTotal };
}

export function countByState(nodes: NodeDetail[]): StateCounts {
  const c: StateCounts = {
    deployable: 0,
    reserved: 0,
    partial: 0,
    full: 0,
    isolated: 0,
    ofr: 0,
  };
  for (const n of nodes) {
    if (n.state === 'deployable') c.deployable++;
    else if (n.state === 'reserved') c.reserved++;
    else if (n.state === 'occupied-partial') c.partial++;
    else if (n.state === 'occupied-full') c.full++;
    else if (n.state === 'isolated') c.isolated++;
    else if (n.state === 'ofr') c.ofr++;
  }
  return c;
}

export function memPct(util: BucketUtil): number {
  return util.memTotal > 0 ? (util.memUsed / util.memTotal) * 100 : 0;
}
export function vcpuPct(util: BucketUtil): number {
  return util.vcpuTotal > 0 ? (util.vcpuUsed / util.vcpuTotal) * 100 : 0;
}

/** Utilization tone — shared thresholds with the old banner chips:
 *  < 60% calm (indigo) · 60–85% amber · ≥ 85% red. */
export function utilTone(pct: number): string {
  return pct >= 85 ? 'var(--status-bad)' : pct >= 60 ? 'var(--status-warn)' : 'var(--interactive)';
}

/** Node-state base colors (same palette as the legacy tiles / tokens). */
export function nodeStateColor(node: NodeDetail): string {
  switch (node.state) {
    case 'deployable':
      return 'var(--node-deployable)';
    case 'reserved':
      return 'var(--node-reserved)';
    case 'occupied-partial':
      return 'var(--node-partial)';
    case 'occupied-full':
      return 'var(--node-full)';
    case 'isolated':
      return 'var(--node-isolated)';
    case 'ofr':
      return 'var(--node-ofr)';
  }
}

/** Raw hex per state for places that need alpha-mixing in inline styles. */
export function nodeStateHex(node: NodeDetail, light: boolean): string {
  switch (node.state) {
    case 'deployable':
      return light ? '#16A34A' : '#22C55E';
    case 'reserved':
      return light ? '#64748B' : '#6B7280';
    case 'occupied-partial':
      return light ? '#2563EB' : '#3B82F6';
    case 'occupied-full':
      return light ? '#B91C1C' : '#EF4444';
    case 'isolated':
      return light ? '#6D28D9' : '#A78BFA';
    case 'ofr':
      return '#7F1D1D';
  }
}

export function nodeStateLabel(node: NodeDetail): string {
  switch (node.state) {
    case 'deployable':
      return 'empty';
    case 'reserved':
      return 'overhead';
    case 'occupied-partial':
      return 'partial';
    case 'occupied-full':
      return 'full';
    case 'isolated':
      return 'isolated';
    case 'ofr':
      return 'out for repair';
  }
}

/** Right-edge badge on a shelf: binding constraint letter or state glyph. */
export function nodeBadge(node: NodeDetail): string | null {
  switch (node.state) {
    case 'occupied-full':
      return node.bindingConstraint === 'VCPU'
        ? 'C'
        : node.bindingConstraint === 'NETWORK'
        ? 'N'
        : node.bindingConstraint === 'STORAGE'
        ? 'S'
        : 'M';
    case 'reserved':
      return '🔒';
    case 'isolated':
      return '●';
    case 'ofr':
      return '✕';
    default:
      return null;
  }
}

/** Compact memory label (≤4 chars) for heterogeneous-rack shelf chips.
 *  Same rounding rules as the legacy tile badge. */
export function formatMemShort(gib: number): string {
  if (gib >= 1024) {
    const tib = gib / 1024;
    const rounded = Math.round(tib);
    if (Math.abs(tib - rounded) / Math.max(rounded, 1) < 0.05) return `${rounded}T`;
    return `${tib.toFixed(1)}T`;
  }
  return `${Math.round(gib)}G`;
}

/**
 * Build the Region → Zone → Cluster hierarchy from a simulation result.
 * Cluster order (and the 1-based "Cluster N" index) follows fleetList —
 * the same numbering the Fleet Builder roster and Insights use.
 */
export function buildFleetHierarchy(
  state: AppState,
  result: SimulatorResult,
): RegionGroup[] {
  const clusters = fleetList(state);
  const fleetById = new Map(clusters.map(({ id, fleet }) => [id, fleet]));
  const indexById = new Map(clusters.map(({ id }, i) => [id, i + 1]));

  // Group nodes by cluster, then racks within the cluster.
  const nodesByCluster = new Map<string, NodeDetail[]>();
  for (const n of result.nodeDetail) {
    const key = n.clusterId ?? 'default';
    if (!nodesByCluster.has(key)) nodesByCluster.set(key, []);
    nodesByCluster.get(key)!.push(n);
  }

  const clusterGroups: ClusterGroup[] = [];
  for (const [clusterId, nodes] of nodesByCluster) {
    const byRack = new Map<number, NodeDetail[]>();
    for (const n of nodes) {
      if (!byRack.has(n.rack)) byRack.set(n.rack, []);
      byRack.get(n.rack)!.push(n);
    }
    const racks: RackBucket[] = Array.from(byRack.entries())
      .sort(([a], [b]) => a - b)
      .map(([rack, ns]) => ({
        rack,
        nodes: ns.sort((a, b) => a.posInRack - b.posInRack),
      }));
    const fleet = fleetById.get(clusterId);
    clusterGroups.push({
      clusterId,
      index: indexById.get(clusterId) ?? 1,
      fleet,
      hwLabel: fleet?.hardwareGroupName || '(unconfigured)',
      racks,
      nodes,
      util: aggregateUtil(nodes),
      counts: countByState(nodes),
      isHetero: !!fleet?.rackComposition && fleet.rackComposition.length > 1,
    });
  }
  clusterGroups.sort((a, b) => a.index - b.index);

  // Roll clusters up into zones, zones into regions.
  const regions: RegionGroup[] = [];
  const regionIdx = new Map<string, number>();
  for (const cg of clusterGroups) {
    const region = cg.fleet?.region || NO_REGION;
    const zone = cg.fleet?.zone || NO_ZONE;
    let ri = regionIdx.get(region);
    if (ri === undefined) {
      ri = regions.length;
      regionIdx.set(region, ri);
      regions.push({
        region,
        label: region === NO_REGION ? 'No region tag' : region,
        zones: [],
        nodes: [],
        util: aggregateUtil([]),
        clusterCount: 0,
        rackCount: 0,
      });
    }
    const rg = regions[ri];
    let zg = rg.zones.find((z) => z.zone === zone);
    if (!zg) {
      zg = {
        zone,
        label: zone === NO_ZONE ? 'No zone' : zone,
        clusters: [],
        nodes: [],
        util: aggregateUtil([]),
      };
      rg.zones.push(zg);
    }
    zg.clusters.push(cg);
  }

  // Finalize aggregates (single pass once membership is settled).
  for (const rg of regions) {
    rg.zones.sort((a, b) =>
      a.zone === NO_ZONE ? 1 : b.zone === NO_ZONE ? -1 : a.zone.localeCompare(b.zone),
    );
    for (const zg of rg.zones) {
      zg.nodes = zg.clusters.flatMap((c) => c.nodes);
      zg.util = aggregateUtil(zg.nodes);
      rg.clusterCount += zg.clusters.length;
      rg.rackCount += zg.clusters.reduce((s, c) => s + c.racks.length, 0);
    }
    rg.nodes = rg.zones.flatMap((z) => z.nodes);
    rg.util = aggregateUtil(rg.nodes);
  }
  regions.sort((a, b) =>
    a.region === NO_REGION ? 1 : b.region === NO_REGION ? -1 : a.region.localeCompare(b.region),
  );
  return regions;
}

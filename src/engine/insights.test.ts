/**
 * v2.11 (Phase E.5) — Insights engine acceptance tests.
 *
 * Pins the behavior of the pure helpers used by the InsightsPane:
 *   - filterNodesByScope
 *   - sellableCapacity
 *   - revenueRollup
 *   - strandedRevenue
 *   - opportunities
 *
 * All scenarios use synthetic fixtures so they're stable against future
 * seed refreshes.
 */
import { describe, expect, it } from 'vitest';
import {
  filterNodesByScope,
  opportunities,
  revenueRollup,
  sellableCapacity,
  strandedRevenue,
  type FleetEntry,
} from './insights';
import type { CatalogEntry, FleetSpec, NodeDetail, SimulatorResult } from '../types';

// ── Fixtures ─────────────────────────────────────────────────────────────
function mkFleet(id: string, region: string, zone: string, hwName: string): FleetEntry {
  const fleet: FleetSpec = {
    hardwareGroupName: hwName,
    hardwareGroupId: id,
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: 4,
    socketsPerNode: 2,
    coresPerSocket: 32,
    hyperthreadingEnabled: true,
    memoryGibPerNode: 1024,
    isolated: false,
    processor: 'Test CPU',
    throughputCeilingMbps: null,
    region,
    zone,
  };
  return { id, fleet };
}

function mkNode(
  clusterId: string,
  i: number,
  placedVm?: { name: string; mem: number; vcpu: number },
): NodeDetail {
  return {
    nodeId: `${clusterId}:R1N${i}`,
    clusterId,
    rack: 1,
    posInRack: i,
    hardwareGroup: 'Test',
    state: placedVm ? 'occupied-partial' : 'deployable',
    memoryTotalGib: 1024,
    vcpusTotal: 128,
    throughputTotalMbps: null,
    memoryUsedGib: placedVm?.mem ?? 0,
    vcpusUsed: placedVm?.vcpu ?? 0,
    throughputUsedMbps: 0,
    storageThroughputTotalMbps: null,
    storageThroughputUsedMbps: 0,
    strandedMemoryGib: placedVm ? 1024 - placedVm.mem : 0,
    strandedVcpus: placedVm ? 128 - placedVm.vcpu : 0,
    vmsPlaced: placedVm
      ? [{ vmSizeName: placedVm.name, vcpus: placedVm.vcpu, memoryGib: placedVm.mem }]
      : [],
    bindingConstraint: 'NONE',
    isSpilloverNode: false,
  };
}

function mkResult(nodes: NodeDetail[]): SimulatorResult {
  return {
    totalNodes: nodes.length,
    deployableNodesBefore: nodes.length,
    reservedNodes: 0,
    nodesConsumed: nodes.filter((n) => n.vmsPlaced.length > 0).length,
    henRemaining: nodes.filter((n) => n.vmsPlaced.length === 0).length,
    strandedMemoryGib: 0,
    strandedVcpus: 0,
    memoryUtilizationPct: 0,
    vcpuUtilizationPct: 0,
    vmsPlaced: nodes.reduce((s, n) => s + n.vmsPlaced.length, 0),
    vmsUnplaceable: [],
    deploymentLimited: false,
    deploymentLimitReason: null,
    spilloverEvents: [],
    nodeDetail: nodes,
  };
}

function mkVm(
  name: string,
  vcpus: number,
  memoryGib: number,
  hourly: number,
  family = 'M-series',
): CatalogEntry {
  return {
    vmSizeName: name,
    vmGeneration: 'Mv3',
    series: 'M',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: 'Test',
    vcpus,
    memoryGib,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    hourlyUsd: hourly,
    family,
  };
}

// ────────────────────────────────────────────────────────────────────────
// filterNodesByScope
// ────────────────────────────────────────────────────────────────────────
describe('filterNodesByScope', () => {
  const fleets = [
    mkFleet('c1', 'East US 2', 'Zone 1', 'MM'),
    mkFleet('c2', 'East US 2', 'Zone 2', 'MM'),
    mkFleet('c3', 'West Europe', 'Zone 1', 'HM'),
  ];
  const nodes = [
    mkNode('c1', 1),
    mkNode('c1', 2),
    mkNode('c2', 1),
    mkNode('c3', 1),
  ];
  const result = mkResult(nodes);

  it('returns all nodes when scope is null', () => {
    expect(filterNodesByScope(result, fleets, null)).toHaveLength(4);
  });

  it('filters to a region', () => {
    const out = filterNodesByScope(result, fleets, { kind: 'region', key: 'East US 2' });
    expect(out).toHaveLength(3);
    expect(out.every((n) => n.clusterId === 'c1' || n.clusterId === 'c2')).toBe(true);
  });

  it('filters to a zone', () => {
    const out = filterNodesByScope(result, fleets, { kind: 'zone', key: 'Zone 2' });
    expect(out).toHaveLength(1);
    expect(out[0].clusterId).toBe('c2');
  });

  it('filters to a cluster', () => {
    const out = filterNodesByScope(result, fleets, { kind: 'cluster', key: 'c1' });
    expect(out).toHaveLength(2);
    expect(out.every((n) => n.clusterId === 'c1')).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────
// sellableCapacity
// ────────────────────────────────────────────────────────────────────────
describe('sellableCapacity', () => {
  const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
  // 2 empty nodes (1024 GiB, 128 vCPU each)
  const nodes = [mkNode('c1', 1), mkNode('c1', 2)];
  const result = mkResult(nodes);

  it('returns top sellable VMs by revenue', () => {
    const catalog = [
      mkVm('Small', 8, 64, 1.0),
      mkVm('Big', 64, 512, 8.0),
    ];
    const out = sellableCapacity(result, fleets, catalog, null);
    // Big fits 2× per node (1024/512 = 2 mem, 128/64 = 2 vcpu) × 2 nodes = 4
    // Small fits 16× per node (1024/64 = 16 mem, 128/8 = 16 vcpu) × 2 = 32
    // Big = 4 × $8 × 730 = $23,360/mo; Small = 32 × $1 × 730 = $23,360/mo
    expect(out.length).toBeGreaterThan(0);
    // Both have the same revenue; either order is acceptable.
    const bigRow = out.find((r) => r.vmSizeName === 'Big');
    const smallRow = out.find((r) => r.vmSizeName === 'Small');
    expect(bigRow?.fitCount).toBe(4);
    expect(smallRow?.fitCount).toBe(32);
  });

  it('returns empty array when no VMs fit', () => {
    const catalog = [mkVm('TooBig', 999, 9999, 1.0)];
    const out = sellableCapacity(result, fleets, catalog, null);
    expect(out).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// revenueRollup
// ────────────────────────────────────────────────────────────────────────
describe('revenueRollup', () => {
  it('sums today revenue from placed VMs', () => {
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    const nodes = [mkNode('c1', 1, { name: 'M64', mem: 512, vcpu: 64 })];
    const catalog = [mkVm('M64', 64, 512, 5.0)];
    const out = revenueRollup(mkResult(nodes), fleets, catalog, null);
    // 1 VM × $5 × 730 = $3650/mo
    expect(out.todayMonthly).toBeCloseTo(3650, 0);
    expect(out.atCapMonthly).toBeGreaterThanOrEqual(out.todayMonthly);
    expect(out.headroomMonthly).toBe(out.atCapMonthly - out.todayMonthly);
  });

  it('headroom is a true ceiling — ≥ every "what else fits" row (v2.23.1)', () => {
    // One empty 1024 GiB / 128 vCPU node. The greedy revenue-per-GiB walk
    // picks "tiny" first (high $/GiB) but it's vCPU-bound — only 2 fit
    // ($11.7K/mo). A balanced "bal" size fills 16 ($35K/mo). Headroom must
    // reflect the achievable best (bal), not the suboptimal greedy mix —
    // otherwise a single menu row would read higher than the headline.
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    const nodes = [mkNode('c1', 1)]; // empty / fully deployable
    const catalog = [mkVm('tiny', 64, 8, 8.0), mkVm('bal', 8, 64, 3.0)];
    const out = revenueRollup(mkResult(nodes), fleets, catalog, null);
    const maxRow = Math.max(...out.headroomFill.map((r) => r.monthlyRevenue));
    expect(out.headroomMonthly).toBeGreaterThanOrEqual(maxRow);
    expect(out.headroomMonthly).toBeCloseTo(35040, 0); // 16 × $3/hr × 730
    expect(out.headroomVmCount).toBe(16); // the bal-size fill, not 2 (greedy)
  });

  it('per-family breakdown groups correctly', () => {
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    const nodes = [
      mkNode('c1', 1, { name: 'M64', mem: 512, vcpu: 64 }),
      mkNode('c1', 2, { name: 'e16', mem: 128, vcpu: 16 }),
    ];
    const catalog = [
      mkVm('M64', 64, 512, 5.0, 'M-series'),
      mkVm('e16', 16, 128, 1.0, 'E-series'),
    ];
    const out = revenueRollup(mkResult(nodes), fleets, catalog, null);
    expect(out.byFamily).toHaveLength(2);
    expect(out.byFamily[0].family).toBe('M-series'); // higher revenue first
  });
});

// ────────────────────────────────────────────────────────────────────────
// strandedRevenue
// ────────────────────────────────────────────────────────────────────────
describe('strandedRevenue', () => {
  it('returns null fields when no priced catalog', () => {
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    const nodes = [mkNode('c1', 1, { name: 'X', mem: 256, vcpu: 32 })];
    const catalog: CatalogEntry[] = []; // empty
    const out = strandedRevenue(mkResult(nodes), fleets, catalog, null);
    expect(out.memUsdMonthly).toBeNull();
    expect(out.recoverableUsdMonthly).toBeNull();
  });

  it('values stranded memory + vCPU when priced VMs exist', () => {
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    const nodes = [mkNode('c1', 1, { name: 'M64', mem: 256, vcpu: 32 })];
    const catalog = [mkVm('M64', 64, 512, 5.0)];
    const out = strandedRevenue(mkResult(nodes), fleets, catalog, null);
    expect(out.memUsdMonthly).not.toBeNull();
    expect(out.vcpuUsdMonthly).not.toBeNull();
    expect(out.recoverableUsdMonthly).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// opportunities
// ────────────────────────────────────────────────────────────────────────
describe('opportunities', () => {
  it('flags significant unsold capacity', () => {
    const fleets = [mkFleet('c1', 'us-east', 'Zone 1', 'MM')];
    // Many empty high-capacity nodes
    const nodes = Array.from({ length: 50 }, (_, i) => mkNode('c1', i + 1));
    const catalog = [mkVm('Big', 64, 512, 8.0)];
    const out = opportunities(mkResult(nodes), fleets, catalog, null);
    const headroomOp = out.find((o) => o.id === 'sellable-headroom');
    expect(headroomOp).toBeDefined();
    expect(headroomOp?.impactUsdMonthly).toBeGreaterThan(10000);
  });

  it('returns empty for empty fleet', () => {
    const out = opportunities(mkResult([]), [], [], null);
    expect(out).toHaveLength(0);
  });
});

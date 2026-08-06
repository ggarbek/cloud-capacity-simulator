/**
 * v2.19.25 — Defrag pass acceptance tests.
 *
 * Pins:
 *  - Empty vmsUnplaceable → empty plan, no work done.
 *  - Single-eviction swap recovers a larger VM whose deficit a single
 *    placed VM clears.
 *  - Net VMs placed never decreases (the strict invariant).
 *  - Zonal evictees stay in their zone.
 *  - Fungibility matrix is respected (Blocked HW is never used as a
 *    relocation target).
 *  - Reserved + utility nodes are never touched.
 *  - applyDefragPlan produces a new result with placements landed +
 *    unplaceable counts decremented; the original result is untouched.
 */
import { describe, expect, it } from 'vitest';
import { applyDefragPlan, buildDefragPlan, cloneResult } from './defrag';
import type {
  CatalogEntry,
  FleetSpec,
  NodeDetail,
  PlacedVm,
  SimulatorResult,
} from '../types';

// ── Fixtures ─────────────────────────────────────────────────────────────

function mkFleet(opts: {
  id: string;
  hwId?: string;
  hwName?: string;
  zone?: string;
  region?: string;
  memGib?: number;
  vcpus?: number;
}): { id: string; fleet: FleetSpec } {
  const fleet: FleetSpec = {
    hardwareGroupName: opts.hwName ?? `HW-${opts.id}`,
    hardwareGroupId: opts.hwId ?? `hw-${opts.id}`,
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: 4,
    socketsPerNode: 2,
    coresPerSocket: 32,
    hyperthreadingEnabled: true,
    memoryGibPerNode: opts.memGib ?? 1024,
    isolated: false,
    processor: 'Test CPU',
    throughputCeilingMbps: null,
    region: opts.region,
    zone: opts.zone,
  };
  return { id: opts.id, fleet };
}

function mkNode(opts: {
  clusterId: string;
  i: number;
  memTotal?: number;
  vcpuTotal?: number;
  placed?: PlacedVm[];
  state?: NodeDetail['state'];
  isolated?: boolean;
}): NodeDetail {
  const memTotal = opts.memTotal ?? 1024;
  const vcpuTotal = opts.vcpuTotal ?? 128;
  const placed = opts.placed ?? [];
  const memUsed = placed.reduce((s, p) => s + p.memoryGib, 0);
  const vcpuUsed = placed.reduce((s, p) => s + p.vcpus, 0);
  const state: NodeDetail['state'] =
    opts.state ?? (placed.length === 0 ? 'deployable' : 'occupied-partial');
  return {
    nodeId: `${opts.clusterId}:R1N${opts.i}`,
    clusterId: opts.clusterId,
    rack: 1,
    posInRack: opts.i,
    hardwareGroup: 'Test',
    state,
    memoryTotalGib: memTotal,
    vcpusTotal: vcpuTotal,
    throughputTotalMbps: null,
    memoryUsedGib: memUsed,
    vcpusUsed: vcpuUsed,
    throughputUsedMbps: 0,
    storageThroughputTotalMbps: null,
    storageThroughputUsedMbps: 0,
    strandedMemoryGib: memTotal - memUsed,
    strandedVcpus: vcpuTotal - vcpuUsed,
    vmsPlaced: placed.map((p) => ({ ...p })),
    bindingConstraint: 'NONE',
    isSpilloverNode: false,
    isolated: opts.isolated,
  };
}

function mkResult(opts: {
  nodes: NodeDetail[];
  unplaceable?: SimulatorResult['vmsUnplaceable'];
}): SimulatorResult {
  return {
    totalNodes: opts.nodes.length,
    deployableNodesBefore: opts.nodes.length,
    reservedNodes: opts.nodes.filter((n) => n.state === 'reserved').length,
    nodesConsumed: opts.nodes.filter((n) => n.vmsPlaced.length > 0).length,
    henRemaining: 0,
    strandedMemoryGib: 0,
    strandedVcpus: 0,
    memoryUtilizationPct: 0,
    vcpuUtilizationPct: 0,
    vmsPlaced: opts.nodes.reduce((s, n) => s + n.vmsPlaced.length, 0),
    vmsUnplaceable: opts.unplaceable ?? [],
    deploymentLimited: false,
    deploymentLimitReason: null,
    spilloverEvents: [],
    nodeDetail: opts.nodes,
  };
}

function mkVm(opts: {
  name: string;
  vcpus: number;
  memGib: number;
  hourly?: number;
  gen?: string;
}): CatalogEntry {
  return {
    vmSizeName: opts.name,
    vmGeneration: opts.gen ?? 'Mv3',
    series: 'M',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: 'Test',
    vcpus: opts.vcpus,
    memoryGib: opts.memGib,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    hourlyUsd: opts.hourly ?? 1,
    family: 'M-series',
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('defrag — baseline', () => {
  it('empty unplaceable → empty plan', () => {
    const fleet = mkFleet({ id: 'f-1' });
    const result = mkResult({ nodes: [mkNode({ clusterId: 'f-1', i: 1 })] });
    const plan = buildDefragPlan({ result, fleets: [fleet], catalog: [] });
    expect(plan.netVmsGained).toBe(0);
    expect(plan.migrations).toHaveLength(0);
    expect(plan.placements).toHaveLength(0);
    expect(plan.monthlyUsdGained).toBe(0);
  });

  it('cloneResult is deep — mutating clone does not touch original', () => {
    const r = mkResult({
      nodes: [
        mkNode({
          clusterId: 'f-1',
          i: 1,
          placed: [{ vmSizeName: 'A', memoryGib: 128, vcpus: 16 }],
        }),
      ],
    });
    const clone = cloneResult(r);
    clone.nodeDetail[0].vmsPlaced.push({ vmSizeName: 'X', memoryGib: 1, vcpus: 1 });
    expect(r.nodeDetail[0].vmsPlaced).toHaveLength(1);
    expect(clone.nodeDetail[0].vmsPlaced).toHaveLength(2);
  });
});

describe('defrag — single-eviction swap', () => {
  it('finds a 1-VM eviction that frees room for a larger unplaceable VM', () => {
    // Setup: cluster with 2 nodes, each 1024 GiB / 128 vCPU.
    //   N1: holds Small (128/16) → 896 GiB / 112 vCPU free
    //   N2: holds Small (128/16) → 896 GiB / 112 vCPU free
    // Unplaceable: Big needs 1024 GiB → won't fit anywhere right now.
    // Evict Small from N1, relocate to N2 (still has 768 free after) →
    // N1 is empty → Big lands on N1. Net: +1 VM placed (2→3).
    const fleet = mkFleet({ id: 'f-1' });
    const small: PlacedVm = { vmSizeName: 'Small', memoryGib: 128, vcpus: 16 };
    const nodes = [
      mkNode({ clusterId: 'f-1', i: 1, placed: [small] }),
      mkNode({ clusterId: 'f-1', i: 2, placed: [small] }),
    ];
    const result = mkResult({
      nodes,
      unplaceable: [{ vmSizeName: 'Big', count: 1, blockingReason: 'MEMORY' }],
    });
    const catalog = [
      mkVm({ name: 'Small', vcpus: 16, memGib: 128 }),
      mkVm({ name: 'Big', vcpus: 96, memGib: 1024, hourly: 10 }),
    ];

    const plan = buildDefragPlan({ result, fleets: [fleet], catalog });

    expect(plan.netVmsGained).toBe(1);
    expect(plan.migrations).toHaveLength(1);
    expect(plan.placements).toHaveLength(1);
    expect(plan.placements[0].vmSizeName).toBe('Big');
    expect(plan.migrations[0].vmSizeName).toBe('Small');
    // Sanity: monthly revenue uplift = $10/hr × 730 = $7,300/mo.
    expect(plan.monthlyUsdGained).toBeCloseTo(7300, 1);

    // Apply produces a valid result.
    const after = applyDefragPlan(result, plan, catalog);
    expect(after.vmsPlaced).toBe(3);
    expect(after.vmsUnplaceable).toHaveLength(0);
    // Original untouched.
    expect(result.vmsPlaced).toBe(2);
    expect(result.vmsUnplaceable).toHaveLength(1);
  });
});

describe('defrag — zone correctness', () => {
  it('relocates only within the same zone', () => {
    // Two zoned clusters in different zones, both have an evictable VM.
    // The unplaceable Big is meant to land on f-z1 (where it had an
    // eviction candidate). Relocating the evictee must stay in Z1; it
    // must NOT cross into Z2 even though Z2 has capacity.
    const fz1 = mkFleet({ id: 'f-z1', zone: 'Zone 1' });
    const fz2 = mkFleet({ id: 'f-z2', zone: 'Zone 2' });
    const small: PlacedVm = { vmSizeName: 'Small', memoryGib: 128, vcpus: 16 };
    const nodes = [
      // Zone 1 — one node occupied, one node free.
      mkNode({ clusterId: 'f-z1', i: 1, placed: [small] }),
      mkNode({ clusterId: 'f-z1', i: 2 }),
      // Zone 2 — completely empty, NOT a valid relocation target.
      mkNode({ clusterId: 'f-z2', i: 1 }),
      mkNode({ clusterId: 'f-z2', i: 2 }),
    ];
    const result = mkResult({
      nodes,
      unplaceable: [{ vmSizeName: 'Big', count: 1, blockingReason: 'MEMORY' }],
    });
    const catalog = [
      mkVm({ name: 'Small', vcpus: 16, memGib: 128 }),
      mkVm({ name: 'Big', vcpus: 96, memGib: 1024 }),
    ];

    const plan = buildDefragPlan({ result, fleets: [fz1, fz2], catalog });
    expect(plan.netVmsGained).toBe(1);
    // Migration target must be a Zone 1 node.
    const mig = plan.migrations[0];
    expect(['f-z1:R1N2']).toContain(mig.targetNodeId);
  });
});

describe('defrag — fungibility', () => {
  it('does not relocate to a HW group blocked by the matrix', () => {
    // Two HW groups. Small is authored as size-blocked on HW-bad and
    // size-allowed on HW-good. The only relocation target with capacity
    // sits inside HW-bad — so defrag must refuse the plan rather than
    // placing the evictee on a blocked group.
    const fgood = mkFleet({ id: 'f-1', hwId: 'hw-good' });
    const fbad = mkFleet({ id: 'f-2', hwId: 'hw-bad' });
    const small: PlacedVm = { vmSizeName: 'Small', memoryGib: 128, vcpus: 16 };
    const nodes = [
      // hw-good — fully occupied by Small (no relocation room left here).
      mkNode({
        clusterId: 'f-1',
        i: 1,
        memTotal: 256,
        vcpuTotal: 32,
        placed: [small],
      }),
      // hw-bad — has capacity, but matrix forbids Small landing here.
      mkNode({ clusterId: 'f-2', i: 1 }),
    ];
    const result = mkResult({
      nodes,
      unplaceable: [{ vmSizeName: 'Big', count: 1, blockingReason: 'MEMORY' }],
    });
    const catalog = [
      mkVm({ name: 'Small', vcpus: 16, memGib: 128 }),
      mkVm({ name: 'Big', vcpus: 32, memGib: 256 }),
    ];
    const matrix = {
      Small: { 'hw-good': 0, 'hw-bad': 'blocked' as const },
      Big: { 'hw-good': 0, 'hw-bad': 'blocked' as const },
    };
    const plan = buildDefragPlan({
      result,
      fleets: [fgood, fbad],
      catalog,
      matrix,
    });
    expect(plan.netVmsGained).toBe(0);
  });
});

describe('defrag — never displaces utility / reserved nodes', () => {
  it('reserved node is never evicted from', () => {
    const fleet = mkFleet({ id: 'f-1' });
    const small: PlacedVm = { vmSizeName: 'Small', memoryGib: 128, vcpus: 16 };
    const nodes = [
      mkNode({
        clusterId: 'f-1',
        i: 1,
        state: 'reserved',
        placed: [small], // Pretend a util node carries a small "VM".
      }),
      mkNode({ clusterId: 'f-1', i: 2 }), // Empty — relocation room.
    ];
    const result = mkResult({
      nodes,
      unplaceable: [{ vmSizeName: 'Big', count: 1, blockingReason: 'MEMORY' }],
    });
    const catalog = [
      mkVm({ name: 'Small', vcpus: 16, memGib: 128 }),
      mkVm({ name: 'Big', vcpus: 96, memGib: 1024 }),
    ];
    const plan = buildDefragPlan({ result, fleets: [fleet], catalog });
    expect(plan.netVmsGained).toBe(0);
    expect(plan.migrations).toHaveLength(0);
  });
});

describe('defrag — applyDefragPlan invariants', () => {
  it('net VMs placed never decreases', () => {
    const fleet = mkFleet({ id: 'f-1' });
    const small: PlacedVm = { vmSizeName: 'Small', memoryGib: 128, vcpus: 16 };
    const nodes = [
      mkNode({ clusterId: 'f-1', i: 1, placed: [small] }),
      mkNode({ clusterId: 'f-1', i: 2 }),
    ];
    const result = mkResult({
      nodes,
      unplaceable: [{ vmSizeName: 'Big', count: 1, blockingReason: 'MEMORY' }],
    });
    const catalog = [
      mkVm({ name: 'Small', vcpus: 16, memGib: 128 }),
      mkVm({ name: 'Big', vcpus: 96, memGib: 1024 }),
    ];
    const before = result.vmsPlaced;
    const plan = buildDefragPlan({ result, fleets: [fleet], catalog });
    const after = applyDefragPlan(result, plan, catalog);
    expect(after.vmsPlaced).toBeGreaterThanOrEqual(before);
    expect(after.vmsPlaced - before).toBe(plan.netVmsGained);
  });
});

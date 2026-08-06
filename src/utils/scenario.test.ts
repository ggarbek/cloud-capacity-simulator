/**
 * Scenario Analysis helper tests (v2.23).
 *
 * Deterministic fleet: one HW-A cluster (4 nodes × 256 GiB / 32 vCPU); each
 * node fits 4 × Test_D8 (64 GiB / 8 vCPU) → 16 slots. A BoM of 8 fills 2
 * nodes, leaving 8 slots of headroom — so the scenario math has a known
 * answer to assert against.
 */
import { describe, expect, it } from 'vitest';
import type { AppState } from '../state/AppState';
import { initialState } from '../state/AppState';
import type { BomEntry, FleetSpec, HardwareGroup, UserVm } from '../types';
import { buildAndRunSimulation } from './runEngine';
import { buildFleetHierarchy } from '../components/fleetmap/fleetmapData';
import { computeScenario, computeMultiScenario, listScopeOptions } from './scenario';
import { computeAnswers } from './answers';

const VM_D8: UserVm = {
  vmSizeName: 'Test_D8',
  vmGeneration: 'Dv5',
  series: 'D-Series',
  memoryCategory: 'Medium Memory (MM)',
  homeHardwareGroup: 'HW-A',
  spilloverTarget: 'N/A',
  processor: 'Intel',
  vcpus: 8,
  memoryGib: 64,
  networkMbps: 0,
  localDiskGib: 0,
  status: 'GA',
  notes: '',
  provider: 'Azure',
  hourlyUsd: 1.0, // $730/mo per VM
};

// Bigger than any node → can never fit (oversize-memory).
const VM_BIG: UserVm = { ...VM_D8, vmSizeName: 'Test_Big', memoryGib: 512, hourlyUsd: 5 };
// Fits structurally, but has NO fungibility rule → blocked by fungibility.
const VM_NORULE: UserVm = { ...VM_D8, vmSizeName: 'Test_NoRule', hourlyUsd: 2 };

const HW_A: HardwareGroup = {
  id: 'hw-a',
  name: 'HW-A',
  provider: 'Azure',
  memoryCategory: 'mm',
  memoryGibPerNode: 256,
  socketsPerNode: 1,
  vcpusPerNode: 32,
  coresPerSocket: 16,
  nodesPerRack: 4,
  processor: 'Intel Test',
  homeFor: [],
  spilloverFrom: [],
  isolated: false,
  costPerRackUsd: 100_000,
  usableLifeMonths: 60,
};

const FLEET_A: FleetSpec = {
  hardwareGroupName: HW_A.name,
  hardwareGroupId: HW_A.id,
  memoryCategory: 'mm',
  rackCount: 1,
  nodesPerRack: 4,
  socketsPerNode: 1,
  coresPerSocket: 16,
  hyperthreadingEnabled: true,
  memoryGibPerNode: 256,
  processor: HW_A.processor,
  isolated: false,
  region: 'Test Region',
  zone: 'Zone 1',
  costPerRackUsd: HW_A.costPerRackUsd,
  usableLifeMonths: HW_A.usableLifeMonths,
  bufferDefault: { mode: 'pct', value: 0 },
  bufferAcknowledged: true,
};

function makeState(): AppState {
  const bom: BomEntry[] = [{ vmSizeName: 'Test_D8', quantity: 8, deploymentType: 'regional' }];
  return {
    ...initialState,
    bom,
    fleets: { 'f-1': FLEET_A },
    fleetOrder: ['f-1'],
    userHardware: [HW_A],
    userVms: [VM_D8, VM_BIG, VM_NORULE],
    userFungibility: { Test_D8: { 'hw-a': 0 }, Test_Big: { 'hw-a': 0 } },
    fungibilityOn: true,
    buffer: { mode: 'pct', value: 0 },
  };
}

describe('computeScenario', () => {
  it('reports the max additional fit + sellable revenue into leftover space', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    expect(result.vmsPlaced).toBe(8); // 2 of 4 nodes filled

    const s = computeScenario(state, result, 'Test_D8', null, 'payg', null, 'the fleet')!;
    expect(s.fitCount).toBe(8); // 2 empty nodes × 4
    expect(s.monthlyRevenue).toBe(8 * 1.0 * 730);
    expect(s.target).toBeNull();
    expect(s.block).toBeNull();
  });

  it('splits a target into placed vs blocked with a capacity reason', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const s = computeScenario(state, result, 'Test_D8', null, 'payg', 12, 'the fleet')!;
    expect(s.placed).toBe(8);
    expect(s.blocked).toBe(4);
    expect(s.block?.kind).toBe('capacity');
    expect(s.block?.severity).toBe('capacity');
  });

  it('flags a structurally oversized size (never fits any node)', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const s = computeScenario(state, result, 'Test_Big', null, 'payg', 5, 'the fleet')!;
    expect(s.fitCount).toBe(0);
    expect(s.blocked).toBe(5);
    expect(s.block?.kind).toBe('oversize-mem');
    expect(s.block?.severity).toBe('structural');
  });

  it('flags a size with no fungibility rule (user-fixable)', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const s = computeScenario(state, result, 'Test_NoRule', null, 'payg', 5, 'the fleet')!;
    expect(s.fitCount).toBe(0);
    expect(s.block?.kind).toBe('fungibility');
    expect(s.block?.severity).toBe('user');
  });

  it('explains a 0-fit even with no target quantity (no silent "no room")', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    // No target, but the size has no fungibility rule → block must still name why.
    const noRule = computeScenario(state, result, 'Test_NoRule', null, 'payg', null, 'the fleet')!;
    expect(noRule.fitCount).toBe(0);
    expect(noRule.target).toBeNull();
    expect(noRule.block?.kind).toBe('fungibility');
    // No target, structurally oversized → still explained.
    const big = computeScenario(state, result, 'Test_Big', null, 'payg', null, 'the fleet')!;
    expect(big.block?.kind).toBe('oversize-mem');
    // A size that DOES fit with no target carries no block (nothing to explain).
    const fits = computeScenario(state, result, 'Test_D8', null, 'payg', null, 'the fleet')!;
    expect(fits.block).toBeNull();
  });

  it('narrows by scope — a non-matching region scope finds nothing', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const fleetWide = computeScenario(state, result, 'Test_D8', null, 'payg', null, 'the fleet')!;
    const wrongRegion = computeScenario(
      state,
      result,
      'Test_D8',
      { kind: 'region', key: 'Nowhere' },
      'payg',
      null,
      'Nowhere',
    )!;
    const realCluster = computeScenario(
      state,
      result,
      'Test_D8',
      { kind: 'cluster', key: 'f-1' },
      'payg',
      null,
      'Cluster 1',
    )!;
    expect(fleetWide.fitCount).toBe(8);
    expect(wrongRegion.fitCount).toBe(0);
    expect(realCluster.fitCount).toBe(8);
  });

  it('lists fleet-wide + region + zone + cluster scope options', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const opts = listScopeOptions(buildFleetHierarchy(state, result));
    expect(opts.map((o) => o.kind)).toEqual(
      expect.arrayContaining(['fleet', 'region', 'zone', 'cluster']),
    );
    expect(opts[0].kind).toBe('fleet'); // fleet-wide always first
  });
});

describe('computeAnswers scope filter (Overview "Where")', () => {
  it('scopes placement but keeps blockers fleet-wide', () => {
    // BoM with a structurally-oversized line → a fleet-wide blocker.
    const base = makeState();
    const state: AppState = {
      ...base,
      bom: [
        { vmSizeName: 'Test_D8', quantity: 8, deploymentType: 'regional' },
        { vmSizeName: 'Test_Big', quantity: 3, deploymentType: 'regional' }, // can't fit any node
      ],
    };
    const result = buildAndRunSimulation(state);

    const fleet = computeAnswers(state, result, 'payg', null);
    const scoped = computeAnswers(state, result, 'payg', { kind: 'cluster', key: 'f-1' });

    // Fleet-wide: the oversized line is blocked + attributed to the fleet view.
    expect(fleet.blockers.totalBlocked).toBe(3);
    expect(fleet.blockers.fleetWide).toBe(false);
    expect(fleet.supportable.blocked).toBe(3);

    // Scoped: blockers stay FLEET-WIDE (same count, flagged), but the scoped
    // placement view excludes them (blocked = 0). Placement carries over (the
    // fixture has a single cluster, so the scope == the whole fleet for placed).
    expect(scoped.blockers.totalBlocked).toBe(3);
    expect(scoped.blockers.fleetWide).toBe(true);
    expect(scoped.supportable.blocked).toBe(0);
    expect(scoped.supportable.placed).toBe(fleet.supportable.placed);
    // Scoped financials are computed (cluster in scope) — revenue priced.
    expect(scoped.profitability.monthlyRevenue).toBe(fleet.profitability.monthlyRevenue);
  });
});

describe('computeMultiScenario', () => {
  it('sizes compete for the same leftover capacity, in list order', () => {
    const base = makeState();
    const D8b: UserVm = { ...VM_D8, vmSizeName: 'Test_D8b', hourlyUsd: 0.5 };
    const state: AppState = {
      ...base,
      userVms: [...base.userVms, D8b],
      userFungibility: { ...base.userFungibility, Test_D8b: { 'hw-a': 0 } },
    };
    const result = buildAndRunSimulation(state);
    // 8 free slots total. Line 1 asks 5 (gets 5), line 2 asks 5 (only 3 left).
    const ms = computeMultiScenario(
      state,
      result,
      [
        { vmSizeName: 'Test_D8', target: 5 },
        { vmSizeName: 'Test_D8b', target: 5 },
      ],
      null,
      'payg',
      'the fleet',
    );
    expect(ms.totalPlaced).toBe(8);
    expect(ms.lines[0].placed).toBe(5);
    expect(ms.lines[0].blocked).toBe(0);
    expect(ms.lines[1].placed).toBe(3);
    expect(ms.lines[1].blocked).toBe(2);
    expect(ms.lines[1].block?.kind).toBe('capacity');
    expect(ms.totalRequested).toBe(10);
    expect(ms.anyBlocked).toBe(true);
    // Revenue driven vs blocked: line 2 (D8b @ $0.5/hr) blocked 2 → $730/mo
    // left on the table; 2 units total undeployable.
    expect(ms.totalBlocked).toBe(2);
    expect(ms.totalBlockedRevenue).toBe(2 * 0.5 * 730);
    expect(ms.lines[1].blockedRevenue).toBe(2 * 0.5 * 730);
    // Revenue driven = 5 D8 ($1) + 3 D8b ($0.5), all per 730h.
    expect(ms.totalMonthlyRevenue).toBe((5 * 1.0 + 3 * 0.5) * 730);
    // Per-cluster size breakdown ("which VMs land where") — every placed unit
    // is attributed to a cluster + size, so the bySize counts reconcile with
    // the per-line placed totals.
    const placedBySize = new Map<string, number>();
    for (const c of ms.perCluster)
      for (const s of c.bySize)
        placedBySize.set(s.vmSizeName, (placedBySize.get(s.vmSizeName) ?? 0) + s.count);
    for (const line of ms.lines)
      expect(placedBySize.get(line.vmSizeName) ?? 0).toBe(line.placed);
    // Post-scenario fullness — every landing cluster reports a 0–100 fill % on
    // a real binding dimension. This scenario fills the fleet (8 of 8 slots), so
    // the binding dimension should read at or near capacity.
    for (const c of ms.perCluster) {
      expect(c.fillPct).toBeGreaterThanOrEqual(0);
      expect(c.fillPct).toBeLessThanOrEqual(100);
      expect(['memory', 'vCPU', 'network', 'storage']).toContain(c.bindingDim);
      expect(c.fillPct).toBeGreaterThan(50); // packed to capacity → not near-empty
      // Node footprint — a cluster the scenario lands VMs on consumes ≥1 node,
      // and never more nodes than VMs placed there.
      expect(c.nodesConsumed).toBeGreaterThan(0);
      expect(c.nodesConsumed!).toBeLessThanOrEqual(c.fits);
    }
  });

  it('a "max" line (null target) grabs all remaining capacity', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const ms = computeMultiScenario(state, result, [{ vmSizeName: 'Test_D8', target: null }], null, 'payg', 'the fleet');
    expect(ms.totalPlaced).toBe(8);
    expect(ms.lines[0].blocked).toBeNull();
    expect(ms.totalRequested).toBeNull();
    expect(ms.totalMonthlyRevenue).toBe(8 * 1.0 * 730);
    expect(ms.anyBlocked).toBe(false);
  });

  it('per-size blockers — oversize is structural, no-rule is user-fixable', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const ms = computeMultiScenario(
      state,
      result,
      [
        { vmSizeName: 'Test_Big', target: 2 },
        { vmSizeName: 'Test_NoRule', target: 2 },
      ],
      null,
      'payg',
      'the fleet',
    );
    expect(ms.lines[0].placed).toBe(0);
    expect(ms.lines[0].block?.kind).toBe('oversize-mem');
    expect(ms.lines[0].block?.severity).toBe('structural');
    expect(ms.lines[1].placed).toBe(0);
    expect(ms.lines[1].block?.kind).toBe('fungibility');
    expect(ms.lines[1].block?.severity).toBe('user');
  });
});

/**
 * Investment scenario helper tests (v3 — the "five questions" rebuild).
 *
 * Verifies evaluateInvestment's verdicts + arithmetic against a small
 * deterministic fleet: one cluster that deliberately can't hold the whole
 * BoM, plus a candidate hardware addition that can absorb the overflow.
 */
import { describe, expect, it } from 'vitest';
import type { AppState } from '../state/AppState';
import { initialState } from '../state/AppState';
import type { BomEntry, FleetSpec, HardwareGroup, UserVm } from '../types';
import { evaluateInvestment, defaultInvestmentPlan } from './investment';
import { buildAndRunSimulation } from './runEngine';
import { computeAnswers, investmentAnswerRows } from './answers';

// ── Fixtures ─────────────────────────────────────────────────────────────

const VM: UserVm = {
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
  hourlyUsd: 1.0, // $730/mo per VM — keeps the arithmetic legible
};

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

// Same shape, separate identity — the "candidate purchase".
const HW_B: HardwareGroup = { ...HW_A, id: 'hw-b', name: 'HW-B' };

/** One placed cluster of HW-A: 1 rack × 4 nodes × (256 GiB / 32 vCPU).
 *  Each node fits 4 × Test_D8 → 16 VMs total. Zero buffer for determinism. */
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

function makeState(overrides: Partial<AppState> = {}): AppState {
  const bom: BomEntry[] = [
    { vmSizeName: 'Test_D8', quantity: 24, deploymentType: 'regional' },
  ];
  return {
    ...initialState,
    bom,
    fleets: { 'f-1': FLEET_A },
    fleetOrder: ['f-1'],
    userHardware: [HW_A],
    userVms: [VM],
    userFungibility: { Test_D8: { 'hw-a': 0 } },
    fungibilityOn: true,
    buffer: { mode: 'pct', value: 0 },
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('evaluateInvestment', () => {
  it('baseline sanity: 16 of 24 fit on one HW-A rack', () => {
    const state = makeState();
    const r = buildAndRunSimulation(state);
    expect(r.vmsPlaced).toBe(16);
    expect(r.vmsUnplaceable.reduce((s, u) => s + u.count, 0)).toBe(8);
  });

  it('adding a rack of the same hardware absorbs the overflow and pays back', () => {
    const state = makeState();
    const report = evaluateInvestment(state, { hardware: HW_A, rackCount: 1 }, 'payg');
    expect(report.deltaPlaced).toBe(8);
    expect(report.scenarioUnplaceable).toBe(0);
    // 8 VMs × $1/hr × 730 = $5,840/mo added demand revenue.
    expect(report.deltaRevenueTodayMonthly).toBeCloseTo(8 * 730, 5);
    expect(report.capexUsd).toBe(100_000);
    // GP = 5840 − 100000/60 ≈ 4173.3 → payback ≈ 23.96 mo, well inside 60.
    expect(report.paybackMonthsDemand).toBeGreaterThan(20);
    expect(report.paybackMonthsDemand).toBeLessThan(30);
    expect(report.verdict).toBe('pays-back');
    expect(report.assumedFungibility).toBe(false); // hw-a has authored rules
  });

  it('un-authored candidate hardware is assumed fungible (flagged) and still helps', () => {
    const state = makeState();
    const report = evaluateInvestment(state, { hardware: HW_B, rackCount: 1 }, 'payg');
    expect(report.assumedFungibility).toBe(true);
    expect(report.deltaPlaced).toBe(8);
    expect(report.verdict).toBe('pays-back');
  });

  it('explicitly Blocked candidate hardware is respected → no-help', () => {
    const state = makeState({
      userFungibility: { Test_D8: { 'hw-a': 0, 'hw-b': 'blocked' } },
    });
    const report = evaluateInvestment(state, { hardware: HW_B, rackCount: 1 }, 'payg');
    expect(report.assumedFungibility).toBe(false);
    expect(report.deltaPlaced).toBe(0);
    expect(report.verdict).toBe('no-help');
  });

  it('everything already fits → not-needed', () => {
    const state = makeState({
      bom: [{ vmSizeName: 'Test_D8', quantity: 10, deploymentType: 'regional' }],
    });
    const report = evaluateInvestment(state, { hardware: HW_A, rackCount: 1 }, 'payg');
    expect(report.baselineUnplaceable).toBe(0);
    expect(report.verdict).toBe('not-needed');
  });

  it('missing cost data → no-cost-data, placement delta still reported', () => {
    const freeHw: HardwareGroup = { ...HW_B, costPerRackUsd: undefined, costPerNodeUsd: undefined };
    const state = makeState();
    const report = evaluateInvestment(state, { hardware: freeHw, rackCount: 1 }, 'payg');
    expect(report.deltaPlaced).toBe(8);
    expect(report.capexUsd).toBeUndefined();
    expect(report.verdict).toBe('no-cost-data');
  });

  it('absurdly expensive hardware → never-pays-back', () => {
    const goldHw: HardwareGroup = { ...HW_B, costPerRackUsd: 1_000_000_000 };
    const state = makeState();
    const report = evaluateInvestment(state, { hardware: goldHw, rackCount: 1 }, 'payg');
    // Monthly depreciation alone (≈ $16.7M/mo) dwarfs any added revenue.
    expect(report.verdict).toBe('never-pays-back');
    expect(report.paybackMonthsDemand).toBeUndefined();
  });

  it('defaultInvestmentPlan picks the fleet-dominant library hardware', () => {
    const state = makeState();
    const plan = defaultInvestmentPlan(state);
    expect(plan?.hardware.id).toBe('hw-a');
    expect(plan?.rackCount).toBe(1);
  });

  it('never mutates the input state', () => {
    const state = makeState();
    const before = JSON.stringify({
      fleets: state.fleets,
      fleetOrder: state.fleetOrder,
      userHardware: state.userHardware,
      userFungibility: state.userFungibility,
    });
    evaluateInvestment(state, { hardware: HW_B, rackCount: 2 }, 'payg');
    const after = JSON.stringify({
      fleets: state.fleets,
      fleetOrder: state.fleetOrder,
      userHardware: state.userHardware,
      userFungibility: state.userFungibility,
    });
    expect(after).toBe(before);
  });
});

describe('computeAnswers', () => {
  it('answers the supportable / blockers / sellable questions from a result', () => {
    const state = makeState();
    const result = buildAndRunSimulation(state);
    const a = computeAnswers(state, result, 'payg');

    expect(a.supportable.verdict).toBe('no'); // 16/24 = 67%
    expect(a.supportable.placed).toBe(16);
    expect(a.supportable.asked).toBe(24);

    expect(a.blockers.totalBlocked).toBe(8);
    expect(a.blockers.groups.length).toBeGreaterThan(0);
    expect(a.blockers.groups[0].skus[0].vmSizeName).toBe('Test_D8');

    // Fleet is exactly full (16 × 4 VMs consume all memory+vCPU) → sold out.
    expect(a.sellable.headroomMonthly).toBe(0);
    expect(a.sellable.todayMonthly).toBeCloseTo(16 * 730, 5);

    // Profitability: revenue 11,680/mo vs depreciation 1,666.67/mo → healthy.
    expect(a.profitability.verdict).toBe('yes');
    expect(a.profitability.tone).toBe('good');
  });

  it('all-fits BoM reads yes / nothing blocked', () => {
    const state = makeState({
      bom: [{ vmSizeName: 'Test_D8', quantity: 10, deploymentType: 'regional' }],
    });
    const result = buildAndRunSimulation(state);
    const a = computeAnswers(state, result, 'payg');
    expect(a.supportable.verdict).toBe('yes');
    expect(a.blockers.verdict).toBe('yes');
    expect(a.sellable.headroomMonthly).toBeGreaterThan(0);
  });

  it('investmentAnswerRows maps verdicts to plain-English rows', () => {
    const state = makeState();
    const report = evaluateInvestment(state, { hardware: HW_A, rackCount: 1 }, 'payg');
    const rows = investmentAnswerRows(report);
    expect(rows.investment.verdict).toBe('yes');
    expect(rows.payback.headline).toMatch(/pays back in/i);
    const empty = investmentAnswerRows(null);
    expect(empty.investment.verdict).toBe('na');
  });
});

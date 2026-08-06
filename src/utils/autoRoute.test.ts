/**
 * autoRouteMissingRules tests (v2.20.1).
 *
 * Verifies the one-click fungibility authoring: tightest-fit home,
 * ascending spillover tiers, existing decisions (incl. Blocked) never
 * touched, structurally-unfittable hardware skipped, input immutability.
 */
import { describe, expect, it } from 'vitest';
import type { AppState } from '../state/AppState';
import { initialState } from '../state/AppState';
import type { BomEntry, FleetSpec, HardwareGroup, UserVm } from '../types';
import { autoRouteMissingRules } from './autoRoute';
import { buildAndRunSimulation } from './runEngine';

const vm = (name: string, memoryGib: number, vcpus: number): UserVm => ({
  vmSizeName: name,
  vmGeneration: 'Dv5',
  series: 'D-Series',
  memoryCategory: 'Medium Memory (MM)',
  homeHardwareGroup: '',
  spilloverTarget: 'N/A',
  processor: 'Intel',
  vcpus,
  memoryGib,
  networkMbps: 0,
  localDiskGib: 0,
  status: 'GA',
  notes: '',
  provider: 'Azure',
  hourlyUsd: 1,
});

const hw = (id: string, memoryGibPerNode: number): HardwareGroup => ({
  id,
  name: id.toUpperCase(),
  provider: 'Azure',
  memoryCategory: 'mm',
  memoryGibPerNode,
  socketsPerNode: 1,
  vcpusPerNode: 64,
  coresPerSocket: 32,
  nodesPerRack: 4,
  processor: 'Intel Test',
  homeFor: [],
  spilloverFrom: [],
  isolated: false,
  costPerRackUsd: 100_000,
  usableLifeMonths: 60,
});

const fleetOf = (g: HardwareGroup, zone: string): FleetSpec => ({
  hardwareGroupName: g.name,
  hardwareGroupId: g.id,
  memoryCategory: 'mm',
  rackCount: 1,
  nodesPerRack: 4,
  socketsPerNode: 1,
  coresPerSocket: 32,
  hyperthreadingEnabled: true,
  memoryGibPerNode: g.memoryGibPerNode,
  processor: g.processor,
  isolated: false,
  region: 'Test Region',
  zone,
  bufferDefault: { mode: 'pct', value: 0 },
  bufferAcknowledged: true,
});

const SMALL = hw('small', 256);
const LARGE = hw('large', 1024);

function makeState(overrides: Partial<AppState> = {}): AppState {
  const bom: BomEntry[] = [
    { vmSizeName: 'Test_D8', quantity: 10, deploymentType: 'regional' },
  ];
  return {
    ...initialState,
    bom,
    fleets: { 'f-1': fleetOf(SMALL, 'Zone 1'), 'f-2': fleetOf(LARGE, 'Zone 1') },
    fleetOrder: ['f-1', 'f-2'],
    userHardware: [SMALL, LARGE],
    userVms: [vm('Test_D8', 64, 8), vm('Test_Huge', 2048, 96)],
    userFungibility: {},
    fungibilityOn: true,
    buffer: { mode: 'pct', value: 0 },
    ...overrides,
  };
}

describe('autoRouteMissingRules', () => {
  it('authors tightest-fit home + ascending spillover for missing pairs', () => {
    const state = makeState();
    const report = autoRouteMissingRules(state);
    expect(report.sizesCovered).toEqual(['Test_D8']);
    // Smallest fitting node (small, 256 GiB) = home; large = spill-1.
    expect(report.matrix['Test_D8']).toEqual({ small: 0, large: 1 });
    expect(report.authored).toHaveLength(2);
  });

  it('never touches existing decisions, including explicit Blocked', () => {
    const state = makeState({
      userFungibility: { Test_D8: { small: 'blocked' } },
    });
    const report = autoRouteMissingRules(state);
    // small stays blocked; only large gets a cell — and since no home
    // exists anywhere, large becomes the home.
    expect(report.matrix['Test_D8'].small).toBe('blocked');
    expect(report.matrix['Test_D8'].large).toBe(0);
  });

  it('continues the tier ladder when a home already exists', () => {
    const state = makeState({
      userFungibility: { Test_D8: { large: 0 } },
    });
    const report = autoRouteMissingRules(state);
    expect(report.matrix['Test_D8'].large).toBe(0); // untouched
    expect(report.matrix['Test_D8'].small).toBe(1); // next free tier
  });

  it('skips hardware the VM cannot structurally fit', () => {
    const state = makeState({
      bom: [{ vmSizeName: 'Test_Huge', quantity: 2, deploymentType: 'regional' }],
    });
    const report = autoRouteMissingRules(state);
    // 2048 GiB VM fits neither 256 nor 1024 GiB nodes.
    expect(report.sizesUnfittable).toEqual(['Test_Huge']);
    expect(report.authored).toHaveLength(0);
    expect(report.matrix).toBe(state.userFungibility); // unchanged reference
  });

  it('only routes to PLACED hardware, not the whole library', () => {
    const shelf = hw('shelf-only', 4096); // in library, never placed
    const state = makeState({ userHardware: [SMALL, LARGE, shelf] });
    const report = autoRouteMissingRules(state);
    expect(report.matrix['Test_D8']['shelf-only']).toBeUndefined();
  });

  it('does not mutate the input matrix', () => {
    const state = makeState({ userFungibility: { Test_D8: { large: 0 } } });
    const before = JSON.stringify(state.userFungibility);
    autoRouteMissingRules(state);
    expect(JSON.stringify(state.userFungibility)).toBe(before);
  });

  it('the authored matrix actually places the BoM through the engine', () => {
    const state = makeState();
    const report = autoRouteMissingRules(state);
    const routed: AppState = { ...state, userFungibility: report.matrix };
    const result = buildAndRunSimulation(routed);
    expect(result.vmsPlaced).toBe(10);
    expect(result.vmsUnplaceable).toHaveLength(0);
  });
});

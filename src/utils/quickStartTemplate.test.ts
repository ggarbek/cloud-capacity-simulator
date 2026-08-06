/**
 * Quick Start template tests (v2.20.1).
 *
 * The wizard's `(intent) → Partial<AppState>` contract: one cluster per
 * zone, zonal-balance BoM rows, auto-routed fungibility, strictly
 * additive over existing state — and the composed state actually places
 * through the canonical engine.
 */
import { describe, expect, it } from 'vitest';
import type { AppState } from '../state/AppState';
import { initialState } from '../state/AppState';
import type { UserVm } from '../types';
import { buildQuickStartPatch, STARTER_SERVERS } from './quickStartTemplate';
import { buildAndRunSimulation } from './runEngine';

const VM: UserVm = {
  vmSizeName: 'Test_D8',
  vmGeneration: 'Dv5',
  series: 'D-Series',
  memoryCategory: 'Medium Memory (MM)',
  homeHardwareGroup: '',
  spilloverTarget: 'N/A',
  processor: 'Intel',
  vcpus: 8,
  memoryGib: 64,
  networkMbps: 0,
  localDiskGib: 0,
  status: 'GA',
  notes: '',
  provider: 'Azure',
  hourlyUsd: 1,
};

function makeState(): AppState {
  return { ...initialState, userVms: [VM], buffer: { mode: 'pct', value: 0 } };
}

const INTENT = {
  hardware: STARTER_SERVERS[0],
  region: 'Test Region',
  zones: ['Zone 1', 'Zone 2'],
  racksPerZone: 1,
  demand: [{ vmSizeName: 'Test_D8', quantity: 40 }],
  deployment: 'zonal' as const,
};

describe('buildQuickStartPatch', () => {
  it('creates one cluster per zone + authored region/zones + zonal BoM + routing', () => {
    const state = makeState();
    const r = buildQuickStartPatch(state, INTENT);

    expect(r.clusterIds).toHaveLength(2);
    const fleets = r.patch.fleets!;
    expect(fleets[r.clusterIds[0]].zone).toBe('Zone 1');
    expect(fleets[r.clusterIds[1]].zone).toBe('Zone 2');
    expect(fleets[r.clusterIds[0]].bufferAcknowledged).toBe(true);

    expect(r.patch.fleetRegions).toEqual([
      { region: 'Test Region', zones: ['Zone 1', 'Zone 2'] },
    ]);

    const bom = r.patch.bom!;
    expect(bom).toHaveLength(1);
    expect(bom[0].deploymentType).toBe('zonal');
    expect(bom[0].zones).toBeUndefined(); // balance semantic — never auto-pin

    // Starter profile got added to the library + routing authored for it.
    expect(r.patch.userHardware!.some((g) => g.id === STARTER_SERVERS[0].id)).toBe(true);
    expect(r.autoRoutedCells).toBeGreaterThan(0);
    expect(r.patch.userFungibility!['Test_D8'][STARTER_SERVERS[0].id]).toBe(0);
  });

  it('the composed state places the demand through the canonical engine', () => {
    const state = makeState();
    const r = buildQuickStartPatch(state, INTENT);
    const merged = { ...state, ...r.patch } as AppState;
    const result = buildAndRunSimulation(merged);
    // 2 zones × 1 rack × 8 nodes × (256/64=4 mem, 64/8=8 vcpu → 4/node)
    // = 64 capacity ≥ 40 asked. Zonal balance splits 20/20.
    expect(result.vmsPlaced).toBe(40);
    expect(result.vmsUnplaceable).toHaveLength(0);
  });

  it('is strictly additive over existing state', () => {
    const base = makeState();
    const first = buildQuickStartPatch(base, INTENT);
    const afterFirst = { ...base, ...first.patch } as AppState;

    const second = buildQuickStartPatch(afterFirst, {
      ...INTENT,
      hardware: STARTER_SERVERS[1],
      zones: ['Zone 3'],
      demand: [{ vmSizeName: 'Test_D8', quantity: 5 }],
    });
    // Prior clusters, BoM rows, and matrix cells all survive.
    expect(second.patch.fleetOrder).toEqual([...first.patch.fleetOrder!, 'qs-3']);
    expect(second.patch.bom).toHaveLength(2);
    expect(second.patch.userFungibility!['Test_D8'][STARTER_SERVERS[0].id]).toBe(0);
    // The new HW joins the ladder as spillover (home already exists).
    expect(second.patch.userFungibility!['Test_D8'][STARTER_SERVERS[1].id]).toBe(1);
    // Region row merged, not duplicated.
    expect(second.patch.fleetRegions).toEqual([
      { region: 'Test Region', zones: ['Zone 1', 'Zone 2', 'Zone 3'] },
    ]);
  });

  it('drops the unconfigured default fleet stub', () => {
    const state = makeState(); // initialState carries the blank f-1 stub
    const r = buildQuickStartPatch(state, INTENT);
    expect(r.patch.fleetOrder).not.toContain('f-1');
  });

  it('never mutates the input state', () => {
    const state = makeState();
    const before = JSON.stringify({
      fleets: state.fleets,
      bom: state.bom,
      userHardware: state.userHardware,
      fleetRegions: state.fleetRegions,
      userFungibility: state.userFungibility,
    });
    buildQuickStartPatch(state, INTENT);
    expect(
      JSON.stringify({
        fleets: state.fleets,
        bom: state.bom,
        userHardware: state.userHardware,
        fleetRegions: state.fleetRegions,
        userFungibility: state.userFungibility,
      }),
    ).toBe(before);
  });
});

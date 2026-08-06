/**
 * prepareSnapshotHydrate tests (v2.20.1).
 *
 * This is the ONE snapshot→HYDRATE path (demo + file import), so its two
 * fixes are regression-guarded: ui.activeRegion derivation (fleets' modal
 * region wins; catalog fills the gaps) and stale-result clearing.
 */
import { describe, expect, it } from 'vitest';
import type { AppState } from '../state/AppState';
import { initialState } from '../state/AppState';
import type { FleetSpec, HardwareGroup, SimulatorResult, UserVm } from '../types';
import type { FleetSnapshot } from './saveLoad';
import { prepareSnapshotHydrate, isDemoFleet } from './demoSnapshot';

const vm = (name: string, provider: string, region: string): UserVm => ({
  vmSizeName: name,
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
  provider,
  region,
});

const hw = (id: string, provider: string): HardwareGroup => ({
  id,
  name: id.toUpperCase(),
  provider,
  memoryCategory: 'mm',
  memoryGibPerNode: 256,
  socketsPerNode: 1,
  vcpusPerNode: 64,
  coresPerSocket: 32,
  nodesPerRack: 4,
  processor: 'Intel Test',
  homeFor: [],
  spilloverFrom: [],
  isolated: false,
});

const fleet = (hwId: string, region: string): FleetSpec => ({
  hardwareGroupName: hwId.toUpperCase(),
  hardwareGroupId: hwId,
  memoryCategory: 'mm',
  rackCount: 1,
  nodesPerRack: 4,
  socketsPerNode: 1,
  coresPerSocket: 32,
  hyperthreadingEnabled: true,
  memoryGibPerNode: 256,
  processor: 'Intel Test',
  isolated: false,
  region,
});

function snapshot(data: FleetSnapshot['data']): FleetSnapshot {
  return {
    kind: 'capacity-simulator-snapshot',
    schemaVersion: 1,
    appVersion: 'test',
    exportedAt: '2026-06-10T00:00:00Z',
    data,
  };
}

describe('prepareSnapshotHydrate', () => {
  it("derives activeRegion from the snapshot fleets' modal region per provider", () => {
    const state: AppState = {
      ...initialState,
      ui: { ...initialState.ui, activeRegion: { Azure: 'West Europe' } },
    };
    const snap = snapshot({
      userHardware: [hw('a1', 'Azure')],
      fleets: {
        'f-1': fleet('a1', 'East US 2'),
        'f-2': fleet('a1', 'East US 2'),
        'f-3': fleet('a1', 'Central US'),
      },
      fleetOrder: ['f-1', 'f-2', 'f-3'],
      userVms: [vm('Test_D8', 'Azure', 'East US 2')],
    });
    const patch = prepareSnapshotHydrate(snap, state);
    // Fleets live (mostly) in East US 2 — that OVERRIDES the user's stale
    // West Europe pick so the engine prices what it places.
    expect(patch.ui!.activeRegion!.Azure).toBe('East US 2');
  });

  it('fills providers with no fleets from the snapshot catalog (first region)', () => {
    const snap = snapshot({
      userVms: [vm('Test_D8', 'Azure', 'East US 2'), vm('m7i.large', 'AWS', 'us-east-1')],
    });
    const patch = prepareSnapshotHydrate(snap, initialState);
    expect(patch.ui!.activeRegion!.Azure).toBe('East US 2');
    expect(patch.ui!.activeRegion!.AWS).toBe('us-east-1');
  });

  it('clears the stale pre-load result, selections, and scope', () => {
    const staleResult = { vmsPlaced: 999 } as unknown as SimulatorResult;
    const state: AppState = {
      ...initialState,
      result: staleResult,
      selectedNodeIds: ['f-1:R1N1'],
      ui: { ...initialState.ui, scope: { kind: 'zone', key: 'Zone 1' } },
    };
    const patch = prepareSnapshotHydrate(snapshot({}), state);
    expect(patch.result).toBeNull();
    expect(patch.selectedNodeIds).toEqual([]);
    expect(patch.ui!.scope).toBeNull();
  });

  it('preserves the rest of the ui (theme, appMode, tab) untouched', () => {
    const state: AppState = {
      ...initialState,
      ui: { ...initialState.ui, theme: 'light', appMode: 'advanced', activeSidebarTab: 'fleet' },
    };
    const patch = prepareSnapshotHydrate(snapshot({}), state);
    expect(patch.ui!.theme).toBe('light');
    expect(patch.ui!.appMode).toBe('advanced');
    expect(patch.ui!.activeSidebarTab).toBe('fleet');
  });
});

describe('isDemoFleet', () => {
  it('matches exactly the demo hardware signature', () => {
    expect(
      isDemoFleet({ userHardware: [hw('2s', 'Azure'), hw('8s', 'Azure'), hw('v1-2s-old', 'Azure')] }),
    ).toBe(true);
    // Any edit (extra or missing group) breaks the signature.
    expect(isDemoFleet({ userHardware: [hw('2s', 'Azure'), hw('8s', 'Azure')] })).toBe(false);
    expect(
      isDemoFleet({
        userHardware: [hw('2s', 'Azure'), hw('8s', 'Azure'), hw('v1-2s-old', 'Azure'), hw('mine', 'Azure')],
      }),
    ).toBe(false);
  });
});

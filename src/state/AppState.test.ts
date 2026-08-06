/**
 * v2.19.50+ — Reducer coverage for the mass-delete + undo path on Placed
 * Clusters. Specifically targets `FLEET_REMOVE_ALL` and the matching
 * `FLEET_RESTORE_ALL` undo action introduced for FB-1.
 *
 * Invariants under test:
 *  - FLEET_REMOVE_ALL drops every placed fleet + clears fleetOrder.
 *  - Hardware Library (userHardware) is untouched.
 *  - Authored regions (fleetRegions) are untouched.
 *  - The action is idempotent when no fleets are placed.
 *  - FLEET_RESTORE_ALL roundtrips fleets + fleetOrder atomically so the
 *    pre-clear order survives an Undo.
 */
import { describe, expect, it } from 'vitest';
import {
  initialState,
  reducer,
  defaultFleet,
  type AppState,
  type FleetRegion,
} from './AppState';
import type { FleetSpec, HardwareGroup } from '../types';

const hwA: HardwareGroup = {
  id: 'hw-a',
  name: 'Hw A',
  memoryGibPerNode: 512,
  nodesPerRack: 4,
  socketsPerNode: 2,
  coresPerSocket: 24,
  hyperthreadingEnabled: true,
  vcpusPerNode: 96,
  isolated: false,
  processor: 'Test-A',
  rackComposition: undefined,
  rackLayout: 'Homogeneous',
} as unknown as HardwareGroup;

const region: FleetRegion = { region: 'East US 2', zones: ['Zone 1', 'Zone 2'] };

const fleetA: FleetSpec = {
  ...defaultFleet,
  hardwareGroupId: 'hw-a',
  hardwareGroupName: 'Hw A',
  rackCount: 2,
  region: 'East US 2',
  zone: 'Zone 1',
  memoryGibPerNode: 512,
  nodesPerRack: 4,
  socketsPerNode: 2,
  coresPerSocket: 24,
};

const fleetB: FleetSpec = {
  ...fleetA,
  zone: 'Zone 2',
  rackCount: 3,
};

function seededState(): AppState {
  return {
    ...initialState,
    fleets: { 'f-1': fleetA, 'f-2': fleetB },
    fleetOrder: ['f-1', 'f-2'],
    userHardware: [hwA],
    fleetRegions: [region],
  };
}

describe('FLEET_REMOVE_ALL', () => {
  it('drops every placed fleet + clears fleetOrder', () => {
    const next = reducer(seededState(), { type: 'FLEET_REMOVE_ALL' });
    expect(next.fleets).toEqual({});
    expect(next.fleetOrder).toEqual([]);
  });

  it('leaves userHardware (Hardware Library) intact', () => {
    const start = seededState();
    const next = reducer(start, { type: 'FLEET_REMOVE_ALL' });
    expect(next.userHardware).toBe(start.userHardware);
    expect(next.userHardware).toHaveLength(1);
    expect(next.userHardware[0].id).toBe('hw-a');
  });

  it('leaves fleetRegions (authored regions/zones) intact', () => {
    const start = seededState();
    const next = reducer(start, { type: 'FLEET_REMOVE_ALL' });
    expect(next.fleetRegions).toBe(start.fleetRegions);
    expect(next.fleetRegions).toEqual([region]);
  });

  it('marks the run stale so the Run Footer prompts a re-run', () => {
    const next = reducer(seededState(), { type: 'FLEET_REMOVE_ALL' });
    expect(next.isStale).toBe(true);
  });

  it('is a no-op when no fleets are placed', () => {
    const start: AppState = {
      ...initialState,
      fleets: {},
      fleetOrder: [],
    };
    const next = reducer(start, { type: 'FLEET_REMOVE_ALL' });
    expect(next).toBe(start);
  });
});

describe('FLEET_RESTORE_ALL', () => {
  it('round-trips fleets + fleetOrder after a clear (undo path)', () => {
    const start = seededState();
    const cleared = reducer(start, { type: 'FLEET_REMOVE_ALL' });
    const restored = reducer(cleared, {
      type: 'FLEET_RESTORE_ALL',
      fleets: start.fleets,
      fleetOrder: start.fleetOrder,
    });
    expect(restored.fleets).toEqual(start.fleets);
    expect(restored.fleetOrder).toEqual(start.fleetOrder);
  });

  it('preserves pre-clear fleetOrder exactly', () => {
    const start = seededState();
    const cleared = reducer(start, { type: 'FLEET_REMOVE_ALL' });
    const restored = reducer(cleared, {
      type: 'FLEET_RESTORE_ALL',
      fleets: start.fleets,
      fleetOrder: ['f-2', 'f-1'], // verify order is honored verbatim
    });
    expect(restored.fleetOrder).toEqual(['f-2', 'f-1']);
  });
});

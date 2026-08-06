/**
 * v2.19.52 — Walkthrough round-trip acceptance test.
 *
 * Loads the bundled walkthrough fixture
 * (`src/test-fixtures/walkthrough-2026-06-05.json`) through `parseSnapshotJson`
 * — the same code path that Save/Load → "Load walkthrough" and "Import from
 * file" both use — then asserts every persisted slice survives byte-for-byte.
 *
 * Why this matters: any silent drop in the load path (a new field added
 * since schema-v1 was written, a typo in HYDRATE, fungibility cells
 * filtered out, fleetRegions forgotten) means the user reloads a snapshot
 * and gets a state that *looks* right but mis-runs the engine. This test
 * is the acceptance gate for every other fix that depends on the fixture.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseSnapshotJson, type FleetSnapshot } from './saveLoad';

const FIXTURE_PATH = resolve(
  __dirname,
  '..',
  'test-fixtures',
  'walkthrough-2026-06-05.json',
);

function loadFixture(): { raw: string; fixture: FleetSnapshot } {
  const raw = readFileSync(FIXTURE_PATH, 'utf-8');
  const fixture = JSON.parse(raw) as FleetSnapshot;
  return { raw, fixture };
}

describe('walkthrough fixture round-trip', () => {
  it('parses without error and returns the snapshot wrapper intact', () => {
    const { raw, fixture } = loadFixture();
    const result = parseSnapshotJson(raw);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.snapshot).toBeDefined();
    const parsed = result.snapshot!;
    expect(parsed.kind).toBe('capacity-simulator-snapshot');
    expect(parsed.schemaVersion).toBe(fixture.schemaVersion);
    expect(parsed.appVersion).toBe(fixture.appVersion);
    expect(parsed.exportedAt).toBe(fixture.exportedAt);
  });

  it('preserves every BoM row (qty, deploymentType, zones)', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.bom).toBeDefined();
    expect(parsed.data.bom).toEqual(fixture.data.bom);
    // Spot-check the canonical zonal layout — fixture is intentionally
    // shaped with one BoM row per zone so this test catches a parser that
    // collapses (vmSizeName, deploymentType) without the zones key.
    expect(parsed.data.bom!.length).toBe(fixture.data.bom!.length);
    for (const row of parsed.data.bom!) {
      expect(row.vmSizeName).toBeTruthy();
      expect(typeof row.quantity).toBe('number');
      expect(['regional', 'zonal']).toContain(row.deploymentType);
    }
  });

  it('preserves every fleet entry verbatim', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.fleets).toEqual(fixture.data.fleets);
    expect(parsed.data.fleetOrder).toEqual(fixture.data.fleetOrder);
    // Per-fleet field-level checks — these are the load-bearing fields the
    // engine + buffer math + finance roll-up all read off of. Drop any one
    // and downstream tabs silently mis-render.
    for (const id of fixture.data.fleetOrder!) {
      const a = parsed.data.fleets![id];
      const b = fixture.data.fleets![id];
      expect(a.hardwareGroupId).toBe(b.hardwareGroupId);
      expect(a.hardwareGroupName).toBe(b.hardwareGroupName);
      expect(a.rackCount).toBe(b.rackCount);
      expect(a.region).toBe(b.region);
      expect(a.zone).toBe(b.zone);
      expect(a.memoryGibPerNode).toBe(b.memoryGibPerNode);
      expect(a.rackComposition).toEqual(b.rackComposition);
      expect(a.bufferDefault).toEqual(b.bufferDefault);
      expect(a.bufferByMemGib).toEqual(b.bufferByMemGib);
      expect(a.bufferAcknowledged).toEqual(b.bufferAcknowledged);
    }
  });

  it('preserves every fleetRegion and its zones', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.fleetRegions).toEqual(fixture.data.fleetRegions);
    expect(parsed.data.fleetRegions!.length).toBe(fixture.data.fleetRegions!.length);
    for (let i = 0; i < fixture.data.fleetRegions!.length; i++) {
      expect(parsed.data.fleetRegions![i].region).toBe(fixture.data.fleetRegions![i].region);
      expect(parsed.data.fleetRegions![i].zones).toEqual(fixture.data.fleetRegions![i].zones);
    }
  });

  it('preserves every userHardware spec field', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.userHardware).toEqual(fixture.data.userHardware);
    expect(parsed.data.userHardware!.length).toBe(fixture.data.userHardware!.length);
    for (const hw of parsed.data.userHardware!) {
      const ref = fixture.data.userHardware!.find((h) => h.id === hw.id)!;
      expect(hw.name).toBe(ref.name);
      expect(hw.provider).toBe(ref.provider);
      expect(hw.memoryGibPerNode).toBe(ref.memoryGibPerNode);
      expect(hw.socketsPerNode).toBe(ref.socketsPerNode);
      expect(hw.coresPerSocket).toBe(ref.coresPerSocket);
      expect(hw.vcpusPerNode).toBe(ref.vcpusPerNode);
      expect(hw.nodesPerRack).toBe(ref.nodesPerRack);
      expect(hw.rackComposition).toEqual(ref.rackComposition);
      expect(hw.costPerRackUsd).toBe(ref.costPerRackUsd);
      expect(hw.costPerNodeUsd).toBe(ref.costPerNodeUsd);
      expect(hw.usableLifeMonths).toBe(ref.usableLifeMonths);
      expect(hw.networkMbpsPerNode).toBe(ref.networkMbpsPerNode);
      expect(hw.storageThroughputMbpsPerNode).toBe(ref.storageThroughputMbpsPerNode);
      expect(hw.homeFor).toEqual(ref.homeFor);
      expect(hw.spilloverFrom).toEqual(ref.spilloverFrom);
    }
  });

  it('preserves the userFungibility matrix (every key + every cell)', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.userFungibility).toEqual(fixture.data.userFungibility);
    const refKeys = Object.keys(fixture.data.userFungibility!).sort();
    const gotKeys = Object.keys(parsed.data.userFungibility!).sort();
    expect(gotKeys).toEqual(refKeys);
    // Cell-level sanity — flag if anything got coerced (e.g. 'blocked' →
    // 0, or number → string) between disk and the parsed object.
    for (const vmKey of refKeys) {
      const refRow = fixture.data.userFungibility![vmKey];
      const gotRow = parsed.data.userFungibility![vmKey];
      expect(Object.keys(gotRow).sort()).toEqual(Object.keys(refRow).sort());
      for (const hwId of Object.keys(refRow)) {
        expect(gotRow[hwId]).toBe(refRow[hwId]);
      }
    }
  });

  it('preserves userCpus, userEquivalency, userVms, buffer, packingMode, fungibilityOn', () => {
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    expect(parsed.data.userCpus).toEqual(fixture.data.userCpus);
    expect(parsed.data.userEquivalency).toEqual(fixture.data.userEquivalency);
    // userVms is the biggest slice (~40k rows in this fixture); just
    // sample structural shape + count to keep the assertion cheap.
    expect(parsed.data.userVms!.length).toBe(fixture.data.userVms!.length);
    expect(parsed.data.userVms![0]).toEqual(fixture.data.userVms![0]);
    expect(parsed.data.userVms![fixture.data.userVms!.length - 1]).toEqual(
      fixture.data.userVms![fixture.data.userVms!.length - 1],
    );
    expect(parsed.data.buffer).toEqual(fixture.data.buffer);
    expect(parsed.data.packingMode).toBe(fixture.data.packingMode);
    expect(parsed.data.fungibilityOn).toBe(fixture.data.fungibilityOn);
  });

  it('covers every persisted slice the snapshot ships', () => {
    // Belt-and-suspenders: if a future schema bump adds a new slice, this
    // assertion fails until the test above is updated. Keeps the round-trip
    // surface honest as the snapshot schema evolves.
    const { raw, fixture } = loadFixture();
    const parsed = parseSnapshotJson(raw).snapshot!;
    const refKeys = Object.keys(fixture.data).sort();
    const gotKeys = Object.keys(parsed.data).sort();
    expect(gotKeys).toEqual(refKeys);
  });
});

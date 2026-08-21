/**
 * Multi-cluster orchestration tests for `runMulti` — v2.4.2 iterative
 * spillover-when-full behaviour.
 *
 * The single-cluster engine is already covered by `src/engine/simulator.test.ts`.
 * These tests exercise the claim phase cascade across multiple clusters when
 * a fungibility matrix is in play, verifying:
 *   (a) Home full → Spill-1 absorbs.
 *   (b) Home + Spill-1 full → Spill-2 absorbs.
 *   (c) All tiers full → top-level unplaceable, NOT silently swallowed.
 *   (d) Blocked cells never receive even when other tiers are full.
 *   (e) Matrix-less fallback (custom/manual fleets) still works.
 *   (f) SpilloverEvent records correctly label fromGroup / toGroup.
 */
import { describe, expect, it } from 'vitest';
import { runMulti } from './RunFooter';
import type { BomEntry, BufferSpec, CatalogEntry, FleetSpec } from '../types';

// ── Fixtures ─────────────────────────────────────────────────────────────

const buffer: BufferSpec = { mode: 'pct', value: 0 }; // no buffer = full capacity

const catalog: CatalogEntry[] = [
  // Two M-series sizes — small enough that we can pack a known integer count.
  {
    vmSizeName: 'Test_M_small',
    vmGeneration: 'Mv3',
    series: 'M-Series',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'Gen-A MM',
    spilloverTarget: 'N/A',
    processor: 'Intel',
    vcpus: 16,
    memoryGib: 256,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
  },
  {
    vmSizeName: 'Test_E_small',
    vmGeneration: 'Ev5',
    series: 'E-Series',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'Gen-A MM',
    spilloverTarget: 'N/A',
    processor: 'Intel',
    vcpus: 8,
    memoryGib: 128,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
  },
];

/** Cluster with 1 rack × 4 nodes × 1024 GiB × 64 vCPU = 4096 GiB / 256 vCPU
 *  total capacity. Sized so that a handful of `Test_M_small` (256 GiB each)
 *  saturate it predictably. */
function makeFleet(
  id: string,
  groupName: string,
  nodes: number = 4,
  memPerNode: number = 1024,
): FleetSpec {
  return {
    hardwareGroupName: groupName,
    hardwareGroupId: id,
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: nodes,
    socketsPerNode: 2,
    coresPerSocket: 16,
    hyperthreadingEnabled: true,
    memoryGibPerNode: memPerNode,
    throughputCeilingMbps: null,
    isolated: false,
    processor: 'Intel',
  };
}

const vmClassByName = {
  Test_M_small: 'M',
  Test_E_small: 'E',
};

/** Compact matrix builder — `M` to home/spill-1/spill-2 across three HW IDs. */
function matrix(
  vm: string,
  spec: Record<string, number | 'blocked'>,
): Record<string, Record<string, number | 'blocked'>> {
  return { [vm]: spec };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('runMulti — iterative spillover-when-full (v2.4.2)', () => {
  it('(a) Home full → Spill-1 absorbs the overflow', () => {
    // Home cluster fits 4 × 256 GiB = 1024 GiB on 4 × 1024 GiB nodes. A 5th
    // 256-GiB VM would not fit Home but Spill-1 has plenty of room.
    // Actually: 4 nodes × 1024 GiB = 4096 GiB / 16 VMs at 256 GiB each.
    // To force overflow we use a small Home cluster (1 node) and 3 VMs.
    const home = makeFleet('hw-home', 'Gen-A MM Home', /*nodes*/ 1, 1024);
    const spill = makeFleet('hw-spill', 'Gen-A MM Spill', /*nodes*/ 4, 1024);
    const bom: BomEntry[] = [
      { vmSizeName: 'Test_M_small', quantity: 1 }, // 256 GiB
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 }, // 5th — overflow
    ];
    const fung = matrix('M', { 'hw-home': 0, 'hw-spill': 1 });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-spill', fleet: spill },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    // All 5 should be placed (Home: 4, Spill: 1) — none unplaceable.
    expect(result.vmsPlaced).toBe(5);
    expect(result.vmsUnplaceable).toHaveLength(0);
    // Exactly one spillover event captured (one VM crossed the home boundary).
    expect(result.spilloverEvents).toHaveLength(1);
    expect(result.spilloverEvents[0]).toMatchObject({
      vmSizeName: 'Test_M_small',
      fromGroup: 'Gen-A MM Home',
      toGroup: 'Gen-A MM Spill',
      count: 1,
    });
  });

  it('(b) Home + Spill-1 both full → Spill-2 absorbs', () => {
    const home = makeFleet('hw-home', 'Home', 1, 1024); // 4 VMs
    const s1 = makeFleet('hw-s1', 'Spill-1', 1, 1024); // 4 VMs
    const s2 = makeFleet('hw-s2', 'Spill-2', 4, 1024); // 16 VMs
    // 4 home + 4 s1 + 1 overflow = 9 total VMs.
    const bom: BomEntry[] = Array.from({ length: 9 }, () => ({
      vmSizeName: 'Test_M_small',
      quantity: 1,
    }));
    const fung = matrix('M', { 'hw-home': 0, 'hw-s1': 1, 'hw-s2': 2 });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-s1', fleet: s1 },
        { id: 'c-s2', fleet: s2 },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(9);
    expect(result.vmsUnplaceable).toHaveLength(0);
    // 4 went to s1 (tier 1) and 1 went to s2 (tier 2). Spill events are
    // aggregated by (size, from, to) so we expect two distinct rows.
    const events = result.spilloverEvents.sort((a, b) =>
      a.toGroup.localeCompare(b.toGroup),
    );
    expect(events).toHaveLength(2);
    expect(events[0].toGroup).toBe('Spill-1');
    expect(events[0].count).toBe(4);
    expect(events[1].toGroup).toBe('Spill-2');
    expect(events[1].count).toBe(1);
  });

  it('(c) all tiers full → unplaceable, not silently dropped', () => {
    // Two tiny clusters; BOM exceeds combined sum capacity.
    const home = makeFleet('hw-home', 'Home', 1, 256); // 1 VM
    const spill = makeFleet('hw-spill', 'Spill', 1, 256); // 1 VM
    const bom: BomEntry[] = [
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 }, // 3rd — exceeds both
    ];
    const fung = matrix('M', { 'hw-home': 0, 'hw-spill': 1 });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-spill', fleet: spill },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(2);
    expect(result.vmsUnplaceable).toHaveLength(1);
    expect(result.vmsUnplaceable[0].count).toBe(1);
    expect(result.vmsUnplaceable[0].vmSizeName).toBe('Test_M_small');
  });

  it('(d) Blocked cell never absorbs, even when other tiers are full', () => {
    const home = makeFleet('hw-home', 'Home', 1, 256); // 1 VM
    const blocked = makeFleet('hw-blocked', 'Blocked', 4, 1024); // 16 VMs (plenty)
    const bom: BomEntry[] = [
      { vmSizeName: 'Test_M_small', quantity: 1 },
      { vmSizeName: 'Test_M_small', quantity: 1 }, // overflow — but blocked cluster must refuse
    ];
    const fung = matrix('M', { 'hw-home': 0, 'hw-blocked': 'blocked' });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-blocked', fleet: blocked },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    // 1 placed at home, 1 unplaceable (blocked cluster refused despite room).
    expect(result.vmsPlaced).toBe(1);
    expect(result.vmsUnplaceable).toHaveLength(1);
    // No spillover should have been emitted — nothing legitimately spilled.
    expect(result.spilloverEvents).toHaveLength(0);
  });

  it('(e) matrix-less fallback — legacy first-acceptor still works', () => {
    // No matrix provided — fallback to fleet.homeFor / spilloverFrom check.
    const fleet1 = makeFleet('hw-1', 'Gen-A MM');
    fleet1.homeFor = ['Mv3'];
    const fleet2 = makeFleet('hw-2', 'Gen-Legacy HM');
    fleet2.homeFor = ['Mv1'];
    const bom: BomEntry[] = [{ vmSizeName: 'Test_M_small', quantity: 1 }];

    const result = runMulti(
      [
        { id: 'c-1', fleet: fleet1 },
        { id: 'c-2', fleet: fleet2 },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      undefined, // no matrix
      undefined,
    );

    expect(result.vmsPlaced).toBe(1);
    // No spillover events on the legacy path.
    expect(result.spilloverEvents).toHaveLength(0);
  });

  it('(g) two Home clusters — VM tries both before advancing to Spill-1', () => {
    // Two clusters both priority 0 (Home) + one priority 1 (Spill). Behavior
    // the user explicitly confirmed: a VM should walk every Home cluster
    // before falling to the Spill tier. No spillover event when an
    // alternate Home absorbs the overflow.
    //
    // BOM = 6 VMs × 256 GiB = 1536 GiB. Each Home holds 1024 GiB → 4 VMs.
    // Expected: 4 → home-a, 2 → home-b, 0 → spill. ZERO spillover events.
    const homeA = makeFleet('hw-home-a', 'Home A', 1, 1024);
    const homeB = makeFleet('hw-home-b', 'Home B', 1, 1024);
    const spill = makeFleet('hw-spill', 'Spill', 4, 1024);
    const bom: BomEntry[] = Array.from({ length: 6 }, () => ({
      vmSizeName: 'Test_M_small',
      quantity: 1,
    }));
    // Both Home A and Home B sit at priority 0. Spill at priority 1.
    const fung = matrix('M', { 'hw-home-a': 0, 'hw-home-b': 0, 'hw-spill': 1 });

    const result = runMulti(
      [
        { id: 'c-a', fleet: homeA },
        { id: 'c-b', fleet: homeB },
        { id: 'c-spill', fleet: spill },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(6);
    expect(result.vmsUnplaceable).toHaveLength(0);
    // CRITICAL: nothing should have spilled to the priority-1 cluster while
    // a sibling Home still had room.
    expect(result.spilloverEvents).toHaveLength(0);
    // Sanity: the spill cluster should be empty.
    const spillNodes = result.nodeDetail.filter((n) => n.clusterId === 'c-spill');
    const placedOnSpill = spillNodes.reduce((s, n) => s + n.vmsPlaced.length, 0);
    expect(placedOnSpill).toBe(0);
  });

  it('(h) both Home clusters full → THEN Spill-1 absorbs', () => {
    // Extension of (g): now overflow both Homes. Spill-1 should pick up
    // the remainder, and we DO want a spillover event this time because the
    // VM genuinely crossed the tier boundary.
    //
    // BOM = 9 VMs × 256 GiB = 2304 GiB. 4 → home-a, 4 → home-b, 1 → spill.
    const homeA = makeFleet('hw-home-a', 'Home A', 1, 1024);
    const homeB = makeFleet('hw-home-b', 'Home B', 1, 1024);
    const spill = makeFleet('hw-spill', 'Spill', 4, 1024);
    const bom: BomEntry[] = Array.from({ length: 9 }, () => ({
      vmSizeName: 'Test_M_small',
      quantity: 1,
    }));
    const fung = matrix('M', { 'hw-home-a': 0, 'hw-home-b': 0, 'hw-spill': 1 });

    const result = runMulti(
      [
        { id: 'c-a', fleet: homeA },
        { id: 'c-b', fleet: homeB },
        { id: 'c-spill', fleet: spill },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(9);
    expect(result.vmsUnplaceable).toHaveLength(0);
    // Exactly one spillover row (count=1). The `fromGroup` label is the
    // first Home cluster encountered in insertion order (Home A), a
    // documented convention since multiple Homes are valid for the same
    // class.
    expect(result.spilloverEvents).toHaveLength(1);
    expect(result.spilloverEvents[0]).toMatchObject({
      vmSizeName: 'Test_M_small',
      fromGroup: 'Home A',
      toGroup: 'Spill',
      count: 1,
    });
  });

  it('(p0-spillover) partial-admission cascade — sub-claim larger than any single tier still places what fits', () => {
    // v2.19.51 regression test for the walkthrough P0 bug.
    //
    // Setup: 5 VMs at 256 GiB / 16 vCPU each → 1,280 GiB / 80 vCPU total.
    // - Home cluster (tier 0): 1 node × 256 GiB → holds 1 VM.
    // - Spill cluster (tier 1): 1 node × 1024 GiB → holds 4 VMs.
    //
    // Bug (pre-fix): the claim phase required 100% of the sub-claim's qty
    //   (5) to fit in a single tier's summed capacity. Neither tier had 1,280
    //   GiB of summed headroom, so the WHOLE row was tagged
    //   OVERFLOWED_ALL_TIERS → 0 placed, 5 unplaceable. Tier-0 was wrongly
    //   bypassed even though it could have held 1, and tier-1 was bypassed
    //   even though it could have held 4.
    //
    // Fix: at each tier, admit as many VMs as fit; cascade the residual to
    //   the next tier. Expected → 5 placed, 0 unplaceable, 4 spillover.
    const home = makeFleet('hw-home', 'Home', 1, 256); // sum cap = 256 GiB → 1 VM
    const spill = makeFleet('hw-spill', 'Spill', 1, 1024); // sum cap = 1024 GiB → 4 VMs
    const bom: BomEntry[] = [{ vmSizeName: 'Test_M_small', quantity: 5 }];
    const fung = matrix('M', { 'hw-home': 0, 'hw-spill': 1 });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-spill', fleet: spill },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(5);
    expect(result.vmsUnplaceable).toHaveLength(0);
    // 4 VMs crossed from Home → Spill.
    expect(result.spilloverEvents).toHaveLength(1);
    expect(result.spilloverEvents[0]).toMatchObject({
      vmSizeName: 'Test_M_small',
      fromGroup: 'Home',
      toGroup: 'Spill',
      count: 4,
    });
  });

  it('(p0-priority) tier-first ordering — tier-0 sub-claim never starved by an earlier tier-1 sub-claim', () => {
    // v2.19.51 regression test #2. The legacy claim loop processed
    // sub-claims in BoM order; a row whose Home is cluster X would lose
    // capacity at X if an earlier-listed row that *spills* to X had already
    // greedily consumed it. The user's walkthrough hit this: M192ims_v2
    // (tier 1 = 2s) appeared first in the BoM, exhausted 2s, and M96s_2_v3
    // (tier 0 = 2s) couldn't land.
    //
    // Setup: cluster `shared` is Home for `Test_E_small` and Spill for
    // `Test_M_small`. BoM lists M first (would consume `shared` at tier 1),
    // then E (would be starved at tier 0).
    //
    // Pre-fix: order-of-row wins → all M to `shared`, E unplaceable.
    // Post-fix: tier-0 wins → E claims `shared` first, M cascades to its
    //           own Home (`m-home`).
    const shared = makeFleet('hw-shared', 'Shared', 1, 1024); // 4 VMs of 256 GiB
    const mHome = makeFleet('hw-m-home', 'M Home', 1, 1024); // 4 VMs
    const bom: BomEntry[] = [
      { vmSizeName: 'Test_M_small', quantity: 4 }, // 4 × 256 = 1024 GiB
      { vmSizeName: 'Test_E_small', quantity: 4 }, // 4 × 128 = 512 GiB
    ];
    const fung = {
      M: { 'hw-shared': 1, 'hw-m-home': 0 },
      E: { 'hw-shared': 0 }, // E only routes to shared
    };

    const result = runMulti(
      [
        { id: 'c-shared', fleet: shared },
        { id: 'c-m-home', fleet: mHome },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    expect(result.vmsPlaced).toBe(8);
    expect(result.vmsUnplaceable).toHaveLength(0);
  });

  it('(f) SpilloverEvents aggregate by (size, from, to)', () => {
    // 6 M VMs into a Home that fits 4, with Spill-1 mopping up 2.
    const home = makeFleet('hw-home', 'Home', 1, 1024);
    const s1 = makeFleet('hw-s1', 'Spill', 4, 1024);
    const bom: BomEntry[] = Array.from({ length: 6 }, () => ({
      vmSizeName: 'Test_M_small',
      quantity: 1,
    }));
    const fung = matrix('M', { 'hw-home': 0, 'hw-s1': 1 });

    const result = runMulti(
      [
        { id: 'c-home', fleet: home },
        { id: 'c-s1', fleet: s1 },
      ],
      bom,
      buffer,
      'SMART',
      true,
      catalog,
      fung,
      vmClassByName,
    );

    // 4 home + 2 spill = 6 placed. One spillover row aggregating count=2.
    expect(result.vmsPlaced).toBe(6);
    expect(result.spilloverEvents).toHaveLength(1);
    expect(result.spilloverEvents[0].count).toBe(2);
  });
});

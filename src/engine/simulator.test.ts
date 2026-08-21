/**
 * Engine acceptance tests — PRD §10 Scenarios A/B/C + §11.2 E-001 through E-007.
 *
 * These are non-negotiable: an engine that fails any of A/B/C has a bug
 * and must not ship (PRD §10).
 */
import { describe, expect, it } from 'vitest';
import { runSimulation } from './simulator';
import type { CatalogEntry, FleetSpec, SimulatorInput } from '../types';

// ── Minimal catalog covering all VMs used by the test scenarios ──────────
const catalog: CatalogEntry[] = [
  catalogEntry('Standard_M96s_1_v3', 'Mv3', 'Medium Memory (MM)', 96, 974),
  catalogEntry('Standard_M48s_1_v3', 'Mv3', 'Medium Memory (MM)', 48, 974),
  catalogEntry('Standard_M24s_v3', 'Mv3', 'Medium Memory (MM)', 24, 480),
  catalogEntry('Standard_M12s_v3', 'Mv3', 'Medium Memory (MM)', 12, 240),
  catalogEntry('Standard_M8ms', 'Mv1', 'Medium Memory (MM)', 8, 218.75),
  catalogEntry('Standard_M32ts', 'Mv1', 'Medium Memory (MM)', 32, 192),
  catalogEntry('Standard_M16ms', 'Mv1', 'Medium Memory (MM)', 16, 437.5),
  catalogEntry('Standard_M832is_16_v3', 'Mv3', 'High Memory (HM)', 832, 15200),
  catalogEntry('Standard_M896ixds_24_v3', 'Mv3', 'Very High Memory (VHM)', 896, 23088),
];

function catalogEntry(
  name: string,
  gen: CatalogEntry['vmGeneration'],
  cat: CatalogEntry['memoryCategory'],
  vcpus: number,
  memoryGib: number,
): CatalogEntry {
  return {
    vmSizeName: name,
    vmGeneration: gen,
    series: 'M-Series',
    memoryCategory: cat,
    homeHardwareGroup: 'Gen-A MM-Std',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon 4th Gen Scalable',
    vcpus,
    memoryGib,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'Generally Available',
    notes: '',
  };
}

// PRD §10 scenarios test per-node packing — fleet collapses to 1 Gen-A MM node
// (4096 GiB, 208 vCPU). Multi-node behaviour is exercised by other tests.
const genAMmFleet: FleetSpec = {
  hardwareGroupName: 'Gen-A MM-Std',
  memoryCategory: 'mm',
  rackCount: 1,
  nodesPerRack: 1,
  socketsPerNode: 2,
  coresPerSocket: 52,
  hyperthreadingEnabled: true,
  memoryGibPerNode: 4096,
  throughputCeilingMbps: null,
  isolated: false,
  processor: 'Intel Xeon 4th Gen Scalable',
};

function makeInput(over: Partial<SimulatorInput>): SimulatorInput {
  return {
    fleet: genAMmFleet,
    buffer: { mode: 'pct', value: 0 },
    bom: [],
    catalog,
    packingMode: 'SMART',
    fungibilityOn: true,
    ...over,
  };
}

// ────────────────────────────────────────────────────────────────────────
// SCENARIO A — vCPU binding, memory strands
// 3× M96s_1_v3 (96 vCPU, 974 GiB) on a Gen-A MM node (4096 GiB, 208 vCPU).
// Expected: 2 placed, 1 blocked, 2,148 GiB stranded, 16 vCPU stranded.
// ────────────────────────────────────────────────────────────────────────
describe('Scenario A — PRD §10.1 (E-001)', () => {
  const result = runSimulation(
    makeInput({ bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 3 }] }),
  );

  it('places exactly 2 VMs', () => {
    expect(result.vmsPlaced).toBe(2);
  });
  it('flags 1 unplaceable with VCPU reason', () => {
    expect(result.vmsUnplaceable).toHaveLength(1);
    expect(result.vmsUnplaceable[0].count).toBe(1);
    expect(result.vmsUnplaceable[0].blockingReason).toBe('VCPU');
  });
  it('consumes exactly 1 node', () => {
    expect(result.nodesConsumed).toBe(1);
  });
  it('strands 2,148 GiB memory', () => {
    expect(result.strandedMemoryGib).toBe(2148);
  });
  it('strands 16 vCPU', () => {
    expect(result.strandedVcpus).toBe(16);
  });
  it('node binding constraint is VCPU; v2.17 flips state to FULL when no BOM SKU fits the sliver', () => {
    const occupied = result.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
    expect(occupied).toHaveLength(1);
    expect(occupied[0].bindingConstraint).toBe('VCPU');
    // v2.17 semantic shift: when no remaining BOM VM can fit the leftover
    // capacity, the node is full for the user's workload — even though
    // memory still has 2,148 GiB headroom in raw terms.
    expect(occupied[0].state).toBe('occupied-full');
  });
});

// ────────────────────────────────────────────────────────────────────────
// SCENARIO B — Skip-and-Continue
// 7× M32ts then 1× M16ms. After 6× M32ts, only 16 vCPU left; M32ts #7 won't fit,
// skip it; M16ms (16 vCPU, 437.5 GiB) fits and is placed.
//
// Note: SMART mode sorts largest-first by memory, so M16ms (437.5 GiB) actually
// places BEFORE M32ts (192 GiB). To exercise true skip-and-continue we test
// in STRICT mode (preserve BOM order).
// Expected: 7 placed, stranded mem ≈ 2,506.5 GiB, stranded vCPU = 0.
// ────────────────────────────────────────────────────────────────────────
describe('Scenario B — PRD §10.2 (E-002)', () => {
  const result = runSimulation(
    makeInput({
      packingMode: 'STRICT',
      bom: [
        { vmSizeName: 'Standard_M32ts', quantity: 7 },
        { vmSizeName: 'Standard_M16ms', quantity: 1 },
      ],
    }),
  );

  it('places exactly 7 VMs', () => {
    expect(result.vmsPlaced).toBe(7);
  });
  it('strands 0 vCPU on the consumed node', () => {
    expect(result.strandedVcpus).toBe(0);
  });
  it('strands approximately 2,506.5 GiB memory', () => {
    expect(result.strandedMemoryGib).toBeCloseTo(2506.5, 1);
  });
  it('skip-and-continue: 1× M32ts marked unplaceable, M16ms placed', () => {
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M32ts');
    expect(blocked?.count).toBe(1);
  });
  it('binding constraint is VCPU', () => {
    const occupied = result.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
    expect(occupied[0].bindingConstraint).toBe('VCPU');
  });
});

// ────────────────────────────────────────────────────────────────────────
// SCENARIO C — Tetris pack (maximum utilization)
// 1× M96s_1_v3, 1× M48s_1_v3, 1× M24s_v3, 2× M12s_v3, 2× M8ms — 7 VMs total.
// Expected: 7 placed on 1 node, ~81.7% memory util, 750 GiB stranded, 0 vCPU stranded.
// ────────────────────────────────────────────────────────────────────────
describe('Scenario C — PRD §10.3 (E-003)', () => {
  const result = runSimulation(
    makeInput({
      bom: [
        { vmSizeName: 'Standard_M96s_1_v3', quantity: 1 },
        { vmSizeName: 'Standard_M48s_1_v3', quantity: 1 },
        { vmSizeName: 'Standard_M24s_v3', quantity: 1 },
        { vmSizeName: 'Standard_M12s_v3', quantity: 2 },
        { vmSizeName: 'Standard_M8ms', quantity: 2 },
      ],
    }),
  );

  it('places all 7 VMs', () => {
    expect(result.vmsPlaced).toBe(7);
    expect(result.vmsUnplaceable).toHaveLength(0);
  });
  it('consumes exactly 1 node', () => {
    expect(result.nodesConsumed).toBe(1);
  });
  it('strands 0 vCPU', () => {
    expect(result.strandedVcpus).toBe(0);
  });
  it('strands 750.5 GiB (allowed range 749.5-750.5)', () => {
    expect(result.strandedMemoryGib).toBeGreaterThanOrEqual(749);
    expect(result.strandedMemoryGib).toBeLessThanOrEqual(751);
  });
  it('memory utilization ~81.7%', () => {
    expect(result.memoryUtilizationPct).toBeGreaterThanOrEqual(81.5);
    expect(result.memoryUtilizationPct).toBeLessThanOrEqual(82.0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// E-004 — Empty BOM
// ────────────────────────────────────────────────────────────────────────
describe('E-004 — empty BOM', () => {
  const result = runSimulation(makeInput({ bom: [] }));
  it('places 0 VMs and consumes 0 nodes', () => {
    expect(result.vmsPlaced).toBe(0);
    expect(result.nodesConsumed).toBe(0);
  });
  it('strands nothing', () => {
    expect(result.strandedMemoryGib).toBe(0);
    expect(result.strandedVcpus).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// E-005 — 100% buffer reserve
// ────────────────────────────────────────────────────────────────────────
describe('E-005 — buffer exhausts deployable', () => {
  const result = runSimulation(
    makeInput({
      buffer: { mode: 'pct', value: 100 },
      bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 2 }],
    }),
  );
  it('flags deployment limited', () => {
    expect(result.deploymentLimited).toBe(true);
    expect(result.deploymentLimitReason).toBe('BUFFER_EXHAUSTED');
  });
  it('places no VMs', () => {
    expect(result.vmsPlaced).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────
// E-006 — VM not in catalog (skip + continue)
// ────────────────────────────────────────────────────────────────────────
describe('E-006 — unknown VM size', () => {
  const result = runSimulation(
    makeInput({
      bom: [
        { vmSizeName: 'Standard_NotARealVm', quantity: 1 },
        { vmSizeName: 'Standard_M24s_v3', quantity: 1 },
      ],
    }),
  );
  it('places the valid VM', () => {
    expect(result.vmsPlaced).toBe(1);
  });
  it('flags the unknown VM as VM_SIZE_NOT_FOUND', () => {
    const unknown = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_NotARealVm');
    expect(unknown?.blockingReason).toBe('VM_SIZE_NOT_FOUND');
    expect(unknown?.count).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────
// E-007 — VHM isolated: 2 VMs on 1 node → only 1 fits
// ────────────────────────────────────────────────────────────────────────
describe('E-007 — VHM isolated host', () => {
  const result = runSimulation({
    fleet: {
      ...genAMmFleet,
      hardwareGroupName: 'Gen-A VHM',
      memoryCategory: 'vhm',
      rackCount: 1,
      nodesPerRack: 1,
      socketsPerNode: 16,
      coresPerSocket: 56,
      memoryGibPerNode: 32768,
      isolated: true,
    },
    buffer: { mode: 'pct', value: 0 },
    bom: [{ vmSizeName: 'Standard_M896ixds_24_v3', quantity: 2 }],
    catalog,
    packingMode: 'SMART',
    fungibilityOn: true,
  });

  it('places exactly 1 VM (one per isolated node)', () => {
    expect(result.vmsPlaced).toBe(1);
  });
  it('flags the 2nd VM as ISOLATED_HOST', () => {
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M896ixds_24_v3');
    expect(blocked?.blockingReason).toBe('ISOLATED_HOST');
    expect(blocked?.count).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────
// E-extra — VM too big for any node (memory)
// ────────────────────────────────────────────────────────────────────────
describe('Oversized VM rejected with MEMORY reason', () => {
  const result = runSimulation(
    makeInput({
      bom: [{ vmSizeName: 'Standard_M832is_16_v3', quantity: 1 }], // 15200 GiB > 4096
    }),
  );
  it('is flagged MEMORY', () => {
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M832is_16_v3');
    expect(blocked?.blockingReason).toBe('MEMORY');
  });
});

// ────────────────────────────────────────────────────────────────────────
// Fungibility enforcement — homeFor / spilloverFrom from uploaded HW group.
// When the fleet has these fields and fungibility is ON, the engine refuses
// to place VMs whose generation isn't allowed; an entirely empty allow-set
// rejects every VM with NO_FUNGIBILITY_DEFINED to surface the missing
// template data.
// ────────────────────────────────────────────────────────────────────────
describe('Fungibility enforcement', () => {
  it('rejects every BOM VM when homeFor + spilloverFrom are both empty', () => {
    const result = runSimulation(
      makeInput({
        fleet: { ...genAMmFleet, homeFor: [], spilloverFrom: [] },
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 2 }],
      }),
    );
    expect(result.vmsPlaced).toBe(0);
    expect(result.nodesConsumed).toBe(0);
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M96s_1_v3');
    expect(blocked?.blockingReason).toBe('NO_FUNGIBILITY_DEFINED');
    expect(blocked?.count).toBe(2);
  });

  it('rejects only the wrong-generation VMs when allow-set is non-empty', () => {
    const result = runSimulation(
      makeInput({
        // Cluster homes Mv3; should reject Mv1, accept Mv3.
        fleet: { ...genAMmFleet, homeFor: ['Mv3'], spilloverFrom: [] },
        bom: [
          { vmSizeName: 'Standard_M24s_v3', quantity: 1 }, // Mv3 → ok
          { vmSizeName: 'Standard_M8ms', quantity: 1 },    // Mv1 → blocked
        ],
      }),
    );
    expect(result.vmsPlaced).toBe(1);
    const mv1 = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M8ms');
    expect(mv1?.blockingReason).toBe('NOT_FUNGIBLE_TO_HARDWARE');
    expect(mv1?.count).toBe(1);
  });

  it('honors spilloverFrom — Mv2 BOM placed on Mv3-home cluster that spills from Mv2', () => {
    // Mock catalog row for an Mv2 VM the standard catalog doesn't include.
    const result = runSimulation(
      makeInput({
        fleet: { ...genAMmFleet, homeFor: ['Mv3'], spilloverFrom: ['Mv1', 'Mv2'] },
        catalog: [...catalog, catalogEntry('Standard_M64m_v2', 'Mv2', 'Medium Memory (MM)', 64, 1024)],
        bom: [{ vmSizeName: 'Standard_M64m_v2', quantity: 1 }],
      }),
    );
    expect(result.vmsPlaced).toBe(1);
    expect(result.vmsUnplaceable).toEqual([]);
  });

  it('skips enforcement when fleet has no homeFor/spilloverFrom (custom/manual fleet)', () => {
    // Baseline genAMmFleet has neither field set — original Scenario A behavior
    // must keep working so the legacy path (and the existing 25 tests) stays green.
    const result = runSimulation(
      makeInput({ bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 1 }] }),
    );
    expect(result.vmsPlaced).toBe(1);
  });

  it('skips enforcement when fungibility toggle is OFF', () => {
    const result = runSimulation(
      makeInput({
        fleet: { ...genAMmFleet, homeFor: [], spilloverFrom: [] },
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 1 }],
        fungibilityOn: false,
      }),
    );
    expect(result.vmsPlaced).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────
// v2.4 — Fungibility matrix path. The matrix is keyed [vmClass][hwGroupId]
// and takes precedence over the legacy homeFor/spilloverFrom check. Covers
// the user-flagged Mv2-MM ≠ Mv2-HM case at the type level (different rows).
// ────────────────────────────────────────────────────────────────────────
describe('Fungibility matrix (v2.4)', () => {
  // Big-enough HM-class node so memory isn't the binding constraint in
  // these tests (we're exercising the matrix, not the packer).
  const mmFleet: FleetSpec = {
    ...genAMmFleet,
    hardwareGroupId: 'gen-a-mm-std',
    rackCount: 2,
    nodesPerRack: 4,
  };
  const hmFleet: FleetSpec = {
    ...genAMmFleet,
    hardwareGroupId: 'gen-b-hm-mixed',
    rackCount: 2,
    nodesPerRack: 4,
    memoryGibPerNode: 12288,
    coresPerSocket: 104,
  };

  it('empty matrix → no check (GCP-dedicated case "just works")', () => {
    const result = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 1 }],
        fungibilityMatrix: {},
        vmClassByName: { Standard_M96s_1_v3: 'Mv3-MM' },
      }),
    );
    expect(result.vmsPlaced).toBe(1);
  });

  it('matrix cell = 0 (Home) → VM placed', () => {
    const result = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 1 }],
        fungibilityMatrix: { 'Mv3-MM': { 'gen-a-mm-std': 0 } },
        vmClassByName: { Standard_M96s_1_v3: 'Mv3-MM' },
      }),
    );
    expect(result.vmsPlaced).toBe(1);
  });

  it('matrix cell = "blocked" → NOT_FUNGIBLE_TO_HARDWARE', () => {
    const result = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 2 }],
        fungibilityMatrix: { 'Mv3-MM': { 'gen-a-mm-std': 'blocked' } },
        vmClassByName: { Standard_M96s_1_v3: 'Mv3-MM' },
      }),
    );
    expect(result.vmsPlaced).toBe(0);
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M96s_1_v3');
    expect(blocked?.blockingReason).toBe('NOT_FUNGIBLE_TO_HARDWARE');
    expect(blocked?.count).toBe(2);
  });

  it('matrix cell missing (non-empty matrix) → NOT_AUTHORED', () => {
    const result = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 3 }],
        // Matrix has SOME entries (so it counts as authored), but not for
        // this specific (vmClass, hwGroupId) pair.
        fungibilityMatrix: { 'Mv1-MM': { 'gen-a-mm-std': 0 } },
        vmClassByName: { Standard_M96s_1_v3: 'Mv3-MM' },
      }),
    );
    expect(result.vmsPlaced).toBe(0);
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M96s_1_v3');
    expect(blocked?.blockingReason).toBe('NOT_AUTHORED');
    expect(blocked?.count).toBe(3);
  });

  it('Mv2-MM ≠ Mv2-HM — same generation routes to different HW per matrix', () => {
    // The user-flagged case: Mv2 MM VMs go to MM hardware, Mv2 HM VMs go to
    // HM hardware. With vmGeneration alone (v2.3) they collide; the matrix
    // keys on (gen-memCat) so they're independent.
    // ── Mv2-MM on MM cluster: matrix says Home ✓
    const mmResult = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M32ts', quantity: 1 }],
        fungibilityMatrix: {
          'Mv2-MM': { 'gen-a-mm-std': 0, 'gen-b-hm-mixed': 'blocked' },
          'Mv2-HM': { 'gen-a-mm-std': 'blocked', 'gen-b-hm-mixed': 0 },
        },
        vmClassByName: {
          Standard_M32ts: 'Mv2-MM',    // Mv2 medium-memory
          Standard_M832is_16_v3: 'Mv2-HM', // Mv2 high-memory
        },
      }),
    );
    expect(mmResult.vmsPlaced).toBe(1);

    // ── Mv2-HM on MM cluster: matrix says Blocked → refused
    const hmOnMm = runSimulation(
      makeInput({
        fleet: mmFleet,
        bom: [{ vmSizeName: 'Standard_M832is_16_v3', quantity: 1 }],
        fungibilityMatrix: {
          'Mv2-MM': { 'gen-a-mm-std': 0, 'gen-b-hm-mixed': 'blocked' },
          'Mv2-HM': { 'gen-a-mm-std': 'blocked', 'gen-b-hm-mixed': 0 },
        },
        vmClassByName: {
          Standard_M832is_16_v3: 'Mv2-HM',
        },
      }),
    );
    const blocked = hmOnMm.vmsUnplaceable.find((u) => u.vmSizeName === 'Standard_M832is_16_v3');
    expect(blocked?.blockingReason).toBe('NOT_FUNGIBLE_TO_HARDWARE');
  });

  it('matrix takes precedence over legacy homeFor/spilloverFrom', () => {
    // Legacy fields say "block everything" (empty allow-set), but matrix
    // explicitly allows the VM → matrix wins. This proves the v2.4 path is
    // primary.
    const result = runSimulation(
      makeInput({
        fleet: { ...mmFleet, homeFor: [], spilloverFrom: [] },
        bom: [{ vmSizeName: 'Standard_M96s_1_v3', quantity: 1 }],
        fungibilityMatrix: { 'Mv3-MM': { 'gen-a-mm-std': 0 } },
        vmClassByName: { Standard_M96s_1_v3: 'Mv3-MM' },
      }),
    );
    expect(result.vmsPlaced).toBe(1);
  });

  void hmFleet; // referenced for documentary purposes above
});

// ────────────────────────────────────────────────────────────────────────
// v2.9 (Phase B) — Network as the 3rd packing constraint
//
// These tests pin down the new behavior so future engine work can't
// silently regress it:
//   1. Pre-flight reject when VM > node network cap.
//   2. Network exhaustion stops further placements even when memory has
//      slack — different binding reason than memory/vCPU.
//   3. Back-compat: VMs without `networkMbps` AND fleets without
//      `networkMbpsPerNode` simulate exactly like pre-v2.9 (no network
//      check at all).
//   4. Mixed: a network-published VM running on a no-cap fleet skips
//      the check (the cluster opted out).
//   5. canFit sum check — a VM that would push the node over its cap
//      moves to a fresh node instead of being placed atop.
// ────────────────────────────────────────────────────────────────────────
describe('v2.9 — Network as 3rd packing constraint', () => {
  // Big fat fleet so memory + vCPU are never the binding reason in these
  // tests. Only network matters.
  const networkFleet: FleetSpec = {
    hardwareGroupName: 'Network Test',
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: 4,
    socketsPerNode: 2,
    coresPerSocket: 64,
    hyperthreadingEnabled: true, // 256 vCPU/node
    memoryGibPerNode: 8192,
    throughputCeilingMbps: null,
    isolated: false,
    processor: 'Intel Xeon',
    networkMbpsPerNode: 40_000, // 40 Gbps per node
  };

  function netCat(name: string, network: number): CatalogEntry {
    return {
      vmSizeName: name,
      vmGeneration: 'Mv3',
      series: 'M-Series',
      memoryCategory: 'Medium Memory (MM)',
      homeHardwareGroup: '',
      spilloverTarget: 'N/A',
      processor: 'Intel Xeon',
      vcpus: 16,
      memoryGib: 256,
      networkMbps: network,
      localDiskGib: 0,
      status: 'GA',
      notes: '',
    };
  }

  it('rejects VM whose networkMbps exceeds node cap (pre-flight)', () => {
    const result = runSimulation({
      fleet: networkFleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'TooFat', quantity: 1 }],
      catalog: [netCat('TooFat', 50_000)], // > 40k cap
      packingMode: 'SMART',
      fungibilityOn: false,
    });
    expect(result.vmsPlaced).toBe(0);
    const blocked = result.vmsUnplaceable.find((u) => u.vmSizeName === 'TooFat');
    expect(blocked?.blockingReason).toBe('NETWORK');
    expect(blocked?.details).toMatch(/50,000 Mbps/);
  });

  it('packs until network exhausted, then opens a new node', () => {
    // 5× 10 Gbps VM on a 40 Gbps node = 4 fit per node, 5th opens node 2.
    const result = runSimulation({
      fleet: networkFleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'TenG', quantity: 5 }],
      catalog: [netCat('TenG', 10_000)],
      packingMode: 'STRICT',
      fungibilityOn: false,
    });
    expect(result.vmsPlaced).toBe(5);
    const occupied = result.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
    expect(occupied.length).toBe(2); // 1 full + 1 partial
    const full = occupied.find((n) => n.state === 'occupied-full');
    expect(full?.bindingConstraint).toBe('NETWORK');
  });

  it('back-compat: pre-v2.9 fleet + catalog simulate without network check', () => {
    // Fleet has no networkMbpsPerNode; VMs publish 0 (default). Behavior
    // is identical to pre-v2.9: no rejections, no NETWORK binding.
    const result = runSimulation({
      fleet: { ...networkFleet, networkMbpsPerNode: undefined },
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'Quiet', quantity: 3 }],
      catalog: [netCat('Quiet', 0)],
      packingMode: 'SMART',
      fungibilityOn: false,
    });
    expect(result.vmsPlaced).toBe(3);
    expect(
      result.vmsUnplaceable.find((u) => u.blockingReason === 'NETWORK'),
    ).toBeUndefined();
  });

  it('VM publishes network but fleet has no cap → no check', () => {
    // The cluster opted out of the network constraint by leaving the cap
    // blank. Even a VM claiming 100 Gbps gets placed.
    const result = runSimulation({
      fleet: { ...networkFleet, networkMbpsPerNode: undefined },
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'Hungry', quantity: 1 }],
      catalog: [netCat('Hungry', 100_000)],
      packingMode: 'SMART',
      fungibilityOn: false,
    });
    expect(result.vmsPlaced).toBe(1);
  });

  it('sum check: VM moves to fresh node when adding would exceed cap', () => {
    // Place a 30G VM, then a 20G VM. They sum to 50G > 40G cap → 2nd VM
    // must open a new node rather than co-tenanting.
    const result = runSimulation({
      fleet: networkFleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [
        { vmSizeName: 'Thirty', quantity: 1 },
        { vmSizeName: 'Twenty', quantity: 1 },
      ],
      catalog: [netCat('Thirty', 30_000), netCat('Twenty', 20_000)],
      packingMode: 'STRICT',
      fungibilityOn: false,
    });
    expect(result.vmsPlaced).toBe(2);
    // Each VM lands on its own node — co-tenanting would have exceeded the cap.
    const occupied = result.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
    expect(occupied.length).toBe(2);
  });
});

// ────────────────────────────────────────────────────────────────────────
// v2.24.2 — Fungibility-aware "full" = "no FUNGIBLE VM still fits". A node is
// FULL only when none of its authorized (matrix-allowed) sizes fit the leftover;
// if any authorized size still fits — even one that isn't in the BOM — it stays
// PARTIAL. This keeps the "full" chip consistent with the "What Else Fits" list.
// (Supersedes v2.23.10, which restricted the check to BOM ∩ authorized and so
// read "full" while smaller authorized non-BOM sizes still fit.)
// ────────────────────────────────────────────────────────────────────────
describe('Fungibility-aware semantic full (v2.24.2)', () => {
  const fleet: FleetSpec = {
    hardwareGroupId: 'hw-2s',
    hardwareGroupName: '2S',
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: 1,
    socketsPerNode: 1,
    coresPerSocket: 16,
    hyperthreadingEnabled: true, // 32 vCPU/node
    memoryGibPerNode: 300,
    throughputCeilingMbps: null,
    isolated: false,
    processor: 'Intel Xeon',
  };
  const cat = (name: string, memoryGib: number, vcpus: number): CatalogEntry => ({
    vmSizeName: name,
    vmGeneration: 'Mv3',
    series: 'M-Series',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon',
    provider: 'Azure', // present → engine uses the provider-wide net by default
    vcpus,
    memoryGib,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
  });
  // Big fills most of the node (256/300 GiB, 16/32 vCPU → 44 GiB / 16 vCPU left).
  // Small (16/4) fits that sliver, but is NOT in the BOM.
  const big = cat('Big', 256, 16);
  const small = cat('Small', 16, 4);
  // Huge (256/16) is authorized but can NEVER fit alongside Big (needs another
  // 256 GiB / 16 vCPU) — used for the genuinely-full case.
  const huge = cat('Huge', 256, 16);

  it('node is PARTIAL when an authorized (fungible) size still fits — even if not in the BOM', () => {
    // v2.24.2: "if a node can fit more fungible VMs, it is partial." Small is
    // authorized and fits the leftover, so the node is NOT full for the demand.
    const result = runSimulation({
      fleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'Big', quantity: 1 }], // only Big is demanded
      catalog: [big, small],
      packingMode: 'SMART',
      fungibilityOn: true,
      fungibilityMatrix: { Big: { 'hw-2s': 0 }, Small: { 'hw-2s': 0 } }, // both authorized
      vmClassByName: { Big: 'Big', Small: 'Small' },
    });
    const node = result.nodeDetail.find((n) => n.vmsPlaced.length > 0);
    expect(node?.state).toBe('occupied-partial');
  });

  it('node is FULL when no authorized size fits the leftover', () => {
    // Only Big + Huge authorized, both too large for the 44 GiB / 16 vCPU sliver
    // (Huge needs 256 GiB) → nothing fungible fits → full.
    const result = runSimulation({
      fleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'Big', quantity: 1 }],
      catalog: [big, huge, small], // Small present in catalog but NOT authorized
      packingMode: 'SMART',
      fungibilityOn: true,
      fungibilityMatrix: { Big: { 'hw-2s': 0 }, Huge: { 'hw-2s': 0 } }, // Small unauthorized
      vmClassByName: { Big: 'Big', Huge: 'Huge', Small: 'Small' },
    });
    const node = result.nodeDetail.find((n) => n.vmsPlaced.length > 0);
    expect(node?.state).toBe('occupied-full');
  });

  it('legacy (no matrix): the provider-wide net keeps it partial', () => {
    const result = runSimulation({
      fleet,
      buffer: { mode: 'pct', value: 0 },
      bom: [{ vmSizeName: 'Big', quantity: 1 }],
      catalog: [big, small],
      packingMode: 'SMART',
      fungibilityOn: false, // no matrix → wide net considers Small (it fits)
    });
    const node = result.nodeDetail.find((n) => n.vmsPlaced.length > 0);
    expect(node?.state).toBe('occupied-partial');
  });
});

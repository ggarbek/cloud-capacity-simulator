import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import { runSimulation } from '../engine/simulator';
import type {
  BomEntry,
  CatalogEntry,
  FleetSpec,
  NodeDetail,
  SimulatorResult,
  SpilloverEvent,
} from '../types';
import { totalNodes, vcpusPerNode, deployableNodes } from '../types';
import { GlassToggle } from './GlassToggle';
import { vmClass } from '../utils/vmTaxonomy';
import { buildAndRunSimulation } from '../utils/runEngine';

// Max priority value the matrix supports (Home=0, Spill-1..5). Keep in sync
// with FungibilityTab's keyboard shortcuts + xlsx legend.
const MAX_TIER = 5;

/**
 * Buffer resolution — duplicated from `src/engine/simulator.ts` (kept module-
 * private there to preserve engine purity). The two MUST stay in lockstep;
 * if you change one, change the other.
 */
function resolveReservedForRunner(
  buffer: import('../types').BufferSpec,
  total: number,
): number {
  if (buffer.mode === 'pct') {
    return Math.ceil(total * (Math.max(0, buffer.value) / 100));
  }
  return Math.min(total, Math.max(0, Math.floor(buffer.value)));
}

/**
 * Mean memory per node for a cluster — handles heterogeneous racks
 * (mixed-position, e.g. two 8 TiB nodes plus one 16 TiB node in the same rack)
 * by weighted average over `rackComposition`.
 * Used for the cheap sum-based admissibility check in the claim phase; the
 * per-node bin-packer in the engine still has the final say on per-VM fit.
 */
function meanMemPerNode(fleet: FleetSpec): number {
  if (fleet.rackComposition && fleet.rackComposition.length > 0) {
    const totalMem = fleet.rackComposition.reduce(
      (s, c) => s + c.memoryGibPerNode * c.count,
      0,
    );
    const totalCount = fleet.rackComposition.reduce((s, c) => s + c.count, 0);
    if (totalCount > 0) return totalMem / totalCount;
  }
  return fleet.memoryGibPerNode;
}

/**
 * Phase-1 multi-cluster orchestrator. For each cluster, runs the existing
 * single-fleet engine on the subset of the BOM whose home hardware group
 * matches that cluster's `hardwareGroupName`. VMs are claimed greedily by the
 * FIRST matching cluster (insertion order); subsequent matching clusters get
 * no BOM and render as empty racks. Spillover is not yet modeled.
 *
 * Matching uses family normalization: the catalog labels homes by family
 * (e.g. "Gen-A MM"), while clusters use sub-variants (e.g. "Gen-A MM-Std").
 * `normalizeGroupName` reduces both to the same family form so they line up.
 */
function normalizeGroupName(name: string): string {
  // "Gen-A MM-Std"   → "Gen-A MM"
  // "Gen-A HM"       → "Gen-A HM"
  // "Gen-Legacy HM"  → "Gen-Legacy HM"
  const m = name.trim().match(/^(Gen-[A-Za-z0-9]+)(?:\.\d+)?\s*(VHM|HM|MM)/);
  if (!m) return name.trim();
  return `${m[1]} ${m[2]}`;
}
function homeMatchesCluster(catalogHome: string, clusterHwName: string): boolean {
  const cluster = normalizeGroupName(clusterHwName);
  // Catalog may encode home + spillover as "Gen-Legacy HM / Gen-D HM" — accept either.
  return catalogHome
    .split('/')
    .map((s) => normalizeGroupName(s))
    .some((c) => c === cluster);
}

/**
 * v2.2 fungibility-aware claim check. The uploaded HW group's `homeFor` /
 * `spilloverFrom` columns are the authoritative source of truth — if they're
 * populated, we match BOM rows by `cat.vmGeneration` against the union.
 * Falls back to the legacy string-match (catalog's homeHardwareGroup vs
 * cluster's hardwareGroupName) for custom/manual fleets that have neither
 * field set, so the original Phase-1 behavior is preserved.
 */
/**
 * v2.5: classifier upgrade. Returns BOTH a `BlockingReason` and a
 * human-readable `details` string. Detection order is "structural first,
 * then matrix-level, then capacity":
 *
 *   1. No catalog row → VM_SIZE_NOT_FOUND
 *   2. Zero clusters in the fleet list → NO_CLUSTERS_CONFIGURED
 *   3. VM oversized vs the largest single-node anywhere → VM_OVERSIZED_*
 *   4. Matrix-aware reasons: NOT_AUTHORED / BLOCKED_BY_MATRIX
 *   5. Some matrix cell accepted → OVERFLOWED_ALL_TIERS (cascade exhausted)
 *   6. Legacy fallback: NO_FUNGIBILITY_DEFINED / NOT_FUNGIBLE_TO_HARDWARE
 */
function classifyUnclaimed(
  cat: CatalogEntry | undefined,
  fleets: import('../types').FleetSpec[],
  sizeKey: string,
  vmClassKey: string,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
): { reason: import('../types').BlockingReason; details?: string } {
  if (!cat) {
    return {
      reason: 'VM_SIZE_NOT_FOUND',
      details: 'BOM references a SKU that isn\'t in your VM catalog.',
    };
  }
  if (fleets.length === 0) {
    return {
      reason: 'NO_CLUSTERS_CONFIGURED',
      details: 'You haven\'t configured any clusters. Open Configure → Fleet Hardware.',
    };
  }

  // ── Oversized vs the entire fleet — fundamental, can't be fixed by routing.
  let maxNodeMem = 0;
  let maxNodeVcpu = 0;
  let largestMemCluster = '';
  let largestVcpuCluster = '';
  for (const f of fleets) {
    // Hetero racks: use the LARGEST single position memory (not the average).
    const memHere =
      f.rackComposition && f.rackComposition.length > 0
        ? Math.max(...f.rackComposition.map((c) => c.memoryGibPerNode))
        : f.memoryGibPerNode;
    if (memHere > maxNodeMem) {
      maxNodeMem = memHere;
      largestMemCluster = f.hardwareGroupName;
    }
    const ht = f.hyperthreadingEnabled ? 2 : 1;
    const vcpuHere = f.socketsPerNode * f.coresPerSocket * ht;
    if (vcpuHere > maxNodeVcpu) {
      maxNodeVcpu = vcpuHere;
      largestVcpuCluster = f.hardwareGroupName;
    }
  }
  if (cat.memoryGib > maxNodeMem && maxNodeMem > 0) {
    return {
      reason: 'VM_OVERSIZED_MEMORY',
      details: `VM needs ${cat.memoryGib.toLocaleString()} GiB; largest single-node memory across every cluster is ${maxNodeMem.toLocaleString()} GiB (in "${largestMemCluster}").`,
    };
  }
  if (cat.vcpus > maxNodeVcpu && maxNodeVcpu > 0) {
    return {
      reason: 'VM_OVERSIZED_VCPU',
      details: `VM needs ${cat.vcpus} vCPUs; largest single-node vCPU across every cluster is ${maxNodeVcpu} (in "${largestVcpuCluster}").`,
    };
  }

  // ── Matrix-aware reasons ───────────────────────────────────────────────
  if (matrix && Object.keys(matrix).length > 0) {
    // v2.19.17 — per-size routing: resolve each cell size-first, class-fallback.
    const dispKey = sizeKey || vmClassKey;
    let anyAuthored = false;
    let anyAllowed = false;
    const blockedNames: string[] = [];
    /** Accepting clusters classified by why they couldn't host (v2.19.55).
     *  - 'oversize' = at least one per-node dimension structurally fails.
     *  - 'capacity' = matrix accepts + per-node fits, but cluster ran dry.
     *  Drives the honest OVERFLOWED_ALL_TIERS details string. */
    const oversizeNotes: string[] = [];
    const capacityNames: string[] = [];
    for (const f of fleets) {
      if (!f.hardwareGroupId) continue;
      let cell = matrix[sizeKey]?.[f.hardwareGroupId];
      if (cell === undefined) cell = matrix[vmClassKey]?.[f.hardwareGroupId];
      if (cell === undefined) continue;
      anyAuthored = true;
      if (cell === 'blocked') {
        blockedNames.push(f.hardwareGroupName);
        continue;
      }
      anyAllowed = true;
      // Walk the per-node ceilings. Heterogeneous racks: use MAX per-position
      // since the engine assigns per-position memory; otherwise fall back to
      // the cluster-level value.
      const nodeMem =
        f.rackComposition && f.rackComposition.length > 0
          ? Math.max(...f.rackComposition.map((c) => c.memoryGibPerNode))
          : f.memoryGibPerNode;
      // FleetSpec doesn't store vCPU per node directly — derive from
      // sockets × cores × (HT ? 2 : 1) via the canonical helper.
      // CatalogEntry.networkMbps is required; storage is `remoteStorageMbpsPremium`.
      const nodeVcpu = vcpusPerNode(f);
      const nodeNet = f.networkMbpsPerNode ?? Infinity;
      const nodeStor = f.storageThroughputMbpsPerNode ?? Infinity;
      const vmStor = cat.remoteStorageMbpsPremium ?? 0;
      const fails: string[] = [];
      if (cat.memoryGib > nodeMem) {
        fails.push(`memory ${cat.memoryGib.toLocaleString()} GiB > node ${nodeMem.toLocaleString()} GiB`);
      }
      if (nodeVcpu > 0 && cat.vcpus > nodeVcpu) {
        fails.push(`vCPU ${cat.vcpus} > node ${nodeVcpu}`);
      }
      if (cat.networkMbps && cat.networkMbps > nodeNet) {
        fails.push(`network ${cat.networkMbps.toLocaleString()} Mbps > node ${nodeNet.toLocaleString()} Mbps`);
      }
      if (vmStor > 0 && vmStor > nodeStor) {
        fails.push(`storage ${vmStor.toLocaleString()} MB/s > node ${nodeStor.toLocaleString()} MB/s`);
      }
      const tierLabel = cell === 0 ? 'Home' : `Spill-${cell}`;
      if (fails.length > 0) {
        oversizeNotes.push(`${f.hardwareGroupName} (${tierLabel}): per-node ${fails.join(', ')}`);
      } else {
        capacityNames.push(`${f.hardwareGroupName} (${tierLabel})`);
      }
    }
    if (!anyAuthored) {
      return {
        reason: 'NOT_AUTHORED',
        details: `No matrix cell exists for "${dispKey || '?'}" against any of your clusters. Open Fungibility tab and decide.`,
      };
    }
    if (!anyAllowed) {
      return {
        reason: 'BLOCKED_BY_MATRIX',
        details: `Every cluster accepting "${dispKey || '?'}" is explicitly Blocked (${blockedNames.join(', ')}). Convert at least one cell to Home or Spillover.`,
      };
    }
    // Matrix accepts at least one cluster but cascade still couldn't claim.
    // v2.19.55 — split the explanation by exclusion kind so the user knows
    // WHICH clusters are structurally rejected vs sum-cap exhausted.
    const parts: string[] = [];
    if (capacityNames.length > 0) {
      parts.push(`Sum-cap exhausted: ${capacityNames.join('; ')}`);
    }
    if (oversizeNotes.length > 0) {
      parts.push(`Structurally excluded — ${oversizeNotes.join('; ')}`);
    }
    if (parts.length === 0) {
      parts.push('every accepting tier was at sum-capacity');
    }
    return {
      reason: 'OVERFLOWED_ALL_TIERS',
      details: `"${dispKey || '?'}" can't land. ${parts.join('. ')}.`,
    };
  }

  // ── Legacy v2.3 classification (custom/manual fleets) ─────────────────
  const fungibilityFleets = fleets.filter(
    (f) => f.homeFor !== undefined || f.spilloverFrom !== undefined,
  );
  if (fungibilityFleets.length === 0) {
    return {
      reason: 'NO_ELIGIBLE_NODES',
      details:
        'No cluster matched on home hardware (legacy string-match path). Check homeHardwareGroup in your VM template or author the matrix.',
    };
  }
  if (fungibilityFleets.length < fleets.length) {
    return {
      reason: 'NO_ELIGIBLE_NODES',
      details: 'Some clusters lack fungibility info — mixing matrix-aware and legacy fleets isn\'t fully supported. Author the matrix for all clusters.',
    };
  }
  const allEmpty = fungibilityFleets.every(
    (f) => (f.homeFor?.length ?? 0) === 0 && (f.spilloverFrom?.length ?? 0) === 0,
  );
  if (allEmpty) {
    return {
      reason: 'NO_FUNGIBILITY_DEFINED',
      details: 'Every cluster has empty homeFor + spilloverFrom. Either fill those columns in the Hardware template or author the matrix.',
    };
  }
  return {
    reason: 'NOT_FUNGIBLE_TO_HARDWARE',
    details: `VM generation "${cat.vmGeneration ?? '(unset)'}" isn't in any cluster's homeFor ∪ spilloverFrom.`,
  };
}

/**
 * v2.4 matrix-aware claim check.
 *   - When the matrix is provided AND non-empty, look up
 *     matrix[vmClass][fleet.hardwareGroupId]: numeric cell → accept (priority
 *     used for ordering below); 'blocked' / missing → reject.
 *   - When matrix is empty or absent, fall through to v2.3 legacy logic
 *     (fleet.homeFor / spilloverFrom or string-match).
 * Returns the priority number when accepted (so the caller can prefer lower
 * priority), or null when rejected.
 */
function matrixPriority(
  fleet: import('../types').FleetSpec,
  sizeKey: string,
  classKey: string,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
): number | null {
  if (!matrix || Object.keys(matrix).length === 0) return null;
  const hwId = fleet.hardwareGroupId;
  if (!hwId) return null;
  // v2.19.17 — per-size routing: prefer the size-keyed cell, fall back to a
  // legacy class-keyed cell so older matrices keep routing.
  let cell = matrix[sizeKey]?.[hwId];
  if (cell === undefined) cell = matrix[classKey]?.[hwId];
  if (cell === undefined || cell === 'blocked') return null;
  return cell;
}

function fleetAcceptsVm(
  fleet: import('../types').FleetSpec,
  cat: CatalogEntry,
): boolean {
  const hasFungibility = fleet.homeFor !== undefined || fleet.spilloverFrom !== undefined;
  if (hasFungibility) {
    const allowed = new Set([...(fleet.homeFor ?? []), ...(fleet.spilloverFrom ?? [])]);
    if (allowed.size === 0) return false; // template missing fungibility info → block all
    return !!cat.vmGeneration && allowed.has(cat.vmGeneration);
  }
  return homeMatchesCluster(cat.homeHardwareGroup, fleet.hardwareGroupName);
}
/**
 * Exported for `RunFooter.test.ts`. Not part of the public surface — UI code
 * still goes through the `RunFooter` component. Renaming or reshaping this
 * function will break the multi-cluster acceptance tests.
 */
export function runMulti(
  clusters: { id: string; fleet: import('../types').FleetSpec }[],
  bom: BomEntry[],
  buffer: import('../types').BufferSpec,
  packingMode: import('../types').PackingMode,
  fungibilityOn: boolean,
  catalog: CatalogEntry[],
  fungibilityMatrix?: Record<string, Record<string, number | 'blocked'>>,
  vmClassByName?: Record<string, string>,
  /** v2.18 — Optional HW-group index. RETAINED in v2.19 for legacy callers
   *  but no longer used to resolve buffer (buffer is now per-cluster, not
   *  per-HW-group). Kept to avoid breaking callers that still pass it. */
  hwById?: Record<string, import('../types').HardwareGroup>,
): SimulatorResult {
  // v2.19 — Buffer is now per-cluster (FleetSpec.bufferDefault +
  // bufferByMemGib). Resolved via deployableNodes() — see types/index.ts.
  // The legacy `buffer` arg here is the slot-3 fallback for fleets that
  // pre-date v2.19 and somehow lack a bufferDefault.
  //
  // v2.19.55 — Live-mirror HW-derived spec fields onto each fleet before
  // simulation. Pre-fix, FleetSpec snapshotted memoryGibPerNode +
  // network/storage at placement time; editing the Hardware Library
  // entry later silently left placed clusters frozen on the OLD spec.
  // The walkthrough fixture surfaced this: V1 2S (old) HW Library said
  // 4,294 GiB / node but its placed fleets carried 3,892 GiB. The
  // engine's per-node oversize gate excluded V1 2S from candidates
  // because the STALE 3,892 < 4,096 GiB the VM needed.
  //
  // HW Library is the single source of truth (matches the buffer
  // doctrine + project_no_stale_data invariant). At simulation entry
  // we rebuild each cluster's fleet with live HW spec fields,
  // preserving placement-specific state (region, zone, rackCount,
  // bufferDefault, bufferByMemGib, bufferAcknowledged, hyperthreadingEnabled).
  if (hwById && Object.keys(hwById).length > 0) {
    clusters = clusters.map(({ id, fleet }) => {
      const g = fleet.hardwareGroupId ? hwById[fleet.hardwareGroupId] : undefined;
      if (!g) return { id, fleet };
      return {
        id,
        fleet: {
          ...fleet,
          // Identity + classification
          hardwareGroupName: g.name,
          memoryCategory: g.memoryCategory,
          processor: g.processor,
          // Per-node engine ceilings — the load-bearing fields the
          // structural-oversize gate reads.
          memoryGibPerNode: g.memoryGibPerNode,
          rackComposition: g.rackComposition,
          socketsPerNode: g.socketsPerNode,
          coresPerSocket: g.coresPerSocket ?? 0,
          nodesPerRack: g.nodesPerRack ?? fleet.nodesPerRack,
          networkMbpsPerNode: g.networkMbpsPerNode,
          networkNicCount: g.networkNicCount,
          storageThroughputMbpsPerNode: g.storageThroughputMbpsPerNode,
          // Legacy fungibility hints
          homeFor: g.homeFor,
          spilloverFrom: g.spilloverFrom,
          // Financials — feed Profitability cards + insights.
          costPerNodeUsd: g.costPerNodeUsd,
          costPerRackUsd: g.costPerRackUsd,
          usableLifeMonths: g.usableLifeMonths,
          opexPerNodeMonthlyUsd: g.opexPerNodeMonthlyUsd,
        },
      };
    });
  }
  // v2.6 — Sub-claims expand each BOM row into one or more (zone, qty) shards.
  //  - Regional rows produce ONE sub-claim with zone=null + full quantity. The
  //    allocator picks the cluster with the most available capacity at the
  //    lowest accepting fungibility tier (regional = "ignore zones").
  //  - Zonal rows produce up-to-4 sub-claims, one per selected zone, with
  //    quantity round-robin split as evenly as possible. The allocator only
  //    considers clusters whose `fleet.zone` matches the sub-claim's zone;
  //    spillover tier cascade still runs inside that zone (per the user's
  //    spec: "spillover logic works within zones"). Sub-claims for zones with
  //    no matching cluster surface as ZONE_NOT_IN_FLEET unplaceables.
  interface SubClaim {
    entry: BomEntry; // original BOM row (read-only)
    originalIndex: number; // index in `bom` for unplaceable bookkeeping
    zone: string | null; // null = regional (zone-agnostic)
    quantity: number; // possibly < entry.quantity when split
  }
  // v2.19.22 — Zones-with-clusters across the placed fleet. Used when a row
  // is zonal but the user didn't pin specific zones — semantic is "balance
  // workload across every zone that has capacity." If the fleet has zero
  // zoned clusters, zonal degenerates to regional (no zone diversity to
  // balance across).
  const zonesWithClusters = new Set<string>();
  for (const { fleet } of clusters) {
    if (fleet.zone) zonesWithClusters.add(fleet.zone);
  }
  const subClaims: SubClaim[] = [];
  bom.forEach((entry, i) => {
    if ((entry.deploymentType ?? 'regional') !== 'zonal') {
      subClaims.push({ entry, originalIndex: i, zone: null, quantity: entry.quantity });
      return;
    }
    // Zonal — three cases:
    //   1. User pinned ≥1 specific zone → round-robin over those zones.
    //   2. User picked Zonal but no specific zones AND ≥1 zoned cluster
    //      exists → round-robin over ALL zones with clusters (the
    //      "balance everywhere" semantic).
    //   3. User picked Zonal but the fleet has no zoned clusters → fall
    //      back to a single regional sub-claim. No diversity to balance.
    const pinned = (entry.zones ?? []).slice(0, 4);
    const targetZones = pinned.length > 0 ? pinned : [...zonesWithClusters];
    if (targetZones.length === 0) {
      subClaims.push({ entry, originalIndex: i, zone: null, quantity: entry.quantity });
      return;
    }
    const base = Math.floor(entry.quantity / targetZones.length);
    const remainder = entry.quantity - base * targetZones.length;
    targetZones.forEach((z, zi) => {
      const q = base + (zi < remainder ? 1 : 0);
      if (q > 0) subClaims.push({ entry, originalIndex: i, zone: z, quantity: q });
    });
  });

  const remainingBom = [...bom];
  const perCluster: SimulatorResult[] = [];
  // Per-sub-claim placement bookkeeping. Indexed by position in `subClaims`.
  const placedSubclaim = new Array<boolean>(subClaims.length).fill(false);
  // v2.19.51 — Per-sub-claim residual quantity that the claim phase failed to
  // admit anywhere. Filled by the partial-cascade below; consumed at flush
  // time so we only report the actual leftover (not the full sub-claim qty
  // even when most of it landed).
  const residualBySubclaim = new Array<number>(subClaims.length).fill(0);
  // Extra unplaceable entries surfaced for zonal sub-claims that found no
  // cluster in their zone — keyed for de-duplication at flush time.
  const extraZonalUnplaceable: import('../types').UnplaceableEntry[] = [];

  // v2.4.2 — **Iterative spillover-when-full.** Each BOM row walks priority
  // tiers in ascending order (Home=0 → Spill-1 → Spill-2 → …); at each tier
  // we pick the first cluster whose remaining sum-capacity (memory AND vCPU)
  // can absorb the row's needs. If none at tier T accepts, advance to T+1.
  // When tier > 0 absorbs, emit a `SpilloverEvent { fromGroup: tier-0 home,
  // toGroup: actual claiming cluster }` so the user can see the spill on the
  // result.
  //
  // Sum-based admissibility is the cheap necessary check; the per-cluster
  // engine run still has final say on per-VM bin-pack fit. Pathological
  // bin-pack fragmentation (sum says yes, packing says no) is a known
  // follow-on, not yet handled here.
  //
  // Falls back to the legacy fleet-acceptance check when the matrix isn't
  // populated (custom/manual fleets without `hardwareGroupId`).
  const matrixActive =
    fungibilityOn && !!fungibilityMatrix && Object.keys(fungibilityMatrix).length > 0;

  // ── 1. Per-cluster running state for the claim phase. ─────────────────
  interface ClaimState {
    id: string;
    fleet: FleetSpec;
    memCapacity: number;
    vcpuCapacity: number;
    memUsed: number;
    vcpuUsed: number;
    claimed: BomEntry[];
    /** Tier at which each entry in `claimed` was assigned (parallel array).
     *  Used to emit SpilloverEvent records after the run completes. */
    claimedTiers: number[];
    /** Tier-0 home hardware group name for each entry, captured at claim
     *  time so we can label the spillover event accurately. */
    claimedHome: (string | undefined)[];
    /** v2.19.55 — Sub-claim index for each entry. Lets Phase 4.5 (the
     *  iterative cascade C) recover the EXACT sub-claim a per-cluster
     *  bin-pack reject came from, so it cascades within the correct zone.
     *  Pre-v2.19.55 the cascade matched sub-claims by `(vmSizeName,
     *  has-claim-on-this-cluster)` — when the BoM had two zonal sub-claims
     *  for the same SKU, `Array.find` always returned the first one, and
     *  Zone 2 rejects leaked into Zone 1 clusters. */
    claimedSubIdx: number[];
  }
  const states: ClaimState[] = clusters.map(({ id, fleet }) => {
    // v2.19 — Per-cluster, per-node-type buffer math. Utility nodes are
    // excluded from BOTH numerator and denominator. Falls back to the
    // legacy global `buffer` only when the fleet has neither bufferDefault
    // nor bufferByMemGib (pre-v2.19 fleets persisted before migration).
    const dep = deployableNodes(fleet);
    const hasOwnBuffer = !!(fleet.bufferDefault || (fleet.bufferByMemGib && Object.keys(fleet.bufferByMemGib).length > 0));
    let deployable = dep.deployable;
    if (!hasOwnBuffer) {
      // Slot-3 legacy fallback — global buffer applied to the non-utility total.
      const reserved = resolveReservedForRunner(buffer, dep.totalNonUtility);
      deployable = Math.max(0, dep.totalNonUtility - reserved);
    }
    return {
      id,
      fleet,
      memCapacity: deployable * meanMemPerNode(fleet),
      vcpuCapacity: deployable * vcpusPerNode(fleet),
      memUsed: 0,
      vcpuUsed: 0,
      claimed: [],
      claimedTiers: [],
      claimedHome: [],
      claimedSubIdx: [],
    };
  });
  // Quick id-lookup so we can append to the right state inside the cascade.
  const stateById = new Map<string, ClaimState>(states.map((s) => [s.id, s]));

  // ── 2. Per-sub-claim tier cascade. ────────────────────────────────────
  // v2.19.51 — **Tier-first, partial-admission cascade.** Two correctness
  // fixes over the legacy per-sub-claim/all-or-nothing pass:
  //   1. Process tiers OUTSIDE sub-claims, so a row whose Home tier is the
  //      same cluster as another row's Spillover tier gets first dibs on
  //      that cluster's capacity. Without this, BoM row order silently
  //      starves later rows even when the matrix says they belong there.
  //   2. At each (tier, sub-claim) cell, admit as many VMs as fit in
  //      summed cluster headroom and cascade the residual. The legacy code
  //      required 100% of the sub-claim's qty to fit in a single tier;
  //      anything bigger fell off the end as OVERFLOWED_ALL_TIERS even when
  //      the next tier held 52 of 72.
  //
  // Per-sub-claim setup (catalog lookup, zone filter, ZONE_NOT_IN_FLEET
  // detection) runs first; the matrix cascade itself is the nested loop.
  interface PreparedSubClaim {
    sub: SubClaim;
    si: number;
    entry: BomEntry;
    cat: CatalogEntry;
    zoneFiltered: ClaimState[];
    remaining: number;
    sizeKey: string;
    vmClassKey: string;
    homeGroupName: string | undefined;
  }
  const prepared: PreparedSubClaim[] = [];
  subClaims.forEach((sub, si) => {
    const entry = sub.entry;
    const cat = catalog.find(
      (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
    );
    if (!cat) return;
    const zoneFiltered: ClaimState[] =
      sub.zone === null
        ? states
        : states.filter((s) => (s.fleet.zone ?? '') === sub.zone);
    if (sub.zone !== null && zoneFiltered.length === 0) {
      extraZonalUnplaceable.push({
        vmSizeName: entry.vmSizeName,
        count: sub.quantity,
        blockingReason: 'ZONE_NOT_IN_FLEET',
        details: `Zone "${sub.zone}" has no cluster in your fleet. ${sub.quantity} VM${sub.quantity === 1 ? '' : 's'} from this zonal row's split couldn't land.`,
      });
      placedSubclaim[si] = false;
      return;
    }
    const sizeKey = cat.vmSizeName;
    const vmClassKey =
      (vmClassByName && vmClassByName[cat.vmSizeName]) || cat.vmGeneration || '';
    // Pre-find a tier-0 home cluster name so spillover events label
    // `fromGroup` accurately. v2.19.22 — Two-pass lookup so the event fires
    // even when the user's designated Home HW isn't in the sub-claim's
    // zone (zonal Z2 + Home=HW-B-in-Z1 case).
    let homeGroupName: string | undefined;
    for (const s of zoneFiltered) {
      if (matrixPriority(s.fleet, sizeKey, vmClassKey, fungibilityMatrix) === 0) {
        homeGroupName = s.fleet.hardwareGroupName;
        break;
      }
    }
    if (!homeGroupName) {
      for (const s of states) {
        if (matrixPriority(s.fleet, sizeKey, vmClassKey, fungibilityMatrix) === 0) {
          homeGroupName = s.fleet.hardwareGroupName;
          break;
        }
      }
    }
    prepared.push({
      sub,
      si,
      entry,
      cat,
      zoneFiltered,
      remaining: sub.quantity,
      sizeKey,
      vmClassKey,
      homeGroupName,
    });
  });

  if (matrixActive) {
    // Outer loop = tier. At each tier, every sub-claim gets a chance to
    // admit its residual against any in-scope cluster whose matrix cell
    // matches THIS tier. Sub-claims preserve BoM order at each tier, so
    // tie-breaks within a tier are deterministic.
    for (let tier = 0; tier <= MAX_TIER; tier++) {
      for (const p of prepared) {
        if (p.remaining <= 0) continue;
        const { cat, entry, zoneFiltered, sizeKey, vmClassKey, homeGroupName } = p;
        // Gather acceptors at this tier with at least one VM slot of room.
        const acceptors: ClaimState[] = [];
        for (const s of zoneFiltered) {
          const pri = matrixPriority(
            s.fleet,
            sizeKey,
            vmClassKey,
            fungibilityMatrix,
          );
          if (pri !== tier) continue;
          // Structural per-node oversize — even infinite summed headroom
          // can't help if no single node fits the VM.
          if (cat.memoryGib > s.fleet.memoryGibPerNode) continue;
          const memRoom = s.memCapacity - s.memUsed;
          const vcpuRoom = s.vcpuCapacity - s.vcpuUsed;
          if (memRoom < cat.memoryGib || vcpuRoom < cat.vcpus) continue;
          acceptors.push(s);
        }
        if (acceptors.length === 0) continue;
        // Sort by emptiest-first so utilization spreads instead of stacking.
        acceptors.sort(
          (a, b) => (b.memCapacity - b.memUsed) - (a.memCapacity - a.memUsed),
        );
        for (const acc of acceptors) {
          if (p.remaining === 0) break;
          const memRoom = acc.memCapacity - acc.memUsed;
          const vcpuRoom = acc.vcpuCapacity - acc.vcpuUsed;
          const fitByMem = Math.floor(memRoom / cat.memoryGib);
          const fitByVcpu = Math.floor(vcpuRoom / cat.vcpus);
          const take = Math.min(p.remaining, fitByMem, fitByVcpu);
          if (take <= 0) continue;
          acc.claimed.push({ ...entry, quantity: take });
          acc.claimedTiers.push(tier);
          acc.claimedHome.push(homeGroupName);
          acc.claimedSubIdx.push(p.si);
          acc.memUsed += cat.memoryGib * take;
          acc.vcpuUsed += cat.vcpus * take;
          p.remaining -= take;
          placedSubclaim[p.si] = true;
        }
      }
    }
    // Any leftover is the true residual the cascade exhausted; the flush
    // phase will surface it under the original BoM row's index.
    for (const p of prepared) {
      if (p.remaining > 0) residualBySubclaim[p.si] = p.remaining;
    }
  } else {
    // Legacy path — first acceptor in insertion order (within zone filter
    // when zonal). Kept for fleets without `hardwareGroupId`.
    for (const p of prepared) {
      const { sub, si, entry, cat, zoneFiltered } = p;
      for (const s of zoneFiltered) {
        if (fleetAcceptsVm(s.fleet, cat)) {
          s.claimed.push({ ...entry, quantity: sub.quantity });
          s.claimedTiers.push(0);
          s.claimedHome.push(s.fleet.hardwareGroupName);
          s.claimedSubIdx.push(si);
          placedSubclaim[si] = true;
          break;
        }
      }
    }
  }

  // ── 3. SpilloverEvent records — one per (vmSizeName, from, to). ───────
  // Collapse multiple entries that share a (size, from, to) triple into a
  // single event with summed count so the UI doesn't drown in duplicates.
  const spilloverAcc = new Map<string, SpilloverEvent>();
  for (const s of states) {
    s.claimed.forEach((entry, idx) => {
      const tier = s.claimedTiers[idx];
      const homeName = s.claimedHome[idx];
      if (tier <= 0 || !homeName) return;
      if (homeName === s.fleet.hardwareGroupName) return; // edge case: home == self
      const key = `${entry.vmSizeName}|${homeName}|${s.fleet.hardwareGroupName}`;
      const existing = spilloverAcc.get(key);
      if (existing) {
        existing.count += entry.quantity;
      } else {
        spilloverAcc.set(key, {
          vmSizeName: entry.vmSizeName,
          fromGroup: homeName,
          toGroup: s.fleet.hardwareGroupName,
          count: entry.quantity,
        });
      }
    });
  }
  const topLevelSpillovers: SpilloverEvent[] = Array.from(spilloverAcc.values());

  // ── 4. Run the engine per cluster on its final claimed subset. ────────
  for (const s of states) {
    const sub = runSimulation({
      fleet: s.fleet,
      // v2.19 — Per-cluster buffer. The engine's runSimulation still
      // accepts a flat BufferSpec; we pass the cluster's authored default
      // so the engine's reserved-count stat reflects the cluster intent.
      // The richer per-slot math has already been applied to the
      // memCapacity / vcpuCapacity caps above.
      buffer: s.fleet.bufferDefault ?? buffer,
      bom: s.claimed,
      catalog,
      packingMode,
      fungibilityOn,
      fungibilityMatrix,
      vmClassByName,
    });
    sub.nodeDetail = sub.nodeDetail.map((n) => ({
      ...n,
      clusterId: s.id,
      nodeId: `${s.id}:${n.nodeId}`,
    }));
    perCluster.push(sub);
  }
  // Reference to silence the unused warning when matrixActive path runs.
  void stateById;

  // ── 4.5. v2.19.23 — Iterative cascade for bin-pack rejects. ───────────
  // Phase 4 admitted each sub-claim's whole batch at the first tier whose
  // sum-capacity fit. Bin-pack then ran per-cluster and may have rejected
  // individual VMs due to per-node dimensional fragmentation (NETWORK,
  // STORAGE, VCPU, MEMORY, DEPLOYMENT_LIMIT). Those rejects today flow into
  // `vmsUnplaceable`, even when a tier-N+1 cluster in the same scope had
  // headroom. This pass walks each reject up the priority ladder and tries
  // to land it incrementally on a node that has room. Strictly additive —
  // already-placed VMs are never moved.
  //
  // Scope: zonal sub-claims cascade only within their zone; regional
  // sub-claims cascade across the whole region. Mirrors the original claim
  // semantics, just applied at a finer (per-VM) granularity.
  if (matrixActive) {
    const BIN_PACK_REJECT_REASONS = new Set<import('../types').BlockingReason>([
      'NETWORK', 'STORAGE', 'VCPU', 'MEMORY', 'DEPLOYMENT_LIMIT', 'ISOLATED_HOST',
    ]);
    const catBySku = new Map<string, import('../types').CatalogEntry>();
    for (const c of catalog) catBySku.set(c.vmSizeName, c);

    for (let srcIdx = 0; srcIdx < states.length; srcIdx++) {
      const srcState = states[srcIdx];
      const srcResult = perCluster[srcIdx];
      const newRejects: import('../types').UnplaceableEntry[] = [];

      for (const reject of srcResult.vmsUnplaceable) {
        if (!BIN_PACK_REJECT_REASONS.has(reject.blockingReason)) {
          newRejects.push(reject);
          continue;
        }
        const vm = catBySku.get(reject.vmSizeName);
        if (!vm) {
          newRejects.push(reject);
          continue;
        }

        // v2.19.55 — Look up the EXACT sub-claim that produced this
        // cluster's claim for this SKU via claimedSubIdx. Pre-fix this used
        // `subClaims.find(sc => sc.vmSizeName === reject.vmSizeName && srcState.claimed.some(...))`
        // which returns the FIRST sub-claim matching the SKU regardless of
        // which sub-claim's batch actually landed here. With two zonal
        // sub-claims for the same SKU, Zone 2 rejects were leaking into
        // Zone 1 clusters (off-by-2 placements per zone observed in
        // walkthrough fixture). The parallel `claimedSubIdx` array is the
        // ground truth — read it directly.
        const claimIdx = srcState.claimed.findIndex(
          (c) => c.vmSizeName === reject.vmSizeName,
        );
        const subIdx = claimIdx >= 0 ? srcState.claimedSubIdx[claimIdx] : undefined;
        const matchSub = subIdx !== undefined ? subClaims[subIdx] : undefined;
        const subClaimZone = matchSub?.zone ?? null;

        // Tier already attempted on this cluster for this SKU.
        const srcTier = claimIdx >= 0 ? srcState.claimedTiers[claimIdx] : 0;

        const sizeKey = vm.vmSizeName;
        const vmClassKey =
          (vmClassByName && vmClassByName[vm.vmSizeName]) || vm.vmGeneration || '';

        let remaining = reject.count;

        for (let tier = srcTier + 1; tier <= MAX_TIER && remaining > 0; tier++) {
          // Acceptor candidates at this tier in scope.
          const candidates: number[] = [];
          for (let ti = 0; ti < states.length; ti++) {
            const t = states[ti];
            if (ti === srcIdx) continue;
            if (subClaimZone && (t.fleet.zone ?? '') !== subClaimZone) continue;
            const p = matrixPriority(t.fleet, sizeKey, vmClassKey, fungibilityMatrix);
            if (p !== tier) continue;
            candidates.push(ti);
          }
          if (candidates.length === 0) continue;

          // Sort candidates by node-level free memory (rough proxy for
          // "where will it actually fit best"). Sum of free mem across
          // every non-reserved node.
          candidates.sort((a, b) => {
            const freeA = perCluster[a].nodeDetail.reduce(
              (s, n) => s + (n.state !== 'reserved' ? n.memoryTotalGib - n.memoryUsedGib : 0),
              0,
            );
            const freeB = perCluster[b].nodeDetail.reduce(
              (s, n) => s + (n.state !== 'reserved' ? n.memoryTotalGib - n.memoryUsedGib : 0),
              0,
            );
            return freeB - freeA;
          });

          for (const targetIdx of candidates) {
            if (remaining === 0) break;
            const target = states[targetIdx];
            const targetResult = perCluster[targetIdx];
            const placed = tryIncrementalPlace(targetResult, vm, remaining);
            if (placed > 0) {
              remaining -= placed;
              targetResult.vmsPlaced += placed;
              // Spillover event — labeled from the user's matrix tier-0
              // home (looked up across all clusters per fix B, not the
              // source cluster name).
              let homeName: string | undefined;
              for (const s of states) {
                if (matrixPriority(s.fleet, sizeKey, vmClassKey, fungibilityMatrix) === 0) {
                  homeName = s.fleet.hardwareGroupName;
                  break;
                }
              }
              if (homeName && homeName !== target.fleet.hardwareGroupName) {
                const key = `${reject.vmSizeName}|${homeName}|${target.fleet.hardwareGroupName}`;
                const existing = spilloverAcc.get(key);
                if (existing) {
                  existing.count += placed;
                } else {
                  spilloverAcc.set(key, {
                    vmSizeName: reject.vmSizeName,
                    fromGroup: homeName,
                    toGroup: target.fleet.hardwareGroupName,
                    count: placed,
                  });
                }
              }
            }
          }
        }

        if (remaining > 0) {
          // Couldn't fully cascade — keep the leftover quantity unplaceable
          // with its original reason (it's still the binding constraint).
          newRejects.push({ ...reject, count: remaining });
        }
      }

      srcResult.vmsUnplaceable = newRejects;
    }

    // Rebuild topLevelSpillovers since cascade may have added new events.
    topLevelSpillovers.length = 0;
    topLevelSpillovers.push(...Array.from(spilloverAcc.values()));
  }

  // v2.6 — Surface unplaced quantity per ORIGINAL BOM row. A row may be
  // partially placed (e.g. one zone landed, another zonal sub-claim couldn't
  // find a home), so we sum unplaced quantity across its sub-claims and
  // classify once. ZONE_NOT_IN_FLEET sub-claims were already emitted into
  // `extraZonalUnplaceable` so we skip those to avoid double-counting.
  const unplacedQtyByRow = new Map<number, number>();
  subClaims.forEach((sub, si) => {
    if (sub.zone !== null) {
      // Already surfaced in extraZonalUnplaceable when the zone missed; in
      // every other "zonal sub-claim couldn't fit" path the cascade
      // exhaustion is what we want to report below.
      const zoneMissed = extraZonalUnplaceable.some(
        (u) =>
          u.blockingReason === 'ZONE_NOT_IN_FLEET' &&
          u.vmSizeName === sub.entry.vmSizeName,
      );
      if (zoneMissed) return;
    }
    // v2.19.51 — Partial admission means a sub-claim can be both placed and
    // have a residual. Count whatever portion the cascade couldn't admit:
    //   - placedSubclaim=false → whole sub-claim was rejected (matrix path)
    //     OR legacy path with no matching cluster — full qty unplaced.
    //   - placedSubclaim=true + residual=N → N copies couldn't land in any
    //     accepting tier after partial admission.
    let unplacedHere = 0;
    if (!placedSubclaim[si]) {
      unplacedHere = sub.quantity;
    } else if (residualBySubclaim[si] > 0) {
      unplacedHere = residualBySubclaim[si];
    }
    if (unplacedHere === 0) return;
    unplacedQtyByRow.set(
      sub.originalIndex,
      (unplacedQtyByRow.get(sub.originalIndex) ?? 0) + unplacedHere,
    );
  });
  const extraUnplaceable: import('../types').UnplaceableEntry[] = [];
  for (const [rowIdx, qty] of unplacedQtyByRow) {
    const e = remainingBom[rowIdx];
    const cat = catalog.find(
      (c) => c.vmSizeName.toLowerCase() === e.vmSizeName.toLowerCase(),
    );
    const vmClassKey =
      (cat && vmClassByName && vmClassByName[cat.vmSizeName]) || cat?.vmGeneration || '';
    const { reason, details } = classifyUnclaimed(
      cat,
      clusters.map((c) => c.fleet),
      e.vmSizeName,
      vmClassKey,
      fungibilityMatrix,
    );
    extraUnplaceable.push({
      vmSizeName: e.vmSizeName,
      count: qty,
      blockingReason: reason,
      details,
    });
  }
  extraUnplaceable.push(...extraZonalUnplaceable);

  // Roll-up.
  const allNodes: NodeDetail[] = perCluster.flatMap((r) => r.nodeDetail);
  const sum = (key: keyof Pick<
    SimulatorResult,
    | 'totalNodes'
    | 'deployableNodesBefore'
    | 'reservedNodes'
    | 'nodesConsumed'
    | 'henRemaining'
    | 'strandedMemoryGib'
    | 'strandedVcpus'
    | 'vmsPlaced'
  >) => perCluster.reduce((s, r) => s + (r[key] as number), 0);

  const memUsed = allNodes
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.memoryUsedGib, 0);
  const memTotalOcc = allNodes
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.memoryTotalGib, 0);
  const vcpuUsed = allNodes
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.vcpusUsed, 0);
  const vcpuTotalOcc = allNodes
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.vcpusTotal, 0);

  return {
    totalNodes: sum('totalNodes'),
    deployableNodesBefore: sum('deployableNodesBefore'),
    reservedNodes: sum('reservedNodes'),
    nodesConsumed: sum('nodesConsumed'),
    henRemaining: sum('henRemaining'),
    strandedMemoryGib: sum('strandedMemoryGib'),
    strandedVcpus: sum('strandedVcpus'),
    memoryUtilizationPct: memTotalOcc > 0 ? (memUsed / memTotalOcc) * 100 : 0,
    vcpuUtilizationPct: vcpuTotalOcc > 0 ? (vcpuUsed / vcpuTotalOcc) * 100 : 0,
    vmsPlaced: sum('vmsPlaced'),
    vmsUnplaceable: [
      ...perCluster.flatMap((r) => r.vmsUnplaceable),
      ...extraUnplaceable,
    ],
    deploymentLimited: perCluster.some((r) => r.deploymentLimited),
    deploymentLimitReason: perCluster.find((r) => r.deploymentLimitReason)
      ?.deploymentLimitReason ?? null,
    // v2.4.2 — runMulti now authors SpilloverEvent records during the tier
    // cascade. Concat the per-cluster engine events (still empty in Phase 1
    // — the engine doesn't emit any) so future engine work doesn't lose
    // visibility.
    spilloverEvents: [
      ...topLevelSpillovers,
      ...perCluster.flatMap((r) => r.spilloverEvents),
    ],
    nodeDetail: allNodes,
  };
}

export function RunFooter() {
  const { state, dispatch } = useApp();
  const fungOn = state.fungibilityOn;
  const stale = state.isStale && state.result !== null;
  const canRun = state.bom.length > 0 && !state.isRunning;

  // v2.4 — proactively warn the user when their BOM × selected clusters
  // overlap an UNAUTHORED region of the fungibility matrix. Computed only
  // when fungibility is on AND the matrix has at least one cell, so it
  // doesn't nag users in the GCP-dedicated-host case (matrix empty).
  const fungibilityGap = (() => {
    if (!state.fungibilityOn) return null;
    const matrix = state.userFungibility;
    if (!matrix || Object.keys(matrix).length === 0) return null;
    const fleets = fleetList(state)
      .map(({ fleet }) => fleet)
      .filter((f) => !!f.hardwareGroupId);
    if (fleets.length === 0) return null;
    const missingPairs = new Set<string>();
    const missingVms = new Set<string>();
    for (const entry of state.bom) {
      const cat = state.userVms.find(
        (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
      );
      if (!cat) continue;
      // v2.19.17 — per-size routing: a pair is "missing" only when neither a
      // size-keyed nor a legacy class-keyed cell exists for it.
      const sizeKey = cat.vmSizeName;
      const vmClassKey = vmClass(cat);
      for (const f of fleets) {
        const hwId = f.hardwareGroupId!;
        const cell =
          matrix[sizeKey]?.[hwId] !== undefined
            ? matrix[sizeKey][hwId]
            : matrix[vmClassKey]?.[hwId];
        if (cell === undefined) {
          missingPairs.add(`${sizeKey}|${hwId}`);
          missingVms.add(cat.vmSizeName);
        }
      }
    }
    if (missingPairs.size === 0) return null;
    return { pairCount: missingPairs.size, vmCount: missingVms.size };
  })();

  const run = async () => {
    dispatch({ type: 'RUN_START' });
    const start = performance.now();
    // v3 (S25) — orchestration extracted to the shared buildAndRunSimulation()
    // so the Simple track triggers the engine identically (region-scoped
    // catalog + vmClassByName + live HW index). Engine never forks.
    const result = buildAndRunSimulation(state);
    const elapsed = performance.now() - start;
    if (elapsed < 400) await new Promise((r) => setTimeout(r, 400 - elapsed));
    dispatch({ type: 'RUN_COMPLETE', result });
    // v2.17 — Auto-collapse the Configure sidebar after a successful run so
    // the visualization gets the canvas. User can re-open via the header pane
    // toggles. Only fires when the sidebar is currently open + canvas is
    // visible (avoids clobbering a user who deliberately split panes).
    // v2.19.51 — Also collapse the Insights pane so post-run focus lands on
    // the viz. Re-opens automatically the moment the user clicks a node,
    // stat tile, or scope target (NODE_TOGGLE / NODE_SELECT / STAT_SELECT /
    // SCOPE_SET all flip detailPaneCollapsed back to false in AppState).
    if (!state.ui.sidebarCollapsed && !state.ui.canvasCollapsed) {
      dispatch({
        type: 'UI_SET',
        ui: { sidebarCollapsed: true, detailPaneCollapsed: true },
      });
    } else if (!state.ui.detailPaneCollapsed) {
      dispatch({ type: 'UI_SET', ui: { detailPaneCollapsed: true } });
    }
  };

  return (
    <div
      className="p-4 border-t border-border"
      style={{
        // v3 substrate (S24 Pilot #1) — flat surface replaces the 40px
        // backdrop blur. Pane chrome is now uniform across sidebar +
        // canvas + insights + run footer.
        background: 'var(--surface)',
      }}
    >
      {fungibilityGap && (
        <div
          className="mb-3 px-3 py-2 text-[11px] leading-snug"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.40)',
            color: '#FCD34D',
            borderRadius: 'var(--radius-md)',
          }}
          title="Open the Fungibility tab to author rules for these (VM × HW) pairs. The engine will refuse them otherwise."
        >
          <strong>⚠ Fungibility recommended:</strong> {fungibilityGap.vmCount} VM size
          {fungibilityGap.vmCount === 1 ? '' : 's'} in your BOM ×{' '}
          {fungibilityGap.pairCount} cluster pair{fungibilityGap.pairCount === 1 ? '' : 's'} are
          not authored in your matrix.{' '}
          <button
            onClick={() => dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fungibility' } })}
            className="underline hover:text-text-primary transition-colors"
            style={{ color: 'inherit' }}
          >
            Open Fungibility tab
          </button>
        </div>
      )}
      <button
        onClick={run}
        disabled={!canRun}
        className="btn-primary relative w-full text-sm tracking-[0.18em]"
        style={{ height: 48 }}
      >
        {state.isRunning ? '⟳  Simulating…' : '▶  Run simulation'}
        {stale && (
          <span
            className="absolute right-3 top-3 rounded-full"
            style={{
              width: 8,
              height: 8,
              background: 'var(--accent-amber)',
              boxShadow: '0 0 8px var(--accent-amber)',
            }}
            title="Inputs changed — results may be stale"
          />
        )}
      </button>

      {/* v2.11.1 — Packing-mode + Fungibility toggles removed from the UI.
          SMART is always the right default for end users (BFD beats BOM
          order in every real-world scenario; STRICT only matters for the
          PRD Scenario B test which lives in simulator.test.ts).
          Fungibility-on is also always the right default (matrix takes
          precedence when authored, ignored when empty). The underlying
          state.packingMode + state.fungibilityOn fields are retained for
          engine flexibility but no longer user-toggleable here. */}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// v2.19.23 — tryIncrementalPlace
// Strictly-additive placement onto an existing per-cluster result. Scans
// nodeDetail looking for any node with capacity across all four dimensions
// (mem · vCPU · network · storage) and packs up to `count` copies of `vm`
// onto it. Honors reserved + isolated states. Updates node state, used
// totals, stranded counts, and the cluster-level cached stats so the final
// rollup picks up the new placements without re-running the engine.
// Returns the number actually placed (0..count).
// ──────────────────────────────────────────────────────────────────────────
function tryIncrementalPlace(
  clusterResult: SimulatorResult,
  vm: import('../types').CatalogEntry,
  count: number,
): number {
  let placed = 0;
  for (const node of clusterResult.nodeDetail) {
    if (placed >= count) break;
    if (node.state === 'reserved' || node.state === 'ofr') continue;
    if (node.isolated && node.vmsPlaced.length > 0) continue;
    // Fail fast if any dimension can't even fit one.
    if (node.memoryUsedGib + vm.memoryGib > node.memoryTotalGib) continue;
    if (node.vcpusUsed + vm.vcpus > node.vcpusTotal) continue;
    const vmNetMbps = vm.networkMbps ?? 0;
    if (
      node.throughputTotalMbps != null &&
      vmNetMbps > 0 &&
      node.throughputUsedMbps + vmNetMbps > node.throughputTotalMbps
    ) {
      continue;
    }
    const vmStorMbps = vm.remoteStorageMbpsPremium ?? 0;
    if (
      node.storageThroughputTotalMbps != null &&
      vmStorMbps > 0 &&
      node.storageThroughputUsedMbps + vmStorMbps >
        node.storageThroughputTotalMbps
    ) {
      continue;
    }
    // Compute the dimension-bounded max copies that fit on this single node.
    let canFit = count - placed;
    canFit = Math.min(
      canFit,
      Math.floor((node.memoryTotalGib - node.memoryUsedGib) / vm.memoryGib),
    );
    canFit = Math.min(
      canFit,
      Math.floor((node.vcpusTotal - node.vcpusUsed) / vm.vcpus),
    );
    if (node.throughputTotalMbps != null && vmNetMbps > 0) {
      canFit = Math.min(
        canFit,
        Math.floor((node.throughputTotalMbps - node.throughputUsedMbps) / vmNetMbps),
      );
    }
    if (node.storageThroughputTotalMbps != null && vmStorMbps > 0) {
      canFit = Math.min(
        canFit,
        Math.floor(
          (node.storageThroughputTotalMbps - node.storageThroughputUsedMbps) / vmStorMbps,
        ),
      );
    }
    if (node.isolated) canFit = Math.min(canFit, 1);
    if (canFit <= 0) continue;
    // Place canFit copies on this node, updating used totals + state.
    for (let i = 0; i < canFit; i++) {
      node.vmsPlaced.push({
        vmSizeName: vm.vmSizeName,
        vcpus: vm.vcpus,
        memoryGib: vm.memoryGib,
        vmGeneration: vm.vmGeneration,
      });
    }
    node.memoryUsedGib += vm.memoryGib * canFit;
    node.vcpusUsed += vm.vcpus * canFit;
    node.throughputUsedMbps += vmNetMbps * canFit;
    if (node.storageThroughputTotalMbps != null) {
      node.storageThroughputUsedMbps += vmStorMbps * canFit;
    }
    node.strandedMemoryGib = node.memoryTotalGib - node.memoryUsedGib;
    node.strandedVcpus = node.vcpusTotal - node.vcpusUsed;
    // Promote to occupied. Full vs partial uses the same priority the engine
    // uses (MEMORY > VCPU > NETWORK > STORAGE).
    const memFull = node.memoryUsedGib >= node.memoryTotalGib;
    const vcpuFull = node.vcpusUsed >= node.vcpusTotal;
    const netFull =
      node.throughputTotalMbps != null &&
      node.throughputUsedMbps >= node.throughputTotalMbps;
    const storFull =
      node.storageThroughputTotalMbps != null &&
      node.storageThroughputUsedMbps >= node.storageThroughputTotalMbps;
    if (memFull || vcpuFull || netFull || storFull) {
      node.state = 'occupied-full';
    } else if (node.state === 'deployable') {
      node.state = 'occupied-partial';
    }
    placed += canFit;
  }
  // Recompute cached cluster-level stats touched by the placements so the
  // rollup at the end of runMulti picks them up.
  if (placed > 0) {
    clusterResult.nodesConsumed = clusterResult.nodeDetail.filter(
      (n) => n.vmsPlaced.length > 0,
    ).length;
    clusterResult.strandedMemoryGib = clusterResult.nodeDetail
      .filter((n) => n.vmsPlaced.length > 0)
      .reduce((s, n) => s + n.strandedMemoryGib, 0);
    clusterResult.strandedVcpus = clusterResult.nodeDetail
      .filter((n) => n.vmsPlaced.length > 0)
      .reduce((s, n) => s + n.strandedVcpus, 0);
    // henRemaining is "headroom-equivalent nodes" — recompute conservatively
    // as deployable - consumed for the simple case. Skipped here since this
    // value is informational and the rollup re-sums anyway.
  }
  return placed;
}

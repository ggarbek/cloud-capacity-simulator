/**
 * v2.19.25 — Defrag pass.
 *
 * Post-run optimizer that moves already-placed VMs to make room for VMs
 * that ended up unplaceable. DISTINCT from spillover/cascade (which
 * finishes a never-landed VM's tier walk and never displaces a placed
 * one) — defrag is an active intervention with real customer-visible
 * migration cost.
 *
 * Doctrine:
 *  - Strictly net-positive: every accepted migration must produce a
 *    placement that would otherwise be unplaceable. Net VMs placed
 *    cannot decrease.
 *  - Strictly additive on the result object: `buildDefragPlan` clones the
 *    SimulatorResult internally and mutates the clone; the caller's
 *    original is untouched until `applyDefragPlan` is invoked.
 *  - Scope-respecting: zonal sub-claims must stay in their zone. We don't
 *    have sub-claim info post-run, so we approximate by keeping the
 *    relocation target in the SAME zone as the evicted VM's original
 *    cluster. Regional VMs can land anywhere.
 *  - Fungibility-respecting: every move passes the user's matrix gate
 *    (size-first, class-fallback per v2.19.24 doctrine).
 *  - Utility nodes never participate (they don't host workload).
 *  - Bounded effort: per unplaceable VM the planner evaluates target
 *    nodes in scope and at most `maxEvictionsPerVm` evictions per slot
 *    (default 1 — the simplest, lowest-cost defrag pattern).
 */
import type {
  CatalogEntry,
  FleetSpec,
  NodeDetail,
  PlacedVm,
  SimulatorResult,
  UnplaceableEntry,
} from '../types';
import { HOURS_PER_MONTH } from '../types';
import { vmClass } from '../utils/vmTaxonomy';

export interface DefragMigration {
  /** SKU being relocated. */
  vmSizeName: string;
  /** Node the VM is being evicted from. */
  sourceNodeId: string;
  /** Node the VM lands on. */
  targetNodeId: string;
  sourceClusterId: string;
  targetClusterId: string;
  /** Human-readable why — surfaces in the UI table row. */
  reason: string;
}

export interface DefragPlacement {
  /** SKU being placed that was previously unplaceable. */
  vmSizeName: string;
  /** Node the previously-unplaceable VM lands on. */
  targetNodeId: string;
  targetClusterId: string;
  /** SKUs whose eviction freed the slot. */
  freedBy: string[];
}

export interface DefragPlan {
  migrations: DefragMigration[];
  placements: DefragPlacement[];
  netVmsGained: number;
  monthlyUsdGained: number;
}

export interface DefragOptions {
  /** Max number of placed VMs to evict per unplaceable slot. Default 1
   *  (single-eviction swap — the cheapest and most explainable plan). */
  maxEvictionsPerVm?: number;
}

export interface DefragInputs {
  result: SimulatorResult;
  fleets: Array<{ id: string; fleet: FleetSpec }>;
  catalog: CatalogEntry[];
  matrix?: Record<string, Record<string, number | 'blocked'>>;
}

// ────────────────────────────────────────────────────────────────────────
// Clone helpers
// ────────────────────────────────────────────────────────────────────────

function cloneNode(n: NodeDetail): NodeDetail {
  return {
    ...n,
    vmsPlaced: n.vmsPlaced.map((v) => ({ ...v })),
  };
}

export function cloneResult(r: SimulatorResult): SimulatorResult {
  return {
    ...r,
    vmsUnplaceable: r.vmsUnplaceable.map((u) => ({ ...u })),
    spilloverEvents: r.spilloverEvents.map((s) => ({ ...s })),
    nodeDetail: r.nodeDetail.map(cloneNode),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Fungibility — size-first, class-fallback (v2.19.24 doctrine).
// Mirrors fungibilityAllows() in insights.ts.
// ────────────────────────────────────────────────────────────────────────

function fungibilityAllows(
  vm: CatalogEntry,
  hwGroupId: string | undefined,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
): boolean {
  if (!matrix || Object.keys(matrix).length === 0) return true;
  if (!hwGroupId) return true;
  const sizeCell = matrix[vm.vmSizeName]?.[hwGroupId];
  if (sizeCell !== undefined) return sizeCell !== 'blocked';
  const classCell = matrix[vmClass(vm)]?.[hwGroupId];
  if (classCell === undefined) return false;
  return classCell !== 'blocked';
}

// ────────────────────────────────────────────────────────────────────────
// Capacity helpers
// ────────────────────────────────────────────────────────────────────────

interface Spec {
  mem: number;
  vcpu: number;
  net: number;
  stor: number;
}

function specOf(vm: CatalogEntry): Spec {
  return {
    mem: vm.memoryGib,
    vcpu: vm.vcpus,
    net: vm.networkMbps ?? 0,
    stor: vm.remoteStorageMbpsPremium ?? 0,
  };
}

/** Does this node fit one copy of `vm` right now, given all four dims? */
function nodeFitsVm(node: NodeDetail, vm: CatalogEntry): boolean {
  if (node.state === 'reserved' || node.state === 'ofr') return false;
  if (node.isolated && node.vmsPlaced.length > 0) return false;
  const s = specOf(vm);
  if (node.memoryUsedGib + s.mem > node.memoryTotalGib) return false;
  if (node.vcpusUsed + s.vcpu > node.vcpusTotal) return false;
  if (
    node.throughputTotalMbps != null &&
    s.net > 0 &&
    node.throughputUsedMbps + s.net > node.throughputTotalMbps
  )
    return false;
  if (
    node.storageThroughputTotalMbps != null &&
    s.stor > 0 &&
    node.storageThroughputUsedMbps + s.stor > node.storageThroughputTotalMbps
  )
    return false;
  if (node.isolated) {
    // Isolated: 1 VM per node, vmsPlaced must currently be empty (covered
    // above) — no further check needed.
  }
  return true;
}

/** Place a VM on a node — mutates. Caller must have verified fit. */
function placeOnNode(node: NodeDetail, placed: PlacedVm, spec: Spec): void {
  node.vmsPlaced.push(placed);
  node.memoryUsedGib += spec.mem;
  node.vcpusUsed += spec.vcpu;
  node.throughputUsedMbps += spec.net;
  if (node.storageThroughputTotalMbps != null) {
    node.storageThroughputUsedMbps += spec.stor;
  }
  node.strandedMemoryGib = node.memoryTotalGib - node.memoryUsedGib;
  node.strandedVcpus = node.vcpusTotal - node.vcpusUsed;
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
}

/** Evict a placed VM at `idx` — mutates. */
function evictFromNode(node: NodeDetail, idx: number, spec: Spec): void {
  node.vmsPlaced.splice(idx, 1);
  node.memoryUsedGib -= spec.mem;
  node.vcpusUsed -= spec.vcpu;
  node.throughputUsedMbps -= spec.net;
  if (node.storageThroughputTotalMbps != null) {
    node.storageThroughputUsedMbps -= spec.stor;
  }
  node.strandedMemoryGib = node.memoryTotalGib - node.memoryUsedGib;
  node.strandedVcpus = node.vcpusTotal - node.vcpusUsed;
  if (node.vmsPlaced.length === 0) {
    if (node.isolated) node.state = 'isolated';
    else node.state = 'deployable';
  } else {
    // Demote occupied-full → occupied-partial if any dim now has slack.
    const memFull = node.memoryUsedGib >= node.memoryTotalGib;
    const vcpuFull = node.vcpusUsed >= node.vcpusTotal;
    const netFull =
      node.throughputTotalMbps != null &&
      node.throughputUsedMbps >= node.throughputTotalMbps;
    const storFull =
      node.storageThroughputTotalMbps != null &&
      node.storageThroughputUsedMbps >= node.storageThroughputTotalMbps;
    if (!(memFull || vcpuFull || netFull || storFull)) {
      node.state = 'occupied-partial';
    }
  }
}

// ────────────────────────────────────────────────────────────────────────
// buildDefragPlan
// ────────────────────────────────────────────────────────────────────────

export function buildDefragPlan(inputs: DefragInputs, opts: DefragOptions = {}): DefragPlan {
  const maxEvictions = Math.max(1, opts.maxEvictionsPerVm ?? 1);
  const { result, fleets, catalog, matrix } = inputs;

  // Work on a clone so the search can mutate freely without touching the
  // caller's result. The plan is the sequence of (eviction, placement)
  // pairs the search proved feasible.
  const work = cloneResult(result);
  const catBySku = new Map<string, CatalogEntry>();
  for (const c of catalog) catBySku.set(c.vmSizeName, c);

  const fleetById = new Map<string, FleetSpec>();
  for (const { id, fleet } of fleets) fleetById.set(id, fleet);

  // Walk unplaceables sorted by largest memory first (biggest unlock per
  // migration tends to be the highest-value swap to surface).
  const orderedUnplaceables: UnplaceableEntry[] = [...work.vmsUnplaceable].sort((a, b) => {
    const ca = catBySku.get(a.vmSizeName);
    const cb = catBySku.get(b.vmSizeName);
    const ma = ca?.memoryGib ?? 0;
    const mb = cb?.memoryGib ?? 0;
    return mb - ma;
  });

  const migrations: DefragMigration[] = [];
  const placements: DefragPlacement[] = [];
  let monthlyUsdGained = 0;

  // Remaining counts (consume as we plan placements).
  const remaining = new Map<string, number>();
  for (const u of orderedUnplaceables) {
    remaining.set(u.vmSizeName, (remaining.get(u.vmSizeName) ?? 0) + u.count);
  }

  for (const u of orderedUnplaceables) {
    const unplaceVm = catBySku.get(u.vmSizeName);
    if (!unplaceVm) continue;
    const unplaceSpec = specOf(unplaceVm);

    let placedHere = 0;
    const wanted = remaining.get(u.vmSizeName) ?? 0;
    if (wanted === 0) continue;

    for (let attempt = 0; attempt < wanted; attempt++) {
      // For each unplaced copy, try to find ANY (target node, eviction set)
      // pair such that:
      //   - target's fungibility allows the unplaceable VM
      //   - after evicting K placed VMs (K ≤ maxEvictions), the target has
      //     room for the unplaceable VM
      //   - every evicted VM has its own relocation target on a DIFFERENT
      //     node (no shell game where eviction-A undoes placement-B)
      //   - net VMs placed strictly increases (the (K+1) > K invariant)
      const candidate = findEvictionPlan(
        work,
        unplaceVm,
        unplaceSpec,
        maxEvictions,
        matrix,
        fleetById,
      );
      if (!candidate) break;

      // Apply the plan to the working clone so subsequent attempts see the
      // updated capacity. Also record migrations + the placement.
      for (const ev of candidate.evictions) {
        const evCat = catBySku.get(ev.placed.vmSizeName);
        const evSpec = evCat
          ? specOf(evCat)
          : {
              mem: ev.placed.memoryGib,
              vcpu: ev.placed.vcpus,
              net: 0,
              stor: 0,
            };
        evictFromNode(ev.sourceNode, ev.indexAtSource, evSpec);
        // Place onto the relocation target.
        placeOnNode(ev.targetNode, ev.placed, evSpec);
        migrations.push({
          vmSizeName: ev.placed.vmSizeName,
          sourceNodeId: ev.sourceNode.nodeId,
          targetNodeId: ev.targetNode.nodeId,
          sourceClusterId: ev.sourceNode.clusterId ?? '',
          targetClusterId: ev.targetNode.clusterId ?? '',
          reason: candidate.reasonByEviction[ev.placed.vmSizeName] ?? `freed slot for ${u.vmSizeName}`,
        });
      }
      // Now place the previously-unplaceable VM on the target.
      placeOnNode(
        candidate.targetNode,
        {
          vmSizeName: unplaceVm.vmSizeName,
          vcpus: unplaceVm.vcpus,
          memoryGib: unplaceVm.memoryGib,
          vmGeneration: unplaceVm.vmGeneration,
        },
        unplaceSpec,
      );
      placements.push({
        vmSizeName: unplaceVm.vmSizeName,
        targetNodeId: candidate.targetNode.nodeId,
        targetClusterId: candidate.targetNode.clusterId ?? '',
        freedBy: candidate.evictions.map((e) => e.placed.vmSizeName),
      });
      placedHere += 1;

      const hourly = unplaceVm.hourlyUsd ?? 0;
      monthlyUsdGained += hourly * HOURS_PER_MONTH;
    }

    if (placedHere > 0) {
      remaining.set(u.vmSizeName, wanted - placedHere);
    }
  }

  return {
    migrations,
    placements,
    netVmsGained: placements.length,
    monthlyUsdGained,
  };
}

interface Eviction {
  sourceNode: NodeDetail;
  indexAtSource: number;
  targetNode: NodeDetail;
  placed: PlacedVm;
}

interface EvictionPlan {
  targetNode: NodeDetail;
  evictions: Eviction[];
  reasonByEviction: Record<string, string>;
}

/**
 * Search for a feasible eviction plan that frees enough room on SOME node
 * for `unplaceVm`. Strategy:
 *
 *   1. Iterate candidate placement targets (every occupied-partial /
 *      occupied-full node where fungibility allows unplaceVm).
 *   2. For each candidate, compute the per-dim deficit.
 *   3. Find the smallest set of placed VMs whose evictions clear the
 *      deficit (greedy: prefer single-eviction; if maxEvictions > 1,
 *      try 2-VM and 3-VM bundles).
 *   4. For each chosen evictee, locate a relocation target (any
 *      fungibility-allowed, capacity-having node in the same zone, NOT
 *      the same node we're trying to free).
 *   5. The candidate target must NOT itself be one of the relocation
 *      targets (else placing the evictee + the unplaceable would
 *      double-claim).
 *
 * Returns the cheapest plan (fewest evictions). Null if no plan found.
 */
function findEvictionPlan(
  work: SimulatorResult,
  unplaceVm: CatalogEntry,
  unplaceSpec: Spec,
  maxEvictions: number,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
  fleetById: Map<string, FleetSpec>,
): EvictionPlan | null {
  // Pre-build cluster zone lookup.
  const zoneOf = (clusterId: string | undefined): string =>
    clusterId ? fleetById.get(clusterId)?.zone ?? '' : '';

  // Try cheapest first. Single-eviction → done; otherwise climb.
  for (let k = 1; k <= maxEvictions; k++) {
    for (const target of work.nodeDetail) {
      if (target.state === 'reserved' || target.state === 'ofr') continue;
      if (target.isolated && target.vmsPlaced.length > 0) continue;
      if (target.vmsPlaced.length === 0) continue; // no one to evict here
      const tFleet = target.clusterId ? fleetById.get(target.clusterId) : undefined;
      if (!fungibilityAllows(unplaceVm, tFleet?.hardwareGroupId, matrix)) continue;

      // What deficit do we have?
      const memDef = unplaceSpec.mem - (target.memoryTotalGib - target.memoryUsedGib);
      const vcpuDef = unplaceSpec.vcpu - (target.vcpusTotal - target.vcpusUsed);
      const netDef =
        target.throughputTotalMbps != null && unplaceSpec.net > 0
          ? unplaceSpec.net - (target.throughputTotalMbps - target.throughputUsedMbps)
          : 0;
      const storDef =
        target.storageThroughputTotalMbps != null && unplaceSpec.stor > 0
          ? unplaceSpec.stor -
            (target.storageThroughputTotalMbps - target.storageThroughputUsedMbps)
          : 0;
      // No deficit at all means the VM fits right now — would've been
      // caught by the engine. Skip.
      if (memDef <= 0 && vcpuDef <= 0 && netDef <= 0 && storDef <= 0) continue;

      const tZone = zoneOf(target.clusterId);

      // Pick K placed VMs from this node such that their combined spec
      // clears every dim's deficit. Sorting candidates by mem desc tends
      // to clear deficits fastest with the fewest evictions.
      const localPlaced = target.vmsPlaced.map((p, idx) => ({ p, idx }));
      localPlaced.sort((a, b) => b.p.memoryGib - a.p.memoryGib);

      const found = findEvicteeBundle(
        localPlaced,
        { mem: memDef, vcpu: vcpuDef, net: netDef, stor: storDef },
        k,
        work,
        target,
        tZone,
        fleetById,
        matrix,
      );
      if (!found) continue;
      return {
        targetNode: target,
        evictions: found.evictions,
        reasonByEviction: found.reasonByEviction,
      };
    }
  }
  return null;
}

interface FoundBundle {
  evictions: Eviction[];
  reasonByEviction: Record<string, string>;
}

/**
 * Pick exactly `k` placed VMs from `localPlaced` whose evictions clear
 * the supplied deficit AND each have a relocation target. Returns the
 * first feasible bundle found (greedy — not exhaustive). When k > 3 we
 * cap the search to avoid combinatorial blowup.
 */
function findEvicteeBundle(
  localPlaced: Array<{ p: PlacedVm; idx: number }>,
  deficit: Spec,
  k: number,
  work: SimulatorResult,
  target: NodeDetail,
  targetZone: string,
  fleetById: Map<string, FleetSpec>,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
): FoundBundle | null {
  // We don't have the full CatalogEntry for placed VMs — `PlacedVm` only
  // carries name + mem + vcpu + generation. Net/storage usage isn't
  // tracked per-VM in the node detail, so we conservatively pessimize
  // net/stor freed = 0 unless the unplaceable VM has no net/stor demand.
  // This still produces correct mem/vcpu swaps which is the common case.

  // Build a candidate list with "would-this-work-as-a-relocatee" lookups
  // memoized at call time.
  const reasonByEviction: Record<string, string> = {};

  // Generate combinations of EXACTLY size k. For k > 3 we cap (the outer
  // loop never exceeds maxEvictionsPerVm, and that knob caps at 3 by
  // default anyway).
  const exactK = Math.min(k, 3);
  const n = localPlaced.length;

  function checkBundle(picks: number[]): FoundBundle | null {
    let freedMem = 0,
      freedVcpu = 0;
    for (const i of picks) {
      freedMem += localPlaced[i].p.memoryGib;
      freedVcpu += localPlaced[i].p.vcpus;
    }
    if (deficit.mem > 0 && freedMem < deficit.mem) return null;
    if (deficit.vcpu > 0 && freedVcpu < deficit.vcpu) return null;
    // Net + storage: if the unplaceable VM doesn't demand them, treat as
    // cleared. Otherwise we can't safely compute the freed amount.
    if (deficit.net > 0) return null;
    if (deficit.stor > 0) return null;

    // Every evictee needs a relocation target distinct from the source
    // AND distinct from the candidate target (which is about to receive
    // the unplaceable VM).
    const evictions: Eviction[] = [];
    // Track planned target nodes so two evictees from the same source
    // node don't both fight for the same single open slot elsewhere —
    // we apply each plan to a snapshot count before re-evaluating.
    // Cheap proxy: build a temp counter of used slots per target and
    // re-check fit including that delta.
    interface PendingClaim {
      node: NodeDetail;
      mem: number;
      vcpu: number;
    }
    const pendingClaims: PendingClaim[] = [];
    for (const i of picks) {
      const placedVm = localPlaced[i].p;
      // Look up a relocation target. Honor pending claims (a previously
      // planned evictee in this same bundle already reserved capacity
      // there).
      const relocVm: CatalogEntry = {
        vmSizeName: placedVm.vmSizeName,
        vmGeneration: placedVm.vmGeneration ?? '',
        series: '',
        memoryCategory: 'Medium Memory (MM)',
        homeHardwareGroup: '',
        spilloverTarget: 'N/A',
        processor: '',
        vcpus: placedVm.vcpus,
        memoryGib: placedVm.memoryGib,
        networkMbps: 0,
        localDiskGib: 0,
        status: '',
        notes: '',
      };
      const reloc = findRelocTargetWithPending(
        work,
        relocVm,
        target.nodeId,
        targetZone,
        fleetById,
        matrix,
        pendingClaims,
      );
      if (!reloc) return null;
      pendingClaims.push({
        node: reloc,
        mem: placedVm.memoryGib,
        vcpu: placedVm.vcpus,
      });
      evictions.push({
        sourceNode: target,
        indexAtSource: localPlaced[i].idx,
        targetNode: reloc,
        placed: placedVm,
      });
      reasonByEviction[placedVm.vmSizeName] = `moved from ${target.nodeId} → ${reloc.nodeId} to free ${placedVm.memoryGib} GiB / ${placedVm.vcpus} vCPU`;
    }
    return { evictions, reasonByEviction };
  }

  if (exactK === 1) {
    for (let a = 0; a < n; a++) {
      const r = checkBundle([a]);
      if (r) return r;
    }
  } else if (exactK === 2) {
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const r = checkBundle([a, b]);
        if (r) return r;
      }
    }
  } else if (exactK === 3) {
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        for (let c = b + 1; c < n; c++) {
          const r = checkBundle([a, b, c]);
          if (r) return r;
        }
      }
    }
  }
  return null;
}

function findRelocTargetWithPending(
  work: SimulatorResult,
  evictedVm: CatalogEntry,
  sourceNodeId: string,
  sourceZone: string,
  fleetById: Map<string, FleetSpec>,
  matrix: Record<string, Record<string, number | 'blocked'>> | undefined,
  pending: Array<{ node: NodeDetail; mem: number; vcpu: number }>,
): NodeDetail | null {
  const zoneOf = (clusterId: string | undefined): string =>
    clusterId ? fleetById.get(clusterId)?.zone ?? '' : '';

  for (const target of work.nodeDetail) {
    if (target.nodeId === sourceNodeId) continue;
    if (target.state === 'reserved' || target.state === 'ofr') continue;
    if (target.isolated && target.vmsPlaced.length > 0) continue;
    const tZone = zoneOf(target.clusterId);
    // Same-zone: empty matches empty (regional), non-empty must match.
    if (sourceZone && tZone && sourceZone !== tZone) continue;
    if (sourceZone && !tZone) continue;
    if (!sourceZone && tZone) continue;
    const tFleet = target.clusterId ? fleetById.get(target.clusterId) : undefined;
    if (!fungibilityAllows(evictedVm, tFleet?.hardwareGroupId, matrix)) continue;

    // Compute effective remaining mem/vcpu after pending claims.
    let memUsed = target.memoryUsedGib;
    let vcpuUsed = target.vcpusUsed;
    for (const pc of pending) {
      if (pc.node.nodeId === target.nodeId) {
        memUsed += pc.mem;
        vcpuUsed += pc.vcpu;
      }
    }
    if (memUsed + evictedVm.memoryGib > target.memoryTotalGib) continue;
    if (vcpuUsed + evictedVm.vcpus > target.vcpusTotal) continue;
    if (target.isolated && target.vmsPlaced.length === 0) {
      // Isolated nodes can host 1 VM only. If multiple pending claims
      // already target this node, skip.
      const onThisNode = pending.filter((pc) => pc.node.nodeId === target.nodeId).length;
      if (onThisNode > 0) continue;
    }
    return target;
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────
// applyDefragPlan — execute a plan against a result, returning a NEW
// result with placements applied. Original is untouched.
// ────────────────────────────────────────────────────────────────────────

export function applyDefragPlan(
  result: SimulatorResult,
  plan: DefragPlan,
  catalog: CatalogEntry[],
): SimulatorResult {
  const next = cloneResult(result);
  const byNodeId = new Map<string, NodeDetail>();
  for (const n of next.nodeDetail) byNodeId.set(n.nodeId, n);
  const catBySku = new Map<string, CatalogEntry>();
  for (const c of catalog) catBySku.set(c.vmSizeName, c);

  // Apply migrations first (evict + place each VM on its relocation
  // target). Order matters when two migrations chain through the same
  // node — emit in plan order.
  for (const m of plan.migrations) {
    const source = byNodeId.get(m.sourceNodeId);
    const target = byNodeId.get(m.targetNodeId);
    if (!source || !target) continue;
    const idx = source.vmsPlaced.findIndex((v) => v.vmSizeName === m.vmSizeName);
    if (idx < 0) continue;
    const placed = source.vmsPlaced[idx];
    const cat = catBySku.get(placed.vmSizeName);
    const spec: Spec = cat
      ? specOf(cat)
      : { mem: placed.memoryGib, vcpu: placed.vcpus, net: 0, stor: 0 };
    evictFromNode(source, idx, spec);
    placeOnNode(target, placed, spec);
  }

  // Apply placements (previously unplaceable VMs land on their target
  // nodes). Decrement vmsUnplaceable counts as we go.
  let placedTotal = 0;
  for (const p of plan.placements) {
    const target = byNodeId.get(p.targetNodeId);
    if (!target) continue;
    const cat = catBySku.get(p.vmSizeName);
    if (!cat) continue;
    const spec = specOf(cat);
    placeOnNode(
      target,
      {
        vmSizeName: cat.vmSizeName,
        vcpus: cat.vcpus,
        memoryGib: cat.memoryGib,
        vmGeneration: cat.vmGeneration,
      },
      spec,
    );
    placedTotal += 1;
    // Decrement unplaceable entry by 1.
    const ui = next.vmsUnplaceable.findIndex((u) => u.vmSizeName === p.vmSizeName);
    if (ui >= 0) {
      next.vmsUnplaceable[ui] = {
        ...next.vmsUnplaceable[ui],
        count: next.vmsUnplaceable[ui].count - 1,
      };
    }
  }
  next.vmsUnplaceable = next.vmsUnplaceable.filter((u) => u.count > 0);
  next.vmsPlaced += placedTotal;
  next.nodesConsumed = next.nodeDetail.filter((n) => n.vmsPlaced.length > 0).length;
  next.strandedMemoryGib = next.nodeDetail
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.strandedMemoryGib, 0);
  next.strandedVcpus = next.nodeDetail
    .filter((n) => n.vmsPlaced.length > 0)
    .reduce((s, n) => s + n.strandedVcpus, 0);

  // Recompute util% (occupied nodes only — same convention as runMulti).
  const occ = next.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
  const memUsed = occ.reduce((s, n) => s + n.memoryUsedGib, 0);
  const memTotal = occ.reduce((s, n) => s + n.memoryTotalGib, 0);
  const vcpuUsed = occ.reduce((s, n) => s + n.vcpusUsed, 0);
  const vcpuTotal = occ.reduce((s, n) => s + n.vcpusTotal, 0);
  next.memoryUtilizationPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
  next.vcpuUtilizationPct = vcpuTotal > 0 ? (vcpuUsed / vcpuTotal) * 100 : 0;

  return next;
}

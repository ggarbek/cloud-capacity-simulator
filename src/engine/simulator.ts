/**
 * VM Capacity Simulator — pure simulation engine.
 * Same inputs always produce same outputs. No UI logic.
 *
 * Implements PRD v4.0 §9 — Phase 1 single-hardware-group packing.
 * Passes acceptance Scenarios A/B/C from PRD §10.
 */
import type {
  BindingConstraint,
  BlockingReason,
  BomEntry,
  BufferSpec,
  CatalogEntry,
  FleetSpec,
  NodeDetail,
  PlacedVm,
  SimulatorInput,
  SimulatorResult,
  UnplaceableEntry,
} from '../types';
import { totalNodes, vcpusPerNode } from '../types';

// ────────────────────────────────────────────────────────────────────────
// Buffer resolution — PRD §9.3
// ────────────────────────────────────────────────────────────────────────
function resolveReserved(buffer: BufferSpec, total: number): number {
  if (buffer.mode === 'pct') {
    return Math.ceil(total * (Math.max(0, buffer.value) / 100));
  }
  return Math.min(total, Math.max(0, Math.floor(buffer.value)));
}

// ────────────────────────────────────────────────────────────────────────
// Catalog lookup — PRD §8.1
// ────────────────────────────────────────────────────────────────────────
function lookupCatalog(catalog: CatalogEntry[], name: string): CatalogEntry | undefined {
  const target = name.trim().toLowerCase();
  return catalog.find((c) => c.vmSizeName.toLowerCase() === target);
}

// ────────────────────────────────────────────────────────────────────────
// VM expansion — flatten BOM into individual VM instances
// ────────────────────────────────────────────────────────────────────────
interface VmInstance {
  vmSizeName: string;
  vcpus: number;
  memoryGib: number;
  /** v2.9 — Network bandwidth this VM consumes in Mbps. 0 / undefined means
   *  the VM has no published network requirement (back-compat with pre-v2.9
   *  catalogs); the network constraint is effectively skipped. */
  networkMbps: number;
  /** Premium SSD storage throughput this VM consumes in MB/s (bytes, not
   *  bits). 0 = back-compat skip. Engine enforces as the 4th constraint. */
  storageMbps: number;
  /** Carried so the fungibility pre-flight can match against fleet.homeFor /
   *  spilloverFrom. Empty/missing = treated as unknown (rejected when
   *  fungibility enforcement is on). */
  vmGeneration?: string;
}

// ────────────────────────────────────────────────────────────────────────
// Main entry
// ────────────────────────────────────────────────────────────────────────
export function runSimulation(input: SimulatorInput): SimulatorResult {
  const { fleet, buffer, bom, catalog, packingMode } = input;

  const nodeMem = fleet.memoryGibPerNode;
  const nodeVcpu = vcpusPerNode(fleet);
  const totalNodeCount = totalNodes(fleet);

  // v2.9 — Per-node network capacity. The new `networkMbpsPerNode` wins;
  // fall back to the legacy `throughputCeilingMbps` (semantically the same
  // thing under the old name) so pre-v2.9 fleets keep working. `null` =
  // network constraint disabled for this fleet (back-compat default).
  const nodeNetwork: number | null =
    fleet.networkMbpsPerNode ?? fleet.throughputCeilingMbps ?? null;
  // v2.17 — Per-node Premium SSD throughput cap. null = constraint disabled.
  const nodeStorage: number | null = fleet.storageThroughputMbpsPerNode ?? null;

  // Per-position lookup for heterogeneous racks (e.g. Gen-B HM Mixed = 2×
  // 8TiB + 1× 16TiB). v2.17 — slots can be marked `isUtility`
  // (control-plane hosts); those positions are pre-tagged as reserved
  // so the workload allocator never lands a VM on them. v2.17.23 — slots
  // can also override per-node vCPU / network / storage; an undefined
  // override on the slot inherits the fleet-level value. Falls back to
  // uniform fleet values when the fleet has no rackComposition.
  const ht = fleet.hyperthreadingEnabled ? 2 : 1;
  const vcpuFromSlot = (slot: { socketsPerNode?: number; coresPerSocket?: number; vcpusPerNode?: number }): number | null => {
    if (slot.vcpusPerNode != null) return slot.vcpusPerNode;
    if (slot.socketsPerNode != null && slot.coresPerSocket != null) {
      return slot.socketsPerNode * slot.coresPerSocket * ht;
    }
    if (slot.coresPerSocket != null) return fleet.socketsPerNode * slot.coresPerSocket * ht;
    if (slot.socketsPerNode != null) return slot.socketsPerNode * fleet.coresPerSocket * ht;
    return null;
  };
  type PositionPlan = {
    mem: number;
    isUtility: boolean;
    vcpu: number;
    network: number | null;
    storage: number | null;
  };
  const positionPlan: PositionPlan[] | null = (() => {
    const comp = fleet.rackComposition;
    if (!comp || comp.length === 0) return null;
    const expanded: PositionPlan[] = [];
    for (const slot of comp) {
      const slotVcpu = vcpuFromSlot(slot) ?? nodeVcpu;
      const slotNet = slot.networkMbpsPerNode ?? nodeNetwork;
      const slotStor = slot.storageThroughputMbpsPerNode ?? nodeStorage;
      for (let i = 0; i < slot.count; i++) {
        expanded.push({
          mem: slot.memoryGibPerNode,
          isUtility: !!slot.isUtility,
          vcpu: slotVcpu,
          network: slotNet,
          storage: slotStor,
        });
      }
    }
    if (expanded.length !== fleet.nodesPerRack) return null;
    return expanded;
  })();
  const planAt = (posInRack: number): PositionPlan => positionPlan
    ? positionPlan[posInRack - 1]
    : { mem: nodeMem, isUtility: false, vcpu: nodeVcpu, network: nodeNetwork, storage: nodeStorage };
  const isUtilityPos = (posInRack: number): boolean => planAt(posInRack).isUtility;
  const reserved = Math.min(resolveReserved(buffer, totalNodeCount), totalNodeCount);
  const deployableBefore = Math.max(0, totalNodeCount - reserved);

  // ── 1. Build physical node pool ────────────────────────────────────────
  const nodes: NodeDetail[] = [];
  let nodeIdx = 0;
  const makeNode = (
    state: NodeDetail['state'],
  ): NodeDetail => {
    const rack = Math.floor(nodeIdx / fleet.nodesPerRack) + 1;
    const posInRack = (nodeIdx % fleet.nodesPerRack) + 1;
    nodeIdx++;
    const plan = planAt(posInRack);
    return {
      nodeId: `R${rack}N${posInRack}`,
      rack,
      posInRack,
      hardwareGroup: fleet.hardwareGroupName,
      state,
      memoryTotalGib: plan.mem,
      vcpusTotal: plan.vcpu,
      throughputTotalMbps: plan.network,
      memoryUsedGib: 0,
      vcpusUsed: 0,
      throughputUsedMbps: 0,
      storageThroughputTotalMbps: plan.storage,
      storageThroughputUsedMbps: 0,
      strandedMemoryGib: 0,
      strandedVcpus: 0,
      vmsPlaced: [],
      bindingConstraint: 'NONE',
      isSpilloverNode: false,
      isolated: fleet.isolated,
    };
  };

  // Reserved nodes first (so rack map reads buffer-first), then deployable.
  // v2.17 — Any position flagged as utility in rackComposition is forced
  // to `reserved` regardless of the buffer count, so workload never lands
  // on a control-plane host.
  for (let i = 0; i < reserved; i++) nodes.push(makeNode('reserved'));
  for (let i = 0; i < deployableBefore; i++) {
    const posInRack = ((reserved + i) % fleet.nodesPerRack) + 1;
    const baseState = fleet.isolated ? 'isolated' : 'deployable';
    nodes.push(makeNode(isUtilityPos(posInRack) ? 'reserved' : baseState));
  }

  // ── 2. Resolve BOM against catalog, flag unknowns ──────────────────────
  const unknowns: UnplaceableEntry[] = [];
  const expanded: VmInstance[] = [];
  for (const entry of bom) {
    if (!entry.vmSizeName || entry.quantity <= 0) continue;
    const cat = lookupCatalog(catalog, entry.vmSizeName);
    if (!cat) {
      unknowns.push({
        vmSizeName: entry.vmSizeName,
        count: entry.quantity,
        blockingReason: 'VM_SIZE_NOT_FOUND',
        details: `"${entry.vmSizeName}" isn't in your VM catalog. Either the SKU was deleted, the name was typed wrong in the BOM, or the upload region is filtered out.`,
      });
      continue;
    }
    for (let i = 0; i < entry.quantity; i++) {
      expanded.push({
        vmSizeName: cat.vmSizeName,
        vcpus: cat.vcpus,
        memoryGib: cat.memoryGib,
        // v2.9 — Carry the VM's published network bandwidth so the engine
        // can enforce it as a packing constraint. Coerce undefined/null/NaN
        // to 0 so pre-v2.9 catalog rows simply consume no network.
        networkMbps:
          typeof cat.networkMbps === 'number' && Number.isFinite(cat.networkMbps)
            ? cat.networkMbps
            : 0,
        storageMbps:
          typeof cat.remoteStorageMbpsPremium === 'number' &&
          Number.isFinite(cat.remoteStorageMbpsPremium)
            ? cat.remoteStorageMbpsPremium
            : 0,
        vmGeneration: cat.vmGeneration,
      });
    }
  }

  // ── 2a. Fungibility pre-flight ──────────────────────────────────────────
  // Three paths, in priority order:
  //   1. v2.4 matrix path — when `input.fungibilityMatrix` is provided AND
  //      non-empty, look up matrix[vmClass][fleet.hardwareGroupId] for every
  //      VM. Missing entry → NOT_AUTHORED; 'blocked' → NOT_FUNGIBLE_TO_HARDWARE;
  //      numeric → allow (priority used by runMulti's claim phase).
  //   2. v2.3 legacy homeFor / spilloverFrom check — for fleets without a
  //      matrix entry but with explicit generation lists.
  //   3. No check — custom/manual fleets and the existing engine tests pass
  //      neither, so packing is purely capacity-bound.
  //
  // An empty matrix counts as path 3 — the GCP-dedicated-host case "just
  // works" without authoring a single cell. See FungibilityTab + decoupling
  // doctrine for rationale.
  const fungibilityBlocked: UnplaceableEntry[] = [];
  let postFungibility = expanded;
  const matrix = input.fungibilityMatrix;
  const matrixHasEntries =
    matrix !== undefined && Object.keys(matrix).length > 0;

  if (input.fungibilityOn && matrixHasEntries) {
    const hwId = fleet.hardwareGroupId;
    const classOf = input.vmClassByName ?? {};
    if (!hwId) {
      // Matrix is provided but the fleet doesn't have an ID to look up — fall
      // back to no-check rather than refusing everything, so custom fleets
      // mixed with matrix-driven fleets don't break.
      postFungibility = expanded;
    } else {
      const kept: VmInstance[] = [];
      for (const vm of expanded) {
        // v2.19.17 — Per-size routing. The matrix is keyed by vmSizeName so
        // each VM size can route independently. We prefer the size-keyed cell
        // and fall back to a legacy class-keyed cell (older matrices + the
        // engine acceptance tests author class keys) so nothing regresses.
        const classKey = classOf[vm.vmSizeName] ?? vm.vmGeneration ?? '';
        let cell = matrix![vm.vmSizeName]?.[hwId];
        if (cell === undefined) cell = matrix![classKey]?.[hwId];
        const dispKey = vm.vmSizeName || classKey;
        if (cell === undefined) {
          pushUnplaceable(
            fungibilityBlocked,
            vm.vmSizeName,
            'NOT_AUTHORED',
            `(${dispKey || '?'} × ${hwId}) cell unauthored in your matrix. Open Fungibility tab and pick Home / Spillover / Blocked.`,
          );
        } else if (cell === 'blocked') {
          pushUnplaceable(
            fungibilityBlocked,
            vm.vmSizeName,
            'NOT_FUNGIBLE_TO_HARDWARE',
            `Matrix cell (${dispKey || '?'} × ${hwId}) is explicitly Blocked.`,
          );
        } else {
          kept.push(vm);
        }
      }
      postFungibility = kept;
    }
  } else if (
    input.fungibilityOn &&
    (fleet.homeFor !== undefined || fleet.spilloverFrom !== undefined)
  ) {
    // Legacy v2.3 path — kept verbatim so the original 25 acceptance tests
    // and any matrix-less fleets continue to work unchanged.
    const allowed = new Set([...(fleet.homeFor ?? []), ...(fleet.spilloverFrom ?? [])]);
    if (allowed.size === 0) {
      for (const vm of expanded) {
        pushUnplaceable(
          fungibilityBlocked,
          vm.vmSizeName,
          'NO_FUNGIBILITY_DEFINED',
          `Hardware "${fleet.hardwareGroupName}" has empty homeFor + spilloverFrom. Either fill those in or author the matrix.`,
        );
      }
      postFungibility = [];
    } else {
      const kept: VmInstance[] = [];
      for (const vm of expanded) {
        if (vm.vmGeneration && allowed.has(vm.vmGeneration)) {
          kept.push(vm);
        } else {
          pushUnplaceable(
            fungibilityBlocked,
            vm.vmSizeName,
            'NOT_FUNGIBLE_TO_HARDWARE',
            `VM generation "${vm.vmGeneration ?? '(unset)'}" not in ${fleet.hardwareGroupName}'s fungibility set {${Array.from(allowed).join(', ')}}.`,
          );
        }
      }
      postFungibility = kept;
    }
  }

  // ── 3. Deployment-limit short-circuit ──────────────────────────────────
  if (deployableBefore <= 0) {
    const allBlocked: UnplaceableEntry[] = [
      ...unknowns,
      ...fungibilityBlocked,
      ...consolidateBomBlocked(postFungibility, 'DEPLOYMENT_LIMIT'),
    ];
    return {
      totalNodes: totalNodeCount,
      deployableNodesBefore: 0,
      reservedNodes: reserved,
      nodesConsumed: 0,
      henRemaining: 0,
      strandedMemoryGib: 0,
      strandedVcpus: 0,
      memoryUtilizationPct: 0,
      vcpuUtilizationPct: 0,
      vmsPlaced: 0,
      vmsUnplaceable: allBlocked,
      deploymentLimited: true,
      deploymentLimitReason: 'BUFFER_EXHAUSTED',
      spilloverEvents: [],
      nodeDetail: nodes,
    };
  }

  // ── 4. Pre-flight: reject VMs too big for any single node ──────────────
  // RULE 4 — Skip and continue. Track which VMs are physically impossible.
  // Iterates `postFungibility` (already filtered by the fungibility pre-flight)
  // so fungibility-rejected VMs don't get double-counted as oversized.
  const placeable: VmInstance[] = [];
  const oversized: UnplaceableEntry[] = [];

  for (const vm of postFungibility) {
    if (vm.memoryGib > nodeMem) {
      pushUnplaceable(
        oversized,
        vm.vmSizeName,
        'MEMORY',
        `VM needs ${vm.memoryGib.toLocaleString()} GiB; this cluster's per-node memory is ${nodeMem.toLocaleString()} GiB. Use a hardware group with bigger nodes.`,
      );
    } else if (vm.vcpus > nodeVcpu) {
      pushUnplaceable(
        oversized,
        vm.vmSizeName,
        'VCPU',
        `VM needs ${vm.vcpus} vCPUs; this cluster's per-node vCPU is ${nodeVcpu}. Use a hardware group with more cores per socket / sockets.`,
      );
    } else if (
      nodeNetwork !== null &&
      vm.networkMbps > 0 &&
      vm.networkMbps > nodeNetwork
    ) {
      // v2.9 — Network oversize. Counterpart to MEMORY / VCPU pre-flight
      // rejections. Skipped entirely when the cluster has no network cap
      // (back-compat) or the VM didn't publish a network requirement.
      pushUnplaceable(
        oversized,
        vm.vmSizeName,
        'NETWORK',
        `VM needs ${vm.networkMbps.toLocaleString()} Mbps network; this cluster's per-node network is ${nodeNetwork.toLocaleString()} Mbps. Use a hardware group with more NIC bandwidth.`,
      );
    } else if (
      nodeStorage !== null &&
      vm.storageMbps > 0 &&
      vm.storageMbps > nodeStorage
    ) {
      // v2.17 — Storage throughput oversize. Same shape as network: skipped
      // when either side lacks a value.
      pushUnplaceable(
        oversized,
        vm.vmSizeName,
        'STORAGE',
        `VM needs ${vm.storageMbps.toLocaleString()} MB/s Premium SSD throughput; this cluster's per-node cap is ${nodeStorage.toLocaleString()} MB/s. Use a hardware group with more storage bandwidth.`,
      );
    } else {
      placeable.push(vm);
    }
  }

  // ── 5. Sort per packing mode ───────────────────────────────────────────
  if (packingMode === 'SMART') {
    placeable.sort((a, b) => b.memoryGib - a.memoryGib || b.vcpus - a.vcpus);
  }
  // STRICT: keep BOM order — no sort.

  // ── 6. Pack ────────────────────────────────────────────────────────────
  const deployablePool = nodes.filter((n) => n.state === 'deployable' || n.state === 'isolated');
  const openNodes: NodeDetail[] = [];
  let nextEmptyIdx = 0;
  const unplaceableDuringPack: UnplaceableEntry[] = [];

  for (const vm of placeable) {
    // VHM isolated: 1 VM per node, no packing
    if (fleet.isolated) {
      if (nextEmptyIdx < deployablePool.length) {
        const node = deployablePool[nextEmptyIdx++];
        placeOn(node, vm);
        openNodes.push(node);
      } else {
        pushUnplaceable(
          unplaceableDuringPack,
          vm.vmSizeName,
          'ISOLATED_HOST',
          `Cluster runs isolated (1 VM/node). All ${deployablePool.length} eligible nodes already hold a VM.`,
        );
      }
      continue;
    }

    // Best-fit: scan open nodes for tightest remaining memory that still fits.
    let bestNode: NodeDetail | null = null;
    let bestRemainingMem = Infinity;
    for (const node of openNodes) {
      if (canFit(node, vm)) {
        const remMem = node.memoryTotalGib - node.memoryUsedGib;
        if (remMem < bestRemainingMem) {
          bestRemainingMem = remMem;
          bestNode = node;
        }
      }
    }

    if (bestNode) {
      placeOn(bestNode, vm);
      continue;
    }

    // Open a new node from the deployable pool
    if (nextEmptyIdx < deployablePool.length) {
      const newNode = deployablePool[nextEmptyIdx++];
      placeOn(newNode, vm);
      openNodes.push(newNode);
      continue;
    }

    // No room anywhere — skip and continue. Diagnose binding reason on the
    // best-candidate open node (the one with most remaining memory).
    {
      const diag = diagnoseBlocked(openNodes, vm);
      pushUnplaceable(unplaceableDuringPack, vm.vmSizeName, diag.reason, diag.details);
    }
  }

  // v2.17 — Build the catalog used by the full-node check below. A node
  // flips to `occupied-full` when no VM in this catalog can fit the
  // remaining sliver. Two-tier resolution:
  //   1. PROVIDER-AWARE (preferred): use every catalog VM tagged with a
  //      provider that's represented in the BOM. Answers "could the user
  //      pack ANYTHING they could buy from this cloud here?" — wider net,
  //      mirrors real-world capacity planning.
  //   2. BOM-SKU FALLBACK: when no provider tags exist (legacy catalogs,
  //      tests) we restrict to the SKUs the user explicitly listed in
  //      their BOM. A node that can't fit ANY of those is full for the
  //      user's workload.
  const bomSkus = new Set(bom.map((b) => b.vmSizeName).filter(Boolean));
  const bomProviders = new Set<string>();
  for (const c of catalog) {
    if (bomSkus.has(c.vmSizeName) && c.provider) bomProviders.add(c.provider);
  }
  const useProviderPath = bomProviders.size > 0;
  const seenProvSkus = new Set<string>();
  const bomCatalog: CatalogEntry[] = [];
  for (const c of catalog) {
    if (useProviderPath) {
      if (!c.provider || !bomProviders.has(c.provider)) continue;
    } else {
      if (!bomSkus.has(c.vmSizeName)) continue;
    }
    if (seenProvSkus.has(c.vmSizeName)) continue;
    seenProvSkus.add(c.vmSizeName);
    bomCatalog.push(c);
  }

  // v2.24.2 — Fungibility-aware "full" = "no FUNGIBLE VM still fits". User rule:
  // "if a node can fit more fungible VMs on it, then it is partial; if it cannot
  // fit any fungible VMs on it, then it is full." So when the matrix path is
  // active, the full-node catalog is every fungibility-AUTHORIZED size on this
  // hardware (a numeric Home/Spillover cell) — exactly the set "What Else Fits"
  // shows — NOT just the BOM. A node is `occupied-full` only when none of those
  // authorized sizes fit its leftover, so the "full" chip and the "What Else
  // Fits" list can never contradict each other.
  //   (v2.23.10 restricted this to BOM ∩ authorized, which read "full" while
  //   smaller authorized non-BOM sizes still fit — the contradiction the user
  //   flagged. We drop the BOM restriction; the wider provider net still applies
  //   to legacy / no-matrix fleets, so the acceptance tests are untouched.)
  let fullCheckCatalog = bomCatalog;
  if (input.fungibilityOn && matrixHasEntries && fleet.hardwareGroupId) {
    const hwId = fleet.hardwareGroupId;
    const classOf = input.vmClassByName ?? {};
    const seenAuth = new Set<string>();
    fullCheckCatalog = catalog.filter((c) => {
      if (seenAuth.has(c.vmSizeName)) return false;
      const classKey = classOf[c.vmSizeName] ?? c.vmGeneration ?? '';
      let cell = matrix![c.vmSizeName]?.[hwId];
      if (cell === undefined) cell = matrix![classKey]?.[hwId];
      if (cell === undefined || cell === 'blocked') return false;
      seenAuth.add(c.vmSizeName);
      return true;
    });
  }

  // ── 7. Finalize per-node state ─────────────────────────────────────────
  for (const node of openNodes) {
    const memLeft = node.memoryTotalGib - node.memoryUsedGib;
    const vcpuLeft = node.vcpusTotal - node.vcpusUsed;
    node.strandedMemoryGib = Math.max(0, memLeft);
    node.strandedVcpus = Math.max(0, vcpuLeft);

    if (node.isolated) {
      node.state = 'occupied-full';
      node.bindingConstraint = 'MEMORY';
      continue;
    }

    // Determine binding constraint:
    // Anything that hit zero is the binding constraint (priority MEMORY > VCPU > NETWORK).
    if (memLeft <= 0) {
      node.state = 'occupied-full';
      node.bindingConstraint = 'MEMORY';
    } else if (vcpuLeft <= 0) {
      node.state = 'occupied-full';
      node.bindingConstraint = 'VCPU';
    } else if (
      node.throughputTotalMbps !== null &&
      node.throughputUsedMbps >= node.throughputTotalMbps
    ) {
      node.state = 'occupied-full';
      node.bindingConstraint = 'NETWORK';
    } else if (
      node.storageThroughputTotalMbps !== null &&
      node.storageThroughputUsedMbps >= node.storageThroughputTotalMbps
    ) {
      // v2.17 — Storage throughput saturated → full.
      node.state = 'occupied-full';
      node.bindingConstraint = 'STORAGE';
    } else if (!anyCatalogVmFits(node, fullCheckCatalog)) {
      // v2.17 — Semantic "full": even when no single constraint hit zero,
      // if the smallest VM the USER ACTUALLY WANTS TO RUN (from the BOM,
      // not the entire 300-row catalog) doesn't fit, the node is full for
      // their workload. The leftover sliver is stranded by definition.
      // Tag the binding constraint with whichever dimension is most
      // consumed so the chip still tells the user why nothing else fit.
      node.state = 'occupied-full';
      const memPct = node.memoryUsedGib / node.memoryTotalGib;
      const vcpuPct = node.vcpusUsed / node.vcpusTotal;
      const netPct =
        node.throughputTotalMbps && node.throughputTotalMbps > 0
          ? node.throughputUsedMbps / node.throughputTotalMbps
          : 0;
      const storPct =
        node.storageThroughputTotalMbps && node.storageThroughputTotalMbps > 0
          ? node.storageThroughputUsedMbps / node.storageThroughputTotalMbps
          : 0;
      const max = Math.max(memPct, vcpuPct, netPct, storPct);
      node.bindingConstraint =
        max === memPct
          ? 'MEMORY'
          : max === vcpuPct
            ? 'VCPU'
            : max === netPct
              ? 'NETWORK'
              : 'STORAGE';
    } else {
      // Partial — flag binding as whichever resource is most consumed.
      node.state = 'occupied-partial';
      const memPct = node.memoryUsedGib / node.memoryTotalGib;
      const vcpuPct = node.vcpusUsed / node.vcpusTotal;
      const netPct =
        node.throughputTotalMbps && node.throughputTotalMbps > 0
          ? node.throughputUsedMbps / node.throughputTotalMbps
          : 0;
      const storPct =
        node.storageThroughputTotalMbps && node.storageThroughputTotalMbps > 0
          ? node.storageThroughputUsedMbps / node.storageThroughputTotalMbps
          : 0;
      const max = Math.max(memPct, vcpuPct, netPct, storPct);
      node.bindingConstraint =
        max === memPct
          ? 'MEMORY'
          : max === vcpuPct
            ? 'VCPU'
            : max === netPct
              ? 'NETWORK'
              : 'STORAGE';
    }
  }

  // ── 8. Aggregate ───────────────────────────────────────────────────────
  // Strand/utilization metrics are computed strictly over nodes that received
  // at least one VM. Empty deployable and reserved nodes are excluded.
  const occupied = nodes.filter((n) => n.vmsPlaced.length > 0);
  const nodesConsumed = occupied.length;
  const henRemaining = Math.max(0, deployableBefore - nodesConsumed);

  const strandedMemoryGib = occupied.reduce((s, n) => s + n.strandedMemoryGib, 0);
  const strandedVcpus = occupied.reduce((s, n) => s + n.strandedVcpus, 0);

  const totalAllocMem = occupied.reduce((s, n) => s + n.memoryUsedGib, 0);
  const totalCapMem = occupied.reduce((s, n) => s + n.memoryTotalGib, 0);
  const totalAllocVcpu = occupied.reduce((s, n) => s + n.vcpusUsed, 0);
  const totalCapVcpu = occupied.reduce((s, n) => s + n.vcpusTotal, 0);

  const memoryUtilizationPct = totalCapMem > 0 ? (totalAllocMem / totalCapMem) * 100 : 0;
  const vcpuUtilizationPct = totalCapVcpu > 0 ? (totalAllocVcpu / totalCapVcpu) * 100 : 0;

  const placedCount = placeable.length - unplaceableDuringPack.reduce((s, u) => s + u.count, 0);
  const vmsUnplaceable = mergeUnplaceable([
    ...unknowns,
    ...fungibilityBlocked,
    ...oversized,
    ...unplaceableDuringPack,
  ]);

  return {
    totalNodes: totalNodeCount,
    deployableNodesBefore: deployableBefore,
    reservedNodes: reserved,
    nodesConsumed,
    henRemaining,
    strandedMemoryGib,
    strandedVcpus,
    memoryUtilizationPct,
    vcpuUtilizationPct,
    vmsPlaced: placedCount,
    vmsUnplaceable,
    deploymentLimited: false,
    deploymentLimitReason: null,
    spilloverEvents: [],
    nodeDetail: nodes,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
/**
 * v2.17 — Returns true if at least one catalog VM still fits on this node's
 * remaining capacity. Used by finalize to mark a node FULL when, even
 * though no individual constraint hit zero, the leftover sliver can't host
 * any published VM size in the catalog. Storage throughput is checked too
 * (see `canFit` for the regular path).
 */
function anyCatalogVmFits(node: NodeDetail, catalog: CatalogEntry[]): boolean {
  const memLeft = node.memoryTotalGib - node.memoryUsedGib;
  const vcpuLeft = node.vcpusTotal - node.vcpusUsed;
  const netLeft =
    node.throughputTotalMbps !== null
      ? node.throughputTotalMbps - node.throughputUsedMbps
      : Infinity;
  const storLeft =
    node.storageThroughputTotalMbps !== null
      ? node.storageThroughputTotalMbps - node.storageThroughputUsedMbps
      : Infinity;
  if (memLeft <= 0 || vcpuLeft <= 0) return false;
  for (const c of catalog) {
    if (c.vcpus <= 0 || c.memoryGib <= 0) continue;
    if (c.memoryGib > memLeft) continue;
    if (c.vcpus > vcpuLeft) continue;
    if (c.networkMbps > 0 && c.networkMbps > netLeft) continue;
    const cStor =
      typeof c.remoteStorageMbpsPremium === 'number' ? c.remoteStorageMbpsPremium : 0;
    if (cStor > 0 && cStor > storLeft) continue;
    return true;
  }
  return false;
}

function canFit(node: NodeDetail, vm: VmInstance): boolean {
  if (node.memoryUsedGib + vm.memoryGib > node.memoryTotalGib) return false;
  if (node.vcpusUsed + vm.vcpus > node.vcpusTotal) return false;
  // v2.9 — Network check. Skipped when the node has no cap (back-compat)
  // or the VM didn't publish a requirement. Sum-based, like memory/vCPU.
  if (
    node.throughputTotalMbps !== null &&
    vm.networkMbps > 0 &&
    node.throughputUsedMbps + vm.networkMbps > node.throughputTotalMbps
  ) {
    return false;
  }
  // v2.17 — Storage throughput check. Same back-compat skip pattern.
  if (
    node.storageThroughputTotalMbps !== null &&
    vm.storageMbps > 0 &&
    node.storageThroughputUsedMbps + vm.storageMbps > node.storageThroughputTotalMbps
  ) {
    return false;
  }
  return true;
}

function placeOn(node: NodeDetail, vm: VmInstance): void {
  node.memoryUsedGib += vm.memoryGib;
  node.vcpusUsed += vm.vcpus;
  // v2.9 — Subtract from node's network budget. No-op when either side
  // doesn't carry a value (network constraint disabled for this pair).
  if (node.throughputTotalMbps !== null && vm.networkMbps > 0) {
    node.throughputUsedMbps += vm.networkMbps;
  }
  if (node.storageThroughputTotalMbps !== null && vm.storageMbps > 0) {
    node.storageThroughputUsedMbps += vm.storageMbps;
  }
  const placed: PlacedVm = {
    vmSizeName: vm.vmSizeName,
    vcpus: vm.vcpus,
    memoryGib: vm.memoryGib,
  };
  node.vmsPlaced.push(placed);
}

function pushUnplaceable(
  list: UnplaceableEntry[],
  vmSizeName: string,
  reason: BlockingReason,
  details?: string,
): void {
  const existing = list.find((u) => u.vmSizeName === vmSizeName && u.blockingReason === reason);
  if (existing) {
    existing.count++;
    // Keep the FIRST details emitted — later instances of the same VM are
    // typically failing for the same specific reason. If they diverge the UI
    // still shows the canonical first message; rare enough not to surface.
    if (!existing.details && details) existing.details = details;
  } else {
    list.push({ vmSizeName, count: 1, blockingReason: reason, details });
  }
}

/**
 * Diagnose the specific reason a VM didn't fit and emit a `(reason, details)`
 * pair. `details` carries the concrete numbers ("VM needs 5700 GiB, biggest
 * open node has 4096 GiB") so the user can act on it without inferring.
 */
function diagnoseBlocked(
  openNodes: NodeDetail[],
  vm: VmInstance,
): { reason: BlockingReason; details: string } {
  if (openNodes.length === 0) {
    return {
      reason: 'DEPLOYMENT_LIMIT',
      details: 'All deployable nodes consumed; remaining nodes are reserved by the buffer.',
    };
  }
  // Best candidate = node with most remaining memory (loosest fit).
  let best = openNodes[0];
  let bestRemMem = best.memoryTotalGib - best.memoryUsedGib;
  for (const n of openNodes) {
    const remMem = n.memoryTotalGib - n.memoryUsedGib;
    if (remMem > bestRemMem) {
      bestRemMem = remMem;
      best = n;
    }
  }
  const remMem = best.memoryTotalGib - best.memoryUsedGib;
  const remVcpu = best.vcpusTotal - best.vcpusUsed;
  if (remVcpu < vm.vcpus) {
    return {
      reason: 'VCPU',
      details: `VM needs ${vm.vcpus} vCPUs; loosest open node (${best.nodeId}) has ${remVcpu} vCPUs free.`,
    };
  }
  if (remMem < vm.memoryGib) {
    return {
      reason: 'MEMORY',
      details: `VM needs ${vm.memoryGib.toLocaleString()} GiB; loosest open node (${best.nodeId}) has ${Math.round(remMem).toLocaleString()} GiB free.`,
    };
  }
  // v2.9 — Network is checked AFTER memory + vCPU to preserve existing
  // diagnostic priority (the user's mental model: memory exhaustion is the
  // headline failure mode, vCPU next, network is the new 3rd). Only fires
  // when both sides carry a value AND there isn't room.
  if (
    best.throughputTotalMbps !== null &&
    vm.networkMbps > 0 &&
    best.throughputTotalMbps - best.throughputUsedMbps < vm.networkMbps
  ) {
    const remNet = best.throughputTotalMbps - best.throughputUsedMbps;
    return {
      reason: 'NETWORK',
      details: `VM needs ${vm.networkMbps.toLocaleString()} Mbps network; loosest open node (${best.nodeId}) has ${Math.round(remNet).toLocaleString()} Mbps free.`,
    };
  }
  if (
    best.storageThroughputTotalMbps !== null &&
    vm.storageMbps > 0 &&
    best.storageThroughputTotalMbps - best.storageThroughputUsedMbps < vm.storageMbps
  ) {
    const remStor = best.storageThroughputTotalMbps - best.storageThroughputUsedMbps;
    return {
      reason: 'STORAGE',
      details: `VM needs ${vm.storageMbps.toLocaleString()} MB/s Premium SSD throughput; loosest open node (${best.nodeId}) has ${Math.round(remStor).toLocaleString()} MB/s free.`,
    };
  }
  return {
    reason: 'NO_ELIGIBLE_NODES',
    details: 'No open node passed eligibility checks for this VM.',
  };
}

function consolidateBomBlocked(
  vms: VmInstance[],
  reason: BlockingReason,
): UnplaceableEntry[] {
  const out: UnplaceableEntry[] = [];
  for (const vm of vms) pushUnplaceable(out, vm.vmSizeName, reason);
  return out;
}

function mergeUnplaceable(entries: UnplaceableEntry[]): UnplaceableEntry[] {
  const map = new Map<string, UnplaceableEntry>();
  for (const e of entries) {
    const key = `${e.vmSizeName}|${e.blockingReason}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += e.count;
      if (!existing.details && e.details) existing.details = e.details;
    } else {
      map.set(key, { ...e });
    }
  }
  return Array.from(map.values());
}

// ────────────────────────────────────────────────────────────────────────
// Live availability — used by the buffer slider for instant feedback.
// ────────────────────────────────────────────────────────────────────────
export function computeAvailability(
  fleet: FleetSpec,
  buffer: BufferSpec,
): { totalNodes: number; reserved: number; deployable: number } {
  const total = totalNodes(fleet);
  const reserved = resolveReserved(buffer, total);
  return {
    totalNodes: total,
    reserved,
    deployable: Math.max(0, total - reserved),
  };
}

// Re-export used types for convenience
export type { BindingConstraint };

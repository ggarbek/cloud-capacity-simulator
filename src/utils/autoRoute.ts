/**
 * autoRouteMissingRules — one-click fungibility authoring (v2.20.1).
 *
 * The single biggest authoring cliff in the tool: with a non-empty matrix,
 * any (BoM size × placed hardware) pair with NO authored cell is
 * NOT_AUTHORED and the engine refuses placement — and authoring the matrix
 * by hand is the slowest part of setup. This helper authors sensible
 * routing for exactly those missing pairs in one explicit user action:
 *
 *   - HOME (tier 0) on the placed hardware where the VM fits with the
 *     LEAST waste (smallest node that structurally fits it) — unless the
 *     size already has a home anywhere, in which case new cells start at
 *     the next free spillover tier.
 *   - SPILLOVER tiers (1..5) on the remaining fitting hardware, ascending
 *     by node size (tightest fit spills first).
 *
 * Doctrine guardrails:
 *   - NEVER touches an existing decision — size- or class-keyed cells,
 *     including explicit 'blocked', always win. NOT_AUTHORED stays the
 *     default; this runs only on an explicit button click (= user intent).
 *   - Hardware the VM can't structurally fit (node memory / vCPU /
 *     network / storage caps) is skipped, not authored.
 *   - Pure: returns a NEW matrix + a report; the caller dispatches
 *     FUNGIBILITY_REPLACE (the Fungibility tab's auto-save action).
 */
import type { AppState } from '../state/AppState';
import { fleetList } from '../state/AppState';
import type { HardwareGroup, UserVm } from '../types';
import { vmClass } from './vmTaxonomy';
import { regionScopedCatalog } from './runEngine';

export type FungibilityMatrix = Record<string, Record<string, number | 'blocked'>>;

export interface AutoRoutePair {
  vmSizeName: string;
  hwId: string;
  hwName: string;
  tier: number; // 0 = home, 1..5 spillover
}

export interface AutoRouteReport {
  /** The new matrix (input matrix untouched). */
  matrix: FungibilityMatrix;
  /** Every cell that was authored. Empty = nothing was missing. */
  authored: AutoRoutePair[];
  /** Distinct BoM sizes that received at least one new cell. */
  sizesCovered: string[];
  /** BoM sizes that had missing pairs but fit NO placed hardware
   *  structurally — left un-authored (authoring would be a lie). */
  sizesUnfittable: string[];
}

/** Node-level structural capacity for a hardware group: the LARGEST
 *  non-utility node it offers per dimension (a VM only needs one node that
 *  can hold it). */
function nodeCaps(g: HardwareGroup): {
  memGib: number;
  vcpus: number;
  networkMbps?: number;
  storageMbps?: number;
} {
  let memGib = g.memoryGibPerNode ?? 0;
  let vcpus =
    g.vcpusPerNode ??
    (g.socketsPerNode && g.coresPerSocket ? g.socketsPerNode * g.coresPerSocket * 2 : 0);
  let networkMbps = g.networkMbpsPerNode;
  let storageMbps = g.storageThroughputMbpsPerNode;
  if (g.rackComposition && g.rackComposition.length > 0) {
    for (const slot of g.rackComposition) {
      if (slot.isUtility) continue;
      if (slot.memoryGibPerNode > memGib) {
        memGib = slot.memoryGibPerNode;
        const slotVcpus =
          slot.vcpusPerNode ??
          (slot.socketsPerNode && slot.coresPerSocket
            ? slot.socketsPerNode * slot.coresPerSocket * 2
            : undefined);
        if (slotVcpus !== undefined) vcpus = slotVcpus;
        if (slot.networkMbpsPerNode !== undefined) networkMbps = slot.networkMbpsPerNode;
        if (slot.storageThroughputMbpsPerNode !== undefined)
          storageMbps = slot.storageThroughputMbpsPerNode;
      }
    }
  }
  return { memGib, vcpus, networkMbps, storageMbps };
}

function vmFitsHardware(vm: UserVm, g: HardwareGroup): boolean {
  const caps = nodeCaps(g);
  if (vm.memoryGib > caps.memGib) return false;
  if (caps.vcpus > 0 && vm.vcpus > caps.vcpus) return false;
  if (
    caps.networkMbps !== undefined &&
    vm.networkMbps > 0 &&
    vm.networkMbps > caps.networkMbps
  ) {
    return false;
  }
  const vmStor = vm.remoteStorageMbpsPremium ?? 0;
  if (caps.storageMbps !== undefined && vmStor > 0 && vmStor > caps.storageMbps) return false;
  return true;
}

export function autoRouteMissingRules(state: AppState): AutoRouteReport {
  const matrix = state.userFungibility;

  // Placed hardware = distinct library groups referenced by placed fleets.
  const placedIds = new Set<string>();
  for (const { fleet } of fleetList(state)) {
    if (fleet.hardwareGroupId) placedIds.add(fleet.hardwareGroupId);
  }
  const placedHw = state.userHardware.filter((g) => placedIds.has(g.id));

  // Catalog lookups — engine-scoped region first, full catalog fallback.
  const scoped = regionScopedCatalog(state);
  const byName = new Map<string, UserVm>();
  for (const v of state.userVms) if (!byName.has(v.vmSizeName)) byName.set(v.vmSizeName, v);
  for (const v of scoped) byName.set(v.vmSizeName, v);

  const effectiveCell = (size: string, cls: string | undefined, hwId: string) =>
    matrix[size]?.[hwId] ?? (cls ? matrix[cls]?.[hwId] : undefined);

  const next: FungibilityMatrix = { ...matrix };
  const authored: AutoRoutePair[] = [];
  const sizesCovered: string[] = [];
  const sizesUnfittable: string[] = [];

  const sizes = [...new Set(state.bom.map((b) => b.vmSizeName))];
  for (const size of sizes) {
    const vm = byName.get(size);
    if (!vm) continue; // unknown SKU — the BoM surface already flags it
    const cls = vmClass(vm);

    const missing = placedHw.filter((g) => effectiveCell(size, cls, g.id) === undefined);
    if (missing.length === 0) continue;

    const fitting = missing.filter((g) => vmFitsHardware(vm, g));
    if (fitting.length === 0) {
      sizesUnfittable.push(size);
      continue;
    }

    // Tightest structural fit first: home on the smallest node that holds
    // the VM, spillover on progressively larger nodes.
    fitting.sort((a, b) => nodeCaps(a).memGib - nodeCaps(b).memGib);

    // Existing tiers for this size across ALL placed hardware (so we don't
    // create a second home or collide with an authored spillover tier).
    let hasHome = false;
    let maxTier = -1;
    for (const g of placedHw) {
      const cell = effectiveCell(size, cls, g.id);
      if (typeof cell === 'number') {
        if (cell === 0) hasHome = true;
        if (cell > maxTier) maxTier = cell;
      }
    }

    let tier = hasHome ? Math.max(1, maxTier + 1) : 0;
    const row = { ...(next[size] ?? {}) };
    for (const g of fitting) {
      const t = Math.min(tier, 5); // engine tier ceiling
      row[g.id] = t;
      authored.push({ vmSizeName: size, hwId: g.id, hwName: g.name, tier: t });
      tier += 1;
    }
    next[size] = row;
    sizesCovered.push(size);
  }

  return {
    matrix: authored.length > 0 ? next : matrix,
    authored,
    sizesCovered,
    sizesUnfittable,
  };
}

/** Count the missing (BoM size × placed HW) pairs auto-route would author —
 *  drives button visibility/labels without computing the full report. */
export function countMissingRoutePairs(state: AppState): number {
  return autoRouteMissingRules(state).authored.length;
}

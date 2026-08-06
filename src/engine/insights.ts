/**
 * v2.11 (Phase E.3) — Insights pure engine helpers.
 *
 * Selection-driven analytics for the Insights pane. All functions are
 * pure: same inputs always produce same outputs, no React, no DOM.
 *
 * Scope-aware: every helper accepts a `scope` (null = fleet-wide, or
 * region/zone/cluster). The helpers filter the node list to the
 * matching subset before computing, so a region scope reads "what's
 * happening in this region only."
 *
 * Key functions:
 *   - `filterNodesByScope(result, fleets, scope)` — primitive used by all
 *     four helpers below. Walks `result.nodeDetail` and keeps the nodes
 *     belonging to fleets that match the scope's region / zone / cluster.
 *   - `sellableCapacity(result, fleets, catalog, scope)` — for each
 *     catalog VM, how many can still fit in the open space at this scope.
 *   - `revenueRollup(result, fleets, catalog, scope)` — today / at-cap /
 *     headroom revenue, with per-family breakdown.
 *   - `strandedRevenue(result, fleets, catalog, scope)` — $ value of
 *     stranded memory + vCPU + network.
 *   - `opportunities(result, fleets, catalog, scope)` — ranked
 *     actionable list (rebalance, add racks, etc).
 *
 * Pricing convention: hourly USD → monthly via HOURS_PER_MONTH (730).
 * Revenue figures returned in $/month for human-readable display.
 */
import type {
  CatalogEntry,
  FleetSpec,
  NodeDetail,
  SimulatorResult,
} from '../types';
import { HOURS_PER_MONTH } from '../types';
import type { ScopeSelection } from '../state/AppState';
import { vmClass } from '../utils/vmTaxonomy';

/** Pricing basis the user has selected. Drives which rate column the
 *  engine pulls for revenue + stranding rollups. Falls back to PAYG when
 *  the chosen RI rate isn't published on a SKU. */
export type RateType = 'payg' | 'ri1y' | 'ri3y';

/** Resolve the hourly rate to charge against this VM under `rate`. Returns
 *  undefined when no rate is published — caller skips revenue for that VM. */
export function rateFor(vm: CatalogEntry, rate: RateType): number | undefined {
  if (rate === 'ri3y') return vm.riThreeYrHourlyUsd ?? vm.riOneYrHourlyUsd ?? vm.hourlyUsd;
  if (rate === 'ri1y') return vm.riOneYrHourlyUsd ?? vm.hourlyUsd;
  return vm.hourlyUsd;
}

/** Human-readable label for the rate-type chip + KPI subtitle. */
export const RATE_LABEL: Record<RateType, string> = {
  payg: 'PAYG',
  ri1y: '1y RI',
  ri3y: '3y RI',
};

/** Result row pair used internally by FleetEntry list. */
export interface FleetEntry {
  id: string;
  fleet: FleetSpec;
}

// ────────────────────────────────────────────────────────────────────────
// Scope filter — the primitive every other helper builds on.
// ────────────────────────────────────────────────────────────────────────
export function filterNodesByScope(
  result: SimulatorResult,
  fleets: FleetEntry[],
  scope: ScopeSelection | null,
): NodeDetail[] {
  if (!scope) return result.nodeDetail;
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  return result.nodeDetail.filter((n) => {
    if (!n.clusterId) return false;
    const fleet = fleetById.get(n.clusterId);
    if (!fleet) return false;
    // A scope key may be the fleet-map's untagged sentinel ('__noregion__' /
    // '__nozone__') for clusters with no region/zone — treat it as the empty
    // tag so the filter matches the untagged nodes instead of nothing.
    if (scope.kind === 'region') {
      const r = fleet.region || '';
      return r === scope.key || (scope.key === '__noregion__' && r === '');
    }
    if (scope.kind === 'zone') {
      const z = fleet.zone || '';
      return z === scope.key || (scope.key === '__nozone__' && z === '');
    }
    if (scope.kind === 'cluster') return n.clusterId === scope.key;
    return false;
  });
}

// ────────────────────────────────────────────────────────────────────────
// Sellable capacity — "how much could we still sell at this scope?"
//
// For each catalog VM, walk every node with at least one open resource
// slot and compute how many more of THIS VM could fit. Returns the top
// N rows by fitCount × hourlyUsd (revenue potential).
// ────────────────────────────────────────────────────────────────────────
export interface SellableRow {
  vmSizeName: string;
  fitCount: number;
  hourlyUsd: number | null;
  monthlyRevenue: number | null;
}

// ────────────────────────────────────────────────────────────────────────
// v2.17 — Per-node "where could this VM fit" breakdown.
// Drives the expandable What-Else-Fits drill-down: click a row → see
// which nodes in which clusters could host that SKU, with per-node
// fit counts. Same fit math as sellableCapacity but per-node.
// ────────────────────────────────────────────────────────────────────────
export interface WhereVmFitsRow {
  clusterId: string;
  clusterName: string;
  nodeId: string;
  rack: number;
  posInRack: number;
  fitCount: number;
}

/** v2.17 — Type for the fungibility matrix passed into helpers below. */
export type FungibilityMatrix = Record<string, Record<string, number | 'blocked'>>;

/**
 * v2.17 — Fungibility gate. Returns true if (vm × hwGroupId) is allowed
 * by the user's fungibility matrix. Mirrors the engine's rules:
 *   - Empty matrix → no enforcement (everything allowed)
 *   - Numeric cell (0..5) → allowed (Home / Spillover priority)
 *   - 'blocked' → refused
 *   - Missing cell when matrix non-empty → refused (NOT_AUTHORED)
 *
 * v2.19.24 — Per-size-then-class fallback. The Fungibility tab (v2.19.17+)
 * keys cells by `vmSizeName`; legacy uploads still key by `vmClass`. Engine
 * resolves size first, falls back to class — and so do we, otherwise every
 * VM authored per-size is silently filtered out of "What else fits".
 */
export function fungibilityAllows(
  vm: CatalogEntry,
  hwGroupId: string | undefined,
  matrix: FungibilityMatrix | undefined,
): boolean {
  if (!matrix || Object.keys(matrix).length === 0) return true;
  if (!hwGroupId) return true; // fleet without a HW id can't be matrix-routed
  const sizeCell = matrix[vm.vmSizeName]?.[hwGroupId];
  if (sizeCell !== undefined) return sizeCell !== 'blocked';
  const classCell = matrix[vmClass(vm)]?.[hwGroupId];
  if (classCell === undefined) return false;
  return classCell !== 'blocked';
}

export function whereVmFits(
  result: SimulatorResult,
  fleets: FleetEntry[],
  vm: CatalogEntry,
  scope: ScopeSelection | null,
  matrix?: FungibilityMatrix,
): WhereVmFitsRow[] {
  if (vm.vcpus <= 0 || vm.memoryGib <= 0) return [];
  const nodes = filterNodesByScope(result, fleets, scope);
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  const rows: WhereVmFitsRow[] = [];
  // Helper: any required spec on the node OR vm being `undefined` (old
  // cached result, pre-storage-field schema) must coerce to a safe value
  // — otherwise the arithmetic yields NaN and the chip renders "× NaN".
  const num = (x: unknown, fallback: number): number =>
    typeof x === 'number' && Number.isFinite(x) ? x : fallback;
  for (const n of nodes) {
    // Buffer (reserved) nodes are explicitly excluded — they're held back
    // for HA / overhead and shouldn't count toward sellable capacity.
    if (n.state === 'reserved') continue;
    if (
      !(
        n.state === 'deployable' ||
        n.state === 'occupied-partial' ||
        n.state === 'occupied-full' ||
        n.state === 'isolated'
      )
    ) {
      continue;
    }
    // v2.17 — Honor the user's fungibility matrix: if (vmClass × HW)
    // isn't authored or is explicitly blocked, this node can't host the
    // VM no matter how much capacity it has.
    const fleetForNode = n.clusterId ? fleetById.get(n.clusterId) : undefined;
    if (!fungibilityAllows(vm, fleetForNode?.hardwareGroupId, matrix)) continue;
    const memTotal = num(n.memoryTotalGib, 0);
    const memUsed = num(n.memoryUsedGib, 0);
    const memLeft = memTotal - memUsed;
    const vcpuTotal = num(n.vcpusTotal, 0);
    const vcpuUsed = num(n.vcpusUsed, 0);
    const vcpuLeft = vcpuTotal - vcpuUsed;
    const netTotalRaw = n.throughputTotalMbps;
    const netUsedRaw = n.throughputUsedMbps;
    const netLeft =
      typeof netTotalRaw === 'number' && Number.isFinite(netTotalRaw)
        ? netTotalRaw - num(netUsedRaw, 0)
        : Infinity;
    const storTotalRaw = n.storageThroughputTotalMbps;
    const storUsedRaw = n.storageThroughputUsedMbps;
    const storLeft =
      typeof storTotalRaw === 'number' && Number.isFinite(storTotalRaw)
        ? storTotalRaw - num(storUsedRaw, 0)
        : Infinity;
    if (memLeft <= 0 || vcpuLeft <= 0) continue;
    const memFits = Math.floor(memLeft / vm.memoryGib);
    const vcpuFits = Math.floor(vcpuLeft / vm.vcpus);
    const vmNet = num(vm.networkMbps, 0);
    const netFits = vmNet > 0 ? Math.floor(netLeft / vmNet) : Infinity;
    const vmStor = num(vm.remoteStorageMbpsPremium, 0);
    const storFits = vmStor > 0 ? Math.floor(storLeft / vmStor) : Infinity;
    const fits = Math.max(0, Math.min(memFits, vcpuFits, netFits, storFits));
    if (!Number.isFinite(fits) || fits <= 0) continue;
    const clusterId = n.clusterId ?? '';
    const clusterName = clusterId ? fleetById.get(clusterId)?.hardwareGroupName ?? clusterId : '';
    rows.push({
      clusterId,
      clusterName,
      nodeId: n.nodeId,
      rack: n.rack,
      posInRack: n.posInRack,
      fitCount: fits,
    });
  }
  // Sort by cluster (alpha) then by fit count desc so the biggest
  // landing spots float to the top within each cluster group.
  rows.sort((a, b) => {
    if (a.clusterName !== b.clusterName) return a.clusterName.localeCompare(b.clusterName);
    if (b.fitCount !== a.fitCount) return b.fitCount - a.fitCount;
    if (a.rack !== b.rack) return a.rack - b.rack;
    return a.posInRack - b.posInRack;
  });
  return rows;
}

export function sellableCapacity(
  result: SimulatorResult,
  fleets: FleetEntry[],
  catalog: CatalogEntry[],
  scope: ScopeSelection | null,
  options: { top?: number; rate?: RateType; matrix?: FungibilityMatrix } = {},
): SellableRow[] {
  const top = options.top ?? 5;
  const rate: RateType = options.rate ?? 'payg';
  const matrix = options.matrix;
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  const nodes = filterNodesByScope(result, fleets, scope);
  // Build per-node remaining-resource view. Reserved (buffer) nodes are
  // ALWAYS excluded — they're held back for HA / overhead and shouldn't
  // count toward "what else fits".
  const sellable = nodes.filter(
    (n) =>
      n.state !== 'reserved' &&
      (n.state === 'deployable' ||
        n.state === 'occupied-partial' ||
        n.state === 'occupied-full' ||
        n.state === 'isolated'),
  );
  // De-duplicate the catalog by vmSizeName before scoring. Multi-region
  // seeds publish the same SKU across N regions (e.g. M-Series × 6 regions),
  // which would otherwise produce duplicate rows + duplicate React keys
  // downstream. We keep the first occurrence — specs are identical across
  // regions for any given size, only pricing differs and pricing of the
  // active region wins via `activeRegion` filtering upstream.
  const dedupedCatalog: CatalogEntry[] = [];
  const seenSku = new Set<string>();
  for (const vm of catalog) {
    if (seenSku.has(vm.vmSizeName)) continue;
    seenSku.add(vm.vmSizeName);
    dedupedCatalog.push(vm);
  }
  const num = (x: unknown, fallback: number): number =>
    typeof x === 'number' && Number.isFinite(x) ? x : fallback;
  const rows: SellableRow[] = [];
  for (const vm of dedupedCatalog) {
    if (vm.vcpus <= 0 || vm.memoryGib <= 0) continue;
    let count = 0;
    for (const n of sellable) {
      // v2.17 — Fungibility gate: skip nodes whose HW group isn't
      // authored as Home/Spillover for this VM's class.
      const fleetForNode = n.clusterId ? fleetById.get(n.clusterId) : undefined;
      if (!fungibilityAllows(vm, fleetForNode?.hardwareGroupId, matrix)) continue;
      const memLeft = num(n.memoryTotalGib, 0) - num(n.memoryUsedGib, 0);
      const vcpuLeft = num(n.vcpusTotal, 0) - num(n.vcpusUsed, 0);
      const netLeft =
        typeof n.throughputTotalMbps === 'number' && Number.isFinite(n.throughputTotalMbps)
          ? n.throughputTotalMbps - num(n.throughputUsedMbps, 0)
          : Infinity;
      const storLeft =
        typeof n.storageThroughputTotalMbps === 'number' &&
        Number.isFinite(n.storageThroughputTotalMbps)
          ? n.storageThroughputTotalMbps - num(n.storageThroughputUsedMbps, 0)
          : Infinity;
      if (memLeft <= 0 || vcpuLeft <= 0) continue;
      const memFits = Math.floor(memLeft / vm.memoryGib);
      const vcpuFits = Math.floor(vcpuLeft / vm.vcpus);
      const vmNet = num(vm.networkMbps, 0);
      const netFits = vmNet > 0 ? Math.floor(netLeft / vmNet) : Infinity;
      const vmStor = num(vm.remoteStorageMbpsPremium, 0);
      const storFits = vmStor > 0 ? Math.floor(storLeft / vmStor) : Infinity;
      const fits = Math.max(0, Math.min(memFits, vcpuFits, netFits, storFits));
      if (Number.isFinite(fits) && fits > 0) count += fits;
    }
    if (count === 0) continue;
    const hourly = rateFor(vm, rate) ?? null;
    rows.push({
      vmSizeName: vm.vmSizeName,
      fitCount: count,
      hourlyUsd: hourly,
      monthlyRevenue: hourly !== null ? count * hourly * HOURS_PER_MONTH : null,
    });
  }
  // Sort by monthlyRevenue desc, fallback to fitCount desc for un-priced.
  rows.sort((a, b) => {
    const ar = a.monthlyRevenue ?? -1;
    const br = b.monthlyRevenue ?? -1;
    if (ar !== br) return br - ar;
    return b.fitCount - a.fitCount;
  });
  return rows.slice(0, top);
}

// ────────────────────────────────────────────────────────────────────────
// Revenue rollup — today / at-cap / headroom, plus per-family.
// ────────────────────────────────────────────────────────────────────────
export interface RevenueRollup {
  todayMonthly: number;
  atCapMonthly: number;
  headroomMonthly: number;
  byFamily: { family: string; todayMonthly: number }[];
  /** Number of VMs already placed in scope (drives the "from X deployed VMs"
   *  subtitle on the Revenue Today KPI). */
  placedVmCount: number;
  /** VM count behind `headroomMonthly` — the count of the headroom-achieving
   *  deployment (the single best-fit size, or the greedy mix if that wins).
   *  NOT the sum of `headroomFill` counts (those are independent options that
   *  share nodes and can't all deploy at once). */
  headroomVmCount: number;
  /** A MENU of independent "what else fits" options, biggest revenue first.
   *  Each row = "if you filled the free space with ONLY this size, you'd fit
   *  `count` for `monthlyRevenue`/mo". The rows share nodes, so they are
   *  alternatives, not additive — `headroomMonthly` is ≥ every row (it's the
   *  best achievable), never their sum. */
  headroomFill: Array<{
    vmSizeName: string;
    count: number;
    monthlyRevenue: number;
  }>;
}

export function revenueRollup(
  result: SimulatorResult,
  fleets: FleetEntry[],
  catalog: CatalogEntry[],
  scope: ScopeSelection | null,
  rate: RateType = 'payg',
  matrix?: FungibilityMatrix,
): RevenueRollup {
  const nodes = filterNodesByScope(result, fleets, scope);
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  const rateByName = new Map<string, number>();
  const familyByName = new Map<string, string>();
  for (const c of catalog) {
    const r = rateFor(c, rate);
    if (r !== undefined) rateByName.set(c.vmSizeName, r);
    if (c.family) familyByName.set(c.vmSizeName, c.family);
  }
  let todayHourly = 0;
  let placedVmCount = 0;
  const familyTotals = new Map<string, number>();
  for (const n of nodes) {
    for (const placed of n.vmsPlaced) {
      placedVmCount++;
      const rate = rateByName.get(placed.vmSizeName);
      if (rate === undefined) continue;
      todayHourly += rate;
      const fam = familyByName.get(placed.vmSizeName) ?? '(unknown)';
      familyTotals.set(fam, (familyTotals.get(fam) ?? 0) + rate);
    }
  }
  const todayMonthly = todayHourly * HOURS_PER_MONTH;

  // v2.19.43 — At-cap ceiling: greedy walk packing each node with the
  // highest revenue-per-GiB VM that fits. FUNGIBILITY-AWARE: a VM is only
  // considered for a node whose fleet's hardware group is authored as
  // Home/Spillover for that VM (or for empty matrices = all allowed).
  // This stops the at-cap revenue ceiling from including VMs that
  // wouldn't actually be allowed to land.
  const ranked = [...catalog]
    .filter((c) => rateFor(c, rate) !== undefined && c.vcpus > 0 && c.memoryGib > 0)
    .sort(
      (a, b) =>
        (rateFor(b, rate) ?? 0) / b.memoryGib - (rateFor(a, rate) ?? 0) / a.memoryGib,
    );
  let atCapHourly = todayHourly;
  // Per-SKU tally of what the at-cap fill ACTUALLY places into the free
  // space. Summed, these rows equal exactly (atCap − today) = the headroom,
  // so the "what sells the gap fastest" breakdown reconciles with the
  // headline headroom number (they used to disagree — the old list came
  // from sellableCapacity's independent per-SKU maxes, which overcount).
  const fillBySize = new Map<string, { count: number; hourly: number }>();
  for (const n of nodes) {
    if (n.state === 'reserved' || n.state === 'ofr') continue;
    const fleetForNode = n.clusterId ? fleetById.get(n.clusterId) : undefined;
    const hwGroupId = fleetForNode?.hardwareGroupId;
    let memLeft = n.memoryTotalGib - n.memoryUsedGib;
    let vcpuLeft = n.vcpusTotal - n.vcpusUsed;
    let netLeft =
      n.throughputTotalMbps !== null
        ? n.throughputTotalMbps - n.throughputUsedMbps
        : Infinity;
    let storLeft =
      n.storageThroughputTotalMbps !== null
        ? n.storageThroughputTotalMbps - n.storageThroughputUsedMbps
        : Infinity;
    if (memLeft <= 0 || vcpuLeft <= 0) continue;
    for (const vm of ranked) {
      // v2.19.43 — Fungibility gate matches sellableCapacity + the
      // per-node What Else Fits — every "deployable" surface in the app
      // now uses the same rule.
      if (!fungibilityAllows(vm, hwGroupId, matrix)) continue;
      if (vm.memoryGib > memLeft || vm.vcpus > vcpuLeft) continue;
      if (vm.networkMbps > 0 && vm.networkMbps > netLeft) continue;
      const vmStor =
        typeof vm.remoteStorageMbpsPremium === 'number' ? vm.remoteStorageMbpsPremium : 0;
      if (vmStor > 0 && vmStor > storLeft) continue;
      const fits = Math.min(
        Math.floor(memLeft / vm.memoryGib),
        Math.floor(vcpuLeft / vm.vcpus),
        vm.networkMbps > 0 ? Math.floor(netLeft / vm.networkMbps) : Infinity,
        vmStor > 0 ? Math.floor(storLeft / vmStor) : Infinity,
      );
      if (fits <= 0) continue;
      const vmRate = rateFor(vm, rate) ?? 0;
      atCapHourly += fits * vmRate;
      const prevFill = fillBySize.get(vm.vmSizeName);
      if (prevFill) {
        prevFill.count += fits;
        prevFill.hourly += fits * vmRate;
      } else {
        fillBySize.set(vm.vmSizeName, { count: fits, hourly: fits * vmRate });
      }
      memLeft -= fits * vm.memoryGib;
      vcpuLeft -= fits * vm.vcpus;
      if (vm.networkMbps > 0 && netLeft !== Infinity) netLeft -= fits * vm.networkMbps;
      if (vmStor > 0 && storLeft !== Infinity) storLeft -= fits * vmStor;
      if (memLeft <= 0 || vcpuLeft <= 0) break;
    }
  }
  // The greedy mixed-fill headroom + the VM count it placed.
  const greedyHeadroomMonthly = Math.max(0, atCapHourly * HOURS_PER_MONTH - todayMonthly);
  let greedyCount = 0;
  for (const v of fillBySize.values()) greedyCount += v.count;

  // v2.23.1 — "What else fits" is a MENU of independent options: for each
  // size, the max that fits if you deployed ONLY that size (the canonical
  // sellableCapacity walk — same numbers as the per-node What Else Fits).
  // The rows share nodes, so they're alternatives, not a sum.
  const menu = sellableCapacity(result, fleets, catalog, scope, {
    rate,
    matrix,
    top: Number.MAX_SAFE_INTEGER,
  })
    .filter((r) => r.monthlyRevenue !== null && r.monthlyRevenue > 0)
    .map((r) => ({
      vmSizeName: r.vmSizeName,
      count: r.fitCount,
      monthlyRevenue: r.monthlyRevenue as number,
    }));
  const bestSingle = menu[0]?.monthlyRevenue ?? 0; // sellableCapacity sorts desc
  const bestSingleCount = menu[0]?.count ?? 0;

  // Headroom = the most you could ACTUALLY add: the better of the greedy
  // mixed fill and the single best-fit size. The greedy revenue-per-GiB walk
  // can undercount badly — it favors high-$/GiB sizes that are vCPU-bound and
  // pack poorly — so a single well-balanced size often beats it. (That was
  // the bug: a single "what else fits" row read higher than the headline
  // headroom.) Taking the max makes headroom a TRUE ceiling: ≥ every menu
  // row, so nothing contradicts it.
  const headroomMonthly = Math.max(greedyHeadroomMonthly, bestSingle);
  const atCapMonthly = todayMonthly + headroomMonthly;
  const headroomVmCount = bestSingle >= greedyHeadroomMonthly ? bestSingleCount : greedyCount;
  const headroomFill = menu;

  const byFamily = Array.from(familyTotals.entries())
    .map(([family, hourly]) => ({ family, todayMonthly: hourly * HOURS_PER_MONTH }))
    .sort((a, b) => b.todayMonthly - a.todayMonthly);

  return {
    todayMonthly,
    atCapMonthly,
    headroomMonthly,
    byFamily,
    placedVmCount,
    headroomVmCount,
    headroomFill,
  };
}

// ────────────────────────────────────────────────────────────────────────
// v2.17 — Hardware depreciation rollup. Per-scope monthly depreciation
// from each node's parent fleet's costPerNodeUsd / usableLifeMonths.
// Drives the Depreciation/mo KPI and the Gross Profit Margin derivation.
// ────────────────────────────────────────────────────────────────────────
export interface DepreciationRollup {
  monthlyUsd: number;
  /** Count of nodes that contributed (i.e. their fleet had a capex set). */
  pricedNodes: number;
  /** Total nodes in scope (for context, includes unpriced). */
  totalNodes: number;
}

export function depreciationRollup(
  result: SimulatorResult,
  fleets: FleetEntry[],
  scope: ScopeSelection | null,
): DepreciationRollup {
  const nodes = filterNodesByScope(result, fleets, scope);
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  let monthlyUsd = 0;
  let pricedNodes = 0;
  for (const n of nodes) {
    if (!n.clusterId) continue;
    const fleet = fleetById.get(n.clusterId);
    if (!fleet) continue;
    const months = fleet.usableLifeMonths && fleet.usableLifeMonths > 0
      ? fleet.usableLifeMonths
      : 60;
    let perNode = 0;
    if (typeof fleet.costPerNodeUsd === 'number' && fleet.costPerNodeUsd > 0) {
      perNode = fleet.costPerNodeUsd / months;
    } else if (
      typeof fleet.costPerRackUsd === 'number' &&
      fleet.costPerRackUsd > 0 &&
      fleet.nodesPerRack > 0
    ) {
      perNode = fleet.costPerRackUsd / fleet.nodesPerRack / months;
    } else {
      continue;
    }
    monthlyUsd += perNode;
    pricedNodes++;
  }
  return { monthlyUsd, pricedNodes, totalNodes: nodes.length };
}

// ────────────────────────────────────────────────────────────────────────
// Stranded revenue — $ value of unused capacity on occupied nodes.
//
// We value stranded memory + vCPU + network by the per-unit revenue rate
// of a "representative" VM at this scope. Representative = the median
// hourly rate ÷ median memory or vCPU among placed VMs. If no priced VMs
// exist, all returns are null.
// ────────────────────────────────────────────────────────────────────────
export interface StrandedRevenue {
  memUsdMonthly: number | null;
  vcpuUsdMonthly: number | null;
  netUsdMonthly: number | null;
  /** Recoverable estimate = sum × 0.6 (bin-pack efficiency factor). */
  recoverableUsdMonthly: number | null;
}

export function strandedRevenue(
  result: SimulatorResult,
  fleets: FleetEntry[],
  catalog: CatalogEntry[],
  scope: ScopeSelection | null,
  rate: RateType = 'payg',
): StrandedRevenue {
  const nodes = filterNodesByScope(result, fleets, scope);
  const occupied = nodes.filter((n) => n.vmsPlaced.length > 0);
  // Per-unit revenue rates from priced catalog under the selected basis.
  const priced = catalog.filter(
    (c) => rateFor(c, rate) !== undefined && c.memoryGib > 0 && c.vcpus > 0,
  );
  if (priced.length === 0 || occupied.length === 0) {
    return {
      memUsdMonthly: null,
      vcpuUsdMonthly: null,
      netUsdMonthly: null,
      recoverableUsdMonthly: null,
    };
  }
  // Median $/GiB and $/vCPU across priced catalog.
  const memRates = priced
    .map((c) => (rateFor(c, rate) as number) / c.memoryGib)
    .sort((a, b) => a - b);
  const vcpuRates = priced
    .map((c) => (rateFor(c, rate) as number) / c.vcpus)
    .sort((a, b) => a - b);
  const median = (arr: number[]): number => arr[Math.floor(arr.length / 2)];
  const memRate = median(memRates);
  const vcpuRate = median(vcpuRates);

  const strandedMem = occupied.reduce((s, n) => s + n.strandedMemoryGib, 0);
  const strandedVcpu = occupied.reduce((s, n) => s + n.strandedVcpus, 0);
  let strandedNet = 0;
  let hasNet = false;
  for (const n of occupied) {
    if (n.throughputTotalMbps === null) continue;
    hasNet = true;
    strandedNet += n.throughputTotalMbps - n.throughputUsedMbps;
  }
  const netRate = hasNet
    ? // Approximate $/Mbps as $/GiB divided by 80 (an arbitrary scaling that
      // makes the chip readable; real networking pricing isn't published
      // per-Mbps for VMs, so this is a relative weight).
      memRate / 80
    : 0;

  const memUsdMonthly = strandedMem * memRate * HOURS_PER_MONTH;
  const vcpuUsdMonthly = strandedVcpu * vcpuRate * HOURS_PER_MONTH;
  const netUsdMonthly = hasNet ? strandedNet * netRate * HOURS_PER_MONTH : null;
  const total =
    memUsdMonthly + vcpuUsdMonthly + (netUsdMonthly ?? 0);
  return {
    memUsdMonthly,
    vcpuUsdMonthly,
    netUsdMonthly,
    recoverableUsdMonthly: total * 0.6,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Opportunities — ranked actionable list.
//
// Heuristic pass. Each opportunity is a `{ title, action, impactUsd }`
// row scored by estimated $/month impact. Top 5 returned.
// ────────────────────────────────────────────────────────────────────────
export interface Opportunity {
  id: string;
  title: string;
  action: string;
  impactUsdMonthly: number | null;
  severity: 'low' | 'med' | 'high';
}

export function opportunities(
  result: SimulatorResult,
  fleets: FleetEntry[],
  catalog: CatalogEntry[],
  scope: ScopeSelection | null,
  rate: RateType = 'payg',
): Opportunity[] {
  const out: Opportunity[] = [];
  const nodes = filterNodesByScope(result, fleets, scope);
  if (nodes.length === 0) return out;

  // 1. Stranding recovery — if recoverable $ > $1000/mo, flag.
  const stranded = strandedRevenue(result, fleets, catalog, scope, rate);
  if (stranded.recoverableUsdMonthly && stranded.recoverableUsdMonthly > 1000) {
    out.push({
      id: 'stranding-recovery',
      title: 'Defrag occupied nodes to recover stranded capacity',
      action: `~$${Math.round(stranded.recoverableUsdMonthly).toLocaleString()}/mo recoverable with bin-pack optimization`,
      impactUsdMonthly: stranded.recoverableUsdMonthly,
      severity: stranded.recoverableUsdMonthly > 10000 ? 'high' : 'med',
    });
  }

  // 2. Underutilized clusters (< 25% mem util).
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  const byCluster = new Map<string, NodeDetail[]>();
  for (const n of nodes) {
    if (!n.clusterId) continue;
    if (!byCluster.has(n.clusterId)) byCluster.set(n.clusterId, []);
    byCluster.get(n.clusterId)!.push(n);
  }
  for (const [clusterId, clusterNodes] of byCluster.entries()) {
    const occupied = clusterNodes.filter((n) => n.vmsPlaced.length > 0);
    if (clusterNodes.length === 0) continue;
    const utilPct = (occupied.length / clusterNodes.length) * 100;
    if (utilPct > 0 && utilPct < 25) {
      const fleet = fleetById.get(clusterId);
      out.push({
        id: `under-util-${clusterId}`,
        title: `Cluster ${fleet?.hardwareGroupName ?? clusterId} is underutilized`,
        action: `${utilPct.toFixed(0)}% node utilization. Consolidate workload or right-size the fleet.`,
        impactUsdMonthly: null,
        severity: 'low',
      });
    }
  }

  // 3. Sellable headroom callout.
  const revenue = revenueRollup(result, fleets, catalog, scope, rate);
  if (revenue.headroomMonthly > 10000) {
    out.push({
      id: 'sellable-headroom',
      title: 'Significant unsold capacity available',
      action: `~$${Math.round(revenue.headroomMonthly).toLocaleString()}/mo additional revenue if remaining slots fill`,
      impactUsdMonthly: revenue.headroomMonthly,
      severity: revenue.headroomMonthly > 100000 ? 'high' : 'med',
    });
  }

  // Sort by impact (high → low), null impact rows go last.
  out.sort((a, b) => {
    const ai = a.impactUsdMonthly ?? -1;
    const bi = b.impactUsdMonthly ?? -1;
    return bi - ai;
  });
  return out.slice(0, 5);
}

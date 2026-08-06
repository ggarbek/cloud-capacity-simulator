/**
 * Scenario Analysis — "what else could pack onto the fleet?" (v2.23).
 *
 * Pure, result-driven helpers for the Results › Scenario analysis tab. The
 * user picks a VM size + a scope (fleet-wide / region / zone / cluster) and
 * we report how many MORE of that size could fit into the LEFTOVER capacity
 * of the current run — an extra BoM layered on top of what's already
 * deployed — plus, when they enter a target quantity, how many would be
 * blocked and why.
 *
 * Everything reuses the canonical engine helpers:
 *   - `sellableCapacity` (engine/insights) is the source of truth for the
 *     per-size max fit into remaining space — same numbers the Overview's
 *     "sellable" answer uses, so the two surfaces always agree.
 *   - `filterNodesByScope` + `fungibilityAllows` drive the blocked-reason
 *     diagnosis.
 *   - `regionScopedCatalog` supplies specs + rates so $ matches the rest of
 *     the app.
 *
 * It is ADDITIVE: nothing is added to `state`, nothing is evicted — this is
 * headroom on the current result. Keeping it pure + result-shaped is
 * deliberate: a future live-data feed (real fleet → a SimulatorResult) flows
 * through `computeScenario` unchanged.
 */
import type { AppState, ScopeSelection } from '../state/AppState';
import { fleetList } from '../state/AppState';
import type { CatalogEntry, NodeDetail, SimulatorResult } from '../types';
import { HOURS_PER_MONTH } from '../types';
import {
  sellableCapacity,
  filterNodesByScope,
  fungibilityAllows,
  rateFor,
  type RateType,
  type FleetEntry,
  type FungibilityMatrix,
} from '../engine/insights';
import { regionScopedCatalog } from './runEngine';
import {
  buildFleetHierarchy,
  type RegionGroup,
  type ClusterGroup,
  NO_REGION,
  NO_ZONE,
} from '../components/fleetmap/fleetmapData';

// ────────────────────────────────────────────────────────────────────────
// Scope options — Fleet-wide + every region / zone / cluster present.
// ────────────────────────────────────────────────────────────────────────
export interface ScopeOption {
  /** Stable id for a <select> (scope kind + key, or 'fleet'). */
  id: string;
  label: string;
  kind: 'fleet' | 'region' | 'zone' | 'cluster';
  scope: ScopeSelection | null; // null = fleet-wide
}

export function listScopeOptions(regions: RegionGroup[]): ScopeOption[] {
  const out: ScopeOption[] = [{ id: 'fleet', label: 'Fleet-wide', kind: 'fleet', scope: null }];
  const seenZone = new Set<string>();
  for (const rg of regions) {
    if (rg.region !== NO_REGION) {
      out.push({ id: `region:${rg.region}`, label: rg.label, kind: 'region', scope: { kind: 'region', key: rg.region } });
    }
    for (const zg of rg.zones) {
      // Engine scope keys zones by name (global). Dedupe so the same zone
      // name across regions doesn't list twice (rare; single-region is the
      // common case). Prefix with the region for legibility when tagged.
      if (zg.zone !== NO_ZONE && !seenZone.has(zg.zone)) {
        seenZone.add(zg.zone);
        const label = rg.region !== NO_REGION ? `${rg.label} · ${zg.label}` : zg.label;
        out.push({ id: `zone:${zg.zone}`, label, kind: 'zone', scope: { kind: 'zone', key: zg.zone } });
      }
      for (const cg of zg.clusters) {
        out.push({
          id: `cluster:${cg.clusterId}`,
          label: `Cluster ${cg.index} · ${cg.hwLabel}`,
          kind: 'cluster',
          scope: { kind: 'cluster', key: cg.clusterId },
        });
      }
    }
  }
  return out;
}

/** The clusters belonging to a scope (for the per-cluster landing table). */
function clustersInScope(regions: RegionGroup[], scope: ScopeSelection | null): ClusterGroup[] {
  const all = regions.flatMap((r) => r.zones.flatMap((z) => z.clusters));
  if (!scope) return all;
  if (scope.kind === 'cluster') return all.filter((c) => c.clusterId === scope.key);
  if (scope.kind === 'region') return all.filter((c) => (c.fleet?.region || '') === scope.key);
  if (scope.kind === 'zone') return all.filter((c) => (c.fleet?.zone || '') === scope.key);
  return all;
}

// ────────────────────────────────────────────────────────────────────────
// The scenario result.
// ────────────────────────────────────────────────────────────────────────
export type ScenarioBlockKind = 'oversize-mem' | 'oversize-vcpu' | 'fungibility' | 'capacity';

export interface ScenarioBlock {
  kind: ScenarioBlockKind;
  /** structural = can never fit (red) · user = fixable e.g. fungibility
   *  (amber) · capacity = scope is full (blue). */
  severity: 'structural' | 'user' | 'capacity';
  label: string; // short chip
  detail: string; // one plain sentence
}

export interface ScenarioClusterRow {
  clusterId: string;
  index: number;
  hwLabel: string;
  /** Deployment location — undefined when the cluster is untagged. */
  region?: string;
  zone?: string;
  fits: number;
  /** How many deployable nodes this scenario lands at least one VM on — the
   *  node footprint the scenario consumes. Undefined on the single-size path
   *  (which has no per-node placement). */
  nodesConsumed?: number;
  monthlyRevenue: number | null;
  /** Which scenario sizes land here + how many (biggest first). Empty for the
   *  single-size `computeScenario`; populated by the multi-size packer. */
  bySize: { vmSizeName: string; count: number }[];
  /** Post-scenario binding-dimension utilization of this cluster's deployable
   *  nodes (0–100) — how FULL the cluster would be after this scenario lands.
   *  Gives the "Where they'd land" bars a real point of reference (near-full vs
   *  room left) instead of a relative count. Undefined on the single-size path. */
  fillPct?: number;
  /** Which dimension binds the fill % (memory / vCPU / network / storage). */
  bindingDim?: 'memory' | 'vCPU' | 'network' | 'storage';
}

/** A cluster's region / zone, dropping the untagged sentinels. */
function placeOf(cg: ClusterGroup): { region?: string; zone?: string } {
  const region = cg.fleet?.region;
  const zone = cg.fleet?.zone;
  return {
    region: region && region !== NO_REGION ? region : undefined,
    zone: zone && zone !== NO_ZONE ? zone : undefined,
  };
}

export interface ScenarioResult {
  vmSizeName: string;
  /** Max additional units of this size that fit in scope's leftover space. */
  fitCount: number;
  hourlyUsd: number | null;
  monthlyRevenue: number | null;
  perCluster: ScenarioClusterRow[];
  // ── Target analysis (null when the user hasn't entered a quantity) ──
  target: number | null;
  placed: number | null;
  blocked: number | null;
  block: ScenarioBlock | null;
}

const SELLABLE_NODE = (n: NodeDetail): boolean =>
  n.state === 'deployable' ||
  n.state === 'occupied-partial' ||
  n.state === 'occupied-full' ||
  n.state === 'isolated';

const fmtInt = (n: number): string => Math.round(n).toLocaleString();

/** Max additional fit of one size into a scope's remaining space, via the
 *  canonical `sellableCapacity` walk (scope- + fungibility-aware). */
function fitFor(
  result: SimulatorResult,
  fleets: FleetEntry[],
  vm: CatalogEntry,
  scope: ScopeSelection | null,
  rate: RateType,
  matrix: FungibilityMatrix | undefined,
): { fitCount: number; hourlyUsd: number | null; monthlyRevenue: number | null } {
  const rows = sellableCapacity(result, fleets, [vm], scope, { rate, matrix, top: 1 });
  const row = rows[0];
  const hourly = row?.hourlyUsd ?? rateFor(vm, rate) ?? null;
  return {
    fitCount: row?.fitCount ?? 0,
    hourlyUsd: hourly,
    monthlyRevenue: row?.monthlyRevenue ?? 0,
  };
}

/** Why the requested overflow can't fit — structural oversize, fungibility,
 *  or the scope simply being full. */
function diagnoseBlock(
  result: SimulatorResult,
  fleets: FleetEntry[],
  vm: CatalogEntry,
  scope: ScopeSelection | null,
  matrix: FungibilityMatrix | undefined,
  scopeLabel: string,
): ScenarioBlock {
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  const nodes = filterNodesByScope(result, fleets, scope).filter(SELLABLE_NODE);
  if (nodes.length === 0) {
    return {
      kind: 'capacity',
      severity: 'capacity',
      label: 'No nodes',
      detail: `No deployable nodes in ${scopeLabel}.`,
    };
  }
  const matrixOn = !!matrix && Object.keys(matrix).length > 0;
  const eligible = nodes.filter((n) =>
    fungibilityAllows(vm, n.clusterId ? fleetById.get(n.clusterId)?.hardwareGroupId : undefined, matrix),
  );
  if (matrixOn && eligible.length === 0) {
    return {
      kind: 'fungibility',
      severity: 'user',
      label: 'No eligible HW',
      detail: `No hardware in ${scopeLabel} is authored to host ${vm.vmSizeName} — add a Home or Spillover rule on the VM fungibility tab.`,
    };
  }
  const pool = eligible.length ? eligible : nodes;
  const maxMem = Math.max(...pool.map((n) => n.memoryTotalGib || 0));
  const maxVcpu = Math.max(...pool.map((n) => n.vcpusTotal || 0));
  if (vm.memoryGib > maxMem) {
    return {
      kind: 'oversize-mem',
      severity: 'structural',
      label: 'Too big (memory)',
      detail: `${vm.vmSizeName} needs ${fmtInt(vm.memoryGib)} GiB; the largest node in ${scopeLabel} has ${fmtInt(maxMem)} GiB — it can't fit even on an empty node.`,
    };
  }
  if (vm.vcpus > maxVcpu) {
    return {
      kind: 'oversize-vcpu',
      severity: 'structural',
      label: 'Too big (vCPU)',
      detail: `${vm.vmSizeName} needs ${fmtInt(vm.vcpus)} vCPU; the largest node in ${scopeLabel} has ${fmtInt(maxVcpu)} vCPU — it can't fit even on an empty node.`,
    };
  }
  // Structurally fits + fungibility-allowed, so the scope is simply full.
  // Name the tightest dimension by aggregate remaining ÷ per-unit need.
  let remMem = 0, remVcpu = 0, remNet = 0, remStor = 0;
  let netCapped = false, storCapped = false;
  for (const n of eligible.length ? eligible : nodes) {
    remMem += Math.max(0, (n.memoryTotalGib || 0) - (n.memoryUsedGib || 0));
    remVcpu += Math.max(0, (n.vcpusTotal || 0) - (n.vcpusUsed || 0));
    if (typeof n.throughputTotalMbps === 'number') {
      netCapped = true;
      remNet += Math.max(0, n.throughputTotalMbps - (n.throughputUsedMbps || 0));
    }
    if (typeof n.storageThroughputTotalMbps === 'number') {
      storCapped = true;
      remStor += Math.max(0, n.storageThroughputTotalMbps - (n.storageThroughputUsedMbps || 0));
    }
  }
  const ratios: { dim: string; r: number }[] = [
    { dim: 'memory', r: vm.memoryGib > 0 ? remMem / vm.memoryGib : Infinity },
    { dim: 'vCPU', r: vm.vcpus > 0 ? remVcpu / vm.vcpus : Infinity },
  ];
  if (netCapped && (vm.networkMbps || 0) > 0) ratios.push({ dim: 'network', r: remNet / vm.networkMbps });
  if (storCapped && (vm.remoteStorageMbpsPremium || 0) > 0)
    ratios.push({ dim: 'storage', r: remStor / (vm.remoteStorageMbpsPremium as number) });
  const tightest = ratios.sort((a, b) => a.r - b.r)[0];
  return {
    kind: 'capacity',
    severity: 'capacity',
    label: `${tightest.dim} full`,
    detail: `${scopeLabel} is at capacity for ${vm.vmSizeName} — ${tightest.dim} is the binding constraint on its remaining nodes. Add hardware (or free capacity) to fit more.`,
  };
}

/**
 * Compute the scenario for one chosen size + scope (+ optional target).
 * `target` null/0 = just report the max fit; > max = report the shortfall.
 */
export function computeScenario(
  state: AppState,
  result: SimulatorResult,
  vmSizeName: string,
  scope: ScopeSelection | null,
  rate: RateType,
  target: number | null,
  scopeLabel: string,
): ScenarioResult | null {
  const catalog = regionScopedCatalog(state);
  const vm = catalog.find((c) => c.vmSizeName === vmSizeName);
  if (!vm) return null;
  const fleets = fleetList(state);
  const matrix = state.userFungibility as FungibilityMatrix;

  const total = fitFor(result, fleets, vm, scope, rate, matrix);

  const regions = buildFleetHierarchy(state, result);
  const scopeClusters = clustersInScope(regions, scope);
  const perCluster: ScenarioClusterRow[] = scopeClusters
    .map((cg) => {
      const f = fitFor(result, fleets, vm, { kind: 'cluster', key: cg.clusterId }, rate, matrix);
      return {
        clusterId: cg.clusterId,
        index: cg.index,
        hwLabel: cg.hwLabel,
        ...placeOf(cg),
        fits: f.fitCount,
        monthlyRevenue: f.monthlyRevenue,
        bySize: f.fitCount > 0 ? [{ vmSizeName, count: f.fitCount }] : [],
      };
    })
    .sort((a, b) => b.fits - a.fits || a.index - b.index);

  let placed: number | null = null;
  let blocked: number | null = null;
  let block: ScenarioBlock | null = null;
  if (target != null && target > 0) {
    placed = Math.min(target, total.fitCount);
    blocked = Math.max(0, target - total.fitCount);
    if (blocked > 0) block = diagnoseBlock(result, fleets, vm, scope, matrix, scopeLabel);
  } else if (total.fitCount === 0) {
    // No target, but nothing fits — still explain WHY (don't go silent on a
    // bare "No room"; the cause could be fungibility, oversize, or capacity).
    block = diagnoseBlock(result, fleets, vm, scope, matrix, scopeLabel);
  }

  return {
    vmSizeName,
    fitCount: total.fitCount,
    hourlyUsd: total.hourlyUsd,
    monthlyRevenue: total.monthlyRevenue,
    perCluster,
    target: target ?? null,
    placed,
    blocked,
    block,
  };
}

// ════════════════════════════════════════════════════════════════════════
// Multi-size scenario — a "BoM on top of the run".
//
// The single-size `computeScenario` reports each size's INDEPENDENT max (as
// if it alone filled the headroom). A multi-size scenario is different: the
// sizes COMPETE for the same leftover capacity, exactly like a real BoM
// packing onto the fleet. So we build a mutable per-node capacity view of the
// scope and greedily place each line in order, CONSUMING capacity as we go —
// `placed`/`blocked` then reflect what actually fits alongside the others.
// ════════════════════════════════════════════════════════════════════════
export interface ScenarioLine {
  vmSizeName: string;
  /** null = "as many as fit" (grabs whatever capacity is left at its turn). */
  target: number | null;
}

export interface ScenarioLineResult {
  vmSizeName: string;
  target: number | null;
  placed: number;
  /** The ceiling for this size on its own — how many would fit into the
   *  scope's leftover capacity if it alone filled it (ignores competition
   *  from the other lines). Lets the UI show "chose N · up to MAX fit". */
  maxFit: number;
  /** Shortfall vs an explicit target; null when the line is "max". */
  blocked: number | null;
  hourlyUsd: number | null;
  /** Revenue DRIVEN — what the placed units would earn per month. */
  monthlyRevenue: number | null;
  /** Revenue BLOCKED — what the shortfall units WOULD earn if the fleet
   *  could hold them (the upside left on the table). null when unpriced or
   *  the line has no fixed target. */
  blockedRevenue: number | null;
  /** Set when the line placed fewer than asked (or 0) — names the reason. */
  block: ScenarioBlock | null;
}

export interface MultiScenarioResult {
  lines: ScenarioLineResult[];
  totalPlaced: number;
  /** Sum of targets; null if any line is "max" (no fixed ask). */
  totalRequested: number | null;
  /** Revenue driven by everything that fits (per month). */
  totalMonthlyRevenue: number | null;
  /** Total undeployable units across lines with a target shortfall. */
  totalBlocked: number;
  /** Revenue left on the table because the fleet can't hold the shortfall. */
  totalBlockedRevenue: number | null;
  anyUnpriced: boolean;
  perCluster: ScenarioClusterRow[];
  anyBlocked: boolean;
}

interface MutNode {
  clusterId: string | undefined;
  hwGroupId: string | undefined;
  /** Running count of scenario VMs this node has absorbed — used to tally the
   *  node footprint the scenario consumes per cluster. */
  scenarioPlaced: number;
  memLeft: number;
  vcpuLeft: number;
  netLeft: number; // Infinity when the node has no network cap
  storLeft: number; // Infinity when the node has no storage cap
  // Totals (denominator for post-scenario fullness). Net/stor = Infinity = uncapped.
  memTotal: number;
  vcpuTotal: number;
  netTotal: number;
  storTotal: number;
}

const numOr = (x: unknown, fallback: number): number =>
  typeof x === 'number' && Number.isFinite(x) ? x : fallback;

/** Mutable per-node capacity view of a scope's sellable (non-reserved) nodes. */
function buildMutNodes(
  result: SimulatorResult,
  fleets: FleetEntry[],
  scope: ScopeSelection | null,
): MutNode[] {
  const fleetById = new Map(fleets.map((f) => [f.id, f.fleet]));
  return filterNodesByScope(result, fleets, scope)
    .filter((n) => n.state !== 'reserved' && SELLABLE_NODE(n))
    .map((n) => {
      const netCapped =
        typeof n.throughputTotalMbps === 'number' && Number.isFinite(n.throughputTotalMbps);
      const storCapped =
        typeof n.storageThroughputTotalMbps === 'number' &&
        Number.isFinite(n.storageThroughputTotalMbps);
      return {
        clusterId: n.clusterId,
        hwGroupId: n.clusterId ? fleetById.get(n.clusterId)?.hardwareGroupId : undefined,
        scenarioPlaced: 0,
        memLeft: Math.max(0, numOr(n.memoryTotalGib, 0) - numOr(n.memoryUsedGib, 0)),
        vcpuLeft: Math.max(0, numOr(n.vcpusTotal, 0) - numOr(n.vcpusUsed, 0)),
        netLeft: netCapped ? Math.max(0, (n.throughputTotalMbps as number) - numOr(n.throughputUsedMbps, 0)) : Infinity,
        storLeft: storCapped ? Math.max(0, (n.storageThroughputTotalMbps as number) - numOr(n.storageThroughputUsedMbps, 0)) : Infinity,
        memTotal: numOr(n.memoryTotalGib, 0),
        vcpuTotal: numOr(n.vcpusTotal, 0),
        netTotal: netCapped ? (n.throughputTotalMbps as number) : Infinity,
        storTotal: storCapped ? (n.storageThroughputTotalMbps as number) : Infinity,
      };
    });
}

/** Post-scenario fullness per cluster — the binding-dimension utilization of
 *  its deployable nodes after the scenario VMs have consumed capacity. Read off
 *  the (now-mutated) mutable nodes once placement is done. */
function fillByCluster(
  nodes: MutNode[],
): Map<string, { pct: number; dim: 'memory' | 'vCPU' | 'network' | 'storage' }> {
  interface Agg {
    memT: number; memL: number; vcpuT: number; vcpuL: number;
    netT: number; netL: number; netCapped: boolean;
    storT: number; storL: number; storCapped: boolean;
  }
  const agg = new Map<string, Agg>();
  for (const n of nodes) {
    const cid = n.clusterId ?? '';
    let a = agg.get(cid);
    if (!a) {
      a = { memT: 0, memL: 0, vcpuT: 0, vcpuL: 0, netT: 0, netL: 0, netCapped: false, storT: 0, storL: 0, storCapped: false };
      agg.set(cid, a);
    }
    a.memT += n.memTotal; a.memL += n.memLeft;
    a.vcpuT += n.vcpuTotal; a.vcpuL += n.vcpuLeft;
    if (Number.isFinite(n.netTotal)) { a.netCapped = true; a.netT += n.netTotal; a.netL += n.netLeft; }
    if (Number.isFinite(n.storTotal)) { a.storCapped = true; a.storT += n.storTotal; a.storL += n.storLeft; }
  }
  const out = new Map<string, { pct: number; dim: 'memory' | 'vCPU' | 'network' | 'storage' }>();
  for (const [cid, a] of agg) {
    const dims: { dim: 'memory' | 'vCPU' | 'network' | 'storage'; util: number }[] = [];
    if (a.memT > 0) dims.push({ dim: 'memory', util: (a.memT - a.memL) / a.memT });
    if (a.vcpuT > 0) dims.push({ dim: 'vCPU', util: (a.vcpuT - a.vcpuL) / a.vcpuT });
    if (a.netCapped && a.netT > 0) dims.push({ dim: 'network', util: (a.netT - a.netL) / a.netT });
    if (a.storCapped && a.storT > 0) dims.push({ dim: 'storage', util: (a.storT - a.storL) / a.storT });
    const b = dims.sort((x, y) => y.util - x.util)[0];
    if (b) out.set(cid, { pct: Math.max(0, Math.min(100, Math.round(b.util * 100))), dim: b.dim });
  }
  return out;
}

/** First-fit place up to `need` units of `vm` across the mutable nodes,
 *  consuming capacity. Returns how many landed + per-cluster tally. */
function placeLine(
  nodes: MutNode[],
  vm: CatalogEntry,
  matrix: FungibilityMatrix | undefined,
  need: number,
): { placed: number; perCluster: Map<string, number> } {
  const vmNet = numOr(vm.networkMbps, 0);
  const vmStor = numOr(vm.remoteStorageMbpsPremium, 0);
  let placed = 0;
  const perCluster = new Map<string, number>();
  for (const n of nodes) {
    if (placed >= need) break;
    if (!fungibilityAllows(vm, n.hwGroupId, matrix)) continue;
    if (n.memLeft < vm.memoryGib || n.vcpuLeft < vm.vcpus) continue;
    const fitsHere = Math.min(
      Math.floor(n.memLeft / vm.memoryGib),
      Math.floor(n.vcpuLeft / vm.vcpus),
      vmNet > 0 ? Math.floor(n.netLeft / vmNet) : Infinity,
      vmStor > 0 ? Math.floor(n.storLeft / vmStor) : Infinity,
    );
    if (!Number.isFinite(fitsHere) || fitsHere <= 0) continue;
    const take = Math.min(fitsHere, need - placed);
    n.memLeft -= take * vm.memoryGib;
    n.vcpuLeft -= take * vm.vcpus;
    if (vmNet > 0) n.netLeft -= take * vmNet;
    if (vmStor > 0) n.storLeft -= take * vmStor;
    n.scenarioPlaced += take;
    placed += take;
    const key = n.clusterId ?? '';
    perCluster.set(key, (perCluster.get(key) ?? 0) + take);
  }
  return { placed, perCluster };
}

/**
 * Pack a list of sizes (a scenario BoM) into a scope's leftover capacity, in
 * list order, competing for the same space. Each line reports what actually
 * fit alongside the others. ADDITIVE — `state` + `result` are never mutated.
 */
export function computeMultiScenario(
  state: AppState,
  result: SimulatorResult,
  lines: ScenarioLine[],
  scope: ScopeSelection | null,
  rate: RateType,
  scopeLabel: string,
): MultiScenarioResult {
  const catalog = regionScopedCatalog(state);
  const bySize = new Map<string, CatalogEntry>();
  for (const c of catalog) if (!bySize.has(c.vmSizeName)) bySize.set(c.vmSizeName, c);
  const fleets = fleetList(state);
  const matrix = state.userFungibility as FungibilityMatrix;
  const nodes = buildMutNodes(result, fleets, scope);

  const regions = buildFleetHierarchy(state, result);
  const clusterMeta = new Map(
    clustersInScope(regions, scope).map((cg) => [cg.clusterId, cg]),
  );
  const perClusterCount = new Map<string, number>();
  const perClusterRevenue = new Map<string, number>();
  // cid → (sizeName → count) so each cluster can show WHICH sizes land on it.
  const perClusterBySize = new Map<string, Map<string, number>>();

  const lineResults: ScenarioLineResult[] = [];
  let totalPlaced = 0;
  let totalRevenue = 0;
  let totalBlocked = 0;
  let totalBlockedRevenue = 0;
  let anyBlockedRevenuePriced = false;
  let anyUnpriced = false;
  let requestedSum = 0;
  let anyMax = false;
  let anyBlocked = false;

  for (const line of lines) {
    const vm = bySize.get(line.vmSizeName);
    const hourly = vm ? rateFor(vm, rate) ?? null : null;
    if (line.target == null) anyMax = true;
    else requestedSum += line.target;

    if (!vm || vm.memoryGib <= 0 || vm.vcpus <= 0) {
      if (line.target != null) totalBlocked += line.target;
      lineResults.push({
        vmSizeName: line.vmSizeName,
        target: line.target,
        placed: 0,
        maxFit: 0,
        blocked: line.target ?? null,
        hourlyUsd: hourly,
        monthlyRevenue: hourly != null ? 0 : null,
        blockedRevenue: null,
        block: {
          kind: 'capacity',
          severity: 'capacity',
          label: 'Not priced here',
          detail: `${line.vmSizeName} isn't in the catalog for this region — it can't be placed or valued.`,
        },
      });
      continue;
    }

    // Per-size ceiling — how many of THIS size alone fit into the scope's full
    // leftover (independent of the other lines), via the canonical sellable
    // walk. Surfaces "you chose N · up to MAX fit".
    const maxFit = sellableCapacity(result, fleets, [vm], scope, { rate, matrix, top: 1 })[0]?.fitCount ?? 0;

    const need = line.target ?? Infinity;
    const { placed, perCluster } = placeLine(nodes, vm, matrix, need);
    totalPlaced += placed;
    for (const [cid, cnt] of perCluster) {
      perClusterCount.set(cid, (perClusterCount.get(cid) ?? 0) + cnt);
      if (hourly != null)
        perClusterRevenue.set(cid, (perClusterRevenue.get(cid) ?? 0) + cnt * hourly * HOURS_PER_MONTH);
      let sizeMap = perClusterBySize.get(cid);
      if (!sizeMap) {
        sizeMap = new Map();
        perClusterBySize.set(cid, sizeMap);
      }
      sizeMap.set(line.vmSizeName, (sizeMap.get(line.vmSizeName) ?? 0) + cnt);
    }
    const monthly = hourly != null ? placed * hourly * HOURS_PER_MONTH : null;
    if (monthly != null) totalRevenue += monthly;
    else if (placed > 0) anyUnpriced = true;

    // Block reason: explicit shortfall, or 0-placed with no target.
    const shortfall = line.target != null ? Math.max(0, line.target - placed) : 0;
    let block: ScenarioBlock | null = null;
    if (shortfall > 0 || (line.target == null && placed === 0)) {
      block = diagnoseBlock(result, fleets, vm, scope, matrix, scopeLabel);
    }
    if (shortfall > 0) anyBlocked = true;
    totalBlocked += shortfall;
    // Revenue left on the table for what can't deploy.
    const blockedRevenue =
      shortfall > 0 && hourly != null ? shortfall * hourly * HOURS_PER_MONTH : hourly != null ? 0 : null;
    if (shortfall > 0 && hourly != null) {
      totalBlockedRevenue += shortfall * hourly * HOURS_PER_MONTH;
      anyBlockedRevenuePriced = true;
    }

    lineResults.push({
      vmSizeName: line.vmSizeName,
      target: line.target,
      placed,
      maxFit,
      blocked: line.target != null ? shortfall : null,
      hourlyUsd: hourly,
      monthlyRevenue: monthly,
      blockedRevenue,
      block,
    });
  }

  // Post-scenario fullness — `nodes` is now consumed, so this reflects how full
  // each cluster would be once the scenario lands.
  const fill = fillByCluster(nodes);
  // Node footprint — how many deployable nodes the scenario actually lands on,
  // per cluster (a node counts once no matter how many scenario VMs it holds).
  const nodesConsumed = new Map<string, number>();
  for (const n of nodes) {
    if (n.scenarioPlaced <= 0) continue;
    const cid = n.clusterId ?? '';
    nodesConsumed.set(cid, (nodesConsumed.get(cid) ?? 0) + 1);
  }
  const perCluster: ScenarioClusterRow[] = [...perClusterCount.entries()]
    .map(([cid, fits]) => {
      const cg = clusterMeta.get(cid);
      const bySize = [...(perClusterBySize.get(cid)?.entries() ?? [])]
        .map(([vmSizeName, count]) => ({ vmSizeName, count }))
        .sort((a, b) => b.count - a.count || a.vmSizeName.localeCompare(b.vmSizeName));
      const f = fill.get(cid);
      return {
        clusterId: cid,
        index: cg?.index ?? 0,
        hwLabel: cg?.hwLabel ?? '—',
        ...(cg ? placeOf(cg) : {}),
        fits,
        nodesConsumed: nodesConsumed.get(cid) ?? 0,
        monthlyRevenue: perClusterRevenue.get(cid) ?? null,
        bySize,
        fillPct: f?.pct,
        bindingDim: f?.dim,
      };
    })
    .sort((a, b) => b.fits - a.fits || a.index - b.index);

  return {
    lines: lineResults,
    totalPlaced,
    totalRequested: anyMax ? null : requestedSum,
    totalMonthlyRevenue: totalPlaced > 0 && totalRevenue > 0 ? totalRevenue : anyUnpriced ? null : 0,
    totalBlocked,
    totalBlockedRevenue: totalBlocked > 0 ? (anyBlockedRevenuePriced ? totalBlockedRevenue : null) : 0,
    anyUnpriced,
    perCluster,
    anyBlocked,
  };
}

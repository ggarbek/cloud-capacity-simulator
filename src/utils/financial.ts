/**
 * v2.5 financial calculations — pure helpers driving the Finance tab and the
 * Node Detail tab's high-level $ chips. No React, no DOM, no AppState reach
 * — same purity contract as `src/engine/`.
 *
 * Inputs come from `state.userHardware` (capex + life), `state.userVms` (per-VM
 * hourly pricing — already in the catalog as `hourlyUsd` / `riOneYrHourlyUsd`
 * / `riThreeYrHourlyUsd`), and a `SimulatorResult` (which VMs landed where).
 *
 * Conventions:
 *   - Currency: USD throughout, but the model is currency-neutral — the
 *     numbers flow from whatever the user types in the Hardware + VM tabs.
 *   - Depreciation: straight-line, monthly. `monthly = totalCapex / lifeMonths`.
 *   - Revenue: PAYG hourly × HOURS_PER_MONTH (730) for parity with how
 *     Azure / AWS / GCP all model monthly billing.
 *   - GPM (gross profit margin): (revenue − depreciation) / revenue.
 *     Returns Infinity when revenue is 0 but cost is 0 too (no-op cluster).
 *     Returns -Infinity when revenue is 0 and cost > 0 (fully un-utilized).
 *   - Payback: capex / monthly_net_revenue. Same caveats as GPM.
 *
 * Defaults:
 *   - Missing usableLifeMonths → 72 (6 years), Server Builder default.
 *   - Missing cost → undefined cluster cost; downstream code shows "—" and
 *     suppresses GPM / payback rather than fabricating zeros.
 */
import {
  HOURS_PER_MONTH,
  totalNodes,
  type FleetSpec,
  type HardwareGroup,
  type NodeDetail,
  type SimulatorResult,
  type UserVm,
} from '../types';
import { rateFor, type RateType } from '../engine/insights';

const DEFAULT_USABLE_LIFE_MONTHS = 72;

export interface ClusterCapex {
  /** Total cluster capex in USD. Undefined when no cost data was authored. */
  totalUsd?: number;
  /** Per-node capex (authored or derived). Undefined when no cost data. */
  perNodeUsd?: number;
  /** Whether the value was derived from costPerRack ÷ nodesPerRack vs.
   *  authored per-node directly. UI surfaces this so the user knows the
   *  number is approximate. */
  derived: boolean;
}

/**
 * Resolve a cluster's capex following the v2.5 contract:
 *   1. costPerNodeUsd wins when set.
 *   2. Otherwise derive from costPerRackUsd ÷ nodesPerRack.
 *   3. When neither is set → undefined (Finance tab shows empty state).
 */
export function resolveClusterCapex(fleet: FleetSpec): ClusterCapex {
  const nodes = totalNodes(fleet);
  if (fleet.costPerNodeUsd != null && fleet.costPerNodeUsd > 0) {
    return {
      totalUsd: fleet.costPerNodeUsd * nodes,
      perNodeUsd: fleet.costPerNodeUsd,
      derived: false,
    };
  }
  if (fleet.costPerRackUsd != null && fleet.costPerRackUsd > 0 && fleet.nodesPerRack > 0) {
    const perNode = fleet.costPerRackUsd / fleet.nodesPerRack;
    return {
      totalUsd: perNode * nodes,
      perNodeUsd: perNode,
      derived: true,
    };
  }
  return { totalUsd: undefined, perNodeUsd: undefined, derived: false };
}

export function usableLife(fleet: FleetSpec): number {
  const m = fleet.usableLifeMonths;
  return m != null && m > 0 ? m : DEFAULT_USABLE_LIFE_MONTHS;
}

/**
 * Overlay the live Hardware-Library opex onto a placed cluster's fleet, by
 * `hardwareGroupId`. Mirrors RunFooter's live-mirror — but for the financial
 * rollup that drives the Overview, which reads the STORED fleet specs. Without
 * this, opex authored (or edited) on a server only reaches clusters placed
 * afterward; a pre-existing cluster (e.g. the demo snapshot, or any cluster
 * placed before the opex was set) would show stale depreciation-only cost.
 *
 * Scoped to opex deliberately: capex / usable-life behavior is left untouched
 * (the rollup keeps using each fleet's own stored capex), so this only adds
 * the new opex signal without changing any existing financial number.
 */
export function withLiveOpex(
  fleet: FleetSpec,
  hwById: Record<string, HardwareGroup>,
): FleetSpec {
  const g = fleet.hardwareGroupId ? hwById[fleet.hardwareGroupId] : undefined;
  if (!g) return fleet;
  if (fleet.opexPerNodeMonthlyUsd === g.opexPerNodeMonthlyUsd) return fleet;
  return { ...fleet, opexPerNodeMonthlyUsd: g.opexPerNodeMonthlyUsd };
}

export interface ClusterFinancials {
  clusterId: string;
  fleet: FleetSpec;
  capex: ClusterCapex;
  /** Usable life in months — falls back to DEFAULT_USABLE_LIFE_MONTHS. */
  lifeMonths: number;
  // Depreciation (straight-line, capex / life)
  monthlyDepreciation?: number;
  quarterlyDepreciation?: number;
  annualDepreciation?: number;
  lifetimeDepreciation?: number; // = totalCapex when life applied uniformly
  /** Recurring monthly operating cost (cash) = opexPerNodeMonthlyUsd × nodes.
   *  Undefined when no opex authored. */
  monthlyOpex?: number;
  /** Total monthly cost (COGS) = depreciation + opex. Drives gross margin.
   *  Undefined only when NEITHER depreciation nor opex is known. */
  monthlyCost?: number;
  // Revenue from placed VMs at PAYG hourly × HOURS_PER_MONTH
  monthlyRevenue: number;
  quarterlyRevenue: number;
  annualRevenue: number;
  lifetimeRevenue: number;
  // Profit / margins (undefined when capex unknown)
  monthlyGrossProfit?: number;
  grossProfitMarginPct?: number; // 0..100
  /** Months until cumulative net revenue covers capex. Undefined when
   *  capex unknown OR net revenue per month ≤ 0 (cluster losing money). */
  paybackMonths?: number;
  // Utilization signal — share of cluster's deployable capacity actually
  // packed by the BOM. Drives the Finance tab's "headroom" callouts.
  memoryUtilizationPct: number;
  vcpuUtilizationPct: number;
  // Counts
  placedVmCount: number;
  /** v2.19.55 — Placed VMs whose catalog entry has no PAYG hourly rate
   *  (e.g. M192ims_v2 and other Mv2/Mv3 SKUs that the seed deliberately
   *  ships unpriced per the Decoupling Doctrine). When this is > 0 and
   *  monthlyRevenue is 0, the Finance UI surfaces "N VMs lack published
   *  rates" so the user knows WHY the cluster reads $0 — and can fix it
   *  by uploading a VM Library rate sheet rather than assuming an engine
   *  bug. */
  unpricedVmCount: number;
  /** Distinct unpriced SKUs in this cluster, capped at 6 names for the
   *  tooltip — full list is reconstructable from nodeDetail if needed. */
  unpricedSkuSample: string[];
  /** Per-node monthly depreciation — used by the per-node hover tooltip in
   *  the rack map. */
  perNodeMonthlyDepreciation?: number;
}

interface FinancialsInput {
  clusterId: string;
  fleet: FleetSpec;
  nodes: NodeDetail[];
  catalog: UserVm[];
  /** Billing rate to value placed-VM revenue at — PAYG / 1-yr RI / 3-yr RI.
   *  Defaults to 'payg'. Margin + payback follow the selected rate. */
  rate?: RateType;
}

/**
 * Compute one cluster's financials from its fleet + the nodes returned by
 * the engine (which carry `vmsPlaced` lists). Caller filters
 * `result.nodeDetail` by `clusterId` and hands the slice in.
 */
export function computeClusterFinancials(input: FinancialsInput): ClusterFinancials {
  const { clusterId, fleet, nodes, catalog } = input;
  const rate = input.rate ?? 'payg';
  const capex = resolveClusterCapex(fleet);
  const lifeMonths = usableLife(fleet);
  const nodeCount = totalNodes(fleet);

  // Lookup VM rates by lowercased name. Catalog is small enough that O(n) per
  // VM is fine, but the index is cleaner.
  const rateIndex = new Map<string, UserVm>();
  for (const v of catalog) rateIndex.set(v.vmSizeName.toLowerCase(), v);

  // Revenue: walk every placed VM in this cluster and sum hourly × 730 at the
  // SELECTED rate (PAYG / 1-yr RI / 3-yr RI) — so the Overview's margin +
  // payback respond to the rate switch, matching the headroom/revenue rollup.
  // RI rates fall back to PAYG when not published (see rateFor). Track unpriced
  // VMs separately so the UI can explain a $0-revenue cluster that's actually
  // packed full (seed deliberately ships some M-series SKUs without rates per
  // the Decoupling Doctrine).
  let monthlyRevenue = 0;
  let placedVmCount = 0;
  let unpricedVmCount = 0;
  const unpricedSkus = new Set<string>();
  for (const n of nodes) {
    for (const placed of n.vmsPlaced) {
      placedVmCount++;
      const cat = rateIndex.get(placed.vmSizeName.toLowerCase());
      const hourly = cat ? rateFor(cat, rate) : undefined;
      if (hourly != null && hourly > 0) {
        monthlyRevenue += hourly * HOURS_PER_MONTH;
      } else {
        unpricedVmCount++;
        unpricedSkus.add(placed.vmSizeName);
      }
    }
  }
  const unpricedSkuSample = [...unpricedSkus].slice(0, 6);
  const quarterlyRevenue = monthlyRevenue * 3;
  const annualRevenue = monthlyRevenue * 12;
  const lifetimeRevenue = monthlyRevenue * lifeMonths;

  // Depreciation (only when capex known).
  const monthlyDepreciation =
    capex.totalUsd != null ? capex.totalUsd / lifeMonths : undefined;
  const quarterlyDepreciation =
    monthlyDepreciation != null ? monthlyDepreciation * 3 : undefined;
  const annualDepreciation =
    monthlyDepreciation != null ? monthlyDepreciation * 12 : undefined;
  const lifetimeDepreciation = capex.totalUsd; // straight-line → equals capex
  const perNodeMonthlyDepreciation =
    capex.perNodeUsd != null ? capex.perNodeUsd / lifeMonths : undefined;

  // Operating cost (cash) — opex per node × nodes (matches the node count
  // capex is spread over). Distinct from depreciation: a real recurring
  // outflow (power / cooling / space / support), not the capex amortized.
  const monthlyOpex =
    fleet.opexPerNodeMonthlyUsd != null && fleet.opexPerNodeMonthlyUsd > 0
      ? fleet.opexPerNodeMonthlyUsd * nodeCount
      : undefined;

  // Total monthly cost (COGS) = depreciation + opex. Defined when EITHER is
  // known, so opex-only fleets (no capex authored) still get a gross margin.
  const monthlyCost =
    monthlyDepreciation != null || monthlyOpex != null
      ? (monthlyDepreciation ?? 0) + (monthlyOpex ?? 0)
      : undefined;

  // Margins use the total monthly cost (depreciation + opex). Payback needs
  // the capex (cash already spent); its denominator is the net monthly margin.
  let monthlyGrossProfit: number | undefined;
  let grossProfitMarginPct: number | undefined;
  let paybackMonths: number | undefined;
  if (monthlyCost != null) {
    monthlyGrossProfit = monthlyRevenue - monthlyCost;
    grossProfitMarginPct =
      monthlyRevenue > 0 ? (monthlyGrossProfit / monthlyRevenue) * 100 : undefined;
    if (capex.totalUsd != null && monthlyGrossProfit > 0) {
      paybackMonths = capex.totalUsd / monthlyGrossProfit;
    }
  }

  // Utilization signal — only count nodes actually occupied (matches
  // SummaryBar / engine conventions for util %).
  const occupiedNodes = nodes.filter((n) => n.vmsPlaced.length > 0);
  const memUsed = occupiedNodes.reduce((s, n) => s + n.memoryUsedGib, 0);
  const memTotal = occupiedNodes.reduce((s, n) => s + n.memoryTotalGib, 0);
  const vcpuUsed = occupiedNodes.reduce((s, n) => s + n.vcpusUsed, 0);
  const vcpuTotal = occupiedNodes.reduce((s, n) => s + n.vcpusTotal, 0);
  const memoryUtilizationPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
  const vcpuUtilizationPct = vcpuTotal > 0 ? (vcpuUsed / vcpuTotal) * 100 : 0;

  return {
    clusterId,
    fleet,
    capex,
    lifeMonths,
    monthlyDepreciation,
    quarterlyDepreciation,
    annualDepreciation,
    lifetimeDepreciation,
    monthlyOpex,
    monthlyCost,
    monthlyRevenue,
    quarterlyRevenue,
    annualRevenue,
    lifetimeRevenue,
    monthlyGrossProfit,
    grossProfitMarginPct,
    paybackMonths,
    memoryUtilizationPct,
    vcpuUtilizationPct,
    placedVmCount,
    unpricedVmCount,
    unpricedSkuSample,
    perNodeMonthlyDepreciation,
  };
}

/**
 * Convenience: compute financials for every cluster in a SimulatorResult.
 * Returns one ClusterFinancials per distinct clusterId encountered in
 * `result.nodeDetail`. Callers supply the fleet by id (typically via
 * `fleetList(state)`).
 */
export function computeAllClusterFinancials(
  result: SimulatorResult,
  fleetById: Record<string, FleetSpec>,
  catalog: UserVm[],
  rate: RateType = 'payg',
): ClusterFinancials[] {
  const byCluster = new Map<string, NodeDetail[]>();
  for (const n of result.nodeDetail) {
    const id = n.clusterId ?? '_';
    if (!byCluster.has(id)) byCluster.set(id, []);
    byCluster.get(id)!.push(n);
  }
  const out: ClusterFinancials[] = [];
  for (const [clusterId, nodes] of byCluster) {
    const fleet = fleetById[clusterId];
    if (!fleet) continue; // namespaced node for a cluster that's been removed
    out.push(computeClusterFinancials({ clusterId, fleet, nodes, catalog, rate }));
  }
  return out;
}

/**
 * Rollup across every cluster — used for the Finance tab's top-line cards.
 * GPM and payback are computed off the SUM of depreciation and revenue rather
 * than averaging per-cluster percentages (which would weight clusters
 * incorrectly).
 */
export interface FleetFinancials {
  clusterCount: number;
  totalCapex?: number;
  monthlyDepreciation?: number;
  quarterlyDepreciation?: number;
  annualDepreciation?: number;
  lifetimeDepreciation?: number;
  /** Σ recurring monthly opex across clusters. Undefined when none authored. */
  monthlyOpex?: number;
  /** Σ total monthly cost (depreciation + opex). Undefined when neither set. */
  monthlyCost?: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  annualRevenue: number;
  lifetimeRevenue: number;
  monthlyGrossProfit?: number;
  grossProfitMarginPct?: number;
  paybackMonths?: number;
}

export function rollupFleetFinancials(rows: ClusterFinancials[]): FleetFinancials {
  if (rows.length === 0) {
    return {
      clusterCount: 0,
      monthlyRevenue: 0,
      quarterlyRevenue: 0,
      annualRevenue: 0,
      lifetimeRevenue: 0,
    };
  }
  let totalCapex = 0;
  let anyCapex = false;
  let monthlyDepreciation = 0;
  let lifetimeDepreciation = 0;
  let monthlyOpex = 0;
  let anyOpex = false;
  let monthlyRevenue = 0;
  let lifetimeRevenue = 0;
  for (const r of rows) {
    if (r.capex.totalUsd != null) {
      totalCapex += r.capex.totalUsd;
      anyCapex = true;
    }
    if (r.monthlyDepreciation != null) monthlyDepreciation += r.monthlyDepreciation;
    if (r.lifetimeDepreciation != null) lifetimeDepreciation += r.lifetimeDepreciation;
    if (r.monthlyOpex != null) {
      monthlyOpex += r.monthlyOpex;
      anyOpex = true;
    }
    monthlyRevenue += r.monthlyRevenue;
    lifetimeRevenue += r.lifetimeRevenue;
  }
  // Total monthly cost (COGS) = depreciation + opex; defined when EITHER set.
  const anyCost = anyCapex || anyOpex;
  const monthlyCost = anyCost
    ? (anyCapex ? monthlyDepreciation : 0) + (anyOpex ? monthlyOpex : 0)
    : undefined;
  const monthlyGrossProfit = monthlyCost != null ? monthlyRevenue - monthlyCost : undefined;
  const grossProfitMarginPct =
    monthlyGrossProfit != null && monthlyRevenue > 0
      ? (monthlyGrossProfit / monthlyRevenue) * 100
      : undefined;
  const paybackMonths =
    anyCapex && monthlyGrossProfit != null && monthlyGrossProfit > 0
      ? totalCapex / monthlyGrossProfit
      : undefined;
  return {
    clusterCount: rows.length,
    totalCapex: anyCapex ? totalCapex : undefined,
    monthlyDepreciation: anyCapex ? monthlyDepreciation : undefined,
    quarterlyDepreciation: anyCapex ? monthlyDepreciation * 3 : undefined,
    annualDepreciation: anyCapex ? monthlyDepreciation * 12 : undefined,
    lifetimeDepreciation: anyCapex ? lifetimeDepreciation : undefined,
    monthlyOpex: anyOpex ? monthlyOpex : undefined,
    monthlyCost,
    monthlyRevenue,
    quarterlyRevenue: monthlyRevenue * 3,
    annualRevenue: monthlyRevenue * 12,
    lifetimeRevenue,
    monthlyGrossProfit,
    grossProfitMarginPct,
    paybackMonths,
  };
}

/** Format a USD amount compactly: $1.2K / $4.5M / $1.2B. */
export function formatUsd(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Format a percentage to 1dp with a leading sign for negatives.
 * `12.4` → `12.4%`, `-3.07` → `−3.1%`, undefined / non-finite → `—`.
 * Used by the Profitability cards in FleetStatsBox so the same GP-margin
 * value renders identically wherever it shows up.
 */
export function formatPct(pct: number | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—';
  const sign = pct < 0 ? '−' : '';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

/** Format payback months as years+months when over a year, plain months when under. */
export function formatPayback(months: number | undefined): string {
  if (months == null || !Number.isFinite(months) || months <= 0) return '—';
  if (months < 12) return `${months.toFixed(1)} mo`;
  let yrs = Math.floor(months / 12);
  let rem = Math.round(months - yrs * 12);
  // Carry a rounded-up remainder so we never render "11 yr 12 mo".
  if (rem === 12) {
    yrs += 1;
    rem = 0;
  }
  if (rem === 0) return `${yrs} yr`;
  return `${yrs} yr ${rem} mo`;
}

export interface PaybackView {
  /** The figure to show, e.g. "18 mo", "~6 yr 9 mo", or "—". */
  value: string;
  /** A short sub-note when the estimate is beyond the usable life. */
  note?: string;
  /** Full explanation for a tooltip. */
  title?: string;
}

/**
 * Payback display that stays honest when the demand "loses money."
 *
 * The monthly margin is revenue minus straight-line DEPRECIATION (capex spread
 * over the usable life) and any OPEX. Depreciation isn't a cash cost — so a
 * negative accounting margin doesn't mean the hardware never pays back. The
 * cash payback is `capex / (monthly revenue − monthly opex)`: opex IS a cash
 * outflow, but depreciation is just the capex being recovered, so it's excluded
 * from the denominator. When revenue clears the full monthly cost, the net
 * payback (`paybackMonths`) is the right figure. When it doesn't, that net
 * payback is undefined, so we fall back to the cash estimate, which by
 * construction runs LONGER than the usable life — and we say so, instead of a
 * confusing "Never". If opex alone exceeds revenue, the fleet never recovers
 * its cash and we say that plainly.
 */
export function paybackView(opts: {
  paybackMonths?: number; // net (revenue − depreciation − opex) payback, if positive
  monthlyRevenue?: number;
  monthlyDepreciation?: number; // straight-line capex amortization (non-cash)
  monthlyOpex?: number; // recurring cash operating cost
  totalCapex?: number;
}): PaybackView {
  const { paybackMonths, monthlyRevenue, monthlyDepreciation, monthlyOpex, totalCapex } = opts;
  if (paybackMonths != null && Number.isFinite(paybackMonths) && paybackMonths > 0) {
    return { value: formatPayback(paybackMonths) };
  }
  // Loss case: revenue doesn't clear the full monthly cost. Cash payback =
  // capex / (revenue − opex) — depreciation is the capex spread out, not a
  // separate cash cost, so it's excluded; opex is a real cash outflow.
  if (monthlyRevenue && monthlyRevenue > 0 && totalCapex && totalCapex > 0) {
    const opex = monthlyOpex && monthlyOpex > 0 ? monthlyOpex : 0;
    const netCash = monthlyRevenue - opex;
    if (netCash <= 0) {
      // Operating cost alone outruns revenue — no cash is left to recover capex.
      return {
        value: '—',
        note: 'operating cost exceeds revenue',
        title: `The fleet's ${formatUsd(opex)}/mo operating cost is at or above its ${formatUsd(
          monthlyRevenue,
        )}/mo revenue, so it generates no net cash to recover the ${formatUsd(
          totalCapex,
        )} hardware cost. Raising utilization or trimming opex is required before it can pay back.`,
      };
    }
    const revPayback = totalCapex / netCash;
    const lifeMonths =
      monthlyDepreciation && monthlyDepreciation > 0 ? totalCapex / monthlyDepreciation : undefined;
    const beyond = lifeMonths != null && revPayback > lifeMonths;
    const cashSource = opex > 0 ? 'net cash (revenue − opex)' : 'revenue';
    return {
      value: `~${formatPayback(revPayback)}`,
      note: beyond && lifeMonths != null ? `beyond the ${formatPayback(lifeMonths)} life` : undefined,
      title:
        beyond && lifeMonths != null
          ? `On today's demand, ${cashSource} recovers the hardware's ${formatUsd(totalCapex)} cost in about ${formatPayback(
              revPayback,
            )} — longer than its ${formatPayback(
              lifeMonths,
            )} usable life, so it doesn't fully pay back before it's retired. Filling the spare headroom shortens this.`
          : `${opex > 0 ? 'Net cash (revenue − opex)' : 'Revenue'} recovers the hardware's cost in about ${formatPayback(revPayback)}.`,
    };
  }
  return { value: '—' };
}

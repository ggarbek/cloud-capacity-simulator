/**
 * Investment scenario helper (v3 — the "five questions" rebuild).
 *
 * Answers the two questions the tool previously couldn't:
 *   "Given this deployment of VMs, does new hardware investment make sense?"
 *   "Will the investment pay off in X years?"
 *
 * `evaluateInvestment` sandbox-runs the CANONICAL engine (buildAndRunSimulation
 * — never forked) on a temporary copy of the user's state with one extra
 * hypothetical cluster, then diffs the scenario against the baseline:
 * newly placed VMs, added revenue (two lenses: this BoM's demand vs selling
 * the new capacity to cap), capex, and payback vs the hardware's usable life.
 *
 * Pure module: no React, no DOM, no dispatch — the user's real state is
 * never mutated.
 */
import type { AppState } from '../state/AppState';
import { fleetList } from '../state/AppState';
import type { HardwareGroup, FleetSpec, SimulatorResult } from '../types';
import { buildAndRunSimulation, regionScopedCatalog } from './runEngine';
import { buildFleetFromGroup } from '../components/FleetBuilder';
import { revenueRollup, type RateType } from '../engine/insights';
import { usableLife } from './financial';
import { vmClass } from './vmTaxonomy';

export interface InvestmentPlan {
  /** Candidate hardware — usually a group from the user's library, but any
   *  HardwareGroup works (the Simple Calculator passes preset profiles). */
  hardware: HardwareGroup;
  rackCount: number;
  /** Placement of the hypothetical cluster. Defaults resolved from the
   *  existing fleet (most common region / zone) when omitted. */
  region?: string;
  zone?: string;
}

export type InvestmentVerdict =
  /** Demand revenue unlocked by the new hardware pays back the capex within
   *  its usable life. */
  | 'pays-back'
  /** Only selling the new capacity beyond this BoM pays back within life. */
  | 'pays-back-at-cap-only'
  /** Added revenue never covers the capex within usable life. */
  | 'never-pays-back'
  /** The hardware places zero additional VMs — blockers aren't capacity
   *  this hardware can fix (often fungibility or structural). */
  | 'no-help'
  /** Everything already fits — investment is a growth play, not a need. */
  | 'not-needed'
  /** No cost data on the hardware — placement delta shown, no payback. */
  | 'no-cost-data';

export interface InvestmentReport {
  plan: InvestmentPlan;
  /** Region / zone the scenario actually used (after defaulting). */
  region: string | undefined;
  zone: string | undefined;
  // Placement delta (demand lens)
  baselinePlaced: number;
  scenarioPlaced: number;
  deltaPlaced: number;
  baselineUnplaceable: number;
  scenarioUnplaceable: number;
  // Revenue deltas, $/month
  deltaRevenueTodayMonthly: number;
  deltaRevenueAtCapMonthly: number;
  // Cost side
  capexUsd?: number;
  addedMonthlyDepreciation?: number;
  usableLifeMonths: number;
  // Payback (months). Demand lens = revenue from newly placed BoM VMs only;
  // at-cap lens = if the added capacity also sells out. Undefined when the
  // added gross profit is ≤ 0 or cost data is missing.
  paybackMonthsDemand?: number;
  paybackMonthsAtCap?: number;
  /** True when the fungibility matrix had no rules for this hardware and the
   *  scenario assumed it can host the BoM's sizes (authored as last-tier
   *  spillover). Surfaced as a caveat — the user should author real rules. */
  assumedFungibility: boolean;
  verdict: InvestmentVerdict;
}

/** Most common value in a list (ties → first encountered). */
function mode<T>(values: (T | undefined)[]): T | undefined {
  const counts = new Map<T, number>();
  let best: T | undefined;
  let bestN = 0;
  for (const v of values) {
    if (v === undefined || v === null || v === ('' as unknown as T)) continue;
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

/** Default plan: the library hardware most of the fleet is built on (falls
 *  back to the first library entry), one rack, placed where the fleet is.
 *  Null when the library is empty. */
export function defaultInvestmentPlan(state: AppState): InvestmentPlan | null {
  if (state.userHardware.length === 0) return null;
  const fleets = fleetList(state);
  const hwIdMode = mode(fleets.map((f) => f.fleet.hardwareGroupId));
  const hardware =
    state.userHardware.find((g) => g.id === hwIdMode) ?? state.userHardware[0];
  return { hardware, rackCount: 1 };
}

/** Resolve the region / zone the scenario cluster lands in when the plan
 *  doesn't pin them: most common region among placed clusters, then the most
 *  common zone within that region. */
function resolvePlacement(
  state: AppState,
  plan: InvestmentPlan,
): { region: string | undefined; zone: string | undefined } {
  const fleets = fleetList(state);
  const region =
    plan.region ??
    mode(fleets.map((f) => f.fleet.region)) ??
    state.fleetRegions[0]?.region;
  const inRegion = fleets.filter((f) => (f.fleet.region ?? '') === (region ?? ''));
  const zone = plan.zone ?? mode(inRegion.map((f) => f.fleet.zone));
  return { region, zone };
}

/**
 * If the user's matrix is non-empty but carries no rule routing anything to
 * `hw`, the engine would reject every VM on it (NOT_AUTHORED) and the
 * scenario would read "no help" for a reason that's just un-authored intent.
 * In that case we author last-tier (5) spillover cells for the BoM's sizes —
 * never overriding any existing decision (including explicit Blocked) — and
 * flag it so the UI says "assumes this hardware can host your sizes".
 */
function extendMatrixForHardware(
  state: AppState,
  hw: HardwareGroup,
): { matrix: AppState['userFungibility']; assumed: boolean } {
  const matrix = state.userFungibility;
  if (!matrix || Object.keys(matrix).length === 0) {
    return { matrix, assumed: false }; // empty matrix = no enforcement
  }
  // Any non-blocked cell already routes to this hardware? Then real rules
  // exist — respect them as-is.
  for (const row of Object.values(matrix)) {
    const cell = row[hw.id];
    if (cell !== undefined && cell !== 'blocked') return { matrix, assumed: false };
  }
  const classByName = new Map(state.userVms.map((v) => [v.vmSizeName, vmClass(v)]));
  const next: AppState['userFungibility'] = { ...matrix };
  let assumed = false;
  for (const entry of state.bom) {
    const size = entry.vmSizeName;
    const cls = classByName.get(size);
    // Existing decision (size- or class-keyed, incl. explicit Blocked) wins.
    const existing = matrix[size]?.[hw.id] ?? (cls ? matrix[cls]?.[hw.id] : undefined);
    if (existing !== undefined) continue;
    next[size] = { ...(next[size] ?? {}), [hw.id]: 5 };
    assumed = true;
  }
  return { matrix: next, assumed };
}

const SCENARIO_FLEET_ID = 'invest-scenario';

export function evaluateInvestment(
  state: AppState,
  plan: InvestmentPlan,
  rateType: RateType,
  /** Reuse a fresh baseline result when the caller has one (avoids a second
   *  engine run). Computed from `state` when omitted. */
  baselineResult?: SimulatorResult,
): InvestmentReport {
  const { region, zone } = resolvePlacement(state, plan);
  const rackCount = Math.max(1, Math.round(plan.rackCount));

  // Hypothetical cluster — built exactly like a real placement.
  const scenarioFleet: FleetSpec = {
    ...buildFleetFromGroup(plan.hardware, rackCount, region ?? '', zone ?? ''),
    bufferAcknowledged: true,
  };
  if (!zone) scenarioFleet.zone = undefined;
  if (!region) scenarioFleet.region = undefined;

  const { matrix, assumed } = extendMatrixForHardware(state, plan.hardware);

  const baseline = baselineResult ?? buildAndRunSimulation(state);

  const scenarioState: AppState = {
    ...state,
    fleets: { ...state.fleets, [SCENARIO_FLEET_ID]: scenarioFleet },
    fleetOrder: [...state.fleetOrder, SCENARIO_FLEET_ID],
    userHardware: state.userHardware.some((g) => g.id === plan.hardware.id)
      ? state.userHardware
      : [...state.userHardware, plan.hardware],
    userFungibility: matrix,
  };
  const scenario = buildAndRunSimulation(scenarioState);

  // Region-scoped catalog (same filter the engine itself applies) so the
  // revenue rollup prices with the rates the engine placed against.
  const scopedCatalog = regionScopedCatalog(state);

  const baseRoll = revenueRollup(
    baseline, fleetList(state), scopedCatalog, null, rateType, state.userFungibility,
  );
  const scenRoll = revenueRollup(
    scenario, fleetList(scenarioState), scopedCatalog, null, rateType, matrix,
  );

  const baselineUnplaceable = baseline.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
  const scenarioUnplaceable = scenario.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
  const deltaPlaced = scenario.vmsPlaced - baseline.vmsPlaced;
  const deltaRevenueTodayMonthly = scenRoll.todayMonthly - baseRoll.todayMonthly;
  const deltaRevenueAtCapMonthly = scenRoll.atCapMonthly - baseRoll.atCapMonthly;

  // Cost side — per-node capex wins, then per-rack (matches resolveClusterCapex).
  const hw = plan.hardware;
  let capexUsd: number | undefined;
  if (hw.costPerNodeUsd != null && hw.costPerNodeUsd > 0 && (hw.nodesPerRack ?? 0) > 0) {
    capexUsd = hw.costPerNodeUsd * (hw.nodesPerRack ?? 0) * rackCount;
  } else if (hw.costPerRackUsd != null && hw.costPerRackUsd > 0) {
    capexUsd = hw.costPerRackUsd * rackCount;
  }
  const lifeMonths = usableLife(scenarioFleet);
  const addedMonthlyDepreciation = capexUsd != null ? capexUsd / lifeMonths : undefined;

  let paybackMonthsDemand: number | undefined;
  let paybackMonthsAtCap: number | undefined;
  if (capexUsd != null && addedMonthlyDepreciation != null) {
    const gpDemand = deltaRevenueTodayMonthly - addedMonthlyDepreciation;
    const gpAtCap = deltaRevenueAtCapMonthly - addedMonthlyDepreciation;
    if (gpDemand > 0) paybackMonthsDemand = capexUsd / gpDemand;
    if (gpAtCap > 0) paybackMonthsAtCap = capexUsd / gpAtCap;
  }

  let verdict: InvestmentVerdict;
  if (baselineUnplaceable === 0) {
    verdict = 'not-needed';
  } else if (deltaPlaced <= 0) {
    verdict = 'no-help';
  } else if (capexUsd == null) {
    verdict = 'no-cost-data';
  } else if (paybackMonthsDemand != null && paybackMonthsDemand <= lifeMonths) {
    verdict = 'pays-back';
  } else if (paybackMonthsAtCap != null && paybackMonthsAtCap <= lifeMonths) {
    verdict = 'pays-back-at-cap-only';
  } else {
    verdict = 'never-pays-back';
  }

  return {
    plan: { ...plan, rackCount },
    region,
    zone,
    baselinePlaced: baseline.vmsPlaced,
    scenarioPlaced: scenario.vmsPlaced,
    deltaPlaced,
    baselineUnplaceable,
    scenarioUnplaceable,
    deltaRevenueTodayMonthly,
    deltaRevenueAtCapMonthly,
    capexUsd,
    addedMonthlyDepreciation,
    usableLifeMonths: lifeMonths,
    paybackMonthsDemand,
    paybackMonthsAtCap,
    assumedFungibility: assumed,
    verdict,
  };
}

/**
 * computeAnswers — the five questions, answered in plain English (v3).
 *
 * The product thesis after the "value buried under complexity" feedback:
 * the tool exists to answer five questions about a VM deployment —
 *
 *   1. Is this deployment supportable on current capacity?
 *   2. Where are we blocked, and why?
 *   3. How much more can we sell on this fleet?
 *   4. Does new hardware investment make sense?
 *   5. Will the investment pay off, and when?
 *
 * This module turns a SimulatorResult into verdict-first answers for 1–3
 * (plus a profitability context row), and turns an InvestmentReport into
 * the rows for 4–5. Pure — shared by the Simple track, the Simple
 * Calculator, and the Advanced Insights front door, so every surface
 * speaks the same sentences.
 */
import type { AppState, ScopeSelection } from '../state/AppState';
import { fleetList } from '../state/AppState';
import type { SimulatorResult, BlockingReason, FleetSpec, HardwareGroup } from '../types';
import { REASONS, type ReasonMeta } from './blockingReason';
import {
  computeAllClusterFinancials,
  rollupFleetFinancials,
  withLiveOpex,
  formatUsd,
  formatPct,
  formatPayback,
} from './financial';
import { revenueRollup, filterNodesByScope, type RateType } from '../engine/insights';
import { regionScopedCatalog } from './runEngine';
import type { InvestmentReport } from './investment';

export type AnswerVerdict = 'yes' | 'mostly' | 'no' | 'attention' | 'info' | 'na';
export type AnswerTone = 'good' | 'warn' | 'bad' | 'neutral';

export interface AnswerRow {
  id: 'supportable' | 'blockers' | 'sellable' | 'investment' | 'payback' | 'profitability';
  /** The plain-English question, asked the way the user asks it. */
  question: string;
  verdict: AnswerVerdict;
  tone: AnswerTone;
  /** The one-sentence answer. */
  headline: string;
}

export interface BlockerGroup {
  reason: BlockingReason;
  meta: ReasonMeta;
  count: number;
  /** Per-SKU counts, largest first (capped by the caller for display). */
  skus: { vmSizeName: string; count: number; details?: string }[];
}

/** Per-zone placement rollup — deployments are usually ZONAL, so the
 *  answers must show where capacity actually lives, not one flat pool. */
export interface ZoneRollup {
  /** Zone label, or '' for unzoned clusters. */
  zone: string;
  clusterCount: number;
  placedVms: number;
  memUsedGib: number;
  memTotalGib: number;
  memPct: number;
}

/** One spillover route (fromGroup → toGroup) with its VM count. Spillover
 *  is visibility, not warning — the engine working as designed. */
export interface SpilloverRoute {
  fromGroup: string;
  toGroup: string;
  count: number;
}

export interface Answers {
  supportable: AnswerRow & {
    placed: number;
    asked: number;
    /** Blocked count for THIS view — 0 when scoped (blockers are fleet-wide). */
    blocked: number;
    satisfiedPct: number;
    /** Per-zone breakdown, zones sorted ascending; unzoned last. */
    zones: ZoneRollup[];
    /** Aggregated spillover routes, biggest first. */
    spillover: SpilloverRoute[];
    spilloverTotal: number;
  };
  /** Blockers are always FLEET-WIDE (unplaceable VMs aren't attributable to a
   *  region/zone/cluster). `fleetWide` is true when the rest of the Overview is
   *  scoped narrower, so the UI can note the blockers span the whole fleet. */
  blockers: AnswerRow & { groups: BlockerGroup[]; totalBlocked: number; fleetWide: boolean };
  sellable: AnswerRow & {
    headroomMonthly: number;
    todayMonthly: number;
    atCapMonthly: number;
    topFill: { vmSizeName: string; count: number; monthlyRevenue: number }[];
  };
  profitability: AnswerRow & {
    marginPct?: number;
    monthlyRevenue: number;
    /** Total monthly cost (depreciation + opex) — the COGS behind the margin. */
    monthlyCogs?: number;
    /** Non-cash straight-line depreciation component of the monthly cost. */
    monthlyDepreciation?: number;
    /** Cash operating-cost component of the monthly cost (undefined when none). */
    monthlyOpex?: number;
    paybackMonths?: number;
    totalCapex?: number;
    /** Extra monthly revenue needed to reach 0% gross margin (break-even).
     *  0 once already at/above break-even; undefined when cost is unknown. */
    breakEvenRevenueGap?: number;
    /** Extra monthly revenue needed to reach the "healthy" margin marker
     *  (the user's `ui.marginTargetPct`, matching the Profitability chart's tick). */
    healthyRevenueGap?: number;
    /** The "healthy" gross-margin target (%) used for healthyRevenueGap + the
     *  chart's tick — `ui.marginTargetPct` or the HEALTHY_MARGIN_PCT default. */
    healthyTargetPct: number;
  };
}

/** Default "healthy" gross-margin marker when the user hasn't set one. The
 *  live value is `state.ui.marginTargetPct`, editable on the Overview. */
export const HEALTHY_MARGIN_PCT = 20;

/** Resolve the user's healthy-margin target, falling back to the default. */
export function healthyMarginTarget(state: AppState): number {
  const t = state.ui.marginTargetPct;
  return t != null && Number.isFinite(t) ? t : HEALTHY_MARGIN_PCT;
}

export function computeAnswers(
  state: AppState,
  result: SimulatorResult,
  rateType: RateType,
  scope: ScopeSelection | null = null,
): Answers {
  const fleets = fleetList(state);
  const scoped = scope != null; // null = fleet-wide

  // Scope filters the PLACEMENT + FINANCIAL + HEADROOM view to a region / zone /
  // cluster. Scope maps to whole clusters, so per-cluster financials stay exact.
  // Blockers (unplaceable VMs) are NOT attributable to a scope, so they stay
  // fleet-wide regardless.
  const scopedNodes = scoped ? filterNodesByScope(result, fleets, scope) : result.nodeDetail;
  const scopedPlaced = scoped
    ? scopedNodes.reduce((s, n) => s + n.vmsPlaced.length, 0)
    : result.vmsPlaced;

  // ── 1. Supportable? ────────────────────────────────────────────────────
  const placed = scopedPlaced;
  const fleetBlocked = result.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
  // When scoped, the view holds what it holds — blocked is a fleet concept,
  // shown in its own (fleet-wide) section.
  const blockedTotal = scoped ? 0 : fleetBlocked;
  const asked = placed + blockedTotal;
  const satisfiedPct = asked > 0 ? (placed / asked) * 100 : 100;

  // Per-zone rollup from nodeDetail × the fleets' zone tags. Deployments
  // are usually zonal — a flat fleet-wide number hides the zone that's full.
  const zoneByCluster = new Map<string, string>();
  for (const f of fleets) zoneByCluster.set(f.id, f.fleet.zone ?? '');
  const zoneAgg = new Map<string, ZoneRollup>();
  const clustersSeen = new Map<string, Set<string>>();
  for (const n of scopedNodes) {
    const zone = n.clusterId ? (zoneByCluster.get(n.clusterId) ?? '') : '';
    let z = zoneAgg.get(zone);
    if (!z) {
      z = { zone, clusterCount: 0, placedVms: 0, memUsedGib: 0, memTotalGib: 0, memPct: 0 };
      zoneAgg.set(zone, z);
      clustersSeen.set(zone, new Set());
    }
    if (n.clusterId) clustersSeen.get(zone)!.add(n.clusterId);
    z.placedVms += n.vmsPlaced.length;
    z.memUsedGib += n.memoryUsedGib;
    z.memTotalGib += n.memoryTotalGib;
  }
  const zones = [...zoneAgg.values()]
    .map((z) => ({
      ...z,
      clusterCount: clustersSeen.get(z.zone)?.size ?? 0,
      memPct: z.memTotalGib > 0 ? (z.memUsedGib / z.memTotalGib) * 100 : 0,
    }))
    .sort((a, b) => (a.zone === '' ? 1 : b.zone === '' ? -1 : a.zone.localeCompare(b.zone)));

  // Spillover routes — visibility, not warning (the engine working as
  // designed). Aggregate by (from → to), biggest first. Spillover routes span
  // clusters, so they're shown fleet-wide only (hidden under a narrower scope).
  const routeAgg = new Map<string, SpilloverRoute>();
  if (!scoped) {
    for (const ev of result.spilloverEvents) {
      const key = `${ev.fromGroup}→${ev.toGroup}`;
      const r = routeAgg.get(key);
      if (r) r.count += ev.count;
      else routeAgg.set(key, { fromGroup: ev.fromGroup, toGroup: ev.toGroup, count: ev.count });
    }
  }
  const spillover = [...routeAgg.values()].sort((a, b) => b.count - a.count);
  const spilloverTotal = spillover.reduce((s, r) => s + r.count, 0);

  const supportable: Answers['supportable'] = {
    id: 'supportable',
    question: scoped
      ? 'What is running in this view?'
      : 'Is this deployment supportable on current capacity?',
    placed,
    asked,
    blocked: blockedTotal,
    satisfiedPct,
    zones,
    spillover,
    spilloverTotal,
    ...(scoped
      ? {
          verdict: 'info' as const,
          tone: 'neutral' as const,
          headline:
            placed > 0
              ? `${placed.toLocaleString()} VM${placed === 1 ? '' : 's'} placed in this view.`
              : 'No VMs placed in this view.',
        }
      : blockedTotal === 0
      ? {
          verdict: 'yes' as const,
          tone: 'good' as const,
          headline:
            asked > 0
              ? `Yes — all ${asked.toLocaleString()} requested VMs fit on current capacity.`
              : 'No demand requested yet — add VMs to the plan to test it.',
        }
      : satisfiedPct >= 90
        ? {
            verdict: 'mostly' as const,
            tone: 'warn' as const,
            headline: `Mostly — ${placed.toLocaleString()} of ${asked.toLocaleString()} VMs fit (${satisfiedPct.toFixed(0)}%); ${blockedTotal.toLocaleString()} blocked.`,
          }
        : {
            verdict: 'no' as const,
            tone: 'bad' as const,
            headline: `No — only ${placed.toLocaleString()} of ${asked.toLocaleString()} VMs fit (${satisfiedPct.toFixed(0)}%).`,
          }),
  };

  // ── 2. Where blocked, and why? ─────────────────────────────────────────
  const byReason = new Map<BlockingReason, BlockerGroup>();
  for (const u of result.vmsUnplaceable) {
    let g = byReason.get(u.blockingReason);
    if (!g) {
      g = {
        reason: u.blockingReason,
        meta: REASONS[u.blockingReason],
        count: 0,
        skus: [],
      };
      byReason.set(u.blockingReason, g);
    }
    g.count += u.count;
    const sku = g.skus.find((s) => s.vmSizeName === u.vmSizeName);
    if (sku) sku.count += u.count;
    else g.skus.push({ vmSizeName: u.vmSizeName, count: u.count, details: u.details });
  }
  const groups = [...byReason.values()].sort((a, b) => b.count - a.count);
  for (const g of groups) g.skus.sort((a, b) => b.count - a.count);
  const top = groups[0];
  const blockers: Answers['blockers'] = {
    id: 'blockers',
    question: 'Where are we blocked, and why?',
    groups,
    totalBlocked: fleetBlocked,
    fleetWide: scoped,
    ...(fleetBlocked === 0
      ? {
          verdict: 'yes' as const,
          tone: 'good' as const,
          headline: 'Nothing is blocked — every requested VM found a home.',
        }
      : {
          verdict: 'attention' as const,
          tone: groups.some((g) => g.meta.severity === 'user') ? ('warn' as const) : ('bad' as const),
          headline: `${fleetBlocked.toLocaleString()} VMs blocked across ${groups.length} reason${groups.length === 1 ? '' : 's'} — biggest: ${top.meta.shortLabel.toLowerCase()} (${top.count.toLocaleString()} VMs).`,
        }),
  };

  // ── 3. How much can we sell? ───────────────────────────────────────────
  // Region-scoped catalog — same filter the engine applies. revenueRollup
  // scopes the headroom internally via the `scope` arg.
  const scopedCatalog = regionScopedCatalog(state);
  const roll = revenueRollup(result, fleets, scopedCatalog, scope ?? null, rateType, state.userFungibility);
  const sellable: Answers['sellable'] = {
    id: 'sellable',
    question: 'How much more can we sell on this fleet?',
    headroomMonthly: roll.headroomMonthly,
    todayMonthly: roll.todayMonthly,
    atCapMonthly: roll.atCapMonthly,
    // A MENU of independent single-size fills (each is what you'd get if you
    // filled the leftover capacity with ONLY that size). The rows are
    // ALTERNATIVES that share the same nodes — they do NOT sum to
    // headroomMonthly; headroomMonthly is the MAX (best option), per the
    // headroom-true-ceiling doctrine. The UI labels the total "best option"
    // and says the rows share nodes, so you'd pick one, not all.
    topFill: roll.headroomFill,
    ...(roll.headroomMonthly > 0
      ? {
          verdict: 'info' as const,
          tone: 'neutral' as const,
          headline: `Up to ${formatUsd(roll.headroomMonthly)}/mo more on current hardware — ${formatUsd(roll.todayMonthly)}/mo sold today, ${formatUsd(roll.atCapMonthly)}/mo at capacity.`,
        }
      : {
          verdict: 'no' as const,
          tone: 'good' as const,
          headline: 'Sold out — the fleet is at its revenue capacity for the current catalog.',
        }),
  };

  // ── Does this fleet investment make sense? ─────────────────────────────
  // The fleet you're running this demand on is a capital investment; is the
  // demand on it profitable enough to justify it? Three-state verdict on
  // gross margin (revenue vs hardware depreciation):
  //   Yes   — quite profitable        (margin ≥ YES_MARGIN_PCT)
  //   Maybe — near break-even / thin   (NO_MARGIN_PCT ≤ margin < YES_MARGIN_PCT)
  //   No    — losing money            (margin < NO_MARGIN_PCT)
  // Tune these two if the "solidly profitable" / "losing money" lines move.
  const YES_MARGIN_PCT = 15;
  const NO_MARGIN_PCT = -10;
  // Overlay live Hardware-Library opex onto each placed fleet so opex authored
  // or edited on a server reaches the Overview without re-placing the cluster.
  const hwById: Record<string, HardwareGroup> = {};
  for (const g of state.userHardware) hwById[g.id] = g;
  const fleetById: Record<string, FleetSpec> = {};
  for (const f of fleets) fleetById[f.id] = withLiveOpex(f.fleet, hwById);
  // Scope maps to whole clusters, so a node-filtered result yields exactly the
  // clusters in scope — per-cluster capex/revenue/margin stay correct.
  const finResult = scoped ? { ...result, nodeDetail: scopedNodes } : result;
  const fin = rollupFleetFinancials(
    computeAllClusterFinancials(finResult, fleetById, scopedCatalog, rateType),
  );
  const margin = fin.grossProfitMarginPct;
  const paybackPhrase =
    fin.paybackMonths != null ? ` Pays back in ${formatPayback(fin.paybackMonths)}.` : '';
  // The monthly cost behind the margin is depreciation + opex (the cash
  // operating cost). "hardware cost" in the headline covers both — opex makes
  // the line read higher when authored.
  const monthlyCost = fin.monthlyCost;
  // Additional monthly revenue to clear break-even (0% margin) and the
  // "healthy" marker. Cost is fixed (depreciation + opex), so revenue must
  // rise to it: break-even at R = cost; healthy at R = cost / (1 − m).
  const healthyTargetPct = healthyMarginTarget(state);
  let breakEvenRevenueGap: number | undefined;
  let healthyRevenueGap: number | undefined;
  if (monthlyCost != null) {
    breakEvenRevenueGap = Math.max(0, monthlyCost - fin.monthlyRevenue);
    // R = cost / (1 − m). Guard m ≥ 100% (unreachable) → no finite target.
    const denom = 1 - healthyTargetPct / 100;
    const healthyRevenue = denom > 0 ? monthlyCost / denom : Infinity;
    healthyRevenueGap = Number.isFinite(healthyRevenue)
      ? Math.max(0, healthyRevenue - fin.monthlyRevenue)
      : undefined;
  }
  const profitability: Answers['profitability'] = {
    id: 'profitability',
    question: 'Does this fleet investment make sense?',
    marginPct: margin,
    monthlyRevenue: fin.monthlyRevenue,
    monthlyCogs: monthlyCost,
    monthlyDepreciation: fin.monthlyDepreciation,
    monthlyOpex: fin.monthlyOpex,
    paybackMonths: fin.paybackMonths,
    totalCapex: fin.totalCapex,
    breakEvenRevenueGap,
    healthyRevenueGap,
    healthyTargetPct,
    ...(margin == null
      ? {
          verdict: 'na' as const,
          tone: 'neutral' as const,
          headline:
            'Add hardware cost (per node or per rack) to judge whether the fleet pays off.',
        }
      : margin < NO_MARGIN_PCT
        ? {
            verdict: 'no' as const,
            tone: 'bad' as const,
            headline: `No — the demand loses money on this fleet: ${formatPct(margin)} gross margin, ${formatUsd((monthlyCost ?? 0) - fin.monthlyRevenue)}/mo short of break-even.`,
          }
        : margin < YES_MARGIN_PCT
          ? {
              verdict: 'mostly' as const,
              tone: 'warn' as const,
              headline: `Maybe — thin margin at ${formatPct(margin)}; the fleet is near break-even on this demand.${paybackPhrase}`,
            }
          : {
              verdict: 'yes' as const,
              tone: 'good' as const,
              headline: `Yes — the demand on this fleet is solidly profitable: ${formatPct(margin)} gross margin (${formatUsd(fin.monthlyRevenue)}/mo revenue vs ${formatUsd(monthlyCost)}/mo cost).${paybackPhrase}`,
            }),
  };

  return { supportable, blockers, sellable, profitability };
}

/**
 * A 2–3 sentence executive read of the result — placement, then whether the
 * demand makes money, then the upside. Sits at the top of the Overview above
 * the per-question bullets. All copy lives here so every surface speaks the
 * same sentences.
 */
export function executiveSummary(a: Answers): string {
  const placed = a.supportable.placed.toLocaleString();
  const asked = a.supportable.asked.toLocaleString();
  const blocked = a.supportable.blocked; // 0 when the view is scoped
  const scoped = a.blockers.fleetWide;

  let s1: string;
  if (scoped) {
    s1 = `${placed} VM${a.supportable.placed === 1 ? '' : 's'} running in this view`;
  } else if (blocked === 0) {
    s1 = `All ${placed} requested VMs fit on the current fleet`;
  } else {
    s1 = `${placed} of ${asked} requested VMs fit — ${blocked.toLocaleString()} ${
      blocked === 1 ? 'is' : 'are'
    } blocked`;
  }

  const m = a.profitability.marginPct;
  let s2: string;
  if (m == null) s2 = ', but profitability can’t be priced without hardware-cost data';
  else if (m < -10) s2 = `, but the running demand loses money on this hardware (${formatPct(m)} gross margin)`;
  else if (m < 15) s2 = `, sitting near break-even (${formatPct(m)} gross margin)`;
  else s2 = `, and the demand is comfortably profitable (${formatPct(m)} gross margin)`;

  const head = a.sellable.headroomMonthly;
  const s3 =
    head > 0
      ? ` There is up to ${formatUsd(head)}/mo of additional revenue available on the current hardware by selling the spare capacity.`
      : ' The fleet is effectively at capacity for the demanded sizes — little spare left to sell.';

  return `${s1}${s2}.${s3}`;
}

/**
 * Live one-line summary for the Deployment Results section — the actual
 * placement / blocked / spillover / zone numbers, not a description of what
 * the section contains. Sits under the "Deployment Results" header.
 */
export function deploymentSummary(a: Answers): string {
  const placed = a.supportable.placed.toLocaleString();
  const asked = a.supportable.asked.toLocaleString();
  const blocked = a.supportable.blocked; // 0 when the view is scoped
  const zoneCount = a.supportable.zones.length;
  const zonePhrase =
    zoneCount > 1 ? ` across ${zoneCount} availability zones` : '';

  if (a.supportable.asked === 0) {
    return 'No demand requested yet — add VMs to the plan to see how they pack onto the fleet.';
  }

  const head =
    blocked === 0
      ? `All ${placed} requested VMs placed${zonePhrase}`
      : `${placed} of ${asked} VMs placed${zonePhrase} — ${blocked.toLocaleString()} blocked across ${a.blockers.groups.length} reason${a.blockers.groups.length === 1 ? '' : 's'}`;

  const spill = a.supportable.spilloverTotal;
  const spillPhrase =
    spill > 0
      ? `; ${spill.toLocaleString()} routed to backup hardware via spillover.`
      : blocked === 0
        ? ', with no spillover.'
        : '.';

  return `${head}${spillPhrase}`;
}

/**
 * Live one-line summary for the Financials section — revenue, margin, and the
 * sellable headroom, with the numbers in the sentence rather than a generic
 * description. Sits under the "Financials" header.
 */
export function financialsSummary(a: Answers): string {
  const rev = formatUsd(a.profitability.monthlyRevenue);
  const m = a.profitability.marginPct;
  const head = a.sellable.headroomMonthly;

  let s1: string;
  if (m == null) {
    s1 = `${rev}/mo revenue today; add hardware cost to see gross margin and payback`;
  } else {
    s1 = `${rev}/mo revenue at ${formatPct(m)} gross margin`;
  }

  const s2 =
    head > 0
      ? `, with up to ${formatUsd(head)}/mo more available on the spare capacity.`
      : ', and the fleet is effectively sold out for the demanded sizes.';

  return `${s1}${s2}`;
}

// ────────────────────────────────────────────────────────────────────────
// Questions 4 + 5 — verdict rows from an InvestmentReport, so the strip
// and the panel speak identical sentences.
// ────────────────────────────────────────────────────────────────────────
export function investmentAnswerRows(report: InvestmentReport | null): {
  investment: AnswerRow;
  payback: AnswerRow;
} {
  const base = {
    investment: {
      id: 'investment' as const,
      question: 'Does new hardware investment make sense?',
    },
    payback: {
      id: 'payback' as const,
      question: 'Will the investment pay off, and when?',
    },
  };
  if (!report) {
    return {
      investment: {
        ...base.investment,
        verdict: 'na',
        tone: 'neutral',
        headline: 'Add hardware to the library to test an investment scenario.',
      },
      payback: {
        ...base.payback,
        verdict: 'na',
        tone: 'neutral',
        headline: 'No scenario yet.',
      },
    };
  }
  const hw = report.plan.hardware.name;
  const racks = report.plan.rackCount;
  const scenarioLabel = `${racks} rack${racks === 1 ? '' : 's'} of ${hw}`;
  const life = report.usableLifeMonths;

  switch (report.verdict) {
    case 'not-needed':
      return {
        investment: {
          ...base.investment,
          verdict: 'no',
          tone: 'good',
          headline:
            'Not for this deployment — current capacity already fits it. New hardware is a growth play.',
        },
        payback: {
          ...base.payback,
          verdict: 'info',
          tone: 'neutral',
          headline:
            report.paybackMonthsAtCap != null
              ? `If bought for growth and sold to capacity, ${scenarioLabel} pays back in ${formatPayback(report.paybackMonthsAtCap)}.`
              : `No payback estimate — the added capacity earns no priced revenue at the current catalog.`,
        },
      };
    case 'no-help':
      return {
        investment: {
          ...base.investment,
          verdict: 'no',
          tone: 'bad',
          headline: `No — ${scenarioLabel} places 0 additional VMs. The blockers aren't capacity this hardware fixes${report.assumedFungibility ? '' : ' (check fungibility rules for it)'}.`,
        },
        payback: {
          ...base.payback,
          verdict: 'na',
          tone: 'neutral',
          headline: 'Not applicable — the scenario unlocks no demand revenue.',
        },
      };
    case 'no-cost-data':
      return {
        investment: {
          ...base.investment,
          verdict: 'info',
          tone: 'neutral',
          headline: `${scenarioLabel} places ${report.deltaPlaced.toLocaleString()} more VMs (+${formatUsd(report.deltaRevenueTodayMonthly)}/mo) — add its cost to judge the investment.`,
        },
        payback: {
          ...base.payback,
          verdict: 'na',
          tone: 'neutral',
          headline: 'Unknown — no cost authored on this hardware.',
        },
      };
    case 'pays-back':
      return {
        investment: {
          ...base.investment,
          verdict: 'yes',
          tone: 'good',
          headline: `Yes — ${scenarioLabel} places ${report.deltaPlaced.toLocaleString()} more VMs and adds ${formatUsd(report.deltaRevenueTodayMonthly)}/mo from this deployment alone.`,
        },
        payback: {
          ...base.payback,
          verdict: 'yes',
          tone: 'good',
          headline: `Yes — pays back in ${formatPayback(report.paybackMonthsDemand)} of its ${formatPayback(life)} life on this deployment's revenue${report.paybackMonthsAtCap != null ? `; ${formatPayback(report.paybackMonthsAtCap)} if sold to capacity` : ''}.`,
        },
      };
    case 'pays-back-at-cap-only':
      return {
        investment: {
          ...base.investment,
          verdict: 'mostly',
          tone: 'warn',
          headline: `Only with more sales — ${scenarioLabel} unblocks ${report.deltaPlaced.toLocaleString()} VMs, but this deployment's revenue alone doesn't cover it.`,
        },
        payback: {
          ...base.payback,
          verdict: 'mostly',
          tone: 'warn',
          headline: `${report.paybackMonthsDemand != null ? `${formatPayback(report.paybackMonthsDemand)} on this deployment — beyond its ${formatPayback(life)} life. ` : `Never on this deployment alone. `}Sold to capacity: ${formatPayback(report.paybackMonthsAtCap)}.`,
        },
      };
    case 'never-pays-back':
      return {
        investment: {
          ...base.investment,
          verdict: 'no',
          tone: 'bad',
          headline: `No — ${scenarioLabel} costs ${formatUsd(report.capexUsd)} and its added revenue never covers it within the hardware's ${formatPayback(life)} life.`,
        },
        payback: {
          ...base.payback,
          verdict: 'no',
          tone: 'bad',
          headline: 'It doesn’t — added revenue is below the hardware’s own monthly cost.',
        },
      };
  }
}

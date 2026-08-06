/**
 * computeMetricFamilies — the four Simple-track families as MetricCard props.
 *
 * Extracted from SimpleApp so BOTH the Simple/Advanced toggle view and the
 * Simple Calculator tab compute the four families identically from a
 * SimulatorResult + the same pure helpers the Advanced track uses. Pure
 * function, no React. (S27 / Simple Calculator.)
 */
import type { AppState, ScopeSelection } from '../state/AppState';
import { fleetList } from '../state/AppState';
import { regionScopedCatalog } from './runEngine';
import {
  computeAllClusterFinancials,
  rollupFleetFinancials,
  withLiveOpex,
  formatUsd,
  formatPct,
} from './financial';
import { revenueRollup, filterNodesByScope, type RateType } from '../engine/insights';
import { healthyMarginTarget } from './answers';
import { REASONS } from './blockingReason';
import type { MetricCardProps, Tone } from '../components/MetricCard';
import type { SimulatorResult, FleetSpec, HardwareGroup } from '../types';

export interface MetricFamilies {
  profitability: MetricCardProps;
  headroom: MetricCardProps;
  placement: MetricCardProps;
  utilization: MetricCardProps;
}

export function computeMetricFamilies(
  state: AppState,
  result: SimulatorResult,
  rateType: RateType,
  scope: ScopeSelection | null = null,
): MetricFamilies {
  const fleets = fleetList(state);
  const scoped = scope != null; // null = fleet-wide
  // Scope filters placement / utilization / financials / headroom to a
  // region / zone / cluster (maps to whole clusters). Mirrors answers.ts.
  const scopedNodes = scoped ? filterNodesByScope(result, fleets, scope) : result.nodeDetail;
  const finResult = scoped ? { ...result, nodeDetail: scopedNodes } : result;
  // Overlay live Hardware-Library opex (mirrors answers.ts) so the
  // profitability card reflects opex without re-placing the cluster.
  const hwById: Record<string, HardwareGroup> = {};
  for (const g of state.userHardware) hwById[g.id] = g;
  const fleetById: Record<string, FleetSpec> = {};
  for (const f of fleets) fleetById[f.id] = withLiveOpex(f.fleet, hwById);
  // v3 S26 — Price with the SAME region-scoped rates the engine placed
  // against. The full multi-region catalog makes by-name rate lookups
  // arbitrary (last region wins) and desyncs these cards from the
  // verdict strip / Insights, which already scope.
  const catalog = regionScopedCatalog(state);

  // ── Profitability ──────────────────────────────────────────────────────
  const finRows = computeAllClusterFinancials(finResult, fleetById, catalog, rateType);
  const fin = rollupFleetFinancials(finRows);
  const margin = fin.grossProfitMarginPct;
  // COGS = depreciation + opex (the full monthly cost behind the margin).
  const cogs = fin.monthlyCost;
  const rev = fin.monthlyRevenue;
  // User-set healthy-margin target (editable on the Overview); default 20.
  const target = healthyMarginTarget(state);
  const profitTone: Tone =
    margin == null ? 'neutral' : margin < 0 ? 'bad' : margin < target ? 'warn' : 'good';
  const profitGap =
    margin == null
      ? { text: 'Add hardware cost (per node or per rack) to compute profitability.', tone: 'neutral' as Tone }
      : margin < 0
        ? { text: `${formatUsd((cogs ?? 0) - rev)}/mo short of break-even.`, tone: 'bad' as Tone }
        : margin < target
          ? { text: `${(target - margin).toFixed(1)} points below your ${target}% margin target.`, tone: 'warn' as Tone }
          : { text: `Above your ${target}% margin target.`, tone: 'good' as Tone };

  // ── Headroom ───────────────────────────────────────────────────────────
  const revRoll = revenueRollup(result, fleets, catalog, scope ?? null, rateType, state.userFungibility);
  const headroom = revRoll.headroomMonthly;
  // v2.23.1 — headroomVmCount is the count behind the headroom number (the
  // best single-size fill, or the greedy mix). NOT the sum of headroomFill —
  // those are independent options that share nodes and can't all deploy.
  const sellableCount = revRoll.headroomVmCount;
  const headroomTone: Tone = headroom <= 0 ? 'good' : 'neutral';
  const headroomGap =
    headroom <= 0
      ? { text: 'Fully sold — no idle capacity at the current mix.', tone: 'good' as Tone }
      : { text: `${formatUsd(headroom)}/mo on the table if the fleet sold to capacity.`, tone: 'neutral' as Tone };

  // ── Placement ──────────────────────────────────────────────────────────
  // Scoped: count VMs in scope; blockers are fleet-wide so they don't count
  // against a narrower view.
  const placed = scoped ? scopedNodes.reduce((s, n) => s + n.vmsPlaced.length, 0) : result.vmsPlaced;
  const unplaceable = scoped ? 0 : result.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
  const asked = placed + unplaceable;
  const satisfiedPct = asked > 0 ? (placed / asked) * 100 : 100;
  const placeTone: Tone =
    satisfiedPct >= 100 ? 'good' : satisfiedPct >= 90 ? 'warn' : 'bad';
  const byReason = new Map<string, number>();
  for (const u of scoped ? [] : result.vmsUnplaceable) {
    byReason.set(u.blockingReason, (byReason.get(u.blockingReason) ?? 0) + u.count);
  }
  const topReason = [...byReason.entries()].sort((a, b) => b[1] - a[1])[0];
  const topReasonLabel = topReason
    ? (REASONS[topReason[0] as keyof typeof REASONS]?.shortLabel ?? topReason[0])
    : '';
  const placeGap =
    unplaceable <= 0
      ? { text: 'All requested VMs placed.', tone: 'good' as Tone }
      : { text: `${unplaceable.toLocaleString()} VM${unplaceable === 1 ? '' : 's'} blocked — mostly ${topReasonLabel}.`, tone: placeTone };

  // ── Utilization ────────────────────────────────────────────────────────
  let memU = 0, memT = 0, vcU = 0, vcT = 0, netU = 0, netT = 0, stU = 0, stT = 0;
  for (const n of scopedNodes) {
    memU += n.memoryUsedGib; memT += n.memoryTotalGib;
    vcU += n.vcpusUsed; vcT += n.vcpusTotal;
    if (n.throughputTotalMbps != null) { netU += n.throughputUsedMbps; netT += n.throughputTotalMbps; }
    if (n.storageThroughputTotalMbps != null) { stU += n.storageThroughputUsedMbps; stT += n.storageThroughputTotalMbps; }
  }
  const dims: { name: string; pct: number }[] = [
    { name: 'memory', pct: memT > 0 ? (memU / memT) * 100 : 0 },
    { name: 'vCPU', pct: vcT > 0 ? (vcU / vcT) * 100 : 0 },
    { name: 'network', pct: netT > 0 ? (netU / netT) * 100 : 0 },
    { name: 'storage', pct: stT > 0 ? (stU / stT) * 100 : 0 },
  ];
  const binding = dims.reduce((a, b) => (b.pct > a.pct ? b : a), dims[0]);
  const utilTone: Tone =
    binding.pct >= 95 ? 'warn' : binding.pct >= 85 ? 'good' : binding.pct >= 60 ? 'neutral' : 'warn';
  const utilGap =
    binding.pct >= 95
      ? { text: `${binding.name} is near capacity — overcommit risk.`, tone: 'warn' as Tone }
      : binding.pct >= 85
        ? { text: `${binding.name}-bound at a healthy ${binding.pct.toFixed(0)}%.`, tone: 'good' as Tone }
        : { text: `${binding.name} binds first at ${binding.pct.toFixed(0)}% — ${(85 - binding.pct).toFixed(0)} points of slack to target.`, tone: 'neutral' as Tone };

  return {
    profitability: {
      title: 'Profitability',
      question: 'Does the fleet make money today?',
      value: formatPct(margin),
      tone: profitTone,
      trackMin: -100, trackMax: 100,
      current: margin ?? null,
      targets: [{ at: 0, label: 'break-even' }, { at: target, label: 'healthy' }],
      gap: profitGap,
      // Supporting figures (Revenue / COGS / Payback / Capex) intentionally
      // omitted — the Overview's Fleet-financials card owns the detail so the
      // chart stays a clean chart.
    },
    headroom: {
      title: 'Headroom',
      question: 'Can I sell more without buying hardware?',
      value: `${formatUsd(headroom)}/mo`,
      tone: headroomTone,
      trackMin: 0, trackMax: Math.max(revRoll.atCapMonthly, 1),
      current: revRoll.todayMonthly,
      targets: [{ at: revRoll.atCapMonthly, label: 'sold out' }],
      gap: headroomGap,
      supporting: [
        { label: 'Revenue today', value: `${formatUsd(revRoll.todayMonthly)}/mo` },
        { label: 'Revenue at cap', value: `${formatUsd(revRoll.atCapMonthly)}/mo` },
        { label: 'VMs still sellable', value: sellableCount.toLocaleString() },
        { label: 'Rate basis', value: rateType.toUpperCase() },
      ],
    },
    placement: {
      title: 'Placement',
      question: "Can I fit the customer's demand?",
      value: `${satisfiedPct.toFixed(0)}%`,
      tone: placeTone,
      trackMin: 0, trackMax: 100,
      current: satisfiedPct,
      targets: [{ at: 100, label: 'all fit' }],
      gap: placeGap,
      supporting: [
        { label: 'Placed', value: placed.toLocaleString() },
        { label: 'Requested', value: asked.toLocaleString() },
        { label: 'Unplaceable', value: unplaceable.toLocaleString() },
        { label: 'Top blocker', value: topReasonLabel || '—' },
      ],
    },
    utilization: {
      title: 'Utilization',
      question: 'How efficiently is the fleet packed?',
      value: `${binding.pct.toFixed(0)}%`,
      tone: utilTone,
      trackMin: 0, trackMax: 100,
      current: binding.pct,
      targets: [{ at: 85, label: 'target' }, { at: 95, label: 'overcommit' }],
      gap: utilGap,
      supporting: dims.map((d) => ({ label: d.name, value: `${d.pct.toFixed(0)}%` })),
    },
  };
}

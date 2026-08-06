/**
 * pageContext — derive the Terminal's grounding from the CURRENT page.
 *
 * `buildPageContext(state, focus)` reads AppState (+ the optional published
 * `ScreenFocus`) and produces a compact, DATA-ONLY snapshot of what the user
 * is looking at, so the Terminal can resolve "this VM / these regions / this
 * result" and answer over the numbers actually on screen.
 *
 * SILOING:
 *  - Only the simulator's own data is read — the live catalog, the user's
 *    fleet/BoM/run result, and the curated help content. No personal info,
 *    no other projects.
 *  - DATA, NOT SECRET SAUCE. Facts here are OUTPUTS the user can already see
 *    (counts, rates, regions, utilization). We deliberately do NOT expose how
 *    the engine computes placement, scoring, or fungibility. The system
 *    prompt (prompt.ts) reinforces this; pageContext simply never ships it.
 */
import type { AppState } from '../state/AppState';
import type { UserVm } from '../types';
import { LIVE_CATALOG_AS_OF } from '../data/liveCatalog';
import type { ScreenFocus } from './screenContext';

export interface ContextFact {
  label: string;
  value: string;
}

export interface PageContext {
  pageId: string;
  /** Human page name shown on the Terminal's context chip. */
  title: string;
  /** Active sub-page within the page (e.g. "At a Glance"), or null. */
  subPage: string | null;
  /** One line on what this page is for. */
  summary: string;
  /** Key on-screen data points the user can see. */
  facts: ContextFact[];
  /** The thing "this"/"that" most likely refers to right now, if any. */
  focus: ScreenFocus | null;
  /** Structured grounding handed to the model (data only). */
  data: Record<string, unknown>;
}

const PAGE_TITLES: Record<string, string> = {
  'getting-started': 'Getting started',
  simulator: 'Simulator',
  // S47 — "VM Competitive Offering" + "Region Availability" merged into one
  // "Cloud Market Analytics" page, so the assistant's context names it that.
  competitive: 'Cloud Market Analytics',
  'region-availability': 'Cloud Market Analytics',
  'capacity-planning': 'Capacity planning',
};

// Default sub-page for routes that ARE a specific sub-view of a multi-tab
// shell. The live sub-page (which tab the user is actually on) comes from the
// published `focus.subPage` and takes precedence; this is the fallback for a
// deep-link route. The `region-availability` route lands on the region sub-view.
const PAGE_SUBPAGE: Record<string, string> = {
  'region-availability': 'Region Availability',
};

/** Compact, data-only rollup of the loaded VM catalog. */
export function catalogSummary(vms: UserVm[]): {
  total: number;
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
  regions: number;
  asOf: string;
} {
  const byProvider: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const regions = new Set<string>();
  for (const v of vms) {
    const p = v.provider ?? 'Azure';
    byProvider[p] = (byProvider[p] ?? 0) + 1;
    const c = v.category ?? 'Uncategorized';
    byCategory[c] = (byCategory[c] ?? 0) + 1;
    if (v.region) regions.add(v.region);
  }
  return {
    total: vms.length,
    byProvider,
    byCategory,
    regions: regions.size,
    asOf: LIVE_CATALOG_AS_OF,
  };
}

/** Find a catalog VM by (case-insensitive) size name. Data-only lookup. */
export function findVm(vms: UserVm[], name: string): UserVm | undefined {
  const q = name.trim().toLowerCase();
  return (
    vms.find((v) => v.vmSizeName.toLowerCase() === q) ??
    vms.find((v) => v.vmSizeName.toLowerCase().includes(q))
  );
}

function topEntries(rec: Record<string, number>, n = 6): string {
  return Object.entries(rec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
}

export function buildPageContext(
  state: AppState,
  focus: ScreenFocus | null,
): PageContext {
  const pageId = state.ui.activePage;
  const title = PAGE_TITLES[pageId] ?? pageId;
  // Live published sub-page wins; else the route's default sub-view; else none.
  const subPage = focus?.subPage ?? PAGE_SUBPAGE[pageId] ?? null;
  const cat = catalogSummary(state.userVms);

  const facts: ContextFact[] = [];
  const data: Record<string, unknown> = {
    catalog: cat,
    catalogAsOf: cat.asOf,
  };

  // Catalog freshness is relevant on every page.
  facts.push({
    label: 'Catalog',
    value: `${cat.total.toLocaleString()} VM sizes across ${Object.keys(
      cat.byProvider,
    ).join('/')} · ${cat.regions} regions · rates as of ${cat.asOf}`,
  });

  let summary = '';

  switch (pageId) {
    case 'getting-started': {
      summary =
        'Onboarding, concepts, and FAQ for the Capacity Simulator. Data and rates are explained here.';
      facts.push({
        label: 'Providers',
        value: topEntries(cat.byProvider),
      });
      break;
    }

    case 'simulator': {
      summary =
        'Build a fleet, define VM demand, run the packing simulation, and read the results (fit, blockers, utilization, sellable headroom).';
      const r = state.result;
      data.workspaceView = state.ui.workspaceView;
      data.activeSidebarTab = state.ui.activeSidebarTab;
      data.bomLines = state.bom.length;
      data.hardwareGroups = state.userHardware.length;
      facts.push({
        label: 'Setup',
        value: `${state.userHardware.length} hardware group(s) · ${state.bom.length} VM demand line(s)`,
      });
      if (r) {
        data.result = {
          vmsPlaced: r.vmsPlaced,
          vmsUnplaceable: r.vmsUnplaceable.length,
          totalNodes: r.totalNodes,
          nodesConsumed: r.nodesConsumed,
          memoryUtilizationPct: Math.round(r.memoryUtilizationPct),
          vcpuUtilizationPct: Math.round(r.vcpuUtilizationPct),
          strandedMemoryGib: Math.round(r.strandedMemoryGib),
          deploymentLimited: r.deploymentLimited,
        };
        facts.push({
          label: 'Last run',
          value: `${r.vmsPlaced.toLocaleString()} VMs placed · ${
            r.vmsUnplaceable.length
          } unplaceable · ${r.nodesConsumed}/${r.totalNodes} nodes used · ${Math.round(
            r.memoryUtilizationPct,
          )}% mem · ${Math.round(r.vcpuUtilizationPct)}% vCPU`,
        });
      } else {
        facts.push({
          label: 'Last run',
          value: 'No simulation has been run yet in this session.',
        });
      }
      break;
    }

    case 'competitive': {
      summary =
        'Compare a chosen VM size against equivalent offerings on the other clouds.';
      const baseName = state.ui.competitiveBaseline;
      if (baseName) {
        const vm = findVm(state.userVms, baseName);
        data.baseline = vm
          ? {
              vmSizeName: vm.vmSizeName,
              provider: vm.provider,
              category: vm.category,
              vcpus: vm.vcpus,
              memoryGib: vm.memoryGib,
              hourlyUsd: vm.hourlyUsd,
              riOneYrHourlyUsd: vm.riOneYrHourlyUsd,
              riThreeYrHourlyUsd: vm.riThreeYrHourlyUsd,
            }
          : { vmSizeName: baseName };
        facts.push({
          label: 'Baseline VM',
          value: vm
            ? `${vm.vmSizeName} (${vm.provider ?? '—'}) — ${vm.vcpus} vCPU / ${
                vm.memoryGib
              } GiB`
            : baseName,
        });
      } else {
        facts.push({
          label: 'Baseline VM',
          value: 'None picked yet — choose a VM to compare.',
        });
      }
      break;
    }

    case 'region-availability': {
      summary =
        'Apples-to-apples cross-cloud region + VM equivalency: which regions and VM sizes on AWS / Azure / GCP serve the same need.';
      facts.push({
        label: 'Coverage',
        value: `${cat.regions} regions · ${topEntries(cat.byProvider)}`,
      });
      break;
    }

    case 'capacity-planning': {
      summary =
        'Long-horizon capacity planning (demand forecasting, exhaustion projection) — coming soon.';
      break;
    }

    default:
      summary = 'Capacity Simulator.';
  }

  return { pageId, title, subPage, summary, facts, focus, data };
}

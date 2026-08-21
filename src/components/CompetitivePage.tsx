/**
 * v2.12 (Phase F) — Competitive Offering page.
 *
 * Cross-provider VM comparison. Picks a baseline Azure SKU, resolves
 * its AWS + GCP analogs via the user-authored (+ public-seeded)
 * equivalency map, and renders side-by-side specs, pricing (PAYG / 1y
 * RI / 3y RI), region availability matrix, and plain-language spec
 * deltas.
 *
 * All data flows from state.userVms + state.userEquivalency. No baked
 * vendor catalogs — the seed already lives in src/data/* files that
 * merge into those slots on first init.
 *
 * The page is intentionally one long scroll (not tabbed) for at-a-
 * glance comparison; sections collapse if/when discoverability becomes
 * an issue at scale.
 */
import { useMemo, useState, useEffect, useRef, useDeferredValue } from 'react';
import { useApp } from '../state/AppContext';
import {
  findEquivalents,
  priceCompare,
  specDeltas,
  winnerAnalysis,
  timeHorizonCosts,
  normalizedRates,
  type EquivalentMatch,
  type VmContender,
  type SituationalWinners,
  type HorizonCost,
} from '../engine/competitive';
import { matchCaveats, worstCaveat, isStretch, type MatchCaveat } from '../utils/matchCaveats';
import {
  downloadEquivalencyXlsx,
  parseEquivalencyXlsx,
} from '../utils/equivalencyTemplate';
import { vmFamily } from '../utils/vmTaxonomy';
import { vmFeatures, vmDistance, matchPct, genFor, regionRefs, bestRegionMatch } from '../utils/equivalence';
import { comparableRegionsFor } from '../utils/costCalculator';
import { regionGeo as resolveRegionGeo, haversineKm, isEdgeRegion } from '../data/regionGeo';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { RegionAvailabilityPage } from './RegionAvailabilityPage';
import { MultiVmCompareTable } from './MultiVmCompareTable';
import { CrossCloudEquivalencyPanel } from './CrossCloudEquivalencyPanel';
import { CompareTable } from './CompareTable';
import { SpecsTakeaway } from './compare/SpecsTakeaway';
import { FloatingCompareDock } from './compare/FloatingCompareDock';
import { useBomPort } from './compare/useBomPort';
import type { BomPortResult } from '../utils/bomPort'; // S66-FIX-C
import { CostCalculator } from './compare/CostCalculator';
import { MatchMethodology } from './compare/MatchMethodology';
import { BomSpecsView } from './compare/BomSpecsView';
import type { Term } from '../utils/costCalculator';
import { StartHerePage } from './StartHerePage';
import { CmaFaqPage } from './CmaFaqPage';
import { LIVE_CATALOG_AS_OF } from '../data/liveCatalog';
import {
  rankedFamiliesVsBase,
  rankedFamiliesPerBase,
  rankedCategoriesPerBase,
  rankedSizesVsBase,
  findBetterMatchAlerts,
  bestMatchAnalog,
  mergeBestMatchFills,
  type BestMatchPick,
  type Provider as EqProvider,
} from '../utils/crossCloudEquivalency';
import { RegionMultiSelect } from './RegionMultiSelect';
import { CollapsibleSetupHeader, SetupStepCard } from './SetupStep';
import { regionRatesFor, regionsForVm, type RegionRate } from '../utils/regionRates';
import { type FilterChip } from './RegionFilterChips';
import { type MapMark } from './CompetitiveMap';
import { screenContext } from '../terminal/screenContext';
import {
  regionTwinsFor,
  lookupRegion,
  type RegionGeo,
} from '../data/regionCoordinates';
import type { CatalogEntry, EquivalencyEntry, UserVm, VmCategory, VmProvider } from '../types';
import { VM_CATEGORIES } from '../types';
import { categorize, matchCategory } from '../utils/vmCategory';
// C2 (Wave-1) — pricing visualizations.
import { CommitmentStepdown } from './compare/charts/CommitmentStepdown';
import { NormalizedRateTable } from './compare/charts/NormalizedRateTable';
import type { NormalizedRow } from './compare/charts/NormalizedRateTable';
import { BomCostComposition } from './compare/charts/BomCostComposition';
// C3 (Wave-2) — Executive Summary redesign + PPTX/DOCX export.
import { ExecSummaryBom } from './compare/ExecSummaryBom';
import { ExportButton } from './compare/ExportButton';
import { RateBarsChart } from './compare/charts/RateBarsChart';
import {
  buildExecComparisonModel,
  buildExecBomModel,
} from '../utils/export/execSummaryModel';
// PRICING (S65) — price verdict + cumulative cost-over-time keystone; snapshot
// tables demoted into a reference Disclosure.
import { Disclosure } from './Disclosure';
import { PriceVerdict } from './compare/PriceVerdict';
import { CostOverTimeChart } from './compare/charts/CostOverTimeChart';
import { priceVerdict } from './compare/charts/chartMath';
// EXEC (S65) — executive-briefing redesign: dollar verdict, KPI strip,
// what-you-get/give-up columns, market-posture strip, assumptions footer.
import { ExecBriefVerdict } from './compare/ExecBriefVerdict';
import { ExecBriefKpis } from './compare/ExecBriefKpis';
import { ExecBriefTradeoffs } from './compare/ExecBriefTradeoffs';
import { ExecBriefPosture } from './compare/ExecBriefPosture';
import { ExecBriefAssumptions } from './compare/ExecBriefAssumptions';
import { collectAssumptions } from './compare/execBriefMath';
import { buildMarketGapReport, refsFromVms, REGION_GEO_MAP, type GapProvider } from '../utils/marketGaps';
// SPECS (S65) — the at-a-glance spec-showdown hero + insight strip.
// (Disclosure already imported above; compareSpecs imported here supersedes the
// former end-of-file EXPORT import — S65 integration dedupe.)
import {
  SpecShowdown,
  SpecShowdownInsights,
  type ShowdownColumn,
  type ShowdownInsight,
} from './compare/SpecShowdown';
import { compareSpecs } from '../utils/specInsights';
// S66-PRICING — one Pricing skeleton in BOTH modes: the whole-BoM verdict band
// + the BoM cost-over-time adapter (totals straight from bomPortResult).
import { BomPriceVerdict } from './compare/PriceVerdict';
import { bomPriceVerdict, bomCostSeries } from './compare/charts/chartMath';
// S66-SPECS — the Specs answer band (section 1 of the frozen page grammar) in
// BOTH modes + the shared answer-grammar tokens (aliased where the page still
// carries a legacy private copy owned by other blocks).
import { VerdictBand } from './compare/ui/VerdictBand'; // S66-SPECS
// S66-FIX-C — the page's private PROVIDER_TONE / pctTone / simTone / fmtUsd /
// term-label copies are DELETED; every surface reads the ONE shared token
// source (no aliases — plain names).
import {
  providerTone,
  pctTone,
  fmtUsd,
  fmtPct,
  termLabelShort,
  termLabelLong,
} from './compare/ui/tokens'; // S66-SPECS · S66-FIX-C
import {
  specsVerdict,
  bomSpecsVerdict,
  bomShowdownInsights,
  bomCloudStats,
  pairMatchPct,
  STRONG_MATCH_PCT,
  type BomCloudSpecStat,
  type BomSpecsVerdictModel,
  type ShowdownInsight as BomCloudInsight,
} from './compare/specShowdownMath'; // S66-SPECS · S66-FIX-C (BomCloudInsight unified onto ShowdownInsight)

type ProviderKey = 'Azure' | 'AWS' | 'GCP' | 'Custom';
const SUPPORTED_PROVIDERS: ProviderKey[] = ['Azure', 'AWS', 'GCP', 'Custom'];

/** A cross-cloud region peer counts as "comparable" to the base region if it's in
 *  the same country or within ~1000 km (a neighbouring metro). Beyond that the
 *  rate bars flag the region as non-comparable rather than imply it's a peer.
 *  Mirrors CostCalculator's REGION_MATCH_KM. */
const REGION_BAR_MATCH_KM = 1000;

// v2.29 — Sidebar sub-pages. "Compare" group = the filter + side-by-side
// evidence the user authors; "Detail" group = the read-only drill-downs.
// v2.30 — Region Availability folded in as a third "Region" group: its three
// sub-views render the embedded RegionAvailabilityPage (availability / coverage
// / equivalency) so both top-level pages live in ONE unified shell.
type CompetitiveTab =
  | 'start-here'
  | 'setup'
  | 'executive-summary'
  | 'compare'
  | 'pricing'
  | 'region-availability'
  | 'region-coverage'
  | 'library'
  | 'faq';

// Human sub-page names for the Terminal "Data assistant" context chip — so it
// reads "Cloud Market Analytics · At a Glance" and the model knows the user is
// most likely asking about what's on this exact sub-page.
const SUBPAGE_LABEL: Record<CompetitiveTab, string> = {
  'start-here': 'Start Here',
  setup: 'Comparison Setup',
  'executive-summary': 'Executive Summary',
  compare: 'Specs',
  pricing: 'Pricing',
  'region-availability': 'Region Availability',
  'region-coverage': 'Coverage',
  library: 'Rate Library',
  faq: 'FAQ & Glossary',
};

// S66-FIX-C — the private PROVIDER_TONE map + providerTone/pctTone/simTone/
// fmtUsd copies that used to live here were deleted; the page imports the ONE
// shared implementation from compare/ui/tokens (identical values — tokens'
// providerTone takes a string and falls back to the neutral tone).

export function CompetitivePage({
  initialTab = 'setup',
}: {
  initialTab?: CompetitiveTab;
} = {}) {
  const { state, dispatch } = useApp();

  // Defensive guards — slices may be undefined transiently after HMR
  // re-enters with old persisted shape before the seed populates.
  const userEquivalencyArr = state.userEquivalency ?? [];
  const userVmsArr = state.userVms ?? [];

  // PERF (v2.52.1) — The live catalog is region-EXPLODED: ~100k rows = every
  // (provider × region × size). But spec / family / category similarity ranking
  // is region-INDEPENDENT, and this setup has no region picker, so the ranking
  // memos below were iterating all ~100k rows and feeding an O(n²) best-match
  // pass — ~3.7s per recompute, which froze every filter click. Collapse to one
  // representative row per (provider, vmSizeName) ONCE (memoized on the catalog
  // alone, so it's stable across every filter toggle) and feed the ranking memos
  // from THIS (~3.2k rows). Region-specific surfaces (region option lists, the
  // Region page) keep reading the full `userVmsArr`.
  const uniqueVmsArr = useMemo(() => {
    const seen = new Set<string>();
    const out: UserVm[] = [];
    for (const v of userVmsArr) {
      const key = `${v.provider ?? 'Custom'}|${v.vmSizeName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    return out;
  }, [userVmsArr]);

  // S66-FIX-C (perf) — ONE memoized spec-lookup index over the DEDUPED catalog
  // (specs are region-free), keyed `${provider}|${vmSizeName}`. Feeds
  // BomSpecsView's per-line CatalogEntry resolution and (once FIX-A's opts land)
  // execBriefMath.bomTradeoffs, replacing their O(lines × |userVms|) find scans.
  const vmSpecLookup = useMemo(() => {
    const m = new Map<string, CatalogEntry>();
    for (const v of uniqueVmsArr) m.set(`${v.provider ?? 'Custom'}|${v.vmSizeName}`, v);
    return m;
  }, [uniqueVmsArr]);

  // PERF (v2.52.34) — Deferred catalog. "Try Demo" dispatches a single HYDRATE
  // that swaps `state.userVms` for the demo's baked catalog — a NEW array ref, so
  // `uniqueVmsArr` recomputes and (if fed urgently) busts every scope-filter +
  // O(n²) ranking memo on the URGENT commit, stacking several full re-ranks and
  // freezing the app for minutes. The heavy memos read THIS deferred copy, so the
  // hydrate paints immediately and the re-rank runs once at low priority. Region
  // option lists / the Region page keep reading the urgent `uniqueVmsArr`.
  const dUniqueVmsArr = useDeferredValue(uniqueVmsArr);
  // PERF (v2.52.34) — Deferred FULL catalog for the region-aware equivalents
  // chain (`findEquivalents` iterates the region-exploded `userVmsArr`, not the
  // deduped `uniqueVmsArr`). Same rationale as `dUniqueVmsArr`: keeps the demo
  // HYDRATE's catalog swap off the urgent commit.
  const dUserVmsArr = useDeferredValue(userVmsArr);

  // ── v2.13 (Phase G) — Cascading filter flow ─────────────────────────
  //   1. Provider multi-select (which cloud(s) am I shopping)
  //   2. Region multi-select (filtered by #1)
  //   3. VM Family multi-select (filtered by #1 + #2)
  //   4. VM SKU dropdown (final pick — becomes the comparison baseline)
  // All filter state is local to the page for now; deep-link from
  // Insights still works by setting `state.ui.competitiveBaseline` which
  // we pre-load into the SKU pick.
  // v2.15 (Phase I) — Provider multi-select stays. Region + VM SKU
  // become PER-PROVIDER: one region + one VM pick per active cloud.
  // This is a tighter UX than the old Set<string> because users almost
  // always want to compare "one Azure region vs one AWS region vs one
  // GCP region", not arbitrary multi-region/multi-cloud mashes.
  const [pickedProviders, setPickedProviders] = useState<Set<string>>(
    new Set(['Azure', 'AWS', 'GCP']),
  );
  const [pickedRegionByProvider, setPickedRegionByProvider] = useState<
    Record<string, string | null>
  >({ Azure: null, AWS: null, GCP: null, Custom: null });
  const [pickedSkuByProvider, setPickedSkuByProvider] = useState<
    Record<string, string | null>
  >({ Azure: null, AWS: null, GCP: null, Custom: null });
  // v2.36 — TRUE MULTI-VM COMPARE. The base cloud now carries a LIST of VM
  // sizes to compare side-by-side (deduped, order preserved), not a single
  // anchor. `compareSkus[0]` is mirrored into `pickedSkuByProvider[base]` so
  // every existing single-anchored view (Pricing / Recommendation / KPI hero /
  // At-a-Glance verdict) keeps working on the FIRST selected VM unchanged.
  const [compareSkus, setCompareSkus] = useState<string[]>([]);
  // v2.44 — VM Category is now MULTI-select per cloud (mirrors VM family/size):
  // chips + an "+ Add category" picker, independent per cloud. A multi-category
  // BASE means MULTIPLE category rows in the equivalents table — one ranked row
  // per picked base category. EMPTY array = no category filter for that cloud.
  // (Was single-select `VmCategory | null` through v2.43.)
  const [pickedCategoryByProvider, setPickedCategoryByProvider] = useState<
    Record<string, VmCategory[]>
  >({ Azure: [], AWS: [], GCP: [], Custom: [] });
  // v2.17.12 — VM Family is per-provider + single-select via searchable
  // dropdown (matches the VM Size UX). Picking a family for one cloud
  // soft-highlights the families on the other clouds that the equivalency
  // table maps to it. Replaces the old cross-cloud `pickedFamilies` Set.
  const [pickedFamilyByProvider, setPickedFamilyByProvider] = useState<
    Record<string, string | null>
  >({ Azure: null, AWS: null, GCP: null, Custom: null });
  // v2.39 — MULTI-select VM families per cloud (the setup filter authors this;
  // `pickedFamilyByProvider` above is kept synced to the FIRST family so the
  // legacy dimMatch / equivalents / auto-prefill paths stay anchored). EMPTY
  // array = no family filter for that cloud.
  const [pickedFamiliesByProvider, setPickedFamiliesByProvider] = useState<
    Record<string, string[]>
  >({ Azure: [], AWS: [], GCP: [], Custom: [] });
  // PERF (v2.52.12) — clicking a CATEGORY or VM-FAMILY chip fired the O(n²)
  // cross-cloud ranking memos (`categoryRankingPerBase` / `familyRankingData` /
  // `familyRankingPerBase`, ~1s) on the URGENT render, so the chip lagged. The
  // chip's selected highlight reads the urgent picked-maps directly (instant);
  // these DEFERRED copies feed only the heavy ranking memos, so the table + the
  // ≈% numbers fill a beat later while the click stays snappy. (Mirrors the
  // v2.52.1 filter-box fix.)
  const dPickedCategoryByProvider = useDeferredValue(pickedCategoryByProvider);
  const dPickedFamiliesByProvider = useDeferredValue(pickedFamiliesByProvider);
  // PERF (v2.52.34) — Switching the BASE cloud (`setBaselineProvider`) and
  // toggling a cloud OFF in the roster (`pickedProviders`) used to re-run the
  // same O(n²) cross-cloud ranking chain on the URGENT render (base-switch
  // ~2000ms, roster-toggle 662–2214ms). The radio's selected state, the column
  // layout and every base-badge read stay URGENT (instant paint); these DEFERRED
  // copies feed ONLY the heavy scope-filter + ranking memos, so the table + ≈%
  // numbers converge a beat later. Mirrors `dPickedCategoryByProvider` above.
  // Region belongs to the same scope filters, so defer it too for consistency
  // (a memo must never mix a deferred base with an urgent region → transient
  // wrong pairing). `baselineProvider` is declared below; its deferred copy is
  // taken there.
  const dPickedProviders = useDeferredValue(pickedProviders);
  const dPickedRegionByProvider = useDeferredValue(pickedRegionByProvider);
  // v2.41 — The comparison builder: an ORDERED list of picks per cloud. Each
  // pick carries the BASE table-row it was selected from (`row` = the base VM
  // size whose row's cell was clicked) so the equivalents-table highlight is
  // ROW-SPECIFIC — clicking the GCP analog on the M64 row marks ONLY that row,
  // never the row above that happens to share the same closest analog. The Nth
  // pick from each cloud still lines up on comparison row N (drag to re-pair).
  // v2.41 — `auto` (S65, Bug 2) marks a pick that the Best-match toggle BACKFILLED
  // into the comparison table for a base row the user had no manual analog on.
  // Manual picks (auto falsy) always win and survive the toggle; auto picks are
  // removed the instant Best match turns OFF (or the base row goes away).
  const [compareByProvider, setCompareByProvider] = useState<
    Record<string, { value: string; row: string; auto?: boolean }[]>
  >({
    Azure: [],
    AWS: [],
    GCP: [],
  });
  // S65 (Fix 3) — SUPPRESSED auto-fills. When Best match is ON, ✕-removing an AUTO
  // pick used to resurrect it in the SAME cycle: the removal mutates
  // `compareByProvider` → the fills memo recomputes → the backfill effect refires →
  // `mergeBestMatchFills` re-appends the very row just removed. We record removed
  // auto rows here (`${provider}::${row}`) so the merge skips them for this session.
  // A ref (not state) so writing it never itself triggers a re-render/effect loop;
  // the backfill effect reads `.current`. Cleared when Best match toggles OFF or the
  // base-row set changes (a genuinely new base pick may want its auto back).
  const suppressedAutoFills = useRef<Set<string>>(new Set());
  // Values-only view (drops the source-row tag) for everything that just needs
  // the picked size names: the comparison box, the spec sheet, the anchor sync.
  const compareValuesByProvider = useMemo(
    () => ({
      Azure: (compareByProvider.Azure ?? []).map((p) => p.value),
      AWS: (compareByProvider.AWS ?? []).map((p) => p.value),
      GCP: (compareByProvider.GCP ?? []).map((p) => p.value),
    }),
    [compareByProvider],
  );
  // Back-compat view: any family picked anywhere counts as an active filter.
  const pickedFamilies = useMemo(() => {
    const set = new Set<string>();
    for (const p of ['Azure', 'AWS', 'GCP', 'Custom']) {
      const f = pickedFamilyByProvider[p];
      if (f) set.add(f);
    }
    return set;
  }, [pickedFamilyByProvider]);
  // v2.17.17 — Memory-tier sub-pills retired. The new compound family slugs
  // (`MM Mv1`, `HM Mv2`, `VHM Mv3`, etc.) emitted by `vmFamily()` already
  // encode tier + generation in a single axis, so the Azure Family
  // dropdown does the narrowing in one click without a secondary control.

  // v2.17 — User-selectable basis of comparison. Whichever cloud the user
  // marks as the "baseline" wins the BASELINE badge in the spec cards and
  // anchors the comparison narrative. Azure stays the equivalency-table
  // key (the seed is Azure-keyed) but the displayed anchor flips so users
  // can compare AWS vs Azure/GCP or GCP vs Azure/AWS naturally.
  const [baselineProvider, setBaselineProvider] = useState<'Azure' | 'AWS' | 'GCP'>(
    'Azure',
  );
  // PERF (v2.52.34) — Deferred base for the heavy ranking/equivalents memos (see
  // the `dPickedProviders` note above). The urgent `baselineProvider` still
  // drives the radio-selected highlight + column order so the click paints now.
  const dBaselineProvider = useDeferredValue(baselineProvider);
  // PERF (v2.52.34) — Deferred single-family / single-SKU picks so the catalog-
  // iterating `dimMatch` dropdown-decoration memo reads a fully consistent set of
  // deferred base inputs (never a deferred base paired with an urgent family/SKU).
  const dPickedFamilyByProvider = useDeferredValue(pickedFamilyByProvider);
  const dPickedSkuByProvider = useDeferredValue(pickedSkuByProvider);

  // v2.52.1 — The filter writes used to be wrapped in startTransition to keep
  // the click responsive while a long chain of catalog-iterating useMemos + an
  // O(n²) ranking re-ran. That work is now cheap (the catalog is deduped to
  // unique sizes for ranking, and the heavy equivalency panel's memo is stable),
  // so the writes are URGENT again — deferring them only delayed the radio/chip
  // paint behind the (now ~30ms) render. See `uniqueVmsArr` + the memoized
  // `orderedClouds`/`activeClouds`.

  // v2.29 — Sidebar sub-page selection. The Competitive Offering page used to
  // be one long scroll; it's now a left-sidebar multi-page shell (mirroring the
  // simulator's NavRail) so each surface shows one focused thing. This is LOCAL
  // state in the shell: all the filter state above lives in THIS component and
  // therefore persists as the user switches sub-pages (the component never
  // unmounts on navigation — only the rendered content block changes).
  const [competitiveTab, setCompetitiveTab] = useState<CompetitiveTab>(initialTab);
  const [navCollapsed, setNavCollapsed] = useState(false);

  // v2.34 — Set-up "Focus" selector. The front-door card the user picks routes
  // them straight into the matching first view (VMs → At a Glance, Regions →
  // Region availability). Local-only — it's a navigation affordance, not a
  // persisted filter.
  const [focus, setFocus] = useState<'vms' | 'pricing' | 'regions' | 'summary'>('vms');
  // v2.52.30 — The Pricing page's Commitment-term toggle lives inside CostCalculator
  // but ALSO drives the sibling "Cross-cloud cost" matrix (HorizonSummary) below it,
  // so the term is lifted here and passed down as a controlled prop. Picking 1-yr /
  // 3-yr now reprices the matrix, not just the per-cloud totals.
  const [pricingTerm, setPricingTerm] = useState<Term>('payg');

  // v2.41 — Active comparison ROW. The comparison table (the numbered zip-rows
  // authored on setup) persists at the top of At a Glance / VM Compare / the
  // Executive summary; a row-toggle picks which row anchors the page content.
  // Indexing the per-cloud anchor sync (below) by this row makes EVERY
  // single-anchor view (verdict / KPI / pricing / specs) follow the toggle.
  const [activeCompareRow, setActiveCompareRow] = useState(0);
  // v2.52.3 — the dock's Comparison ⇄ VM BoM toggle, lifted so the whole Specs /
  // Exec-Summary detail below re-scopes to the active BoM row when VM BoM is on.
  const [compareMode, setCompareMode] = useState<'comparison' | 'bom'>('comparison');

  // v2.46 — Executive Summary scope. 'row' = brief the ONE active comparison
  // pairing (verdict-first, row-anchored evidence); 'all' = roll up across every
  // pick / product group. Toggle in the upper-right of the Exec Summary page.
  const [execScope, setExecScope] = useState<'row' | 'all'>('row');

  // v2.35 — Unified per-cloud chip filter. The old ② Filter was FIVE stacked
  // dropdown cards (Provider / Region / Category / Family / Size), each
  // rendering one dropdown per active cloud. That's nine-plus permanent boxes
  // for what is really "add any combination of selections". The new control is
  // ONE card: active picks render as removable, cloud-coloured chips, and a
  // single inline "+ Add filter" affordance lets the user add any dimension on
  // any cloud in any order. These two pieces of LOCAL state drive only the
  // add-control's two-step picker (dimension → cloud); every actual selection
  // still writes the SAME `pickedX` setters the old dropdowns did, so every
  // downstream view is untouched.
  type FilterDim = 'provider' | 'region' | 'category' | 'family' | 'size';
  const [addDim, setAddDim] = useState<FilterDim | null>(null);
  const [addCloud, setAddCloud] = useState<ProviderKey>('Azure');

  // v2.37 — ② Filter is a survey-style collapsing STEPPER (modeled on Build a
  // Server): one dimension per step, base cloud highlighted, light ≈% on the
  // other clouds. Finishing a step (Next →) collapses it to a one-line summary
  // and opens the next, so the box never grows tall. `filterStep` is the open
  // step; clicking any collapsed step header revisits it.
  //
  // v2.38 — REGION is intentionally NOT a setup dimension. Region filtering
  // belongs on the pages that consume it (Region availability / Coverage /
  // Equivalency / Pricing / Recommendation), where it can be multi-select; the
  // setup only narrows the apples-to-apples basis (category + family).
  // v2.44 — the Clouds & basis selection is now the FIRST step of this one
  // stepper (was a separate ① section above), so the box reads top-to-bottom:
  // Clouds & basis → Category → VM family, each a collapsing step exactly like
  // the others.
  // v2.46 — OBJECTIVE is the FIRST step, before clouds. Two modes:
  //   'sizes'    — apples-to-apples VM-size comparison (the original flow:
  //                multi-select category/family, a VM Size table, a Selected-VM
  //                spec sheet, size picks that build the comparison table).
  //   'products' — compare PRODUCT OFFERINGS across competitors. The user stops
  //                at Category (compare categories) or VM family (compare
  //                families); they pick ONE category + ONE family per cloud
  //                (single-select), there is NO VM Size table and NO Selected-VM
  //                specs box. Better-match ALERTS still fire if a closer family
  //                exists. Backlog #3 (deep-dive ONE provider across its
  //                categories) is the products mode with a single active cloud —
  //                structurally already reachable; the dedicated UI is backlogged.
  type CompareObjective = 'sizes' | 'products';
  const [compareObjective, setCompareObjective] = useState<CompareObjective>('sizes');
  const isProducts = compareObjective === 'products';
  type FilterStep = 'objective' | 'clouds' | 'category' | 'family' | 'done';
  const [filterStep, setFilterStep] = useState<FilterStep>('objective');
  // v2.44 — "Best match" mode (shared across the Category + VM family steps):
  // when ON, the user picks ONLY for the base cloud and each OTHER cloud is
  // auto-set to its genuinely closest analog (category + family of the nearest
  // cross-cloud VM — so an Azure E base picks GCP General Purpose · n2 where
  // n2-highmem matches ~100%, NOT Memory Optimized · m3 which tops out ~1%). The
  // non-base pickers lock to read-only so the user can't recreate a worse pick.
  const [bestMatchAuto, setBestMatchAuto] = useState(false);
  // v2.43.4 — the setup box collapses to a one-line summary so the cross-cloud
  // equivalents table below gets the screen real estate. It auto-collapses when
  // the user finishes the filter (clicks Done / Skips the last step); clicking
  // the header re-expands it.
  const [filterOpen, setFilterOpen] = useState(true);
  const collapseSetup = () => {
    setFilterOpen(false);
  };
  // v2.43.6 — when the public-data pill routes to the FAQ, this names the
  // section the FAQ should open + scroll to (e.g. 'data' for the refresh story).
  const [faqFocus, setFaqFocus] = useState<string | undefined>(undefined);
  const openFaqAt = (section: string) => {
    setFaqFocus(section);
    setCompetitiveTab('faq');
  };

  // v2.38 — Region scoping lives on the pages that consume it, INDEPENDENTLY
  // per page (the user's call). EMPTY set = all regions. Pricing carries its own;
  // the Region tabs have their own inside RA. (S53 — the Recommendation page's
  // `recoRegions` was removed with that page.)
  const [pricingRegions, setPricingRegions] = useState<Set<string>>(new Set());

  // Anchor SKU = the FIRST base-cloud VM in the compare list (v2.36), else the
  // baseline provider's single pick, else fall back through the others. The
  // primary anchor drives every existing single-anchored view (Pricing /
  // Recommendation / KPI hero / At-a-Glance verdict) unchanged.
  // v2.39 — The anchor is the base cloud's SINGLE picked VM (the table cells are
  // now single-select per cloud). Falls back through the other clouds' picks,
  // then the persisted baseline.
  const baseline =
    pickedSkuByProvider[baselineProvider] ||
    pickedSkuByProvider.Azure ||
    pickedSkuByProvider.AWS ||
    pickedSkuByProvider.GCP ||
    state.ui.competitiveBaseline;

  // v2.39 — Keep the base cloud inside the selected providers. If the user
  // deselects the cloud that was the base, re-anchor the base on the first
  // remaining provider so the views never point at an inactive cloud.
  useEffect(() => {
    if (pickedProviders.size === 0) return;
    if (!pickedProviders.has(baselineProvider)) {
      const first = (['Azure', 'AWS', 'GCP'] as const).find((p) => pickedProviders.has(p));
      if (first) setBaselineProvider(first);
    }
  }, [pickedProviders, baselineProvider]);

  // v2.40 — Sync each cloud's FIRST compare pick into the single
  // `pickedSkuByProvider` so the anchor `baseline` + every single-VM view
  // (Pricing / Recommendation / KPI hero) keep working on the primary pick.
  useEffect(() => {
    setPickedSkuByProvider((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of ['Azure', 'AWS', 'GCP']) {
        const list = compareByProvider[p] ?? [];
        // v2.41 — anchor on the ACTIVE comparison row (clamped), so the
        // row-toggle re-scopes every single-anchor view; fall back to the first
        // pick when that cloud has fewer picks than the active row.
        const idx = Math.min(activeCompareRow, Math.max(0, list.length - 1));
        const pick = list[idx]?.value ?? list[0]?.value ?? null;
        if (next[p] !== pick) {
          next[p] = pick;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [compareByProvider, activeCompareRow]);

  // Keep the active comparison row within the available row count.
  const compareRowCount = Math.max(
    0,
    ...(['Azure', 'AWS', 'GCP'] as const).map((p) => compareByProvider[p]?.length ?? 0),
  );
  useEffect(() => {
    // The active row is shared between the comparison rows AND the VM-BoM lines,
    // so clamp to whichever set is larger — otherwise stepping a BoM line while
    // there are no comparison picks (compareRowCount === 0) snaps back to 0.
    const maxRows = Math.max(compareRowCount, state.bom?.length ?? 0);
    if (activeCompareRow > 0 && activeCompareRow >= maxRows) {
      setActiveCompareRow(Math.max(0, maxRows - 1));
    }
  }, [compareRowCount, activeCompareRow, state.bom]);

  // When the dock flips Comparison ⇄ VM BoM, reset the active selection to that
  // mode's sensible default: VM BoM defaults to "All" (-1) so the Pricing page
  // shows the TOTAL cost of deploying every line; Comparison defaults to row 0.
  useEffect(() => {
    setActiveCompareRow(compareMode === 'bom' ? -1 : 0);
  }, [compareMode]);

  // Shared comparison-pick mutators — used by the setup explorer's `select`
  // prop AND the persistent CompareTable so both author the same state.
  // v2.41 — the lists ALLOW DUPLICATES (the same analog can pair with several
  // base rows), so add is an APPEND and removal is BY POSITION (the box row).
  // v2.41 — clicking a cell APPENDS its VM tagged with the base row it came
  // from. Clicking the SAME cell again adds ANOTHER instance (+2, +3, …) so you
  // can pull the same analog into several comparison rows; the highlight/count
  // is row-specific (other rows sharing the analog stay untouched). Removal is
  // by position in the comparison box (✕ / drag-out), never by re-clicking.
  const addComparePick = (p: string, value: string, row: string) =>
    setCompareByProvider((prev) => ({ ...prev, [p]: [...(prev[p] ?? []), { value, row }] }));
  const removeComparePickAt = (p: string, index: number) =>
    setCompareByProvider((prev) => {
      const list = prev[p] ?? [];
      if (index < 0 || index >= list.length) return prev;
      const removed = list[index];
      // S65 (Fix 3) — removing an AUTO pick suppresses that base row so the backfill
      // effect doesn't re-add it in the same recompute cycle. (Manual removals need
      // no suppression — nothing re-adds a manual pick.)
      if (removed?.auto) suppressedAutoFills.current.add(`${p}::${removed.row}`);
      return { ...prev, [p]: list.filter((_, i) => i !== index) };
    });
  const reorderComparePick = (p: string, from: number, to: number) =>
    setCompareByProvider((prev) => {
      const list = [...(prev[p] ?? [])];
      if (from < 0 || from >= list.length) return prev;
      const [item] = list.splice(from, 1);
      const idx = Math.max(0, Math.min(to, list.length));
      list.splice(idx, 0, item);
      return { ...prev, [p]: list };
    });

  // v2.39 — Sync the multi-family selection's FIRST entry into the legacy
  // single `pickedFamilyByProvider` so dimMatch / equivalents / auto-prefill
  // (which read one family) stay anchored on the primary pick.
  useEffect(() => {
    setPickedFamilyByProvider((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of ['Azure', 'AWS', 'GCP', 'Custom']) {
        const head = pickedFamiliesByProvider[p]?.[0] ?? null;
        if (next[p] !== head) {
          next[p] = head;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pickedFamiliesByProvider]);

  // When the base cloud changes, keep only compare entries that are valid VM
  // sizes on the NEW base cloud (clears the list when none survive).
  useEffect(() => {
    setCompareSkus((prev) => {
      if (prev.length === 0) return prev;
      const valid = new Set(
        (state.userVms ?? [])
          .filter((v) => (v.provider ?? 'Custom') === baselineProvider)
          .map((v) => v.vmSizeName),
      );
      const next = prev.filter((s) => valid.has(s));
      return next.length === prev.length ? prev : next;
    });
    // Intentionally only re-key on base-cloud change, not on every catalog tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineProvider]);
  const setBaseline = (v: string | null) =>
    dispatch({ type: 'UI_SET', ui: { competitiveBaseline: v } });

  // S47 — publish the active sub-page (+ picked VM) to the Terminal "Data
  // assistant" so its context chip reads "Cloud Market Analytics · <sub-page>"
  // and the model knows the user is most likely asking about THIS sub-page.
  // Data-only per the Terminal silo contract (no engine internals).
  useEffect(() => {
    screenContext.publish({
      label: baseline
        ? `${baselineProvider} ${baseline} vs other clouds`
        : SUBPAGE_LABEL[competitiveTab],
      detail: baseline
        ? `Base cloud ${baselineProvider}; comparing ${baseline} across clouds.`
        : 'No VM picked yet — set one in Comparison Setup.',
      subPage: SUBPAGE_LABEL[competitiveTab],
      data: {
        subPage: competitiveTab,
        baseCloud: baselineProvider,
        pickedVm: baseline ?? null,
      },
    });
  }, [competitiveTab, baselineProvider, baseline]);
  // Clear the focus when leaving the page so other pages aren't mis-grounded.
  useEffect(() => () => screenContext.publish(null), []);

  // Twins suggestion — for each picked region, find its nearest analog in
  // every other provider. Used to soft-highlight those pills.
  const twins = useMemo(() => {
    const map: Record<string, RegionGeo[]> = { Azure: [], AWS: [], GCP: [] };
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      const r = pickedRegionByProvider[p];
      if (!r) continue;
      const twinSet = regionTwinsFor(p, r);
      for (const [twinProv, twinGeo] of Object.entries(twinSet)) {
        if (!map[twinProv]) map[twinProv] = [];
        map[twinProv].push(twinGeo);
      }
    }
    return map;
  }, [pickedRegionByProvider]);

  // v2.15 — Per-provider region universe. Each active provider gets its
  // own row of region pills (one-per-cloud picking model).
  const regionsByProvider = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of pickedProviders) map[p] = [];
    for (const v of userVmsArr) {
      const p = v.provider ?? 'Custom';
      if (!pickedProviders.has(p)) continue;
      if (!v.region) continue;
      if (isEdgeRegion(p, v.region)) continue; // skip AWS Local Zones / Wavelength
      if (!map[p].includes(v.region)) map[p].push(v.region);
    }
    for (const k of Object.keys(map)) map[k].sort();
    return map;
  }, [userVmsArr, pickedProviders]);

  // VM Family universe — derived across all active providers + their
  // picked region (if any). Multi-select across the union.
  const universeFamilies = useMemo(() => {
    const set = new Set<string>();
    for (const v of uniqueVmsArr) {
      const p = v.provider ?? 'Custom';
      if (!pickedProviders.has(p)) continue;
      const pickedReg = pickedRegionByProvider[p];
      if (pickedReg && v.region !== pickedReg) continue;
      const f = vmFamily(v);
      if (f) set.add(f);
    }
    return Array.from(set).sort();
  }, [uniqueVmsArr, pickedProviders, pickedRegionByProvider]);

  // v2.15 — Per-provider VM SKU options. One dropdown per active cloud.
  // Each filtered to that provider's VMs (+ that provider's region pick
  // when set + the cross-provider family multiselect).
  //
  // Family filter is applied PER-PROVIDER and SKIPPED when none of the
  // active families intersect that provider's catalog. Reason: family
  // names are provider-specific ("M" is Azure-only; AWS uses
  // "x2idn"/"m7i"; GCP uses "m3"/"n2-highmem"). If the user has "M"
  // selected, AWS shouldn't drop to zero — it should ignore that filter.
  const skuOptionsByProvider = useMemo(() => {
    const out: Record<string, DropdownOption[]> = {};
    for (const p of pickedProviders) {
      // v2.17.12 — Per-provider family filter (single-select). Only the
      // family picked FOR THIS PROVIDER narrows its SKU dropdown — picking
      // an Azure family no longer hides AWS/GCP SKUs (each cloud's family
      // dropdown is independent now).
      const pickedFamilyForThis = pickedFamilyByProvider[p] ?? null;
      const pickedCatsForThis = pickedCategoryByProvider[p] ?? [];
      const dedupe = new Map<string, UserVm>();
      for (const v of uniqueVmsArr) {
        if ((v.provider ?? 'Custom') !== p) continue;
        const pickedReg = pickedRegionByProvider[p];
        if (pickedReg && v.region !== pickedReg) continue;
        if (pickedCatsForThis.length > 0) {
          const cat = v.category ?? categorize(v.provider, v.family);
          if (!pickedCatsForThis.includes(cat)) continue;
        }
        if (pickedFamilyForThis && vmFamily(v) !== pickedFamilyForThis) continue;
        // v2.17.17 — Tier + generation filtering is folded into the
        // compound family slug (`MM Mv2`, `HM Mv3`, etc.). When the user
        // picks `HM Mv3` as the Azure family, only those rows survive
        // the `vmFamily(v) !== pickedFamilyForThis` check above. No more
        // separate memory-tier sub-pill filter needed.
        if (!dedupe.has(v.vmSizeName)) dedupe.set(v.vmSizeName, v);
      }
      out[p] = Array.from(dedupe.values()).map((v) => optionForVm(v, p));
    }
    return out;
  }, [uniqueVmsArr, pickedProviders, pickedRegionByProvider, pickedCategoryByProvider, pickedFamilyByProvider]);

  // v2.17.12 — Per-provider VM Family options for the searchable dropdowns.
  // Each provider's list is derived from its own catalog rows, narrowed by
  // any active region pick. Returns DropdownOption[] including a per-family
  // SKU count in `meta` so users see breadth at a glance.
  const familyOptionsByProvider = useMemo(() => {
    const out: Record<string, DropdownOption[]> = { Azure: [], AWS: [], GCP: [], Custom: [] };
    const counts: Record<string, Map<string, number>> = {
      Azure: new Map(), AWS: new Map(), GCP: new Map(), Custom: new Map(),
    };
    for (const v of uniqueVmsArr) {
      const p = (v.provider ?? 'Custom') as 'Azure' | 'AWS' | 'GCP' | 'Custom';
      if (!pickedProviders.has(p)) continue;
      const pickedReg = pickedRegionByProvider[p];
      if (pickedReg && v.region !== pickedReg) continue;
      const pickedCats = pickedCategoryByProvider[p] ?? [];
      if (pickedCats.length > 0) {
        const cat = v.category ?? categorize(v.provider, v.family);
        if (!pickedCats.includes(cat)) continue;
      }
      const fam = vmFamily(v);
      if (!fam) continue;
      counts[p].set(fam, (counts[p].get(fam) ?? 0) + 1);
    }
    for (const p of ['Azure', 'AWS', 'GCP', 'Custom'] as const) {
      const list = Array.from(counts[p].entries()).sort((a, b) => a[0].localeCompare(b[0]));
      out[p] = list.map(([family, n]) => ({
        value: family,
        label: family,
        meta: `${n} SKU${n === 1 ? '' : 's'}`,
      }));
    }
    return out;
  }, [uniqueVmsArr, pickedProviders, pickedRegionByProvider, pickedCategoryByProvider]);

  // v2.17.13 — Per-provider VM Category options for the searchable dropdown.
  // Derived from the catalog narrowed by Provider + active region pick.
  // Category labels are canonical across clouds (Memory Optimized means the
  // same thing on Azure / AWS / GCP), so no soft-highlight needed — the
  // auto-mirror effect just copies the value to other providers.
  const categoryOptionsByProvider = useMemo(() => {
    const out: Record<string, DropdownOption[]> = { Azure: [], AWS: [], GCP: [], Custom: [] };
    const counts: Record<string, Map<VmCategory, number>> = {
      Azure: new Map(), AWS: new Map(), GCP: new Map(), Custom: new Map(),
    };
    for (const v of uniqueVmsArr) {
      const p = (v.provider ?? 'Custom') as 'Azure' | 'AWS' | 'GCP' | 'Custom';
      if (!pickedProviders.has(p)) continue;
      const pickedReg = pickedRegionByProvider[p];
      if (pickedReg && v.region !== pickedReg) continue;
      const cat: VmCategory = v.category ?? categorize(v.provider, v.family);
      counts[p].set(cat, (counts[p].get(cat) ?? 0) + 1);
    }
    for (const p of ['Azure', 'AWS', 'GCP', 'Custom'] as const) {
      // Sort by canonical VM_CATEGORIES order so the dropdown is stable.
      const present = VM_CATEGORIES.filter((c) => counts[p].has(c));
      out[p] = present.map((cat) => ({
        value: cat,
        label: cat,
        meta: `${counts[p].get(cat)} SKUs`,
      }));
    }
    return out;
  }, [userVmsArr, pickedProviders, pickedRegionByProvider]);

  // v2.17.12 — Cross-cloud family equivalency map derived from the SKU-level
  // equivalency table. For every family on any provider, list the families
  // on the OTHER providers that contain at least one analog SKU. Drives the
  // "▶ Suggested" prefix in the Family dropdowns.
  const equivalentFamiliesByFamily = useMemo(() => {
    // Build a SKU → family lookup first.
    const skuToFamily = new Map<string, { provider: string; family: string }>();
    for (const v of userVmsArr) {
      const key = `${(v.provider ?? '').toLowerCase()}|${v.vmSizeName.toLowerCase()}`;
      const fam = vmFamily(v);
      if (fam) skuToFamily.set(key, { provider: v.provider ?? '', family: fam });
    }
    // key = "<provider>|<family>" (lowercase) → set of "<otherProvider>|<otherFamily>"
    const map = new Map<string, Set<string>>();
    const add = (a: { p: string; f: string } | null, b: { p: string; f: string } | null) => {
      if (!a || !b) return;
      const ka = `${a.p.toLowerCase()}|${a.f.toLowerCase()}`;
      const kb = `${b.p.toLowerCase()}|${b.f.toLowerCase()}`;
      const setA = map.get(ka) ?? new Set<string>(); setA.add(kb); map.set(ka, setA);
      const setB = map.get(kb) ?? new Set<string>(); setB.add(ka); map.set(kb, setB);
    };
    for (const eq of userEquivalencyArr) {
      const az = eq.azureSku ? skuToFamily.get(`azure|${eq.azureSku.toLowerCase()}`) : null;
      const aw = eq.awsSku ? skuToFamily.get(`aws|${eq.awsSku.toLowerCase()}`) : null;
      const gc = eq.gcpSku ? skuToFamily.get(`gcp|${eq.gcpSku.toLowerCase()}`) : null;
      const cells = [
        az ? { p: 'Azure', f: az.family } : null,
        aw ? { p: 'AWS', f: aw.family } : null,
        gc ? { p: 'GCP', f: gc.family } : null,
      ];
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          add(cells[i], cells[j]);
        }
      }
    }
    return map;
  }, [userEquivalencyArr, userVmsArr]);

  // v2.17.12 — For the active Family picks (per provider), compute which
  // family slugs on each OTHER provider are "suggested" cross-cloud analogs.
  const suggestedFamilyByProvider = useMemo(() => {
    const out: Record<string, Set<string>> = { Azure: new Set(), AWS: new Set(), GCP: new Set(), Custom: new Set() };
    for (const sourceP of ['Azure', 'AWS', 'GCP'] as const) {
      const pickedFam = pickedFamilyByProvider[sourceP];
      if (!pickedFam) continue;
      const key = `${sourceP.toLowerCase()}|${pickedFam.toLowerCase()}`;
      const peers = equivalentFamiliesByFamily.get(key);
      if (!peers) continue;
      for (const k of peers) {
        const [otherP, otherF] = k.split('|');
        const otherProv = otherP === 'azure' ? 'Azure' : otherP === 'aws' ? 'AWS' : 'GCP';
        if (otherProv === sourceP) continue;
        // Find the matching family slug with the original casing from the
        // catalog (Sets are lowercased internally).
        const opt = familyOptionsByProvider[otherProv]?.find(
          (o) => o.value.toLowerCase() === otherF,
        );
        if (opt) out[otherProv].add(opt.value);
      }
    }
    return out;
  }, [pickedFamilyByProvider, equivalentFamiliesByFamily, familyOptionsByProvider]);

  // v2.17.12 — Per-provider Region DropdownOption list. Includes a "▶
  // Suggested" prefix when the region is a twin of an active pick on
  // another provider. `meta` shows the per-region VM count so users see
  // breadth.
  const regionOptionsByProvider = useMemo(() => {
    const out: Record<string, DropdownOption[]> = { Azure: [], AWS: [], GCP: [], Custom: [] };
    const counts: Record<string, Map<string, number>> = {
      Azure: new Map(), AWS: new Map(), GCP: new Map(), Custom: new Map(),
    };
    for (const v of userVmsArr) {
      const p = (v.provider ?? 'Custom') as 'Azure' | 'AWS' | 'GCP' | 'Custom';
      if (!pickedProviders.has(p)) continue;
      const r = v.region ?? '';
      if (!r) continue;
      if (isEdgeRegion(p, r)) continue; // skip AWS Local Zones / Wavelength
      counts[p].set(r, (counts[p].get(r) ?? 0) + 1);
    }
    for (const p of ['Azure', 'AWS', 'GCP', 'Custom'] as const) {
      const suggested = new Set((twins[p] ?? []).map((g) => g.region));
      const list = Array.from(counts[p].entries()).sort((a, b) => a[0].localeCompare(b[0]));
      out[p] = list.map(([region, n]) => {
        const isSuggested = suggested.has(region);
        return {
          value: region,
          label: isSuggested ? `▶ ${region}` : region,
          meta: isSuggested ? `Suggested · ${n} VMs` : `${n} VMs`,
        };
      });
    }
    return out;
  }, [userVmsArr, pickedProviders, twins]);

  // v2.16 — Two-level grouping for Azure M-Series: `section` (MM/HM/VHM)
  // wraps `group` (Mv1/Mv2/Mv3). Non-M-family Azure VMs fall back to
  // ungrouped. The dropdown also gets sorted so the memory categories
  // come out in MM → HM → VHM order and generations in Mv1 → Mv2 → Mv3.
  // v2.17.17 — Azure M-series nested-grouping retired. The compound family
  // slug (`MM Mv1`, `HM Mv2`, …) emitted by `vmFamily()` already collapses
  // tier + generation into a single pre-filter axis, so the dropdown
  // doesn't need MM/HM/VHM section pills or Mv1/Mv2/Mv3 group headers
  // any more. `groupedAzureOptions` is now just an alias for the flat
  // option list; kept as a name so render-site references don't break.
  const groupedAzureOptions = skuOptionsByProvider.Azure ?? [];

  // v2.17.12 — VM equivalency soft-highlight, now BIDIRECTIONAL. When the
  // user picks any SKU on any cloud, mark the analog SKUs on the OTHER
  // clouds with the "▶ Suggested" prefix. Walks the SKU-keyed equivalency
  // table and accumulates all matching analogs (Azure pick suggests
  // AWS+GCP; AWS pick suggests Azure+GCP; GCP pick suggests Azure+AWS).
  const suggestedSkuByProvider = useMemo(() => {
    const out: Record<string, Set<string>> = { Azure: new Set(), AWS: new Set(), GCP: new Set() };
    const azurePick = pickedSkuByProvider.Azure;
    const awsPick = pickedSkuByProvider.AWS;
    const gcpPick = pickedSkuByProvider.GCP;
    if (!azurePick && !awsPick && !gcpPick) return out;
    // First pass: walk the curated equivalency seed.
    for (const eq of userEquivalencyArr) {
      const az = (eq.azureSku ?? '').toLowerCase();
      const aw = (eq.awsSku ?? '').toLowerCase();
      const gc = (eq.gcpSku ?? '').toLowerCase();
      const matched =
        (azurePick && az === azurePick.toLowerCase()) ||
        (awsPick && aw === awsPick.toLowerCase()) ||
        (gcpPick && gc === gcpPick.toLowerCase());
      if (!matched) continue;
      if (eq.azureSku) out.Azure.add(eq.azureSku);
      if (eq.awsSku) out.AWS.add(eq.awsSku);
      if (eq.gcpSku) out.GCP.add(eq.gcpSku);
    }
    // v2.17.16 — Spec-based fallback. The curated equivalency seed only
    // has ~23 rows; most SKU picks won't have an exact entry. For each
    // provider where the seed left an empty slot, find the closest match
    // in the OTHER providers' catalogs by category + memory + vCPU. This
    // makes suggestions show up for EVERY pick, not just the curated few.
    // The match function scores candidates by (a) same category (b)
    // closest memory (within 25%) (c) closest vCPU.
    const sourcePicks: Array<{ provider: 'Azure' | 'AWS' | 'GCP'; sku: string }> = [];
    if (azurePick) sourcePicks.push({ provider: 'Azure', sku: azurePick });
    if (awsPick) sourcePicks.push({ provider: 'AWS', sku: awsPick });
    if (gcpPick) sourcePicks.push({ provider: 'GCP', sku: gcpPick });
    for (const src of sourcePicks) {
      const sourceRow = userVmsArr.find(
        (v) => v.vmSizeName === src.sku && (v.provider ?? '') === src.provider,
      );
      if (!sourceRow) continue;
      for (const targetP of ['Azure', 'AWS', 'GCP'] as const) {
        if (targetP === src.provider) continue;
        // Skip if seed already populated this provider for this pick.
        if (out[targetP].size > 0) continue;
        const match = findClosestSpecMatch(sourceRow, targetP, userVmsArr);
        if (match) out[targetP].add(match.vmSizeName);
      }
    }
    return out;
  }, [pickedSkuByProvider.Azure, pickedSkuByProvider.AWS, pickedSkuByProvider.GCP, userEquivalencyArr, userVmsArr]);

  // v2.16 — Cross-cloud equivalent availability map. For EVERY SKU in
  // the catalog, list which OTHER providers have an analog via the
  // equivalency table. Drives the colored "has-twin" dots next to each
  // VM name in the dropdowns. The user immediately sees which SKUs are
  // worth picking for comparison vs which are orphans.
  const equivalentsBySku = useMemo(() => {
    // key = SKU (lowercase) → set of OTHER providers that have an analog.
    const map = new Map<string, Set<string>>();
    const add = (sku: string | undefined, others: string[]) => {
      if (!sku) return;
      const k = sku.toLowerCase();
      const set = map.get(k) ?? new Set<string>();
      for (const o of others) set.add(o);
      map.set(k, set);
    };
    for (const eq of userEquivalencyArr) {
      const present: Array<{ p: string; sku?: string }> = [
        { p: 'Azure', sku: eq.azureSku },
        { p: 'AWS', sku: eq.awsSku },
        { p: 'GCP', sku: eq.gcpSku },
      ].filter((x) => !!x.sku);
      for (const me of present) {
        const others = present
          .filter((x) => x.p !== me.p)
          .map((x) => x.p);
        add(me.sku, others);
      }
    }
    return map;
  }, [userEquivalencyArr]);

  // v2.27.10 — % match for EVERY dropdown vs the base cloud's pick. For each
  // non-base provider, build a value→pct map per dimension (region geo distance,
  // canonical category, family spec-average, exact-SKU spec distance). The
  // dropdown render decorates + sorts options closest-first off these maps.
  const dimMatch = useMemo(() => {
    const base = dBaselineProvider;
    const baseRegion = dPickedRegionByProvider[base];
    const baseCats = dPickedCategoryByProvider[base] ?? [];
    const baseFam = dPickedFamilyByProvider[base];
    const baseSku = dPickedSkuByProvider[base];

    // Index the catalog once: (provider|name)→row and (provider|family)→sizes.
    const rowByPN = new Map<string, UserVm>();
    const sizesByPF = new Map<string, UserVm[]>();
    const dedupeFam = new Set<string>();
    for (const v of dUniqueVmsArr) {
      const p = v.provider ?? 'Custom';
      const nk = `${p}|${v.vmSizeName}`;
      if (!rowByPN.has(nk)) rowByPN.set(nk, v);
      const fam = vmFamily(v);
      if (fam) {
        const fk = `${p}|${fam}`;
        const dk = `${fk}|${v.vmSizeName}`;
        if (!dedupeFam.has(dk)) {
          dedupeFam.add(dk);
          const arr = sizesByPF.get(fk);
          if (arr) arr.push(v);
          else sizesByPF.set(fk, [v]);
        }
      }
    }
    const baseVm = baseSku ? rowByPN.get(`${base}|${baseSku}`) ?? null : null;
    const baseFamSizes = baseFam ? sizesByPF.get(`${base}|${baseFam}`) ?? [] : [];

    const region: Record<string, Record<string, number>> = {};
    const category: Record<string, Record<string, number>> = {};
    const family: Record<string, Record<string, number>> = {};
    const size: Record<string, Record<string, number>> = {};
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      if (p === base) continue;
      region[p] = {};
      category[p] = {};
      family[p] = {};
      size[p] = {};
      // Region — geographic similarity to the base region.
      if (baseRegion) {
        const regs = new Set<string>();
        for (const v of userVmsArr) if ((v.provider ?? '') === p && v.region) regs.add(v.region);
        for (const r of regs) {
          const pct = regionSimPct(base, baseRegion, p, r);
          if (pct != null) region[p][r] = pct;
        }
      }
      // Category — canonical across clouds, so each picked base category is 100%.
      for (const bc of baseCats) category[p][bc] = 100;
      // Family — two modes so the family % never contradicts the size %:
      //  • base SIZE picked → each family scores by its BEST size's match to
      //    that exact base size. (A family like AWS t2 that tops out at 8 vCPU
      //    can't serve a 16-vCPU base, so it scores low — matching what the
      //    size dropdown shows — instead of the old ~96% family-distribution
      //    average that implied a great match it can't actually deliver.)
      //  • only a base FAMILY picked → fall back to the family-to-family
      //    average (familySimPct).
      if (baseVm || baseFamSizes.length) {
        const bf = baseVm ? vmFeatures(baseVm) : null;
        const fams = new Set<string>();
        for (const v of dUniqueVmsArr) {
          if ((v.provider ?? '') !== p) continue;
          const f = vmFamily(v);
          if (f) fams.add(f);
        }
        for (const f of fams) {
          const sizes = sizesByPF.get(`${p}|${f}`) ?? [];
          if (bf) {
            // Best (closest) size in this family vs the picked base size.
            let best = Infinity;
            for (const v of sizes) {
              const d = vmDistance(bf, vmFeatures(v));
              if (d < best) best = d;
            }
            if (isFinite(best)) family[p][f] = matchPct(best);
          } else {
            const pct = familySimPct(baseFamSizes, sizes);
            if (pct != null) family[p][f] = pct;
          }
        }
      }
      // Size — exact spec distance to the base SKU.
      if (baseVm) {
        const bf = vmFeatures(baseVm);
        const seenSize = new Set<string>();
        for (const v of dUniqueVmsArr) {
          if ((v.provider ?? '') !== p) continue;
          if (seenSize.has(v.vmSizeName)) continue;
          seenSize.add(v.vmSizeName);
          const d = vmDistance(bf, vmFeatures(v));
          if (isFinite(d)) size[p][v.vmSizeName] = matchPct(d);
        }
      }
    }
    return { region, category, family, size };
  }, [
    dBaselineProvider,
    dPickedRegionByProvider,
    dPickedCategoryByProvider,
    dPickedFamilyByProvider,
    dPickedSkuByProvider,
    dUniqueVmsArr,
    userVmsArr,
  ]);

  // v2.37 — In-scope catalog after the ② Filter picks. Feeds the cross-cloud
  // equivalency explorer below the stepper so it SHRINKS as the user narrows
  // (per-cloud region / category / family). Provider must be active; each set
  // pick filters that provider's rows (other providers are unconstrained on
  // that dimension — they fall back to category-equivalent matching in the
  // table itself).
  const setupScopedVms = useMemo(() => {
    return dUniqueVmsArr.filter((v) => {
      const p = (v.provider ?? 'Custom') as ProviderKey;
      if (!dPickedProviders.has(p)) return false;
      const reg = dPickedRegionByProvider[p];
      if (reg && v.region !== reg) return false;
      const cats = dPickedCategoryByProvider[p];
      if (cats && cats.length > 0) {
        const vc = v.category ?? categorize(v.provider, v.family);
        if (!cats.includes(vc)) return false;
      }
      const fams = dPickedFamiliesByProvider[p];
      if (fams && fams.length > 0 && !fams.includes(vmFamily(v) ?? '')) return false;
      return true;
    });
  }, [
    dUniqueVmsArr,
    dPickedProviders,
    dPickedRegionByProvider,
    dPickedCategoryByProvider,
    dPickedFamiliesByProvider,
  ]);

  // v2.43.1 — Ranking pool for the cross-cloud FAMILY explorer. Same region +
  // category scope as `setupScopedVms`, but the family filter is applied ONLY to
  // the BASE provider (whose picks define the rows). Non-base clouds keep their
  // FULL same-category family list so ticking a comparison family HIGHLIGHTS it
  // — it never collapses the ranked suggestions or overwrites another base
  // family's row (the bug where picking AWS r5 replaced M-series' x1e with r5
  // and made the runners-up vanish). Selection is a highlight signal, not a
  // filter, for these rankings.
  const rankingScopedVms = useMemo(() => {
    return dUniqueVmsArr.filter((v) => {
      const p = (v.provider ?? 'Custom') as ProviderKey;
      if (!dPickedProviders.has(p)) return false;
      const reg = dPickedRegionByProvider[p];
      if (reg && v.region !== reg) return false;
      const cats = dPickedCategoryByProvider[p];
      if (cats && cats.length > 0) {
        const vc = v.category ?? categorize(v.provider, v.family);
        if (!cats.includes(vc)) return false;
      }
      if (p === dBaselineProvider) {
        const fams = dPickedFamiliesByProvider[p];
        if (fams && fams.length > 0 && !fams.includes(vmFamily(v) ?? '')) return false;
      }
      return true;
    });
  }, [
    dUniqueVmsArr,
    dPickedProviders,
    dPickedRegionByProvider,
    dPickedCategoryByProvider,
    dPickedFamiliesByProvider,
    dBaselineProvider,
  ]);

  // v2.44 — Ranking pool for the cross-cloud CATEGORY explorer. Region + provider
  // scope only: the category filter is NOT applied to the non-base clouds, so a
  // cloud scoped to one category (in ② Category) still shows its FULL ranked
  // category list as recommendations — the pick HIGHLIGHTS, it never removes the
  // other analogs. (The base category rows come from `pickedCategoryByProvider`
  // explicitly; `rankedCategoriesVsBase` selects the base category internally.)
  // S65 (Fix 2) — also the confidential rung-2 bridge pool for the ranked family /
  // size paths below, so it must be declared before them.
  const categoryRankingPool = useMemo(() => {
    return dUniqueVmsArr.filter((v) => {
      const p = (v.provider ?? 'Custom') as ProviderKey;
      if (!dPickedProviders.has(p)) return false;
      const reg = dPickedRegionByProvider[p];
      if (reg && v.region !== reg) return false;
      return true;
    });
  }, [dUniqueVmsArr, dPickedProviders, dPickedRegionByProvider]);

  // v2.39 — When a BASE family is picked, rank EVERY in-scope family in the
  // other clouds by similarity (best on top, alternatives below) so the user
  // can explore — not just see the single closest. Null = no base family → the
  // panel falls back to its base-anchored "closest" family rows.
  const familyRankingData = useMemo(() => {
    const baseFam = dPickedFamiliesByProvider[dBaselineProvider]?.[0];
    if (!baseFam) return null;
    const others = (['Azure', 'AWS', 'GCP'] as const).filter(
      (p) => dPickedProviders.has(p) && p !== dBaselineProvider,
    ) as EqProvider[];
    if (others.length === 0) return null;
    return rankedFamiliesVsBase(
      rankingScopedVms,
      dBaselineProvider as EqProvider,
      baseFam,
      others,
      undefined,
      // S65 (Fix 2) — region-scoped-but-category-unfiltered pool so a Confidential
      // base bridges to its capable peers (rung 2) even when the ② category filter
      // has narrowed every cloud to Confidential. Non-confidential = unchanged.
      categoryRankingPool,
    );
  }, [dPickedFamiliesByProvider, dBaselineProvider, dPickedProviders, rankingScopedVms, categoryRankingPool]);

  // v2.43 — Per-base-family rankings: EACH base family gets its own row in the
  // panel with its #1 match + a couple of inline runner-up alternatives (the
  // single `familyRankingData` above only ranks vs the FIRST base family).
  //
  // v2.43.2 — When NO base family is explicitly picked (the UNFILTERED state),
  // the rows are EVERY in-scope base-provider family — so the unfiltered list
  // gets the same #1 + next-2 inline layout (all muted until a comparison family
  // is ticked) instead of a single colored match per cloud. Picking a base
  // family narrows the rows to those picks exactly as before.
  const resolvedBaseFamilies = useMemo(() => {
    const picked = dPickedFamiliesByProvider[dBaselineProvider];
    if (picked && picked.length > 0) return picked;
    // Unfiltered: all distinct families the base provider has in scope.
    const seen = new Set<string>();
    for (const v of rankingScopedVms) {
      if ((v.provider ?? 'Custom') !== dBaselineProvider) continue;
      const f = vmFamily(v);
      if (f) seen.add(f);
    }
    return [...seen];
  }, [dPickedFamiliesByProvider, dBaselineProvider, rankingScopedVms]);

  const familyRankingPerBase = useMemo(() => {
    if (resolvedBaseFamilies.length === 0) return null;
    const others = (['Azure', 'AWS', 'GCP'] as const).filter(
      (p) => dPickedProviders.has(p) && p !== dBaselineProvider,
    ) as EqProvider[];
    if (others.length === 0) return null;
    const ranked = rankedFamiliesPerBase(
      rankingScopedVms,
      dBaselineProvider as EqProvider,
      resolvedBaseFamilies,
      others,
      3,
      // S65 (Fix 2) — confidential rung-2 bridge pool (see rankedFamiliesVsBase).
      categoryRankingPool,
    );
    // Order rows by each base family's BEST cross-cloud match (most-equivalent
    // first) so the unfiltered list leads with the strongest analogs. Picked
    // families keep their pick order (the panel slices to the picks).
    const picked = dPickedFamiliesByProvider[dBaselineProvider];
    if (picked && picked.length > 0) return ranked;
    const bestPct = (fam: string) =>
      Math.max(0, ...Object.values(ranked[fam] ?? {}).map((arr) => arr[0]?.pct ?? 0));
    const ordered: Record<string, (typeof ranked)[string]> = {};
    for (const fam of [...resolvedBaseFamilies].sort((a, b) => bestPct(b) - bestPct(a))) {
      ordered[fam] = ranked[fam];
    }
    return ordered;
  }, [resolvedBaseFamilies, dBaselineProvider, dPickedProviders, rankingScopedVms, dPickedFamiliesByProvider, categoryRankingPool]);

  // v2.41 — ONE family-similarity map used by every family ≈% surface (the
  // step's dropdown options AND the picked-family chips) so none of them ever
  // contradicts the equivalents table. When a base family is picked the table
  // scores each family by its BEST member vs the base-family rep
  // (`familyRankingData`); we overlay that on the dimMatch fallback so the
  // numbers — and the dropdown's sort order — match the table exactly.
  const familyMatchByProvider = useMemo(() => {
    const out: Record<string, Record<string, number>> = { Azure: {}, AWS: {}, GCP: {} };
    // v2.41 — the family ≈% is meaningful ONLY relative to a picked BASE family
    // (the step's own copy says "≈% spec match to the base family"). With no base
    // family there is nothing to measure against, so show NO % — never a
    // size-anchored fallback that reads as "89% similar to nothing" and
    // contradicts the table. When a base family IS picked, every family scores
    // by its best achievable size match (`familyRankingData`) — table, chips and
    // dropdown all read this one map, so they always agree.
    const bp = familyRankingData?.byProvider;
    if (bp) {
      for (const p of ['Azure', 'AWS', 'GCP'] as const) {
        for (const r of bp[p] ?? []) out[p][r.family] = r.pct;
      }
    }
    return out;
  }, [familyRankingData]);


  // v2.44 — When BASE categories are picked (multi-select), each gets its OWN
  // ranked row: its #1 cross-cloud analog + inline runner-ups per other cloud —
  // exactly like the per-base VM-family rows. Null = no base category picked →
  // the panel falls back to its default matched-category rows.
  const categoryRankingPerBase = useMemo(() => {
    const bases = dPickedCategoryByProvider[dBaselineProvider] ?? [];
    if (bases.length === 0) return null;
    const others = (['Azure', 'AWS', 'GCP'] as const).filter(
      (p) => dPickedProviders.has(p) && p !== dBaselineProvider,
    ) as EqProvider[];
    if (others.length === 0) return null;
    return rankedCategoriesPerBase(
      categoryRankingPool,
      dBaselineProvider as EqProvider,
      bases,
      others,
    );
  }, [dPickedCategoryByProvider, dBaselineProvider, dPickedProviders, categoryRankingPool]);

  // v2.44 — ONE category-similarity map for every category ≈% surface (the ②
  // Category dropdown options) so the FILTER never contradicts the equivalents
  // table. Built from the SAME `categoryRankingPerBase` the table renders, so
  // GCP "Memory Optimized" reads 89% in both places — not a naive pinned-100
  // "same canonical category" assumption (the real Azure MO ↔ GCP MO spec
  // similarity is < 100). Best pct across the picked base categories.
  const categoryMatchByProvider = useMemo(() => {
    const out: Record<string, Record<string, number>> = { Azure: {}, AWS: {}, GCP: {} };
    if (!categoryRankingPerBase) return out;
    for (const byProv of Object.values(categoryRankingPerBase)) {
      for (const p of ['Azure', 'AWS', 'GCP'] as const) {
        for (const r of byProv[p] ?? []) {
          const cur = out[p][r.category];
          out[p][r.category] = cur == null ? r.pct : Math.max(cur, r.pct);
        }
      }
    }
    return out;
  }, [categoryRankingPerBase]);

  // v2.44 — The base cloud's in-scope VMs (its own region/category/family/size
  // picks). The "Best match" auto-pick anchors on THIS (base-only) so setting the
  // OTHER clouds' picks never feeds back into the anchor — no effect loop.
  const baseScopedVms = useMemo(() => {
    const reg = dPickedRegionByProvider[dBaselineProvider];
    const cats = dPickedCategoryByProvider[dBaselineProvider] ?? [];
    const fams = dPickedFamiliesByProvider[dBaselineProvider] ?? [];
    const skus = new Set((compareByProvider[dBaselineProvider] ?? []).map((pk) => pk.value));
    return dUniqueVmsArr.filter((v) => {
      if ((v.provider ?? 'Custom') !== dBaselineProvider) return false;
      if (reg && v.region !== reg) return false;
      if (cats.length && !cats.includes(v.category ?? categorize(v.provider, v.family))) return false;
      if (fams.length && !fams.includes(vmFamily(v) ?? '')) return false;
      if (skus.size && !skus.has(v.vmSizeName)) return false;
      return true;
    });
  }, [
    dUniqueVmsArr,
    dBaselineProvider,
    dPickedRegionByProvider,
    dPickedCategoryByProvider,
    dPickedFamiliesByProvider,
    compareByProvider,
  ]);

  // v2.44 — Each OTHER cloud's closest analog (category + family + the REAL
  // size-level match %) to the base's in-scope VMs. Only computed while Best
  // match is ON. Drives both the auto-pick effect and the locked chip's % (so
  // the chip shows the genuine ~100% n2-highmem match, not the diluted category
  // aggregate).
  const bestMatchPicksByProvider = useMemo(() => {
    const out: Record<string, BestMatchPick[]> = { Azure: [], AWS: [], GCP: [] };
    if (!bestMatchAuto) return out;
    const baseCats = dPickedCategoryByProvider[dBaselineProvider] ?? [];
    const baseFams = dPickedFamiliesByProvider[dBaselineProvider] ?? [];
    const baseSkus = compareByProvider[dBaselineProvider] ?? [];
    // No base selection yet → NO best match. (We anchor on an explicit base pick,
    // not on the whole base universe — otherwise an empty base would still
    // auto-fill a phantom ≈100% analog against every Azure VM.)
    if (baseCats.length === 0 && baseFams.length === 0 && baseSkus.length === 0) return out;
    // Group the base's in-scope VMs by the dimension the user actually picked, so a
    // multi-family / multi-category base yields one best match PER base selection
    // (Mbdsv3 → r5, E → r6i) instead of a single collapsed analog.
    type Grp = { vms: CatalogEntry[] };
    const groups: Grp[] = [];
    if (baseFams.length > 0) {
      for (const fam of baseFams) {
        const vms = baseScopedVms.filter((v) => (vmFamily(v) ?? '') === fam);
        if (vms.length) groups.push({ vms });
      }
    } else if (baseCats.length > 0) {
      for (const cat of baseCats) {
        const vms = baseScopedVms.filter(
          (v) => (v.category ?? categorize(v.provider, v.family)) === cat,
        );
        if (vms.length) groups.push({ vms });
      }
    } else {
      // Only specific SKUs picked → one match for the whole pinned set.
      if (baseScopedVms.length) groups.push({ vms: baseScopedVms });
    }
    for (const p of SUPPORTED_PROVIDERS) {
      if (p === dBaselineProvider || !dPickedProviders.has(p)) continue;
      const pool = categoryRankingPool.filter((v) => (v.provider ?? 'Custom') === p);
      // De-dupe by category+family — two base families can map to the SAME analog;
      // keep the higher-% match so the chip doesn't repeat.
      const byKey = new Map<string, BestMatchPick>();
      for (const g of groups) {
        const pick = bestMatchAnalog(g.vms, pool);
        if (!pick) continue;
        const k = `${pick.category}::${pick.family}`;
        const prev = byKey.get(k);
        if (!prev || pick.pct > prev.pct) byKey.set(k, pick);
      }
      out[p] = [...byKey.values()].sort((a, b) => b.pct - a.pct);
    }
    return out;
  }, [
    bestMatchAuto,
    baseScopedVms,
    dPickedCategoryByProvider,
    dPickedFamiliesByProvider,
    compareByProvider,
    categoryRankingPool,
    dBaselineProvider,
    dPickedProviders,
  ]);

  // v2.44 — Best-match auto-pick effect. When the toggle is ON, set each OTHER
  // cloud's category + family to its closest analog. Guarded (only writes when
  // the pick changes) so the base-anchor memo re-running on a new array
  // reference can't spin a loop.
  useEffect(() => {
    if (!bestMatchAuto) return;
    const others = SUPPORTED_PROVIDERS.filter(
      (p) => p !== baselineProvider && pickedProviders.has(p),
    );
    if (others.length === 0) return;
    const sameArr = (a: string[] = [], b: string[] = []) =>
      a.length === b.length && a.every((x, i) => x === b[i]);
    // The family step must anchor on an explicit base FAMILY (or pinned SKU) —
    // NOT merely a base category. A base-category-only pick auto-fills the other
    // clouds' category, but leaving the base family blank must leave their family
    // blank too (the family step then shows "Pick a base family first"), so we
    // never surface a phantom family best-match the user didn't anchor.
    const baseHasFamAnchor =
      (pickedFamiliesByProvider[baselineProvider]?.length ?? 0) > 0 ||
      (compareByProvider[baselineProvider]?.length ?? 0) > 0;
    setPickedCategoryByProvider((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of others) {
        const picks = bestMatchPicksByProvider[p] ?? [];
        const cats = [...new Set(picks.map((pk) => pk.category))];
        if (!sameArr(prev[p] ?? [], cats)) {
          next[p] = cats as VmCategory[];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setPickedFamiliesByProvider((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of others) {
        // No base family/SKU anchor → clear (never auto-fill from a category).
        const fams = baseHasFamAnchor
          ? [...new Set((bestMatchPicksByProvider[p] ?? []).map((pk) => pk.family).filter(Boolean))]
          : [];
        if (!sameArr(prev[p] ?? [], fams)) {
          next[p] = fams;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [
    bestMatchAuto,
    bestMatchPicksByProvider,
    baselineProvider,
    pickedProviders,
    pickedFamiliesByProvider,
    compareByProvider,
  ]);

  // S65 (Bug 2) — Per-base-ROW analog SIZE for each other cloud, so the Best-match
  // toggle can BACKFILL the comparison table (not just the category/family chips).
  // Each base pick's `row` is a base VM size; we resolve its single closest analog
  // SIZE on every other cloud from the FULL region-scoped pool (`categoryRankingPool`
  // — category-UNfiltered, so the suggestion reaches the real same-category peer,
  // never a chip-narrowed cross-category stretch). Only the base's OWN picked sizes
  // seed rows (an explicit "compare this" anchor), so we never fabricate phantom
  // rows. Empty while Best match is OFF.
  const bestMatchSizeFillByProvider = useMemo(() => {
    const out: Record<string, Record<string, string>> = { Azure: {}, AWS: {}, GCP: {} };
    if (!bestMatchAuto) return out;
    const basePicks = compareByProvider[dBaselineProvider] ?? [];
    if (basePicks.length === 0) return out;
    // Distinct base rows (size names) the user anchored, mapped to their base VM.
    const baseVmBySize = new Map<string, CatalogEntry>();
    for (const v of categoryRankingPool) {
      if ((v.provider ?? 'Custom') !== dBaselineProvider) continue;
      if (!baseVmBySize.has(v.vmSizeName)) baseVmBySize.set(v.vmSizeName, v);
    }
    for (const p of SUPPORTED_PROVIDERS) {
      if (p === dBaselineProvider || !dPickedProviders.has(p)) continue;
      const pool = categoryRankingPool.filter((v) => (v.provider ?? 'Custom') === p);
      if (pool.length === 0) continue;
      for (const pk of basePicks) {
        if (out[p][pk.row] != null) continue; // resolve each base row once
        const baseVm = baseVmBySize.get(pk.row);
        if (!baseVm) continue;
        const analog = bestMatchAnalog([baseVm], pool);
        if (analog) out[p][pk.row] = analog.size;
      }
    }
    return out;
  }, [bestMatchAuto, compareByProvider, categoryRankingPool, dBaselineProvider, dPickedProviders]);

  // S65 (Bug 2 + Fix 3) — Backfill the comparison table from the size fills above.
  // For every base row, if a non-base cloud has NO pick on that row yet, append the
  // auto analog (tagged `auto`). MANUAL picks (auto falsy) always win and stay in
  // place; existing autos keep their position (order preserved across passes). When
  // Best match is OFF (or the base row disappears), the auto entries are dropped;
  // manual entries are preserved. Guarded so a stable state never triggers a write.
  //
  // Fix 3 — suppression: a base row the user ✕-removed while Best match is ON is in
  // `suppressedAutoFills` and is NOT re-added this cycle (was resurrecting instantly).
  // The suppression set is CLEARED when Best match toggles OFF or the base-row set
  // changes (both handled by dedicated effects below), so a fresh scenario starts clean.
  useEffect(() => {
    setCompareByProvider((prev) => {
      let changed = false;
      const next = { ...prev };
      // Distinct base rows still present (order-preserving) — a row must exist on the
      // base for its analog to backfill; toggling OFF passes empty fills → auto drop.
      const baseRows = [...new Set((prev[baselineProvider] ?? []).map((pk) => pk.row))];
      for (const p of SUPPORTED_PROVIDERS) {
        if (p === baselineProvider) continue;
        const list = prev[p] ?? [];
        const fills = bestMatchAuto ? bestMatchSizeFillByProvider[p] ?? {} : {};
        // Provider-scoped suppressed rows (strip the `${p}::` prefix).
        const suppressed = new Set<string>();
        for (const key of suppressedAutoFills.current) {
          if (key.startsWith(`${p}::`)) suppressed.add(key.slice(p.length + 2));
        }
        const rebuilt = mergeBestMatchFills(list, baseRows, fills, suppressed);
        // Only rewrite this provider's list if it actually changed (stable ref else).
        const same =
          rebuilt.length === list.length &&
          rebuilt.every(
            (pk, i) => pk.value === list[i].value && pk.row === list[i].row && !!pk.auto === !!list[i].auto,
          );
        if (!same) {
          next[p] = rebuilt;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bestMatchAuto, bestMatchSizeFillByProvider, baselineProvider]);

  // S65 (Fix 3) — CLEAR suppressions when Best match toggles OFF (a fresh ON should
  // re-offer every analog) or when the BASE cloud changes (its rows are gone).
  useEffect(() => {
    if (!bestMatchAuto) suppressedAutoFills.current.clear();
  }, [bestMatchAuto, baselineProvider]);

  // S65 (Fix 3) — CLEAR suppressions when the BASE-ROW SET changes (the user picked
  // or dropped a base size). A genuinely new base pick may legitimately want its auto
  // analog back, and a removed base row's suppression is moot. Keyed on the sorted
  // base-row signature so a mere reorder / analog-value change does NOT clear it.
  const baseRowSignature = useMemo(
    () => [...new Set((compareByProvider[baselineProvider] ?? []).map((pk) => pk.row))].sort().join('|'),
    [compareByProvider, baselineProvider],
  );
  useEffect(() => {
    suppressedAutoFills.current.clear();
  }, [baseRowSignature]);

  // v2.44 — "Better match outside your filter" alerts. For each base VM the user
  // has picked, compare each other cloud's best match INSIDE the current filter
  // (`setupScopedVms`) against its best across the FULL catalog
  // (`categoryRankingPool`, region-only). When the full best is materially better
  // and hidden by the filter, surface it as an alert (the right-hand pane shows
  // ONLY these). Anchored on the picked base sizes — that's the moment the user
  // is asking "what's the closest VM?" and a filtered dead-end is most misleading.
  const betterMatchAlerts = useMemo(() => {
    // Anchor on the base sizes the user has ticked in the equivalents table
    // (`compareByProvider[base]` — the same set the panel treats as selected).
    const anchorSizes = [
      ...new Set((compareByProvider[dBaselineProvider] ?? []).map((pk) => pk.value)),
    ];
    if (anchorSizes.length === 0) return [];
    const others = (['Azure', 'AWS', 'GCP'] as const).filter(
      (p) => dPickedProviders.has(p) && p !== dBaselineProvider,
    ) as EqProvider[];
    if (others.length === 0) return [];
    const all = anchorSizes.flatMap((sku) =>
      findBetterMatchAlerts(
        sku,
        dBaselineProvider as EqProvider,
        others,
        setupScopedVms,
        categoryRankingPool,
      ),
    );
    // Most severe (biggest gap) first; cap so the pane stays scannable.
    all.sort((a, b) => b.betterPct - b.shownPct - (a.betterPct - a.shownPct));
    return all.slice(0, 6);
  }, [compareByProvider, dPickedProviders, dBaselineProvider, setupScopedVms, categoryRankingPool]);

  // v2.41 — For the anchored base SIZE, rank each other cloud's same-category
  // sizes — so the insights pane can surface the closest analog AND its
  // runners-up (alternatives the single-closest read hides). Null when no base
  // size is anchored yet.
  const sizeRankingData = useMemo(() => {
    if (!baseline) return null;
    const others = (['Azure', 'AWS', 'GCP'] as const).filter(
      (p) => dPickedProviders.has(p) && p !== dBaselineProvider,
    ) as EqProvider[];
    if (others.length === 0) return null;
    return rankedSizesVsBase(
      setupScopedVms,
      dBaselineProvider as EqProvider,
      baseline,
      others,
      undefined,
      // S65 (Fix 2) — confidential rung-2 bridge pool (see rankedFamiliesVsBase).
      categoryRankingPool,
    );
  }, [baseline, dBaselineProvider, dPickedProviders, setupScopedVms, categoryRankingPool]);

  // Auto-clear a provider's region/SKU pick when its provider is unchecked
  // or when filters narrow its options to zero.
  useEffect(() => {
    setPickedRegionByProvider((prev) => {
      const next = { ...prev };
      for (const p of SUPPORTED_PROVIDERS) {
        if (!pickedProviders.has(p)) next[p] = null;
      }
      return next;
    });
    setPickedSkuByProvider((prev) => {
      const next = { ...prev };
      for (const p of SUPPORTED_PROVIDERS) {
        if (!pickedProviders.has(p)) next[p] = null;
      }
      return next;
    });
    setPickedFamilyByProvider((prev) => {
      const next = { ...prev };
      for (const p of SUPPORTED_PROVIDERS) {
        if (!pickedProviders.has(p)) next[p] = null;
      }
      return next;
    });
    setPickedCategoryByProvider((prev) => {
      const next = { ...prev };
      for (const p of SUPPORTED_PROVIDERS) {
        if (!pickedProviders.has(p)) next[p] = [];
      }
      return next;
    });
  }, [pickedProviders]);

  // v2.39 — Category is INDEPENDENT per cloud. The old auto-mirror effect (which
  // filled the other clouds' empty Category slots with the base's pick) is
  // removed: the user may compare different categories per cloud and reads the
  // equivalents table to gauge how similar AWS/GCP categories are. Nothing
  // populates a cloud's category except the user picking it.

  // Mirror Azure pick into UiState.competitiveBaseline so Insights' deep-
  // link continues to work (and we keep cross-page state).
  useEffect(() => {
    if (pickedSkuByProvider.Azure !== state.ui.competitiveBaseline) {
      setBaseline(pickedSkuByProvider.Azure ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedSkuByProvider.Azure]);

  // v2.17 — Reverse-sync: when Insights deep-links us in by setting
  // `state.ui.competitiveBaseline`, hydrate `pickedSkuByProvider` so the
  // dropdowns + the AWS/GCP auto-prefill cascade fire. Without this, the
  // baseline existed in UiState but the local pick map stayed empty.
  useEffect(() => {
    const baselineSku = state.ui.competitiveBaseline;
    if (!baselineSku) return;
    const baselineRow = userVmsArr.find((v) => v.vmSizeName === baselineSku);
    if (!baselineRow) return;
    const baselineProvider = (baselineRow.provider ?? 'Azure') as
      | 'Azure'
      | 'AWS'
      | 'GCP'
      | 'Custom';
    // Resolve the Azure parent (for AWS/GCP-keyed baselines) so we can
    // populate ALL THREE provider slots, not just the one the user clicked.
    let azureSku: string | null = null;
    if (baselineProvider === 'Azure') {
      azureSku = baselineSku;
    } else {
      azureSku = findAzureParent(baselineSku, userEquivalencyArr) ?? null;
    }
    if (!azureSku) return;
    const eq = userEquivalencyArr.find(
      (e) => (e.azureSku ?? '').toLowerCase() === azureSku!.toLowerCase(),
    );
    setPickedSkuByProvider((prev) => {
      const next = { ...prev };
      // Only fill empty slots — never overwrite a manual pick the user
      // already made on this page.
      if (!next.Azure) next.Azure = azureSku;
      if (!next.AWS && eq?.awsSku) next.AWS = eq.awsSku;
      if (!next.GCP && eq?.gcpSku) next.GCP = eq.gcpSku;
      // If the user clicked compare on an AWS or GCP SKU directly, make
      // sure THAT exact pick wins for its own provider slot.
      if (baselineProvider === 'AWS' && !prev.AWS) next.AWS = baselineSku;
      if (baselineProvider === 'GCP' && !prev.GCP) next.GCP = baselineSku;
      // No-op when nothing changed (avoids re-render churn).
      if (
        next.Azure === prev.Azure &&
        next.AWS === prev.AWS &&
        next.GCP === prev.GCP
      ) {
        return prev;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ui.competitiveBaseline, userVmsArr, userEquivalencyArr]);

  // v2.17.15 — Auto-suggest VM Size picks BIDIRECTIONALLY. Picking on any
  // cloud now fills empty SKU slots on the other clouds with the
  // equivalency-table analog (similar specs / processor class /
  // performance band per the seed in `src/data/equivalencySeed.ts`).
  // Previously only Azure → AWS+GCP fired; now AWS or GCP picks propagate
  // back to Azure and to the third cloud too. User picks always win —
  // empty-slots only.
  useEffect(() => {
    const azurePick = pickedSkuByProvider.Azure;
    const awsPick = pickedSkuByProvider.AWS;
    const gcpPick = pickedSkuByProvider.GCP;
    if (!azurePick && !awsPick && !gcpPick) return;
    // Find an equivalency row that matches ANY of the picks. The row gives
    // us the full Azure↔AWS↔GCP triplet so we can fill missing slots.
    const matchedRow = userEquivalencyArr.find((eq) => {
      const az = (eq.azureSku ?? '').toLowerCase();
      const aw = (eq.awsSku ?? '').toLowerCase();
      const gc = (eq.gcpSku ?? '').toLowerCase();
      return (
        (azurePick && az === azurePick.toLowerCase()) ||
        (awsPick && aw === awsPick.toLowerCase()) ||
        (gcpPick && gc === gcpPick.toLowerCase())
      );
    });
    setPickedSkuByProvider((prev) => {
      const next = { ...prev };
      let changed = false;
      // First: curated seed match (if any).
      if (matchedRow) {
        if (!next.Azure && matchedRow.azureSku && pickedProviders.has('Azure')) {
          next.Azure = matchedRow.azureSku;
          changed = true;
        }
        if (!next.AWS && matchedRow.awsSku && pickedProviders.has('AWS')) {
          next.AWS = matchedRow.awsSku;
          changed = true;
        }
        if (!next.GCP && matchedRow.gcpSku && pickedProviders.has('GCP')) {
          next.GCP = matchedRow.gcpSku;
          changed = true;
        }
      }
      // v2.17.16 — Spec-based fallback. For any provider slot still empty
      // after the seed pass, find the closest-spec match in the other
      // provider's catalog and auto-pick it. Ensures the user always
      // sees a 3-cloud comparison even when the curated table is sparse.
      const sourcePick =
        (azurePick && { provider: 'Azure' as const, sku: azurePick }) ||
        (awsPick && { provider: 'AWS' as const, sku: awsPick }) ||
        (gcpPick && { provider: 'GCP' as const, sku: gcpPick }) ||
        null;
      if (sourcePick) {
        const sourceRow = userVmsArr.find(
          (v) => v.vmSizeName === sourcePick.sku && (v.provider ?? '') === sourcePick.provider,
        );
        if (sourceRow) {
          for (const targetP of ['Azure', 'AWS', 'GCP'] as const) {
            if (targetP === sourcePick.provider) continue;
            if (!pickedProviders.has(targetP)) continue;
            if (next[targetP]) continue; // already filled
            const match = findClosestSpecMatch(sourceRow, targetP, userVmsArr);
            if (match) {
              next[targetP] = match.vmSizeName;
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedSkuByProvider.Azure, pickedSkuByProvider.AWS, pickedSkuByProvider.GCP, userEquivalencyArr, pickedProviders, userVmsArr]);

  // v2.17.12 — Auto-suggest regions across ALL providers (bidirectional).
  // When the user picks a region on ANY cloud, the other two clouds get
  // their twin regions auto-filled in slots that are still empty. Previously
  // only Azure → AWS/GCP fired; now AWS or GCP picks propagate too.
  useEffect(() => {
    // Determine the source provider (first one with a pick) — we propagate
    // OUT from its twins. If the user picks regions on multiple clouds
    // independently, each pick triggers this effect and fills empties only.
    let sourceProvider: 'Azure' | 'AWS' | 'GCP' | null = null;
    let sourceRegion: string | null = null;
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      if (pickedRegionByProvider[p]) {
        sourceProvider = p;
        sourceRegion = pickedRegionByProvider[p];
        break;
      }
    }
    if (!sourceProvider || !sourceRegion) return;
    const twinSet = regionTwinsFor(sourceProvider, sourceRegion);
    setPickedRegionByProvider((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of ['Azure', 'AWS', 'GCP'] as const) {
        if (p === sourceProvider) continue;
        if (!pickedProviders.has(p)) continue;
        if (next[p]) continue; // user picked something — leave alone
        const twin = twinSet[p];
        if (!twin) continue;
        if (regionsByProvider[p]?.includes(twin.region)) {
          next[p] = twin.region;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedRegionByProvider.Azure, pickedRegionByProvider.AWS, pickedRegionByProvider.GCP, pickedProviders, regionsByProvider]);

  // v2.17.12 — Family auto-suggest across providers. When the user picks a
  // family on one cloud, fill the other clouds' empty Family slots with the
  // equivalency-table's analog family (derived from SKU-level equivalencies).
  useEffect(() => {
    let sourceProvider: 'Azure' | 'AWS' | 'GCP' | null = null;
    let sourceFamily: string | null = null;
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      if (pickedFamilyByProvider[p]) {
        sourceProvider = p;
        sourceFamily = pickedFamilyByProvider[p];
        break;
      }
    }
    if (!sourceProvider || !sourceFamily) return;
    const key = `${sourceProvider.toLowerCase()}|${sourceFamily.toLowerCase()}`;
    const peers = equivalentFamiliesByFamily.get(key);
    if (!peers) return;
    setPickedFamilyByProvider((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of peers) {
        const [otherP, otherF] = k.split('|');
        const otherProv = otherP === 'azure' ? 'Azure' : otherP === 'aws' ? 'AWS' : otherP === 'gcp' ? 'GCP' : null;
        if (!otherProv || otherProv === sourceProvider) continue;
        if (!pickedProviders.has(otherProv)) continue;
        if (next[otherProv]) continue; // user already picked something
        // Resolve the canonical-cased family slug from the catalog.
        const canonical = familyOptionsByProvider[otherProv]?.find(
          (o) => o.value.toLowerCase() === otherF,
        )?.value;
        if (!canonical) continue;
        next[otherProv] = canonical;
        changed = true;
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedFamilyByProvider.Azure, pickedFamilyByProvider.AWS, pickedFamilyByProvider.GCP, pickedProviders, equivalentFamiliesByFamily, familyOptionsByProvider]);

  // ── Equivalents resolution ──────────────────────────────────────────
  // Equivalency rows are Azure-keyed. Two paths:
  //   1. Picked Azure SKU → forward lookup.
  //   2. Picked AWS/GCP SKU → find the Azure parent via reverse search,
  //      then forward-resolve from that Azure SKU so the user sees the
  //      same Azure↔AWS↔GCP triplet regardless of which side they picked.
  // PERF (v2.52.34) — Deferred anchor for the heavy `equivalents` chain. Mirrors
  // the urgent `baseline` derivation but off the deferred base + SKU picks so a
  // base-switch defers `findEquivalents`/`matchedEquivalents` instead of re-running
  // them on the urgent render. (SKU-add already coalesces via the deferred SKU map.)
  const dBaseline =
    dPickedSkuByProvider[dBaselineProvider] ||
    dPickedSkuByProvider.Azure ||
    dPickedSkuByProvider.AWS ||
    dPickedSkuByProvider.GCP ||
    state.ui.competitiveBaseline;

  const baselineForLookup = useMemo(() => {
    if (!dBaseline) return null;
    const pickedRow = dUserVmsArr.find((v) => v.vmSizeName === dBaseline);
    const pickedProvider = pickedRow?.provider ?? '';
    if (pickedProvider.toLowerCase() === 'azure') return dBaseline;
    // Reverse: find an Azure parent whose entry mentions this picked SKU.
    const parent = findAzureParent(dBaseline, userEquivalencyArr);
    return parent ?? dBaseline; // fall back to raw lookup if no parent
  }, [dBaseline, dUserVmsArr, userEquivalencyArr]);

  const equivalents = useMemo(() => {
    if (!baselineForLookup) return null;
    const base = findEquivalents(baselineForLookup, dUserVmsArr, userEquivalencyArr);
    if (!base.baseline) return base;
    // v2.41 — honor the user's EXPLICIT analog pick for the active comparison
    // row (the comparison table) so the verdict / KPIs / situational best-at /
    // cost reflect what they actually chose — not the engine's auto-closest
    // analog. When they haven't picked an analog for a cloud, keep the default.
    const honor = (
      provider: 'AWS' | 'GCP',
      rows: typeof base.rows.aws,
    ): typeof base.rows.aws => {
      if (provider === dBaselineProvider) return rows;
      const pick = dPickedSkuByProvider[provider];
      if (!pick || rows[0]?.sku === pick) return rows;
      const catalogRow =
        dUserVmsArr.find((v) => (v.provider ?? '') === provider && v.vmSizeName === pick) ?? null;
      if (!catalogRow) return rows;
      return [
        { provider, sku: pick, catalogRow, inferred: true },
        ...rows.filter((r) => r.sku !== pick),
      ];
    };
    return {
      baseline: base.baseline,
      rows: {
        aws: honor('AWS', base.rows.aws),
        gcp: honor('GCP', base.rows.gcp),
        notes: base.rows.notes,
      },
    };
  }, [baselineForLookup, dUserVmsArr, userEquivalencyArr, dPickedSkuByProvider, dBaselineProvider]);

  // v2.52.32/.33 — Region-matched equivalents. `equivalents` resolves each cloud
  // to its SKU's FIRST catalog region (alphabetically ~ af-south-1), so pricing an
  // Azure base in Australia Central against AWS "af-south-1" both implies a false
  // apples-to-apples peer AND disagrees with the per-cloud cost estimate (which
  // region-matches). We swap each AWS/GCP `catalogRow` to the base-region-matched
  // region's row (same country, else ≤ REGION_MATCH_KM) so BOTH the rate bars and
  // the cross-cloud cost matrix (`horizons`) price at the base-comparable region.
  // `regionComparable` records whether a real peer existed, for the bar callout.
  const { matchedEquivalents, regionComparableByProvider } = useMemo(() => {
    const comparable: Record<string, boolean> = {};
    if (!equivalents || !equivalents.baseline) return { matchedEquivalents: equivalents, regionComparableByProvider: comparable };
    const baseRegion = equivalents.baseline.region ?? '';
    if (!baseRegion) return { matchedEquivalents: equivalents, regionComparableByProvider: comparable };
    const baseRef = regionRefs(dBaselineProvider, [baseRegion])[0] ?? null;
    const baseVm = equivalents.baseline;
    // Attach comparability caveats (A3) for each analog vs the base, so the
    // Specs caveats note, the exec verdict and any cell can render the honest
    // asterisk. Preserved through the region swap below (the spread keeps them).
    const withCaveats = (m: EquivalentMatch): EquivalentMatch => {
      if (!m.catalogRow || !baseVm || m.caveats) return m;
      const caveats = matchCaveats(baseVm, m.catalogRow, {
        distance: vmDistance(vmFeatures(baseVm), vmFeatures(m.catalogRow)),
      });
      if (!caveats.length) return m;
      return { ...m, caveats, stretch: isStretch(caveats) };
    };
    const remap = (
      provider: 'AWS' | 'GCP',
      rows: typeof equivalents.rows.aws,
    ): typeof equivalents.rows.aws =>
      rows.map((raw, i) => {
        const m = withCaveats(raw);
        if (!m.catalogRow) return m;
        const avail = comparableRegionsFor(dUserVmsArr, provider, m.catalogRow.vmSizeName);
        const match = baseRef ? bestRegionMatch(baseRef, regionRefs(provider, avail)) : null;
        const isComparable = !!match && (match.sameCountry || match.distanceKm <= REGION_BAR_MATCH_KM);
        // Only the PRIMARY (first) row per cloud drives the bar callout flag.
        if (i === 0) comparable[provider] = isComparable;
        if (isComparable && match!.region !== m.catalogRow.region) {
          const row = dUserVmsArr.find(
            (v) => (v.provider ?? '') === provider && v.vmSizeName === m.catalogRow!.vmSizeName && v.region === match!.region,
          );
          // Preserve caveats/stretch across the region swap (spread carries them).
          if (row) return { ...m, catalogRow: row };
        }
        return m;
      });
    return {
      matchedEquivalents: {
        ...equivalents,
        rows: {
          aws: remap('AWS', equivalents.rows.aws),
          gcp: remap('GCP', equivalents.rows.gcp),
          notes: equivalents.rows.notes,
        },
      },
      regionComparableByProvider: comparable,
    };
  }, [equivalents, dUserVmsArr, dBaselineProvider]);

  const bars = useMemo(() => {
    const raw = matchedEquivalents ? priceCompare(matchedEquivalents) : [];
    const baseRegion = matchedEquivalents?.baseline?.region ?? '';
    return raw.map((bar) =>
      bar.provider === dBaselineProvider
        ? { ...bar, baseRegion, regionComparable: true }
        : { ...bar, baseRegion, regionComparable: regionComparableByProvider[bar.provider] ?? true },
    );
  }, [matchedEquivalents, regionComparableByProvider, dBaselineProvider]);

  const awsPrimary =
    equivalents?.rows.aws.find((m) => m.catalogRow !== null) ??
    equivalents?.rows.aws[0] ??
    null;
  const gcpPrimary =
    equivalents?.rows.gcp.find((m) => m.catalogRow !== null) ??
    equivalents?.rows.gcp[0] ??
    null;

  const awsDeltas = useMemo(
    () =>
      equivalents?.baseline && awsPrimary?.catalogRow
        ? specDeltas(equivalents.baseline, awsPrimary.catalogRow, 'AWS')
        : [],
    [equivalents, awsPrimary],
  );
  const gcpDeltas = useMemo(
    () =>
      equivalents?.baseline && gcpPrimary?.catalogRow
        ? specDeltas(equivalents.baseline, gcpPrimary.catalogRow, 'GCP')
        : [],
    [equivalents, gcpPrimary],
  );

  // v2.14 (Phase H) — Winner analysis + time-horizon costs.
  const analysis = useMemo(
    () => (equivalents ? winnerAnalysis(equivalents) : null),
    [equivalents],
  );
  // The cross-cloud cost MATRIX prices at the SAME region-matched rows as the
  // rate bars (matchedEquivalents), so it agrees with the per-cloud cost estimate
  // instead of pricing AWS/GCP at their alphabetically-first region (af-south-1).
  const horizons = useMemo(
    () => (matchedEquivalents ? timeHorizonCosts(matchedEquivalents, pricingTerm) : []),
    [matchedEquivalents, pricingTerm],
  );

  // Unit-normalized $/vCPU/mo + $/GiB/mo per cloud for the NormalizedRateTable.
  // A3 — the real engine selector `normalizedRates` (same term selection + PAYG
  // fallback + $/unit division as the rest of Pricing). It returns per-HOUR unit
  // rates on the SAME region-matched rows as the bars/horizons, so we lift them
  // to $/month (× 730) for the table's shape. matchPct is carried from the
  // winning analog's caveat-bearing match.
  const inlineNormalizedRows = useMemo<NormalizedRow[]>(() => {
    if (!matchedEquivalents) return [];
    const HOURS_PER_MONTH = 730;
    const perMo = (v: number | null) => (v != null ? v * HOURS_PER_MONTH : null);
    const rates = normalizedRates(matchedEquivalents, pricingTerm);
    // S66-FIX-C — carry the WINNING analog's real match % (same first-hit row
    // normalizedRates prices, scored through the ONE pctVsBase kernel). The old
    // code hardcoded null here, so the Match column showed "—" for a picked
    // 93% analog.
    const analogPctFor = (provider: string): number | null => {
      const matches =
        provider === 'AWS'
          ? matchedEquivalents.rows.aws
          : provider === 'GCP'
            ? matchedEquivalents.rows.gcp
            : null;
      const m = matches?.find((x) => x.catalogRow !== null);
      return m?.catalogRow ? pctVsBase(matchedEquivalents.baseline, m.catalogRow) : null;
    };
    return rates
      .filter((r) => r.usdPerVcpuHr != null || r.usdPerGibHr != null || r.sku !== '')
      .map<NormalizedRow>((r) => ({
        provider: r.provider,
        sku: r.sku,
        usdPerVcpuMo: perMo(r.usdPerVcpuHr),
        usdPerGibMo: perMo(r.usdPerGibHr),
        matchPct: r.provider === baselineProvider ? 100 : analogPctFor(r.provider),
      }));
  }, [matchedEquivalents, pricingTerm, baselineProvider]);

  // A3 — Per-provider comparability caveats for the analogs in the active
  // comparison, vs the base VM. Drives the Specs "Comparison caveats" note, the
  // exec verdict stretch line, and gates the normalized-rate fallback table.
  const caveatsByProvider = useMemo<Partial<Record<string, MatchCaveat[]>>>(() => {
    const out: Partial<Record<string, MatchCaveat[]>> = {};
    const baseVm = matchedEquivalents?.baseline ?? equivalents?.baseline ?? null;
    if (!baseVm) return out;
    const src = matchedEquivalents ?? equivalents;
    if (!src) return out;
    const collect = (matches: EquivalentMatch[] | undefined) => {
      const m = matches?.find((x) => x.catalogRow !== null);
      if (!m?.catalogRow) return;
      const caveats =
        m.caveats ??
        matchCaveats(baseVm, m.catalogRow, {
          distance: vmDistance(vmFeatures(baseVm), vmFeatures(m.catalogRow)),
        });
      if (caveats.length) out[m.provider] = caveats;
    };
    collect(src.rows.aws);
    collect(src.rows.gcp);
    return out;
  }, [matchedEquivalents, equivalents]);

  // The normalized-rate table clutters a clean, apples-to-apples comparison, so
  // it's only worth showing when the SHAPES don't line up — any contender is a
  // stretch or carries a category-fallback caveat (bars / horizons / analogs).
  const showNormalizedFallback = useMemo(() => {
    const hasCat = (cs?: MatchCaveat[]) =>
      !!cs && cs.some((c) => c.kind === 'category-fallback' || c.kind === 'stretch-size');
    const barStretch = bars.some((b) => b.stretch || hasCat(b.caveats));
    const horizonStretch = horizons.some((h) => h.stretch || hasCat(h.caveats));
    const analogStretch = Object.values(caveatsByProvider).some(
      (cs) => isStretch(cs ?? []) || hasCat(cs),
    );
    return barStretch || horizonStretch || analogStretch;
  }, [bars, horizons, caveatsByProvider]);

  // ── v2.13 — Map marks for the region availability visualization.
  // Includes the baseline SKU + the AWS/GCP equivalents, filtered to the
  // user's active provider scope so the map respects their filter pick.
  // v2.15 — Map marks use the per-provider region picks. When a provider
  // has a region picked, show ONLY that region's dot. When no region is
  // picked for that provider, show all regions where that provider's
  // active SKU is available.
  const mapMarks: MapMark[] = useMemo(() => {
    const out: MapMark[] = [];
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      if (!pickedProviders.has(p)) continue;
      const pickedReg = pickedRegionByProvider[p];
      const pickedSku = pickedSkuByProvider[p];
      if (pickedReg) {
        // One region pinned — emit that single dot.
        out.push({ provider: p, region: pickedReg });
        continue;
      }
      // No region pinned: show every region that hosts the picked SKU
      // (or, if no SKU pinned either, every region the user has data for).
      const seen = new Set<string>();
      for (const v of userVmsArr) {
        if ((v.provider ?? 'Custom') !== p) continue;
        if (pickedSku && v.vmSizeName !== pickedSku) continue;
        if (!v.region) continue;
        if (seen.has(v.region)) continue;
        seen.add(v.region);
        out.push({ provider: p, region: v.region });
      }
    }
    return out;
  }, [userVmsArr, pickedProviders, pickedRegionByProvider, pickedSkuByProvider]);

  // ────────────────────────────────────────────────────────────────────
  // v2.29 — Each sub-page's content is computed here as a JSX block, then
  // routed below by `competitiveTab`. Nothing is removed — the same tables,
  // dropdowns, charts, verdict and template buttons that lived in the one
  // long scroll are reorganized into focused pages. Filter state is shared
  // (it lives in this component) so switching pages never resets a pick.
  // ────────────────────────────────────────────────────────────────────

  // v2.35 — Unified per-cloud chip filter (replaces the 5-box cascade).
  //
  // (a) ACTIVE CHIPS — every current pick, derived from the same five state
  //     slices the old dropdowns wrote. Each chip clears exactly that pick.
  const PROVIDER_DIMS: { dim: FilterDim; label: string }[] = [
    { dim: 'region', label: 'Region' },
    { dim: 'category', label: 'Category' },
    { dim: 'family', label: 'Family' },
    { dim: 'size', label: 'VM' },
  ];
  type FilterChipRow = {
    key: string;
    cloud: ProviderKey;
    dimLabel: string;
    value: string;
    onClear: () => void;
  };
  // PERF (v2.52.1) — These two arrays feed the heavy `CrossCloudEquivalencyPanel`
  // (its O(size²) `buildEquivalencyRows` memo keys on `activeProviders`). Rebuilt
  // inline they were a FRESH array every render, so that memo busted on every
  // re-render (incl. a no-op objective/clouds toggle) and re-ran the ~1s ranking.
  // Memoize them on their real inputs so the panel's memo stays cached.
  const activeClouds = useMemo(
    () => (['Azure', 'AWS', 'GCP'] as ProviderKey[]).filter((p) => pickedProviders.has(p)),
    [pickedProviders],
  );
  // v2.39 — Display order with the BASE cloud always first (leftmost), then the
  // rest in canonical order. Every per-cloud column (filter stepper + the
  // equivalents table) renders in this order so the basis is on the far left.
  const orderedClouds: ProviderKey[] = useMemo(
    () => [
      ...(activeClouds.includes(baselineProvider) ? [baselineProvider] : []),
      ...activeClouds.filter((p) => p !== baselineProvider),
    ],
    [activeClouds, baselineProvider],
  );
  // S65 (Fix 1) — the EXPLICIT region pick per provider, fed to the equivalents
  // panel so `buildEquivalencyRows` scopes its ladder fallback pool to the picked
  // region (never inferring it from the scoped catalog). A picked region → `[reg]`;
  // no pick → null (no region restriction). Derived from the DEFERRED region map so
  // it stays aligned with `setupScopedVms` (also deferred), never mixing an urgent
  // region with a deferred scope. Keyed on the deferred map's serialization.
  const equivRegionScope = useMemo(() => {
    const out: Partial<Record<'Azure' | 'AWS' | 'GCP', string[] | null>> = {};
    for (const p of ['Azure', 'AWS', 'GCP'] as const) {
      const reg = dPickedRegionByProvider[p];
      out[p] = reg ? [reg] : null;
    }
    return out;
  }, [dPickedRegionByProvider.Azure, dPickedRegionByProvider.AWS, dPickedRegionByProvider.GCP]);
  const activeChips: FilterChipRow[] = [];
  for (const p of activeClouds) {
    const reg = pickedRegionByProvider[p];
    if (reg)
      activeChips.push({
        key: `${p}-region`,
        cloud: p,
        dimLabel: 'Region',
        value: reg,
        onClear: () =>
          setPickedRegionByProvider((prev) => ({ ...prev, [p]: null })),
      });
    for (const cat of pickedCategoryByProvider[p] ?? []) {
      activeChips.push({
        key: `${p}-category-${cat}`,
        cloud: p,
        dimLabel: 'Category',
        value: cat,
        onClear: () => removeCategory(p, cat),
      });
    }
    const fam = pickedFamilyByProvider[p];
    if (fam)
      activeChips.push({
        key: `${p}-family`,
        cloud: p,
        dimLabel: 'Family',
        value: fam,
        onClear: () =>
          setPickedFamilyByProvider((prev) => ({ ...prev, [p]: null })),
      });
    if (p === baselineProvider) {
      // v2.36 — base-cloud VM chips are the multi-compare LIST: one chip per
      // entry, each removable (splices it out of compareSkus).
      for (const sku of compareSkus) {
        activeChips.push({
          key: `${p}-size-${sku}`,
          cloud: p,
          dimLabel: 'VM',
          value: sku,
          onClear: () => setCompareSkus((prev) => prev.filter((s) => s !== sku)),
        });
      }
    } else {
      const sku = pickedSkuByProvider[p];
      if (sku)
        activeChips.push({
          key: `${p}-size`,
          cloud: p,
          dimLabel: 'VM',
          value: sku,
          onClear: () =>
            setPickedSkuByProvider((prev) => ({ ...prev, [p]: null })),
        });
    }
  }

  // (b) ADD-CONTROL value options — for the chosen dimension + cloud, reuse the
  //     exact per-provider option array the old dropdowns fed, wrapped with
  //     `withDimMatch` so the ≈% apples-to-apples hint still shows on non-base
  //     clouds. Returns [] for the provider dimension (handled separately).
  const addValueOptions: DropdownOption[] = (() => {
    if (!addDim || addDim === 'provider') return [];
    const p = addCloud;
    if (addDim === 'region')
      return withDimMatch(
        regionOptionsByProvider[p] ?? [],
        p === baselineProvider ? undefined : dimMatch.region[p],
        !!pickedRegionByProvider[baselineProvider],
      );
    if (addDim === 'category')
      return withDimMatch(
        (categoryOptionsByProvider[p] ?? []).filter(
          (o) => !(pickedCategoryByProvider[p] ?? []).includes(o.value as VmCategory),
        ),
        p === baselineProvider ? undefined : categoryMatchByProvider[p],
        (pickedCategoryByProvider[baselineProvider]?.length ?? 0) > 0,
      );
    if (addDim === 'family') {
      const suggested = suggestedFamilyByProvider[p];
      return withDimMatch(
        (familyOptionsByProvider[p] ?? []).map((o) => {
          const isSuggested = suggested?.has(o.value);
          return {
            ...o,
            label: isSuggested ? `▶ ${o.label}` : o.label,
            meta: isSuggested ? `Suggested · ${o.meta ?? ''}` : o.meta,
          };
        }),
        p === baselineProvider ? undefined : familyMatchByProvider[p],
        !!pickedFamilyByProvider[baselineProvider],
      );
    }
    // size
    const baseOptions =
      p === 'Azure' ? groupedAzureOptions : skuOptionsByProvider[p] ?? [];
    const suggested = suggestedSkuByProvider[p];
    return withDimMatch(
      baseOptions.map((o) => {
        const isSuggested = suggested?.has(o.value);
        const others = equivalentsBySku.get(o.value.toLowerCase());
        const prefix =
          others && others.size > 0 ? (
            <span
              className="flex items-center gap-0.5 mr-1.5"
              title={`Has analog in: ${Array.from(others).join(', ')}`}
            >
              {Array.from(others).map((op) => (
                <span
                  key={op}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: equivDotColor(op),
                    display: 'inline-block',
                    boxShadow: `0 0 4px ${equivDotColor(op)}`,
                  }}
                />
              ))}
            </span>
          ) : undefined;
        return {
          ...o,
          label: isSuggested ? `▶ ${o.label}` : o.label,
          meta: isSuggested ? `Suggested · ${o.meta ?? ''}` : o.meta,
          prefix,
        };
      }),
      p === baselineProvider ? undefined : dimMatch.size[p],
      !!pickedSkuByProvider[baselineProvider],
    );
  })();

  // (c) Commit a value pick. Writes the SAME setter the old dropdown did, so
  //     every downstream consumer is unchanged. Category sets ALL active clouds
  //     (canonical / auto-mirror) and clears their family pick, matching the
  //     prior behaviour. After a write, collapse the add-control.
  const commitAddValue = (value: string) => {
    if (!addDim || addDim === 'provider' || !value) return;
    const p = addCloud;
    if (addDim === 'region') {
      setPickedRegionByProvider((prev) => ({ ...prev, [p]: value }));
    } else if (addDim === 'category') {
      // v2.44 — category is now MULTI-select per cloud: append to THIS cloud only
      // (no auto-mirror), mirroring VM family. `addCategory` dedups + clears the
      // cloud's family multi-select (families depend on the category).
      addCategory(p, value);
    } else if (addDim === 'family') {
      setPickedFamilyByProvider((prev) => ({ ...prev, [p]: value }));
    } else if (addDim === 'size') {
      if (p === baselineProvider) {
        // v2.36 — base-cloud size APPENDS to the multi-compare list (dedup).
        setCompareSkus((prev) => (prev.includes(value) ? prev : [...prev, value]));
      } else {
        setPickedSkuByProvider((prev) => ({ ...prev, [p]: value }));
      }
    }
    setAddDim(null);
  };

  // (d) Clear-all — reset every per-cloud pick to null. Active clouds stay
  //     (the provider chips remain) so the user keeps their comparison set.
  const clearAllPicks = () => {
    const reset: Record<string, string | null> = {
      Azure: null,
      AWS: null,
      GCP: null,
      Custom: null,
    };
    setPickedRegionByProvider({ ...reset });
    setPickedCategoryByProvider({ Azure: [], AWS: [], GCP: [], Custom: [] });
    setPickedFamilyByProvider({ ...reset });
    setPickedSkuByProvider({ ...reset });
    setCompareSkus([]);
    setAddDim(null);
  };

  const hasAnyPick = activeChips.length > 0;

  // The unified per-cloud chip filter — one compact card replacing the old
  // five stacked dropdown cards. Active picks render as removable, cloud-tinted
  // chips; "+ Add filter" supports ANY dimension on ANY active cloud in ANY
  // order. Every write hits the same `pickedX` setters the old dropdowns did.
  // v2.37 — Setup STEPPER. One dimension per collapsing step, each rendered as
  // per-cloud columns with the base cloud highlighted and the other clouds
  // showing a light ≈% match. Modeled on the Server Builder's StepCard: Next →
  // collapses the step to a summary line and opens the next, so the box stays
  // compact. v2.44 — the Clouds & basis selection is now step 1 of this stepper.
  const STEP_ORDER: Exclude<FilterStep, 'done'>[] = [
    'objective',
    'clouds',
    'category',
    'family',
  ];
  const STEP_META: Record<
    Exclude<FilterStep, 'done'>,
    { n: number; title: string; hint: string }
  > = {
    objective: {
      n: 1,
      title: 'Objective',
      hint: 'What are you comparing? VM sizes apples-to-apples, or product offerings (categories / families) across competitors.',
    },
    clouds: {
      n: 2,
      title: 'Clouds & basis',
      hint: 'Pick 1 cloud to deep-dive, or 2–3 to compare, then choose the base — the leftmost column every ≈% match is measured against.',
    },
    category: {
      n: 3,
      title: 'Category',
      hint: isProducts
        ? 'Pick ONE category per cloud. Stop here to compare categories across clouds, or continue to VM family.'
        : 'Pick a category per cloud — independently. Compare like-for-like, or different categories; the table below shows how similar AWS/GCP categories are. Leave any cloud on "Any".',
    },
    family: {
      n: 4,
      title: 'VM family',
      hint: isProducts
        ? 'Pick ONE family per cloud to compare families head-to-head. The other clouds show a ≈% spec match to the base family.'
        : 'Pick a family per cloud. The other clouds show a ≈% spec match to the base family.',
    },
  };
  const nextOf = (s: Exclude<FilterStep, 'done'>): FilterStep => {
    const i = STEP_ORDER.indexOf(s);
    return i < 0 || i >= STEP_ORDER.length - 1 ? 'done' : STEP_ORDER[i + 1];
  };

  // v2.44 — Category is MULTI-select + INDEPENDENT per cloud (no auto-mirror):
  // the user can compare e.g. AWS Memory-Optimized AND Compute-Optimized against
  // an Azure General-Purpose base. Adding/removing a category clears that cloud's
  // family multi-select (families depend on the category set).
  const addCategory = (p: ProviderKey, cat: string) => {
    if (!cat) return;
    // v2.46 — products mode is SINGLE-select: picking a category REPLACES the
    // cloud's pick (you compare ONE category per cloud). Sizes mode appends.
    setPickedCategoryByProvider((prev) =>
      prev[p]?.includes(cat as VmCategory)
        ? prev
        : {
            ...prev,
            [p]: isProducts
              ? [cat as VmCategory]
              : [...(prev[p] ?? []), cat as VmCategory],
          },
    );
    setPickedFamiliesByProvider((prev) => ({ ...prev, [p]: [] }));
  };
  const removeCategory = (p: ProviderKey, cat: string) => {
    setPickedCategoryByProvider((prev) => ({
      ...prev,
      [p]: (prev[p] ?? []).filter((c) => c !== cat),
    }));
    setPickedFamiliesByProvider((prev) => ({ ...prev, [p]: [] }));
  };
  const addFamily = (p: ProviderKey, fam: string) => {
    if (!fam) return;
    // v2.46 — products mode is SINGLE-select: one family per cloud.
    setPickedFamiliesByProvider((prev) =>
      prev[p]?.includes(fam)
        ? prev
        : { ...prev, [p]: isProducts ? [fam] : [...(prev[p] ?? []), fam] },
    );
  };
  const removeFamily = (p: ProviderKey, fam: string) => {
    setPickedFamiliesByProvider((prev) => ({
      ...prev,
      [p]: (prev[p] ?? []).filter((f) => f !== fam),
    }));
  };

  const clearDim = (dim: Exclude<FilterStep, 'done'>) => {
    // Objective + Clouds & basis can't be "cleared" (there's always a mode + ≥1
    // active cloud) — Skip just advances with the current selection.
    if (dim === 'clouds' || dim === 'objective') return;
    if (dim === 'category')
      setPickedCategoryByProvider({ Azure: [], AWS: [], GCP: [], Custom: [] });
    else setPickedFamiliesByProvider({ Azure: [], AWS: [], GCP: [], Custom: [] });
  };

  const dimComplete = (dim: Exclude<FilterStep, 'done'>): boolean => {
    // Objective + clouds always have a valid selection (a mode is always set;
    // there's always ≥1 cloud + a base).
    if (dim === 'objective' || dim === 'clouds') return true;
    return activeClouds.some((p) =>
      dim === 'category'
        ? (pickedCategoryByProvider[p]?.length ?? 0) > 0
        : (pickedFamiliesByProvider[p]?.length ?? 0) > 0,
    );
  };

  const stepSummary = (dim: Exclude<FilterStep, 'done'>): string => {
    if (dim === 'objective')
      return isProducts ? 'Compare product offerings' : 'Compare VM sizes';
    if (dim === 'clouds')
      return orderedClouds
        .map((p) => (p === baselineProvider ? `${p} (base)` : p))
        .join(' · ');
    const picks = orderedClouds
      .map((p) => {
        if (dim === 'category') {
          const cats = pickedCategoryByProvider[p] ?? [];
          return cats.length ? `${p} ${cats.join('/')}` : null;
        }
        const fams = pickedFamiliesByProvider[p] ?? [];
        return fams.length ? `${p} ${fams.join('/')}` : null;
      })
      .filter(Boolean) as string[];
    return picks.length ? picks.join(' · ') : dim === 'category' ? 'Any category' : 'Any family';
  };

  // S66-FIX-C — the private `simTone` (muted grey <65) is deleted: two surfaces
  // showing the same match % must agree on tone, so the filter chips read the
  // SAME shared `pctTone` traffic scale (green ≥85 / amber ≥65 / red) as every
  // other match pill on the page.

  // Per-cloud columns for a dimension — base FIRST (leftmost) + highlighted,
  // others carry a light ≈% match. Category = single deselectable dropdown;
  // VM family = multi-select chips + an "+ Add family" picker.
  const cloudColumns = (dim: Exclude<FilterStep, 'done'>) => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, orderedClouds.length)}, minmax(0, 1fr))`,
        gap: 8,
      }}
    >
      {orderedClouds.map((p) => {
        const isBase = p === baselineProvider;
        const tone = providerTone(p as VmProvider);
        const fams = pickedFamiliesByProvider[p] ?? [];
        const familyOpts = withDimMatch(
          (familyOptionsByProvider[p] ?? []).filter((o) => !fams.includes(o.value)),
          isBase ? undefined : familyMatchByProvider[p],
          !!pickedFamilyByProvider[baselineProvider],
        );
        const cats = pickedCategoryByProvider[p] ?? [];
        const categoryOpts = withDimMatch(
          (categoryOptionsByProvider[p] ?? []).filter(
            (o) => !cats.includes(o.value as VmCategory),
          ),
          isBase ? undefined : categoryMatchByProvider[p],
          (pickedCategoryByProvider[baselineProvider]?.length ?? 0) > 0,
        );
        // v2.44 — when Best match is ON, the OTHER clouds are auto-managed: their
        // category/family is locked to the closest analog (no manual edit), so the
        // user can't recreate a worse pick. The base column stays editable.
        const locked = !isBase && bestMatchAuto;
        const lockedVals = dim === 'category' ? cats : fams;
        return (
          <div
            key={p}
            style={{
              border: `1px solid ${isBase ? tone.border : 'var(--border)'}`,
              background: isBase ? tone.bg : 'transparent',
              borderRadius: 'var(--radius-md)',
              padding: 8,
              minWidth: 0,
            }}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span
                className="text-[10px] font-semibold truncate"
                style={{ color: isBase ? tone.fg : 'var(--text-secondary)' }}
              >
                {p}
              </span>
              {isBase && (
                <span
                  className="text-[8px] font-semibold tracking-[0.05em] px-1.5 py-0.5 shrink-0"
                  style={{ color: tone.fg, background: 'rgba(255,255,255,0.07)', borderRadius: 999 }}
                >
                  BASE
                </span>
              )}
            </div>
            {locked ? (
              <div className="space-y-1">
                {lockedVals.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {lockedVals.map((val) => {
                        // Per-value match %: each auto-picked analog carries its OWN
                        // genuine size-level % (one per base family/category), not a
                        // single cloud-wide aggregate shared across every chip.
                        const picks = bestMatchPicksByProvider[p] ?? [];
                        const pk =
                          dim === 'category'
                            ? picks.find((x) => x.category === val)
                            : picks.find((x) => x.family === val);
                        const pct = pk?.pct ?? null;
                        // S65 (Bug 3) — when the auto-picked analog is a genuine
                        // STRETCH (no same-category peer for this cloud in scope, so
                        // the closest match crosses categories at a low %), flag it
                        // amber with a caveat tooltip instead of a bare "≈31%" that
                        // reads apples-to-apples. `matchCaveats` decides via
                        // `matchCategory`, so a clean 90%+ highmem hit stays unflagged.
                        const stretch = !!pk?.stretch;
                        const caveatText = (pk?.caveats ?? [])
                          .map((c) => c.label)
                          .filter(Boolean)
                          .join(' · ');
                        return (
                          <span
                            key={val}
                            className="inline-flex items-center gap-x-1.5 px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: stretch ? 'rgba(251,191,36,0.12)' : `${tone.fg}14`,
                              border: `1px solid ${stretch ? 'rgba(251,191,36,0.55)' : `${tone.fg}55`}`,
                              borderRadius: 'var(--radius-pill)',
                              color: 'var(--text-primary)',
                            }}
                            title={`Best match — auto-selected${pct != null ? ` · ≈${pct}%` : ''}${
                              stretch ? ` · stretch: ${caveatText || 'closest analog only'}` : ''
                            }`}
                          >
                            {stretch && (
                              <span style={{ color: '#FBBF24', fontSize: 9 }} title="Stretch match — see tooltip">
                                ⚠
                              </span>
                            )}
                            {val}
                            {pct != null && (
                              <span className="tabular-nums" style={{ color: pctTone(pct), fontSize: 9 }}>
                                ≈{pct}%
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <div
                      className="text-[8.5px] tracking-[0.05em] uppercase font-semibold"
                      style={{ color: 'var(--interactive)' }}
                    >
                      ✓ Best match · auto
                    </div>
                  </>
                ) : (
                  // No base selection yet → no auto-fill (don't show a phantom match).
                  <span className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                    {`Pick a base ${dim === 'category' ? 'category' : 'family'} first`}
                  </span>
                )}
              </div>
            ) : dim === 'category' ? (
              <div className="space-y-1.5">
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-x-1.5 px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `${tone.fg}14`,
                          border: `1px solid ${tone.fg}55`,
                          borderRadius: 'var(--radius-pill)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => removeCategory(p, cat)}
                          className="leading-none opacity-70 hover:opacity-100"
                          style={{ color: tone.fg }}
                          aria-label={`Remove ${cat}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <GlassDropdown
                  value=""
                  options={categoryOpts}
                  onChange={(v) => addCategory(p, v)}
                  placeholder={
                    categoryOpts.length === 0
                      ? cats.length
                        ? 'All categories added'
                        : `No ${p} categories`
                      : '+ Add category…'
                  }
                  searchable
                  visibleRows={6}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                {fams.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {fams.map((fam) => {
                      // v2.41 — the chip ≈% reads the SAME family-similarity map
                      // as the dropdown options + the equivalents table, so the
                      // three never disagree (best-member vs the base family).
                      const pct = !isBase ? familyMatchByProvider[p]?.[fam] ?? null : null;
                      return (
                        <span
                          key={fam}
                          className="inline-flex items-center gap-x-1.5 px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            background: `${tone.fg}14`,
                            border: `1px solid ${tone.fg}55`,
                            borderRadius: 'var(--radius-pill)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {fam}
                          {pct != null && (
                            <span
                              className="tabular-nums"
                              style={{ color: pctTone(pct), fontSize: 9 }}
                            >
                              ≈{pct}%
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFamily(p, fam)}
                            className="leading-none opacity-70 hover:opacity-100"
                            style={{ color: tone.fg }}
                            aria-label={`Remove ${fam}`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <GlassDropdown
                  value=""
                  options={familyOpts}
                  onChange={(v) => addFamily(p, v)}
                  placeholder={
                    familyOpts.length === 0
                      ? fams.length
                        ? 'All families added'
                        : `No ${p} families`
                      : '+ Add family…'
                  }
                  searchable
                  visibleRows={6}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const anyFilterPick = dimComplete('category') || dimComplete('family');
  // Advance to the next step; finishing the last one collapses both setup
  // sections so the equivalents table gets the screen real estate.
  const advanceStep = (dim: Exclude<FilterStep, 'done'>) => {
    const nx = nextOf(dim);
    setFilterStep(nx);
    if (nx === 'done') collapseSetup();
  };
  const filterSummary = (() => {
    // Lead with the objective + clouds & basis (always set), then any
    // category / family picks.
    const parts: string[] = [stepSummary('objective'), stepSummary('clouds')];
    if (dimComplete('category')) parts.push(stepSummary('category'));
    if (dimComplete('family')) parts.push(stepSummary('family'));
    return parts.join(' · ');
  })();

  // v2.46 — step 1 body: the OBJECTIVE selector. Two cards the user picks
  // between: an apples-to-apples VM-size comparison, or a product-offering
  // comparison (categories / families across competitors). The choice gates the
  // downstream surface (single vs multi select; whether the VM Size table +
  // Selected-VM specs render).
  const OBJECTIVE_OPTS: {
    key: CompareObjective;
    title: string;
    blurb: string;
  }[] = [
    {
      key: 'sizes',
      title: 'Compare VM sizes',
      blurb: 'Apples-to-apples: pick specific VM sizes and compare specs, pricing & cross-cloud equivalents side-by-side.',
    },
    {
      key: 'products',
      title: 'Compare product offerings',
      blurb: 'How do the clouds’ offerings differ? Compare a category (e.g. Memory-Optimized) or a VM family head-to-head — no individual sizes.',
    },
  ];
  const objectiveStepBody = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {OBJECTIVE_OPTS.map((o) => {
        const on = compareObjective === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setCompareObjective(o.key)}
            aria-pressed={on}
            className="text-left p-3 transition-colors"
            style={{
              border: `1px solid ${on ? 'var(--interactive)' : 'var(--border)'}`,
              background: on ? 'rgba(129,140,248,0.08)' : 'transparent',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  border: `2px solid ${on ? 'var(--interactive)' : 'var(--border)'}`,
                  background: on
                    ? 'radial-gradient(circle, var(--interactive) 0 40%, transparent 45%)'
                    : 'transparent',
                  flexShrink: 0,
                }}
              />
              <span
                className="text-[12px] font-semibold"
                style={{ color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {o.title}
              </span>
            </div>
            <p className="text-[10.5px] leading-snug" style={{ color: 'var(--text-muted)' }}>
              {o.blurb}
            </p>
          </button>
        );
      })}
    </div>
  );

  // v2.44 — step 2 body: the Clouds & basis selector (provider multi-select +
  // base segmented), lifted out of the old ① section so it renders inside the
  // setup stepper like every other step.
  const cloudsStepBody = (
    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
      {/* Compare — provider multi-select (1–3). One cloud = deep-dive. */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] tracking-[0.06em] font-semibold text-text-muted"
          title="Pick 1 cloud to deep-dive, or 2–3 to compare"
        >
          COMPARE
        </span>
        {(['Azure', 'AWS', 'GCP'] as const).map((p) => {
          const tone = providerTone(p as VmProvider);
          const on = pickedProviders.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() =>
                setPickedProviders((prev) => {
                  const next = new Set(prev);
                  if (next.has(p)) {
                    if (next.size > 1) next.delete(p); // keep ≥1
                  } else next.add(p);
                  return next;
                })
              }
              className="px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{
                background: on ? tone.bg : 'transparent',
                border: `1px solid ${on ? tone.border : 'var(--border)'}`,
                borderRadius: 'var(--radius-pill)',
                color: on ? tone.fg : 'var(--text-muted)',
              }}
              aria-pressed={on}
            >
              {on ? '✓ ' : '+ '}
              {p}
            </button>
          );
        })}
      </div>

      {/* Base — the leftmost basis; only meaningful with ≥2 clouds. */}
      {orderedClouds.length >= 2 ? (
        <div className="flex items-center gap-2 ml-auto">
          <span
            className="text-[9px] tracking-[0.06em] font-semibold text-text-muted"
            title="The base is the leftmost column; every ≈% match is relative to it"
          >
            BASE
          </span>
          <div
            role="group"
            aria-label="Base cloud of comparison"
            className="inline-flex items-center"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
            }}
          >
            {orderedClouds.map((p) => {
              const tone = providerTone(p as VmProvider);
              const isOn = baselineProvider === p;
              return (
                <button
                  key={p}
                  onClick={() => setBaselineProvider(p as 'Azure' | 'AWS' | 'GCP')}
                  className="px-3 py-1 text-[11px] font-semibold tracking-[0.02em] transition-colors"
                  style={{
                    background: isOn ? tone.bg : 'transparent',
                    color: isOn ? tone.fg : 'var(--text-muted)',
                    borderBottom: isOn ? `2px solid ${tone.fg}` : '2px solid transparent',
                  }}
                  title={`Use ${p} as the base cloud; the other selected clouds become the comparison set.`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-text-muted ml-auto">
          Deep-diving{' '}
          <strong style={{ color: providerTone(baselineProvider as VmProvider).fg }}>
            {baselineProvider}
          </strong>{' '}
          — add a cloud to compare
        </span>
      )}
    </div>
  );

  const filterBlock = (
    <section className="space-y-2">
      <CollapsibleSetupHeader
        title="Comparison filters"
        summary={filterSummary}
        open={filterOpen}
        onToggle={() => setFilterOpen((o) => !o)}
        extra={
          anyFilterPick ? (
            <button
              onClick={clearAllPicks}
              className="px-2 py-0.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors shrink-0"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}
              title="Clear every filter (keeps the active clouds + base)"
            >
              Clear all
            </button>
          ) : undefined
        }
      />
      {filterOpen && (
        <div className="glass space-y-2" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
          {STEP_ORDER.map((dim) => {
            const meta = STEP_META[dim];
            return (
              <SetupStepCard
                key={dim}
                stepNumber={meta.n}
                title={meta.title}
                complete={dimComplete(dim)}
                active={filterStep === dim}
                summary={stepSummary(dim)}
                onActivate={() => setFilterStep(dim)}
              >
                {(dim === 'category' || dim === 'family') && (
                  <div className="flex items-center justify-end pb-1.5 -mt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={bestMatchAuto}
                      onClick={() => setBestMatchAuto((v) => !v)}
                      title="Auto-select each other cloud's closest analog to your base pick — and lock it, so you can't pick a worse-matching category/family"
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold transition-colors"
                      style={{ color: bestMatchAuto ? 'var(--interactive)' : 'var(--text-muted)' }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 15,
                          borderRadius: 999,
                          background: bestMatchAuto ? 'var(--interactive)' : 'var(--border)',
                          position: 'relative',
                          transition: 'background 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: bestMatchAuto ? 13 : 2,
                            width: 11,
                            height: 11,
                            borderRadius: 999,
                            background: '#fff',
                            transition: 'left 0.15s',
                          }}
                        />
                      </span>
                      Best match
                    </button>
                  </div>
                )}
                {dim === 'objective'
                  ? objectiveStepBody
                  : dim === 'clouds'
                    ? cloudsStepBody
                    : cloudColumns(dim)}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => advanceStep(dim)}
                    className="px-3 py-1 text-[11px] font-semibold transition-colors"
                    style={{
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--interactive)',
                      color: '#04111A',
                    }}
                  >
                    {dim === 'family' ? 'Done' : 'Next →'}
                  </button>
                  {/* Skip = "don't filter on this dimension" — n/a for the
                      objective + clouds steps, which always have a valid pick. */}
                  {dim !== 'clouds' && dim !== 'objective' && (
                    <button
                      type="button"
                      onClick={() => {
                        clearDim(dim);
                        advanceStep(dim);
                      }}
                      className="px-2.5 py-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}
                    >
                      Skip
                    </button>
                  )}
                </div>
              </SetupStepCard>
            );
          })}
        </div>
      )}
    </section>
  );

  // Basis-of-comparison toggle — anchors the verdict + every ≈% match.
  // v2.38 — Read-only base-cloud note for the Compare / Detail tabs. The base
  // (cloud provider) is chosen ONCE in Set up; these tabs no longer carry their
  // own provider selector — they just show what's active + a link back.
  const baseCloudNote = (
    <div className="text-[11px] text-text-muted">
      Base cloud:{' '}
      <strong style={{ color: providerTone(baselineProvider as VmProvider).fg }}>
        {baselineProvider}
      </strong>
      {' · '}change it in{' '}
      <button
        type="button"
        onClick={() => setCompetitiveTab('setup')}
        className="underline underline-offset-2"
        style={{ color: 'var(--interactive)' }}
      >
        Set up
      </button>
    </div>
  );

  const basisToggle = (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-[10px] flex-wrap"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span className="tracking-[0.04em] font-semibold text-text-muted">
        Basis of comparison
      </span>
      <div
        role="group"
        aria-label="Baseline cloud"
        className="inline-flex items-center"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        {(['Azure', 'AWS', 'GCP'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setBaselineProvider(p)}
            className="px-2.5 py-0.5 font-mono tracking-[0.02em] transition-colors"
            style={{
              background: baselineProvider === p ? 'var(--interactive)' : 'transparent',
              color: baselineProvider === p ? '#04111A' : 'var(--text-muted)',
              fontWeight: baselineProvider === p ? 600 : 500,
            }}
            title={`Use ${p} as the baseline; the other two clouds become the comparison set.`}
          >
            {p}
          </button>
        ))}
      </div>
      <span className="ml-2 text-text-muted">
        base anchors the verdict; the others show a ≈% match to it
      </span>
    </div>
  );

  const hasComparison = !!(equivalents && equivalents.baseline);

  // Empty / missing-baseline states reused across the sub-pages so each page
  // teaches instead of rendering blank when no VM is picked yet.
  const noBaselineHint = !baseline ? (
    <div
      className="glass text-[11px] text-text-secondary italic"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      Pick a VM Size on the <strong>Set up</strong> page to load specs,
      pricing, and the cross-cloud analysis.
    </div>
  ) : equivalents && !equivalents.baseline ? (
    <div
      className="glass text-[11px] text-text-secondary"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      "{baseline}" doesn't have a catalog row in your VM Library yet.
      Add the SKU + region via the VM Library tab to populate the
      comparison.
    </div>
  ) : null;

  // ── Sub-page content blocks ───────────────────────────────────────────

  // v2.46 — feed the Specs takeaway box. Sizes mode → the UNIQUE selected VMs
  // (resolved from the comparison picks); products mode → one group per picked
  // family (preferred) or category, with its member VMs.
  const selectedCompareVms = useMemo(() => {
    const seen = new Set<string>();
    const out: CatalogEntry[] = [];
    for (const p of orderedClouds) {
      for (const name of compareValuesByProvider[p as 'Azure' | 'AWS' | 'GCP'] ?? []) {
        const key = `${p}::${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const vm = userVmsArr.find(
          (v) => (v.provider ?? '') === p && v.vmSizeName === name,
        );
        if (vm) out.push(vm);
      }
    }
    return out;
  }, [orderedClouds, compareValuesByProvider, userVmsArr]);

  // The VMs paired on the ACTIVE comparison row (one per cloud, by pick-order
  // index) — the subject of the 'row'-scope executive briefing.
  const activeRowVms = useMemo(() => {
    const out: CatalogEntry[] = [];
    const seen = new Set<string>();
    for (const p of orderedClouds) {
      const name = compareValuesByProvider[p as 'Azure' | 'AWS' | 'GCP']?.[activeCompareRow];
      if (!name || seen.has(`${p}::${name}`)) continue;
      seen.add(`${p}::${name}`);
      const vm = userVmsArr.find((v) => (v.provider ?? '') === p && v.vmSizeName === name);
      if (vm) out.push(vm);
    }
    return out;
  }, [orderedClouds, compareValuesByProvider, activeCompareRow, userVmsArr]);

  // v2.52.3 / Wave-0 — the shared cross-cloud BoM port (via `useBomPort`, the
  // ONE memoized `portBom` entry point). Term-aware now: it prices at the
  // user's picked commitment `pricingTerm` instead of the old PAYG-hardcoded
  // call. Enabled only in VM-BoM mode so VM-sizes mode never pays for a port.
  const bomTargets = useMemo(
    () => orderedClouds.filter((p) => p !== baselineProvider),
    [orderedClouds, baselineProvider],
  );
  const bomPortResult = useBomPort(
    state.bom ?? [],
    userVmsArr,
    baselineProvider,
    bomTargets,
    pricingTerm,
    compareMode === 'bom',
  );

  // The cross-cloud VMs for the ACTIVE VM-BoM row: the BoM line's base SKU + its
  // best-match equivalent on each other cloud, derived from the shared
  // `bomPortResult`. Feeds the Specs / Exec-Summary detail so VM BoM mode reads
  // line-by-line like a comparison. Empty unless VM BoM is active with a row.
  const bomRowVms = useMemo(() => {
    if (!bomPortResult) return [] as CatalogEntry[];
    const bom = state.bom ?? [];
    if (!bom.length) return [] as CatalogEntry[];
    // "All" (-1) has no single line to drill — the page shows the all-lines note.
    if (activeCompareRow < 0) return [] as CatalogEntry[];
    const row = Math.min(activeCompareRow, bom.length - 1);
    const out: CatalogEntry[] = [];
    const baseLine = bomPortResult.baseScenario.lines[row];
    if (baseLine) {
      const bvm = userVmsArr.find(
        (v) => (v.provider ?? '') === baselineProvider && v.vmSizeName === baseLine.baseVmSizeName,
      );
      if (bvm) out.push(bvm);
    }
    for (const s of bomPortResult.targetScenarios) {
      const line = s.lines[row];
      if (line?.matchVmSizeName) {
        const tvm = userVmsArr.find(
          (v) => (v.provider ?? '') === s.provider && v.vmSizeName === line.matchVmSizeName,
        );
        if (tvm) out.push(tvm);
      }
    }
    return out;
  }, [bomPortResult, state.bom, userVmsArr, baselineProvider, activeCompareRow]);

  const productGroups = useMemo(() => {
    const groups: { kind: 'family' | 'category'; name: string; vms: CatalogEntry[] }[] = [];
    const anyFamily = orderedClouds.some(
      (p) => (pickedFamiliesByProvider[p]?.length ?? 0) > 0,
    );
    for (const p of orderedClouds) {
      if (anyFamily) {
        for (const fam of pickedFamiliesByProvider[p] ?? []) {
          const vms = userVmsArr.filter(
            (v) => (v.provider ?? '') === p && vmFamily(v) === fam,
          );
          if (vms.length) groups.push({ kind: 'family', name: `${p} · ${fam}`, vms });
        }
      } else {
        for (const cat of pickedCategoryByProvider[p] ?? []) {
          const vms = userVmsArr.filter(
            (v) => (v.provider ?? '') === p && (v.category ?? categorize(v.provider, v.family)) === cat,
          );
          if (vms.length) groups.push({ kind: 'category', name: `${p} · ${cat}`, vms });
        }
      }
    }
    return groups;
  }, [orderedClouds, pickedFamiliesByProvider, pickedCategoryByProvider, userVmsArr]);

  // Seed the cost estimator with each cloud's first comparison pick (else its
  // single anchor), so it opens on the VMs the user already lined up.
  const initialSizeByProvider = useMemo(
    () => ({
      Azure: compareValuesByProvider.Azure?.[0] ?? pickedSkuByProvider.Azure ?? null,
      AWS: compareValuesByProvider.AWS?.[0] ?? pickedSkuByProvider.AWS ?? null,
      GCP: compareValuesByProvider.GCP?.[0] ?? pickedSkuByProvider.GCP ?? null,
    }),
    [compareValuesByProvider, pickedSkuByProvider],
  );

  // v2.34 — Set up (the front door). ONE shared config that drives every other
  // view: ① the basis-of-comparison base cloud, ② the focus (which routes the
  // user into their first view), ③ the VM selection & filter cascade (moved
  // here from the old VM compare page). All three bind to the page-level state
  // above, so switching to any other view simply reads what was authored here.
  const setupPage = (
    <div className="space-y-5">
      {/* Comparison setup — ONE collapsing stepper: Clouds & basis → Category →
          VM family. The picks feed every view + shrink the equivalents explorer
          below. (v2.44 folded the old standalone ① Clouds section in as step 1.) */}
      {filterBlock}

      {/* v2.52.13 — Optional VM SIZE picker, AFTER the family filter. A searchable
          per-cloud dropdown so the user can add specific sizes WITHOUT digging
          through the equivalents table below. It writes the SAME `compareByProvider`
          picks a table-cell click does, so the sizes appear in the comparison table
          / dock identically (drag-to-re-pair across clouds lives there). Sizes
          objective only. */}
      {!isProducts && activeClouds.length >= 1 && (
        <section className="space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="section-h">Add VM sizes</h2>
            <span className="text-[10px] text-text-muted">
              optional · search &amp; pick sizes per cloud — they join the comparison table the
              same as ticking a row below
            </span>
          </div>
          <div
            className="glass"
            style={{
              padding: 12,
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              gap: 12,
              gridTemplateColumns: `repeat(${Math.max(1, orderedClouds.length)}, minmax(0, 1fr))`,
            }}
          >
            {(orderedClouds as ('Azure' | 'AWS' | 'GCP')[]).map((p) => {
              const opts = p === 'Azure' ? groupedAzureOptions : skuOptionsByProvider[p] ?? [];
              const picks = compareByProvider[p] ?? [];
              const fg = providerTone(p as VmProvider).fg;
              return (
                <div key={p} className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] tracking-[0.04em] font-semibold" style={{ color: fg }}>
                      {p}
                    </span>
                    {p === baselineProvider && (
                      <span className="text-[8.5px] text-text-muted">· base</span>
                    )}
                    {picks.length > 0 && (
                      <span className="text-[8.5px] text-text-muted">· {picks.length} picked</span>
                    )}
                  </div>
                  <GlassDropdown
                    value=""
                    options={opts}
                    onChange={(v) => {
                      if (v) addComparePick(p, v, v);
                    }}
                    placeholder="+ Add VM size…"
                    searchable
                    visibleRows={6}
                  />
                  {picks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {picks.map((pk, i) => (
                        <span
                          key={`${pk.value}-${i}`}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono"
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                          }}
                          title={pk.value}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                            {pk.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeComparePickAt(p, i)}
                            style={{ color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
                            aria-label={`Remove ${pk.value}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cross-cloud equivalents explorer — the modified equivalency table:
          base is the (highlighted) row label, only the OTHER clouds get a
          comparison column + ≈%; it SHRINKS as the filter above narrows; ticking
          a base VM adds it to the compare set; the right-hand insights card
          explains the most-similar Category / Family / Size per cloud + why. */}
      {activeClouds.length >= 2 && (
        <section className="space-y-2">
          <h2 className="section-h">Cross-cloud equivalents</h2>
          <CrossCloudEquivalencyPanel
            userVms={userVmsArr}
            filteredVms={setupScopedVms}
            activeProviders={orderedClouds as ('Azure' | 'AWS' | 'GCP')[]}
            base={baselineProvider}
            filterChips={[] as FilterChip[]}
            onChange={() => {}}
            hideBaseColumn
            select={{
              pickedByProvider: {
                Azure: compareByProvider.Azure ?? [],
                AWS: compareByProvider.AWS ?? [],
                GCP: compareByProvider.GCP ?? [],
              },
              onAdd: addComparePick,
              onRemoveAt: removeComparePickAt,
              onReorder: reorderComparePick,
            }}
            showInsights
            hideComparisonBox
            familyRanking={familyRankingData?.byProvider}
            familyRankingPerBase={familyRankingPerBase ?? undefined}
            familyTotals={familyRankingData?.totalByProvider}
            pickedColumnFamilies={pickedFamiliesByProvider}
            baseFamilies={
              familyRankingPerBase
                ? Object.keys(familyRankingPerBase)
                : pickedFamiliesByProvider[baselineProvider]
            }
            categoryRankingPerBase={categoryRankingPerBase ?? undefined}
            baseCategories={pickedCategoryByProvider[baselineProvider]}
            pickedColumnCategories={pickedCategoryByProvider}
            betterMatchAlerts={betterMatchAlerts}
            sizeRanking={sizeRankingData ?? undefined}
            baseSize={baseline ?? undefined}
            onOpenFaq={(s) => openFaqAt(s ?? 'data')}
            onAddCategory={addCategory}
            hideSizes={isProducts}
            regionScopeByProvider={equivRegionScope}
            syncOpenSection={
              filterStep === 'category'
                ? 'category'
                : filterStep === 'family'
                  ? 'family'
                  : filterStep === 'done'
                    ? 'size'
                    : null
            }
          />
        </section>
      )}

      {/* v2.46 — the comparison table + Selected-VM specs are SIZE-based, so they
          only appear in "Compare VM sizes" mode. In "Compare product offerings"
          mode the equivalents table above (Category / VM family) IS the
          comparison — there are no individual size picks. */}
      {!isProducts && (
        <>
          {/* The comparison table — the numbered zip-rows the user authors by
              ticking VMs above. This SAME table is pinned to the top of At a
              Glance / VM Compare / Executive summary, so it persists across pages. */}
          <section className="space-y-2">
            <h2 className="section-h">Comparison table</h2>
            {compareRowCount > 0 ? (
              <CompareTable
                compareByProvider={compareValuesByProvider}
                base={baselineProvider as 'Azure' | 'AWS' | 'GCP'}
                orderedClouds={orderedClouds as ('Azure' | 'AWS' | 'GCP')[]}
                userVms={userVmsArr}
                onRemoveAt={removeComparePickAt}
                onReorder={reorderComparePick}
              />
            ) : (
              <div
                className="glass text-[11px] text-text-muted italic"
                style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
              >
                Tick VMs in the equivalents table above to build your comparison —
                each cloud's picks pair up into numbered rows here.
              </div>
            )}
          </section>

          {/* Selected VM specs — the apples-to-apples spec sheet for every UNIQUE
              VM in the comparison table above (replaces the old verdict preview). */}
          <section className="space-y-2">
            <h2 className="section-h">Selected VM specs</h2>
            <SelectedVmSpecs
              compareByProvider={compareValuesByProvider}
              orderedClouds={orderedClouds as ('Azure' | 'AWS' | 'GCP')[]}
              userVms={userVmsArr}
              baseProvider={baselineProvider}
              baseRegion={matchedEquivalents?.baseline?.region ?? undefined}
            />
          </section>
        </>
      )}

      {/* ③ Focus — pick what you're here to do. Select only; ④ Continue routes. */}
      <section className="space-y-2">
        <h2 className="section-h">③ Focus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            {
              key: 'vms' as const,
              title: isProducts ? 'Compare Products' : 'Compare VMs',
              body: isProducts
                ? 'Side-by-side category / family offerings and the closest cross-cloud product analogs.'
                : 'Side-by-side specs and the closest cross-cloud analogs for your picked VM.',
            },
            {
              key: 'pricing' as const,
              title: 'Compare pricing',
              body: 'Cross-cloud cost: an interactive estimator with 1mo / 1yr / 3yr rate bars for your picks (or a ported BoM).',
            },
            {
              key: 'regions' as const,
              title: 'Explore regions',
              body: 'See where each cloud offers what you care about — on a world map or a metro roster.',
            },
            {
              key: 'summary' as const,
              title: 'Executive Summary',
              body: 'A one-glance briefing: the verdict, KPIs, best-at calls and cost headline for your comparison.',
            },
          ]).map((card) => {
            const isOn = focus === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setFocus(card.key)}
                className="text-left transition-colors"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  background: isOn ? 'var(--interactive-muted)' : 'var(--surface)',
                  border: isOn
                    ? '1px solid var(--border-glow)'
                    : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                aria-pressed={isOn}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: isOn ? 'var(--interactive)' : 'var(--text-primary)' }}
                >
                  {card.title}
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-1.5">
                  {card.body}
                </p>
                <div
                  className="text-[10px] font-semibold tracking-[0.04em] mt-2.5"
                  style={{ color: isOn ? 'var(--interactive)' : 'var(--text-muted)' }}
                >
                  {isOn ? '✓ Selected' : 'Select'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ④ Continue — submit: route into the chosen focus's first view. The
          VMs focus waits until a VM is picked so you don't land empty-handed. */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        {(() => {
          const targetTab: CompetitiveTab =
            focus === 'vms'
              ? 'compare'
              : focus === 'pricing'
                ? 'pricing'
                : focus === 'summary'
                  ? 'executive-summary'
                  : 'region-availability';
          const targetLabel =
            focus === 'vms'
              ? isProducts
                ? 'Compare Products'
                : 'Compare VMs'
              : focus === 'pricing'
                ? 'Compare pricing'
                : focus === 'summary'
                  ? 'Executive Summary'
                  : 'Explore regions';
          // VM + pricing + summary focuses read the picked SIZE anchor, so in
          // VM-sizes mode they wait for a VM — UNLESS a committed BoM exists,
          // which Pricing can price on its own. Products mode is never gated.
          const gated =
            !isProducts &&
            (focus === 'vms' || focus === 'summary' || (focus === 'pricing' && (state.bom?.length ?? 0) === 0)) &&
            !baseline;
          return (
            <>
              <button
                type="button"
                disabled={gated}
                onClick={() => setCompetitiveTab(targetTab)}
                className="px-5 py-2 text-sm font-semibold transition-colors"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: gated ? 'var(--surface)' : 'var(--interactive)',
                  color: gated ? 'var(--text-muted)' : '#FFFFFF',
                  border: gated
                    ? '1px solid var(--border)'
                    : '1px solid var(--interactive)',
                  cursor: gated ? 'not-allowed' : 'pointer',
                  opacity: gated ? 0.7 : 1,
                }}
                title={gated ? 'Pick a VM size in the filter first' : `Go to ${targetLabel}`}
              >
                Continue → {targetLabel}
              </button>
              {gated && (
                <span className="text-[11px] text-text-muted">
                  Pick a VM size in the filter above first.
                </span>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );

  // v2.41 — The persistent comparison table, pinned to the top of the
  // comparison-centric pages. The row-toggle re-anchors every view below.
  // S54 — The persisted comparison table is now a FLOATING dock (collapsed to a
  // bubble with just the VIEW ROW selector by default; expands on demand) with a
  // Comparison ⇄ VM BoM mode toggle. Floating (position: fixed) so it no longer
  // eats the page's vertical space — on Pricing the cost estimator leads instead.
  // Renders when there's either a comparison or a committed VM-demand BoM.
  const floatingDock =
    compareRowCount > 0 || (state.bom?.length ?? 0) > 0 ? (
      <FloatingCompareDock
        compareByProvider={compareValuesByProvider}
        base={baselineProvider as 'Azure' | 'AWS' | 'GCP'}
        orderedClouds={orderedClouds as ('Azure' | 'AWS' | 'GCP')[]}
        userVms={userVmsArr}
        activeRow={activeCompareRow}
        onActiveRowChange={setActiveCompareRow}
        onRemoveAt={removeComparePickAt}
        onReorder={reorderComparePick}
        bom={state.bom ?? []}
        onModeChange={setCompareMode}
        onEditBom={() =>
          dispatch({
            type: 'UI_SET',
            ui: {
              activePage: 'simulator',
              activeSidebarTab: 'configure',
              workspaceView: 'setup',
            },
          })
        }
      />
    ) : null;

  // VM BoM "All" (-1) has no single pairing to drill — surface what "All" means
  // (the dock table above ports every line; Pricing totals them) and steer the
  // user to pick a line for the side-by-side spec detail.
  const bomLineCount = state.bom?.length ?? 0;
  const bomAllLinesNote = (
    <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        Comparing all {bomLineCount} VM BoM line{bomLineCount === 1 ? '' : 's'}
      </p>
      <p
        className="text-[11px] mt-1 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        The ported table above maps every line to its best-match SKU on each cloud, and the{' '}
        <button
          type="button"
          onClick={() => setCompetitiveTab('pricing')}
          className="underline underline-offset-2 font-semibold"
          style={{ color: 'var(--interactive)' }}
        >
          Pricing
        </button>{' '}
        page totals the cost of deploying them all. Pick a line (1–{bomLineCount}) — or click a
        row in the table above — to drill its side-by-side specs.
      </p>
    </div>
  );

  // Overview / At a glance — the executive verdict + KPI summary. Landing.
  // VM compare (side-by-side) — read-only view of the side-by-side spec
  // evidence. The filter cascade now lives on the Set-up page; if no VM is
  // picked yet, point the user there.
  // C1 — the VMs the Specs page is currently comparing (BoM row / comparison
  // row / all picks), split into the base pick and its cross-cloud analogs so
  // the methodology strip can score each pairing. Base = the pick whose
  // provider is the selected baseline; matches = every other cloud's pick.
  const methodologyVms: CatalogEntry[] = !isProducts
    ? compareMode === 'bom'
      ? bomRowVms
      : hasComparison
        ? activeRowVms
        : selectedCompareVms
    : [];
  const methodologyBase =
    methodologyVms.find((v) => (v.provider ?? '') === baselineProvider) ?? null;
  const methodologyMatches = methodologyVms
    .filter((v) => v !== methodologyBase)
    .map((v) => ({ provider: (v.provider ?? '') as string, vm: v }));

  // SPECS (S65) — the Spec Showdown hero. The at-a-glance side-by-side table's
  // COLUMNS: the base pick first, then each cross-cloud analog for the ACTIVE
  // comparison. We reuse the already-resolved `methodologyVms` (BoM row / active
  // comparison row / all picks) for identity, look up each cloud's region-matched
  // $/mo from `horizons` (same rates as Pricing), score similarity via the shared
  // matchPct kernel, and carry the worst comparability caveat for the header chip.
  // S66-SPECS — term label from the ONE shared source (was a private ternary).
  const showdownTermLabel = termLabelShort(pricingTerm);
  const showdownColumns = useMemo<ShowdownColumn[]>(() => {
    if (isProducts || methodologyVms.length === 0) return [];
    const base = methodologyBase;
    // Order base-first, then the rest in orderedClouds order.
    const ordered = [
      ...(base ? [base] : []),
      ...methodologyVms.filter((v) => v !== base),
    ];
    const monthlyFor = (provider: string): number | null => {
      const h = horizons.find((x) => x.provider === provider);
      return h?.oneMonthBest ?? null;
    };
    return ordered.map((vm) => {
      const provider = (vm.provider ?? '') as string;
      const isBase = vm === base;
      const caveats = isBase ? [] : caveatsByProvider[provider] ?? [];
      // S66-FIX-C — score through the ONE picked-pair kernel (pctVsBase) the
      // exec brief + normalized-rate table use, not a divergent inline
      // computation, so dock === verdict === showdown for the same pair.
      const pct = isBase ? 100 : pctVsBase(base, vm);
      return {
        provider,
        vm,
        isBase,
        monthlyUsd: monthlyFor(provider),
        matchPct: pct,
        worstCaveat: worstCaveat(caveats),
      };
    });
  }, [isProducts, methodologyVms, methodologyBase, horizons, caveatsByProvider]);

  // SPECS (S65) — the compact Stands-out / Trails-on strip under the hero. Pulls
  // the SAME per-VM standout/weakness the educational columns use (`compareSpecs`),
  // one line per cloud. Empty in products mode / when nothing separates the picks.
  const showdownInsights = useMemo<ShowdownInsight[]>(() => {
    if (isProducts || methodologyVms.length === 0) return [];
    const cmp = compareSpecs(methodologyVms);
    return cmp.vms.map((v) => ({
      provider: v.provider,
      displayName: v.displayName,
      standout: v.standout,
      weakness: v.weakness,
    }));
  }, [isProducts, methodologyVms]);

  // S66-SPECS — section 1 of the frozen page grammar: the spec ANSWER, built by
  // pure tested math (specShowdownMath) and rendered through the shared
  // VerdictBand. Comparison mode scores the showdown columns; VM-BoM mode
  // scores the whole ported portfolio.
  const specsVerdictModel = useMemo(
    () =>
      isProducts || compareMode === 'bom' || showdownColumns.length === 0
        ? null
        : specsVerdict(showdownColumns, caveatsByProvider),
    [isProducts, compareMode, showdownColumns, caveatsByProvider],
  );
  // S66-FIX-C (perf) — compute the per-cloud portfolio spec stats ONCE and feed
  // both the verdict model and the insights strip, instead of each memo walking
  // every ported line independently inside specShowdownMath.
  const bomSpecStats = useMemo<BomCloudSpecStat[] | null>(
    () => (!isProducts && compareMode === 'bom' && bomPortResult ? bomCloudStats(bomPortResult) : null),
    [isProducts, compareMode, bomPortResult],
  );
  const bomSpecsVerdictModel = useMemo<BomSpecsVerdictModel | null>(
    () =>
      !isProducts && compareMode === 'bom' && bomPortResult
        ? bomSpecsVerdict(bomPortResult, bomSpecStats ?? undefined)
        : null,
    [isProducts, compareMode, bomPortResult, bomSpecStats],
  );
  // The VM-BoM Stands-out / Trails-on strip (section 2) — same visual strip as
  // comparison mode, derived per cloud across the portfolio.
  const bomSpecsInsights = useMemo<ShowdownInsight[]>(
    () =>
      !isProducts && compareMode === 'bom' && bomPortResult
        ? bomShowdownInsights(bomPortResult, bomSpecStats ?? undefined)
        : [],
    [isProducts, compareMode, bomPortResult, bomSpecStats],
  );

  // S66-SPECS — comparison-mode verdict band. Rendered only once a cross-cloud
  // equivalent exists (the hero's own hint covers the only-base state). The
  // support line names what you GAIN and GIVE UP with the actual data points;
  // when nothing separates the picks it says so instead of fabricating one.
  const specsVerdictBand = (() => {
    const m = specsVerdictModel;
    if (!m || !m.best) return null;
    const best = m.best;
    const gain = m.gains[0]?.text ?? null;
    const giveUp = m.giveUps[0]?.text ?? null;
    const supportParts = [
      gain ? (gain.startsWith('+') ? gain : `+ ${gain}`) : null,
      giveUp ? (giveUp.startsWith('−') ? giveUp : `− ${giveUp}`) : null,
    ].filter((s): s is string => s != null);
    return (
      <VerdictBand
        tone={m.tone}
        eyebrow={`Spec verdict · ${termLabelShort(pricingTerm)}`}
        headline={
          <>
            Closest equivalent to{' '}
            <strong style={{ color: providerTone(m.baseProvider).fg }}>
              {m.baseProvider} {m.baseSku}
            </strong>{' '}
            is{' '}
            <strong style={{ color: providerTone(best.provider).fg }}>
              {best.provider} {best.sku}
            </strong>
            {best.matchPct != null ? ` — ${Math.round(best.matchPct)}% match` : ' — no similarity score'}
          </>
        }
        support={
          supportParts.length > 0
            ? supportParts.join(' · ')
            : 'Nothing meaningful separates the picks on the dimensions we compare — the table below has the line-by-line evidence.'
        }
        dataStrip={m.perCloud.map((pc) => ({
          label: `${pc.provider} ${pc.sku}`,
          value: `${fmtPct(pc.matchPct)} match · ${
            pc.monthlyUsd != null ? `${fmtUsd(pc.monthlyUsd)}/mo` : '— $/mo'
          }`,
          fg: providerTone(pc.provider).fg,
        }))}
        chips={m.chips}
      />
    );
  })();

  // S66-SPECS — VM-BoM-mode verdict band: which cloud carries the portfolio
  // best, its weakest line, per-cloud qty-weighted avg match + $/mo.
  const bomSpecsVerdictBand = (() => {
    const m = bomSpecsVerdictModel;
    if (!m || !m.best) return null;
    const b = m.best;
    const chips: { label: string; detail?: string }[] = [];
    if (m.perCloud.some((s) => s.anyEstimated)) {
      chips.push({
        label: 'includes estimated rates',
        detail: 'Some reserved rates are estimated from PAYG — treat the totals as directional.',
      });
    }
    if (b.unmatchedLines > 0) {
      chips.push({
        label: `${b.unmatchedLines} line${b.unmatchedLines === 1 ? '' : 's'} unmatched on ${b.provider}`,
        detail: `${b.unmatchedLines} BoM line${b.unmatchedLines === 1 ? ' has' : 's have'} no in-category equivalent on ${b.provider}; they are excluded from its totals.`,
      });
    }
    return (
      <VerdictBand
        tone={m.tone}
        eyebrow={`Spec verdict · VM BoM · ${termLabelShort(pricingTerm)}`}
        headline={
          b.strongLines > 0 ? (
            <>
              {b.strongLines} of {m.totalLines} line{m.totalLines === 1 ? '' : 's'} have ≥
              {STRONG_MATCH_PCT}% equivalents on{' '}
              <strong style={{ color: providerTone(b.provider).fg }}>{b.provider}</strong>
              {b.weakest
                ? ` — weakest line is ${b.weakest.sku} at ${Math.round(b.weakest.matchPct)}%`
                : ''}
            </>
          ) : (
            <>
              Closest portfolio fit is{' '}
              <strong style={{ color: providerTone(b.provider).fg }}>{b.provider}</strong>
              {b.avgMatchPct != null
                ? ` at ≈${Math.round(b.avgMatchPct)}% quantity-weighted average match`
                : ' — no similarity scores available'}
            </>
          )
        }
        support="Quantity-weighted average match per cloud below — expand a line for its side-by-side specs."
        dataStrip={m.perCloud.map((s) => ({
          label: s.provider,
          value: `${fmtPct(s.avgMatchPct)} avg · ${
            s.monthlyTotalUsd != null ? `${fmtUsd(s.monthlyTotalUsd)}/mo` : '— $/mo'
          }`,
          fg: providerTone(s.provider).fg,
        }))}
        chips={chips}
      />
    );
  })();

  const comparePage = (
    <div className="space-y-5">
      {floatingDock}

      {/* S66-SPECS — VM-BoM mode follows the SAME frozen skeleton as comparison
          mode: 1 VerdictBand (portfolio spec answer) · 2 Stands-out/Trails-on
          strip · 3 evidence hero (per-line showdown cards, active line expanded
          first) · 4 collapsed education (focused line's families, when a line
          is focused) · 6 methodology footer. */}
      {!isProducts && compareMode === 'bom' ? (
        <>
          {bomPortResult ? (
            <>
              {/* 1 — the portfolio spec answer. */}
              {bomSpecsVerdictBand}

              {/* 2 — per-cloud Stands-out / Trails-on across the whole BoM. */}
              <SpecShowdownInsights insights={bomSpecsInsights} />

              {/* 3 — the evidence hero: per-line showdown cards. */}
              <BomSpecsView
                ported={bomPortResult}
                bom={state.bom ?? []}
                userVms={userVmsArr}
                lookup={vmSpecLookup}
                base={baselineProvider}
                activeRow={activeCompareRow}
                onSelectRow={setActiveCompareRow}
                caveatsFor={(base, analog) =>
                  matchCaveats(base, analog, {
                    distance: vmDistance(vmFeatures(base), vmFeatures(analog)),
                  })
                }
              />

              {/* 4 — collapsed education for the families on the FOCUSED line
                  (cheap: bomRowVms is already resolved). Omitted in "All" —
                  no line focus means no honest family set to teach. */}
              {bomRowVms.length > 1 && (
                <SpecsTakeaway
                  mode="sizes"
                  layout="columns"
                  collapsed
                  vms={bomRowVms}
                  collapsedIntro="About the families on the focused BoM line — expand a cloud for the vendor story."
                />
              )}
            </>
          ) : (
            bomAllLinesNote
          )}
          {/* S65 (Fix 5) — the methodology footer renders UNCONDITIONALLY, OUTSIDE the
              bomPortResult gate, so the BoM-unported state still explains how matching
              works. base may be null → MatchMethodology shows the pipeline-only view.
              (The old `methodologyBase &&` gate hid the footer in first-run states.) */}
          <MatchMethodology
            variant="footer"
            base={methodologyBase ?? null}
            matches={methodologyMatches}
            caveatsFor={(base, analog) =>
              matchCaveats(base, analog, {
                distance: vmDistance(vmFeatures(base), vmFeatures(analog)),
              })
            }
          />
        </>
      ) : isProducts ? (
        /* Products mode: no size-match hero — the educational columns ARE the
           comparison (products don't size-match). Kept as always-expanded. */
        <SpecsTakeaway
          mode="products"
          layout="columns"
          groups={productGroups}
          caveatsByProvider={caveatsByProvider}
        />
      ) : (
        /* S65 (Fix 5) — sizes mode: the methodology footer renders UNCONDITIONALLY at
           the bottom, OUTSIDE the `baseline` gate, so the no-baseline first-run state
           still explains how matching works (base null → pipeline-only view). The old
           `methodologyBase &&` gate parked the footer inside the baseline branch and
           hid it entirely before a VM was picked. */
        <>
          {!baseline ? (
            <div
              className="glass text-[11px] text-text-secondary flex items-center gap-2 flex-wrap"
              style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
            >
              <span>
                Pick a VM in <strong>Set up</strong> to load the comparison
              </span>
              <button
                type="button"
                onClick={() => setCompetitiveTab('setup')}
                className="px-3 py-1 text-[11px] font-semibold"
                style={{
                  background: 'var(--interactive-muted)',
                  color: 'var(--interactive)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                }}
              >
                Set up →
              </button>
            </div>
          ) : (
        <>
          {baseCloudNote}

          {/* S66-SPECS 1 — the spec ANSWER first: closest equivalent + what you
              gain / give up with the data points, per-cloud match% + $/mo. */}
          {specsVerdictBand}

          {/* 2 — compact Stands-out / Trails-on strip, one line per cloud
              (S66: above the hero, matching the frozen grammar both modes). */}
          <SpecShowdownInsights insights={showdownInsights} />

          {/* 3 — HERO: the at-a-glance Spec Showdown table. THE numbers, side by
              side, base first, best value per row highlighted. Replaces the old
              buried numeric comparison as the first thing under the dock. */}
          <SpecShowdown
            columns={showdownColumns}
            termLabel={showdownTermLabel}
            onGoToSetup={() => setCompetitiveTab('setup')}
          />

          {/* 4 — de-walled educational content: exec summary + per-cloud prose
              folded behind one-click disclosures (numbers already in the hero). */}
          <SpecsTakeaway
            mode="sizes"
            layout="columns"
            collapsed
            vms={hasComparison ? activeRowVms : selectedCompareVms}
            caveatsByProvider={caveatsByProvider}
          />

          {/* 5 — the exhaustive spec matrix + alternative analogs, tucked away for
              the curious (the hero covers the primary pairing at a glance). */}
          {hasComparison && equivalents?.baseline ? (
            <Disclosure
              title="Full spec matrix + alternative analogs"
              subtitle={
                compareRowCount > 1 ? `comparison row ${activeCompareRow + 1}` : undefined
              }
            >
              <div style={{ paddingTop: 8 }}>
                <ConsolidatedSpecCompare
                  baseline={equivalents!.baseline!}
                  aws={awsPrimary}
                  gcp={gcpPrimary}
                  awsAlternatives={equivalents!.rows.aws.slice(1)}
                  gcpAlternatives={equivalents!.rows.gcp.slice(1)}
                  baselineProvider={baselineProvider}
                />
              </div>
            </Disclosure>
          ) : hasComparison ? null : (
            noBaselineHint
          )}
        </>
          )}

          {/* 6 — quiet methodology footer at the BOTTOM. Renders UNCONDITIONALLY (Fix
              5): base may be null (no VM picked yet) → MatchMethodology shows the
              pipeline explainer only, so the "how we match" strip is never missing. */}
          <MatchMethodology
            variant="footer"
            base={methodologyBase ?? null}
            matches={methodologyMatches}
            caveatsFor={(base, analog) =>
              matchCaveats(base, analog, {
                distance: vmDistance(vmFeatures(base), vmFeatures(analog)),
              })
            }
          />
        </>
      )}
    </div>
  );

  // v2.38 — Region-aware pricing. The live catalog is per-region, so the anchor
  // VM has a distinct rate in every region it ships in. The Pricing page now
  // scopes by region (multi-select, per page) and shows the RESPECTIVE rate for
  // each selected region. Recommendation reuses the same lookup for its scope.
  const anchorRegions = useMemo(
    () => (baseline ? regionsForVm(userVmsArr, baselineProvider, baseline) : []),
    [userVmsArr, baselineProvider, baseline],
  );
  const pricingRegionRates = useMemo(
    () =>
      baseline ? regionRatesFor(userVmsArr, baselineProvider, baseline, pricingRegions) : [],
    [userVmsArr, baselineProvider, baseline, pricingRegions],
  );

  // PRICING (S65) — the dollar-quantified verdict for the selected commitment
  // term. Depends only on the (cheap) region-matched `bars` + `pricingTerm`, so
  // it recomputes instantly on a term/mode flip. Prices on the SAME × 730
  // convention as timeHorizonCosts/normalizedRates so every $ surface agrees.
  const priceVerdictModel = useMemo(
    () => priceVerdict(bars, pricingTerm, baselineProvider),
    [bars, pricingTerm, baselineProvider],
  );

  // S66-PRICING — the whole-BoM twin of `priceVerdictModel`: which cloud runs
  // the committed BoM cheapest at the active term, from `bomPortResult`'s
  // per-cloud monthly totals (already priced at `pricingTerm` on the same ×730
  // convention — nothing is re-priced, so Pricing === Exec === Specs dollars).
  const bomPriceVerdictModel = useMemo(
    () => (bomPortResult ? bomPriceVerdict(bomPortResult, pricingTerm) : null),
    [bomPortResult, pricingTerm],
  );
  // S66-PRICING — cumulative cost-over-time series for the BoM: slope = each
  // cloud's BoM monthly total. Feeds the SAME CostOverTimeChart the comparison
  // branch uses (additive `series` prop).
  const bomCostSeriesData = useMemo(
    () => (bomPortResult ? bomCostSeries(bomPortResult, pricingTerm) : []),
    [bomPortResult, pricingTerm],
  );

  // Pricing — v2.46 leads with the INTERACTIVE cost estimator (the VM is LOCKED
  // from Comparison setup; only the base quantity is editable, mirrored to the
  // other clouds + a "port my VM-demand BoM" scenario), then the cross-cloud cost
  // table + rate bars for the anchored comparison.
  // PRICING (S65) — slim commitment-term pill row that drives the SAME
  // `setPricingTerm` state as CostCalculator's control, so the verdict + chart +
  // (still-present) calculator control all reflect one term. Placed above the
  // chart so the term is visible before the time projection.
  const pricingTermPills = (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-text-muted mr-1">Commitment</span>
      {(['payg', '1y', '3y'] as Term[]).map((t) => {
        const on = pricingTerm === t;
        const label = t === 'payg' ? 'PAYG' : t === '1y' ? '1y RI' : '3y RI';
        return (
          <button
            key={t}
            onClick={() => setPricingTerm(t)}
            className="text-[10px] px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: on ? 'var(--interactive)' : 'transparent',
              color: on ? '#04111A' : 'var(--text-muted)',
              border: `1px solid ${on ? 'var(--interactive)' : 'var(--border)'}`,
              fontWeight: on ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const costCalculator = (
    <CostCalculator
      userVms={userVmsArr}
      providers={orderedClouds as ('Azure' | 'AWS' | 'GCP')[]}
      base={baselineProvider}
      lockedSizeByProvider={initialSizeByProvider}
      bom={state.bom ?? []}
      bomMode={compareMode === 'bom'}
      bomActiveRow={activeCompareRow}
      term={pricingTerm}
      onTermChange={setPricingTerm}
      defaultBaseRegion={matchedEquivalents?.baseline?.region ?? undefined}
      onGoToSetup={() => setCompetitiveTab('setup')}
      onGoToVmDemand={() =>
        dispatch({
          type: 'UI_SET',
          ui: {
            activePage: 'simulator',
            activeSidebarTab: 'configure',
            workspaceView: 'setup',
          },
        })
      }
    />
  );

  // PRICING (S65) — the reference disclosure: the snapshot views (rate bars,
  // commitment step-down, horizon matrix, full normalized table) are not deleted,
  // just DEMOTED behind a one-click expand now that the verdict + cumulative
  // chart carry the decision narrative. Region-rate reference for the base SKU is
  // mounted here too so "where is this cheapest?" is answerable on Pricing.
  const referenceTables = (
    <Disclosure
      title="Reference tables"
      subtitle="rate bars · commitment step-down · horizon totals · full unit rates"
    >
      <div className="space-y-3 pt-1">
        {/* S65 — BoM mode honesty: these reference tables price the anchored
            comparison VM (one SKU), NOT the committed BoM. Say so up front so a
            reader doesn't mistake them for the BoM's own cost. */}
        {compareMode === 'bom' && (
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            These tables price the anchored comparison VM only — not the committed BoM.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          <div>{bars.length > 0 && <RateBarsChart bars={bars} />}</div>
          <div>{bars.length > 0 && <CommitmentStepdown bars={bars} term={pricingTerm} />}</div>
        </div>
        {horizons.length > 0 && <HorizonSummary horizons={horizons} term={pricingTerm} />}
        {/* S65 — the full normalized table is NOT duplicated here anymore: the
            always-visible price-performance strip above is the single mount, and
            the "shapes don't line up" note is attached to IT when the shapes are
            mismatched (showNormalizedFallback). Avoids a double NormalizedRateTable. */}
        {/* Region-rate reference for the base SKU: which region is cheapest for
            the anchored comparison VM (the variance that otherwise only lives on
            the Rate Library tab). */}
        {baseline && pricingRegionRates.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-text-muted">
              Per-region rate for{' '}
              <strong style={{ color: providerTone(baselineProvider as VmProvider).fg }}>
                {baselineProvider} {baseline}
              </strong>{' '}
              — cheapest region highlighted.
            </div>
            <RegionRateTable
              rates={pricingRegionRates}
              provider={baselineProvider}
              vmSizeName={baseline as string}
            />
          </div>
        )}
      </div>
    </Disclosure>
  );

  // S66-PRICING — ONE Pricing skeleton in BOTH modes (the frozen page grammar):
  //   1) "Cost over time" section header + the commitment-term pills,
  //   2) the verdict band (comparison: SKU verdict · BoM: whole-BoM verdict),
  //   3) the cumulative cost-over-time chart (comparison: SKU rates · BoM:
  //      per-cloud BoM monthly totals, exclusions footnoted — never absorbed),
  //   4) comparison: the compact price-performance strip · BoM: the per-cloud
  //      cost-composition bar,
  //   5) the interactive what-if calculator,
  //   6) the snapshot tables, demoted into the reference disclosure.
  const costOverTimeHeader = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="section-h" style={{ margin: 0 }}>
        Cost over time
      </h2>
      {pricingTermPills}
    </div>
  );

  const pricingPage = (
    <div className="space-y-5">
      {floatingDock}
      {baseCloudNote}
      {compareMode === 'bom' ? (
        <>
          <section className="space-y-3">
            {costOverTimeHeader}
            {bomPortResult && bomPriceVerdictModel ? (
              <>
                <BomPriceVerdict model={bomPriceVerdictModel} />
                {bomCostSeriesData.length > 0 && (
                  <CostOverTimeChart
                    series={bomCostSeriesData}
                    term={pricingTerm}
                    baseProvider={baselineProvider}
                  />
                )}
                {/* Unmatched-line exclusions stay visible under the chart — a
                    cloud's line/total silently absorbing missing lines would be
                    a fabricated comparison. */}
                {bomCostSeriesData.length > 0 && bomPriceVerdictModel.exclusions.length > 0 && (
                  <div className="text-[10px]" style={{ color: 'var(--accent-amber)' }}>
                    Curves exclude missing lines:{' '}
                    {bomPriceVerdictModel.exclusions
                      .map((e) => {
                        // S66 — say WHY each line is missing: no analog on that
                        // cloud (unmatched) vs analog found but no published
                        // rate at this term (unpriced).
                        const parts: string[] = [];
                        if (e.unmatched > 0) {
                          parts.push(
                            `${e.unmatched} line${e.unmatched === 1 ? ' has' : 's have'} no analog`,
                          );
                        }
                        if (e.unpriced > 0) {
                          parts.push(`${e.unpriced} unpriced`);
                        }
                        const what =
                          parts.length > 0
                            ? parts.join(' + ')
                            : `${e.lines} line${e.lines === 1 ? '' : 's'} missing`;
                        return `${what} on ${e.provider}`;
                      })
                      .join(' · ')}
                    .
                  </div>
                )}
                {/* The per-cloud stacked cost composition — the BoM twin of the
                    comparison branch's price-performance strip, and the visual
                    companion to CostCalculator's BoM tables below. */}
                <BomCostComposition ported={bomPortResult} term={pricingTerm} />
              </>
            ) : (
              <div
                className="glass text-[12px] text-text-muted italic"
                style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
              >
                No committed VM-demand BoM to price yet. Commit a BoM in the
                simulator&rsquo;s VM demand box to see the whole-BoM cost verdict and
                cumulative cost over time.
              </div>
            )}
          </section>
          {costCalculator}
          {(bars.length > 0 || horizons.length > 0) && referenceTables}
        </>
      ) : (
        <>
          {/* S66-FIX-C — the "Cost over time" section header + term pills render
              in BOTH states (the BoM branch already did); when nothing is priced
              the section carries an honest empty-state card instead of silently
              disappearing. */}
          <section className="space-y-3">
            {costOverTimeHeader}
            {bars.length > 0 || horizons.length > 0 ? (
              <>
              <PriceVerdict
                model={priceVerdictModel}
                term={pricingTerm}
                baseProvider={baselineProvider}
                baseSku={(baseline as string) ?? ''}
              />
              {bars.length > 0 && (
                <CostOverTimeChart bars={bars} term={pricingTerm} baseProvider={baselineProvider} />
              )}
              {/* Price-performance is a first-class shopper metric — the unit-rate
                  strip stays ALWAYS visible (compact). S65 — this is the SINGLE
                  NormalizedRateTable mount; when the compared shapes don't line up
                  (showNormalizedFallback) the honest "shapes don't line up" note
                  attaches HERE instead of a second, stretch-gated copy below. */}
              {inlineNormalizedRows.length > 0 && (
                <NormalizedRateTable
                  rows={inlineNormalizedRows}
                  caption="Price-performance — normalized $/vCPU/mo · $/GiB/mo (lowest wins)"
                  note={
                    showNormalizedFallback ? (
                      <span className="text-[11px]" style={{ color: '#F59E0B' }}>
                        ⚠ Shapes don&rsquo;t line up — normalized unit rates are the honest comparison
                        basis.
                      </span>
                    ) : undefined
                  }
                />
              )}
              </>
            ) : (
              <div
                className="glass text-[12px] text-text-muted italic"
                style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
              >
                {baseline
                  ? `No published rates for this comparison at ${termLabelLong(pricingTerm)} — upload rates via the VM Library tab, or try another commitment term.`
                  : 'Pick a VM size in Set up to see the cost verdict and cumulative cost over time.'}
              </div>
            )}
          </section>
          {costCalculator}
          {(bars.length > 0 || horizons.length > 0) && referenceTables}
        </>
      )}
    </div>
  );

  // v2.46 — Rate library: the per-region rate card archived out of the Pricing
  // page into a bottom-of-rail "Library" tab (mirrors the simulator's VM
  // Library). It's reference data — the PAYG / 1-yr / 3-yr rate for the anchor
  // VM in every region it's offered — not part of the comparison narrative.
  const libraryPage = (
    <div className="space-y-5">
      <PublicDataPill asOf={LIVE_CATALOG_AS_OF} onMoreInfo={() => openFaqAt('data')} />
      {baseline ? (
        anchorRegions.length > 0 ? (
          <section className="space-y-2">
            <h2 className="section-h">Rate by region</h2>
            <p className="text-[11px] text-text-muted">
              Per-region published rate for{' '}
              <strong style={{ color: providerTone(baselineProvider as VmProvider).fg }}>
                {baselineProvider} {baseline}
              </strong>
              . Filter to the regions you care about; the cheapest is highlighted.
            </p>
            <RegionMultiSelect
              regions={anchorRegions}
              selected={pricingRegions}
              onChange={setPricingRegions}
              tone={providerTone(baselineProvider as VmProvider).fg}
              hint={`${baselineProvider} ${baseline}`}
            />
            <RegionRateTable
              rates={pricingRegionRates}
              provider={baselineProvider}
              vmSizeName={baseline as string}
            />
          </section>
        ) : (
          <div
            className="glass text-[11px] text-text-secondary italic"
            style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
          >
            No per-region rates for “{baseline}” in the catalog yet.
          </div>
        )
      ) : (
        <div
          className="glass text-[11px] text-text-secondary italic"
          style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
        >
          Pick a VM Size on the <strong>Set up</strong> page to load its
          per-region rate card.
        </div>
      )}
    </div>
  );

  // S53 — The standalone Recommendation sub-page was removed (redundant: its
  // situational best-at + spec-delta content already lives in the Executive
  // Summary's row-anchored evidence). `WinnerPanel` / `analysis` / `awsDeltas` /
  // `gcpDeltas` are still consumed there. (The `SpecDeltaList` component was
  // deleted in S65 — it had no remaining call sites.)

  // v2.41 — Executive summary. A one-glance briefing that synthesizes the
  // comparison: the verdict, KPI stats, the situational best-at calls, the cost
  // headline and the regional footprint — all anchored on the active comparison
  // row (toggle it in the pinned table). New "focus" destination off setup.
  // C3 — per-provider region counts for the footprint chip row + export
  // footprint table, grouped from the same `mapMarks` the map draws.
  const perProviderRegions = useMemo(() => {
    const by = new Map<string, Set<string>>();
    for (const mk of mapMarks) {
      const set = by.get(mk.provider) ?? new Set<string>();
      set.add(mk.region);
      by.set(mk.provider, set);
    }
    return (['Azure', 'AWS', 'GCP'] as const)
      .filter((p) => by.has(p))
      .map((p) => ({ provider: p as string, regions: (by.get(p) as Set<string>).size }));
  }, [mapMarks]);

  // C3 — distinct BoM deployment regions (the region plan headline / KPI).
  const bomRegionsCovered = useMemo(() => {
    const set = new Set<string>();
    for (const e of state.bom ?? []) if (e.region) set.add(e.region);
    return set.size;
  }, [state.bom]);

  // S65 — Executive-intelligence inputs for the export models. All derived from
  // the SAME live memos the exec block already holds, so the deck/doc read the
  // on-screen numbers (never a parallel derivation).
  //
  // The base + primary target catalog rows, in canonical Azure→AWS→GCP order,
  // drive the family stories + the size-for-size showdown.
  const exportCompareRows = useMemo(() => {
    const rows: { provider: string; row: CatalogEntry }[] = [];
    const base = matchedEquivalents?.baseline ?? null;
    if (base) rows.push({ provider: baselineProvider, row: base });
    const awsRow = matchedEquivalents?.rows.aws.find((mm) => mm.catalogRow)?.catalogRow ?? null;
    const gcpRow = matchedEquivalents?.rows.gcp.find((mm) => mm.catalogRow)?.catalogRow ?? null;
    if (awsRow && baselineProvider !== 'AWS') rows.push({ provider: 'AWS', row: awsRow });
    if (gcpRow && baselineProvider !== 'GCP') rows.push({ provider: 'GCP', row: gcpRow });
    return rows;
  }, [matchedEquivalents, baselineProvider]);

  // specInsights comparison over the SAME rows (reuses standout/nuance/weakness
  // intelligence so the export never re-implements the family heuristics).
  const exportSpecComparison = useMemo(
    () => (exportCompareRows.length ? compareSpecs(exportCompareRows.map((r) => r.row)) : null),
    [exportCompareRows],
  );

  // Match% per provider (base = 100; targets from the same distance kernel the
  // similarity chips use), so the family-story columns can show "≈ N% match".
  const exportMatchByProvider = useMemo(() => {
    const out: Record<string, number | null> = {};
    const base = matchedEquivalents?.baseline ?? null;
    out[baselineProvider] = base ? 100 : null;
    if (base) {
      for (const r of exportCompareRows) {
        if (r.provider === baselineProvider) continue;
        // S66-FIX-C — the ONE picked-pair kernel (pctVsBase) so deck === screen.
        out[r.provider] = pctVsBase(base, r.row);
      }
    }
    return out;
  }, [matchedEquivalents, exportCompareRows, baselineProvider]);

  // S65 — ONE shared base-POV market-gap report. This single memo feeds BOTH the
  // exec KPI/posture strip AND both export builders, so the deck, the doc and the
  // on-screen brief can never disagree (the old code had two divergent memos: one
  // edge-excluded + null-below-2, one neither). Built the SAME way the Region page
  // builds its `coverageDetail`: the shared REGION_GEO_MAP seed + edge-excluded
  // refs from the active-provider userVms. It reasons over the FULL catalog
  // (market-wide, all sizes) — the KPI/posture sub-labels say so, to distinguish
  // it from RA's chip-scoped in-scope availability tile.
  //
  // Runs on DEFERRED inputs (dUserVmsArr / dPickedProviders / dBaselineProvider)
  // so a toggle doesn't block the frame on the O(n) cluster pass. Edge regions are
  // excluded via refsFromVms's `inScope` predicate — no intermediate filtered
  // array (the whole reason inScope exists).
  const marketGapReport = useMemo(() => {
    const active = (['Azure', 'AWS', 'GCP'] as GapProvider[]).filter((p) => dPickedProviders.has(p));
    const refs = refsFromVms(
      dUserVmsArr,
      active,
      // Edge regions (AWS Local Zones / Wavelength etc.) never count toward
      // footprint/gaps — mirrors the RA page. The predicate gets the ref's OWN
      // provider, so the edge check is exact (no intermediate filtered array).
      (region, provider) => !isEdgeRegion(provider, region),
    );
    return buildMarketGapReport(refs, dBaselineProvider as GapProvider, active, REGION_GEO_MAP);
  }, [dUserVmsArr, dPickedProviders, dBaselineProvider]);

  // C3 — lazy export-model builders. Closed over the exec block's live memos so
  // the model is only assembled on the export click (never per render). The
  // builders stamp `generatedAt` themselves.
  const buildComparisonExportModel = () =>
    buildExecComparisonModel({
      analysis: analysis ?? { contenders: [], winners: { cost: null, compute: null, memory: null, network: null, overall: null } },
      horizons,
      bars,
      awsDeltas,
      gcpDeltas,
      markCount: mapMarks.length,
      perProviderRegions,
      baseline: (baseline as string) ?? '',
      baselineProvider,
      term: pricingTerm,
      compareRows: exportCompareRows,
      specComparison: exportSpecComparison,
      matchByProvider: exportMatchByProvider,
      caveatsByProvider,
      marketGapReport,
    });
  const buildBomExportModel = () =>
    buildExecBomModel({
      ported: bomPortResult ?? {
        baseProvider: baselineProvider,
        baseScenario: { provider: baselineProvider, lines: [], monthlyTotalUsd: 0, hourlyTotalUsd: 0, matchedLines: 0, unmatchedLines: 0, pricedLines: 0, avgMatchPct: null, anyEstimated: false },
        targetScenarios: [],
        verdict: { cheapestProvider: null, headline: 'No VM BoM committed.', insights: [] },
      },
      bom: state.bom ?? [],
      regionsCovered: bomRegionsCovered,
      term: pricingTerm,
      marketGapReport,
      marketGapNote: 'Gaps reflect the full-catalog regional footprint of the selected clouds, not only the BoM deployment regions.',
    });

  // EXEC (S65) — executive-briefing memos. Placed immediately before the
  // `executiveSummaryPage` block (per the EXEC ticket) so the redesigned brief's
  // derived facts live next to where they render, and nothing above is touched.

  // Per-provider spec match % of each analog vs the base VM, computed from the
  // SAME `pctVsBase` kernel the rest of the page uses. Base is 100% by def.
  const execMatchByProvider = useMemo<Partial<Record<string, number | null>>>(() => {
    const out: Partial<Record<string, number | null>> = {};
    const baseVm = activeRowVms.find((v) => (v.provider ?? '') === baselineProvider) ?? null;
    if (!baseVm) return out;
    for (const v of activeRowVms) {
      const p = (v.provider ?? '') as string;
      out[p] = p === baselineProvider ? 100 : pctVsBase(baseVm, v);
    }
    return out;
  }, [activeRowVms, baselineProvider]);

  // Quantity-neutral average of the target analogs' match % (base excluded).
  const execAvgMatch = useMemo<number | null>(() => {
    const vals = Object.entries(execMatchByProvider)
      .filter(([p, pct]) => p !== baselineProvider && pct != null)
      .map(([, pct]) => pct as number);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [execMatchByProvider, baselineProvider]);

  // Amber assumptions footer lines (estimated rates, assumed processors, stretch
  // analogs) — pure collector, so the footer is unit-tested independently.
  const execAssumptions = useMemo(
    () => collectAssumptions(horizons, caveatsByProvider, baselineProvider, pricingTerm),
    [horizons, caveatsByProvider, baselineProvider, pricingTerm],
  );

  const executiveSummaryPage = (
    <div className="space-y-5">
      {floatingDock}
      {/* Header line + scope toggle (active pairing vs all picks — VM-sizes mode
          with >1 comparison row only). */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] text-text-muted">
          {isProducts ? (
            <>Product-offering briefing across the selected clouds</>
          ) : compareMode === 'bom' ? (
            // EXEC (S65) — BoM mode describes the committed BoM, never the
            // (empty) comparison-pick counter. Fixes "across all 0 picks" when a
            // BoM is loaded but no comparison sizes are picked.
            <>
              Executive briefing for your committed BoM ·{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {state.bom?.length ?? 0} line{(state.bom?.length ?? 0) === 1 ? '' : 's'}
              </strong>{' '}
              ported cross-cloud
            </>
          ) : (
            <>
              Executive briefing
              {execScope === 'row' && baseline ? (
                <>
                  {' for '}
                  <strong style={{ color: providerTone(baselineProvider as VmProvider).fg }}>
                    {baselineProvider} {baseline}
                  </strong>
                  {compareRowCount > 1 && <> · comparison row {activeCompareRow + 1}</>}
                </>
              ) : selectedCompareVms.length > 0 ? (
                <> across all {selectedCompareVms.length} picks</>
              ) : (
                <> — pick sizes in Set up to compare</>
              )}
            </>
          )}
          {' · '}change the basis in{' '}
          <button
            type="button"
            onClick={() => setCompetitiveTab('setup')}
            className="underline underline-offset-2"
            style={{ color: 'var(--interactive)' }}
          >
            Set up
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {!isProducts && compareRowCount > 1 && (
            <div
              role="group"
              aria-label="Summary scope"
              className="inline-flex items-center"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              {(
                [
                  ['row', 'This pairing'],
                  ['all', 'All picks'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setExecScope(k)}
                  className="px-3 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    background: execScope === k ? 'var(--interactive)' : 'transparent',
                    color: execScope === k ? '#04111A' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* C3 — PPTX + DOCX export, available in BOTH comparison and BoM modes. */}
          {!isProducts && (
            <ExportButton
              mode={compareMode === 'bom' ? 'bom' : 'comparison'}
              buildModel={compareMode === 'bom' ? buildBomExportModel : buildComparisonExportModel}
            />
          )}
        </div>
      </div>

      {/* S66-EXEC — VM-BoM mode renders the SAME 7-section exec skeleton as
          comparison mode (VerdictBand → KpiRow → ONE cost visual → tradeoffs →
          per-line best-at → market posture → assumptions), composed thinly in
          ExecSummaryBom from the shared ui/* primitives + execBriefMath.
          `bomAllLinesNote` is intentionally kept in scope — the Specs page (C1)
          still falls back to it. */}
      {!isProducts && compareMode === 'bom' ? (
        bomPortResult ? (
          <ExecSummaryBom
            ported={bomPortResult}
            bom={state.bom ?? []}
            userVms={userVmsArr}
            lookup={vmSpecLookup}
            term={pricingTerm}
            regionsCovered={bomRegionsCovered}
            marketGapReport={marketGapReport}
            onGoTo={(tab) => setCompetitiveTab(tab as CompetitiveTab)}
            onSelectLine={(row) => setActiveCompareRow(row)}
          />
        ) : (
          bomAllLinesNote
        )
      ) : (
        <>
          {/* EXEC (S65) — VM-sizes, 'this pairing' scope: the redesigned brief.
              Order (visualization-first): dollar verdict → KPI strip → ONE cost
              chart → what-you-get/give-up → situational best-at → market posture
              → assumptions footer. Reads top-to-bottom in <60s. */}
          {!isProducts && execScope === 'row' && hasComparison && analysis ? (
            <>
              {/* 1 — Verdict band: the money line + one supporting spec/caveat line. */}
              <ExecBriefVerdict
                horizons={horizons}
                baseProvider={baselineProvider}
                baseSku={baseline ?? ''}
                avgMatchPct={execAvgMatch}
                caveatsByProvider={caveatsByProvider}
                term={pricingTerm}
              />

              {/* 2 — KPI strip: cheapest, savings, avg match, regions, market gaps. */}
              <ExecBriefKpis
                horizons={horizons}
                baseProvider={baselineProvider}
                avgMatchPct={execAvgMatch}
                perProviderRegions={perProviderRegions}
                totalRegions={mapMarks.length}
                marketGaps={marketGapReport.baseGapCounted}
                term={pricingTerm}
              />

              {/* 3 — ONE cost visual: the commitment step-down. The rate bars +
                  full cost matrix live on Pricing (linked below) — exec altitude
                  keeps a single compact chart. */}
              {bars.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="section-h">Commitment savings</h2>
                    <button
                      type="button"
                      onClick={() => setCompetitiveTab('pricing')}
                      className="text-[10px] underline underline-offset-2 font-semibold"
                      style={{ color: 'var(--interactive)' }}
                    >
                      See Pricing for the full breakdown →
                    </button>
                  </div>
                  <CommitmentStepdown bars={bars} term={pricingTerm} />
                </section>
              )}

              {/* 4 — What you get vs what you give up: the exec family/category/
                  generation story, one column per cloud (base first). */}
              <ExecBriefTradeoffs
                vms={activeRowVms}
                baseProvider={baselineProvider}
                matchPctByProvider={execMatchByProvider}
                caveatsByProvider={caveatsByProvider}
              />

              {/* 5 — Situational best-at (kept, demoted): who leads on each dim. */}
              {analysis.contenders.length > 0 && (
                <section className="space-y-2">
                  <h2 className="section-h">Situational best-at</h2>
                  <WinnerPanel analysis={analysis} />
                </section>
              )}

              {/* 6 — Market posture: where each rival serves metros the base doesn't. */}
              <ExecBriefPosture
                report={marketGapReport}
                onGoToRegion={() => setCompetitiveTab('region-availability')}
              />

              {/* 7 — Assumptions footer (amber, honest). */}
              <ExecBriefAssumptions lines={execAssumptions.lines} />
            </>
          ) : (
            <>
              {/* All-picks (or unresolved) scope — the cross-set narrative from the
                  engine, then point at the per-row verdict + deep pages. */}
              <SpecsTakeaway
                mode={isProducts ? 'products' : 'sizes'}
                vms={selectedCompareVms}
                groups={productGroups}
                caveatsByProvider={caveatsByProvider}
              />
              {!isProducts && selectedCompareVms.length > 0 && (
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Summarising all <strong>{selectedCompareVms.length}</strong> picks across the
                  selected clouds. Switch to <strong>This pairing</strong> for the full
                  dollar verdict, KPIs and the what-you-get/give-up breakdown, or open{' '}
                  <strong>Specs</strong> and <strong>Pricing</strong> for the underlying
                  evidence.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  // v2.30 — Region sub-pages. Map the tab → the embedded RegionAvailabilityPage
  // `view`. CRITICAL: render the region component at a SINGLE stable JSX position
  // for both region tabs (only the `view` prop changes) so the SAME instance
  // stays mounted while switching among them — its filter state (providers, base
  // cloud, chips) therefore persists. Leaving for a Compare tab unmounts it
  // (acceptable). Do NOT split this across ternary branches.
  // S53 — the standalone Equivalency sub-page was removed (redundant with the
  // integrated cross-cloud equivalents table on Region availability), so this
  // only maps availability + coverage now.
  // v2.52.19 — the standalone "Coverage" sub-page was removed: its scoreboard,
  // exclusivity, market-gap and footprint surfaces now live (clustered + base-POV
  // correct) directly on Region availability. A stale persisted `region-coverage`
  // tab falls back to availability so returning users never land on a dead view.
  const regionView: 'availability' | null =
    competitiveTab === 'region-availability' || competitiveTab === 'region-coverage'
      ? 'availability'
      : null;
  const isRegionTab = regionView != null;

  const pageContent = regionView ? (
    <RegionAvailabilityPage
      embedded
      view={regionView}
      baseProviderControlled={baselineProvider}
      // S53 — carry the clouds picked in Comparison setup into the Region views,
      // where the user can "mute" one per-page without losing their setup.
      providersControlled={
        new Set(
          (['Azure', 'AWS', 'GCP'] as const).filter((p) => pickedProviders.has(p)),
        )
      }
      // S54 — Pipe the Comparison setup picks in so the availability view shows a
      // read-only "what we're comparing" box with a granularity toggle (VM sizes
      // / Category / VM family) that scopes the map + visuals. Editing routes back.
      comparisonControlled={{
        objective: compareObjective,
        base: baselineProvider,
        byProvider: {
          Azure: {
            category: pickedCategoryByProvider.Azure ?? [],
            family: pickedFamiliesByProvider.Azure ?? [],
            size: (compareByProvider.Azure ?? []).map((pk) => pk.value),
          },
          AWS: {
            category: pickedCategoryByProvider.AWS ?? [],
            family: pickedFamiliesByProvider.AWS ?? [],
            size: (compareByProvider.AWS ?? []).map((pk) => pk.value),
          },
          GCP: {
            category: pickedCategoryByProvider.GCP ?? [],
            family: pickedFamiliesByProvider.GCP ?? [],
            size: (compareByProvider.GCP ?? []).map((pk) => pk.value),
          },
        },
      }}
      compareMode={compareMode}
      onCompareModeChange={setCompareMode}
      onEditSetup={(granularity) => {
        setCompetitiveTab('setup');
        // Open the setup at the step matching the RA "Compare by" granularity:
        // Category / VM family open their stepper step; VM sizes lands on the
        // collapsed-stepper state where the size dropdown + equivalents table
        // (the size-picking surfaces) are the focus.
        if (granularity === 'category' || granularity === 'family') {
          setFilterOpen(true);
          setFilterStep(granularity);
        } else {
          setFilterStep('done');
        }
      }}
    />
  ) : competitiveTab === 'start-here' ? (
    <StartHerePage
      kind="cma"
      onGoDemo={() => setCompetitiveTab('executive-summary')}
      onGoBuild={() => setCompetitiveTab('setup')}
    />
  ) : competitiveTab === 'setup' ? (
    setupPage
  ) : competitiveTab === 'executive-summary' ? (
    executiveSummaryPage
  ) : competitiveTab === 'compare' ? (
    comparePage
  ) : competitiveTab === 'pricing' ? (
    pricingPage
  ) : competitiveTab === 'library' ? (
    libraryPage
  ) : competitiveTab === 'faq' ? (
    <CmaFaqPage focusSection={faqFocus} onFocusHandled={() => setFaqFocus(undefined)} />
  ) : (
    setupPage
  );

  return (
    <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      <CompetitiveSidebar
        active={competitiveTab}
        onChange={setCompetitiveTab}
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((c) => !c)}
      />
      <main className="flex-1 overflow-auto" style={{ minHeight: 0, padding: 20 }}>
        {/* Region maps/tables are wide — give the region tabs a wider container
            so the map + rosters aren't cramped; the comparison tabs keep the
            executive max-w-6xl reading column. */}
        <div className={`${isRegionTab ? 'max-w-none' : 'max-w-6xl'} mx-auto space-y-5`}>
          {/* ── Header + template buttons ─────────────────────────────── */}
          <header className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div
                className="text-[10px] tracking-[0.04em] font-semibold"
                style={{ color: 'var(--interactive)' }}
              >
                Competitive Offering
              </div>
              <h1
                className="text-text-primary font-bold mt-1"
                style={{ fontSize: 22, letterSpacing: '-0.01em' }}
              >
                {COMPETITIVE_TAB_TITLE[competitiveTab]}
              </h1>
              <p className="text-text-secondary text-xs mt-1 leading-relaxed max-w-2xl">
                {COMPETITIVE_TAB_BLURB[competitiveTab]}
              </p>
            </div>
            {/* The equivalency-upload buttons are Competitive-specific; hide on
                the Region sub-pages, on Comparison setup (the public-data pill
                there links to the FAQ instead — no Excel up/download), on the
                read-only FAQ doc page, on Pricing + Rate library (cost/rate
                surfaces — the equivalency Excel is out of place there), and on
                the Specs page (it's a read-only spec comparison — the template
                up/download doesn't belong on it). */}
            {!isRegionTab &&
              competitiveTab !== 'start-here' &&
              competitiveTab !== 'setup' &&
              competitiveTab !== 'faq' &&
              competitiveTab !== 'pricing' &&
              competitiveTab !== 'compare' &&
              competitiveTab !== 'library' && <EquivalencyTemplateButtons />}
            {/* On Comparison setup the public-data pill rides the header line
                (next to the title) rather than sitting as its own row below the
                blurb — keeps the setup body tighter for the equivalents table. */}
            {competitiveTab === 'setup' && (
              <div style={{ alignSelf: 'flex-start', marginTop: 20 }}>
                <PublicDataPill asOf={LIVE_CATALOG_AS_OF} onMoreInfo={() => openFaqAt('data')} />
              </div>
            )}
          </header>

          {pageContent}
        </div>
      </main>
    </div>
  );
}

// ── Competitive sub-page sidebar ────────────────────────────────────────
// Mirrors the simulator's NavRail: a fixed left rail with grouped, focused
// destinations; tinted-fill active state; ink text; no stripes/glow. The
// content pane (the <main> above) is what scrolls.
const COMPETITIVE_TAB_TITLE: Record<CompetitiveTab, string> = {
  'start-here': 'Start Here',
  setup: 'Comparison Setup',
  'executive-summary': 'Executive Summary',
  compare: 'Specs',
  pricing: 'Pricing',
  'region-availability': 'Region Availability',
  'region-coverage': 'Coverage',
  library: 'Rate Library',
  faq: 'FAQ & Glossary',
};
const COMPETITIVE_TAB_BLURB: Record<CompetitiveTab, string> = {
  'start-here':
    'What cross-cloud sourcing question this half answers, what each page here is for, and a worked example in one click.',
  setup:
    'Set the base cloud, choose a focus, and pick a VM — one shared config that drives every comparison and region view.',
  'executive-summary':
    'A one-glance briefing: the verdict, KPIs, situational best-at and cost headline for the active comparison row.',
  compare:
    'Side-by-side specs against cross-cloud analogs, plus a key-difference takeaway (generation, architecture, bare-metal, network) per VM.',
  pricing:
    'An interactive cost estimator — pick quantity, region and duration per cloud — plus 1 month / 1 year / 3 year rate bars.',
  library:
    'Reference rate card: the per-region PAYG / 1-year / 3-year price for the anchor VM in every region it’s offered.',
  'region-availability':
    'Where each cloud offers the products you care about — scoped by the filter, shown on a map or roster.',
  'region-coverage':
    'The executive coverage read: who serves it where, who leads, the overlap, and the market gaps.',
  faq: 'A complete guide to every page and engine — setup, specs, pricing, region equivalency, the matching score, and where the data comes from — plus a glossary.',
};

// ── Rail icons — one restrained 24-grid stroke icon per destination, drawn in
// currentColor so each inherits the rail's active/idle tint. Mirrors the
// simulator NavRail's icon language (17px, 1.6 stroke, rounded joins). ───────
function RailSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const IconStartHere = ( // compass — the front door
  <RailSvg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m14.8 9.2-1.6 4.2-4.2 1.6 1.6-4.2 4.2-1.6Z" />
  </RailSvg>
);
const IconSetup = ( // sliders — the control center
  <RailSvg>
    <path d="M5 4v6M5 14v6M12 4v3M12 11v9M19 4v9M19 17v3" />
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="9" r="2" />
    <circle cx="19" cy="15" r="2" />
  </RailSvg>
);
const IconExecSummary = ( // briefing document with a star
  <RailSvg>
    <path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V3.5Z" />
    <path d="M13.5 3.5V8h4" />
    <path d="M9 12.5h6M9 16h4" />
  </RailSvg>
);
const IconGlance = ( // dashboard panels
  <RailSvg>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1" />
  </RailSvg>
);
const IconCompare = ( // two columns side by side
  <RailSvg>
    <rect x="3.5" y="4" width="7" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="7" height="16" rx="1.5" />
    <path d="M7 8.5h.01M17 8.5h.01" />
  </RailSvg>
);
const IconPricing = ( // dollar
  <RailSvg>
    <path d="M12 3v18" />
    <path d="M16.5 7a3.5 3.5 0 0 0-3.5-2.5h-1.2a3 3 0 0 0 0 6h1.4a3 3 0 0 1 0 6H12a3.5 3.5 0 0 1-3.5-2.5" />
  </RailSvg>
);
const IconRegionMap = ( // folded map
  <RailSvg>
    <path d="M9 4 3.5 6v13.5L9 17.5l6 2 5.5-2V4l-5.5 2L9 4Z" />
    <path d="M9 4v13.5" />
    <path d="M15 6v13.5" />
  </RailSvg>
);
const IconCoverage = ( // globe
  <RailSvg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" />
  </RailSvg>
);
const IconFaq = ( // help — circled question mark
  <RailSvg>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9.3a2.8 2.8 0 0 1 5.3 1c0 1.9-2.7 2.2-2.7 3.7" />
    <path d="M12 17.3h.01" />
  </RailSvg>
);

type CompetitiveNavItem = { tab: CompetitiveTab; label: string; hint: string; icon: React.ReactNode };
const COMPETITIVE_NAV: { group: string; items: CompetitiveNavItem[] }[] = [
  {
    group: 'Set up',
    items: [
      { tab: 'start-here', label: 'Start Here', hint: 'What this half answers, what each page does, and a one-click worked example', icon: IconStartHere },
      { tab: 'setup', label: 'Comparison Setup', hint: 'Base cloud, VM pick & focus — drives every view', icon: IconSetup },
    ],
  },
  {
    // v2.52.22 — the Compare section now holds every analysis page: Executive
    // Summary, Specs, Pricing, Region Availability and the Rate Library. (FAQ &
    // Glossary moved down beside the collapse control.)
    group: 'Compare',
    items: [
      { tab: 'executive-summary', label: 'Executive Summary', hint: 'One-glance verdict, KPIs, best-at & cost', icon: IconExecSummary },
      { tab: 'compare', label: 'Specs', hint: 'Side-by-side specs + key-difference takeaways', icon: IconCompare },
      { tab: 'pricing', label: 'Pricing', hint: 'Interactive cost estimator + 1mo / 1yr / 3yr rate bars', icon: IconPricing },
      { tab: 'region-availability', label: 'Region Availability', hint: 'Where it’s offered · map + roster + gaps', icon: IconRegionMap },
      { tab: 'library', label: 'Rate Library', hint: 'Per-region PAYG / 1yr / 3yr rate card for any VM', icon: IconPricing },
    ],
  },
];

// FAQ & Glossary lives beside the collapse control (bottom of the rail), not in
// the main groups — kept separate so the analysis pages stay together above.
const COMPETITIVE_FAQ_ITEM: CompetitiveNavItem = {
  tab: 'faq',
  label: 'FAQ & Glossary',
  hint: 'How best-match, % similarity, region equivalency & data refresh work',
  icon: IconFaq,
};

function CompetitiveSidebar({
  active,
  onChange,
  collapsed,
  onToggleCollapse,
}: {
  active: CompetitiveTab;
  onChange: (t: CompetitiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <nav
      className="flex-shrink-0 flex flex-col h-full"
      style={{
        width: collapsed ? 56 : 224,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        transition: 'width 180ms var(--ease-out)',
      }}
      aria-label="Competitive offering navigation"
    >
      <div className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'thin' }}>
        {COMPETITIVE_NAV.map((grp, gi) => (
          <div key={grp.group}>
            {collapsed ? (
              gi > 0 && <div className="mx-3 my-2 h-px" style={{ background: 'var(--border-dark)' }} />
            ) : (
              <div
                className="px-4 pb-1 text-[10px] font-semibold tracking-[0.05em]"
                style={{ color: 'var(--text-dim)', paddingTop: gi === 0 ? 2 : 16 }}
              >
                {grp.group}
              </div>
            )}
            {grp.items.map(({ tab, label, hint, icon }) => {
              const isActive = active === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onChange(tab)}
                  className="relative w-full flex items-center gap-2.5 transition-colors"
                  style={{
                    padding: collapsed ? '9px 0' : '7px 10px',
                    margin: collapsed ? '1px 0' : '1px 8px',
                    width: collapsed ? '100%' : 'calc(100% - 16px)',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: collapsed ? 0 : 'var(--radius-sm)',
                    background: isActive ? 'var(--interactive-muted)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background = 'var(--tint-soft-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                  title={collapsed ? `${label} — ${hint}` : hint}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 grid place-items-center"
                    style={{
                      width: 20,
                      color: isActive ? 'var(--interactive)' : 'var(--text-muted)',
                    }}
                  >
                    {icon}
                  </span>
                  {!collapsed && <span className="min-w-0 truncate">{label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom zone — FAQ & Glossary then the collapse toggle. */}
      <div className="flex-shrink-0 py-2" style={{ borderTop: '1px solid var(--border-dark)' }}>
        {(() => {
          const { tab, label, hint, icon } = COMPETITIVE_FAQ_ITEM;
          const isActive = active === tab;
          return (
            <button
              type="button"
              onClick={() => onChange(tab)}
              className="relative w-full flex items-center gap-2.5 transition-colors"
              style={{
                padding: collapsed ? '9px 0' : '7px 10px',
                margin: collapsed ? '1px 0' : '1px 8px',
                width: collapsed ? '100%' : 'calc(100% - 16px)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: collapsed ? 0 : 'var(--radius-sm)',
                background: isActive ? 'var(--interactive-muted)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = 'var(--tint-soft-2)';
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              title={collapsed ? `${label} — ${hint}` : hint}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                aria-hidden="true"
                className="flex-shrink-0 grid place-items-center"
                style={{ width: 20, color: isActive ? 'var(--interactive)' : 'var(--text-muted)' }}
              >
                {icon}
              </span>
              {!collapsed && <span className="min-w-0 truncate">{label}</span>}
            </button>
          );
        })()}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-2.5 transition-colors"
          style={{
            padding: collapsed ? '8px 0' : '8px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--text-dim)',
            fontSize: 11,
            cursor: 'pointer',
          }}
          title={collapsed ? 'Expand the navigation rail' : 'Collapse to icons'}
          aria-label={collapsed ? 'Expand the navigation rail' : 'Collapse the navigation rail'}
        >
          <span aria-hidden="true" style={{ fontSize: 12 }}>
            {collapsed ? '»' : '«'}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.15 helpers — option builders + memory-category compactor.
// ────────────────────────────────────────────────────────────────────────
function optionForVm(v: UserVm, _providerLabel: string): DropdownOption {
  // v2.17.15 — Provider name removed from `meta`; the column header above
  // each dropdown already says Azure / AWS / GCP, so repeating it inside
  // every row is noise. Keeping the spec dimensions (vCPU + memory) since
  // those vary per SKU and are the real reason the meta exists.
  const memDisp =
    v.memoryGib >= 1024
      ? `${(v.memoryGib / 1024).toFixed(1)} TiB`
      : `${v.memoryGib} GiB`;
  return {
    value: v.vmSizeName,
    label: v.vmSizeName,
    meta: `${v.vcpus} vCPU · ${memDisp}`,
  };
}

/**
 * v2.17.16 — Spec-based closest-match finder. Used as a fallback when the
 * curated equivalency seed (`src/data/equivalencySeed.ts`) doesn't have an
 * entry for the user's pick. Walks the target provider's catalog and
 * picks the candidate that minimizes the distance on:
 *   1. Category (HARD constraint — Memory Optimized only matches Memory
 *      Optimized, GPU only matches GPU, etc.). No match across categories.
 *   2. Memory (primary): weight = 1.0. log-scaled so 32 GiB → 64 GiB is
 *      the same "distance" as 1 TiB → 2 TiB. Memory is the dominant
 *      sizing axis for capacity planning.
 *   3. vCPU (secondary): weight = 0.3. log-scaled.
 *   4. Accelerator tie-break (GPU instances): same accelerator family
 *      counts as a perfect bonus.
 *
 * Equivalencies established this way are "similar spec / similar
 * processor class / similar performance band" matches — same intent as
 * the curated seed, just computed instead of hand-curated. When the
 * seed has a row, that one wins.
 */
function findClosestSpecMatch(
  source: UserVm,
  targetProvider: 'Azure' | 'AWS' | 'GCP',
  catalog: UserVm[],
): UserVm | null {
  if (!source.vcpus || !source.memoryGib) return null;
  const sourceCat = source.category ?? null;
  // Score = lower is better. log-scale ratios → symmetric on either side.
  let bestRow: UserVm | null = null;
  let bestScore = Infinity;
  const seen = new Set<string>();
  for (const v of catalog) {
    if ((v.provider ?? '') !== targetProvider) continue;
    if (!v.vcpus || !v.memoryGib) continue;
    // Dedupe by SKU so the same SKU across multiple regions doesn't
    // dominate the search.
    if (seen.has(v.vmSizeName)) continue;
    seen.add(v.vmSizeName);
    // HARD constraint: same category. Otherwise we'd "match" a memory
    // VM to a GPU VM just because the vCPU count is close.
    if (sourceCat && v.category && sourceCat !== v.category) continue;
    const memRatio = Math.log(v.memoryGib / source.memoryGib);
    const cpuRatio = Math.log(v.vcpus / source.vcpus);
    let score = Math.abs(memRatio) * 1.0 + Math.abs(cpuRatio) * 0.3;
    // Accelerator tie-break — both must be GPU and same model strongly
    // preferred. Empty/None on both is neutral.
    const sAcc = (source.acceleratorType ?? 'None').toLowerCase();
    const tAcc = (v.acceleratorType ?? 'None').toLowerCase();
    if (sAcc !== 'none' && tAcc !== 'none') {
      // Both have accelerators — reward partial-string overlap (e.g.
      // "NVIDIA H100" matches "NVIDIA H100 80GB"). Penalize mismatch.
      const sharesToken = sAcc.split(/\s+/).some((tok) => tok.length > 2 && tAcc.includes(tok));
      if (!sharesToken) score += 0.5;
    } else if (sAcc !== tAcc) {
      // One has accelerator, the other doesn't — that's not a similar VM.
      score += 1.0;
    }
    if (score < bestScore) {
      bestScore = score;
      bestRow = v;
    }
  }
  return bestRow;
}

// S66-FIX-C — the private pctTone copy that lived here (identical body) is
// deleted; the module imports the ONE shared `pctTone` from compare/ui/tokens.

/** v2.28.1 / v2.29.1 — Processor string + its microarchitecture generation.
 *  When the catalog carries a processor ("Intel Xeon Platinum 8175" → "… ·
 *  Skylake"). Azure live specs carry NO processor, so we fall back to the
 *  series-inferred generation ("Sapphire Rapids" for an Msv3) rather than a bare
 *  "—". Doesn't duplicate a gen name already present (GCP's "Cascade Lake/Ice
 *  Lake"). */
function cpuLabel(row: Pick<CatalogEntry, 'processor' | 'provider' | 'vmSizeName'>): string {
  const proc = (row.processor ?? '').trim();
  const g = genFor(row);
  if (!proc) return g ? `${g.label} (inferred)` : '—';
  if (!g) return proc;
  if (proc.toLowerCase().includes(g.label.toLowerCase())) return proc;
  return `${proc} · ${g.label}`;
}

/** v2.27.9 — Similarity of `row` to the base-cloud `baseRow`, via the shared
 *  cross-cloud equivalence engine (category-gated specs + arch). null when
 *  either side is missing a catalog row to compare.
 *
 *  S66-FIX-C — this is now the ONE picked-pair match% path for every surface on
 *  this page (Specs showdown columns, exec tradeoffs, export family stories,
 *  the normalized-rate table), so they can never disagree with each other.
 *  S66 integration — body delegates to specShowdownMath.pairMatchPct, the same
 *  opts-aware kernel the dock (CompareTable) scores with, closing the
 *  ≈93%-vs-94% dock/verdict drift for penalized (confidential-bridge /
 *  cross-category) pairs. */
function pctVsBase(
  baseRow: CatalogEntry | null,
  row: CatalogEntry | null,
): number | null {
  if (!baseRow || !row) return null;
  return pairMatchPct(baseRow, row);
}

/** v2.27.10 — Geographic similarity (0–100) of a region vs the base region:
 *  same country scores high (scaled by intra-country distance), else falls off
 *  with great-circle distance. null when either region's geo is unknown. */
function regionSimPct(
  baseProvider: string,
  baseRegion: string,
  targetProvider: string,
  targetRegion: string,
): number | null {
  const a = resolveRegionGeo(baseProvider, baseRegion);
  const b = resolveRegionGeo(targetProvider, targetRegion);
  if (!a || !b) return null;
  const km = haversineKm(a, b);
  if (a.cc === b.cc) return Math.max(88, Math.round(100 - km / 700));
  return Math.max(1, Math.round(100 - km / 130));
}

/** v2.27.10 — Family similarity (0–100): average, over the target family's
 *  sizes, of the closest spec match to any base-family size. Capped for cost. */
function familySimPct(
  baseSizes: UserVm[],
  targetSizes: UserVm[],
): number | null {
  if (baseSizes.length === 0 || targetSizes.length === 0) return null;
  const bases = baseSizes.slice(0, 24).map(vmFeatures);
  let sum = 0;
  let n = 0;
  for (const t of targetSizes.slice(0, 24)) {
    const tf = vmFeatures(t);
    let best = Infinity;
    for (const bf of bases) {
      const d = vmDistance(tf, bf);
      if (d < best) best = d;
    }
    if (isFinite(best)) {
      sum += matchPct(best);
      n += 1;
    }
  }
  return n ? Math.round(sum / n) : null;
}

/** v2.27.10 — Decorate a non-base dropdown's options with their ≈% match to the
 *  base cloud's pick (from `map`), and sort closest-first. Options with no match
 *  keep their place after the scored ones. No-op on the base cloud / no base pick. */
function withDimMatch(
  options: DropdownOption[],
  map: Record<string, number> | undefined,
  basePicked: boolean,
): DropdownOption[] {
  if (!map || !basePicked) return options;
  const decorated = options.map((o) => {
    const pct = map[o.value];
    if (pct == null) return o;
    return { ...o, meta: o.meta ? `≈${pct}% · ${o.meta}` : `≈${pct}% match` };
  });
  return decorated.sort((a, b) => {
    const pa = map[a.value];
    const pb = map[b.value];
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return pb - pa;
  });
}

/** v2.16 — Color for the equivalency-available dot next to a SKU name. */
function equivDotColor(provider: string): string {
  if (provider === 'Azure') return '#60A5FA';
  if (provider === 'AWS') return '#FBBF24';
  if (provider === 'GCP') return '#F87171';
  return '#818CF8';
}

/** Compact memory-category code (MM / HM / VHM) from the full label. */
function memoryCategoryLabel(
  full: 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)',
): string {
  if (full === 'Very High Memory (VHM)') return 'VHM';
  if (full === 'High Memory (HM)') return 'HM';
  return 'MM';
}

// ────────────────────────────────────────────────────────────────────────
// FilterCard — shared shell for each step of the cascade.
// ────────────────────────────────────────────────────────────────────────
// v2.38 — RegionRateTable — the anchor VM's PAYG / 1-yr / 3-yr rate in each
// selected region (cheapest first; the cheapest row is accented). Drives the
// region-aware Pricing view: the respective rate for every region in scope.
function RegionRateTable({
  rates,
  provider,
  vmSizeName,
}: {
  rates: RegionRate[];
  provider: string;
  vmSizeName: string;
}) {
  if (rates.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        No per-region rates for {provider} {vmSizeName} in the selected scope.
      </div>
    );
  }
  const usd = (n: number | null) => (n == null ? '—' : `$${n.toFixed(3)}`);
  const cheapestPayg = rates.find((r) => r.payg != null)?.payg ?? null;
  const cols = '1.4fr repeat(3, 1fr)';
  return (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div
        className="grid items-center text-[9px] tracking-[0.04em] font-semibold uppercase px-1 pb-1.5"
        style={{ gridTemplateColumns: cols, gap: 6, color: 'var(--text-muted)' }}
      >
        <span>Region</span>
        <span className="text-right">PAYG /hr</span>
        <span className="text-right">1-yr /hr</span>
        <span className="text-right">3-yr /hr</span>
      </div>
      <div className="space-y-0.5">
        {rates.map((r) => {
          const isCheapest = r.payg != null && r.payg === cheapestPayg;
          return (
            <div
              key={r.region}
              className="grid items-center px-1.5 py-1"
              style={{
                gridTemplateColumns: cols,
                gap: 6,
                borderRadius: 'var(--radius-md)',
                background: isCheapest ? 'rgba(52,211,153,0.10)' : 'transparent',
              }}
            >
              <span
                className="text-[11px] truncate flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
                title={r.region}
              >
                {r.region}
                {isCheapest && (
                  <span
                    className="text-[8px] font-semibold tracking-[0.04em] px-1 py-0.5 shrink-0"
                    style={{ color: '#34D399', background: 'rgba(52,211,153,0.14)', borderRadius: 999 }}
                  >
                    CHEAPEST
                  </span>
                )}
              </span>
              <span className="text-[11px] text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {usd(r.payg)}
              </span>
              <span className="text-[11px] text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {usd(r.ri1)}
              </span>
              <span className="text-[11px] text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {usd(r.ri3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// CollapsibleSetupHeader + SetupStepCard moved to ./SetupStep (shared with the
// Region Availability filter so both render the same one-box collapsing stepper).

// v2.43.6 — Compact "public vendor data" pill (replaces the verbose disclaimer
// box on the CMA pages). States the as-of date and links to the FAQ's data-and-
// refresh section instead of carrying source links + Excel up/download copy.
// Render an ISO "YYYY-MM-DD" catalog date as mm/dd/yy for the public-data pill.
function formatAsOfMdY(iso: string): string {
  const [y, m, d] = (iso ?? '').split('-');
  return y && m && d ? `${m}/${d}/${y.slice(2)}` : iso;
}

function PublicDataPill({ asOf, onMoreInfo }: { asOf: string; onMoreInfo: () => void }) {
  return (
    <button
      type="button"
      onClick={onMoreInfo}
      title="How this data is pulled and refreshed — opens the FAQ"
      className="inline-flex items-center gap-2 text-[11px] transition-colors"
      style={{
        background: 'rgba(96, 165, 250, 0.06)',
        border: '1px solid rgba(96, 165, 250, 0.25)',
        borderRadius: 'var(--radius-pill)',
        padding: '5px 12px',
        cursor: 'pointer',
      }}
    >
      <span className="font-semibold" style={{ color: '#93C5FD' }}>
        ⓘ Public Data
      </span>
      <span style={{ color: 'var(--text-muted)' }}>·</span>
      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
        last refresh: {formatAsOfMdY(asOf)}
      </span>
      <span className="inline-flex items-center gap-1 ml-1" style={{ color: '#93C5FD' }}>
        <span
          className="inline-flex items-center justify-center font-semibold"
          style={{ width: 14, height: 14, borderRadius: 999, border: '1px solid rgba(147,197,253,0.45)', fontSize: 9 }}
        >
          ?
        </span>
        <span className="text-[10px]">How it works</span>
      </span>
    </button>
  );
}

function FilterCard({
  label,
  hint,
  disabled,
  children,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass"
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <span
          className="text-[10px] tracking-[0.04em] font-semibold"
          style={{ color: 'var(--interactive)' }}
        >
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-text-muted normal-case tracking-normal">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ChipMultiSelect — generic value-set toggle pills.
// ────────────────────────────────────────────────────────────────────────
function ChipMultiSelect({
  values,
  active,
  onToggle,
  onClear,
}: {
  values: string[];
  active: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  if (values.length === 0) {
    return (
      <div className="text-[11px] text-text-muted italic">
        Nothing available with the current upstream filters.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {values.map((v) => {
        const isActive = active.has(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className="text-[10px] font-mono transition-all"
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--radius-pill)',
              background: isActive
                ? 'rgba(129, 140, 248, 0.14)'
                : 'rgba(255,255,255,0.03)',
              color: isActive ? 'var(--interactive)' : 'var(--text-secondary)',
              border: `1px solid ${
                isActive ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'
              }`,
            }}
            aria-pressed={isActive}
          >
            {v}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] tracking-[0.04em] text-text-muted hover:text-interactive transition-colors ml-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// findAzureParent — reverse equivalency lookup.
// ────────────────────────────────────────────────────────────────────────
function findAzureParent(
  sku: string,
  equivalency: EquivalencyEntry[],
): string | null {
  const lower = sku.toLowerCase();
  for (const e of equivalency) {
    if (
      (e.awsSku ?? '').toLowerCase() === lower ||
      (e.gcpSku ?? '').toLowerCase() === lower
    ) {
      return e.azureSku ?? null;
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────
// Equivalents table — three columns, one per provider, baseline first.
// ────────────────────────────────────────────────────────────────────────
/**
 * v2.52.6 — Consolidated cross-cloud spec comparison. Replaces the old
 * side-by-side (per-cloud spec CARDS) + the separate metric BAR GRID, which
 * repeated vCPU / Memory / Network as both numbers and bars. This is ONE panel:
 *   • a per-cloud identity header (provider · SKU · Base/≈match%),
 *   • one row per numeric spec (Memory / vCPU / Network / NICs / Local NVMe /
 *     Remote disks) showing all clouds' bars + values with a ★ leader — each
 *     metric appears exactly once,
 *   • a CPU/architecture text row (slash labels carry the "either microarch"
 *     tooltip), an Accelerator row, and per-cloud Alternatives + notes.
 * Region is intentionally dropped — it has no bearing on specs.
 */
function ConsolidatedSpecCompare({
  baseline,
  aws,
  gcp,
  awsAlternatives,
  gcpAlternatives,
  baselineProvider,
}: {
  baseline: CatalogEntry;
  aws: EquivalentMatch | null;
  gcp: EquivalentMatch | null;
  awsAlternatives: EquivalentMatch[];
  gcpAlternatives: EquivalentMatch[];
  baselineProvider: 'Azure' | 'AWS' | 'GCP';
}) {
  const ALL: ('Azure' | 'AWS' | 'GCP')[] = ['Azure', 'AWS', 'GCP'];
  const rowBy: Record<'Azure' | 'AWS' | 'GCP', CatalogEntry | null> = {
    Azure: baseline,
    AWS: aws?.catalogRow ?? null,
    GCP: gcp?.catalogRow ?? null,
  };
  const skuBy: Record<'Azure' | 'AWS' | 'GCP', string | null> = {
    Azure: baseline.vmSizeName,
    AWS: aws?.sku ?? null,
    GCP: gcp?.sku ?? null,
  };
  const altBy: Record<'Azure' | 'AWS' | 'GCP', EquivalentMatch[]> = {
    Azure: [],
    AWS: awsAlternatives,
    GCP: gcpAlternatives,
  };
  const notesBy: Record<'Azure' | 'AWS' | 'GCP', string | undefined> = {
    Azure: undefined,
    AWS: aws?.notes,
    GCP: gcp?.notes,
  };
  const baseRow = rowBy[baselineProvider];
  // Base cloud first (leftmost), then the rest in canonical order.
  const providers = [...ALL].sort((a, b) =>
    a === baselineProvider ? -1 : b === baselineProvider ? 1 : 0,
  );

  type Dim = {
    label: string;
    accessor: (r: CatalogEntry) => number | undefined;
    // v2.52.34 — fmt receives the source row so curated-fallback network values
    // can render the honest "(est.)" marker (mirrors the CPU "(assumed)" precedent
    // + the spec-sheet "(est.)"). Only the Network row uses the row arg.
    fmt: (v: number, r?: CatalogEntry) => string;
  };
  const dims: Dim[] = [
    {
      label: 'Memory',
      accessor: (r) => r.memoryGib,
      fmt: (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} TiB` : `${v.toLocaleString()} GiB`),
    },
    { label: 'vCPU', accessor: (r) => r.vcpus, fmt: (v) => v.toLocaleString() },
    {
      label: 'Network',
      accessor: (r) => r.networkMbps,
      fmt: (v, r) => {
        const base = v >= 1000 ? `${(v / 1000).toFixed(0)} Gbps` : `${v.toLocaleString()} Mbps`;
        return r?.networkEstimated ? `${base} (est.)` : base;
      },
    },
    { label: 'NICs', accessor: (r) => r.networkNicCount ?? undefined, fmt: (v) => String(v) },
    {
      label: 'Local NVMe',
      accessor: (r) => r.localStorageGiB ?? undefined,
      fmt: (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} TiB` : `${v.toLocaleString()} GiB`),
    },
    {
      label: 'Remote disks',
      accessor: (r) => r.remoteStorageDisks ?? undefined,
      fmt: (v) => String(v),
    },
  ];
  const valOf = (p: 'Azure' | 'AWS' | 'GCP', d: Dim): number | undefined => {
    const r = rowBy[p];
    return r ? d.accessor(r) : undefined;
  };
  const usedDims = dims.filter((d) =>
    providers.some((p) => {
      const v = valOf(p, d);
      return typeof v === 'number' && v > 0;
    }),
  );
  const anyAccel = providers.some((p) => {
    const a = rowBy[p]?.acceleratorType;
    return a && a !== 'None';
  });
  const anyAlts = providers.some((p) => altBy[p].length > 0);
  const anyNotes = providers.some((p) => !!notesBy[p]);

  const gridCols = `96px repeat(${providers.length}, minmax(0, 1fr))`;

  return (
    <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)' }}>
      {/* Identity header — provider · Base/≈match% · SKU. */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'end' }}>
        <div />
        {providers.map((p) => {
          const tone = providerTone(p);
          const isBase = p === baselineProvider;
          const pct = isBase ? null : pctVsBase(baseRow, rowBy[p]);
          const sku = skuBy[p];
          return (
            <div key={p} className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] tracking-[0.04em] font-semibold"
                  style={{ color: tone.fg }}
                >
                  {p}
                </span>
                {isBase ? (
                  <span
                    className="text-[9px] tracking-[0.04em] px-1.5 py-0.5"
                    style={{
                      color: 'var(--interactive)',
                      background: 'rgba(129, 140, 248, 0.10)',
                      border: '1px solid var(--border-glow)',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    Base
                  </span>
                ) : (
                  pct != null && (
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: pctTone(pct) }}
                      title="Similarity to the base cloud's pick (specs · performance · hardware). Equivalents are similar, not exact."
                    >
                      ≈{pct}% match
                    </span>
                  )
                )}
              </div>
              <span
                className="font-mono font-semibold text-text-primary"
                style={{ fontSize: 13, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={sku ?? undefined}
              >
                {sku ?? '— no match'}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="mt-3 pt-3 space-y-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {/* Numeric specs — one row each, all clouds as bars + values, ★ leader. */}
        {usedDims.map((dim) => {
          const max = Math.max(0, ...providers.map((p) => valOf(p, dim) ?? 0));
          return (
            <div
              key={dim.label}
              style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'center' }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {dim.label}
              </span>
              {providers.map((p) => {
                const v = valOf(p, dim);
                const has = typeof v === 'number' && v > 0;
                const pct = has && max > 0 ? Math.max(3, (v! / max) * 100) : 0;
                const leader = has && v === max && max > 0;
                const tone = providerTone(p);
                return (
                  <div key={p} className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-[10px]"
                      style={{
                        minWidth: 66,
                        textAlign: 'right',
                        flexShrink: 0,
                        color: leader ? tone.fg : 'var(--text-primary)',
                        fontWeight: leader ? 600 : 400,
                      }}
                    >
                      {has ? dim.fmt(v!, rowBy[p] ?? undefined) : '—'}
                      {leader && <span style={{ marginLeft: 3, fontSize: 8, opacity: 0.7 }}>★</span>}
                    </span>
                    <div
                      className="relative flex-1"
                      style={{
                        height: 10,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      {has && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${pct}%`,
                            background: tone.fg,
                            opacity: leader ? 0.95 : 0.55,
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* CPU / architecture — categorical, no bar. Slash labels (e.g. GCP n2
            "Cascade Lake/Ice Lake") get an "either microarch" tooltip. */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'start' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            CPU
          </span>
          {providers.map((p) => {
            const r = rowBy[p];
            const label = r ? cpuLabel(r) : '—';
            const span = label.includes('/');
            return (
              <span
                key={p}
                className="font-mono text-[10px] leading-snug"
                style={{ color: 'var(--text-secondary)' }}
                title={
                  span
                    ? `Scheduled across either microarchitecture (${label.replace('/', ' or ')}) — the cloud picks, you don't. Both rank as the same generation.`
                    : undefined
                }
              >
                {span ? label.replace('/', ' or ') : label}
              </span>
            );
          })}
        </div>

        {/* Accelerator — only when at least one cloud has one. */}
        {anyAccel && (
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'start' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Accelerator
            </span>
            {providers.map((p) => {
              const a = rowBy[p]?.acceleratorType;
              return (
                <span key={p} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {a && a !== 'None' ? a : '—'}
                </span>
              );
            })}
          </div>
        )}

        {/* Alternatives — per-cloud runner-up SKUs. */}
        {anyAlts && (
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'start' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Alternatives
            </span>
            {providers.map((p) => (
              <div key={p} className="flex flex-wrap gap-1">
                {altBy[p].length === 0 ? (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    —
                  </span>
                ) : (
                  altBy[p].map((a) => (
                    <span
                      key={a.sku}
                      className="text-[9px] font-mono px-1.5 py-0.5"
                      style={{
                        color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 'var(--radius-pill)',
                      }}
                      title={a.notes}
                    >
                      {a.sku}
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-cloud equivalency notes. */}
      {anyNotes && (
        <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          {providers.map((p) => {
            const n = notesBy[p];
            if (!n) return null;
            const tone = providerTone(p);
            return (
              <p key={p} className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: tone.fg, fontWeight: 600 }}>{p}:</span> {n}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ────────────────────────────────────────────────────────────────────────
// Equivalency template buttons (download / upload).
// ────────────────────────────────────────────────────────────────────────
function EquivalencyTemplateButtons() {
  const { state, dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onDownload = () => {
    downloadEquivalencyXlsx(state.userEquivalency, 'equivalency-template.xlsx');
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseEquivalencyXlsx(file);
      dispatch({ type: 'EQUIVALENCY_REPLACE', entries: result.entries });
      const warn = result.warnings.length > 0 ? ` (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})` : '';
      setFeedback(`Imported ${result.entries.length} equivalency row${result.entries.length === 1 ? '' : 's'}${warn}`);
    } catch (err) {
      setFeedback(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onDownload}
        type="button"
        className="text-[10px] tracking-[0.04em] font-semibold transition-colors hover:bg-white/[0.04]"
        style={{
          padding: '5px 12px',
          border: '1px solid var(--border)',
          color: 'var(--interactive)',
          borderRadius: 'var(--radius-pill)',
        }}
        title="Download the current equivalency table as an Excel template"
      >
        ⤓ Template
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        type="button"
        className="text-[10px] tracking-[0.04em] font-semibold transition-colors hover:bg-white/[0.04]"
        style={{
          padding: '5px 12px',
          border: '1px solid var(--border)',
          color: 'var(--interactive)',
          borderRadius: 'var(--radius-pill)',
        }}
        title="Upload an edited Equivalency Excel to replace the current table"
      >
        ⤒ Upload
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xlsm,.xls"
        style={{ display: 'none' }}
        onChange={onUpload}
      />
      {feedback && (
        <span className="text-[10px] text-text-muted">{feedback}</span>
      )}
    </div>
  );
}

function EmptyEquivalencyHint() {
  return (
    <div
      className="glass text-[11px] text-text-secondary leading-relaxed"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      <strong style={{ color: 'var(--interactive)' }}>● No equivalency rows authored.</strong>{' '}
      Download the template above, map Azure SKUs to their AWS + GCP analogs,
      and re-upload. The public seed should populate on first init — if you
      cleared your browser storage, refresh to re-seed.
    </div>
  );
}

/**
 * v2.41 — Selected VM specs. For each UNIQUE VM in the comparison table (the
 * union of every cloud's picks, deduped, in column order), a one-row spec sheet:
 * vCPU / memory / network / category / PAYG rate. Replaces the old verdict-style
 * "apples-to-apples preview" — the user asked for the raw specs, not a verdict.
 */
function SelectedVmSpecs({
  compareByProvider,
  orderedClouds,
  userVms,
  baseProvider,
  baseRegion,
}: {
  compareByProvider: Record<string, string[]>;
  orderedClouds: ('Azure' | 'AWS' | 'GCP')[];
  userVms: CatalogEntry[];
  /** S65 — pricing-surface consistency: resolve each row REGION-MATCHED to the
   *  base region the bars/matrix/verdict price at, instead of whichever
   *  catalog row happens to come first (alphabetical-first region). */
  baseProvider?: 'Azure' | 'AWS' | 'GCP';
  baseRegion?: string;
}) {
  // v2.41 — Resolve specs by exact provider|size, then fall back to size-only
  // (some catalog SKUs aren't keyed by the provider tag we hold), and ALWAYS
  // render a row per unique selected VM even if specs can't be resolved — the
  // user must never see a selected VM silently vanish from this list.
  // S65 — collect EVERY region row per selected key (not just the first), so
  // the rate shown here agrees with the region-matched Pricing/Exec surfaces.
  const selectedKeys = new Set<string>();
  const selectedNames = new Set<string>();
  for (const p of orderedClouds) {
    for (const name of compareByProvider[p] ?? []) {
      selectedKeys.add(`${p}|${name}`);
      selectedNames.add(name);
    }
  }
  const rowsByKey = new Map<string, CatalogEntry[]>();
  const byName = new Map<string, CatalogEntry>();
  for (const v of userVms) {
    const key = `${v.provider}|${v.vmSizeName}`;
    if (selectedKeys.has(key)) {
      const list = rowsByKey.get(key);
      if (list) list.push(v);
      else rowsByKey.set(key, [v]);
    }
    if (selectedNames.has(v.vmSizeName) && !byName.has(v.vmSizeName)) byName.set(v.vmSizeName, v);
  }
  /** Pick the row priced at the base region (base cloud) or its nearest
   *  cross-cloud region peer (other clouds) — mirroring the Pricing surfaces. */
  const resolveEntry = (p: string, name: string): CatalogEntry | null => {
    const rows = rowsByKey.get(`${p}|${name}`) ?? [];
    if (rows.length === 0) return byName.get(name) ?? null;
    if (!baseRegion || !baseProvider) return rows[0];
    if (p === baseProvider) return rows.find((r) => r.region === baseRegion) ?? rows[0];
    const avail = [...new Set(rows.map((r) => r.region).filter((r): r is string => !!r))];
    const src = regionRefs(baseProvider, [baseRegion])[0] ?? null;
    const m = src ? bestRegionMatch(src, regionRefs(p as VmProvider, avail)) : null;
    return (m && rows.find((r) => r.region === m.region)) ?? rows[0];
  };
  const seen = new Set<string>();
  const items: { provider: string; name: string; entry: CatalogEntry | null }[] = [];
  for (const p of orderedClouds) {
    for (const name of compareByProvider[p] ?? []) {
      const key = `${p}|${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ provider: p, name, entry: resolveEntry(p, name) });
    }
  }
  if (items.length === 0) {
    return (
      <div
        className="glass text-[11px] text-text-muted italic"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        Tick VMs in the comparison table above to list their specs here — one row
        per unique selected VM size.
      </div>
    );
  }
  const th = 'px-2 py-1.5 text-[9px] tracking-[0.04em] font-semibold text-text-muted';
  const td = 'px-2 py-1.5 text-[11px] tabular-nums';
  return (
    <div className="glass overflow-x-auto" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: 580 }}>
        <thead>
          <tr>
            <th className={th}>VM size</th>
            <th className={th}>Cloud</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>vCPU</th>
            <th className={`${th} text-right`}>Memory</th>
            <th className={`${th} text-right`}>Network</th>
            <th className={`${th} text-right`}>$/hr · PAYG</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ provider, name, entry }) => {
            const tone = providerTone(provider as VmProvider);
            const cat = entry
              ? entry.category ?? categorize(entry.provider, entry.family)
              : '—';
            const net = entry
              ? `${
                  entry.networkMbps >= 1000
                    ? `${(entry.networkMbps / 1000).toFixed(0)} Gbps`
                    : `${entry.networkMbps} Mbps`
                }${entry.networkEstimated ? ' (est.)' : ''}`
              : '—';
            const price = entry?.hourlyUsd != null ? `$${entry.hourlyUsd.toFixed(3)}` : '—';
            return (
              <tr key={`${provider}|${name}`} style={{ borderTop: '1px solid var(--border)' }}>
                <td className={`${td} font-semibold`} style={{ color: 'var(--text-primary)' }}>
                  {name}
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5"
                    style={{
                      color: tone.fg,
                      background: tone.bg,
                      border: `1px solid ${tone.border}`,
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {provider}
                  </span>
                </td>
                <td className={td} style={{ color: 'var(--text-secondary)' }}>
                  {cat}
                </td>
                <td className={`${td} text-right`} style={{ color: 'var(--text-primary)' }}>
                  {entry ? entry.vcpus : '—'}
                </td>
                <td className={`${td} text-right`} style={{ color: 'var(--text-primary)' }}>
                  {entry ? `${entry.memoryGib} GiB` : '—'}
                </td>
                <td className={`${td} text-right`} style={{ color: 'var(--text-secondary)' }}>
                  {net}
                </td>
                <td
                  className={`${td} text-right`}
                  style={{ color: 'var(--text-secondary)' }}
                  title={entry?.region ? `Priced at ${entry.region}` : undefined}
                >
                  {price}
                  {entry?.region && price !== '—' && (
                    <span
                      className="block text-[9px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {entry.region}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.14 — HorizonSummary · cost over 1mo / 1yr / 3yr per provider.
// Cheapest column in each row highlighted. Shows BEST available rate
// alongside PAYG so the user sees the savings impact of commitment.
// ────────────────────────────────────────────────────────────────────────
function HorizonSummary({ horizons, term = 'payg' }: { horizons: HorizonCost[]; term?: Term }) {
  const cheapestByHorizon = (key: 'oneMonthBest' | 'oneYearBest' | 'threeYearBest') => {
    let best = Infinity;
    for (const h of horizons) {
      const v = h[key];
      if (v != null && v < best) best = v;
    }
    return best === Infinity ? null : best;
  };
  const cheap1m = cheapestByHorizon('oneMonthBest');
  const cheap1y = cheapestByHorizon('oneYearBest');
  const cheap3y = cheapestByHorizon('threeYearBest');
  // S66-FIX-C — term label from the ONE shared token source (was a private
  // ternary with slightly different phrasing: "1-yr" vs "1-year").
  const termLabel = termLabelLong(term);

  return (
    <div className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
      {/* Applied-rate caption — the matrix reprices with the Commitment-term toggle
          above, so name the tier every cell is priced at. */}
      <div
        className="text-[10px] text-text-muted"
        style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}
      >
        Priced at <strong style={{ color: 'var(--text-secondary)' }}>{termLabel}</strong> · totals
        over each horizon
      </div>
      <table className="w-full text-[11px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr
            className="text-[9px] tracking-[0.04em] text-text-muted"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Provider · SKU</th>
            <th style={{ padding: '8px 10px', textAlign: 'right' }}>1 Month</th>
            <th style={{ padding: '8px 10px', textAlign: 'right' }}>1 Year</th>
            <th style={{ padding: '8px 10px', textAlign: 'right' }}>3 Year</th>
            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {horizons.map((h) => {
            // S66-FIX-C — provider tone from the ONE shared source (was a
            // private inline ternary duplicating the tone hexes).
            const tone = providerTone(h.provider).fg;
            return (
              <tr
                key={`${h.provider}-${h.sku}`}
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td style={{ padding: '10px' }}>
                  <span
                    className="text-[10px] font-semibold tracking-[0.02em] mr-2"
                    style={{ color: tone }}
                  >
                    {h.provider}
                  </span>
                  <span className="font-mono text-text-primary">{h.sku || '—'}</span>
                  {(() => {
                    // A3 — the winning match's worst comparability caveat, so a
                    // horizon cost is never read as apples-to-apples when the
                    // underlying SKUs aren't a like-for-like swap.
                    const worst = worstCaveat(h.caveats ?? []);
                    if (!worst) return null;
                    const warn = worst.severity === 'warn';
                    return (
                      <span
                        className="text-[8.5px] font-semibold ml-2 align-middle"
                        style={{
                          padding: '0 5px',
                          lineHeight: '13px',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                          color: warn ? '#FBBF24' : 'var(--text-muted)',
                          background: warn ? 'rgba(251,191,36,0.10)' : 'var(--tint-soft)',
                          border: `1px solid ${warn ? 'rgba(251,191,36,0.32)' : 'var(--border)'}`,
                        }}
                        title={(h.caveats ?? []).map((c) => `${c.label}: ${c.detail}`).join('\n')}
                      >
                        {warn ? '⚠ ' : ''}{worst.label}
                      </span>
                    );
                  })()}
                </td>
                <HorizonCell value={h.oneMonthBest} payg={h.oneMonthPayg} cheapest={cheap1m} />
                <HorizonCell value={h.oneYearBest} payg={h.oneYearPayg} cheapest={cheap1y} />
                <HorizonCell value={h.threeYearBest} payg={h.threeYearPayg} cheapest={cheap3y} />
                <td
                  style={{ padding: '10px', color: 'var(--text-muted)' }}
                  className="text-[10px]"
                >
                  {h.bestRateLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HorizonCell({
  value,
  payg,
  cheapest,
}: {
  value: number | null;
  payg: number | null;
  cheapest: number | null;
}) {
  if (value == null) {
    return (
      <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
    );
  }
  const isCheap = cheapest != null && value === cheapest;
  const savings = payg != null && value < payg ? ((payg - value) / payg) * 100 : null;
  return (
    <td
      style={{
        padding: '10px',
        textAlign: 'right',
        color: isCheap ? 'var(--interactive)' : 'var(--text-primary)',
        fontWeight: isCheap ? 600 : 400,
        background: isCheap ? 'rgba(129, 140, 248, 0.05)' : undefined,
      }}
      className="font-mono"
    >
      <div>{fmtUsd(value)}</div>
      {savings != null && savings >= 3 && (
        <div
          className="text-[9px] mt-0.5 normal-case tracking-normal"
          style={{ color: isCheap ? 'var(--interactive)' : 'var(--text-muted)' }}
        >
          −{savings.toFixed(0)}% vs PAYG
        </div>
      )}
    </td>
  );
}

// S66-FIX-C — the private fmtUsd copy that lived here (a '$12.3K' capital-K
// variant) is deleted; the horizon matrix formats through the ONE shared
// `fmtUsd` from compare/ui/tokens like every other $ surface.

// ────────────────────────────────────────────────────────────────────────
// v2.14 — WinnerPanel · pros/cons cards + situational + overall winner.
// ────────────────────────────────────────────────────────────────────────
function WinnerPanel({
  analysis,
}: {
  analysis: { contenders: VmContender[]; winners: SituationalWinners };
}) {
  // v2.16 — Per-contender "best at" tags + "why pick this" summary.
  // Replaces the single "Top pick" callout with situational strengths so
  // users can match a VM to their actual workload shape.
  const bestAt: Record<string, string[]> = {};
  const add = (c: VmContender | null, tag: string) => {
    if (!c) return;
    const key = `${c.provider}|${c.sku}`;
    if (!bestAt[key]) bestAt[key] = [];
    bestAt[key].push(tag);
  };
  add(analysis.winners.cost, 'Best price');
  add(analysis.winners.compute, 'Most vCPU');
  add(analysis.winners.memory, 'Most memory');
  add(analysis.winners.network, 'Highest network');

  return (
    <div className="space-y-3">
      {/* Per-contender cards: best-at tag · why summary · pros · cons */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {analysis.contenders.map((c) => (
          <ContenderCard
            key={`${c.provider}-${c.sku}`}
            contender={c}
            bestAtTags={bestAt[`${c.provider}|${c.sku}`] ?? []}
            whySummary={whyPickContender(c, analysis.winners)}
          />
        ))}
      </div>
    </div>
  );
}

/** v2.16 — Plain-language one-liner: why pick THIS VM among the contenders?
 *  Reads the contender's situational strengths + score and writes a sentence. */
function whyPickContender(
  c: VmContender,
  winners: SituationalWinners,
): string {
  const wins: string[] = [];
  if (winners.cost && winners.cost.sku === c.sku) wins.push('cheapest hourly rate');
  if (winners.compute && winners.compute.sku === c.sku) wins.push('most vCPU');
  if (winners.memory && winners.memory.sku === c.sku) wins.push('most memory');
  if (winners.network && winners.network.sku === c.sku) wins.push('highest network bandwidth');

  if (wins.length === 0) {
    // Doesn't win any dim — explain its position by score.
    const pct = Math.round(c.score * 100);
    if (pct >= 75)
      return `Solid all-rounder — within striking distance on every dim (overall score ${pct}/100). Pick if you want balance without committing to one strength.`;
    if (pct >= 50)
      return `Middle-of-the-pack on every dim (score ${pct}/100). Pick only if region availability or ecosystem reasons outweigh the spec/price comparison.`;
    return `Trails the field on most dims (score ${pct}/100). Hard to recommend unless you're already standardized on ${c.provider}.`;
  }

  const list =
    wins.length === 1
      ? wins[0]
      : wins.length === 2
      ? `${wins[0]} and ${wins[1]}`
      : `${wins.slice(0, -1).join(', ')}, and ${wins[wins.length - 1]}`;
  return `Best pick when you need ${list}.`;
}

// ChampTile removed in v2.16 — situational winners now surface as "best at"
// tags on each contender card instead of separate tiles.


function ContenderCard({
  contender,
  bestAtTags,
  whySummary,
}: {
  contender: VmContender;
  bestAtTags: string[];
  whySummary: string;
}) {
  const tone = providerTone(contender.provider);
  return (
    <div
      className="glass"
      style={{
        padding: 14,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${tone.border}`,
        background: bestAtTags.length > 0 ? 'rgba(129, 140, 248, 0.025)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className="text-[9px] tracking-[0.04em] font-semibold"
          style={{ color: tone.fg }}
        >
          {contender.provider}
        </span>
      </div>
      <div
        className="font-mono font-semibold text-[12px] mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {contender.sku}
      </div>

      {/* v2.16 — "Best at" tags pulled from situational winner roles. */}
      {bestAtTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {bestAtTags.map((t) => (
            <span
              key={t}
              className="text-[9px] tracking-[0.04em] font-semibold"
              style={{
                padding: '2px 7px',
                background: 'rgba(129, 140, 248, 0.14)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              ★ {t}
            </span>
          ))}
        </div>
      )}

      {/* v2.16 — Plain-language "why pick this" summary. */}
      <div
        className="text-[11px] leading-relaxed mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {whySummary}
      </div>

      {contender.pros.length > 0 && (
        <div className="mt-3">
          <div className="text-[9px] tracking-[0.04em] text-text-muted mb-1">
            Pros
          </div>
          <ul className="space-y-1 text-[11px] leading-relaxed">
            {contender.pros.map((p, i) => (
              <li key={i} className="flex gap-1.5">
                <span style={{ color: 'var(--interactive)', flexShrink: 0 }}>↑</span>
                <span style={{ color: 'var(--text-primary)' }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contender.cons.length > 0 && (
        <div className="mt-3">
          <div className="text-[9px] tracking-[0.04em] text-text-muted mb-1">
            Cons
          </div>
          <ul className="space-y-1 text-[11px] leading-relaxed">
            {contender.cons.map((c, i) => (
              <li key={i} className="flex gap-1.5">
                <span style={{ color: '#FCA5A5', flexShrink: 0 }}>↓</span>
                <span style={{ color: 'var(--text-primary)' }}>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contender.pros.length === 0 && contender.cons.length === 0 && (
        <div className="mt-3 text-[11px] text-text-muted italic">
          Comparable specs and pricing — no significant deltas.
        </div>
      )}
    </div>
  );
}


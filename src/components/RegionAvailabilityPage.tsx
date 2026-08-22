/**
 * v2.17 — Region Availability page.
 *
 * Cross-cloud market-gap analysis. Answers:
 *   - How many regions does each provider have globally?
 *   - Which regions are unique to one cloud (the others don't offer it)?
 *   - For a given VM family/size, where is it physically available?
 *
 * Layout (top → bottom):
 *   1. KPI hero strip — region totals per provider + total gap count
 *   2. Filters card — provider chips + VM family chips (multi-select)
 *   3. Comparison chart — horizontal bar of regions per provider, with
 *      a per-super-geo breakdown so the user sees regional balance
 *   4. Market gaps callout — list of regions where one provider has
 *      coverage but the others don't, grouped by super-geo
 *   5. Region matrix — super-geo grouped table, one row per region,
 *      cells = "✓ Azure / · / ✓ GCP" availability dots; filtered VM
 *      families further narrow the cells
 *   6. Deep-link footer — "Drill into a single VM →" sends the user
 *      back to VM Competitive Offering with that VM pre-loaded.
 */
import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../state/AppContext';
import { REGION_GEO, type SuperGeo } from '../data/regionCoordinates';
import { isEdgeRegion, regionGeo as resolveRegionGeo } from '../data/regionGeo';
import {
  superGeoFor,
  SUPER_GEO_LABEL,
  regionNamesLine,
  coverageTone,
} from '../utils/superGeo';
import {
  buildRegionEquivalents,
  REGION_CLUSTER_KM,
  type RegionEquivRow,
  type EqProvider,
} from '../utils/regionEquivalents';
import { buildMarketGapReport, REGION_GEO_MAP, type RegionRef } from '../utils/marketGaps';
import { Disclosure } from './Disclosure';
import { ProviderPillRow } from './ProviderPillRow';
import { filterVmsByChips } from '../utils/regionFilter';
import { categorize } from '../utils/vmCategory';
import { vmFamily } from '../utils/vmTaxonomy';
import { bestVmMatch } from '../utils/equivalence';
import type { CatalogEntry } from '../types';
import { RegionFilterChips, type FilterChip } from './RegionFilterChips';
import { RegionMultiSelect } from './RegionMultiSelect';
import { CollapsibleSetupHeader, SetupStepCard } from './SetupStep';
import { CrossCloudEquivalencyPanel } from './CrossCloudEquivalencyPanel';
import { CrossCloudCompare } from './CrossCloudCompare';
import { VmEquivalencyTable } from './VmEquivalencyTable';
import { RegionEquivalencyTable } from './RegionEquivalencyTable';
import { CompetitiveMap, type MapMark } from './CompetitiveMap';
import { PanelErrorBoundary } from './PanelErrorBoundary';

type Provider = 'Azure' | 'AWS' | 'GCP';
const PROVIDERS: Provider[] = ['Azure', 'AWS', 'GCP'];
const SUPER_GEOS: SuperGeo[] = ['AMER', 'EMEA', 'APAC'];

/** "City, Country", collapsed to one token for city-states (Singapore, Hong
 *  Kong) where the two are the same — avoids "Singapore, Singapore". */
function placeLabel(city: string, country: string): string {
  return city === country ? city : `${city}, ${country}`;
}

/** Great-circle distance (km) between two lat/lon points. Local helper so the
 *  region-cluster expansion can work on REGION_GEO entries directly (whose type
 *  has no `cc`, unlike the regionGeo.ts `haversineKm` signature). */
function kmBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// `superGeoFor`, `SUPER_GEO_LABEL`, `regionNamesLine`, `coverageTone`, and
// `SHARED_TWO_TONE` now live in `src/utils/superGeo.ts` (shared with the
// Competitive page's region-availability matrix). Imported above.

// v2.28.x — The base-cloud "+% match" cascade (equivalentFamilyFor /
// distinctSpecs / familyMatchPct / sizeMatchPct + the 9 per-cloud dropdowns it
// fed) was removed from THIS page when the filter became one unified
// multi-select chip box (see RegionFilterChips). The equivalence cascade still
// lives on the Competitive tab.

const PROVIDER_TONE: Record<Provider, { fill: string; ring: string; bg: string }> = {
  Azure: { fill: '#60A5FA', ring: 'rgba(96, 165, 250, 0.35)', bg: 'rgba(96, 165, 250, 0.08)' },
  AWS: { fill: '#FBBF24', ring: 'rgba(251, 191, 36, 0.35)', bg: 'rgba(251, 191, 36, 0.08)' },
  GCP: { fill: '#FCA5A5', ring: 'rgba(252, 165, 165, 0.35)', bg: 'rgba(252, 165, 165, 0.08)' },
};

/**
 * v2.30 — Region Availability is now embeddable as three sub-pages of the
 * unified Competitive Offering sidebar shell.
 *
 * - When `embedded` is true, the component drops its own outer scroll
 *   container + `<h1>` page header (the shell's `<main>` supplies both) and
 *   renders a plain `space-y-4` block.
 * - `view` selects which slice of content renders. The Filter section (cloud
 *   providers + base cloud + chips) renders on EVERY view — it's the shared
 *   scope, so ALL the memos/state stay in this one component and persist as the
 *   shell switches among the three region sub-pages (same instance mounted).
 *     · 'availability' → Filter + KPI scoreboard + "Where it's available"
 *     · 'coverage'     → Filter + At-a-glance (PmSummary) + footprint + matrix
 *                        + gap detail (the executive coverage read)
 *     · 'equivalency'  → Filter + VM/Region equivalency tables + CrossCloudCompare
 * - With no props (`embedded`/`view` absent) it renders the full standalone
 *   page exactly as before (back-compat).
 */
/** S54 — Comparison setup picks piped into the embedded Region views so a
 *  read-only "what we're comparing" box can scope the map + visuals at a
 *  togglable granularity (VM sizes / category / family). Editing the picks
 *  happens back in Comparison setup via `onEditSetup`. */
export type RaComparisonControlled = {
  objective: 'sizes' | 'products';
  base: Provider;
  byProvider: Record<Provider, { category: string[]; family: string[]; size: string[] }>;
};

export function RegionAvailabilityPage({
  embedded = false,
  view,
  baseProviderControlled,
  providersControlled,
  comparisonControlled,
  onEditSetup,
  compareMode = 'comparison',
  onCompareModeChange,
}: {
  embedded?: boolean;
  view?: 'availability' | 'coverage' | 'equivalency';
  // v2.34 — Optional controlled base cloud. When the unified Cloud Market
  // Analytics shell drives this (from the Set-up page's "Basis of comparison"),
  // it passes the page-level `baselineProvider` here so the Region views anchor
  // on the SAME base cloud as the Compare views. Absent → RA owns its own base
  // (the standalone / deep-link case).
  baseProviderControlled?: Provider;
  // S53 — Optional controlled cloud set. When the unified Cloud Market Analytics
  // shell drives this, it passes Comparison setup's picked clouds here so the
  // Region views compare the SAME clouds the user set up. The user can still
  // "mute" one on this page (a per-page mask) without losing their setup —
  // see `mutedProviders`. Absent → RA owns its own provider pick (standalone).
  providersControlled?: Set<Provider>;
  // S54 — Read-only Comparison picks + a granularity toggle drive the
  // availability map's VM scope; editing routes back to setup via onEditSetup.
  comparisonControlled?: RaComparisonControlled;
  onEditSetup?: (granularity: 'sizes' | 'category' | 'family') => void;
  // v2.52.8 — Mirror the Compare dock's Comparison ⇄ VM BoM mode. In BoM mode the
  // availability views scope to the committed Bill of Materials' base-cloud SKUs
  // (read from `state.bom`) instead of the comparison picks. Shared with the page
  // so the toggle stays in sync across surfaces.
  compareMode?: 'comparison' | 'bom';
  onCompareModeChange?: (mode: 'comparison' | 'bom') => void;
} = {}) {
  const { state, dispatch } = useApp();
  const userVms = state.userVms;

  // ── Filter state ──────────────────────────────────────────────────────
  const [pickedProviders, setPickedProviders] = useState<Set<Provider>>(
    new Set(PROVIDERS),
  );
  // v2.39 — RA's own REGION multi-select scope. EMPTY = all regions (so the
  // views behave exactly as before until the user narrows). Independent of any
  // other page's region state. Scopes the DISPLAY/derived layer only — the
  // `regionsByProvider` universe below is left intact (other logic depends on
  // the full set); `regionInScope` gates every place a region feeds a view.
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  // S53 — Super-geo scope (Americas / EMEA / APAC). EMPTY = all super-geos. The
  // redesigned availability filter lets the user narrow to a super-geo first,
  // then to specific regions within it.
  const [selectedSuperGeos, setSelectedSuperGeos] = useState<Set<SuperGeo>>(new Set());
  // S53 — Per-page "mute" mask over the clouds inherited from Comparison setup.
  // Toggling a cloud off here hides it from this page's views WITHOUT touching
  // the setup selection, so toggling it back restores everything. Only used in
  // the embedded shell (standalone owns its own provider pill).
  const [mutedProviders, setMutedProviders] = useState<Set<Provider>>(new Set());
  // S53 — The availability filter is the SAME one-box collapsing stepper as
  // Comparison setup: numbered steps that collapse to a one-line summary after
  // Next. `raStep` = the open step; the box collapses when the last step is done.
  type RaStep = 'clouds' | 'geo' | 'regions' | 'done';
  const [raStep, setRaStep] = useState<RaStep>('clouds');
  const [raFilterOpen, setRaFilterOpen] = useState(true);
  // Region names that fall inside the selected super-geos (null = no super-geo
  // filter). Derived straight from REGION_GEO (each entry carries its super-geo)
  // so it doesn't depend on the per-provider universe built further down.
  const superGeoScopedRegions = useMemo(() => {
    if (selectedSuperGeos.size === 0) return null;
    const set = new Set<string>();
    for (const g of REGION_GEO) if (selectedSuperGeos.has(g.superGeo)) set.add(g.region);
    return set;
  }, [selectedSuperGeos]);
  // A picked region scopes to its GEO-EQUIVALENCE CLUSTER, not just its exact
  // name: picking Azure "Australia East" (Sydney) must also bring in AWS
  // ap-southeast-2 and GCP australia-southeast1 (both Sydney), so the scoreboard,
  // coverage row, reveal lists and map all honor cross-cloud equivalence. We
  // expand the picked set to every region in the same country within
  // REGION_CLUSTER_KM (the same union-find rule the equivalency table uses). The
  // ONLY thing that removes a cloud is deselecting it (handled by
  // pickedProviders, which gates the filtered universe upstream). null = no
  // region filter → everything is in scope.
  const expandedSelectedRegions = useMemo<Set<string> | null>(() => {
    if (selectedRegions.size === 0) return null;
    const picks = REGION_GEO.filter((g) => selectedRegions.has(g.region));
    const out = new Set<string>(selectedRegions);
    if (picks.length === 0) return out;
    for (const g of REGION_GEO) {
      if (out.has(g.region)) continue;
      for (const pk of picks) {
        if (g.country === pk.country && kmBetween(g.lat, g.lon, pk.lat, pk.lon) <= REGION_CLUSTER_KM) {
          out.add(g.region);
          break;
        }
      }
    }
    return out;
  }, [selectedRegions]);
  const regionInScope = (region: string) =>
    (expandedSelectedRegions === null || expandedSelectedRegions.has(region)) &&
    (superGeoScopedRegions === null || superGeoScopedRegions.has(region));
  // Count only the in-scope regions of a provider set (display-layer helper).
  const countInScope = (regions: Set<string>) => {
    let n = 0;
    for (const r of regions) if (regionInScope(r)) n += 1;
    return n;
  };
  // v2.28.x — ONE unified multi-select chip box replaces the per-provider
  // Category / Family / Size dropdown cascade. A chip is Category (canonical,
  // cross-cloud), Family (per-cloud), or Size (per-cloud). See RegionFilterChips.
  const [filterChips, setFilterChips] = useState<FilterChip[]>([]);
  // v2.52.19 — Local, non-destructive "mute" set for the read-only Comparison-box
  // base pills: clicking a base pill toggles it OUT of the active filter so the
  // user can refine in place (e.g. drop one of two committed families) WITHOUT
  // editing setup. "Edit in setup" still owns what enters the box; this only hides
  // a committed value from the scope. Resets whenever the committed selection
  // changes (see the reset effect below).
  const [mutedBasePills, setMutedBasePills] = useState<Set<string>>(() => new Set());
  const mutedSig = [...mutedBasePills].sort().join('|');
  // S54 — Granularity of the read-only Comparison box on the availability view:
  // which level of the setup comparison (exact sizes / category / family) scopes
  // the map + every visual below. Products-mode setups have no per-size picks, so
  // they default to Category; size-mode setups default to VM sizes.
  const [compareGranularity, setCompareGranularity] = useState<'sizes' | 'category' | 'family'>(
    comparisonControlled?.objective === 'products' ? 'category' : 'sizes',
  );
  // v2.52.8 — VM BoM mode for the availability views. The committed BoM's
  // base-cloud SKUs scope the map/scoreboard instead of the comparison picks.
  // v2.52.16 — also resolve each BoM SKU's CATEGORY + FAMILY so the "Compare by"
  // toggle works in BoM mode (VM sizes = the exact SKUs · Category / VM family =
  // their categories / families). Only meaningful for a sizes-objective setup.
  const bomScope = useMemo(() => {
    const sizes: string[] = [];
    const cats: string[] = [];
    const fams: string[] = [];
    const sSeen = new Set<string>();
    const cSeen = new Set<string>();
    const fSeen = new Set<string>();
    for (const b of state.bom ?? []) {
      if (!b.vmSizeName || sSeen.has(b.vmSizeName)) continue;
      sSeen.add(b.vmSizeName);
      sizes.push(b.vmSizeName);
      const vm = userVms.find((v) => v.vmSizeName === b.vmSizeName);
      if (vm) {
        const c = vm.category ?? categorize(vm.provider ?? '', vm.family ?? '');
        if (c && !cSeen.has(c)) {
          cSeen.add(c);
          cats.push(c);
        }
        const f = vmFamily(vm);
        if (f && !fSeen.has(f)) {
          fSeen.add(f);
          fams.push(f);
        }
      }
    }
    return { sizes, cats, fams };
  }, [state.bom, userVms]);
  const bomSizes = bomScope.sizes;
  const bomModeAvailable =
    comparisonControlled?.objective === 'sizes' && bomSizes.length > 0;
  const effCompareMode: 'comparison' | 'bom' =
    compareMode === 'bom' && bomModeAvailable ? 'bom' : 'comparison';
  // v2.30 — "Base cloud of comparison": the cloud whose Family/Size you browse
  // in the filter (so a family/size chip is unambiguously "Azure's" vs "AWS's").
  // The OTHER selected clouds are then shown at the category level — see
  // `filteredVms` — so picking an Azure family still plots AWS/GCP coverage of
  // the equivalent category on the map (not an empty single-cloud view).
  const [baseProvider, setBaseProvider] = useState<Provider>('Azure');
  // S53 — Per-page base-cloud OVERRIDE (embedded shell). The base normally flows
  // from Comparison setup (`baseProviderControlled`), but the user can re-anchor it
  // here — e.g. set AWS or GCP as base to read THEIR gaps vs the competition —
  // without changing setup. null = follow the controlled base. Like the mute mask,
  // it's a local, reversible page override.
  const [baseOverride, setBaseOverride] = useState<Provider | null>(null);
  // Which scoreboard tile is expanded to reveal its underlying regions (null = none).
  const [openTile, setOpenTile] = useState<Provider | 'gaps' | null>(null);
  // v2.28.x — The promoted "Where it's available" surface toggles between the
  // geographic map (default) and a super-geo-grouped roster list.
  const [whereView, setWhereView] = useState<'map' | 'list'>('map');
  // The set of family names picked (any provider) — used by "filtered by family"
  // labels downstream (PmSummary etc.).
  const pickedFamilies = useMemo(() => {
    const set = new Set<string>();
    for (const c of filterChips) if (c.kind === 'family') set.add(c.value);
    return set;
  }, [filterChips]);

  // The selected clouds, in canonical order, and the EFFECTIVE base cloud
  // (falls back to the first selected cloud if the chosen base was deselected).
  const activeProviders = useMemo(
    () => PROVIDERS.filter((p) => pickedProviders.has(p)),
    [pickedProviders],
  );
  // v2.34 — When a controlled base cloud is supplied (unified shell), it wins
  // over the internal `baseProvider` state; otherwise RA uses its own pick.
  // Either way we fall back to the first selected cloud if the chosen base was
  // deselected, so the views never anchor on an inactive cloud.
  const desiredBase: Provider = baseOverride ?? baseProviderControlled ?? baseProvider;
  const effectiveBase: Provider =
    activeProviders.includes(desiredBase) ? desiredBase : (activeProviders[0] ?? 'Azure');

  // v2.52.33 — In VM-BoM mode at SIZE granularity, the committed BoM only names
  // the BASE cloud's SKUs; the other clouds had no size chip and silently fell to
  // category (so their region counts read 0 — the equivalents weren't ported in).
  // Port each base BoM SKU to its closest analog SIZE per other cloud (same engine
  // as the Comparison best-match), so each cloud's region count reflects where ITS
  // ported size actually runs. Base keeps its own BoM SKUs.
  const bomSizeAnalogs = useMemo(() => {
    const out: Record<Provider, string[]> = { Azure: [], AWS: [], GCP: [] };
    out[effectiveBase] = [...bomScope.sizes];
    const others = PROVIDERS.filter((p) => p !== effectiveBase);
    // One deduped (region-free) candidate pool per other cloud.
    const pools: Record<string, CatalogEntry[]> = {};
    for (const p of others) {
      const seen = new Set<string>();
      const pool: CatalogEntry[] = [];
      for (const v of userVms) {
        if ((v.provider ?? '') !== p || seen.has(v.vmSizeName)) continue;
        seen.add(v.vmSizeName);
        pool.push(v);
      }
      pools[p] = pool;
    }
    const picked: Record<string, Set<string>> = {};
    for (const p of others) picked[p] = new Set();
    for (const sku of bomScope.sizes) {
      const src = userVms.find((v) => v.vmSizeName === sku && (v.provider ?? '') === effectiveBase);
      if (!src) continue;
      for (const p of others) {
        const m = bestVmMatch(src, pools[p]);
        if (m && !picked[p].has(m.vm.vmSizeName)) {
          picked[p].add(m.vm.vmSizeName);
          out[p].push(m.vm.vmSizeName);
        }
      }
    }
    return out;
  }, [bomScope.sizes, userVms, effectiveBase]);

  // S53 — In the embedded shell the active clouds are OWNED by Comparison setup
  // (`providersControlled`) and `mutedProviders` is this page's mute mask. Keep
  // the internal `pickedProviders` (which every memo below reads) synced to
  // controlled ∖ muted, so the whole page honors both without touching any
  // downstream logic. Muting the last visible cloud is a no-op (never empties).
  const controlledKey = providersControlled
    ? PROVIDERS.filter((p) => providersControlled.has(p)).join(',')
    : null;
  useEffect(() => {
    if (!providersControlled) return;
    const universe = PROVIDERS.filter((p) => providersControlled.has(p));
    const visible = universe.filter((p) => !mutedProviders.has(p));
    const eff = visible.length > 0 ? visible : universe;
    setPickedProviders((prev) =>
      prev.size === eff.length && eff.every((p) => prev.has(p)) ? prev : new Set(eff),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledKey, mutedProviders]);

  // S54 — When the embedded shell pipes in the Comparison setup picks, the
  // availability view's VM scope is DRIVEN by that comparison at the chosen
  // granularity (read-only here; edited back in setup). We derive the existing
  // chip filter from the picks so the map / scoreboard / overlap cards /
  // equivalents table all scope automatically — they already key off filterChips.
  // Only on the availability view; the coverage view keeps its own editable chips.
  const ccSig = comparisonControlled ? JSON.stringify(comparisonControlled.byProvider) : null;
  const bomSig = [bomScope.sizes.join(','), bomScope.cats.join(','), bomScope.fams.join(',')].join('|');
  useEffect(() => {
    if (!comparisonControlled || !(embedded && view === 'availability')) return;
    const picks = comparisonControlled.byProvider;
    let next: FilterChip[];
    if (effCompareMode === 'bom') {
      // VM BoM mode — scope to the committed BoM at the chosen granularity:
      // exact SKUs (sizes), or the categories / families those SKUs belong to.
      if (compareGranularity === 'category') {
        next = bomScope.cats.map((value) => ({ kind: 'category' as const, value }));
      } else if (compareGranularity === 'family') {
        next = bomScope.fams.map((value) => ({
          kind: 'family' as const,
          value,
          provider: effectiveBase,
        }));
      } else {
        // Size granularity: the base cloud gets its BoM SKUs; every OTHER cloud
        // gets its ported analog size (bomSizeAnalogs) so its region count
        // reflects where its equivalent runs — not a silent category fallback.
        next = PROVIDERS.flatMap((p) =>
          (bomSizeAnalogs[p] ?? []).map((value) => ({
            kind: 'size' as const,
            value,
            provider: p,
          })),
        );
      }
    } else if (compareGranularity === 'category') {
      const cats = new Set<string>();
      for (const p of PROVIDERS) for (const c of picks[p]?.category ?? []) cats.add(c);
      next = [...cats].map((value) => ({ kind: 'category', value }));
    } else if (compareGranularity === 'family') {
      // Every cloud is scoped PRECISELY by ITS OWN picked/analog family (not the
      // base's family with others falling back to category) — so each cloud's
      // region count reflects exactly where that cloud's chosen family runs.
      next = PROVIDERS.flatMap((p) =>
        (picks[p]?.family ?? []).map((value) => ({
          kind: 'family' as const,
          value,
          provider: p,
        })),
      );
    } else {
      // Same, at VM-size granularity: each cloud filtered by its own analog size.
      next = PROVIDERS.flatMap((p) =>
        (picks[p]?.size ?? []).map((value) => ({
          kind: 'size' as const,
          value,
          provider: p,
        })),
      );
    }
    // Apply the local pill mute — values the user toggled off in the Comparison
    // box drop out of the scope (refine-in-place; non-destructive to setup).
    if (mutedBasePills.size) next = next.filter((c) => !mutedBasePills.has(c.value));
    setFilterChips((prev) => {
      // Keep object identity stable when nothing changed → no render loop.
      const same =
        prev.length === next.length &&
        prev.every(
          (c, i) =>
            c.kind === next[i].kind &&
            c.value === next[i].value &&
            (c as { provider?: Provider }).provider === (next[i] as { provider?: Provider }).provider,
        );
      return same ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccSig, compareGranularity, effectiveBase, embedded, view, effCompareMode, bomSig, mutedSig, bomSizeAnalogs]);

  // Reset pill mutes whenever the committed selection (or its granularity/base)
  // changes — a fresh selection from setup starts fully active.
  useEffect(() => {
    setMutedBasePills((prev) => (prev.size ? new Set() : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccSig, bomSig, compareGranularity, effectiveBase]);

  // ── Universe of regions per provider ──────────────────────────────────
  // We trust two sources: (a) the REGION_GEO seed (every vendor-published
  // region we know about), and (b) regions actually present in userVms
  // (so user uploads expand the matrix even if we forgot to seed coords).
  const regionsByProvider = useMemo(() => {
    const out: Record<Provider, Set<string>> = {
      Azure: new Set(),
      AWS: new Set(),
      GCP: new Set(),
    };
    // Exclude AWS Local Zones / Wavelength zones — they're edge locations, not
    // regions, and counting them inflates AWS from ~38 real regions to ~105.
    for (const g of REGION_GEO) {
      if (isEdgeRegion(g.provider, g.region)) continue;
      out[g.provider as Provider]?.add(g.region);
    }
    for (const v of userVms) {
      if (v.region && PROVIDERS.includes(v.provider as Provider)) {
        if (isEdgeRegion(v.provider ?? '', v.region)) continue;
        out[v.provider as Provider].add(v.region);
      }
    }
    return out;
  }, [userVms]);

  // v2.39 — The region universe in scope of the selected providers — the
  // option set for the REGION multi-select. Sorted union of every selected
  // provider's full region set (de-duped). Independent of the chip/category
  // filter, so the user can always pick any region the selected clouds run.
  const allRegions = useMemo(() => {
    const set = new Set<string>();
    for (const p of activeProviders) {
      for (const region of regionsByProvider[p]) set.add(region);
    }
    return [...set].sort();
  }, [activeProviders, regionsByProvider]);

  // Region geo lookup so we can group by super-geo + show city. S65 — the shared
  // module-level REGION_GEO_MAP (built once from REGION_GEO in marketGaps.ts), so
  // the RA page, the exec strip and the exports all resolve super-geos from the
  // identical seed map instead of three byte-identical per-component copies.
  const regionGeoMap = REGION_GEO_MAP;

  // ── Filtered catalog: VMs matching active providers + the chip filter ──
  // A VM passes if its provider is selected AND, for each chip KIND that has
  // ≥1 chip, the VM matches ≥1 chip of that kind (within a kind = OR, across
  // kinds = AND). No chips → every selected-provider VM (the "all VM types"
  // baseline). Category chips are canonical/cross-cloud; family + size chips
  // carry a provider so they only match that cloud's rows.
  // v2.30 — Base-cloud-aware filtering (pure + unit-tested in regionFilter.ts):
  // the base cloud matches its family/size chips precisely; the OTHER selected
  // clouds fall back to the equivalent CATEGORY, so picking an Azure family
  // still plots AWS/GCP coverage instead of collapsing to a single-cloud island.
  const filteredVms = useMemo(
    () => filterVmsByChips(userVms, pickedProviders, effectiveBase, filterChips),
    [userVms, pickedProviders, effectiveBase, filterChips],
  );

  // ── Per-provider regions that satisfy the filter ──────────────────────
  // A region "counts" if at least one filtered VM is offered there.
  const filteredRegionsByProvider = useMemo(() => {
    const out: Record<Provider, Set<string>> = {
      Azure: new Set(),
      AWS: new Set(),
      GCP: new Set(),
    };
    for (const v of filteredVms) {
      if (!v.region) continue;
      const p = v.provider as Provider;
      // Exclude AWS Local Zones / Wavelength — same edge-region rule the
      // unfiltered `regionsByProvider` applies. Without this, the moment a
      // category/family/size filter goes active the scoreboard switched to
      // this set and AWS jumped from ~36 real regions back to ~105 edge-
      // inflated ones ("105 of 36 total").
      if (isEdgeRegion(p, v.region)) continue;
      if (out[p]) out[p].add(v.region);
    }
    return out;
  }, [filteredVms]);

  // ── Per-super-geo region counts ───────────────────────────────────────
  const regionsBySuperGeo = useMemo(() => {
    const out: Record<SuperGeo, Record<Provider, Set<string>>> = {
      AMER: { Azure: new Set(), AWS: new Set(), GCP: new Set() },
      EMEA: { Azure: new Set(), AWS: new Set(), GCP: new Set() },
      APAC: { Azure: new Set(), AWS: new Set(), GCP: new Set() },
    };
    for (const p of PROVIDERS) {
      for (const region of regionsByProvider[p]) {
        if (!regionInScope(region)) continue;
        // v2.52.17 — group via superGeoFor (resolves through the richer
        // regionGeo.ts map + a longitude fallback), NOT the thin REGION_GEO seed.
        // The seed only covers ~27 Azure regions, so the roster used to drop the
        // other ~32 the scoreboard counts — hence "59 regions" but a 27-region
        // roster. superGeoFor places every in-scope region.
        out[superGeoFor(p, region, regionGeoMap)][p].add(region);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);

  // Market gaps are derived comprehensively in `coverageDetail.gapList` (every
  // catalog region resolved, not just the seed) so the gap count reconciles with
  // the scoreboard totals — see the AT-A-GLANCE card below.

  // v2.17.22 — Per-provider footprint partition. For each active provider,
  // bucket every city in REGION_GEO into one of three slots from THAT
  // provider's POV:
  //   - equivalent: this cloud has the city AND ≥1 other selected cloud also does
  //   - exclusive:  only this cloud has the city (no other selected cloud)
  //   - gap:        OTHER selected clouds have the city, this cloud doesn't
  // Drives the new three-box layout: one column per provider, each with
  // its own Equivalent / Exclusive / Market-Gap sub-lists. Bonus: a small
  // footprint bar at the top of each box gives a visual answer to "who
  // has more coverage."
  type PlaceFacet = { city: string; country: string; superGeo: SuperGeo; otherCovered: Provider[] };
  type ProviderFootprint = {
    equivalent: PlaceFacet[];
    exclusive: PlaceFacet[];
    gap: PlaceFacet[];
    total: number; // equivalent + exclusive (this cloud's own footprint)
  };
  // v2.28.x — Any chip narrows the page. (Hoisted above footprintByProvider in
  // v2.52.18 — the footprint now reads the filter-aware live-catalog universe.)
  const anyFilterActive = filterChips.length > 0;
  const footprintByProvider = useMemo(() => {
    // First: per-place coverage set across SELECTED providers only.
    // v2.52.18 — Resolve EVERY in-scope region via the richer regionGeo resolver
    // (NOT the thin ~27-entry REGION_GEO seed) over the live-catalog universe —
    // the same source the roster + coverageDetail read, so the Equivalent /
    // Exclusive / Gap lists reconcile with the scoreboard instead of dropping the
    // ~32 metros the seed never covered.
    const active = PROVIDERS.filter((p) => pickedProviders.has(p));
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    type Coverage = { city: string; country: string; superGeo: SuperGeo; covered: Set<Provider> };
    const places = new Map<string, Coverage>();
    for (const p of active) {
      for (const region of src[p]) {
        if (!regionInScope(region)) continue;
        const geo = resolveRegionGeo(p, region) ?? regionGeoMap.get(`${p}::${region}`);
        if (!geo) continue;
        const sg = superGeoFor(p, region, regionGeoMap);
        const key = `${sg}::${geo.city}::${geo.country}`;
        const entry = places.get(key) ?? {
          city: geo.city,
          country: geo.country,
          superGeo: sg,
          covered: new Set<Provider>(),
        };
        entry.covered.add(p);
        places.set(key, entry);
      }
    }
    const cmp = (a: PlaceFacet, b: PlaceFacet) =>
      a.superGeo === b.superGeo
        ? a.city.localeCompare(b.city)
        : a.superGeo.localeCompare(b.superGeo);
    const out: Record<Provider, ProviderFootprint> = {
      Azure: { equivalent: [], exclusive: [], gap: [], total: 0 },
      AWS: { equivalent: [], exclusive: [], gap: [], total: 0 },
      GCP: { equivalent: [], exclusive: [], gap: [], total: 0 },
    };
    for (const place of places.values()) {
      for (const me of PROVIDERS) {
        if (!pickedProviders.has(me)) continue;
        const meHas = place.covered.has(me);
        const others = PROVIDERS.filter(
          (p) => p !== me && pickedProviders.has(p) && place.covered.has(p),
        );
        const facet: PlaceFacet = {
          city: place.city,
          country: place.country,
          superGeo: place.superGeo,
          otherCovered: others,
        };
        if (meHas) {
          out[me].total += 1;
          if (others.length > 0) out[me].equivalent.push(facet);
          else out[me].exclusive.push(facet);
        } else if (others.length > 0) {
          // Place exists for at least one OTHER cloud but not me → gap.
          out[me].gap.push(facet);
        }
      }
    }
    for (const p of PROVIDERS) {
      out[p].equivalent.sort(cmp);
      out[p].exclusive.sort(cmp);
      out[p].gap.sort(cmp);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProviders, anyFilterActive, filteredRegionsByProvider, regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);
  const maxFootprint = Math.max(
    1,
    ...PROVIDERS.map((p) => footprintByProvider[p].total),
  );

  // ── Map marks — one provider-coloured dot per region each SELECTED cloud
  // offers (under the active filter). Feeds the geographic Region-availability
  // map (moved here from the Competitive tab — this is where it belongs). ──
  const mapMarks: MapMark[] = useMemo(() => {
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const out: MapMark[] = [];
    for (const p of PROVIDERS) {
      if (!pickedProviders.has(p)) continue;
      for (const region of src[p]) {
        if (!regionInScope(region)) continue;
        out.push({ provider: p as MapMark['provider'], region });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyFilterActive, filteredRegionsByProvider, regionsByProvider, pickedProviders, selectedRegions, selectedSuperGeos]);

  // v2.28.x — Human description of the active chips: distinct categories +
  // families + sizes, joined. "all VM types" when no chip is set.
  const scopeLabel = useMemo(() => {
    const cats = [...new Set(filterChips.filter((c) => c.kind === 'category').map((c) => c.value))];
    const fams = [...new Set(filterChips.filter((c) => c.kind === 'family').map((c) => c.value))];
    const sizes = [...new Set(filterChips.filter((c) => c.kind === 'size').map((c) => c.value))];
    const parts: string[] = [];
    if (cats.length) parts.push(cats.join(' / '));
    if (fams.length) parts.push(`${fams.join(' / ')} family`);
    if (sizes.length) parts.push(sizes.join(' / '));
    return parts.length ? parts.join(' · ') : 'all VM types';
  }, [filterChips]);

  const summaryCounts = useMemo(() => {
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const out = {} as Record<Provider, number>;
    for (const p of PROVIDERS) {
      let n = 0;
      for (const region of src[p]) if (regionInScope(region)) n += 1;
      out[p] = n;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyFilterActive, filteredRegionsByProvider, regionsByProvider, selectedRegions, selectedSuperGeos]);

  // Distinct super-geos a provider serves WITHIN the active scope — so the
  // scoreboard's "across N super-geos" subline narrows with the filter too.
  const superGeoCountByProvider = useMemo(() => {
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const out = {} as Record<Provider, number>;
    for (const p of PROVIDERS) {
      const set = new Set<SuperGeo>();
      for (const region of src[p]) {
        if (!regionInScope(region)) continue;
        set.add(superGeoFor(p, region, regionGeoMap));
      }
      out[p] = set.size;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyFilterActive, filteredRegionsByProvider, regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);

  // Labeled, sorted region list per provider (filter-aware) so the scoreboard
  // tiles can expand to reveal exactly which regions back each count.
  const regionListByProvider = useMemo(() => {
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const out = {} as Record<Provider, { region: string; label: string; superGeo: SuperGeo }[]>;
    for (const p of PROVIDERS) {
      const list = [...src[p]].filter(regionInScope).map((region) => {
        const geo = resolveRegionGeo(p, region) ?? regionGeoMap.get(`${p}::${region}`);
        return {
          region,
          label: geo ? placeLabel(geo.city, geo.country) : '',
          superGeo: superGeoFor(p, region, regionGeoMap),
        };
      });
      list.sort((a, b) => (a.label || a.region).localeCompare(b.label || b.region));
      out[p] = list;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyFilterActive, filteredRegionsByProvider, regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);

  // v2.27.3 — Filter-aware coverage detail for the executive card: where the
  // selected providers OVERLAP (a location served by 2+ / all clouds) and where
  // each is the ONLY cloud, WITH the specific locations. Built by collapsing the
  // (filtered) regions to city+country so cross-cloud presence is comparable.
  // S65 — All coverage/exclusive/gap/shared math now lives in the pure
  // `buildMarketGapReport` selector (src/utils/marketGaps.ts) so the RA page and
  // the executive exports share ONE source of truth. This memo only assembles the
  // already-scoped region refs (active providers + in-scope filter + chip filter)
  // and hands them to the selector — buckets, counts and sort order are identical
  // to the former inline derivation.
  const coverageDetail = useMemo(() => {
    const active = PROVIDERS.filter((p) => pickedProviders.has(p));
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const refs: RegionRef[] = [];
    for (const p of active) {
      for (const region of src[p]) {
        if (!regionInScope(region)) continue;
        refs.push({ provider: p as EqProvider, region });
      }
    }
    return buildMarketGapReport(refs, effectiveBase as EqProvider, active as EqProvider[], regionGeoMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProviders, effectiveBase, anyFilterActive, filteredRegionsByProvider, regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);

  // v2.28.x — Roster of every metro in the current selection (filter-aware via
  // the same src the coverage detail reads), each with which providers serve it
  // + each serving cloud's own region name. Grouped by super-geo for the
  // promoted "Where it's available" List view. Ownership-tinted via coverageTone.
  type RosterItem = {
    city: string;
    country: string;
    superGeo: SuperGeo;
    covered: Provider[];
    regionByProvider: Partial<Record<Provider, string>>;
  };
  const roster = useMemo(() => {
    const active = PROVIDERS.filter((p) => pickedProviders.has(p));
    const src = anyFilterActive ? filteredRegionsByProvider : regionsByProvider;
    const places = new Map<string, RosterItem>();
    for (const p of active) {
      for (const region of src[p]) {
        if (!regionInScope(region)) continue;
        const geo = resolveRegionGeo(p, region) ?? regionGeoMap.get(`${p}::${region}`);
        if (!geo) continue;
        const key = `${geo.city}::${geo.country}`;
        const e =
          places.get(key) ??
          {
            city: geo.city,
            country: geo.country,
            superGeo: superGeoFor(p, region, regionGeoMap),
            covered: [] as Provider[],
            regionByProvider: {} as Partial<Record<Provider, string>>,
          };
        if (!e.covered.includes(p)) e.covered.push(p);
        if (!e.regionByProvider[p]) e.regionByProvider[p] = region;
        places.set(key, e);
      }
    }
    // Group by super-geo in canonical AMER → EMEA → APAC order; cities A→Z.
    const bySg: Record<SuperGeo, RosterItem[]> = { AMER: [], EMEA: [], APAC: [] };
    for (const item of places.values()) bySg[item.superGeo].push(item);
    for (const sg of SUPER_GEOS) bySg[sg].sort((a, b) => a.city.localeCompare(b.city));
    return { bySg, total: places.size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProviders, anyFilterActive, filteredRegionsByProvider, regionsByProvider, regionGeoMap, selectedRegions, selectedSuperGeos]);

  // ── Matrix rows: one per (super-geo, region) for filtered providers ───
  const matrixRows = useMemo(() => {
    const out: {
      superGeo: SuperGeo;
      region: string;
      city: string;
      country: string;
      perProvider: Record<Provider, { offered: boolean; vmCount: number }>;
    }[] = [];
    for (const sg of SUPER_GEOS) {
      // v2.52.18 — Resolve every in-scope region for each selected provider in
      // this super-geo to its metro via the richer regionGeo resolver (NOT the
      // thin REGION_GEO seed), collecting which providers + region names sit at
      // each city. `regionsBySuperGeo` is already resolver-grouped, so this counts
      // the same ~59 regions the scoreboard does — no AWS/GCP metro is dropped.
      type Cell = {
        city: string;
        country: string;
        region: string; // a representative region name for the row key
        byProvider: Partial<Record<Provider, string[]>>;
      };
      const cells = new Map<string, Cell>();
      for (const p of PROVIDERS) {
        if (!pickedProviders.has(p)) continue;
        for (const region of regionsBySuperGeo[sg][p]) {
          const geo = resolveRegionGeo(p, region) ?? regionGeoMap.get(`${p}::${region}`);
          if (!geo) continue;
          const key = `${geo.city}::${geo.country}`;
          const cell =
            cells.get(key) ??
            { city: geo.city, country: geo.country, region, byProvider: {} };
          (cell.byProvider[p] ??= []).push(region);
          cells.set(key, cell);
        }
      }
      const sorted = Array.from(cells.values()).sort((a, b) =>
        a.city.localeCompare(b.city),
      );
      for (const cell of sorted) {
        // Offered/count comes from the FILTERED catalog (a region "counts" only if
        // ≥1 filtered VM is offered there) — same as before; only the row universe
        // moved off the seed.
        const perProvider: Record<Provider, { offered: boolean; vmCount: number }> = {
          Azure: { offered: false, vmCount: 0 },
          AWS: { offered: false, vmCount: 0 },
          GCP: { offered: false, vmCount: 0 },
        };
        for (const p of PROVIDERS) {
          const regions = cell.byProvider[p];
          if (!regions) continue;
          const count = filteredVms.filter(
            (v) => v.provider === p && !!v.region && regions.includes(v.region),
          ).length;
          perProvider[p] = { offered: count > 0, vmCount: count };
        }
        out.push({
          superGeo: sg,
          region: cell.region,
          city: cell.city,
          country: cell.country,
          perProvider,
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProviders, regionsBySuperGeo, regionGeoMap, filteredVms, selectedRegions, selectedSuperGeos]);

  // ── S53 — Integrated cross-cloud region equivalents table ─────────────
  // Cluster every offered region (across the VISIBLE clouds) into cross-cloud
  // equivalency rows (same country, within REGION_CLUSTER_KM) so analogs line up
  // — Azure "West US" beside AWS "us-west-1" beside GCP "us-west1". No % score:
  // a region is either an equivalent or it isn't.
  const [openEquivGeos, setOpenEquivGeos] = useState<Set<SuperGeo>>(
    () => new Set(SUPER_GEOS),
  );
  const equivRows = useMemo(
    () => buildRegionEquivalents(userVms, activeProviders as EqProvider[], regionGeoMap),
    [userVms, activeProviders, regionGeoMap],
  );
  // Scope to the region + super-geo filter. A cluster shows if its super-geo is
  // in scope AND (no region picked OR ≥1 of its regions is picked) — so filtering
  // to "West US" still reveals its cross-cloud equivalents on the same row.
  const equivByGeo = useMemo(() => {
    const out: Record<SuperGeo, RegionEquivRow[]> = { AMER: [], EMEA: [], APAC: [] };
    for (const row of equivRows) {
      if (selectedSuperGeos.size > 0 && !selectedSuperGeos.has(row.superGeo)) continue;
      if (selectedRegions.size > 0) {
        const anyPicked = (['Azure', 'AWS', 'GCP'] as EqProvider[]).some((p) =>
          row.cells[p].some((c) => selectedRegions.has(c.region)),
        );
        if (!anyPicked) continue;
      }
      out[row.superGeo].push(row);
    }
    return out;
  }, [equivRows, selectedSuperGeos, selectedRegions]);
  const equivTotal = SUPER_GEOS.reduce((n, sg) => n + equivByGeo[sg].length, 0);
  // Base cloud leftmost, then the other visible clouds in canonical order.
  const equivColumns = useMemo(
    () => [effectiveBase, ...activeProviders.filter((p) => p !== effectiveBase)],
    [effectiveBase, activeProviders],
  );

  // ── Bar chart scale ───────────────────────────────────────────────────
  const maxRegions = Math.max(
    1,
    ...PROVIDERS.map((p) =>
      pickedProviders.has(p) ? countInScope(regionsByProvider[p]) : 0,
    ),
  );

  // ── Deep-link to VM Competitive Offering with a chosen VM ─────────────
  const deepLinkToVm = (sku: string) => {
    dispatch({
      type: 'UI_SET',
      ui: { activePage: 'competitive', competitiveBaseline: sku },
    });
  };


  const PROVIDER_PILL_COUNTS = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of PROVIDERS) m[p] = regionsByProvider[p].size;
    return m;
  }, [regionsByProvider]);

  // v2.30 — Which slice renders. Standalone (no `view` prop) shows everything;
  // embedded shows just the requested sub-page. The Filter section renders on
  // every view (it's the shared scope), so each block below is gated separately.
  const showAvailability = !view || view === 'availability';
  const showCoverage = !view || view === 'coverage';
  const showEquivalency = !view || view === 'equivalency';

  // The Filter section — Cloud Provider pills + Base cloud + the unified chip
  // box. Shared scope: renders FIRST on every view.
  // S53 — The availability sub-page filter is region-only (super-geo + regions)
  // plus the clouds-from-setup mute row. The VM category/family/size chip box +
  // cross-cloud equivalency panel stay on the coverage/equivalency views (and the
  // standalone page), where VM-level scoping is still useful.
  const simplifiedFilter = embedded && view === 'availability';
  const regionOptions = superGeoScopedRegions
    ? allRegions.filter((r) => superGeoScopedRegions.has(r))
    : allRegions;

  // S53 — Embedded "Clouds & basis" card. Two controls, both LOCAL/reversible:
  //   • Mute pills — tap to hide a cloud on this page (setup selection is kept).
  //   • Base cloud — re-anchor the comparison here (e.g. AWS or GCP as base to read
  //     THEIR gaps vs the competition). Overrides the setup base for this page only.
  const cloudMuteRow = embedded && providersControlled ? (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-1.5">
        Clouds &amp; basis
        <span className="text-text-muted normal-case tracking-normal ml-1">
          · from Comparison setup · tap to mute one here (your setup keeps it)
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PROVIDERS.filter((p) => providersControlled.has(p)).map((p) => {
          const muted = mutedProviders.has(p);
          const tone = PROVIDER_TONE[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() =>
                setMutedProviders((prev) => {
                  const next = new Set(prev);
                  if (next.has(p)) {
                    next.delete(p);
                    return next;
                  }
                  // Don't allow muting the LAST visible cloud.
                  const stillVisible = PROVIDERS.filter(
                    (q) => providersControlled.has(q) && q !== p && !next.has(q),
                  );
                  if (stillVisible.length === 0) return prev;
                  next.add(p);
                  return next;
                })
              }
              className="inline-flex items-center gap-1.5 text-[10.5px] font-medium transition-colors"
              style={{
                padding: '4px 11px',
                borderRadius: 'var(--radius-pill)',
                background: muted ? 'transparent' : `${tone.fill}1F`,
                border: `1px solid ${muted ? 'var(--border)' : tone.fill}`,
                color: muted ? 'var(--text-muted)' : tone.fill,
                opacity: muted ? 0.6 : 1,
                cursor: 'pointer',
              }}
              aria-pressed={!muted}
              title={muted ? `Show ${p} on this page` : `Mute ${p} on this page`}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: muted ? 'var(--text-muted)' : tone.fill,
                  display: 'inline-block',
                }}
              />
              {p}
            </button>
          );
        })}
      </div>

      {/* Base-cloud selector — choose which VISIBLE cloud anchors the comparison
          (leftmost column + gap perspective). Only meaningful with ≥2 clouds. */}
      {activeProviders.length >= 2 && (
        <div
          className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary">
            Base cloud
            <span className="text-text-muted normal-case tracking-normal ml-1">
              · leftmost column · whose gaps vs the others you read
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            {activeProviders.map((p) => {
              const isBase = p === effectiveBase;
              const tone = PROVIDER_TONE[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBaseOverride(p)}
                  className="text-[10.5px] font-medium transition-colors"
                  style={{
                    padding: '3px 11px',
                    borderRadius: 'var(--radius-pill)',
                    background: isBase ? `${tone.fill}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isBase ? tone.fill : 'var(--border)'}`,
                    color: isBase ? tone.fill : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  aria-pressed={isBase}
                  title={`Anchor the comparison on ${p}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ── S53 — Availability filter = the SAME one-box collapsing stepper as
  // Comparison setup. Cloud providers render as COLUMNS (step 1), then Geography
  // and Regions each as a collapsing step. ─────────────────────────────────────
  const controlledClouds = providersControlled
    ? PROVIDERS.filter((p) => providersControlled.has(p))
    : activeProviders;
  const toggleMute = (p: Provider) =>
    setMutedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        next.delete(p);
        return next;
      }
      // Don't allow muting the LAST visible cloud.
      const stillVisible = controlledClouds.filter((q) => q !== p && !next.has(q));
      if (stillVisible.length === 0) return prev;
      next.add(p);
      return next;
    });

  // Step 1 body — one COLUMN per cloud (from setup), each with a Shown/Muted
  // toggle + a Base radio. Mirrors the setup stepper's cloud-columns layout.
  const cloudsStepBody = (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, controlledClouds.length)}, minmax(0, 1fr))`,
        gap: 8,
      }}
    >
      {controlledClouds.map((p) => {
        const muted = mutedProviders.has(p);
        const isBase = p === effectiveBase;
        const tone = PROVIDER_TONE[p];
        return (
          <div
            key={p}
            style={{
              border: `1px solid ${muted ? 'var(--border)' : tone.fill}`,
              background: muted ? 'transparent' : `${tone.fill}10`,
              borderRadius: 'var(--radius-md)',
              padding: 10,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: muted ? 'var(--text-muted)' : tone.fill,
                  display: 'inline-block',
                }}
              />
              <span
                className="text-[12px] font-semibold"
                style={{ color: muted ? 'var(--text-muted)' : tone.fill }}
              >
                {p}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleMute(p)}
              className="w-full text-[10px] font-semibold transition-colors mb-1.5"
              style={{
                padding: '4px 0',
                borderRadius: 'var(--radius-pill)',
                background: muted ? 'rgba(255,255,255,0.03)' : `${tone.fill}1F`,
                border: `1px solid ${muted ? 'var(--border)' : tone.fill}`,
                color: muted ? 'var(--text-muted)' : tone.fill,
              }}
              aria-pressed={!muted}
              title={muted ? `Show ${p} on this page` : `Mute ${p} on this page`}
            >
              {muted ? 'Muted' : '✓ Shown'}
            </button>
            {controlledClouds.length >= 2 && (
              <button
                type="button"
                disabled={muted}
                onClick={() => setBaseOverride(p)}
                className="w-full text-[10px] font-semibold transition-colors"
                style={{
                  padding: '4px 0',
                  borderRadius: 'var(--radius-pill)',
                  background: isBase ? `${tone.fill}22` : 'transparent',
                  border: `1px solid ${isBase ? tone.fill : 'var(--border)'}`,
                  color: isBase ? tone.fill : muted ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: muted ? 'not-allowed' : 'pointer',
                  opacity: muted ? 0.5 : 1,
                }}
                aria-pressed={isBase}
                title={muted ? `Unmute ${p} to use it as base` : `Anchor the comparison on ${p}`}
              >
                {isBase ? '★ Base' : 'Set base'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
  const geoStepBody = (
    <SuperGeoChips selected={selectedSuperGeos} onChange={setSelectedSuperGeos} bare />
  );
  const regionsStepBody = (
    <RegionMultiSelect
      regions={regionOptions}
      selected={selectedRegions}
      onChange={setSelectedRegions}
      bare
    />
  );

  type RaDim = Exclude<RaStep, 'done'>;
  const RA_ORDER: RaDim[] = ['clouds', 'geo', 'regions'];
  const RA_META: Record<RaDim, { n: number; title: string }> = {
    clouds: { n: 1, title: 'Clouds & basis' },
    geo: { n: 2, title: 'Geography' },
    regions: { n: 3, title: 'Regions' },
  };
  const raNext = (s: RaDim): RaStep => {
    const i = RA_ORDER.indexOf(s);
    return i < 0 || i >= RA_ORDER.length - 1 ? 'done' : RA_ORDER[i + 1];
  };
  const raAdvance = (s: RaDim) => {
    const nx = raNext(s);
    setRaStep(nx);
    if (nx === 'done') setRaFilterOpen(false);
  };
  const raComplete = (s: RaDim) =>
    s === 'clouds' ? true : s === 'geo' ? selectedSuperGeos.size > 0 : selectedRegions.size > 0;
  const raSummary = (s: RaDim): string => {
    if (s === 'clouds') {
      const visible = controlledClouds.filter((p) => !mutedProviders.has(p));
      const muted = controlledClouds.filter((p) => mutedProviders.has(p));
      const main = visible.map((p) => (p === effectiveBase ? `${p} (base)` : p)).join(' · ');
      return muted.length ? `${main} · ${muted.join('/')} muted` : main;
    }
    if (s === 'geo')
      return selectedSuperGeos.size
        ? [...selectedSuperGeos].map((g) => SUPER_GEO_LABEL[g]).join(' / ')
        : 'All geographies';
    return selectedRegions.size
      ? `${selectedRegions.size} region${selectedRegions.size === 1 ? '' : 's'}`
      : 'All regions';
  };
  const clearRaDim = (s: RaDim) => {
    if (s === 'geo') setSelectedSuperGeos(new Set());
    else if (s === 'regions') setSelectedRegions(new Set());
  };
  const raFilterSummary = [raSummary('clouds'), raSummary('geo'), raSummary('regions')].join(' · ');

  const raStepper = (
    <section className="space-y-2">
      <CollapsibleSetupHeader
        title="Filter"
        summary={raFilterSummary}
        open={raFilterOpen}
        onToggle={() => setRaFilterOpen((o) => !o)}
      />
      {raFilterOpen && (
        <div className="glass space-y-2" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
          {RA_ORDER.map((dim) => (
            <SetupStepCard
              key={dim}
              stepNumber={RA_META[dim].n}
              title={RA_META[dim].title}
              complete={raComplete(dim)}
              active={raStep === dim}
              summary={raSummary(dim)}
              onActivate={() => setRaStep(dim)}
            >
              {dim === 'clouds' ? cloudsStepBody : dim === 'geo' ? geoStepBody : regionsStepBody}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => raAdvance(dim)}
                  className="px-3 py-1 text-[11px] font-semibold transition-colors"
                  style={{ borderRadius: 'var(--radius-pill)', background: 'var(--interactive)', color: '#04111A' }}
                >
                  {dim === 'regions' ? 'Done' : 'Next →'}
                </button>
                {dim !== 'clouds' && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRaDim(dim);
                      raAdvance(dim);
                    }}
                    className="px-2.5 py-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)' }}
                  >
                    Skip
                  </button>
                )}
              </div>
            </SetupStepCard>
          ))}
        </div>
      )}
    </section>
  );

  const filterSection = simplifiedFilter ? raStepper : (
    <section className="space-y-3">
      <h2 className="section-h">Filter</h2>
      {/* v2.38 — The cloud-provider + base-cloud selectors are hidden when
          EMBEDDED in the Cloud Market Analytics shell: the provider/base is
          chosen once in Set up and flows in via `baseProviderControlled`. The
          standalone page keeps them. The region/category/family/size chip
          filter below always renders. */}
      {!embedded && (
      <div
        className="glass"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-1.5">
          Cloud Provider
          <span className="text-text-muted normal-case tracking-normal ml-1">
            · multi-select · narrows everything below
          </span>
        </div>
        <ProviderPillRow
          mode="multi"
          value={pickedProviders as Set<string>}
          onChange={(next) => {
            if (next instanceof Set) {
              // Guard: don't allow zero providers — produces an empty page.
              if (next.size === 0) return;
              setPickedProviders(new Set(Array.from(next).filter((p) => PROVIDERS.includes(p as Provider)) as Provider[]));
            }
          }}
          counts={PROVIDER_PILL_COUNTS}
        />

        {/* v2.30 — Base cloud of comparison. The family/size you pick below
            come from THIS cloud (so a chip is unambiguously "Azure's M-series"
            vs "AWS's"); the other selected clouds are compared at the category
            level. Only meaningful with ≥2 clouds selected. */}
        {activeProviders.length >= 2 && (
          <div
            className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary">
              Base cloud
              <span className="text-text-muted normal-case tracking-normal ml-1">
                · families &amp; sizes you browse come from here
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              {activeProviders.map((p) => {
                const isBase = p === effectiveBase;
                const tone = PROVIDER_TONE[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setBaseProvider(p);
                      // Drop family/size chips tied to the previous base so the
                      // filter never shows a chip you can no longer see options for.
                      setFilterChips((chips) =>
                        chips.filter((c) => c.kind === 'category' || c.provider === p),
                      );
                    }}
                    className="text-[10.5px] font-medium transition-colors"
                    style={{
                      padding: '3px 11px',
                      borderRadius: 'var(--radius-pill)',
                      background: isBase ? `${tone.fill}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isBase ? tone.fill : 'var(--border)'}`,
                      color: isBase ? tone.fill : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    aria-pressed={isBase}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* S53 — Embedded: clouds inherited from setup, mutable per-page here. */}
      {cloudMuteRow}

      {/* S53 — Region filter: geography (super-geo) then specific regions. The
            availability view's filter is intentionally region-only — the VM
            scoping was set once in Comparison setup. */}
      <SuperGeoChips selected={selectedSuperGeos} onChange={setSelectedSuperGeos} />

      {/* v2.39 — REGION multi-select scope. Narrows the map, roster, coverage
            scoreboard, equivalency tables, and the integrated equivalents table.
            EMPTY = all regions. Options narrow to the selected super-geos. */}
      <RegionMultiSelect
        regions={regionOptions}
        selected={selectedRegions}
        onChange={setSelectedRegions}
        label="Regions"
        hint="filter by Americas / EMEA / APAC above, then pick regions"
      />

      {/* VM category/family/size chip box + cross-cloud equivalency panel — kept
            on the coverage/equivalency views (and the standalone page). The
            region-only availability view hides them per the S53 redesign. */}
      {!simplifiedFilter && (
        <>
          {/* v2.28.x — One unified, searchable multi-select chip box (category /
                family / size). */}
          <RegionFilterChips
            providers={activeProviders}
            baseProvider={effectiveBase}
            catalog={userVms}
            chips={filterChips}
            onChange={setFilterChips}
          />
          {/* v2.33 — ADDITIVE cross-cloud equivalency table. ≥2 clouds only. */}
          {activeProviders.length >= 2 && (
            <CrossCloudEquivalencyPanel
              userVms={userVms}
              filteredVms={filteredVms}
              activeProviders={activeProviders}
              base={effectiveBase}
              filterChips={filterChips}
              onChange={setFilterChips}
            />
          )}
        </>
      )}
    </section>
  );

  // ── "Where it's available" — the promoted geographic surface (availability).
  const whereSection = (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="section-h">Where it's available</h2>
        {/* Segmented Map / List toggle. */}
        <div
          className="flex items-center gap-0.5 p-0.5"
          style={{
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
          }}
        >
          {(['map', 'list'] as const).map((v) => {
            const isActive = whereView === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setWhereView(v)}
                className="text-[10px] tracking-[0.04em] transition-colors capitalize"
                style={{
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'rgba(129, 140, 248, 0.16)' : 'transparent',
                  color: isActive ? 'var(--interactive)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--border-glow)' : 'transparent'}`,
                }}
                aria-pressed={isActive}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-[10px] text-text-muted -mt-1">
        {anyFilterActive ? <>showing {scopeLabel}</> : <>all VM types</>}
      </div>

      {mapMarks.length === 0 ? (
        <div
          className="glass text-[12px] text-text-muted italic px-1 py-8 text-center"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          No regions to plot — select at least one cloud provider above (and a
          category / family / size to scope the footprint).
        </div>
      ) : whereView === 'map' ? (
        <PanelErrorBoundary label="The region map">
          <CompetitiveMap marks={mapMarks} />
        </PanelErrorBoundary>
      ) : (
        <RegionRoster bySg={roster.bySg} total={roster.total} />
      )}
    </section>
  );

  // ── S54 — Read-only "what we're comparing" box (availability view, embedded).
  // Mirrors the Comparison setup picks; a 3-way granularity toggle (VM sizes /
  // Category / VM family) scopes the map + every visual below via the derive
  // effect above. The picks aren't editable here — "Edit in setup →" routes back.
  const comparisonBox =
    comparisonControlled && embedded && view === 'availability' ? (
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="section-h" style={{ margin: 0 }}>Comparison</h2>
            {/* Comparison ⇄ VM BoM toggle — mirrors the Compare dock. In BoM mode
                the views scope to the committed BoM's SKUs. */}
            {onCompareModeChange && (
              <div
                className="flex items-center gap-0.5 p-0.5"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                }}
              >
                {(
                  [
                    ['comparison', 'Comparison', true],
                    ['bom', 'VM BoM', bomModeAvailable],
                  ] as const
                ).map(([key, label, enabled]) => {
                  const on = effCompareMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!enabled}
                      onClick={() => onCompareModeChange(key)}
                      className="text-[10px] tracking-[0.03em] font-semibold transition-colors"
                      style={{
                        padding: '4px 11px',
                        borderRadius: 'var(--radius-pill)',
                        background: on ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
                        color: on
                          ? 'var(--interactive)'
                          : enabled
                            ? 'var(--text-secondary)'
                            : 'var(--text-muted)',
                        border: `1px solid ${on ? 'var(--border-glow)' : 'transparent'}`,
                        cursor: enabled ? 'pointer' : 'not-allowed',
                        opacity: enabled ? 1 : 0.45,
                      }}
                      aria-pressed={on}
                      title={
                        enabled
                          ? key === 'bom'
                            ? 'Scope to your committed VM BoM'
                            : 'Scope to your comparison picks'
                          : 'Add a committed VM BoM (sizes objective) to enable'
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            <span className="text-[10px] text-text-muted">· read-only · scopes the map &amp; visuals below</span>
          </div>
          {onEditSetup && (
            <button
              type="button"
              onClick={() => onEditSetup(compareGranularity)}
              className="text-[10.5px] font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--interactive)' }}
              title={`Edit the ${
                compareGranularity === 'category'
                  ? 'category'
                  : compareGranularity === 'family'
                    ? 'VM family'
                    : 'VM size'
              } selection in setup`}
            >
              Edit in setup →
            </button>
          )}
        </div>
        <div className="glass space-y-3" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
          {/* Granularity toggle — VM sizes / Category / VM family. Shown in VM BoM
              mode too (v2.52.16): it scopes the committed BoM at the chosen level
              (exact SKUs / their categories / their families). */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] tracking-[0.04em] font-semibold uppercase text-text-muted">
              Compare by
            </span>
            <div
              className="flex items-center gap-0.5 p-0.5"
              style={{
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
              }}
            >
              {(
                [
                  ['sizes', 'VM sizes'],
                  ['category', 'Category'],
                  ['family', 'VM family'],
                ] as const
              ).map(([key, label]) => {
                const isActive = compareGranularity === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCompareGranularity(key)}
                    className="text-[10px] tracking-[0.04em] transition-colors"
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: isActive ? 'rgba(129, 140, 248, 0.16)' : 'transparent',
                      color: isActive ? 'var(--interactive)' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'var(--border-glow)' : 'transparent'}`,
                    }}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Per-cloud picks at the chosen granularity (base cloud first). In VM
              BoM mode the base row shows the committed BoM at the chosen
              granularity; other clouds show their equivalent categories. */}
          <div className="space-y-1.5">
            {[effectiveBase, ...activeProviders.filter((p) => p !== effectiveBase)].map((p) => {
              const tone = PROVIDER_TONE[p];
              const picks =
                comparisonControlled.byProvider[p] ?? { category: [], family: [], size: [] };
              const values =
                effCompareMode === 'bom'
                  ? p === effectiveBase
                    ? compareGranularity === 'category'
                      ? bomScope.cats
                      : compareGranularity === 'family'
                        ? bomScope.fams
                        : bomScope.sizes
                    : picks.category
                  : compareGranularity === 'category'
                    ? picks.category
                    : compareGranularity === 'family'
                      ? picks.family
                      : picks.size;
              return (
                <div key={p} className="flex items-start gap-2">
                  <span
                    className="text-[11px] font-mono flex-shrink-0 flex items-center gap-1"
                    style={{ color: tone.fill, minWidth: 86 }}
                  >
                    {p}
                    {p === effectiveBase && <span className="text-[8.5px] text-text-muted">· base</span>}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {values.length === 0 ? (
                      <span className="text-[10.5px] italic text-text-muted">—</span>
                    ) : (
                      values.map((v) => {
                        const isBaseRow = p === effectiveBase;
                        const muted = isBaseRow && mutedBasePills.has(v);
                        const pillStyle: React.CSSProperties = {
                          padding: '2px 9px',
                          borderRadius: 'var(--radius-pill)',
                          background: muted ? 'transparent' : `${tone.fill}1A`,
                          border: `1px solid ${tone.fill}${muted ? '2A' : '44'}`,
                          color: muted ? 'var(--text-muted)' : 'var(--text-secondary)',
                          textDecoration: muted ? 'line-through' : 'none',
                          opacity: muted ? 0.65 : 1,
                        };
                        // Only the BASE row's pills toggle the scope — the other
                        // clouds follow the base at the equivalent category.
                        if (!isBaseRow) {
                          return (
                            <span key={v} className="text-[10.5px] font-medium" style={pillStyle} title={v}>
                              {v}
                            </span>
                          );
                        }
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              setMutedBasePills((prev) => {
                                const n = new Set(prev);
                                if (n.has(v)) n.delete(v);
                                else n.add(v);
                                return n;
                              })
                            }
                            className="text-[10.5px] font-medium inline-flex items-center gap-1"
                            style={{ ...pillStyle, cursor: 'pointer' }}
                            title={
                              muted
                                ? `${v} — muted from the scope · click to include`
                                : `${v} — click to mute (refine without leaving setup)`
                            }
                          >
                            {v}
                            <span style={{ fontSize: 9, opacity: 0.7 }}>{muted ? '+' : '×'}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Base-aware matching note — same rule the rest of the page uses. */}
          {(effCompareMode === 'bom' || compareGranularity !== 'category') &&
            activeProviders.length >= 2 && (
              <div className="text-[9.5px] text-text-muted leading-snug">
                {effCompareMode === 'bom' ? (
                  <>
                    The map scopes{' '}
                    <span style={{ color: PROVIDER_TONE[effectiveBase].fill }}>{effectiveBase}</span> to{' '}
                    {compareGranularity === 'category' ? (
                      <>
                        the <strong>{bomScope.cats.length}</strong> categor
                        {bomScope.cats.length === 1 ? 'y' : 'ies'} of your committed BoM
                      </>
                    ) : compareGranularity === 'family' ? (
                      <>
                        the <strong>{bomScope.fams.length}</strong> famil
                        {bomScope.fams.length === 1 ? 'y' : 'ies'} of your committed BoM
                      </>
                    ) : (
                      <>
                        your <strong>{bomScope.sizes.length}</strong> committed BoM SKU
                        {bomScope.sizes.length === 1 ? '' : 's'}
                      </>
                    )}
                    ;{' '}
                    {compareGranularity === 'sizes'
                      ? 'the other clouds are matched to the closest equivalent size.'
                      : 'the other clouds are matched at the equivalent category.'}
                  </>
                ) : (
                  <>
                    The map scopes{' '}
                    <span style={{ color: PROVIDER_TONE[effectiveBase].fill }}>{effectiveBase}</span> to
                    its exact {compareGranularity === 'family' ? 'family' : 'size'}; the other clouds
                    are matched at the equivalent category.
                  </>
                )}
              </div>
            )}
        </div>
      </section>
    ) : null;

  const inner = (
    <>
      {!embedded && (
        <div>
          <h1 className="section-h">Region Availability</h1>
          <p className="text-[11px] text-text-secondary mt-1 leading-snug max-w-3xl">
            Where each cloud does — and doesn't — offer the products you care about. Filter by
            category, family, or exact size; the summary updates with who serves it where, who leads,
            and the market gaps. Expand <strong>Detailed analysis</strong> below to drill into the
            underlying tables.
          </p>
        </div>
      )}

      {/* Filter — the shared scope, first on every view. */}
      {filterSection}

      {/* S54 — Read-only comparison box + granularity toggle (availability view).
            Drives the VM scope of everything below; editing routes to setup. */}
      {comparisonBox}

      {/* ── KPI hero — region totals per cloud + total gap count ──────────
            v2.27.9 — Filter-aware: when a category/family/size filter is
            active, the tiles count only the regions offering that scope
            (summaryCounts), the super-geo subline narrows with it, and each
            tile shows "of N total" so the filtered vs. full footprint is
            legible at a glance. The market-gaps tile follows the same scope. */}
      {showAvailability && (
      <section className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px]" style={{ minHeight: 16 }}>
          {anyFilterActive ? (
            <>
              <span
                className="font-semibold tracking-[0.04em]"
                style={{ color: 'var(--interactive)' }}
              >
                Scoped to {scopeLabel}
              </span>
              <span className="text-text-muted">
                · counts reflect regions offering this selection
              </span>
            </>
          ) : (
            <span className="text-text-muted">
              All VM types · pick a category, family, or size below to scope these counts
            </span>
          )}
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${activeProviders.length + 1}, minmax(0, 1fr))` }}
        >
          {activeProviders.map((p) => {
            const total = summaryCounts[p];
            const fullTotal = regionsByProvider[p].size;
            const tone = PROVIDER_TONE[p];
            const open = openTile === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setOpenTile(open ? null : p)}
                className="glass text-left transition-colors"
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: tone.bg,
                  border: `1px solid ${open ? tone.fill : 'transparent'}`,
                  cursor: 'pointer',
                }}
                aria-expanded={open}
                title={`Show the ${total} ${p} region${total === 1 ? '' : 's'}`}
              >
                <div
                  className="text-[9px] tracking-[0.04em] font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {p} regions
                </div>
                <div
                  className="font-bold mt-1 leading-none"
                  style={{ fontSize: 24, color: tone.fill, letterSpacing: '-0.01em' }}
                >
                  {total}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {anyFilterActive && <>of {fullTotal} total · </>}
                  across {superGeoCountByProvider[p]} super-geo
                  {superGeoCountByProvider[p] === 1 ? '' : 's'}
                </div>
                <div className="text-[9px] mt-1" style={{ color: open ? tone.fill : 'var(--text-muted)' }}>
                  {open ? '▾ hide regions' : '▸ click to list regions'}
                </div>
              </button>
            );
          })}
          {(() => {
            const open = openTile === 'gaps';
            const gapCount = coverageDetail.baseGapCounted;
            return (
              <button
                type="button"
                onClick={() => setOpenTile(open ? null : 'gaps')}
                className="glass text-left transition-colors"
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(253, 211, 77, 0.06)',
                  border: `1px solid ${open ? '#FCD34D' : 'transparent'}`,
                  cursor: 'pointer',
                }}
                aria-expanded={open}
                title="Show the market-gap locations"
              >
                <div
                  className="text-[9px] tracking-[0.04em] font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {`${effectiveBase} market gaps`}
                </div>
                <div
                  className="font-bold mt-1 leading-none"
                  style={{ fontSize: 24, color: '#FCD34D', letterSpacing: '-0.01em' }}
                >
                  {gapCount}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {`metros a competitor serves but ${effectiveBase} doesn’t`}
                </div>
                <div className="text-[9px] mt-1" style={{ color: open ? '#FCD34D' : 'var(--text-muted)' }}>
                  {open ? '▾ hide gaps' : '▸ click to list gaps'}
                </div>
              </button>
            );
          })()}
        </div>

        {/* Reveal panel — the regions / gaps behind the clicked tile. */}
        {openTile && openTile !== 'gaps' && (
          <RevealPanel
            title={`${openTile} regions`}
            tone={PROVIDER_TONE[openTile].fill}
            onClose={() => setOpenTile(null)}
            items={regionListByProvider[openTile].map((r) => ({
              key: r.region,
              primary: r.label || r.region,
              secondary: r.label ? r.region : undefined,
              group: r.superGeo,
            }))}
            empty={`No ${openTile} regions offer this selection.`}
          />
        )}
        {openTile === 'gaps' && (
          <GapRevealPanel
            base={effectiveBase}
            competitors={coverageDetail.competitors}
            competitorGap={coverageDetail.competitorGap}
            bothCompetitors={coverageDetail.bothCompetitors}
            onClose={() => setOpenTile(null)}
          />
        )}
      </section>
      )}

      {/* ── S54 — "At a glance" overlap cards, carried over directly below the
            KPI scoreboard: served-by-all / shared-by-two+ / per-cloud exclusive,
            click-to-reveal, with the color key that also explains the map dots.
            Only meaningful (and only shown) when ≥2 clouds are compared. ───── */}
      {showAvailability && coverageDetail.activeCount >= 2 && (
        <OverlapGlance
          providers={activeProviders}
          base={effectiveBase}
          overlap={{
            all: coverageDetail.all,
            baseShared: coverageDetail.baseSharedCount,
            total: coverageDetail.totalPlaces,
            activeCount: coverageDetail.activeCount,
          }}
          allItems={coverageDetail.allList.map((x) => ({
            key: `${x.city}-${x.country}-${x.owner}-${x.region}`,
            primary: placeLabel(x.city, x.country),
            secondary: x.region,
            group: x.superGeo,
            accent: coverageTone(PROVIDERS.filter((p) => x.regionByProvider[p])),
          }))}
          sharedByBaseItems={coverageDetail.competitors.map((c) => ({
            competitor: c,
            items: coverageDetail.sharedByBase[c].map((x) => ({
              key: `${x.city}-${x.country}-${x.owner}-${x.region}`,
              primary: placeLabel(x.city, x.country),
              secondary: x.region,
              group: x.superGeo,
              accent: PROVIDER_TONE[c].fill,
            })),
          }))}
          exclusiveItems={
            Object.fromEntries(
              PROVIDERS.map((p) => [
                p,
                coverageDetail.exclusive[p].map((x) => ({
                  key: `${x.city}-${x.country}-${x.owner}-${x.region}`,
                  primary: placeLabel(x.city, x.country),
                  secondary: x.region,
                  group: x.superGeo,
                  accent: PROVIDER_TONE[p].fill,
                })),
              ]),
            ) as Record<Provider, RevealItem[]>
          }
        />
      )}

      {/* ── Where it's available — the promoted geographic surface (Global
            map or super-geo roster). Part of the 'availability' view. ──── */}
      {showAvailability && whereSection}

      {/* ── S53 — Integrated cross-cloud region equivalents table, directly
            below the map. Rows = equivalency clusters (Azure West US ↔ AWS
            us-west-1 ↔ GCP us-west1), grouped into collapsible AMER / EMEA /
            APAC sections, one column per visible cloud (base first). No %
            similarity — a region is either an equivalent or not. ─────────── */}
      {showAvailability && (
        <RegionEquivTable
          byGeo={equivByGeo}
          columns={equivColumns}
          total={equivTotal}
          base={effectiveBase}
          openGeos={openEquivGeos}
          onToggleGeo={(sg) =>
            setOpenEquivGeos((prev) => {
              const next = new Set(prev);
              if (next.has(sg)) next.delete(sg);
              else next.add(sg);
              return next;
            })
          }
        />
      )}


      {/* ── Detailed analysis — collapsed by default for an executive read.
            Each heavy table lives behind a disclosure; open the one you need.
            Standalone shows one header over all tables; embedded splits the
            equivalency tables (equivalency view) from the footprint/matrix
            (coverage view) so each sub-page owns its drill-downs. */}
      {(showEquivalency || (showCoverage && !embedded)) && (
        <div className="text-[10px] tracking-[0.04em] font-semibold uppercase text-text-muted pt-1">
          {embedded && view === 'equivalency' ? 'Equivalency tables' : 'Detailed analysis'}
          <span className="text-text-muted normal-case tracking-normal ml-1">· expand a section to drill in</span>
        </div>
      )}

      {showEquivalency && (
        <>
          <Disclosure
            title="Compare a single VM across clouds"
            subtitle="Pick a size → its equivalent on each cloud + which countries serve it"
            defaultOpen={embedded}
          >
            <CrossCloudCompare />
          </Disclosure>

          <Disclosure
            title="VM equivalency — line by line"
            subtitle="Every reference-cloud size → closest match on the other clouds, with the why"
          >
            <VmEquivalencyTable />
          </Disclosure>

          <Disclosure
            title="Region equivalency — line by line"
            subtitle="Catalog regions clustered into cross-cloud equivalency rows, with the why"
          >
            <RegionEquivalencyTable />
          </Disclosure>
        </>
      )}

      {showCoverage && (
        <>
      {embedded && view === 'coverage' && (
        <div className="text-[10px] tracking-[0.04em] font-semibold uppercase text-text-muted pt-1">
          Detailed analysis
          <span className="text-text-muted normal-case tracking-normal ml-1">· expand a section to drill in</span>
        </div>
      )}
      <Disclosure
        title="Region footprint by provider"
        subtitle="Per-cloud equivalent / exclusive / market-gap breakdown + super-geo bars"
        defaultOpen={embedded}
      >
      {/* ── Comparison bar chart ────────────────────────────────────── */}
      <section
        className="glass"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        <div className="text-[10px] tracking-[0.04em] font-semibold text-text-muted mb-3">
          Region footprint · {pickedFamilies.size > 0 ? 'filtered by family' : 'all regions'}
        </div>
        <div className="space-y-2">
          {PROVIDERS.filter((p) => pickedProviders.has(p)).map((p) => {
            const tone = PROVIDER_TONE[p];
            const value =
              pickedFamilies.size > 0
                ? countInScope(filteredRegionsByProvider[p])
                : countInScope(regionsByProvider[p]);
            const widthPct = (value / maxRegions) * 100;
            const perGeo: Record<SuperGeo, number> = {
              AMER: regionsBySuperGeo.AMER[p].size,
              EMEA: regionsBySuperGeo.EMEA[p].size,
              APAC: regionsBySuperGeo.APAC[p].size,
            };
            return (
              <div key={p} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono" style={{ color: tone.fill }}>
                    {p}
                  </span>
                  <span className="font-mono text-text-muted text-[10px]">
                    AMER {perGeo.AMER} · EMEA {perGeo.EMEA} · APAC {perGeo.APAC}{' '}
                    <span className="text-text-primary ml-2">
                      total {value}
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    height: 14,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  {(['AMER', 'EMEA', 'APAC'] as SuperGeo[]).map((sg, idx) => {
                    const pct = (perGeo[sg] / maxRegions) * 100;
                    const colors = [tone.fill, tone.ring, 'rgba(255,255,255,0.18)'];
                    return (
                      <div
                        key={sg}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: colors[idx],
                          transition: 'width 200ms',
                        }}
                        title={`${p} · ${sg}: ${perGeo[sg]} regions`}
                      />
                    );
                  })}
                  <div
                    style={{
                      width: `${Math.max(0, 100 - widthPct)}%`,
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[9px] text-text-muted mt-3 flex items-center gap-3">
          <span>Bar segments by super-geo:</span>
          <span className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                background: 'currentColor',
                opacity: 0.85,
                display: 'inline-block',
              }}
            />
            AMER
          </span>
          <span className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                background: 'currentColor',
                opacity: 0.45,
                display: 'inline-block',
              }}
            />
            EMEA
          </span>
          <span className="flex items-center gap-1">
            <span
              style={{
                width: 10,
                height: 10,
                background: 'currentColor',
                opacity: 0.2,
                display: 'inline-block',
              }}
            />
            APAC
          </span>
        </div>
      </section>

      {/* v2.17.22 — Three-box footprint comparison.
          One column per provider with three sub-sections:
            • Equivalent — places this cloud shares with ≥1 competitor (dots for which)
            • Exclusive — places only this cloud holds (rendered in its color)
            • Market Gaps — places competitors hold but this cloud doesn't
              (rendered in the COMPETITOR's color so users can see who they're
              ceding to at a glance)
          A footprint bar at the top of each box visualizes total coverage
          so users can see "who has more offerings" without doing math. */}
      <section className="space-y-2">
        <div className="flex items-end justify-between gap-2 flex-wrap">
          <div className="text-[10px] tracking-[0.04em] font-semibold text-text-muted">
            Footprint comparison
            <span className="text-text-muted normal-case tracking-normal ml-2">
              · equivalent · exclusive · market gaps · per provider
            </span>
          </div>
          <div className="text-[10px] text-text-muted leading-snug max-w-3xl">
            Each box partitions every region into the three buckets from that
            cloud's POV. Dots in <strong>Equivalent</strong> show which competitors
            also have a region in that city. <strong>Exclusive</strong> wins are
            painted in the cloud's own color. <strong>Market Gaps</strong> are
            painted in the competitor's color — the cloud you're losing the city to.
          </div>
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
        >
          {PROVIDERS.map((p) => {
            const fp = footprintByProvider[p];
            const tone = PROVIDER_TONE[p];
            const widthPct = Math.round((fp.total / maxFootprint) * 100);
            return (
              <div
                key={p}
                className="glass"
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: tone.bg,
                }}
              >
                {/* Header + footprint bar */}
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    className="text-[12px] font-bold tracking-[0.04em]"
                    style={{ color: tone.fill }}
                  >
                    {p}
                  </span>
                  <span
                    className="font-mono text-[10px] text-text-muted"
                  >
                    {fp.total} regions
                  </span>
                </div>
                <div
                  className="mb-3"
                  style={{
                    height: 6,
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                  title={`${p} covers ${fp.total} cities across the active provider scope`}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: tone.fill,
                      boxShadow: `0 0 8px ${tone.ring}`,
                    }}
                  />
                </div>

                <FootprintSection
                  title="Equivalent regions"
                  subtitle={`${fp.equivalent.length} · cities also covered by ≥1 competitor`}
                  emptyText="No overlapping cities."
                  items={fp.equivalent}
                  renderItem={(item) => (
                    <li key={`${item.city}-${item.country}`} className="flex items-center gap-1.5 text-[10px]">
                      <DotsForCovered providers={item.otherCovered} />
                      <span className="text-text-primary">
                        {placeLabel(item.city, item.country)}
                      </span>
                      <span className="text-text-muted opacity-60">
                        · {item.superGeo}
                      </span>
                    </li>
                  )}
                />

                <FootprintSection
                  title="Exclusive regions"
                  subtitle={`${fp.exclusive.length} · only ${p} has a region here`}
                  emptyText="No exclusive cities — every region this cloud holds is contested."
                  items={fp.exclusive}
                  renderItem={(item) => (
                    <li
                      key={`${item.city}-${item.country}`}
                      className="text-[10px]"
                      style={{ color: tone.fill }}
                    >
                      {placeLabel(item.city, item.country)}
                      <span className="text-text-muted opacity-60 ml-1">
                        · {item.superGeo}
                      </span>
                    </li>
                  )}
                />

                <FootprintSection
                  title="Market gaps"
                  subtitle={`${fp.gap.length} · cities where competitors have presence and ${p} doesn't`}
                  emptyText={`${p} matches every city its competitors hold.`}
                  items={fp.gap}
                  renderItem={(item) => {
                    // Color the city name by the COMPETITOR that has it.
                    // When multiple competitors hold the city, render each
                    // segment in that competitor's color.
                    return (
                      <li key={`${item.city}-${item.country}`} className="text-[10px]">
                        <span className="text-text-primary">
                          {placeLabel(item.city, item.country)}
                        </span>
                        <span className="text-text-muted opacity-60 ml-1">
                          · {item.superGeo} · held by{' '}
                        </span>
                        {item.otherCovered.map((op, idx) => (
                          <span key={op}>
                            <span style={{ color: PROVIDER_TONE[op].fill, fontWeight: 600 }}>
                              {op}
                            </span>
                            {idx < item.otherCovered.length - 1 && (
                              <span className="text-text-muted">, </span>
                            )}
                          </span>
                        ))}
                      </li>
                    );
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>
      </Disclosure>

      <Disclosure
        title="Region availability matrix"
        subtitle="One row per location · ✓ + VM count where each cloud offers the filtered selection"
      >
      {/* ── Region matrix ──────────────────────────────────────────── */}
      <section
        className="glass"
        style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
      >
        <div className="text-[10px] tracking-[0.04em] font-semibold text-text-muted mb-3">
          Region availability matrix · {matrixRows.length} regions
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-2 py-1.5 text-text-muted tracking-[0.02em] text-[9px]">
                  Super-geo
                </th>
                <th className="text-left px-2 py-1.5 text-text-muted tracking-[0.02em] text-[9px]">
                  Location
                </th>
                {PROVIDERS.filter((p) => pickedProviders.has(p)).map((p) => (
                  <th
                    key={p}
                    className="text-left px-2 py-1.5 tracking-[0.02em] text-[9px]"
                    style={{ color: PROVIDER_TONE[p].fill }}
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let lastSg: SuperGeo | null = null;
                return matrixRows.map((row, idx) => {
                  const sgChanged = row.superGeo !== lastSg;
                  lastSg = row.superGeo;
                  return (
                    <tr
                      key={`${row.superGeo}::${row.city}::${row.country}::${idx}`}
                      style={{
                        borderTop: sgChanged
                          ? '1px solid var(--border)'
                          : '1px solid rgba(255,255,255,0.04)',
                        background: sgChanged ? 'rgba(129, 140, 248, 0.02)' : undefined,
                      }}
                    >
                      <td className="px-2 py-1.5 text-text-muted">
                        {sgChanged ? row.superGeo : ''}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-text-primary">{row.city}</span>
                        {row.city !== row.country && (
                          <span className="text-text-muted">, {row.country}</span>
                        )}
                      </td>
                      {PROVIDERS.filter((p) => pickedProviders.has(p)).map((p) => {
                        const cell = row.perProvider[p];
                        const tone = PROVIDER_TONE[p];
                        return (
                          <td key={p} className="px-2 py-1.5">
                            {cell.offered ? (
                              <span style={{ color: tone.fill }}>
                                ✓ {cell.vmCount} VM{cell.vmCount === 1 ? '' : 's'}
                              </span>
                            ) : (
                              <span className="text-text-muted opacity-50">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {matrixRows.length === 0 && (
          <div className="text-[11px] italic text-text-muted text-center py-4">
            No regions match the current filters.
          </div>
        )}
      </section>
      </Disclosure>
        </>
      )}

      {/* ── Footer deep-link — only on the standalone page; inside the unified
            Competitive shell the sidebar already owns navigation. ───────── */}
      {!embedded && (
        <div
          className="glass"
          style={{
            padding: 12,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(129, 140, 248, 0.04)',
            border: '1px solid var(--border-glow)',
          }}
        >
          <div className="text-[10px] text-text-secondary leading-snug">
            <strong className="text-text-primary">Need to deep-compare a specific VM across these regions?</strong>{' '}
            Switch to <button
              onClick={() => dispatch({ type: 'UI_SET', ui: { activePage: 'competitive' } })}
              className="font-mono"
              style={{
                color: 'var(--interactive)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
              }}
            >
              VM Competitive Offering
            </button>{' '}
            for full specs, pricing-over-time, and the cross-cloud spec deltas.
          </div>
        </div>
      )}
      {/* Reference so `deepLinkToVm` stays type-checked for future SKU
          drill-down chips per row (not yet wired into the matrix). */}
      {void deepLinkToVm}
    </>
  );

  // Embedded: the shell's <main> supplies the scroll + padding, so render a
  // plain block. Standalone: keep the page's own scroll container + padding.
  return embedded ? (
    <div className="space-y-4">{inner}</div>
  ) : (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">{inner}</div>
  );
}


/** A metro in the promoted "Where it's available" roster — city/country +
 *  which clouds serve it + each serving cloud's own region name. */
type RosterCard = {
  city: string;
  country: string;
  superGeo: SuperGeo;
  covered: Provider[];
  regionByProvider: Partial<Record<Provider, string>>;
};

/** The List view of "Where it's available" — every metro in the current
 *  selection, grouped by super-geo (Americas / EMEA / APAC), rendered as a
 *  responsive multi-column grid of compact cards. Each card shows the metro +
 *  country (primary) and the serving clouds' own region names (secondary), and
 *  is color-tinted by ownership (1 cloud = brand · 2 = purple · all = green). */
function RegionRoster({
  bySg,
  total,
}: {
  bySg: Record<SuperGeo, RosterCard[]>;
  total: number;
}) {
  // Every super-geo group starts collapsed; clicking a header toggles that one,
  // the top "Expand/Collapse all" pill flips them all at once. Hook must precede
  // the early return below to satisfy the Rules of Hooks.
  const [openGroups, setOpenGroups] = useState<Set<SuperGeo>>(() => new Set());
  if (total === 0) {
    return (
      <div
        className="glass text-[12px] text-text-muted italic px-1 py-8 text-center"
        style={{ borderRadius: 'var(--radius-md)' }}
      >
        No regions in the current selection.
      </div>
    );
  }
  const grouped = SUPER_GEOS.map((sg) => ({ sg, rows: bySg[sg] })).filter(
    (g) => g.rows.length > 0,
  );
  const anyOpen = grouped.some((g) => openGroups.has(g.sg));
  const toggleGroup = (sg: SuperGeo) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(sg)) next.delete(sg);
      else next.add(sg);
      return next;
    });
  const toggleAll = () =>
    setOpenGroups(anyOpen ? new Set() : new Set(grouped.map((g) => g.sg)));
  return (
    <div
      className="glass space-y-4"
      style={{ padding: 16, borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] text-text-secondary hover:text-interactive transition-colors px-2 py-0.5"
          style={{ borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}
        >
          {anyOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      {grouped.map(({ sg, rows }) => {
        const open = openGroups.has(sg);
        return (
          <div key={sg}>
            <button
              type="button"
              onClick={() => toggleGroup(sg)}
              className="w-full flex items-center text-left text-[9px] tracking-[0.06em] uppercase font-semibold text-text-muted hover:text-text-secondary transition-colors mb-2"
            >
              <span className="mr-1.5">{open ? '▾' : '▸'}</span>
              {SUPER_GEO_LABEL[sg]}
              <span className="normal-case tracking-normal ml-1.5">· {rows.length}</span>
            </button>
            {open && (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
              >
                {rows.map((r) => {
                  const accent = coverageTone(r.covered);
                  const names = regionNamesLine(r.regionByProvider);
                  return (
                    <div
                      key={`${r.city}::${r.country}`}
                      className="leading-tight"
                      style={{
                        padding: '8px 11px',
                        borderRadius: 'var(--radius-sm)',
                        background: `color-mix(in srgb, ${accent} 9%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${accent} 50%, var(--border))`,
                        borderLeft: `3px solid ${accent}`,
                      }}
                    >
                      <div className="text-[11.5px] text-text-primary font-medium truncate" title={placeLabel(r.city, r.country)}>
                        {placeLabel(r.city, r.country)}
                      </div>
                      <div
                        className="font-mono text-[9.5px] mt-0.5 leading-snug"
                        style={{ color: accent }}
                        title={names}
                      >
                        {names}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A location row inside a RevealPanel. `group` (super-geo) drives the section
 *  headers; `secondary` carries the provider region name(s); `accent` tints the
 *  card by which cloud(s) own it. */
type RevealItem = {
  key: string;
  primary: string;
  secondary?: string;
  group?: SuperGeo;
  accent?: string;
};

/** Expandable list of locations behind a clicked stat tile / overlap card,
 *  grouped by super-geo (Americas / EMEA / Asia-Pacific). */
function RevealPanel({
  title,
  tone,
  items,
  empty,
  onClose,
}: {
  title: string;
  tone: string;
  items: RevealItem[];
  empty: string;
  onClose: () => void;
}) {
  // Bucket by super-geo, preserving the canonical AMER → EMEA → APAC order.
  const grouped = SUPER_GEOS.map((sg) => ({
    sg,
    rows: items.filter((it) => it.group === sg),
  })).filter((g) => g.rows.length > 0);
  const ungrouped = items.filter((it) => !it.group);

  // Match the "notable market gaps" reading style: a plain single-line row —
  // metro + country in primary text, the cloud's own region name in muted
  // monospace beside it — never the chunky bordered card-per-item.
  const Row = (it: RevealItem) => (
    <div
      key={it.key}
      className="text-[10.5px] leading-tight truncate"
      title={it.secondary ? `${it.primary} · ${it.secondary}` : it.primary}
    >
      <span className="text-text-primary">{it.primary}</span>
      {it.secondary && (
        <span className="text-text-muted font-mono text-[9px] ml-1.5">{it.secondary}</span>
      )}
    </div>
  );
  // Rows flow into responsive columns so a large reveal (e.g. all 64 Azure
  // regions) uses the panel width instead of one tall scroll.
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  };

  return (
    <div
      className="glass"
      style={{ padding: 14, borderRadius: 'var(--radius-md)', border: `1px solid ${tone}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] tracking-[0.04em] font-semibold" style={{ color: tone }}>
          {title}
          <span className="text-text-muted normal-case tracking-normal ml-1.5">· {items.length}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
          title="Close"
        >
          ✕
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] italic text-text-muted">{empty}</div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }} className="space-y-3">
          {grouped.map(({ sg, rows }) => (
            <div key={sg}>
              <div className="text-[9px] tracking-[0.06em] uppercase font-semibold text-text-muted mb-1">
                {SUPER_GEO_LABEL[sg]}
                <span className="normal-case tracking-normal ml-1.5">· {rows.length}</span>
              </div>
              <div className="grid gap-x-4 gap-y-1" style={gridStyle}>
                {rows.map(Row)}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div className="grid gap-x-4 gap-y-1" style={gridStyle}>
              {ungrouped.map(Row)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * S53 — Market-gap reveal, framed from the BASE cloud's point of view.
 * Buckets the gap locations: base-present first ({base} only, then {base} +
 * each other cloud), then a "No {base}" section at the bottom divided by which
 * competitor fills the gap ({other} only, both). A compact color key rides the
 * header row, on the same line as the title.
 * ──────────────────────────────────────────────────────────────────────── */
const GAP_SHARED_FILL = '#A78BFA';
type GapLoc = {
  city: string;
  country: string;
  superGeo: SuperGeo;
  /** The specific competitor region this gap row is (region-level count). */
  region?: string;
  /** Which cloud owns `region`. */
  owner?: Provider;
  regionByProvider: Partial<Record<Provider, string>>;
};

/* v2.52.19 — Market gaps STRICTLY from the BASE cloud's POV: places a COMPETITOR
 * serves but the base does NOT. Counted = exactly one competitor (per-competitor
 * buckets); the "both competitors, no base" bucket is shown for context but
 * flagged out of the headline count. Every bucket is grouped Americas → EMEA →
 * APAC. (Base-present places are NOT gaps and live in the overlap/exclusive
 * cards instead.) */
function GapRevealPanel({
  base,
  competitors,
  competitorGap,
  bothCompetitors,
  onClose,
}: {
  base: Provider;
  competitors: Provider[];
  competitorGap: Record<Provider, GapLoc[]>;
  bothCompetitors: GapLoc[];
  onClose: () => void;
}) {
  const tone = '#FCD34D';
  const gridStyle: React.CSSProperties = { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' };
  const countedTotal = competitors.reduce((n, c) => n + (competitorGap[c]?.length ?? 0), 0);
  const bySg = (items: GapLoc[]) =>
    SUPER_GEOS.map((sg) => ({
      sg,
      rows: items.filter((g) => g.superGeo === sg).sort((a, b) => a.city.localeCompare(b.city)),
    })).filter((g) => g.rows.length > 0);

  const renderBucket = (
    key: string,
    label: string,
    fill: string,
    items: GapLoc[],
    notCounted?: boolean,
  ) => (
    <div key={key}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ width: 8, height: 8, borderRadius: 999, background: fill, display: 'inline-block' }} />
        <span className="text-[10px] font-semibold tracking-[0.02em]" style={{ color: fill }}>
          {label}
        </span>
        <span className="text-[9px] text-text-muted">· {items.length}</span>
        {notCounted && (
          <span
            className="text-[8px] tracking-[0.05em] uppercase font-semibold px-1.5 py-0.5"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}
            title="Both competitors serve this metro — shown for context, excluded from the gap count"
          >
            not in count
          </span>
        )}
      </div>
      <div className="space-y-2">
        {bySg(items).map(({ sg, rows }) => (
          <div key={sg}>
            <div className="text-[9px] tracking-[0.06em] uppercase font-semibold text-text-muted mb-1">
              {SUPER_GEO_LABEL[sg]}
              <span className="normal-case tracking-normal"> · {rows.length}</span>
            </div>
            <div className="grid gap-x-4 gap-y-1" style={gridStyle}>
              {rows.map((g) => {
                const serving = (Object.keys(g.regionByProvider) as Provider[]).filter(
                  (p) => g.regionByProvider[p],
                );
                const place = placeLabel(g.city, g.country);
                // Region-level: show THIS row's own competitor region name.
                const region = g.region ?? serving.map((p) => g.regionByProvider[p]).filter(Boolean).join(' / ');
                return (
                  <div
                    key={`${g.city}-${g.country}-${g.owner ?? ''}-${g.region ?? region}`}
                    className="text-[10.5px] leading-tight truncate"
                    title={`${place} · ${region} · served by ${serving.join('/')} · no ${base}`}
                  >
                    <span className="text-text-primary">{place}</span>
                    {region && (
                      <span className="text-text-muted font-mono text-[9px] ml-1.5">{region}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const empty = countedTotal === 0 && bothCompetitors.length === 0;
  return (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)', border: `1px solid ${tone}` }}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="text-[10px] tracking-[0.04em] font-semibold" style={{ color: tone }}>
          Market gaps — a competitor serves, {base} doesn’t
          <span className="text-text-muted normal-case tracking-normal ml-1.5">· {countedTotal}</span>
          {bothCompetitors.length > 0 && (
            <span className="text-text-muted normal-case tracking-normal font-normal ml-1.5">
              (+{bothCompetitors.length} served by both competitors, not counted)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
          title="Close"
        >
          ✕
        </button>
      </div>

      {empty ? (
        <div className="text-[11px] italic text-text-muted">
          No market gaps — {base} serves every metro a competitor does under this selection.
        </div>
      ) : (
        <div style={{ maxHeight: 360, overflowY: 'auto' }} className="space-y-3">
          {competitors.map(
            (c) =>
              (competitorGap[c]?.length ?? 0) > 0 &&
              renderBucket(c, `${c} only — no ${base}`, PROVIDER_TONE[c].fill, competitorGap[c]),
          )}
          {bothCompetitors.length > 0 &&
            renderBucket(
              'both',
              `${competitors.join(' + ')} — no ${base}`,
              GAP_SHARED_FILL,
              bothCompetitors,
              true,
            )}
        </div>
      )}
    </div>
  );
}

function OverlapStat({
  label,
  value,
  sub,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  tone: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick && value > 0;
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className="text-left transition-colors"
      style={{
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        background: active ? `color-mix(in srgb, ${tone} 12%, transparent)` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? tone : 'var(--border)'}`,
        cursor: clickable ? 'pointer' : 'default',
        width: '100%',
      }}
      aria-expanded={active}
      title={clickable ? `Show the ${value} location${value === 1 ? '' : 's'}` : undefined}
    >
      <div className="text-[9px] tracking-[0.03em] uppercase text-text-muted">{label}</div>
      <div className="font-bold leading-none mt-1" style={{ fontSize: 20, color: tone }}>
        {value}
      </div>
      <div className="text-[9.5px] text-text-muted mt-0.5">
        {sub}
        {clickable && <span style={{ color: active ? tone : 'var(--text-muted)' }}> · {active ? 'hide' : 'show'}</span>}
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * S54 — Overlap "at a glance" cards. The cross-cloud coverage breakdown
 * (served-by-all / shared-by-two+ / per-cloud exclusive) + color key + a
 * click-to-reveal locations panel. Mirrors the cards inside PmSummary so the
 * SAME glance renders on the Region-availability view directly below the KPI
 * scoreboard (carried over per user request), self-contained with its own
 * open/close state.
 * ──────────────────────────────────────────────────────────────────────── */
function OverlapGlance({
  providers,
  base,
  overlap,
  allItems,
  sharedByBaseItems,
  exclusiveItems,
}: {
  providers: Provider[];
  base: Provider;
  overlap: { all: number; baseShared: number; total: number; activeCount: number };
  allItems: RevealItem[];
  /** Base + exactly one competitor, one entry per competitor (each super-geo
   *  grouped inside its RevealPanel). */
  sharedByBaseItems: { competitor: Provider; items: RevealItem[] }[];
  exclusiveItems: Record<Provider, RevealItem[]>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="space-y-3">
      {/* Overlap & exclusivity cards — clickable to reveal the actual locations. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {overlap.activeCount <= 2 ? (
          <OverlapStat
            label={`${base} shared with the other cloud`}
            value={overlap.all}
            sub={`of ${overlap.total} ${base} regions`}
            tone="#34D399"
            active={open === 'all'}
            onClick={() => setOpen(open === 'all' ? null : 'all')}
          />
        ) : (
          <>
            <OverlapStat
              label={`${base} served by all clouds`}
              value={overlap.all}
              sub={`of ${overlap.total} ${base} regions`}
              tone="#34D399"
              active={open === 'all'}
              onClick={() => setOpen(open === 'all' ? null : 'all')}
            />
            <OverlapStat
              label={`${base} shared with a competitor`}
              value={overlap.baseShared}
              sub={`${base} regions + one competitor`}
              tone="var(--interactive)"
              active={open === 'twoPlus'}
              onClick={() => setOpen(open === 'twoPlus' ? null : 'twoPlus')}
            />
          </>
        )}
        {providers.map((p) => (
          <OverlapStat
            key={p}
            label={`${p} exclusive`}
            value={exclusiveItems[p].length}
            sub={p === base ? `of ${overlap.total} ${base} regions` : 'only this cloud serves'}
            tone={PROVIDER_TONE[p].fill}
            active={open === p}
            onClick={() => setOpen(open === p ? null : p)}
          />
        ))}
      </div>
      {/* Reconciliation: the base cloud's three buckets sum to its region total. */}
      <div className="text-[10px] text-text-muted">
        {base}: {overlap.all} served by all + {overlap.baseShared} shared + {exclusiveItems[base]?.length ?? 0} exclusive
        {' = '}
        {overlap.all + overlap.baseShared + (exclusiveItems[base]?.length ?? 0)} of {overlap.total} {base} regions (by unique region name)
      </div>

      {/* Color key — the reveal cards (and the map dots above) are tinted by
          WHO serves a location. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
        <span className="font-semibold tracking-[0.04em] uppercase">Color key</span>
        {providers.map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: PROVIDER_TONE[p].fill, display: 'inline-block' }} />
            {p} only
          </span>
        ))}
        {providers.length >= 2 && (
          <span className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#A78BFA', display: 'inline-block' }} />
            Shared by two
          </span>
        )}
        {providers.length >= 2 && (
          <span className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#34D399', display: 'inline-block' }} />
            {providers.length >= 3 ? 'All clouds' : 'Both clouds'}
          </span>
        )}
      </div>

      {/* Reveal — the locations behind whichever card is expanded. The shared
          card splits into one panel per "base & competitor" pair, each grouped
          Americas → EMEA → APAC inside its RevealPanel. */}
      {open === 'twoPlus' ? (
        <div className="space-y-2">
          {sharedByBaseItems
            .filter((b) => b.items.length > 0)
            .map((b) => (
              <RevealPanel
                key={b.competitor}
                title={`${base} & ${b.competitor}`}
                tone={PROVIDER_TONE[b.competitor].fill}
                onClose={() => setOpen(null)}
                items={b.items}
                empty={`No metros shared by ${base} and ${b.competitor}.`}
              />
            ))}
          {sharedByBaseItems.every((b) => b.items.length === 0) && (
            <RevealPanel
              title={`Shared with a competitor`}
              tone="var(--interactive)"
              onClose={() => setOpen(null)}
              items={[]}
              empty={`${base} doesn’t co-locate with a single competitor under this selection.`}
            />
          )}
        </div>
      ) : open ? (
        <RevealPanel
          title={
            open === 'all'
              ? overlap.activeCount >= 3
                ? 'Served by all clouds'
                : 'Shared by both clouds'
              : `${open} exclusive regions`
          }
          tone={open === 'all' ? '#34D399' : PROVIDER_TONE[open as Provider].fill}
          onClose={() => setOpen(null)}
          items={open === 'all' ? allItems : exclusiveItems[open as Provider]}
          empty="No locations in this bucket under the current selection."
        />
      ) : null}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * v2.17.22 — Footprint sub-section helpers
 * One sub-section inside each per-provider footprint box. Shows a title +
 * subtitle + a scrollable list of up to 12 items (plus a "+ N more" tail).
 * ──────────────────────────────────────────────────────────────────────── */
function FootprintSection<T>({
  title,
  subtitle,
  items,
  emptyText,
  renderItem,
  maxVisible = 12,
}: {
  title: string;
  subtitle: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
  maxVisible?: number;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div
        className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary"
      >
        {title}
        <span className="text-text-muted normal-case tracking-normal ml-1">
          · {subtitle}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="text-[10px] italic text-text-muted mt-1">{emptyText}</div>
      ) : (
        <ul className="space-y-1 mt-1">
          {items.slice(0, maxVisible).map((it) => renderItem(it))}
          {items.length > maxVisible && (
            <li className="text-[10px] italic text-text-muted">
              + {items.length - maxVisible} more…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Colored dots — one per "other cloud" that ALSO has a region at this city.
 *  Used inside the Equivalent regions list so the user instantly sees which
 *  competitor has a presence alongside the current cloud. */
function DotsForCovered({ providers }: { providers: Provider[] }) {
  if (providers.length === 0) return null;
  return (
    <span className="flex items-center gap-0.5 flex-shrink-0" title={`Also offered by: ${providers.join(', ')}`}>
      {providers.map((p) => (
        <span
          key={p}
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: PROVIDER_TONE[p].fill,
            boxShadow: `0 0 5px ${PROVIDER_TONE[p].ring}`,
            display: 'inline-block',
          }}
          aria-label={p}
        />
      ))}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * S53 — Geography (super-geo) filter chips. Multi-select Americas / EMEA /
 * APAC; EMPTY selection = all. Styled to match the comparison-setup pill
 * filters. Sits above the region multi-select so the user narrows geography
 * first, then specific regions.
 * ──────────────────────────────────────────────────────────────────────── */
function SuperGeoChips({
  selected,
  onChange,
  bare = false,
}: {
  selected: Set<SuperGeo>;
  onChange: (next: Set<SuperGeo>) => void;
  bare?: boolean;
}) {
  const all = selected.size === 0;
  const tone = 'var(--interactive)';
  const toggle = (sg: SuperGeo) => {
    const next = new Set(selected);
    if (next.has(sg)) next.delete(sg);
    else next.add(sg);
    onChange(next);
  };
  const pill = (active: boolean): React.CSSProperties => ({
    borderRadius: 'var(--radius-pill)',
    background: active ? `${tone}1F` : 'transparent',
    border: `1px solid ${active ? tone : 'var(--border)'}`,
    color: active ? tone : 'var(--text-muted)',
  });
  const row = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
          style={pill(all)}
          aria-pressed={all}
          title="Show every super-geo"
        >
          {all ? '✓ ' : ''}All
        </button>
        {SUPER_GEOS.map((sg) => {
          const on = selected.has(sg);
          return (
            <button
              key={sg}
              type="button"
              onClick={() => toggle(sg)}
              className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
              style={pill(on)}
              aria-pressed={on}
            >
              {on ? '✓ ' : ''}
              {SUPER_GEO_LABEL[sg]}
            </button>
          );
        })}
    </div>
  );

  if (bare) return row;

  return (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-1.5">
        Geography
        <span className="text-text-muted normal-case tracking-normal ml-1">
          · multi-select · Americas · EMEA · APAC
        </span>
      </div>
      {row}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * S53 — Integrated cross-cloud region equivalents table.
 * Replaces the scattered mixed-cloud listing with a clean, grouped, aligned
 * table: one row per equivalency cluster (Azure West US ↔ AWS us-west-1 ↔ GCP
 * us-west1), one column per VISIBLE cloud (base first), grouped into collapsible
 * Americas / EMEA / APAC sections. ~7 rows visible, then the body scrolls. No %
 * similarity — a region is either an equivalent (same country, near) or not.
 * ──────────────────────────────────────────────────────────────────────── */
function RegionEquivTable({
  byGeo,
  columns,
  total,
  base,
  openGeos,
  onToggleGeo,
}: {
  byGeo: Record<SuperGeo, RegionEquivRow[]>;
  columns: Provider[];
  total: number;
  base: Provider;
  openGeos: Set<SuperGeo>;
  onToggleGeo: (sg: SuperGeo) => void;
}) {
  const gridCols = `1.4fr ${columns.map(() => '1fr').join(' ')}`;
  const groups = SUPER_GEOS.map((sg) => ({ sg, rows: byGeo[sg] })).filter(
    (g) => g.rows.length > 0,
  );
  return (
    <section className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[10px] tracking-[0.04em] font-semibold text-text-muted mb-2">
        Cross-cloud region equivalents
        <span className="text-text-muted normal-case tracking-normal ml-1">
          · {total} matched row{total === 1 ? '' : 's'} · same country, within{' '}
          {REGION_CLUSTER_KM} km
        </span>
      </div>
      {total === 0 ? (
        <div className="text-[11px] italic text-text-muted text-center py-6">
          No regions match the current filter.
        </div>
      ) : (
        <div>
          {/* Column header — Location + one column per visible cloud. */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: gridCols,
              padding: '0 8px 6px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="text-[9px] tracking-[0.04em] text-text-muted">Location</div>
            {columns.map((p) => (
              <div
                key={p}
                className="text-[9px] tracking-[0.04em] font-semibold"
                style={{ color: PROVIDER_TONE[p].fill }}
              >
                {p}
                {p === base && (
                  <span className="text-text-muted normal-case tracking-normal"> · base</span>
                )}
              </div>
            ))}
          </div>
          {/* ~7 rows visible, then scroll. */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {groups.map(({ sg, rows }) => {
              const open = openGeos.has(sg);
              return (
                <div key={sg}>
                  <button
                    type="button"
                    onClick={() => onToggleGeo(sg)}
                    className="w-full flex items-center gap-2 text-left"
                    style={{
                      padding: '7px 8px',
                      background: 'rgba(129, 140, 248, 0.05)',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                    aria-expanded={open}
                  >
                    <span className="text-[10px] text-text-muted">{open ? '▾' : '▸'}</span>
                    <span className="text-[9px] tracking-[0.06em] uppercase font-semibold text-text-secondary">
                      {SUPER_GEO_LABEL[sg]}
                    </span>
                    <span className="text-[9px] text-text-muted">· {rows.length}</span>
                  </button>
                  {open &&
                    rows.map((row, i) => (
                      <div
                        key={`${sg}-${row.cc}-${row.country}-${i}`}
                        className="grid items-start"
                        style={{
                          gridTemplateColumns: gridCols,
                          padding: '7px 8px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="text-[10px] pr-2 leading-tight">
                          <span className="text-text-primary">{row.country}</span>
                          <span className="text-text-muted"> · {row.cities.join(', ')}</span>
                        </div>
                        {columns.map((p) => (
                          <div key={p} className="pr-2">
                            {row.cells[p].length > 0 ? (
                              row.cells[p].map((c) => (
                                <div
                                  key={c.region}
                                  className="text-[10px] leading-tight"
                                  title={`${c.region} · ${c.city}`}
                                >
                                  <span
                                    className="font-mono"
                                    style={{ color: PROVIDER_TONE[p].fill }}
                                  >
                                    {c.region}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-text-muted opacity-50">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

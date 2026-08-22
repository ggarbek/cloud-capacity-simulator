/**
 * S65 — Market-gap / coverage selector (pure).
 *
 * The Region Availability page used to compute its coverage / exclusive / gap /
 * shared numbers inline (the old `coverageDetail` memo). That math is extracted
 * here, verbatim, as a pure function so:
 *   - the RA page renders every bucket/count from ONE single source of truth, and
 *   - the executive exports (a later item) can consume the identical report
 *     without re-deriving — or drifting from — the on-screen numbers.
 *
 * Doctrine (unchanged from the page, base-POV):
 *   - Cross-cloud metros are clustered via `clusterCoverageMetros` — the SAME
 *     single-linkage union-find the equivalents table uses (same country + gov
 *     + ≤ REGION_CLUSTER_KM). So "Azure exclusive / Served by all / Market gap"
 *     reconciles with the equivalents rather than mis-labeling e.g. Azure
 *     "West US 2" (Washington) exclusive when AWS us-west-2 / GCP us-west1
 *     (Oregon, ~180 km) serve the same metro.
 *   - Everything is counted by UNIQUE REGION NAME, not by metro, so the base
 *     cloud's partition (served-by-all + shared + exclusive) sums EXACTLY to its
 *     region total (the "Azure regions" tile). One `Loc` row = one region.
 *   - Base-POV buckets: exclusive (sole-provider) · sharedByBase (base + exactly
 *     one competitor, not all) · allList (served by every active cloud) ·
 *     competitorGap (base-absent, exactly one competitor → the counted "market
 *     gaps") · bothCompetitors (base-absent, ≥2 competitors → shown, not counted).
 *
 * S65 — market-gaps count semantics (the fix):
 *   A competitor-exclusive metro (base absent, exactly ONE competitor present) is
 *   BOTH a sole-provider cluster (so it stays in that competitor's `exclusive`
 *   card — the exclusive lens is a different view) AND, from the base's POV, a
 *   counted market gap. Previously the `covered.size === 1` early-return dropped
 *   these into `exclusive` only, leaving `competitorGap` unreachable and
 *   `baseGapCounted` structurally 0. Per S61 doctrine — "{base} market gaps" =
 *   metros ONLY-AWS + ONLY-GCP serve — we now ALSO record each such metro in
 *   `competitorGap[that competitor]` so `baseGapCounted` = Σ competitorGap.
 *   `bothCompetitors` (base absent, ≥2 competitors) stays shown-not-counted:
 *   a metro both rivals serve is arguably a bigger gap, but the shipped doctrine
 *   counts SOLE-competitor metros only; `bothCompetitorsCount` is surfaced so
 *   consumers can show a "+N served by both competitors" transparency line.
 *
 * This selector takes the region refs ALREADY SCOPED (active providers, in-scope
 * region filter, and any VM chip filter applied upstream) — keeping it pure. The
 * page passes the same `refs` it built before; a `CatalogEntry` convenience
 * (`refsFromVms`) is provided for callers that start from a vm list.
 */
import { clusterCoverageMetros, type CoverageMetro, type EqProvider } from './regionEquivalents';
import { REGION_GEO, type RegionGeo, type SuperGeo } from '../data/regionCoordinates';
import type { CatalogEntry } from '../types';

export type GapProvider = EqProvider; // 'Azure' | 'AWS' | 'GCP'
const PROVIDERS: GapProvider[] = ['Azure', 'AWS', 'GCP'];

/**
 * The seed geo map (`${provider}::${region}` → RegionGeo), built ONCE from
 * REGION_GEO. Every consumer that needs to resolve a region's super-geo for
 * `clusterCoverageMetros` shares this single Map instead of re-deriving a
 * byte-identical one per component render. RegionAvailabilityPage, the exec
 * KPI/posture strip and both export builders all point at this constant, so the
 * seed map is a single source of truth (the S65 unification).
 */
export const REGION_GEO_MAP: Map<string, RegionGeo> = (() => {
  const m = new Map<string, RegionGeo>();
  for (const g of REGION_GEO) m.set(`${g.provider}::${g.region}`, g);
  return m;
})();

/** One provider/region ref, already scoped by the caller (active provider set,
 *  in-scope region filter, and chip filter). Order is preserved into the cluster. */
export interface RegionRef {
  provider: GapProvider;
  region: string;
}

/**
 * One counted location in a coverage bucket — a single region (the unit we
 * count), tagged with the cluster's metro identity and per-cloud region names
 * for context. Field-identical to the page's former inline `Loc`.
 */
export interface CoverageLoc {
  city: string;
  country: string;
  superGeo: SuperGeo;
  /** This row's own region (the unit we count). */
  region: string;
  /** The cloud this row's region belongs to. */
  owner: GapProvider;
  /** One region name per cloud serving the same cluster (for context). */
  regionByProvider: Partial<Record<GapProvider, string>>;
}

/**
 * The full base-POV coverage/gap report. Shape is identical to the RA page's
 * former `coverageDetail` memo so the page can render every KPI, panel, card and
 * bucket straight from it. (The sketch in the task ticket is generalized here to
 * the page's real buckets — the page's buckets win, per the ticket.)
 */
export interface MarketGapReport {
  /** Base regions co-served by EVERY active cloud (count). */
  all: number;
  /** Base regions co-served by ≥1 competitor (kept for compat, count). */
  twoPlus: number;
  /** Base cloud's own region total — the denominator its partition reconciles to. */
  totalPlaces: number;
  /** allList = base regions served by every active cloud. */
  allList: CoverageLoc[];
  twoPlusList: CoverageLoc[];
  /** Sole-provider regions, per cloud. */
  exclusive: Record<GapProvider, CoverageLoc[]>;
  /** Base regions co-served by exactly one competitor, keyed by that competitor. */
  sharedByBase: Record<GapProvider, CoverageLoc[]>;
  /** Base-absent market gaps: competitor regions only that competitor serves. */
  competitorGap: Record<GapProvider, CoverageLoc[]>;
  /** Base-absent regions BOTH competitors serve (shown in gaps, NOT counted). */
  bothCompetitors: CoverageLoc[];
  /**
   * The headline "{base} market gaps" number. S65 — the COUNTING UNIT is now
   * METROS, not regions: a competitor whose two nearby regions cluster to one
   * metro counts ONCE. Equals `baseGapMetros.total` — the metro-deduped sum of
   * the per-competitor gaps. (Previously this counted REGIONS; the region figure
   * is retained as `baseGapRegionCount` for any surface that still needs it.) */
  baseGapCounted: number;
  /**
   * S65 — metro-deduped market-gap counts. `total` is the headline gap number in
   * METRO units (each base-absent sole-competitor CLUSTER counts once, so two
   * regions of the same competitor in one metro count once). `perCompetitor` is
   * the same, split by which competitor uniquely serves the metro. These drive
   * the exec KPI tile + posture chips + both exports so the deck === the screen. */
  baseGapMetros: { total: number; perCompetitor: Record<GapProvider, number> };
  /** The region-level gap total (Σ competitorGap[c].length across competitors) —
   *  kept for any surface that counts regions rather than metros. */
  baseGapRegionCount: number;
  /** Base-absent regions BOTH competitors serve — a transparency count for the
   *  "+N served by both competitors (not counted)" line. Σ bothCompetitors. */
  bothCompetitorsCount: number;
  /** Base regions co-served by exactly one competitor (Σ sharedByBase). */
  baseSharedCount: number;
  base: GapProvider;
  competitors: GapProvider[];
  /** Region count per cloud folded across clusters (reconciles with the tile). */
  metros: Record<GapProvider, number>;
  /** Region count per cloud, pre-clustering (the scoreboard denominator). */
  regionCount: Record<GapProvider, number>;
  activeCount: number;
}

/**
 * Build the base-POV market-gap / coverage report from already-scoped region
 * refs. Pure — the ONLY reason `regionGeoMap` is threaded through is so
 * `clusterCoverageMetros` can resolve each cluster's super-geo (it falls back to
 * a longitude heuristic when the thin seed map lacks the region).
 *
 * @param refs        provider/region refs, already scoped by the caller.
 * @param base        the base cloud (POV for gaps/shared/exclusive framing).
 * @param providers   the active provider set (which clouds are being compared).
 * @param regionGeoMap the seed geo map for super-geo resolution.
 */
export function buildMarketGapReport(
  refs: RegionRef[],
  base: GapProvider,
  providers: GapProvider[],
  regionGeoMap: Map<string, RegionGeo> = REGION_GEO_MAP,
): MarketGapReport {
  const active = PROVIDERS.filter((p) => providers.includes(p));
  const competitors = active.filter((p) => p !== base);

  // Region count per provider (region-level, pre-clustering) so the scoreboard
  // reconciles metro overlap with region totals. De-dupe per provider|region so
  // a repeated ref (e.g. many VMs in one region) counts a region once.
  const regionCount: Record<GapProvider, number> = { Azure: 0, AWS: 0, GCP: 0 };
  const scopedRefs: { provider: EqProvider; region: string }[] = [];
  const seen = new Set<string>();
  for (const r of refs) {
    if (!active.includes(r.provider) || !r.region) continue;
    const key = `${r.provider}|${r.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    regionCount[r.provider] += 1;
    scopedRefs.push({ provider: r.provider, region: r.region });
  }

  // Cluster into cross-cloud metros via the SAME proximity union-find the
  // equivalents table uses — NOT an exact `${city}::${country}` string.
  const metrosList = clusterCoverageMetros(scopedRefs, regionGeoMap, base);

  const mk = (m: CoverageMetro, owner: GapProvider, region: string): CoverageLoc => ({
    city: m.city,
    country: m.country,
    superGeo: m.superGeo,
    region,
    owner,
    regionByProvider: m.regionByProvider as Partial<Record<GapProvider, string>>,
  });
  const regionsOf = (m: CoverageMetro, p: GapProvider): string[] =>
    (m.regionsByProvider as Partial<Record<GapProvider, string[]>>)[p] ?? [];

  const allList: CoverageLoc[] = []; // base regions co-served by every active cloud
  const twoPlusList: CoverageLoc[] = []; // base regions co-served by ≥2 (kept for compat)
  const exclusive: Record<GapProvider, CoverageLoc[]> = { Azure: [], AWS: [], GCP: [] };
  const sharedByBase: Record<GapProvider, CoverageLoc[]> = { Azure: [], AWS: [], GCP: [] };
  const competitorGap: Record<GapProvider, CoverageLoc[]> = { Azure: [], AWS: [], GCP: [] };
  const bothCompetitors: CoverageLoc[] = [];

  for (const m of metrosList) {
    const covered = new Set(m.covered as GapProvider[]);
    const baseHas = covered.has(base);
    const compsHas = competitors.filter((c) => covered.has(c));
    // Sole-provider cluster → every one of that cloud's regions here is exclusive.
    // If that sole provider is a COMPETITOR (base absent), the same metro is also
    // a base-POV market gap (a metro only that competitor serves) — record it in
    // BOTH lenses. The `exclusive` card and the `competitorGap` count are distinct
    // views of the same fact, so double-listing here is intentional (see S65 note).
    if (covered.size === 1) {
      const only = [...covered][0] as GapProvider;
      for (const r of regionsOf(m, only)) exclusive[only].push(mk(m, only, r));
      if (only !== base && competitors.includes(only)) {
        for (const r of regionsOf(m, only)) competitorGap[only].push(mk(m, only, r));
      }
      continue;
    }
    if (baseHas) {
      const baseRegions = regionsOf(m, base);
      if (active.length > 0 && covered.size === active.length) {
        for (const r of baseRegions) allList.push(mk(m, base, r));
      } else if (compsHas.length >= 1) {
        // base + at least one competitor, but not every cloud → shared.
        for (const c of compsHas) for (const r of baseRegions) sharedByBase[c].push(mk(m, base, r));
      }
      if (compsHas.length >= 1) for (const r of baseRegions) twoPlusList.push(mk(m, base, r));
    } else {
      // Base absent, ≥2 clouds cover the cluster → both competitors serve it.
      // (A base-absent, exactly-one-competitor metro is a sole-provider cluster
      //  handled by the covered.size === 1 branch above, which records it in both
      //  exclusive AND competitorGap — so `compsHas.length === 1` never reaches
      //  here.) These are shown in the gaps panel but NOT counted in baseGapCounted.
      if (compsHas.length >= 2) {
        for (const c of compsHas) for (const r of regionsOf(m, c)) bothCompetitors.push(mk(m, c, r));
      }
    }
  }
  const byCity = (a: { city: string }, b: { city: string }) => a.city.localeCompare(b.city);
  allList.sort(byCity);
  twoPlusList.sort(byCity);
  bothCompetitors.sort(byCity);
  for (const p of PROVIDERS) {
    exclusive[p].sort(byCity);
    sharedByBase[p].sort(byCity);
    competitorGap[p].sort(byCity);
  }
  // Region counts per provider (sole-provider + co-served) — reconciles with the tile.
  const metros: Record<GapProvider, number> = { Azure: 0, AWS: 0, GCP: 0 };
  for (const m of metrosList)
    for (const p of m.covered) metros[p as GapProvider] += regionsOf(m, p as GapProvider).length;
  // Counted market gaps — region-level total (base-absent, sole competitor).
  const baseGapRegionCount = competitors.reduce((n, c) => n + competitorGap[c].length, 0);
  // S65 — metro-deduped gap counts: each base-absent sole-competitor CLUSTER
  // counts ONCE per competitor (a competitor's two regions in one metro count as
  // one gap). The dedupe key is the cluster's metro identity (city::country); a
  // competitorGap row already carries its cluster's city+country, so grouping by
  // that key collapses same-metro regions. `baseGapCounted` is this metro total —
  // the number the KPI tile, posture strip and both exports display.
  const perCompetitorMetros: Record<GapProvider, number> = { Azure: 0, AWS: 0, GCP: 0 };
  for (const c of competitors) {
    const metroKeys = new Set<string>();
    for (const l of competitorGap[c]) metroKeys.add(`${l.city}::${l.country}`);
    perCompetitorMetros[c] = metroKeys.size;
  }
  const baseGapMetrosTotal = competitors.reduce((n, c) => n + perCompetitorMetros[c], 0);
  const baseGapCounted = baseGapMetrosTotal;
  // Base regions co-served by exactly one competitor — the reframed "shared".
  const baseSharedCount = competitors.reduce((n, c) => n + sharedByBase[c].length, 0);

  return {
    all: allList.length,
    twoPlus: twoPlusList.length,
    totalPlaces: regionCount[base],
    allList,
    twoPlusList,
    exclusive,
    sharedByBase,
    competitorGap,
    bothCompetitors,
    baseGapCounted,
    baseGapMetros: { total: baseGapMetrosTotal, perCompetitor: perCompetitorMetros },
    baseGapRegionCount,
    bothCompetitorsCount: bothCompetitors.length,
    baseSharedCount,
    base,
    competitors,
    metros,
    regionCount,
    activeCount: active.length,
  };
}

/**
 * Convenience: derive scoped region refs from a vm list. The caller is expected
 * to pass a vm list ALREADY scoped (active providers + chip filter) and an
 * `inScope(region, provider)` predicate for the region filter — this keeps the
 * selector pure while matching how the RA page builds its refs. The predicate
 * receives the ref's OWN provider so callers can apply a provider-aware filter
 * (e.g. drop edge regions per provider) WITHOUT pre-filtering the vm list into an
 * intermediate array. When a caller ignores the provider arg the behavior is
 * unchanged (region-only filter).
 */
export function refsFromVms(
  vms: { provider?: CatalogEntry['provider'] | null; region?: string | null }[],
  providers: GapProvider[],
  inScope: (region: string, provider: GapProvider) => boolean = () => true,
): RegionRef[] {
  const active = new Set(PROVIDERS.filter((p) => providers.includes(p)));
  const out: RegionRef[] = [];
  const seen = new Set<string>();
  for (const v of vms) {
    const p = (v.provider ?? '') as GapProvider;
    if (!active.has(p) || !v.region || !inScope(v.region, p)) continue;
    const key = `${p}|${v.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ provider: p, region: v.region });
  }
  return out;
}

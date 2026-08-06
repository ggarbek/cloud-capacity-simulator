import { describe, it, expect } from 'vitest';
import { REGION_GEO, type RegionGeo } from '../data/regionCoordinates';
import { isEdgeRegion, regionGeo } from '../data/regionGeo';
import { buildLiveCatalog } from '../data/liveCatalog';
import {
  buildMarketGapReport,
  refsFromVms,
  type RegionRef,
  type GapProvider,
  type MarketGapReport,
} from './marketGaps';

const PROVIDERS: GapProvider[] = ['Azure', 'AWS', 'GCP'];

/** The seed geo map the RA page threads into the selector (super-geo resolution). */
const regionGeoMap = (() => {
  const m = new Map<string, RegionGeo>();
  for (const g of REGION_GEO) m.set(`${g.provider}::${g.region}`, g);
  return m;
})();

/**
 * Synthetic multi-cloud catalog built from REAL region names (so regionGeo.ts
 * resolves them) that exercises every bucket from an Azure base POV:
 *
 *  - Virginia US  : Azure "East US" + AWS us-east-1 + GCP useast4  → served by ALL.
 *  - Oregon US    : Azure "West US 2" (Washington ~180km) + AWS us-west-2 + GCP
 *                   uswest1 (Oregon) → served by ALL (proximity-clustered).
 *  - Singapore    : Azure "Southeast Asia" + AWS ap-southeast-1     → base + ONE
 *                   competitor (AWS) → sharedByBase[AWS].
 *  - Brazil       : Azure "Brazil South" + GCP southamericaeast1    → base + ONE
 *                   competitor (GCP) → sharedByBase[GCP].
 *  - Sydney AU    : AWS ap-southeast-2 only                         → exclusive[AWS].
 *  - Chile        : GCP southamericawest1 only                      → exclusive[GCP].
 *  - Zurich CH    : Azure "Switzerland North" only                  → exclusive[Azure].
 *  - India Mumbai : AWS ap-south-1 + GCP asiasouth1 (Azure absent)  → base-absent,
 *                   SAME metro, 2 competitors → bothCompetitors (shown, not counted).
 *  - Jakarta ID   : AWS ap-southeast-3 only, Azure absent           → SOLE provider
 *                   cluster (covered.size === 1) → exclusive[AWS].
 *  - Seoul KR     : GCP asianortheast3 only, Azure absent           → SOLE provider
 *                   cluster → exclusive[GCP].
 *
 * S65 NOTE on `competitorGap` / `baseGapCounted`: a base-absent metro served by
 * EXACTLY ONE competitor is a sole-provider cluster (covered.size === 1). It is
 * recorded in BOTH that competitor's EXCLUSIVE card AND (since base is absent) the
 * base-POV `competitorGap` count — two lenses on the same fact. So Jakarta (AWS
 * only, Azure absent) and Seoul (GCP only, Azure absent) each count as ONE market
 * gap: baseGapCounted = 2 (AWS 1 + GCP 1). Mumbai (both AWS+GCP, Azure absent)
 * stays in `bothCompetitors` — shown, not counted.
 */
function syntheticRefs(): RegionRef[] {
  return [
    // Virginia — served by all
    { provider: 'Azure', region: 'East US' },
    { provider: 'AWS', region: 'us-east-1' },
    { provider: 'GCP', region: 'us-east4' },
    // Oregon/Washington — served by all (proximity cluster)
    { provider: 'Azure', region: 'West US 2' },
    { provider: 'AWS', region: 'us-west-2' },
    { provider: 'GCP', region: 'us-west1' },
    // Singapore — Azure + AWS
    { provider: 'Azure', region: 'Southeast Asia' },
    { provider: 'AWS', region: 'ap-southeast-1' },
    // Brazil — Azure + GCP
    { provider: 'Azure', region: 'Brazil South' },
    { provider: 'GCP', region: 'southamerica-east1' },
    // Sydney — AWS only
    { provider: 'AWS', region: 'ap-southeast-2' },
    // Chile — GCP only
    { provider: 'GCP', region: 'southamerica-west1' },
    // Zurich — Azure only
    { provider: 'Azure', region: 'Switzerland North' },
    // Mumbai — AWS + GCP, Azure absent (both competitors)
    { provider: 'AWS', region: 'ap-south-1' },
    { provider: 'GCP', region: 'asia-south1' },
    // Jakarta — AWS only, Azure absent (counted gap)
    { provider: 'AWS', region: 'ap-southeast-3' },
    // Seoul — GCP only, Azure absent (counted gap)
    { provider: 'GCP', region: 'asia-northeast3' },
  ];
}

/** Every region name each geo above resolves to must exist. */
function assertResolvable(refs: RegionRef[]) {
  for (const r of refs) {
    const g = regionGeo(r.provider, r.region);
    expect(g, `${r.provider} ${r.region} should resolve`).toBeTruthy();
  }
}

describe('buildMarketGapReport — synthetic multi-cloud catalog (Azure base)', () => {
  const refs = syntheticRefs();
  let rep: MarketGapReport;
  it('every synthetic region resolves in regionGeo', () => {
    assertResolvable(refs);
  });

  it('builds the report', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    expect(rep.base).toBe('Azure');
    expect(rep.activeCount).toBe(3);
    expect(rep.competitors).toEqual(['AWS', 'GCP']);
  });

  it('served-by-all = Virginia + Oregon', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    expect(rep.all).toBe(2);
    expect(rep.allList.map((l) => l.region).sort()).toEqual(['East US', 'West US 2']);
    // allList rows are the BASE cloud's regions.
    expect(rep.allList.every((l) => l.owner === 'Azure')).toBe(true);
  });

  it('sharedByBase[AWS] = Singapore, sharedByBase[GCP] = Brazil', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    expect(rep.sharedByBase.AWS.map((l) => l.region)).toEqual(['Southeast Asia']);
    expect(rep.sharedByBase.GCP.map((l) => l.region)).toEqual(['Brazil South']);
    expect(rep.baseSharedCount).toBe(2);
    // sharedByBase rows are the BASE cloud's regions.
    expect(rep.sharedByBase.AWS.every((l) => l.owner === 'Azure')).toBe(true);
  });

  it('exclusive per cloud = every sole-provider metro (incl. base-absent single-competitor)', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    // Zurich (Azure-only) is base exclusive.
    expect(rep.exclusive.Azure.map((l) => l.region)).toEqual(['Switzerland North']);
    // Sydney (AWS-only) AND Jakarta (AWS-only) are AWS exclusives.
    expect(rep.exclusive.AWS.map((l) => l.region).sort()).toEqual(['ap-southeast-2', 'ap-southeast-3']);
    // Chile (GCP-only) AND Seoul (GCP-only) are GCP exclusives.
    expect(rep.exclusive.GCP.map((l) => l.region).sort()).toEqual(['asia-northeast3', 'southamerica-west1']);
    expect(rep.exclusive.AWS.every((l) => l.owner === 'AWS')).toBe(true);
  });

  it('competitorGap = every base-absent sole-competitor metro (also listed as exclusives)', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    // Sydney + Jakarta (AWS-only, Azure absent) are BOTH AWS exclusives AND Azure gaps.
    expect(rep.competitorGap.AWS.map((l) => l.region).sort()).toEqual(['ap-southeast-2', 'ap-southeast-3']);
    // Chile + Seoul (GCP-only, Azure absent) likewise.
    expect(rep.competitorGap.GCP.map((l) => l.region).sort()).toEqual(['asia-northeast3', 'southamerica-west1']);
    // Every competitorGap metro is ALSO in that competitor's exclusive card.
    const awsExcl = new Set(rep.exclusive.AWS.map((l) => l.region));
    expect(rep.competitorGap.AWS.every((l) => awsExcl.has(l.region))).toBe(true);
    // S65 — baseGapCounted is now the METRO-deduped total. Every synthetic gap is
    // a distinct city (Sydney, Jakarta, Santiago, Seoul), so metros === regions here.
    expect(rep.baseGapCounted).toBe(4); // AWS 2 (Sydney, Jakarta) + GCP 2 (Chile, Seoul)
    expect(rep.baseGapMetros.total).toBe(4);
    expect(rep.baseGapMetros.perCompetitor).toEqual({ Azure: 0, AWS: 2, GCP: 2 });
    expect(rep.baseGapRegionCount).toBe(4); // region-level total coincides here
  });

  it('bothCompetitors = base-absent, BOTH competitors (Mumbai) — shown, not counted', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    // Mumbai: AWS ap-south-1 + GCP asia-south1, Azure absent → both competitors.
    const cities = [...new Set(rep.bothCompetitors.map((l) => l.city))];
    expect(cities).toEqual(['Mumbai']);
    // Two rows (one per competitor region), NOT added to baseGapCounted.
    expect(rep.bothCompetitors).toHaveLength(2);
    expect(rep.bothCompetitorsCount).toBe(2);
  });

  it('region counts reconcile: base partition sums to regionCount[base]', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    // Azure regions in refs: East US, West US 2, Southeast Asia, Brazil South, Switzerland North = 5.
    expect(rep.regionCount.Azure).toBe(5);
    expect(rep.totalPlaces).toBe(5);
    const basePartition =
      rep.all + // served by all (base regions)
      rep.baseSharedCount + // base + one competitor
      rep.exclusive.Azure.length; // base-only
    expect(basePartition).toBe(rep.totalPlaces);
  });

  it('gaps ⊆ competitor coverage minus base coverage', () => {
    rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    // Base (Azure) cities.
    const baseCities = new Set(
      [...rep.allList, ...rep.sharedByBase.AWS, ...rep.sharedByBase.GCP, ...rep.exclusive.Azure].map(
        (l) => `${l.city}::${l.country}`,
      ),
    );
    for (const c of rep.competitors) {
      for (const l of rep.competitorGap[c]) {
        expect(baseCities.has(`${l.city}::${l.country}`)).toBe(false);
      }
    }
  });
});

describe('buildMarketGapReport — base POV changes the framing', () => {
  const refs = syntheticRefs();
  it('AWS base: served-by-all + Azure/GCP shared reframe around AWS', () => {
    const rep = buildMarketGapReport(refs, 'AWS', PROVIDERS, regionGeoMap);
    expect(rep.base).toBe('AWS');
    expect(rep.competitors).toEqual(['Azure', 'GCP']);
    // Virginia + Oregon still served by all.
    expect(rep.all).toBe(2);
    // Singapore (Azure + AWS) is now AWS + one competitor (Azure) → sharedByBase[Azure].
    expect(rep.sharedByBase.Azure.map((l) => l.region)).toEqual(['ap-southeast-1']);
    // Zurich (Azure-only) + Chile (GCP-only) remain sole-provider exclusives; from
    // the AWS POV they are base-absent sole-competitor metros → AWS market gaps.
    expect(rep.exclusive.Azure.map((l) => l.region)).toEqual(['Switzerland North']);
    // AWS-base gaps: Zurich (Azure), Switzerland aside — Azure-only Zurich + GCP-only
    // Chile + GCP-only Seoul all lack AWS → competitorGap[Azure] 1 + competitorGap[GCP] 2.
    expect(rep.competitorGap.Azure.map((l) => l.region).sort()).toEqual(['Switzerland North']);
    expect(rep.competitorGap.GCP.map((l) => l.region).sort()).toEqual(['asia-northeast3', 'southamerica-west1']);
    expect(rep.baseGapCounted).toBe(3);
  });
});

describe('buildMarketGapReport — two-cloud + edge cases', () => {
  it('two providers: served-by-both = "all"; sole-provider metros = exclusives', () => {
    const refs: RegionRef[] = [
      { provider: 'Azure', region: 'East US' },
      { provider: 'AWS', region: 'us-east-1' }, // Virginia — both
      { provider: 'AWS', region: 'ap-southeast-2' }, // Sydney — AWS only (exclusive)
      { provider: 'Azure', region: 'Switzerland North' }, // Zurich — Azure only (exclusive)
    ];
    const rep = buildMarketGapReport(refs, 'Azure', ['Azure', 'AWS'], regionGeoMap);
    expect(rep.activeCount).toBe(2);
    expect(rep.all).toBe(1); // Virginia served by both = "all"
    // Sydney is AWS-only, Azure absent → AWS exclusive AND an Azure market gap.
    expect(rep.exclusive.AWS.map((l) => l.region)).toEqual(['ap-southeast-2']);
    expect(rep.competitorGap.AWS.map((l) => l.region)).toEqual(['ap-southeast-2']);
    expect(rep.baseGapCounted).toBe(1);
    expect(rep.exclusive.Azure.map((l) => l.region)).toEqual(['Switzerland North']);
  });

  it('empty refs → all-zero report', () => {
    const rep = buildMarketGapReport([], 'Azure', PROVIDERS, regionGeoMap);
    expect(rep.baseGapCounted).toBe(0);
    expect(rep.all).toBe(0);
    expect(rep.totalPlaces).toBe(0);
    expect(rep.bothCompetitors).toHaveLength(0);
  });

  it('duplicate refs (same provider|region) count a region once', () => {
    const refs: RegionRef[] = [
      { provider: 'Azure', region: 'East US' },
      { provider: 'Azure', region: 'East US' },
      { provider: 'AWS', region: 'us-east-1' },
    ];
    const rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
    expect(rep.regionCount.Azure).toBe(1);
  });

  it('refs for a deselected provider are dropped', () => {
    const refs: RegionRef[] = [
      { provider: 'Azure', region: 'East US' },
      { provider: 'GCP', region: 'us-east4' }, // GCP not in active set below
    ];
    const rep = buildMarketGapReport(refs, 'Azure', ['Azure', 'AWS'], regionGeoMap);
    expect(rep.regionCount.GCP).toBe(0);
    // Virginia is now Azure-only among active clouds → exclusive.
    expect(rep.exclusive.Azure.map((l) => l.region)).toEqual(['East US']);
  });
});

describe('refsFromVms convenience', () => {
  it('de-dupes, filters inactive providers + out-of-scope regions', () => {
    const vms = [
      { provider: 'Azure' as const, region: 'East US' },
      { provider: 'Azure' as const, region: 'East US' }, // dup
      { provider: 'AWS' as const, region: 'us-east-1' },
      { provider: 'GCP' as const, region: 'us-east4' }, // filtered out (inactive)
      { provider: 'Azure' as const, region: null }, // no region
    ];
    const refs = refsFromVms(vms, ['Azure', 'AWS'], (r) => r !== 'us-east-1');
    // Azure East US kept once; AWS us-east-1 dropped by inScope; GCP dropped (inactive).
    expect(refs).toEqual([{ provider: 'Azure', region: 'East US' }]);
  });
});

/**
 * Live-catalog smoke test — pins the DEFAULT Region Availability read:
 *   base = Azure · all three clouds active · no VM chip filter · no region filter.
 *
 * The region universe is built exactly as RegionAvailabilityPage builds
 * `regionsByProvider`: the REGION_GEO seed (edge-excluded) UNION every live-catalog
 * region (edge-excluded). These numbers are STABLE until the weekly live-catalog
 * refresh (see .github workflow) rewrites liveCatalog.generated.json — a refresh
 * can shift region counts. TO RE-PIN: run this describe block, read the failure's
 * "expected" vs "actual", and update the constants below to the new actual values
 * (they are the real, correct numbers for the refreshed catalog).
 */
describe('buildMarketGapReport — live-catalog default (Azure base, all clouds)', () => {
  function defaultReport(): MarketGapReport {
    const byProvider: Record<GapProvider, Set<string>> = {
      Azure: new Set(),
      AWS: new Set(),
      GCP: new Set(),
    };
    for (const g of REGION_GEO) {
      if (isEdgeRegion(g.provider, g.region)) continue;
      if (PROVIDERS.includes(g.provider as GapProvider)) byProvider[g.provider as GapProvider].add(g.region);
    }
    for (const v of buildLiveCatalog()) {
      if (v.region && PROVIDERS.includes(v.provider as GapProvider)) {
        if (isEdgeRegion(v.provider ?? '', v.region)) continue;
        byProvider[v.provider as GapProvider].add(v.region);
      }
    }
    const refs: RegionRef[] = [];
    for (const p of PROVIDERS) for (const r of byProvider[p]) refs.push({ provider: p, region: r });
    return buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);
  }

  const rep = defaultReport();

  it('pins the per-provider region counts', () => {
    expect(rep.regionCount).toEqual({ Azure: 64, AWS: 38, GCP: 46 });
  });

  it('pins the folded metro counts', () => {
    expect(rep.metros).toEqual({ Azure: 64, AWS: 36, GCP: 44 });
  });

  it('pins the headline gap + shared + all counts', () => {
    expect(rep.totalPlaces).toBe(64); // Azure region total = the base denominator
    // S65: baseGapCounted = METROS ONLY-AWS + ONLY-GCP uniquely serve (base absent),
    // metro-deduped. AWS uniquely serves 4 metros (4 regions → 4 metros); GCP
    // uniquely serves 7 metros (8 regions collapse to 7 — two GCP-exclusive
    // regions cluster into one metro). So the metro headline is 4 + 7 = 11, one
    // below the region-level total of 12 (see baseGapRegionCount below). To RE-PIN
    // after a live-catalog refresh: read the failure's actual and update here.
    expect(rep.baseGapCounted).toBe(11);
    expect(rep.baseGapMetros.total).toBe(11);
    expect(rep.baseGapMetros.perCompetitor).toEqual({ Azure: 0, AWS: 4, GCP: 7 });
    expect(rep.baseGapRegionCount).toBe(12); // region-level: AWS 4 + GCP 8
    expect(rep.baseSharedCount).toBe(18);
    expect(rep.all).toBe(32);
    expect(rep.bothCompetitors).toHaveLength(4); // base-absent, both AWS+GCP serve
    expect(rep.bothCompetitorsCount).toBe(4);
    expect(rep.activeCount).toBe(3);
  });

  it('pins the exclusive counts per cloud', () => {
    expect(rep.exclusive.Azure).toHaveLength(14);
    expect(rep.exclusive.AWS).toHaveLength(4);
    expect(rep.exclusive.GCP).toHaveLength(8);
  });

  it('pins the per-competitor market-gap breakdown (Σ regions = baseGapRegionCount)', () => {
    // Every AWS/GCP exclusive (base absent) is an Azure market gap → mirrors above.
    // competitorGap is REGION-level; baseGapCounted is the METRO-deduped total.
    expect(rep.competitorGap.AWS).toHaveLength(4);
    expect(rep.competitorGap.GCP).toHaveLength(8);
    expect(rep.competitorGap.AWS.length + rep.competitorGap.GCP.length).toBe(rep.baseGapRegionCount);
    // Each gap metro is ALSO in that competitor's exclusive card (two lenses).
    const awsExcl = new Set(rep.exclusive.AWS.map((l) => l.region));
    const gcpExcl = new Set(rep.exclusive.GCP.map((l) => l.region));
    expect(rep.competitorGap.AWS.every((l) => awsExcl.has(l.region))).toBe(true);
    expect(rep.competitorGap.GCP.every((l) => gcpExcl.has(l.region))).toBe(true);
  });

  it('internal consistency — base partition sums to the Azure region total', () => {
    const basePartition = rep.all + rep.baseSharedCount + rep.exclusive.Azure.length;
    expect(basePartition).toBe(rep.totalPlaces);
  });

  it('internal consistency — every metro lands in exactly one class', () => {
    // Sum of all bucketed rows, by unique city+country, must be partitionable:
    // exclusive (sole) ∪ sharedByBase/all (base co-served) ∪ competitorGap/both
    // (base-absent). No metro appears in two mutually-exclusive base-POV buckets.
    const baseCities = new Set(
      [...rep.allList, ...rep.sharedByBase.AWS, ...rep.sharedByBase.GCP, ...rep.exclusive.Azure].map(
        (l) => `${l.city}::${l.country}`,
      ),
    );
    const gapCities = new Set(
      [...rep.competitorGap.AWS, ...rep.competitorGap.GCP, ...rep.bothCompetitors].map(
        (l) => `${l.city}::${l.country}`,
      ),
    );
    // A base-present metro is never also a base-absent gap metro.
    for (const c of gapCities) expect(baseCities.has(c)).toBe(false);
  });

  it('invariant — gaps ⊆ competitor coverage minus base coverage', () => {
    const baseCities = new Set(
      [...rep.allList, ...rep.sharedByBase.AWS, ...rep.sharedByBase.GCP, ...rep.exclusive.Azure].map(
        (l) => `${l.city}::${l.country}`,
      ),
    );
    for (const c of rep.competitors) {
      for (const l of rep.competitorGap[c]) {
        expect(l.owner).toBe(c); // gap owned by the serving competitor
        expect(baseCities.has(`${l.city}::${l.country}`)).toBe(false);
      }
    }
  });
});

/**
 * S65 — Region Availability page ↔ report internal-consistency invariants.
 *
 * The RA scoreboard, the map/list roster, the equivalents table and the gap panel
 * ALL derive from the SAME scoped region refs the page hands to
 * `buildMarketGapReport`. These tests pin the relationships the page's on-screen
 * numbers depend on, so a future edit that drifts one display from another fails
 * here rather than only in a manual persona audit:
 *   - the scoreboard's per-cloud region count === report.regionCount (the page's
 *     `summaryCounts[p]` counts the identical in-scope refs);
 *   - the per-cloud EXCLUSIVE card counts === report.exclusive[p].length;
 *   - competitorGap[c] ⊆ exclusive[c] (the two lenses on a base-absent sole metro).
 */
describe('RA page ↔ report consistency invariants (default Azure base)', () => {
  const byProvider: Record<GapProvider, Set<string>> = {
    Azure: new Set(),
    AWS: new Set(),
    GCP: new Set(),
  };
  for (const g of REGION_GEO) {
    if (isEdgeRegion(g.provider, g.region)) continue;
    if (PROVIDERS.includes(g.provider as GapProvider)) byProvider[g.provider as GapProvider].add(g.region);
  }
  for (const v of buildLiveCatalog()) {
    if (v.region && PROVIDERS.includes(v.provider as GapProvider)) {
      if (isEdgeRegion(v.provider ?? '', v.region)) continue;
      byProvider[v.provider as GapProvider].add(v.region);
    }
  }
  const refs: RegionRef[] = [];
  for (const p of PROVIDERS) for (const r of byProvider[p]) refs.push({ provider: p, region: r });
  const rep = buildMarketGapReport(refs, 'Azure', PROVIDERS, regionGeoMap);

  it('scoreboard per-cloud count === report.regionCount (same scoped refs)', () => {
    // The page's `summaryCounts[p]` is exactly this: distinct in-scope regions per
    // provider from the SAME source the report refs come from.
    for (const p of PROVIDERS) {
      expect(rep.regionCount[p]).toBe(byProvider[p].size);
    }
  });

  it('base partition (all + shared + Azure-exclusive) === scoreboard Azure count', () => {
    const basePartition = rep.all + rep.baseSharedCount + rep.exclusive.Azure.length;
    expect(basePartition).toBe(rep.regionCount.Azure);
  });

  it('competitorGap[c] ⊆ exclusive[c] — the panel & exclusive card cannot disagree', () => {
    for (const c of rep.competitors) {
      const excl = new Set(rep.exclusive[c].map((l) => `${l.region}`));
      for (const l of rep.competitorGap[c]) expect(excl.has(l.region)).toBe(true);
    }
  });

  it('bothCompetitorsCount === bothCompetitors.length (transparency line source)', () => {
    expect(rep.bothCompetitorsCount).toBe(rep.bothCompetitors.length);
  });
});

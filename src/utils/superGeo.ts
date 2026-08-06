/**
 * Shared super-geo grouping + ownership colour-coding helpers.
 *
 * Extracted from RegionAvailabilityPage (v2.27.x) so the same framework feeds
 * both the Region Availability tab AND the Competitive page's supporting
 * region-availability matrix — visual + logical consistency across the
 * dashboard's cross-cloud comparison surfaces.
 *
 * The doctrine these encode:
 *   - super-geo grouping: AMER / EMEA / APAC, labelled Americas / Europe ·
 *     Middle East · Africa / Asia · Pacific.
 *   - ownership colour-coding: a location served by exactly one cloud is tinted
 *     that cloud's brand colour; by exactly two clouds → purple; by all → green.
 *
 * Behaviour is identical to the prior file-local defs in RegionAvailabilityPage.
 */
import { type SuperGeo, type RegionGeo } from '../data/regionCoordinates';
import { regionGeo as resolveRegionGeo } from '../data/regionGeo';

export type SuperGeoProvider = 'Azure' | 'AWS' | 'GCP';

const SUPER_GEO_PROVIDERS: SuperGeoProvider[] = ['Azure', 'AWS', 'GCP'];

export const SUPER_GEO_LABEL: Record<SuperGeo, string> = {
  AMER: 'Americas',
  EMEA: 'Europe · Middle East · Africa',
  APAC: 'Asia · Pacific',
};

/**
 * Per-provider brand fill — the single-cloud tint in `coverageTone`. Mirrors the
 * Region Availability tab's `PROVIDER_TONE[*].fill` values so the two surfaces
 * paint single-cloud regions identically.
 */
export const PROVIDER_BRAND_FILL: Record<SuperGeoProvider, string> = {
  Azure: '#60A5FA',
  AWS: '#FBBF24',
  GCP: '#FCA5A5',
};

/** Purple — a location served by exactly two clouds. */
export const SHARED_TWO_TONE = '#A78BFA';

/** Green — a location served by all selected clouds. */
export const ALL_CLOUDS_TONE = '#34D399';

/**
 * Super-geo bucket for ANY catalog region. Prefers the curated seed's super-geo
 * (REGION_GEO / regionGeoMap) when present; otherwise derives it from the
 * region's longitude via the comprehensive `resolveRegionGeo` lookup — AMER west
 * of ~25°W, EMEA between there and ~65°E, APAC east of that — so AWS/GCP regions
 * not in the small seed still group correctly.
 */
export function superGeoFor(
  provider: SuperGeoProvider,
  region: string,
  regionGeoMap: Map<string, RegionGeo>,
): SuperGeo {
  const known = regionGeoMap.get(`${provider}::${region}`);
  if (known) return known.superGeo;
  const geo = resolveRegionGeo(provider, region);
  const lon = geo?.lon ?? 0;
  if (lon < -25) return 'AMER';
  if (lon < 65) return 'EMEA';
  return 'APAC';
}

/** "Azure West Europe · AWS eu-west-1 · GCP europe-west4" from a per-provider
 *  region-name map — the secondary line for a multi-cloud overlap location. */
export function regionNamesLine(
  rbp: Partial<Record<SuperGeoProvider, string>>,
): string {
  return SUPER_GEO_PROVIDERS.filter((p) => rbp[p])
    .map((p) => `${p} ${rbp[p]}`)
    .join(' · ');
}

/** Tint for a market-gap / coverage card by who serves it: a single cloud →
 *  that cloud's brand color; exactly two clouds → purple; all clouds → green. */
export function coverageTone(covered: SuperGeoProvider[]): string {
  if (covered.length === 1) return PROVIDER_BRAND_FILL[covered[0]];
  if (covered.length === 2) return SHARED_TWO_TONE;
  return ALL_CLOUDS_TONE; // all selected clouds
}

/**
 * v2.13 (Phase G) — Public region geo-data for cross-cloud map vis.
 *
 * Each entry maps a `(provider, region)` to its real-world lat/lon, the
 * physical city the region's primary datacenter cluster sits in, and the
 * "super-geo" bucket (AMER / EMEA / APAC) the region belongs to. Coords
 * sourced from publicly-documented cloud region geographies:
 *   - Azure: learn.microsoft.com/azure/availability-zones/az-overview
 *   - AWS:   aws.amazon.com/about-aws/global-infrastructure/regions_az/
 *   - GCP:   cloud.google.com/about/locations
 *
 * Coords are the published city/metro, not the exact datacenter (vendors
 * don't publish precise DC locations for security reasons). Precise
 * enough for a continent-scale map visualization.
 *
 * Doctrine: every byte is vendor-public. New v2.11 amendment says we
 * bake in this kind of data natively rather than requiring user upload.
 */

export type SuperGeo = 'AMER' | 'EMEA' | 'APAC';

export interface RegionGeo {
  provider: 'Azure' | 'AWS' | 'GCP';
  region: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  superGeo: SuperGeo;
}

// ────────────────────────────────────────────────────────────────────────
// Azure regions — focused on the regions currently seeded for M-Series.
// Comprehensive list at learn.microsoft.com/azure/reliability/availability-zones-region-support
// ────────────────────────────────────────────────────────────────────────
const AZURE: RegionGeo[] = [
  { provider: 'Azure', region: 'East US',           city: 'Virginia',      country: 'USA',         lat: 37.3719,  lon: -79.8164,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'East US 2',         city: 'Virginia',      country: 'USA',         lat: 36.85,    lon: -76.29,    superGeo: 'AMER' },
  { provider: 'Azure', region: 'Central US',        city: 'Iowa',          country: 'USA',         lat: 41.5908,  lon: -93.6208,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'South Central US',  city: 'Texas',         country: 'USA',         lat: 29.4167,  lon: -98.5,     superGeo: 'AMER' },
  { provider: 'Azure', region: 'North Central US',  city: 'Illinois',      country: 'USA',         lat: 41.8819,  lon: -87.6278,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'West US',           city: 'California',    country: 'USA',         lat: 37.7833,  lon: -122.4167, superGeo: 'AMER' },
  { provider: 'Azure', region: 'West US 2',         city: 'Washington',    country: 'USA',         lat: 47.233,   lon: -119.852,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'West US 3',         city: 'Arizona',       country: 'USA',         lat: 33.4484,  lon: -112.074,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'Canada Central',    city: 'Toronto',       country: 'Canada',      lat: 43.6532,  lon: -79.3832,  superGeo: 'AMER' },
  { provider: 'Azure', region: 'Brazil South',      city: 'São Paulo',     country: 'Brazil',      lat: -23.55,   lon: -46.633,   superGeo: 'AMER' },

  { provider: 'Azure', region: 'North Europe',      city: 'Dublin',        country: 'Ireland',     lat: 53.3478,  lon: -6.2597,   superGeo: 'EMEA' },
  { provider: 'Azure', region: 'West Europe',       city: 'Amsterdam',     country: 'Netherlands', lat: 52.3667,  lon: 4.9,       superGeo: 'EMEA' },
  { provider: 'Azure', region: 'UK South',          city: 'London',        country: 'UK',          lat: 50.941,   lon: -0.799,    superGeo: 'EMEA' },
  { provider: 'Azure', region: 'France Central',    city: 'Paris',         country: 'France',      lat: 48.86,    lon: 2.35,      superGeo: 'EMEA' },
  { provider: 'Azure', region: 'Germany West Central', city: 'Frankfurt',  country: 'Germany',     lat: 50.110,   lon: 8.682,     superGeo: 'EMEA' },
  { provider: 'Azure', region: 'Sweden Central',    city: 'Gävle',         country: 'Sweden',      lat: 60.6749,  lon: 17.1413,   superGeo: 'EMEA' },
  { provider: 'Azure', region: 'Switzerland North', city: 'Zurich',        country: 'Switzerland', lat: 47.3769,  lon: 8.5417,    superGeo: 'EMEA' },
  { provider: 'Azure', region: 'Norway East',       city: 'Oslo',          country: 'Norway',      lat: 59.913,   lon: 10.752,    superGeo: 'EMEA' },
  { provider: 'Azure', region: 'UAE North',         city: 'Dubai',         country: 'UAE',         lat: 25.2048,  lon: 55.2708,   superGeo: 'EMEA' },
  { provider: 'Azure', region: 'South Africa North',city: 'Johannesburg',  country: 'South Africa',lat: -26.2041, lon: 28.0473,   superGeo: 'EMEA' },

  { provider: 'Azure', region: 'East Asia',         city: 'Hong Kong',     country: 'Hong Kong',   lat: 22.267,   lon: 114.188,   superGeo: 'APAC' },
  { provider: 'Azure', region: 'Southeast Asia',    city: 'Singapore',     country: 'Singapore',   lat: 1.283,    lon: 103.833,   superGeo: 'APAC' },
  { provider: 'Azure', region: 'Japan East',        city: 'Tokyo',         country: 'Japan',       lat: 35.6895,  lon: 139.6917,  superGeo: 'APAC' },
  { provider: 'Azure', region: 'Japan West',        city: 'Osaka',         country: 'Japan',       lat: 34.6939,  lon: 135.5022,  superGeo: 'APAC' },
  { provider: 'Azure', region: 'Korea Central',     city: 'Seoul',         country: 'South Korea', lat: 37.5665,  lon: 126.978,   superGeo: 'APAC' },
  { provider: 'Azure', region: 'Australia East',    city: 'Sydney',        country: 'Australia',   lat: -33.8688, lon: 151.2093,  superGeo: 'APAC' },
  { provider: 'Azure', region: 'Central India',     city: 'Pune',          country: 'India',       lat: 18.5204,  lon: 73.8567,   superGeo: 'APAC' },
];

// ────────────────────────────────────────────────────────────────────────
// AWS regions — covered set focused on M-Series-comparable analogs.
// Comprehensive list at aws.amazon.com/about-aws/global-infrastructure/
// ────────────────────────────────────────────────────────────────────────
const AWS: RegionGeo[] = [
  { provider: 'AWS', region: 'us-east-1',      city: 'Virginia',    country: 'USA',          lat: 38.13,    lon: -78.45,   superGeo: 'AMER' },
  { provider: 'AWS', region: 'us-east-2',      city: 'Ohio',        country: 'USA',          lat: 39.9612,  lon: -82.9988, superGeo: 'AMER' },
  { provider: 'AWS', region: 'us-west-1',      city: 'California',  country: 'USA',          lat: 37.7749,  lon: -122.4194, superGeo: 'AMER' },
  { provider: 'AWS', region: 'us-west-2',      city: 'Oregon',      country: 'USA',          lat: 45.84,    lon: -119.7,    superGeo: 'AMER' },
  { provider: 'AWS', region: 'ca-central-1',   city: 'Montreal',    country: 'Canada',       lat: 45.5017,  lon: -73.5673, superGeo: 'AMER' },
  { provider: 'AWS', region: 'sa-east-1',      city: 'São Paulo',   country: 'Brazil',       lat: -23.55,   lon: -46.633,  superGeo: 'AMER' },

  { provider: 'AWS', region: 'eu-west-1',      city: 'Dublin',      country: 'Ireland',      lat: 53.3478,  lon: -6.2597,  superGeo: 'EMEA' },
  { provider: 'AWS', region: 'eu-west-2',      city: 'London',      country: 'UK',           lat: 51.5074,  lon: -0.1278,  superGeo: 'EMEA' },
  { provider: 'AWS', region: 'eu-west-3',      city: 'Paris',       country: 'France',       lat: 48.8566,  lon: 2.3522,   superGeo: 'EMEA' },
  { provider: 'AWS', region: 'eu-central-1',   city: 'Frankfurt',   country: 'Germany',      lat: 50.110,   lon: 8.682,    superGeo: 'EMEA' },
  { provider: 'AWS', region: 'eu-north-1',     city: 'Stockholm',   country: 'Sweden',       lat: 59.3293,  lon: 18.0686,  superGeo: 'EMEA' },
  { provider: 'AWS', region: 'eu-south-1',     city: 'Milan',       country: 'Italy',        lat: 45.4642,  lon: 9.19,     superGeo: 'EMEA' },
  { provider: 'AWS', region: 'me-south-1',     city: 'Manama',      country: 'Bahrain',      lat: 26.0667,  lon: 50.5577,  superGeo: 'EMEA' },
  { provider: 'AWS', region: 'af-south-1',     city: 'Cape Town',   country: 'South Africa', lat: -33.9249, lon: 18.4241,  superGeo: 'EMEA' },

  { provider: 'AWS', region: 'ap-northeast-1', city: 'Tokyo',       country: 'Japan',        lat: 35.6895,  lon: 139.6917, superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-northeast-2', city: 'Seoul',       country: 'South Korea',  lat: 37.5665,  lon: 126.978,  superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-northeast-3', city: 'Osaka',       country: 'Japan',        lat: 34.6939,  lon: 135.5022, superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-southeast-1', city: 'Singapore',   country: 'Singapore',    lat: 1.283,    lon: 103.833,  superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-southeast-2', city: 'Sydney',      country: 'Australia',    lat: -33.8688, lon: 151.2093, superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-south-1',     city: 'Mumbai',      country: 'India',        lat: 19.076,   lon: 72.8777,  superGeo: 'APAC' },
  { provider: 'AWS', region: 'ap-east-1',      city: 'Hong Kong',   country: 'Hong Kong',    lat: 22.267,   lon: 114.188,  superGeo: 'APAC' },
];

// ────────────────────────────────────────────────────────────────────────
// GCP regions — covered set. Comprehensive list at cloud.google.com/about/locations
// ────────────────────────────────────────────────────────────────────────
const GCP: RegionGeo[] = [
  { provider: 'GCP', region: 'us-central1',          city: 'Iowa',           country: 'USA',         lat: 41.262,   lon: -95.861,  superGeo: 'AMER' },
  { provider: 'GCP', region: 'us-east1',             city: 'South Carolina', country: 'USA',         lat: 33.836,   lon: -81.163,  superGeo: 'AMER' },
  { provider: 'GCP', region: 'us-east4',             city: 'Virginia',       country: 'USA',         lat: 39.0438,  lon: -77.4874, superGeo: 'AMER' },
  { provider: 'GCP', region: 'us-west1',             city: 'Oregon',         country: 'USA',         lat: 45.84,    lon: -119.7,    superGeo: 'AMER' },
  { provider: 'GCP', region: 'us-west2',             city: 'Los Angeles',    country: 'USA',         lat: 34.0522,  lon: -118.2437, superGeo: 'AMER' },
  { provider: 'GCP', region: 'northamerica-northeast1', city: 'Montreal',    country: 'Canada',      lat: 45.5017,  lon: -73.5673, superGeo: 'AMER' },
  { provider: 'GCP', region: 'southamerica-east1',   city: 'São Paulo',      country: 'Brazil',      lat: -23.55,   lon: -46.633,  superGeo: 'AMER' },

  { provider: 'GCP', region: 'europe-west1',         city: 'St. Ghislain',   country: 'Belgium',     lat: 50.4501,  lon: 4.84,     superGeo: 'EMEA' },
  { provider: 'GCP', region: 'europe-west2',         city: 'London',         country: 'UK',          lat: 51.5074,  lon: -0.1278,  superGeo: 'EMEA' },
  { provider: 'GCP', region: 'europe-west3',         city: 'Frankfurt',      country: 'Germany',     lat: 50.110,   lon: 8.682,    superGeo: 'EMEA' },
  { provider: 'GCP', region: 'europe-west4',         city: 'Eemshaven',      country: 'Netherlands', lat: 53.4386,  lon: 6.8336,   superGeo: 'EMEA' },
  { provider: 'GCP', region: 'europe-west6',         city: 'Zurich',         country: 'Switzerland', lat: 47.3769,  lon: 8.5417,   superGeo: 'EMEA' },
  { provider: 'GCP', region: 'europe-north1',        city: 'Hamina',         country: 'Finland',     lat: 60.5697,  lon: 27.187,   superGeo: 'EMEA' },

  { provider: 'GCP', region: 'asia-east1',           city: 'Changhua',       country: 'Taiwan',      lat: 23.6978,  lon: 120.9605, superGeo: 'APAC' },
  { provider: 'GCP', region: 'asia-east2',           city: 'Hong Kong',      country: 'Hong Kong',   lat: 22.267,   lon: 114.188,  superGeo: 'APAC' },
  { provider: 'GCP', region: 'asia-northeast1',      city: 'Tokyo',          country: 'Japan',       lat: 35.6895,  lon: 139.6917, superGeo: 'APAC' },
  { provider: 'GCP', region: 'asia-northeast2',      city: 'Osaka',          country: 'Japan',       lat: 34.6939,  lon: 135.5022, superGeo: 'APAC' },
  { provider: 'GCP', region: 'asia-southeast1',      city: 'Singapore',      country: 'Singapore',   lat: 1.283,    lon: 103.833,  superGeo: 'APAC' },
  { provider: 'GCP', region: 'asia-south1',          city: 'Mumbai',         country: 'India',       lat: 19.076,   lon: 72.8777,  superGeo: 'APAC' },
  { provider: 'GCP', region: 'australia-southeast1', city: 'Sydney',         country: 'Australia',   lat: -33.8688, lon: 151.2093, superGeo: 'APAC' },
];

export const REGION_GEO: RegionGeo[] = [...AZURE, ...AWS, ...GCP];

// ────────────────────────────────────────────────────────────────────────
// Lookups
// ────────────────────────────────────────────────────────────────────────
const REGION_INDEX = (() => {
  const m = new Map<string, RegionGeo>();
  for (const r of REGION_GEO) {
    m.set(`${r.provider}|${r.region.toLowerCase()}`, r);
  }
  return m;
})();

export function lookupRegion(
  provider: string,
  region: string,
): RegionGeo | undefined {
  if (!provider || !region) return undefined;
  return REGION_INDEX.get(`${provider}|${region.toLowerCase()}`);
}

/** Returns the super-geo of a region, or undefined when unknown. */
export function regionSuperGeo(
  provider: string,
  region: string,
): SuperGeo | undefined {
  return lookupRegion(provider, region)?.superGeo;
}

/** Given a set of (provider, region) pairs, returns the unique super-geos
 *  they span. Used by the CompetitiveMap to decide which map to render. */
export function superGeosFor(
  pairs: { provider: string; region: string }[],
): SuperGeo[] {
  const set = new Set<SuperGeo>();
  for (const p of pairs) {
    const sg = regionSuperGeo(p.provider, p.region);
    if (sg) set.add(sg);
  }
  return Array.from(set);
}

// ────────────────────────────────────────────────────────────────────────
// v2.15 (Phase I) — Region twin lookup.
// Given a region in one provider, find the closest analog in another
// provider by great-circle distance between their published metros.
// Cloud providers cluster around the same industrial centers (Virginia,
// Frankfurt, Tokyo, Singapore, Sydney, etc.) so nearest-neighbor IS
// effectively the analog 95% of the time.
// ────────────────────────────────────────────────────────────────────────

/** Haversine great-circle distance between two lat/lon points, in km. */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Nearest region in `targetProvider` to the given source coords. */
export function nearestRegionByProvider(
  source: { lat: number; lon: number },
  targetProvider: 'Azure' | 'AWS' | 'GCP',
): RegionGeo | undefined {
  let best: RegionGeo | undefined;
  let bestDist = Infinity;
  for (const candidate of REGION_GEO) {
    if (candidate.provider !== targetProvider) continue;
    const d = distanceKm(source, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  return best;
}

/** Twins map — given a (provider, region) anchor, returns the closest
 *  region in EACH other provider. The Competitive page uses this to
 *  soft-highlight suggested AWS/GCP regions when the user picks Azure. */
export function regionTwinsFor(
  sourceProvider: string,
  sourceRegion: string,
): Partial<Record<'Azure' | 'AWS' | 'GCP', RegionGeo>> {
  const source = lookupRegion(sourceProvider, sourceRegion);
  if (!source) return {};
  const out: Partial<Record<'Azure' | 'AWS' | 'GCP', RegionGeo>> = {};
  for (const p of ['Azure', 'AWS', 'GCP'] as const) {
    if (p === source.provider) continue;
    const twin = nearestRegionByProvider(source, p);
    if (twin) out[p] = twin;
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// Super-geo bounding boxes used for SVG viewBox cropping.
// Lon range, lat range. Values picked to comfortably encompass all known
// regions for that super-geo plus a little visual padding.
// ────────────────────────────────────────────────────────────────────────
export const SUPER_GEO_BOX: Record<
  SuperGeo,
  { lonMin: number; lonMax: number; latMin: number; latMax: number; label: string }
> = {
  AMER: { lonMin: -170, lonMax: -30, latMin: -40, latMax: 70, label: 'Americas' },
  EMEA: { lonMin: -25,  lonMax: 65,  latMin: -40, latMax: 70, label: 'Europe · ME · Africa' },
  APAC: { lonMin: 65,   lonMax: 180, latMin: -45, latMax: 55, label: 'Asia · Pacific' },
};

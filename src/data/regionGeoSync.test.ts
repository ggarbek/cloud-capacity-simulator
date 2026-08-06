/**
 * Region geo-source SYNC guard (Wave-1 A1).
 *
 * There are two region-geo sources in the codebase: the thin plotting seed
 * `regionCoordinates.ts` (REGION_GEO, ~66 rows for the map vis) and the richer
 * resolver `regionGeo.ts` (all catalog regions, the equivalency anchor). The
 * resolver is CANONICAL. When both carry a region they must AGREE — same metro
 * (within a small tolerance) and same super-geo — else the map and the equivalency
 * math tell different stories about where a region sits.
 *
 * These guards pin that agreement. Drift found during A1 (Azure East US 2, France
 * Central; AWS us-west-2; GCP us-west1 were 188–276 km off) was fixed by aligning
 * `regionCoordinates.ts` to `regionGeo.ts`. Max residual is ~126 km (city-centroid
 * rounding), so the tolerance is 150 km.
 */
import { describe, it, expect } from 'vitest';
import { REGION_GEO } from './regionCoordinates';
import { regionGeo, haversineKm, superGeoForGeo } from './regionGeo';

const TOLERANCE_KM = 150;

describe('regionGeo sync — regionCoordinates.ts agrees with the canonical regionGeo.ts', () => {
  it('every region in BOTH sources is within 150 km great-circle', () => {
    const failures: string[] = [];
    for (const r of REGION_GEO) {
      const g = regionGeo(r.provider, r.region);
      if (!g) continue; // reverse-coverage is asserted separately
      const km = haversineKm({ lat: r.lat, lon: r.lon, cc: '', country: '', city: '' }, g);
      if (km > TOLERANCE_KM) failures.push(`${r.provider} ${r.region}: ${km} km`);
    }
    expect(failures).toEqual([]);
  });

  it('super-geo agrees between the two sources for every shared region', () => {
    const mismatches: string[] = [];
    for (const r of REGION_GEO) {
      const g = regionGeo(r.provider, r.region);
      if (!g) continue;
      const canonical = superGeoForGeo(g);
      if (r.superGeo !== canonical) mismatches.push(`${r.provider} ${r.region}: ${r.superGeo} vs ${canonical}`);
    }
    expect(mismatches).toEqual([]);
  });

  it('every regionCoordinates region resolves in the canonical regionGeo.ts', () => {
    const missing = REGION_GEO.filter((r) => !regionGeo(r.provider, r.region)).map((r) => `${r.provider} ${r.region}`);
    expect(missing).toEqual([]);
  });
});

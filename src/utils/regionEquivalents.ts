/**
 * Region equivalency clustering  — the pure engine behind the Region
 * Availability tab's integrated cross-cloud equivalents table.
 *
 * Every region a provider actually offers is clustered into a cross-cloud
 * equivalency ROW: regions in the SAME COUNTRY (data residency / sovereignty is
 * the dominant driver) that sit within `REGION_CLUSTER_KM` of each other serve
 * the same customers, so they line up on one row — Azure "West US" next to AWS
 * "us-west-1" next to GCP "us-west1". A cell with no region for a cloud is a
 * real coverage gap.
 *
 * This is the same single-linkage union-find that `RegionEquivalencyTable` (the
 * Equivalency sub-page audit view) computes inline; extracted here as a pure,
 * tested function so the new grouped/collapsible table can reuse it. There is no
 * % similarity — a region is either an equivalent (same country, near) or not.
 */
import { regionGeo, haversineKm, type RegionGeo as GeoRef } from '../data/regionGeo';
import { superGeoFor } from './superGeo';
import type { RegionGeo, SuperGeo } from '../data/regionCoordinates';

export type EqProvider = 'Azure' | 'AWS' | 'GCP';
const ALL: EqProvider[] = ['Azure', 'AWS', 'GCP'];

/** Same-country regions within this many km cluster into one equivalency row. */
export const REGION_CLUSTER_KM = 400;

export interface RegionEquivCell {
  region: string;
  city: string;
}
export interface RegionEquivRow {
  superGeo: SuperGeo;
  country: string;
  cc: string;
  /** Distinct metros in the cluster (for a compact secondary label). */
  cities: string[];
  /** One list of region names per cloud (a cloud may run several in one metro). */
  cells: Record<EqProvider, RegionEquivCell[]>;
  /** How many of the three clouds have ≥1 region in this cluster. */
  cloudsPresent: number;
}

interface Ref {
  provider: EqProvider;
  region: string;
  geo: GeoRef;
}

/**
 * Cluster every offered region (across the given providers) into cross-cloud
 * equivalency rows, sorted country A→Z, then most-clouds-present first, then
 * west→east. Edge/unmapped regions are skipped. `regionGeoMap` is only used to
 * resolve a row's super-geo (falls back to a longitude heuristic when absent).
 */
export function buildRegionEquivalents(
  userVms: { provider?: string | null; region?: string | null }[],
  providers: EqProvider[],
  regionGeoMap: Map<string, RegionGeo>,
): RegionEquivRow[] {
  const allow = new Set(providers);
  const refs: Ref[] = [];
  const seen = new Set<string>();
  for (const v of userVms) {
    const p = (v.provider ?? '') as EqProvider;
    if (!allow.has(p) || !v.region) continue;
    const key = `${p}|${v.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const geo = regionGeo(p, v.region);
    if (geo && !geo.edge) refs.push({ provider: p, region: v.region, geo });
  }

  // Union-find: same country AND same gov/non-gov AND within CLUSTER_KM.
  const parent = refs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i: number, j: number) => {
    parent[find(i)] = find(j);
  };
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const a = refs[i].geo;
      const b = refs[j].geo;
      if (a.cc !== b.cc || !!a.gov !== !!b.gov) continue;
      if (haversineKm(a, b) <= REGION_CLUSTER_KM) union(i, j);
    }
  }

  const groups = new Map<number, Ref[]>();
  refs.forEach((r, i) => {
    const root = find(i);
    const arr = groups.get(root);
    if (arr) arr.push(r);
    else groups.set(root, [r]);
  });

  const rows: RegionEquivRow[] = [];
  for (const g of groups.values()) {
    const cells: Record<EqProvider, RegionEquivCell[]> = { Azure: [], AWS: [], GCP: [] };
    for (const r of g) cells[r.provider].push({ region: r.region, city: r.geo.city });
    for (const p of ALL) cells[p].sort((a, b) => a.city.localeCompare(b.city));
    const cities = [...new Set(g.map((r) => r.geo.city))];
    const cloudsPresent = ALL.filter((p) => cells[p].length > 0).length;
    const sg = superGeoFor(g[0].provider, g[0].region, regionGeoMap);
    rows.push({
      superGeo: sg,
      country: g[0].geo.country,
      cc: g[0].geo.cc,
      cities,
      cells,
      cloudsPresent,
    });
  }

  const minLon = (row: RegionEquivRow): number => {
    let m = 180;
    for (const p of ALL)
      for (const c of row.cells[p]) {
        const geo = regionGeo(p, c.region);
        if (geo) m = Math.min(m, geo.lon);
      }
    return m;
  };
  rows.sort(
    (a, b) =>
      a.country.localeCompare(b.country) ||
      b.cloudsPresent - a.cloudsPresent ||
      minLon(a) - minLon(b),
  );
  return rows;
}

/** One cross-cloud metro cluster: which clouds serve it + a region name each. */
export interface CoverageMetro {
  superGeo: SuperGeo;
  /** Representative metro label (the base cloud's city when it serves, else the
   *  alphabetically-first city in the cluster). */
  city: string;
  country: string;
  cc: string;
  /** Distinct metros folded into this cluster (for a "Washington · Oregon" hint). */
  cities: string[];
  /** Which of the input providers have ≥1 region in this cluster. */
  covered: EqProvider[];
  /** A region name each covering cloud uses for this metro (first seen). */
  regionByProvider: Partial<Record<EqProvider, string>>;
  /** EVERY region each cloud has in this cluster (a metro can hold 2+ of one
   *  cloud's regions — e.g. Azure East US + East US 2 in Virginia). Lets the
   *  coverage math count by unique region name rather than by metro. */
  regionsByProvider: Partial<Record<EqProvider, string[]>>;
}

/**
 * Cluster every offered region (across the given providers) into cross-cloud
 * metro clusters using the EXACT same single-linkage union-find as
 * `buildRegionEquivalents` (same country + gov + within `REGION_CLUSTER_KM`).
 *
 * This is the shared primitive the coverage/exclusive/gap math must use so its
 * "Azure exclusive / Served by all / Market gap" verdicts reconcile with the
 * equivalents table — grouping by an exact `${city}::${country}` string instead
 * (the old approach) wrongly called Azure "West US 2" (Washington) exclusive even
 * though AWS us-west-2 / GCP us-west1 (Oregon, ~180 km away) serve the same metro.
 *
 * `regionGeoMap` only resolves a cluster's super-geo. `baseProvider` (optional)
 * biases the representative `city` toward the base cloud's metro label.
 */
export function clusterCoverageMetros(
  refsInput: { provider: EqProvider; region: string }[],
  regionGeoMap: Map<string, RegionGeo>,
  baseProvider?: EqProvider,
): CoverageMetro[] {
  const refs: Ref[] = [];
  const seen = new Set<string>();
  for (const r of refsInput) {
    if (!r.region) continue;
    const key = `${r.provider}|${r.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const geo = regionGeo(r.provider, r.region);
    if (geo && !geo.edge) refs.push({ provider: r.provider, region: r.region, geo });
  }

  const parent = refs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i: number, j: number) => {
    parent[find(i)] = find(j);
  };
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const a = refs[i].geo;
      const b = refs[j].geo;
      if (a.cc !== b.cc || !!a.gov !== !!b.gov) continue;
      if (haversineKm(a, b) <= REGION_CLUSTER_KM) union(i, j);
    }
  }

  const groups = new Map<number, Ref[]>();
  refs.forEach((r, i) => {
    const root = find(i);
    const arr = groups.get(root);
    if (arr) arr.push(r);
    else groups.set(root, [r]);
  });

  const out: CoverageMetro[] = [];
  for (const g of groups.values()) {
    const covered = [...new Set(g.map((r) => r.provider))];
    const regionByProvider: Partial<Record<EqProvider, string>> = {};
    const regionsByProvider: Partial<Record<EqProvider, string[]>> = {};
    for (const r of g) {
      if (!regionByProvider[r.provider]) regionByProvider[r.provider] = r.region;
      (regionsByProvider[r.provider] ??= []).push(r.region);
    }
    const cities = [...new Set(g.map((r) => r.geo.city))].sort((a, b) => a.localeCompare(b));
    // Representative city: prefer the base cloud's metro label for an
    // Azure-centric read, else the alphabetically-first city in the cluster.
    const baseRef = baseProvider ? g.find((r) => r.provider === baseProvider) : undefined;
    out.push({
      superGeo: superGeoFor(g[0].provider, g[0].region, regionGeoMap),
      city: baseRef ? baseRef.geo.city : cities[0],
      country: g[0].geo.country,
      cc: g[0].geo.cc,
      cities,
      covered,
      regionByProvider,
      regionsByProvider,
    });
  }
  return out;
}

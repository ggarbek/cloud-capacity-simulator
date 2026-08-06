/**
 * regionRates (v2.38) — pure per-region rate lookup for a single VM size.
 *
 * The live catalog is joined provider × region × SKU, so the SAME vmSizeName
 * has one row PER region, each carrying that region's pay-as-you-go / 1-yr /
 * 3-yr rates. This helper collapses those rows into a clean per-region rate
 * list so the Pricing / Recommendation views can show the respective rate for
 * each selected region (not a single region-agnostic number).
 */
import type { CatalogEntry } from '../types';

export interface RegionRate {
  region: string;
  payg: number | null;
  ri1: number | null;
  ri3: number | null;
}

/** Distinct regions where (provider, vmSizeName) exists, in catalog order. */
export function regionsForVm(
  vms: CatalogEntry[],
  provider: string,
  vmSizeName: string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of vms) {
    if ((v.provider ?? '') !== provider) continue;
    if (v.vmSizeName !== vmSizeName) continue;
    const r = v.region ?? '';
    if (!r || seen.has(r)) continue;
    seen.add(r);
    out.push(r);
  }
  return out;
}

/**
 * Per-region rates for one (provider, vmSizeName). Deduped by region (first
 * row wins), optionally restricted to `only` regions (empty / undefined = all),
 * sorted by PAYG ascending (cheapest first) with rate-less regions last.
 */
export function regionRatesFor(
  vms: CatalogEntry[],
  provider: string,
  vmSizeName: string,
  only?: Set<string>,
): RegionRate[] {
  const byRegion = new Map<string, RegionRate>();
  for (const v of vms) {
    if ((v.provider ?? '') !== provider) continue;
    if (v.vmSizeName !== vmSizeName) continue;
    const region = v.region ?? '';
    if (!region) continue;
    if (only && only.size > 0 && !only.has(region)) continue;
    if (byRegion.has(region)) continue; // first row for the region wins
    byRegion.set(region, {
      region,
      payg: v.hourlyUsd ?? null,
      ri1: v.riOneYrHourlyUsd ?? null,
      ri3: v.riThreeYrHourlyUsd ?? null,
    });
  }
  return [...byRegion.values()].sort((a, b) => {
    if (a.payg == null && b.payg == null) return a.region.localeCompare(b.region);
    if (a.payg == null) return 1;
    if (b.payg == null) return -1;
    return a.payg - b.payg || a.region.localeCompare(b.region);
  });
}

/** The cheapest PAYG region in a rate list (for "best region" callouts), or null. */
export function cheapestRegion(rates: RegionRate[]): RegionRate | null {
  const withRate = rates.filter((r) => r.payg != null);
  return withRate.length ? withRate[0] : rates[0] ?? null;
}

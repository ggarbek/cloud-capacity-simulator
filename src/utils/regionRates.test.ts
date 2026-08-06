import { describe, it, expect } from 'vitest';
import { regionRatesFor, regionsForVm, cheapestRegion } from './regionRates';
import type { CatalogEntry } from '../types';

const row = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({
    vmSizeName: 'D8s_v5',
    provider: 'Azure',
    vcpus: 8,
    memoryGib: 32,
    family: 'Dsv5',
    category: 'General Purpose',
    networkMbps: 0,
    ...o,
  } as CatalogEntry);

// Same SKU across three regions with different rates + one other SKU + a
// rate-less region.
const catalog: CatalogEntry[] = [
  row({ region: 'eastus', hourlyUsd: 0.40, riOneYrHourlyUsd: 0.30, riThreeYrHourlyUsd: 0.2 }),
  row({ region: 'westeurope', hourlyUsd: 0.45, riOneYrHourlyUsd: 0.33, riThreeYrHourlyUsd: 0.22 }),
  row({ region: 'southeastasia', hourlyUsd: 0.38, riOneYrHourlyUsd: 0.29, riThreeYrHourlyUsd: 0.19 }),
  row({ region: 'brazilsouth', hourlyUsd: undefined }),
  row({ provider: 'AWS', vmSizeName: 'm5.2xlarge', region: 'us-east-1', hourlyUsd: 0.38 }),
];

describe('regionRates', () => {
  it('lists distinct regions for a (provider, vmSizeName)', () => {
    expect(regionsForVm(catalog, 'Azure', 'D8s_v5')).toEqual([
      'eastus',
      'westeurope',
      'southeastasia',
      'brazilsouth',
    ]);
  });

  it('returns per-region rates sorted by PAYG ascending, rate-less last', () => {
    const rates = regionRatesFor(catalog, 'Azure', 'D8s_v5');
    expect(rates.map((r) => r.region)).toEqual([
      'southeastasia', // 0.38
      'eastus', // 0.40
      'westeurope', // 0.45
      'brazilsouth', // no rate → last
    ]);
    expect(rates[0]).toMatchObject({ payg: 0.38, ri1: 0.29, ri3: 0.19 });
    expect(rates[3].payg).toBeNull();
  });

  it('restricts to the `only` region set when provided', () => {
    const rates = regionRatesFor(catalog, 'Azure', 'D8s_v5', new Set(['eastus', 'westeurope']));
    expect(rates.map((r) => r.region)).toEqual(['eastus', 'westeurope']);
  });

  it('an empty `only` set means all regions (no scoping)', () => {
    const all = regionRatesFor(catalog, 'Azure', 'D8s_v5');
    const empty = regionRatesFor(catalog, 'Azure', 'D8s_v5', new Set());
    expect(empty).toEqual(all);
  });

  it('cheapestRegion picks the lowest PAYG', () => {
    const rates = regionRatesFor(catalog, 'Azure', 'D8s_v5');
    expect(cheapestRegion(rates)?.region).toBe('southeastasia');
  });

  it('does not bleed rates across SKUs or providers', () => {
    expect(regionRatesFor(catalog, 'AWS', 'm5.2xlarge').map((r) => r.region)).toEqual([
      'us-east-1',
    ]);
  });
});

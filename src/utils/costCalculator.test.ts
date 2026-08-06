/**
 * costCalculator tests — pure cross-cloud cost model.
 *
 * Fixtures are minimal CatalogEntry rows carrying a `region` + per-term rates
 * so `regionRatesFor` (which derives per-region rates from catalog rows) finds
 * them exactly as it does in production.
 */
import { describe, it, expect } from 'vitest';
import type { CatalogEntry } from '../types';
import { HOURS_PER_MONTH } from '../types';
import {
  durationToHours,
  rateForTerm,
  priceLine,
  computeCost,
  comparableRegionsFor,
  type CostLine,
} from './costCalculator';

/** Build a minimal priced catalog row. */
function entry(
  provider: string,
  vmSizeName: string,
  region: string,
  rates: { payg?: number; ri1?: number; ri3?: number },
): CatalogEntry {
  return {
    vmSizeName,
    vmGeneration: 'v1',
    series: 'test',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'test-hw',
    spilloverTarget: 'N/A',
    processor: 'test-cpu',
    vcpus: 8,
    memoryGib: 64,
    networkMbps: 1000,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    provider,
    region,
    hourlyUsd: rates.payg,
    riOneYrHourlyUsd: rates.ri1,
    riThreeYrHourlyUsd: rates.ri3,
  };
}

const REGION = 'east-us';

// GCP cheapest, Azure mid, AWS dearest at PAYG.
const VMS: CatalogEntry[] = [
  entry('GCP', 'n2-standard-8', REGION, { payg: 0.3, ri1: 0.2, ri3: 0.15 }),
  entry('Azure', 'Standard_D8_v5', REGION, { payg: 0.4, ri1: 0.25, ri3: 0.18 }),
  entry('AWS', 'm7i.2xlarge', REGION, { payg: 0.5, ri1: 0.3, ri3: 0.22 }),
];

describe('durationToHours', () => {
  it('converts months to hours via 730', () => {
    expect(durationToHours({ months: 12 })).toBe(12 * HOURS_PER_MONTH);
    expect(durationToHours({ months: 12 })).toBe(8760);
  });

  it('passes hours through unchanged', () => {
    expect(durationToHours({ hours: 100 })).toBe(100);
  });
});

describe('rateForTerm', () => {
  const rr = { region: REGION, payg: 0.3, ri1: 0.2, ri3: 0.15 };
  it('maps each term to the right column', () => {
    expect(rateForTerm(rr, 'payg')).toBe(0.3);
    expect(rateForTerm(rr, '1y')).toBe(0.2);
    expect(rateForTerm(rr, '3y')).toBe(0.15);
  });
  it('returns null for a missing column', () => {
    expect(rateForTerm({ region: REGION, payg: 0.3, ri1: null, ri3: null }, '1y')).toBeNull();
  });
});

describe('priceLine', () => {
  it('computes lineTotal = rate × qty × hours', () => {
    const line: CostLine = {
      provider: 'GCP',
      vmSizeName: 'n2-standard-8',
      region: REGION,
      quantity: 3,
      term: 'payg',
    };
    const priced = priceLine(VMS, line, 100);
    expect(priced.hourlyUsd).toBe(0.3);
    expect(priced.lineHourly).toBeCloseTo(0.9, 9); // 0.3 × 3
    expect(priced.lineTotal).toBeCloseTo(90, 6); // 0.9 × 100
    expect(priced.durationHours).toBe(100);
    expect(priced.estimated).toBe(false);
  });

  it('prices a 3-yr RI term off the ri3 column', () => {
    const priced = priceLine(
      VMS,
      { provider: 'AWS', vmSizeName: 'm7i.2xlarge', region: REGION, quantity: 2, term: '3y' },
      10,
    );
    expect(priced.hourlyUsd).toBe(0.22);
    expect(priced.lineTotal).toBeCloseTo(0.22 * 2 * 10, 6);
  });

  it('returns null total when no rate exists for the size/region', () => {
    const priced = priceLine(
      VMS,
      { provider: 'GCP', vmSizeName: 'does-not-exist', region: REGION, quantity: 1, term: 'payg' },
      100,
    );
    expect(priced.hourlyUsd).toBeNull();
    expect(priced.lineHourly).toBeNull();
    expect(priced.lineTotal).toBeNull();
  });
});

describe('computeCost', () => {
  const lines: CostLine[] = [
    { provider: 'GCP', vmSizeName: 'n2-standard-8', region: REGION, quantity: 1, term: 'payg' },
    { provider: 'Azure', vmSizeName: 'Standard_D8_v5', region: REGION, quantity: 1, term: 'payg' },
    { provider: 'AWS', vmSizeName: 'm7i.2xlarge', region: REGION, quantity: 1, term: 'payg' },
  ];

  it('ranks the cheaper provider first and names the cheapest', () => {
    const res = computeCost(VMS, lines, { months: 12 });
    expect(res.durationHours).toBe(8760);
    expect(res.verdict.ranking.map((r) => r.provider)).toEqual(['GCP', 'Azure', 'AWS']);
    expect(res.verdict.cheapestProvider).toBe('GCP');
    expect(res.verdict.headline).toContain('GCP');
    expect(res.verdict.insights.length).toBeGreaterThan(0);
  });

  it("computes each provider's total = rate × hours", () => {
    const res = computeCost(VMS, lines, { months: 12 });
    const gcp = res.perProvider.find((p) => p.provider === 'GCP')!;
    expect(gcp.totalUsd).toBeCloseTo(0.3 * 8760, 4);
    expect(gcp.anyMissing).toBe(false);
  });

  it('excludes an unpriced line from the provider total and flags anyMissing', () => {
    const withMissing: CostLine[] = [
      ...lines,
      { provider: 'GCP', vmSizeName: 'unpriced-sku', region: REGION, quantity: 5, term: 'payg' },
    ];
    const res = computeCost(VMS, withMissing, { months: 12 });
    const gcp = res.perProvider.find((p) => p.provider === 'GCP')!;
    expect(gcp.anyMissing).toBe(true);
    // Total still only reflects the one priced GCP line.
    expect(gcp.totalUsd).toBeCloseTo(0.3 * 8760, 4);
    // GCP still ranks (it has a priced line) and stays cheapest.
    expect(res.verdict.cheapestProvider).toBe('GCP');
  });

  it('returns an empty verdict when nothing is priceable', () => {
    const res = computeCost(
      VMS,
      [{ provider: 'GCP', vmSizeName: 'nope', region: REGION, quantity: 1, term: 'payg' }],
      { months: 1 },
    );
    expect(res.verdict.cheapestProvider).toBeNull();
    expect(res.verdict.ranking).toHaveLength(0);
    expect(res.verdict.insights).toHaveLength(0);
  });
});

describe('comparableRegionsFor', () => {
  it('lists the distinct regions for a (provider, size)', () => {
    const multi = [
      ...VMS,
      entry('GCP', 'n2-standard-8', 'europe-west', { payg: 0.35 }),
    ];
    expect(comparableRegionsFor(multi, 'GCP', 'n2-standard-8')).toEqual([REGION, 'europe-west']);
  });
});

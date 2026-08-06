import { describe, it, expect } from 'vitest';
import type { BomEntry, CatalogEntry } from '../types';
import {
  baseScenarioOf,
  portBomToProvider,
  portBom,
  monthlyCostOf,
  hourlyCostOf,
  durationToHours,
  uniqueBySize,
} from './bomPort';
import { HOURS_PER_MONTH } from '../types';

const HOURS_PER_DAY = 24;
const HOURS_PER_YEAR = 8760;

/** Minimal CatalogEntry factory — only the fields the port + matcher read. */
function vm(p: Partial<CatalogEntry>): CatalogEntry {
  return {
    vmSizeName: 'x',
    vmGeneration: '',
    series: '',
    memoryCategory: 'High Memory (HM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: '',
    vcpus: 8,
    memoryGib: 64,
    networkMbps: 0,
    localDiskGib: 0,
    status: '',
    notes: '',
    category: 'Memory Optimized',
    ...p,
  };
}

// A small cross-cloud catalog: one Azure base size + close AWS / GCP analogs
// (same category gate, similar vCPU/mem so bestVmMatch picks them), each with a
// PAYG rate, plus a second base size with its own analogs.
const userVms: CatalogEntry[] = [
  // Azure base
  vm({ provider: 'Azure', vmSizeName: 'Standard_E8_v5', vcpus: 8, memoryGib: 64, hourlyUsd: 0.5 }),
  vm({ provider: 'Azure', vmSizeName: 'Standard_E16_v5', vcpus: 16, memoryGib: 128, hourlyUsd: 1.0 }),
  // AWS analogs
  vm({ provider: 'AWS', vmSizeName: 'r6i.2xlarge', vcpus: 8, memoryGib: 64, hourlyUsd: 0.45, riOneYrHourlyUsd: 0.30 }),
  vm({ provider: 'AWS', vmSizeName: 'r6i.4xlarge', vcpus: 16, memoryGib: 128, hourlyUsd: 0.9 }),
  // GCP analogs
  vm({ provider: 'GCP', vmSizeName: 'n2-highmem-8', vcpus: 8, memoryGib: 64, hourlyUsd: 0.55 }),
  vm({ provider: 'GCP', vmSizeName: 'n2-highmem-16', vcpus: 16, memoryGib: 128, hourlyUsd: 1.1 }),
];

const bom: BomEntry[] = [
  { vmSizeName: 'Standard_E8_v5', quantity: 3 },
  { vmSizeName: 'Standard_E16_v5', quantity: 2 },
];

describe('uniqueBySize', () => {
  it('dedupes by vmSizeName, first wins', () => {
    const dupes = [vm({ vmSizeName: 'a', hourlyUsd: 1 }), vm({ vmSizeName: 'a', hourlyUsd: 2 }), vm({ vmSizeName: 'b' })];
    const out = uniqueBySize(dupes);
    expect(out).toHaveLength(2);
    expect(out[0].hourlyUsd).toBe(1);
  });
});

describe('monthlyCostOf', () => {
  it('prices PAYG as hourly × 730', () => {
    const r = monthlyCostOf(vm({ hourlyUsd: 0.5 }), 'payg', false);
    expect(r.usd).toBeCloseTo(0.5 * HOURS_PER_MONTH);
    expect(r.estimated).toBe(false);
  });
  it('returns null when no rate resolves and estimate off', () => {
    expect(monthlyCostOf(vm({ hourlyUsd: 1 }), '1y', false).usd).toBeNull();
  });
});

describe('baseScenarioOf', () => {
  it('prices the BoM as-is at 100% match with a positive total', () => {
    const s = baseScenarioOf(bom, userVms, 'Azure', 'payg', false);
    expect(s.provider).toBe('Azure');
    expect(s.lines).toHaveLength(2);
    for (const line of s.lines) {
      expect(line.matchPct).toBe(100);
      expect(line.matchVmSizeName).toBe(line.baseVmSizeName);
    }
    expect(s.monthlyTotalUsd).toBeGreaterThan(0);
    // 3×0.5 + 2×1.0 = 3.5 hourly → ×730
    expect(s.monthlyTotalUsd).toBeCloseTo(3.5 * HOURS_PER_MONTH);
    expect(s.matchedLines).toBe(2);
    expect(s.unmatchedLines).toBe(0);
  });
});

describe('portBomToProvider', () => {
  it('maps each line to an AWS equivalent with avgMatchPct in (0,100]', () => {
    const s = portBomToProvider(bom, userVms, 'Azure', 'AWS', 'payg', false);
    expect(s.provider).toBe('AWS');
    for (const line of s.lines) {
      expect(line.matchVmSizeName).not.toBeNull();
      expect(line.matchPct).not.toBeNull();
      expect(line.monthlyUsd).toBeGreaterThan(0);
    }
    expect(s.matchedLines).toBe(2);
    expect(s.unmatchedLines).toBe(0);
    expect(s.avgMatchPct).not.toBeNull();
    expect(s.avgMatchPct!).toBeGreaterThan(0);
    expect(s.avgMatchPct!).toBeLessThanOrEqual(100);
  });

  it('picks the size-appropriate AWS analog for each line', () => {
    const s = portBomToProvider(bom, userVms, 'Azure', 'AWS', 'payg', false);
    const byBase = new Map(s.lines.map((l) => [l.baseVmSizeName, l.matchVmSizeName]));
    expect(byBase.get('Standard_E8_v5')).toBe('r6i.2xlarge');
    expect(byBase.get('Standard_E16_v5')).toBe('r6i.4xlarge');
  });

  it('marks a line unmatched when the target has no candidates', () => {
    const s = portBomToProvider(bom, userVms, 'Azure', 'Oracle', 'payg', false);
    expect(s.matchedLines).toBe(0);
    expect(s.unmatchedLines).toBe(2);
    for (const line of s.lines) {
      expect(line.matchVmSizeName).toBeNull();
      expect(line.monthlyUsd).toBeNull();
    }
    expect(s.monthlyTotalUsd).toBe(0);
    expect(s.avgMatchPct).toBeNull();
  });

  it('leaves a single unmappable line null without breaking matched lines', () => {
    // A GPU base line with no GPU candidate on AWS → that line unmatched; the
    // memory line still maps.
    const mixedVms: CatalogEntry[] = [
      ...userVms,
      vm({ provider: 'Azure', vmSizeName: 'Standard_NC24', vcpus: 24, memoryGib: 220, category: 'GPU', hourlyUsd: 3 }),
    ];
    const mixedBom: BomEntry[] = [
      { vmSizeName: 'Standard_E8_v5', quantity: 1 },
      { vmSizeName: 'Standard_NC24', quantity: 1 },
    ];
    const s = portBomToProvider(mixedBom, mixedVms, 'Azure', 'AWS', 'payg', false);
    const gpuLine = s.lines.find((l) => l.baseVmSizeName === 'Standard_NC24')!;
    const memLine = s.lines.find((l) => l.baseVmSizeName === 'Standard_E8_v5')!;
    expect(gpuLine.matchVmSizeName).toBeNull();
    expect(gpuLine.monthlyUsd).toBeNull();
    expect(memLine.matchVmSizeName).not.toBeNull();
    expect(s.matchedLines).toBe(1);
    expect(s.unmatchedLines).toBe(1);
  });
});

describe('portBom', () => {
  it('returns base + 2 targets with a cheapest verdict + headline', () => {
    const result = portBom(bom, userVms, 'Azure', ['AWS', 'GCP'], 'payg', false);
    expect(result.baseProvider).toBe('Azure');
    expect(result.targetScenarios).toHaveLength(2);
    expect(result.verdict.cheapestProvider).not.toBeNull();
    expect(result.verdict.headline.length).toBeGreaterThan(0);
    // AWS is cheapest here (0.45/0.9 < Azure 0.5/1.0 < GCP 0.55/1.1).
    expect(result.verdict.cheapestProvider).toBe('AWS');
    expect(result.verdict.headline).toMatch(/AWS/);
    expect(result.verdict.insights.length).toBeGreaterThan(0);
  });
});

describe('durationToHours', () => {
  it('passes hours through and converts months × 730', () => {
    expect(durationToHours({ hours: 500 })).toBe(500);
    expect(durationToHours({ months: 12 })).toBe(12 * HOURS_PER_MONTH);
    expect(durationToHours({ months: 1 })).toBe(HOURS_PER_MONTH);
  });
});

describe('hourlyCostOf', () => {
  it('returns the per-unit hourly rate itself (not ×730)', () => {
    const r = hourlyCostOf(vm({ hourlyUsd: 0.5 }), 'payg', false);
    expect(r.usd).toBeCloseTo(0.5);
    expect(r.estimated).toBe(false);
  });
  it('returns null when no rate resolves and estimate off', () => {
    expect(hourlyCostOf(vm({ hourlyUsd: 1 }), '1y', false).usd).toBeNull();
  });
});

describe('portBom — duration/term-aware totals (Fix A)', () => {
  it('is backward-compatible: no duration → durationTotalUsd is null but hourly is populated', () => {
    const s = baseScenarioOf(bom, userVms, 'Azure', 'payg', false);
    // 3×0.5 + 2×1.0 = 3.5 hourly
    expect(s.hourlyTotalUsd).toBeCloseTo(3.5);
    expect(s.monthlyTotalUsd).toBeCloseTo(3.5 * HOURS_PER_MONTH);
    expect(s.durationTotalUsd).toBeNull();
    // Lines carry the hourly rate × quantity.
    const e8 = s.lines.find((l) => l.baseVmSizeName === 'Standard_E8_v5')!;
    expect(e8.hourlyUsd).toBeCloseTo(0.5 * 3);
    expect(e8.durationTotalUsd).toBeUndefined();
  });

  it('prices the base scenario over a 12-month duration', () => {
    const s = baseScenarioOf(bom, userVms, 'Azure', 'payg', false, { months: 12 });
    const hours = 12 * HOURS_PER_MONTH;
    expect(s.hourlyTotalUsd).toBeCloseTo(3.5);
    expect(s.durationTotalUsd).toBeCloseTo(3.5 * hours);
    // Per-line duration totals sum to the scenario total.
    const lineSum = s.lines.reduce((acc, l) => acc + (l.durationTotalUsd ?? 0), 0);
    expect(lineSum).toBeCloseTo(s.durationTotalUsd!);
  });

  it('threads duration through portBom to every scenario', () => {
    const hours = 36 * HOURS_PER_MONTH;
    const result = portBom(bom, userVms, 'Azure', ['AWS', 'GCP'], 'payg', false, { months: 36 });
    // base
    expect(result.baseScenario.durationTotalUsd).toBeCloseTo(3.5 * hours);
    // AWS analogs 0.45 + 0.9 with qty 3/2 → (3×0.45 + 2×0.9) = 3.15 hourly
    const aws = result.targetScenarios.find((s) => s.provider === 'AWS')!;
    expect(aws.hourlyTotalUsd).toBeCloseTo(3 * 0.45 + 2 * 0.9);
    expect(aws.durationTotalUsd).toBeCloseTo(aws.hourlyTotalUsd * hours);
    // GCP analogs 0.55 + 1.1 → (3×0.55 + 2×1.1) = 3.85 hourly
    const gcp = result.targetScenarios.find((s) => s.provider === 'GCP')!;
    expect(gcp.durationTotalUsd).toBeCloseTo((3 * 0.55 + 2 * 1.1) * hours);
  });

  it('term changes the rate: AWS 1-yr RI uses the discounted rate where present', () => {
    // r6i.2xlarge has riOneYrHourlyUsd 0.30; with estimateOn the 1y term resolves.
    const oneLineBom: BomEntry[] = [{ vmSizeName: 'Standard_E8_v5', quantity: 1 }];
    const result = portBom(oneLineBom, userVms, 'Azure', ['AWS'], '1y', true, { hours: 1 });
    const aws = result.targetScenarios.find((s) => s.provider === 'AWS')!;
    // 1-hour duration → total == hourly == published 1y rate 0.30.
    expect(aws.hourlyTotalUsd).toBeCloseTo(0.3);
    expect(aws.durationTotalUsd).toBeCloseTo(0.3);
  });

  it('hr/day/mo/yr derive consistently from the summed hourly rate', () => {
    // The UI derives day/month/year as hr×24 / hr×730 / hr×8760; verify the
    // hourlyTotalUsd basis produces a self-consistent set.
    const s = baseScenarioOf(bom, userVms, 'Azure', 'payg', false, { months: 1 });
    const hr = s.hourlyTotalUsd;
    expect(hr * HOURS_PER_DAY).toBeCloseTo(3.5 * 24);
    expect(hr * HOURS_PER_MONTH).toBeCloseTo(s.monthlyTotalUsd);
    expect(hr * HOURS_PER_YEAR).toBeCloseTo(3.5 * 8760);
    // 1-month duration total equals the monthly total.
    expect(s.durationTotalUsd).toBeCloseTo(s.monthlyTotalUsd);
  });

  it('leaves durationTotalUsd null on an unmatched line but the scenario still has a number', () => {
    const s = portBomToProvider(bom, userVms, 'Azure', 'Oracle', 'payg', false, { months: 12 });
    expect(s.matchedLines).toBe(0);
    expect(s.durationTotalUsd).toBe(0); // hasDuration → 0, not null (no priced lines)
    for (const line of s.lines) {
      expect(line.durationTotalUsd).toBeNull();
    }
  });
});

// Wave-0 seam: the shared `useBomPort` hook calls exactly
// `portBom(bom, userVms, base, targets, term, true)` (estimate ON) — so BoM
// porting is now term-aware where it used to be PAYG-hardcoded. These tests pin
// the term-awareness of that exact call shape so the hook's contract can't
// silently regress to PAYG.
describe('portBom via the useBomPort call shape — term-aware (Wave 0)', () => {
  const oneLineBom: BomEntry[] = [{ vmSizeName: 'Standard_E8_v5', quantity: 1 }];

  it('prices the base scenario differently per term (payg > 1y > 3y)', () => {
    // Azure Standard_E8_v5 payg 0.5, estimate ON → 1y 0.5×0.59, 3y 0.5×0.38.
    const payg = portBom(oneLineBom, userVms, 'Azure', ['AWS'], 'payg', true).baseScenario;
    const oneYr = portBom(oneLineBom, userVms, 'Azure', ['AWS'], '1y', true).baseScenario;
    const threeYr = portBom(oneLineBom, userVms, 'Azure', ['AWS'], '3y', true).baseScenario;
    expect(payg.hourlyTotalUsd).toBeCloseTo(0.5);
    expect(oneYr.hourlyTotalUsd).toBeCloseTo(0.5 * 0.59);
    expect(threeYr.hourlyTotalUsd).toBeCloseTo(0.5 * 0.38);
    // Strictly decreasing with a longer commitment — proves the term flows through.
    expect(oneYr.hourlyTotalUsd).toBeLessThan(payg.hourlyTotalUsd);
    expect(threeYr.hourlyTotalUsd).toBeLessThan(oneYr.hourlyTotalUsd);
  });

  it('uses a published RI rate where present at 1y and estimates 3y for the target', () => {
    // AWS r6i.2xlarge has a REAL riOneYrHourlyUsd 0.30 → used directly at 1y;
    // no 3y published → estimated 0.45 × 0.43 with estimate ON.
    const aws1y = portBom(oneLineBom, userVms, 'Azure', ['AWS'], '1y', true).targetScenarios.find(
      (s) => s.provider === 'AWS',
    )!;
    const aws3y = portBom(oneLineBom, userVms, 'Azure', ['AWS'], '3y', true).targetScenarios.find(
      (s) => s.provider === 'AWS',
    )!;
    expect(aws1y.hourlyTotalUsd).toBeCloseTo(0.3);
    expect(aws1y.anyEstimated).toBe(false); // real published 1y rate, not estimated
    expect(aws3y.hourlyTotalUsd).toBeCloseTo(0.45 * 0.43);
    expect(aws3y.anyEstimated).toBe(true); // no published 3y → estimated
  });
});

// ── S66 FIX-A — pricedLines honest accounting + verdict suppression ─────────

describe('pricedLines — per-scenario honest accounting (S66 FIX-A)', () => {
  // A base SKU that exists in the catalog but carries NO rate: it matches
  // itself (matched) but cannot price (unpriced) — the exact case the old
  // matched/unmatched accounting hid.
  const noRateVms: CatalogEntry[] = [
    ...userVms,
    vm({ provider: 'Azure', vmSizeName: 'Standard_E32_v5', vcpus: 32, memoryGib: 256 }),
  ];
  const bomWithNoRate: BomEntry[] = [...bom, { vmSizeName: 'Standard_E32_v5', quantity: 1 }];

  it('counts only lines that contributed to monthlyTotalUsd', () => {
    const s = baseScenarioOf(bomWithNoRate, noRateVms, 'Azure', 'payg', false);
    expect(s.matchedLines).toBe(3); // every base line "matches" itself…
    expect(s.unmatchedLines).toBe(0);
    expect(s.pricedLines).toBe(2); // …but only 2 lines priced
    expect(s.lines[2].monthlyUsd).toBeNull();
  });

  it('fully-priced scenarios have pricedLines === line count', () => {
    const s = baseScenarioOf(bom, userVms, 'Azure', 'payg', false);
    expect(s.pricedLines).toBe(s.lines.length);
  });

  it('portBomToProvider: an unmatched line is neither matched nor priced', () => {
    const onlyGcp = userVms.filter((v) => v.provider !== 'AWS');
    const s = portBomToProvider(bom, onlyGcp, 'Azure', 'AWS', 'payg', false);
    expect(s.unmatchedLines).toBe(2);
    expect(s.pricedLines).toBe(0);
  });

  it('portBom verdict never claims savings against an undercounted base total', () => {
    const result = portBom(bomWithNoRate, noRateVms, 'Azure', ['AWS'], 'payg', false);
    // AWS prices all 2 matchable lines… but the base total is missing a line.
    expect(result.verdict.headline).not.toMatch(/saves/);
    expect(result.verdict.headline).toMatch(/not every line priced|not fully comparable/);
    expect(
      result.verdict.insights.some((i) => i.includes('no resolvable rate')),
    ).toBe(true);
  });

  it('portBom verdict still quantifies savings when both sides are fully priced', () => {
    const result = portBom(bom, userVms, 'Azure', ['AWS'], 'payg', false);
    expect(result.verdict.cheapestProvider).toBe('AWS');
    expect(result.verdict.headline).toMatch(/saves ~\$/);
  });
});

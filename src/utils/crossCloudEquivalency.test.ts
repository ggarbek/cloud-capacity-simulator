import { describe, it, expect } from 'vitest';
import type { CatalogEntry } from '../types';
import { vmFamily } from './vmTaxonomy';
import { topVmMatches } from './equivalence';
import {
  buildEquivalencyRows,
  equivalencyInsights,
  rankedFamiliesVsBase,
  rankedFamiliesPerBase,
  rankedCategoriesVsBase,
  rankedCategoriesPerBase,
  rankedSizesVsBase,
  findBetterMatchAlerts,
  bestMatchAnalog,
  mergeBestMatchFills,
  type Provider,
} from './crossCloudEquivalency';
import { isConfidentialCapable } from './acceleratorSpecs';
import { categorize } from './vmCategory';
import { buildLiveCatalog } from '../data/liveCatalog';

/**
 * Synthetic mini-catalog. We set `category` explicitly so the builder's
 * category derivation is deterministic (it reads `v.category` first), and pick
 * `family` strings the taxonomy preserves verbatim.
 */
function vm(p: Provider, partial: Partial<CatalogEntry> & {
  vmSizeName: string;
  family: string;
  category: CatalogEntry['category'];
  vcpus: number;
  memoryGib: number;
}): CatalogEntry {
  return {
    vmGeneration: 'v1',
    series: partial.family,
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon',
    networkMbps: 10000,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    provider: p,
    acceleratorType: 'None',
    ...partial,
  } as CatalogEntry;
}

// Azure = base. Two families across two categories; AWS has a memory-optimized
// analog but NO general-purpose family (so the GP category cell is null on AWS).
const AZURE: CatalogEntry[] = [
  vm('Azure', { vmSizeName: 'D4s_v5', family: 'Dsv5', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
  vm('Azure', { vmSizeName: 'D8s_v5', family: 'Dsv5', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
  vm('Azure', { vmSizeName: 'E4s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
  vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
];

// AWS: only a memory-optimized family (r7i). No GP family at all.
const AWS: CatalogEntry[] = [
  vm('AWS', { vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
  vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
];

const ALL = [...AZURE, ...AWS];

describe('buildEquivalencyRows', () => {
  it('base column is always 100% on every section', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    for (const row of [...out.categories, ...out.families, ...out.sizes]) {
      const baseCell = row.cells.Azure;
      expect(baseCell).not.toBeNull();
      expect(baseCell!.pct).toBe(100);
      expect(baseCell!.value).toBe(row.baseValue);
    }
  });

  it('a family row gets a plausible <100 pct for the other provider', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    // Azure `E4s_v5` → vmFamily strips to the leading-letter family "E".
    const memFamRow = out.families.find((r) => r.baseValue === 'E');
    expect(memFamRow).toBeTruthy();
    const awsCell = memFamRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value).toBe('r7i'); // the equivalent FAMILY
    expect(awsCell!.pct).toBeGreaterThan(0);
    expect(awsCell!.pct).toBeLessThanOrEqual(100);
  });

  it('a size row gets a plausible <=100 pct for the other provider', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = out.sizes.find((r) => r.baseValue === 'E8s_v5');
    expect(sizeRow).toBeTruthy();
    const awsCell = sizeRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    // E8s_v5 (8 vCPU / 64 GiB) → r7i.2xlarge (8 vCPU / 64 GiB): near-identical.
    expect(awsCell!.value).toBe('r7i.2xlarge');
    expect(awsCell!.pct).toBeGreaterThanOrEqual(85);
    expect(awsCell!.pct).toBeLessThanOrEqual(100);
  });

  it('no same-category candidate → cross-category fallback (flagged); no in-scope VMs at all → null', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    // AWS has no General-Purpose family — only memory (r7i). The GP base family
    // (Azure `D*s_v5` → family "D") now falls back ACROSS the category gate to
    // AWS's closest analog (flagged crossCategory) instead of blanking to "—".
    const gpFamRow = out.families.find((r) => r.baseValue === 'D');
    expect(gpFamRow).toBeTruthy();
    expect(gpFamRow!.cells.AWS).not.toBeNull();
    expect(gpFamRow!.cells.AWS!.crossCategory).toBe(true);

    const gpCatRow = out.categories.find((r) => r.baseValue === 'General Purpose');
    expect(gpCatRow!.cells.AWS).not.toBeNull();
    expect(gpCatRow!.cells.AWS!.crossCategory).toBe(true);

    // A provider with ZERO in-scope VMs is still genuinely null (no fabrication).
    const withGcp = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL, // no GCP rows in scope
      activeProviders: ['Azure', 'AWS', 'GCP'],
      base: 'Azure',
    });
    expect(withGcp.families[0].cells.GCP).toBeNull();
  });

  it('category pct = mean of its family matchPcts for that provider', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const memCatRow = out.categories.find((r) => r.baseValue === 'Memory Optimized');
    expect(memCatRow).toBeTruthy();
    const awsCatCell = memCatRow!.cells.AWS;
    expect(awsCatCell).not.toBeNull();

    // The Memory Optimized category has exactly one base family ("E"), so the
    // category mean must equal that family's AWS matchPct.
    const memFamRow = out.families.find((r) => r.baseValue === 'E');
    expect(awsCatCell!.pct).toBe(memFamRow!.cells.AWS!.pct);
  });

  it('returns empty when base is not among active providers', () => {
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['AWS'],
      base: 'Azure',
    });
    expect(out.categories).toHaveLength(0);
    expect(out.families).toHaveLength(0);
    expect(out.sizes).toHaveLength(0);
  });

  it('rows are scoped to filteredVms (filtering removes a family)', () => {
    // Filter out the GP family entirely → no GP rows survive.
    const memOnly = ALL.filter((v) => v.category === 'Memory Optimized');
    const out = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: memOnly,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    expect(out.families.some((r) => r.baseValue === 'D')).toBe(false);
    expect(out.categories.some((r) => r.baseValue === 'General Purpose')).toBe(false);
    expect(out.categories.some((r) => r.baseValue === 'Memory Optimized')).toBe(true);
  });
});

describe('equivalencyInsights — most-similar per other cloud', () => {
  const rows = buildEquivalencyRows({
    userVms: ALL,
    filteredVms: ALL,
    activeProviders: ['Azure', 'AWS'],
    base: 'Azure',
  });

  it('returns one insight per NON-base provider', () => {
    const ins = equivalencyInsights(rows, ['AWS']);
    expect(ins).toHaveLength(1);
    expect(ins[0].provider).toBe('AWS');
  });

  it('picks the highest-pct category / family / size for the provider', () => {
    const [aws] = equivalencyInsights(rows, ['AWS']);
    // AWS only has a memory-optimized family (r7i) — so the closest CATEGORY is
    // Memory Optimized, and the closest FAMILY label is r7i.
    expect(aws.category?.label).toBe('Memory Optimized');
    expect(aws.family?.label).toBe('r7i');
    // Size insight names a real AWS size with a numeric pct.
    expect(aws.size?.label).toMatch(/r7i/);
    expect(aws.size && aws.size.pct).toBeGreaterThan(0);
  });

  it('scopes the size insight to the selected base sizes when provided', () => {
    // Only consider the Azure E8s_v5 base size → its closest AWS analog (the
    // larger r7i.2xlarge, 8 vCPU / 64 GiB) should win the size line.
    const [aws] = equivalencyInsights(rows, ['AWS'], new Set(['E8s_v5']));
    expect(aws.size?.baseLabel).toBe('E8s_v5');
    expect(aws.size?.label).toBe('r7i.2xlarge');
  });

  it('an empty selection set behaves like no scoping (closest anywhere)', () => {
    const unscoped = equivalencyInsights(rows, ['AWS']);
    const emptySel = equivalencyInsights(rows, ['AWS'], new Set());
    expect(emptySel[0].size?.label).toBe(unscoped[0].size?.label);
  });
});

describe('rankedFamiliesVsBase — alternatives, not just the closest', () => {
  // Two AWS memory-optimized families so ranking has something to order.
  const AWS_MULTI: CatalogEntry[] = [
    ...AWS, // r7i (Memory Optimized)
    vm('AWS', { vmSizeName: 'x2idn.xlarge', family: 'x2idn', category: 'Memory Optimized', vcpus: 4, memoryGib: 128 }),
    vm('AWS', { vmSizeName: 'x2idn.2xlarge', family: 'x2idn', category: 'Memory Optimized', vcpus: 8, memoryGib: 256 }),
    // a compute family that must NOT appear (different category)
    vm('AWS', { vmSizeName: 'c7i.xlarge', family: 'c7i', category: 'Compute Optimized', vcpus: 4, memoryGib: 8 }),
  ];
  const ALL_MULTI = [...AZURE, ...AWS_MULTI];

  it('ranks EVERY in-scope same-category family on the other cloud (not one)', () => {
    const { byProvider, totalByProvider } = rankedFamiliesVsBase(
      ALL_MULTI,
      'Azure',
      'E', // base Memory-Optimized family (vmFamily key for Esv5)
      ['AWS'],
    );
    const fams = byProvider.AWS.map((f) => f.family);
    expect(fams).toContain('r7i');
    expect(fams).toContain('x2idn');
    expect(fams).not.toContain('c7i'); // different category — gated out
    expect(totalByProvider.AWS).toBe(2);
    // sorted by pct descending
    expect(byProvider.AWS[0].pct).toBeGreaterThanOrEqual(byProvider.AWS[1].pct);
  });

  it('returns empty when the base family does not exist', () => {
    const { byProvider } = rankedFamiliesVsBase(ALL_MULTI, 'Azure', 'NoSuchFam', ['AWS']);
    expect(byProvider.AWS).toHaveLength(0);
  });

  // v2.42 — the equivalency PANEL family rows (buildEquivalencyRows) and the
  // Competitive family CHIP (rankedFamiliesVsBase) must report the SAME ≈% for
  // the same base family. Both now score by best size-pair; this pins them
  // together so they can't drift apart again (the S48 inconsistency).
  it('panel family row ≈% equals the chip (rankedFamiliesVsBase top) for the same family', () => {
    const rows = buildEquivalencyRows({
      userVms: ALL_MULTI,
      filteredVms: ALL_MULTI,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const eFamRow = rows.families.find((r) => r.baseValue === 'E');
    expect(eFamRow).toBeTruthy();
    const panelPct = eFamRow!.cells.AWS!.pct;

    const { byProvider } = rankedFamiliesVsBase(ALL_MULTI, 'Azure', 'E', ['AWS']);
    const chipTopPct = byProvider.AWS[0].pct;
    const chipTopFam = byProvider.AWS[0].family;

    expect(panelPct).toBe(chipTopPct);
    expect(eFamRow!.cells.AWS!.value).toBe(chipTopFam);
  });

  // v2.41 — the family ≈% is the BEST achievable size-level match, NOT
  // "closest member vs the base-family MEDIAN". A family whose median is far
  // from the base median can still hold a near-perfect size analog (the
  // x1e.8xlarge ↔ large-M-series case the user flagged); that family must
  // surface HIGH so it isn't hidden behind a misleading low family number.
  it('scores a family by its BEST size match, not the base-family median', () => {
    // Base family spanning small→large; its MEDIAN is the mid size.
    const base: CatalogEntry[] = [
      vm('Azure', { vmSizeName: 'M-sm', family: 'M', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
      vm('Azure', { vmSizeName: 'M-md', family: 'M', category: 'Memory Optimized', vcpus: 16, memoryGib: 128 }),
      vm('Azure', { vmSizeName: 'M-lg', family: 'M', category: 'Memory Optimized', vcpus: 96, memoryGib: 1900 }),
    ];
    // 'big' family ONLY has a huge size — far from the base median (M-md) but a
    // near-perfect analog for the large base size (M-lg).
    const big: CatalogEntry[] = [
      vm('AWS', { vmSizeName: 'big.huge', family: 'big', category: 'Memory Optimized', vcpus: 96, memoryGib: 1900 }),
    ];
    const { byProvider } = rankedFamiliesVsBase([...base, ...big], 'Azure', 'M', ['AWS']);
    const bigPct = byProvider.AWS.find((f) => f.family === 'big')?.pct ?? 0;
    // Best pair (M-lg ↔ big.huge) is an exact match → very high, even though the
    // family's median-to-median similarity would be low.
    expect(bigPct).toBeGreaterThan(80);
  });

  it('rankedSizesVsBase ranks every same-category size vs the base size, best-first', () => {
    const base: CatalogEntry[] = [
      vm('Azure', { vmSizeName: 'M-lg', family: 'M', category: 'Memory Optimized', vcpus: 64, memoryGib: 1024 }),
    ];
    const aws: CatalogEntry[] = [
      vm('AWS', { vmSizeName: 'x1e.16xlarge', family: 'x1e', category: 'Memory Optimized', vcpus: 64, memoryGib: 1952 }),
      vm('AWS', { vmSizeName: 'x1e.8xlarge', family: 'x1e', category: 'Memory Optimized', vcpus: 32, memoryGib: 976 }),
      vm('AWS', { vmSizeName: 'r7i.large', family: 'r7i', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }),
      vm('AWS', { vmSizeName: 'c7i.large', family: 'c7i', category: 'Compute Optimized', vcpus: 2, memoryGib: 4 }),
    ];
    const out = rankedSizesVsBase([...base, ...aws], 'Azure', 'M-lg', ['AWS']);
    const sizes = out.AWS.map((s) => s.size);
    expect(sizes).not.toContain('c7i.large'); // different category — gated out
    // multiple same-category sizes surface (the runners-up), best-first
    expect(out.AWS.length).toBeGreaterThanOrEqual(2);
    expect(out.AWS[0].pct).toBeGreaterThanOrEqual(out.AWS[out.AWS.length - 1].pct);
  });

  it('rankedCategoriesVsBase lists ALL other-cloud categories ranked vs the base category', () => {
    const out = rankedCategoriesVsBase(ALL_MULTI, 'Azure', 'Memory Optimized', ['AWS']);
    const cats = out.AWS.map((c) => c.category);
    // AWS has BOTH a memory-optimized (r7i/x2idn) and a compute-optimized (c7i)
    // family in scope — the cross-category read surfaces both, ranked.
    expect(cats).toContain('Memory Optimized');
    expect(cats).toContain('Compute Optimized');
    // Memory Optimized must be at least as similar to the MO base as Compute.
    const mo = out.AWS.find((c) => c.category === 'Memory Optimized')!.pct;
    const co = out.AWS.find((c) => c.category === 'Compute Optimized')!.pct;
    expect(mo).toBeGreaterThanOrEqual(co);
    // sorted descending
    expect(out.AWS[0].pct).toBeGreaterThanOrEqual(out.AWS[out.AWS.length - 1].pct);
  });
});

describe('cross-category fallback — a cloud scoped to a different category still shows analogs', () => {
  // Azure base = Memory-Optimized (8 GiB/vCPU). AWS in scope = ONLY an HPC family
  // (different category) with matching density — reproduces "AWS scoped to HPC vs
  // an Azure memory base", which used to blank every AWS cell to "—".
  const AZ_MO: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'E4s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
  ];
  const AWS_HPC: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'hpc7a.12xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 4, memoryGib: 32 }),
    vm('AWS', { vmSizeName: 'hpc7a.24xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 8, memoryGib: 64 }),
  ];
  const SCOPED = [...AZ_MO, ...AWS_HPC];

  it('buildEquivalencyRows surfaces the cross-category family instead of "—" and flags it', () => {
    const rows = buildEquivalencyRows({
      userVms: SCOPED,
      filteredVms: SCOPED,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const fam = rows.families.find((r) => r.baseValue === 'E')!;
    const aws = fam.cells.AWS;
    expect(aws).not.toBeNull();
    expect(aws!.value).toBe('hpc7a');
    expect(aws!.crossCategory).toBe(true);
    // Penalized, so clearly < 100, but still a meaningful (not floored) signal.
    expect(aws!.pct).toBeLessThan(100);
    expect(aws!.pct).toBeGreaterThan(40);
  });

  it('size rows also fall back across the category gate (flagged)', () => {
    const rows = buildEquivalencyRows({
      userVms: SCOPED,
      filteredVms: SCOPED,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = rows.sizes.find((r) => r.baseValue === 'E8s_v5')!;
    expect(sizeRow.cells.AWS).not.toBeNull();
    expect(sizeRow.cells.AWS!.crossCategory).toBe(true);
    expect(sizeRow.cells.AWS!.pct).toBeGreaterThan(40);
  });

  it('does NOT cross the gate when a same-category candidate exists (no regression)', () => {
    const withMem = [
      ...AZ_MO,
      vm('AWS', { vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
      vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
      ...AWS_HPC,
    ];
    const rows = buildEquivalencyRows({
      userVms: withMem,
      filteredVms: withMem,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const aws = rows.families.find((r) => r.baseValue === 'E')!.cells.AWS!;
    expect(aws.value).toBe('r7i'); // same-category wins
    expect(aws.crossCategory).toBeFalsy();
    expect(aws.pct).toBe(100);
  });

  it('rankedFamiliesVsBase also falls back when the cloud is scoped elsewhere', () => {
    const { byProvider } = rankedFamiliesVsBase(SCOPED, 'Azure', 'E', ['AWS']);
    expect(byProvider.AWS.length).toBeGreaterThan(0);
    expect(byProvider.AWS[0].family).toBe('hpc7a');
    expect(byProvider.AWS[0].pct).toBeGreaterThan(40);
  });
});

// ── S65 Bug 1 — non-base column re-ranks from the WIDER pool when its ② chip
// scoped it away from the base category, instead of stretching cross-category ──
describe('S65 Bug 1 — non-base column suggests the true same-category peer, not a ~0% cross-category stretch', () => {
  // Azure base = Memory Optimized (E, 8 GiB/vCPU). The FULL catalog (`userVms`) has
  // both an AWS/GCP Memory-Optimized peer AND an HPC family; the FILTERED view
  // (`filteredVms`) is scoped to ONLY the HPC family on the non-base clouds (as the
  // ② category chip / Best-match auto-pick can do). The panel must still surface the
  // real MO peer (r7i / n2-highmem) for each base SIZE row — never the HPC family at
  // ~0-2%, which the column-top "+" would otherwise add as garbage.
  const AZ_MO: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'E2s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }),
    vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
  ];
  const AWS_ALL: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'r7i.large', family: 'r7i', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
    vm('AWS', { vmSizeName: 'hpc7a.12xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 2, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'hpc7a.24xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 8, memoryGib: 64 }),
  ];
  // Filtered view: the base's MO sizes + ONLY the AWS HPC family (MO peer hidden).
  const FILTERED = [...AZ_MO, ...AWS_ALL.filter((v) => v.category === 'High Performance Computing')];
  const FULL = [...AZ_MO, ...AWS_ALL];

  it('the ranked size column leads with the Memory-Optimized best match, never the ~0% HPC stretch', () => {
    const rows = buildEquivalencyRows({
      userVms: FULL, // wider pool DOES contain the MO peer
      filteredVms: FILTERED, // scoped view shows only HPC on AWS
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    for (const baseSize of ['E2s_v5', 'E8s_v5']) {
      const cell = rows.sizes.find((r) => r.baseValue === baseSize)!.cells.AWS!;
      expect(cell).not.toBeNull();
      // The real same-category (Memory Optimized) peer, high %, not a cross-category
      // HPC stretch at ~0%.
      expect(cell.value.startsWith('r7i')).toBe(true);
      expect(cell.crossCategory).toBeFalsy();
      expect(cell.pct).toBeGreaterThan(80);
    }
  });

  it('still falls back to the genuine cross-category peer when the WIDER pool truly lacks a same-category family', () => {
    // No MO peer anywhere (userVms === the HPC-only scoped view) → honest fallback.
    const hpcOnly = [...AZ_MO, ...AWS_ALL.filter((v) => v.category === 'High Performance Computing')];
    const rows = buildEquivalencyRows({
      userVms: hpcOnly,
      filteredVms: hpcOnly,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const cell = rows.sizes.find((r) => r.baseValue === 'E8s_v5')!.cells.AWS!;
    expect(cell.value.startsWith('hpc7a')).toBe(true);
    expect(cell.crossCategory).toBe(true);
  });
});

// ── S65 FIX-B (Fix 1) — the ladder fallback pool is scoped by the user's EXPLICIT
// region pick (`regionScopeByProvider`), NOT inferred from `filteredVms`. Two
// verified failure modes of the old inference are pinned closed here. ──────────
describe('S65 Fix 1 — explicit region-scope pool (no full-catalog leak, no family-footprint shrink)', () => {
  // Azure MO base. AWS carries a same-category (MO) peer in TWO regions plus an HPC
  // family. `region` is stamped so the region-restriction can bite.
  const az = (r: string): CatalogEntry[] => [
    vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64, region: r }),
  ];
  const awsMoUsEast: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64, region: 'us-east-1' }),
  ];
  const awsMoEuWest: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64, region: 'eu-west-1' }),
  ];

  // (i) A region-picked cloud with ZERO rows in that region → HONEST empty pool,
  // NOT a full-catalog leak that ignores the region pick.
  it('a cloud with no rows in the picked region yields NO analog (not a full-catalog leak)', () => {
    // AWS's only MO peer lives in eu-west-1; the base picked us-east-1 for AWS.
    const full = [...az('us-east-1'), ...awsMoEuWest];
    // Scoped view has NO AWS rows (the us-east-1 region pick emptied it) — the
    // pre-fix inference would then have leaked to the full (eu-west-1) catalog.
    const scoped = az('us-east-1');
    const rows = buildEquivalencyRows({
      userVms: full,
      filteredVms: scoped,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
      regionScopeByProvider: { AWS: ['us-east-1'], Azure: ['us-east-1'] },
    });
    const cell = rows.sizes.find((r) => r.baseValue === 'E8s_v5')!.cells.AWS;
    expect(cell).toBeNull(); // no eu-west-1 leak; honest "no analog in scope"
  });

  // Same setup but the AWS peer IS in the picked region → it IS found.
  it('a cloud WITH a row in the picked region still finds its same-category peer', () => {
    const full = [...az('us-east-1'), ...awsMoUsEast];
    const scoped = az('us-east-1');
    const rows = buildEquivalencyRows({
      userVms: full,
      filteredVms: scoped,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
      regionScopeByProvider: { AWS: ['us-east-1'], Azure: ['us-east-1'] },
    });
    const cell = rows.sizes.find((r) => r.baseValue === 'E8s_v5')!.cells.AWS!;
    expect(cell).not.toBeNull();
    expect(cell.value).toBe('r7i.2xlarge');
    expect(cell.pct).toBeGreaterThan(90);
  });

  // (ii) NO region pick + a FAMILY narrowing on the non-base cloud → the true
  // same-category peer OUTSIDE the narrowed family's footprint IS found (the
  // pre-fix inference shrank the pool to the narrowed family's regions).
  it('with no region pick, a family-narrowed cloud still surfaces the same-category peer outside the narrowing', () => {
    // FULL: base + an AWS HPC family (regionA) + the true MO peer (regionB).
    const base = az('regionA');
    const awsHpc = vm('AWS', { vmSizeName: 'hpc7a.24xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 8, memoryGib: 64, region: 'regionA' });
    const awsMo = vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64, region: 'regionB' });
    const full = [...base, awsHpc, awsMo];
    // Scoped view narrows AWS to ONLY the HPC family (regionA footprint). The old
    // inference read AWS regions as {regionA} → dropped the regionB MO peer.
    const scoped = [...base, awsHpc];
    const rows = buildEquivalencyRows({
      userVms: full,
      filteredVms: scoped,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
      // NO region pick → no region restriction on the fallback pool.
      regionScopeByProvider: {},
    });
    const cell = rows.sizes.find((r) => r.baseValue === 'E8s_v5')!.cells.AWS!;
    expect(cell).not.toBeNull();
    // The real same-category MO peer wins rung 1 over the HPC cross-category stretch.
    expect(cell.value).toBe('r7i.2xlarge');
    expect(cell.crossCategory).toBeFalsy();
    expect(cell.pct).toBeGreaterThan(90);
  });

  // (iii) REGRESSION PIN — an unnarrowed default view (userVms === filteredVms,
  // no region scope arg) is byte-identical to the pre-Fix-1 output.
  it('unnarrowed default (no region scope) is byte-identical to omitting the arg', () => {
    const withScope = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
      regionScopeByProvider: { Azure: null, AWS: null, GCP: null },
    });
    const withoutScope = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    expect(JSON.stringify(withScope)).toBe(JSON.stringify(withoutScope));
  });
});

// ── S65 Bug 3 — a small Memory-Optimized base's cross-cloud best match ──
describe('S65 Bug 3 — MO base best-match: clean same-category peer stays unflagged; a true GP-only stretch is flagged', () => {
  const baseE: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'Standard_E2ads_v5', family: 'E', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }),
  ];

  it('a GCP highmem analog (matchCategory MO, GP vendor label) is a clean match — NOT flagged a stretch', () => {
    const gcp: CatalogEntry[] = [
      // Vendor label GP, but matchCategory upgrades `*-highmem` → Memory Optimized.
      vm('GCP', { vmSizeName: 'n2-highmem-2', family: 'n2', category: 'General Purpose', vcpus: 2, memoryGib: 16 }),
      vm('GCP', { vmSizeName: 'm3-ultramem-32', family: 'm3', category: 'Memory Optimized', vcpus: 32, memoryGib: 976 }),
    ];
    const pick = bestMatchAnalog(baseE, gcp)!;
    expect(pick.size).toBe('n2-highmem-2');
    expect(pick.pct).toBeGreaterThanOrEqual(85);
    expect(pick.stretch).toBeFalsy();
    expect(pick.caveats?.some((c) => c.kind === 'category-fallback')).toBeFalsy();
  });

  it('when GCP has NO small Memory-Optimized size (only a genuine GP t2d), the best match is flagged a cross-category stretch', () => {
    const gcp: CatalogEntry[] = [
      // t2d is truly General Purpose (matchCategory GP) — the closest 2-vCPU size,
      // but 8 GiB not 16, so ~30% and cross-category. This is the misleading
      // "BEST MATCH · ≈31%" the doctrine says must carry a visible caveat.
      vm('GCP', { vmSizeName: 't2d-standard-2', family: 't2d', category: 'General Purpose', vcpus: 2, memoryGib: 8 }),
      // The only MO family is huge (40 vCPU) — a worse distance than the small t2d.
      vm('GCP', { vmSizeName: 'm1-ultramem-40', family: 'm1', category: 'Memory Optimized', vcpus: 40, memoryGib: 961 }),
    ];
    const pick = bestMatchAnalog(baseE, gcp)!;
    expect(pick.size).toBe('t2d-standard-2');
    expect(pick.category).toBe('General Purpose');
    expect(pick.stretch).toBe(true);
    expect(pick.caveats?.some((c) => c.kind === 'category-fallback')).toBe(true);
  });
});

// ── S65 Bug 2 — comparison-table backfill merge (manual wins, auto rebuilt) ──
describe('S65 Bug 2 — mergeBestMatchFills backfills auto analogs without clobbering manual picks', () => {
  it('backfills an auto analog for a base row the cloud has no pick on', () => {
    const out = mergeBestMatchFills([], ['E2', 'E4'], { E2: 'r5.large', E4: 'r5.xlarge' });
    expect(out).toEqual([
      { value: 'r5.large', row: 'E2', auto: true },
      { value: 'r5.xlarge', row: 'E4', auto: true },
    ]);
  });

  it('a MANUAL pick on a row always wins — that row is never backfilled', () => {
    const existing = [{ value: 'm6i.large', row: 'E2' }]; // manual (auto falsy)
    const out = mergeBestMatchFills(existing, ['E2', 'E4'], { E2: 'r5.large', E4: 'r5.xlarge' });
    // E2 keeps the manual m6i.large; only E4 gets an auto fill.
    expect(out).toEqual([
      { value: 'm6i.large', row: 'E2' },
      { value: 'r5.xlarge', row: 'E4', auto: true },
    ]);
  });

  it('toggling Best match OFF (empty fills) drops every auto pick but keeps manual picks', () => {
    const existing = [
      { value: 'm6i.large', row: 'E2' }, // manual
      { value: 'r5.xlarge', row: 'E4', auto: true }, // auto (should drop)
    ];
    const out = mergeBestMatchFills(existing, ['E2', 'E4'], {});
    expect(out).toEqual([{ value: 'm6i.large', row: 'E2' }]);
  });

  it('does not backfill a base row that no longer exists', () => {
    const out = mergeBestMatchFills([], ['E2'], { E2: 'r5.large', GONE: 'x.large' });
    expect(out).toEqual([{ value: 'r5.large', row: 'E2', auto: true }]);
  });

  it('is idempotent — re-running with the same fills rebuilds an identical list', () => {
    const first = mergeBestMatchFills([{ value: 'm6i.large', row: 'E2' }], ['E2', 'E4'], { E4: 'r5.xlarge' });
    const second = mergeBestMatchFills(first, ['E2', 'E4'], { E4: 'r5.xlarge' });
    expect(second).toEqual(first);
  });

  // ── S65 Fix 3 — suppression + order preservation ─────────────────────────────
  it('a SUPPRESSED base row is NOT re-added (removal does not resurrect in the same cycle)', () => {
    // The user ✕-removed the auto on E4; the merge must skip it despite the fill.
    const existing = [{ value: 'm6i.large', row: 'E2' }]; // manual on E2, E4 was removed
    const out = mergeBestMatchFills(
      existing,
      ['E2', 'E4'],
      { E2: 'r5.large', E4: 'r5.xlarge' },
      new Set(['E4']),
    );
    // E2 is manual (untouched); E4 is suppressed → no auto re-added.
    expect(out).toEqual([{ value: 'm6i.large', row: 'E2' }]);
  });

  it('suppression is per-row — an unsuppressed row still backfills', () => {
    const out = mergeBestMatchFills(
      [],
      ['E2', 'E4'],
      { E2: 'r5.large', E4: 'r5.xlarge' },
      new Set(['E2']),
    );
    // E2 suppressed → skipped; E4 free → auto appended.
    expect(out).toEqual([{ value: 'r5.xlarge', row: 'E4', auto: true }]);
  });

  it('preserves EXISTING list order — manual + auto interleaved stay put; new autos append at the end', () => {
    // Existing order: auto(E4), manual(E2), auto(E6) — interleaved. A merge pass with
    // a NEW base row E8 must keep the existing three in place and append E8 last.
    const existing = [
      { value: 'r5.xlarge', row: 'E4', auto: true },
      { value: 'm6i.large', row: 'E2' }, // manual, second
      { value: 'r5.2xlarge', row: 'E6', auto: true },
    ];
    const out = mergeBestMatchFills(
      existing,
      ['E2', 'E4', 'E6', 'E8'],
      { E2: 'x', E4: 'r5.xlarge', E6: 'r5.2xlarge', E8: 'r5.4xlarge' },
    );
    expect(out).toEqual([
      { value: 'r5.xlarge', row: 'E4', auto: true }, // kept in place (order preserved)
      { value: 'm6i.large', row: 'E2' }, // manual kept in place, NOT re-covered by fills
      { value: 'r5.2xlarge', row: 'E6', auto: true }, // kept in place
      { value: 'r5.4xlarge', row: 'E8', auto: true }, // genuinely new → appended last
    ]);
  });

  it('a reorder of auto entries survives a merge pass (no snap-back to [manual..., auto...])', () => {
    // The user dragged E6's auto above E4's auto.
    const reordered = [
      { value: 'r5.2xlarge', row: 'E6', auto: true },
      { value: 'r5.xlarge', row: 'E4', auto: true },
    ];
    const out = mergeBestMatchFills(reordered, ['E4', 'E6'], { E4: 'r5.xlarge', E6: 'r5.2xlarge' });
    // Order is preserved exactly — not re-sorted by baseRows.
    expect(out).toEqual(reordered);
  });
});

describe('category metric is consistent across filtered + unfiltered (v2.42)', () => {
  const DATA: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'E4s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
    // AWS memory analog that is close but NOT spec-identical (so the mean < 100).
    vm('AWS', { vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 4, memoryGib: 28 }),
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 56 }),
    // AWS compute family (different category) for the penalty comparison.
    vm('AWS', { vmSizeName: 'c7i.xlarge', family: 'c7i', category: 'Compute Optimized', vcpus: 4, memoryGib: 8 }),
    vm('AWS', { vmSizeName: 'c7i.2xlarge', family: 'c7i', category: 'Compute Optimized', vcpus: 8, memoryGib: 16 }),
  ];
  it('filtered same-category % equals the unfiltered category-row mean (no pinned 100)', () => {
    const rows = buildEquivalencyRows({
      userVms: DATA,
      filteredVms: DATA,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const unfilteredMO = rows.categories.find((r) => r.baseValue === 'Memory Optimized')!.cells.AWS!.pct;
    const ranked = rankedCategoriesVsBase(DATA, 'Azure', 'Memory Optimized', ['AWS']);
    const filteredMO = ranked.AWS.find((c) => c.category === 'Memory Optimized')!.pct;
    // Same spec-based aggregate in both modes (was 100 pinned vs ~81 mean before).
    expect(Math.abs(filteredMO - unfilteredMO)).toBeLessThanOrEqual(1);
    // The same category is no longer a hardcoded 100% — only the base column is.
    expect(filteredMO).toBeLessThan(100);
    // A different category sits strictly below the same category (penalized).
    const co = ranked.AWS.find((c) => c.category === 'Compute Optimized')!.pct;
    expect(co).toBeLessThan(filteredMO);
  });
});

describe('rankedFamiliesPerBase — one ranking per base family (v2.43)', () => {
  const DATA: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'E4s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('Azure', { vmSizeName: 'E8s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
    vm('Azure', { vmSizeName: 'M8ms_v3', family: 'Msv3', category: 'Memory Optimized', vcpus: 8, memoryGib: 220 }),
    vm('AWS', { vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
    vm('AWS', { vmSizeName: 'x2idn.xlarge', family: 'x2idn', category: 'Memory Optimized', vcpus: 8, memoryGib: 256 }),
  ];
  it('returns an independent ranking for EACH picked base family', () => {
    // Base-family KEYS are the display families vmFamily() produces (what the
    // UI passes), e.g. Azure Esv5 → "E", Msv3 → "Msv3 Medium Memory series".
    const eKey = vmFamily(DATA[0])!;
    const mKey = vmFamily(DATA[2])!;
    expect(eKey).not.toBe(mKey);
    const out = rankedFamiliesPerBase(DATA, 'Azure', [eKey, mKey], ['AWS'], 3);
    expect(out[eKey].AWS.length).toBeGreaterThan(0);
    expect(out[mKey].AWS.length).toBeGreaterThan(0);
    // E (32-64 GiB) is closest to r7i; the very-high-memory M-series (220 GiB)
    // is closest to x2idn (256 GiB) — i.e. each base family ranks differently.
    expect(out[eKey].AWS[0].family).toBe('r7i');
    expect(out[mKey].AWS[0].family).toBe('x2idn');
    // Capped at 3.
    expect(out[eKey].AWS.length).toBeLessThanOrEqual(3);
  });
});

describe('rankedCategoriesPerBase — one ranking per base category (v2.44)', () => {
  // Azure base offers Memory Optimized + General Purpose; AWS offers both. Each
  // base category should rank the AWS categories independently — mirroring
  // rankedFamiliesPerBase, so multi-select category behaves like multi-select
  // family.
  const DATA: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'E4s_v5', family: 'Esv5', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('Azure', { vmSizeName: 'D4s_v5', family: 'Dsv5', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 4, memoryGib: 32 }),
    vm('AWS', { vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
  ];
  it('returns an independent category ranking for EACH picked base category', () => {
    const out = rankedCategoriesPerBase(
      DATA,
      'Azure',
      ['Memory Optimized', 'General Purpose'],
      ['AWS'],
    );
    expect(Object.keys(out).sort()).toEqual(['General Purpose', 'Memory Optimized']);
    // Each base category's #1 AWS analog is the SAME category (canonical match).
    expect(out['Memory Optimized'].AWS[0].category).toBe('Memory Optimized');
    expect(out['Memory Optimized'].AWS[0].pct).toBeGreaterThan(out['Memory Optimized'].AWS[1]?.pct ?? 0);
    expect(out['General Purpose'].AWS[0].category).toBe('General Purpose');
    // Same helper as the single-select path, just keyed per base category.
    const single = rankedCategoriesVsBase(DATA, 'Azure', 'Memory Optimized', ['AWS']);
    expect(out['Memory Optimized']).toEqual(single);
  });
});

// ── SIZE rows: round-robin by family + inline next-best (v2.43.3) ────────────
// Bug: with two base families picked, a flat vCPU-ascending sort filled the
// SIZE_CAP with the small family's sizes and buried the other family entirely.
// Fix: round-robin across families so EVERY picked family appears within the
// cap. Plus each size cell now carries up to 2 `alts` (greyed next-best).
// Verified for ALL THREE base providers (Azure / AWS / GCP base).
describe('buildEquivalencyRows — SIZE round-robin across base families', () => {
  // A base provider with a SMALL family (many tiny sizes) + a BIG family (few
  // huge sizes). 16 small sizes would have filled the old cap of 12, hiding the
  // big family. The other two clouds carry same-category analogs in both ranges.
  const baseCatalog = (p: Provider): CatalogEntry[] => {
    const rows: CatalogEntry[] = [];
    for (let i = 0; i < 16; i++) {
      rows.push(
        vm(p, {
          vmSizeName: `${p}-small-${i}`,
          family: 'SmallFam',
          category: 'Memory Optimized',
          vcpus: 2 + i,
          memoryGib: (2 + i) * 8,
        }),
      );
    }
    for (let i = 0; i < 4; i++) {
      rows.push(
        vm(p, {
          vmSizeName: `${p}-big-${i}`,
          family: 'BigFam',
          category: 'Memory Optimized',
          vcpus: 96 + i * 16,
          memoryGib: (96 + i * 16) * 8,
        }),
      );
    }
    return rows;
  };
  // A candidate cloud with same-category analogs spanning both ranges, so every
  // base size has a real (non-cross-category) match WITH runner-ups.
  const candidateCatalog = (p: Provider): CatalogEntry[] => {
    const rows: CatalogEntry[] = [];
    for (let i = 0; i < 8; i++) {
      rows.push(
        vm(p, {
          vmSizeName: `${p}-cand-${i}`,
          family: 'CandFam',
          category: 'Memory Optimized',
          vcpus: 2 + i * 16,
          memoryGib: (2 + i * 16) * 8,
        }),
      );
    }
    return rows;
  };

  const PROVIDERS: Provider[] = ['Azure', 'AWS', 'GCP'];
  for (const base of PROVIDERS) {
    const others = PROVIDERS.filter((p) => p !== base);
    it(`shows BOTH base families within the cap with ${base} as base`, () => {
      const all = [base, ...others].flatMap((p) =>
        p === base ? baseCatalog(p) : candidateCatalog(p),
      );
      const { sizes } = buildEquivalencyRows({
        userVms: all,
        filteredVms: all,
        activeProviders: [base, ...others],
        base,
      });
      const fams = new Set(
        sizes.map((r) => (r.baseValue.includes('small') ? 'SmallFam' : 'BigFam')),
      );
      // The whole point: the big family is NOT buried — both families surface.
      expect(fams.has('SmallFam')).toBe(true);
      expect(fams.has('BigFam')).toBe(true);
    });

    it(`size cells carry greyed next-best alts with ${base} as base`, () => {
      const all = [base, ...others].flatMap((p) =>
        p === base ? baseCatalog(p) : candidateCatalog(p),
      );
      const { sizes } = buildEquivalencyRows({
        userVms: all,
        filteredVms: all,
        activeProviders: [base, ...others],
        base,
      });
      // Every other-cloud cell has a primary match + up to 2 ranked alternatives,
      // nearest first (alt pct never exceeds the primary's).
      const cell = sizes.find((r) => r.cells[others[0]])?.cells[others[0]];
      expect(cell).toBeTruthy();
      expect(Array.isArray(cell!.alts)).toBe(true);
      expect(cell!.alts!.length).toBeGreaterThan(0);
      expect(cell!.alts!.length).toBeLessThanOrEqual(2);
      expect(cell!.alts![0].pct).toBeLessThanOrEqual(cell!.pct);
    });
  }
});

describe('findBetterMatchAlerts — flag a better analog hidden by the filter (v2.44)', () => {
  // Azure E2_v3 (2 vCPU / 16 GiB, Memory Optimized). GCP is FILTERED to the m3
  // family (huge: 32 vCPU / 1 TB) → best shown match is terrible. GCP's true
  // analog n2-highmem-2 (2/16) lives in the n2 family (General Purpose) the
  // filter excludes — so it should surface as a better-match alert.
  const baseVm = vm('Azure', { vmSizeName: 'Standard_E2_v3', family: 'E', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 });
  const m3 = vm('GCP', { vmSizeName: 'm3-ultramem-32', family: 'm3', category: 'Memory Optimized', vcpus: 32, memoryGib: 976 });
  const n2hm = vm('GCP', { vmSizeName: 'n2-highmem-2', family: 'n2', category: 'General Purpose', vcpus: 2, memoryGib: 16 });

  it('fires when the full catalog holds a far better, currently-hidden match', () => {
    const scoped = [baseVm, m3]; // GCP filtered to m3 only
    const full = [baseVm, m3, n2hm]; // n2-highmem present but excluded from scope
    const alerts = findBetterMatchAlerts('Standard_E2_v3', 'Azure', ['GCP'], scoped, full);
    expect(alerts.length).toBe(1);
    expect(alerts[0].cloud).toBe('GCP');
    expect(alerts[0].betterSize).toBe('n2-highmem-2');
    expect(alerts[0].betterPct).toBeGreaterThanOrEqual(90);
    expect(alerts[0].shownPct).toBeLessThan(20);
    expect(alerts[0].betterCategory).toBe('General Purpose'); // the DISPLAY category
  });

  it('stays silent when the best match is already on screen', () => {
    const both = [baseVm, m3, n2hm]; // n2-highmem already in scope → nothing hidden
    const alerts = findBetterMatchAlerts('Standard_E2_v3', 'Azure', ['GCP'], both, both);
    expect(alerts.length).toBe(0);
  });
});

describe('bestMatchAnalog — closest cross-cloud analog category/family (v2.44)', () => {
  // Azure base = E series (Memory Optimized): small E2_v3 + large E96. GCP offers
  // m3 (Memory Optimized, huge) AND n2-highmem (labeled General Purpose). The
  // genuine best match for the small E size is n2-highmem (General Purpose · n2),
  // NOT m3 — so the auto-pick must choose General Purpose, avoiding the m3 trap.
  const baseE: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'Standard_E2_v3', family: 'E', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }),
  ];
  const gcp: CatalogEntry[] = [
    vm('GCP', { vmSizeName: 'm3-ultramem-32', family: 'm3', category: 'Memory Optimized', vcpus: 32, memoryGib: 976 }),
    vm('GCP', { vmSizeName: 'n2-highmem-2', family: 'n2', category: 'General Purpose', vcpus: 2, memoryGib: 16 }),
  ];
  it('picks the category/family of the genuinely closest VM, not the same-named category', () => {
    const pick = bestMatchAnalog(baseE, gcp);
    expect(pick).not.toBeNull();
    expect(pick!.size).toBe('n2-highmem-2');
    expect(pick!.category).toBe('General Purpose');
    expect(pick!.family).toBe('n2');
    expect(pick!.pct).toBeGreaterThanOrEqual(90);
  });
  it('returns null when either side is empty', () => {
    expect(bestMatchAnalog([], gcp)).toBeNull();
    expect(bestMatchAnalog(baseE, [])).toBeNull();
  });

  // Regression (S62): a disk-less base tied between a plain SKU and its
  // local-NVMe sibling (r5.large vs r5d.large — same vCPU/RAM/cat, so the
  // Storage-Optimized-gated disk term never fires) must resolve the SAME way in
  // BOTH ranking paths — the equivalents panel (topVmMatches) and the post-pick
  // best match (bestMatchAnalog) — and prefer the no-local-disk analog. Before
  // the shared disk-aware tiebreak, the two paths broke the tie by iteration
  // order, so selecting the base flipped the shown match (r5.large ↔ r5d.large).
  it('breaks an exact distance tie toward the closer-local-disk analog, identically in both paths', () => {
    const e2: CatalogEntry = vm('Azure', {
      vmSizeName: 'Standard_E2_v3', family: 'E', category: 'Memory Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 0,
    });
    // r5d listed FIRST to prove the result is iteration-order independent.
    const r5d = vm('AWS', { vmSizeName: 'r5d.large', family: 'r5d', category: 'Memory Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 75 });
    const r5 = vm('AWS', { vmSizeName: 'r5.large', family: 'r5', category: 'Memory Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 0 });
    const aws = [r5d, r5];
    const analog = bestMatchAnalog([e2], aws);
    expect(analog!.size).toBe('r5.large');
    expect(topVmMatches(e2, aws, 1)[0].vm.vmSizeName).toBe('r5.large');
    // ...and stable when the candidate order is reversed.
    expect(bestMatchAnalog([e2], [r5, r5d])!.size).toBe('r5.large');
    expect(topVmMatches(e2, [r5, r5d], 1)[0].vm.vmSizeName).toBe('r5.large');
  });

  // S65 (Fix 2) — bestMatchAnalog now routes through the shared `ladderStages`
  // helper instead of a bespoke inline 2-rung ladder. These pin its output:
  //   (a) a non-confidential base resolves on rung 1 (same-category), unchanged.
  //   (b) a Confidential (DC) base bridges via rung 2 to the confidential-capable
  //       peer (m6a) ~89%, NOT a random cross-category size.
  it('non-confidential base still resolves rung-1 same-category (n2-highmem @ ≥90%)', () => {
    // Identical to the primary bestMatchAnalog test — confirms the ladder refactor
    // left the non-confidential path byte-identical.
    const pick = bestMatchAnalog(baseE, gcp)!;
    expect(pick.size).toBe('n2-highmem-2');
    expect(pick.category).toBe('General Purpose');
    expect(pick.pct).toBeGreaterThanOrEqual(90);
    expect(pick.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBeFalsy();
  });

  it('a Confidential (DC) base bridges to the confidential-capable m6a peer ~85-92% via rung 2', () => {
    const dc: CatalogEntry[] = [
      vm('Azure', { vmSizeName: 'DC8as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 8, memoryGib: 32 }),
    ];
    const aws: CatalogEntry[] = [
      // confidential-capable peer (labeled GP) — should win rung 2.
      vm('AWS', { vmSizeName: 'm6a.2xlarge', family: 'm6a', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
      // non-capable GP size — rung-3 fodder only.
      vm('AWS', { vmSizeName: 'm7i.2xlarge', family: 'm7i', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
    ];
    // Precondition: m6a is capable, m7i is not.
    expect(isConfidentialCapable(aws[0])).toBe(true);
    expect(isConfidentialCapable(aws[1])).toBe(false);
    const pick = bestMatchAnalog(dc, aws)!;
    expect(pick.size).toBe('m6a.2xlarge'); // bridged to the capable peer, not m7i
    expect(pick.family).toBe('m6a');
    expect(pick.pct).toBeGreaterThanOrEqual(85);
    expect(pick.pct).toBeLessThanOrEqual(92);
    expect(pick.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
    expect(pick.stretch).toBe(true);
  });
});

// ── A2: caveat plumbing + confidential/HPC fallback ladder ───────────────────
describe('A2 fallback ladder + caveats', () => {
  // Azure Confidential (DC) base. AWS set WITH a confidential-capable family
  // (m6a) → the ladder should bridge to it via rung 2 at the softer penalty.
  const AZ_CONF: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'DC4as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 4, memoryGib: 16 }),
    vm('Azure', { vmSizeName: 'DC8as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 8, memoryGib: 32 }),
  ];
  const AWS_WITH_CAPABLE: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'm6a.xlarge', family: 'm6a', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'm6a.2xlarge', family: 'm6a', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
    vm('AWS', { vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
  ];
  // AWS set WITHOUT any confidential-capable family → the ladder falls all the
  // way to rung 3 (full pool at CROSS_CATEGORY_PENALTY) with a category-fallback.
  const AWS_NO_CAPABLE: CatalogEntry[] = [
    vm('AWS', { vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'm7i.2xlarge', family: 'm7i', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
  ];

  it('sanity: m6a is confidential-capable, m7i is not', () => {
    expect(isConfidentialCapable(AWS_WITH_CAPABLE[0])).toBe(true);
    expect(isConfidentialCapable(AWS_NO_CAPABLE[0])).toBe(false);
  });

  it('DC base × AWS-with-m6a resolves via rung 2 to the m6a family, ~85-92%, with a confidential-feature-peer caveat', () => {
    const all = [...AZ_CONF, ...AWS_WITH_CAPABLE];
    const rows = buildEquivalencyRows({
      userVms: all,
      filteredVms: all,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const famRow = rows.families.find((r) => r.baseValue === 'DC');
    expect(famRow).toBeTruthy();
    const awsCell = famRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value).toBe('m6a'); // bridged to the confidential-capable family, not m7i
    expect(awsCell!.pct).toBeGreaterThanOrEqual(85);
    expect(awsCell!.pct).toBeLessThanOrEqual(92);
    expect(awsCell!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
    expect(awsCell!.stretch).toBe(true);
  });

  it('DC base × AWS-without-capable-family falls to rung 3 with a category-fallback caveat', () => {
    const all = [...AZ_CONF, ...AWS_NO_CAPABLE];
    const rows = buildEquivalencyRows({
      userVms: all,
      filteredVms: all,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const famRow = rows.families.find((r) => r.baseValue === 'DC');
    const awsCell = famRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value).toBe('m7i'); // only in-scope family, reached via cross-category fallback
    expect(awsCell!.caveats?.some((c) => c.kind === 'category-fallback')).toBe(true);
    // NOT a confidential-feature-peer (m7i offers no opt-in TEE).
    expect(awsCell!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(false);
  });

  it('size-cell caveats are populated for the confidential bridge', () => {
    const all = [...AZ_CONF, ...AWS_WITH_CAPABLE];
    const rows = buildEquivalencyRows({
      userVms: all,
      filteredVms: all,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = rows.sizes.find((r) => r.baseValue === 'DC8as_v5');
    expect(sizeRow).toBeTruthy();
    const awsCell = sizeRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value).toBe('m6a.2xlarge');
    expect(awsCell!.caveats && awsCell!.caveats.length).toBeGreaterThan(0);
    expect(awsCell!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
  });

  it('stretch flag is set when the only analog is ≥4x off', () => {
    // A tiny Confidential base against a large-only capable family → ≥4x vCPU gap.
    const bigOnly: CatalogEntry[] = [
      vm('AWS', { vmSizeName: 'm6a.16xlarge', family: 'm6a', category: 'General Purpose', vcpus: 64, memoryGib: 256 }),
    ];
    const all = [...AZ_CONF, ...bigOnly];
    const rows = buildEquivalencyRows({
      userVms: all,
      filteredVms: all,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = rows.sizes.find((r) => r.baseValue === 'DC4as_v5'); // 4 vCPU vs 64 → 16x
    const awsCell = sizeRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.stretch).toBe(true);
    expect(awsCell!.caveats?.some((c) => c.kind === 'stretch-size')).toBe(true);
  });

  // REGRESSION PIN — a NON-Confidential base must be byte-identical to the
  // pre-A2 result: rung 1 (same-category) always wins, the ladder is never
  // entered. Values captured from the pre-change build.
  it('non-confidential base ranked result is byte-identical (regression pin)', () => {
    const ranked = rankedFamiliesVsBase(ALL, 'Azure', 'E', ['AWS']);
    expect(ranked.byProvider.AWS).toEqual([{ family: 'r7i', pct: 100 }]);

    // And the size-cell pct for the memory base is still the pinned 100%.
    const rows = buildEquivalencyRows({
      userVms: ALL,
      filteredVms: ALL,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = rows.sizes.find((r) => r.baseValue === 'E8s_v5');
    expect(sizeRow!.cells.AWS!.pct).toBe(100);
    // A clean same-category like-for-like carries NO stretch flag.
    expect(sizeRow!.cells.AWS!.stretch).toBeFalsy();
  });
});

// ── S65: confidential rung-2 survives the LIVE-VIEW category scoping ──────────
// The A2 tests above all pass `userVms === filteredVms`, so they never exercised
// the bug the live equivalents table hit: `setupScopedVms` applies the ②
// category filter to EVERY provider, so a Confidential-scoped view drops AWS's
// confidential-CAPABLE peers (m6a/c6a/r6a — labeled General Purpose / Compute /
// Memory Optimized) from `filteredVms` BEFORE the ladder runs. Rung 2 then had an
// empty pool and the view degraded to rung 3 "different category" (~72-77%)
// instead of the rung-2 confidential-feature-peer (~89%) the unit tests saw.
// FIX: `buildEquivalencyRows` draws rung 2's capable-peer pool from `userVms`
// (region-scoped, NOT category-filtered), so the bridge survives the scoping.
describe('S65 confidential rung-2 through the live-view scoped path', () => {
  // Replicates CompetitivePage.setupScopedVms: the ② category picks are applied
  // to EVERY provider, not just the base.
  const scopeByCategory = (
    vms: CatalogEntry[],
    catByProvider: Partial<Record<Provider, string[]>>,
  ): CatalogEntry[] =>
    vms.filter((v) => {
      const p = (v.provider ?? 'Custom') as Provider;
      const cats = catByProvider[p];
      if (!cats || cats.length === 0) return true;
      const vc = v.category ?? '';
      return cats.includes(vc);
    });

  const AZ_CONF: CatalogEntry[] = [
    vm('Azure', { vmSizeName: 'DC4as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 4, memoryGib: 16 }),
    vm('Azure', { vmSizeName: 'DC8as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 8, memoryGib: 32 }),
  ];
  const AWS_MIX: CatalogEntry[] = [
    // Confidential-capable peers, labeled General Purpose (dropped by a
    // Confidential-only scope).
    vm('AWS', { vmSizeName: 'm6a.xlarge', family: 'm6a', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'm6a.2xlarge', family: 'm6a', category: 'General Purpose', vcpus: 8, memoryGib: 32 }),
    // A non-capable GP family + a memory family (rung-3 fodder if the bridge fails).
    vm('AWS', { vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16 }),
    vm('AWS', { vmSizeName: 'r7i.2xlarge', family: 'r7i', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }),
  ];
  const FULL = [...AZ_CONF, ...AWS_MIX];
  // The live view: user scoped BOTH clouds to Confidential in ② Category.
  const SCOPED = scopeByCategory(FULL, { Azure: ['Confidential'], AWS: ['Confidential'] });

  it('scoping drops AWS capable peers from filteredVms but userVms keeps them', () => {
    // filteredVms (SCOPED) has NO AWS rows (m6a etc. are GP, filtered out).
    expect(SCOPED.some((v) => v.provider === 'AWS')).toBe(false);
    // userVms (FULL) still carries the capable peers.
    expect(FULL.some((v) => v.provider === 'AWS' && v.family === 'm6a')).toBe(true);
  });

  it('family row bridges to m6a via rung 2 (~85-92%, confidential-feature-peer) despite the scope', () => {
    const rows = buildEquivalencyRows({
      userVms: FULL,          // full catalog — carries the capable peers
      filteredVms: SCOPED,    // live-view scoped catalog — AWS category-emptied
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const famRow = rows.families.find((r) => r.baseValue === 'DC');
    expect(famRow).toBeTruthy();
    const awsCell = famRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value).toBe('m6a');
    expect(awsCell!.pct).toBeGreaterThanOrEqual(85);
    expect(awsCell!.pct).toBeLessThanOrEqual(92);
    expect(awsCell!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
  });

  it('size row bridges to an m6a size via rung 2, not a rung-3 different-category match', () => {
    const rows = buildEquivalencyRows({
      userVms: FULL,
      filteredVms: SCOPED,
      activeProviders: ['Azure', 'AWS'],
      base: 'Azure',
    });
    const sizeRow = rows.sizes.find((r) => r.baseValue === 'DC8as_v5');
    expect(sizeRow).toBeTruthy();
    const awsCell = sizeRow!.cells.AWS;
    expect(awsCell).not.toBeNull();
    expect(awsCell!.value.startsWith('m6a')).toBe(true);
    // Rung 2 (the fix) reads ~89%; the bug degraded to the rung-3 ~72-77% band.
    expect(awsCell!.pct).toBeGreaterThanOrEqual(85);
    // The rung-2 bridge is proven by the confidential-feature-peer caveat: a
    // capable peer (m6a) reached at CONFIDENTIAL_PEER_PENALTY, NOT a random
    // cross-category size at the heavier CROSS_CATEGORY_PENALTY. (A confidential
    // base ↔ capable-GP peer legitimately ALSO carries a category-fallback caveat,
    // since the categories do differ — the peer flag is what marks it as rung 2.)
    expect(awsCell!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
  });

  // LIVE-CATALOG pin — the same path through the REAL baked catalog, not a
  // synthetic mini-fixture. Reproduces the exact in-browser scenario (S64): an
  // Azure DC* base with the view scoped to the Confidential category, which
  // empties AWS/GCP of same-category rows (they have no dedicated Confidential
  // SKUs). Before the fix the DC family degraded to a rung-3 "different category"
  // ~72-77% match; after it, the rung-2 bridge lands on AWS m6a / GCP c3 ~89%.
  it('LIVE: Azure DC base scoped to Confidential bridges to a capable peer ~85-92%', () => {
    const raw = buildLiveCatalog() as unknown as CatalogEntry[];
    const seen = new Set<string>();
    const uniq: CatalogEntry[] = [];
    for (const v of raw) {
      const k = `${v.provider ?? 'Custom'}|${v.vmSizeName}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(v);
    }
    const catOf = (v: CatalogEntry) => v.category ?? categorize(v.provider, v.family);
    // Replica of CompetitivePage.setupScopedVms with a Confidential category pick
    // applied to EVERY provider (this is what emptied the non-base pools).
    const scoped = uniq.filter((v) => catOf(v) === 'Confidential');
    // Precondition: the scope really does empty AWS/GCP (the bug's trigger).
    expect(scoped.some((v) => v.provider === 'AWS')).toBe(false);
    expect(scoped.some((v) => v.provider === 'GCP')).toBe(false);
    expect(scoped.some((v) => v.provider === 'Azure')).toBe(true);

    const rows = buildEquivalencyRows({
      userVms: uniq,          // full catalog keeps the capable peers
      filteredVms: scoped,    // scoped view — non-base clouds category-emptied
      activeProviders: ['Azure', 'AWS', 'GCP'],
      base: 'Azure',
    });
    const dcFam = rows.families.find((r) => r.baseValue === 'DC');
    expect(dcFam).toBeTruthy();

    const aws = dcFam!.cells.AWS;
    expect(aws).not.toBeNull();
    expect(aws!.value).toBe('m6a'); // bridged to the confidential-capable AWS peer
    expect(aws!.pct).toBeGreaterThanOrEqual(85);
    expect(aws!.pct).toBeLessThanOrEqual(92);
    expect(aws!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);

    const gcp = dcFam!.cells.GCP;
    expect(gcp).not.toBeNull();
    expect(gcp!.pct).toBeGreaterThanOrEqual(85);
    expect(gcp!.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
  });
});

// ── S65 PERF: rankedFamiliesPerBase optimized === naive reference ────────────
// The optimized `rankedFamiliesPerBase` hoists the per-(provider, category)
// candidate resolution out of the per-base-family loop and relies on the
// module-level `vmFeatures` WeakMap cache. Both must be OUTPUT-IDENTICAL to the
// naive "call rankedFamiliesVsBase once per base family" reference — pinned here
// over the REAL live catalog for an Azure E-series base, a Confidential (DC)
// base, and a GPU base, across all three providers. Any drift in the ranking
// output (not just the intended confidential rung-2 fix) fails this test.
describe('S65 rankedFamiliesPerBase optimization is output-identical', () => {
  // Naive reference — the pre-optimization implementation.
  const naivePerBase = (
    vms: CatalogEntry[],
    base: Provider,
    fams: string[],
    others: Provider[],
    cap = 3,
  ): Record<string, Record<Provider, unknown>> => {
    const out: Record<string, Record<Provider, unknown>> = {};
    for (const fam of fams) {
      out[fam] = rankedFamiliesVsBase(vms, base, fam, others, cap).byProvider as Record<
        Provider,
        unknown
      >;
    }
    return out;
  };

  const raw = buildLiveCatalog() as unknown as CatalogEntry[];
  const seen = new Set<string>();
  const uniq: CatalogEntry[] = [];
  for (const v of raw) {
    const k = `${v.provider ?? 'Custom'}|${v.vmSizeName}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(v);
  }
  const famsFor = (base: Provider) => [
    ...new Set(
      uniq
        .filter((v) => (v.provider ?? 'Custom') === base)
        .map((v) => vmFamily(v))
        .filter(Boolean) as string[],
    ),
  ];

  for (const base of ['Azure', 'AWS', 'GCP'] as Provider[]) {
    it(`identical for base=${base} over the full live catalog`, () => {
      const fams = famsFor(base);
      const others = (['Azure', 'AWS', 'GCP'] as Provider[]).filter((p) => p !== base);
      const optimized = rankedFamiliesPerBase(uniq, base, fams, others, 3);
      const naive = naivePerBase(uniq, base, fams, others, 3);
      expect(JSON.stringify(optimized)).toBe(JSON.stringify(naive));
    });
  }

  it('identical for a Confidential (DC) and a GPU base family specifically', () => {
    // DC (confidential) — exercises the rung-2 confidential bridge path.
    const dcFams = famsFor('Azure').filter((f) => /^DC|^EC/i.test(f));
    // A GPU base family on AWS (p/g families).
    const gpuFams = famsFor('AWS').filter((f) => /^(p\d|g\d|inf|trn)/i.test(f));
    for (const [base, fams] of [
      ['Azure', dcFams],
      ['AWS', gpuFams],
    ] as [Provider, string[]][]) {
      if (fams.length === 0) continue;
      const others = (['Azure', 'AWS', 'GCP'] as Provider[]).filter((p) => p !== base);
      const optimized = rankedFamiliesPerBase(uniq, base, fams, others, 3);
      const naive = naivePerBase(uniq, base, fams, others, 3);
      expect(JSON.stringify(optimized)).toBe(JSON.stringify(naive));
    }
  });
});


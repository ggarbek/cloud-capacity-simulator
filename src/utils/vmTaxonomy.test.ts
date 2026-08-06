/**
 * v2.25.4 — Azure M-series PUBLIC series taxonomy.
 *
 * Guards the switch from the internal "MM Mv1 / HM Mv2 / VHM Mv3" compound
 * slug to Microsoft's published series names, AND the load-bearing invariant
 * that every family maps to exactly one fungibility routing class (so the
 * board's family-level drag stays unambiguous).
 */
import { describe, it, expect } from 'vitest';
import {
  vmFamily,
  vmClass,
  azureMSubSeries,
  compareFamily,
  isAzureMCompoundFamily,
  AZURE_M_FAMILY_ORDER,
} from './vmTaxonomy';
import { categorizeAzureFamily } from './vmCategory';
import { AZURE_M_SERIES_SEED } from '../data/azureMSeriesSeed';
import type { CatalogEntry } from '../types';

const mk = (vmSizeName: string, memoryGib: number): CatalogEntry =>
  ({
    vmSizeName,
    provider: 'Azure',
    memoryGib,
    memoryCategory:
      memoryGib > 16384
        ? 'Very High Memory (VHM)'
        : memoryGib > 4096
        ? 'High Memory (HM)'
        : 'Medium Memory (MM)',
    family: 'M-series',
  } as unknown as CatalogEntry);

describe('azureMSubSeries — SKU → public sub-series', () => {
  const cases: [string, string | null][] = [
    ['Standard_M8ms', 'M'], // original, no version
    ['Standard_M128m', 'M'],
    ['Standard_M32ms_v2', 'Msv2'], // Cascade diskless
    ['Standard_M64ds_v2', 'Mdsv2'], // Cascade + disk
    ['Standard_M208s_v2', 'Msv2'], // Skylake diskless
    ['Standard_M416ms_v2', 'Msv2'],
    ['Standard_M12s_v3', 'Msv3'], // Sapphire diskless
    ['Standard_M12ds_v3', 'Mdsv3'], // Sapphire + disk
    ['Standard_M416s_6_v3', 'Msv3'],
    ['Standard_M416ds_6_v3', 'Mdsv3'],
    ['Standard_M16bs_v3', 'Mbsv3'], // boosted
    ['Standard_M16bds_v3', 'Mbdsv3'], // boosted + disk
    // Constrained-core boosted SKUs: the dash must NOT swallow the feature
    // letters — they belong to the same series as the unconstrained parent.
    ['Standard_M128-64bds_v3', 'Mbdsv3'], // == M128bds_v3
    ['Standard_M128-64bs_v3', 'Mbsv3'], // == M128bs_v3
    ['Standard_M96-48bds_2_v3', 'Mbdsv3'], // == M96bds_2_v3
    ['Standard_M176-88bds_v3', 'Mbdsv3'], // == M176bds_v3
    ['Standard_M64-32bds_1_v3', 'Mbdsv3'], // == M64bds_1_v3
    ['Standard_M896ixds_32_v3', 'Mdsv3'], // VHM is an Mdsv3
    ['Standard_E16s_v5', null], // not M
    ['m7i.xlarge', null], // AWS
  ];
  for (const [sku, want] of cases) {
    it(`${sku} → ${want}`, () => expect(azureMSubSeries(sku)).toBe(want));
  }
});

describe('vmFamily — public Microsoft series labels', () => {
  it('original M-series', () => expect(vmFamily(mk('Standard_M8ms', 218))).toBe('M series'));
  it('Msv3 Medium', () =>
    expect(vmFamily(mk('Standard_M12s_v3', 240))).toBe('Msv3 Medium Memory series'));
  it('Mdsv3 Medium', () =>
    expect(vmFamily(mk('Standard_M12ds_v3', 240))).toBe('Mdsv3 Medium Memory series'));
  it('Msv3 High', () =>
    expect(vmFamily(mk('Standard_M832is_16_v3', 15200))).toBe('Msv3 High Memory series'));
  it('Mdsv3 Very High', () =>
    expect(vmFamily(mk('Standard_M896ixds_32_v3', 30400))).toBe(
      'Mdsv3 Very High Memory series',
    ));
  it('Mbsv3 carries its Medium tier (bandwidth boost ≠ a memory tier)', () =>
    expect(vmFamily(mk('Standard_M16bs_v3', 128))).toBe('Mbsv3 Medium Memory series'));
  it('Mbdsv3 carries its Medium tier', () =>
    expect(vmFamily(mk('Standard_M16bds_v3', 128))).toBe('Mbdsv3 Medium Memory series'));
  // Regression for the reported bug: the upper Medium-series sizes were tagged
  // High by the old ≤1024 cutoff and split out of "Msv3 Medium Memory series".
  // Per Azure Learn, Msv3 Medium = M12s_v3 (240) … M176s_4_v3 (3,892 GiB).
  describe('Msv3/Mdsv3 Medium series membership (M12s_v3 … M176s_4_v3)', () => {
    const medium: [string, number][] = [
      ['Standard_M12s_v3', 240],
      ['Standard_M24s_v3', 480],
      ['Standard_M48s_1_v3', 974],
      ['Standard_M96s_1_v3', 974],
      ['Standard_M96s_2_v3', 1946], // was wrongly HM under ≤1024
      ['Standard_M176s_3_v3', 2794], // was wrongly HM
      ['Standard_M176s_4_v3', 3892], // was wrongly HM (Medium ceiling)
    ];
    for (const [sku, mem] of medium) {
      it(`${sku} (${mem} GiB) → Msv3 Medium Memory series`, () =>
        expect(vmFamily(mk(sku, mem))).toBe('Msv3 Medium Memory series'));
    }
    it('Mdsv3 Medium ceiling — M176ds_4_v3 (3892) is Medium, not High', () =>
      expect(vmFamily(mk('Standard_M176ds_4_v3', 3892))).toBe('Mdsv3 Medium Memory series'));
    it('Msv3 High floor — M416s_6_v3 (5696) is High', () =>
      expect(vmFamily(mk('Standard_M416s_6_v3', 5696))).toBe('Msv3 High Memory series'));
  });
  // Constrained-core boosted SKUs share their parent's series + label.
  describe('constrained-core boosted SKUs → Mb family (not Msv3)', () => {
    it('M128-64bds_v3 (1024) → Mbdsv3 Medium Memory series', () =>
      expect(vmFamily(mk('Standard_M128-64bds_v3', 1024))).toBe('Mbdsv3 Medium Memory series'));
    it('M96-48bds_2_v3 (1946) → Mbdsv3 Medium Memory series', () =>
      expect(vmFamily(mk('Standard_M96-48bds_2_v3', 1946))).toBe('Mbdsv3 Medium Memory series'));
    it('M128-64bs_v3 (1024) → Mbsv3 Medium Memory series', () =>
      expect(vmFamily(mk('Standard_M128-64bs_v3', 1024))).toBe('Mbsv3 Medium Memory series'));
  });
  it('no more internal compound slugs', () => {
    for (const v of AZURE_M_SERIES_SEED) {
      expect(vmFamily(v)).not.toMatch(/^(MM|HM|VHM) Mv\d+$/);
    }
  });
});

describe('vmClass — one routing key per public series', () => {
  it('original M-series → "M"', () => expect(vmClass(mk('Standard_M8ms', 218))).toBe('M'));
  it('Msv3 MM → "Msv3-MM"', () => expect(vmClass(mk('Standard_M12s_v3', 240))).toBe('Msv3-MM'));
  it('Mdsv3 VHM → "Mdsv3-VHM"', () =>
    expect(vmClass(mk('Standard_M896ixds_32_v3', 30400))).toBe('Mdsv3-VHM'));
  it('Mbsv3 → "Mbsv3"', () => expect(vmClass(mk('Standard_M16bs_v3', 128))).toBe('Mbsv3'));
});

describe('family ↔ class is 1:1 across the whole seed', () => {
  it('every family resolves to exactly one routing class', () => {
    const byFamily = new Map<string, Set<string>>();
    for (const v of AZURE_M_SERIES_SEED) {
      const fam = vmFamily(v);
      const cls = vmClass(v);
      if (!byFamily.has(fam)) byFamily.set(fam, new Set());
      byFamily.get(fam)!.add(cls);
    }
    for (const [fam, classes] of byFamily) {
      expect(classes.size, `family "${fam}" should map to one class, got ${[...classes]}`).toBe(1);
    }
  });

  it('surfaces the storage-boosted Mb families that the old slug hid', () => {
    const fams = new Set(AZURE_M_SERIES_SEED.map((v) => vmFamily(v)));
    expect(fams.has('Mbsv3 Medium Memory series')).toBe(true);
    expect(fams.has('Mbdsv3 Medium Memory series')).toBe(true);
  });
});

describe('categorizeAzureFamily — cross-cloud category buckets', () => {
  const cases: [string, string][] = [
    // Memory Optimized: M-series (all public-series labels) + E + G(legacy bare handled separately)
    ['M series', 'Memory Optimized'],
    ['Msv3 Medium Memory series', 'Memory Optimized'],
    ['Mbsv3 Medium Memory series', 'Memory Optimized'],
    ['Mdsv3 Very High Memory series', 'Memory Optimized'],
    ['E', 'Memory Optimized'],
    ['Esv5', 'Memory Optimized'],
    // Compute Optimized: F-series (Azure docs file FX under compute-optimized too)
    ['F', 'Compute Optimized'],
    ['Fsv2', 'Compute Optimized'],
    ['FX', 'Compute Optimized'],
    // General Purpose: D / B / DS / GS
    ['D', 'General Purpose'],
    ['Dsv5', 'General Purpose'],
    ['B', 'General Purpose'],
    // Storage Optimized: L-series
    ['L', 'Storage Optimized'],
    ['Lsv3', 'Storage Optimized'],
    // GPU / accelerated: NC / ND / NV / NG + FPGA NP / PB
    ['NC', 'GPU'],
    ['ND', 'GPU'],
    ['NV', 'GPU'],
    ['NP', 'GPU'], // FPGA-accelerated — was wrongly General Purpose
    ['PB', 'GPU'], // FPGA-accelerated — was wrongly General Purpose
    // HPC: HB / HC / HX
    ['HB', 'High Performance Computing'],
    ['HC', 'High Performance Computing'],
    ['HX', 'High Performance Computing'],
    // Confidential: DC / EC
    ['DC', 'Confidential'],
    ['EC', 'Confidential'],
  ];
  for (const [fam, want] of cases) {
    it(`${fam} → ${want}`, () => expect(categorizeAzureFamily(fam)).toBe(want));
  }
});

describe('compareFamily + isAzureMCompoundFamily', () => {
  it('M-series labels sort ahead of non-M families', () => {
    expect(compareFamily('Msv3 Medium Memory series', 'E')).toBeLessThan(0);
    expect(compareFamily('E', 'Mbsv3 Medium Memory series')).toBeGreaterThan(0);
  });
  it('orders by memory tier: Medium before High before Very High', () => {
    expect(
      compareFamily('Msv3 Medium Memory series', 'Msv3 High Memory series'),
    ).toBeLessThan(0);
    expect(
      compareFamily('Mdsv3 High Memory series', 'Mdsv3 Very High Memory series'),
    ).toBeLessThan(0);
  });
  it('recognizes the public labels', () => {
    expect(isAzureMCompoundFamily('Msv3 Medium Memory series')).toBe(true);
    expect(isAzureMCompoundFamily('M series')).toBe(true);
    expect(isAzureMCompoundFamily('E')).toBe(false);
    expect(isAzureMCompoundFamily('MM Mv1')).toBe(false); // retired slug
  });
  it('AZURE_M_FAMILY_ORDER covers every family the seed produces', () => {
    const seedFams = new Set(AZURE_M_SERIES_SEED.map((v) => vmFamily(v)));
    for (const fam of seedFams) expect(AZURE_M_FAMILY_ORDER).toContain(fam);
  });
});

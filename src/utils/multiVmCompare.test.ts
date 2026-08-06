/**
 * v2.36 — TRUE MULTI-VM COMPARE row-builder. Each base size resolves to its
 * closest same-category analog on each other cloud (+ ≈% pct); a missing
 * category is a real product gap ("— none").
 */
import { describe, it, expect } from 'vitest';
import { buildCompareRows, buildCompareRow, specsByProvider } from './multiVmCompare';
import type { CatalogEntry } from '../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({
    vmSizeName: 'x',
    provider: 'Azure',
    vcpus: 4,
    memoryGib: 16,
    family: 'm',
    category: 'General Purpose',
    networkMbps: 0,
    ...o,
  } as CatalogEntry);

// Two Azure base VMs + AWS/GCP general-purpose candidate fleets.
const catalog: CatalogEntry[] = [
  vm({ provider: 'Azure', vmSizeName: 'D8s_v5', vcpus: 8, memoryGib: 32 }),
  vm({ provider: 'Azure', vmSizeName: 'D16s_v5', vcpus: 16, memoryGib: 64 }),
  vm({ provider: 'AWS', vmSizeName: 'm5.2xlarge', vcpus: 8, memoryGib: 32 }),
  vm({ provider: 'AWS', vmSizeName: 'm5.4xlarge', vcpus: 16, memoryGib: 64 }),
  vm({ provider: 'GCP', vmSizeName: 'e2-standard-8', vcpus: 8, memoryGib: 32 }),
  vm({ provider: 'GCP', vmSizeName: 'e2-standard-16', vcpus: 16, memoryGib: 64 }),
];

describe('multiVmCompare — base → AWS/GCP closest + pct', () => {
  it('finds the nearest same-category analog on each other cloud', () => {
    const rows = buildCompareRows(['D8s_v5', 'D16s_v5'], 'Azure', catalog);
    expect(rows).toHaveLength(2);

    const r0 = rows[0];
    expect(r0.base.vmSizeName).toBe('D8s_v5');
    expect(r0.analogs.AWS?.vm.vmSizeName).toBe('m5.2xlarge');
    expect(r0.analogs.GCP?.vm.vmSizeName).toBe('e2-standard-8');
    // Identical spec → ~100% match.
    expect(r0.analogs.AWS!.pct).toBeGreaterThanOrEqual(95);

    const r1 = rows[1];
    expect(r1.base.vmSizeName).toBe('D16s_v5');
    expect(r1.analogs.AWS?.vm.vmSizeName).toBe('m5.4xlarge');
    expect(r1.analogs.GCP?.vm.vmSizeName).toBe('e2-standard-16');
  });

  it('dedups + preserves order; drops unresolvable bases', () => {
    const rows = buildCompareRows(['D8s_v5', 'D8s_v5', 'nope'], 'Azure', catalog);
    expect(rows.map((r) => r.base.vmSizeName)).toEqual(['D8s_v5']);
  });

  it('returns "— none" (null analog) when the category is missing on a cloud', () => {
    // A memory-optimized Azure base with NO same-category candidate elsewhere.
    const cat2: CatalogEntry[] = [
      vm({ provider: 'Azure', vmSizeName: 'M32ms', vcpus: 32, memoryGib: 875, category: 'Memory Optimized' }),
      ...catalog.filter((v) => v.provider !== 'Azure'), // AWS/GCP are General Purpose only
    ];
    const specs = specsByProvider(cat2);
    const row = buildCompareRow('M32ms', 'Azure', specs);
    expect(row).not.toBeNull();
    expect(row!.analogs.AWS).toBeNull();
    expect(row!.analogs.GCP).toBeNull();
  });

  it('re-keys correctly when AWS is the base cloud', () => {
    const rows = buildCompareRows(['m5.4xlarge'], 'AWS', catalog);
    expect(rows).toHaveLength(1);
    expect(rows[0].analogs.Azure?.vm.vmSizeName).toBe('D16s_v5');
    expect(rows[0].analogs.GCP?.vm.vmSizeName).toBe('e2-standard-16');
  });
});

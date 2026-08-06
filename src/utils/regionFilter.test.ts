/**
 * v2.30 — Base-cloud-aware Region Availability filtering. The headline rule:
 * a base-cloud family/size chip must NOT zero out the other selected clouds —
 * they fall back to the equivalent category so the comparison stays multi-cloud.
 */
import { describe, it, expect } from 'vitest';
import { filterVmsByChips, impliedCategoriesFromChips } from './regionFilter';
import { vmFamily } from './vmTaxonomy';
import type { UserVm } from '../types';
import type { FilterChip } from '../components/RegionFilterChips';

const vm = (o: Partial<UserVm>): UserVm =>
  ({ vmSizeName: 'x', provider: 'Azure', vcpus: 4, memoryGib: 16, family: 'D', region: 'r', ...o } as UserVm);

// A tiny cross-cloud catalog: an Azure memory family (Msv3) + general family (Dsv5),
// plus AWS + GCP rows in both Memory Optimized and General Purpose.
const catalog: UserVm[] = [
  vm({ provider: 'Azure', vmSizeName: 'Standard_M32ms_v3', family: 'Msv3', category: 'Memory Optimized', region: 'eastus' }),
  vm({ provider: 'Azure', vmSizeName: 'Standard_D8s_v5', family: 'Dsv5', category: 'General Purpose', region: 'westus' }),
  vm({ provider: 'AWS', vmSizeName: 'r7i.xlarge', family: 'r7i', category: 'Memory Optimized', region: 'us-east-1' }),
  vm({ provider: 'AWS', vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', region: 'us-west-2' }),
  vm({ provider: 'GCP', vmSizeName: 'm3-ultramem-32', family: 'm3', category: 'Memory Optimized', region: 'us-central1' }),
  vm({ provider: 'GCP', vmSizeName: 'n2-standard-4', family: 'n2', category: 'General Purpose', region: 'europe-west1' }),
];
const ALL = new Set(['Azure', 'AWS', 'GCP'] as const);
const providersOf = (vms: UserVm[]) => new Set(vms.map((v) => v.provider));

describe('filterVmsByChips — base-cloud-aware', () => {
  it('no chips → every selected-provider VM', () => {
    expect(filterVmsByChips(catalog, ALL, 'Azure', []).length).toBe(6);
    expect(providersOf(filterVmsByChips(catalog, ALL, 'Azure', []))).toEqual(ALL);
  });

  it('a cross-cloud Category chip narrows EVERY provider', () => {
    const chips: FilterChip[] = [{ kind: 'category', value: 'Memory Optimized' }];
    const out = filterVmsByChips(catalog, ALL, 'Azure', chips);
    expect(out.every((v) => v.category === 'Memory Optimized')).toBe(true);
    expect(providersOf(out)).toEqual(ALL); // all three clouds still present
  });

  it('PER-CLOUD: a Family chip for ONLY one cloud narrows just that cloud (others have no analog chip)', () => {
    // v2.52.26 — precise-per-cloud: with only an Azure family chip, the other
    // clouds carry no chip of that kind, so they correctly drop (no category
    // fallback). The caller is expected to emit each competitor's analog chip too.
    const chips: FilterChip[] = [{ kind: 'family', value: vmFamily(catalog[0]), provider: 'Azure' }];
    const out = filterVmsByChips(catalog, ALL, 'Azure', chips);
    const az = out.filter((v) => v.provider === 'Azure');
    expect(az).toHaveLength(1);
    expect(az[0].family).toBe('Msv3');
    expect(providersOf(out)).toEqual(new Set(['Azure'])); // AWS + GCP drop
  });

  it('PER-CLOUD: one Family chip PER cloud narrows every cloud precisely to its own family', () => {
    const chips: FilterChip[] = [
      { kind: 'family', value: vmFamily(catalog[0]), provider: 'Azure' }, // Msv3
      { kind: 'family', value: vmFamily(catalog[2]), provider: 'AWS' }, // r7i
      { kind: 'family', value: vmFamily(catalog[4]), provider: 'GCP' }, // m3
    ];
    const out = filterVmsByChips(catalog, ALL, 'Azure', chips);
    expect(providersOf(out)).toEqual(ALL);
    // Each cloud is scoped to exactly its own picked family — all Memory Optimized here.
    expect(out.every((v) => v.category === 'Memory Optimized')).toBe(true);
    expect(out).toHaveLength(3);
    // A cloud whose chip names a General-Purpose family is scoped there instead.
    const mixed: FilterChip[] = [
      { kind: 'family', value: vmFamily(catalog[1]), provider: 'Azure' }, // Dsv5 (GP)
      { kind: 'family', value: vmFamily(catalog[2]), provider: 'AWS' }, // r7i (MO)
    ];
    const out2 = filterVmsByChips(catalog, ALL, 'Azure', mixed);
    expect(out2.filter((v) => v.provider === 'Azure').every((v) => v.category === 'General Purpose')).toBe(true);
    expect(out2.filter((v) => v.provider === 'AWS').every((v) => v.category === 'Memory Optimized')).toBe(true);
    expect(out2.some((v) => v.provider === 'GCP')).toBe(false); // GCP has no chip → drops
  });

  it('deselected providers never appear', () => {
    const picked = new Set(['Azure', 'AWS'] as const);
    const out = filterVmsByChips(catalog, picked, 'Azure', []);
    expect(out.some((v) => v.provider === 'GCP')).toBe(false);
  });

  it('PER-CLOUD: a size chip per cloud narrows each cloud to exactly that SKU', () => {
    const chips: FilterChip[] = [
      { kind: 'size', value: 'Standard_M32ms_v3', provider: 'Azure' },
      { kind: 'size', value: 'r7i.xlarge', provider: 'AWS' },
    ];
    const out = filterVmsByChips(catalog, ALL, 'Azure', chips);
    expect(out.map((v) => v.vmSizeName).sort()).toEqual(['Standard_M32ms_v3', 'r7i.xlarge']);
    expect(providersOf(out)).toEqual(new Set(['Azure', 'AWS'])); // GCP (no chip) drops
  });
});

describe('impliedCategoriesFromChips', () => {
  it('reads the category of a family chip from the catalog', () => {
    const cats = impliedCategoriesFromChips(catalog, [{ kind: 'family', value: vmFamily(catalog[0]), provider: 'Azure' }]);
    expect([...cats]).toEqual(['Memory Optimized']);
  });
  it('empty when only category chips (or none)', () => {
    expect(impliedCategoriesFromChips(catalog, []).size).toBe(0);
    expect(impliedCategoriesFromChips(catalog, [{ kind: 'category', value: 'General Purpose' }]).size).toBe(0);
  });
});

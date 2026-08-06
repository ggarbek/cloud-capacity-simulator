/**
 * Comparability caveat layer (Wave-1 A1). Positive + negative per kind, the
 * deterministic order, isStretch / worstCaveat, and the identical-pair empty case.
 */
import { describe, it, expect } from 'vitest';
import {
  matchCaveats,
  isStretch,
  worstCaveat,
  bareMetalFromName,
  STRETCH_MATCH_PCT,
  STRETCH_SIZE_RATIO,
  type MatchCaveat,
} from './matchCaveats';
import { vmFeatures, vmDistance } from './equivalence';
import type { CatalogEntry } from '../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({ vmSizeName: 'x', provider: 'AWS', vcpus: 4, memoryGib: 16, family: 'm', category: 'General Purpose', ...o } as CatalogEntry);

const kinds = (c: MatchCaveat[]) => c.map((x) => x.kind);
const d = (a: CatalogEntry, b: CatalogEntry) => vmDistance(vmFeatures(a), vmFeatures(b));

describe('bareMetalFromName', () => {
  it('detects AWS .metal, GCP -metal / x4, and negatives', () => {
    expect(bareMetalFromName('m5.metal')).toBe(true);
    expect(bareMetalFromName('c6i.metal-24xl')).toBe(true);
    expect(bareMetalFromName('c3-standard-192-metal')).toBe(true);
    expect(bareMetalFromName('x4-megamem-960-metal')).toBe(true);
    expect(bareMetalFromName('m5.large')).toBe(false);
    expect(bareMetalFromName('n2-standard-4')).toBe(false);
    expect(bareMetalFromName(undefined)).toBe(false);
  });
});

describe('matchCaveats — identical + clean pairs', () => {
  it('an identical pair returns no caveats', () => {
    const a = vm({ vmSizeName: 'm5.large', family: 'm5', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon 8259CL (Cascade Lake)' });
    expect(matchCaveats(a, a)).toEqual([]);
  });
  it('two standard same-arch same-gen GP sizes are clean', () => {
    const a = vm({ vmSizeName: 'm6i.large', family: 'm6i', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon 8375C (Ice Lake)' });
    const b = vm({ vmSizeName: 'm6i.xlarge', family: 'm6i', vcpus: 4, memoryGib: 16, processor: 'Intel Xeon 8375C (Ice Lake)' });
    expect(matchCaveats(a, b, { distance: d(a, b) })).toEqual([]);
  });
});

describe('matchCaveats — burstable-vs-standard', () => {
  const t3 = vm({ vmSizeName: 't3.large', family: 't3', vcpus: 2, memoryGib: 8 });
  const m5 = vm({ vmSizeName: 'm5.large', family: 'm5', vcpus: 2, memoryGib: 8 });
  it('flags a burstable ↔ standard pair (warn)', () => {
    const c = matchCaveats(t3, m5, { distance: d(t3, m5) });
    expect(kinds(c)).toContain('burstable-vs-standard');
    expect(c.find((x) => x.kind === 'burstable-vs-standard')?.severity).toBe('warn');
  });
  it('does NOT flag two standard sizes', () => {
    const m5b = vm({ vmSizeName: 'm5.xlarge', family: 'm5', vcpus: 4, memoryGib: 16 });
    expect(kinds(matchCaveats(m5, m5b, { distance: d(m5, m5b) }))).not.toContain('burstable-vs-standard');
  });
});

describe('matchCaveats — arch-cross', () => {
  it('flags arm ↔ x86 as a warn, intel ↔ amd as info', () => {
    const arm = vm({ vmSizeName: 'm7g.large', family: 'm7g', vcpus: 2, memoryGib: 8, processor: 'AWS Graviton3' });
    const intel = vm({ vmSizeName: 'm7i.large', family: 'm7i', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon 8488C (Sapphire Rapids)' });
    const amd = vm({ vmSizeName: 'm7a.large', family: 'm7a', vcpus: 2, memoryGib: 8, processor: 'AMD EPYC 9R14 (Genoa)' });
    expect(matchCaveats(arm, intel, { distance: d(arm, intel) }).find((x) => x.kind === 'arch-cross')?.severity).toBe('warn');
    expect(matchCaveats(intel, amd, { distance: d(intel, amd) }).find((x) => x.kind === 'arch-cross')?.severity).toBe('info');
  });
  it('does not flag same-arch', () => {
    const a = vm({ vmSizeName: 'm7i.large', family: 'm7i', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon 8488C (Sapphire Rapids)' });
    const b = vm({ vmSizeName: 'm7i.xlarge', family: 'm7i', vcpus: 4, memoryGib: 16, processor: 'Intel Xeon 8488C (Sapphire Rapids)' });
    expect(kinds(matchCaveats(a, b, { distance: d(a, b) }))).not.toContain('arch-cross');
  });
});

describe('matchCaveats — category-fallback + stretch + confidential', () => {
  it('flags a cross-category match via ctx.crossCategory', () => {
    const a = vm({ vmSizeName: 'm5.large', family: 'm5', vcpus: 2, memoryGib: 8 });
    const b = vm({ vmSizeName: 'r5.large', family: 'r5', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 });
    const c = matchCaveats(a, b, { crossCategory: true });
    expect(kinds(c)).toContain('category-fallback');
    expect(isStretch(c)).toBe(true);
  });
  it('flags a stretch on a ≥4x size ratio', () => {
    const small = vm({ vmSizeName: 'm5.large', family: 'm5', vcpus: 2, memoryGib: 8 });
    const big = vm({ vmSizeName: 'm5.8xlarge', family: 'm5', vcpus: 32, memoryGib: 128 });
    expect(32 / 2).toBeGreaterThanOrEqual(STRETCH_SIZE_RATIO);
    expect(kinds(matchCaveats(small, big, { distance: d(small, big) }))).toContain('stretch-size');
  });
  it('flags a stretch when matchPct is below the threshold', () => {
    const a = vm({ vmSizeName: 'm5.large', family: 'm5', vcpus: 2, memoryGib: 8 });
    const b = vm({ vmSizeName: 'm5.4xlarge', family: 'm5', vcpus: 16, memoryGib: 64 });
    // a weak distance (below STRETCH_MATCH_PCT) is enough on its own
    expect(kinds(matchCaveats(a, b, { distance: 2.5 }))).toContain('stretch-size');
    expect(STRETCH_MATCH_PCT).toBe(40);
  });
  it('flags a confidential base ↔ capable GP peer', () => {
    const dc = vm({ provider: 'Azure', vmSizeName: 'Standard_DC4as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 4, memoryGib: 16 });
    const m6a = vm({ provider: 'AWS', vmSizeName: 'm6a.xlarge', family: 'm6a', vcpus: 4, memoryGib: 16 });
    expect(kinds(matchCaveats(dc, m6a, { distance: d(dc, m6a) }))).toContain('confidential-feature-peer');
  });
});

describe('matchCaveats — gpu / storage / gen unknowns', () => {
  it('flags gpu-unknown when a GPU side lacks a curated spec', () => {
    const known = vm({ provider: 'AWS', vmSizeName: 'p5.48xlarge', family: 'p5', category: 'GPU', vcpus: 192, memoryGib: 2048, acceleratorType: '8 x H100' });
    const unknown = vm({ provider: 'Azure', vmSizeName: 'Standard_NG32ads_v6', family: 'NGads', category: 'GPU', vcpus: 32, memoryGib: 176, acceleratorType: '1 x GPU' });
    expect(kinds(matchCaveats(known, unknown, { distance: d(known, unknown) }))).toContain('gpu-unknown');
  });
  it('flags storage-disk-unknown for a diskless storage-optimized side', () => {
    const i = vm({ provider: 'AWS', vmSizeName: 'i4i.large', family: 'i4i', category: 'Storage Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 0 });
    const other = vm({ provider: 'GCP', vmSizeName: 'z3-highmem-8', family: 'z3', category: 'Storage Optimized', vcpus: 8, memoryGib: 64, localDiskGib: 3000 });
    expect(kinds(matchCaveats(i, other, { distance: d(i, other) }))).toContain('storage-disk-unknown');
  });
  it('flags gen-unknown when same arch but a gen is missing (info)', () => {
    // Azure D-series v3 = mixed gen (null), AWS carries a gen → same intel arch, one gen missing.
    const az = vm({ provider: 'Azure', vmSizeName: 'Standard_D4s_v3', family: 'Dsv3', vcpus: 4, memoryGib: 16 });
    const aws = vm({ provider: 'AWS', vmSizeName: 'm6i.xlarge', family: 'm6i', vcpus: 4, memoryGib: 16, processor: 'Intel Xeon 8375C (Ice Lake)' });
    const c = matchCaveats(az, aws, { distance: d(az, aws) });
    const gen = c.find((x) => x.kind === 'gen-unknown');
    expect(gen?.severity).toBe('info');
  });
});

describe('matchCaveats — bare-metal', () => {
  it('flags bare-metal ↔ virtualized', () => {
    const metal = vm({ vmSizeName: 'm5.metal', family: 'm5', vcpus: 96, memoryGib: 384 });
    const virt = vm({ vmSizeName: 'm5.24xlarge', family: 'm5', vcpus: 96, memoryGib: 384 });
    expect(kinds(matchCaveats(metal, virt, { distance: d(metal, virt) }))).toContain('bare-metal');
  });
});

describe('order + worstCaveat', () => {
  it('is deterministic — category-fallback precedes stretch precedes burstable', () => {
    // t3 (burstable GP) ↔ r5 (memory-opt, bigger) via cross-category fallback.
    const t3 = vm({ vmSizeName: 't3.large', family: 't3', vcpus: 2, memoryGib: 8 });
    const r5 = vm({ provider: 'AWS', vmSizeName: 'r5.4xlarge', family: 'r5', category: 'Memory Optimized', vcpus: 16, memoryGib: 128 });
    const c = matchCaveats(t3, r5, { crossCategory: true, distance: 2.0 });
    const order = kinds(c);
    expect(order.indexOf('category-fallback')).toBeLessThan(order.indexOf('stretch-size'));
    expect(order.indexOf('stretch-size')).toBeLessThan(order.indexOf('burstable-vs-standard'));
  });
  it('worstCaveat prefers warn over info, then canonical kind order', () => {
    const warnInfo: MatchCaveat[] = [
      { kind: 'gen-unknown', severity: 'info', label: 'a', detail: 'a' },
      { kind: 'burstable-vs-standard', severity: 'warn', label: 'b', detail: 'b' },
      { kind: 'category-fallback', severity: 'warn', label: 'c', detail: 'c' },
    ];
    expect(worstCaveat(warnInfo)?.kind).toBe('category-fallback'); // warn + earliest in order
    expect(worstCaveat([])).toBeNull();
  });
});

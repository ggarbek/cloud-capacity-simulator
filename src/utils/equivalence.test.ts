/**
 * v2.26.0 — Cross-cloud equivalency framework.
 * Region: country-first then proximity. VM: category gate + size/arch/mem-tier.
 */
import { describe, it, expect } from 'vitest';
import {
  cpuArch,
  archFromName,
  cpuGeneration,
  azureGenFromName,
  genFor,
  vmDistance,
  vmFeatures,
  bestVmMatch,
  bestRegionMatch,
  regionRefs,
  matchPct,
  describeMatch,
  CONFIDENTIAL_PEER_PENALTY,
} from './equivalence';
import { matchCategory } from './vmCategory';
import { regionGeo, haversineKm } from '../data/regionGeo';
import type { CatalogEntry } from '../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({ vmSizeName: 'x', provider: 'AWS', vcpus: 4, memoryGib: 16, family: 'm', ...o } as CatalogEntry);

describe('cpuArch', () => {
  it('classifies the three architectures', () => {
    expect(cpuArch('AWS Graviton4')).toBe('arm');
    expect(cpuArch('Ampere Altra')).toBe('arm');
    expect(cpuArch('AMD EPYC 9004 (Genoa)')).toBe('amd');
    expect(cpuArch('Intel Xeon Platinum 8488C (Sapphire Rapids)')).toBe('intel');
    expect(cpuArch('')).toBe('other');
  });
});

describe('archFromName — infer arch from SKU naming when processor is absent', () => {
  it('Azure p=Arm, a=AMD, else Intel', () => {
    expect(archFromName('Azure', 'Standard_D4ps_v5')).toBe('arm');
    expect(archFromName('Azure', 'Standard_D4as_v5')).toBe('amd');
    expect(archFromName('Azure', 'Standard_D4s_v5')).toBe('intel');
  });
  it('AWS g=Graviton, a=AMD, i/none=Intel', () => {
    expect(archFromName('AWS', 'm7g.xlarge')).toBe('arm');
    expect(archFromName('AWS', 'm7a.xlarge')).toBe('amd');
    expect(archFromName('AWS', 'm7i.xlarge')).toBe('intel');
    expect(archFromName('AWS', 'm5.large')).toBe('intel');
  });
  it('GCP a=Arm/Axion, d=AMD, else Intel', () => {
    expect(archFromName('GCP', 'c4a-standard-4')).toBe('arm');
    expect(archFromName('GCP', 't2a-standard-4')).toBe('arm');
    expect(archFromName('GCP', 'n2d-standard-4')).toBe('amd');
    expect(archFromName('GCP', 'n2-standard-4')).toBe('intel');
  });
});

describe('cpuGeneration — microarch from processor string', () => {
  it('reads explicit Intel microarch names', () => {
    expect(cpuGeneration('Intel Xeon Platinum 8488C (Sapphire Rapids)')?.label).toBe('Sapphire Rapids');
    expect(cpuGeneration('Cascade Lake/Ice Lake')?.label).toBe('Cascade Lake/Ice Lake');
  });
  it('parses Intel Xeon Scalable model numbers when no name is given', () => {
    expect(cpuGeneration('Intel Xeon Platinum 8175')?.label).toBe('Skylake');
    expect(cpuGeneration('Intel Xeon Platinum 8259CL')?.label).toBe('Cascade Lake');
    expect(cpuGeneration('Intel Xeon 8370C')?.label).toBe('Ice Lake');
  });
  it('reads AMD EPYC + ARM generations', () => {
    expect(cpuGeneration('AMD EPYC 9654 (Genoa)')?.label).toBe('Genoa');
    expect(cpuGeneration('AMD EPYC 7763')?.label).toBe('Milan');
    expect(cpuGeneration('AWS Graviton3')?.label).toBe('Graviton3');
  });
  it('returns null when no generation is readable (e.g. Azure live specs)', () => {
    expect(cpuGeneration('')).toBeNull();
    expect(cpuGeneration(undefined)).toBeNull();
  });
  it('only same-vendor generations widen the distance', () => {
    const base = vm({ category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500, processor: 'Intel Xeon Platinum 8175' }); // Skylake
    const ice = vm({ category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500, processor: 'Intel Xeon 8370' }); // Ice Lake
    const same = vm({ category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500, processor: 'Intel Xeon Platinum 8175' });
    expect(vmDistance(vmFeatures(base), vmFeatures(same))).toBe(0);
    expect(vmDistance(vmFeatures(base), vmFeatures(ice))).toBeGreaterThan(0);
  });
});

describe('azureGenFromName — infer microarch from the Azure SKU name', () => {
  it('Intel mainstream by version (v4 Cascade Lake, v5 Ice Lake, v6 Emerald Rapids)', () => {
    expect(azureGenFromName('Standard_D4s_v4')).toMatchObject({ label: 'Cascade Lake', vendor: 'intel' });
    expect(azureGenFromName('Standard_D4s_v5')).toMatchObject({ label: 'Ice Lake', vendor: 'intel' });
    expect(azureGenFromName('Standard_E8s_v6')).toMatchObject({ label: 'Emerald Rapids', vendor: 'intel' });
    expect(azureGenFromName('Standard_D4_v2')).toMatchObject({ label: 'Haswell/Broadwell', vendor: 'intel' });
  });
  it('AMD track (a-feature): v4 Rome, v5 Milan, v6 Genoa', () => {
    expect(azureGenFromName('Standard_D4as_v4')).toMatchObject({ label: 'Rome', vendor: 'amd' });
    expect(azureGenFromName('Standard_E16as_v5')).toMatchObject({ label: 'Milan', vendor: 'amd' });
    expect(azureGenFromName('Standard_D8as_v6')).toMatchObject({ label: 'Genoa', vendor: 'amd' });
  });
  it('Arm track (p-feature): v5 Ampere Altra, v6 Cobalt', () => {
    expect(azureGenFromName('Standard_D4ps_v5')).toMatchObject({ label: 'Ampere Altra', vendor: 'arm' });
    expect(azureGenFromName('Standard_D8ps_v6')).toMatchObject({ label: 'Cobalt 100', vendor: 'arm' });
  });
  it('series-specific: M-series v3 = Sapphire Rapids, F-series v2 = Skylake/Cascade', () => {
    expect(azureGenFromName('Standard_M96s_2_v3')).toMatchObject({ label: 'Sapphire Rapids', vendor: 'intel' });
    expect(azureGenFromName('Standard_M128ms_v2')).toMatchObject({ label: 'Skylake', vendor: 'intel' });
    expect(azureGenFromName('Standard_F8s_v2')).toMatchObject({ label: 'Skylake/Cascade Lake', vendor: 'intel' });
  });
  it('returns null when too mixed to pin (v3 mainstream Intel, original M/F) or non-Azure form', () => {
    expect(azureGenFromName('Standard_D4s_v3')).toBeNull(); // Broadwell→Ice Lake span
    expect(azureGenFromName('Standard_M128ms')).toBeNull(); // original M-series
    expect(azureGenFromName('m7i.xlarge')).toBeNull(); // not an Azure SKU name
    expect(azureGenFromName(undefined)).toBeNull();
  });
  it('ranks align with cpuGeneration so Azure compares apples-to-apples cross-cloud', () => {
    // Azure Dsv5 (Ice Lake, inferred) should rank == an AWS Ice Lake from its processor string.
    expect(azureGenFromName('Standard_D8s_v5')!.rank).toBe(cpuGeneration('Intel Xeon 8370C (Ice Lake)')!.rank);
    // Azure Dasv5 (Milan) == AWS/GCP EPYC 7763 Milan.
    expect(azureGenFromName('Standard_D8as_v5')!.rank).toBe(cpuGeneration('AMD EPYC 7763')!.rank);
  });
});

describe('genFor — processor string first, Azure SKU-name fallback', () => {
  it('prefers the processor string when present', () => {
    expect(genFor({ provider: 'AWS', vmSizeName: 'm6i.large', processor: 'Intel Xeon 8375C (Ice Lake)' })?.label).toBe('Ice Lake');
  });
  it('falls back to the Azure name when the processor is absent', () => {
    expect(genFor({ provider: 'Azure', vmSizeName: 'Standard_M96s_2_v3', processor: undefined })?.label).toBe('Sapphire Rapids');
    expect(genFor({ provider: 'Azure', vmSizeName: 'Standard_D8s_v5', processor: '' })?.label).toBe('Ice Lake');
  });
  it('does not fabricate for AWS/GCP rows that lack a processor', () => {
    expect(genFor({ provider: 'AWS', vmSizeName: 'm5.large', processor: undefined })).toBeNull();
  });
  it('makes Azure-base distance gen-aware (Dsv5 closer to Ice Lake than to Cascade Lake)', () => {
    const azBase = vm({ provider: 'Azure', vmSizeName: 'Standard_D16s_v5', category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500 }); // Ice Lake (inferred, no processor string)
    const awsIce = vm({ provider: 'AWS', vmSizeName: 'm6i.4xlarge', category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500, processor: 'Intel Xeon 8375C (Ice Lake)' });
    const awsCascade = vm({ provider: 'AWS', vmSizeName: 'm5.4xlarge', category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500, processor: 'Intel Xeon Platinum 8259CL (Cascade Lake)' });
    const f = vmFeatures(azBase);
    expect(vmDistance(f, vmFeatures(awsIce))).toBeLessThan(vmDistance(f, vmFeatures(awsCascade)));
  });
});

describe('vmDistance — category is a hard gate', () => {
  const mem = vm({ category: 'Memory Optimized', vcpus: 16, memoryGib: 128 });
  const cpu = vm({ category: 'Compute Optimized', vcpus: 16, memoryGib: 32 });
  it('refuses cross-category matches', () => {
    expect(vmDistance(vmFeatures(mem), vmFeatures(cpu))).toBe(Infinity);
  });
  it('zero distance for identical specs in the same category', () => {
    expect(vmDistance(vmFeatures(mem), vmFeatures(mem))).toBe(0);
  });
  it('prefers the same memory-per-vCPU tier (highmem vs standard)', () => {
    const srcHighmem = vm({ category: 'General Purpose', vcpus: 8, memoryGib: 64 }); // 8 GiB/vCPU
    const candHighmem = vm({ category: 'General Purpose', vcpus: 8, memoryGib: 64 });
    const candStandard = vm({ category: 'General Purpose', vcpus: 8, memoryGib: 32 }); // 4 GiB/vCPU
    const f = vmFeatures(srcHighmem);
    expect(vmDistance(f, vmFeatures(candHighmem))).toBeLessThan(
      vmDistance(f, vmFeatures(candStandard)),
    );
  });
  it('proportional: 4↔8 vCPU ≈ 64↔128 vCPU penalty', () => {
    const small = vmDistance(
      vmFeatures(vm({ category: 'General Purpose', vcpus: 4, memoryGib: 16 })),
      vmFeatures(vm({ category: 'General Purpose', vcpus: 8, memoryGib: 32 })),
    );
    const big = vmDistance(
      vmFeatures(vm({ category: 'General Purpose', vcpus: 64, memoryGib: 256 })),
      vmFeatures(vm({ category: 'General Purpose', vcpus: 128, memoryGib: 512 })),
    );
    expect(Math.abs(small - big)).toBeLessThan(1e-9);
  });
});

describe('bestVmMatch', () => {
  it('picks the nearest same-category size', () => {
    const src = vm({ provider: 'Azure', category: 'Memory Optimized', vcpus: 16, memoryGib: 128, processor: 'Intel Xeon' });
    const cands = [
      vm({ provider: 'AWS', vmSizeName: 'r7i.4xlarge', category: 'Memory Optimized', vcpus: 16, memoryGib: 128, processor: 'Intel Xeon' }),
      vm({ provider: 'AWS', vmSizeName: 'r7i.8xlarge', category: 'Memory Optimized', vcpus: 32, memoryGib: 256, processor: 'Intel Xeon' }),
      vm({ provider: 'AWS', vmSizeName: 'c7i.4xlarge', category: 'Compute Optimized', vcpus: 16, memoryGib: 32, processor: 'Intel Xeon' }),
    ];
    const m = bestVmMatch(src, cands);
    expect(m?.vm.vmSizeName).toBe('r7i.4xlarge');
    expect(m?.quality).toBe('exact');
  });
  it('returns null when no same-category candidate exists', () => {
    const src = vm({ category: 'GPU', vcpus: 8, memoryGib: 32 });
    const cands = [vm({ category: 'General Purpose', vcpus: 8, memoryGib: 32 })];
    expect(bestVmMatch(src, cands)).toBeNull();
  });
});

describe('regionGeo', () => {
  it('maps core regions across clouds', () => {
    expect(regionGeo('Azure', 'East US 2')?.cc).toBe('US');
    expect(regionGeo('AWS', 'eu-central-1')?.city).toBe('Frankfurt');
    expect(regionGeo('GCP', 'europe-west8')?.city).toBe('Milan');
  });
  it('flags AWS edge zones, inheriting parent country', () => {
    const z = regionGeo('AWS', 'us-west-2-lax-1');
    expect(z?.cc).toBe('US');
    expect(z?.edge).toBe(true);
  });
  it('special-cases foreign edge metros', () => {
    expect(regionGeo('AWS', 'eu-central-1-ist-1')?.cc).toBe('TR'); // Istanbul, not Frankfurt
  });
});

describe('bestRegionMatch — country first, then distance', () => {
  it('prefers same country even if another region is physically closer', () => {
    // Source: Azure Canada Central (Toronto). AWS has ca-central-1 (Montreal, CA)
    // and us-east-1 (Virginia, US, closer to some CA metros than others).
    const src = regionRefs('Azure', ['Canada Central'])[0];
    const cands = regionRefs('AWS', ['ca-central-1', 'us-east-1', 'us-east-2']);
    const m = bestRegionMatch(src, cands);
    expect(m?.region).toBe('ca-central-1');
    expect(m?.sameCountry).toBe(true);
  });
  it('falls back to nearest cross-border when no same-country region exists', () => {
    // Azure Qatar Central → AWS has no Qatar region; nearest is Bahrain/UAE.
    const src = regionRefs('Azure', ['Qatar Central'])[0];
    const cands = regionRefs('AWS', ['me-south-1', 'me-central-1', 'eu-west-1']);
    const m = bestRegionMatch(src, cands);
    expect(m?.sameCountry).toBe(false);
    expect(['me-south-1', 'me-central-1']).toContain(m?.region); // Bahrain or UAE, not Ireland
  });
  it('gov regions only match gov regions', () => {
    const src = regionRefs('Azure', ['US Gov Virginia'])[0];
    const cands = regionRefs('AWS', ['us-east-1', 'us-gov-east-1']);
    expect(bestRegionMatch(src, cands)?.region).toBe('us-gov-east-1');
  });
  it('haversine sanity: London↔Paris ~340km', () => {
    const km = haversineKm(regionGeo('AWS', 'eu-west-2')!, regionGeo('AWS', 'eu-west-3')!);
    expect(km).toBeGreaterThan(300);
    expect(km).toBeLessThan(400);
  });

  it('matchPct: identical=100, monotone-decreasing, bounded, Infinity=0', () => {
    // v2.42 — matchPct now takes a NORMALIZED distance (≈0–1.5) and decays
    // exponentially: 100·exp(−k·d). Anchors live on that scale.
    expect(matchPct(0)).toBe(100);
    expect(matchPct(Infinity)).toBe(0);
    expect(matchPct(0.1)).toBeGreaterThan(matchPct(0.4)); // exact band > close band
    expect(matchPct(0.4)).toBeGreaterThan(matchPct(1.0)); // close > loose
    expect(matchPct(50)).toBeGreaterThanOrEqual(1); // floored, never 0 for finite
    expect(matchPct(0.1)).toBeGreaterThanOrEqual(85); // exact band reads high
  });
});

describe('matchPct calibration (v2.42 normalized exponential decay)', () => {
  const f = (o: Partial<CatalogEntry>) => vmFeatures(vm(o));

  it('identical spec → 100%', () => {
    const a = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64, processor: 'Intel Xeon 8370C' });
    expect(matchPct(vmDistance(a, a))).toBe(100);
  });

  it('one size step (2× vCPU+mem, same shape) reads ~40% — NOT collapsed to single digits', () => {
    // The headline fix: under the old linear 100−22d this pair read ~8%, which
    // dragged every family/category rollup toward zero. It must now read as a
    // recognizable, mid-range similarity.
    const small = f({ category: 'General Purpose', vcpus: 8, memoryGib: 32 });
    const big = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64 });
    const pct = matchPct(vmDistance(small, big));
    expect(pct).toBeGreaterThan(30);
    expect(pct).toBeLessThan(55);
  });

  it('cross-arch only (same size, Intel vs AMD) stays high (~85%+)', () => {
    const intel = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64, processor: 'Intel Xeon 8370C' });
    const amd = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64, processor: 'AMD EPYC 7763' });
    const pct = matchPct(vmDistance(intel, amd));
    expect(pct).toBeGreaterThanOrEqual(80);
    expect(pct).toBeLessThan(100);
  });

  it('GPU distance is SYMMETRIC (the old |Δ|/max(1,aGpu) form was direction-dependent)', () => {
    const a = f({ category: 'GPU', vcpus: 8, memoryGib: 32, acceleratorType: '1 x A100' });
    const b = f({ category: 'GPU', vcpus: 64, memoryGib: 512, acceleratorType: '8 x A100' });
    expect(vmDistance(a, b)).toBeCloseTo(vmDistance(b, a), 9);
  });

  it('missing optional data (network) swings similarity only modestly — provider-comparability', () => {
    // Azure live specs carry no network value; the score must not lurch just
    // because one side lacks an optional dimension. Normalizing by active
    // weight bounds the swing.
    const withNet = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 12500 });
    const noNet = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64 });
    const other = f({ category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 25000 });
    const a = matchPct(vmDistance(withNet, other)); // both have net → term fires
    const b = matchPct(vmDistance(noNet, other)); // one lacks net → term skipped
    expect(Math.abs(a - b)).toBeLessThanOrEqual(20);
  });

  it('dormant cross-category penalty: gated to Infinity by default, finite when opted in', () => {
    const mem = f({ category: 'Memory Optimized', vcpus: 16, memoryGib: 128 });
    const cpu = f({ category: 'Compute Optimized', vcpus: 16, memoryGib: 128 });
    expect(vmDistance(mem, cpu)).toBe(Infinity); // live behavior unchanged
    expect(Number.isFinite(vmDistance(mem, cpu, { crossCategoryPenalty: 0.5 }))).toBe(true);
  });
});

describe('cross-product-group penalty (v2.43)', () => {
  it('penalizes Memory↔GPU (different product group) more than Memory↔Storage (same group)', () => {
    const mem = vmFeatures(vm({ category: 'Memory Optimized', vcpus: 8, memoryGib: 64 }));
    const gpu = vmFeatures(vm({ category: 'GPU', vcpus: 8, memoryGib: 64 }));
    const storage = vmFeatures(vm({ category: 'Storage Optimized', vcpus: 8, memoryGib: 64 }));
    const opts = { crossCategoryPenalty: 0.25 };
    const dGpu = vmDistance(mem, gpu, opts);
    const dStorage = vmDistance(mem, storage, opts);
    expect(Number.isFinite(dGpu)).toBe(true);
    expect(Number.isFinite(dStorage)).toBe(true);
    // A fundamentally-different machine (GPU) is a worse match than a same-group
    // cross-category one (Storage), even when the size specs are identical.
    expect(dGpu).toBeGreaterThan(dStorage);
    // The hard gate still holds with no penalty opt (locked behavior).
    expect(vmDistance(mem, gpu)).toBe(Infinity);
  });
});

// ── GCP highmem ↔ memory-optimized matching equivalence (Option 2, v2.43.7) ──
describe('matchCategory — GCP -highmem counts as Memory Optimized for MATCHING', () => {
  it('upgrades a GCP -highmem size, leaves everything else alone', () => {
    expect(
      matchCategory({ provider: 'GCP', family: 'n2', vmSizeName: 'n2-highmem-2', category: 'General Purpose' }),
    ).toBe('Memory Optimized');
    // non-highmem GCP unchanged
    expect(
      matchCategory({ provider: 'GCP', family: 'n2', vmSizeName: 'n2-standard-2', category: 'General Purpose' }),
    ).toBe('General Purpose');
    // Azure / AWS never affected (no -highmem naming)
    expect(
      matchCategory({ provider: 'Azure', vmSizeName: 'Standard_E2_v3', category: 'Memory Optimized' }),
    ).toBe('Memory Optimized');
    expect(
      matchCategory({ provider: 'AWS', vmSizeName: 'r5.large', category: 'Memory Optimized' }),
    ).toBe('Memory Optimized');
  });

  it('lets a small Azure E ↔ GCP n2-highmem match near-100% (gate no longer blocks)', () => {
    const e2 = vm({ provider: 'Azure', vmSizeName: 'Standard_E2_v3', family: 'E', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 });
    const n2hm = vm({ provider: 'GCP', vmSizeName: 'n2-highmem-2', family: 'n2', category: 'General Purpose', vcpus: 2, memoryGib: 16 });
    const d = vmDistance(vmFeatures(e2), vmFeatures(n2hm));
    expect(Number.isFinite(d)).toBe(true);
    expect(matchPct(d)).toBeGreaterThanOrEqual(95);
    // matching-only: the DISPLAY category is preserved
    expect(vmFeatures(n2hm).displayCategory).toBe('General Purpose');
    expect(vmFeatures(n2hm).category).toBe('Memory Optimized');
  });

  it('does NOT pull a GCP standard (non-highmem) GP size into memory-optimized', () => {
    const e2 = vmFeatures(vm({ provider: 'Azure', vmSizeName: 'Standard_E2_v3', category: 'Memory Optimized', vcpus: 2, memoryGib: 16 }));
    const n2std = vmFeatures(vm({ provider: 'GCP', vmSizeName: 'n2-standard-2', category: 'General Purpose', vcpus: 2, memoryGib: 8 }));
    expect(vmDistance(e2, n2std)).toBe(Infinity); // still gated
  });
});

describe('local-disk dimension — Storage Optimized fingerprint (#141)', () => {
  const storage = (o: Partial<CatalogEntry>) =>
    vm({ category: 'Storage Optimized', vcpus: 16, memoryGib: 128, ...o });

  it('a storage VM matches the candidate with the closer local disk, not just vCPU/RAM', () => {
    // Same vCPU/RAM on both candidates; only the local NVMe differs.
    const src = storage({ provider: 'AWS', vmSizeName: 'i7ie.4xlarge', family: 'i7ie', localDiskGib: 30000 });
    const near = storage({ provider: 'Azure', vmSizeName: 'L-near', family: 'Lsv3', localDiskGib: 30720 });
    const far = storage({ provider: 'Azure', vmSizeName: 'L-far', family: 'Lsv3', localDiskGib: 1920 });
    const dNear = vmDistance(vmFeatures(src), vmFeatures(near));
    const dFar = vmDistance(vmFeatures(src), vmFeatures(far));
    expect(dNear).toBeLessThan(dFar);
    expect(matchPct(dNear)).toBeGreaterThan(matchPct(dFar));
    // bestVmMatch should therefore prefer the disk-aligned candidate.
    expect(bestVmMatch(src, [far, near])?.vm.vmSizeName).toBe('L-near');
  });

  it('local storage surfaces as a driver when it is the differentiator', () => {
    const a = vmFeatures(storage({ provider: 'AWS', vmSizeName: 'i7ie', family: 'i7ie', localDiskGib: 30000 }));
    const b = vmFeatures(storage({ provider: 'Azure', vmSizeName: 'Lsv3', family: 'Lsv3', localDiskGib: 1920 }));
    expect(describeMatch(a, b).toLowerCase()).toMatch(/local storage/);
  });

  it('the disk term is INERT outside Storage Optimized (general-purpose unaffected)', () => {
    // Two otherwise-identical GP sizes differing only in local disk: the disk
    // term must not fire, so they stay an effectively perfect match.
    const a = vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm7i.4xlarge', family: 'm7i', category: 'General Purpose', vcpus: 16, memoryGib: 64, localDiskGib: 0 }));
    const b = vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm7i.4xlarge', family: 'm7i', category: 'General Purpose', vcpus: 16, memoryGib: 64, localDiskGib: 900 }));
    expect(vmDistance(a, b)).toBeCloseTo(0, 6);
    expect(matchPct(vmDistance(a, b))).toBe(100);
  });
});

describe('GPU defining traits — model / VRAM / interconnect (#141)', () => {
  const gpu = (o: Partial<CatalogEntry>) =>
    vmFeatures(vm({ category: 'GPU', vcpus: 96, memoryGib: 680, ...o }));
  // Same host size + same GPU count — isolates the GPU MODEL/VRAM/link effect.
  const h100 = gpu({ provider: 'GCP', family: 'a3', vmSizeName: 'a3-highgpu-8g', acceleratorType: '8 x H100' });
  const l4 = gpu({ provider: 'GCP', family: 'g2', vmSizeName: 'g2-standard-96', acceleratorType: '8 x L4' });
  const h200 = gpu({ provider: 'GCP', family: 'a3', vmSizeName: 'a3-ultragpu-8g', acceleratorType: '8 x H200' });

  it('THE FIX: an 8×H100 no longer reads identical to an 8×L4 (was ~100%, GPU model now dominates)', () => {
    const p = matchPct(vmDistance(h100, l4));
    expect(p).toBeLessThan(55); // was ~100% pre-#141 (count + size identical)
    expect(p).toBeGreaterThan(10);
    expect(describeMatch(h100, l4).toLowerCase()).toMatch(/gpu model/);
  });

  it('H100 vs H200 reads CLOSER than H100 vs L4 (a half-step, not a class jump)', () => {
    expect(matchPct(vmDistance(h100, h200))).toBeGreaterThan(matchPct(vmDistance(h100, l4)));
    expect(matchPct(vmDistance(h100, h200))).toBeLessThan(100);
  });

  it('A100-40 vs A100-80 (same host size, via the a2-ultragpu VRAM override) stays a close match', () => {
    const a40 = gpu({ provider: 'GCP', family: 'a2', vmSizeName: 'a2-highgpu-8g', acceleratorType: '8 x A100' });
    const a80 = gpu({ provider: 'GCP', family: 'a2', vmSizeName: 'a2-ultragpu-8g', acceleratorType: '8 x A100' });
    expect(matchPct(vmDistance(a40, a80))).toBeGreaterThan(65);
  });

  it('the SAME GPU across clouds stays a strong match (p5 H100 ↔ a3 H100)', () => {
    const p5 = gpu({ provider: 'AWS', family: 'p5', vmSizeName: 'p5.48xlarge', vcpus: 192, memoryGib: 2048, acceleratorType: '8 x H100' });
    const a3 = gpu({ provider: 'GCP', family: 'a3', vmSizeName: 'a3-highgpu-8g', vcpus: 208, memoryGib: 1872, acceleratorType: '8 x H100' });
    expect(matchPct(vmDistance(p5, a3))).toBeGreaterThanOrEqual(85);
  });

  it('the new GPU terms are SYMMETRIC', () => {
    expect(vmDistance(h100, l4)).toBeCloseTo(vmDistance(l4, h100), 9);
  });

  it('INERT for an unknown GPU family (degrades to count-only, no fabrication)', () => {
    // Neither family is in GPU_SPECS → model/vram/link terms never fire → two
    // same-count/same-size GPU VMs stay a near-perfect match (count-only).
    const a = gpu({ provider: 'AWS', family: 'zzgpu', acceleratorType: '8 x Unknown' });
    const b = gpu({ provider: 'GCP', family: 'qqgpu', acceleratorType: '8 x Unknown' });
    expect(matchPct(vmDistance(a, b))).toBe(100);
  });
});

describe('confidential / TEE kind — minor within-category refinement (#141)', () => {
  const conf = (o: Partial<CatalogEntry>) =>
    vmFeatures(vm({ category: 'Confidential', vcpus: 8, memoryGib: 32, processor: 'AMD EPYC 7763', ...o }));

  it('same TEE kind (both SEV-SNP) → no penalty', () => {
    const dcas = conf({ provider: 'Azure', family: 'DCasv5', vmSizeName: 'Standard_DC8as_v5' });
    const dcads = conf({ provider: 'Azure', family: 'DCadsv5', vmSizeName: 'Standard_DC8ads_v5' });
    expect(matchPct(vmDistance(dcas, dcads))).toBe(100);
  });

  it('different TEE kind (SEV-SNP vs TDX) fires the TEE term, even with arch held equal', () => {
    // Same processor on both isolates the TEE term from the arch term.
    const sev = conf({ provider: 'Azure', family: 'DCasv5', vmSizeName: 'Standard_DC8as_v5' });
    const tdx = conf({ provider: 'Azure', family: 'DCesv5', vmSizeName: 'Standard_DC8es_v5' });
    expect(matchPct(vmDistance(sev, tdx))).toBeLessThan(100);
    expect(describeMatch(sev, tdx).toLowerCase()).toMatch(/confidential|tee/);
  });

  it('INERT on the non-confidential catalog (two plain GP VMs unaffected)', () => {
    const a = vmFeatures(vm({ provider: 'AWS', family: 'm7i', category: 'General Purpose', vcpus: 16, memoryGib: 64, processor: 'Intel Xeon 8488C' }));
    const b = vmFeatures(vm({ provider: 'AWS', family: 'm7i', category: 'General Purpose', vcpus: 16, memoryGib: 64, processor: 'Intel Xeon 8488C' }));
    expect(matchPct(vmDistance(a, b))).toBe(100);
  });
});

// ── A1 (Wave-1): burstable trait + confidential-capability channel + gen min ──
describe('A1 — burstable service-model term', () => {
  it('PINS t3.large ↔ m5.large: clearly below 100 (burst differs) but a strong shape match', () => {
    const t3 = vm({ provider: 'AWS', vmSizeName: 't3.large', family: 't3', category: 'General Purpose', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon Platinum 8259CL (Cascade Lake)' });
    const m5 = vm({ provider: 'AWS', vmSizeName: 'm5.large', family: 'm5', category: 'General Purpose', vcpus: 2, memoryGib: 8, processor: 'Intel Xeon Platinum 8259CL (Cascade Lake)' });
    const pct = matchPct(vmDistance(vmFeatures(t3), vmFeatures(m5)));
    expect(pct).toBe(92); // pinned — burst term the only differentiator, same shape/arch/gen
    expect(pct).toBeLessThan(100);
    expect(pct).toBeGreaterThan(85);
  });

  it('t3.large ↔ same-shape Azure B-series (both burstable) scores HIGHER than t3.large ↔ m5.large', () => {
    // No processor cross-cloud (Azure carries none) so the gen term stays out of both.
    const t3 = vm({ provider: 'AWS', vmSizeName: 't3.large', family: 't3', category: 'General Purpose', vcpus: 2, memoryGib: 8 });
    const azB = vm({ provider: 'Azure', vmSizeName: 'Standard_B2s_v2', family: 'bsv2', category: 'General Purpose', vcpus: 2, memoryGib: 8 });
    const m5 = vm({ provider: 'AWS', vmSizeName: 'm5.large', family: 'm5', category: 'General Purpose', vcpus: 2, memoryGib: 8 });
    const burstPair = vmDistance(vmFeatures(t3), vmFeatures(azB));
    const stdPair = vmDistance(vmFeatures(t3), vmFeatures(m5));
    expect(matchPct(burstPair)).toBeGreaterThan(matchPct(stdPair));
    expect(matchPct(burstPair)).toBe(100); // identical shape, both burstable → term is 0
  });

  it('RE-ASSERTS an existing non-burstable anchor VERBATIM (zero-drift proof)', () => {
    // Same as the arch-only anchor: an intel↔amd same-size pair reads 80–99%.
    const intel = vmFeatures(vm({ vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'Intel Xeon 8488C (Sapphire Rapids)' }));
    const amd = vmFeatures(vm({ vmSizeName: 'm7a.xlarge', family: 'm7a', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'AMD EPYC 9R14 (Genoa)' }));
    const pct = matchPct(vmDistance(intel, amd));
    expect(pct).toBeGreaterThanOrEqual(80);
    expect(pct).toBeLessThan(100);
  });
});

describe('A1 — confidential capability channel', () => {
  it('m6a carries a TEE capability in features but m6a ↔ m7a GP distance is UNCHANGED (gate holds)', () => {
    const m6a = vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm6a.xlarge', family: 'm6a', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'AMD EPYC 7R13 (Milan)' }));
    const m7a = vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm7a.xlarge', family: 'm7a', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'AMD EPYC 9R14 (Genoa)' }));
    expect(m6a.tee).not.toBeNull(); // opt-in SEV-SNP capability now visible
    expect(m6a.tee?.optIn).toBe(true);
    // But the tee distance term is gated to the Confidential category → inert here.
    const withCap = vmDistance(m6a, m7a);
    const noCap = vmDistance(
      vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'AMD EPYC 7R13 (Milan)' })),
      m7a,
    );
    // Both differ only on CPU gen (Milan vs Genoa) — the tee capability adds nothing.
    expect(withCap).toBeCloseTo(noCap, 9);
  });

  it('Confidential base × capable GP peer is FINITE and bounded by CONFIDENTIAL_PEER_PENALTY', () => {
    // With a small crossCategoryPenalty (the caller uses the peer penalty), a
    // confidential base can reach a capable GP peer at a finite, non-trivial score.
    const dc = vmFeatures(vm({ provider: 'Azure', vmSizeName: 'Standard_DC4as_v5', family: 'DCasv5', category: 'Confidential', vcpus: 4, memoryGib: 16 }));
    const m6a = vmFeatures(vm({ provider: 'AWS', vmSizeName: 'm6a.xlarge', family: 'm6a', category: 'General Purpose', vcpus: 4, memoryGib: 16, processor: 'AMD EPYC 7R13 (Milan)' }));
    expect(CONFIDENTIAL_PEER_PENALTY).toBe(0.1);
    const d = vmDistance(dc, m6a, { crossCategoryPenalty: CONFIDENTIAL_PEER_PENALTY });
    expect(isFinite(d)).toBe(true);
    expect(matchPct(d)).toBeGreaterThan(1);
  });
});

describe('A1 — conservative gen rank (min of matched, not average)', () => {
  it('a two-gen processor string takes the MIN rank', () => {
    expect(cpuGeneration('Intel Xeon (Cascade Lake/Ice Lake)')!.rank).toBe(4); // Cascade Lake=4, not 4.5
    expect(cpuGeneration('Intel Xeon (Skylake/Broadwell)')!.rank).toBe(2); // Broadwell=2, not 2.5
  });
  it('Azure Fsv2 span aligns to the MIN (Skylake=3)', () => {
    expect(azureGenFromName('Standard_F8s_v2')!.rank).toBe(3); // was 3.5
  });
});

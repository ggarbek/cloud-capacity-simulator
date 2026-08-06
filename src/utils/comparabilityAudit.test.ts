/**
 * Comparability audit (Wave-1 A1). Synthetic fixtures per bucket + a drift-guard
 * that pins the uncovered-GPU-family allowlist so a NEW uncovered family fails loud.
 */
import { describe, it, expect } from 'vitest';
import { auditComparability } from './comparabilityAudit';
import type { CatalogEntry } from '../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({ vmSizeName: 'x', provider: 'AWS', vcpus: 4, memoryGib: 16, family: 'm', localDiskGib: 0, ...o } as CatalogEntry);

const fixtures: CatalogEntry[] = [
  // Storage-Optimized with NO local disk → storageNoDisk.
  vm({ provider: 'AWS', vmSizeName: 'i4i.large', family: 'i4i', category: 'Storage Optimized', localDiskGib: 0 }),
  // Storage-Optimized WITH a disk → not flagged.
  vm({ provider: 'GCP', vmSizeName: 'z3-highmem-8', family: 'z3', category: 'Storage Optimized', localDiskGib: 3000 }),
  // GPU with a curated spec (p5=H100) → covered.
  vm({ provider: 'AWS', vmSizeName: 'p5.48xlarge', family: 'p5', category: 'GPU', acceleratorType: '8 x H100' }),
  // GPU families with NO curated spec → gpuNoSpec (g4, a4x are uncovered tokens).
  vm({ provider: 'GCP', vmSizeName: 'g4-standard-48', family: 'g4', category: 'GPU', acceleratorType: '1 x GPU' }),
  vm({ provider: 'GCP', vmSizeName: 'a4x-highgpu-8g', family: 'a4x', category: 'GPU', acceleratorType: '8 x GPU' }),
  // Confidential with a curated TEE spec (DCasv5=SEV-SNP) → covered.
  vm({ provider: 'Azure', vmSizeName: 'Standard_DC8as_v5', family: 'DCasv5', category: 'Confidential' }),
  // Confidential with NO curated TEE spec → teeNoSpec.
  vm({ provider: 'Azure', vmSizeName: 'Standard_ZZ8xs_v5', family: 'ZZxs', category: 'Confidential' }),
  // HPC on ONE cloud only → hpcNoPeer.
  vm({ provider: 'Azure', vmSizeName: 'Standard_HB176rs_v4', family: 'HBv4', category: 'High Performance Computing' }),
  // Bare-metal size → bareMetalSizes.
  vm({ provider: 'AWS', vmSizeName: 'm5.metal', family: 'm5', category: 'General Purpose' }),
  // Burstable families → burstableFamilies.
  vm({ provider: 'AWS', vmSizeName: 't3.large', family: 't3', category: 'General Purpose' }),
  vm({ provider: 'GCP', vmSizeName: 'e2-micro', family: 'e2', category: 'General Purpose' }),
];

describe('auditComparability', () => {
  const report = auditComparability(fixtures);

  it('flags storage-optimized sizes with no local disk (and only those)', () => {
    const tokens = report.storageNoDisk.map((s) => s.family);
    expect(tokens).toContain('i4i');
    expect(tokens).not.toContain('z3'); // z3 has a disk
  });

  it('DRIFT GUARD: gpuNoSpec is exactly the uncovered allowlist [a4x, g4]', () => {
    const uncovered = report.gpuNoSpec.map((g) => g.token).sort();
    // If a NEW GPU family ships without a curated spec, this pin fails loudly.
    expect(uncovered).toEqual(['a4x', 'g4']);
  });

  it('flags confidential families with no curated TEE spec', () => {
    expect(report.teeNoSpec.map((g) => g.token)).toContain('zzxs');
  });

  it('flags HPC + burstable + bare-metal buckets', () => {
    expect(report.hpcNoPeer.some((g) => g.family === 'HBv4')).toBe(true);
    expect(report.hpcNoPeer.find((g) => g.family === 'HBv4')?.missingOn.sort()).toEqual(['AWS', 'GCP']);
    expect(report.bareMetalSizes.map((b) => b.vmSizeName)).toContain('m5.metal');
    const burstFams = report.burstableFamilies.map((b) => b.family);
    expect(burstFams).toContain('t3');
    expect(burstFams).toContain('e2');
  });

  it('confidentialNoPeer surfaces a single-cloud confidential family', () => {
    // DCasv5 + ZZxs are Azure-only confidential → missing on AWS + GCP.
    const fams = report.confidentialNoPeer.map((g) => g.family);
    expect(fams).toContain('DCasv5');
  });
});

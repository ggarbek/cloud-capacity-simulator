/**
 * AWS family categorisation guard.
 *
 * `categorizeAwsFamily` routes an AWS family slug (m7i, c7g, r7iz, x2idn,
 * cc2, …) to a canonical VmCategory. The authoritative source is the
 * `docs/aws/` bundle (general-purpose / compute-optimized / memory-optimized /
 * storage-optimized / accelerated-computing / hpc / previous-generation).
 *
 * These cases lock the buckets per the docs and, in particular, guard the
 * retired cluster-era families (cc2 / cr1 / hs1 / g2) that the generic
 * startsWith() rules would otherwise miscategorise.
 */
import { describe, it, expect } from 'vitest';
import { categorizeAwsFamily, isBurstable } from './vmCategory';

describe('categorizeAwsFamily', () => {
  it('routes General Purpose families (m / t)', () => {
    for (const f of ['m5', 'm6i', 'm7i', 'm7i-flex', 'm8g', 'm9g', 'm9gd', 't2', 't3', 't3a', 't4g']) {
      expect(categorizeAwsFamily(f)).toBe('General Purpose');
    }
  });

  it('routes Compute Optimized families (c, current gens only)', () => {
    for (const f of ['c5', 'c6g', 'c7i', 'c7i-flex', 'c8a', 'c8gn', 'c8ine']) {
      expect(categorizeAwsFamily(f)).toBe('Compute Optimized');
    }
  });

  it('routes Memory Optimized families (r / x / u / z1d)', () => {
    for (const f of [
      'r5', 'r6i', 'r7iz', 'r8g', 'r8i-flex',
      'x1', 'x1e', 'x2idn', 'x2iedn', 'x8g', 'x8aedz', 'x8i',
      'u-6tb1', 'u7i-12tb', 'u7in-32tb', 'z1d',
    ]) {
      expect(categorizeAwsFamily(f)).toBe('Memory Optimized');
    }
  });

  it('routes Storage Optimized families (d / h1 / i)', () => {
    for (const f of ['d2', 'd3', 'd3en', 'h1', 'i3', 'i3en', 'i3p', 'i4i', 'i7i', 'i8g', 'im4gn', 'is4gen']) {
      expect(categorizeAwsFamily(f)).toBe('Storage Optimized');
    }
  });

  it('routes Accelerated/GPU families (p / g4+ / gr6 / inf / trn / f / dl / vt)', () => {
    for (const f of [
      'p4d', 'p5', 'p5en', 'p6-b200', 'p6-b300',
      'g4dn', 'g5', 'g6', 'g6e', 'g6f', 'g7', 'g7e', 'gr6', 'gr6f', 'g5g',
      'inf1', 'inf2', 'trn1', 'trn1n', 'f1', 'f2', 'dl1', 'dl2q', 'vt1',
    ]) {
      expect(categorizeAwsFamily(f)).toBe('GPU');
    }
  });

  it('routes HPC families', () => {
    for (const f of ['hpc6a', 'hpc6id', 'hpc7a', 'hpc7g', 'hpc8a']) {
      expect(categorizeAwsFamily(f)).toBe('High Performance Computing');
    }
  });

  it('routes Previous Generation families per the AWS previous-generation doc', () => {
    for (const f of ['a1', 'm1', 'm2', 'm3', 'm4', 'c1', 'c3', 'c4', 'r3', 'r4', 'i2', 't1', 'g3', 'g3s', 'p2', 'p3', 'p3dn']) {
      expect(categorizeAwsFamily(f)).toBe('Previous Generation');
    }
  });

  // Regression: retired cluster-era families that the generic startsWith()
  // rules previously miscategorised.
  it('puts the retired cluster-era families in Previous Generation', () => {
    // cc2 = Cluster Compute (was wrongly Compute Optimized via startsWith('c'))
    expect(categorizeAwsFamily('cc2')).toBe('Previous Generation');
    // cr1 = High-Memory Cluster (was wrongly Compute Optimized via startsWith('c'))
    expect(categorizeAwsFamily('cr1')).toBe('Previous Generation');
    // hs1 = High Storage (was wrongly General Purpose — no rule matched 'h')
    expect(categorizeAwsFamily('hs1')).toBe('Previous Generation');
    // g2 = GPU graphics gen-2 (was wrongly General Purpose — g2 not in any GPU rule)
    expect(categorizeAwsFamily('g2')).toBe('Previous Generation');
  });
});

describe('isBurstable — cross-cloud burstable / shared-core detection (A1)', () => {
  it('AWS T-family is burstable; dedicated families are not', () => {
    for (const f of ['t2', 't3', 't3a', 't4g']) {
      expect(isBurstable({ provider: 'AWS', family: f })).toBe(true);
    }
    expect(isBurstable({ provider: 'AWS', family: 'm5' })).toBe(false);
    expect(isBurstable({ provider: 'AWS', family: 'c7g' })).toBe(false);
  });

  it('Azure B-series only (start-anchored) — a non-B family starting with "b" does not leak in', () => {
    for (const f of ['b', 'bs', 'bsv2', 'basv2', 'bpsv2']) {
      expect(isBurstable({ provider: 'Azure', family: f })).toBe(true);
    }
    expect(isBurstable({ provider: 'Azure', family: 'Dsv5' })).toBe(false);
    expect(isBurstable({ provider: 'Azure', family: 'Esv5' })).toBe(false);
  });

  it('GCP f1/g1 + the shared-core e2 sub-sizes; e2-standard is NOT burstable', () => {
    expect(isBurstable({ provider: 'GCP', family: 'f1', vmSizeName: 'f1-micro' })).toBe(true);
    expect(isBurstable({ provider: 'GCP', family: 'g1', vmSizeName: 'g1-small' })).toBe(true);
    expect(isBurstable({ provider: 'GCP', family: 'e2', vmSizeName: 'e2-micro' })).toBe(true);
    expect(isBurstable({ provider: 'GCP', family: 'e2', vmSizeName: 'e2-medium' })).toBe(true);
    // full-vCPU E2 sizes are NOT burstable
    expect(isBurstable({ provider: 'GCP', family: 'e2', vmSizeName: 'e2-standard-4' })).toBe(false);
    expect(isBurstable({ provider: 'GCP', family: 'n2', vmSizeName: 'n2-standard-4' })).toBe(false);
  });
});

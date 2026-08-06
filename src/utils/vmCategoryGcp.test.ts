/**
 * GCP family categorization — authoritative against `docs/gcp/regions-and-machine-types.md`
 * (the "Machine series — category map" table) + cloud.google.com/compute/docs/machine-resource.
 *
 * Every distinct GCP family that appears in `liveCatalog.generated.json`
 * `providers.GCP.specs` (family = `sku.split('-')[0]`, the same rule
 * `loadRegionRates.ts::familyOf` uses) is asserted here.
 */
import { describe, it, expect } from 'vitest';
import { categorizeGcpFamily } from './vmCategory';

describe('categorizeGcpFamily — vs docs/gcp category map', () => {
  // [family, expected category, doc-table row]
  const cases: Array<[string, string]> = [
    // General Purpose
    ['e2', 'General Purpose'],
    ['n2', 'General Purpose'],
    ['n2d', 'General Purpose'],
    ['n4', 'General Purpose'],
    ['t2a', 'General Purpose'],
    ['t2d', 'General Purpose'],
    // Compute Optimized (note the c2d/c3d/c4a/c4d suffix families)
    ['c2', 'Compute Optimized'],
    ['c2d', 'Compute Optimized'],
    ['c3', 'Compute Optimized'],
    ['c3d', 'Compute Optimized'],
    ['c4', 'Compute Optimized'],
    ['c4a', 'Compute Optimized'],
    ['c4d', 'Compute Optimized'],
    // Memory Optimized
    ['m1', 'Memory Optimized'],
    ['m2', 'Memory Optimized'],
    ['m3', 'Memory Optimized'],
    ['m4', 'Memory Optimized'],
    ['x4', 'Memory Optimized'],
    // Storage Optimized
    ['z3', 'Storage Optimized'],
    // HPC
    ['h3', 'High Performance Computing'],
    // GPU / Accelerator
    ['a2', 'GPU'],
    ['a3', 'GPU'],
    ['a4', 'GPU'],
    ['g2', 'GPU'],
    ['g4', 'GPU'],
    // Previous Generation — N1 + the N1-series shared-core legacy types.
    ['n1', 'Previous Generation'],
    ['f1', 'Previous Generation'], // f1-micro — N1 shared-core legacy
    ['g1', 'Previous Generation'], // g1-small — N1 shared-core legacy
  ];

  it.each(cases)('%s → %s', (family, expected) => {
    expect(categorizeGcpFamily(family)).toBe(expected);
  });

  it('is case-insensitive (familyOf may yield any case)', () => {
    expect(categorizeGcpFamily('C3D')).toBe('Compute Optimized');
    expect(categorizeGcpFamily('M3')).toBe('Memory Optimized');
    expect(categorizeGcpFamily('F1')).toBe('Previous Generation');
  });

  it('does not misroute compute suffix families to General Purpose', () => {
    // c4a starts with "c4" — must stay Compute Optimized, not fall through.
    expect(categorizeGcpFamily('c4a')).not.toBe('General Purpose');
    // n2d / n4 must NOT match the n1 previous-gen branch.
    expect(categorizeGcpFamily('n2d')).toBe('General Purpose');
    expect(categorizeGcpFamily('n4')).toBe('General Purpose');
  });
});

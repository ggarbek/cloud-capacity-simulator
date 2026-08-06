import { describe, it, expect } from 'vitest';
import { auditAcceleratorCoverage } from './acceleratorCoverage';
import { buildLiveCatalog } from '../data/liveCatalog';
import type { CatalogEntry } from '../types';

describe('accelerator/TEE coverage audit (gap-detection, #141)', () => {
  const catalog = buildLiveCatalog() as unknown as CatalogEntry[];
  const report = auditAcceleratorCoverage(catalog);

  it('reports the GPU + Confidential coverage gaps (worklist for the quarterly refresh)', () => {
    /* eslint-disable no-console */
    console.log('GPU covered    :', report.gpu.covered.join(', ') || '(none)');
    console.log('GPU MISSING    :', report.gpu.missing.map((g) => `${g.token}(${g.provider}:${g.example})`).join(', ') || '(none)');
    console.log('TEE covered    :', report.tee.covered.join(', ') || '(none)');
    console.log('TEE MISSING    :', report.tee.missing.map((g) => `${g.token}(${g.provider}:${g.example})`).join(', ') || '(none)');
    expect(report).toBeTruthy();
  });

  it('the audit is well-formed (no token both covered and missing)', () => {
    const overlap = report.gpu.covered.filter((t) => report.gpu.missing.some((g) => g.token === t));
    expect(overlap).toEqual([]);
  });
});

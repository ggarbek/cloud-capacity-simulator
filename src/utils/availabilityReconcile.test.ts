/**
 * Guard: the curated per-region family tables (the source the live catalog
 * injects availability from) MUST cover every (region, family) the vendor docs
 * publish. If a doc refresh adds a family/region and the table isn't regenerated,
 * this test fails — so the S62 "family silently missing from availability" gap
 * can't recur. Fix a failure with: `node scripts/ingest/gen-region-availability.mjs`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseAwsDoc, parseGcpDoc, reconcileCoverage } from './availabilityReconcile';
import { AWS_REGION_FAMILIES } from '../data/awsRegionAvailability';
import { GCP_REGION_FAMILIES } from '../data/gcpRegionAvailability';

const read = (rel: string) => readFileSync(resolve(__dirname, '../..', rel), 'utf8');

describe('region availability — curated tables cover the published docs', () => {
  it('AWS_REGION_FAMILIES covers every family docs/aws/instance-regions.md lists', () => {
    const doc = parseAwsDoc(read('docs/aws/instance-regions.md'));
    const diff = reconcileCoverage(doc, AWS_REGION_FAMILIES);
    expect(diff.regionsMissingFromCurated).toEqual([]);
    // Any gap here = the doc gained a family the curated table lacks → regenerate.
    expect(diff.familyGaps, `run: node scripts/ingest/gen-region-availability.mjs — gaps: ${diff.familyGaps.map((g) => `${g.region}/${g.family}`).join(', ')}`).toEqual([]);
    expect(diff.totalDocPairs).toBeGreaterThan(2000); // sanity: the doc actually parsed
  });

  it('GCP_REGION_FAMILIES covers every series docs/gcp/regions-and-machine-types.md lists', () => {
    const doc = parseGcpDoc(read('docs/gcp/regions-and-machine-types.md'));
    const diff = reconcileCoverage(doc, GCP_REGION_FAMILIES);
    expect(diff.regionsMissingFromCurated).toEqual([]);
    expect(diff.familyGaps, `run: node scripts/ingest/gen-region-availability.mjs — gaps: ${diff.familyGaps.map((g) => `${g.region}/${g.family}`).join(', ')}`).toEqual([]);
    expect(diff.totalDocPairs).toBeGreaterThan(400);
  });
});

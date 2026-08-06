import { describe, it, expect } from 'vitest';
import { buildRegionEquivalents, type EqProvider } from './regionEquivalents';
import type { RegionGeo } from '../data/regionCoordinates';

const emptyGeoMap = new Map<string, RegionGeo>();

const vm = (provider: EqProvider, region: string) => ({ provider, region });

describe('buildRegionEquivalents', () => {
  it('clusters same-country, near regions onto one cross-cloud row', () => {
    // West US (Azure) and us-west-1 (AWS) share California coords → one row.
    const rows = buildRegionEquivalents(
      [vm('Azure', 'West US'), vm('AWS', 'us-west-1')],
      ['Azure', 'AWS', 'GCP'],
      emptyGeoMap,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cells.Azure.map((c) => c.region)).toEqual(['West US']);
    expect(rows[0].cells.AWS.map((c) => c.region)).toEqual(['us-west-1']);
    expect(rows[0].cells.GCP).toEqual([]); // a real gap
    expect(rows[0].cloudsPresent).toBe(2);
    expect(rows[0].superGeo).toBe('AMER');
  });

  it('keeps different-country regions on separate rows', () => {
    // West Europe (Azure, Netherlands) vs eu-west-1 (AWS, Ireland) → 2 rows.
    const rows = buildRegionEquivalents(
      [vm('Azure', 'West Europe'), vm('AWS', 'eu-west-1')],
      ['Azure', 'AWS', 'GCP'],
      emptyGeoMap,
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.cloudsPresent === 1)).toBe(true);
    expect(rows.every((r) => r.superGeo === 'EMEA')).toBe(true);
  });

  it('excludes providers that are not in the active set (muted clouds drop out)', () => {
    const rows = buildRegionEquivalents(
      [vm('Azure', 'West US'), vm('AWS', 'us-west-1')],
      ['Azure'], // AWS muted
      emptyGeoMap,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cells.AWS).toEqual([]);
    expect(rows[0].cloudsPresent).toBe(1);
  });

  it('de-dupes repeated VM rows for the same region', () => {
    const rows = buildRegionEquivalents(
      [vm('Azure', 'West US'), vm('Azure', 'West US'), vm('Azure', 'West US')],
      ['Azure', 'AWS', 'GCP'],
      emptyGeoMap,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cells.Azure).toHaveLength(1);
  });
});

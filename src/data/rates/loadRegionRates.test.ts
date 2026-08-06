import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogFromShards, mergeLoadedVms, parseLocalDiskGib, type JoinStats } from './loadRegionRates';
import type { UserVm } from '../../types';

const AWS = join(process.cwd(), 'public', 'rates', 'aws');
const hasShards = existsSync(join(AWS, '_specs.json')) && existsSync(join(AWS, 'us-east-1.json'));
const read = (f: string) => JSON.parse(readFileSync(join(AWS, f), 'utf8'));

// These run against the real ingested AWS shards when present (gitignored, so
// skipped in a clean checkout / CI without an ingest run).
describe.skipIf(!hasShards)('loadRegionRates — real AWS shards join', () => {
  const specs = hasShards ? read('_specs.json') : { specs: {} };
  const network = hasShards ? read('_network.json') : { mbps: {} };
  const rates = hasShards ? read('us-east-1.json') : {};
  const catalog = buildCatalogFromShards('AWS', 'us-east-1', rates, specs, network);

  it('produces a populated catalog of valid UserVms', () => {
    expect(catalog.length).toBeGreaterThan(500);
    for (const v of catalog) {
      expect(v.vcpus).toBeGreaterThan(0);
      expect(v.memoryGib).toBeGreaterThan(0);
      expect(v.provider).toBe('AWS');
      expect(v.region).toBe('us-east-1');
    }
  });

  it('joins specs + network + price for m7i.xlarge', () => {
    const m7i = catalog.find((v) => v.vmSizeName === 'm7i.xlarge')!;
    expect(m7i).toBeDefined();
    expect(m7i.vcpus).toBe(4);
    expect(m7i.memoryGib).toBe(16);
    expect(m7i.networkMbps).toBe(12500);
    expect(m7i.hourlyUsd).toBeCloseTo(0.2016, 3);
    expect(m7i.riOneYrHourlyUsd).toBeGreaterThan(0);
    expect(m7i.category).toBe('General Purpose');
  });
});

describe('buildCatalogFromShards — join semantics (synthetic)', () => {
  const specs = {
    specs: {
      'x.large': { vcpus: 8, memoryGib: 64, category: 'Memory Optimized' as const },
      'y.no-rate': { vcpus: 2, memoryGib: 8 },
      'z.no-spec-rate-only': { vcpus: 0, memoryGib: 0 },
    },
  };
  const network = { mbps: { 'x.large': 25000 } };
  const rates = {
    'x.large': { payg: 1.5, ri1y: 1.0, ri3y: 0.7 },
    'z.no-spec-rate-only': { payg: 0.1, ri1y: null, ri3y: null },
  };
  const cat = buildCatalogFromShards('AWS', 'eu-west-1', rates, specs, network);

  it('emits only SKUs present in BOTH rates and specs (with valid vcpu/mem)', () => {
    // x.large yes; y.no-rate excluded (no rate); z excluded (no usable spec).
    expect(cat.map((v) => v.vmSizeName)).toEqual(['x.large']);
  });

  it('carries the real rate + joined network + region', () => {
    const x = cat[0];
    expect(x.hourlyUsd).toBe(1.5);
    expect(x.riThreeYrHourlyUsd).toBe(0.7);
    expect(x.networkMbps).toBe(25000);
    expect(x.region).toBe('eu-west-1');
    expect(x.notes).toBe('live:aws/eu-west-1');
  });

  it('leaves networkMbps 0 when no published value exists (no fabrication)', () => {
    const noNet = buildCatalogFromShards(
      'AWS',
      'r',
      { 's.t': { payg: 1, ri1y: null, ri3y: null } },
      { specs: { 's.t': { vcpus: 1, memoryGib: 2 } } },
      { mbps: {} },
    );
    expect(noNet[0].networkMbps).toBe(0);
  });
});

describe('B2 — processor provenance + enrichment in the join', () => {
  it('Azure E2_v3 with no vendor processor resolves via the curated map + estimated network', () => {
    const cat = buildCatalogFromShards(
      'Azure',
      'eastus',
      { Standard_E2_v3: { payg: 0.12, ri1y: null, ri3y: null } },
      { specs: { Standard_E2_v3: { vcpus: 2, memoryGib: 16 } } },
      { mbps: { Standard_E2_v3: 1000 }, estimatedSkus: ['Standard_E2_v3'] },
    );
    const e = cat[0];
    expect(e.processor).toBeTruthy();
    expect(e.processor).toMatch(/Broadwell/);
    expect(e.processorSource).toBe('curated');
    expect(e.processorOptions).toHaveLength(2);
    expect(e.networkMbps).toBe(1000);
    expect(e.networkEstimated).toBe(true);
  });

  it('vendor physicalProcessor wins over curated (source stays "vendor")', () => {
    const cat = buildCatalogFromShards(
      'AWS',
      'us-east-1',
      { 'm7i.large': { payg: 0.1, ri1y: null, ri3y: null } },
      { specs: { 'm7i.large': { vcpus: 2, memoryGib: 8, physicalProcessor: 'Intel Xeon Platinum 8488C' } } },
      { mbps: {} },
    );
    expect(cat[0].processor).toBe('Intel Xeon Platinum 8488C');
    expect(cat[0].processorSource).toBe('vendor');
    expect(cat[0].processorOptions).toBeUndefined();
  });

  it('a slashed processor string (GCP Cascade Lake/Ice Lake) splits into 2 options', () => {
    const cat = buildCatalogFromShards(
      'GCP',
      'us-central1',
      { 'n2-standard-4': { payg: 0.19, ri1y: null, ri3y: null } },
      { specs: { 'n2-standard-4': { vcpus: 4, memoryGib: 16, cpu: 'Cascade Lake/Ice Lake' } } },
      { mbps: {} },
    );
    expect(cat[0].processor).toBe('Cascade Lake/Ice Lake');
    expect(cat[0].processorSource).toBe('vendor');
    expect(cat[0].processorOptions).toEqual(['Cascade Lake', 'Ice Lake']);
  });

  it('AWS localStorage string populates localDiskGib (> 0); EBS-only stays 0', () => {
    const cat = buildCatalogFromShards(
      'AWS',
      'us-east-1',
      {
        'i3.2xlarge': { payg: 0.6, ri1y: null, ri3y: null },
        'm7i.large': { payg: 0.1, ri1y: null, ri3y: null },
      },
      {
        specs: {
          'i3.2xlarge': { vcpus: 8, memoryGib: 61, localStorage: '1 x 1900 NVMe SSD' },
          'm7i.large': { vcpus: 2, memoryGib: 8, localStorage: 'EBS only' },
        },
      },
      { mbps: {} },
    );
    const i3 = cat.find((v) => v.vmSizeName === 'i3.2xlarge')!;
    const m7i = cat.find((v) => v.vmSizeName === 'm7i.large')!;
    expect(i3.localDiskGib).toBe(1900);
    expect(m7i.localDiskGib).toBe(0);
  });

  it('parseLocalDiskGib handles "N x size", bare size, and EBS-only', () => {
    expect(parseLocalDiskGib('2 x 1900 NVMe SSD')).toBe(3800);
    expect(parseLocalDiskGib('1 x 950 NVMe SSD')).toBe(950);
    expect(parseLocalDiskGib('900 GB NVMe SSD')).toBe(900);
    expect(parseLocalDiskGib('EBS only')).toBe(0);
    expect(parseLocalDiskGib(null)).toBe(0);
  });

  it('counts rates dropped for a missing spec into the stats collector', () => {
    const stats: JoinStats = { ratesWithoutSpec: 0, skus: [] };
    buildCatalogFromShards(
      'AWS',
      'us-east-1',
      {
        'has.spec': { payg: 1, ri1y: null, ri3y: null },
        'no.spec': { payg: 2, ri1y: null, ri3y: null },
      },
      { specs: { 'has.spec': { vcpus: 2, memoryGib: 4 } } },
      { mbps: {} },
      stats,
    );
    expect(stats.ratesWithoutSpec).toBe(1);
    expect(stats.skus).toEqual(['no.spec']);
  });
});

describe('mergeLoadedVms — API rows supersede seed by vmSizeName+region', () => {
  const seed: UserVm[] = [
    { vmSizeName: 'a', region: 'r1', hourlyUsd: 9, vcpus: 1, memoryGib: 1 } as UserVm,
    { vmSizeName: 'a', region: 'r2', hourlyUsd: 9, vcpus: 1, memoryGib: 1 } as UserVm,
    { vmSizeName: 'b', region: 'r1', hourlyUsd: 9, vcpus: 1, memoryGib: 1 } as UserVm,
  ];
  const loaded: UserVm[] = [{ vmSizeName: 'a', region: 'r1', hourlyUsd: 0.5, vcpus: 1, memoryGib: 1 } as UserVm];

  it('replaces the matching key, keeps other regions + other SKUs', () => {
    const merged = mergeLoadedVms(seed, loaded);
    expect(merged.find((v) => v.vmSizeName === 'a' && v.region === 'r1')!.hourlyUsd).toBe(0.5);
    expect(merged.find((v) => v.vmSizeName === 'a' && v.region === 'r2')!.hourlyUsd).toBe(9);
    expect(merged.find((v) => v.vmSizeName === 'b')!.hourlyUsd).toBe(9);
    expect(merged.length).toBe(3);
  });
});

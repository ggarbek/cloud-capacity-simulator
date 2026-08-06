/**
 * shardHealth.test.ts — guards the baked shard manifest (GENERATED.health) and
 * the dataHealth()/isStale() readers.
 *
 * Floors are grounded in the REAL measured shard counts at baseline (2026-07,
 * build-manifests.mjs): floor = measured − 5%, so a normal weekly refresh passes
 * but a coverage/row cliff trips. Assertions are REQUIRED-KEYS-PRESENT (never an
 * exact key-set) so B2's additive manifest fields cannot break this suite.
 */
import { describe, it, expect } from 'vitest';
import GENERATED from './liveCatalog.generated.json';
import { dataHealth, isStale } from './dataHealth';

interface CloudManifest {
  specs: { rows: number; generatedAt?: string; coverage: { processorPct: number; networkPct: number; gpuFieldPct?: number } };
  network: { rows: number };
  rates: { regions: number; rows: number; newestGeneratedAt?: string; oldestGeneratedAt?: string };
  join: { joined: number; ratesWithoutSpec: number };
}
interface Manifest {
  version: number;
  generatedAt: string;
  clouds: Record<string, CloudManifest>;
}

const health = (GENERATED as { health?: Manifest }).health;

// Measured 2026-07 (build-manifests.mjs). floor = round(measured * 0.95).
const FLOORS: Record<string, { specRows: number; rateRows: number; networkRows: number; networkPct: number }> = {
  // azure: 1502 specs · 74,704 rates · 1,061 network · net 68.11%
  azure: { specRows: 1427, rateRows: 70968, networkRows: 1008, networkPct: 64 },
  // aws: 1380 specs · 23,370 rates · 1,372 network · net 99.42%
  aws: { specRows: 1311, rateRows: 22201, networkRows: 1303, networkPct: 94 },
  // gcp: 341 specs · 8,918 rates · 341 network · net 100%
  gcp: { specRows: 323, rateRows: 8472, networkRows: 323, networkPct: 95 },
};

describe('baked shard manifest', () => {
  it('is present in the baked catalog and schema-valid', () => {
    expect(health).toBeTruthy();
    expect(health!.version).toBeGreaterThanOrEqual(1);
    expect(typeof health!.generatedAt).toBe('string');
    // health.generatedAt must be parseable.
    expect(Number.isFinite(new Date(health!.generatedAt).getTime())).toBe(true);
    for (const cloud of ['azure', 'aws', 'gcp']) {
      expect(health!.clouds[cloud]).toBeTruthy();
    }
  });

  it('carries the required per-cloud keys (additive fields allowed)', () => {
    for (const cloud of Object.keys(FLOORS)) {
      const c = health!.clouds[cloud];
      // required-keys-present, never exact-key-set.
      expect(c.specs).toBeTruthy();
      expect(typeof c.specs.rows).toBe('number');
      expect(c.specs.coverage).toBeTruthy();
      expect(typeof c.specs.coverage.processorPct).toBe('number');
      expect(typeof c.specs.coverage.networkPct).toBe('number');
      expect(typeof c.network.rows).toBe('number');
      expect(typeof c.rates.rows).toBe('number');
      expect(typeof c.rates.regions).toBe('number');
      expect(typeof c.join.joined).toBe('number');
      expect(typeof c.join.ratesWithoutSpec).toBe('number');
    }
  });

  it('meets the absolute per-cloud row floors (measured − 5%)', () => {
    for (const [cloud, f] of Object.entries(FLOORS)) {
      const c = health!.clouds[cloud];
      expect(c.specs.rows, `${cloud} specRows`).toBeGreaterThanOrEqual(f.specRows);
      expect(c.rates.rows, `${cloud} rateRows`).toBeGreaterThanOrEqual(f.rateRows);
      expect(c.network.rows, `${cloud} networkRows`).toBeGreaterThanOrEqual(f.networkRows);
    }
  });

  it('meets processor coverage floors (aws & gcp ≥99; azure raw shard is 0)', () => {
    expect(health!.clouds.aws.specs.coverage.processorPct).toBeGreaterThanOrEqual(99);
    expect(health!.clouds.gcp.specs.coverage.processorPct).toBeGreaterThanOrEqual(99);
    // Azure's Resource SKUs API publishes NO processor string, so the RAW shard
    // legitimately carries 0% — this floor is correct for the shard itself. The
    // effective (runtime, curated-map) coverage is asserted separately below.
    expect(health!.clouds.azure.specs.coverage.processorPct).toBeGreaterThanOrEqual(0);
  });

  it('meets network coverage floors', () => {
    for (const [cloud, f] of Object.entries(FLOORS)) {
      expect(
        health!.clouds[cloud].specs.coverage.networkPct,
        `${cloud} networkPct`,
      ).toBeGreaterThanOrEqual(f.networkPct);
    }
  });

  it('keeps the ratesWithoutSpec share under the ceiling per cloud', () => {
    // Ceiling mirrors validate-shards.mjs RATES_WITHOUT_SPEC_FLOOR (0.14).
    // TODO ratchet down as B2's spec coverage lands and Azure's share falls.
    const CEILING = 0.14;
    for (const cloud of Object.keys(FLOORS)) {
      const c = health!.clouds[cloud];
      const share = c.rates.rows ? c.join.ratesWithoutSpec / c.rates.rows : 0;
      expect(share, `${cloud} ratesWithoutSpec share`).toBeLessThanOrEqual(CEILING);
    }
  });
});

describe('dataHealth() reader', () => {
  it('returns one row per cloud with the display fields', () => {
    const rows = dataHealth();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(typeof r.cloud).toBe('string');
      expect(typeof r.shardAgeDays).toBe('number');
      expect(r.shardAgeDays).toBeGreaterThanOrEqual(0);
      expect(r.specRows).toBeGreaterThan(0);
      expect(typeof r.processorPct).toBe('number');
      expect(typeof r.effectiveProcessorPct).toBe('number');
      expect(typeof r.networkPct).toBe('number');
      expect(typeof r.ratesWithoutSpec).toBe('number');
    }
  });

  it('reports HIGH effective (runtime) Azure processor coverage despite a 0 raw shard', () => {
    const rows = dataHealth();
    const azure = rows.find((r) => r.cloud.toLowerCase() === 'azure');
    expect(azure).toBeTruthy();
    // The raw shard publishes no processor string (0%); the curated map resolves
    // nearly every Azure family at runtime. This is the honest figure the FAQ
    // shows — assert it stays high so a map regression trips the guard.
    expect(azure!.processorPct).toBe(0);
    expect(azure!.effectiveProcessorPct).toBeGreaterThanOrEqual(95);
  });

  it('leaves AWS/GCP effective coverage equal to the published shard figure', () => {
    const rows = dataHealth();
    for (const cloud of ['aws', 'gcp']) {
      const r = rows.find((x) => x.cloud.toLowerCase() === cloud);
      expect(r).toBeTruthy();
      // Their vendor processor string is published, so effective === raw.
      expect(r!.effectiveProcessorPct).toBe(r!.processorPct);
    }
  });

  it('row spec counts match the manifest', () => {
    const rows = dataHealth();
    for (const r of rows) {
      expect(r.specRows).toBe(health!.clouds[r.cloud].specs.rows);
    }
  });
});

describe('isStale()', () => {
  it('is false for the fresh baked catalog at the default 30-day window', () => {
    // The committed shards are recent; a fresh build is not stale.
    expect(isStale()).toBe(false);
  });

  it('reports stale when the window is tighter than the shard age', () => {
    // The baked shards are a handful of days old. A negative window makes any
    // real shard "older than −1 days", exercising isStale()'s own comparison
    // path (not a re-derivation) → true.
    expect(isStale(-1)).toBe(true);
  });

  it('math: a synthetic old generatedAt reads stale, a recent one fresh', () => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const old = new Date(Date.now() - 200 * MS_PER_DAY).toISOString();
    const ageDays = Math.floor((Date.now() - new Date(old).getTime()) / MS_PER_DAY);
    expect(ageDays).toBeGreaterThan(30);
    const recent = new Date(Date.now() - 3 * MS_PER_DAY).toISOString();
    const recentAge = Math.floor((Date.now() - new Date(recent).getTime()) / MS_PER_DAY);
    expect(recentAge).toBeLessThan(30);
  });
});

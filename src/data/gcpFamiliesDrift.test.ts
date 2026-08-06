/**
 * gcpFamiliesDrift.test.ts — the GCP availability doc (GCP_REGION_FAMILIES) and
 * the GCP spec shard (public/rates/gcp/_specs.json) must not silently diverge.
 *
 * Availability is injected per (region, family) from GCP_REGION_FAMILIES, while
 * specs/sizes come from the shard. If the doc lists a family the shard has no
 * spec for, that family shows as "available" but has zero comparable sizes — a
 * silent hole. This guard fails when a doc family is absent from the shard,
 * UNLESS it is a KNOWN un-specced family (accelerators awaiting a curated spec).
 *
 * Fix on failure: add the family to FAMILIES in scripts/ingest/gcp-specs.mjs and
 * re-run it, so the shard carries its sizes.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GCP_REGION_FAMILIES } from './gcpRegionAvailability';

/** Families the doc lists but the shard legitimately doesn't spec yet — GPU/
 *  accelerator lines awaiting a curated accelerator spec (see gcp-specs.mjs). */
const KNOWN_UNSPECCED = ['g4', 'a4'];

const read = (rel: string) => readFileSync(resolve(__dirname, '../..', rel), 'utf8');

function shardFamilies(): Set<string> {
  const specs = (JSON.parse(read('public/rates/gcp/_specs.json')).specs ?? {}) as Record<
    string,
    { family?: string }
  >;
  const fams = new Set<string>();
  for (const spec of Object.values(specs)) {
    if (spec.family) fams.add(String(spec.family).toLowerCase());
  }
  return fams;
}

function docFamilies(): Set<string> {
  const fams = new Set<string>();
  for (const set of Object.values(GCP_REGION_FAMILIES)) {
    for (const f of set) fams.add(f.toLowerCase());
  }
  return fams;
}

describe('GCP family drift — doc vs spec shard', () => {
  it('every GCP_REGION_FAMILIES family has a spec in the shard (or is KNOWN_UNSPECCED)', () => {
    const shard = shardFamilies();
    const doc = docFamilies();
    const missing = Array.from(doc)
      .filter((f) => !shard.has(f) && !KNOWN_UNSPECCED.includes(f))
      .sort();
    expect(
      missing,
      missing.length
        ? `GCP doc families missing from public/rates/gcp/_specs.json: ${missing.join(', ')}. ` +
            `Add each to FAMILIES in scripts/ingest/gcp-specs.mjs and re-run it (or, if intentionally ` +
            `un-specced, add it to KNOWN_UNSPECCED in this test).`
        : 'ok',
    ).toEqual([]);
  });

  it('KNOWN_UNSPECCED families really are absent from the shard (prune stale exemptions)', () => {
    const shard = shardFamilies();
    for (const fam of KNOWN_UNSPECCED) {
      expect(
        shard.has(fam),
        `${fam} is now in the shard — remove it from KNOWN_UNSPECCED so drift is enforced.`,
      ).toBe(false);
    }
  });
});

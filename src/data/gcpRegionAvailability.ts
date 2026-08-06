/**
 * GCP Compute Engine per-region instance-family availability.
 *
 * GENERATED from docs/gcp/regions-and-machine-types.md by scripts/ingest/gen-region-availability.mjs —
 * DO NOT hand-edit. Update the doc and re-run the generator (a vitest guard
 * fails the build if this file drifts from the doc). Region availability is
 * injected from this table (decoupled from pricing), so keeping it in lockstep
 * with the published doc is what stops families going silently missing.
 */

/** Region slug → set of family slugs (lowercase) the doc lists as available. */
export const GCP_REGION_FAMILIES: Record<string, ReadonlySet<string>> = {
  'africa-south1': new Set(['c4', 'c4a', 'e2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
  'asia-east1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'g4', 'm1', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'asia-east2': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'e2', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'asia-northeast1': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d', 'z3']),
  'asia-northeast2': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'e2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'asia-northeast3': new Set(['a2', 'a3', 'c2', 'c2d', 'c3', 'c4', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4']),
  'asia-south1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'asia-south2': new Set(['c4', 'e2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
  'asia-southeast1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'asia-southeast2': new Set(['c2', 'c3', 'c4', 'e2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'australia-southeast1': new Set(['a2', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'australia-southeast2': new Set(['c3', 'c4', 'e2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
  'europe-central2': new Set(['c3', 'c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'europe-north1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'europe-north2': new Set(['c3', 'c4', 'e2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
  'europe-southwest1': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west1': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'g4', 'h3', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d', 'z3']),
  'europe-west10': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west12': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west2': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west3': new Set(['a2', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west4': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'g4', 'h3', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d', 'z3']),
  'europe-west6': new Set(['c3', 'c4', 'e2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west8': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'europe-west9': new Set(['c3', 'c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'me-central1': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'me-central2': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'me-west1': new Set(['c3', 'c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'northamerica-northeast1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'northamerica-northeast2': new Set(['c3', 'c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'northamerica-south1': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'southamerica-east1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'southamerica-west1': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'us-central1': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'g4', 'h3', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d', 'x4', 'z3']),
  'us-east1': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'g4', 'h3', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d', 'z3']),
  'us-east4': new Set(['c3', 'c4', 'e2', 'h3', 'n2', 'n2d', 'n4', 't2d', 'x4']),
  'us-east5': new Set(['a2', 'c3', 'c4', 'e2', 'h3', 'n2', 'n2d', 'n4', 't2d']),
  'us-south1': new Set(['c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'us-west1': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'us-west2': new Set(['c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'e2', 'g2', 'm1', 'm2', 'm3', 'n1', 'n2', 'n2d', 'n4', 't2d']),
  'us-west3': new Set(['a2', 'c3', 'c4', 'e2', 'n2', 'n2d', 'n4', 't2d']),
  'us-west4': new Set(['a2', 'a3', 'a4', 'c2', 'c2d', 'c3', 'c3d', 'c4', 'c4a', 'c4d', 'e2', 'g2', 'g4', 'm1', 'm2', 'm3', 'n2', 'n2d', 'n4', 't2d']),
};

/** Canonical ordered list of every region present in the doc. */
export const GCP_ALL_REGIONS: readonly string[] = Object.keys(GCP_REGION_FAMILIES);

/** True iff the doc publishes the family in the region (case-insensitive). */
export function gcpFamilyInRegion(family: string, region: string): boolean {
  const set = GCP_REGION_FAMILIES[region];
  if (!set) return false;
  return set.has(family.toLowerCase());
}

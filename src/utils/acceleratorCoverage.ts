/**
 * Gap-detection for the curated accelerator/TEE specs (#141). Diffs the live
 * catalog's GPU + Confidential families against `GPU_SPECS` / `TEE_SUPPORT`, so
 * the quarterly research refresh (and a CI guard) can SEE which families still
 * need a curated entry — a family with no spec degrades the match engine to
 * count-only, which is safe but coarse.
 *
 * Built against the TS exports directly (no JSON migration required) — it's a
 * read-only consumer of the catalog + the spec maps.
 */
import type { CatalogEntry } from '../types';
import { gpuSpecFor, teeSpecFor, familyToken } from './acceleratorSpecs';
import { categorize } from './vmCategory';

export interface CoverageGap {
  token: string;
  example: string;
  provider?: string;
}
export interface CoverageReport {
  gpu: { covered: string[]; missing: CoverageGap[] };
  tee: { covered: string[]; missing: CoverageGap[] };
}

/** Audit which GPU + Confidential families in `vms` have a curated spec. */
export function auditAcceleratorCoverage(vms: CatalogEntry[]): CoverageReport {
  const gpuSeen = new Map<string, CoverageGap>();
  const gpuCovered = new Set<string>();
  const teeSeen = new Map<string, CoverageGap>();
  const teeCovered = new Set<string>();

  for (const v of vms) {
    const token = familyToken(v.family);
    if (!token) continue;
    const cat = v.category ?? categorize(v.provider, v.family);
    if (cat === 'GPU') {
      if (!gpuSeen.has(token)) gpuSeen.set(token, { token, example: v.vmSizeName, provider: v.provider });
      if (gpuSpecFor(v.family, v.vmSizeName)) gpuCovered.add(token);
    }
    if (cat === 'Confidential') {
      if (!teeSeen.has(token)) teeSeen.set(token, { token, example: v.vmSizeName, provider: v.provider });
      if (teeSpecFor(v.family, v.vmSizeName)) teeCovered.add(token);
    }
  }

  const missing = (seen: Map<string, CoverageGap>, covered: Set<string>) =>
    [...seen.values()].filter((g) => !covered.has(g.token)).sort((a, b) => a.token.localeCompare(b.token));

  return {
    gpu: { covered: [...gpuCovered].sort(), missing: missing(gpuSeen, gpuCovered) },
    tee: { covered: [...teeCovered].sort(), missing: missing(teeSeen, teeCovered) },
  };
}

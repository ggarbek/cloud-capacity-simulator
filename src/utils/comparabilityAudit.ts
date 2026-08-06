/**
 * Comparability gap-detection (Wave-1 A1) — mirrors `acceleratorCoverage.ts`.
 *
 * Diffs the live catalog against the data the caveat + distance layers rely on,
 * so a CI guard (and the quarterly research refresh) can SEE which families would
 * degrade a cross-cloud comparison to something coarse or asterisked:
 *   - Storage-Optimized families with no local-disk figure (the category's
 *     defining dimension — an i-family with no `localDiskGib` can't be matched on
 *     what makes it a storage machine).
 *   - GPU / Confidential families with no curated accelerator/TEE spec (reused
 *     verbatim from `auditAcceleratorCoverage`).
 *   - HPC / Confidential families that have NO peer on another cloud (a
 *     single-cloud category can't produce a cross-cloud equivalence at all).
 *   - Bare-metal sizes + burstable families (surfaced so the caveat layer's
 *     coverage of them can be reviewed).
 *
 * Read-only consumer of the catalog + the spec maps; built against the TS exports
 * (no JSON migration) exactly like `acceleratorCoverage.ts`.
 */
import type { CatalogEntry } from '../types';
import { auditAcceleratorCoverage, type CoverageGap } from './acceleratorCoverage';
import { matchCategory, isBurstable } from './vmCategory';
import { teeSpecFor, teeCapabilityFor, familyToken } from './acceleratorSpecs';
import { bareMetalFromName } from './matchCaveats';

/** A family with no cross-cloud peer in a given category — the providers it's
 *  missing on (so it can never form an equivalence for that category). */
export interface PeerGap {
  provider: string;
  family: string;
  example: string;
  missingOn: string[];
}

export interface ComparabilityReport {
  /** Storage-Optimized sizes carrying no local-disk figure. */
  storageNoDisk: { provider: string; family: string; example: string }[];
  /** GPU families with no curated GPU spec (from `auditAcceleratorCoverage`). */
  gpuNoSpec: CoverageGap[];
  /** Confidential families with no curated TEE spec (from `auditAcceleratorCoverage`). */
  teeNoSpec: CoverageGap[];
  /** HPC families with no peer on one or both of the other clouds. */
  hpcNoPeer: PeerGap[];
  /** Confidential families (incl. opt-in capable) with no peer on other clouds. */
  confidentialNoPeer: PeerGap[];
  /** Bare-metal sizes (surfaced for caveat-coverage review). */
  bareMetalSizes: { provider: string; vmSizeName: string }[];
  /** Burstable families (surfaced for caveat-coverage review). */
  burstableFamilies: { provider: string; family: string }[];
}

const ALL_PROVIDERS = ['AWS', 'Azure', 'GCP'];

function normProvider(p: string | undefined): string {
  const s = (p ?? '').toLowerCase();
  if (s === 'aws') return 'AWS';
  if (s === 'azure') return 'Azure';
  if (s === 'gcp') return 'GCP';
  return p ?? '';
}

/** For a category, which providers have at least one family in it — so we can
 *  flag families whose category has no peer on the other clouds. */
function peerGapsForCategory(
  vms: CatalogEntry[],
  inCategory: (vm: CatalogEntry) => boolean,
): PeerGap[] {
  const providersWithCat = new Set<string>();
  const families = new Map<string, { provider: string; family: string; example: string }>();
  for (const v of vms) {
    if (!inCategory(v)) continue;
    const prov = normProvider(v.provider);
    providersWithCat.add(prov);
    const key = `${prov}|${familyToken(v.family)}`;
    if (!families.has(key) && v.family) {
      families.set(key, { provider: prov, family: v.family, example: v.vmSizeName });
    }
  }
  const gaps: PeerGap[] = [];
  for (const f of families.values()) {
    const missingOn = ALL_PROVIDERS.filter((p) => p !== f.provider && !providersWithCat.has(p));
    if (missingOn.length) gaps.push({ ...f, missingOn });
  }
  return gaps.sort((a, b) => (a.provider + a.family).localeCompare(b.provider + b.family));
}

/** Audit a catalog for the comparability gaps that make a cross-cloud match
 *  coarse, asterisked, or impossible. */
export function auditComparability(vms: CatalogEntry[]): ComparabilityReport {
  const acc = auditAcceleratorCoverage(vms);

  // Storage-Optimized sizes with no local disk (one per family, first example).
  const storageSeen = new Map<string, { provider: string; family: string; example: string }>();
  for (const v of vms) {
    if (matchCategory(v) !== 'Storage Optimized') continue;
    if (v.localDiskGib > 0) continue;
    const key = `${normProvider(v.provider)}|${familyToken(v.family)}`;
    if (!storageSeen.has(key) && v.family) {
      storageSeen.set(key, { provider: normProvider(v.provider), family: v.family, example: v.vmSizeName });
    }
  }

  // Bare-metal sizes.
  const bareMetalSizes = vms
    .filter((v) => bareMetalFromName(v.vmSizeName))
    .map((v) => ({ provider: normProvider(v.provider), vmSizeName: v.vmSizeName }))
    .sort((a, b) => a.vmSizeName.localeCompare(b.vmSizeName));

  // Burstable families (deduped).
  const burstSeen = new Map<string, { provider: string; family: string }>();
  for (const v of vms) {
    if (!isBurstable(v) || !v.family) continue;
    const key = `${normProvider(v.provider)}|${familyToken(v.family)}`;
    if (!burstSeen.has(key)) burstSeen.set(key, { provider: normProvider(v.provider), family: v.family });
  }

  return {
    storageNoDisk: [...storageSeen.values()].sort((a, b) =>
      (a.provider + a.family).localeCompare(b.provider + b.family),
    ),
    gpuNoSpec: acc.gpu.missing,
    teeNoSpec: acc.tee.missing,
    hpcNoPeer: peerGapsForCategory(vms, (v) => matchCategory(v) === 'High Performance Computing'),
    confidentialNoPeer: peerGapsForCategory(
      vms,
      (v) =>
        matchCategory(v) === 'Confidential' ||
        teeSpecFor(v.family, v.vmSizeName) !== null ||
        teeCapabilityFor(v.provider, v.family) !== null,
    ),
    bareMetalSizes,
    burstableFamilies: [...burstSeen.values()].sort((a, b) =>
      (a.provider + a.family).localeCompare(b.provider + b.family),
    ),
  };
}

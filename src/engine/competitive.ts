/**
 * v2.12 (Phase F) — Competitive Offering pure helpers.
 *
 * All functions in this file are PURE — given the same inputs they
 * return the same outputs, no React, no DOM, no side effects. The
 * Competitive Offering page passes `state.userVms` + `state.userEquivalency`
 * and renders whatever these return. Engine code can also call them
 * for the BoM's "competitive callout" deep-link strip in Insights.
 *
 * Three responsibilities:
 *   1. `findEquivalents` — given a baseline Azure SKU, return the
 *      cross-cloud match-set as resolved CatalogEntry rows.
 *   2. `priceCompare` — derive a normalized chart-friendly dataset
 *      from the resolved equivalents (PAYG / 1y RI / 3y RI per provider).
 *   3. `regionAvailability` — which regions each provider lists the
 *      equivalent SKU in (sourced from the user's VM catalog).
 *
 * Equivalency is opinionated (one Azure SKU may have multiple AWS or
 * GCP candidate analogs in the equivalency list). The helpers return
 * ALL matches; the UI is responsible for picking the "primary" one
 * (default = first match in catalog order) and offering the rest as
 * alternatives.
 */
import type {
  CatalogEntry,
  EquivalencyEntry,
  UserVm,
  VmProvider,
} from '../types';
import { bestVmMatch, CONFIDENTIAL_PEER_PENALTY } from '../utils/equivalence';
import { CROSS_CATEGORY_PENALTY } from '../utils/crossCloudEquivalency';
import { matchCategory } from '../utils/vmCategory';
import { isConfidentialCapable } from '../utils/acceleratorSpecs';
import { matchCaveats, isStretch, type MatchCaveat } from '../utils/matchCaveats';
import { isEdgeRegion } from '../data/regionGeo';

export interface EquivalentMatch {
  provider: VmProvider;
  /** The resolved catalog row for this match, or null if the equivalency
   *  table mentions a SKU that isn't in `state.userVms`. UI surfaces
   *  null as "no rate sheet uploaded yet — add this SKU to the VM Library". */
  catalogRow: CatalogEntry | null;
  /** The SKU name the equivalency table claims is the analog. Kept
   *  separately from `catalogRow` because the row may be missing. */
  sku: string;
  /** Free-form context from the equivalency row. Shown as a chip under
   *  the equivalent's name in the UI. */
  notes?: string;
  /** True when this match was NOT authored in the equivalency table but
   *  computed algorithmically (the closest same-category catalog VM via
   *  `bestVmMatch`). The UI surfaces it as a ≈% match — equivalents are
   *  similar, not exact. Lets the side-by-side always show a comparison
   *  instead of "no equivalent authored". */
  inferred?: boolean;
  /** Comparability caveats for this analog vs the baseline (A1/A2). Populated on
   *  every algorithmically inferred match — honest asterisks so the UI can never
   *  render a confidential-capable bridge or a cross-category fallback as a true
   *  peer. Empty/undefined = a clean like-for-like (or an authored match). */
  caveats?: MatchCaveat[];
  /** True when the caveats mark this a "stretch" (size stretch / category
   *  fallback / confidential-peer bridge) rather than a like-for-like swap. */
  stretch?: boolean;
}

export interface EquivalentsResult {
  /** The baseline VM that was looked up (the user's pick). */
  baseline: CatalogEntry | null;
  /** Every row in the equivalency table whose `azureSku` matches the
   *  baseline. Most baselines have 1 row; some popular SKUs may have
   *  multiple alternative AWS / GCP analogs. */
  rows: {
    aws: EquivalentMatch[];
    gcp: EquivalentMatch[];
    notes: string[];
  };
}

// ────────────────────────────────────────────────────────────────────────
// findEquivalents — primary lookup
// ────────────────────────────────────────────────────────────────────────
/**
 * Resolves an Azure baseline SKU against the equivalency table + catalog.
 * Returns the baseline + matching AWS/GCP entries with their full
 * `CatalogEntry` payloads when available.
 *
 * Catalog rows are filtered by `region` when `bias` is provided — used
 * by the UI to prefer matches in the user's active region (e.g. AWS
 * us-east-1 when comparing against Azure East US 2). When no row in the
 * preferred region exists, the helper falls back to the first catalog
 * row matching the SKU regardless of region.
 */
export function findEquivalents(
  baselineSku: string,
  userVms: UserVm[],
  equivalency: EquivalencyEntry[],
  options: { regionBias?: Record<VmProvider, string> } = {},
): EquivalentsResult {
  const baseline = lookupVm(userVms, baselineSku);
  const matchRows = equivalency.filter(
    (e) => (e.azureSku ?? '').toLowerCase() === baselineSku.toLowerCase(),
  );

  const aws: EquivalentMatch[] = [];
  const gcp: EquivalentMatch[] = [];
  const notes: string[] = [];

  for (const row of matchRows) {
    if (row.notes) notes.push(row.notes);
    if (row.awsSku) {
      aws.push({
        provider: 'AWS',
        sku: row.awsSku,
        catalogRow: lookupVm(userVms, row.awsSku, options.regionBias?.AWS),
        notes: row.notes,
      });
    }
    if (row.gcpSku) {
      gcp.push({
        provider: 'GCP',
        sku: row.gcpSku,
        catalogRow: lookupVm(userVms, row.gcpSku, options.regionBias?.GCP),
        notes: row.notes,
      });
    }
  }

  // Algorithmic fallback — when the authored equivalency table yields no
  // usable analog for a provider (no row, or the named SKU isn't in the
  // catalog), compute the CLOSEST same-category match so the comparison is
  // never empty. Equivalents are similar, not exact — the UI shows the
  // ≈% match and an `inferred` flag. Doctrine: cross-cloud equivalence is
  // algorithmic, not dependent on the hand-authored seed.
  if (baseline) {
    ensureProviderMatch('AWS', aws, baseline, userVms, options.regionBias?.AWS);
    ensureProviderMatch('GCP', gcp, baseline, userVms, options.regionBias?.GCP);
  }

  return {
    baseline,
    rows: { aws, gcp, notes },
  };
}

/**
 * Ensure `list` has at least one resolvable (catalogRow != null) match for
 * `provider`. If it doesn't, append the algorithmically-closest same-category
 * VM from that provider's catalog (deduped by SKU — specs are region-free),
 * flagged `inferred`. No-op when an authored match already resolves, or when
 * the provider has no same-category candidate at all.
 */
function ensureProviderMatch(
  provider: VmProvider,
  list: EquivalentMatch[],
  baseline: CatalogEntry,
  userVms: UserVm[],
  regionBias?: string,
): void {
  if (list.some((m) => m.catalogRow !== null)) return; // authored match resolves
  const candidates = dedupeBySku(
    userVms.filter((v) => (v.provider as VmProvider) === provider),
  );

  // 3-rung LOUD-FALLBACK ladder (A2). A confidential baseline (or an HPC/niche
  // one) often has NO same-category peer on another cloud; instead of blanking
  // or — worse — surfacing a random size as if it were a true peer, we walk a
  // ladder and ATTACH caveats so no UI can render the result as apples-to-apples:
  //   Rung 1 — existing hard-gated bestVmMatch (same effective category).
  //   Rung 2 — Confidential baseline only: closest confidential-CAPABLE peer at
  //            the softer CONFIDENTIAL_PEER_PENALTY (opt-in TEE, not a dedicated
  //            confidential SKU).
  //   Rung 3 — closest VM anywhere at CROSS_CATEGORY_PENALTY (different category).
  // Non-confidential baselines that resolve at rung 1 are unchanged.
  let match = bestVmMatch(baseline, candidates);
  let ctx: { crossCategory?: boolean; confidentialPeer?: boolean } = {};
  let note = 'closest match';
  if (!match && matchCategory(baseline) === 'Confidential') {
    const capable = candidates.filter((v) => isConfidentialCapable(v));
    match = bestVmMatch(baseline, capable, { crossCategoryPenalty: CONFIDENTIAL_PEER_PENALTY });
    if (match) {
      ctx = { confidentialPeer: true };
      note = 'confidential-capable peer (opt-in TEE)';
    }
  }
  if (!match) {
    match = bestVmMatch(baseline, candidates, { crossCategoryPenalty: CROSS_CATEGORY_PENALTY });
    if (match) {
      ctx = { crossCategory: true };
      note = 'closest alternative — different category';
    }
  }
  if (!match) return;
  const caveats = matchCaveats(baseline, match.vm, { ...ctx, distance: match.distance });
  const row = lookupVm(userVms, match.vm.vmSizeName, regionBias) ?? match.vm;
  list.push({
    provider,
    sku: match.vm.vmSizeName,
    catalogRow: row,
    notes: note,
    inferred: true,
    caveats: caveats.length ? caveats : undefined,
    stretch: isStretch(caveats),
  });
}

/** One catalog row per distinct SKU (specs are region-free, so the first
 *  row for each SKU is representative for similarity scoring). */
function dedupeBySku(vms: UserVm[]): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const v of vms) {
    const k = v.vmSizeName.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

/**
 * Returns every distinct Azure SKU that has at least one equivalency
 * entry. Used by the Competitive page's baseline picker so the user
 * can't pick a baseline that has no compare-against rows.
 */
export function listEquivalencyBaselines(equivalency: EquivalencyEntry[]): string[] {
  const set = new Set<string>();
  for (const e of equivalency) {
    if (e.azureSku) set.add(e.azureSku);
  }
  return Array.from(set).sort();
}

// ────────────────────────────────────────────────────────────────────────
// priceCompare — chart-friendly pricing dataset
// ────────────────────────────────────────────────────────────────────────
export interface PriceBar {
  /** Display label, e.g. "Azure · Standard_M64s" or "AWS · m7i.16xlarge". */
  label: string;
  provider: VmProvider;
  sku: string;
  payg: number | null;
  oneYr: number | null;
  threeYr: number | null;
  /** Region the rates were sourced from. Helps the user understand why
   *  e.g. an AWS row reads $X — the rate is tied to a specific region. */
  region?: string;
  /** The BASE cloud's region this bar was compared against (for the callout). */
  baseRegion?: string;
  /** Whether `region` is geographically comparable to `baseRegion` (same country
   *  or within the match radius). `false` means the rate is the SKU's nearest
   *  AVAILABLE region, which is NOT near the base — surfaced as a warning so the
   *  user never reads a far-flung region as an apples-to-apples peer. `undefined`
   *  when no base region was supplied (legacy `priceCompare` path). */
  regionComparable?: boolean;
  /** Comparability caveats carried from the winning EquivalentMatch (A2), so the
   *  pricing chart can flag a bar whose SKU is only a confidential-capable bridge
   *  or a cross-category fallback. The baseline bar carries none. */
  caveats?: MatchCaveat[];
  /** True when the winning match was a stretch (see EquivalentMatch.stretch). */
  stretch?: boolean;
}

/**
 * Flattens a baseline + equivalents into a single bar-chart dataset.
 * Per-provider one row each (baseline = Azure; first AWS match; first
 * GCP match). Missing equivalents render as null bars (UI shows an
 * em-dash). Returns rows in canonical Azure → AWS → GCP order so the
 * chart legend reads predictably.
 */
export function priceCompare(equivalents: EquivalentsResult): PriceBar[] {
  const bars: PriceBar[] = [];
  if (equivalents.baseline) {
    bars.push(catalogToBar(equivalents.baseline, 'Azure'));
  }
  // First AWS + GCP matches are primary; alternatives surface elsewhere.
  const awsPrimary = equivalents.rows.aws.find((m) => m.catalogRow !== null);
  if (awsPrimary?.catalogRow) {
    bars.push(withCaveats(catalogToBar(awsPrimary.catalogRow, 'AWS'), awsPrimary));
  } else if (equivalents.rows.aws.length > 0) {
    // Mentioned in equivalency table but missing from catalog — emit a
    // placeholder bar so the user can see what's missing.
    bars.push({
      label: `AWS · ${equivalents.rows.aws[0].sku}`,
      provider: 'AWS',
      sku: equivalents.rows.aws[0].sku,
      payg: null,
      oneYr: null,
      threeYr: null,
    });
  }
  const gcpPrimary = equivalents.rows.gcp.find((m) => m.catalogRow !== null);
  if (gcpPrimary?.catalogRow) {
    bars.push(withCaveats(catalogToBar(gcpPrimary.catalogRow, 'GCP'), gcpPrimary));
  } else if (equivalents.rows.gcp.length > 0) {
    bars.push({
      label: `GCP · ${equivalents.rows.gcp[0].sku}`,
      provider: 'GCP',
      sku: equivalents.rows.gcp[0].sku,
      payg: null,
      oneYr: null,
      threeYr: null,
    });
  }
  return bars;
}

// ────────────────────────────────────────────────────────────────────────
// regionAvailability — provider × region grid
// ────────────────────────────────────────────────────────────────────────
export interface RegionAvailability {
  /** Union of every region across baseline + every equivalent SKU. */
  regions: string[];
  /** rows[provider] = Set of regions where this provider's equivalent
   *  SKU has at least one catalog row. UI renders ✓ when the region is
   *  in the set, ✗ otherwise. */
  rows: { provider: VmProvider; sku: string; available: Set<string> }[];
}

/**
 * Builds a region × provider availability matrix for the baseline +
 * resolved equivalents. Sourced ENTIRELY from `userVms` rows that
 * reference each SKU — when the user hasn't uploaded a region's rate
 * sheet, that cell renders as ✗. This is intentional: the matrix
 * reflects what the user has data for, not what each cloud sells
 * everywhere.
 */
export function regionAvailability(
  equivalents: EquivalentsResult,
  userVms: UserVm[],
): RegionAvailability {
  const rows: RegionAvailability['rows'] = [];
  const regionsSet = new Set<string>();

  // Baseline (Azure)
  if (equivalents.baseline?.vmSizeName) {
    const sku = equivalents.baseline.vmSizeName;
    const av = collectRegions(userVms, sku);
    av.forEach((r) => regionsSet.add(r));
    rows.push({ provider: 'Azure', sku, available: av });
  }
  // First AWS + GCP equivalents — UI calls this for the primary picks.
  const awsPrimary =
    equivalents.rows.aws.find((m) => m.catalogRow !== null) ??
    equivalents.rows.aws[0];
  if (awsPrimary) {
    const av = collectRegions(userVms, awsPrimary.sku);
    av.forEach((r) => regionsSet.add(r));
    rows.push({ provider: 'AWS', sku: awsPrimary.sku, available: av });
  }
  const gcpPrimary =
    equivalents.rows.gcp.find((m) => m.catalogRow !== null) ??
    equivalents.rows.gcp[0];
  if (gcpPrimary) {
    const av = collectRegions(userVms, gcpPrimary.sku);
    av.forEach((r) => regionsSet.add(r));
    rows.push({ provider: 'GCP', sku: gcpPrimary.sku, available: av });
  }

  return { regions: Array.from(regionsSet).sort(), rows };
}

// ────────────────────────────────────────────────────────────────────────
// specDeltas — plain-language callouts for spec divergence
// ────────────────────────────────────────────────────────────────────────
export interface SpecDelta {
  dim:
    | 'vCPU'
    | 'memory'
    | 'network'
    | 'localStorage'
    | 'remoteStorage'
    | 'accelerator';
  /** Plain-English summary, e.g. "AWS equivalent has 2× local storage". */
  summary: string;
  /** True when the equivalent is BETTER on this dim (more vCPU, more memory, etc.). */
  equivalentBetter: boolean;
}

/**
 * Derives a small handful of plain-language callouts comparing the
 * baseline against the first AWS or GCP equivalent. The UI shows up to
 * 3-4 of these as chips under the equivalents table.
 */
export function specDeltas(
  baseline: CatalogEntry | null,
  equivalent: CatalogEntry | null,
  equivalentProvider: VmProvider,
): SpecDelta[] {
  if (!baseline || !equivalent) return [];
  const out: SpecDelta[] = [];
  const cmpRatio = (a: number | undefined, b: number | undefined): number | null => {
    if (!a || !b) return null;
    return b / a;
  };

  // vCPU
  const vcpuRatio = cmpRatio(baseline.vcpus, equivalent.vcpus);
  if (vcpuRatio !== null && Math.abs(vcpuRatio - 1) >= 0.1) {
    out.push({
      dim: 'vCPU',
      equivalentBetter: vcpuRatio > 1,
      summary: `${equivalentProvider} equivalent has ${fmtRatioPhrase(vcpuRatio, 'vCPU count')} (${equivalent.vcpus} vs ${baseline.vcpus})`,
    });
  }
  // Memory
  const memRatio = cmpRatio(baseline.memoryGib, equivalent.memoryGib);
  if (memRatio !== null && Math.abs(memRatio - 1) >= 0.1) {
    out.push({
      dim: 'memory',
      equivalentBetter: memRatio > 1,
      summary: `${equivalentProvider} equivalent has ${fmtRatioPhrase(memRatio, 'memory')} (${fmtMem(equivalent.memoryGib)} vs ${fmtMem(baseline.memoryGib)})`,
    });
  }
  // Network Mbps
  const netRatio = cmpRatio(baseline.networkMbps, equivalent.networkMbps);
  if (netRatio !== null && Math.abs(netRatio - 1) >= 0.1) {
    out.push({
      dim: 'network',
      equivalentBetter: netRatio > 1,
      summary: `${equivalentProvider} equivalent has ${fmtRatioPhrase(netRatio, 'network bandwidth')} (${equivalent.networkMbps.toLocaleString()} vs ${baseline.networkMbps.toLocaleString()} Mbps)`,
    });
  }
  // Local storage GiB — both must be non-zero for the comparison to read.
  const lsRatio = cmpRatio(baseline.localStorageGiB, equivalent.localStorageGiB);
  if (lsRatio !== null && Math.abs(lsRatio - 1) >= 0.15) {
    out.push({
      dim: 'localStorage',
      equivalentBetter: lsRatio > 1,
      summary: `${equivalentProvider} equivalent has ${fmtRatioPhrase(lsRatio, 'local storage')} (${(equivalent.localStorageGiB ?? 0).toLocaleString()} vs ${(baseline.localStorageGiB ?? 0).toLocaleString()} GiB)`,
    });
  }
  // Accelerator — categorical, not ratio
  if (
    baseline.acceleratorType !== equivalent.acceleratorType &&
    (baseline.acceleratorType || equivalent.acceleratorType)
  ) {
    out.push({
      dim: 'accelerator',
      equivalentBetter:
        (equivalent.acceleratorType ?? 'None') !== 'None' &&
        (baseline.acceleratorType ?? 'None') === 'None',
      summary: `${equivalentProvider} equivalent accelerator: ${equivalent.acceleratorType ?? 'None'} (vs baseline ${baseline.acceleratorType ?? 'None'})`,
    });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────
function lookupVm(
  vms: UserVm[],
  sku: string,
  regionBias?: string,
): CatalogEntry | null {
  const matches = vms.filter(
    (v) => v.vmSizeName.toLowerCase() === sku.toLowerCase(),
  );
  if (matches.length === 0) return null;
  if (regionBias) {
    const hit = matches.find((m) => (m.region ?? '').toLowerCase() === regionBias.toLowerCase());
    if (hit) return hit;
  }
  return matches[0];
}

function collectRegions(vms: UserVm[], sku: string): Set<string> {
  const out = new Set<string>();
  for (const v of vms) {
    if (v.vmSizeName.toLowerCase() === sku.toLowerCase() && v.region) {
      // Skip AWS Local Zones / Wavelength — they're edge locations, not
      // regions, and would otherwise pad the availability matrix with rows
      // the rest of the dashboard (which excludes them) never shows.
      if (isEdgeRegion(v.provider ?? '', v.region)) continue;
      out.add(v.region);
    }
  }
  return out;
}

/** Copy the winning match's comparability caveats/stretch onto a PriceBar (A2). */
function withCaveats(bar: PriceBar, match: EquivalentMatch): PriceBar {
  if (!match.caveats?.length && !match.stretch) return bar;
  return { ...bar, caveats: match.caveats, stretch: match.stretch };
}

function catalogToBar(row: CatalogEntry, provider: VmProvider): PriceBar {
  return {
    label: `${provider} · ${row.vmSizeName}`,
    provider,
    sku: row.vmSizeName,
    payg: row.hourlyUsd ?? null,
    oneYr: row.riOneYrHourlyUsd ?? null,
    threeYr: row.riThreeYrHourlyUsd ?? null,
    region: row.region,
  };
}

// ────────────────────────────────────────────────────────────────────────
// winnerAnalysis — pros / cons + situational + overall winner.
// Derives per-equivalent strengths/weaknesses from spec dimensions +
// pricing, then picks an overall winner and a few situational champs
// ("best for cost", "best for compute", etc.) so the user can read a
// recommendation at a glance.
// ────────────────────────────────────────────────────────────────────────

export interface VmContender {
  provider: VmProvider;
  sku: string;
  row: CatalogEntry;
  /** Combined pros (better-than-baseline on a dim, or cheapest on price). */
  pros: string[];
  /** Combined cons (worse-than-baseline on a dim, or pricier than peers). */
  cons: string[];
  /** Cumulative score (sum of normalized dim ratios − penalty for price). Higher = better overall. */
  score: number;
}

export interface SituationalWinners {
  /** Cheapest hourly rate (PAYG). */
  cost: VmContender | null;
  /** Highest vCPU. */
  compute: VmContender | null;
  /** Highest memory. */
  memory: VmContender | null;
  /** Highest network Mbps. */
  network: VmContender | null;
  /** Highest cumulative score across all dims + price. */
  overall: VmContender | null;
}

export interface WinnerAnalysis {
  contenders: VmContender[];
  winners: SituationalWinners;
}

export function winnerAnalysis(
  equivalents: EquivalentsResult,
): WinnerAnalysis {
  const contenders: VmContender[] = [];
  // Include baseline (Azure) as one of the contenders so the winner pick
  // is fair across all three providers.
  if (equivalents.baseline) {
    contenders.push({
      provider: 'Azure',
      sku: equivalents.baseline.vmSizeName,
      row: equivalents.baseline,
      pros: [],
      cons: [],
      score: 0,
    });
  }
  const awsPrimary = equivalents.rows.aws.find((m) => m.catalogRow !== null);
  if (awsPrimary?.catalogRow) {
    contenders.push({
      provider: 'AWS',
      sku: awsPrimary.sku,
      row: awsPrimary.catalogRow,
      pros: [],
      cons: [],
      score: 0,
    });
  }
  const gcpPrimary = equivalents.rows.gcp.find((m) => m.catalogRow !== null);
  if (gcpPrimary?.catalogRow) {
    contenders.push({
      provider: 'GCP',
      sku: gcpPrimary.sku,
      row: gcpPrimary.catalogRow,
      pros: [],
      cons: [],
      score: 0,
    });
  }

  // No contenders → empty winners object.
  if (contenders.length === 0) {
    return {
      contenders: [],
      winners: {
        cost: null,
        compute: null,
        memory: null,
        network: null,
        overall: null,
      },
    };
  }

  // ── Situational winners ──────────────────────────────────────────────
  const max = <K extends keyof CatalogEntry>(
    key: K,
    accessor?: (r: CatalogEntry) => number | undefined,
  ): VmContender | null => {
    let best: VmContender | null = null;
    let bestVal = -Infinity;
    for (const c of contenders) {
      const v = (accessor ? accessor(c.row) : c.row[key]) as number | undefined;
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      if (v > bestVal) {
        bestVal = v;
        best = c;
      }
    }
    return best;
  };
  const min = (
    accessor: (r: CatalogEntry) => number | undefined,
  ): VmContender | null => {
    let best: VmContender | null = null;
    let bestVal = Infinity;
    for (const c of contenders) {
      const v = accessor(c.row);
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue;
      if (v < bestVal) {
        bestVal = v;
        best = c;
      }
    }
    return best;
  };

  const computeWin = max('vcpus');
  const memoryWin = max('memoryGib');
  const networkWin = max('networkMbps');
  const costWin = min((r) => r.hourlyUsd);

  // ── Pros / cons per contender ────────────────────────────────────────
  // Reference values = max across contenders for each dim. Anything within
  // ~5% of the max counts as a "leader" pro; anything below ~70% of max is
  // a con. Pricing flipped (cheapest = pro, most expensive = con).
  const maxVcpu = Math.max(...contenders.map((c) => c.row.vcpus || 0));
  const maxMem = Math.max(...contenders.map((c) => c.row.memoryGib || 0));
  const maxNet = Math.max(...contenders.map((c) => c.row.networkMbps || 0));
  const minPrice = costWin?.row.hourlyUsd ?? null;
  const maxPrice = Math.max(
    ...contenders
      .map((c) => c.row.hourlyUsd ?? 0)
      .filter((v) => v > 0),
  );

  for (const c of contenders) {
    // vCPU
    if (c.row.vcpus && maxVcpu > 0) {
      const ratio = c.row.vcpus / maxVcpu;
      if (ratio >= 0.95) c.pros.push(`Most vCPU in this comparison (${c.row.vcpus})`);
      else if (ratio < 0.7) c.cons.push(`${Math.round((1 - ratio) * 100)}% less vCPU than the leader`);
    }
    // Memory
    if (c.row.memoryGib && maxMem > 0) {
      const ratio = c.row.memoryGib / maxMem;
      const memDisp =
        c.row.memoryGib >= 1024
          ? `${(c.row.memoryGib / 1024).toFixed(1)} TiB`
          : `${c.row.memoryGib} GiB`;
      if (ratio >= 0.95) c.pros.push(`Most memory in this comparison (${memDisp})`);
      else if (ratio < 0.7) c.cons.push(`${Math.round((1 - ratio) * 100)}% less memory than the leader`);
    }
    // Network
    if (c.row.networkMbps && maxNet > 0) {
      const ratio = c.row.networkMbps / maxNet;
      if (ratio >= 0.95) c.pros.push(`Highest network bandwidth (${c.row.networkMbps.toLocaleString()} Mbps)`);
      else if (ratio < 0.7) c.cons.push(`${Math.round((1 - ratio) * 100)}% less network bandwidth than the leader`);
    }
    // Price
    if (c.row.hourlyUsd && minPrice !== null && maxPrice > 0) {
      if (c.row.hourlyUsd === minPrice) {
        c.pros.push(`Cheapest PAYG rate ($${c.row.hourlyUsd.toFixed(3)}/hr)`);
      } else if (c.row.hourlyUsd === maxPrice && contenders.length > 1) {
        const pctMore = ((c.row.hourlyUsd - minPrice) / minPrice) * 100;
        c.cons.push(`Most expensive — ${pctMore.toFixed(0)}% more than the cheapest`);
      }
    }
    // Accelerator boost
    if (c.row.acceleratorType && c.row.acceleratorType !== 'None') {
      c.pros.push(`Includes accelerator: ${c.row.acceleratorType}`);
    }
    // Local storage boost (when relevant — non-zero AND notable)
    if (c.row.localStorageGiB && c.row.localStorageGiB >= 1024) {
      c.pros.push(`${c.row.localStorageGiB.toLocaleString()} GiB local NVMe`);
    }
  }

  // ── Overall score: equal-weighted dim ratios − price penalty ─────────
  //   - vCPU / Memory / Network normalize to their max (1.0 = leader)
  //   - Price normalizes inverted: minPrice/price (1.0 = cheapest)
  //   Each dim contributes 25% to the score.
  for (const c of contenders) {
    const v = c.row.vcpus && maxVcpu ? c.row.vcpus / maxVcpu : 0;
    const m = c.row.memoryGib && maxMem ? c.row.memoryGib / maxMem : 0;
    const n = c.row.networkMbps && maxNet ? c.row.networkMbps / maxNet : 0;
    const p =
      c.row.hourlyUsd && minPrice !== null && c.row.hourlyUsd > 0
        ? minPrice / c.row.hourlyUsd
        : 0;
    c.score = (v + m + n + p) / 4;
  }

  // Overall winner = highest score. Kept for callers that still want
  // the single "best" pick, but per v2.16 the page UI no longer surfaces
  // it as a "Top pick" callout — situational tags + "why" summary do
  // that job per contender. So we no longer auto-append a "best overall"
  // pro since it added noise to the pros list.
  let overall: VmContender | null = null;
  for (const c of contenders) {
    if (!overall || c.score > overall.score) overall = c;
  }

  return {
    contenders,
    winners: {
      cost: costWin,
      compute: computeWin,
      memory: memoryWin,
      network: networkWin,
      overall,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────
// timeHorizonCosts — extrapolate per-provider cost over standard horizons.
// ────────────────────────────────────────────────────────────────────────

/** Commitment term the horizon matrix prices at. Structurally identical to the
 *  `Term` union in `utils/costCalculator` — kept local so the pure engine layer
 *  doesn't depend on the UI cost helpers. */
export type HorizonTerm = 'payg' | '1y' | '3y';

export interface HorizonCost {
  provider: VmProvider;
  sku: string;
  /** Monthly cost at the applied rate (selected term, or best-available when no
   *  term is passed). Field name is historical — see `appliedRateLabel`. */
  oneMonthBest: number | null;
  /** 1-year cost at the applied rate. */
  oneYearBest: number | null;
  /** 3-year cost at the applied rate. */
  threeYearBest: number | null;
  /** Same horizons but PAYG-only (no commitment), for the "vs PAYG" delta. */
  oneMonthPayg: number | null;
  oneYearPayg: number | null;
  threeYearPayg: number | null;
  /** Rate actually applied for this row, e.g. "3y RI" / "1y RI" / "PAYG". When a
   *  term is requested but this SKU lacks that RI tier, it falls back to PAYG and
   *  this label says "PAYG" so the row stays honest. */
  bestRateLabel: string;
  /** Comparability caveats carried from the winning EquivalentMatch (A2), so the
   *  horizon cost matrix can flag a row whose SKU is only a confidential-capable
   *  bridge or a cross-category fallback. The baseline row carries none. */
  caveats?: MatchCaveat[];
  /** True when the winning match was a stretch (see EquivalentMatch.stretch). */
  stretch?: boolean;
}

/**
 * Extrapolate per-provider cost over 1-month / 1-year / 3-year horizons.
 *
 * `term` selects the rate tier the whole matrix prices at (driven by the
 * Pricing page's Commitment-term toggle). When omitted, the legacy behaviour
 * applies — each row uses its best available rate (3y RI > 1y RI > PAYG). When
 * a term is given but the SKU has no rate for it, the row falls back to PAYG so
 * a missing RI tier never blanks the whole row; `bestRateLabel` records what was
 * actually applied.
 */
export function timeHorizonCosts(
  equivalents: EquivalentsResult,
  term?: HorizonTerm,
): HorizonCost[] {
  const out: HorizonCost[] = [];
  const push = (
    provider: VmProvider,
    row: CatalogEntry | null,
    sku: string,
    match?: EquivalentMatch,
  ) => {
    const caveats = match?.caveats?.length ? match.caveats : undefined;
    const stretch = match?.stretch || undefined;
    if (!row) {
      out.push({
        provider,
        sku,
        oneMonthBest: null,
        oneYearBest: null,
        threeYearBest: null,
        oneMonthPayg: null,
        oneYearPayg: null,
        threeYearPayg: null,
        bestRateLabel: '—',
        caveats,
        stretch,
      });
      return;
    }
    const payg = row.hourlyUsd ?? null;
    const ry1 = row.riOneYrHourlyUsd ?? null;
    const ry3 = row.riThreeYrHourlyUsd ?? null;
    // Rate applied to every horizon in this row. With a term selected we price at
    // that tier (falling back to PAYG when the SKU lacks it); with no term we use
    // the best available rate as before.
    let bestRate: number | null;
    let bestLabel: string;
    if (term) {
      const termRate = term === '3y' ? ry3 : term === '1y' ? ry1 : payg;
      bestRate = termRate ?? payg;
      bestLabel =
        termRate != null
          ? term === '3y'
            ? '3y RI'
            : term === '1y'
            ? '1y RI'
            : 'PAYG'
          : payg != null
          ? 'PAYG'
          : '—';
    } else {
      bestRate = ry3 ?? ry1 ?? payg;
      bestLabel = ry3 != null ? '3y RI' : ry1 != null ? '1y RI' : payg != null ? 'PAYG' : '—';
    }
    const HOURS_PER_MONTH = 730;
    const HOURS_PER_YEAR = 8760;
    const HOURS_PER_3YEAR = 26280;
    out.push({
      provider,
      sku: row.vmSizeName,
      oneMonthBest: bestRate != null ? bestRate * HOURS_PER_MONTH : null,
      oneYearBest: bestRate != null ? bestRate * HOURS_PER_YEAR : null,
      threeYearBest: bestRate != null ? bestRate * HOURS_PER_3YEAR : null,
      oneMonthPayg: payg != null ? payg * HOURS_PER_MONTH : null,
      oneYearPayg: payg != null ? payg * HOURS_PER_YEAR : null,
      threeYearPayg: payg != null ? payg * HOURS_PER_3YEAR : null,
      bestRateLabel: bestLabel,
      caveats,
      stretch,
    });
  };
  if (equivalents.baseline) push('Azure', equivalents.baseline, equivalents.baseline.vmSizeName);
  const awsP = equivalents.rows.aws.find((m) => m.catalogRow !== null);
  push('AWS', awsP?.catalogRow ?? null, awsP?.sku ?? '', awsP);
  const gcpP = equivalents.rows.gcp.find((m) => m.catalogRow !== null);
  push('GCP', gcpP?.catalogRow ?? null, gcpP?.sku ?? '', gcpP);
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// normalizedRates — $/vCPU·hr and $/GiB·hr per provider (A2).
// The Pricing UI compares clouds on a UNIT basis (a bigger SKU costing more in
// absolute terms isn't "more expensive" per resource). This resolves each
// contender's applied hourly rate EXACTLY as timeHorizonCosts does — same
// `term` selection with a PAYG fallback and the same `rateLabel` — then divides
// by that catalog row's vCPUs and memory. Null-safe: the per-unit figure is null
// when the rate is missing OR the divisor is missing/zero (never a divide-by-0
// or a fabricated number). One row per provider in the equivalents set.
// ────────────────────────────────────────────────────────────────────────
export interface NormalizedRate {
  provider: VmProvider;
  sku: string;
  usdPerVcpuHr: number | null;
  usdPerGibHr: number | null;
  /** The rate tier actually applied — same semantics as HorizonCost.bestRateLabel
   *  ("3y RI" / "1y RI" / "PAYG" / "—"). */
  rateLabel: string;
}

/** Resolve the applied hourly rate + its label for a row, mirroring
 *  timeHorizonCosts' term selection + PAYG fallback. */
function appliedRate(
  row: CatalogEntry,
  term?: HorizonTerm,
): { rate: number | null; label: string } {
  const payg = row.hourlyUsd ?? null;
  const ry1 = row.riOneYrHourlyUsd ?? null;
  const ry3 = row.riThreeYrHourlyUsd ?? null;
  if (term) {
    const termRate = term === '3y' ? ry3 : term === '1y' ? ry1 : payg;
    const rate = termRate ?? payg;
    const label =
      termRate != null
        ? term === '3y'
          ? '3y RI'
          : term === '1y'
          ? '1y RI'
          : 'PAYG'
        : payg != null
        ? 'PAYG'
        : '—';
    return { rate, label };
  }
  const rate = ry3 ?? ry1 ?? payg;
  const label = ry3 != null ? '3y RI' : ry1 != null ? '1y RI' : payg != null ? 'PAYG' : '—';
  return { rate, label };
}

export function normalizedRates(
  equivalents: EquivalentsResult,
  term?: HorizonTerm,
): NormalizedRate[] {
  const out: NormalizedRate[] = [];
  const push = (provider: VmProvider, row: CatalogEntry | null, sku: string) => {
    if (!row) {
      out.push({ provider, sku, usdPerVcpuHr: null, usdPerGibHr: null, rateLabel: '—' });
      return;
    }
    const { rate, label } = appliedRate(row, term);
    const vcpus = row.vcpus > 0 ? row.vcpus : null;
    const mem = row.memoryGib > 0 ? row.memoryGib : null;
    out.push({
      provider,
      sku: row.vmSizeName,
      usdPerVcpuHr: rate != null && vcpus != null ? rate / vcpus : null,
      usdPerGibHr: rate != null && mem != null ? rate / mem : null,
      rateLabel: label,
    });
  };
  if (equivalents.baseline) push('Azure', equivalents.baseline, equivalents.baseline.vmSizeName);
  const awsP = equivalents.rows.aws.find((m) => m.catalogRow !== null);
  push('AWS', awsP?.catalogRow ?? null, awsP?.sku ?? '');
  const gcpP = equivalents.rows.gcp.find((m) => m.catalogRow !== null);
  push('GCP', gcpP?.catalogRow ?? null, gcpP?.sku ?? '');
  return out;
}

function fmtRatio(r: number): string {
  if (r >= 1) return `${r.toFixed(r >= 10 ? 0 : 1)}×`;
  return `${Math.round((1 - r) * 100)}% less`;
}

/**
 * Returns a phrase that drops into "has ___" cleanly for both ratio
 * directions:
 *   ratio ≥ 1 → "2× the memory"   ("has 2× the memory")
 *   ratio < 1 → "47% less memory" ("has 47% less memory")
 */
function fmtRatioPhrase(r: number, noun: string): string {
  if (r >= 1) return `${r.toFixed(r >= 10 ? 0 : 1)}× the ${noun}`;
  return `${Math.round((1 - r) * 100)}% less ${noun}`;
}

function fmtMem(gib: number): string {
  if (gib >= 1024) return `${(gib / 1024).toFixed(1)} TiB`;
  return `${gib.toLocaleString()} GiB`;
}

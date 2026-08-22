/**
 * crossCloudEquivalency — pure, memo-friendly builder for the Region
 * Availability "Cross-cloud equivalents" table panel (v2.33).
 *
 * Given the in-scope catalog (`filteredVms`) + the chosen base cloud, it
 * derives THREE row-sections — Category → VM Family → VM Size — each shaped
 * one-column-per-active-provider, where the base column reads 100% and every
 * other provider's cell carries its closest EQUIVALENT for that row + a % match
 * (`matchPct` of the `bestVmMatch` distance, the same engine the
 * VmEquivalencyTable uses). Rows come from the BASE provider's distinct items
 * within the current filter scope, so the panel stays dynamic + scoped.
 *
 * Design rules (confirmed):
 *  - Base column = the base item itself, pct 100, on EVERY row (incl. Category).
 *  - Other provider's cell = its closest same-category equivalent + pct; null
 *    ("—") when that provider has no candidate (no fabrication).
 *  - CATEGORY row: the equivalent IS the same canonical category (categories
 *    are cross-cloud), and its pct = the MEAN of the family matchPcts within
 *    that category for that provider vs base — a real signal, not a constant.
 *  - Families + sizes are capped (top-N by VM count) with `totalFamilies` /
 *    `totalSizes` so the UI can show "+N more".
 *
 * The match work is bounded: we take ONE representative VM per base
 * family/size and run `bestVmMatch` against ONE representative VM per candidate
 * family (or each candidate provider's distinct sizes) — never an all-pairs
 * sweep over the 90k-row catalog (mirrors VmEquivalencyTable's approach).
 */
import type { CatalogEntry } from '../types';
import { categorize, matchCategory } from './vmCategory';
import { vmFamily } from './vmTaxonomy';
import {
  bestVmMatch,
  topVmMatches,
  matchPct,
  vmFeatures,
  vmDistance,
  CONFIDENTIAL_PEER_PENALTY,
} from './equivalence';
import { isConfidentialCapable } from './acceleratorSpecs';
import { matchCaveats, isStretch, type MatchCaveat } from './matchCaveats';

export type Provider = 'Azure' | 'AWS' | 'GCP';

export interface Cell {
  label: string; // the equivalent item's display name (category / family / size)
  value: string; // the chip value to toggle (category name, family, or size)
  pct: number; // 0–100 similarity vs the base item (base column = 100)
  /** True when this equivalent had to cross the category gate to be found — i.e.
   *  the provider has NO same-category candidate in scope (usually because the
   *  user scoped that cloud to a different category), so we fell back to its
   *  closest in-scope analog at a penalty. Lets the UI flag it. */
  crossCategory?: boolean;
  /** The analog's REAL vendor-label category when it differs from the base's —
   *  e.g. a GCP `n2-highmem` analog for an Azure memory-optimized base reads
   *  `analogCategory: 'General Purpose'`. Drives the "via <Category>" tag. */
  analogCategory?: string;
  /** Up to a couple of "suggested next best" alternatives after the #1 match,
   *  nearest first. SIZE cells carry these so the UI can show greyed inline
   *  runner-ups (the user picks one comparison line at a time, so these are
   *  informational, never highlighted). */
  alts?: { label: string; value: string; pct: number }[];
  /** Comparability caveats for this analog vs the base item (A1/A2). Populated
   *  for every NON-BASE cell — honest asterisks that a high % still hides a
   *  materially different KIND of machine (category fallback, confidential peer,
   *  stretch size, burstable, arch, …). Empty/undefined = clean like-for-like. */
  caveats?: MatchCaveat[];
  /** True when the caveats mark this a "stretch" (size stretch or category
   *  fallback) — closest thing on the other cloud, not a like-for-like swap. */
  stretch?: boolean;
}

/**
 * Distance penalty (normalized units) added when an equivalent is found ONLY by
 * crossing the category gate. ~0.25 → a spec-identical cross-category analog
 * reads ≈75% ("a usable fallback, not a like-for-like match"). Applied ONLY as a
 * fallback when a cloud has no same-category candidate in scope, so the
 * same-category hard gate is fully preserved whenever it CAN be satisfied.
 */
export const CROSS_CATEGORY_PENALTY = 0.25;

// ── Fallback ladder (A2) ─────────────────────────────────────────────────────
// Every place that picks a per-provider best analog for a base item follows the
// SAME 3-rung ladder so behavior is uniform:
//   Rung 1 — same matchCategory pool (the hard gate). Unchanged results.
//   Rung 2 — base matchCategory === 'Confidential' AND rung 1 empty: pool =
//            provider's confidential-CAPABLE candidates, priced at the softer
//            CONFIDENTIAL_PEER_PENALTY (a capable peer is closer than a random
//            cross-category size). Marked ctx.confidentialPeer.
//   Rung 3 — still empty: the provider's full in-scope pool at
//            CROSS_CATEGORY_PENALTY. Marked ctx.crossCategory.
// A rung is "empty" when its candidate pool has no member, so a non-Confidential
// base whose rung-1 pool is non-empty NEVER reaches rung 2/3 and its results are
// byte-identical to before this change.
type CaveatCtx = { crossCategory?: boolean; confidentialPeer?: boolean };
interface LadderStage {
  pool: CatalogEntry[];
  opts?: { crossCategoryPenalty?: number };
  ctx: CaveatCtx;
}

/** The ordered fallback stages for a base item of effective category `category`
 *  against provider `p`'s in-scope pools. `sameCatPool` is rung 1 (already gated);
 *  `fullPool` is the provider's full in-scope specs (rung 3, and — by default —
 *  also the source rung 2 filters for confidential-capable peers).
 *
 *  S65 — `confidentialPool` (optional) overrides ONLY rung 2's candidate source:
 *  a confidential base's capable PEERS (AWS m6a/c6a/r6a etc.) carry a NON-
 *  confidential display category, so the ② category filter — which narrows every
 *  cloud in the scoped view — drops them from `fullPool` before the ladder runs,
 *  silently degrading rung-2 (confidential-feature-peer ~89%) to rung-3 (different
 *  category ~72-77%). Passing the region-scoped-but-category-unfiltered pool here
 *  restores rung 2's reach WITHOUT touching rung 3 (which keeps `fullPool`), so
 *  the ONLY behavior change is the intended confidential bridge; non-confidential
 *  cross-category fallbacks are byte-identical.
 *
 *  Returns rung 1 first; rungs 2/3 are only appended when they could apply, and
 *  callers try them in order only if the previous rung produced no match. */
function ladderStages(
  category: string,
  sameCatPool: CatalogEntry[],
  fullPool: CatalogEntry[],
  confidentialPool?: CatalogEntry[],
): LadderStage[] {
  const stages: LadderStage[] = [{ pool: sameCatPool, ctx: {} }];
  if (category === 'Confidential') {
    stages.push({
      pool: (confidentialPool ?? fullPool).filter((v) => isConfidentialCapable(v)),
      opts: { crossCategoryPenalty: CONFIDENTIAL_PEER_PENALTY },
      ctx: { confidentialPeer: true },
    });
  }
  stages.push({
    pool: fullPool,
    opts: { crossCategoryPenalty: CROSS_CATEGORY_PENALTY },
    ctx: { crossCategory: true },
  });
  return stages;
}

/** Compute caveats + stretch for a resolved (base, analog) pair given ladder ctx
 *  + the winning distance. Returns the pair to spread onto a Cell / match. */
function caveatFields(
  baseVm: CatalogEntry,
  analogVm: CatalogEntry,
  ctx: CaveatCtx,
  distance: number,
): { caveats: MatchCaveat[]; stretch: boolean } {
  const caveats = matchCaveats(baseVm, analogVm, { ...ctx, distance });
  return { caveats, stretch: isStretch(caveats) };
}

export interface Row {
  baseLabel: string; // base provider's display label for this row
  baseValue: string; // base provider's chip value for this row
  cells: Record<Provider, Cell | null>; // one per provider; null = no equivalent
}

export interface EquivalencyRows {
  categories: Row[];
  families: Row[];
  sizes: Row[];
  totalFamilies: number; // distinct base families in scope (for "+N more")
  totalSizes: number; // distinct base sizes in scope
}

export interface BuildArgs {
  /** Full catalog — not strictly needed today but kept for parity with the
   *  panel props + future cross-checks. */
  userVms: CatalogEntry[];
  /** The in-scope catalog after the chip filter (drives the rows). */
  filteredVms: CatalogEntry[];
  /** Selected providers, in display order (base first is not required). */
  activeProviders: Provider[];
  base: Provider;
  /** Max VM-SIZE rows to build (the UI raises this when the user expands the
   *  size list). Defaults to SIZE_CAP. `totalSizes` always reflects the full
   *  in-scope count regardless of this limit. */
  sizeLimit?: number;
  /** Max VM-FAMILY rows to build (the UI raises this when the user expands the
   *  family list). Defaults to FAMILY_CAP. `totalFamilies` always reflects the
   *  full in-scope count regardless of this limit; the category-row means still
   *  accumulate over EVERY family (the cap only bounds what's rendered). */
  familyLimit?: number;
  /** S65 — EXPLICIT region scope for the ladder fallback pool, per provider. The
   *  fallback pool (rungs 2 & 3) is drawn from the FULL provider catalog
   *  (`userVms`) restricted ONLY by the user's ACTUAL region pick — never inferred
   *  from `filteredVms`. A provider's value:
   *   - `[region]` — the user picked exactly that region → fallback restricted to it.
   *   - `null` / `undefined` / omitted — NO region restriction (the display layer
   *     region-matches analogs per the S63 doctrine, so the pool must stay wide).
   *  When a provider's actual region restriction yields ZERO rows, its fallback
   *  pool is empty → an honest "no analog in scope" (never a full-catalog leak).
   *  Prior behavior INFERRED scope from `filteredVms`, which (a) leaked to the full
   *  multi-region catalog for a region-empty cloud, and (b) shrank to a narrowed
   *  family's region footprint when the user filtered by family without a region. */
  regionScopeByProvider?: Partial<Record<Provider, string[] | null>>;
}

/** Caps — keep the table readable; the UI surfaces the remainder count. */
export const FAMILY_CAP = 12;
export const SIZE_CAP = 12;

// Category used for MATCHING + candidate bucketing — `matchCategory` upgrades
// GCP `-highmem` sizes to Memory Optimized so a small Azure E finds GCP
// n2-highmem (its true peer), not just the huge m-series.
function catOf(v: CatalogEntry): string {
  return matchCategory(v);
}
// The real vendor-label category, for the cross-category transparency tag.
function displayCatOf(v: CatalogEntry): string {
  return v.category ?? categorize(v.provider, v.family);
}

/** Distinct specs (deduped by size name) for one provider, region-free. */
function distinctSpecs(vms: CatalogEntry[], provider: Provider): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const v of vms) {
    if (v.provider !== provider) continue;
    if (seen.has(v.vmSizeName)) continue;
    seen.add(v.vmSizeName);
    out.push(v);
  }
  return out;
}

/** One representative VM per family for a provider (the most common — highest
 *  count — so the family's match is computed off a typical member). */
function familyReps(specs: CatalogEntry[]): Map<string, CatalogEntry> {
  // pick the family's median-ish member by vCPU so a rep isn't an outlier.
  const byFam = new Map<string, CatalogEntry[]>();
  for (const v of specs) {
    const fam = vmFamily(v);
    if (!fam) continue;
    const arr = byFam.get(fam);
    if (arr) arr.push(v);
    else byFam.set(fam, [v]);
  }
  const reps = new Map<string, CatalogEntry>();
  for (const [fam, arr] of byFam) {
    const sorted = [...arr].sort((a, b) => a.vcpus - b.vcpus);
    reps.set(fam, sorted[Math.floor(sorted.length / 2)]);
  }
  return reps;
}

/** Count of distinct sizes per family for a provider, for top-N ranking. */
function familyCounts(specs: CatalogEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of specs) {
    const fam = vmFamily(v);
    if (!fam) continue;
    counts.set(fam, (counts.get(fam) ?? 0) + 1);
  }
  return counts;
}

/**
 * Build the three row-sections. Pure; safe to memoize on (filteredVms,
 * activeProviders, base).
 */
export function buildEquivalencyRows({
  userVms,
  filteredVms,
  activeProviders,
  base,
  sizeLimit,
  familyLimit,
  regionScopeByProvider,
}: BuildArgs): EquivalencyRows {
  const sizeCap = sizeLimit ?? SIZE_CAP;
  const familyCap = familyLimit ?? FAMILY_CAP;
  const empty: EquivalencyRows = {
    categories: [],
    families: [],
    sizes: [],
    totalFamilies: 0,
    totalSizes: 0,
  };
  if (!activeProviders.includes(base)) return empty;

  // Distinct specs per active provider (computed once).
  const specs: Record<Provider, CatalogEntry[]> = { Azure: [], AWS: [], GCP: [] };
  // Candidates grouped by canonical category per provider — the equivalent
  // search is GATED to the same category as the base item, so a memory family
  // never "matches" a compute family at a nonsense low %. (Mirrors the
  // category-hard-gate doctrine the Competitive page's equivalence uses.)
  const specsByCat: Record<Provider, Map<string, CatalogEntry[]>> = {
    Azure: new Map(),
    AWS: new Map(),
    GCP: new Map(),
  };
  // S65 — FALLBACK POOL (ladder rungs 2 & 3). `filteredVms` narrows EVERY
  // provider by the ② category/family picks, so a non-base cloud scoped away from
  // (or simply not showing) the base's category is category-empty here. That's
  // correct for rung 1 (the same-category hard gate), but it also strips the
  // ladder's fallback pool of the very families it exists to reach — e.g. a base
  // Azure DC* (Confidential) whose AWS confidential-capable PEERS (m6a/c6a/r6a,
  // labeled General Purpose / Compute / Memory Optimized) are dropped before
  // rung 2 runs. FIX: draw the fallback pool from the FULL provider catalog
  // (`userVms`), restricted ONLY by the user's ACTUAL region pick
  // (`regionScopeByProvider[p]`) — never by scope INFERRED from `filteredVms`.
  //
  // Prior code inferred region scope from `filteredVms`, which had two verified
  // failure modes: (a) a non-base cloud with ZERO rows in the scoped view yielded
  // a null inference → the fallback pool became the FULL multi-region catalog,
  // suggesting analogs that silently ignored the user's region pick; and (b) with
  // NO region pick but a family narrowing, the inferred set became the narrowed
  // family's region footprint → the true same-category peer OUTSIDE that footprint
  // went invisible. Using the explicit region pick fixes both:
  //   - region picked → restrict to it; ZERO rows after → honest empty pool ("no
  //     analog in scope"), not a full-catalog leak.
  //   - no region pick (null/undefined) → NO region restriction (the display layer
  //     region-matches per the S63 doctrine).
  // Rung 1 stays on the category-scoped `specs[p]`, so same-category results are
  // byte-identical; only the fallback rungs change reach.
  const fullUserVms = userVms ?? filteredVms;
  for (const p of activeProviders) {
    specs[p] = distinctSpecs(filteredVms, p);
    for (const v of specs[p]) {
      const c = catOf(v);
      const arr = specsByCat[p].get(c);
      if (arr) arr.push(v);
      else specsByCat[p].set(c, [v]);
    }
  }
  // Region-scoped-but-category-unfiltered distinct specs per provider, for the
  // ladder fallback rungs. The ONLY restriction is the user's explicit region pick.
  const fallbackPool: Record<Provider, CatalogEntry[]> = { Azure: [], AWS: [], GCP: [] };
  for (const p of activeProviders) {
    const pickedRegions = regionScopeByProvider?.[p];
    const regionSet =
      pickedRegions && pickedRegions.length > 0 ? new Set(pickedRegions) : null;
    const inScope = fullUserVms.filter(
      (v) =>
        v.provider === p &&
        // A picked region restricts the pool; a null/empty pick means no restriction.
        // A row with no region tag is never dropped by a region pick (region-free
        // seed rows stay eligible so the pool is never falsely emptied).
        (regionSet == null || v.region == null || regionSet.has(v.region)),
    );
    fallbackPool[p] = distinctSpecs(inScope, p);
  }
  // S65 (Bug 1/3) — RUNG-1 same-category pool for the NON-BASE clouds is drawn
  // from the region-scoped-but-category-UNFILTERED pool, not the ② category/family
  // narrowing. The panel's job is to SUGGEST the closest cross-cloud analog for
  // each base row; narrowing a non-base cloud to (say) HPC or General Purpose must
  // HIGHLIGHT that cloud's picks — it must NOT strip the base category's real
  // same-category peers from rung 1. Before this, an Azure E (Memory Optimized)
  // base against a GCP/AWS column scoped to HPC found NO rung-1 MO peer, fell to
  // rung-3 cross-category, and offered `hpc7g.4xlarge` / `h3-standard-88` at ~0-2%
  // as the top "best match" (the column-top "+" then added that garbage). Drawing
  // rung 1 from the category-unfiltered pool restores the true MO analog
  // (n2-highmem / c2d-highmem ≈ 90%+). The BASE keeps its own narrowed `specsByCat`
  // (its picks define the rows). Same-category results for an unnarrowed view are
  // unchanged (the fallback pool ⊇ the scoped pool).
  const fallbackByCat: Record<Provider, Map<string, CatalogEntry[]>> = {
    Azure: new Map(),
    AWS: new Map(),
    GCP: new Map(),
  };
  for (const p of activeProviders) {
    for (const v of fallbackPool[p]) {
      const c = catOf(v);
      const arr = fallbackByCat[p].get(c);
      if (arr) arr.push(v);
      else fallbackByCat[p].set(c, [v]);
    }
  }
  const candidatesFor = (p: Provider, category: string): CatalogEntry[] =>
    (p === base ? specsByCat[p] : fallbackByCat[p]).get(category) ?? [];
  const others = activeProviders.filter((p) => p !== base);
  const baseSpecs = specs[base];

  // ── FAMILY rows ──────────────────────────────────────────────────────────
  // base families ranked by distinct-size count, capped.
  const baseFamCounts = familyCounts(baseSpecs);
  // Base specs grouped by family → all member sizes, so a family's equivalent is
  // scored by its BEST achievable size-pair (any base member × any candidate
  // member), NOT a single median representative. This is the SAME metric the
  // Competitive family chip uses (rankedFamiliesVsBase) — so the panel rows and
  // the chip ≈% agree by construction (v2.42; closes the S48 rep-vs-best-pair
  // inconsistency).
  const baseMembersByFam = new Map<string, CatalogEntry[]>();
  for (const v of baseSpecs) {
    const f = vmFamily(v);
    if (!f) continue;
    const arr = baseMembersByFam.get(f);
    if (arr) arr.push(v);
    else baseMembersByFam.set(f, [v]);
  }
  const allBaseFamilies = [...baseMembersByFam.keys()].sort(
    (a, b) => (baseFamCounts.get(b) ?? 0) - (baseFamCounts.get(a) ?? 0) || a.localeCompare(b),
  );
  const totalFamilies = allBaseFamilies.length;

  // Best equivalent FAMILY for a base family's members among a candidate `pool`,
  // by best size-pair distance. `opts` flows to bestVmMatch — pass the
  // cross-category penalty for the fallback pool. Returns the family label + pct
  // PLUS the winning (base member, candidate) pair + raw distance so callers can
  // compute the real per-analog caveats.
  interface FamilyPick {
    cell: Cell;
    baseMember: CatalogEntry;
    analog: CatalogEntry;
    distance: number;
  }
  const bestFamilyCellFrom = (
    members: CatalogEntry[],
    pool: CatalogEntry[],
    opts?: { crossCategoryPenalty?: number },
  ): FamilyPick | null => {
    const byFam = new Map<string, CatalogEntry[]>();
    for (const v of pool) {
      const f = vmFamily(v);
      if (!f) continue;
      const arr = byFam.get(f);
      if (arr) arr.push(v);
      else byFam.set(f, [v]);
    }
    let bestFam: string | null = null;
    let bestDist = Infinity;
    let bestBaseMember: CatalogEntry | null = null;
    let bestAnalog: CatalogEntry | null = null;
    for (const [f, arr] of byFam) {
      let d = Infinity;
      let famBaseMember: CatalogEntry | null = null;
      let famAnalog: CatalogEntry | null = null;
      for (const bm of members) {
        const m = bestVmMatch(bm, arr, opts);
        if (m && m.distance < d) {
          d = m.distance;
          famBaseMember = bm;
          famAnalog = m.vm;
        }
      }
      if (d < bestDist) {
        bestDist = d;
        bestFam = f;
        bestBaseMember = famBaseMember;
        bestAnalog = famAnalog;
      }
    }
    if (bestFam == null || !Number.isFinite(bestDist) || !bestBaseMember || !bestAnalog) return null;
    return {
      cell: {
        label: bestFam,
        value: bestFam,
        pct: matchPct(bestDist),
        crossCategory: (opts?.crossCategoryPenalty ?? 0) > 0,
      },
      baseMember: bestBaseMember,
      analog: bestAnalog,
      distance: bestDist,
    };
  };

  // 3-rung fallback ladder (A2): same-category (rung 1) → confidential-capable
  // peer at CONFIDENTIAL_PEER_PENALTY (rung 2, Confidential base only) → full
  // in-scope pool at CROSS_CATEGORY_PENALTY (rung 3). Non-Confidential bases with
  // a non-empty rung-1 pool never leave rung 1, so results stay byte-identical.
  // `p` here is always a NON-base provider (called only in the `others` loops), so
  // rung 3 (the cross-category last resort) draws from the wider category-unfiltered
  // `fallbackPool[p]` too — a non-base cloud narrowed away from the base category
  // must still reach its full catalog for the fallback, never the ②-narrowed subset.
  const bestFamilyCell = (members: CatalogEntry[], category: string, p: Provider): Cell | null => {
    for (const stage of ladderStages(category, candidatesFor(p, category), fallbackPool[p], fallbackPool[p])) {
      const pick = bestFamilyCellFrom(members, stage.pool, stage.opts);
      if (!pick) continue;
      const { caveats, stretch } = caveatFields(
        pick.baseMember,
        pick.analog,
        stage.ctx,
        pick.distance,
      );
      return { ...pick.cell, caveats, stretch };
    }
    return null;
  };

  // We also accumulate per-(provider, category) family-match pcts so the
  // CATEGORY rows can report the MEAN match within each category. `anySameCat`
  // tracks whether at least one contributing family was a true same-category
  // match, so the category cell can flag itself cross-category when every family
  // it summarizes was a penalized fallback.
  const catPctAccum: Record<Provider, Map<string, { pcts: number[]; anySameCat: boolean }>> = {
    Azure: new Map(),
    AWS: new Map(),
    GCP: new Map(),
  };

  const familyRows: Row[] = [];
  for (const fam of allBaseFamilies) {
    const members = baseMembersByFam.get(fam)!;
    const category = catOf(members[0]);
    const cells: Record<Provider, Cell | null> = { Azure: null, AWS: null, GCP: null };
    cells[base] = { label: fam, value: fam, pct: 100 };
    for (const p of others) {
      const cell = bestFamilyCell(members, category, p);
      cells[p] = cell;
      if (cell) {
        // record for the category mean
        const accum = catPctAccum[p].get(category);
        if (accum) {
          accum.pcts.push(cell.pct);
          if (!cell.crossCategory) accum.anySameCat = true;
        } else {
          catPctAccum[p].set(category, { pcts: [cell.pct], anySameCat: !cell.crossCategory });
        }
      }
    }
    if (familyRows.length < familyCap) {
      familyRows.push({ baseLabel: fam, baseValue: fam, cells });
    }
  }

  // ── CATEGORY rows ────────────────────────────────────────────────────────
  // distinct base categories in scope; the equivalent is the SAME category,
  // pct = mean of the family matchPcts in that category for each provider.
  const baseCategories = [...new Set(baseSpecs.map(catOf))].filter(Boolean).sort();
  const categoryRows: Row[] = baseCategories.map((category) => {
    const cells: Record<Provider, Cell | null> = { Azure: null, AWS: null, GCP: null };
    cells[base] = { label: category, value: category, pct: 100 };
    for (const p of others) {
      const acc = catPctAccum[p].get(category);
      if (!acc || acc.pcts.length === 0) {
        // No family matched on this provider at all → no equivalent.
        cells[p] = null;
        continue;
      }
      const mean = Math.round(acc.pcts.reduce((s, x) => s + x, 0) / acc.pcts.length);
      // Category-aggregate rows have no single (base, analog) pair, so caveats
      // come from ctx only: a category-fallback caveat when EVERY family that
      // summarized to this category was a penalized (cross-category) fallback.
      const crossCat = !acc.anySameCat;
      const caveats: MatchCaveat[] = crossCat
        ? [
            {
              kind: 'category-fallback',
              severity: 'warn',
              label: 'Different category',
              detail: `No same-category ${category} family on ${p} in scope — every match is a cross-category fallback.`,
            },
          ]
        : [];
      cells[p] = {
        label: category,
        value: category,
        pct: mean,
        crossCategory: crossCat,
        caveats: caveats.length ? caveats : undefined,
        stretch: isStretch(caveats),
      };
    }
    return { baseLabel: category, baseValue: category, cells };
  });

  // ── SIZE rows ────────────────────────────────────────────────────────────
  // Order sizes ROUND-ROBIN across base families (each family's sizes sorted by
  // vCPU), so a multi-family base selection shows EVERY picked family within the
  // cap — not just the family with the smallest VMs. (Bug: with E + M-Series
  // both picked, a flat vCPU-ascending sort filled the cap with tiny E sizes and
  // buried every M-Series size past "+N more".) A single base family collapses
  // to plain vCPU order.
  const sizesByFamily = new Map<string, CatalogEntry[]>();
  for (const v of baseSpecs) {
    const f = vmFamily(v) ?? v.vmSizeName;
    const arr = sizesByFamily.get(f);
    if (arr) arr.push(v);
    else sizesByFamily.set(f, [v]);
  }
  const sizeByVcpu = (a: CatalogEntry, b: CatalogEntry) =>
    a.vcpus - b.vcpus || a.memoryGib - b.memoryGib || a.vmSizeName.localeCompare(b.vmSizeName);
  for (const arr of sizesByFamily.values()) arr.sort(sizeByVcpu);
  // Family groups in the SAME order as the FAMILY rows (most-equivalent first),
  // so the size list leads with the families the user is most likely after.
  const sizeFamilyOrder = allBaseFamilies.filter((f) => sizesByFamily.has(f));
  for (const f of sizesByFamily.keys()) {
    if (!sizeFamilyOrder.includes(f)) sizeFamilyOrder.push(f);
  }
  const allBaseSizes: CatalogEntry[] = [];
  for (let i = 0; allBaseSizes.length < baseSpecs.length; i++) {
    let advanced = false;
    for (const f of sizeFamilyOrder) {
      const v = sizesByFamily.get(f)![i];
      if (v) {
        allBaseSizes.push(v);
        advanced = true;
      }
    }
    if (!advanced) break;
  }
  const totalSizes = allBaseSizes.length;
  const sizeRows: Row[] = [];
  for (const baseVm of allBaseSizes) {
    if (sizeRows.length >= sizeCap) break;
    const cells: Record<Provider, Cell | null> = { Azure: null, AWS: null, GCP: null };
    cells[base] = { label: baseVm.vmSizeName, value: baseVm.vmSizeName, pct: 100 };
    const sizeCategory = catOf(baseVm);
    for (const p of others) {
      // 3-rung ladder (A2): same-category (rung 1) → confidential-capable peer
      // (rung 2, Confidential base) → full in-scope pool (rung 3). Pull the top 3
      // per rung so the cell can show the #1 match + a couple of greyed next-best.
      // Non-Confidential bases with a non-empty rung-1 pool stay on rung 1 →
      // byte-identical to before.
      let top: ReturnType<typeof topVmMatches> = [];
      let ctx: CaveatCtx = {};
      let crossCat = false;
      // `p` is a NON-base provider — rung 3 draws from `fallbackPool[p]` (see the
      // family-cell note above), so a column scoped away from the base category
      // never stretches to a ~0% HPC/GPU cross-category "best match".
      for (const stage of ladderStages(sizeCategory, candidatesFor(p, sizeCategory), fallbackPool[p], fallbackPool[p])) {
        top = topVmMatches(baseVm, stage.pool, 3, stage.opts);
        if (top.length > 0) {
          ctx = stage.ctx;
          crossCat = !!(stage.ctx.crossCategory || stage.ctx.confidentialPeer);
          break;
        }
      }
      if (top.length === 0) {
        cells[p] = null;
        continue;
      }
      // Cross-category tag: when the chosen analog's REAL (display) category
      // differs from the base's — covers BOTH the penalty fallback AND the
      // GCP-highmem case (matched as Memory Optimized but labeled General
      // Purpose). The `via <Category>` tag names where it came from.
      const analogDisp = displayCatOf(top[0].vm);
      const baseDisp = displayCatOf(baseVm);
      const crossDisp = crossCat || analogDisp !== baseDisp;
      const { caveats, stretch } = caveatFields(baseVm, top[0].vm, ctx, top[0].distance);
      cells[p] = {
        label: top[0].vm.vmSizeName,
        value: top[0].vm.vmSizeName,
        pct: matchPct(top[0].distance),
        crossCategory: crossDisp,
        analogCategory: crossDisp ? analogDisp : undefined,
        alts: top.slice(1).map((m) => ({
          label: m.vm.vmSizeName,
          value: m.vm.vmSizeName,
          pct: matchPct(m.distance),
        })),
        caveats: caveats.length ? caveats : undefined,
        stretch,
      };
    }
    sizeRows.push({ baseLabel: baseVm.vmSizeName, baseValue: baseVm.vmSizeName, cells });
  }

  return {
    categories: categoryRows,
    families: familyRows,
    sizes: sizeRows,
    totalFamilies,
    totalSizes,
  };
}

// ── Insights (the side-card) ─────────────────────────────────────────────────
// Given the already-built rows, surface for each NON-base provider the single
// most-similar Category / VM Family / VM Size — a quick "here's your closest
// landing" read. When the user has selected specific base size models, the
// size insight is scoped to those (so it answers "for what I picked"); else it
// reports the closest size anywhere in scope.

export interface InsightLine {
  /** The equivalent item's display name on the other cloud. */
  label: string;
  /** % similarity vs the base item. */
  pct: number;
  /** The base item this is the closest analog of (for "X ≈ Y" context). */
  baseLabel: string;
  /** When the closest analog comes from a DIFFERENT display category than the
   *  base (e.g. a GCP `n2-highmem` analog labeled "General Purpose"), the real
   *  category — drives the insights-pane "gap" note. */
  analogCategory?: string;
}

export interface ProviderInsight {
  provider: Provider;
  category: InsightLine | null;
  family: InsightLine | null;
  size: InsightLine | null;
}

/** Highest-pct cell for `provider` across `list`, optionally restricted to
 *  rows whose base value is in `only`. Returns null when nothing qualifies. */
function bestLine(
  list: Row[],
  provider: Provider,
  only?: Set<string>,
): InsightLine | null {
  let best: InsightLine | null = null;
  for (const row of list) {
    if (only && only.size > 0 && !only.has(row.baseValue)) continue;
    const cell = row.cells[provider];
    if (!cell) continue;
    if (!best || cell.pct > best.pct) {
      best = {
        label: cell.label,
        pct: cell.pct,
        baseLabel: row.baseLabel,
        analogCategory: cell.crossCategory ? cell.analogCategory : undefined,
      };
    }
  }
  return best;
}

// ── Ranked family alternatives ───────────────────────────────────────────────
// When the user picks a BASE family, the base-anchored "single closest" view
// hides the other candidates. This ranks EVERY in-scope family in each other
// cloud by similarity to the base family — so the user sees the best match AND
// the alternatives (maybe a non-closest family suits them better), narrowing as
// they filter. Same-category hard gate; each family scores by its best-matching
// member vs the base family's representative.

export interface RankedFamily {
  family: string;
  pct: number;
}

export function rankedFamiliesVsBase(
  filteredVms: CatalogEntry[],
  base: Provider,
  baseFamily: string,
  others: Provider[],
  cap = FAMILY_CAP,
  // S65 (Fix 2) — the region-scoped-but-category-UNFILTERED catalog. When the base
  // is Confidential and the ② category filter has narrowed every cloud to
  // Confidential, `filteredVms` no longer holds the confidential-CAPABLE peers
  // (m6a/c6a/r6a — labeled GP/CO/MO), so rung 2 would find an empty pool and the
  // ranking would degrade to a rung-3 cross-category match (~72-77%) instead of the
  // rung-2 confidential-feature-peer (~89%) the equivalents table now bridges to.
  // Passing the full pool restores rung 2's reach WITHOUT touching rung 1 (the
  // same-category families, still from `filteredVms`) or rung 3 (also `filteredVms`),
  // so a NON-confidential base is byte-identical. Defaults to `filteredVms`.
  fullVms: CatalogEntry[] = filteredVms,
): {
  byProvider: Record<Provider, RankedFamily[]>;
  totalByProvider: Record<Provider, number>;
} {
  const byProvider: Record<Provider, RankedFamily[]> = { Azure: [], AWS: [], GCP: [] };
  const totalByProvider: Record<Provider, number> = { Azure: 0, AWS: 0, GCP: 0 };

  const baseSpecs = distinctSpecs(filteredVms, base);
  const baseRep = familyReps(baseSpecs).get(baseFamily);
  if (!baseRep) return { byProvider, totalByProvider };
  const category = catOf(baseRep);
  // v2.41 — the family ≈% is the BEST ACHIEVABLE size-level match between the two
  // families (any base-family size × any candidate-family size), NOT "closest
  // member vs the base-family median". A family whose median is far from the
  // base median can still hold a near-perfect size analog (e.g. x1e.8xlarge ↔ a
  // large M-series size); the old median-anchored score hid that and steered the
  // user away. Scoring the best pair surfaces every family that contains a
  // strong size match, which is exactly the "is this worth exploring" signal.
  const baseMembers = baseSpecs.filter((v) => vmFamily(v) === baseFamily);

  for (const p of others) {
    // 3-rung ladder (A2): same-category families (rung 1) → confidential-capable
    // peers (rung 2, Confidential base) → all in-scope families at a penalty
    // (rung 3). Mirrors buildEquivalencyRows so the ranking isn't empty and a
    // Confidential base bridges to a capable peer before a random cross-category
    // one. Non-Confidential bases with same-category families stay on rung 1.
    const full = distinctSpecs(filteredVms, p);
    // Confidential rung-2 pool: the category-unfiltered provider catalog, so the
    // confidential-capable peers survive a Confidential-only ② scope.
    const confidentialPool = distinctSpecs(fullVms, p);
    let specs: CatalogEntry[] = [];
    let opts: { crossCategoryPenalty?: number } | undefined;
    for (const stage of ladderStages(category, full.filter((v) => catOf(v) === category), full, confidentialPool)) {
      if (stage.pool.length > 0) {
        specs = stage.pool;
        opts = stage.opts;
        break;
      }
    }
    const byFam = new Map<string, CatalogEntry[]>();
    for (const v of specs) {
      const f = vmFamily(v);
      if (!f) continue;
      const arr = byFam.get(f);
      if (arr) arr.push(v);
      else byFam.set(f, [v]);
    }
    const ranked: (RankedFamily & { _d: number })[] = [];
    for (const [fam, arr] of byFam) {
      // Best (base-family size, candidate-family size) pair.
      let best = Infinity;
      for (const bm of baseMembers) {
        const m = bestVmMatch(bm, arr, opts);
        if (m && m.distance < best) best = m.distance;
      }
      if (!Number.isFinite(best)) continue;
      ranked.push({ family: fam, pct: matchPct(best), _d: best });
    }
    // Sort by raw distance (not the rounded pct) so the tail stays correctly
    // ordered even where several entries round to the same percent (v2.42).
    ranked.sort((a, b) => a._d - b._d || a.family.localeCompare(b.family));
    totalByProvider[p] = ranked.length;
    byProvider[p] = ranked.slice(0, cap).map(({ family, pct }) => ({ family, pct }));
  }
  return { byProvider, totalByProvider };
}

/**
 * Per-base-family rankings: for EACH picked base family, the top-`cap` closest
 * families on every other cloud (best first). Lets the panel render one row per
 * base family with its #1 match + a couple of inline runner-up alternatives,
 * instead of a single ranking anchored to only the first picked family.
 */
export function rankedFamiliesPerBase(
  filteredVms: CatalogEntry[],
  base: Provider,
  baseFamilies: string[],
  others: Provider[],
  cap = 3,
  // S65 (Fix 2) — category-unfiltered pool for the Confidential rung-2 bridge (see
  // rankedFamiliesVsBase). Defaults to `filteredVms` → non-confidential byte-identical.
  fullVms: CatalogEntry[] = filteredVms,
): Record<string, Record<Provider, RankedFamily[]>> {
  // PERF (S65) — the naive form calls `rankedFamiliesVsBase` once per base family,
  // and EACH call re-derives `distinctSpecs(filteredVms, p)`, re-classifies every
  // candidate's category, and re-groups the candidate families for every provider
  // — pure work that depends ONLY on (provider, the base family's CATEGORY), not
  // on the base family itself. Since many base families share a category, we hoist
  // that per-(provider, category) candidate resolution into a memo computed on
  // first use and reused across every base family. The base-member match loop
  // (the only genuinely per-family part) still runs per family. Output is
  // byte-identical to the naive per-family calls — same pools, same ladder, same
  // scoring — just without the repeated pool rebuilds. Verified in-test against a
  // naive reference over the live catalog.
  const out: Record<string, Record<Provider, RankedFamily[]>> = {};
  if (baseFamilies.length === 0) return out;

  const baseSpecs = distinctSpecs(filteredVms, base);
  const baseReps = familyReps(baseSpecs);
  // Base members grouped by family, once (was recomputed via `.filter` per call).
  const baseMembersByFam = new Map<string, CatalogEntry[]>();
  for (const v of baseSpecs) {
    const f = vmFamily(v);
    if (!f) continue;
    const arr = baseMembersByFam.get(f);
    if (arr) arr.push(v);
    else baseMembersByFam.set(f, [v]);
  }

  // Provider candidates, deduped once per provider (was per base family).
  const candidateSpecs: Partial<Record<Provider, CatalogEntry[]>> = {};
  const candidateByCat: Partial<Record<Provider, Map<string, CatalogEntry[]>>> = {};
  // Confidential rung-2 pool per provider: the category-unfiltered catalog.
  const confidentialSpecs: Partial<Record<Provider, CatalogEntry[]>> = {};
  for (const p of others) {
    const full = distinctSpecs(filteredVms, p);
    candidateSpecs[p] = full;
    confidentialSpecs[p] = distinctSpecs(fullVms, p);
    const byCat = new Map<string, CatalogEntry[]>();
    for (const v of full) {
      const c = catOf(v);
      const arr = byCat.get(c);
      if (arr) arr.push(v);
      else byCat.set(c, [v]);
    }
    candidateByCat[p] = byCat;
  }

  // Resolved (ladder pool grouped by family + opts) for a (provider, category),
  // memoized so multiple base families of the same category share it.
  interface ResolvedPool {
    byFam: Map<string, CatalogEntry[]>;
    opts: { crossCategoryPenalty?: number } | undefined;
  }
  const resolvedCache = new Map<string, ResolvedPool>();
  const resolvePool = (p: Provider, category: string): ResolvedPool => {
    const key = `${p}::${category}`;
    const hit = resolvedCache.get(key);
    if (hit) return hit;
    const full = candidateSpecs[p]!;
    const sameCat = candidateByCat[p]!.get(category) ?? [];
    const confidentialPool = confidentialSpecs[p]!;
    let poolSpecs: CatalogEntry[] = [];
    let opts: { crossCategoryPenalty?: number } | undefined;
    for (const stage of ladderStages(category, sameCat, full, confidentialPool)) {
      if (stage.pool.length > 0) {
        poolSpecs = stage.pool;
        opts = stage.opts;
        break;
      }
    }
    const byFam = new Map<string, CatalogEntry[]>();
    for (const v of poolSpecs) {
      const f = vmFamily(v);
      if (!f) continue;
      const arr = byFam.get(f);
      if (arr) arr.push(v);
      else byFam.set(f, [v]);
    }
    const resolved: ResolvedPool = { byFam, opts };
    resolvedCache.set(key, resolved);
    return resolved;
  };

  for (const fam of baseFamilies) {
    const byProvider: Record<Provider, RankedFamily[]> = { Azure: [], AWS: [], GCP: [] };
    const baseRep = baseReps.get(fam);
    if (!baseRep) {
      out[fam] = byProvider;
      continue;
    }
    const category = catOf(baseRep);
    const baseMembers = baseMembersByFam.get(fam) ?? [];
    for (const p of others) {
      const { byFam, opts } = resolvePool(p, category);
      const ranked: (RankedFamily & { _d: number })[] = [];
      for (const [candFam, arr] of byFam) {
        let best = Infinity;
        for (const bm of baseMembers) {
          const m = bestVmMatch(bm, arr, opts);
          if (m && m.distance < best) best = m.distance;
        }
        if (!Number.isFinite(best)) continue;
        ranked.push({ family: candFam, pct: matchPct(best), _d: best });
      }
      ranked.sort((a, b) => a._d - b._d || a.family.localeCompare(b.family));
      byProvider[p] = ranked.slice(0, cap).map(({ family, pct }) => ({ family, pct }));
    }
    out[fam] = byProvider;
  }
  return out;
}

// ── Ranked size alternatives ─────────────────────────────────────────────────
// For a SPECIFIC base size, rank every in-scope same-category size on each other
// cloud by similarity — surfacing the closest analog AND the runners-up. The
// single-closest view hides non-obvious alternatives (a size in a "far" family
// can still be the 2nd/3rd best landing); the insights pane uses this to show
// "also consider …".

export interface RankedSize {
  size: string;
  pct: number;
}

export function rankedSizesVsBase(
  filteredVms: CatalogEntry[],
  base: Provider,
  baseSize: string,
  others: Provider[],
  cap = 6,
  // S65 (Fix 2) — category-unfiltered pool for the Confidential rung-2 bridge (see
  // rankedFamiliesVsBase). Defaults to `filteredVms` → non-confidential byte-identical.
  fullVms: CatalogEntry[] = filteredVms,
): Record<Provider, RankedSize[]> {
  const out: Record<Provider, RankedSize[]> = { Azure: [], AWS: [], GCP: [] };
  const baseVm = distinctSpecs(filteredVms, base).find((v) => v.vmSizeName === baseSize);
  if (!baseVm) return out;
  const category = catOf(baseVm);
  const bf = vmFeatures(baseVm);
  for (const p of others) {
    const all = distinctSpecs(filteredVms, p);
    const sameCat = all.filter((v) => catOf(v) === category);
    const confidentialPool = distinctSpecs(fullVms, p);
    // 3-rung ladder (A2): same-category (rung 1) → confidential-capable peer
    // (rung 2, Confidential base) → full in-scope pool at a penalty (rung 3).
    // Non-Confidential bases with same-category sizes stay on rung 1 (identical).
    let pool: CatalogEntry[] = [];
    let opts: { crossCategoryPenalty?: number } | undefined;
    for (const stage of ladderStages(category, sameCat, all, confidentialPool)) {
      if (stage.pool.length > 0) {
        pool = stage.pool;
        opts = stage.opts;
        break;
      }
    }
    const ranked: (RankedSize & { _d: number })[] = [];
    for (const v of pool) {
      const d = vmDistance(bf, vmFeatures(v), opts);
      if (!Number.isFinite(d)) continue;
      ranked.push({ size: v.vmSizeName, pct: matchPct(d), _d: d });
    }
    // Sort by raw distance (not rounded pct) for stable tail ordering (v2.42).
    ranked.sort((a, b) => a._d - b._d || a.size.localeCompare(b.size));
    out[p] = ranked.slice(0, cap).map(({ size, pct }) => ({ size, pct }));
  }
  return out;
}

// ── Ranked category alternatives ─────────────────────────────────────────────
// When the user picks a BASE category, list EVERY in-scope category in each
// other cloud ranked by how similar it is to the base category.
//
// v2.42 — scored by the SAME spec-based family-match aggregate the default
// CATEGORY rows use (`buildEquivalencyRows`): for each candidate category, the
// MEAN over the base-category's families of that family's best VM match into the
// candidate category, with the cross-category penalty for a DIFFERENT category.
// This (a) makes filtered == unfiltered for the same category — both read the
// real aggregate (e.g. Azure MO ↔ GCP MO ≈ 81%), not a pinned 100; and (b) means
// only the base column ever shows 100%, so a different category can never read
// "100% similar" the way the old median-mem-per-vCPU profile let several do.

export interface RankedCategory {
  category: string;
  pct: number;
}

/** Mean best-match pct of `members` (one base family's sizes) into `pool`. */
function familyAggregate(members: CatalogEntry[], pool: CatalogEntry[], opts?: { crossCategoryPenalty?: number }): number | null {
  let best = Infinity;
  for (const bm of members) {
    const m = bestVmMatch(bm, pool, opts);
    if (m && m.distance < best) best = m.distance;
  }
  return Number.isFinite(best) ? matchPct(best) : null;
}

export function rankedCategoriesVsBase(
  filteredVms: CatalogEntry[],
  base: Provider,
  baseCategory: string,
  others: Provider[],
): Record<Provider, RankedCategory[]> {
  const out: Record<Provider, RankedCategory[]> = { Azure: [], AWS: [], GCP: [] };

  // Base-category families → member lists (we aggregate over these).
  const baseByFam = new Map<string, CatalogEntry[]>();
  for (const v of distinctSpecs(filteredVms, base)) {
    if (catOf(v) !== baseCategory) continue;
    const f = vmFamily(v);
    if (!f) continue;
    const arr = baseByFam.get(f);
    if (arr) arr.push(v);
    else baseByFam.set(f, [v]);
  }
  const baseFamilies = [...baseByFam.values()];
  if (baseFamilies.length === 0) return out;

  for (const p of others) {
    const byCat = new Map<string, CatalogEntry[]>();
    for (const v of distinctSpecs(filteredVms, p)) {
      const c = catOf(v);
      const arr = byCat.get(c);
      if (arr) arr.push(v);
      else byCat.set(c, [v]);
    }

    const ranked: { category: string; pct: number }[] = [];
    for (const [cat, pool] of byCat) {
      const opts = cat === baseCategory ? undefined : { crossCategoryPenalty: CROSS_CATEGORY_PENALTY };
      // Mean over base families of each family's best match into this category.
      let sum = 0;
      let n = 0;
      for (const members of baseFamilies) {
        const pct = familyAggregate(members, pool, opts);
        if (pct != null) {
          sum += pct;
          n += 1;
        }
      }
      if (n === 0) continue;
      ranked.push({ category: cat, pct: Math.round(sum / n) });
    }
    // Same category naturally floats to (near) the top; everything else is
    // penalized below it. Tie-break alphabetically for stability.
    ranked.sort((a, b) => b.pct - a.pct || a.category.localeCompare(b.category));
    out[p] = ranked;
  }
  return out;
}

// Per-base-category rankings — one ranked list per picked base category, mirroring
// `rankedFamiliesPerBase`. The panel renders one row per base category (its #1
// cross-cloud analog + inline runners-up), so multi-select category behaves
// exactly like multi-select VM family.
export function rankedCategoriesPerBase(
  filteredVms: CatalogEntry[],
  base: Provider,
  baseCategories: string[],
  others: Provider[],
): Record<string, Record<Provider, RankedCategory[]>> {
  const out: Record<string, Record<Provider, RankedCategory[]>> = {};
  for (const cat of baseCategories) {
    out[cat] = rankedCategoriesVsBase(filteredVms, base, cat, others);
  }
  return out;
}

// ── "Better match outside your filter" alerts ────────────────────────────────
// The equivalents table faithfully shows the best match WITHIN the user's
// category/family filter — but that filter can hide a far better analog. The
// canonical case: a memory base size (Azure E2_v3 = 2 vCPU/16 GiB) against GCP
// scoped to the `m3` family, whose smallest size is ~32 vCPU/1 TB → a 1% match,
// while GCP's true 100% analog `n2-highmem-2` lives in the `n2` family (labeled
// General Purpose) that the filter excludes. This finds those cases so the UI
// can raise an actionable alert instead of silently showing a dead-end match.

export interface BetterMatchAlert {
  cloud: Provider;
  /** The base VM the user anchored on. */
  baseSize: string;
  /** Best match % achievable INSIDE the user's current filter (what's shown). */
  shownPct: number;
  /** The better analog found across the cloud's full catalog. */
  betterSize: string;
  betterPct: number;
  /** Where the better analog lives — its DISPLAY category + family (what the
   *  user would have to widen the filter to, e.g. "General Purpose" / "n2"). */
  betterCategory: string;
  betterFamily: string;
}

/**
 * For one anchored base size, compare each other cloud's best match INSIDE the
 * current filter (`scopedVms`) against its best match across the FULL catalog
 * (`fullVms`, region-scoped but ignoring the category/family filter). When the
 * full-catalog best is materially better AND lives outside what's shown, emit an
 * alert. `minGapPct` / `minBetterPct` tune the sensitivity.
 */
export function findBetterMatchAlerts(
  baseSize: string,
  base: Provider,
  others: Provider[],
  scopedVms: CatalogEntry[],
  fullVms: CatalogEntry[],
  opts?: { minGapPct?: number; minBetterPct?: number },
): BetterMatchAlert[] {
  const minGap = opts?.minGapPct ?? 25;
  const minBetter = opts?.minBetterPct ?? 70;
  const baseVm =
    distinctSpecs(fullVms, base).find((v) => v.vmSizeName === baseSize) ??
    distinctSpecs(scopedVms, base).find((v) => v.vmSizeName === baseSize);
  if (!baseVm) return [];

  const out: BetterMatchAlert[] = [];
  for (const p of others) {
    const scoped = distinctSpecs(scopedVms, p);
    const full = distinctSpecs(fullVms, p);
    if (full.length === 0) continue;

    // Best WITHIN the filter (what the table shows). Use the same cross-category
    // allowance the table uses so the comparison is apples-to-apples.
    const shown = bestVmMatch(baseVm, scoped, { crossCategoryPenalty: CROSS_CATEGORY_PENALTY });
    const shownPct = shown ? matchPct(shown.distance) : 0;
    const shownNames = new Set(scoped.map((v) => v.vmSizeName));

    // Best across the FULL catalog (ignores the user's category/family filter).
    const best = bestVmMatch(baseVm, full, { crossCategoryPenalty: CROSS_CATEGORY_PENALTY });
    if (!best) continue;
    const betterPct = matchPct(best.distance);

    // Only alert when the winner is genuinely better AND not already on screen.
    if (
      betterPct >= minBetter &&
      betterPct - shownPct >= minGap &&
      !shownNames.has(best.vm.vmSizeName)
    ) {
      out.push({
        cloud: p,
        baseSize,
        shownPct,
        betterSize: best.vm.vmSizeName,
        betterPct,
        betterCategory: displayCatOf(best.vm),
        betterFamily: vmFamily(best.vm) ?? '',
      });
    }
  }
  return out;
}

// ── Best-match auto-pick ─────────────────────────────────────────────────────
// For a "Best match" toggle: given the base cloud's in-scope VMs and a candidate
// cloud's full catalog, return the candidate's category + family whose CLOSEST
// member best matches the base — so the auto-pick lands on the genuinely nearest
// analog, NOT a naive same-name category. (Azure E-series → GCP picks General
// Purpose · n2, where n2-highmem matches at ~100%, instead of Memory Optimized ·
// m3 which tops out at ~1% for a small E size.)

export interface BestMatchPick {
  category: string;
  family: string;
  size: string;
  pct: number;
  /** S65 (Bug 3) — comparability caveats for the winning (base, analog) pair, so a
   *  "BEST MATCH" chip that is genuinely a cross-category / low-% STRETCH (e.g. a
   *  small Azure E memory base whose closest GCP analog in a region-limited scope
   *  is a General-Purpose t2d at ~31%, because GCP has no small Memory-Optimized
   *  size there) reads its caveat instead of a bare "≈31%" that looks apples-to-
   *  apples. Empty for a clean same-category match. */
  caveats?: MatchCaveat[];
  /** True when `caveats` contains a stretch-severity issue — a visible "stretch"
   *  hint the chip can surface (per the unverified/caveat doctrine). */
  stretch?: boolean;
}

export function bestMatchAnalog(
  baseVms: CatalogEntry[],
  candidateVms: CatalogEntry[],
): BestMatchPick | null {
  const dedupe = (vms: CatalogEntry[]): CatalogEntry[] => {
    const m = new Map<string, CatalogEntry>();
    for (const v of vms) if (!m.has(v.vmSizeName)) m.set(v.vmSizeName, v);
    return [...m.values()];
  };
  const bases = dedupe(baseVms);
  const cands = dedupe(candidateVms);
  if (bases.length === 0) return null;
  // Route through bestVmMatch per base so this path shares the SAME deterministic
  // disk-aware tiebreak as the equivalents panel (topVmMatches/bestVmMatch). That
  // keeps the displayed top analog stable — selecting a base size no longer flips
  // the match between two distance-tied SKUs (e.g. AWS r5.large ↔ r5d.large vs a
  // disk-less Azure E-size). Cross-base ties resolve by name for determinism.
  //
  // S65 (Fix 2) — this used to re-implement a 2-rung ladder inline (confidential-
  // capable peer → full cross-category pool). It now routes through the SHARED
  // `ladderStages` helper so its fallback semantics stay in lock-step with the rest
  // of the module. IMPORTANT: unlike the panel/ranked paths, `bestMatchAnalog`
  // intentionally has NO same-category rung-1 gate — its whole job is to surface the
  // genuinely CLOSEST analog regardless of vendor category (Azure E → GCP General
  // Purpose n2, dodging the huge Memory-Optimized m3 trap; a small MO base whose only
  // MO peer is a 40-vCPU m1 correctly prefers a nearer GP t2d at the cross-category
  // penalty). So we pass an EMPTY rung-1 pool: rung 1 is always skipped, a Confidential
  // base bridges on rung 2 (capable peers @ CONFIDENTIAL_PEER_PENALTY) when they exist,
  // and every base otherwise resolves on rung 3 (full pool @ CROSS_CATEGORY_PENALTY) —
  // byte-identical to the prior inline ladder, now expressed via the shared helper.
  const matchFor = (b: CatalogEntry): { vm: CatalogEntry; distance: number; peer: boolean } | null => {
    const category = matchCategory(b);
    for (const stage of ladderStages(category, [], cands, cands)) {
      const m = bestVmMatch(b, stage.pool, stage.opts);
      if (m) return { vm: m.vm, distance: m.distance, peer: !!stage.ctx.confidentialPeer };
    }
    return null;
  };
  let best: CatalogEntry | null = null;
  let bestBase: CatalogEntry | null = null;
  let bestPeer = false;
  let bestD = Infinity;
  for (const b of bases) {
    const m = matchFor(b);
    if (!m) continue;
    if (
      m.distance < bestD - 1e-9 ||
      (best != null && Math.abs(m.distance - bestD) <= 1e-9 &&
        m.vm.vmSizeName.localeCompare(best.vmSizeName) < 0)
    ) {
      bestD = m.distance;
      best = m.vm;
      bestBase = b;
      bestPeer = m.peer;
    } else if (best == null) {
      bestD = m.distance;
      best = m.vm;
      bestBase = b;
      bestPeer = m.peer;
    }
  }
  if (!best || !bestBase || !Number.isFinite(bestD)) return null;
  // Caveats for the winning pair — a cross-category / confidential-peer / stretch
  // hint the chip can display so a low-% "BEST MATCH" never reads apples-to-apples.
  // We do NOT force `crossCategory` from the display label: a GCP `*-highmem`
  // analog reads General Purpose / Compute Optimized by vendor label but is Memory
  // Optimized by `matchCategory`, a genuine same-category match — `matchCaveats`
  // decides cross-category off `matchCategory`, so a clean 90%+ highmem hit stays
  // caveat-free while a real cross-category stretch (t2d GP ~31% for an MO base
  // when GCP has no small MO size in scope) is flagged.
  const ctx: CaveatCtx = bestPeer ? { confidentialPeer: true } : {};
  const caveats = matchCaveats(bestBase, best, { ...ctx, distance: bestD });
  return {
    category: displayCatOf(best),
    family: vmFamily(best) ?? '',
    size: best.vmSizeName,
    pct: matchPct(bestD),
    caveats: caveats.length ? caveats : undefined,
    stretch: isStretch(caveats),
  };
}

// ── S65 (Bug 2 + Fix 3) — comparison-table backfill merge ────────────────────
// The Best-match toggle BACKFILLS a non-base cloud's comparison-table cells from
// the per-base-row analog SIZE it resolved (`fills`: base-row size → analog size).
// This pure merge is the invariant the effect relies on:
//   • MANUAL picks (pk.auto falsy) always survive untouched, IN PLACE — user picks
//     win and never move.
//   • Existing AUTO picks are kept IN PLACE too when still valid (their base row is
//     present, not manual-covered, not suppressed, and `fills` still resolves it),
//     so the list ORDER is preserved across merge passes (Fix 3: a re-render must
//     not re-sort auto entries or snap a manual drag-reorder back).
//   • A stale auto (its base row gone / now manual / suppressed / no longer in
//     `fills`) is DROPPED. Toggling Best match OFF passes empty `fills` → every auto
//     drops, every manual survives.
//   • A genuinely NEW auto (a base row with a fill, not already present, not
//     suppressed) is APPENDED at the end — never interleaved ahead of existing rows.
//   • `suppressed` (Fix 3) — `${row}` keys the user explicitly ✕-removed while Best
//     match is ON. Those rows are NOT re-added in the same cycle (the removal → memo
//     recompute → effect refire loop used to resurrect them instantly). The caller
//     clears the set when Best match toggles off or the base-row set changes.
export interface ComparePick {
  value: string;
  row: string;
  auto?: boolean;
}
export function mergeBestMatchFills(
  existing: ComparePick[],
  baseRows: string[],
  fills: Record<string, string>,
  suppressed?: ReadonlySet<string>,
): ComparePick[] {
  const baseRowSet = new Set(baseRows);
  const manualRows = new Set(existing.filter((pk) => !pk.auto).map((pk) => pk.row));
  const isSuppressed = (row: string) => suppressed?.has(row) ?? false;
  // A row is a VALID auto target when: it still exists on the base, no manual pick
  // covers it, it isn't suppressed, and the fills map resolves it.
  const validAuto = (row: string) =>
    baseRowSet.has(row) && !manualRows.has(row) && !isSuppressed(row) && !!fills[row];

  const out: ComparePick[] = [];
  const keptAutoRows = new Set<string>();
  // Pass 1 — walk `existing` in order: keep every manual in place; keep a still-valid
  // auto in place (refreshing its value from `fills` in case the analog changed).
  for (const pk of existing) {
    if (!pk.auto) {
      out.push(pk);
    } else if (validAuto(pk.row) && !keptAutoRows.has(pk.row)) {
      out.push({ value: fills[pk.row], row: pk.row, auto: true });
      keptAutoRows.add(pk.row);
    }
    // else: stale auto → dropped.
  }
  // Pass 2 — append genuinely NEW autos for base rows not already present, in
  // baseRows order (deterministic).
  for (const row of baseRows) {
    if (validAuto(row) && !keptAutoRows.has(row)) {
      out.push({ value: fills[row], row, auto: true });
      keptAutoRows.add(row);
    }
  }
  return out;
}

export function equivalencyInsights(
  rows: EquivalencyRows,
  others: Provider[],
  selectedSizes?: Set<string>,
): ProviderInsight[] {
  return others.map((provider) => ({
    provider,
    category: bestLine(rows.categories, provider),
    family: bestLine(rows.families, provider),
    size: bestLine(rows.sizes, provider, selectedSizes),
  }));
}

/**
 * Base-cloud-aware filtering for the Region Availability page (v2.30).
 *
 * The page filter emits chips at three granularities (see RegionFilterChips):
 *   - Category — canonical, cross-cloud (no provider).
 *   - Family / Size — per-cloud, browsed from the chosen BASE cloud.
 *
 * A family/size chip names a SKU that only exists on its own cloud, so a naive
 * "match the chip's provider" rule zeroes out every OTHER selected cloud the
 * moment you pick, say, an Azure family — collapsing the cross-cloud comparison
 * to a single-cloud island (the bug the user hit: AWS/GCP → 0). Instead:
 *
 *   - The BASE cloud is filtered by its family/size chips PRECISELY.
 *   - Every OTHER selected cloud is filtered to the equivalent CATEGORY (the
 *     category those base chips imply), so the map + scoreboard stay multi-cloud
 *     and answer "where does each cloud offer the comparable product?".
 *
 * Explicit Category chips are always cross-cloud and apply to every provider.
 * Pure + exported so the behavior is unit-tested (the page just wires it).
 */
import type { UserVm } from '../types';
import { vmFamily } from './vmTaxonomy';
import { categorize } from './vmCategory';
import type { FilterChip } from '../components/RegionFilterChips';

export type RaProvider = 'Azure' | 'AWS' | 'GCP';

/** The canonical category for a VM (the catalog value, else derived). */
export function vmCategoryOf(v: UserVm): string {
  return v.category ?? categorize(v.provider, v.family);
}

/**
 * Categories implied by the family/size chips, read from the catalog (not a
 * label parse — robust to display-label drift). Empty when no family/size chip
 * is set. Used to compare the OTHER clouds at category granularity.
 */
export function impliedCategoriesFromChips(vms: UserVm[], chips: FilterChip[]): Set<string> {
  const fam = chips.filter((c): c is Extract<FilterChip, { kind: 'family' }> => c.kind === 'family');
  const size = chips.filter((c): c is Extract<FilterChip, { kind: 'size' }> => c.kind === 'size');
  const cats = new Set<string>();
  if (!fam.length && !size.length) return cats;
  for (const v of vms) {
    const cat = vmCategoryOf(v);
    if (!cat) continue;
    if (fam.some((c) => c.value === vmFamily(v) && c.provider === v.provider)) cats.add(cat);
    if (size.some((c) => c.value === v.vmSizeName && c.provider === v.provider)) cats.add(cat);
  }
  return cats;
}

/**
 * Filter `vms` to the selected providers + the chip filter, PER-CLOUD precise.
 * Within a kind = OR; across kinds = AND. Category chips are canonical and apply
 * cross-cloud. Family/size chips are matched against EACH VM's OWN provider — the
 * caller emits one chip per cloud (base pick + each competitor's analog), so every
 * selected cloud is scoped to exactly its own family/size and its region count
 * reflects where that specific SKU/family actually runs. A cloud with no chip of
 * an active kind (no analog on that cloud) correctly matches nothing for it.
 * (`baseProvider` is retained for signature stability; scoping is now symmetric.)
 */
export function filterVmsByChips(
  vms: UserVm[],
  picked: ReadonlySet<RaProvider>,
  _baseProvider: RaProvider,
  chips: FilterChip[],
): UserVm[] {
  const cat = chips.filter((c): c is Extract<FilterChip, { kind: 'category' }> => c.kind === 'category');
  const fam = chips.filter((c): c is Extract<FilterChip, { kind: 'family' }> => c.kind === 'family');
  const size = chips.filter((c): c is Extract<FilterChip, { kind: 'size' }> => c.kind === 'size');
  return vms.filter((v) => {
    const p = v.provider as RaProvider;
    if (!picked.has(p)) return false;
    const c = vmCategoryOf(v);
    // Explicit category chips are cross-cloud — apply to EVERY provider.
    if (cat.length && !cat.some((x) => x.value === c)) return false;
    // Family/size chips are per-cloud precise — a VM passes only if it matches a
    // chip of its OWN provider (each cloud scoped to its own picked/analog SKU).
    if (fam.length && !fam.some((x) => x.value === vmFamily(v) && x.provider === p)) return false;
    if (size.length && !size.some((x) => x.value === v.vmSizeName && x.provider === p)) return false;
    return true;
  });
}

/**
 * VM picker — uses the same GlassDropdown as the rest of the form for consistency.
 * Inline popover, searchable, ~5 rows visible, grouped by VM generation.
 */
import { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import type { CatalogEntry, MemoryCategoryId, VmCategory } from '../types';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { providerOf, vmFamily } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';

function category(entry: CatalogEntry): MemoryCategoryId | null {
  if (entry.memoryCategory.includes('Very High')) return 'vhm';
  if (entry.memoryCategory.includes('High')) return 'hm';
  if (entry.memoryCategory.includes('Medium')) return 'mm';
  return null;
}

interface Props {
  categoryFilter?: MemoryCategoryId | null;
  /**
   * Force the family filter to this exact set, overriding `state.ui.bomFamilies`.
   * Used by BomSection to force the MM/HM/VHM section dropdowns to M-only and
   * the non-M flat panel dropdown to non-M only, even when the user has both
   * "M" and "E" selected in the Configure-tab filter row.
   */
  familyOverride?: string[];
  /** Inverse of familyOverride: filter OUT any VMs whose family matches. */
  familyExclude?: string[];
  onSelect: (vmSizeName: string) => void;
}

// Known Azure M-series generation ordering — anything else (AWS, GCP, custom)
// falls back to alphabetical, which keeps multi-cloud groups stable.
const KNOWN_GEN_ORDER: Record<string, number> = { Mv1: 0, Mv2: 1, Mv3: 2 };
function genRank(g: string): number {
  return KNOWN_GEN_ORDER[g] ?? 100;
}

export function VmAutocomplete({
  categoryFilter = null,
  familyOverride,
  familyExclude,
  onSelect,
}: Props) {
  const { state } = useApp();
  const catalog = state.userVms;

  const { bomProvider, bomFamilies, bomCategories, activeRegion } = state.ui;
  // v2.17.2 — cascading Category filter. Empty set = no category filter.
  const categorySet = new Set<VmCategory>(bomCategories as VmCategory[]);
  // Region scope: when the user has chosen a region for the active provider,
  // restrict the BOM dropdown to that region's rows so the rates the user
  // sees match the catalog selection they made in the VMs tab. No selection
  // (or no region column) = show everything.
  const provRegion = bomProvider ? activeRegion[bomProvider] : undefined;
  // familyOverride wins over the global bomFamilies; familyExclude is applied
  // on top of whichever set is active. This is what lets BomSection force the
  // MM/HM/VHM section dropdowns to M-only while the user simultaneously has
  // both "M" and "E" pills selected in the Configure-tab filter row.
  const familySet = new Set(familyOverride ?? bomFamilies);
  const excludeSet = new Set(familyExclude ?? []);

  const options: DropdownOption[] = useMemo(() => {
    const filtered = catalog.filter((c) => {
      if (categoryFilter && category(c) !== categoryFilter) return false;
      // Provider filter from the Configure-tab BomFilter row. null = no
      // provider chosen yet (initial state), in which case show everything
      // so the dropdown isn't empty.
      if (bomProvider && providerOf(c) !== bomProvider) return false;
      if (provRegion && (c.region ?? '') !== provRegion) return false;
      // Cascading category filter — applies BEFORE the family check so a
      // user who picks "Memory Optimized" sees only memory families.
      if (categorySet.size > 0) {
        const cat: VmCategory = (c.category ?? categorize(c.provider, c.family));
        if (!categorySet.has(cat)) return false;
      }
      const fam = vmFamily(c);
      // Family filter — empty selection means "all families".
      if (familySet.size > 0 && !familySet.has(fam)) return false;
      if (excludeSet.has(fam)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const og = genRank(a.vmGeneration) - genRank(b.vmGeneration);
      if (og !== 0) return og;
      const gn = a.vmGeneration.localeCompare(b.vmGeneration);
      if (gn !== 0) return gn;
      return a.memoryGib - b.memoryGib;
    });
    return filtered.map((vm) => ({
      value: vm.vmSizeName,
      label: vm.vmSizeName.replace('Standard_', ''),
      meta: `${vm.vcpus} vCPU · ${vm.memoryGib.toLocaleString()} GiB`,
      group: vm.vmGeneration,
    }));
  }, [catalog, categoryFilter, bomProvider, bomFamilies, bomCategories, familyOverride, familyExclude, provRegion]);

  return (
    <GlassDropdown
      value=""
      options={options}
      onChange={(v) => onSelect(v)}
      placeholder={catalog.length === 0 ? 'Upload VM template first…' : '+ Add VM…'}
      searchable
      visibleRows={5}
    />
  );
}

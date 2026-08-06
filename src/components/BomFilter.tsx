/**
 * BOM filter — top of the Configure tab.
 *
 * v2.19.4 — Aligned with the Fungibility tab's filter pattern so the two
 * surfaces feel like the same product. Both now share:
 *
 *   1. Cloud Provider (single-select pill row, top-level scope).
 *   2. A boxed "BoM Filters" card with:
 *      - VM Category — REQUIRED-single-select (one of the canonical 9).
 *        The first available category auto-picks so the chip area is never
 *        blank. Category labels carry their own family count subscript.
 *      - VM Family — multi-select chips, scoped to the picked category.
 *
 * Difference from Fungibility (intentional): empty family selection here
 * means the BOM picker dropdown still shows EVERY family in the active
 * category. The filter is a narrow-down, not a result-driver — the user
 * picks VMs to add to the BOM, so showing more rather than less keeps the
 * workflow open. (Fungibility's empty family = empty matrix because the
 * matrix IS the result.)
 *
 * State: persists bomProvider / bomCategories[0] / bomFamilies in UiState
 * so the user's last selection survives across sessions. The active region
 * (set on the VMs tab) still surfaces as a chip in the Provider header so
 * the user is never surprised that their VM rates / availability tie to a
 * specific region.
 */
import { useEffect, useMemo } from 'react';
import { useApp } from '../state/AppContext';
import {
  PROVIDER_ORDER,
  providerOf,
  vmFamily,
  compareFamily,
} from '../utils/vmTaxonomy';
import { ProviderPillRow } from './ProviderPillRow';
import { RegionRequiredPicker } from './BomBulkAddPanel';
// v2.19.38 — GlassDropdown import removed; Region picker (the only consumer)
// moved to BomBulkAddPanel.
import { categorize } from '../utils/vmCategory';
import { VM_CATEGORIES, type VmCategory } from '../types';

/** Resolve a VM's category — explicit field wins, fall back to the
 *  cross-cloud classifier so legacy seed rows still tag correctly. */
function categoryOf(v: { provider?: string; family?: string; category?: VmCategory }): VmCategory {
  return v.category ?? categorize(v.provider, v.family);
}

export function BomFilter() {
  const { state, dispatch } = useApp();
  const vms = state.userVms;

  // Always render the canonical Azure/AWS/GCP/Custom row so the affordance is
  // permanently discoverable — Custom is the "I want to use my own setup"
  // escape hatch and needs to be visible even before the user uploads any
  // Custom-tagged VMs. Additional providers (e.g. Oracle) tack on at the end.
  const providersPresent = useMemo(() => {
    const set = new Set<string>();
    for (const v of vms) set.add(providerOf(v));
    const extras = [...set]
      .filter((p) => !(PROVIDER_ORDER as readonly string[]).includes(p))
      .sort();
    return [...PROVIDER_ORDER, ...extras];
  }, [vms]);

  // Per-provider catalog counts — drives the dimmed look on pills whose
  // provider has zero uploaded VMs yet.
  const providerCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of vms) {
      const p = providerOf(v);
      m[p] = (m[p] ?? 0) + 1;
    }
    return m;
  }, [vms]);

  // Auto-pick the first available provider if none selected yet.
  useEffect(() => {
    if (state.ui.bomProvider == null && providersPresent.length > 0 && vms.length > 0) {
      dispatch({ type: 'UI_SET', ui: { bomProvider: providersPresent[0] } });
    }
  }, [state.ui.bomProvider, providersPresent, vms.length, dispatch]);

  const activeProvider = state.ui.bomProvider;
  const activeRegion = activeProvider ? state.ui.activeRegion[activeProvider] : undefined;

  // v2.19.18 — Categories + families are scoped by PROVIDER only, NOT region.
  // Previously region-scoping dropped every family a region lacks (e.g.
  // Australia Central has no M-series, so picking it hid all M families),
  // which was inconsistent with the Fungibility + VM Library tabs and read
  // as "the M families are missing". Region is now the LAST filter (a
  // searchable picker below Family), scoped to the chosen family — exactly
  // the VM Library cascade. Sort order = canonical VM_CATEGORIES.
  const familiesByCategory = useMemo(() => {
    if (!activeProvider) return [] as Array<{ category: VmCategory; families: string[] }>;
    const byCat = new Map<VmCategory, Set<string>>();
    for (const v of vms) {
      if (providerOf(v) !== activeProvider) continue;
      const cat = categoryOf(v);
      const fam = vmFamily(v);
      if (!byCat.has(cat)) byCat.set(cat, new Set());
      byCat.get(cat)!.add(fam);
    }
    return VM_CATEGORIES
      .filter((c) => byCat.has(c))
      .map((c) => ({
        category: c,
        families: [...byCat.get(c)!].sort(compareFamily),
      }));
  }, [vms, activeProvider]);

  // Active category = first persisted entry (we store as array for back-
  // compat with the v2.17 multi-select model). Auto-picks the first
  // available when missing / invalid.
  const persistedCategory = (state.ui.bomCategories[0] as VmCategory | undefined) ?? null;
  const activeCategory: VmCategory | null = useMemo(() => {
    if (familiesByCategory.length === 0) return null;
    if (persistedCategory && familiesByCategory.some((g) => g.category === persistedCategory)) {
      return persistedCategory;
    }
    return familiesByCategory[0].category;
  }, [familiesByCategory, persistedCategory]);

  // Reconcile persisted state with the resolved active category. Runs only
  // when there's a mismatch so we don't dispatch in a loop.
  useEffect(() => {
    if (!activeCategory) return;
    if (persistedCategory === activeCategory) return;
    dispatch({ type: 'UI_SET', ui: { bomCategories: [activeCategory] } });
  }, [activeCategory, persistedCategory, dispatch]);

  // v2.19.8 — Auto-pick the first family when the active category has
  // families but bomFamilies is empty. Prevents the bulk-add grid from
  // being empty by default (which felt broken on fresh page loads). User
  // can still multi-select or deselect to widen/narrow. Skipped when the
  // user has at least one family selected so we never overwrite their pick.
  useEffect(() => {
    if (!activeCategory) return;
    if (state.ui.bomFamilies.length > 0) return;
    const families = familiesByCategory.find((g) => g.category === activeCategory)?.families ?? [];
    if (families.length === 0) return;
    dispatch({ type: 'UI_SET', ui: { bomFamilies: [families[0]] } });
  }, [activeCategory, familiesByCategory, state.ui.bomFamilies.length, dispatch]);

  const familiesForCategory = useMemo(() => {
    if (!activeCategory) return [] as string[];
    return familiesByCategory.find((g) => g.category === activeCategory)?.families ?? [];
  }, [familiesByCategory, activeCategory]);

  const selectedFamilies = new Set(state.ui.bomFamilies);

  // v2.22.6 — Region picker now lives at the BOTTOM of this consolidated box
  // (moved back out of the Bulk Add panel). VMs deploy INTO a region; pricing
  // + availability are region-specific, so it's required, not a catalog
  // narrower. availableRegions enumerates the regions the active
  // provider/category/family scope ships in, each with its VM count.
  const availableRegions = useMemo(() => {
    if (!activeProvider || !activeCategory) return [] as Array<{ region: string; count: number }>;
    const m = new Map<string, number>();
    for (const v of vms) {
      if (providerOf(v) !== activeProvider) continue;
      if (categoryOf(v) !== activeCategory) continue;
      if (selectedFamilies.size > 0 && !selectedFamilies.has(vmFamily(v))) continue;
      const r = v.region ?? '';
      if (!r) continue;
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => a.region.localeCompare(b.region));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vms, activeProvider, activeCategory, state.ui.bomFamilies.join('|')]);
  const setProviderRegion = (next: string) => {
    if (!activeProvider) return;
    dispatch({ type: 'UI_SET', ui: { activeRegion: { ...state.ui.activeRegion, [activeProvider]: next } } });
  };
  const regionIsStale =
    activeRegion != null && availableRegions.length > 0 && !availableRegions.some((r) => r.region === activeRegion);

  // v2.19.38 — The Region picker that previously lived at the bottom of this
  // card has moved into the Bulk Add VMs panel below. Region is a *deployment
  // target* choice, not a catalog filter — keeping it inside Bulk Add makes
  // its required-for-deployment nature obvious and stops mixing two concerns
  // in one card. The `state.ui.activeRegion` record is unchanged; this card
  // simply no longer renders or mutates it.

  // Drop any selected families that no longer belong to the active category
  // so the chip row + downstream picker stay coherent after a scope change.
  useEffect(() => {
    if (selectedFamilies.size === 0) return;
    const visible = new Set(familiesForCategory);
    let pruned = false;
    const next: string[] = [];
    for (const f of state.ui.bomFamilies) {
      if (visible.has(f)) next.push(f);
      else pruned = true;
    }
    if (pruned) dispatch({ type: 'UI_SET', ui: { bomFamilies: next } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, familiesForCategory.join('|')]);

  const setProvider = (p: string) => {
    // Switching provider resets category + family — stale "M" through to a
    // GCP context where it doesn't exist is just noise.
    dispatch({
      type: 'UI_SET',
      ui: { bomProvider: p, bomCategories: [], bomFamilies: [] },
    });
  };

  const setCategory = (c: VmCategory) => {
    if (c === activeCategory) return;
    dispatch({ type: 'UI_SET', ui: { bomCategories: [c], bomFamilies: [] } });
  };

  const toggleFamily = (f: string) => {
    const next = selectedFamilies.has(f)
      ? state.ui.bomFamilies.filter((x) => x !== f)
      : [...state.ui.bomFamilies, f];
    dispatch({ type: 'UI_SET', ui: { bomFamilies: next } });
  };

  const clearFamilies = () => {
    if (state.ui.bomFamilies.length === 0) return;
    dispatch({ type: 'UI_SET', ui: { bomFamilies: [] } });
  };

  return (
    <section className="space-y-3">
      <h2 className="section-h">VM catalog filter</h2>

      {vms.length === 0 ? (
        <div
          className="text-[11px] px-3 py-2 leading-snug"
          style={{
            background: 'rgba(129, 140, 248, 0.06)',
            border: '1px solid var(--border-glow)',
            color: 'var(--interactive)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          ● No VMs uploaded yet. Open the <strong>VMs</strong> tab to download the template and
          upload your catalog — provider and family filters appear here once you do.
        </div>
      ) : (
        <section
          className="p-3 space-y-3.5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* ── Cloud Provider — the initial filter (not a catalog narrower). */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="text-[9px] tracking-[0.04em] text-text-secondary"
              style={{ minWidth: 110 }}
            >
              Cloud Provider
            </span>
            <ProviderPillRow
              mode="single"
              value={activeProvider}
              onChange={(next) => {
                if (typeof next === 'string') setProvider(next);
              }}
              counts={providerCounts}
              emptyTooltip={(p) =>
                `No ${p} VMs uploaded yet — open the VMs tab to add some`
              }
            />
          </div>

          {/* ── BoM Filters — Category (required) + Family (multi). */}
          {activeProvider && (
            <div>
              <div
                className="text-[9px] tracking-[0.04em] text-text-secondary"
                style={{ marginBottom: 14 }}
              >
                BoM Filters
              </div>

              {/* ── VM Category (required-single-select, no 'All' pill). */}
              <div className="flex flex-col" style={{ gap: 6 }}>
                <span className="text-[9px] tracking-[0.04em] text-text-secondary">
                  VM Category
                  {familiesByCategory.length > 0 && (
                    <span className="text-text-muted normal-case tracking-normal ml-1.5">
                      · {familiesByCategory.length}
                    </span>
                  )}
                </span>
                {familiesByCategory.length === 0 ? (
                  <span className="text-[10px] text-text-muted italic">
                    No VMs uploaded for this provider{activeRegion ? ` / ${activeRegion}` : ''}.
                  </span>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {familiesByCategory.map(({ category, families }) => (
                      <FilterChip
                        key={category}
                        label={`${category} · ${families.length}`}
                        active={activeCategory === category}
                        onClick={() => setCategory(category)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── VM Family (multi-select, scoped to active category).
                  Empty selection in BoM means "show every family in this
                  category in the picker" — different from Fungibility's
                  "empty = empty matrix" because the BOM picker is a narrow-
                  down, not a result-driver. */}
              {activeCategory && familiesForCategory.length > 0 && (
                <div className="flex flex-col" style={{ gap: 6, marginTop: 10 }}>
                  <span className="text-[9px] tracking-[0.04em] text-text-secondary">
                    VM Family
                    <span className="text-text-muted normal-case tracking-normal ml-1.5">
                      · {familiesForCategory.length} in {activeCategory}
                      {selectedFamilies.size > 0 && ` · ${selectedFamilies.size} selected`}
                    </span>
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {familiesForCategory.map((f) => (
                      <FilterChip
                        key={f}
                        label={f}
                        active={selectedFamilies.has(f)}
                        onClick={() => toggleFamily(f)}
                      />
                    ))}
                    {selectedFamilies.size > 0 && (
                      <button
                        onClick={clearFamilies}
                        className="text-[10px] tracking-[0.02em] text-text-muted hover:text-text-primary transition-colors"
                        style={{ padding: '3px 6px' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── Region · required — the bottom of the box. VMs deploy INTO a
              region; pricing + availability are region-specific. */}
          {activeProvider && activeCategory && (
            <RegionRequiredPicker
              provider={activeProvider}
              availableRegions={availableRegions}
              active={activeRegion}
              isStale={regionIsStale}
              onPick={setProviderRegion}
            />
          )}
        </section>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.19.38 — RegionDropdown removed. The region picker now lives inside the
// Bulk Add VMs panel (BomBulkAddPanel.tsx), where its required-for-deployment
// semantics are explicit.
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// FilterChip — same visual treatment as the Fungibility tab so the two
// surfaces feel identical. Local copy (vs importing) keeps each tab
// self-contained; consolidate later if more tabs adopt the same chip.
// ────────────────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-mono transition-all"
      style={{
        padding: '3px 10px',
        background: active ? 'rgba(129, 140, 248, 0.14)' : 'rgba(255,255,255,0.03)',
        color: active ? 'var(--interactive)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 'var(--radius-pill)',
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

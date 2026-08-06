/**
 * v2.19.10 — VM Library, library-style.
 *
 * Replaces the deeply nested Provider → MM/HM/VHM → Mv1/Mv2/Mv3 → Family →
 * SKU tree (1,679 lines) with a clean single-provider workflow that mirrors
 * the BoM and Fungibility tabs' filtering pattern. The compound family
 * slugs (`MM Mv1`, `HM Mv2`, …) already encode tier × generation so the
 * extra hierarchy is no longer needed.
 *
 * Layout:
 *   1. Header pill — section title + ⤓ Template + ⤒ Upload + ↻ Refresh seed
 *   2. Caption — short explainer
 *   3. Provider row — ProviderPillRow (single-select) + active-region chip
 *      + per-provider Region picker reveal
 *   4. VM Catalog Filter card — required-single-select Category + multi-
 *      select Family (scoped to Category), auto-pick first family on
 *      Category change, search input at the bottom of the card
 *   5. Catalog list — grouped by Family with collapsible headers; each
 *      VM card collapses to a 1-line summary, click ▸ to expand for full
 *      specs (network, local + remote storage, accelerators, all pricing)
 *   6. Empty states + upload feedback + delete-with-undo toast preserved
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { type UserVm, type VmCategory, VM_CATEGORIES, HOURS_PER_MONTH } from '../types';
import { parseVmTemplate } from '../utils/vmTemplate';
import { downloadVmTemplate } from '../utils/vmTemplateBuilder';
import { PUBLIC_SEED_VERSION } from '../data/azureMSeriesSeed';
import { saveSeedVersion, saveUserCatalogUploaded } from '../state/storage';
import { buildLiveCatalog, LIVE_CATALOG_AS_OF } from '../data/liveCatalog';
import {
  compareFamily,
  vmFamily,
  PROVIDER_THEMES,
  PROVIDER_ORDER,
} from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { type RateType } from '../engine/insights';
import { resolveDisplayRate } from '../utils/estimatedRate';
import { ProviderPillRow } from './ProviderPillRow';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { SeedDisclaimerBanner } from './SeedDisclaimerBanner';
import { LiveRatesPanel } from './LiveRatesPanel';

function providerOf(v: UserVm): string {
  return v.provider || 'Other';
}

function categoryOf(v: UserVm): VmCategory {
  return v.category ?? categorize(v.provider, v.family);
}

/** Short label for each pricing basis — used by the basis selector + cards. */
const RATE_LABEL: Record<RateType, string> = {
  payg: 'PAYG',
  ri1y: '1yr RI',
  ri3y: '3yr RI',
};

function fmtUsd(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(5)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function VmTab() {
  const { state, dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<VmCategory | null>(null);
  const [activeFamilies, setActiveFamilies] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  // v2.25.6 — Pricing basis for the catalog's displayed rates (PAYG / 1yr RI /
  // 3yr RI). Local to the catalog browse surface.
  const [rateBasis, setRateBasis] = useState<RateType>('payg');
  // Per-family collapse state — default OPEN. Adding a key collapses that
  // family group; removing it expands.
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set());
  // Expanded VM cards — by `${vmSizeName}|${region}` key.
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const vms = state.userVms;
  const hasAny = vms.length > 0;

  // ── Provider scope ─────────────────────────────────────────────────
  const providerCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const v of vms) {
      const p = providerOf(v);
      m[p] = (m[p] ?? 0) + 1;
    }
    return m;
  }, [vms]);

  const providersWithCatalog = useMemo(() => {
    const set = new Set<string>();
    for (const v of vms) set.add(providerOf(v));
    const known = (PROVIDER_ORDER as readonly string[]).filter((p) => set.has(p));
    const extras = [...set].filter((p) => !(PROVIDER_ORDER as readonly string[]).includes(p)).sort();
    return [...PROVIDER_ORDER, ...known, ...extras].filter((v, i, a) => a.indexOf(v) === i);
  }, [vms]);

  // Auto-pick the first provider with VMs on first load.
  useEffect(() => {
    if (activeProvider != null) return;
    if (!hasAny) return;
    const first = providersWithCatalog.find((p) => (providerCounts[p] ?? 0) > 0);
    if (first) setActiveProvider(first);
  }, [activeProvider, hasAny, providersWithCatalog, providerCounts]);

  // ── Active region scope (persisted in UiState across tabs) ──────────
  const activeRegion = state.ui.activeRegion;
  const regionForActive = activeProvider ? activeRegion[activeProvider] : undefined;
  const regionsByProvider = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const v of vms) {
      const p = providerOf(v);
      const r = v.region ?? '';
      if (!r) continue;
      if (!m[p]) m[p] = [];
      if (!m[p].includes(r)) m[p].push(r);
    }
    for (const p of Object.keys(m)) m[p].sort();
    return m;
  }, [vms]);
  const setProviderRegion = (provider: string, region: string) => {
    const next = { ...activeRegion };
    if (region === '__all__') delete next[provider];
    else next[provider] = region;
    dispatch({ type: 'UI_SET', ui: { activeRegion: next } });
  };

  // ── Category + Family derivation (consistent with BoM/Fungibility) ─
  // v2.19.11 — Region is no longer an upstream scope; it's the LAST filter,
  // derived from whatever's left after Provider × Category × Family. That
  // means Category and Family chips show every option the provider's full
  // catalog supports, and the Region picker narrows from there.
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
    return VM_CATEGORIES.filter((c) => byCat.has(c)).map((c) => ({
      category: c,
      families: [...byCat.get(c)!].sort(compareFamily),
    }));
  }, [vms, activeProvider]);

  // Auto-pick first category whenever the current one becomes invalid.
  useEffect(() => {
    if (familiesByCategory.length === 0) {
      if (activeCategory != null) setActiveCategory(null);
      return;
    }
    const stillValid = familiesByCategory.some((g) => g.category === activeCategory);
    if (!stillValid) setActiveCategory(familiesByCategory[0].category);
  }, [familiesByCategory, activeCategory]);

  // Auto-pick first family when the category changes and no family is selected.
  const familiesForCategory = useMemo(() => {
    if (!activeCategory) return [] as string[];
    return familiesByCategory.find((g) => g.category === activeCategory)?.families ?? [];
  }, [familiesByCategory, activeCategory]);
  useEffect(() => {
    if (!activeCategory) return;
    if (activeFamilies.size > 0) return;
    if (familiesForCategory.length === 0) return;
    setActiveFamilies(new Set([familiesForCategory[0]]));
  }, [activeCategory, familiesForCategory, activeFamilies.size]);

  // Drop selected families that no longer belong to the active category.
  useEffect(() => {
    if (activeFamilies.size === 0) return;
    const visible = new Set(familiesForCategory);
    const filtered = new Set<string>();
    let pruned = false;
    for (const f of activeFamilies) {
      if (visible.has(f)) filtered.add(f);
      else pruned = true;
    }
    if (pruned) setActiveFamilies(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, familiesForCategory.join('|')]);

  // ── Region scope (v2.19.11) ────────────────────────────────────────
  // Regions available in the current Provider × Category × Family scope,
  // each annotated with the number of VMs at that intersection. Drives
  // the searchable Region dropdown at the bottom of the filter card.
  const availableRegions = useMemo(() => {
    if (!activeProvider || !activeCategory) return [] as Array<{ region: string; count: number }>;
    const m = new Map<string, number>();
    for (const v of vms) {
      if (providerOf(v) !== activeProvider) continue;
      if (categoryOf(v) !== activeCategory) continue;
      if (activeFamilies.size > 0 && !activeFamilies.has(vmFamily(v))) continue;
      const r = v.region ?? '';
      if (!r) continue;
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [vms, activeProvider, activeCategory, activeFamilies]);
  const totalAcrossAvailable = availableRegions.reduce((n, r) => n + r.count, 0);

  // ── VM list filtering ──────────────────────────────────────────────
  const filteredVms = useMemo(() => {
    if (!activeProvider || !activeCategory) return [] as UserVm[];
    if (activeFamilies.size === 0) return [] as UserVm[];
    const q = search.trim().toLowerCase();
    return vms.filter((v) => {
      if (providerOf(v) !== activeProvider) return false;
      if (regionForActive && (v.region ?? '') !== regionForActive) return false;
      if (categoryOf(v) !== activeCategory) return false;
      if (!activeFamilies.has(vmFamily(v))) return false;
      if (!q) return true;
      return (
        v.vmSizeName.toLowerCase().includes(q) ||
        (v.family ?? '').toLowerCase().includes(q) ||
        (v.vmGeneration ?? '').toLowerCase().includes(q) ||
        (v.region ?? '').toLowerCase().includes(q)
      );
    });
  }, [vms, activeProvider, regionForActive, activeCategory, activeFamilies, search]);

  // Group by family, ordered by compareFamily.
  const grouped = useMemo(() => {
    const m = new Map<string, UserVm[]>();
    for (const v of filteredVms) {
      const fam = vmFamily(v);
      if (!m.has(fam)) m.set(fam, []);
      m.get(fam)!.push(v);
    }
    return [...m.entries()]
      .sort((a, b) => compareFamily(a[0], b[0]))
      .map(([family, rows]) => ({
        family,
        rows: rows.sort((a, b) => a.vmSizeName.localeCompare(b.vmSizeName, undefined, { numeric: true })),
      }));
  }, [filteredVms]);

  // Toggle helpers
  const toggleFamily = (f: string) => {
    setActiveFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };
  const toggleFamilyGroupCollapse = (f: string) => {
    setCollapsedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };
  const toggleCardExpand = (key: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Upload flow (preserved from v2.17) ─────────────────────────────
  // v2.19.12 — Per-VM delete removed. The catalog is native dashboard
  // data shipped from vendor docs + pricing APIs; modifying it is done by
  // re-uploading the Excel template (which replaces the catalog wholesale).
  // No more per-row × button → no need for the undo machinery either.
  const onUpload = async (file: File) => {
    setImportMsg(null);
    try {
      const result = await parseVmTemplate(file);
      if (result.vms.length === 0) {
        setImportMsg({ kind: 'err', text: 'Import failed: no valid VM rows found in this file.' });
        return;
      }
      if (
        hasAny &&
        !window.confirm(
          `Replace your current VM catalog with ${result.vms.length.toLocaleString()} VM size(s) from this file?`,
        )
      ) {
        return;
      }
      // v2.25.5 — Mark the catalog user-owned: it now wins over (and replaces)
      // the baked live catalog, is persisted, and the boot-time live swap
      // stands down. ↻ Refresh reverts to the live default.
      saveUserCatalogUploaded(true);
      dispatch({ type: 'VM_REPLACE', vms: result.vms });
      const warn = result.warnings.length
        ? ` · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`
        : '';
      setImportMsg({
        kind: 'ok',
        text: `Imported ${result.vms.length.toLocaleString()} VM size(s)${warn}.`,
      });
      result.warnings.forEach((w) => console.warn('[VM import]', w));
    } catch (err) {
      console.error('[VM import]', err);
      setImportMsg({
        kind: 'err',
        text: `Import failed: ${err instanceof Error ? err.message : 'could not parse file'}`,
      });
    }
  };
  useEffect(() => {
    if (!importMsg) return;
    const t = window.setTimeout(() => setImportMsg(null), 6000);
    return () => window.clearTimeout(t);
  }, [importMsg]);

  // ── Counts / totals for the header ─────────────────────────────────
  const totalVms = vms.length;
  const totalRegions = useMemo(() => {
    const set = new Set<string>();
    for (const v of vms) {
      if (v.region) set.add(`${providerOf(v)}|${v.region}`);
    }
    return set.size;
  }, [vms]);

  // Helpful CTA when nothing's been picked yet.
  const scopeMissing = !activeProvider || !activeCategory;
  const familiesMissing = !scopeMissing && activeFamilies.size === 0;

  return (
    <div className="p-4 space-y-4 text-xs text-text-primary relative">
      <SeedDisclaimerBanner surface="vm" />

      {/* Live-rate loader — visible only when a provider has been ingested. */}
      <LiveRatesPanel />

      {/* ── Header pill — title + per-VM totals + Excel actions ─────── */}
      <section className="space-y-2">
        <h2 className="section-h flex items-center gap-2 flex-wrap">
          <span>VM Library</span>
          {totalVms > 0 && (
            <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
              · {totalVms.toLocaleString()} VMs across {totalRegions.toLocaleString()} regions
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => downloadVmTemplate(state.userVms)}
              className="text-[10px] font-medium transition-all"
              style={{
                padding: '3px 10px',
                background: 'rgba(129, 140, 248, 0.10)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.05em',
              }}
              title="Download the live VM template (4 tabs: Azure / AWS / GCP / Custom)"
            >
              ⤓ Template
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] font-medium transition-all"
              style={{
                padding: '3px 10px',
                background: 'rgba(129, 140, 248, 0.10)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.05em',
              }}
              title="Upload your filled-in VM Excel — REPLACES the current catalog"
            >
              ⤒ Upload
            </button>
            <button
              type="button"
              onClick={() => {
                // v2.25.5 — Revert to the baked LIVE catalog (real, current
                // rates for every region/cloud/size). Clears the user-upload
                // flag so the default freshness model resumes.
                saveUserCatalogUploaded(false);
                saveSeedVersion(PUBLIC_SEED_VERSION);
                const live = buildLiveCatalog();
                dispatch({ type: 'VM_REPLACE', vms: live, silent: true });
                setImportMsg({
                  kind: 'ok',
                  text: `Reverted to the live catalog — ${live.length.toLocaleString()} sizes across all regions, rates as of ${LIVE_CATALOG_AS_OF}.`,
                });
              }}
              className="text-[10px] font-medium transition-all"
              style={{
                padding: '3px 10px',
                background: 'rgba(148, 163, 184, 0.10)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.05em',
              }}
              title={`Revert to the live catalog — real, current rates for every region/cloud/size (as of ${LIVE_CATALOG_AS_OF}). Discards an uploaded catalog. Seed version: ${PUBLIC_SEED_VERSION}`}
            >
              ↻ Refresh
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = '';
              }}
            />
          </div>
        </h2>
        <p className="text-[10.5px] text-text-muted leading-snug">
          Every VM available to the simulator. Pick a Cloud Provider and VM Category to browse;
          click any card to see full specs and pricing. Use <strong style={{ color: 'var(--interactive)' }}>⤓ Template</strong> to
          download an Excel sheet for adding your own VMs, then <strong style={{ color: 'var(--interactive)' }}>⤒ Upload</strong>{' '}
          to replace this catalog.
        </p>
        {importMsg && (
          <div
            className="px-3 py-2 text-[10px]"
            style={{
              background:
                importMsg.kind === 'ok' ? 'rgba(129, 140, 248, 0.10)' : 'rgba(239, 68, 68, 0.10)',
              border: `1px solid ${
                importMsg.kind === 'ok' ? 'var(--border-glow)' : 'rgba(239, 68, 68, 0.40)'
              }`,
              color: importMsg.kind === 'ok' ? 'var(--interactive)' : '#FCA5A5',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {importMsg.text}
          </div>
        )}
      </section>

      {!hasAny ? (
        <div
          className="text-[11px] px-3 py-3 leading-snug"
          style={{
            background: 'rgba(129, 140, 248, 0.06)',
            border: '1px solid var(--border-glow)',
            color: 'var(--interactive)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          ● No VMs in your catalog yet. Click <strong>⤓ Template</strong> above to download the Excel,
          fill in your sizes, and <strong>⤒ Upload</strong> to populate the simulator. Or hit{' '}
          <strong>↻ Refresh</strong> to re-pull the public seed.
        </div>
      ) : (
        <>
          {/* ── Cloud Provider + Region picker ──────────────────────── */}
          <section
            className="px-3 py-2.5 flex items-center gap-3 flex-wrap"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
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
                if (typeof next === 'string') {
                  setActiveProvider(next);
                  setActiveCategory(null);
                  setActiveFamilies(new Set());
                }
              }}
              counts={providerCounts}
              emptyTooltip={(p) =>
                `No ${p} VMs uploaded yet — fill the ${p} sheet of the template and upload`
              }
            />
            {regionForActive && (
              <span
                className="text-[10px] text-text-muted normal-case tracking-normal ml-auto"
                title="Active pricing region — change it in the Region picker inside the filter card below."
              >
                region: <span className="text-text-primary">{regionForActive}</span>
              </span>
            )}
          </section>

          {/* ── VM Catalog Filter — Category + Family + search ──────── */}
          {activeProvider && (
            <section
              className="p-3 space-y-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                className="text-[9px] tracking-[0.04em] text-text-secondary"
                style={{ marginBottom: 0 }}
              >
                VM catalog filter
              </div>

              {/* Category — required-single-select. */}
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
                    No VMs uploaded for {activeProvider}{regionForActive ? ` / ${regionForActive}` : ''}.
                  </span>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {familiesByCategory.map(({ category, families }) => (
                      <FilterChip
                        key={category}
                        label={`${category} · ${families.length}`}
                        active={activeCategory === category}
                        onClick={() => {
                          setActiveCategory(category);
                          setActiveFamilies(new Set());
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Family — multi-select scoped to category. */}
              {activeCategory && familiesForCategory.length > 0 && (
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <span className="text-[9px] tracking-[0.04em] text-text-secondary">
                    VM Family
                    <span className="text-text-muted normal-case tracking-normal ml-1.5">
                      · {familiesForCategory.length} in {activeCategory}
                      {activeFamilies.size > 0 && ` · ${activeFamilies.size} selected`}
                    </span>
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {familiesForCategory.map((f) => (
                      <FilterChip
                        key={f}
                        label={f}
                        active={activeFamilies.has(f)}
                        onClick={() => toggleFamily(f)}
                      />
                    ))}
                    {activeFamilies.size > 0 && (
                      <button
                        onClick={() => setActiveFamilies(new Set())}
                        className="text-[10px] tracking-[0.02em] text-text-muted hover:text-text-primary transition-colors"
                        style={{ padding: '3px 6px' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Region — searchable dropdown scoped to current Provider ×
                  Category × Family. v2.19.11: moved here from the Provider
                  row so the user picks Category + Family first, and the
                  Region list filters to what's actually available. With
                  142+ regions in the public seed, a native <select> is
                  unworkable — GlassDropdown searchable lets the user type
                  to filter. */}
              {activeCategory && activeProvider && (
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <span className="text-[9px] tracking-[0.04em] text-text-secondary">
                    Region
                    <span className="text-text-muted normal-case tracking-normal ml-1.5">
                      · {availableRegions.length} available in current scope
                      {regionForActive && availableRegions.length > 0 && ` · 1 selected`}
                    </span>
                  </span>
                  <RegionDropdown
                    provider={activeProvider}
                    availableRegions={availableRegions}
                    totalAcrossAvailable={totalAcrossAvailable}
                    active={regionForActive}
                    onPick={(r) => setProviderRegion(activeProvider, r)}
                  />
                </div>
              )}

              {/* Pricing basis — re-prices the catalog at PAYG / 1yr RI / 3yr RI. */}
              {activeCategory && (
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <span className="text-[9px] tracking-[0.04em] text-text-secondary">
                    Pricing basis
                    <span className="text-text-muted normal-case tracking-normal ml-1.5">
                      · rates below shown at {RATE_LABEL[rateBasis]}
                    </span>
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Pricing basis"
                    className="inline-flex p-0.5"
                    style={{
                      gap: 2,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--tint-soft)',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {(['payg', 'ri1y', 'ri3y'] as RateType[]).map((r) => {
                      const on = rateBasis === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setRateBasis(r)}
                          className="transition-colors"
                          style={{
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: on ? 600 : 500,
                            borderRadius: 'var(--radius-pill)',
                            border: 'none',
                            cursor: 'pointer',
                            background: on ? 'var(--interactive)' : 'transparent',
                            color: on ? '#fff' : 'var(--text-secondary)',
                          }}
                        >
                          {RATE_LABEL[r]}
                        </button>
                      );
                    })}
                  </div>
                  {/* Opt-in: estimate missing RI rates (PAYG × measured discount). */}
                  {rateBasis !== 'payg' && (
                    <label
                      className="flex items-start text-[10.5px]"
                      style={{ gap: 6, color: 'var(--text-secondary)', cursor: 'pointer', maxWidth: 460 }}
                    >
                      <input
                        type="checkbox"
                        checked={state.ui.estimateMissingRates ?? false}
                        onChange={(e) =>
                          dispatch({ type: 'UI_SET', ui: { estimateMissingRates: e.target.checked } })
                        }
                        style={{ marginTop: 1 }}
                      />
                      <span>
                        Estimate {RATE_LABEL[rateBasis]} where the cloud publishes no reserved rate
                        <span style={{ color: 'var(--text-muted)' }}>
                          {' '}— PAYG × the provider's measured median discount; shown values are
                          badged <span style={{ color: '#FBBF24', fontWeight: 600 }}>est.</span> When off,
                          unpublished rates show “—”.
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Search input — narrows further within scope. */}
              {activeCategory && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${filteredVms.length} VM${filteredVms.length === 1 ? '' : 's'}…`}
                  className="glass-input text-[11px] font-mono"
                  style={{ padding: '6px 10px', width: '100%' }}
                  aria-label="Search the VM list"
                />
              )}
            </section>
          )}

          {/* ── Catalog list ────────────────────────────────────────── */}
          {scopeMissing ? (
            <div className="text-[10.5px] text-text-muted italic px-3 py-4 text-center">
              Pick a Cloud Provider and VM Category above to browse the catalog.
            </div>
          ) : familiesMissing ? (
            <div className="text-[10.5px] text-text-muted italic px-3 py-4 text-center">
              Pick one or more VM Family chips in <strong>{activeCategory}</strong> above to populate the list.
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-[10.5px] text-text-muted italic px-3 py-4 text-center">
              No VMs match your filters.
            </div>
          ) : (
            <section className="space-y-2">
              {grouped.map(({ family, rows }) => {
                const collapsed = collapsedFamilies.has(family);
                return (
                  <div
                    key={family}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <button
                      onClick={() => toggleFamilyGroupCollapse(family)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left bg-transparent border-0 cursor-pointer"
                      aria-expanded={!collapsed}
                    >
                      <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
                        {collapsed ? '▸' : '▾'}
                      </span>
                      <span
                        className="text-[10px] tracking-[0.04em] font-semibold"
                        style={{ color: 'var(--interactive)' }}
                      >
                        {family}
                      </span>
                      <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
                        {rows.length} VM{rows.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    {!collapsed && (
                      <div className="px-3 pb-3 pt-1 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {rows.map((vm) => {
                          const key = `${vm.vmSizeName}|${vm.region ?? ''}`;
                          return (
                            <VmCard
                              key={key}
                              vm={vm}
                              rate={rateBasis}
                              estimateOn={state.ui.estimateMissingRates ?? false}
                              expanded={expandedCards.has(key)}
                              onToggleExpand={() => toggleCardExpand(key)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.19.11 — Region searchable dropdown, scoped to current Provider ×
// Category × Family. Uses GlassDropdown so the user can type to filter the
// 142+ regions in the public seed. Each option carries the VM-count for
// that region in the active scope as its meta line. "All regions" sentinel
// at the top resets the per-provider region scope.
// ────────────────────────────────────────────────────────────────────────
const ALL_REGIONS_SENTINEL = '__all__';

function RegionDropdown({
  provider,
  availableRegions,
  totalAcrossAvailable,
  active,
  onPick,
}: {
  provider: string;
  availableRegions: Array<{ region: string; count: number }>;
  totalAcrossAvailable: number;
  active: string | undefined;
  onPick: (region: string) => void;
}) {
  const options: DropdownOption[] = useMemo(() => {
    const allOption: DropdownOption = {
      value: ALL_REGIONS_SENTINEL,
      label: 'All regions',
      meta: `${totalAcrossAvailable.toLocaleString()} VMs in current filter scope`,
    };
    const regionOptions = availableRegions.map((r) => ({
      value: r.region,
      label: r.region,
      meta: `${r.count.toLocaleString()} VM${r.count === 1 ? '' : 's'}`,
    }));
    return [allOption, ...regionOptions];
  }, [availableRegions, totalAcrossAvailable]);

  // Display "(stale)" hint when the persisted region for this provider
  // isn't in the current scope's available set. The list will return zero
  // results in that case; user can pick "All regions" or a different one.
  const isStale = active != null && !availableRegions.some((r) => r.region === active);

  return (
    <div className="flex flex-col gap-1">
      <GlassDropdown
        value={active ?? ALL_REGIONS_SENTINEL}
        options={options}
        onChange={onPick}
        placeholder={`Search ${availableRegions.length} region${availableRegions.length === 1 ? '' : 's'} for ${provider}…`}
        searchable
        visibleRows={6}
      />
      {isStale && (
        <span
          className="text-[9.5px] italic"
          style={{ color: '#FCD34D' }}
          title="The previously-picked region isn't in your current Category/Family scope — pick another or All regions."
        >
          ⚠ {active} not in current scope · zero matches
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// FilterChip — same visual treatment as BoM / Fungibility for consistency.
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

// ────────────────────────────────────────────────────────────────────────
// VmCard — compact summary by default; click ▸ to expand for full specs.
// ────────────────────────────────────────────────────────────────────────
function VmCard({
  vm,
  rate,
  estimateOn,
  expanded,
  onToggleExpand,
}: {
  vm: UserVm;
  rate: RateType;
  estimateOn: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const memLabel =
    vm.memoryGib >= 1024
      ? `${(vm.memoryGib / 1024).toLocaleString(undefined, { maximumFractionDigits: 2 })} TiB`
      : `${vm.memoryGib.toLocaleString()} GiB`;
  const hourly = vm.hourlyUsd;
  const ri1 = vm.riOneYrHourlyUsd;
  const ri3 = vm.riThreeYrHourlyUsd;
  // v2.25.6 — the summary price + day/mo follow the selected pricing basis.
  // v2.26.1 — when the basis is RI and the real rate is missing, optionally
  // show an estimate (PAYG × measured discount), flagged `estimated`.
  const resolved = resolveDisplayRate(vm, rate, estimateOn);
  const shown = resolved.value ?? null;
  const isEst = resolved.estimated;
  const daily = shown != null ? shown * 24 : null;
  const monthly = shown != null ? shown * HOURS_PER_MONTH : null;
  const providerTheme = PROVIDER_THEMES[vm.provider ?? ''];

  return (
    <div
      className="px-3 py-1.5 transition-colors"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {/* Summary row — always visible. */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onToggleExpand}
          className="text-[10px] bg-transparent border-0 cursor-pointer"
          style={{ color: 'var(--interactive)', padding: '0 2px' }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide spec details' : 'Show spec details'}
          title={expanded ? 'Hide details' : 'Show full specs'}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <span
          className="text-[11.5px] font-mono text-text-primary flex-1 min-w-0 truncate"
          title={vm.vmSizeName}
        >
          {vm.vmSizeName}
        </span>
        {vm.region && (
          <span
            className="font-mono"
            style={{
              fontSize: 9.5,
              padding: '1px 7px',
              borderRadius: 'var(--radius-pill)',
              background: providerTheme?.bg ?? 'rgba(255,255,255,0.06)',
              border: `1px solid ${providerTheme?.border ?? 'rgba(255,255,255,0.12)'}`,
              color: providerTheme?.text ?? 'var(--text-secondary)',
            }}
            title={`Pricing region · ${vm.region}`}
          >
            {vm.region}
          </span>
        )}
        <span className="text-[10px] font-mono text-text-muted">
          {vm.vcpus} vCPU · {memLabel}
        </span>
        {shown != null && (
          <span
            className="text-[10px] font-mono inline-flex items-center"
            style={{ color: isEst ? '#FBBF24' : 'var(--interactive)', gap: 4 }}
            title={isEst ? `Estimated ${RATE_LABEL[rate]} — no published rate; PAYG × typical discount` : `${RATE_LABEL[rate]} hourly rate`}
          >
            {isEst && <span style={{ fontSize: 8.5, fontWeight: 700 }}>est.</span>}
            {isEst ? '~' : ''}{fmtUsd(shown)}/hr
            {rate !== 'payg' && (
              <span className="text-text-muted" style={{ fontSize: 8.5 }}>
                {RATE_LABEL[rate]}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Expanded detail panel. */}
      {expanded && (
        <div
          className="mt-2 pt-2 grid gap-x-4 gap-y-1.5"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Identity / classification */}
          <StatBlock title="Identity">
            <StatRow label="Generation" value={vm.vmGeneration || '—'} />
            <StatRow label="Series" value={vm.series || '—'} />
            <StatRow label="Family" value={vmFamily(vm)} />
            <StatRow label="Category" value={categoryOf(vm)} />
            <StatRow label="Provider" value={vm.provider ?? 'Other'} />
            <StatRow label="Processor" value={vm.processor || '—'} />
          </StatBlock>

          {/* Compute */}
          <StatBlock title="Compute">
            <StatRow label="vCPUs" value={vm.vcpus.toLocaleString()} />
            <StatRow label="Memory" value={memLabel} />
            <StatRow label="Network" value={vm.networkMbps > 0 ? `${vm.networkMbps.toLocaleString()} Mbps` : '—'} />
            {vm.networkNicCount != null && (
              <StatRow label="NICs" value={String(vm.networkNicCount)} />
            )}
          </StatBlock>

          {/* Local storage */}
          {(vm.localStorageGiB || vm.localStorageDiskCount || vm.localStorageIopsRR || vm.localStorageMbpsRR) && (
            <StatBlock title="Local Storage">
              {vm.localStorageDiskCount != null && (
                <StatRow label="Disks" value={String(vm.localStorageDiskCount)} />
              )}
              {vm.localStorageGiB != null && (
                <StatRow label="Capacity" value={`${vm.localStorageGiB.toLocaleString()} GiB`} />
              )}
              {vm.localStorageIopsRR != null && (
                <StatRow label="IOPS (RR)" value={vm.localStorageIopsRR.toLocaleString()} />
              )}
              {vm.localStorageMbpsRR != null && (
                <StatRow label="MBps (RR)" value={vm.localStorageMbpsRR.toLocaleString()} />
              )}
            </StatBlock>
          )}

          {/* Remote storage */}
          {(vm.remoteStorageDisks || vm.remoteStorageIopsPremium || vm.remoteStorageMbpsPremium ||
            vm.remoteStorageIopsUltra || vm.remoteStorageMbpsUltra) && (
            <StatBlock title="Remote Storage">
              {vm.remoteStorageDisks != null && (
                <StatRow label="Max disks" value={String(vm.remoteStorageDisks)} />
              )}
              {vm.remoteStorageIopsPremium != null && (
                <StatRow label="Premium IOPS" value={vm.remoteStorageIopsPremium.toLocaleString()} />
              )}
              {vm.remoteStorageMbpsPremium != null && (
                <StatRow label="Premium MBps" value={vm.remoteStorageMbpsPremium.toLocaleString()} />
              )}
              {vm.remoteStorageIopsUltra != null && (
                <StatRow label="Ultra IOPS" value={vm.remoteStorageIopsUltra.toLocaleString()} />
              )}
              {vm.remoteStorageMbpsUltra != null && (
                <StatRow label="Ultra MBps" value={vm.remoteStorageMbpsUltra.toLocaleString()} />
              )}
            </StatBlock>
          )}

          {/* Accelerator */}
          {vm.acceleratorType && vm.acceleratorType !== 'None' && (
            <StatBlock title="Accelerator">
              <StatRow label="Type" value={vm.acceleratorType} />
            </StatBlock>
          )}

          {/* Pricing — all three hourly bases (selected one ▸-marked); an
              absent RI shows the estimate (badged "est.") when opted in, then
              day / month at the selected basis. */}
          {(() => {
            const r1 = resolveDisplayRate(vm, 'ri1y', estimateOn);
            const r3 = resolveDisplayRate(vm, 'ri3y', estimateOn);
            const riValue = (real: number | undefined, est: { value?: number; estimated: boolean }) =>
              real != null
                ? fmtUsd(real)
                : est.estimated && est.value != null
                ? `~${fmtUsd(est.value)} est.`
                : null;
            const v1 = riValue(ri1, r1);
            const v3 = riValue(ri3, r3);
            const dayMo = (n: number) => (isEst ? `~${fmtUsd(n)} est.` : fmtUsd(n));
            if (hourly == null && v1 == null && v3 == null) return null;
            return (
              <StatBlock title="Pricing">
                {hourly != null && (
                  <StatRow label={`${rate === 'payg' ? '▸ ' : ''}PAYG / hr`} value={fmtUsd(hourly)} />
                )}
                {v1 != null && <StatRow label={`${rate === 'ri1y' ? '▸ ' : ''}1y RI / hr`} value={v1} />}
                {v3 != null && <StatRow label={`${rate === 'ri3y' ? '▸ ' : ''}3y RI / hr`} value={v3} />}
                {daily != null && <StatRow label={`${RATE_LABEL[rate]} / day`} value={dayMo(daily)} />}
                {monthly != null && <StatRow label={`${RATE_LABEL[rate]} / mo`} value={dayMo(monthly)} />}
              </StatBlock>
            );
          })()}

          {vm.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="text-[9px] tracking-[0.04em] text-text-muted mb-1">
                Notes
              </div>
              <div
                className="text-[10.5px] text-text-secondary leading-snug"
                style={{ wordBreak: 'break-word' }}
              >
                {vm.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.04em] text-text-muted mb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-[10.5px] font-mono">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

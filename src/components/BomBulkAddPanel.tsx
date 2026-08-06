/**
 * v2.19.5 — BoM Bulk Add panel.
 *
 * The single-row VmAutocomplete at the bottom of each BomSection panel is
 * fine for adding one VM at a time but slow when speccing out 30 rows.
 * This panel lives BETWEEN the filter row and the BomSection rows. Default
 * collapsed (so it doesn't dominate the page). Expanded, it shows a
 * scrollable grid of every VM in the active scope (Provider × Region ×
 * Category × Families) with a quantity input per row.
 *
 * Two-way binding: the Qty input is bound to the matching BomEntry. Typing
 * N upserts (BOM_ADD if no existing row, BOM_UPDATE if there is). Clearing
 * to 0 or empty removes the row. The grid stays in sync with whatever's on
 * the BoM, so the user can use either surface (this grid OR the BomSection
 * rows below) and they reflect the same underlying state.
 *
 * In-grid search filter narrows further within the active scope so the user
 * doesn't have to leave the panel when looking for a specific SKU.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { providerOf, vmFamily } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { parseBomTemplate } from '../utils/bomTemplate';
import type { CatalogEntry, VmCategory } from '../types';
import { ZONES } from '../types';
import { fleetList } from '../state/AppState';
import { NumberInput } from './NumberInput';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';

// v2.19.30 — One zone per row, period. User reinforcement: "If a user
// wanted to pin to a zone, they would pin one deployment at a time."
// Picking a zone on a row REPLACES the previous pick (not toggles into a
// multi-zone set). Two-zone HA semantics belongs to a *separate* BoM row
// — that's what the per-intent dedup change (v2.19.30) enables.
// v2.19.37 — Panel-level "Default deployment" surface removed; each row
// (Quick Add + Browse) authors its own Reg/Zonal + Zone inline, so no
// per-row cap constant is needed at the module scope anymore.

/** v2.19.22 — Network throughput formatted with the most readable unit.
 *  networkMbps is in megabits/sec — show GiB-friendly Gbps over 1000. */
function fmtNetwork(mbps: number | undefined): string {
  if (typeof mbps !== 'number' || !Number.isFinite(mbps)) return '—';
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  return `${Math.round(mbps)} Mbps`;
}

/** v2.19.51 — Memory formatted with the most readable unit. ≥1024 GiB
 *  switches to TiB so multi-TB SKUs (M-series, x2idn, etc.) stay compact. */
function fmtMemory(gib: number | undefined): string {
  if (typeof gib !== 'number' || !Number.isFinite(gib)) return '—';
  if (gib >= 1024) return `${(gib / 1024).toFixed(gib % 1024 === 0 ? 0 : 1)} TiB`;
  return `${Math.round(gib)} GiB`;
}

function categoryOf(v: CatalogEntry): VmCategory {
  return v.category ?? categorize(v.provider, v.family);
}

export function BomBulkAddPanel() {
  const { state, dispatch } = useApp();
  // v2.19.18 — Default OPEN so the grid is visible without a hunt. The grid
  // body caps at 360px scroll so it never dominates the page.
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const provider = state.ui.bomProvider;
  const region = provider ? state.ui.activeRegion[provider] : undefined;
  // v2.19.13 — Resolve the active category locally with the same fallback
  // BomFilter uses (first available). Reading state.ui.bomCategories[0]
  // directly caused a "scope missing → grid disappears" flash whenever the
  // persisted category was empty (transient between dispatches, after BoM
  // mutations, after upload, etc.). Now BulkPanel resolves identically.
  const persistedCategory: VmCategory | null =
    (state.ui.bomCategories[0] as VmCategory | undefined) ?? null;
  // Build the available-categories list the same way BomFilter does so we
  // can fall back when the persisted one is empty.
  // v2.19.18 — Category list scoped by PROVIDER only (NOT region), matching
  // BomFilter. Region is the last filter; scoping categories by it dropped
  // families the active region lacks and made the cascade inconsistent.
  const categoriesForProvider = useMemo(() => {
    if (!provider) return [] as VmCategory[];
    const seen = new Set<VmCategory>();
    for (const v of state.userVms) {
      if (providerOf(v) !== provider) continue;
      seen.add(v.category ?? categorize(v.provider, v.family));
    }
    return [...seen];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userVms, provider]);
  const activeCategory: VmCategory | null =
    persistedCategory && categoriesForProvider.includes(persistedCategory)
      ? persistedCategory
      : categoriesForProvider[0] ?? null;
  const selectedFamilies = new Set(state.ui.bomFamilies);

  // v2.22.6 — The Region picker moved BACK out of this panel into the
  // consolidated BoM filter box (BomFilter); this grid just reads the
  // resolved `region` from state for its scope check below.

  // v2.19.7 — Require an explicit family pick to populate the grid.
  // Aligns with the Fungibility tab's "require pick" doctrine — both tabs
  // now feel consistent. Showing all 114 General Purpose VMs by default
  // was overwhelming and made the chip filter feel optional.
  // Provider × region × category × families ALL required to surface rows.
  const vmsInScope = useMemo(() => {
    if (!provider || !activeCategory) return [] as CatalogEntry[];
    if (selectedFamilies.size === 0) return [] as CatalogEntry[];
    return state.userVms.filter((v) => {
      if (providerOf(v) !== provider) return false;
      if (region && (v.region ?? '') !== region) return false;
      if (categoryOf(v) !== activeCategory) return false;
      if (!selectedFamilies.has(vmFamily(v))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userVms, provider, region, activeCategory, state.ui.bomFamilies.join('|')]);

  // Dedupe across regions — the catalog has the same SKU appearing once per
  // region; the bulk picker should show one row per SKU, ordered by name.
  const uniqueVms = useMemo(() => {
    const seen = new Map<string, CatalogEntry>();
    for (const v of vmsInScope) {
      const key = v.vmSizeName.toLowerCase();
      if (!seen.has(key)) seen.set(key, v);
    }
    return [...seen.values()].sort((a, b) =>
      a.vmSizeName.localeCompare(b.vmSizeName, undefined, { numeric: true }),
    );
  }, [vmsInScope]);

  const filteredVms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uniqueVms;
    return uniqueVms.filter((v) => v.vmSizeName.toLowerCase().includes(q));
  }, [uniqueVms, query]);

  // v2.19.30 — Per-intent BoM index. Same SKU on different deployments
  // (regional vs zonal-Z1 vs zonal-Z2) is now N separate rows, NOT one
  // collapsed row. The lookup key is `${sku}|${deploymentKey}` where
  // deploymentKey canonicalizes (type, sorted-zones). Submit reads this
  // exact-intent map: match → BOM_UPDATE that row; miss → BOM_ADD a new
  // row. The aggregate "On BoM" column instead sums quantities across
  // every intent of the SKU so the user still sees the SKU-level total.
  const deploymentKey = (
    deploymentType: 'regional' | 'zonal' | undefined,
    zones: readonly string[] | undefined,
  ): string => {
    const type = deploymentType ?? 'regional';
    if (type === 'regional') return 'regional';
    const sorted = [...(zones ?? [])].sort().join(',');
    return sorted ? `zonal|${sorted}` : 'zonal|';
  };
  // v2.22.9 — Intent key now includes the row's stamped region, so the same
  // SKU added in two different regions stays as two separate BoM lines (each
  // deploys + prices in its own region) instead of merging.
  const bomIndexByIntent = useMemo(() => {
    const m = new Map<string, { entry: typeof state.bom[number]; index: number }>();
    state.bom.forEach((e, i) => {
      const k = `${e.vmSizeName.toLowerCase()}|${e.region ?? ''}|${deploymentKey(e.deploymentType, e.zones)}`;
      m.set(k, { entry: e, index: i });
    });
    return m;
  }, [state.bom]);
  // SKU-level rollup for the "On BoM" column — total quantity across every
  // intent and total intent count for the tooltip.
  const bomBySku = useMemo(() => {
    const m = new Map<string, { totalQty: number; intentCount: number }>();
    for (const e of state.bom) {
      const k = e.vmSizeName.toLowerCase();
      const prev = m.get(k) ?? { totalQty: 0, intentCount: 0 };
      prev.totalQty += e.quantity;
      prev.intentCount += 1;
      m.set(k, prev);
    }
    return m;
  }, [state.bom]);
  // Back-compat alias — submitOne previously called bomIndex.get(key); now
  // it must dedup by intent. Keep `bomIndex` referring to the SKU-level
  // index (used elsewhere) so the rename surface is small.
  const bomIndex = useMemo(() => {
    // Returns ANY entry for this SKU, used only as a "has a row?" probe
    // by onBoMCount + the "On BoM" hint. Submission uses bomIndexByIntent.
    const m = new Map<string, { entry: typeof state.bom[number]; index: number }>();
    state.bom.forEach((e, i) => {
      const k = e.vmSizeName.toLowerCase();
      if (!m.has(k)) m.set(k, { entry: e, index: i });
    });
    return m;
  }, [state.bom]);

  const onBoMCount = useMemo(() => {
    let n = 0;
    for (const v of uniqueVms) {
      if (bomIndex.has(v.vmSizeName.toLowerCase())) n++;
    }
    return n;
  }, [uniqueVms, bomIndex]);

  // v2.19.9 — Qty inputs no longer auto-commit. They write to a local
  // STAGING map; user explicitly submits via per-row + or the bulk add
  // button at the bottom. Submits are ADDITIVE — if A1_v2 is already on
  // BoM with qty 50 and the user submits another 10, the BoM goes to 60.
  // This separates "browsing/picking" from "committing", which matches how
  // most spreadsheet workflows feel and lets users iterate without
  // accidentally polluting the BoM.
  // v2.19.37 — Panel-level "Default deployment" surface removed (it was
  // redundant with the per-row Reg/Zonal + Zone controls). Each row authors
  // its own deployment intent inline. Rows without an explicit override
  // fall back to {regional, no zone} — the dominant case anyway.
  const [stagedDeployment, setStagedDeployment] = useState<
    Record<string, { type: 'regional' | 'zonal'; zone: string | null }>
  >({});
  /** Resolve a row's effective deployment: explicit row pin, else regional default. */
  const resolveRowDeployment = (
    key: string,
  ): { type: 'regional' | 'zonal'; zone: string | null } => {
    return stagedDeployment[key] ?? { type: 'regional', zone: null };
  };
  const setRowDeploymentType = (key: string, type: 'regional' | 'zonal') => {
    const current = resolveRowDeployment(key);
    setStagedDeployment((prev) => ({
      ...prev,
      [key]: { type, zone: type === 'regional' ? null : current.zone },
    }));
  };
  const setRowZone = (key: string, zone: string | null) => {
    setStagedDeployment((prev) => ({
      ...prev,
      [key]: { type: 'zonal', zone },
    }));
  };
  const clearRowDeployment = (key: string) => {
    setStagedDeployment((prev) => {
      const { [key]: _drop, ...rest } = prev;
      void _drop;
      return rest;
    });
  };
  // Zones the user has authored on at least one cluster — drives the
  // "no-clusters-in-this-zone" amber tint on chips.
  const zonesWithClusters = useMemo(() => {
    const s = new Set<string>();
    for (const g of state.userHardware) if (g.zone) s.add(g.zone);
    for (const { fleet } of fleetList(state)) if (fleet.zone) s.add(fleet.zone);
    return s;
  }, [state.userHardware, state.fleets]);

  const [stagedQty, setStagedQty] = useState<Record<string, number>>({});

  // v2.19.31 — Quick-add surface. Search-first primary entry path: the user
  // types a SKU, picks from suggestions, sets qty + zone, and commits — all
  // without scrolling the grid. The grid demotes to a collapsed "Browse all"
  // panel below.
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [quickQuery, setQuickQuery] = useState('');
  const [quickPicked, setQuickPicked] = useState<CatalogEntry | null>(null);
  const [quickQty, setQuickQty] = useState(0);
  // v2.19.34 — Reg/Zonal split out from the zone selection so the flow
  // reads: VM → Qty → Reg/Zonal → (if Zonal) Zone dropdown → Add.
  // Zone is single-select. null = "any" (zonal balance across all zones
  // with clusters); 'Zone N' = pin to that zone.
  const [quickDeploymentType, setQuickDeploymentType] = useState<'regional' | 'zonal'>('regional');
  const [quickZone, setQuickZone] = useState<string | null>(null);
  const [quickZoneDropdownOpen, setQuickZoneDropdownOpen] = useState(false);
  const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
  const [quickHighlightIdx, setQuickHighlightIdx] = useState(0);
  // v2.22.6 — Default OPEN so the bulk add TABLE is visible (the user wants
  // to build a BoM fast from the filtered grid, not hunt behind a toggle).
  const [browseOpen, setBrowseOpen] = useState(true);
  const setStaged = (vm: CatalogEntry, n: number) => {
    const key = vm.vmSizeName.toLowerCase();
    setStagedQty((prev) => {
      const next = { ...prev };
      if (n <= 0) {
        delete next[key];
      } else {
        next[key] = Math.floor(n);
      }
      return next;
    });
  };
  /** Commit one staged row to the BoM (additive). */
  const submitOne = (vm: CatalogEntry) => {
    const key = vm.vmSizeName.toLowerCase();
    const add = stagedQty[key];
    if (!add || add <= 0) return;
    // v2.19.30 — Resolve THIS submission's deployment intent first, then
    // look up an existing BoM row keyed by (sku × intent). Only an
    // exact-intent match merges; different intents become new rows.
    const deploy = resolveRowDeployment(key);
    const isZonal = deploy.type === 'zonal';
    const zones = isZonal && deploy.zone ? [deploy.zone] : undefined;
    const intentKey = `${key}|${region ?? ''}|${deploymentKey(isZonal ? 'zonal' : 'regional', zones)}`;
    const existing = bomIndexByIntent.get(intentKey);
    if (existing) {
      dispatch({
        type: 'BOM_UPDATE',
        index: existing.index,
        entry: { quantity: existing.entry.quantity + add },
      });
    } else {
      dispatch({
        type: 'BOM_ADD',
        entry: {
          vmSizeName: vm.vmSizeName,
          quantity: add,
          deploymentType: isZonal ? 'zonal' : 'regional',
          zones,
          region,
        },
      });
    }
    // Clear that staged row only — leave others in place so the user can
    // submit row-by-row if they prefer.
    setStagedQty((prev) => {
      const { [key]: _drop, ...rest } = prev;
      void _drop;
      return rest;
    });
    // Drop any per-row deployment override so the next staging cycle
    // re-inherits the panel default cleanly.
    clearRowDeployment(key);
  };
  // v2.19.31 — Quick-add suggestions. Up to 8 matches against the
  // currently-in-scope catalog; substring match against vmSizeName.
  const quickSuggestions = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return uniqueVms.slice(0, 8);
    return uniqueVms.filter((v) => v.vmSizeName.toLowerCase().includes(q)).slice(0, 8);
  }, [uniqueVms, quickQuery]);

  const clearQuick = () => {
    setQuickQuery('');
    setQuickPicked(null);
    setQuickQty(0);
    setQuickDeploymentType('regional');
    setQuickZone(null);
    setQuickHighlightIdx(0);
    setQuickZoneDropdownOpen(false);
  };

  /** Commit the quick-add row to the BoM (additive, per-intent). */
  const submitQuick = () => {
    if (!quickPicked || quickQty <= 0) return;
    const key = quickPicked.vmSizeName.toLowerCase();
    // v2.19.34 — Resolve deployment from the explicit Reg/Zonal toggle.
    // Zonal + null zone = "any" (engine balances across zones with clusters);
    // Zonal + pinned zone = round-robin over that one zone.
    const isZonal = quickDeploymentType === 'zonal';
    const zones = isZonal && quickZone !== null ? [quickZone] : undefined;
    const intentKey = `${key}|${region ?? ''}|${deploymentKey(isZonal ? 'zonal' : 'regional', zones)}`;
    const existing = bomIndexByIntent.get(intentKey);
    if (existing) {
      dispatch({
        type: 'BOM_UPDATE',
        index: existing.index,
        entry: { quantity: existing.entry.quantity + quickQty },
      });
    } else {
      dispatch({
        type: 'BOM_ADD',
        entry: {
          vmSizeName: quickPicked.vmSizeName,
          quantity: quickQty,
          deploymentType: isZonal ? 'zonal' : 'regional',
          zones,
          region,
        },
      });
    }
    clearQuick();
    // Return focus to the search input so the user can immediately add the
    // next SKU without reaching for the mouse.
    setTimeout(() => quickInputRef.current?.focus(), 0);
  };

  /** Bulk-commit every staged row. */
  const submitAllStaged = () => {
    const keys = Object.keys(stagedQty);
    if (keys.length === 0) return;
    for (const vm of uniqueVms) {
      const k = vm.vmSizeName.toLowerCase();
      if (stagedQty[k] && stagedQty[k] > 0) submitOne(vm);
    }
    // submitOne already clears each key after dispatch; the resulting
    // stagedQty will be {}.
  };
  const stagedCount = Object.keys(stagedQty).length;
  const stagedTotal = Object.values(stagedQty).reduce((s, n) => s + n, 0);

  // Reset search when scope changes so a leftover query doesn't hide rows.
  useEffect(() => {
    setQuery('');
  }, [provider, activeCategory, state.ui.bomFamilies.join('|')]);

  // ── Excel round-trip — relocated from BomSection v2.19.6 so all bulk-
  //    authoring affordances (grid + Excel template + Excel upload) live
  //    together. Upload populates state.bom which the grid auto-syncs to,
  //    so a user can spreadsheet-edit and watch the grid quantities update
  //    on commit.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => {
    if (!importMsg) return;
    const t = setTimeout(() => setImportMsg(null), 4500);
    return () => clearTimeout(t);
  }, [importMsg]);
  const onUpload = async (file: File) => {
    setImportMsg(null);
    try {
      const result = await parseBomTemplate(file);
      if (result.rows.length === 0) {
        setImportMsg({ kind: 'err', text: 'Import failed: no valid BOM rows found in this file.' });
        return;
      }
      let replace = false;
      if (state.bom.length > 0) {
        replace = window.confirm(
          `Your BOM has ${state.bom.length} row(s). ` +
            `Click OK to REPLACE them with ${result.rows.length} row(s) from this file. ` +
            `Click Cancel to MERGE (sum quantities for matching SKUs).`,
        );
      }
      if (replace) {
        dispatch({ type: 'BOM_SET', bom: result.rows });
      } else {
        // Merge — bump quantity on matches, append the rest.
        const next = [...state.bom];
        const indexByName = new Map<string, number>();
        next.forEach((e, i) => indexByName.set(e.vmSizeName.toLowerCase(), i));
        for (const incoming of result.rows) {
          const key = incoming.vmSizeName.toLowerCase();
          const idx = indexByName.get(key);
          if (idx === undefined) {
            indexByName.set(key, next.length);
            next.push(incoming);
          } else {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + incoming.quantity };
          }
        }
        dispatch({ type: 'BOM_SET', bom: next });
      }
      const warn = result.warnings.length
        ? ` · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`
        : '';
      setImportMsg({
        kind: 'ok',
        text: `${replace ? 'Replaced' : 'Merged'} ${result.rows.length} BOM row(s)${warn}.`,
      });
      result.warnings.forEach((w) => console.warn('[BOM import]', w));
    } catch (err) {
      console.error('[BOM import]', err);
      setImportMsg({
        kind: 'err',
        text: `Import failed: ${err instanceof Error ? err.message : 'could not parse file'}`,
      });
    }
  };

  // v2.19.6 — Panel is always rendered (no early-null return). The Excel
  // Template + Upload buttons need to be visible even before the user has
  // picked a scope, so users can download the template / upload a populated
  // file without having to first set up filters.
  // v2.19.7 — Two distinct "no rows yet" states:
  //   1. scopeMissing — no provider or no category picked → tell user to set
  //      up the upstream filters first.
  //   2. familiesMissing — provider + category picked, but no family chip
  //      selected → grid is empty by design (Fungibility doctrine); prompt
  //      the user to pick one.
  // v2.19.22 — Region is now required for staging. BoM rows are
  // region-agnostic at the data layer, but pricing + spec differ by region;
  // staging without a region picks an arbitrary row, which is unsafe. Force
  // the explicit pick.
  const scopeMissing = !provider || !activeCategory || !region;
  const familiesMissing = !scopeMissing && selectedFamilies.size === 0;
  const summarySuffix = !provider
    ? '· pick a Cloud Provider to populate the grid'
    : !activeCategory
    ? '· pick a VM Category to populate the grid'
    : !region
    ? '· pick a Region to populate the grid'
    : familiesMissing
    ? `· pick a VM Family in ${activeCategory} to populate the grid`
    : `· ${uniqueVms.length} in ${activeCategory} / ${selectedFamilies.size} fam` +
      (onBoMCount > 0 ? ` · ${onBoMCount} on BoM` : '');

  return (
    <section className="space-y-2">
      {/* v2.19.8 — Header pill houses everything (toggle + summary + Template +
          Upload) as ONE flex row inside .section-h, matching the Fungibility
          Configurator pattern. Stops the "BULK ADD VMS" title from wrapping
          to two lines when the right pane is open. Toggle area is the
          left-side flex-1 region; Excel buttons sit on the right with
          stopPropagation so they don't fire the toggle. */}
      <h3 className="section-h flex items-center gap-2">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
          style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
          aria-expanded={open}
          aria-label={open ? 'Collapse Bulk add VMs' : 'Expand Bulk add VMs'}
        >
          <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
            {open ? '▾' : '▸'}
          </span>
          <span>Bulk add VMs</span>
          <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2 truncate">
            {summarySuffix}
          </span>
        </button>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <a
            href="/bom-template.xlsx"
            download="bom-template.xlsx"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-medium transition-all"
            style={{
              padding: '3px 10px',
              background: 'rgba(129, 140, 248, 0.10)',
              color: 'var(--interactive)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.05em',
            }}
            title="Download the BOM Excel template (5 seed rows; one row per VM SKU + quantity)"
          >
            ⤓ Template
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
            className="text-[10px] font-medium transition-all"
            style={{
              padding: '3px 10px',
              background: 'rgba(129, 140, 248, 0.10)',
              color: 'var(--interactive)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.05em',
            }}
            title="Upload a filled-in BOM Excel — choose replace or merge on import. Quantities flow into the grid below."
          >
            ⤒ Upload
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
      </h3>

      {/* v2.22.6 — One-sentence caption (the verbose dual-workflow paragraph
          was trimmed at the user's request). */}
      <p className="text-[10.5px] text-text-muted leading-snug" style={{ marginTop: 2 }}>
        Type a quantity on any row to add it to your BoM — or use{' '}
        <strong style={{ color: 'var(--interactive)' }}>⤓ Template</strong> /{' '}
        <strong style={{ color: 'var(--interactive)' }}>⤒ Upload</strong> for Excel.
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

      {open && (
        <div
          className="space-y-2"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
          }}
        >

          {/* v2.22.6 — The Region picker now lives in the BoM filter box
              above (one consolidated box: Provider · Category · Family ·
              Region). This grid only reacts to the resolved scope. */}

          {scopeMissing && (
            <div className="text-[10.5px] text-text-muted italic px-3 py-4 text-center">
              {!provider
                ? 'Pick a Cloud Provider in the BoM filter box above to populate this grid.'
                : !activeCategory
                ? 'Pick a VM Category in the BoM filter box above to populate this grid.'
                : 'Pick a Region in the BoM filter box above to populate this grid.'}
            </div>
          )}

          {familiesMissing && (
            <div className="text-[10.5px] text-text-muted italic px-3 py-4 text-center">
              Pick one or more VM Family chips in <strong>{activeCategory}</strong> above to populate the grid.
            </div>
          )}

          {!scopeMissing && !familiesMissing && (
          <>
          {/* v2.22.6 — The grid IS the bulk-add surface now (the quick-add bar
              + its toggle were removed); render it directly. */}
          {browseOpen && (
          <>
          {/* v2.19.34 — Browse-all redesign. Header + scrollable list both
              sit inside ONE bordered container so column labels are anchored
              to the box instead of floating above it. Row format mirrors
              Quick Add: VM · Qty · Reg/Zonal · Zone · +Add. Specs columns
              removed — BoM is a placement summary, not a spec sheet. */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${uniqueVms.length} VM${uniqueVms.length === 1 ? '' : 's'}…`}
            className="glass-input text-[11px] font-mono"
            style={{ padding: '6px 10px', width: '100%' }}
            aria-label="Filter the bulk-add VM list"
          />

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {/* Grid header — anchored INSIDE the box. v2.19.51 — Spec
                columns (vCPU / Mem / Net) sit between VM Size and Qty so
                the user can compare SKUs without expanding anything. */}
            <div
              className="grid items-center gap-2 px-3 py-1.5 text-[9px] tracking-[0.04em] text-text-muted"
              style={{
                gridTemplateColumns: '1fr 56px 72px 78px 60px 84px 90px 44px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>VM Size</span>
              <span className="text-right">vCPU</span>
              <span className="text-right">Memory</span>
              <span className="text-right">Network</span>
              <span className="text-right">Qty</span>
              <span className="text-center">Deploy</span>
              <span className="text-center">Zone</span>
              <span className="text-right">Add</span>
            </div>

          {/* Scrollable list */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: 360,
            }}
          >
            {filteredVms.length === 0 ? (
              <div className="px-3 py-4 text-[10.5px] italic text-center">
                {uniqueVms.length === 0 && region ? (
                  // v2.19.18 — Region-aware empty state. The family list is no
                  // longer region-scoped, so a user can pick a family the
                  // active region lacks. Say so explicitly instead of the
                  // misleading "no search match".
                  <span style={{ color: '#FCD34D' }}>
                    ⚠ None of the selected families are available in{' '}
                    <strong>{region}</strong>. Change the <strong>Region</strong> in BoM
                    Filters above (or pick All regions).
                  </span>
                ) : (
                  <span className="text-text-muted">No VMs match your search.</span>
                )}
              </div>
            ) : (
              filteredVms.map((vm) => (
                <BrowseRow
                  key={vm.vmSizeName.toLowerCase()}
                  vm={vm}
                  stagedQty={stagedQty[vm.vmSizeName.toLowerCase()] ?? 0}
                  setStaged={(n) => setStaged(vm, n)}
                  submit={() => submitOne(vm)}
                  rowDeploy={resolveRowDeployment(vm.vmSizeName.toLowerCase())}
                  setRowType={(t) => setRowDeploymentType(vm.vmSizeName.toLowerCase(), t)}
                  setRowZone={(z) => setRowZone(vm.vmSizeName.toLowerCase(), z)}
                  zonesWithClusters={zonesWithClusters}
                  onBomTotal={bomBySku.get(vm.vmSizeName.toLowerCase())?.totalQty ?? 0}
                />
              ))
            )}
          </div>
          </div>

          {/* v2.19.9 — Bulk submit footer. Appears when 1+ rows have staged
              quantities. One click commits every staged row additively. */}
          {stagedCount > 0 && (
            <div
              className="flex items-center justify-between gap-3 px-3 py-2"
              style={{
                background: 'rgba(252, 211, 77, 0.06)',
                border: '1px solid rgba(252, 211, 77, 0.35)',
                borderRadius: 'var(--radius-md)',
                marginTop: 6,
              }}
            >
              <span className="text-[10.5px]" style={{ color: '#FCD34D' }}>
                <strong>{stagedCount}</strong> {stagedCount === 1 ? 'row' : 'rows'} staged ·{' '}
                <strong>{stagedTotal.toLocaleString()}</strong> VMs total
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStagedQty({})}
                  className="text-[10px] tracking-[0.02em] text-text-muted hover:text-text-primary transition-colors"
                  style={{ padding: '3px 8px' }}
                  title="Discard all staged rows without submitting"
                >
                  Discard
                </button>
                <button
                  onClick={submitAllStaged}
                  className="text-[11px] font-medium transition-all"
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(129, 140, 248, 0.18)',
                    color: 'var(--interactive)',
                    border: '1px solid var(--border-glow)',
                    borderRadius: 'var(--radius-pill)',
                    letterSpacing: '0.05em',
                  }}
                  title="Add every staged row to the BoM (existing SKUs increment)"
                >
                  + Add {stagedCount} to BoM
                </button>
              </div>
            </div>
          )}
          </>
          )}
          </>
          )}
        </div>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// v2.19.34 — Browse-all row. Slim 5-column line: VM · Qty · Deploy ·
// Zone · +. Matches Quick Add's flow exactly so the user only learns
// one pattern. Per-row override (type + zone) lives in the panel's
// stagedDeployment map; the row receives the resolved value as a prop.
// ──────────────────────────────────────────────────────────────────────
function BrowseRow({
  vm,
  stagedQty,
  setStaged,
  submit,
  rowDeploy,
  setRowType,
  setRowZone,
  zonesWithClusters,
  onBomTotal,
}: {
  vm: CatalogEntry;
  stagedQty: number;
  setStaged: (n: number) => void;
  submit: () => void;
  rowDeploy: { type: 'regional' | 'zonal'; zone: string | null };
  setRowType: (t: 'regional' | 'zonal') => void;
  setRowZone: (z: string | null) => void;
  zonesWithClusters: Set<string>;
  onBomTotal: number;
}) {
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const hasStage = stagedQty > 0;
  const onBom = onBomTotal > 0;
  const isZonal = rowDeploy.type === 'zonal';
  return (
    <div
      className="grid items-center gap-2 px-3 py-1 transition-colors hover:bg-white/[0.04]"
      style={{
        gridTemplateColumns: '1fr 56px 72px 78px 60px 84px 90px 44px',
        background: hasStage
          ? 'rgba(252, 211, 77, 0.06)'
          : onBom
          ? 'rgba(129, 140, 248, 0.04)'
          : undefined,
        borderLeft: hasStage
          ? '2px solid rgba(252, 211, 77, 0.55)'
          : onBom
          ? '2px solid var(--border-glow)'
          : '2px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        className="text-[11px] font-mono whitespace-nowrap"
        title={vm.vmSizeName}
        style={{ color: onBom ? 'var(--interactive)' : 'var(--text-primary)' }}
      >
        {vm.vmSizeName.replace(/^Standard_/, '')}
        {onBom && (
          <span
            className="ml-2 text-[9px]"
            style={{ color: 'var(--interactive)' }}
            title={`${onBomTotal} on BoM total across this SKU's intent rows.`}
          >
            ✓ {onBomTotal}
          </span>
        )}
      </span>
      {/* v2.19.51 — Spec columns inline with the row so users can compare
          SKUs without leaving the panel. Right-aligned monospaced for
          column-scanning. */}
      <span
        className="text-[10px] font-mono text-text-secondary text-right whitespace-nowrap"
        title={`${vm.vcpus} vCPU`}
      >
        {vm.vcpus}
      </span>
      <span
        className="text-[10px] font-mono text-text-secondary text-right whitespace-nowrap"
        title={`${vm.memoryGib.toLocaleString()} GiB memory`}
      >
        {fmtMemory(vm.memoryGib)}
      </span>
      <span
        className="text-[10px] font-mono text-text-secondary text-right whitespace-nowrap"
        title={typeof vm.networkMbps === 'number' ? `${vm.networkMbps.toLocaleString()} Mbps network` : 'No network spec'}
      >
        {fmtNetwork(vm.networkMbps)}
      </span>
      <NumberInput
        value={stagedQty}
        onChange={setStaged}
        min={0}
        className="glass-input text-[11px] font-mono text-right"
        style={{ padding: '3px 6px', width: 56 }}
        aria-label={`Staged quantity for ${vm.vmSizeName}`}
      />
      {/* Reg / Zonal toggle */}
      <div
        className="flex items-center text-[9px] font-mono tracking-[0.02em]"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          justifySelf: 'center',
        }}
        role="group"
        aria-label="Deployment type"
      >
        <button
          type="button"
          onClick={() => setRowType('regional')}
          className="transition-colors"
          style={{
            padding: '4px 8px',
            background: !isZonal ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
            color: !isZonal ? 'var(--interactive)' : 'var(--text-muted)',
          }}
          title="Regional"
        >
          Reg
        </button>
        <button
          type="button"
          onClick={() => setRowType('zonal')}
          className="transition-colors"
          style={{
            padding: '4px 8px',
            background: isZonal ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
            color: isZonal ? 'var(--interactive)' : 'var(--text-muted)',
          }}
          title="Zonal"
        >
          Zonal
        </button>
      </div>
      {/* Zone dropdown — only when zonal. Single-select. */}
      {isZonal ? (
        <div style={{ position: 'relative', justifySelf: 'center' }}>
          <button
            type="button"
            onClick={() => setZoneDropdownOpen((s) => !s)}
            className="text-[10px] font-mono flex items-center gap-1 transition-all"
            style={{
              padding: '3px 8px',
              minWidth: 72,
              background: 'rgba(129, 140, 248, 0.10)',
              color: 'var(--interactive)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
            title={
              rowDeploy.zone === null
                ? 'Any zone (balance across all zones with clusters)'
                : `Pinned to ${rowDeploy.zone}`
            }
            aria-haspopup="listbox"
            aria-expanded={zoneDropdownOpen}
          >
            <span className="flex-1 text-left">
              {rowDeploy.zone === null ? 'any' : rowDeploy.zone.replace('Zone ', 'Z')}
            </span>
            <span className="text-text-muted text-[9px]">▾</span>
          </button>
          {zoneDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: 120,
                background: 'var(--bg)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                zIndex: 30,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setRowZone(null);
                  setZoneDropdownOpen(false);
                }}
                className="w-full text-left text-[10.5px] font-mono px-3 py-1.5"
                style={{
                  background:
                    rowDeploy.zone === null ? 'rgba(129, 140, 248, 0.12)' : 'transparent',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                any · balance
              </button>
              {ZONES.map((z) => {
                const active = rowDeploy.zone === z;
                const noClusters = !zonesWithClusters.has(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setRowZone(z);
                      setZoneDropdownOpen(false);
                    }}
                    className="w-full text-left text-[10.5px] font-mono px-3 py-1.5"
                    style={{
                      background: active ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
                      color: noClusters ? '#FCD34D' : 'var(--text-primary)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {z}
                    {noClusters && (
                      <span className="ml-2 text-[9px]" style={{ color: '#FCD34D' }}>
                        ⚠
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <span className="text-[10px] font-mono text-text-muted text-center">—</span>
      )}
      {/* Add */}
      <button
        onClick={submit}
        disabled={!hasStage}
        className="text-[12px] transition-all"
        style={{
          padding: '2px 0',
          background: hasStage ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
          color: hasStage ? 'var(--interactive)' : 'var(--text-muted)',
          border: `1px solid ${hasStage ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: hasStage ? 'pointer' : 'not-allowed',
          opacity: hasStage ? 1 : 0.5,
          height: 22,
        }}
        title={hasStage ? `Add ${stagedQty} to BoM` : 'Stage a quantity first'}
        aria-label={`Submit ${stagedQty} of ${vm.vmSizeName} to BoM`}
      >
        +
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// v2.19.38 — Region picker (relocated from BomFilter). VMs are deployed
// INTO a region, so this control belongs alongside the act of adding a
// VM to the BoM. Required — no "All regions" option. When unset, an
// amber alert sits directly under the dropdown explaining why the user
// can't add VMs yet. The picker stays visible (not hidden) so the user
// can always see the chosen region as they author.
// ──────────────────────────────────────────────────────────────────────
// v2.22.6 — Exported so the consolidated BoM filter box (BomFilter) can host
// the Region picker at its bottom; the bulk-add grid just reads the resolved
// region from state.ui.activeRegion.
export function RegionRequiredPicker({
  provider,
  availableRegions,
  active,
  isStale,
  onPick,
}: {
  provider: string;
  availableRegions: Array<{ region: string; count: number }>;
  active: string | undefined;
  isStale: boolean;
  onPick: (region: string) => void;
}) {
  const options: DropdownOption[] = useMemo(
    () =>
      availableRegions.map((r) => ({
        value: r.region,
        label: r.region,
        meta: `${r.count.toLocaleString()} VM${r.count === 1 ? '' : 's'}`,
      })),
    [availableRegions],
  );
  const needsPick = !active || isStale;
  const ariaInvalid = needsPick ? true : undefined;

  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] tracking-[0.04em]"
          style={{ color: needsPick ? '#FCD34D' : 'var(--text-secondary)' }}
        >
          Region · required
        </span>
        <span className="text-[10px] text-text-muted normal-case tracking-normal">
          · {availableRegions.length} available for {provider} in current scope
          {active && availableRegions.some((r) => r.region === active) && ' · 1 selected'}
        </span>
      </div>
      <GlassDropdown
        value={active ?? ''}
        options={options}
        onChange={onPick}
        placeholder={
          availableRegions.length > 0
            ? `Pick a region (required) — search ${availableRegions.length} for ${provider}…`
            : 'No regions available — pick a VM Family above first'
        }
        searchable
        visibleRows={6}
        aria-invalid={ariaInvalid}
      />
      {needsPick && (
        <div
          className="text-[10.5px] leading-snug"
          style={{ color: '#FCD34D' }}
          role="alert"
        >
          {isStale ? (
            <>⚠ <strong>{active}</strong> isn't available in the current Category / Family scope. Pick another region to continue adding VMs.</>
          ) : (
            <>⚠ Pick a region — VMs must target a deployment region before they can be added to the BoM. Pricing + availability are region-specific.</>
          )}
        </div>
      )}
    </div>
  );
}

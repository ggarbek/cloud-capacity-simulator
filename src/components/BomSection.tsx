/**
 * v2.19.9 — Bill of Materials, library-style.
 *
 * Replaces the MM/HM/VHM memory-tier sections (which were Azure M-Series
 * specific) with a clean Category → Family → SKU tree, modeled on the
 * Hardware Library + CPU Library treatment. Authoring is now done in
 * BomBulkAddPanel above; this surface is for browsing, editing, and
 * bulk-pruning what's already on the BoM.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ BILL OF MATERIALS · N SKUs · M VMs · vCPU · GiB                  │
 *   │  [select-all checkbox] [Delete N selected] [✕ Clear all]         │
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │ ▾ GENERAL PURPOSE · 8 SKUs · 1,234 VMs        [✕ Clear category] │
 *   │   ▾ A · 4 SKUs · 200 VMs                       [✕ Clear family]  │
 *   │     ▢ A1_v2  [50]  1 vCPU · 2 GiB · Reg ✕                        │
 *   │     ▢ A2_v2  [30]  2 vCPU · 4 GiB · Zonal ◈1 ◈2 ✕                │
 *   │     …                                                            │
 *   │   ▾ B · 4 SKUs · 600 VMs                       [✕ Clear family]  │
 *   │     …                                                            │
 *   │ ▸ MEMORY OPTIMIZED · 5 SKUs · 80 VMs           [✕ Clear category]│
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Multi-select: each row gets a checkbox. When 1+ checked, a sticky
 * floating action bar appears at the top of the section with
 * "Delete N selected".
 *
 * Deployment toggle + zone picker per row are unchanged from the previous
 * row UX; just relocated into the new layout.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import {
  ZONES,
  VM_CATEGORIES,
  type BomEntry,
  type CatalogEntry,
  type VmCategory,
} from '../types';
import { providerOf, vmFamily, vmClass, compareFamily } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import {
  placedHardwareIds,
  vmSizeRoutableTo,
  type FungibilityMatrix,
} from '../utils/fungibilityStatus';

// v2.19.29 — Cap pinned zones per BoM row at 2 (down from 4). See
// BomBulkAddPanel for the rationale.
const MAX_ZONES_PER_ROW = 2;

interface EnrichedRow {
  index: number;
  entry: BomEntry;
  catalog?: CatalogEntry;
  category: VmCategory | '(uncatalogued)';
  family: string;
}

function resolveCategory(c: CatalogEntry | undefined): VmCategory | '(uncatalogued)' {
  if (!c) return '(uncatalogued)';
  return c.category ?? categorize(c.provider, c.family);
}

export function BomSection() {
  const { state, dispatch } = useApp();
  const activeRegion = state.ui.activeRegion;
  const catalog = state.userVms;

  // Index user catalog by lowercased name → resolve each BomEntry to a
  // canonical CatalogEntry (prefers a row matching the active region for
  // the SKU's provider). Uncatalogued SKUs surface as their own bucket.
  const enriched: EnrichedRow[] = useMemo(
    () =>
      state.bom.map((entry, index) => {
        const matches = catalog.filter(
          (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
        );
        // v2.22.9 — Resolve the catalog row by the row's OWN stamped region
        // first (so it's stable when the catalog filter changes); fall back to
        // the provider's active region for legacy / Excel rows without one.
        const provider = matches[0] ? providerOf(matches[0]) : undefined;
        const want = entry.region ?? (provider ? activeRegion[provider] : undefined);
        const cat =
          (want ? matches.find((c) => (c.region ?? '') === want) : undefined) ?? matches[0];
        return {
          index,
          entry,
          catalog: cat,
          category: resolveCategory(cat),
          family: cat ? vmFamily(cat) : '(unknown)',
        };
      }),
    [state.bom, catalog, activeRegion],
  );

  // Group: VmCategory → VM Family → rows. Preserve canonical order for
  // categories; sort families with compareFamily so M-series compounds
  // land where the user expects.
  interface FamilyBucket {
    family: string;
    rows: EnrichedRow[];
  }
  interface CategoryBucket {
    category: VmCategory | '(uncatalogued)';
    families: FamilyBucket[];
    skus: number;
    vms: number;
  }
  const grouped: CategoryBucket[] = useMemo(() => {
    const byCat = new Map<VmCategory | '(uncatalogued)', Map<string, EnrichedRow[]>>();
    for (const r of enriched) {
      if (!byCat.has(r.category)) byCat.set(r.category, new Map());
      const famMap = byCat.get(r.category)!;
      if (!famMap.has(r.family)) famMap.set(r.family, []);
      famMap.get(r.family)!.push(r);
    }
    const out: CategoryBucket[] = [];
    const canonical: Array<VmCategory | '(uncatalogued)'> = [
      ...VM_CATEGORIES,
      '(uncatalogued)',
    ];
    for (const c of canonical) {
      if (!byCat.has(c)) continue;
      const famMap = byCat.get(c)!;
      const families: FamilyBucket[] = Array.from(famMap.entries())
        .map(([family, rows]) => ({ family, rows }))
        .sort((a, b) => compareFamily(a.family, b.family));
      let skus = 0;
      let vms = 0;
      for (const f of families) {
        skus += f.rows.length;
        for (const r of f.rows) vms += r.entry.quantity;
      }
      out.push({ category: c, families, skus, vms });
    }
    return out;
  }, [enriched]);

  // v2.19.14 — Per-row fungibility check. A BoM row is "unroutable" when:
  //   • The catalog row is found (else it's an unknown-SKU concern, separate).
  //   • The matrix has at least one cell authored (empty matrix → engine
  //     uses legacy homeFor fallback; not flagged here).
  //   • The VM class has no Home/Spillover cell against any placed HW group.
  // Surfaces as a red ⚠ chip on the row + an amber summary banner above the
  // list. Computed once per render and indexed by BoM row index.
  const unroutable = useMemo(() => {
    const matrix = state.userFungibility as FungibilityMatrix;
    if (Object.keys(matrix).length === 0) return new Set<number>();
    const placed = placedHardwareIds(state);
    if (placed.size === 0) return new Set<number>();
    const out = new Set<number>();
    for (const r of enriched) {
      if (!r.catalog) continue;
      // v2.19.17 — per-size routing: check the size key first, class as fallback.
      const cls = vmClass(r.catalog);
      if (!vmSizeRoutableTo(r.catalog.vmSizeName, cls, matrix, placed)) {
        out.add(r.index);
      }
    }
    return out;
  }, [enriched, state]);

  // v2.19.51 — Per-row "N rules missing" pill REMOVED. Rationale: the pill
  // fired for any unauthored (SKU × placed HW) pair, but a single Home cell
  // on the row's HW is enough to route it — so the "missing N rules" chip
  // was alarming even when the row was deployable. The strict `isUnroutable`
  // check below covers the truly-broken case (zero authored cells across
  // every placed HW); that one stays.

  // v2.19.22 — Per-row zone-mismatch check. A zonal row references zones; if
  // ANY of those zones lacks a placed cluster, the corresponding sub-claim is
  // unplaceable at sim time (engine emits ZONE_NOT_IN_FLEET). Surface this in
  // the BoM UI so the user sees the issue BEFORE running.
  const zonesInFleet = useMemo(() => {
    const s = new Set<string>();
    for (const { fleet } of fleetList(state)) if (fleet.zone) s.add(fleet.zone);
    return s;
  }, [state.fleets]);
  const zoneMissing = useMemo(() => {
    const out = new Map<number, string[]>();
    for (const r of enriched) {
      const dep = r.entry.deploymentType ?? 'regional';
      if (dep !== 'zonal') continue;
      const zones = r.entry.zones ?? [];
      if (zones.length === 0) continue;
      const missing = zones.filter((z) => !zonesInFleet.has(z));
      if (missing.length > 0) out.set(r.index, missing);
    }
    return out;
  }, [enriched, zonesInFleet]);
  /** Union of both failure modes — drives the row-tint + the top banner. */
  const cannotDeploy = useMemo(() => {
    const out = new Set<number>(unroutable);
    for (const i of zoneMissing.keys()) out.add(i);
    return out;
  }, [unroutable, zoneMissing]);

  // v2.22.6 — The banner's ⚡ Auto-route pill was removed (the Fungibility
  // tab owns auto-route now); the alert just points there with "Open
  // Fungibility →". The autoRouteMissingRules helper + dispatch are no
  // longer wired here.

  // Totals across the whole BoM.
  const totals = useMemo(() => {
    let skus = 0;
    let vms = 0;
    let vcpu = 0;
    let mem = 0;
    for (const r of enriched) {
      skus++;
      vms += r.entry.quantity;
      if (r.catalog) {
        vcpu += r.catalog.vcpus * r.entry.quantity;
        mem += r.catalog.memoryGib * r.entry.quantity;
      }
    }
    return { skus, vms, vcpu, mem };
  }, [enriched]);

  // ── Multi-select state ─────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };
  // ── Bulk operations ────────────────────────────────────────────────
  /** Delete a set of BomEntry indices in DESCENDING order so the
   *  subsequent dispatches don't get index-shifted out from under them. */
  const deleteIndices = (indices: Iterable<number>) => {
    const ordered = [...indices].sort((a, b) => b - a);
    for (const i of ordered) dispatch({ type: 'BOM_REMOVE', index: i });
    setSelected(new Set());
  };
  const clearAll = () => {
    if (state.bom.length === 0) return;
    if (!window.confirm(`Clear all ${state.bom.length} BoM row(s)?`)) return;
    dispatch({ type: 'BOM_SET', bom: [] });
    setSelected(new Set());
  };
  const clearCategory = (cat: VmCategory | '(uncatalogued)') => {
    const indices = enriched.filter((r) => r.category === cat).map((r) => r.index);
    if (indices.length === 0) return;
    if (
      !window.confirm(
        `Clear all ${indices.length} ${cat} row(s) from the BoM?`,
      )
    ) {
      return;
    }
    deleteIndices(indices);
  };
  const clearFamily = (
    cat: VmCategory | '(uncatalogued)',
    fam: string,
  ) => {
    const indices = enriched
      .filter((r) => r.category === cat && r.family === fam)
      .map((r) => r.index);
    if (indices.length === 0) return;
    if (
      !window.confirm(
        `Clear all ${indices.length} ${cat} / ${fam} row(s) from the BoM?`,
      )
    ) {
      return;
    }
    deleteIndices(indices);
  };

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2 flex-wrap">
        <h2 className="section-h flex items-center gap-2 flex-1">
          <span>Bill of Materials</span>
          {state.bom.length > 0 && (
            <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
              {totals.skus} SKU{totals.skus === 1 ? '' : 's'} · {totals.vms.toLocaleString()} VMs ·{' '}
              {totals.vcpu.toLocaleString()} vCPU ·{' '}
              {totals.mem.toLocaleString()} GiB
            </span>
          )}
        </h2>
        {state.bom.length > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] tracking-[0.02em] text-text-muted hover:text-red-300 transition-colors"
            style={{
              padding: '3px 10px',
              border: '1px solid rgba(239, 68, 68, 0.30)',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(239, 68, 68, 0.06)',
            }}
            title="Remove every row from the BoM"
          >
            ✕ Clear all
          </button>
        )}
      </header>

      {/* v2.19.22 — Cannot-deploy banner. Counts both failure modes: rows
          with no fungibility rule AND rows whose zonal selection references
          zones that aren't in the fleet. Each kind gets one short line + a
          targeted CTA so the user knows where to go to fix it. */}
      {cannotDeploy.size > 0 && (
        <div
          className="w-full"
          style={{
            padding: '10px 14px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[14px]" style={{ color: '#FCD34D' }}>⚠</span>
            <span className="text-[11.5px] font-semibold" style={{ color: '#FCD34D' }}>
              {cannotDeploy.size} of {state.bom.length} BoM row{state.bom.length === 1 ? '' : 's'}{' '}
              cannot be deployed
            </span>
          </div>
          {unroutable.size > 0 && (
            <div className="w-full flex items-center gap-2 flex-wrap" style={{ padding: '2px 0' }}>
              <span className="text-[10.5px] text-text-secondary flex-1 min-w-[200px]">
                • <strong style={{ color: '#FCD34D' }}>{unroutable.size}</strong> need{unroutable.size === 1 ? 's' : ''} a fungibility rule to route them to a hardware group.
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fungibility' } })}
                className="text-[10px] tracking-[0.02em] flex-shrink-0"
                style={{ color: 'var(--interactive)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                title="Open the Fungibility tab to author Home or Spillover rules by hand."
              >
                Open Fungibility →
              </button>
            </div>
          )}
          {zoneMissing.size > 0 && (
            <button
              type="button"
              onClick={() =>
                dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fleet' } })
              }
              className="w-full flex items-center gap-2 text-left hover:brightness-110 transition-all"
              style={{ padding: '2px 0' }}
              title="Open Fleet builder to add the missing zones (or edit the BoM row's zone selection)."
            >
              <span className="text-[10.5px] text-text-secondary">
                • <strong style={{ color: '#FCD34D' }}>{zoneMissing.size}</strong> reference{zoneMissing.size === 1 ? 's' : ''} a zone not in your fleet — add that zone in Fleet builder, or change the row.
              </span>
              <span
                className="ml-auto text-[10px] tracking-[0.02em]"
                style={{ color: 'var(--interactive)' }}
              >
                Open Fleet builder →
              </span>
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {state.bom.length === 0 && (
        <div
          className="text-[11px] text-text-muted italic px-3 py-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          No VMs on the BoM yet — stage quantities in the <strong>Bulk add VMs</strong>{' '}
          grid above and click <strong>+ Add to BoM</strong>.
        </div>
      )}

      {grouped.map(({ category, families, skus, vms }) => (
        <CategoryBlock
          key={category}
          category={category}
          families={families}
          skus={skus}
          vms={vms}
          selected={selected}
          unroutable={unroutable}
          zoneMissing={zoneMissing}
          onToggleRow={toggleSelected}
          onClearCategory={() => clearCategory(category)}
          onClearFamily={(fam) => clearFamily(category, fam)}
        />
      ))}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Category block — collapsed-by-default sub-section per VmCategory.
// ────────────────────────────────────────────────────────────────────────
function CategoryBlock({
  category,
  families,
  skus,
  vms,
  selected,
  unroutable,
  zoneMissing,
  onToggleRow,
  onClearCategory,
  onClearFamily,
}: {
  category: VmCategory | '(uncatalogued)';
  families: { family: string; rows: EnrichedRow[] }[];
  skus: number;
  vms: number;
  selected: Set<number>;
  unroutable: Set<number>;
  zoneMissing: Map<number, string[]>;
  onToggleRow: (index: number) => void;
  onClearCategory: () => void;
  onClearFamily: (family: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
          aria-expanded={open}
        >
          <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
            {open ? '▾' : '▸'}
          </span>
          <span
            className="text-[10px] tracking-[0.04em] font-semibold"
            style={{ color: 'var(--interactive)' }}
          >
            {category}
          </span>
          <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
            {skus} SKU{skus === 1 ? '' : 's'} · {vms.toLocaleString()} VMs
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearCategory();
          }}
          className="text-[10px] tracking-[0.02em] text-text-muted hover:text-red-300 transition-colors"
          style={{ padding: '3px 8px' }}
          title={`Clear every ${category} row from the BoM`}
        >
          ✕ Clear
        </button>
      </div>
      {open && (
        <div className="space-y-2 px-3 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          {families.map(({ family, rows }) => (
            <FamilyBlock
              key={family}
              family={family}
              rows={rows}
              selected={selected}
              unroutable={unroutable}
              zoneMissing={zoneMissing}
              onToggleRow={onToggleRow}
              onClearFamily={() => onClearFamily(family)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Family block — one strip of rows under a Family header.
// ────────────────────────────────────────────────────────────────────────
function FamilyBlock({
  family,
  rows,
  selected,
  unroutable,
  zoneMissing,
  onToggleRow,
  onClearFamily,
}: {
  family: string;
  rows: EnrichedRow[];
  selected: Set<number>;
  unroutable: Set<number>;
  zoneMissing: Map<number, string[]>;
  onToggleRow: (index: number) => void;
  onClearFamily: () => void;
}) {
  const [open, setOpen] = useState(true);
  const familyVms = rows.reduce((n, r) => n + r.entry.quantity, 0);
  return (
    <div>
      {/* v2.19.34 — Family-level Clear removed. Per user request, only the
          top-level Clear all and the Category-level Clear remain. Per-row
          delete is still available via select + Delete or the row's ✕. */}
      <div className="flex items-center gap-2 pb-1">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex items-center gap-1.5 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer text-[9.5px] tracking-[0.04em] text-text-muted hover:text-text-secondary transition-colors"
          aria-expanded={open}
        >
          <span style={{ color: 'var(--interactive)' }}>{open ? '▾' : '▸'}</span>
          {family}
          <span className="normal-case tracking-normal ml-1.5">
            · {rows.length} SKU{rows.length === 1 ? '' : 's'} · {familyVms.toLocaleString()} VMs
          </span>
        </button>
      </div>
      {open && (
        <div className="space-y-1">
          {rows.map((r) => (
            <BomRow
              key={r.index}
              row={r}
              isSelected={selected.has(r.index)}
              isUnroutable={unroutable.has(r.index)}
              missingZones={zoneMissing.get(r.index) ?? null}
              onToggleSelected={() => onToggleRow(r.index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Individual BoM row — checkbox, SKU, qty, specs, deployment, × remove.
// ────────────────────────────────────────────────────────────────────────
function BomRow({
  row,
  isSelected,
  isUnroutable,
  missingZones,
  onToggleSelected,
}: {
  row: EnrichedRow;
  isSelected: boolean;
  isUnroutable: boolean;
  /** v2.19.22 — Zones referenced by this row but absent from the placed fleet.
   *  null = no issue. Drives the per-row ⚠ ZONE NOT IN FLEET chip + tint. */
  missingZones: string[] | null;
  onToggleSelected: () => void;
}) {
  const { state, dispatch } = useApp();
  const cat = row.catalog;
  const [draft, setDraft] = useState<string>(String(row.entry.quantity));
  const [focused, setFocused] = useState(false);
  // v2.19.34 — Slim card layout. Zone is single-select via dropdown pill;
  // multi-chip picker removed. Specs (vCPU / mem / storage) no longer shown
  // on the row — Bill of Materials is now a placement summary, not a spec
  // sheet. The VM name is allowed to be wider so it doesn't get cut off.
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

  if (!focused && draft !== String(row.entry.quantity)) {
    // Re-sync draft when external state catches up.
    setDraft(String(row.entry.quantity));
  }

  const commit = (raw: string) => {
    const n = Number(raw);
    const valid = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    setDraft(String(valid));
    dispatch({ type: 'BOM_UPDATE', index: row.index, entry: { quantity: valid } });
  };

  // Deployment intent. Zone universe is the fixed ZONES constant.
  const deploymentType = row.entry.deploymentType ?? 'regional';
  const isZonal = deploymentType === 'zonal';
  // v2.19.34 — Single-select zone. Treat zones[0] as the pinned zone (null
  // when zones is empty or undefined = "any" / balance).
  const selectedZone: string | null = row.entry.zones && row.entry.zones.length > 0
    ? row.entry.zones[0]
    : null;
  const zonesWithClusters = new Set<string>();
  for (const g of state.userHardware) if (g.zone) zonesWithClusters.add(g.zone);
  for (const { fleet } of fleetList(state)) if (fleet.zone) zonesWithClusters.add(fleet.zone);

  const setDeployment = (next: 'regional' | 'zonal') => {
    if (next === deploymentType) return;
    dispatch({
      type: 'BOM_UPDATE',
      index: row.index,
      entry: {
        deploymentType: next,
        zones: next === 'zonal' && selectedZone ? [selectedZone] : undefined,
      },
    });
    if (next === 'regional') setZoneDropdownOpen(false);
  };

  const setZone = (next: string | null) => {
    dispatch({
      type: 'BOM_UPDATE',
      index: row.index,
      entry: { zones: next ? [next] : undefined },
    });
    setZoneDropdownOpen(false);
  };

  // v2.19.14 — Row chrome shifts to amber when the VM has no fungibility
  // routing to any placed HW. v2.19.22 — same amber tint also applies when
  // the row's zonal selection references zones that aren't in the fleet, so
  // the user catches BOTH classes of "this row can't deploy" pre-run.
  const hasZoneIssue = (missingZones?.length ?? 0) > 0;
  const cannotDeploy = isUnroutable || hasZoneIssue;
  const rowBg = isSelected
    ? 'rgba(96, 165, 250, 0.06)'
    : cannotDeploy
    ? 'rgba(251, 191, 36, 0.06)'
    : 'rgba(255,255,255,0.02)';
  const rowBorder = isSelected
    ? 'rgba(96, 165, 250, 0.45)'
    : cannotDeploy
    ? 'rgba(251, 191, 36, 0.45)'
    : 'var(--border)';
  // v2.22.9 — Show the row's OWN stamped region first (stable across catalog-
  // filter changes); fall back to the resolved catalog row's region, then '—'.
  const region = row.entry.region || cat?.region || '—';
  return (
    <div
      className="px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
      style={{
        background: rowBg,
        border: `1px solid ${rowBorder}`,
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* VM name — no truncate so the full name is always visible. */}
        <span
          className="flex-1 text-[11px] font-mono text-text-primary leading-snug whitespace-nowrap min-w-0"
          title={row.entry.vmSizeName}
          style={{ overflow: 'visible' }}
        >
          {row.entry.vmSizeName.replace('Standard_', '')}
        </span>
        {isUnroutable && (
          <span
            className="text-[9px] font-medium tracking-[0.02em]"
            style={{
              padding: '2px 6px',
              background: 'rgba(251, 191, 36, 0.12)',
              color: '#FCD34D',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              borderRadius: 'var(--radius-pill)',
              lineHeight: 1.1,
            }}
            title="No fungibility rule routes this VM to any hardware in your fleet. Open the Fungibility tab to set a Home or Spillover cell for this VM class."
          >
            ⚠ No eligible HW
          </span>
        )}
        {/* v2.19.53 — Per-pair "missing rules" pill removed. BOM-2 directive:
            a row is flagged ONLY when the SKU has zero authored cells against
            any placed HW (isUnroutable above). Partial authoring no longer
            nags the user. */}
        {hasZoneIssue && (
          <span
            className="text-[9px] font-medium tracking-[0.02em]"
            style={{
              padding: '2px 6px',
              background: 'rgba(251, 191, 36, 0.12)',
              color: '#FCD34D',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              borderRadius: 'var(--radius-pill)',
              lineHeight: 1.1,
            }}
            title={`This row targets ${
              missingZones!.length === 1 ? missingZones![0] : missingZones!.join(', ')
            } but no cluster in your fleet is tagged with ${
              missingZones!.length === 1 ? 'that zone' : 'those zones'
            }. Add the zone in Fleet builder, or change the row's zone.`}
          >
            ⚠ {missingZones!.length === 1
              ? `${missingZones![0]} not in fleet`
              : `${missingZones!.length} zones not in fleet`}
          </span>
        )}
        {/* Quantity */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, '');
            setDraft(v);
            if (v !== '') {
              const n = Number(v);
              if (n >= 1) {
                dispatch({ type: 'BOM_UPDATE', index: row.index, entry: { quantity: n } });
              }
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="px-2 py-0.5 text-[11px] font-mono text-center glass-input"
          style={{ width: 64 }}
          aria-label={`Quantity of ${row.entry.vmSizeName}`}
        />
        {/* Region (read-only) */}
        <span
          className="text-[10px] font-mono text-text-muted whitespace-nowrap"
          style={{ minWidth: 92 }}
          title={cat?.region ? `Region: ${cat.region}` : 'No region on the source SKU'}
        >
          {region}
        </span>
        {/* Reg/Zonal toggle */}
        <div
          className="flex items-center text-[9px] font-mono tracking-[0.02em]"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
          }}
          role="group"
          aria-label={`Deployment type for ${row.entry.vmSizeName}`}
        >
          <button
            type="button"
            onClick={() => setDeployment('regional')}
            className="px-2 py-0.5 transition-colors"
            style={{
              background: !isZonal ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
              color: !isZonal ? 'var(--interactive)' : 'var(--text-muted)',
            }}
            title="Regional: pack into whichever cluster has the most capacity"
          >
            Reg
          </button>
          <button
            type="button"
            onClick={() => setDeployment('zonal')}
            className="px-2 py-0.5 transition-colors"
            style={{
              background: isZonal ? 'rgba(129, 140, 248, 0.18)' : 'transparent',
              color: isZonal ? 'var(--interactive)' : 'var(--text-muted)',
            }}
            title="Zonal: pin to a specific zone, or pick 'any' to balance across all zones with clusters."
          >
            Zonal
          </button>
        </div>
        {/* Zone dropdown pill — only when Zonal. Single-select. */}
        {isZonal && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setZoneDropdownOpen((s) => !s)}
              className="text-[10px] font-mono flex items-center gap-1.5 transition-all"
              style={{
                padding: '4px 10px',
                minWidth: 78,
                background: 'rgba(129, 140, 248, 0.10)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                lineHeight: 1.2,
              }}
              title={
                selectedZone === null
                  ? 'Any zone (engine balances across every zone with clusters)'
                  : `Pinned to ${selectedZone}`
              }
              aria-haspopup="listbox"
              aria-expanded={zoneDropdownOpen}
            >
              <span className="flex-1 text-left">
                {selectedZone === null ? 'any' : selectedZone.replace('Zone ', 'Z')}
              </span>
              <span className="text-text-muted">▾</span>
            </button>
            {zoneDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  minWidth: 130,
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
                    setZone(null);
                  }}
                  className="w-full text-left text-[10.5px] font-mono px-3 py-2"
                  style={{
                    background:
                      selectedZone === null ? 'rgba(129, 140, 248, 0.12)' : 'transparent',
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                  title="Balance across every zone with at least one cluster."
                >
                  any · balance
                </button>
                {ZONES.map((z) => {
                  const active = selectedZone === z;
                  const noClusters = !zonesWithClusters.has(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setZone(z);
                      }}
                      className="w-full text-left text-[10.5px] font-mono px-3 py-2 transition-colors"
                      style={{
                        background: active
                          ? 'rgba(129, 140, 248, 0.18)'
                          : 'transparent',
                        color: noClusters ? '#FCD34D' : 'var(--text-primary)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                      title={
                        noClusters
                          ? `No cluster tagged with ${z} — VMs would be unplaceable`
                          : `Pin to ${z}`
                      }
                    >
                      {z}
                      {noClusters && (
                        <span className="ml-2 text-[9px]" style={{ color: '#FCD34D' }}>
                          ⚠ no cluster
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => dispatch({ type: 'BOM_REMOVE', index: row.index })}
          className="text-text-muted hover:text-red-400 text-sm leading-none"
          aria-label="Remove row"
          title="Remove this row from the BoM"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

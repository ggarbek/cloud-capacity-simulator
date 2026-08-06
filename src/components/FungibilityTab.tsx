/**
 * Fungibility Configurator — an earlier iteration.
 *
 * UX (locked with the user in an earlier iteration):
 *   • Empty by default — fungibility is OPTIONAL. GCP-dedicated-host case
 *     "just works" without authoring a single cell.
 *   • Priority-ordered, not tri-state — cells carry numeric priority
 *     (0 = Home, 1..5 = Spillover order, 'blocked', or null = NOT_AUTHORED).
 *   • Filter-driven workspace:
 *       Cloud Provider (single-select) → narrows BOTH HW columns AND VM rows.
 *       Hardware       (multi-select)  → which uploaded HW groups appear as columns.
 *       VM Family      (multi-select)  → which VM families appear as rows, with search.
 *   • Excel-style direct manipulation:
 *       - Click + drag selects a rectangle of cells.
 *       - Shift+click extends, Cmd/Ctrl+click toggles single cells.
 *       - Escape clears selection.
 *       - Cmd/Ctrl+C copies selected cells as TSV (Excel-compatible).
 *       - Cmd/Ctrl+V pastes: single-cell clipboard fills selection;
 *         rectangle clipboard places at the selection's top-left anchor.
 *       - Bulk-op pills apply to selection when non-empty; otherwise to
 *         the filtered view (with confirm guard when no filter is active).
 *   • Cell click cycles: blank → H → 1 → 2 → 3 → 4 → 5 → B → blank.
 *
 * Decoupling-pure: matrix starts empty. No M-Series routing knowledge ships.
 * The user authors. Falls back to mock data only when state has no uploads
 * yet so the prototype is demoable without an upload.
 *
 * Task #21 will move matrix from local useState into AppState.userFungibility
 * with localStorage persistence. Tasks #23/#25/#26 wire the engine + Excel
 * round-trip + tests.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { PROVIDER_THEMES, PROVIDER_ORDER, providerOf, vmClass, vmFamily, isAzureMCompoundFamily } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { VM_CATEGORIES, type VmCategory } from '../types';
import { ProviderPillRow } from './ProviderPillRow';
import {
  downloadMatrixXlsx,
  parseFungibilityXlsx,
  type Matrix as XlsxMatrix,
} from '../utils/fungibilityTemplate';
import { useHistoryState } from '../utils/useHistoryState';
import { hardwareFungibilityStatus, type FungibilityMatrix } from '../utils/fungibilityStatus';
import { FungibilityBoard } from './FungibilityBoard';
import type { CatalogEntry, HardwareGroup } from '../types';

// ────────────────────────────────────────────────────────────────────────
// Cell value model — kept here so swapping to AppState in task #21 is a
// one-import change. `null` = not yet authored; number = priority
// (0 = Home, 1..5 = Spillover order); 'blocked' = explicit refuse.
// ────────────────────────────────────────────────────────────────────────
export type CellValue = number | 'blocked' | null;

const MAX_SPILL_PRIORITY = 5;

function cycleNext(v: CellValue): CellValue {
  if (v === null) return 0;
  if (v === 'blocked') return null;
  if (v < MAX_SPILL_PRIORITY) return v + 1;
  return 'blocked';
}

// ────────────────────────────────────────────────────────────────────────
// Mock fallback data — used only when state.userHardware / state.userVms are
// empty so the prototype is demoable on a clean install. As soon as the user
// uploads, real state takes over.
// ────────────────────────────────────────────────────────────────────────
const MOCK_HW: HardwareGroup[] = [
  mockHw('gen-legacy-mm',     'Gen-Legacy MM',     'Azure', 'mm', 4096),
  mockHw('gen-a-mm',   'Gen-A MM-Std', 'Azure', 'mm', 4096),
  mockHw('gen-c-mm',   'Gen-C MM-Std', 'Azure', 'mm', 4096),
  mockHw('gen-legacy0-hm',     'Gen-Legacy0 HM',     'Azure', 'hm', 12288),
  mockHw('gen-b-hm-mixed', 'Gen-B HM Mixed', 'Azure', 'hm', 8192),
  mockHw('gen-c-hm',   'Gen-C HM Mixed', 'Azure', 'hm', 16384),
  mockHw('gen-a-vhm',    'Gen-A VHM',    'Azure', 'vhm', 32768),
  mockHw('aws-m7i',     'AWS m7i host','AWS',   'mm', 1024),
  mockHw('aws-r7i',     'AWS r7i host','AWS',   'hm', 1024),
  mockHw('gcp-n2',      'GCP n2 host', 'GCP',   'mm', 1024),
  mockHw('gcp-c3',      'GCP c3 host', 'GCP',   'mm', 1024),
];
function mockHw(id: string, name: string, provider: string, cat: 'mm'|'hm'|'vhm', ram: number): HardwareGroup {
  return {
    id, name, provider,
    memoryCategory: cat,
    memoryGibPerNode: ram,
    socketsPerNode: 2,
    vcpusPerNode: 96,
    coresPerSocket: 48,
    nodesPerRack: 12,
    processor: '',
    homeFor: [],
    spilloverFrom: [],
    isolated: cat === 'vhm',
  };
}
const MOCK_VMS: CatalogEntry[] = [
  mockVm('Standard_M8ms',   'Mv1', 'Medium Memory (MM)',      'Azure', 'M'),
  mockVm('Standard_M64s',   'Mv2', 'Medium Memory (MM)',      'Azure', 'M'),
  mockVm('Standard_M128ms', 'Mv2', 'High Memory (HM)',        'Azure', 'M'),
  mockVm('Standard_M64s_v3','Mv3', 'Medium Memory (MM)',      'Azure', 'M'),
  mockVm('Standard_M192is_v3','Mv3','High Memory (HM)',       'Azure', 'M'),
  mockVm('Standard_M896ix_v3','Mv3','Very High Memory (VHM)', 'Azure', 'M'),
  mockVm('Standard_E32s_v5','v5',  'Medium Memory (MM)',      'Azure', 'E'),
  mockVm('m7i.xlarge',      '',    'Medium Memory (MM)',      'AWS',   'm7i'),
  mockVm('r7i.xlarge',      '',    'High Memory (HM)',        'AWS',   'r7i'),
  mockVm('n2-standard-4',   '',    'Medium Memory (MM)',      'GCP',   'n2-standard'),
  mockVm('c3-highmem-4',    '',    'High Memory (HM)',        'GCP',   'c3-highmem'),
];
function mockVm(name: string, gen: string, cat: CatalogEntry['memoryCategory'], provider: string, family: string): CatalogEntry {
  return {
    vmSizeName: name, vmGeneration: gen, series: '', memoryCategory: cat,
    homeHardwareGroup: '', spilloverTarget: 'N/A', processor: '',
    vcpus: 0, memoryGib: 0, networkMbps: 0, localDiskGib: 0,
    status: 'Generally Available', notes: '', provider, family,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────
export function FungibilityTab() {
  const { state, dispatch } = useApp();
  const liveHw = state.userHardware;
  const liveVms = state.userVms;
  const usingMockData = liveHw.length === 0 && liveVms.length === 0;
  const hwSource = usingMockData ? MOCK_HW : liveHw;
  const vmSource = usingMockData ? MOCK_VMS : liveVms;

  // v2.19.51 — Auto-save model (EXPLICIT exception to the staging doctrine).
  // Every matrix mutation dispatches FUNGIBILITY_REPLACE immediately to
  // `state.userFungibility`. The local history stack still wraps the live
  // applied matrix so Cmd/Ctrl-Z undo + Cmd/Ctrl-Shift-Z redo keep working
  // as a safety net for accidental edits — when the user undoes, we dispatch
  // FUNGIBILITY_REPLACE with the historic snapshot so AppState catches up.
  //
  // The previous Submit/Discard staging UI was removed: cell cycling,
  // drag-bulk, keyboard 0-5/H/B/Del, paste, Clear, and Excel upload now
  // commit directly. See feedback_ui_staging_vs_instant_commit.md for the
  // explicit-exception note.
  const appliedMatrix = state.userFungibility as Record<string, Record<string, CellValue>>;
  const matrixHistory = useHistoryState<Record<string, Record<string, CellValue>>>(
    appliedMatrix,
    { cap: 50 },
  );
  const matrix = matrixHistory.value;
  // Strip null/undefined cells so the persisted shape stays clean
  // (mirrors the old handleSubmit() cleanup that ran on every commit).
  const cleanMatrix = useCallback(
    (m: Record<string, Record<string, CellValue>>): Record<string, Record<string, number | 'blocked'>> => {
      const out: Record<string, Record<string, number | 'blocked'>> = {};
      for (const vmKey of Object.keys(m)) {
        const row: Record<string, number | 'blocked'> = {};
        for (const hwId of Object.keys(m[vmKey])) {
          const v = m[vmKey][hwId];
          if (v === null || v === undefined) continue;
          row[hwId] = v;
        }
        if (Object.keys(row).length > 0) out[vmKey] = row;
      }
      return out;
    },
    [],
  );
  // setMatrix wraps history.setValue, then auto-commits the resulting matrix
  // to AppState via FUNGIBILITY_REPLACE. The history.value updates on the
  // next render, so we resolve `next` here too in order to dispatch with the
  // fresh snapshot.
  const setMatrix = useCallback(
    (next: Record<string, Record<string, CellValue>> | ((prev: Record<string, Record<string, CellValue>>) => Record<string, Record<string, CellValue>>)) => {
      const resolved =
        typeof next === 'function'
          ? (next as (p: Record<string, Record<string, CellValue>>) => Record<string, Record<string, CellValue>>)(matrix)
          : next;
      matrixHistory.setValue(resolved);
      dispatch({ type: 'FUNGIBILITY_REPLACE', matrix: cleanMatrix(resolved) });
    },
    [matrix, matrixHistory, dispatch, cleanMatrix],
  );
  // After undo/redo (or any history.value change that wasn't driven by our
  // setMatrix wrapper), sync AppState to whatever the stack now points at.
  // Skips no-op dispatches by comparing serialized shape so we don't loop.
  const lastDispatchedRef = useRef<string>('');
  useEffect(() => {
    const cleaned = cleanMatrix(matrix);
    const serial = JSON.stringify(cleaned);
    if (serial === lastDispatchedRef.current) return;
    lastDispatchedRef.current = serial;
    // Only dispatch when the AppState diverges, so we don't loop.
    const appliedSerial = JSON.stringify(appliedMatrix);
    if (serial === appliedSerial) return;
    dispatch({ type: 'FUNGIBILITY_REPLACE', matrix: cleaned });
  }, [matrix, appliedMatrix, cleanMatrix, dispatch]);

  // v2.20.2 (distill) — full-matrix disclosure. Default: collapsed when the
  // simple Route-your-BoM editor has rows to show, open when it doesn't
  // (no BoM / no placed hardware → the matrix is the only surface).
  const placedHwIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of state.fleetOrder) {
      const hwId = state.fleets[id]?.hardwareGroupId;
      if (hwId && state.userHardware.some((g) => g.id === hwId)) ids.add(hwId);
    }
    return ids;
  }, [state.fleetOrder, state.fleets, state.userHardware]);
  const simpleEditorHasRows = state.bom.length > 0 && placedHwIds.size > 0;
  const [fullMatrixPref, setFullMatrixPref] = useState<boolean | null>(null);
  const fullMatrixOpen = fullMatrixPref ?? !simpleEditorHasRows;

  // Filters
  const [cloudProvider, setCloudProvider] = useState<string | null>(null);
  const [hardwareFilter, setHardwareFilter] = useState<Set<string>>(new Set());
  const [familyFilter, setFamilyFilter] = useState<Set<string>>(new Set());
  // v2.18.8 — Required-single-select VM Category. Picking a category narrows
  // the family chip row to just that category's families (one of the
  // "Required + single-select large-corpus filters" doctrine — same pattern
  // as the VM Library tab for ~19k AWS SKUs).
  const [categoryFilter, setCategoryFilter] = useState<VmCategory | null>(null);
  // When ON, the matrix bypasses Category/Family selection and shows every VM
  // size that already has an authored cell against any visible HW row. Lets
  // the user see "what's already authored for this HW" in one view rather
  // than paging family-by-family.
  const [showAuthoredOnly, setShowAuthoredOnly] = useState(false);

  // Selection (Excel-style rectangle drag)
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const dragRef = useRef<{ active: boolean; anchorIdx: { r: number; c: number } | null; mode: 'replace' | 'union' }>({
    active: false, anchorIdx: null, mode: 'replace',
  });

  // Local clipboard for Cmd+C / Cmd+V (mirrors browser clipboard with values
  // that survive React re-renders without parsing TSV every paste).
  const clipboardRef = useRef<{ rows: number; cols: number; grid: CellValue[][] } | null>(null);

  // Hidden file input for the Upload Excel button.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // v2.18.9 — Ref to the matrix container for outside-click deselect. A
  // document mousedown listener clears the selection when the click lands
  // outside this element. Mirrors how Excel / Sheets / Figma drop selections.
  const matrixRef = useRef<HTMLElement>(null);
  // Toolbar ref so clicking the Apply Value buttons doesn't fire the
  // outside-click deselect handler before the bulk-set fires.
  const toolbarRef = useRef<HTMLElement>(null);
  // Transient toast for upload/download feedback. Auto-dismisses after 4 s.
  const [ioMsg, setIoMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => {
    if (!ioMsg) return;
    const t = setTimeout(() => setIoMsg(null), 4000);
    return () => clearTimeout(t);
  }, [ioMsg]);

  // ── Provider-driven scope ────────────────────────────────────────────
  // v2.8 — Counts feed the dim-empty styling in the shared ProviderPillRow.
  // We count hardware + VM rows tagged with each provider so an empty
  // provider pill renders dimmed (clickable, but visibly inert).
  const providerCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hwSource) {
      const p = h.provider ?? '';
      if (p) m[p] = (m[p] ?? 0) + 1;
    }
    for (const v of vmSource) {
      const p = providerOf(v);
      m[p] = (m[p] ?? 0) + 1;
    }
    return m;
  }, [hwSource, vmSource]);

  const providersInUse = useMemo(() => {
    const set = new Set<string>();
    for (const h of hwSource) if (h.provider) set.add(h.provider);
    for (const v of vmSource) set.add(providerOf(v));
    const known = (PROVIDER_ORDER as readonly string[]).filter((p) => set.has(p));
    const extras = [...set].filter((p) => !(PROVIDER_ORDER as readonly string[]).includes(p)).sort();
    return known.length || extras.length
      ? [...known, ...extras]
      : (PROVIDER_ORDER as readonly string[]).slice();
  }, [hwSource, vmSource]);

  // Auto-pick first provider with any HW or VMs so the matrix isn't blank on first load.
  useEffect(() => {
    if (cloudProvider == null && providersInUse.length > 0) {
      const first = providersInUse.find((p) =>
        hwSource.some((h) => (h.provider ?? 'Azure') === p) ||
        vmSource.some((v) => providerOf(v) === p),
      );
      if (first) setCloudProvider(first);
    }
  }, [cloudProvider, providersInUse, hwSource, vmSource]);

  // v2.18.7 — HW columns are NO LONGER provider-filtered. The Cloud Provider
  // pill at the top scopes the VM ROWS only; hardware columns always show
  // every uploaded group so the user can author cross-provider routing
  // (e.g. allow a Custom on-prem server to host Azure-VM-shaped workloads).
  // Each HW chip + matrix header carries a small provider tag so the user
  // can identify the cross-provider mapping at a glance.
  //
  // Previously this filter hid "Custom"-tagged HW when Azure was auto-picked,
  // surfacing as "No hardware groups for this provider" — confusing because
  // the user CAN see their HW in the Hardware Library.
  const hwForProvider = useMemo(() => hwSource, [hwSource]);

  // VMs for the active provider → distinct families for the family pill row.
  const vmsForProvider = useMemo(() => {
    if (!cloudProvider) return vmSource;
    return vmSource.filter((v) => providerOf(v) === cloudProvider);
  }, [vmSource, cloudProvider]);

  const familiesForProvider = useMemo(() => {
    const set = new Set<string>();
    for (const v of vmsForProvider) set.add(vmFamily(v));
    return [...set].sort();
  }, [vmsForProvider]);

  // v2.18.8 — Map every family in the active provider scope to its VmCategory,
  // then produce (a) per-category counts for the category pill row, and
  // (b) the family list scoped to the picked category for the chip row.
  // Replaces the v2.18.7 grouped-chip layout which got too tall.
  const familiesByCategory = useMemo(() => {
    const byCat = new Map<VmCategory, string[]>();
    for (const f of familiesForProvider) {
      const cat = categorize(cloudProvider ?? undefined, f);
      const list = byCat.get(cat) ?? [];
      list.push(f);
      byCat.set(cat, list);
    }
    return VM_CATEGORIES
      .filter((c) => byCat.has(c))
      .map((c) => ({ category: c, families: byCat.get(c)!.sort() }));
  }, [familiesForProvider, cloudProvider]);

  const familiesForCategory = useMemo(() => {
    if (!categoryFilter) return [];
    return familiesByCategory.find((g) => g.category === categoryFilter)?.families ?? [];
  }, [familiesByCategory, categoryFilter]);

  // Auto-pick the first available category whenever the current one is
  // empty (e.g. provider change drops the only family in the active
  // category) — keeps the chip row meaningful on first paint + after every
  // scope change. Required-single-select doctrine: never let the user land
  // on a blank chip area.
  useEffect(() => {
    if (familiesByCategory.length === 0) {
      if (categoryFilter !== null) setCategoryFilter(null);
      return;
    }
    const stillValid = familiesByCategory.some((g) => g.category === categoryFilter);
    if (!stillValid) setCategoryFilter(familiesByCategory[0].category);
  }, [familiesByCategory, categoryFilter]);

  // Whenever the category changes, drop any family selections that no
  // longer belong to the visible chip set so the matrix VM-row filter and
  // the chip-row stay coherent.
  useEffect(() => {
    if (familyFilter.size === 0) return;
    const visible = new Set(familiesForCategory);
    let pruned = false;
    const next = new Set<string>();
    for (const f of familyFilter) {
      if (visible.has(f)) next.add(f);
      else pruned = true;
    }
    if (pruned) setFamilyFilter(next);
  }, [familiesForCategory, familyFilter]);

  // ── Matrix slices ────────────────────────────────────────────────────
  const visibleHw = useMemo(
    () => (hardwareFilter.size === 0 ? hwForProvider : hwForProvider.filter((h) => hardwareFilter.has(h.id))),
    [hwForProvider, hardwareFilter],
  );

  // v2.19.15 — Per-HW "has at least one accepting rule" flag, computed off
  // the live DRAFT matrix so the alert updates as the user authors cells.
  // Drives the ⚠ marker on both the HW filter chips and the matrix column
  // headers. A hardware group with no Home/Spillover cell anywhere is one
  // the engine can never route a VM to.
  const hwAccepting = useMemo(() => {
    const m = new Set<string>();
    for (const hw of hwForProvider) {
      if (hardwareFungibilityStatus(hw.id, matrix as FungibilityMatrix).hasAccepting) {
        m.add(hw.id);
      }
    }
    return m;
  }, [hwForProvider, matrix]);

  // v2.19.52 — Set of vmSizeNames in the BoM that have ZERO authored cells
  // anywhere in the matrix (size-row absent AND class-row absent, or both
  // present but every cell undefined). Strict unroutable signal — aligns
  // with the "1 RULE MISSING" pill semantic per BOM-2. Per-(SKU × HW) gaps
  // are intentional under size-first / class-fallback resolution and no
  // longer amber-tint the column header.
  const bomMissingVmSet = useMemo(() => {
    const out = new Set<string>();
    const m = matrix as FungibilityMatrix;
    if (state.bom.length === 0) return out;
    const hasAnyAcceptingCell = (row: Record<string, number | 'blocked'> | undefined) => {
      if (!row) return false;
      for (const v of Object.values(row)) {
        if (v !== undefined && v !== 'blocked') return true;
      }
      return false;
    };
    for (const entry of state.bom) {
      const cat = state.userVms.find(
        (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
      );
      if (!cat) continue;
      const sizeKey = cat.vmSizeName;
      const classKey = vmClass(cat);
      if (!hasAnyAcceptingCell(m[sizeKey]) && !hasAnyAcceptingCell(m[classKey])) {
        out.add(sizeKey);
      }
    }
    return out;
  }, [matrix, state.bom, state.userVms]);

  // v2.19.28 — No family auto-pick. The v2.19.15 effect that auto-selected
  // the first family (E for Memory Optimized, etc.) was removed at the user's
  // request: "I don't want E series to be the default VM family. I want
  // nothing selected to be the default." The empty-state matrix copy ("Pick
  // one or more {category} families above to populate the matrix") is the
  // affordance. Category auto-pick stays (required-single-select doctrine).

  // Rows are individual VM SIZES (e.g. Standard_M128ms_v2, m7i.xlarge) —
  // derived from VMs in scope. v2.18.10: scope cascades Provider → Category →
  // Family. Category narrows the family-chip picker. The matrix populates
  // ONLY when ≥1 family chip is selected — empty familyFilter renders an
  // empty matrix with a "pick a family" prompt so a whole category's size
  // list never floods the table.
  //
  // v2.19.17 — Switched from one-row-per-class to one-row-per-size. The user
  // expects every known VM size in the selected family to appear so they can
  // route each size independently. The matrix key is now `vmSizeName`; the
  // engine resolves size-first with a legacy class-key fallback.
  const visibleVmsAfterFamily = useMemo(() => {
    if (showAuthoredOnly) {
      // "Show authored only" — bypass category/family filters. Pick every VM
      // size with an authored cell against ANY visible HW (visibleHw is the
      // hardwareFilter-narrowed list when non-empty, else the full provider
      // HW set). Falls back to the empty array when no matrix exists.
      if (Object.keys(matrix).length === 0) return [];
      const hwSet = hardwareFilter.size > 0
        ? hardwareFilter
        : new Set(hwForProvider.map((h) => h.id));
      return vmsForProvider.filter((v) => {
        const sizeKey = v.vmSizeName;
        const classKey = vmClass(v);
        const sizeRow = matrix[sizeKey];
        const classRow = matrix[classKey];
        if (!sizeRow && !classRow) return false;
        for (const hwId of hwSet) {
          const cell = sizeRow?.[hwId] !== undefined ? sizeRow[hwId] : classRow?.[hwId];
          if (cell !== undefined && cell !== null && cell !== 'blocked') return true;
        }
        return false;
      });
    }
    if (familyFilter.size === 0) return [];
    const inCategory = categoryFilter
      ? vmsForProvider.filter((v) => categorize(providerOf(v), vmFamily(v)) === categoryFilter)
      : vmsForProvider;
    return inCategory.filter((v) => familyFilter.has(vmFamily(v)));
  }, [vmsForProvider, familyFilter, categoryFilter, showAuthoredOnly, matrix, hardwareFilter, hwForProvider]);

  const visibleClasses = useMemo(() => {
    const seen = new Map<
      string,
      { key: string; label: string; family: string; cls: string }
    >();
    for (const v of visibleVmsAfterFamily) {
      // Per-size key — the matrix routes each size independently.
      const key = v.vmSizeName;
      if (!seen.has(key)) {
        seen.set(key, {
          key,
          label: v.vmSizeName.replace(/^Standard_/, ''),
          family: vmFamily(v),
          cls: vmClass(v),
        });
      }
    }
    // Group same-class sizes together (sort by class, then size name) so the
    // matrix reads as MM Mv2 sizes → HM Mv2 sizes → … rather than a flat A–Z.
    return [...seen.values()].sort(
      (a, b) => a.cls.localeCompare(b.cls) || a.key.localeCompare(b.key),
    );
  }, [visibleVmsAfterFamily]);

  // Drop selection whenever the visible scope changes so we never end up with
  // ghost selections pointing at hidden cells.
  useEffect(() => {
    setSelection(new Set());
    dragRef.current.active = false;
    dragRef.current.anchorIdx = null;
  }, [cloudProvider, hardwareFilter, familyFilter, categoryFilter, showAuthoredOnly]);

  // v2.19.52 — Consume the cross-tab "focus this VM size" signal. When the
  // BoM "rules missing" pill dispatches `fungibilityFocusVm`, derive the
  // VM's provider / category / family, drive the filter cascade to expose
  // that VM as a matrix column, scroll the column into view, then clear
  // the signal so re-clicking the same row re-fires the focus.
  const focusVm = state.ui.fungibilityFocusVm;
  useEffect(() => {
    if (!focusVm) return;
    const cat = state.userVms.find(
      (v) => v.vmSizeName.toLowerCase() === focusVm.toLowerCase(),
    );
    if (!cat) {
      dispatch({ type: 'UI_SET', ui: { fungibilityFocusVm: null } });
      return;
    }
    const provider = providerOf(cat);
    const family = vmFamily(cat);
    const category = categorize(provider, family);
    // Disable "show authored only" so the unauthored column actually renders.
    setShowAuthoredOnly(false);
    setCloudProvider(provider);
    if (category) setCategoryFilter(category);
    setFamilyFilter(new Set([family]));
    // Scroll the matching <th> into the matrix viewport after React commits.
    const id = window.setTimeout(() => {
      const target = matrixRef.current?.querySelector<HTMLElement>(
        `th[data-fung-vm-key="${cat.vmSizeName.replace(/"/g, '\\"')}"]`,
      );
      target?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      target?.animate(
        [
          { boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.6)' },
          { boxShadow: '0 0 0 2px rgba(251, 191, 36, 0)' },
        ],
        { duration: 1400 },
      );
    }, 60);
    dispatch({ type: 'UI_SET', ui: { fungibilityFocusVm: null } });
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusVm]);

  // v2.18.9 — Deselect on outside-click. When the user mousedowns anywhere
  // that isn't inside the matrix table OR the apply-value toolbar, drop
  // the selection. Replaces the explicit Deselect button (Esc still works).
  // We INCLUDE the toolbar in the "inside" set so clicking an Apply Value
  // chip doesn't immediately clear what you're about to act on.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (selection.size === 0) return;
      const target = e.target as Node | null;
      if (!target) return;
      const matrix = matrixRef.current;
      const toolbar = toolbarRef.current;
      if (matrix && matrix.contains(target)) return;
      if (toolbar && toolbar.contains(target)) return;
      setSelection(new Set());
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [selection.size]);

  // Visible-cell index helpers — drag rectangles work on (r, c) indices into
  // the currently rendered matrix. v2.19.27 axis flip: r indexes HW rows and
  // c indexes VM columns. The cellKey itself stays `${vmKey}|${hwId}` so the
  // backing matrix shape is unaffected.
  const cellKey = (vmKey: string, hwId: string) => `${vmKey}|${hwId}`;
  const cellKeyFromIdx = useCallback(
    (r: number, c: number) => cellKey(visibleClasses[c].key, visibleHw[r].id),
    [visibleClasses, visibleHw],
  );

  // ── Stats — across whole matrix, not just visible (gap counter is honest) ─
  const totalCells = visibleClasses.length * visibleHw.length;
  const stats = useMemo(() => {
    let configured = 0;
    let blocked = 0;
    let homeCells = 0;
    for (const vm of visibleClasses) {
      const row = matrix[vm.key] ?? {};
      for (const hw of visibleHw) {
        const v = row[hw.id];
        if (v === undefined || v === null) continue;
        configured++;
        if (v === 'blocked') blocked++;
        else if (v === 0) homeCells++;
      }
    }
    return { configured, blocked, homeCells, gaps: totalCells - configured };
  }, [matrix, visibleClasses, visibleHw, totalCells]);

  // ── Mutations ────────────────────────────────────────────────────────
  const setCells = useCallback(
    (cells: Iterable<{ vmKey: string; hwId: string }>, value: CellValue) => {
      setMatrix((prev) => {
        const next = { ...prev };
        for (const { vmKey, hwId } of cells) {
          const row = { ...(next[vmKey] ?? {}) };
          if (value === null) delete row[hwId];
          else row[hwId] = value;
          next[vmKey] = row;
        }
        return next;
      });
    },
    [],
  );

  const cycleCell = (vmKey: string, hwId: string) => {
    const current = matrix[vmKey]?.[hwId] ?? null;
    setCells([{ vmKey, hwId }], cycleNext(current));
  };

  // Bulk: prefer selection; fall back to filtered subset (with confirm).
  const targetCells = useCallback(
    (label: string): { vmKey: string; hwId: string }[] | null => {
      if (selection.size > 0) {
        return [...selection].map((k) => {
          const [vmKey, hwId] = k.split('|');
          return { vmKey, hwId };
        });
      }
      const hasFilter =
        cloudProvider !== null || hardwareFilter.size > 0 || familyFilter.size > 0 || categoryFilter !== null;
      const all: { vmKey: string; hwId: string }[] = [];
      for (const vm of visibleClasses) for (const hw of visibleHw) all.push({ vmKey: vm.key, hwId: hw.id });
      if (!all.length) return null;
      if (!hasFilter) {
        if (
          !window.confirm(
            `No filter or selection active — "${label}" will apply to all ${all.length} cells. Continue?`,
          )
        )
          return null;
      }
      return all;
    },
    [selection, visibleClasses, visibleHw, cloudProvider, hardwareFilter, familyFilter, categoryFilter],
  );

  const bulkSet = (value: CellValue, label: string) => {
    const cells = targetCells(label);
    if (!cells) return;
    setCells(cells, value);
  };

  const clearAll = () => {
    if (stats.configured === 0) return;
    if (!window.confirm(`Clear all authored cells from the fungibility matrix?`)) return;
    setMatrix({});
    setSelection(new Set());
  };

  // v2.19.51 — Auto-save: no Submit / Discard / pending-diff. Every mutation
  // dispatches FUNGIBILITY_REPLACE directly; undo/redo are the safety net.

  // ── Excel round-trip ──────────────────────────────────────────────────
  // Export uses the FULL HW + VM-class lists from state (not the filtered
  // view) so a round-trip preserves everything. An empty matrix exports as
  // all blanks — which IS the template the user fills in.
  const allHwColumns = useMemo(
    () => hwSource.map((h) => ({ id: h.id, name: h.name })),
    [hwSource],
  );
  // v2.19.17 — Export rows are per-SIZE (matrix key = vmSizeName), matching
  // the on-screen table. Sorted by class then size so a round-trip preserves
  // the grouped order.
  const allVmRows = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; cls: string }>();
    for (const v of vmSource) {
      const k = v.vmSizeName;
      if (!seen.has(k)) {
        seen.set(k, {
          key: k,
          label: v.vmSizeName.replace(/^Standard_/, ''),
          cls: vmClass(v),
        });
      }
    }
    return [...seen.values()]
      .sort((a, b) => a.cls.localeCompare(b.cls) || a.key.localeCompare(b.key))
      .map(({ key, label }) => ({ key, label }));
  }, [vmSource]);
  const canDownload = allHwColumns.length > 0 && allVmRows.length > 0;

  const handleDownload = () => {
    if (!canDownload) {
      setIoMsg({
        kind: 'err',
        text: 'Upload hardware + VM templates first — there are no rows or columns to export.',
      });
      return;
    }
    const filename =
      stats.configured > 0
        ? `fungibility-matrix-${new Date().toISOString().slice(0, 10)}.xlsx`
        : 'fungibility-template.xlsx';
    downloadMatrixXlsx(matrix as XlsxMatrix, allHwColumns, allVmRows, filename);
    setIoMsg({
      kind: 'ok',
      text:
        stats.configured > 0
          ? `Exported ${stats.configured} authored cell(s) across ${allVmRows.length} VM sizes × ${allHwColumns.length} HW groups.`
          : `Downloaded blank template (${allVmRows.length} × ${allHwColumns.length}). Fill in cells, then re-upload.`,
    });
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file
    if (!file) return;
    try {
      const result = await parseFungibilityXlsx(file);
      // Replace strategy — matches the rest of the upload buttons in the tool.
      // A merge mode could be added later if users ask.
      setMatrix(result.matrix);
      setSelection(new Set());
      const warnSuffix = result.warnings.length > 0 ? ` · ${result.warnings.length} warning(s)` : '';
      setIoMsg({
        kind: result.cellCount > 0 ? 'ok' : 'err',
        text:
          result.cellCount > 0
            ? `Imported ${result.cellCount} cell(s) across ${result.rowCount} VM class(es)${warnSuffix}.`
            : `No cells imported. ${result.warnings[0] ?? 'Check that the file follows the template format.'}`,
      });
    } catch (err) {
      setIoMsg({
        kind: 'err',
        text: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  // ── Selection helpers ────────────────────────────────────────────────
  const rectCells = (anchor: { r: number; c: number }, end: { r: number; c: number }): string[] => {
    const r0 = Math.min(anchor.r, end.r);
    const r1 = Math.max(anchor.r, end.r);
    const c0 = Math.min(anchor.c, end.c);
    const c1 = Math.max(anchor.c, end.c);
    const out: string[] = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(cellKeyFromIdx(r, c));
    return out;
  };

  const onCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault(); // suppress text selection while dragging
    const k = cellKeyFromIdx(r, c);
    if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl+click toggles a single cell into the existing selection.
      setSelection((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      });
      dragRef.current = { active: false, anchorIdx: null, mode: 'union' };
      return;
    }
    if (e.shiftKey && dragRef.current.anchorIdx) {
      const rect = rectCells(dragRef.current.anchorIdx, { r, c });
      setSelection(new Set(rect));
      dragRef.current = { active: true, anchorIdx: dragRef.current.anchorIdx, mode: 'replace' };
      return;
    }
    // Plain click: start a fresh rectangular selection anchored here.
    dragRef.current = { active: true, anchorIdx: { r, c }, mode: 'replace' };
    setSelection(new Set([k]));
  };

  const onCellMouseEnter = (r: number, c: number) => {
    const drag = dragRef.current;
    if (!drag.active || !drag.anchorIdx) return;
    const rect = rectCells(drag.anchorIdx, { r, c });
    setSelection(new Set(rect));
  };

  // End drag on global mouseup so the user can release outside the matrix.
  useEffect(() => {
    const up = () => {
      dragRef.current.active = false;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // v2.19.27 — Edge-proximity autoscroll while drag-selecting. When the user's
  // mouse approaches an edge of the matrix scroll container, scroll that
  // edge so the rectangle keeps expanding into newly-revealed cells. Without
  // this, large selections across a wide VM-column matrix (axis flip in
  // v2.19.27) require letting go + restarting from the next visible cell.
  // The handler is bound to `window` so it keeps firing even when the cursor
  // briefly leaves the matrix surface; checks `dragRef.current.active` so
  // it's a no-op outside an active drag.
  useEffect(() => {
    const EDGE = 36; // px from the container edge where autoscroll begins
    const MAX_STEP = 18; // max scroll delta per frame
    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const tick = () => {
      raf = 0;
      const el = matrixRef.current;
      if (!el || !dragRef.current.active) return;
      const rect = el.getBoundingClientRect();
      const dxLeft = lastX - rect.left;
      const dxRight = rect.right - lastX;
      const dyTop = lastY - rect.top;
      const dyBot = rect.bottom - lastY;
      let dx = 0, dy = 0;
      if (dxLeft < EDGE && dxLeft > -EDGE) {
        // Closer to (or past) the left edge → scroll left.
        const intensity = Math.min(1, (EDGE - dxLeft) / EDGE);
        dx = -Math.ceil(intensity * MAX_STEP);
      } else if (dxRight < EDGE && dxRight > -EDGE) {
        const intensity = Math.min(1, (EDGE - dxRight) / EDGE);
        dx = Math.ceil(intensity * MAX_STEP);
      }
      if (dyTop < EDGE && dyTop > -EDGE) {
        const intensity = Math.min(1, (EDGE - dyTop) / EDGE);
        dy = -Math.ceil(intensity * MAX_STEP);
      } else if (dyBot < EDGE && dyBot > -EDGE) {
        const intensity = Math.min(1, (EDGE - dyBot) / EDGE);
        dy = Math.ceil(intensity * MAX_STEP);
      }
      if (dx !== 0 || dy !== 0) {
        el.scrollLeft += dx;
        el.scrollTop += dy;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Single-click on a cell (after release without drag past it) = cycle value.
  // We detect this by checking if selection size is 1 and matches the clicked
  // cell AND the user didn't drag (anchor unchanged). Simplest behaviour:
  // double-click cycles. Stick with that to keep drag-select unambiguous.
  const onCellDoubleClick = (vmKey: string, hwId: string) => cycleCell(vmKey, hwId);

  // ── Keyboard: Escape clears, Cmd+C / Cmd+V, Delete clears selected ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs.
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setSelection(new Set());
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.size === 0) return;
        e.preventDefault();
        setCells(
          [...selection].map((k) => {
            const [vmKey, hwId] = k.split('|');
            return { vmKey, hwId };
          }),
          null,
        );
        return;
      }
      // Number 0-5 sets priority for selected cells; B blocks; H = 0
      // Cmd/Ctrl+Z = undo; Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y = redo. Mac
      // convention prefers Shift+Z; Windows convention prefers Y. Bind both.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (!matrixHistory.canUndo) return;
        e.preventDefault();
        matrixHistory.undo();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')
      ) {
        if (!matrixHistory.canRedo) return;
        e.preventDefault();
        matrixHistory.redo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        if (selection.size === 0) return;
        copySelection();
        e.preventDefault();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) {
        if (selection.size === 0) return;
        pasteIntoSelection();
        e.preventDefault();
        return;
      }
      if (selection.size > 0 && /^[0-5]$/.test(e.key)) {
        setCells(
          [...selection].map((k) => {
            const [vmKey, hwId] = k.split('|');
            return { vmKey, hwId };
          }),
          Number(e.key),
        );
      }
      if (selection.size > 0 && (e.key === 'b' || e.key === 'B')) {
        setCells(
          [...selection].map((k) => {
            const [vmKey, hwId] = k.split('|');
            return { vmKey, hwId };
          }),
          'blocked',
        );
      }
      if (selection.size > 0 && (e.key === 'h' || e.key === 'H')) {
        setCells(
          [...selection].map((k) => {
            const [vmKey, hwId] = k.split('|');
            return { vmKey, hwId };
          }),
          0,
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, setCells, matrixHistory]);

  // ── Clipboard ────────────────────────────────────────────────────────
  // Selection bounding box → 2D grid of values → TSV. Mirrors Excel: copying
  // 1 cell pastes that value into every selected cell; copying a rectangle
  // pastes at the top-left of the current selection.
  const copySelection = () => {
    if (selection.size === 0) return;
    const idxs = [...selection].map((k) => {
      const [vmKey, hwId] = k.split('|');
      const r = visibleClasses.findIndex((v) => v.key === vmKey);
      const c = visibleHw.findIndex((h) => h.id === hwId);
      return { r, c, vmKey, hwId };
    }).filter((x) => x.r >= 0 && x.c >= 0);
    if (!idxs.length) return;
    const r0 = Math.min(...idxs.map((i) => i.r));
    const r1 = Math.max(...idxs.map((i) => i.r));
    const c0 = Math.min(...idxs.map((i) => i.c));
    const c1 = Math.max(...idxs.map((i) => i.c));
    const grid: CellValue[][] = [];
    for (let r = r0; r <= r1; r++) {
      const row: CellValue[] = [];
      for (let c = c0; c <= c1; c++) {
        const vm = visibleClasses[r].key;
        const hw = visibleHw[c].id;
        if (selection.has(cellKey(vm, hw))) row.push(matrix[vm]?.[hw] ?? null);
        else row.push(null); // unselected cells inside the bbox copy as blank
      }
      grid.push(row);
    }
    clipboardRef.current = { rows: grid.length, cols: grid[0].length, grid };
    // Also push TSV to system clipboard so users can paste into Excel.
    const tsv = grid.map((row) => row.map(formatCellTsv).join('\t')).join('\n');
    try {
      navigator.clipboard.writeText(tsv);
    } catch {
      /* clipboard API can fail in non-secure contexts — local ref still works */
    }
  };

  const pasteIntoSelection = () => {
    const clip = clipboardRef.current;
    if (!clip || selection.size === 0) return;
    const idxs = [...selection].map((k) => {
      const [vmKey, hwId] = k.split('|');
      const r = visibleClasses.findIndex((v) => v.key === vmKey);
      const c = visibleHw.findIndex((h) => h.id === hwId);
      return { r, c, vmKey, hwId };
    }).filter((x) => x.r >= 0 && x.c >= 0);
    if (!idxs.length) return;
    const r0 = Math.min(...idxs.map((i) => i.r));
    const c0 = Math.min(...idxs.map((i) => i.c));

    const writes: { vmKey: string; hwId: string; value: CellValue }[] = [];
    if (clip.rows === 1 && clip.cols === 1) {
      // Fill every selected cell with the single copied value.
      const v = clip.grid[0][0];
      for (const i of idxs) writes.push({ vmKey: i.vmKey, hwId: i.hwId, value: v });
    } else {
      // Place rectangle starting at selection's top-left, clipped to grid bounds.
      for (let dr = 0; dr < clip.rows; dr++) {
        for (let dc = 0; dc < clip.cols; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r >= visibleClasses.length || c >= visibleHw.length) continue;
          writes.push({
            vmKey: visibleClasses[r].key,
            hwId: visibleHw[c].id,
            value: clip.grid[dr][dc],
          });
        }
      }
    }
    setMatrix((prev) => {
      const next = { ...prev };
      for (const w of writes) {
        const row = { ...(next[w.vmKey] ?? {}) };
        if (w.value === null) delete row[w.hwId];
        else row[w.hwId] = w.value;
        next[w.vmKey] = row;
      }
      return next;
    });
  };

  // ── Render ───────────────────────────────────────────────────────────
  const toggleSet = (s: Set<string>, key: string): Set<string> => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  return (
    <div className="flex flex-col h-full" style={{ userSelect: 'none' }}>
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-text-primary">
      {/* ── Header ──────────────────────────────────────────────────────
          Section pill spans the full pane (per the section-h doctrine);
          Excel round-trip buttons live INSIDE the pill on the right edge
          so they're treated as primary header actions. */}
      <section>
        <h2 className="section-h gap-2">
          <span>VM fungibility</span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              className="text-[10px] font-medium transition-all"
              style={{
                padding: '3px 10px',
                background: canDownload ? 'rgba(129, 140, 248, 0.10)' : 'rgba(148, 163, 184, 0.05)',
                color: canDownload ? 'var(--interactive)' : 'var(--text-muted)',
                border: `1px solid ${canDownload ? 'var(--border-glow)' : 'rgba(148, 163, 184, 0.20)'}`,
                borderRadius: 'var(--radius-pill)',
                cursor: canDownload ? 'pointer' : 'not-allowed',
                letterSpacing: '0.05em',
              }}
              title={
                canDownload
                  ? stats.configured > 0
                    ? 'Export your current matrix as Excel. Use the same file as a template to re-upload later.'
                    : 'Download a blank Excel template shaped against your uploaded HW + VMs. Fill it in and re-upload.'
                  : 'Upload hardware + VM templates first — nothing to export yet.'
              }
            >
              ⤓ Download template
            </button>
            <button
              onClick={handleUploadClick}
              className="text-[10px] font-medium transition-all"
              style={{
                padding: '3px 10px',
                background: 'rgba(129, 140, 248, 0.10)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.05em',
              }}
              title="Upload a filled-out fungibility template. Replaces the current matrix."
            >
              ⤒ Upload Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChosen}
              style={{ display: 'none' }}
              aria-hidden
            />
          </div>
        </h2>
        <div className="text-[11px] text-text-secondary mt-2 leading-snug">
          Pick a <strong>cloud provider</strong>, then drag a <strong>VM Category</strong> or{' '}
          <strong>VM Family</strong> from the left onto a tier row of a server on the right:{' '}
          <strong>★ Home</strong> is first choice, <strong>↓ Spill 1/2/…</strong> are the fallbacks
          in order, <strong>✕ Never</strong> blocks. The row you drop into is the tier, and the rule
          covers every VM under that category/family (expand a family to fine-tune a single size).
          This is exactly the cascade the engine packs against — a family with no Home has nowhere
          to go.
          {usingMockData && (
            <span className="block mt-1 text-[10px] italic" style={{ color: 'var(--interactive)' }}>
              ● Showing mock data. Upload hardware + VM templates and your real catalog will
              populate this matrix automatically.
            </span>
          )}
        </div>

        {/* v2.23.11 — The one-click "⚡ Auto-route N rules" feature was removed:
            authoring is intentional here, and a bulk auto-assign made the
            routing confusing/wrong. Missing rules surface via the per-size BoM
            warning + the tab alert dots; author them on the board below (or via
            the Excel round-trip in the header). */}

        {/* v2.19.16 — Generic "hardware without rules" callout. Shows whenever
            ANY hardware in the current provider scope still has no accepting
            cell. Concise: one title + one line. The amber ● markers on the HW
            chips + matrix columns below point to exactly which ones. */}
        {hwForProvider.some((h) => !hwAccepting.has(h.id)) && (
          <div
            className="text-[11px] mt-3 px-3.5 py-2.5 leading-snug"
            style={{
              background: 'rgba(251, 191, 36, 0.06)',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: '#FCD34D' }}>⚠</span>
              <span className="font-semibold text-[11px]" style={{ color: '#FCD34D' }}>
                You have hardware with no fungibility rules
              </span>
            </div>
            <div className="text-text-secondary mt-1 text-[10.5px]">
              Fungibility rules are required for VMs to deploy on a hardware. Set at least
              one rule on each <span style={{ color: '#FCD34D' }}>●</span>-marked hardware below.
            </div>
          </div>
        )}

        {ioMsg && (
          <div
            className="text-[11px] px-3 py-2 mt-2"
            style={{
              background:
                ioMsg.kind === 'ok'
                  ? 'rgba(129, 140, 248, 0.06)'
                  : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${
                ioMsg.kind === 'ok' ? 'var(--border-glow)' : 'rgba(239, 68, 68, 0.40)'
              }`,
              color: ioMsg.kind === 'ok' ? 'var(--interactive)' : '#FCA5A5',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {ioMsg.text}
          </div>
        )}
      </section>

      {/* ── v2.22.0 — Fungibility board: family-first drag-and-drop. The
          two-panel board (VM palette → hardware tier rows) is now the sole
          authoring surface; the old "Full matrix" grid disclosure was
          removed in v2.22.7 (the board covers every size × hardware and the
          Excel round-trip in the header above still bulk-edits the matrix).
          Same engine contract: size-keyed priority cells, size-first /
          class-fallback reads. */}
      <FungibilityBoard
        matrix={matrix}
        setMatrix={setMatrix}
      />

    </div>

    {/* v2.19.51 — Auto-save indicator (replaces the Submit/Discard footer).
        Cell edits commit directly to state.userFungibility; Cmd/Ctrl-Z and
        Cmd/Ctrl-Shift-Z stay wired as the accidental-edit safety net. */}
    <AutoSaveFooter />
    </div>
  );
}

function AutoSaveFooter() {
  return (
    <div
      className="flex items-center px-4 py-2"
      style={{
        background: 'var(--bg-deep)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center gap-1.5 ml-auto text-[10px] font-mono"
        title="Edits commit directly to the matrix. Cmd/Ctrl-Z undoes accidental changes."
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--interactive)',
            boxShadow: '0 0 6px rgba(129, 140, 248, 0.55)',
          }}
        />
        <span className="tracking-[0.04em]" style={{ color: 'var(--interactive)' }}>
          Auto-saved
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Cell — visual, no click handler (parent <td> owns mouse events for drag)
// ────────────────────────────────────────────────────────────────────────
function Cell({ value, selected }: { value: CellValue; selected: boolean }) {
  const { label, bg, fg, border } = cellVisuals(value);
  return (
    <div
      style={{
        width: '100%',
        minWidth: 68,
        height: 28,
        background: bg,
        color: fg,
        border: selected
          ? '2px solid #60A5FA'
          : `1px solid ${border}`,
        outline: selected ? '1px solid rgba(96, 165, 250, 0.55)' : 'none',
        outlineOffset: selected ? -3 : 0,
        borderRadius: 4,
        margin: 2,
        fontSize: 10,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'cell',
        boxShadow: selected ? 'inset 0 0 0 1px rgba(96, 165, 250, 0.45)' : 'none',
      }}
      title={titleFor(value)}
    >
      {label}
    </div>
  );
}

function cellVisuals(v: CellValue): { label: string; bg: string; fg: string; border: string } {
  if (v === null)
    return {
      label: '·',
      bg: 'transparent',
      fg: 'rgba(148, 163, 184, 0.45)',
      border: 'rgba(148, 163, 184, 0.18)',
    };
  if (v === 'blocked')
    return {
      label: 'B',
      bg: 'rgba(239, 68, 68, 0.18)',
      fg: '#FCA5A5',
      border: 'rgba(239, 68, 68, 0.55)',
    };
  if (v === 0)
    return {
      label: 'H',
      bg: 'rgba(129, 140, 248, 0.22)',
      fg: '#86EFAC',
      border: 'rgba(129, 140, 248, 0.55)',
    };
  // Spillover priorities — paler amber as the number climbs (1 → 5).
  const alpha = Math.max(0.05, 0.28 - (v - 1) * 0.04);
  return {
    label: String(v),
    bg: `rgba(252, 211, 77, ${alpha})`,
    fg: '#FCD34D',
    border: 'rgba(252, 211, 77, 0.45)',
  };
}

function titleFor(v: CellValue): string {
  if (v === null) return 'Not authored — double-click to set Home (0)';
  if (v === 'blocked') return 'Blocked — engine refuses placement';
  if (v === 0) return 'Home (priority 0) — preferred host';
  return `Spillover (priority ${v}) — tried after lower-priority clusters`;
}

function formatCellTsv(v: CellValue): string {
  if (v === null) return '';
  if (v === 'blocked') return 'B';
  if (v === 0) return 'H';
  return String(v);
}

// ────────────────────────────────────────────────────────────────────────
// Pills + Chips
// ────────────────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
  prefix,
  suffix,
  warn = false,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  /** v2.18.7 — Optional leading decoration (e.g. provider-colored dot)
   *  rendered inline before the label. Used by HW chips so the user can
   *  see which provider each group is tagged with at a glance. */
  prefix?: React.ReactNode;
  /** v2.19.15 — Optional trailing decoration (e.g. a ⚠ when the HW has no
   *  fungibility rule). Rendered after the label. */
  suffix?: React.ReactNode;
  /** v2.19.15 — Amber-tints the (inactive) chip border to flag an unmet
   *  setup requirement. When active, the green active styling still wins. */
  warn?: boolean;
  title?: string;
}) {
  const border = active
    ? 'var(--border-glow)'
    : warn
    ? 'rgba(251, 191, 36, 0.50)'
    : 'rgba(255,255,255,0.10)';
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-mono transition-all inline-flex items-center gap-1.5"
      style={{
        padding: '3px 10px',
        background: active
          ? 'rgba(129, 140, 248, 0.14)'
          : warn
          ? 'rgba(251, 191, 36, 0.06)'
          : 'rgba(255,255,255,0.03)',
        color: active ? 'var(--interactive)' : 'var(--text-secondary)',
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-pill)',
      }}
      aria-pressed={active}
      title={title}
    >
      {prefix}
      {label}
      {suffix}
    </button>
  );
}

/** v2.19.16 — Fungibility-status dot. Green = this hardware has at least one
 *  Home/Spillover rule (no action needed); amber = no rule yet (VMs can't
 *  deploy here). Replaces the provider-colored dot on HW chips + matrix
 *  column headers, where routing status matters more than provider identity
 *  (provider stays in the chip tooltip + the column text color). */
function StatusDot({ ok }: { ok: boolean }) {
  const color = ok ? 'var(--interactive)' : '#FCD34D';
  const glow = ok ? 'rgba(129, 140, 248, 0.55)' : 'rgba(251, 191, 36, 0.65)';
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 4px ${glow}`,
        flexShrink: 0,
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.18.9 — Apply-value button (color-coded to match the matrix cell)
// ────────────────────────────────────────────────────────────────────────
function ApplyValueBtn({
  value,
  onClick,
  title,
}: {
  value: CellValue;
  onClick: () => void;
  title: string;
}) {
  const v = cellVisuals(value);
  const isClear = value === null;
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-[11px] font-mono font-semibold transition-all"
      style={{
        width: 26,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isClear ? 'transparent' : v.bg,
        color: isClear ? 'var(--text-muted)' : v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
      }}
      aria-label={title}
    >
      {isClear ? '⌫' : v.label}
    </button>
  );
}

// v2.18.9 — Subtle icon button for undo/redo. Disabled-styled when not
// available. No label — relies on the title attribute + aria-label.
function IconBtn({
  onClick,
  disabled,
  title,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className="text-[14px] transition-colors"
      style={{
        width: 24,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: disabled ? 'rgba(148, 163, 184, 0.30)' : 'var(--text-muted)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Stat chip + Bulk button (legacy — kept for back-compat; Stat is unused
// since v2.18.9 inlined the matrix summary above the table)
// ────────────────────────────────────────────────────────────────────────
function Stat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total?: number;
  tone: 'ok' | 'warn' | 'muted' | 'info';
}) {
  const colors = {
    ok:    { fg: '#86EFAC', bg: 'rgba(129, 140, 248, 0.10)', br: 'rgba(129, 140, 248, 0.40)' },
    warn:  { fg: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.10)',  br: 'rgba(239, 68, 68, 0.40)' },
    muted: { fg: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.08)', br: 'rgba(148,163,184,0.30)' },
    info:  { fg: '#93C5FD', bg: 'rgba(96, 165, 250, 0.12)', br: 'rgba(96, 165, 250, 0.50)' },
  }[tone];
  return (
    <div
      className="text-[10px] font-mono"
      style={{
        padding: '4px 10px',
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.br}`,
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <span
        className="tracking-[0.04em] opacity-70"
        style={{ marginRight: 8 }}
      >
        {label}
      </span>
      <span className="font-semibold">
        {value}
        {total != null ? ` / ${total}` : ''}
      </span>
    </div>
  );
}

function BulkBtn({
  onClick,
  tone,
  children,
  disabled,
  title,
}: {
  onClick: () => void;
  tone: 'home' | 'spill' | 'block' | 'muted' | 'danger';
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const colors = {
    home:   { fg: '#86EFAC', bg: 'rgba(129, 140, 248, 0.10)', br: 'rgba(129, 140, 248, 0.40)' },
    spill:  { fg: '#FCD34D', bg: 'rgba(252, 211, 77, 0.10)', br: 'rgba(252, 211, 77, 0.40)' },
    block:  { fg: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.10)',  br: 'rgba(239, 68, 68, 0.40)' },
    muted:  { fg: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.06)', br: 'rgba(148,163,184,0.25)' },
    danger: { fg: '#FCA5A5', bg: 'rgba(239, 68, 68, 0.06)',  br: 'rgba(239, 68, 68, 0.30)' },
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="tracking-[0.02em] transition-all"
      style={{
        padding: '4px 10px',
        fontSize: 10,
        color: disabled ? 'var(--text-muted)' : colors.fg,
        background: disabled ? 'rgba(148, 163, 184, 0.04)' : colors.bg,
        border: `1px solid ${disabled ? 'rgba(148, 163, 184, 0.15)' : colors.br}`,
        borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

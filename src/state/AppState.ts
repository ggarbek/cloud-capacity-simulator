import type {
  BomEntry,
  BufferSpec,
  EquivalencyEntry,
  FleetSpec,
  HardwareGroup,
  MemoryCategoryId,
  PackingMode,
  SimulatorResult,
  UserCpu,
  UserVm,
} from '../types';

export type Theme = 'light' | 'dark';

export interface UiState {
  sidebarWidth: number;
  rackMapHeight: number;
  /** Rack-tile zoom as a percentage. 100% = 32 px baseline, 200% = 64 px max. User-controlled via +/− chips in the rack banner. */
  rackTilePct: number;
  /** Width of the right-side stat/node detail panel in px. User-resizable via a left-edge ResizeHandle. */
  sidePanelWidth: number;
  /** Per-cluster collapse state keyed by fleet id. Missing key = open. */
  clusterCardsOpen: Record<string, boolean>;
  /** v2.20.1 — 'quickstart' is the fewest-clicks guided flow (server →
   *  where → demand → Build & run); the numbered tabs stay the deep path. */
  activeSidebarTab: 'quickstart' | 'configure' | 'fleet' | 'hardware' | 'vms' | 'fungibility';
  /** v2.21 — Advanced shell split: SETUP (the authoring surfaces, one at a
   *  time, routed by activeSidebarTab) vs RESULTS ('overview' = the
   *  five-answers dashboard; 'fleetmap' = rack visualization + Insights
   *  drill). Any UI_SET that targets an activeSidebarTab implicitly lands
   *  on 'setup' (see the reducer) so every existing "Open Fungibility tab"
   *  style deep link keeps working. RUN_COMPLETE lands on 'overview'.
   *  v2.23 — 'scenario' = the Scenario Analysis tab (what else could pack). */
  workspaceView: 'setup' | 'overview' | 'fleetmap' | 'scenario';
  /** v2.21 — Advanced nav rail collapsed to its 56px icon strip. */
  navCollapsed: boolean;
  /** @deprecated v2.11 — right pane is now a single Insights surface,
   *  no tabs. Field retained briefly for localStorage migration ease;
   *  remove in a later release. */
  activeRightPanelTab?: 'detail' | 'finance';
  fleetUsePreset: boolean;
  theme: Theme;
  /** v3 — Simple / Advanced two-track presentation. 'simple' lands the
   *  user on the five-questions Answers surface; 'advanced' is the full
   *  Configure → Visualize → Insights workspace. Both read the same state +
   *  engine. Persisted; defaults 'simple' (v3 S26 — first-time users land on
   *  answers, not configuration; existing users keep their saved choice via
   *  the localStorage ui merge). Only affects the Simulator page. */
  appMode: 'simple' | 'advanced';
  /** Configure-tab BOM filter: selected cloud provider. null = auto (first
   *  provider present in state.userVms). Filters the VM picker so only that
   *  provider's sizes show up in the autocomplete. */
  bomProvider: string | null;
  /** Configure-tab BOM filter: selected VM families (M / E / Eb / m7i / n2 …).
   *  Empty array = no family filter (show all families for the selected
   *  provider). Multi-select. */
  bomFamilies: string[];
  /** v2.17.2 — Configure-tab BOM filter: selected VM categories (General
   *  Purpose / Memory Optimized / GPU / …). Cascades to families: only
   *  families inside the selected categories show up in the Family pill row.
   *  Empty array = no category filter. Multi-select. */
  bomCategories: string[];
  /** Active region per provider — e.g. `{ Azure: "East US 2", AWS: "us-east-1" }`.
   *  Drives both the VMs-tab inventory view AND the BOM picker / engine
   *  catalog so the user sees one consistent set of rates at a time.
   *  Missing key = no region filter (show all regions for that provider, last
   *  one wins on name collisions). Auto-populated to the first region present
   *  per provider when a multi-region catalog is uploaded. */
  activeRegion: Record<string, string>;
  /** v2.7 — Workspace pane visibility. Both default to false (panes shown).
   *  At most one can be true at a time (the UI logic enforces it) — if both
   *  were collapsed there'd be nothing left to interact with. */
  sidebarCollapsed: boolean;
  canvasCollapsed: boolean;
  /** v2.7 — Hide the Detail / Finance pane to give the rack visualization
   *  the full canvas width. Toggled from the header alongside the other
   *  pane toggles. */
  detailPaneCollapsed: boolean;
  /** v2.8 — Top-level page nav. The app is now multi-page: the Simulator is
   *  page 1, Competitive Offering page 2, Capacity Planning page 3 (stub).
   *  Switched via the hamburger menu in AppHeader; persisted in localStorage. */
  activePage:
    | 'getting-started'
    | 'simulator'
    | 'competitive'
    | 'region-availability'
    | 'capacity-planning';
  /** v2.23.11 — Deep-link target for the Getting started page's Concepts
   *  view. A setup page's "Learn about X" link sets this + flips activePage
   *  to 'getting-started'; the page opens Concepts on that id, then clears
   *  it. Null = no pending target. */
  helpConcept?: string | null;
  /** v2.23.16 — User-set "healthy" gross-margin target (%), editable on the
   *  Overview's Financials. Drives the Profitability chart's healthy tick, its
   *  tone threshold, and the "Rev. to healthy" figure. Default 20; absent on
   *  older persisted profiles → falls back to HEALTHY_MARGIN_PCT. */
  marginTargetPct?: number;
  /** v2.26.1 — Opt-in: fill missing RI rates in the VM Catalog with an
   *  ESTIMATE (PAYG × the provider's measured median RI discount) when the
   *  cloud doesn't publish a real reserved rate. Off by default (no
   *  fabrication); estimates are badged "est." wherever shown. */
  estimateMissingRates?: boolean;
  /** v2.11 (Phase E) — Scope selection for the Insights pane. Clicking a
   *  region / zone / cluster banner in the rack map sets this; Insights
   *  filters its computations accordingly. `kind: 'fleet'` (or null) means
   *  "fleet-wide rollup, no scope filter." Region uses the region string as
   *  key, zone uses the zone string, cluster uses the cluster (fleet) id.
   *  Mutually exclusive with node + stat selection — picking a scope
   *  clears selectedNodeIds + selectedStat. */
  scope: ScopeSelection | null;
  /** v2.11 — Per-section collapse state inside Insights. Keys are stable
   *  section IDs. Missing = open (matches the FleetForm + Hardware library
   *  convention). */
  insightsSectionsOpen: Record<string, boolean>;
  /** v2.12 (Phase F) — Baseline VM for the Competitive Offering page.
   *  Set by the page's own picker, or by Insights' "Compete with this VM"
   *  deep-link (which also flips `activePage` to 'competitive'). Null =
   *  no baseline picked; page shows its empty-state hint. */
  competitiveBaseline: string | null;
  /** v2.17 — Pricing rate basis for Insights revenue + stranding rollups.
   *   - 'payg' (default): on-demand hourlyUsd.
   *   - 'ri1y':  1-year RI equivalent (`riOneYrHourlyUsd`).
   *   - 'ri3y':  3-year RI equivalent (`riThreeYrHourlyUsd`).
   *  Falls back to PAYG when the chosen rate isn't published on a SKU. */
  rateType: 'payg' | 'ri1y' | 'ri3y';
  /** v2.17 — Detail pane (Insights) tab. Splits the dense single-surface
   *  into VM details vs Financial details. */
  detailPaneTab: 'vm' | 'financial';
  /** v2.18 — Hardware Library edit signal. When non-null, HardwareTab opens
   *  the Server Builder in edit mode for this HW group id (auto-expands +
   *  scrolls + prefills). Used both internally (HardwareTab's ✎ card buttons)
   *  AND externally (FleetBuilder's ✎ Edit server in Library affordance on
   *  each HardwareGroupRow). Cleared via UI_SET { editingHwId: null } when
   *  the user saves or cancels. */
  editingHwId: string | null;
  /** v2.19.52 — Fungibility focus signal. When set to a `vmSizeName`,
   *  FungibilityTab auto-derives its category + family filters from the
   *  VM's taxonomy, scrolls the matching column into view, and clears the
   *  flag. Dispatched from BoM "rules missing" pills so a one-click flow
   *  takes the user from "this row is unauthored" → the exact matrix
   *  column where the cell should go. */
  fungibilityFocusVm: string | null;
  /** v2.19.32 — Fleet Builder edit signal. When non-null, FleetBuilder's
   *  Place Racks composer reads the fleet with this id, pre-fills its
   *  region/zone/server/racks fields with that fleet's specs, scrolls
   *  itself into view, then clears the field. Triggered by the ✎ button
   *  on a placed HardwareGroupRow so "edit cluster" lands in the right
   *  surface (Fleet Builder composer) instead of jumping to the Hardware
   *  Library. Place creates a NEW cluster — user is expected to remove
   *  the original via ✕ if they want a true replace. */
  pendingPlaceFromClusterId: string | null;
}

/** v2.11 — Scope selection variants. See UiState.scope. */
export type ScopeSelection =
  | { kind: 'region'; key: string }
  | { kind: 'zone'; key: string }
  | { kind: 'cluster'; key: string };

/** Rack-tile zoom expressed as a percentage. 100% maps to a 32 px tile. */
export const RACK_TILE_PCT_MIN = 100;
export const RACK_TILE_PCT_MAX = 200;
export const RACK_TILE_PCT_STEP = 5;
export const RACK_TILE_BASE_PX = 32;
export function rackTilePxFromPct(pct: number): number {
  return Math.round((RACK_TILE_BASE_PX * pct) / 100);
}

export const SIDE_PANEL_MIN = 280;
export const SIDE_PANEL_MAX = 720;

export interface BomSectionState {
  open: boolean;
}

// v2.17 — strandedMem / strandedVcpu / memoryUtil stat IDs removed along
// with their summary cards; insights pane now owns those metrics.
export type StatId =
  | 'nodesUsed'
  | 'emptyNodes'
  | 'vmsPlaced'
  | 'unplaceable';

export interface AppState {
  bom: BomEntry[];
  bomSections: Partial<Record<MemoryCategoryId, BomSectionState>>;
  /**
   * v2.0 multi-hardware: fleets keyed by stable opaque ID (e.g. "f-1").
   * Insertion order = render order. Use primaryFleet() for the singular
   * back-compat read path.
   */
  fleets: Record<string, FleetSpec>;
  fleetOrder: string[];
  /** v2.18 — Legacy global Buffer/Overhead. Buffer is now authored per
   *  HardwareGroup (HardwareGroup.buffer) and resolved live via
   *  effectiveBuffer() / bufferFor(). This field remains as the **slot-3
   *  fallback constant** used only when a fleet's HW group has been deleted
   *  from the library —
   *  It is no longer mutable from the UI (BUFFER_SET action removed). */
  buffer: BufferSpec;
  packingMode: PackingMode;
  fungibilityOn: boolean;
  result: SimulatorResult | null;
  selectedNodeIds: string[];
  selectedStat: StatId | null;
  isRunning: boolean;
  isStale: boolean;
  ui: UiState;

  /** User-uploaded hardware catalog (v2.0 decoupling). Empty by default; users
   *  populate via the Hardware tab's Excel upload. Configure tab dropdowns
   *  read from here, not from any baked-in JSON. */
  userHardware: HardwareGroup[];
  userCpus: UserCpu[];

  /**
   * User-authored fungibility matrix (v2.4) — keyed [vmClass][hwGroupId].
   * Cells:
   *   number   → priority (0 = Home, 1..5 = Spillover order)
   *   'blocked' → engine refuses placement
   *   missing  → NOT_AUTHORED (engine refuses when matrix is non-empty; skips
   *              fungibility entirely when matrix is empty so the
   *              GCP-dedicated-host case "just works")
   *
   * This is the COMMITTED snapshot — the Fungibility tab keeps a separate
   * draft that's promoted here via FUNGIBILITY_REPLACE on the user's Submit.
   * Engine + RunFooter read directly from this slot.
   */
  userFungibility: Record<string, Record<string, number | 'blocked'>>;
  /** User-uploaded VM catalog (v2.1 decoupling — see public/vm-template.xlsx).
   *  Empty by default; users populate via the VM tab's Excel upload. BOM
   *  dropdown, engine, and detail panels all read from here. */
  userVms: UserVm[];
  /**
   * v2.12 (Phase F) — Cross-provider VM equivalency rows. Each entry
   * maps an Azure SKU to its AWS + GCP analogs (any field optional).
   * Authored via the Equivalency tab's Excel template + a public seed of
   * widely-accepted cross-cloud mappings. The Competitive Offering page
   * reads this to drive its side-by-side equivalents table; the BOM's
   * "Compete with this VM" deep-link uses it for the per-VM compare view.
   */
  userEquivalency: EquivalencyEntry[];

  /**
   * v2.18 — Fleet Builder structural model. The user authors their target
   * regions and zones FIRST, then assigns clusters into them via the new
   * Fleet Builder composer. This separates structural intent (where do I
   * want capacity?) from placement (what hardware goes there, how much).
   * Each entry is a region the user has declared, with the up-to-4 zones
   * they care about under it. Empty array = nothing authored yet.
   */
  fleetRegions: FleetRegion[];
}

/** v2.18 — A user-authored region with its child zones. Zones are stored as
 *  free-form strings constrained to the ZONES universe (Zone 1..4) for now. */
export interface FleetRegion {
  region: string;
  zones: string[];
}

// ────────────────────────────────────────────────────────────────────────
// Fleet selectors (back-compat for single-fleet callsites)
// ────────────────────────────────────────────────────────────────────────
export function primaryFleetId(state: Pick<AppState, 'fleetOrder'>): string {
  return state.fleetOrder[0];
}
export function primaryFleet(state: Pick<AppState, 'fleets' | 'fleetOrder'>): FleetSpec {
  return state.fleets[state.fleetOrder[0]];
}
export function fleetList(
  state: Pick<AppState, 'fleets' | 'fleetOrder'>,
): Array<{ id: string; fleet: FleetSpec }> {
  return state.fleetOrder.map((id) => ({ id, fleet: state.fleets[id] }));
}
/**
 * Append " (copy)" / " (copy 2)" / " (copy 3)" / … to `base` until the result
 * is not in `used`. Used by HARDWARE_DUPLICATE / CPU_DUPLICATE to enforce
 * unique names without forcing the user to type a name on every clone.
 */
export function uniqueSuffixed(base: string, used: Set<string>): string {
  // If the base itself isn't taken (rare; happens when undo restored a stub
  // and the source was deleted), return it as-is.
  if (!used.has(base)) return base;
  const candidate = `${base} (copy)`;
  if (!used.has(candidate)) return candidate;
  for (let n = 2; n < 1000; n++) {
    const tag = `${base} (copy ${n})`;
    if (!used.has(tag)) return tag;
  }
  // Pathological fallback — extremely unlikely (1000 dupes of the same name).
  return `${base} (copy ${Date.now()})`;
}

function nextFleetId(order: string[]): string {
  const used = new Set(order);
  for (let n = 1; ; n++) {
    const id = `f-${n}`;
    if (!used.has(id)) return id;
  }
}

// Default fleet: blank/unconfigured. Per v2.0 hardware decoupling, the tool ships
// with no baked-in hardware; the user must upload the Excel template in the
// Hardware tab before a meaningful fleet can be configured. Pre-upload, the
// Configure tab shows empty-state guidance pointing at the Hardware tab.
export const defaultFleet: FleetSpec = {
  hardwareGroupName: '',
  memoryCategory: 'mm',
  rackCount: 0,
  nodesPerRack: 0,
  socketsPerNode: 0,
  coresPerSocket: 0,
  hyperthreadingEnabled: true,
  memoryGibPerNode: 0,
  throughputCeilingMbps: null,
  isolated: false,
  processor: '',
};

export const defaultBuffer: BufferSpec = { mode: 'pct', value: 12 };

export const defaultUi: UiState = {
  sidebarWidth: 380,
  rackMapHeight: 480,
  rackTilePct: 100,
  sidePanelWidth: 340,
  clusterCardsOpen: {},
  // v2.20.1 — New users land on the guided Quick start flow (fewest
  // clicks to a result). The numbered deep tabs (Hardware = step 1 …)
  // stay one click away; returning users keep their persisted tab.
  activeSidebarTab: 'quickstart',
  // v2.21 — Advanced opens on Setup (Quick start) until the first run;
  // RUN_COMPLETE flips the shell to the Results overview.
  workspaceView: 'setup',
  navCollapsed: false,
  // v2.11 — activeRightPanelTab deprecated; right pane is now Insights.
  fleetUsePreset: true,
  theme: 'dark',
  // v2.22.4 — Simple/Advanced toggle retired; the single Advanced workspace
  // is the only view. `appMode` is now inert (kept so persisted snapshots +
  // the metric-family helpers still type-check).
  appMode: 'advanced',
  bomProvider: null,
  bomFamilies: [],
  bomCategories: [],
  activeRegion: {},
  sidebarCollapsed: false,
  canvasCollapsed: false,
  detailPaneCollapsed: false,
  activePage: 'simulator',
  helpConcept: null,
  marginTargetPct: 20,
  estimateMissingRates: false,
  scope: null,
  insightsSectionsOpen: {},
  competitiveBaseline: null,
  rateType: 'payg',
  detailPaneTab: 'vm',
  editingHwId: null,
  pendingPlaceFromClusterId: null,
  fungibilityFocusVm: null,
};

export const DEFAULT_FLEET_ID = 'f-1';

export const initialState: AppState = {
  bom: [],
  bomSections: {},
  fleets: { [DEFAULT_FLEET_ID]: defaultFleet },
  fleetOrder: [DEFAULT_FLEET_ID],
  buffer: defaultBuffer,
  packingMode: 'SMART',
  fungibilityOn: true,
  result: null,
  selectedNodeIds: [],
  selectedStat: null,
  isRunning: false,
  isStale: false,
  ui: defaultUi,
  userHardware: [],
  userCpus: [],
  userVms: [],
  userFungibility: {},
  userEquivalency: [],
  fleetRegions: [],
};

// ────────────────────────────────────────────────────────────────────────
// Reducer
// ────────────────────────────────────────────────────────────────────────
export type Action =
  | { type: 'BOM_SET'; bom: BomEntry[] }
  | { type: 'BOM_ADD'; entry: BomEntry }
  | { type: 'BOM_UPDATE'; index: number; entry: Partial<BomEntry> }
  | { type: 'BOM_REMOVE'; index: number }
  | { type: 'BOM_SECTION_ADD'; category: MemoryCategoryId }
  | { type: 'BOM_SECTION_REMOVE'; category: MemoryCategoryId }
  | { type: 'BOM_SECTION_TOGGLE'; category: MemoryCategoryId }
  | { type: 'FLEET_SET'; fleet: Partial<FleetSpec>; fleetId?: string }
  | { type: 'FLEET_ADD'; fleet?: FleetSpec; id?: string }
  | { type: 'FLEET_REMOVE'; id: string }
  /** v2.19.50+ — Mass-delete every placed cluster in one shot. Used by the
   *  Fleet Builder "✕ Clear all" affordance on the Placed Clusters section.
   *  Leaves `fleetRegions` (authored regions/zones) and `userHardware`
   *  (Hardware Library) untouched — only clears the placements. Undo is
   *  via the 5 s toast pattern in FleetBuilder; no global Cmd/Z stack. */
  | { type: 'FLEET_REMOVE_ALL' }
  /** v2.19.50+ — Restore a snapshot of placed clusters in one atomic step.
   *  Used by the Fleet Builder "✕ Clear all" 5 s undo toast to revert the
   *  mass-delete. Replaces fleets + fleetOrder together so order is preserved
   *  exactly. */
  | { type: 'FLEET_RESTORE_ALL'; fleets: Record<string, FleetSpec>; fleetOrder: string[] }
  | { type: 'FLEET_RENAME'; id: string; hardwareGroupName: string }
  /** v2.6 — Bulk retag a set of fleets. Used by the Fleet Composition
   *  Region/Zone header inline-edit so a one-click retag updates every
   *  cluster currently in that bucket. `next` carries the new values; `null`
   *  in a field means CLEAR (untag). Omitting a field leaves it alone. */
  | { type: 'FLEET_BULK_RETAG'; fleetIds: string[]; next: { region?: string | null; zone?: string | null } }
  | { type: 'CLUSTER_CARD_TOGGLE'; id: string }
  // v2.18 — BUFFER_SET removed. Buffer is per-HW-group now (see
  // HardwareGroup.buffer +. `state.buffer`
  // remains in state as a slot-3 fallback constant for clusters whose HW group
  // has been deleted; it is no longer mutable from the UI.
  | { type: 'PACKING_MODE_SET'; mode: PackingMode }
  | { type: 'FUNGIBILITY_SET'; on: boolean }
  | { type: 'RUN_START' }
  | { type: 'RUN_COMPLETE'; result: SimulatorResult }
  | { type: 'NODE_SELECT'; ids: string[] }
  | { type: 'NODE_TOGGLE'; id: string; multi: boolean }
  | { type: 'NODE_CLEAR' }
  | { type: 'STAT_SELECT'; stat: StatId | null }
  /** v2.11 — Scope selection from region/zone/cluster banner clicks in the
   *  rack map. Mutually exclusive with node + stat selection (handled in
   *  the reducer). Null clears scope back to fleet-wide rollup. */
  | { type: 'SCOPE_SET'; scope: ScopeSelection | null }
  | { type: 'MARK_STALE' }
  | { type: 'UI_SET'; ui: Partial<UiState> }
  | { type: 'HARDWARE_REPLACE'; groups: HardwareGroup[]; cpus: UserCpu[] }
  | { type: 'HARDWARE_SET_ALL'; groups: HardwareGroup[] }
  | { type: 'HARDWARE_DELETE'; id: string }
  | { type: 'HARDWARE_RESTORE'; group: HardwareGroup; atIndex?: number }
  /** Inline edit — replace the group with matching `id`. Identifier change
   *  allowed (renames are handled here, not as a delete + add). Reducer
   *  enforces uniqueness on both id and name; conflicts produce a no-op. */
  | { type: 'HARDWARE_UPDATE'; id: string; next: HardwareGroup }
  /** Duplicate — clone the group with matching `id`, generate a unique
   *  name + id ("(copy)" / "(copy 2)" / …), insert directly below source. */
  | { type: 'HARDWARE_DUPLICATE'; id: string }
  | { type: 'CPU_SET_ALL'; cpus: UserCpu[] }
  | { type: 'CPU_DELETE'; name: string }
  | { type: 'CPU_RESTORE'; cpu: UserCpu; atIndex?: number }
  /** Inline edit — replace the CPU whose CURRENT name matches `prevName`
   *  with `next`. Rename allowed. Reducer enforces uniqueness on name. */
  | { type: 'CPU_UPDATE'; prevName: string; next: UserCpu }
  /** Duplicate — clone CPU with " (copy)" / " (copy 2)" / … suffix, insert
   *  directly below source. */
  | { type: 'CPU_DUPLICATE'; name: string }
  | { type: 'VM_REPLACE'; vms: UserVm[]; silent?: boolean }
  | { type: 'VM_DELETE'; vmSizeName: string; region?: string }
  | { type: 'VM_RESTORE'; vm: UserVm; atIndex?: number }
  | { type: 'FUNGIBILITY_REPLACE'; matrix: Record<string, Record<string, number | 'blocked'>> }
  | { type: 'EQUIVALENCY_REPLACE'; entries: EquivalencyEntry[] }
  /** v2.18 — Fleet Builder structural authoring. The user declares regions
   *  and zones FIRST, then assigns clusters into them via FLEET_ADD. These
   *  actions are pure structural CRUD; they do not touch state.fleets. */
  | { type: 'FLEET_REGION_ADD'; region: string }
  | { type: 'FLEET_REGION_REMOVE'; region: string }
  | { type: 'FLEET_REGION_ZONE_ADD'; region: string; zone: string }
  | { type: 'FLEET_REGION_ZONE_REMOVE'; region: string; zone: string }
  | { type: 'HYDRATE'; state: Partial<AppState> };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'BOM_SET':
      return { ...state, bom: action.bom, isStale: true };
    case 'BOM_ADD':
      return { ...state, bom: [...state.bom, action.entry], isStale: true };
    case 'BOM_UPDATE': {
      const bom = state.bom.map((b, i) => (i === action.index ? { ...b, ...action.entry } : b));
      return { ...state, bom, isStale: true };
    }
    case 'BOM_REMOVE':
      return {
        ...state,
        bom: state.bom.filter((_, i) => i !== action.index),
        isStale: true,
      };
    case 'BOM_SECTION_ADD':
      if (state.bomSections[action.category]) return state;
      return {
        ...state,
        bomSections: { ...state.bomSections, [action.category]: { open: true } },
      };
    case 'BOM_SECTION_REMOVE': {
      const next = { ...state.bomSections };
      delete next[action.category];
      return { ...state, bomSections: next };
    }
    case 'BOM_SECTION_TOGGLE': {
      const existing = state.bomSections[action.category];
      if (!existing) return state;
      return {
        ...state,
        bomSections: {
          ...state.bomSections,
          [action.category]: { open: !existing.open },
        },
      };
    }
    case 'FLEET_SET': {
      const targetId = action.fleetId ?? state.fleetOrder[0];
      const existing = state.fleets[targetId];
      if (!existing) return state;
      return {
        ...state,
        fleets: { ...state.fleets, [targetId]: { ...existing, ...action.fleet } },
        isStale: true,
      };
    }
    case 'FLEET_ADD': {
      const id = action.id ?? nextFleetId(state.fleetOrder);
      if (state.fleets[id]) return state;
      const fleet = action.fleet ?? { ...defaultFleet };
      return {
        ...state,
        fleets: { ...state.fleets, [id]: fleet },
        fleetOrder: [...state.fleetOrder, id],
        isStale: true,
      };
    }
    case 'FLEET_REMOVE_ALL': {
      // v2.19.50+ — Mass-delete every placed cluster. Strictly clears the
      // fleets map + fleetOrder; `fleetRegions` (authored regions/zones) and
      // `userHardware` (Hardware Library) stay intact so the user can refill
      // placements without re-authoring structure or re-uploading hardware.
      // Idempotent when already empty.
      if (state.fleetOrder.length === 0) return state;
      return {
        ...state,
        fleets: {},
        fleetOrder: [],
        isStale: true,
      };
    }
    case 'FLEET_RESTORE_ALL': {
      // v2.19.50+ — Undo handler for FLEET_REMOVE_ALL. Replaces the entire
      // fleets/fleetOrder pair atomically so the pre-clear order is preserved.
      return {
        ...state,
        fleets: action.fleets,
        fleetOrder: action.fleetOrder,
        isStale: true,
      };
    }
    case 'FLEET_REMOVE': {
      // v2.17.20 — Removed the "always keep at least one" guard so users
      // can fully empty the fleet composition. With the manual `+ Add Server`
      // flow + the existing "+ Add Hardware" picker, an empty start state is
      // a legitimate UX — the user explicitly adds fleets when they want
      // them. The old guard left a phantom (UNCONFIGURED) cluster behind
      // and made the × region/zone delete buttons feel broken.
      if (!state.fleets[action.id]) return state;
      const { [action.id]: _removed, ...remaining } = state.fleets;
      return {
        ...state,
        fleets: remaining,
        fleetOrder: state.fleetOrder.filter((x) => x !== action.id),
        isStale: true,
      };
    }
    case 'CLUSTER_CARD_TOGGLE': {
      const prev = state.ui.clusterCardsOpen[action.id];
      // Missing key = currently open; first toggle should close it.
      const nextOpen = prev === undefined ? false : !prev;
      return {
        ...state,
        ui: {
          ...state.ui,
          clusterCardsOpen: { ...state.ui.clusterCardsOpen, [action.id]: nextOpen },
        },
      };
    }
    case 'FLEET_BULK_RETAG': {
      const ids = new Set(action.fleetIds);
      const fleets = { ...state.fleets };
      let touched = false;
      for (const id of state.fleetOrder) {
        if (!ids.has(id)) continue;
        const f = fleets[id];
        if (!f) continue;
        const updated = { ...f };
        if ('region' in action.next) {
          updated.region = action.next.region === null ? undefined : action.next.region;
        }
        if ('zone' in action.next) {
          updated.zone = action.next.zone === null ? undefined : action.next.zone;
        }
        fleets[id] = updated;
        touched = true;
      }
      if (!touched) return state;
      return { ...state, fleets, isStale: true };
    }
    case 'FLEET_RENAME': {
      const f = state.fleets[action.id];
      if (!f) return state;
      return {
        ...state,
        fleets: {
          ...state.fleets,
          [action.id]: { ...f, hardwareGroupName: action.hardwareGroupName },
        },
        isStale: true,
      };
    }
    // BUFFER_SET reducer case removed v2.18 — see action union comment above.
    case 'PACKING_MODE_SET':
      return { ...state, packingMode: action.mode, isStale: true };
    case 'FUNGIBILITY_SET':
      return { ...state, fungibilityOn: action.on, isStale: true };
    case 'RUN_START':
      return { ...state, isRunning: true };
    case 'RUN_COMPLETE':
      // v2.21 — A finished run lands the Advanced shell on the Results
      // overview: the run IS the payoff, so the shell navigates to it.
      return {
        ...state,
        isRunning: false,
        isStale: false,
        result: action.result,
        ui: { ...state.ui, workspaceView: 'overview' },
      };
    case 'NODE_SELECT': {
      // Selecting nodes clears stat selection + region/zone/cluster scope
      // (mutually exclusive). Auto-opens the detail pane so the user sees
      // the drill-down without an extra click.
      const opens = action.ids.length > 0 && state.ui.detailPaneCollapsed;
      const clearScope = action.ids.length > 0;
      return {
        ...state,
        selectedNodeIds: action.ids,
        selectedStat: null,
        ui: {
          ...state.ui,
          ...(opens ? { detailPaneCollapsed: false } : {}),
          ...(clearScope ? { scope: null } : {}),
        },
      };
    }
    case 'NODE_TOGGLE': {
      const { id, multi } = action;
      const has = state.selectedNodeIds.includes(id);
      let next: string[];
      if (multi) {
        next = has
          ? state.selectedNodeIds.filter((x) => x !== id)
          : [...state.selectedNodeIds, id];
      } else {
        next = has && state.selectedNodeIds.length === 1 ? [] : [id];
      }
      const opens = next.length > 0 && state.ui.detailPaneCollapsed;
      const clearScope = next.length > 0;
      return {
        ...state,
        selectedNodeIds: next,
        selectedStat: null,
        ui: {
          ...state.ui,
          ...(opens ? { detailPaneCollapsed: false } : {}),
          ...(clearScope ? { scope: null } : {}),
        },
      };
    }
    case 'NODE_CLEAR':
      return { ...state, selectedNodeIds: [] };
    case 'STAT_SELECT':
      return {
        ...state,
        selectedStat: action.stat,
        // Clicking a stat clears any locked node selection
        selectedNodeIds: action.stat ? [] : state.selectedNodeIds,
        // v2.11 — Mutual exclusivity: stat selection clears scope.
        // v2.17 — Stat selection also auto-opens the detail pane.
        ui: action.stat
          ? { ...state.ui, scope: null, detailPaneCollapsed: false }
          : state.ui,
      };
    case 'SCOPE_SET':
      // Scope selection clears node + stat selection (mutually exclusive).
      return {
        ...state,
        selectedNodeIds: action.scope ? [] : state.selectedNodeIds,
        selectedStat: action.scope ? null : state.selectedStat,
        ui: action.scope
          ? { ...state.ui, scope: action.scope, detailPaneCollapsed: false }
          : { ...state.ui, scope: action.scope },
      };
    case 'MARK_STALE':
      return { ...state, isStale: true };
    case 'UI_SET':
      // v2.21 — Deep links that target a setup tab ("Open Fungibility tab",
      // edit-in-Library jumps, BoM rule pills …) implicitly navigate the
      // Advanced shell to the Setup workspace. Callers that pass an explicit
      // workspaceView keep full control.
      return {
        ...state,
        ui: {
          ...state.ui,
          ...(action.ui.activeSidebarTab !== undefined &&
          action.ui.workspaceView === undefined
            ? { workspaceView: 'setup' as const }
            : {}),
          ...action.ui,
        },
      };
    case 'HARDWARE_REPLACE':
      // Wholesale replace — the Excel file IS the catalog. Existing fleets
      // keep their cached FleetSpec values; if the user-selected hardware
      // group name no longer matches any uploaded group, the dropdown shows
      // it as "(no longer in catalog)" and the user can re-select.
      return {
        ...state,
        userHardware: action.groups,
        userCpus: action.cpus,
        isStale: true,
      };
    case 'HARDWARE_SET_ALL':
      // Wholesale replace of just the hardware-group list (Clear/restore for
      // the Clear button). Leaves userCpus untouched.
      return { ...state, userHardware: action.groups, isStale: true };
    case 'CPU_SET_ALL':
      return { ...state, userCpus: action.cpus };
    case 'HARDWARE_DELETE':
      return {
        ...state,
        userHardware: state.userHardware.filter((g) => g.id !== action.id),
        isStale: true,
      };
    case 'HARDWARE_RESTORE': {
      // Undo path: re-insert at original index when known, else append.
      const next = [...state.userHardware];
      const idx = action.atIndex ?? next.length;
      next.splice(Math.min(idx, next.length), 0, action.group);
      return { ...state, userHardware: next, isStale: true };
    }
    case 'CPU_DELETE':
      return {
        ...state,
        userCpus: state.userCpus.filter((c) => c.name !== action.name),
      };
    case 'CPU_RESTORE': {
      const next = [...state.userCpus];
      const idx = action.atIndex ?? next.length;
      next.splice(Math.min(idx, next.length), 0, action.cpu);
      return { ...state, userCpus: next };
    }
    case 'HARDWARE_UPDATE': {
      // Replace the group whose CURRENT id matches `action.id` with
      // `action.next`. Rename allowed (id + name can change). Reject the
      // edit silently (no-op) if it would collide with a different group's
      // id or name — UI should validate before dispatching, this is just
      // belt-and-braces.
      const sourceIdx = state.userHardware.findIndex((g) => g.id === action.id);
      if (sourceIdx < 0) return state;
      const conflict = state.userHardware.some(
        (g, i) =>
          i !== sourceIdx && (g.id === action.next.id || g.name === action.next.name),
      );
      if (conflict) return state;
      const nextList = state.userHardware.slice();
      nextList[sourceIdx] = action.next;
      return { ...state, userHardware: nextList, isStale: true };
    }
    case 'HARDWARE_DUPLICATE': {
      const sourceIdx = state.userHardware.findIndex((g) => g.id === action.id);
      if (sourceIdx < 0) return state;
      const source = state.userHardware[sourceIdx];
      const usedIds = new Set(state.userHardware.map((g) => g.id));
      const usedNames = new Set(state.userHardware.map((g) => g.name));
      const newId = uniqueSuffixed(source.id, usedIds);
      const newName = uniqueSuffixed(source.name, usedNames);
      const clone: HardwareGroup = { ...source, id: newId, name: newName };
      const nextList = state.userHardware.slice();
      nextList.splice(sourceIdx + 1, 0, clone);
      return { ...state, userHardware: nextList, isStale: true };
    }
    case 'CPU_UPDATE': {
      const sourceIdx = state.userCpus.findIndex((c) => c.name === action.prevName);
      if (sourceIdx < 0) return state;
      const conflict = state.userCpus.some(
        (c, i) => i !== sourceIdx && c.name === action.next.name,
      );
      if (conflict) return state;
      const nextList = state.userCpus.slice();
      nextList[sourceIdx] = action.next;
      return { ...state, userCpus: nextList };
    }
    case 'CPU_DUPLICATE': {
      const sourceIdx = state.userCpus.findIndex((c) => c.name === action.name);
      if (sourceIdx < 0) return state;
      const source = state.userCpus[sourceIdx];
      const usedNames = new Set(state.userCpus.map((c) => c.name));
      const newName = uniqueSuffixed(source.name, usedNames);
      const clone: UserCpu = { ...source, name: newName };
      const nextList = state.userCpus.slice();
      nextList.splice(sourceIdx + 1, 0, clone);
      return { ...state, userCpus: nextList };
    }
    case 'VM_REPLACE': {
      // Wholesale replace — the Excel file IS the VM catalog. Any BOM entries
      // that reference a now-missing vmSizeName are surfaced in BomSection's
      // "not in catalog" warning, same as the existing unknown-VM path.
      // Auto-pick a region per provider so the user immediately sees one
      // coherent set of rates instead of an arbitrary mix. Existing
      // user-selected regions are preserved.
      const next: Record<string, string> = { ...state.ui.activeRegion };
      const seen = new Set<string>();
      for (const v of action.vms) {
        const p = v.provider || 'Other';
        const r = v.region || '';
        if (!r || seen.has(p)) continue;
        seen.add(p);
        if (!next[p]) next[p] = r;
      }
      return {
        ...state,
        userVms: action.vms,
        ui: { ...state.ui, activeRegion: next },
        // v2.25.5 — the boot-time live-catalog swap passes `silent` so it
        // doesn't flag a persisted result stale just for refreshing rates.
        isStale: action.silent ? state.isStale : true,
      };
    }
    case 'VM_DELETE':
      // VM_DELETE keys on (vmSizeName, region) so the same SKU in a different
      // region is left alone. Region defaults to empty string for templates
      // that didn't fill in the column.
      return {
        ...state,
        userVms: state.userVms.filter(
          (v) =>
            !(
              v.vmSizeName === action.vmSizeName &&
              (v.region ?? '') === (action.region ?? '')
            ),
        ),
        isStale: true,
      };
    case 'FUNGIBILITY_REPLACE':
      // Whole-matrix swap — the Fungibility tab promotes its local draft via
      // this action on Submit. Marks isStale so the next Run Simulation
      // recomputes against the new routing rules.
      return { ...state, userFungibility: action.matrix, isStale: true };
    case 'EQUIVALENCY_REPLACE':
      // v2.12 — Whole-list swap from the Equivalency tab's Excel upload.
      // The Competitive Offering page renders off this list; no simulation
      // is affected (cross-cloud compare is read-only), so we don't mark
      // isStale.
      return { ...state, userEquivalency: action.entries };
    case 'VM_RESTORE': {
      const next = [...state.userVms];
      const idx = action.atIndex ?? next.length;
      next.splice(Math.min(idx, next.length), 0, action.vm);
      return { ...state, userVms: next, isStale: true };
    }
    case 'FLEET_REGION_ADD': {
      const region = action.region.trim();
      if (!region) return state;
      if (state.fleetRegions.some((r) => r.region === region)) return state;
      return {
        ...state,
        fleetRegions: [...state.fleetRegions, { region, zones: [] }],
      };
    }
    case 'FLEET_REGION_REMOVE': {
      const region = action.region;
      const next = state.fleetRegions.filter((r) => r.region !== region);
      if (next.length === state.fleetRegions.length) return state;
      return { ...state, fleetRegions: next };
    }
    case 'FLEET_REGION_ZONE_ADD': {
      const zone = action.zone.trim();
      if (!zone) return state;
      const next = state.fleetRegions.map((r) =>
        r.region === action.region && !r.zones.includes(zone)
          ? { ...r, zones: [...r.zones, zone] }
          : r,
      );
      return { ...state, fleetRegions: next };
    }
    case 'FLEET_REGION_ZONE_REMOVE': {
      const next = state.fleetRegions.map((r) =>
        r.region === action.region
          ? { ...r, zones: r.zones.filter((z) => z !== action.zone) }
          : r,
      );
      return { ...state, fleetRegions: next };
    }
    case 'HYDRATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

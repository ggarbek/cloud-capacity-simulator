// PRD v4.0 core type definitions.

export type MemoryCategoryId = 'mm' | 'hm' | 'vhm';

/** v2.17 — Canonical VM categories shared across Azure / AWS / GCP. */
export type VmCategory =
  | 'General Purpose'
  | 'Compute Optimized'
  | 'Memory Optimized'
  | 'Storage Optimized'
  | 'GPU'
  | 'High Performance Computing'
  | 'Previous Generation'
  | 'Confidential'
  | 'Custom';

/** Ordered list of categories — drives picker UIs that mirror Azure's
 *  pricing-page filter (with AWS's "Previous Generation" appended). */
export const VM_CATEGORIES: readonly VmCategory[] = [
  'General Purpose',
  'Compute Optimized',
  'Memory Optimized',
  'Storage Optimized',
  'GPU',
  'High Performance Computing',
  'Previous Generation',
  'Confidential',
  'Custom',
] as const;
/** Free-form generation/family-version label. Conventionally "Mv1"/"Mv2"/"Mv3" for
 *  Azure M-series, but any string is accepted so AWS / GCP / custom families can
 *  group correctly in the BOM dropdown. */
export type VmGeneration = string;
/** Cloud provider tag on a UserVm. Free-form so additional providers (Oracle,
 *  IBM, on-prem) can be slotted in without a schema change. */
export type VmProvider = string;

// ────────────────────────────────────────────────────────────────────────
// User-uploaded hardware data (v2.0 decoupling — see public/hardware-template.xlsx).
// The tool ships with no built-in hardware; users upload the Excel template
// to populate these. Persisted to localStorage under vmcap:userHardware / vmcap:userCpus.
// ────────────────────────────────────────────────────────────────────────
export interface HardwareGroup {
  id: string;
  name: string;
  /** Cloud provider tag — "Azure" / "AWS" / "GCP" / "Custom" / free-form.
   *  Populated from the uploaded HW template's "Cloud Provider" column.
   *  Drives the Fungibility tab's cross-provider filter linkage: picking
   *  "Azure" in the Cloud Provider chip narrows BOTH the HW chips AND the
   *  VM Family chips to Azure-tagged content. Undefined = legacy upload
   *  without the column → HW shows under every provider. */
  provider?: string;
  /** Auto-derived from memoryGibPerNode using MM/HM/VHM ranges in memoryCategories.json. */
  memoryCategory: MemoryCategoryId;
  memoryGibPerNode: number;
  socketsPerNode: number;
  vcpusPerNode: number | null;
  coresPerSocket: number | null;
  nodesPerRack: number | null;
  processor: string;
  /** Heterogeneous racks: per-position memory pattern (e.g. Gen-B HM-Mixed).
   *  Up to 4 distinct slots per group (UI cap; engine handles any length).
   *  Each slot can optionally be marked as a `utility` node — utility
   *  nodes don't take VM workload (control-plane / management hosts) and
   *  are excluded from the deployable pool.
   *  v2.17.23 — slots can OPTIONALLY override per-node CPU / network /
   *  storage too. When a slot leaves a field undefined the engine falls
   *  back to the group-level value, so the common "all nodes same CPU,
   *  only memory varies" case stays terse. Real-world need: a rack with
   *  a small utility node on 25Gbps + big compute nodes on 100Gbps. */
  rackComposition?: RackSlot[];
  homeFor: VmGeneration[];
  spilloverFrom: VmGeneration[];
  isolated: boolean;
  notes?: string;
  // ── v2.5 financial schema on HardwareGroup (read by the parser; mirrored
  //    onto FleetSpec by FleetForm.applyGroup). All optional. ───────────
  /** Approximate capex per node (USD). Wins over `costPerRackUsd` when both
   *  set; otherwise derived as `costPerRackUsd / nodesPerRack` at usage time. */
  costPerNodeUsd?: number;
  /** Approximate capex per rack (USD). Fallback when per-node is blank. */
  costPerRackUsd?: number;
  /** Usable life in months — straight-line depreciation horizon. Defaults to
   *  60 (5 years) at read time when blank. */
  usableLifeMonths?: number;
  /** Recurring operating cost per node per MONTH (USD) — power, cooling,
   *  space, bandwidth, support. A real CASH cost, distinct from the non-cash
   *  straight-line depreciation of capex. When set it's added to the monthly
   *  cost so gross margin and payback reflect operating expense, not just
   *  hardware depreciation. Optional; absent = 0 opex (depreciation-only). */
  opexPerNodeMonthlyUsd?: number;
  /** v2.6 — Availability zone label this hardware sits in. Constrained to
   *  the `ZONES` universe (Zone 1..4) — set via dropdown. Drives the zonal
   *  allocator path in `runMulti` and the Zone level of the Region → Zone →
   *  Hardware → Cluster grouping in viz. Empty / undefined = unzoned. */
  zone?: string;
  /** v2.6 — Cloud region this hardware sits in. Free-form per Decoupling
   *  Doctrine (real cloud has hundreds of regions, can't enumerate). Drives
   *  the Region level of the Region → Zone → Hardware → Cluster grouping in
   *  the composition + rack viz. Empty / undefined = no region tag. */
  region?: string;
  // ── v2.9 (Phase B) — network as a 3rd packing constraint ──────────────
  /** Max network bandwidth per node in Mbps. Engine treats this as a hard
   *  packing constraint alongside memory and vCPU: a VM consumes its
   *  `networkMbps`, the node has this much to give. Optional for back-compat;
   *  when absent the engine skips the network constraint for nodes from this
   *  HW group (pre-v2.9 behavior). Example: an Azure M832 host = 100,000 Mbps. */
  networkMbpsPerNode?: number;
  /** Max NICs available per node. Metadata-only — informs the user but doesn't
   *  affect packing. Surfaced in the Hardware Library card. */
  networkNicCount?: number;
  /** Per-node Premium SSD storage throughput cap in MB/s (bytes — not bits).
   *  Engine treats this as the 4th hard packing constraint alongside memory /
   *  vCPU / network: a VM consumes its `remoteStorageMbpsPremium`, the node
   *  has this much aggregate to give. Optional for back-compat; absent =
   *  storage constraint skipped for this HW group (pre-v2.17 behavior). */
  storageThroughputMbpsPerNode?: number;
  /** Per-node LOCAL (temp / NVMe) storage throughput cap in MB/s. Spec field
   *  only — not used by the engine today (capacity planning + spec sheet).
   *  Distinct from `storageThroughputMbpsPerNode` which is remote SSD. */
  localStorageThroughputMbpsPerNode?: number;
  // v2.19 — `buffer` REMOVED from HardwareGroup. Buffer is now per-cluster
  // (FleetSpec.bufferDefault + bufferByMemGib) because rack-planning sizing
  // requires knowing the cluster shape (rack count × non-utility node count).
  // Library entries are pure templates; deployment-time concerns live in
  // the Fleet Builder. Persisted v2.18 data is migrated at boot — see
  // the design notes.
}

export interface UserCpu {
  name: string;
  /** "Intel" / "AMD" / free-form. Drives the default HT convention (Intel=Yes,
   *  AMD=No for this tool) when the Hyperthreading cell is blank. */
  vendor?: string;
  family: string;
  coresPerSocket: number;
  hyperthreading: boolean;
}

// ────────────────────────────────────────────────────────────────────────
// VM Catalog — PRD §6.5
// ────────────────────────────────────────────────────────────────────────
export interface CatalogEntry {
  vmSizeName: string;
  vmGeneration: VmGeneration;
  series: string;
  memoryCategory: 'Medium Memory (MM)' | 'High Memory (HM)' | 'Very High Memory (VHM)';
  homeHardwareGroup: string;
  spilloverTarget: string; // "N/A" or hardware group name
  processor: string;
  vcpus: number;
  memoryGib: number;
  networkMbps: number;
  localDiskGib: number;
  status: string;
  notes: string;
  /** Cloud provider tag (Azure / AWS / GCP / custom). Optional for back-compat
   *  with the legacy single-provider Azure-only catalog. */
  provider?: VmProvider;
  /** Family slug (e.g. "M-series", "m7i", "n2"). Display-only. */
  family?: string;
  /** v2.17 — Canonical category used to organize VMs across all three
   *  clouds. Matches Azure's "Category" picker (All / General purpose /
   *  Compute optimized / Memory optimized / Storage optimized / GPU /
   *  High performance compute) plus AWS's "Previous Generation" bucket.
   *  Standardized labels:
   *    'General Purpose' | 'Compute Optimized' | 'Memory Optimized'
   *      | 'Storage Optimized' | 'GPU' | 'High Performance Computing'
   *      | 'Previous Generation' | 'Confidential' | 'Custom'.
   *  Drives the hierarchical filter Category → Series → Size in the
   *  Competitive page + Region Availability page; also a column in the
   *  Excel template so users can sort + filter spreadsheets natively. */
  category?: VmCategory;
  // ── Pricing (v2.2) — US-East baseline per provider, USD per hour ──────
  /** Region the rates are sourced for. Defaults to provider's US-East SKU
   *  (Azure East US 2 / AWS us-east-1 / GCP us-central1). A future
   *  multi-region selector will let the user re-source. */
  region?: string;
  /** Pay-as-you-go (on-demand) hourly list price in USD. */
  hourlyUsd?: number;
  /** 1-year reserved-instance equivalent hourly price in USD. Where the
   *  provider quotes an upfront fee, this is the amortized hourly cost. */
  riOneYrHourlyUsd?: number;
  /** 3-year reserved-instance equivalent hourly price in USD. */
  riThreeYrHourlyUsd?: number;
  // ── v2.9 (Phase B) — full Azure-doc-level spec dimensions ─────────────
  /** Max NICs the VM supports. Metadata, not a packing constraint. */
  networkNicCount?: number;
  /** Local (temp) storage — number of disks. Often 0 / undefined for NVMe-less SKUs. */
  localStorageDiskCount?: number;
  /** Local storage capacity in GiB across all local disks. */
  localStorageGiB?: number;
  /** Local storage random-read IOPS. */
  localStorageIopsRR?: number;
  /** Local storage random-read throughput in MBps (bytes — not bits). */
  localStorageMbpsRR?: number;
  /** Max remote (uncached) data disks the VM supports. */
  remoteStorageDisks?: number;
  /** Max uncached remote storage IOPS — Premium SSD tier. */
  remoteStorageIopsPremium?: number;
  /** Max uncached remote storage throughput in MBps — Premium SSD tier. */
  remoteStorageMbpsPremium?: number;
  /** Max uncached remote storage IOPS — Ultra Disk / Premium SSD v2 tier. */
  remoteStorageIopsUltra?: number;
  /** Max uncached remote storage throughput in MBps — Ultra Disk / Premium SSD v2 tier. */
  remoteStorageMbpsUltra?: number;
  /** Accelerator type — e.g. "None", "NVIDIA A100", "AMD MI300X". */
  acceleratorType?: string;
  // ── B2 (S64) — processor provenance + estimate flags (ACCURACY-FIRST) ──
  /** When a family is scheduled across two silicon options (host-dependent),
   *  the individual processor strings — e.g. Azure Dv3 = Broadwell + Skylake,
   *  GCP n2 = Cascade Lake + Ice Lake. `processor` carries the combined label;
   *  this carries the split so the UI can say "X or Y (host-dependent)". */
  processorOptions?: string[];
  /** Provenance of the `processor` string, so the UI can honestly label it:
   *    'vendor'   — published by the provider's own API/feed (never labeled).
   *    'curated'  — filled from a source-cited map (Azure has no processor in
   *                 its feed); shown with "(assumed)" + a tooltip citing the
   *                 source doc.
   *    'inferred' — a coarse best-effort guess from the SKU name; hedged.
   *  Absent = unknown provenance (treated like no source). */
  processorSource?: 'vendor' | 'curated' | 'inferred';
  /** True when `networkMbps` came from a curated legacy-doc fallback rather than
   *  the primary scrape/API — shown with "(est.)" so the planner treats it as
   *  directional. Absent/false = the primary published value (or 0/unknown). */
  networkEstimated?: boolean;
}

/** Hours-per-month convention used to derive monthly rates from hourly.
 *  Matches Azure's billing convention (730 = 24 × 365.25 / 12). */
export const HOURS_PER_MONTH = 730;

// ────────────────────────────────────────────────────────────────────────
// v2.12 (Phase F) — Cross-provider VM equivalency (user-authored).
//
// Cross-cloud equivalency is opinion, not vendor doctrine — Microsoft
// doesn't publish "the AWS analog of M832is_v3 is x2idn.32xlarge." So
// equivalency rows ship as a SEED of widely-accepted public-knowledge
// mappings (e.g. M-Series HM ↔ x2idn ↔ m3-ultramem), and the user can
// edit / extend via the equivalency Excel template.
//
// One row = one equivalency group. Each provider field is the
// `vmSizeName` of a row that should exist in `state.userVms` for the
// match to render in the Competitive page. Missing entries surface as
// "no equivalent" cells in the table. `notes` is free-form context.
// ────────────────────────────────────────────────────────────────────────
export interface EquivalencyEntry {
  azureSku?: string;
  awsSku?: string;
  gcpSku?: string;
  notes?: string;
}

/** v2.6 — Fixed universe of availability zones the tool supports. Cluster
 *  `zone` and BOM-row `zones[]` are constrained to this set. Kept narrow (4
 *  is the practical cap across major clouds and matches the per-row picker
 *  cap of 4 zones). */
export const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'] as const;
export type Zone = typeof ZONES[number];

/** A VM size as authored by the user in the VM tab's Excel template. Superset of
 *  CatalogEntry — every UserVm is a valid CatalogEntry, plus extra provider
 *  metadata. Passed verbatim into the engine as `catalog`. */
export type UserVm = CatalogEntry;

// ────────────────────────────────────────────────────────────────────────
// BOM
// ────────────────────────────────────────────────────────────────────────
export interface BomEntry {
  vmSizeName: string;
  quantity: number;
  // Resolved from catalog at simulation time, but cached here for display:
  vcpus?: number;
  memoryGib?: number;
  homeHardwareGroup?: string;
  spilloverTarget?: string;
  memoryCategory?: MemoryCategoryId;
  /** v2.6 — How this row deploys.
   *   - 'regional' (default): zone-agnostic. Allocator picks the cluster with
   *     the most available capacity at each fungibility tier.
   *   - 'zonal': allocator round-robin-splits the row's quantity across
   *     `zones` so per-zone utilization stays even (HA pattern). Within each
   *     assigned zone the normal Home → Spill-1..5 tier cascade still runs.
   *  Undefined = treated as 'regional' for back-compat with pre-v2.6 saves. */
  deploymentType?: 'regional' | 'zonal';
  /** v2.6 — When `deploymentType === 'zonal'`, the up-to-4 zones across which
   *  this row's VMs are evenly distributed. Each entry must match the `zone`
   *  string of at least one cluster or the corresponding sub-claim becomes
   *  unplaceable. Order is irrelevant for distribution (round-robin is
   *  deterministic on order but the count split is the same). */
  zones?: string[];
  /** v2.22.9 — Deployment-target region, STAMPED when the row is added (from
   *  the VM-demand region picker / `ui.activeRegion[provider]` at add time).
   *  The BoM line owns its region so it survives later filter changes —
   *  changing the catalog filter no longer re-targets already-added VMs. The
   *  run + pricing resolve each line by this region; undefined (legacy / Excel
   *  uploads) falls back to `ui.activeRegion`. */
  region?: string;
}

/** Heterogeneous-rack slot. Required: how much memory, how many of this slot
 *  per rack. Optional: utility flag, plus per-slot overrides for processor /
 *  CPU topology / network / storage. An undefined override = inherit the
 *  group-level field at engine time. */
export interface RackSlot {
  memoryGibPerNode: number;
  count: number;
  isUtility?: boolean;
  /** Free-text label for the slot's role (e.g. "GPU", "Storage"). Pure
   *  display metadata — the engine still keys workload-eligibility off
   *  `isUtility` only. Set when the user picks "Other" in the Server
   *  Builder's Type toggle. */
  roleLabel?: string;
  processor?: string;
  socketsPerNode?: number;
  coresPerSocket?: number;
  vcpusPerNode?: number;
  networkMbpsPerNode?: number;
  storageThroughputMbpsPerNode?: number;
  /** Per-slot LOCAL storage throughput override (MB/s). Spec field only. */
  localStorageThroughputMbpsPerNode?: number;
}

// ────────────────────────────────────────────────────────────────────────
// Fleet & Hardware Group
// ────────────────────────────────────────────────────────────────────────
export interface FleetSpec {
  hardwareGroupName: string; // e.g. "Gen-A MM-Std"
  memoryCategory: MemoryCategoryId;
  rackCount: number;
  nodesPerRack: number;
  socketsPerNode: number;
  coresPerSocket: number;
  hyperthreadingEnabled: boolean;
  memoryGibPerNode: number;
  /** Heterogeneous racks: per-position memory pattern, expanded round-robin within each rack.
   *  e.g. Gen-B HM-Mixed = [{8192,2},{16384,1}] → positions 1,2 = 8 TiB; position 3 = 16 TiB.
   *  When absent, every node uses `memoryGibPerNode`. Counts must sum to `nodesPerRack`.
   *  v2.17.23 — slots may optionally override CPU / network / storage per node. */
  rackComposition?: RackSlot[];
  throughputCeilingMbps?: number | null;
  isolated: boolean; // VHM = 1 VM/node, no packing
  processor: string;
  /** VM generations this hardware is HOME for. Populated from the uploaded HW
   *  group's "Home For" column. When `fungibilityOn` is true the engine rejects
   *  any VM whose generation is not in this set ∪ spilloverFrom. Undefined =
   *  no enforcement (custom/manual fleet — not selected from the catalog).
   *
   *  DEPRECATED in v2.4 — when SimulatorInput.fungibilityMatrix is provided
   *  the matrix path takes precedence and these fields are ignored. Kept for
   *  back-compat with the v2.3 enforcement path (custom fleets without a
   *  matrix entry). */
  homeFor?: VmGeneration[];
  /** See homeFor. */
  spilloverFrom?: VmGeneration[];
  /** v2.6 — Availability zone label. Mirrored from `HardwareGroup.zone` by
   *  `FleetForm.applyGroup` / `buildFleetFromGroup`; can be overridden per
   *  cluster. Constrained to the `ZONES` set. Drives the zonal allocator
   *  path + Region → Zone → HW → Cluster viz grouping. */
  zone?: string;
  /** v2.6 — Cloud region. Free-form; mirrored from `HardwareGroup.region`
   *  by `applyGroup` / `buildFleetFromGroup`; the Composer also sets this
   *  directly when the user picks a region at add-time. Drives the Region
   *  level of the viz + Fleet Composition grouping. */
  region?: string;
  // ── v2.5 financial mirror from HardwareGroup. Populated by
  //    FleetForm.applyGroup. See HardwareGroup for semantics. ──────────────
  costPerNodeUsd?: number;
  costPerRackUsd?: number;
  usableLifeMonths?: number;
  /** Recurring monthly operating cost per node (USD). Mirrored from
   *  HardwareGroup.opexPerNodeMonthlyUsd by applyGroup / buildFleetFromGroup.
   *  Cash cost added to the monthly cost for margin + payback. See
   *  HardwareGroup for semantics. */
  opexPerNodeMonthlyUsd?: number;
  /** Stable HW Group ID (slug) — the matrix column key. Populated by
   *  FleetForm.applyGroup from the uploaded HW row's `id`. Required when
   *  fungibilityMatrix is consulted. */
  hardwareGroupId?: string;
  // ── v2.9 (Phase B) — per-node network capacity. Mirrored from
  //    HardwareGroup.networkMbpsPerNode by FleetForm.applyGroup. Engine
  //    reads this when present and enforces it as a packing constraint
  //    alongside memory + vCPU. Distinct from `throughputCeilingMbps`
  //    which is a fleet-level ceiling (deprecated and unused). ───────────
  networkMbpsPerNode?: number;
  networkNicCount?: number;
  /** Mirror of HardwareGroup.storageThroughputMbpsPerNode. Mirrored by
   *  FleetForm.applyGroup / buildFleetFromGroup; engine reads it as the 4th
   *  packing constraint. */
  storageThroughputMbpsPerNode?: number;
  /** v2.18 — DEPRECATED. Legacy per-cluster snapshot. Kept readable for the
   *  v2.19 boot-time migration that promotes this field to `bufferDefault`
   *  and then clears it. New placements DO NOT populate this. */
  buffer?: BufferSpec;
  /** v2.19 — Cluster-wide default buffer / overhead. Authored in the Fleet
   *  Builder cluster card, never inherited from the HW Library (per the
   *  Buffer-per-cluster doctrine — rack-planning sizing requires the
   *  cluster shape). When set, the engine reserves this fraction (pct) or
   *  count (fixed) of each non-utility node-type's nodes. Per-node-type
   *  values in `bufferByMemGib` override this per-slot. */
  bufferDefault?: BufferSpec;
  /** v2.19 — Per-node-type buffer overrides, keyed by the slot's
   *  `memoryGibPerNode` (stringified, since `Record<number>` doesn't survive
   *  JSON round-trips cleanly). Lets heterogeneous racks (e.g. Gen-B HM-Mixed
   *  with 2× 8 TiB compute + 1× 16 TiB compute) buffer the 8 TiB tier
   *  differently from the 16 TiB tier. Missing key → falls through to
   *  `bufferDefault`. Utility slots are NEVER buffered (they don't accept
   *  workloads, so they're already excluded from deployable counts). */
  bufferByMemGib?: Record<string, BufferSpec>;
  /** v2.19.3 — Has the user interacted with this cluster's buffer? When
   *  false/undefined, the UI tints the buffer input amber and shows a
   *  "check buffer" nudge so the user notices a default value they may
   *  not have considered. Set to `true` on the first interaction (Mode
   *  pill click or value change). Migration sets `true` for fleets that
   *  inherit a buffer from v2.18 — those already had explicit intent. */
  bufferAcknowledged?: boolean;
}

export function vcpusPerNode(fleet: FleetSpec): number {
  const ht = fleet.hyperthreadingEnabled ? 2 : 1;
  return fleet.socketsPerNode * fleet.coresPerSocket * ht;
}

export function totalNodes(fleet: FleetSpec): number {
  return fleet.rackCount * fleet.nodesPerRack;
}

// ────────────────────────────────────────────────────────────────────────
// v2.19 — Per-cluster, per-node-type buffer resolution.
//
// Buffer is now a deployment-time concern (FleetSpec, not HardwareGroup).
// Each cluster authors a `bufferDefault` plus optional per-slot overrides
// keyed by memoryGibPerNode. Utility slots are excluded from both the
// denominator and the numerator — they never accept workloads so they're
// already a baked-in reservation.
//
// `deployableNodes(fleet)` is the single helper UI + engine both use so
// the maths can never drift.
// ────────────────────────────────────────────────────────────────────────

/** Result of resolving a fleet's buffer across its non-utility slots. */
export interface DeployableNodes {
  /** Total non-utility nodes across the whole cluster. */
  totalNonUtility: number;
  /** Sum of reserved nodes (buffer × per-slot count, summed). */
  reserved: number;
  /** totalNonUtility - reserved. Never negative. */
  deployable: number;
  /** One entry per non-utility slot for granular UI rendering. */
  perSlot: Array<{
    memGib: number;
    countPerRack: number;
    totalCount: number;
    buffer: BufferSpec | undefined;
    reserved: number;
    deployable: number;
  }>;
}

/** Resolve the effective buffer for one (memGib) slot. Per-node-type
 *  override wins; falls back to bufferDefault; finally undefined. */
export function effectiveSlotBuffer(
  fleet: FleetSpec,
  memGib: number,
): BufferSpec | undefined {
  const override = fleet.bufferByMemGib?.[String(memGib)];
  if (override) return override;
  return fleet.bufferDefault;
}

function resolveReservedForSlot(buf: BufferSpec | undefined, slotTotal: number): number {
  if (!buf) return 0;
  if (buf.mode === 'pct') return Math.ceil(slotTotal * (Math.max(0, buf.value) / 100));
  return Math.min(slotTotal, Math.max(0, Math.floor(buf.value)));
}

export function deployableNodes(fleet: FleetSpec): DeployableNodes {
  const rackCount = fleet.rackCount ?? 0;
  const slots = fleet.rackComposition;

  // Homogeneous / legacy path — no rackComposition means every node is
  // compute (no utility distinction). Treat the whole cluster as one slot
  // keyed by the fleet's memoryGibPerNode.
  if (!slots || slots.length === 0) {
    const memGib = fleet.memoryGibPerNode ?? 0;
    const totalCount = (fleet.nodesPerRack ?? 0) * rackCount;
    const buf = effectiveSlotBuffer(fleet, memGib);
    const reserved = resolveReservedForSlot(buf, totalCount);
    return {
      totalNonUtility: totalCount,
      reserved,
      deployable: Math.max(0, totalCount - reserved),
      perSlot: [{
        memGib,
        countPerRack: fleet.nodesPerRack ?? 0,
        totalCount,
        buffer: buf,
        reserved,
        deployable: Math.max(0, totalCount - reserved),
      }],
    };
  }

  // Heterogeneous path — walk each slot. Utility slots contribute zero to
  // both denominators and numerators; they're an entirely separate scope.
  let totalNonUtility = 0;
  let totalReserved = 0;
  const perSlot: DeployableNodes['perSlot'] = [];
  for (const s of slots) {
    if (s.isUtility) continue;
    const totalCount = s.count * rackCount;
    const buf = effectiveSlotBuffer(fleet, s.memoryGibPerNode);
    const reserved = resolveReservedForSlot(buf, totalCount);
    totalNonUtility += totalCount;
    totalReserved += reserved;
    perSlot.push({
      memGib: s.memoryGibPerNode,
      countPerRack: s.count,
      totalCount,
      buffer: buf,
      reserved,
      deployable: Math.max(0, totalCount - reserved),
    });
  }
  return {
    totalNonUtility,
    reserved: totalReserved,
    deployable: Math.max(0, totalNonUtility - totalReserved),
    perSlot,
  };
}

/** True when the fleet's rackComposition has more than one DISTINCT
 *  non-utility memoryGibPerNode value (so per-node-type overrides are
 *  meaningful). Used by the UI to show the "Per node type" affordance. */
export function hasHeterogeneousNonUtility(fleet: FleetSpec): boolean {
  const slots = fleet.rackComposition;
  if (!slots) return false;
  const seen = new Set<number>();
  for (const s of slots) if (!s.isUtility) seen.add(s.memoryGibPerNode);
  return seen.size > 1;
}

// ────────────────────────────────────────────────────────────────────────
// Buffer — PRD §9.3 (Phase 1 simple model)
// ────────────────────────────────────────────────────────────────────────
export type BufferMode = 'pct' | 'fixed';
export interface BufferSpec {
  mode: BufferMode;
  value: number; // pct: 0-50, fixed: integer ≥ 0
}

// ────────────────────────────────────────────────────────────────────────
// Engine inputs & outputs — PRD §9.7
// ────────────────────────────────────────────────────────────────────────
export type PackingMode = 'SMART' | 'STRICT';

export interface SimulatorInput {
  fleet: FleetSpec;
  buffer: BufferSpec;
  bom: BomEntry[];
  catalog: CatalogEntry[];
  packingMode: PackingMode;
  fungibilityOn: boolean;
  /** v2.4 fungibility matrix — keyed [vmClass][hwGroupId]. When provided AND
   *  non-empty, takes precedence over the legacy fleet.homeFor / spilloverFrom
   *  check. Cells: number = priority (0 = Home, 1..5 = Spillover), 'blocked' =
   *  explicit refuse. Missing entry = NOT_AUTHORED (blocked when matrix is
   *  non-empty; whole check skipped when matrix is empty). */
  fungibilityMatrix?: Record<string, Record<string, number | 'blocked'>>;
  /** Provider-agnostic VM-class lookup: vmSizeName → class key the matrix is
   *  rowed on. Engine doesn't know Azure conventions; caller pre-computes via
   *  vmClass() from src/utils/vmTaxonomy.ts. Required when fungibilityMatrix
   *  is provided. */
  vmClassByName?: Record<string, string>;
}

/** v2.9 — Renamed THROUGHPUT → NETWORK. Network is the third hard packing
 *  constraint (memory, vCPU, network). The old "throughput" label was
 *  always referring to network bandwidth in Mbps; the rename clarifies it.
 *  STORAGE added as 4th constraint: remote Premium SSD MB/s. */
export type BindingConstraint = 'MEMORY' | 'VCPU' | 'NETWORK' | 'STORAGE' | 'NONE';

export type NodeState =
  | 'deployable'
  | 'reserved'
  | 'occupied-partial'
  | 'occupied-full'
  | 'isolated'
  | 'ofr';

export interface PlacedVm {
  vmSizeName: string;
  vcpus: number;
  memoryGib: number;
  vmGeneration?: VmGeneration;
}

export interface NodeDetail {
  nodeId: string; // "R1N3" or, in multi-cluster, "f-2:R1N3"
  /** Cluster (fleet) id this node belongs to. Set by the multi-cluster orchestrator
   *  in RunFooter; engine itself remains cluster-agnostic. */
  clusterId?: string;
  rack: number;
  posInRack: number;
  hardwareGroup: string;
  state: NodeState;
  memoryTotalGib: number;
  vcpusTotal: number;
  throughputTotalMbps: number | null;
  memoryUsedGib: number;
  vcpusUsed: number;
  throughputUsedMbps: number;
  /** Per-node Premium SSD storage throughput cap (MB/s). null = no cap
   *  (storage constraint disabled for this node). */
  storageThroughputTotalMbps: number | null;
  /** Premium SSD MB/s currently consumed by placed VMs. */
  storageThroughputUsedMbps: number;
  strandedMemoryGib: number;
  strandedVcpus: number;
  vmsPlaced: PlacedVm[];
  bindingConstraint: BindingConstraint;
  isSpilloverNode: boolean;
  isolated?: boolean;
}

export type BlockingReason =
  | 'MEMORY'
  | 'VCPU'
  | 'NO_ELIGIBLE_NODES'
  | 'DEPLOYMENT_LIMIT'
  | 'ISOLATED_HOST'
  | 'VM_SIZE_NOT_FOUND'
  /** Cluster has no fungibility info defined (homeFor + spilloverFrom both
   *  empty) and the user has fungibilityOn — the simulator refuses to allocate
   *  any VMs onto this hardware until the user fills in those columns. */
  | 'NO_FUNGIBILITY_DEFINED'
  /** This VM's generation isn't in the cluster's homeFor ∪ spilloverFrom set.
   *  E.g. running Mv2 BOM against a Gen-C HM-Mixed cluster whose homeFor=Mv3 only. */
  | 'NOT_FUNGIBLE_TO_HARDWARE'
  /** v2.4: matrix is populated but the (vmClass, hwGroupId) cell is missing.
   *  Surfaces "you have a fungibility matrix but haven't authored a rule for
   *  this VM/HW pair" — distinct from explicit Blocked so the user can tell
   *  the difference between "I said no" and "I haven't decided yet". */
  | 'NOT_AUTHORED'
  // ── v2.5 expanded diagnostic vocabulary ────────────────────────────────
  /** VM memory exceeds the largest single-node memory across EVERY cluster
   *  in the fleet. No amount of capacity can ever hold this VM — the user
   *  needs bigger nodes or to drop the SKU. Distinct from MEMORY which means
   *  "this particular cluster's nodes can't hold it but a bigger cluster
   *  could have." */
  | 'VM_OVERSIZED_MEMORY'
  /** VM vCPU count exceeds the largest single-node vCPU across every cluster. */
  | 'VM_OVERSIZED_VCPU'
  /** VM had at least one accepting cluster (matrix or legacy) but every tier
   *  was exhausted via the v2.4.2 cascade. Different from NO_ELIGIBLE_NODES
   *  ("no cluster accepts AT ALL") — here some accept, just none had room. */
  | 'OVERFLOWED_ALL_TIERS'
  /** Every accepting cluster in the matrix has its cell explicitly marked
   *  Blocked (`B`). User actively forbade routing — distinct from
   *  NOT_AUTHORED (just hasn't decided). */
  | 'BLOCKED_BY_MATRIX'
  /** VM has a region that doesn't match the active region scope for its
   *  provider. The catalog row is silently dropped before reaching any
   *  cluster, but we surface it so the user knows their region picker is
   *  filtering things out. */
  | 'REGION_MISMATCH'
  /** No clusters configured at all — the user hasn't set up any hardware
   *  yet. The whole BOM is unplaceable for a structural reason. */
  | 'NO_CLUSTERS_CONFIGURED'
  /** v2.6: this row is marked zonal and one of its selected zones doesn't
   *  match any cluster in the fleet. The split sub-claim for that zone has
   *  nowhere to land. */
  | 'ZONE_NOT_IN_FLEET'
  /** v2.9 (Phase B): VM's network bandwidth (`networkMbps`) exceeds the node's
   *  `networkMbpsPerNode` cap. Counterpart to MEMORY / VCPU but for network.
   *  Pre-flight check rejects when VM > node cap; packing check rejects when
   *  remaining network on every open node is insufficient. */
  | 'NETWORK'
  /** v2.9 (Phase B): VM `networkMbps` exceeds the largest single-node network
   *  capacity across EVERY cluster in the fleet. No cluster can ever host it
   *  — counterpart to VM_OVERSIZED_MEMORY for network. */
  | 'VM_OVERSIZED_NETWORK'
  /** Storage throughput packing constraint. VM's remoteStorageMbpsPremium
   *  exceeds the per-node `storageThroughputMbpsPerNode` cap. Pre-flight
   *  rejects when single-VM > node cap; pack-time rejects when remaining
   *  storage throughput on every open node is insufficient. */
  | 'STORAGE'
  /** VM remoteStorageMbpsPremium exceeds the largest single-node storage
   *  throughput across EVERY cluster in the fleet — no cluster can ever
   *  host it. Counterpart to VM_OVERSIZED_NETWORK for storage. */
  | 'VM_OVERSIZED_STORAGE';

export interface UnplaceableEntry {
  vmSizeName: string;
  count: number;
  blockingReason: BlockingReason;
  /** v2.5: optional human-readable specifics that flesh out `blockingReason`.
   *  Examples:
   *   - MEMORY        → "VM needs 5700 GiB; largest available node has 4096 GiB"
   *   - OVERFLOWED_ALL_TIERS → "Home Gen-D MM full (1024/1024 GiB); Spill Gen-A MM full (4096/4096 GiB)"
   *   - REGION_MISMATCH      → "VM tagged East US 2; active region is West US 3"
   *   - VM_OVERSIZED_MEMORY  → "VM needs 30400 GiB; no node in any cluster exceeds 16384 GiB"
   *  When absent, the UI falls back to the generic reason copy. */
  details?: string;
}

export interface SpilloverEvent {
  vmSizeName: string;
  fromGroup: string;
  toGroup: string;
  count: number;
}

export interface SimulatorResult {
  // Counts
  totalNodes: number;
  deployableNodesBefore: number;
  reservedNodes: number;
  nodesConsumed: number;
  henRemaining: number;

  // Stranding
  strandedMemoryGib: number;
  strandedVcpus: number;

  // Utilization (occupied nodes only)
  memoryUtilizationPct: number;
  vcpuUtilizationPct: number;

  // VM outcomes
  vmsPlaced: number;
  vmsUnplaceable: UnplaceableEntry[];

  // Deployment limit signals
  deploymentLimited: boolean;
  deploymentLimitReason: 'BUFFER_EXHAUSTED' | 'HW_GROUP_NOT_CONFIGURED' | null;

  // Spillover (Phase 2)
  spilloverEvents: SpilloverEvent[];

  // Per-node detail
  nodeDetail: NodeDetail[];
}

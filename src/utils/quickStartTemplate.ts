/**
 * Quick Start template (v2.20.1) — `(intent) → Partial<AppState>`.
 *
 * The shared-state contract's "templates are functions" item, realized:
 * one pure function turns a four-field intent (server · region · zones ·
 * demand) into the exact state the five-tab workflow would have authored
 * by hand — authored region + zones, one cluster per zone (deployments
 * are usually zonal), BoM rows defaulting to zonal-balance, and
 * auto-routed fungibility for anything not already authored.
 *
 * STRICTLY ADDITIVE: existing hardware, fleets, BoM rows, and matrix
 * cells are never modified or removed — the wizard layers a scenario on
 * top. The engine is never forked; callers run via buildAndRunSimulation.
 */
import type { AppState } from '../state/AppState';
import type { BomEntry, FleetSpec, HardwareGroup } from '../types';
import { buildFleetFromGroup } from '../components/FleetBuilder';
import { autoRouteMissingRules } from './autoRoute';

export interface QuickStartDemandRow {
  vmSizeName: string;
  quantity: number;
}

export interface QuickStartIntent {
  /** The server template — a library group or a starter profile. */
  hardware: HardwareGroup;
  region: string;
  /** Zones to place in — one identical cluster lands in EACH. */
  zones: string[];
  racksPerZone: number;
  demand: QuickStartDemandRow[];
  /** 'zonal' (default) = BoM rows balance across every zone with a
   *  cluster (the v2.19.22 zonal-balance semantic); 'regional' = the
   *  engine picks placement freely. */
  deployment: 'zonal' | 'regional';
}

export interface QuickStartResult {
  /** HYDRATE payload — additive over the current state. */
  patch: Partial<AppState>;
  /** Cluster ids created (qs-N). */
  clusterIds: string[];
  /** Fungibility cells the auto-router authored for the new demand. */
  autoRoutedCells: number;
  /** Demand sizes no placed hardware can structurally hold. */
  unfittableSizes: string[];
}

function nextQsId(existing: string[]): () => string {
  const used = new Set(existing);
  let n = 1;
  return () => {
    while (used.has(`qs-${n}`)) n++;
    const id = `qs-${n}`;
    used.add(id);
    return id;
  };
}

export function buildQuickStartPatch(
  state: AppState,
  intent: QuickStartIntent,
): QuickStartResult {
  const racks = Math.max(1, Math.round(intent.racksPerZone));
  const zones = intent.zones.length > 0 ? intent.zones : ['Zone 1'];

  // ── Hardware: append the starter profile if it isn't in the library ──
  const hwExists = state.userHardware.some((g) => g.id === intent.hardware.id);
  const userHardware = hwExists
    ? state.userHardware
    : [...state.userHardware, intent.hardware];

  // ── Region + zones: merge into the authored structure ────────────────
  const fleetRegions = [...state.fleetRegions];
  const existingRegion = fleetRegions.findIndex((r) => r.region === intent.region);
  if (existingRegion >= 0) {
    const merged = new Set([...fleetRegions[existingRegion].zones, ...zones]);
    fleetRegions[existingRegion] = { region: intent.region, zones: [...merged] };
  } else {
    fleetRegions.push({ region: intent.region, zones: [...zones] });
  }

  // ── Clusters: one per zone, built exactly like a manual placement.
  //    Buffer default (12%) is acknowledged — the wizard summary states it
  //    explicitly, which is the user seeing + accepting the default. ─────
  const fleets: Record<string, FleetSpec> = { ...state.fleets };
  // Drop the unconfigured default stub so the first real placement isn't
  // shadowed by a phantom row (same auto-clean as the composer).
  let fleetOrder = [...state.fleetOrder];
  for (const id of [...fleetOrder]) {
    if (!fleets[id]?.hardwareGroupName?.trim()) {
      delete fleets[id];
      fleetOrder = fleetOrder.filter((x) => x !== id);
    }
  }
  const genId = nextQsId(fleetOrder);
  const clusterIds: string[] = [];
  for (const zone of zones) {
    const id = genId();
    fleets[id] = {
      ...buildFleetFromGroup(intent.hardware, racks, intent.region, zone),
      bufferAcknowledged: true,
    };
    fleetOrder.push(id);
    clusterIds.push(id);
  }

  // ── BoM: additive. Zonal rows leave `zones` undefined = BALANCE across
  //    every zone with a cluster (the v2.19.22 semantic). ────────────────
  const newRows: BomEntry[] = intent.demand
    .filter((d) => d.vmSizeName && d.quantity > 0)
    .map((d) => ({
      vmSizeName: d.vmSizeName,
      quantity: Math.round(d.quantity),
      deploymentType: intent.deployment,
    }));
  const bom = [...state.bom, ...newRows];

  // ── Fungibility: auto-route anything the new demand leaves unauthored,
  //    evaluated against the COMPOSED state (new clusters included). ─────
  const composed: AppState = {
    ...state,
    userHardware,
    fleetRegions,
    fleets,
    fleetOrder,
    bom,
  };
  const route = autoRouteMissingRules(composed);

  return {
    patch: {
      userHardware,
      fleetRegions,
      fleets,
      fleetOrder,
      bom,
      userFungibility: route.matrix,
      result: null,
      isStale: false,
    },
    clusterIds,
    autoRoutedCells: route.authored.length,
    unfittableSizes: route.sizesUnfittable,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Starter server profiles — for users with an empty Hardware Library.
// Generic public-estimate shapes (NOT vendor SKUs — Decoupling-compliant;
// same register as the Simple Calculator presets). Added to the library
// only when actually used, so the user can edit them like any server.
// ────────────────────────────────────────────────────────────────────────
export const STARTER_SERVERS: HardwareGroup[] = [
  {
    id: 'starter-std-256',
    name: 'Starter · Standard 256 GiB',
    provider: 'Custom',
    memoryCategory: 'mm',
    memoryGibPerNode: 256,
    socketsPerNode: 1,
    coresPerSocket: 32,
    vcpusPerNode: 64,
    nodesPerRack: 8,
    processor: 'Generic 32-core (starter profile)',
    homeFor: [],
    spilloverFrom: [],
    isolated: false,
    networkMbpsPerNode: 50000,
    storageThroughputMbpsPerNode: 16000,
    costPerRackUsd: 350_000,
    usableLifeMonths: 72,
    notes: 'Quick start starter profile — generic public-estimate shape, edit freely.',
  },
  {
    id: 'starter-large-512',
    name: 'Starter · Large 512 GiB',
    provider: 'Custom',
    memoryCategory: 'mm',
    memoryGibPerNode: 512,
    socketsPerNode: 1,
    coresPerSocket: 64,
    vcpusPerNode: 128,
    nodesPerRack: 8,
    processor: 'Generic 64-core (starter profile)',
    homeFor: [],
    spilloverFrom: [],
    isolated: false,
    networkMbpsPerNode: 50000,
    storageThroughputMbpsPerNode: 16000,
    costPerRackUsd: 600_000,
    usableLifeMonths: 72,
    notes: 'Quick start starter profile — generic public-estimate shape, edit freely.',
  },
  {
    id: 'starter-xl-1024',
    name: 'Starter · X-Large 1 TiB',
    provider: 'Custom',
    memoryCategory: 'mm',
    memoryGibPerNode: 1024,
    socketsPerNode: 2,
    coresPerSocket: 48,
    vcpusPerNode: 192,
    nodesPerRack: 6,
    processor: 'Generic dual-socket 48-core (starter profile)',
    homeFor: [],
    spilloverFrom: [],
    isolated: false,
    networkMbpsPerNode: 100000,
    storageThroughputMbpsPerNode: 16000,
    costPerRackUsd: 1_000_000,
    usableLifeMonths: 72,
    notes: 'Quick start starter profile — generic public-estimate shape, edit freely.',
  },
];

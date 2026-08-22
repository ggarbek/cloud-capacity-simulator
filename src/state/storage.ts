/**
 * localStorage persistence — PRD §23.
 * Schema-versioned. Silently discards on parse error.
 */
import type { AppState } from './AppState';

// v2 = multi-hardware silo. v1 persisted a singular `fleet` blob; that key is
// silently discarded on load per the "Invalid/old data is silently
// discarded" convention.
const SCHEMA_VERSION = 2;

const KEYS = {
  bom: 'vmcap:bom',
  fleets: 'vmcap:fleets',
  fleetOrder: 'vmcap:fleetOrder',
  buffer: 'vmcap:buffer',
  packing: 'vmcap:packing',
  fungibility: 'vmcap:fungibility',
  lastResult: 'vmcap:lastSimResult',
  ui: 'vmcap:uiState',
  userHardware: 'vmcap:userHardware',
  userCpus: 'vmcap:userCpus',
  userVms: 'vmcap:userVms',
  userFungibility: 'vmcap:userFungibility',
  userEquivalency: 'vmcap:userEquivalency',
  fleetRegions: 'vmcap:fleetRegions',
  /** v2.17.11 — Stamped with the `PUBLIC_SEED_VERSION` constant whenever
   *  the additive seed-merge runs. Lets the AppContext know whether the
   *  user's persisted catalog has the latest public seed content. */
  seedVersion: 'vmcap:seedVersion',
  /** v2.25.5 — 'true' once the user has uploaded their OWN VM catalog (the
   *  VM Library Upload button). While set, the user's catalog wins and the
   *  baked live catalog does NOT overlay it. Cleared by ↻ Refresh (revert to
   *  the live default). When unset, the default catalog is the baked live
   *  catalog, re-derived from the bundle each boot — so it's never persisted. */
  userCatalogUploaded: 'vmcap:userCatalogUploaded',
} as const;

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== SCHEMA_VERSION) return null;
    return parsed.data as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ v: SCHEMA_VERSION, data }));
  } catch {
    /* quota or disabled — surface elsewhere */
  }
}

/** The one seeded server, present on every fresh profile. Its presence is not
 *  evidence of anything; anything ALONGSIDE it is. */
const SEEDED_SAMPLE_SERVER_ID = 'sample-reference-server';

/**
 * Has this visitor actually used the tool, or merely looked at it?
 *
 * Only three things count, and each means work that cannot happen by accident:
 * a bill of materials was entered, a simulation was run, or a server was built
 * beyond the seeded sample. Browsing pages, toggling the theme and resizing a
 * panel are not work — a visitor who did only those should be met by the front
 * door again, not dropped back wherever they happened to stop scrolling.
 *
 * Deliberately NOT counted: `fleetOrder`, which ships holding the default fleet
 * id and so is never empty, and `userVms`/`userCpus`, which are seeded from the
 * public catalog at boot.
 */
function hasDoneRealWork(p: {
  bom: AppState['bom'] | null;
  result: AppState['result'] | null;
  userHardware: AppState['userHardware'] | null;
}): boolean {
  if (p.bom && p.bom.length > 0) return true;
  if (p.result) return true;
  if (p.userHardware?.some((h) => h.id !== SEEDED_SAMPLE_SERVER_ID)) return true;
  return false;
}

/**
 * Keep the visitor's harmless preferences, reset only where they land.
 *
 * Theme, rail collapse, panel widths and every other cosmetic choice survive —
 * throwing those away would be its own kind of rude. The three navigation
 * fields go back to the front door: the Simulator, on Start Here, in the setup
 * view. Notably this also pulls a returning visitor out of Cloud Market
 * Analytics, which is the correct default entry point for someone meeting the
 * project for the first time.
 */
function landOnStartHere(ui: AppState['ui']): AppState['ui'] {
  return {
    ...ui,
    activePage: 'simulator',
    activeSidebarTab: 'start-here',
    workspaceView: 'setup',
  };
}

export function loadPersisted(): Partial<AppState> {
  const bom = safeGet<AppState['bom']>(KEYS.bom);
  const fleets = safeGet<AppState['fleets']>(KEYS.fleets);
  const fleetOrder = safeGet<AppState['fleetOrder']>(KEYS.fleetOrder);
  const buffer = safeGet<AppState['buffer']>(KEYS.buffer);
  const packingMode = safeGet<AppState['packingMode']>(KEYS.packing);
  const fungibilityOn = safeGet<boolean>(KEYS.fungibility);
  const result = safeGet<AppState['result']>(KEYS.lastResult);
  const ui = safeGet<AppState['ui']>(KEYS.ui);
  const userHardware = safeGet<AppState['userHardware']>(KEYS.userHardware);
  const userCpus = safeGet<AppState['userCpus']>(KEYS.userCpus);
  const userVms = safeGet<AppState['userVms']>(KEYS.userVms);
  const userFungibility = safeGet<AppState['userFungibility']>(KEYS.userFungibility);
  const userEquivalency = safeGet<AppState['userEquivalency']>(KEYS.userEquivalency);
  const fleetRegions = safeGet<AppState['fleetRegions']>(KEYS.fleetRegions);

  const out: Partial<AppState> = {};
  if (bom) out.bom = bom;
  // Restore fleets only when both halves agree — guard against partial writes.
  if (fleets && fleetOrder && fleetOrder.every((id) => fleets[id])) {
    out.fleets = fleets;
    out.fleetOrder = fleetOrder;
  }
  if (buffer) out.buffer = buffer;
  if (packingMode) out.packingMode = packingMode;
  if (fungibilityOn !== null) out.fungibilityOn = fungibilityOn;
  if (result) out.result = result;
  if (ui) out.ui = hasDoneRealWork({ bom, result, userHardware }) ? ui : landOnStartHere(ui);
  if (userHardware) out.userHardware = userHardware;
  if (userCpus) out.userCpus = userCpus;
  if (userVms) out.userVms = userVms;
  if (userFungibility) out.userFungibility = userFungibility;
  if (userEquivalency) out.userEquivalency = userEquivalency;
  if (fleetRegions) out.fleetRegions = fleetRegions;
  return out;
}

/** v2.17.11 — Read/write the seed-version stamp independently of AppState,
 *  since it's not part of the user-facing reducer slices. */
export function loadSeedVersion(): string | null {
  return safeGet<string>(KEYS.seedVersion);
}
export function saveSeedVersion(version: string): void {
  safeSet(KEYS.seedVersion, version);
}

/** v2.25.5 — Has the user uploaded their own VM catalog? When true, their
 *  catalog is persisted and wins; when false (default) the baked live catalog
 *  is used and NOT persisted (re-derived from the bundle each boot). */
export function loadUserCatalogUploaded(): boolean {
  return safeGet<boolean>(KEYS.userCatalogUploaded) === true;
}
export function saveUserCatalogUploaded(v: boolean): void {
  safeSet(KEYS.userCatalogUploaded, v);
}

export function persist(state: AppState): void {
  safeSet(KEYS.bom, state.bom);
  safeSet(KEYS.fleets, state.fleets);
  safeSet(KEYS.fleetOrder, state.fleetOrder);
  safeSet(KEYS.buffer, state.buffer);
  safeSet(KEYS.packing, state.packingMode);
  safeSet(KEYS.fungibility, state.fungibilityOn);
  safeSet(KEYS.ui, state.ui);
  safeSet(KEYS.userHardware, state.userHardware);
  safeSet(KEYS.userCpus, state.userCpus);
  // v2.25.5 — The default catalog is the baked live catalog (~100k rows),
  // re-derived from the bundle on every boot — persisting it is wasteful and
  // overflows the localStorage quota. Only persist when the user has uploaded
  // their OWN catalog (which must survive reloads and isn't re-derivable).
  if (loadUserCatalogUploaded()) {
    safeSet(KEYS.userVms, state.userVms);
  }
  safeSet(KEYS.userFungibility, state.userFungibility);
  safeSet(KEYS.userEquivalency, state.userEquivalency);
  safeSet(KEYS.fleetRegions, state.fleetRegions);
  if (state.result) safeSet(KEYS.lastResult, state.result);
}

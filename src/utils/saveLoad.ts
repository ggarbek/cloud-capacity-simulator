/**
 * v2.19.45 — Save / Load a fleet snapshot to / from a local JSON file.
 *
 * Why this exists alongside the localStorage auto-persist: localStorage
 * is browser- + origin-scoped, gets cleared by privacy tools / dev-tools
 * Clear Site Data / incognito sessions, and doesn't travel between
 * computers. An explicit file export lets the user:
 *   - Back up their work (don't lose it to a stray clear-cache)
 *   - Move a plan across browsers / machines / colleagues
 *   - Keep multiple named snapshots ("v1 plan", "after defrag", etc.)
 *
 * The exported file contains every reducer slice we already persist to
 * localStorage (see src/state/storage.ts → persist()) plus a small header
 * for version + timestamp. Import dispatches a single HYDRATE that
 * replaces those slices in one shot.
 */

import type { AppState } from '../state/AppState';

/** Bumped whenever the snapshot shape changes incompatibly. v1 = the
 *  initial cut on 2026-06-02 covering the 13 slices below. */
export const SNAPSHOT_SCHEMA_VERSION = 1;

/** Slice names included in a snapshot. Mirrors src/state/storage.ts's
 *  persist() coverage. Kept as a literal tuple so TS can validate the
 *  picked-keys type. `result` is omitted on purpose: the user's BoM /
 *  fleet / hardware fully reproduces it, and embedding it would bloat
 *  exports by an order of magnitude. */
const SLICE_KEYS = [
  'bom',
  'fleets',
  'fleetOrder',
  'buffer',
  'packingMode',
  'fungibilityOn',
  'userHardware',
  'userCpus',
  'userVms',
  'userFungibility',
  'userEquivalency',
  'fleetRegions',
] as const;
type SliceKey = (typeof SLICE_KEYS)[number];

export interface FleetSnapshot {
  /** Magic string so we can fail import early on a non-snapshot file. */
  kind: 'capacity-simulator-snapshot';
  schemaVersion: number;
  /** Free-text app version stamp (e.g. v2.19.45) — informational. */
  appVersion: string;
  /** ISO 8601 UTC timestamp of when this snapshot was exported. */
  exportedAt: string;
  /** Each slice is the same shape as what AppState carries at that key. */
  data: Partial<Pick<AppState, SliceKey>>;
}

/** Build a snapshot object from a live AppState. Pure function. */
export function buildSnapshot(state: AppState, appVersion: string): FleetSnapshot {
  const data: Partial<Pick<AppState, SliceKey>> = {};
  for (const key of SLICE_KEYS) {
    // The cast is safe because SLICE_KEYS is a literal tuple of valid
    // AppState keys; TS just can't narrow the assignment in a loop.
    (data as Record<string, unknown>)[key] = state[key];
  }
  return {
    kind: 'capacity-simulator-snapshot',
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    appVersion,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Suggest a sensible default filename based on the export timestamp. */
export function suggestSnapshotFilename(now: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `capacity-simulator-${y}-${m}-${d}-${hh}${mm}.json`;
}

/** Trigger a browser download of the snapshot as JSON. Returns the
 *  filename used so callers can surface it in a toast. */
export function downloadSnapshot(snapshot: FleetSnapshot, filename?: string): string {
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = filename ?? suggestSnapshotFilename();
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Free the blob URL on the next tick — the click already started the
  // download, and lingering URLs leak memory in long-running sessions.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

export interface ParseResult {
  ok: boolean;
  snapshot?: FleetSnapshot;
  error?: string;
}

/** Parse + validate a user-supplied JSON string. Returns a discriminated
 *  union — callers should branch on `ok` rather than try/catch. */
export function parseSnapshotJson(json: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'File does not contain a JSON object.' };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.kind !== 'capacity-simulator-snapshot') {
    return {
      ok: false,
      error:
        'This file is not a Capacity Simulator snapshot. Make sure you picked a file exported from this app.',
    };
  }
  const schemaVersion = obj.schemaVersion;
  if (typeof schemaVersion !== 'number') {
    return { ok: false, error: 'Snapshot is missing schemaVersion.' };
  }
  if (schemaVersion > SNAPSHOT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Snapshot was exported by a newer app version (schema ${schemaVersion}). Update your local app and try again.`,
    };
  }
  if (!obj.data || typeof obj.data !== 'object') {
    return { ok: false, error: 'Snapshot is missing the data payload.' };
  }
  return { ok: true, snapshot: obj as unknown as FleetSnapshot };
}

/** Read a File (from an <input type="file">) into a parsed snapshot. */
export async function readSnapshotFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return parseSnapshotJson(text);
  } catch (err) {
    return {
      ok: false,
      error: `Could not read file: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }
}

/** A tiny summary of what's in a snapshot — used in import-confirm dialogs. */
export function summarizeSnapshot(snapshot: FleetSnapshot): string {
  const d = snapshot.data;
  const parts: string[] = [];
  if (d.bom?.length) parts.push(`${d.bom.length} BoM row${d.bom.length === 1 ? '' : 's'}`);
  if (d.fleetOrder?.length) parts.push(`${d.fleetOrder.length} cluster${d.fleetOrder.length === 1 ? '' : 's'}`);
  if (d.userHardware?.length) parts.push(`${d.userHardware.length} server type${d.userHardware.length === 1 ? '' : 's'}`);
  if (d.userVms?.length) parts.push(`${d.userVms.length} VM rows`);
  if (d.fleetRegions?.length) parts.push(`${d.fleetRegions.length} authored region${d.fleetRegions.length === 1 ? '' : 's'}`);
  const summary = parts.length > 0 ? parts.join(' · ') : 'empty snapshot';
  return `${summary} · exported ${snapshot.exportedAt}`;
}

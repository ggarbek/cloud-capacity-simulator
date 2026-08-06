/**
 * Demo = the user-blessed walkthrough snapshot (v2.20.1).
 *
 * The synthetic D-series demo (utils/demo.ts, S22) understated the engine:
 * the real walkthrough fixture shows ZONAL deployment (the normal case),
 * spillover routing across server generations, a heterogeneous rack with a
 * utility node, and per-cluster buffers — "full functionality of the tool"
 * per the user. Every demo entry point now loads this snapshot.
 *
 * This module also owns `prepareSnapshotHydrate` — the ONE way to turn a
 * parsed FleetSnapshot into a HYDRATE payload. It fixes two long-standing
 * gaps in the raw `dispatch(HYDRATE, snap.data)` path:
 *   1. `ui.activeRegion` was never derived, so the engine + every $ rollup
 *      scoped against whatever region the browser last had (or none),
 *      mis-pricing the loaded fleet. We now derive it the same way the
 *      VM_REPLACE reducer does (first region per provider), then override
 *      from the snapshot's placed fleets (their region is the ground truth).
 *   2. A stale `state.result` from before the load survived the hydrate
 *      and kept rendering. We clear it.
 */
import type { AppState } from '../state/AppState';
import { fleetList } from '../state/AppState';
import {
  parseSnapshotJson,
  summarizeSnapshot,
  type FleetSnapshot,
} from './saveLoad';

export const DEMO_SNAPSHOT_URL = '/walkthrough-snapshot.json';

/** One-line description for menus, confirm dialogs, and the Simple empty
 *  state. Mirrors the committed fixture's actual contents. */
export const DEMO_SUMMARY =
  'Azure M-series · 3 server types · 1 region · 2 zones · 5 clusters · zonal BoM (184 VMs) with cross-generation spillover';

/** Hardware-group ids that identify the bundled demo scenario. Used to
 *  detect "the user is still looking at the demo" (the soft "load your own"
 *  prompt) — self-healing: any hardware edit breaks the signature. */
const DEMO_HW_IDS = ['2s', '8s', 'v1-2s-old'];

/** True while the loaded state IS the bundled demo scenario (by hardware
 *  signature). Replaces the old `id.startsWith('demo-')` check from the
 *  retired synthetic demo. */
export function isDemoFleet(state: Pick<AppState, 'userHardware'>): boolean {
  if (state.userHardware.length !== DEMO_HW_IDS.length) return false;
  const ids = new Set(state.userHardware.map((g) => g.id));
  return DEMO_HW_IDS.every((id) => ids.has(id));
}

export type DemoFetchResult =
  | { ok: true; snapshot: FleetSnapshot; summary: string }
  | { ok: false; error: string };

/** Fetch + parse the bundled demo snapshot from /public. Streams the ~30MB
 *  payload via the browser instead of bundling it. */
export async function fetchDemoSnapshot(): Promise<DemoFetchResult> {
  try {
    const res = await fetch(DEMO_SNAPSHOT_URL);
    if (!res.ok) {
      return { ok: false, error: `Could not fetch the demo scenario (HTTP ${res.status}).` };
    }
    const text = await res.text();
    const parsed = parseSnapshotJson(text);
    if (!parsed.ok || !parsed.snapshot) {
      return { ok: false, error: parsed.error ?? 'Could not parse the demo snapshot.' };
    }
    return { ok: true, snapshot: parsed.snapshot, summary: summarizeSnapshot(parsed.snapshot) };
  } catch (err) {
    return {
      ok: false,
      error: `Demo load failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }
}

/**
 * Turn a parsed snapshot into a complete HYDRATE payload.
 *
 * - Carries every snapshot slice through verbatim.
 * - Clears `result` (a result from the pre-load state would lie about the
 *   loaded fleet) and marks the state runnable.
 * - Derives `ui.activeRegion`: start from the user's current picks, fill
 *   any missing provider with the first region present in the snapshot's
 *   catalog (mirrors the VM_REPLACE reducer), then OVERRIDE each provider
 *   that has placed fleets in the snapshot with the fleets' modal region —
 *   the engine must scope to the region the fleet actually lives in.
 */
export function prepareSnapshotHydrate(
  snapshot: FleetSnapshot,
  state: AppState,
): Partial<AppState> {
  const data = snapshot.data;
  const activeRegion: Record<string, string> = { ...state.ui.activeRegion };

  // Fill missing providers from the snapshot catalog (first region seen).
  if (data.userVms) {
    const seen = new Set<string>();
    for (const v of data.userVms) {
      const p = v.provider || 'Other';
      if (seen.has(p) || !v.region) continue;
      seen.add(p);
      if (!activeRegion[p]) activeRegion[p] = v.region;
    }
  }

  // Override from placed fleets: provider (via the fleet's hardware group)
  // → modal region among that provider's fleets.
  const fleets = data.fleets && data.fleetOrder
    ? fleetList({ fleets: data.fleets, fleetOrder: data.fleetOrder })
    : [];
  const hardware = data.userHardware ?? state.userHardware;
  if (fleets.length > 0) {
    const counts = new Map<string, Map<string, number>>(); // provider → region → n
    for (const { fleet } of fleets) {
      if (!fleet.region) continue;
      const hw = hardware.find((g) => g.id === fleet.hardwareGroupId);
      const provider = hw?.provider || 'Other';
      let perRegion = counts.get(provider);
      if (!perRegion) {
        perRegion = new Map();
        counts.set(provider, perRegion);
      }
      perRegion.set(fleet.region, (perRegion.get(fleet.region) ?? 0) + 1);
    }
    for (const [provider, perRegion] of counts) {
      let best: string | undefined;
      let bestN = 0;
      for (const [region, n] of perRegion) {
        if (n > bestN) {
          best = region;
          bestN = n;
        }
      }
      if (best) activeRegion[provider] = best;
    }
  }

  // v2.23.1 — Stamp a region onto snapshot BoM lines that lack one, from the
  // derived activeRegion for the line's provider. Without this, demo / legacy
  // BoM rows carry no region of their own and fall back to the live picker —
  // so changing the region filter would drift the committed BoM (the BoM
  // should be fixed; the picker only steers NEW placements). Provider is
  // resolved from the catalog (region-independent).
  const catalogForBom = data.userVms ?? state.userVms;
  const provByName = new Map<string, string>();
  for (const v of catalogForBom) {
    const k = v.vmSizeName.toLowerCase();
    if (!provByName.has(k)) provByName.set(k, v.provider || 'Other');
  }
  const bom = (data.bom ?? state.bom).map((e) =>
    e.region
      ? e
      : { ...e, region: activeRegion[provByName.get(e.vmSizeName.toLowerCase()) || 'Other'] },
  );

  return {
    ...data,
    bom,
    result: null,
    isStale: false,
    selectedNodeIds: [],
    selectedStat: null,
    ui: { ...state.ui, activeRegion, scope: null },
  };
}

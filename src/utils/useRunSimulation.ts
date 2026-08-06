import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import { vmClass } from './vmTaxonomy';
import { buildAndRunSimulation } from './runEngine';

/**
 * v2.21 — Shared run orchestration for the Advanced shell.
 *
 * Extracted from RunFooter so the primary "Run simulation" action can live
 * in the top bar (dashboard doctrine: the top of the page is reserved for
 * important page actions) while any in-context run affordance reuses the
 * exact same behavior. The engine path is unchanged: ONE call to
 * buildAndRunSimulation(state) — the engine never forks.
 *
 * Post-run navigation is owned by the reducer (RUN_COMPLETE lands the shell
 * on the Results overview), NOT by this hook — so every caller gets the
 * same landing behavior for free.
 */
export interface FungibilityGap {
  pairCount: number;
  vmCount: number;
}

export function useRunSimulation(): {
  run: () => Promise<void>;
  /** True when a run can start (BoM non-empty + not already running). */
  canRun: boolean;
  /** Why `canRun` is false, in user words. Null when runnable. */
  blockedReason: string | null;
  isRunning: boolean;
  /** Inputs changed since the last run — results on screen may be stale. */
  stale: boolean;
  /** BoM × placed-cluster pairs with no authored fungibility cell. */
  fungibilityGap: FungibilityGap | null;
} {
  const { state, dispatch } = useApp();
  const stale = state.isStale && state.result !== null;
  const canRun = state.bom.length > 0 && !state.isRunning;
  const blockedReason = state.isRunning
    ? null
    : state.bom.length === 0
    ? 'Add VM demand first — open Setup › VM demand (or use Quick start).'
    : null;

  // v2.4 → v2.21 — proactive warning when the BoM × placed clusters overlap
  // an UNAUTHORED region of the fungibility matrix. Same logic RunFooter
  // carried; only when fungibility is on AND the matrix has ≥1 cell (so the
  // GCP-dedicated-host empty-matrix case isn't nagged).
  const fungibilityGap = (() => {
    if (!state.fungibilityOn) return null;
    const matrix = state.userFungibility;
    if (!matrix || Object.keys(matrix).length === 0) return null;
    const fleets = fleetList(state)
      .map(({ fleet }) => fleet)
      .filter((f) => !!f.hardwareGroupId);
    if (fleets.length === 0) return null;
    const missingPairs = new Set<string>();
    const missingVms = new Set<string>();
    for (const entry of state.bom) {
      const cat = state.userVms.find(
        (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
      );
      if (!cat) continue;
      // v2.19.17 — per-size routing: a pair is "missing" only when neither a
      // size-keyed nor a legacy class-keyed cell exists for it.
      const sizeKey = cat.vmSizeName;
      const vmClassKey = vmClass(cat);
      for (const f of fleets) {
        const hwId = f.hardwareGroupId!;
        const cell =
          matrix[sizeKey]?.[hwId] !== undefined
            ? matrix[sizeKey][hwId]
            : matrix[vmClassKey]?.[hwId];
        if (cell === undefined) {
          missingPairs.add(`${sizeKey}|${hwId}`);
          missingVms.add(cat.vmSizeName);
        }
      }
    }
    if (missingPairs.size === 0) return null;
    return { pairCount: missingPairs.size, vmCount: missingVms.size };
  })();

  const run = async () => {
    if (!canRun) return;
    dispatch({ type: 'RUN_START' });
    const start = performance.now();
    const result = buildAndRunSimulation(state);
    const elapsed = performance.now() - start;
    // Floor the perceived run at 400ms so the "Simulating…" state reads as
    // real work instead of a flicker.
    if (elapsed < 400) await new Promise((r) => setTimeout(r, 400 - elapsed));
    dispatch({ type: 'RUN_COMPLETE', result });
  };

  return { run, canRun, blockedReason, isRunning: state.isRunning, stale, fungibilityGap };
}

/**
 * Shared simulation orchestration (S25 — Simple/Advanced two-track).
 *
 * Both the Advanced RunFooter and the Simple track trigger the engine through
 * this one function so the marshalling (region-scoped catalog, vmClassByName,
 * live HW index) is identical and the engine is never forked. It wraps the
 * canonical `runMulti` — and
 * .
 */
import type { AppState } from '../state/AppState';
import { fleetList } from '../state/AppState';
import { runMulti } from '../components/RunFooter';
import { vmClass } from './vmTaxonomy';
import type { SimulatorResult, HardwareGroup, UserVm } from '../types';

/** v2.22.9 — The region each provider runs in, derived from the COMMITTED BoM
 *  (each line's stamped `region`, dominant by VM quantity) and falling back to
 *  the browse picker (`ui.activeRegion`) for providers the BoM doesn't pin.
 *  This is what makes the run stable against catalog-filter changes: once VMs
 *  are committed in a region, changing the picker to browse another region no
 *  longer re-targets or re-prices them. */
export function effectiveRegionByProvider(state: AppState): Record<string, string> {
  // A SKU's provider is region-independent — index it once.
  const provByName = new Map<string, string>();
  for (const v of state.userVms) {
    const k = v.vmSizeName.toLowerCase();
    if (!provByName.has(k)) provByName.set(k, v.provider || 'Other');
  }
  // Tally each provider's stamped BoM regions, weighted by quantity.
  const counts: Record<string, Map<string, number>> = {};
  for (const e of state.bom) {
    if (!e.region) continue;
    const p = provByName.get(e.vmSizeName.toLowerCase()) ?? 'Other';
    (counts[p] ??= new Map()).set(e.region, (counts[p].get(e.region) ?? 0) + e.quantity);
  }
  const out: Record<string, string> = { ...state.ui.activeRegion };
  for (const p of Object.keys(counts)) {
    let best: string | undefined;
    let bestN = -1;
    for (const [r, n] of counts[p]) {
      if (n > bestN) {
        bestN = n;
        best = r;
      }
    }
    if (best) out[p] = best; // committed BoM wins over the browse picker
  }
  return out;
}

/** Region-scope the catalog so the same SKU in two regions doesn't race for
 *  the same engine lookup key. The per-provider region comes from
 *  `effectiveRegionByProvider` (committed BoM first, picker as fallback).
 *  Providers with no resolved region pass through. Exported (v3 S26+) so every
 *  $ rollup that prices a result uses the SAME rates the engine placed
 *  against — a multi-region seed otherwise makes by-name rate lookups
 *  arbitrary (last region wins). */
export function regionScopedCatalog(state: AppState): UserVm[] {
  const want = effectiveRegionByProvider(state);
  return state.userVms.filter((v) => {
    const p = v.provider || 'Other';
    const w = want[p];
    if (!w) return true;
    return (v.region ?? '') === w;
  });
}

export function buildAndRunSimulation(state: AppState): SimulatorResult {
  const scopedCatalog = regionScopedCatalog(state);
  const vmClassByName: Record<string, string> = {};
  for (const v of scopedCatalog) vmClassByName[v.vmSizeName] = vmClass(v);
  // Live HW index so runMulti resolves per-cluster buffer + HW spec from the
  // library (single source of truth) rather than a stale placement snapshot.
  const hwById: Record<string, HardwareGroup> = {};
  for (const g of state.userHardware) hwById[g.id] = g;
  return runMulti(
    fleetList(state),
    state.bom,
    state.buffer,
    state.packingMode,
    state.fungibilityOn,
    scopedCatalog,
    state.userFungibility,
    vmClassByName,
    hwById,
  );
}

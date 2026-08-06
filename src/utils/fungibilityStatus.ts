/**
 * v2.19.14 — Fungibility-coverage helpers.
 *
 * The Fungibility tab authors a `[vmClass][hwGroupId] → priority | 'blocked'`
 * matrix. The rest of the app needs cheap derived answers:
 *
 *   • For a given hardware group, has the user authored ANY accepting cell
 *     (Home or Spillover) for it? — surfaces as Fleet Builder + Sidebar alerts.
 *   • For a given VM class in the BoM, is there ANY accepting cell that
 *     routes it to a hardware group currently placed in the fleet? — surfaces
 *     as a BoM row warning.
 *   • Whole-fleet rollup: how many placed HW groups are uncovered, how many
 *     BoM VM classes are unroutable? — drives the global ⚠ on the Sidebar
 *     Fungibility tab.
 *
 * Helpers DO NOT consult the engine — they're pure derivations off
 * `state.userFungibility`, `state.fleets`, `state.bom`, `state.userVms`. Cheap
 * to call on every render.
 */
import type { BomEntry, CatalogEntry, FleetSpec, HardwareGroup } from '../types';
import type { AppState } from '../state/AppState';
import { vmClass } from './vmTaxonomy';

export type FungibilityMatrix = Record<string, Record<string, number | 'blocked'>>;

/**
 * Status of a single hardware group. `accepting` counts Home/Spillover cells;
 * `blocked` counts explicit refusals (rare but possible).
 */
export interface HardwareFungibilityStatus {
  /** True if at least one VM class has an authored Home or Spillover cell
   *  for this hardware. */
  hasAccepting: boolean;
  acceptingCount: number;
  blockedCount: number;
}

export function hardwareFungibilityStatus(
  hwId: string,
  matrix: FungibilityMatrix,
): HardwareFungibilityStatus {
  let accepting = 0;
  let blocked = 0;
  for (const vmKey of Object.keys(matrix)) {
    const v = matrix[vmKey]?.[hwId];
    if (v === undefined || v === null) continue;
    if (v === 'blocked') blocked++;
    else accepting++;
  }
  return { hasAccepting: accepting > 0, acceptingCount: accepting, blockedCount: blocked };
}

/**
 * Unique HW group IDs currently placed in the fleet (rackCount > 0). Used
 * as the "in-scope" set when checking whether a BoM VM is routable. Includes
 * HW groups with zero racks as well, because the user is mid-config.
 */
export function placedHardwareIds(state: Pick<AppState, 'fleets'>): Set<string> {
  const ids = new Set<string>();
  for (const f of Object.values(state.fleets) as FleetSpec[]) {
    if (f.hardwareGroupId) ids.add(f.hardwareGroupId);
  }
  return ids;
}

/**
 * Resolve a BoM entry's VM class key by looking up the catalog entry. Returns
 * null when the SKU isn't in the catalog (separate `VM_SIZE_NOT_FOUND`
 * concern handled elsewhere).
 */
export function bomVmClassKey(
  entry: BomEntry,
  catalog: CatalogEntry[],
): string | null {
  const found = catalog.find((c) => c.vmSizeName === entry.vmSizeName);
  if (!found) return null;
  return vmClass(found);
}

/**
 * v2.19.17 — Per-size routable check. Mirrors the engine's resolution: a VM is
 * routable when a size-keyed Home/Spillover cell exists for any in-fleet HW,
 * OR (legacy fallback) a class-keyed cell does. `classKey` may be null when
 * the SKU isn't in the catalog — then only the size key is consulted.
 *
 * An empty matrix returns `true` (engine uses the legacy homeFor fallback; the
 * row isn't necessarily broken — the per-HW amber cues cover that case).
 */
export function vmSizeRoutableTo(
  sizeKey: string,
  classKey: string | null,
  matrix: FungibilityMatrix,
  hardwareIds: Set<string>,
): boolean {
  if (Object.keys(matrix).length === 0) return true;
  if (hardwareIds.size === 0) return false;
  const sizeRow = matrix[sizeKey];
  const classRow = classKey ? matrix[classKey] : undefined;
  if (!sizeRow && !classRow) return false;
  for (const hwId of hardwareIds) {
    let v: number | 'blocked' | undefined = sizeRow?.[hwId];
    if (v === undefined) v = classRow?.[hwId];
    if (v === undefined || v === null) continue;
    if (v === 'blocked') continue;
    return true;
  }
  return false;
}

export interface FleetFungibilityCoverage {
  /** True if state has clusters AND the matrix is fully empty. Indicates the
   *  user hasn't started authoring yet — the engine will fall back to legacy
   *  homeFor routing, but the workflow expects matrix-first now. */
  matrixEmpty: boolean;
  /** Placed HW IDs that have NO accepting cells in the matrix. */
  uncoveredHardware: string[];
  /** BoM SKUs that resolve to a vmClass with no eligible (in-fleet) HW. */
  unroutableSkus: string[];
  /** Total placed HW IDs (denominator for "N of M covered" displays). */
  placedHardwareCount: number;
  /** Total BoM rows considered (denominator for the BoM rollup). */
  bomRowCount: number;
}

export function fleetFungibilityCoverage(
  state: Pick<AppState, 'fleets' | 'bom' | 'userFungibility' | 'userVms' | 'userHardware'>,
): FleetFungibilityCoverage {
  const matrix = state.userFungibility as FungibilityMatrix;
  const matrixEmpty = Object.keys(matrix).length === 0;
  const placed = placedHardwareIds(state);
  const uncoveredHardware: string[] = [];
  for (const hwId of placed) {
    if (!hardwareFungibilityStatus(hwId, matrix).hasAccepting) {
      uncoveredHardware.push(hwId);
    }
  }
  const unroutableSkus: string[] = [];
  for (const row of state.bom) {
    const cls = bomVmClassKey(row, state.userVms);
    if (!cls) continue; // unknown SKU — separate concern
    // v2.19.17 — per-size routing: size key first, class as fallback.
    if (!vmSizeRoutableTo(row.vmSizeName, cls, matrix, placed)) {
      unroutableSkus.push(row.vmSizeName);
    }
  }
  return {
    matrixEmpty,
    uncoveredHardware,
    unroutableSkus,
    placedHardwareCount: placed.size,
    bomRowCount: state.bom.length,
  };
}

/**
 * Convenience for the Sidebar tab dot — quick boolean: should we amber-flag
 * the Fungibility tab? True when the user has placed hardware and either
 * (a) the matrix is empty, or (b) any placed HW group is uncovered, or
 * (c) any BoM SKU is unroutable.
 */
export function fungibilityNeedsAttention(
  state: Pick<AppState, 'fleets' | 'bom' | 'userFungibility' | 'userVms' | 'userHardware'>,
): boolean {
  const cov = fleetFungibilityCoverage(state);
  if (cov.placedHardwareCount === 0) return false;
  if (cov.matrixEmpty) return true;
  if (cov.uncoveredHardware.length > 0) return true;
  if (cov.unroutableSkus.length > 0) return true;
  return false;
}

/**
 * Per-(BoM SKU × placed HW) cell-presence gap. Mirrors the RunFooter banner
 * (`fungibilityGap`) so the Sidebar tab dot can fire on the same condition
 * the user is already being warned about above the Run button. A pair is
 * "missing" when neither a size-keyed nor a class-keyed cell exists. Returns
 * null when there's nothing to author against (no BoM, no placed HW, or
 * matrix entirely empty — those are covered by the broader
 * fungibilityNeedsAttention signal).
 */
export function fungibilityUnauthoredPairs(
  state: Pick<AppState, 'fleets' | 'bom' | 'userFungibility' | 'userVms'>,
): { vmCount: number; pairCount: number } | null {
  const matrix = state.userFungibility as FungibilityMatrix;
  if (!matrix || Object.keys(matrix).length === 0) return null;
  const placed: { hwId: string }[] = [];
  for (const f of Object.values(state.fleets) as FleetSpec[]) {
    if (f.hardwareGroupId) placed.push({ hwId: f.hardwareGroupId });
  }
  if (placed.length === 0 || state.bom.length === 0) return null;
  const missingPairs = new Set<string>();
  const missingVms = new Set<string>();
  for (const entry of state.bom) {
    const cat = state.userVms.find(
      (c) => c.vmSizeName.toLowerCase() === entry.vmSizeName.toLowerCase(),
    );
    if (!cat) continue;
    const sizeKey = cat.vmSizeName;
    const classKey = vmClass(cat);
    const seenHw = new Set<string>();
    for (const f of placed) {
      if (seenHw.has(f.hwId)) continue;
      seenHw.add(f.hwId);
      const cell =
        matrix[sizeKey]?.[f.hwId] !== undefined
          ? matrix[sizeKey][f.hwId]
          : matrix[classKey]?.[f.hwId];
      if (cell === undefined) {
        missingPairs.add(`${sizeKey}|${f.hwId}`);
        missingVms.add(cat.vmSizeName);
      }
    }
  }
  if (missingPairs.size === 0) return null;
  return { vmCount: missingVms.size, pairCount: missingPairs.size };
}

/** Hardware name lookup helper for tooltips/labels. */
export function hwNameById(
  hwId: string,
  groups: HardwareGroup[],
  fallback?: string,
): string {
  return groups.find((g) => g.id === hwId)?.name ?? fallback ?? hwId;
}

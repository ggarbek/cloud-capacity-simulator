/**
 * useBomPort — the SINGLE React entry point for cross-cloud BoM porting.
 *
 * Before this hook, `portBom(...)` was called ad-hoc in two places with the
 * term hardcoded to `'payg'` (the `bomRowVms` memo in CompetitivePage and the
 * internal memo in PortedBomTable), so a user on a 1yr / 3yr commitment saw
 * PAYG-priced ports regardless of the term they'd picked. This hook wraps the
 * one pure `portBom` call in a `useMemo` and threads the caller's `term`
 * through — so BoM porting is now term-aware, and both consumers share one
 * memoized result instead of each re-running the engine.
 *
 * Behavior is otherwise identical to the prior call sites: estimate-on stays
 * `true` (the existing `bomRowVms` behavior), and the result is null when the
 * feature is disabled (`!enabled`) or the BoM is empty — so callers can skip
 * rendering without a wasted port.
 */
import { useMemo } from 'react';
import type { BomEntry, CatalogEntry } from '../../types';
import { portBom, type BomPortResult, type Term } from '../../utils/bomPort';

/**
 * Memoized cross-cloud BoM port. Returns `null` when `!enabled` or the BoM is
 * empty; otherwise the full `BomPortResult` (base + one scenario per target)
 * priced at `term`.
 */
export function useBomPort(
  bom: BomEntry[],
  userVms: CatalogEntry[],
  base: string,
  targets: string[],
  term: Term,
  enabled: boolean,
): BomPortResult | null {
  return useMemo(() => {
    if (!enabled || bom.length === 0) return null;
    return portBom(bom, userVms, base, targets, term, true);
  }, [bom, userVms, base, targets, term, enabled]);
}

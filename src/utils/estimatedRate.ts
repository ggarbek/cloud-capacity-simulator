/**
 * Estimated reserved-instance rates (v2.26.1) — an OPT-IN fallback for the VM
 * Catalog when a cloud doesn't publish a real 1yr/3yr reserved rate for a
 * (SKU, region). The real rate genuinely doesn't exist upstream (edge zones,
 * brand-new families, Azure Basic tier / constrained-vCPU SKUs, Jio India) — so
 * the only way to show a number is to ESTIMATE it from PAYG.
 *
 * The factor is MEASURED, not guessed: the median of (RI ÷ PAYG) across every
 * catalog row that DOES carry both rates, per provider (computed 2026-06-22 over
 * ~16.7k AWS / ~64.6k Azure / 6.2k GCP rows). An estimate is always badged
 * "est." in the UI and never replaces a real rate. Off by default (the
 * no-fabrication doctrine); the user opts in via `ui.estimateMissingRates`.
 */
import type { CatalogEntry } from '../types';
import type { RateType } from '../engine/insights';

/** Median RI÷PAYG by provider — measured from rows carrying both rates. */
const RI_FACTORS: Record<string, { ri1y: number; ri3y: number }> = {
  AWS: { ri1y: 0.63, ri3y: 0.43 },
  Azure: { ri1y: 0.59, ri3y: 0.38 },
  GCP: { ri1y: 0.63, ri3y: 0.45 },
  // Fallback for any other/custom provider — the cross-cloud average.
  _: { ri1y: 0.62, ri3y: 0.42 },
};

export interface ResolvedRate {
  /** Hourly USD, or undefined when unknown and not estimated. */
  value: number | undefined;
  /** True when `value` was estimated from PAYG (not a published rate). */
  estimated: boolean;
}

/**
 * Resolve the display rate for a catalog row at the chosen basis.
 *  - PAYG: always the real value.
 *  - RI: the published rate if present; else, when `estimateOn`, PAYG × the
 *    provider's median discount (flagged `estimated`); else undefined.
 */
export function resolveDisplayRate(
  vm: CatalogEntry,
  rate: RateType,
  estimateOn: boolean,
): ResolvedRate {
  if (rate === 'payg') return { value: vm.hourlyUsd, estimated: false };
  const real = rate === 'ri1y' ? vm.riOneYrHourlyUsd : vm.riThreeYrHourlyUsd;
  if (real != null) return { value: real, estimated: false };
  if (!estimateOn || vm.hourlyUsd == null) return { value: undefined, estimated: false };
  const f = RI_FACTORS[vm.provider ?? '_'] ?? RI_FACTORS._;
  const factor = rate === 'ri1y' ? f.ri1y : f.ri3y;
  return { value: Math.round(vm.hourlyUsd * factor * 1e6) / 1e6, estimated: true };
}

/** The discount factors, exposed for the UI's explanatory copy. */
export function riFactorsFor(provider: string | undefined): { ri1y: number; ri3y: number } {
  return RI_FACTORS[provider ?? '_'] ?? RI_FACTORS._;
}

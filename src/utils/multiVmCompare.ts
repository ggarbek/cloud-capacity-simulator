/**
 * Pure row-builder for the true multi-VM cross-cloud compare table.
 *
 * Given a list of base-cloud VM *size names*, a base provider, and the full
 * VM catalog, it resolves each base size's `CatalogEntry`, then finds the
 * closest same-category analog on each OTHER cloud via the shared
 * `bestVmMatch` engine — mirroring `VmEquivalencyTable`'s anchor-based
 * model (same category is a hard gate; no match ⇒ a real product gap).
 *
 * Kept React-free so the row-builder can be unit-tested directly.
 */
import type { CatalogEntry } from '../types';
import { categorize } from './vmCategory';
import { bestVmMatch, matchPct, type VmMatch } from './equivalence';

export type CompareProvider = 'AWS' | 'GCP' | 'Azure';
export const COMPARE_COLS: CompareProvider[] = ['AWS', 'GCP', 'Azure'];

/** Closest analog on one other cloud + its 0–100 similarity to the base. */
export interface CompareAnalog {
  vm: CatalogEntry;
  pct: number;
}

/** One base VM and its closest analog on each non-base cloud. */
export interface CompareRow {
  base: CatalogEntry;
  baseProvider: CompareProvider;
  category: string;
  /** Keyed by the OTHER two providers; null = no same-category analog (gap). */
  analogs: Record<CompareProvider, CompareAnalog | null>;
}

function cat(v: CatalogEntry): string {
  return v.category ?? categorize(v.provider, v.family);
}

/**
 * Distinct specs per provider, deduped by size name (specs are region-free),
 * exactly the candidate sets `VmEquivalencyTable` builds.
 */
export function specsByProvider(
  catalog: CatalogEntry[],
): Record<CompareProvider, CatalogEntry[]> {
  const out: Record<CompareProvider, CatalogEntry[]> = { AWS: [], GCP: [], Azure: [] };
  const seen: Record<CompareProvider, Set<string>> = {
    AWS: new Set(),
    GCP: new Set(),
    Azure: new Set(),
  };
  for (const v of catalog) {
    const p = v.provider as CompareProvider;
    if (!COMPARE_COLS.includes(p)) continue;
    if (seen[p].has(v.vmSizeName)) continue;
    seen[p].add(v.vmSizeName);
    out[p].push(v);
  }
  return out;
}

/** Resolve a single base size name to its `CatalogEntry` on the base cloud. */
export function resolveBaseEntry(
  sku: string,
  baseProvider: CompareProvider,
  specs: Record<CompareProvider, CatalogEntry[]>,
): CatalogEntry | null {
  return specs[baseProvider].find((v) => v.vmSizeName === sku) ?? null;
}

/**
 * Build one compare row for a base size: resolve the base entry, then the
 * closest analog on each of the other two clouds. Returns null when the base
 * size can't be resolved (so callers can skip it).
 */
export function buildCompareRow(
  sku: string,
  baseProvider: CompareProvider,
  specs: Record<CompareProvider, CatalogEntry[]>,
): CompareRow | null {
  const base = resolveBaseEntry(sku, baseProvider, specs);
  if (!base) return null;
  const targets = COMPARE_COLS.filter((p) => p !== baseProvider);
  const analogs: Record<CompareProvider, CompareAnalog | null> = {
    AWS: null,
    GCP: null,
    Azure: null,
  };
  for (const t of targets) {
    const m: VmMatch | null = bestVmMatch(base, specs[t]);
    analogs[t] = m ? { vm: m.vm, pct: matchPct(m.distance) } : null;
  }
  return { base, baseProvider, category: cat(base), analogs };
}

/**
 * Build every compare row for a list of base sizes (deduped, order preserved).
 * Rows whose base can't be resolved are dropped.
 */
export function buildCompareRows(
  skus: string[],
  baseProvider: CompareProvider,
  catalog: CatalogEntry[],
): CompareRow[] {
  const specs = specsByProvider(catalog);
  const seen = new Set<string>();
  const rows: CompareRow[] = [];
  for (const sku of skus) {
    if (seen.has(sku)) continue;
    seen.add(sku);
    const row = buildCompareRow(sku, baseProvider, specs);
    if (row) rows.push(row);
  }
  return rows;
}

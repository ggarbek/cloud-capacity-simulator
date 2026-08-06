/**
 * Shared VM-taxonomy helpers — used by the Configure-tab BOM filter, the
 * VmAutocomplete picker, and the VMs tab. Keeping them in one place avoids
 * the "VmTab does it one way, Configure does it another" drift trap.
 */
import type { CatalogEntry } from '../types';

export interface ProviderTheme {
  label: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
}

/** Brand-tinted glass for provider pills. Keep in sync with VmTab.tsx — the
 *  same palette is used in both the inputs (here) and the inventory view. */
export const PROVIDER_THEMES: Record<string, ProviderTheme> = {
  Azure: {
    label: 'Azure',
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(96, 165, 250, 0.55)',
    text: '#93C5FD',
    glow: 'rgba(59, 130, 246, 0.45)',
  },
  AWS: {
    label: 'AWS',
    bg: 'rgba(249, 115, 22, 0.14)',
    border: 'rgba(251, 146, 60, 0.55)',
    text: '#FDBA74',
    glow: 'rgba(249, 115, 22, 0.45)',
  },
  GCP: {
    label: 'GCP',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(248, 113, 113, 0.55)',
    text: '#FCA5A5',
    glow: 'rgba(239, 68, 68, 0.45)',
  },
  // "Custom" is the escape-hatch provider for users experimenting with their
  // own hardware/VM mix that doesn't fit a public cloud. Uses the interactive
  // green so it visually reads as the user's own data rather than a brand.
  Custom: {
    label: 'Custom',
    bg: 'rgba(129, 140, 248, 0.14)',
    border: 'rgba(134, 239, 172, 0.55)',
    text: '#86EFAC',
    glow: 'rgba(129, 140, 248, 0.45)',
  },
};

export const PROVIDER_ORDER = ['Azure', 'AWS', 'GCP', 'Custom'] as const;

export function providerOf(v: CatalogEntry): string {
  return v.provider || 'Other';
}

/** v2.17.17 — Azure memory-category short labels. Hoisted above
 *  `vmFamily()` so the M-series compound slug logic can reach them.
 *  Mirrors `azureMSeriesSeed.ts` `memoryCategoryLabel()` thresholds. */
const AZURE_MEM_SHORT: Record<string, 'MM' | 'HM' | 'VHM'> = {
  'Medium Memory (MM)': 'MM',
  'High Memory (HM)': 'HM',
  'Very High Memory (VHM)': 'VHM',
};

/**
 * v2.25.4 — Azure M-series PUBLIC sub-series, derived from the SKU name.
 *
 * Replaces the old internal "tier × generation" compound slug (`MM Mv1`,
 * `HM Mv2`…) with Microsoft's own published series taxonomy. The seed file
 * (azureMSeriesSeed.ts) maps 1:1 to these seven series lines; deriving from
 * the SKU means it also covers user uploads and live-loaded rows.
 *
 *   - `M`        original M-series (no version suffix) — Haswell/Cascade
 *   - `Msv2`     Cascade-Lake diskless + the Skylake M208/M416 (no `d`)
 *   - `Mdsv2`    Cascade-Lake with local disk (`d`)
 *   - `Msv3`     Sapphire Rapids diskless
 *   - `Mdsv3`    Sapphire Rapids with local disk (`d`)
 *   - `Mbsv3`    storage-boosted Sapphire Rapids (`b`)
 *   - `Mbdsv3`   storage-boosted Sapphire Rapids with local disk (`b`+`d`)
 */
export type AzureMSub = 'M' | 'Msv2' | 'Mdsv2' | 'Msv3' | 'Mdsv3' | 'Mbsv3' | 'Mbdsv3';

export function azureMSubSeries(vmSizeName: string): AzureMSub | null {
  const s = (vmSizeName || '').replace(/^Standard[_-]/i, '');
  if (!/^M\d/.test(s)) return null; // not an M-number size
  const ver = s.match(/_v(\d)/);
  if (!ver) return 'M'; // original M-series — no `_vN` suffix
  // Feature letters come AFTER the leading "M<number>" run and an optional
  // constrained-core "-<number>" segment. Constrained SKUs belong to the SAME
  // series as their unconstrained parent, so the dash must be skipped:
  //   M416ds_v3        → "ds"
  //   M128-64bds_v3    → "bds"   (was wrongly "" → Msv3; really Mbdsv3)
  //   M96-48bds_2_v3   → "bds"   (constrained Mbdsv3)
  //   M64-32bds_1_v3   → "bds"
  // Drop the leading "M<digits>" and any "-<digits>" constrained span, then the
  // letters that follow (before the next digit / underscore) are the features.
  const tail = s.replace(/^M\d+(?:-\d+)?/i, '');
  const letters = (tail.match(/^[a-z]*/i)?.[0] ?? '').toLowerCase();
  const boosted = letters.includes('b');
  const disk = letters.includes('d');
  if (ver[1] === '3') {
    if (boosted) return disk ? 'Mbdsv3' : 'Mbsv3';
    return disk ? 'Mdsv3' : 'Msv3';
  }
  // `_v2` — Cascade-Lake MM + Skylake M208/M416 HM (both diskless → Msv2).
  return disk ? 'Mdsv2' : 'Msv2';
}

const M_TIER_WORD: Record<'MM' | 'HM' | 'VHM', string> = {
  MM: 'Medium',
  HM: 'High',
  VHM: 'Very High',
};

/** Public Microsoft series label for an Azure M-series row — e.g.
 *  "Msv3 Medium Memory series", "Mbsv3 Medium Memory series", "M series".
 *  null for non-M. */
export function azureMFamilyLabel(entry: CatalogEntry): string | null {
  const sub = azureMSubSeries(entry.vmSizeName);
  if (!sub) return null;
  if (sub === 'M') return 'M series';
  // Mbsv3/Mbdsv3 (the memory-BANDWIDTH-boosted v3 SKUs) carry their memory
  // tier just like Msv3/Mdsv3 — their capacity is Medium (≤4 TiB), so they read
  // "Mbsv3 Medium Memory series", consistent with the rest. The `b` is a
  // bandwidth boost, NOT a separate memory tier.
  const tier = AZURE_MEM_SHORT[entry.memoryCategory] ?? 'MM';
  return `${sub} ${M_TIER_WORD[tier]} Memory series`;
}

/** Fungibility routing key for an Azure M-series row — one stable key per
 *  public series (1:1 with the family label) so each series routes
 *  independently. e.g. "Msv3-MM", "Mdsv3-VHM", "Mbsv3", "M". null for non-M. */
export function azureMClassKey(entry: CatalogEntry): string | null {
  const sub = azureMSubSeries(entry.vmSizeName);
  if (!sub) return null;
  if (sub === 'M') return 'M';
  if (sub === 'Mbsv3' || sub === 'Mbdsv3') return sub;
  const tier = AZURE_MEM_SHORT[entry.memoryCategory] ?? 'MM';
  return `${sub}-${tier}`;
}

/** Family-chip display order — grouped by memory tier (Medium → High → Very
 *  High) then the Mb family, mirroring Microsoft's docs navigation. Drives
 *  `compareFamily`. */
export const AZURE_M_FAMILY_ORDER: string[] = [
  'M series',
  'Msv2 Medium Memory series',
  'Mdsv2 Medium Memory series',
  'Msv3 Medium Memory series',
  'Mdsv3 Medium Memory series',
  'Msv2 High Memory series',
  'Msv3 High Memory series',
  'Mdsv3 High Memory series',
  'Mdsv3 Very High Memory series',
  'Mbsv3 Medium Memory series',
  'Mbdsv3 Medium Memory series',
];
const M_FAMILY_RANK: Record<string, number> = Object.fromEntries(
  AZURE_M_FAMILY_ORDER.map((f, i) => [f, i]),
);

/** True when `family` is one of the Azure M-series public series labels
 *  emitted by `vmFamily()`. (Name kept for back-compat with callers; the
 *  matcher now recognizes the public-series taxonomy, not the retired
 *  "MM Mv1" compound slug.) */
export function isAzureMCompoundFamily(family: string): boolean {
  return family in M_FAMILY_RANK;
}

/**
 * VM family slug — what the Configure-tab pills group on.
 *
 * For most Azure families the convention is family-letters-then-digit:
 *   Standard_E32_v5    → "E"
 *   Standard_Eb32_v5   → "Eb"
 *   Standard_EC8eds_v5 → "EC"
 * Captures leading letters (greedy) up to the first digit so multi-letter
 * families like Eb / EC / DC come through intact.
 *
 * **v2.25.4 — Azure M-series uses Microsoft's PUBLIC series taxonomy.** Each
 * SKU maps to its published series line crossed with the memory tier, exactly
 * as Microsoft Learn documents it (replacing the old internal "MM Mv1" /
 * "HM Mv2" compound slug, which read as internal jargon on a public tool):
 *   `Standard_M8ms`          → "M series"                       (original)
 *   `Standard_M32ms_v2`      → "Msv2 Medium Memory series"      (Cascade 8280)
 *   `Standard_M416ms_v2`     → "Msv2 High Memory series"        (Skylake)
 *   `Standard_M12ds_v3`      → "Mdsv3 Medium Memory series"     (Sapphire +disk)
 *   `Standard_M832is_16_v3`  → "Msv3 High Memory series"        (Sapphire)
 *   `Standard_M16bs_v3`      → "Mbsv3 Medium Memory series"     (bandwidth-boosted)
 *   `Standard_M896ixds_32_v3`→ "Mdsv3 Very High Memory series"  (8490H, 32 TB)
 * See `azureMFamilyLabel` / `azureMSubSeries` for the derivation.
 *
 * For non-Azure providers (AWS m7i, GCP n2) the explicit `family` column
 * in the uploaded VM template is authoritative — no special handling.
 */
export function vmFamily(entry: CatalogEntry): string {
  const provider = providerOf(entry);
  if (provider === 'Azure' || /^Standard[_-]/i.test(entry.vmSizeName)) {
    const stripped = entry.vmSizeName.replace(/^Standard[_-]/i, '');
    const m = stripped.match(/^([A-Za-z]+)\d/);
    if (m) {
      const baseFamily = m[1];
      if (baseFamily === 'M') {
        // v2.25.4 — Public Microsoft series label (e.g. "Msv3 Medium Memory
        // series"). Falls back to plain "M" for a malformed row.
        return azureMFamilyLabel(entry) ?? baseFamily;
      }
      return baseFamily;
    }
  }
  return entry.family || 'Other';
}

/** Stable display order for the family pill row.
 *
 * v2.25.4 ordering rules:
 *   1. Azure M-series public series labels sort to the TOP, in
 *      `AZURE_M_FAMILY_ORDER` (memory tier Medium → High → Very High, then
 *      the Mb family) — they're the dense, high-value family group.
 *   2. Other Azure families: single-letter (E, D, F…) before multi-letter
 *      (Eb, EC, DC…), then alphabetical inside each tier.
 *   3. AWS/GCP families: alphabetical.
 */
export function compareFamily(a: string, b: string): number {
  const ra = M_FAMILY_RANK[a];
  const rb = M_FAMILY_RANK[b];
  const aIsM = ra !== undefined;
  const bIsM = rb !== undefined;
  if (aIsM && bIsM) return ra - rb;
  if (aIsM) return -1;
  if (bIsM) return 1;
  // Single-letter families (E, D…) sort ahead of multi-letter (Eb, EC).
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}

/**
 * MM / HM / VHM category buckets are an Azure M-Series concept — Microsoft is
 * the only vendor that markets a VM line by memory class. When the BOM filter
 * is scoped to anything else (a different provider, or Azure with a non-M
 * family), the MM/HM/VHM section pills shouldn't show. BomSection falls back
 * to a single flat family-grouped panel.
 *
 * Returns true when the current Configure-tab filter still includes Azure
 * M-Series:
 *   - provider is Azure (or unset on first run, which defaults to Azure)
 *   - family filter is either empty (= all families for Azure) or includes "M"
 */
export function isMSeriesScope(provider: string | null, families: string[]): boolean {
  if (provider != null && provider !== 'Azure') return false;
  if (families.length === 0) return true;
  // v2.17.17 — Match the legacy bare "M" slug AND any compound M slug
  // (`MM Mv1` / `HM Mv2` / `VHM Mv3` etc.) so the M-series UX still
  // activates after the split.
  return families.some((f) => f === 'M' || isAzureMCompoundFamily(f));
}

// ────────────────────────────────────────────────────────────────────────
// VM Class — the routing key the Fungibility matrix uses.
//
// Azure M-series: one key per PUBLIC series (Msv3-MM, Mdsv3-HM, Mbsv3, M…)
// via `azureMClassKey`, 1:1 with the family label so each series is
// independently routable. Other Azure families: `${generation}-${MM|HM|VHM}`.
// AWS / GCP: family is already the right granularity ("m7i", "n2-standard").
// Custom / unknown: falls back to family then to vmSizeName so EVERY VM gets
// a stable, deterministic class key.
// ────────────────────────────────────────────────────────────────────────

// (AZURE_MEM_SHORT moved to the top of this file — v2.17.17.)

export function vmClass(entry: CatalogEntry): string {
  const provider = providerOf(entry);
  if (provider === 'Azure') {
    // v2.25.4 — Azure M-series routes one class per public series (1:1 with
    // the family label) so Msv3 / Mdsv3 / Mbsv3 are independently routable.
    const mKey = azureMClassKey(entry);
    if (mKey) return mKey;
    const memShort = AZURE_MEM_SHORT[entry.memoryCategory];
    const gen = entry.vmGeneration || vmFamily(entry);
    if (gen && memShort) return `${gen}-${memShort}`;
    if (gen) return gen;
  }
  // Non-Azure: trust the explicit family column.
  if (entry.family) return entry.family;
  // Last-resort fallback so we never return empty (matrix cells need a stable key).
  return vmFamily(entry) || entry.vmSizeName;
}


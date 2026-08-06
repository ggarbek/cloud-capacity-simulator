/**
 * dataHealth — surface the baked shard manifest as a per-cloud health summary.
 *
 * The refresh pipeline embeds `public/rates/_manifest.json` into the baked
 * catalog as `GENERATED.health` (see scripts/ingest/build-manifests.mjs +
 * build-live-catalog.mjs). This module reads that manifest — no fetch, no
 * recompute — and exposes it as a flat, display-ready row per cloud, plus a
 * cheap `isStale` check. All functions degrade gracefully when the manifest is
 * absent (an older build, or a `build-live-catalog` run that preceded the
 * manifest step): `dataHealth()` returns `[]` and `isStale()` returns false.
 */
import GENERATED from './liveCatalog.generated.json';
import { AZURE_PROCESSOR_MAP, azureProcessorFor } from './azureProcessorMap';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ManifestCloud {
  specs?: { rows?: number; coverage?: { processorPct?: number; networkPct?: number } };
  rates?: { rows?: number; newestGeneratedAt?: string; oldestGeneratedAt?: string };
  join?: { ratesWithoutSpec?: number };
}

// ── Effective (runtime) Azure processor coverage ────────────────────────────
// The shard manifest reports Azure `processorPct` = 0: the Azure Resource SKUs
// API publishes NO processor string, so the raw shard legitimately carries none
// (see azureProcessorMap.ts). But the APP does not show 0% — at join time every
// Azure size resolves its silicon from the curated `azureProcessorFor` map
// (keyed by de-featured family + version + arch variant). "Effective" coverage
// is that runtime figure: the fraction of Azure spec SKUs whose family's silicon
// is curated (or that already carry a vendor string). Computed here from the
// baked catalog's own Azure spec roster so the FAQ can report the honest number
// the user actually sees, not the misleading raw-shard 0%.

/** Azure compound families that ARE their own family key in the curated map
 *  (they are not a single leading letter + a storage/feature letter). */
const AZURE_COMPOUND_FAMILIES = ['DC', 'EC', 'NC', 'ND', 'NV', 'HB', 'HC', 'HX'];

/** The curated map's family prefixes (the `${FAMILY}` half of every key). */
const CURATED_AZURE_FAMILIES = new Set(
  Object.keys(AZURE_PROCESSOR_MAP).map((k) => k.split('|')[0]),
);

/** The de-featured family for an Azure SKU — the same normalization the curated
 *  map keys on (its feature letters, e.g. the `s`/`d` in DS / GS, are NOT part
 *  of the family). Returns null for non-Azure-canonical names. */
function azureFamilyBase(sku: string): string | null {
  if (!/^Standard_/i.test(sku)) return null;
  const name = sku.replace(/^Standard_/i, '');
  const m = name.match(/^([A-Za-z]+?)\d/);
  if (!m) return null;
  const letters = m[1].toUpperCase();
  for (const c of AZURE_COMPOUND_FAMILIES) {
    if (letters.startsWith(c)) return c;
  }
  return letters[0]; // single-letter family (DS → D, GS → G, Dl → D)
}

/** True when an Azure SKU resolves a processor at runtime: a vendor string on
 *  the spec, an exact curated entry, or (family-level) a curated entry exists
 *  for its de-featured family — the coverage the join actually achieves. */
function azureProcessorResolvable(sku: string, vendorString: string): boolean {
  if (vendorString) return true;
  if (azureProcessorFor(sku)) return true;
  const fam = azureFamilyBase(sku);
  return fam != null && CURATED_AZURE_FAMILIES.has(fam);
}

interface AzureSpecRecord {
  physicalProcessor?: string;
  cpu?: string;
  processor?: string;
}

/** Effective processor coverage % for a cloud. For Azure this is the runtime
 *  (curated-map) figure computed from the baked spec roster; for AWS/GCP the
 *  vendor string is already published so the manifest's `processorPct` IS the
 *  effective figure (returned as null → callers fall back to `processorPct`). */
function effectiveProcessorPctFor(cloud: string): number | null {
  if (cloud.toLowerCase() !== 'azure') return null;
  const specs = (GENERATED as { providers?: Record<string, { specs?: Record<string, AzureSpecRecord> }> })
    .providers?.Azure?.specs;
  if (!specs) return null;
  const names = Object.keys(specs);
  if (names.length === 0) return null;
  let resolved = 0;
  for (const name of names) {
    const s = specs[name];
    const vendor = s?.physicalProcessor || s?.cpu || s?.processor || '';
    if (azureProcessorResolvable(name, vendor)) resolved += 1;
  }
  return Math.round((resolved / names.length) * 1000) / 10;
}
interface Manifest {
  version?: number;
  generatedAt?: string;
  clouds?: Record<string, ManifestCloud>;
}

/** The embedded manifest, or null when the build carries no health block. */
function manifest(): Manifest | null {
  const h = (GENERATED as { health?: Manifest }).health;
  return h && typeof h === 'object' ? h : null;
}

/** Whole-day age of a shard timestamp; null when unparseable/absent. */
function ageDays(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / MS_PER_DAY);
}

export interface CloudHealth {
  cloud: string;
  shardAgeDays: number;
  specRows: number;
  /** Raw shard coverage — the vendor-published processor-string fraction. For
   *  Azure this is legitimately 0 (the Azure API publishes no processor). */
  processorPct: number;
  /** Runtime/effective coverage — what the app actually resolves after the
   *  curated Azure processor map. Equals `processorPct` for AWS/GCP (their
   *  vendor string is published); higher than the raw 0 for Azure. */
  effectiveProcessorPct: number;
  networkPct: number;
  ratesWithoutSpec: number;
}

/**
 * One health row per cloud in the baked manifest. `shardAgeDays` is the age of
 * the freshest shard for that cloud (newestGeneratedAt). Empty when no manifest.
 */
export function dataHealth(): CloudHealth[] {
  const m = manifest();
  if (!m?.clouds) return [];
  const out: CloudHealth[] = [];
  for (const [cloud, c] of Object.entries(m.clouds)) {
    const processorPct = c.specs?.coverage?.processorPct ?? 0;
    out.push({
      cloud,
      shardAgeDays: ageDays(c.rates?.newestGeneratedAt) ?? 0,
      specRows: c.specs?.rows ?? 0,
      processorPct,
      // Prefer the computed runtime coverage; fall back to the raw shard figure
      // for clouds whose vendor string is already published (AWS/GCP).
      effectiveProcessorPct: effectiveProcessorPctFor(cloud) ?? processorPct,
      networkPct: c.specs?.coverage?.networkPct ?? 0,
      ratesWithoutSpec: c.join?.ratesWithoutSpec ?? 0,
    });
  }
  return out;
}

/**
 * True when the manifest itself, or ANY cloud's freshest shard, is older than
 * `days` (default 30). False when there is no manifest to judge.
 */
export function isStale(days = 30): boolean {
  const m = manifest();
  if (!m) return false;
  const manifestAge = ageDays(m.generatedAt);
  if (manifestAge != null && manifestAge > days) return true;
  for (const c of Object.values(m.clouds ?? {})) {
    const a = ageDays(c.rates?.newestGeneratedAt);
    if (a != null && a > days) return true;
  }
  return false;
}

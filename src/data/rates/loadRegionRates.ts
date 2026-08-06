/**
 * Live-rate lazy loader.
 *
 * Joins the offline-ingested shards (see `scripts/ingest/`) into the engine's
 * `UserVm` catalog, on demand, one region at a time:
 *
 *     /rates/<provider>/_specs.json    (vCPU / RAM / disks / GPU — region-independent)
 *   ⨝ /rates/<provider>/_network.json  (Mbps — region-independent)
 *   ⨝ /rates/<provider>/<region>.json  (PAYG / 1yr / 3yr — per region)
 *   → UserVm[]  (same shape the seed produces; engine never forks)
 *
 * Why lazy + sharded: "all SKUs × all regions" is millions of rows. We fetch
 * only the region being priced, cache the region-independent specs/network once,
 * and merge the result into `state.userVms` via `VM_REPLACE` (API rows win over
 * the seed for the same vmSizeName+region).
 *
 * No assumptions: a SKU with no published network value keeps `networkMbps: 0`
 * (the engine then doesn't enforce a network ceiling we don't know) — never a
 * fabricated number. See `BACKLOG.md` + `scripts/ingest/azure-network-gaps.md`.
 */
import type { UserVm, VmProvider, VmCategory } from '../../types';
import { categorize } from '../../utils/vmCategory';
import { azureProcessorFor } from '../azureProcessorMap';

/** lowercase path segment under /rates/ for each provider. */
const PROVIDER_DIR: Record<string, string> = { AWS: 'aws', GCP: 'gcp', Azure: 'azure' };

export interface SpecRecord {
  vcpus: number;
  memoryGib: number;
  networkMbps?: number | null;
  gpus?: number | null;
  family?: string;
  category?: VmCategory;
  physicalProcessor?: string;
  cpu?: string;
  processor?: string;
  /** AWS `_specs.json` raw local-storage string, e.g. "2 x 1900 NVMe SSD" /
   *  "1 x 950 NVMe SSD" / "EBS only". Parsed to `localDiskGib` where present. */
  localStorage?: string | null;
  /** Direct local-disk GiB when a shard already carries a number (rare). */
  localDiskGib?: number | null;
}
export interface SpecsShard {
  provider?: string;
  generatedAt?: string;
  specs: Record<string, SpecRecord>;
}
export interface NetworkShard {
  generatedAt?: string;
  mbps: Record<string, number>;
  /** SKUs whose Mbps came from a curated legacy-doc FALLBACK rather than the
   *  primary scrape/API (see scripts/ingest/azure-network.mjs LEGACY_NETWORK).
   *  These get `networkEstimated: true` so the UI can label them "(est.)".
   *  Optional — absent when the shard predates the fallback. */
  estimatedSkus?: string[];
}

/** Optional join-loss collector — increments per rate dropped for a missing
 *  spec, so the caller can surface "N priced SKUs have no spec". Additive:
 *  existing callers pass nothing and are unaffected. */
export interface JoinStats {
  ratesWithoutSpec: number;
  skus: string[];
}

/**
 * Parse AWS `_specs.json` local-storage strings → total local disk GiB.
 *   "2 x 1900 NVMe SSD" → 3800 · "1 x 950 NVMe SSD" → 950 · "900 GB NVMe SSD" → 900
 *   "EBS only" / null   → 0 (no local disk — never fabricated).
 * Only recognizes the documented "<count> x <size>" and bare "<size> ... SSD/HDD"
 * shapes; anything unparseable returns 0 (fall back to no local disk, honestly).
 */
export function parseLocalDiskGib(raw: string | null | undefined): number {
  const s = (raw || '').trim();
  if (!s || /^ebs\s*only$/i.test(s)) return 0;
  const mult = s.match(/(\d+)\s*[x×]\s*([\d,]+(?:\.\d+)?)/i);
  if (mult) return Math.round(Number(mult[1]) * Number(mult[2].replace(/,/g, '')));
  const single = s.match(/([\d,]+(?:\.\d+)?)\s*(?:gb|gib)?\s*(?:nvme|ssd|hdd)/i);
  if (single) return Math.round(Number(single[1].replace(/,/g, '')));
  return 0;
}

/**
 * Coarse, honest Azure processor label for the sizes whose exact generation is
 * scheduled across several microarchitectures — the LAST-resort 'inferred' tier
 * (after the curated `azureProcessorFor` map). Ported from specInsights so the
 * inference lives with the join (the row persists it once; the UI never
 * re-infers). Returns '' when nothing coarse can be said.
 */
export function inferAzureProcessor(sku: string): string {
  if (!/^Standard_/i.test(sku)) return '';
  const name = sku.replace(/^Standard_/i, '');
  const verM = name.match(/_v(\d+)\b/i);
  const ver = verM ? Number(verM[1]) : 1;
  const featM = name.match(/^[A-Za-z]+\d+([a-z]*)/);
  const feat = featM?.[1] ?? '';
  if (feat.includes('p')) return ''; // Arm versions are pinned by the curated map
  if (feat.includes('a')) return ver <= 3 ? 'AMD EPYC (Naples/Rome-class)' : '';
  if (ver === 3) return 'Intel Broadwell/Skylake';
  if (ver === 1) return 'Intel Haswell/Broadwell';
  return '';
}
/** Per-region rates: `{ "<sku>": { payg, ri1y, ri3y } }`. */
export type RatesShard = Record<string, { payg: number | null; ri1y: number | null; ri3y: number | null }>;

/**
 * MM / HM / VHM tier from raw memory GiB.
 *
 * Boundaries match Azure's documented M-series memory tiers AND the hand-seed
 * (`azureMSeriesSeed.ts::memoryCategoryLabel`): Medium ≤ 4 TiB, High 4–16 TiB,
 * Very High > 16 TiB. This is the field `vmTaxonomy.azureMFamilyLabel` reads to
 * decide "Msv3 Medium Memory series" vs "… High Memory series", so the cutoff
 * must be the real Medium-series ceiling.
 *
 * Authoritative per Microsoft Learn (Sapphire-Rapids Mv3):
 *   - Msv3/Mdsv3 Medium: M12s_v3 (240 GiB) … M176s_4_v3 (3,892 GiB)  → all ≤ 4096
 *   - Msv3/Mdsv3 High:   M416s_6_v3 (5,696) … M832is_16_v3 (15,200)  → 4096 < m ≤ 16384
 *   - Mdsv3 Very High:   M896ixds_24_v3 (23,088) … _32_v3 (30,400)   → > 16384
 *
 * The old `≤1024 → MM` cutoff wrongly tagged the upper Medium sizes
 * (M96s_2_v3 1,946 · M176s_3_v3 2,794 · M176s_4_v3 3,892) as High, splitting
 * them out of "Msv3 Medium Memory series" (user-reported: only 6 sizes showed).
 */
function memoryCategory(memoryGib: number): UserVm['memoryCategory'] {
  if (memoryGib > 16384) return 'Very High Memory (VHM)';
  if (memoryGib > 4096) return 'High Memory (HM)';
  return 'Medium Memory (MM)';
}

/** Family slug from the SKU when the specs shard doesn't carry one. */
function familyOf(provider: string, sku: string, spec: SpecRecord): string {
  if (spec.family) return spec.family;
  if (provider === 'AWS') return sku.split('.')[0]; // m7i.xlarge → m7i
  if (provider === 'GCP') return sku.split('-')[0]; // n2-standard-8 → n2
  return sku.replace(/^Standard_/, '').split(/[0-9]/)[0] || sku; // Azure fallback
}

/**
 * Pure join — exported for tests. Builds one `UserVm` per SKU present in BOTH
 * the rates shard and the specs shard (a rate with no spec can't be packed; a
 * spec with no rate isn't sellable in this region). Network is best-known:
 * `_network.json` → spec.networkMbps → 0 (unknown, unconstrained — not faked).
 */
export function buildCatalogFromShards(
  provider: VmProvider,
  region: string,
  rates: RatesShard,
  specs: SpecsShard,
  network: NetworkShard | null,
  stats?: JoinStats,
): UserVm[] {
  const net = network?.mbps ?? {};
  const estimated = new Set(network?.estimatedSkus ?? []);
  const out: UserVm[] = [];
  for (const [sku, rate] of Object.entries(rates)) {
    const spec = specs.specs[sku];
    if (!spec || !(spec.vcpus > 0) || !(spec.memoryGib > 0)) {
      // Join-loss: a rate we can't pack because the spec shard lacks the size.
      // Keep the drop (unchanged behavior) but COUNT it so the caller can tell
      // the user "N priced SKUs have no spec — run the specs ingest".
      if (stats && !spec) {
        stats.ratesWithoutSpec += 1;
        stats.skus.push(sku);
      }
      continue;
    }
    const family = familyOf(provider, sku, spec);

    // ── Processor provenance chain (accuracy-first) ──────────────────────
    // 1) vendor-published string wins and is never re-labeled.
    // 2) curated Azure map (Azure feed has no processor) → 'curated' + options.
    // 3) coarse inference from the SKU name → 'inferred' (hedged in the UI).
    // 4) '' with no source.
    let processor = spec.physicalProcessor || spec.cpu || spec.processor || '';
    let processorSource: UserVm['processorSource'] | undefined = processor ? 'vendor' : undefined;
    let processorOptions: string[] | undefined;
    if (!processor && provider === 'Azure') {
      const curated = azureProcessorFor(sku);
      if (curated) {
        processor = curated.processor;
        processorOptions = curated.processorOptions;
        processorSource = 'curated';
      } else {
        const coarse = inferAzureProcessor(sku);
        if (coarse) {
          processor = coarse;
          processorSource = 'inferred';
        }
      }
    }
    // Dual-CPU split: a slash in the resolved string (e.g. GCP 'Cascade
    // Lake/Ice Lake') means host-dependent silicon → expose both options.
    if (!processorOptions && processor.includes('/')) {
      const parts = processor.split('/').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) processorOptions = parts;
    }

    const networkMbps = net[sku] ?? spec.networkMbps ?? 0;
    const localDiskGib =
      spec.localDiskGib != null && spec.localDiskGib > 0
        ? Math.round(spec.localDiskGib)
        : parseLocalDiskGib(spec.localStorage);

    out.push({
      vmSizeName: sku,
      vmGeneration: family,
      series: family.split(/[0-9]/)[0] || family,
      memoryCategory: memoryCategory(spec.memoryGib),
      homeHardwareGroup: '',
      spilloverTarget: 'N/A',
      processor,
      ...(processorSource ? { processorSource } : {}),
      ...(processorOptions ? { processorOptions } : {}),
      vcpus: spec.vcpus,
      memoryGib: spec.memoryGib,
      networkMbps: networkMbps ?? 0,
      ...(estimated.has(sku) ? { networkEstimated: true } : {}),
      localDiskGib,
      status: 'GA',
      notes: `live:${PROVIDER_DIR[provider] ?? provider}/${region}`,
      provider,
      family,
      // Always derive the canonical VmCategory from the app's own mapping — the
      // ingest carries each provider's RAW label ("General purpose", "GPU
      // instance"…), which wouldn't match the catalog filter's enum.
      category: categorize(provider, family),
      region,
      hourlyUsd: rate.payg ?? undefined,
      riOneYrHourlyUsd: rate.ri1y ?? undefined,
      riThreeYrHourlyUsd: rate.ri3y ?? undefined,
      acceleratorType: spec.gpus ? `${spec.gpus} GPU` : 'None',
    });
  }
  return out;
}

// ── Runtime fetch + cache ─────────────────────────────────────────────────
// Region-independent specs/network are fetched once per provider and cached.
const specsCache = new Map<string, Promise<SpecsShard>>();
const networkCache = new Map<string, Promise<NetworkShard | null>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

function dir(provider: VmProvider): string {
  return PROVIDER_DIR[provider] ?? String(provider).toLowerCase();
}

/** Has this provider been ingested? (specs shard present.) */
export async function liveRatesAvailable(provider: VmProvider): Promise<boolean> {
  try {
    await fetchSpecs(provider);
    return true;
  } catch {
    return false;
  }
}

function fetchSpecs(provider: VmProvider): Promise<SpecsShard> {
  const d = dir(provider);
  if (!specsCache.has(d)) specsCache.set(d, fetchJson<SpecsShard>(`/rates/${d}/_specs.json`));
  return specsCache.get(d)!;
}
function fetchNetwork(provider: VmProvider): Promise<NetworkShard | null> {
  const d = dir(provider);
  if (!networkCache.has(d)) {
    networkCache.set(
      d,
      fetchJson<NetworkShard>(`/rates/${d}/_network.json`).catch(() => null),
    );
  }
  return networkCache.get(d)!;
}

/** Result of a region load — the catalog plus the data's freshness stamp. */
export interface LoadedRegion {
  provider: VmProvider;
  region: string;
  vms: UserVm[];
  generatedAt?: string;
}

/** Fetch + join one provider/region into a `UserVm[]` (lazy; specs cached). */
export async function loadRegionCatalog(provider: VmProvider, region: string): Promise<LoadedRegion> {
  const d = dir(provider);
  const [specs, network, rates] = await Promise.all([
    fetchSpecs(provider),
    fetchNetwork(provider),
    fetchJson<RatesShard>(`/rates/${d}/${region}.json`),
  ]);
  return {
    provider,
    region,
    vms: buildCatalogFromShards(provider, region, rates, specs, network),
    generatedAt: specs.generatedAt,
  };
}

/**
 * Merge freshly-loaded rows into an existing catalog. Dedupe key is
 * `vmSizeName|region`; loaded (API) rows REPLACE seed rows for the same key,
 * so live data supersedes the static seed without touching other regions or
 * user uploads in other regions.
 */
export function mergeLoadedVms(existing: UserVm[], loaded: UserVm[]): UserVm[] {
  const key = (v: UserVm) => `${v.vmSizeName}|${v.region ?? ''}`;
  const incoming = new Set(loaded.map(key));
  const kept = existing.filter((v) => !incoming.has(key(v)));
  return [...kept, ...loaded];
}

/**
 * Live catalog — the dashboard's default VM catalog, baked from the live rate
 * shards at build time (S38, v2.25.5).
 *
 * `liveCatalog.generated.json` (produced by scripts/ingest/build-live-catalog.mjs
 * and refreshed weekly by .github/workflows/refresh-rates.yml) carries real
 * specs + network + per-region pricing for EVERY cloud, region, and size. This
 * module joins them into a `UserVm[]` via the shared `buildCatalogFromShards`,
 * so the whole dashboard is priced with current data out of the box — no manual
 * per-region "Load", no runtime fetch, works offline, fresh on every deploy.
 *
 * The join is memoized and lazy (first call only) so importing this module is
 * cheap; the bootstrap builds it once, off the first-paint path.
 */
import type { UserVm, VmProvider } from '../types';
import { buildCatalogFromShards, type RatesShard, type JoinStats } from './rates/loadRegionRates';
import GENERATED from './liveCatalog.generated.json';
import { AWS_REGION_FAMILIES } from './awsRegionAvailability';
import { GCP_REGION_FAMILIES } from './gcpRegionAvailability';

interface ProviderData {
  specs: Record<string, unknown>;
  network: Record<string, number>;
  rates: Record<string, RatesShard>;
}
interface Generated {
  asOf: string;
  providers: Record<string, ProviderData>;
}
const G = GENERATED as unknown as Generated;

/** ISO date (YYYY-MM-DD) the baked shards were pulled. */
export const LIVE_CATALOG_AS_OF: string = (G.asOf || '').slice(0, 10);

/** Content version — bumps whenever the baked data's pull date changes (i.e.
 *  every weekly refresh deploy), so the bootstrap can tell a returning user's
 *  cached catalog is stale. */
export const LIVE_CATALOG_VERSION = `live-${LIVE_CATALOG_AS_OF}`;

let _catalog: UserVm[] | null = null;

/** Build (once, memoized) the full live catalog — every provider × region × SKU
 *  that has both a spec and a rate. ~100k rows; ~hundreds of ms on first call,
 *  free thereafter. */
export function buildLiveCatalog(): UserVm[] {
  if (_catalog) return _catalog;
  const out: UserVm[] = [];
  // Per-provider join-loss accounting — priced SKUs the specs shard can't
  // describe (so they're dropped, unpackable). Surfaced in dev so a missing /
  // stale specs ingest is visible, not silent. See B2.
  const lossByProvider: Record<string, JoinStats> = {};
  for (const [provider, pd] of Object.entries(G.providers)) {
    const specsShard = { specs: pd.specs as never };
    // `pd.network` is the raw mbps map; a future build may also emit an
    // `estimatedSkus` list alongside it (tolerated when present, absent today).
    const networkShard = {
      mbps: pd.network,
      estimatedSkus: (pd as { estimatedSkus?: string[] }).estimatedSkus,
    };
    const stats: JoinStats = (lossByProvider[provider] = { ratesWithoutSpec: 0, skus: [] });
    for (const [region, rates] of Object.entries(pd.rates)) {
      out.push(...buildCatalogFromShards(provider as VmProvider, region, rates, specsShard, networkShard, stats));
    }
    // v2.52.27 — Availability is DECOUPLED from pricing. The live rate feed only
    // carries regions/families the vendor prices via the public API, so families
    // present in the published availability docs but not yet priced (e.g. GCP
    // C2D/C3D/C4A/T2D, AWS China/Sovereign regions + Mac) were showing as
    // available NOWHERE. We inject an availability-only row (price = null → shown
    // "not in feed", never a fabricated number) for every (region, family) the
    // curated doc tables list but the feed didn't price, so region availability
    // matches what the vendor publishes. Real rates flow in on the next keyed
    // refresh and simply replace the null. See feedback_engine_region_availability_decoupled.
    const table = provider === 'AWS' ? AWS_REGION_FAMILIES : provider === 'GCP' ? GCP_REGION_FAMILIES : null;
    if (table) {
      const famOf = (size: string, spec: { family?: string }): string =>
        provider === 'GCP'
          ? (spec.family ?? size.split('-')[0]).toLowerCase()
          : size.split('.')[0].toLowerCase();
      const sizesByFam = new Map<string, string[]>();
      for (const [size, specRaw] of Object.entries(pd.specs)) {
        const spec = specRaw as { vcpus?: number; memoryGib?: number; family?: string };
        if (!(Number(spec.vcpus) > 0) || !(Number(spec.memoryGib) > 0)) continue;
        const f = famOf(size, spec);
        (sizesByFam.get(f) ?? sizesByFam.set(f, []).get(f)!).push(size);
      }
      for (const [region, fams] of Object.entries(table)) {
        const priced = pd.rates[region] ?? {};
        const synth: RatesShard = {};
        for (const fam of fams) {
          for (const size of sizesByFam.get(fam) ?? []) {
            if (!priced[size]) synth[size] = { payg: null, ri1y: null, ri3y: null };
          }
        }
        if (Object.keys(synth).length) {
          out.push(...buildCatalogFromShards(provider as VmProvider, region, synth, specsShard, networkShard));
        }
      }
    }
  }
  // Dev-only join-loss report: which priced SKUs had no spec to pack. In prod
  // we stay silent — this is an ingest-health hint. (Vite replaces
  // import.meta.env.DEV at build; the project's tsconfig omits vite/client
  // types, so read it through a cast rather than adding a global d.ts.)
  const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
  if (isDev) {
    for (const [provider, s] of Object.entries(lossByProvider)) {
      const uniq = new Set(s.skus).size;
      if (uniq > 0) {
        // eslint-disable-next-line no-console
        console.info(
          `[liveCatalog] ${provider}: ${uniq} priced SKUs have no spec — run ${provider.toLowerCase()}-specs.mjs with credentials to fill them.`,
        );
      }
    }
  }
  _catalog = out;
  return out;
}

/** True when the build actually carries baked rate data (guards against an
 *  empty/missing artifact — falls back to the synthetic seed if so). */
export function liveCatalogAvailable(): boolean {
  return Object.keys(G.providers ?? {}).length > 0;
}

import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import { initialState, reducer, type AppState, type Action } from './AppState';
import type { BufferSpec, FleetSpec, HardwareGroup } from '../types';
import {
  loadPersisted,
  persist,
  loadSeedVersion,
  saveSeedVersion,
  loadUserCatalogUploaded,
} from './storage';
import {
  seedAllPublicVms,
  mergeSeedIntoUserVms,
  PUBLIC_SEED_VERSION,
  reRateAzureMSeries,
} from '../data/azureMSeriesSeed';
import { buildLiveCatalog, liveCatalogAvailable } from '../data/liveCatalog';
import { seedPublicCpus } from '../data/publicCpuSeed';
import { seedSampleServers } from '../data/sampleServerSeed';
import { seedEquivalency } from '../data/equivalencySeed';
import { vmClass } from '../utils/vmTaxonomy';

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const restored = loadPersisted();
    // Merge restored.ui onto defaults so newly-added UiState fields (e.g.
    // rackTileSize) get sane defaults even when reading old localStorage.
    const merged: AppState = {
      ...init,
      ...restored,
      ui: { ...init.ui, ...(restored.ui ?? {}) },
    };
    // v2.23.1 — The Simple Calculator page was removed; a user whose
    // localStorage still points there would render a blank page. Fall back to
    // the Simulator. (Drop this guard once no live profiles carry the value.)
    if ((merged.ui.activePage as string) === 'simple-calculator') {
      merged.ui = { ...merged.ui, activePage: 'simulator' };
    }
    // v2.9 — First-run native seed. When the user has no VMs uploaded (and
    // localStorage didn't restore any), preload the public Azure M-Series
    // catalog so the app demos out-of-the-box instead of showing the empty
    // VM Library. User uploads/deletes still override; the seed only fires
    // when `userVms` is genuinely empty.
    //
    // v2.17.11 — When the user DOES already have a catalog persisted in
    // localStorage but the public seed has been expanded since they last
    // visited (PUBLIC_SEED_VERSION bumped), additively merge in any new
    // seed rows whose `(provider, vmSizeName, region)` is missing. User
    // edits + uploads are NEVER touched. Once merged, the new version
    // gets stamped into localStorage so the merge only runs once per bump.
    // v2.25.5 — Default catalog = the baked LIVE catalog (real specs + network
    // + per-region pricing for every cloud/region/size, refreshed weekly with
    // the deploy). It's re-derived from the bundle each boot, so we DON'T
    // restore a persisted copy here — we seed the lightweight synthetic catalog
    // for instant first paint and let a mount effect swap in the live one (off
    // the paint path). EXCEPTION: a user who uploaded their OWN catalog keeps
    // it (it wins and is persisted); the live overlay stands down.
    const userUploaded = loadUserCatalogUploaded();
    if (userUploaded && (merged.userVms ?? []).length > 0) {
      // Honor the user's uploaded catalog as-is. Still additively merge any new
      // public-seed rows if the seed version moved (uploads are never touched).
      if (loadSeedVersion() !== PUBLIC_SEED_VERSION) {
        merged.userVms = mergeSeedIntoUserVms(merged.userVms);
        saveSeedVersion(PUBLIC_SEED_VERSION);
      }
    } else {
      // Default user: synthetic placeholder now, live catalog at mount.
      merged.userVms = seedAllPublicVms([]);
      saveSeedVersion(PUBLIC_SEED_VERSION);
    }
    merged.userCpus = seedPublicCpus(merged.userCpus ?? []);
    // v2.17.33 — Single sample server pre-loaded so first-run users see a
    // populated Server Library (the only library that started fully blank).
    // User uploads / deletes always win; the seed only fires when empty.
    merged.userHardware = seedSampleServers(merged.userHardware ?? []);
    // v2.12 (Phase F) — Same first-run seed pattern for cross-cloud
    // equivalency. ~21 Azure ↔ AWS ↔ GCP analog mappings ship loaded so
    // the Competitive page demos with non-empty rows; user uploads /
    // deletes still take precedence.
    merged.userEquivalency = seedEquivalency(merged.userEquivalency ?? []);

    // v2.19 — One-time migration: HardwareGroup.buffer (v2.18) →
    // FleetSpec.bufferDefault (v2.19). Buffer is now authored per cluster.
    // For each fleet that has a hardwareGroupId, if its parent HW group
    // still carries the legacy buffer field AND the fleet doesn't already
    // have its own bufferDefault, copy it across. Then strip the field
    // from userHardware. Stamped via `vmcap:bufferModelVersion` so this
    // only runs once.
    try {
      const KEY = 'vmcap:bufferModelVersion';
      const TARGET = '2';
      if (localStorage.getItem(KEY) !== TARGET) {
        const hwById: Record<string, HardwareGroup & { buffer?: BufferSpec }> = {};
        for (const g of merged.userHardware) hwById[g.id] = g as HardwareGroup & { buffer?: BufferSpec };
        const fleets: Record<string, FleetSpec> = { ...merged.fleets };
        for (const fid of merged.fleetOrder) {
          const f = fleets[fid];
          if (!f || !f.hardwareGroupId) continue;
          const legacy = hwById[f.hardwareGroupId]?.buffer;
          if (legacy && !f.bufferDefault) {
            // v2.19.3 — Migrated fleets are already-acknowledged because the
            // user authored the v2.18 buffer explicitly. No amber nudge on
            // upgrade.
            fleets[fid] = { ...f, bufferDefault: legacy, bufferAcknowledged: true };
          }
        }
        merged.fleets = fleets;
        // Strip the field from every HardwareGroup so it doesn't reappear.
        merged.userHardware = merged.userHardware.map((g) => {
          const { buffer: _drop, ...rest } = g as HardwareGroup & { buffer?: BufferSpec };
          void _drop;
          return rest as HardwareGroup;
        });
        localStorage.setItem(KEY, TARGET);
      }
    } catch {
      /* localStorage disabled — skip; migration will retry next boot */
    }

    // v2.19.19 — One-time migration: re-tier persisted Azure M-series rows to
    // the corrected 2-tier MM/HM model. The seed-version bump's additive merge
    // ADDS the new Mdsv3 rows but never touches existing rows, so a returning
    // user's M624s_12_v3 / M832*_v3 / M416ms_v2 would keep their stale "VHM"
    // memoryCategory and HM Mv3 would still look split. Re-deriving the label
    // from memoryGib (the only field `vmFamily` reads for the tier) fixes it.
    // Native VM rows are read-only (no in-app edits), so re-stamping is safe;
    // genuine user uploads carry their own memoryCategory and are only Azure-M
    // re-stamped if they collide with the seed's threshold anyway. Stamped via
    // `vmcap:azureMTierVersion` so it runs once.
    try {
      const KEY = 'vmcap:azureMTierVersion';
      const TARGET = '3'; // v2.19.20 — 3-tier MM/HM/VHM (was 2-tier in v2.19.19)
      if (localStorage.getItem(KEY) !== TARGET) {
        merged.userVms = merged.userVms.map((v) => {
          const isAzure = (v.provider ?? '') === 'Azure';
          const isMSeries = v.series === 'M' || /^Mv\d+$/.test(v.vmGeneration ?? '');
          if (!isAzure || !isMSeries) return v;
          const want =
            v.memoryGib > 16384
              ? 'Very High Memory (VHM)'
              : v.memoryGib > 4096
              ? 'High Memory (HM)'
              : 'Medium Memory (MM)';
          if (v.memoryCategory === want) return v;
          return { ...v, memoryCategory: want };
        });
        localStorage.setItem(KEY, TARGET);
      }
    } catch {
      /* localStorage disabled — skip; migration will retry next boot */
    }

    // v2.25.2 — One-time migration: re-rate persisted Azure M-series rows from
    // the live-shard-derived seed. v2.25.1 moved M-series from 6 hard-coded
    // regions with multiplier-GUESSED rates to ~54 regions with REAL Azure
    // Retail Prices. The seed-version bump's additive merge ADDS the new-region
    // rows but never touches a returning user's existing rows, so their
    // original 6 regions (esp. the RI rates) keep the stale multiplier values.
    // Overwrite the rate fields of every Azure M-series row that matches a
    // fresh seed row by (vmSizeName, region); leave rows with no seed match
    // (genuine user uploads in other regions) untouched. Idempotent — skips
    // rows already on the fresh rate. Stamped via `vmcap:azureMSeriesRatesVersion`.
    try {
      const KEY = 'vmcap:azureMSeriesRatesVersion';
      const TARGET = '1';
      if (localStorage.getItem(KEY) !== TARGET) {
        merged.userVms = reRateAzureMSeries(merged.userVms);
        localStorage.setItem(KEY, TARGET);
      }
    } catch {
      /* localStorage disabled — skip; migration will retry next boot */
    }

    // v2.19.17 — One-time migration: class-keyed fungibility → size-keyed.
    // The matrix moved from one row per VM CLASS (e.g. "Mv2-HM") to one row
    // per VM SIZE (e.g. "Standard_M128ms_v2") so each size routes
    // independently. Expand every legacy class key into its catalog sizes so
    // the new per-size table displays prior rules cleanly. Size-keyed cells
    // are authoritative (they win over expansion); class keys with no catalog
    // match are kept verbatim (the engine's class fallback still honors them).
    // Stamped via `vmcap:fungibilityKeyVersion` so it runs once.
    try {
      const KEY = 'vmcap:fungibilityKeyVersion';
      const TARGET = '2';
      if (localStorage.getItem(KEY) !== TARGET) {
        const matrix = (merged.userFungibility ?? {}) as Record<
          string,
          Record<string, number | 'blocked'>
        >;
        const entries = Object.entries(matrix);
        if (entries.length > 0) {
          const sizeNames = new Set(merged.userVms.map((v) => v.vmSizeName));
          const sizesByClass = new Map<string, string[]>();
          for (const v of merged.userVms) {
            const cls = vmClass(v);
            const arr = sizesByClass.get(cls) ?? [];
            arr.push(v.vmSizeName);
            sizesByClass.set(cls, arr);
          }
          const next: Record<string, Record<string, number | 'blocked'>> = {};
          // Pass 1 — copy size-keyed rows verbatim (authoritative).
          for (const [key, row] of entries) {
            if (sizeNames.has(key)) next[key] = { ...row };
          }
          // Pass 2 — expand class / stale keys without clobbering size cells.
          for (const [key, row] of entries) {
            if (sizeNames.has(key)) continue;
            const sizes = sizesByClass.get(key);
            if (sizes && sizes.length > 0) {
              for (const s of sizes) next[s] = { ...row, ...(next[s] ?? {}) };
            } else {
              // Unresolvable class key — keep so the engine fallback honors it.
              next[key] = { ...(next[key] ?? {}), ...row };
            }
          }
          merged.userFungibility = next;
        }
        localStorage.setItem(KEY, TARGET);
      }
    } catch {
      /* localStorage disabled — skip; migration will retry next boot */
    }

    // v2.25.4 — One-time migration: re-key legacy Azure M-series class-keyed
    // fungibility cells onto the new public-series taxonomy. The board's
    // family-level drag authors CLASS-keyed cells; v2.25.4 split the old
    // tier×generation classes (`Mv3-MM`…) into one class per public Microsoft
    // series (`Msv3-MM`, `Mdsv3-MM`, `Mbsv3`, …). Without this, a returning
    // user's family-level M rules would orphan (the engine's class-fallback
    // would look up the new key and miss). Fan each old class key out to every
    // new class it split into, copying the row; the old key is left in place
    // (harmless — the engine no longer looks it up). Size-keyed cells (the
    // common case, incl. the demo) are untouched. Stamped via
    // `vmcap:azureMSeriesClassVersion` so it runs once.
    try {
      const KEY = 'vmcap:azureMSeriesClassVersion';
      const TARGET = '1';
      if (localStorage.getItem(KEY) !== TARGET) {
        const OLD_TO_NEW: Record<string, string[]> = {
          'Mv1-MM': ['M'],
          'Mv2-MM': ['Msv2-MM', 'Mdsv2-MM'],
          'Mv2-HM': ['Msv2-HM'],
          'Mv3-MM': ['Msv3-MM', 'Mdsv3-MM', 'Mbsv3', 'Mbdsv3'],
          'Mv3-HM': ['Msv3-HM', 'Mdsv3-HM'],
          'Mv3-VHM': ['Mdsv3-VHM'],
        };
        const matrix = (merged.userFungibility ?? {}) as Record<
          string,
          Record<string, number | 'blocked'>
        >;
        let changed = false;
        const next = { ...matrix };
        for (const [oldKey, newKeys] of Object.entries(OLD_TO_NEW)) {
          const row = matrix[oldKey];
          if (!row) continue;
          for (const nk of newKeys) {
            // Don't clobber a cell the user already authored under the new key.
            next[nk] = { ...row, ...(next[nk] ?? {}) };
            changed = true;
          }
        }
        if (changed) merged.userFungibility = next;
        localStorage.setItem(KEY, TARGET);
      }
    } catch {
      /* localStorage disabled — skip; migration will retry next boot */
    }

    return merged;
  });

  // v2.25.5 — Swap the synthetic placeholder catalog for the baked LIVE
  // catalog right after first paint. Built from the bundled artifact (no
  // network, works offline); deferred to a mount effect so the ~100k-row join
  // stays off the first-paint path. `silent` so it doesn't flag a persisted
  // result stale. Stands down when the user uploaded their own catalog.
  useEffect(() => {
    if (loadUserCatalogUploaded() || !liveCatalogAvailable()) return;
    const id = requestAnimationFrame(() => {
      const live = buildLiveCatalog();
      if (live.length > 0) dispatch({ type: 'VM_REPLACE', vms: live, silent: true });
    });
    return () => cancelAnimationFrame(id);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist user-edited slices on change (debounced via microtask coalescing)
  useEffect(() => {
    persist(state);
  }, [state.bom, state.fleets, state.fleetOrder, state.buffer, state.packingMode, state.fungibilityOn, state.ui, state.result, state.userHardware, state.userCpus, state.userVms, state.userFungibility, state.userEquivalency]);

  // Sync theme to document element so CSS tokens swap.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.ui.theme);
  }, [state.ui.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): ContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

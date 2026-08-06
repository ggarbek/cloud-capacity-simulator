import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import {
  ZONES,
  totalNodes,
  vcpusPerNode,
  deployableNodes,
  hasHeterogeneousNonUtility,
  type BufferSpec,
  type FleetSpec,
  type HardwareGroup,
} from '../types';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { NumberInput } from './NumberInput';
import { REGION_GEO } from '../data/regionCoordinates';
import { hardwareFungibilityStatus, type FungibilityMatrix } from '../utils/fungibilityStatus';

/**
 * v2.18 — Fleet Builder rewrite. Three stacked surfaces:
 *
 *   1. Regions & Zones — author the structural targets (region rows; each
 *      row owns a strip of zone chips). NO hardware here; this is pure
 *      "where do I want capacity?".
 *
 *   2. + Place Racks — composer: pick an authored Region + Zone + a Server
 *      from the Hardware Library + how many racks per cluster + how many
 *      clusters of that size. Single + Add button fans out into N FLEET_ADD
 *      dispatches.
 *
 *   3. Fleet Roster — every placed cluster, grouped Region → Zone → Server.
 *      Each cluster is a read-only stat card; only the rack count is
 *      editable inline. Server specs come from the Hardware Library (single
 *      source of truth) — no per-cluster overrides here.
 */
export function FleetBuilder() {
  const { state, dispatch } = useApp();
  const clusters = fleetList(state).filter(({ fleet }) =>
    Boolean(fleet.hardwareGroupName?.trim()),
  );
  const hwEmpty = state.userHardware.length === 0;
  const hwById = useMemo(() => {
    const m: Record<string, HardwareGroup> = {};
    for (const g of state.userHardware) m[g.id] = g;
    return m;
  }, [state.userHardware]);
  const regionsAuthored = state.fleetRegions;
  const showWelcome = useWelcomeBanner(
    regionsAuthored.length === 0 && clusters.length === 0,
  );

  // v2.19.50+ — 5s undo toast for mass-delete on Placed Clusters. Mirrors
  // the Hardware Library "Clear all" pattern. Undo doctrine: this toast is
  // the ONLY recovery path; there is no global Cmd/Ctrl-Z undo stack in
  // this app (the only useHistoryState lives in FungibilityTab). If the
  // toast expires, the clear is permanent.
  const [pendingClear, setPendingClear] = useState<{
    label: string;
    undo: () => void;
  } | null>(null);

  const clearAllClusters = () => {
    const N = state.fleetOrder.length;
    if (N === 0) return;
    const regionCount = new Set(
      Object.values(state.fleets)
        .map((f) => f.region || '(no region)')
    ).size;
    if (
      !window.confirm(
        `Delete ${N} placed cluster(s) across ${regionCount} region(s)? Hardware Library and authored regions stay intact.`,
      )
    )
      return;
    const snapshotFleets = state.fleets;
    const snapshotOrder = state.fleetOrder;
    dispatch({ type: 'FLEET_REMOVE_ALL' });
    const undoEntry = {
      label: `Cleared ${N} placed cluster${N === 1 ? '' : 's'}`,
      undo: () => {
        dispatch({
          type: 'FLEET_RESTORE_ALL',
          fleets: snapshotFleets,
          fleetOrder: snapshotOrder,
        });
        setPendingClear(null);
      },
    };
    setPendingClear(undoEntry);
    window.setTimeout(() => {
      setPendingClear((cur) => (cur === undoEntry ? null : cur));
    }, 5000);
  };

  return (
    <div className="space-y-5">
      {showWelcome.visible && (
        <FleetWelcomeBanner onDismiss={showWelcome.dismiss} />
      )}

      {/* v2.20.2 (distill) — the composer IS the baseline and is never
          gated. Picking a region/zones that aren't authored yet simply
          authors them on Place; the structural Regions & Zones surface
          moves below as the fine-tune view of what exists. First-timers
          place racks in one form instead of authoring structure first,
          then re-picking the same region in the composer. */}
      <PlaceRacksComposer hwEmpty={hwEmpty} />

      {/* v2.21.2 — the standalone "Regions & Zones · fine-tune" section was
          removed as redundant: the composer above authors regions/zones on
          Place, and the roster below now owns structural deletion (cascade
          ✕ on each region + zone header). One place to create (composer),
          one place to see + manage (roster). */}

      {clusters.length > 0 && (
        <FleetRoster
          clusters={clusters}
          hwById={hwById}
          onRemove={(id) => dispatch({ type: 'FLEET_REMOVE', id })}
          onRackCountChange={(id, rackCount) =>
            dispatch({ type: 'FLEET_SET', fleetId: id, fleet: { rackCount } })
          }
          onFleetUpdate={(id, patch) =>
            dispatch({ type: 'FLEET_SET', fleetId: id, fleet: patch })
          }
          onClearAll={clearAllClusters}
        />
      )}

      {/* ── Mass-delete undo toast (5 s) ──────────────────────────────── */}
      {pendingClear && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass flex items-center gap-3"
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-pill)',
            boxShadow:
              '0 12px 32px rgba(0,0,0,0.45), inset 0 0 0 1px var(--border-glow)',
          }}
        >
          <span className="text-[11px] text-text-primary">
            {pendingClear.label}
          </span>
          <button
            onClick={pendingClear.undo}
            className="text-[11px] font-semibold"
            style={{ color: 'var(--interactive)' }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Welcome banner
// ────────────────────────────────────────────────────────────────────────
function useWelcomeBanner(canShow: boolean) {
  const KEY = 'vmcap:welcomeDismissed-fleet';
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  return {
    visible: canShow && !dismissed,
    dismiss: () => {
      setDismissed(true);
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    },
  };
}

function FleetWelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section>
      <div
        className="glass-strong p-4 relative"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glow)',
          background: 'rgba(129, 140, 248, 0.04)',
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome message"
          title="Dismiss · won't show again"
          className="absolute top-2 right-2 text-[12px] text-text-muted hover:text-text-primary transition-colors"
          style={{ padding: '4px 8px', lineHeight: 1 }}
        >
          ✕
        </button>
        <div className="text-[11px] tracking-[0.04em] font-semibold text-interactive pr-6">
          Welcome — let's plan your fleet
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed mt-1.5">
          One form does it: pick a server from your{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Cluster builder</strong>,
          any region, the zones you want, and how many racks — then Place.
          Regions and zones are created for you; everything stays editable in
          the sections below.
        </p>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Section 1 — Regions & Zones authoring
// ────────────────────────────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = { padding: '8px 12px' };

const CUSTOM_REGION_SENTINEL = '__custom__';

/** v2.18 — Cascade-delete every fleet under the given region (or region+zone
 *  when zone is provided). Dispatches one FLEET_REMOVE per match. */
function cascadeRemoveFleets(
  fleets: Record<string, FleetSpec>,
  region: string,
  zone: string | undefined,
  dispatch: ReturnType<typeof useApp>['dispatch'],
): number {
  const ids: string[] = [];
  for (const id of Object.keys(fleets)) {
    const f = fleets[id];
    if (!f?.hardwareGroupName?.trim()) continue;
    if (f.region !== region) continue;
    if (zone !== undefined && f.zone !== zone) continue;
    ids.push(id);
  }
  for (const id of ids) dispatch({ type: 'FLEET_REMOVE', id });
  return ids.length;
}

// ────────────────────────────────────────────────────────────────────────
// Section 2 — Place Racks composer
// ────────────────────────────────────────────────────────────────────────
function PlaceRacksComposer({ hwEmpty }: { hwEmpty: boolean }) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(true);
  const [region, setRegion] = useState('');
  // v2.20.1 — Zone is MULTI-select. Deployments are usually zonal (HA =
  // the same shape in every zone), so one Place click fans the placement
  // out across every selected zone instead of forcing one composer round
  // per zone.
  const [zones, setZones] = useState<string[]>([]);
  const [serverId, setServerId] = useState('');
  const [racksPerCluster, setRacksPerCluster] = useState(1);
  const [clusters, setClusters] = useState(1);
  const composerRef = useRef<HTMLElement>(null);
  // v2.19.32 — Edit-cluster pre-fill. When the ✎ button on a placed
  // HardwareGroupRow fires, it sets UiState.pendingPlaceFromClusterId. We
  // read that, copy the source fleet's region/zone/hardwareGroupId/rackCount
  // into the composer's local state, expand + scroll the composer into
  // view, then clear the signal so it doesn't re-trigger on every render.
  const pendingId = state.ui.pendingPlaceFromClusterId;
  useEffect(() => {
    if (!pendingId) return;
    const fleet = state.fleets[pendingId];
    if (!fleet) {
      dispatch({ type: 'UI_SET', ui: { pendingPlaceFromClusterId: null } });
      return;
    }
    if (fleet.region) setRegion(fleet.region);
    if (fleet.zone) setZones([fleet.zone]);
    if (fleet.hardwareGroupId) setServerId(fleet.hardwareGroupId);
    if (fleet.rackCount && fleet.rackCount > 0) setRacksPerCluster(fleet.rackCount);
    setClusters(1);
    setOpen(true);
    dispatch({ type: 'UI_SET', ui: { pendingPlaceFromClusterId: null } });
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [pendingId, state.fleets, dispatch]);

  // v2.20.2 (distill) — the composer is no longer gated on pre-authored
  // regions. Options: authored regions first, then the public region
  // catalog, plus a custom sentinel. Anything not yet authored is created
  // automatically on Place.
  const [customRegion, setCustomRegion] = useState('');
  const regionOptions: DropdownOption[] = useMemo(() => {
    const authored = state.fleetRegions.map((r) => ({
      value: r.region,
      label: r.region,
      meta:
        r.zones.length === 0
          ? 'authored · no zones yet'
          : `authored · ${r.zones.length} zone${r.zones.length === 1 ? '' : 's'}`,
    }));
    const taken = new Set(state.fleetRegions.map((r) => r.region));
    const publicOptions = REGION_GEO.filter((r) => !taken.has(r.region)).map((r) => ({
      value: r.region,
      label: r.region,
      meta: `${r.provider} · ${r.city}, ${r.country}`,
    }));
    return [
      { value: CUSTOM_REGION_SENTINEL, label: '+ Custom region…', meta: 'On-prem, lab, customer name' },
      ...authored,
      ...publicOptions,
    ];
  }, [state.fleetRegions]);
  const effectiveRegion = region === CUSTOM_REGION_SENTINEL ? customRegion.trim() : region;

  // Zone chips: the region's authored zones when it has them, otherwise the
  // full Zone 1–4 universe (they'll be authored on Place).
  const authoredZones = state.fleetRegions.find((r) => r.region === effectiveRegion)?.zones ?? [];
  const regionIsAuthored = state.fleetRegions.some((r) => r.region === effectiveRegion);
  const zonesForRegion: string[] =
    regionIsAuthored && authoredZones.length > 0 ? authoredZones : [...ZONES];

  const serverOptions: DropdownOption[] = useMemo(() => {
    return state.userHardware.map((g) => ({
      value: g.id,
      label: g.name,
      meta: `${g.memoryGibPerNode >= 1024 ? `${g.memoryGibPerNode / 1024} TiB` : `${g.memoryGibPerNode} GiB`}/node · ${g.nodesPerRack ?? '?'} nodes/rack${g.provider ? ` · ${g.provider}` : ''}`,
    }));
  }, [state.userHardware]);

  const pickedServer = state.userHardware.find((g) => g.id === serverId);
  const canAdd =
    !!effectiveRegion && zones.length >= 1 && !!pickedServer && racksPerCluster >= 1 && clusters >= 1;
  const totalClusters = clusters * Math.max(1, zones.length);

  const commit = () => {
    if (!canAdd || !pickedServer) return;
    // Auto-clean: if the only existing fleet is the unconfigured default
    // stub (empty hardwareGroupName), drop it so the user's first real
    // placement isn't shadowed by a phantom row.
    const stale = state.fleetOrder.filter(
      (id) => !state.fleets[id]?.hardwareGroupName?.trim(),
    );
    for (const id of stale) dispatch({ type: 'FLEET_REMOVE', id });

    // v2.20.2 (distill) — auto-author the structure the placement implies.
    // Picking a region/zones that aren't authored yet should never be a
    // dead-end; the Regions & Zones surface below reflects what's created.
    if (!regionIsAuthored) {
      dispatch({ type: 'FLEET_REGION_ADD', region: effectiveRegion });
    }
    for (const z of zones) {
      if (!authoredZones.includes(z)) {
        dispatch({ type: 'FLEET_REGION_ZONE_ADD', region: effectiveRegion, zone: z });
      }
    }

    // One identical placement per selected zone — the HA pattern in one
    // click instead of one composer round per zone.
    for (const z of zones) {
      for (let i = 0; i < clusters; i++) {
        const fleet = buildFleetFromGroup(pickedServer, racksPerCluster, effectiveRegion, z);
        dispatch({ type: 'FLEET_ADD', fleet });
      }
    }
    // Reset only the server pick; keep region/zones/sizes so the user can
    // blast multiple shapes into the same target.
    setServerId('');
  };

  return (
    <section ref={composerRef} className="space-y-2">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-2 text-left transition-colors hover:bg-white/[0.02]"
        style={{ padding: 0 }}
      >
        <h2 className="section-h flex items-center gap-2 flex-1">
          <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
            {open ? '▾' : '▸'}
          </span>
          <span>+ Place Racks</span>
          <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
            · pick a server, racks/cluster, and how many clusters
          </span>
        </h2>
      </button>

      {open && (
        <div className="glass p-3 space-y-3" style={{ borderRadius: 'var(--radius-md)' }}>
          {hwEmpty ? (
            <div
              className="text-[11px] px-3 py-3 leading-snug flex items-center gap-3 flex-wrap"
              style={{
                background: 'rgba(129, 140, 248, 0.06)',
                border: '1px solid var(--border-glow)',
                color: 'var(--interactive)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span className="flex-1 min-w-0">
                ● No servers in your library yet. Build one in the Hardware Library
                before placing racks here.
              </span>
              <button
                onClick={() => dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'hardware' } })}
                className="btn-ghost text-[10px] tracking-[0.04em]"
                style={{
                  padding: '5px 12px',
                  color: 'var(--interactive)',
                  borderColor: 'var(--border-glow)',
                  background: 'rgba(129, 140, 248, 0.10)',
                  flexShrink: 0,
                }}
              >
                → Go to Hardware Library
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Region">
                  <GlassDropdown
                    value={region}
                    options={regionOptions}
                    onChange={setRegion}
                    placeholder="Pick any region — created automatically if new…"
                    searchable
                    visibleRows={5}
                  />
                  {region === CUSTOM_REGION_SENTINEL && (
                    <input
                      className="glass-input text-[11px] mt-1.5"
                      style={{ height: 32, padding: '0 10px', width: '100%' }}
                      placeholder="Custom region name…"
                      value={customRegion}
                      onChange={(e) => setCustomRegion(e.target.value)}
                      autoFocus
                    />
                  )}
                </Field>
                <Field label={`Zones · ${zones.length || 'none'} picked`}>
                  {/* v2.20.1 — multi-select zone chips. The same shape lands
                      in EVERY picked zone in one Place click (deployments
                      are usually zonal). v2.20.2 — unauthored regions show
                      the full Zone 1–4 universe; picked zones are authored
                      on Place. */}
                  {!effectiveRegion ? (
                    <span className="text-[10.5px] text-text-muted" style={{ padding: '8px 2px' }}>
                      Pick a region first…
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap" style={{ minHeight: 32 }}>
                      {zonesForRegion.map((z) => {
                        const on = zones.includes(z);
                        return (
                          <button
                            key={z}
                            type="button"
                            onClick={() =>
                              setZones((zs) => (on ? zs.filter((x) => x !== z) : [...zs, z]))
                            }
                            className="text-[10px] font-mono transition-colors"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: `1px solid ${on ? 'var(--border-glow)' : 'var(--border)'}`,
                              background: on ? 'rgba(129, 140, 248, 0.14)' : 'transparent',
                              color: on ? 'var(--interactive)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            aria-pressed={on}
                            title={
                              on
                                ? `Remove ${z} from this placement`
                                : `Also place this shape in ${z}`
                            }
                          >
                            {on ? '✓ ' : ''}{z}
                          </button>
                        );
                      })}
                      {zonesForRegion.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setZones(zones.length === zonesForRegion.length ? [] : [...zonesForRegion])
                          }
                          className="text-[9.5px] transition-colors"
                          style={{
                            padding: '5px 8px',
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: 2,
                          }}
                        >
                          {zones.length === zonesForRegion.length ? 'none' : 'all'}
                        </button>
                      )}
                    </div>
                  )}
                </Field>
              </div>
              <Field label="Server">
                <GlassDropdown
                  value={serverId}
                  options={serverOptions}
                  onChange={setServerId}
                  placeholder={`Pick from ${serverOptions.length} server type${serverOptions.length === 1 ? '' : 's'}…`}
                  searchable
                  visibleRows={6}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Racks per cluster">
                  {/* v2.18.6 — min=0 so backspace-to-empty works (NumberInput
                      lets the field go transiently empty without snapping).
                      canAdd below requires ≥1 to enable Place. */}
                  <NumberInput
                    value={racksPerCluster}
                    onChange={setRacksPerCluster}
                    min={0}
                    className="glass-input text-[11px] font-mono"
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Clusters of this size">
                  <NumberInput
                    value={clusters}
                    onChange={setClusters}
                    min={0}
                    className="glass-input text-[11px] font-mono"
                    style={INPUT_STYLE}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[10.5px] text-text-muted leading-snug">
                  {canAdd && pickedServer
                    ? `→ ${totalClusters} cluster${totalClusters === 1 ? '' : 's'} total · ${clusters} × ${racksPerCluster} rack${racksPerCluster === 1 ? '' : 's'} of ${pickedServer.name} in EACH of ${zones.join(' + ')} (${effectiveRegion}${regionIsAuthored ? '' : ' — created on Place'})`
                    : 'Pick a region, at least one zone, and a server to place racks.'}
                </span>
                <button
                  onClick={commit}
                  disabled={!canAdd}
                  className="btn-ghost text-[11px]"
                  style={{
                    padding: '6px 14px',
                    color: canAdd ? 'var(--interactive)' : 'var(--text-muted)',
                    borderColor: canAdd ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)',
                    background: canAdd ? 'rgba(129, 140, 248, 0.10)' : 'transparent',
                    cursor: canAdd ? 'pointer' : 'not-allowed',
                    opacity: canAdd ? 1 : 0.5,
                  }}
                >
                  + Place {canAdd ? `${totalClusters} cluster${totalClusters === 1 ? '' : 's'}` : '…'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.04em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

// ────────────────────────────────────────────────────────────────────────
// buildFleetFromGroup — convert a HardwareGroup template + (racks, region,
// zone) placement into a FleetSpec the engine consumes. Mirrors the
// behavior of the v2.17 FleetForm helper but locked to placement-only
// args; no per-fleet overrides slip in.
// Exported (v3 S26+) so the investment scenario helper builds hypothetical
// clusters EXACTLY the way real placements are built — single source.
// ────────────────────────────────────────────────────────────────────────
export function buildFleetFromGroup(
  g: HardwareGroup,
  rackCount: number,
  region: string,
  zone: string,
): FleetSpec {
  const ht = /amd|epyc/i.test(g.processor) ? false : true;
  return {
    hardwareGroupName: g.name,
    hardwareGroupId: g.id,
    memoryCategory: g.memoryCategory,
    memoryGibPerNode: g.memoryGibPerNode,
    rackComposition: g.rackComposition,
    socketsPerNode: g.socketsPerNode,
    coresPerSocket: g.coresPerSocket ?? 0,
    hyperthreadingEnabled: ht,
    rackCount,
    nodesPerRack: g.nodesPerRack ?? 0,
    processor: g.processor,
    isolated: g.memoryCategory === 'vhm',
    throughputCeilingMbps: null,
    homeFor: g.homeFor,
    spilloverFrom: g.spilloverFrom,
    costPerNodeUsd: g.costPerNodeUsd,
    costPerRackUsd: g.costPerRackUsd,
    usableLifeMonths: g.usableLifeMonths,
    opexPerNodeMonthlyUsd: g.opexPerNodeMonthlyUsd,
    region,
    zone,
    networkMbpsPerNode: g.networkMbpsPerNode,
    networkNicCount: g.networkNicCount,
    storageThroughputMbpsPerNode: g.storageThroughputMbpsPerNode,
    // v2.19.3 — Default new placements to 12% headroom. Matches industry-
    // standard fleet planning so the user starts with sensible defaults
    // instead of zero. `bufferAcknowledged: false` (implicit via omission)
    // means the UI will tint the input amber until the user interacts —
    // surfaces the default without forcing it on them.
    bufferDefault: { mode: 'pct', value: 12 },
  };
}

// ────────────────────────────────────────────────────────────────────────
// Section 3 — Fleet Roster
//   Region header → Zone sub-header → Hardware group → cluster rows
// ────────────────────────────────────────────────────────────────────────
type Cluster = { id: string; fleet: FleetSpec };

function FleetRoster({
  clusters,
  hwById,
  onRemove,
  onRackCountChange,
  onFleetUpdate,
  onClearAll,
}: {
  clusters: Cluster[];
  hwById: Record<string, HardwareGroup>;
  onRemove: (id: string) => void;
  onRackCountChange: (id: string, rackCount: number) => void;
  onFleetUpdate: (id: string, patch: Partial<FleetSpec>) => void;
  onClearAll?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const grouped = groupClusters(clusters);
  const totals = clusters.reduce(
    (acc, { fleet }) => {
      const nodes = totalNodes(fleet);
      acc.racks += fleet.rackCount ?? 0;
      acc.nodes += nodes;
      acc.vcpu += nodes * vcpusPerNode(fleet);
      acc.mem += nodes * (fleet.memoryGibPerNode ?? 0);
      return acc;
    },
    { racks: 0, nodes: 0, vcpu: 0, mem: 0 },
  );

  return (
    <section className="space-y-2">
      {/* v2.19.50+ — Header row with collapse toggle + inline ✕ Clear all.
          Undo is via the 5 s toast rendered by the parent FleetBuilder; no
          global Cmd/Ctrl-Z stack exists in this app. If the toast expires,
          the clear is permanent — author the structure again or reload a
          Save snapshot. */}
      <header className="flex items-center gap-2">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex-1 flex items-center gap-2 text-left transition-colors hover:bg-white/[0.02]"
          style={{ padding: 0 }}
        >
          <h2 className="section-h flex items-center gap-2 flex-1">
            <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
              {open ? '▾' : '▸'}
            </span>
            <span>Placed Clusters</span>
            <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
              {clusters.length} cluster{clusters.length === 1 ? '' : 's'} · {totals.racks.toLocaleString()} rack{totals.racks === 1 ? '' : 's'} · {totals.nodes.toLocaleString()} node{totals.nodes === 1 ? '' : 's'}
            </span>
          </h2>
        </button>
        {onClearAll && clusters.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] tracking-[0.02em] text-text-muted hover:text-red-300 transition-colors"
            style={{
              padding: '3px 10px',
              border: '1px solid rgba(239, 68, 68, 0.30)',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(239, 68, 68, 0.06)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Remove every placed cluster · 5 s undo"
          >
            ✕ Clear all
          </button>
        )}
      </header>

      {open && (
        <div className="space-y-3" style={{ paddingLeft: 12 }}>
          {grouped.map(({ region, zones }) => (
            <RegionGroup
              key={region}
              region={region}
              zones={zones}
              hwById={hwById}
              onRemove={onRemove}
              onRackCountChange={onRackCountChange}
              onFleetUpdate={onFleetUpdate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface GroupedRegion {
  region: string;
  zones: Array<{
    zone: string;
    hwGroups: Array<{ hwName: string; clusters: Cluster[] }>;
  }>;
}

function groupClusters(clusters: Cluster[]): GroupedRegion[] {
  const byRegion = new Map<string, Map<string, Map<string, Cluster[]>>>();
  for (const c of clusters) {
    const region = c.fleet.region || '(no region)';
    const zone = c.fleet.zone || '(no zone)';
    const hw = c.fleet.hardwareGroupName || '(unspecified)';
    if (!byRegion.has(region)) byRegion.set(region, new Map());
    const zMap = byRegion.get(region)!;
    if (!zMap.has(zone)) zMap.set(zone, new Map());
    const hMap = zMap.get(zone)!;
    if (!hMap.has(hw)) hMap.set(hw, []);
    hMap.get(hw)!.push(c);
  }
  return Array.from(byRegion.entries()).map(([region, zMap]) => ({
    region,
    zones: Array.from(zMap.entries()).map(([zone, hMap]) => ({
      zone,
      hwGroups: Array.from(hMap.entries()).map(([hwName, list]) => ({
        hwName,
        clusters: list,
      })),
    })),
  }));
}

function RegionGroup({
  region,
  zones,
  hwById,
  onRemove,
  onRackCountChange,
  onFleetUpdate,
}: {
  region: string;
  zones: GroupedRegion['zones'];
  hwById: Record<string, HardwareGroup>;
  onRemove: (id: string) => void;
  onRackCountChange: (id: string, rackCount: number) => void;
  onFleetUpdate: (id: string, patch: Partial<FleetSpec>) => void;
}) {
  // v2.21.2 — structural delete relocated here from the retired Regions &
  // Zones section. Cascade-removes every cluster in the region + drops the
  // authored region so it stops showing in the composer's zone pickers.
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(true);
  const totalRacks = zones.reduce(
    (n, z) => n + z.hwGroups.reduce((m, g) => m + g.clusters.reduce((k, c) => k + (c.fleet.rackCount ?? 0), 0), 0),
    0,
  );
  const totalClusters = zones.reduce(
    (n, z) => n + z.hwGroups.reduce((m, g) => m + g.clusters.length, 0),
    0,
  );
  const removeRegion = () => {
    if (
      totalClusters > 0 &&
      !window.confirm(
        `Remove region ${region}?\n\nThis deletes ${totalClusters} cluster${
          totalClusters === 1 ? '' : 's'
        } (${totalRacks.toLocaleString()} rack${totalRacks === 1 ? '' : 's'}) placed here. Hardware definitions in the Library are untouched.`,
      )
    ) {
      return;
    }
    cascadeRemoveFleets(state.fleets, region, undefined, dispatch);
    dispatch({ type: 'FLEET_REGION_REMOVE', region });
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex-1 flex items-center gap-2 text-left transition-colors hover:bg-white/[0.02]"
          style={{ padding: 0 }}
        >
          <h3 className="section-h flex items-center gap-2 flex-1">
            <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
              {open ? '▾' : '▸'}
            </span>
            <span>⌖ {region}</span>
            <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
              {totalClusters} cluster{totalClusters === 1 ? '' : 's'} · {totalRacks.toLocaleString()} rack{totalRacks === 1 ? '' : 's'}
            </span>
          </h3>
        </button>
        <button
          onClick={removeRegion}
          className="flex-shrink-0 text-text-muted hover:text-red-300 transition-colors"
          style={{ padding: '4px 8px', lineHeight: 1, fontSize: 12 }}
          title={`Remove region ${region} and every cluster in it`}
          aria-label={`Remove region ${region}`}
        >
          ✕
        </button>
      </div>
      {open && (
        <div className="space-y-2" style={{ paddingLeft: 12 }}>
          {zones.map(({ zone, hwGroups }) => (
            <ZoneGroup
              key={zone}
              region={region}
              zone={zone}
              hwGroups={hwGroups}
              hwById={hwById}
              onRemove={onRemove}
              onRackCountChange={onRackCountChange}
              onFleetUpdate={onFleetUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneGroup({
  region,
  zone,
  hwGroups,
  hwById,
  onRemove,
  onRackCountChange,
  onFleetUpdate,
}: {
  region: string;
  zone: string;
  hwGroups: GroupedRegion['zones'][number]['hwGroups'];
  hwById: Record<string, HardwareGroup>;
  onRemove: (id: string) => void;
  onRackCountChange: (id: string, rackCount: number) => void;
  onFleetUpdate: (id: string, patch: Partial<FleetSpec>) => void;
}) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(true);
  const zoneClusters = hwGroups.reduce((n, g) => n + g.clusters.length, 0);
  const removeZone = () => {
    if (
      zoneClusters > 0 &&
      !window.confirm(
        `Remove ${zone} from ${region}?\n\nThis deletes ${zoneClusters} cluster${
          zoneClusters === 1 ? '' : 's'
        } placed in this zone.`,
      )
    ) {
      return;
    }
    cascadeRemoveFleets(state.fleets, region, zone, dispatch);
    dispatch({ type: 'FLEET_REGION_ZONE_REMOVE', region, zone });
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setOpen((s) => !s)}
          className="flex items-center gap-2 text-left transition-colors hover:bg-white/[0.02]"
          style={{ padding: 0 }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
              {open ? '▾' : '▸'}
            </span>
            <span className="text-[10px] tracking-[0.04em] font-semibold" style={{ color: 'var(--interactive)' }}>
              ◈ {zone}
            </span>
          </div>
        </button>
        <button
          onClick={removeZone}
          className="flex-shrink-0 text-text-muted hover:text-red-300 transition-colors"
          style={{ padding: '2px 6px', lineHeight: 1, fontSize: 11 }}
          title={`Remove ${zone} and its clusters from ${region}`}
          aria-label={`Remove ${zone}`}
        >
          ✕
        </button>
      </div>
      {open && (
        <div className="space-y-1.5" style={{ paddingLeft: 12 }}>
          {hwGroups.map(({ hwName, clusters }) => (
            <HardwareGroupRow
              key={hwName}
              hwName={hwName}
              clusters={clusters}
              hwById={hwById}
              onRemove={onRemove}
              onRackCountChange={onRackCountChange}
              onFleetUpdate={onFleetUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// v2.19 — effectiveBuffer + resolveReserved REMOVED. Buffer math is now in
// types/index.ts (`deployableNodes(fleet)`), per-slot + utility-excluded,
// and authored per cluster in the cluster card. UI consumers call
// deployableNodes(fleet) directly.

function HardwareGroupRow({
  hwName,
  clusters,
  hwById,
  onRemove,
  onRackCountChange,
  onFleetUpdate,
}: {
  hwName: string;
  clusters: Cluster[];
  hwById: Record<string, HardwareGroup>;
  onRemove: (id: string) => void;
  onRackCountChange: (id: string, rackCount: number) => void;
  onFleetUpdate: (id: string, patch: Partial<FleetSpec>) => void;
}) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const racks = clusters.reduce((n, c) => n + (c.fleet.rackCount ?? 0), 0);

  // v2.19.14 — Fungibility coverage flag for this HW group. Amber when the
  // user has placed this hardware but hasn't authored a single accepting
  // matrix cell against it. Click jumps to Fungibility tab.
  const hwIdForFun = clusters[0]?.fleet.hardwareGroupId;
  const funStatus = hwIdForFun
    ? hardwareFungibilityStatus(hwIdForFun, state.userFungibility as FungibilityMatrix)
    : null;
  const fungibilityMissing = !!hwIdForFun && funStatus !== null && !funStatus.hasAccepting;
  const slotTotals = clusters.reduce(
    (acc, c) => {
      const dep = deployableNodes(c.fleet);
      acc.nodes += dep.totalNonUtility;
      acc.reserved += dep.reserved;
      acc.deployable += dep.deployable;
      return acc;
    },
    { nodes: 0, reserved: 0, deployable: 0 },
  );
  const nodes = slotTotals.nodes;
  const deployable = slotTotals.deployable;

  // v2.19.2 — Buffer is now authored on this always-visible header so the
  // user can't miss it. Resolves the "consensus" buffer across clusters of
  // the group:
  //   - All clusters share the same bufferDefault → show that.
  //   - Any clusters differ (mixed) → show 'mixed' indicator; input still
  //     edits the FIRST cluster's value as the prototype.
  // Setting a value here BULK-APPLIES bufferDefault to every cluster in the
  // group, which matches how users actually think ("all my Sample Reference
  // Server clusters reserve 12%"). Per-cluster overrides still possible via
  // the expanded ClusterCard.
  const groupBuf = clusters[0]?.fleet.bufferDefault;
  const isMixed = clusters.some((c) => {
    const a = c.fleet.bufferDefault;
    if (!a && !groupBuf) return false;
    if (!a || !groupBuf) return true;
    return a.mode !== groupBuf.mode || a.value !== groupBuf.value;
  });
  const groupBufMode: 'pct' | 'fixed' = groupBuf?.mode ?? 'pct';
  const groupBufValue = groupBuf?.value ?? 0;
  // v2.19.3 — Amber "check buffer" cue when ANY cluster in the row hasn't
  // been acknowledged. Acknowledgment is per-cluster; any interaction with
  // the row's Mode pill or value input flips every cluster in the row to
  // acknowledged. Migrated v2.18 fleets start acknowledged because the user
  // had explicit intent when they set the v2.18 group buffer.
  const needsAttention = clusters.some((c) => !c.fleet.bufferAcknowledged);
  const acknowledgeAll = () => {
    for (const c of clusters) {
      if (!c.fleet.bufferAcknowledged) {
        onFleetUpdate(c.id, { bufferAcknowledged: true });
      }
    }
  };
  const setGroupMode = (m: 'pct' | 'fixed') => {
    const value = groupBuf?.value ?? (m === 'pct' ? 12 : 4);
    for (const c of clusters) {
      onFleetUpdate(c.id, {
        bufferDefault: { mode: m, value },
        bufferAcknowledged: true,
      });
    }
  };
  const setGroupValue = (v: number) => {
    const mode = groupBuf?.mode ?? 'pct';
    const value = Math.max(0, Math.floor(v));
    for (const c of clusters) {
      onFleetUpdate(c.id, {
        bufferDefault: { mode, value },
        bufferAcknowledged: true,
      });
    }
  };

  const hwId = clusters[0]?.fleet.hardwareGroupId;
  // v2.19.32 — Fleet Builder ✎ no longer routes to the Hardware Library, so
  // the hwById lookup gate (canEditInLibrary) was retired. Edit always
  // routes to the Place Racks composer with the first cluster as template.
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Header — ALWAYS visible. v2.19.15: restructured into two stacked
          rows so the narrow sidebar can't crumple the buffer controls into
          a vertical word-pile. Row 1 = identity + edit (truncates cleanly);
          Row 2 = buffer control group + fungibility chip (each an atomic
          flex-shrink-0 unit that wraps as a whole, never mid-token).
          v2.19.36 — Entire header is now clickable (not just the identity
          area). Click delegation skips interactive children — buttons,
          inputs, the buffer ModePill, fungibility chip, etc. — so they
          don't accidentally toggle the row. The expanded body below is
          NOT a toggle surface; only the header is. */}
      <div
        className="px-3 py-2 space-y-2"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          // Don't toggle when the click landed on a real interactive
          // control inside the header.
          const t = e.target as HTMLElement | null;
          if (
            t &&
            t.closest(
              'button, input, select, textarea, a, [role="button"], [role="group"], [aria-haspopup], [data-row-action], [data-no-toggle]',
            )
          ) {
            return;
          }
          setOpen((s) => !s);
        }}
      >
        {/* Row 1 — identity. */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--interactive)' }}>
              {open ? '▾' : '▸'}
            </span>
            <span className="text-[10px] text-text-muted font-mono flex-shrink-0">▦</span>
            <span className="text-[11px] text-text-primary font-mono truncate min-w-0" title={hwName}>
              {hwName}
            </span>
            <span className="text-[10px] font-mono text-text-muted whitespace-nowrap flex-shrink-0">
              {clusters.length} cluster{clusters.length === 1 ? '' : 's'} · {racks} rack{racks === 1 ? '' : 's'} · {deployable.toLocaleString()}/{nodes.toLocaleString()} nodes
            </span>
          </div>

          {/* v2.19.32 — ✎ now opens the Fleet Builder Place Racks composer
              pre-filled from THIS row's first cluster (region, zone, hw,
              racks). Previously diverted to the Hardware Library; user
              feedback: they wanted to stay in Fleet Builder. The bucket's
              first cluster acts as the template — multiple identical
              clusters in a row pre-fill identically. */}
          {clusters.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({
                  type: 'UI_SET',
                  ui: { pendingPlaceFromClusterId: clusters[0].id },
                });
              }}
              className="text-[11px] text-text-muted hover:text-interactive transition-colors flex-shrink-0"
              style={{ padding: '4px 8px', lineHeight: 1 }}
              title={`Edit ${hwName} — pre-fills the Place Racks composer with this cluster's region, zone, server, and rack count`}
              aria-label={`Edit ${hwName} in the Place Racks composer`}
            >
              ✎
            </button>
          )}
          {/* v2.19.26 — Cascade-delete ✕ so users can drop a placed HW group
              without expanding the row + clicking each cluster's individual
              ✕. Matches RegionRow's ✕ style for visual consistency; confirms
              with a count when ≥1 cluster would go away. */}
          {clusters.length > 0 && (
            <button
              data-row-action
              onClick={(e) => {
                e.stopPropagation();
                const ok = window.confirm(
                  `Remove ${hwName}? This will also remove ${clusters.length} placed cluster${clusters.length === 1 ? '' : 's'} (${racks} rack${racks === 1 ? '' : 's'}).`,
                );
                if (!ok) return;
                for (const c of clusters) dispatch({ type: 'FLEET_REMOVE', id: c.id });
              }}
              className="text-[12px] text-text-muted hover:text-red-300 transition-colors flex-shrink-0"
              style={{ padding: '4px 8px', lineHeight: 1 }}
              title={`Remove ${hwName} and its ${clusters.length} cluster${clusters.length === 1 ? '' : 's'}`}
              aria-label={`Remove hardware group ${hwName} from this zone`}
            >
              ✕
            </button>
          )}
        </div>

        {/* Row 2 — controls. Buffer group + fungibility chip; both shrink-0
            and wrap as whole units when the pane is narrow. */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* v2.19.32 — Was a <label> wrapping ModePill + NumberInput.
              Browsers treat a label that contains a form control as a
              focus-forwarder for that control; clicking the % / # buttons
              inside the label was confusingly forwarding focus to the
              NumberInput and could swallow the toggle on some browsers,
              leaving the buffer mode visually "stuck on percentage." Plain
              <div> wrapper removes that intercept entirely. */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            title={
              needsAttention
                ? 'Default buffer (12%) is set but you haven\'t confirmed it. Click the value or pill to acknowledge — the amber cue will clear.'
                : isMixed
                ? 'Clusters in this group have different buffer values. Editing here will overwrite them all.'
                : 'Reserve headroom for failover / maintenance on every cluster of this server. Utility nodes are already excluded.'
            }
            style={
              needsAttention
                ? {
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.45)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '2px 8px 2px 6px',
                    boxShadow: '0 0 10px rgba(251, 191, 36, 0.18)',
                  }
                : undefined
            }
          >
            <span
              className="text-[9px] tracking-[0.04em] whitespace-nowrap"
              style={{ color: needsAttention ? '#FCD34D' : 'var(--text-muted)' }}
            >
              {needsAttention && <span style={{ marginRight: 4 }}>⚠</span>}
              Buffer
            </span>
            <ModePill mode={groupBufMode} onChange={setGroupMode} compact />
            <NumberInput
              value={groupBufValue}
              onChange={setGroupValue}
              onFocus={() => {
                // v2.19.3 — Clicking into the field counts as interaction;
                // user has seen the default and engaged with it. Clears amber
                // even if they don't change the value.
                if (needsAttention) acknowledgeAll();
              }}
              min={0}
              max={groupBufMode === 'pct' ? 50 : undefined}
              className="glass-input text-[11px] font-mono text-right"
              style={{
                padding: '4px 8px',
                width: 60,
                ...(needsAttention
                  ? { borderColor: 'rgba(251, 191, 36, 0.55)' }
                  : {}),
              }}
              aria-label={`Buffer for ${hwName}`}
            />
            <span className="text-[10px] text-text-muted" style={{ minWidth: 14 }}>
              {groupBufMode === 'pct' ? '%' : '#'}
            </span>
            {needsAttention && !isMixed && (
              <span
                className="text-[9px] tracking-[0.04em] whitespace-nowrap"
                style={{ color: '#FCD34D' }}
              >
                check
              </span>
            )}
            {isMixed && (
              <span
                className="text-[9px] tracking-[0.04em] whitespace-nowrap"
                style={{ color: '#FCD34D' }}
                title="Clusters in this group have different per-cluster overrides"
              >
                mixed
              </span>
            )}
          </div>

          {/* v2.19.14 — Fungibility coverage chip. Amber ⚠ button when the
              user hasn't authored any accepting cells against this HW group;
              quiet ● Fungibility OK when at least one Home/Spillover exists.
              Click jumps straight to the Fungibility tab. */}
          {hwIdForFun && (
            fungibilityMissing ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fungibility' } });
                }}
                className="text-[10px] font-medium tracking-[0.02em] transition-all flex-shrink-0 whitespace-nowrap"
                style={{
                  padding: '3px 8px',
                  background: 'rgba(251, 191, 36, 0.10)',
                  color: '#FCD34D',
                  border: '1px solid rgba(251, 191, 36, 0.45)',
                  borderRadius: 'var(--radius-pill)',
                  boxShadow: '0 0 10px rgba(251, 191, 36, 0.18)',
                  cursor: 'pointer',
                  lineHeight: 1.1,
                }}
                title={`No fungibility rules author this hardware as a target. Until at least one VM class has a Home or Spillover cell on ${hwName}, the engine has nothing to route to it. Click to open the Fungibility tab.`}
                aria-label={`Fungibility missing for ${hwName} — open Fungibility tab`}
              >
                ⚠ Set fungibility
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'UI_SET', ui: { activeSidebarTab: 'fungibility' } });
                }}
                className="text-[10px] font-medium tracking-[0.02em] transition-all flex-shrink-0 whitespace-nowrap"
                style={{
                  padding: '3px 8px',
                  background: 'rgba(129, 140, 248, 0.08)',
                  color: 'var(--interactive)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  lineHeight: 1.1,
                }}
                title={`${funStatus?.acceptingCount ?? 0} VM class${(funStatus?.acceptingCount ?? 0) === 1 ? '' : 'es'} can route to ${hwName}. Click to open the Fungibility tab.`}
                aria-label={`Fungibility configured for ${hwName} — open Fungibility tab`}
              >
                ● Fungibility
              </button>
            )
          )}
        </div>
      </div>

      {open && (
        <div
          className="px-3 pb-3 pt-1 space-y-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {clusters.map((c) => (
            <ClusterCard
              key={c.id}
              cluster={c}
              onRemove={() => onRemove(c.id)}
              onRackCountChange={(n) => onRackCountChange(c.id, n)}
              onFleetUpdate={(patch) => onFleetUpdate(c.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClusterCard({
  cluster,
  onRemove,
  onRackCountChange,
  onFleetUpdate,
}: {
  cluster: Cluster;
  onRemove: () => void;
  onRackCountChange: (rackCount: number) => void;
  /** v2.19 — Generic fleet patch for buffer override authoring. */
  onFleetUpdate: (patch: Partial<FleetSpec>) => void;
}) {
  const { state } = useApp();
  const { fleet } = cluster;
  const nodes = totalNodes(fleet);
  const vcpu = nodes * vcpusPerNode(fleet);
  const memTiB = (nodes * (fleet.memoryGibPerNode ?? 0)) / 1024;
  const dep = deployableNodes(fleet);
  const heterogeneous = hasHeterogeneousNonUtility(fleet);
  const overrides = fleet.bufferByMemGib ?? {};
  const hasOverrides = Object.keys(overrides).length > 0;
  const [overridesOpen, setOverridesOpen] = useState(hasOverrides);
  // v2.19.32 — Available zones for this cluster's region. Empty array
  // when the region has no zones authored yet (the picker still renders;
  // user can pick a zone after authoring one in Build Regions & Zones).
  const availableZones = useMemo(
    () =>
      state.fleetRegions.find((r) => r.region === fleet.region)?.zones ?? [],
    [state.fleetRegions, fleet.region],
  );
  return (
    <div
      className="px-3 py-2 space-y-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Row 1 — Identity + Racks + Remove. Cluster-wide buffer is now
          authored on the HW group header (one input bulk-applies). This
          card focuses on per-cluster placement + per-node-type overrides. */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] text-text-muted font-mono">▦</span>
          <span className="text-[11px] text-text-primary font-mono truncate" title={fleet.hardwareGroupName}>
            {fleet.hardwareGroupName}
          </span>
        </div>
        <label className="flex items-center gap-1.5">
          <span className="text-[9px] tracking-[0.04em] text-text-muted">Racks</span>
          <NumberInput
            value={fleet.rackCount ?? 0}
            onChange={onRackCountChange}
            min={0}
            className="glass-input text-[11px] font-mono text-right"
            style={{ padding: '4px 8px', width: 64 }}
            aria-label="Rack count for this cluster"
          />
        </label>
        <button
          onClick={onRemove}
          className="text-[12px] text-text-muted hover:text-red-300 transition-colors"
          style={{ padding: '4px 8px', lineHeight: 1 }}
          title="Remove this cluster"
          aria-label="Remove cluster"
        >
          ✕
        </button>
      </div>

      {/* v2.19.32 — Per-cluster AZ picker. User asked for AZ changes to be
          available in the expanded cluster card so they don't have to remove
          + re-place to retag. Single-select chips over the region's
          authored zones; empty region → no zones shown (with a hint). */}
      <div className="flex items-center gap-2 text-[10px] flex-wrap">
        <span className="text-[9px] tracking-[0.04em] text-text-muted">
          Zone
        </span>
        {availableZones.length === 0 ? (
          <span className="text-text-muted italic">
            No zones authored in {fleet.region || 'this region'} yet — add one in Build Regions & Zones above.
          </span>
        ) : (
          availableZones.map((z) => {
            const active = (fleet.zone ?? '') === z;
            return (
              <button
                key={z}
                onClick={() => onFleetUpdate({ zone: active ? undefined : z })}
                className="text-[10px] font-mono transition-all"
                style={{
                  padding: '2px 8px',
                  background: active
                    ? 'rgba(129, 140, 248, 0.22)'
                    : 'rgba(129, 140, 248, 0.05)',
                  color: 'var(--interactive)',
                  border: `1px solid ${
                    active
                      ? 'var(--border-glow)'
                      : 'rgba(129, 140, 248, 0.25)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  opacity: active ? 1 : 0.75,
                  lineHeight: 1.2,
                }}
                title={
                  active
                    ? `This cluster is in ${z} — click to unassign`
                    : `Move this cluster to ${z}`
                }
                aria-pressed={active}
              >
                {z.replace('Zone ', 'Z')}
              </button>
            );
          })
        )}
      </div>

      {/* Row 2 — Derived stats. Utility breakdown surfaces only when present. */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted flex-wrap">
        <span>{dep.totalNonUtility.toLocaleString()} nodes</span>
        {dep.totalNonUtility < nodes && (
          <>
            <span className="text-text-muted/60">(</span>
            <span title="Utility nodes do not accept workloads — already reserved.">
              +{(nodes - dep.totalNonUtility).toLocaleString()} utility
            </span>
            <span className="text-text-muted/60">)</span>
          </>
        )}
        <span>·</span>
        <span>{vcpu.toLocaleString()} vCPU</span>
        <span>·</span>
        <span>{memTiB.toFixed(1)} TiB</span>
        <span className="text-text-muted/60">|</span>
        <span style={{ color: 'var(--interactive)' }}>
          {dep.deployable.toLocaleString()} deployable · {dep.reserved.toLocaleString()} reserved
        </span>
      </div>

      {/* Row 3 — Per-node-type override disclosure, ONLY for heterogeneous
          racks (e.g. Gen-B HM Mixed — 2× 8 TiB + 1× 16 TiB compute). Homogeneous
          clusters never see this row. */}
      {heterogeneous && (
        <PerNodeTypeOverride
          dep={dep}
          fleet={fleet}
          open={overridesOpen}
          onToggle={() => setOverridesOpen((s) => !s)}
          onFleetUpdate={onFleetUpdate}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// v2.19 — Per-node-type Buffer override disclosure. ONLY rendered for
// heterogeneous racks (e.g. Gen-B HM Mixed with 2× 8 TiB + 1× 16 TiB compute).
// The cluster-wide default is now authored inline on the ClusterCard row;
// this component handles only the optional per-memory-tier overrides.
// ────────────────────────────────────────────────────────────────────────
function PerNodeTypeOverride({
  fleet,
  dep,
  open,
  onToggle,
  onFleetUpdate,
}: {
  fleet: FleetSpec;
  dep: ReturnType<typeof deployableNodes>;
  open: boolean;
  onToggle: () => void;
  onFleetUpdate: (patch: Partial<FleetSpec>) => void;
}) {
  const def = fleet.bufferDefault;
  const overrides = fleet.bufferByMemGib ?? {};
  const updateOverride = (memGib: number, patch: Partial<BufferSpec>) => {
    const key = String(memGib);
    const current = overrides[key] ?? def ?? { mode: 'pct', value: 12 };
    const next = { ...overrides, [key]: { ...current, ...patch } as BufferSpec };
    onFleetUpdate({ bufferByMemGib: next });
  };
  const removeOverride = (memGib: number) => {
    const key = String(memGib);
    const { [key]: _drop, ...rest } = overrides;
    void _drop;
    onFleetUpdate({ bufferByMemGib: Object.keys(rest).length > 0 ? rest : undefined });
  };
  const overrideCount = Object.keys(overrides).length;
  return (
    <div className="space-y-1.5">
      <button
        onClick={onToggle}
        className="text-[10px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5"
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        title="Override the cluster buffer per memory tier (e.g. 12% of 8 TiB but only 4% of 16 TiB)"
      >
        <span style={{ color: 'var(--interactive)' }}>{open ? '▾' : '▸'}</span>
        Per node type
        {overrideCount > 0 && !open && (
          <span className="text-text-muted">
            · {overrideCount} override{overrideCount === 1 ? '' : 's'}
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-1.5 pl-3">
          {dep.perSlot.map((s) => {
            const key = String(s.memGib);
            const ov = overrides[key];
            const memLabel = s.memGib >= 1024
              ? `${(s.memGib / 1024).toFixed(s.memGib % 1024 === 0 ? 0 : 1)} TiB`
              : `${s.memGib} GiB`;
            return (
              <div
                key={key}
                className="flex items-center gap-2 flex-wrap text-[10px] font-mono"
              >
                <span className="text-text-secondary" style={{ minWidth: 90 }}>
                  {memLabel} · {s.countPerRack}/rack
                </span>
                <ModePill
                  mode={(ov ?? def)?.mode ?? 'pct'}
                  onChange={(m) => updateOverride(s.memGib, { mode: m })}
                  compact
                />
                <NumberInput
                  value={(ov ?? def)?.value ?? 0}
                  onChange={(v) => updateOverride(s.memGib, { value: Math.max(0, Math.floor(v)) })}
                  min={0}
                  max={((ov ?? def)?.mode ?? 'pct') === 'pct' ? 50 : undefined}
                  className="glass-input text-[11px] font-mono text-right"
                  style={{ padding: '3px 6px', width: 60 }}
                  aria-label={`Buffer for ${memLabel} tier`}
                />
                <span className="text-text-muted" style={{ minWidth: 14 }}>
                  {((ov ?? def)?.mode ?? 'pct') === 'fixed' ? '#' : '%'}
                </span>
                <span className="text-text-muted/70">
                  → {s.deployable}/{s.totalCount} deployable
                </span>
                {ov && (
                  <button
                    onClick={() => removeOverride(s.memGib)}
                    className="text-text-muted hover:text-text-secondary transition-colors"
                    style={{ background: 'transparent', border: 'none', padding: '0 4px', cursor: 'pointer' }}
                    title="Remove this override — falls back to the cluster default"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModePill({
  mode,
  onChange,
  compact = false,
}: {
  mode: 'pct' | 'fixed';
  onChange: (m: 'pct' | 'fixed') => void;
  compact?: boolean;
}) {
  const Btn = ({ active, label, value }: { active: boolean; label: string; value: 'pct' | 'fixed' }) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className="text-[10px] font-semibold transition-all"
      style={{
        padding: compact ? '3px 8px' : '5px 10px',
        borderRadius: 'var(--radius-pill)',
        background: active
          ? 'linear-gradient(180deg, var(--interactive), var(--interactive-hover))'
          : 'transparent',
        color: active ? '#04111A' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      className="grid grid-cols-2 gap-1 p-1"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <Btn active={mode === 'pct'} label="%" value="pct" />
      <Btn active={mode === 'fixed'} label="#" value="fixed" />
    </div>
  );
}

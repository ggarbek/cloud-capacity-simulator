/**
 * QuickStartTab (v2.20.1) — the fewest-clicks path through the whole
 * authoring workflow.
 *
 * The five-tab flow (Hardware → Fleet → Fungibility → BoM → Run) is
 * powerful but slow to walk for a first scenario. This tab compresses it
 * into one form: pick a server (library or starter profile) → pick where
 * (region + zones + racks; ZONAL by default — deployments usually are) →
 * type the demand → Build & run. Everything dispatches through the same
 * state + template contract the deep tabs use (`buildQuickStartPatch` →
 * HYDRATE; engine via `buildAndRunSimulation` — never forked), and the
 * result is fully editable in the deep tabs afterwards. Strictly
 * additive: nothing existing is modified or removed.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { NumberInput } from './NumberInput';
import { ProviderPillRow } from './ProviderPillRow';
import { providerOf, vmFamily, compareFamily, PROVIDER_ORDER } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { REGION_GEO } from '../data/regionCoordinates';
import { ZONES, VM_CATEGORIES, type VmCategory, type CatalogEntry } from '../types';
import {
  buildQuickStartPatch,
  STARTER_SERVERS,
  type QuickStartDemandRow,
} from '../utils/quickStartTemplate';
import { buildAndRunSimulation, regionScopedCatalog } from '../utils/runEngine';

const INPUT_STYLE: React.CSSProperties = { height: 32, padding: '0 10px', width: '100%' };

export function QuickStartTab() {
  const { state, dispatch } = useApp();

  // ── Intent state ────────────────────────────────────────────────────
  const [hwId, setHwId] = useState('');
  const [region, setRegion] = useState('');
  const [customRegion, setCustomRegion] = useState('');
  const [zones, setZones] = useState<string[]>(['Zone 1', 'Zone 2']);
  const [racksPerZone, setRacksPerZone] = useState(2);
  const [demand, setDemand] = useState<QuickStartDemandRow[]>([]);
  const [deployment, setDeployment] = useState<'zonal' | 'regional'>('zonal');
  const [building, setBuilding] = useState(false);

  // ── Server options: the user's library first, starter profiles after ──
  const serverOptions: DropdownOption[] = useMemo(() => {
    const lib = state.userHardware.map((g) => ({
      value: g.id,
      label: g.name,
      meta: `${g.memoryGibPerNode >= 1024 ? `${(g.memoryGibPerNode / 1024).toFixed(g.memoryGibPerNode % 1024 === 0 ? 0 : 1)} TiB` : `${g.memoryGibPerNode} GiB`}/node · ${g.nodesPerRack ?? '?'} nodes/rack · your library`,
    }));
    const starters = STARTER_SERVERS.filter(
      (s) => !state.userHardware.some((g) => g.id === s.id),
    ).map((s) => ({
      value: s.id,
      label: s.name,
      meta: `${s.memoryGibPerNode} GiB/node · ${s.nodesPerRack} nodes/rack · starter profile`,
    }));
    return [...lib, ...starters];
  }, [state.userHardware]);
  const hardware =
    state.userHardware.find((g) => g.id === hwId) ??
    STARTER_SERVERS.find((s) => s.id === hwId);

  // ── Region options: authored regions + public region names + custom ──
  const CUSTOM = '__custom__';
  const regionOptions: DropdownOption[] = useMemo(() => {
    const seen = new Set<string>();
    const out: DropdownOption[] = [{ value: CUSTOM, label: '✎ Custom region…' }];
    for (const r of state.fleetRegions) {
      seen.add(r.region);
      out.push({ value: r.region, label: r.region, meta: 'already authored' });
    }
    for (const g of REGION_GEO) {
      if (seen.has(g.region)) continue;
      seen.add(g.region);
      out.push({ value: g.region, label: g.region, meta: g.provider });
    }
    return out;
  }, [state.fleetRegions]);
  const effectiveRegion = region === CUSTOM ? customRegion.trim() : region;

  // S68 — pre-fill the server and the region so a first-time visitor has
  // exactly ONE decision to make (step 3: what to place). The form used to
  // open with every dropdown empty, which reads as a wall of questions to
  // someone who does not yet know what a rack or a zone is for. Both stay
  // fully editable; this only fills a blank, never overrides a pick.
  useEffect(() => {
    if (hwId || serverOptions.length === 0) return;
    setHwId(serverOptions[0].value);
  }, [hwId, serverOptions]);

  useEffect(() => {
    if (region || !hardware) return;
    // Prefer a region already authored in this fleet, then one belonging to
    // the chosen server's provider, then simply the first real option.
    const real = regionOptions.filter((o) => o.value !== CUSTOM);
    if (real.length === 0) return;
    const authored = real.find((o) => o.meta === 'already authored');
    const sameProvider = real.find((o) => o.meta === hardware.provider);
    setRegion((authored ?? sameProvider ?? real[0]).value);
  }, [region, hardware, regionOptions]);

  // ── Demand picker — a simpler version of the VM-demand BoM add: a
  //    Cloud Provider → VM Category → VM Family filter cascade scoping a
  //    pickable list of sizes, with a search box that narrows further.
  const [query, setQuery] = useState('');
  const [qProvider, setQProvider] = useState<string | null>(null);
  const [qCategory, setQCategory] = useState<VmCategory | null>(null);
  const [qFamilies, setQFamilies] = useState<Set<string>>(new Set());
  const catalog = useMemo(() => regionScopedCatalog(state), [state.userVms, state.ui.activeRegion]); // eslint-disable-line react-hooks/exhaustive-deps
  const categoryOf = (v: CatalogEntry): VmCategory => (v.category ?? categorize(v.provider, v.family)) as VmCategory;

  // Provider list + (for the active provider) category → families hierarchy.
  const filterData = useMemo(() => {
    const provs = new Set<string>();
    const byCat = new Map<VmCategory, Set<string>>();
    for (const v of catalog) {
      const p = providerOf(v);
      provs.add(p);
      if (p !== qProvider) continue;
      const c = categoryOf(v);
      if (!byCat.has(c)) byCat.set(c, new Set());
      byCat.get(c)!.add(vmFamily(v));
    }
    const providers = [
      ...PROVIDER_ORDER.filter((p) => provs.has(p)),
      ...[...provs].filter((p) => !(PROVIDER_ORDER as readonly string[]).includes(p)).sort(),
    ];
    const categories = VM_CATEGORIES.filter((c) => byCat.has(c)).map((c) => ({ category: c, count: byCat.get(c)!.size }));
    const families = qCategory ? [...(byCat.get(qCategory) ?? [])].sort(compareFamily) : [];
    return { providers, categories, families };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, qProvider, qCategory]);

  // Auto-pick provider + category so the picker is never blank.
  useEffect(() => {
    if (filterData.providers.length === 0) return;
    if (qProvider && filterData.providers.includes(qProvider)) return;
    setQProvider(filterData.providers[0]);
  }, [filterData.providers, qProvider]);
  useEffect(() => {
    if (filterData.categories.length === 0) return;
    if (qCategory && filterData.categories.some((c) => c.category === qCategory)) return;
    setQCategory(filterData.categories[0].category);
    setQFamilies(new Set());
  }, [filterData.categories, qCategory]);

  // The scoped, deduped, not-yet-added sizes the search/list pick from.
  const scopedSizes = useMemo(() => {
    if (!qProvider || !qCategory) return [] as CatalogEntry[];
    const q = query.trim().toLowerCase();
    const seen = new Set(demand.map((d) => d.vmSizeName));
    const out: CatalogEntry[] = [];
    for (const v of catalog) {
      if (providerOf(v) !== qProvider) continue;
      if (categoryOf(v) !== qCategory) continue;
      if (qFamilies.size > 0 && !qFamilies.has(vmFamily(v))) continue;
      if (seen.has(v.vmSizeName)) continue;
      if (q && !v.vmSizeName.toLowerCase().replace(/^standard_/, '').includes(q)) continue;
      seen.add(v.vmSizeName);
      out.push(v);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, qProvider, qCategory, qFamilies, demand, query]);

  const toggleQFamily = (fam: string) =>
    setQFamilies((prev) => {
      const n = new Set(prev);
      if (n.has(fam)) n.delete(fam);
      else n.add(fam);
      return n;
    });

  const addDemand = (vmSizeName: string) => {
    setDemand((d) => [...d, { vmSizeName, quantity: 50 }]);
  };

  // ── Live preview of what Build will author ────────────────────────────
  const intentValid =
    !!hardware && !!effectiveRegion && zones.length > 0 && racksPerZone >= 1 && demand.some((d) => d.quantity > 0);
  const preview = useMemo(() => {
    if (!intentValid || !hardware) return null;
    return buildQuickStartPatch(state, {
      hardware,
      region: effectiveRegion,
      zones,
      racksPerZone,
      demand,
      deployment,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentValid, hardware, effectiveRegion, zones, racksPerZone, demand, deployment, state.userHardware, state.fleets, state.bom, state.userFungibility]);

  const nodesPerZone = hardware ? racksPerZone * (hardware.nodesPerRack ?? 0) : 0;
  const totalVms = demand.reduce((s, d) => s + (d.quantity || 0), 0);

  const buildAndRun = () => {
    if (!preview || building) return;
    setBuilding(true);
    dispatch({ type: 'HYDRATE', state: preview.patch });
    const merged = { ...state, ...preview.patch } as typeof state;
    dispatch({ type: 'RUN_START' });
    const result = buildAndRunSimulation(merged);
    dispatch({ type: 'RUN_COMPLETE', result });
    // v2.21 — RUN_COMPLETE navigates the shell to the Results overview;
    // the old pane-collapse dance is gone with the three-pane workspace.
    setBuilding(false);
    // Reset the demand staging; keep server/region so the user can layer
    // another scenario without re-picking.
    setDemand([]);
  };

  const hasExisting =
    state.fleetOrder.some((id) => state.fleets[id]?.hardwareGroupName?.trim()) ||
    state.bom.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-text-primary">
      <section>
        <h2 className="section-h gap-2">
          <span>⚡ Quick start</span>
          <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
            · scenario in four picks — everything stays editable in the tabs
          </span>
        </h2>
        <div className="text-[11px] text-text-secondary mt-2 leading-snug">
          Pick a server, where it goes, and what you need to place — Quick start
          authors the region, zones, clusters, BoM, and fungibility routing for
          you and runs the simulation. Use the numbered tabs for full control;
          everything built here lands there too.
          {hasExisting && (
            <span className="block mt-1 text-[10px]" style={{ color: 'var(--interactive)' }}>
              ● You already have a fleet/BoM — Quick start ADDS to it, nothing is replaced.
            </span>
          )}
        </div>
      </section>

      {/* ── 1 · Server ──────────────────────────────────────────────────── */}
      <Card
        step={1}
        title="Pick a server"
        subtitle="The machine your fleet is built from — how much memory and CPU one node has. Racks of this server are what your VMs will land on."
      >
        <GlassDropdown
          value={hwId}
          options={serverOptions}
          onChange={setHwId}
          placeholder={
            state.userHardware.length > 0
              ? `Pick from ${serverOptions.length} option${serverOptions.length === 1 ? '' : 's'} (your library + starter profiles)…`
              : 'Pick a starter profile — or build your own in the Hardware Library…'
          }
          searchable
          visibleRows={6}
        />
        {hardware && (
          <div className="text-[10.5px] text-text-muted mt-2">
            {hardware.memoryGibPerNode.toLocaleString()} GiB · {hardware.vcpusPerNode ?? '—'} vCPU per node
            · {hardware.nodesPerRack} nodes/rack
            {hardware.costPerRackUsd ? ` · ~$${(hardware.costPerRackUsd / 1000).toFixed(0)}K/rack` : ' · no cost set'}
          </div>
        )}
      </Card>

      {/* ── 2 · Where ───────────────────────────────────────────────────── */}
      <Card
        step={2}
        title="Where it goes"
        subtitle="A region is a location; zones are the independent failure domains inside it. One identical cluster is placed in each zone you pick, so two zones means two copies."
      >
        <div className="space-y-3">
          <Field label="Region">
            <GlassDropdown
              value={region}
              options={regionOptions}
              onChange={setRegion}
              placeholder="Pick a region (or define a custom one)…"
              searchable
              visibleRows={6}
            />
          </Field>
          {region === CUSTOM && (
            <input
              className="glass-input text-[11px]"
              style={INPUT_STYLE}
              placeholder="Custom region name…"
              value={customRegion}
              onChange={(e) => setCustomRegion(e.target.value)}
            />
          )}
          <Field label={`Zones · one identical cluster lands in EACH (${zones.length} picked)`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ZONES.map((z) => {
                const on = zones.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZones((zs) => (on ? zs.filter((x) => x !== z) : [...zs, z]))}
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
                  >
                    {on ? '✓ ' : ''}{z}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Racks per zone">
              <NumberInput
                value={racksPerZone}
                onChange={(n) => setRacksPerZone(Math.max(0, n))}
                min={0}
                className="glass-input text-[11px] font-mono"
                style={INPUT_STYLE}
              />
            </Field>
            <div className="text-[10.5px] text-text-muted self-end pb-2">
              {hardware && zones.length > 0
                ? `= ${(nodesPerZone * zones.length).toLocaleString()} nodes total · 12% buffer reserved per cluster`
                : ' '}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3 · Demand ──────────────────────────────────────────────────── */}
      <Card
        step={3}
        title="What you need to place"
        subtitle="Your demand — the VM sizes you have committed to run, and how many of each. This is the only thing you have to choose; everything above is already filled in."
      >
        <div className="space-y-2">
          {/* Filter cascade — a simpler version of the VM-demand BoM add. */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <FilterRow label="Cloud Provider">
              <ProviderPillRow
                mode="single"
                value={qProvider}
                onChange={(next) => {
                  if (typeof next === 'string') {
                    setQProvider(next);
                    setQCategory(null);
                    setQFamilies(new Set());
                  }
                }}
              />
            </FilterRow>
            {filterData.categories.length > 0 && (
              <FilterRow label="VM Category" count={filterData.categories.length}>
                {filterData.categories.map(({ category, count }) => (
                  <QSChip
                    key={category}
                    label={`${category} · ${count}`}
                    active={qCategory === category}
                    onClick={() => {
                      setQCategory(category);
                      setQFamilies(new Set());
                    }}
                  />
                ))}
              </FilterRow>
            )}
            {qCategory && filterData.families.length > 0 && (
              <FilterRow label={`VM Family · ${filterData.families.length} in ${qCategory}`}>
                {filterData.families.map((f) => (
                  <QSChip key={f} label={f} active={qFamilies.has(f)} onClick={() => toggleQFamily(f)} />
                ))}
                {qFamilies.size > 0 && (
                  <button
                    onClick={() => setQFamilies(new Set())}
                    className="text-[10px] text-text-muted hover:text-text-primary transition-colors"
                    style={{ padding: '3px 6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                )}
              </FilterRow>
            )}
          </div>

          {/* Search + the scoped, clickable size list. */}
          <input
            className="glass-input text-[11px]"
            style={INPUT_STYLE}
            placeholder={`Search ${scopedSizes.length.toLocaleString()} size${scopedSizes.length === 1 ? '' : 's'} in scope…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div
            style={{
              maxHeight: 168,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {scopedSizes.length === 0 ? (
              <div className="text-[10.5px] text-text-muted italic px-3 py-3 text-center">
                {qProvider && qCategory ? 'No sizes match — adjust the filters or search.' : 'Pick a provider + category above.'}
              </div>
            ) : (
              scopedSizes.slice(0, 80).map((v) => (
                <button
                  key={v.vmSizeName}
                  type="button"
                  onClick={() => addDemand(v.vmSizeName)}
                  className="w-full text-left flex items-baseline gap-2 hover:bg-white/[0.05] transition-colors"
                  style={{ padding: '6px 10px' }}
                >
                  <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>+</span>
                  <span className="text-[11px] font-mono text-text-primary">{v.vmSizeName.replace(/^Standard_/, '')}</span>
                  <span className="text-[9.5px] text-text-muted ml-auto whitespace-nowrap">
                    {v.vcpus} vCPU · {formatGiB(v.memoryGib)}
                  </span>
                </button>
              ))
            )}
            {scopedSizes.length > 80 && (
              <div className="text-[9.5px] text-text-dim italic px-3 py-2 text-center">
                +{scopedSizes.length - 80} more — narrow with a VM Family or search.
              </div>
            )}
          </div>

          {demand.length === 0 ? (
            <div className="text-[10.5px] text-text-muted italic py-1">
              No demand yet — pick sizes from the list above, then set quantities here.
            </div>
          ) : (
            <div className="space-y-1.5">
              {demand.map((row, i) => (
                <div key={row.vmSizeName} className="flex items-center gap-2">
                  <span className="text-[11px] text-text-primary flex-1 min-w-0 truncate" title={row.vmSizeName}>
                    {row.vmSizeName}
                  </span>
                  <NumberInput
                    value={row.quantity}
                    onChange={(n) => setDemand((d) => d.map((r, j) => (j === i ? { ...r, quantity: Math.max(0, n) } : r)))}
                    min={0}
                    className="glass-input text-[11px] font-mono"
                    style={{ height: 28, width: 80, padding: '0 8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setDemand((d) => d.filter((_, j) => j !== i))}
                    className="text-text-muted hover:text-red-300 transition-colors flex-shrink-0"
                    title={`Remove ${row.vmSizeName}`}
                    aria-label={`Remove ${row.vmSizeName}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <Field label="Deployment">
            <div className="flex items-center gap-1.5">
              {(['zonal', 'regional'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeployment(d)}
                  className="text-[10px] transition-colors"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: `1px solid ${deployment === d ? 'var(--border-glow)' : 'var(--border)'}`,
                    background: deployment === d ? 'rgba(129, 140, 248, 0.14)' : 'transparent',
                    color: deployment === d ? 'var(--interactive)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  aria-pressed={deployment === d}
                  title={
                    d === 'zonal'
                      ? 'HA pattern (the usual case): demand balances evenly across every zone that has a cluster.'
                      : 'Zone-agnostic: the engine places wherever capacity is best.'
                  }
                >
                  {d === 'zonal' ? '◈ Zonal · balanced' : 'Regional'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      {/* ── 4 · Build & run ─────────────────────────────────────────────── */}
      <div
        className="glass p-3 space-y-2"
        style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}
      >
        <div className="text-[10.5px] text-text-secondary leading-relaxed">
          {intentValid && hardware && preview ? (
            <>
              → <strong>{zones.length} cluster{zones.length === 1 ? '' : 's'}</strong> ({zones.join(' + ')}) ×{' '}
              {racksPerZone} rack{racksPerZone === 1 ? '' : 's'} of <strong>{hardware.name}</strong> in{' '}
              {effectiveRegion} · <strong>{totalVms.toLocaleString()} VMs</strong>{' '}
              {deployment === 'zonal' ? 'balanced across the zones' : 'placed regionally'} ·{' '}
              {preview.autoRoutedCells > 0
                ? `${preview.autoRoutedCells} fungibility rule${preview.autoRoutedCells === 1 ? '' : 's'} authored automatically`
                : 'routing already authored'}
              .
              {preview.unfittableSizes.length > 0 && (
                <span className="block mt-1" style={{ color: 'var(--status-warn)' }}>
                  ⚠ {preview.unfittableSizes.join(', ')} won't fit this server — pick a bigger
                  profile or remove them.
                </span>
              )}
            </>
          ) : (
            'Pick a server, a region with at least one zone, and at least one VM size.'
          )}
        </div>
        <button
          onClick={buildAndRun}
          disabled={!intentValid || building}
          className="btn-primary w-full text-[12px]"
          style={{ padding: '9px 0', opacity: intentValid ? 1 : 0.5, cursor: intentValid ? 'pointer' : 'not-allowed' }}
        >
          {building ? 'Building…' : '⚡ Build & run simulation'}
        </button>
      </div>
    </div>
  );
}

function Card({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  /** What this choice MEANS, in a sentence — not what the field is called.
   *  A first-time reader does not know what a rack or a zone is for. */
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass p-3 space-y-2.5" style={{ borderRadius: 'var(--radius-md)' }}>
      <div className="flex items-center gap-2">
        <span
          className="inline-grid place-items-center font-mono font-bold"
          style={{
            width: 18,
            height: 18,
            fontSize: 10,
            borderRadius: '50%',
            background: 'rgba(129, 140, 248, 0.14)',
            color: 'var(--interactive)',
            border: '1px solid rgba(129, 140, 248, 0.35)',
          }}
        >
          {step}
        </span>
        <span className="text-[12px] font-semibold text-text-primary">{title}</span>
      </div>
      {subtitle && (
        <div className="text-[11px] text-text-muted leading-snug" style={{ marginTop: -2 }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.04em] text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function FilterRow({ label, count, children }: { label: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 5 }}>
      <span className="text-[9px] tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {count !== undefined && <span className="text-text-muted normal-case tracking-normal ml-1.5">· {count}</span>}
      </span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function QSChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-mono transition-all"
      style={{
        padding: '3px 10px',
        background: active ? 'rgba(129, 140, 248, 0.14)' : 'rgba(255,255,255,0.03)',
        color: active ? 'var(--interactive)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function formatGiB(gib: number): string {
  if (gib >= 1024) {
    const tib = gib / 1024;
    return `${Number.isInteger(tib) ? tib : tib.toFixed(tib < 10 ? 2 : 1)} TiB`;
  }
  return `${Math.round(gib)} GiB`;
}

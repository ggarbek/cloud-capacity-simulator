/**
 * ScenarioAnalysis — the Results › Scenario analysis surface (v2.23).
 *
 * Build a small "BoM on top of the run": add one or more VM sizes (each with
 * an optional quantity), pick a scope (fleet / region / zone / cluster), and
 * see how many of each actually pack into the LEFTOVER capacity of the
 * current run — the sizes COMPETE for the same space, like a real BoM — plus
 * where they'd land and what blocks the rest. Additive: nothing is added to
 * the fleet; this is spare headroom on the result. The packing math lives in
 * the pure `computeMultiScenario` helper (utils/scenario.ts), which reuses
 * the same scope + fungibility rules as the rest of the app.
 */
import { useEffect, useMemo, useState } from 'react';
import type { AppState } from '../state/AppState';
import type { SimulatorResult, VmCategory } from '../types';
import { VM_CATEGORIES } from '../types';
import { RATE_LABEL, type RateType } from '../engine/insights';
import { formatUsd, formatPct } from '../utils/financial';
import { computeAnswers } from '../utils/answers';
import { regionScopedCatalog } from '../utils/runEngine';
import { providerOf, vmFamily, compareFamily, PROVIDER_ORDER } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';
import { buildFleetHierarchy } from './fleetmap/fleetmapData';
import {
  computeMultiScenario,
  listScopeOptions,
  type ScopeOption,
  type ScenarioBlock,
  type ScenarioLine,
} from '../utils/scenario';

interface SizeOption {
  vmSizeName: string;
  label: string;
  provider: string;
  family: string;
  category: VmCategory;
}

/** Provider sort rank (Azure → AWS → GCP → Custom → anything else). */
function providerRank(p: string): number {
  const i = (PROVIDER_ORDER as readonly string[]).indexOf(p);
  return i < 0 ? PROVIDER_ORDER.length : i;
}

const sev = (s: ScenarioBlock['severity']) =>
  s === 'structural'
    ? { fg: 'var(--status-bad)', bg: 'rgba(239,68,68,0.08)', bd: 'rgba(239,68,68,0.40)' }
    : s === 'user'
      ? { fg: 'var(--status-warn)', bg: 'rgba(251,191,36,0.08)', bd: 'rgba(251,191,36,0.40)' }
      : { fg: '#60A5FA', bg: 'rgba(96,165,250,0.08)', bd: 'rgba(96,165,250,0.40)' };

export function ScenarioAnalysis({
  state,
  result,
  rateType,
}: {
  state: AppState;
  result: SimulatorResult;
  rateType: RateType;
}) {
  // Region-scoped catalog → the picker only offers what the run prices.
  const sizes: SizeOption[] = useMemo(() => {
    const seen = new Set<string>();
    const out: SizeOption[] = [];
    for (const v of regionScopedCatalog(state)) {
      if (seen.has(v.vmSizeName)) continue;
      seen.add(v.vmSizeName);
      const provider = providerOf(v);
      const family = vmFamily(v);
      out.push({
        vmSizeName: v.vmSizeName,
        label: `${v.vmSizeName.replace('Standard_', '')} · ${v.vcpus} vCPU · ${v.memoryGib.toLocaleString()} GiB`,
        provider,
        family,
        category: categorize(provider, family),
      });
    }
    out.sort(
      (a, b) =>
        providerRank(a.provider) - providerRank(b.provider) ||
        compareFamily(a.family, b.family) ||
        a.vmSizeName.localeCompare(b.vmSizeName),
    );
    return out;
  }, [state]);

  const byName = useMemo(() => new Map(sizes.map((s) => [s.vmSizeName, s])), [sizes]);

  const providers = useMemo(() => {
    const present = [...new Set(sizes.map((s) => s.provider))];
    return present.sort((a, b) => providerRank(a) - providerRank(b) || a.localeCompare(b));
  }, [sizes]);

  const scopeOptions: ScopeOption[] = useMemo(
    () => listScopeOptions(buildFleetHierarchy(state, result)),
    [state, result],
  );

  // "Where" grouped into Fleet-wide + Regions / Zones / Clusters tiers.
  const scopeGroups = useMemo(
    () => ({
      fleet: scopeOptions.filter((o) => o.kind === 'fleet'),
      regions: scopeOptions.filter((o) => o.kind === 'region'),
      zones: scopeOptions.filter((o) => o.kind === 'zone'),
      clusters: scopeOptions.filter((o) => o.kind === 'cluster'),
    }),
    [scopeOptions],
  );

  // Seed the scenario with a deployed BoM size (natural "add more of what I
  // ran"), falling back to the first catalogued size.
  const defaultSize = useMemo(() => {
    const inCatalog = new Set(sizes.map((s) => s.vmSizeName));
    const fromBom = state.bom.find((b) => inCatalog.has(b.vmSizeName))?.vmSizeName;
    return fromBom ?? sizes[0]?.vmSizeName ?? '';
  }, [sizes, state.bom]);

  const [lines, setLines] = useState<ScenarioLine[]>(() =>
    defaultSize ? [{ vmSizeName: defaultSize, target: null }] : [],
  );
  const [scopeId, setScopeId] = useState<string>('fleet');

  // Picker state (the add-a-size cascade).
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [pickSize, setPickSize] = useState<string>('');
  const [qtyStr, setQtyStr] = useState('');

  const scopeOpt = scopeOptions.find((o) => o.id === scopeId) ?? scopeOptions[0];

  // Category options present given the cloud filter.
  const categories = useMemo(() => {
    const present = new Set(
      sizes.filter((s) => providerFilter === 'all' || s.provider === providerFilter).map((s) => s.category),
    );
    return VM_CATEGORIES.filter((c) => present.has(c));
  }, [sizes, providerFilter]);

  // Family options present given cloud + category.
  const families = useMemo(() => {
    const present = new Set(
      sizes
        .filter((s) => providerFilter === 'all' || s.provider === providerFilter)
        .filter((s) => categoryFilter === 'all' || s.category === categoryFilter)
        .map((s) => s.family),
    );
    return [...present].sort(compareFamily);
  }, [sizes, providerFilter, categoryFilter]);

  // Sizes matching the full cascade — Provider → Category → Family → search.
  const filteredSizes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sizes.filter((s) => {
      if (providerFilter !== 'all' && s.provider !== providerFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (familyFilter !== 'all' && s.family !== familyFilter) return false;
      if (!q) return true;
      return (
        s.vmSizeName.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q)
      );
    });
  }, [sizes, providerFilter, categoryFilter, familyFilter, query]);

  // Group the filtered sizes by "<provider> · <family>" for <optgroup> labels.
  const sizeGroups = useMemo(() => {
    const groups: { key: string; items: SizeOption[] }[] = [];
    const idx = new Map<string, number>();
    for (const s of filteredSizes.slice(0, 2000)) {
      const key = `${s.provider} · ${s.family}`;
      let i = idx.get(key);
      if (i === undefined) {
        i = groups.length;
        idx.set(key, i);
        groups.push({ key, items: [] });
      }
      groups[i].items.push(s);
    }
    return groups;
  }, [filteredSizes]);

  // Keep the picker's selection valid as filters narrow.
  const effectivePick =
    pickSize && filteredSizes.some((s) => s.vmSizeName === pickSize)
      ? pickSize
      : filteredSizes[0]?.vmSizeName ?? '';

  const addLine = () => {
    if (!effectivePick) return;
    const target = qtyStr.trim() === '' ? null : Math.max(0, Math.floor(Number(qtyStr) || 0));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.vmSizeName === effectivePick);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { vmSizeName: effectivePick, target };
        return next;
      }
      return [...prev, { vmSizeName: effectivePick, target }];
    });
    setQtyStr('');
  };
  const setLineTarget = (name: string, value: string) =>
    setLines((prev) =>
      prev.map((l) =>
        l.vmSizeName === name
          ? { ...l, target: value.trim() === '' ? null : Math.max(0, Math.floor(Number(value) || 0)) }
          : l,
      ),
    );
  const removeLine = (name: string) => setLines((prev) => prev.filter((l) => l.vmSizeName !== name));

  const scenario = useMemo(
    () =>
      lines.length > 0
        ? computeMultiScenario(state, result, lines, scopeOpt?.scope ?? null, rateType, scopeOpt?.label ?? 'the fleet')
        : null,
    [state, result, lines, scopeOpt, rateType],
  );

  // The "Where they'd land" breakdown is gated behind an explicit Run so the
  // user kicks the fitted sizes into the landing view. Any change to the
  // scenario inputs (sizes, scope, rate) makes the prior landing stale → reset.
  const [launched, setLaunched] = useState(false);
  const runSignature = useMemo(
    () => `${JSON.stringify(lines)}|${scopeId}|${rateType}`,
    [lines, scopeId, rateType],
  );
  useEffect(() => {
    setLaunched(false);
  }, [runSignature]);

  // Current fleet profitability — used to project how selling the scenario's
  // driven revenue (on already-bought hardware, so cost is unchanged) moves the
  // gross-profit margin.
  const fleetProfit = useMemo(
    () => computeAnswers(state, result, rateType).profitability,
    [state, result, rateType],
  );

  if (sizes.length === 0) {
    return (
      <Note text="No VMs in the catalog for the current region — open VM demand to add some, then re-run." />
    );
  }

  const resultByName = new Map((scenario?.lines ?? []).map((l) => [l.vmSizeName, l]));
  const maxClusterFit = Math.max(1, ...(scenario?.perCluster ?? []).map((c) => c.fits));
  const totalPlaced = scenario?.totalPlaced ?? 0;
  // >1 size competing → show the per-cluster size breakdown (which VMs land where).
  const multiSize = (scenario?.lines.length ?? 0) > 1;

  // Scope kind for the corner badge ("Fleet-wide" / "Region" / "Zone" / "Cluster").
  const SCOPE_KIND_LABEL: Record<string, string> = {
    fleet: 'Fleet-wide',
    region: 'Region',
    zone: 'Zone',
    cluster: 'Cluster',
  };
  const scopeKind = scopeOpt ? SCOPE_KIND_LABEL[scopeOpt.kind] ?? '' : '';

  // Projected gross margin if the driven revenue is sold — cost is unchanged
  // (the hardware is already bought), so margin only improves.
  const driven = scenario?.totalMonthlyRevenue ?? 0;
  const curMargin = fleetProfit.marginPct;
  const newRevenue = fleetProfit.monthlyRevenue + (driven ?? 0);
  const newMargin =
    fleetProfit.monthlyCogs != null && newRevenue > 0
      ? ((newRevenue - fleetProfit.monthlyCogs) / newRevenue) * 100
      : undefined;
  const showMargin = driven > 0 && curMargin != null && newMargin != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── Add a size + Where ───────────────────────────────────────── */}
      <section
        className="space-y-3"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(180px, 1fr)' }}>
          {/* The add-a-size cascade */}
          <Field label="Add VM sizes">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginBottom: 6 }}>
              <select
                className="glass-input"
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setCategoryFilter('all');
                  setFamilyFilter('all');
                }}
                style={{ padding: '6px 8px', fontSize: 12 }}
                aria-label="Filter by cloud"
              >
                <option value="all">All clouds</option>
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                className="glass-input"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setFamilyFilter('all');
                }}
                style={{ padding: '6px 8px', fontSize: 12 }}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="glass-input"
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                style={{ padding: '6px 8px', fontSize: 12 }}
                aria-label="Filter by family"
              >
                <option value="all">All families</option>
                {families.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <input
                className="glass-input"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 12, minWidth: 0 }}
                aria-label="Search VM sizes"
              />
            </div>
            <div className="flex gap-2" style={{ alignItems: 'stretch' }}>
              <select
                className="glass-input"
                value={effectivePick}
                onChange={(e) => setPickSize(e.target.value)}
                style={{ padding: '7px 10px', fontSize: 12, flex: 1, minWidth: 0 }}
                aria-label="VM size"
                disabled={filteredSizes.length === 0}
              >
                {filteredSizes.length === 0 && <option value="">No sizes match these filters</option>}
                {sizeGroups.map((g) => (
                  <optgroup key={g.key} label={g.key}>
                    {g.items.map((s) => (
                      <option key={s.vmSizeName} value={s.vmSizeName}>{s.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                className="glass-input"
                type="number"
                min={0}
                placeholder="Qty"
                value={qtyStr}
                onChange={(e) => setQtyStr(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addLine(); }}
                style={{ padding: '7px 10px', fontSize: 12, width: 74, flexShrink: 0 }}
                aria-label="Quantity (optional)"
                title="Optional — leave blank to fill with as many as fit"
              />
              <button
                type="button"
                className="btn-primary"
                onClick={addLine}
                disabled={!effectivePick}
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
              >
                + Add
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
              {filteredSizes.length === sizes.length
                ? `${sizes.length.toLocaleString()} sizes · qty optional (blank = as many as fit)`
                : `${filteredSizes.length.toLocaleString()} of ${sizes.length.toLocaleString()} sizes`}
            </div>
          </Field>
          {/* Scope — kept as-is: Fleet-wide, then Regions / Zones / Clusters */}
          <Field label="Where">
            <select
              className="glass-input w-full"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              style={{ padding: '7px 10px', fontSize: 12 }}
              aria-label="Scope"
            >
              {scopeGroups.fleet.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
              {scopeGroups.regions.length > 0 && (
                <optgroup label="Regions">
                  {scopeGroups.regions.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {scopeGroups.zones.length > 0 && (
                <optgroup label="Zones">
                  {scopeGroups.zones.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {scopeGroups.clusters.length > 0 && (
                <optgroup label="Clusters">
                  {scopeGroups.clusters.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>
        </div>
      </section>

      {/* ── The scenario BoM + live per-line results ─────────────────── */}
      <section
        style={{
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${totalPlaced > 0 ? 'var(--status-good)' : 'var(--border-glow)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
        }}
      >
        {/* Scope badge — names what "Where" the result is for, in the corner. */}
        {scopeKind && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              background: 'var(--tint-soft-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '2px 9px',
            }}
            title={`Scope: ${scopeOpt?.label}`}
          >
            {scopeKind}
          </span>
        )}
        {/* Headline */}
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, paddingRight: 84 }}>
          {lines.length === 0 ? (
            <>Add VM sizes above to model what else could pack onto {scopeOpt?.label}.</>
          ) : totalPlaced > 0 ? (
            <>
              You can fit <span style={{ color: 'var(--interactive)' }}>{totalPlaced.toLocaleString()}</span>
              {scenario?.totalRequested != null ? <> of {scenario.totalRequested.toLocaleString()} requested</> : ''}{' '}
              {totalPlaced === 1 ? 'VM' : 'VMs'} across {lines.length} {lines.length === 1 ? 'size' : 'sizes'} in {scopeOpt?.label}.
            </>
          ) : (
            <>No room for these sizes in {scopeOpt?.label}.</>
          )}
        </div>
        {/* Revenue driven (from what fits) + revenue blocked (the upside left
            on the table because the fleet can't hold the rest), at the chosen
            rate. */}
        {scenario && lines.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: 22, marginTop: 12 }}>
            <RevFigure
              label="Revenue driven"
              sub={`from ${totalPlaced.toLocaleString()} placed · ${RATE_LABEL[rateType]}`}
              value={scenario.totalMonthlyRevenue}
              tone="good"
            />
            {scenario.totalBlocked > 0 && (
              <RevFigure
                label="Revenue blocked"
                sub={`${scenario.totalBlocked.toLocaleString()} can't deploy`}
                value={scenario.totalBlockedRevenue}
                tone="bad"
              />
            )}
            {/* Margin lift — selling this headroom adds revenue at no extra
                hardware cost, so the fleet's gross margin improves. */}
            {showMargin && (
              <div>
                <div className="text-[10px] tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
                  Est. gross margin
                </div>
                <div style={{ fontSize: 19, fontWeight: 600, fontFamily: 'ui-monospace, monospace', lineHeight: 1.2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{formatPct(curMargin!)}</span>
                  <span style={{ color: 'var(--text-dim)', margin: '0 5px' }}>→</span>
                  <span style={{ color: newMargin! >= curMargin! ? 'var(--status-good)' : 'var(--status-bad)' }}>
                    {formatPct(newMargin!)}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>if you sell this headroom</div>
              </div>
            )}
          </div>
        )}

        {/* Per-line rows — each is an editable BoM line with its live result */}
        {lines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {lines.map((line) => {
              const r = resultByName.get(line.vmSizeName);
              const short = line.vmSizeName.replace('Standard_', '');
              const meta = byName.get(line.vmSizeName);
              const placed = r?.placed ?? 0;
              const blocked = r?.blocked ?? null;
              return (
                <div key={line.vmSizeName}>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      fontSize: 12.5,
                      padding: '7px 10px',
                      background: 'var(--tint-soft)',
                      border: '1px solid var(--border-dark)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text-primary)' }} className="truncate" title={line.vmSizeName}>
                        {short}
                      </div>
                      {meta && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }} className="truncate">
                          {meta.provider} · {meta.family}
                        </div>
                      )}
                    </div>
                    <input
                      className="glass-input"
                      type="number"
                      min={0}
                      placeholder="max"
                      value={line.target == null ? '' : String(line.target)}
                      onChange={(e) => setLineTarget(line.vmSizeName, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: 11.5, width: 64, flexShrink: 0 }}
                      aria-label={`Quantity for ${short}`}
                      title="Quantity — blank = as many as fit"
                    />
                    <div style={{ width: 110, textAlign: 'right', flexShrink: 0 }}>
                      <div>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: placed > 0 ? 'var(--status-good)' : 'var(--text-muted)' }}>
                          {placed.toLocaleString()}
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}> fit</span>
                        {blocked != null && blocked > 0 && (
                          <span style={{ color: 'var(--status-bad)', fontFamily: 'ui-monospace, monospace' }}> · {blocked.toLocaleString()} blk</span>
                        )}
                      </div>
                      {/* This size's ceiling on its own — shown when there's more
                          room than what was placed ("you chose N · could fit M"). */}
                      {r && r.maxFit > placed && (
                        <div
                          style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'ui-monospace, monospace' }}
                          title={`Up to ${r.maxFit.toLocaleString()} ${short} fit in this scope if it alone filled the leftover capacity`}
                        >
                          up to {r.maxFit.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ width: 92, textAlign: 'right', flexShrink: 0, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                      {/* Driven revenue = PLACED units only (never the blocked
                          rest), so the figure never exceeds what the fleet can
                          actually support. The blocked portion is shown beneath
                          in red and rolls up into "Revenue blocked" above. */}
                      <div style={{ color: 'var(--status-good)' }} title="Revenue from the units that fit (placed × rate)">
                        {r?.monthlyRevenue != null && r.monthlyRevenue > 0 ? `${formatUsd(r.monthlyRevenue)}/mo` : '—'}
                      </div>
                      {r?.blockedRevenue != null && r.blockedRevenue > 0 && (
                        <div style={{ color: 'var(--status-bad)', fontSize: 10 }} title="Revenue left on the table — these units can't be placed">
                          {formatUsd(r.blockedRevenue)} blkd
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.vmSizeName)}
                      style={{ flexShrink: 0, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1, padding: '0 2px', background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={`Remove ${short}`}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  {r?.block && (placed === 0 || (blocked != null && blocked > 0)) && (
                    <BlockNote block={r.block} compact />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Run — kicks the fitted sizes into the "Where they'd land" breakdown
            below. Shown whenever anything places (even into a single cluster —
            a small qty that all lands in one cluster still has a landing view).
            Hidden once launched (the landing shows instead); reappears when
            inputs change (the prior landing is then stale). */}
        {scenario && totalPlaced > 0 && !launched && (
          <button
            type="button"
            onClick={() => setLaunched(true)}
            className="transition-colors"
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--interactive)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 11 }}>▶</span> Run — see where they'd land
          </button>
        )}
      </section>

      {/* ── Combined per-cluster landing ─────────────────────────────── */}
      {launched && scenario && totalPlaced > 0 && (
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
          }}
        >
          <h3 className="section-h" style={{ marginBottom: 2 }}>
            Where they'd land
          </h3>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
            Bar shows how full each cluster would be after this scenario lands —
            <span style={{ color: 'var(--interactive)' }}> room</span> ·
            <span style={{ color: 'var(--status-warn)' }}> near full</span> ·
            <span style={{ color: 'var(--status-bad)' }}> full</span>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {scenario.perCluster.map((c) => (
              <div key={c.clusterId} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
                  <div style={{ width: 168, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-secondary)' }} className="truncate" title={`Cluster ${c.index} · ${c.hwLabel}`}>
                      Cluster {c.index} · {c.hwLabel}
                    </div>
                    {(c.region || c.zone) && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }} className="truncate">
                        {[c.region, c.zone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  {(() => {
                    // Bar = post-scenario fullness (how full the cluster would be),
                    // tone-coded. Falls back to a relative-count bar if fill is
                    // unavailable (single-size path).
                    const pct = c.fillPct;
                    const tone =
                      pct == null ? 'var(--interactive)'
                      : pct >= 95 ? 'var(--status-bad)'
                      : pct >= 85 ? 'var(--status-warn)'
                      : 'var(--interactive)';
                    const barW = pct != null ? pct : Math.round((c.fits / maxClusterFit) * 100);
                    return (
                      <>
                        <div
                          title={
                            pct != null
                              ? `${pct}% full after this scenario — ${c.bindingDim} binds on this cluster's deployable nodes`
                              : undefined
                          }
                          style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--tint-soft-2)', overflow: 'hidden' }}
                        >
                          <div style={{ width: `${barW}%`, height: '100%', background: tone, borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 66, textAlign: 'right', fontSize: 11, color: tone, fontVariantNumeric: 'tabular-nums' }}>
                          {pct != null ? `${pct}% full` : '—'}
                        </div>
                      </>
                    );
                  })()}
                  <div
                    title={`${(c.nodesConsumed ?? 0).toLocaleString()} deployable node${(c.nodesConsumed ?? 0) === 1 ? '' : 's'} this scenario lands on (${c.fits.toLocaleString()} VMs)`}
                    style={{ width: 96, textAlign: 'right', fontFamily: 'ui-monospace, monospace', color: 'var(--text-primary)', fontSize: 11 }}
                  >
                    {(c.nodesConsumed ?? 0).toLocaleString()}
                    <span style={{ color: 'var(--text-dim)' }}> node{(c.nodesConsumed ?? 0) === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ width: 86, textAlign: 'right', fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted)', fontSize: 11 }}>
                    {c.monthlyRevenue != null && c.monthlyRevenue > 0 ? `${formatUsd(c.monthlyRevenue)}/mo` : '—'}
                  </div>
                </div>
                {/* Which sizes land here — only meaningful when >1 size competes. */}
                {multiSize && c.bySize.length > 0 && (
                  <div
                    className="flex flex-wrap"
                    style={{ gap: '4px 8px', paddingLeft: 180, paddingRight: 198, marginTop: 1 }}
                  >
                    {c.bySize.map((s) => (
                      <span
                        key={s.vmSizeName}
                        style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}
                        title={`${s.count.toLocaleString()} × ${s.vmSizeName}`}
                      >
                        {s.vmSizeName.replace('Standard_', '')}{' '}
                        <span style={{ color: 'var(--interactive)' }}>×{s.count.toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        Additive scenario — nothing is added to your fleet and no deployed VM is moved. The sizes compete for the
        same leftover capacity, in the order listed, so each line shows what fits alongside the others. Down the
        line, live fleet data will feed this same view to judge whether a real deployment is feasible.
      </p>
    </div>
  );
}

function RevFigure({
  label,
  sub,
  value,
  tone,
}: {
  label: string;
  sub: string;
  value: number | null;
  tone: 'good' | 'bad';
}) {
  // null = the sizes behind this figure have no published rate in the catalog.
  const unpriced = value == null;
  const color = unpriced ? 'var(--text-muted)' : tone === 'good' ? 'var(--status-good)' : 'var(--status-bad)';
  return (
    <div>
      <div className="text-[10px] tracking-[0.04em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color, lineHeight: 1.2 }}>
        {unpriced ? '—' : `${formatUsd(value)}/mo`}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{unpriced ? 'no published rate' : sub}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span className="text-[10px] tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function BlockNote({ block, compact }: { block: ScenarioBlock; compact?: boolean }) {
  const c = sev(block.severity);
  return (
    <div
      style={{
        marginTop: compact ? 4 : 10,
        marginLeft: compact ? 10 : 0,
        padding: compact ? '5px 10px' : '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: c.bg,
        border: `1px solid ${c.bd}`,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 12, color: c.fg }}>⚠</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: c.fg }}>{block.label}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{block.detail}</div>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div
      className="text-[11.5px] italic"
      style={{
        color: 'var(--text-muted)',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {text}
    </div>
  );
}

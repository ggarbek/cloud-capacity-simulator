/**
 * BomQuickAdd (v2.20.2, distill) — the zero-setup way to put a VM on the
 * BoM. One line: search all ~40k catalog rows (no provider/category/region
 * picking first) → quantity → Regional / Zonal → Add.
 *
 * Smart defaults instead of prerequisites:
 *   - The pricing region auto-picks per provider (the same first-region
 *     semantic VM_REPLACE uses) and is shown, not asked. Changing it stays
 *     in Browse & bulk add below.
 *   - Zonal rows default to "all zones (balance)" — the v2.19.22 semantic:
 *     `zones` left undefined balances across every zone with a cluster.
 *     Pinning a single zone is one dropdown away.
 *   - Same SKU + same deployment intent merges quantities (the per-intent
 *     dedup rule); a different intent gets its own row.
 *
 * The deep path (filter cascade, staging grid, Excel round-trip) is
 * unchanged one section below.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { NumberInput } from './NumberInput';
import { ZONES, type UserVm } from '../types';

const INPUT: React.CSSProperties = { height: 32, padding: '0 10px' };

function sameIntent(
  a: { deploymentType?: 'regional' | 'zonal'; zones?: string[] },
  b: { deploymentType?: 'regional' | 'zonal'; zones?: string[] },
): boolean {
  const at = a.deploymentType ?? 'regional';
  const bt = b.deploymentType ?? 'regional';
  if (at !== bt) return false;
  const az = [...(a.zones ?? [])].sort().join('|');
  const bz = [...(b.zones ?? [])].sort().join('|');
  return az === bz;
}

export function BomQuickAdd() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<UserVm | null>(null);
  const [qty, setQty] = useState(50);
  const [deployment, setDeployment] = useState<'zonal' | 'regional'>('zonal');
  const [zone, setZone] = useState(''); // '' = all zones (balance)
  const [toast, setToast] = useState<string | null>(null);

  // Search the whole catalog, deduped by SKU name, prefix matches first.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || picked) return [];
    const seen = new Set<string>();
    const starts: UserVm[] = [];
    const contains: UserVm[] = [];
    for (const v of state.userVms) {
      if (seen.has(v.vmSizeName)) continue;
      const name = v.vmSizeName.toLowerCase();
      if (name.startsWith(q) || name.replace(/^standard_/, '').startsWith(q)) {
        seen.add(v.vmSizeName);
        starts.push(v);
      } else if (name.includes(q)) {
        seen.add(v.vmSizeName);
        contains.push(v);
      }
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }, [query, picked, state.userVms]);

  // The pricing region the engine will use for the picked VM's provider —
  // shown as a fact, not asked as a prerequisite.
  const provider = picked?.provider || undefined;
  const effectiveRegion = provider
    ? state.ui.activeRegion[provider] ??
      state.userVms.find((v) => (v.provider || '') === provider && v.region)?.region
    : undefined;

  const onBoM = picked
    ? state.bom
        .filter((b) => b.vmSizeName === picked.vmSizeName)
        .reduce((s, b) => s + b.quantity, 0)
    : 0;

  const canAdd = !!picked && qty >= 1;

  const add = () => {
    if (!picked || !canAdd) return;
    // Auto-pick the provider's pricing region when none is set (mirrors the
    // VM_REPLACE reducer's first-region semantic) so the engine + finance
    // rollups price deterministically.
    if (provider && !state.ui.activeRegion[provider] && effectiveRegion) {
      dispatch({
        type: 'UI_SET',
        ui: { activeRegion: { ...state.ui.activeRegion, [provider]: effectiveRegion } },
      });
    }
    const entry = {
      vmSizeName: picked.vmSizeName,
      quantity: Math.round(qty),
      deploymentType: deployment,
      ...(deployment === 'zonal' && zone ? { zones: [zone] } : {}),
    };
    const existingIdx = state.bom.findIndex(
      (b) => b.vmSizeName === entry.vmSizeName && sameIntent(b, entry),
    );
    if (existingIdx >= 0) {
      dispatch({
        type: 'BOM_UPDATE',
        index: existingIdx,
        entry: { quantity: state.bom[existingIdx].quantity + entry.quantity },
      });
    } else {
      dispatch({ type: 'BOM_ADD', entry });
    }
    setToast(
      `Added ${entry.quantity} × ${picked.vmSizeName.replace(/^Standard_/, '')} · ${
        deployment === 'regional' ? 'regional' : zone ? zone : 'balanced across zones'
      }.`,
    );
    window.setTimeout(() => setToast(null), 4000);
    setPicked(null);
    setQuery('');
  };

  return (
    <section className="space-y-2">
      <h3 className="section-h flex items-center gap-2">
        <span>Add VMs</span>
        <span className="text-[10px] font-mono normal-case tracking-normal text-text-muted ml-2">
          · search any size, set a quantity, done
        </span>
      </h3>

      <div className="glass p-3 space-y-2.5" style={{ borderRadius: 'var(--radius-md)' }}>
        {/* Search / picked SKU */}
        <div style={{ position: 'relative' }}>
          {picked ? (
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] flex-1 min-w-0 truncate"
                style={{ color: 'var(--text-primary)' }}
                title={picked.vmSizeName}
              >
                {picked.vmSizeName}
                <span className="text-[10px] text-text-muted ml-2">
                  {picked.vcpus} vCPU · {picked.memoryGib} GiB
                  {onBoM > 0 ? ` · ${onBoM} on BoM` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setQuery('');
                }}
                className="text-text-muted hover:text-text-primary transition-colors text-[11px] flex-shrink-0"
                title="Pick a different VM size"
              >
                change
              </button>
            </div>
          ) : (
            <input
              className="glass-input text-[11px] w-full"
              style={INPUT}
              placeholder={`Search ${state.userVms.length.toLocaleString()} VM sizes — type 2+ characters…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {matches.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 30,
                marginTop: 4,
                background: 'var(--bg-deep)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-elevated)',
                overflow: 'hidden',
              }}
            >
              {matches.map((v) => (
                <button
                  key={v.vmSizeName}
                  type="button"
                  onClick={() => setPicked(v)}
                  className="w-full text-left flex items-baseline gap-2 hover:bg-white/[0.05] transition-colors"
                  style={{ padding: '7px 10px' }}
                >
                  <span className="text-[11px]" style={{ color: 'var(--text-primary)' }}>
                    {v.vmSizeName}
                  </span>
                  <span className="text-[9.5px] text-text-muted ml-auto whitespace-nowrap">
                    {v.provider ?? ''} · {v.vcpus} vCPU · {v.memoryGib} GiB
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Qty · deployment · add */}
        <div className="flex items-center gap-2 flex-wrap">
          <NumberInput
            value={qty}
            onChange={(n) => setQty(Math.max(0, n))}
            min={0}
            className="glass-input text-[11px] font-mono"
            style={{ ...INPUT, width: 84 }}
          />
          <div className="flex items-center gap-1">
            {(['zonal', 'regional'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeployment(d)}
                className="text-[10px] transition-colors"
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  border: `1px solid ${deployment === d ? 'var(--border-glow)' : 'var(--border)'}`,
                  background: deployment === d ? 'rgba(129, 140, 248, 0.14)' : 'transparent',
                  color: deployment === d ? 'var(--interactive)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                aria-pressed={deployment === d}
                title={
                  d === 'zonal'
                    ? 'HA pattern (the usual case): balance across every zone that has a cluster, or pin one zone.'
                    : 'Zone-agnostic: the engine places wherever capacity is best.'
                }
              >
                {d === 'zonal' ? '◈ Zonal' : 'Regional'}
              </button>
            ))}
          </div>
          {deployment === 'zonal' && (
            <select
              className="glass-input text-[11px]"
              style={{ ...INPUT, width: 150 }}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              title="Balance spreads the quantity evenly across every zone with a cluster; pinning targets one zone."
            >
              <option value="">all zones · balance</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  pin {z}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="btn-primary text-[11px] ml-auto"
            style={{
              padding: '6px 16px',
              opacity: canAdd ? 1 : 0.5,
              cursor: canAdd ? 'pointer' : 'not-allowed',
            }}
            title={canAdd ? 'Add to the Bill of Materials' : 'Pick a VM size first'}
          >
            + Add to BoM
          </button>
        </div>

        {/* Pricing-region fact + toast */}
        {picked && effectiveRegion && (
          <div className="text-[10px] text-text-dim">
            Priced in {effectiveRegion} ({provider}) — change the region in Browse &amp; bulk add below.
          </div>
        )}
        {toast && (
          <div className="text-[10.5px]" style={{ color: 'var(--status-good)' }}>
            ✓ {toast}
          </div>
        )}
      </div>
    </section>
  );
}

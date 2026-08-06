import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { fleetList } from '../state/AppState';
import { vmClass } from '../utils/vmTaxonomy';
import type { BindingConstraint, CatalogEntry, NodeDetail } from '../types';

export function NodeDetailPanel() {
  const { state, dispatch } = useApp();
  const r = state.result;
  if (!r) return null;
  const ids = state.selectedNodeIds;
  const nodes = r.nodeDetail.filter((n) => ids.includes(n.nodeId));
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-4 py-3 border-b border-border sticky top-0 z-10"
        style={{
          background: 'var(--bg-deep)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-[0.04em] text-text-muted">
              Node Detail
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {nodes.length === 1
                ? `R${nodes[0].rack} · Node ${nodes[0].posInRack}`
                : `${nodes.length} nodes selected`}
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'NODE_CLEAR' })}
            className="text-text-muted hover:text-text-primary text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ minHeight: 0 }}>
        {nodes.length > 1 && <Aggregate nodes={nodes} />}
        {nodes.map((node, i) => (
          <NodeCard key={node.nodeId} node={node} index={i} total={nodes.length} />
        ))}
      </div>
    </div>
  );
}

function Aggregate({ nodes }: { nodes: NodeDetail[] }) {
  const memUsed = nodes.reduce((s, n) => s + n.memoryUsedGib, 0);
  const memTotal = nodes.reduce((s, n) => s + n.memoryTotalGib, 0);
  const vcpuUsed = nodes.reduce((s, n) => s + n.vcpusUsed, 0);
  const vcpuTotal = nodes.reduce((s, n) => s + n.vcpusTotal, 0);
  const tpUsed = nodes.reduce((s, n) => s + n.throughputUsedMbps, 0);
  const tpTotalRaw = nodes.reduce(
    (s, n) => (n.throughputTotalMbps !== null ? s + n.throughputTotalMbps : s),
    0,
  );
  const tpConfigured = nodes.some((n) => n.throughputTotalMbps !== null);
  const stUsed = nodes.reduce((s, n) => s + n.storageThroughputUsedMbps, 0);
  const stTotalRaw = nodes.reduce(
    (s, n) => (n.storageThroughputTotalMbps !== null ? s + n.storageThroughputTotalMbps : s),
    0,
  );
  const stConfigured = nodes.some((n) => n.storageThroughputTotalMbps !== null);
  const vms = nodes.reduce((s, n) => s + n.vmsPlaced.length, 0);

  const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
  const vcpuPct = vcpuTotal > 0 ? (vcpuUsed / vcpuTotal) * 100 : 0;
  const tpPct = tpTotalRaw > 0 ? (tpUsed / tpTotalRaw) * 100 : 0;
  const stPct = stTotalRaw > 0 ? (stUsed / stTotalRaw) * 100 : 0;

  return (
    <div className="mt-3 space-y-3">
      {/* VMs count chip — kept as requested */}
      <div className="flex items-center gap-3 text-[11px] text-text-secondary">
        <span
          className="chip"
          style={{ color: 'var(--interactive)', background: 'rgba(22,163,74,0.10)' }}
        >
          {vms} VMs across {nodes.length} nodes
        </span>
      </div>

      <AggBar
        label="Memory"
        used={memUsed}
        total={memTotal}
        unit="GiB"
        pct={memPct}
      />
      <AggBar
        label="vCPU"
        used={vcpuUsed}
        total={vcpuTotal}
        unit=""
        pct={vcpuPct}
      />
      <AggBar
        label="Network"
        used={tpUsed}
        total={tpTotalRaw}
        unit="Mbps"
        pct={tpPct}
        disabled={!tpConfigured}
      />
      <AggBar
        label="Storage"
        used={stUsed}
        total={stTotalRaw}
        unit="MB/s"
        pct={stPct}
        disabled={!stConfigured}
      />
    </div>
  );
}

function AggBar({
  label,
  used,
  total,
  unit,
  pct,
  disabled,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
  pct: number;
  disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 18, opacity: disabled ? 0.4 : 1 }}>
      <div className="flex justify-between text-[10px] font-mono">
        <span className="tracking-[0.04em] text-text-muted">{label}</span>
        <span className="text-text-secondary">
          {disabled
            ? 'not configured'
            : `${Math.round(used).toLocaleString()} / ${total.toLocaleString()} ${unit} · ${pct.toFixed(1)}%`}
        </span>
      </div>
      <div
        className="relative mt-1.5"
        style={{
          height: 8,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'visible',
        }}
      >
        <div
          className="h-full absolute left-0 top-0"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: 'linear-gradient(90deg, var(--interactive), #6EE7B7)',
            boxShadow: '0 0 12px rgba(22, 163, 74, 0.40)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 200ms ease',
          }}
        />
        {!disabled && pct > 0 && (
          <span
            className="absolute top-1/2"
            style={{
              left: `calc(${Math.min(100, pct)}% - 6px)`,
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#86EFAC',
              border: '2px solid var(--bg-deep)',
              boxShadow: '0 0 10px rgba(22, 163, 74, 0.55)',
              transition: 'left 200ms ease',
            }}
          />
        )}
      </div>
    </div>
  );
}

interface FitsItem {
  name: string;
  vcpus: number;
  memoryGib: number;
  networkMbps: number;
  storageMbps: number;
  maxFit: number;
  /** v2.19.24 — Fungibility tier for this VM × this node's HW group.
   *  0 = Home, 1..5 = Spillover priority, null = no matrix authored
   *  (legacy fallback — every VM treated equal). */
  tier: number | null;
}

function NodeCard({ node, index, total }: { node: NodeDetail; index: number; total: number }) {
  const { state } = useApp();
  // v2.17 — "What else fits" must only recommend same-provider SKUs as the
  // user is simulating. The BOM filter (state.ui.bomProvider) is the primary
  // signal; when unset, infer from the providers of VMs already on this
  // node so an Azure cluster doesn't surface AWS suggestions.
  const catalog = useMemo(() => {
    const providerFromBom = state.ui.bomProvider;
    const region = providerFromBom ? state.ui.activeRegion[providerFromBom] : undefined;
    const providersOnNode = new Set<string>();
    const providerByVm = new Map<string, string>();
    for (const vm of state.userVms) {
      if (vm.provider) providerByVm.set(vm.vmSizeName, vm.provider);
    }
    for (const placed of node.vmsPlaced) {
      const p = providerByVm.get(placed.vmSizeName);
      if (p) providersOnNode.add(p);
    }
    return state.userVms.filter((vm) => {
      if (providerFromBom && vm.provider && vm.provider !== providerFromBom) return false;
      if (
        !providerFromBom &&
        providersOnNode.size > 0 &&
        vm.provider &&
        !providersOnNode.has(vm.provider)
      )
        return false;
      if (region && vm.region && vm.region !== region) return false;
      return true;
    });
  }, [state.userVms, state.ui.bomProvider, state.ui.activeRegion, node.vmsPlaced]);
  const [previewFit, setPreviewFit] = useState<FitsItem | null>(null);
  // Click a "What else fits" row to PIN its impact so it survives scrolling up
  // to read the bars; hover still previews live on top of a pin. Keyed because
  // a multi-region catalog can list the same SKU name twice.
  const [pinned, setPinned] = useState<{ key: string; item: FitsItem } | null>(null);
  // Hover wins for live exploration; the pin shows whenever nothing is hovered.
  const activeFit = previewFit ?? pinned?.item ?? null;
  // True when what's on the bars is the PINNED selection (not a transient hover
  // of a different row) — drives the "pinned" vs "previewing" header label.
  const showingPin = !!pinned && (!previewFit || previewFit.name === pinned.item.name);

  const memCat = useMemoryCategoryFromVms(catalog, node.vmsPlaced.map((v) => v.vmSizeName));
  // v2.19.24 — Resolve this node's hardware group + the active fungibility
  // matrix so "What else fits" honors routing rules just like the engine.
  const hwGroupId = useMemo(() => {
    if (!node.clusterId) return undefined;
    const fleet = fleetList(state).find((f) => f.id === node.clusterId)?.fleet;
    return fleet?.hardwareGroupId;
  }, [state.fleets, state.userHardware, node.clusterId]);
  const matrix = state.userFungibility;
  const whatFits = useMemo(
    () => computeWhatFits(catalog, node, memCat, hwGroupId, matrix),
    [catalog, node, memCat, hwGroupId, matrix],
  );

  // Resource totals — base vs preview (adding 1 of the previewed VM)
  const baseMem = node.memoryUsedGib;
  const baseVcpu = node.vcpusUsed;
  const baseTp = node.throughputUsedMbps;
  const previewMem = activeFit ? baseMem + activeFit.memoryGib : baseMem;
  const previewVcpu = activeFit ? baseVcpu + activeFit.vcpus : baseVcpu;
  // v2.19.24 — Network bar now previews the hovered VM's Mbps impact.
  // FitsItem carries networkMbps from the catalog; baseTp is the node's
  // current usage.
  const previewTp = activeFit ? baseTp + activeFit.networkMbps : baseTp;

  const memPct = node.memoryTotalGib > 0 ? (baseMem / node.memoryTotalGib) * 100 : 0;
  const vcpuPct = node.vcpusTotal > 0 ? (baseVcpu / node.vcpusTotal) * 100 : 0;
  const tpTotal = node.throughputTotalMbps;
  const tpPct = tpTotal !== null && tpTotal > 0 ? (baseTp / tpTotal) * 100 : null;

  const memPreviewPct =
    node.memoryTotalGib > 0 ? (previewMem / node.memoryTotalGib) * 100 : 0;
  const vcpuPreviewPct =
    node.vcpusTotal > 0 ? (previewVcpu / node.vcpusTotal) * 100 : 0;
  const tpPreviewPct =
    tpTotal !== null && tpTotal > 0 ? (previewTp / tpTotal) * 100 : null;

  // v2.24.4 — Storage throughput is the 4th packing constraint (remote Premium
  // SSD MB/s) and CAN be the binding constraint, but the panel never drew a bar
  // for it — so a "Bottleneck: STORAGE" chip had no on-screen backing. Render it
  // alongside the others (hover-preview from the fit's storageMbps).
  const stTotal = node.storageThroughputTotalMbps;
  const baseSt = node.storageThroughputUsedMbps;
  const stPct = stTotal !== null && stTotal > 0 ? (baseSt / stTotal) * 100 : null;
  const previewSt = activeFit ? baseSt + activeFit.storageMbps : baseSt;
  const stPreviewPct =
    stTotal !== null && stTotal > 0 ? (previewSt / stTotal) * 100 : null;

  return (
    // Click anywhere outside a "What else fits" row clears the pin — so a pinned
    // selection stays put while you scroll up to read the bars, and a deliberate
    // click elsewhere releases it. The rows stopPropagation to avoid self-clear.
    <div className="space-y-5" onClick={() => pinned && setPinned(null)}>
      {total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold text-text-primary">
            R{node.rack} · Node {node.posInRack}
          </div>
          <div className="text-[10px] text-text-muted font-mono">
            {index + 1} / {total}
          </div>
        </div>
      )}

      <BottleneckCard binding={node.bindingConstraint} />

      <section>
        <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-3">
          Resources {activeFit && <span className="text-interactive normal-case tracking-normal ml-1">· {showingPin ? 'pinned' : 'previewing'} +{activeFit.name.replace('Standard_', '')}{pinned && <span className="text-text-muted ml-1">(click elsewhere to clear)</span>}</span>}
        </h3>
        <Bar
          label="Memory"
          basePct={memPct}
          previewPct={memPreviewPct}
          baseUsed={baseMem}
          previewUsed={previewMem}
          total={node.memoryTotalGib}
          unit="GiB"
          binding={node.bindingConstraint === 'MEMORY'}
          preview={!!activeFit}
        />
        <Bar
          label="vCPU"
          basePct={vcpuPct}
          previewPct={vcpuPreviewPct}
          baseUsed={baseVcpu}
          previewUsed={previewVcpu}
          total={node.vcpusTotal}
          unit=""
          binding={node.bindingConstraint === 'VCPU'}
          preview={!!activeFit}
        />
        <Bar
          label="Network"
          basePct={tpPct ?? 0}
          previewPct={tpPreviewPct ?? 0}
          baseUsed={baseTp}
          previewUsed={previewTp}
          total={tpTotal ?? 0}
          unit="Mbps"
          binding={node.bindingConstraint === 'NETWORK'}
          preview={!!activeFit}
          disabled={tpTotal === null}
        />
        <Bar
          label="Storage"
          basePct={stPct ?? 0}
          previewPct={stPreviewPct ?? 0}
          baseUsed={baseSt}
          previewUsed={previewSt}
          total={stTotal ?? 0}
          unit="MB/s"
          binding={node.bindingConstraint === 'STORAGE'}
          preview={!!activeFit}
          disabled={stTotal === null}
        />
      </section>

      <section>
        <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-2">
          Placed VMs · {node.vmsPlaced.length}
        </h3>
        {node.vmsPlaced.length === 0 ? (
          <div className="text-[11px] text-text-muted italic">Empty</div>
        ) : (
          <div className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {groupVms(node.vmsPlaced).map((v) => (
                  <tr key={v.name} className="border-b border-border/40 last:border-b-0">
                    <td className="py-1.5 px-2 text-text-primary truncate" title={v.name}>
                      {v.name.replace('Standard_', '')}
                    </td>
                    <td className="py-1.5 px-2 text-right text-text-secondary">×{v.count}</td>
                    <td className="py-1.5 px-2 text-right text-text-muted">
                      {v.vcpus * v.count} vCPU
                    </td>
                    <td className="py-1.5 px-2 text-right text-text-muted">
                      {(v.memoryGib * v.count).toLocaleString()} GiB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-2">
          What Else Fits · {whatFits.length}
        </h3>
        {/* v2.19.39 — Row is now a 2-line layout:
              line 1: full uncut SKU name + Home/Spill chip
              line 2: vCPU · GiB · "up to N×" — small text, right-aligned
            Truncating SKU names was unacceptable — a row that says
            "M96…" is useless for a user trying to compare candidates. */}
        {whatFits.length === 0 ? (
          <div className="text-[11px] text-text-muted italic">
            Node saturated — nothing fits.
          </div>
        ) : (
          <ul className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
            {/* Key carries the index too — multi-region catalogs can list the
                same SKU twice in the fit list (one row per region). */}
            {whatFits.slice(0, 8).map((w, wi) => {
              const key = `${w.name}-${wi}`;
              const isPinned = pinned?.key === key;
              return (
              <li
                key={key}
                onMouseEnter={() => setPreviewFit(w)}
                onMouseLeave={() => setPreviewFit((c) => (c?.name === w.name ? null : c))}
                onClick={(e) => {
                  // Pin this row's impact so it survives scrolling up to the
                  // bars. stopPropagation keeps the card-level clear from
                  // firing on the same click. Click the pinned row again to clear.
                  e.stopPropagation();
                  setPinned((c) => (c?.key === key ? null : { key, item: w }));
                }}
                aria-pressed={isPinned}
                className={`px-2 py-1.5 border-b border-border/40 last:border-b-0 cursor-pointer transition-colors ${
                  isPinned ? 'bg-interactive/[0.14]' : 'hover:bg-white/[0.06]'
                }`}
                style={{
                  borderLeft: `2px solid ${isPinned ? 'var(--interactive)' : 'transparent'}`,
                }}
                title={`${w.name}${
                  w.tier === null
                    ? ''
                    : w.tier === 0
                      ? ' · Home (this is the routing target for this VM size)'
                      : ` · Spill-${w.tier} (this VM routes here only when its Home is full)`
                } — click to ${isPinned ? 'unpin' : 'pin the resource impact'}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-[11px] font-mono text-text-primary flex-1 min-w-0"
                    style={{ wordBreak: 'break-word', lineHeight: 1.3 }}
                  >
                    {w.name.replace('Standard_', '')}
                  </span>
                  {/* Pinned marker — so a click registers even while the cursor
                      still hovers the row (hover otherwise masks the pin). */}
                  {isPinned && (
                    <span
                      className="text-[8px] font-semibold px-1.5 py-0.5 flex-shrink-0 text-interactive"
                      style={{
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(129, 140, 248, 0.15)',
                        border: '1px solid var(--border-glow)',
                        letterSpacing: '0.06em',
                        lineHeight: 1,
                      }}
                    >
                      PINNED
                    </span>
                  )}
                  {/* v2.19.24 — Tier chip. Home = green; Spill-N = amber. */}
                  {w.tier !== null && (
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 flex-shrink-0"
                      style={{
                        borderRadius: 'var(--radius-pill)',
                        background:
                          w.tier === 0 ? 'rgba(129, 140, 248, 0.15)' : 'rgba(251, 191, 36, 0.10)',
                        color: w.tier === 0 ? 'var(--interactive)' : '#FCD34D',
                        border: `1px solid ${
                          w.tier === 0 ? 'var(--border-glow)' : 'rgba(251, 191, 36, 0.35)'
                        }`,
                        lineHeight: 1,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {w.tier === 0 ? 'HOME' : `SPILL-${w.tier}`}
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-3 text-[10px] font-mono text-text-muted mt-0.5"
                  style={{ paddingLeft: 1 }}
                >
                  <span>{w.vcpus} vCPU</span>
                  <span>·</span>
                  <span>{w.memoryGib.toLocaleString()} GiB</span>
                  <span className="ml-auto text-interactive">up to {w.maxFit}×</span>
                </div>
              </li>
              );
            })}
          </ul>
        )}
        {whatFits.length > 0 && (
          <div className="text-[9px] text-text-muted mt-1.5">
            Hover to preview · <span className="text-interactive">click to pin</span> the impact (stays while you scroll; click elsewhere to clear).
          </div>
        )}
      </section>

      {total > 1 && index < total - 1 && (
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--border-light), transparent)',
          }}
        />
      )}
    </div>
  );
}

function BottleneckCard({ binding }: { binding: BindingConstraint }) {
  if (binding === 'NONE') {
    return (
      <div
        className="px-3 py-2 text-[11px]"
        style={{
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          color: 'var(--node-deployable)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <span className="text-[9px] tracking-[0.04em] text-text-muted">Bottleneck</span>
        <div className="font-semibold mt-0.5">None · headroom in all dimensions</div>
      </div>
    );
  }
  return (
    <div
      className="px-3 py-2 text-[12px]"
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: '#FCA5A5',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 0 16px rgba(239, 68, 68, 0.12)',
      }}
    >
      <span className="text-[9px] tracking-[0.04em] text-text-muted">Bottleneck</span>
      <div className="font-semibold mt-0.5">{binding}</div>
    </div>
  );
}

function Bar({
  label,
  basePct,
  previewPct,
  baseUsed,
  previewUsed,
  total,
  unit,
  binding,
  preview,
  disabled,
}: {
  label: string;
  basePct: number;
  previewPct: number;
  baseUsed: number;
  previewUsed: number;
  total: number;
  unit: string;
  binding: boolean;
  preview: boolean;
  disabled?: boolean;
}) {
  const baseColorFrom = binding ? '#EF4444' : '#22C55E';
  const baseColorTo = binding ? '#F87171' : '#34D399';
  const ghostColor = binding ? '#F87171' : '#86EFAC';
  const dotColor = binding ? '#FCA5A5' : '#86EFAC';
  const overflow = previewPct > 100;

  return (
    <div className={disabled ? 'opacity-40' : ''} style={{ marginBottom: 28 }}>
      <div className="flex justify-between text-[10px] font-mono">
        <span
          className="tracking-[0.04em]"
          style={{ color: binding ? 'var(--node-full)' : 'var(--text-muted)' }}
        >
          {label}
          {binding && ' ●'}
        </span>
        <span className="text-text-secondary">
          {disabled ? (
            'not configured'
          ) : preview ? (
            <>
              <span className="text-text-muted">{baseUsed.toLocaleString()}</span>
              {' → '}
              <span className={overflow ? 'text-rose-300' : 'text-interactive'}>
                {previewUsed.toLocaleString()}
              </span>
              {' / '}
              {total.toLocaleString()} {unit} · {previewPct.toFixed(1)}%
            </>
          ) : (
            `${baseUsed.toLocaleString()} / ${total.toLocaleString()} ${unit} · ${basePct.toFixed(1)}%`
          )}
        </span>
      </div>
      <div
        className="relative h-2.5 mt-1.5"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'visible',
        }}
      >
        {/* Base fill (currently used) */}
        <div
          className="h-full absolute left-0 top-0"
          style={{
            width: `${Math.min(100, basePct)}%`,
            background: `linear-gradient(90deg, ${baseColorFrom}, ${baseColorTo})`,
            boxShadow: binding
              ? '0 0 12px rgba(239, 68, 68, 0.45)'
              : '0 0 12px rgba(34, 197, 94, 0.4)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 160ms ease',
          }}
        />
        {/* Preview ghost segment from baseline up to preview total */}
        {preview && previewPct > basePct && !disabled && (
          <div
            className="h-full absolute top-0"
            style={{
              left: `${Math.min(100, basePct)}%`,
              width: `${Math.min(100, previewPct) - Math.min(100, basePct)}%`,
              background: `repeating-linear-gradient(45deg, ${ghostColor}55, ${ghostColor}55 4px, transparent 4px, transparent 7px)`,
              borderRadius: 'var(--radius-pill)',
              transition: 'left 160ms ease, width 160ms ease',
            }}
          />
        )}
        {/* End-of-fill dot — moves to preview position if previewing */}
        {!disabled && (preview ? previewPct : basePct) > 0 && (
          <span
            className="absolute top-1/2"
            style={{
              left: `calc(${Math.min(100, preview ? previewPct : basePct)}% - 6px)`,
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: overflow ? '#EF4444' : dotColor,
              border: '2px solid #0A0A0A',
              boxShadow: binding || overflow
                ? '0 0 10px rgba(239, 68, 68, 0.75)'
                : '0 0 10px rgba(34, 197, 94, 0.6)',
              transition: 'left 160ms ease',
            }}
          />
        )}
      </div>
    </div>
  );
}

function groupVms(vms: NodeDetail['vmsPlaced']) {
  const map = new Map<
    string,
    { name: string; count: number; vcpus: number; memoryGib: number }
  >();
  for (const v of vms) {
    if (!map.has(v.vmSizeName)) {
      map.set(v.vmSizeName, {
        name: v.vmSizeName,
        count: 0,
        vcpus: v.vcpus,
        memoryGib: v.memoryGib,
      });
    }
    map.get(v.vmSizeName)!.count++;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.memoryGib * b.count - a.memoryGib * a.count,
  );
}

function useMemoryCategoryFromVms(catalog: CatalogEntry[], vmNames: string[]): string | null {
  if (vmNames.length === 0) return null;
  const first = catalog.find((c) => c.vmSizeName === vmNames[0]);
  return first?.memoryCategory ?? null;
}

/**
 * v2.19.24 — Honors fungibility (size-key + class fallback), network, and
 * storage. VMs that aren't routed to this node's HW group by the matrix
 * are excluded. Each surviving row carries its routing tier (Home=0,
 * Spill-1..5, or null when no matrix is authored), so the user can
 * distinguish "this is meant to live here" from "this would land here
 * only when its real Home is full."
 *
 * Sort: by tier ascending (Home → Spill-1 → ...), then by memory desc so
 * the biggest VM at each tier floats to the top.
 */
function computeWhatFits(
  catalog: CatalogEntry[],
  node: NodeDetail,
  memCat: string | null,
  hwGroupId: string | undefined,
  matrix: Record<string, Record<string, number | 'blocked'>>,
): FitsItem[] {
  const memRem = node.memoryTotalGib - node.memoryUsedGib;
  const vcpuRem = node.vcpusTotal - node.vcpusUsed;
  if (memRem <= 0 || vcpuRem <= 0) return [];
  const netTotal = node.throughputTotalMbps;
  const netRem =
    typeof netTotal === 'number' && Number.isFinite(netTotal)
      ? netTotal - node.throughputUsedMbps
      : Infinity;
  const storTotal = node.storageThroughputTotalMbps;
  const storRem =
    typeof storTotal === 'number' && Number.isFinite(storTotal)
      ? storTotal - node.storageThroughputUsedMbps
      : Infinity;

  const matrixActive = Object.keys(matrix).length > 0;

  const rows: FitsItem[] = [];
  for (const c of catalog) {
    if (memCat && c.memoryCategory !== memCat) continue;
    // Fungibility: size-key first, then class as legacy fallback. Mirrors
    // engine resolution. Empty matrix → no enforcement; absent cell when
    // matrix is authored → excluded; 'blocked' → excluded.
    let tier: number | null = null;
    if (matrixActive) {
      if (!hwGroupId) continue;
      const sizeCell = matrix[c.vmSizeName]?.[hwGroupId];
      const classCell = sizeCell === undefined ? matrix[vmClass(c)]?.[hwGroupId] : sizeCell;
      if (classCell === undefined || classCell === 'blocked') continue;
      tier = classCell as number;
    }
    if (c.memoryGib > memRem || c.vcpus > vcpuRem) continue;
    const vmNet = c.networkMbps ?? 0;
    if (vmNet > 0 && vmNet > netRem) continue;
    const vmStor = c.remoteStorageMbpsPremium ?? 0;
    if (vmStor > 0 && vmStor > storRem) continue;
    let maxFit = Math.min(Math.floor(memRem / c.memoryGib), Math.floor(vcpuRem / c.vcpus));
    if (vmNet > 0 && netRem !== Infinity) {
      maxFit = Math.min(maxFit, Math.floor(netRem / vmNet));
    }
    if (vmStor > 0 && storRem !== Infinity) {
      maxFit = Math.min(maxFit, Math.floor(storRem / vmStor));
    }
    if (maxFit <= 0) continue;
    rows.push({
      name: c.vmSizeName,
      vcpus: c.vcpus,
      memoryGib: c.memoryGib,
      networkMbps: vmNet,
      storageMbps: vmStor,
      maxFit,
      tier,
    });
  }
  rows.sort((a, b) => {
    const at = a.tier ?? 99;
    const bt = b.tier ?? 99;
    if (at !== bt) return at - bt;
    return b.memoryGib - a.memoryGib;
  });
  return rows;
}

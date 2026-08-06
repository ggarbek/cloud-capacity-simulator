import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import type { CatalogEntry, NodeDetail, SimulatorResult } from '../types';
import type { StatId } from '../state/AppState';
import { ProgressBar } from './ProgressBar';
import { REASONS, reasonAccent } from '../utils/blockingReason';

export function StatDetailPanel() {
  const { state, dispatch } = useApp();
  const [previewFit, setPreviewFit] = useState<FitsRow | null>(null);
  const r = state.result;
  const stat = state.selectedStat;
  if (!r || !stat) return null;

  const meta = describe(state.userVms, stat, r, previewFit);

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
              Stat
            </div>
            <div className="text-sm font-semibold text-text-primary">{meta.title}</div>
          </div>
          <button
            onClick={() => dispatch({ type: 'STAT_SELECT', stat: null })}
            className="text-text-muted hover:text-text-primary text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ minHeight: 0 }}>
        <KeyValues items={meta.kv} />
        {meta.bars && meta.bars.length > 0 && (
          <section>
            <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-3">
              Resources
              {previewFit && (
                <span className="text-interactive normal-case tracking-normal ml-1">
                  · previewing +{previewFit.name.replace('Standard_', '')}
                </span>
              )}
            </h3>
            <div>
              {meta.bars.map((b, i) => {
                const pct = b.total > 0 ? (b.used / b.total) * 100 : 0;
                const preview =
                  b.previewUsed !== undefined && b.total > 0
                    ? { used: b.previewUsed, pct: (b.previewUsed / b.total) * 100 }
                    : undefined;
                return (
                  <ProgressBar
                    key={i}
                    label={b.label}
                    used={b.used}
                    total={b.total}
                    unit={b.unit}
                    pct={pct}
                    binding={b.binding}
                    disabled={b.disabled}
                    preview={preview}
                    className={i === meta.bars!.length - 1 ? 'mb-1' : 'mb-7'}
                  />
                );
              })}
            </div>
          </section>
        )}
        {meta.fits && (
          <FitsSection
            title={meta.fitsTitle ?? 'Hypothetical fits'}
            fits={meta.fits}
            onHover={meta.supportsPreview ? setPreviewFit : undefined}
          />
        )}
        {meta.unplaceables && <UnplaceablesSection list={meta.unplaceables} />}
        {meta.vmBreakdown && <VmBreakdownSection list={meta.vmBreakdown} />}
        {meta.note && (
          <div className="text-[11px] text-text-muted italic leading-snug">{meta.note}</div>
        )}
      </div>
    </div>
  );
}

interface FitsRow {
  name: string;
  vcpus: number;
  memoryGib: number;
  totalFit: number;
}

interface KvRow {
  label: string;
  value: string;
  emphasize?: boolean;
}

interface BarSpec {
  label: string;
  used: number;
  total: number;
  unit: string;
  /** If true, the bar is rendered in red — used for "stranded" framing. */
  binding?: boolean;
  disabled?: boolean;
  /** Optional preview-state "what-if" used value. Driven by hover on fits row. */
  previewUsed?: number;
}

interface Meta {
  title: string;
  kv: KvRow[];
  bars?: BarSpec[];
  fits?: FitsRow[];
  fitsTitle?: string;
  /** When true, the FitsSection wires hover handlers so the bars animate to the preview state. */
  supportsPreview?: boolean;
  unplaceables?: SimulatorResult['vmsUnplaceable'];
  vmBreakdown?: { name: string; count: number; vcpus: number; memoryGib: number }[];
  note?: string;
}

function describe(catalog: CatalogEntry[], stat: StatId, r: SimulatorResult, previewFit: FitsRow | null): Meta {
  const occupied = r.nodeDetail.filter((n) => n.vmsPlaced.length > 0);
  const empty = r.nodeDetail.filter((n) => n.state === 'deployable');

  switch (stat) {
    case 'nodesUsed': {
      const memUsed = occupied.reduce((s, n) => s + n.memoryUsedGib, 0);
      const memTotal = occupied.reduce((s, n) => s + n.memoryTotalGib, 0);
      const vcpuUsed = occupied.reduce((s, n) => s + n.vcpusUsed, 0);
      const vcpuTotal = occupied.reduce((s, n) => s + n.vcpusTotal, 0);
      const tpUsed = occupied.reduce((s, n) => s + n.throughputUsedMbps, 0);
      const tpTotal = occupied.reduce(
        (s, n) => (n.throughputTotalMbps !== null ? s + n.throughputTotalMbps : s),
        0,
      );
      const tpConfigured = occupied.some((n) => n.throughputTotalMbps !== null);
      return {
        title: 'Nodes Used',
        kv: [
          { label: 'Nodes consumed', value: `${r.nodesConsumed} / ${r.totalNodes}`, emphasize: true },
          { label: 'VMs placed', value: String(r.vmsPlaced) },
          { label: 'Mem Avail on Occupied Nodes', value: `${formatNum(r.strandedMemoryGib)} GiB` },
          { label: 'vCPU Avail on Occupied Nodes', value: formatNum(r.strandedVcpus) },
        ],
        bars: [
          { label: 'Memory consumed', used: memUsed, total: memTotal, unit: 'GiB' },
          { label: 'vCPU consumed', used: vcpuUsed, total: vcpuTotal, unit: '' },
          {
            label: 'Network consumed',
            used: tpUsed,
            total: tpTotal,
            unit: 'Mbps',
            disabled: !tpConfigured,
          },
        ],
        vmBreakdown: buildVmBreakdown(occupied),
        note: 'Rack map highlights every node that has at least one VM placed.',
      };
    }
    case 'emptyNodes': {
      // Bars show available headroom as a fraction of the WHOLE fleet — gives
      // a meaningful basis ("how much of the fleet is still deployable?")
      // instead of the nonsense "0 / empty-node-total · 0.0%" framing.
      const memEmpty = empty.reduce((s, n) => s + n.memoryTotalGib, 0);
      const vcpuEmpty = empty.reduce((s, n) => s + n.vcpusTotal, 0);
      const memFleet = r.nodeDetail.reduce((s, n) => s + n.memoryTotalGib, 0);
      const vcpuFleet = r.nodeDetail.reduce((s, n) => s + n.vcpusTotal, 0);
      const fits = hypotheticalFits(catalog, empty);
      // Hovering a backfill row previews adding ONE of that VM into the empty pool.
      // Available headroom shrinks by the VM's mem/vCPU.
      const previewMemAvail = previewFit
        ? Math.max(0, memEmpty - previewFit.memoryGib)
        : undefined;
      const previewVcpuAvail = previewFit
        ? Math.max(0, vcpuEmpty - previewFit.vcpus)
        : undefined;
      return {
        title: 'Empty Nodes for New Deployment',
        kv: [
          { label: 'Empty deployable nodes', value: String(empty.length), emphasize: true },
        ],
        bars: [
          {
            label: 'Memory available · vs fleet total',
            used: memEmpty,
            total: memFleet,
            unit: 'GiB',
            previewUsed: previewMemAvail,
          },
          {
            label: 'vCPU available · vs fleet total',
            used: vcpuEmpty,
            total: vcpuFleet,
            unit: '',
            previewUsed: previewVcpuAvail,
          },
        ],
        fits,
        fitsTitle: 'VMs that could fit across these empty nodes',
        supportsPreview: true,
        note: 'Hover a row to preview the impact on available headroom.',
      };
    }
    case 'vmsPlaced': {
      return {
        title: 'VMs Placed',
        kv: [
          { label: 'Total VMs placed', value: String(r.vmsPlaced), emphasize: true },
          { label: 'Across nodes', value: String(r.nodesConsumed) },
        ],
        vmBreakdown: buildVmBreakdown(occupied),
        note: 'Rack map highlights the nodes hosting these VMs.',
      };
    }
    case 'unplaceable': {
      const count = r.vmsUnplaceable.reduce((s, u) => s + u.count, 0);
      return {
        title: 'Unplaceable VMs',
        kv: [
          { label: 'Total unplaceable', value: String(count), emphasize: true },
          { label: 'Reasons', value: String(r.vmsUnplaceable.length) },
        ],
        unplaceables: r.vmsUnplaceable,
        note:
          r.vmsUnplaceable.length === 0
            ? 'Nothing blocked — every BOM VM was placed.'
            : 'These VMs could not be placed under the current fleet/buffer/packing settings.',
      };
    }
  }
}

// ────────────────────────────────────────────────────────────────────────
// Resolves which nodes a stat should highlight on the rack map.
// Used by RackMap to apply the "dim non-matching" visual.
// ────────────────────────────────────────────────────────────────────────
export function highlightedNodeIds(
  stat: StatId,
  result: SimulatorResult,
): Set<string> {
  const ids = new Set<string>();
  for (const n of result.nodeDetail) {
    let match = false;
    switch (stat) {
      case 'nodesUsed':
      case 'vmsPlaced':
        match = n.vmsPlaced.length > 0;
        break;
      case 'emptyNodes':
        match = n.state === 'deployable';
        break;
      case 'unplaceable':
        // No node-level match — show empty highlight set, rack map stays
        // un-dimmed since no nodes correspond to the metric.
        match = false;
        break;
    }
    if (match) ids.add(n.nodeId);
  }
  return ids;
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
function formatNum(n: number): string {
  return Math.round(n).toLocaleString();
}

function buildVmBreakdown(nodes: NodeDetail[]) {
  const map = new Map<
    string,
    { name: string; count: number; vcpus: number; memoryGib: number }
  >();
  for (const node of nodes) {
    for (const v of node.vmsPlaced) {
      const existing = map.get(v.vmSizeName);
      if (existing) existing.count++;
      else
        map.set(v.vmSizeName, {
          name: v.vmSizeName,
          count: 1,
          vcpus: v.vcpus,
          memoryGib: v.memoryGib,
        });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.memoryGib * b.count - a.memoryGib * a.count,
  );
}

function hypotheticalFits(catalog: CatalogEntry[], nodes: NodeDetail[]): FitsRow[] {
  if (nodes.length === 0) return [];
  // Use the memory category of the first occupied node's VMs (or fleet memory size to infer)
  // Fallback: include all sizes that fit by node memory ceiling.
  const nodeMem = nodes[0].memoryTotalGib;
  const memCat = catalog.find(
    (c) => Math.abs(c.memoryGib - nodeMem) < 1, // dummy heuristic ignored — we filter by node-fit below
  )?.memoryCategory;

  const rows = new Map<string, FitsRow>();
  for (const c of catalog) {
    // Quick exclude: too large to ever fit one of these nodes
    if (c.memoryGib > nodeMem) continue;
    let total = 0;
    for (const n of nodes) {
      const memRem = n.memoryTotalGib - n.memoryUsedGib;
      const vcpuRem = n.vcpusTotal - n.vcpusUsed;
      if (memRem <= 0 || vcpuRem <= 0) continue;
      const fit = Math.min(Math.floor(memRem / c.memoryGib), Math.floor(vcpuRem / c.vcpus));
      total += fit;
    }
    if (total > 0) {
      rows.set(c.vmSizeName, {
        name: c.vmSizeName,
        vcpus: c.vcpus,
        memoryGib: c.memoryGib,
        totalFit: total,
      });
    }
  }
  // Discard tiny weights — keep distinct memory categories that match the workload
  const all = Array.from(rows.values());
  if (memCat) {
    /* unused */
  }
  return all.sort((a, b) => b.memoryGib - a.memoryGib).slice(0, 10);
}

// ────────────────────────────────────────────────────────────────────────
// Sections
// ────────────────────────────────────────────────────────────────────────
function KeyValues({ items }: { items: KvRow[] }) {
  return (
    <div className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
      {items.map((kv, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 text-[11px] border-b border-border/40 last:border-b-0"
        >
          <span className="text-text-muted tracking-[0.02em] text-[10px]">
            {kv.label}
          </span>
          <span
            className={`font-mono ${kv.emphasize ? 'text-interactive font-semibold' : 'text-text-primary'}`}
          >
            {kv.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FitsSection({
  title,
  fits,
  onHover,
}: {
  title: string;
  fits: FitsRow[];
  onHover?: (fit: FitsRow | null) => void;
}) {
  const interactive = !!onHover;
  return (
    <section>
      <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-2">
        {title} · {fits.length}
      </h3>
      {fits.length === 0 ? (
        <div className="text-[11px] text-text-muted italic">No VM size fits.</div>
      ) : (
        <ul className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
          {fits.map((w) => (
            <li
              key={w.name}
              onMouseEnter={interactive ? () => onHover!(w) : undefined}
              onMouseLeave={
                interactive ? () => onHover!(null) : undefined
              }
              className={`flex items-center gap-2 text-[11px] font-mono px-2 py-1.5 border-b border-border/40 last:border-b-0 ${
                interactive ? 'cursor-default transition-colors hover:bg-white/[0.06]' : ''
              }`}
              title={w.name}
            >
              <span className="truncate flex-1 text-text-primary">
                {w.name.replace('Standard_', '')}
              </span>
              <span className="text-[10px] text-text-muted text-right" style={{ width: 48 }}>{w.vcpus} vCPU</span>
              <span className="text-[10px] text-text-muted w-16 text-right">
                {w.memoryGib.toLocaleString()} GiB
              </span>
              <span className="text-interactive text-[10px] w-10 text-right">
                up to {w.totalFit.toLocaleString()}×
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UnplaceablesSection({
  list,
}: {
  list: SimulatorResult['vmsUnplaceable'];
}) {
  if (list.length === 0) return null;
  // Group by blockingReason so the user sees "all the matrix-unauthored ones"
  // and "all the oversized ones" as cohesive buckets, not interleaved.
  const groups = new Map<typeof list[number]['blockingReason'], typeof list>();
  for (const u of list) {
    if (!groups.has(u.blockingReason)) groups.set(u.blockingReason, []);
    groups.get(u.blockingReason)!.push(u);
  }
  return (
    <section>
      <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-2">
        Unplaceable VMs · {list.reduce((s, u) => s + u.count, 0)} across{' '}
        {groups.size} reason{groups.size === 1 ? '' : 's'}
      </h3>
      <div className="space-y-2">
        {Array.from(groups.entries()).map(([reason, rows]) => {
          const meta = REASONS[reason];
          const accent = reasonAccent(reason);
          return (
            <div
              key={reason}
              className="glass overflow-hidden"
              style={{
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className="px-3 py-2" style={{ background: accent.bg }}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold tracking-[0.02em]"
                    style={{ color: accent.text }}
                  >
                    {meta?.label ?? reason}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: accent.text }}
                  >
                    {rows.reduce((s, u) => s + u.count, 0)} VM
                    {rows.reduce((s, u) => s + u.count, 0) === 1 ? '' : 's'}
                  </span>
                </div>
                {meta?.description && (
                  <p className="text-[10px] text-text-muted mt-1 leading-snug">
                    {meta.description}
                  </p>
                )}
              </div>
              <ul>
                {rows.map((u, i) => (
                  <li
                    key={i}
                    className="px-3 py-1.5 border-t border-border/40 first:border-t-0"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="truncate flex-1 text-text-primary" title={u.vmSizeName}>
                        {u.vmSizeName.replace('Standard_', '')}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0">×{u.count}</span>
                    </div>
                    {u.details && (
                      // Per-row specifics from the engine / classifier — concrete
                      // numbers ("VM needs 5700 GiB; largest node has 4096 GiB").
                      <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                        {u.details}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VmBreakdownSection({
  list,
}: {
  list: { name: string; count: number; vcpus: number; memoryGib: number }[];
}) {
  return (
    <section>
      <h3 className="text-[9px] tracking-[0.04em] text-text-secondary mb-2">
        VM Breakdown
      </h3>
      <div className="glass overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
        <table className="w-full text-[11px] font-mono">
          <tbody>
            {list.map((v) => (
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
    </section>
  );
}

/**
 * Shared Inspector primitives (v2.24).
 *
 * Small presentational pieces lifted out of the old monolithic InsightsPane
 * so the altitude-adaptive Inspector views (Node / Cluster / Region / Zone /
 * Fleet) can share them without duplication. Pure presentation — `var(--*)`
 * tokens, sentence-case, the `.section-h`-style collapsible Section.
 */
import type { ReactNode } from 'react';
import { useApp } from '../../../state/AppContext';
import type { NodeDetail, SimulatorResult } from '../../../types';
import { REASONS, reasonAccent } from '../../../utils/blockingReason';
import type { BlockingReason } from '../../../types';

// ── Collapsible section ─────────────────────────────────────────────────
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const { state, dispatch } = useApp();
  const open = state.ui.insightsSectionsOpen[id] !== false;
  const toggle = () =>
    dispatch({
      type: 'UI_SET',
      ui: { insightsSectionsOpen: { ...state.ui.insightsSectionsOpen, [id]: !open } },
    });
  return (
    <section className="border-b border-border">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
          {open ? '▾' : '▸'}
        </span>
        <span
          className="text-[10px] tracking-[0.04em] font-semibold"
          style={{ color: 'var(--interactive)' }}
        >
          {title}
        </span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </section>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <div className="text-[11px] text-text-muted italic px-1 py-1">{children}</div>;
}

export function CloseButton({ inline }: { inline?: boolean }) {
  const { dispatch } = useApp();
  return (
    <button
      onClick={() => dispatch({ type: 'UI_SET', ui: { detailPaneCollapsed: true } })}
      className={
        inline
          ? 'px-2 text-text-muted hover:text-[#FCA5A5] text-sm leading-none transition-colors flex-shrink-0'
          : 'self-end px-3 py-2 text-text-muted hover:text-[#FCA5A5] text-sm leading-none transition-colors'
      }
      title="Hide the Inspector"
      aria-label="Close Inspector"
    >
      ✕
    </button>
  );
}

export function Tile({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const color = tone === 'bad' ? '#FCA5A5' : accent ? 'var(--interactive)' : 'var(--text-primary)';
  return (
    <div
      className="px-2 py-1.5"
      style={{
        background: accent ? 'rgba(129, 140, 248, 0.08)' : 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        minWidth: 0,
      }}
    >
      <div className="text-[9px] tracking-[0.04em] text-text-muted leading-tight">{label}</div>
      <div className="font-mono leading-tight" style={{ color, fontSize: 13 }}>
        {value}
      </div>
      {sub && <div className="text-[9px] text-text-muted mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

export function UtilRow({
  label,
  used,
  total,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  /** Unit suffix (e.g. "GiB", "Mbps"); omitted for a bare count like vCPU. */
  unit?: string;
}) {
  const ratio = total > 0 ? Math.min(1, used / total) : 0;
  const pct = total > 0 ? `${((used / total) * 100).toFixed(1)}%` : '—';
  const color = ratio > 0.85 ? '#FCA5A5' : ratio > 0.6 ? 'var(--interactive)' : '#9CA3AF';
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">
          {Math.round(used).toLocaleString()} / {Math.round(total).toLocaleString()}
          {unit ? ` ${unit}` : ''} · <span style={{ color }}>{pct}</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: color,
            transformOrigin: 'left',
            transform: `scaleX(${ratio})`,
            transition: 'transform 200ms var(--ease-out)',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}

// ── Scope statistics — node-state breakdown + util bars + binding summary ──
// Shared by the Region / Zone / Cluster inspectors. Counts deliberately sum
// to nodes.length (isolated-with-VMs counts as partial, matching the rack
// legend). No `$` — purely deployment/capacity.
const STATE_DOT: { key: keyof Counts; label: string; color: string }[] = [
  { key: 'deployable', label: 'empty', color: 'var(--node-deployable)' },
  { key: 'partial', label: 'partial', color: 'var(--node-partial)' },
  { key: 'full', label: 'full', color: 'var(--node-full)' },
  { key: 'reserved', label: 'overhead', color: 'var(--node-reserved)' },
  { key: 'isolated', label: 'isolated', color: 'var(--node-isolated)' },
  { key: 'ofr', label: 'out for repair', color: 'var(--node-ofr)' },
];
interface Counts {
  deployable: number;
  partial: number;
  full: number;
  reserved: number;
  isolated: number;
  ofr: number;
}

export function ScopeStats({ nodes }: { nodes: NodeDetail[] }) {
  if (nodes.length === 0) return <Hint>No nodes match this scope.</Hint>;
  const counts: Counts = { deployable: 0, partial: 0, full: 0, reserved: 0, isolated: 0, ofr: 0 };
  let memUsed = 0, memTotal = 0, vcpuUsed = 0, vcpuTotal = 0;
  let netUsed = 0, netTotal = 0, storUsed = 0, storTotal = 0, vmsPlaced = 0;
  const bound = { MEMORY: 0, VCPU: 0, NETWORK: 0, STORAGE: 0 };
  let headroom = 0; // deployable/partial nodes that can still take workload
  for (const n of nodes) {
    if (n.state === 'reserved') counts.reserved++;
    else if (n.state === 'ofr') counts.ofr++;
    else if (n.state === 'isolated' && n.vmsPlaced.length === 0) counts.isolated++;
    else if (n.state === 'occupied-full') counts.full++;
    else if (n.state === 'occupied-partial' || (n.state === 'isolated' && n.vmsPlaced.length > 0))
      counts.partial++;
    else counts.deployable++;
    memUsed += n.memoryUsedGib;
    memTotal += n.memoryTotalGib;
    vcpuUsed += n.vcpusUsed;
    vcpuTotal += n.vcpusTotal;
    if (n.throughputTotalMbps !== null) {
      netUsed += n.throughputUsedMbps;
      netTotal += n.throughputTotalMbps;
    }
    if (n.storageThroughputTotalMbps !== null) {
      storUsed += n.storageThroughputUsedMbps;
      storTotal += n.storageThroughputTotalMbps;
    }
    vmsPlaced += n.vmsPlaced.length;
    if (n.state === 'reserved' || n.state === 'ofr') continue;
    if (n.bindingConstraint && n.bindingConstraint !== 'NONE') {
      bound[n.bindingConstraint as keyof typeof bound]++;
    } else if (n.state === 'deployable' || n.state === 'occupied-partial' || n.state === 'isolated') {
      headroom++;
    }
  }
  const totalNodes = nodes.length;
  const stateDots = STATE_DOT.filter((d) => counts[d.key] > 0);
  const bindingParts: string[] = [];
  if (bound.MEMORY) bindingParts.push(`${bound.MEMORY} memory-bound`);
  if (bound.VCPU) bindingParts.push(`${bound.VCPU} vCPU-bound`);
  if (bound.NETWORK) bindingParts.push(`${bound.NETWORK} network-bound`);
  if (bound.STORAGE) bindingParts.push(`${bound.STORAGE} storage-bound`);
  if (headroom) bindingParts.push(`${headroom} with headroom`);

  return (
    <div className="space-y-2.5 text-[11px]">
      {/* Node-state count strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[11px] text-text-primary">
          {vmsPlaced.toLocaleString()} VMs · {totalNodes.toLocaleString()} nodes
        </span>
        {stateDots.map((d) => (
          <span
            key={d.key}
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
            {counts[d.key].toLocaleString()} {d.label}
          </span>
        ))}
      </div>

      {/* Utilization bars */}
      <div className="space-y-1">
        <UtilRow label="Memory" used={memUsed} total={memTotal} unit="GiB" />
        <UtilRow label="vCPU" used={vcpuUsed} total={vcpuTotal} />
        {netTotal > 0 && <UtilRow label="Network" used={netUsed} total={netTotal} unit="Mbps" />}
        {storTotal > 0 && <UtilRow label="Storage SSD" used={storUsed} total={storTotal} unit="MB/s" />}
      </div>

      {/* Binding-constraint summary */}
      {bindingParts.length > 0 && (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {bindingParts.join(' · ')}
        </div>
      )}
    </div>
  );
}

// ── Unplaceable VMs (fleet-wide; kept per user request) ──────────────────
export type SidebarTab = 'hardware' | 'fleet' | 'fungibility' | 'configure' | 'vms';

export function unplaceableActionForReason(
  reason: BlockingReason,
): { label: string; tab: SidebarTab } | null {
  switch (reason) {
    case 'NOT_AUTHORED':
    case 'NOT_FUNGIBLE_TO_HARDWARE':
    case 'NO_FUNGIBILITY_DEFINED':
    case 'BLOCKED_BY_MATRIX':
    case 'NO_ELIGIBLE_NODES':
      return { label: 'Open VM fungibility →', tab: 'fungibility' };
    case 'ZONE_NOT_IN_FLEET':
    case 'NO_CLUSTERS_CONFIGURED':
    case 'DEPLOYMENT_LIMIT':
      return { label: 'Open Fleet builder →', tab: 'fleet' };
    case 'VM_OVERSIZED_MEMORY':
    case 'VM_OVERSIZED_VCPU':
    case 'VM_OVERSIZED_NETWORK':
    case 'VM_OVERSIZED_STORAGE':
      return { label: 'Open Cluster builder →', tab: 'hardware' };
    case 'VM_SIZE_NOT_FOUND':
    case 'REGION_MISMATCH':
      return { label: 'Open VM catalog →', tab: 'vms' };
    default:
      return null;
  }
}

export function UnplaceableBreakdown({
  entries,
  onJumpToTab,
}: {
  entries: SimulatorResult['vmsUnplaceable'];
  onJumpToTab: (tab: SidebarTab) => void;
}) {
  const byReason = new Map<BlockingReason, typeof entries>();
  for (const e of entries) {
    const arr = byReason.get(e.blockingReason) ?? [];
    arr.push(e);
    byReason.set(e.blockingReason, arr);
  }
  return (
    <div className="space-y-2">
      {[...byReason.entries()].map(([reason, rows]) => {
        const meta = REASONS[reason];
        const accent = reasonAccent(reason);
        const total = rows.reduce((s, r) => s + r.count, 0);
        const action = unplaceableActionForReason(reason);
        return (
          <div
            key={reason}
            style={{
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
            }}
          >
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-semibold tracking-tight" style={{ color: accent.text }}>
                {meta?.label ?? reason}
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                · {total} VM{total === 1 ? '' : 's'} · {rows.length} SKU{rows.length === 1 ? '' : 's'}
              </span>
              {action && (
                <button
                  type="button"
                  onClick={() => onJumpToTab(action.tab)}
                  className="ml-auto text-[10px] tracking-[0.02em] transition-colors hover:brightness-110"
                  style={{ color: 'var(--interactive)' }}
                >
                  {action.label}
                </button>
              )}
            </div>
            <div className="text-[10px] leading-snug text-text-secondary mb-1.5">
              {meta?.description ?? 'Unplaceable for unspecified reason.'}
            </div>
            <ul className="space-y-0.5">
              {rows.map((r, i) => (
                <li
                  key={`${r.vmSizeName}-${i}`}
                  className="flex items-baseline gap-2 text-[10.5px] font-mono"
                  title={r.details ?? undefined}
                >
                  <span className="text-text-primary">{r.vmSizeName.replace('Standard_', '')}</span>
                  <span className="text-text-muted">× {r.count}</span>
                  {r.details && (
                    <span className="text-[9.5px] text-text-muted italic truncate">— {r.details}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ── Spillover routes (fleet-wide; kept per user request) ─────────────────
export function SpilloverBreakdown({ events }: { events: SimulatorResult['spilloverEvents'] }) {
  const byRoute = new Map<string, typeof events>();
  for (const e of events) {
    const key = `${e.fromGroup}|${e.toGroup}`;
    const arr = byRoute.get(key) ?? [];
    arr.push(e);
    byRoute.set(key, arr);
  }
  const routes = [...byRoute.values()].sort(
    (a, b) => b.reduce((s, e) => s + e.count, 0) - a.reduce((s, e) => s + e.count, 0),
  );
  return (
    <div className="space-y-2">
      <div className="text-[10px] leading-snug text-text-secondary">
        Home hardware filled, so the engine routed these to the next fungibility tier — automatic and
        expected, but a sign the home tier is at capacity.
      </div>
      {routes.map((rows) => {
        const total = rows.reduce((s, e) => s + e.count, 0);
        const { fromGroup, toGroup } = rows[0];
        return (
          <div
            key={`${fromGroup}-${toGroup}`}
            style={{
              background: 'rgba(129, 140, 248, 0.06)',
              border: '1px solid rgba(129, 140, 248, 0.30)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
            }}
          >
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <span className="text-[10.5px] font-mono">
                <span style={{ color: 'var(--text-secondary)' }}>{fromGroup}</span>
                <span style={{ color: 'var(--interactive)' }}> → </span>
                <span style={{ color: 'var(--text-primary)' }}>{toGroup}</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                · {total} VM{total === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="space-y-0.5">
              {rows
                .sort((a, b) => b.count - a.count)
                .map((e, i) => (
                  <li key={`${e.vmSizeName}-${i}`} className="flex items-baseline gap-2 text-[10.5px] font-mono">
                    <span className="text-text-primary">{e.vmSizeName.replace('Standard_', '')}</span>
                    <span className="text-text-muted">× {e.count}</span>
                  </li>
                ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

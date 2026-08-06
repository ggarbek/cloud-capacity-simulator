/**
 * NodeRoster (v2.24) — the bridge from a cluster to its nodes.
 *
 * A compact, clickable list of a cluster's nodes, sorted bottleneck-first
 * (full / bound, then by memory fill). Clicking a row selects that node
 * (NODE_SELECT) so the Inspector swaps to the node detail view — the same
 * contract a shelf click on the rack elevation uses, so the map altitude
 * stays put. Lets an operator jump straight to the hot node.
 */
import { useApp } from '../../../state/AppContext';
import type { NodeDetail } from '../../../types';
import { nodeBadge, nodeStateColor, utilTone } from '../fleetmapData';

function fillPct(n: NodeDetail): number {
  return n.memoryTotalGib > 0 ? (n.memoryUsedGib / n.memoryTotalGib) * 100 : 0;
}

// Bottleneck-first: full nodes, then bound, then by fill desc.
function rank(n: NodeDetail): number {
  if (n.state === 'occupied-full') return 0;
  if (n.bindingConstraint && n.bindingConstraint !== 'NONE') return 1;
  if (n.state === 'occupied-partial') return 2;
  return 3;
}

export function NodeRoster({ nodes }: { nodes: NodeDetail[] }) {
  const { state, dispatch } = useApp();
  const selected = new Set(state.selectedNodeIds);
  const sorted = [...nodes].sort((a, b) => rank(a) - rank(b) || fillPct(b) - fillPct(a));

  return (
    <ul className="space-y-1" style={{ maxHeight: 320, overflowY: 'auto' }}>
      {sorted.map((n) => {
        const pct = fillPct(n);
        const badge = nodeBadge(n);
        const isSel = selected.has(n.nodeId);
        return (
          <li key={n.nodeId}>
            <button
              type="button"
              data-rack-no-deselect
              onClick={() => dispatch({ type: 'NODE_SELECT', ids: [n.nodeId] })}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
              style={{
                background: isSel ? 'rgba(129, 140, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSel ? 'var(--border-glow)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
              }}
              title="Inspect this node — bottleneck, resource bars, and what else fits"
            >
              <span
                aria-hidden="true"
                style={{ width: 7, height: 7, borderRadius: 2, background: nodeStateColor(n), flexShrink: 0 }}
              />
              <span className="font-mono text-[11px] text-text-primary" style={{ minWidth: 70 }}>
                R{n.rack}·N{n.posInRack}
              </span>
              {badge && (
                <span
                  className="font-mono text-[9px] font-semibold grid place-items-center"
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                  title="Binding constraint (M/C/N/S)"
                >
                  {badge}
                </span>
              )}
              <span className="text-[10px] text-text-muted ml-auto whitespace-nowrap">
                {n.vmsPlaced.length} VM{n.vmsPlaced.length === 1 ? '' : 's'}
              </span>
              <span
                className="font-mono text-[10px] whitespace-nowrap"
                style={{ color: utilTone(pct), minWidth: 42, textAlign: 'right' }}
              >
                {pct.toFixed(0)}%
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

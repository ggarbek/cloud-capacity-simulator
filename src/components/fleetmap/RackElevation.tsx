import { useApp } from '../../state/AppContext';
import type { NodeDetail } from '../../types';
import type { ClusterGroup } from './fleetmapData';
import {
  formatMemShort,
  nodeBadge,
  nodeStateHex,
  nodeStateLabel,
} from './fleetmapData';

/**
 * v2.21.1 — Rack elevation: the cluster-altitude visualization.
 *
 * Each rack renders as a front-on server rack chassis — vented top cap,
 * side rails with mounting holes, a stack of 1U server shelves, and a
 * bottom cap with the rack label. Each shelf IS a node: status LED on the
 * left, drive-bay slits, VM count, a memory-utilization fill that glows in
 * the node's state color, and a right-edge badge (binding constraint
 * letter / 🔒 overhead / ● isolated). Replaces the abstract square tiles.
 *
 * Interaction contract carried over from the legacy tiles verbatim:
 * click = NODE_TOGGLE (multi via cmd/ctrl/shift), selected = cyan select
 * ring, stat-highlight dims non-matching shelves, hetero racks show a
 * per-shelf memory chip, zoom scales shelf height.
 */

const RACK_W = 196;
const SHELF_GAP = 3;

export function RackElevation({
  cluster,
  shelfH,
  highlightSet,
}: {
  cluster: ClusterGroup;
  /** Shelf (node) height in px — driven by the zoom control. */
  shelfH: number;
  /** When a stat is selected, only these node ids stay lit. Null = no stat. */
  highlightSet: Set<string> | null;
}) {
  return (
    <div className="flex flex-wrap" style={{ gap: 20, alignItems: 'flex-start' }}>
      {cluster.racks.map(({ rack, nodes }) => (
        <Rack
          key={rack}
          rackNo={rack}
          nodes={nodes}
          shelfH={shelfH}
          showMemChip={cluster.isHetero}
          highlightSet={highlightSet}
        />
      ))}
    </div>
  );
}

function Rack({
  rackNo,
  nodes,
  shelfH,
  showMemChip,
  highlightSet,
}: {
  rackNo: number;
  nodes: NodeDetail[];
  shelfH: number;
  showMemChip: boolean;
  highlightSet: Set<string> | null;
}) {
  const { state } = useApp();
  const light = state.ui.theme === 'light';

  const chassis = light
    ? 'linear-gradient(180deg, #E8EDF3 0%, #D3DAE3 55%, #C4CCD7 100%)'
    : 'linear-gradient(180deg, #1E232C 0%, #14181F 55%, #0F1218 100%)';
  const railDot = light ? 'rgba(15, 23, 42, 0.28)' : 'rgba(255, 255, 255, 0.16)';
  const backplane = light ? '#AEB9C6' : '#07090D';
  const capLine = light ? 'rgba(15, 23, 42, 0.32)' : 'rgba(255,255,255,0.10)';
  const edge = light ? 'rgba(15, 23, 42, 0.30)' : 'rgba(255, 255, 255, 0.12)';
  const occupied = nodes.filter((n) => n.vmsPlaced.length > 0).length;

  return (
    <div
      className="flex-shrink-0"
      style={{
        width: RACK_W,
        borderRadius: 10,
        background: chassis,
        border: `1px solid ${edge}`,
        boxShadow: light
          ? 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 20px -12px rgba(15,23,42,0.35)'
          : 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 28px -16px rgba(0,0,0,0.7)',
        padding: '7px 8px 8px',
      }}
      role="group"
      aria-label={`Rack ${rackNo} — ${occupied} of ${nodes.length} nodes occupied`}
    >
      {/* Top cap — vent slits + rack label. */}
      <div className="flex items-center" style={{ height: 14, marginBottom: 5, gap: 8 }}>
        <div
          aria-hidden="true"
          style={{
            flex: 1,
            height: 8,
            borderRadius: 2,
            backgroundImage: `repeating-linear-gradient(90deg, ${
              light ? 'rgba(15,23,42,0.22)' : 'rgba(0,0,0,0.55)'
            } 0 2px, transparent 2px 6px)`,
            border: `1px solid ${capLine}`,
          }}
        />
        <span
          className="font-mono font-semibold leading-none"
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            color: light ? '#334155' : '#8B93A3',
          }}
        >
          R{rackNo}
        </span>
      </div>

      {/* Shelf bay — rails either side, shelves stacked inside. */}
      <div className="flex" style={{ gap: 5 }}>
        <RackRail dotColor={railDot} count={nodes.length} shelfH={shelfH} />
        <div
          className="flex-1 flex flex-col"
          style={{
            gap: SHELF_GAP,
            background: backplane,
            borderRadius: 5,
            padding: 3,
            border: `1px solid ${light ? 'rgba(15,23,42,0.18)' : 'rgba(0,0,0,0.6)'}`,
            boxShadow: light ? 'inset 0 1px 3px rgba(15,23,42,0.18)' : 'inset 0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          {nodes.map((node) => (
            <Shelf
              key={node.nodeId}
              node={node}
              h={shelfH}
              light={light}
              showMemChip={showMemChip}
              selected={state.selectedNodeIds.includes(node.nodeId)}
              dimmed={highlightSet !== null && !highlightSet.has(node.nodeId)}
              statHighlighted={highlightSet !== null && highlightSet.has(node.nodeId)}
            />
          ))}
        </div>
        <RackRail dotColor={railDot} count={nodes.length} shelfH={shelfH} />
      </div>

      {/* Bottom cap — occupancy readout. */}
      <div
        className="flex items-center justify-between"
        style={{ height: 13, marginTop: 6, padding: '0 2px' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: occupied > 0 ? 'var(--status-good)' : light ? '#94A3B8' : '#3A4150',
            boxShadow: occupied > 0 ? '0 0 5px rgba(34,197,94,0.7)' : 'none',
          }}
        />
        <span
          className="font-mono leading-none"
          style={{ fontSize: 9, color: light ? '#475569' : '#6B7382', letterSpacing: '0.04em' }}
        >
          {occupied}/{nodes.length} nodes
        </span>
      </div>
    </div>
  );
}

/** Vertical mounting rail — one screw hole per shelf position. */
function RackRail({
  dotColor,
  count,
  shelfH,
}: {
  dotColor: string;
  count: number;
  shelfH: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex-shrink-0 flex flex-col items-center"
      style={{ width: 6, gap: SHELF_GAP, paddingTop: 3 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="grid place-items-center" style={{ height: shelfH }}>
          <span
            style={{ width: 3, height: 3, borderRadius: '50%', background: dotColor }}
          />
        </div>
      ))}
    </div>
  );
}

function Shelf({
  node,
  h,
  light,
  showMemChip,
  selected,
  dimmed,
  statHighlighted,
}: {
  node: NodeDetail;
  h: number;
  light: boolean;
  showMemChip: boolean;
  selected: boolean;
  dimmed: boolean;
  statHighlighted: boolean;
}) {
  const { dispatch } = useApp();
  const hex = nodeStateHex(node, light);
  const label = nodeStateLabel(node);
  const badge = nodeBadge(node);
  const vmCount = node.vmsPlaced.length;
  const memUtil =
    node.memoryTotalGib > 0 ? Math.min(1, node.memoryUsedGib / node.memoryTotalGib) : 0;
  const inactive = node.state === 'reserved' || node.state === 'ofr';

  // Faceplate: brushed-metal base with a state-colored cast.
  const face = light
    ? `linear-gradient(180deg, ${hex}26 0%, ${hex}14 45%, rgba(15,23,42,0.10) 100%), linear-gradient(180deg, #F2F5F9, #DDE3EA)`
    : `linear-gradient(180deg, ${hex}30 0%, ${hex}14 45%, rgba(0,0,0,0.35) 100%), linear-gradient(180deg, #232934, #161A21)`;

  const compact = h < 30;
  const fontSize = compact ? 10 : 11.5;

  return (
    <button
      type="button"
      data-node-id={node.nodeId}
      onClick={(e) =>
        dispatch({
          type: 'NODE_TOGGLE',
          id: node.nodeId,
          multi: e.metaKey || e.ctrlKey || e.shiftKey,
        })
      }
      className="fm-shelf relative w-full text-left"
      style={{
        height: h,
        borderRadius: 4,
        background: face,
        border: `1px solid ${selected ? 'transparent' : `${hex}${light ? '7A' : '55'}`}`,
        boxShadow: selected
          ? 'var(--select-glow)'
          : statHighlighted
          ? `0 0 0 1.5px ${hex}, 0 0 10px ${hex}66`
          : light
          ? 'inset 0 1px 0 rgba(255,255,255,0.7)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.35)',
        opacity: dimmed ? 0.32 : 1,
        filter: dimmed ? 'saturate(0.4)' : undefined,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: selected ? 2 : 1,
        padding: 0,
      }}
      aria-label={`Rack ${node.rack} node ${node.posInRack} — ${label}, ${vmCount} VM${
        vmCount === 1 ? '' : 's'
      }`}
      aria-pressed={selected}
      title={`R${node.rack} · N${node.posInRack} — ${label} · ${vmCount} VM${
        vmCount === 1 ? '' : 's'
      } · mem ${Math.round(memUtil * 100)}%`}
    >
      {/* Memory-utilization fill — the shelf "lights up" left→right. */}
      {!inactive && memUtil > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${memUtil * 100}%`,
            background: `linear-gradient(180deg, ${hex}${light ? '5C' : '52'}, ${hex}${
              light ? '3D' : '2E'
            })`,
            borderRight: `1px solid ${hex}${light ? 'AA' : '88'}`,
            boxShadow: `inset -6px 0 10px -6px ${hex}AA`,
          }}
        />
      )}
      {/* Overhead / OFR — service stripes across the faceplate. */}
      {inactive && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(135deg, ${hex}2E 0 5px, transparent 5px 11px)`,
          }}
        />
      )}

      {/* Status LED. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 7,
          top: '50%',
          transform: 'translateY(-50%)',
          width: compact ? 4 : 5,
          height: compact ? 4 : 5,
          borderRadius: '50%',
          background: hex,
          boxShadow: `0 0 ${compact ? 4 : 6}px ${hex}CC`,
        }}
      />

      {/* Drive-bay slits — purely decorative chassis detailing. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 17,
          top: '26%',
          bottom: '26%',
          width: compact ? 14 : 20,
          backgroundImage: `repeating-linear-gradient(90deg, ${
            light ? 'rgba(15,23,42,0.30)' : 'rgba(0,0,0,0.55)'
          } 0 2px, transparent 2px 5px)`,
          borderRadius: 1,
          opacity: 0.9,
        }}
      />

      {/* VM count. */}
      <span
        className="font-mono font-semibold leading-none"
        style={{
          position: 'absolute',
          left: compact ? 37 : 44,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize,
          color: light ? '#0F172A' : '#F1F5F9',
          textShadow: light ? 'none' : '0 1px 2px rgba(0,0,0,0.6)',
          opacity: vmCount === 0 ? 0.55 : 1,
        }}
      >
        {vmCount}
        {!compact && (
          <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: 4, fontSize: fontSize - 2 }}>
            VM{vmCount === 1 ? '' : 's'}
          </span>
        )}
      </span>

      {/* Right edge — memory chip (hetero racks) + state badge. */}
      <span
        className="flex items-center"
        style={{
          position: 'absolute',
          right: 6,
          top: 0,
          bottom: 0,
          gap: 5,
          pointerEvents: 'none',
        }}
      >
        {showMemChip && (
          <span
            className="font-mono leading-none"
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '1.5px 4px',
              borderRadius: 'var(--radius-pill)',
              color: node.isolated ? 'var(--status-warn)' : light ? '#334155' : '#A6ADBC',
              border: `1px solid ${
                node.isolated
                  ? 'rgba(251, 191, 36, 0.55)'
                  : light
                  ? 'rgba(15,23,42,0.25)'
                  : 'rgba(255,255,255,0.18)'
              }`,
              background: light ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.4)',
            }}
            title={`${node.memoryTotalGib.toLocaleString()} GiB per node`}
          >
            {formatMemShort(node.memoryTotalGib)}
          </span>
        )}
        {badge && (
          <span
            className="leading-none font-bold"
            style={{
              fontSize: badge === '🔒' ? 9 : 9.5,
              color: light ? '#FFFFFF' : '#FFFFFF',
              background: `${hex}${light ? 'E6' : 'B3'}`,
              borderRadius: 3,
              padding: '2px 4px',
              minWidth: 14,
              textAlign: 'center',
            }}
            title={
              node.state === 'occupied-full'
                ? `Full — binding constraint: ${node.bindingConstraint}`
                : label
            }
          >
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

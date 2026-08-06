import { useApp } from '../../state/AppContext';
import type { ClusterGroup, RegionGroup, ZoneGroup } from './fleetmapData';
import { memPct, vcpuPct, utilTone, NO_ZONE } from './fleetmapData';

/**
 * v2.21.1 — Zone altitude: the datacenter floor of one region.
 *
 * Each zone renders as an "aisle" section; inside it every cluster is a
 * card holding a row of mini-rack silhouettes — small chassis glyphs whose
 * fill level IS the rack's memory utilization, toned calm → amber → red.
 * One glance answers "which zone is hot, which cluster is full." Click a
 * cluster to drop to the rack elevation; click the zone label to scope
 * Insights to that zone (same toggle the legacy banners had).
 */
export function ZoneLayer({
  region,
  onDrillCluster,
}: {
  region: RegionGroup;
  onDrillCluster: (c: ClusterGroup) => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 22 }}>
      {region.zones.map((zone) => (
        <ZoneAisle key={zone.zone} zone={zone} onDrillCluster={onDrillCluster} />
      ))}
    </div>
  );
}

function ZoneAisle({
  zone,
  onDrillCluster,
}: {
  zone: ZoneGroup;
  onDrillCluster: (c: ClusterGroup) => void;
}) {
  const { state, dispatch } = useApp();
  const scopedHere = state.ui.scope?.kind === 'zone' && state.ui.scope.key === zone.zone;
  const mem = memPct(zone.util);

  return (
    <section>
      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'SCOPE_SET',
              scope: scopedHere ? null : { kind: 'zone', key: zone.zone },
            })
          }
          className="font-semibold transition-colors"
          style={{
            fontSize: 12.5,
            letterSpacing: '-0.01em',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            color: zone.zone === NO_ZONE ? 'var(--text-muted)' : 'var(--text-primary)',
            background: scopedHere ? 'var(--interactive-muted)' : 'transparent',
            border: `1px solid ${scopedHere ? 'var(--border-glow)' : 'transparent'}`,
            cursor: 'pointer',
          }}
          title={
            scopedHere
              ? 'Clear the Insights scope'
              : `Scope Insights to ${zone.label} (drill into a cluster below for racks)`
          }
        >
          ◈ {zone.label}
        </button>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {zone.clusters.length} cluster{zone.clusters.length === 1 ? '' : 's'} ·{' '}
          {zone.util.occupiedNodes}/{zone.util.totalNodes} nodes occupied
        </span>
        <span className="ml-auto flex items-center gap-3">
          <MiniUtil label="mem" pct={mem} />
          <MiniUtil label="cpu" pct={vcpuPct(zone.util)} />
        </span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {zone.clusters.map((c) => (
          <ClusterCard key={c.clusterId} cluster={c} onDrill={() => onDrillCluster(c)} />
        ))}
      </div>
    </section>
  );
}

function ClusterCard({
  cluster,
  onDrill,
}: {
  cluster: ClusterGroup;
  onDrill: () => void;
}) {
  const { state } = useApp();
  const light = state.ui.theme === 'light';
  const mem = memPct(cluster.util);
  const full = cluster.counts.full;

  return (
    <button
      type="button"
      onClick={onDrill}
      className="fm-card text-left"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-card)',
        padding: '14px 16px 12px',
        cursor: 'pointer',
      }}
      title={`Open Cluster ${cluster.index} — ${cluster.hwLabel} · ${cluster.racks.length} rack${
        cluster.racks.length === 1 ? '' : 's'
      }`}
    >
      <div className="flex items-baseline gap-2 flex-wrap" style={{ marginBottom: 2 }}>
        <span
          className="font-semibold"
          style={{ fontSize: 13, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          Cluster {cluster.index}
        </span>
        <span
          className="text-[11px] min-w-0"
          style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {cluster.hwLabel}
        </span>
        <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: 'var(--interactive)' }}>
          racks →
        </span>
      </div>
      <div className="text-[10.5px]" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
        {cluster.racks.length} rack{cluster.racks.length === 1 ? '' : 's'} ·{' '}
        {cluster.util.occupiedNodes}/{cluster.util.totalNodes} nodes · mem{' '}
        <span style={{ color: utilTone(mem) }}>{Math.round(mem)}%</span>
        {full > 0 && (
          <span style={{ color: 'var(--status-bad)' }}> · {full} full</span>
        )}
      </div>

      {/* The aisle — one mini-rack silhouette per physical rack. */}
      <div className="flex flex-wrap items-end" style={{ gap: 6 }}>
        {cluster.racks.map(({ rack, nodes }) => {
          const memTotal = nodes.reduce((s, n) => s + n.memoryTotalGib, 0);
          const memUsed = nodes.reduce((s, n) => s + n.memoryUsedGib, 0);
          const pct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
          const occ = nodes.filter((n) => n.vmsPlaced.length > 0).length;
          const tone = utilTone(pct);
          // Tone resolves to a CSS var — resolve the raw fill via a small map
          // so we can alpha-blend inline.
          const hex =
            pct >= 85 ? (light ? '#B91C1C' : '#EF4444') : pct >= 60 ? (light ? '#B45309' : '#FBBF24') : light ? '#4F46E5' : '#818CF8';
          return (
            <span
              key={rack}
              className="relative"
              style={{
                width: 26,
                height: 56,
                borderRadius: 4,
                background: light
                  ? 'linear-gradient(180deg, #E2E8F0, #C8D0DB)'
                  : 'linear-gradient(180deg, #1C212A, #11151C)',
                border: `1px solid ${light ? 'rgba(15,23,42,0.25)' : 'rgba(255,255,255,0.10)'}`,
                overflow: 'hidden',
                boxShadow: light
                  ? 'inset 0 1px 0 rgba(255,255,255,0.7)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              title={`R${rack} · ${occ}/${nodes.length} nodes · mem ${Math.round(pct)}%`}
            >
              {/* shelf scanlines */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 2,
                  backgroundImage: `repeating-linear-gradient(180deg, transparent 0 4px, ${
                    light ? 'rgba(15,23,42,0.10)' : 'rgba(0,0,0,0.5)'
                  } 4px 5px)`,
                  borderRadius: 2,
                }}
              />
              {/* utilization fill from the bottom */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 2,
                  right: 2,
                  bottom: 2,
                  height: `${Math.max(pct, occ > 0 ? 6 : 0)}%`,
                  background: `linear-gradient(180deg, ${hex}E6, ${hex}99)`,
                  borderRadius: 2,
                  boxShadow: `0 0 8px ${hex}66`,
                }}
              />
              {/* status LED */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 4,
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: occ > 0 ? tone : light ? '#94A3B8' : '#3A4150',
                }}
              />
            </span>
          );
        })}
      </div>
    </button>
  );
}

export function MiniUtil({ label, pct }: { label: string; pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[9.5px] font-mono" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span
        className="relative"
        style={{
          width: 54,
          height: 5,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--tint-soft-2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: utilTone(pct),
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </span>
      <span className="text-[10px] font-mono" style={{ color: utilTone(pct), minWidth: 30 }}>
        {Math.round(pct)}%
      </span>
    </span>
  );
}

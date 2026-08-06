import type { RegionGroup } from './fleetmapData';
import { memPct, vcpuPct, utilTone, NO_REGION } from './fleetmapData';
import { MiniUtil } from './ZoneLayer';

/**
 * v2.21.1 — Region altitude: the whole fleet at a glance.
 *
 * One card per region: headline memory utilization, vCPU, and a per-zone
 * breakdown with fill bars — enough to answer "which region needs my
 * attention" before any drilling. Click a card to open that region's
 * datacenter floor (zone altitude).
 */
export function RegionsLayer({
  regions,
  onDrillRegion,
}: {
  regions: RegionGroup[];
  onDrillRegion: (r: RegionGroup) => void;
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}
    >
      {regions.map((r) => (
        <RegionCard key={r.region} region={r} onDrill={() => onDrillRegion(r)} />
      ))}
    </div>
  );
}

function RegionCard({
  region,
  onDrill,
}: {
  region: RegionGroup;
  onDrill: () => void;
}) {
  const mem = memPct(region.util);
  const cpu = vcpuPct(region.util);

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
        padding: '18px 20px 16px',
        cursor: 'pointer',
      }}
      title={`Open ${region.label} — zones and clusters`}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className="font-semibold"
          style={{
            fontSize: 15,
            letterSpacing: '-0.015em',
            color: region.region === NO_REGION ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          ⌖ {region.label}
        </span>
        <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: 'var(--interactive)' }}>
          zones →
        </span>
      </div>
      <div className="text-[11px]" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
        {region.zones.length} zone{region.zones.length === 1 ? '' : 's'} · {region.clusterCount}{' '}
        cluster{region.clusterCount === 1 ? '' : 's'} · {region.rackCount} rack
        {region.rackCount === 1 ? '' : 's'} · {region.util.totalNodes.toLocaleString()} nodes
      </div>

      {/* Headline utilization. */}
      <div className="flex items-end gap-5" style={{ marginTop: 14, marginBottom: 12 }}>
        <div>
          <div
            className="font-semibold leading-none"
            style={{ fontSize: 30, letterSpacing: '-0.025em', color: utilTone(mem) }}
          >
            {Math.round(mem)}%
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            memory utilized
          </div>
        </div>
        <div style={{ paddingBottom: 2 }}>
          <MiniUtil label="cpu" pct={cpu} />
          <div className="text-[10px]" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {region.util.occupiedNodes.toLocaleString()}/{region.util.totalNodes.toLocaleString()}{' '}
            nodes occupied
          </div>
        </div>
      </div>

      {/* Per-zone breakdown. */}
      <div className="flex flex-col" style={{ gap: 6 }}>
        {region.zones.map((z) => {
          const zMem = memPct(z.util);
          return (
            <div key={z.zone} className="flex items-center gap-2">
              <span
                className="text-[10.5px] flex-shrink-0"
                style={{ color: 'var(--text-secondary)', minWidth: 64 }}
              >
                ◈ {z.label}
              </span>
              <span
                className="relative flex-1"
                style={{
                  height: 6,
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
                    width: `${Math.min(100, zMem)}%`,
                    background: utilTone(zMem),
                    borderRadius: 'var(--radius-pill)',
                  }}
                />
              </span>
              <span
                className="text-[10px] font-mono flex-shrink-0"
                style={{ color: utilTone(zMem), minWidth: 30, textAlign: 'right' }}
              >
                {Math.round(zMem)}%
              </span>
              <span
                className="text-[10px] font-mono flex-shrink-0"
                style={{ color: 'var(--text-muted)', minWidth: 70, textAlign: 'right' }}
              >
                {z.clusters.length} cl · {z.util.totalNodes} n
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

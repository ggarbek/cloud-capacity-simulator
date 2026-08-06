/**
 * Live-rates status card (v2.25.5).
 *
 * The dashboard's default catalog IS the live data now — real specs + network
 * + per-region pricing for every cloud, region, and size, baked into the build
 * from the ingested shards (`src/data/liveCatalog.ts`) and refreshed weekly by
 * `.github/workflows/refresh-rates.yml`. So this panel is no longer a per-region
 * loader; it's a freshness indicator: what the rates are current as of, and when
 * they next refresh. No fetch, no "Load" — it's already fresh everywhere.
 */
import { useMemo } from 'react';
import { LIVE_CATALOG_AS_OF } from '../data/liveCatalog';

/** "Jun 19, 2026" in UTC. */
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Next Monday 07:00 UTC — the auto-refresh cron in refresh-rates.yml. */
function nextMondayRefresh(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0, 0));
  const daysToMonday = (1 - d.getUTCDay() + 7) % 7;
  if (daysToMonday === 0 && now.getTime() >= d.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCDate(d.getUTCDate() + daysToMonday);
  return d;
}
function fmtRefreshTarget(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function LiveRatesPanel() {
  const nextRefresh = useMemo(() => fmtRefreshTarget(nextMondayRefresh(new Date())), []);
  if (!LIVE_CATALOG_AS_OF) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: 14,
      }}
    >
      <div className="section-h flex items-center" style={{ marginBottom: 2, gap: 8 }}>
        <span>Live rates</span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--status-good)',
            background: 'color-mix(in srgb, var(--status-good) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--status-good) 40%, transparent)',
            borderRadius: 'var(--radius-pill)',
            padding: '1px 7px',
          }}
        >
          ● ALL REGIONS LIVE
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
        Every cloud, region, and size in the catalog below carries real specs + network + pricing,
        baked into this build from the ingested cloud data — no per-region loading needed.
      </div>

      <div
        className="flex items-center"
        style={{
          gap: 14,
          flexWrap: 'wrap',
          padding: '8px 12px',
          background: 'var(--tint-soft)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 11,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-dim)' }}>Rates current as of</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtDate(LIVE_CATALOG_AS_OF)}</span>
        </span>
        <span aria-hidden="true" style={{ color: 'var(--border)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-dim)' }}>Next refresh</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{nextRefresh}, 07:00 UTC</span>
          <span style={{ color: 'var(--text-dim)' }}>· weekly with the deploy</span>
        </span>
      </div>
    </div>
  );
}

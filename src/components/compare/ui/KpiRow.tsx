/**
 * KpiRow — S66 shared KPI tile strip. ONE tile grammar for every KPI hero on
 * the CMA pages (Exec Summary comparison AND BoM modes; any future strip).
 * Generalizes S65's ExecBriefKpis.Tile / ExecSummaryBom KPI hero, which had
 * diverged in font sizes, chip styles and sub-line handling.
 *
 * Tile anatomy: muted 9px label → 20px bold value (tone-colored) → optional
 * provider chip OR per-cloud minis OR muted sub-line. Values are pre-formatted
 * strings — formatting lives in ui/tokens (fmtUsd/fmtPct), not here.
 *
 * FROZEN during the S66 waves — wave agents consume, never edit.
 */

export interface KpiTileSpec {
  /** Stable key; defaults to label. */
  key?: string;
  label: string;
  value: string;
  tone?: 'good' | 'neutral' | 'warn';
  /** Muted one-liner under the value (suppressed when minis are present). */
  sub?: string;
  /** Single accent chip under the value (e.g. "AWS · 3y RI"). */
  chip?: { text: string; fg: string };
  /** Per-cloud mini figures (e.g. "Azure 27 · AWS 29 · GCP 40"). */
  minis?: { text: string; fg: string }[];
}

export function KpiRow({ tiles, minTile = 150 }: { tiles: KpiTileSpec[]; minTile?: number }) {
  if (tiles.length === 0) return null;
  return (
    <section
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minTile}px, 1fr))` }}
    >
      {tiles.map((t) => (
        <KpiTile key={t.key ?? t.label} {...t} />
      ))}
    </section>
  );
}

function KpiTile({ label, value, sub, tone = 'neutral', chip, minis }: KpiTileSpec) {
  const valueColor =
    tone === 'good'
      ? 'var(--interactive)'
      : tone === 'warn'
        ? 'var(--accent-amber)'
        : 'var(--text-primary)';
  return (
    <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)', minWidth: 0 }}>
      <div
        className="text-[9px] tracking-[0.04em] font-semibold"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div
        className="font-bold mt-1.5 leading-none truncate"
        style={{ fontSize: 20, color: valueColor, letterSpacing: '-0.01em' }}
        title={value}
      >
        {value}
      </div>
      {chip && (
        <div className="mt-1.5">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: chip.fg,
              border: '1px solid var(--border)',
            }}
          >
            {chip.text}
          </span>
        </div>
      )}
      {minis && minis.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {minis.map((m) => (
            <span
              key={m.text}
              className="text-[9px] font-semibold tabular-nums"
              style={{ color: m.fg }}
            >
              {m.text}
            </span>
          ))}
        </div>
      )}
      {sub && !minis && (
        <div
          className="text-[10px] mt-1.5 leading-snug"
          style={{ color: 'var(--text-muted)' }}
          title={sub}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

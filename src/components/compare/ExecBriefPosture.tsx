/**
 * ExecBriefPosture — the market-posture strip (S65 EXEC). One line + per-
 * competitor chips summarizing where each rival serves metros the base cloud
 * doesn't: "AWS serves 8 metros Azure doesn't (e.g. Cape Town, Milan); GCP
 * serves 4." Sourced from the shared `buildMarketGapReport` selector so the
 * number matches the KPI tile and the Region page exactly. Links to Region
 * Availability for the full map.
 */
import type { MarketGapReport, GapProvider } from '../../utils/marketGaps';
import { providerTone } from './ui/tokens'; // S66-EXEC

function providerFg(p: string): string {
  return providerTone(p).fg;
}

/** Distinct example metro names for a competitor's gap list (up to `n`). */
function exampleMetros(report: MarketGapReport, competitor: GapProvider, n: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const loc of report.competitorGap[competitor] ?? []) {
    const label = loc.city || loc.region;
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
    if (out.length >= n) break;
  }
  return out;
}

export function ExecBriefPosture({
  report,
  onGoToRegion,
}: {
  report: MarketGapReport;
  onGoToRegion: () => void;
}) {
  const base = report.base;

  // S65 — count distinct gap METROS per rival straight from the report's
  // metro-deduped counts, so the chip number, the footer total and the KPI tile
  // all use the identical unit (a rival's two regions in one metro count once).
  const rivalCount = (c: GapProvider): number => report.baseGapMetros.perCompetitor[c] ?? 0;
  const rivals = report.competitors.filter((c) => rivalCount(c) > 0);

  return (
    <section className="space-y-2">
      <h2 className="section-h">Market posture</h2>
      {rivals.length === 0 ? (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          In the current scope, no competitor serves a metro that{' '}
          <strong style={{ color: providerFg(base) }}>{base}</strong> doesn’t. See{' '}
          <button
            type="button"
            onClick={onGoToRegion}
            className="underline underline-offset-2 font-semibold"
            style={{ color: 'var(--interactive)' }}
          >
            Region availability
          </button>{' '}
          for the full footprint.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {rivals.map((c) => {
              const n = rivalCount(c);
              const egs = exampleMetros(report, c, 2);
              return (
                <span
                  key={c}
                  className="inline-flex items-center gap-x-2 px-2.5 py-1 rounded-full text-[11px]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${providerFg(c)}55`,
                  }}
                  title={egs.length ? `e.g. ${egs.join(', ')}` : undefined}
                >
                  <strong style={{ color: providerFg(c) }}>{c}</strong>
                  <span style={{ color: 'var(--text-primary)' }} className="tabular-nums">
                    {n} metro{n === 1 ? '' : 's'} {base} lacks
                  </span>
                  {egs.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>· {egs.join(', ')}</span>
                  )}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {report.baseGapCounted} competitor-only metro{report.baseGapCounted === 1 ? '' : 's'},
            market-wide (all sizes). Drill the size-scoped view on{' '}
            <button
              type="button"
              onClick={onGoToRegion}
              className="underline underline-offset-2 font-semibold"
              style={{ color: 'var(--interactive)' }}
            >
              Region availability
            </button>
            .
          </p>
        </>
      )}
    </section>
  );
}

/**
 * ExecBriefKpis — the exec brief's KPI strip (S65 EXEC, migrated onto the shared
 * KpiRow in S66). Five tiles: Cheapest option, Savings vs base, Avg spec match,
 * Regions covered (with per-cloud minis), and Market gaps. Each value is a fact
 * the reader can act on in <5s; situational tags (never a crown) name the winner.
 */
import type { HorizonCost } from '../../engine/competitive';
import { computeVerdict, type BriefTerm } from './execBriefMath';
import { KpiRow, type KpiTileSpec } from './ui/KpiRow';
import { providerTone, fmtUsd, fmtPct, termLabelShort } from './ui/tokens';

export interface PerCloudRegions {
  provider: string;
  regions: number;
}

export function ExecBriefKpis({
  horizons,
  baseProvider,
  avgMatchPct,
  perProviderRegions,
  totalRegions,
  marketGaps,
  term,
}: {
  horizons: HorizonCost[];
  baseProvider: string;
  avgMatchPct: number | null;
  perProviderRegions: PerCloudRegions[];
  totalRegions: number;
  marketGaps: number;
  term: BriefTerm;
}) {
  const v = computeVerdict(horizons, baseProvider);
  const hasSaving = v.savingMonthly != null && v.savingMonthly > 0;

  const tiles: KpiTileSpec[] = [
    // Cheapest option at the active term.
    {
      label: 'Cheapest option',
      value: v.cheapestMonthly != null ? `${fmtUsd(v.cheapestMonthly)}/mo` : '—',
      tone: 'good',
      chip: v.cheapestProvider
        ? {
            text: `${v.cheapestProvider} · ${termLabelShort(term)}`,
            fg: providerTone(v.cheapestProvider).fg,
          }
        : undefined,
      sub: v.cheapestProvider ? undefined : 'No priced clouds',
    },
    // Savings vs base ($ + %).
    {
      label: `Savings vs ${baseProvider}`,
      value: hasSaving
        ? `${fmtUsd(v.savingMonthly)}/mo`
        : v.baseIsCheapest
          ? 'Base is cheapest'
          : '—',
      tone: hasSaving ? 'good' : 'neutral',
      // S66-FIX-C — whole-% at render, matching the verdict band + Pricing.
      sub: hasSaving
        ? `${v.savingPct != null ? Math.round(v.savingPct) : '—'}% below your baseline`
        : v.baseMonthly != null
          ? 'No cheaper cross-cloud move'
          : 'Base unpriced',
    },
    // Avg spec match.
    {
      label: 'Avg spec match',
      value: fmtPct(avgMatchPct),
      tone:
        avgMatchPct == null
          ? 'neutral'
          : avgMatchPct >= 85
            ? 'good'
            : avgMatchPct >= 65
              ? 'neutral'
              : 'warn',
      sub: `vs ${baseProvider} baseline`,
    },
    // Regions covered with per-cloud minis.
    {
      label: 'Regions covered',
      value: String(totalRegions),
      tone: 'neutral',
      minis: perProviderRegions.map((p) => ({
        text: `${p.provider} ${p.regions}`,
        fg: providerTone(p.provider).fg,
      })),
    },
    // Market gaps — competitor-exclusive metros the base doesn't serve. This
    // is the MARKET-WIDE footprint (all sizes), distinct from the Region
    // Availability tile which is scoped to the picked VM chips — the sub-label
    // says so, so a reader never mistakes the two numbers for the same thing.
    {
      label: `${baseProvider} market gaps`,
      value: String(marketGaps),
      tone: marketGaps > 0 ? 'warn' : 'neutral',
      sub:
        marketGaps > 0
          ? 'metros a rival serves, you don’t · market-wide, all sizes'
          : 'no competitor-only metros · market-wide, all sizes',
    },
  ];

  return <KpiRow tiles={tiles} />;
}

/**
 * ExecBriefVerdict — the dollar-quantified headline for the VM-sizes exec brief
 * (S65 EXEC, migrated onto the shared VerdictBand in S66). One money sentence
 * ("Over 12 months at 1-year reserved, AWS r7i.2xlarge is the least-cost
 * equivalent: $X/mo — $Y/mo (NN%) below your Azure E8s_v5 baseline") plus one
 * supporting line (spec-parity phrase, or the honest stretch caveat).
 *
 * All numbers come from the pure `computeVerdict` selector so the headline and
 * the cost visual below it price the SAME term-matched rows. When a cloud is the
 * cheapest OR nothing is priced, the copy degrades gracefully instead of showing
 * a fabricated saving; an unpriced base renders the amber ('warn') band.
 */
import type { HorizonCost } from '../../engine/competitive';
import type { MatchCaveat } from '../../utils/matchCaveats';
import {
  computeVerdict,
  verdictParity,
  termLabel,
  type BriefTerm,
} from './execBriefMath';
import { VerdictBand } from './ui/VerdictBand';
import { providerTone, fmtUsd, termLabelShort } from './ui/tokens';

// ── S66-FIX-C — the ONE four-shape money headline ───────────────────────────
// Comparison mode (ExecBriefVerdict) and VM-BoM mode (ExecSummaryBom) used to
// hand-build near-identical verdict sentences; the scaffolding (shape choice,
// tone, provider-toned strongs, $ formatting, whole-% savings) now lives HERE
// once, with the mode's verbs ("least-cost equivalent" vs "porting your BoM")
// as the only branch.

export interface MoneyHeadlineInput {
  /** 'sku' = comparison mode (single SKU) · 'bom' = whole-BoM mode. */
  mode: 'sku' | 'bom';
  term: BriefTerm;
  baseProvider: string;
  /** The base noun after the provider: the SKU in sku mode ("E8s_v5"), the
   *  BoM phrase in bom mode ("3-line BoM"). */
  baseNoun: string;
  cheapestProvider: string | null;
  /** The winning SKU (sku mode only — bom mode names the provider alone). */
  cheapestSku: string | null;
  cheapestMonthly: number | null;
  baseMonthly: number | null;
  /** Pass null for both savings when the saving must not be claimed (e.g.
   *  FIX-A's `savingsSuppressed`) — the win shape then omits the segment. */
  savingMonthly: number | null;
  savingPct: number | null;
  baseUnpriced: boolean;
  /** True when the base itself wins (or nothing beats it at this term). */
  baseWins: boolean;
}

/** The four-shape money headline + its band tone. Accuracy-first: no shape ever
 *  fabricates a number — unpriced sides degrade to the honest sentence. */
export function buildMoneyHeadline(v: MoneyHeadlineInput): {
  headline: React.ReactNode;
  tone: 'action' | 'warn' | 'neutral';
} {
  const base = (
    <strong style={{ color: providerTone(v.baseProvider).fg }}>
      {v.baseProvider} {v.baseNoun}
    </strong>
  );
  const baseCloud = (
    <strong style={{ color: providerTone(v.baseProvider).fg }}>{v.baseProvider}</strong>
  );
  const cheap = v.cheapestProvider ? (
    <strong style={{ color: providerTone(v.cheapestProvider).fg }}>
      {v.cheapestProvider}
      {v.mode === 'sku' && v.cheapestSku ? ` ${v.cheapestSku}` : ''}
    </strong>
  ) : null;
  // Whole-% at render (belt-and-suspenders over the core's rounding).
  const savings =
    v.savingMonthly != null ? (
      <>
        {' '}
        —{' '}
        <strong style={{ color: 'var(--interactive)' }}>
          {fmtUsd(v.savingMonthly)}/mo
          {v.savingPct != null ? ` (${Math.round(v.savingPct)}%)` : ''}
        </strong>{' '}
        below your {v.mode === 'bom' ? baseCloud : base} baseline
      </>
    ) : null;

  // Shape 1 — nothing priced at all.
  if (v.cheapestProvider == null) {
    return {
      tone: 'neutral',
      headline:
        v.mode === 'bom' ? (
          <>No priced lines in your {base} yet — add rate data or widen the cloud scope.</>
        ) : (
          <>
            No priced cross-cloud equivalent resolved for {base} yet — add rate data or widen
            the cloud scope.
          </>
        ),
    };
  }
  // Shape 2 — a rival is priced but the base isn't (honest amber, never a win).
  if (v.baseUnpriced) {
    return {
      tone: 'warn',
      headline:
        v.mode === 'bom' ? (
          <>
            No published rates price your {base} at {termLabel(v.term)} — the cheapest priced
            port is {cheap} at <strong>{fmtUsd(v.cheapestMonthly)}/mo</strong>.
          </>
        ) : (
          <>
            No published rate for {base} at {termLabel(v.term)} — the cheapest priced option
            is {cheap} at <strong>{fmtUsd(v.cheapestMonthly)}/mo</strong>.
          </>
        ),
    };
  }
  // Shape 3 — the base itself wins at this term.
  if (v.baseWins) {
    const amount = <strong>{fmtUsd(v.baseMonthly ?? v.cheapestMonthly)}/mo</strong>;
    return {
      tone: 'action',
      headline:
        v.mode === 'bom' ? (
          <>
            Over 12 months at {termLabel(v.term)}, keeping your {v.baseNoun} on {baseCloud} is
            already the least-cost home at {amount} — no cross-cloud port lowers spend at this
            term.
          </>
        ) : (
          <>
            Over 12 months at {termLabel(v.term)}, {base} is already the least-cost option at{' '}
            {amount} — no cross-cloud move lowers spend at this term.
          </>
        ),
    };
  }
  // Shape 4 — a cross-cloud move wins (savings segment only when claimable).
  return {
    tone: 'action',
    headline:
      v.mode === 'bom' ? (
        <>
          Over 12 months at {termLabel(v.term)}, porting your {v.baseNoun} to {cheap} costs{' '}
          <strong>{fmtUsd(v.cheapestMonthly)}/mo</strong>
          {savings}.
        </>
      ) : (
        <>
          Over 12 months at {termLabel(v.term)}, {cheap} is the least-cost equivalent:{' '}
          <strong>{fmtUsd(v.cheapestMonthly)}/mo</strong>
          {savings}.
        </>
      ),
  };
}

export function ExecBriefVerdict({
  horizons,
  baseProvider,
  baseSku,
  avgMatchPct,
  caveatsByProvider,
  term,
}: {
  horizons: HorizonCost[];
  baseProvider: string;
  baseSku: string;
  avgMatchPct: number | null;
  caveatsByProvider: Partial<Record<string, MatchCaveat[]>>;
  term: BriefTerm;
}) {
  const v = computeVerdict(horizons, baseProvider);
  const parity = verdictParity(v, baseProvider, caveatsByProvider);

  // Headline: the money line — the ONE shared four-shape builder (also consumed
  // by ExecSummaryBom), so both modes phrase the answer identically.
  const { headline, tone } = buildMoneyHeadline({
    mode: 'sku',
    term,
    baseProvider,
    baseNoun: baseSku,
    cheapestProvider: v.cheapestProvider,
    cheapestSku: v.cheapestSku,
    cheapestMonthly: v.cheapestMonthly,
    baseMonthly: v.baseMonthly,
    savingMonthly: v.savingMonthly,
    savingPct: v.savingPct,
    baseUnpriced: v.baseUnpriced,
    baseWins: parity === 'base' || v.savingMonthly == null || v.savingMonthly <= 0,
  });

  // Supporting line: spec-parity phrase (clean) or the honest stretch caveat.
  const support =
    parity === 'stretch' ? (
      <span style={{ color: 'var(--accent-amber)' }}>
        Closest available alternative — not a true equivalent. Validate the spec gaps
        below before committing.
      </span>
    ) : avgMatchPct != null ? (
      <span style={{ color: 'var(--text-secondary)' }}>
        Near-parity specs — {Math.round(avgMatchPct)}% average match across the compared
        clouds.
      </span>
    ) : (
      <span style={{ color: 'var(--text-secondary)' }}>
        Spec comparison below; commitment savings priced at {termLabel(term)}.
      </span>
    );

  return (
    <VerdictBand
      tone={tone}
      eyebrow={`Cost verdict · ${termLabelShort(term)}`}
      headline={headline}
      support={support}
    />
  );
}

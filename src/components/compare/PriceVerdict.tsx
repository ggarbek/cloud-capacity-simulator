/**
 * PriceVerdict (S65 → S66) — the dollar-quantified verdict that leads the
 * Pricing page. The page used to open with RATE snapshots and make the reader
 * do the arithmetic; this band answers the actual question up front: "at the
 * selected commitment term, which equivalent is the least-cost, and by how much
 * (absolute $ + %) does it beat the base cloud?" A support line surfaces the
 * commitment lever — how much the base cloud saves by reserving 3 years vs PAYG
 * over a year.
 *
 * S66: both verdicts render through the shared `VerdictBand` primitive (the ONE
 * answer grammar for every CMA page in both modes) and the shared ui/tokens
 * formatters — the private PROVIDER_FG / fmtMoney / TERM_LABEL / AmberChip
 * copies are gone. Two bands live here:
 *   — `PriceVerdict` (Comparison mode): the tested `priceVerdict` model.
 *   — `BomPriceVerdict` (VM-BoM mode, NEW): the tested `bomPriceVerdict` model —
 *     "porting your N-line BoM to X costs $Y/mo — $Z (NN%) below base", with
 *     honest flags when any cloud's total excludes unmatched lines.
 *
 * Pure presentation: models come from chartMath (tested). Null-safe — with no
 * priced rates each band renders a quiet "no rates" state rather than
 * fabricating a number, and no base delta is shown when the base total is
 * undercounted by unmatched lines.
 *
 * Owned by item PRICING.
 */
import type { BomPriceVerdictModel, PriceVerdictModel } from './charts/chartMath';
import { VerdictBand } from './ui/VerdictBand';
import { fmtUsd, providerTone, termLabelLong } from './ui/tokens';

const SAVE_FG = '#6EE7B7';

function fg(provider: string): string {
  return providerTone(provider).fg;
}

export function PriceVerdict({
  model,
  term,
  baseProvider,
  baseSku,
}: {
  model: PriceVerdictModel;
  term: 'payg' | '1y' | '3y';
  baseProvider: string;
  baseSku: string;
}) {
  const termLabel = termLabelLong(term);
  const eyebrow = `Cost verdict · ${termLabel}`;

  // No priced rates at all — quiet, honest empty state (same band slot).
  if (!model.cheapest) {
    return (
      <VerdictBand
        tone="neutral"
        eyebrow={eyebrow}
        headline={<>No comparable rates for these SKUs at {termLabel}.</>}
        support={
          <>
            Upload PAYG / 1y / 3y RI rates via the VM Library tab to see the cost
            verdict.
          </>
        }
      />
    );
  }

  const { cheapest } = model;
  const baseIsCheapest = cheapest.provider === baseProvider;

  const headline = baseIsCheapest ? (
    <>
      At <strong>{termLabel}</strong>,{' '}
      <strong style={{ color: fg(cheapest.provider) }}>
        {cheapest.provider} {cheapest.sku}
      </strong>{' '}
      is already the least-cost equivalent —{' '}
      <strong>{fmtUsd(cheapest.monthlyUsd)}/mo</strong> ({cheapest.term}). No cheaper
      cross-cloud analog in this comparison.
    </>
  ) : (
    <>
      At <strong>{termLabel}</strong>,{' '}
      <strong style={{ color: fg(cheapest.provider) }}>
        {cheapest.provider} {cheapest.sku}
      </strong>{' '}
      is the least-cost equivalent: <strong>{fmtUsd(cheapest.monthlyUsd)}/mo</strong>
      {model.savingsUsd != null && model.savingsPct != null ? (
        <>
          {' '}
          —{' '}
          <strong style={{ color: SAVE_FG }}>
            {fmtUsd(model.savingsUsd)} ({model.savingsPct.toFixed(0)}%)
          </strong>{' '}
          below{' '}
          <strong style={{ color: fg(baseProvider) }}>
            {baseProvider} {baseSku}
          </strong>
          .
        </>
      ) : (
        '.'
      )}
    </>
  );

  // Commitment lever — only when the base has both a PAYG and 3y rate.
  const support =
    model.commitSavingsUsd != null ? (
      <>
        Committing <strong>3-yr</strong> on{' '}
        <strong style={{ color: fg(baseProvider) }}>{baseProvider}</strong> saves{' '}
        <strong style={{ color: SAVE_FG }}>{fmtUsd(model.commitSavingsUsd)}</strong> over
        12 months vs pay-as-you-go.
      </>
    ) : undefined;

  const chips: { label: string; detail?: string }[] = [];
  if (model.anyEstimated) {
    chips.push({
      label: 'includes estimated rates',
      detail: 'Some reserved rates are derived from PAYG, not vendor-published.',
    });
  }
  if (model.anyStretch) {
    chips.push({
      label: 'closest alternative — not a true equivalent',
      detail: 'At least one compared SKU is a stretch match, not a true peer.',
    });
  }

  const dataStrip =
    model.baseMonthlyUsd != null && !baseIsCheapest
      ? [
          {
            label: `${baseProvider} ${baseSku}`,
            value: `${fmtUsd(model.baseMonthlyUsd)}/mo`,
            fg: fg(baseProvider),
          },
          {
            label: `${cheapest.provider} ${cheapest.sku}`,
            value: `${fmtUsd(cheapest.monthlyUsd)}/mo`,
            fg: fg(cheapest.provider),
          },
        ]
      : undefined;

  return (
    <VerdictBand
      eyebrow={eyebrow}
      headline={headline}
      support={support}
      dataStrip={dataStrip}
      chips={chips.length > 0 ? chips : undefined}
    />
  );
}

/**
 * BomPriceVerdict (S66-PRICING) — the whole-BoM cost verdict for VM-BoM mode.
 * Same VerdictBand slot + grammar as the comparison verdict; the data is the
 * ported BoM's per-cloud monthly totals (straight from `bomPortResult` — never
 * re-priced here).
 */
export function BomPriceVerdict({ model }: { model: BomPriceVerdictModel }) {
  const termLabel = termLabelLong(model.term);
  const eyebrow = `BoM cost verdict · ${termLabel}`;
  const lineNoun = `${model.lineCount}-line BoM`;

  // Nothing priced on any cloud — honest empty state, same band slot.
  if (!model.cheapest) {
    return (
      <VerdictBand
        tone="neutral"
        eyebrow={eyebrow}
        headline={<>No priced BoM lines at {termLabel}.</>}
        support={
          <>
            Commit VM demand with resolvable rates (VM Library tab) to see which
            cloud runs this BoM cheapest.
          </>
        }
      />
    );
  }

  const { cheapest } = model;
  const baseIsCheapest = cheapest.provider === model.baseProvider;
  // S66 FIX-A — suppression comes from the shared verdict core (which also
  // catches matched-but-UNPRICED lines, not just unmatched ones): no "$ below
  // base" / "least-cost" delta is claimed off an undercounted total.
  const deltaSuppressed = model.savingsSuppressed;
  const baseExcluded =
    model.exclusions.find((e) => e.provider === model.baseProvider)?.lines ?? 0;
  const cheapestExcluded =
    model.exclusions.find((e) => e.provider === cheapest.provider)?.lines ?? 0;

  const headline = baseIsCheapest ? (
    <>
      Your <strong>{lineNoun}</strong> is least-cost on{' '}
      <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong> —{' '}
      <strong>{fmtUsd(cheapest.monthlyUsd)}/mo</strong> at {termLabel}.{' '}
      {deltaSuppressed
        ? 'Totals are not fully comparable — see the excluded lines below.'
        : 'No cheaper cross-cloud port in this comparison.'}
    </>
  ) : (
    <>
      Porting your <strong>{lineNoun}</strong> to{' '}
      <strong style={{ color: fg(cheapest.provider) }}>{cheapest.provider}</strong> costs{' '}
      <strong>{fmtUsd(cheapest.monthlyUsd)}/mo</strong> at {termLabel}
      {model.savingsUsd != null && model.savingsPct != null ? (
        <>
          {' '}
          —{' '}
          <strong style={{ color: SAVE_FG }}>
            {fmtUsd(model.savingsUsd)} ({model.savingsPct.toFixed(0)}%)
          </strong>{' '}
          below{' '}
          <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong>.
        </>
      ) : (
        '.'
      )}
    </>
  );

  // Suppression support line — worded by the machine-readable reason.
  const support = deltaSuppressed ? (
    model.suppressReason === 'cheapest-partially-priced' ? (
      <>
        {cheapestExcluded} of the {model.lineCount} lines {cheapestExcluded === 1 ? 'is' : 'are'}{' '}
        missing from{' '}
        <strong style={{ color: fg(cheapest.provider) }}>{cheapest.provider}</strong>
        &rsquo;s total, so it is undercounted — no savings vs{' '}
        <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong> is
        claimed.
      </>
    ) : model.suppressReason === 'base-unpriced' ? (
      <>
        No{' '}
        <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong> line
        priced at {termLabel}, so there is no base total to compare against.
      </>
    ) : (
      <>
        {baseExcluded} of your {model.lineCount} lines didn&rsquo;t price on{' '}
        <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong>, so
        its total is undercounted — no &ldquo;below base&rdquo; delta is claimed.
      </>
    )
  ) : model.baseMonthlyUsd != null && !baseIsCheapest ? (
    <>
      <strong style={{ color: fg(model.baseProvider) }}>{model.baseProvider}</strong> runs
      the same BoM at <strong>{fmtUsd(model.baseMonthlyUsd)}/mo</strong>.
    </>
  ) : undefined;

  // One chip per exclusion CLASS per cloud — "no analog" (unmatched) and
  // "unpriced" (matched, no resolvable rate) are different failures and get
  // different words on every cloud, base included.
  const chips: { label: string; detail?: string }[] = [];
  for (const e of model.exclusions) {
    if (e.unmatched > 0) {
      chips.push({
        label: `${e.unmatched} line${e.unmatched === 1 ? ' has' : 's have'} no analog on ${e.provider}`,
        detail: `${e.unmatched} BoM line${e.unmatched === 1 ? ' has' : 's have'} no equivalent on ${e.provider} — excluded from its total.`,
      });
    }
    if (e.unpriced > 0) {
      chips.push({
        label: `${e.unpriced} line${e.unpriced === 1 ? '' : 's'} unpriced on ${e.provider}`,
        detail: `${e.unpriced} BoM line${e.unpriced === 1 ? '' : 's'} did not resolve to a priced ${e.provider} SKU — excluded from its total.`,
      });
    }
  }
  if (model.anyEstimated) {
    chips.push({
      label: 'includes estimated rates',
      detail: 'Some reserved rates are derived from PAYG, not vendor-published.',
    });
  }

  return (
    <VerdictBand
      tone={deltaSuppressed ? 'warn' : 'action'}
      eyebrow={eyebrow}
      headline={headline}
      support={support}
      chips={chips.length > 0 ? chips : undefined}
    />
  );
}

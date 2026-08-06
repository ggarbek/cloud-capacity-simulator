/**
 * S66 — shared answer-grammar token tests. These pin the ONE money/percent/
 * term formatting every CMA surface (screen + export copy sourced from screen
 * models) must agree on. If a surface needs different formatting, that's a
 * product decision to take to the doctrine, not a local fmt copy.
 */
import { describe, it, expect } from 'vitest';
import {
  fmtUsd,
  fmtUsdFull,
  fmtPct,
  articleFor,
  providerTone,
  pctTone,
  termLabelLong,
  termLabelShort,
} from './tokens';

describe('fmtUsdFull', () => {
  it('keeps near-tied values distinguishable (exact comma-grouped dollars)', () => {
    expect(fmtUsdFull(12100)).toBe('$12,100');
    expect(fmtUsdFull(12400)).toBe('$12,400');
    expect(fmtUsdFull(82.78)).toBe('$82.78');
    expect(fmtUsdFull(null)).toBe('—');
  });
});

describe('articleFor', () => {
  it('an AWS / an Azure / a GCP', () => {
    expect(articleFor('AWS')).toBe('an');
    expect(articleFor('Azure')).toBe('an');
    expect(articleFor('GCP')).toBe('a');
  });
});

describe('fmtUsd', () => {
  it('never fabricates — null/NaN render an em-dash', () => {
    expect(fmtUsd(null)).toBe('—');
    expect(fmtUsd(undefined)).toBe('—');
    expect(fmtUsd(Number.NaN)).toBe('—');
  });
  it('keeps cents on rate-scale values (under $100)', () => {
    expect(fmtUsd(82.78)).toBe('$82.78');
    expect(fmtUsd(33.14)).toBe('$33.14');
    expect(fmtUsd(0)).toBe('$0.00');
  });
  it('whole dollars from $100, k from $1k, coarser k from $10k, M from $1M', () => {
    expect(fmtUsd(101.4)).toBe('$101');
    expect(fmtUsd(1234)).toBe('$1.2k');
    expect(fmtUsd(12345)).toBe('$12k');
    expect(fmtUsd(2_500_000)).toBe('$2.50M');
  });
  it('negative values carry the minus through the same scale rules', () => {
    expect(fmtUsd(-1234)).toBe('−$1.2k');
  });
});

describe('fmtPct', () => {
  it('rounds to whole percent and dashes null', () => {
    expect(fmtPct(88.6)).toBe('89%');
    expect(fmtPct(null)).toBe('—');
  });
});

describe('providerTone / pctTone', () => {
  it('unknown providers fall back to the neutral tone, never throw', () => {
    expect(providerTone('Azure').fg).toBe('#93C5FD');
    expect(providerTone('SomethingElse').fg).toBe('var(--interactive)');
    expect(providerTone(null).fg).toBe('var(--interactive)');
  });
  it('match tone bands: ≥85 green, ≥65 amber, else red', () => {
    expect(pctTone(90)).toBe('#34D399');
    expect(pctTone(70)).toBe('#FBBF24');
    expect(pctTone(40)).toBe('#F87171');
  });
});

describe('term labels', () => {
  it('long + short forms agree on the three terms', () => {
    expect(termLabelLong('payg')).toBe('pay-as-you-go');
    expect(termLabelLong('3y')).toBe('3-year reserved');
    expect(termLabelShort('payg')).toBe('PAYG');
    expect(termLabelShort('1y')).toBe('1y RI');
  });
});

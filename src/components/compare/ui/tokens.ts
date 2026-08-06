/**
 * compare/ui/tokens — S66 shared answer-grammar tokens.
 *
 * ONE source for the provider color tones, match-% tones, money/percent
 * formatters and commitment-term labels used by every CMA page surface
 * (Exec Summary / Specs / Pricing) in BOTH Comparison and VM-BoM modes.
 *
 * Why: S65 shipped 5–7 private copies of these (PROVIDER_FG maps, fmtUsd /
 * fmtMoney variants, TERM_LABEL maps) and the drift between them is exactly
 * the "inconsistent formatting" the user flagged. New code imports from here;
 * existing copies migrate here as their owning surface is touched.
 *
 * FROZEN during the S66 waves — wave agents consume, never edit.
 */

export interface ProviderToneSpec {
  fg: string;
  bg: string;
  border: string;
}

const PROVIDER_TONE: Record<string, ProviderToneSpec> = {
  Azure: {
    fg: '#93C5FD',
    bg: 'rgba(96, 165, 250, 0.10)',
    border: 'rgba(96, 165, 250, 0.30)',
  },
  AWS: {
    fg: '#FCD34D',
    bg: 'rgba(251, 191, 36, 0.10)',
    border: 'rgba(251, 191, 36, 0.30)',
  },
  GCP: {
    fg: '#FCA5A5',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.30)',
  },
  Custom: {
    fg: 'var(--interactive)',
    bg: 'rgba(129, 140, 248, 0.10)',
    border: 'var(--border-glow)',
  },
};

/** Canonical provider tone (fg/bg/border). Unknown providers fall back to the
 *  neutral interactive tone — never throw. */
export function providerTone(p: string | null | undefined): ProviderToneSpec {
  return PROVIDER_TONE[p ?? ''] ?? PROVIDER_TONE.Custom;
}

/** Match-% traffic tone shared by every match pill: ≥85 green, ≥65 amber, red. */
export function pctTone(pct: number): string {
  return pct >= 85 ? '#34D399' : pct >= 65 ? '#FBBF24' : '#F87171';
}

/**
 * Canonical money formatter for verdict/KPI surfaces.
 * — null/NaN → em-dash (never fabricate)
 * — ≥$1M → $1.23M · ≥$10k → $12k · ≥$1k → $1.2k
 * — ≥$100 → whole dollars · under $100 → cents (rate-scale values need them)
 */
export function fmtUsd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const neg = v < 0;
  const a = Math.abs(v);
  const s =
    a >= 1e6
      ? `$${(a / 1e6).toFixed(2)}M`
      : a >= 1e4
        ? `$${(a / 1e3).toFixed(0)}k`
        : a >= 1e3
          ? `$${(a / 1e3).toFixed(1)}k`
          : a >= 100
            ? `$${a.toFixed(0)}`
            : `$${a.toFixed(2)}`;
  return neg ? `−${s}` : s;
}

/**
 * Exact money formatter — comma-grouped whole dollars (cents under $100).
 * For surfaces where two near-tied values must stay distinguishable (cost
 * tables, export verdict sentences): $12,100 vs $12,400 — never both "$12k".
 */
export function fmtUsdFull(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const neg = v < 0;
  const a = Math.abs(v);
  const s = a >= 100 ? `$${Math.round(a).toLocaleString('en-US')}` : `$${a.toFixed(2)}`;
  return neg ? `−${s}` : s;
}

/** Indefinite article for a provider/word: "an AWS", "an Azure", "a GCP". */
export function articleFor(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
}

/** Whole-percent formatter: 12.4 → "12%". null → em-dash. */
export function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${Math.round(v)}%`;
}

export type UiTerm = 'payg' | '1y' | '3y';

/** Long prose form — verdict sentences ("at 3-year reserved, …"). */
export function termLabelLong(term: UiTerm | string): string {
  return term === 'payg'
    ? 'pay-as-you-go'
    : term === '1y'
      ? '1-year reserved'
      : term === '3y'
        ? '3-year reserved'
        : String(term);
}

/** Short chip/pill form — table headers and term pills. */
export function termLabelShort(term: UiTerm | string): string {
  return term === 'payg' ? 'PAYG' : term === '1y' ? '1y RI' : term === '3y' ? '3y RI' : String(term);
}

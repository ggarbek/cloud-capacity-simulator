/**
 * exportTheme — static color + font tokens for the PPTX / DOCX exports.
 *
 * pptxgenjs and docx want plain 6-digit hex with NO leading '#', so every value
 * here is stored that way. Values are copied from the app's dark theme so the
 * deck / doc reads like the on-screen product.
 *
 * SOURCE OF TRUTH: src/styles/tokens.css (dark theme) and the CompetitivePage
 * `PROVIDER_TONE` map. Keep in sync if those change:
 *   BG          <- --bg              #050507
 *   SURFACE     <- opaque form of --surface-2 (glass over the dark bg)
 *   TEXT        <- --text-primary    #F8FAFC
 *   MUTED       <- --text-muted      #94A3B8
 *   BRAND       <- --interactive     #818CF8
 *   AMBER       <- --accent-amber    #FBBF24
 *   provider tones <- PROVIDER_TONE fg (Azure #93C5FD / AWS #FCD34D / GCP #FCA5A5)
 */
export const EXPORT_THEME = {
  /** Base fill for slides (dark). */
  BG: '0B0D12',
  /** Deep outer edge / footer band. */
  BG_DEEP: '050507',
  /** Elevated surface (opaque approximation of the translucent --surface-2). */
  SURFACE: '1A2028',
  /** Primary text. */
  TEXT: 'F8FAFC',
  /** Secondary text. */
  TEXT_SECONDARY: 'CBD5E1',
  /** Muted / caption text. */
  MUTED: '94A3B8',
  /** Interactive / brand accent. */
  BRAND: '818CF8',
  /** Amber — assumptions, caveats, non-comparable region warnings. */
  AMBER: 'FBBF24',
  /** Positive / savings green (mirrors the on-screen pctTone ≥85 green). */
  POSITIVE: '34D399',
  /** Hairline border on dark. */
  BORDER: '2A313C',
  // ── S66 — subtle background tints (cards + table shading; NEVER accent bars) ──
  /** Alternating table-row tint (barely above BG). */
  SURFACE_ALT: '11151C',
  /** Best-cell highlight tint (indigo wash on dark). */
  BRAND_TINT: '232A4A',
  /** Amber wash for the risks / caveats card. */
  AMBER_TINT: '2B2414',
  /** Provider tones (mirror PROVIDER_TONE.fg). */
  AZURE: '93C5FD',
  AWS: 'FCD34D',
  GCP: 'FCA5A5',
} as const;

export const FONT = 'Arial';

/** Provider fill hex (no '#'), falling back to brand for unknown providers. */
export function providerHex(provider: string): string {
  switch (provider) {
    case 'Azure':
      return EXPORT_THEME.AZURE;
    case 'AWS':
      return EXPORT_THEME.AWS;
    case 'GCP':
      return EXPORT_THEME.GCP;
    default:
      return EXPORT_THEME.BRAND;
  }
}

/**
 * execSummaryPptx — client-side PowerPoint (.pptx) export of the Executive
 * Summary, for BOTH comparison and BoM modes.
 *
 * S66 — rebuilt to ONE leadership arc, identical slide order in both modes
 * (mirroring the on-screen page grammar; only the data differs):
 *
 *   1. Title + verdict     — the one-sentence money answer, scope, date.
 *   2. Recommendation      — adopt / stay / validate / watch cards.
 *   3. The cost story      — cost table + bar chart + commitment economics
 *                            (+ per-rate region + non-comparable disclosure).
 *   4. Get vs give up      — per-cloud tradeoff cards (BoM: portfolio cards).
 *   5. Evidence            — size-for-size table + situational best-at pills
 *                            (BoM: top cost-driver lines).
 *   5b. Spec differences   — direction-marked deltas vs base (comparison only,
 *                            when deltas exist; same content as the brief).
 *   6. Coverage & gaps     — regions per cloud + base-POV gap metros.
 *   7. Risks & methodology — every honest asterisk, in one place.
 *
 * Design rules (leadership quality bar):
 *   - NO decorative accent bars / stripes / title underlines. Cards are set
 *     apart with subtle background tint rectangles only.
 *   - Big stat callouts, not walls of same-size text; every slide carries a
 *     visual element (cards, table, bars) — no bullets-only slides.
 *   - Tables: tinted header row, alternating-row tint, best-cell tint,
 *     right-aligned numbers, 10–12pt body.
 *   - Numbers format through the SAME shared tokens the screen uses
 *     (fmtUsd / fmtPct / termLabelLong) so deck === screen to the character.
 *
 * pptxgenjs is loaded via a DYNAMIC import inside the exporter so it is
 * code-split out of the main bundle. No emojis anywhere in the deck. Colors +
 * font come from exportTheme (dark 16:9 deck, Arial only). Bars are plain
 * rectangle shapes scaled from the model numbers — no chart lib, fully offline.
 */
import type { ExecComparisonModel, ExecBomModel } from './execSummaryModel';
import { execFileBase, isoDate } from './execSummaryModel';
import type { ExecRecommendation, FamilyStory, MarketGapsExport } from './execNarratives';
// S66 fix-b — decision numbers (cost-table cells, Δ-vs-cheapest, verdict
// sentences) render full-precision via fmtUsdFull; fmtUsd stays for KPI-scale
// big stats where scale is the point.
import { fmtUsdFull } from './execNarratives';
import { EXPORT_THEME as T, FONT, providerHex } from './exportTheme';
import { fmtUsd, fmtPct, termLabelLong, termLabelShort } from '../../components/compare/ui/tokens';
// The one ×730 hours-per-month convention (per-term monthly = hourly × 730).
import { HOURS_PER_MONTH } from '../../types';

// ── local formatters the shared tokens don't cover ─────────────────────────
/** A generic cell value that may be number|string|null (showdown table). */
function fmtCell(v: string | number | null): string {
  if (v == null) return '—';
  return typeof v === 'number' ? String(v) : v;
}

// 16:9 deck is 13.333in × 7.5in. A shared layout grid keeps slides consistent.
const W = 13.333;
const MX = 0.7; // horizontal margin (≥ 0.5in everywhere)
const TOP = 1.55; // content top, below the title block
const BOTTOM = 6.85; // content floor, above the footer line

// Recommendation-kind tones (adopt=green, stay=indigo, validate=amber, watch=muted).
const REC_TONE: Record<string, string> = {
  adopt: T.POSITIVE,
  stay: T.BRAND,
  validate: T.AMBER,
  watch: T.MUTED,
};

export async function exportExecDeck(model: ExecComparisonModel | ExecBomModel): Promise<void> {
  const { default: pptxgen } = await import('pptxgenjs');
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'CMA_16x9', width: W, height: 7.5 });
  pptx.layout = 'CMA_16x9';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

  // The exporter helpers below are written against a minimal structural surface
  // (PptxLike / SlideLike) so we don't have to satisfy pptxgenjs's strict enum
  // typings on every addText/addShape option. Cast once at the boundary.
  const doc = pptx as unknown as PptxLike;
  if (model.mode === 'bom') {
    buildBomDeck(doc, model);
  } else {
    buildComparisonDeck(doc, model);
  }

  await pptx.writeFile({ fileName: `${execFileBase(model)}.pptx` });
}

/**
 * Build the pptxgen instance for a model and return it as a node Buffer WITHOUT
 * writing to disk — the node-safe entry the smoke test uses to prove the deck
 * renders end-to-end (every addText/addShape/addTable) from an enriched model.
 */
export async function buildExecDeckBufferForTest(model: ExecComparisonModel | ExecBomModel): Promise<ArrayBuffer | Uint8Array | Buffer> {
  const { default: pptxgen } = await import('pptxgenjs');
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'CMA_16x9', width: W, height: 7.5 });
  pptx.layout = 'CMA_16x9';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const doc = pptx as unknown as PptxLike;
  if (model.mode === 'bom') buildBomDeck(doc, model);
  else buildComparisonDeck(doc, model);
  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}

// ─────────────────────────────────────────────────────────────────────────
// SHARED SLIDE CHROME
// ─────────────────────────────────────────────────────────────────────────

/** Dark background + one muted footer line. No bands, no stripes. */
function baseSlide(pptx: PptxLike, footer: string) {
  const slide = pptx.addSlide();
  slide.background = { color: T.BG };
  slide.addText(footer, {
    x: MX, y: 7.08, w: W - MX * 2, h: 0.28, fontFace: FONT, fontSize: 8, color: T.MUTED,
    align: 'left', valign: 'middle',
  });
  return slide;
}

/** Kicker (small caps, brand) + title. Plain text — no underline shapes. */
function slideTitle(slide: SlideLike, title: string, kicker?: string) {
  if (kicker) {
    slide.addText(kicker.toUpperCase(), {
      x: MX, y: 0.42, w: W - MX * 2, h: 0.28, fontFace: FONT, fontSize: 10.5, color: T.BRAND,
      charSpacing: 2, bold: true,
    });
  }
  slide.addText(title, {
    x: MX, y: kicker ? 0.72 : 0.55, w: W - MX * 2, h: 0.62, fontFace: FONT, fontSize: 24,
    color: T.TEXT, bold: true,
  });
}

// ── table helper — tinted header, alternating rows, best-cell tint ─────────
interface Cell {
  text: string;
  align?: 'left' | 'right' | 'center';
  /** Best value on the row — indigo tint + bold. */
  best?: boolean;
  muted?: boolean;
  bold?: boolean;
  tone?: string;
}

function execTable(
  s: SlideLike,
  opts: { x: number; y: number; w: number; colW?: number[]; fontSize?: number; header: Cell[]; rows: Cell[][]; rowH?: number },
) {
  const fs = opts.fontSize ?? 11;
  const head: PptxRow = opts.header.map((c) => ({
    text: c.text,
    options: {
      bold: true, color: c.tone ?? T.TEXT, fill: { color: T.SURFACE }, fontSize: Math.max(9, fs - 1),
      align: c.align ?? 'left', valign: 'middle',
    },
  }));
  const body: PptxRow[] = opts.rows.map((r, i) =>
    r.map((c) => ({
      text: c.text,
      options: {
        color: c.tone ?? (c.best ? T.TEXT : c.muted ? T.MUTED : T.TEXT_SECONDARY),
        bold: c.best || c.bold || false,
        fill: { color: c.best ? T.BRAND_TINT : i % 2 === 1 ? T.SURFACE_ALT : T.BG },
        fontSize: fs,
        align: c.align ?? 'left',
        valign: 'middle',
      },
    })),
  );
  s.addTable([head, ...body], {
    x: opts.x, y: opts.y, w: opts.w, colW: opts.colW, fontFace: FONT,
    border: { type: 'solid', color: T.BORDER, pt: 0.5 }, rowH: opts.rowH ?? 0.34,
  });
}

// ── bar-chart helper — clean rects, value labels, dashed base marker ───────
interface BarRow {
  label: string;
  value: number | null;
  display: string;
  tone: string;
  isBase?: boolean;
  sub?: string;
  subWarn?: boolean;
}

function drawBars(s: SlideLike, opts: { x: number; y: number; w: number; title: string; bars: BarRow[]; footnote?: string }) {
  const { x, y, w, bars } = opts;
  s.addText(opts.title, { x, y, w, h: 0.28, fontFace: FONT, fontSize: 11, color: T.MUTED, bold: true });
  const labelW = 1.1;
  const valueW = 1.15;
  const barMax = w - labelW - valueW - 0.15;
  const vals = bars.map((b) => b.value).filter((v): v is number => v != null && v > 0);
  const max = Math.max(0.000001, ...vals);
  const rowH = 0.66;
  const y0 = y + 0.42;
  let by = y0;
  for (const b of bars) {
    s.addText(b.label, { x, y: by, w: labelW, h: 0.4, fontFace: FONT, fontSize: 10.5, color: b.tone, bold: true, valign: 'middle' });
    if (b.value != null && b.value > 0) {
      const bw = Math.max(0.08, (b.value / max) * barMax);
      s.addShape('rect', { x: x + labelW, y: by + 0.06, w: bw, h: 0.28, fill: { color: b.tone }, line: { type: 'none' } });
      s.addText(b.display, { x: x + labelW + bw + 0.08, y: by, w: valueW, h: 0.4, fontFace: FONT, fontSize: 10, color: T.TEXT, bold: true, valign: 'middle' });
    } else {
      s.addText('not priced in this feed', { x: x + labelW, y: by, w: barMax, h: 0.4, fontFace: FONT, fontSize: 9.5, color: T.MUTED, italic: true, valign: 'middle' });
    }
    if (b.sub) {
      s.addText(b.sub, { x: x + labelW, y: by + 0.36, w: barMax + valueW, h: 0.2, fontFace: FONT, fontSize: 7.5, color: b.subWarn ? T.AMBER : T.MUTED, valign: 'middle' });
    }
    by += rowH;
  }
  // Baseline marker — dashed vertical line at the base row's value.
  const base = bars.find((b) => b.isBase && b.value != null && b.value > 0);
  if (base && bars.length > 1) {
    const bx = x + labelW + ((base.value as number) / max) * barMax;
    s.addShape('line', { x: bx, y: y0 - 0.06, w: 0, h: by - y0, line: { color: T.MUTED, width: 1, dashType: 'dash' } });
    s.addText('base', { x: bx - 0.4, y: y0 - 0.3, w: 0.8, h: 0.2, fontFace: FONT, fontSize: 7.5, color: T.MUTED, align: 'center' });
  }
  if (opts.footnote) {
    s.addText(opts.footnote, { x, y: by + 0.05, w, h: 0.3, fontFace: FONT, fontSize: 8.5, color: T.MUTED, italic: true, valign: 'top' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1 — TITLE + VERDICT
// ─────────────────────────────────────────────────────────────────────────

function slideTitleVerdict(
  pptx: PptxLike,
  footer: string,
  opts: { statement: string; support: string | null; scope: string; term: string; generatedAt: string },
) {
  const s = baseSlide(pptx, footer);
  s.addText('CLOUD MARKET ANALYTICS — EXECUTIVE BRIEF', {
    x: MX, y: 0.9, w: W - MX * 2, h: 0.32, fontFace: FONT, fontSize: 11, color: T.BRAND,
    charSpacing: 2, bold: true,
  });
  // The money answer, big. Generous whitespace; nothing else competes with it.
  s.addText(opts.statement, {
    x: MX, y: 1.5, w: W - MX * 2, h: 2.7, fontFace: FONT, fontSize: 32, color: T.TEXT, bold: true, valign: 'top',
  });
  if (opts.support) {
    s.addText(opts.support, {
      x: MX, y: 4.35, w: W - MX * 2, h: 0.85, fontFace: FONT, fontSize: 14, color: T.TEXT_SECONDARY, valign: 'top',
    });
  }
  s.addText(opts.scope, {
    x: MX, y: 5.35, w: W - MX * 2, h: 0.45, fontFace: FONT, fontSize: 13, color: T.MUTED, valign: 'top',
  });
  s.addText(
    [
      { text: 'Commitment term  ', options: { color: T.MUTED, fontSize: 11 } },
      { text: termLabelLong(opts.term), options: { color: T.BRAND, fontSize: 11, bold: true } },
      { text: '      Generated  ', options: { color: T.MUTED, fontSize: 11 } },
      { text: isoDate(opts.generatedAt), options: { color: T.TEXT, fontSize: 11 } },
      { text: '      List prices, vendor-published', options: { color: T.MUTED, fontSize: 11, italic: true } },
    ],
    { x: MX, y: 6.05, w: W - MX * 2, h: 0.35, fontFace: FONT },
  );
}

/** The one-sentence money answer for the comparison title slide. */
function comparisonStatement(m: ExecComparisonModel): string {
  const v = m.verdictQuant;
  const termLong = termLabelLong(m.term);
  const baseName = `${m.baseline.provider} ${m.baseline.sku}`;
  if (v && v.cheapestProvider === m.baseline.provider) {
    return `${baseName} is already the least-cost option of this set at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo).`;
  }
  if (v && v.savingsVsBaseUsd != null && v.savingsVsBaseUsd > 0) {
    return `${v.cheapestProvider} ${v.cheapestSku} is the least-cost equivalent at ${termLong}: ${fmtUsdFull(v.monthlyUsd)}/mo — ${fmtUsdFull(v.savingsVsBaseUsd)}/mo (${fmtPct(v.savingsVsBasePct)}) below ${baseName}.`;
  }
  if (v && v.savingsVsBaseUsd != null) {
    // S66 fix-b — PRICED base at ~zero savings = honest parity, never the
    // "unpriced in this feed" data-provenance lie.
    return `${v.cheapestProvider} ${v.cheapestSku} and ${baseName} are effectively at parity at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo) — a coin flip at list prices.`;
  }
  if (v) {
    return `${v.cheapestProvider} ${v.cheapestSku} carries the lowest priced monthly at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo); the ${m.baseline.provider} base is unpriced in this feed — directional only.`;
  }
  return m.verdict.headline;
}

/** The one-sentence money answer for the BoM title slide. The model's headline
 *  is ALREADY the honest gated sentence (S66 fix-b — never the engine's raw
 *  `ported.verdict.headline`), so the fallback is safe; the branches below only
 *  add the suppression + parity phrasing when verdictQuant is present. */
function bomStatement(m: ExecBomModel): string {
  const v = m.verdictQuant;
  const termLong = termLabelLong(m.term);
  const n = m.lines.length;
  const baseTotalPriced = (m.totals.find((t) => t.provider === m.baseProvider)?.monthlyUsd ?? 0) > 0;
  if (v && v.cheapestProvider === m.baseProvider) {
    return `${m.baseProvider} remains the least-cost home for this ${n}-line BoM at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo).`;
  }
  // An entirely-unpriced base outranks the generic suppression sentence — the
  // reader's first fact is the missing base rate (mirrors honestBomHeadline).
  if (v && !baseTotalPriced) {
    return `No published rates price this ${n}-line BoM on ${m.baseProvider}; ${v.cheapestProvider} carries the lowest priced total (${fmtUsdFull(v.monthlyUsd)}/mo at ${termLong}) — directional only.`;
  }
  if (v && m.savingsSuppressed) {
    return `${v.cheapestProvider} prices the lowest BoM total at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo), but ${m.suppressReason ?? 'unmatched lines are excluded from one side'} — totals are not directly comparable, so no savings vs ${m.baseProvider} is stated.`;
  }
  if (v && v.savingsVsBaseUsd != null && v.savingsVsBaseUsd > 0) {
    return `Porting the ${n}-line BoM to ${v.cheapestProvider} costs ${fmtUsdFull(v.monthlyUsd)}/mo at ${termLong} — ${fmtUsdFull(v.savingsVsBaseUsd)}/mo (${fmtPct(v.savingsVsBasePct)}) below ${m.baseProvider}.`;
  }
  if (v && v.savingsVsBaseUsd != null) {
    return `${v.cheapestProvider} and ${m.baseProvider} are effectively at parity for this ${n}-line BoM at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo) — a coin flip at list prices.`;
  }
  if (v && !baseTotalPriced) {
    return `No published rates price this ${n}-line BoM on ${m.baseProvider}; ${v.cheapestProvider} carries the lowest priced total (${fmtUsdFull(v.monthlyUsd)}/mo at ${termLong}) — directional only.`;
  }
  if (v) {
    return `${v.cheapestProvider} carries the lowest priced BoM total at ${termLong} (${fmtUsdFull(v.monthlyUsd)}/mo).`;
  }
  return m.verdict.headline;
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 2 — RECOMMENDATION
// ─────────────────────────────────────────────────────────────────────────

function slideRecommendation(pptx: PptxLike, footer: string, rec: ExecRecommendation | undefined) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'Recommendation', 'What to do with this');
  const bullets = rec?.bullets ?? [];
  if (bullets.length === 0) {
    s.addText('Not enough priced data to synthesize a recommendation — validate rates and re-export.', {
      x: MX, y: TOP + 0.4, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: T.MUTED, italic: true,
    });
    return;
  }
  const n = bullets.length;
  const gap = 0.16;
  const h = Math.min(1.05, (BOTTOM - TOP - gap * (n - 1)) / n);
  let y = TOP;
  for (const b of bullets) {
    const tone = REC_TONE[b.kind] ?? T.MUTED;
    // Subtle tinted card — the visual element; no accent bars.
    s.addShape('roundRect', {
      x: MX, y, w: W - MX * 2, h, rectRadius: 0.08,
      fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 },
    });
    s.addText(b.kind.toUpperCase(), {
      x: MX + 0.3, y, w: 1.25, h, fontFace: FONT, fontSize: 10.5, color: tone,
      bold: true, charSpacing: 1.5, valign: 'middle',
    });
    s.addText(b.text, {
      x: MX + 1.7, y: y + 0.08, w: W - MX * 2 - 2.0, h: h - 0.16, fontFace: FONT, fontSize: 11.5,
      color: T.TEXT_SECONDARY, valign: 'middle',
    });
    y += h + gap;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 3 — THE COST STORY
// ─────────────────────────────────────────────────────────────────────────

/** Full-width tinted callout card at the bottom of the cost slide. */
function costCallout(s: SlideLike, text: string, y: number) {
  s.addShape('roundRect', {
    x: MX, y, w: W - MX * 2, h: 0.78, rectRadius: 0.08,
    fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 },
  });
  s.addText(text, {
    x: MX + 0.3, y: y + 0.08, w: W - MX * 2 - 0.6, h: 0.62, fontFace: FONT, fontSize: 12.5,
    color: T.TEXT, bold: true, valign: 'middle',
  });
}

function slideCostComparison(pptx: PptxLike, footer: string, m: ExecComparisonModel) {
  const s = baseSlide(pptx, footer);
  const short = termLabelShort(m.term);
  slideTitle(s, 'The cost story', `Priced at ${termLabelLong(m.term)}`);

  // Left — the cost table: monthly at the term + the commitment stepdown.
  // Per-term monthly columns come from the region-matched published rates
  // (rateBars, hourly × 730) — HorizonCost carries ONE applied rate, so its
  // horizons cannot express the PAYG→1y→3y stepdown honestly.
  const priced = m.costMatrix.filter((c) => c.monthly != null && (c.monthly as number) > 0);
  // S66 fix-b — the highlighted "cheapest" row keys off the model's verdictQuant
  // (the same gated math the verdict slide quotes), never a parallel local
  // Math.min over raw floats that can disagree on a near-tie. The float scan is
  // only the fallback when verdictQuant is absent.
  const scanCheapest = priced.length ? Math.min(...priced.map((c) => c.monthly as number)) : null;
  const vqProvider = m.verdictQuant?.cheapestProvider ?? null;
  const isCheapestRow = (c: ExecComparisonModel['costMatrix'][number]) =>
    vqProvider != null
      ? c.provider === vqProvider && c.monthly != null
      : scanCheapest != null && c.monthly === scanCheapest;
  const barFor = (provider: string) => m.rateBars.find((b) => b.provider === provider) ?? null;
  const termMonthly = (rate: number | null | undefined) => (rate == null ? null : rate * HOURS_PER_MONTH);
  execTable(s, {
    x: MX, y: TOP, w: 6.7,
    colW: [2.5, 1.15, 1.0, 1.0, 1.05],
    fontSize: 10.5,
    header: [
      { text: 'Option' },
      { text: `${short} /mo`, align: 'right' },
      { text: 'PAYG /mo', align: 'right' },
      { text: '1-yr /mo', align: 'right' },
      { text: '3-yr /mo', align: 'right' },
    ],
    rows: m.costMatrix.map((c) => {
      const bar = barFor(c.provider);
      return [
        { text: `${c.provider} ${c.sku}`, tone: providerHex(c.provider), bold: true },
        { text: fmtUsdFull(c.monthly), align: 'right', best: isCheapestRow(c) },
        { text: fmtUsdFull(c.paygMonthly ?? termMonthly(bar?.payg)), align: 'right' },
        { text: fmtUsdFull(termMonthly(bar?.oneYr)), align: 'right' },
        { text: fmtUsdFull(termMonthly(bar?.threeYr)), align: 'right' },
      ] as Cell[];
    }),
  });
  const capY = TOP + 0.42 * (m.costMatrix.length + 1) + 0.15;
  s.addText('Tinted cell = lowest monthly at the selected term. Reserved columns show the amortized monthly equivalent of the published rate.', {
    x: MX, y: capY, w: 6.7, h: 0.5, fontFace: FONT,
    fontSize: 8.5, color: T.MUTED, italic: true, valign: 'top',
  });
  // S66 fix-b — per-rate region disclosure (restored; the DOCX kept it). Every
  // priced rate names its region; a rate priced far from the base region gets
  // the amber not-comparable footnote, matching the brief's wording.
  let regY = capY + 0.55;
  const withRegion = m.rateBars.filter((b) => b.region);
  if (withRegion.length) {
    s.addText(`Priced at: ${withRegion.map((b) => `${b.provider} ${b.region}`).join(' · ')}`, {
      x: MX, y: regY, w: 6.7, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.MUTED, valign: 'top',
    });
    regY += 0.26;
  }
  for (const b of m.rateBars) {
    if (b.regionComparable !== false) continue;
    s.addText(`${b.provider} priced at ${b.region ?? 'its nearest available region'} — not near the base region; nearest available.`, {
      x: MX, y: regY, w: 6.7, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.AMBER, valign: 'top',
    });
    regY += 0.26;
  }

  // Right — monthly cost bars at the term, base marked.
  drawBars(s, {
    x: 7.8, y: TOP, w: W - MX - 7.8,
    title: `Monthly cost at ${short}`,
    bars: m.costMatrix.map((c) => ({
      label: c.provider,
      value: c.monthly,
      display: `${fmtUsdFull(c.monthly)}/mo`,
      tone: providerHex(c.provider),
      isBase: c.provider === m.baseline.provider,
      sub: c.rateLabel !== short ? `priced at ${c.rateLabel}` : undefined,
    })),
  });

  // Bottom — commitment economics, honest either way.
  const base = m.costMatrix.find((c) => c.provider === m.baseline.provider);
  let callout: string | null = null;
  if (base && base.paygMonthly != null && base.threeYear != null) {
    const annualSave = base.paygMonthly * 12 - base.threeYear / 3;
    if (annualSave > 0) {
      callout = `A 3-year commitment saves about ${fmtUsdFull(annualSave)}/yr on ${m.baseline.provider} ${m.baseline.sku} vs pay-as-you-go.`;
    }
  }
  costCallout(s, callout ?? 'Reserved-term rates are amortized monthly equivalents of vendor-published commitment pricing; upfront-fee variants are not modeled.', 5.95);
}

function slideCostBom(pptx: PptxLike, footer: string, m: ExecBomModel) {
  const s = baseSlide(pptx, footer);
  const short = termLabelShort(m.term);
  slideTitle(s, 'The cost story', `Whole-BoM totals at ${termLabelLong(m.term)}`);

  const priced = m.totals.filter((t) => t.monthlyUsd > 0);
  // S66 fix-b — cheapest keyed off the model's verdictQuant (same gated math as
  // the verdict slide); the float scan is only the no-verdict fallback.
  const scanCheapest = priced.length ? Math.min(...priced.map((t) => t.monthlyUsd)) : null;
  const vqProvider = m.verdictQuant?.cheapestProvider ?? null;
  const cheapest =
    vqProvider != null
      ? m.totals.find((t) => t.provider === vqProvider && t.monthlyUsd > 0)?.monthlyUsd ?? scanCheapest
      : scanCheapest;
  execTable(s, {
    x: MX, y: TOP, w: 6.7,
    colW: [1.5, 1.45, 1.45, 1.25, 1.05],
    fontSize: 10.5,
    header: [
      { text: 'Cloud' },
      { text: `${short} /mo`, align: 'right' },
      { text: 'Δ vs cheapest', align: 'right' },
      { text: 'Lines matched', align: 'right' },
      { text: 'Avg match', align: 'right' },
    ],
    rows: m.totals.map((t) => {
      const isCheapest =
        vqProvider != null
          ? t.provider === vqProvider && t.monthlyUsd > 0
          : cheapest != null && t.monthlyUsd === cheapest;
      const delta = t.monthlyUsd > 0 && cheapest != null && !isCheapest ? `+${fmtUsdFull(t.monthlyUsd - cheapest)}` : '—';
      return [
        { text: t.provider, tone: providerHex(t.provider), bold: true },
        { text: `${fmtUsdFull(t.monthlyUsd || null)}${t.estimated ? ' (est.)' : ''}`, align: 'right', best: isCheapest },
        { text: delta, align: 'right' },
        { text: `${t.matched}/${t.matched + t.unmatched}`, align: 'right' },
        { text: fmtPct(t.avgMatchPct), align: 'right' },
      ] as Cell[];
    }),
  });
  s.addText('Tinted cell = lowest whole-BoM monthly. "(est.)" = some reserved rates estimated from PAYG.', {
    x: MX, y: TOP + 0.42 * (m.totals.length + 1) + 0.15, w: 6.7, h: 0.5, fontFace: FONT,
    fontSize: 8.5, color: T.MUTED, italic: true, valign: 'top',
  });

  drawBars(s, {
    x: 7.8, y: TOP, w: W - MX - 7.8,
    title: `Whole-BoM monthly at ${short}`,
    bars: m.totals.map((t) => ({
      label: t.provider,
      value: t.monthlyUsd > 0 ? t.monthlyUsd : null,
      display: `${fmtUsdFull(t.monthlyUsd || null)}/mo`,
      tone: providerHex(t.provider),
      isBase: t.provider === m.baseProvider,
      sub: t.unmatched > 0 ? `${t.unmatched} line${t.unmatched === 1 ? '' : 's'} unmatched — excluded` : undefined,
      subWarn: t.unmatched > 0,
    })),
  });

  const anyEst = m.totals.some((t) => t.estimated);
  costCallout(
    s,
    `Totals price every matched line at ${termLabelLong(m.term)}; unmatched lines are excluded — never priced at zero.${anyEst ? ' Estimated reserved rates are directional, not quoted RI prices.' : ''}`,
    5.95,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 4 — WHAT YOU GET VS WHAT YOU GIVE UP
// ─────────────────────────────────────────────────────────────────────────

/** One provider tradeoff card (comparison mode). Card bg tint, no accent bars. */
function drawFamilyCard(s: SlideLike, story: FamilyStory, x: number, y: number, w: number, h: number) {
  const tone = providerHex(story.provider);
  s.addShape('roundRect', { x, y, w, h, rectRadius: 0.1, fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 } });
  const px = x + 0.25;
  const pw = w - 0.5;
  s.addText(story.provider, { x: px, y: y + 0.18, w: pw, h: 0.34, fontFace: FONT, fontSize: 15, color: tone, bold: true });
  s.addText(`${story.family} · ${story.category}`, { x: px, y: y + 0.56, w: pw, h: 0.3, fontFace: FONT, fontSize: 11, color: T.TEXT, bold: true });
  s.addText(story.generation, { x: px, y: y + 0.88, w: pw, h: 0.42, fontFace: FONT, fontSize: 9, color: T.MUTED, valign: 'top' });
  s.addText(
    [
      { text: story.sku, options: { color: T.TEXT_SECONDARY, fontSize: 9 } },
      ...(story.matchPct != null
        ? [{ text: `    ${fmtPct(story.matchPct)} match`, options: { color: T.BRAND, fontSize: 9, bold: true } }]
        : []),
    ],
    { x: px, y: y + 1.32, w: pw, h: 0.26, fontFace: FONT },
  );
  // What you get.
  s.addText('WHAT YOU GET', { x: px, y: y + 1.68, w: pw, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.MUTED, bold: true, charSpacing: 1.5 });
  let dy = y + 1.96;
  for (const str of story.strengths.slice(0, 3)) {
    s.addShape('rect', { x: px, y: dy + 0.07, w: 0.08, h: 0.08, fill: { color: tone }, line: { type: 'none' } });
    s.addText(str, { x: px + 0.2, y: dy, w: pw - 0.2, h: 0.56, fontFace: FONT, fontSize: 9.5, color: T.TEXT_SECONDARY, valign: 'top' });
    dy += 0.6;
  }
  // What you give up.
  const giveY = Math.max(dy + 0.1, y + h - 1.45);
  s.addText('WHAT YOU GIVE UP', { x: px, y: giveY, w: pw, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.AMBER, bold: true, charSpacing: 1.5 });
  s.addText(story.tradeoff ?? 'No standout weakness vs this set — validate workload-specific behavior.', {
    x: px, y: giveY + 0.26, w: pw, h: 0.56, fontFace: FONT, fontSize: 9.5, color: T.TEXT_SECONDARY, valign: 'top',
  });
  if (story.caveat) {
    s.addText(story.caveat, { x: px, y: giveY + 0.86, w: pw, h: 0.52, fontFace: FONT, fontSize: 8, color: T.MUTED, italic: true, valign: 'top' });
  }
}

function slideTradeoffsComparison(pptx: PptxLike, footer: string, m: ExecComparisonModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'What you get vs what you give up', 'Per cloud');
  const stories = m.familyStories ?? [];
  if (stories.length === 0) {
    s.addText('Pick a VM on two or more clouds to see the per-cloud tradeoff story.', {
      x: MX, y: TOP + 0.4, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: T.MUTED, italic: true,
    });
    return;
  }
  const n = Math.min(stories.length, 3);
  const gap = 0.3;
  const cw = (W - MX * 2 - gap * (n - 1)) / n;
  let x = MX;
  for (const story of stories.slice(0, 3)) {
    drawFamilyCard(s, story, x, TOP, cw, BOTTOM - TOP);
    x += cw + gap;
  }
}

/** Per-cloud portfolio card (BoM mode). */
function slideTradeoffsBom(pptx: PptxLike, footer: string, m: ExecBomModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'What you get vs what you give up', 'Portfolio per cloud');
  const totals = m.totals.slice(0, 4);
  if (totals.length === 0) {
    s.addText('Commit a VM BoM to see the per-cloud portfolio story.', {
      x: MX, y: TOP + 0.4, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: T.MUTED, italic: true,
    });
    return;
  }
  const n = totals.length;
  const gap = 0.3;
  const cw = (W - MX * 2 - gap * (n - 1)) / n;
  const ch = BOTTOM - TOP;
  let x = MX;
  for (const t of totals) {
    const tone = providerHex(t.provider);
    const isBase = t.provider === m.baseProvider;
    s.addShape('roundRect', { x, y: TOP, w: cw, h: ch, rectRadius: 0.1, fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 } });
    const px = x + 0.25;
    const pw = cw - 0.5;
    s.addText(t.provider, { x: px, y: TOP + 0.18, w: pw, h: 0.34, fontFace: FONT, fontSize: 15, color: tone, bold: true });
    s.addText(isBase ? 'Base — your current BoM' : 'Ported portfolio', { x: px, y: TOP + 0.54, w: pw, h: 0.26, fontFace: FONT, fontSize: 9, color: T.MUTED });
    s.addText(t.monthlyUsd > 0 ? fmtUsd(t.monthlyUsd) : '—', {
      x: px, y: TOP + 0.92, w: pw, h: 0.85, fontFace: FONT, fontSize: 34, color: T.TEXT, bold: true, valign: 'middle',
    });
    s.addText(`per month at ${termLabelShort(m.term)}`, { x: px, y: TOP + 1.8, w: pw, h: 0.26, fontFace: FONT, fontSize: 9, color: T.MUTED });
    // What you get / give up, portfolio framing.
    s.addText('WHAT YOU GET', { x: px, y: TOP + 2.25, w: pw, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.MUTED, bold: true, charSpacing: 1.5 });
    s.addText(
      isBase
        ? 'The 100% reference — every line stays on its exact SKU and region.'
        : `${t.matched} of ${t.matched + t.unmatched} lines matched${t.avgMatchPct != null ? ` at ${fmtPct(t.avgMatchPct)} average spec match` : ''}.`,
      { x: px, y: TOP + 2.52, w: pw, h: 0.85, fontFace: FONT, fontSize: 9.5, color: T.TEXT_SECONDARY, valign: 'top' },
    );
    s.addText('WHAT YOU GIVE UP', { x: px, y: TOP + 3.45, w: pw, h: 0.24, fontFace: FONT, fontSize: 8.5, color: T.AMBER, bold: true, charSpacing: 1.5 });
    const giveParts: string[] = [];
    if (!isBase) {
      giveParts.push('Analogs are spec equivalents, not identical SKUs.');
      if (t.unmatched > 0) giveParts.push(`${t.unmatched} line${t.unmatched === 1 ? '' : 's'} have no equivalent — excluded from the total.`);
      if (t.estimated) giveParts.push('Some reserved rates estimated from PAYG (est.).');
    } else {
      // S66 fix-b — conditional: only claim a foregone cheaper total when a
      // comparable cheaper ported total actually exists; when the base IS the
      // cheapest, say so instead of contradicting the executive summary.
      const vq = m.verdictQuant;
      if (vq && vq.cheapestProvider === m.baseProvider) {
        giveParts.push('Nothing on cost — already the least-cost home for this BoM at the selected term.');
      } else if (vq && vq.savingsVsBaseUsd != null && vq.savingsVsBaseUsd > 0) {
        giveParts.push('Foregoes the cheaper ported total in this set — the cost of staying put.');
      } else {
        giveParts.push('No comparable cheaper ported total is established in this set at the selected term.');
      }
    }
    s.addText(giveParts.join(' '), { x: px, y: TOP + 3.72, w: pw, h: 1.3, fontFace: FONT, fontSize: 9.5, color: T.TEXT_SECONDARY, valign: 'top' });
    x += cw + gap;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 5 — EVIDENCE (size-for-size / top cost-driver lines)
// ─────────────────────────────────────────────────────────────────────────

/** S66 fix-b — restored situational best-at pills (the on-screen exec page's
 *  "Best at X" tags). Provider-toned rounded pills, never a crown. */
function drawBestAtPills(
  s: SlideLike,
  bestAt: { provider: string; tags: string[] }[],
  x: number,
  y: number,
  maxW: number,
) {
  const items = bestAt.flatMap((b) => b.tags.map((t) => ({ provider: b.provider, text: `${b.provider} — ${t}` })));
  if (items.length === 0) return;
  s.addText('SITUATIONAL STRENGTHS', {
    x, y, w: maxW, h: 0.24, fontFace: FONT, fontSize: 9, color: T.MUTED, bold: true, charSpacing: 1.5,
  });
  let px = x;
  let py = y + 0.3;
  const ph = 0.32;
  for (const it of items) {
    const pw = 0.34 + it.text.length * 0.082;
    if (px + pw > x + maxW) {
      px = x;
      py += ph + 0.12;
      if (py > 6.0) break; // never collide with the footnote band
    }
    s.addShape('roundRect', {
      x: px, y: py, w: pw, h: ph, rectRadius: 0.16,
      fill: { color: T.SURFACE }, line: { color: providerHex(it.provider), width: 1 },
    });
    s.addText(it.text, {
      x: px, y: py, w: pw, h: ph, fontFace: FONT, fontSize: 9.5, color: providerHex(it.provider),
      bold: true, align: 'center', valign: 'middle',
    });
    px += pw + 0.15;
  }
}

function slideEvidenceComparison(pptx: PptxLike, footer: string, m: ExecComparisonModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'Size-for-size', 'The evidence');
  const showdown = m.sizeShowdown;
  const providers = m.familyStories && m.familyStories.length
    ? m.familyStories.map((f) => f.provider)
    : m.costMatrix.map((c) => c.provider);
  if (!showdown || showdown.rows.length === 0 || providers.length === 0) {
    s.addText('Pick a VM on two or more clouds to see the size-for-size evidence table.', {
      x: MX, y: TOP + 0.4, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: T.MUTED, italic: true,
    });
    // The situational best-at tags don't need the showdown — still render them.
    drawBestAtPills(s, m.verdict.bestAt, MX, TOP + 1.3, W - MX * 2);
    return;
  }
  const label = (r: { label: string; unit?: string }) => (r.unit ? `${r.label} (${r.unit})` : r.label);
  const cellText = (rLabel: string, v: string | number | null) =>
    rLabel === 'Monthly cost' && typeof v === 'number' ? fmtUsdFull(v) : fmtCell(v);
  const tw = W - MX * 2;
  const labelW = 2.7;
  const colW = [labelW, ...providers.map(() => (tw - labelW) / providers.length)];
  execTable(s, {
    x: MX, y: TOP, w: tw, colW, fontSize: 11,
    header: [{ text: 'Dimension' }, ...providers.map((p) => ({ text: p, align: 'right' as const, tone: providerHex(p) }))],
    rows: showdown.rows.map((r) => [
      { text: label(r), muted: true, bold: true } as Cell,
      ...providers.map((p) => ({
        text: cellText(r.label, r.byProvider[p] ?? null),
        align: 'right' as const,
        best: r.bestProvider === p,
      })),
    ]),
  });
  // S66 fix-b — the model's situational best-at tags, restored as pills.
  drawBestAtPills(s, m.verdict.bestAt, MX, 5.3, tw);
  s.addText('Tinted cell = best value on the row (lowest for cost, highest for specs). "(est.)" / "(assumed)" mark curated estimates, not vendor-published figures.', {
    x: MX, y: 6.35, w: tw, h: 0.4, fontFace: FONT, fontSize: 9, color: T.MUTED, italic: true, valign: 'top',
  });
}

/** S66 fix-b — restored spec-differences element (the DOCX kept its section):
 *  direction-marked per-cloud deltas vs the base, on their own slide. */
function slideSpecDeltas(pptx: PptxLike, footer: string, m: ExecComparisonModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, `Spec differences vs ${m.baseline.provider} ${m.baseline.sku}`, 'The evidence — deltas');
  const provs = Array.from(new Set(m.specDeltas.map((d) => d.provider)));
  const n = Math.max(1, Math.min(provs.length, 3));
  const gap = 0.3;
  const cw = (W - MX * 2 - gap * (n - 1)) / n;
  let x = MX;
  for (const p of provs.slice(0, 3)) {
    const tone = providerHex(p);
    s.addShape('roundRect', {
      x, y: TOP, w: cw, h: BOTTOM - TOP, rectRadius: 0.1,
      fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 },
    });
    const px = x + 0.25;
    const pw = cw - 0.5;
    s.addText(p, { x: px, y: TOP + 0.18, w: pw, h: 0.34, fontFace: FONT, fontSize: 15, color: tone, bold: true });
    let dy = TOP + 0.66;
    for (const d of m.specDeltas.filter((sd) => sd.provider === p).slice(0, 7)) {
      const more = d.direction === 'more';
      s.addText(
        [
          { text: more ? '+  ' : '−  ', options: { color: more ? T.POSITIVE : T.AMBER, bold: true, fontSize: 11 } },
          { text: d.detail, options: { color: T.TEXT_SECONDARY, fontSize: 10.5 } },
        ],
        { x: px, y: dy, w: pw, h: 0.6, fontFace: FONT, valign: 'top' },
      );
      dy += 0.62;
      if (dy > BOTTOM - 0.6) break;
    }
    x += cw + gap;
  }
  s.addText('Direction reads from the equivalent side: "+" = the equivalent offers more on the dimension, "−" = less. Same content as the brief spec-differences section.', {
    x: MX, y: 6.55, w: W - MX * 2, h: 0.35, fontFace: FONT, fontSize: 8.5, color: T.MUTED, italic: true, valign: 'top',
  });
}

function slideEvidenceBom(pptx: PptxLike, footer: string, m: ExecBomModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'What drives the cost', 'The evidence — top lines');
  const providers = m.totals.map((t) => t.provider);
  if (m.lines.length === 0) {
    s.addText('Commit a VM BoM to see the cost-driver lines.', {
      x: MX, y: TOP + 0.4, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 13, color: T.MUTED, italic: true,
    });
    return;
  }
  // Top lines by base monthly cost (mirrors the lineHighlights ranking).
  const baseCost = (ln: ExecBomModel['lines'][number]) =>
    ln.perCloud.find((c) => c.provider === m.baseProvider)?.monthlyUsd ?? 0;
  const top = [...m.lines].sort((a, b) => baseCost(b) - baseCost(a)).slice(0, 6);
  const tw = W - MX * 2;
  const fixed = 0.55 + 2.6 + 0.7;
  const provW = (tw - fixed) / providers.length;
  execTable(s, {
    x: MX, y: TOP, w: tw,
    colW: [0.55, 2.6, 0.7, ...providers.map(() => provW)],
    fontSize: 10.5,
    header: [
      { text: '#' },
      { text: 'Base SKU' },
      { text: 'Qty', align: 'right' },
      ...providers.map((p) => ({ text: `${p} $/mo`, align: 'right' as const, tone: providerHex(p) })),
    ],
    rows: top.map((ln) => {
      const prices = providers.map((p) => ln.perCloud.find((c) => c.provider === p)?.monthlyUsd ?? null);
      const pricedVals = prices.filter((v): v is number => v != null && v > 0);
      const best = pricedVals.length >= 2 ? Math.min(...pricedVals) : null;
      return [
        { text: String(ln.index + 1), muted: true },
        { text: ln.baseSku },
        { text: String(ln.qty), align: 'right' },
        ...prices.map((v) => ({
          text: fmtUsdFull(v),
          align: 'right' as const,
          best: best != null && v === best,
        })),
      ] as Cell[];
    }),
  });
  let dy = TOP + 0.42 * (top.length + 1) + 0.2;
  if (m.lines.length > top.length) {
    s.addText(`Showing the top ${top.length} cost drivers of ${m.lines.length} lines. Tinted cell = cheapest cloud for the line.`, {
      x: MX, y: dy, w: tw, h: 0.28, fontFace: FONT, fontSize: 9, color: T.MUTED, italic: true,
    });
    dy += 0.35;
  }
  if (m.lineHighlights && m.lineHighlights.length) {
    s.addText('READ ON THE NUMBERS', { x: MX, y: dy, w: tw, h: 0.26, fontFace: FONT, fontSize: 9, color: T.BRAND, bold: true, charSpacing: 1.5 });
    dy += 0.32;
    s.addText(
      m.lineHighlights.slice(0, 4).map((h) => ({ text: h.insight, options: { bullet: true, color: T.TEXT_SECONDARY, fontSize: 10.5, breakLine: true } })),
      { x: MX, y: dy, w: tw, h: Math.max(0.4, BOTTOM - dy), fontFace: FONT, valign: 'top' },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 6 — MARKET COVERAGE & GAPS
// ─────────────────────────────────────────────────────────────────────────

function drawGapsPanel(s: SlideLike, gaps: MarketGapsExport | undefined, x: number, y: number, w: number) {
  if (!gaps) {
    s.addText('Region-gap analysis unavailable for this selection.', {
      x, y, w, h: 0.5, fontFace: FONT, fontSize: 11, color: T.MUTED, italic: true,
    });
    return;
  }
  s.addText(`${gaps.base} market gaps`, { x, y, w, h: 0.32, fontFace: FONT, fontSize: 13, color: T.TEXT, bold: true });
  s.addText(
    [
      { text: String(gaps.gapCount), options: { fontSize: 44, color: gaps.gapCount > 0 ? T.AMBER : T.POSITIVE, bold: true } },
      { text: `  metro${gaps.gapCount === 1 ? '' : 's'} a competitor serves that ${gaps.base} does not`, options: { fontSize: 11, color: T.TEXT_SECONDARY } },
    ],
    { x, y: y + 0.35, w, h: 0.85, fontFace: FONT, valign: 'middle' },
  );
  s.addText(`${gaps.sharedByAll} metro${gaps.sharedByAll === 1 ? '' : 's'} served by every active cloud.`, {
    x, y: y + 1.28, w, h: 0.28, fontFace: FONT, fontSize: 10, color: T.MUTED,
  });
  let dy = y + 1.75;
  for (const c of gaps.perCompetitor) {
    const tone = providerHex(c.provider);
    const ex = c.examples.length
      ? `: ${c.examples.join(', ')}${c.count > c.examples.length ? `, +${c.count - c.examples.length} more` : ''}`
      : '';
    s.addText(
      [
        { text: `${c.provider} — ${c.count}`, options: { color: tone, fontSize: 11, bold: true } },
        { text: ` ${gaps.base}-absent metro${c.count === 1 ? '' : 's'}${ex}`, options: { color: T.TEXT_SECONDARY, fontSize: 11 } },
      ],
      { x, y: dy, w, h: 0.55, fontFace: FONT, valign: 'top' },
    );
    dy += 0.6;
  }
  if (gaps.note) {
    s.addText(gaps.note, { x, y: dy + 0.05, w, h: 0.6, fontFace: FONT, fontSize: 8.5, color: T.MUTED, italic: true, valign: 'top' });
  }
}

function slideCoverageComparison(pptx: PptxLike, footer: string, m: ExecComparisonModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'Market coverage & gaps', 'Where they play');
  drawBars(s, {
    x: MX, y: TOP, w: 5.3,
    title: 'Regions with published availability',
    bars: m.footprint.perProvider.map((p) => ({
      label: p.provider,
      value: p.regions,
      display: String(p.regions),
      tone: providerHex(p.provider),
      isBase: p.provider === m.baseline.provider,
    })),
    footnote: `${m.footprint.totalMarks} location${m.footprint.totalMarks === 1 ? '' : 's'} mapped across the selected clouds.`,
  });
  drawGapsPanel(s, m.marketGaps, 6.7, TOP, W - MX - 6.7);
}

function slideCoverageBom(pptx: PptxLike, footer: string, m: ExecBomModel) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'Market coverage & gaps', `Base ${m.baseProvider}`);
  // Left — deployment-regions stat card.
  s.addShape('roundRect', { x: MX, y: TOP, w: 5.3, h: 2.6, rectRadius: 0.1, fill: { color: T.SURFACE }, line: { color: T.BORDER, width: 1 } });
  s.addText('DEPLOYMENT REGIONS', { x: MX + 0.3, y: TOP + 0.25, w: 4.7, h: 0.3, fontFace: FONT, fontSize: 10, color: T.MUTED, bold: true, charSpacing: 1.5 });
  s.addText(String(m.regionsCovered), { x: MX + 0.3, y: TOP + 0.6, w: 4.7, h: 1.15, fontFace: FONT, fontSize: 52, color: T.BRAND, bold: true, valign: 'middle' });
  s.addText(`distinct region${m.regionsCovered === 1 ? '' : 's'} in this BoM — each line prices at its own deployment region where available.`, {
    x: MX + 0.3, y: TOP + 1.8, w: 4.7, h: 0.7, fontFace: FONT, fontSize: 10.5, color: T.MUTED, valign: 'top',
  });
  drawGapsPanel(s, m.marketGaps, 6.7, TOP, W - MX - 6.7);
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 7 — RISKS, ASSUMPTIONS & METHODOLOGY
// ─────────────────────────────────────────────────────────────────────────

function slideRisks(pptx: PptxLike, footer: string, opts: { methodology: string; caveats: string[] }) {
  const s = baseSlide(pptx, footer);
  slideTitle(s, 'Risks, assumptions & methodology');
  s.addText(opts.methodology, {
    x: MX, y: TOP, w: W - MX * 2, h: 1.0, fontFace: FONT, fontSize: 11.5, color: T.TEXT_SECONDARY, valign: 'top',
  });
  s.addText('"(assumed)" marks a curated processor estimate; "(est.)" marks a curated network figure or a reserved rate estimated from PAYG. All prices are list prices, vendor-published — no negotiated or spot pricing.', {
    x: MX, y: TOP + 1.05, w: W - MX * 2, h: 0.6, fontFace: FONT, fontSize: 10, color: T.MUTED, valign: 'top',
  });
  // Risks card — subtle amber wash (a tint card, not an accent bar).
  const cy = TOP + 1.8;
  const ch = BOTTOM - cy;
  s.addShape('roundRect', { x: MX, y: cy, w: W - MX * 2, h: ch, rectRadius: 0.1, fill: { color: T.AMBER_TINT }, line: { type: 'none' } });
  s.addText('RISKS & CAVEATS', { x: MX + 0.3, y: cy + 0.2, w: W - MX * 2 - 0.6, h: 0.28, fontFace: FONT, fontSize: 10.5, color: T.AMBER, bold: true, charSpacing: 1.5 });
  const list = opts.caveats.filter(Boolean).slice(0, 6);
  if (list.length === 0) {
    s.addText('Rates and equivalents reflect the published catalog at the generation date. Equivalents are spec analogs, not identical SKUs — validate memory- and latency-critical workloads before committing.', {
      x: MX + 0.3, y: cy + 0.55, w: W - MX * 2 - 0.6, h: ch - 0.75, fontFace: FONT, fontSize: 10.5, color: T.TEXT_SECONDARY, valign: 'top',
    });
  } else {
    s.addText(
      list.map((t) => ({ text: t, options: { bullet: true, color: T.TEXT_SECONDARY, fontSize: 10.5, breakLine: true } })),
      { x: MX + 0.3, y: cy + 0.55, w: W - MX * 2 - 0.6, h: ch - 0.75, fontFace: FONT, valign: 'top' },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// COMPARISON DECK — the 7-slide leadership arc
// ─────────────────────────────────────────────────────────────────────────
function buildComparisonDeck(pptx: PptxLike, m: ExecComparisonModel) {
  const footer = `Cloud Market Analytics · ${m.baseline.provider} ${m.baseline.sku} · ${termLabelShort(m.term)} · ${isoDate(m.generatedAt)} · List prices, vendor-published`;
  const scope = m.scope ?? `${m.baseline.provider} ${m.baseline.sku} vs cross-cloud equivalents · priced at ${termLabelLong(m.term)}`;

  // 1 — Title + verdict.
  slideTitleVerdict(pptx, footer, {
    statement: comparisonStatement(m),
    support: m.verdictQuant ? m.verdict.headline : null,
    scope,
    term: m.term,
    generatedAt: m.generatedAt,
  });

  // 2 — Recommendation.
  slideRecommendation(pptx, footer, m.recommendation);

  // 3 — The cost story.
  slideCostComparison(pptx, footer, m);

  // 4 — What you get vs what you give up.
  slideTradeoffsComparison(pptx, footer, m);

  // 5 — Evidence: size-for-size (+ the situational best-at pills).
  slideEvidenceComparison(pptx, footer, m);

  // 5b — Evidence: spec differences vs base (restored; only when deltas exist).
  if (m.specDeltas.length > 0) slideSpecDeltas(pptx, footer, m);

  // 6 — Market coverage & gaps.
  slideCoverageComparison(pptx, footer, m);

  // 7 — Risks, assumptions & methodology.
  slideRisks(pptx, footer, {
    methodology:
      'Cross-cloud analogs are chosen by a category gate then weighted spec distance; costs price at the selected commitment term at region-matched rates. Analogs are spec equivalents, not identical SKUs.',
    caveats: m.caveats,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// BOM DECK — the SAME 7-slide arc, BoM data
// ─────────────────────────────────────────────────────────────────────────
function buildBomDeck(pptx: PptxLike, m: ExecBomModel) {
  const footer = `Cloud Market Analytics · VM BoM (${m.lines.length} line${m.lines.length === 1 ? '' : 's'}) · base ${m.baseProvider} · ${termLabelShort(m.term)} · ${isoDate(m.generatedAt)} · List prices, vendor-published`;
  const scope =
    m.scope ?? `${m.lines.length}-line BoM ported from ${m.baseProvider} · priced at ${termLabelLong(m.term)}`;

  // 1 — Title + verdict. The support line is the engine's first descriptive
  // insight — NEVER the engine's `verdict.headline` (S66 fix-b: with an
  // unpriced base the engine headline can claim "already the cheapest at
  // $0/mo"; the statement above already carries the honest gated verdict).
  slideTitleVerdict(pptx, footer, {
    statement: bomStatement(m),
    support: m.verdict.insights[0] ?? null,
    scope,
    term: m.term,
    generatedAt: m.generatedAt,
  });

  // 2 — Recommendation.
  slideRecommendation(pptx, footer, m.recommendation);

  // 3 — The cost story.
  slideCostBom(pptx, footer, m);

  // 4 — What you get vs what you give up.
  slideTradeoffsBom(pptx, footer, m);

  // 5 — Evidence: top cost-driver lines.
  slideEvidenceBom(pptx, footer, m);

  // 6 — Market coverage & gaps.
  slideCoverageBom(pptx, footer, m);

  // 7 — Risks, assumptions & methodology.
  slideRisks(pptx, footer, {
    methodology:
      'Each BoM line maps to its best-match equivalent on every target cloud (category gate + weighted spec distance); the line prices at the chosen commitment term. Equivalents are spec analogs, not identical SKUs. Unmatched lines are excluded from totals — never priced at zero.',
    caveats: [...m.caveats, ...m.verdict.insights],
  });
}

// ── minimal structural typings (see note at the pptxgen cast above) ────────
type PptxRow = { text: string; options: Record<string, unknown> }[];
type SlideLike = {
  background: { color: string };
  addText: (t: unknown, o: Record<string, unknown>) => void;
  addShape: (s: string, o: Record<string, unknown>) => void;
  addTable: (r: unknown, o: Record<string, unknown>) => void;
};
type PptxLike = { addSlide: () => SlideLike };

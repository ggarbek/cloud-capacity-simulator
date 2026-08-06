/**
 * execSummaryDocx — client-side Word (.docx) export of the Executive Summary,
 * for BOTH comparison and BoM modes.
 *
 * S66 — rebuilt as an ANALYST BRIEF with the same leadership arc as the deck
 * (identical section order in both modes; only the data differs):
 *
 *   Title + meta  →  Executive summary (one PROSE paragraph, not bullets)
 *   →  Recommendation (callout-styled shaded block)
 *   →  The cost story  →  What you get vs what you give up (+ evidence table)
 *   →  Market coverage & gaps  →  Risks, assumptions & methodology
 *   →  Footer: generation date + tool version + list-price disclosure.
 *
 * Numbers format through the SAME shared tokens the screen uses (fmtUsd /
 * fmtPct / termLabelLong) so brief === screen to the character. Every
 * "(assumed)" / "(est.)" marker carries through; unmatched lines are named as
 * exclusions, never silently dropped.
 *
 * `docx` is loaded via a DYNAMIC import inside the exporter so it code-splits
 * out of the main bundle. The finished document is packed to a Blob and
 * downloaded via an object-URL anchor click (no file-saver dependency). No
 * emojis anywhere.
 */
import type { ExecComparisonModel, ExecBomModel } from './execSummaryModel';
import { execFileBase, isoDate } from './execSummaryModel';
import type { ExecRecommendation } from './execNarratives';
// S66 fix-b — decision numbers (cost-table cells, Δ-vs-cheapest, verdict
// sentences) render full-precision via fmtUsdFull; fmtUsd stays for KPI-scale
// stats where scale is the point.
import { fmtUsdFull } from './execNarratives';
import { fmtPct, termLabelLong, termLabelShort } from '../../components/compare/ui/tokens';
import { APP_VERSION } from '../feedback';
// The one ×730 hours-per-month convention (per-term monthly = hourly × 730).
import { HOURS_PER_MONTH } from '../../types';

// ── local formatters the shared tokens don't cover ─────────────────────────
/** Hourly rate, 3 decimals under $10 (rate-scale values need them). */
function fmtRate(v: number | null): string {
  return v == null ? '—' : `$${v.toFixed(v >= 10 ? 2 : 3)}/hr`;
}
function fmtCell(v: string | number | null): string {
  if (v == null) return '—';
  return typeof v === 'number' ? String(v) : v;
}

// Light-page tints (the doc prints on white — NOT the deck's dark theme).
const DOC = {
  HEAD_TINT: 'EEF0FA', // table header shading (light indigo wash)
  ROW_ALT: 'F7F8FB', // alternating row tint
  CALLOUT: 'F1F2FA', // recommendation callout shading
  BORDER: 'D8DCE6',
  MUTED: '64748B',
  ADOPT: '15803D',
  STAY: '4338CA',
  VALIDATE: 'B45309',
  WATCH: '475569',
} as const;

const REC_DOC_TONE: Record<string, string> = {
  adopt: DOC.ADOPT,
  stay: DOC.STAY,
  validate: DOC.VALIDATE,
  watch: DOC.WATCH,
};

export async function exportExecDoc(model: ExecComparisonModel | ExecBomModel): Promise<void> {
  const docx = await import('docx');
  const doc =
    model.mode === 'bom' ? buildBomDoc(docx, model) : buildComparisonDoc(docx, model);
  const blob = await docx.Packer.toBlob(doc);
  triggerDownload(blob, `${execFileBase(model)}.docx`);
}

/**
 * Build the docx `Document` for a model WITHOUT touching the DOM (no
 * download) — the node-safe entry the smoke test packs to a Buffer to prove the
 * builders assemble a well-formed document from an enriched model.
 */
export async function buildExecDocForTest(model: ExecComparisonModel | ExecBomModel) {
  const docx = await import('docx');
  return model.mode === 'bom' ? buildBomDoc(docx, model) : buildComparisonDoc(docx, model);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has consumed the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// docx module is dynamically imported; type it loosely for the builders.
type Docx = typeof import('docx');

// ─────────────────────────────────────────────────────────────────────────
// SHARED BUILDING BLOCKS
// ─────────────────────────────────────────────────────────────────────────

/** Title + meta line (scope · term · generated). */
function docHeader(d: Docx, title: string, scope: string, term: string, generatedAt: string) {
  const { Paragraph, HeadingLevel, TextRun } = d;
  return [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: scope, italics: true, color: DOC.MUTED }),
        new TextRun({ text: `  ·  Generated ${isoDate(generatedAt)}`, italics: true, color: DOC.MUTED }),
        new TextRun({ text: `  ·  Commitment term: ${termLabelLong(term)}`, italics: true, color: DOC.MUTED }),
      ],
      spacing: { after: 240 },
    }),
  ];
}

/** The recommendation as a callout-styled shaded paragraph block. */
function recommendationBlock(d: Docx, rec: ExecRecommendation | undefined) {
  const { Paragraph, HeadingLevel, TextRun, ShadingType } = d;
  const out: unknown[] = [new Paragraph({ text: 'Recommendation', heading: HeadingLevel.HEADING_2 })];
  const bullets = rec?.bullets ?? [];
  if (bullets.length === 0) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: 'Not enough priced data to synthesize a recommendation — validate rates and re-export.', italics: true })],
      }),
    );
    return out;
  }
  bullets.forEach((b, i) => {
    out.push(
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: DOC.CALLOUT },
        spacing: { before: i === 0 ? 120 : 60, after: i === bullets.length - 1 ? 160 : 60 },
        children: [
          new TextRun({ text: `${b.kind.toUpperCase()} — `, bold: true, color: REC_DOC_TONE[b.kind] ?? DOC.WATCH }),
          new TextRun({ text: b.text }),
        ],
      }),
    );
  });
  return out;
}

interface DocCell {
  text: string;
  align?: 'left' | 'right';
  bold?: boolean;
  best?: boolean;
}

/** Table with tinted header row, alternating-row tint, best-cell tint and
 *  right-aligned numeric columns. */
function buildTable(d: Docx, headers: DocCell[], rows: DocCell[][]) {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType, ShadingType } = d;
  const border = { style: BorderStyle.SINGLE, size: 4, color: DOC.BORDER };
  const borders = { top: border, bottom: border, left: border, right: border };
  const alignOf = (c: DocCell) => (c.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          borders,
          shading: { type: ShadingType.CLEAR, fill: DOC.HEAD_TINT },
          children: [new Paragraph({ alignment: alignOf(h), children: [new TextRun({ text: h.text, bold: true })] })],
        }),
    ),
  });
  const bodyRows = rows.map(
    (r, i) =>
      new TableRow({
        children: r.map(
          (c) =>
            new TableCell({
              borders,
              shading: { type: ShadingType.CLEAR, fill: c.best ? DOC.HEAD_TINT : i % 2 === 1 ? DOC.ROW_ALT : 'FFFFFF' },
              children: [
                new Paragraph({
                  alignment: alignOf(c),
                  children: [new TextRun({ text: c.text, bold: c.best || c.bold || false })],
                }),
              ],
            }),
        ),
      }),
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] });
}

function buildMarketGapParagraphs(d: Docx, gaps: ExecComparisonModel['marketGaps'] | ExecBomModel['marketGaps']) {
  const { Paragraph, TextRun } = d;
  const out: unknown[] = [];
  if (!gaps) {
    out.push(new Paragraph({ children: [new TextRun({ text: 'Region-gap analysis unavailable for this selection.', italics: true })] }));
    return out;
  }
  out.push(
    new Paragraph({
      text: `${gaps.base} has ${gaps.gapCount} market gap${gaps.gapCount === 1 ? '' : 's'} — metros a competitor serves that ${gaps.base} does not. ${gaps.sharedByAll} metro${gaps.sharedByAll === 1 ? '' : 's'} are served by every active cloud.`,
    }),
  );
  for (const c of gaps.perCompetitor) {
    const ex = c.examples.length ? `: ${c.examples.join(', ')}${c.count > c.examples.length ? `, +${c.count - c.examples.length} more` : ''}` : '';
    out.push(new Paragraph({ text: `${c.provider} serves ${c.count} ${gaps.base}-absent metro${c.count === 1 ? '' : 's'}${ex}`, bullet: { level: 0 } }));
  }
  if (gaps.note) out.push(new Paragraph({ children: [new TextRun({ text: gaps.note, italics: true, color: DOC.MUTED })] }));
  return out;
}

/** The closing "Risks, assumptions & methodology" section — every asterisk. */
function risksSection(d: Docx, method: string, caveats: string[]) {
  const { Paragraph, HeadingLevel, TextRun } = d;
  const out: unknown[] = [new Paragraph({ text: 'Risks, assumptions & methodology', heading: HeadingLevel.HEADING_2 })];
  const list = caveats.filter(Boolean);
  if (list.length === 0) {
    out.push(
      new Paragraph({
        text: 'Rates and equivalents reflect the published catalog at the generation date. Equivalents are spec analogs, not identical SKUs — validate memory- and latency-critical workloads before committing.',
      }),
    );
  } else {
    for (const c of list) out.push(new Paragraph({ text: c, bullet: { level: 0 } }));
  }
  out.push(
    new Paragraph({ text: 'Methodology', heading: HeadingLevel.HEADING_3 }),
    new Paragraph({ text: method }),
    new Paragraph({
      children: [
        new TextRun({
          text: '"(assumed)" marks a curated processor estimate; "(est.)" marks a curated network figure or a reserved rate estimated from PAYG. All prices are list prices, vendor-published — no negotiated or spot pricing.',
          italics: true,
          color: DOC.MUTED,
        }),
      ],
    }),
  );
  return out;
}

/** The document footer: generation date + tool version + pricing disclosure. */
function docFooter(d: Docx, generatedAt: string) {
  const { Footer, Paragraph, TextRun, AlignmentType } = d;
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Generated ${isoDate(generatedAt)} · Cloud Market Analytics ${APP_VERSION} · List prices, vendor-published; analogs are spec equivalents, not identical SKUs.`,
            size: 16, // half-points → 8pt
            color: DOC.MUTED,
          }),
        ],
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// COMPARISON BRIEF
// ─────────────────────────────────────────────────────────────────────────
function buildComparisonDoc(d: Docx, m: ExecComparisonModel) {
  const { Document, Paragraph, HeadingLevel, TextRun } = d;
  const termLong = termLabelLong(m.term);
  const termShort = termLabelShort(m.term);
  const baseName = `${m.baseline.provider} ${m.baseline.sku}`;
  const flow: unknown[] = [];

  // ── 1 · Title + meta ─────────────────────────────────────────────────
  flow.push(
    ...docHeader(
      d,
      `Cloud market brief — ${baseName} vs cross-cloud equivalents`,
      m.scope ?? `${baseName} vs cross-cloud equivalents`,
      m.term,
      m.generatedAt,
    ),
  );

  // ── 2 · Executive summary — ONE prose paragraph, verdict first ────────
  flow.push(new Paragraph({ text: 'Executive summary', heading: HeadingLevel.HEADING_2 }));
  const v = m.verdictQuant;
  const summary: string[] = [];
  if (v && v.cheapestProvider === m.baseline.provider) {
    summary.push(`At ${termLong}, ${baseName} is already the least-cost option of this comparison set at ${fmtUsdFull(v.monthlyUsd)} per month.`);
  } else if (v && v.savingsVsBaseUsd != null && v.savingsVsBaseUsd > 0) {
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} ${v.cheapestSku} is the least-cost equivalent at ${fmtUsdFull(v.monthlyUsd)} per month — ${fmtUsdFull(v.savingsVsBaseUsd)} per month (${fmtPct(v.savingsVsBasePct)}) below the ${baseName} base.`,
    );
  } else if (v && v.savingsVsBaseUsd != null) {
    // S66 fix-b — PRICED base at ~zero savings = honest parity, never the
    // "not priced in this feed" data-provenance lie.
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} ${v.cheapestSku} and the ${baseName} base are effectively at parity (${fmtUsdFull(v.monthlyUsd)} per month) — the ranking is a coin flip at list prices.`,
    );
  } else if (v) {
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} ${v.cheapestSku} carries the lowest priced monthly (${fmtUsdFull(v.monthlyUsd)}); the ${m.baseline.provider} base is not priced in this feed, so the ranking is directional.`,
    );
  } else {
    summary.push(m.verdict.headline);
  }
  const matches = (m.familyStories ?? [])
    .filter((f) => f.provider !== m.baseline.provider && f.matchPct != null)
    .map((f) => f.matchPct as number);
  if (matches.length) {
    const avg = matches.reduce((a, b) => a + b, 0) / matches.length;
    summary.push(`The closest analogs average ${fmtPct(avg)} spec match — equivalents, not identical SKUs.`);
  }
  if (m.marketGaps) {
    summary.push(
      m.marketGaps.gapCount > 0
        ? `On coverage, competitors serve ${m.marketGaps.gapCount} metro${m.marketGaps.gapCount === 1 ? '' : 's'} ${m.marketGaps.base} does not.`
        : `On coverage, no competitor-only metros stand against ${m.marketGaps.base} in this set.`,
    );
  }
  if (m.caveats.length) {
    summary.push(`${m.caveats.length} comparability caveat${m.caveats.length === 1 ? '' : 's'} appl${m.caveats.length === 1 ? 'ies' : 'y'} — detailed in the closing section.`);
  }
  flow.push(new Paragraph({ children: [new TextRun({ text: summary.join(' ') })] }));

  // S66 fix-b — restored situational best-at tags (the on-screen exec page's
  // "Best at X" pills): per-dimension strengths, never a single crowned winner.
  if (m.verdict.bestAt.length) {
    flow.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({ text: 'Situational strengths: ', bold: true }),
          ...m.verdict.bestAt.flatMap((b, i) => [
            ...(i > 0 ? [new TextRun({ text: '; ' })] : []),
            new TextRun({ text: b.provider, bold: true }),
            new TextRun({ text: ` — ${b.tags.join(', ')}` }),
          ]),
          new TextRun({ text: '. Each cloud leads on specific dimensions — no single overall winner is claimed.', italics: true, color: DOC.MUTED }),
        ],
      }),
    );
  }

  // ── 3 · Recommendation (callout block) ────────────────────────────────
  flow.push(...recommendationBlock(d, m.recommendation));

  // ── 4 · The cost story ────────────────────────────────────────────────
  flow.push(new Paragraph({ text: 'The cost story', heading: HeadingLevel.HEADING_2 }));
  // Per-term monthly columns come from the region-matched published rates
  // (rateBars, hourly × 730) — HorizonCost carries ONE applied rate, so its
  // horizons cannot express the PAYG→1y→3y stepdown honestly.
  const priced = m.costMatrix.filter((c) => c.monthly != null && (c.monthly as number) > 0);
  // S66 fix-b — the tinted "cheapest" row keys off the model's verdictQuant
  // (the same gated math the executive summary quotes); the float scan is only
  // the no-verdict fallback. Cells render full-precision (fmtUsdFull) so
  // near-tied totals stay distinguishable.
  const scanCheapest = priced.length ? Math.min(...priced.map((c) => c.monthly as number)) : null;
  const vqProvider = m.verdictQuant?.cheapestProvider ?? null;
  const isCheapestRow = (c: ExecComparisonModel['costMatrix'][number]) =>
    vqProvider != null
      ? c.provider === vqProvider && c.monthly != null
      : scanCheapest != null && c.monthly === scanCheapest;
  const barFor = (provider: string) => m.rateBars.find((b) => b.provider === provider) ?? null;
  const termMonthly = (rate: number | null | undefined) => (rate == null ? null : rate * HOURS_PER_MONTH);
  flow.push(
    buildTable(
      d,
      [
        { text: 'Option' },
        { text: `${termShort} /mo`, align: 'right' },
        { text: 'PAYG /mo', align: 'right' },
        { text: '1-yr /mo', align: 'right' },
        { text: '3-yr /mo', align: 'right' },
        { text: 'Rate applied' },
      ],
      m.costMatrix.map((c) => {
        const bar = barFor(c.provider);
        return [
          { text: `${c.provider} ${c.sku}`, bold: true },
          { text: fmtUsdFull(c.monthly), align: 'right', best: isCheapestRow(c) },
          { text: fmtUsdFull(c.paygMonthly ?? termMonthly(bar?.payg)), align: 'right' },
          { text: fmtUsdFull(termMonthly(bar?.oneYr)), align: 'right' },
          { text: fmtUsdFull(termMonthly(bar?.threeYr)), align: 'right' },
          { text: c.rateLabel },
        ] as DocCell[];
      }),
    ),
  );
  // Commitment economics — the honest PAYG-annual vs 3-yr-effective-annual compare.
  const base = m.costMatrix.find((c) => c.provider === m.baseline.provider);
  if (base && base.paygMonthly != null && base.threeYear != null) {
    const annualSave = base.paygMonthly * 12 - base.threeYear / 3;
    if (annualSave > 0) {
      flow.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [new TextRun({ text: `A 3-year commitment saves about ${fmtUsdFull(annualSave)} per year on ${baseName} versus pay-as-you-go.`, bold: true })],
        }),
      );
    }
  }
  flow.push(new Paragraph({ text: 'Published hourly rates', heading: HeadingLevel.HEADING_3 }));
  for (const b of m.rateBars) {
    const region = b.region
      ? b.regionComparable === false
        ? ` [priced at ${b.region} — not near the base region; nearest available]`
        : ` [priced at ${b.region}]`
      : '';
    flow.push(
      new Paragraph({
        text: `${b.provider} ${b.sku}: PAYG ${fmtRate(b.payg)} · 1-yr ${fmtRate(b.oneYr)} · 3-yr ${fmtRate(b.threeYr)}${region}`,
        bullet: { level: 0 },
      }),
    );
  }

  // ── 5 · What you get vs what you give up ──────────────────────────────
  flow.push(new Paragraph({ text: 'What you get vs what you give up', heading: HeadingLevel.HEADING_2 }));
  if (m.familyStories && m.familyStories.length) {
    for (const story of m.familyStories) {
      flow.push(
        new Paragraph({
          text: `${story.provider} — ${story.family} (${story.category})`,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${story.sku}`, bold: true }),
            ...(story.matchPct != null ? [new TextRun({ text: `  ·  ${fmtPct(story.matchPct)} match`, color: DOC.STAY, bold: true })] : []),
            new TextRun({ text: `  ·  ${story.generation}`, italics: true, color: DOC.MUTED }),
          ],
        }),
      );
      for (const str of story.strengths) flow.push(new Paragraph({ text: str, bullet: { level: 0 } }));
      if (story.tradeoff) {
        flow.push(new Paragraph({ children: [new TextRun({ text: `What you give up: ${story.tradeoff}`, italics: true })] }));
      }
      if (story.caveat) {
        flow.push(new Paragraph({ children: [new TextRun({ text: story.caveat, italics: true, color: DOC.MUTED })] }));
      }
    }
  } else {
    flow.push(new Paragraph({ children: [new TextRun({ text: 'Pick a VM on two or more clouds to populate the per-cloud tradeoff story.', italics: true })] }));
  }
  // Evidence: the size-for-size table.
  if (m.sizeShowdown && m.sizeShowdown.rows.length) {
    const providers = m.familyStories && m.familyStories.length ? m.familyStories.map((f) => f.provider) : m.costMatrix.map((c) => c.provider);
    flow.push(new Paragraph({ text: 'Size-for-size evidence', heading: HeadingLevel.HEADING_3 }));
    flow.push(
      buildTable(
        d,
        [{ text: 'Dimension' }, ...providers.map((p) => ({ text: p, align: 'right' as const }))],
        m.sizeShowdown.rows.map((r) => {
          const label = r.unit ? `${r.label} (${r.unit})` : r.label;
          return [
            { text: label, bold: true } as DocCell,
            ...providers.map((p) => {
              const raw = r.byProvider[p] ?? null;
              const text = r.label === 'Monthly cost' && typeof raw === 'number' ? fmtUsdFull(raw) : fmtCell(raw);
              return { text, align: 'right', best: r.bestProvider === p } as DocCell;
            }),
          ];
        }),
      ),
    );
    flow.push(
      new Paragraph({
        children: [new TextRun({ text: 'Tinted cell = best value on the row (lowest for cost, highest for specs). "(est.)" / "(assumed)" mark curated estimates.', italics: true, color: DOC.MUTED })],
      }),
    );
  }
  // Retained spec-delta detail.
  if (m.specDeltas.length) {
    flow.push(new Paragraph({ text: `Spec differences vs ${m.baseline.provider}`, heading: HeadingLevel.HEADING_3 }));
    for (const sDelta of m.specDeltas) flow.push(new Paragraph({ text: `${sDelta.provider} — ${sDelta.detail}`, bullet: { level: 0 } }));
  }

  // ── 6 · Market coverage & gaps ────────────────────────────────────────
  flow.push(new Paragraph({ text: 'Market coverage & gaps', heading: HeadingLevel.HEADING_2 }));
  flow.push(
    buildTable(
      d,
      [{ text: 'Provider' }, { text: 'Regions with published availability', align: 'right' }],
      [
        ...m.footprint.perProvider.map((p) => [{ text: p.provider, bold: true }, { text: String(p.regions), align: 'right' as const }]),
        [{ text: 'Total locations mapped' }, { text: String(m.footprint.totalMarks), align: 'right' as const }],
      ],
    ),
  );
  flow.push(...buildMarketGapParagraphs(d, m.marketGaps));

  // ── 7 · Risks, assumptions & methodology ──────────────────────────────
  flow.push(
    ...risksSection(
      d,
      'Cross-cloud analogs are chosen by a category gate then weighted spec distance; costs price at the selected commitment term at region-matched rates. Analogs are spec equivalents, not identical SKUs.',
      m.caveats,
    ),
  );

  return new Document({
    creator: 'Cloud Market Analytics',
    title: `Cloud market brief — ${baseName}`,
    sections: [{ footers: { default: docFooter(d, m.generatedAt) }, children: flow as never[] }],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// BOM BRIEF — the SAME arc, BoM data
// ─────────────────────────────────────────────────────────────────────────
function buildBomDoc(d: Docx, m: ExecBomModel) {
  const { Document, Paragraph, HeadingLevel, TextRun } = d;
  const termLong = termLabelLong(m.term);
  const termShort = termLabelShort(m.term);
  const providers = m.totals.map((t) => t.provider);
  const n = m.lines.length;
  const flow: unknown[] = [];

  // ── 1 · Title + meta ─────────────────────────────────────────────────
  flow.push(
    ...docHeader(
      d,
      `Cloud market brief — ${n}-line VM Bill of Materials`,
      m.scope ?? `${n}-line BoM ported from ${m.baseProvider}`,
      m.term,
      m.generatedAt,
    ),
  );

  // ── 2 · Executive summary — ONE prose paragraph ───────────────────────
  flow.push(new Paragraph({ text: 'Executive summary', heading: HeadingLevel.HEADING_2 }));
  const v = m.verdictQuant;
  const baseTotalPriced = (m.totals.find((t) => t.provider === m.baseProvider)?.monthlyUsd ?? 0) > 0;
  const summary: string[] = [];
  if (v && v.cheapestProvider === m.baseProvider) {
    summary.push(`At ${termLong}, ${m.baseProvider} remains the least-cost home for this ${n}-line Bill of Materials at ${fmtUsdFull(v.monthlyUsd)} per month.`);
  } else if (v && !baseTotalPriced) {
    // An entirely-unpriced base outranks the generic suppression sentence —
    // the reader's first fact is the missing base rate (mirrors the deck).
    summary.push(
      `No published rates price this ${n}-line Bill of Materials on ${m.baseProvider} — the ${m.baseProvider} base is not priced in this feed. ${v.cheapestProvider} carries the lowest priced total (${fmtUsdFull(v.monthlyUsd)} per month at ${termLong}); treat the ranking as directional only.`,
    );
  } else if (v && m.savingsSuppressed) {
    // S66 fix-b — a savings claim over an undercounted total is suppressed;
    // disclose the reason instead of stating "$X below base".
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} prices the lowest BoM total (${fmtUsdFull(v.monthlyUsd)} per month), but ${m.suppressReason ?? 'unmatched lines are excluded from one side'} — totals are not directly comparable, so no savings versus ${m.baseProvider} is stated.`,
    );
  } else if (v && v.savingsVsBaseUsd != null && v.savingsVsBaseUsd > 0) {
    summary.push(
      `At ${termLong}, porting this ${n}-line Bill of Materials to ${v.cheapestProvider} costs ${fmtUsdFull(v.monthlyUsd)} per month — ${fmtUsdFull(v.savingsVsBaseUsd)} per month (${fmtPct(v.savingsVsBasePct)}) below the ${m.baseProvider} base.`,
    );
  } else if (v && v.savingsVsBaseUsd != null) {
    // S66 fix-b — PRICED base at ~zero savings = honest parity, never the
    // "not priced in this feed" data-provenance lie.
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} and the ${m.baseProvider} base are effectively at parity (${fmtUsdFull(v.monthlyUsd)} per month) — the ranking is a coin flip at list prices.`,
    );
  } else if (v && !baseTotalPriced) {
    summary.push(
      `At ${termLong}, ${v.cheapestProvider} carries the lowest priced BoM total (${fmtUsdFull(v.monthlyUsd)} per month); the ${m.baseProvider} base is not priced in this feed, so the ranking is directional.`,
    );
  } else if (v) {
    summary.push(`At ${termLong}, ${v.cheapestProvider} carries the lowest priced BoM total (${fmtUsdFull(v.monthlyUsd)} per month).`);
  } else {
    // The model's headline is the honest gated sentence (never the engine's).
    summary.push(m.verdict.headline);
  }
  // S66 fix-b — ONE avg-match figure: the model's qty-weighted value (the same
  // `weightedTargetMatch` the on-screen KPI shows), labeled as such.
  if (m.avgTargetMatchPct != null) {
    summary.push(`Ported lines average ${fmtPct(m.avgTargetMatchPct)} spec match (qty-weighted) — equivalents, not identical SKUs.`);
  }
  const unmatchedTotal = m.totals.filter((t) => t.provider !== m.baseProvider).reduce((s, t) => s + t.unmatched, 0);
  if (unmatchedTotal > 0) {
    summary.push(`${unmatchedTotal} ported line${unmatchedTotal === 1 ? '' : 's'} found no same-category equivalent and are excluded from totals, never priced at zero.`);
  }
  if (m.marketGaps) {
    summary.push(
      m.marketGaps.gapCount > 0
        ? `On coverage, competitors serve ${m.marketGaps.gapCount} metro${m.marketGaps.gapCount === 1 ? '' : 's'} ${m.marketGaps.base} does not.`
        : `On coverage, no competitor-only metros stand against ${m.marketGaps.base} in this set.`,
    );
  }
  flow.push(new Paragraph({ children: [new TextRun({ text: summary.join(' ') })] }));

  // ── 3 · Recommendation (callout block) ────────────────────────────────
  flow.push(...recommendationBlock(d, m.recommendation));

  // ── 4 · The cost story ────────────────────────────────────────────────
  flow.push(new Paragraph({ text: 'The cost story', heading: HeadingLevel.HEADING_2 }));
  const pricedTotals = m.totals.filter((t) => t.monthlyUsd > 0);
  // S66 fix-b — cheapest keyed off the model's verdictQuant (same gated math as
  // the executive summary); float scan only as the no-verdict fallback. Cells
  // render full-precision so near-tied totals stay distinguishable.
  const scanCheapest = pricedTotals.length ? Math.min(...pricedTotals.map((t) => t.monthlyUsd)) : null;
  const vqProvider = m.verdictQuant?.cheapestProvider ?? null;
  const cheapest =
    vqProvider != null
      ? m.totals.find((t) => t.provider === vqProvider && t.monthlyUsd > 0)?.monthlyUsd ?? scanCheapest
      : scanCheapest;
  flow.push(
    buildTable(
      d,
      [
        { text: 'Cloud' },
        { text: `${termShort} /mo`, align: 'right' },
        { text: 'Δ vs cheapest', align: 'right' },
        { text: 'Lines matched', align: 'right' },
        { text: 'Avg match', align: 'right' },
        { text: 'Estimated rates' },
      ],
      m.totals.map((t) => {
        const isCheapest =
          vqProvider != null
            ? t.provider === vqProvider && t.monthlyUsd > 0
            : cheapest != null && t.monthlyUsd === cheapest;
        return [
          { text: t.provider, bold: true },
          { text: fmtUsdFull(t.monthlyUsd || null), align: 'right', best: isCheapest },
          { text: t.monthlyUsd > 0 && cheapest != null && !isCheapest ? `+${fmtUsdFull(t.monthlyUsd - cheapest)}` : '—', align: 'right' },
          { text: `${t.matched}/${t.matched + t.unmatched}`, align: 'right' },
          { text: fmtPct(t.avgMatchPct), align: 'right' },
          { text: t.estimated ? 'yes (est.)' : 'no' },
        ] as DocCell[];
      }),
    ),
  );
  flow.push(
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: `Totals price every matched line at ${termLong}; unmatched lines are excluded — never priced at zero.`,
          bold: true,
        }),
      ],
    }),
  );

  // ── 5 · What you get vs what you give up ──────────────────────────────
  flow.push(new Paragraph({ text: 'What you get vs what you give up', heading: HeadingLevel.HEADING_2 }));
  for (const t of m.totals) {
    const isBase = t.provider === m.baseProvider;
    const get = isBase
      ? 'The 100% reference — every line stays on its exact SKU and region.'
      : `${t.matched} of ${t.matched + t.unmatched} lines matched${t.avgMatchPct != null ? ` at ${fmtPct(t.avgMatchPct)} average spec match` : ''}.`;
    const giveParts: string[] = [];
    if (!isBase) {
      giveParts.push('Analogs are spec equivalents, not identical SKUs.');
      if (t.unmatched > 0) giveParts.push(`${t.unmatched} line${t.unmatched === 1 ? '' : 's'} have no equivalent — excluded from the total.`);
      if (t.estimated) giveParts.push('Some reserved rates are estimated from PAYG (est.).');
    } else {
      // S66 fix-b — conditional: only claim a foregone cheaper total when a
      // comparable cheaper ported total actually exists; when the base IS the
      // cheapest, say so instead of contradicting the executive summary.
      const vq = m.verdictQuant;
      if (vq && vq.cheapestProvider === m.baseProvider) {
        giveParts.push('Nothing on cost — already the least-cost home for this BoM at the selected term.');
      } else if (vq && vq.savingsVsBaseUsd != null && vq.savingsVsBaseUsd > 0) {
        giveParts.push('Staying put foregoes the cheaper ported total above.');
      } else {
        giveParts.push('No comparable cheaper ported total is established in this set at the selected term.');
      }
    }
    flow.push(
      new Paragraph({ text: `${t.provider}${isBase ? ' (base)' : ''} — ${fmtUsdFull(t.monthlyUsd || null)}/mo at ${termShort}`, heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ children: [new TextRun({ text: `What you get: ${get}` })] }),
      new Paragraph({ children: [new TextRun({ text: `What you give up: ${giveParts.join(' ')}`, italics: true })] }),
    );
  }
  // Evidence: the full BoM detail table + cost-driver highlights.
  flow.push(new Paragraph({ text: 'Bill of Materials detail', heading: HeadingLevel.HEADING_3 }));
  flow.push(
    buildTable(
      d,
      [
        { text: '#' },
        { text: 'Base SKU' },
        { text: 'Qty', align: 'right' },
        ...providers.flatMap((p) => [{ text: `${p} SKU` }, { text: `${p} $/mo`, align: 'right' as const }]),
      ],
      m.lines.map((ln) => {
        const perCloud = providers.map((p) => ln.perCloud.find((c) => c.provider === p) ?? null);
        const pricedVals = perCloud.map((pc) => pc?.monthlyUsd ?? null).filter((x): x is number => x != null && x > 0);
        const best = pricedVals.length >= 2 ? Math.min(...pricedVals) : null;
        return [
          { text: String(ln.index + 1) },
          { text: ln.baseSku, bold: true },
          { text: String(ln.qty), align: 'right' },
          ...perCloud.flatMap((pc) => [
            { text: pc?.sku ?? '— (unmatched)' } as DocCell,
            { text: fmtUsdFull(pc?.monthlyUsd ?? null), align: 'right', best: best != null && pc?.monthlyUsd === best } as DocCell,
          ]),
        ] as DocCell[];
      }),
    ),
  );
  if (m.lineHighlights && m.lineHighlights.length) {
    flow.push(new Paragraph({ text: 'What drives the cost', heading: HeadingLevel.HEADING_3 }));
    for (const h of m.lineHighlights) flow.push(new Paragraph({ text: h.insight, bullet: { level: 0 } }));
  }

  // ── 6 · Market coverage & gaps ────────────────────────────────────────
  flow.push(new Paragraph({ text: 'Market coverage & gaps', heading: HeadingLevel.HEADING_2 }));
  flow.push(
    new Paragraph({
      text: `This BoM deploys across ${m.regionsCovered} distinct region${m.regionsCovered === 1 ? '' : 's'}. Each line prices at its own deployment region where available.`,
    }),
  );
  flow.push(...buildMarketGapParagraphs(d, m.marketGaps));

  // ── 7 · Risks, assumptions & methodology ──────────────────────────────
  flow.push(
    ...risksSection(
      d,
      'Each BoM line maps to its best-match equivalent on every target cloud (category gate + weighted spec distance); the line prices at the chosen commitment term. Equivalents are spec analogs, not identical SKUs. Unmatched lines are excluded from totals — never priced at zero.',
      [...m.caveats, ...m.verdict.insights],
    ),
  );

  return new Document({
    creator: 'Cloud Market Analytics',
    title: `Cloud market brief — ${n}-line VM Bill of Materials`,
    sections: [{ footers: { default: docFooter(d, m.generatedAt) }, children: flow as never[] }],
  });
}

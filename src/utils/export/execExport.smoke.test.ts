/**
 * S65/S66 — REAL export smoke test. Proves the enriched exec models render all
 * the way through both exporters (every addText/addShape/addTable in the deck,
 * every paragraph/table in the doc) without throwing, and produce non-empty
 * output.
 *
 * Runs node-safe: the DOCX packs to a Buffer (Packer.toBuffer) and the PPTX
 * renders to a nodebuffer — neither path touches the DOM download helpers.
 *
 * S66 — reproducible artifact-render path for QA:
 *
 *   WRITE_EXPORT_ARTIFACTS=1 npx vitest run src/utils/export/execExport.smoke.test.ts
 *
 * writes all four sample artifacts (comparison + bom × pptx + docx) to
 * /tmp/s66-exports/ so a human (or the orchestrator) can open them, and so the
 * slide/document XML can be unzipped and inspected for section content.
 */
import { describe, it, expect } from 'vitest';
import { buildExecComparisonModel, buildExecBomModel } from './execSummaryModel';
import { buildExecDocForTest } from './execSummaryDocx';
import { buildExecDeckBufferForTest } from './execSummaryPptx';
import { compareSpecs } from '../specInsights';
import type { CatalogEntry } from '../../types';
import type { WinnerAnalysis, HorizonCost, PriceBar } from '../../engine/competitive';
import type { BomPortResult } from '../bomPort';
import type { MarketGapReport, CoverageLoc } from '../marketGaps';

const vm = (over: Partial<CatalogEntry>): CatalogEntry => ({
  vmSizeName: 'x', vmGeneration: 'v1' as never, series: 'X',
  memoryCategory: 'Medium Memory (MM)', homeHardwareGroup: '', spilloverTarget: 'N/A',
  processor: '', vcpus: 0, memoryGib: 0, networkMbps: 0, localDiskGib: 0, status: '', notes: '',
  ...over,
});

const gapLoc = (city: string, owner: 'Azure' | 'AWS' | 'GCP', region: string): CoverageLoc => ({
  city, country: 'US', superGeo: 'Americas' as never, region, owner, regionByProvider: { [owner]: region } as never,
});
const gapReport: MarketGapReport = {
  all: 2, twoPlus: 1, totalPlaces: 4,
  allList: [gapLoc('Virginia', 'Azure', 'East US')], twoPlusList: [],
  exclusive: { Azure: [gapLoc('Zurich', 'Azure', 'Switzerland North')], AWS: [gapLoc('Sydney', 'AWS', 'ap-southeast-2')], GCP: [gapLoc('Santiago', 'GCP', 'southamerica-west1')] },
  sharedByBase: { Azure: [], AWS: [gapLoc('Singapore', 'Azure', 'Southeast Asia')], GCP: [] },
  competitorGap: { Azure: [], AWS: [gapLoc('Sydney', 'AWS', 'ap-southeast-2')], GCP: [gapLoc('Santiago', 'GCP', 'southamerica-west1')] }, bothCompetitors: [], bothCompetitorsCount: 0,
  baseGapCounted: 2, baseGapMetros: { total: 2, perCompetitor: { Azure: 0, AWS: 1, GCP: 1 } },
  baseGapRegionCount: 2, baseSharedCount: 1, base: 'Azure', competitors: ['AWS', 'GCP'],
  metros: { Azure: 4, AWS: 3, GCP: 2 }, regionCount: { Azure: 4, AWS: 3, GCP: 2 }, activeCount: 3,
};

const analysis: WinnerAnalysis = {
  contenders: [],
  winners: {
    cost: { provider: 'AWS', sku: 'm7i.16xlarge', row: {} as never, pros: [], cons: [], score: 0 },
    compute: { provider: 'AWS', sku: 'm7i.16xlarge', row: {} as never, pros: [], cons: [], score: 0 },
    memory: { provider: 'Azure', sku: 'Standard_M64s', row: {} as never, pros: [], cons: [], score: 0 },
    network: null,
    overall: { provider: 'AWS', sku: 'm7i.16xlarge', row: {} as never, pros: [], cons: [], score: 0 },
  },
};
const horizons: HorizonCost[] = [
  { provider: 'Azure', sku: 'Standard_M64s', oneMonthBest: 1000, oneYearBest: 12000, threeYearBest: 30000, oneMonthPayg: 1000, oneYearPayg: 12000, threeYearPayg: 36000, bestRateLabel: '3y RI' },
  { provider: 'AWS', sku: 'm7i.16xlarge', oneMonthBest: 800, oneYearBest: 9600, threeYearBest: 24000, oneMonthPayg: 900, oneYearPayg: 10800, threeYearPayg: 32400, bestRateLabel: '3y RI' },
];
const bars: PriceBar[] = [
  { label: 'Azure', provider: 'Azure', sku: 'Standard_M64s', payg: 1.4, oneYr: 1.0, threeYr: 0.8, region: 'eastus', regionComparable: true },
  { label: 'AWS', provider: 'AWS', sku: 'm7i.16xlarge', payg: 1.2, oneYr: 0.9, threeYr: 0.7, region: 'af-south-1', regionComparable: false },
];
const compareRows = [
  { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'Standard_M64s', family: 'M-series', category: 'Memory Optimized', processor: 'Intel Xeon', processorSource: 'curated', vcpus: 64, memoryGib: 1024, networkMbps: 16000 }) },
  { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'm7i.16xlarge', family: 'm7i', category: 'General Purpose', processor: 'Intel Sapphire Rapids', vcpus: 64, memoryGib: 256, networkMbps: 37500, networkEstimated: true }) },
];

function comparisonModel() {
  return buildExecComparisonModel({
    analysis, horizons, bars,
    // S66 fix-b — real deltas so the restored spec-differences slide renders.
    awsDeltas: [
      { dim: 'memory', summary: 'AWS equivalent has 75% less memory (256 vs 1,024 GiB)', equivalentBetter: false },
      { dim: 'network', summary: 'AWS equivalent has 2.3x network bandwidth', equivalentBetter: true },
    ],
    gcpDeltas: [], markCount: 12,
    perProviderRegions: [{ provider: 'Azure', regions: 4 }, { provider: 'AWS', regions: 3 }],
    baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
    compareRows, specComparison: compareSpecs(compareRows.map((r) => r.row)),
    matchByProvider: { Azure: 100, AWS: 88 }, caveatsByProvider: {}, marketGapReport: gapReport,
  });
}

function bomModel() {
  const ported: BomPortResult = {
    baseProvider: 'Azure',
    baseScenario: { provider: 'Azure', lines: [{ baseVmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus', matchVmSizeName: 'Standard_M64s', matchPct: 100, matchQuality: 'exact', monthlyUsd: 900, hourlyUsd: 1.2, estimated: false }], monthlyTotalUsd: 900, hourlyTotalUsd: 1.2, matchedLines: 1, unmatchedLines: 0, pricedLines: 1, avgMatchPct: 100, anyEstimated: false },
    targetScenarios: [
      { provider: 'AWS', lines: [{ baseVmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus', matchVmSizeName: 'm7i.16xlarge', matchPct: 90, matchQuality: 'close', monthlyUsd: 738, hourlyUsd: 1.0, estimated: true }], monthlyTotalUsd: 738, hourlyTotalUsd: 1.0, matchedLines: 1, unmatchedLines: 0, pricedLines: 1, avgMatchPct: 90, anyEstimated: true },
    ],
    verdict: { cheapestProvider: 'AWS', headline: 'AWS is cheaper.', insights: ['Validate memory-critical lines.'] },
  };
  return buildExecBomModel({ ported, bom: [{ vmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus' }], regionsCovered: 1, term: '1y', marketGapReport: gapReport, marketGapNote: 'full-catalog view' });
}

async function docBuffer(doc: Awaited<ReturnType<typeof buildExecDocForTest>>): Promise<Buffer> {
  const docx = await import('docx');
  return docx.Packer.toBuffer(doc);
}

// ── S66 fix-b — XML inspection helpers (the artifacts are zip files) ────────
async function pptxSlidesXml(buf: Buffer | Uint8Array | ArrayBuffer): Promise<string> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buf as Uint8Array);
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const xmls = await Promise.all(names.map((n) => zip.files[n].async('string')));
  return xmls.join('\n');
}

async function docxXml(buf: Buffer): Promise<string> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buf);
  return zip.files['word/document.xml'].async('string');
}

async function comparisonDeckXml(): Promise<string> {
  return pptxSlidesXml(await buildExecDeckBufferForTest(comparisonModel()));
}

// ── S66 — the reproducible artifact-render path for QA ─────────────────────
const ARTIFACT_DIR = '/tmp/s66-exports';
const writeArtifacts = process.env.WRITE_EXPORT_ARTIFACTS === '1';

async function maybeWrite(name: string, bytes: Buffer | Uint8Array | ArrayBuffer) {
  if (!writeArtifacts) return;
  const fs = await import('node:fs');
  const path = await import('node:path');
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, name), Buffer.from(bytes as Uint8Array));
}

describe('exec export smoke — comparison mode', () => {
  it('DOCX packs to a non-empty buffer', async () => {
    const doc = await buildExecDocForTest(comparisonModel());
    const buf = await docBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(1000);
    await maybeWrite('comparison.docx', buf);
  });
  it('PPTX renders to a non-empty node buffer', async () => {
    const buf = await buildExecDeckBufferForTest(comparisonModel());
    expect((buf as Buffer).byteLength ?? (buf as Uint8Array).length).toBeGreaterThan(1000);
    await maybeWrite('comparison.pptx', buf as Buffer);
  });
});

describe('exec export smoke — BoM mode', () => {
  it('DOCX packs to a non-empty buffer', async () => {
    const doc = await buildExecDocForTest(bomModel());
    const buf = await docBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(1000);
    await maybeWrite('bom.docx', buf);
  });
  it('PPTX renders to a non-empty node buffer', async () => {
    const buf = await buildExecDeckBufferForTest(bomModel());
    expect((buf as Buffer).byteLength ?? (buf as Uint8Array).length).toBeGreaterThan(1000);
    await maybeWrite('bom.pptx', buf as Buffer);
  });
});

// ── S66 fix-b — content assertions on the rendered artifact XML ─────────────
describe('exec export S66 fix-b — comparison artifacts', () => {
  it('deck restores the situational best-at pills (provider strengths, no crown)', async () => {
    const xml = await comparisonDeckXml();
    expect(xml).toContain('SITUATIONAL STRENGTHS');
    expect(xml).toContain('AWS — Lowest rate');
    expect(xml).toContain('Azure — Most memory');
    expect(xml.toLowerCase()).not.toContain('winner');
  });

  it('deck restores the per-rate region + non-comparable disclosure (DOCX parity)', async () => {
    const xml = await comparisonDeckXml();
    expect(xml).toContain('Priced at: Azure eastus · AWS af-south-1');
    expect(xml).toContain('AWS priced at af-south-1 — not near the base region; nearest available.');
  });

  it('deck restores the spec-differences element (direction-marked, same content as the brief)', async () => {
    const xml = await comparisonDeckXml();
    expect(xml).toContain('Spec differences vs Azure Standard_M64s');
    expect(xml).toContain('AWS equivalent has 75% less memory');
    expect(xml).toContain('AWS equivalent has 2.3x network bandwidth');
  });

  it('deck cost table uses full-precision dollars (fmtUsdFull), not the k-scale', async () => {
    const xml = await comparisonDeckXml();
    expect(xml).toContain('$1,000'); // base monthly — fmtUsd would flatten to "$1.0k"
    expect(xml).toContain('$800');
    expect(xml).not.toContain('$1.0k');
  });

  it('deck slides are Arial-only', async () => {
    const xml = await comparisonDeckXml();
    const faces = [...xml.matchAll(/typeface="([^"]+)"/g)].map((m) => m[1]);
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every((f) => f === 'Arial')).toBe(true);
  });

  it('brief carries the Situational strengths line + full-precision decision dollars', async () => {
    const buf = await docBuffer(await buildExecDocForTest(comparisonModel()));
    const xml = await docxXml(buf);
    expect(xml).toContain('Situational strengths:');
    expect(xml).toContain('Lowest rate, Most compute');
    expect(xml).toContain('Most memory');
    expect(xml).toContain('$1,000');
    expect(xml).not.toContain('$1.0k');
  });

  it('parity (priced base, ~zero savings) prints the coin-flip read, never the provenance lie', async () => {
    // AWS ties the PRICED base to the penny; AWS is listed first so the tie
    // resolves to the rival — the exact shape that used to print "the Azure
    // base is unpriced in this feed".
    const tied = buildExecComparisonModel({
      analysis, bars: [],
      horizons: [
        { provider: 'AWS', sku: 'm7i.16xlarge', oneMonthBest: 1000, oneYearBest: 12000, threeYearBest: 30000, oneMonthPayg: 1100, oneYearPayg: 13200, threeYearPayg: 39600, bestRateLabel: '3y RI' },
        { provider: 'Azure', sku: 'Standard_M64s', oneMonthBest: 1000, oneYearBest: 12000, threeYearBest: 30000, oneMonthPayg: 1000, oneYearPayg: 12000, threeYearPayg: 36000, bestRateLabel: '3y RI' },
      ],
      awsDeltas: [], gcpDeltas: [], markCount: 1, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
    });
    expect(tied.verdictQuant!.cheapestProvider).toBe('AWS');
    expect(tied.verdictQuant!.savingsVsBaseUsd).toBe(0);
    const xml = await pptxSlidesXml(await buildExecDeckBufferForTest(tied));
    expect(xml).toContain('effectively at parity');
    expect(xml).not.toContain('unpriced in this feed');
    const dxml = await docxXml(await docBuffer(await buildExecDocForTest(tied)));
    expect(dxml).toContain('effectively at parity');
    expect(dxml).toContain('coin flip');
    expect(dxml).not.toContain('not priced in this feed');
  });
});

describe('exec export S66 fix-b — BoM artifacts', () => {
  it('brief quotes the qty-weighted avg match, labeled, and the deck recommendation matches', async () => {
    const m = bomModel();
    const dxml = await docxXml(await docBuffer(await buildExecDocForTest(m)));
    expect(dxml).toContain('spec match (qty-weighted)');
    const pxml = await pptxSlidesXml(await buildExecDeckBufferForTest(m));
    expect(pxml).toContain('qty-weighted spec parity');
  });

  it('give-up line is conditional: rival cheaper → "foregoes"; base cheapest → "least-cost home"', async () => {
    // Default fixture: AWS (738) undercuts the base (900) → the foregoes line.
    const m = bomModel();
    const dxml = await docxXml(await docBuffer(await buildExecDocForTest(m)));
    expect(dxml).toContain('Staying put foregoes the cheaper ported total above.');

    // Base-cheapest variant: the same artifact must NOT claim a foregone total.
    const cheapBase = bomModel();
    cheapBase.totals[0].monthlyUsd = 700;
    cheapBase.verdictQuant = { cheapestProvider: 'Azure', cheapestSku: 'Azure scenario', monthlyUsd: 700, savingsVsBaseUsd: 0, savingsVsBasePct: 0, term: '1y' };
    const dxml2 = await docxXml(await docBuffer(await buildExecDocForTest(cheapBase)));
    expect(dxml2).toContain('already the least-cost home');
    expect(dxml2).not.toContain('foregoes the cheaper ported total');
    const pxml2 = await pptxSlidesXml(await buildExecDeckBufferForTest(cheapBase));
    expect(pxml2).toContain('already the least-cost home');
    expect(pxml2).not.toContain('Foregoes the cheaper ported total');
  });

  it('unpriced base never yields a "$0/mo" headline — honest no-published-rates line instead', async () => {
    const ported: BomPortResult = {
      baseProvider: 'Azure',
      baseScenario: { provider: 'Azure', lines: [{ baseVmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus', matchVmSizeName: 'Standard_M64s', matchPct: 100, matchQuality: 'exact', monthlyUsd: null, hourlyUsd: null, estimated: false }], monthlyTotalUsd: 0, hourlyTotalUsd: 0, matchedLines: 1, unmatchedLines: 0, pricedLines: 0, avgMatchPct: 100, anyEstimated: false },
      targetScenarios: [
        { provider: 'AWS', lines: [{ baseVmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus', matchVmSizeName: 'm7i.16xlarge', matchPct: 90, matchQuality: 'close', monthlyUsd: 738, hourlyUsd: 1.0, estimated: true }], monthlyTotalUsd: 738, hourlyTotalUsd: 1.0, matchedLines: 1, unmatchedLines: 0, pricedLines: 1, avgMatchPct: 90, anyEstimated: true },
      ],
      // The engine's rankable sort can put the $0 base first — its headline lies.
      verdict: { cheapestProvider: 'Azure', headline: 'Azure is already the cheapest at $0/mo.', insights: [] },
    };
    const m = buildExecBomModel({ ported, bom: [{ vmSizeName: 'Standard_M64s', quantity: 2, region: 'eastus' }], regionsCovered: 1, term: '1y' });
    expect(m.verdict.headline).not.toContain('$0');
    const pxml = await pptxSlidesXml(await buildExecDeckBufferForTest(m));
    expect(pxml).not.toContain('$0/mo');
    expect(pxml).toContain('No published rates price this 1-line BoM on Azure');
    expect(pxml).toContain('directional');
    const dxml = await docxXml(await docBuffer(await buildExecDocForTest(m)));
    expect(dxml).not.toContain('$0/mo');
    expect(dxml).toContain('not priced in this feed');
  });

  it('BoM deck cost table uses full-precision dollars keyed to the verdict cheapest', async () => {
    const pxml = await pptxSlidesXml(await buildExecDeckBufferForTest(bomModel()));
    expect(pxml).toContain('$738');
    expect(pxml).toContain('$900');
    expect(pxml).toContain('+$162'); // Δ vs cheapest, full precision
  });
});

describe('exec export smoke — S66 leadership-arc fields', () => {
  it('comparison model carries the recommendation + scope', () => {
    const m = comparisonModel();
    expect(m.recommendation).toBeTruthy();
    const bullets = m.recommendation?.bullets ?? [];
    expect(bullets.length).toBeGreaterThanOrEqual(3);
    expect(bullets.length).toBeLessThanOrEqual(5);
    // AWS undercuts the priced Azure base → the cost call is a scoped adopt.
    expect(bullets[0].kind).toBe('adopt');
    expect(bullets[0].text).toContain('AWS');
    expect(bullets[0].text).toContain('3-year reserved');
    // Adopt is always paired with the stay-on-base counterweight.
    expect(bullets.some((b) => b.kind === 'stay')).toBe(true);
    expect(m.scope).toContain('Standard_M64s');
    expect(m.scope).toContain('3-year reserved');
  });
  it('bom model carries the recommendation + scope', () => {
    const m = bomModel();
    expect(m.recommendation).toBeTruthy();
    const bullets = m.recommendation?.bullets ?? [];
    expect(bullets.length).toBeGreaterThanOrEqual(3);
    expect(bullets[0].kind).toBe('adopt');
    expect(m.scope).toContain('1-line BoM ported from Azure to AWS');
    expect(m.scope).toContain('1-year reserved');
  });
});

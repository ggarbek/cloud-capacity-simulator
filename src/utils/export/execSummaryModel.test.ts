import { describe, it, expect } from 'vitest';
import {
  buildExecComparisonModel,
  buildExecBomModel,
  sanitizeForFilename,
  execFileBase,
  isoDate,
} from './execSummaryModel';
import { EXPORT_THEME } from './exportTheme';
import {
  buildVerdictQuant,
  buildFamilyStories,
  buildSizeShowdown,
  buildMarketGapsExport,
  buildLineHighlights,
  buildRecommendation,
  generationLine,
  formatNetworkGbps,
  fmtUsdFull,
  type MarketGapsExport,
  type VerdictQuant,
} from './execNarratives';
import { compareSpecs } from '../specInsights';
import type { WinnerAnalysis, HorizonCost, PriceBar, SpecDelta } from '../../engine/competitive';
import type { BomPortResult } from '../bomPort';
import type { BomEntry, CatalogEntry } from '../../types';
import type { MarketGapReport, CoverageLoc } from '../marketGaps';

// ── fixtures ────────────────────────────────────────────────────────────────
const analysis = (): WinnerAnalysis => ({
  contenders: [
    { provider: 'Azure', sku: 'Standard_M64s', row: {} as never, pros: [], cons: [], score: 1 },
    { provider: 'AWS', sku: 'm7i.16xlarge', row: {} as never, pros: [], cons: [], score: 2 },
  ],
  winners: {
    cost: { provider: 'AWS', sku: 'm7i.16xlarge', row: { hourlyUsd: 2.1 } as never, pros: [], cons: [], score: 0 },
    compute: { provider: 'AWS', sku: 'm7i.16xlarge', row: { vcpus: 64 } as never, pros: [], cons: [], score: 0 },
    memory: { provider: 'Azure', sku: 'Standard_M64s', row: { memoryGib: 1024 } as never, pros: [], cons: [], score: 0 },
    network: null,
    overall: { provider: 'AWS', sku: 'm7i.16xlarge', row: {} as never, pros: [], cons: [], score: 2 },
  },
});

const horizons = (): HorizonCost[] => [
  { provider: 'Azure', sku: 'Standard_M64s', oneMonthBest: 1000, oneYearBest: 12000, threeYearBest: 30000, oneMonthPayg: 1000, oneYearPayg: 12000, threeYearPayg: 36000, bestRateLabel: '3y RI' },
  { provider: 'AWS', sku: 'm7i.16xlarge', oneMonthBest: 800, oneYearBest: 9600, threeYearBest: 24000, oneMonthPayg: 900, oneYearPayg: 10800, threeYearPayg: 32400, bestRateLabel: '3y RI' },
];

const bars = (): PriceBar[] => [
  { label: 'Azure · Standard_M64s', provider: 'Azure', sku: 'Standard_M64s', payg: 1.4, oneYr: 1.0, threeYr: 0.8, region: 'eastus', regionComparable: true },
  { label: 'AWS · m7i.16xlarge', provider: 'AWS', sku: 'm7i.16xlarge', payg: 1.2, oneYr: 0.9, threeYr: 0.7, region: 'af-south-1', regionComparable: false },
];

const specDelta = (over: Partial<SpecDelta>): SpecDelta => ({ dim: 'vCPU', summary: 'AWS equivalent has 2× vCPU', equivalentBetter: true, ...over });

const scenario = (over: Partial<BomPortResult["baseScenario"]>): BomPortResult["baseScenario"] => {
  const s = {
    provider: "Azure",
    lines: [] as BomPortResult["baseScenario"]["lines"],
    monthlyTotalUsd: 0,
    hourlyTotalUsd: 0,
    matchedLines: 0,
    unmatchedLines: 0,
    avgMatchPct: null,
    anyEstimated: false,
    ...over,
  };
  // S66 FIX-A - derive unless the test overrides it explicitly.
  return { pricedLines: s.lines.filter((l) => l.monthlyUsd != null).length, ...s };
};

const line = (over: Partial<BomPortResult['baseScenario']['lines'][number]>): BomPortResult['baseScenario']['lines'][number] => ({
  baseVmSizeName: 'Standard_M64s',
  quantity: 1,
  region: 'eastus',
  matchVmSizeName: 'Standard_M64s',
  matchPct: 100,
  matchQuality: 'exact',
  monthlyUsd: 1000,
  hourlyUsd: 1.37,
  estimated: false,
  ...over,
});

const bomPort = (): BomPortResult => ({
  baseProvider: 'Azure',
  baseScenario: scenario({
    provider: 'Azure',
    monthlyTotalUsd: 1000,
    matchedLines: 1,
    avgMatchPct: 100,
    lines: [line({})],
  }),
  targetScenarios: [
    scenario({
      provider: 'AWS',
      monthlyTotalUsd: 800,
      matchedLines: 1,
      avgMatchPct: 90,
      anyEstimated: true,
      lines: [line({ matchVmSizeName: 'm7i.16xlarge', matchPct: 90, monthlyUsd: 800, estimated: true })],
    }),
  ],
  verdict: { cheapestProvider: 'AWS', headline: 'Re-platforming to AWS saves ~$200/mo (~20%).', insights: ['AWS equivalents average 90% spec-match — validate memory-critical lines.'] },
});

const bomEntries = (): BomEntry[] => [{ vmSizeName: 'Standard_M64s', quantity: 1, region: 'eastus' }];

// ── comparison builder ──────────────────────────────────────────────────────
describe('buildExecComparisonModel', () => {
  const build = () =>
    buildExecComparisonModel({
      analysis: analysis(),
      horizons: horizons(),
      bars: bars(),
      awsDeltas: [specDelta({})],
      gcpDeltas: [specDelta({ summary: 'GCP equivalent has 30% less memory', equivalentBetter: false, dim: 'memory' })],
      markCount: 12,
      perProviderRegions: [{ provider: 'Azure', regions: 5 }, { provider: 'AWS', regions: 7 }],
      baseline: 'Standard_M64s',
      baselineProvider: 'Azure',
      term: '3y',
    });

  it('carries mode + term + baseline', () => {
    const m = build();
    expect(m.mode).toBe('comparison');
    expect(m.term).toBe('3y');
    expect(m.baseline).toEqual({ provider: 'Azure', sku: 'Standard_M64s' });
  });

  it('maps the cost matrix with rate labels from the horizon', () => {
    const m = build();
    expect(m.costMatrix).toHaveLength(2);
    // S65 — paygMonthly carries the TRUE PAYG monthly (oneMonthPayg), distinct
    // from the term-applied `monthly` (oneMonthBest). Here Azure's PAYG monthly
    // is 1000 and AWS's is 900 (vs its 800 termed monthly).
    expect(m.costMatrix[0]).toMatchObject({ provider: 'Azure', monthly: 1000, paygMonthly: 1000, oneYear: 12000, threeYear: 30000, rateLabel: '3y RI' });
    expect(m.costMatrix[1]).toMatchObject({ provider: 'AWS', monthly: 800, paygMonthly: 900 });
  });

  it('S65 — commitment-economics callout math: PAYG annual vs 3-yr effective annual', () => {
    // The exact scenario Fix 4 pins: base PAYG $1/hr, 3-yr $0.6/hr. Monthly = ×730.
    // PAYG monthly 730 → PAYG annual 8760. 3-yr total = 0.6×730×36 = 15768; its
    // effective annual = /3 = 5256. annualSave = 8760 − 5256 = 3504 (~$3.5k/yr).
    const HR = 730;
    const m = buildExecComparisonModel({
      analysis: analysis(),
      horizons: [
        { provider: 'Azure', sku: 'E', oneMonthBest: 0.6 * HR, oneYearBest: 0.6 * HR * 12, threeYearBest: 0.6 * HR * 36, oneMonthPayg: 1.0 * HR, oneYearPayg: 1.0 * HR * 12, threeYearPayg: 1.0 * HR * 36, bestRateLabel: '3y RI' },
      ],
      bars: [], awsDeltas: [], gcpDeltas: [], markCount: 1, perProviderRegions: [],
      baseline: 'E', baselineProvider: 'Azure', term: '3y',
    });
    const base = m.costMatrix.find((c) => c.provider === 'Azure')!;
    const annualSave = base.paygMonthly! * 12 - base.threeYear! / 3;
    expect(annualSave).toBeCloseTo(3504, 0);
    expect(annualSave).toBeGreaterThan(0); // callout renders
  });

  it('computes cost delta = cheapest analog vs base monthly (negative when analog undercuts)', () => {
    const m = build();
    // base 1000, AWS 800 → (800-1000)/1000 = -20%
    expect(m.kpis.costDeltaPct).toBe(-20);
  });

  it('collects situational best-at tags per provider without a single winner crown', () => {
    const m = build();
    const aws = m.verdict.bestAt.find((b) => b.provider === 'AWS');
    const azure = m.verdict.bestAt.find((b) => b.provider === 'Azure');
    expect(aws?.tags).toEqual(expect.arrayContaining(['Lowest rate', 'Most compute']));
    expect(azure?.tags).toContain('Most memory');
    // headline never uses the word "winner"
    expect(m.verdict.headline.toLowerCase()).not.toContain('winner');
  });

  it('flattens spec deltas with direction + metric mapping', () => {
    const m = build();
    expect(m.specDeltas).toEqual([
      { provider: 'AWS', metric: 'vCPU', direction: 'more', detail: 'AWS equivalent has 2× vCPU' },
      { provider: 'GCP', metric: 'memory', direction: 'less', detail: 'GCP equivalent has 30% less memory' },
    ]);
  });

  it('propagates rate bars incl. non-comparable region flag', () => {
    const m = build();
    expect(m.rateBars[1]).toMatchObject({ provider: 'AWS', region: 'af-south-1', regionComparable: false });
  });

  it('carries footprint + marks', () => {
    const m = build();
    expect(m.footprint.totalMarks).toBe(12);
    expect(m.footprint.perProvider).toHaveLength(2);
    expect(m.kpis.regionCount).toBe(12);
  });

  it('populates caveats: the worst match caveat per contender + a region note, deduped', () => {
    // A bar/horizon carrying a stretch caveat → its detail is collected once
    // (deduped across the bar + horizon); the non-comparable AWS region → a note.
    const stretch = { kind: 'stretch-size', severity: 'warn', label: 'Stretch match', detail: 'The closest analog, but not a like-for-like swap — the sizes differ substantially.' } as const;
    const barsWithCaveat = bars().map((b) => (b.provider === 'AWS' ? { ...b, caveats: [stretch], stretch: true } : b));
    const horizonsWithCaveat = horizons().map((h) => (h.provider === 'AWS' ? { ...h, caveats: [stretch], stretch: true } : h));
    const m = buildExecComparisonModel({
      analysis: analysis(),
      horizons: horizonsWithCaveat,
      bars: barsWithCaveat,
      awsDeltas: [], gcpDeltas: [], markCount: 1, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
    });
    // Worst-caveat detail collected exactly once despite appearing on both bar + horizon.
    const stretchLines = m.caveats.filter((c) => c.includes('not a like-for-like swap'));
    expect(stretchLines).toHaveLength(1);
    expect(stretchLines[0]).toBe(`AWS: ${stretch.detail}`);
    // The non-comparable AWS region (af-south-1) contributes its own geographic note.
    expect(m.caveats.some((c) => c.includes('af-south-1') && c.includes('not a like-for-like geographic peer'))).toBe(true);
  });

  it('caveats stay empty for a clean comparison (no match caveats, all regions comparable)', () => {
    const cleanBars = bars().map((b) => ({ ...b, regionComparable: true }));
    const m = buildExecComparisonModel({
      analysis: analysis(), horizons: horizons(), bars: cleanBars,
      awsDeltas: [], gcpDeltas: [], markCount: 1, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
    });
    expect(m.caveats).toEqual([]);
  });

  it('is null-safe with empty analysis + horizons + bars', () => {
    const m = buildExecComparisonModel({
      analysis: { contenders: [], winners: { cost: null, compute: null, memory: null, network: null, overall: null } },
      horizons: [],
      bars: [],
      awsDeltas: [],
      gcpDeltas: [],
      markCount: 0,
      perProviderRegions: [],
      baseline: '',
      baselineProvider: 'Azure',
      term: 'payg',
    });
    expect(m.costMatrix).toEqual([]);
    expect(m.kpis.costDeltaPct).toBeNull();
    expect(m.verdict.bestAt).toEqual([]);
    expect(m.kpis.specMatchPct).toBeNull();
  });
});

// ── bom builder ─────────────────────────────────────────────────────────────
describe('buildExecBomModel', () => {
  const build = () => buildExecBomModel({ ported: bomPort(), bom: bomEntries(), regionsCovered: 3, term: '1y' });

  it('carries mode + term + baseProvider + regionsCovered', () => {
    const m = build();
    expect(m.mode).toBe('bom');
    expect(m.term).toBe('1y');
    expect(m.baseProvider).toBe('Azure');
    expect(m.regionsCovered).toBe(3);
  });

  it('maps per-cloud totals (base + targets) with estimated flag', () => {
    const m = build();
    expect(m.totals).toHaveLength(2);
    expect(m.totals[0]).toMatchObject({ provider: 'Azure', monthlyUsd: 1000, matched: 1, estimated: false });
    expect(m.totals[1]).toMatchObject({ provider: 'AWS', monthlyUsd: 800, avgMatchPct: 90, estimated: true });
  });

  it('maps every BoM line to per-cloud sku/match/price (base first, then targets)', () => {
    const m = build();
    expect(m.lines).toHaveLength(1);
    expect(m.lines[0]).toMatchObject({ index: 0, baseSku: 'Standard_M64s', qty: 1, region: 'eastus' });
    expect(m.lines[0].perCloud[0]).toMatchObject({ provider: 'Azure', sku: 'Standard_M64s', matchPct: 100, monthlyUsd: 1000 });
    expect(m.lines[0].perCloud[1]).toMatchObject({ provider: 'AWS', sku: 'm7i.16xlarge', matchPct: 90, monthlyUsd: 800 });
  });

  it('S66 fix-b — derives an honest gated headline (never the engine\'s raw one); cheapest + insights pass through', () => {
    const m = build();
    expect(m.verdict.cheapestProvider).toBe('AWS');
    expect(m.verdict.headline).toContain('AWS');
    // The engine's own headline ("Re-platforming to AWS saves ~$200/mo (~20%).")
    // is NEVER passed through — the model derives the sentence from the same
    // gated verdict math the screen uses, with full-precision dollars.
    expect(m.verdict.headline).not.toBe(bomPort().verdict.headline);
    expect(m.verdict.headline).toContain('Porting this 1-line BoM to AWS');
    expect(m.verdict.headline).toContain('$800/mo');
    expect(m.verdict.headline).toContain('$200/mo (20%) below Azure');
    expect(m.verdict.insights).toHaveLength(1);
  });

  it('populates caveats from the target scenario signals (estimated rate; and stretch/unmatched when present)', () => {
    // The default AWS target has anyEstimated=true and avgMatchPct 90 (clean),
    // so only the estimated-rate caveat surfaces.
    const m = build();
    expect(m.caveats.some((c) => c.includes('AWS') && c.includes('estimated from PAYG'))).toBe(true);
    expect(m.caveats.some((c) => c.includes('stretch'))).toBe(false);

    // A weak-match + unmatched-lines scenario → both a stretch and an unmatched note.
    const weak = bomPort();
    weak.targetScenarios[0] = { ...weak.targetScenarios[0], avgMatchPct: 42, unmatchedLines: 2, anyEstimated: false };
    const m2 = buildExecBomModel({ ported: weak, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m2.caveats.some((c) => c.includes('2 lines have no same-category equivalent'))).toBe(true);
    expect(m2.caveats.some((c) => c.includes('average only 42% match'))).toBe(true);
  });

  it('caveats stay empty for a clean BoM port (all matched, strong match, real rates)', () => {
    const clean = bomPort();
    clean.targetScenarios[0] = { ...clean.targetScenarios[0], avgMatchPct: 95, unmatchedLines: 0, anyEstimated: false };
    const m = buildExecBomModel({ ported: clean, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m.caveats).toEqual([]);
  });

  it('is null-safe with an empty BoM', () => {
    const empty = bomPort();
    empty.baseScenario.lines = [];
    empty.targetScenarios[0].lines = [];
    const m = buildExecBomModel({ ported: empty, bom: [], regionsCovered: 0, term: 'payg' });
    expect(m.lines).toEqual([]);
    expect(m.totals).toHaveLength(2);
  });
});

// ── theme + filename ────────────────────────────────────────────────────────
describe('exportTheme', () => {
  it('every hex value omits the leading #', () => {
    for (const [key, val] of Object.entries(EXPORT_THEME)) {
      expect(val, `${key} should not start with #`).not.toMatch(/^#/);
      expect(val, `${key} should be a 6-digit hex`).toMatch(/^[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('sanitizeForFilename + execFileBase', () => {
  it('sanitizes spaces, slashes and special chars to hyphens, lowercased', () => {
    expect(sanitizeForFilename('Standard_M64s / v2 (big)')).toBe('standard_m64s-v2-big');
    expect(sanitizeForFilename('  a__b  ')).toBe('a__b');
  });

  it('builds the comparison filename base', () => {
    const m = buildExecComparisonModel({
      analysis: analysis(), horizons: horizons(), bars: bars(), awsDeltas: [], gcpDeltas: [],
      markCount: 1, perProviderRegions: [], baseline: 'Standard_M64s', baselineProvider: 'Azure', term: 'payg',
    });
    expect(execFileBase(m)).toBe(`cma-exec-azure-standard_m64s-${isoDate(m.generatedAt)}`);
  });

  it('builds the bom filename base with line count', () => {
    const m = buildExecBomModel({ ported: bomPort(), bom: bomEntries(), regionsCovered: 1, term: 'payg' });
    expect(execFileBase(m)).toBe(`cma-bom-azure-1lines-${isoDate(m.generatedAt)}`);
  });
});

// ── S65 — executive intelligence enrichment ─────────────────────────────────

/** Minimal CatalogEntry factory (only the fields the narratives read). */
const vm = (over: Partial<CatalogEntry>): CatalogEntry => ({
  vmSizeName: 'x',
  vmGeneration: 'v1' as never,
  series: 'X',
  memoryCategory: 'Medium Memory (MM)',
  homeHardwareGroup: '',
  spilloverTarget: 'N/A',
  processor: '',
  vcpus: 0,
  memoryGib: 0,
  networkMbps: 0,
  localDiskGib: 0,
  status: '',
  notes: '',
  ...over,
});

/** A synthetic base-Azure MarketGapReport exercising the export mapping. */
const gapLoc = (city: string, country: string, owner: 'Azure' | 'AWS' | 'GCP', region: string): CoverageLoc => ({
  city,
  country,
  superGeo: 'Americas' as never,
  region,
  owner,
  regionByProvider: { [owner]: region } as never,
});
const gapReport = (over: Partial<MarketGapReport> = {}): MarketGapReport => ({
  all: 3,
  twoPlus: 1,
  totalPlaces: 5,
  allList: [gapLoc('Virginia', 'US', 'Azure', 'East US')],
  twoPlusList: [],
  exclusive: {
    Azure: [gapLoc('Zurich', 'CH', 'Azure', 'Switzerland North')],
    AWS: [gapLoc('Sydney', 'AU', 'AWS', 'ap-southeast-2'), gapLoc('Jakarta', 'ID', 'AWS', 'ap-southeast-3')],
    GCP: [gapLoc('Santiago', 'CL', 'GCP', 'southamerica-west1')],
  },
  sharedByBase: {
    Azure: [],
    AWS: [gapLoc('Singapore', 'SG', 'Azure', 'Southeast Asia')],
    GCP: [],
  },
  // S65 — competitorGap is now the SOLE source buildMarketGapsExport reads (the
  // base-absent sole-competitor metros). Mirrors the exclusives here: AWS Sydney +
  // Jakarta, GCP Santiago — 2 + 1 = 3 metros.
  competitorGap: {
    Azure: [],
    AWS: [gapLoc('Sydney', 'AU', 'AWS', 'ap-southeast-2'), gapLoc('Jakarta', 'ID', 'AWS', 'ap-southeast-3')],
    GCP: [gapLoc('Santiago', 'CL', 'GCP', 'southamerica-west1')],
  },
  bothCompetitors: [],
  bothCompetitorsCount: 0,
  baseGapCounted: 3,
  baseGapMetros: { total: 3, perCompetitor: { Azure: 0, AWS: 2, GCP: 1 } },
  baseGapRegionCount: 3,
  baseSharedCount: 1,
  base: 'Azure',
  competitors: ['AWS', 'GCP'],
  metros: { Azure: 5, AWS: 4, GCP: 3 },
  regionCount: { Azure: 5, AWS: 4, GCP: 3 },
  activeCount: 3,
  ...over,
});

describe('buildVerdictQuant', () => {
  it('picks the cheapest priced candidate + savings vs base', () => {
    const v = buildVerdictQuant(
      [
        { provider: 'Azure', sku: 'a', monthlyUsd: 1000 },
        { provider: 'AWS', sku: 'b', monthlyUsd: 820 },
        { provider: 'GCP', sku: 'c', monthlyUsd: null },
      ],
      1000,
      '3y',
    );
    expect(v).not.toBeNull();
    expect(v!.cheapestProvider).toBe('AWS');
    expect(v!.cheapestSku).toBe('b');
    expect(v!.monthlyUsd).toBe(820);
    expect(v!.savingsVsBaseUsd).toBe(180);
    expect(v!.savingsVsBasePct).toBe(18);
    expect(v!.term).toBe('3y');
  });

  it('is null-safe when the base is unpriced (savings stay null)', () => {
    const v = buildVerdictQuant([{ provider: 'AWS', sku: 'b', monthlyUsd: 500 }], null, 'payg');
    expect(v!.savingsVsBaseUsd).toBeNull();
    expect(v!.savingsVsBasePct).toBeNull();
  });

  it('returns null when nothing is priced', () => {
    expect(buildVerdictQuant([{ provider: 'AWS', sku: 'b', monthlyUsd: null }], 1000, '1y')).toBeNull();
  });
});

// ── S66 fix-b — full-precision decision dollars ─────────────────────────────
describe('fmtUsdFull', () => {
  it('comma-groups exact dollars so near-tied totals stay distinguishable', () => {
    expect(fmtUsdFull(12340)).toBe('$12,340');
    expect(fmtUsdFull(12344)).toBe('$12,344'); // fmtUsd would flatten both to "$12k"
    expect(fmtUsdFull(1000)).toBe('$1,000');
  });
  it('keeps cents under $100 and never fabricates a null', () => {
    expect(fmtUsdFull(85.5)).toBe('$85.50');
    expect(fmtUsdFull(null)).toBe('—');
    expect(fmtUsdFull(undefined)).toBe('—');
  });
});

describe('generationLine', () => {
  it('marks a curated processor with "(assumed)"', () => {
    expect(generationLine(vm({ processor: 'Intel Xeon Platinum 8370C', processorSource: 'curated' }))).toContain('(assumed)');
  });
  it('does not mark a vendor-published processor', () => {
    expect(generationLine(vm({ processor: 'AWS Graviton3', processorSource: 'vendor' }))).not.toContain('(assumed)');
  });
});

describe('buildFamilyStories', () => {
  const rows = [
    { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'Standard_M64s', family: 'M-series', category: 'Memory Optimized', processor: 'Intel Xeon', processorSource: 'curated', vcpus: 64, memoryGib: 1024, networkMbps: 16000 }) },
    { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'm7i.16xlarge', family: 'm7i', category: 'General Purpose', processor: 'Intel Sapphire Rapids', processorSource: 'vendor', vcpus: 64, memoryGib: 256, networkMbps: 37500 }) },
  ];
  const comparison = compareSpecs(rows.map((r) => r.row));

  it('caps strengths at 3 and carries family/category/generation', () => {
    const stories = buildFamilyStories(rows, comparison, { Azure: 100, AWS: 88 }, {});
    expect(stories).toHaveLength(2);
    const azure = stories[0];
    expect(azure.family).toBe('M-series');
    expect(azure.category).toBe('Memory Optimized');
    expect(azure.generation).toContain('(assumed)');
    expect(azure.strengths.length).toBeLessThanOrEqual(3);
    expect(azure.matchPct).toBe(100);
    const aws = stories[1];
    expect(aws.matchPct).toBe(88);
  });

  it('propagates the worst comparability caveat per provider', () => {
    const caveat = { kind: 'stretch-size', severity: 'warn', label: 'Stretch', detail: 'Sizes differ substantially.' } as never;
    const stories = buildFamilyStories(rows, comparison, { Azure: 100, AWS: 60 }, { AWS: [caveat] });
    expect(stories[0].caveat).toBeNull();
    expect(stories[1].caveat).toBe('Sizes differ substantially.');
  });

  it('always yields at least one strength (falls back to best-for)', () => {
    const lone = [{ provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'X', vcpus: 4, memoryGib: 16 }) }];
    const stories = buildFamilyStories(lone, compareSpecs(lone.map((r) => r.row)), { Azure: 100 }, {});
    expect(stories[0].strengths.length).toBeGreaterThanOrEqual(1);
  });
});

describe('buildSizeShowdown', () => {
  const rows = [
    { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'a', vcpus: 64, memoryGib: 1024, networkMbps: 16000, localDiskGib: 0, processor: 'Intel', processorSource: 'curated' }) },
    { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'b', vcpus: 64, memoryGib: 256, networkMbps: 37500, localDiskGib: 3800, networkEstimated: true }) },
  ];

  it('picks HIGHEST as best for specs and LOWEST for cost', () => {
    const sd = buildSizeShowdown(rows, { Azure: 1000, AWS: 820 });
    const mem = sd.rows.find((r) => r.label === 'Memory')!;
    expect(mem.bestProvider).toBe('Azure'); // 1024 > 256 GiB
    const net = sd.rows.find((r) => r.label === 'Network')!;
    expect(net.bestProvider).toBe('AWS'); // 37.5 > 16 Gbps
    const cost = sd.rows.find((r) => r.label === 'Monthly cost')!;
    expect(cost.bestProvider).toBe('AWS'); // 820 < 1000
  });

  it('keeps est./assumed markers on the cell strings', () => {
    const sd = buildSizeShowdown(rows, { Azure: 1000, AWS: 820 });
    const net = sd.rows.find((r) => r.label === 'Network')!;
    expect(String(net.byProvider.AWS)).toContain('(est.)');
    const proc = sd.rows.find((r) => r.label === 'Processor')!;
    expect(String(proc.byProvider.Azure)).toContain('(assumed)');
    expect(proc.bestProvider).toBeNull(); // processor row has no "best"
  });

  it('ties yield no best cell', () => {
    const tied = [
      { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'a', vcpus: 8, memoryGib: 32 }) },
      { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'b', vcpus: 8, memoryGib: 32 }) },
    ];
    const sd = buildSizeShowdown(tied, { Azure: null, AWS: null });
    expect(sd.rows.find((r) => r.label === 'vCPUs')!.bestProvider).toBeNull();
  });

  it('S65 — small / fractional networks keep one decimal, whole ints stay clean', () => {
    // 400 Mbps = 0.4 Gbps (was rounding to "0"); 12500 = 12.5 (was "13");
    // 100000 = 100 (stays integer, no trailing ".0").
    expect(formatNetworkGbps(400)).toBe('0.4');
    expect(formatNetworkGbps(12500)).toBe('12.5');
    expect(formatNetworkGbps(100000)).toBe('100');
    expect(formatNetworkGbps(50000)).toBe('50');
    // And the size-showdown Network row uses it, so a 400 Mbps NIC no longer reads 0.
    const rows = [
      { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'a', vcpus: 2, memoryGib: 8, networkMbps: 400 }) },
      { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'b', vcpus: 2, memoryGib: 8, networkMbps: 12500 }) },
    ];
    const sd = buildSizeShowdown(rows, { Azure: null, AWS: null });
    const net = sd.rows.find((r) => r.label === 'Network')!;
    expect(net.byProvider.Azure).toBe('0.4');
    expect(net.byProvider.AWS).toBe('12.5');
  });
});

describe('buildMarketGapsExport', () => {
  it('maps competitor-only metros to per-competitor examples (base-POV)', () => {
    const g = buildMarketGapsExport(gapReport());
    expect(g.base).toBe('Azure');
    expect(g.sharedByAll).toBe(3);
    const aws = g.perCompetitor.find((c) => c.provider === 'AWS')!;
    // Sydney + Jakarta are AWS-exclusive metros the base does not serve.
    expect(aws.count).toBe(2);
    expect(aws.examples).toEqual(['Jakarta', 'Sydney']); // sorted, city names
    const gcp = g.perCompetitor.find((c) => c.provider === 'GCP')!;
    expect(gcp.examples).toEqual(['Santiago']);
    expect(g.gapCount).toBe(3);
  });

  it('reads competitorGap only — a base-served metro never appears as a gap', () => {
    // S65 — buildMarketGapsExport sources from competitorGap, which the report
    // builder guarantees is base-absent. A metro the base serves is, by
    // construction, NOT in competitorGap, so it can never be a gap. Empty
    // competitorGap for AWS → zero gaps (baseGapMetros drives the count).
    const rep = gapReport({
      competitorGap: { Azure: [], AWS: [], GCP: [gapLoc('Santiago', 'CL', 'GCP', 'southamerica-west1')] },
      baseGapMetros: { total: 1, perCompetitor: { Azure: 0, AWS: 0, GCP: 1 } },
    });
    const g = buildMarketGapsExport(rep);
    const aws = g.perCompetitor.find((c) => c.provider === 'AWS')!;
    expect(aws.count).toBe(0);
    expect(g.gapCount).toBe(1);
  });

  it('caps examples at 3 with a "+N more" implied by count (metro-deduped)', () => {
    const many = Array.from({ length: 5 }, (_, i) => gapLoc(`City${i}`, 'US', 'AWS', `r${i}`));
    const rep = gapReport({
      competitorGap: { Azure: [], AWS: many, GCP: [] },
      baseGapMetros: { total: 5, perCompetitor: { Azure: 0, AWS: 5, GCP: 0 } },
    });
    const g = buildMarketGapsExport(rep);
    const aws = g.perCompetitor.find((c) => c.provider === 'AWS')!;
    expect(aws.count).toBe(5);
    expect(aws.examples).toHaveLength(3);
  });

  it('metro-dedupes: two regions of one competitor in the same metro count once', () => {
    // Two GCP regions in the SAME metro (Osaka) → one gap metro. The count comes
    // from baseGapMetros (metro unit), not the region-level competitorGap length.
    const rep = gapReport({
      competitorGap: {
        Azure: [],
        AWS: [],
        GCP: [gapLoc('Osaka', 'JP', 'GCP', 'asia-northeast2'), gapLoc('Osaka', 'JP', 'GCP', 'asia-northeast2-b')],
      },
      baseGapMetros: { total: 1, perCompetitor: { Azure: 0, AWS: 0, GCP: 1 } },
    });
    const g = buildMarketGapsExport(rep);
    const gcp = g.perCompetitor.find((c) => c.provider === 'GCP')!;
    expect(gcp.count).toBe(1); // one metro, not two regions
    expect(gcp.examples).toEqual(['Osaka']);
    expect(g.gapCount).toBe(1);
  });

  it('carries a note through', () => {
    expect(buildMarketGapsExport(gapReport(), 'full-catalog view').note).toBe('full-catalog view');
  });
});

describe('buildLineHighlights', () => {
  const lines = [
    { index: 0, baseSku: 'small', baseMonthlyUsd: 100, perCloud: [{ provider: 'Azure', monthlyUsd: 100 }, { provider: 'AWS', monthlyUsd: 90 }] },
    { index: 1, baseSku: 'big', baseMonthlyUsd: 900, perCloud: [{ provider: 'Azure', monthlyUsd: 900 }, { provider: 'AWS', monthlyUsd: 738 }] },
  ];

  it('ranks by base-cost share and quantifies the cheaper cloud', () => {
    const hi = buildLineHighlights(lines, 'Azure');
    // "big" is 90% of the $1000 total → first.
    expect(hi[0].index).toBe(1);
    expect(hi[0].insight).toContain('90%');
    expect(hi[0].insight).toContain('AWS is 18% cheaper'); // (900-738)/900 = 18%
  });

  it('caps at 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ index: i, baseSku: `s${i}`, baseMonthlyUsd: 100, perCloud: [{ provider: 'Azure', monthlyUsd: 100 }] }));
    expect(buildLineHighlights(many, 'Azure')).toHaveLength(5);
  });

  it('returns empty when nothing is priced', () => {
    expect(buildLineHighlights([{ index: 0, baseSku: 'x', baseMonthlyUsd: null, perCloud: [] }], 'Azure')).toEqual([]);
  });

  it('notes when the base is already cheapest on a line', () => {
    const l = [{ index: 0, baseSku: 'x', baseMonthlyUsd: 100, perCloud: [{ provider: 'Azure', monthlyUsd: 100 }, { provider: 'AWS', monthlyUsd: 120 }] }];
    expect(buildLineHighlights(l, 'Azure')[0].insight).toContain('Azure is already the cheapest');
  });
});

// ── S65 — enrichment wired through the model builders ───────────────────────
describe('buildExecComparisonModel — S65 enrichment', () => {
  const rows = [
    { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'Standard_M64s', family: 'M-series', category: 'Memory Optimized', vcpus: 64, memoryGib: 1024, networkMbps: 16000 }) },
    { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'm7i.16xlarge', family: 'm7i', category: 'General Purpose', vcpus: 64, memoryGib: 256, networkMbps: 37500 }) },
  ];
  const build = () =>
    buildExecComparisonModel({
      analysis: analysis(), horizons: horizons(), bars: bars(),
      awsDeltas: [], gcpDeltas: [], markCount: 12, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
      compareRows: rows,
      specComparison: compareSpecs(rows.map((r) => r.row)),
      matchByProvider: { Azure: 100, AWS: 88 },
      caveatsByProvider: {},
      marketGapReport: gapReport(),
    });

  it('adds verdictQuant from the horizons (AWS 800 vs base 1000 = -20%)', () => {
    const m = build();
    expect(m.verdictQuant).toBeDefined();
    expect(m.verdictQuant!.cheapestProvider).toBe('AWS');
    expect(m.verdictQuant!.savingsVsBasePct).toBe(20);
  });

  it('adds familyStories + sizeShowdown + marketGaps and folds the gap count into KPIs', () => {
    const m = build();
    expect(m.familyStories).toHaveLength(2);
    expect(m.sizeShowdown!.rows.length).toBeGreaterThan(0);
    expect(m.marketGaps!.gapCount).toBe(3);
    expect(m.kpis.marketGaps).toBe(3);
  });

  it('omits the enrichment when no compareRows are supplied (back-compat)', () => {
    const m = buildExecComparisonModel({
      analysis: analysis(), horizons: horizons(), bars: bars(),
      awsDeltas: [], gcpDeltas: [], markCount: 1, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
    });
    expect(m.familyStories).toBeUndefined();
    expect(m.sizeShowdown).toBeUndefined();
    expect(m.marketGaps).toBeUndefined();
    // verdictQuant still derives from the horizons alone.
    expect(m.verdictQuant).toBeDefined();
  });
});

describe('buildExecBomModel — S65 enrichment', () => {
  it('adds verdictQuant (cheapest scenario total vs base) + lineHighlights', () => {
    const m = buildExecBomModel({ ported: bomPort(), bom: bomEntries(), regionsCovered: 3, term: '1y', marketGapReport: gapReport(), marketGapNote: 'full-catalog view' });
    expect(m.verdictQuant!.cheapestProvider).toBe('AWS'); // 800 < base 1000
    expect(m.verdictQuant!.savingsVsBasePct).toBe(20);
    expect(m.lineHighlights).toBeDefined();
    expect(m.lineHighlights![0].insight).toContain('100%'); // single line = 100% of cost
    expect(m.marketGaps!.note).toBe('full-catalog view');
  });
});

// ── S66 fix-b — honest gates on the BoM verdict path ────────────────────────
describe('buildExecBomModel — S66 fix-b honest gates', () => {
  it('unpriced base → headline states the missing base rate; never "$0/mo", never a savings claim', () => {
    const unpriced = bomPort();
    unpriced.baseScenario = {
      ...unpriced.baseScenario,
      monthlyTotalUsd: 0,
      lines: [line({ monthlyUsd: null, hourlyUsd: null as never })],
    };
    // The engine's rankable sort would put the $0 base first and its headline
    // could claim "already the cheapest at $0/mo" — the model must not repeat it.
    unpriced.verdict = { cheapestProvider: 'Azure', headline: 'Azure is already the cheapest at $0/mo.', insights: [] };
    const m = buildExecBomModel({ ported: unpriced, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m.verdict.headline).not.toContain('$0');
    expect(m.verdict.headline).toContain('No published rates price this 1-line BoM on Azure');
    expect(m.verdict.headline).toContain('directional');
    expect(m.verdictQuant!.savingsVsBaseUsd).toBeNull();
  });

  it('nothing priced anywhere → honest totals-unavailable headline', () => {
    const empty = bomPort();
    empty.baseScenario = { ...empty.baseScenario, monthlyTotalUsd: 0 };
    empty.targetScenarios = [{ ...empty.targetScenarios[0], monthlyTotalUsd: 0 }];
    const m = buildExecBomModel({ ported: empty, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m.verdictQuant).toBeUndefined();
    expect(m.verdict.headline).toContain('No published rates');
    expect(m.verdict.headline).toContain('totals unavailable');
  });

  it('base cheapest → "least-cost home" headline with full-precision dollars', () => {
    const baseWins = bomPort();
    baseWins.baseScenario = { ...baseWins.baseScenario, monthlyTotalUsd: 700 };
    const m = buildExecBomModel({ ported: baseWins, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m.verdict.headline).toContain('Azure is already the least-cost home');
    expect(m.verdict.headline).toContain('$700/mo');
    expect(m.savingsSuppressed).toBe(false);
  });

  it('cheapest rival total undercounted by unmatched lines → savings suppressed + disclosed, no "$X below"', () => {
    const gapped = bomPort();
    gapped.targetScenarios[0] = { ...gapped.targetScenarios[0], unmatchedLines: 2, matchedLines: 1 };
    const m = buildExecBomModel({ ported: gapped, bom: bomEntries(), regionsCovered: 1, term: '1y' });
    expect(m.savingsSuppressed).toBe(true);
    expect(m.suppressReason).toContain('AWS total excludes 2 unmatched lines');
    // The savings fields are nulled so NO artifact can print "$X below base".
    expect(m.verdictQuant!.savingsVsBaseUsd).toBeNull();
    expect(m.verdictQuant!.savingsVsBasePct).toBeNull();
    expect(m.verdict.headline).toContain('not directly comparable');
    expect(m.verdict.headline).not.toContain('below Azure');
    // Disclosed in the Risks list…
    expect(m.caveats.some((c) => c.includes('Savings vs Azure not stated'))).toBe(true);
    // …and the recommendation's cost call degrades to an honest watch bullet.
    expect(m.recommendation!.bullets[0].kind).toBe('watch');
    expect(m.recommendation!.bullets[0].text).toContain('no savings figure is stated');
    expect(m.recommendation!.bullets.map((b) => b.kind)).not.toContain('adopt');
  });

  it('avgTargetMatchPct is the QTY-WEIGHTED match (screen === deck), not the mean of per-cloud averages', () => {
    const ported = bomPort();
    // Two lines: qty 1 at 100% and qty 9 at 50% → weighted (100·1 + 50·9)/10 = 55.
    // The scenario's own avgMatchPct (75, the unweighted per-line mean) must NOT win.
    ported.baseScenario = {
      ...ported.baseScenario,
      lines: [line({}), line({ baseVmSizeName: 'Standard_M32ts', quantity: 9 })],
      matchedLines: 2,
      pricedLines: 2, // S66 FIX-A — raw spread must keep pricedLines in sync with lines
    };
    ported.targetScenarios[0] = {
      ...ported.targetScenarios[0],
      lines: [
        line({ matchVmSizeName: 'm7i.16xlarge', matchPct: 100, monthlyUsd: 400 }),
        line({ matchVmSizeName: 'm7i.8xlarge', matchPct: 50, monthlyUsd: 300, quantity: 9 }),
      ],
      matchedLines: 2,
      pricedLines: 2, // S66 FIX-A — raw spread must keep pricedLines in sync with lines
      avgMatchPct: 75,
    };
    const bom: BomEntry[] = [
      { vmSizeName: 'Standard_M64s', quantity: 1, region: 'eastus' },
      { vmSizeName: 'Standard_M32ts', quantity: 9, region: 'eastus' },
    ];
    const m = buildExecBomModel({ ported, bom, regionsCovered: 1, term: '1y' });
    expect(m.avgTargetMatchPct).toBe(55);
    // The adopt bullet quotes the weighted figure, labeled qty-weighted.
    expect(m.recommendation!.bullets[0].kind).toBe('adopt');
    expect(m.recommendation!.bullets[0].text).toContain('55% qty-weighted spec parity');
  });
});

// ── S66 — the leadership recommendation builder ─────────────────────────────
describe('buildRecommendation', () => {
  const verdict = (over: Partial<VerdictQuant>): VerdictQuant => ({
    cheapestProvider: 'AWS',
    cheapestSku: 'm7i.16xlarge',
    monthlyUsd: 800,
    savingsVsBaseUsd: 200,
    savingsVsBasePct: 20,
    term: '3y',
    ...over,
  });
  const gaps = (over: Partial<MarketGapsExport>): MarketGapsExport => ({
    base: 'Azure',
    gapCount: 3,
    perCompetitor: [{ provider: 'AWS', count: 2, examples: ['Sydney', 'Calgary'] }, { provider: 'GCP', count: 1, examples: ['Santiago'] }],
    sharedByAll: 2,
    ...over,
  });
  const base = {
    baseProvider: 'Azure',
    baseLabel: 'Azure Standard_M64s',
    workload: 'memory optimized workloads',
    term: '3y',
    verdict: verdict({}),
    avgMatchPct: 88,
    caveats: ['AWS: closest alternative — different architecture'],
    marketGaps: gaps({}),
  };

  it('rival cheaper than a priced base → scoped adopt + stay counterweight + validate + watch', () => {
    const rec = buildRecommendation(base);
    const kinds = rec.bullets.map((b) => b.kind);
    expect(kinds[0]).toBe('adopt');
    expect(kinds).toContain('stay');
    expect(kinds).toContain('validate');
    expect(kinds[kinds.length - 1]).toBe('watch');
    expect(rec.bullets.length).toBeGreaterThanOrEqual(3);
    expect(rec.bullets.length).toBeLessThanOrEqual(5);
    // The adopt bullet quantifies with the SAME screen formatters + is scoped.
    expect(rec.bullets[0].text).toContain('$200/mo');
    expect(rec.bullets[0].text).toContain('20%');
    expect(rec.bullets[0].text).toContain('3-year reserved');
    expect(rec.bullets[0].text).toContain('88% spec parity');
    expect(rec.bullets[0].text).toContain('memory optimized workloads');
    // Never an unconditional crown.
    expect(rec.bullets[0].text.toLowerCase()).not.toContain('winner');
  });

  it('base already cheapest → stay, no adopt', () => {
    const rec = buildRecommendation({ ...base, verdict: verdict({ cheapestProvider: 'Azure', cheapestSku: 'Standard_M64s', savingsVsBaseUsd: 0, savingsVsBasePct: 0, monthlyUsd: 1000 }) });
    expect(rec.bullets[0].kind).toBe('stay');
    expect(rec.bullets[0].text).toContain('already the least-cost');
    expect(rec.bullets.map((b) => b.kind)).not.toContain('adopt');
  });

  it('unpriced base can NEVER yield an adopt call — degrades to directional watch', () => {
    const rec = buildRecommendation({ ...base, verdict: verdict({ savingsVsBaseUsd: null, savingsVsBasePct: null }) });
    expect(rec.bullets[0].kind).toBe('watch');
    expect(rec.bullets[0].text).toContain('directional');
    expect(rec.bullets.map((b) => b.kind)).not.toContain('adopt');
  });

  it('S66 fix-b — a PRICED base at ~zero savings reads as parity, never the "not priced in this feed" lie', () => {
    // A rounded-to-zero undercut (or an exact tie) with a PRICED base: savings
    // are non-null (the base had a price) but not > 0.
    const rec = buildRecommendation({ ...base, verdict: verdict({ savingsVsBaseUsd: 0, savingsVsBasePct: 0 }) });
    expect(rec.bullets[0].kind).toBe('watch');
    expect(rec.bullets[0].text).toContain('effectively at parity');
    expect(rec.bullets[0].text).toContain('coin flip');
    expect(rec.bullets[0].text).not.toContain('not priced in this feed');
    expect(rec.bullets.map((b) => b.kind)).not.toContain('adopt');
  });

  it('S66 fix-b — suppressed savings degrade the cost call to a watch naming the reason', () => {
    const rec = buildRecommendation({
      ...base,
      verdict: verdict({ savingsVsBaseUsd: null, savingsVsBasePct: null }),
      savingsSuppressed: true,
      suppressReason: 'the AWS total excludes 2 unmatched lines',
    });
    expect(rec.bullets[0].kind).toBe('watch');
    expect(rec.bullets[0].text).toContain('the AWS total excludes 2 unmatched lines');
    expect(rec.bullets[0].text).toContain('no savings figure is stated');
    expect(rec.bullets.map((b) => b.kind)).not.toContain('adopt');
  });

  it('S66 fix-b — the matchQualifier labels the parity figure ("qty-weighted")', () => {
    const rec = buildRecommendation({ ...base, matchQualifier: 'qty-weighted' });
    expect(rec.bullets[0].kind).toBe('adopt');
    expect(rec.bullets[0].text).toContain('88% qty-weighted spec parity');
    // Decision dollars are full-precision (comma-grouped exact dollars).
    expect(rec.bullets[0].text).toContain('$200/mo');
  });

  it('nothing priced → honest watch fallback, still 3+ bullets', () => {
    const rec = buildRecommendation({ ...base, verdict: null, caveats: [], marketGaps: gaps({}) });
    expect(rec.bullets[0].kind).toBe('watch');
    expect(rec.bullets[0].text).toContain('No option in this set is priced');
    expect(rec.bullets.length).toBeGreaterThanOrEqual(3);
  });

  it('zero market gaps → honest "not a blocker" closer', () => {
    const rec = buildRecommendation({ ...base, marketGaps: gaps({ gapCount: 0, perCompetitor: [] }) });
    const last = rec.bullets[rec.bullets.length - 1];
    expect(last.kind).toBe('watch');
    expect(last.text).toContain('not a blocker');
  });

  it('caps at 5 bullets with many caveats', () => {
    const rec = buildRecommendation({ ...base, caveats: ['a', 'b', 'c', 'd'] });
    expect(rec.bullets.length).toBeLessThanOrEqual(5);
    // The coverage watch survives the cap (validate is bounded, not the closer).
    expect(rec.bullets[rec.bullets.length - 1].kind).toBe('watch');
  });
});

// ── S66 — leadership-arc fields wired through the model builders ────────────
describe('model builders — S66 recommendation + scope', () => {
  it('comparison model: scope names the pairing + long term; recommendation present', () => {
    const rows = [
      { provider: 'Azure', row: vm({ provider: 'Azure', vmSizeName: 'Standard_M64s', family: 'M-series', category: 'Memory Optimized', vcpus: 64, memoryGib: 1024 }) },
      { provider: 'AWS', row: vm({ provider: 'AWS', vmSizeName: 'm7i.16xlarge', family: 'm7i', category: 'General Purpose', vcpus: 64, memoryGib: 256 }) },
    ];
    const m = buildExecComparisonModel({
      analysis: analysis(), horizons: horizons(), bars: bars(),
      awsDeltas: [], gcpDeltas: [], markCount: 12, perProviderRegions: [],
      baseline: 'Standard_M64s', baselineProvider: 'Azure', term: '3y',
      compareRows: rows, specComparison: compareSpecs(rows.map((r) => r.row)),
      matchByProvider: { Azure: 100, AWS: 88 }, caveatsByProvider: {}, marketGapReport: gapReport(),
    });
    expect(m.scope).toBe('Azure Standard_M64s vs cross-cloud equivalents · priced at 3-year reserved');
    expect(m.recommendation!.bullets[0].kind).toBe('adopt');
    // The workload framing derives from the BASE row's category.
    expect(m.recommendation!.bullets[0].text).toContain('memory optimized workloads');
    // Parity in the adopt bullet = the avg of the non-base match %s (88).
    expect(m.recommendation!.bullets[0].text).toContain('88% spec parity');
  });

  it('bom model: scope names lines + targets + long term; recommendation present', () => {
    const m = buildExecBomModel({ ported: bomPort(), bom: bomEntries(), regionsCovered: 3, term: '1y', marketGapReport: gapReport() });
    expect(m.scope).toBe('1-line BoM ported from Azure to AWS · priced at 1-year reserved');
    expect(m.recommendation!.bullets[0].kind).toBe('adopt');
    expect(m.recommendation!.bullets[0].text).toContain('AWS');
  });
});

import { describe, it, expect } from 'vitest';
import {
  computeVerdict,
  verdictParity,
  collectAssumptions,
  termLabel,
  bomVerdict,
  bomVerdictCore,
  articleFor,
  bomLineStats,
  weightedTargetMatch,
  cheapestForLine,
  bomTradeoffs,
  collectBomAssumptions,
} from './execBriefMath';
import type { HorizonCost } from '../../engine/competitive';
import type { MatchCaveat } from '../../utils/matchCaveats';
import type { BomPortResult, PortedLine, PortedScenario } from '../../utils/bomPort';
import type { BomEntry, CatalogEntry } from '../../types';

const h = (over: Partial<HorizonCost>): HorizonCost => ({
  provider: 'Azure',
  sku: 'Standard_E8s_v5',
  oneMonthBest: null,
  oneYearBest: null,
  threeYearBest: null,
  oneMonthPayg: null,
  oneYearPayg: null,
  threeYearPayg: null,
  bestRateLabel: 'PAYG',
  ...over,
});

const stretchCaveat: MatchCaveat = {
  kind: 'category-fallback',
  severity: 'warn',
  label: 'Cross-category match',
  detail: 'Closest analog is in a different product category.',
};
const infoCaveat: MatchCaveat = {
  kind: 'gen-unknown',
  severity: 'warn',
  label: 'CPU generation assumed',
  detail: 'Processor generation inferred from the series name.',
};

describe('termLabel', () => {
  it('names each commitment term (S66 — delegates to ui/tokens termLabelLong)', () => {
    expect(termLabel('payg')).toBe('pay-as-you-go');
    expect(termLabel('1y')).toBe('1-year reserved');
    expect(termLabel('3y')).toBe('3-year reserved');
  });
});

describe('computeVerdict — cheapest selection', () => {
  it('picks the lowest-monthly priced cloud across the matrix', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 1000 }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 700 }),
        h({ provider: 'GCP', sku: 'n2-highmem-8', oneMonthBest: 850 }),
      ],
      'Azure',
    );
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.cheapestSku).toBe('r7i.2xlarge');
    expect(v.cheapestMonthly).toBe(700);
    expect(v.baseIsCheapest).toBe(false);
  });

  it('flags the base as cheapest when it wins', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 600 }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 700 }),
      ],
      'Azure',
    );
    expect(v.cheapestProvider).toBe('Azure');
    expect(v.baseIsCheapest).toBe(true);
    expect(v.savingMonthly).toBe(0);
    expect(v.savingPct).toBe(0);
  });
});

describe('computeVerdict — savings vs base', () => {
  it('computes absolute + percent savings vs the base row', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 1000 }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 750 }),
      ],
      'Azure',
    );
    expect(v.savingMonthly).toBe(250);
    expect(v.savingPct).toBe(25);
  });

  it('prices at the applied-term monthly (oneMonthBest), whatever the tier', () => {
    // oneMonthBest already reflects the term selection (with PAYG fallback baked
    // in by the engine), so the verdict follows it directly for 1y / 3y / PAYG.
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 800, bestRateLabel: '1y RI' }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 640, bestRateLabel: '1y RI' }),
      ],
      'Azure',
    );
    expect(v.cheapestMonthly).toBe(640);
    expect(v.savingPct).toBe(20);
  });
});

describe('computeVerdict — null-safety', () => {
  it('drops unpriced clouds from the cheapest race', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 1000 }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: null }),
        h({ provider: 'GCP', sku: 'n2-highmem-8', oneMonthBest: 900 }),
      ],
      'Azure',
    );
    expect(v.cheapestProvider).toBe('GCP');
    expect(v.savingMonthly).toBe(100);
  });

  it('returns null savings when the base itself is unpriced', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: null }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 700 }),
      ],
      'Azure',
    );
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.baseMonthly).toBeNull();
    expect(v.savingMonthly).toBeNull();
    expect(v.savingPct).toBeNull();
    // S65 — rival priced but base unpriced → the honest amber branch must fire.
    expect(v.baseUnpriced).toBe(true);
    expect(v.baseIsCheapest).toBe(false);
  });

  it('S65 — base unpriced + rival at $500: flags baseUnpriced, no fabricated saving', () => {
    // The exact scenario Fix 2 protects against: base has no published rate but a
    // rival IS priced. The brief must NOT say the base is "already the least-cost
    // option" — it renders the cheapest priced option instead.
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: null }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 500 }),
      ],
      'Azure',
    );
    expect(v.baseUnpriced).toBe(true);
    expect(v.baseIsCheapest).toBe(false);
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.cheapestMonthly).toBe(500);
    expect(v.baseMonthly).toBeNull();
    expect(v.savingMonthly).toBeNull();
    expect(v.savingPct).toBeNull();
  });

  it('returns all-null when nothing is priced', () => {
    const v = computeVerdict([h({ provider: 'Azure', oneMonthBest: null })], 'Azure');
    expect(v.cheapestProvider).toBeNull();
    expect(v.cheapestMonthly).toBeNull();
    expect(v.savingMonthly).toBeNull();
    expect(v.baseUnpriced).toBe(false); // nothing priced ≠ unpriced-base
  });
});

describe('verdictParity — stretch-caveat wording gate', () => {
  const priced: HorizonCost[] = [
    h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 1000 }),
    h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 700 }),
  ];

  it('returns "parity" when the winning analog has no stretch caveat', () => {
    const v = computeVerdict(priced, 'Azure');
    expect(verdictParity(v, 'Azure', { AWS: [infoCaveat] })).toBe('parity');
  });

  it('returns "stretch" when the winning analog carries a category-fallback caveat', () => {
    const v = computeVerdict(priced, 'Azure');
    expect(verdictParity(v, 'Azure', { AWS: [stretchCaveat] })).toBe('stretch');
  });

  it('returns "base" when the base cloud itself is cheapest', () => {
    const v = computeVerdict(
      [
        h({ provider: 'Azure', sku: 'E8s_v5', oneMonthBest: 600 }),
        h({ provider: 'AWS', sku: 'r7i.2xlarge', oneMonthBest: 700 }),
      ],
      'Azure',
    );
    expect(verdictParity(v, 'Azure', { AWS: [stretchCaveat] })).toBe('base');
  });
});

describe('collectAssumptions', () => {
  it('is empty for a clean, fully-priced comparison', () => {
    const a = collectAssumptions(
      [h({ provider: 'Azure', oneMonthBest: 100, bestRateLabel: '1y RI' })],
      {},
      'Azure',
      '1y',
    );
    expect(a.any).toBe(false);
    expect(a.lines).toEqual([]);
  });

  it('surfaces a stretch analog line (targets only, base excluded)', () => {
    const a = collectAssumptions([], { AWS: [stretchCaveat], Azure: [stretchCaveat] }, 'Azure', 'payg');
    expect(a.any).toBe(true);
    expect(a.lines.some((l) => l.includes('AWS') && l.includes('closest analog'))).toBe(true);
    // The base's own caveats are never listed.
    expect(a.lines.some((l) => l.startsWith('Azure'))).toBe(false);
  });

  it('flags a committed-term PAYG fallback', () => {
    const a = collectAssumptions(
      [h({ provider: 'AWS', oneMonthBest: 500, bestRateLabel: 'PAYG' })],
      {},
      'Azure',
      '1y',
    );
    expect(a.lines.some((l) => l.includes('1y RI') && l.includes('PAYG'))).toBe(true);
  });

  it('does not flag a PAYG fallback when the user is already on PAYG', () => {
    const a = collectAssumptions(
      [h({ provider: 'AWS', oneMonthBest: 500, bestRateLabel: 'PAYG' })],
      {},
      'Azure',
      'payg',
    );
    expect(a.lines.some((l) => l.includes('PAYG'))).toBe(false);
  });
});

// ── S66-EXEC — VM-BoM mode math ─────────────────────────────────────────────

/** Minimal PortedLine factory. */
const line = (o: Partial<PortedLine>): PortedLine => ({
  baseVmSizeName: 'E8s_v5',
  quantity: 1,
  matchVmSizeName: 'r7i.2xlarge',
  matchPct: 90,
  matchQuality: 'close',
  monthlyUsd: 100,
  estimated: false,
  ...o,
});

/** Minimal PortedScenario factory — totals derived from the lines unless given. */
const scenario = (provider: string, lines: PortedLine[], o?: Partial<PortedScenario>): PortedScenario => {
  const monthly = lines.reduce((n, l) => n + (l.monthlyUsd ?? 0), 0);
  return {
    provider,
    lines,
    monthlyTotalUsd: monthly,
    hourlyTotalUsd: monthly / 730,
    matchedLines: lines.filter((l) => l.matchVmSizeName != null).length,
    unmatchedLines: lines.filter((l) => l.matchVmSizeName == null).length,
    pricedLines: lines.filter((l) => l.monthlyUsd != null).length,
    avgMatchPct: null,
    anyEstimated: lines.some((l) => l.estimated),
    ...o,
  };
};

const port = (
  baseScenario: PortedScenario,
  targetScenarios: PortedScenario[],
  baseProvider = 'Azure',
): BomPortResult => ({
  baseProvider,
  baseScenario,
  targetScenarios,
  verdict: { cheapestProvider: null, headline: '', insights: [] },
});

const bomEntry = (o: Partial<BomEntry>): BomEntry =>
  ({ vmSizeName: 'E8s_v5', quantity: 1, ...o }) as BomEntry;

/** Minimal CatalogEntry factory — only the fields the story/caveat math reads. */
const cat = (o: Partial<CatalogEntry>): CatalogEntry => ({
  vmSizeName: 'x',
  vmGeneration: '',
  series: '',
  memoryCategory: 'High Memory (HM)',
  homeHardwareGroup: '',
  spilloverTarget: 'N/A',
  processor: '',
  vcpus: 8,
  memoryGib: 64,
  networkMbps: 0,
  localDiskGib: 0,
  status: '',
  notes: '',
  category: 'Memory Optimized',
  ...o,
});

describe('bomVerdict', () => {
  it('picks the cheapest priced cloud total and computes savings vs base', () => {
    const v = bomVerdict(
      port(
        scenario('Azure', [line({ monthlyUsd: 500 }), line({ baseVmSizeName: 'E4s_v5', monthlyUsd: 500 })]),
        [
          scenario('AWS', [line({ monthlyUsd: 400 }), line({ monthlyUsd: 350 })]),
          scenario('GCP', [line({ monthlyUsd: 480 }), line({ monthlyUsd: 470 })]),
        ],
      ),
    );
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.cheapestTotal).toBe(750);
    expect(v.baseTotal).toBe(1000);
    expect(v.savingMonthly).toBe(250);
    expect(v.savingPct).toBe(25);
    expect(v.baseIsCheapest).toBe(false);
    expect(v.baseUnpriced).toBe(false);
  });

  it('flags the base as cheapest with zero savings when it wins', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: 300 })]), [
        scenario('AWS', [line({ monthlyUsd: 400 })]),
      ]),
    );
    expect(v.baseIsCheapest).toBe(true);
    expect(v.savingMonthly).toBe(0);
  });

  it('never fabricates a saving when the base BoM is unpriced (baseUnpriced)', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: null })]), [
        scenario('AWS', [line({ monthlyUsd: 400 })]),
      ]),
    );
    expect(v.baseTotal).toBeNull();
    expect(v.savingMonthly).toBeNull();
    expect(v.savingPct).toBeNull();
    expect(v.baseUnpriced).toBe(true);
    expect(v.cheapestProvider).toBe('AWS');
  });

  it('returns all-null cheapest when nothing is priced (and no baseUnpriced)', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: null })]), [
        scenario('AWS', [line({ monthlyUsd: null })]),
      ]),
    );
    expect(v.cheapestProvider).toBeNull();
    expect(v.cheapestTotal).toBeNull();
    expect(v.baseUnpriced).toBe(false);
  });

  it('carries the unmatched / estimated flags across scenarios', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({})]), [
        scenario('AWS', [line({ matchVmSizeName: null, matchPct: null, monthlyUsd: null })]),
        scenario('GCP', [line({ estimated: true })]),
      ]),
    );
    expect(v.anyUnmatched).toBe(true);
    expect(v.anyEstimated).toBe(true);
  });
});

describe('bomLineStats', () => {
  it('counts matched line-cells across every scenario (base included)', () => {
    const s = bomLineStats(
      port(scenario('Azure', [line({}), line({})]), [
        scenario('AWS', [line({}), line({ matchVmSizeName: null, matchPct: null, monthlyUsd: null })]),
      ]),
      2,
    );
    expect(s.matched).toBe(3);
    expect(s.totalCells).toBe(4);
    expect(s.anyUnmatched).toBe(true);
  });
});

describe('weightedTargetMatch', () => {
  it('weights match % by BoM quantity across target clouds only', () => {
    const ported = port(scenario('Azure', [line({}), line({})]), [
      scenario('AWS', [line({ matchPct: 100 }), line({ matchPct: 80 })]),
    ]);
    const bom = [bomEntry({ quantity: 3 }), bomEntry({ quantity: 1 })];
    // (100·3 + 80·1) / 4 = 95
    expect(weightedTargetMatch(ported, bom)).toBe(95);
  });

  it('returns null when no target line matched', () => {
    const ported = port(scenario('Azure', [line({})]), [
      scenario('AWS', [line({ matchPct: null, matchVmSizeName: null })]),
    ]);
    expect(weightedTargetMatch(ported, [bomEntry({})])).toBeNull();
  });
});

describe('cheapestForLine', () => {
  const ported = port(
    scenario('Azure', [line({ monthlyUsd: 500 }), line({ monthlyUsd: null })]),
    [
      scenario('AWS', [line({ monthlyUsd: 400 }), line({ monthlyUsd: null })]),
      scenario('GCP', [line({ monthlyUsd: 450 }), line({ monthlyUsd: null })]),
    ],
  );

  it('returns the cheapest priced cloud for a line (base considered)', () => {
    expect(cheapestForLine(ported, 0)).toEqual({ provider: 'AWS', monthlyUsd: 400 });
  });

  it('returns null when no cloud priced the line', () => {
    expect(cheapestForLine(ported, 1)).toBeNull();
  });
});

describe('bomTradeoffs', () => {
  const userVms: CatalogEntry[] = [
    cat({ provider: 'Azure', vmSizeName: 'E8s_v5', family: 'Esv5', vcpus: 8, memoryGib: 64 }),
    cat({ provider: 'Azure', vmSizeName: 'E4s_v5', family: 'Esv5', vcpus: 4, memoryGib: 32 }),
    cat({ provider: 'AWS', vmSizeName: 'r7i.2xlarge', family: 'r7i', vcpus: 8, memoryGib: 64 }),
    cat({ provider: 'AWS', vmSizeName: 'r7i.xlarge', family: 'r7i', vcpus: 4, memoryGib: 32 }),
  ];
  const bom = [bomEntry({ vmSizeName: 'E8s_v5', quantity: 2 }), bomEntry({ vmSizeName: 'E4s_v5', quantity: 1 })];
  const ported = port(
    scenario('Azure', [
      line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'E8s_v5', matchPct: 100, quantity: 2, monthlyUsd: 800 }),
      line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: 'E4s_v5', matchPct: 100, quantity: 1, monthlyUsd: 200 }),
    ]),
    [
      scenario('AWS', [
        line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'r7i.2xlarge', matchPct: 95, quantity: 2, monthlyUsd: 600 }),
        line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: 'r7i.xlarge', matchPct: 90, quantity: 1, monthlyUsd: 150 }),
      ]),
    ],
  );

  it('puts the base story first, at 100% with no give-up', () => {
    const stories = bomTradeoffs(ported, bom, userVms);
    expect(stories[0].provider).toBe('Azure');
    expect(stories[0].isBase).toBe(true);
    expect(stories[0].avgMatchPct).toBe(100);
    expect(stories[0].giveUp).toBeNull();
    expect(stories[0].families).toContain('Esv5');
  });

  it('builds a qty-weighted target story with dominant families + gains', () => {
    const stories = bomTradeoffs(ported, bom, userVms);
    const aws = stories.find((s) => s.provider === 'AWS');
    expect(aws).toBeDefined();
    expect(aws?.families).toContain('r7i');
    // qty-weighted: (95·2 + 90·1)/3 = 93.33…
    expect(aws?.avgMatchPct).toBeCloseTo(93.33, 1);
    // Cheaper than base → a cost gain line exists.
    expect(aws?.gains.some((g) => g.includes('Lowers the monthly bill'))).toBe(true);
    // Same vCPU/mem footprint → the parity trait line.
    expect(aws?.gains.some((g) => g.includes('vCPU + memory footprint'))).toBe(true);
    expect(aws?.matchedLines).toBe(2);
    expect(aws?.totalLines).toBe(2);
  });

  it('names unmatched lines as the give-up and excludes them honestly', () => {
    const p2 = port(
      scenario('Azure', [line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'E8s_v5', monthlyUsd: 800 })]),
      [scenario('AWS', [line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: null, matchPct: null, monthlyUsd: null })])],
    );
    const stories = bomTradeoffs(p2, [bomEntry({})], userVms);
    const aws = stories.find((s) => s.provider === 'AWS');
    expect(aws?.giveUp).toContain('no AWS equivalent');
    expect(aws?.monthlyTotalUsd).toBeNull();
  });
});

describe('collectBomAssumptions', () => {
  it('is empty for a clean, fully-matched, fully-priced port', () => {
    const a = collectBomAssumptions(
      port(scenario('Azure', [line({})]), [scenario('AWS', [line({})])]),
    );
    expect(a.any).toBe(false);
    expect(a.lines).toEqual([]);
  });

  it('names unmatched lines per cloud and flags estimated rates', () => {
    const a = collectBomAssumptions(
      port(scenario('Azure', [line({})]), [
        scenario('AWS', [line({ matchVmSizeName: null, matchPct: null, monthlyUsd: null })]),
        scenario('GCP', [line({ estimated: true })]),
      ]),
    );
    expect(a.any).toBe(true);
    expect(a.lines.some((l) => l.includes('unmatched') && l.includes('AWS (1)'))).toBe(true);
    expect(a.lines.some((l) => l.includes('estimated'))).toBe(true);
  });

  it('surfaces a stretch-analog line from the tradeoff stories', () => {
    const ported = port(scenario('Azure', [line({})]), [scenario('AWS', [line({})])]);
    const stories = bomTradeoffs(ported, [bomEntry({})], []);
    const aws = stories.find((s) => s.provider === 'AWS');
    const withStretch = aws
      ? [{ ...aws, giveUp: '1 line matched to the closest analog, not a true equivalent' }]
      : [];
    const a = collectBomAssumptions(ported, withStretch);
    expect(a.lines.some((l) => l.includes('closest analog'))).toBe(true);
  });
});

// ── S66 FIX-A — the ONE whole-BoM verdict core: honesty gates + rounding ────

describe('bomVerdictCore / bomVerdict — savings suppression (S66 FIX-A)', () => {
  it('suppresses savings when a BASE line is matched but UNPRICED, naming the SKU', () => {
    const v = bomVerdict(
      port(
        scenario('Azure', [
          line({ baseVmSizeName: 'E8s_v5', monthlyUsd: 500 }),
          line({ baseVmSizeName: 'E4s_v5', monthlyUsd: null }), // matched, no rate
        ]),
        [
          scenario('AWS', [
            line({ monthlyUsd: 300 }),
            line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: 'r7i.xlarge', monthlyUsd: 100 }),
          ]),
        ],
      ),
    );
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.savingMonthly).toBeNull();
    expect(v.savingPct).toBeNull();
    expect(v.savingsSuppressed).toBe(true);
    expect(v.suppressReason).toBe('base-partially-priced');
    expect(v.basePricedLines).toBe(1);
    expect(v.baseTotalLines).toBe(2);
    // The exclusions list names the actual line SKU that is missing.
    expect(v.exclusionsByProvider).toEqual([{ provider: 'Azure', lines: ['E4s_v5'] }]);
  });

  it('suppresses savings when the CHEAPEST scenario is undercounted', () => {
    const v = bomVerdict(
      port(
        scenario('Azure', [line({ monthlyUsd: 600 }), line({ baseVmSizeName: 'E4s_v5', monthlyUsd: 400 })]),
        [
          scenario('AWS', [
            line({ monthlyUsd: 300 }),
            line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: null, matchPct: null, monthlyUsd: null }),
          ]),
        ],
      ),
    );
    expect(v.cheapestProvider).toBe('AWS');
    expect(v.savingMonthly).toBeNull();
    expect(v.savingsSuppressed).toBe(true);
    expect(v.suppressReason).toBe('cheapest-partially-priced');
    expect(v.exclusionsByProvider).toEqual([{ provider: 'AWS', lines: ['E4s_v5'] }]);
  });

  it('a fully-priced comparison is NOT suppressed and carries empty exclusions', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: 1000 })]), [
        scenario('AWS', [line({ monthlyUsd: 750 })]),
      ]),
    );
    expect(v.savingsSuppressed).toBe(false);
    expect(v.suppressReason).toBeNull();
    expect(v.exclusionsByProvider).toEqual([]);
    expect(v.savingMonthly).toBe(250);
    expect(v.savingPct).toBe(25);
  });

  it('rounds savingPct to a WHOLE percent in the core (18.69% → 19)', () => {
    const v = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: 1070 })]), [
        scenario('AWS', [line({ monthlyUsd: 870 })]),
      ]),
    );
    expect(v.savingMonthly).toBe(200);
    expect(v.savingPct).toBe(19);
    expect(Number.isInteger(v.savingPct)).toBe(true);
  });

  it('flags (but zeroes) a base win only when the base is fully priced', () => {
    const clean = bomVerdict(
      port(scenario('Azure', [line({ monthlyUsd: 300 })]), [
        scenario('AWS', [line({ monthlyUsd: 400 })]),
      ]),
    );
    expect(clean.baseIsCheapest).toBe(true);
    expect(clean.savingMonthly).toBe(0);
    expect(clean.savingsSuppressed).toBe(false);

    const partial = bomVerdict(
      port(
        scenario('Azure', [line({ monthlyUsd: 300 }), line({ baseVmSizeName: 'E4s_v5', monthlyUsd: null })]),
        [scenario('AWS', [line({ monthlyUsd: 400 }), line({ baseVmSizeName: 'E4s_v5', monthlyUsd: 350 })])],
      ),
    );
    // Base "wins" only because a line is missing from its total → suppressed.
    expect(partial.baseIsCheapest).toBe(true);
    expect(partial.savingMonthly).toBeNull();
    expect(partial.savingsSuppressed).toBe(true);
    expect(partial.suppressReason).toBe('base-partially-priced');
  });

  it('bomVerdictCore accepts count-only scenarios (no lines array) with empty SKU lists', () => {
    const core = bomVerdictCore({
      baseProvider: 'Azure',
      baseScenario: { provider: 'Azure', monthlyTotalUsd: 900, matchedLines: 3, unmatchedLines: 0, pricedLines: 2, anyEstimated: false },
      targetScenarios: [
        { provider: 'AWS', monthlyTotalUsd: 700, matchedLines: 3, unmatchedLines: 0, pricedLines: 3, anyEstimated: false },
      ],
    });
    expect(core.savingsSuppressed).toBe(true);
    expect(core.suppressReason).toBe('base-partially-priced');
    expect(core.exclusionsByProvider).toEqual([{ provider: 'Azure', lines: [], unmatched: 0, unpriced: 1 }]);
  });
});

describe('articleFor (S66 FIX-A)', () => {
  it('uses "an" before vowel-initial clouds and "a" otherwise', () => {
    expect(articleFor('AWS')).toBe('an');
    expect(articleFor('Azure')).toBe('an');
    expect(articleFor('GCP')).toBe('a');
    expect(articleFor('Custom')).toBe('a');
  });
});

// ── S66 FIX-A — bomTradeoffs copy + perf opts ───────────────────────────────

describe('bomTradeoffs — copy accuracy + opts (S66 FIX-A)', () => {
  const bigVms: CatalogEntry[] = [
    cat({ provider: 'Azure', vmSizeName: 'E8s_v5', family: 'Esv5', vcpus: 8, memoryGib: 64 }),
    cat({ provider: 'AWS', vmSizeName: 'r7i.2xlarge', family: 'r7i', vcpus: 8, memoryGib: 64 }),
  ];
  const bigBom = [bomEntry({ vmSizeName: 'E8s_v5', quantity: 200 })];
  const bigPort = port(
    scenario('Azure', [
      line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'E8s_v5', matchPct: 100, quantity: 200, monthlyUsd: 8000 }),
    ]),
    [
      scenario('AWS', [
        line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'r7i.2xlarge', matchPct: 95, quantity: 200, monthlyUsd: 6000 }),
      ]),
    ],
  );

  it('formats the base footprint with thousands separators (1,600 vCPU · 12,800 GiB)', () => {
    const stories = bomTradeoffs(bigPort, bigBom, bigVms);
    const footprint = stories[0].gains.find((g) => g.includes('total footprint'));
    expect(footprint).toContain('1,600 vCPU');
    expect(footprint).toContain('12,800 GiB');
  });

  it('uses the correct indefinite article ("an AWS equivalent")', () => {
    const stories = bomTradeoffs(bigPort, bigBom, bigVms);
    const aws = stories.find((s) => s.provider === 'AWS');
    expect(aws?.gains.some((g) => g.includes('Every line has an AWS equivalent'))).toBe(true);
  });

  it('states the bill delta as a WHOLE percent (25%, matching the verdict core)', () => {
    const stories = bomTradeoffs(bigPort, bigBom, bigVms);
    const aws = stories.find((s) => s.provider === 'AWS');
    expect(aws?.gains.some((g) => g === 'Lowers the monthly bill 25% vs Azure')).toBe(true);
  });

  it('withholds the bill-delta gain when either side is not fully priced', () => {
    const partial = port(
      scenario('Azure', [
        line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'E8s_v5', monthlyUsd: 800 }),
        line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: 'E4s_v5', monthlyUsd: null }),
      ]),
      [
        scenario('AWS', [
          line({ baseVmSizeName: 'E8s_v5', matchVmSizeName: 'r7i.2xlarge', monthlyUsd: 600 }),
          line({ baseVmSizeName: 'E4s_v5', matchVmSizeName: 'r7i.xlarge', monthlyUsd: 100 }),
        ]),
      ],
    );
    const stories = bomTradeoffs(partial, [bomEntry({}), bomEntry({ vmSizeName: 'E4s_v5' })], bigVms);
    const aws = stories.find((s) => s.provider === 'AWS');
    expect(aws?.gains.some((g) => g.includes('Lowers the monthly bill'))).toBe(false);
  });

  it('opts.lookup + opts.verdict produce identical stories to the scan path', () => {
    const lookup = new Map(bigVms.map((v) => [`${v.provider}|${v.vmSizeName}`, v]));
    const plain = bomTradeoffs(bigPort, bigBom, bigVms);
    const fast = bomTradeoffs(bigPort, bigBom, bigVms, { lookup, verdict: bomVerdict(bigPort) });
    expect(fast).toEqual(plain);
  });
});

describe('collectBomAssumptions — unpriced-line footnote (S66 FIX-A)', () => {
  it('names matched-but-unpriced lines per cloud', () => {
    const a = collectBomAssumptions(
      port(scenario('Azure', [line({})]), [
        scenario('AWS', [line({ matchVmSizeName: 'r7i.2xlarge', monthlyUsd: null })]),
      ]),
    );
    expect(a.any).toBe(true);
    expect(
      a.lines.some((l) => l.includes('resolvable rate') && l.includes('AWS (1)')),
    ).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import type { CatalogEntry } from '../../types';
import type { BomPortResult, PortedLine, PortedScenario } from '../../utils/bomPort';
import type { MatchCaveat } from '../../utils/matchCaveats';
import {
  buildShowdownRows,
  fmtSpec,
  fmtDelta,
  pos,
  processorMarker,
  anyHasGpu,
  anyHasCost,
  canonicalProvider,
  specsVerdict,
  bomCloudStats,
  bomSpecsVerdict,
  bomShowdownInsights,
  STRONG_MATCH_PCT,
  pairMatchPct,
  type ShowdownColumnInput,
  type ShowdownRow,
} from './specShowdownMath';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({
    vmSizeName: 'x',
    vmGeneration: 'Gen',
    series: 's',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'hw',
    spilloverTarget: 'N/A',
    processor: 'Intel Xeon',
    vcpus: 4,
    memoryGib: 16,
    networkMbps: 5000,
    localDiskGib: 0,
    status: 'ok',
    notes: '',
    ...o,
  } as CatalogEntry);

const col = (o: Partial<ShowdownColumnInput> & { vm: CatalogEntry }): ShowdownColumnInput => ({
  provider: 'Azure',
  isBase: false,
  monthlyUsd: null,
  matchPct: null,
  ...o,
});

const rowByKey = (rows: ShowdownRow[], key: string) => rows.find((r) => r.key === key)!;

describe('pos', () => {
  it('coerces zero / missing / NaN to null', () => {
    expect(pos(0)).toBeNull();
    expect(pos(-5)).toBeNull();
    expect(pos(undefined)).toBeNull();
    expect(pos(NaN)).toBeNull();
    expect(pos(4)).toBe(4);
  });
});

describe('fmtSpec', () => {
  it('renders "—" for null and lifts network to Gbps', () => {
    expect(fmtSpec(null, 'GiB')).toBe('—');
    expect(fmtSpec(16, 'GiB')).toBe('16 GiB');
    expect(fmtSpec(5000, 'Mbps')).toBe('5 Gbps');
    expect(fmtSpec(12500, 'Mbps')).toBe('12.5 Gbps');
    expect(fmtSpec(1234, 'USD')).toBe('$1,234');
  });
});

describe('fmtDelta', () => {
  it('formats signed % vs base, null-safe, with a real minus sign', () => {
    expect(fmtDelta(5, 4)).toBe('+25%');
    expect(fmtDelta(4, 4)).toBe('0%');
    expect(fmtDelta(2, 4)).toBe('−50%');
    expect(fmtDelta(null, 4)).toBeNull();
    expect(fmtDelta(4, null)).toBeNull();
    expect(fmtDelta(4, 0)).toBeNull();
  });
});

describe('processorMarker', () => {
  it('flags host-dependent + curated/inferred as assumed; vendor AND absent provenance are unmarked', () => {
    expect(processorMarker(vm({ processorOptions: ['A', 'B'] }))).toBe('host-dependent');
    expect(processorMarker(vm({ processorSource: 'curated' }))).toBe('(assumed)');
    expect(processorMarker(vm({ processorSource: 'inferred' }))).toBe('(assumed)');
    // S65 (Fix 4): absent provenance is NO LONGER marked "(assumed)". Only the live-
    // shard join stamps `processorSource`, so seed/uploaded/fixture rows leave it
    // undefined — marking those mislabeled the whole default catalog and contradicted
    // specInsights (absent → vendor, no marker). Deliberately corrected here.
    expect(processorMarker(vm({}))).toBe('');
    expect(processorMarker(vm({ processorSource: 'vendor' }))).toBe('');
  });
});

describe('buildShowdownRows — row assembly + null-safety', () => {
  const base = col({ provider: 'Azure', isBase: true, vm: vm({ vcpus: 4, memoryGib: 16, networkMbps: 5000, localDiskGib: 0 }) });
  const aws = col({ provider: 'AWS', vm: vm({ provider: 'AWS', vcpus: 8, memoryGib: 32, networkMbps: 10000, localDiskGib: 600 }) });

  it('assembles the core numeric rows and always includes network/disk (null → —)', () => {
    const rows = buildShowdownRows([base, aws]);
    expect(rows.map((r) => r.key)).toEqual(
      expect.arrayContaining(['vcpu', 'mem', 'memPerVcpu', 'net', 'disk', 'processor']),
    );
    // base has no local disk → "—"
    const disk = rowByKey(rows, 'disk');
    expect(disk.cells[0].display).toBe('—');
    expect(disk.cells[0].value).toBeNull();
    expect(disk.cells[1].display).toBe('600 GiB');
  });

  it('empty input yields no rows', () => {
    expect(buildShowdownRows([])).toEqual([]);
  });

  it('a 0-network side renders "—" and does not win best', () => {
    const noNet = col({ provider: 'GCP', vm: vm({ provider: 'GCP', networkMbps: 0 }) });
    const rows = buildShowdownRows([base, noNet]);
    const net = rowByKey(rows, 'net');
    expect(net.cells[1].display).toBe('—');
    expect(net.cells[1].best).toBe(false);
    // base has 5000, the only comparable value → base is best.
    expect(net.cells[0].best).toBe(true);
  });
});

describe('best-in-row direction', () => {
  it('more-is-better rows crown the max; ties crown nobody', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ vcpus: 4 }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS', vcpus: 8 }) });
    const c = col({ provider: 'GCP', vm: vm({ provider: 'GCP', vcpus: 8 }) });
    const vcpu = rowByKey(buildShowdownRows([a, b, c]), 'vcpu');
    // b and c tie at 8 → no winner badge anywhere.
    expect(vcpu.cells.every((cell) => !cell.best)).toBe(true);

    const vcpu2 = rowByKey(buildShowdownRows([a, b]), 'vcpu');
    expect(vcpu2.cells[1].best).toBe(true); // AWS 8 > Azure 4
    expect(vcpu2.cells[0].best).toBe(false);
  });

  it('$/mo is less-is-better: the cheapest column wins', () => {
    const a = col({ provider: 'Azure', isBase: true, monthlyUsd: 200, vm: vm({}) });
    const b = col({ provider: 'AWS', monthlyUsd: 150, vm: vm({ provider: 'AWS' }) });
    const rows = buildShowdownRows([a, b]);
    expect(anyHasCost([a, b])).toBe(true);
    const cost = rowByKey(rows, 'cost');
    expect(cost.moreIsBetter).toBe(false);
    expect(cost.cells[1].best).toBe(true); // 150 < 200
    expect(cost.cells[0].best).toBe(false);
    expect(cost.cells[1].display).toBe('$150/mo');
  });
});

describe('delta-vs-base + marker propagation', () => {
  it('numeric cells carry a signed delta vs base; base cell is null', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ memoryGib: 16 }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS', memoryGib: 20 }) });
    const mem = rowByKey(buildShowdownRows([a, b]), 'mem');
    expect(mem.cells[0].deltaPct).toBeNull(); // base
    expect(mem.cells[1].deltaPct).toBe('+25%');
  });

  it('estimated network propagates (est.) only when a value exists', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ networkMbps: 5000 }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS', networkMbps: 8000, networkEstimated: true }) });
    const c = col({ provider: 'GCP', vm: vm({ provider: 'GCP', networkMbps: 0, networkEstimated: true }) });
    const net = rowByKey(buildShowdownRows([a, b, c]), 'net');
    expect(net.cells[1].marker).toBe('(est.)');
    expect(net.cells[2].marker).toBe(''); // no value → no est. marker
  });

  it('processor row carries the assumed/host-dependent marker', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ processor: 'EPYC', processorSource: 'curated' }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS', processor: 'Graviton3', processorSource: 'vendor' }) });
    const proc = rowByKey(buildShowdownRows([a, b]), 'processor');
    expect(proc.cells[0].marker).toBe('(assumed)');
    expect(proc.cells[1].marker).toBe('');
    expect(proc.cells[0].display).toBe('EPYC');
  });
});

describe('GPU row conditionality', () => {
  it('omits the GPU row when no side has an accelerator', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ acceleratorType: 'None' }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS' }) });
    expect(anyHasGpu([a, b])).toBe(false);
    expect(buildShowdownRows([a, b]).some((r) => r.key === 'gpu')).toBe(false);
  });

  it('includes the GPU row when any side has one; missing side shows —', () => {
    const a = col({ provider: 'Azure', isBase: true, vm: vm({ acceleratorType: 'NVIDIA A100' }) });
    const b = col({ provider: 'AWS', vm: vm({ provider: 'AWS', acceleratorType: 'None' }) });
    expect(anyHasGpu([a, b])).toBe(true);
    const gpu = rowByKey(buildShowdownRows([a, b]), 'gpu');
    expect(gpu.cells[0].display).toBe('NVIDIA A100');
    expect(gpu.cells[1].display).toBe('—');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S66-SPECS — the spec-answer verdict math
// ═══════════════════════════════════════════════════════════════════════════

describe('canonicalProvider', () => {
  it('normalizes case + whitespace to the canonical labels, passes unknowns through', () => {
    expect(canonicalProvider('azure')).toBe('Azure');
    expect(canonicalProvider(' AWS ')).toBe('AWS');
    expect(canonicalProvider('Gcp')).toBe('GCP');
    expect(canonicalProvider('OtherCloud')).toBe('OtherCloud');
    expect(canonicalProvider(null)).toBe('');
    expect(canonicalProvider(undefined)).toBe('');
  });
});

describe('specsVerdict — comparison-mode spec answer', () => {
  const base = col({
    provider: 'Azure',
    isBase: true,
    matchPct: 100,
    monthlyUsd: 200,
    vm: vm({ vmSizeName: 'Standard_D4s_v5', vcpus: 4, memoryGib: 16, networkMbps: 12500, localDiskGib: 600 }),
  });
  const aws = col({
    provider: 'AWS',
    matchPct: 88,
    monthlyUsd: 150,
    vm: vm({ provider: 'AWS', vmSizeName: 'm6i.xlarge', vcpus: 4, memoryGib: 16, networkMbps: 25000, localDiskGib: 0 }),
  });
  const gcp = col({
    provider: 'GCP',
    matchPct: 74,
    monthlyUsd: null,
    vm: vm({ provider: 'GCP', vmSizeName: 'n2-standard-4', vcpus: 4, memoryGib: 16, networkMbps: 10000, localDiskGib: 0 }),
  });

  it('returns null for empty input and a neutral bestless model for base-only', () => {
    expect(specsVerdict([])).toBeNull();
    const only = specsVerdict([base])!;
    expect(only.best).toBeNull();
    expect(only.tone).toBe('neutral');
    expect(only.baseSku).toBe('Standard_D4s_v5');
  });

  it('picks the highest-matchPct column as the closest equivalent', () => {
    const m = specsVerdict([base, gcp, aws])!;
    expect(m.best).toEqual({ provider: 'AWS', sku: 'm6i.xlarge', matchPct: 88 });
    expect(m.tone).toBe('action');
    expect(m.baseProvider).toBe('Azure');
  });

  it('names gains and give-ups with the actual data points (× for ≥1.75×, honest null handling)', () => {
    const m = specsVerdict([base, aws])!;
    // 25 Gbps vs 12.5 Gbps = 2× — the ratio form, with both values.
    expect(m.gains.map((g) => g.text)).toContain('+2× network (25 Gbps vs 12.5 Gbps)');
    // 600 GiB local NVMe on base, none on AWS → an honest "no …", NOT a fake %.
    expect(m.giveUps.map((g) => g.text)).toContain('no local NVMe (600 GiB on base)');
  });

  it('uses the percent form under 1.75× and skips equal dims', () => {
    const b2 = col({ provider: 'Azure', isBase: true, vm: vm({ vcpus: 4, memoryGib: 16, networkMbps: 5000, localDiskGib: 0 }) });
    const t2 = col({
      provider: 'AWS',
      matchPct: 90,
      vm: vm({ provider: 'AWS', vcpus: 4, memoryGib: 20, networkMbps: 5000, localDiskGib: 0 }),
    });
    const m = specsVerdict([b2, t2])!;
    expect(m.gains.map((g) => g.text)).toContain('+25% memory (20 GiB vs 16 GiB)');
    // vCPU and network are equal → neither listed anywhere.
    const all = [...m.gains, ...m.giveUps].map((g) => g.key);
    expect(all).not.toContain('vcpu');
    expect(all).not.toContain('net');
  });

  it('sorts gains/give-ups biggest-first', () => {
    const b = col({ provider: 'Azure', isBase: true, vm: vm({ vcpus: 4, memoryGib: 16, networkMbps: 5000 }) });
    const t = col({
      provider: 'AWS',
      matchPct: 80,
      vm: vm({ provider: 'AWS', vcpus: 5, memoryGib: 64, networkMbps: 5000 }),
    });
    const m = specsVerdict([b, t])!;
    expect(m.gains[0].key).toBe('mem'); // 4× beats +25%
    expect(m.gains[1].key).toBe('vcpu');
  });

  it('warn tone when the best match is weak or unscored; perCloud carries match% + $/mo', () => {
    const weak = col({ provider: 'GCP', matchPct: 55, vm: vm({ provider: 'GCP', vmSizeName: 'w' }) });
    expect(specsVerdict([base, weak])!.tone).toBe('warn');
    const unscored = col({ provider: 'GCP', matchPct: null, vm: vm({ provider: 'GCP', vmSizeName: 'u' }) });
    expect(specsVerdict([base, unscored])!.tone).toBe('warn');

    const m = specsVerdict([base, aws, gcp])!;
    expect(m.perCloud).toEqual([
      { provider: 'AWS', sku: 'm6i.xlarge', matchPct: 88, monthlyUsd: 150 },
      { provider: 'GCP', sku: 'n2-standard-4', matchPct: 74, monthlyUsd: null },
    ]);
  });

  it('surfaces the worst caveat per non-base cloud as a chip', () => {
    const caveats: Partial<Record<string, MatchCaveat[]>> = {
      AWS: [
        { kind: 'gen-unknown', severity: 'info', label: 'Generation unknown', detail: 'd1' },
        { kind: 'burstable-vs-standard', severity: 'warn', label: 'Burstable vs standard', detail: 'd2' },
      ],
    };
    const m = specsVerdict([base, aws], caveats)!;
    expect(m.chips).toEqual([{ label: 'AWS · Burstable vs standard', detail: 'd2' }]);
  });
});

// ── VM-BoM portfolio verdict ─────────────────────────────────────────────────

const pLine = (o: Partial<PortedLine>): PortedLine =>
  ({
    baseVmSizeName: 'base',
    quantity: 1,
    matchVmSizeName: null,
    matchPct: null,
    matchQuality: null,
    monthlyUsd: null,
    estimated: false,
    ...o,
  }) as PortedLine;

const pScenario = (provider: string, lines: PortedLine[], o?: Partial<PortedScenario>): PortedScenario => ({
  provider,
  lines,
  monthlyTotalUsd: 0,
  hourlyTotalUsd: 0,
  matchedLines: lines.filter((l) => l.matchVmSizeName != null).length,
  unmatchedLines: lines.filter((l) => l.matchVmSizeName == null).length,
  pricedLines: lines.filter((l) => l.monthlyUsd != null).length,
  avgMatchPct: null,
  anyEstimated: false,
  ...o,
});

const port = (
  baseLines: PortedLine[],
  targets: PortedScenario[],
): BomPortResult => ({
  baseProvider: 'Azure',
  baseScenario: pScenario('Azure', baseLines),
  targetScenarios: targets,
  verdict: { cheapestProvider: null, headline: '', insights: [] },
});

describe('bomCloudStats / bomSpecsVerdict — VM-BoM portfolio answer', () => {
  const baseLines = [
    pLine({ baseVmSizeName: 'A', matchVmSizeName: 'A', matchPct: 100 }),
    pLine({ baseVmSizeName: 'B', matchVmSizeName: 'B', matchPct: 100 }),
    pLine({ baseVmSizeName: 'C', matchVmSizeName: 'C', matchPct: 100 }),
  ];
  const awsScen = pScenario(
    'AWS',
    [
      pLine({ baseVmSizeName: 'A', matchVmSizeName: 'a1', matchPct: 95, monthlyUsd: 100 }),
      pLine({ baseVmSizeName: 'B', matchVmSizeName: 'b1', matchPct: 92, monthlyUsd: 200 }),
      pLine({ baseVmSizeName: 'C', matchVmSizeName: 'c1', matchPct: 61, monthlyUsd: 50 }),
    ],
    { monthlyTotalUsd: 350, avgMatchPct: 91, anyEstimated: true },
  );
  const gcpScen = pScenario(
    'GCP',
    [
      pLine({ baseVmSizeName: 'A', matchVmSizeName: 'g1', matchPct: 91 }),
      pLine({ baseVmSizeName: 'B', matchVmSizeName: null }),
      pLine({ baseVmSizeName: 'C', matchVmSizeName: 'g3', matchPct: 88 }),
    ],
    { avgMatchPct: 89 },
  );

  it('counts strong / matched / unmatched lines and finds the weakest matched line', () => {
    const stats = bomCloudStats(port(baseLines, [awsScen, gcpScen]));
    expect(stats[0]).toMatchObject({
      provider: 'AWS',
      totalLines: 3,
      matchedLines: 3,
      strongLines: 2,
      unmatchedLines: 0,
      avgMatchPct: 91,
      monthlyTotalUsd: 350,
      anyEstimated: true,
      weakest: { sku: 'c1', baseSku: 'C', matchPct: 61 },
    });
    expect(stats[1]).toMatchObject({
      provider: 'GCP',
      strongLines: 2, // S66 FIX-A - 91 AND 88 are >=85 (STRONG_MATCH_PCT aligned to pctTone green)
      unmatchedLines: 1,
      monthlyTotalUsd: null, // nothing priced → null, never a fabricated $0
    });
  });

  it('crowns the cloud with the most ≥90% lines; action tone when every line matches', () => {
    const m = bomSpecsVerdict(port(baseLines, [awsScen, gcpScen]))!;
    expect(m.totalLines).toBe(3);
    expect(m.best?.provider).toBe('AWS');
    expect(m.best?.strongLines).toBe(2);
    expect(m.tone).toBe('action');
  });

  it('warn tone when the best cloud has unmatched lines', () => {
    const m = bomSpecsVerdict(port(baseLines.slice(0, 2), [gcpScen]))!;
    expect(m.best?.provider).toBe('GCP');
    expect(m.tone).toBe('warn');
  });

  it('null for an empty BoM; neutral bestless model with no target clouds', () => {
    expect(bomSpecsVerdict(port([], []))).toBeNull();
    const m = bomSpecsVerdict(port(baseLines, []))!;
    expect(m.best).toBeNull();
    expect(m.tone).toBe('neutral');
  });

  it('breaks strong-count ties on avgMatchPct', () => {
    const a = pScenario('AWS', [pLine({ baseVmSizeName: 'A', matchVmSizeName: 'a', matchPct: 92 })], { avgMatchPct: 92 });
    const g = pScenario('GCP', [pLine({ baseVmSizeName: 'A', matchVmSizeName: 'g', matchPct: 95 })], { avgMatchPct: 95 });
    const m = bomSpecsVerdict(port(baseLines.slice(0, 1), [a, g]))!;
    expect(m.best?.provider).toBe('GCP');
  });
});

describe('bomShowdownInsights — per-cloud portfolio strip', () => {
  it('names the strong-line count as the standout and the weakest line / unmatched count as the weakness', () => {
    const baseLines = [
      pLine({ baseVmSizeName: 'A', matchVmSizeName: 'A', matchPct: 100 }),
      pLine({ baseVmSizeName: 'B', matchVmSizeName: 'B', matchPct: 100 }),
    ];
    const aws = pScenario('AWS', [
      pLine({ baseVmSizeName: 'A', matchVmSizeName: 'a1', matchPct: 95 }),
      pLine({ baseVmSizeName: 'B', matchVmSizeName: 'b1', matchPct: 72 }),
    ]);
    const gcp = pScenario('GCP', [
      pLine({ baseVmSizeName: 'A', matchVmSizeName: 'g1', matchPct: 80 }),
      pLine({ baseVmSizeName: 'B', matchVmSizeName: null }),
    ], { avgMatchPct: 80 });
    const out = bomShowdownInsights(port(baseLines, [aws, gcp]));
    expect(out[0]).toEqual({
      provider: 'AWS',
      displayName: 'AWS',
      standout: `1 of 2 lines ≥${STRONG_MATCH_PCT}% match`,
      weakness: 'weakest: b1 ≈72%',
    });
    // S66 FIX-A - GCP is NOT the leading cloud (AWS has more strong lines), so
    // its stat is a plain note, never a starred standout.
    expect(out[1].standout).toBeUndefined();
    expect(out[1].note).toBe('≈80% avg match across 1 line');
    expect(out[1].weakness).toBe('1 line with no equivalent');
  });

  it('a fully-strong cloud carries no weakness', () => {
    const baseLines = [pLine({ baseVmSizeName: 'A', matchVmSizeName: 'A', matchPct: 100 })];
    const aws = pScenario('AWS', [pLine({ baseVmSizeName: 'A', matchVmSizeName: 'a1', matchPct: 97 })]);
    const out = bomShowdownInsights(port(baseLines, [aws]));
    expect(out[0].weakness).toBeUndefined();
  });
});

// ── S66 FIX-A — one match-% kernel + one strong-match threshold ─────────────

import { pctTone } from './ui/tokens';
import {
  vmFeatures,
  vmDistance,
  matchPct,
  CONFIDENTIAL_PEER_PENALTY,
} from '../../utils/equivalence';
import { CROSS_CATEGORY_PENALTY } from '../../utils/crossCloudEquivalency';

describe('STRONG_MATCH_PCT — aligned with pctTone (S66 FIX-A)', () => {
  it('is 85, the exact boundary pctTone colors green', () => {
    expect(STRONG_MATCH_PCT).toBe(85);
    expect(pctTone(STRONG_MATCH_PCT)).toBe('#34D399'); // green at the threshold
    expect(pctTone(STRONG_MATCH_PCT - 1)).not.toBe('#34D399'); // amber below it
  });
});

describe('pairMatchPct — the ONE picked-pair kernel (S66 FIX-A)', () => {
  const azBase = vm({
    provider: 'Azure',
    vmSizeName: 'E8s_v5',
    category: 'Memory Optimized',
    vcpus: 8,
    memoryGib: 64,
    networkMbps: 12500,
  });
  const awsPeer = vm({
    provider: 'AWS',
    vmSizeName: 'r7i.2xlarge',
    category: 'Memory Optimized',
    vcpus: 8,
    memoryGib: 64,
    networkMbps: 12500,
  });
  const awsOtherCat = vm({
    provider: 'AWS',
    vmSizeName: 'm7i.2xlarge',
    category: 'General Purpose',
    vcpus: 8,
    memoryGib: 32,
    networkMbps: 12500,
  });

  it('same-category pairs score exactly like the bare distance kernel (dock === Specs)', () => {
    const viaKernel = pairMatchPct(azBase, awsPeer);
    const viaSpecsPath = matchPct(vmDistance(vmFeatures(azBase), vmFeatures(awsPeer)));
    expect(viaKernel).toBe(viaSpecsPath);
    expect(viaKernel).toBe(100); // identical spec
  });

  it('is symmetric-deterministic for a pair regardless of the calling surface', () => {
    // The dock and the Specs verdict both call this one function — same rows in,
    // same number out, every time.
    expect(pairMatchPct(azBase, awsPeer)).toBe(pairMatchPct(azBase, awsPeer));
  });

  it('a cross-category picked pair reads as a finite closest-alternative %, not 0', () => {
    const bare = matchPct(vmDistance(vmFeatures(azBase), vmFeatures(awsOtherCat)));
    expect(bare).toBe(0); // the old no-opts path: category gate → Infinity → 0%
    const kernel = pairMatchPct(azBase, awsOtherCat);
    expect(kernel).not.toBeNull();
    expect(kernel!).toBeGreaterThan(0);
    // …and matches the ranked paths' cross-category fallback scoring exactly.
    expect(kernel).toBe(
      matchPct(
        vmDistance(vmFeatures(azBase), vmFeatures(awsOtherCat), {
          crossCategoryPenalty: CROSS_CATEGORY_PENALTY,
        }),
      ),
    );
  });

  it('a Confidential base scores a confidential-CAPABLE peer on the bridge penalty', () => {
    const dcBase = vm({
      provider: 'Azure',
      vmSizeName: 'Standard_DC8as_v5',
      family: 'DCasv5',
      category: 'Confidential',
      vcpus: 8,
      memoryGib: 32,
    });
    // AWS m6a is SEV-SNP-capable → the ranked ladder's rung-2 bridge applies.
    const m6a = vm({
      provider: 'AWS',
      vmSizeName: 'm6a.2xlarge',
      family: 'm6a',
      category: 'General Purpose',
      vcpus: 8,
      memoryGib: 32,
    });
    const viaBridge = matchPct(
      vmDistance(vmFeatures(dcBase), vmFeatures(m6a), {
        crossCategoryPenalty: CONFIDENTIAL_PEER_PENALTY,
      }),
    );
    const viaGeneric = matchPct(
      vmDistance(vmFeatures(dcBase), vmFeatures(m6a), {
        crossCategoryPenalty: CROSS_CATEGORY_PENALTY,
      }),
    );
    const kernel = pairMatchPct(dcBase, m6a);
    expect(kernel).toBe(viaBridge);
    expect(kernel!).toBeGreaterThan(viaGeneric); // the bridge is closer than generic fallback
  });
});

describe('bomShowdownInsights — ★ for leaders only (S66 FIX-A)', () => {
  const baseLines = [pLine({ baseVmSizeName: 'A', matchVmSizeName: 'A', matchPct: 100 })];

  it('strong-count ties make ALL tied clouds leaders (situational best, not a single crown)', () => {
    const aws = pScenario('AWS', [pLine({ matchVmSizeName: 'a1', matchPct: 95 })]);
    const gcp = pScenario('GCP', [pLine({ matchVmSizeName: 'g1', matchPct: 91 })]);
    const out = bomShowdownInsights(port(baseLines, [aws, gcp]));
    expect(out[0].standout).toBeDefined();
    expect(out[1].standout).toBeDefined();
    expect(out[0].note).toBeUndefined();
    expect(out[1].note).toBeUndefined();
  });

  it('with no strong lines anywhere, the highest avg match leads; the rest get notes', () => {
    const aws = pScenario('AWS', [pLine({ matchVmSizeName: 'a1', matchPct: 80 })], { avgMatchPct: 80 });
    const gcp = pScenario('GCP', [pLine({ matchVmSizeName: 'g1', matchPct: 70 })], { avgMatchPct: 70 });
    const out = bomShowdownInsights(port(baseLines, [aws, gcp]));
    expect(out[0].standout).toContain('80% avg match');
    expect(out[0].note).toBeUndefined();
    expect(out[1].standout).toBeUndefined();
    expect(out[1].note).toContain('70% avg match');
  });

  it('accepts pre-computed stats (perf path) with identical output', () => {
    const aws = pScenario('AWS', [pLine({ matchVmSizeName: 'a1', matchPct: 95 })]);
    const ported = port(baseLines, [aws]);
    const stats = bomCloudStats(ported);
    expect(bomShowdownInsights(ported, stats)).toEqual(bomShowdownInsights(ported));
    expect(bomSpecsVerdict(ported, stats)).toEqual(bomSpecsVerdict(ported));
  });
});

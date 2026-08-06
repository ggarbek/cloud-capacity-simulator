/**
 * v2.12 (Phase F) — Competitive-offering helpers acceptance tests.
 */
import { describe, expect, it } from 'vitest';
import {
  findEquivalents,
  priceCompare,
  regionAvailability,
  specDeltas,
  listEquivalencyBaselines,
  timeHorizonCosts,
  normalizedRates,
} from './competitive';
import type { EquivalencyEntry, UserVm } from '../types';

function vm(
  name: string,
  provider: 'Azure' | 'AWS' | 'GCP',
  vcpus: number,
  memoryGib: number,
  overrides: Partial<UserVm> = {},
): UserVm {
  return {
    vmSizeName: name,
    provider,
    family: 'test',
    vmGeneration: 'test',
    series: 'test',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: '',
    spilloverTarget: 'N/A',
    processor: 'test',
    vcpus,
    memoryGib,
    networkMbps: 16_000,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    hourlyUsd: 1.0,
    riOneYrHourlyUsd: 0.62,
    riThreeYrHourlyUsd: 0.42,
    region: 'East US 2',
    ...overrides,
  };
}

describe('findEquivalents', () => {
  const vms: UserVm[] = [
    vm('Standard_M64s', 'Azure', 64, 1024),
    vm('m7i.16xlarge', 'AWS', 64, 1024, { region: 'us-east-1' }),
    vm('n2-highmem-64', 'GCP', 64, 864, { region: 'us-central1' }),
  ];
  const eq: EquivalencyEntry[] = [
    {
      azureSku: 'Standard_M64s',
      awsSku: 'm7i.16xlarge',
      gcpSku: 'n2-highmem-64',
      notes: '1 TiB memory tier',
    },
  ];

  it('resolves baseline + AWS + GCP catalog rows when all are present', () => {
    const r = findEquivalents('Standard_M64s', vms, eq);
    expect(r.baseline?.vmSizeName).toBe('Standard_M64s');
    expect(r.rows.aws[0]?.sku).toBe('m7i.16xlarge');
    expect(r.rows.aws[0]?.catalogRow?.vcpus).toBe(64);
    expect(r.rows.gcp[0]?.sku).toBe('n2-highmem-64');
    expect(r.rows.gcp[0]?.catalogRow?.region).toBe('us-central1');
  });

  it('returns null catalogRow when equivalency mentions a missing SKU', () => {
    const r = findEquivalents('Standard_M64s', [vms[0]], eq); // only Azure in catalog
    expect(r.rows.aws[0]?.catalogRow).toBeNull();
    expect(r.rows.aws[0]?.sku).toBe('m7i.16xlarge');
  });

  it('returns empty rows when baseline has no equivalency entry', () => {
    const r = findEquivalents('Standard_M999', vms, eq);
    expect(r.rows.aws).toEqual([]);
    expect(r.rows.gcp).toEqual([]);
  });

  it('falls back to the closest same-category match when no equivalency is authored', () => {
    const burst: UserVm[] = [
      vm('Standard_B4as_v2', 'Azure', 4, 16),
      vm('t3.xlarge', 'AWS', 4, 16, { region: 'us-east-1' }),
      vm('e2-standard-4', 'GCP', 4, 16, { region: 'us-central1' }),
    ];
    const r = findEquivalents('Standard_B4as_v2', burst, []); // empty equivalency table
    expect(r.baseline?.vmSizeName).toBe('Standard_B4as_v2');
    // AWS + GCP analogs are inferred algorithmically (closest same-category),
    // not authored — so the side-by-side is never empty.
    expect(r.rows.aws[0]?.sku).toBe('t3.xlarge');
    expect(r.rows.aws[0]?.inferred).toBe(true);
    expect(r.rows.aws[0]?.catalogRow?.vcpus).toBe(4);
    expect(r.rows.gcp[0]?.sku).toBe('e2-standard-4');
    expect(r.rows.gcp[0]?.inferred).toBe(true);
  });

  it('prefers the authored equivalent over the algorithmic fallback', () => {
    const multi: UserVm[] = [
      ...vms,
      vm('m7i.8xlarge', 'AWS', 32, 512, { region: 'us-east-1' }), // a worse-fit decoy
    ];
    const r = findEquivalents('Standard_M64s', multi, eq);
    // Authored AWS analog (m7i.16xlarge) wins; no inferred flag.
    expect(r.rows.aws[0]?.sku).toBe('m7i.16xlarge');
    expect(r.rows.aws[0]?.inferred).toBeFalsy();
  });

  it('biases catalog lookup to the regionBias provider region', () => {
    const multi: UserVm[] = [
      ...vms,
      vm('m7i.16xlarge', 'AWS', 64, 1024, { region: 'us-west-2', hourlyUsd: 1.1 }),
    ];
    const r = findEquivalents('Standard_M64s', multi, eq, {
      regionBias: { AWS: 'us-west-2' },
    });
    expect(r.rows.aws[0]?.catalogRow?.region).toBe('us-west-2');
  });
});

describe('priceCompare', () => {
  const vms: UserVm[] = [
    vm('Standard_M64s', 'Azure', 64, 1024, { hourlyUsd: 4.0 }),
    vm('m7i.16xlarge', 'AWS', 64, 1024, { hourlyUsd: 3.8, region: 'us-east-1' }),
  ];
  const eq: EquivalencyEntry[] = [
    { azureSku: 'Standard_M64s', awsSku: 'm7i.16xlarge', gcpSku: 'missing-gcp-sku' },
  ];

  it('emits Azure → AWS → GCP bars in canonical order', () => {
    const bars = priceCompare(findEquivalents('Standard_M64s', vms, eq));
    expect(bars.map((b) => b.provider)).toEqual(['Azure', 'AWS', 'GCP']);
    expect(bars[0].payg).toBe(4.0);
    expect(bars[1].payg).toBe(3.8);
    // GCP equivalent SKU is missing from catalog — bar emitted with null rates
    expect(bars[2].sku).toBe('missing-gcp-sku');
    expect(bars[2].payg).toBeNull();
  });
});

describe('regionAvailability', () => {
  const vms: UserVm[] = [
    vm('Standard_M64s', 'Azure', 64, 1024, { region: 'East US 2' }),
    vm('Standard_M64s', 'Azure', 64, 1024, { region: 'West Europe', hourlyUsd: 4.2 }),
    vm('m7i.16xlarge', 'AWS', 64, 1024, { region: 'us-east-1' }),
  ];
  const eq: EquivalencyEntry[] = [
    { azureSku: 'Standard_M64s', awsSku: 'm7i.16xlarge' },
  ];

  it('unions regions across baseline + equivalents', () => {
    const r = regionAvailability(findEquivalents('Standard_M64s', vms, eq), vms);
    expect(r.regions).toContain('East US 2');
    expect(r.regions).toContain('West Europe');
    expect(r.regions).toContain('us-east-1');
    const azureRow = r.rows.find((row) => row.provider === 'Azure');
    expect(azureRow?.available.has('East US 2')).toBe(true);
    expect(azureRow?.available.has('West Europe')).toBe(true);
    expect(azureRow?.available.has('us-east-1')).toBe(false);
  });
});

describe('specDeltas', () => {
  const base = vm('Standard_M64s', 'Azure', 64, 1024, {
    networkMbps: 16_000,
    localStorageGiB: 2_048,
  });

  it('flags memory + network differences ≥10% apart', () => {
    const equiv = vm('AWS_BIG', 'AWS', 64, 2_048, {
      networkMbps: 32_000,
      localStorageGiB: 2_048,
    });
    const deltas = specDeltas(base, equiv, 'AWS');
    const dims = deltas.map((d) => d.dim);
    expect(dims).toContain('memory');
    expect(dims).toContain('network');
    expect(dims).not.toContain('localStorage');
    expect(deltas.find((d) => d.dim === 'memory')?.equivalentBetter).toBe(true);
  });

  it('flags accelerator categorical mismatch', () => {
    const equiv = vm('AWS_GPU', 'AWS', 64, 1024, {
      acceleratorType: 'NVIDIA H100',
    });
    const deltas = specDeltas(base, equiv, 'AWS');
    expect(deltas.find((d) => d.dim === 'accelerator')?.equivalentBetter).toBe(
      true,
    );
  });

  it('returns no deltas when specs are within 10% across all dims', () => {
    const equiv = vm('AWS_SAME', 'AWS', 64, 1024, {
      networkMbps: 16_500,
      localStorageGiB: 2_100,
    });
    const deltas = specDeltas(base, equiv, 'AWS');
    expect(deltas).toEqual([]);
  });
});

describe('listEquivalencyBaselines', () => {
  it('returns sorted distinct Azure SKUs from the equivalency list', () => {
    const eq: EquivalencyEntry[] = [
      { azureSku: 'Standard_M64s' },
      { azureSku: 'Standard_M8ms' },
      { azureSku: 'Standard_M64s', awsSku: 'alt-aws' }, // duplicate Azure SKU
      { awsSku: 'orphan-no-azure' },
    ];
    expect(listEquivalencyBaselines(eq)).toEqual([
      'Standard_M64s',
      'Standard_M8ms',
    ]);
  });
});

// v2.52.30 — the Pricing page's Commitment-term toggle reprices the cross-cloud
// cost matrix. timeHorizonCosts(equivalents, term) must apply the SELECTED tier
// (falling back to PAYG when a SKU lacks that RI tier), not always the best rate.
describe('timeHorizonCosts — term-aware repricing', () => {
  const HOURS_PER_MONTH = 730;
  const vms: UserVm[] = [
    // Azure baseline: PAYG 1.0 / 1y 0.62 / 3y 0.42.
    vm('Standard_M64s', 'Azure', 64, 1024),
    vm('m7i.16xlarge', 'AWS', 64, 1024, { region: 'us-east-1' }),
    vm('n2-highmem-64', 'GCP', 64, 864, { region: 'us-central1' }),
  ];
  const eq: EquivalencyEntry[] = [
    { azureSku: 'Standard_M64s', awsSku: 'm7i.16xlarge', gcpSku: 'n2-highmem-64' },
  ];
  const equivalents = findEquivalents('Standard_M64s', vms, eq);
  const azure = (term: 'payg' | '1y' | '3y' | undefined) =>
    timeHorizonCosts(equivalents, term).find((h) => h.provider === 'Azure')!;

  it('prices every horizon at the selected term, not the best rate', () => {
    expect(azure('payg').oneMonthBest).toBeCloseTo(1.0 * HOURS_PER_MONTH, 5);
    expect(azure('payg').bestRateLabel).toBe('PAYG');
    expect(azure('1y').oneMonthBest).toBeCloseTo(0.62 * HOURS_PER_MONTH, 5);
    expect(azure('1y').bestRateLabel).toBe('1y RI');
    expect(azure('3y').oneMonthBest).toBeCloseTo(0.42 * HOURS_PER_MONTH, 5);
    expect(azure('3y').bestRateLabel).toBe('3y RI');
  });

  it('keeps the PAYG baseline for the "vs PAYG" delta regardless of term', () => {
    expect(azure('3y').oneMonthPayg).toBeCloseTo(1.0 * HOURS_PER_MONTH, 5);
  });

  it('falls back to PAYG (labelled honestly) when the SKU lacks the requested tier', () => {
    const noRi: UserVm[] = [
      vm('Standard_M64s', 'Azure', 64, 1024, {
        riOneYrHourlyUsd: undefined,
        riThreeYrHourlyUsd: undefined,
      }),
    ];
    const eqNoRi = findEquivalents('Standard_M64s', noRi, [{ azureSku: 'Standard_M64s' }]);
    const row = timeHorizonCosts(eqNoRi, '3y').find((h) => h.provider === 'Azure')!;
    expect(row.oneMonthBest).toBeCloseTo(1.0 * HOURS_PER_MONTH, 5);
    expect(row.bestRateLabel).toBe('PAYG');
  });

  it('with no term, still uses the best available rate (legacy behaviour)', () => {
    expect(azure(undefined).oneMonthBest).toBeCloseTo(0.42 * HOURS_PER_MONTH, 5);
    expect(azure(undefined).bestRateLabel).toBe('3y RI');
  });
});

// ── A2: confidential/HPC loud-fallback ladder + caveat propagation ───────────
describe('ensureProviderMatch — fallback ladder + caveats', () => {
  it('rung 2: a Confidential baseline bridges to a confidential-CAPABLE peer with a note + caveats', () => {
    // Azure Confidential (dcasv5 → Confidential). AWS has NO confidential family,
    // but m6a is confidential-CAPABLE (opt-in TEE) and m7i is not → rung 2 picks m6a.
    const vms: UserVm[] = [
      vm('Standard_DC8as_v5', 'Azure', 8, 32, { family: 'dcasv5' }),
      vm('m6a.2xlarge', 'AWS', 8, 32, { family: 'm6a', region: 'us-east-1' }),
      vm('m7i.2xlarge', 'AWS', 8, 32, { family: 'm7i', region: 'us-east-1' }),
    ];
    const r = findEquivalents('Standard_DC8as_v5', vms, [{ azureSku: 'Standard_DC8as_v5' }]);
    const m = r.rows.aws[0];
    expect(m.sku).toBe('m6a.2xlarge'); // capable peer, not the non-capable m7i
    expect(m.notes).toBe('confidential-capable peer (opt-in TEE)');
    expect(m.inferred).toBe(true);
    expect(m.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
    expect(m.stretch).toBe(true);
  });

  it('rung 3: an HPC baseline with no same-category peer falls back loudly with caveats + note', () => {
    // Azure HPC (hb → High Performance Computing) vs an AWS catalog of only GP.
    const vms: UserVm[] = [
      vm('Standard_HB120rs_v3', 'Azure', 120, 456, { family: 'hb' }),
      vm('m7i.2xlarge', 'AWS', 8, 32, { family: 'm7i', region: 'us-east-1' }),
    ];
    const r = findEquivalents('Standard_HB120rs_v3', vms, [{ azureSku: 'Standard_HB120rs_v3' }]);
    const m = r.rows.aws[0];
    expect(m.sku).toBe('m7i.2xlarge');
    expect(m.notes).toBe('closest alternative — different category');
    expect(m.caveats?.some((c) => c.kind === 'category-fallback')).toBe(true);
    // Loudly flagged — never rendered as a clean peer.
    expect(m.stretch).toBe(true);
    // Not a confidential-peer (HPC base, no TEE involved).
    expect(m.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(false);
  });
});

describe('priceCompare + timeHorizonCosts — caveat propagation (A2)', () => {
  // A confidential baseline that resolves via the bridge ladder → both the
  // pricing bar and the horizon row must carry the same caveats/stretch.
  const vms: UserVm[] = [
    vm('Standard_DC8as_v5', 'Azure', 8, 32, { family: 'dcasv5' }),
    vm('m6a.2xlarge', 'AWS', 8, 32, { family: 'm6a', region: 'us-east-1' }),
  ];
  const equivalents = findEquivalents('Standard_DC8as_v5', vms, [{ azureSku: 'Standard_DC8as_v5' }]);

  it('priceCompare copies caveats/stretch onto the analog bar; baseline bar has none', () => {
    const bars = priceCompare(equivalents);
    const azureBar = bars.find((b) => b.provider === 'Azure')!;
    const awsBar = bars.find((b) => b.provider === 'AWS')!;
    expect(azureBar.caveats).toBeUndefined();
    expect(azureBar.stretch).toBeFalsy();
    expect(awsBar.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
    expect(awsBar.stretch).toBe(true);
  });

  it('timeHorizonCosts copies caveats/stretch onto the analog row; baseline row has none', () => {
    const rows = timeHorizonCosts(equivalents, 'payg');
    const azureRow = rows.find((h) => h.provider === 'Azure')!;
    const awsRow = rows.find((h) => h.provider === 'AWS')!;
    expect(azureRow.caveats).toBeUndefined();
    expect(azureRow.stretch).toBeFalsy();
    expect(awsRow.caveats?.some((c) => c.kind === 'confidential-feature-peer')).toBe(true);
    expect(awsRow.stretch).toBe(true);
  });
});

describe('normalizedRates (A2)', () => {
  const HOURS = 1; // per-hour rates, no horizon multiply
  void HOURS;
  const vms: UserVm[] = [
    // Azure PAYG 1.0 / 1y 0.62 / 3y 0.42, 64 vCPU / 1024 GiB.
    vm('Standard_M64s', 'Azure', 64, 1024),
    vm('m7i.16xlarge', 'AWS', 64, 512, { region: 'us-east-1', hourlyUsd: 2.0 }),
  ];
  const eq: EquivalencyEntry[] = [
    { azureSku: 'Standard_M64s', awsSku: 'm7i.16xlarge' },
  ];
  const equivalents = findEquivalents('Standard_M64s', vms, eq);

  it('computes correct $/vCPU·hr and $/GiB·hr at PAYG', () => {
    const rows = normalizedRates(equivalents, 'payg');
    const az = rows.find((r) => r.provider === 'Azure')!;
    expect(az.usdPerVcpuHr).toBeCloseTo(1.0 / 64, 9);
    expect(az.usdPerGibHr).toBeCloseTo(1.0 / 1024, 9);
    expect(az.rateLabel).toBe('PAYG');
    const aws = rows.find((r) => r.provider === 'AWS')!;
    expect(aws.usdPerVcpuHr).toBeCloseTo(2.0 / 64, 9);
    expect(aws.usdPerGibHr).toBeCloseTo(2.0 / 512, 9);
  });

  it('prices at the selected term (1y RI) when present', () => {
    const az = normalizedRates(equivalents, '1y').find((r) => r.provider === 'Azure')!;
    expect(az.usdPerVcpuHr).toBeCloseTo(0.62 / 64, 9);
    expect(az.rateLabel).toBe('1y RI');
  });

  it('falls back to PAYG (labelled honestly) when the SKU lacks the requested term tier', () => {
    const noRi: UserVm[] = [
      vm('Standard_M64s', 'Azure', 64, 1024, {
        riOneYrHourlyUsd: undefined,
        riThreeYrHourlyUsd: undefined,
      }),
    ];
    const e = findEquivalents('Standard_M64s', noRi, [{ azureSku: 'Standard_M64s' }]);
    const az = normalizedRates(e, '3y').find((r) => r.provider === 'Azure')!;
    expect(az.usdPerVcpuHr).toBeCloseTo(1.0 / 64, 9);
    expect(az.rateLabel).toBe('PAYG');
  });

  it('null-safe: missing rate OR missing divisor yields null (no divide-by-zero)', () => {
    const weird: UserVm[] = [
      // No rate at all → null per-unit even with valid divisors.
      vm('Standard_M64s', 'Azure', 64, 1024, {
        hourlyUsd: undefined,
        riOneYrHourlyUsd: undefined,
        riThreeYrHourlyUsd: undefined,
      }),
      // Zero divisors → null per-unit even with a valid rate.
      vm('m7i.16xlarge', 'AWS', 0, 0, { region: 'us-east-1', hourlyUsd: 2.0 }),
    ];
    const e = findEquivalents('Standard_M64s', weird, [
      { azureSku: 'Standard_M64s', awsSku: 'm7i.16xlarge' },
    ]);
    const rows = normalizedRates(e);
    const az = rows.find((r) => r.provider === 'Azure')!;
    expect(az.usdPerVcpuHr).toBeNull();
    expect(az.usdPerGibHr).toBeNull();
    expect(az.rateLabel).toBe('—');
    const aws = rows.find((r) => r.provider === 'AWS')!;
    expect(aws.usdPerVcpuHr).toBeNull();
    expect(aws.usdPerGibHr).toBeNull();
  });
});

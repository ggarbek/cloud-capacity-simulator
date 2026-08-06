// Offline unit tests for the GCP GPU-pricing reconstruction.
//
// These exercise the PURE pieces of gcp-prices.mjs (no API key, no network):
//   • gpuModelFromSku  — robust matching of the per-GPU SKU description variants
//   • gpuMachineRate   — host vCPU+RAM cost PLUS gpuCount × per-GPU rate, with
//                        the fail-safe null when any component is missing
//   • assembleGpu      — emits a rate only when host vCPU SKU + host RAM SKU +
//                        per-GPU SKU are ALL present for the region; SKIPS the
//                        machine type (no rate) when the GPU SKU is absent, so a
//                        GPU type is never under-priced as a vCPU+RAM-only number
//   • matchFamily      — accelerator host families a2/a3/g2 resolve; the GPU SKU
//                        itself does not pollute a vCPU/RAM family
//
// The live ingest in gcp-prices.mjs is import-guarded (runs only when executed
// directly), so importing it here does not require GCP_API_KEY.
import { describe, it, expect } from 'vitest';
import {
  gpuMachineRate,
  gpuModelFromSku,
  gpuTermFromSku,
  assembleGpu,
  buildComponentRates,
  GPU_MACHINE_TYPES,
  matchFamily,
} from './gcp-prices.mjs';

describe('gpuModelFromSku', () => {
  it('matches A100 40GB (no GB token) vs A100 80GB', () => {
    expect(gpuModelFromSku('Nvidia Tesla A100 GPU running in Americas')).toBe('A100 40GB');
    expect(gpuModelFromSku('Nvidia Tesla A100 80GB GPU running in EMEA')).toBe('A100 80GB');
    expect(gpuModelFromSku('Nvidia A100 80GB GPU running in APAC')).toBe('A100 80GB');
  });
  it('matches H100 (80GB implicit) with or without the GB token', () => {
    expect(gpuModelFromSku('Nvidia H100 80GB GPU running in Americas')).toBe('H100 80GB');
    expect(gpuModelFromSku('Nvidia H100 GPU running in Americas')).toBe('H100 80GB');
  });
  it('matches L4, including the committed-use description', () => {
    expect(gpuModelFromSku('Nvidia L4 GPU running in APAC')).toBe('L4');
    expect(gpuModelFromSku('Commitment v1: Nvidia L4 GPU in Frankfurt for 1 Year')).toBe('L4');
  });
  it('returns null for non-GPU SKUs (host vCPU/RAM components and noise)', () => {
    expect(gpuModelFromSku('A2 Instance Core running in Americas')).toBeNull();
    expect(gpuModelFromSku('A3 Instance Ram running in EMEA')).toBeNull();
    expect(gpuModelFromSku('N2 Instance Core running in Paris')).toBeNull();
    expect(gpuModelFromSku('Network Egress')).toBeNull();
  });
});

describe('matchFamily — accelerator host families', () => {
  it('resolves a2/a3/g2 host vCPU/RAM SKUs', () => {
    expect(matchFamily('A2 Instance Core running in Americas')).toBe('a2');
    expect(matchFamily('A3 Instance Ram running in EMEA')).toBe('a3');
    expect(matchFamily('G2 Instance Core running in APAC')).toBe('g2');
  });
  it('rejects the GPU SKU itself (never a vCPU/RAM family)', () => {
    expect(matchFamily('Nvidia Tesla A100 GPU running in Americas')).toBeNull();
    expect(matchFamily('Nvidia H100 80GB GPU running in Americas')).toBeNull();
    expect(matchFamily('Nvidia L4 GPU running in APAC')).toBeNull();
  });
});

describe('gpuMachineRate — host + gpuCount × per-GPU rate', () => {
  const shape = { vcpu: 12, ram: 85, gpuCount: 1 }; // a2-highgpu-1g
  it('adds gpuCount × gpuRate to the host vCPU+RAM cost', () => {
    // host = 12*0.03 + 85*0.004 = 0.36 + 0.34 = 0.70 ; + 1*2.5 = 3.20
    const v = gpuMachineRate(shape, { cpu: 0.03, ram: 0.004 }, 2.5);
    expect(v).toBeCloseTo(3.2, 6);
  });
  it('scales by gpuCount', () => {
    const eight = { vcpu: 96, ram: 680, gpuCount: 8 }; // a2-highgpu-8g
    const v1 = gpuMachineRate(eight, { cpu: 0.03, ram: 0.004 }, 2.5); // +8*2.5 = +20
    const host = 96 * 0.03 + 680 * 0.004; // 2.88 + 2.72 = 5.6
    expect(v1).toBeCloseTo(host + 20, 6);
  });
  it('returns null (fail-safe) when the GPU rate is missing', () => {
    expect(gpuMachineRate(shape, { cpu: 0.03, ram: 0.004 }, null)).toBeNull();
    expect(gpuMachineRate(shape, { cpu: 0.03, ram: 0.004 }, undefined)).toBeNull();
  });
  it('returns null when a host component is missing', () => {
    expect(gpuMachineRate(shape, { cpu: null, ram: 0.004 }, 2.5)).toBeNull();
    expect(gpuMachineRate(shape, { cpu: 0.03, ram: undefined }, 2.5)).toBeNull();
  });
});

describe('assembleGpu — region-level fail-safe skip', () => {
  // One region with a2 host vCPU/RAM priced for all three terms.
  const componentRates = {
    'us-central1': {
      a2: {
        cpu: { payg: 0.03, ri1y: 0.02, ri3y: 0.015 },
        ram: { payg: 0.004, ri1y: 0.003, ri3y: 0.002 },
      },
    },
  };

  it('emits a2 GPU rates when the per-GPU SKU is present', () => {
    const gpuRates = { 'us-central1': { 'A100 40GB': { payg: 2.5, ri1y: 1.8, ri3y: 1.2 } } };
    const byRegion = {};
    assembleGpu(byRegion, componentRates, gpuRates);
    const out = byRegion['us-central1'];
    expect(out).toBeTruthy();
    // a2-highgpu-1g = 12*0.03 + 85*0.004 + 1*2.5 = 0.36 + 0.34 + 2.5 = 3.20
    expect(out['a2-highgpu-1g'].payg).toBeCloseTo(3.2, 6);
    // a2-highgpu-8g = 96*0.03 + 680*0.004 + 8*2.5 = 2.88 + 2.72 + 20 = 25.6
    expect(out['a2-highgpu-8g'].payg).toBeCloseTo(25.6, 6);
    // The 80GB types should NOT be priced — only the A100 40GB SKU was present.
    expect(out['a2-ultragpu-1g']).toBeUndefined();
  });

  it('SKIPS every a2 type when the GPU SKU is absent (no under-priced rate)', () => {
    const gpuRates = { 'us-central1': {} }; // no GPU SKU at all
    const byRegion = {};
    assembleGpu(byRegion, componentRates, gpuRates);
    // Region bucket should be empty/absent — never a vCPU+RAM-only a2 rate.
    const out = byRegion['us-central1'] ?? {};
    for (const mt of Object.keys(GPU_MACHINE_TYPES)) {
      expect(out[mt]).toBeUndefined();
    }
  });

  it('SKIPS a2 types when the accelerator host family is unpriced', () => {
    const gpuRates = { 'us-central1': { 'A100 40GB': { payg: 2.5 } } };
    const byRegion = {};
    assembleGpu(byRegion, { 'us-central1': {} }, gpuRates); // no a2 host family
    expect(byRegion['us-central1']).toBeUndefined();
  });

  it('prices only the terms that have all three components', () => {
    // GPU SKU present for payg only → ri1y/ri3y must be null.
    const gpuRates = { 'us-central1': { 'A100 40GB': { payg: 2.5 } } };
    const byRegion = {};
    assembleGpu(byRegion, componentRates, gpuRates);
    const row = byRegion['us-central1']['a2-highgpu-1g'];
    expect(row.payg).toBeCloseTo(3.2, 6);
    expect(row.ri1y).toBeNull();
    expect(row.ri3y).toBeNull();
  });
});

describe('gpuTermFromSku — per-GPU SKU on-demand vs committed-use classification', () => {
  it('classifies an on-demand per-GPU SKU as payg (no commitment token)', () => {
    expect(gpuTermFromSku('Nvidia Tesla A100 GPU running in Americas')).toBe('payg');
    expect(gpuTermFromSku('Nvidia H100 80GB GPU running in Americas')).toBe('payg');
    expect(gpuTermFromSku('Nvidia L4 GPU running in APAC')).toBe('payg');
  });
  it('classifies a 1-Year committed per-GPU SKU as ri1y', () => {
    expect(gpuTermFromSku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 1 Year')).toBe('ri1y');
    expect(gpuTermFromSku('Commitment v1: Nvidia L4 GPU in Frankfurt for 1 Year')).toBe('ri1y');
    expect(gpuTermFromSku('Commitment: Nvidia H100 80GB GPU for 12 month')).toBe('ri1y');
  });
  it('classifies a 3-Year committed per-GPU SKU as ri3y', () => {
    expect(gpuTermFromSku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 3 Year')).toBe('ri3y');
    expect(gpuTermFromSku('Commitment v1: Nvidia H100 80GB GPU in Iowa for 3 Year')).toBe('ri3y');
  });
  it('returns null (drop) for a committed SKU with no horizon — never binned into payg', () => {
    expect(gpuTermFromSku('Commitment v1: Nvidia Tesla A100 GPU in Iowa')).toBeNull();
  });
});

// ── End-to-end: buildComponentRates must select the term-correct per-GPU SKU ──
// This is the bug a keyed re-bake exposed: a CHEAPER committed-use A100/H100
// per-GPU SKU was leaking into the on-demand `payg` slot, under-pricing a2/a3
// and inverting the term ordering (ri > payg). Feeding mock SKU/description
// inputs proves payg uses the on-demand SKU and ri1y/ri3y the committed ones.
describe('buildComponentRates — term-correct per-GPU SKU selection', () => {
  const region = 'us-central1';
  // One descending committed ladder: payg > ri1y > ri3y (monotonic by construction).
  const A100_PAYG = 3.67;
  const A100_RI1Y = 2.30;
  const A100_RI3Y = 1.50;
  // Helper to shape a catalog SKU the way the GCP Cloud Billing Catalog does.
  const sku = (description, usageType, usd, resourceGroup = 'GPU') => ({
    description,
    category: { resourceFamily: 'Compute', resourceGroup, usageType },
    serviceRegions: [region],
    pricingInfo: [
      { pricingExpression: { tieredRates: [{ unitPrice: { units: String(Math.trunc(usd)), nanos: Math.round((usd % 1) * 1e9) } }] } },
    ],
  });

  // The A100 per-GPU SKUs across all three terms, PLUS a2 host vCPU/RAM so a
  // full machine rate can be assembled if desired. Description carries the term.
  const a100Skus = [
    sku('Nvidia Tesla A100 GPU running in Americas', 'OnDemand', A100_PAYG),
    sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 1 Year', 'Commit1Yr', A100_RI1Y),
    sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 3 Year', 'Commit3Yr', A100_RI3Y),
  ];

  it('(a) payg uses the on-demand GPU SKU; ri1y/ri3y use the committed ones', () => {
    const { gpuRates } = buildComponentRates(a100Skus);
    const g = gpuRates[region]['A100 40GB'];
    expect(g.payg).toBeCloseTo(A100_PAYG, 6);
    expect(g.ri1y).toBeCloseTo(A100_RI1Y, 6);
    expect(g.ri3y).toBeCloseTo(A100_RI3Y, 6);
  });

  it('(b) payg ≥ ri1y ≥ ri3y (monotonic) — no term inversion', () => {
    const { gpuRates } = buildComponentRates(a100Skus);
    const g = gpuRates[region]['A100 40GB'];
    expect(g.payg).toBeGreaterThanOrEqual(g.ri1y);
    expect(g.ri1y).toBeGreaterThanOrEqual(g.ri3y);
  });

  it('(c) a committed-use GPU SKU never sets the payg rate, even when cheaper', () => {
    // The exact failure mode: a CHEAPER committed SKU present; payg must still
    // be the on-demand rate, not the cheaper committed one.
    const { gpuRates } = buildComponentRates([
      sku('Nvidia Tesla A100 GPU running in Americas', 'OnDemand', A100_PAYG),
      sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 1 Year', 'Commit1Yr', A100_RI1Y),
    ]);
    const g = gpuRates[region]['A100 40GB'];
    expect(g.payg).toBeCloseTo(A100_PAYG, 6); // on-demand, NOT the cheaper 2.30
    expect(g.payg).not.toBeCloseTo(A100_RI1Y, 6);
  });

  it('(c2) even if a committed SKU is mis-tagged usageType OnDemand, the description keeps it off payg', () => {
    // Defensive: the description (commitment token) is authoritative, so a
    // committed rate mis-tagged as OnDemand routes to its term, not payg.
    const { gpuRates } = buildComponentRates([
      sku('Nvidia Tesla A100 GPU running in Americas', 'OnDemand', A100_PAYG),
      sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 1 Year', 'OnDemand', A100_RI1Y),
    ]);
    const g = gpuRates[region]['A100 40GB'];
    expect(g.payg).toBeCloseTo(A100_PAYG, 6);
    expect(g.ri1y).toBeCloseTo(A100_RI1Y, 6);
  });

  it('(d) missing on-demand GPU SKU → no payg rate (fail-safe), only committed terms', () => {
    const { gpuRates } = buildComponentRates([
      sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 1 Year', 'Commit1Yr', A100_RI1Y),
      sku('Commitment v1: Nvidia Tesla A100 GPU in Iowa for 3 Year', 'Commit3Yr', A100_RI3Y),
    ]);
    const g = gpuRates[region]['A100 40GB'];
    expect(g.payg).toBeUndefined();
    expect(g.ri1y).toBeCloseTo(A100_RI1Y, 6);
    expect(g.ri3y).toBeCloseTo(A100_RI3Y, 6);
  });

  it('L4 (g2) is unaffected — on-demand SKU sets payg correctly', () => {
    const { gpuRates } = buildComponentRates([
      sku('Nvidia L4 GPU running in Americas', 'OnDemand', 0.5),
      sku('Commitment v1: Nvidia L4 GPU in Iowa for 1 Year', 'Commit1Yr', 0.3),
    ]);
    const g = gpuRates[region]['L4'];
    expect(g.payg).toBeCloseTo(0.5, 6);
    expect(g.ri1y).toBeCloseTo(0.3, 6);
  });

  it('end-to-end machine rate: a2-highgpu-1g payg combines host + on-demand GPU per term', () => {
    // host a2: cpu/ram on-demand; GPU on-demand → payg machine = host + 1×gpu.
    const skus = [
      ...a100Skus,
      sku('A2 Instance Core running in Americas', 'OnDemand', 0.03, 'CPU'),
      sku('A2 Instance Ram running in Americas', 'OnDemand', 0.004, 'RAM'),
    ];
    const { rates, gpuRates } = buildComponentRates(skus);
    const byRegion = {};
    assembleGpu(byRegion, rates, gpuRates);
    const row = byRegion[region]['a2-highgpu-1g'];
    // 12*0.03 + 85*0.004 + 1*3.67 = 0.36 + 0.34 + 3.67 = 4.37
    expect(row.payg).toBeCloseTo(4.37, 6);
  });
});

/**
 * Unit tests for `src/utils/financial.ts`. Locks the calculations the
 * Finance tab will surface so a future refactor can't quietly drift them.
 */
import { describe, expect, it } from 'vitest';
import {
  computeClusterFinancials,
  resolveClusterCapex,
  rollupFleetFinancials,
  usableLife,
  formatUsd,
  formatPayback,
  paybackView,
} from './financial';
import type { FleetSpec, NodeDetail, UserVm } from '../types';

function fleet(overrides: Partial<FleetSpec> = {}): FleetSpec {
  return {
    hardwareGroupName: 'Gen-Test',
    hardwareGroupId: 'gen-test',
    memoryCategory: 'mm',
    rackCount: 1,
    nodesPerRack: 4,
    socketsPerNode: 2,
    coresPerSocket: 16,
    hyperthreadingEnabled: true,
    memoryGibPerNode: 1024,
    throughputCeilingMbps: null,
    isolated: false,
    processor: 'Intel',
    ...overrides,
  };
}

function node(overrides: Partial<NodeDetail> = {}): NodeDetail {
  return {
    nodeId: 'R1N1',
    rack: 1,
    posInRack: 1,
    hardwareGroup: 'Gen-Test',
    state: 'occupied-partial',
    memoryTotalGib: 1024,
    vcpusTotal: 64,
    throughputTotalMbps: null,
    memoryUsedGib: 256,
    vcpusUsed: 16,
    throughputUsedMbps: 0,
    storageThroughputTotalMbps: null,
    storageThroughputUsedMbps: 0,
    strandedMemoryGib: 0,
    strandedVcpus: 0,
    vmsPlaced: [],
    bindingConstraint: 'NONE',
    isSpilloverNode: false,
    ...overrides,
  };
}

const catalog: UserVm[] = [
  {
    vmSizeName: 'Test_M_small',
    vmGeneration: 'Mv3',
    series: 'M-Series',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'Gen-Test',
    spilloverTarget: 'N/A',
    processor: 'Intel',
    vcpus: 16,
    memoryGib: 256,
    networkMbps: 0,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    hourlyUsd: 1, // $1/hr makes the math trivially auditable: 730/mo per VM
  },
];

describe('financial helpers', () => {
  it('resolveClusterCapex: per-node wins over per-rack', () => {
    const c = resolveClusterCapex(
      fleet({ costPerNodeUsd: 75000, costPerRackUsd: 9999999 }),
    );
    expect(c.perNodeUsd).toBe(75000);
    expect(c.totalUsd).toBe(75000 * 4); // 1 rack × 4 nodes
    expect(c.derived).toBe(false);
  });

  it('resolveClusterCapex: derives per-node from per-rack when only rack set', () => {
    const c = resolveClusterCapex(fleet({ costPerRackUsd: 320000 }));
    expect(c.perNodeUsd).toBe(80000); // 320000 / 4 nodes
    expect(c.totalUsd).toBe(320000);
    expect(c.derived).toBe(true);
  });

  it('resolveClusterCapex: undefined when no cost data', () => {
    const c = resolveClusterCapex(fleet());
    expect(c.totalUsd).toBeUndefined();
    expect(c.perNodeUsd).toBeUndefined();
  });

  it('usableLife: defaults to 72 months when unset', () => {
    expect(usableLife(fleet())).toBe(72);
    expect(usableLife(fleet({ usableLifeMonths: 84 }))).toBe(84);
  });

  it('computeClusterFinancials: revenue = placed-VM hourly × 730', () => {
    // 2 nodes, each with 2 placed VMs ($1/hr each) → 4 VMs × $730/mo = $2920/mo
    const nodes = [
      node({
        nodeId: 'R1N1',
        vmsPlaced: [
          { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
          { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
        ],
      }),
      node({
        nodeId: 'R1N2',
        vmsPlaced: [
          { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
          { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
        ],
      }),
    ];
    const f = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet({ costPerNodeUsd: 73000, usableLifeMonths: 60 }), // $73k×4=$292k capex
      nodes,
      catalog,
    });
    expect(f.placedVmCount).toBe(4);
    expect(f.monthlyRevenue).toBe(4 * 730); // $2920
    expect(f.annualRevenue).toBe(4 * 730 * 12);
    expect(f.lifetimeRevenue).toBe(4 * 730 * 60);
    // Depreciation = $292k / 60 = $4866.67/mo
    expect(f.monthlyDepreciation).toBeCloseTo(292000 / 60, 1);
    // Net = $2920 - $4866.67 = -$1946.67 (cluster is losing money at this BOM)
    expect(f.monthlyGrossProfit!).toBeCloseTo(2920 - 292000 / 60, 1);
    // GPM should be negative since net is negative
    expect(f.grossProfitMarginPct).toBeLessThan(0);
    // Payback undefined when net <= 0
    expect(f.paybackMonths).toBeUndefined();
    // Per-node depreciation = $73000 / 60 ≈ $1216.67
    expect(f.perNodeMonthlyDepreciation).toBeCloseTo(73000 / 60, 1);
  });

  it('computeClusterFinancials: payback positive when revenue > depreciation', () => {
    // 80 VMs × $730/mo = $58400/mo revenue. Capex $100k / 60mo = $1666/mo dep.
    // Net = $58400 - $1666 ≈ $56733/mo. Payback = $100k / $56733 ≈ 1.76 mo.
    const placedNodes = Array.from({ length: 4 }, (_, i) =>
      node({
        nodeId: `R1N${i + 1}`,
        vmsPlaced: Array.from({ length: 20 }, () => ({
          vmSizeName: 'Test_M_small',
          vcpus: 16,
          memoryGib: 256,
        })),
      }),
    );
    const f = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet({ costPerNodeUsd: 25000 }), // $100k capex
      nodes: placedNodes,
      catalog,
    });
    expect(f.placedVmCount).toBe(80);
    expect(f.paybackMonths).toBeDefined();
    expect(f.paybackMonths!).toBeGreaterThan(1);
    expect(f.paybackMonths!).toBeLessThan(3);
    expect(f.grossProfitMarginPct!).toBeGreaterThan(90); // very high margin
  });

  it('computeClusterFinancials: no-cost cluster still reports revenue', () => {
    const f = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet(), // no cost data
      nodes: [
        node({
          vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }],
        }),
      ],
      catalog,
    });
    expect(f.monthlyRevenue).toBe(730);
    expect(f.monthlyDepreciation).toBeUndefined();
    expect(f.grossProfitMarginPct).toBeUndefined();
    expect(f.paybackMonths).toBeUndefined();
  });

  it('rollupFleetFinancials: aggregates revenue + capex correctly', () => {
    const a = computeClusterFinancials({
      clusterId: 'a',
      fleet: fleet({ costPerNodeUsd: 50000 }),
      nodes: [
        node({
          vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }],
        }),
      ],
      catalog,
    });
    const b = computeClusterFinancials({
      clusterId: 'b',
      fleet: fleet({ costPerNodeUsd: 50000 }),
      nodes: [
        node({
          vmsPlaced: [
            { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
            { vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 },
          ],
        }),
      ],
      catalog,
    });
    const r = rollupFleetFinancials([a, b]);
    expect(r.clusterCount).toBe(2);
    expect(r.totalCapex).toBe(2 * 50000 * 4); // 2 clusters × 4 nodes × $50k
    expect(r.monthlyRevenue).toBe(3 * 730); // 1 + 2 placed VMs
  });

  // ── Opex (v2.23.14): a cash cost added to the monthly cost so margin +
  //    payback aren't depreciation-only. ───────────────────────────────────
  it('opex folds into monthlyCost + margin, and lengthens net payback', () => {
    // 80 VMs × $730 = $58,400/mo revenue. Capex $100k / 72mo ≈ $1,388.9/mo dep.
    // Opex $500/node/mo × 4 nodes = $2,000/mo. monthlyCost = dep + opex.
    const placedNodes = Array.from({ length: 4 }, (_, i) =>
      node({
        nodeId: `R1N${i + 1}`,
        vmsPlaced: Array.from({ length: 20 }, () => ({
          vmSizeName: 'Test_M_small',
          vcpus: 16,
          memoryGib: 256,
        })),
      }),
    );
    const withoutOpex = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet({ costPerNodeUsd: 25000 }), // $100k capex
      nodes: placedNodes,
      catalog,
    });
    const withOpex = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet({ costPerNodeUsd: 25000, opexPerNodeMonthlyUsd: 500 }),
      nodes: placedNodes,
      catalog,
    });
    expect(withOpex.monthlyOpex).toBe(2000); // $500 × 4 nodes
    expect(withOpex.monthlyCost).toBeCloseTo((withOpex.monthlyDepreciation ?? 0) + 2000, 1);
    // Opex makes the cluster less profitable + slower to pay back than without.
    expect(withOpex.grossProfitMarginPct!).toBeLessThan(withoutOpex.grossProfitMarginPct!);
    expect(withOpex.paybackMonths!).toBeGreaterThan(withoutOpex.paybackMonths!);
  });

  it('opex alone (no capex) still yields a gross margin', () => {
    const f = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet({ opexPerNodeMonthlyUsd: 100 }), // opex only, no capex
      nodes: [
        node({
          vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }],
        }),
      ],
      catalog,
    });
    expect(f.monthlyRevenue).toBe(730);
    expect(f.monthlyDepreciation).toBeUndefined();
    expect(f.monthlyOpex).toBe(400); // $100 × 4 nodes
    expect(f.monthlyCost).toBe(400);
    // Margin = (730 − 400) / 730 ≈ 45.2%
    expect(f.grossProfitMarginPct!).toBeCloseTo(((730 - 400) / 730) * 100, 1);
    expect(f.paybackMonths).toBeUndefined(); // no capex → no payback
  });

  it('rollupFleetFinancials: aggregates opex into monthlyCost', () => {
    const a = computeClusterFinancials({
      clusterId: 'a',
      fleet: fleet({ costPerNodeUsd: 50000, opexPerNodeMonthlyUsd: 200 }),
      nodes: [node({ vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }] })],
      catalog,
    });
    const r = rollupFleetFinancials([a]);
    expect(r.monthlyOpex).toBe(800); // $200 × 4 nodes
    expect(r.monthlyCost).toBeCloseTo((r.monthlyDepreciation ?? 0) + 800, 1);
  });

  it('paybackView: nets opex out of the cash payback, flags opex > revenue', () => {
    // Loss case (revenue < dep): cash payback = capex / (revenue − opex).
    const pv = paybackView({
      monthlyRevenue: 5000,
      monthlyOpex: 1000,
      monthlyDepreciation: 6000, // makes net accounting margin negative
      totalCapex: 400000,
    });
    // 400000 / (5000 − 1000) = 100 months
    expect(pv.value).toContain('yr'); // 100 mo → "8 yr 4 mo"
    // Opex outruns revenue → no cash to recover capex.
    const none = paybackView({
      monthlyRevenue: 800,
      monthlyOpex: 1000,
      monthlyDepreciation: 2000,
      totalCapex: 100000,
    });
    expect(none.value).toBe('—');
    expect(none.note).toMatch(/operating cost/i);
  });

  // ── Rate-aware revenue (v2.23.15): margin + payback follow the selected
  //    PAYG / 1-yr RI / 3-yr RI rate, not always PAYG. ──────────────────────
  it('revenue + margin follow the selected billing rate', () => {
    const ratedCatalog: UserVm[] = [
      {
        ...catalog[0],
        hourlyUsd: 1, // PAYG → $730/mo/VM
        riOneYrHourlyUsd: 0.6, // 1y RI → $438/mo/VM
        riThreeYrHourlyUsd: 0.4, // 3y RI → $292/mo/VM
      },
    ];
    const nodes = [
      node({ vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }] }),
    ];
    const base = { clusterId: 'c-1', fleet: fleet({ costPerNodeUsd: 25000 }), nodes };
    const payg = computeClusterFinancials({ ...base, catalog: ratedCatalog }); // default 'payg'
    const ri1 = computeClusterFinancials({ ...base, catalog: ratedCatalog, rate: 'ri1y' });
    const ri3 = computeClusterFinancials({ ...base, catalog: ratedCatalog, rate: 'ri3y' });
    expect(payg.monthlyRevenue).toBe(730);
    expect(ri1.monthlyRevenue).toBe(438);
    expect(ri3.monthlyRevenue).toBe(292);
    // Lower revenue at the same fixed cost ⇒ strictly lower gross margin.
    expect(ri1.grossProfitMarginPct!).toBeLessThan(payg.grossProfitMarginPct!);
    expect(ri3.grossProfitMarginPct!).toBeLessThan(ri1.grossProfitMarginPct!);
  });

  it('RI rate falls back to PAYG when unpublished', () => {
    // catalog[0] has only hourlyUsd (no RI rates) → all rates resolve to PAYG.
    const nodes = [
      node({ vmsPlaced: [{ vmSizeName: 'Test_M_small', vcpus: 16, memoryGib: 256 }] }),
    ];
    const ri3 = computeClusterFinancials({
      clusterId: 'c-1',
      fleet: fleet(),
      nodes,
      catalog,
      rate: 'ri3y',
    });
    expect(ri3.monthlyRevenue).toBe(730); // fell back to PAYG, not $0
  });

  it('formatUsd / formatPayback render compact strings', () => {
    expect(formatUsd(undefined)).toBe('—');
    expect(formatUsd(150)).toBe('$150.00');
    expect(formatUsd(2500)).toBe('$2.5K');
    expect(formatUsd(1_500_000)).toBe('$1.50M');
    expect(formatUsd(-2_500_000)).toBe('−$2.50M');
    expect(formatPayback(undefined)).toBe('—');
    expect(formatPayback(8.4)).toBe('8.4 mo');
    expect(formatPayback(24)).toBe('2 yr');
    expect(formatPayback(30)).toBe('2 yr 6 mo');
    // A rounded-up remainder carries into the year — never "11 yr 12 mo".
    expect(formatPayback(143.7)).toBe('12 yr');
    expect(formatPayback(35.8)).toBe('3 yr'); // 35.8 → 2.98 rem → rounds to 3 → carry
  });
});

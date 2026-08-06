import { describe, it, expect } from 'vitest';
import { buildBomLineModels } from './BomSpecsView';
import type { CatalogEntry } from '../../types';
import type { BomPortResult, PortedLine, PortedScenario } from '../../utils/bomPort';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({
    vmSizeName: 'x',
    provider: 'Azure',
    family: 'm',
    vcpus: 4,
    memoryGib: 16,
    networkMbps: 0,
    localDiskGib: 0,
    ...o,
  } as CatalogEntry);

const line = (o: Partial<PortedLine>): PortedLine =>
  ({
    baseVmSizeName: 'base',
    quantity: 1,
    matchVmSizeName: null,
    matchPct: null,
    matchQuality: null,
    monthlyUsd: null,
    estimated: false,
    ...o,
  } as PortedLine);

const scenario = (provider: string, lines: PortedLine[]): PortedScenario => ({
  provider,
  lines,
  monthlyTotalUsd: 0,
  hourlyTotalUsd: 0,
  matchedLines: 0,
  unmatchedLines: 0,
  pricedLines: lines.filter((l) => l.monthlyUsd != null).length,
  avgMatchPct: null,
  anyEstimated: false,
});

describe('buildBomLineModels', () => {
  it('zips base + target lines by index and resolves VMs', () => {
    const azBase = vm({ provider: 'Azure', vmSizeName: 'Standard_D4s_v5' });
    const awsMatch = vm({ provider: 'AWS', vmSizeName: 'm6i.xlarge', vcpus: 4, memoryGib: 16 });
    const userVms = [azBase, awsMatch];
    const ported: BomPortResult = {
      baseProvider: 'Azure',
      baseScenario: scenario('Azure', [
        line({ baseVmSizeName: 'Standard_D4s_v5', matchVmSizeName: 'Standard_D4s_v5', matchPct: 100, matchQuality: 'exact', quantity: 3 }),
      ]),
      targetScenarios: [
        scenario('AWS', [
          line({ baseVmSizeName: 'Standard_D4s_v5', matchVmSizeName: 'm6i.xlarge', matchPct: 88, matchQuality: 'close', quantity: 3 }),
        ]),
      ],
      verdict: { cheapestProvider: 'AWS', headline: '', insights: [] },
    };
    const models = buildBomLineModels(ported, userVms);
    expect(models).toHaveLength(1);
    const m = models[0];
    expect(m.index).toBe(0);
    expect(m.baseVmSizeName).toBe('Standard_D4s_v5');
    expect(m.quantity).toBe(3);
    expect(m.baseVm).toBe(azBase);
    // base cell + one target cell
    expect(m.cells.map((c) => c.provider)).toEqual(['Azure', 'AWS']);
    expect(m.cells[0].isBase).toBe(true);
    expect(m.cells[1].isBase).toBe(false);
    expect(m.cells[1].vm).toBe(awsMatch); // resolved from userVms
    expect(m.cells[1].line.matchPct).toBe(88);
  });

  it('resolves a null vm when the target line is unmatched', () => {
    const azBase = vm({ provider: 'Azure', vmSizeName: 'Standard_D4s_v5' });
    const ported: BomPortResult = {
      baseProvider: 'Azure',
      baseScenario: scenario('Azure', [line({ baseVmSizeName: 'Standard_D4s_v5', matchVmSizeName: 'Standard_D4s_v5' })]),
      targetScenarios: [scenario('GCP', [line({ baseVmSizeName: 'Standard_D4s_v5', matchVmSizeName: null })])],
      verdict: { cheapestProvider: null, headline: '', insights: [] },
    };
    const models = buildBomLineModels(ported, [azBase]);
    expect(models[0].cells[1].vm).toBeNull();
  });

  it('does not throw when a target scenario has fewer lines than the base', () => {
    const azBase = vm({ provider: 'Azure', vmSizeName: 'A' });
    const ported: BomPortResult = {
      baseProvider: 'Azure',
      baseScenario: scenario('Azure', [
        line({ baseVmSizeName: 'A', matchVmSizeName: 'A' }),
        line({ baseVmSizeName: 'B', matchVmSizeName: 'B' }),
      ]),
      // AWS scenario only has one line — index 1 is missing.
      targetScenarios: [scenario('AWS', [line({ baseVmSizeName: 'A', matchVmSizeName: 'a1' })])],
      verdict: { cheapestProvider: 'AWS', headline: '', insights: [] },
    };
    const models = buildBomLineModels(ported, [azBase]);
    expect(models).toHaveLength(2);
    // line 0 has base + AWS; line 1 has only base (AWS missing, skipped).
    expect(models[0].cells).toHaveLength(2);
    expect(models[1].cells).toHaveLength(1);
    expect(models[1].cells[0].provider).toBe('Azure');
  });
});

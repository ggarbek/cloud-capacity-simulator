import { describe, it, expect } from 'vitest';
import { AZURE_M_SERIES_SEED, reRateAzureMSeries } from './azureMSeriesSeed';
import type { UserVm } from '../types';

/** A known seed M-series row to anchor the test against real data. */
function seedRow(region: string): UserVm {
  const row = AZURE_M_SERIES_SEED.find(
    (v) => v.vmSizeName === 'Standard_M128ms' && v.region === region,
  );
  if (!row) throw new Error(`seed missing Standard_M128ms in ${region}`);
  return row;
}

describe('reRateAzureMSeries (v2.25.2 returning-user migration)', () => {
  it('covers M-series across many regions (the v2.25.1 fix) incl. Jio India', () => {
    const regions = new Set(
      AZURE_M_SERIES_SEED.filter((v) => /^Standard_M\d/.test(v.vmSizeName)).map(
        (v) => v.region ?? '',
      ),
    );
    expect(regions.size).toBeGreaterThanOrEqual(40); // was 6 before the fix
    expect(regions.has('East US 2')).toBe(true);
    expect(regions.has('West Europe')).toBe(true);
    expect([...regions].some((r) => /Jio India/.test(r))).toBe(true);
  });

  it('overwrites a stale rate with the real seed rate, by (size, region)', () => {
    const we = seedRow('West Europe');
    const stale: UserVm = {
      ...we,
      hourlyUsd: 29.3568, // old multiplier guess
      riOneYrHourlyUsd: 18.2012,
      riThreeYrHourlyUsd: 12.33,
    };
    const [out] = reRateAzureMSeries([stale]);
    expect(out.hourlyUsd).toBe(we.hourlyUsd);
    expect(out.riOneYrHourlyUsd).toBe(we.riOneYrHourlyUsd);
    expect(out.riThreeYrHourlyUsd).toBe(we.riThreeYrHourlyUsd);
  });

  it('leaves a user-uploaded M-series row in a non-seed region untouched', () => {
    const custom: UserVm = {
      ...seedRow('West Europe'),
      region: 'Narnia Central',
      hourlyUsd: 1.11,
      riOneYrHourlyUsd: 0.99,
      riThreeYrHourlyUsd: 0.88,
    };
    const [out] = reRateAzureMSeries([custom]);
    expect(out).toBe(custom); // same reference — untouched
    expect(out.hourlyUsd).toBe(1.11);
  });

  it('leaves non-M and non-Azure rows untouched', () => {
    const dseries: UserVm = { ...seedRow('West Europe'), vmSizeName: 'Standard_D4s_v5', series: 'D' };
    const aws: UserVm = { ...seedRow('West Europe'), provider: 'AWS', hourlyUsd: 5 };
    const [d, a] = reRateAzureMSeries([dseries, aws]);
    expect(d).toBe(dseries);
    expect(a).toBe(aws);
  });

  it('is idempotent — an already-fresh row returns by reference', () => {
    const fresh = seedRow('West Europe');
    const once = reRateAzureMSeries([{ ...fresh }]);
    const twice = reRateAzureMSeries(once);
    expect(twice[0]).toBe(once[0]); // second pass is a no-op
  });
});

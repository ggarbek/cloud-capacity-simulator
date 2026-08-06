/** v2.26.1 — opt-in estimated RI fallback. */
import { describe, it, expect } from 'vitest';
import { resolveDisplayRate } from './estimatedRate';
import type { CatalogEntry } from '../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({ vmSizeName: 'x', provider: 'AWS', hourlyUsd: 1.0, ...o } as CatalogEntry);

describe('resolveDisplayRate', () => {
  it('PAYG is always the real value, never estimated', () => {
    expect(resolveDisplayRate(vm({}), 'payg', true)).toEqual({ value: 1.0, estimated: false });
  });

  it('returns the published RI when present (no estimate even if opted in)', () => {
    const v = vm({ riOneYrHourlyUsd: 0.7, riThreeYrHourlyUsd: 0.5 });
    expect(resolveDisplayRate(v, 'ri1y', true)).toEqual({ value: 0.7, estimated: false });
    expect(resolveDisplayRate(v, 'ri3y', true)).toEqual({ value: 0.5, estimated: false });
  });

  it('missing RI → "—" (undefined) when the toggle is OFF', () => {
    expect(resolveDisplayRate(vm({}), 'ri1y', false)).toEqual({ value: undefined, estimated: false });
  });

  it('missing RI → estimate (PAYG × provider factor) when the toggle is ON, flagged', () => {
    const aws = resolveDisplayRate(vm({ provider: 'AWS', hourlyUsd: 1 }), 'ri1y', true);
    expect(aws.estimated).toBe(true);
    expect(aws.value).toBeCloseTo(0.63, 5); // AWS 1yr ≈ 63% of PAYG
    const az3 = resolveDisplayRate(vm({ provider: 'Azure', hourlyUsd: 1 }), 'ri3y', true);
    expect(az3.estimated).toBe(true);
    expect(az3.value).toBeCloseTo(0.38, 5); // Azure 3yr ≈ 38%
  });

  it('no estimate possible when PAYG itself is missing', () => {
    expect(resolveDisplayRate(vm({ hourlyUsd: undefined }), 'ri1y', true)).toEqual({
      value: undefined,
      estimated: false,
    });
  });
});

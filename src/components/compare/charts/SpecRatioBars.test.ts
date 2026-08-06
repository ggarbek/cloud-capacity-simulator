import { describe, it, expect } from 'vitest';
import { specRatios } from './SpecRatioBars';
import type { CatalogEntry } from '../../../types';

const vm = (o: Partial<CatalogEntry>): CatalogEntry =>
  ({
    vmSizeName: 'x',
    provider: 'AWS',
    family: 'm',
    vcpus: 4,
    memoryGib: 16,
    networkMbps: 0,
    localDiskGib: 0,
    ...o,
  } as CatalogEntry);

describe('specRatios', () => {
  it('computes plain ratios per dimension', () => {
    const base = vm({ vcpus: 4, memoryGib: 16, networkMbps: 10000, localDiskGib: 100 });
    const contender = vm({ vcpus: 8, memoryGib: 32, networkMbps: 5000, localDiskGib: 100 });
    const r = specRatios(base, contender);
    const byKey = Object.fromEntries(r.map((x) => [x.key, x]));
    expect(byKey.vcpu.ratio).toBe(2); // 8/4
    expect(byKey.mem.ratio).toBe(2); // 32/16
    expect(byKey.net.ratio).toBe(0.5); // 5000/10000 — under parity
    expect(byKey.disk.ratio).toBe(1); // 100/100 — parity
  });

  it('always returns exactly four dimensions in a stable order', () => {
    const r = specRatios(vm({}), vm({}));
    expect(r.map((x) => x.key)).toEqual(['vcpu', 'mem', 'net', 'disk']);
  });

  it('does NOT cap the raw ratio (>2x) — capping is a render concern', () => {
    const base = vm({ vcpus: 2 });
    const contender = vm({ vcpus: 20 });
    const vcpu = specRatios(base, contender).find((x) => x.key === 'vcpu')!;
    expect(vcpu.ratio).toBe(10); // helper stays honest; the bar caps at 2x visually
  });

  it('yields ratio=null when the base dimension is missing (zero-spec guard)', () => {
    // Base reports no network / no local disk → those dims are not comparable.
    const base = vm({ networkMbps: 0, localDiskGib: 0 });
    const contender = vm({ networkMbps: 5000, localDiskGib: 200 });
    const byKey = Object.fromEntries(specRatios(base, contender).map((x) => [x.key, x]));
    expect(byKey.net.ratio).toBeNull();
    expect(byKey.disk.ratio).toBeNull();
    // vCPU / memory still compute.
    expect(byKey.vcpu.ratio).toBe(1);
    expect(byKey.mem.ratio).toBe(1);
  });

  it('treats a missing contender value as 0 with a non-null ratio (base present)', () => {
    const base = vm({ networkMbps: 10000 });
    const contender = vm({ networkMbps: 0 });
    const net = specRatios(base, contender).find((x) => x.key === 'net')!;
    expect(net.ratio).toBe(0); // comparable (base > 0) but contender gives 0
    expect(net.contenderValue).toBe(0);
  });

  it('coerces non-finite / negative specs to 0 rather than NaN/Infinity', () => {
    const base = vm({ vcpus: NaN as unknown as number, memoryGib: -5 as unknown as number });
    const contender = vm({ vcpus: 8, memoryGib: 16 });
    const byKey = Object.fromEntries(specRatios(base, contender).map((x) => [x.key, x]));
    // base coerced to 0 → not comparable, ratio null (no Infinity leak).
    expect(byKey.vcpu.ratio).toBeNull();
    expect(byKey.mem.ratio).toBeNull();
    expect(byKey.vcpu.baseValue).toBe(0);
  });
});

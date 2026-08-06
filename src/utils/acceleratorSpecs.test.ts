import { describe, it, expect } from 'vitest';
import { familyToken, gpuSpecFor, teeSpecFor, teeCapabilityFor, isConfidentialCapable } from './acceleratorSpecs';

describe('familyToken', () => {
  it('lowercases, strips "series" + non-alphanumerics', () => {
    expect(familyToken('E-series')).toBe('e');
    expect(familyToken('ND H200 v5')).toBe('ndh200v5');
    expect(familyToken('DCas_v5')).toBe('dcasv5');
    expect(familyToken(undefined)).toBe('');
  });
});

describe('gpuSpecFor', () => {
  it('resolves curated GPU families by token', () => {
    expect(gpuSpecFor('a3')?.model).toBe('H100');
    expect(gpuSpecFor('g2')?.model).toBe('L4');
    expect(gpuSpecFor('p5')?.model).toBe('H100');
    expect(gpuSpecFor('p5e')?.model).toBe('H200');
    expect(gpuSpecFor('p4d')?.model).toBe('A100-40');
    expect(gpuSpecFor('a4')?.model).toBe('B200');
  });

  it('carries VRAM + interconnect', () => {
    expect(gpuSpecFor('a3')).toMatchObject({ vramGiB: 80, interconnect: 'nvswitch' });
    expect(gpuSpecFor('g2')).toMatchObject({ vramGiB: 24, interconnect: 'pcie' });
  });

  it('applies the vmSizeName override for within-family GPU splits', () => {
    // a3 keys H100, but a3-ultragpu is H200
    expect(gpuSpecFor('a3', 'a3-ultragpu-8g')?.model).toBe('H200');
    // a2 keys A100-40, but a2-ultragpu is A100-80
    expect(gpuSpecFor('a2', 'a2-highgpu-8g')?.model).toBe('A100-40');
    expect(gpuSpecFor('a2', 'a2-ultragpu-8g')?.model).toBe('A100-80');
  });

  it('returns null for an unknown / non-GPU family (no fabrication)', () => {
    expect(gpuSpecFor('m7i')).toBeNull();
    expect(gpuSpecFor('zzgpu')).toBeNull();
    expect(gpuSpecFor(undefined)).toBeNull();
  });
});

describe('teeSpecFor', () => {
  it('resolves the confidential families to their TEE kind', () => {
    expect(teeSpecFor('DCasv5')?.kind).toBe('sev-snp');
    expect(teeSpecFor('ECadsv5')?.kind).toBe('sev-snp');
    expect(teeSpecFor('DCesv6')?.kind).toBe('tdx');
  });

  it('returns null for non-confidential families — incl. the SEV-SNP-CAPABLE-but-opt-in ones', () => {
    // m6a / n2d support SEV-SNP as an opt-in feature on a normal-category family;
    // deliberately NOT keyed (penalizing m6a↔m7i for TEE would be wrong).
    expect(teeSpecFor('m6a')).toBeNull();
    expect(teeSpecFor('n2d')).toBeNull();
    expect(teeSpecFor('m7i')).toBeNull();
  });
});

describe('teeCapabilityFor — opt-in confidential capability (A1, separate channel)', () => {
  it('resolves the vendor-verified opt-in families with optIn flag set', () => {
    // AWS m6a/c6a/r6a = AMD SEV-SNP.
    expect(teeCapabilityFor('AWS', 'm6a')).toMatchObject({ kind: 'sev-snp', optIn: true });
    expect(teeCapabilityFor('AWS', 'c6a')).toMatchObject({ kind: 'sev-snp', optIn: true });
    expect(teeCapabilityFor('AWS', 'r6a')).toMatchObject({ kind: 'sev-snp', optIn: true });
    // GCP n2d = SEV-SNP; c2d/c3d = plain SEV (vendor truth); c3 = Intel TDX.
    expect(teeCapabilityFor('GCP', 'n2d')).toMatchObject({ kind: 'sev-snp', optIn: true });
    expect(teeCapabilityFor('GCP', 'c2d')).toMatchObject({ kind: 'sev', optIn: true });
    expect(teeCapabilityFor('GCP', 'c3d')).toMatchObject({ kind: 'sev', optIn: true });
    expect(teeCapabilityFor('GCP', 'c3')).toMatchObject({ kind: 'tdx', optIn: true });
  });

  it('returns null for families with no confidential capability', () => {
    expect(teeCapabilityFor('AWS', 'm7i')).toBeNull();
    expect(teeCapabilityFor('GCP', 'n2')).toBeNull();
    expect(teeCapabilityFor('Azure', 'Dsv5')).toBeNull();
  });

  it('does NOT leak into teeSpecFor (the deliberate "not keyed" doctrine holds)', () => {
    expect(teeSpecFor('m6a')).toBeNull();
    expect(teeSpecFor('n2d')).toBeNull();
    expect(teeSpecFor('c3')).toBeNull();
  });

  it('isConfidentialCapable covers both purpose-built and opt-in families', () => {
    expect(isConfidentialCapable({ provider: 'Azure', family: 'DCasv5' })).toBe(true); // purpose-built
    expect(isConfidentialCapable({ provider: 'AWS', family: 'm6a' })).toBe(true); // opt-in
    expect(isConfidentialCapable({ provider: 'AWS', family: 'm7i' })).toBe(false);
  });
});

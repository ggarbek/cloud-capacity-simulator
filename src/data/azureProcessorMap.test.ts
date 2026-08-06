import { describe, it, expect } from 'vitest';
import { AZURE_PROCESSOR_MAP, azureProcessorFor } from './azureProcessorMap';

describe('azureProcessorFor — SKU key parsing', () => {
  it('resolves E2_v3 to the dual Broadwell/Skylake entry', () => {
    const e = azureProcessorFor('Standard_E2_v3');
    expect(e).not.toBeNull();
    expect(e!.processor).toMatch(/Broadwell/);
    expect(e!.processor).toMatch(/Skylake/);
    expect(e!.processorOptions).toHaveLength(2);
  });

  it('resolves D4as_v5 to the AMD (a-variant) entry, not the Intel base', () => {
    const d = azureProcessorFor('Standard_D4as_v5');
    expect(d).not.toBeNull();
    expect(d!.processor).toMatch(/EPYC/);
    // Must NOT borrow the Intel Dv5 (Ice Lake/Sapphire) entry.
    expect(d!.processor).not.toMatch(/Ice Lake/);
  });

  it('resolves D8ps_v6 to the Arm Cobalt (p-variant) entry', () => {
    const d = azureProcessorFor('Standard_D8ps_v6');
    expect(d).not.toBeNull();
    expect(d!.processor).toMatch(/Cobalt/);
  });

  it('resolves M128ms (no _v suffix → v1) to the M v1 entry', () => {
    const m = azureProcessorFor('Standard_M128ms');
    expect(m).not.toBeNull();
    expect(m!.processorOptions).toHaveLength(2); // Broadwell + Skylake
  });

  it('resolves an s-variant Intel size to the base Intel entry (D16s_v5)', () => {
    const d = azureProcessorFor('Standard_D16s_v5');
    expect(d).not.toBeNull();
    expect(d!.processor).toMatch(/Ice Lake|Sapphire/);
  });

  it('resolves a confidential DC a-variant to SEV-SNP', () => {
    const dc = azureProcessorFor('Standard_DC8as_v5');
    expect(dc).not.toBeNull();
    expect(dc!.processor).toMatch(/SEV-SNP/);
  });

  it('returns null for an unknown / non-canonical SKU', () => {
    expect(azureProcessorFor('m7i.xlarge')).toBeNull();
    expect(azureProcessorFor('Standard_ZZ9_v9')).toBeNull();
    expect(azureProcessorFor('')).toBeNull();
  });
});

describe('AZURE_PROCESSOR_MAP — integrity', () => {
  it('every entry has a non-empty processor, valid confidence, and a source URL', () => {
    for (const [key, e] of Object.entries(AZURE_PROCESSOR_MAP)) {
      expect(e.processor, key).toBeTruthy();
      expect(['documented', 'inferred'], key).toContain(e.confidence);
      expect(e.source, key).toMatch(/^https:\/\/learn\.microsoft\.com\//);
      if (e.processorOptions) expect(e.processorOptions.length, key).toBeGreaterThanOrEqual(2);
    }
  });

  it('keys follow the FAMILY|vN|variant shape', () => {
    for (const key of Object.keys(AZURE_PROCESSOR_MAP)) {
      expect(key, key).toMatch(/^[A-Z]+\|v\d+\|[ape]?$/);
    }
  });
});

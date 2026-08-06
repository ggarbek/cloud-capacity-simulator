import { describe, it, expect } from 'vitest';
import type { CatalogEntry } from '../types';
import {
  bareMetalFromName,
  vmSpecInsight,
  compareSpecs,
  productInsight,
  compareProducts,
  unverifiedClaims,
  type SpecNuance,
} from './specInsights';

// ── Minimal CatalogEntry fixture factory ──────────────────────────────────
// Fills the required CatalogEntry fields with inert defaults; callers override
// only the spec dimensions under test.
function vm(partial: Partial<CatalogEntry>): CatalogEntry {
  return {
    vmSizeName: 'test',
    vmGeneration: 'v1',
    series: 'test',
    memoryCategory: 'Medium Memory (MM)',
    homeHardwareGroup: 'N/A',
    spilloverTarget: 'N/A',
    processor: '',
    vcpus: 4,
    memoryGib: 16,
    networkMbps: 5000,
    localDiskGib: 0,
    status: 'GA',
    notes: '',
    ...partial,
  };
}

// Memory-dense Azure E (8 GiB/vCPU).
const azureE = vm({
  provider: 'Azure',
  vmSizeName: 'Standard_E16s_v5',
  family: 'E-series',
  category: 'Memory Optimized',
  vcpus: 16,
  memoryGib: 128,
  networkMbps: 12_500,
});

// Compute-dense AWS c7g Arm (Graviton, 2 GiB/vCPU → just under).
const awsC7g = vm({
  provider: 'AWS',
  vmSizeName: 'c7g.4xlarge',
  family: 'c7g',
  category: 'Compute Optimized',
  processor: 'AWS Graviton3',
  vcpus: 16,
  memoryGib: 30, // ~1.9 GiB/vCPU → compute-dense
  networkMbps: 15_000,
});

// AWS bare metal.
const awsMetal = vm({
  provider: 'AWS',
  vmSizeName: 'm7i.metal-48xl',
  family: 'm7i',
  category: 'General Purpose',
  processor: 'Intel Xeon Sapphire Rapids',
  vcpus: 192,
  memoryGib: 768,
  networkMbps: 100_000,
});

// GPU VM.
const gpuVm = vm({
  provider: 'GCP',
  vmSizeName: 'a2-highgpu-1g',
  family: 'a2',
  category: 'GPU',
  vcpus: 12,
  memoryGib: 85,
  networkMbps: 24_000,
  acceleratorType: '1x NVIDIA A100',
});

// AWS M8g — Graviton4 general purpose (curated, sourced family).
const awsM8g = vm({
  provider: 'AWS',
  vmSizeName: 'm8g.4xlarge',
  family: 'm8g',
  category: 'General Purpose',
  processor: 'AWS Graviton4',
  vcpus: 16,
  memoryGib: 64,
  networkMbps: 15_000,
});

function kinds(nuances: SpecNuance[]): Set<string> {
  return new Set(nuances.map((n) => n.kind));
}

describe('B2 — processor provenance rendering (curated Azure row)', () => {
  // An Azure E2_v3 as the join now produces it: persisted curated processor +
  // dual options + processorSource 'curated'. genFor leaves v3 unranked, so the
  // generation nuance reads the PERSISTED processor (no re-inference).
  const azureE2v3 = vm({
    provider: 'Azure',
    vmSizeName: 'Standard_E2_v3',
    family: 'E-series',
    category: 'Memory Optimized',
    vcpus: 2,
    memoryGib: 16,
    processor: 'Intel Xeon E5-2673 v4 (Broadwell) or Intel Xeon Platinum 8171M (Skylake)',
    processorOptions: ['Intel Xeon E5-2673 v4 (Broadwell)', 'Intel Xeon Platinum 8171M (Skylake)'],
    processorSource: 'curated',
    networkMbps: 1000,
    networkEstimated: true,
  });

  it('renders the host-dependent "or ... (host-dependent)" note from processorOptions', () => {
    const gen = vmSpecInsight(azureE2v3).nuances.find((n) => n.kind === 'generation');
    expect(gen).toBeDefined();
    expect(gen!.detail).toMatch(/\(host-dependent\)/);
    expect(gen!.detail).toContain('Broadwell');
    expect(gen!.detail).toContain('Skylake');
  });

  it('appends the "(assumed)" marker + a source tooltip for a curated row', () => {
    const gen = vmSpecInsight(azureE2v3).nuances.find((n) => n.kind === 'generation')!;
    expect(gen.label).toContain('(assumed)');
    expect(gen.detail).toMatch(/curated from Microsoft Learn/i);
  });

  it('does NOT re-infer: an Azure v3 with an EMPTY processor yields no gen nuance', () => {
    // Old behavior fabricated "Intel Broadwell/Skylake" from the name here; the
    // join is now the only inference site, so an empty processor stays blank.
    const blank = vm({
      provider: 'Azure',
      vmSizeName: 'Standard_E2_v3',
      processor: '',
      vcpus: 2,
      memoryGib: 16,
      networkMbps: 1000,
    });
    const gen = vmSpecInsight(blank).nuances.find((n) => n.kind === 'generation');
    expect(gen).toBeUndefined();
  });

  it('labels curated-fallback network "(est.)"', () => {
    // Bump to a mid-tier bandwidth so the network nuance actually renders.
    const est = vm({ ...azureE2v3, networkMbps: 30_000 });
    const net = vmSpecInsight(est).nuances.find((n) => n.kind === 'network');
    expect(net).toBeDefined();
    expect(net!.label).toContain('(est.)');
  });

  it('does not mark a vendor processor as assumed', () => {
    const gen = vmSpecInsight(awsM8g).nuances.find((n) => n.kind === 'generation');
    if (gen) expect(gen.label).not.toContain('(assumed)');
  });
});

describe('bareMetalFromName', () => {
  it('flags an AWS .metal size', () => {
    expect(bareMetalFromName('AWS', 'm7i.metal-48xl')).toBe(true);
    expect(bareMetalFromName('AWS', 'r6i.metal')).toBe(true);
  });

  it('does not flag a normal AWS size', () => {
    expect(bareMetalFromName('AWS', 'm7i.large')).toBe(false);
  });

  it('flags a GCP -metal machine type', () => {
    expect(bareMetalFromName('GCP', 'c3-standard-192-metal')).toBe(true);
  });

  it('does not flag a normal Azure size (no public bare metal)', () => {
    expect(bareMetalFromName('Azure', 'Standard_E16s_v5')).toBe(false);
  });
});

describe('vmSpecInsight', () => {
  it('gives a memory-dense VM a memory-density nuance + DB/analytics bestFor', () => {
    const ins = vmSpecInsight(azureE);
    expect(kinds(ins.nuances).has('memory-density')).toBe(true);
    expect(ins.bestFor.toLowerCase()).toMatch(/in-memory|database|analytics/);
  });

  it('gives an Arm VM an architecture nuance', () => {
    const ins = vmSpecInsight(awsC7g);
    expect(kinds(ins.nuances).has('architecture')).toBe(true);
    const arch = ins.nuances.find((n) => n.kind === 'architecture');
    expect(arch?.label.toLowerCase()).toMatch(/arm|graviton/);
  });

  it('gives a compute-dense VM a compute-density nuance', () => {
    const ins = vmSpecInsight(awsC7g);
    expect(kinds(ins.nuances).has('compute-density')).toBe(true);
  });

  it('flags bare metal and concludes a license/hypervisor bestFor', () => {
    const ins = vmSpecInsight(awsMetal);
    expect(kinds(ins.nuances).has('bare-metal')).toBe(true);
    expect(ins.bestFor.toLowerCase()).toMatch(/license|hypervisor|physical host/);
  });

  it('flags GPU presence and concludes ML compute', () => {
    const ins = vmSpecInsight(gpuVm);
    expect(kinds(ins.nuances).has('gpu')).toBe(true);
    expect(ins.bestFor.toLowerCase()).toMatch(/ml|gpu/);
  });

  it('flags a high-network VM', () => {
    const ins = vmSpecInsight(awsMetal); // 100 Gbps
    expect(kinds(ins.nuances).has('network')).toBe(true);
  });
});

describe('compareSpecs', () => {
  it('returns one insight per input VM with a non-empty headline + keyTakeaway', () => {
    const cmp = compareSpecs([azureE, awsC7g, awsMetal, gpuVm]);
    expect(cmp.vms).toHaveLength(4);
    expect(cmp.headline.length).toBeGreaterThan(0);
    expect(cmp.keyTakeaway.length).toBeGreaterThan(0);
  });

  it('calls out the architecture difference when Arm + x86 are mixed', () => {
    const cmp = compareSpecs([azureE, awsC7g]); // azureE intel, c7g arm
    const blob = `${cmp.headline} ${cmp.keyTakeaway}`.toLowerCase();
    expect(blob).toMatch(/arm|architecture|graviton/);
  });

  it('calls out the memory-density divergence when dense + lean are mixed', () => {
    const cmp = compareSpecs([azureE, awsC7g]); // 8 vs ~1.9 GiB/vCPU
    const blob = `${cmp.headline} ${cmp.keyTakeaway}`.toLowerCase();
    expect(blob).toMatch(/memory|gib\/vcpu|compute-dense|memory-dense/);
  });

  it('handles a single VM gracefully', () => {
    const cmp = compareSpecs([azureE]);
    expect(cmp.vms).toHaveLength(1);
    expect(cmp.headline.length).toBeGreaterThan(0);
  });
});

describe('productInsight', () => {
  it('returns 3–5 key points for a family', () => {
    const ins = productInsight([azureE, awsC7g, awsMetal], 'family', 'E-series');
    expect(ins.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(ins.keyPoints.length).toBeLessThanOrEqual(5);
    expect(ins.whatItIs.length).toBeGreaterThan(0);
    expect(ins.bestFor.length).toBeGreaterThan(0);
  });

  it('summarizes a memory-optimized category with a DB/analytics bestFor', () => {
    const ins = productInsight([azureE], 'category', 'Memory Optimized');
    expect(ins.kind).toBe('category');
    expect(ins.bestFor.toLowerCase()).toMatch(/in-memory|database|analytics/);
  });

  it('degrades gracefully for an unknown family', () => {
    const odd = vm({ provider: 'AWS', vmSizeName: 'zz9.large', family: 'zz9', vcpus: 8, memoryGib: 32 });
    const ins = productInsight([odd], 'family', 'zz9');
    expect(ins.whatItIs.toLowerCase()).toContain('zz9');
    expect(ins.keyPoints.length).toBeGreaterThanOrEqual(2);
  });
});

describe('compareProducts', () => {
  it('returns a product per group with headline + keyTakeaway', () => {
    const out = compareProducts([
      { kind: 'family', name: 'E-series', vms: [azureE] },
      { kind: 'family', name: 'c7g', vms: [awsC7g] },
    ]);
    expect(out.products).toHaveLength(2);
    expect(out.headline.length).toBeGreaterThan(0);
    expect(out.keyTakeaway.length).toBeGreaterThan(0);
  });
});

// ── Deep-research enrichment (vendor-sourced per-family facts + decision rules) ──
describe('research enrichment', () => {
  it('Arm architecture nuance carries the price/performance + x86-fallback decision rule', () => {
    const ins = vmSpecInsight(awsC7g);
    const arch = ins.nuances.find((n) => n.kind === 'architecture');
    expect(arch?.detail.toLowerCase()).toMatch(/price\/performance|price.performance/);
    expect(arch?.detail.toLowerCase()).toMatch(/x86|legacy|avx-512|single-thread/);
  });

  it('a curated family (m8g) surfaces sourced whatItIs + pickWhen + analogs + source', () => {
    const ins = productInsight([awsM8g], 'family', 'm8g');
    expect(ins.whatItIs.toLowerCase()).toMatch(/graviton4|graviton 4/);
    expect(ins.pickWhen).toBeTruthy();
    expect(ins.pickWhen!.toLowerCase()).toMatch(/price\/performance|legacy|graviton|30%/);
    expect(ins.analogs).toBeTruthy();
    expect(ins.source).toMatch(/aws\.amazon\.com/);
  });

  it('compareProducts weaves the "worth paying more" pick rule when a group has one', () => {
    const out = compareProducts([
      { kind: 'family', name: 'm8g', vms: [awsM8g] },
      { kind: 'family', name: 'E-series', vms: [azureE] },
    ]);
    expect(out.keyTakeaway.toLowerCase()).toMatch(/worth paying more/);
  });

  it('an unknown family still degrades gracefully (no pickWhen/source)', () => {
    const odd = vm({ provider: 'AWS', vmSizeName: 'zz9.large', family: 'zz9', vcpus: 8, memoryGib: 32 });
    const ins = productInsight([odd], 'family', 'zz9');
    expect(ins.pickWhen).toBeUndefined();
    expect(ins.source).toBeUndefined();
  });

  it('S55 storage-optimized families (i7i / Lsv3) carry sourced whatItIs + pickWhen + analogs', () => {
    const i7i = vm({ provider: 'AWS', vmSizeName: 'i7i.4xlarge', family: 'i7i', category: 'Storage Optimized', vcpus: 16, memoryGib: 128 });
    const insI7i = productInsight([i7i], 'family', 'i7i');
    expect(insI7i.whatItIs.toLowerCase()).toMatch(/local nvme|storage-optimized|emerald rapids/);
    expect(insI7i.pickWhen?.toLowerCase()).toMatch(/ephemeral|price\/performance|i4i/);
    expect(insI7i.analogs).toMatch(/Lsv3|Z3/);
    expect(insI7i.source).toMatch(/aws\.amazon\.com/);

    const lsv3 = vm({ provider: 'Azure', vmSizeName: 'Standard_L16s_v3', family: 'Lsv3', category: 'Storage Optimized', vcpus: 16, memoryGib: 128 });
    const insLsv3 = productInsight([lsv3], 'family', 'Lsv3');
    expect(insLsv3.whatItIs.toLowerCase()).toMatch(/local nvme|nosql/);
    expect(insLsv3.source).toMatch(/learn\.microsoft\.com/);
  });

  it('S55 HPC families (hpc7a / HBv4) lead with the interconnect decision rule', () => {
    const hpc7a = vm({ provider: 'AWS', vmSizeName: 'hpc7a.96xlarge', family: 'hpc7a', category: 'High Performance Computing', vcpus: 192, memoryGib: 768 });
    const insHpc = productInsight([hpc7a], 'family', 'hpc7a');
    expect(insHpc.whatItIs.toLowerCase()).toMatch(/efa|interconnect|hpc/);
    expect(insHpc.pickWhen?.toLowerCase()).toMatch(/efa|inter-node|interconnect|region/);
    expect(insHpc.analogs).toMatch(/HBv4|H3/);

    const hbv4 = vm({ provider: 'Azure', vmSizeName: 'Standard_HB176rs_v4', family: 'HBv4', category: 'High Performance Computing', vcpus: 176, memoryGib: 768 });
    const insHb = productInsight([hbv4], 'family', 'HBv4');
    expect(insHb.whatItIs.toLowerCase()).toMatch(/infiniband|memory.bandwidth|genoa-x/);
    expect(insHb.source).toMatch(/learn\.microsoft\.com/);
  });

  it('S55 burstable families (T3 / Bpsv2) carry the credit-model + sustained-load backfire rule', () => {
    const t3 = vm({ provider: 'AWS', vmSizeName: 't3.large', family: 't3', category: 'General Purpose', vcpus: 2, memoryGib: 8 });
    const insT3 = productInsight([t3], 'family', 't3');
    expect(insT3.whatItIs.toLowerCase()).toMatch(/burstable|credit|baseline/);
    expect(insT3.pickWhen?.toLowerCase()).toMatch(/sustained|backfire|breakeven|42\.5|1\.5/);
    expect(insT3.analogs).toMatch(/B-series|E2/);

    const bpsv2 = vm({ provider: 'Azure', vmSizeName: 'Standard_B4ps_v2', family: 'Bpsv2', category: 'General Purpose', vcpus: 4, memoryGib: 16 });
    const insBp = productInsight([bpsv2], 'family', 'Bpsv2');
    expect(insBp.whatItIs.toLowerCase()).toMatch(/arm|ampere|burstable/);
    expect(insBp.analogs).toMatch(/T4g/);
  });

  it('S55 confidential-compute families (ECasv5 / DCesv6) carry the TEE + overhead + when-needed rule', () => {
    const ecasv5 = vm({ provider: 'Azure', vmSizeName: 'Standard_EC8as_v5', family: 'ECasv5', category: 'Memory Optimized', vcpus: 8, memoryGib: 64 });
    const insEc = productInsight([ecasv5], 'family', 'ECasv5');
    expect(insEc.whatItIs.toLowerCase()).toMatch(/sev-snp|confidential|attestation/);
    expect(insEc.pickWhen?.toLowerCase()).toMatch(/regulated|pii|phi|sensitive|overhead/);
    expect(insEc.source).toMatch(/confidential-computing/);

    const dcesv6 = vm({ provider: 'Azure', vmSizeName: 'Standard_DC8es_v6', family: 'DCesv6', category: 'General Purpose', vcpus: 8, memoryGib: 32 });
    const insDc = productInsight([dcesv6], 'family', 'DCesv6');
    expect(insDc.whatItIs.toLowerCase()).toMatch(/tdx|intel/);
    // The S57 research verified EC2 has NO Intel TDX — the analog must say so, not list "AWS Intel TDX".
    expect(insDc.analogs).toMatch(/none|no Intel TDX/i);
    expect(insDc.analogs).not.toMatch(/AWS Intel TDX/);
  });

  it('S57 GCP storage/HPC gap families (Z3 / H3) carry sourced whatItIs + pickWhen + analogs', () => {
    const z3 = vm({ provider: 'GCP', vmSizeName: 'z3-highmem-176', family: 'z3', category: 'Storage Optimized', vcpus: 176, memoryGib: 1408 });
    const insZ3 = productInsight([z3], 'family', 'z3');
    expect(insZ3.whatItIs.toLowerCase()).toMatch(/titanium|local (ssd|nvme)|storage-optimized/);
    expect(insZ3.pickWhen?.toLowerCase()).toMatch(/ephemeral|local nvme|network-attached/);
    expect(insZ3.analogs).toMatch(/I7i|I7ie|Lsv3/);
    expect(insZ3.source).toMatch(/cloud\.google\.com/);

    const h3 = vm({ provider: 'GCP', vmSizeName: 'h3-standard-88', family: 'h3', category: 'High Performance Computing', vcpus: 88, memoryGib: 352 });
    const insH3 = productInsight([h3], 'family', 'h3');
    expect(insH3.whatItIs.toLowerCase()).toMatch(/smt disabled|200 gbps|mpi|hpc/);
    expect(insH3.pickWhen?.toLowerCase()).toMatch(/mpi|fabric|scratch|full|dedicated/);
    expect(insH3.analogs).toMatch(/Hpc7a|HBv4/);
  });

  it('S57 GCP GPU gap families (A3 / A2 / G2) lead with the accelerator + interconnect facts', () => {
    const a3 = vm({ provider: 'GCP', vmSizeName: 'a3-highgpu-8g', family: 'a3', category: 'GPU', vcpus: 208, memoryGib: 1872 });
    const insA3 = productInsight([a3], 'family', 'a3');
    expect(insA3.whatItIs.toLowerCase()).toMatch(/h100|h200|nvlink|nvswitch/);
    expect(insA3.analogs).toMatch(/P5|ND-H100|ND-H200/);

    const a2 = vm({ provider: 'GCP', vmSizeName: 'a2-ultragpu-8g', family: 'a2', category: 'GPU', vcpus: 96, memoryGib: 1360 });
    const insA2 = productInsight([a2], 'family', 'a2');
    expect(insA2.whatItIs.toLowerCase()).toMatch(/a100|ampere/);
    expect(insA2.analogs).toMatch(/P4d|ND A100/);

    const g2 = vm({ provider: 'GCP', vmSizeName: 'g2-standard-96', family: 'g2', category: 'GPU', vcpus: 96, memoryGib: 384 });
    const insG2 = productInsight([g2], 'family', 'g2');
    expect(insG2.whatItIs.toLowerCase()).toMatch(/l4|inference|graphics/);
    expect(insG2.analogs).toMatch(/G6|NV/);
  });

  it('S57 AWS confidential (SEV-SNP) families (m6a / c6a / r6a) carry the TEE + Nitro-Enclaves + no-TDX framing', () => {
    const m6a = vm({ provider: 'AWS', vmSizeName: 'm6a.4xlarge', family: 'm6a', category: 'General Purpose', vcpus: 16, memoryGib: 64 });
    const insM6a = productInsight([m6a], 'family', 'm6a');
    expect(insM6a.whatItIs.toLowerCase()).toMatch(/sev-snp|confidential|attestation/);
    expect(insM6a.pickWhen?.toLowerCase()).toMatch(/nitro enclave|no intel tdx|regulated|sensitive/);
    expect(insM6a.analogs).toMatch(/DCasv5|Confidential N2D/);
    expect(insM6a.source).toMatch(/aws\.amazon\.com/);

    const r6a = vm({ provider: 'AWS', vmSizeName: 'r6a.4xlarge', family: 'r6a', category: 'Memory Optimized', vcpus: 16, memoryGib: 128 });
    const insR6a = productInsight([r6a], 'family', 'r6a');
    expect(insR6a.whatItIs.toLowerCase()).toMatch(/sev-snp|confidential/);
    expect(insR6a.analogs).toMatch(/ECasv5/);
  });

  it('S58 minor-gap families (GCP c2/c2d/e2/h4d, Azure HBv3) carry sourced curated facts', () => {
    const c2 = vm({ provider: 'GCP', vmSizeName: 'c2-standard-60', family: 'c2', category: 'Compute Optimized', vcpus: 60, memoryGib: 240 });
    expect(productInsight([c2], 'family', 'c2').whatItIs.toLowerCase()).toMatch(/cascade lake|compute-optimized/);
    const c2d = vm({ provider: 'GCP', vmSizeName: 'c2d-standard-56', family: 'c2d', category: 'Compute Optimized', vcpus: 56, memoryGib: 224 });
    expect(productInsight([c2d], 'family', 'c2d').whatItIs.toLowerCase()).toMatch(/milan|epyc/);
    const e2 = vm({ provider: 'GCP', vmSizeName: 'e2-medium', family: 'e2', category: 'General Purpose', vcpus: 2, memoryGib: 4 });
    const insE2 = productInsight([e2], 'family', 'e2');
    expect(insE2.whatItIs.toLowerCase()).toMatch(/shared-core|dynamic resource|cost-optimized/);
    expect(insE2.source).toMatch(/cloud\.google\.com/);
    const h4d = vm({ provider: 'GCP', vmSizeName: 'h4d-standard-192', family: 'h4d', category: 'High Performance Computing', vcpus: 192, memoryGib: 1488 });
    const insH4d = productInsight([h4d], 'family', 'h4d');
    expect(insH4d.whatItIs.toLowerCase()).toMatch(/turin|rdma|hpc/);
    expect(insH4d.analogs).toMatch(/Hpc7a|HBv4/);
    const hbv3 = vm({ provider: 'Azure', vmSizeName: 'Standard_HB120rs_v3', family: 'HBv3', category: 'High Performance Computing', vcpus: 120, memoryGib: 448 });
    expect(productInsight([hbv3], 'family', 'HBv3').whatItIs.toLowerCase()).toMatch(/milan-x|v-cache|infiniband/);
  });
});

// ── Unverified vendor claims (transparency disclosure) ──────────────────────
describe('unverifiedClaims', () => {
  it('returns nothing for an empty comparison', () => {
    expect(unverifiedClaims([])).toEqual([]);
  });

  it('surfaces the Arm generalized caveat when an Arm pick is present, not otherwise', () => {
    const withArm = unverifiedClaims([awsC7g, azureE]); // c7g = Graviton
    expect(withArm.some((c) => c.generalized === 'arm')).toBe(true);

    const noArm = unverifiedClaims([azureE]); // Intel only
    expect(noArm.some((c) => c.generalized === 'arm')).toBe(false);
  });

  it('matches a family-specific claim by family token (i7i) and attributes it to the vendor', () => {
    const i7i = vm({ provider: 'AWS', vmSizeName: 'i7i.4xlarge', family: 'i7i', category: 'Storage Optimized', vcpus: 16, memoryGib: 128 });
    const claims = unverifiedClaims([i7i]);
    const i7iClaim = claims.find((c) => c.id === 'i7i-perf');
    expect(i7iClaim).toBeTruthy();
    expect(i7iClaim!.provider).toBe('aws');
    expect(i7iClaim!.claim.toLowerCase()).toMatch(/i4i|storage performance/);
    expect(i7iClaim!.source).toMatch(/aws\.amazon\.com/);
  });

  it('does not surface an unrelated family-specific claim (i7i) for a non-matching pick', () => {
    const claims = unverifiedClaims([azureE]);
    expect(claims.some((c) => c.id === 'i7i-perf')).toBe(false);
  });

  it('matches family-specific claims for products mode via the family-name list', () => {
    const claims = unverifiedClaims([], ['Graviton4', 'm8g']);
    expect(claims.some((c) => c.id === 'graviton4-gen')).toBe(true);
  });

  it('every claim carries a why and is capped to keep the disclosure tight', () => {
    const everything = unverifiedClaims(
      [
        vm({ provider: 'AWS', vmSizeName: 'i7i.x', family: 'i7i', category: 'Storage Optimized', processor: 'Intel' }),
        vm({ provider: 'AWS', vmSizeName: 'i7ie.x', family: 'i7ie', category: 'Storage Optimized', processor: 'Intel' }),
        vm({ provider: 'AWS', vmSizeName: 'im4gn.x', family: 'im4gn', category: 'Storage Optimized', processor: 'AWS Graviton2' }),
        vm({ provider: 'AWS', vmSizeName: 'm8g.x', family: 'm8g', category: 'General Purpose', processor: 'AWS Graviton4' }),
        vm({ provider: 'AWS', vmSizeName: 'hpc7g.x', family: 'hpc7g', category: 'High Performance Computing', processor: 'AWS Graviton3E' }),
        vm({ provider: 'AWS', vmSizeName: 't3.x', family: 't3', category: 'General Purpose', processor: 'Intel' }),
      ],
      [],
    );
    expect(everything.length).toBeLessThanOrEqual(6);
    expect(everything.every((c) => c.why.length > 0)).toBe(true);
  });

  it('newest-gen claim is contextual — names the family, attributes the vendor, links to that cloud', () => {
    const gcpN2 = vm({
      provider: 'GCP',
      vmSizeName: 'n2-highmem-2',
      family: 'n2-highmem',
      category: 'Memory Optimized',
      processor: 'Intel Cascade Lake', // rank 4 → newest-gen
      vcpus: 2,
      memoryGib: 16,
    });
    const claims = unverifiedClaims([gcpN2]);
    const gen = claims.find((c) => c.id === 'newest-gen-gcp');
    expect(gen).toBeTruthy();
    expect(gen!.provider).toBe('gcp');
    expect(gen!.claim).toMatch(/n2-highmem/); // names the subject family
    expect(gen!.claim).toMatch(/Cascade Lake/); // names the generation
    expect(gen!.source).toMatch(/cloud\.google\.com/); // links to GCP, not AWS
  });

  it('does not fire the newest-gen claim for an older-generation pick', () => {
    const skylake = vm({ provider: 'AWS', vmSizeName: 'r5.large', family: 'r5', processor: 'Intel Skylake', category: 'Memory Optimized' });
    const claims = unverifiedClaims([skylake]);
    expect(claims.some((c) => c.generalized === 'newest-gen')).toBe(false);
  });

  it('renders the PERSISTED curated processor for an unpinned Azure size (B2: no re-inference)', () => {
    // B2 moved the inference into the join; specInsights now reads the row's
    // persisted processor + processorSource rather than re-inferring from the name.
    const eV3 = vm({
      provider: 'Azure',
      vmSizeName: 'Standard_E2_v3',
      family: 'Ev3',
      category: 'Memory Optimized',
      vcpus: 2,
      memoryGib: 16,
      processor: 'Intel Xeon E5-2673 v4 (Broadwell) or Intel Xeon Platinum 8171M (Skylake)',
      processorOptions: ['Intel Xeon E5-2673 v4 (Broadwell)', 'Intel Xeon Platinum 8171M (Skylake)'],
      processorSource: 'curated',
    });
    const ins = vmSpecInsight(eV3);
    const gen = ins.nuances.find((n) => n.kind === 'generation');
    expect(gen).toBeTruthy();
    expect(gen!.label).toMatch(/Broadwell|Skylake/);
    expect(gen!.label).toContain('(assumed)');
  });

  it('sets a per-VM standout on the clear cross-cloud leader (most network)', () => {
    const slow = vm({ provider: 'Azure', vmSizeName: 'Standard_D4s_v5', family: 'D', category: 'General Purpose', vcpus: 4, memoryGib: 16, networkMbps: 12_500 });
    const fast = vm({ provider: 'AWS', vmSizeName: 'm7i.4xlarge', family: 'm7i', category: 'General Purpose', vcpus: 16, memoryGib: 64, networkMbps: 100_000 });
    const res = compareSpecs([slow, fast]);
    const fastIns = res.vms.find((v) => v.vmSizeName === 'm7i.4xlarge');
    expect(fastIns!.standout).toMatch(/network/i);
  });

  it('flags the only local-NVMe VM as the standout', () => {
    const noDisk = vm({ provider: 'Azure', vmSizeName: 'Standard_E2_v3', family: 'Ev3', category: 'Memory Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 0 });
    const withDisk = vm({ provider: 'AWS', vmSizeName: 'r5d.large', family: 'r5d', category: 'Memory Optimized', processor: 'Intel Skylake', vcpus: 2, memoryGib: 16, localDiskGib: 75 });
    const res = compareSpecs([noDisk, withDisk]);
    const diskIns = res.vms.find((v) => v.vmSizeName === 'r5d.large');
    expect(diskIns!.standout).toMatch(/NVMe/i);
  });

  it('flags the within-vendor newest CPU generation as a standout (Intel Cascade Lake vs Skylake)', () => {
    const older = vm({ provider: 'AWS', vmSizeName: 'r5.large', family: 'r5', category: 'Memory Optimized', processor: 'Intel Skylake', vcpus: 2, memoryGib: 16 });
    const newer = vm({ provider: 'GCP', vmSizeName: 'n2-highmem-2', family: 'n2-highmem', category: 'Memory Optimized', processor: 'Intel Cascade Lake', vcpus: 2, memoryGib: 16 });
    const res = compareSpecs([older, newer]);
    const newerIns = res.vms.find((v) => v.vmSizeName === 'n2-highmem-2');
    expect(newerIns!.standout).toMatch(/newest CPU generation/i);
  });

  it('sets a per-VM weakness on the clear cross-cloud laggard (lowest network)', () => {
    const slow = vm({ provider: 'Azure', vmSizeName: 'Standard_M16bds_v3', family: 'Mbdsv3', category: 'Memory Optimized', vcpus: 16, memoryGib: 128, networkMbps: 8_000 });
    const fast = vm({ provider: 'GCP', vmSizeName: 'z3-highmem-16', family: 'z3-highmem', category: 'Memory Optimized', vcpus: 16, memoryGib: 128, networkMbps: 32_000 });
    const res = compareSpecs([slow, fast]);
    const slowIns = res.vms.find((v) => v.vmSizeName === 'Standard_M16bds_v3');
    expect(slowIns!.weakness).toMatch(/lowest network bandwidth/i);
    // the leader carries no network weakness
    const fastIns = res.vms.find((v) => v.vmSizeName === 'z3-highmem-16');
    expect(fastIns!.weakness ?? '').not.toMatch(/lowest network/i);
  });

  it('flags a VM that lacks local NVMe (while a peer has it) as the weakness', () => {
    const noDisk = vm({ provider: 'Azure', vmSizeName: 'Standard_E2_v3', family: 'Ev3', category: 'Memory Optimized', vcpus: 2, memoryGib: 16, localDiskGib: 0 });
    const withDisk = vm({ provider: 'AWS', vmSizeName: 'r5d.large', family: 'r5d', category: 'Memory Optimized', processor: 'Intel Skylake', vcpus: 2, memoryGib: 16, localDiskGib: 75 });
    const res = compareSpecs([noDisk, withDisk]);
    const noDiskIns = res.vms.find((v) => v.vmSizeName === 'Standard_E2_v3');
    expect(noDiskIns!.weakness).toMatch(/local NVMe/i);
  });

  it('sets no weakness when the sizes are materially balanced', () => {
    const a = vm({ provider: 'AWS', vmSizeName: 'm7i.xlarge', family: 'm7i', category: 'General Purpose', vcpus: 4, memoryGib: 16, networkMbps: 12_500 });
    const b = vm({ provider: 'GCP', vmSizeName: 'n4-standard-4', family: 'n4', category: 'General Purpose', vcpus: 4, memoryGib: 16, networkMbps: 12_500 });
    const res = compareSpecs([a, b]);
    expect(res.vms.every((v) => !v.weakness)).toBe(true);
  });
});

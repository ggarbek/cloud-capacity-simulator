/**
 * v2.12 (Phase F) — Public cross-cloud VM equivalency seed.
 *
 * ── What this is ───────────────────────────────────────────────────────
 * Widely-accepted Azure ↔ AWS ↔ GCP analog mappings for memory-optimized
 * VM families. These are NOT vendor doctrine — Microsoft doesn't publish
 * "Standard_M64s ≡ m7i.16xlarge" — they're cross-cloud reference points
 * that capacity planners commonly use when sizing equivalent workloads.
 *
 * Sourced from public vendor product pages and industry comparison
 * articles (Azure M-series, AWS x2idn / m7i, GCP m3 / n2-highmem product
 * pages). Spec proximity is the primary anchor: matched on vCPU + memory
 * + memory-optimization tier.
 *
 * ── Doctrine note ──────────────────────────────────────────────────────
 * Per the v2.11 Decoupling Doctrine amendment, public-knowledge analog
 * mappings can ship in seed. User uploads via the Equivalency template
 * override / extend this list. Delete a row in the Competitive page →
 * the row stays gone (state is the source of truth; the seed is a
 * first-init convenience).
 */
import type { EquivalencyEntry } from '../types';

export const AZURE_AWS_GCP_EQUIVALENCY_SEED: EquivalencyEntry[] = [
  // ── M v1 (Haswell + Cascade Lake) — memory tier comparisons ──────────
  {
    azureSku: 'Standard_M8ms',
    awsSku: 'r6i.4xlarge',
    gcpSku: 'n2-highmem-16',
    notes: '~220 GiB memory tier · 8 vCPU class · memory-optimized',
  },
  {
    azureSku: 'Standard_M16ms',
    awsSku: 'r6i.8xlarge',
    gcpSku: 'n2-highmem-32',
    notes: '~440 GiB memory tier · 16 vCPU class',
  },
  {
    azureSku: 'Standard_M32ms',
    awsSku: 'r6i.16xlarge',
    gcpSku: 'n2-highmem-48',
    notes: '~875 GiB memory tier · 32 vCPU class',
  },
  {
    azureSku: 'Standard_M64s',
    awsSku: 'm7i.16xlarge',
    gcpSku: 'n2-highmem-64',
    notes: '~1 TiB memory tier · 64 vCPU class · general memory-opt',
  },
  {
    azureSku: 'Standard_M64ms',
    awsSku: 'x2idn.16xlarge',
    gcpSku: 'm3-megamem-64',
    notes: '~1.8 TiB memory tier · 64 vCPU class · high-memory-opt',
  },
  {
    azureSku: 'Standard_M128s',
    awsSku: 'x2idn.16xlarge',
    gcpSku: 'm3-ultramem-32',
    notes: '~2 TiB memory tier · 128 vCPU class',
  },
  {
    azureSku: 'Standard_M128ms',
    awsSku: 'x2idn.32xlarge',
    gcpSku: 'm3-ultramem-64',
    notes: '~3.8 TiB memory tier · 128 vCPU class · top-of-Mv1',
  },

  // ── Mv2 (Skylake 8180M, 208/416 vCPU, 2.85–11.4 TiB) — closest AWS
  //     analogs are u-series / x2idn high-end. GCP m3 ultramem variants. ──
  {
    azureSku: 'Standard_M208s_v2',
    awsSku: 'x2iedn.32xlarge',
    gcpSku: 'm3-ultramem-128',
    notes: '~2.85 TiB · 208 vCPU class · in-memory DB tier',
  },
  {
    azureSku: 'Standard_M208ms_v2',
    awsSku: 'u-6tb1.56xlarge',
    gcpSku: 'm3-ultramem-128',
    notes: '~5.7 TiB · 208 vCPU class · SAP HANA tier',
  },
  {
    azureSku: 'Standard_M416s_v2',
    awsSku: 'u-6tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~5.7 TiB · 416 vCPU class',
  },
  {
    azureSku: 'Standard_M416ms_v2',
    awsSku: 'u-12tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~11.4 TiB · 416 vCPU class · max-Mv2 memory',
  },

  // ── Msv3 MM (Sapphire Rapids, 12–176 vCPU, 240 GiB – 3.9 TiB) ────────
  {
    azureSku: 'Standard_M12s_v3',
    awsSku: 'r7i.4xlarge',
    gcpSku: 'n2-highmem-16',
    notes: '~240 GiB · 12 vCPU · next-gen memory-optimized',
  },
  {
    azureSku: 'Standard_M24s_v3',
    awsSku: 'r7i.8xlarge',
    gcpSku: 'n2-highmem-32',
    notes: '~480 GiB · 24 vCPU',
  },
  {
    azureSku: 'Standard_M48s_1_v3',
    awsSku: 'r7i.12xlarge',
    gcpSku: 'n2-highmem-48',
    notes: '~974 GiB · 48 vCPU',
  },
  {
    azureSku: 'Standard_M96s_1_v3',
    awsSku: 'm7i.24xlarge',
    gcpSku: 'n2-highmem-96',
    notes: '~974 GiB · 96 vCPU · general high-mem',
  },
  {
    azureSku: 'Standard_M96s_2_v3',
    awsSku: 'x2iedn.24xlarge',
    gcpSku: 'm3-megamem-64',
    notes: '~1.9 TiB · 96 vCPU class',
  },
  {
    azureSku: 'Standard_M176s_3_v3',
    awsSku: 'x2iedn.32xlarge',
    gcpSku: 'm3-ultramem-128',
    notes: '~2.8 TiB · 176 vCPU class',
  },
  {
    azureSku: 'Standard_M176s_4_v3',
    awsSku: 'u-6tb1.56xlarge',
    gcpSku: 'm3-ultramem-128',
    notes: '~3.9 TiB · 176 vCPU class',
  },

  // ── Msv3 HM (Sapphire Rapids, 416–832 vCPU, 5.7–15.2 TiB) ────────────
  {
    azureSku: 'Standard_M416s_6_v3',
    awsSku: 'u-6tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~5.7 TiB · 416 vCPU · HANA TDI tier',
  },
  {
    azureSku: 'Standard_M416s_8_v3',
    awsSku: 'u-9tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~7.6 TiB · 416 vCPU',
  },
  {
    azureSku: 'Standard_M624s_12_v3',
    awsSku: 'u-12tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~11.4 TiB · 624 vCPU',
  },
  {
    azureSku: 'Standard_M832s_12_v3',
    awsSku: 'u-12tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~11.4 TiB · 832 vCPU · top-tier compute',
  },
  {
    azureSku: 'Standard_M832is_16_v3',
    awsSku: 'u-18tb1.112xlarge',
    gcpSku: 'm3-ultramem-208',
    notes: '~15.2 TiB · 832 vCPU · max-Msv3-HM memory',
  },
];

/** Returns true when the user has authored zero equivalency rows, signalling
 *  that the seed should auto-populate on first init. */
export function shouldSeedEquivalency(current: EquivalencyEntry[]): boolean {
  return current.length === 0;
}

export function seedEquivalency(current: EquivalencyEntry[]): EquivalencyEntry[] {
  if (!shouldSeedEquivalency(current)) return current;
  return AZURE_AWS_GCP_EQUIVALENCY_SEED.slice();
}

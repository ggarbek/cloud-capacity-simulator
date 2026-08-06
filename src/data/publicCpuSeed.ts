/**
 * v2.11 (Phase E0.4) — Public CPU library seed.
 *
 * Every CPU referenced by the seeded M-Series + AWS/GCP analog VMs,
 * plus a small set of cross-cloud peers the user is likely to compose
 * custom hardware with. Specs sourced from vendor public docs:
 *   • Intel ARK (ark.intel.com)
 *   • AMD product pages
 *   • Ampere Computing product briefs
 *   • AWS Graviton announcement / whitepapers
 *
 * Doctrine: public vendor data, allowed in seed per v2.11 amendment.
 * Users can edit or add via the Hardware Library Excel template; user
 * uploads override these.
 *
 * Scope: kept tight to the CPUs the seeded VMs actually reference. The
 * three CPUs marked "(cross-cloud peer)" don't back a seeded VM today
 * but are common in Custom hardware compositions. Add more as new
 * seeded VMs land.
 */
import type { UserCpu } from '../types';

export const PUBLIC_CPU_SEED: UserCpu[] = [
  // ── Intel Xeon — Azure M-Series CPUs ────────────────────────────────
  {
    name: 'Intel Xeon E7-8890 v3 (Haswell)',
    vendor: 'Intel',
    family: 'Haswell',
    coresPerSocket: 18,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon Platinum 8180M (Skylake)',
    vendor: 'Intel',
    family: 'Skylake',
    coresPerSocket: 28,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon Platinum 8280M (Cascade Lake)',
    vendor: 'Intel',
    family: 'Cascade Lake',
    coresPerSocket: 28,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon 4th Gen Scalable (Sapphire Rapids)',
    vendor: 'Intel',
    family: 'Sapphire Rapids',
    coresPerSocket: 60,
    hyperthreading: true,
  },

  // ── Intel Xeon — AWS-published variants ────────────────────────────
  {
    name: 'Intel Xeon Platinum 8488C (Sapphire Rapids)',
    vendor: 'Intel',
    family: 'Sapphire Rapids',
    coresPerSocket: 48,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon Platinum 8259CL (Cascade Lake)',
    vendor: 'Intel',
    family: 'Cascade Lake',
    coresPerSocket: 24,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon Platinum 8375C (Ice Lake)',
    vendor: 'Intel',
    family: 'Ice Lake',
    coresPerSocket: 32,
    hyperthreading: true,
  },

  // ── Intel Xeon — GCP-published variants ────────────────────────────
  {
    name: 'Intel Xeon Platinum 8268 (Cascade Lake)',
    vendor: 'Intel',
    family: 'Cascade Lake',
    coresPerSocket: 24,
    hyperthreading: true,
  },
  {
    name: 'Intel Xeon Platinum 8373C (Ice Lake)',
    vendor: 'Intel',
    family: 'Ice Lake',
    coresPerSocket: 32,
    hyperthreading: true,
  },

  // ── AMD EPYC — cross-cloud peer (Azure Dasv5, AWS r7a, GCP c3d) ────
  {
    name: 'AMD EPYC 9654 (Genoa)',
    vendor: 'AMD',
    family: 'Genoa',
    coresPerSocket: 96,
    hyperthreading: false, // AMD SMT exists but we model HT only for Intel
  },
  {
    name: 'AMD EPYC 9754 (Bergamo)',
    vendor: 'AMD',
    family: 'Bergamo',
    coresPerSocket: 128,
    hyperthreading: false,
  },
  {
    name: 'AMD EPYC 7763 (Milan)',
    vendor: 'AMD',
    family: 'Milan',
    coresPerSocket: 64,
    hyperthreading: false,
  },

  // ── ARM — cross-cloud peer (AWS Graviton, Azure Cobalt, GCP Axion) ─
  {
    name: 'AWS Graviton3 (Neoverse V1)',
    vendor: 'AWS',
    family: 'Graviton3',
    coresPerSocket: 64,
    hyperthreading: false,
  },
  {
    name: 'AWS Graviton4 (Neoverse V2)',
    vendor: 'AWS',
    family: 'Graviton4',
    coresPerSocket: 96,
    hyperthreading: false,
  },
  {
    name: 'Ampere Altra Max (Neoverse N1)',
    vendor: 'Ampere',
    family: 'Altra Max',
    coresPerSocket: 128,
    hyperthreading: false,
  },
];

/** Merge helper — seeds the public CPU library on first init when the
 *  user has none. User uploads / edits override on top. */
export function seedPublicCpus(currentUserCpus: UserCpu[]): UserCpu[] {
  if (currentUserCpus.length > 0) return currentUserCpus;
  return PUBLIC_CPU_SEED.slice();
}

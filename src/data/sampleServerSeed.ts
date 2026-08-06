/**
 * Sample server seed (v2.17.33).
 *
 * The Hardware Library ships with ONE sample server pre-loaded so a brand-
 * new user lands on a non-empty Server Library and can see the card shape
 * before authoring their own. Mirrors the sample row in the Excel template
 * (scripts/build_hardware_template.py) — same Group ID, same specs.
 *
 * Seed rules (same as publicCpuSeed):
 *   - Auto-merges only when `state.userHardware` is empty
 *   - User uploads / deletes always win — once they have content, this seed
 *     never re-runs
 */
import type { HardwareGroup } from '../types';

const SAMPLE: HardwareGroup = {
  id: 'sample-reference-server',
  name: 'Sample Reference Server',
  provider: 'Custom',
  memoryCategory: 'mm',
  memoryGibPerNode: 512,
  socketsPerNode: 2,
  coresPerSocket: 18,
  vcpusPerNode: 72,
  nodesPerRack: 12,
  processor: 'Intel Xeon E7-8890 v3 (Haswell)',
  rackComposition: [
    {
      memoryGibPerNode: 512,
      count: 12,
      processor: 'Intel Xeon E7-8890 v3 (Haswell)',
      socketsPerNode: 2,
      coresPerSocket: 18,
      vcpusPerNode: 72,
      networkMbpsPerNode: 50000,
      storageThroughputMbpsPerNode: 16000,
    },
  ],
  homeFor: [],
  spilloverFrom: [],
  isolated: false,
  notes: 'Sample server pre-loaded for first-run orientation. Delete or edit freely.',
  costPerRackUsd: 120000,
  usableLifeMonths: 60,
  networkMbpsPerNode: 50000,
  storageThroughputMbpsPerNode: 16000,
};

export function seedSampleServers(current: HardwareGroup[]): HardwareGroup[] {
  if (current.length > 0) return current;
  return [SAMPLE];
}

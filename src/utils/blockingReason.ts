/**
 * Centralized copy + accent palette for every `BlockingReason`. Keep this
 * the single source of truth — the engine emits the enum value + a free-text
 * `details` string; the UI looks both up here.
 *
 * v2.5 expansion. Adding a new reason? Add it to BlockingReason in types/,
 * then add the matching row here. UI components iterate REASONS so coverage
 * doesn't drift.
 */
import type { BlockingReason } from '../types';

export interface ReasonMeta {
  /** Short label for stat chips / pills. */
  shortLabel: string;
  /** Title for the row in the unplaceable panel. */
  label: string;
  /** Plain-English explanation shown under the label. */
  description: string;
  /** Severity hint for color picking. "user" = user can fix (matrix gap,
   *  region picker), "capacity" = needs hardware change, "structural" =
   *  catalog or fleet-config issue that's typically a typo / setup gap. */
  severity: 'user' | 'capacity' | 'structural';
}

export const REASONS: Record<BlockingReason, ReasonMeta> = {
  MEMORY: {
    shortLabel: 'Memory full',
    label: 'Cluster memory exhausted',
    description:
      "A specific cluster's accepting nodes ran out of memory. Other clusters could in principle hold this VM, but the matrix routed it here.",
    severity: 'capacity',
  },
  VCPU: {
    shortLabel: 'vCPU full',
    label: 'Cluster vCPU exhausted',
    description:
      "A specific cluster's accepting nodes ran out of vCPUs while memory was still available. Likely a vCPU-bound workload mix.",
    severity: 'capacity',
  },
  NO_ELIGIBLE_NODES: {
    shortLabel: 'No eligible cluster',
    label: 'No cluster accepts this VM',
    description:
      "No cluster matched on home hardware (legacy routing) and no matrix cell authored. Check your fungibility map.",
    severity: 'user',
  },
  DEPLOYMENT_LIMIT: {
    shortLabel: 'Buffer exhausted',
    label: 'Deployment buffer exhausted',
    description:
      "Deployable nodes all consumed; the configured buffer is holding the rest in reserve. Raise the buffer or add more racks.",
    severity: 'capacity',
  },
  ISOLATED_HOST: {
    shortLabel: 'Isolated full',
    label: 'Isolated host saturation',
    description:
      "Every node on an isolated cluster (1 VM/node, e.g. VHM) is already holding a VM. Add nodes or relax isolation if it makes sense.",
    severity: 'capacity',
  },
  VM_SIZE_NOT_FOUND: {
    shortLabel: 'Unknown SKU',
    label: 'VM size not in catalog',
    description:
      "The SKU name in your BOM doesn't match any uploaded VM row. Likely a typo or a stale BOM after deleting from the VM tab.",
    severity: 'structural',
  },
  NO_FUNGIBILITY_DEFINED: {
    shortLabel: 'Fungibility blank',
    label: 'Fungibility info missing on hardware',
    description:
      "Your uploaded hardware row has empty homeFor + spilloverFrom columns AND fungibility is on. Either fill the columns in the Hardware tab or author the matrix.",
    severity: 'user',
  },
  NOT_FUNGIBLE_TO_HARDWARE: {
    shortLabel: 'Not fungible',
    label: 'VM not fungible to available hardware',
    description:
      "The VM's generation isn't in any accepting cluster's homeFor ∪ spilloverFrom set. Either add the generation to a cluster's fungibility, or remove the SKU from the BOM.",
    severity: 'user',
  },
  NOT_AUTHORED: {
    shortLabel: 'Matrix unauthored',
    label: 'Fungibility matrix not authored',
    description:
      "Your matrix has cells for other (VM × HW) pairs but none for this one. Open the Fungibility tab and decide: Home / Spillover / Blocked.",
    severity: 'user',
  },
  // v2.5 additions
  VM_OVERSIZED_MEMORY: {
    shortLabel: 'Oversized (mem)',
    label: 'VM larger than every available node (memory)',
    description:
      "The VM's memory requirement exceeds the largest single-node memory in your entire fleet. No amount of capacity can ever hold this SKU — you need bigger nodes.",
    severity: 'capacity',
  },
  VM_OVERSIZED_VCPU: {
    shortLabel: 'Oversized (vCPU)',
    label: 'VM larger than every available node (vCPU)',
    description:
      "The VM's vCPU count exceeds the largest single-node vCPU count anywhere. Bigger sockets or more cores per socket needed.",
    severity: 'capacity',
  },
  OVERFLOWED_ALL_TIERS: {
    shortLabel: 'Cascade exhausted',
    label: 'Routed home + every spillover tier full',
    description:
      "The VM had at least one accepting cluster (Home, then Spill-1 → Spill-5), but every one was at sum-capacity. Add hardware to an accepting tier or re-author the matrix to widen acceptance.",
    severity: 'capacity',
  },
  BLOCKED_BY_MATRIX: {
    shortLabel: 'All blocked',
    label: 'Every accepting cluster explicitly Blocked',
    description:
      "Every cluster eligible by hardware type is marked Blocked in your matrix for this VM class. You actively forbade routing — open the Fungibility tab and convert at least one cell to Home or Spillover.",
    severity: 'user',
  },
  REGION_MISMATCH: {
    shortLabel: 'Region filtered',
    label: 'VM region doesn\'t match active region',
    description:
      "The VM is tagged to a region different from the one you have active for its provider in the VMs tab. The engine never saw this row — adjust the active region or upload this VM for the active region.",
    severity: 'user',
  },
  NO_CLUSTERS_CONFIGURED: {
    shortLabel: 'No clusters',
    label: 'No clusters configured',
    description:
      "You haven't set up any clusters yet. Open the Configure tab, pick a Hardware Group, and configure a fleet before running a simulation.",
    severity: 'structural',
  },
  ZONE_NOT_IN_FLEET: {
    shortLabel: 'Zone missing',
    label: 'Selected zone has no cluster',
    description:
      "This BOM row is zonal and one of its selected zones doesn't match any cluster's zone tag. Tag a cluster with that zone in the Hardware tab or remove the zone from the BOM row.",
    severity: 'user',
  },
  NETWORK: {
    shortLabel: 'Network full',
    label: 'Cluster network exhausted',
    description:
      "Accepting nodes ran out of network bandwidth (Mbps) before memory or vCPU. Other clusters could in principle hold this VM, but the matrix routed it here. Either raise the node network cap in the Hardware Library or rebalance the BOM.",
    severity: 'capacity',
  },
  VM_OVERSIZED_NETWORK: {
    shortLabel: 'VM too wide (network)',
    label: 'VM exceeds every node’s network capacity',
    description:
      "This VM size needs more Mbps than ANY node in the fleet can provide. You need bigger-network nodes or you need to drop this SKU. Distinct from NETWORK (which means the cluster routed-to is full).",
    severity: 'structural',
  },
  STORAGE: {
    shortLabel: 'Storage full',
    label: 'Cluster Premium SSD throughput exhausted',
    description:
      "Accepting nodes ran out of Premium SSD throughput (MB/s) before any other constraint. Either raise the per-node storage throughput in the Hardware Library, swap to a higher-throughput SKU, or rebalance the BOM.",
    severity: 'capacity',
  },
  VM_OVERSIZED_STORAGE: {
    shortLabel: 'VM too wide (storage)',
    label: 'VM exceeds every node’s Premium SSD throughput',
    description:
      "This VM size needs more MB/s than ANY node in the fleet can provide. You need higher-throughput storage on the host or you need to drop this SKU.",
    severity: 'structural',
  },
};

/** Color accent for the row's left border + label, keyed off severity. */
export function reasonAccent(reason: BlockingReason): {
  border: string;
  text: string;
  bg: string;
} {
  const sev = REASONS[reason]?.severity ?? 'capacity';
  if (sev === 'user') {
    return {
      border: 'rgba(251, 191, 36, 0.55)', // amber — user can fix
      text: '#FCD34D',
      bg: 'rgba(251, 191, 36, 0.08)',
    };
  }
  if (sev === 'structural') {
    return {
      border: 'rgba(248, 113, 113, 0.55)', // red — typo / setup gap
      text: '#FCA5A5',
      bg: 'rgba(239, 68, 68, 0.08)',
    };
  }
  return {
    border: 'rgba(96, 165, 250, 0.55)', // blue — capacity / hardware
    text: '#93C5FD',
    bg: 'rgba(59, 130, 246, 0.08)',
  };
}

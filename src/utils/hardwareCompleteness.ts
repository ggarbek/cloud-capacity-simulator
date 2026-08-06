/**
 * v2.19.52 — Hardware Library "completeness" helper.
 *
 * Lists the fields a HardwareGroup is missing for it to be FULLY useful to
 * the dashboard. Notes are intentionally excluded — they're free-form and
 * never required. Financial fields ARE included even though they're
 * optional at the engine level: missing financial data silently kills
 * Profitability / Headroom / ROI surfaces and the user has no way to know
 * unless we flag it.
 *
 * Pure derivation off a HardwareGroup. The HardwareCard / Library header /
 * Server Builder section can all surface the same signal.
 */
import type { HardwareGroup } from '../types';

export interface MissingField {
  /** Short human-readable label for the missing field. Shown in tooltips. */
  label: string;
  /** 'spec' = required for accurate sim. 'financial' = optional but silently
   *  disables Profitability / Headroom $ readouts when missing. */
  kind: 'spec' | 'financial';
}

export function hardwareMissingFields(group: HardwareGroup): MissingField[] {
  const out: MissingField[] = [];
  const slots = group.rackComposition ?? [];
  const computeSlots = slots.filter((s) => !s.isUtility);

  // ── Identity / required spec ───────────────────────────────────────────
  if (!group.name || !group.name.trim()) out.push({ label: 'Name', kind: 'spec' });
  if (!group.provider || !group.provider.trim()) {
    out.push({ label: 'Cloud provider', kind: 'spec' });
  }

  // Processor: metadata-only — the engine never reads it for packing
  // (sockets × coresPerSocket × HT drives vCPU math). v2.19.52 dropped it
  // from the required-spec checklist after a fixture surfaced where every
  // engine-relevant field was filled but processor was blank, producing
  // false-positive "incomplete" dots. If we ever want a softer hint, add
  // it back as `kind: 'financial'`-style so it tints amber-soft, not red.

  if (!Number.isFinite(group.memoryGibPerNode) || group.memoryGibPerNode <= 0) {
    out.push({ label: 'Memory per node', kind: 'spec' });
  }
  if (!Number.isFinite(group.socketsPerNode) || group.socketsPerNode <= 0) {
    out.push({ label: 'Sockets per node', kind: 'spec' });
  }

  // Core/vCPU: either-or. Some authoring flows fill `vcpusPerNode`
  // directly (e.g. uploaded snapshots where vCPU was the live edit
  // field), others fill `coresPerSocket` and let `vcpusPerNode` derive.
  // Per-slot rackComposition overrides also satisfy this (heterogeneous
  // racks may set the per-slot value and leave the group-level blank).
  const hasCores =
    (group.coresPerSocket != null && group.coresPerSocket > 0) ||
    (group.vcpusPerNode != null && group.vcpusPerNode > 0) ||
    (computeSlots.length > 0 &&
      computeSlots.every(
        (s) =>
          (s.coresPerSocket != null && s.coresPerSocket > 0) ||
          (s.vcpusPerNode != null && s.vcpusPerNode > 0),
      ));
  if (!hasCores) {
    out.push({ label: 'Cores per socket', kind: 'spec' });
  }

  // Nodes per rack: top-level OR rackComposition slot counts sum to > 0
  // (heterogeneous racks express nodes-per-rack through the slot counts).
  const slotNodeSum = slots.reduce((a, s) => a + (s.count ?? 0), 0);
  const hasNodesPerRack =
    (group.nodesPerRack != null && group.nodesPerRack > 0) || slotNodeSum > 0;
  if (!hasNodesPerRack) {
    out.push({ label: 'Nodes per rack', kind: 'spec' });
  }

  // ── Financial — flagged but classed separately so the UI can paint a
  // softer signal or distinguish in the tooltip. ─────────────────────────
  const hasCost =
    (Number.isFinite(group.costPerNodeUsd) && (group.costPerNodeUsd ?? 0) > 0) ||
    (Number.isFinite(group.costPerRackUsd) && (group.costPerRackUsd ?? 0) > 0);
  if (!hasCost) out.push({ label: 'Cost per node / rack', kind: 'financial' });
  if (!Number.isFinite(group.usableLifeMonths) || (group.usableLifeMonths ?? 0) <= 0) {
    out.push({ label: 'Usable life (months)', kind: 'financial' });
  }

  return out;
}

/** Quick boolean: any required spec field missing. */
export function hardwareIncomplete(group: HardwareGroup): boolean {
  return hardwareMissingFields(group).length > 0;
}

/** Aggregate across a list — total servers with ≥1 missing field. */
export function hardwareIncompleteCount(groups: HardwareGroup[]): number {
  let n = 0;
  for (const g of groups) if (hardwareIncomplete(g)) n++;
  return n;
}

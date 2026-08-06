/**
 * v2.19.48 — Sidebar tab "needs attention" alerts.
 *
 * Computes a per-tab boolean signaling whether the user has something
 * actionable nested inside that tab. The Sidebar renders a small yellow
 * dot next to each tab whose flag is true, so the user can see at a
 * glance "step N needs me to do something" without opening every tab.
 *
 * Pure derivation off AppState — safe to call on every render.
 *
 * Per-tab triggers:
 *   1. Hardware Library — no servers authored (blocks Fleet Builder).
 *   2. Fleet Builder — region(s) authored with zero zones, or no clusters
 *      placed despite servers existing.
 *   3. VM Fungibility — at least one placed hardware group has no
 *      accepting fungibility cell (reuses fungibilityNeedsAttention).
 *   4. VM BoM — current provider scope is missing a required Region pick.
 *   5. VM Library — no triggers right now (the tab is an appendix; the
 *      seeded catalog is enough for most users). Reserved for future use.
 */
import type { AppState } from '../state/AppState';
import { fungibilityNeedsAttention } from './fungibilityStatus';
import { hardwareIncompleteCount } from './hardwareCompleteness';
import { fleetList } from '../state/AppState';

export interface TabAlerts {
  hardware: { alert: boolean; reason: string };
  fleet: { alert: boolean; reason: string };
  fungibility: { alert: boolean; reason: string };
  bom: { alert: boolean; reason: string };
  vmLibrary: { alert: boolean; reason: string };
}

const NONE = { alert: false as const, reason: '' };

export function computeTabAlerts(state: AppState): TabAlerts {
  // ── 1. Hardware Library ────────────────────────────────────────────
  // Two triggers:
  //   (a) the library is genuinely empty — blocks Fleet Builder entirely;
  //   (b) at least one server in the library has missing required fields
  //       (v2.19.52). Surfaces the dot so the user opens the tab + sees
  //       which servers' rows carry the per-row "Missing" callouts.
  const incompleteHw = hardwareIncompleteCount(state.userHardware);
  let hardware = NONE as { alert: boolean; reason: string };
  if (state.userHardware.length === 0) {
    hardware = {
      alert: true,
      reason:
        'No servers in your Hardware Library yet. Build a CPU + Build a Server, or upload the Excel template, before placing clusters.',
    };
  } else if (incompleteHw > 0) {
    hardware = {
      alert: true,
      reason: `${incompleteHw} server${incompleteHw === 1 ? '' : 's'} in your library have missing fields. Open each and look for the amber callouts.`,
    };
  }

  // ── 2. Fleet Builder ───────────────────────────────────────────────
  const orphanRegions = state.fleetRegions.filter((r) => r.zones.length === 0);
  const placed = fleetList(state);
  const placedClusters = placed.length;
  const hasServers = state.userHardware.length > 0;
  const unackBuffer = placed.filter(({ fleet: f }) => !f.bufferAcknowledged);
  let fleet = NONE as { alert: boolean; reason: string };
  if (orphanRegions.length > 0) {
    fleet = {
      alert: true,
      reason: `${orphanRegions.length} region${orphanRegions.length === 1 ? '' : 's'} have no zones authored (${orphanRegions.map((r) => r.region).join(', ')}). Clusters can't be placed until zones exist.`,
    };
  } else if (hasServers && placedClusters === 0) {
    fleet = {
      alert: true,
      reason:
        'You have servers in the library but no clusters placed yet. Author a region with zones, then Place Racks below to start a fleet.',
    };
  } else if (unackBuffer.length > 0) {
    // Buffer defaults to 12% but stays amber until the user explicitly
    // acknowledges (or edits) — surfaces here so the user doesn't have
    // to scroll the roster to find which cluster is still pending.
    fleet = {
      alert: true,
      reason: `${unackBuffer.length} cluster${unackBuffer.length === 1 ? '' : 's'} have an unconfirmed buffer / overhead value. Open the cluster row and set or acknowledge the buffer.`,
    };
  }

  // ── 3. VM Fungibility ──────────────────────────────────────────────
  // v2.19.52 — fires ONLY on the broad "engine will refuse" signal:
  //   • matrix empty when placed HW exists,
  //   • a placed HW group has no accepting cell anywhere,
  //   • a BoM SKU has ZERO authored cells (truly unroutable).
  // The per-(SKU × HW) pair-gap signal was dropped — "1 RULE MISSING" now
  // means "this SKU has no authored cells at all," not "at least one pair
  // is empty." Half-authored matrices are intentional (size-first /
  // class-fallback) and shouldn't yellow-dot the tab.
  const fungibility = fungibilityNeedsAttention(state)
    ? {
        alert: true,
        reason:
          'Placed hardware has no fungibility rules, or a BoM SKU has no authored cells. VMs cannot route until at least one Home / Spillover cell per affected SKU/HW exists.',
      }
    : NONE;

  // ── 4. VM BoM ──────────────────────────────────────────────────────
  // A required region pick (introduced v2.19.38) is the most common
  // missing prerequisite. We can only fire when the user has progressed
  // far enough that a region SHOULD be picked — i.e. they have a
  // selected provider and at least one VM category in scope.
  const provider = state.ui.bomProvider;
  const activeRegion = provider ? state.ui.activeRegion[provider] : undefined;
  let bom = NONE as { alert: boolean; reason: string };
  if (provider && state.ui.bomCategories.length > 0 && !activeRegion) {
    bom = {
      alert: true,
      reason:
        'Pick a deployment Region in the Bulk Add VMs panel — region is required before VMs can be added to the BoM.',
    };
  }

  // ── 5. VM Library ──────────────────────────────────────────────────
  // No triggers today; reserved.
  const vmLibrary = NONE;

  return { hardware, fleet, fungibility, bom, vmLibrary };
}

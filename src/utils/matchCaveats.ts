/**
 * Comparability CAVEATS for a cross-cloud VM equivalence (Wave-1 A1).
 *
 * `vmDistance` / `matchPct` say HOW CLOSE two sizes are on a normalized scale;
 * this layer says WHEN a high score still deserves an asterisk — the machine is
 * a near-shape match but a materially different KIND of thing (burstable vs
 * dedicated, a different product category surfaced via a fallback, a confidential
 * base paired with a merely-capable peer, a bare-metal size, a stretch match, or
 * a dimension we couldn't verify because the catalog lacked the data). It's the
 * honesty layer: surface the gap instead of letting a green percentage imply an
 * apples-to-apples swap.
 *
 * Pure + deterministic — no catalog scan, no I/O. Given two `CatalogEntry`s (and
 * optional context a caller already computed) it returns an ordered list of
 * caveats. Detection order is fixed so `worstCaveat` and any UI list are stable.
 */
import type { CatalogEntry } from '../types';
import { matchCategory, isBurstable } from './vmCategory';
import { matchPct, vmFeatures } from './equivalence';
import { gpuSpecFor, teeSpecFor, teeCapabilityFor } from './acceleratorSpecs';

export type MatchCaveatKind =
  | 'arch-cross'
  | 'burstable-vs-standard'
  | 'category-fallback'
  | 'confidential-feature-peer'
  | 'gpu-unknown'
  | 'storage-disk-unknown'
  | 'gen-unknown'
  | 'stretch-size'
  | 'bare-metal';

export interface MatchCaveat {
  kind: MatchCaveatKind;
  severity: 'warn' | 'info';
  label: string;
  detail: string;
}

/** Below this matchPct, an equivalence is a "stretch" — the closest thing on the
 *  other cloud, but not a like-for-like swap. */
export const STRETCH_MATCH_PCT = 40;
/** A ≥4× vCPU or memory ratio also makes a pair a stretch even if the (log-ratio)
 *  distance-derived pct hasn't crossed the threshold. */
export const STRETCH_SIZE_RATIO = 4;

/**
 * True when a SKU name denotes a bare-metal (whole-server, no-hypervisor) size.
 * Kept local (per the A1 brief — do NOT reach into specInsights) and conservative:
 *   - AWS  : a `.metal` / `.metal-<n>xl` suffix (m5.metal, c6i.metal-24xl).
 *   - GCP  : a `-metal` suffix (c3-standard-192-metal) or the x4 SAP-HANA
 *            bare-metal family.
 *   - Azure: rare; a trailing/embedded "bare metal" / BM marker.
 */
export function bareMetalFromName(vmSizeName: string | undefined): boolean {
  const n = (vmSizeName ?? '').toLowerCase();
  if (!n) return false;
  if (/\.metal(-\d+xl)?$/.test(n)) return true; // AWS
  if (/-metal(-\d+)?$/.test(n)) return true; // GCP
  if (/^x4-/.test(n)) return true; // GCP x4 SAP-HANA bare metal
  if (/bare[\s_-]?metal|_bm(_|$)|\bbm\d/.test(n)) return true; // Azure / generic
  return false;
}

/** Canonical detection + display order — also the tiebreak for `worstCaveat`
 *  once severity is equal. */
const KIND_ORDER: MatchCaveatKind[] = [
  'category-fallback',
  'confidential-feature-peer',
  'stretch-size',
  'burstable-vs-standard',
  'arch-cross',
  'gpu-unknown',
  'storage-disk-unknown',
  'bare-metal',
  'gen-unknown',
];

/**
 * The comparability caveats for matching `base` against `analog`. `ctx` lets a
 * caller feed in facts it already computed so this layer doesn't recompute them:
 *   - crossCategory     : the match was surfaced via the cross-category fallback.
 *   - confidentialPeer  : the analog is a capable-but-not-confidential-category peer.
 *   - distance          : the normalized `vmDistance` (for the stretch test).
 */
export function matchCaveats(
  base: CatalogEntry,
  analog: CatalogEntry,
  ctx?: { crossCategory?: boolean; confidentialPeer?: boolean; distance?: number },
): MatchCaveat[] {
  const out: MatchCaveat[] = [];
  const fa = vmFeatures(base);
  const fb = vmFeatures(analog);
  const catA = matchCategory(base);
  const catB = matchCategory(analog);

  // 1) category-fallback — the analog is a different product category (either the
  //    caller told us so, or the effective match-categories simply differ).
  if (ctx?.crossCategory || catA !== catB) {
    out.push({
      kind: 'category-fallback',
      severity: 'warn',
      label: 'Different category',
      detail: `${base.vmSizeName} (${catA}) and ${analog.vmSizeName} (${catB}) are different product categories.`,
    });
  }

  // 2) confidential-feature-peer — a confidential base paired with a peer that
  //    only OFFERS confidential compute (or vice versa), not a purpose-built one.
  const confidentialSide = catA === 'Confidential' || catB === 'Confidential';
  const capableOther =
    teeCapabilityFor(base.provider, base.family) !== null ||
    teeCapabilityFor(analog.provider, analog.family) !== null;
  if (ctx?.confidentialPeer || (confidentialSide && capableOther)) {
    out.push({
      kind: 'confidential-feature-peer',
      severity: 'warn',
      label: 'Confidential peer',
      detail: 'One side is a confidential family; the other only offers opt-in confidential compute, not a dedicated confidential SKU.',
    });
  }

  // 3) stretch-size — a weak overall match OR a large vCPU / memory size gap.
  const vcpuRatio = ratio(fa.vcpus, fb.vcpus);
  const memRatio = ratio(fa.memoryGib, fb.memoryGib);
  const weakPct =
    ctx?.distance !== undefined && isFinite(ctx.distance) && matchPct(ctx.distance) < STRETCH_MATCH_PCT;
  if (weakPct || vcpuRatio >= STRETCH_SIZE_RATIO || memRatio >= STRETCH_SIZE_RATIO) {
    out.push({
      kind: 'stretch-size',
      severity: 'warn',
      label: 'Stretch match',
      detail: 'The closest analog, but not a like-for-like swap — the sizes differ substantially.',
    });
  }

  // 4) burstable-vs-standard — the service model differs (one side is burstable).
  const burstA = isBurstable(base);
  const burstB = isBurstable(analog);
  if (burstA !== burstB) {
    out.push({
      kind: 'burstable-vs-standard',
      severity: 'warn',
      label: 'Burstable vs standard',
      detail: `${(burstA ? base : analog).vmSizeName} is burstable (shared-core, credit-based); the other is a standard dedicated-vCPU size.`,
    });
  }

  // 5) arch-cross — both sides have a known CPU architecture and they differ.
  if (fa.arch !== 'other' && fb.arch !== 'other' && fa.arch !== fb.arch) {
    const bigStep = (fa.arch === 'arm') !== (fb.arch === 'arm'); // arm ↔ x86 is a bigger jump
    out.push({
      kind: 'arch-cross',
      severity: bigStep ? 'warn' : 'info',
      label: 'CPU architecture',
      detail: `Different CPU architecture (${fa.arch} vs ${fb.arch})${bigStep ? ' — recompile / image changes likely.' : '.'}`,
    });
  }

  // 6) gpu-unknown — a GPU category on a side but the curated GPU spec is missing
  //    on either, so model / VRAM / interconnect couldn't be compared.
  const gpuSide = catA === 'GPU' || catB === 'GPU';
  if (gpuSide && (!gpuSpecFor(base.family, base.vmSizeName) || !gpuSpecFor(analog.family, analog.vmSizeName))) {
    out.push({
      kind: 'gpu-unknown',
      severity: 'warn',
      label: 'GPU unverified',
      detail: 'A GPU size lacks a curated accelerator spec, so GPU model / VRAM / interconnect were not compared.',
    });
  }

  // 7) storage-disk-unknown — a Storage-Optimized side with no local-disk figure,
  //    so the defining dimension of the category couldn't be compared.
  if (catA === 'Storage Optimized' && !(base.localDiskGib > 0)) {
    out.push(storageDiskCaveat(base.vmSizeName));
  } else if (catB === 'Storage Optimized' && !(analog.localDiskGib > 0)) {
    out.push(storageDiskCaveat(analog.vmSizeName));
  }

  // 8) bare-metal — one side is a whole-server bare-metal size, the other isn't.
  if (bareMetalFromName(base.vmSizeName) !== bareMetalFromName(analog.vmSizeName)) {
    out.push({
      kind: 'bare-metal',
      severity: 'warn',
      label: 'Bare metal',
      detail: 'One side is a bare-metal (whole-server, no-hypervisor) size; the other is virtualized.',
    });
  }

  // 9) gen-unknown — same known architecture, but CPU generation couldn't be read
  //    on at least one side (info: it only means the gen refinement was skipped).
  if (fa.arch !== 'other' && fa.arch === fb.arch && (!fa.gen || !fb.gen)) {
    out.push({
      kind: 'gen-unknown',
      severity: 'info',
      label: 'CPU gen unknown',
      detail: 'CPU microarchitecture generation could not be determined on one side, so that refinement was skipped.',
    });
  }

  return out;
}

/** True when the caveats include a "stretch" of some kind — a size stretch or a
 *  category-fallback match (both mean "not a like-for-like swap"). */
export function isStretch(c: MatchCaveat[]): boolean {
  return c.some((x) => x.kind === 'stretch-size' || x.kind === 'category-fallback');
}

/** The single most important caveat: warnings before info, then canonical kind
 *  order. null when there are none. */
export function worstCaveat(c: MatchCaveat[]): MatchCaveat | null {
  if (!c.length) return null;
  const sorted = [...c].sort((x, y) => {
    if (x.severity !== y.severity) return x.severity === 'warn' ? -1 : 1;
    return KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind);
  });
  return sorted[0];
}

// ── helpers ───────────────────────────────────────────────────────────────────
function ratio(a: number, b: number): number {
  const x = Math.max(1e-9, a);
  const y = Math.max(1e-9, b);
  return Math.max(x / y, y / x);
}

function storageDiskCaveat(vmSizeName: string): MatchCaveat {
  return {
    kind: 'storage-disk-unknown',
    severity: 'warn',
    label: 'Local disk unknown',
    detail: `${vmSizeName} is storage-optimized but carries no local-disk figure, so the defining dimension was not compared.`,
  };
}

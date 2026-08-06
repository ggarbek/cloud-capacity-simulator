#!/usr/bin/env node
// GCP Compute Engine rate ingestion — Cloud Billing Catalog API (API-KEY from env).
//
// ── Why this is harder than Azure/AWS ──────────────────────────────────────
// GCP does NOT publish a single per-machine-type hourly rate. Compute Engine is
// priced as COMPONENT SKUs: a per-vCPU-hour SKU and a per-GB-RAM-hour SKU, listed
// SEPARATELY for each machine family and each region. (Source: Cloud Billing
// Catalog API; the old keyless cloudpricingcalculator.appspot.com/static/data/
// pricelist.json is DEAD — returns HTTP 404 as of 2026-06, and even when alive it
// never carried newer families like N2/M2/C2.) So there is no keyless GCP path:
// the Catalog API is the only authoritative public source and it REQUIRES an API
// key. This script reconstructs a per-machine-type hourly rate from the two
// component SKUs + a machine-type → (vCPU, RAM) shape map.
//
// ── Assembly (documented) ──────────────────────────────────────────────────
// For a predefined type, e.g. n2-standard-4 = 4 vCPU + 16 GiB:
//   hourly = vCPU_count × (per-vCPU-hour SKU for {family, region, usageType})
//          + RAM_GiB     × (per-GiB-hour  SKU for {family, region, usageType})
// We do this independently for usageType OnDemand → payg, Commit1Yr → ri1y,
// Commit3Yr → ri3y. (GCP committed-use discounts ARE priced as their own SKUs,
// so ri1y/ri3y are first-class, not a PAYG × factor.)
//
// ── SKU filters ────────────────────────────────────────────────────────────
// Compute Engine service id = 6F81-5844-456A. We keep SKUs where:
//   • category.resourceFamily === 'Compute'
//   • category.resourceGroup is a CPU group (CPU / N2*CPU / …) or a RAM group
//   • category.usageType ∈ { OnDemand, Commit1Yr, Commit3Yr }
//   • the SKU description names a family we know (matchFamily below) AND is NOT
//     Sole-Tenancy / Custom / Extended / GPU / Premium-network noise.
// The family is parsed from the SKU `description` (e.g. "N2 Instance Core running
// in Americas", "N2 Instance Ram running in EMEA"). region comes from
// `serviceRegions` (a SKU may list several; we fan out to each).
//
// Output: public/rates/gcp/<region>.json = { "<machine-type>": { payg, ri1y, ri3y } }
// plus _index.json (region list + counts + generatedAt) — same shape as Azure.
//
// Usage:
//   GCP_API_KEY=… node scripts/ingest/gcp-prices.mjs                 # all regions
//   GCP_API_KEY=… node scripts/ingest/gcp-prices.mjs us-central1 europe-west1
//
// Get a free key: Google Cloud console → create/select a project → enable the
// "Cloud Billing API" → APIs & Services → Credentials → Create credentials →
// API key (restrict it to the Cloud Billing API). Public pricing needs NO IAM
// role — only the key. Put it in env as GCP_API_KEY; NEVER commit it.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'public', 'rates', 'gcp');
const COMPUTE_SERVICE_ID = '6F81-5844-456A';
const API = `https://cloudbilling.googleapis.com/v1/services/${COMPUTE_SERVICE_ID}/skus`;

const API_KEY = process.env.GCP_API_KEY;
const regionFilter = new Set(process.argv.slice(2)); // empty = all regions

// usageType → our rate key.
const USAGE_TO_RATE = {
  OnDemand: 'payg',
  Commit1Yr: 'ri1y',
  Commit3Yr: 'ri3y',
};

// ── Machine-type → (vCPU, RAM GiB) shape map ───────────────────────────────
// Source: GCP "Machine families resource and comparison guide" + the published
// predefined-type tables (same public docs the in-repo seed mirrors under
// docs/gcp/). Hardcoded for the common predefined families the planner cares
// about: standard / highmem / highcpu across n2, n2d, e2, c2, c3, n4, c4.
// Each family carries its per-vCPU RAM ratio + the vCPU sizes it ships, so we
// expand to concrete types without typing every row. (Custom/extended/metal
// shapes are intentionally out of scope — they aren't predefined SKUs.)
//
// ratios (GiB RAM per vCPU):  standard ≈ 4 · highmem ≈ 8 · highcpu ≈ 2
// e2 is the exception (standard 4, highmem 8, highcpu 1) and tops out at 32 vCPU.
const FAMILY_SHAPES = {
  // family : { sizes:[vCPU…], types:{ suffix: ramPerVcpu } }
  n2:  { sizes: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128], types: { standard: 4, highmem: 8, highcpu: 2 } },
  n2d: { sizes: [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224], types: { standard: 4, highmem: 8, highcpu: 2 } },
  e2:  { sizes: [2, 4, 8, 16, 32], types: { standard: 4, highmem: 8, highcpu: 1 } },
  c2:  { sizes: [4, 8, 16, 30, 60], types: { standard: 4 } },
  c3:  { sizes: [4, 8, 22, 44, 88, 176], types: { standard: 4, highmem: 8, highcpu: 2 } },
  n4:  { sizes: [2, 4, 8, 16, 32, 48, 64, 80], types: { standard: 4, highmem: 8, highcpu: 2 } },
  c4:  { sizes: [2, 4, 8, 16, 32, 48, 96, 192], types: { standard: 4, highmem: 8, highcpu: 2 } },
};

// ── Irregular families: per-CLASS vCPU lineups + a decoupled rate-family ─────
// Memory-optimized (M-series), Storage-optimized (Z3) and the first-gen N1
// predefined families were previously UNPRICED — so they had specs (from
// gcp-specs.mjs) but no rate, and the spec⨝rate join dropped them entirely.
// That's why GCP surfaced only TWO categories (General Purpose + Compute
// Optimized): the only priced families were n2/n2d/e2/c2/c3/n4/c4. These
// families need per-class vCPU lineups (ultramem ≠ megamem sizes), so they
// can't use the uniform FAMILY_SHAPES form. Shapes mirror gcp-specs.mjs so the
// generated `<prefix>-<class>-<vcpu>` keys JOIN the spec keys exactly. The GCP
// billing catalog prices all M-series off ONE "Memory-optimized" component
// SKU, so m1/m2/m3/x4 share `rateFamily: 'memory-optimized'` (distinct machine
// prefixes, one rate). ram = GiB-per-vCPU for that class (used only to weight
// the per-GiB component; matches the published per-type memory within rounding).
const EXTRA_SHAPES = {
  // prefix : { rateFamily, classes: { suffix: { ram: GiBperVcpu, sizes:[…] } } }
  n1: { rateFamily: 'n1', classes: {
    standard: { ram: 3.75, sizes: [1, 2, 4, 8, 16, 32, 64, 96] },
    highmem:  { ram: 6.5,  sizes: [2, 4, 8, 16, 32, 64, 96] },
    highcpu:  { ram: 0.9,  sizes: [2, 4, 8, 16, 32, 64, 96] },
  } },
  m1: { rateFamily: 'memory-optimized', classes: {
    ultramem: { ram: 24.025, sizes: [40, 80, 160] },
    megamem:  { ram: 14.93,  sizes: [96] },
  } },
  m2: { rateFamily: 'memory-optimized', classes: {
    ultramem: { ram: 28.3, sizes: [208, 416] },
    megamem:  { ram: 14.15, sizes: [416] },
  } },
  m3: { rateFamily: 'memory-optimized', classes: {
    ultramem: { ram: 30.5,  sizes: [32, 64, 128] },
    megamem:  { ram: 15.25, sizes: [64, 128] },
  } },
  // X4 (SAP HANA high-memory). Its memory does NOT follow a clean GiB/vCPU
  // ratio (960 vCPU ships 16 TiB, not 960×anything), so it carries an explicit
  // per-size memOverride (GiB) — mirroring gcp-specs.mjs — instead of `ram`.
  // The GCP billing catalog prices X4 off the SAME shared "Memory-optimized"
  // component SKU as m1/m2/m3 (rateFamily 'memory-optimized'), so it joins the
  // already-proven memory-optimized cpu/ram rates — completing the documented
  // intent in matchFamily (which already maps these to one slug) that the x4
  // shape was missing. Fail-safe: if those components aren't in a region, x4
  // simply isn't priced there (never fabricated).
  x4: { rateFamily: 'memory-optimized', classes: {
    megamem: { memOverride: { 960: 16384, 1440: 24576, 1920: 32768 } },
  } },
  z3: { rateFamily: 'z3', classes: {
    highmem: { ram: 8, sizes: [8, 16, 22, 32, 44, 88, 176] },
  } },
};

// ── Accelerator (GPU) machine types ─────────────────────────────────────────
// GPU machine types are NOT a uniform vCPU×ratio lineup, and their on-demand
// rate has THREE real components, not two:
//   hourly = vcpu × (per-vCPU SKU for the accelerator family)
//          + ram  × (per-GiB  SKU for the accelerator family)
//          + gpuCount × (per-GPU SKU for {gpuModel, region})
// `family` is the rate-family slug matchFamily returns for the host vCPU/RAM
// component (a2 / a3 / g2). `gpuModel` keys the per-GPU SKU table (built by
// gpuModelFromSku). gpuCount is the published count for that machine type.
// These mirror gcp-specs.mjs GPU_TYPES so keys join the spec keys exactly.
//
// FAIL-SAFE: a GPU machine type is priced for a region ONLY when the host
// vCPU SKU, host RAM SKU, AND the per-GPU SKU are all present for that region
// and term. If the GPU SKU is missing we SKIP the type entirely (never emit a
// vCPU+RAM-only rate that silently omits the dominant GPU cost). Mirrors the
// memory-optimized fail-safe in assemble().
const GPU_MACHINE_TYPES = {
  // a2 — A100 40GB
  'a2-highgpu-1g':  { family: 'a2', vcpu: 12, ram: 85,   gpuModel: 'A100 40GB', gpuCount: 1 },
  'a2-highgpu-2g':  { family: 'a2', vcpu: 24, ram: 170,  gpuModel: 'A100 40GB', gpuCount: 2 },
  'a2-highgpu-4g':  { family: 'a2', vcpu: 48, ram: 340,  gpuModel: 'A100 40GB', gpuCount: 4 },
  'a2-highgpu-8g':  { family: 'a2', vcpu: 96, ram: 680,  gpuModel: 'A100 40GB', gpuCount: 8 },
  'a2-megagpu-16g': { family: 'a2', vcpu: 96, ram: 1360, gpuModel: 'A100 40GB', gpuCount: 16 },
  // a2 — A100 80GB
  'a2-ultragpu-1g': { family: 'a2', vcpu: 12, ram: 170,  gpuModel: 'A100 80GB', gpuCount: 1 },
  'a2-ultragpu-2g': { family: 'a2', vcpu: 24, ram: 340,  gpuModel: 'A100 80GB', gpuCount: 2 },
  'a2-ultragpu-4g': { family: 'a2', vcpu: 48, ram: 680,  gpuModel: 'A100 80GB', gpuCount: 4 },
  'a2-ultragpu-8g': { family: 'a2', vcpu: 96, ram: 1360, gpuModel: 'A100 80GB', gpuCount: 8 },
  // a3 — H100 80GB
  'a3-highgpu-8g':  { family: 'a3', vcpu: 208, ram: 1872, gpuModel: 'H100 80GB', gpuCount: 8 },
  'a3-megagpu-8g':  { family: 'a3', vcpu: 208, ram: 1872, gpuModel: 'H100 80GB', gpuCount: 8 },
  // g2 — L4
  'g2-standard-4':  { family: 'g2', vcpu: 4,  ram: 16,  gpuModel: 'L4', gpuCount: 1 },
  'g2-standard-8':  { family: 'g2', vcpu: 8,  ram: 32,  gpuModel: 'L4', gpuCount: 1 },
  'g2-standard-12': { family: 'g2', vcpu: 12, ram: 48,  gpuModel: 'L4', gpuCount: 1 },
  'g2-standard-16': { family: 'g2', vcpu: 16, ram: 64,  gpuModel: 'L4', gpuCount: 1 },
  'g2-standard-24': { family: 'g2', vcpu: 24, ram: 96,  gpuModel: 'L4', gpuCount: 2 },
  'g2-standard-32': { family: 'g2', vcpu: 32, ram: 128, gpuModel: 'L4', gpuCount: 1 },
  'g2-standard-48': { family: 'g2', vcpu: 48, ram: 192, gpuModel: 'L4', gpuCount: 4 },
  'g2-standard-96': { family: 'g2', vcpu: 96, ram: 384, gpuModel: 'L4', gpuCount: 8 },
};

/**
 * Map a GPU SKU `description` → our gpuModel key ('A100 40GB' | 'A100 80GB' |
 * 'H100 80GB' | 'L4') or null. These are the SEPARATE per-GPU SKUs the billing
 * catalog prices independently — e.g.
 *   "Nvidia Tesla A100 GPU running in Americas"
 *   "Nvidia Tesla A100 80GB GPU running in EMEA"
 *   "Nvidia H100 80GB GPU running in Americas"   (also seen "Nvidia H100 GPU …")
 *   "Nvidia L4 GPU running in APAC"
 *   committed: "Commitment v1: Nvidia L4 GPU in <city> for 1 Year"
 * Robust to the description variants GCP uses (Tesla prefix optional, 40GB
 * implicit for the original A100). Returns null for anything that isn't one of
 * the three GPU models we price — so an unknown GPU SKU never mis-prices a type.
 */
function gpuModelFromSku(desc) {
  const d = desc.toLowerCase();
  if (!/\bgpu\b/.test(d)) return null; // GPU SKUs always say "GPU"
  // H100 (a3). H100 ships only as 80GB; match with or without the "80gb".
  if (/\bh100\b/.test(d)) return 'H100 80GB';
  // A100 — disambiguate 80GB vs the original 40GB (A100 with no GB → 40GB).
  if (/\ba100\b/.test(d)) return /80\s*gb/.test(d) ? 'A100 80GB' : 'A100 40GB';
  // L4 (g2). Guard against "L4e"/other tokens by requiring a word boundary.
  if (/\bl4\b/.test(d)) return 'L4';
  return null;
}

/**
 * Classify a per-GPU SKU `description` to its PRICING TERM — 'payg' | 'ri1y' |
 * 'ri3y' — by the SAME committed-use tokens the vCPU/RAM path keys on, NOT by
 * the catalog `usageType` alone. The bug this fixes: GCP's per-GPU A100/H100
 * committed-use SKUs ("Commitment v1: … Nvidia Tesla A100 GPU … for 1 Year")
 * could carry a usageType that binned a CHEAPER 1yr/3yr per-GPU rate into the
 * on-demand `payg` slot (buildComponentRates keeps the lowest price per term),
 * under-pricing a2/a3 on-demand AND inverting the term ordering (ri > payg).
 *
 * The description is authoritative for the term:
 *   • "Commitment v1: …"  / "Commitment …" + "3 Year"/"3yr"/"36 month" → ri3y
 *   • "Commitment …" + "1 Year"/"1yr"/"12 month"                       → ri1y
 *   • a bare "Commitment" with no horizon                              → null
 *     (ambiguous; skip rather than mis-bin — never let it touch payg)
 *   • NO commitment token at all                                       → 'payg'
 *     (an on-demand per-GPU SKU, e.g. "Nvidia Tesla A100 GPU running in …")
 *
 * Returns null for an ambiguous committed SKU so it is dropped (fail-safe),
 * never written to payg. The on-demand SKU is the ONLY thing that sets payg.
 * Mirrors how matchFamily already separates on-demand vs committed-use; L4 is
 * unaffected because its SKUs follow the same naming, so g2 is preserved.
 */
function gpuTermFromSku(desc) {
  const d = desc.toLowerCase();
  const committed = /\bcommitment\b/.test(d);
  if (!committed) return 'payg'; // on-demand per-GPU SKU → on-demand term only
  if (/\b3\s*year\b|\b3\s*yr\b|\b36\s*month/.test(d)) return 'ri3y';
  if (/\b1\s*year\b|\b1\s*yr\b|\b12\s*month/.test(d)) return 'ri1y';
  return null; // committed but no horizon → ambiguous; never bin into payg
}

/**
 * Pure GPU-machine-type rate reconstruction for ONE term. Returns the assembled
 * hourly USD (vcpu×cpu + ram×ram + gpuCount×gpu) when ALL THREE component rates
 * are present, else null (fail-safe: a missing GPU rate yields no rate, never an
 * under-priced vCPU+RAM-only number). Exported for offline unit testing.
 *   @param shape  { vcpu, ram, gpuCount }
 *   @param comp   { cpu, ram } host component rates (USD/vCPU-hr, USD/GiB-hr)
 *   @param gpuRate USD per-GPU-hour for {gpuModel, region} (or null/undefined)
 */
export function gpuMachineRate(shape, comp, gpuRate) {
  const cpu = comp?.cpu;
  const ram = comp?.ram;
  if (cpu == null || ram == null || gpuRate == null) return null;
  const usd = shape.vcpu * cpu + shape.ram * ram + shape.gpuCount * gpuRate;
  return usd > 0 ? Math.round(usd * 1e6) / 1e6 : null;
}

/** Expand FAMILY_SHAPES + EXTRA_SHAPES → { "n2-standard-4": { family:'n2', vcpu:4, ram:16 }, … }.
 *  `family` is the RATE-family slug (what matchFamily returns) — usually the
 *  machine prefix, but memory-optimized M-series all map to one shared slug. */
function buildMachineTypes() {
  const out = {};
  for (const [family, spec] of Object.entries(FAMILY_SHAPES)) {
    for (const [suffix, ramPerVcpu] of Object.entries(spec.types)) {
      for (const vcpu of spec.sizes) {
        out[`${family}-${suffix}-${vcpu}`] = { family, vcpu, ram: vcpu * ramPerVcpu };
      }
    }
  }
  for (const [prefix, spec] of Object.entries(EXTRA_SHAPES)) {
    const rateFamily = spec.rateFamily ?? prefix;
    for (const [suffix, cls] of Object.entries(spec.classes)) {
      // A class states its sizes either as `sizes:[…]` + a uniform `ram`
      // (GiB/vCPU), OR as a per-size `memOverride` map (total GiB) when the
      // memory doesn't follow a clean ratio (X4). memOverride wins.
      const sizes = cls.memOverride ? Object.keys(cls.memOverride).map(Number) : cls.sizes;
      for (const vcpu of sizes) {
        const ram = cls.memOverride ? cls.memOverride[vcpu] : vcpu * cls.ram;
        out[`${prefix}-${suffix}-${vcpu}`] = { family: rateFamily, vcpu, ram };
      }
    }
  }
  return out;
}

// Map a SKU `description` → our family slug (n2, n2d, e2, c2, c3, n4, c4) or null.
// Handles BOTH SKU formats:
//   On-demand: "N2 Instance Core running in Paris"     · "E2 Instance Ram running in …"
//   Committed: "Commitment v1: N2 Cpu in Frankfurt for 1 Year" · "Commitment v1: C3 Ram in …"
// The committed-use ("Commitment v1: …") SKUs are the SOURCE of the 1yr/3yr RI
// rates — they MUST be matched, not rejected. (A prior bug rejected every
// `commitment v1` description, which silently zeroed out all GCP RI coverage.)
function matchFamily(desc) {
  const d = desc.toLowerCase();
  // Reject non-predefined / add-on / non-base-compute noise. NOTE: do NOT
  // reject "commitment v1" — that's exactly the committed-use rate we want.
  if (/sole tenancy|sole-tenant|custom|extended|premium|network|license|local ssd/.test(d)) return null;
  if (/\bgpu\b/.test(d)) return null;
  if (/\bn2d\b/.test(d)) return 'n2d';
  if (/\bn2\b/.test(d)) return 'n2';
  if (/\be2\b/.test(d)) return 'e2';
  if (/\bc3\b/.test(d)) return 'c3';
  if (/\bc4\b/.test(d)) return 'c4';
  if (/\bn4\b/.test(d)) return 'n4';
  // Accelerator-optimized vCPU/RAM components. The on-demand SKUs read
  // "A2 Instance Core/Ram", "A3 Instance Core/Ram", "G2 Instance Core/Ram"
  // (committed "A2 Cpu/Ram …"). These are the HOST vCPU+RAM cost of a GPU
  // machine type — distinct from the per-GPU SKU (handled by gpuModelFromSku,
  // which the `\bgpu\b` reject above filters out before we reach here). The GPU
  // cost is added separately in assemble().
  if (/\ba2\b/.test(d)) return 'a2';
  if (/\ba3\b/.test(d)) return 'a3';
  if (/\bg2\b/.test(d)) return 'g2';
  // Memory-optimized M-series (M1/M2/M3/M4 + X4) — the billing catalog prices
  // them off ONE "Memory-optimized" component SKU (on-demand "Memory-optimized
  // Instance Core/Ram", committed "Memory-optimized Cpu/Ram"). All map to one
  // 'memory-optimized' slug, which EXTRA_SHAPES' m1/m2/m3/x4 machine types
  // reference. Without this, GCP surfaced no Memory Optimized category at all.
  if (/memory.optimized/.test(d) || /\bm[1-4]\b/.test(d)) return 'memory-optimized';
  // Storage-optimized Z3.
  if (/\bz3\b/.test(d) || /storage.optimized/.test(d)) return 'z3';
  // First-gen N1 predefined family (Previous Generation).
  if (/\bn1\b/.test(d)) return 'n1';
  if (/\bc2\b/.test(d)) return 'c2';
  // C2 (original Cascade-Lake compute-optimized) is named "Compute optimized"
  // in the committed-use catalog (vs "C2 Instance Core" on-demand). Map it,
  // but never let "C2D AMD" (a different family) fall through to here.
  if (/\bcompute optimized\b/.test(d) && !/\bc2d\b|amd/.test(d)) return 'c2';
  return null;
}

// Is this SKU the per-vCPU or per-RAM component? null = neither. Keys on the
// catalog's resourceGroup (CPU / RAM) which is consistent across on-demand AND
// committed SKUs, with a description fallback ("Core"/"Cpu"/"Ram") for safety.
function componentKind(sku) {
  const rg = (sku.category?.resourceGroup ?? '').toUpperCase();
  if (rg === 'CPU') return 'cpu';
  if (rg === 'RAM') return 'ram';
  const d = (sku.description ?? '').toLowerCase();
  if (/\b(core|cpu)\b/.test(d)) return 'cpu';
  if (/\bram\b/.test(d)) return 'ram';
  return null;
}

/** tieredRates[0].unitPrice → USD float (units + nanos/1e9). */
function unitPriceUsd(pricingInfo) {
  const expr = pricingInfo?.[0]?.pricingExpression;
  const rate = expr?.tieredRates?.[expr.tieredRates.length - 1]?.unitPrice; // last tier = the marginal rate
  if (!rate) return null;
  const units = Number(rate.units ?? 0);
  const nanos = Number(rate.nanos ?? 0);
  const usd = units + nanos / 1e9;
  return usd > 0 ? usd : null;
}

const round = (n) => (n == null ? null : Math.round(n * 1e6) / 1e6);

/** Page through every Compute Engine SKU, following nextPageToken. */
async function fetchAllSkus() {
  const skus = [];
  let pageToken = '';
  let pages = 0;
  do {
    const url = `${API}?key=${encodeURIComponent(API_KEY)}&pageSize=5000${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    }`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Catalog API ${res.status} on page ${pages}: ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    skus.push(...(json.skus ?? []));
    pageToken = json.nextPageToken ?? '';
    pages++;
    process.stdout.write(`\r  …${skus.length} SKUs (${pages} pages)`);
  } while (pageToken);
  process.stdout.write('\n');
  return skus;
}

/**
 * Build the component + GPU rate tables in one pass over the SKUs:
 *   rates[region][family] = { cpu: {payg,ri1y,ri3y}, ram: {payg,ri1y,ri3y} }
 *     cpu = USD per vCPU-hour, ram = USD per GiB-hour. Accelerator host
 *     vCPU/RAM (a2/a3/g2) ride here too — they're just more families.
 *   gpuRates[region][gpuModel] = {payg,ri1y,ri3y}  USD per GPU-hour.
 * Returns { rates, gpuRates }.
 */
function buildComponentRates(skus) {
  const rates = {};
  const gpuRates = {};
  for (const sku of skus) {
    const cat = sku.category ?? {};
    if (cat.resourceFamily !== 'Compute') continue;
    const rateKey = USAGE_TO_RATE[cat.usageType];
    if (!rateKey) continue; // skip Preemptible / Commit1Mo / etc.

    const desc = sku.description ?? '';
    const price = unitPriceUsd(sku.pricingInfo);
    if (price == null) continue;

    // GPU SKU? (Separate per-GPU component — keyed by model, not vCPU/RAM.)
    const gpuModel = gpuModelFromSku(desc);
    if (gpuModel) {
      // Term is taken from the DESCRIPTION (commitment tokens), NOT usageType —
      // so a cheaper committed-use A100/H100 per-GPU rate can NEVER displace the
      // on-demand payg rate (the term-inversion + under-pricing bug). null =
      // ambiguous committed SKU → drop it (fail-safe), never bin into payg.
      const gpuTerm = gpuTermFromSku(desc);
      if (!gpuTerm) continue;
      for (const region of sku.serviceRegions ?? []) {
        if (region === 'global') continue;
        if (regionFilter.size && !regionFilter.has(region)) continue;
        const g = (gpuRates[region] ??= {});
        const slot = (g[gpuModel] ??= {});
        // Lowest non-zero for (model, term) — guards duplicate descriptive SKUs.
        if (slot[gpuTerm] == null || price < slot[gpuTerm]) slot[gpuTerm] = price;
      }
      continue; // a GPU SKU is never also a vCPU/RAM component
    }

    const family = matchFamily(desc);
    if (!family) continue;
    const kind = componentKind(sku); // cpu | ram
    if (!kind) continue;

    for (const region of sku.serviceRegions ?? []) {
      if (region === 'global') continue;
      if (regionFilter.size && !regionFilter.has(region)) continue;
      const r = (rates[region] ??= {});
      const f = (r[family] ??= { cpu: {}, ram: {} });
      // Lowest non-zero for a given (component, rateKey) — guards against
      // duplicate descriptive SKUs; the base compute rate is the cheapest.
      const slot = f[kind];
      if (slot[rateKey] == null || price < slot[rateKey]) slot[rateKey] = price;
    }
  }
  return { rates, gpuRates };
}

/** Assemble per-machine-type hourly rates from the component table. */
function assemble(componentRates, machineTypes) {
  const byRegion = {};
  for (const [region, families] of Object.entries(componentRates)) {
    const bucket = {};
    for (const [mt, shape] of Object.entries(machineTypes)) {
      const comp = families[shape.family];
      if (!comp) continue; // family not priced in this region
      const row = {};
      for (const rk of ['payg', 'ri1y', 'ri3y']) {
        const cpu = comp.cpu[rk];
        const ram = comp.ram[rk];
        // Need BOTH components to state a hourly rate for that term.
        row[rk] = cpu != null && ram != null ? round(shape.vcpu * cpu + shape.ram * ram) : null;
      }
      if (row.payg != null || row.ri1y != null || row.ri3y != null) bucket[mt] = row;
    }
    if (Object.keys(bucket).length) byRegion[region] = bucket;
  }
  return byRegion;
}

/**
 * Assemble GPU machine-type rates, MERGING into an existing per-region bucket
 * map (the output of assemble()). A GPU type is emitted for a region+term ONLY
 * when the host vCPU SKU, host RAM SKU, AND the per-GPU SKU are all present —
 * the fail-safe skip (never an under-priced vCPU+RAM-only rate). `componentRates`
 * carries the accelerator host vCPU/RAM under families a2/a3/g2; `gpuRates`
 * carries the per-GPU-model rate.
 */
function assembleGpu(byRegion, componentRates, gpuRates) {
  for (const region of Object.keys(componentRates)) {
    const families = componentRates[region];
    const regionGpu = gpuRates[region] ?? {};
    for (const [mt, shape] of Object.entries(GPU_MACHINE_TYPES)) {
      const comp = families[shape.family]; // a2 | a3 | g2 host vCPU/RAM
      if (!comp) continue; // accelerator family host not priced here
      const gpuModelRates = regionGpu[shape.gpuModel];
      if (!gpuModelRates) continue; // FAIL-SAFE: no GPU SKU → skip (no rate)
      const row = {};
      let any = false;
      for (const rk of ['payg', 'ri1y', 'ri3y']) {
        // gpuMachineRate returns null unless all three components exist.
        const v = gpuMachineRate(shape, { cpu: comp.cpu[rk], ram: comp.ram[rk] }, gpuModelRates[rk]);
        row[rk] = v;
        if (v != null) any = true;
      }
      if (any) (byRegion[region] ??= {})[mt] = row;
    }
  }
  return byRegion;
}

async function main() {
  if (!API_KEY) {
    console.error(
      [
        '',
        'GCP ingestion needs an API key — set GCP_API_KEY and re-run.',
        '',
        'There is NO keyless GCP pricing source: the old',
        '  cloudpricingcalculator.appspot.com/static/data/pricelist.json',
        'is dead (HTTP 404) and never carried newer families. The Cloud Billing',
        'Catalog API is the only authoritative public source and it requires a key.',
        '',
        'Get one free (no IAM role needed, public pricing):',
        '  1. Google Cloud console → create/select a project.',
        '  2. Enable the "Cloud Billing API".',
        '  3. APIs & Services → Credentials → Create credentials → API key',
        '     (restrict it to the Cloud Billing API).',
        '  4. export GCP_API_KEY=… then re-run this script. NEVER commit the key.',
        '',
        '  GCP_API_KEY=… node scripts/ingest/gcp-prices.mjs [region …]',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const machineTypes = buildMachineTypes();
  console.log(`Machine-type shapes: ${Object.keys(machineTypes).length} predefined types across ${Object.keys(FAMILY_SHAPES).length} families.`);

  console.log(`Fetching Compute Engine SKUs (service ${COMPUTE_SERVICE_ID})…`);
  const skus = await fetchAllSkus();
  console.log(`  ${skus.length} SKUs → reconstructing component rates`);

  const { rates: componentRates, gpuRates } = buildComponentRates(skus);
  const byRegion = assemble(componentRates, machineTypes);
  // Add accelerator (GPU) machine types: a2/a3/g2 = host vCPU/RAM + per-GPU SKU,
  // fail-safe-skipped when the GPU SKU is absent for a region.
  assembleGpu(byRegion, componentRates, gpuRates);
  const gpuCount = Object.values(byRegion).reduce(
    (s, m) => s + Object.keys(m).filter((k) => k in GPU_MACHINE_TYPES).length, 0);
  console.log(`  GPU machine-type rates assembled: ${gpuCount} (a2/a3/g2; fail-safe-skipped where the GPU SKU is absent)`);

  const index = [];
  for (const [region, machines] of Object.entries(byRegion)) {
    const count = Object.keys(machines).length;
    if (!count) continue;
    await writeFile(join(OUT_DIR, `${region}.json`), JSON.stringify(machines));
    index.push({ region, machineTypeCount: count });
  }
  index.sort((a, b) => a.region.localeCompare(b.region));
  await writeFile(
    join(OUT_DIR, '_index.json'),
    JSON.stringify({ provider: 'gcp', generatedAt: new Date().toISOString(), regions: index }, null, 2),
  );

  console.log(`\n✓ Wrote ${index.length} region shards → public/rates/gcp/`);
  console.log(`  total machine-type rates: ${index.reduce((s, r) => s + r.machineTypeCount, 0)}`);
}

// Exported for offline unit testing of the pure pricing reconstruction.
export { GPU_MACHINE_TYPES, gpuModelFromSku, gpuTermFromSku, assembleGpu, matchFamily, buildComponentRates };

// Only run the live ingest when executed directly (not when imported by a test).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((e) => {
    console.error('\nIngestion failed:', e.message);
    process.exit(1);
  });
}

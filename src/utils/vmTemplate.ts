/**
 * Parse the user-uploaded VM template (downloaded via VM Library's ⤓ button).
 *
 * Schema source-of-truth = src/utils/vmTemplateBuilder.ts (the runtime
 * generator that produces the downloadable workbook). Keep this parser's
 * column expectations in sync with what that builder writes. (The legacy
 * scripts/build_vm_template.py was deleted in v2.19.21.)
 *
 * Template layout: one sheet per cloud provider (Azure / AWS / GCP), all with
 * the same column schema. Each sheet's rows are imported with `provider`
 * inferred from the tab name; an explicit "Provider" column on the row wins
 * if present so a single combined sheet also works.
 *
 * Row layout per sheet: row 1 title, row 2 hint, row 4 column headers, row 5+
 * data — mirrors the hardware template so the two feel consistent.
 */

import * as XLSX from 'xlsx';
import type { CatalogEntry, UserVm, VmCategory } from '../types';
import { VM_CATEGORIES } from '../types';
import { categorize } from './vmCategory';

export interface VmTemplateImport {
  vms: UserVm[];
  warnings: string[];
}

// v2.4: Home Hardware Group / Spillover Target columns REMOVED from the VM
// template — fungibility (which VMs route to which hardware) is private
// company data and lives only in the Fungibility tab matrix. The VM template
// ships with public Azure / AWS / GCP specs and pricing only. Old templates
// that still carry the columns are silently ignored on import.
// v2.17.2: the canonical 3-column hierarchy is **Category → Series → Size**.
// Old templates used `VM Size Name` + `Family` — those names are still
// matched via the alias map in `mapHeaders()` so legacy uploads parse.
const VM_HEADERS = [
  'Category',
  'Series',
  'Size',
  'Provider',
  'Generation',
  'vCPUs',
  'Memory (GiB)',
  'Network (Mbps)',
  'Local Disk (GiB)',
  // ── v2.9 (Phase B) — full Azure-doc spec dimensions. All optional; old
  //    templates without these columns still parse cleanly. ───────────────
  'NIC Count',
  'Local Disks',
  'Local IOPS (RR)',
  'Local MBps (RR)',
  'Remote Disks',
  'Premium IOPS (uncached)',
  'Premium MBps (uncached)',
  'Ultra IOPS (uncached)',
  'Ultra MBps (uncached)',
  'Accelerator',
  // ── pricing + meta ────────────────────────────────────────────────────
  'Region',
  'PAYG Hourly (USD)',
  '1-yr RI Hourly (USD)',
  '3-yr RI Hourly (USD)',
  'Notes',
] as const;

export async function parseVmTemplate(file: File): Promise<VmTemplateImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const warnings: string[] = [];
  const all: UserVm[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = sheetToRows(sheet);
    const headerRowIdx = findVmHeaderRow(rows);
    if (headerRowIdx < 0) continue; // not a VM sheet (e.g. a notes/readme tab)
    const headerMap = mapHeaders(rows[headerRowIdx], VM_HEADERS);
    const providerFromTab = inferProvider(sheetName);

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      const name = readStr(row, headerMap['Size']);
      if (!name) continue; // blank row

      const vcpus = readNum(row, headerMap['vCPUs']);
      const memoryGib = readNum(row, headerMap['Memory (GiB)']);
      if (vcpus === null || memoryGib === null || vcpus <= 0 || memoryGib <= 0) {
        warnings.push(
          `${sheetName} row ${r + 1} (${name}): missing vCPUs or Memory — skipped.`,
        );
        continue;
      }

      const provider = readStr(row, headerMap['Provider']) || providerFromTab;
      const family = readStr(row, headerMap['Series']);
      const generation = readStr(row, headerMap['Generation']) || family || provider;
      // Category: explicit column wins; fall back to the cross-cloud
      // classifier so legacy templates (no Category column) still tag rows.
      const rawCategory = readStr(row, headerMap['Category']);
      const category: VmCategory = (VM_CATEGORIES as readonly string[]).includes(rawCategory)
        ? (rawCategory as VmCategory)
        : categorize(provider, family);

      const hourlyUsd = readNum(row, headerMap['PAYG Hourly (USD)']);
      const riOne = readNum(row, headerMap['1-yr RI Hourly (USD)']);
      const riThree = readNum(row, headerMap['3-yr RI Hourly (USD)']);
      const region = readStr(row, headerMap['Region']);

      all.push({
        vmSizeName: name,
        provider,
        family,
        category,
        vmGeneration: generation,
        series: family || provider,
        memoryCategory: deriveMemoryCategoryLabel(memoryGib),
        // Fungibility moved to its own tab (v2.4) — VM template no longer
        // carries routing hints. CatalogEntry still has these fields for
        // back-compat with engine paths; we leave them empty.
        homeHardwareGroup: '',
        spilloverTarget: 'N/A',
        processor: '', // CPU lives on the Hardware template; VM rows just reference it via Home Hardware Group
        vcpus,
        memoryGib,
        networkMbps: readNum(row, headerMap['Network (Mbps)']) ?? 0,
        localDiskGib: readNum(row, headerMap['Local Disk (GiB)']) ?? 0,
        status: 'Generally Available',
        notes: readStr(row, headerMap['Notes']),
        region: region || undefined,
        hourlyUsd: hourlyUsd ?? undefined,
        riOneYrHourlyUsd: riOne ?? undefined,
        riThreeYrHourlyUsd: riThree ?? undefined,
        // ── v2.9 — optional rich spec dims. `undefined` if column absent. ──
        networkNicCount: readNum(row, headerMap['NIC Count']) ?? undefined,
        localStorageDiskCount: readNum(row, headerMap['Local Disks']) ?? undefined,
        localStorageGiB: readNum(row, headerMap['Local Disk (GiB)']) ?? undefined,
        localStorageIopsRR: readNum(row, headerMap['Local IOPS (RR)']) ?? undefined,
        localStorageMbpsRR: readNum(row, headerMap['Local MBps (RR)']) ?? undefined,
        remoteStorageDisks: readNum(row, headerMap['Remote Disks']) ?? undefined,
        remoteStorageIopsPremium:
          readNum(row, headerMap['Premium IOPS (uncached)']) ?? undefined,
        remoteStorageMbpsPremium:
          readNum(row, headerMap['Premium MBps (uncached)']) ?? undefined,
        remoteStorageIopsUltra:
          readNum(row, headerMap['Ultra IOPS (uncached)']) ?? undefined,
        remoteStorageMbpsUltra:
          readNum(row, headerMap['Ultra MBps (uncached)']) ?? undefined,
        acceleratorType: readStr(row, headerMap['Accelerator']) || undefined,
      });
    }
  }

  // Dedupe by (vmSizeName, region). Same VM size in different regions is a
  // legitimate distinct row — different rates per region — so we only collapse
  // rows that share BOTH the SKU name and the region. The region key falls
  // back to '_' (a sentinel) when blank so single-region templates keep the
  // previous "one row per name" behavior.
  const seen = new Map<string, UserVm>();
  for (const v of all) {
    const key = `${v.vmSizeName}|${(v.region ?? '').toLowerCase() || '_'}`;
    if (seen.has(key)) {
      warnings.push(
        `Duplicate VM "${v.vmSizeName}" in region "${v.region ?? '(unset)'}" — keeping last occurrence.`,
      );
    }
    seen.set(key, v);
  }
  return { vms: Array.from(seen.values()), warnings };
}

// ───────────────────────────────────── helpers

function inferProvider(sheetName: string): string {
  const s = sheetName.toLowerCase();
  if (s.includes('azure')) return 'Azure';
  if (s.includes('aws')) return 'AWS';
  if (s.includes('gcp') || s.includes('google')) return 'GCP';
  if (s.includes('oracle')) return 'Oracle';
  // "Custom" tab (or "My VMs" / "Lab" / "Internal") is the escape-hatch sheet
  // for users testing their own hardware/VM mix. Normalized to "Custom" so it
  // shows up consistently under the green Custom pill in BomFilter / VmTab.
  if (s.includes('custom') || s.includes('lab') || s.includes('internal') || s === 'my vms') {
    return 'Custom';
  }
  return sheetName;
}

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
}

// v2.17.2: legacy → canonical aliases. Old templates shipped `VM Size Name`
// + `Family`; the v2.17.2 schema renames them to `Size` + `Series` and adds
// `Category` at the front. Both names are accepted on import.
const HEADER_ALIASES: Record<string, string[]> = {
  Size: ['size', 'vm size name'],
  Series: ['series', 'family'],
  Category: ['category'],
};

function findVmHeaderRow(rows: unknown[][]): number {
  const anchors = ['size', 'vm size name'];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (
      row.some((c) => anchors.includes(String(c ?? '').trim().toLowerCase()))
    ) {
      return i;
    }
  }
  return -1;
}

function mapHeaders(headerRow: unknown[], expected: readonly string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const cells = headerRow.map((c) => String(c ?? '').trim().toLowerCase());
  for (const h of expected) {
    const aliases = HEADER_ALIASES[h] ?? [h.toLowerCase()];
    let idx = -1;
    for (const a of aliases) {
      idx = cells.indexOf(a);
      if (idx >= 0) break;
    }
    map[h] = idx;
  }
  return map;
}

function readStr(row: unknown[], col: number): string {
  if (col < 0) return '';
  const v = row[col];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function readNum(row: unknown[], col: number): number | null {
  const s = readStr(row, col);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function deriveMemoryCategoryLabel(memGib: number): CatalogEntry['memoryCategory'] {
  // Mirrors the hardware template's deriveMemoryCategory thresholds so the
  // BomSection MM/HM/VHM pills color correctly.
  if (memGib >= 24576) return 'Very High Memory (VHM)';
  if (memGib > 4096) return 'High Memory (HM)';
  return 'Medium Memory (MM)';
}

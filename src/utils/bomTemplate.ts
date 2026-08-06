/**
 * Parse the user-uploaded BOM template (public/bom-template.xlsx).
 *
 * Schema source-of-truth = scripts/build_bom_template.py — keep the two in
 * sync. Single sheet ("BOM" or first tab present), 3 columns:
 *
 *     | VM Size Name | Quantity | Notes |
 *
 * Lookups against the user's uploaded VM catalog happen in `BomSection`'s
 * existing enrich step — rows whose name doesn't resolve land in the "not in
 * catalog" banner the same way they would if added one-by-one via the picker.
 *
 * Layout: row 1 title, row 2 hint, row 4 column headers, row 5+ data —
 * matches the hardware + VM templates so the three feel uniform.
 */

import * as XLSX from 'xlsx';
import type { BomEntry } from '../types';

export interface BomTemplateImport {
  rows: BomEntry[];
  warnings: string[];
}

const BOM_HEADERS = [
  'VM Size Name',
  'Quantity',
  // v2.6 — deployment intent + zone selection. Both optional; blank
  // Deployment Type = 'regional'. "Zones" is a comma/semicolon list capped
  // at 4 entries. See `BomEntry.deploymentType` / `BomEntry.zones`.
  'Deployment Type',
  'Zones',
  'Notes',
] as const;

export async function parseBomTemplate(file: File): Promise<BomTemplateImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const warnings: string[] = [];

  // Walk every sheet until we find one whose row-4-ish header contains
  // "VM Size Name". Allows multi-tab files where one tab is named "BOM" and
  // others are scratch.
  let chosenSheet: XLSX.WorkSheet | undefined;
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = sheetToRows(sheet);
    if (findHeaderRow(rows, BOM_HEADERS[0]) >= 0) {
      chosenSheet = sheet;
      break;
    }
  }
  if (!chosenSheet) {
    warnings.push(
      'No sheet with a "VM Size Name" column was found. Re-download the BOM template and try again.',
    );
    return { rows: [], warnings };
  }

  const rows = sheetToRows(chosenSheet);
  const headerRowIdx = findHeaderRow(rows, BOM_HEADERS[0]);
  const headerMap = mapHeaders(rows[headerRowIdx], BOM_HEADERS);

  const out: BomEntry[] = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const name = readStr(row, headerMap['VM Size Name']);
    if (!name) continue; // blank row

    const qty = readNum(row, headerMap['Quantity']) ?? 1;
    if (qty <= 0) {
      warnings.push(`Row ${r + 1} (${name}): non-positive Quantity — skipped.`);
      continue;
    }
    const dtRaw = readStr(row, headerMap['Deployment Type']).toLowerCase();
    const deploymentType: 'regional' | 'zonal' | undefined =
      dtRaw.startsWith('zon') ? 'zonal' : dtRaw.startsWith('reg') ? 'regional' : undefined;
    const zonesRaw = readStr(row, headerMap['Zones']);
    const zones = zonesRaw
      ? Array.from(
          new Set(
            zonesRaw
              .split(/[,;|]/)
              .map((z) => normalizeZoneCell(z))
              .filter((z): z is string => !!z),
          ),
        ).slice(0, 4)
      : undefined;
    if (deploymentType === 'zonal' && (!zones || zones.length === 0)) {
      warnings.push(`Row ${r + 1} (${name}): Deployment Type = Zonal but no Zones listed — treated as regional.`);
    }
    out.push({
      vmSizeName: name,
      quantity: Math.floor(qty),
      ...(deploymentType ? { deploymentType } : {}),
      ...(zones && zones.length > 0 ? { zones } : {}),
    });
  }

  // Dedupe by (vmSizeName + deployment intent). Two rows of the same SKU with
  // the SAME deployment intent are almost certainly an accidental duplicate and
  // get summed; rows with different intent (regional vs zonal, or different
  // zone sets) are intentionally distinct deployments and stay separate.
  const seen = new Map<string, BomEntry>();
  for (const e of out) {
    const intent = `${e.deploymentType ?? 'regional'}|${(e.zones ?? []).slice().sort().join(',')}`;
    const key = `${e.vmSizeName.toLowerCase()}::${intent}`;
    const existing = seen.get(key);
    if (existing) {
      existing.quantity += e.quantity;
    } else {
      seen.set(key, { ...e });
    }
  }
  return { rows: Array.from(seen.values()), warnings };
}

// ───────────────────────────────────── helpers (same idiom as the other parsers)

function sheetToRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
}

function findHeaderRow(rows: unknown[][], anchor: string): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (row.some((c) => String(c ?? '').trim().toLowerCase() === anchor.toLowerCase())) return i;
  }
  return -1;
}

function mapHeaders(headerRow: unknown[], expected: readonly string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const cells = headerRow.map((c) => String(c ?? '').trim().toLowerCase());
  for (const h of expected) {
    map[h] = cells.indexOf(h.toLowerCase());
  }
  return map;
}

function readStr(row: unknown[], col: number): string {
  if (col < 0) return '';
  const v = row[col];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

/** Normalize a zone token from the BOM "Zones" cell to the fixed Zone 1..4
 *  universe. Accepts "1" / "z2" / "zone 3" / "Zone 4". Out-of-range → null. */
function normalizeZoneCell(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const m = t.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 4) return null;
  return `Zone ${n}`;
}

function readNum(row: unknown[], col: number): number | null {
  const s = readStr(row, col);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * v2.12 (Phase F) — Cross-provider VM equivalency Excel round-trip.
 *
 * A flat-list shape — one row per equivalency group. Mirrors the
 * fungibility template's "current state IS the template" convention:
 * downloading the template just exports the current `state.userEquivalency`
 * list. Empty list → blank rows (acts as the template). Populated list →
 * exported rows (acts as a saved snapshot).
 *
 * Schema (single "Equivalency" sheet):
 *   Row 1 = title
 *   Row 2 = legend / hint
 *   Row 3 = blank
 *   Row 4 = column headers: Azure SKU | AWS SKU | GCP SKU | Notes
 *   Row 5+ = data rows. Any column may be blank — a row with only an
 *            Azure SKU is "no published AWS/GCP analog yet, deal with it".
 *
 * Parser anchors on the literal "Azure SKU" header in column A so users
 * can tweak the surrounding rows without breaking import.
 */
import * as XLSX from 'xlsx';
import type { EquivalencyEntry } from '../types';

export interface EquivalencyImport {
  entries: EquivalencyEntry[];
  warnings: string[];
}

const SHEET_NAME = 'Equivalency';
const HEADER_AZURE = 'Azure SKU';
const HEADER_AWS = 'AWS SKU';
const HEADER_GCP = 'GCP SKU';
const HEADER_NOTES = 'Notes';

// ────────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────────
export function buildEquivalencyWorkbook(
  entries: EquivalencyEntry[],
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const aoa: (string | number | null)[][] = [];

  aoa.push(['VM Capacity Simulator — Cross-Provider Equivalency']);
  aoa.push([
    'Map an Azure SKU to its AWS + GCP analogs. Each row = one equivalency group. Any column may be blank (no published analog yet).',
  ]);
  aoa.push([]);
  aoa.push([HEADER_AZURE, HEADER_AWS, HEADER_GCP, HEADER_NOTES]);

  // Data rows — preserve original ordering so the user's edit ordering
  // round-trips cleanly.
  if (entries.length === 0) {
    // Empty template — give the user a single hint row so they can see the
    // shape without scrolling to find empty cells.
    aoa.push(['Standard_M64s', 'm7i.16xlarge', 'm3-ultramem-32', 'Both memory-optimized ~1 TiB']);
  } else {
    for (const e of entries) {
      aoa.push([
        e.azureSku ?? '',
        e.awsSku ?? '',
        e.gcpSku ?? '',
        e.notes ?? '',
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Column widths so the SKU names don't truncate visually in Excel.
  ws['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  return wb;
}

export function downloadEquivalencyXlsx(
  entries: EquivalencyEntry[],
  filename = 'equivalency-template.xlsx',
): void {
  const wb = buildEquivalencyWorkbook(entries);
  XLSX.writeFile(wb, filename);
}

// ────────────────────────────────────────────────────────────────────────
// Import
// ────────────────────────────────────────────────────────────────────────
export async function parseEquivalencyXlsx(file: File): Promise<EquivalencyImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const warnings: string[] = [];

  // Try the canonical sheet name first; fall back to the first sheet that
  // looks like an equivalency sheet (has "Azure SKU" in column A).
  let sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) {
    for (const name of wb.SheetNames) {
      const candidate = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(candidate, {
        header: 1,
        defval: null,
      }) as (string | number | null)[][];
      if (rows.some((r) => normalizeHeader(r[0]) === HEADER_AZURE)) {
        sheet = candidate;
        break;
      }
    }
  }
  if (!sheet) {
    return {
      entries: [],
      warnings: [`No "${SHEET_NAME}" sheet found and no sheet contained an "${HEADER_AZURE}" column.`],
    };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  }) as (string | number | null)[][];

  // Locate header row by content.
  let headerRow = -1;
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    if (normalizeHeader(rows[r][0]) === HEADER_AZURE) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) {
    return {
      entries: [],
      warnings: [`Header row ("${HEADER_AZURE}" in column A) not found in the first 20 rows.`],
    };
  }

  // Map column index → field. Robust to user reordering Azure/AWS/GCP/Notes
  // as long as the literal header names are present.
  const headers = rows[headerRow].map((h) => normalizeHeader(h));
  const colAzure = headers.indexOf(HEADER_AZURE);
  const colAws = headers.indexOf(HEADER_AWS);
  const colGcp = headers.indexOf(HEADER_GCP);
  const colNotes = headers.indexOf(HEADER_NOTES);

  const entries: EquivalencyEntry[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const azure = readStr(row[colAzure]);
    const aws = readStr(row[colAws]);
    const gcp = readStr(row[colGcp]);
    const notes = colNotes >= 0 ? readStr(row[colNotes]) : '';
    // Skip rows with no provider field — they're blank/decorative.
    if (!azure && !aws && !gcp) continue;
    const entry: EquivalencyEntry = {};
    if (azure) entry.azureSku = azure;
    if (aws) entry.awsSku = aws;
    if (gcp) entry.gcpSku = gcp;
    if (notes) entry.notes = notes;
    entries.push(entry);
  }

  // Dedupe by (azure|aws|gcp) tuple — repeating the same Azure SKU with
  // different AWS targets is allowed (one Azure SKU can have multiple
  // candidate analogs), but identical rows are deduped silently.
  const seen = new Set<string>();
  const deduped: EquivalencyEntry[] = [];
  for (const e of entries) {
    const key = `${e.azureSku ?? ''}|${e.awsSku ?? ''}|${e.gcpSku ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }
  if (deduped.length < entries.length) {
    warnings.push(`${entries.length - deduped.length} duplicate row(s) skipped.`);
  }

  return { entries: deduped, warnings };
}

function normalizeHeader(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function readStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

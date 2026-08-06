/**
 * Fungibility matrix Excel round-trip.
 *
 * The matrix's row + column space is derived from the user's uploaded HW
 * groups + VM classes — so the "template" the user downloads to fill in is
 * just an export of their CURRENT matrix state shaped against their CURRENT
 * catalog. Empty matrix → blank cells (acts as the template). Populated
 * matrix → cells reflect authored values (acts as a saved snapshot).
 *
 * Cell encoding (matches the FungibilityTab's keyboard shortcuts):
 *   blank  → not authored
 *   H      → Home (priority 0)
 *   1..5   → Spillover priority
 *   B      → Blocked
 *
 * Layout (single "Matrix" sheet):
 *   Row 1 = title
 *   Row 2 = legend hint
 *   Row 3 = blank
 *   Row 4 = column headers ("VM Class" + HW Group IDs)
 *   Row 5 = HW Group display names (helper row, parser ignores when re-importing)
 *   Row 6+ = data rows: VM class key + cell values
 *
 * Parser anchors on the literal "VM Class" header in column A so users can
 * tweak the surrounding rows without breaking import.
 */

import * as XLSX from 'xlsx';

export type CellValue = number | 'blocked' | null;
export type Matrix = Record<string, Record<string, CellValue>>;

export interface HwColumn {
  id: string;
  name: string;
}
export interface VmRow {
  key: string;
  label: string;
}

// v2.19.17 — Rows are now per-VM-size. The export writes "VM Size" in A1;
// the parser still accepts the legacy "VM Class" anchor so old templates
// re-import cleanly (cells fall back to class keys in the engine).
const HEADER_LABEL = 'VM Size';
const LEGACY_HEADER_LABEL = 'VM Class';

// ─────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────
export function buildMatrixWorkbook(
  matrix: Matrix,
  hwGroups: HwColumn[],
  vmClasses: VmRow[],
): XLSX.WorkBook {
  const aoa: (string | number)[][] = [];

  aoa.push(['Fungibility Matrix']);
  aoa.push([
    'Cells: H = Home (priority 0), 1–5 = Spillover priority, B = Blocked, blank = not authored. Edit cell values, then re-upload to restore.',
  ]);
  aoa.push([]); // blank spacer

  // Row 4 — column headers (parser anchor)
  aoa.push([HEADER_LABEL, ...hwGroups.map((g) => g.id)]);
  // Row 5 — human-readable names (helper; parser ignores)
  aoa.push(['(display)', ...hwGroups.map((g) => g.name)]);

  // Data rows
  for (const vm of vmClasses) {
    const row: (string | number)[] = [vm.key];
    for (const hw of hwGroups) {
      row.push(encodeCell(matrix[vm.key]?.[hw.id]));
    }
    aoa.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Set column widths so the file is readable when opened.
  ws['!cols'] = [
    { wch: Math.max(14, ...vmClasses.map((v) => v.label.length + 2)) },
    ...hwGroups.map((g) => ({ wch: Math.max(10, g.id.length + 2, g.name.length + 2) })),
  ];
  // Merge title + hint across all HW columns + label column.
  const lastCol = XLSX.utils.encode_col(hwGroups.length);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: hwGroups.length } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: hwGroups.length } },
  ];
  // Freeze panes: keep header rows + first column visible while scrolling.
  ws['!freeze'] = { xSplit: 1, ySplit: 5 };
  void lastCol;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matrix');
  return wb;
}

export function downloadMatrixXlsx(
  matrix: Matrix,
  hwGroups: HwColumn[],
  vmClasses: VmRow[],
  filename = 'fungibility-matrix.xlsx',
): void {
  const wb = buildMatrixWorkbook(matrix, hwGroups, vmClasses);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the click event a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─────────────────────────────────────────────────────────────────────────
// Import
// ─────────────────────────────────────────────────────────────────────────
export interface MatrixImport {
  matrix: Matrix;
  warnings: string[];
  /** Counts surface in the upload toast — gives the user concrete feedback. */
  rowCount: number;
  cellCount: number;
}

export async function parseFungibilityXlsx(file: File): Promise<MatrixImport> {
  const warnings: string[] = [];
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  // Prefer the "Matrix" sheet by name; fall back to the first sheet so users
  // who rename it still get a graceful import.
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === 'matrix') ?? wb.SheetNames[0];
  if (!sheetName) {
    warnings.push('No sheets in workbook.');
    return { matrix: {}, warnings, rowCount: 0, cellCount: 0 };
  }
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  // Find header row by anchor ("VM Size" — or the legacy "VM Class" — in
  // column A, case-insensitive).
  const anchors = [HEADER_LABEL.toLowerCase(), LEGACY_HEADER_LABEL.toLowerCase()];
  const headerIdx = rows.findIndex((r) =>
    anchors.includes(String((r as unknown[])[0] ?? '').trim().toLowerCase()),
  );
  if (headerIdx < 0) {
    warnings.push(`Header row not found — column A should contain "${HEADER_LABEL}".`);
    return { matrix: {}, warnings, rowCount: 0, cellCount: 0 };
  }
  const headerRow = rows[headerIdx] as unknown[];
  const hwIds: string[] = [];
  for (let c = 1; c < headerRow.length; c++) {
    const id = String(headerRow[c] ?? '').trim();
    hwIds[c - 1] = id; // preserve column index; empty IDs become empty strings (skipped per-cell)
  }
  if (hwIds.every((x) => !x)) {
    warnings.push('Header row has no HW group IDs — every column is blank.');
    return { matrix: {}, warnings, rowCount: 0, cellCount: 0 };
  }

  const matrix: Matrix = {};
  let cellCount = 0;
  let rowCount = 0;

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const first = String(row[0] ?? '').trim();
    if (!first) continue;
    // Skip the optional "(display)" helper row that the exporter writes.
    if (first.toLowerCase() === '(display)') continue;

    const vmKey = first;
    const rowMatrix: Record<string, CellValue> = {};
    for (let c = 0; c < hwIds.length; c++) {
      const hwId = hwIds[c];
      if (!hwId) continue;
      const raw = row[c + 1];
      const v = parseCell(raw);
      if (v === null) continue;
      rowMatrix[hwId] = v;
      cellCount++;
    }
    if (Object.keys(rowMatrix).length > 0) {
      matrix[vmKey] = rowMatrix;
      rowCount++;
    }
  }

  return { matrix, warnings, rowCount, cellCount };
}

// ─────────────────────────────────────────────────────────────────────────
// Cell encoding helpers
// ─────────────────────────────────────────────────────────────────────────
function encodeCell(v: CellValue | undefined): string | number {
  if (v === undefined || v === null) return '';
  if (v === 'blocked') return 'B';
  if (v === 0) return 'H';
  return v;
}

function parseCell(c: unknown): CellValue {
  if (c === undefined || c === null) return null;
  const s = String(c).trim();
  if (s === '') return null;
  const upper = s.toUpperCase();
  if (upper === 'H' || upper === 'HOME') return 0;
  if (upper === 'B' || upper === 'BLOCKED' || upper === 'X') return 'blocked';
  const n = Number(s);
  if (Number.isFinite(n) && Number.isInteger(n) && n >= 0 && n <= 5) return n;
  // Anything else (typos, "Eligible", ".", etc.) is treated as unset rather
  // than failing the whole import. The user can fix and re-upload.
  return null;
}

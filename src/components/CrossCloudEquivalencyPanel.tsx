/**
 * CrossCloudEquivalencyPanel (v2.33; setup-explorer mode v2.37) — the table of
 * cross-cloud equivalents. A one-column-per-cloud table with three row-sections
 * (Category → VM Family → VM Size); each cell shows that cloud's closest
 * equivalent for the row + a % similarity vs the BASE cloud.
 *
 * TWO modes, switched by props (RA defaults are unchanged):
 *  • Region-Availability (default): all clouds are columns (base = 100%), and a
 *    cell-click toggles the matching FilterChip.
 *  • Comparison-setup explorer (`hideBaseColumn` + `select`): the base column is
 *    dropped — the row label IS the base (highlighted), so we don't repeat it —
 *    and only the OTHER clouds get comparison columns with their ≈% match.
 *    Base SIZE rows are selectable (they drive the compare set), and an insights
 *    side-card explains, per other cloud, the most-similar Category / Family /
 *    Size with a brief "why". The table shrinks as the filter above narrows.
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { CatalogEntry } from '../types';
import {
  buildEquivalencyRows,
  type Provider,
  type Row,
  type Cell,
} from '../utils/crossCloudEquivalency';
import { vmFeatures, vmDistance, matchPct, describeMatch } from '../utils/equivalence';
import { matchCaveats, worstCaveat, type MatchCaveat } from '../utils/matchCaveats';
import type { FilterChip } from './RegionFilterChips';

const PROVIDER_TONE: Record<Provider, string> = {
  Azure: '#60A5FA',
  AWS: '#FBBF24',
  GCP: '#FCA5A5',
};

// v2.41 — How many VM-SIZE rows the "show more" expansion renders into the
// scroll lane. Bounded (not the whole catalog) because each row runs a
// cross-cloud best-match search; thousands of rows would hang the render.
// Narrow the filter to bring a large catalog under this ceiling.
const SIZE_EXPANDED_CAP = 60;
const FAMILY_EXPANDED_CAP = 60;
// Per-base-family VM-FAMILY rows shown before the "show more" toggle. A few
// picked base families always fit below this; the unfiltered "every family"
// list collapses past it.
const FAMILY_BASE_ROW_CAP = 12;

/** Tone for a 0–100 similarity score — green ≥85 / amber ≥65 / muted below. */
function pctTone(pct: number): string {
  return pct >= 85 ? '#34D399' : pct >= 65 ? '#FBBF24' : 'var(--text-muted)';
}

/** The similarity readout for a cell — a toned percent. The "match" wording is
 *  stated ONCE in the header/subtitle, not repeated on every row. `sub` renders
 *  the runner-up alternatives slightly smaller + lighter. */
function MatchPct({ pct, muted, sub }: { pct: number; muted?: boolean; sub?: boolean }) {
  return (
    <span
      className={`${sub ? 'text-[9px]' : 'text-[10px]'} font-semibold tabular-nums shrink-0 whitespace-nowrap`}
      style={{ color: muted ? 'var(--text-muted)' : pctTone(pct), opacity: sub ? 0.7 : 1 }}
    >
      {pct}%
    </span>
  );
}

/** Names where a cross-category analog actually came from — replaces the cryptic
 *  `≠` glyph. A GCP `n2-highmem` analog for a memory-optimized base reads
 *  "via General Purpose": memory-shaped, but the vendor labels it differently. */
function ViaTag({ category }: { category: string }) {
  return (
    <span
      className="inline-flex items-center text-[8.5px] font-medium shrink-0 whitespace-nowrap"
      style={{
        color: 'var(--text-muted)',
        background: 'var(--tint-soft)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '0 5px',
        lineHeight: '14px',
      }}
      title={`Closest analog lives in this cloud's "${category}" family — the same hardware shape, labeled differently by the vendor. How matching works → FAQ.`}
    >
      via {category}
    </span>
  );
}

/** ONE comparability chip for a cell — the single worst caveat (amber when a
 *  warning, neutral for info). The FULL caveat list is joined into the hover
 *  tooltip so the honesty layer is one glyph, not a wall of text. Renders
 *  nothing when the analog is a clean like-for-like. */
function CaveatChip({ caveats }: { caveats?: MatchCaveat[] }) {
  const worst = worstCaveat(caveats ?? []);
  if (!worst) return null;
  const warn = worst.severity === 'warn';
  return (
    <span
      className="inline-flex items-center text-[8.5px] font-semibold shrink-0 whitespace-nowrap"
      style={{
        color: warn ? '#FBBF24' : 'var(--text-muted)',
        background: warn ? 'rgba(251,191,36,0.10)' : 'var(--tint-soft)',
        border: `1px solid ${warn ? 'rgba(251,191,36,0.32)' : 'var(--border)'}`,
        borderRadius: 999,
        padding: '0 5px',
        lineHeight: '14px',
      }}
      title={(caveats ?? []).map((c) => `${c.label}: ${c.detail}`).join('\n')}
    >
      {warn ? '⚠ ' : ''}{worst.label}
    </span>
  );
}

type Section = 'category' | 'family' | 'size';

/** Build the FilterChip a cell maps to. Base cell on a category row → a
 *  category chip (cross-cloud, no provider); base cell on family/size → the
 *  base provider's chip; an OTHER provider's cell → that provider's override
 *  chip. Category rows are always cross-cloud regardless of column. */
function chipForCell(section: Section, cell: Cell, provider: Provider): FilterChip {
  if (section === 'category') return { kind: 'category', value: cell.value };
  if (section === 'family') return { kind: 'family', value: cell.value, provider };
  return { kind: 'size', value: cell.value, provider };
}

function chipKey(c: FilterChip): string {
  return c.kind === 'category' ? `category::${c.value}` : `${c.kind}::${c.provider}::${c.value}`;
}

/** Setup-mode VM selection — an ORDERED LIST per cloud that ALLOWS DUPLICATES.
 *  Clicking a cell in the equivalents table APPENDS that VM to its cloud's list
 *  (v2.41 — the same analog can pair with several base rows, so a repeated VM is
 *  never blanked); the Nth pick from each cloud lines up on comparison row N.
 *  Because duplicates are allowed, removal is BY POSITION (`onRemoveAt`), done in
 *  the comparison box (✕ / drag-out); `onReorder` re-pairs which VMs compare. */
interface SelectMode {
  /** Each pick carries the base table-row it was selected from, so the cell
   *  highlight is row-specific (a repeated analog only lights the clicked row). */
  pickedByProvider: Record<Provider, { value: string; row: string; auto?: boolean }[]>;
  /** Toggle a VM for a specific base row (add if absent, remove if present). */
  onAdd: (provider: Provider, sizeValue: string, row: string) => void;
  /** Remove the entry at a list position (the comparison-box row). */
  onRemoveAt: (provider: Provider, index: number) => void;
  onReorder: (provider: Provider, from: number, to: number) => void;
}

interface Props {
  userVms: CatalogEntry[];
  filteredVms: CatalogEntry[];
  activeProviders: Provider[];
  base: Provider;
  filterChips: FilterChip[];
  onChange: (next: FilterChip[]) => void;
  /** Setup explorer — drop the base data column (the row label is the base). */
  hideBaseColumn?: boolean;
  /** Setup explorer — make base SIZE rows selectable for the compare set. */
  select?: SelectMode;
  /** Setup explorer — render the per-cloud most-similar insights side-card. */
  showInsights?: boolean;
  /** Setup explorer — when a base family is picked, the VM FAMILY section shows
   *  EVERY in-scope family in each other cloud ranked by similarity (best on
   *  top, alternatives below) instead of the single closest. */
  familyRanking?: Record<Provider, { family: string; pct: number }[]>;
  /** Per-base-family rankings — `{ baseFamily: { provider: [{family,pct}] } }`.
   *  When present the VM FAMILY section renders one row PER base family with its
   *  #1 match + up to 2 inline runner-up alternatives per cloud. */
  familyRankingPerBase?: Record<string, Record<Provider, { family: string; pct: number }[]>>;
  familyTotals?: Record<Provider, number>;
  /** Per non-base cloud, the comparison families the user has TICKED. These are a
   *  HIGHLIGHT signal, not a filter: a picked family lights up (colorized) in the
   *  ranked rows while the rest persist, greyed. With none picked for a cloud,
   *  every entry stays subtle — we don't pre-anoint a "winner". */
  pickedColumnFamilies?: Partial<Record<Provider, string[]>>;
  /** The base cloud's picked families (the left column of the ranked section). */
  baseFamilies?: string[];
  /** Per-base-category rankings — `{ baseCategory: { provider: [{category,pct}] } }`.
   *  When present the CATEGORY section renders one row PER picked base category
   *  with its #1 cross-cloud analog + inline runner-up alternatives, mirroring the
   *  multi-select VM FAMILY layout. */
  categoryRankingPerBase?: Record<string, Record<Provider, { category: string; pct: number }[]>>;
  /** The base cloud's picked categories (the left column of the ranked section). */
  baseCategories?: string[];
  /** Per non-base cloud, the categories the user has PICKED. A HIGHLIGHT signal
   *  (mirrors `pickedColumnFamilies`): a picked category lights up in the ranked
   *  category rows; the rest persist, greyed. Nothing is lit by default. */
  pickedColumnCategories?: Partial<Record<Provider, string[]>>;
  /** "Better match outside your filter" alerts — surfaced as the right-hand pane
   *  ONLY when non-empty (a much better analog is hidden by the current filter).
   *  Replaces the always-on most-similar insights. */
  betterMatchAlerts?: import('../utils/crossCloudEquivalency').BetterMatchAlert[];
  /** Setup explorer — for the anchored base SIZE, each other cloud's same-category
   *  sizes ranked by similarity. Drives the insights pane's size runners-up. */
  sizeRanking?: Record<Provider, { size: string; pct: number }[]>;
  /** The anchored base SIZE name (context for the size insights). */
  baseSize?: string;
  /** Setup explorer — suppress the in-panel comparison box; the page renders the
   *  shared, persistent CompareTable instead so the same table can be pinned to
   *  the top of At a Glance / VM Compare. */
  hideComparisonBox?: boolean;
  /** Insights "How matching works →" link → opens the FAQ at a section. */
  onOpenFaq?: (section?: string) => void;
  /** Insights "+ Compare <Category>" action → adds a category to a cloud's scope. */
  onAddCategory?: (provider: Provider, category: string) => void;
  /** v2.46 — products-comparison mode hides the VM SIZE section entirely (the
   *  user is comparing categories / families, not individual sizes). */
  hideSizes?: boolean;
  /** v2.52.2 — the table section the active SETUP step should expand (and the
   *  others collapse), so stepping Category → VM family → VM size walks the
   *  table open in lock-step. Null leaves the user's manual section state alone.
   *  A manual section toggle still wins until the step changes again. */
  syncOpenSection?: 'category' | 'family' | 'size' | null;
  /** S65 (Fix 1) — the user's ACTUAL region pick per provider, threaded straight
   *  to `buildEquivalencyRows` so its ladder fallback pool is scoped to the picked
   *  region (when present) instead of inferring scope from `filteredVms`. A
   *  provider's value = `[pickedRegion]` when the user picked one; null/undefined =
   *  no region restriction. */
  regionScopeByProvider?: Partial<Record<Provider, string[] | null>>;
}

export function CrossCloudEquivalencyPanel({
  userVms,
  filteredVms,
  activeProviders,
  base,
  filterChips,
  onChange,
  hideBaseColumn = false,
  select,
  showInsights = false,
  familyRanking,
  familyRankingPerBase,
  familyTotals,
  pickedColumnFamilies,
  baseFamilies,
  categoryRankingPerBase,
  baseCategories,
  pickedColumnCategories,
  betterMatchAlerts,
  sizeRanking,
  baseSize,
  hideComparisonBox = false,
  onOpenFaq,
  onAddCategory,
  hideSizes = false,
  syncOpenSection = null,
  regionScopeByProvider,
}: Props) {
  // v2.41 — the VM-SIZE list is capped for readability; the user can expand it
  // into a scrollable lane to browse every in-scope size.
  const [sizesExpanded, setSizesExpanded] = useState(false);
  const [familiesExpanded, setFamiliesExpanded] = useState(false);
  // v2.44 — whole-section collapse (a SEPARATE layer from the within-section
  // "show more rows" affordances above). Category is short so it opens by
  // default; the long VM Family + VM Size sections start collapsed so the table
  // stays compact. Clicking a section header flips its open state.
  const [sectionOpen, setSectionOpen] = useState<{
    category: boolean;
    family: boolean;
    size: boolean;
  }>({ category: true, family: false, size: false });
  const toggleSection = (key: 'category' | 'family' | 'size') =>
    setSectionOpen((s) => ({ ...s, [key]: !s[key] }));
  // v2.52.2 — Walk the table open in lock-step with the active SETUP step: when
  // the user is on the Category / VM family / VM size step, expand that section
  // and collapse the others. Only fires when the step actually CHANGES (the
  // value is the dep), so a manual section toggle between steps still sticks.
  useEffect(() => {
    if (!syncOpenSection) return;
    setSectionOpen({
      category: syncOpenSection === 'category',
      family: syncOpenSection === 'family',
      size: syncOpenSection === 'size',
    });
  }, [syncOpenSection]);
  // PERF (v2.52.1) — `buildEquivalencyRows` is an O(size²) cross-cloud spec rank;
  // when the cloud set or the scoped catalog legitimately changes (toggling a
  // provider, narrowing a filter) it MUST recompute, ~1s. Defer the two heavy
  // inputs so React paints the interaction (the filter chip / step) on the urgent
  // pass and recomputes this table as a low-priority transition — the click stays
  // instant; the table fills a beat later. `userVms`/`base` are stable refs.
  const dFilteredVms = useDeferredValue(filteredVms);
  const dActiveProviders = useDeferredValue(activeProviders);
  // Stable JSON key for the region-scope object so the O(size²) memo isn't
  // re-fired by a fresh-but-equal object reference each render.
  const regionScopeKey = JSON.stringify(regionScopeByProvider ?? {});
  const rows = useMemo(
    () =>
      buildEquivalencyRows({
        userVms,
        filteredVms: dFilteredVms,
        activeProviders: dActiveProviders,
        base,
        sizeLimit: sizesExpanded ? SIZE_EXPANDED_CAP : undefined,
        familyLimit: familiesExpanded ? FAMILY_EXPANDED_CAP : undefined,
        regionScopeByProvider,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userVms, dFilteredVms, dActiveProviders, base, sizesExpanded, familiesExpanded, regionScopeKey],
  );

  const others = useMemo(
    () => activeProviders.filter((p) => p !== base),
    [activeProviders, base],
  );

  // Cross-cloud only makes sense with ≥2 clouds.
  if (activeProviders.length < 2) return null;

  // The columns we actually render: in explorer mode the base is the row label,
  // so we only render the OTHER clouds; in RA mode every active cloud shows.
  const columnProviders = hideBaseColumn ? others : activeProviders;

  const selectedKeys = new Set(filterChips.map(chipKey));

  const toggleCell = (section: Section, cell: Cell, provider: Provider) => {
    const chip = chipForCell(section, cell, provider);
    const key = chipKey(chip);
    if (selectedKeys.has(key)) {
      onChange(filterChips.filter((c) => chipKey(c) !== key));
    } else {
      onChange([...filterChips, chip]);
    }
  };

  // Equal-width columns — the base/label column matches every cloud column so
  // the table reads as a clean, evenly-divided grid (the divider overlay below
  // splits on the same even fractions). `minmax(0,1fr)` lets long labels
  // truncate instead of stretching a column.
  const colCount = columnProviders.length + 1;
  const gridCols = `repeat(${colCount}, minmax(0, 1fr))`;

  // v2.44 — the section header (CATEGORY / VM FAMILY / VM SIZE) repeats across
  // EVERY column (base + each cloud), aligned to the columns, so a reader scanning
  // any single cloud's column always knows which section a cell belongs to (it
  // used to print only once over the base column on the far left).
  // v2.44 — the header is now a CLICKABLE whole-section toggle. The label still
  // repeats across every column (so any single cloud column self-identifies),
  // but the FIRST (base/gutter) column also carries a +/− affordance: collapsed
  // shows `+ N` (N = rows hidden), expanded shows `−`. Clicking anywhere on the
  // row flips that section's open state.
  const sectionLabel = (
    key: 'category' | 'family' | 'size',
    text: string,
    hiddenCount: number,
  ) => {
    const open = sectionOpen[key];
    return (
      <div
        role="button"
        aria-expanded={open}
        onClick={() => toggleSection(key)}
        className="grid"
        style={{ gridTemplateColumns: gridCols, gap: 0, cursor: 'pointer' }}
        title={open ? `Collapse ${text}` : `Expand ${text} (${hiddenCount} rows)`}
      >
        {Array.from({ length: colCount }).map((_, i) => (
          <div
            key={i}
            className="text-[9px] tracking-[0.06em] font-semibold uppercase pt-2 pb-1 flex items-center gap-1"
            style={{
              color: 'var(--text-muted)',
              ...(i === 0 ? { paddingLeft: 4 } : colPad),
            }}
          >
            {i === 0 && (
              <span
                className="inline-flex items-center justify-center font-bold tabular-nums shrink-0"
                style={{
                  color: 'var(--interactive)',
                  fontSize: 10,
                  lineHeight: '12px',
                  minWidth: 12,
                }}
                aria-hidden
              >
                {open ? '−' : `+${hiddenCount > 0 ? ` ${hiddenCount}` : ''}`}
              </span>
            )}
            {text}
          </div>
        ))}
      </div>
    );
  };

  // Extra left padding on every column after the leftmost so cell text never
  // hugs the continuous divider lines (which are an absolute overlay, below).
  const colPad: React.CSSProperties = { paddingLeft: 12 };

  // v2.41 — Overflow / expand affordances sit on TOP of the continuous divider
  // overlay, so they must carry a solid background (a fit-content pill) — else
  // the long note text reads as bleeding across the column dividers.
  const overflowNote = (text: string) => (
    <div
      className="px-1 pt-1 flex justify-center"
      style={{ position: 'relative', zIndex: 2, background: 'var(--bg)' }}
    >
      <span
        className="inline-block text-[10px]"
        style={{
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          padding: '2px 8px',
        }}
      >
        {text}
      </span>
    </div>
  );
  const sizeExpandToggle = () => (
    <div
      className="px-1 pt-1.5 flex justify-center"
      style={{ position: 'relative', zIndex: 2, background: 'var(--bg)' }}
    >
      <button
        type="button"
        onClick={() => setSizesExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold transition-colors"
        style={{
          color: 'var(--interactive)',
          background: 'var(--surface)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
          cursor: 'pointer',
        }}
        aria-expanded={sizesExpanded}
      >
        {sizesExpanded
          ? '▴ Show fewer'
          : `▾ Show more sizes (${rows.totalSizes} in scope)`}
      </button>
    </div>
  );
  const familyExpandToggle = (totalOverride?: number) => (
    <div
      className="px-1 pt-1.5 flex justify-center"
      style={{ position: 'relative', zIndex: 2, background: 'var(--bg)' }}
    >
      <button
        type="button"
        onClick={() => setFamiliesExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold transition-colors"
        style={{
          color: 'var(--interactive)',
          background: 'var(--surface)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
          cursor: 'pointer',
        }}
        aria-expanded={familiesExpanded}
      >
        {familiesExpanded
          ? '▴ Show fewer'
          : `▾ Show more families (${totalOverride ?? rows.totalFamilies} in scope)`}
      </button>
    </div>
  );

  const renderCell = (section: Section, row: Row, provider: Provider, colIdx: number) => {
    const cell = row.cells[provider];
    const divider = colPad; // every provider column sits right of a divider
    if (!cell) {
      return (
        <div
          key={provider}
          className="px-2 py-1.5 text-[11px]"
          style={{ color: 'var(--text-muted)', ...divider }}
        >
          —
        </div>
      );
    }
    const isBase = provider === base;
    const tone = PROVIDER_TONE[provider];

    // SETUP select mode — SIZE cells ADD their VM to the comparison (duplicates
    // allowed: the same analog can pair with several base rows, so a repeated VM
    // is fully shown + clickable, never blanked). Removal happens in the box.
    if (select) {
      const selectable = section === 'size';
      // Row-specific COUNT: how many times THIS base row's analog is picked —
      // not affected by other rows that share the same closest analog. Clicking
      // again increments (+2, +3…); remove in the comparison box below.
      const count = selectable
        ? select.pickedByProvider[provider].filter(
            (pk) => pk.value === cell.value && pk.row === row.baseValue,
          ).length
        : 0;
      const inList = count > 0;
      // Decrement: remove the LAST pick matching this (value,row) for this cloud.
      const removeOne = () => {
        const list = select.pickedByProvider[provider];
        let idx = -1;
        for (let k = 0; k < list.length; k++) {
          if (list[k].value === cell.value && list[k].row === row.baseValue) idx = k;
        }
        if (idx >= 0) select.onRemoveAt(provider, idx);
      };
      return (
        // v2.44 — the grid CELL carries the column gutter (colPad left + a hair
        // of right pad); the tinted/bordered selection box lives INSIDE with its
        // own small horizontal margin, so its rounded border keeps clear air on
        // BOTH sides and never bleeds across a column divider into the neighbor.
        <div key={provider} style={{ ...divider, paddingRight: 4, minWidth: 0 }}>
          <div
            role={selectable ? 'button' : undefined}
            onClick={selectable ? () => select.onAdd(provider, cell.value, row.baseValue) : undefined}
            title={`${cell.label} · ${cell.pct}% match${
              cell.crossCategory ? ' · different category (closest analog in the scoped set)' : ''
            }${
              selectable
                ? inList
                  ? ` · in the comparison ×${count} · click to add another · − to remove one`
                  : ' · click to add this row to the comparison'
                : ''
            }`}
            className="text-left px-2 py-1.5 flex items-start gap-x-2 transition-colors"
            style={{
              borderRadius: 'var(--radius-md)',
              cursor: selectable ? 'pointer' : 'default',
              background: inList ? `${tone}1F` : 'transparent',
              border: `1px solid ${inList ? `${tone}66` : 'transparent'}`,
              marginLeft: 2,
              marginRight: 2,
              minWidth: 0,
            }}
            aria-pressed={selectable ? inList : undefined}
          >
          <span className="flex flex-col gap-0.5 min-w-0 flex-1">
            {/* Line 1 — the #1 best match (the selectable primary). */}
            <span className="flex items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-wrap">
              {selectable &&
                (inList ? (
                  <span
                    className="inline-flex items-center justify-center text-[9px] font-semibold shrink-0"
                    style={{ width: 14, height: 14, borderRadius: 999, background: tone, color: '#04111A' }}
                    title={`in the comparison ×${count}`}
                  >
                    ✓
                  </span>
                ) : (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    ☐
                  </span>
                ))}
              {cell.stretch && (
                <span
                  className="text-[8.5px] font-semibold uppercase shrink-0 whitespace-nowrap"
                  style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}
                  title="The closest thing on this cloud — not a like-for-like swap."
                >
                  closest alt
                </span>
              )}
              <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
                {cell.label}
              </span>
              <MatchPct pct={cell.pct} muted={cell.stretch} />
              {cell.crossCategory && cell.analogCategory && <ViaTag category={cell.analogCategory} />}
              <CaveatChip caveats={cell.caveats} />
            </span>
            {/* Line 2 — greyed "suggested next best", wrapped BENEATH the #1 match
                and indented to align under its label. Informational only (the
                user picks one comparison line at a time, so they never light up). */}
            {cell.alts && cell.alts.length > 0 && (
              <span
                className="flex items-center gap-x-3 gap-y-0.5 flex-wrap min-w-0"
                style={{ paddingLeft: selectable ? 20 : 0 }}
              >
                {cell.alts.map((a, i) => (
                  <span
                    key={`${a.value}-${i}`}
                    className="inline-flex items-baseline gap-1 min-w-0"
                    style={{ opacity: 0.55 }}
                    title={`${a.label} · ${a.pct}% match · suggested next best`}
                  >
                    <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {a.label}
                    </span>
                    <MatchPct pct={a.pct} muted sub />
                  </span>
                ))}
              </span>
            )}
          </span>
          {/* Stepper — explicit −/+ so it's obvious a VM can be added more than
              once (it pairs with several base rows). Unselected shows a lone +;
              selected shows [− ×N +]. Stop propagation so the buttons don't also
              fire the cell's click-to-add. */}
          {selectable && (
            <span
              className="inline-flex items-center gap-1 shrink-0 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {inList && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOne();
                    }}
                    title={`Remove one ${cell.label}`}
                    aria-label={`Remove one ${cell.label}`}
                    className="inline-flex items-center justify-center text-[12px] leading-none transition-colors"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      color: 'var(--text-secondary)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span
                    className="text-[10px] font-semibold tabular-nums text-center"
                    style={{ color: 'var(--text-secondary)', minWidth: 16 }}
                    title={`in the comparison ×${count}`}
                  >
                    ×{count}
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select.onAdd(provider, cell.value, row.baseValue);
                }}
                title={inList ? `Add another ${cell.label}` : `Add ${cell.label} to the comparison`}
                aria-label={inList ? `Add another ${cell.label}` : `Add ${cell.label}`}
                className="inline-flex items-center justify-center text-[12px] leading-none transition-colors"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  color: inList ? tone : 'var(--text-secondary)',
                  background: 'var(--surface)',
                  border: `1px solid ${inList ? `${tone}66` : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </span>
          )}
          </div>
        </div>
      );
    }

    // RA mode — cell toggles a FilterChip.
    const interactive = true;
    const chip = chipForCell(section, cell, provider);
    const active = selectedKeys.has(chipKey(chip));
    return (
      // v2.44 — same inset technique as the select-mode cell: the grid CELL owns
      // the column gutter, the active-tinted box sits inside with a small margin
      // so its rounded border never crosses the divider into the next column.
      <div key={provider} style={{ ...divider, paddingRight: 4, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => toggleCell(section, cell, provider)}
          title={`${cell.label} · ${cell.pct}% match${
            cell.crossCategory ? ' · different category (closest analog in the scoped set)' : ''
          }${active ? ' · filtering' : ''}`}
          className="text-left px-2 py-1.5 flex items-center justify-between gap-1.5 transition-colors"
          style={{
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            background: active ? `${tone}1F` : 'transparent',
            border: `1px solid ${active ? `${tone}66` : 'transparent'}`,
            marginLeft: 2,
            marginRight: 2,
            minWidth: 0,
          }}
          onMouseEnter={(e) => {
            if (interactive && !active)
              e.currentTarget.style.background = 'var(--tint-soft, rgba(127,127,127,0.08))';
          }}
          onMouseLeave={(e) => {
            if (interactive && !active) e.currentTarget.style.background = 'transparent';
          }}
          aria-pressed={active}
        >
          <span className="flex items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-wrap">
            {cell.stretch && (
              <span
                className="text-[8.5px] font-semibold uppercase shrink-0 whitespace-nowrap"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}
                title="The closest thing on this cloud — not a like-for-like swap."
              >
                closest alt
              </span>
            )}
            <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
              {cell.label}
            </span>
            {cell.crossCategory && cell.analogCategory && <ViaTag category={cell.analogCategory} />}
            <CaveatChip caveats={cell.caveats} />
          </span>
          <MatchPct pct={cell.pct} muted={isBase || !!cell.stretch} />
        </button>
      </div>
    );
  };

  // The leftmost label cell. In explorer mode it carries the base identity
  // (highlighted in the base tone) and, for SIZE rows, is the selectable
  // "base comparison model" affordance.
  const renderLabel = (section: Section, row: Row) => {
    // In setup-select mode the base label IS the base cloud's SIZE cell — it's
    // single-select for the base provider (same as the other columns' cells).
    const selectable = !!select && section === 'size';
    const count = selectable
      ? select!.pickedByProvider[base].filter(
          (pk) => pk.value === row.baseValue && pk.row === row.baseValue,
        ).length
      : 0;
    const isSelected = count > 0;
    const baseTone = PROVIDER_TONE[base];
    const content = (
      <span className="flex items-center gap-1.5 min-w-0">
        {selectable &&
          (isSelected ? (
            <span
              className="inline-flex items-center justify-center text-[9px] font-semibold shrink-0 tabular-nums"
              style={{ width: 14, height: 14, borderRadius: 999, background: baseTone, color: '#04111A' }}
              title={`in the comparison ×${count}`}
            >
              {count > 1 ? `×${count}` : '✓'}
            </span>
          ) : (
            <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
              ☐
            </span>
          ))}
        <span
          className="text-[10.5px] font-medium truncate"
          style={{
            color: hideBaseColumn ? baseTone : 'var(--text-secondary)',
          }}
          title={row.baseLabel}
        >
          {row.baseLabel}
        </span>
      </span>
    );
    if (!selectable) {
      return (
        <div className="px-1" style={{ minWidth: 0 }}>
          {content}
        </div>
      );
    }
    const removeOneBase = () => {
      const list = select!.pickedByProvider[base];
      let idx = -1;
      for (let k = 0; k < list.length; k++) {
        if (list[k].value === row.baseValue && list[k].row === row.baseValue) idx = k;
      }
      if (idx >= 0) select!.onRemoveAt(base, idx);
    };
    return (
      <div
        role="button"
        onClick={() => select!.onAdd(base, row.baseValue, row.baseValue)}
        className="text-left px-1.5 py-1 transition-colors flex items-center justify-between gap-1.5"
        title={`${row.baseLabel}${
          isSelected ? ` · in the comparison ×${count} · click to add another · − to remove one` : ' · click to add to the comparison'
        }`}
        style={{
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          background: isSelected ? `${baseTone}1F` : 'transparent',
          border: `1px solid ${isSelected ? `${baseTone}55` : 'transparent'}`,
          minWidth: 0,
        }}
      >
        {content}
        {isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeOneBase();
            }}
            title={`Remove one ${row.baseLabel} from the comparison`}
            aria-label={`Remove one ${row.baseLabel}`}
            className="inline-flex items-center justify-center text-[11px] leading-none shrink-0 transition-colors"
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              color: 'var(--text-secondary)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            −
          </button>
        )}
      </div>
    );
  };

  const renderRows = (section: Section, list: Row[], overflow: number) => (
    <>
      {list.map((row) => (
        <div
          key={`${section}::${row.baseValue}`}
          className="grid items-center"
          style={{ gridTemplateColumns: gridCols, gap: 0 }}
        >
          {renderLabel(section, row)}
          {columnProviders.map((p, i) => renderCell(section, row, p, i))}
        </div>
      ))}
      {overflow > 0 && overflowNote(`+${overflow} more — narrow the filter`)}
    </>
  );

  // Ranked-family section (setup explorer): the base column holds the picked
  // base families; each OTHER cloud lists ALL its in-scope families ranked by
  // similarity — best match in row 0 (preserved next to the base), alternatives
  // below — so the user can pick a non-closest family if it suits them better.
  // A single ranked-family cell (the best match, or a demoted "next best" one).
  const rankedFamilyCell = (
    item: { family: string; pct: number } | undefined,
    isPrimary: boolean,
  ) => (
    <div
      className="px-2 py-1.5 flex items-center justify-between gap-1.5"
      style={{ ...colPad, opacity: item && !isPrimary ? 0.7 : 1 }}
    >
      {item ? (
        <>
          <span
            className="text-[11px] truncate"
            style={{ color: isPrimary ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            title={item.family}
          >
            {item.family}
          </span>
          <MatchPct pct={item.pct} />
        </>
      ) : isPrimary ? (
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          —
        </span>
      ) : null}
    </div>
  );

  // One cloud cell for a base family's ranked matches: the #1 match, then up to
  // 2 runner-up alternatives inline, each with its own %. The whole list is
  // PERSISTENT and SUBTLE by default — we don't pre-anoint a winner before the
  // user has chosen. Once the user TICKS a comparison family for this cloud it
  // lights up (colorized, full weight); the rest stay put, greyed. Picking a
  // family on one base row never collapses or rewrites another row.
  const rankedInlineCell = (
    list: { family: string; pct: number }[],
    picked: string[],
  ) => {
    if (!list || list.length === 0) {
      return (
        <div className="px-2 py-1.5" style={{ ...colPad, minWidth: 0 }}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            —
          </span>
        </div>
      );
    }
    const anyPicked = picked.length > 0;
    return (
      <div
        className="px-2 py-1.5 flex items-center gap-x-3 gap-y-0.5 flex-wrap"
        style={{ ...colPad, minWidth: 0 }}
      >
        {list.slice(0, 3).map((item, i) => {
          // `lit` = the user has ticked THIS family for THIS cloud → colorize.
          // Default (nothing ticked) and every non-picked sibling stay subtle.
          const lit = anyPicked && picked.includes(item.family);
          return (
            <span
              key={`${item.family}-${i}`}
              className="inline-flex items-baseline gap-1 min-w-0"
              style={{ opacity: lit ? 1 : i === 0 ? 0.7 : 0.55 }}
              title={`${item.family} · ${item.pct}% match${
                i === 0 ? ' · best match' : ' · suggested next best'
              }${lit ? ' · selected' : ''}`}
            >
              <span
                className={`${i === 0 ? 'text-[11px]' : 'text-[10px]'} truncate`}
                style={{
                  color: lit ? 'var(--text-primary)' : 'var(--text-secondary)',
                  // #1 keeps a slightly larger size for reading order, but is NOT
                  // bolded/colored until the user picks it — nothing is "won" by
                  // default (only a ticked family lights up).
                  fontWeight: lit ? 500 : 400,
                }}
              >
                {item.family}
              </span>
              <MatchPct pct={item.pct} muted={!lit} sub={i > 0} />
            </span>
          );
        })}
      </div>
    );
  };

  // Ranked VM-FAMILY section (setup explorer). EACH picked base family gets its
  // OWN row: its #1 closest family per cloud + up to 2 inline alternatives. The
  // alternatives are subtle and PERSIST (they don't collapse when the user picks
  // a comparison family). Falls back to the legacy single primary-row + "next
  // best" block when per-base data isn't available.
  const renderRankedFamilies = () => {
    const bases = baseFamilies ?? [];
    if (familyRankingPerBase && bases.length > 0) {
      // The unfiltered list (every in-scope base family) can be long, so cap it
      // and reuse the same expand toggle as the SIZE list. A handful of picked
      // base families always render in full (below the cap).
      const shownBases = familiesExpanded ? bases : bases.slice(0, FAMILY_BASE_ROW_CAP);
      const baseOverflow = bases.length - shownBases.length;
      return (
        <>
          {/* Once-only legend over the cloud columns — explains the inline order
              so we don't repeat "match"/"next best" on every entry. */}
          <div className="grid" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
            <div />
            <div className="pb-1" style={{ gridColumn: '2 / -1', ...colPad }}>
              <span
                className="text-[8.5px] tracking-[0.06em] font-semibold uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                best match, then suggested next best →
              </span>
            </div>
          </div>
          {shownBases.map((fam) => {
            const ranks = familyRankingPerBase[fam] ?? ({} as Record<Provider, { family: string; pct: number }[]>);
            return (
              <div
                key={`rf::${fam}`}
                className="grid items-center"
                style={{ gridTemplateColumns: gridCols, gap: 0 }}
              >
                <div className="px-1 flex items-center min-w-0" style={{ overflow: 'hidden' }}>
                  <span
                    className="text-[10.5px] font-medium truncate"
                    style={{ color: PROVIDER_TONE[base] }}
                    title={fam}
                  >
                    {fam}
                  </span>
                </div>
                {columnProviders.map((p) => (
                  <div key={p} style={{ minWidth: 0 }}>
                    {rankedInlineCell(ranks[p] ?? [], pickedColumnFamilies?.[p] ?? [])}
                  </div>
                ))}
              </div>
            );
          })}
          {(baseOverflow > 0 || (familiesExpanded && bases.length > FAMILY_BASE_ROW_CAP)) &&
            familyExpandToggle(bases.length)}
        </>
      );
    }

    // ── Legacy fallback (single ranking vs the first base family) ─────────────
    const rank = familyRanking!;
    const maxAlt = Math.max(0, ...columnProviders.map((p) => rank[p]?.length ?? 0));
    const hasNextBest = maxAlt > 1;
    const hasOverflow = columnProviders.some(
      (p) => (familyTotals?.[p] ?? 0) > (rank[p]?.length ?? 0),
    );
    return (
      <>
        <div className="grid items-center" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
          <div className="px-1 flex flex-col gap-0.5 min-w-0" style={{ overflow: 'hidden' }}>
            {bases.map((f, i) => (
              <span key={i} className="flex items-center min-w-0">
                <span
                  className="text-[10.5px] font-medium truncate"
                  style={{ color: PROVIDER_TONE[base] }}
                  title={f}
                >
                  {f}
                </span>
              </span>
            ))}
          </div>
          {columnProviders.map((p) => (
            <div key={p} style={{ minWidth: 0 }}>
              {rankedFamilyCell(rank[p]?.[0], true)}
            </div>
          ))}
        </div>
        {hasNextBest && (
          <>
            <div className="grid" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
              <div />
              <div className="pt-2 pb-0.5" style={{ gridColumn: '2 / -1', ...colPad }}>
                <span
                  className="text-[8.5px] tracking-[0.06em] font-semibold uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Suggested next best match
                </span>
              </div>
            </div>
            {Array.from({ length: maxAlt - 1 }).map((_, i) => {
              const r = i + 1;
              return (
                <div
                  key={`alt-${r}`}
                  className="grid items-center"
                  style={{ gridTemplateColumns: gridCols, gap: 0 }}
                >
                  <div className="px-1" />
                  {columnProviders.map((p) => (
                    <div key={p} style={{ minWidth: 0 }}>
                      {rankedFamilyCell(rank[p]?.[r], false)}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
        {hasOverflow && overflowNote('+ more families per cloud — narrow the filter')}
      </>
    );
  };

  // One other-cloud cell for a base-category row: the #1 ranked category match on
  // line 1, then the runner-ups WRAPPED onto a second line beneath it — the SAME
  // two-line layout the VM-SIZE cell uses. The whole list is SUBTLE by default
  // (we don't pre-anoint a winner); a category the user has PICKED for this cloud
  // (in the ② Category filter) lights up — the rest persist, greyed. Selecting a
  // category never removes the other recommendations (the ranking pool keeps a
  // cloud's full category list; the pick only highlights).
  const rankedInlineCategoryCell = (
    list: { category: string; pct: number }[],
    picked: string[],
  ) => {
    if (list.length === 0)
      return (
        <span className="px-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          —
        </span>
      );
    const anyPicked = picked.length > 0;
    const lit = (cat: string) => anyPicked && picked.includes(cat);
    const [first, ...alts] = list.slice(0, 3);
    const firstLit = lit(first.category);
    return (
      <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0" style={{ ...colPad }}>
        {/* Line 1 — best match (subtle until this category is picked). */}
        <span
          className="flex items-center gap-x-1.5 min-w-0"
          style={{ opacity: firstLit ? 1 : 0.7 }}
          title={`${first.category} · ${first.pct}% match · best match${
            firstLit ? ' · selected' : ''
          }`}
        >
          <span
            className="text-[11px] truncate"
            style={{
              color: firstLit ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: firstLit ? 500 : 400,
            }}
          >
            {first.category}
          </span>
          <MatchPct pct={first.pct} muted={!firstLit} />
        </span>
        {/* Line 2 — suggested next best, wrapped BENEATH the #1 match; a picked
            one still lights up. */}
        {alts.length > 0 && (
          <span className="flex items-center gap-x-3 gap-y-0.5 flex-wrap min-w-0">
            {alts.map((a, i) => {
              const altLit = lit(a.category);
              return (
                <span
                  key={`${a.category}-${i}`}
                  className="inline-flex items-baseline gap-1 min-w-0"
                  style={{ opacity: altLit ? 1 : 0.55 }}
                  title={`${a.category} · ${a.pct}% match · suggested next best${
                    altLit ? ' · selected' : ''
                  }`}
                >
                  <span
                    className="text-[10px] truncate"
                    style={{
                      color: altLit ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: altLit ? 500 : 400,
                    }}
                  >
                    {a.category}
                  </span>
                  <MatchPct pct={a.pct} muted={!altLit} sub />
                </span>
              );
            })}
          </span>
        )}
      </div>
    );
  };

  // Ranked-category section (setup explorer): one row PER picked base category.
  // The base column shows the base category; each other cloud lists its closest
  // category analog + inline runner-ups ranked by similarity — so multi-select
  // category reads exactly like multi-select VM family.
  const renderRankedCategories = () => {
    const perBase = categoryRankingPerBase!;
    const bases =
      baseCategories && baseCategories.length > 0 ? baseCategories : Object.keys(perBase);
    return (
      <>
        {/* Once-only legend — same wording as the VM-family section. */}
        <div className="grid" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
          <div />
          <div className="pb-1" style={{ gridColumn: '2 / -1', ...colPad }}>
            <span
              className="text-[8.5px] tracking-[0.06em] font-semibold uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              best match, then suggested next best →
            </span>
          </div>
        </div>
        {bases.map((cat) => {
          const ranks =
            perBase[cat] ?? ({} as Record<Provider, { category: string; pct: number }[]>);
          return (
            <div
              key={`cc::${cat}`}
              className="grid items-center"
              style={{ gridTemplateColumns: gridCols, gap: 0 }}
            >
              <div className="px-1 flex items-center min-w-0" style={{ overflow: 'hidden' }}>
                <span
                  className="text-[10.5px] font-medium truncate"
                  style={{ color: PROVIDER_TONE[base] }}
                  title={cat}
                >
                  {cat}
                </span>
              </div>
              {columnProviders.map((p) => (
                <div key={p} style={{ minWidth: 0 }}>
                  {rankedInlineCategoryCell(ranks[p] ?? [], pickedColumnCategories?.[p] ?? [])}
                </div>
              ))}
            </div>
          );
        })}
      </>
    );
  };

  const familyOverflow = Math.max(0, rows.totalFamilies - rows.families.length);
  const sizeOverflow = Math.max(0, rows.totalSizes - rows.sizes.length);

  // v2.44 — "how much is hidden" per section, for the collapse affordance.
  // Prefer the ranked/per-base counts when those modes drive the section,
  // else the plain row counts (totals so the number reflects the whole scope).
  const categoryHiddenCount = categoryRankingPerBase
    ? (baseCategories && baseCategories.length > 0
        ? baseCategories.length
        : Object.keys(categoryRankingPerBase).length)
    : rows.categories.length;
  const familyHiddenCount =
    familyRankingPerBase && (baseFamilies?.length ?? 0) > 0
      ? baseFamilies!.length
      : familyRanking
        ? (baseFamilies?.length ?? 0)
        : rows.totalFamilies || rows.families.length;
  const sizeHiddenCount = rows.totalSizes || rows.sizes.length;

  const hasAnyRows =
    rows.categories.length > 0 || rows.families.length > 0 || rows.sizes.length > 0;

  const table = (
    <div className="glass" style={{ padding: 14, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-0.5">
        Cross-cloud equivalents
      </div>
      <div className="text-[10px] text-text-muted mb-2">
        Closest match in each cloud vs the {base} base ·{' '}
        <span style={{ color: 'var(--text-secondary)' }}>every % is a similarity match</span>
        {select
          ? ' · tick a VM on any cloud to pick it — or leave all to compare'
          : ' · click a cell to filter'}
      </div>

      {!hasAnyRows && (
        <div className="text-[11px] text-text-muted px-1 py-2">
          No catalog rows in scope for the {base} base — adjust the cloud selection or filter.
        </div>
      )}

      {hasAnyRows && (
        <div className="space-y-1" style={{ position: 'relative' }}>
          {/* Continuous full-height divider lines — one clean line per cloud-
              column boundary, overlaid so each provider is its own lane. */}
          {Array.from({ length: columnProviders.length }).map((_, k) => (
            <div
              key={`div-${k}`}
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `calc((${k} + 1) * 100% / ${colCount})`,
                width: 1,
                background: 'var(--border)',
                pointerEvents: 'none',
              }}
            />
          ))}
          {/* Header — base label cell + the rendered comparison columns. Cloud
              names are CENTERED in their column; the data rows below are left-
              aligned. */}
          <div className="grid items-center" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
            <div className="px-1 text-center">
              {hideBaseColumn && (
                <span
                  className="text-[13px] font-bold"
                  style={{ color: PROVIDER_TONE[base], letterSpacing: '0.01em' }}
                >
                  {base}
                  <span
                    className="text-[9px] font-medium ml-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    · base
                  </span>
                </span>
              )}
            </div>
            {columnProviders.map((p) => {
              const isBase = p === base;
              return (
                <div
                  key={p}
                  className="text-[13px] font-bold py-1 text-center"
                  style={{
                    color: isBase ? 'var(--interactive)' : PROVIDER_TONE[p],
                    letterSpacing: '0.01em',
                    ...colPad,
                  }}
                >
                  {p}
                  {isBase && (
                    <span className="text-[9px] font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
                      · base
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {categoryRankingPerBase ? (
            <>
              {sectionLabel('category', 'Category', categoryHiddenCount)}
              {sectionOpen.category && renderRankedCategories()}
            </>
          ) : (
            rows.categories.length > 0 && (
              <>
                {sectionLabel('category', 'Category', categoryHiddenCount)}
                {sectionOpen.category && renderRows('category', rows.categories, 0)}
              </>
            )
          )}
          {familyRanking || familyRankingPerBase ? (
            <>
              {sectionLabel('family', 'VM Family', familyHiddenCount)}
              {sectionOpen.family && renderRankedFamilies()}
            </>
          ) : (
            rows.families.length > 0 && (
              <>
                {sectionLabel('family', 'VM Family', familyHiddenCount)}
                {sectionOpen.family && (
                  <>
                    {/* Expandable like VM Size: when expanded the fuller list lives
                        in its own scroll lane so it never blows up the page. */}
                    <div
                      className="space-y-1"
                      style={
                        familiesExpanded
                          ? { maxHeight: 320, overflowY: 'auto', overflowX: 'hidden' }
                          : undefined
                      }
                    >
                      {renderRows('family', rows.families, 0)}
                    </div>
                    {(familyOverflow > 0 || familiesExpanded) && familyExpandToggle()}
                    {familiesExpanded &&
                      familyOverflow > 0 &&
                      overflowNote(`+${familyOverflow} more — narrow the filter to reach them`)}
                  </>
                )}
              </>
            )
          )}
          {!hideSizes && rows.sizes.length > 0 && (
            <>
              {sectionLabel('size', 'VM Size', sizeHiddenCount)}
              {sectionOpen.size && (
                <>
                  {/* v2.41 — when expanded, the full size list lives in its own
                      scroll lane so it never blows up the page; the divider overlay
                      above keeps the columns aligned as rows scroll under it. */}
                  <div
                    className="space-y-1"
                    style={
                      sizesExpanded
                        ? { maxHeight: 320, overflowY: 'auto', overflowX: 'hidden' }
                        : undefined
                    }
                  >
                    {renderRows('size', rows.sizes, 0)}
                  </div>
                  {(sizeOverflow > 0 || sizesExpanded) && sizeExpandToggle()}
                  {sizesExpanded &&
                    sizeOverflow > 0 &&
                    overflowNote(`+${sizeOverflow} more — narrow the filter to reach them`)}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  // The comparison box — selected VMs relocate here, zipped by pick-order into
  // numbered rows (one VM per cloud per row) with a per-row ≈% vs the base VM.
  const comparisonBox =
    select && !hideComparisonBox ? (
      <ComparisonBox
        select={select}
        base={base}
        columnProviders={columnProviders}
        gridCols={gridCols}
        colPad={colPad}
        userVms={userVms}
      />
    ) : null;

  if (!showInsights)
    return (
      <>
        {table}
        {comparisonBox}
      </>
    );

  // v2.44 — the right-hand pane is now ALERTS-ONLY: it appears solely when a
  // materially better analog is hidden by the current filter, otherwise the
  // equivalents table gets the full width. (Replaces the always-on most-similar
  // insights, which just restated the table's per-cloud %s.)
  const hasAlerts = showInsights && !!betterMatchAlerts && betterMatchAlerts.length > 0;
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch">
      <div className="flex-1 min-w-0 space-y-3">
        {table}
        {comparisonBox}
      </div>
      {hasAlerts && (
        <AlertsCard
          alerts={betterMatchAlerts!}
          onReveal={onAddCategory}
          onOpenFaq={onOpenFaq}
        />
      )}
    </div>
  );
}

// ── Alerts pane ──────────────────────────────────────────────────────────────
// Shows ONLY when the current filter hides a much better analog (e.g. a memory
// base size vs a GCP `m3` filter, while `n2-highmem` in General Purpose is the
// real 100% match). Each alert names the hidden winner + a one-click reveal that
// widens the filter (adds the winner's category, which clears the family filter
// that was hiding it) so it appears in the table.
function AlertsCard({
  alerts,
  onReveal,
  onOpenFaq,
}: {
  alerts: import('../utils/crossCloudEquivalency').BetterMatchAlert[];
  onReveal?: (provider: Provider, category: string) => void;
  onOpenFaq?: (section?: string) => void;
}) {
  return (
    // The aside stretches to the table's height (parent is items-stretch); the
    // inner card is position:sticky so the "better matches" warning FOLLOWS the
    // scroll and stays visible even when the user has scrolled far down the long
    // equivalents table. top offset clears the page's sticky header band.
    <aside className="w-full lg:w-72 shrink-0">
      <div
        className="glass"
        style={{
          position: 'sticky',
          top: 16,
          padding: 13,
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          background: 'rgba(251, 191, 36, 0.05)',
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ fontSize: 12 }}>⚠</span>
          <span
            className="text-[10px] tracking-[0.05em] font-semibold uppercase"
            style={{ color: '#FBBF24' }}
          >
            Better matches outside your filter
          </span>
        </div>
        <div className="text-[10px] text-text-muted mb-2.5 leading-relaxed">
          Your filter hides a closer analog on {alerts.length === 1 ? 'a cloud' : 'some clouds'}.
        </div>
        <div className="space-y-2.5">
          {alerts.map((a, i) => (
            <div
              key={`${a.cloud}-${a.baseSize}-${a.betterSize}-${i}`}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                paddingTop: i === 0 ? 0 : 10,
              }}
            >
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: PROVIDER_TONE[a.cloud], letterSpacing: '0.01em' }}
                >
                  {a.cloud}
                </span>
                <span className="text-[10px] text-text-muted">vs {a.baseSize}</span>
              </div>
              <div className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {a.betterSize}
                </span>{' '}
                <span className="font-semibold tabular-nums" style={{ color: pctTone(a.betterPct) }}>
                  {a.betterPct}%
                </span>{' '}
                is a far closer match — but it's in{' '}
                <span style={{ color: 'var(--text-primary)' }}>{a.betterCategory}</span> ·{' '}
                {a.betterFamily}, which your filter excludes (best shown:{' '}
                <span className="tabular-nums">{a.shownPct}%</span>).
              </div>
              {onReveal && (
                <button
                  type="button"
                  onClick={() => onReveal(a.cloud, a.betterCategory)}
                  className="mt-1.5 text-[10.5px] font-semibold"
                  style={{ color: 'var(--interactive)' }}
                  title={`Add ${a.betterCategory} to ${a.cloud} so ${a.betterSize} shows in the table`}
                >
                  Show {a.betterCategory} on {a.cloud} →
                </button>
              )}
            </div>
          ))}
        </div>
        {onOpenFaq && (
          <button
            type="button"
            onClick={() => onOpenFaq('similarity')}
            className="mt-2.5 text-[10px] font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            How matching works →
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Comparison box ───────────────────────────────────────────────────────────
// Selected VMs relocate here. Each cloud's picks form an ordered column; row N
// pairs the Nth pick from every cloud. A row carries a ≈% similarity of each
// other cloud's VM to the row's base-cloud VM. Drag a VM within its column to
// re-pair it; drag it out (or hit ✕ / untick above) to remove it.
function ComparisonBox({
  select,
  base,
  columnProviders,
  gridCols,
  colPad,
  userVms,
}: {
  select: SelectMode;
  base: Provider;
  columnProviders: Provider[];
  gridCols: string;
  colPad: React.CSSProperties;
  userVms: CatalogEntry[];
}) {
  const [drag, setDrag] = useState<{ provider: Provider; index: number } | null>(null);
  const picks = select.pickedByProvider;
  const clouds: Provider[] = [base, ...columnProviders.filter((p) => p !== base)];
  const maxRows = Math.max(0, ...clouds.map((p) => picks[p]?.length ?? 0));
  if (maxRows === 0) return null;

  const lookup = new Map<string, CatalogEntry>();
  for (const v of userVms) lookup.set(`${v.provider}|${v.vmSizeName}`, v);
  const matchInfo = (
    rowBaseName: string | undefined,
    p: Provider,
    name: string,
  ): { pct: number; why: string; caveat: MatchCaveat | null } | null => {
    if (!rowBaseName || p === base) return null;
    const a = lookup.get(`${base}|${rowBaseName}`);
    const b = lookup.get(`${p}|${name}`);
    if (!a || !b) return null;
    const fa = vmFeatures(a);
    const fb = vmFeatures(b);
    const distance = vmDistance(fa, fb);
    // Insights line — the single worst comparability caveat for this pair, so a
    // ≈% never reads apples-to-apples when the KIND of machine differs.
    const caveat = worstCaveat(matchCaveats(a, b, { distance }));
    return { pct: matchPct(distance), why: describeMatch(fa, fb), caveat };
  };

  const handleDrop = (provider: Provider, toIndex: number) => {
    if (!drag || drag.provider !== provider) {
      setDrag(null);
      return;
    }
    select.onReorder(provider, drag.index, toIndex);
    setDrag(null);
  };

  const cell = (p: Provider, r: number, isBaseCol: boolean) => {
    const name = picks[p]?.[r]?.value;
    const tone = PROVIDER_TONE[p];
    const dropProps = {
      onDragOver: (e: React.DragEvent) => {
        if (drag?.provider === p) e.preventDefault();
      },
      onDrop: () => handleDrop(p, r),
    };
    if (!name) {
      return (
        <div
          key={p}
          {...dropProps}
          className="px-2 py-1.5 text-[11px]"
          style={{ ...(isBaseCol ? {} : colPad), color: 'var(--text-muted)' }}
        >
          —
        </div>
      );
    }
    const info = isBaseCol ? null : matchInfo(picks[base]?.[r]?.value, p, name);
    return (
      <div
        key={p}
        draggable
        onDragStart={() => setDrag({ provider: p, index: r })}
        onDragEnd={(e) => {
          if (e.dataTransfer.dropEffect === 'none') select.onRemoveAt(p, r);
          setDrag(null);
        }}
        {...dropProps}
        title="Drag to re-pair · drag out or ✕ to remove"
        className="px-2 py-1 flex items-center justify-between gap-1.5"
        style={{
          ...(isBaseCol ? {} : colPad),
          cursor: 'grab',
          borderRadius: 'var(--radius-md)',
          background: `${tone}14`,
          border: `1px solid ${tone}40`,
        }}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {isBaseCol && (
            <span
              className="inline-flex items-center justify-center text-[9px] font-semibold shrink-0"
              style={{ width: 15, height: 15, borderRadius: 999, background: tone, color: '#04111A' }}
            >
              {r + 1}
            </span>
          )}
          <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }} title={name}>
            {name}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {info?.caveat && (
            <span
              className="text-[8.5px] font-medium whitespace-nowrap"
              style={{ color: info.caveat.severity === 'warn' ? '#FBBF24' : 'var(--text-muted)' }}
              title={info.caveat.detail}
            >
              {info.caveat.severity === 'warn' ? '⚠ ' : ''}{info.caveat.label}
            </span>
          )}
          {info != null && (
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{ color: pctTone(info.pct), cursor: 'help' }}
              title={info.why}
            >
              ≈{info.pct}%
            </span>
          )}
          <button
            type="button"
            onClick={() => select.onRemoveAt(p, r)}
            title="Remove from comparison"
            aria-label="Remove"
            className="leading-none opacity-60 hover:opacity-100 text-[11px]"
            style={{ color: tone }}
          >
            ✕
          </button>
        </span>
      </div>
    );
  };

  return (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-0.5">
        Comparison
      </div>
      <div className="text-[10px] text-text-muted mb-2">
        Each row pairs the Nth pick from every cloud · ≈% is vs the {base} VM in that row ·
        drag a VM to re-pair, drag out or ✕ to remove
      </div>
      <div className="space-y-1">
        {Array.from({ length: maxRows }).map((_, r) => (
          <div key={r} className="grid items-center" style={{ gridTemplateColumns: gridCols, gap: 0 }}>
            {cell(base, r, true)}
            {columnProviders.map((p) => cell(p, r, false))}
          </div>
        ))}
      </div>
    </div>
  );
}

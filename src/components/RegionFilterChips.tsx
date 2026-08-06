/**
 * RegionFilterChips — one unified, searchable, multi-select chip box for the
 * Region Availability page filter. Replaces the old 9-dropdown (Category / VM
 * Family / VM Size × Azure / AWS / GCP) base-cloud "+% match" apparatus with a
 * single input that emits chips at ANY granularity:
 *
 *   - Category — canonical, cross-cloud (no provider). `categorize(provider, family)`.
 *   - VM Family — per-cloud (`vmFamily(v)`), labeled "Azure · M".
 *   - VM Size — per-cloud (`v.vmSizeName`), labeled "AWS · m7i.4xlarge".
 *
 * The consuming page narrows its catalog with these chips: within a kind it's
 * OR; across kinds it's AND (see RegionAvailabilityPage `filteredVms`).
 *
 * The OPTION universe narrows progressively (v2.29.x):
 *   - Picking a Category chip limits the Family + Size suggestions to that
 *     category. Picking a Family chip limits the Size suggestions to that family.
 *   - VM Sizes surface directly (no typing) once the list is already narrowed —
 *     i.e. ≥1 category or ≥1 family chip is selected, OR a `baseProvider` is set.
 *     In the broad, un-narrowed case (thousands of sizes) the ≥2-char type-ahead
 *     still gates them.
 *   - `baseProvider` (optional) scopes the Family + Size options to that ONE
 *     "base cloud of comparison"; Category options stay cross-cloud. Undefined =
 *     all selected providers (the original behaviour).
 */
import { useMemo, useRef, useState } from 'react';
import type { UserVm } from '../types';
import { vmFamily } from '../utils/vmTaxonomy';
import { categorize } from '../utils/vmCategory';

type Provider = 'Azure' | 'AWS' | 'GCP';

export type FilterChip =
  | { kind: 'category'; value: string } // canonical, cross-cloud (no provider)
  | { kind: 'family'; value: string; provider: Provider }
  | { kind: 'size'; value: string; provider: Provider };

interface Props {
  providers: Provider[];
  catalog: UserVm[];
  chips: FilterChip[];
  onChange: (next: FilterChip[]) => void;
  /**
   * Optional "base cloud of comparison". When set, the Family + Size option
   * lists are scoped to THIS provider only (so the page can disambiguate
   * "is this family Azure or AWS?"). Category options stay cross-cloud.
   * When undefined, options span all selected `providers` (original behaviour).
   */
  baseProvider?: Provider;
}

const PROVIDER_TONE: Record<Provider, string> = {
  Azure: '#60A5FA',
  AWS: '#FBBF24',
  GCP: '#FCA5A5',
};
const CATEGORY_TONE = '#A78BFA';

const SIZE_TYPE_MIN_QUERY = 2; // sizes only surface (broad case) once the user types ≥2 chars
const SIZE_CAP = 40; // rendered size options cap

function chipKey(c: FilterChip): string {
  return c.kind === 'category' ? `category::${c.value}` : `${c.kind}::${c.provider}::${c.value}`;
}

type Option = {
  chip: FilterChip;
  label: string; // primary text (the value)
  prefix?: string; // e.g. "Azure · "
  key: string;
  sortNum?: number; // numeric sort hint (vCPU for sizes), when available
};

export function RegionFilterChips({ providers, catalog, chips, onChange, baseProvider }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedKeys = useMemo(() => new Set(chips.map(chipKey)), [chips]);
  const providerSet = useMemo(() => new Set(providers), [providers]);

  // Selected chips broken out by kind — these drive the progressive narrowing.
  const selectedCats = useMemo(
    () => new Set(chips.filter((c) => c.kind === 'category').map((c) => c.value)),
    [chips],
  );
  // Family chips, keyed `${provider}::${value}` so the per-cloud family scopes
  // the size list to the matching provider's rows only.
  const selectedFamKeys = useMemo(
    () =>
      new Set(
        chips
          .filter((c): c is Extract<FilterChip, { kind: 'family' }> => c.kind === 'family')
          .map((c) => `${c.provider}::${c.value}`),
      ),
    [chips],
  );

  // The "category cell" of a catalog row (cached fallback to categorize()).
  const catOf = (v: UserVm): string => v.category ?? categorize(v.provider, v.family);

  // Build the option universe, deduped per kind, progressively narrowed.
  //
  //   - Category options: every category present in the selected-provider pool
  //     (always cross-cloud, never scoped by baseProvider — categories ARE the
  //     canonical cross-cloud axis).
  //   - Family options: families whose category ∈ selected categories (if any
  //     category chip is set), scoped to baseProvider when set.
  //   - Size options: sizes whose category ∈ selected categories AND (if any
  //     family chip is set) whose (provider, family) matches a selected family,
  //     scoped to baseProvider when set.
  const { categoryOpts, familyOpts, sizeOpts } = useMemo(() => {
    const cats = new Map<string, Option>();
    const fams = new Map<string, Option>();
    const sizes = new Map<string, Option>();
    const hasCatChips = selectedCats.size > 0;
    const hasFamChips = selectedFamKeys.size > 0;

    for (const v of catalog) {
      const p = v.provider as Provider;
      if (!providerSet.has(p)) continue;
      const cat = catOf(v);

      // Category — canonical, cross-cloud (collapse across providers). NOT
      // scoped by baseProvider — categories stay cross-cloud by design.
      if (cat) {
        const chip: FilterChip = { kind: 'category', value: cat };
        const key = chipKey(chip);
        if (!cats.has(key)) cats.set(key, { chip, label: cat, key });
      }

      // Family/Size are per-cloud — scope to baseProvider when set.
      const inBaseScope = !baseProvider || p === baseProvider;
      if (!inBaseScope) continue;

      // Family — limited to selected categories (if any category chip set).
      if (!hasCatChips || (cat && selectedCats.has(cat))) {
        const fam = vmFamily(v);
        if (fam) {
          const chip: FilterChip = { kind: 'family', value: fam, provider: p };
          const key = chipKey(chip);
          if (!fams.has(key)) fams.set(key, { chip, label: fam, prefix: `${p} · `, key });
        }
      }

      // Size — limited to selected categories AND (if any family chip set) to a
      // selected (provider, family).
      if (v.vmSizeName) {
        const catOk = !hasCatChips || (cat && selectedCats.has(cat));
        const famOk = !hasFamChips || selectedFamKeys.has(`${p}::${vmFamily(v)}`);
        if (catOk && famOk) {
          const chip: FilterChip = { kind: 'size', value: v.vmSizeName, provider: p };
          const key = chipKey(chip);
          if (!sizes.has(key))
            sizes.set(key, {
              chip,
              label: v.vmSizeName,
              prefix: `${p} · `,
              key,
              sortNum: typeof v.vcpus === 'number' && v.vcpus > 0 ? v.vcpus : undefined,
            });
        }
      }
    }

    const sortByLabel = (a: Option, b: Option) =>
      (a.prefix ?? '').localeCompare(b.prefix ?? '') ||
      a.label.localeCompare(b.label, undefined, { numeric: true });
    // Sizes sort: provider, then by vCPU (numeric) when known, else natural label.
    const sortBySpec = (a: Option, b: Option) => {
      const pfx = (a.prefix ?? '').localeCompare(b.prefix ?? '');
      if (pfx !== 0) return pfx;
      if (a.sortNum != null && b.sortNum != null && a.sortNum !== b.sortNum)
        return a.sortNum - b.sortNum;
      if (a.sortNum != null && b.sortNum == null) return -1;
      if (a.sortNum == null && b.sortNum != null) return 1;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    };
    return {
      categoryOpts: [...cats.values()].sort(sortByLabel),
      familyOpts: [...fams.values()].sort(sortByLabel),
      sizeOpts: [...sizes.values()].sort(sortBySpec),
    };
  }, [catalog, providerSet, baseProvider, selectedCats, selectedFamKeys]);

  const q = query.trim().toLowerCase();
  const matches = (o: Option) =>
    !selectedKeys.has(o.key) && (q === '' || `${o.prefix ?? ''}${o.label}`.toLowerCase().includes(q));

  const shownCategories = useMemo(() => categoryOpts.filter(matches), [categoryOpts, q, selectedKeys]);
  const shownFamilies = useMemo(() => familyOpts.filter(matches), [familyOpts, q, selectedKeys]);

  // Sizes surface DIRECTLY (no typing) once the options are already narrowed:
  // ≥1 category chip OR ≥1 family chip selected, OR a baseProvider is set. In
  // the broad, un-narrowed case (thousands of sizes) the ≥2-char type-ahead
  // still gates them.
  const sizesNarrowed =
    selectedCats.size > 0 || selectedFamKeys.size > 0 || baseProvider !== undefined;
  const sizesUnlocked = sizesNarrowed || q.length >= SIZE_TYPE_MIN_QUERY;
  const shownSizesAll = useMemo(
    () => (sizesUnlocked ? sizeOpts.filter(matches) : []),
    [sizeOpts, q, selectedKeys, sizesUnlocked],
  );
  const shownSizes = shownSizesAll.slice(0, SIZE_CAP);
  const sizeOverflow = shownSizesAll.length - shownSizes.length;

  const add = (chip: FilterChip) => {
    onChange([...chips, chip]);
    setQuery('');
    inputRef.current?.focus();
  };
  const remove = (key: string) => onChange(chips.filter((c) => chipKey(c) !== key));

  const open = focused;
  const hasAnyOption =
    shownCategories.length > 0 || shownFamilies.length > 0 || shownSizes.length > 0;

  const groupHeader = (text: string) => (
    <div
      className="text-[9px] tracking-[0.06em] font-semibold uppercase px-2 pt-2 pb-1"
      style={{ color: 'var(--text-muted)' }}
    >
      {text}
    </div>
  );

  const optionRow = (o: Option, tone: string) => (
    <button
      key={o.key}
      type="button"
      // Use onMouseDown so the click registers before the input blur closes the panel.
      onMouseDown={(e) => {
        e.preventDefault();
        add(o.chip);
      }}
      className="w-full text-left px-2 py-1.5 flex items-center gap-2 transition-colors"
      style={{ borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tint-soft, rgba(127,127,127,0.08))')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone, flexShrink: 0 }} />
      <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
        {o.prefix && <span style={{ color: 'var(--text-muted)' }}>{o.prefix}</span>}
        {o.label}
      </span>
    </button>
  );

  return (
    <div
      className="glass"
      style={{ padding: 14, borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary">
          Filter by category, family, or size
          <span className="text-text-muted normal-case tracking-normal ml-1">
            · multi-select · any granularity · within a kind = OR, across kinds = AND
          </span>
        </div>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-semibold transition-colors"
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--interactive)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {chips.map((c) => {
            const tone = c.kind === 'category' ? CATEGORY_TONE : PROVIDER_TONE[c.provider];
            const prefix =
              c.kind === 'category' ? 'Category · ' : `${c.provider} · `;
            const key = chipKey(c);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10.5px]"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: `${tone}1A`,
                  border: `1px solid ${tone}55`,
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{prefix}</span>
                <span className="font-medium">{c.value}</span>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  aria-label={`Remove ${c.value}`}
                  className="leading-none"
                  style={{ color: tone, cursor: 'pointer', fontSize: 12 }}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Filter by category, family, or size…"
        className="w-full text-[12px] px-3 py-2"
        style={{
          background: 'var(--surface, rgba(127,127,127,0.06))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />

      {/* Options panel */}
      {open && (
        <div
          className="mt-1.5"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg)',
            maxHeight: 320,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {!hasAnyOption && (
            <div className="text-[11px] text-text-muted px-2 py-3">
              {q === ''
                ? 'Type to search categories, families, or sizes…'
                : `No matches for “${query}”.`}
            </div>
          )}
          {shownCategories.length > 0 && (
            <>
              {groupHeader('Category')}
              {shownCategories.map((o) => optionRow(o, CATEGORY_TONE))}
            </>
          )}
          {shownFamilies.length > 0 && (
            <>
              {groupHeader('VM Family')}
              {shownFamilies.map((o) =>
                optionRow(o, PROVIDER_TONE[(o.chip as { provider: Provider }).provider]),
              )}
            </>
          )}
          {(shownSizes.length > 0 || (!sizesUnlocked && q !== '')) && (
            <>
              {groupHeader('VM Size')}
              {!sizesUnlocked ? (
                <div className="text-[10px] text-text-muted px-2 py-1.5">
                  Pick a category or family above to list sizes — or type at least{' '}
                  {SIZE_TYPE_MIN_QUERY} characters to search them.
                </div>
              ) : (
                <>
                  {shownSizes.map((o) =>
                    optionRow(o, PROVIDER_TONE[(o.chip as { provider: Provider }).provider]),
                  )}
                  {sizeOverflow > 0 && (
                    <div className="text-[10px] text-text-muted px-2 py-1.5">
                      +{sizeOverflow} more — keep typing to narrow.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

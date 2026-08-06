/**
 * RegionMultiSelect (v2.38) — a compact, reusable region filter.
 *
 * Multi-select with an explicit "All regions" state (an EMPTY selection set =
 * all, so pages don't have to enumerate). Selected regions render as removable
 * chips; "+ Add region" is a searchable dropdown over the remaining regions.
 * Used by the pages that benefit from region scoping (Pricing / Recommendation
 * and the Region views) — NOT in the comparison setup.
 */
import { useState } from 'react';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';

interface Props {
  /** All selectable regions (already de-duped + ordered by the caller). */
  regions: string[];
  /** Current selection. EMPTY = all regions. */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Accent tone for chips (provider tone), defaults to the interactive accent. */
  tone?: string;
  /** Optional label shown before the control. */
  label?: string;
  /** Optional hint appended after the label. */
  hint?: string;
  /** Drop the outer glass card + label (for embedding inside a step card). */
  bare?: boolean;
}

export function RegionMultiSelect({
  regions,
  selected,
  onChange,
  tone = 'var(--interactive)',
  label = 'Regions',
  hint,
  bare = false,
}: Props) {
  const [adding, setAdding] = useState(false);
  const all = selected.size === 0;
  const remaining: DropdownOption[] = regions
    .filter((r) => !selected.has(r))
    .map((r) => ({ value: r, label: r }));

  const add = (r: string) => {
    if (!r) return;
    const next = new Set(selected);
    next.add(r);
    onChange(next);
    setAdding(false);
  };
  const remove = (r: string) => {
    const next = new Set(selected);
    next.delete(r);
    onChange(next);
  };

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {/* All-regions pill. */}
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
          style={{
            borderRadius: 'var(--radius-pill)',
            background: all ? `${tone}1F` : 'transparent',
            border: `1px solid ${all ? tone : 'var(--border)'}`,
            color: all ? tone : 'var(--text-muted)',
          }}
          aria-pressed={all}
          title="Show every region"
        >
          {all ? '✓ ' : ''}All regions
        </button>

        {/* Selected region chips. */}
        {[...selected].map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-x-1.5 px-2 py-1 text-[10px] font-medium"
            style={{
              background: `${tone}14`,
              border: `1px solid ${tone}55`,
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)',
            }}
          >
            {r}
            <button
              type="button"
              onClick={() => remove(r)}
              className="leading-none opacity-70 hover:opacity-100"
              style={{ color: tone }}
              aria-label={`Remove ${r}`}
              title={`Remove ${r}`}
            >
              ✕
            </button>
          </span>
        ))}

        {/* Add control. */}
        {remaining.length > 0 &&
          (adding ? (
            <div style={{ minWidth: 200 }}>
              <GlassDropdown
                value=""
                options={remaining}
                onChange={add}
                placeholder="Search a region…"
                searchable
                visibleRows={7}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="px-2.5 py-1 text-[10px] transition-colors"
              style={{
                borderRadius: 'var(--radius-pill)',
                border: '1px dashed var(--border)',
                color: 'var(--text-secondary)',
              }}
              title="Add a region to the filter"
            >
              + Add region
            </button>
          ))}
      </div>
    </>
  );

  if (bare) return body;

  return (
    <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-md)' }}>
      <div className="text-[9px] tracking-[0.04em] font-semibold text-text-secondary mb-1.5">
        {label}
        <span className="text-text-muted normal-case tracking-normal ml-1">
          · multi-select{hint ? ` · ${hint}` : ''}
        </span>
      </div>
      {body}
    </div>
  );
}

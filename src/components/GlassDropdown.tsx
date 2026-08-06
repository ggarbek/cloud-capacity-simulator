/**
 * Apple Liquid Glass-style dropdown — INLINE popover.
 * Trigger looks like a glass pill. Click opens an inline panel directly below
 * (pushes subsequent content down). Scrollable list with ~5 items visible.
 * No absolute positioning — avoids the popover being clipped by overflow parents.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  meta?: string;
  group?: string;
  /** v2.16 — Optional parent grouping above `group`. Renders as a bigger
   *  section heading (e.g. "MM" / "HM" / "VHM") with `group` ("Mv1" /
   *  "Mv2" / "Mv3") as sub-headings nested inside. */
  section?: string;
  /** v2.16 — Optional leading decorations (colored dots, etc.) to render
   *  before the label. Free-form node; use `<span>` with inline styles. */
  prefix?: React.ReactNode;
  disabled?: boolean;
}

interface Props {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  emptyValue?: string;
  emptyLabel?: string;
  visibleRows?: number;
}

// v2.17.14 — Row height bumped from 36 → 44 so each option can stack a
// full SKU label on top of its spec meta line. SKUs like
// `Standard_M416s_6_v3` no longer truncate at narrow column widths.
const ROW_H = 44;

export function GlassDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchable = false,
  emptyValue,
  emptyLabel,
  visibleRows = 5,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on Escape only (clicking outside the panel would normally close,
  // but since we render inline we let the user collapse via the trigger).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) {
      setQuery('');
      setHighlight(0);
    }
  }, [open, searchable]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const finalOptions: DropdownOption[] = useMemo(() => {
    if (emptyValue !== undefined) {
      return [{ value: emptyValue, label: emptyLabel ?? 'None' }, ...filtered];
    }
    return filtered;
  }, [filtered, emptyValue, emptyLabel]);

  const flat = useMemo(() => {
    const items: Array<
      | { type: 'header'; group: string }
      | { type: 'section'; section: string }
      | { type: 'option'; option: DropdownOption; idx: number }
    > = [];
    let optionIdx = 0;
    let lastGroup: string | undefined;
    let lastSection: string | undefined;
    for (const o of finalOptions) {
      if (o.section && o.section !== lastSection) {
        items.push({ type: 'section', section: o.section });
        lastSection = o.section;
        // Reset group whenever section changes so "Mv1" header re-emits
        // under each MM / HM / VHM section even though the label repeats.
        lastGroup = undefined;
      }
      if (o.group && o.group !== lastGroup) {
        items.push({ type: 'header', group: o.group });
        lastGroup = o.group;
      }
      items.push({ type: 'option', option: o, idx: optionIdx++ });
    }
    return items;
  }, [finalOptions]);

  useEffect(() => {
    const max = finalOptions.length - 1;
    if (highlight > max) setHighlight(Math.max(0, max));
  }, [finalOptions.length, highlight]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-opt="${highlight}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const selected = options.find((o) => o.value === value);
  const triggerLabel =
    selected?.label
    ?? (value === emptyValue ? emptyLabel : undefined)
    ?? placeholder;
  const listMaxH = visibleRows * ROW_H;

  const pick = (idx: number) => {
    const o = finalOptions[idx];
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
    // v2.19.32 — Blur any focused element inside the dropdown panel so the
    // search input doesn't keep visual focus residue after the panel
    // unmounts, and so the close behavior is unambiguous to the user.
    if (
      document.activeElement instanceof HTMLElement &&
      wrapRef.current?.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
  };

  // v2.19.32 — Defensive close. If the parent's `value` prop changes while
  // the dropdown is open (which only happens after a user selection or an
  // external programmatic change), force close. This protects against any
  // race where the open state isn't cleared by `pick()` due to re-renders
  // or batched state ordering — the user-visible invariant becomes
  // "value change → dropdown closed."
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      if (open) setOpen(false);
    }
  }, [value, open]);

  return (
    <div ref={wrapRef} className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs glass-input text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="truncate"
          style={{ color: selected ? 'var(--text-primary)' : 'var(--text-muted)' }}
          title={triggerLabel}
        >
          {triggerLabel}
        </span>
        <span
          className="text-text-muted text-[10px] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="mt-1.5 glass-strong overflow-hidden"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlight((h) => Math.min(finalOptions.length - 1, h + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlight((h) => Math.max(0, h - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    pick(highlight);
                  }
                }}
                placeholder="Search…"
                className="w-full px-2 py-1 text-[11px] glass-input"
              />
            </div>
          )}
          <div
            ref={listRef}
            className="overflow-y-auto py-1"
            style={{ maxHeight: listMaxH }}
            role="listbox"
          >
            {finalOptions.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-text-muted">No matches</div>
            )}
            {flat.map((it, i) => {
              if (it.type === 'section') {
                // v2.16.1 — Major section header. Glassy pill matching
                // .section-h aesthetic used across the dashboard: green
                // interactive text on a faint green-tinted glass strip,
                // border-glow hairline, soft backdrop blur. Consistent
                // with BoM section headers, FleetForm group cards, etc.
                return (
                  <div
                    key={`s-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em]"
                    style={{
                      color: 'var(--interactive)',
                      background: 'rgba(129, 140, 248, 0.06)',
                      borderTop: '1px solid var(--border-glow)',
                      borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>◇</span>
                    {it.section}
                    <span
                      className="flex-1"
                      style={{
                        height: 1,
                        background:
                          'linear-gradient(90deg, rgba(129, 140, 248, 0.30), transparent)',
                        marginLeft: 6,
                      }}
                    />
                  </div>
                );
              }
              if (it.type === 'header') {
                // v2.17.14 — Subdued group divider. Previous styling was
                // reading as nearly as loud as the parent section header
                // (MM/HM/VHM). This keeps the relationship "section is
                // bold, group is a quiet tag underneath."
                return (
                  <div
                    key={`h-${i}`}
                    className="flex items-center gap-1.5 px-4 py-0.5 text-[8.5px] font-medium tracking-[0.02em]"
                    style={{
                      color: 'rgba(255,255,255,0.32)',
                      background: 'transparent',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 1,
                        background: 'rgba(129, 140, 248, 0.25)',
                        display: 'inline-block',
                      }}
                    />
                    {it.group}
                  </div>
                );
              }
              const o = it.option;
              const active = o.value === value;
              const hi = it.idx === highlight;
              return (
                <button
                  key={o.value + i}
                  data-opt={it.idx}
                  type="button"
                  disabled={o.disabled}
                  onMouseEnter={() => setHighlight(it.idx)}
                  onClick={() => pick(it.idx)}
                  className={`w-full flex items-start justify-between gap-2 pr-3 text-[11px] text-left transition-colors ${
                    o.disabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  style={{
                    // v2.17.29 — minHeight (was fixed height) so a wrapped
                    // long label can extend the row instead of overflowing
                    // into the next option. Padding gives breathing room
                    // around stacked label+meta lines.
                    minHeight: ROW_H,
                    paddingTop: 6,
                    paddingBottom: 6,
                    color: active ? 'var(--interactive)' : 'var(--text-primary)',
                    background: hi ? 'rgba(255,255,255,0.06)' : 'transparent',
                    // v2.16 — Indent options under nested groups so the
                    // hierarchy reads visually as section → group → option.
                    paddingLeft: o.section ? 28 : 12,
                  }}
                >
                  {o.prefix && (
                    <span className="flex-shrink-0 flex items-center self-center mt-0.5">
                      {o.prefix}
                    </span>
                  )}
                  {/* v2.17.14 — Stack label + meta vertically so the full
                      SKU name is always visible regardless of column width.
                      v2.17.29 — overflowWrap:anywhere replaces break-all:
                      wraps at spaces / hyphens / underscores first, falls
                      back to any character only when needed. Cleaner for
                      human names like "Intel Xeon Platinum 8488C"; still
                      handles long unbroken SKUs like Standard_M416s_6_v3. */}
                  <span
                    className="flex-1 flex flex-col items-start justify-center min-w-0"
                    title={o.label}
                  >
                    <span className="leading-snug w-full" style={{ overflowWrap: 'anywhere' }}>
                      {o.label}
                    </span>
                    {o.meta && (
                      <span
                        className="text-[9.5px] font-mono text-text-muted leading-snug mt-1 w-full"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        {o.meta}
                      </span>
                    )}
                  </span>
                  {active && <span className="text-interactive text-[10px] self-center mt-0.5">●</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';

/**
 * v2.18.6 — Shared numeric input that lets the user actually backspace.
 *
 * The naive pattern `value={n}` + `onChange={Number(e.target.value) || min}`
 * snaps back the moment the user clears the field — they can never type a
 * new number from scratch. This component fixes that by holding a local
 * BUFFER STRING. The parent still owns the numeric value; we sync to it
 * when it changes externally, and emit a parsed integer onChange when the
 * user types something parseable. The visible field is the buffer, so the
 * user can hold it empty mid-edit without it snapping.
 *
 * On blur, if the buffer is empty, we resync from the parent's value so
 * the user sees a number again instead of a blank field that no longer
 * matches state.
 *
 * The parent should NOT use this for "0 is invalid" cases — pass `min={0}`
 * and validate at the use site (e.g. disable the Submit button when value
 * < 1). The component's job is to let the user TYPE freely; the parent's
 * job is to decide what's actionable.
 */
export interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  'aria-label'?: string;
  title?: string;
  /** v2.19.3 — Fires when the user puts focus into the field. Useful for
   *  "acknowledged" semantics where clicking-in counts as interaction even
   *  if the user doesn't change the value. */
  onFocus?: () => void;
}

const DEFAULT_STYLE: React.CSSProperties = { padding: '8px 12px', width: '100%' };
const DEFAULT_CLASS = 'glass-input text-[11px] font-mono text-right';

export function NumberInput({
  value,
  onChange,
  min,
  max,
  className,
  style,
  placeholder,
  onFocus,
  ...rest
}: NumberInputProps) {
  const [buf, setBuf] = useState<string>(() => String(value));

  // External value changed (e.g. parent reset, undo, sibling action) — resync
  // the buffer UNLESS the user is mid-edit on a different number, in which
  // case the next onChange will rectify. We only resync when the parsed buffer
  // disagrees with the new value AND the buffer isn't empty (mid-clear).
  useEffect(() => {
    const parsed = Number(buf);
    if (buf === '') return; // mid-clear: don't fight the user
    if (!Number.isFinite(parsed) || Math.floor(parsed) !== value) {
      setBuf(String(value));
    }
  }, [value, buf]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={buf}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        setBuf(raw);
        if (raw === '') {
          // Treat empty as the floor — commits min (or 0). Parent's "is this
          // actionable?" check decides whether to allow Place / Save.
          onChange(min ?? 0);
          return;
        }
        const n = Math.floor(Number(raw));
        if (!Number.isFinite(n)) return;
        let clamped = n;
        if (min != null && clamped < min) clamped = min;
        if (max != null && clamped > max) clamped = max;
        onChange(clamped);
      }}
      onFocus={onFocus}
      onBlur={() => {
        if (buf === '') setBuf(String(value));
      }}
      className={className ?? DEFAULT_CLASS}
      style={style ?? DEFAULT_STYLE}
      aria-label={rest['aria-label']}
      title={rest.title}
    />
  );
}

/**
 * Variant where the underlying value may genuinely be EMPTY (not just zero).
 * Used for optional cost / life inputs that should distinguish "no value
 * entered" from "explicitly zero". The parent holds `number | ''`; we pass
 * it through verbatim.
 */
export interface NumberInputOptionalProps {
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  'aria-label'?: string;
}

export function NumberInputOptional({
  value,
  onChange,
  min,
  max,
  className,
  style,
  placeholder = '—',
  ...rest
}: NumberInputOptionalProps) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange('');
          return;
        }
        const n = Math.floor(Number(raw));
        if (!Number.isFinite(n)) return;
        let clamped = n;
        if (min != null && clamped < min) clamped = min;
        if (max != null && clamped > max) clamped = max;
        onChange(clamped);
      }}
      className={className ?? DEFAULT_CLASS}
      style={style ?? DEFAULT_STYLE}
      aria-label={rest['aria-label']}
    />
  );
}

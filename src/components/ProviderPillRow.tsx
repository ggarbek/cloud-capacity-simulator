import { PROVIDER_ORDER, PROVIDER_THEMES } from '../utils/vmTaxonomy';

/**
 * v2.8 — Canonical cloud-provider pill row. One look, one behavior, used in
 * BomFilter (single-select), VmTab (multi-select), FungibilityTab (single-
 * select), and the Fleet Builder composer (single-select).
 *
 * Always renders the canonical four pills (Azure / AWS / GCP / Custom) in
 * the order defined by `PROVIDER_ORDER`. Empty providers — no uploaded
 * catalog rows / no hardware tagged with that provider — dim to 0.45
 * opacity but remain clickable so the affordance is permanently
 * discoverable. The count badge is optional.
 *
 * Design rules locked in v2.8 (do not diverge per call site):
 * - 4 pills, same order everywhere: Azure, AWS, GCP, Custom.
 * - 5 px × 14 px padding, pill radius, provider-brand active state.
 * - Optional trailing `count` badge in monospace at 70% opacity.
 * - Empty providers dim to 0.45 (not disabled) so the user can click into
 *   them and read the empty-state hint.
 * - Multi-select rows show a `Clear` link after the pills when any are
 *   active. Single-select rows do not — re-clicking the active pill clears.
 */
export interface ProviderPillRowProps {
  /** Single-select: `activeProvider` is `string | null`. */
  mode: 'single' | 'multi';
  /** Currently selected provider(s). Pass a string|null for single, Set<string> for multi. */
  value: string | null | Set<string>;
  /** Called when a pill is toggled. For single-select, receives the new value (or null when
   *  the user clicks the already-active pill). For multi-select, receives the new Set. */
  onChange: (next: string | null | Set<string>) => void;
  /** Optional count badge per provider (e.g. number of VMs / clusters for that provider). */
  counts?: Record<string, number>;
  /** Suppress Custom (rare — usually leave true). */
  showCustom?: boolean;
  /** Show a "Clear" reset link after pills when any are active. Multi-select only. */
  showClear?: boolean;
  /** Override the empty-state tooltip ("No {label} VMs uploaded yet…"). */
  emptyTooltip?: (provider: string) => string;
  /** Override the active/inactive tooltip. */
  activeTooltip?: (provider: string, active: boolean) => string;
}

export function ProviderPillRow({
  mode,
  value,
  onChange,
  counts,
  showCustom = true,
  showClear = true,
  emptyTooltip,
  activeTooltip,
}: ProviderPillRowProps) {
  const providers = PROVIDER_ORDER.filter((p) => showCustom || p !== 'Custom');

  const isActive = (p: string): boolean => {
    if (mode === 'single') return value === p;
    return value instanceof Set && value.has(p);
  };

  const anyActive =
    mode === 'multi' && value instanceof Set ? value.size > 0 : value !== null;

  const handleClick = (p: string) => {
    if (mode === 'single') {
      // Toggle off if clicking the active pill.
      onChange(value === p ? null : p);
    } else {
      const next = new Set(value instanceof Set ? value : []);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      onChange(next);
    }
  };

  const handleClear = () => {
    onChange(mode === 'single' ? null : new Set<string>());
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {providers.map((p) => {
        const theme = PROVIDER_THEMES[p];
        const active = isActive(p);
        const count = counts?.[p];
        const empty = count !== undefined && count === 0;
        const tip =
          empty && emptyTooltip
            ? emptyTooltip(p)
            : empty
            ? `No ${theme?.label ?? p} entries yet`
            : activeTooltip
            ? activeTooltip(p, active)
            : active
            ? `Hide ${theme?.label ?? p}`
            : `Filter to ${theme?.label ?? p}`;
        return (
          <button
            key={p}
            type="button"
            onClick={() => handleClick(p)}
            className="text-[11px] font-semibold transition-all"
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-pill)',
              background: active
                ? theme?.bg ?? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                active
                  ? theme?.border ?? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.10)'
              }`,
              color: active ? theme?.text ?? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: active
                ? `0 0 14px -4px ${theme?.glow ?? 'rgba(255,255,255,0.2)'}`
                : 'none',
              opacity: empty && !active ? 0.45 : 1,
            }}
            aria-pressed={active}
            title={tip}
          >
            {theme?.label ?? p}
            {count !== undefined && (
              <span
                className="ml-1.5 font-mono opacity-70"
                style={{ fontSize: 10 }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
      {mode === 'multi' && showClear && anyActive && (
        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] tracking-[0.04em] text-text-muted hover:text-text-primary ml-1 transition-colors"
          title="Clear provider filter"
        >
          Clear
        </button>
      )}
    </div>
  );
}

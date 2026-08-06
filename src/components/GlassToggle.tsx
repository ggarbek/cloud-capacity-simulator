/**
 * Apple Liquid Glass-style fluid toggle.
 * - Frosted glass pill background
 * - White thumb with soft shadow
 * - Spring easing for that "liquid" feel
 * - Optional tone color on active state
 */
import type { CSSProperties } from 'react';

interface Props {
  enabled: boolean;
  onChange: (next: boolean) => void;
  size?: 'sm' | 'md';
  tone?: 'green' | 'cyan';
  label?: string;
  disabled?: boolean;
}

// Single consistent size used everywhere — sm and md alias to the same dims
// so toggles look uniform across the dashboard.
const dims = {
  sm: { w: 44, h: 26, thumb: 22, pad: 2 },
  md: { w: 44, h: 26, thumb: 22, pad: 2 },
};

const tones = {
  green: {
    bg: 'linear-gradient(180deg, #22C55E, #16A34A)',
    glow: '0 0 18px rgba(129, 140, 248, 0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  cyan: {
    bg: 'linear-gradient(180deg, #22D3EE, #06B6D4)',
    glow: '0 0 18px rgba(34, 211, 238, 0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
};

export function GlassToggle({
  enabled,
  onChange,
  size = 'md',
  tone = 'green',
  label,
  disabled,
}: Props) {
  const d = dims[size];
  const t = tones[tone];
  const offX = d.pad;
  const onX = d.w - d.thumb - d.pad;

  const trackStyle: CSSProperties = enabled
    ? {
        background: t.bg,
        boxShadow: t.glow,
        border: '1px solid rgba(255, 255, 255, 0.25)',
      }
    : {
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.35)',
      };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative rounded-full transition-all ease-spring ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        width: d.w,
        height: d.h,
        transitionDuration: '280ms',
        ...trackStyle,
      }}
    >
      <span
        className="absolute top-1/2 rounded-full ease-spring"
        style={{
          width: d.thumb,
          height: d.thumb,
          left: enabled ? onX : offX,
          transform: 'translateY(-50%)',
          background: enabled
            ? 'radial-gradient(circle at 30% 30%, #FFFFFF, #F1F5F9)'
            : 'radial-gradient(circle at 30% 30%, #E2E8F0, #94A3B8)',
          boxShadow:
            '0 2px 6px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3), inset 0 -1px 1px rgba(0, 0, 0, 0.1)',
          transitionProperty: 'left, background',
          transitionDuration: '220ms',
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      />
    </button>
  );
}

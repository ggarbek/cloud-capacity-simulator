/**
 * Disclosure — a collapsible section so a page reads executive-first: the
 * summary lives on top, the heavy tables tuck behind a one-click expand. Shared
 * by Region Availability + Competitive Offering so the "Detailed analysis"
 * framework is identical across the dashboard.
 */
import { useState } from 'react';

export function Disclosure({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: open ? 'transparent' : 'var(--surface)',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left"
        style={{ padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ color: 'var(--interactive)', fontSize: 11, width: 10, flexShrink: 0 }}>
          {open ? '▾' : '▸'}
        </span>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-text-muted truncate" style={{ minWidth: 0 }}>
            · {subtitle}
          </span>
        )}
      </button>
      {open && <div style={{ padding: '0 14px 8px' }}>{children}</div>}
    </div>
  );
}

/**
 * Shared setup-stepper primitives (extracted S53).
 *
 * `CollapsibleSetupHeader` + `SetupStepCard` are the collapsing one-box stepper
 * used by the CMA Comparison-setup ② Filter. They're shared so the Region
 * Availability filter renders in the EXACT same format (one box · numbered steps ·
 * each collapses to a one-line summary after Next), keeping the two filters
 * visually + behaviorally consistent.
 */
import type { ReactNode } from 'react';

// Clickable section header that collapses a setup section to a one-line summary.
// Keeps the glassy `.section-h` pill, adds a summary + chevron. The optional
// `extra` slot holds a trailing control (e.g. "Clear all") reachable when collapsed.
export function CollapsibleSetupHeader({
  title,
  summary,
  open,
  onToggle,
  extra,
}: {
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-left bg-transparent border-0 p-0 min-w-0 flex-1"
        style={{ cursor: 'pointer' }}
        aria-expanded={open}
      >
        <span className="section-h" style={{ marginBottom: 0 }}>
          {title}
        </span>
        {!open && summary && (
          <span className="text-[10px] text-text-muted truncate min-w-0">{summary}</span>
        )}
        <span className="text-[10px] text-text-muted ml-auto shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {extra}
    </div>
  );
}

// The collapsing step primitive: a number/✓ chip, a title, a one-line summary
// when collapsed, and a body shown only while active.
export function SetupStepCard({
  stepNumber,
  title,
  complete,
  active,
  summary,
  onActivate,
  children,
}: {
  stepNumber: number;
  title: string;
  complete: boolean;
  active: boolean;
  summary: string;
  onActivate: () => void;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${active ? 'var(--border-glow)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 10,
      }}
    >
      <button
        type="button"
        onClick={onActivate}
        className="w-full flex items-center gap-2 text-left bg-transparent border-0 p-0"
        style={{ cursor: 'pointer' }}
        aria-expanded={active}
      >
        <span
          className="inline-flex items-center justify-center text-[10px] font-mono"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: complete
              ? 'rgba(129, 140, 248, 0.22)'
              : active
                ? 'rgba(129, 140, 248, 0.10)'
                : 'rgba(255,255,255,0.05)',
            color: complete || active ? 'var(--interactive)' : 'var(--text-muted)',
            border: `1px solid ${
              complete
                ? 'var(--border-glow)'
                : active
                  ? 'rgba(129, 140, 248, 0.30)'
                  : 'rgba(255,255,255,0.08)'
            }`,
            flexShrink: 0,
          }}
        >
          {complete ? '✓' : stepNumber}
        </span>
        <span
          className="text-[11px] font-semibold tracking-[0.02em]"
          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {title}
        </span>
        {!active && (
          <span className="text-[10px] normal-case tracking-normal text-text-muted ml-2 truncate flex-1">
            {summary}
          </span>
        )}
        {!active && <span className="text-[10px] text-text-muted ml-auto">▸</span>}
      </button>
      {active && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

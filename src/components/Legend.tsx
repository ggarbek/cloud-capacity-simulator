interface LegendEntry {
  color: string;
  label: string;
  desc: string;
  pattern?: string;
  badge?: string;
  glow?: string;
}

const entries: LegendEntry[] = [
  {
    color: 'var(--node-deployable)',
    label: 'Empty',
    desc: 'Healthy, ready to receive a VM',
    glow: '0 0 10px var(--node-deployable-glow)',
  },
  {
    color: 'var(--node-partial)',
    label: 'Partial',
    desc: 'Has VMs, still room for more',
    glow: '0 0 10px var(--node-partial-glow)',
  },
  {
    color: 'var(--node-full)',
    label: 'Full',
    desc: 'No more VMs fit · M/C/N = binding',
    badge: 'M',
    glow: '0 0 12px var(--node-full-glow)',
  },
  {
    color: 'var(--node-reserved)',
    label: 'Overhead',
    desc: 'Buffer / reserve · withheld',
    pattern: 'pattern-stripes-white',
    badge: '🔒',
    glow: '0 0 10px var(--node-reserved-glow)',
  },
  {
    color: 'var(--node-isolated)',
    label: 'Isolated',
    desc: 'VHM · 1 VM per node',
    badge: '●',
    glow: '0 0 10px var(--node-isolated-glow)',
  },
];

export function Legend() {
  return (
    <aside
      className="w-[220px] flex-shrink-0 p-4 overflow-y-auto"
      style={{
        background: 'rgba(8, 10, 14, 0.55)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      <h3 className="text-[10px] tracking-[0.04em] font-semibold text-text-secondary mb-3">
        Node States
      </h3>
      <ul className="space-y-2.5">
        {entries.map((e) => (
          <li key={e.label} className="flex items-start gap-2.5">
            <span
              className={`relative inline-block w-5 h-5 rounded flex-shrink-0 mt-0.5 ${e.pattern ?? ''}`}
              style={{
                background: e.color,
                boxShadow: e.glow,
              }}
            >
              {e.badge && (
                <span className="absolute inset-0 grid place-items-center text-[9px] font-bold text-white drop-shadow">
                  {e.badge}
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-text-primary leading-tight">
                {e.label}
              </div>
              <div className="text-[10px] text-text-muted leading-snug">{e.desc}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-3 border-t border-border text-[10px] text-text-muted leading-relaxed">
        <div className="mb-1.5 font-semibold tracking-[0.02em] text-text-secondary">
          Interactions
        </div>
        Hover — see preview that follows the cursor.<br />
        Click — open detail panel.<br />
        ⌘/Ctrl + click — multi-select.
      </div>

      <div className="mt-5 pt-3 border-t border-border text-[10px] text-text-muted leading-relaxed">
        <div className="mb-1.5 font-semibold tracking-[0.02em] text-text-secondary">
          Binding badges
        </div>
        <div className="font-mono space-y-0.5">
          <div><span className="text-text-primary">M</span> · Memory exhausted</div>
          <div><span className="text-text-primary">C</span> · vCPU exhausted</div>
          <div><span className="text-text-primary">N</span> · Network exhausted</div>
        </div>
      </div>
    </aside>
  );
}

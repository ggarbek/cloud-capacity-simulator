/**
 * CPU Builder — manual one-CPU-at-a-time authoring surface for the
 * Hardware Library. Mirrors ServerBuilderSection styling so the two
 * builders feel like a matched set.
 *
 * v2.17.23
 *  - Glassy collapsible section, default-collapsed.
 *  - Five fields, same shape as the Excel CPU Library tab + the
 *    inline-edit form per CPU card. Authoring here writes a
 *    `UserCpu` straight into `state.userCpus`.
 *  - When the user later picks a CPU from this library inside the
 *    Server Builder's Processor field, the server's processor string
 *    and coresPerSocket auto-fill from the picked entry.
 */
import { useState } from 'react';
import type { UserCpu } from '../types';

type Vendor = 'Intel' | 'AMD' | 'Ampere' | 'Other';
const VENDORS: Vendor[] = ['Intel', 'AMD', 'Ampere', 'Other'];

export function CpuBuilderSection({
  existingNames,
  onAdd,
  stepNumber,
}: {
  existingNames: string[];
  onAdd: (c: UserCpu) => void;
  /** v2.19.35 — Optional step badge shown before the title. Used by
   *  HardwareTab to make the two-step "1 → Build a CPU, 2 → Build a
   *  Server" flow visually obvious. */
  stepNumber?: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState<Vendor>('Intel');
  const [family, setFamily] = useState('');
  const [coresPerSocket, setCoresPerSocket] = useState<number | ''>(48);
  // Default HT follows vendor convention: Intel=ON, AMD/Ampere=OFF.
  const [hyperthreading, setHyperthreading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const cleanName = name.trim();
  const nameValid = cleanName.length > 0;
  const nameUnique = !existingNames.some((n) => n.toLowerCase() === cleanName.toLowerCase());
  const coresValid = coresPerSocket !== '' && Number(coresPerSocket) > 0;
  const canSave = nameValid && nameUnique && coresValid;

  const onVendorChange = (v: Vendor) => {
    setVendor(v);
    // Auto-flip HT default to match vendor convention if user hasn't
    // overridden it yet. Tracked implicitly: we just set the value.
    if (v === 'Intel') setHyperthreading(true);
    else if (v === 'AMD' || v === 'Ampere') setHyperthreading(false);
  };

  const reset = () => {
    setName('');
    setVendor('Intel');
    setFamily('');
    setCoresPerSocket(48);
    setHyperthreading(true);
    setError(null);
  };

  const commit = () => {
    if (!canSave) {
      if (!nameValid) setError('CPU needs a name.');
      else if (!nameUnique) setError(`CPU "${cleanName}" already exists.`);
      else setError('Cores per socket must be greater than 0.');
      return;
    }
    setError(null);
    const cpu: UserCpu = {
      name: cleanName,
      vendor: vendor === 'Other' ? undefined : vendor,
      family: family.trim() || 'Unknown',
      coresPerSocket: Number(coresPerSocket),
      hyperthreading,
    };
    onAdd(cpu);
    setSavedMsg(`Saved "${cleanName}" to the CPU Library.`);
    reset();
    // v2.19.33 — Collapse the form after Save so the user immediately sees
    // the new CPU in the Library below; matches ServerBuilderSection.
    setOpen(false);
    setTimeout(() => setSavedMsg(null), 3500);
  };

  return (
    <section>
      <h2 className="section-h flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
          aria-expanded={open}
          aria-label={open ? 'Collapse CPU Builder' : 'Expand CPU Builder'}
          style={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--interactive)' }}>
            {open ? '▾' : '▸'}
          </span>
          {stepNumber != null && (
            <span
              className="inline-flex items-center justify-center text-[10px] font-mono"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'rgba(129, 140, 248, 0.22)',
                color: 'var(--interactive)',
                border: '1px solid var(--border-glow)',
                flexShrink: 0,
              }}
              aria-label={`Step ${stepNumber}`}
            >
              {stepNumber}
            </span>
          )}
          <span>+ Build a CPU</span>
        </button>
      </h2>

      {!open && savedMsg && (
        <div
          className="text-[10px] mt-1 px-2 py-1.5"
          style={{
            background: 'rgba(129, 140, 248, 0.10)',
            border: '1px solid var(--border-glow)',
            color: 'var(--interactive)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {savedMsg}
        </div>
      )}

      {open && (
        <div className="mt-2 space-y-3">
          <div
            className="glass p-3"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <div className="text-[10px] tracking-[0.04em] font-semibold text-interactive mb-2">
              CPU specs
              <span className="text-text-muted normal-case tracking-normal ml-2 font-normal">
                · matches the CPU Library Excel tab
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Name *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Intel Xeon Platinum 8480C"
                  className="glass-input text-[11px]"
                  style={{ padding: '8px 12px', width: '100%' }}
                />
                {!nameUnique && cleanName && (
                  <span className="text-[9px] text-red-300 mt-0.5">Already exists.</span>
                )}
              </Field>
              <Field label="Vendor">
                <select
                  value={vendor}
                  onChange={(e) => onVendorChange(e.target.value as Vendor)}
                  className="glass-input text-[11px]"
                  style={{ padding: '8px 12px', width: '100%' }}
                >
                  {VENDORS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Family / generation">
                <input
                  type="text"
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  placeholder="e.g. Sapphire Rapids"
                  className="glass-input text-[11px]"
                  style={{ padding: '8px 12px', width: '100%' }}
                />
              </Field>
              <Field label="Cores per socket *">
                <input
                  type="number"
                  min={1}
                  value={coresPerSocket}
                  onChange={(e) => setCoresPerSocket(e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1))}
                  className="glass-input text-[11px] font-mono text-right"
                  style={{ padding: '8px 12px', width: '100%' }}
                />
              </Field>
            </div>

            <div className="mt-3">
              <label className="text-[10px] text-text-secondary flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hyperthreading}
                  onChange={(e) => setHyperthreading(e.target.checked)}
                />
                Hyperthreading enabled
                <span className="text-text-muted">· each physical core exposes 2 vCPUs to the OS</span>
              </label>
            </div>
          </div>

          {error && (
            <div
              className="text-[10px] px-2 py-1.5"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#FCA5A5',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}
          {savedMsg && (
            <div
              className="text-[10px] px-2 py-1.5"
              style={{
                background: 'rgba(129, 140, 248,0.10)',
                border: '1px solid var(--border-glow)',
                color: 'var(--interactive)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {savedMsg}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={reset}
              className="btn-ghost text-[11px]"
              style={{
                padding: '6px 14px',
                color: 'var(--text-secondary)',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              Reset form
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost text-[11px]"
                style={{
                  padding: '6px 14px',
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                Close
              </button>
              <button
                onClick={commit}
                disabled={!canSave}
                className="btn-ghost text-[11px]"
                style={{
                  padding: '6px 16px',
                  color: canSave ? 'var(--interactive)' : 'var(--text-muted)',
                  borderColor: canSave ? 'var(--border-glow)' : 'rgba(255,255,255,0.10)',
                  background: canSave ? 'rgba(129, 140, 248,0.10)' : 'transparent',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
                title={canSave ? 'Add this CPU to the library' : 'Fix the warnings above first'}
              >
                + Save CPU
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.04em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

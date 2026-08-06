/**
 * ExportButton — the Executive Summary export control (Wave 2 / C3).
 *
 * Renders TWO actions, available in BOTH comparison and BoM modes:
 *   - "Export slides (.pptx)"  → exportExecDeck(model)
 *   - "Export document (.docx)" → exportExecDoc(model)
 *
 * The model is built LAZILY on click via `buildModel()` (which closes over the
 * exec block's live memos in CompetitivePage) so we never build it on every
 * render. The pptx / docx libraries are dynamic-imported inside the exporters,
 * so this component adds nothing to the main bundle until the user clicks.
 *
 * The exporters own filenames + `generatedAt` (the builder stamps the ISO date);
 * this component only formats/handles the click, the spinner, and errors.
 */
import { useState } from 'react';
import type { ExecComparisonModel, ExecBomModel } from '../../utils/export/execSummaryModel';

type Model = ExecComparisonModel | ExecBomModel;
type Busy = null | 'pptx' | 'docx';

export function ExportButton({
  mode,
  buildModel,
}: {
  mode: 'comparison' | 'bom';
  buildModel: () => Model;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'pptx' | 'docx') => {
    if (busy) return;
    setError(null);
    setBusy(kind);
    try {
      const model = buildModel();
      if (kind === 'pptx') {
        const { exportExecDeck } = await import('../../utils/export/execSummaryPptx');
        await exportExecDeck(model);
      } else {
        const { exportExecDoc } = await import('../../utils/export/execSummaryDocx');
        await exportExecDoc(model);
      }
    } catch (e) {
      setError(
        `Export failed: ${e instanceof Error ? e.message : 'unexpected error'}. Try again, or reduce the comparison scope.`,
      );
    } finally {
      setBusy(null);
    }
  };

  const label = mode === 'bom' ? 'Export BoM brief' : 'Export brief';

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.05em] font-semibold" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <ActionButton
          onClick={() => run('pptx')}
          busy={busy === 'pptx'}
          disabled={busy != null}
          text="Export slides (.pptx)"
        />
        <ActionButton
          onClick={() => run('docx')}
          busy={busy === 'docx'}
          disabled={busy != null}
          text="Export brief (.docx)"
        />
      </div>
      {error && (
        <div
          className="text-[10px] px-2 py-1 rounded"
          style={{
            color: 'var(--accent-amber)',
            background: 'rgba(251, 191, 36, 0.10)',
            border: '1px solid rgba(251, 191, 36, 0.30)',
            maxWidth: 340,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  disabled,
  text,
}: {
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-[11px] font-semibold px-2.5 py-1 rounded transition-colors whitespace-nowrap"
      style={{
        color: disabled && !busy ? 'var(--text-muted)' : 'var(--interactive)',
        background: 'transparent',
        border: '1px solid var(--border)',
        opacity: disabled && !busy ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {busy ? 'Exporting…' : text}
    </button>
  );
}

/**
 * Contains a render failure to one panel.
 *
 * React unmounts the whole tree when a render throws and nothing catches it.
 * That is how a malformed arc array in the world map data took down not just
 * the map but the entire Cloud Market Analytics shell — nav included — leaving
 * a blank page whose only recovery was a reload. The data defect is fixed and
 * guarded by a test; this exists so the next one degrades to a single dead
 * panel instead of a dead app.
 *
 * Deliberately not global: a boundary at the root would swallow failures that
 * SHOULD be loud in development. Wrap the surfaces that are large, optional,
 * and data-driven — a map, a chart — and leave the primary answer path alone.
 */
import { Component, type ReactNode } from 'react';

interface Props {
  /** Named in the fallback so a bug report can say which panel died. */
  label: string;
  children: ReactNode;
}

interface State {
  message: string | null;
}

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown): void {
    // Keep it in the console for anyone with devtools open; the UI stays calm.
    console.error(`[${this.props.label}] render failed:`, error);
  }

  render(): ReactNode {
    const { message } = this.state;
    if (message === null) return this.props.children;

    return (
      <div
        role="status"
        style={{
          padding: '20px 22px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {this.props.label} could not be displayed.
        </div>
        <div>
          The rest of this page still works. Reloading may clear it; if it does not, the
          detail below is what a bug report needs.
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </div>
      </div>
    );
  }
}

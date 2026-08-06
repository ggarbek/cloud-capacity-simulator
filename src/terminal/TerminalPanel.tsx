/**
 * TerminalPanel — the in-dashboard assistant.
 *
 * A floating launcher (bottom-right, above the footer) opens a chat panel that
 * answers questions about the CURRENT page's data. It is:
 *  - PAGE-CONTEXTUAL: `buildPageContext(state, focus)` grounds every answer in
 *    what's on screen; "this VM" resolves against the published focus.
 *  - CAPACITY-SILOED + DATA-ONLY: see prompt.ts / pageContext.ts. The guardrails
 *    live in the provider; this component is presentation + transport only.
 *
 * Conversation state is LOCAL and ephemeral (not in AppState, not persisted) —
 * it is not part of the simulation snapshot and carries no personal info.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { useScreenFocus } from './screenContext';
import { buildPageContext } from './pageContext';
import { suggestedQuestions } from './prompt';
import { getProvider, type TerminalTurn } from './provider';

interface ChatMsg extends TerminalTurn {
  refused?: boolean;
  mock?: boolean;
}

export function TerminalPanel() {
  const { state } = useApp();
  const focus = useScreenFocus();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(
    () => buildPageContext(state, focus),
    [state, focus],
  );
  const suggestions = useMemo(() => suggestedQuestions(ctx), [ctx]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const history: TerminalTurn[] = msgs.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMsgs((m) => [...m, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const reply = await getProvider().ask({
        question: q,
        history,
        context: ctx,
        catalog: state.userVms,
      });
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          content: reply.content,
          refused: reply.refused,
          mock: reply.mock,
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            "Something went wrong reaching the assistant. The data on the page is still accurate — try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the data assistant"
        title="Ask about this page's data"
        style={{
          position: 'fixed',
          right: 18,
          bottom: 34,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 42,
          padding: '0 16px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--interactive)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        <PromptIcon />
        Ask
      </button>
    );
  }

  return (
    <div
      className="glass-strong terminal-panel"
      role="dialog"
      aria-label="Capacity data assistant"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 34,
        zIndex: 60,
        width: 'min(400px, calc(100vw - 36px))',
        height: 'min(560px, calc(100vh - 120px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '11px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--interactive)', display: 'flex' }}>
          <PromptIcon />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            Data assistant
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--text-dim)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={
              ctx.subPage
                ? `${ctx.title} · ${ctx.subPage}`
                : focus
                  ? focus.label
                  : ctx.title
            }
          >
            Context: {ctx.title}
            {ctx.subPage ? ` · ${ctx.subPage}` : focus ? ` · ${focus.label}` : ''}
          </div>
        </div>
        {msgs.length > 0 && (
          <button
            onClick={() => setMsgs([])}
            title="Clear conversation"
            style={iconBtn}
          >
            Clear
          </button>
        )}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
          title="Close"
          style={{ ...iconBtn, fontSize: 16, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {msgs.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
            <p style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Ask about what's on this page.
            </p>
            <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
              I answer over this dashboard's data — VM specs, rates, regions,
              equivalency, and run results. I won't touch anything outside this
              tool or explain the engine's internals.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {busy && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-dim)', fontSize: 12 }}>
            …
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{
          flexShrink: 0,
          padding: 10,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          className="glass-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this page…"
          aria-label="Ask a question"
          style={{
            flex: 1,
            padding: '8px 11px',
            borderRadius: 8,
            fontSize: 12.5,
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            padding: '0 14px',
            borderRadius: 8,
            border: 'none',
            background:
              busy || !input.trim() ? 'var(--surface-2)' : 'var(--interactive)',
            color: busy || !input.trim() ? 'var(--text-dim)' : '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: busy || !input.trim() ? 'default' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        padding: '8px 11px',
        borderRadius: 10,
        fontSize: 12.5,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        background: isUser ? 'var(--interactive)' : 'var(--surface-2)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border)',
        ...(msg.refused
          ? { borderColor: 'rgba(217,164,65,0.5)' }
          : null),
      }}
    >
      {msg.content}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  fontSize: 11,
  padding: '2px 4px',
};

function PromptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h16M4 12h10M4 19h7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

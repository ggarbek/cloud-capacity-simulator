/**
 * GettingStartedPage — the Glossary (v2.23 → S68).
 *
 * Two sub-views (Concepts · FAQ), modeled on a wiki-with-sub-views
 * pattern. Content is curated + static in `src/data/help.ts`. Deliberately
 * high-level — it explains what the dashboard does and why, not how the
 * engine works internally.
 *
 * S68 — this used to be a top-level "Getting started" page whose first view
 * was a numbered workflow. It now lives at the bottom of the Simulator rail
 * as the Glossary (mirroring how Cloud Market Analytics parks its FAQ &
 * Glossary), and the onboarding role moved to the Start Here tab, which can
 * do the one thing this page never could: load a worked example and show a
 * populated result.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import {
  CONCEPTS,
  FAQS,
  type Concept,
  type HelpBlock,
  type Faq,
} from '../data/help';

type SubView = 'concepts' | 'faq';

export function GettingStartedPage() {
  const { state, dispatch } = useApp();
  const [view, setView] = useState<SubView>('concepts');
  const [conceptTarget, setConceptTarget] = useState<string | null>(null);
  // Deep-link from a setup page's "Learn about X" link: open Concepts on that
  // concept, then clear the pending target so a later visit lands on the
  // default view.
  useEffect(() => {
    const t = state.ui.helpConcept;
    if (t) {
      setView('concepts');
      setConceptTarget(t);
      dispatch({ type: 'UI_SET', ui: { helpConcept: null } });
    }
  }, [state.ui.helpConcept, dispatch]);
  return (
    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 28px 64px' }}>
        {/* Header + sub-nav */}
        <div className="flex items-end justify-between gap-4 flex-wrap" style={{ marginBottom: 18 }}>
          <div>
            <h1
              className="font-semibold"
              style={{ fontSize: 26, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              FAQ & Glossary
            </h1>
            <div className="text-[12.5px]" style={{ color: 'var(--text-muted)', marginTop: 3 }}>
              Every concept the simulator uses, and the questions that come up most.
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Help sections"
            className="flex items-center gap-0.5 p-0.5 flex-shrink-0"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', background: 'var(--tint-soft)' }}
          >
            {([
              ['concepts', 'Concepts'],
              ['faq', 'FAQ'],
            ] as [SubView, string][]).map(([id, label]) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(id)}
                  className="transition-colors"
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    background: active ? 'var(--interactive)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {view === 'concepts' && (
          <ConceptsView key={conceptTarget ?? 'default'} initialId={conceptTarget ?? undefined} />
        )}
        {view === 'faq' && <FaqView />}
      </div>
    </div>
  );
}

// ── Concepts — searchable index + article body ────────────────────────────
function ConceptsView({ initialId }: { initialId?: string }) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(
    initialId && CONCEPTS.some((c) => c.id === initialId) ? initialId : CONCEPTS[0].id,
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONCEPTS;
    return CONCEPTS.filter((c) => {
      const hay = [c.title, c.summary, ...c.tags, ...c.body.map(blockText)].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const active: Concept | undefined = matches.find((c) => c.id === activeId) ?? matches[0];

  return (
    <div>
      <input
        className="glass-input w-full"
        placeholder="Search concepts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '8px 12px', fontSize: 12.5, marginBottom: 12 }}
        aria-label="Search concepts"
      />
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(180px, 240px) 1fr' }}>
        {/* Index */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {matches.length === 0 && (
            <div className="text-[11.5px] italic" style={{ color: 'var(--text-muted)', padding: '8px 4px' }}>
              No concepts match “{query}”.
            </div>
          )}
          {matches.map((c) => {
            const on = active?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className="text-left transition-colors"
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: on ? 'var(--interactive-muted)' : 'transparent',
                  color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 12.5,
                  fontWeight: on ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {c.title}
              </button>
            );
          })}
        </div>
        {/* Article */}
        {active && (
          <article
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              minWidth: 0,
            }}
          >
            <h2 className="font-semibold" style={{ fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {active.title}
            </h2>
            <div className="text-[12.5px]" style={{ color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
              {active.summary}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {active.body.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function blockText(b: HelpBlock): string {
  if (b.kind === 'list') return b.items.join(' ');
  return b.text;
}

function Block({ block }: { block: HelpBlock }) {
  if (block.kind === 'heading') {
    return (
      <div className="font-semibold" style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>
        {block.text}
      </div>
    );
  }
  if (block.kind === 'list') {
    return (
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 2 }}>
        {block.items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span aria-hidden="true" style={{ color: 'var(--interactive)' }}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === 'note') {
    return (
      <div
        className="text-[12px] leading-relaxed"
        style={{
          color: 'var(--text-secondary)',
          background: 'var(--interactive-muted)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
        }}
      >
        {block.text}
      </div>
    );
  }
  return (
    <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {block.text}
    </p>
  );
}

// ── FAQ — search-filtered accordion ───────────────────────────────────────
function FaqView() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.map((f, i) => ({ f, i })).filter(({ f }) =>
      q === '' ? true : (f.q + ' ' + f.a.join(' ')).toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div>
      <input
        className="glass-input w-full"
        placeholder="Search questions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: '8px 12px', fontSize: 12.5, marginBottom: 12 }}
        aria-label="Search FAQ"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.length === 0 && (
          <div className="text-[11.5px] italic" style={{ color: 'var(--text-muted)' }}>
            No questions match “{query}”.
          </div>
        )}
        {matches.map(({ f, i }) => {
          const on = open.has(i);
          return (
            <div
              key={i}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={on}
                className="w-full flex items-center gap-3 text-left transition-colors"
                style={{ padding: '12px 16px', background: 'transparent', cursor: 'pointer' }}
              >
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.q}</span>
                <span aria-hidden="true" style={{ color: 'var(--interactive)', fontSize: 14, flexShrink: 0 }}>
                  {on ? '−' : '+'}
                </span>
              </button>
              {on && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {f.a.map((p, j) => (
                    <p key={j} className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {p}
                    </p>
                  ))}
                  {f.table && <FaqTable table={f.table} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FAQ table — compact, for things like the reserved-discount factors ──────
function FaqTable({ table }: { table: NonNullable<Faq['table']> }) {
  const cols = `1.2fr repeat(${table.headers.length - 1}, 1fr)`;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: 2, maxWidth: 360 }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: cols, fontSize: 10, letterSpacing: '0.04em', color: 'var(--text-muted)', background: 'var(--tint-soft)', padding: '6px 12px', fontWeight: 700 }}
      >
        {table.headers.map((h, i) => (
          <div key={i} style={{ textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
        ))}
      </div>
      {table.rows.map((row, r) => (
        <div
          key={r}
          className="grid"
          style={{ gridTemplateColumns: cols, fontSize: 11.5, padding: '6px 12px', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          {row.map((cell, c) => (
            <div
              key={c}
              className={c === 0 ? '' : 'font-mono'}
              style={{ textAlign: c === 0 ? 'left' : 'right', color: c === 0 ? 'var(--text-primary)' : undefined }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
      {table.caption && (
        <div className="text-[9.5px]" style={{ color: 'var(--text-muted)', padding: '5px 12px', borderTop: '1px solid var(--border)', fontStyle: 'italic' }}>
          {table.caption}
        </div>
      )}
    </div>
  );
}

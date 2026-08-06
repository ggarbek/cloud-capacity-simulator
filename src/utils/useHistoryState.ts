/**
 * Generic undo/redo wrapper around useState.
 *
 * Mirrors the React useState signature — `setValue(next)` or `setValue(prev => next)`
 * — but transparently records each call into an in-memory history stack so the
 * caller gets `undo()` / `redo()` / `canUndo` / `canRedo` / `reset()` for free.
 *
 * Used by the Fungibility tab to make the matrix Excel-like (Cmd/Ctrl+Z and
 * Cmd/Ctrl+Shift+Z), without sprinkling history mutations through every
 * mutation site. Filter and selection state stay in plain useState because
 * they're not value-mutations the user expects to undo.
 *
 * Behaviour notes:
 *   - History is bounded by `opts.cap` (default 50). Oldest snapshots drop
 *     off the front and the cursor adjusts so `value` stays stable.
 *   - When the cursor isn't at the tip and the user mutates, the redo tail is
 *     discarded — standard editor convention.
 *   - `reset(snapshot)` clears the entire stack and seeds it with one entry,
 *     so a Discard / Submit handler can establish a fresh baseline.
 */
import { useCallback, useState } from 'react';

interface HistoryStack<T> {
  history: T[];
  idx: number;
}

export interface HistoryHandle<T> {
  /** Current value at the stack cursor. Read this where you used to read useState's first element. */
  value: T;
  /** Mutate the value AND push a new history entry. Same signature as setState. */
  setValue: (next: T | ((prev: T) => T)) => void;
  /** Clear the stack and seed it with `snapshot` as the only entry. */
  reset: (snapshot: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Stack length — useful for diagnostic chips ("3 of 12"). */
  size: number;
  /** Current cursor (0-indexed). */
  cursor: number;
}

export function useHistoryState<T>(initial: T, opts: { cap?: number } = {}): HistoryHandle<T> {
  const cap = opts.cap ?? 50;
  const [stack, setStack] = useState<HistoryStack<T>>(() => ({
    history: [initial],
    idx: 0,
  }));

  const value = stack.history[stack.idx];

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStack((s) => {
        const prev = s.history[s.idx];
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        // Truncate any redo tail before appending — standard editor convention.
        const truncated = s.history.slice(0, s.idx + 1);
        let history = [...truncated, resolved];
        let idx = history.length - 1;
        // Bound the stack so rapid editing doesn't leak memory. Drop oldest
        // entries from the front; the cursor shifts left by the same amount.
        if (history.length > cap) {
          const drop = history.length - cap;
          history = history.slice(drop);
          idx -= drop;
        }
        return { history, idx };
      });
    },
    [cap],
  );

  const reset = useCallback((snapshot: T) => {
    setStack({ history: [snapshot], idx: 0 });
  }, []);

  const undo = useCallback(() => {
    setStack((s) => (s.idx > 0 ? { history: s.history, idx: s.idx - 1 } : s));
  }, []);

  const redo = useCallback(() => {
    setStack((s) =>
      s.idx < s.history.length - 1 ? { history: s.history, idx: s.idx + 1 } : s,
    );
  }, []);

  return {
    value,
    setValue,
    reset,
    undo,
    redo,
    canUndo: stack.idx > 0,
    canRedo: stack.idx < stack.history.length - 1,
    size: stack.history.length,
    cursor: stack.idx,
  };
}

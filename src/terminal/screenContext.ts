/**
 * screenContext — the Terminal's siloed "what is the user pointing at" channel.
 *
 * This is a tiny singleton pub/sub modeled on a dashboard
 * `screenContext` publisher pattern, RE-IMPLEMENTED here so the Capacity
 * Simulator stays a self-contained silo (see
 * the design notes). Components that hold a
 * meaningful ephemeral selection that is NOT already in AppState — e.g. the
 * VM a user just picked in CrossCloudCompare — call `screenContext.publish`
 * so the Terminal can resolve "this", "that VM", "these regions" to the thing
 * on screen.
 *
 * HARD CONSTRAINTS (do not violate):
 *  - DATA ONLY. Publish what the user can SEE — selected VM, picked regions,
 *    a visible rate. Never publish engine internals (placement/scoring/
 *    fungibility mechanics) or any personal info. This channel is the
 *    Terminal's grounding; everything that flows through it can be surfaced
 *    to the user.
 *  - CAPACITY-SILOED. Only simulator data belongs here.
 *
 * Most page context is derived centrally from AppState in `pageContext.ts`;
 * this channel is only for component-local selections AppState doesn't hold.
 */
import { useSyncExternalStore } from 'react';

export interface ScreenFocus {
  /** Short human label, e.g. "Comparing D8s_v5 across clouds". */
  label: string;
  /** Optional one-line elaboration. */
  detail?: string;
  /**
   * The active SUB-PAGE within a multi-tab shell (e.g. "At a Glance",
   * "Region availability"). Shown as a second segment on the Terminal's
   * context chip and told to the model so it knows the user is most likely
   * asking about what's on this exact sub-page. Distinct from `label`, which
   * is the specific thing "this"/"that" points at (e.g. the picked VM).
   */
  subPage?: string;
  /** Structured, data-only grounding the Terminal can answer over. */
  data?: Record<string, unknown>;
}

type Listener = () => void;

let current: ScreenFocus | null = null;
const listeners = new Set<Listener>();

export const screenContext = {
  /** Publish (or clear, with null) the current on-screen focus. */
  publish(focus: ScreenFocus | null): void {
    current = focus;
    listeners.forEach((l) => l());
  },
  /** Read the current focus synchronously. */
  get(): ScreenFocus | null {
    return current;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** React hook — re-renders when the published focus changes. */
export function useScreenFocus(): ScreenFocus | null {
  return useSyncExternalStore(
    screenContext.subscribe,
    screenContext.get,
    screenContext.get,
  );
}

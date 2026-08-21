/**
 * Feedback / bug-report helper.
 *
 * The simulator has no backend, so feedback goes to the public issue
 * tracker. Auto-context (version, page, browser, viewport, theme,
 * timestamp) is pre-filled into the issue body so reports arrive with
 * reproducible debug info without the reporter having to know what to
 * attach.
 *
 * Two consumers: the `💬 Feedback` link in AppHeader and the small
 * `· feedback` link in the bottom-right footer. Both call
 * buildFeedbackUrl() and assign the result to an <a href>.
 */

export const FEEDBACK_ISSUES_URL =
  'https://github.com/ggarbek/cloud-capacity-simulator/issues/new';
export const APP_VERSION = 'v2.55.0';

export interface FeedbackContext {
  /** Active page slug from state.ui.activePage (e.g. 'simulator'). */
  page?: string;
}

/** Build a "new issue" href with a pre-filled feedback template +
 *  auto-context block. Pure function; safe to call from any component. */
export function buildFeedbackUrl(ctx: FeedbackContext = {}): string {
  const subject = `[Capacity Simulator ${APP_VERSION}] Feedback / bug report`;

  // Collect runtime context. All checks are defensive — this code should
  // never crash a render even in odd environments.
  const ua =
    typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
      ? navigator.userAgent
      : 'unknown';
  const viewport =
    typeof window !== 'undefined'
      ? `${window.innerWidth}×${window.innerHeight}`
      : 'unknown';
  const theme =
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') ?? 'unknown'
      : 'unknown';
  const language =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language
      : 'unknown';
  const timestamp = new Date().toISOString();
  const pageLabel = ctx.page ?? 'unknown';

  const body = [
    `[Describe what you saw, what you expected, and steps to reproduce.]`,
    ``,
    ``,
    `— — — — — — — — — — — — — — — — — — — — — — — — — —`,
    `Auto-context (please keep — it makes this reproducible):`,
    `Version: ${APP_VERSION}`,
    `Page:    ${pageLabel}`,
    `Browser: ${ua}`,
    `Viewport: ${viewport} px`,
    `Theme:   ${theme}`,
    `Lang:    ${language}`,
    `Time:    ${timestamp}`,
  ].join('\n');

  return `${FEEDBACK_ISSUES_URL}?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Back-compat alias — existing call sites import this name. */
export const buildFeedbackMailto = buildFeedbackUrl;

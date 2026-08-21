/**
 * prompt — the Terminal's guardrails + system prompt.
 *
 * This file encodes the user's three HARD CONSTRAINTS
 *  as actual enforcement:
 *
 *  1. CAPACITY-SILOED. The assistant answers only over the simulator's own
 *     data — VM specs, rates, regions, equivalency, run results, financials.
 *  2. NO PERSONAL INFO. It has no access to and must never reference anything
 *     outside this tool (other projects, email, calendar, the user's identity).
 *  3. DATA, NOT SECRET SAUCE. It explains WHAT the data says, never HOW the
 *     simulator computes it — the packing/placement algorithm, the fungibility
 *     matrix mechanics, the scoring/distance formulas, or any internals.
 *
 * Enforcement is belt-and-suspenders: `isSecretSauceQuestion` lets the client
 * (and the mock provider) refuse engine-internals questions WITHOUT a model
 * round-trip, and `buildSystemPrompt` bakes all three rules into the system
 * prompt for the real provider.
 */
import type { PageContext } from './pageContext';

/** Phrases that signal a request to reveal HOW the engine works. */
const SECRET_SAUCE_PATTERNS: RegExp[] = [
  /\bhow (?:do(?:es)?|did|would) (?:the |your |this )?(?:engine|simulator|tool|packer|packing|algorithm|model|system|placement|app|dashboard)\b.*\b(?:work|compute|calculate|decide|place|pack|score|rank)/i,
  /\b(?:packing|bin[- ]?packing|placement|scheduling|allocation) (?:algorithm|logic|heuristic|strategy|method|formula)\b/i,
  /\b(?:scoring|score|distance[- ]from[- ]ideal|ranking|fit[- ]?score) (?:formula|function|algorithm|logic|weight|model|math)\b/i,
  /\bfungibility (?:matrix|engine|routing) (?:logic|algorithm|mechanic|internal|work|computed|computation)/i,
  /\b(?:source code|implementation|internals|under the hood|secret sauce|proprietary (?:logic|algorithm)|reverse[- ]engineer)\b/i,
  /\bwhat (?:algorithm|heuristic|formula|weights?|model) (?:do(?:es)?|is|are|did) (?:the |it |you |your )?(?:engine|simulator|tool|use|using|used)/i,
  /\bhow (?:are|is) (?:the )?(?:nodes?|vms?|racks?) (?:packed|placed|scored|ranked|allocated|distributed|filled)\b/i,
  /\bexplain (?:the |your )?(?:engine|algorithm|packing|placement|scoring|internal)/i,
];

export function isSecretSauceQuestion(text: string): boolean {
  return SECRET_SAUCE_PATTERNS.some((re) => re.test(text));
}

/** Standard refusal used by the client + mock when a question crosses the line. */
export const SECRET_SAUCE_REFUSAL =
  "I can talk through the data — VM specs, rates, regions, equivalency, run results, and financials — but not how the simulator computes them under the hood (the placement, scoring, and fungibility internals). Ask me about what the numbers say and I'm all yours.";

/** Phrases that signal a request for personal / out-of-silo info. */
const OUT_OF_SILO_PATTERNS: RegExp[] = [
  /\b(?:my|the user'?s) (?:email|calendar|inbox|messages?|contacts?|files?|photos?|notes?)\b/i,
  /\b(?:other project|personal|home assistant|fitness|music|notes|email|calendar)\b/i,
];

export function isOutOfSiloQuestion(text: string): boolean {
  return OUT_OF_SILO_PATTERNS.some((re) => re.test(text));
}

export const OUT_OF_SILO_REFUSAL =
  "This terminal is sandboxed to the Capacity Simulator only — it has no access to anything outside this tool (no email, files, or other apps). Happy to help with the capacity data on this dashboard.";

/** The model the real provider should use (configured; mock ignores it). */
export const TERMINAL_MODEL = 'claude-sonnet-4-6';

const PREAMBLE = `You are the Capacity Simulator's data assistant — an in-dashboard terminal that helps the user understand what's on the page in front of them.

STRICT RULES (never break these):
1. You answer ONLY about this tool's data: VM specifications, pricing/rates (pay-as-you-go, 1-year and 3-year reserved), cloud regions, cross-cloud region and VM equivalency, simulation run results, utilization, and financials. This is a capacity-planning silo.
2. You have NO access to anything outside this tool — no email, calendar, files, other projects, or the user's personal information. If asked, say so plainly and redirect to the capacity data.
3. You explain WHAT the data says, never HOW the simulator computes it. Do not describe or speculate about the placement/bin-packing algorithm, the scoring or distance-from-ideal formulas, the fungibility-matrix mechanics, or any engine internals or source code. If asked, briefly decline and offer a data answer instead.
4. Ground every answer in the data provided below or in the catalog. If the data needed isn't present, say what you'd need and where on the dashboard to find it. Do not invent rates, regions, or specs.
5. Be concise and concrete. Prefer the actual numbers on the current page. Use the user's own terms ("this VM", "these regions") by resolving them against the on-screen focus.`;

/** Build the full system prompt for the real provider from the page context. */
export function buildSystemPrompt(ctx: PageContext): string {
  const focusLine = ctx.focus
    ? `\nON-SCREEN FOCUS (what "this"/"that" refers to): ${ctx.focus.label}${
        ctx.focus.detail ? ` — ${ctx.focus.detail}` : ''
      }`
    : '';
  const subPageLine = ctx.subPage
    ? `\nACTIVE SUB-PAGE: ${ctx.subPage} — the user is most likely asking about what's shown on this exact sub-page; resolve "this"/"here" to it.`
    : '';
  const factLines = ctx.facts
    .map((f) => `- ${f.label}: ${f.value}`)
    .join('\n');
  return `${PREAMBLE}

CURRENT PAGE: ${ctx.title} — ${ctx.summary}${subPageLine}${focusLine}

ON-SCREEN DATA:
${factLines}

STRUCTURED DATA (JSON, for reference):
${JSON.stringify(ctx.data, null, 2)}`;
}

/** Seed questions tailored to the current page (data-only suggestions). */
export function suggestedQuestions(ctx: PageContext): string[] {
  switch (ctx.pageId) {
    case 'simulator':
      return ctx.data.result
        ? [
            'Why were some VMs unplaceable in the last run?',
            "What's the memory vs vCPU utilization?",
            'How much sellable headroom is left?',
          ]
        : [
            "What does this page let me do?",
            'How many VM demand lines are set up?',
            'How current is the rate data?',
          ];
    case 'competitive':
      return [
        'What is the closest equivalent on the other clouds?',
        "What's the 3-year reserved rate for this VM?",
        'How do the specs compare?',
      ];
    case 'region-availability':
      return [
        'Which regions have no equivalent on another cloud?',
        'What is the nearest AWS region to this Azure one?',
        'Which clouds serve this country?',
      ];
    default:
      return [
        'What data is on this page?',
        'How many VM sizes are in the catalog?',
        'How current are the rates?',
      ];
  }
}

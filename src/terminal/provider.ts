/**
 * provider — the Terminal's LLM adapter (the seam where intelligence plugs in).
 *
 * PRODUCT DIRECTION (do not lose this): the assistant is the EVENTUAL CORE of
 * the simulator — the AI becomes the computational power and intelligence, not
 * a side feature. The end state is **bring-your-own-account**: a user logs into
 * the simulator with their OWN Claude OR ChatGPT account, and that account
 * supplies the intelligence (and pays for it). Until that auth exists, the
 * MockProvider gives basic, no-network Q&A so the surface is useful today.
 * Everything here is built so that swap is a drop-in: only `getProvider()`
 * changes, never the UI, the guardrails, or the page-context plumbing.
 *
 * The Terminal talks to a `TerminalProvider`. Today the only implementation is
 * `MockProvider`: a deterministic, no-network responder that answers common
 * data questions directly from the page context + catalog + curated help, and
 * enforces the guardrails locally — so the whole Terminal ships and is tested
 * before any real model is connected.
 *
 * WIRING REAL INTELLIGENCE (later — see
 * the design notes):
 *   - BYO-account (the goal): the signed-in user's Claude/OpenAI account is the
 *     transport. Each vendor becomes a `TerminalProvider`; `getProvider()`
 *     returns the one matching the user's connected account. `buildSystemPrompt`
 *     (the guardrails) is provider-agnostic, so the silo holds for either model.
 *   - Interim single-key options if needed before account login lands:
 *       · Serverless proxy: POST { system, messages, model } to /api/terminal,
 *         which holds the API key server-side. Preferred for a shared key.
 *       · Browser BYO-key: same call straight to the vendor API with a
 *         localStorage key. No backend.
 * `TERMINAL_MODEL` (claude-sonnet-4-6) is the default Claude model; an OpenAI
 * provider would carry its own model id. The system prompt comes from
 * `buildSystemPrompt(ctx)`; nothing else changes.
 */
import type { PageContext } from './pageContext';
import { catalogSummary, findVm } from './pageContext';
import {
  isSecretSauceQuestion,
  SECRET_SAUCE_REFUSAL,
  isOutOfSiloQuestion,
  OUT_OF_SILO_REFUSAL,
  buildSystemPrompt,
  TERMINAL_MODEL,
} from './prompt';
import { FAQS, CONCEPTS } from '../data/help';
import type { UserVm } from '../types';

export interface TerminalTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TerminalRequest {
  question: string;
  history: TerminalTurn[];
  context: PageContext;
  catalog: UserVm[];
}

export interface TerminalReply {
  /** The answer text. */
  content: string;
  /** True when the answer is a guardrail refusal (data-only / out-of-silo). */
  refused?: boolean;
  /** True when produced by the mock (so the UI can badge it pre-wiring). */
  mock?: boolean;
}

export interface TerminalProvider {
  ask(req: TerminalRequest): Promise<TerminalReply>;
}

const money = (n?: number): string =>
  n === undefined ? 'not published' : `$${n.toFixed(4)}/hr`;

/**
 * Compose a grounded answer from local data only. Exported for unit testing.
 * Returns null when nothing local matches (the mock then gives a generic
 * "ask me about…" steer rather than fabricating).
 */
export function mockAnswer(req: TerminalRequest): TerminalReply {
  const q = req.question.trim();
  const lower = q.toLowerCase();

  // Guardrails first — never answer these.
  if (isSecretSauceQuestion(q)) {
    return { content: SECRET_SAUCE_REFUSAL, refused: true, mock: true };
  }
  if (isOutOfSiloQuestion(q)) {
    return { content: OUT_OF_SILO_REFUSAL, refused: true, mock: true };
  }

  // The VM the user is pointing at: the page's baseline (Competitive) or the
  // published on-screen focus (e.g. CrossCloudCompare's picked VM).
  const focusVmName =
    (typeof req.context.data.baseline === 'object' &&
      req.context.data.baseline !== null &&
      (req.context.data.baseline as { vmSizeName?: string }).vmSizeName) ||
    ((req.context.focus?.data?.source as { vmSizeName?: string } | undefined)
      ?.vmSizeName) ||
    '';

  // Rate / spec lookup: does the question name a VM size in the catalog?
  const vmHit =
    findVm(req.catalog, q) ??
    // try each whitespace token as a possible SKU
    q
      .split(/[\s,?]+/)
      .map((t) => (t.length >= 3 ? findVm(req.catalog, t) : undefined))
      .find(Boolean) ??
    // resolve "this VM" / "that" / "it" against the on-screen focus / baseline
    ((/\bthis\b|\bthat\b|\bit\b/.test(lower) && focusVmName
      ? findVm(req.catalog, focusVmName)
      : undefined));

  if (
    vmHit &&
    /\brate|price|cost|\$|payg|pay.?as|reserved|\bri\b|1.?yr|3.?yr|year/.test(
      lower,
    )
  ) {
    return {
      mock: true,
      content: `${vmHit.vmSizeName} (${vmHit.provider ?? '—'}, ${
        vmHit.region ?? 'default region'
      }):\n• Pay-as-you-go: ${money(vmHit.hourlyUsd)}\n• 1-year reserved: ${money(
        vmHit.riOneYrHourlyUsd,
      )}\n• 3-year reserved: ${money(
        vmHit.riThreeYrHourlyUsd,
      )}\nSpecs: ${vmHit.vcpus} vCPU · ${vmHit.memoryGib} GiB · ${
        vmHit.networkMbps
      } Mbps.`,
    };
  }
  if (
    vmHit &&
    /\bspec|vcpu|cpu|core|memory|ram|gib|network|how (big|large)|size/.test(
      lower,
    )
  ) {
    return {
      mock: true,
      content: `${vmHit.vmSizeName} (${vmHit.provider ?? '—'}): ${
        vmHit.vcpus
      } vCPU · ${vmHit.memoryGib} GiB RAM · ${vmHit.networkMbps} Mbps network${
        vmHit.localDiskGib ? ` · ${vmHit.localDiskGib} GiB local disk` : ''
      }. Category: ${vmHit.category ?? '—'}. Processor: ${
        vmHit.processor || '—'
      }.`,
    };
  }

  // Catalog freshness / counts.
  if (/\b(how (current|fresh|recent|up.?to.?date)|as of|when.*(refresh|updated)|refresh)\b/.test(lower)) {
    const cat = catalogSummary(req.catalog);
    return {
      mock: true,
      content: `The catalog holds ${cat.total.toLocaleString()} VM sizes across ${Object.keys(
        cat.byProvider,
      ).join('/')} and ${cat.regions} regions. Rates are as of ${
        cat.asOf
      }, refreshed automatically every Monday at 07:00 UTC (pay-as-you-go, 1-year and 3-year reserved).`,
    };
  }
  if (/\bhow many\b.*\b(vm|size|sku|catalog|region|provider|cloud)/.test(lower)) {
    const cat = catalogSummary(req.catalog);
    return {
      mock: true,
      content: `${cat.total.toLocaleString()} VM sizes — ${Object.entries(
        cat.byProvider,
      )
        .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
        .join(' · ')} — spanning ${cat.regions} regions.`,
    };
  }

  // Curated help: match an FAQ or concept by keyword overlap.
  const help = matchHelp(q);
  if (help) return { mock: true, content: help };

  // Page-aware "what's on this page" / generic.
  if (/\b(what|which).*(page|here|this|on screen|showing|do)\b/.test(lower)) {
    const f = req.context.facts.map((x) => `• ${x.label}: ${x.value}`).join('\n');
    return {
      mock: true,
      content: `${req.context.title} — ${req.context.summary}\n\n${f}`,
    };
  }

  // Nothing local matched: steer, don't fabricate.
  return {
    mock: true,
    content: `I can answer that once the live model is connected. Right now I answer directly from this page's data — try asking about a specific VM's rate or specs, region equivalency, the last run's results, or how current the rates are.\n\nOn this page: ${req.context.summary}`,
  };
}

function matchHelp(q: string): string | null {
  const words = new Set(
    q
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4),
  );
  if (words.size === 0) return null;
  let best: { score: number; text: string } | null = null;
  const score = (hay: string): number => {
    const h = hay.toLowerCase();
    let s = 0;
    words.forEach((w) => {
      if (h.includes(w)) s += 1;
    });
    return s;
  };
  for (const f of FAQS) {
    const s = score(f.q + ' ' + f.a.join(' '));
    if (s >= 2 && (!best || s > best.score)) {
      best = { score: s, text: f.a.join('\n\n') };
    }
  }
  for (const c of CONCEPTS) {
    const bodyText = c.body
      .map((b) => ('text' in b ? b.text : 'items' in b ? b.items.join(' ') : ''))
      .join(' ');
    const s = score(c.title + ' ' + c.summary + ' ' + c.tags.join(' '));
    if (s >= 2 && (!best || s > best.score)) {
      best = { score: s, text: `${c.summary}\n\n${bodyText}`.slice(0, 700) };
    }
  }
  return best?.text ?? null;
}

/** The deterministic, no-network responder. Kept exported + intact. */
export class MockProvider implements TerminalProvider {
  async ask(req: TerminalRequest): Promise<TerminalReply> {
    return mockAnswer(req);
  }
}

/** localStorage key for a no-UI browser BYO-key escape hatch (read only). */
const BYO_KEY_STORAGE = 'vmcap:anthropicKey';
/** The serverless proxy that holds the key server-side. */
const PROXY_PATH = '/api/terminal';
const ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

/** Read the optional BYO key from localStorage (safe in any environment). */
function readByoKey(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const k = localStorage.getItem(BYO_KEY_STORAGE);
    return k && k.trim() ? k.trim() : null;
  } catch {
    return null;
  }
}

/** Map TerminalTurn history + the new question into Anthropic `messages`. */
function toAnthropicMessages(
  req: TerminalRequest,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const msgs = req.history.map((t) => ({ role: t.role, content: t.content }));
  msgs.push({ role: 'user', content: req.question });
  return msgs;
}

/** Pull the joined text out of an Anthropic Messages API response body. */
function extractContent(data: unknown): string {
  const blocks = (data as { content?: Array<{ type?: string; text?: string }> })
    ?.content;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('');
}

/**
 * The real Claude transport behind `getProvider()`.
 *
 * - Guardrails are enforced LOCALLY FIRST (exactly like mockAnswer) — refused
 *   questions never touch the network, so the capacity silo holds even with a
 *   real model behind it.
 * - System prompt comes from `buildSystemPrompt(req.context)`; model from
 *   `TERMINAL_MODEL`. History + the new question map into Anthropic `messages`.
 * - Transport: a BYO key in localStorage (`vmcap:anthropicKey`) → call the
 *   Anthropic API directly from the browser; else POST the serverless proxy
 *   (`/api/terminal`) which holds the key server-side.
 * - On ANY failure (network error, 404 in dev, 503 not-configured, 502 upstream,
 *   malformed response) it falls back to `mockAnswer(req)` badged `mock: true`,
 *   so the Terminal degrades gracefully and is always usable pre-key.
 */
class LiveProvider implements TerminalProvider {
  async ask(req: TerminalRequest): Promise<TerminalReply> {
    const q = req.question.trim();

    // Guardrails FIRST — never send these to the network (silo holds).
    if (isSecretSauceQuestion(q)) {
      return { content: SECRET_SAUCE_REFUSAL, refused: true };
    }
    if (isOutOfSiloQuestion(q)) {
      return { content: OUT_OF_SILO_REFUSAL, refused: true };
    }

    try {
      const system = buildSystemPrompt(req.context);
      const messages = toAnthropicMessages(req);
      const byoKey = readByoKey();

      let resp: Response;
      if (byoKey) {
        // Browser BYO-key path — talk to Anthropic directly.
        resp = await fetch(ANTHROPIC_DIRECT_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': byoKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: TERMINAL_MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages,
          }),
        });
      } else {
        // Preferred path — the serverless proxy holds the key server-side.
        resp = await fetch(PROXY_PATH, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ system, messages, model: TERMINAL_MODEL }),
        });
      }

      if (!resp.ok) {
        // 503 not-configured, 502 upstream, 404 in dev, etc. → fall back.
        return { ...mockAnswer(req), mock: true };
      }

      const data = await resp.json();
      // The proxy returns { content }; the direct API returns { content: [...] }.
      const content =
        typeof (data as { content?: unknown })?.content === 'string'
          ? ((data as { content: string }).content)
          : extractContent(data);

      if (!content) return { ...mockAnswer(req), mock: true };
      return { content };
    } catch {
      // Network failure / malformed response → graceful mock fallback.
      return { ...mockAnswer(req), mock: true };
    }
  }
}

let singleton: TerminalProvider | null = null;

/**
 * Return the active provider — the LiveProvider singleton, which calls the real
 * Claude transport (serverless proxy preferred, browser BYO-key escape hatch)
 * and transparently falls back to the deterministic mock on any failure so the
 * Terminal never breaks before a key is configured. The Terminal UI is
 * unchanged regardless of which path serves a given turn.
 */
export function getProvider(): TerminalProvider {
  if (!singleton) singleton = new LiveProvider();
  return singleton;
}

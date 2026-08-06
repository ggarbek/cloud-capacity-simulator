/**
 * api/terminal — the Terminal's serverless transport (Vercel function).
 *
 * The PREFERRED path for the live Terminal: the Anthropic API key lives here,
 * server-side, never shipped to the browser. The client POSTs the already-built
 * { system, messages, model } payload; this function forwards it to the
 * Anthropic Messages REST API and returns a single { content } string.
 *
 * Guardrails (capacity-siloed · no personal info · data-not-secret-sauce) are
 * enforced CLIENT-SIDE in provider.ts BEFORE the request ever reaches here, so
 * refused questions never hit the network. This function is a thin, dependency-
 * free proxy (raw fetch — no SDK).
 *
 * Contract:
 *   POST { system: string, messages: {role,content}[], model: string }
 *     200 → { content: string }            (success, non-streaming single-shot)
 *     503 → { error: 'not-configured' }    (no ANTHROPIC_API_KEY — client falls back to the mock)
 *     502 → { error: 'upstream', detail }  (Anthropic returned an error)
 *     400 → { error: 'bad-request' }       (malformed body)
 *     405 → { error: 'method-not-allowed' }
 *
 * To go live: set the ANTHROPIC_API_KEY environment variable in the Vercel
 * project. Without it, this returns 503 and the Terminal transparently uses the
 * deterministic mock — the surface never breaks.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TerminalProxyRequest {
  system?: string;
  messages?: AnthropicMessage[];
  model?: string;
}

// Minimal Vercel handler signature — no @vercel/node dependency required.
interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // Same-origin only: this proxy is meant to be called by the app it ships with.
  // We don't emit permissive CORS headers (no Access-Control-Allow-Origin: *),
  // so cross-origin browser callers are blocked by the browser. Same-origin
  // requests don't need a CORS preflight at all.
  if (req.method === 'OPTIONS') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Not configured yet — tell the client to fall back to the mock cleanly.
    res.status(503).json({ error: 'not-configured' });
    return;
  }

  // Parse the body (Vercel usually parses JSON automatically, but be defensive).
  let payload: TerminalProxyRequest;
  try {
    payload =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as TerminalProxyRequest)
        : ((req.body ?? {}) as TerminalProxyRequest);
  } catch {
    res.status(400).json({ error: 'bad-request' });
    return;
  }

  const { system, messages, model } = payload;
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'bad-request' });
    return;
  }

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      res.status(502).json({ error: 'upstream', detail: detail.slice(0, 500) });
      return;
    }

    const data = (await upstream.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const content = Array.isArray(data.content)
      ? data.content
          .filter((b) => b?.type === 'text' && typeof b.text === 'string')
          .map((b) => b.text)
          .join('')
      : '';

    if (!content) {
      res.status(502).json({ error: 'upstream', detail: 'empty-response' });
      return;
    }

    res.status(200).json({ content });
  } catch (err) {
    res.status(502).json({
      error: 'upstream',
      detail: err instanceof Error ? err.message : 'fetch-failed',
    });
  }
}

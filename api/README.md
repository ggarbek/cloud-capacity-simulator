# `api/` — serverless functions

## `api/terminal.ts` — the live Terminal proxy

The in-dashboard **Terminal** ("Ask" assistant) talks to Claude through this
Vercel serverless function. The function reads the Anthropic API key
**server-side** and forwards the page-contextual prompt to the Anthropic Messages
REST API — so the key is never shipped to the browser.

### Going live

Set **one** environment variable in the Vercel project:

```
ANTHROPIC_API_KEY = sk-ant-...
```

That's it. With the key set, the Terminal uses the real `claude-sonnet-4-6`
model (the `TERMINAL_MODEL` constant in `src/terminal/prompt.ts`).

### Without the key (default)

If `ANTHROPIC_API_KEY` is **not** set, `api/terminal` returns HTTP `503`
(`{ error: 'not-configured' }`) and the Terminal **transparently falls back to
the deterministic local mock** — the surface never breaks. The same graceful
fallback covers any network error, a `404` in local dev (no serverless runtime),
or a malformed/empty upstream response.

### Transport selection (client side, `src/terminal/provider.ts`)

`LiveProvider`:

1. Enforces the capacity-silo guardrails **locally first**
   (`isSecretSauceQuestion` / `isOutOfSiloQuestion`) — refused questions never
   touch the network.
2. If a BYO key exists in `localStorage` under `vmcap:anthropicKey`, it calls the
   Anthropic API **directly from the browser** (no-UI escape hatch; read-only —
   there is no key-entry UI).
3. Otherwise it POSTs `/api/terminal` (this function — the preferred path).

Returned real answers are unbadged; only guardrail refusals carry `refused: true`,
and only mock-fallback replies carry `mock: true`.

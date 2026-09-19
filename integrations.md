# AI Model Routing

Ghost Web AI uses **OpenRouter** as its optional multi-model gateway. OpenRouter exposes a unified OpenAI-compatible API across 200+ models and provides a free router that selects an available free model automatically.

## Environment variables

Configure these in the project Keys/Environment settings. Never commit them or expose them to the browser.

- `OPENROUTER_API_KEY`: server-side OpenRouter key
- `OPENROUTER_MODEL`: optional explicit OpenRouter model ID; defaults to `openrouter/free`
- `OPENROUTER_SITE_URL`: optional application URL sent as OpenRouter attribution metadata
- `OLLAMA_ENABLED`: optional `true`/`false`; enables the keyless Ollama provider
- `OLLAMA_BASE_URL`: optional reachable Ollama URL, such as `http://127.0.0.1:11434`
- `OLLAMA_MODEL`: optional local model, defaulting to `qwen2.5-coder:7b`

Ollama requires no API key. In local development, start Ollama and run `ollama pull qwen2.5-coder:7b`, then set `OLLAMA_ENABLED=true`. For a hosted Convex deployment, `OLLAMA_BASE_URL` must point to a network-reachable Ollama server; a developer laptop's `localhost` is not reachable from Convex.

The current app also supports these optional direct-provider fallbacks:

- `ANTHROPIC_API_KEY`
- `SAMBANOVA_API_KEY` or `SAMBA_API_KEY`
- `OPENAI_API_KEY` with optional `OPENAI_BASE_URL`

Puter.js is also available as an explicit browser-only engine. It loads `https://js.puter.com/v2/`, authenticates the user with Puter when needed, and calls `puter.ai.chat()` without a developer API key. It is intentionally limited to prompts without a repository target; private repository context and GitHub operations stay inside Convex.

If no provider key is configured, Ghost uses its deterministic local engine.

## Routing behavior

AI requests run inside `src/convex/ghost/actions.ts` with this priority:

1. Puter.js browser mode when explicitly selected for non-repository prompts
2. Ollama when enabled (keyless local/self-hosted model)
3. OpenRouter using `OPENROUTER_API_KEY`
4. Anthropic
5. SambaNova
6. OpenAI-compatible endpoint
7. Local deterministic engine

The default OpenRouter model is `openrouter/free`. The model selector can request a catalog model, while the server safely maps legacy catalog aliases to compatible OpenRouter free routes. Set `OPENROUTER_MODEL` when a specific OpenRouter model is preferred.

The repository also includes an optional generic gateway client in `src/lib/ai-gateway.ts`. It supports runtime model discovery through `GET /v1/models` when `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL` are configured, but it is not required for the default OpenRouter path.

## Security

- API keys are read only by Convex actions.
- The React client receives only non-secret readiness metadata.
- Puter.js is opt-in and user-authorized; it is never sent private repository context.
- Repository context remains server-side during provider calls.
- Provider failures fall through to the next configured provider or local engine.
- Ollama probes use a short timeout so an unavailable local server does not block hosted runs.
- Free-tier availability and rate limits are controlled by OpenRouter and can change over time.

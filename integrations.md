# Ghost Web AI — AI integrations

Ghost Web AI no longer requires the legacy VLY integration or `VLY_INTEGRATION_KEY`.

## AI engine modes

- **Local engine:** zero API keys and no VLY dependency. This is the built-in fallback planner.
- **LLM planner:** optionally uses server-side provider keys such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `SAMBANOVA_API_KEY`.
- **AI Gateway:** the app can use the OpenAI-compatible gateway configured with `AI_GATEWAY_API_KEY` and `AI_GATEWAY_BASE_URL`.

## Environment

`AI_GATEWAY_API_KEY` and provider keys are server-side only. Never expose them through `VITE_*` variables or commit them to Git.

The VLY integration package and `VLY_INTEGRATION_KEY` are intentionally not required. Existing workspaces may still show a legacy VLY environment warning, but the application does not need that key after this cleanup.

## Model discovery

The gateway client discovers available models from `GET /v1/models` and filters the curated list in `src/lib/ai-gateway.ts` against the live catalogue before displaying a model.

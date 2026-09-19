// OpenRouter configuration for server-side Convex actions.
// Never import this module from browser code.

const OPENROUTER_KEY = "OPENROUTER_API_KEY";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_FREE_MODEL = "openrouter/free";

/** Resolve legacy catalog IDs to OpenRouter IDs while keeping the UI stable. */
const MODEL_ALIASES: Record<string, string> = {
  "openai/gpt-5.4": "openrouter/free",
  "openai/gpt-5-mini": "openrouter/free",
  "anthropic/claude-opus-4.6": "openrouter/free",
  "anthropic/claude-sonnet-5": "openrouter/free",
  "google/gemini-3.1-pro": "openrouter/free",
  "google/gemini-3.1-flash": "openrouter/free",
  "xai/grok-4.20": "openrouter/free",
  "meta/llama-4-maverick": "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3.6-plus": "qwen/qwen-2.5-coder-32b-instruct:free",
  "google/gemma-4-31b": "google/gemma-3-27b-it:free",
  "deepseek/deepseek-v3": "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1": "deepseek/deepseek-r1:free",
  "mistral/mistral-large": "mistralai/mistral-small-3.1-24b-instruct:free",
  "cohere/command-r-plus": "openrouter/free",
  "microsoft/phi-4": "microsoft/phi-4:free",
};

export function resolveOpenRouterModel(selectedModel?: string): string {
  const requested = selectedModel?.trim();
  return (requested && (MODEL_ALIASES[requested] ?? requested)) ||
    process.env.OPENROUTER_MODEL?.trim() ||
    OPENROUTER_FREE_MODEL;
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env[OPENROUTER_KEY]?.trim());
}

/** Safe status for UI/diagnostics; never includes the API key. */
export function getOpenRouterConfigStatus() {
  return {
    configured: isOpenRouterConfigured(),
    requiredEnvVar: OPENROUTER_KEY,
    provider: "OpenRouter",
    modelCount: 200,
    freeRouting: true,
    serverOnly: true,
    fallbackAvailable: true,
  } as const;
}

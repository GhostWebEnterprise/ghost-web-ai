// Ollama configuration for server-side Convex actions.
// Never import this module from browser code.

export const OLLAMA_DEFAULT_BASE_URL = "http://127.0.0.1:11434";
export const OLLAMA_DEFAULT_MODEL = "qwen2.5-coder:7b";

export function getOllamaBaseUrl(): string {
  return (
    process.env.OLLAMA_BASE_URL?.trim().replace(/\/$/, "") ||
    OLLAMA_DEFAULT_BASE_URL
  );
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || OLLAMA_DEFAULT_MODEL;
}

/**
 * Ollama needs no API key. It is enabled when explicitly requested or when a
 * reachable base URL is configured; hosted deployments stay probe-free by
 * default instead of waiting on an unavailable localhost service.
 */
export function isOllamaEnabled(): boolean {
  const flag = process.env.OLLAMA_ENABLED?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return Boolean(process.env.OLLAMA_BASE_URL?.trim());
}

export function getOllamaConfigStatus() {
  return {
    enabled: isOllamaEnabled(),
    provider: "Ollama",
    model: getOllamaModel(),
    baseUrlConfigured: Boolean(process.env.OLLAMA_BASE_URL?.trim()),
    serverOnly: true,
    apiKeyRequired: false,
  } as const;
}

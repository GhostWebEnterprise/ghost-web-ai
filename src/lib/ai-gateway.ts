/**
 * Vercel AI Gateway integration.
 *
 * The gateway is OpenAI-compatible. Model IDs are discovered at runtime from
 * /v1/models so the app does not depend on a stale hard-coded catalogue.
 *
 * Server-side only: never expose AI_GATEWAY_API_KEY to Vite/client code.
 */
export const AI_GATEWAY_BASE_URL =
  process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1";

export const VERIFIED_MODEL_IDS = [
  "openai/gpt-5.6-luna",
  "openai/gpt-5.6-luna-fast",
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-sol-fast",
  "openai/gpt-5.6-terra",
  "openai/gpt-6-astra",
  "openai/gpt-6-astra-fast",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.6",
  "anthropic/claude-opus-4.7",
  "anthropic/claude-opus-4.8",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "alibaba/qwen-3-14b",
  "alibaba/qwen-3-32b",
  "alibaba/qwen3-coder",
  "alibaba/qwen3-coder-next",
  "alibaba/qwen3-max",
  "deepseek/deepseek-v3.2",
  "meta/llama-4-scout",
  "meta/llama-4-maverick",
] as const;

export type GatewayModel = {
  id: string;
  object: "model";
  owned_by?: string;
  name?: string;
  type?: string;
  context_window?: number;
  modalities?: { input?: string[]; output?: string[] };
  tags?: string[];
};

type ModelsResponse = { data: GatewayModel[] };

function authHeaders(): HeadersInit {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not configured. Configure it server-side; never expose it as VITE_*."
    );
  }

  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export async function listGatewayModels(): Promise<GatewayModel[]> {
  const response = await fetch(`${AI_GATEWAY_BASE_URL}/models`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`AI Gateway /models failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ModelsResponse;
  return payload.data;
}

export async function listVerifiedGatewayModels(): Promise<GatewayModel[]> {
  const models = await listGatewayModels();
  const available = new Set(models.map((model) => model.id));
  return VERIFIED_MODEL_IDS.filter((id) => available.has(id))
    .map((id) => models.find((model) => model.id === id)!)
    .filter(Boolean);
}

export async function chatCompletion(
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: { temperature?: number; max_tokens?: number } = {}
) {
  const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      messages,
      ...options,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI Gateway chat failed: HTTP ${response.status}: ${body}`);
  }

  return response.json();
}

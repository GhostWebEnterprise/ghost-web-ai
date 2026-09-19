export type AssistantCapability = "build" | "slides" | "video" | "bot";

export interface AssistantCapabilityMeta {
  id: AssistantCapability;
  label: string;
  description: string;
  promptHint: string;
  chip: string;
}

export const ASSISTANT_CAPABILITIES: AssistantCapabilityMeta[] = [
  {
    id: "build",
    label: "Build apps",
    description: "Plan, code, test, self-heal, and ship a real feature.",
    promptHint: "Turn this into an implementation plan with complete files and verification steps.",
    chip: "bg-[#00ff41] text-black",
  },
  {
    id: "slides",
    label: "Create slides",
    description: "Shape a narrative, slide outline, speaker notes, and visual direction.",
    promptHint: "Create a presentation-ready deck outline with slide copy, speaker notes, and visual prompts.",
    chip: "bg-[#ff9e64] text-black",
  },
  {
    id: "video",
    label: "Make videos",
    description: "Write a production-ready storyboard, shots, voiceover, and edit plan.",
    promptHint: "Create a video production brief with scenes, shots, voiceover, captions, and asset prompts.",
    chip: "bg-[#b083f0] text-black",
  },
  {
    id: "bot",
    label: "Always-on bots",
    description: "Design a persistent bot with triggers, tools, memory, and safety rules.",
    promptHint: "Design an always-on bot with triggers, schedule, tools, memory, escalation, and observability.",
    chip: "bg-[#4dd8e6] text-black",
  },
];

export type AssistantAgentId =
  | "builder"
  | "researcher"
  | "rag"
  | "review-panel"
  | "workflow-architect"
  | "memory"
  | "reviewer";

export interface AssistantAgent {
  id: AssistantAgentId;
  label: string;
  description: string;
  bestFor: AssistantCapability[];
}

/** Internal profiles distilled from the referenced open-source agent catalogs. */
export const ASSISTANT_AGENTS: AssistantAgent[] = [
  {
    id: "builder",
    label: "Builder",
    description: "Coding-agent behavior: inspect, implement, verify, and prepare a PR.",
    bestFor: ["build", "bot"],
  },
  {
    id: "researcher",
    label: "Deep researcher",
    description: "Plan-and-execute research with source-aware findings, comparisons, and risks.",
    bestFor: ["build", "slides", "video", "bot"],
  },
  {
    id: "rag",
    label: "Agentic RAG",
    description: "Choose context, grade evidence, retry weak retrieval, and mark uncertainty.",
    bestFor: ["build", "slides", "bot"],
  },
  {
    id: "review-panel",
    label: "Review panel",
    description: "Have specialist passes critique the same plan before implementation proceeds.",
    bestFor: ["build", "slides", "video", "bot"],
  },
  {
    id: "workflow-architect",
    label: "Workflow architect",
    description: "Define triggers, tools, memory, retries, schedules, and operational handoffs.",
    bestFor: ["bot", "build"],
  },
  {
    id: "memory",
    label: "Memory keeper",
    description: "Carry forward durable preferences, decisions, constraints, and project context.",
    bestFor: ["build", "bot", "slides"],
  },
  {
    id: "reviewer",
    label: "Safety reviewer",
    description: "Check permissions, privacy, prompt injection, validation, and failure paths.",
    bestFor: ["build", "slides", "video", "bot"],
  },
];

export interface AssistantModel {
  id: string;
  label: string;
  family: string;
  bestFor: AssistantCapability[];
  note?: string;
}

/** Models routed through VLY; the gateway accepts additional IDs server-side. */
export const ASSISTANT_MODELS: AssistantModel[] = [
  { id: "openai/gpt-5.4", label: "GPT-5.4", family: "OpenAI", bestFor: ["build", "slides", "bot"] },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", family: "OpenAI", bestFor: ["build", "bot"] },
  { id: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", family: "Anthropic", bestFor: ["build", "slides", "video", "bot"] },
  { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5", family: "Anthropic", bestFor: ["build", "slides", "bot"] },
  { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro", family: "Google", bestFor: ["build", "slides", "video"] },
  { id: "google/gemini-3.1-flash", label: "Gemini 3.1 Flash", family: "Google", bestFor: ["build", "video", "bot"] },
  { id: "xai/grok-4.20", label: "Grok 4.20", family: "xAI", bestFor: ["build", "slides", "bot"] },
  { id: "meta/llama-4-maverick", label: "Llama 4 Maverick", family: "Meta", bestFor: ["build", "bot"] },
  { id: "qwen/qwen3.6-plus", label: "Qwen3.6 Plus", family: "Qwen", bestFor: ["build", "bot"] },
  { id: "google/gemma-4-31b", label: "Gemma 4 31B", family: "Google", bestFor: ["build", "bot"] },
  { id: "deepseek/deepseek-v3", label: "DeepSeek V3", family: "DeepSeek", bestFor: ["build", "bot"] },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", family: "DeepSeek", bestFor: ["build", "bot"] },
  { id: "mistral/mistral-large", label: "Mistral Large", family: "Mistral", bestFor: ["build", "slides"] },
  { id: "cohere/command-r-plus", label: "Command R+", family: "Cohere", bestFor: ["build", "bot"] },
  { id: "microsoft/phi-4", label: "Phi-4", family: "Microsoft", bestFor: ["build", "bot"] },
];

export const DEFAULT_ASSISTANT_MODEL = "openai/gpt-5-mini";
export const DEFAULT_ASSISTANT_AGENT: AssistantAgentId = "builder";

export function capabilityMeta(id: AssistantCapability): AssistantCapabilityMeta {
  return ASSISTANT_CAPABILITIES.find((item) => item.id === id) ?? ASSISTANT_CAPABILITIES[0];
}

export function agentMeta(id: AssistantAgentId): AssistantAgent {
  return ASSISTANT_AGENTS.find((item) => item.id === id) ?? ASSISTANT_AGENTS[0];
}

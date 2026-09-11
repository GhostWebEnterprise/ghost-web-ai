// Ghost Web AI — MCP tool manifest + A2A agent card builders.
// Pure TypeScript, no imports — consumed by src/convex/mcp.ts HTTP actions
// and unit-tested directly.

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Public tools run without auth; authed ones require a signed-in user. */
  auth: "public" | "user";
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

/** Tools this deployment exposes over the MCP-style JSON interface. */
export function buildMcpToolManifest(siteUrl: string | null): {
  protocol: string;
  name: string;
  version: string;
  url: string | null;
  tools: McpToolDef[];
} {
  return {
    protocol: "mcp/1.0",
    name: "ghost-web-ai",
    version: "1.0.0",
    url: siteUrl,
    tools: [
      {
        name: "ghost.classify",
        description:
          "Classify a plain-language task into engine flags (web/android/desktop/api/deploy/chat/auth/data) without running anything.",
        auth: "public",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "Plain-language build task" },
          },
          required: ["task"],
        },
      },
      {
        name: "ghost.plan",
        description:
          "Build the deterministic agent pipeline for a task: stage ids, agents, titles, in execution order.",
        auth: "public",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "Plain-language build task" },
          },
          required: ["task"],
        },
      },
      {
        name: "ghost.parseRepo",
        description:
          "Normalize a GitHub URL (https, ssh or owner/name) into repo metadata.",
        auth: "public",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "GitHub repo URL or slug" },
          },
          required: ["url"],
        },
      },
      {
        name: "ghost.teamPlan",
        description:
          "Build the multi-agent task-force graph for a task: 15 specialized agents, dependency waves, blocking security/license gates and write-serialized scheduling.",
        auth: "public",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string", description: "Plain-language build task" },
          },
          required: ["task"],
        },
      },
      {
        name: "ghost.runChain",
        description:
          "Start a full agent-chain run in a conversation (auth required; streams stages back over Convex subscriptions).",
        auth: "user",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string" },
            repoUrl: { type: "string" },
          },
          required: ["task"],
        },
      },
    ],
  };
}

/** A2A-style agent card describing this Ghost deployment. */
export function buildAgentCard(siteUrl: string | null): {
  name: string;
  description: string;
  url: string | null;
  version: string;
  capabilities: Record<string, boolean>;
  skills: A2ASkill[];
} {
  return {
    name: "Ghost Web AI",
    description:
      "Agent chain: plain-language task → license gate → plan → branch → code → self-heal → CI → fix → commit → GitHub PR → verify.",
    url: siteUrl,
    version: "1.0.0",
    capabilities: {
      streaming: true, // pipeline progress streams via Convex subscriptions
      pushNotifications: false,
      stateTransitionHistory: true, // messages table keeps full run history
    },
    skills: [
      {
        id: "plan-chain",
        name: "Plan the agent chain",
        description: "Deterministic pipeline assembly from a task description.",
        tags: ["planning", "pipeline"],
      },
      {
        id: "implement-web",
        name: "Implement web features",
        description: "Writes typed web code against the real repo tree.",
        tags: ["web", "typescript"],
      },
      {
        id: "implement-android",
        name: "Implement Android modules",
        description: "Gradle build + unit tests for Android-targeted tasks.",
        tags: ["android", "kotlin"],
      },
      {
        id: "compat-desktop",
        name: "Desktop compatibility pass",
        description: "Cross-OS runtime checks: macOS Big Sur → current, Windows, Linux.",
        tags: ["desktop", "compatibility"],
      },
      {
        id: "self-heal",
        name: "Guardian self-heal",
        description: "Detects diff issues and CI errors, fixes and re-runs until green.",
        tags: ["ci", "fix-loop"],
      },
      {
        id: "github-pr",
        name: "GitHub PR delivery",
        description: "Real branch, commit and pull request via the GitHub REST API.",
        tags: ["github", "pr"],
      },
    ],
  };
}

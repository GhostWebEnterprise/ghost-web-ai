import { httpAction } from "./_generated/server";
import { buildMcpToolManifest, buildAgentCard } from "./mcpTools";
import { classifyTask, buildPipeline, parseRepoUrl } from "./ghost/plan";
import { buildTeamGraph, TEAM_AGENTS } from "./ghost/team";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * MCP-style tool manifest + tool invocation endpoint.
 * GET /mcp — manifest
 * POST /mcp — { tool, args } invoke (public tools only; authed ones 401)
 */
export const mcpManifest = httpAction(async () => {
  return json(buildMcpToolManifest(process.env.SITE_URL ?? null));
});

export const mcpInvoke = httpAction(async (ctx, request) => {
  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = (await request.json()) as { tool?: string; args?: Record<string, unknown> };
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const manifest = buildMcpToolManifest(null);
  const tool = manifest.tools.find((t) => t.name === body.tool);
  if (!tool) {
    return json(
      { error: "unknown tool", available: manifest.tools.map((t) => t.name) },
      404,
    );
  }
  if (tool.auth === "user") {
    // Authed tools need a Convex session; public HTTP MCP callers are anonymous.
    return json({ error: "authentication required for this tool" }, 401);
  }

  const args = body.args ?? {};
  try {
    switch (tool.name) {
      case "ghost.classify": {
        const task = String(args.task ?? "");
        if (!task.trim()) return json({ error: "task is required" }, 400);
        return json({ tool: tool.name, result: classifyTask(task) });
      }
      case "ghost.plan": {
        const task = String(args.task ?? "");
        if (!task.trim()) return json({ error: "task is required" }, 400);
        return json({ tool: tool.name, result: buildPipeline(task) });
      }
      case "ghost.teamPlan": {
        const task = String(args.task ?? "");
        if (!task.trim()) return json({ error: "task is required" }, 400);
        const graph = buildTeamGraph(task);
        return json({
          tool: tool.name,
          result: {
            agents: TEAM_AGENTS.length,
            profile: graph.profile,
            nodes: graph.nodes.map((n) => ({
              id: n.id,
              agent: n.agent,
              kind: n.kind,
              deps: n.deps,
              writes: n.writes,
            })),
          },
        });
      }
      case "ghost.parseRepo": {
        const url = String(args.url ?? "");
        const result = parseRepoUrl(url);
        if (!result) return json({ error: "could not parse repo url" }, 400);
        return json({ tool: tool.name, result });
      }
      default:
        return json({ error: "tool not wired" }, 500);
    }
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "tool execution failed" },
      500,
    );
  }
});

/** A2A-style agent card discovery. */
export const agentCard = httpAction(async () => {
  return json(buildAgentCard(process.env.SITE_URL ?? null));
});

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../users";
import { teamNodeValidator, teamSharedValidator } from "../schema";
import {
  buildTeamGraph,
  type TeamNode,
  type TeamShared,
} from "./team";

const NOW = () => Date.now();

/** Create a task-force run: graph built from the task, orchestrator dispatch armed. */
export const startTeamRun = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    task: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to run the agent task force.");
    const task = args.task.trim();
    if (!task) throw new Error("Describe what you want the task force to do.");
    if (args.conversationId) {
      const conversation = await ctx.db.get(args.conversationId);
      if (!conversation || conversation.ownerId !== user._id) {
        throw new Error("Conversation not found.");
      }
    }

    const graph = buildTeamGraph(task);
    const now = NOW();
    const shared: TeamShared = { files: [], notes: [] };
    const nodes: TeamNode[] = graph.nodes.map((n) => ({ ...n, logs: [] }));

    const id = await ctx.db.insert("ghostTeams", {
      ownerId: user._id,
      conversationId: args.conversationId,
      task,
      status: "running",
      nodes,
      shared,
      events: [
        { at: now, agent: "orchestrator", text: `Task force dispatched — “${task.slice(0, 80)}”` },
      ],
      createdAt: now,
      updatedAt: now,
    });
    return { teamId: String(id), nodes };
  },
});

const NODE = v.object(teamNodeValidator.fields);

/** Owner approves an open gate node — the graph then advances past it. */
export const approveGate = mutation({
  args: { teamId: v.id("ghostTeams"), nodeId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in first.");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) throw new Error("Task-force run not found.");
    const node = team.nodes.find((n) => n.id === args.nodeId);
    if (!node) throw new Error("Node not found.");
    if (node.kind !== "gate" || node.status !== "awaiting") {
      throw new Error("Node is not an open gate.");
    }
    const nodes = team.nodes.map((n) =>
      n.id === args.nodeId
        ? {
            ...n,
            status: "done" as const,
            approved: true,
            detail: `${n.detail ?? "Scan clean."} — approved by the owner.`,
            logs: [...n.logs, `owner: ✓ approved — ${n.agent} gate passed`],
          }
        : n,
    );
    await ctx.db.patch(args.teamId, {
      nodes,
      status: "running",
      events: [
        ...team.events,
        { at: NOW(), agent: "owner", text: `Approved the ${node.agent} gate (${node.id})` },
      ],
      updatedAt: NOW(),
    });
  },
});

/** Owner rejects an open gate — all downstream work is skipped and the run stops. */
export const rejectGate = mutation({
  args: { teamId: v.id("ghostTeams"), nodeId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in first.");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) throw new Error("Task-force run not found.");
    const node = team.nodes.find((n) => n.id === args.nodeId);
    if (!node) throw new Error("Node not found.");
    if (node.kind !== "gate" || node.status !== "awaiting") {
      throw new Error("Node is not an open gate.");
    }

    const blocked = new Set<string>([args.nodeId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of team.nodes) {
        if (blocked.has(n.id)) continue;
        if (n.deps.some((d) => blocked.has(d))) {
          blocked.add(n.id);
          grew = true;
        }
      }
    }
    const nodes = team.nodes.map((n) =>
      n.id === args.nodeId
        ? { ...n, status: "error" as const, approved: false, detail: "Rejected by the owner." }
        : blocked.has(n.id) && n.status === "pending"
          ? { ...n, status: "skipped" as const, detail: "Blocked by a rejected gate." }
          : n,
    );
    await ctx.db.patch(args.teamId, {
      nodes,
      status: "stopped",
      events: [
        ...team.events,
        { at: NOW(), agent: "owner", text: `Rejected the ${node.agent} gate — ${blocked.size - 1} downstream node(s) skipped` },
      ],
      updatedAt: NOW(),
    });
  },
});

/** Abort a running task force (idempotent; keeps the graph for the record). */
export const stopTeamRun = mutation({
  args: { teamId: v.id("ghostTeams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) return;
    if (team.status !== "running" && team.status !== "awaiting") return;
    const nodes = team.nodes.map((n) =>
      n.status === "pending" || n.status === "awaiting"
        ? { ...n, status: "skipped" as const, detail: "Run stopped by the owner." }
        : n,
    );
    await ctx.db.patch(args.teamId, {
      nodes,
      status: "stopped",
      events: [
        ...team.events,
        { at: NOW(), agent: "owner", text: "Task force stopped" },
      ],
      updatedAt: NOW(),
    });
  },
});

// Keep the validators referenced for generated API cleanliness.
export const _teamValidators = { NODE, shared: teamSharedValidator };

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../users";
import { runFileValidator } from "../schema";
import { buildPipeline, parseRepoUrl, truncate, type PlanStage } from "./plan";

const NOW = () => Date.now();

/** Create a conversation/session from the first task a user types. */
export const createConversation = mutation({
  args: {
    task: v.string(),
    repoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to start a build session.");
    const task = args.task.trim();
    if (!task) throw new Error("Describe what you want to build.");

    const repo = parseRepoUrl(args.repoUrl);
    const now = NOW();
    const title = repo
      ? truncate(`${repo.fullName} — ${task}`, 64)
      : truncate(task, 56);

    const id = await ctx.db.insert("conversations", {
      ownerId: user._id,
      title,
      repoUrl: args.repoUrl?.trim() || undefined,
      repo: repo ?? undefined,
      status: "idle",
      engine: "local",
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_seq", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(args.conversationId);
  },
});

export interface StartTaskResult {
  runId: string;
  pipeline: PlanStage[];
}

/** Record the user prompt + seed the assistant run message. */
export const startTask = mutation({
  args: {
    conversationId: v.id("conversations"),
    task: v.string(),
  },
  handler: async (ctx, args): Promise<StartTaskResult> => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to run the agent chain.");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found.");
    }
    const task = args.task.trim();
    if (!task) throw new Error("Describe what you want to build.");

    const last = await ctx.db
      .query("messages")
      .withIndex("by_conversation_seq", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .first();
    const seq = (last?.seq ?? 0) + 1;
    const now = NOW();

    const pipeline: PlanStage[] = buildPipeline(task);

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      seq,
      role: "user",
      content: task,
      createdAt: now,
    });
    const runId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      seq: seq + 1,
      role: "assistant",
      agent: "core",
      content: "Assembling the agent chain…",
      engine: "local",
      pipeline,
      runStatus: "running",
      createdAt: now + 1,
    });

    await ctx.db.patch(args.conversationId, {
      status: "running",
      engine: "local",
      runCount: conversation.runCount + 1,
      updatedAt: now,
      lastRunAt: now,
    });

    return { runId: String(runId), pipeline };
  },
});

/** Progressively patch the assistant run message from the engine action. */
export const patchRun = mutation({
  args: {
    conversationId: v.id("conversations"),
    runId: v.id("messages"),
    pipeline: v.optional(
      v.array(
        v.object({
          id: v.string(),
          agent: v.string(),
          title: v.string(),
          status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("done"),
            v.literal("error"),
            v.literal("skipped"),
          ),
          detail: v.optional(v.string()),
          logs: v.optional(v.array(v.string())),
        }),
      ),
    ),
    content: v.optional(v.string()),
    engine: v.optional(v.string()),
    runStatus: v.optional(
      v.union(v.literal("idle"), v.literal("running"), v.literal("done"), v.literal("error")),
    ),
    error: v.optional(v.string()),
    files: v.optional(v.array(runFileValidator)),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in first.");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found.");
    }
    const run = await ctx.db.get(args.runId);
    if (!run || run.conversationId !== args.conversationId) {
      throw new Error("Run not found.");
    }

    const patch: Record<string, unknown> = {};
    if (args.pipeline) patch.pipeline = args.pipeline;
    if (args.content !== undefined) patch.content = args.content;
    if (args.engine) patch.engine = args.engine;
    if (args.runStatus) patch.runStatus = args.runStatus;
    if (args.error !== undefined) patch.error = args.error;
    if (args.files) patch.files = args.files;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.runId, patch);
    }

    // When the run settles, mirror status onto the conversation row.
    if (args.runStatus && args.runStatus !== "running") {
      await ctx.db.patch(args.conversationId, {
        status: args.runStatus,
        engine: args.engine ?? conversation.engine,
        updatedAt: NOW(),
      });
    }
    if (args.engine) {
      await ctx.db.patch(args.conversationId, { engine: args.engine });
    }
  },
});

/** Store enriched repo metadata discovered by the action (GitHub API). */
export const updateRepo = mutation({
  args: {
    conversationId: v.id("conversations"),
    repo: v.object({
      fullName: v.string(),
      url: v.string(),
      source: v.union(v.literal("github"), v.literal("local")),
      description: v.optional(v.string()),
      language: v.optional(v.string()),
      license: v.optional(v.string()),
      stars: v.optional(v.number()),
      defaultBranch: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) return;
    await ctx.db.patch(args.conversationId, { repo: args.repo });
  },
});

import { v } from "convex/values";
import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  return userId;
}

// ---------------------------------------------------------------------------
// Per-user application settings (backing the Settings tab).
// Every field falls back to a safe default when the user has no row yet.
// ---------------------------------------------------------------------------

export interface AppSettings {
  engineMode: "auto" | "local" | "force_llm";
  allowCustomPipeline: boolean;
  allowRepoContext: boolean;
  prMode: "auto_pr" | "plan_only";
  defaultRepoUrl?: string;
  branchPrefix: string;
  reduceMotion: boolean;
}

export const DEFAULTS: AppSettings = {
  engineMode: "auto",
  allowCustomPipeline: true,
  allowRepoContext: true,
  prMode: "auto_pr",
  defaultRepoUrl: undefined,
  branchPrefix: "feat/",
  reduceMotion: false,
};

const argsValidator = {
  engineMode: v.union(
    v.literal("auto"),
    v.literal("local"),
    v.literal("force_llm"),
  ),
  allowCustomPipeline: v.boolean(),
  allowRepoContext: v.boolean(),
  prMode: v.union(v.literal("auto_pr"), v.literal("plan_only")),
  defaultRepoUrl: v.optional(v.string()),
  branchPrefix: v.string(),
  reduceMotion: v.boolean(),
};

/** Load the current user's settings with defaults filled in. */
export const get = query({
  args: {},
  handler: async (ctx): Promise<AppSettings> => {
    const userId = await requireUserId(ctx);
    if (!userId) return { ...DEFAULTS };
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) return { ...DEFAULTS };
    return {
      engineMode: row.engineMode,
      allowCustomPipeline: row.allowCustomPipeline,
      allowRepoContext: row.allowRepoContext,
      prMode: row.prMode,
      defaultRepoUrl: row.defaultRepoUrl,
      branchPrefix: row.branchPrefix,
      reduceMotion: row.reduceMotion,
    };
  },
});

/** Upsert settings from the Settings tab. */
export const update = mutation({
  args: argsValidator,
  handler: async (ctx, args): Promise<AppSettings> => {
    const userId = await requireUserId(ctx);
    if (!userId) throw new Error("Sign in to save settings.");

    // Light sanitization: trim + cap lengths so garbage can't bloat rows.
    const prefix = args.branchPrefix.trim().slice(0, 24);
    const repoUrl = args.defaultRepoUrl?.trim().slice(0, 300) || undefined;

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const values = {
      userId,
      engineMode: args.engineMode,
      allowCustomPipeline: args.allowCustomPipeline,
      allowRepoContext: args.allowRepoContext,
      prMode: args.prMode,
      defaultRepoUrl: repoUrl,
      branchPrefix: prefix || DEFAULTS.branchPrefix,
      reduceMotion: args.reduceMotion,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
    } else {
      await ctx.db.insert("userSettings", values);
    }
    return {
      engineMode: values.engineMode,
      allowCustomPipeline: values.allowCustomPipeline,
      allowRepoContext: values.allowRepoContext,
      prMode: values.prMode,
      defaultRepoUrl: values.defaultRepoUrl,
      branchPrefix: values.branchPrefix,
      reduceMotion: values.reduceMotion,
    };
  },
});

/** Internal lookup used by engine actions (runTask / team runner). */
export const getInternal = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<AppSettings | null> => {
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (!row) return null;
    return {
      engineMode: row.engineMode,
      allowCustomPipeline: row.allowCustomPipeline,
      allowRepoContext: row.allowRepoContext,
      prMode: row.prMode,
      defaultRepoUrl: row.defaultRepoUrl,
      branchPrefix: row.branchPrefix,
      reduceMotion: row.reduceMotion,
    };
  },
});

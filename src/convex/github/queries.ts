import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getCurrentUser } from "../users";

/** Public, token-stripped view of the signed-in user's GitHub account(s). */
export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const accounts = await ctx.db
      .query("githubAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    return accounts.map((account) => ({
      _id: account._id,
      githubId: account.githubId,
      username: account.username,
      name: account.name,
      avatarUrl: account.avatarUrl,
      profileUrl: account.profileUrl,
      connectedAt: account.connectedAt,
      updatedAt: account.updatedAt,
      lastSyncedAt: account.lastSyncedAt,
    }));
  },
});

/**
 * Sync readiness for the UI: is an OAuth account connected, and does the
 * deployment environment provide a PAT fallback (GITHUB_PAT / GITHUB_TOKEN)?
 * Lets the UI show a truthful "PAT" badge instead of implying OAuth failed.
 */
export const syncStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { oauthConnected: false, patFallback: false };
    const account = await ctx.db
      .query("githubAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
    return {
      oauthConnected: !!account,
      patFallback:
        !account && !!(process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN),
    };
  },
});

/** Internal: full account row (including access token) for a user id. */
export const accountByOwnerId = internalQuery({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("githubAccounts")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
        .first()) ?? null
    );
  },
});

/** Internal: fetch a conversation without auth for server-side flows. */
export const getConversationById = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.conversationId)) ?? null;
  },
});

/** Internal: fetch a message row without auth for server-side flows. */
export const getMessageById = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.messageId)) ?? null;
  },
});

/** Internal: resolve a pending OAuth state row. */
export const oauthStateByState = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("githubOauthStates")
        .withIndex("by_state", (q) => q.eq("state", args.state))
        .first()) ?? null
    );
  },
});

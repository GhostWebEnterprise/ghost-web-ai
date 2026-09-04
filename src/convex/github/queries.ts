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

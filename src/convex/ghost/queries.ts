import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users";

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(80);
    return conversations;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) return null;
    return conversation;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) return [];
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_seq", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
    return messages;
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        sessions: 0,
        runs: 0,
        reposConnected: 0,
        lastRunAt: null as number | null,
      };
    }
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    const runs = conversations.reduce((sum, c) => sum + c.runCount, 0);
    const reposConnected = conversations.filter((c) => c.repoUrl).length;
    const lastRunAt = conversations.reduce<number | null>(
      (latest, c) => (c.lastRunAt && (!latest || c.lastRunAt > latest) ? c.lastRunAt : latest),
      null,
    );
    return { sessions: conversations.length, runs, reposConnected, lastRunAt };
  },
});

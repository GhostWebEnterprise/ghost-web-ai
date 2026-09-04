import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getCurrentUser } from "../users";

const NOW = () => Date.now();

/**
 * Begin the GitHub OAuth flow. Requires the signed-in user; stores a CSRF
 * state row and returns the authorize URL the browser should navigate to.
 * Needs GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET set in Keys.
 */
export const startConnect = mutation({
  args: { origin: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to connect GitHub.");

    const clientId = process.env.GITHUB_CLIENT_ID;
    const siteUrl = process.env.SITE_URL ?? process.env.CONVEX_SITE_URL;
    if (!clientId || !siteUrl) {
      throw new Error(
        "GitHub OAuth is not configured yet — add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Keys, then retry.",
      );
    }

    const origin = args.origin.trim().replace(/\/+$/, "");
    if (!/^https:\/\//.test(origin)) {
      throw new Error("App origin must be https — retry from the app window.");
    }

    // Deterministic-safe randomness (Convex seeds Math.random per execution).
    const state = Array.from({ length: 28 }, () =>
      Math.floor(Math.random() * 36).toString(36),
    ).join("");

    await ctx.db.insert("githubOauthStates", {
      state,
      ownerId: user._id,
      redirectTo: origin,
      createdAt: NOW(),
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${siteUrl}/github/callback`,
      scope: "repo read:user read:org",
      state,
    });
    return {
      authorizeUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    };
  },
});

/** Remove the signed-in user's GitHub connection. */
export const disconnect = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const accounts = await ctx.db
      .query("githubAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }
  },
});

/** Internal: persist a freshly exchanged GitHub token + profile. */
export const registerAccount = internalMutation({
  args: {
    ownerId: v.id("users"),
    githubId: v.string(),
    username: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    profileUrl: v.string(),
    accessToken: v.string(),
    tokenScopes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = NOW();
    const existing = await ctx.db
      .query("githubAccounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.insert("githubAccounts", {
      ownerId: args.ownerId,
      githubId: args.githubId,
      username: args.username,
      name: args.name,
      avatarUrl: args.avatarUrl,
      profileUrl: args.profileUrl,
      accessToken: args.accessToken,
      tokenScopes: args.tokenScopes,
      connectedAt: now,
      updatedAt: now,
      lastSyncedAt: undefined,
    });
  },
});

/** Internal: delete a consumed OAuth state row. */
export const removeOauthState = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("githubOauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

/** Internal: persist the real PR url on a run message once it is opened. */
export const attachPrUrl = internalMutation({
  args: { runId: v.id("messages"), prUrl: v.string() },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.role !== "assistant") return;
    await ctx.db.patch(args.runId, { prUrl: args.prUrl });
  },
});

/** Internal: bump the lastSyncedAt timestamp after a repo sync. */
export const touchSync = internalMutation({
  args: { accountId: v.id("githubAccounts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      updatedAt: NOW(),
      lastSyncedAt: NOW(),
    });
  },
});

/**
 * Point a conversation at one of the user's synced repos so the run engine
 * uses it as the target (metadata gets enriched by the run action).
 */
export const selectSyncedRepo = mutation({
  args: {
    conversationId: v.id("conversations"),
    fullName: v.string(), // "owner/name"
    url: v.string(),
    defaultBranch: v.optional(v.string()),
    language: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in first.");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== user._id) {
      throw new Error("Conversation not found.");
    }
    await ctx.db.patch(args.conversationId, {
      repoUrl: args.url,
      repo: {
        fullName: args.fullName,
        url: args.url,
        source: "github",
        description: args.description,
        language: args.language,
        defaultBranch: args.defaultBranch,
      },
      updatedAt: NOW(),
    });
  },
});

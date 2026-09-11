import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users";
import { teamNodeValidator, teamSharedValidator } from "../schema";

export const listTeamRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query("ghostTeams")
      .withIndex("by_owner_updated", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(Math.min(args.limit ?? 20, 100));
  },
});

export const getTeamRun = query({
  args: { teamId: v.id("ghostTeams") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) return null;
    return team;
  },
});

// Referenced so generated API types stay explicit for the client.
export const _teamShapes = { node: teamNodeValidator, shared: teamSharedValidator };

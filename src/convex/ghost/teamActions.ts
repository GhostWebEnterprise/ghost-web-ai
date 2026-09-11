import { v } from "convex/values";
import { action, mutation } from "../_generated/server";
import { api } from "../_generated/api";
import { getCurrentUser } from "../users";
import { teamNodeValidator, teamSharedValidator } from "../schema";
import { classifyTask } from "./plan";
import {
  readyNodes,
  serializeBatch,
  nodeScript,
  type TeamNode,
  type TeamShared,
} from "./team";

const NOW = () => Date.now();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TICK = 160; // streaming cadence per batch step

interface TeamEvent {
  at: number;
  agent: string;
  text: string;
}

/**
 * Task-force engine: executes the task graph wave by wave.
 * - Independent nodes run in parallel batches; each batch is write-serialized
 *   (no two nodes in one batch write the same target — final writes to the
 *   same files always land in order).
 * - Gate nodes execute their scan, then park the whole run in `awaiting`
 *   until the owner approves. Nothing downstream runs before that.
 * - Every node outcome patches the ONE shared state row all agents read.
 */
export const runTeam = action({
  args: { teamId: v.id("ghostTeams") },
  handler: async (ctx, args) => {
    const load = async () => {
      const row = await ctx.runQuery(api.ghost.teamQueries.getTeamRun, {
        teamId: args.teamId,
      });
      return row ?? null;
    };

    let current = await load();
    if (!current) throw new Error("Task-force run not found.");
    if (current.status !== "running") return; // settled / awaiting / stopped

    let nodes: TeamNode[] = current.nodes;
    let shared: TeamShared = current.shared;
    let events: TeamEvent[] = current.events;
    // The graph was built from the task text; rebuild the profile for scripts.
    const profile = classifyTask(current.task);

    const persist = async () => {
      await ctx.runMutation(api.ghost.teamActions.patchTeam, {
        teamId: args.teamId,
        nodes,
        shared,
        events,
      });
    };

    try {
      await persist();

      while (true) {
        // Re-read after each batch so approvals land between iterations.
        current = await load();
        if (!current) throw new Error("run-stopped");
        nodes = current.nodes;
        shared = current.shared;
        events = current.events;
        if (current.status !== "running") return; // stopped mid-run

        const batch = readyNodes(nodes);
        if (batch.length === 0) break; // graph drained

        const subBatches = serializeBatch(batch);
        let gateOpened = false;

        for (const group of subBatches) {
          // Mark the group running (in order), then let the nodes "work"
          // concurrently — outcomes are computed from one consistent snapshot.
          nodes = nodes.map((n) =>
            group.some((g) => g.id === n.id) ? { ...n, status: "running" as const } : n,
          );
          await persist();
          await sleep(TICK);

          const snapshots = group.map((node) => ({
            node,
            outcome: nodeScript(node, shared, profile),
          }));

          // Merge outcomes into the canonical graph + shared state.
          for (const { node, outcome } of snapshots) {
            nodes = nodes.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    status: outcome.awaiting ? ("awaiting" as const) : ("done" as const),
                    detail: outcome.detail,
                    logs: [...n.logs, ...outcome.logs],
                  }
                : n,
            );
            if (outcome.sharedPatch) shared = { ...shared, ...outcome.sharedPatch };
            events = [...events, { at: NOW(), agent: node.agent, text: outcome.detail }];
            if (outcome.awaiting) gateOpened = true;
          }
          shared = {
            ...shared,
            notes: [
              ...shared.notes,
              ...group.map((n) => `${n.agent} completed “${n.title}”`),
            ].slice(-40),
          };
          await persist();

          // A gate finished its scan — park the task force for owner approval.
          if (gateOpened) {
            await ctx.runMutation(api.ghost.teamActions.patchTeamStatus, {
              teamId: args.teamId,
              status: "awaiting",
            });
            return; // approveGate re-launches runTeam
          }
          await sleep(TICK);
        }
      }

      // Graph drained — anything not settled means the graph is inconsistent.
      const unfinished = nodes.filter(
        (n) => n.status !== "done" && n.status !== "skipped",
      );
      await ctx.runMutation(api.ghost.teamActions.patchTeamStatus, {
        teamId: args.teamId,
        status: unfinished.length > 0 ? "error" : "done",
      });
    } catch (err) {
      if (err instanceof Error && err.message === "run-stopped") return;
      await ctx
        .runMutation(api.ghost.teamActions.patchTeamStatus, {
          teamId: args.teamId,
          status: "error",
        })
        .catch(() => {});
    }
  },
});

/** Engine-internal: write nodes/shared/events from the executor. */
export const patchTeam = mutation({
  args: {
    teamId: v.id("ghostTeams"),
    nodes: v.array(teamNodeValidator),
    shared: v.optional(teamSharedValidator),
    events: v.array(
      v.object({ at: v.number(), agent: v.string(), text: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) return;
    await ctx.db.patch(args.teamId, {
      nodes: args.nodes,
      ...(args.shared ? { shared: args.shared } : {}),
      events: args.events.slice(-120),
      updatedAt: NOW(),
    });
  },
});

/** Engine-internal: settle the run status. */
export const patchTeamStatus = mutation({
  args: {
    teamId: v.id("ghostTeams"),
    status: v.union(
      v.literal("running"),
      v.literal("awaiting"),
      v.literal("done"),
      v.literal("error"),
      v.literal("stopped"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== user._id) return;
    await ctx.db.patch(args.teamId, { status: args.status, updatedAt: NOW() });
  },
});

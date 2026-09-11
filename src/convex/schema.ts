import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// ---------------- Ghost Web AI shared validators ----------------

export const stageStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("done"),
  v.literal("error"),
  v.literal("skipped"),
);
export type StageStatus = Infer<typeof stageStatusValidator>;

export const runStatusValidator = v.union(
  v.literal("idle"),
  v.literal("running"),
  v.literal("done"),
  v.literal("error"),
);
export type RunStatus = Infer<typeof runStatusValidator>;

export const stageValidator = v.object({
  id: v.string(),
  agent: v.string(), // agent key (core, git, github, web, android, desktop, api, security, ci)
  title: v.string(),
  status: stageStatusValidator,
  detail: v.optional(v.string()),
  logs: v.optional(v.array(v.string())),
});
export type Stage = Infer<typeof stageValidator>;

export const repoValidator = v.object({
  fullName: v.string(), // e.g. "ghostapp-ai/ghost"
  url: v.string(),
  source: v.union(v.literal("github"), v.literal("local")),
  description: v.optional(v.string()),
  language: v.optional(v.string()),
  license: v.optional(v.string()),
  stars: v.optional(v.number()),
  defaultBranch: v.optional(v.string()),
});
export type RepoMeta = Infer<typeof repoValidator>;

// A file Ghost generated for a task (path + full new content). Stored on the
// assistant run message so the UI can render real diffs, not just logs.
export const runFileValidator = v.object({
  path: v.string(),
  summary: v.optional(v.string()),
  content: v.string(),
});
export type RunFile = Infer<typeof runFileValidator>;

// ---------------- Multi-agent task force (15-agent team runs) ----------------

export const teamNodeValidator = v.object({
  id: v.string(),
  agent: v.string(),
  title: v.string(),
  kind: v.union(v.literal("plan"), v.literal("work"), v.literal("gate")),
  deps: v.array(v.string()),
  writes: v.array(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("awaiting"),
    v.literal("done"),
    v.literal("error"),
    v.literal("skipped"),
  ),
  approved: v.optional(v.boolean()),
  detail: v.optional(v.string()),
  logs: v.array(v.string()),
});
export type TeamNodeRow = Infer<typeof teamNodeValidator>;

export const teamSharedValidator = v.object({
  branch: v.optional(v.string()),
  plan: v.optional(v.string()),
  files: v.array(v.string()),
  commit: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  apk: v.optional(v.string()),
  notes: v.array(v.string()),
});
export type TeamSharedRow = Infer<typeof teamSharedValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ---------- Ghost Web AI ----------

    conversations: defineTable({
      ownerId: v.id("users"), // owning user
      title: v.string(), // human readable title of the session
      repoUrl: v.optional(v.string()), // optional target github repo url
      repo: v.optional(repoValidator), // resolved repo metadata
      engine: v.optional(v.string()), // "local" | "sambanova"
      status: v.optional(runStatusValidator), // status of last run
      runCount: v.number(), // how many agent runs happened
      liveGithub: v.optional(v.boolean()), // a real branch/PR was pushed for this repo
      createdAt: v.number(),
      updatedAt: v.number(),
      lastRunAt: v.optional(v.number()),
    })
      .index("by_owner", ["ownerId"])
      .index("by_owner_updated", ["ownerId", "updatedAt"]),

    // GitHub OAuth — user-connected GitHub account (token used by the engine
    // to push branches + open PRs for real).
    githubAccounts: defineTable({
      ownerId: v.id("users"), // app user who owns the connection
      githubId: v.string(), // GitHub numeric id
      username: v.string(), // GitHub login
      name: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      profileUrl: v.string(),
      accessToken: v.string(), // OAuth token — used server-side only
      tokenScopes: v.optional(v.string()),
      connectedAt: v.number(),
      updatedAt: v.number(),
      lastSyncedAt: v.optional(v.number()),
    }).index("by_owner", ["ownerId"]),

    // Single-use CSRF state rows for the GitHub OAuth web flow.
    githubOauthStates: defineTable({
      state: v.string(),
      ownerId: v.id("users"),
      redirectTo: v.string(),
      createdAt: v.number(),
    }).index("by_state", ["state"]),

    messages: defineTable({
      conversationId: v.id("conversations"),
      seq: v.number(), // per-conversation ordering
      role: v.union(v.literal("user"), v.literal("assistant")),
      agent: v.optional(v.string()), // agent key that produced the message
      content: v.string(), // text content / summary
      engine: v.optional(v.string()),
      pipeline: v.optional(v.array(stageValidator)), // run pipeline
      runStatus: v.optional(runStatusValidator), // running | done | error
      files: v.optional(v.array(runFileValidator)), // generated file diffs
      prUrl: v.optional(v.string()), // real PR opened on GitHub for this run
      error: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_conversation_seq", ["conversationId", "seq"]),

    // Multi-agent task-force runs: one row per team execution, holding the
    // shared task state, the full task graph and the append-only event log.
    ghostTeams: defineTable({
      ownerId: v.id("users"),
      conversationId: v.optional(v.id("conversations")), // origin session, if any
      task: v.string(),
      status: v.union(
        v.literal("running"),
        v.literal("awaiting"),
        v.literal("done"),
        v.literal("error"),
        v.literal("stopped"),
      ),
      nodes: v.array(teamNodeValidator), // the shared task graph
      shared: teamSharedValidator, // ONE shared state all agents read/write
      events: v.array(
        v.object({
          at: v.number(),
          agent: v.string(),
          text: v.string(),
        }),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_owner_updated", ["ownerId", "updatedAt"])
      .index("by_conversation", ["conversationId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

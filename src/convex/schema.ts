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
      createdAt: v.number(),
      updatedAt: v.number(),
      lastRunAt: v.optional(v.number()),
    })
      .index("by_owner", ["ownerId"])
      .index("by_owner_updated", ["ownerId", "updatedAt"]),

    messages: defineTable({
      conversationId: v.id("conversations"),
      seq: v.number(), // per-conversation ordering
      role: v.union(v.literal("user"), v.literal("assistant")),
      agent: v.optional(v.string()), // agent key that produced the message
      content: v.string(), // text content / summary
      engine: v.optional(v.string()),
      pipeline: v.optional(v.array(stageValidator)), // run pipeline
      runStatus: v.optional(runStatusValidator), // running | done | error
      error: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_conversation_seq", ["conversationId", "seq"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

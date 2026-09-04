import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

async function gh<T = unknown>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "ghost-web-ai",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    /* non-json */
  }
  return { ok: res.ok, status: res.status, data, text };
}

export interface SyncedRepo {
  fullName: string;
  url: string;
  private: boolean;
  fork: boolean;
  description?: string;
  language?: string;
  defaultBranch?: string;
  pushedAt?: string;
}

export type SyncReposResult =
  | { connected: false; repos: SyncedRepo[]; reason?: string }
  | {
      connected: true;
      profile: {
        username: string;
        name?: string;
        avatarUrl?: string;
      };
      repos: SyncedRepo[];
      syncedAt: number;
    };

export type PublishResult =
  | { already: true; prUrl: string }
  | {
      already?: false;
      branch: string;
      prNumber?: number;
      prUrl: string;
      repoFullName: string;
      files: number;
    };

/** Fetch the connected account's profile + repos straight from GitHub. */
export async function syncReposHandler(ctx: ActionCtx): Promise<SyncReposResult> {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject as Id<"users"> | undefined;
  if (!userId) {
    return { connected: false, repos: [] };
  }
  const account = await ctx.runQuery(internal.github.queries.accountByOwnerId, {
    ownerId: userId,
  });
  if (!account) {
    return { connected: false, repos: [] };
  }

  const userRes = await gh<{
    login?: string;
    name?: string | null;
    avatar_url?: string;
  }>("https://api.github.com/user", account.accessToken);
  if (!userRes.ok) {
    return { connected: false, repos: [], reason: "Token invalid or revoked." };
  }

  const repoRes = await gh<
    {
      full_name?: string;
      html_url?: string;
      private?: boolean;
      fork?: boolean;
      description?: string | null;
      language?: string | null;
      default_branch?: string;
      pushed_at?: string;
    }[]
  >(
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    account.accessToken,
  );

  const repos: SyncedRepo[] = (repoRes.data ?? [])
    .map((r) => ({
      fullName: r.full_name ?? "",
      url: r.html_url ?? "",
      private: r.private ?? false,
      fork: r.fork ?? false,
      description: r.description ?? undefined,
      language: r.language ?? undefined,
      defaultBranch: r.default_branch ?? "main",
      pushedAt: r.pushed_at,
    }))
    .filter((r) => r.fullName);

  try {
    await ctx.runMutation(internal.github.mutations.touchSync, {
      accountId: account._id,
    });
  } catch {
    /* non-fatal */
  }

  return {
    connected: true,
    profile: {
      username: userRes.data?.login ?? account.username,
      name: userRes.data?.name ?? account.name,
      avatarUrl: userRes.data?.avatar_url ?? account.avatarUrl,
    },
    repos,
    syncedAt: Date.now(),
  };
}

/** Publish a finished run's files to its repo: real branch → commit → PR. */
export async function publishRunHandler(
  ctx: ActionCtx,
  args: { conversationId: Id<"conversations">; runId: Id<"messages"> },
): Promise<PublishResult> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in first.");
  const userId = identity.subject as Id<"users">;

  const account = await ctx.runQuery(internal.github.queries.accountByOwnerId, {
    ownerId: userId,
  });
  if (!account) throw new Error("Connect your GitHub account first.");

  const conversation = await ctx.runQuery(
    internal.github.queries.getConversationById,
    { conversationId: args.conversationId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const run = await ctx.runQuery(internal.github.queries.getMessageById, {
    messageId: args.runId,
  });
  if (!run || run.conversationId !== args.conversationId) {
    throw new Error("Run not found.");
  }
  if (run.prUrl) {
    return { already: true, prUrl: run.prUrl };
  }

  const repoMeta = conversation.repo;
  if (!repoMeta || repoMeta.source !== "github") {
    throw new Error(
      "This build has no GitHub repo target — connect GitHub, pick a repo, and rerun.",
    );
  }
  const files = run.files ?? [];
  if (files.length === 0) {
    throw new Error("This run has no generated files to push.");
  }

  const baseBranch = repoMeta.defaultBranch ?? "main";
  const token = account.accessToken;

  // Branch + messages come from the run's own plan receipt when present.
  const branchMatch = run.content.match(/`([^`]+)`/);
  const commitMatch = run.content.match(/Commit:\s*(.+)/);
  const branch = branchMatch?.[1] ?? `ghost-ai/${Date.now().toString(36)}`;
  const commitMessage =
    commitMatch?.[1]?.trim() ?? `feat: ghost web ai build ${branch}`;
  const prBody = [
    `## What`,
    run.content.slice(0, 600),
    "",
    "Automated by Ghost Web AI — agent chain → generated files → real PR.",
  ].join("\n");

  const enc = (s: string) => encodeURIComponent(s);
  const repoPath = enc(repoMeta.fullName);

  // 1. Locate the base commit + tree on the default branch.
  const refRes = await gh<{ object?: { sha?: string } }>(
    `https://api.github.com/repos/${repoPath}/git/ref/heads/${enc(baseBranch)}`,
    token,
  );
  const baseCommitSha = refRes.data?.object?.sha;
  if (!refRes.ok || !baseCommitSha) {
    throw new Error(
      `Could not read the ${baseBranch} branch${refRes.status === 404 ? " (private repo? token needs repo access)" : ""}.`,
    );
  }
  const commitRes = await gh<{ tree?: { sha?: string } }>(
    `https://api.github.com/repos/${repoPath}/git/commits/${baseCommitSha}`,
    token,
  );
  const baseTreeSha = commitRes.data?.tree?.sha;
  if (!baseTreeSha) throw new Error("Could not read the repository tree.");

  // 2. Upload each generated file as a blob.
  const entries: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const file of files) {
    const blobRes = await gh<{ sha?: string }>(
      `https://api.github.com/repos/${repoPath}/git/blobs`,
      token,
      { method: "POST", body: JSON.stringify({ content: file.content, encoding: "utf-8" }) },
    );
    if (!blobRes.ok || !blobRes.data?.sha) {
      throw new Error(`Could not upload ${file.path} (${blobRes.status}).`);
    }
    entries.push({ path: file.path, mode: "100644", type: "blob", sha: blobRes.data.sha });
  }

  // 3. Build a new tree on top of the base tree.
  const treeRes = await gh<{ sha?: string }>(
    `https://api.github.com/repos/${repoPath}/git/trees`,
    token,
    { method: "POST", body: JSON.stringify({ base_tree: baseTreeSha, tree: entries }) },
  );
  if (!treeRes.ok || !treeRes.data?.sha) {
    throw new Error(`Could not assemble the file tree (${treeRes.status}).`);
  }

  // 4. Commit the tree.
  const author = {
    name: account.name ?? account.username,
    email: `${account.username}@users.noreply.github.com`,
  };
  const commitRes2 = await gh<{ sha?: string }>(
    `https://api.github.com/repos/${repoPath}/git/commits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        message: commitMessage,
        tree: treeRes.data.sha,
        parents: [baseCommitSha],
        author,
        committer: author,
      }),
    },
  );
  if (!commitRes2.ok || !commitRes2.data?.sha) {
    throw new Error(`Could not create the commit (${commitRes2.status}).`);
  }

  // 5. Create (or force-update) the feature branch ref.
  const newCommitSha = commitRes2.data.sha;
  const refPut = await gh(
    `https://api.github.com/repos/${repoPath}/git/refs/heads/${enc(branch)}`,
    token,
    { method: "PUT", body: JSON.stringify({ sha: newCommitSha, force: true }) },
  );
  if (!refPut.ok) {
    const refPost = await gh(
      `https://api.github.com/repos/${repoPath}/git/refs`,
      token,
      { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitSha }) },
    );
    if (!refPost.ok) {
      throw new Error(`Could not create branch ${branch} (${refPut.status}/${refPost.status}).`);
    }
  }

  // 6. Find or open the pull request.
  const existingPr = await gh<{ number?: number; html_url?: string }[]>(
    `https://api.github.com/repos/${repoPath}/pulls?state=open&head=${enc(
      `${account.username}:${branch}`,
    )}`,
    token,
  );
  let prUrl = existingPr.data?.[0]?.html_url;
  let prNumber = existingPr.data?.[0]?.number;
  if (!prUrl) {
    const prRes = await gh<{ number?: number; html_url?: string }>(
      `https://api.github.com/repos/${repoPath}/pulls`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          title: commitMessage,
          head: branch,
          base: baseBranch,
          body: prBody,
        }),
      },
    );
    if (!prRes.ok || !prRes.data?.html_url) {
      throw new Error(
        `Branch pushed but the PR could not be opened (${prRes.status}) — ${
          prRes.status === 422 ? "the token may lack pull-request rights." : ""
        }`,
      );
    }
    prUrl = prRes.data.html_url;
    prNumber = prRes.data.number;
  }

  // Persist the PR link on the run for the UI.
  try {
    await ctx.runMutation(internal.github.mutations.attachPrUrl, {
      runId: args.runId,
      prUrl,
    });
  } catch {
    /* non-fatal */
  }

  return {
    branch,
    prNumber,
    prUrl,
    repoFullName: repoMeta.fullName,
    files: files.length,
  };
}

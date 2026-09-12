import { v } from "convex/values";
import { action, type ActionCtx } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";

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

interface SyncedRepo {
  fullName: string;
  url: string;
  private: boolean;
  fork: boolean;
  description?: string;
  language?: string;
  defaultBranch?: string;
  pushedAt?: string;
}

interface SyncResult {
  connected: boolean;
  reason?: string;
  profile?: { username: string; name?: string; avatarUrl?: string };
  repos?: SyncedRepo[];
  syncedAt?: number;
}

const GH_API = "https://api.github.com";

async function fetchAccountForUser(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<Doc<"githubAccounts"> | null> {
  const row = await ctx.runQuery(internal.github.queries.accountByOwnerId, {
    ownerId: userId,
  });
  return row ?? null;
}

/** Deployment-wide PAT fallback (Keys settings) — GITHUB_PAT, then GITHUB_TOKEN. */
function envPat(): string | undefined {
  return process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN ?? undefined;
}

/** Fetch the connected account's profile + repos straight from GitHub. */
async function syncReposHandler(ctx: ActionCtx): Promise<SyncResult> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return { connected: false, repos: [] };
  }
  const account = await fetchAccountForUser(ctx, userId);
  // Token priority: the user's connected OAuth account, else the deployment
  // GITHUB_PAT / GITHUB_TOKEN (acts as the PAT's own identity).
  const token = account?.accessToken ?? envPat();
  if (!token) {
    return {
      connected: false,
      reason:
        "No GitHub connection — connect an account or set GITHUB_PAT in Keys.",
      repos: [],
    };
  }

  const userRes = await gh<{
    login?: string;
    name?: string | null;
    avatar_url?: string;
    html_url?: string;
  }>(`${GH_API}/user`, token);
  if (!userRes.ok) {
    return {
      connected: false,
      reason: account
        ? "Token invalid or revoked."
        : "GITHUB_PAT is set but invalid or expired.",
      repos: [],
    };
  }
  const username = userRes.data?.login ?? account?.username ?? "pat";

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
    `${GH_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`,
    token,
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

  if (account) {
    try {
      await ctx.runMutation(internal.github.mutations.touchSync, {
        accountId: account._id,
      });
    } catch {
      /* non-fatal */
    }
  }

  return {
    connected: true,
    profile: {
      username,
      name: userRes.data?.name ?? account?.name,
      avatarUrl: userRes.data?.avatar_url ?? account?.avatarUrl,
    },
    repos,
    syncedAt: Date.now(),
  };
}

export const syncRepos = action({
  args: {},
  handler: syncReposHandler,
});

interface PublishResult {
  already?: boolean;
  prUrl?: string;
  branch?: string;
  prNumber?: number;
  repoFullName?: string;
  files?: number;
}

const enc = (s: string) => encodeURIComponent(s);

async function githubJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await gh<T>(url, token, init);
  if (!res.ok) {
    throw new Error(
      `GitHub ${res.status} on ${init.method ?? "GET"}: ${res.text.slice(0, 300)}`,
    );
  }
  return res.data as T;
}

/** Publish a finished run's generated files as a real branch + PR. */
async function publishRunHandler(
  ctx: ActionCtx,
  args: { conversationId: Id<"conversations">; runId: Id<"messages"> },
): Promise<PublishResult> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in first.");

  const account = await fetchAccountForUser(ctx, userId);
  const token = account?.accessToken ?? envPat();
  if (!token) {
    throw new Error(
      "Connect your GitHub account first (Console → GitHub), or set GITHUB_PAT in Keys.",
    );
  }
  // Settings tab: plan-only mode blocks manual publishing too.
  const settings = await ctx
    .runQuery(api.settings.getInternal, { userId })
    .catch(() => null);
  if (settings?.prMode === "plan_only") {
    throw new Error(
      "Publishing is disabled — turn off plan-only mode in Settings first.",
    );
  }
  // Identity used for branch head + commit author. With a connected OAuth
  // account it comes from the stored row; with the PAT fallback we resolve
  // the PAT's own login so `owner:branch` refs stay correct.
  let actor = account?.username ?? null;
  if (!actor) {
    const me = await githubJson<{ login: string }>(`${GH_API}/user`, token);
    actor = me.login;
  }

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
  const full = `${GH_API}/repos/${enc(repoMeta.fullName)}`;

  // Branch + messages come from the run's own plan receipt when present.
  const branchMatch = run.content.match(/`([^`]+)`/);
  const commitMatch = run.content.match(/Commit:\s*(.+)/);
  const branch = branchMatch?.[1] ?? `ghost-ai/${Date.now().toString(36)}`;
  const commitMessage =
    commitMatch?.[1]?.trim() ?? `feat: ghost web ai build ${branch}`;
  const prTitle = commitMessage;
  const prBody = [
    `## What`,
    run.content.slice(0, 600),
    "",
    "Automated by Ghost Web AI — agent chain → generated files → real PR.",
  ].join("\n");

  // 1. Locate the base commit + tree on the default branch.
  const refData = await githubJson<{ object: { sha: string } }>(
    `${full}/git/ref/heads/${enc(baseBranch)}`,
    token,
  );
  const baseCommitSha = refData?.object?.sha;
  if (!baseCommitSha) {
    throw new Error(`Could not read the ${baseBranch} branch.`);
  }
  const commitData = await githubJson<{ tree: { sha: string } }>(
    `${full}/git/commits/${baseCommitSha}`,
    token,
  );
  const baseTreeSha = commitData?.tree?.sha;
  if (!baseTreeSha) throw new Error("Could not read the repository tree.");

  // 2. Upload each generated file as a blob.
  const entries: { path: string; mode: string; type: string; sha: string }[] =
    [];
  for (const file of files) {
    const blob = await githubJson<{ sha: string }>(
      `${full}/git/blobs`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
      },
    );
    entries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // 3. Build a new tree on top of the base tree.
  const tree = await githubJson<{ sha: string }>(`${full}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: entries }),
  });

  // 4. Commit the tree.
  const author = {
    name: account?.name ?? actor,
    email: `${actor}@users.noreply.github.com`,
  };
  const commit = await githubJson<{ sha: string }>(
    `${full}/git/commits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        message: commitMessage,
        tree: tree.sha,
        parents: [baseCommitSha],
        author,
        committer: author,
      }),
    },
  );

  // 5. Create (or force-update) the feature branch ref.
  const putRaw = await gh<{ ref?: string }>(
    `${full}/git/refs/heads/${enc(branch)}`,
    token,
    { method: "PUT", body: JSON.stringify({ sha: commit.sha, force: true }) },
  );
  if (!putRaw.ok) {
    const postRaw = await gh<{ ref?: string }>(`${full}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commit.sha,
      }),
    });
    if (!postRaw.ok) {
      throw new Error(
        `Could not create branch ${branch} (${putRaw.status}/${postRaw.status}).`,
      );
    }
  }

  // 6. Find or open the pull request.
  const existing = await githubJson<
    { number: number; html_url: string }[]
  >(
    `${full}/pulls?state=open&head=${enc(`${actor}:${branch}`)}`,
    token,
  );
  let prUrl = existing?.[0]?.html_url;
  let prNumber = existing?.[0]?.number;
  if (!prUrl) {
    const pr = await githubJson<{ number: number; html_url: string }>(
      `${full}/pulls`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          title: prTitle,
          head: branch,
          base: baseBranch,
          body: prBody,
        }),
      },
    );
    prUrl = pr.html_url;
    prNumber = pr.number;
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
    prNumber: prNumber ?? undefined,
    prUrl,
    repoFullName: repoMeta.fullName,
    files: files.length,
  };
}

export const publishRun = action({
  args: {
    conversationId: v.id("conversations"),
    runId: v.id("messages"),
  },
  handler: publishRunHandler,
});

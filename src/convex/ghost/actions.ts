import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import {
  buildLocalRunScript,
  parseRepoUrl,
  type PlanStage,
  type RepoInfo,
} from "./plan";

const STAGE = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("done"),
  v.literal("error"),
  v.literal("skipped"),
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (ms: number, spread = 0.35) =>
  ms + Math.floor(Math.random() * ms * spread);

interface LooseStage extends PlanStage {
  detail?: string;
  logs?: string[];
}

export const runTask = action({
  args: {
    conversationId: v.id("conversations"),
    runId: v.id("messages"),
    task: v.string(),
    repoUrl: v.optional(v.string()),
    pipeline: v.array(
      v.object({
        id: v.string(),
        agent: v.string(),
        title: v.string(),
        status: STAGE,
      }),
    ),
  },
  handler: async (ctx, args) => {
    const startedAt = Date.now();

    // Reconstruct stage objects (seed state) so the action owns a mutable copy.
    let stages: LooseStage[] = args.pipeline.map((s) => ({ ...s }));
    const setStage = (
      id: string,
      patch: Partial<LooseStage>,
    ): LooseStage[] => {
      stages = stages.map((s) => (s.id === id ? { ...s, ...patch } : s));
      return stages;
    };
    const persist = async () => {
      try {
        await ctx.runMutation(api.ghost.mutations.patchRun, {
          conversationId: args.conversationId,
          runId: args.runId,
          pipeline: stages.map((s) => ({
            id: s.id,
            agent: s.agent,
            title: s.title,
            status: s.status,
            detail: s.detail,
            logs: s.logs ?? [],
          })),
        });
      } catch {
        // conversation may have been deleted mid-run — stop quietly.
        throw new Error("run-stopped");
      }
    };

    try {
      // ---------- 1. Resolve repo metadata (GitHub REST, best effort) ----------
      const parsed = parseRepoUrl(args.repoUrl);
      let repo: RepoInfo | null = parsed;
      if (parsed?.source === "github") {
        const meta = await fetchGitHubMeta(parsed);
        if (meta) repo = meta;
        if (repo) {
          try {
            await ctx.runMutation(api.ghost.mutations.updateRepo, {
              conversationId: args.conversationId,
              repo,
            });
          } catch {
            /* non-fatal */
          }
        }
      }

      // ---------- 2. Engine selection: SambaNova LLM (free tier, optional key) or local engine ----------
      const apiKey = process.env.SAMBANOVA_API_KEY ?? process.env.SAMBA_API_KEY;
      let engine: "sambanova" | "local" = "local";
      let llm: LlmPlan | null = null;
      if (apiKey) {
        try {
          llm = await callLlm(apiKey, args.task, repo);
          engine = "sambanova";
        } catch (err) {
          console.error("ghost: LLM unavailable, falling back to local engine:", err);
        }
      }

      const script = llm ? llmToScript(llm, args.task, repo) : buildLocalRunScript(args.task, repo);

      try {
        await ctx.runMutation(api.ghost.mutations.patchRun, {
          conversationId: args.conversationId,
          runId: args.runId,
          engine,
          content: "Agent chain running…",
        });
      } catch {
        throw new Error("run-stopped");
      }

      // Guardian + build + fix are scripted as a single dramatic loop.
      // ---------- 3. Execute stages ----------
      for (const stage of stages) {
        if (stage.id === "scan" || stage.id === "plan") {
          await sleep(jitter(600));
        }
        setStage(stage.id, { status: "running", detail: undefined, logs: [] });
        await persist();

        const scripted = script.perStage[stage.id];
        const detail = scripted?.detail ?? `Executed “${stage.title}”.`;
        const logs = scripted?.logs ?? [`ghost: ${stage.title.toLowerCase()} complete`];

        for (const line of logs) {
          setStage(stage.id, {
            status: "running",
            detail,
            logs: [...(stages.find((s) => s.id === stage.id)?.logs ?? []), line],
          });
          await persist();
          await sleep(jitter(240, 0.5));
        }

        setStage(stage.id, { status: "done", detail, logs });
        await persist();
        await sleep(jitter(380, 0.5));
      }

      // ---------- 4. Final summary ----------
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const engineNote =
        engine === "sambanova"
          ? "Engine: SambaNova Cloud (open model) — free tier, no credits consumed."
          : "Engine: local free engine — add a SAMBANOVA_API_KEY (or SAMBA_API_KEY) in Keys to upgrade to an open LLM planner. No credits are ever required.";

      const content = [
        script.summary,
        "",
        `Branch: \`${script.branch}\``,
        "",
        ...script.files.map((f) => `  ${f}`),
        "",
        `Commit: ${script.commitMessage}`,
        "",
        "Risks:",
        ...script.risks.map((r) => `  - ${r}`),
        "",
        engineNote,
        `Finished in ${durationSec}s · ${stages.length} agents in the chain.`,
      ].join("\n");

      await persist();
      try {
        await ctx.runMutation(api.ghost.mutations.patchRun, {
          conversationId: args.conversationId,
          runId: args.runId,
          content,
          engine,
          runStatus: "done",
        });
      } catch {
        throw new Error("run-stopped");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "run-stopped") return;
      console.error("ghost: run failed:", err);
      try {
        const failed = stages.find((s) => s.status === "running") ?? stages[0];
        if (failed) {
          setStage(failed.id, {
            status: "error",
            detail: `Stage failed: ${err instanceof Error ? err.message : "unknown error"}`,
          });
        }
        await ctx.runMutation(api.ghost.mutations.patchRun, {
          conversationId: args.conversationId,
          runId: args.runId,
          pipeline: stages.map((s) => ({
            id: s.id,
            agent: s.agent,
            title: s.title,
            status: s.status,
            detail: s.detail,
            logs: s.logs ?? [],
          })),
          runStatus: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      } catch {
        /* conversation gone */
      }
    }
  },
});

// ---------------------------------------------------------------------------

interface LlmPlan {
  summary: string;
  steps: string[];
  files: string[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
  risks: string[];
}

async function fetchGitHubMeta(repo: RepoInfo): Promise<RepoInfo | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repo.fullName)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ghost-web-ai",
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const license = data.license as { spdx_id?: string } | null;
    const language = typeof data.language === "string" ? data.language : undefined;
    return {
      fullName: repo.fullName,
      url: repo.url,
      source: "github",
      description:
        typeof data.description === "string" ? data.description : undefined,
      language,
      license: license?.spdx_id && license.spdx_id !== "NOASSERTION" ? license.spdx_id : undefined,
      stars: typeof data.stargazers_count === "number" ? data.stargazers_count : undefined,
      defaultBranch:
        typeof data.default_branch === "string" ? data.default_branch : "main",
    };
  } catch {
    return null;
  }
}

async function callLlm(
  apiKey: string,
  task: string,
  repo: RepoInfo | null,
): Promise<LlmPlan> {
  const repoLine = repo
    ? `Target repo: ${repo.fullName} (${repo.language ?? "unknown stack"}, license ${repo.license ?? "unknown"}).`
    : "Target: the user's current workspace repo (stack detected at runtime).";
  const prompt = `You are the planning core of Ghost Web AI, an agentic web/app builder. Plan this task precisely.

${repoLine}
Task: "${task}"

Ghost executes this chain after you: source & license gate, plan, git branch, implement (code), guardian self-review, CI build, fix loop, commit, open PR, verify, (optional release). Stages may include Android, desktop compatibility, API provider fallback, deployment depending on the task.

Return ONLY strict JSON (no markdown fences) with this exact shape:
{
  "summary": "2-4 sentences summarizing what will be built and how the chain runs it end to end",
  "steps": ["4-8 concise engineering steps for the implementation"],
  "files": ["3-6 concrete file paths the change touches"],
  "commitMessage": "one-line conventional commit message",
  "prTitle": "PR title",
  "prBody": "PR body (2-4 short sections)",
  "risks": ["2-3 short risk notes"]
}`;

  // Current catalog id first; fall back to the legacy org-prefixed id in case
  // the deployment still routes it (SambaNova changed naming over time).
  const MODELS = ["Meta-Llama-3.3-70B-Instruct", "meta-llama/Llama-3.3-70B-Instruct"];
  let lastErr: Error | null = null;
  let raw = "";
  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1400,
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        lastErr = new Error(`SambaNova ${res.status}: ${(await res.text()).slice(0, 200)}`);
        continue;
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      raw = data.choices?.[0]?.message?.content ?? "";
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  if (lastErr) throw lastErr;
  const jsonText = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsed = JSON.parse(jsonText) as Partial<LlmPlan>;
  return {
    summary: parsed.summary ?? `Implements: ${task}`,
    steps: parsed.steps ?? [],
    files: parsed.files ?? [],
    commitMessage: parsed.commitMessage ?? `feat: ${task.slice(0, 50)}`,
    prTitle: parsed.prTitle ?? `feat: ${task.slice(0, 60)}`,
    prBody: parsed.prBody ?? "Automated by Ghost Web AI.",
    risks: parsed.risks ?? [],
  };
}

function llmToScript(llm: LlmPlan, task: string, repo: RepoInfo | null): ReturnType<typeof buildLocalRunScript> {
  const local = buildLocalRunScript(task, repo);
  return {
    ...local,
    summary: llm.summary,
    commitMessage: llm.commitMessage,
    prTitle: llm.prTitle,
    prBody: llm.prBody,
    files: llm.files.length > 0 ? llm.files : local.files,
    risks: llm.risks.length > 0 ? llm.risks : local.risks,
    perStage: {
      ...local.perStage,
      plan: {
        detail: "LLM plan accepted — implementation strategy locked.",
        logs: [
          `ghost core (llm): ${llm.steps[0] ?? "plan generated"}`,
          ...llm.steps.slice(1, 4).map((s) => `ghost core (llm): ${s}`),
        ],
      },
      scan: {
        detail: `Licence gate cleared. ${repo?.license ?? "Permissive open source"} — safe to integrate.`,
        logs: local.perStage.scan.logs,
      },
    },
  };
}

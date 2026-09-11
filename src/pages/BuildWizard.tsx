import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppNav } from "@/components/ghost/AppNav";
import { GhostMark } from "@/components/ghost/GhostMark";
import {
  GitHubSync,
  type SyncedRepoPick,
} from "@/components/ghost/GitHubSync";
import { agentMeta } from "@/lib/ghost-agents";
import { buildPipeline, slugify, type PlanStage } from "@/convex/ghost/plan";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Link2,
  Rocket,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Presets — the "quick route". Each seeds the task text; the chain    */
/* preview below is computed live from the text, never from the preset. */
/* ------------------------------------------------------------------ */

const PRESETS: { key: string; label: string; task: string }[] = [
  {
    key: "feature",
    label: "⚡ Quick feature",
    task: "Add a neobrutalist landing page to my GitHub repo and push it as a PR",
  },
  {
    key: "chat",
    label: "💬 Realtime chat",
    task: "Build a realtime chat feature for my repo and open the PR",
  },
  {
    key: "ai",
    label: "🤖 AI endpoint",
    task: "Add an AI assistant endpoint with provider fallback to my app",
  },
  {
    key: "android",
    label: "📱 Android port",
    task: "Turn my web app into an Android app with unit tests",
  },
  {
    key: "auth",
    label: "🔐 Auth + accounts",
    task: "Add email sign-in, protected routes and a dashboard to my app",
  },
  {
    key: "release",
    label: "🚀 Ship release",
    task: "Polish my app and deploy the release to production",
  },
];

/** One-liners shown under each stage in the fine-tune list. */
const STAGE_BLURB: Record<string, string> = {
  scan: "licence + source legality check before anything is written",
  plan: "parse the task into a branch, files and commit strategy",
  branch: "create the feature branch off the default branch",
  code: "implement the feature in the matching tree",
  android: "compile the Android module and run its unit tests",
  compat: "desktop/web compatibility pass across OS runtimes",
  provider: "AI provider fallback drill — primary → backup → local",
  guard: "guardian self-review of the diff, fixes applied inline",
  build: "CI gate — install → build → catch the first real error",
  fix: "resolve what CI caught, re-run until green",
  commit: "commit the change set and push the branch",
  pr: "open the pull request against the default branch",
  verify: "watch checks on the PR until they are green",
  release: "draft a release and attach build artifacts",
};

/** Stages that cannot be skipped — every chain needs them. */
const REQUIRED = new Set(["plan", "code", "verify"]);

const STEPS = ["Task", "Pipeline", "Finalise"] as const;

export default function BuildWizard() {
  const navigate = useNavigate();

  const createConversation = useMutation(api.ghost.mutations.createConversation);
  const startTask = useMutation(api.ghost.mutations.startTask);
  const runTask = useAction(api.ghost.actions.runTask);

  const [step, setStep] = useState(0);
  const [task, setTask] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [showRepoInput, setShowRepoInput] = useState(false);
  const [syncRepo, setSyncRepo] = useState<SyncedRepoPick | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [launching, setLaunching] = useState(false);

  const taskTrimmed = task.trim();
  const canProceed = taskTrimmed.length > 0;

  // The chain preview is always derived from the task text — same engine the
  // server uses, so what you see here is exactly what will run.
  const pipeline: PlanStage[] = useMemo(
    () => buildPipeline(taskTrimmed || "new feature"),
    [taskTrimmed],
  );
  const activeStages = pipeline.filter((s) => !excluded.has(s.id));
  const skippedCount = pipeline.length - activeStages.length;

  const toggleStage = (id: string) => {
    if (REQUIRED.has(id)) return;
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickPreset = (key: string, presetTask: string) => {
    setActivePreset(key === activePreset ? null : key);
    setTask(presetTask);
  };

  const handlePickRepo = (repo: SyncedRepoPick) => {
    setSyncRepo(repo);
    setRepoUrl("");
    setShowRepoInput(false);
    toast.success(`Targeting ${repo.fullName}`);
  };

  const effectiveRepoUrl = syncRepo?.url ?? (repoUrl.trim() || undefined);
  const branch = `feat/${slugify(taskTrimmed || "new-feature")}`;

  const launch = async () => {
    if (!canProceed || launching) return;
    setLaunching(true);
    try {
      const customPipeline = activeStages.map((s) => ({
        id: s.id,
        agent: s.agent,
        title: s.title,
        status: s.status,
      }));
      const conversationId = await createConversation({
        task: taskTrimmed,
        repoUrl: effectiveRepoUrl,
      });
      const { runId } = await startTask({
        conversationId,
        task: taskTrimmed,
        pipeline: customPipeline,
      });
      // Fire the engine without blocking navigation; progress streams on /chat.
      void runTask({
        conversationId,
        runId: runId as Id<"messages">,
        task: taskTrimmed,
        repoUrl: effectiveRepoUrl,
        pipeline: customPipeline,
      }).catch((err) => {
        console.error("Run failed:", err);
        toast.error("The agent chain stopped unexpectedly.");
      });
      toast.success("Chain launched — follow it live in the console", {
        duration: 3500,
      });
      navigate(`/chat?c=${conversationId}`);
    } catch (err) {
      console.error("Wizard launch failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not launch the chain.",
      );
      setLaunching(false);
    }
  };

  return (
    <div className="nb-grid-paper flex min-h-screen flex-col bg-background text-foreground">
      <AppNav active="build" />

      {/* header + step rail */}
      <header className="border-b-2 border-foreground bg-card">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative inline-block">
              <span className="absolute -inset-1 -rotate-2 border-2 border-foreground bg-accent" />
              <Wand2 className="relative size-5" />
            </span>
            <h1 className="text-xl font-black uppercase tracking-tight">
              Build wizard
            </h1>
            <span className="border border-foreground bg-[#b7e6a5] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider">
              guided mode
            </span>
          </div>
          <nav aria-label="Wizard steps" className="flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => {
              const state =
                i === step ? "current" : i < step ? "done" : "todo";
              const blocked = i > 0 && !canProceed;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={blocked}
                  onClick={() => setStep(i)}
                  className={cn(
                    "inline-flex items-center gap-2 border-2 border-foreground px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-colors",
                    state === "current" && "bg-accent shadow-[3px_3px_0_0_var(--ink)]",
                    state === "done" && "bg-[#b7e6a5] hover:bg-[#a5dd8f]",
                    state === "todo" && "bg-card hover:bg-accent/60",
                    blocked && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center border border-foreground text-[9px]",
                      state === "done" ? "bg-foreground text-background" : "bg-background",
                    )}
                  >
                    {state === "done" ? <Check className="size-2.5" /> : i + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
        {/* ------------------------------ step content ------------------------------ */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* ================= STEP 1 — TASK ================= */}
          {step === 0 && (
            <>
              <section className="nb-card bg-card">
                <div className="border-b-2 border-foreground bg-[#d9c6ff] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                  Step 01 — Choose your route
                </div>
                <div className="p-3">
                  <p className="mb-2.5 text-[12.5px] leading-5 text-foreground/75">
                    Take the quick route with a preset, or write the task
                    yourself. Presets shape the agent chain — you can fine-tune
                    every stage in step 02.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => pickPreset(preset.key, preset.task)}
                        aria-pressed={activePreset === preset.key}
                        className={cn(
                          "border-2 border-foreground px-2.5 py-2 text-left transition-shadow",
                          activePreset === preset.key
                            ? "bg-accent shadow-[3px_3px_0_0_var(--ink)]"
                            : "bg-background hover:bg-accent/50 hover:shadow-[2px_2px_0_0_var(--ink)]",
                        )}
                      >
                        <span className="block text-[12px] font-black uppercase tracking-wide">
                          {preset.label}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                          {preset.task}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="nb-card bg-card">
                <div className="border-b-2 border-foreground bg-[#a5c8ff] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                  Your task
                </div>
                <div className="p-3">
                  <textarea
                    value={task}
                    onChange={(e) => {
                      setTask(e.target.value);
                      setActivePreset(null);
                    }}
                    rows={3}
                    placeholder="Describe what to build — e.g. “Add a dark-mode toggle to my dashboard and open the PR”"
                    className="w-full resize-none border-2 border-foreground bg-background px-3 py-2.5 text-[14px] leading-6 outline-none placeholder:text-muted-foreground focus:bg-[#fffdf2]"
                  />
                  <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    plain language in → full agent chain out · no credits
                  </p>
                </div>
              </section>

              <section className="nb-card bg-card">
                <div className="border-b-2 border-foreground bg-[#ffd0a1] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                  Target repo — optional
                </div>
                <div className="flex flex-col gap-3 p-3">
                  <GitHubSync
                    targetFullName={syncRepo?.fullName ?? null}
                    onPick={handlePickRepo}
                    onClear={syncRepo ? () => setSyncRepo(null) : undefined}
                  />
                  {showRepoInput ? (
                    <div className="flex items-center gap-1.5 border-2 border-foreground bg-background px-2">
                      <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                      <input
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full bg-transparent py-2 text-[12.5px] outline-none placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        aria-label="Remove repo URL"
                        onClick={() => {
                          setRepoUrl("");
                          setShowRepoInput(false);
                        }}
                        className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    !syncRepo && (
                      <button
                        type="button"
                        onClick={() => setShowRepoInput(true)}
                        className="inline-flex items-center gap-1.5 self-start border-2 border-foreground bg-background px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider hover:bg-accent"
                      >
                        <Link2 className="size-3.5" />
                        Or paste any public repo URL
                      </button>
                    )
                  )}
                  <p className="font-mono text-[9.5px] uppercase leading-4 tracking-wider text-muted-foreground">
                    no repo → runs stay in workspace mode · with a targeted
                    repo + PAT/OAuth, commit + PR stages push for real
                  </p>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-accent px-4 py-2 text-[12px] font-black uppercase tracking-wide shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd600] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next — shape the chain
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 2 — PIPELINE ================= */}
          {step === 1 && (
            <>
              <section className="nb-card bg-card">
                <div className="border-b-2 border-foreground bg-[#d9c6ff] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                  Step 02 — Fine-tune the chain
                </div>
                <div className="p-3">
                  <p className="mb-3 text-[12.5px] leading-5 text-foreground/75">
                    The chain runs top to bottom in this order. Toggle what you
                    need — the run executes exactly the stages left on. Plan,
                    implement and verify always stay on.
                  </p>
                  <ol className="flex flex-col gap-1.5">
                    {pipeline.map((stage, index) => {
                      const meta = agentMeta(stage.agent);
                      const off = excluded.has(stage.id);
                      const locked = REQUIRED.has(stage.id);
                      return (
                        <li
                          key={stage.id}
                          className={cn(
                            "flex items-center gap-3 border-2 border-foreground px-3 py-2.5 transition-colors",
                            off ? "bg-background opacity-60" : "bg-card",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center border-2 border-foreground font-mono text-[11px] font-black",
                              off ? "bg-muted text-muted-foreground" : meta.chip,
                            )}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-[12.5px] font-black uppercase tracking-wide",
                                off && "line-through decoration-2",
                              )}
                            >
                              {stage.title}
                            </span>
                            <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              {meta.label} · {STAGE_BLURB[stage.id] ?? "agent stage"}
                            </span>
                          </span>
                          {locked ? (
                            <span className="shrink-0 border border-foreground bg-[#fff8dd] px-1.5 py-0.5 font-mono text-[8.5px] font-black uppercase tracking-wider">
                              required
                            </span>
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!off}
                              aria-label={`${off ? "Include" : "Skip"} ${stage.title}`}
                              onClick={() => toggleStage(stage.id)}
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center border-2 border-foreground transition-colors",
                                off
                                  ? "bg-background hover:bg-[#b7e6a5]/50"
                                  : "bg-[#b7e6a5] hover:bg-[#a5dd8f]",
                              )}
                            >
                              {off ? (
                                <X className="size-3.5 text-muted-foreground" />
                              ) : (
                                <Check className="size-3.5 text-black" />
                              )}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {skippedCount > 0 && (
                    <p className="mt-2.5 border-2 border-foreground bg-[#fff8dd] px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider">
                      ⚠ {skippedCount} stage{skippedCount === 1 ? "" : "s"} will
                      be skipped — skipped stages produce no commits, no checks
                      and no PR updates
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-card px-3.5 py-2 text-[12px] font-black uppercase tracking-wide hover:bg-accent"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-accent px-4 py-2 text-[12px] font-black uppercase tracking-wide shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd600] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Next — review &amp; launch
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 3 — FINALISE ================= */}
          {step === 2 && (
            <>
              <section className="nb-card bg-card">
                <div className="border-b-2 border-foreground bg-[#ffd0a1] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                  Step 03 — Final check
                </div>
                <div className="flex flex-col gap-3 p-3">
                  <div>
                    <p className="font-mono text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Task
                    </p>
                    <p className="mt-1 border-2 border-foreground bg-background px-2.5 py-2 text-[13px] leading-6">
                      {taskTrimmed}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Stages kept", value: activeStages.length },
                      { label: "Skipped", value: skippedCount },
                      {
                        label: "Repo",
                        value: syncRepo?.fullName
                          ? "synced"
                          : repoUrl.trim()
                            ? "URL set"
                            : "workspace",
                      },
                      { label: "Cost", value: "$0.00" },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="border-2 border-foreground bg-background px-2.5 py-2"
                      >
                        <p className="font-mono text-[8.5px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                          {cell.label}
                        </p>
                        <p className="mt-0.5 truncate text-[15px] font-black uppercase tracking-tight">
                          {cell.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="font-mono text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Chain that will run
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {activeStages.map((s) => (
                        <span
                          key={s.id}
                          className="border border-foreground bg-card px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                        >
                          {s.id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-2 border-foreground bg-background px-2.5 py-2">
                    <p className="font-mono text-[8.5px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Branch
                    </p>
                    <p className="truncate font-mono text-[12px] font-bold">
                      {branch}
                    </p>
                  </div>

                  <div className="border-2 border-foreground bg-[#fff8dd] px-2.5 py-2 font-mono text-[9.5px] uppercase leading-4 tracking-wider">
                    engine: local free engine — add SAMBANOVA_API_KEY in Keys to
                    upgrade planning to an open LLM. skipped stages produce no
                    side effects.
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-card px-3.5 py-2 text-[12px] font-black uppercase tracking-wide hover:bg-accent"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={launching}
                  onClick={launch}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-5 py-2.5 text-[13px] font-black uppercase tracking-wide text-background shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#2a2a2a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {launching ? (
                    <Sparkles className="size-4 animate-spin" />
                  ) : (
                    <Rocket className="size-4" />
                  )}
                  {launching ? "Launching chain…" : `Run the chain — ${activeStages.length} stages`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ------------------------------ live preview ------------------------------ */}
        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <section className="nb-card bg-card">
            <div className="flex items-center justify-between border-b-2 border-foreground bg-[#a5f0e0] px-3 py-2">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                Live chain preview
              </p>
              <span className="border border-foreground bg-background px-1 font-mono text-[9px] font-black uppercase">
                {activeStages.length}/{pipeline.length}
              </span>
            </div>
            <div className="p-3">
              {canProceed ? (
                <ol className="flex flex-col gap-1">
                  {pipeline.map((stage) => {
                    const off = excluded.has(stage.id);
                    const meta = agentMeta(stage.agent);
                    return (
                      <li
                        key={stage.id}
                        className={cn(
                          "flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider",
                          off && "text-muted-foreground line-through",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-2 shrink-0 border border-foreground",
                            off ? "bg-muted" : meta.swatch,
                          )}
                        />
                        <span className="truncate">{stage.id}</span>
                        <span className="ml-auto shrink-0 text-[8.5px] text-muted-foreground">
                          {off ? "skipped" : meta.tag}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <GhostMark className="size-8 text-muted-foreground" />
                  <p className="font-mono text-[9.5px] uppercase leading-4 tracking-wider text-muted-foreground">
                    describe a task in step 01
                    <br />
                    to shape the chain
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-foreground/15 px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
              exactly what the engine will execute
            </div>
          </section>

          <section className="nb-card bg-[#fff8dd]">
            <div className="border-b-2 border-foreground px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
              How it works
            </div>
            <ul className="flex flex-col gap-1.5 p-3 font-mono text-[9.5px] uppercase leading-4 tracking-wider text-foreground/80">
              <li>· presets seed the task text, not a fake plan</li>
              <li>· toggles change the real run — skipped stages are skipped</li>
              <li>· the run streams live on the console page</li>
              <li>· no credits, ever — bring-your-own-key optional</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PhotonShell } from "@/components/ghost/PhotonShell";
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
  Check,
  Link2,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

/** Fading glyph rain behind the wizard header (pure canvas, ~15fps). */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const fontSize = 14;
    let cols = Math.max(1, Math.floor(w / fontSize));
    let drops = Array.from({ length: cols }, () => Math.random() * -60);
    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 66) return; // ~15fps — retro cadence, cheap to render
      last = t;
      ctx.fillStyle = "rgba(6, 10, 7, 0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
        ctx.fillStyle = Math.random() < 0.03 ? "#b4ffcb" : "#00ff41";
        ctx.globalAlpha = 0.55;
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;
        if (drops[i] * fontSize > h && Math.random() > 0.982) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      cols = Math.max(1, Math.floor(w / fontSize));
      drops = Array.from({ length: cols }, () => Math.random() * -60);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="mx-rain pointer-events-none absolute inset-x-0 top-0 z-0 h-[420px] w-full opacity-25"
    />
  );
}

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

  // Terminal header: types out the live chain as it changes.
  const chainSequence = activeStages.map((s) => s.id).join(" → ");
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setTyped(chainSequence.slice(0, i));
      if (i >= chainSequence.length) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [chainSequence]);

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
    <PhotonShell active="build" contentClassName="px-build-shell">
      <div className="mx-page" style={{ minHeight: "auto", background: "transparent" }}>
      <MatrixRain />

      {/* header + step rail */}
      <header className="relative z-[2] border-b border-[var(--mx-border)] bg-[var(--mx-panel)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="mx-glow font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--mx-green)]">
                ghost://build-wizard
              </span>
              <span className="mx-chip">guided mode</span>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-wider text-[var(--mx-green-dim)] sm:block">
              <span className="text-[var(--mx-green)]">&gt;</span> {typed}
              <span className="mx-glow animate-pulse text-[var(--mx-green)]">█</span>
            </p>
          </div>
          <nav aria-label="Wizard steps" className="flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => {
              const state = i === step ? "current" : i < step ? "done" : "todo";
              const blocked = i > 0 && !canProceed;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={blocked}
                  onClick={() => setStep(i)}
                  className={cn(
                    "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-colors",
                    state === "current" &&
                      "border-[var(--mx-border-strong)] bg-[rgba(0,255,65,0.16)] text-[var(--mx-green)] shadow-[0_0_14px_rgba(0,255,65,0.25)]",
                    state === "done" &&
                      "border-[var(--mx-border)] bg-transparent text-[var(--mx-green-soft)]",
                    state === "todo" &&
                      "border-[var(--mx-border)] bg-transparent text-[var(--mx-green-dim)] hover:bg-[rgba(0,255,65,0.08)]",
                    blocked && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center border text-[9px]",
                      state === "done"
                        ? "border-[var(--mx-green)] bg-[var(--mx-green)] text-[#04140a]"
                        : "border-[var(--mx-border)]",
                    )}
                  >
                    {state === "done" ? <Check className="size-2.5" /> : `0${i + 1}`}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-[2] mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
        {/* ------------------------------ step content ------------------------------ */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* ================= STEP 1 — TASK ================= */}
          {step === 0 && (
            <>
              <section className="mx-card">
                <div className="mx-card-head">
                  <span>Step 01 — Choose your route</span>
                  <GhostMark className="size-3.5 text-[var(--mx-green)]" />
                </div>
                <div className="p-3">
                  <p className="mx-dim mb-2.5 font-mono text-[11.5px] leading-5">
                    Take the quick route with a preset, or write the task
                    yourself. Presets shape the agent chain — fine-tune every
                    stage in step 02.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => pickPreset(preset.key, preset.task)}
                        aria-pressed={activePreset === preset.key}
                        className={cn(
                          "border px-2.5 py-2 text-left font-mono transition-colors",
                          activePreset === preset.key
                            ? "border-[var(--mx-border-strong)] bg-[rgba(0,255,65,0.14)] text-[var(--mx-green)]"
                            : "border-[var(--mx-border)] bg-[rgba(0,255,65,0.03)] text-[var(--mx-green-soft)] hover:bg-[rgba(0,255,65,0.08)]",
                        )}
                      >
                        <span className="block text-[12px] font-bold tracking-wide">
                          {preset.label}
                        </span>
                        <span className="mx-dim mt-0.5 block truncate text-[9.5px] uppercase tracking-wider">
                          {preset.task}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mx-card">
                <div className="mx-card-head">
                  <span>Your task</span>
                  <span className="mx-chip">required</span>
                </div>
                <div className="p-3">
                  <textarea
                    value={task}
                    onChange={(e) => {
                      setTask(e.target.value);
                      setActivePreset(null);
                    }}
                    rows={3}
                    placeholder='Describe what to build — e.g. "Add a dark-mode toggle to my dashboard and open the PR"'
                    className="mx-input resize-none font-mono text-[13px] leading-6"
                  />
                  <p className="mx-dim mt-1.5 font-mono text-[9.5px] uppercase tracking-wider">
                    plain language in → full agent chain out · no credits
                  </p>
                </div>
              </section>

              <section className="mx-card">
                <div className="mx-card-head">
                  <span>Target repo — optional</span>
                  <span className="mx-chip">github</span>
                </div>
                <div className="flex flex-col gap-3 p-3">
                  <div className="mx-embed">
                    <GitHubSync
                      targetFullName={syncRepo?.fullName ?? null}
                      onPick={handlePickRepo}
                      onClear={syncRepo ? () => setSyncRepo(null) : undefined}
                    />
                  </div>
                  {showRepoInput ? (
                    <div className="flex items-center gap-1.5 border border-[var(--mx-border)] bg-[rgba(0,255,65,0.04)] px-2">
                      <Link2 className="size-3.5 shrink-0 text-[var(--mx-green-dim)]" />
                      <input
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full bg-transparent py-2 font-mono text-[12.5px] text-[var(--mx-green)] outline-none placeholder:text-[var(--mx-green-dim)]"
                      />
                      <button
                        type="button"
                        aria-label="Remove repo URL"
                        onClick={() => {
                          setRepoUrl("");
                          setShowRepoInput(false);
                        }}
                        className="shrink-0 p-1 text-[var(--mx-green-dim)] hover:text-[var(--mx-green)]"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    !syncRepo && (
                      <button
                        type="button"
                        onClick={() => setShowRepoInput(true)}
                        className="mx-btn mx-btn-ghost self-start px-2.5 py-1.5 text-[10px]"
                      >
                        <Link2 className="size-3.5" />
                        Or paste any public repo URL
                      </button>
                    )
                  )}
                  <p className="mx-dim font-mono text-[9.5px] uppercase leading-4 tracking-wider">
                    no repo → workspace mode · targeted repo + PAT/OAuth →
                    commit + PR stages push for real
                  </p>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={() => setStep(1)}
                  className="mx-btn mx-btn-primary"
                >
                  Next — shape the chain
                  <span aria-hidden>→</span>
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 2 — PIPELINE ================= */}
          {step === 1 && (
            <>
              <section className="mx-card">
                <div className="mx-card-head">
                  <span>Step 02 — Fine-tune the chain</span>
                  <span className="mx-chip">
                    {activeStages.length}/{pipeline.length} active
                  </span>
                </div>
                <div className="p-3">
                  <p className="mx-dim mb-3 font-mono text-[11.5px] leading-5">
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
                            "flex items-center gap-3 border px-3 py-2.5 font-mono transition-colors",
                            off
                              ? "border-[var(--mx-border)] bg-transparent opacity-55"
                              : "border-[var(--mx-border)] bg-[rgba(0,255,65,0.05)]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center border text-[11px] font-bold",
                              off
                                ? "border-[var(--mx-border)] text-[var(--mx-green-dim)]"
                                : "border-[var(--mx-border-strong)] bg-[rgba(0,255,65,0.12)] text-[var(--mx-green)]",
                            )}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-[12.5px] font-bold tracking-wide text-[var(--mx-green-soft)]",
                                off && "line-through decoration-[var(--mx-green-dim)]",
                              )}
                            >
                              {stage.title}
                            </span>
                            <span className="mx-dim block truncate text-[9px] uppercase tracking-wider">
                              {meta.label} · {STAGE_BLURB[stage.id] ?? "agent stage"}
                            </span>
                          </span>
                          {locked ? (
                            <span className="mx-chip shrink-0">required</span>
                          ) : (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!off}
                              aria-label={`${off ? "Include" : "Skip"} ${stage.title}`}
                              onClick={() => toggleStage(stage.id)}
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center border transition-colors",
                                off
                                  ? "border-[var(--mx-border)] text-[var(--mx-green-dim)] hover:bg-[rgba(0,255,65,0.1)]"
                                  : "border-[var(--mx-green)] bg-[rgba(0,255,65,0.18)] text-[var(--mx-green)] hover:bg-[rgba(0,255,65,0.3)]",
                              )}
                            >
                              {off ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {skippedCount > 0 && (
                    <p className="mt-2.5 border border-[var(--mx-border-strong)] bg-[rgba(0,255,65,0.07)] px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[var(--mx-green)]">
                      ⚠ {skippedCount} stage{skippedCount === 1 ? "" : "s"} will
                      be skipped — skipped stages produce no commits, no checks
                      and no PR updates
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setStep(0)} className="mx-btn mx-btn-ghost">
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <button type="button" onClick={() => setStep(2)} className="mx-btn mx-btn-primary">
                  Next — review &amp; launch
                  <span aria-hidden>→</span>
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 3 — FINALISE ================= */}
          {step === 2 && (
            <>
              <section className="mx-card">
                <div className="mx-card-head">
                  <span>Step 03 — Final check</span>
                  <span className="mx-chip">ready</span>
                </div>
                <div className="flex flex-col gap-3 p-3">
                  <div>
                    <p className="mx-dim font-mono text-[9.5px] font-bold uppercase tracking-[0.2em]">
                      Task
                    </p>
                    <p className="mt-1 border border-[var(--mx-border)] bg-[rgba(0,255,65,0.04)] px-2.5 py-2 font-mono text-[13px] leading-6 text-[var(--mx-green-soft)]">
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
                        className="border border-[var(--mx-border)] bg-[rgba(0,255,65,0.04)] px-2.5 py-2"
                      >
                        <p className="mx-dim font-mono text-[8.5px] font-bold uppercase tracking-[0.18em]">
                          {cell.label}
                        </p>
                        <p className="mx-glow mt-0.5 truncate font-mono text-[15px] font-bold text-[var(--mx-green)]">
                          {cell.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mx-dim font-mono text-[9.5px] font-bold uppercase tracking-[0.2em]">
                      Chain that will run
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {activeStages.map((s) => (
                        <span
                          key={s.id}
                          className="border border-[var(--mx-border)] bg-[rgba(0,255,65,0.06)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--mx-green-soft)]"
                        >
                          {s.id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[var(--mx-border)] bg-[rgba(0,255,65,0.04)] px-2.5 py-2">
                    <p className="mx-dim font-mono text-[8.5px] font-bold uppercase tracking-[0.18em]">
                      Branch
                    </p>
                    <p className="truncate font-mono text-[12px] font-bold text-[var(--mx-green)]">
                      {branch}
                    </p>
                  </div>

                  <div className="mx-dim border border-[var(--mx-border)] bg-[rgba(0,255,65,0.04)] px-2.5 py-2 font-mono text-[9.5px] uppercase leading-4 tracking-wider">
                    engine: local free engine — add SAMBANOVA_API_KEY in Keys to
                    upgrade planning to an open LLM. skipped stages produce no
                    side effects.
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setStep(1)} className="mx-btn mx-btn-ghost">
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={launching}
                  onClick={launch}
                  className="mx-btn mx-btn-primary px-5 py-2.5 text-[13px]"
                >
                  {launching ? (
                    <Sparkles className="size-4 animate-spin" />
                  ) : (
                    <Rocket className="size-4" />
                  )}
                  {launching
                    ? "Launching chain…"
                    : `Generate & launch — ${activeStages.length} stages`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ------------------------------ live preview ------------------------------ */}
        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <section className="mx-card">
            <div className="mx-card-head">
              <span>Live chain preview</span>
              <span className="mx-chip">
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
                          off
                            ? "text-[var(--mx-green-dim)] line-through"
                            : "text-[var(--mx-green-soft)]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-2 shrink-0 border",
                            off
                              ? "border-[var(--mx-border)] bg-transparent"
                              : "border-[var(--mx-border-strong)] bg-[rgba(0,255,65,0.35)]",
                          )}
                          title={meta.label}
                        />
                        <span className="truncate">{stage.id}</span>
                        <span className="mx-dim ml-auto shrink-0 text-[8.5px]">
                          {off ? "skipped" : meta.tag}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <GhostMark className="size-8 text-[var(--mx-green-dim)]" />
                  <p className="mx-dim font-mono text-[9.5px] uppercase leading-4 tracking-wider">
                    describe a task in step 01
                    <br />
                    to shape the chain
                  </p>
                </div>
              )}
            </div>
            <div className="mx-dim border-t border-[var(--mx-border)] px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-wider">
              exactly what the engine will execute
            </div>
          </section>

          <section className="mx-card">
            <div className="mx-card-head">
              <span>How it works</span>
            </div>
            <ul className="mx-dim flex flex-col gap-1.5 p-3 font-mono text-[9.5px] uppercase leading-4 tracking-wider">
              <li>· presets seed the task text, not a fake plan</li>
              <li>· toggles change the real run — skipped stages are skipped</li>
              <li>· the run streams live on the console page</li>
              <li>· no credits, ever — bring-your-own-key optional</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
    </PhotonShell>
  );
}

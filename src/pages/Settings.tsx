import { AppNav } from "@/components/ghost/AppNav";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/use-app-settings";
import type { SyncedRepoPick } from "@/components/ghost/GitHubSync";
import {
  GitBranch,
  Github,
  KeyRound,
  Loader2,
  Monitor,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

type Draft = ReturnType<typeof useAppSettings>["settings"];

const ENGINE_MODES: {
  value: Draft["engineMode"];
  label: string;
  chip: string;
  desc: string;
}[] = [
  {
    value: "auto",
    label: "Auto",
    chip: "bg-accent text-foreground",
    desc: "Use the LLM chain when a provider key is set, otherwise the local engine.",
  },
  {
    value: "local",
    label: "Local engine only",
    chip: "bg-[#00ff41] text-black",
    desc: "Always run the deterministic zero-key engine. Never calls out to a provider.",
  },
  {
    value: "force_llm",
    label: "Prefer LLM chain",
    chip: "bg-[#4dd8e6] text-black",
    desc: "Try the provider chain first (needs a key in Keys), fall back to local.",
  },
];

const PR_MODES: {
  value: Draft["prMode"];
  label: string;
  chip: string;
  desc: string;
}[] = [
  {
    value: "auto_pr",
    label: "Open real pull requests",
    chip: "bg-[#00ff41] text-black",
    desc: "Live runs push a real branch and open a PR on the targeted repo.",
  },
  {
    value: "plan_only",
    label: "Plan only (no GitHub writes)",
    chip: "bg-[#ff9e64] text-black",
    desc: "Runs never publish. Generated files stay reviewable in the console.",
  },
];

function Section({
  icon,
  title,
  note,
  children,
}: {
  icon: ReactNode;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="nb-card bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-foreground px-3 py-2 text-background">
        <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.18em]">
          {icon}
          {title}
        </p>
        {note ? (
          <span className="font-mono text-[9px] uppercase tracking-wider text-background/60">
            {note}
          </span>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function ChoiceRow({
  chip,
  label,
  desc,
  selected,
  onClick,
}: {
  chip: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 border-2 p-3 text-left transition-colors",
        selected
          ? "border-foreground bg-accent shadow-[3px_3px_0_0_var(--ink)]"
          : "border-foreground/25 bg-background hover:border-foreground hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0 border-2 border-foreground px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider",
          chip,
        )}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[12px] leading-5 text-foreground/80">
        {desc}
      </span>
      <span
        className={cn(
          "mt-0.5 size-3.5 shrink-0 border-2 border-foreground",
          selected ? "bg-[#00ff41]" : "bg-transparent",
        )}
      />
    </button>
  );
}

export default function Settings() {
  const { settings, loaded, save } = useAppSettings();
  const [draft, setDraft] = useState<Draft>(settings);
  const [saving, setSaving] = useState(false);

  // Re-sync the local draft when the server settings arrive.
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await save(draft);
      setDraft({ ...draft, ...saved });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nb-grid-paper min-h-screen bg-background text-foreground">
      <AppNav active="settings" />

      <main className="mx-auto max-w-[900px] px-3 pb-16 pt-6 sm:px-4 sm:pt-8">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="nb-overline text-muted-foreground">
              Ghost Web AI · Preferences
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="mt-1 max-w-lg text-[13px] leading-6 text-foreground/70">
              Engine, publishing, GitHub defaults and appearance — saved to your
              account and applied to every new run.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDraft(settings)}
              disabled={!dirty || saving}
              className="gap-2 border-2 border-foreground bg-card text-xs font-black uppercase tracking-wide hover:bg-accent"
            >
              <RotateCcw className="size-3.5" /> Revert
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="gap-2 border-2 border-foreground bg-accent text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd166] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>

        {!loaded ? (
          <div className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading settings…
          </div>
        ) : null}

        <div className={cn("mt-6 flex flex-col gap-4", !loaded && "opacity-70")}>
          {/* engine */}
          <Section
            icon={<Sparkles className="size-3.5" />}
            title="Agent engine"
            note="applied to new runs"
          >
            <div className="flex flex-col gap-2">
              {ENGINE_MODES.map((mode) => (
                <ChoiceRow
                  key={mode.value}
                  chip={mode.chip}
                  label={mode.label}
                  desc={mode.desc}
                  selected={draft.engineMode === mode.value}
                  onClick={() => setDraft({ ...draft, engineMode: mode.value })}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <ToggleRow
                label="Allow custom pipelines"
                desc="Let the /build wizard reorder or drop stages. Off = always run the canonical 10-stage chain."
                checked={draft.allowCustomPipeline}
                onChange={(v) => setDraft({ ...draft, allowCustomPipeline: v })}
              />
              <ToggleRow
                label="Read the target repository"
                desc="Let the engine fetch the repo tree and key files for context. Off = plans run blind, nothing is fetched."
                checked={draft.allowRepoContext}
                onChange={(v) => setDraft({ ...draft, allowRepoContext: v })}
              />
            </div>
          </Section>

          {/* publishing */}
          <Section
            icon={<GitBranch className="size-3.5" />}
            title="Publishing & GitHub"
            note="branch → commit → PR"
          >
            <div className="flex flex-col gap-2">
              {PR_MODES.map((mode) => (
                <ChoiceRow
                  key={mode.value}
                  chip={mode.chip}
                  label={mode.label}
                  desc={mode.desc}
                  selected={draft.prMode === mode.value}
                  onClick={() => setDraft({ ...draft, prMode: mode.value })}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Branch prefix
                </span>
                <input
                  value={draft.branchPrefix}
                  onChange={(e) =>
                    setDraft({ ...draft, branchPrefix: e.target.value })
                  }
                  placeholder="feat/"
                  maxLength={24}
                  className="border-2 border-foreground bg-background px-2.5 py-2 font-mono text-[12px] outline-none focus:bg-[#0f2417]"
                />
                <span className="text-[11px] leading-4 text-foreground/60">
                  Live runs branch as <code>{draft.branchPrefix || "feat/"}slug-of-task</code>.
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Default repo URL
                </span>
                <input
                  value={draft.defaultRepoUrl ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, defaultRepoUrl: e.target.value })
                  }
                  placeholder="https://github.com/owner/repo"
                  className="border-2 border-foreground bg-background px-2.5 py-2 font-mono text-[12px] outline-none placeholder:text-muted-foreground focus:bg-[#0f2417]"
                />
                <span className="text-[11px] leading-4 text-foreground/60">
                  Prefilled as the repo target for new console sessions.
                </span>
              </label>
            </div>
          </Section>

          {/* appearance */}
          <Section
            icon={<Monitor className="size-3.5" />}
            title="Appearance"
            note="applies instantly"
          >
            <ToggleRow
              label="Reduce motion"
              desc="Tone down pulses and looping animations app-wide. Good for motion sensitivity and slower devices."
              checked={draft.reduceMotion}
              onChange={(v) => setDraft({ ...draft, reduceMotion: v })}
            />
          </Section>

          {/* keys + account */}
          <Section
            icon={<KeyRound className="size-3.5" />}
            title="Keys & account"
            note="managed in project settings"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-2 border-foreground bg-[#0f2417] p-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="size-3.5 text-[#00ff41]" /> Provider
                  keys
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-foreground/75">
                  ANTHROPIC_API_KEY, SAMBANOVA_API_KEY, OPENAI_API_KEY and
                  GITHUB_PAT / GITHUB_TOKEN are deployment-wide keys, managed in
                  the project's Keys settings — never in source. Prefer OAuth?
                  Connect from the{" "}
                  <Link to="/dashboard" className="underline hover:bg-accent">
                    dashboard
                  </Link>
                  .
                </p>
              </div>
              <div className="border-2 border-foreground bg-[#0f2417] p-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest">
                  <Github className="size-3.5 text-[#4dd8e6]" /> Connections
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-foreground/75">
                  Connect or disconnect a GitHub account and sync repos from the{" "}
                  <Link to="/dashboard" className="underline hover:bg-accent">
                    dashboard
                  </Link>{" "}
                  or directly in the{" "}
                  <Link to="/chat" className="underline hover:bg-accent">
                    console
                  </Link>
                  . Tokens stay server-side.
                </p>
              </div>
            </div>
          </Section>

          {/* team + wizard cross-links */}
          <Section
            icon={<Wand2 className="size-3.5" />}
            title="Quick actions"
            note="shortcuts"
          >
            <div className="flex flex-wrap gap-2">
              <Link to="/build">
                <Button
                  variant="ghost"
                  className="gap-2 border-2 border-foreground bg-card text-[11px] font-black uppercase tracking-wide hover:bg-accent"
                >
                  <Wand2 className="size-3.5" /> Open build wizard
                </Button>
              </Link>
              <Link to="/chat">
                <Button
                  variant="ghost"
                  className="gap-2 border-2 border-foreground bg-card text-[11px] font-black uppercase tracking-wide hover:bg-accent"
                >
                  <Terminal className="size-3.5" /> Open console
                </Button>
              </Link>
              <Link to="/team">
                <Button
                  variant="ghost"
                  className="gap-2 border-2 border-foreground bg-card text-[11px] font-black uppercase tracking-wide hover:bg-accent"
                >
                  <Github className="size-3.5" /> Task-force board
                </Button>
              </Link>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-start gap-3 border-2 p-3 text-left transition-colors",
        checked
          ? "border-foreground bg-accent/20"
          : "border-foreground/25 bg-background hover:border-foreground",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-9 shrink-0 items-center border-2 border-foreground px-0.5 transition-colors",
          checked ? "bg-[#00ff41]" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "size-3 border border-foreground bg-foreground transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-bold uppercase tracking-wide">
          {label}
        </span>
        <span className="mt-0.5 block text-[12px] leading-5 text-foreground/70">
          {desc}
        </span>
      </span>
    </button>
  );
}

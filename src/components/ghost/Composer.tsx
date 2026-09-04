import { Button } from "@/components/ui/button";
import { GhostMark } from "./GhostMark";
import { Link2, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const EXAMPLE_TASKS = [
  "Build a realtime chat feature for my repo and open the PR",
  "Add a neobrutalist landing page + auth to my GitHub repo",
  "Turn my web app into an Android app with tests",
  "Add an AI assistant endpoint with provider fallback",
];

export function Composer({
  onSubmit,
  busy,
  repoUrlPlaceholder,
  defaultRepoUrl,
}: {
  onSubmit: (task: string, repoUrl?: string) => void;
  busy?: boolean;
  repoUrlPlaceholder?: string;
  defaultRepoUrl?: string;
}) {
  const [task, setTask] = useState("");
  const [repoUrl, setRepoUrl] = useState(defaultRepoUrl ?? "");
  const [showRepo, setShowRepo] = useState(!!defaultRepoUrl);

  const canSubmit = task.trim().length > 0 && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(task.trim(), repoUrl.trim() || undefined);
    setTask("");
  };

  return (
    <div className="nb-card bg-card">
      <div className="border-b-2 border-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="mr-2 inline-block size-2 animate-pulse bg-[#b7e6a5] align-middle" />
        Ghost terminal — describe the build
      </div>
      <div className="p-3">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={2}
          placeholder='Try: "Add a neobrutalist landing page to my GitHub repo and push it as a PR"'
          className="w-full resize-none border-2 border-foreground bg-background px-3 py-2.5 text-[14px] leading-6 outline-none placeholder:text-muted-foreground focus:bg-[#fffdf2]"
        />

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          {showRepo ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5 border-2 border-foreground bg-background px-2">
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
                  setShowRepo(false);
                }}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRepo(true)}
              className="inline-flex shrink-0 items-center gap-1.5 border-2 border-foreground bg-[#d9c6ff] px-2.5 py-2 font-mono text-[10.5px] font-bold uppercase tracking-wider text-foreground hover:bg-[#cdb4f5]"
            >
              <Link2 className="size-3.5" />
              Target a GitHub repo
            </button>
          )}

          <Button
            type="button"
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="shrink-0 gap-2 border-2 border-foreground bg-accent px-5 text-sm font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd600] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {busy ? "Chain running…" : "Run the chain"}
          </Button>
        </div>

        {/* hint bar */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="inline-block border border-foreground bg-[#b7e6a5] px-1 text-foreground">
              100% free
            </span>
            no credits · no paywall · open models · bring-your-own-key optional
          </p>
        </div>

        {/* suggestions */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-foreground/15 pt-3">
          {EXAMPLE_TASKS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setTask(suggestion)}
              className={cn(
                "inline-flex items-center gap-1.5 border border-foreground bg-background px-2 py-1 text-left text-[11px] leading-4 text-foreground/85",
                "hover:bg-accent hover:shadow-[2px_2px_0_0_var(--ink)]",
              )}
            >
              <GhostMark className="size-3" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

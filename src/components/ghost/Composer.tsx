import { Button } from "@/components/ui/button";
import { GhostMark } from "./GhostMark";
import {
  ASSISTANT_AGENTS,
  ASSISTANT_CAPABILITIES,
  ASSISTANT_MODELS,
  DEFAULT_ASSISTANT_AGENT,
  DEFAULT_ASSISTANT_MODEL,
  type AssistantAgentId,
  type AssistantCapability,
} from "@/lib/ai-models";
import { ArrowUp, ChevronDown, Link2, Loader2, Paperclip, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type AssistantProvider = "server" | "puter";

export const EXAMPLE_TASKS = [
  "Build a realtime chat feature for my repo",
  "Create a 10-slide product launch deck",
  "Make a 60-second launch video storyboard",
  "Set up an always-on support bot for my team",
];

export function Composer({
  onSubmit,
  busy,
  repoUrlPlaceholder: _repoUrlPlaceholder,
  defaultRepoUrl,
  initialTask,
  gatewayConfigured,
  ollamaEnabled,
}: {
  onSubmit: (
    task: string,
    repoUrl?: string,
    model?: string,
    capability?: AssistantCapability,
    agent?: AssistantAgentId,
    provider?: AssistantProvider,
  ) => void;
  busy?: boolean;
  repoUrlPlaceholder?: string;
  defaultRepoUrl?: string;
  initialTask?: string;
  gatewayConfigured?: boolean;
  ollamaEnabled?: boolean;
}) {
  const [task, setTask] = useState(initialTask ?? "");
  const [repoUrl, setRepoUrl] = useState(defaultRepoUrl ?? "");
  const [showRepo, setShowRepo] = useState(!!defaultRepoUrl);
  const [capability, setCapability] = useState<AssistantCapability>("build");
  const [model, setModel] = useState(DEFAULT_ASSISTANT_MODEL);
  const [agent, setAgent] = useState<AssistantAgentId>(DEFAULT_ASSISTANT_AGENT);
  const [provider, setProvider] = useState<AssistantProvider>("server");

  const canSubmit = task.trim().length > 0 && !busy;
  const selectedCapability = ASSISTANT_CAPABILITIES.find((item) => item.id === capability);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(task.trim(), repoUrl.trim() || undefined, model, capability, agent, provider);
    setTask("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[24px] border border-foreground/15 bg-card/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors focus-within:border-foreground/30">
        <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 pt-1">
          {ASSISTANT_CAPABILITIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCapability(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                capability === item.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", capability === item.id ? "bg-accent" : "bg-foreground/25")} />
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={3}
          placeholder={`Ask Ghost to ${selectedCapability?.label.toLowerCase() ?? "build"} something…`}
          className="min-h-[82px] w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground/70"
          aria-label="Message the super assistant"
        />

        <div className="flex flex-wrap items-center gap-1.5 border-t border-foreground/10 px-2 pt-2">
          <label className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
            <span>Agent</span>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value as AssistantAgentId)}
              className="max-w-[110px] appearance-none bg-transparent pr-1 text-[10px] font-semibold text-foreground outline-none"
              aria-label="Agent profile"
            >
              {ASSISTANT_AGENTS.map((item) => (
                <option key={item.id} value={item.id} className="bg-background">
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3 opacity-50" />
          </label>
          <label className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground sm:flex">
            <span>Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="max-w-[125px] appearance-none bg-transparent pr-1 text-[10px] font-semibold text-foreground outline-none"
              aria-label="AI model"
            >
              {ASSISTANT_MODELS.map((item) => (
                <option key={item.id} value={item.id} className="bg-background">
                  {item.label} · {item.family}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3 opacity-50" />
          </label>
          <label className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:flex">
            <span>Engine</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AssistantProvider)}
              className="max-w-[112px] appearance-none bg-transparent pr-1 text-[10px] font-semibold text-foreground outline-none"
              aria-label="AI engine"
            >
              <option value="server" className="bg-background">Server chain</option>
              <option value="puter" className="bg-background">Puter browser</option>
            </select>
            <ChevronDown className="size-3 opacity-50" />
          </label>

          {showRepo ? (
            <div className="flex min-w-0 max-w-[220px] items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-2 py-1.5 text-[10px] text-foreground/75">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="owner/repository"
                className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
                aria-label="GitHub repository URL"
              />
              <button
                type="button"
                aria-label="Remove repo URL"
                onClick={() => {
                  setRepoUrl("");
                  setShowRepo(false);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRepo(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <Paperclip className="size-3.5" />
              Attach repo
            </button>
          )}

          <span className="hidden flex-1 items-center gap-1 text-[10px] text-muted-foreground/60 lg:flex">
            <Sparkles className="size-3" />
            {ollamaEnabled ? "Local Ollama ready" : gatewayConfigured === false ? "Local fallback ready" : "200+ models ready"}
          </span>
          <Button
            type="button"
            size="icon"
            disabled={!canSubmit}
            onClick={handleSubmit}
            aria-label={busy ? "Assistant is working" : "Send message"}
            className="ml-auto size-9 rounded-xl bg-foreground text-background shadow-none hover:bg-foreground/85 disabled:opacity-30"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <GhostMark className="size-3" />
        <span>Ghost can make mistakes. Review generated changes before shipping.</span>
      </div>
      <div className="mt-3 hidden flex-wrap justify-center gap-1.5 md:flex">
        {EXAMPLE_TASKS.slice(0, 3).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setTask(suggestion)}
            className="rounded-full border border-foreground/10 px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

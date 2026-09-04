// Ghost Web AI — client agent catalog + formatting helpers.

export interface StageView {
  id: string;
  agent: string;
  title: string;
  status: "pending" | "running" | "done" | "error" | "skipped";
  detail?: string;
  logs?: string[];
}

export interface RepoView {
  fullName: string;
  url: string;
  source: "github" | "local";
  description?: string;
  language?: string;
  license?: string;
  stars?: number;
  defaultBranch?: string;
}

export interface AgentMeta {
  key: string;
  label: string;
  tag: string;
  blurb: string;
  /** flat color classes for square chips */
  chip: string;
  /** square swatch (2x2) classes */
  swatch: string;
}

export const AGENTS: AgentMeta[] = [
  {
    key: "core",
    label: "AI Agent Core",
    tag: "CORE",
    blurb: "Plans the build, routes work, and self-heals any error the gates find.",
    chip: "bg-accent text-foreground",
    swatch: "bg-accent",
  },
  {
    key: "git",
    label: "Git Agent",
    tag: "GIT",
    blurb: "Branch, diff, commit, push and rollback — every change is a clean commit.",
    chip: "bg-[#a5c8ff] text-black",
    swatch: "bg-[#a5c8ff]",
  },
  {
    key: "github",
    label: "GitHub Agent",
    tag: "GH",
    blurb: "Repos, issues, PRs, Actions, releases and artifacts, all hands-free.",
    chip: "bg-foreground text-background",
    swatch: "bg-foreground",
  },
  {
    key: "web",
    label: "Web Agent",
    tag: "WEB",
    blurb: "Builds and ships web features straight into the working tree.",
    chip: "bg-[#b7e6a5] text-black",
    swatch: "bg-[#b7e6a5]",
  },
  {
    key: "android",
    label: "Android Agent",
    tag: "DROID",
    blurb: "Builds and tests Android modules when the task targets mobile.",
    chip: "bg-[#ffd0a1] text-black",
    swatch: "bg-[#ffd0a1]",
  },
  {
    key: "desktop",
    label: "Compatibility Agent",
    tag: "COMPAT",
    blurb: "Desktop/web compatibility — macOS Big Sur → current, Windows and Linux.",
    chip: "bg-[#d9c6ff] text-black",
    swatch: "bg-[#d9c6ff]",
  },
  {
    key: "api",
    label: "API / Provider Agent",
    tag: "API",
    blurb: "Multiple AI providers with automatic fallback — bring your own key, never a credit wall.",
    chip: "bg-[#a5f0e0] text-black",
    swatch: "bg-[#a5f0e0]",
  },
  {
    key: "security",
    label: "Security / Licence Agent",
    tag: "LEGAL",
    blurb: "Verifies open-source licences before any code or asset is integrated.",
    chip: "bg-[#ffb4ae] text-black",
    swatch: "bg-[#ffb4ae]",
  },
  {
    key: "ci",
    label: "CI Agent",
    tag: "CI",
    blurb: "build → test → first real error → fix → commit → CI → verify → next gate.",
    chip: "bg-[#d6d3cd] text-black",
    swatch: "bg-[#d6d3cd]",
  },
];

export function agentMeta(key: string): AgentMeta {
  return (
    AGENTS.find((a) => a.key === key) ?? {
      key,
      label: key,
      tag: key.toUpperCase().slice(0, 4),
      blurb: "",
      chip: "bg-muted text-foreground",
      swatch: "bg-muted",
    }
  );
}

export const stageOrderHint: Record<string, number> = Object.fromEntries(
  AGENTS.map((a, i) => [a.key, i]),
);

// ---------------- formatting helpers ----------------

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function runStatusCopy(
  status: string | undefined,
  runCount: number,
): { label: string; cls: string } {
  switch (status) {
    case "running":
      return { label: "RUNNING", cls: "bg-[#ffe01b] text-black" };
    case "done":
      return { label: "DONE", cls: "bg-[#b7e6a5] text-black" };
    case "error":
      return { label: "ERROR", cls: "bg-[#ff8b82] text-black" };
    default:
      return { label: runCount > 0 ? "READY" : "NEW", cls: "bg-muted text-foreground" };
  }
}

export function engineLabel(engine: string | undefined): string {
  return engine === "sambanova" ? "SAMBANOVA LLM" : "LOCAL ENGINE";
}

export function repoShort(fullName: string | undefined): string {
  if (!fullName) return "";
  return fullName.length > 34 ? `${fullName.slice(0, 31)}…` : fullName;
}

export function taskSnippet(content: string, max = 80): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

export function timeShort(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

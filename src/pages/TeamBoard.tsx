import { useMemo, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { PhotonShell } from "@/components/ghost/PhotonShell";
import { runStatusCopy, timeAgo } from "@/lib/ghost-agents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { teamAgent, TEAM_AGENTS } from "../convex/ghost/team";
import type { TeamNodeRow, TeamSharedRow } from "../convex/schema";
import {
  Check,
  CircleDashed,
  Clock,
  Lock,
  Play,
  ShieldAlert,
  Square,
  Users,
  X,
} from "lucide-react";

const STATUS_ICON: Record<string, typeof Check> = {
  pending: CircleDashed,
  running: Play,
  awaiting: Lock,
  done: Check,
  error: X,
  skipped: Square,
};

const STATUS_CLS: Record<string, string> = {
  pending: "bg-card text-muted-foreground",
  running: "bg-[#ffd166] text-black",
  awaiting: "bg-[#ff5c49] text-black",
  done: "bg-[#00ff41] text-black",
  error: "bg-[#ff5c49] text-black",
  skipped: "bg-muted text-muted-foreground",
};

function nodeTag(node: TeamNodeRow): string {
  if (node.kind === "gate") return "GATE";
  if (node.kind === "plan") return "PLAN";
  return "WORK";
}

export default function TeamBoard() {
  const runs = useQuery(api.ghost.teamQueries.listTeamRuns, {}) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const run = useQuery(
    api.ghost.teamQueries.getTeamRun,
    selectedId ? { teamId: selectedId as Id<"ghostTeams"> } : "skip",
  );

  const startTeamRun = useMutation(api.ghost.teamMutations.startTeamRun);
  const runTeam = useAction(api.ghost.teamActions.runTeam);
  const approveGate = useMutation(api.ghost.teamMutations.approveGate);
  const rejectGate = useMutation(api.ghost.teamMutations.rejectGate);
  const stopTeamRun = useMutation(api.ghost.teamMutations.stopTeamRun);

  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);

  const dispatch = async () => {
    if (!task.trim() || busy) return;
    setBusy(true);
    try {
      const { teamId } = await startTeamRun({ task });
      setSelectedId(teamId);
      await runTeam({ teamId: teamId as Id<"ghostTeams"> });
      setTask("");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (nodeId: string, approve: boolean) => {
    if (!run) return;
    if (approve) {
      await approveGate({ teamId: run._id, nodeId });
      await runTeam({ teamId: run._id });
    } else {
      await rejectGate({ teamId: run._id, nodeId });
    }
  };

  // Group nodes into waves for the board: wave k = nodes whose deps are all
  // in earlier waves. Mirrors computeWaves() visually without importing it.
  const waves = useMemo<TeamNodeRow[][]>(() => {
    if (!run) return [];
    const groups: TeamNodeRow[][] = [];
    const settled = new Set<string>();
    let remaining = run.nodes;
    while (remaining.length > 0) {
      const ready = remaining.filter((n) => n.deps.every((d) => settled.has(d)));
      if (ready.length === 0) break;
      groups.push(ready);
      ready.forEach((n) => settled.add(n.id));
      remaining = remaining.filter((n) => !settled.has(n.id));
    }
    return groups;
  }, [run]);

  const openGates = run?.nodes.filter((n) => n.kind === "gate" && n.status === "awaiting") ?? [];
  const running = run?.status === "running" || run?.status === "awaiting";

  return (
    <PhotonShell active="team">
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              ghost://task-force
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Agent task force
              <span className="ml-3 border-2 border-foreground bg-[#ffd166] px-2 py-0.5 align-middle font-mono text-xs">
                {TEAM_AGENTS.length} agents
              </span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Fifteen specialized agents share one task graph and one shared state.
              Security and license checks are blocking gates; material changes wait
              for your approval; final writes to the same files are serialized.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ---------------- left: dispatch + board ---------------- */}
          <div className="space-y-6">
            <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--ink)]">
              <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Dispatch a task force
              </label>
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Build a React dashboard with an Android companion app and release APKs…"
                rows={3}
                className="mb-3 resize-none border-2 border-foreground bg-background font-mono text-sm"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={dispatch}
                  disabled={busy || !task.trim()}
                  className="gap-2 border-2 border-foreground bg-[#ffd166] font-bold text-black shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#ffd166]/90"
                >
                  <Users className="size-4" />
                  {busy ? "Dispatching…" : "Dispatch task force"}
                </Button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  graph · waves · gates · apk · pr
                </span>
              </div>
            </div>

            {openGates.length > 0 && (
              <div className="space-y-3 border-2 border-foreground bg-[#ff5c49] p-4 shadow-[4px_4px_0_0_var(--ink)]">
                <div className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-widest text-black">
                  <ShieldAlert className="size-4" />
                  {openGates.length} blocking gate{openGates.length === 1 ? "" : "s"} awaiting your approval
                </div>
                {openGates.map((gate) => (
                  <div
                    key={gate.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-card p-3"
                  >
                    <div>
                      <div className="text-sm font-bold">{gate.title}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {gate.agent} · {gate.detail}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => decide(gate.id, true)}
                        className="border-2 border-black bg-[#00ff41] font-bold text-black hover:bg-[#00ff41]/80"
                      >
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => decide(gate.id, false)}
                        className="border-2 border-black bg-[#ff5c49] font-bold text-black hover:bg-[#ff5c49]/80"
                      >
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {run && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    task graph — wave by wave
                  </div>
                  {running && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => stopTeamRun({ teamId: run._id })}
                      className="border-2 border-foreground bg-card text-xs font-bold uppercase"
                    >
                      <Square className="size-3.5" /> Stop
                    </Button>
                  )}
                </div>
                {waves.map((wave, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Clock className="size-3" /> wave {i + 1}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {wave.map((node) => {
                        const Icon = STATUS_ICON[node.status] ?? CircleDashed;
                        const meta = teamAgent(node.agent);
                        return (
                          <div
                            key={node.id}
                            className={`border-2 border-foreground p-3 shadow-[3px_3px_0_0_var(--ink)] ${
                              node.status === "awaiting" ? "bg-[#ff5c49]/30" : "bg-card"
                            }`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span
                                className="px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black"
                                style={{ backgroundColor: meta.tone }}
                              >
                                {meta.label}
                              </span>
                              <Icon className="size-4" />
                            </div>
                            <div className="text-sm font-bold leading-snug">{node.title}</div>
                            {node.detail && (
                              <div className="mt-1 text-xs text-muted-foreground">{node.detail}</div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 font-mono text-[9px] font-black uppercase ${STATUS_CLS[node.status] ?? ""}`}
                              >
                                {nodeTag(node)} · {node.status}
                              </span>
                              {node.writes.length > 0 && (
                                <span className="border border-foreground/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                                  writes {node.writes.length}
                                </span>
                              )}
                            </div>
                            {node.logs.length > 0 && (
                              <details className="mt-2">
                                <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                  log ({node.logs.length})
                                </summary>
                                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap bg-background p-2 font-mono text-[10px] leading-relaxed">
                                  {node.logs.join("\n")}
                                </pre>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------------- right: runs + shared state ---------------- */}
          <aside className="space-y-6">
            <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--ink)]">
              <div className="mb-3 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                task-force runs
              </div>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No runs yet — dispatch one.</p>
              ) : (
                <ul className="space-y-2">
                  {runs.slice(0, 8).map((t) => {
                    const badge = runStatusCopy(t.status === "awaiting" ? "running" : t.status, 1);
                    return (
                      <li key={t._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t._id)}
                          className={`w-full border-2 border-foreground p-2 text-left font-mono text-[11px] hover:bg-accent ${
                            selectedId === t._id ? "bg-accent" : "bg-background"
                          }`}
                        >
                          <span className={`mr-2 px-1 py-0.5 text-[9px] font-black uppercase ${badge.cls}`}>
                            {t.status}
                          </span>
                          {t.task.slice(0, 46)}
                          <span className="ml-1 text-muted-foreground">· {timeAgo(t.updatedAt)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {run && (
              <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--ink)]">
                <div className="mb-3 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  shared state — one task state
                </div>
                <SharedState shared={run.shared} />
              </div>
            )}

            {run && (
              <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_0_var(--ink)]">
                <div className="mb-3 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  event log
                </div>
                <ul className="max-h-72 space-y-1.5 overflow-auto font-mono text-[10px] leading-relaxed">
                  {[...run.events].reverse().map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <Badge variant="outline" className="h-4 shrink-0 px-1 font-mono text-[8px] uppercase">
                        {e.agent}
                      </Badge>
                      <span className="text-muted-foreground">{e.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PhotonShell>
  );
}

function SharedState({ shared }: { shared: TeamSharedRow }) {
  const rows: [string, string | undefined][] = [
    ["branch", shared.branch],
    ["plan", shared.plan],
    ["commit", shared.commit],
    ["pr", shared.prUrl],
    ["apk", shared.apk],
  ];
  return (
    <div className="space-y-2 font-mono text-[11px]">
      {rows
        .filter(([, v]) => !!v)
        .map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="w-14 shrink-0 font-black uppercase text-muted-foreground">{k}</span>
            <span className="break-all">{v}</span>
          </div>
        ))}
      <div>
        <span className="font-black uppercase text-muted-foreground">files ({shared.files.length})</span>
        <ul className="mt-1 max-h-32 space-y-0.5 overflow-auto">
          {shared.files.map((f) => (
            <li key={f} className="break-all text-muted-foreground">
              {f}
            </li>
          ))}
        </ul>
      </div>
      {shared.notes.length > 0 && (
        <div className="border-t-2 border-foreground/10 pt-2 text-muted-foreground">
          {shared.notes.slice(-3).map((n, i) => (
            <div key={i}>· {n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

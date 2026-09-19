import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppNav } from "@/components/ghost/AppNav";
import { GhostMark } from "@/components/ghost/GhostMark";
import "@/styles/ghost-dashboard.css";
import {
  AGENTS,
  runStatusCopy,
  timeAgo,
} from "@/lib/ghost-agents";
import type { ConversationRow } from "@/components/ghost/ConversationsPanel";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Code2,
  GitBranch,
  Github,
  Layers3,
  LockKeyhole,
  Plus,
  Radar,
  RefreshCw,
  Rocket,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const pipeline = [
  ["Plan", "Analyze request & create plan", "done"],
  ["Branch", "Create feature branch", "done"],
  ["Implement", "Write and test code", "done"],
  ["Guardian", "Security, license & code review", "done"],
  ["CI Build", "Build and run tests", "running"],
  ["Repair", "Fix first real error", "pending"],
  ["Commit & Push", "Push changes to repository", "pending"],
  ["Pull Request", "Create and update PR", "pending"],
  ["Verify", "Final verification & artifacts", "pending"],
] as const;

const providers = [
  ["OpenRouter", "Online", "~1.2s"],
  ["OpenAI", "Online", "~1.4s"],
  ["Anthropic", "Online", "~1.8s"],
  ["Ollama (Local)", "Online", "~0.7s"],
  ["SambaNova", "Online", "~2.3s"],
];

const checks = ["SAST (CodeQL)", "Dependency scan", "License check", "Secret scan", "Container scan"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const accounts = (useQuery(api.github.queries.listAccounts) ?? []) as {
    _id: string;
    username: string;
    avatarUrl?: string;
    profileUrl: string;
  }[];
  const connected = accounts[0];
  const startConnect = useMutation(api.github.mutations.startConnect);
  const disconnect = useMutation(api.github.mutations.disconnect);
  const [connecting, setConnecting] = useState(false);
  const conversations =
    (useQuery(api.ghost.queries.listConversations) as ConversationRow[] | undefined) ?? [];
  const stats = useQuery(api.ghost.queries.dashboardStats);

  useEffect(() => {
    const status = searchParams.get("gh");
    const ghUser = searchParams.get("user");
    if (status === "connected") toast.success(`GitHub connected as @${ghUser ?? "you"}`);
    if (status === "error") toast.error("GitHub connection failed — check OAuth setup and retry.");
    if (status) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { authorizeUrl } = await startConnect({ origin: window.location.origin });
      window.location.assign(authorizeUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start GitHub connect.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("GitHub disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect.");
    }
  };

  return (
    <div className="gw-shell min-h-screen bg-background text-foreground">
      <AppNav active="dashboard" />

      <main className="mx-auto max-w-[1540px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:flex lg:flex-col lg:justify-between gw-panel p-3">
            <div>
              <div className="px-2 py-3">
                <p className="gw-kicker">GhostWeb AI</p>
                <p className="mt-1 text-xs text-muted-foreground">Build secure. Ship together.</p>
              </div>
              <nav className="space-y-1">
                {[
                  ["/chat", "Chat", Terminal],
                  ["/build", "Build Wizard", Zap],
                  ["/team", "15-Agent Team", Layers3],
                  ["/dashboard", "Dashboard", Radar],
                  ["/securities", "Security", ShieldCheck],
                  ["/settings", "Settings", Settings2],
                ].map(([href, label, Icon]) => (
                  <Link key={href as string} to={href as string} className={`gw-side-link ${href === "/dashboard" ? "is-active" : ""}`}>
                    <Icon className="size-4" />
                    <span>{label as string}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="gw-mini-card">
              <LockKeyhole className="size-4 text-primary" />
              <p className="mt-3 text-xs font-semibold">Privacy first</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Your code. Your data. Your control.</p>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="gw-topbar">
              <div className="flex min-w-0 items-center gap-3">
                <GhostMark className="size-8 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-tight">What do you want to build?</p>
                  <p className="hidden text-[10px] text-muted-foreground sm:block">AI-powered delivery from idea → verified artifact</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="gw-status"><span className="gw-dot" /> OpenRouter · Online</span>
                <span className="gw-user">{(user?.name ?? user?.email ?? "GW").slice(0, 2).toUpperCase()}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.9fr)]">
              <section className="gw-hero">
                <div className="gw-hero-glow" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="gw-badge"><Sparkles className="size-3" /> AI delivery workspace</span>
                      <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Build from a sentence.</h1>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Plan, branch, implement, self-heal, verify and ship with a coordinated agent workflow.
                      </p>
                    </div>
                    <div className="hidden rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:block">
                      <GhostMark className="size-12 text-primary" />
                    </div>
                  </div>

                  <div className="gw-command mt-7">
                    <textarea
                      aria-label="Describe your project"
                      defaultValue=""
                      placeholder="Describe your project, feature or issue…"
                      className="min-h-[110px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="gw-control"><GitBranch className="size-3.5" /> Repo</button>
                        <button className="gw-control"><Github className="size-3.5" /> GitHub</button>
                        <button className="gw-control">GPT-5.6</button>
                      </div>
                      <Link to="/chat" className="gw-send"><ArrowRight className="size-4" /></Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {[
                      [Zap, "Build feature", "Create from scratch"],
                      [Wrench, "Fix an issue", "Debug and repair"],
                      [RefreshCw, "Update deps", "Security + latest"],
                      [ScanSearch, "Security scan", "Audit and verify"],
                    ].map(([Icon, title, copy]) => (
                      <Link key={title as string} to="/chat" className="gw-quick">
                        <Icon className="size-4 text-primary" />
                        <span><b>{title as string}</b><small>{copy as string}</small></span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <section className="gw-panel overflow-hidden">
                <div className="gw-panel-head"><span>Live delivery pipeline</span><span className="gw-running">RUNNING</span></div>
                <div className="p-3">
                  {pipeline.map(([title, copy, state], i) => (
                    <div key={title} className="gw-step">
                      <span className={`gw-step-num ${state === "running" ? "is-running" : state === "done" ? "is-done" : ""}`}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <b>{title}</b><small>{copy}</small>
                      </span>
                      {state === "done" ? <CheckCircle2 className="size-4 text-primary" /> : state === "running" ? <CircleDot className="size-4 animate-pulse text-cyan-300" /> : <span className="size-3 rounded-full border border-foreground/20" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_.9fr_1fr]">
              <section className="gw-panel p-5">
                <div className="flex items-center justify-between">
                  <div className="gw-section-title"><Github className="size-4" /> Repository</div>
                  <span className="gw-pill">SYNCED</span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background"><Github className="size-5" /></div>
                  <div className="min-w-0"><b className="block truncate text-sm">GhostWebEnterprise/ghost-web-ai</b><span className="text-xs text-muted-foreground">AI-powered software delivery</span></div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono uppercase text-muted-foreground">
                  <span className="gw-stat"><GitBranch className="size-3" /> main</span><span className="gw-stat"><Code2 className="size-3" /> TypeScript</span><span className="gw-stat"><Rocket className="size-3" /> 12 releases</span>
                </div>
                <a className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" href="https://github.com/GhostWebEnterprise/ghost-web-ai" target="_blank" rel="noreferrer">View repository <ArrowRight className="size-3" /></a>
              </section>

              <section className="gw-panel p-5">
                <div className="flex items-center justify-between"><div className="gw-section-title"><Sparkles className="size-4" /> AI providers</div><span className="gw-pill">HEALTHY</span></div>
                <div className="mt-4 space-y-2">
                  {providers.map(([name, state, latency]) => <div key={name} className="flex items-center gap-2 text-xs"><span className="gw-dot" /><span className="flex-1">{name}</span><span className="text-[10px] text-muted-foreground">{latency}</span></div>)}
                </div>
                <Link to="/settings" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">Provider settings <ArrowRight className="size-3" /></Link>
              </section>

              <section className="gw-panel p-5">
                <div className="flex items-center justify-between"><div className="gw-section-title"><Layers3 className="size-4" /> 15-agent task force</div><span className="gw-pill">ACTIVE</span></div>
                <div className="mt-4 space-y-2">
                  {AGENTS.slice(0, 5).map((agent) => <div key={agent.key} className="flex items-center gap-2 text-xs"><span className={`flex size-6 items-center justify-center rounded-md border border-primary/30 ${agent.chip}`}>{agent.tag}</span><span className="flex-1 truncate">{agent.label}</span><span className="font-mono text-[10px] text-primary">1/1</span></div>)}
                </div>
                <Link to="/team" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">View all agents <ArrowRight className="size-3" /></Link>
              </section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_1fr]">
              <section className="gw-panel p-5">
                <div className="gw-section-title"><ShieldCheck className="size-4" /> Security & CI</div>
                <div className="mt-4 space-y-2">{checks.map((check) => <div key={check} className="flex items-center gap-2 text-xs"><CheckCircle2 className="size-3.5 text-primary" /><span className="flex-1">{check}</span><span className="text-[9px] uppercase text-primary">passed</span></div>)}</div>
                <Link to="/securities" className="mt-4 inline-flex text-xs font-semibold text-primary">View security report →</Link>
              </section>

              <section className="gw-panel p-5">
                <div className="gw-section-title"><CheckCircle2 className="size-4" /> Artifact verification</div>
                <div className="mt-4 space-y-3">{["Build artifacts", "SBOM", "Signature", "Provenance"].map((item) => <div key={item} className="flex items-center gap-2 text-xs"><CheckCircle2 className="size-3.5 text-primary" /><span className="flex-1">{item}</span><span className="gw-verified">verified</span></div>)}</div>
                <span className="mt-4 block text-xs font-semibold text-primary">View artifacts →</span>
              </section>

              <section className="gw-panel p-5">
                <div className="flex items-center justify-between"><div className="gw-section-title"><Terminal className="size-4" /> Recent activity</div><span className="text-[10px] text-primary">View all →</span></div>
                <div className="mt-4 space-y-3">
                  {conversations.slice(0, 4).map((conversation) => {
                    const status = runStatusCopy(conversation.status, conversation.runCount);
                    return <button key={conversation._id} onClick={() => navigate(`/chat?c=${conversation._id}`)} className="flex w-full items-start gap-2 text-left"><span className={`mt-1 size-2 rounded-full ${status.cls}`} /><span className="min-w-0 flex-1 truncate text-xs">{conversation.title}</span><span className="shrink-0 text-[9px] text-muted-foreground">{timeAgo(conversation.updatedAt)}</span></button>;
                  })}
                  {conversations.length === 0 && <p className="text-xs text-muted-foreground">No activity yet. Start your first run.</p>}
                </div>
              </section>

              <section className="gw-panel p-5">
                <div className="gw-section-title"><Plus className="size-4" /> Quick actions</div>
                <div className="mt-4 grid gap-2">
                  <Link className="gw-action" to="/chat"><Terminal className="size-4" /> Open AI console <ArrowRight className="ml-auto size-3" /></Link>
                  <a className="gw-action" href="https://github.com/GhostWebEnterprise/ghost-web-ai/actions" target="_blank" rel="noreferrer"><RefreshCw className="size-4" /> View build logs <ArrowRight className="ml-auto size-3" /></a>
                  <Link className="gw-action" to="/securities"><ShieldCheck className="size-4" /> Security report <ArrowRight className="ml-auto size-3" /></Link>
                  <Link className="gw-action" to="/team"><Layers3 className="size-4" /> Inspect task force <ArrowRight className="ml-auto size-3" /></Link>
                </div>
              </section>
            </div>

            <section className="mt-4 gw-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold">Workspace status</p><p className="text-[11px] text-muted-foreground">{stats?.sessions ?? 0} sessions · {stats?.runs ?? 0} agent runs · {stats?.reposConnected ?? 0} repositories targeted</p></div>
              {connected ? <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-primary"><CheckCircle2 className="size-3.5" /> GitHub @{connected.username} connected <button onClick={handleDisconnect} className="ml-2 text-muted-foreground hover:text-destructive">disconnect</button></div> : <button onClick={handleConnect} disabled={connecting} className="gw-primary">{connecting ? "Connecting…" : "Connect GitHub"}</button>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

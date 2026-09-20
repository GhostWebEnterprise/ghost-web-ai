import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhotonShell } from "@/components/ghost/PhotonShell";
import { AGENTS, runStatusCopy, timeAgo } from "@/lib/ghost-agents";
import type { ConversationRow } from "@/components/ghost/ConversationsPanel";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Cpu,
  Github,
  Layers3,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const pipeline = [
  ["Plan", "Analyze request & create plan", "complete"],
  ["Branch", "Create feature branch", "complete"],
  ["Implement", "Write and test code", "complete"],
  ["Guardian", "Security, license & code review", "complete"],
  ["CI Build", "Build and run tests", "running"],
  ["Repair", "Fix first real error", "pending"],
  ["Commit & Push", "Push changes to repository", "pending"],
  ["Pull Request", "Create and update PR", "pending"],
  ["Verify", "Final verification & artifacts", "pending"],
] as const;

const providers: Array<[string, string]> = [
  ["OpenRouter", "~1.2s"],
  ["OpenAI", "~1.4s"],
  ["Anthropic", "~1.8s"],
  ["Ollama (Local)", "~0.7s"],
  ["SambaNova", "~2.3s"],
];

const checks = ["SAST (CodeQL)", "Dependency scan", "License check", "Secret scan", "Container scan"];
const artifacts = ["Build artifacts", "SBOM", "Signature", "Provenance"];

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
  const [prompt, setPrompt] = useState("");
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

  const openChat = () => {
    const task = prompt.trim();
    navigate(task ? `/chat?task=${encodeURIComponent(task)}` : "/chat");
  };

  return (
    <PhotonShell active="dashboard">
      <div className="px-grid">
        <div className="px-col">
          {/* HERO / CONSOLE */}
          <section className="px-frame px-hero" style={{ padding: "28px 24px 30px" }}>
            <span className="px-cross tl">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1" /></svg>
            </span>
            <span className="px-cross br">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1" /></svg>
            </span>
            <div className="px-eyebrow">[ AI DELIVERY WORKSPACE ]</div>
            <h1 className="px-glitch" data-text="BUILD FROM A SENTENCE" style={{ fontSize: "clamp(28px,5vw,52px)", margin: "14px 0 6px" }}>
              BUILD FROM A SENTENCE
            </h1>
            <p className="px-lead" style={{ maxWidth: 560 }}>
              Plan, branch, implement, self-heal, verify and ship with a coordinated agent workflow.
            </p>

            <div className="px-console mt-6 border border-[var(--px-line)]">
              <textarea
                aria-label="Describe your project"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    openChat();
                  }
                }}
                placeholder="> describe your project, feature or issue…"
              />
              <div className="px-console-foot">
                <div className="px-ctrls">
                  <button type="button"><Github className="size-3" /> Repo</button>
                  <button type="button"><Github className="size-3" /> GitHub</button>
                  <button type="button"><Cpu className="size-3" /> GPT-5.6</button>
                </div>
                <button type="button" onClick={openChat} aria-label="Open AI console" className="px-send">
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <div className="px-quick">
            {([
              [Zap, "Build feature", "Create from scratch", "/chat"],
              [Wrench, "Fix an issue", "Debug and repair", "/chat"],
              [Rocket, "Update deps", "Security + latest", "/build"],
              [ScanSearch, "Security scan", "Audit and verify", "/securities"],
            ] as const).map(([Icon, title, copy, href], i) => (
              <Link key={title} to={href} className="px-frame">
                <span className="idx">0{i + 1}</span>
                <Icon className="size-4" />
                <b>{title}</b>
                <small>{copy}</small>
              </Link>
            ))}
          </div>

          {/* INFO CARDS */}
          <div className="px-cards">
            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><Github className="size-4" /> Repository</span><span className="s">Synced</span></div>
              <div className="body">
                <div className="px-repo-name">GhostWebEnterprise/ghost-web-ai</div>
                <div className="px-repo-meta">AI-powered software delivery — 15-agent team, security scanning and multi-provider support.</div>
                <div className="px-repo-stats"><span>MAIN</span><span>TYPESCRIPT</span><span>12 RELEASES</span></div>
                <a className="px-link" href="https://github.com/GhostWebEnterprise/ghost-web-ai" target="_blank" rel="noreferrer">View repository <ArrowRight className="size-3" /></a>
              </div>
            </section>

            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><Sparkles className="size-4" /> AI Providers</span><span className="s">Healthy</span></div>
              <div className="body">
                <div className="px-list">
                  {providers.map(([name, latency]) => (
                    <div key={name}><span className="px-dot" /><span>{name}</span><small>{latency}</small></div>
                  ))}
                </div>
                <Link className="px-link" to="/settings">Provider settings <ArrowRight className="size-3" /></Link>
              </div>
            </section>

            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><Layers3 className="size-4" /> 15-Agent Task Force</span><span className="s">Active</span></div>
              <div className="body">
                <div className="px-list">
                  {AGENTS.slice(0, 5).map((agent) => (
                    <div key={agent.key}><span className="px-agent">{agent.tag}</span><span>{agent.label}</span><small>1/1</small></div>
                  ))}
                </div>
                <Link className="px-link" to="/team">View all agents <ArrowRight className="size-3" /></Link>
              </div>
            </section>

            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><ShieldCheck className="size-4" /> Security &amp; CI</span><span className="s">All clear</span></div>
              <div className="body">
                <div className="px-checks">
                  {checks.map((item) => (
                    <div key={item}><CheckCircle2 className="size-3.5" /><span>{item}</span><small>Passed</small></div>
                  ))}
                </div>
                <Link className="px-link" to="/securities">View security report <ArrowRight className="size-3" /></Link>
              </div>
            </section>

            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><CheckCircle2 className="size-4" /> Artifact Verification</span><span className="s">Verified</span></div>
              <div className="body">
                <div className="px-checks">
                  {artifacts.map((item) => (
                    <div key={item}><CheckCircle2 className="size-3.5" /><span>{item}</span><small>Verified</small></div>
                  ))}
                </div>
                <Link className="px-link" to="/securities">View artifacts <ArrowRight className="size-3" /></Link>
              </div>
            </section>

            <section className="px-frame px-card">
              <div className="px-panel-head"><span className="t"><Activity className="size-4" /> Recent Activity</span><span className="s">Live</span></div>
              <div className="body">
                <div className="px-activity">
                  {conversations.slice(0, 4).map((conversation) => {
                    const status = runStatusCopy(conversation.status, conversation.runCount);
                    return (
                      <div key={conversation._id}>
                        <span className={status.cls.includes("green") || conversation.status === "done" ? "px-dot-ok" : "px-dot-idle"} />
                        <button
                          type="button"
                          onClick={() => navigate(`/chat?c=${conversation._id}`)}
                          className="min-w-0 truncate text-left"
                          style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                        >
                          {conversation.title}
                        </button>
                        <time>{timeAgo(conversation.updatedAt)}</time>
                      </div>
                    );
                  })}
                  {conversations.length === 0 && (
                    <div><CircleDot className="size-3.5" /><span>No activity yet. Start your first run.</span><time /></div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* WORKSPACE STATUS */}
          <section className="px-frame flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--px-white)]">Workspace status</p>
              <p className="mt-1 font-mono text-[10px] text-[var(--px-dim)]">
                {stats?.sessions ?? 0} sessions · {stats?.runs ?? 0} agent runs · {stats?.reposConnected ?? 0} repositories targeted
              </p>
            </div>
            {connected ? (
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--px-white)]">
                <CheckCircle2 className="size-3.5" /> GitHub @{connected.username} connected
                <button onClick={handleDisconnect} className="px-btn px-btn-ghost ml-2" style={{ height: 28, padding: "0 10px" }}>
                  disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} disabled={connecting} className="px-btn px-btn-primary">
                {connecting ? "Connecting…" : "Connect GitHub"}
              </button>
            )}
          </section>
        </div>

        {/* PIPELINE */}
        <section className="px-frame px-pipe">
          <div className="px-panel-head"><span className="t"><Activity className="size-4" /> Delivery Pipeline</span><span className="s">Running</span></div>
          <div className="steps">
            {pipeline.map(([title, copy, state], i) => (
              <div className={`px-step ${state}`} key={title}>
                <span className="badge">{String(i + 1).padStart(2, "0")}</span>
                <div><b>{title}</b><small>{copy}</small></div>
                <span className="st">{state === "complete" ? "Done" : state === "running" ? "Run" : "Wait"}</span>
              </div>
            ))}
          </div>
          <div className="px-pipe-note">Live build state updates here as agents work through the chain.</div>
        </section>
      </div>

      <span className="sr-only">{user?.email}</span>
    </PhotonShell>
  );
}

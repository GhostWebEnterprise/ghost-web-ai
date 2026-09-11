import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppNav } from "@/components/ghost/AppNav";
import { Button } from "@/components/ui/button";
import { GhostMark } from "@/components/ghost/GhostMark";
import {
  AGENTS,
  engineLabel,
  repoShort,
  runStatusCopy,
  timeAgo,
} from "@/lib/ghost-agents";
import type { ConversationRow } from "@/components/ghost/ConversationsPanel";
import {
  ArrowRight,
  Github,
  Layers,
  Loader2,
  Play,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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

  // OAuth callback lands on /dashboard?gh=connected|error
  useEffect(() => {
    const status = searchParams.get("gh");
    const ghUser = searchParams.get("user");
    if (status === "connected") {
      toast.success(`GitHub connected as @${ghUser ?? "you"}`);
    }
    if (status === "error") {
      toast.error("GitHub connection failed — check the OAuth setup and retry.");
    }
    if (status) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { authorizeUrl } = await startConnect({
        origin: window.location.origin,
      });
      // Send the user to GitHub's authorize screen; the callback returns here.
      window.location.assign(authorizeUrl);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start GitHub connect.",
      );
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
  const conversations =
    (useQuery(api.ghost.queries.listConversations) as ConversationRow[] | undefined) ??
    [];
  const stats = useQuery(api.ghost.queries.dashboardStats);

  const lastRun = stats?.lastRunAt ?? null;

  const statCards = [
    {
      label: "Build sessions",
      value: stats ? String(stats.sessions) : "–",
      color: "bg-accent",
    },
    {
      label: "Agent runs",
      value: stats ? String(stats.runs) : "–",
      color: "bg-[#4dd8e6]",
    },
    {
      label: "Repos targeted",
      value: stats ? String(stats.reposConnected) : "–",
      color: "bg-[#00ff41]",
    },
    {
      label: "Last run",
      value: lastRun ? timeAgo(lastRun) : "none yet",
      color: "bg-[#ff9e64]",
    },
  ];

  return (
    <div className="nb-grid-paper min-h-screen bg-background text-foreground">
      <AppNav active="dashboard" />

      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {/* greeting */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="nb-overline text-muted-foreground">
              Build HQ · {user?.name?.split(" ")[0] ?? "builder"}
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Pick up where the<br className="hidden sm:block" />
              <span className="border-4 border-foreground bg-accent px-2">
                chain left off.
              </span>
            </h1>
          </div>
          <Link to="/chat">
            <Button
              size="lg"
              className="gap-2 border-2 border-foreground bg-foreground text-sm font-black uppercase tracking-wide text-background shadow-[5px_5px_0_0_var(--ink)] hover:bg-[#04140a]"
            >
              <Play className="size-4" /> New run
            </Button>
          </Link>
        </div>

        {/* stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="border-2 border-foreground bg-card p-3.5 shadow-[3px_3px_0_0_var(--ink)]"
            >
              <span
                className={`mb-3 inline-block size-2.5 border border-black ${card.color}`}
              />
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 truncate text-2xl font-black uppercase tracking-tight">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* recent runs */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                <Terminal className="size-5" /> Recent runs
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {conversations.length} session{conversations.length === 1 ? "" : "s"}
              </span>
            </div>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-start gap-4 border-2 border-foreground bg-card p-6">
                <GhostMark className="size-10 text-foreground" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    No builds yet
                  </h3>
                  <p className="mt-1 max-w-sm text-[13px] leading-6 text-foreground/70">
                    The chain is idle. Give it one sentence and it will branch,
                    build, self-heal, commit and open the PR.
                  </p>
                </div>
                <Link to="/chat">
                  <Button className="gap-2 border-2 border-foreground bg-accent text-xs font-black uppercase tracking-wide text-foreground shadow-[3px_3px_0_0_var(--ink)]">
                    Start the first run <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {conversations.slice(0, 6).map((conversation) => {
                  const status = runStatusCopy(
                    conversation.status,
                    conversation.runCount,
                  );
                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => navigate(`/chat?c=${conversation._id}`)}
                      className="group flex items-center gap-3 border-2 border-foreground bg-card px-3 py-2.5 text-left transition-colors hover:bg-[#0f2417]"
                    >
                      <span
                        className={`inline-block size-2.5 shrink-0 border border-black ${status.cls}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-bold">
                          {conversation.title}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                          {conversation.repo?.fullName ??
                            repoShort(conversation.repoUrl) ??
                            "workspace"}
                          {" · "}
                          {engineLabel(conversation.engine)} · {timeAgo(conversation.updatedAt)}
                        </span>
                      </span>
                      {conversation.liveGithub && (
                        <span className="shrink-0 border border-foreground bg-[#00ff41] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black">
                          live PR
                        </span>
                      )}
                      <span
                        className={`shrink-0 border border-foreground px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* agents standing by */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                <Layers className="size-5" /> Agents standing by
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {AGENTS.map((agent, i) => (
                <div
                  key={agent.key}
                  className="flex items-center gap-3 border-2 border-foreground bg-card px-3 py-2"
                >
                  <span className="w-6 font-mono text-[10px] font-black text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center border-2 border-foreground font-mono text-[8px] font-black uppercase ${agent.chip}`}
                  >
                    {agent.tag}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold uppercase tracking-wide">
                    {agent.label}
                  </span>
                  <span className="hidden border border-foreground bg-[#00ff41] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black sm:inline">
                    ready
                  </span>
                </div>
              ))}
            </div>

            {/* connect GitHub card */}
            <div className="mt-4 border-2 border-foreground bg-foreground p-4 text-background">
              <div className="flex items-center gap-2">
                <Github className="size-4" />
                <h3 className="text-[13px] font-black uppercase tracking-wide">
                  Connect GitHub
                </h3>
                {connected && (
                  <span className="border border-background/50 bg-[#00ff41] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black">
                    live
                  </span>
                )}
              </div>
              {connected ? (
                <>
                  <p className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-background/80">
                    {connected.avatarUrl ? (
                      <img
                        src={connected.avatarUrl}
                        alt=""
                        className="size-5 border border-background/60"
                      />
                    ) : (
                      <span className="flex size-5 items-center justify-center border border-background/60 bg-accent font-mono text-[9px] font-black text-black">
                        {(connected.username ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                    <a
                      href={connected.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-black underline underline-offset-2 hover:bg-accent hover:text-black"
                    >
                      @{connected.username}
                    </a>
                    — runs against your repos push branches + PRs for real.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/chat">
                      <Button className="gap-2 border-2 border-foreground bg-accent text-[11px] font-black uppercase tracking-wide text-foreground shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#ffd166]">
                        Run in the console <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="border-2 border-background/60 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-background/80 hover:bg-[#ff5c49] hover:text-black"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-[12px] leading-5 text-background/80">
                    One click links your GitHub account. Runs that target your
                    repos then push a real branch and open the pull request —
                    no token to paste.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 border-2 border-foreground bg-accent px-3 py-2.5 text-[11px] font-black uppercase tracking-wide text-foreground shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#ffd166] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Github className="size-3.5" />
                    )}
                    {connecting ? "Sending you to GitHub…" : "Connect GitHub"}
                  </button>
                  <p className="mt-2 font-mono text-[9px] uppercase leading-4 tracking-wider text-background/50">
                    Needs GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in Keys
                    (GitHub OAuth app). Prefer a key? Paste GITHUB_PAT instead
                    for the same live pushes.
                  </p>
                </>
              )}
              <Link
                to="/chat"
                className="mt-3 block font-mono text-[10px] uppercase tracking-wider text-background/60 underline underline-offset-2 hover:text-background"
              >
                …or point the chain at any repo URL in the console →
              </Link>
            </div>
          </section>
        </div>

        {/* free band */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-2 border-foreground bg-[#0f2417] px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider">
            <span className="border border-foreground bg-[#00ff41] px-1.5 py-0.5 text-black">
              No credits
            </span>
            The free engine runs every run. Add a SAMBANOVA key anytime for an
            open-LLM planner.
          </p>
          <a
            className="border-2 border-foreground bg-card px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider hover:bg-accent"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Keys live in project settings
          </a>
        </div>
      </main>
    </div>
  );
}

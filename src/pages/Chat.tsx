import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppNav } from "@/components/ghost/AppNav";
import {
  ConversationsPanel,
  type ConversationRow,
} from "@/components/ghost/ConversationsPanel";
import { Composer } from "@/components/ghost/Composer";
import {
  GitHubSync,
  type SyncedRepoPick,
} from "@/components/ghost/GitHubSync";
import { RunMessage, UserMessage } from "@/components/ghost/RunMessage";
import { GhostMark } from "@/components/ghost/GhostMark";
import { engineLabel, repoShort } from "@/lib/ghost-agents";
import { Github, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = searchParams.get("c");

  const conversationsQuery = useQuery(api.ghost.queries.listConversations);
  const conversations = conversationsQuery ?? [];
  const listLoaded = conversationsQuery !== undefined;
  const [mode, setMode] = useState<"thread" | "new">(
    paramId ? "thread" : "new",
  );

  const activeId: string | null = mode === "thread" ? paramId : null;
  // While the session list is still loading, trust the URL param so a deep
  // link can't accidentally create a duplicate conversation.
  const activeIdValid = listLoaded
    ? conversations.some((c) => c._id === activeId)
    : true;

  const messages =
    useQuery(
      api.ghost.queries.getMessages,
      activeId && activeIdValid
        ? { conversationId: activeId as Id<"conversations"> }
        : "skip",
    ) ?? [];
  const conversation = conversations.find((c) => c._id === activeId);

  const createConversation = useMutation(api.ghost.mutations.createConversation);
  const startTask = useMutation(api.ghost.mutations.startTask);
  const deleteConversation = useMutation(
    api.ghost.mutations.deleteConversation,
  );
  const runTask = useAction(api.ghost.actions.runTask);
  const selectSyncedRepo = useMutation(api.github.mutations.selectSyncedRepo);

  const [sending, setSending] = useState(false);
  // Repo picked from a synced GitHub account while no session exists yet.
  const [pickedRepo, setPickedRepo] = useState<SyncedRepoPick | undefined>(
    undefined,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePickRepo = async (repo: SyncedRepoPick) => {
    if (activeId && activeIdValid) {
      try {
        await selectSyncedRepo({
          conversationId: activeId as Id<"conversations">,
          fullName: repo.fullName,
          url: repo.url,
          defaultBranch: repo.defaultBranch,
          language: repo.language,
          description: repo.description,
          isPrivate: repo.private,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not target the repo.",
        );
        return;
      }
      setPickedRepo(undefined);
    } else {
      setPickedRepo(repo);
    }
  };

  const chainRunning =
    sending || messages.some((m) => m.runStatus === "running");

  // Follow the latest run activity.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // If the URL points at a session that no longer exists, fall back to new.
  useEffect(() => {
    if (listLoaded && activeId && !activeIdValid) {
      setMode("new");
      setSearchParams({}, { replace: true });
    }
  }, [listLoaded, activeId, activeIdValid, setSearchParams]);

  const startRun = async (task: string, repoUrl?: string) => {
    setSending(true);
    try {
      let id = activeId && activeIdValid ? activeId : null;
      if (!id) {
        id = await createConversation({ task, repoUrl });
        setMode("thread");
        setSearchParams({ c: id }, { replace: true });
      }
      if (pickedRepo && !conversation?.repoUrl) {
        await selectSyncedRepo({
          conversationId: id as Id<"conversations">,
          fullName: pickedRepo.fullName,
          url: pickedRepo.url,
          defaultBranch: pickedRepo.defaultBranch,
          language: pickedRepo.language,
          description: pickedRepo.description,
          isPrivate: pickedRepo.private,
        });
      }
      const { runId, pipeline } = await startTask({
        conversationId: id as Id<"conversations">,
        task,
      });
      // Fire the engine without blocking the UI; progress streams via queries.
      void runTask({
        conversationId: id as Id<"conversations">,
        runId: runId as Id<"messages">,
        task,
        repoUrl,
        pipeline: pipeline.map((s) => ({
          id: s.id,
          agent: s.agent,
          title: s.title,
          status: s.status,
        })),
      }).catch((err) => {
        console.error("Run failed:", err);
        toast.error("The agent chain stopped unexpectedly.");
      });
      toast.success(
        "Agent chain started — plan → code → fix → commit → PR",
        { duration: 3000 },
      );
    } catch (err) {
      console.error("Start task failed:", err);
      toast.error(err instanceof Error ? err.message : "Could not start the run.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteConversation({ conversationId: id as Id<"conversations"> });
    if (activeId === id) {
      setMode("new");
      setSearchParams({}, { replace: true });
    }
    toast.success("Build session deleted");
  };

  const handleNew = () => {
    setMode("new");
    setSearchParams({}, { replace: true });
  };

  const handleSelect = (id: string) => {
    setMode("thread");
    setSearchParams({ c: id });
  };

  return (
    <div className="nb-grid-paper flex min-h-screen flex-col bg-background text-foreground">
      <AppNav active="chat" />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* sessions */}
        <div className="lg:h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-1">
          <ConversationsPanel
            conversations={conversations as ConversationRow[]}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        </div>

        {/* thread */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:h-[calc(100vh-6.5rem)]">
          {/* conversation header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-foreground bg-card px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <GhostMark className="size-4 text-foreground" />
              {conversation ? (
                <>
                  <span className="truncate text-[13px] font-black uppercase tracking-wide">
                    {conversation.title}
                  </span>
                  {conversation.repo && (
                    <span className="hidden shrink-0 items-center gap-1 border border-foreground bg-[#4dd8e6] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black md:inline-flex">
                      <Github className="size-3" />
                      {repoShort(conversation.repo.fullName)}
                      {conversation.repo.license ? ` · ${conversation.repo.license}` : ""}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[13px] font-black uppercase tracking-wide">
                  New build
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
              {conversation?.repo?.language && (
                <span className="border border-foreground bg-[#ff9e64] px-1.5 py-0.5 text-black">
                  {conversation.repo.language}
                </span>
              )}
              <span className="border border-foreground bg-[#9aa5a0] px-1.5 py-0.5">
                {engineLabel(conversation?.engine)}
              </span>
              {conversation?.liveGithub && (
                <span
                  title="A real branch + PR were pushed to this repo"
                  className="inline-flex items-center gap-1 border border-foreground bg-[#00ff41] px-1.5 py-0.5 text-black"
                >
                  <Github className="size-3" /> PR live
                </span>
              )}
              <span className="hidden border border-foreground bg-[#00ff41] px-1.5 py-0.5 text-black sm:inline">
                {chainRunning ? "chain live" : "idle"}
              </span>
            </div>
          </div>

          {/* scroll area */}
          <div
            ref={scrollRef}
            className="nb-scroll flex-1 space-y-4 overflow-y-auto border-2 border-foreground bg-card/60 p-4"
          >
            {activeId && !conversation && !listLoaded ? (
              <div className="flex items-center justify-center gap-2 py-8 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading session…
              </div>
            ) : activeId && conversation ? (
              <>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message._id} content={message.content} />
                  ) : (
                    <RunMessage
                      key={message._id}
                      message={{
                        role: "assistant",
                        agent: message.agent,
                        engine: message.engine,
                        runStatus: message.runStatus,
                        pipeline: message.pipeline,
                        files: message.files,
                        content: message.content,
                        error: message.error,
                        prUrl: message.prUrl,
                        createdAt: message.createdAt,
                      }}
                    />
                  ),
                )}
              </>
            ) : (
              /* empty state */
              <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center">
                <div className="relative">
                  <div className="absolute -inset-2 -rotate-3 border-2 border-foreground bg-accent" />
                  <GhostMark className="relative size-14 text-foreground" />
                </div>
                <div className="max-w-md">
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    New build session
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-foreground/75">
                    Describe a feature — optionally paste a GitHub repo URL.
                    Ghost Web AI runs the whole chain: license gate, plan,
                    branch, code, guardian self-heal, CI, fix loop, commit,
                    PR and verify. Add a GITHUB_PAT in Keys and the commit +
                    PR stages push a real branch and pull request to that repo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {["scan", "plan", "branch", "code", "guard", "ci", "fix", "commit", "pr", "verify"].map(
                    (s) => (
                      <span key={s} className="border border-foreground bg-card px-1.5 py-0.5">
                        {s}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* GitHub connect + repo targeting */}
          <GitHubSync
            targetFullName={
              conversation?.repo?.fullName ?? pickedRepo?.fullName ?? null
            }
            busy={chainRunning}
            onPick={handlePickRepo}
            onClear={
              activeId ? undefined : () => setPickedRepo(undefined)
            }
          />

          {/* composer — keyed by session + target so repo state resets */}
          <Composer
            key={`${conversation?._id ?? "new"}:${
              conversation?.repoUrl ?? pickedRepo?.url ?? ""
            }`}
            onSubmit={startRun}
            busy={chainRunning}
            defaultRepoUrl={conversation?.repoUrl ?? pickedRepo?.url}
          />
        </div>
      </div>
    </div>
  );
}

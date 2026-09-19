import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppNav } from "@/components/ghost/AppNav";
import {
  ConversationsPanel,
  type ConversationRow,
} from "@/components/ghost/ConversationsPanel";
import { Composer, type AssistantProvider } from "@/components/ghost/Composer";
import {
  GitHubSync,
  type SyncedRepoPick,
} from "@/components/ghost/GitHubSync";
import { RunMessage, UserMessage } from "@/components/ghost/RunMessage";
import { GhostMark } from "@/components/ghost/GhostMark";
import { engineLabel, repoShort } from "@/lib/ghost-agents";
import type { AssistantAgentId, AssistantCapability } from "@/lib/ai-models";
import { useAppSettings } from "@/hooks/use-app-settings";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Github,
  Loader2,
  Menu,
  Plus,
  Settings2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { puterChat } from "@/lib/puter";

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = searchParams.get("c");
  const { settings } = useAppSettings();
  const [mode, setMode] = useState<"thread" | "new">(
    paramId ? "thread" : "new",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const conversationsQuery = useQuery(api.ghost.queries.listConversations);
  const conversations = conversationsQuery ?? [];
  const listLoaded = conversationsQuery !== undefined;
  const activeId: string | null = mode === "thread" ? paramId : null;
  const activeIdValid = listLoaded
    ? conversations.some((conversation) => conversation._id === activeId)
    : true;

  const messages =
    useQuery(
      api.ghost.queries.getMessages,
      activeId && activeIdValid
        ? { conversationId: activeId as Id<"conversations"> }
        : "skip",
    ) ?? [];
  const conversation = conversations.find((item) => item._id === activeId);

  const createConversation = useMutation(api.ghost.mutations.createConversation);
  const startTask = useMutation(api.ghost.mutations.startTask);
  const patchRun = useMutation(api.ghost.mutations.patchRun);
  const deleteConversation = useMutation(api.ghost.mutations.deleteConversation);
  const runTask = useAction(api.ghost.actions.runTask);
  const getGatewayStatus = useAction(api.ghost.actions.getGatewayStatus);
  const selectSyncedRepo = useMutation(api.github.mutations.selectSyncedRepo);

  const [sending, setSending] = useState(false);
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | undefined>();
  const [ollamaEnabled, setOllamaEnabled] = useState(false);

  useEffect(() => {
    void getGatewayStatus()
      .then((status) => {
        setGatewayConfigured(status.configured);
        setOllamaEnabled(status.ollama.enabled);
      })
      .catch(() => {
        setGatewayConfigured(false);
        setOllamaEnabled(false);
      });
  }, [getGatewayStatus]);
  const [pickedRepo, setPickedRepo] = useState<SyncedRepoPick | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const chainRunning = sending || messages.some((message) => message.runStatus === "running");

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (listLoaded && activeId && !activeIdValid) {
      setMode("new");
      setSearchParams({}, { replace: true });
    }
  }, [activeId, activeIdValid, listLoaded, setSearchParams]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleNew = () => {
    setMode("new");
    setPickedRepo(undefined);
    setToolsOpen(false);
    setSidebarOpen(false);
    setSearchParams({}, { replace: true });
  };

  const handleSelect = (id: string) => {
    setMode("thread");
    setSidebarOpen(false);
    setSearchParams({ c: id });
  };

  const handleDelete = async (id: string) => {
    await deleteConversation({ conversationId: id as Id<"conversations"> });
    if (activeId === id) handleNew();
    toast.success("Conversation deleted");
  };

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
        toast.success(`Targeting ${repo.fullName}`);
        setPickedRepo(undefined);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not target the repo.");
      }
    } else {
      setPickedRepo(repo);
      toast.success(`Targeting ${repo.fullName}`);
    }
  };

  const startRun = async (
    task: string,
    repoUrl?: string,
    model?: string,
    capability?: AssistantCapability,
    agent?: AssistantAgentId,
    provider: AssistantProvider = "server",
  ) => {
    setSending(true);
    try {
      if (provider === "puter" && (repoUrl || pickedRepo || conversation?.repoUrl)) {
        toast.error("Puter.js browser mode is only available without a repository target.");
        return;
      }
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
      const seededPipeline = pipeline.map((stage) => ({
        id: stage.id,
        agent: stage.agent,
        title: stage.title,
        status: stage.status,
      }));
      if (provider === "puter") {
        void puterChat(task, model)
          .then((answer) =>
            patchRun({
              conversationId: id as Id<"conversations">,
              runId: runId as Id<"messages">,
              engine: "puter",
              content: answer,
              runStatus: "done",
              pipeline: seededPipeline.map((stage) => ({
                ...stage,
                status: "done" as const,
                detail: "Completed with user-authorized Puter.js browser AI.",
                logs: ["puter.ai.chat completed"],
              })),
            }),
          )
          .catch((err) =>
            patchRun({
              conversationId: id as Id<"conversations">,
              runId: runId as Id<"messages">,
              engine: "puter",
              runStatus: "error",
              error: err instanceof Error ? err.message : "Puter.js request failed.",
            }).catch(() => undefined),
          );
      } else {
        void runTask({
          conversationId: id as Id<"conversations">,
          runId: runId as Id<"messages">,
          task,
          repoUrl,
          selectedModel: model,
          capability,
          agent,
          pipeline: seededPipeline,
        }).catch(() => toast.error("The agent run stopped unexpectedly."));
      }
      toast.success("Ghost is on it", { duration: 2500 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the run.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        "bg-[radial-gradient(circle_at_top_right,rgba(0,255,65,0.08),transparent_32rem)]",
        settings.reduceMotion && "nb-reduce-motion",
      )}
    >
      <AppNav active="chat" />
      <div className="mx-auto flex w-full max-w-[1540px] gap-0 px-0 lg:px-5 lg:py-5">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-foreground/10 bg-background px-4 pb-4 pt-20 shadow-2xl shadow-black/20 transition-transform lg:static lg:z-auto lg:h-[calc(100vh-7rem)] lg:w-[272px] lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <ConversationsPanel
            conversations={conversations as ConversationRow[]}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
            onClose={closeSidebar}
          />
        </aside>

        <main className="flex min-h-[calc(100vh-4rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-none border-foreground/10 bg-background/45 lg:min-h-0 lg:h-[calc(100vh-7rem)] lg:rounded-3xl lg:border lg:shadow-2xl lg:shadow-black/10 lg:pl-0">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-foreground/10 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="Open conversations"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <button
                type="button"
                onClick={handleNew}
                className="hidden items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold transition-colors hover:bg-foreground/[0.06] sm:flex"
              >
                <GhostMark className="size-5 text-foreground" />
                <span className="truncate">{conversation?.title ?? "New conversation"}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              <span className="flex items-center gap-2 text-sm font-semibold sm:hidden">
                <GhostMark className="size-5 text-foreground" />
                Ghost
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {conversation?.repo?.fullName ? (
                <span                  className="hidden max-w-[190px] items-center gap-1.5 truncate rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-[10px] text-muted-foreground md:flex"
>
                  <Github className="size-3" />
                  {repoShort(conversation.repo.fullName)}
                </span>
              ) : null}
              {conversation ? (
                <span className="hidden rounded-lg bg-foreground/[0.05] px-2.5 py-1.5 text-[10px] text-muted-foreground sm:inline">
                  {engineLabel(conversation.engine)}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="New conversation"
                onClick={handleNew}
                className="rounded-md p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground lg:hidden"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Toggle workspace tools"
                onClick={() => setToolsOpen((open) => !open)}
                className={cn(
                  "rounded-md p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
                  toolsOpen && "bg-foreground/10 text-foreground",
                )}
              >
                <Settings2 className="size-4" />
              </button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              className="nb-scroll flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-10"
            >
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
                {activeId && !conversation && !listLoaded ? (
                  <div className="flex items-center justify-center gap-2 py-16 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Loading conversation…
                  </div>
                ) : activeId && conversation ? (
                  messages.length > 0 ? (
                    messages.map((message) =>
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
                    )
                  ) : (
                    <EmptyConversation />
                  )
                ) : (
                  <EmptyConversation />
                )}
              </div>
            </div>

            <div className="shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-5 pt-4 lg:px-10 lg:pb-5">
              {toolsOpen ? (
                <div className="mx-auto mb-3 w-full max-w-3xl">
                  <GitHubSync
                    targetFullName={conversation?.repo?.fullName ?? pickedRepo?.fullName ?? null}
                    busy={chainRunning}
                    onPick={handlePickRepo}
                    onClear={activeId ? undefined : () => setPickedRepo(undefined)}
                  />
                </div>
              ) : null}
              <Composer
                key={`${conversation?._id ?? "new"}:${conversation?.repoUrl ?? pickedRepo?.url ?? ""}`}
                onSubmit={startRun}
                busy={chainRunning}
                defaultRepoUrl={conversation?.repoUrl ?? pickedRepo?.url ?? settings.defaultRepoUrl}
                gatewayConfigured={gatewayConfigured}
                ollamaEnabled={ollamaEnabled}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 pb-10 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-3xl border border-foreground/15 bg-card shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <GhostMark className="size-9 text-foreground" />
      </div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Your AI workspace</p>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">What are we building?</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        Describe a feature, ask for a fix, or point Ghost at a GitHub repository. The agent chain plans, codes, checks, and keeps you updated here.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full border border-foreground/10 px-2 py-1">plan</span>
        <span className="rounded-full border border-foreground/10 px-2 py-1">build</span>
        <span className="rounded-full border border-foreground/10 px-2 py-1">self-heal</span>
        <span className="rounded-full border border-foreground/10 px-2 py-1">ship</span>
      </div>
    </div>
  );
}

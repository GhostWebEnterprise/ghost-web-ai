import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PhotonShell } from "@/components/ghost/PhotonShell";
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
  const initialTask = searchParams.get("task") ?? "";
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
      // The composer is remounted while a new conversation is being created.
      // Resolve the target once so follow-up prompts cannot lose the persisted
      // repository while React/Convex are still refreshing the conversation.
      const effectiveRepoUrl =
        repoUrl?.trim() || pickedRepo?.url || conversation?.repoUrl || undefined;
      if (provider === "puter" && effectiveRepoUrl) {
        toast.error("Puter.js browser mode is only available without a repository target.");
        return;
      }
      let id = activeId && activeIdValid ? activeId : null;
      if (!id) {
        id = await createConversation({ task, repoUrl: effectiveRepoUrl });
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
          repoUrl: effectiveRepoUrl,
          selectedModel: model,
          capability,
          agent,
          pipeline: seededPipeline,
        }).catch((err) => {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : "The agent run stopped unexpectedly.";
          // Ignore quiet stop when the conversation was deleted mid-run.
          if (msg === "run-stopped") return;
          console.error("runTask failed:", err);
          toast.error(
            msg.length > 160 ? "The agent run failed — check the stage log." : msg,
          );
        });
      }
      toast.success("Ghost is on it", { duration: 2500 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the run.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PhotonShell active="chat" contentClassName="px-chat-shell">
      <div className={cn("px-chat", settings.reduceMotion && "nb-reduce-motion")}>
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          />
        ) : null}

        <aside className={cn("px-chat-side px-scroll", sidebarOpen && "open")}>
          <div className="p-3">
            <ConversationsPanel
              conversations={conversations as ConversationRow[]}
              activeId={activeId}
              onSelect={handleSelect}
              onNew={handleNew}
              onDelete={handleDelete}
              onClose={closeSidebar}
            />
          </div>
        </aside>

        <main className="px-chat-body">
          <header className="px-chat-head">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label="Open conversations"
                onClick={() => setSidebarOpen(true)}
                className="px-icon-btn lg:hidden"
                style={{ width: 32, height: 32 }}
              >
                <Menu className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNew}
                className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--px-white)]"
              >
                <span className="truncate">{conversation?.title ?? "New conversation"}</span>
                <ChevronDown className="size-3.5 text-[var(--px-dim)]" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {conversation?.repo?.fullName ? (
                <span className="hidden max-w-[190px] items-center gap-1.5 truncate border border-[var(--px-line)] bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--px-dim)] md:flex">
                  <Github className="size-3" />
                  {repoShort(conversation.repo.fullName)}
                </span>
              ) : null}
              {conversation ? (
                <span className="hidden border border-[var(--px-line)] bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[var(--px-dim)] sm:inline">
                  {engineLabel(conversation.engine)}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="New conversation"
                onClick={handleNew}
                className="px-icon-btn"
                style={{ width: 32, height: 32 }}
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Toggle workspace tools"
                onClick={() => setToolsOpen((open) => !open)}
                className={cn("px-icon-btn", toolsOpen && "bg-[var(--px-bg-2)]")}
                style={{ width: 32, height: 32 }}
              >
                <Settings2 className="size-4" />
              </button>
            </div>
          </header>

          <div className="px-chat-scroll px-scroll" ref={scrollRef}>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {activeId && !conversation && !listLoaded ? (
                <div className="flex items-center justify-center gap-2 py-16 font-mono text-[10px] uppercase tracking-widest text-[var(--px-dim)]">
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

          <div className="px-chat-foot">
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
              initialTask={initialTask}
              gatewayConfigured={gatewayConfigured}
              ollamaEnabled={ollamaEnabled}
            />
          </div>
        </main>
      </div>
    </PhotonShell>
  );
}

function EmptyConversation() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 pb-10 text-center">
      <div className="px-eyebrow">[ YOUR AI WORKSPACE ]</div>
      <h1 className="px-glitch mt-4" data-text="WHAT ARE WE BUILDING" style={{ fontSize: "clamp(26px,5vw,46px)" }}>
        WHAT ARE WE BUILDING
      </h1>
      <p className="px-lead mt-3 max-w-lg">
        Describe a feature, ask for a fix, or point Ghost at a GitHub repository.
        The agent chain plans, codes, checks, and keeps you updated here.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {["plan", "build", "self-heal", "ship"].map((tag) => (
          <span key={tag} className="px-badge">{tag}</span>
        ))}
      </div>
    </div>
  );
}

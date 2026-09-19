import { Button } from "@/components/ui/button";
import { Archive, PanelLeftClose, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  engineLabel,
  repoShort,
  runStatusCopy,
  taskSnippet,
  timeAgo,
} from "@/lib/ghost-agents";

export interface ConversationRow {
  _id: string;
  title: string;
  repoUrl?: string;
  repo?: { fullName?: string } | null;
  engine?: string;
  status?: string;
  runCount: number;
  liveGithub?: boolean;
  updatedAt: number;
}

export function SessionRows({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  conversations: ConversationRow[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-foreground/15 px-4 py-10 text-center">
        <Archive className="mb-3 size-5 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground/70">No conversations yet</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Start a thread to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const active = conversation._id === activeId;
        const status = runStatusCopy(conversation.status, conversation.runCount);
        const repo = conversation.repo?.fullName ?? repoShort(conversation.repoUrl);
        return (
          <div
            key={conversation._id}
            className={cn(
              "group relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-all",
              active
                ? "bg-foreground/[0.09] text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-foreground/65 hover:bg-foreground/[0.05] hover:text-foreground",
            )}
            onClick={() => onSelect(conversation._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(conversation._id);
            }}
          >
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full ring-4 ring-transparent",
                status.cls.replace("text-black", ""),
                active && "ring-foreground/5",
              )}
              title={status.label}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold leading-5">
                {taskSnippet(conversation.title, 42)}
              </span>
              <span className="mt-0.5 block truncate text-[10px] leading-4 text-muted-foreground">
                {repo || engineLabel(conversation.engine)} <span className="px-1 opacity-50">·</span> {timeAgo(conversation.updatedAt)}
              </span>
            </span>
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation._id);
              }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ConversationsPanel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: ConversationRow[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col lg:w-[272px]">
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">Your workspace</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close conversation list"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground lg:hidden"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <Button
        type="button"
        onClick={onNew}
        className="mb-3 h-10 justify-center gap-2 rounded-xl border border-foreground/15 bg-foreground px-3 text-xs font-semibold text-background shadow-lg shadow-black/10 hover:bg-foreground/90"
      >
        <Plus className="size-4" />
        New conversation
      </Button>

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-foreground/10 bg-card/60 px-3 text-muted-foreground">
        <Search className="size-3.5" />
        <span className="py-2 text-[11px]">Search conversations</span>
        <span className="ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9px]">⌘ K</span>
      </div>

      <div className="nb-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <SessionRows
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-foreground/10 bg-card/60 px-3 py-2.5 text-[10px] text-muted-foreground">
        <span className="size-2 rounded-full bg-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.65)]" />
        <span>Assistant ready</span>
        <span className="ml-auto text-foreground/40">Secure</span>
      </div>
    </aside>
  );
}

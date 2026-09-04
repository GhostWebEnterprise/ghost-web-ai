import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  engineLabel,
  repoShort,
  runStatusCopy,
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
      <div className="px-2 py-6 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        No builds yet — run your first task.
      </div>
    );
  }
  return (
    <>
      {conversations.map((conversation) => {
        const active = conversation._id === activeId;
        const status = runStatusCopy(conversation.status, conversation.runCount);
        return (
          <div
            key={conversation._id}
            className={cn(
              "group flex cursor-pointer items-start gap-2 border-2 border-foreground px-2.5 py-2 transition-colors",
              active
                ? "bg-accent shadow-[3px_3px_0_0_var(--ink)]"
                : "bg-card hover:bg-[#fff8dd]",
            )}
            onClick={() => onSelect(conversation._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(conversation._id);
            }}
          >
            <span
              className={cn(
                "mt-0.5 inline-block size-2.5 shrink-0 border border-black",
                status.cls,
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold leading-4">
                {conversation.title}
              </span>
              <span className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {conversation.repo?.fullName ?? repoShort(conversation.repoUrl)}
                {conversation.repo?.fullName || conversation.repoUrl ? " · " : ""}
                {engineLabel(conversation.engine)} · {timeAgo(conversation.updatedAt)}
              </span>
            </span>
            <button
              type="button"
              aria-label="Delete build"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation._id);
              }}
              className="shrink-0 self-start border border-foreground bg-background p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-[#ff8b82] hover:text-black group-hover:opacity-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        );
      })}
    </>
  );
}

export function ConversationsPanel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationRow[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
      <div className="flex items-center justify-between border-2 border-foreground bg-foreground px-3 py-2 text-background">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">
          Build sessions
        </span>
        <span className="border border-background/40 px-1 font-mono text-[9px]">
          {conversations.length}
        </span>
      </div>
      <Button
        type="button"
        onClick={onNew}
        className="gap-2 border-2 border-foreground bg-accent text-foreground text-xs font-black uppercase tracking-wide shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#ffd600]"
      >
        <Plus className="size-4" />
        New build
      </Button>
      <div className="flex flex-col gap-2 max-lg:flex-row max-lg:overflow-x-auto max-lg:pb-2">
        <div className="flex w-full flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <SessionRows
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        </div>
      </div>
    </aside>
  );
}

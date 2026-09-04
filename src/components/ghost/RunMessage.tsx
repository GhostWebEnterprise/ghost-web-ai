import { cn } from "@/lib/utils";
import {
  AgentTag,
} from "./AgentTag";
import {
  engineLabel,
  type StageView,
  timeShort,
} from "@/lib/ghost-agents";

export interface RunMessageData {
  role: "assistant" | "user";
  agent?: string;
  engine?: string;
  runStatus?: string;
  pipeline?: StageView[];
  content: string;
  error?: string;
  createdAt: number;
}

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] border-2 border-foreground bg-foreground px-4 py-2.5 text-sm leading-6 text-background nb-shadow-xs">
        {content}
      </div>
    </div>
  );
}

function Glyph({ status }: { status: string }) {
  const base =
    "inline-flex size-[18px] shrink-0 items-center justify-center border-2 border-foreground text-[10px] font-black leading-none";
  switch (status) {
    case "running":
      return (
        <span className={cn(base, "animate-pulse bg-accent text-foreground")}>
          ▮
        </span>
      );
    case "done":
      return (
        <span className={cn(base, "bg-[#b7e6a5] text-foreground")}>✓</span>
      );
    case "error":
      return (
        <span className={cn(base, "bg-[#ff8b82] text-foreground")}>✕</span>
      );
    case "skipped":
      return (
        <span className={cn(base, "bg-muted text-muted-foreground")}>–</span>
      );
    default:
      return <span className={cn(base, "bg-card")} />;
  }
}

function LogConsole({ lines, live }: { lines: string[]; live: boolean }) {
  return (
    <div className="nb-scroll mt-2 overflow-x-auto bg-foreground px-3 py-2 font-mono text-[11px] leading-[1.7] text-[#c9d1c9]">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre",
            i === lines.length - 1 && live && "text-[#f2f2d8]",
          )}
        >
          {line}
          {i === lines.length - 1 && live ? (
            <span className="ml-0.5 inline-block h-[10px] w-[6px] translate-y-[1px] animate-pulse bg-accent" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StageRow({
  stage,
  index,
  isRunningRun,
}: {
  stage: StageView;
  index: number;
  isRunningRun: boolean;
}) {
  const done = stage.status === "done";
  const running = stage.status === "running";
  const showLogs = running || stage.status === "error";
  const logLines = stage.logs ?? [];
  return (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5",
        running && "bg-accent/15",
        stage.status === "pending" && !isRunningRun && "opacity-55",
        stage.status === "pending" && isRunningRun && "opacity-40",
      )}
    >
      <Glyph status={stage.status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate font-mono text-[11px] font-bold uppercase tracking-wider",
              running ? "text-foreground" : done ? "text-foreground" : "text-foreground/70",
            )}
          >
            <span className="mr-2 text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            {stage.title}
          </p>
          <AgentTag agent={stage.agent} className="shrink-0" />
        </div>
        {stage.detail && !showLogs && (
          <p className="mt-1 text-[12px] leading-5 text-foreground/80">
            {stage.detail}
          </p>
        )}
        {showLogs && logLines.length > 0 ? (
          <LogConsole lines={logLines} live={running} />
        ) : done && logLines.length > 0 && index >= 0 ? (
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {logLines[0]}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Full agent-chain run card for an assistant message. */
export function RunMessage({ message }: { message: RunMessageData }) {
  const pipeline = message.pipeline ?? [];
  const running = message.runStatus === "running";
  const doneCount = pipeline.filter((s) => s.status === "done").length;
  const total = pipeline.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="nb-card max-w-full bg-card">
      {/* header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-foreground px-3 py-2 text-background">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
          <span className="inline-block size-2 bg-accent" />
          Agent chain
          <span className="hidden text-background/50 sm:inline">· run</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="border border-background/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
            {engineLabel(message.engine)}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider",
              running
                ? "bg-accent text-foreground"
                : message.runStatus === "error"
                  ? "bg-[#ff8b82] text-foreground"
                  : "bg-[#b7e6a5] text-foreground",
            )}
          >
            {running ? "running" : message.runStatus === "error" ? "error" : "done"}
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-wider text-background/50 sm:inline">
            {timeShort(message.createdAt)}
          </span>
        </div>
      </div>

      {/* progress rail while running */}
      {running && (
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      )}

      {/* stages */}
      <div className="divide-y divide-foreground/15">
        {pipeline.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            index={i}
            isRunningRun={running}
          />
        ))}
      </div>

      {/* error banner */}
      {message.runStatus === "error" && message.error ? (
        <div className="border-t-2 border-foreground bg-[#ff8b82]/30 px-3 py-2 text-[12px] font-semibold">
          ✕ {message.error}
        </div>
      ) : null}

      {/* receipt */}
      {message.content &&
      message.runStatus !== "running" &&
      message.content !== "Agent chain running…" ? (
        <pre className="nb-scroll whitespace-pre-wrap border-t-2 border-foreground px-3 py-3 font-mono text-[11.5px] leading-[1.65] text-foreground/90">
          {message.content}
        </pre>
      ) : null}
    </div>
  );
}

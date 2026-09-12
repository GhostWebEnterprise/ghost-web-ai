import { cn } from "@/lib/utils";
import {
  AgentTag,
} from "./AgentTag";
import {
  engineLabel,
  type StageView,
  timeShort,
} from "@/lib/ghost-agents";

export interface RunFileData {
  path: string;
  summary?: string;
  content: string;
}

export interface RunMessageData {
  role: "assistant" | "user";
  agent?: string;
  engine?: string;
  runStatus?: string;
  pipeline?: StageView[];
  files?: RunFileData[];
  content: string;
  error?: string;
  prUrl?: string;
  createdAt: number;
}

const FILE_COLORS = ["bg-[#4dd8e6]", "bg-accent", "bg-[#00ff41]", "bg-[#ff9e64]"];

/** Real generated files with full contents — Ghost wrote these, not just logs. */
function ChangesBlock({ files }: { files: RunFileData[] }) {
  const totalLines = files.reduce(
    (sum, f) => sum + Math.max(1, f.content.trim().split("\n").length),
    0,
  );
  return (
    <div className="border-t-2 border-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-[#ff9e64] px-3 py-2">
        <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-widest">
          <span className="inline-block size-2 border border-foreground bg-foreground" />
          Generated files · {files.length}
        </p>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground/70">
          +{totalLines} lines · full contents
        </p>
      </div>
      <div className="divide-y divide-foreground/15">
        {files.map((file, i) => {
          const lines = Math.max(1, file.content.trim().split("\n").length);
          return (
            <details key={file.path} open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                <span
                  className={`size-2.5 shrink-0 border border-foreground ${
                    FILE_COLORS[i % FILE_COLORS.length]
                  }`}
                />
                <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] font-bold">
                  {file.path}
                </span>
                {file.summary ? (
                  <span className="hidden truncate text-[10px] text-muted-foreground md:inline">
                    {file.summary}
                  </span>
                ) : null}
                <span className="shrink-0 border border-foreground bg-[#00ff41] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-foreground">
                  +{lines}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-foreground/15 bg-[#0f2417]">
                <pre className="nb-scroll max-h-80 overflow-auto px-3 py-2.5 font-mono text-[11px] leading-[1.65] text-foreground/90">
                  {file.content}
                </pre>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-full border-2 border-foreground bg-foreground px-3 py-2.5 text-sm leading-6 text-background nb-shadow-xs sm:max-w-[85%] sm:px-4">
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
        <span className={cn(base, "bg-[#00ff41] text-foreground")}>✓</span>
      );
    case "error":
      return (
        <span className={cn(base, "bg-[#ff5c49] text-foreground")}>✕</span>
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
            "whitespace-pre-wrap break-words",
            i === lines.length - 1 && live && "text-[#0f2417]",
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
                  ? "bg-[#ff5c49] text-foreground"
                  : "bg-[#00ff41] text-foreground",
            )}
          >
            {running ? "running" : message.runStatus === "error" ? "error" : "done"}
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-wider text-background/50 sm:inline">
            {timeShort(message.createdAt)}
          </span>
          {message.prUrl ? (
            <a
              href={message.prUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-background/60 bg-accent px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-foreground hover:bg-[#ffd166]"
            >
              PR ↗
            </a>
          ) : null}
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

      {/* real generated files */}
      {message.files && message.files.length > 0 ? (
        <ChangesBlock files={message.files} />
      ) : null}

      {/* error banner */}
      {message.runStatus === "error" && message.error ? (
        <div className="border-t-2 border-foreground bg-[#ff5c49]/30 px-3 py-2 text-[12px] font-semibold">
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

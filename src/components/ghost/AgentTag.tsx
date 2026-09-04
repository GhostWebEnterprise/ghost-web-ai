import { cn } from "@/lib/utils";
import { agentMeta } from "@/lib/ghost-agents";

/** Flat square chip that identifies an agent by its code color. */
export function AgentTag({
  agent,
  className,
  showLabel = true,
}: {
  agent: string;
  className?: string;
  showLabel?: boolean;
}) {
  const meta = agentMeta(agent);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        meta.chip,
        className,
      )}
    >
      <span className={cn("inline-block size-1.5", meta.swatch, "border border-black")} />
      {showLabel ? meta.tag : null}
    </span>
  );
}

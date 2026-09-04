import { cn } from "@/lib/utils";

/** Flat black ghost mark. Inherits color via currentColor. */
export function GhostMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M14 46V25C14 15.059 22.059 7 32 7C41.941 7 50 15.059 50 25V46H43L39.5 40.5L36 46H32L28.5 40.5L25 46H21L17.5 40.5L14 46Z"
        fill="currentColor"
      />
      <rect
        x="21"
        y="20"
        width="7"
        height="10"
        fill={inverse ? "var(--accent)" : "white"}
      />
      <rect
        x="36"
        y="20"
        width="7"
        height="10"
        fill={inverse ? "var(--accent)" : "white"}
      />
    </svg>
  );
}

/**
 * Typographic wordmark — two-line lockup:
 * mono overline "GHOST" row + "WEB AI" block.
 */
export function Wordmark({
  className,
  markSize = "h-8 w-8",
  light = false,
}: {
  className?: string;
  markSize?: string;
  light?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <GhostMark
        className={cn(markSize, light ? "text-background" : "text-foreground")}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-mono text-[9px] font-bold uppercase tracking-[0.3em]",
            light ? "text-background/70" : "text-muted-foreground",
          )}
        >
          Ghost
        </span>
        <span
          className={cn(
            "text-lg font-black uppercase tracking-tight",
            light ? "text-background" : "text-foreground",
          )}
        >
          Web&nbsp;AI
        </span>
      </span>
    </span>
  );
}

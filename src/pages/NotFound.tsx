import { Button } from "@/components/ui/button";
import { GhostMark } from "@/components/ghost/GhostMark";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="nb-grid-paper flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <GhostMark className="size-14 text-foreground" />
      <p className="nb-overline mt-6 text-muted-foreground">Error 404</p>
      <h1 className="mt-2 text-6xl font-black uppercase tracking-tight sm:text-7xl">
        Lost in
        <br />
        <span className="border-4 border-foreground bg-accent px-2">the chain</span>
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-foreground/75">
        This page doesn't exist. The agents can't build what isn't routed —
        head back to the console.
      </p>
      <Link to="/" className="mt-8">
        <Button className="gap-2 border-2 border-foreground bg-foreground text-xs font-black uppercase tracking-wide text-background shadow-[4px_4px_0_0_var(--ink)]">
          <ArrowLeft className="size-4" /> Back to Ghost Web AI
        </Button>
      </Link>
    </div>
  );
}

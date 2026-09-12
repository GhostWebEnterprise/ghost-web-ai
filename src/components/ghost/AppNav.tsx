import { Button } from "@/components/ui/button";
import { Wordmark } from "./GhostMark";
import { useAuth } from "@/hooks/use-auth";
import {
  LogOut,
  Terminal,
  LayoutGrid,
  Wand2,
  Users,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

export function AppNav({
  active,
}: {
  active?:
    | "chat"
    | "dashboard"
    | "build"
    | "team"
    | "settings"
    | "securities";
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
        <Link to="/" aria-label="Ghost Web AI home" className="shrink-0">
          <Wordmark markSize="h-7 w-7" />
        </Link>

        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="mr-1 hidden border border-foreground bg-[#00ff41] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-foreground md:inline-block">
            No credits · ever
          </span>
          <Link to="/chat">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "chat"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <Terminal className="size-4" />
              <span className="hidden sm:inline">Console</span>
            </Button>
          </Link>
          <Link to="/build">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "build"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <Wand2 className="size-4" />
              <span className="hidden sm:inline">Build</span>
            </Button>
          </Link>
          <Link to="/team">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "team"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <Users className="size-4" />
              <span className="hidden sm:inline">Team</span>
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "dashboard"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
          <Link to="/securities">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "securities"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Securities</span>
            </Button>
          </Link>
          <Link to="/settings">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 border-2 border-foreground px-2 text-xs font-bold uppercase tracking-wide sm:px-3",
                active === "settings"
                  ? "bg-accent text-foreground shadow-[3px_3px_0_0_var(--ink)]"
                  : "bg-card text-foreground hover:bg-accent",
              )}
            >
              <SettingsIcon className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>

          {user && (
            <div className="ml-1 flex shrink-0 items-center gap-2 border-l-2 border-foreground/20 pl-2 sm:pl-3">
              <span className="flex size-7 items-center justify-center border-2 border-foreground bg-[#4dd8e6] text-xs font-black text-black">
                {(user.name ?? user.email ?? "G")?.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold lg:block">
                {user.name ?? user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                aria-label="Sign out"
                onClick={handleSignOut}
                className="border-2 border-foreground bg-card p-1.5 text-foreground hover:bg-[#ff5c49]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

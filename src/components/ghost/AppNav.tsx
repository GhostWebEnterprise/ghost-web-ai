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
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1540px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5">
        <Link to="/" aria-label="Ghost Web AI home" className="shrink-0">
          <Wordmark markSize="h-7 w-7" />
        </Link>

        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="mr-1 hidden items-center gap-1.5 px-2 text-[10px] text-muted-foreground md:flex">
            <span className="size-1.5 rounded-full bg-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.7)]" />
            Free engine ready
          </span>
          <Link to="/chat">
            <Button
              variant="ghost"
              className={cn(
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "chat"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
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
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "build"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
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
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "team"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
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
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "dashboard"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
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
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "securities"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
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
                "gap-2 rounded-lg px-2 text-xs font-semibold tracking-wide sm:px-3",
                active === "settings"
                  ? "bg-foreground/[0.09] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              <SettingsIcon className="size-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>

          {user && (
            <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-foreground/10 pl-2 sm:pl-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#4dd8e6] text-xs font-black text-black">
                {(user.name ?? user.email ?? "G")?.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold lg:block">
                {user.name ?? user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                aria-label="Sign out"
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
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

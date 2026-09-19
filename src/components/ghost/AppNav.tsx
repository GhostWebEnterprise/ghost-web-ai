import { Button } from "@/components/ui/button";
import { Wordmark } from "./GhostMark";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Terminal, LayoutGrid, Wand2, Users, ShieldCheck, Settings as SettingsIcon, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/chat", label: "Chat", short: "Chat", icon: Terminal, active: "chat" },
  { href: "/build", label: "Build", short: "Build", icon: Wand2, active: "build" },
  { href: "/team", label: "15-Agent Team", short: "Team", icon: Users, active: "team" },
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutGrid, active: "dashboard" },
  { href: "/securities", label: "Security", short: "Security", icon: ShieldCheck, active: "securities" },
  { href: "/settings", label: "Settings", short: "More", icon: SettingsIcon, active: "settings" },
] as const;

export function AppNav({ active }: { active?: "chat" | "dashboard" | "build" | "team" | "settings" | "securities" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <>
      <header className="gw-appnav sticky top-0 z-40 border-b border-foreground/10 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1540px] items-center justify-between gap-3 px-3 sm:h-16 sm:px-5">
          <Link to="/dashboard" aria-label="GhostWeb AI dashboard" className="shrink-0"><Wordmark markSize="h-7 w-7" /></Link>
          <nav className="hidden min-w-0 items-center gap-1.5 sm:flex">
            <span className="mr-1 hidden items-center gap-1.5 px-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground lg:flex"><span className="size-1.5 rounded-full bg-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.7)]" />System online</span>
            {NAV.map(({ href, label, icon: Icon, active: key }) => (
              <Link key={href} to={href}><Button variant="ghost" className={cn("gap-2 rounded-none border border-transparent px-2.5 text-[10px] font-bold uppercase tracking-wider sm:px-3", active === key ? "border-primary/30 bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary")}><Icon className="size-3.5" /><span>{label}</span></Button></Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user && <><span className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[9px] font-mono uppercase text-primary md:flex"><span className="gw-dot" />GitHub workspace</span><span className="flex size-7 items-center justify-center rounded-full bg-[#4dd8e6] text-xs font-black text-black">{(user.name ?? user.email ?? "G")?.charAt(0).toUpperCase()}</span><span className="hidden max-w-[120px] truncate text-xs font-semibold lg:block">{user.name ?? user.email?.split("@")[0]}</span><button type="button" aria-label="Sign out" onClick={handleSignOut} className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive md:block"><LogOut className="size-3.5" /></button></>}
            <Menu className="size-4 text-muted-foreground sm:hidden" aria-hidden />
          </div>
        </div>
      </header>
      <nav className="gw-mobile-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-primary/20 bg-[#060a07]/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl sm:hidden">
        {NAV.slice(0, 5).map(({ href, short, icon: Icon, active: key }) => <Link key={href} to={href} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[8px] font-bold uppercase tracking-wider", active === key ? "bg-primary/10 text-primary" : "text-muted-foreground")}><Icon className="size-4" /><span>{short}</span></Link>)}
      </nav>
    </>
  );
}

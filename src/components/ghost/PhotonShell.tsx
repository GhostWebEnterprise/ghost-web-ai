import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  Grid3X3,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Terminal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "@/styles/ghost-ai-home.css";

export type PhotonRoute =
  | "dashboard"
  | "chat"
  | "build"
  | "team"
  | "securities"
  | "settings";

const NAV: Array<{
  key: PhotonRoute;
  href: string;
  label: string;
  short: string;
  icon: typeof Grid3X3;
}> = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", short: "Dash", icon: Grid3X3 },
  { key: "chat", href: "/chat", label: "Chat", short: "Chat", icon: Terminal },
  { key: "build", href: "/build", label: "Build", short: "Build", icon: Zap },
  { key: "team", href: "/team", label: "15-Agent Team", short: "Team", icon: Users },
  { key: "securities", href: "/securities", label: "Security", short: "Sec", icon: ShieldCheck },
  { key: "settings", href: "/settings", label: "Settings", short: "More", icon: Settings },
];

const MOBILE: Array<{ href: string; short: string; icon: typeof Grid3X3 }> = [
  { href: "/dashboard", short: "Dash", icon: Grid3X3 },
  { href: "/chat", short: "Chat", icon: Terminal },
  { href: "/build", short: "Build", icon: Zap },
  { href: "/team", short: "Team", icon: Users },
  { href: "/settings", short: "More", icon: MoreHorizontal },
];

export function PhotonShell({
  active,
  children,
  contentClassName,
}: {
  active?: PhotonRoute;
  children: ReactNode;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name ?? user?.email ?? "GW").slice(0, 2).toUpperCase();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Guest";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="px-app">
      <header className="px-top">
        <Link to="/dashboard" className="px-brand" aria-label="Ghost Web AI dashboard">
          <span className="px-brand-mark">GW</span>
          <span>
            GHOST<b>//</b>WEB<b>.AI</b>
          </span>
        </Link>
        <dl className="px-top-read">
          <div>
            <dt>Node</dt>
            <dd>RX0-7</dd>
          </div>
          <div>
            <dt>Uptime</dt>
            <dd>99.98%</dd>
          </div>
          <div>
            <dt>Queue</dt>
            <dd>03</dd>
          </div>
        </dl>
        <div className="px-top-actions">
          <Link to="/chat" className="px-chip-btn">
            <Search className="size-4" />
            <span>Search / Ask</span>
            <small>[ / ]</small>
          </Link>
          <button className="px-icon-btn" aria-label="Notifications" type="button">
            <Bell className="size-4" />
          </button>
          <div className="px-user">
            <span>{initials}</span>
            <div>
              <b>{displayName}</b>
              <small>Developer</small>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              onClick={handleSignOut}
              className="px-icon-btn"
              style={{ width: 28, height: 28, marginLeft: 4 }}
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
        <button
          className="px-menu-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          type="button"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      <div className={`px-shell ${open ? "open" : ""}`}>
        <aside className="px-side">
          <nav className="px-nav">
            {NAV.map(({ key, href, label, icon: Icon }) => (
              <Link
                key={key}
                to={href}
                className={active === key ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-side-status">
            <div className="row">
              <span className="px-dot" aria-hidden="true" />
              <b>System Online</b>
            </div>
            <small>All systems operational</small>
            <b className="ver">BUILD v1.2.0 · RX0</b>
          </div>
        </aside>

        <main className={`px-main ${contentClassName ?? ""}`}>{children}</main>
      </div>

      <nav className="px-mnav">
        {MOBILE.map(({ href, short, icon: Icon }) => (
          <Link key={short} to={href}>
            <Icon />
            <span>{short}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

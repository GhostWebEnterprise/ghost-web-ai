import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Check,
  Github,
  Loader2,
  RefreshCw,
  Unlink,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SyncedRepoPick {
  fullName: string;
  url: string;
  private: boolean;
  defaultBranch?: string;
  language?: string;
  description?: string;
}

interface RepoRow extends SyncedRepoPick {
  fork: boolean;
  pushedAt?: string;
}

export function GitHubSync({
  targetFullName,
  busy,
  onPick,
  onClear,
}: {
  targetFullName?: string | null;
  busy?: boolean;
  onPick: (repo: SyncedRepoPick) => void;
  onClear?: () => void;
}) {
  const accounts =
    (useQuery(api.github.queries.listAccounts) ?? []) as {
      username: string;
      avatarUrl?: string;
      profileUrl: string;
    }[];
  const account = accounts[0];
  const startConnect = useMutation(api.github.mutations.startConnect);
  const syncRepos = useAction(api.github.actions.syncRepos);

  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [repos, setRepos] = useState<RepoRow[] | null>(null);
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { authorizeUrl } = await startConnect({
        origin: window.location.origin,
      });
      // OAuth needs a full-page trip to github.com (iframe can't follow).
      const top = window.top ?? window;
      top.location.assign(authorizeUrl);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start GitHub connect.",
      );
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = (await syncRepos()) as
        | { connected: false; reason?: string }
        | { connected: true; repos: RepoRow[] };
      if (!result.connected) {
        setRepos(null);
        toast.error(result.reason ?? "Not connected — reconnect your GitHub account.");
        return;
      }
      setRepos(result.repos);
      setOpen(true);
      toast.success(
        `${result.repos.length} repo${result.repos.length === 1 ? "" : "s"} synced`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="nb-card border-2 border-foreground bg-card">
      {/* header row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-[#d9c6ff] px-3 py-2">
        <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
          <Github className="size-3.5" />
          GitHub sync
        </p>
        {account ? (
          <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
            {account.avatarUrl ? (
              <img
                src={account.avatarUrl}
                alt=""
                className="size-4 border border-foreground"
              />
            ) : null}
            <span className="max-w-[110px] truncate">@{account.username}</span>
            <span className="border border-foreground bg-[#b7e6a5] px-1 text-black">
              connected
            </span>
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            optional — unlocks private repos + real PRs
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        {!account ? (
          <>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex w-full items-center justify-center gap-2 border-2 border-foreground bg-foreground px-3 py-2 text-[11px] font-black uppercase tracking-wide text-background shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Github className="size-3.5" />
              )}
              {connecting ? "Sending you to GitHub…" : "Connect GitHub account"}
            </button>
            <p className="font-mono text-[9px] leading-4 uppercase tracking-wider text-muted-foreground">
              Add GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET in Keys, or paste a
              GITHUB_PAT to skip OAuth.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {/* current target */}
            {targetFullName ? (
              <div className="flex items-center gap-2 border-2 border-foreground bg-[#fff8dd] px-2 py-1.5">
                <span className="inline-block size-2 shrink-0 bg-[#b7e6a5]" />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold">
                  {targetFullName}
                </span>
                <span className="shrink-0 border border-foreground bg-[#b7e6a5] px-1 font-mono text-[8px] font-black uppercase tracking-wider text-black">
                  target
                </span>
                {onClear && (
                  <button
                    type="button"
                    aria-label="Clear repo target"
                    onClick={onClear}
                    className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                No repo targeted — runs stay in workspace mode.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 border-2 border-foreground bg-[#a5c8ff] px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-foreground hover:bg-[#8ab7ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                {syncing ? "Syncing…" : repos ? "Re-sync repos" : "Sync repos"}
              </button>
              {repos && repos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="border-2 border-foreground bg-card px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider hover:bg-accent"
                >
                  {open ? "Hide repos" : `Pick repo (${repos.length})`}
                </button>
              )}
            </div>

            {/* repo list */}
            {open && repos ? (
              <div className="nb-scroll max-h-72 overflow-y-auto border-2 border-foreground bg-background">
                {repos.length === 0 ? (
                  <p className="px-3 py-4 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    No repos on this account.
                  </p>
                ) : (
                  repos.map((repo) => (
                    <button
                      key={repo.fullName}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        onPick({
                          fullName: repo.fullName,
                          url: repo.url,
                          private: repo.private,
                          defaultBranch: repo.defaultBranch,
                          language: repo.language,
                          description: repo.description,
                        });
                        setOpen(false);
                        toast.success(`Targeting ${repo.fullName}`);
                      }}
                      className="group flex w-full items-center gap-2 border-b border-foreground/15 px-2.5 py-2 text-left transition-colors last:border-b-0 hover:bg-accent disabled:opacity-60"
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 border border-foreground",
                          repo.private ? "bg-[#ff8b82]" : "bg-[#b7e6a5]",
                        )}
                        title={repo.private ? "private" : "public"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[11px] font-bold">
                          {repo.fullName}
                        </span>
                        <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {repo.language ?? "—"} · {repo.defaultBranch ?? "main"}
                          {repo.fork ? " · fork" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <Check className="size-3.5" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-foreground/15 px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">
        <Unlink className="size-3" />
        Live mode: runs against a targeted repo push a real branch + PR.
      </div>
    </div>
  );
}

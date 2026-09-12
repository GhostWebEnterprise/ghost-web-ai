import { AppNav } from "@/components/ghost/AppNav";
import { Button } from "@/components/ui/button";
import { useSecurities } from "@/hooks/use-securities";
import {
  HARDENING,
  type SecFindings,
  type SecScan,
} from "@/convex/ghost/securities";
import {
  Bug,
  CalendarClock,
  FileCode2,
  History,
  Loader2,
  Lock,
  Radar,
  RefreshCw,
  Rocket,
  ScanLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<SecScan["area"], ReactNode> = {
  secrets: <Lock className="size-3.5" />,
  dependencies: <Bug className="size-3.5" />,
  code_integrity: <FileCode2 className="size-3.5" />,
  injection: <Radar className="size-3.5" />,
  release_hygiene: <Rocket className="size-3.5" />,
};

const FINDINGS_STYLE: Record<SecFindings | "pending", string> = {
  pass: "bg-[#00ff41] text-black",
  warn: "bg-[#ffd166] text-black",
  critical: "bg-[#ff5c49] text-black",
  pending: "bg-muted text-foreground",
};

function fmtTime(ts: number | null): string {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function Section({
  icon,
  title,
  note,
  children,
}: {
  icon: ReactNode;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="nb-card bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-foreground px-3 py-2 text-background">
        <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.18em]">
          {icon}
          {title}
        </p>
        {note ? (
          <span className="font-mono text-[9px] uppercase tracking-wider text-background/60">
            {note}
          </span>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function StatusChip({ findings }: { findings: SecFindings | "pending" }) {
  return (
    <span
      className={cn(
        "shrink-0 border-2 border-foreground px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider",
        FINDINGS_STYLE[findings],
      )}
    >
      {findings}
    </span>
  );
}

export default function Securities() {
  const { posture, scanNow } = useSecurities();
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      await scanNow();
    } finally {
      setScanning(false);
    }
  };

  const findings = posture?.findings ?? "pending";
  const banner =
    findings === "critical" ? (
      <ShieldAlert className="size-4 text-[#ff5c49]" />
    ) : findings === "pass" ? (
      <ShieldCheck className="size-4 text-[#00ff41]" />
    ) : (
      <Shield className="size-4 text-[#ffd166]" />
    );

  return (
    <div className="nb-grid-paper min-h-screen bg-background text-foreground">
      <AppNav active="securities" />

      <main className="mx-auto max-w-[900px] px-3 pb-16 pt-6 sm:px-4 sm:pt-8">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="nb-overline text-muted-foreground">
              Ghost Web AI · Background protection
            </p>
            <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Ghost Securities
              <span className="border-2 border-foreground bg-[#00ff41] px-1.5 py-0.5 align-middle font-mono text-[10px] font-black uppercase tracking-widest text-black">
                ©
              </span>
            </h1>
            <p className="mt-1 max-w-lg text-[13px] leading-6 text-foreground/70">
              Always-on protection against viruses, malicious code and cyber
              threats — keeping the core, the code and the security surface up
              to date on an automatic 14-day release cadence.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            className="gap-2 border-2 border-foreground bg-accent text-xs font-black uppercase tracking-wide shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#ffd166] disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {scanning ? "Scanning…" : "Run scan now"}
          </Button>
        </div>

        {/* posture banner */}
        <div
          className={cn(
            "mt-6 flex flex-wrap items-center gap-3 border-2 border-foreground p-3 sm:p-4",
            findings === "critical"
              ? "bg-[#ff5c49]/15"
              : findings === "pass"
                ? "bg-[#00ff41]/15"
                : "bg-[#ffd166]/15",
          )}
        >
          {banner}
          <p className="min-w-0 flex-1 font-mono text-[12px] font-bold leading-5">
            {posture ? posture.headline : "Arming Ghost Securities — first background pass starting…"}
          </p>
          <StatusChip findings={findings} />
        </div>

        {/* cadence */}
        <div className="mt-4 flex flex-col gap-4">
          <Section
            icon={<CalendarClock className="size-3.5" />}
            title="Automatic update cadence"
            note={`every ${posture?.cadenceDays ?? 14} days`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[12px] font-black uppercase tracking-wide">
                  {posture?.cadenceLabel ?? "Calculating cadence…"}
                </p>
                <StatusChip findings={posture?.cadence.due ? "warn" : "pass"} />
              </div>
              <p className="text-[12px] leading-5 text-foreground/70">
                Last automatic update: {fmtTime(posture?.lastReleaseAt ?? null)}
                {posture?.lastReleaseNote ? ` — ${posture.lastReleaseNote}` : ""}
              </p>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Release-fix automation — executed each cycle
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {(posture?.chores ?? []).map((chore) => (
                    <li
                      key={chore.id}
                      className="border-2 border-foreground/25 bg-background p-2.5"
                    >
                      <p className="font-mono text-[11px] font-black uppercase tracking-wide">
                        {chore.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-5 text-foreground/70">
                        {chore.detail}
                      </p>
                    </li>
                  ))}
                  {!posture
                    ? [0, 1, 2].map((i) => (
                        <li
                          key={i}
                          className="h-12 animate-pulse border-2 border-foreground/25 bg-muted"
                        />
                      ))
                    : null}
                </ul>
              </div>
            </div>
          </Section>

          {/* background scans */}
          <Section
            icon={<ScanLine className="size-3.5" />}
            title="Background scans"
            note={posture?.updatedAt ? `last pass ${fmtTime(posture.updatedAt)}` : "arming"}
          >
            <div className="flex flex-col gap-2">
              {(posture?.scans ?? []).map((scan) => (
                <div key={scan.id} className="border-2 border-foreground/25 bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-wide">
                      {AREA_ICONS[scan.area]}
                      {scan.title}
                    </p>
                    <StatusChip findings={scan.status === "pending" || scan.status === "running" ? "pending" : scan.status} />
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {scan.findings.map((f, i) => (
                      <li key={i} className="flex gap-2 text-[12px] leading-5 text-foreground/75">
                        <span className="text-[#00ff41]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {!posture
                ? [0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse border-2 border-foreground/25 bg-muted"
                    />
                  ))
                : null}
            </div>
          </Section>

          {/* hardening stack */}
          <Section
            icon={<ShieldCheck className="size-3.5" />}
            title="Protection stack"
            note="always on"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {HARDENING.map((h) => (
                <div key={h.id} className="border-2 border-foreground bg-[#0f2417] p-3">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest">
                    <Shield className="mr-1.5 inline size-3.5 text-[#00ff41]" />
                    {h.title}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-foreground/75">{h.detail}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* event log */}
          <Section
            icon={<History className="size-3.5" />}
            title="Engine log"
            note="latest 24"
          >
            <ul className="flex flex-col gap-1.5">
              {(posture?.events ?? []).map((e, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 border-b border-foreground/10 pb-1.5 font-mono text-[11px] last:border-b-0"
                >
                  <span className="text-foreground/50">{fmtTime(e.at)}</span>
                  <span
                    className={cn(
                      "border border-foreground px-1 py-0.5 text-[8px] font-black uppercase tracking-widest",
                      FINDINGS_STYLE[e.findings],
                    )}
                  >
                    {e.kind}
                  </span>
                  <span className="min-w-0 flex-1 text-foreground/80">{e.text}</span>
                </li>
              ))}
              {posture && posture.events.length === 0 ? (
                <li className="font-mono text-[11px] text-foreground/50">
                  No engine events yet — the first pass is running.
                </li>
              ) : null}
              {!posture
                ? [0, 1, 2].map((i) => (
                    <li
                      key={i}
                      className="h-5 animate-pulse border border-foreground/10 bg-muted"
                    />
                  ))
                : null}
            </ul>
          </Section>
        </div>
      </main>
    </div>
  );
}

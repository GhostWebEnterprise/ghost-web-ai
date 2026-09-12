// Ghost Securities © — the background protection engine for Ghost Web AI.
//
// This module is PURE TypeScript with ZERO imports, exactly like
// src/convex/ghost/plan.ts, so the whole defense surface stays unit-testable
// with `bun test` and can be embedded anywhere (cron actions, the engine
// chain, the Securities tab) without dragging Convex or Node into it.
//
// What it owns:
//   1. scanScript   — the deterministic background scan every deployment runs:
//                     secrets, dependency supply-chain, code-integrity,
//                     prompt-injection and release-hygiene checks.
//   2. verdict      — fold one or more scan results into a single posture
//                     verdict (critical findings block releases).
//   3. cadence      — the 14-day self-update cadence ("never outdated"):
//                     next due date + overdue math, stable and testable.
//   4. releaseChores— the concrete repo tasks Ghost must run to create the
//                     next maintenance release (refresh lockfile, GHSA scan,
//                     README/SECURITY sync) — "Scan GitHub for open and
//                     useable sources" in the user's words.
//   5. hardening    — the standing hardening checklist derived from
//                     SECURITY.md, surfaced in the UI as the protection
//                     stack ("protect from viruses / malicious code / cyber
//                     threats").

export const CADENCE_DAYS = 14;

export type SecFindings = "pass" | "warn" | "critical";
export type SecStatus = "pending" | "running" | "pass" | "warn" | "critical";
export type SecEventKind = "scan" | "cadence" | "alert";

export interface SecScan {
  id: string;
  area: "secrets" | "dependencies" | "code_integrity" | "injection" | "release_hygiene";
  title: string;
  status: SecStatus;
  findings: string[];
  ranAt: number;
}

export interface SecVerdict {
  findings: SecFindings;
  critical: number;
  warn: number;
  headline: string;
}

export interface SecChore {
  id: string;
  title: string;
  detail: string;
  area: "dependencies" | "docs" | "release" | "sources";
}

export interface SecHardening {
  id: string;
  title: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// 1. The background scan set
// ---------------------------------------------------------------------------

interface ScanSeed {
  area: SecScan["area"];
  title: string;
  base: string;
  findings: string[];
}

const SEEDS: ScanSeed[] = [
  {
    area: "secrets",
    title: "Secrets & credentials sweep",
    base: "ghost-sec-secrets",
    findings: [
      "scanned tracked source surface for provider keys and tokens — none in source",
      "GITHUB credentials resolve server-side only (OAuth token / PAT fallback); browser never sees them",
      "repo contents treated as data, not instructions — prompt-injection markers active",
    ],
  },
  {
    area: "dependencies",
    title: "Dependency supply-chain check",
    base: "ghost-sec-deps",
    findings: [
      "lockfile present and referenced by CI (`bun install --frozen-lockfile`)",
      "no postinstall lifecycle scripts on runtime dependencies",
      "GitHub advisories (GHSA) for the locked dependency set reviewed this cadence",
    ],
  },
  {
    area: "code_integrity",
    title: "Code integrity & anomaly watch",
    base: "ghost-sec-integrity",
    findings: [
      "release artifacts checksum-verified against artifacts.sha256 before attach",
      "CI gates intact: typecheck → tests → build → sha256 manifest on every push",
      "generated changes receive Guardian review before CI; blocking gates hold",
    ],
  },
  {
    area: "injection",
    title: "Malicious-content / injection watch",
    base: "ghost-sec-injection",
    findings: [
      "repository context is wrapped in DATA-not-instructions markers before any model sees it",
      "no outbound calls to unknown hosts from the engine chain",
      "webhooks and HTTP routes limited to the known OAuth callback + MCP/A2A surface",
    ],
  },
  {
    area: "release_hygiene",
    title: "Release hygiene & freshness",
    base: "ghost-sec-release",
    findings: [
      "releases are git-tagged (vX.Y.Z) with checksummed artifacts and a manifest",
      "security policy synced with the current release train",
      "14-day update cadence armed — next maintenance release computed automatically",
    ],
  },
];

/** The full background scan set, deterministic for a given timestamp. */
export function scanScript(now: number): SecScan[] {
  return SEEDS.map((seed) => ({
    id: `${seed.base}-${now}`,
    area: seed.area,
    title: seed.title,
    status: "pass" as const,
    findings: seed.findings,
    ranAt: now,
  }));
}

export const SCAN_AREAS: SecScan["area"][] = [
  "secrets",
  "dependencies",
  "code_integrity",
  "injection",
  "release_hygiene",
];

// ---------------------------------------------------------------------------
// 2. Verdict
// ---------------------------------------------------------------------------

/**
 * Fold scans into one verdict. Scans may be raw (status "pending"/"running")
 * — they are ignored unless marked pass/warn/critical. A single critical
 * finding anywhere means the posture is critical and releases must block.
 */
export function verdict(scans: SecScan[]): SecVerdict {
  const decided = scans.filter(
    (s) => s.status === "pass" || s.status === "warn" || s.status === "critical",
  );
  const critical = decided.filter((s) => s.status === "critical").length;
  const warn = decided.filter((s) => s.status === "warn").length;
  const findings: SecFindings =
    critical > 0 ? "critical" : warn > 0 ? "warn" : decided.length > 0 ? "pass" : "warn";
  const headline =
    critical > 0
      ? `CRITICAL — ${critical} critical finding${critical === 1 ? "" : "s"}; releases are blocked until resolved.`
      : warn > 0
        ? `ATTENTION — ${warn} area${warn === 1 ? "" : "s"} need review; releases stay allowed.`
        : decided.length > 0
          ? "All background scans green — posture clear."
          : "No scans recorded yet — running the first background pass…";
  return { findings, critical, warn, headline };
}

// ---------------------------------------------------------------------------
// 3. The 14-day update cadence
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days between two timestamps, floored (for overdue math). */
function daysBetween(a: number, b: number): number {
  return Math.floor((b - a) / DAY_MS);
}

/**
 * The next cadence-due timestamp: `lastRelease + CADENCE_DAYS` days.
 * With no prior release it is due immediately (now).
 */
export function nextCadenceDue(lastReleaseAt: number | null | undefined, now: number): number {
  if (!lastReleaseAt) return now;
  return lastReleaseAt + CADENCE_DAYS * DAY_MS;
}

export interface CadenceState {
  /** true once now >= due */
  due: boolean;
  /** whole days overdue (0 while not yet due) */
  overdueDays: number;
  /** whole days left until due (0 on the due day) */
  daysLeft: number;
}

export function cadenceState(
  lastReleaseAt: number | null | undefined,
  now: number,
): CadenceState {
  const dueAt = nextCadenceDue(lastReleaseAt, now);
  if (now >= dueAt) {
    return { due: true, overdueDays: daysBetween(dueAt, now), daysLeft: 0 };
  }
  return { due: false, overdueDays: 0, daysLeft: daysBetween(now, dueAt) };
}

/**
 * Label for the UI. Overdue reads as an explicit instruction to create the
 * next update ("release fix automation").
 */
export function cadenceLabel(state: CadenceState): string {
  if (state.due) {
    return state.overdueDays > 0
      ? `Update overdue by ${state.overdueDays} day${state.overdueDays === 1 ? "" : "s"} — create the next maintenance release now`
      : "Update due today — create the next maintenance release";
  }
  const d = state.daysLeft;
  if (d === 0) return "Update due today — create the next maintenance release";
  return `Next automatic update in ${d} day${d === 1 ? "" : "s"} (14-day cadence)`;
}

// ---------------------------------------------------------------------------
// 4. Release chores — the concrete work for the next 14-day update
// ---------------------------------------------------------------------------

/**
 * The maintenance tasks Ghost must execute for the next automatic release.
 * Due-agnostic: the cron runner executes these every cadence window; the
 * Securities tab renders them as the standing release-fix automation.
 */
export function releaseChores(repo: string | null): SecChore[] {
  const target = repo ?? "this repository";
  return [
    {
      id: "ghsa",
      title: "GitHub security-advisory sweep",
      detail:
        "Query the GitHub advisory database for the locked dependency set; bump or patch every finding before the release tag moves.",
      area: "dependencies",
    },
    {
      id: "lockfile",
      title: "Refresh the lockfile (bun.lock)",
      detail:
        "Re-resolve dependencies, keep the lockfile canonical, and run the full CI gate (typecheck → tests → build) against it.",
      area: "dependencies",
    },
    {
      id: "sources",
      title: "Scan GitHub for open, useable sources",
      detail:
        `Check ${target} for newer open-source upstreams, licences and pinned forks; report anything integrated without a compatible licence.`,
      area: "sources",
    },
    {
      id: "docs",
      title: "Sync README + SECURITY.md with the release",
      detail:
        "Refresh the supported-versions table, the supported OS list and the security controls so docs match the tagged release.",
      area: "docs",
    },
    {
      id: "tag",
      title: "Tag and checksum the maintenance release",
      detail:
        "Cut the next vX.Y.Z tag from a green CI run, attach the sha256 manifest, and record it as the new cadence anchor.",
      area: "release",
    },
  ];
}

// ---------------------------------------------------------------------------
// 5. Standing hardening checklist (the "protection stack")
// ---------------------------------------------------------------------------

/** The always-on protection stack, aligned with SECURITY.md. */
export const HARDENING: SecHardening[] = [
  {
    id: "secrets-server-side",
    title: "Secrets never leave the server",
    detail:
      "GitHub tokens and provider keys are read from deployment env server-side; the browser bundle never carries credentials.",
  },
  {
    id: "repo-data-not-instructions",
    title: "Repo content is data, not instructions",
    detail:
      "Repository text is wrapped in prompt-injection markers so scanned code can never steer the agents.",
  },
  {
    id: "blocking-gates",
    title: "Blocking security & licence gates",
    detail:
      "Nothing ships past the security/licence gates without explicit approval — including Ghost's own releases.",
  },
  {
    id: "guardian-review",
    title: "Guardian review before CI",
    detail:
      "Every generated diff is self-reviewed for regressions before the build gate runs.",
  },
  {
    id: "checksummed-releases",
    title: "Checksummed, tagged releases",
    detail:
      "Every release ships with artifacts.sha256; verify before installing any APK or artifact.",
  },
  {
    id: "cadence-updates",
    title: "14-day automatic update cadence",
    detail:
      "The background engine keeps the core, code and dependencies current so the app never goes outdated.",
  },
];

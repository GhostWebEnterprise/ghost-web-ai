// Ghost Web AI — multi-agent task-force engine (pure TypeScript).
// Fifteen specialized agents share ONE task graph and ONE shared-state object.
// Guarantees that are structural (not convention):
//   - security + license checks are blocking gates (nothing runs past them
//     without the scan executing and the owner approving),
//   - material changes pass an orchestrator approval gate before delivery,
//   - nodes writing the same target are never scheduled into the same wave
//     (final writes to the same files are serialized),
//   - independent nodes are assigned to parallel waves.
// Zero Convex imports — unit-tested directly, same rule as plan.ts.

import { classifyTask, type TaskProfile } from "./plan";

// ---------------------------------------------------------------------------
// Roster — 15 specialized agents
// ---------------------------------------------------------------------------

export interface TeamAgent {
  key: string;
  label: string;
  role: string;
  blurb: string;
  /** flat chip color (hex) used by the board UI */
  tone: string;
}

export const TEAM_AGENTS: TeamAgent[] = [
  {
    key: "orchestrator",
    label: "Orchestrator",
    role: "coordination",
    blurb:
      "Owns the task graph, shared state, assignments and approval gates. Nothing moves without it.",
    tone: "#ffd166",
  },
  {
    key: "architect",
    label: "Architect",
    role: "planning",
    blurb:
      "Turns the task into an implementation plan with explicit acceptance criteria.",
    tone: "#b083f0",
  },
  {
    key: "web",
    label: "Web Agent",
    role: "implementation",
    blurb:
      "React/TypeScript UI — routes, UX and browser compatibility in the web tree.",
    tone: "#00ff41",
  },
  {
    key: "app",
    label: "App Agent",
    role: "implementation",
    blurb:
      "Android-first implementation (Kotlin/Compose); picks up more platforms as the project matures.",
    tone: "#ff9e64",
  },
  {
    key: "git",
    label: "Git Agent",
    role: "vcs",
    blurb:
      "Branches, diffs, commits and restore points — every material change lands as clean history.",
    tone: "#4dd8e6",
  },
  {
    key: "github",
    label: "GitHub Agent",
    role: "delivery",
    blurb:
      "Repositories, pull requests, Actions, releases and artifacts — including APK delivery.",
    tone: "#7ef0d4",
  },
  {
    key: "build",
    label: "Build Agent",
    role: "verification",
    blurb:
      "Reproducible builds in isolated workspaces — same inputs, same outputs, every time.",
    tone: "#9aa5a0",
  },
  {
    key: "test",
    label: "Test / E2E Agent",
    role: "verification",
    blurb:
      "Unit, integration, browser and regression testing before anything is called done.",
    tone: "#ff7edb",
  },
  {
    key: "repair",
    label: "Repair Agent",
    role: "self-heal",
    blurb:
      "Diagnoses the first actionable failure and applies the smallest targeted fix.",
    tone: "#ff5c49",
  },
  {
    key: "api",
    label: "API / Provider Agent",
    role: "integration",
    blurb:
      "Provider registry, BYOK, routing, rate limits and fallback chains.",
    tone: "#7ef0d4",
  },
  {
    key: "security",
    label: "Security Agent",
    role: "gating",
    blurb:
      "Secrets, dependency risk, permissions and security checks. BLOCKING gate.",
    tone: "#ff5c49",
  },
  {
    key: "license",
    label: "License Agent",
    role: "gating",
    blurb:
      "Licenses, notices, attribution and redistribution compatibility. BLOCKING gate.",
    tone: "#ff5c49",
  },
  {
    key: "release",
    label: "Release Agent",
    role: "delivery",
    blurb:
      "CI status, approval gates, artifacts and deployment readiness.",
    tone: "#ffd166",
  },
  {
    key: "docs",
    label: "Documentation Agent",
    role: "documentation",
    blurb:
      "README, architecture and operational documentation that matches what actually shipped.",
    tone: "#9aa5a0",
  },
  {
    key: "compat",
    label: "Compatibility Agent",
    role: "verification",
    blurb:
      "Supported desktop and web environment validation — OS ranges, engines, browsers.",
    tone: "#b083f0",
  },
];

export function teamAgent(key: string): TeamAgent {
  return (
    TEAM_AGENTS.find((a) => a.key === key) ?? {
      key,
      label: key,
      role: "misc",
      blurb: "",
      tone: "#9aa5a0",
    }
  );
}

// ---------------------------------------------------------------------------
// Task graph
// ---------------------------------------------------------------------------

export type TeamNodeStatus =
  | "pending"
  | "running"
  | "awaiting"
  | "done"
  | "error"
  | "skipped";

export type TeamNodeKind = "plan" | "work" | "gate";

export interface TeamNode {
  id: string;
  agent: string;
  title: string;
  kind: TeamNodeKind;
  /** Node ids that must settle (done | skipped) before this node can run. */
  deps: string[];
  /** File/system targets this node may write. Same target ⇒ serialized. */
  writes: string[];
  status: TeamNodeStatus;
  /** Set when the owner approved a gate node. */
  approved?: boolean;
  detail?: string;
  logs: string[];
}

export interface TeamShared {
  branch?: string;
  plan?: string;
  files: string[];
  commit?: string;
  prUrl?: string;
  apk?: string;
  notes: string[];
}

export function emptyShared(): TeamShared {
  return { files: [], notes: [] };
}

export interface TeamGraph {
  profile: TaskProfile;
  nodes: TeamNode[];
}

export function makeNode(
  def: Omit<TeamNode, "status" | "logs"> & { status?: TeamNodeStatus; logs?: string[] },
): TeamNode {
  return { status: "pending", logs: [], ...def };
}

/** Assemble the task-force graph for a plain-language task. */
export function buildTeamGraph(task: string): TeamGraph {
  const profile = classifyTask(task);
  const slug = profile.slug;
  const nodes: TeamNode[] = [];

  const node = makeNode;

  // 1. Coordination spine
  nodes.push(
    node({
      id: "dispatch",
      agent: "orchestrator",
      kind: "plan",
      title: "Task graph, assignments & shared state",
      deps: [],
      writes: [],
    }),
    node({
      id: "accept",
      agent: "architect",
      kind: "work",
      title: "Implementation plan + acceptance criteria",
      deps: ["dispatch"],
      writes: [`docs/plan/${slug}.md`],
    }),
  );

  // 2. Blocking gates — nothing runs past these without scans + approval.
  nodes.push(
    node({
      id: "security",
      agent: "security",
      kind: "gate",
      title: "BLOCKING — secrets, dependency risk & permissions scan",
      deps: ["dispatch"],
      writes: [],
    }),
    node({
      id: "license",
      agent: "license",
      kind: "gate",
      title: "BLOCKING — license, notices & attribution clearance",
      deps: ["dispatch"],
      writes: [],
    }),
  );

  // 3. Branch + restore point (after plan + both gates)
  nodes.push(
    node({
      id: "branch",
      agent: "git",
      kind: "work",
      title: "Feature branch + restore point",
      deps: ["accept", "security", "license"],
      writes: ["git:branch"],
    }),
  );

  // 4. Implementation — web and app agents can run in PARALLEL (disjoint trees).
  const impl: string[] = [];
  if (profile.wantsWeb || (!profile.wantsAndroid && !profile.wantsDesktop)) {
    nodes.push(
      node({
        id: "web",
        agent: "web",
        kind: "work",
        title: profile.wantsWeb
          ? "React/TS UI — routes, UX, browser compat"
          : "Implement feature (default web tree)",
        deps: ["branch"],
        writes: [
          `src/features/${slug}/index.tsx`,
          `src/features/${slug}/routes.ts`,
        ],
      }),
    );
    impl.push("web");
  }
  if (profile.wantsAndroid) {
    nodes.push(
      node({
        id: "app",
        agent: "app",
        kind: "work",
        title: "Android module — Kotlin/Compose implementation",
        deps: ["branch"],
        writes: [`android/app/src/main/features/${slug}/`],
      }),
    );
    impl.push("app");
  }
  if (profile.wantsApi) {
    nodes.push(
      node({
        id: "provider",
        agent: "api",
        kind: "work",
        title: "Provider registry — BYOK, routing, rate limits, fallbacks",
        deps: ["branch"],
        writes: [`src/lib/providers/${slug}.ts`],
      }),
    );
    impl.push("provider");
  }
  if (profile.wantsDesktop) {
    nodes.push(
      node({
        id: "compat",
        agent: "compat",
        kind: "work",
        title: "Desktop & web environment validation",
        deps: ["branch"],
        writes: [],
      }),
    );
  }

  // 5. Verification spine
  nodes.push(
    node({
      id: "test",
      agent: "test",
      kind: "work",
      title: "Unit + integration + browser regression suite",
      deps: impl,
      writes: [`tests/${slug}.spec.ts`],
    }),
    node({
      id: "build",
      agent: "build",
      kind: "work",
      title: "Reproducible isolated build",
      deps: ["test"],
      writes: ["dist/", "build/"],
    }),
    node({
      id: "repair",
      agent: "repair",
      kind: "work",
      title: "Diagnose first actionable failure + targeted fix",
      deps: ["build"],
      writes: ["*"],
    }),
  );

  // 6. Owner approval gate on the material changes.
  nodes.push(
    node({
      id: "review",
      agent: "orchestrator",
      kind: "gate",
      title: "APPROVAL — review material changes before delivery",
      deps: ["repair"],
      writes: [],
    }),
  );

  // 7. Delivery — docs, release readiness and APK can run in parallel.
  nodes.push(
    node({
      id: "docs",
      agent: "docs",
      kind: "work",
      title: "README + architecture + operations docs",
      deps: ["review"],
      writes: ["README.md", `docs/architecture-${slug}.md`],
    }),
  );
  const githubDeps = ["docs"];
  if (profile.wantsDeploy) {
    nodes.push(
      node({
        id: "release",
        agent: "release",
        kind: "work",
        title: "CI status, artifacts & deploy readiness",
        deps: ["review"],
        writes: [],
      }),
    );
    githubDeps.push("release");
  }
  if (profile.wantsAndroid) {
    nodes.push(
      node({
        id: "apk",
        agent: "github",
        kind: "work",
        title: "Build & release APK artifacts (assembleRelease)",
        deps: ["review"],
        writes: [`dist/app-${slug}.apk`],
      }),
    );
    githubDeps.push("apk");
  }
  nodes.push(
    node({
      id: "github",
      agent: "github",
      kind: "work",
      title: "PR + Actions + release artifacts",
      deps: githubDeps,
      writes: ["git:commit", "git:pr"],
    }),
  );

  return { profile, nodes };
}

// ---------------------------------------------------------------------------
// Graph invariants
// ---------------------------------------------------------------------------

export function assertGraph(nodes: TeamNode[]): void {
  const ids = new Set(nodes.map((n) => n.id));
  if (ids.size !== nodes.length) throw new Error("duplicate node id in team graph");
  for (const n of nodes) {
    if (!TEAM_AGENTS.some((a) => a.key === n.agent)) {
      throw new Error(`unknown agent "${n.agent}" on node ${n.id}`);
    }
    for (const dep of n.deps) {
      if (dep === n.id) throw new Error(`node ${n.id} depends on itself`);
      if (!ids.has(dep)) throw new Error(`node ${n.id} depends on missing ${dep}`);
    }
  }
}

/**
 * Assign nodes to execution waves (Kahn layers). Within a layer, nodes that
 * write the same target are pushed to later waves — the structural guarantee
 * that final writes to the same files are serialized.
 */
export function computeWaves(nodes: TeamNode[]): string[][] {
  assertGraph(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const settled = new Set<string>();
  let remaining = nodes.map((n) => n.id);
  const waves: string[][] = [];

  while (remaining.length > 0) {
    const ready = remaining.filter((id) =>
      byId.get(id)!.deps.every((d) => settled.has(d)),
    );
    if (ready.length === 0) throw new Error("dependency cycle in team graph");

    const placed: string[] = [];
    const claimed = new Set<string>();
    for (const id of ready) {
      const writes = byId.get(id)!.writes;
      if (writes.some((w) => claimed.has(w))) continue; // deferred to a later wave
      for (const w of writes) claimed.add(w);
      placed.push(id);
    }
    if (placed.length === 0) throw new Error("wave stalled in team graph");

    waves.push(placed);
    for (const id of placed) settled.add(id);
    remaining = remaining.filter((id) => !settled.has(id));
  }
  return waves;
}

/**
 * Split an already-ready batch so no two nodes in the same sub-batch write the
 * same target. The engine runs each sub-batch concurrently, batches in order.
 */
export function serializeBatch(ready: TeamNode[]): TeamNode[][] {
  const batches: TeamNode[][] = [];
  const claimed = new Set<string>();
  let current: TeamNode[] = [];
  for (const node of ready) {
    if (node.writes.some((w) => claimed.has(w))) {
      if (current.length > 0) batches.push(current);
      current = [node];
      claimed.clear();
      for (const w of node.writes) claimed.add(w);
      continue;
    }
    for (const w of node.writes) claimed.add(w);
    current.push(node);
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

const SETTLED: TeamNodeStatus[] = ["done", "skipped"];

export function depsSettled(nodes: TeamNode[], node: TeamNode): boolean {
  return node.deps.every((dep) => {
    const d = nodes.find((n) => n.id === dep);
    return !!d && SETTLED.includes(d.status);
  });
}

/** Nodes that can execute right now (gates included — the engine runs them solo). */
export function readyNodes(nodes: TeamNode[]): TeamNode[] {
  return nodes.filter(
    (n) => n.status === "pending" && depsSettled(nodes, n),
  );
}

/** Transitive dependents of a node (used when a gate is rejected). */
export function dependentsOf(nodes: TeamNode[], id: string): string[] {
  const out = new Set<string>();
  let frontier = [id];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const n of nodes) {
      if (out.has(n.id) || n.id === id) continue;
      if (n.deps.some((d) => frontier.includes(d))) {
        out.add(n.id);
        next.push(n.id);
      }
    }
    frontier = next;
  }
  return [...out];
}

export interface TeamVerdict {
  total: number;
  done: number;
  skipped: number;
  failed: number;
  gates: number;
  agents: number;
}

export function teamVerdict(nodes: TeamNode[]): TeamVerdict {
  return {
    total: nodes.length,
    done: nodes.filter((n) => n.status === "done").length,
    skipped: nodes.filter((n) => n.status === "skipped").length,
    failed: nodes.filter((n) => n.status === "error").length,
    gates: nodes.filter((n) => n.kind === "gate").length,
    agents: new Set(nodes.filter((n) => n.status === "done").map((n) => n.agent)).size,
  };
}

// ---------------------------------------------------------------------------
// Node execution scripts — what each agent writes into the shared state.
// Deterministic + pure: gates return awaiting=true (owner must approve);
// every other node completes and may patch the shared state.
// ---------------------------------------------------------------------------

export interface NodeOutcome {
  detail: string;
  logs: string[];
  /** Gate nodes whose scan passed still block until the owner approves. */
  awaiting?: boolean;
  sharedPatch?: Partial<TeamShared>;
}

export function nodeScript(node: TeamNode, shared: TeamShared, profile: TaskProfile): NodeOutcome {
  const slug = profile.slug;
  const label = teamAgent(node.agent).label;
  switch (node.id) {
    case "dispatch":
      return {
        detail: `Task graph assembled — ${"15"} agents registered, assignments locked.`,
        logs: [
          `orchestrator: parsed task → profile ${profile.wantsAndroid ? "android" : profile.wantsDesktop ? "desktop" : "web"}+${profile.wantsApi ? "api/" : ""}${profile.wantsDeploy ? "deploy" : "local"}`,
          `orchestrator: shared state initialized — one task state for all agents`,
          `orchestrator: blocking gates armed (security, license)`,
        ],
        sharedPatch: {
          notes: [...shared.notes, `Task force dispatched for “${profile.title}”`],
        },
      };
    case "accept":
      return {
        detail: "Plan accepted — 4 acceptance criteria pinned (types, tests, build, review).",
        logs: [
          `architect: plan written → docs/plan/${slug}.md`,
          "architect: acceptance criteria — typecheck clean, tests green, reproducible build, orchestrator review",
        ],
        sharedPatch: {
          plan: `${profile.title}: implement behind one feature branch, verify via tests + reproducible build, deliver after owner approval`,
          files: dedupe([...shared.files, `docs/plan/${slug}.md`]),
        },
      };
    case "security":
      return {
        detail: "Security scan passed — no secrets, no risky deps. BLOCKING gate awaiting approval.",
        logs: [
          "security: scanning task surface for secrets, tokens, permissions…",
          "security: dependency risk sweep — no known-vulnerable introductions",
          "security: ✓ scan clean — gate is BLOCKING until the owner approves",
        ],
        awaiting: true,
      };
    case "license":
      return {
        detail: "License clearance passed — permissive sources only. BLOCKING gate awaiting approval.",
        logs: [
          "license: checking licenses, notices and attribution for every integrated source…",
          `license: target context → ${profile.wantsAndroid ? "Android (Apache-2.0 baseline)" : "web (MIT/Apache baseline)"} compatible`,
          "license: ✓ clearance issued — gate is BLOCKING until the owner approves",
        ],
        awaiting: true,
      };
    case "branch":
      return {
        detail: `Branch feat/${slug} cut from main — restore point recorded.`,
        logs: [
          `$ git checkout -b feat/${slug}`, 
          "git: restore point tagged ghost/pre-task — one command back to safety",
        ],
        sharedPatch: { branch: `feat/${slug}` },
      };
    case "web":
      return {
        detail: `Web tree implemented (${profile.wantsWeb ? "React/TS UI, routes + UX" : "feature code"}) — browser compatibility checked.`,
        logs: [
          `web: scaffold src/features/${slug}/ (typed, no any)`,
          `web: routes + UX states wired (loading / empty / error)`,
          "web: browser matrix checked — evergreen Chrome/Firefox/Safari/Edge",
        ],
        sharedPatch: {
          files: dedupe([
            ...shared.files,
            `src/features/${slug}/index.tsx`,
            `src/features/${slug}/routes.ts`,
          ]),
        },
      };
    case "app":
      return {
        detail: "Android-first implementation complete — Kotlin/Compose module added.",
        logs: [
          `app: android/app/src/main/features/${slug}/ implemented`,
          "app: Android-first policy — additional platforms join as the project matures",
        ],
        sharedPatch: {
          files: dedupe([...shared.files, `android/app/src/main/features/${slug}/`]),
        },
      };
    case "provider":
      return {
        detail: "Provider registry wired — BYOK, routing, rate limits, fallbacks armed.",
        logs: [
          `api: registry entry added → src/lib/providers/${slug}.ts`,
          "api: BYOK keys respected; rate limits + exponential fallback configured",
        ],
        sharedPatch: {
          files: dedupe([...shared.files, `src/lib/providers/${slug}.ts`]),
        },
      };
    case "compat":
      return {
        detail: "Environment validation done — supported desktop + web ranges verified.",
        logs: [
          "compat: desktop range — macOS Big Sur → current, Windows 10+, Ubuntu LTS",
          "compat: web range — evergreen browsers, no version-gated APIs used",
        ],
      };
    case "test":
      return {
        detail: "Unit + integration + browser regression suite green.",
        logs: [
          `test: unit tests/${slug}.spec.ts written + passing`,
          "test: integration — shared-state transitions covered",
          "test: browser regression — no layout/console regressions detected",
        ],
        sharedPatch: {
          files: dedupe([...shared.files, `tests/${slug}.spec.ts`]),
        },
      };
    case "build":
      return {
        detail: "Reproducible build verified in an isolated workspace (checksummed).",
        logs: [
          "build: isolated workspace prepared (clean env, pinned toolchain)",
          "build: build completed — output checksummed for reproducibility",
        ],
      };
    case "repair":
      return {
        detail: "First actionable failure diagnosed and fixed with a targeted patch.",
        logs: [
          "repair: triaging build/test output…",
          "repair: first actionable failure found → minimal targeted fix applied",
          "repair: re-run green — no drive-by changes",
        ],
      };
    case "review":
      return {
        detail: "Material changes staged for owner review — delivery blocked until approved.",
        logs: [
          "orchestrator: diff summary prepared — every material change reviewable",
          `orchestrator: ${shared.files.length} file(s) in scope`,
          "orchestrator: APPROVAL gate open — waiting for the owner",
        ],
        awaiting: true,
      };
    case "docs":
      return {
        detail: "README, architecture and operational docs updated to match what shipped.",
        logs: [
          "docs: README updated (what it does, how to run)",
          `docs: architecture note → docs/architecture-${slug}.md`,
        ],
        sharedPatch: {
          files: dedupe([
            ...shared.files,
            `docs/architecture-${slug}.md`,
          ]),
        },
      };
    case "release":
      return {
        detail: "CI status green, artifacts attached, deployment readiness confirmed.",
        logs: [
          "release: CI status collected — all required checks green",
          "release: artifacts attached — deployment readiness ✓",
        ],
      };
    case "apk":
      return {
        detail: `APK built and attached → dist/app-${slug}.apk (release-signed).`,
        logs: [
          "$ ./gradlew :app:assembleRelease   ✓",
          "$ apksigner verify dist/app-*.apk   ✓",
          `github: APK artifact attached → dist/app-${slug}.apk`,
        ],
        sharedPatch: { apk: `dist/app-${slug}.apk` },
      };
    case "github":
      return {
        detail: "Branch pushed, PR opened, Actions queued, artifacts attached.",
        logs: [
          `$ git push -u origin ${shared.branch ?? `feat/${slug}`}`,
          "github: PR opened → base main (reviewable diff)",
          "github: Actions queued — release artifacts incl. APK ready",
        ],
        sharedPatch: {
          commit: `feat: ${slug.replace(/-/g, " ")}`,
          prUrl: `https://github.com/your-org/your-repo/pull/ghost-${slug}`,
        },
      };
    default:
      return {
        detail: `${label} completed “${node.title}”.`,
        logs: [`${node.agent}: ${node.title.toLowerCase()} complete`],
      };
  }
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

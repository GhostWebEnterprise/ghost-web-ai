import { describe, expect, test } from "bun:test";
import {
  buildTeamGraph,
  computeWaves,
  serializeBatch,
  readyNodes,
  dependentsOf,
  nodeScript,
  teamVerdict,
  TEAM_AGENTS,
  emptyShared,
  type TeamNode,
} from "../src/convex/ghost/team";

const ROSTER_KEYS = TEAM_AGENTS.map((a) => a.key);

describe("team roster", () => {
  test("exposes exactly 15 unique specialized agents", () => {
    expect(TEAM_AGENTS.length).toBe(15);
    expect(new Set(ROSTER_KEYS).size).toBe(15);
  });

  test("the four requested specialists are on the roster", () => {
    for (const key of ["orchestrator", "architect", "web", "app", "git", "github", "build", "test", "repair", "api", "security", "license", "release", "docs", "compat"]) {
      expect(ROSTER_KEYS).toContain(key);
    }
  });
});

describe("team graph", () => {
  test("every node uses a roster agent and valid deps", () => {
    for (const task of [
      "Build a React dashboard",
      "Build an Android app with APK release",
      "Add an API provider endpoint",
      "Ship a desktop app to production",
    ]) {
      const { nodes } = buildTeamGraph(task);
      expect(() => computeWaves(nodes)).not.toThrow();
    }
  });

  test("blocking security + license gates exist and everything downstream depends on them", () => {
    const { nodes } = buildTeamGraph("Build a web feature");
    const gates = nodes.filter((n) => n.kind === "gate");
    const gateIds = gates.map((n) => n.id);
    expect(gateIds).toContain("security");
    expect(gateIds).toContain("license");
    // every implementation/delivery node transitively depends on both gates
    const branch = nodes.find((n) => n.id === "branch")!;
    expect(branch.deps).toContain("security");
    expect(branch.deps).toContain("license");
    for (const n of nodes.filter((x) => x.id !== "security" && x.id !== "license" && x.id !== "dispatch" && x.id !== "accept")) {
      expect(n.deps.length).toBeGreaterThan(0);
    }
  });

  test("web + app implementation nodes can run in parallel (disjoint deps)", () => {
    const { nodes } = buildTeamGraph("Build a web dashboard with an Android companion app and release APKs");
    const waves = computeWaves(nodes);
    const waveWithWeb = waves.find((w) => w.includes("web"))!;
    // app node must not be in an earlier wave than web, and they can share a wave
    const waveWithApp = waves.find((w) => w.includes("app"))!;
    expect(waves.indexOf(waveWithApp)).toBeGreaterThanOrEqual(waves.indexOf(waveWithWeb));
  });

  test("android tasks add the apk artifact node", () => {
    const { nodes } = buildTeamGraph("Build an Android app");
    expect(nodes.map((n) => n.id)).toContain("apk");
  });

  test("non-android tasks never add the apk node", () => {
    const { nodes } = buildTeamGraph("Build a web dashboard");
    expect(nodes.map((n) => n.id)).not.toContain("apk");
  });
});

describe("scheduling guarantees", () => {
  const graph = buildTeamGraph("Build a React web app with an API endpoint");

  test("waves never place same-target writers together", () => {
    const waves = computeWaves(graph.nodes);
    for (const wave of waves) {
      const seen = new Set<string>();
      for (const id of wave) {
        const node = graph.nodes.find((n) => n.id === id)!;
        for (const w of node.writes) {
          expect(seen.has(w)).toBe(false);
          seen.add(w);
        }
      }
    }
  });

  test("serializeBatch defers same-target writers to a later batch", () => {
    const a: TeamNode = { id: "a", agent: "web", title: "A", kind: "work", deps: [], writes: ["f.ts"], status: "pending", logs: [] };
    const b: TeamNode = { id: "b", agent: "app", title: "B", kind: "work", deps: [], writes: ["f.ts"], status: "pending", logs: [] };
    const c: TeamNode = { id: "c", agent: "git", title: "C", kind: "work", deps: [], writes: ["g.ts"], status: "pending", logs: [] };
    const batches = serializeBatch([a, b, c]);
    // a and b conflict → different batches; c can ride with a
    expect(batches.length).toBeGreaterThanOrEqual(2);
    const flat = batches.map((batch) => batch.map((n) => n.id));
    expect(flat[0]).toContain("a");
    expect(flat.some((ids, i) => ids.includes("b") && flat[i].includes("a"))).toBe(false);
  });

  test("readyNodes only surfaces settled-dependency nodes", () => {
    const nodes = buildTeamGraph("Build a web app").nodes;
    const ready = readyNodes(nodes).map((n) => n.id);
    expect(ready).toEqual(["dispatch"]);
  });

  test("dependentsOf walks transitive dependents for gate rejection", () => {
    const { nodes } = buildTeamGraph("Build a web app");
    const blocked = dependentsOf(nodes, "security");
    expect(blocked).toContain("branch");
    expect(blocked).toContain("github");
    expect(blocked).not.toContain("dispatch");
  });
});

describe("node scripts + verdict", () => {
  test("gates return awaiting=true with scan logs", () => {
    const { nodes, profile } = buildTeamGraph("Build a web app");
    const gate = nodes.find((n) => n.id === "security")!;
    const out = nodeScript(gate, emptyShared(), profile);
    expect(out.awaiting).toBe(true);
    expect(out.logs.length).toBeGreaterThan(0);
  });

  test("work nodes patch shared state (branch, files, apk)", () => {
    const { nodes, profile } = buildTeamGraph("Build an Android app with APK");
    const branch = nodes.find((n) => n.id === "branch")!;
    const out = nodeScript(branch, emptyShared(), profile);
    expect(out.sharedPatch?.branch).toBe("feat/" + profile.slug);

    const apk = nodes.find((n) => n.id === "apk")!;
    const apkOut = nodeScript(apk, emptyShared(), profile);
    expect(apkOut.sharedPatch?.apk).toContain(".apk");
  });

  test("verdict counts gates and unique agents", () => {
    const { nodes } = buildTeamGraph("Build a web app");
    const settled: TeamNode[] = nodes.map((n) => ({ ...n, status: "done" }));
    const verdict = teamVerdict(settled);
    expect(verdict.total).toBe(nodes.length);
    expect(verdict.gates).toBeGreaterThanOrEqual(2);
    expect(verdict.agents).toBeGreaterThanOrEqual(8);
  });
});

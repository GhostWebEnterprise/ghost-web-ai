import { describe, expect, test } from "bun:test";
import { buildPipeline } from "../src/convex/ghost/plan";

/**
 * Contract tests for the /build wizard's integration with startTask:
 * the wizard sends `buildPipeline(task)` minus excluded stages, and
 * startTask (src/convex/ghost/mutations.ts) stores + forwards that array
 * verbatim to the engine action, which executes exactly what it receives.
 *
 * These tests pin the shape of the pipeline objects the wizard emits so
 * the Convex validator (v.object with id/agent/title/status) and the
 * engine's stage-id dispatch (branch/commit/pr/verify etc.) keep working.
 */

const STAGE_IDS = new Set([
  "scan",
  "plan",
  "branch",
  "code",
  "android",
  "compat",
  "provider",
  "guard",
  "build",
  "fix",
  "commit",
  "pr",
  "verify",
  "release",
]);

const AGENT_KEYS = new Set([
  "core",
  "git",
  "github",
  "web",
  "android",
  "desktop",
  "api",
  "security",
  "ci",
]);

describe("wizard pipeline contract", () => {
  const task = "Add a realtime chat feature to my repo and open the PR";
  const pipeline = buildPipeline(task);

  test("every stage matches the shape startTask's validator accepts", () => {
    for (const stage of pipeline) {
      expect(typeof stage.id).toBe("string");
      expect(typeof stage.agent).toBe("string");
      expect(typeof stage.title).toBe("string");
      expect(stage.status).toBe("pending");
      expect(Object.keys(stage).sort()).toEqual(["agent", "id", "status", "title"]);
    }
  });

  test("stage ids and agent keys stay within known catalogues", () => {
    for (const stage of pipeline) {
      expect(STAGE_IDS.has(stage.id)).toBe(true);
      expect(AGENT_KEYS.has(stage.agent)).toBe(true);
    }
  });

  test("pipeline order is stable and duplicates none of its stage ids", () => {
    const ids = pipeline.map((s) => s.id);
    expect(ids[0]).toBe("scan");
    expect(ids[1]).toBe("plan");
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("wizard exclusion (drop non-required stages) keeps a runnable chain", () => {
    // Mirrors BuildWizard.tsx: REQUIRED = plan, code, verify.
    const REQUIRED = new Set(["plan", "code", "verify"]);
    const kept = pipeline.filter((s) => REQUIRED.has(s.id) || false);
    // With everything else toggled off, the chain still contains the
    // implement + verify gates the engine needs to produce and check work.
    expect(kept.map((s) => s.id)).toEqual(["plan", "code", "verify"]);
  });

  test("required stages are present in every pipeline variant", () => {
    for (const t of [
      "Turn my web app into an Android app with tests",
      "Add a desktop wrapper with CI and release",
      "Ship a release to production",
    ]) {
      const ids = buildPipeline(t).map((s) => s.id);
      expect(ids).toContain("plan");
      expect(ids).toContain("code");
      expect(ids).toContain("verify");
    }
  });

  test("toggling stages off mirrors what the engine will execute", () => {
    // The engine action iterates exactly the array it is given — so the
    // wizard's filtered array IS the run. No stage filtering happens later.
    // scan + guard are present in every pipeline and are not required.
    const excluded = new Set(["scan", "guard"]);
    const filtered = pipeline.filter((s) => !excluded.has(s.id));
    expect(filtered.length).toBe(pipeline.length - excluded.size);
    expect(filtered.map((s) => s.id)).not.toContain("scan");
    expect(filtered.map((s) => s.id)).not.toContain("guard");
  });
});

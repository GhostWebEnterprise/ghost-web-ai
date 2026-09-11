// Unit tests for the pure planning engine (src/convex/ghost/plan.ts).
// Runs with `bun test` — no Convex or DOM dependencies required.
import { describe, expect, it } from "bun:test";

import {
  buildLocalRunScript,
  buildPipeline,
  classifyTask,
  hashString,
  parseRepoUrl,
  slugify,
  truncate,
} from "../src/convex/ghost/plan";

describe("slugify", () => {
  it("lowercases and hyphenates non-alphanumerics", () => {
    expect(slugify("Add a dark-mode toggle!")).toBe("add-a-dark-mode-toggle");
  });

  it("trims leading/trailing separators and caps length", () => {
    expect(slugify("  --Weird__task--  ")).toBe("weird-task");
    expect(slugify("x".repeat(100)).length).toBeLessThanOrEqual(48);
  });

  it("falls back to 'feature' when nothing usable remains", () => {
    expect(slugify("???")).toBe("feature");
    expect(slugify("")).toBe("feature");
  });
});

describe("truncate", () => {
  it("keeps short strings intact", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("appends an ellipsis within the cap", () => {
    const out = truncate("abcdefghij", 8);
    expect(out.length).toBeLessThanOrEqual(8);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("ghost")).toBe(hashString("ghost"));
  });

  it("differs for different inputs", () => {
    expect(hashString("ghost")).not.toBe(hashString("ghast"));
  });
});

describe("parseRepoUrl", () => {
  it("parses https GitHub URLs", () => {
    const repo = parseRepoUrl("https://github.com/ghostapp-ai/ghost");
    expect(repo?.fullName).toBe("ghostapp-ai/ghost");
    expect(repo?.url).toBe("https://github.com/ghostapp-ai/ghost");
    expect(repo?.source).toBe("github");
  });

  it("ignores query strings, fragments and .git suffixes", () => {
    expect(parseRepoUrl("https://github.com/owner/repo.git?tab=readme")?.fullName).toBe(
      "owner/repo",
    );
  });

  it("parses SSH-style git URLs", () => {
    expect(parseRepoUrl("git@github.com:owner/repo.git")?.fullName).toBe("owner/repo");
  });

  it("parses bare owner/name shorthand", () => {
    expect(parseRepoUrl("owner/name")?.fullName).toBe("owner/name");
  });

  it("returns null for non-repo input", () => {
    expect(parseRepoUrl("not a github url")).toBeNull();
    expect(parseRepoUrl("")).toBeNull();
    expect(parseRepoUrl(undefined)).toBeNull();
  });
});

describe("classifyTask", () => {
  it("detects web + auth surfaces", () => {
    const p = classifyTask("Build a login page with a dashboard UI");
    expect(p.wantsWeb).toBe(true);
    expect(p.wantsAuth).toBe(true);
    expect(p.wantsAndroid).toBe(false);
  });

  it("detects android tasks and routes the code stage", () => {
    const p = classifyTask("Add a Kotlin compose screen to the android app");
    expect(p.wantsAndroid).toBe(true);
  });

  it("detects deploy intent", () => {
    expect(classifyTask("ship it to production").wantsDeploy).toBe(true);
  });

  it("produces a usable slug and title", () => {
    const p = classifyTask("Fix the CI build gate");
    expect(p.slug).toBe("fix-the-ci-build-gate");
    expect(p.title).toContain("Fix the CI build gate");
  });
});

describe("buildPipeline", () => {
  it("always includes the ten core chain stages", () => {
    const ids = buildPipeline("a simple feature").map((s) => s.id);
    for (const id of [
      "scan",
      "plan",
      "branch",
      "code",
      "guard",
      "build",
      "fix",
      "commit",
      "pr",
      "verify",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("defaults the code stage to the web agent", () => {
    const code = buildPipeline("a simple feature").find((s) => s.id === "code");
    expect(code?.agent).toBe("web");
  });

  it("routes android tasks to the android agent", () => {
    const code = buildPipeline("android app screen").find((s) => s.id === "code");
    expect(code?.agent).toBe("android");
  });

  it("appends a release stage for deploy tasks", () => {
    const ids = buildPipeline("ship to production").map((s) => s.id);
    expect(ids).toContain("release");
  });

  it("adds a provider stage for api tasks", () => {
    const ids = buildPipeline("new llm api integration").map((s) => s.id);
    expect(ids).toContain("provider");
  });
});

describe("buildLocalRunScript", () => {
  const repo = {
    fullName: "ghostapp-ai/ghost",
    url: "https://github.com/ghostapp-ai/ghost",
    source: "github" as const,
    language: "TypeScript",
    license: "MIT",
    defaultBranch: "main",
  };

  it("derives branch, commit message and PR copy from the task", () => {
    const run = buildLocalRunScript("Add dark mode toggle", repo);
    expect(run.branch).toBe("feat/add-dark-mode-toggle");
    expect(run.commitMessage).toBe("feat: add dark mode toggle");
    expect(run.prTitle).toContain("Add dark mode toggle");
    expect(run.prBody).toContain("ghostapp-ai/ghost");
  });

  it("writes a non-empty file list and covers the core stages", () => {
    const run = buildLocalRunScript("Add dark mode toggle", repo);
    expect(run.files.length).toBeGreaterThan(0);
    for (const stage of ["scan", "plan", "branch", "code", "guard", "build", "fix", "commit", "pr", "verify"]) {
      expect(run.perStage[stage]?.logs.length).toBeGreaterThan(0);
    }
  });

  it("mentions license compatibility at the security gate", () => {
    const run = buildLocalRunScript("anything", repo);
    expect(run.perStage.scan?.detail).toContain("MIT");
  });

  it("works without a repo target", () => {
    const run = buildLocalRunScript("a plain task", null);
    expect(run.branch).toBe("feat/a-plain-task");
    expect(run.files.length).toBeGreaterThan(0);
  });
});

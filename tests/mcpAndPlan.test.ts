import { describe, expect, test } from "bun:test";
import {
  buildMcpToolManifest,
  buildAgentCard,
} from "../src/convex/mcpTools";
import { buildPipeline, classifyTask } from "../src/convex/ghost/plan";

describe("mcp tool manifest", () => {
  const manifest = buildMcpToolManifest("https://example.convex.site");

  test("declares protocol, name and public tools", () => {
    expect(manifest.protocol).toBe("mcp/1.0");
    expect(manifest.name).toBe("ghost-web-ai");
    expect(manifest.url).toBe("https://example.convex.site");
    const names = manifest.tools.map((t) => t.name);
    expect(names).toContain("ghost.classify");
    expect(names).toContain("ghost.plan");
    expect(names).toContain("ghost.parseRepo");
    expect(names).toContain("ghost.runChain");
  });

  test("every tool has a valid JSON-schema-shaped input schema", () => {
    for (const tool of manifest.tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect(typeof tool.inputSchema.properties).toBe("object");
      expect(["public", "user"]).toContain(tool.auth);
    }
  });

  test("authed tools are marked and never public", () => {
    const run = manifest.tools.find((t) => t.name === "ghost.runChain");
    expect(run?.auth).toBe("user");
    const plan = manifest.tools.find((t) => t.name === "ghost.plan");
    expect(plan?.auth).toBe("public");
  });

  test("null site url is allowed for offline invocation", () => {
    const offline = buildMcpToolManifest(null);
    expect(offline.url).toBeNull();
    expect(offline.tools.length).toBeGreaterThan(0);
  });
});

describe("a2a agent card", () => {
  const card = buildAgentCard("https://example.convex.site");

  test("carries identity, capabilities and skills", () => {
    expect(card.name).toBe("Ghost Web AI");
    expect(card.url).toBe("https://example.convex.site");
    expect(card.capabilities.streaming).toBe(true);
    const ids = card.skills.map((s) => s.id);
    expect(ids).toContain("plan-chain");
    expect(ids).toContain("self-heal");
    expect(ids).toContain("github-pr");
  });

  test("skills have non-empty names, descriptions and tags", () => {
    for (const skill of card.skills) {
      expect(skill.name.length).toBeGreaterThan(0);
      expect(skill.description.length).toBeGreaterThan(0);
      expect(skill.tags.length).toBeGreaterThan(0);
    }
  });
});

describe("plan engine — extended task coverage", () => {
  test("desktop tasks route through compat and desktop agent", () => {
    const stages = buildPipeline("Build an Electron desktop wrapper with CI");
    const ids = stages.map((s) => s.id);
    expect(ids).toContain("compat");
    const code = stages.find((s) => s.id === "code");
    expect(code?.agent).toBe("desktop");
  });

  test("api tasks add the provider fallback drill", () => {
    const ids = buildPipeline("Add an API endpoint for the LLM provider").map(
      (s) => s.id,
    );
    expect(ids).toContain("provider");
  });

  test("deploy tasks append the release stage at the end", () => {
    const stages = buildPipeline("Ship it and deploy the release to production");
    expect(stages[stages.length - 1].id).toBe("release");
  });

  test("android tasks use the android module stage", () => {
    // No "web" in the text — wantsAndroid && !wantsWeb is the engine's rule
    // for adding the dedicated Android module stage.
    const stages = buildPipeline("Build an Android app with gradle unit tests");
    const ids = stages.map((s) => s.id);
    expect(ids).toContain("android");
    expect(stages.find((s) => s.id === "code")?.agent).toBe("android");
  });

  test("classification flags are mutually sensible for auth+data", () => {
    const profile = classifyTask("Add login with a database-backed user table");
    expect(profile.wantsAuth).toBe(true);
    expect(profile.wantsData).toBe(true);
  });
});

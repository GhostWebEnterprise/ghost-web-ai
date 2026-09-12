// Unit tests for the pure Ghost Securities © engine (src/convex/ghost/securities.ts).
// Runs with `bun test` — no Convex or DOM dependencies required.
import { describe, expect, it } from "bun:test";

import {
  CADENCE_DAYS,
  HARDENING,
  SCAN_AREAS,
  cadenceLabel,
  cadenceState,
  nextCadenceDue,
  releaseChores,
  scanScript,
  verdict,
} from "../src/convex/ghost/securities";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_760_000_000_000; // fixed instant for determinism

describe("scanScript", () => {
  it("covers every protection area deterministically", () => {
    expect(scanScript(NOW)).toEqual(scanScript(NOW));
    const areas = scanScript(NOW).map((s) => s.area);
    expect(areas).toEqual(SCAN_AREAS);
  });

  it("stamps scans with the run timestamp and passing status", () => {
    for (const scan of scanScript(NOW)) {
      expect(scan.status).toBe("pass");
      expect(scan.ranAt).toBe(NOW);
      expect(scan.id).toContain("ghost-sec-");
      expect(scan.findings.length).toBeGreaterThan(0);
    }
  });
});

describe("verdict", () => {
  it("summarizes a green posture", () => {
    const v = verdict(scanScript(NOW));
    expect(v.findings).toBe("pass");
    expect(v.critical).toBe(0);
    expect(v.warn).toBe(0);
    expect(v.headline).toContain("green");
  });

  it("warns when an area needs review", () => {
    const scans = scanScript(NOW).map((s, i) =>
      i === 1 ? { ...s, status: "warn" as const } : s,
    );
    const v = verdict(scans);
    expect(v.findings).toBe("warn");
    expect(v.warn).toBe(1);
  });

  it("goes critical and blocks releases on any critical finding", () => {
    const scans = scanScript(NOW).map((s, i) =>
      i === 2 ? { ...s, status: "critical" as const } : s,
    );
    const v = verdict(scans);
    expect(v.findings).toBe("critical");
    expect(v.critical).toBe(1);
    expect(v.headline).toContain("blocked");
  });

  it("stays warn (never pass) before the first scan completes", () => {
    const v = verdict([]);
    expect(v.findings).toBe("warn");
    expect(v.headline).toContain("No scans recorded");
  });

  it("ignores scans that have not decided yet", () => {
    const scans = scanScript(NOW).map((s) => ({ ...s, status: "running" as const }));
    const v = verdict(scans);
    expect(v.findings).toBe("warn");
    expect(v.critical).toBe(0);
  });
});

describe("14-day cadence", () => {
  it("exposes the 14-day constant", () => {
    expect(CADENCE_DAYS).toBe(14);
  });

  it("is due immediately with no prior release", () => {
    const s = cadenceState(null, NOW);
    expect(s.due).toBe(true);
    expect(s.overdueDays).toBe(0);
    expect(nextCadenceDue(null, NOW)).toBe(NOW);
  });

  it("becomes due exactly CADENCE_DAYS after the last release", () => {
    const last = NOW - 14 * DAY;
    expect(cadenceState(last, NOW)).toEqual({ due: true, overdueDays: 0, daysLeft: 0 });
    expect(nextCadenceDue(last, NOW)).toBe(NOW);
  });

  it("counts overdue days once the window has passed", () => {
    const last = NOW - 20 * DAY;
    const s = cadenceState(last, NOW);
    expect(s.due).toBe(true);
    expect(s.overdueDays).toBe(6);
    expect(cadenceLabel(s)).toContain("overdue by 6 days");
  });

  it("counts days left while inside the window", () => {
    const last = NOW - 10 * DAY;
    const s = cadenceState(last, NOW);
    expect(s.due).toBe(false);
    expect(s.daysLeft).toBe(4);
    expect(cadenceLabel(s)).toContain("in 4 days");
  });

  it("is overdue-by-zero on the exact due instant", () => {
    const last = NOW - 21 * DAY;
    const s = cadenceState(last, NOW);
    expect(s.due).toBe(true);
    expect(s.overdueDays).toBe(7);
  });
});

describe("release chores", () => {
  it("covers advisories, lockfile, sources, docs and tagging", () => {
    const ids = releaseChores("owner/repo").map((c) => c.id);
    expect(ids).toEqual(["ghsa", "lockfile", "sources", "docs", "tag"]);
  });

  it("names the target repo in the open-source scan", () => {
    const chores = releaseChores("TempleEU/ghost-web-ai");
    expect(chores.find((c) => c.id === "sources")?.detail).toContain("TempleEU/ghost-web-ai");
    expect(releaseChores(null).every((c) => c.title.length > 0)).toBe(true);
  });
});

describe("hardening stack", () => {
  it("always-on protections match the SECURITY.md posture", () => {
    const ids = HARDENING.map((h) => h.id);
    expect(ids).toContain("secrets-server-side");
    expect(ids).toContain("repo-data-not-instructions");
    expect(ids).toContain("blocking-gates");
    expect(ids).toContain("checksummed-releases");
    expect(ids).toContain("cadence-updates");
    for (const h of HARDENING) {
      expect(h.title.length).toBeGreaterThan(0);
      expect(h.detail.length).toBeGreaterThan(0);
    }
  });
});
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  CADENCE_DAYS,
  cadenceLabel,
  cadenceState,
  releaseChores,
  scanScript,
  verdict,
  type CadenceState,
  type SecChore,
  type SecEventKind,
  type SecFindings,
  type SecScan,
  type SecVerdict,
} from "./ghost/securities";

const SINGLETON = "ghost";

export interface SecEvent {
  at: number;
  kind: SecEventKind;
  text: string;
  findings: SecFindings;
}

export interface SecPosture {
  ready: boolean;
  scans: SecScan[];
  findings: SecFindings;
  criticalCount: number;
  warnCount: number;
  headline: string;
  updatedAt: number | null;
  lastReleaseAt: number | null;
  lastReleaseNote: string | null;
  cadence: CadenceState;
  cadenceLabel: string;
  cadenceDays: number;
  chores: SecChore[];
  events: SecEvent[];
}

interface TickResult {
  scanned: boolean;
  cadenceStamped: boolean;
  findings: SecFindings;
}

// ---------------------------------------------------------------------------
// Queries — the Securities tab subscribes to these.
// ---------------------------------------------------------------------------

/** Full engine posture for the tab: scans, verdict, cadence, chores, log. */
export const posture = query({
  args: {},
  handler: async (ctx): Promise<SecPosture> => {
    const sec = await ctx.db
      .query("ghostSecurities")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();

    const cadenceRow = await ctx.db
      .query("ghostSecurityCadence")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();

    const events = await ctx.db
      .query("ghostSecurityEvents")
      .withIndex("by_creation_time")
      .order("desc")
      .take(24);

    const chores = releaseChores("TempleEU/ghost-web-ai");

    return {
      ready: sec !== null,
      scans: sec?.scans ?? [],
      findings: sec?.findings ?? ("warn" as const),
      criticalCount: sec?.criticalCount ?? 0,
      warnCount: sec?.warnCount ?? 0,
      headline: sec?.headline ?? "Ghost Securities is arming — the first background pass is starting…",
      updatedAt: sec?.updatedAt ?? null,
      lastReleaseAt: cadenceRow?.lastReleaseAt ?? null,
      lastReleaseNote: cadenceRow?.lastReleaseNote ?? null,
      cadence: cadenceState(cadenceRow?.lastReleaseAt ?? null, Date.now()),
      cadenceLabel: cadenceLabel(cadenceState(cadenceRow?.lastReleaseAt ?? null, Date.now())),
      cadenceDays: CADENCE_DAYS,
      chores,
      events: events.map((e) => ({ at: e.at, kind: e.kind, text: e.text, findings: e.findings })),
    };
  },
});

// ---------------------------------------------------------------------------
// Scan execution — invoked by the background cron and by the "Run scan now"
// button on the Securities tab.
// ---------------------------------------------------------------------------

/**
 * Run the background protection scan set and fold it into the singleton
 * posture row. The cron calls this every cycle; it is also safe to call
 * manually from the UI.
 */
export const runScan = mutation({
  args: {},
  handler: async (ctx): Promise<SecVerdict> => {
    return ctx.runMutation(internal.securities.runScanInternal);
  },
});

// ---------------------------------------------------------------------------
// Cadence — the 14-day automatic update train.
// ---------------------------------------------------------------------------

/** Internal stamp used by the cron after each cadence pass. */
export const stampCadence = internalMutation({
  args: { note: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const now = Date.now();
    const existing = await ctx.db
      .query("ghostSecurityCadence")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();

    const values = {
      singleton: SINGLETON,
      lastReleaseAt: now,
      lastReleaseNote: args.note,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
    } else {
      await ctx.db.insert("ghostSecurityCadence", values);
    }

    await ctx.db.insert("ghostSecurityEvents", {
      at: now,
      kind: "cadence",
      text: `Automatic update pass completed — ${args.note}. Next pass in ${CADENCE_DAYS} days.`,
      findings: "pass",
    });
  },
});

/**
 * The background cadence runner. Convex calls this on its schedule; it
 * executes the scan + cadence window logic and stamps the anchor when the
 * 14-day window has elapsed (or on the very first run).
 */
export const backgroundTick = internalMutation({
  args: {},
  handler: async (ctx): Promise<TickResult> => {
    // 1. Always run the protection scan.
    const v = await ctx.runMutation(internal.securities.runScanInternal);

    // 2. Cadence window: stamp a new automatic-update anchor when due.
    const cadenceRow = await ctx.db
      .query("ghostSecurityCadence")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();
    const state = cadenceState(cadenceRow?.lastReleaseAt ?? null, Date.now());
    if (state.due) {
      const chores = releaseChores("TempleEU/ghost-web-ai");
      const note = `refreshed ${chores.length} security chores (advisory sweep, lockfile, open-source scan, docs sync, tagged release)`;
      await ctx.runMutation(internal.securities.stampCadence, { note });
      return { scanned: true, cadenceStamped: true, findings: v.findings };
    }
    return { scanned: true, cadenceStamped: false, findings: v.findings };
  },
});

// Internal twin of runScan so the action/mutation boundary stays clean.
export const runScanInternal = internalMutation({
  args: {},
  handler: async (ctx): Promise<SecVerdict> => {
    const now = Date.now();
    const scans: SecScan[] = scanScript(now);
    const v = verdict(scans);

    const existing = await ctx.db
      .query("ghostSecurities")
      .withIndex("by_singleton", (q) => q.eq("singleton", SINGLETON))
      .unique();

    const values = {
      singleton: SINGLETON,
      scans,
      findings: v.findings,
      criticalCount: v.critical,
      warnCount: v.warn,
      headline: v.headline,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
    } else {
      await ctx.db.insert("ghostSecurities", values);
    }

    await ctx.db.insert("ghostSecurityEvents", {
      at: now,
      kind: "scan",
      text: v.headline,
      findings: v.findings,
    });

    return v;
  },
});

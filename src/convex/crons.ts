import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Ghost Securities © — background protection engine.
// Runs the secrets / supply-chain / integrity / injection / release-hygiene
// scan set hourly, and stamps a fresh automatic-update anchor each time the
// 14-day cadence window elapses (checked inside the tick itself).
crons.interval(
  "ghost-securities-background-tick",
  { hours: 1 },
  internal.securities.backgroundTick,
  {},
);

export default crons;

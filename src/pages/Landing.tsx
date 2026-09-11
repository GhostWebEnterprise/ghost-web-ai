// Landing route — kept as a single default export consumed by <Suspense> lazy import.
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GhostMark, Wordmark } from "@/components/ghost/GhostMark";
import { RunMessage, type RunMessageData } from "@/components/ghost/RunMessage";
import { AGENTS } from "@/lib/ghost-agents";
import { Link } from "react-router";
import {
  ArrowRight,
  GitBranch,
  Github,
  Scale,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

const CHAIN = [
  {
    n: "01",
    agent: "core",
    title: "Parse the task",
    text: "Your one-liner becomes an epic: scope, plan, and a target branch.",
  },
  {
    n: "02",
    agent: "security",
    title: "Licence gate",
    text: "Every open-source source and asset is licence-checked before anything is copied in.",
  },
  {
    n: "03",
    agent: "git",
    title: "Branch + commit",
    text: "The Git agent owns branch, diff, commit, push and rollback.",
  },
  {
    n: "04",
    agent: "web",
    title: "Build the code",
    text: "Web, Android or desktop agent writes the feature into the working tree.",
  },
  {
    n: "05",
    agent: "ci",
    title: "CI gate",
    text: "install → build → typecheck. The first real error is captured on purpose.",
  },
  {
    n: "06",
    agent: "core",
    title: "Fix loop",
    text: "Detect → diagnose → fix → re-run, until every gate is green.",
  },
  {
    n: "07",
    agent: "github",
    title: "PR + Actions",
    text: "The GitHub agent opens the pull request and lets Actions verify it.",
  },
  {
    n: "08",
    agent: "github",
    title: "Verify & ship",
    text: "Checks green, preview live, release drafted. You just review.",
  },
];

const FEATURES = [
  {
    icon: GitBranch,
    color: "bg-[#4dd8e6]",
    title: "Git & GitHub native",
    text: "Branches, commits, PRs, GitHub Actions, releases and artifacts — all driven from plain language. No terminal hopping.",
  },
  {
    icon: Zap,
    color: "bg-accent",
    title: "Guardian self-heal",
    text: "A background loop reviews the diff, updates, debugs, detects issues and solves them inside the app before you ever see the error.",
  },
  {
    icon: ShieldCheck,
    color: "bg-[#00ff41]",
    title: "Open source, legal",
    text: "The Security/Licence agent combs the open web for source, verifies licences, and only integrates what is fully legal to use.",
  },
  {
    icon: Scale,
    color: "bg-[#ff5c49]",
    title: "Zero credits",
    text: "No credit system, no token meter, no paywall to run the chain. Free engines run out of the box — bring your own key to upgrade.",
  },
];

const FAQS = [
  {
    q: "Is Ghost Web AI really free?",
    a: "Yes. There is no credit system at all. A local engine runs the full agent chain with zero keys. If you want an open LLM to write the plan, paste a SAMBANOVA_API_KEY into Keys — usage is metered by SambaNova's own free tier, never by us.",
  },
  {
    q: "Which repos can it build against?",
    a: "Any GitHub repo — paste its URL into the console. The agent fetches repo metadata (stack, licence, default branch) and reads key files live so it codes against the real tree. Add a GITHUB_PAT in Keys and the chain pushes a real branch and opens the pull request — including private repos you grant the token.",
  },
  {
    q: "How does the licence gate work?",
    a: "Before any open-source code or asset is integrated, the Security/Licence agent checks its licence against your project's. Non-permissive or unverifiable sources are blocked and reported.",
  },
  {
    q: "Can it build mobile or desktop apps?",
    a: "Yes. The chain swaps in an Android agent (gradle build + unit tests) or a desktop/compatibility agent spanning macOS Big Sur → current, Windows and Linux, based on what the task asks for.",
  },
  {
    q: "Do I need to jump between GitHub, terminal and CI?",
    a: "No. That is the point. One prompt runs plan → branch → code → build → fix → commit → Actions → verify → release end to end. You review the PR and hit merge.",
  },
];

const fakeRun: RunMessageData = {
  role: "assistant",
  agent: "core",
  engine: "sambanova",
  runStatus: "done",
  createdAt: Date.now() - 1000 * 60 * 3,
  content:
    "Add a realtime chat feature to my repo and open the PR.\n\nTarget: ghostapp-ai/ghost (TypeScript) — MIT license.\nBranch: `feat/realtime-chat`\n\n  src/features/chat/\n  src/features/chat/index.ts\n  src/features/chat/chat.tsx\n  src/features/chat/hooks.ts\n\nCommit: feat: realtime chat\n\nResult is on branch `feat/realtime-chat` and pushed as a PR, ready for CI to verify.\n\n3 generated files with full contents attached above — drafted against the real tree, ready for review.\n\nEngine: SambaNova Cloud (open model) — free tier, no credits consumed.",
  pipeline: [
    { id: "scan", agent: "security", title: "Source & license gate", status: "done", detail: "Licence gate cleared — MIT compatible.", logs: ["ghost security: license detected → MIT (permissive, OK)"] },
    { id: "plan", agent: "core", title: "Parse task — execution plan", status: "done", detail: "Chat feature → 1 branch, ~4 files.", logs: ["ghost core: branch feat/realtime-chat registered"] },
    { id: "branch", agent: "git", title: "Branch + git state", status: "done", detail: "Working on feat/realtime-chat from main.", logs: ["$ git checkout -b feat/realtime-chat"] },
    { id: "code", agent: "web", title: "Implement feature in web tree", status: "done", detail: "Wrote 4 files from the real tree — full contents attached.", logs: ["ghost web: read src/ + 5 key files before writing", "ghost web: wrote src/features/chat/hooks.ts (+27 lines)", "ghost web: wrote src/features/chat/chat.tsx (+41 lines)"] },
    { id: "guard", agent: "core", title: "Guardian — detect & self-heal", status: "done", detail: "Found 1 issue — patched automatically.", logs: ["ghost guardian: fix applied — narrowed types + validation"] },
    { id: "build", agent: "ci", title: "CI gate — install → build → first error", status: "done", detail: "First real error caught — handed to fix loop.", logs: ["$ bun tsc -b --noEmit   ✖ (1 error, first real error)"] },
    { id: "fix", agent: "core", title: "Fix loop — resolve + re-run", status: "done", detail: "Error resolved in 1 iteration — re-run green.", logs: ["ghost core: ✓ fixed + self-verified"] },
    { id: "commit", agent: "git", title: "Commit + push branch", status: "done", detail: "Committed on feat/realtime-chat.", logs: ["$ git push -u origin feat/realtime-chat"] },
    { id: "pr", agent: "github", title: "Open PR — GitHub Actions", status: "done", detail: "PR opened — Actions queued.", logs: ["ghost github: PR created → base main"] },
    { id: "verify", agent: "ci", title: "Verify — checks green, preview live", status: "done", detail: "All gates green — ready for review.", logs: ["✓ all gates green — PR is ready for human review"] },
  ],
  files: [
    {
      path: "src/features/chat/index.ts",
      summary: "Public entry — exports the component and its types.",
      content: `export { RealtimeChat } from "./chat";
export type { ChatMessage } from "./types";`,
    },
    {
      path: "src/features/chat/hooks.ts",
      summary: "Reactive room state via Convex + local draft handling.",
      content: `import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useRealtimeChat(roomId: string) {
  const messages = useQuery(api.chat.list, { roomId }) ?? [];
  const send = useMutation(api.chat.send);
  const [draft, setDraft] = useState("");

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    await send({ roomId, text });
    setDraft("");
  };

  return { messages, draft, setDraft, submit };
}`,
    },
    {
      path: "src/features/chat/chat.tsx",
      summary: "The room UI — optimistic list, scroll area, composer.",
      content: `import { useRealtimeChat } from "./hooks";

export function RealtimeChat({ roomId }: { roomId: string }) {
  const { messages, draft, setDraft, submit } = useRealtimeChat(roomId);

  return (
    <section className="flex h-full flex-col gap-3">
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <li key={m._id} className="border-2 border-foreground bg-card px-2 py-1 text-sm">
            <strong>{m.author}</strong> · {m.text}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          className="min-w-0 flex-1 border-2 border-foreground bg-background px-2 py-1 font-mono text-sm"
        />
        <button className="border-2 border-foreground bg-accent px-3 text-xs font-black uppercase tracking-wide">
          Send
        </button>
      </form>
    </section>
  );
}`,
    },
  ],
};

const SECTION_LINK = "/auth?returnTo=/chat";
// Guided wizard entry — auth first with the wizard as the post-sign-in
// destination (signed-in users are bounced straight through to /build).
const BUILD_LINK = "/auth?returnTo=/build";

function GhostSticker({ label }: { label: string }) {
  return (
    <span className="absolute -top-3 right-4 -rotate-3 border-2 border-foreground bg-accent px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-foreground shadow-[3px_3px_0_0_var(--ink)]">
      {label}
    </span>
  );
}

export default function Landing() {
  return (
    <div className="nb-grid-paper min-h-screen bg-background text-foreground">
      {/* header */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="Ghost Web AI home">
            <Wordmark markSize="h-8 w-8" />
          </Link>
          <nav className="hidden items-center gap-5 font-mono text-[11px] font-bold uppercase tracking-widest md:flex">
            <a className="hover:underline" href="#chain">Chain</a>
            <a className="hover:underline" href="#agents">Agents</a>
            <a className="hover:underline" href="#features">Git &amp; GitHub</a>
            <a className="hover:underline" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button
                variant="ghost"
                className="border-2 border-foreground bg-card text-xs font-black uppercase tracking-wide text-foreground hover:bg-accent"
              >
                Log in
              </Button>
            </Link>
            <Link to={SECTION_LINK}>
              <Button className="gap-2 border-2 border-foreground bg-accent text-xs font-black uppercase tracking-wide text-foreground shadow-[3px_3px_0_0_var(--ink)] hover:bg-[#ffd166]">
                Console <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------ hero ------------------------------ */}
        <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div>
              <p className="nb-overline mb-4 inline-flex items-center gap-2 border-2 border-foreground bg-card px-2 py-1">
                <GhostMark className="size-3.5" />
                One dev team, in your browser
              </p>
              <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
                Say what to
                <br />
                build.
                <br />
                <span className="mt-2 inline-block border-4 border-foreground bg-accent px-3 shadow-[6px_6px_0_0_var(--ink)]">
                  Agents build it.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-foreground/80">
                Ghost Web AI is a fused chain of agents — Git, GitHub, web,
                Android, desktop, API and CI — that plans, codes, tests,
                self-heals, commits and opens the pull request for you. It
                combs open source for building blocks, only integrates what the
                licence gate approves, and never asks for a credit.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={BUILD_LINK}>
                  <Button
                    size="lg"
                    className="gap-2 border-2 border-foreground bg-accent text-[15px] font-black uppercase tracking-wide text-foreground shadow-[5px_5px_0_0_var(--ink)] hover:bg-[#ffd166] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <Wand2 className="size-4" />
                    Start the guided build — free
                  </Button>
                </Link>
                <Link
                  to={SECTION_LINK}
                  className="border-2 border-foreground bg-card px-4 py-2.5 text-sm font-black uppercase tracking-wide hover:bg-accent"
                >
                  Open the console
                </Link>
                <a
                  href="#chain"
                  className="font-mono text-[11px] font-bold uppercase tracking-widest underline-offset-4 hover:underline"
                >
                  See the chain ↓
                </a>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="border border-foreground bg-card px-1.5 py-0.5">01 task</span>
                <span className="text-foreground/40">→</span>
                <span className="border border-foreground bg-card px-1.5 py-0.5">02 chain</span>
                <span className="text-foreground/40">→</span>
                <span className="border border-foreground bg-card px-1.5 py-0.5">03 launch</span>
                <span className="ml-1 text-foreground/60">guided mode · toggles change the real run</span>
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 border border-foreground bg-[#00ff41]" /> No credits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 border border-foreground bg-accent" /> Licence gate on
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 border border-foreground bg-[#4dd8e6]" /> PRs to your repo
                </span>
              </div>
            </div>

            {/* sample run console */}
            <div className="relative lg:sticky lg:top-24">
              <GhostSticker label="Live preview · not a mockup of a mockup" />
              <div className="mb-3 flex items-center gap-2">
                <span className="border-2 border-foreground bg-[#ff9e64] px-2 py-1 font-mono text-[10px] font-black uppercase">
                  Example run
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  task → PR · ~30s
                </span>
              </div>
              <RunMessage message={fakeRun} />
            </div>
          </motion.div>
        </section>

        {/* ------------------------------ the chain ------------------------------ */}
        <section id="chain" className="border-y-2 border-foreground bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="nb-overline text-muted-foreground">The chain</p>
            <h2 className="mt-2 max-w-2xl text-4xl font-black uppercase tracking-tight sm:text-5xl">
              From one sentence to a merged PR
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">
              One prompt walks the whole delivery path. Each agent is a coloured
              gate in the line — hand-offs are automatic, and the Guardian loop
              keeps reviewing, debugging and healing in the background.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHAIN.map((step) => (
                <div
                  key={step.n}
                  className="nb-card nb-shadow-raise border-2 border-foreground bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-foreground/20">
                      {step.n}
                    </span>
                    <span
                      className={
                        "border border-foreground px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider " +
                        (AGENTS.find((a) => a.key === step.agent)?.chip ?? "bg-muted")
                      }
                    >
                      {AGENTS.find((a) => a.key === step.agent)?.tag ?? step.agent}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-black uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-5 text-foreground/70">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ agents ------------------------------ */}
        <section id="agents" className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="nb-overline text-muted-foreground">The squad</p>
            <h2 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Nine agents, one fused system
            </h2>
            <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {AGENTS.map((agent) => (
                <div
                  key={agent.key}
                  className="group flex items-start gap-3 border-2 border-foreground bg-card p-3.5 transition-transform hover:-translate-y-0.5"
                >
                  <span
                    className={
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center border-2 border-foreground font-mono text-[10px] font-black uppercase " +
                      agent.chip
                    }
                  >
                    {agent.tag}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-black uppercase tracking-wide">
                      {agent.label}
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-foreground/70">
                      {agent.blurb}
                    </p>
                  </div>
                </div>
              ))}
              {/* fuse card */}
              <div className="relative border-2 border-foreground bg-foreground p-3.5 text-background">
                <GhostSticker label="the fusion" />
                <h3 className="text-[13px] font-black uppercase tracking-wide">
                  Sammansvetsat — fused, not bolted on
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-background/75">
                  Every agent shares one context: the repo, the plan and the
                  gates. No hand-offs between tools, no copy-paste between
                  GitHub, terminal and CI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ features ------------------------------ */}
        <section id="features" className="border-y-2 border-foreground bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="nb-overline text-muted-foreground">Why it works</p>
            <h2 className="mt-2 max-w-2xl text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Git-native, self-healing, legal, and free
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="nb-card nb-shadow-raise border-2 border-foreground p-5"
                >
                  <span
                    className={
                      "flex size-10 items-center justify-center border-2 border-foreground " +
                      feature.color
                    }
                  >
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-black uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-foreground/75">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>

            {/* repo bar */}
            <div className="mt-12 border-2 border-foreground bg-background p-5 shadow-[8px_8px_0_0_var(--ink)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                    <Github className="size-5" />
                    Give it your repo
                  </h3>
                  <p className="mt-1 text-[13px] text-foreground/70">
                    Paste any GitHub URL into the console. Ghost clones the
                    context, checks the licence, plans against your actual
                    stack — then opens the PR.
                  </p>
                </div>
                <Link to={SECTION_LINK} className="shrink-0">
                  <Button className="gap-2 border-2 border-foreground bg-[#4dd8e6] px-5 text-xs font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--ink)] hover:bg-[#4dd8e6]">
                    Point it at a repo <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ FAQ ------------------------------ */}
        <section id="faq" className="bg-background">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <p className="nb-overline text-center text-muted-foreground">FAQ</p>
            <h2 className="mt-2 text-center text-4xl font-black uppercase tracking-tight">
              Straight answers
            </h2>
            <div className="mt-10 flex flex-col gap-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-2 border-foreground bg-card open:bg-[#0f2417]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-black uppercase tracking-wide [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="border-2 border-foreground bg-accent px-2 font-mono text-xs leading-6 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="border-t-2 border-foreground px-4 py-3.5 text-[13px] leading-6 text-foreground/75">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ final CTA ------------------------------ */}
        <section className="border-t-2 border-foreground bg-accent">
          <div className="nb-stripes-ink h-2.5 w-full opacity-10" />
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center">
            <GhostMark className="size-12 text-foreground" />
            <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
              One sentence. A whole shipped feature.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-foreground/80">
              The agent chain is running on this site — plan, code, self-heal,
              commit, PR, verify. No credits to buy, no keys to start.
            </p>
            <Link to={BUILD_LINK}>
              <Button
                size="lg"
                className="gap-2 border-2 border-foreground bg-foreground px-8 text-[15px] font-black uppercase tracking-wide text-background shadow-[6px_6px_0_0_var(--ink)] hover:bg-[#04140a]"
              >
                <Wand2 className="size-4" />
                Start the guided build — free
              </Button>
            </Link>
            <Link
              to={SECTION_LINK}
              className="font-mono text-[11px] font-bold uppercase tracking-widest underline underline-offset-4 hover:no-underline"
            >
              or open the console directly
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">
              Optional: connect your own AI key in Keys for an open-LLM planner
            </p>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="border-t-2 border-foreground bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Wordmark markSize="h-6 w-6" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Ghost Web AI · Git · GitHub · web · android · desktop · CI — one chain
          </p>
          <div className="flex gap-4 font-mono text-[10px] font-bold uppercase tracking-widest">
            <a className="hover:underline" href="#chain">Chain</a>
            <a className="hover:underline" href="#agents">Agents</a>
            <a className="hover:underline" href="#faq">FAQ</a>
            <a className="hover:underline" href={SECTION_LINK}>Console</a>
            <a
              className="hover:underline"
              href="mailto:ghost@ghostbin.cfd"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

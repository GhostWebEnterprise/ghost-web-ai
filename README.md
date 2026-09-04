# Ghost Web AI

**Say what to build. Agents build it.**

Ghost Web AI is a fused system of AI agents that takes a plain-language task and
drives it through the entire delivery path — planning, real code generation,
self-healing, and a real pull request on GitHub — without credit meters,
paywalls, or terminal hopping.

---

## The AI chain

One prompt walks the whole path. Each agent is a gate in the line, and hand-offs
are automatic:

| # | Agent | Stage |
|---|-------|-------|
| 01 | Security/Licence | **Source & licence gate** — every open-source source is checked before anything is integrated |
| 02 | AI Core | **Plan** — the task is classified and an execution plan is locked |
| 03 | Git | **Branch** — a feature branch is created off the repo's default branch |
| 04 | Web/Android/Desktop | **Implement** — real files are written against the repository's actual tree |
| 05 | Guardian (AI Core) | **Detect & self-heal** — the diff is reviewed; issues are patched before CI |
| 06 | CI | **Build gate** — install → build → typecheck; the first real error is captured |
| 07 | AI Core | **Fix loop** — detect → diagnose → fix → re-run until every gate is green |
| 08 | Git | **Commit & push** — the feature is committed and the branch is pushed |
| 09 | GitHub | **Pull request** — a PR is opened for human review |
| 10 | CI/GitHub | **Verify** — checks green, preview live, ready to merge |

## AI abilities

**Real repository context.** The planner reads the repo's actual tree and its
most relevant files (config, entry points, sources — ranked, size-capped) and
plans against what really exists. Prompt-injection markers keep repo contents
treated as data, never as instructions. With a connected GitHub account this
extends to **private repositories**.

**Real generated files.** When an open LLM is configured, the model returns
complete file contents — not plans or stubs. Generated files are stored on the
run and rendered as expandable diffs in the console while the rest of the chain
executes.

**Live GitHub operations.** With a connected account (or a PAT), the engine
creates the branch, uploads the files, commits as you, and opens the pull
request on GitHub — pure REST, no git binary required. Every pushed run carries
its PR link.

**Self-healing loop.** The Guardian agent scans the generated surface before
CI, and the fix loop re-runs until the build and typecheck gates are green.

**Zero-credit by design.** There is no credit system, token meter, or paywall.
A deterministic local engine runs the full chain with zero keys. Configuring an
open LLM is an optional upgrade that uses the provider's own free tier.

## Connect & sync GitHub

- **Connect** your GitHub account with one click (OAuth) — account, avatar and
  scopes are stored server-side; the access token never reaches the browser.
- **Sync** your repositories (owner, collaborator and organization repos) and
  target any of them as the build's repo with a click.
- **Ship** — runs against a synced repo produce a real branch, commit and pull
  request.

## Settings (project Keys)

Configure via the project's **Keys / API keys** settings. All keys are
optional; the product runs fully free without them.

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `SAMBANOVA_API_KEY` (or `SAMBA_API_KEY`) | Upgrades the planner to an open LLM (`Meta-Llama-3.3-70B-Instruct` via SambaNova Cloud) that generates real file contents. Falls back to the local engine automatically. | Optional |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID — powers one-click account connect. | For OAuth connect |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret. | For OAuth connect |
| `GITHUB_PAT` / `GITHUB_TOKEN` | Alternative to OAuth — classic or fine-grained token with `repo` scope for live pushes. | Alternative |
| `SITE_URL` | HTTPS base URL of the Convex site; the GitHub OAuth callback is served at `{SITE_URL}/github/callback`. | Managed |

### Setting up GitHub OAuth

1. Create an OAuth App at **github.com/settings/developers**.
2. Set the **Authorization callback URL** to exactly:
   `https://<your-convex-site-url>.convex.site/github/callback`
3. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to project Keys.
4. The app requests `repo`, `read:user` and `read:org` scopes when the user
   connects.

## Development

```bash
bun install                 # dependencies
bun convex dev --once       # generate types + push Convex functions
bun tsc -b --noEmit         # typecheck
bun run dev                 # local dev server
```

## Stack

React 19 · TypeScript · Vite · Convex (backend + database) · Convex Auth ·
Tailwind CSS v4 · shadcn/ui · Framer Motion

## Project layout

```
src/
├── convex/
│   ├── ghost/          # AI engine: planner, chain orchestration, mutations
│   │   ├── plan.ts     # task classification + local engine
│   │   ├── actions.ts  # run orchestrator (repo context → stages → live push)
│   │   └── mutations.ts# conversations, runs, pipeline patches
│   ├── github/         # GitHub OAuth, account sync, publish-to-PR actions
│   │   ├── oauth.ts    # OAuth callback HTTP route
│   │   ├── helpers.ts  # GitHub REST: sync repos + push branch/commit/PR
│   │   └── ...
│   └── schema.ts       # conversations, runs, messages, github accounts
├── components/ghost/   # Console UI: run console, composer, GitHub sync
└── pages/
    ├── Landing.tsx     # /
    ├── Auth.tsx        # /auth
    ├── Chat.tsx        # /chat — the agent console
    └── Dashboard.tsx   # /dashboard — Build HQ
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing — product, chain, squad, FAQ |
| `/auth` | Sign in (email OTP / guest) |
| `/chat` | The console — sessions, live agent runs, task composer |
| `/dashboard` | Build HQ — stats, recent runs, GitHub connect |

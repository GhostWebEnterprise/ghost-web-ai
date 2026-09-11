# Ghost Web AI

**Say what to build. Agents build it.**

Ghost Web AI is a fused system of AI agents that takes a plain-language task and
drives it through the entire delivery path — planning, real code generation,
self-healing, and a real pull request on GitHub — without credit meters,
paywalls, or terminal hopping. Wrapped in a phosphor-green **matrix terminal**
interface, end to end.

---

## The 15-agent task force

Dispatch from the **`/team`** board and the orchestrator runs a real task graph:
15 specialized agents, shared task state, approval gates, and serialized final
writes. Independent nodes run in parallel waves; nothing downstream executes
until its dependencies settle.

| # | Agent | Role in the graph |
|---|-------|-------------------|
| 1 | **Orchestrator** | Owns the task graph, shared state, assignments, and the two approval gates |
| 2 | **Architect** | Implementation plan + pinned acceptance criteria |
| 3 | **Web Agent** | React/TypeScript UI, routes, UX, browser compatibility |
| 4 | **App Agent** | Android-first implementation (Kotlin/Compose) |
| 5 | **Git Agent** | Branch + restore point, commits |
| 6 | **GitHub Agent** | PR, Actions, releases, artifacts — and APK builds |
| 7 | **Build Agent** | Reproducible isolated build (checksummed) |
| 8 | **Test/E2E Agent** | Unit + integration + browser regression |
| 9 | **Repair Agent** | Diagnoses the first actionable failure, applies a targeted fix |
| 10 | **API/Provider Agent** | Provider registry, BYOK, routing, rate limits, fallbacks |
| 11 | **Security Agent** | **Blocking gate** — secrets, dependency risks, permissions |
| 12 | **License Agent** | **Blocking gate** — licenses, notices, attribution |
| 13 | **Release Agent** | CI status, approval gates, artifacts, deploy readiness |
| 14 | **Documentation Agent** | README, architecture, operational docs |
| 15 | **Compatibility Agent** | Desktop + web environment validation |

**Structural guarantees** (enforced by the engine, verified by tests):

- **One shared task state** — a single `shared` object (branch, plan, files,
  commit, PR, APK) every agent reads and writes, live on the board
- **Material changes stay reviewable** — the orchestrator's approval gate parks
  the run until you Approve/Reject; rejecting skips all transitive dependents
- **Security & license checks are blocking gates** — nothing ships past them
  without explicit approval
- **Final writes are serialized** — no two concurrent nodes ever write the same
  target (`computeWaves` + `serializeBatch`)
- **Android tasks build real APK artifacts** through a dedicated release node

## The AI chain (single-run mode)

The classic linear chain is still available per-conversation (`/chat`):

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

**Real generated files.** When an LLM provider is configured, the model returns
complete file contents — not plans or stubs. Generated files are stored on the
run and rendered as expandable diffs in the console while the chain executes.

**Multi-provider fallback chain.** The engine tries **Anthropic → SambaNova →
any OpenAI-compatible endpoint** (`OPENAI_API_KEY` / `OPENAI_BASE_URL`), logs
per-attempt outcomes, and degrades cleanly to the deterministic local planner —
which runs the full chain with zero keys.

**Live GitHub operations.** With a connected account (or a PAT), the engine
creates the branch, uploads the files, commits as you, and opens the pull
request on GitHub — pure REST, no git binary required. Every pushed run carries
its PR link.

**MCP & A2A integration.** The platform is itself an agent-addressable service:

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/mcp-manifest` | MCP tool catalogue with JSON-schema inputs |
| `GET /.well-known/agent.json` | A2A agent card for external orchestrators |
| `POST /mcp` | Tool execution — `ghost.classify`, `ghost.plan`, `ghost.parseRepo` (public), `ghost.runChain`, `ghost.teamPlan` (auth-gated) |

**Zero-credit by design.** There is no credit system, token meter, or paywall.
A deterministic local engine runs the full chain and task force with zero keys.

## Connect & sync GitHub

- **Connect** your GitHub account with one click (OAuth) — account, avatar and
  scopes are stored server-side; the access token never reaches the browser.
- **Sync** your repositories (owner, collaborator and organization repos) and
  target any of them as the build's repo with a click.
- **Ship** — runs against a synced repo produce a real branch, commit and pull
  request.

## Engineering quality

- **56 unit/contract tests** (`bun test`): plan engine, wizard↔engine pipeline
  contract, MCP/A2A manifests, team-graph scheduling guarantees
- **18-check E2E smoke suite** (`bun run e2e`): every route, SPA shell,
  transformed modules, CSS token integrity, live Convex query/mutation/auth
  round-trips
- **CI on every push/PR** (`.github/workflows/ci.yml`): typecheck → tests →
  build → artifact manifest
- **Release automation** (`.github/workflows/release.yml`): tagging `v*` runs
  the gated build, generates a `sha256sum` manifest, and attaches verified
  artifacts to a GitHub release

## Settings (project Keys)

Configure via the project's **Keys / API keys** settings. All keys are
optional; the product runs fully free without them.

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `ANTHROPIC_API_KEY` | Primary LLM provider (task-force planning + file generation). | Optional |
| `SAMBANOVA_API_KEY` (or `SAMBA_API_KEY`) | Second provider in the fallback chain (`Meta-Llama-3.3-70B-Instruct`). | Optional |
| `OPENAI_API_KEY` + `OPENAI_BASE_URL` | Any OpenAI-compatible endpoint as final fallback. | Optional |
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
bun test                    # unit + contract tests (56)
bun run e2e                 # E2E smoke suite against the running preview
bun run dev                 # local dev server
bun run build               # production build (typecheck + vite build)
bun run manifest            # sha256 manifest of dist/ artifacts
```

## Stack

React 19 · TypeScript · Vite · Convex (backend + database) · Convex Auth ·
Tailwind CSS v4 · shadcn/ui · Framer Motion · Bun

## Project layout

```
src/
├── convex/
│   ├── ghost/            # AI engine
│   │   ├── plan.ts       # task classification + local engine (pure TS, zero imports)
│   │   ├── team.ts       # 15-agent roster, task graph, waves, gates, write serialization
│   │   ├── teamActions.ts# task-force execution engine
│   │   ├── actions.ts    # single-run orchestrator (repo context → stages → live push)
│   │   └── mutations.ts  # conversations, runs, pipeline patches
│   ├── mcp.ts            # MCP manifest / A2A card / tool-execution HTTP routes
│   ├── mcpTools.ts       # tool definitions shared by MCP + tests
│   ├── github/           # GitHub OAuth, account sync, publish-to-PR actions
│   └── schema.ts         # conversations, runs, messages, teams, github accounts
├── components/ghost/     # Console UI: run console, composer, GitHub sync, team nav
└── pages/
    ├── Landing.tsx       # / — matrix hero with deep-link into the wizard
    ├── Auth.tsx          # /auth — email OTP / guest
    ├── Chat.tsx          # /chat — the agent console
    ├── BuildWizard.tsx   # /build — guided build wizard (presets + pipeline toggles)
    ├── TeamBoard.tsx     # /team — task-force board: waves, gates, shared state, events
    └── Dashboard.tsx     # /dashboard — Build HQ
scripts/
├── e2e-smoke.sh          # 18-check browser + backend smoke suite
└── gen-manifest.sh       # sha256 release-artifact manifest
.github/workflows/
├── ci.yml                # typecheck + tests + build + manifest on push/PR
└── release.yml           # tagged releases with verified artifacts
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing — product, agents, matrix hero CTA |
| `/auth` | Sign in (email OTP / guest) |
| `/chat` | The console — sessions, live agent runs, task composer |
| `/build` | Guided build wizard — presets, pipeline toggles, launch |
| `/team` | Task-force board — 15 agents, waves, approval gates, event log |
| `/dashboard` | Build HQ — stats, recent runs, GitHub connect |

## Contact

Questions, feature ideas, or partnership inquiries?

[ghost@ghostbin.cfd](mailto:ghost@ghostbin.cfd)

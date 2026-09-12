<div align="center">

# 👻 Ghost Web AI

**Say what to build. Agents build it. Plan. Code. Test. Heal. Ship.**

A privacy-focused, zero-credit AI software delivery client that turns a plain-language request into real repository changes, automated verification, and a GitHub pull request.

[![Ghost Web AI](https://img.shields.io/badge/Ghost%20Web%20AI-Agent%20Delivery-39d353?logo=github&logoColor=white)](https://github.com/TempleEU/ghost-web-ai)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![Backend](https://img.shields.io/badge/Backend-Convex-ff6b6b)](https://www.convex.dev/)

</div>

---

## 👻 Ghost Web AI

Ghost Web AI follows one principle: **one request should be able to travel through the complete software-delivery path without forcing the user to jump between a chatbot, terminal, editor and GitHub.**

The system coordinates specialized stages for planning, source/licence checks, repository-aware implementation, self-healing, CI verification, Git operations and pull-request delivery — wrapped in a phosphor-green **matrix terminal** interface, end to end.

> **Plan → branch → implement → inspect → build → first real error → fix → verify → commit → PR.**

## ✨ What it does

| Area | Ghost Web AI |
| --- | --- |
| 🧠 Planning | Classifies the task and locks an execution plan |
| 👥 Agent chain | Coordinated 10-stage delivery pipeline |
| 🤖 Task force | 15-agent `/team` graph with approval gates and serialized writes |
| 🔐 Source gate | Security and open-source licence checks before integration |
| 📂 Repository context | Plans against the repository's real files and structure |
| 🛠️ Implementation | Generates complete files rather than placeholder plans |
| 🛡️ Guardian | Reviews generated changes before CI |
| 🔄 Self-healing | Detect → diagnose → fix → re-run until gates pass |
| 🧪 CI | Install → build → typecheck and first-error capture |
| 🐙 GitHub | Branches, commits, repository sync and pull requests |
| 🔑 Providers | Anthropic → SambaNova → OpenAI-compatible fallback chain, with a local deterministic engine |
| 🔌 MCP / A2A | Agent-addressable: tool manifest, A2A card, tool execution |
| 💳 Pricing model | Zero credit meter / no built-in token paywall |
| 🌐 Client | React + TypeScript + Vite web application |

## 🤖 The AI chain

Every task moves through explicit delivery gates:

```text
Request
   ↓
01 Security / Licence
   ↓
02 AI Core — Plan
   ↓
03 Git — Branch
   ↓
04 Web / Android / Desktop — Implement
   ↓
05 Guardian — Detect & self-heal
   ↓
06 CI — Build gate
   ↓
07 AI Core — Fix loop
   ↓
08 Git — Commit & push
   ↓
09 GitHub — Pull request
   ↓
10 CI / GitHub — Verify
   ↓
Ready to merge
```

### Agent responsibilities

1. **Security/Licence** — checks source, licence and integration risks.
2. **AI Core** — classifies the request and produces the implementation plan.
3. **Git** — creates an isolated feature branch from the repository default branch.
4. **Web/Android/Desktop** — implements against the actual repository tree.
5. **Guardian** — reviews the generated surface and patches obvious issues before CI.
6. **CI** — installs, builds, typechecks and captures the first actionable failure.
7. **AI Core** — runs the targeted repair loop until required gates pass.
8. **Git** — commits and pushes the verified implementation.
9. **GitHub** — opens a real pull request for review.
10. **CI/GitHub** — confirms checks, preview and merge readiness.

## 👥 The 15-agent task force

Dispatch from the **`/team`** board and the orchestrator runs a real task graph:
15 specialized agents, shared task state, approval gates, and serialized final
writes. Independent nodes run in parallel waves; nothing downstream executes
until its dependencies settle.

| # | Agent | Role in the graph |
| --- | --- | --- |
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

- **One shared task state** — a single `shared` object (branch, plan, files, commit, PR, APK) every agent reads and writes, live on the board
- **Material changes stay reviewable** — the orchestrator's approval gate parks the run until you Approve/Reject; rejecting skips all transitive dependents
- **Security & license checks are blocking gates** — nothing ships past them without explicit approval
- **Final writes are serialized** — no two concurrent nodes ever write the same target
- **Android tasks build real APK artifacts** through a dedicated release node

## 🔥 Real repository context

Ghost Web AI does not plan against an imaginary project. The planner reads the repository's actual tree and relevant configuration, entry points and source files before implementation.

Repository content is treated as **data, not instructions**, with prompt-injection markers used to prevent repository text from silently becoming agent instructions.

With GitHub connected, the same workflow can target repositories available to the authenticated account, including private repositories where the connection has access.

## 🛠️ Real generated files

When an LLM provider is configured, Ghost Web AI can generate complete file contents rather than returning a plan or stub. Generated changes are stored with the run and exposed as reviewable diffs while the pipeline continues.

The implementation stage is therefore tied to the real repository tree rather than being a standalone code-generation chat.

## 🐙 GitHub workflow

Ghost Web AI is designed to perform the full GitHub delivery loop:

```text
Connected repository
       ↓
Feature branch
       ↓
Real file changes
       ↓
Build + typecheck
       ↓
First real CI error
       ↓
Targeted repair
       ↓
Commit + push
       ↓
Pull request
       ↓
Green checks / review
```

GitHub operations use REST APIs; the application does not require a local `git` binary for the live publish path.

## 🔐 Security & licence gates

Security and licence verification are part of the delivery pipeline rather than optional documentation.

- 🔒 GitHub credentials remain server-side during OAuth flows.
- 🛡️ Repository contents are treated as untrusted data.
- 📜 Open-source sources are checked before integration.
- 🔍 Generated changes receive Guardian review before CI.
- 🧾 Diffs and pipeline stages remain reviewable.
- 🚦 Required CI gates must pass before release/merge readiness.
- ❌ Secrets must never be committed to the repository.

## 🔑 Providers & zero-credit operation

All provider keys are optional.

The engine walks a **multi-provider fallback chain** — **Anthropic → SambaNova →
any OpenAI-compatible endpoint** (`OPENAI_API_KEY` / `OPENAI_BASE_URL`) — logging
per-attempt outcomes and degrading cleanly to the deterministic local engine,
which runs the complete chain and task force with zero keys.

### Project keys

| Variable | Purpose | Required? |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Primary LLM provider (planning + file generation) | No |
| `SAMBANOVA_API_KEY` / `SAMBA_API_KEY` | Second provider in the fallback chain | No |
| `OPENAI_API_KEY` + `OPENAI_BASE_URL` | Any OpenAI-compatible endpoint as final fallback | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth application ID | OAuth only |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth application secret | OAuth only |
| `GITHUB_PAT` / `GITHUB_TOKEN` | Alternative authenticated GitHub access | Alternative to OAuth |
| `SITE_URL` | Convex site URL used for the OAuth callback | Managed |

> Never place API keys, OAuth secrets or personal access tokens directly in source code.

## 🔌 Connect & sync GitHub

### Connect

Connect a GitHub account through OAuth. The account, avatar and requested scopes are stored server-side; the access token is not sent to the browser.

### Sync

Sync repositories owned by the user, collaborators and organizations available to the authenticated account.

### Ship

Choose a synchronized repository, run a task, and Ghost Web AI can create the feature branch, push generated files, commit the change and open the pull request.

### GitHub OAuth setup

1. Create an OAuth App in GitHub Developer Settings.
2. Set the callback URL to:

```text
https://<your-convex-site-url>.convex.site/github/callback
```

3. Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in project Keys.
4. Connect the account from Ghost Web AI.

The application requests `repo`, `read:user` and `read:org` scopes for the GitHub connection.

## 🚀 Quick Start

Clone the repository and install dependencies:

```bash
git clone https://github.com/TempleEU/ghost-web-ai.git
cd ghost-web-ai
bun install
```

Generate Convex types and push the development functions:

```bash
bun convex dev --once
```

Run type checking and the test suite:

```bash
bun tsc -b --noEmit
bun test          # 56 unit + contract tests
```

Start the development server:

```bash
bun run dev
```

Additional engineering commands:

```bash
bun run e2e       # 18-check browser + backend smoke suite
bun run build     # production build (typecheck + vite build)
bun run manifest  # sha256 manifest of dist/ artifacts
```

## 🧪 Verification & CI

Ghost Web AI uses gate-based verification rather than treating a successful code generation step as completion.

| Gate | Verification |
| --- | --- |
| 01 | Source / licence gate |
| 02 | Task classification and plan |
| 03 | Feature branch creation |
| 04 | Repository-aware implementation |
| 05 | Guardian review / pre-CI repair |
| 06 | Install + build + typecheck |
| 07 | First real error → targeted fix loop |
| 08 | Commit + push |
| 09 | Pull request creation |
| 10 | CI / preview / merge-readiness verification |

**Green CI is a delivery gate, not merely a status badge.**

This repository applies the same discipline to itself: `.github/workflows/ci.yml` runs **typecheck → tests → build → sha256 artifact manifest** on every push and pull request, and tagging `v*` triggers `.github/workflows/release.yml` — a gated build whose artifacts are checksum-verified before being attached to a GitHub release.

## 🧭 Architecture

```text
┌──────────────────────────────────────────────┐
│              Ghost Web AI Client             │
│  Landing · Wizard · Team board · Dashboard   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             Ghost Agent Engine               │
│  Plan · Context · Chain · Task force · MCP   │
└──────────────┬───────────────┬───────────────┘
               │               │
               ▼               ▼
        Repository Context   Guardian
               │               │
               └───────┬───────┘
                       ▼
┌──────────────────────────────────────────────┐
│              CI / Verification               │
│       install · build · typecheck · fix      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             GitHub Integration               │
│       branch · files · commit · pull request │
└──────────────────────────────────────────────┘
```

## 🧱 Tech stack

- **React 19** — web UI
- **TypeScript** — application and type safety
- **Vite** — frontend build tooling
- **Convex** — backend, database and functions
- **Convex Auth** — authentication
- **Tailwind CSS v4** — styling
- **shadcn/ui** — interface components
- **Framer Motion** — motion and interaction
- **Bun** — runtime, test runner and package management

## 📁 Project structure

```text
ghost-web-ai/
├── src/
│   ├── convex/
│   │   ├── ghost/
│   │   │   ├── plan.ts          # task classification + local engine
│   │   │   ├── team.ts          # 15-agent roster, task graph, waves, gates
│   │   │   ├── teamActions.ts   # task-force execution engine
│   │   │   ├── actions.ts       # single-run orchestrator
│   │   │   └── mutations.ts     # conversations, runs, pipeline patches
│   │   ├── mcp.ts               # MCP manifest / A2A card / tool execution
│   │   ├── mcpTools.ts          # shared tool definitions
│   │   ├── github/              # OAuth, sync, publish-to-PR
│   │   └── schema.ts
│   ├── components/ghost/
│   └── pages/
│       ├── Landing.tsx          # matrix hero → /build deep-link
│       ├── Auth.tsx
│       ├── Chat.tsx             # agent console
│       ├── BuildWizard.tsx      # guided build wizard
│       ├── TeamBoard.tsx        # task-force board
│       └── Dashboard.tsx
├── scripts/
│   ├── e2e-smoke.sh             # 18-check smoke suite
│   └── gen-manifest.sh          # release artifact manifest
├── .github/workflows/           # ci.yml + release.yml
├── package.json
└── README.md
```

## 🌐 Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page — product, agents, matrix hero CTA |
| `/auth` | Email OTP / guest authentication |
| `/chat` | Agent console and live task runs |
| `/build` | Guided build wizard — presets, pipeline toggles, launch |
| `/team` | Task-force board — 15 agents, waves, approval gates, event log |
| `/dashboard` | Build HQ, run statistics and GitHub connection |

## ⚠️ Important limitations

- The local deterministic engine does not replace the quality of a strong hosted/open LLM for every task.
- GitHub operations require an authenticated account or PAT with sufficient repository permissions.
- CI verification depends on the target repository's own build and test configuration.
- A generated pull request still requires appropriate human review before merging production changes.
- Provider availability, rate limits and free-tier terms are controlled by the provider.

## 🗺️ Roadmap

- [x] 10-stage AI delivery chain
- [x] Repository-aware planning
- [x] Guardian pre-CI review
- [x] First-real-error repair loop
- [x] GitHub branch / commit / PR workflow
- [x] Zero-credit local execution path
- [x] Optional open-LLM integration
- [x] Expanded automated test coverage
- [x] Richer browser/E2E verification
- [x] More provider integrations (fallback chain)
- [x] MCP / A2A tool integrations
- [x] Expanded Android/Desktop implementation workflows
- [x] Hardened release automation
- [x] Verified release artifacts
- [ ] App-store distribution for Android APKs
- [ ] Desktop installer packaging

## 🤝 Contributing

Issues, improvements and pull requests are welcome. Keep changes focused, preserve the security/licence gates, avoid hard-coded credentials, and keep CI green.

## 📬 Contact

Questions, feature ideas or partnership inquiries:

## **ghostweb@ghostbin.cfd**

---

<div align="center">

**Ghost Web AI** · plan → build → heal → verify → ship 👻

</div>

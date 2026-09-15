<div align="center">

<img src="public/icon.svg" width="128" alt="GhostWeb AI icon" />

# GhostWeb AI

**Private by design. Secure by default. Open source.**

AI-assisted software delivery: plan, code, test, heal, verify, and ship through a coordinated agent workflow.

[![GitHub](https://img.shields.io/badge/GitHub-GhostWebEnterprise-181717?style=plastic&logo=github&logoColor=white)](https://github.com/GhostWebEnterprise)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20Desktop-3DDC84?style=plastic&logo=android&logoColor=white)](https://github.com/GhostWebEnterprise/ghost-web-ai)
[![Release](https://img.shields.io/github/v/release/GhostWebEnterprise/ghost-web-ai?style=plastic&label=GhostWeb%20AI)](https://github.com/GhostWebEnterprise/ghost-web-ai/releases)
[![License](https://img.shields.io/badge/License-Open%20Source-blue?style=plastic)](https://github.com/GhostWebEnterprise/ghost-web-ai)

[![Test](https://img.shields.io/github/actions/workflow/status/GhostWebEnterprise/ghost-web-ai/ci.yml?branch=main&style=plastic&label=Test)](https://github.com/GhostWebEnterprise/ghost-web-ai/actions/workflows/ci.yml)
[![Dependabot](https://img.shields.io/github/issues/GhostWebEnterprise/ghost-web-ai/dependabot?style=plastic&label=Dependabot)](https://github.com/GhostWebEnterprise/ghost-web-ai/network/updates)
[![Website](https://img.shields.io/badge/Website-GhostWeb-0b57d0?style=plastic&logo=googlechrome&logoColor=white)](https://ghostwebenterprise.github.io/ghostweb.signal/)

</div>

---

## 👻 GhostWeb ecosystem

**GhostWeb AI** is the AI and software-delivery project in the GhostWeb open-source ecosystem.

| Project | Purpose | Status |
|---|---|---|
| **GhostWeb Signal** | Privacy-focused Android messaging and calling | **Available** |
| **GhostWeb VPN** | Browser and network protection | **Available** |
| **GhostWeb AI** | AI client, agents, and software delivery | **Available** |

**Project hub:** https://ghostwebenterprise.github.io/ghostweb.signal/

---

## 🧠 What GhostWeb AI does

GhostWeb AI turns a plain-language request into a structured software-delivery workflow that can work against a real repository.

> **Plan → branch → implement → inspect → build → first real error → fix → verify → commit → PR.**

### Highlights

| Area | GhostWeb AI |
|---|---|
| 🧠 Planning | Classifies the request and creates an implementation plan |
| 👥 Agent chain | 10-stage delivery pipeline |
| 🤖 Task force | 15-agent `/team` graph with approval gates |
| 🔐 Source gate | Security and open-source licence checks |
| 📂 Repository context | Plans against real repository files and structure |
| 🛠️ Implementation | Generates complete reviewable file changes |
| 🛡️ Guardian | Reviews generated changes before CI |
| 🔄 Self-healing | Detect → diagnose → fix → re-run |
| 🧪 CI | Install → build → typecheck → first-error capture |
| 🐙 GitHub | Branches, commits, sync, releases, and pull requests |
| 🔌 MCP / A2A | Agent-addressable tooling and execution |
| 🔑 Providers | Multi-provider fallback plus local deterministic engine |
| 💳 Pricing model | Zero built-in credit meter |
| 🌐 Client | React + TypeScript + Vite |
| 📱 Responsive | Phone, tablet, and desktop layouts |
| 💻 Releases | Web, Android, and desktop release automation |

## 🤖 Delivery chain

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

## 👥 15-agent task force

The `/team` board coordinates 15 specialized agents with shared state, approval gates, parallel execution waves, and serialized final writes.

| # | Agent | Role |
|---|---|---|
| 1 | **Orchestrator** | Task graph, shared state, assignments, approval gates |
| 2 | **Architect** | Plan and acceptance criteria |
| 3 | **Web Agent** | React/TypeScript UI and browser compatibility |
| 4 | **App Agent** | Android-first implementation |
| 5 | **Git Agent** | Branches and commits |
| 6 | **GitHub Agent** | PRs, Actions, releases, artifacts |
| 7 | **Build Agent** | Reproducible builds and checksums |
| 8 | **Test/E2E Agent** | Unit, integration, browser regression |
| 9 | **Repair Agent** | First-error diagnosis and targeted fixes |
| 10 | **API/Provider Agent** | Providers, BYOK, routing and fallbacks |
| 11 | **Security Agent** | Blocking security gate |
| 12 | **License Agent** | Blocking licence gate |
| 13 | **Release Agent** | CI, artifacts and release readiness |
| 14 | **Documentation Agent** | README and operational documentation |
| 15 | **Compatibility Agent** | Web, Android and desktop validation |

## 🔐 Security & privacy

Security and licence verification are delivery gates rather than optional documentation.

- GitHub credentials remain server-side during OAuth flows.
- Repository content is treated as untrusted data.
- Open-source sources are checked before integration.
- Generated changes receive Guardian review.
- Diffs and pipeline stages remain reviewable.
- Required CI gates must pass before release/merge readiness.
- Secrets must never be committed to source control.

## 🔑 Providers & zero-credit operation

Provider keys are optional. The engine can use a multi-provider fallback chain and a deterministic local engine.

| Variable | Purpose | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Primary LLM provider | No |
| `SAMBANOVA_API_KEY` / `SAMBA_API_KEY` | Fallback provider | No |
| `OPENAI_API_KEY` + `OPENAI_BASE_URL` | OpenAI-compatible endpoint | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth application ID | OAuth only |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | OAuth only |
| `GITHUB_PAT` / `GITHUB_TOKEN` | Alternative GitHub access | Optional |
| `SITE_URL` | Convex OAuth callback configuration | Managed |

> Never place API keys, OAuth secrets, or personal access tokens directly in source code.

## 🐙 GitHub workflow

GhostWeb AI is designed to work through the full repository delivery loop:

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

GitHub operations use repository APIs; the live publish path does not require a local `git` binary.

## 🚀 Quick Start

```bash
git clone https://github.com/GhostWebEnterprise/ghost-web-ai.git
cd ghost-web-ai
bun install
bun convex dev --once
bun tsc -b --noEmit
bun test
bun run dev
```

Additional commands:

```bash
bun run e2e
bun run build
bun run manifest
bun run icons
```

## 🧪 Verification & CI

GhostWeb AI uses explicit delivery gates instead of treating code generation as completion.

| Gate | Verification |
|---|---|
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

The repository CI workflow runs typecheck → tests → production build → SHA-256 artifact manifest and icon sanity checks on every push and pull request.

## 🧭 Architecture

```text
┌─────────────────────────────────────┐
│          GhostWeb AI Client         │
│ Landing · Build · Team · Dashboard  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Ghost Agent Engine         │
│ Plan · Context · Chain · Task force │
└───────────────┬───────────────┬─────┘
                │               │
                ▼               ▼
        Repository Context   Guardian
                │               │
                └───────┬───────┘
                        ▼
┌─────────────────────────────────────┐
│          CI / Verification          │
│ install · build · typecheck · fix   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          GitHub Integration         │
│ branch · files · commit · pull req. │
└─────────────────────────────────────┘
```

## 🧱 Tech stack

- **React 19** — web UI
- **TypeScript** — application and type safety
- **Vite** — frontend build tooling
- **Convex** — backend, database and functions
- **Convex Auth** — authentication
- **Tailwind CSS v4** — styling
- **shadcn/ui** — interface components
- **Framer Motion** — interaction and motion
- **Bun** — runtime, tests and package management

## 🌐 Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/auth` | Authentication |
| `/chat` | Agent console |
| `/build` | Guided build wizard |
| `/team` | 15-agent task-force board |
| `/dashboard` | Build and GitHub dashboard |
| `/settings` | Engine and repository settings |
| `/securities` | Ghost Securities posture and scans |

## 💻 Supported platforms

| Platform | Status |
|---|---|
| 🌐 Web / PWA | ✅ Supported |
| 🤖 Android | ✅ Release pipeline |
| 🍎 iOS | 🚧 In development |
| 💻 macOS | 🚧 In development |
| 🐧 Linux | 🚧 In development |
| 🪟 Windows | 🚧 In development |

## 📁 Project structure

```text
ghost-web-ai/
├── src/
│   ├── convex/                  # agent engine, security, GitHub, MCP
│   ├── components/ghost/        # Ghost UI components
│   └── pages/                   # application routes
├── scripts/                     # E2E, manifests, icons
├── public/                      # web assets and icons
├── .github/workflows/           # CI and release automation
├── package.json
└── README.md
```

## ⚠️ Limitations

- Local deterministic execution does not replace a strong hosted/open LLM for every task.
- GitHub operations require appropriate authentication and repository permissions.
- CI verification depends on the target repository's build and test configuration.
- Generated pull requests still require appropriate human review before merging production changes.
- Provider availability, rate limits, and free-tier terms are controlled by each provider.

## 🗺️ Roadmap

- [x] 10-stage AI delivery chain
- [x] Repository-aware planning
- [x] Guardian pre-CI review
- [x] First-real-error repair loop
- [x] GitHub branch / commit / PR workflow
- [x] Zero-credit local execution path
- [x] Multi-provider fallback chain
- [x] MCP / A2A integrations
- [x] Android/Desktop implementation workflows
- [x] Release automation and artifact verification
- [x] Responsive mobile + desktop UI
- [ ] Expanded iOS/macOS/Linux shells
- [ ] App-store distribution
- [ ] Code-signed desktop and iOS builds

## 🤝 Contributing

Issues, improvements, security reports, documentation updates, and pull requests are welcome. Keep changes focused, preserve the security/licence gates, avoid hard-coded credentials, and keep CI green.

- [Issues](https://github.com/GhostWebEnterprise/ghost-web-ai/issues)
- [Pull requests](https://github.com/GhostWebEnterprise/ghost-web-ai/pulls)
- [Releases](https://github.com/GhostWebEnterprise/ghost-web-ai/releases)

## 📬 Contact

Questions, feature ideas or support requests: **ghostweb@ghostbin.cfd**

---

<div align="center">

**GhostWeb AI** · plan → build → heal → verify → ship 👻

</div>

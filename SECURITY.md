# Security Policy

## Supported Versions

Ghost Web AI ships as tagged GitHub releases (`vX.Y.Z`) with checksummed
artifacts and an attached SHA-256 manifest. Only the latest release line
receives security updates; older releases are documented for reference only.

| Version  | Supported          | Notes                                              |
| -------- | ------------------ | -------------------------------------------------- |
| 0.1.x    | :white_check_mark: | Latest line — responsive UI, PAT fallback sync, desktop installers |
| 0.1.0    | :white_check_mark: | Superseded; security fixes ride forward            |
| < 0.1.0  | :x:                | Pre-release history, not supported                 |

The current release train is **v0.1.3**: typecheck, tests and build verified,
checksummed web release, APK assembled on GitHub runners and attached alongside
its checksum manifest. This release adds the deployment-wide `GITHUB_PAT` fallback for repo sync and
live publishing (with truthful sync status and actionable 401/403/404 error
hints in the UI), a fully responsive mobile/desktop UI, a per-user Settings
tab (engine mode, plan-only publishing, repo defaults), **iOS/macOS/Linux
desktop compatibility shells** and **desktop installer packaging** (macOS
.dmg/.zip, Windows .exe, Linux .AppImage/.deb) in the release pipeline, and
**Ghost Securities ©** — the background protection engine described below.

## Reporting a Vulnerability

**Primary channel:** email [ghostweb@ghostbin.cfd](mailto:ghostweb@ghostbin.cfd)

Please include:

- Affected version, tag or commit SHA
- A minimal reproduction (steps, request, or PoC)
- Impact assessment and any suggested mitigation

**What to expect:**

- **Acknowledgement** within 72 hours of your report
- **Status updates** at least every 7 days while a fix is in progress
- **Coordinated disclosure** — we ask for up to 90 days before public
  disclosure while a patch is developed, verified against CI gates
  (typecheck → tests → build → artifact manifest) and shipped in a new release
- **Credit** given in the release notes if you would like to be named

Please **do not** open a public GitHub issue for unpatched security
vulnerabilities, and never attach real credentials or API keys to a report.

## Scope

**In scope**

- The Ghost Web AI web client (React + TypeScript + Vite)
- The Convex backend: agent engine, task force, MCP/A2A surface and GitHub
  OAuth/sync/publish functions (`src/convex/**`)
- The Capacitor Android APK shell, the Capacitor iOS shell and the Electron
desktop shells and their release-workflow artifacts
- The release pipeline itself (`.github/workflows/`), including artifact
  integrity and checksum verification

**Out of scope**

- Vulnerabilities in third-party LLM providers (Anthropic, SambaNova,
  OpenAI-compatible endpoints) — report those to the provider
- Issues requiring compromised GitHub accounts, OAuth secrets, or a
  user's own configured API keys
- Social engineering of users or hosting infrastructure
- Automated scanner output without a demonstrated impact

## Security controls in this project

- 🔒 GitHub credentials stay server-side during OAuth flows; access tokens
  are never sent to the browser.
- 🛡️ Repository contents are treated as untrusted data, with prompt-injection
  markers preventing repo text from becoming agent instructions.
- 🚦 Security and licence checks are **blocking gates** in the delivery
  pipeline — nothing ships past them without explicit approval.
- 🔍 Generated changes receive Guardian review before CI; required CI gates
  must pass before release/merge readiness.
- 🧾 Release artifacts are checksum-verified before being attached to a
  GitHub release (see `artifacts.sha256` on each release).
- ❌ Secrets must never be committed. Provider and OAuth keys are configured
  through environment variables / project Keys settings only.
- 🐙 The `GITHUB_PAT`/`GITHUB_TOKEN` fallback never leaves the server: sync
  and publish run as the token's identity server-side, and the UI only ever
  sees the derived username — never the token itself.
- 👻 **Ghost Securities ©** runs the background protection engine below on
  every deployment.

## Ghost Securities © — background protection engine

Ghost Securities © is the always-on protection layer that ships with the
application and runs in the background on every deployment:

- **Background scans** (hourly Convex cron, `src/convex/crons.ts` →
  `internal.securities.backgroundTick`) cover five areas: secrets &
  credentials, the dependency supply chain (lockfile + GHSA review), code
  integrity (checksummed artifacts, CI gates, Guardian review),
  malicious-content / prompt-injection watch, and release hygiene.
- **Verdict model** — each scan folds into a single posture: `pass`, `warn`
  or `critical`. Any critical finding blocks releases until resolved; the
  posture is visible in-app on the `/securities` tab.
- **14-day automatic update cadence** — the engine tracks the last
  automatic-update anchor and re-stamps it every 14 days ("never
  outdated"): GitHub security-advisory sweep for the locked dependency set,
  lockfile refresh, a scan for open, useable upstream sources, README/
  SECURITY.md sync, and a checksummed maintenance release tag.
- **Protection stack** — the standing hardening guarantees are the same
  controls listed above (server-side secrets, data-not-instructions repo
  context, blocking gates, Guardian review, checksummed releases), plus the
  cadence itself.
- **Unit-tested core** — the engine is pure TypeScript with zero imports
  (`src/convex/ghost/securities.ts`), so the whole defense surface is
  covered by `bun test` in `tests/securities.test.ts`.

The engine currently reports posture from deterministic checks that mirror
this policy. Findings that require external reachability (live GHSA queries
against the registry) are executed as release-chores each cadence window and
must pass before the maintenance release tag moves.

## Hardening guidance for deployments

- Keep `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_PAT`/`GITHUB_TOKEN`
  and provider keys (`ANTHROPIC_API_KEY`, `SAMBANOVA_API_KEY`,
  `OPENAI_API_KEY`) out of source and out of the browser bundle.
- Set `SITE_URL` to your Convex site URL so the OAuth callback
  (`/github/callback`) resolves to your deployment only.
- Verify APK releases against the attached `artifacts.sha256` before
  installing on a device.
- Desktop installers (.dmg/.zip/.exe/.AppImage/.deb) are unsigned by default;
  verify them against `artifacts.sha256` and prefer the checksummed release
  tag over mirrors. Add code-signing certificates as CI secrets before
  shipping to end users.
- The `electron/`, `android/` and `ios/` platform shells are scaffolded at
  build time and never committed — audit the committed
  `capacitor.config.json` plus the scaffold workflow instead.
- Rebuild from a clean checkout and pin the release tag when auditing
  shipped artifacts.

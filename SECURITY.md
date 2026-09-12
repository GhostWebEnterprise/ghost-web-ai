# Security Policy

## Supported Versions

Ghost Web AI ships as tagged GitHub releases (`vX.Y.Z`) with checksummed
artifacts and an attached SHA-256 manifest. Only the latest release line
receives security updates; older releases are documented for reference only.

| Version  | Supported          | Notes                                              |
| -------- | ------------------ | -------------------------------------------------- |
| 0.1.x    | :white_check_mark: | Latest line — includes v0.1.1 (matrix icon release) |
| 0.1.0    | :x: | Superseded by v0.1.1; security fixes ride forward, not supported|
| < 0.1.0  | :x:                | Pre-release history, not supported                 |

The current release train is **v0.1.1**: typecheck, tests and build verified,
APK assembled on GitHub runners and attached alongside its checksum manifest.

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
- The Capacitor Android APK shell and its release workflow artifacts
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

## Hardening guidance for deployments

- Keep `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_PAT`/`GITHUB_TOKEN`
  and provider keys (`ANTHROPIC_API_KEY`, `SAMBANOVA_API_KEY`,
  `OPENAI_API_KEY`) out of source and out of the browser bundle.
- Set `SITE_URL` to your Convex site URL so the OAuth callback
  (`/github/callback`) resolves to your deployment only.
- Verify APK releases against the attached `artifacts.sha256` before
  installing on a device.
- Rebuild from a clean checkout and pin the release tag when auditing
  shipped artifacts.

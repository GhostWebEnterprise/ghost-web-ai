<div align="center">

<img src="public/icon.svg" width="128" alt="GhostWeb AI icon" />

# GhostWeb AI

**Private by design. Secure by default. Open source.**

> **Development status:** GhostWeb AI is under active development. Features, integrations and delivery workflows are evolving and development builds are not yet presented as a fully verified production AI platform.

AI-assisted software delivery: plan, code, test, heal, verify and ship through coordinated agent workflows.

[![GitHub](https://img.shields.io/badge/GitHub-GhostWebEnterprise-181717?style=plastic&logo=github&logoColor=white)](https://github.com/GhostWebEnterprise)
[![Status](https://img.shields.io/badge/Status-Under%20Development-orange?style=plastic)](https://github.com/GhostWebEnterprise/ghost-web-ai)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20Desktop-3DDC84?style=plastic&logo=android&logoColor=white)](https://github.com/GhostWebEnterprise/ghost-web-ai)
[![Release](https://img.shields.io/github/v/release/GhostWebEnterprise/ghost-web-ai?style=plastic&label=GhostWeb%20AI)](https://github.com/GhostWebEnterprise/ghost-web-ai/releases)
[![Test](https://img.shields.io/github/actions/workflow/status/GhostWebEnterprise/ghost-web-ai/ci.yml?branch=main&style=plastic&label=Test)](https://github.com/GhostWebEnterprise/ghost-web-ai/actions/workflows/ci.yml)
[![Website](https://img.shields.io/badge/Project%20Hub-ghostwebenterprise.github.io-0b57d0?style=plastic&logo=googlechrome&logoColor=white)](https://ghostwebenterprise.github.io/ai.html)

</div>

---

## 👻 GhostWeb ecosystem

GhostWeb AI is the AI and software-delivery project in the GhostWeb open-source ecosystem.

| Project | Purpose | Status |
|---|---|---|
| **GhostWeb Signal** | Privacy-focused Android messaging and calling | Public project |
| **GhostWeb VPN** | Browser, Android and desktop network protection | **Under development** |
| **GhostWeb AI** | Multi-model AI, agents and software delivery | **Under development** |
| **GhostOS** | Privacy-focused custom Android ROM | **In development · not public** |

**Project hub:** https://ghostwebenterprise.github.io/

## 🚧 Current status

GhostWeb AI is being actively implemented and verified. Model integrations, agent orchestration, repository automation, application clients, CI and release behavior may change before stable status.

A successful build or GitHub release does not by itself mean every AI provider, agent path or delivery workflow has been production-verified. Stable status will be stated explicitly after the required runtime, security and release gates have passed.

## 🧠 Development focus

GhostWeb AI is designed to turn plain-language goals into structured AI and software-delivery workflows.

> **Plan → branch → implement → inspect → build → first real error → fix → verify → commit → PR.**

Current development areas include:

- Multi-model chat and provider abstraction
- Coordinated specialist-agent workflows
- Repository-aware implementation and review
- GitHub branch, commit, pull-request, release and artifact workflows
- Self-healing build/CI loops based on the first real failure
- Security and licence verification gates
- MCP and A2A tooling
- Gateway, direct-provider and local-model paths where supported
- Web, Android and desktop delivery targets

## 🤖 Multi-agent delivery model

The project is evolving toward multiple specialist roles working on different parts of the same objective while sharing verification gates. The intended flow separates planning, implementation, security review, build/test work and final verification instead of treating a generated answer as proof that work is complete.

## 🔐 Security & privacy

Repository content and external tool output should be treated as untrusted input. Credentials must not be committed to source control. OAuth/provider secrets should remain on trusted server-side boundaries where applicable, and generated changes should pass the relevant security, licence and CI gates before release readiness is claimed.

AI-generated code and agent actions require verification. GhostWeb AI is intended to make those verification steps visible rather than imply that autonomous output is automatically safe or correct.

## 🚀 Development setup

```bash
git clone https://github.com/GhostWebEnterprise/ghost-web-ai.git
cd ghost-web-ai
bun install
bun convex dev --once
bunx tsc -b --noEmit
bun test
bun run dev
```

## 🧪 Verification gates

Development follows the practical sequence **implement → inspect → build/test → first real failure → minimal fix → rerun → verify**.

Before GhostWeb AI is marked stable, relevant paths should verify at minimum application builds, model/provider connectivity, prompt/chat flows, agent execution, repository permissions, secret handling, CI behavior and release artifacts.

## 🤝 Contributing

Issues, improvements, security reports, documentation updates and pull requests are welcome. Keep changes focused, preserve security/licence gates, avoid hard-coded credentials and keep CI green.

- [Issues](https://github.com/GhostWebEnterprise/ghost-web-ai/issues)
- [Pull requests](https://github.com/GhostWebEnterprise/ghost-web-ai/pulls)
- [Releases](https://github.com/GhostWebEnterprise/ghost-web-ai/releases)
- [GhostWeb AI development page](https://ghostwebenterprise.github.io/ai.html)

## 📬 Contact

Questions, feature ideas or support requests: **ghostweb@ghostbin.cfd**

---

<div align="center">

**GhostWeb AI** · plan → build → heal → verify → ship · under active development 👻

</div>

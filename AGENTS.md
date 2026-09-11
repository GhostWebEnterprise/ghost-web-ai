# AGENTS.md

Guidance for AI coding agents working in **Ghost Web AI** — an agent-chain product
(plain-language task → plan → branch → code → self-heal → CI → PR) built with
React 19 + TypeScript + Vite + Convex + Tailwind v4 + shadcn/ui, driven by **Bun**.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `bun install` (bun.lock is canonical) |
| Typecheck | `bunx tsc -b --noEmit` — there is **no** `tsc` bin script; use `bunx` |
| Unit tests | `bun test` (bun's test runner; tests live in `tests/`) |
| Convex codegen / push | `bun convex dev --once` — never run `convex dev` without `--once` |
| Dev server | `bun run dev` |
| Production build | `bun run build` (typecheck + `vite build` → `dist/`) |

## Conventions

- **Convex backend** lives in `src/convex/**` (queries/mutations/actions + `http.ts`
  routes). Never hand-edit `src/convex/_generated/**`; regenerate with
  `bun convex dev --once` instead.
- **Styling** is Tailwind v4 + shadcn/ui (`src/components/ui/**`). Keep new UI inside
  the existing token system; do not reintroduce global CSS resets.
- **Read-only platform files** (do not modify): `vly-toolbar-readonly.tsx` and
  `src/convex/auth.ts` unless adding an auth provider per the Convex Auth docs.
- **Routes** (`src/main.tsx`): `/` landing, `/auth`, `/chat` and `/dashboard` are
  wrapped in `RequireAuth`; `/auth` redirects to `/dashboard` after sign-in.
- **Planning engine** (`src/convex/ghost/plan.ts`) is pure TypeScript with zero
  imports — keep it that way so it stays unit-testable.
- **Optional keys** are configured in the project's Keys settings, never committed:
  `SAMBANOVA_API_KEY` (LLM planner; falls back to the local engine),
  `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (OAuth connect),
  `GITHUB_PAT`/`GITHUB_TOKEN` (alternative to OAuth for live pushes).

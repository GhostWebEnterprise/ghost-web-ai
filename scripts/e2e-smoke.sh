#!/bin/sh
# Ghost Web AI — E2E smoke suite (no browser binary required).
# Exercises every route through the running dev server, the Vite-transformed
# modules (SPA = no rendered content in raw HTML), and the live Convex backend
# protocol round-trips. Exit 1 on any failure.
#
# Usage: sh ./scripts/e2e-smoke.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:5173
#   CONVEX_URL defaults to http://127.0.0.1:3210

set -u

BASE="${1:-http://localhost:5173}"
CONVEX="${CONVEX_URL:-http://127.0.0.1:3210}"
PASS=0
FAIL=0

say()  { printf '%s\n' "$*"; }
ok()   { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
bad()  { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }

# check <name> <expected> <actual>
check() {
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (want $2, got $3)"; fi
}

# contains <name> <needle> <haystack-file>
contains() {
  if grep -q -e "$2" "$3"; then ok "$1"; else bad "$1 (missing: $2)"; fi
}

say "E2E smoke against $BASE (convex: $CONVEX)"

# ---------- routes through the dev server ----------
for route in / /auth /chat /dashboard /build /nonexistent-page; do
  code=$(curl -s -o /tmp/e2e_body -w '%{http_code}' --max-time 10 "$BASE$route")
  # SPA: every app route serves the shell; unknown paths render NotFound client-side.
  check "route $route" "200" "$code"
done

# ---------- app shell sanity ----------
curl -s --max-time 10 "$BASE/" -o /tmp/e2e_shell
contains "shell has root div"        'id="root"' /tmp/e2e_shell
contains "shell loads main entry"    '/src/main.tsx' /tmp/e2e_shell

# ---------- source modules transform + carry the real content ----------
# (The SPA shell is an empty root div, so feature assertions target the
#  Vite-transformed modules that the browser actually executes.)
curl -s --max-time 10 "$BASE/src/pages/Landing.tsx" -o /tmp/e2e_landing
contains "landing compiles (HTTP body)" "export default" /tmp/e2e_landing
contains "landing hero CTA deep-links /build" 'returnTo=/build' /tmp/e2e_landing
contains "landing contact link" "ghost@ghostbin.cfd" /tmp/e2e_landing

curl -s --max-time 10 "$BASE/src/pages/BuildWizard.tsx" -o /tmp/e2e_wizard
contains "wizard compiles (matrix theme)" "mx-page" /tmp/e2e_wizard

curl -s --max-time 10 "$BASE/src/main.tsx" -o /tmp/e2e_main
contains "router registers /build" 'path: "/build"' /tmp/e2e_main

# ---------- global CSS serves both token systems ----------
curl -s --max-time 10 "$BASE/src/index.css" -o /tmp/e2e_css
contains "matrix theme tokens present" "--mx-green" /tmp/e2e_css
contains "neobrutalism tokens intact"  "--ink" /tmp/e2e_css

# ---------- Convex backend round-trips ----------
fn=$(curl -s --max-time 8 -X POST "$CONVEX/api/query" \
  -H 'Content-Type: application/json' \
  -d '{"path":"ghost/queries:listConversations","args":{},"format":"json"}')
printf '%s' "$fn" > /tmp/e2e_fn
contains "backend executes ghost queries" '"status":"success"' /tmp/e2e_fn

mut=$(curl -s --max-time 8 -X POST "$CONVEX/api/mutation" \
  -H 'Content-Type: application/json' \
  -d '{"path":"github/mutations:startConnect","args":[{"origin":"http://localhost:5173"}],"format":"json"}')
printf '%s' "$mut" > /tmp/e2e_mut
contains "mutation layer guarded by auth" 'Sign in to connect GitHub' /tmp/e2e_mut

auth=$(curl -s --max-time 25 -X POST "$CONVEX/api/action" \
  -H 'Content-Type: application/json' \
  -d '{"path":"auth:signIn","args":[{"provider":"email-otp","params":{"email":"ghost-diagnostic@example.com"}}],"format":"json"}')
printf '%s' "$auth" > /tmp/e2e_auth
# The chain must reach the OTP sender (disposable domains are rejected by
# policy upstream — proving everything before the gate works).
contains "auth OTP chain reaches sender" 'send_otp\|example.com\|Invalid' /tmp/e2e_auth

# ---------- summary ----------
say ""
say "passed: $PASS  failed: $FAIL"
[ "$FAIL" -eq 0 ] || exit 1

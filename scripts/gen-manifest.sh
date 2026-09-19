#!/bin/sh
# Ghost Web AI — release artifact manifest generator.
# Writes dist/artifacts.sha256 (sha256 of every built file, sorted).
# Verify later with:  cd dist && sha256sum -c artifacts.sha256

set -eu
cd "$(dirname "$0")/.."

if [ ! -f dist/index.html ]; then
  echo "dist/index.html missing — run the production build first (npx vite build)" >&2
  exit 1
fi

cd dist
tmp_manifest="$(mktemp)"
find . -type f ! -name artifacts.sha256 -print0 | sort -z | xargs -0 sha256sum > "$tmp_manifest"
mv "$tmp_manifest" artifacts.sha256
echo "manifest written: dist/artifacts.sha256 ($(wc -l < artifacts.sha256) files)"

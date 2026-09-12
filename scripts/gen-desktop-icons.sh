#!/bin/sh
# Ghost Web AI — desktop icon generation for the Electron shell.
# Renders the matrix icon SVG into electron/assets/icon.png (1024x1024).
# electron-builder picks this up from its buildResources directory and
# converts it automatically into the macOS .icns, Windows .ico and Linux
# PNG sizes it needs at package time.
#
# Prereqs (CI): node + @resvg/resvg-js from the root project's
# devDependencies (installed by `bun install` before this runs).

set -eu
cd "$(dirname "$0")/.."

if [ ! -f public/icon.svg ]; then
  echo "public/icon.svg missing — nothing to render" >&2
  exit 1
fi

mkdir -p electron/assets

node -e '
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const svg = fs.readFileSync("public/icon.svg", "utf8");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1024 },
  background: "rgba(0,0,0,0)",
});
fs.writeFileSync("electron/assets/icon.png", resvg.render().asPng());
console.log("electron/assets/icon.png written (1024x1024)");
'

test -s electron/assets/icon.png || { echo "icon.png was not written" >&2; exit 1; }
echo "desktop icon written: electron/assets/icon.png"

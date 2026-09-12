#!/bin/sh
# Ghost Web AI — desktop icon generation for the Electron shell.
# Renders the matrix icon SVG into the PNG sizes electron-builder expects
# under electron/build/ (macOS icon + Windows icon + Linux icons).
#
# Prereqs (CI): node + @resvg/resvg-js is available in the root project's
# devDependencies, so this runs through a tiny node script.

set -eu
cd "$(dirname "$0")/.."

if [ ! -f public/icon.svg ]; then
  echo "public/icon.svg missing — nothing to render" >&2
  exit 1
fi

mkdir -p electron/build

node -e '
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const svg = fs.readFileSync("public/icon.svg", "utf8");
for (const size of [512, 256, 128]) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(`electron/build/icon-${size}.png`, png);
  console.log(`icon-${size}.png written`);
}
'

echo "desktop icons written: electron/build/"

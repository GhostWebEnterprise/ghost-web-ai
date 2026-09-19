#!/bin/sh
# Ghost Web AI — app icon generator.
# Renders public/icon.svg (matrix-styled master) to every raster icon the
# web app and the Android APK shell need. Deterministic, no network.
#
# Usage: sh ./scripts/gen-icons.sh

set -eu
cd "$(dirname "$0")/.."

OUT_DIR="public/icons"
command -v bun >/dev/null 2>&1 || { echo "bun is required" >&2; exit 1; }

mkdir -p "$OUT_DIR"

# shellcheck disable=SC2016
bun -e '
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const svg = readFileSync("public/icon.svg", "utf8");

const web = [16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512];
mkdirSync("public/icons", { recursive: true });
for (const s of web) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: s } }).render().asPng();
  writeFileSync(`public/icons/icon-${s}.png`, png);
}

// Android launcher sizes (square masters for legacy launchers)
const android = [
  ["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192],
];
for (const [dpi, s] of android) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: s } }).render().asPng();
  const dir = `android/app/src/main/res/mipmap-${dpi}`;
  try { mkdirSync(dir, { recursive: true }); } catch {}
  writeFileSync(`${dir}/ic_launcher.png`, png);
  writeFileSync(`${dir}/ic_launcher_round.png`, png);
}

// Adaptive icon layers (Android 8+): use the exact GhostWeb AI artwork
// from public/icon.svg so Android never falls back to the old matrix mark.
const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" fill="#020812"/></svg>`;
const fg = svg;
for (const [dpi, s] of android) {
  const dir = `android/app/src/main/res/mipmap-${dpi}`;
  try { mkdirSync(dir, { recursive: true }); } catch {}
  writeFileSync(`${dir}/ic_launcher_background.png`,
    new Resvg(bg, { fitTo: { mode: "width", value: s } }).render().asPng());
  writeFileSync(`${dir}/ic_launcher_foreground.png`,
    new Resvg(fg, { fitTo: { mode: "width", value: s } }).render().asPng());
}

// Point the adaptive-icon XML at the raster layers (the Capacitor template
// references a drawable-v24 vector that we replace with themed bitmaps).
const anydpiDir = "android/app/src/main/res/mipmap-anydpi-v26";
try { mkdirSync(anydpiDir, { recursive: true }); } catch {}
writeFileSync(`${anydpiDir}/ic_launcher.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`);
writeFileSync(`${anydpiDir}/ic_launcher_round.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`);

// Maskable PWA icons: full-bleed square (no rounded tile) with the mark
// pulled into the 80% safe zone so circular masks never clip it.
const maskable = (size) => svg
  .replace(/<rect x="8" y="8" width="496" height="496" rx="112"\/>\n    <\/clipPath>/, "<rect x=\"0\" y=\"0\" width=\"512\" height=\"512\"/>\n    </clipPath>")
  .replace(/rx="109"/g, "rx=\"0\"").replace(/rx="100"/g, "rx=\"0\"")
  .replace(/transform="translate\(112 137\) scale\(4\.5\)"/, `transform="translate(140 160) scale(3.6)"`);
for (const s of [192, 512]) {
  const png = new Resvg(maskable(s), { fitTo: { mode: "width", value: s } }).render().asPng();
  writeFileSync(`public/icons/maskable-${s}.png`, png);
}

console.log(`web icons: ${web.length} sizes + 2 maskable -> public/icons/`);
console.log(`android launcher icons: ${android.length} densities + adaptive layers -> android/.../mipmap-*`);
'

echo "icon generation complete"

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

// Adaptive icon layers (Android 8+): solid dark background + full-bleed ghost
// foreground. Safe-zone padding is baked into the foreground SVG.
const bg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" fill="#040a06"/></svg>`;
const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><g transform="translate(21 21) scale(0.615)"><path d="M14 46V25C14 15.059 22.059 7 32 7C41.941 7 50 15.059 50 25V46H43L39.5 40.5L36 46H32L28.5 40.5L25 46H21L17.5 40.5L14 46Z" fill="#00ff41"/><rect x="20.75" y="20" width="7.9" height="11.25" fill="#040a06"/><rect x="39.35" y="20" width="7.9" height="11.25" fill="#040a06"/></g></svg>`;
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

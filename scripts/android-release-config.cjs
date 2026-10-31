#!/usr/bin/env node
/**
 * Ghost Web AI — Android release configuration for the Capacitor scaffold.
 *
 * The `android/` shell is scaffolded at build time (gitignored), so build
 * settings must be injected, not committed. This script patches the scaffold's
 * gradle files for a signed release APK:
 *
 *   1. versionCode / versionName stamped from the git tag (e.g. v0.1.4 -> 14, "0.1.4")
 *   2. a `release` signingConfig, sourced from:
 *      - all four ANDROID_KEYSTORE_* signing secrets (no generated fallback)
 *   3. release buildType wired to that signing config
 *
 * Idempotent: safe to re-run. Usage: node scripts/android-release-config.js [tag]
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const APP_GRADLE = path.join(ROOT, "android", "app", "build.gradle");

function must(cond, msg) {
  if (!cond) {
    console.error(`android-release-config: ${msg}`);
    process.exit(1);
  }
}

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: ROOT }).trim();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// 1. Version stamping from a v* tag
// ---------------------------------------------------------------------------
const arg = process.argv[2] || process.env.ANDROID_TAG || sh("git describe --tags --abbrev=0 2>/dev/null");
const tagMatch = /^v?(\d+)\.(\d+)\.(\d+)/.exec(arg || "");
const pkgVersion = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
})();
const versionName = tagMatch ? `${tagMatch[1]}.${tagMatch[2]}.${tagMatch[3]}` : pkgVersion;
const versionCode = tagMatch
  ? Number(tagMatch[1]) * 10000 + Number(tagMatch[2]) * 100 + Number(tagMatch[3])
  : 1;

// ---------------------------------------------------------------------------
// 2. Keystore: require repository signing secrets; no fallback
// ---------------------------------------------------------------------------
const keystorePath = path.join(ROOT, "android", "release.keystore");
for (const key of ["ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"]) {
  must((process.env[key] || "").trim().length > 0, key + " is required for release signing");
}
const encoded = process.env.ANDROID_KEYSTORE_BASE64.replace(/\s/g, "");
must(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded),
  "ANDROID_KEYSTORE_BASE64 must be valid base64");
const decoded = Buffer.from(encoded, "base64");
must(decoded.length > 0 && decoded.toString("base64") === encoded,
  "ANDROID_KEYSTORE_BASE64 must decode to a nonempty keystore");
fs.mkdirSync(path.dirname(keystorePath), { recursive: true });
fs.writeFileSync(keystorePath, decoded, { mode: 0o600 });
// writeFileSync's mode only applies to newly created files; enforce it for reused paths too.
fs.chmodSync(keystorePath, 0o600);

// ---------------------------------------------------------------------------
// 3. Patch app/build.gradle
// ---------------------------------------------------------------------------
must(fs.existsSync(APP_GRADLE), "android/app/build.gradle not found — run `bunx cap add android` first");

let gradle = fs.readFileSync(APP_GRADLE, "utf8");
const ENV_BLOCK =
  "def envVal = { String key -> System.getenv(key) ?: \"\" }\n" +
  "def keystoreFile = rootProject.file('release.keystore')\n" +
  "def keystorePass = envVal('ANDROID_KEYSTORE_PASSWORD')\n" +
  "def aliasVal = envVal('ANDROID_KEY_ALIAS')\n" +
  "def keyPass = envVal('ANDROID_KEY_PASSWORD')\n";

const SIGNING_BLOCK =
  "    signingConfigs {\n" +
  "        release {\n" +
  "            if (keystoreFile.exists()) {\n" +
  "                storeFile keystoreFile\n" +
  "                storePassword keystorePass\n" +
  "                keyAlias aliasVal\n" +
  "                keyPassword keyPass\n" +
  "            }\n" +
  "        }\n" +
  "    }\n";

const RELEASE_BUILDTYPE =
  "        release {\n" +
  "            minifyEnabled false\n" +
  "            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'\n" +
  "            if (keystoreFile.exists()) {\n" +
  "                signingConfig signingConfigs.release\n" +
  "            }\n" +
  "        }\n";

let patched = gradle;

// Version stamping (keep original lines as the non-tag fallback).
patched = patched.replace(
  /(        versionCode )1\n        versionName "1\.0"/,
  `        versionCode ${versionCode}\n        versionName "${versionName}"`
);

// Env helper block + signingConfigs (insert once, before buildTypes).
if (!patched.includes("signingConfigs {")) {
  const anchor = "    buildTypes {";
  must(patched.includes(anchor), "buildTypes block not found in app/build.gradle");
  patched = patched.replace(anchor, `${ENV_BLOCK}${SIGNING_BLOCK}    buildTypes {`);
}

// Wire the release buildType to the signing config.
if (!patched.includes("signingConfig signingConfigs.release")) {
  const releaseBlockRe = /        release \{\n            minifyEnabled false\n            proguardFiles getDefaultProguardFile\('proguard-android\.txt'\), 'proguard-rules\.pro'\n        \}/;
  must(releaseBlockRe.test(patched), "release buildType block not found in app/build.gradle");
  patched = patched.replace(releaseBlockRe, RELEASE_BUILDTYPE.trimEnd());
}

fs.writeFileSync(APP_GRADLE, patched);

// ---------------------------------------------------------------------------
// 4. Report
// ---------------------------------------------------------------------------

console.log(`android-release-config: version ${versionName} (code ${versionCode})`);
console.log("android-release-config: repository keystore configured");
console.log("android-release-config: app/build.gradle patched for signed release builds");

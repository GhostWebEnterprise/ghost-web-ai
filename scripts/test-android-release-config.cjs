#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const sourceScript = path.join(__dirname, "android-release-config.cjs");
const secrets = {
  ANDROID_KEYSTORE_BASE64: Buffer.from("test-keystore").toString("base64"),
  ANDROID_KEYSTORE_PASSWORD: "test-store-password",
  ANDROID_KEY_ALIAS: "test-alias",
  ANDROID_KEY_PASSWORD: "test-key-password",
};

function createFixture(initialMinSdk) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ghostweb-ai-android-config-"));
  const scripts = path.join(root, "scripts");
  const android = path.join(root, "android");
  const app = path.join(android, "app");
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(app, { recursive: true });
  const script = path.join(scripts, "android-release-config.cjs");
  fs.copyFileSync(sourceScript, script);
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version: "0.0.0" }));
  fs.writeFileSync(
    path.join(android, "variables.gradle"),
    "ext {\n    minSdkVersion = " + initialMinSdk + "\n    compileSdkVersion = 35\n}\n"
  );
  fs.writeFileSync(
    path.join(app, "build.gradle"),
    [
      "android {",
      "    defaultConfig {",
      "        versionCode 1",
      "        versionName \"1.0\"",
      "    }",
      "    buildTypes {",
      "        release {",
      "            minifyEnabled false",
      "            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'",
      "        }",
      "    }",
      "}",
      "",
    ].join("\n")
  );
  return { root, script };
}

function runConfig(fixture, env) {
  return execFileSync(process.execPath, [fixture.script, "v0.2.4"], {
    cwd: fixture.root,
    env: { ...process.env, ...secrets, ...env },
    encoding: "utf8",
  });
}

function testMinSdk(initial, expected) {
  const fixture = createFixture(initial);
  try {
    const output = runConfig(fixture);
    const variablesPath = path.join(fixture.root, "android", "variables.gradle");
    const gradlePath = path.join(fixture.root, "android", "app", "build.gradle");
    const keystorePath = path.join(fixture.root, "android", "release.keystore");
    const variables = fs.readFileSync(variablesPath, "utf8");
    const gradle = fs.readFileSync(gradlePath, "utf8");

    assert.ok(variables.includes("minSdkVersion = " + expected + "\n"));
    assert.match(output, new RegExp("minimum SDK " + expected));
    assert.match(gradle, /versionCode 204/);
    assert.match(gradle, /versionName "0\\.2\\.4"/);
    assert.match(gradle, /signingConfig signingConfigs\\.release/);
    assert.equal(fs.statSync(keystorePath).mode & 0o777, 0o600);

    const firstVariables = variables;
    const firstGradle = gradle;
    runConfig(fixture);
    assert.equal(fs.readFileSync(variablesPath, "utf8"), firstVariables);
    assert.equal(fs.readFileSync(gradlePath, "utf8"), firstGradle);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
}

function testMissingSecretFailsClosed() {
  const fixture = createFixture(23);
  try {
    const result = spawnSync(process.execPath, [fixture.script, "v0.2.4"], {
      cwd: fixture.root,
      env: { ...process.env, ...secrets, ANDROID_KEY_PASSWORD: "" },
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ANDROID_KEY_PASSWORD is required/);
    assert.equal(fs.existsSync(path.join(fixture.root, "android", "release.keystore")), false);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
}

testMinSdk(23, 24);
testMinSdk(26, 26);
testMissingSecretFailsClosed();
console.log("Android release config tests passed: API 23 is raised to 24, newer minSdk is preserved, config is idempotent, and missing signing secrets fail closed.");

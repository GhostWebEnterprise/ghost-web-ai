import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./android-release-config.cjs", import.meta.url));
const repoRoot = path.resolve(path.dirname(script), "..");
const signingSecrets = [
  "ANDROID_KEYSTORE_BASE64",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
];

function runConfig(env: NodeJS.ProcessEnv) {
  return spawnSync("node", [script, "v1.2.3"], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
  });
}

test("Android release configuration fails closed when signing secrets are absent", () => {
  const env = { ...process.env };
  for (const key of signingSecrets) delete env[key];

  const result = runConfig(env);

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("ANDROID_KEYSTORE_BASE64 is required for release signing");
  expect(result.stderr).not.toContain("self-signed");
});

test("Android release configuration rejects malformed keystore base64 before touching the scaffold", () => {
  const env = { ...process.env };
  env.ANDROID_KEYSTORE_BASE64 = "not-base64!";
  env.ANDROID_KEYSTORE_PASSWORD = "test-store-password";
  env.ANDROID_KEY_ALIAS = "test-alias";
  env.ANDROID_KEY_PASSWORD = "test-key-password";

  const result = runConfig(env);

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("ANDROID_KEYSTORE_BASE64 must be valid base64");
});


test("Android release requires APK Signature Scheme v2", () => {
  const workflow = readFileSync(path.join(repoRoot, ".github", "workflows", "release.yml"), "utf8");
  expect(workflow).toContain(
    'grep -Fq "Verified using v2 scheme (APK Signature Scheme v2): true" apk-out/apksigner.txt',
  );
});

test("Android release keystore enforces private permissions for reused paths", () => {
  const source = readFileSync(script, "utf8");
  expect(source).toContain("fs.chmodSync(keystorePath, 0o600);");
});

test("Android release keystore is removed before the draft release is published", () => {
  const workflow = readFileSync(path.join(repoRoot, ".github", "workflows", "release.yml"), "utf8");
  const attachIndex = workflow.indexOf("- name: Attach APK to the GitHub release");
  const cleanupIndex = workflow.indexOf("- name: Remove Android signing material");
  const publishIndex = workflow.indexOf("- name: Publish verified Android release");

  expect(attachIndex).toBeGreaterThan(-1);
  expect(cleanupIndex).toBeGreaterThan(attachIndex);
  expect(publishIndex).toBeGreaterThan(cleanupIndex);

  const attach = workflow.slice(attachIndex, cleanupIndex);
  const cleanup = workflow.slice(cleanupIndex, publishIndex);
  expect(attach).not.toContain("gh release edit");
  expect(cleanup).toContain("if: always()");
  expect(cleanup).toContain("rm -f android/release.keystore");
  expect(cleanup).toContain("test ! -e android/release.keystore");
  const publish = workflow.slice(publishIndex);
  expect(publish).toContain('test "$is_draft" = true');
  expect(publish).toContain('gh release edit "${RELEASE_TAG}"');
  expect(publish).toContain('test "$is_draft" = false');
});

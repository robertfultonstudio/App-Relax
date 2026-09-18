import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REQUIRED_EAS_IGNORE_RULES,
  REQUIRED_GIT_IGNORE_RULES,
  validateAdmissionPaths,
  validateRequiredIgnoreRules,
} from "./lib/repository-admission-policy.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
validateRequiredIgnoreRules(
  readFileSync(join(root, ".gitignore"), "utf8"),
  REQUIRED_GIT_IGNORE_RULES,
  ".gitignore",
);
validateRequiredIgnoreRules(
  readFileSync(join(root, ".easignore"), "utf8"),
  REQUIRED_EAS_IGNORE_RULES,
  ".easignore",
);

const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
)
  .split("\0")
  .filter(Boolean)
  .sort();
validateAdmissionPaths(paths);

for (const synthetic of [
  ".env",
  ".env.production",
  ".npmrc",
  ".codex/config.toml",
  "android/debug.keystore",
  "google-services.json",
  "ios/GoogleService-Info.plist",
  "credentials/private.json",
  "secrets/token.txt",
  "public/audio-catalog/future.opus",
]) {
  execFileSync("git", ["check-ignore", "--no-index", "-q", synthetic], {
    cwd: root,
  });
}

console.log(
  `Repository admission: PASS (${paths.length} candidate paths; credential/service/private roots fail closed; public/audio-catalog allowlist contains README.md only).`,
);

import { posix } from "node:path";

export const CATALOG_ALLOWLIST = new Set(["public/audio-catalog/README.md"]);

export const REQUIRED_GIT_IGNORE_RULES = [
  ".env",
  ".env.*",
  ".npmrc",
  ".codex/",
  "*.keystore",
  "google-services.json",
  "GoogleService-Info.plist",
  "credentials*.json",
  "service-account*.json",
  "/credentials/",
  "/secrets/",
  "/public/audio-catalog/**",
  "!/public/audio-catalog/README.md",
];

export const REQUIRED_EAS_IGNORE_RULES = [
  ".env",
  ".env.*",
  ".npmrc",
  "/.codex/",
  "*.keystore",
  "google-services.json",
  "GoogleService-Info.plist",
  "credentials*.json",
  "service-account*.json",
  "/credentials/",
  "/secrets/",
  "/public/audio-catalog/",
  "/assets/audio/test-pack-01/",
];

const CREDENTIAL_EXTENSIONS = new Set([
  ".cer",
  ".jks",
  ".key",
  ".keystore",
  ".mobileprovision",
  ".p12",
  ".p8",
  ".pem",
  ".pfx",
]);
const CREDENTIAL_NAMES = new Set([
  ".npmrc",
  "credentials.json",
  "google-services.json",
  "googleservice-info.plist",
  "service-account.json",
]);
const RESERVED_ROOTS = [
  ".codex/",
  ".expo/",
  ".pnpm-store/",
  "coverage/",
  "dist/",
  "node_modules/",
  "output/",
  "quality/reports/",
  "release/",
  "tmp/",
  "web-build/",
];

function normalizeCandidatePath(path) {
  const normalized = posix.normalize(String(path).replaceAll("\\", "/"));
  if (
    normalized.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith("../")
  )
    return null;
  return normalized.replace(/^\.\//, "");
}

export function candidatePathViolation(path) {
  const normalized = normalizeCandidatePath(path);
  if (!normalized) return "reserved or escaping path";
  if (
    normalized.startsWith("public/audio-catalog/") &&
    !CATALOG_ALLOWLIST.has(normalized)
  )
    return "local audio catalog path is not explicitly allowlisted";
  if (RESERVED_ROOTS.some((root) => normalized.startsWith(root)))
    return "reserved generated or private path";

  const segments = normalized.split("/");
  if (
    segments.some((segment) =>
      [".codex", "credentials", "secrets"].includes(segment.toLowerCase()),
    )
  )
    return "reserved credential directory";

  const filename = segments.at(-1)?.toLowerCase() ?? "";
  if (
    filename === ".env" ||
    filename.startsWith(".env.") ||
    CREDENTIAL_NAMES.has(filename) ||
    /^credentials.*\.json$/i.test(filename) ||
    /^service-account.*\.json$/i.test(filename)
  )
    return "credential-like file name";

  const extension = posix.extname(filename).toLowerCase();
  if (CREDENTIAL_EXTENSIONS.has(extension))
    return "credential-like file extension";
  return null;
}

export function validateAdmissionPaths(paths) {
  const violations = paths.flatMap((path) => {
    const reason = candidatePathViolation(path);
    return reason ? [`${path}: ${reason}`] : [];
  });
  if (violations.length)
    throw new Error(
      `Repository admission failed:\n- ${violations.join("\n- ")}`,
    );
}

export function validateRequiredIgnoreRules(contents, required, label) {
  const lines = new Set(
    contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")),
  );
  const missing = required.filter((rule) => !lines.has(rule));
  if (missing.length)
    throw new Error(
      `${label} is missing fail-closed rules: ${missing.join(", ")}`,
    );
}

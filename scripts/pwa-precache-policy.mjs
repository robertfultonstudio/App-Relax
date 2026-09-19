import path from "node:path";

const INTERNAL_EXPORTS = new Set([
  "+not-found.html",
  "_sitemap.html",
  "_expo/.routes.json",
]);

/**
 * Expo emits a few diagnostics and router-owned image assets that Sites does
 * not publish. They are not referenced by the App Relax consumer surface and
 * must not be allowed to make service-worker installation atomicly fail.
 */
export function isPublishableShellFile(relativePath) {
  const portable = relativePath.split(path.sep).join("/");
  if (INTERNAL_EXPORTS.has(portable)) return false;
  if (portable.includes("/[")) return false;
  if (portable.startsWith("assets/node_modules/.pnpm/expo-router@"))
    return false;
  return true;
}

/** Sites publishes exported HTML as canonical extensionless routes. */
export function publishedShellUrl(relativePath) {
  const portable = relativePath.split(path.sep).join("/");
  if (portable === "index.html") return "/";
  if (portable.endsWith(".html")) return `/${portable.slice(0, -5)}`;
  return `/${portable}`;
}

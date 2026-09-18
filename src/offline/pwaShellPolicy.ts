export const PRIVATE_REVIEW_HOST =
  "app-relax-private-review.robfulton.chatgpt.site";

export type PwaShellPolicy = "offline-shell" | "online-only";

/** Every HTTPS App Relax surface uses the same fail-closed offline shell. */
export function pwaShellPolicy(_origin: string): PwaShellPolicy {
  return "offline-shell";
}

export const PRIVATE_REVIEW_HOST =
  "app-relax-private-review.robfulton.chatgpt.site";

export type PwaShellPolicy = "offline-shell" | "online-only";

/** Private review retires its shell worker; saved audio is a separate capability. */
export function pwaShellPolicy(origin: string): PwaShellPolicy {
  return new URL(origin).hostname === PRIVATE_REVIEW_HOST
    ? "online-only"
    : "offline-shell";
}

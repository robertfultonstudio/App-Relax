import { PRIVATE_REVIEW_HOST } from "@/offline/pwaShellPolicy";

/** Private review is online-first: an old installed shell must not hide a new
 * catalog. Retiring this origin's root registration does not delete audio,
 * preferences or caches, and does not reload/claim other open clients. */
export const PWA_SHELL_BOOTSTRAP = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async function () {
    try {
      if (window.location.hostname === ${JSON.stringify(PRIVATE_REVIEW_HOST)}) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        if (registration) {
          const scope = new URL(registration.scope);
          if (scope.origin === window.location.origin && scope.pathname === "/") {
            await registration.unregister();
          }
        }
        return;
      }
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (error) {
      console.warn("App Relax shell update could not complete.", error);
    }
  });
}
`;

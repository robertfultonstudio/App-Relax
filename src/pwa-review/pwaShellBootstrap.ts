/** Register the same root shell on the private review host and local HTTPS.
 * Registration never claims or reloads an active client. */
export const PWA_SHELL_BOOTSTRAP = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async function () {
    try {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (error) {
      console.warn("App Relax shell update could not complete.", error);
    }
  });
}
`;

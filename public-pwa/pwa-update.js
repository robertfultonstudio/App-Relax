const button = document.getElementById("update");
const status = document.getElementById("status");
const online = document.getElementById("online");
async function openOnlineReview() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (registration) {
      const scope = new URL(registration.scope);
      if (scope.origin !== window.location.origin || scope.pathname !== "/")
        throw new Error("Unexpected app scope. No changes were made.");
      // false means another App Relax tab already retired the same worker.
      // The private site is online-first: never reinstall it just to update it.
      await registration.unregister();
    }
  }
  window.location.replace("/");
}

async function waitForWorker(worker, accepted) {
  if (accepted.includes(worker.state)) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        finish(
          new Error(
            "Update is taking longer than expected. Please retry online.",
          ),
        ),
      45000,
    );
    function finish(error) {
      clearTimeout(timeout);
      worker.removeEventListener("statechange", check);
      if (error) reject(error);
      else resolve();
    }
    function check() {
      if (accepted.includes(worker.state)) finish();
      else if (worker.state === "redundant")
        finish(new Error("The update did not finish. Please retry online."));
    }
    worker.addEventListener("statechange", check);
    check();
  });
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Preparing the updated app…";
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await registration.update();
      if (registration.installing)
        await waitForWorker(registration.installing, [
          "installed",
          "activated",
        ]);
      const waiting = registration.waiting;
      if (waiting) {
        await new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          const timeout = setTimeout(() => {
            channel.port1.close();
            reject(new Error("Close other App Relax windows, then retry."));
          }, 10000);
          channel.port1.onmessage = ({ data }) => {
            clearTimeout(timeout);
            channel.port1.close();
            if (data?.type === "APP_RELAX_UPDATE_ACCEPTED") resolve();
            else
              reject(
                new Error(
                  "Close other App Relax tabs or app windows, then try again. Playback has not been interrupted.",
                ),
              );
          };
          waiting.postMessage({ type: "APP_RELAX_APPLY_UPDATE" }, [
            channel.port2,
          ]);
        });
        await waitForWorker(waiting, ["activated"]);
      }
    }
    window.location.replace("/");
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? error.message
        : "The offline copy could not update.";
    status.textContent +=
      " You can open the latest online version below. Saved sounds and settings will not be deleted.";
    online.hidden = false;
    button.disabled = false;
  }
});

// A private host may reject shell precaching. Recover online only on an explicit
// second click, without deleting caches, OPFS audio, preferences or other clients.
online.addEventListener("click", async () => {
  online.disabled = true;
  status.textContent = "Opening the online version…";
  try {
    await openOnlineReview();
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? error.message
        : "Could not open the online version. Please retry.";
    online.disabled = false;
  }
});

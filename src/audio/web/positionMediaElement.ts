import type { AudioElementPort } from "./ClockedWavSource";

const SEEK_TOLERANCE_SECONDS = 0.02;
const SEEK_TIMEOUT_MS = 10_000;

function closeEnough(actual: number, target: number): boolean {
  return Math.abs(actual - target) <= SEEK_TOLERANCE_SECONDS;
}

export async function positionMediaElement(
  element: AudioElementPort,
  positionSeconds: number,
  signal?: AbortSignal,
  requestLoad = true,
): Promise<void> {
  const abortError = () => {
    const error = new Error("Audio positioning was cancelled.");
    error.name = "AbortError";
    return error;
  };
  if (signal?.aborted) throw abortError();

  if (element.prepareAt) {
    const cancel = () => element.pause();
    signal?.addEventListener("abort", cancel, { once: true });
    try {
      await element.prepareAt(Math.max(0, positionSeconds));
      if (signal?.aborted) throw abortError();
    } finally {
      signal?.removeEventListener("abort", cancel);
    }
    return;
  }

  if (element.readyState < 1) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Audio metadata timed out while seeking."));
      }, SEEK_TIMEOUT_MS);
      const cleanup = () => {
        clearTimeout(timeout);
        element.removeEventListener("loadedmetadata", handleReady);
        element.removeEventListener("error", handleError);
        signal?.removeEventListener("abort", handleAbort);
      };
      const handleReady = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("Audio metadata could not be loaded for seeking."));
      };
      const handleAbort = () => {
        cleanup();
        reject(abortError());
      };
      element.addEventListener("loadedmetadata", handleReady, { once: true });
      element.addEventListener("error", handleError, { once: true });
      signal?.addEventListener("abort", handleAbort, { once: true });
      if (requestLoad) element.load();
      if (element.readyState >= 1) handleReady();
    });
  }

  const target = Math.max(0, positionSeconds);
  if (!element.seeking && closeEnough(element.currentTime, target)) return;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      fail(
        new Error("Audio seek timed out before reaching the file position."),
      );
    }, SEEK_TIMEOUT_MS);
    const cleanup = () => {
      clearTimeout(timeout);
      element.removeEventListener("seeked", handleSeeked);
      element.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const handleSeeked = () => {
      if (!element.seeking && closeEnough(element.currentTime, target)) {
        succeed();
        return;
      }
      fail(
        new Error(
          `Audio reached ${element.currentTime.toFixed(3)}s instead of ${target.toFixed(3)}s.`,
        ),
      );
    };
    const handleError = () =>
      fail(new Error("Audio could not reach the requested file position."));
    const handleAbort = () => fail(abortError());

    element.addEventListener("seeked", handleSeeked, { once: true });
    element.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });
    try {
      element.currentTime = target;
    } catch (error) {
      fail(
        error instanceof Error
          ? error
          : new Error("Audio file position could not be changed."),
      );
    }
  });
}

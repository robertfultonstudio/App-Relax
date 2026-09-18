import { pwaShellPolicy, type PwaShellPolicy } from "./pwaShellPolicy";

export type ShellReadiness =
  "unchecked" | "checking" | "ready" | "reopen" | "unavailable" | "online-only";

export interface ShellReadinessPort {
  prepare(): Promise<{ controlled: boolean; complete: boolean }>;
}

/** Audio integrity and app-shell availability are deliberately separate gates. */
export class PwaShellReadiness {
  private state: ShellReadiness = "unchecked";
  private listeners = new Set<() => void>();
  private running: Promise<void> | null = null;

  constructor(
    private readonly port: ShellReadinessPort | null,
    private readonly policy: PwaShellPolicy = "offline-shell",
  ) {
    if (policy === "online-only") this.state = "online-only";
  }

  getSnapshot = () => this.state;
  getServerSnapshot = (): ShellReadiness => "unchecked";
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  check = (): Promise<void> => {
    if (this.policy === "online-only") {
      this.set("online-only");
      return Promise.resolve();
    }
    if (this.running) return this.running;
    if (!this.port) {
      this.set("unavailable");
      return Promise.resolve();
    }
    this.set("checking");
    this.running = this.port
      .prepare()
      .then(({ controlled, complete }) =>
        this.set(complete ? (controlled ? "ready" : "reopen") : "unavailable"),
      )
      .catch(() => this.set("unavailable"))
      .finally(() => {
        this.running = null;
      });
    return this.running;
  };

  private set(state: ShellReadiness) {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}

function deadline<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("App preparation timed out.")),
      milliseconds,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function verifyShell(worker: ServiceWorker): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(ready);
    };
    const timer = setTimeout(() => finish(false), 5000);
    channel.port1.onmessage = ({ data }) =>
      finish(
        data?.type === "APP_RELAX_SHELL_STATUS" &&
          data.complete === true &&
          /^[a-f0-9]{64}$/.test(data.revision),
      );
    try {
      worker.postMessage({ type: "APP_RELAX_CHECK_SHELL" }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

export async function prepareBrowserShell(
  container: ServiceWorkerContainer,
  origin: string,
  verify: (worker: ServiceWorker) => Promise<boolean> = verifyShell,
) {
  // Defence in depth: even a direct call cannot reinstall the private worker.
  if (pwaShellPolicy(origin) === "online-only")
    return { controlled: false, complete: false };
  // Same registration as the early document bootstrap; no takeover/reload.
  await deadline(container.register("/sw.js", { scope: "/" }), 15000);
  const registration = await deadline(container.ready, 45000);
  const active = registration.active;
  if (
    !active ||
    active.state !== "activated" ||
    active.scriptURL !== new URL("/sw.js", origin).href
  )
    return { controlled: false, complete: false };
  const complete = await verify(active);
  return {
    complete,
    controlled: container.controller === active && !registration.waiting,
  };
}

function browserPort(): ShellReadinessPort | null {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("serviceWorker" in navigator) ||
    typeof MessageChannel === "undefined"
  )
    return null;
  return {
    prepare: () =>
      prepareBrowserShell(navigator.serviceWorker, window.location.origin),
  };
}

let instance: PwaShellReadiness | null = null;
export function getPwaShellReadiness() {
  const policy =
    typeof window === "undefined"
      ? "offline-shell"
      : pwaShellPolicy(window.location.origin);
  return (instance ??= new PwaShellReadiness(
    policy === "online-only" ? null : browserPort(),
    policy,
  ));
}

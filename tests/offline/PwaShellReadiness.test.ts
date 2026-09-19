import {
  prepareBrowserShell,
  PwaShellReadiness,
} from "@/offline/PwaShellReadiness";
import { PRIVATE_REVIEW_HOST, pwaShellPolicy } from "@/offline/pwaShellPolicy";

function browser(
  controlled = true,
  waiting = false,
  origin = "https://app.test",
) {
  const active = {
    state: "activated",
    scriptURL: `${origin}/sw.js`,
  } as ServiceWorker;
  const registration = {
    active,
    waiting: waiting ? {} : null,
  } as ServiceWorkerRegistration;
  const container = {
    register: jest.fn(async () => registration),
    ready: Promise.resolve(registration),
    controller: controlled ? active : null,
  } as unknown as ServiceWorkerContainer;
  return { active, container, registration };
}

describe("offline app readiness separate from verified audio", () => {
  it("prepares and verifies the private review shell", async () => {
    const prepare = jest.fn(async () => ({ controlled: true, complete: true }));
    const gate = new PwaShellReadiness(
      { prepare },
      pwaShellPolicy(`https://${PRIVATE_REVIEW_HOST}`),
    );
    expect(gate.getSnapshot()).toBe("unchecked");
    await gate.check();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(gate.getSnapshot()).toBe("ready");
    const privateOrigin = `https://${PRIVATE_REVIEW_HOST}`;
    const { active, container } = browser(true, false, privateOrigin);
    const verify = jest.fn(async () => true);
    await expect(
      prepareBrowserShell(container, privateOrigin, verify),
    ).resolves.toEqual({ controlled: true, complete: true });
    expect(container.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(verify).toHaveBeenCalledWith(active);
  });
  it.each([
    "http://localhost:8096",
    "https://another.chatgpt.site",
    `https://${PRIVATE_REVIEW_HOST}.example.org`,
  ])("preserves ordinary shell policy for %s", (origin) => {
    expect(pwaShellPolicy(origin)).toBe("offline-shell");
  });
  it("does not equate an activated first install with a controlled page", async () => {
    const { container } = browser(false);
    const result = await prepareBrowserShell(
      container,
      "https://app.test",
      async () => true,
    );
    expect(result).toEqual({ complete: true, controlled: false });
    const gate = new PwaShellReadiness({ prepare: async () => result });
    await gate.check();
    expect(gate.getSnapshot()).toBe("reopen");
  });
  it("requires registration, ready, exact controller and complete shell before readiness", async () => {
    const { active, container } = browser();
    const verify = jest.fn(async () => true);
    const gate = new PwaShellReadiness({
      prepare: () => prepareBrowserShell(container, "https://app.test", verify),
    });
    await gate.check();
    expect(container.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(verify).toHaveBeenCalledWith(active);
    expect(gate.getSnapshot()).toBe("ready");
  });
  it("does not declare a waiting update ready or force client takeover", async () => {
    const { container } = browser(true, true);
    expect(
      await prepareBrowserShell(
        container,
        "https://app.test",
        async () => true,
      ),
    ).toEqual({ complete: true, controlled: false });
  });
  it("fails closed for a missing cache, unsupported browser or rejected registration", async () => {
    for (const port of [
      null,
      { prepare: async () => ({ controlled: true, complete: false }) },
      {
        prepare: async () => {
          throw new Error("registration rejected");
        },
      },
    ]) {
      const gate = new PwaShellReadiness(port);
      await gate.check();
      expect(gate.getSnapshot()).toBe("unavailable");
    }
  });
  it("deduplicates preparation and permits explicit retry after failure", async () => {
    const prepare = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ controlled: true, complete: true });
    const gate = new PwaShellReadiness({ prepare });
    const first = gate.check();
    expect(gate.check()).toBe(first);
    await first;
    await gate.check();
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(gate.getSnapshot()).toBe("ready");
  });
  it("bounds a never-ready registration instead of waiting forever", async () => {
    jest.useFakeTimers();
    try {
      const { container } = browser();
      Object.defineProperty(container, "ready", {
        value: new Promise(() => {}),
      });
      const gate = new PwaShellReadiness({
        prepare: () => prepareBrowserShell(container, "https://app.test"),
      });
      const check = gate.check();
      await jest.advanceTimersByTimeAsync(45001);
      await check;
      expect(gate.getSnapshot()).toBe("unavailable");
    } finally {
      jest.useRealTimers();
    }
  });
});

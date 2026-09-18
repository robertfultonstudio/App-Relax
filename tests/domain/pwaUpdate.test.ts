import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { PRIVATE_REVIEW_HOST } from "@/offline/pwaShellPolicy";

const script = readFileSync(
  join(process.cwd(), "public-pwa/pwa-update.js"),
  "utf8",
);
const hostname = PRIVATE_REVIEW_HOST;

function harness(registration?: { scope: string; unregister: jest.Mock }) {
  const callbacks = new Map<string, () => Promise<void>>();
  const elements = new Map(
    ["update", "online", "status"].map((id) => [
      id,
      {
        disabled: false,
        hidden: id === "online",
        textContent: "",
        addEventListener: (_event: string, callback: () => Promise<void>) =>
          callbacks.set(id, callback),
      },
    ]),
  );
  const serviceWorker = {
    getRegistration: jest.fn(async () => registration),
    register: jest.fn(async () => ({
      scope: `https://${hostname}/`,
      update: jest.fn(async () => undefined),
      installing: null,
      waiting: null,
    })),
  };
  const replace = jest.fn();
  runInNewContext(script, {
    URL,
    Error,
    navigator: { serviceWorker },
    document: { getElementById: (id: string) => elements.get(id) },
    window: { location: { hostname, origin: `https://${hostname}`, replace } },
  });
  return { callbacks, elements, replace, serviceWorker };
}

it("installs the private root shell before opening the app", async () => {
  const h = harness();
  await h.callbacks.get("update")!();
  expect(h.replace).toHaveBeenCalledWith("/");
  expect(h.serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  expect(h.elements.get("online")?.hidden).toBe(true);
});

it.each([true, false])(
  "updates without retiring an existing root registration (unregister=%s)",
  async (result) => {
    const unregister = jest.fn(async () => result);
    const h = harness({ scope: `https://${hostname}/`, unregister });
    await h.callbacks.get("update")!();
    expect(unregister).not.toHaveBeenCalled();
    expect(h.replace).toHaveBeenCalledWith("/");
    expect(h.serviceWorker.register).toHaveBeenCalledTimes(1);
  },
);

it.each([`https://${hostname}/other/`, "https://other.example/"])(
  "preserves foreign scope during explicit online recovery %s",
  async (scope) => {
    const unregister = jest.fn();
    const h = harness({ scope, unregister });
    await h.callbacks.get("online")!();
    expect(unregister).not.toHaveBeenCalled();
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.elements.get("status")?.textContent).toContain(
      "Unexpected app scope",
    );
  },
);

it("explicit online recovery handles an already absent registration", async () => {
  const h = harness();
  await h.callbacks.get("online")!();
  expect(h.replace).toHaveBeenCalledWith("/");
  expect(script).not.toMatch(
    /caches\.delete|localStorage\.clear|indexedDB\.deleteDatabase|getDirectory|removeEntry/,
  );
});

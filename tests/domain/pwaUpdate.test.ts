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
    register: jest.fn(async () => {
      throw new Error("Must not install a private shell");
    }),
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

it("opens the online private app without creating a missing service worker", async () => {
  const h = harness();
  await h.callbacks.get("update")!();
  expect(h.replace).toHaveBeenCalledWith("/");
  expect(h.serviceWorker.register).not.toHaveBeenCalled();
  expect(h.elements.get("online")?.hidden).toBe(true);
});

it.each([true, false])(
  "opens after root registration retirement (unregister=%s)",
  async (result) => {
    const unregister = jest.fn(async () => result);
    const h = harness({ scope: `https://${hostname}/`, unregister });
    await h.callbacks.get("update")!();
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(h.replace).toHaveBeenCalledWith("/");
    expect(h.serviceWorker.register).not.toHaveBeenCalled();
  },
);

it.each([`https://${hostname}/other/`, "https://other.example/"])(
  "preserves foreign scope %s",
  async (scope) => {
    const unregister = jest.fn();
    const h = harness({ scope, unregister });
    await h.callbacks.get("update")!();
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

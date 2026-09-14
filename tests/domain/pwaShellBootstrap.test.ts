import { runInNewContext } from "node:vm";
import { PWA_SHELL_BOOTSTRAP } from "@/pwa-review/pwaShellBootstrap";

describe("private review shell bootstrap", () => {
  it.each([
    {
      hostname: "app-relax-private-review.robfulton.chatgpt.site",
      scopePath: "/",
      retire: true,
      install: false,
    },
    {
      hostname: "app-relax-private-review.robfulton.chatgpt.site",
      scopePath: "/another-app/",
      retire: false,
      install: false,
    },
    { hostname: "localhost", scopePath: "/", retire: false, install: true },
    {
      hostname: "another.chatgpt.site",
      scopePath: "/",
      retire: false,
      install: true,
    },
  ])(
    "does not serve an old private shell, without touching unrelated registrations: $hostname $scopePath",
    async ({ hostname, scopePath, retire, install }) => {
      const unregister = jest.fn(async () => true);
      const register = jest.fn(async () => undefined);
      const getRegistration = jest.fn(async () => ({
        scope: `https://${hostname}${scopePath}`,
        unregister,
      }));
      const warn = jest.fn();
      let load: (() => Promise<void>) | undefined;
      runInNewContext(PWA_SHELL_BOOTSTRAP, {
        URL,
        console: { warn },
        navigator: { serviceWorker: { getRegistration, register } },
        window: {
          location: { hostname, origin: `https://${hostname}` },
          addEventListener: (_type: string, callback: () => Promise<void>) => {
            load = callback;
          },
        },
      });
      await load?.();
      expect(unregister).toHaveBeenCalledTimes(retire ? 1 : 0);
      expect(register).toHaveBeenCalledTimes(install ? 1 : 0);
      expect(warn).not.toHaveBeenCalled();
      expect(PWA_SHELL_BOOTSTRAP).not.toMatch(
        /caches\.delete|\.clear\(|clients\.claim|\.reload\(|\.replace\(/,
      );
    },
  );
});

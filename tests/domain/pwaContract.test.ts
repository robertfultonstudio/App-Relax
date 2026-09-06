import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { PwaWebAudioSourceResolver } from "@/audio/web/PwaWebAudioSourceResolver";
import {
  CONSUMER_AUDIO_WORKS,
  getVisibleConsumerWorks,
} from "@/content/consumerCatalog";
import {
  getPwaOutcomeStaticParams,
  getPwaWorkStaticParams,
} from "@/content/pwaStaticRoutes";
import { isPwaWebSurface } from "@/domain/sessions/playbackAvailability";
import {
  APPROVED_DOWNLOAD_MANIFEST,
  STARTER_PACKAGE_ID,
  STARTER_WORK_IDS,
} from "@/offline/approvedDownloads";

const projectRoot = process.cwd();

describe("PWA contract", () => {
  it("generates concrete routes only for PWA-deliverable works", () => {
    const outcomes = getPwaOutcomeStaticParams().map(
      ({ outcomeId }) => outcomeId,
    );
    const works = getPwaWorkStaticParams().map(({ workId }) => workId);

    expect(outcomes).toEqual([
      "meditation",
      "yoga",
      "massage",
      "relax",
      "sleep",
      "focus",
    ]);
    expect(new Set(works).size).toBe(45);
    expect(works).toHaveLength(45);
    for (const forbidden of [
      "soft-air",
      "moon-drone",
      "deep-river",
      "eclipse-veil",
      "stillwater-halo",
    ])
      expect(works).not.toContain(forbidden);
  });

  it("resolves only same-origin catalog files and never technical stems", () => {
    const resolver = new PwaWebAudioSourceResolver();
    const localWork = CONSUMER_AUDIO_WORKS.find(
      ({ availability }) => availability === "local-preview-file",
    );
    const embeddedWork = CONSUMER_AUDIO_WORKS.find(
      ({ availability }) => availability === "embedded-wav",
    );
    expect(localWork).toBeDefined();
    expect(embeddedWork).toBeDefined();
    expect(resolver.resolveWork(localWork!)).toBe(
      `/audio-catalog/${encodeURIComponent(localWork!.localPreviewFilename!)}`,
    );
    expect(resolver.resolveWork(embeddedWork!)).toBeNull();
    expect(resolver.resolveStem("sleepDrone001")).toBeNull();
  });

  it("declares a complete installable shell while excluding audio from its cache", () => {
    const manifest = JSON.parse(
      readFileSync(
        join(projectRoot, "public-pwa", "manifest.webmanifest"),
        "utf8",
      ),
    );
    const serviceWorker = readFileSync(
      join(projectRoot, "public-pwa", "sw.js"),
      "utf8",
    );

    expect(manifest).toMatchObject({
      name: "App Relax",
      short_name: "App Relax",
      display: "standalone",
      scope: "/",
      start_url: "/",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
    expect(serviceWorker).toContain('request.headers.has("range")');
    expect(serviceWorker).toContain(
      'url.pathname.startsWith("/audio-catalog/")',
    );
    expect(serviceWorker).toContain(
      'key.startsWith("ritual-audio-shell-") && key !== SHELL_CACHE',
    );
    expect(serviceWorker).not.toContain('key.startsWith("ritual-audio-")');
    expect(serviceWorker).toContain('importScripts("/precache-manifest.js")');
    expect(serviceWorker).toContain("for (const url of manifest.urls)");
    expect(serviceWorker).not.toContain("self.skipWaiting(");
    expect(serviceWorker).not.toContain("self.clients.claim(");
    expect(serviceWorker.indexOf("isAudioRequest(request, url)")).toBeLessThan(
      serviceWorker.indexOf(
        "event.respondWith",
        serviceWorker.indexOf("fetch"),
      ),
    );
    expect(serviceWorker).toContain(
      '? (await cache.match("/offline.html")) || Response.error()',
    );
    expect(serviceWorker).not.toContain(
      '(await caches.match(request)) ||\n            (await caches.match("/offline.html"))',
    );
    expect(serviceWorker).toContain(
      "const cached = await cache.match(canonical)",
    );
    expect(serviceWorker).not.toContain("await caches.match(request)");
  });

  it("offers selective verified audio packages separately from shell caching", () => {
    const { assets, packages } = APPROVED_DOWNLOAD_MANIFEST;
    expect(assets).toHaveLength(37);
    expect(packages).toHaveLength(38);
    for (const asset of assets) {
      expect(getConsumerWorkForDownload(asset.workId)).toBe(true);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(
        packages.find(({ packageId }) => packageId === asset.workId),
      ).toMatchObject({ assetIds: [asset.assetId], totalBytes: asset.bytes });
    }
    const starter = packages.find(
      ({ packageId }) => packageId === STARTER_PACKAGE_ID,
    )!;
    expect(STARTER_WORK_IDS).toHaveLength(3);
    expect(starter.assetIds).toEqual(
      STARTER_WORK_IDS.map((id) => `audio.${id}`),
    );
    expect(starter.totalBytes).toBe(
      assets
        .filter(({ workId }) =>
          (STARTER_WORK_IDS as readonly string[]).includes(workId),
        )
        .reduce((total, asset) => total + asset.bytes, 0),
    );
    expect(starter.totalBytes).toBeLessThan(
      assets.reduce((total, asset) => total + asset.bytes, 0),
    );
    expect(
      packages.every(
        ({ assetIds }) => assetIds.length === 1 || assetIds.length === 3,
      ),
    ).toBe(true);
    for (const forbidden of [
      "soft-air",
      "moon-drone",
      "deep-river",
      "eclipse-veil",
      "stillwater-halo",
    ]) {
      expect(assets.map(({ workId }) => workId)).not.toContain(forbidden);
    }
  });

  it("removes only an obsolete shell cache, retaining the current shell, downloaded audio and other apps", async () => {
    const handlers: Record<
      string,
      (event: { waitUntil(task: Promise<unknown>): void }) => void
    > = {};
    const currentCache = `ritual-audio-shell-${"a".repeat(64)}`;
    const deleteCache = jest.fn(async (_key: string) => true);
    const openCache = jest.fn();
    runInNewContext(
      readFileSync(join(projectRoot, "public-pwa", "sw.js"), "utf8"),
      {
        importScripts: () => undefined,
        self: {
          APP_RELAX_PRECACHE: { revision: "a".repeat(64), urls: [] },
          addEventListener: (
            type: string,
            handler: (typeof handlers)[string],
          ) => {
            handlers[type] = handler;
          },
        },
        caches: {
          keys: async () => [
            "ritual-audio-shell-old",
            currentCache,
            "ritual-audio-download-approved",
            "another-app-cache",
          ],
          delete: deleteCache,
          open: openCache,
        },
      },
    );
    let activation: Promise<unknown> | undefined;
    handlers.activate({
      waitUntil: (task) => {
        activation = task;
      },
    });
    await activation;
    expect(deleteCache).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledWith("ritual-audio-shell-old");
    expect(openCache).not.toHaveBeenCalled();
  });

  it("uses an explicit build flag to identify the PWA surface", () => {
    const previous = process.env.EXPO_PUBLIC_APP_RELAX_PWA;
    try {
      process.env.EXPO_PUBLIC_APP_RELAX_PWA = "1";
      expect(isPwaWebSurface()).toBe(true);
      process.env.EXPO_PUBLIC_APP_RELAX_PWA = "0";
      expect(isPwaWebSurface()).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_APP_RELAX_PWA;
      else process.env.EXPO_PUBLIC_APP_RELAX_PWA = previous;
    }
  });

  it("keeps embedded test-pack works out of PWA consumer lists", () => {
    const previous = process.env.EXPO_PUBLIC_APP_RELAX_PWA;
    try {
      process.env.EXPO_PUBLIC_APP_RELAX_PWA = "1";
      for (const forbidden of ["soft-air", "moon-drone", "deep-river"]) {
        expect(getVisibleConsumerWorks().map(({ id }) => id)).not.toContain(
          forbidden,
        );
      }
      expect(getVisibleConsumerWorks()).toHaveLength(45);
    } finally {
      if (previous === undefined) delete process.env.EXPO_PUBLIC_APP_RELAX_PWA;
      else process.env.EXPO_PUBLIC_APP_RELAX_PWA = previous;
    }
  });
});

function getConsumerWorkForDownload(workId: string): boolean {
  return CONSUMER_AUDIO_WORKS.some(
    (work) =>
      work.id === workId &&
      work.sourceKind === "file" &&
      work.listeningStatus === "APPROVED — LISTENING PASSED" &&
      work.availability === "local-preview-file",
  );
}

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import WebSocket from "ws";

const baseUrl = process.env.APP_RELAX_VISUAL_BASE_URL;
const screenshotRoot = process.env.APP_RELAX_VISUAL_SCREENSHOT_DIR;
const visualGateRequired = process.env.APP_RELAX_VISUAL_REQUIRED === "1";
const visualContractOnly = process.env.APP_RELAX_VISUAL_CONTRACT_ONLY === "1";
const chromeCandidates = [
  process.env.APP_RELAX_CHROME_BINARY,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromeBinary =
  chromeCandidates.find((candidate) => existsSync(candidate)) ?? "";

const forbiddenLegacyCopy = [
  "A little space for you",
  "Make room for quiet.",
  "Press Play. Leave the phone behind.",
  "What do you need right now?",
  "Start your yoga session",
  "Relax now",
];

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForFile(path, child) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (existsSync(path)) return;
    if (child.exitCode !== null)
      throw new Error(`Chrome exited before creating ${path}`);
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${path}`);
}

async function openProtocol(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) {
      if (
        message.method === "Runtime.exceptionThrown" ||
        message.method === "Runtime.consoleAPICalled"
      )
        events.push(message);
      return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    close: () => socket.close(),
    events,
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function launchChrome(context) {
  assert.ok(existsSync(chromeBinary), `Chrome not found at ${chromeBinary}`);
  const profile = mkdtempSync(join(tmpdir(), "app-relax-visual-runtime-"));
  const chrome = spawn(
    chromeBinary,
    [
      "--headless=new",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--hide-scrollbars",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  context.after(async () => {
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    for (
      let attempt = 0;
      attempt < 40 && chrome.exitCode === null;
      attempt += 1
    )
      await delay(25);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        rmSync(profile, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 19) throw error;
        await delay(25);
      }
    }
  });
  const portFile = join(profile, "DevToolsActivePort");
  await waitForFile(portFile, chrome);
  const [port] = readFileSync(portFile, "utf8").trim().split("\n");
  let target = null;
  let lastTargetError = null;
  for (let attempt = 0; attempt < 80 && !target; attempt += 1) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/json/new?about:blank`,
        { method: "PUT" },
      );
      if (!response.ok) throw new Error(`DevTools HTTP ${response.status}`);
      target = await response.json();
    } catch (error) {
      lastTargetError = error;
      if (chrome.exitCode !== null)
        throw new Error("Chrome exited before DevTools became ready", {
          cause: error,
        });
      await delay(50);
    }
  }
  if (!target)
    throw new Error("Timed out waiting for the Chrome DevTools endpoint", {
      cause: lastTargetError,
    });
  const protocol = await openProtocol(target.webSocketDebuggerUrl);
  context.after(() => protocol.close());
  await protocol.send("Page.enable");
  await protocol.send("Runtime.enable");
  return protocol;
}

async function evaluate(protocol, expression) {
  const result = await protocol.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.text ?? "Runtime evaluation failed",
    );
  return result.result.value;
}

async function waitForArtwork(protocol, testID) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const ready = await evaluate(
      protocol,
      `Boolean(document.querySelector('[data-testid="${testID}"]'))`,
    );
    if (ready) {
      await evaluate(protocol, "document.fonts.ready.then(() => true)");
      return;
    }
    await delay(50);
  }
  const diagnostic = await evaluate(
    protocol,
    `({
      body: document.body?.innerText?.slice(0, 500),
      html: document.body?.innerHTML?.slice(0, 1000),
      images: [...document.images].map((image) => ({ src: image.currentSrc, testID: image.dataset.testid })),
      readyState: document.readyState,
      resources: performance.getEntriesByType("resource").map((entry) => ({ name: entry.name, duration: entry.duration, transferSize: entry.transferSize })),
      scripts: [...document.scripts].map((script) => script.src),
      title: document.title,
      url: location.href,
    })`,
  );
  throw new Error(
    `Timed out waiting for ${testID}: ${JSON.stringify({ diagnostic, events: protocol.events })}`,
  );
}

async function inspectArtwork(protocol, testID) {
  return evaluate(
    protocol,
    `(() => {
      const image = document.querySelector('[data-testid="${testID}"]');
      if (!image) return null;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {
        tagName: image.tagName,
        objectFit: style.objectFit,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    })()`,
  );
}

async function waitForCondition(protocol, expression, label, attempts = 400) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(protocol, expression)) return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function clickSelector(protocol, selector) {
  let rect = null;
  for (let attempt = 0; attempt < 400; attempt += 1) {
    rect = await evaluate(
      protocol,
      `(() => {
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target || target.getAttribute("aria-disabled") === "true" || target.disabled) return null;
        const bounds = target.getBoundingClientRect();
        if (bounds.width < 1 || bounds.height < 1) return null;
        return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      })()`,
    );
    if (rect) break;
    await delay(50);
  }
  assert.ok(rect, `${selector} did not become clickable`);
  await protocol.send("Input.dispatchMouseEvent", {
    button: "left",
    buttons: 1,
    clickCount: 1,
    type: "mousePressed",
    x: rect.x,
    y: rect.y,
  });
  await protocol.send("Input.dispatchMouseEvent", {
    button: "left",
    buttons: 0,
    clickCount: 1,
    type: "mouseReleased",
    x: rect.x,
    y: rect.y,
  });
}

async function saveScreenshot(protocol, viewport, name) {
  if (!screenshotRoot) return;
  const destination = join(
    screenshotRoot,
    `${viewport.width}x${viewport.height}`,
    `${name}.png`,
  );
  mkdirSync(dirname(destination), { recursive: true });
  const shot = await protocol.send("Page.captureScreenshot", {
    captureBeyondViewport: false,
    format: "png",
    fromSurface: true,
  });
  writeFileSync(destination, Buffer.from(shot.data, "base64"));
}

test("the mandatory visual gate cannot silently skip", () => {
  if (!visualGateRequired) return;
  assert.ok(baseUrl, "APP_RELAX_VISUAL_BASE_URL is required");
  assert.ok(screenshotRoot, "APP_RELAX_VISUAL_SCREENSHOT_DIR is required");
  assert.ok(chromeBinary, "Chrome/Chromium is required");
});

test(
  "first entry bypasses the rejected landing and opens the immersive Home",
  { skip: !baseUrl },
  async (context) => {
    const protocol = await launchChrome(context);
    const viewport = { width: 390, height: 844 };
    await protocol.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile: false,
      screenHeight: viewport.height,
      screenWidth: viewport.width,
      width: viewport.width,
    });
    await protocol.send("Page.navigate", { url: new URL("/", baseUrl).href });
    await waitForCondition(
      protocol,
      `document.readyState === "complete" && Boolean(document.body)`,
      "first entry",
    );
    await delay(350);
    await saveScreenshot(protocol, viewport, "contract/first-entry");
    const entry = await evaluate(
      protocol,
      `({
        body: document.body.innerText,
        hasHome: Boolean(document.querySelector('[data-testid="home-full-bleed-artwork"]')),
        hasRejectedLanding: Boolean(document.querySelector('[data-testid="welcome-screen"]')),
        path: location.pathname,
      })`,
    );
    assert.equal(
      entry.hasRejectedLanding,
      false,
      "rejected landing resurfaced",
    );
    assert.equal(entry.hasHome, true, "immersive Home did not open");
    assert.equal(entry.path, "/moments", "first entry did not resolve to Home");
    for (const copy of forbiddenLegacyCopy)
      assert.ok(!entry.body.includes(copy), `legacy copy resurfaced: ${copy}`);
  },
);

test(
  "every activity uses a full-bleed scene and rejects framed legacy layouts",
  { skip: !baseUrl },
  async (context) => {
    const protocol = await launchChrome(context);
    const viewport = { width: 390, height: 844 };
    await protocol.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile: false,
      screenHeight: viewport.height,
      screenWidth: viewport.width,
      width: viewport.width,
    });
    const violations = [];
    for (const outcome of [
      "meditation",
      "yoga",
      "massage",
      "relax",
      "sleep",
      "focus",
    ]) {
      await protocol.send("Page.navigate", {
        url: new URL(`/outcome/${outcome}?review=0`, baseUrl).href,
      });
      await waitForCondition(
        protocol,
        `Boolean(document.querySelector('[data-testid="consumer-screen-title"]'))`,
        `${outcome} activity`,
      );
      await saveScreenshot(protocol, viewport, `contract/outcome-${outcome}`);
      const surface = await evaluate(
        protocol,
        `(() => {
          const artwork = document.querySelector('[data-testid="${outcome}-full-bleed-artwork"], [data-testid="outcome-full-bleed-artwork"]');
          const rect = artwork?.getBoundingClientRect();
          return {
            body: document.body.innerText,
            fullBleed: Boolean(rect && Math.abs(rect.left) <= 1 && Math.abs(rect.top) <= 1 && Math.abs(rect.width - innerWidth) <= 1 && Math.abs(rect.height - innerHeight) <= 1),
          };
        })()`,
      );
      if (!surface.fullBleed)
        violations.push(`${outcome}: artwork is framed instead of full-bleed`);
      for (const copy of forbiddenLegacyCopy)
        if (surface.body.includes(copy))
          violations.push(`${outcome}: legacy copy resurfaced: ${copy}`);
    }
    assert.deepEqual(violations, []);
  },
);

test(
  "Home, Yoga and Player artwork cover both frozen mobile canvases at runtime",
  { skip: !baseUrl },
  async (context) => {
    const protocol = await launchChrome(context);
    const measurements = [];
    const screens = [
      {
        name: "home",
        path: "/moments?review=0",
        testID: "home-full-bleed-artwork",
      },
      {
        name: "yoga",
        path: "/outcome/yoga?review=0",
        testID: "yoga-full-bleed-artwork",
      },
      {
        name: "player",
        path: "/listen/respiro-hatha-1-01?outcome=yoga&duration=30&nature=off&review=0",
        testID: "player-full-bleed-artwork",
      },
    ];

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await protocol.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: 1,
        height: viewport.height,
        mobile: false,
        screenHeight: viewport.height,
        screenWidth: viewport.width,
        width: viewport.width,
      });
      for (const screen of screens) {
        await protocol.send("Page.navigate", {
          url: new URL(screen.path, baseUrl).href,
        });
        await waitForArtwork(protocol, screen.testID);
        const measurement = await inspectArtwork(protocol, screen.testID);
        assert.ok(measurement, `${screen.name} artwork was not mounted`);
        assert.equal(measurement.tagName, "IMG");
        assert.equal(measurement.objectFit, "cover");
        assert.ok(
          Math.abs(measurement.left) <= 1,
          `${screen.name} left edge ${measurement.left}`,
        );
        assert.ok(
          Math.abs(measurement.top) <= 1,
          `${screen.name} top edge ${measurement.top}`,
        );
        assert.ok(
          Math.abs(measurement.width - measurement.viewportWidth) <= 1,
          `${screen.name} width ${measurement.width} != ${measurement.viewportWidth}`,
        );
        assert.ok(
          Math.abs(measurement.height - measurement.viewportHeight) <= 1,
          `${screen.name} height ${measurement.height} != ${measurement.viewportHeight}`,
        );
        assert.ok(
          measurement.naturalWidth >= measurement.viewportWidth * 2,
          `${screen.name} intrinsic width ${measurement.naturalWidth} is below 200%`,
        );
        assert.ok(
          measurement.naturalHeight >= measurement.viewportHeight * 2,
          `${screen.name} intrinsic height ${measurement.naturalHeight} is below 200%`,
        );
        if (screen.name === "player") {
          const headings = await evaluate(
            protocol,
            `[...document.querySelectorAll('[role="heading"]')].map((node) => node.textContent?.trim())`,
          );
          assert.ok(headings.includes("Un respiro alla volta."));
          assert.ok(!documentContains(headings, "Presenza minima"));
          assert.ok(
            await evaluate(
              protocol,
              `document.body.innerText.includes("La natura ti renderà consapevole.")`,
            ),
          );
        }
        measurements.push({
          screen: screen.name,
          viewport: `${viewport.width}x${viewport.height}`,
          ...measurement,
        });
        await saveScreenshot(protocol, viewport, screen.name);
      }
    }
    if (screenshotRoot) {
      mkdirSync(screenshotRoot, { recursive: true });
      writeFileSync(
        join(screenshotRoot, "measurements.json"),
        `${JSON.stringify(measurements, null, 2)}\n`,
      );
    }
  },
);

test(
  "captures hydrated Home, Yoga and Player at 200 percent device sharpness",
  { skip: !baseUrl || !screenshotRoot || visualContractOnly },
  async (context) => {
    const viewport = { width: 430, height: 932 };
    const protocol = await launchChrome(context);
    await protocol.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 2,
      height: viewport.height,
      mobile: false,
      screenHeight: viewport.height,
      screenWidth: viewport.width,
      width: viewport.width,
    });

    await protocol.send("Page.navigate", {
      url: new URL("/moments?review=0", baseUrl).href,
    });
    await waitForArtwork(protocol, "home-full-bleed-artwork");
    await saveScreenshot(protocol, viewport, "sharpness-200/home");

    await clickSelector(protocol, '[data-testid="outcome-yoga"]');
    await waitForArtwork(protocol, "yoga-full-bleed-artwork");
    await waitForCondition(
      protocol,
      `(() => {
        const start = document.querySelector('[data-testid="start-immediate-session"]');
        return Boolean(start) && start.getAttribute("aria-disabled") !== "true" && !start.disabled;
      })()`,
      "Yoga Play ready at 200 percent",
    );
    await saveScreenshot(protocol, viewport, "sharpness-200/yoga-ready");

    await clickSelector(protocol, '[data-testid="start-immediate-session"]');
    await waitForArtwork(protocol, "player-full-bleed-artwork");
    await waitForCondition(
      protocol,
      `Boolean(document.querySelector('[aria-label="Pausa"]'))`,
      "visible Player controls at 200 percent",
    );
    await saveScreenshot(protocol, viewport, "sharpness-200/player-controls");
  },
);

test(
  "captures first-run, returning, Yoga and hydrated Player states at both frozen viewports",
  { skip: !baseUrl || !screenshotRoot || visualContractOnly },
  async (context) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      const protocol = await launchChrome(context);
      await protocol.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: 1,
        height: viewport.height,
        mobile: false,
        screenHeight: viewport.height,
        screenWidth: viewport.width,
        width: viewport.width,
      });

      await protocol.send("Page.navigate", { url: new URL("/", baseUrl).href });
      await waitForCondition(
        protocol,
        `Boolean(document.querySelector('[data-testid="welcome-screen"]'))`,
        "first-run welcome",
      );
      await saveScreenshot(protocol, viewport, "states/landing");
      await clickSelector(protocol, '[data-testid="welcome-enter"]');
      await waitForArtwork(protocol, "home-full-bleed-artwork");
      await saveScreenshot(protocol, viewport, "states/home-after-welcome");

      await protocol.send("Page.navigate", { url: new URL("/", baseUrl).href });
      await waitForArtwork(protocol, "home-full-bleed-artwork");
      await waitForCondition(
        protocol,
        `location.pathname === "/moments"`,
        "returning root redirect",
      );
      await saveScreenshot(protocol, viewport, "states/returning-root");

      await clickSelector(protocol, '[data-testid="outcome-yoga"]');
      await waitForArtwork(protocol, "yoga-full-bleed-artwork");
      await waitForCondition(
        protocol,
        `location.pathname === "/outcome/yoga"`,
        "Yoga route",
      );
      await waitForCondition(
        protocol,
        `(() => {
          const start = document.querySelector('[data-testid="start-immediate-session"]');
          return Boolean(start) && start.getAttribute("aria-disabled") !== "true" && !start.disabled;
        })()`,
        "Yoga Play ready",
      );
      await saveScreenshot(protocol, viewport, "states/yoga-ready");

      await clickSelector(protocol, '[data-testid="start-immediate-session"]');
      await waitForArtwork(protocol, "player-full-bleed-artwork");
      await waitForCondition(
        protocol,
        `location.pathname.startsWith("/listen/")`,
        "Player route",
      );
      const pauseSelector = '[aria-label="Pausa"]';
      const sceneSelector = '[data-testid="consumer-listening-scene"]';
      if (
        !(await evaluate(
          protocol,
          `Boolean(document.querySelector('${pauseSelector}'))`,
        ))
      )
        await clickSelector(protocol, sceneSelector);
      await waitForCondition(
        protocol,
        `Boolean(document.querySelector('${pauseSelector}'))`,
        "visible Player controls",
      );
      await saveScreenshot(protocol, viewport, "states/player-controls");

      await waitForCondition(
        protocol,
        `Boolean(document.querySelector('${sceneSelector}'))`,
        "immersive Player",
      );
      await saveScreenshot(protocol, viewport, "states/player-immersive");

      await clickSelector(protocol, sceneSelector);
      await clickSelector(protocol, pauseSelector);
      await waitForCondition(
        protocol,
        `Boolean(document.querySelector('[aria-label="Riprendi"]'))`,
        "paused Player",
      );
      await saveScreenshot(protocol, viewport, "states/player-paused");
      await clickSelector(protocol, '[aria-label="Interrompi"]');
      await waitForArtwork(protocol, "yoga-full-bleed-artwork");
    }
  },
);

function documentContains(values, value) {
  return values.some((entry) => entry === value);
}

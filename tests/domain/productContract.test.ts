import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..", "..");

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe("product and asset request contracts", () => {
  it("keeps AUDIO TEST PACK 01 locked to exactly three requested files", () => {
    const request = readFileSync(
      join(projectRoot, "docs", "AUDIO_REQUESTS.md"),
      "utf8",
    );
    expect(request).toContain("LOCKED");
    const names = [...request.matchAll(/`(SLEEP_[A-Z]+_001\.wav)`/g)].map(
      (match) => match[1],
    );
    expect(names).toEqual([
      "SLEEP_DRONE_001.wav",
      "SLEEP_AMBIENCE_001.wav",
      "SLEEP_TEXTURE_001.wav",
    ]);
  });

  it("contains every required route and no expanded session catalog", () => {
    const appFiles = readdirSync(join(projectRoot, "src", "app"));
    expect(appFiles).toEqual(
      expect.arrayContaining([
        "_layout.tsx",
        "index.tsx",
        "legal.tsx",
        "settings.tsx",
      ]),
    );
    expect(
      existsSync(
        join(projectRoot, "src", "app", "category", "[categoryId].tsx"),
      ),
    ).toBe(true);
    expect(
      existsSync(join(projectRoot, "src", "app", "session", "[sessionId].tsx")),
    ).toBe(true);
    const registry = readFileSync(
      join(projectRoot, "src", "presets", "presetRegistry.ts"),
      "utf8",
    );
    expect(registry).not.toMatch(
      /Yoga Flow|Wellness Session|Meditation Background/,
    );
  });

  it("does not introduce prohibited affirmative marketing phrases", () => {
    const appDirectory = join(projectRoot, "src", "app");
    const copy = listFiles(appDirectory)
      .filter((path) => path.endsWith(".tsx"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(copy).not.toMatch(
      /repair DNA|tinnitus treatment|clinically proven|guaranteed healing/i,
    );
    expect(copy).toContain("does not diagnose, treat, cure or prevent");
  });
});

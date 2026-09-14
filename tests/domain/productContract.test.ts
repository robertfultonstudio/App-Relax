import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";

const projectRoot = join(__dirname, "..", "..");

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe("product and asset request contracts", () => {
  it("keeps functionality and time-to-sound first in adaptive sessions", () => {
    expect(CONSUMER_OUTCOMES.map((outcome) => outcome.functionLabel)).toEqual([
      "MEDITATION",
      "YOGA",
      "MASSAGE",
      "RELAX",
      "SLEEP",
      "FOCUS",
    ]);
    expect(CONSUMER_OUTCOMES[0]).toEqual(
      expect.objectContaining({
        id: "meditation",
        cta: "Begin meditation",
      }),
    );
    expect(CONSUMER_OUTCOMES.find((outcome) => outcome.id === "yoga")).toEqual(
      expect.objectContaining({
        cta: "Start your yoga session",
        plannedFormat: "20 / 30 / 45 / 60 / 90 min",
        evocativeTitle: "Cedar Ascent",
      }),
    );
    expect(
      CONSUMER_OUTCOMES.every(
        (outcome) =>
          !Object.hasOwn(outcome, "audioPresetId") &&
          !Object.hasOwn(outcome, "playerRoute"),
      ),
    ).toBe(true);
  });

  it("registers exactly one validated painterly artwork for every consumer outcome", () => {
    const manifest = JSON.parse(
      readFileSync(
        join(projectRoot, "assets", "images", "outcomes", "manifest.json"),
        "utf8",
      ),
    ) as { assets: { key: string; width: number; height: number }[] };

    const outcomeIds = CONSUMER_OUTCOMES.map((outcome) => outcome.id).sort();
    expect(manifest.assets.map((asset) => asset.key).sort()).toEqual(
      outcomeIds,
    );
    expect(Object.keys(OUTCOME_ARTWORK).sort()).toEqual(outcomeIds);
    expect(
      manifest.assets.every(
        (asset) => asset.width === 720 && asset.height === 720,
      ),
    ).toBe(true);
  });

  it("keeps AUDIO TEST PACK 01 integrated and limited to exactly three canonical files", () => {
    const request = readFileSync(
      join(projectRoot, "docs", "AUDIO_REQUESTS.md"),
      "utf8",
    );
    expect(request).toContain("RICEVUTO E CONFINATO IN AUDIO TEST / TEST ONLY");
    expect(request).toContain("Non richiedere cover");
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
        "audio-test.tsx",
        "index.tsx",
        "legal.tsx",
        "settings.tsx",
        "soundscapes.tsx",
        "yoga.tsx",
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

    const player = readFileSync(
      join(projectRoot, "src", "app", "session", "[sessionId].tsx"),
      "utf8",
    );
    expect(player).toContain('label="Volume & mute"');
    expect(player).toContain('label="Test details"');
    expect(player).toContain("TEST ONLY");
  });

  it("keeps the technical preset isolated while consumer works use a separate registry", () => {
    const rituals = readFileSync(
      join(projectRoot, "src", "content", "rituals.ts"),
      "utf8",
    );
    const shell = readFileSync(
      join(projectRoot, "src", "content", "productShell.ts"),
      "utf8",
    );
    const home = readFileSync(
      join(projectRoot, "src", "app", "index.tsx"),
      "utf8",
    );
    const yoga = readFileSync(
      join(projectRoot, "src", "app", "yoga.tsx"),
      "utf8",
    );
    const soundscapes = readFileSync(
      join(projectRoot, "src", "app", "soundscapes.tsx"),
      "utf8",
    );

    expect(rituals).toContain('availability: "test-only"');
    expect(rituals.match(/audioPresetId: "deep-sleep-432"/g)).toHaveLength(1);
    expect(`${shell}\n${home}\n${yoga}\n${soundscapes}`).not.toMatch(
      /deep-sleep-432/,
    );
    expect(soundscapes).toContain("getVisibleConsumerWorks");
    const catalog = readFileSync(
      join(projectRoot, "src", "content", "consumerCatalog.ts"),
      "utf8",
    );
    expect(catalog).not.toMatch(/eclipse|eclypsis|stillwater|nirvana/i);
    expect(catalog).not.toContain("defaultMix");
  });

  it("avoids recognisable Anima interface motifs without banning cosmic copy", () => {
    const consumerFiles = [
      join(projectRoot, "src", "app", "index.tsx"),
      join(projectRoot, "src", "app", "yoga.tsx"),
      join(projectRoot, "src", "app", "soundscapes.tsx"),
      join(projectRoot, "src", "components", "EditorialScreen.tsx"),
      join(projectRoot, "src", "components", "EditorialHeader.tsx"),
      join(projectRoot, "src", "components", "ProductTabBar.tsx"),
      join(projectRoot, "src", "components", "ProductionCard.tsx"),
      join(projectRoot, "src", "components", "OutcomeActionCard.tsx"),
      join(projectRoot, "src", "components", "OutcomeGridTile.tsx"),
      join(projectRoot, "src", "content", "productShell.ts"),
      join(projectRoot, "src", "content", "rituals.ts"),
      join(projectRoot, "src", "design", "editorialTheme.ts"),
      join(projectRoot, "src", "design", "outcomeArtwork.ts"),
      join(projectRoot, "src", "design", "shellArtwork.ts"),
    ];
    const consumerCopy = consumerFiles
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(consumerCopy).not.toMatch(
      /black sphere|black planet|waveform|brainwave|neuro.?graphic|frequency.?first|mandala|chakra|buddha|torii|\borb\b/i,
    );
    expect(
      readFileSync(
        join(projectRoot, "src", "content", "productShell.ts"),
        "utf8",
      ),
    ).toMatch(/Cosmic \/ Zen ambient|Esoteric Series|Elemental Worlds/);
  });

  it("keeps the consumer paper shell separate from the dark technical shell", () => {
    for (const route of [
      "index.tsx",
      "outcome/[outcomeId].tsx",
      "soundscapes.tsx",
    ]) {
      const source = readFileSync(
        join(projectRoot, "src", "app", route),
        "utf8",
      );
      expect(source).toContain("EditorialScreen");
      expect(source).toContain("EditorialHeader");
      expect(source).not.toMatch(/AmbientScreen|TopBar/);
    }
    expect(
      readFileSync(join(projectRoot, "src", "app", "yoga.tsx"), "utf8"),
    ).toContain('href="/outcome/yoga?practice=complete"');

    const technicalSource = readFileSync(
      join(projectRoot, "src", "app", "audio-test.tsx"),
      "utf8",
    );
    expect(technicalSource).toContain("AmbientScreen");
    expect(technicalSource).toContain("TopBar");
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
    expect(copy).not.toContain("placeholder stems");
    expect(copy).toContain("does not diagnose, treat, cure or prevent");
  });
});

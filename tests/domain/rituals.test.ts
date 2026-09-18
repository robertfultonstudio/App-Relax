import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUDIO_TEST_RITUAL,
  RITUALS,
  RITUAL_THEMES,
  getRitualTheme,
} from "@/content/rituals";
import { colors } from "@/design/theme";

describe("M3 ritual editorial registry", () => {
  it("contains one blocked consumer ritual per goal", () => {
    expect(RITUALS).toHaveLength(4);
    expect(new Set(RITUALS.map((ritual) => ritual.goal)).size).toBe(4);
    expect(
      RITUALS.every((ritual) => ritual.availability === "in-production"),
    ).toBe(true);
    expect(RITUALS.map((ritual) => ritual.title)).toContain("Aquarian Sky");
  });

  it("assigns audio only to the explicit technical test", () => {
    for (const ritual of RITUALS) {
      expect(ritual.audioPresetId).toBeUndefined();
    }
    expect(AUDIO_TEST_RITUAL).toEqual(
      expect.objectContaining({
        availability: "test-only",
        audioPresetId: "deep-sleep-432",
        title: "Moon Current",
      }),
    );
  });

  it("links every ritual to a complete, unique theme and artwork", () => {
    expect(RITUAL_THEMES).toHaveLength(4);
    expect(new Set(RITUAL_THEMES.map((theme) => theme.id)).size).toBe(4);
    expect(new Set(RITUAL_THEMES.map((theme) => theme.artworkKey)).size).toBe(
      4,
    );

    for (const ritual of RITUALS) {
      const theme = getRitualTheme(ritual.themeId);
      expect(theme).toBeDefined();
      expect(theme?.artworkKey).toBe(ritual.artworkKey);
      expect(Object.values(theme?.palette ?? {})).toHaveLength(5);
    }
  });

  it("keeps theme text and muted copy at WCAG AA contrast", () => {
    const luminance = (hex: string) => {
      const channels = [1, 3, 5].map(
        (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
      );
      const [red, green, blue] = channels.map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      );
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const contrast = (first: string, second: string) => {
      const values = [luminance(first), luminance(second)].sort(
        (left, right) => right - left,
      );
      return (values[0] + 0.05) / (values[1] + 0.05);
    };

    for (const theme of RITUAL_THEMES) {
      expect(
        contrast(theme.palette.text, theme.palette.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.palette.muted, theme.palette.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.palette.text, theme.palette.surface),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.palette.muted, theme.palette.surface),
      ).toBeGreaterThanOrEqual(4.5);
    }

    expect(
      contrast(colors.textMuted, colors.navigation),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textMuted, colors.surface)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("implements slow bounded playback motion and a Reduce Motion stop", () => {
    const artwork = readFileSync(
      join(__dirname, "..", "..", "src", "components", "RitualArtwork.tsx"),
      "utf8",
    );
    expect(artwork).toContain("AccessibilityInfo.isReduceMotionEnabled()");
    expect(artwork).toContain(
      'duration = theme.motion === "drift" ? 22000 : 24000',
    );
    expect(artwork).toContain("? 1.03 : 1.02");
    expect(artwork).toContain("if (!active || reduceMotion)");
  });

  it("keeps prohibited claims out of public ritual and primary player copy", () => {
    const player = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "src",
        "app-qa",
        "session",
        "[sessionId].tsx",
      ),
      "utf8",
    );
    const publicCopy = `${JSON.stringify(RITUALS)}\n${player}`;
    expect(publicCopy).not.toMatch(
      /\bheal\b|\bcure\b|\btherapy\b|treat anxiety|brain synchronization|tinnitus relief/i,
    );
  });
});

import { editorial, OUTCOME_EDITORIAL_ACCENT } from "@/design/editorialTheme";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("consumer editorial theme", () => {
  it("keeps every text and outcome accent AA on both paper tones", () => {
    const textColors = [
      editorial.ink,
      editorial.inkMuted,
      editorial.inkFaint,
      editorial.gold,
      editorial.jade,
      editorial.rose,
      editorial.lavender,
      editorial.mineralBlue,
    ];

    for (const foreground of textColors) {
      expect(contrast(foreground, editorial.paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(foreground, editorial.paperDeep)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("keeps visible boundaries and all six outcome mappings complete", () => {
    expect(
      contrast(editorial.line, editorial.paperDeep),
    ).toBeGreaterThanOrEqual(3);
    expect(Object.keys(OUTCOME_EDITORIAL_ACCENT)).toEqual([
      "yoga",
      "massage",
      "relax",
      "meditation",
      "sleep",
      "focus",
    ]);
  });
});

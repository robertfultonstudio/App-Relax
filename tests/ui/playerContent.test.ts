import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("M3 technical audio player", () => {
  const playerPath = join(
    __dirname,
    "..",
    "..",
    "src",
    "app-qa",
    "session",
    "[sessionId].tsx",
  );
  const player = readFileSync(playerPath, "utf8");

  it("keeps technical frequency values out of the primary player structure", () => {
    expect(player).not.toContain("preset.tuningLabel");
    expect(player).not.toContain("preset.beatHz");
    expect(player).not.toContain("styles.tags");
  });

  it("keeps volume, mute and test details behind collapsed disclosures", () => {
    expect(player).toContain("TEST ONLY");
    expect(player).toContain('label="Volume & mute"');
    expect(player).toContain('label="Test details"');
    expect(player).toContain("useState(false)");
    expect(player).toContain("{open ?");
  });
});

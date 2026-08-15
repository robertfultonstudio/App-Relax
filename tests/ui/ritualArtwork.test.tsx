import { render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Animated } from "react-native";
import { RitualArtwork } from "@/components/RitualArtwork";
import { AUDIO_TEST_RITUAL, requireRitualTheme } from "@/content/rituals";

describe("RitualArtwork", () => {
  afterEach(() => jest.restoreAllMocks());

  it("keeps playback artwork static when Reduce Motion is enabled", async () => {
    const remove = jest.fn();
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(true);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove } as never);
    const loop = jest.spyOn(Animated, "loop");
    const ritual = AUDIO_TEST_RITUAL;

    await render(
      <RitualArtwork
        active
        ritual={ritual}
        theme={requireRitualTheme(ritual.themeId)}
      />,
    );

    await waitFor(() =>
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled(),
    );
    expect(loop).not.toHaveBeenCalled();
  });
});

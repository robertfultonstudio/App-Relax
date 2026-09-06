import { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ConsumerPlaybackSurface } from "@/components/ConsumerPlaybackSurface";
import { SessionNatureControl } from "@/components/SessionNatureControl";
import type {
  NatureAmbienceFamily,
  NatureMixLevel,
} from "@/domain/sessions/types";

function Harness() {
  const [family, setFamily] = useState<NatureAmbienceFamily>("sea");
  const [level, setLevel] = useState<NatureMixLevel>(0.8);
  return (
    <SessionNatureControl
      family={family}
      familyDisabled={false}
      level={level}
      onFamilyChange={setFamily}
      onLevelChange={setLevel}
      title={family === "sea" ? "Night Shore" : "Soft Rain"}
      volumeDisabled={false}
    />
  );
}

function PlaybackHarness() {
  const [volume, setVolume] = useState(0.6);
  return (
    <ConsumerPlaybackSurface
      canPlay
      canStop={false}
      contextLabel="MUSIC + NATURE · SOUND ONLY · 20 MIN"
      isPlaying={false}
      note="Preview"
      onPlayPause={() => undefined}
      onStop={() => undefined}
      onVolumeChange={setVolume}
      outcome="relax"
      remainingMs={20 * 60_000}
      title="Relax now"
      volume={volume}
    />
  );
}

describe("SessionNatureControl", () => {
  it("chooses the nature family and restores the previous level after mute", async () => {
    const screen = await render(<Harness />);

    await fireEvent.press(screen.getByLabelText("Rain"));
    expect(screen.getByText("Soft Rain")).toBeTruthy();
    expect(
      screen.getByTestId("nature-family-rain").props.accessibilityState,
    ).toMatchObject({ disabled: false, checked: true });
    expect(
      screen.getByTestId("nature-family-sea").props.accessibilityState,
    ).toMatchObject({ checked: false });
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);

    await fireEvent.press(screen.getByLabelText("Mute natural ambience"));
    expect(screen.getByText("AMBIENCE VOLUME · 0%")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Unmute natural ambience"));
    expect(screen.getByText("AMBIENCE VOLUME · 80%")).toBeTruthy();
  });

  it("restores the previous main volume after mute", async () => {
    const screen = await render(<PlaybackHarness />);

    await fireEvent.press(screen.getByLabelText("Mute"));
    expect(screen.getByText("MAIN VOLUME · 0%")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Unmute"));
    expect(screen.getByText("MAIN VOLUME · 60%")).toBeTruthy();
  });
});

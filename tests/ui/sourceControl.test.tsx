import { render } from "@testing-library/react-native";
import { SourceControl } from "@/components/SourceControl";
import { colors } from "@/design/theme";

describe("SourceControl", () => {
  it("exposes source fade state alongside gain and mute controls", async () => {
    const screen = await render(
      <SourceControl
        onGainChange={jest.fn()}
        onToggleMuted={jest.fn()}
        source={{
          id: "drone",
          label: "Moon drone",
          kind: "stem",
          gain: 0.25,
          muted: false,
          loadingState: "ready",
          fadeState: "fadingOut",
          error: null,
        }}
      />,
    );
    expect(screen.getByText("fading out").props.style).toEqual(
      expect.objectContaining({ color: colors.textMuted }),
    );
    expect(screen.getByText("Mute")).toBeTruthy();
    expect(screen.getByLabelText("Moon drone level 25%")).toBeTruthy();
    expect(screen.getByTestId("source-drone-mute")).toBeTruthy();
    expect(screen.getByTestId("source-drone-lower")).toBeTruthy();
    expect(screen.getByTestId("source-drone-level")).toBeTruthy();
    expect(screen.getByTestId("source-drone-raise")).toBeTruthy();

    await screen.rerender(
      <SourceControl
        onGainChange={jest.fn()}
        onToggleMuted={jest.fn()}
        source={{
          id: "drone",
          label: "Moon drone",
          kind: "stem",
          gain: 0.25,
          muted: false,
          loadingState: "ready",
          fadeState: "idle",
          error: null,
        }}
      />,
    );
    expect(screen.getByText("ready")).toBeTruthy();
    expect(screen.queryByText("stem")).toBeNull();
  });
});

import { render } from "@testing-library/react-native";
import { SourceControl } from "@/components/SourceControl";

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
    expect(screen.getByText("fading out")).toBeTruthy();
    expect(screen.getByLabelText("Moon drone level 25%")).toBeTruthy();
  });
});

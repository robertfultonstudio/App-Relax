import { fireEvent, render } from "@testing-library/react-native";
import { LastSessionAction } from "@/components/LastSessionAction";

describe("LastSessionAction", () => {
  it("is present but disabled before a successful session start", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <LastSessionAction available onPress={onPress} request={null} />,
    );
    expect(screen.getByText("Play your last session")).toBeTruthy();
    expect(
      screen.getByTestId("play-last-session").props.accessibilityState,
    ).toEqual({
      disabled: true,
    });
    fireEvent.press(screen.getByTestId("play-last-session"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("summarises and reopens a saved sound-only request", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <LastSessionAction
        available
        onPress={onPress}
        request={{
          outcome: "meditation",
          durationMinutes: 20,
          mode: "sound-only",
        }}
      />,
    );
    expect(
      screen.getByText("Begin meditation · 20 min · Sound only"),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId("play-last-session"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not reopen a saved request outside the local preview gate", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <LastSessionAction
        available={false}
        onPress={onPress}
        request={{
          outcome: "meditation",
          durationMinutes: 20,
          mode: "sound-only",
        }}
      />,
    );
    fireEvent.press(screen.getByTestId("play-last-session"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

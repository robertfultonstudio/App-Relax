import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { PlaybackTransport } from "@/components/PlaybackTransport";
import { editorial } from "@/design/editorialTheme";

describe("immediately recognisable listening controls", () => {
  it("keeps recognisable controls in a compact single row with accessible targets", async () => {
    const onStop = jest.fn(),
      onPlayPause = jest.fn();
    const screen = await render(
      <PlaybackTransport
        canPlay
        canStop
        isPlaying
        onStop={onStop}
        onPlayPause={onPlayPause}
        fixedFooter
      />,
    );
    const footerStyle = StyleSheet.flatten(
      screen.getByTestId("fixed-player-controls").props.style,
    );
    expect(footerStyle.paddingTop).toBe(8);
    expect(footerStyle.paddingBottom).toBe(8);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual([
      "Stop",
      "Pause",
    ]);
    for (const button of buttons) {
      const style = StyleSheet.flatten(button.props.style);
      expect(style.minHeight).toBe(56);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.flexDirection).toBe("column");
      expect(style.borderWidth).toBe(0);
      // Text scaling may grow the row: do not clip it to the default height.
      expect(style.height).toBeUndefined();
      expect(style.maxHeight).toBeUndefined();
    }
    expect(StyleSheet.flatten(buttons[0].props.style).backgroundColor).toBe(
      "transparent",
    );
    expect(StyleSheet.flatten(buttons[1].props.style).backgroundColor).toBe(
      "transparent",
    );
    const disc = screen.getByTestId("transport-symbol-pause", {
      includeHiddenElements: true,
    }).parent;
    expect(StyleSheet.flatten(disc?.props.style)).toMatchObject({
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: editorial.lavender,
    });
    expect(
      screen.getByTestId("transport-symbol-stop", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("transport-symbol-pause", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    await fireEvent.press(buttons[0]);
    await fireEvent.press(buttons[1]);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });
  it("keeps the Play symbol in place while starting, with Stop still available", async () => {
    const onStop = jest.fn(),
      onPlayPause = jest.fn();
    const screen = await render(
      <PlaybackTransport
        canPlay={false}
        canStop
        isPlaying={false}
        busy
        onStop={onStop}
        onPlayPause={onPlayPause}
      />,
    );
    expect(
      screen.getByTestId("transport-symbol-play", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Starting…")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    await fireEvent.press(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});

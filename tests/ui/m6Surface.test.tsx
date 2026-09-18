import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ProductTabBar } from "@/components/ProductTabBar";
import { PlaybackTransport } from "@/components/PlaybackTransport";
import { ConsumerPlaybackSurface } from "@/components/ConsumerPlaybackSurface";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));

it("keeps live player text outside painted effects, with local fonts and no blur", async () => {
  const screen = await render(
    <ConsumerPlaybackSurface
      canPlay
      canStop
      isPlaying
      contextLabel="MEDITATION"
      title="Meditation"
      remainingMs={1200000}
      outcome="meditation"
      note="Press Play. Leave the phone behind."
      onPlayPause={() => {}}
      onStop={() => {}}
      onVolumeChange={() => {}}
    />,
  );
  for (const [copy, font] of [
    ["Meditation", fonts.serif],
    ["20:00", fonts.serif],
    ["MAIN VOLUME · 80%", fonts.sansSemiBold],
  ]) {
    const text = screen.getByText(copy);
    expect(StyleSheet.flatten(text.props.style).fontFamily).toBe(font);
    for (const node of [
      text,
      screen.getByTestId("consumer-playback-surface"),
    ]) {
      const style = StyleSheet.flatten(node.props.style) ?? {};
      expect(style.opacity ?? 1).toBe(1);
      expect(style.textShadowRadius ?? 0).toBe(0);
      expect(style.filter).toBeUndefined();
      expect(style.transform).toBeUndefined();
    }
  }
});

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = hex.match(/[a-f0-9]{2}/gi)!.map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

it("keeps tabs sharply bounded, selected beyond colour, and at least 44px", async () => {
  const screen = await render(<ProductTabBar activeTab="rituals" />);
  for (const tab of screen.getAllByRole("tab")) {
    const style = StyleSheet.flatten(tab.props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.borderWidth).toBe(1);
    expect(style.opacity).toBeUndefined();
    const background = style.backgroundColor ?? editorial.paperLight;
    expect(contrast(style.borderColor, background)).toBeGreaterThanOrEqual(3);
    expect(contrast(editorial.ink, background)).toBeGreaterThanOrEqual(4.5);
  }
  expect(
    screen
      .getAllByRole("tab")
      .filter((tab) => tab.props.accessibilityState.selected),
  ).toHaveLength(1);
});

it("softens only the transport backdrop, preserving opaque high-contrast symbols", async () => {
  const screen = await render(
    <PlaybackTransport
      canPlay
      canStop
      isPlaying
      fixedFooter
      onPlayPause={() => {}}
      onStop={() => {}}
    />,
  );
  expect(screen.getByTestId("transport-pastel-wash")).toBeTruthy();
  for (const background of ["#ECE4E2", "#DCD4E5"]) {
    expect(contrast(editorial.ink, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(editorial.lavender, background)).toBeGreaterThanOrEqual(
      4.5,
    );
  }
  expect(
    contrast(editorial.paperLight, editorial.lavender),
  ).toBeGreaterThanOrEqual(4.5);
  const pause = screen.getByTestId("transport-symbol-pause", {
    includeHiddenElements: true,
  });
  expect(StyleSheet.flatten(pause.props.style).opacity).toBeUndefined();
});

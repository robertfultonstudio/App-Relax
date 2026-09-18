import { fireEvent, render } from "@testing-library/react-native";
import WelcomeScreen from "@/screens/WelcomeScreen";
import { AccessibilityInfo, StyleSheet } from "react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));

it("offers a distinct, accessible entrance without exposing a catalogue or player", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  const screen = await render(<WelcomeScreen />);
  expect(screen.getByTestId("welcome-screen")).toBeTruthy();
  expect(screen.queryByTestId("outcome-grid")).toBeNull();
  expect(screen.queryByTestId("playback-transport")).toBeNull();
  const enter = screen.getByRole("button", { name: "Choose your moment" });
  expect(
    StyleSheet.flatten(enter.props.style).minHeight,
  ).toBeGreaterThanOrEqual(44);
  await fireEvent.press(enter);
  expect(mockReplace).toHaveBeenCalledWith("/moments");
  expect(
    screen.getByRole("button", { name: "Choose your moment" }).props
      .accessibilityState.busy,
  ).toBe(true);
});

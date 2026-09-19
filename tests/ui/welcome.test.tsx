import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import WelcomeScreen from "@/screens/WelcomeScreen";
import { deferred } from "./helpers/consumerAudioMock";

const mockReplace = jest.fn();
const mockLoadWelcomeCompleted = jest.fn(async () => false);
const mockCompleteWelcome = jest.fn(async () => undefined);

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/state/welcomePersistence", () => ({
  loadWelcomeCompleted: () => mockLoadWelcomeCompleted(),
  completeWelcome: () => mockCompleteWelcome(),
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockLoadWelcomeCompleted.mockReset().mockResolvedValue(false);
  mockCompleteWelcome.mockReset().mockResolvedValue(undefined);
});

it("offers a static first-run entrance and persists it before replacing history", async () => {
  const welcomeState = deferred<boolean>();
  mockLoadWelcomeCompleted.mockReturnValue(welcomeState.promise);
  const screen = await render(<WelcomeScreen />);
  expect(screen.getByTestId("welcome-entry-guard")).toBeTruthy();
  expect(screen.queryByText("Make room\nfor quiet.")).toBeNull();
  await act(async () => welcomeState.resolve(false));
  await waitFor(() =>
    expect(screen.getByTestId("welcome-screen")).toBeTruthy(),
  );
  expect(screen.queryByTestId("outcome-list")).toBeNull();
  expect(screen.queryByTestId("playback-transport")).toBeNull();
  const enter = screen.getByRole("button", { name: "Scegli il tuo momento" });
  expect(
    StyleSheet.flatten(enter.props.style).minHeight,
  ).toBeGreaterThanOrEqual(44);
  await fireEvent.press(enter);
  await waitFor(() => expect(mockCompleteWelcome).toHaveBeenCalledTimes(1));
  expect(mockReplace).toHaveBeenCalledWith("/moments");
});

it("redirects a returning user before mounting any landing copy", async () => {
  const welcomeState = deferred<boolean>();
  mockLoadWelcomeCompleted.mockReturnValue(welcomeState.promise);
  const screen = await render(<WelcomeScreen />);
  expect(screen.getByTestId("welcome-entry-guard")).toBeTruthy();
  expect(screen.queryByTestId("welcome-screen")).toBeNull();
  expect(screen.queryByText(/Make room/)).toBeNull();
  await act(async () => welcomeState.resolve(true));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/moments"));
  expect(screen.queryByTestId("welcome-screen")).toBeNull();
});

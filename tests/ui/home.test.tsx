import { render } from "@testing-library/react-native";
import HomeScreen from "@/app/index";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("home vertical slice", () => {
  it("renders four categories and the single placeholder hero", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByText("Sleep")).toBeTruthy();
    expect(screen.getByText("Calm")).toBeTruthy();
    expect(screen.getByText("Focus")).toBeTruthy();
    expect(screen.getByText("Meditate")).toBeTruthy();
    expect(screen.getByText("Deep Sleep 432")).toBeTruthy();
    expect(screen.getByText("PLACEHOLDER")).toBeTruthy();
  });
});

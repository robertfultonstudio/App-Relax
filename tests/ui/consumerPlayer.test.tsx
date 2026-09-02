import { render, waitFor } from "@testing-library/react-native";
import ConsumerPlayerScreen from "@/app/listen/[workId]";

const mockLoadProgram = jest.fn(async () => undefined);
const mockPlay = jest.fn(async () => undefined);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ start: "1", workId: "eclipse-veil" }),
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => ({
    controller: {
      loadProgram: mockLoadProgram,
      pause: jest.fn(),
      play: mockPlay,
      setTimer: jest.fn(),
      setVolume: jest.fn(),
      stop: jest.fn(),
    },
    snapshot: {
      error: null,
      remainingMs: 30 * 60_000,
      selectedDurationMinutes: 30,
      status: "ready",
      volume: 0.8,
    },
  }),
}));

describe("consumer player", () => {
  beforeEach(() => {
    mockLoadProgram.mockClear();
    mockPlay.mockClear();
  });

  it("autostarts only after the featured program is loaded", async () => {
    await render(<ConsumerPlayerScreen />);
    await waitFor(() => expect(mockPlay).toHaveBeenCalledTimes(1));
    expect(mockLoadProgram).toHaveBeenCalledTimes(1);
    expect(mockLoadProgram.mock.invocationCallOrder[0]).toBeLessThan(
      mockPlay.mock.invocationCallOrder[0],
    );
  });
});

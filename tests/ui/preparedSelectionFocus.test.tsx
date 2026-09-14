import { act, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import type { ConsumerSelection } from "@/domain/audio/consumerSelection";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";
let mockFocused = true;
let mockAudio = createConsumerAudioMock();
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    const focused = mockFocused;
    useEffect(() => (focused ? callback() : undefined), [callback, focused]);
  },
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
const selection: ConsumerSelection = {
  kind: "single",
  outcome: "yoga",
  durationMinutes: 30,
  program: createSingleTrackProgram(
    getConsumerWork("respiro-hatha-1-01")!,
    "yoga",
  ),
};
function Probe() {
  const state = usePreparedSelection(selection);
  return <Text>{state.ready ? "Ready" : "Preparing"}</Text>;
}
it("a hidden route does not keep preparing; refocus cannot reuse stale Ready", async () => {
  mockFocused = true;
  mockAudio = createConsumerAudioMock();
  const screen = await render(<Probe />);
  await waitFor(() => expect(screen.getByText("Ready")).toBeTruthy());
  mockFocused = false;
  await screen.rerender(<Probe />);
  expect(mockAudio.controller.cancelPreparedSelection).toHaveBeenCalledWith(
    selection,
  );
  const pending = deferred();
  mockAudio.controller.prepareSelection.mockReturnValueOnce(pending.promise);
  mockFocused = true;
  await screen.rerender(<Probe />);
  expect(screen.getByText("Preparing")).toBeTruthy();
  expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(2);
  await act(async () => pending.resolve());
  expect(screen.getByText("Ready")).toBeTruthy();
});

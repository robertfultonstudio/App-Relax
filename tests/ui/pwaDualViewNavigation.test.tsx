import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { Platform, Pressable, Text, View } from "react-native";
import { PwaViewProvider, usePwaView } from "@/pwa-view/PwaViewProvider";
import {
  exceedsHomeLongPressTolerance,
  isWorkbenchKeyboardShortcut,
  PWA_HOME_LONG_PRESS_MS,
  PwaBottomNavigation,
} from "@/pwa-view/PwaBottomNavigation";
import {
  isPwaNavigationHidden,
  PwaListeningNavigation,
} from "@/pwa-view/PwaListeningNavigation";
import type { PlaybackStatus } from "@/domain/audio/types";

let mockParams: { review?: string } = {};
let mockPath = "/listen/white-noise";
let mockPlaybackStatus: PlaybackStatus = "ready";
const mockReplace = jest.fn();
const mockSetParams = jest.fn();
function installWindowEventTarget() {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const target = window as unknown as {
    addEventListener?: unknown;
    removeEventListener?: unknown;
  };
  const originalAdd = target.addEventListener;
  const originalRemove = target.removeEventListener;
  target.addEventListener = (
    type: string,
    listener: (event: unknown) => void,
  ) => {
    const set = listeners.get(type) ?? new Set();
    set.add(listener);
    listeners.set(type, set);
  };
  target.removeEventListener = (
    type: string,
    listener: (event: unknown) => void,
  ) => listeners.get(type)?.delete(listener);
  return {
    emit(type: string) {
      for (const listener of listeners.get(type) ?? []) listener({ type });
    },
    restore() {
      target.addEventListener = originalAdd;
      target.removeEventListener = originalRemove;
    },
  };
}
jest.mock("expo-router", () => ({
  useGlobalSearchParams: () => mockParams,
  usePathname: () => mockPath,
  useRouter: () => ({ replace: mockReplace, setParams: mockSetParams }),
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => ({ snapshot: { status: mockPlaybackStatus } }),
}));
jest.mock("react-native-safe-area-context", () => {
  const ReactActual = jest.requireActual("react");
  const { View: NativeView } = jest.requireActual("react-native");
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactActual.createElement(NativeView, props, children),
  };
});
function Probe() {
  const { viewMode, showConsumerPreview, showWorkbench } = usePwaView();
  return (
    <View>
      <Text testID="view-mode">{viewMode}</Text>
      <Pressable
        accessibilityLabel="Consumer"
        accessibilityRole="button"
        onPress={showConsumerPreview}
      >
        <Text>Consumer</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Workbench"
        accessibilityRole="button"
        onPress={showWorkbench}
      >
        <Text>Workbench</Text>
      </Pressable>
    </View>
  );
}

beforeEach(() => {
  mockParams = {};
  mockPath = "/listen/white-noise";
  mockPlaybackStatus = "ready";
  mockReplace.mockClear();
  mockSetParams.mockClear();
});

it.each([
  ["preparing", true],
  ["playing", true],
  ["paused", true],
  ["fadingOut", true],
  ["ready", false],
  ["completed", true],
] satisfies [PlaybackStatus, boolean][])(
  "maps %s to navigation hidden=%s",
  (status, hidden) => {
    expect(isPwaNavigationHidden(status)).toBe(hidden);
  },
);

it("removes Home, Hatha and Impostazioni during listening, then restores them on Ready", async () => {
  const screen = await render(
    <PwaViewProvider>
      <PwaListeningNavigation />
    </PwaViewProvider>,
  );
  expect(screen.getByTestId("pwa-bottom-navigation")).toBeTruthy();

  mockPlaybackStatus = "playing";
  await screen.rerender(
    <PwaViewProvider>
      <PwaListeningNavigation />
    </PwaViewProvider>,
  );
  expect(screen.queryByTestId("pwa-bottom-navigation")).toBeNull();

  mockPlaybackStatus = "paused";
  await screen.rerender(
    <PwaViewProvider>
      <PwaListeningNavigation />
    </PwaViewProvider>,
  );
  expect(screen.queryByRole("tab", { name: "Home" })).toBeNull();
  expect(screen.queryByRole("tab", { name: "Hatha" })).toBeNull();
  expect(screen.queryByRole("tab", { name: "Impostazioni" })).toBeNull();

  mockPlaybackStatus = "ready";
  await screen.rerender(
    <PwaViewProvider>
      <PwaListeningNavigation />
    </PwaViewProvider>,
  );
  expect(screen.getByTestId("pwa-bottom-navigation")).toBeTruthy();
});
afterEach(async () => {
  await cleanup();
});

it("opens the consumer surface by default", async () => {
  const consumer = await render(
    <PwaViewProvider>
      <Probe />
    </PwaViewProvider>,
  );
  expect(consumer.getByTestId("view-mode")).toHaveTextContent(
    "consumer-preview",
  );
});

it("keeps Workbench available when review=1 is explicit", async () => {
  mockParams = { review: "1" };
  const workbench = await render(
    <PwaViewProvider>
      <Probe />
    </PwaViewProvider>,
  );
  expect(workbench.getByTestId("view-mode")).toHaveTextContent("workbench");
});

it("opens consumer preview when review=0 is explicit", async () => {
  mockParams = { review: "0" };
  const consumer = await render(
    <PwaViewProvider>
      <Probe />
    </PwaViewProvider>,
  );
  expect(consumer.getByTestId("view-mode")).toHaveTextContent(
    "consumer-preview",
  );
});

it("switches view with params only and announces both directions", async () => {
  mockParams = { review: "1" };
  const screen = await render(
    <PwaViewProvider>
      <Probe />
    </PwaViewProvider>,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Consumer" }));
  expect(mockSetParams).toHaveBeenLastCalledWith({ review: "0" });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.getByTestId("pwa-view-announcement")).toHaveTextContent(
    "Anteprima utente attiva",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Workbench" }));
  expect(mockSetParams).toHaveBeenLastCalledWith({ review: "1" });
  expect(screen.getByTestId("pwa-view-announcement")).toHaveTextContent(
    "Workbench sviluppatore attivo",
  );
});

it("uses one 1200 ms Home control without firing its short navigation after long press", async () => {
  mockParams = { review: "0" };
  const screen = await render(
    <PwaViewProvider>
      <PwaBottomNavigation />
    </PwaViewProvider>,
  );
  const home = screen.getByTestId("pwa-tab-home");
  expect(PWA_HOME_LONG_PRESS_MS).toBe(1200);
  await fireEvent(home, "longPress");
  await fireEvent.press(home);
  expect(mockSetParams).toHaveBeenCalledWith({ review: "1" });
  expect(mockReplace).not.toHaveBeenCalled();
});

it("exposes three distinct vector navigation marks", async () => {
  mockPath = "/moments";
  const screen = await render(
    <PwaViewProvider>
      <PwaBottomNavigation />
    </PwaViewProvider>,
  );
  expect(screen.getByTestId("pwa-tab-icon-home")).toBeOnTheScreen();
  expect(screen.getByTestId("pwa-tab-icon-hatha")).toBeOnTheScreen();
  expect(screen.getByTestId("pwa-tab-icon-settings")).toBeOnTheScreen();
});

it("renders the exact 1199/1200 ms owner gesture boundary and suppresses navigation", async () => {
  const originalPlatform = Platform.OS;
  const windowEvents = installWindowEventTarget();
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  jest.useFakeTimers();
  try {
    mockParams = { review: "0" };
    const screen = await render(
      <PwaViewProvider>
        <PwaBottomNavigation />
      </PwaViewProvider>,
    );
    const home = screen.getByTestId("pwa-tab-home");
    await fireEvent(home, "pointerDownCapture", {
      isPrimary: true,
      clientX: 12,
      clientY: 18,
    });
    await act(async () => jest.advanceTimersByTime(1199));
    expect(mockSetParams).toHaveBeenCalledTimes(0);
    await act(async () => jest.advanceTimersByTime(1));
    expect(mockSetParams).toHaveBeenCalledTimes(1);
    expect(mockSetParams).toHaveBeenLastCalledWith({ review: "1" });
    await fireEvent(home, "pointerUpCapture");
    await fireEvent.press(home);
    expect(mockSetParams).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledTimes(0);
  } finally {
    await cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
    windowEvents.restore();
  }
});

it("cancels the rendered owner gesture on movement, scroll, second pointer, blur and pointer cancel", async () => {
  const originalPlatform = Platform.OS;
  const windowEvents = installWindowEventTarget();
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  jest.useFakeTimers();
  try {
    mockParams = { review: "0" };
    const screen = await render(
      <PwaViewProvider>
        <PwaBottomNavigation />
      </PwaViewProvider>,
    );
    const home = screen.getByTestId("pwa-tab-home");
    const begin = async () =>
      fireEvent(home, "pointerDownCapture", {
        isPrimary: true,
        clientX: 0,
        clientY: 0,
      });
    const elapse = () => act(async () => jest.advanceTimersByTime(1200));

    await begin();
    await fireEvent(home, "pointerMoveCapture", { clientX: 11, clientY: 0 });
    await elapse();

    await begin();
    windowEvents.emit("scroll");
    await elapse();

    await begin();
    await fireEvent(home, "pointerDownCapture", {
      isPrimary: false,
      clientX: 0,
      clientY: 0,
    });
    await elapse();

    await begin();
    await fireEvent(home, "blur");
    await elapse();

    await begin();
    await fireEvent(home, "pointerCancelCapture");
    await elapse();

    expect(mockSetParams).toHaveBeenCalledTimes(0);
    expect(mockReplace).toHaveBeenCalledTimes(0);
  } finally {
    await cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalPlatform,
    });
    windowEvents.restore();
  }
});

it.each([
  ["/moments", "home"],
  ["/yoga", "hatha"],
  ["/outcome/yoga", "hatha"],
  ["/adaptive-session/yoga", "hatha"],
  ["/settings", "settings"],
])(
  "exposes exactly one current navigation destination on %s",
  async (path, current) => {
    const originalPlatform = Platform.OS;
    const windowEvents = installWindowEventTarget();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    try {
      mockPath = path;
      const screen = await render(
        <PwaViewProvider>
          <PwaBottomNavigation />
        </PwaViewProvider>,
      );
      const tabs = ["home", "hatha", "settings"].map((id) =>
        screen.getByTestId(`pwa-tab-${id}`),
      );
      expect(
        tabs.filter((tab) => tab.props.accessibilityState?.selected),
      ).toHaveLength(1);
      for (const tab of tabs) {
        const selected = tab.props.testID === `pwa-tab-${current}`;
        expect(tab.props["aria-current"]).toBe(selected ? "page" : undefined);
        expect(tab.props.accessibilityState?.selected).toBe(selected);
        expect(tab.props.tabIndex).toBe(selected ? 0 : -1);
      }
    } finally {
      await cleanup();
      Object.defineProperty(Platform, "OS", {
        configurable: true,
        value: originalPlatform,
      });
      windowEvents.restore();
    }
  },
);

it("defines strict movement and repeat cancellation for the hidden shortcut", () => {
  expect(exceedsHomeLongPressTolerance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(
    false,
  );
  expect(exceedsHomeLongPressTolerance({ x: 0, y: 0 }, { x: 11, y: 0 })).toBe(
    true,
  );
  expect(
    isWorkbenchKeyboardShortcut({
      altKey: true,
      shiftKey: true,
      key: "Enter",
      repeat: false,
    }),
  ).toBe(true);
  expect(
    isWorkbenchKeyboardShortcut({
      altKey: true,
      shiftKey: true,
      key: "Enter",
      repeat: true,
    }),
  ).toBe(false);
});

it("exposes the custom accessibility Workbench action on the Home control", async () => {
  mockParams = { review: "0" };
  const screen = await render(
    <PwaViewProvider>
      <PwaBottomNavigation />
    </PwaViewProvider>,
  );
  await fireEvent(screen.getByTestId("pwa-tab-home"), "accessibilityAction", {
    nativeEvent: { actionName: "openWorkbench" },
  });
  expect(mockSetParams).toHaveBeenCalledWith({ review: "1" });
});

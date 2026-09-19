/** @jest-environment jsdom */

// @ts-expect-error -- this repository does not install react-test-renderer declarations.
import { act, create } from "react-test-renderer";
import { PwaConsumerTransportDock } from "@/pwa-view/PwaConsumerTransportDock.web";

const mockCreatePortal = jest.fn(
  (node: React.ReactNode, _container: Element) => node,
);
jest.mock("react-dom", () => ({
  createPortal: (node: React.ReactNode, container: Element) =>
    mockCreatePortal(node, container),
}));

const observe = jest.fn();
const disconnect = jest.fn();
let resizeCallback: ResizeObserverCallback = () => undefined;

class TestResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  observe = observe;
  unobserve = jest.fn();
  disconnect = disconnect;
}

const props = {
  canPlay: true,
  canStop: false,
  isPlaying: false,
  onPlayPause: jest.fn(),
  onStop: jest.fn(),
};

let renderer: ReturnType<typeof create>;

beforeEach(() => {
  mockCreatePortal.mockClear();
  observe.mockClear();
  disconnect.mockClear();
  document.body.replaceChildren();
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: TestResizeObserver,
  });
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
});

it("measures the bottom navigation and removes the spacer while listening", async () => {
  const navigation = document.createElement("nav");
  navigation.dataset.testid = "pwa-bottom-navigation";
  navigation.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
  document.body.appendChild(navigation);

  await act(async () => {
    renderer = create(<PwaConsumerTransportDock {...props} />, {
      createNodeMock: (element: { type: unknown }) =>
        element.type === "div"
          ? { getBoundingClientRect: () => ({ height: 125 }) }
          : null,
    });
  });

  expect(
    renderer.root.findByProps({ testID: "consumer-transport-spacer" }),
  ).toBeTruthy();
  expect(
    renderer.root.findByProps({ testID: "playback-transport" }),
  ).toBeTruthy();
  expect(observe).toHaveBeenCalledWith(navigation);
  expect(mockCreatePortal).toHaveBeenCalledWith(
    expect.anything(),
    document.body,
  );

  await act(async () => {
    resizeCallback([], {} as ResizeObserver);
    window.dispatchEvent(new Event("resize"));
  });

  await act(async () => {
    renderer.update(<PwaConsumerTransportDock {...props} canStop isPlaying />);
  });
  expect(
    renderer.root.findAllByProps({ testID: "consumer-transport-spacer" }),
  ).toHaveLength(0);
  expect(
    renderer.root.findByProps({ testID: "playback-transport" }),
  ).toBeTruthy();

  await act(async () => renderer.unmount());
  expect(disconnect).toHaveBeenCalledTimes(1);
});

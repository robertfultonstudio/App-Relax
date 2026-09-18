import { act, fireEvent, render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { PwaReviewTimeline } from "@/pwa-review/PwaReviewTimeline";
import { PwaReviewScrubber } from "@/pwa-review/PwaReviewScrubber";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";

const program = createWholeFileReviewProgram({
  outcome: "yoga",
  durationMinutes: 90,
  mode: "sound-only",
  soundKind: "music",
  seed: "timeline-transport",
});

it("places the slider immediately below the overview and moves its playhead with the uncommitted gesture", async () => {
  let resolve!: () => void;
  const onSeek = jest.fn(
    () =>
      new Promise<void>((yes) => {
        resolve = yes;
      }),
  );
  const props = {
    program,
    disabled: false,
    position: 10,
    onSeek,
    onTransition: jest.fn(),
  };
  const screen = await render(<PwaReviewTimeline {...props} />);
  const input = screen.getByLabelText("Review position");
  const container = input.parent!;
  expect(
    within(container).getByLabelText("primary timeline overview"),
  ).toBeTruthy();
  // The same small transport owns the diagram and the input, before track details.
  const children = container.children;
  expect(children.indexOf(input)).toBeGreaterThan(0);
  await fireEvent(input, "pointerDown", {
    currentTarget: { value: "10", setPointerCapture: jest.fn() },
    pointerId: 1,
  });
  await fireEvent(input, "input", { currentTarget: { value: "2700" } });
  expect(screen.getByLabelText("Review position").props.value).toBe(2700);
  expect(
    StyleSheet.flatten(
      screen.getByTestId("primary-timeline-playhead").props.style,
    ).left,
  ).toBe("50%");
  expect(
    screen.getByText("Session position · 45:00.00 / 90:00.00"),
  ).toBeTruthy();
  expect(onSeek).not.toHaveBeenCalled();
  await screen.rerender(<PwaReviewTimeline {...props} position={11} />);
  expect(
    StyleSheet.flatten(
      screen.getByTestId("primary-timeline-playhead").props.style,
    ).left,
  ).toBe("50%");
  await fireEvent(screen.getByLabelText("Review position"), "pointerUp", {
    currentTarget: { value: "2700" },
  });
  expect(onSeek).toHaveBeenCalledTimes(1);
  await act(async () => resolve());
  await screen.rerender(<PwaReviewTimeline {...props} position={2700} />);
  expect(screen.getByLabelText("Review position").props.value).toBe(2700);
});

it("restores the line as well as the thumb when a seek fails", async () => {
  const screen = await render(
    <PwaReviewTimeline
      program={program}
      disabled={false}
      position={540}
      onSeek={async () => {
        throw new Error("offline");
      }}
      onTransition={jest.fn()}
    />,
  );
  await fireEvent(screen.getByLabelText("Review position"), "change", {
    currentTarget: { value: "2700" },
  });
  await act(async () => {});
  expect(screen.getByLabelText("Review position").props.value).toBe(540);
  expect(
    StyleSheet.flatten(
      screen.getByTestId("primary-timeline-playhead").props.style,
    ).left,
  ).toBe("10%");
});

it.each([false, true])(
  "reads the real clock, respects reduced motion=%s, pauses while hidden and cleans up",
  async (reduced) => {
    const documentDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "document",
    );
    const mediaDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "matchMedia",
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: reduced }),
    });
    const doc = {
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: doc,
    });
    const frames = new Map<number, FrameRequestCallback>();
    let frameId = 0;
    const raf = jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb) => {
        frames.set(++frameId, cb);
        return frameId;
      });
    const cancel = jest
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation((id) => {
        if (typeof id === "number") frames.delete(id);
      });
    const tick = async (now: number) => {
      const entries = [...frames];
      frames.clear();
      await act(async () => {
        for (const [, callback] of entries) callback(now);
      });
    };
    let position = 10;
    const readPosition = jest.fn(() => position);
    try {
      const screen = await render(
        <PwaReviewScrubber
          duration={100}
          position={10}
          disabled={false}
          playing
          readPosition={readPosition}
          onSeek={jest.fn()}
        />,
      );
      position = 10.125;
      const startedReads = readPosition.mock.calls.length;
      await tick(100);
      if (reduced) {
        expect(readPosition).toHaveBeenCalledTimes(startedReads);
        await tick(600);
      }
      expect(screen.getByLabelText("Review position").props.value).toBe(10.125);
      const count = readPosition.mock.calls.length;
      doc.hidden = true;
      await tick(700);
      expect(readPosition).toHaveBeenCalledTimes(count);
      expect(frames.size).toBe(0);
      await screen.unmount();
      expect(doc.removeEventListener).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    } finally {
      raf.mockRestore();
      cancel.mockRestore();
      if (mediaDescriptor)
        Object.defineProperty(window, "matchMedia", mediaDescriptor);
      else Reflect.deleteProperty(window, "matchMedia");
      if (documentDescriptor)
        Object.defineProperty(globalThis, "document", documentDescriptor);
      else Reflect.deleteProperty(globalThis, "document");
    }
  },
);

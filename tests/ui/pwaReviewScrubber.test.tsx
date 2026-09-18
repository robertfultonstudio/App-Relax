import { act, fireEvent, render } from "@testing-library/react-native";
import { StrictMode } from "react";

import {
  clampPwaReviewPosition,
  PwaReviewScrubber,
} from "@/pwa-review/PwaReviewScrubber";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, reject, resolve };
}

it("clears busy after StrictMode replays the mount effect", async () => {
  const pending = deferred();
  const screen = await render(
    <StrictMode>
      <PwaReviewScrubber
        disabled={false}
        duration={300}
        onSeek={() => pending.promise}
        position={10}
      />
    </StrictMode>,
  );
  await fireEvent(screen.getByLabelText("Review position"), "change", {
    currentTarget: { value: "60" },
  });
  expect(screen.getByLabelText("Review position").props["aria-busy"]).toBe(
    true,
  );
  await act(async () => pending.resolve());
  expect(screen.getByLabelText("Review position").props["aria-busy"]).toBe(
    false,
  );
});

it("clamps invalid and end-of-file positions", () => {
  expect(clampPwaReviewPosition(-1, 50)).toBe(0);
  expect(clampPwaReviewPosition(999, 50)).toBe(49.999);
  expect(clampPwaReviewPosition(Number.NaN, 50)).toBe(0);
  expect(clampPwaReviewPosition(10, 0)).toBe(0);
});

it("keeps a stable local preview through drag and async seek, committing once", async () => {
  const pending = deferred();
  const onSeek = jest.fn(() => pending.promise);
  const screen = await render(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={10}
    />,
  );
  const slider = screen.getByLabelText("Review position");

  await fireEvent(slider, "pointerDown", {
    currentTarget: { setPointerCapture: jest.fn(), value: "10" },
    pointerId: 4,
  });
  await fireEvent(slider, "input", { currentTarget: { value: "120" } });
  await fireEvent(slider, "change", { currentTarget: { value: "120" } });
  expect(onSeek).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Review position").props.value).toBe(120);

  await screen.rerender(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={11}
    />,
  );
  expect(screen.getByLabelText("Review position").props.value).toBe(120);

  await fireEvent(screen.getByLabelText("Review position"), "pointerUp", {
    currentTarget: { value: "120" },
  });
  expect(onSeek).toHaveBeenCalledTimes(1);
  expect(onSeek).toHaveBeenCalledWith(120);
  expect(screen.getByLabelText("Review position").props["aria-busy"]).toBe(
    true,
  );

  await screen.rerender(
    <PwaReviewScrubber disabled duration={300} onSeek={onSeek} position={12} />,
  );
  expect(screen.getByLabelText("Review position").props.value).toBe(120);

  await act(async () => pending.resolve());
  expect(screen.getByLabelText("Review position").props["aria-busy"]).toBe(
    false,
  );
  expect(screen.getByLabelText("Review position").props.value).toBe(120);

  await screen.rerender(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={120.2}
    />,
  );
  expect(screen.getByLabelText("Review position").props.value).toBe(120.2);
});

it("supports track taps and suppresses duplicate release events", async () => {
  const onSeek = jest.fn();
  const screen = await render(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={10}
    />,
  );
  const slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "pointerDown", {
    currentTarget: { setPointerCapture: jest.fn(), value: "10" },
    pointerId: 5,
  });
  await fireEvent(slider, "pointerUp", { currentTarget: { value: "75" } });
  await fireEvent(slider, "touchEnd", { currentTarget: { value: "75" } });
  await fireEvent(slider, "change", { currentTarget: { value: "75" } });
  expect(onSeek).toHaveBeenCalledTimes(1);
  expect(onSeek).toHaveBeenCalledWith(75);
});

it("commits keyboard and VoiceOver changes without a pointer release", async () => {
  const onSeek = jest.fn();
  const screen = await render(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={10}
    />,
  );
  const slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "input", { currentTarget: { value: "40" } });
  await fireEvent(slider, "change", { currentTarget: { value: "40" } });
  expect(onSeek).toHaveBeenCalledTimes(1);
  expect(onSeek).toHaveBeenCalledWith(40);
  expect(slider.props.min).toBe(0);
  expect(slider.props.max).toBe(299.999);
  expect(slider.props.step).toBe(0.1);
  expect(slider.props.style).toEqual(
    expect.objectContaining({ minHeight: 48, touchAction: "pan-y" }),
  );
});

it("cancels pointer and touch drags without seeking and does not commit on unmount", async () => {
  const onSeek = jest.fn();
  const screen = await render(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={10}
    />,
  );
  let slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "pointerDown", {
    currentTarget: { setPointerCapture: jest.fn(), value: "10" },
    pointerId: 6,
  });
  await fireEvent(slider, "input", { currentTarget: { value: "80" } });
  await fireEvent(slider, "pointerCancel");
  expect(screen.getByLabelText("Review position").props.value).toBe(10);

  slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "touchStart", { currentTarget: { value: "10" } });
  await fireEvent(slider, "input", { currentTarget: { value: "90" } });
  await fireEvent(slider, "touchCancel");
  expect(screen.getByLabelText("Review position").props.value).toBe(10);

  slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "pointerDown", {
    currentTarget: { setPointerCapture: jest.fn(), value: "10" },
    pointerId: 7,
  });
  await fireEvent(slider, "input", { currentTarget: { value: "100" } });
  await screen.unmount();
  expect(onSeek).not.toHaveBeenCalled();
});

it("ignores gestures while disabled and restores only after a failed seek settles", async () => {
  const failed = deferred();
  const onSeek = jest.fn(() => failed.promise);
  const screen = await render(
    <PwaReviewScrubber
      disabled={false}
      duration={300}
      onSeek={onSeek}
      position={10}
    />,
  );
  let slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "change", { currentTarget: { value: "60" } });
  expect(screen.getByLabelText("Review position").props.value).toBe(60);
  await screen.rerender(
    <PwaReviewScrubber disabled duration={300} onSeek={onSeek} position={11} />,
  );
  slider = screen.getByLabelText("Review position");
  expect(slider.props.value).toBe(60);
  await fireEvent(slider, "change", { currentTarget: { value: "90" } });
  expect(onSeek).toHaveBeenCalledTimes(1);

  await act(async () => failed.reject(new Error("seek failed")));
  expect(screen.getByLabelText("Review position").props.value).toBe(11);
});

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Text, View, type TextStyle } from "react-native";

import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { reviewTime } from "./reviewTimeline";

const END_EPSILON_SECONDS = 0.001;
const POSITION_ACK_TOLERANCE_SECONDS = 1.25;

export interface PwaReviewScrubberProps {
  duration: number;
  position: number;
  disabled: boolean;
  onSeek: (seconds: number) => void | Promise<void>;
  label?: string;
  positionLabel?: string;
  renderOverview?: (position: number) => ReactNode;
  playing?: boolean;
  readPosition?: () => number | null;
}

export function clampPwaReviewPosition(
  value: number,
  duration: number,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(duration - END_EPSILON_SECONDS, value));
}

/**
 * Web-only review slider. Its local value owns the thumb while a native range
 * gesture or an asynchronous seek is active, so timer renders cannot pull the
 * thumb back underneath the user's finger.
 */
export function PwaReviewScrubber({
  duration,
  position,
  disabled,
  onSeek,
  label = "Review position",
  positionLabel,
  renderOverview,
  playing = false,
  readPosition,
}: PwaReviewScrubberProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initialPosition = clampPwaReviewPosition(position, duration);
  const externalPositionRef = useRef(initialPosition);
  const previewRef = useRef(initialPosition);
  const interactingRef = useRef(false);
  const optimisticTargetRef = useRef<number | null>(null);
  const suppressedChangeRef = useRef<number | null>(null);
  const seekGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const [preview, setPreview] = useState(initialPosition);
  const [busy, setBusy] = useState(false);

  // Read the audio clock, never extrapolate a wall-clock guess. Only this small
  // transport updates; the potentially hundreds of source markers stay still.
  useEffect(() => {
    if (
      !playing ||
      disabled ||
      !readPosition ||
      typeof document === "undefined"
    )
      return;
    let frame = 0;
    let lastPaint = 0;
    let visible = true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const schedule = () => {
      if (!frame && visible && !document.hidden)
        frame = requestAnimationFrame(paint);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            schedule();
          });
    if (inputRef.current)
      observer?.observe(inputRef.current.parentElement ?? inputRef.current);
    const paint = (now: number) => {
      frame = 0;
      schedule();
      if (
        document.hidden ||
        !visible ||
        now - lastPaint < (reduced?.matches ? 500 : 1000 / 30)
      )
        return;
      lastPaint = now;
      if (interactingRef.current || optimisticTargetRef.current !== null)
        return;
      const actual = readPosition();
      if (actual === null || !Number.isFinite(actual)) return;
      const value = clampPwaReviewPosition(actual, duration);
      externalPositionRef.current = value;
      previewRef.current = value;
      setPreview(value);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [disabled, duration, playing, readPosition]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      interactingRef.current = false;
      seekGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const next = clampPwaReviewPosition(readPosition?.() ?? position, duration);
    externalPositionRef.current = next;
    if (interactingRef.current) return;

    const optimisticTarget = optimisticTargetRef.current;
    if (
      optimisticTarget !== null &&
      Math.abs(next - optimisticTarget) > POSITION_ACK_TOLERANCE_SECONDS
    ) {
      return;
    }

    optimisticTargetRef.current = null;
    previewRef.current = next;
    setPreview(next);
  }, [duration, position, readPosition]);

  useEffect(() => {
    if (!disabled || !interactingRef.current) return;
    interactingRef.current = false;
    suppressedChangeRef.current = null;
    if (optimisticTargetRef.current === null) {
      previewRef.current = externalPositionRef.current;
      setPreview(externalPositionRef.current);
    }
  }, [disabled]);

  function valueFrom(input: HTMLInputElement): number {
    return clampPwaReviewPosition(Number(input.value), duration);
  }

  function show(value: number): void {
    previewRef.current = value;
    setPreview(value);
  }

  function beginInteraction(input: HTMLInputElement): void {
    if (disabled) return;
    interactingRef.current = true;
    suppressedChangeRef.current = null;
    show(valueFrom(input));
  }

  function cancelInteraction(): void {
    if (!interactingRef.current) return;
    interactingRef.current = false;
    suppressedChangeRef.current = null;
    const restored = optimisticTargetRef.current ?? externalPositionRef.current;
    show(restored);
  }

  function commit(value: number): void {
    if (disabled) return;
    const target = clampPwaReviewPosition(value, duration);
    const generation = ++seekGenerationRef.current;
    optimisticTargetRef.current = target;
    show(target);
    setBusy(true);

    let result: void | Promise<void>;
    try {
      result = onSeek(target);
    } catch {
      optimisticTargetRef.current = null;
      show(externalPositionRef.current);
      setBusy(false);
      return;
    }

    void Promise.resolve(result)
      .catch(() => {
        if (!mountedRef.current || seekGenerationRef.current !== generation)
          return;
        optimisticTargetRef.current = null;
        show(externalPositionRef.current);
      })
      .finally(() => {
        if (mountedRef.current && seekGenerationRef.current === generation) {
          setBusy(false);
        }
      });
  }

  function finishInteraction(input: HTMLInputElement): void {
    if (!interactingRef.current || disabled) return;
    const target = valueFrom(input);
    interactingRef.current = false;
    // Some WebKit/React combinations emit a trailing change after pointer/touch
    // release. Suppress only that same value; a new gesture clears the guard.
    suppressedChangeRef.current = target;
    commit(target);
  }

  const maximum = Math.max(0, duration - END_EPSILON_SECONDS);

  return (
    <View style={styles.container}>
      {renderOverview?.(preview)}
      <input
        ref={inputRef}
        aria-busy={busy}
        aria-label={label}
        aria-valuetext={`${reviewTime(preview)} of ${reviewTime(duration)}`}
        disabled={disabled}
        max={maximum}
        min={0}
        onBlur={cancelInteraction}
        onChange={(event) => {
          if (disabled) return;
          const target = valueFrom(event.currentTarget);
          show(target);
          if (interactingRef.current) return;
          if (
            suppressedChangeRef.current !== null &&
            Math.abs(suppressedChangeRef.current - target) < END_EPSILON_SECONDS
          ) {
            suppressedChangeRef.current = null;
            return;
          }
          suppressedChangeRef.current = null;
          commit(target);
        }}
        onInput={(event) => {
          if (!disabled) show(valueFrom(event.currentTarget));
        }}
        onPointerCancel={cancelInteraction}
        onPointerDown={(event) => {
          beginInteraction(event.currentTarget);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Pointer capture is optional on older WebKit range inputs.
          }
        }}
        onPointerUp={(event) => finishInteraction(event.currentTarget)}
        onTouchCancel={cancelInteraction}
        onTouchEnd={(event) => finishInteraction(event.currentTarget)}
        onTouchStart={(event) => beginInteraction(event.currentTarget)}
        step={0.1}
        style={styles.input}
        type="range"
        value={preview}
      />
      {positionLabel && (
        <Text style={styles.position}>
          {positionLabel} · {reviewTime(preview)} / {reviewTime(duration)}
        </Text>
      )}
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {busy ? "Seeking…" : ""}
      </Text>
    </View>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  input: {
    accentColor: editorial.ink,
    boxSizing: "border-box",
    margin: 0,
    minHeight: 48,
    touchAction: "pan-y",
    width: "100%",
  },
  status: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 18,
  },
  position: {
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    fontVariant: ["tabular-nums"] as NonNullable<TextStyle["fontVariant"]>,
  },
} as const;

export default PwaReviewScrubber;

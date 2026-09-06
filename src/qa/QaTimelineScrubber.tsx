import { useEffect, useRef, useState } from "react";
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AdaptiveSessionPlan } from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export function clampTimelinePosition(
  localX: number,
  width: number,
  totalSeconds: number,
): number {
  if (
    !Number.isFinite(localX) ||
    !Number.isFinite(width) ||
    !Number.isFinite(totalSeconds) ||
    width <= 0 ||
    totalSeconds <= 0
  ) {
    return 0;
  }
  const fraction = Math.min(1, Math.max(0, localX / width));
  return Math.min(totalSeconds - 0.001, fraction * totalSeconds);
}

interface TimelinePointerCoordinates {
  clientX?: number;
  locationX?: number;
  pageX?: number;
}

export function resolveTimelineLocalX(
  coordinates: TimelinePointerCoordinates,
  measuredLeft: number | null,
  clientRectLeft: number | null,
): number | null {
  if (Number.isFinite(coordinates.locationX)) {
    return coordinates.locationX!;
  }
  if (Number.isFinite(coordinates.clientX) && Number.isFinite(clientRectLeft)) {
    return coordinates.clientX! - clientRectLeft!;
  }
  if (Number.isFinite(coordinates.pageX) && Number.isFinite(measuredLeft)) {
    return coordinates.pageX! - measuredLeft!;
  }
  return null;
}

function eventLocalX(
  event: GestureResponderEvent,
  measuredLeft: number | null,
): number | null {
  const nativeEvent =
    event.nativeEvent as unknown as TimelinePointerCoordinates;
  const currentTarget = event.currentTarget as unknown as
    { getBoundingClientRect?: () => { left: number } } | undefined;
  const rect = currentTarget?.getBoundingClientRect?.();
  return resolveTimelineLocalX(
    nativeEvent,
    measuredLeft,
    rect && Number.isFinite(rect.left) ? rect.left : null,
  );
}

interface QaTimelineScrubberProps {
  onSeek: (positionSeconds: number) => boolean | void | Promise<boolean | void>;
  plan: AdaptiveSessionPlan;
  positionSeconds: number;
}

export function QaTimelineScrubber({
  onSeek,
  plan,
  positionSeconds,
}: QaTimelineScrubberProps) {
  const trackRef = useRef<View>(null);
  const widthRef = useRef(1);
  const leftRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const previewRef = useRef(positionSeconds);
  const commitGenerationRef = useRef(0);
  const [previewSeconds, setPreviewSeconds] = useState(positionSeconds);

  useEffect(() => {
    if (
      draggingRef.current ||
      Math.abs(previewRef.current - positionSeconds) < 0.001
    ) {
      return;
    }
    previewRef.current = positionSeconds;
    setPreviewSeconds(positionSeconds);
  }, [positionSeconds]);

  function measureTrack(): void {
    trackRef.current?.measureInWindow((left, _top, width) => {
      if (Number.isFinite(left)) leftRef.current = left;
      if (Number.isFinite(width) && width > 0) widthRef.current = width;
    });
  }

  function updateFromEvent(event: GestureResponderEvent): number | null {
    const localX = eventLocalX(event, leftRef.current);
    if (localX === null) return null;
    const target = clampTimelinePosition(
      localX,
      widthRef.current,
      plan.totalDurationSeconds,
    );
    previewRef.current = target;
    setPreviewSeconds(target);
    return target;
  }

  async function commit(target: number): Promise<void> {
    const generation = ++commitGenerationRef.current;
    previewRef.current = target;
    setPreviewSeconds(target);
    let accepted = false;
    try {
      accepted = (await onSeek(target)) !== false;
    } catch {
      accepted = false;
    }
    if (!accepted && commitGenerationRef.current === generation) {
      previewRef.current = positionSeconds;
      setPreviewSeconds(positionSeconds);
    }
  }

  function nudge(deltaSeconds: number): void {
    void commit(
      Math.min(
        plan.totalDurationSeconds - 0.001,
        Math.max(0, previewRef.current + deltaSeconds),
      ),
    );
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent): void {
    nudge(event.nativeEvent.actionName === "increment" ? 10 : -10);
  }

  const cursorPercent = Math.min(
    99.7,
    Math.max(0, (previewSeconds / plan.totalDurationSeconds) * 100),
  );

  return (
    <View>
      <View
        accessibilityActions={[
          { name: "decrement", label: "Back ten seconds" },
          { name: "increment", label: "Forward ten seconds" },
        ]}
        accessibilityHint="Click or drag anywhere on the timeline to change position"
        accessibilityLabel="Full session scrubber"
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: 0,
          max: Math.round(plan.totalDurationSeconds),
          now: Math.round(previewSeconds),
        }}
        onAccessibilityAction={handleAccessibilityAction}
        onLayout={(event: LayoutChangeEvent) => {
          widthRef.current = Math.max(1, event.nativeEvent.layout.width);
          measureTrack();
        }}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          draggingRef.current = true;
          measureTrack();
          updateFromEvent(event);
        }}
        onResponderMove={(event) => {
          updateFromEvent(event);
        }}
        onResponderRelease={(event) => {
          const target = updateFromEvent(event) ?? previewRef.current;
          draggingRef.current = false;
          void commit(target);
        }}
        onResponderTerminate={() => {
          draggingRef.current = false;
          previewRef.current = positionSeconds;
          setPreviewSeconds(positionSeconds);
        }}
        onStartShouldSetResponder={() => true}
        ref={trackRef}
        style={styles.timeline}
        testID="qa-session-scrubber"
      >
        {plan.phases.map((phase) => (
          <View
            key={phase.id}
            pointerEvents="none"
            style={[
              styles.phase,
              {
                flex: phase.endFrame - phase.startFrame,
                backgroundColor: PHASE_COLOURS[phase.id],
              },
            ]}
          >
            <Text style={styles.phaseText}>{phase.id.toUpperCase()}</Text>
          </View>
        ))}
        {plan.transitions.flatMap((transition) => [
          <View
            key={`start-${transition.index}`}
            accessibilityElementsHidden
            pointerEvents="none"
            style={[
              styles.marker,
              {
                backgroundColor: editorial.gold,
                left: `${(transition.startSeconds / plan.totalDurationSeconds) * 100}%`,
              },
            ]}
          />,
          <View
            key={`end-${transition.index}`}
            accessibilityElementsHidden
            pointerEvents="none"
            style={[
              styles.marker,
              {
                backgroundColor: editorial.rose,
                left: `${(transition.endSeconds / plan.totalDurationSeconds) * 100}%`,
              },
            ]}
          />,
        ])}
        <View
          pointerEvents="none"
          style={[styles.cursor, { left: `${cursorPercent}%` }]}
        >
          <View style={styles.handle} />
        </View>
      </View>

      <View style={styles.positionRow}>
        <Text style={styles.position}>
          {displayTime(previewSeconds)} /{" "}
          {displayTime(plan.totalDurationSeconds)}
        </Text>
        <View style={styles.nudges}>
          <Pressable
            accessibilityLabel="Back ten seconds"
            accessibilityRole="button"
            onPress={() => nudge(-10)}
            style={styles.nudge}
          >
            <Text style={styles.nudgeText}>−10 SEC</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Forward ten seconds"
            accessibilityRole="button"
            onPress={() => nudge(10)}
            style={styles.nudge}
          >
            <Text style={styles.nudgeText}>+10 SEC</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.hint}>CLICK OR DRAG TO SEEK · WORKS BEFORE PLAY</Text>
    </View>
  );
}

function displayTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

const PHASE_COLOURS = {
  arrival: "#CFDDE0",
  flow: "#C8DDD5",
  deepening: "#D9CFDF",
  return: "#E9D8B8",
} as const;

const styles = StyleSheet.create({
  timeline: {
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    cursor: "pointer",
    flexDirection: "row",
    height: 96,
    marginTop: spacing.md,
    overflow: "hidden",
    position: "relative",
    userSelect: "none",
  },
  phase: { alignItems: "center", justifyContent: "center" },
  phaseText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  marker: { bottom: 0, position: "absolute", top: 0, width: 2 },
  cursor: {
    backgroundColor: editorial.ink,
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 2,
  },
  handle: {
    backgroundColor: editorial.ink,
    borderColor: editorial.paperLight,
    borderWidth: 2,
    height: 20,
    left: -9,
    position: "absolute",
    top: -1,
    transform: [{ rotate: "45deg" }],
    width: 20,
  },
  positionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  position: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
  },
  nudges: { flexDirection: "row", gap: spacing.sm },
  nudge: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 84,
    paddingHorizontal: spacing.md,
  },
  nudgeText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  hint: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.7,
    marginTop: spacing.sm,
  },
});

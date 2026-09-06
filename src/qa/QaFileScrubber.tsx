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
import {
  clampTimelinePosition,
  resolveTimelineLocalX,
} from "@/qa/QaTimelineScrubber";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

interface PointerCoordinates {
  clientX?: number;
  locationX?: number;
  pageX?: number;
}

interface QaFileScrubberProps {
  durationSeconds: number;
  onSeek: (positionSeconds: number) => boolean | void | Promise<boolean | void>;
  positionSeconds: number;
  title: string;
}

function localXFromEvent(
  event: GestureResponderEvent,
  measuredLeft: number | null,
): number | null {
  const coordinates = event.nativeEvent as unknown as PointerCoordinates;
  const currentTarget = event.currentTarget as unknown as
    { getBoundingClientRect?: () => { left: number } } | undefined;
  const rect = currentTarget?.getBoundingClientRect?.();
  return resolveTimelineLocalX(
    coordinates,
    measuredLeft,
    rect && Number.isFinite(rect.left) ? rect.left : null,
  );
}

export function QaFileScrubber({
  durationSeconds,
  onSeek,
  positionSeconds,
  title,
}: QaFileScrubberProps) {
  const trackRef = useRef<View>(null);
  const widthRef = useRef(1);
  const leftRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const previewRef = useRef(positionSeconds);
  const commitGenerationRef = useRef(0);
  const [previewSeconds, setPreviewSeconds] = useState(positionSeconds);

  useEffect(() => {
    if (draggingRef.current) return;
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
    const localX = localXFromEvent(event, leftRef.current);
    if (localX === null) return null;
    const target = clampTimelinePosition(
      localX,
      widthRef.current,
      durationSeconds,
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
        durationSeconds - 0.001,
        Math.max(0, previewRef.current + deltaSeconds),
      ),
    );
  }

  function onAccessibilityAction(event: AccessibilityActionEvent): void {
    nudge(event.nativeEvent.actionName === "increment" ? 10 : -10);
  }

  const progress = Math.min(
    99.7,
    Math.max(0, (previewSeconds / durationSeconds) * 100),
  );

  return (
    <View>
      <View
        accessibilityActions={[
          { name: "decrement", label: "Back ten seconds" },
          { name: "increment", label: "Forward ten seconds" },
        ]}
        accessibilityHint="Click or drag to change position inside this file"
        accessibilityLabel={`${title} file scrubber`}
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: 0,
          max: Math.round(durationSeconds),
          now: Math.round(previewSeconds),
        }}
        onAccessibilityAction={onAccessibilityAction}
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
        onResponderMove={updateFromEvent}
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
        style={styles.track}
        testID="qa-file-scrubber"
      >
        <View
          pointerEvents="none"
          style={[styles.progress, { width: `${progress}%` }]}
        />
        <View
          pointerEvents="none"
          style={[styles.cursor, { left: `${progress}%` }]}
        >
          <View style={styles.handle} />
        </View>
      </View>
      <View style={styles.positionRow}>
        <Text style={styles.position}>
          {displayTime(previewSeconds)} / {displayTime(durationSeconds)}
        </Text>
        <View style={styles.nudges}>
          <Nudge
            label="Back ten seconds"
            onPress={() => nudge(-10)}
            text="−10 SEC"
          />
          <Nudge
            label="Forward ten seconds"
            onPress={() => nudge(10)}
            text="+10 SEC"
          />
        </View>
      </View>
      <Text style={styles.hint}>CLICK OR DRAG · POSITION INSIDE THE FILE</Text>
    </View>
  );
}

function Nudge({
  label,
  onPress,
  text,
}: {
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.nudge}
    >
      <Text style={styles.nudgeText}>{text}</Text>
    </Pressable>
  );
}

function displayTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: "#E8DDD0",
    height: 76,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  progress: {
    backgroundColor: "#C8DDD5",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  cursor: {
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 2,
  },
  handle: {
    backgroundColor: editorial.ink,
    borderColor: editorial.paperLight,
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    left: -8,
    position: "absolute",
    top: 29,
    width: 18,
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
    fontSize: 19,
  },
  nudges: { flexDirection: "row", gap: spacing.sm },
  nudge: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  nudgeText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.55,
  },
  hint: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
});

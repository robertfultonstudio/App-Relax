import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { PwaReviewScrubber } from "./PwaReviewScrubber";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import { reviewMarkers, reviewTime } from "./reviewTimeline";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

export function PwaReviewTimeline({
  program,
  disabled,
  position,
  onSeek: seekInput,
  onTransition: transitionInput,
  playing = false,
  readPosition,
}: {
  program: AdaptiveSessionProgram;
  disabled: boolean;
  position: number;
  onSeek: (seconds: number) => void | Promise<void>;
  playing?: boolean;
  readPosition?: () => number | null;
  onTransition: (index: number, point?: "start" | "end" | "preview") => void;
}) {
  const callbacks = useRef({ seekInput, transitionInput });
  useLayoutEffect(() => {
    callbacks.current = { seekInput, transitionInput };
  }, [seekInput, transitionInput]);
  const onSeek = useCallback(
    (seconds: number) => callbacks.current.seekInput(seconds),
    [],
  );
  const onTransition = useCallback(
    (index: number, point?: "start" | "end" | "preview") =>
      callbacks.current.transitionInput(index, point),
    [],
  );
  const markers = useMemo(() => reviewMarkers(program), [program]);
  const lanes = useMemo(
    () =>
      (["primary", "nature"] as const).map((lane) => ({
        lane,
        segments: program.plan.segments.filter(
          (s) => (s.lane ?? "primary") === lane,
        ),
      })),
    [program],
  );
  const previous = [...markers]
    .reverse()
    .find((m) => m.seconds < position - 0.1);
  const next = markers.find((m) => m.seconds > position + 0.1);
  return (
    <View style={{ gap: 12 }} testID="review-full-timeline">
      <Text style={styles.heading}>COMPLETE TIMELINE · MUSIC & AMBIENCE</Text>
      <Text style={styles.body}>
        Drag to inspect your session. Open the source details for exact loop
        points, entries and exits.
      </Text>
      <View style={styles.row}>
        <Point
          label="Previous timeline point"
          disabled={disabled || !previous}
          onPress={() => previous && onSeek(previous.seconds)}
        />
        <Point
          label="Next timeline point"
          disabled={disabled || !next}
          onPress={() => next && onSeek(next.seconds)}
        />
      </View>
      {lanes.map(({ lane, segments }) => {
        if (!segments.length) return null;
        return (
          <View key={lane} style={{ gap: 12 }}>
            <Text style={styles.heading}>
              {lane === "nature" ? "NATURAL AMBIENCE" : "MUSIC / PRIMARY SOUND"}{" "}
              · {segments.length} sources
            </Text>
            <PwaReviewScrubber
              duration={program.plan.totalDurationSeconds}
              position={position}
              disabled={disabled}
              onSeek={onSeek}
              label={
                lane === "primary"
                  ? "Review position"
                  : "Ambience timeline position"
              }
              positionLabel={
                lane === "primary" ? "Session position" : "Ambience position"
              }
              playing={playing}
              readPosition={readPosition}
              renderOverview={(cursor) => (
                <TimelineDiagram
                  lane={lane}
                  segments={segments}
                  duration={program.plan.totalDurationSeconds}
                  position={cursor}
                />
              )}
            />
            <details>
              <summary
                style={{ fontSize: 14, padding: "12px 0", cursor: "pointer" }}
              >
                <Text style={styles.body}>Source entries, loops & exits</Text>
              </summary>
              <LaneDetails
                program={program}
                segments={segments}
                markers={markers}
                disabled={disabled}
                onSeek={onSeek}
              />
            </details>
          </View>
        );
      })}
      <details>
        <summary style={{ fontSize: 14, padding: "12px 0", cursor: "pointer" }}>
          <Text style={styles.body}>
            All joins · {program.plan.transitions.length}
          </Text>
        </summary>
        <JoinDetails
          program={program}
          disabled={disabled}
          onTransition={onTransition}
        />
      </details>
    </View>
  );
}

// Position ticks must not rebuild every join and its press handlers. The plan
// and the stable callback are the only inputs to this editorial detail list.
const JoinDetails = memo(function JoinDetails({
  program,
  disabled,
  onTransition,
}: {
  program: AdaptiveSessionProgram;
  disabled: boolean;
  onTransition: (index: number, point?: "start" | "end" | "preview") => void;
}) {
  return (
    <>
      <Text style={styles.heading}>
        ALL JOINS · {program.plan.transitions.length}
      </Text>
      {program.plan.transitions.map((t, i) => (
        <View key={t.index} style={styles.segment}>
          <Text style={styles.body}>
            {i + 1}. {t.lane === "nature" ? "Ambience" : "Music"} ·{" "}
            {t.durationSeconds.toFixed(2)} s · {t.curve}
          </Text>
          <View style={styles.row}>
            <Point
              label={`Join ${i + 1} start · ${reviewTime(t.startSeconds)}`}
              disabled={disabled}
              onPress={() => onTransition(i, "start")}
            />
            <Point
              label={`Join ${i + 1} end · ${reviewTime(t.endSeconds)}`}
              disabled={disabled}
              onPress={() => onTransition(i, "end")}
            />
            <Point
              label={`Audition join ${i + 1} · 30 seconds before`}
              disabled={disabled}
              onPress={() => onTransition(i, "preview")}
            />
          </View>
        </View>
      ))}
    </>
  );
});

type Segments = AdaptiveSessionProgram["plan"]["segments"];
function TimelineDiagram({
  lane,
  segments,
  duration,
  position,
}: {
  lane: "primary" | "nature";
  segments: Segments;
  duration: number;
  position: number;
}) {
  const bars = useMemo(
    () =>
      segments.map((s, i) => (
        <View
          key={s.index}
          style={{
            position: "absolute",
            top: i * 22,
            height: 14,
            left: `${(100 * s.startSeconds) / duration}%`,
            width: `${(100 * (s.endSeconds - s.startSeconds)) / duration}%`,
            backgroundColor: lane === "nature" ? "#46635e" : "#786a89",
          }}
        />
      )),
    [segments, duration, lane],
  );
  return (
    <View
      accessibilityLabel={`${lane} timeline overview`}
      style={{
        height: segments.length * 22,
        position: "relative",
        backgroundColor: editorial.paperLight,
      }}
    >
      {bars}
      <View
        testID={`${lane}-timeline-playhead`}
        style={{
          position: "absolute",
          height: "100%",
          width: 2,
          backgroundColor: editorial.ink,
          left: `${Math.min(100, (100 * position) / duration)}%`,
        }}
      />
    </View>
  );
}
const LaneDetails = memo(function LaneDetails({
  program,
  segments,
  markers,
  disabled,
  onSeek,
}: {
  program: AdaptiveSessionProgram;
  segments: Segments;
  markers: ReturnType<typeof reviewMarkers>;
  disabled: boolean;
  onSeek: (seconds: number) => void | Promise<void>;
}) {
  return (
    <>
      {segments.map((s) => {
        const work = program.works.find((w) => w.id === s.workId);
        const loops = markers.filter(
          (m) => m.segmentIndex === s.index && m.kind === "loop",
        );
        return (
          <View
            key={s.index}
            style={styles.segment}
            testID={`review-segment-${s.index}`}
          >
            <Text style={styles.body}>
              {s.index + 1}. {work?.title ?? s.title}
            </Text>
            <Text style={styles.small} selectable>
              {work?.localPreviewFilename ?? work?.sourceFilename}
            </Text>
            <Text style={styles.small}>
              {loops.length
                ? work && (s.endFrame - s.startFrame) % work.frameCount === 0
                  ? `${loops.length + 1} complete source iterations · `
                  : `${loops.length} source loop points · `
                : ""}
              Source entry {reviewTime(s.sourceEntrySeconds)} · exit{" "}
              {reviewTime(s.sourceExitSeconds)} · length{" "}
              {reviewTime(work?.durationSeconds ?? 0)}
            </Text>
            <View style={styles.row}>
              <Point
                label={`Entry ${s.index + 1} · ${reviewTime(s.startSeconds)}`}
                disabled={disabled}
                onPress={() => onSeek(s.startSeconds)}
              />
              <Point
                label={`Exit ${s.index + 1} · ${reviewTime(s.endSeconds)}`}
                disabled={disabled}
                onPress={() => onSeek(s.endSeconds)}
              />
              {loops.map((m, i) => (
                <Point
                  key={m.id}
                  label={`Loop ${s.index + 1}.${i + 1} · ${reviewTime(m.seconds)}`}
                  disabled={disabled}
                  onPress={() => onSeek(m.seconds)}
                />
              ))}
              {loops.map((m, i) => (
                <Point
                  key={`${m.id}:preview`}
                  label={`Preview loop ${s.index + 1}.${i + 1} · 15 seconds before ${reviewTime(m.seconds)}`}
                  disabled={disabled}
                  onPress={() =>
                    onSeek(Math.max(s.startSeconds, m.seconds - 15))
                  }
                />
              ))}
            </View>
            {!loops.length && (
              <Text style={styles.small}>
                No repeated source boundary inside this segment.
              </Text>
            )}
          </View>
        );
      })}
    </>
  );
});

function Point({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.point, disabled && { opacity: 0.5 }]}
    >
      <Text style={styles.small}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  point: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: editorial.inkMuted,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: editorial.ink,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: editorial.ink,
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: editorial.inkMuted,
  },
  segment: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.inkMuted,
    gap: 8,
    paddingBottom: 16,
  },
});

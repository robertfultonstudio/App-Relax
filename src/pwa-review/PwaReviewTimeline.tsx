import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import { reviewMarkers, reviewTime } from "./reviewTimeline";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

export function PwaReviewTimeline({
  program,
  disabled,
  position,
  onSeek,
  onTransition,
}: {
  program: AdaptiveSessionProgram;
  disabled: boolean;
  position: number;
  onSeek: (seconds: number) => void;
  onTransition: (index: number) => void;
}) {
  const markers = reviewMarkers(program);
  const previous = [...markers]
    .reverse()
    .find((m) => m.seconds < position - 0.1);
  const next = markers.find((m) => m.seconds > position + 0.1);
  return (
    <View style={{ gap: 12 }} testID="review-full-timeline">
      <Text style={styles.heading}>COMPLETE TIMELINE · MUSIC & AMBIENCE</Text>
      <Text style={styles.body}>
        Every entry, source loop, join and exit below belongs to this actual
        plan. Tap a time to seek; loop tests begin 15 seconds before the seam.
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
      {(["primary", "nature"] as const).map((lane) => {
        const segments = program.plan.segments.filter(
          (s) => (s.lane ?? "primary") === lane,
        );
        if (!segments.length) return null;
        return (
          <View key={lane} style={{ gap: 12 }}>
            <Text style={styles.heading}>
              {lane === "nature" ? "NATURAL AMBIENCE" : "MUSIC / PRIMARY SOUND"}{" "}
              · {segments.length} sources
            </Text>
            <View
              accessibilityLabel={`${lane} timeline overview`}
              style={{
                height: segments.length * 22,
                position: "relative",
                backgroundColor: editorial.paperLight,
              }}
            >
              {segments.map((s, i) => (
                <View
                  key={s.index}
                  style={{
                    position: "absolute",
                    top: i * 22,
                    height: 14,
                    left: `${(100 * s.startSeconds) / program.plan.totalDurationSeconds}%`,
                    width: `${(100 * (s.endSeconds - s.startSeconds)) / program.plan.totalDurationSeconds}%`,
                    backgroundColor: lane === "nature" ? "#46635e" : "#786a89",
                  }}
                />
              ))}
              <View
                style={{
                  position: "absolute",
                  height: "100%",
                  width: 2,
                  backgroundColor: editorial.ink,
                  left: `${Math.min(100, (100 * position) / program.plan.totalDurationSeconds)}%`,
                }}
              />
            </View>
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
                      ? work &&
                        (s.endFrame - s.startFrame) % work.frameCount === 0
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
                      onPress={() =>
                        onSeek(Math.max(s.startSeconds, s.endSeconds - 15))
                      }
                    />
                    {loops.map((m, i) => (
                      <Point
                        key={m.id}
                        label={`Loop ${s.index + 1}.${i + 1} · ${reviewTime(m.seconds)}`}
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
          </View>
        );
      })}
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
              onPress={() => onSeek(t.startSeconds)}
            />
            <Point
              label={`Join ${i + 1} end · ${reviewTime(t.endSeconds)}`}
              disabled={disabled}
              onPress={() => onSeek(t.endSeconds)}
            />
            <Point
              label={`Audition join ${i + 1}`}
              disabled={disabled}
              onPress={() => onTransition(i)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

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

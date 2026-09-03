import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";
import type { SessionDurationMinutes } from "@/domain/sessions/types";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import {
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  recentWorkIdsForOutcome,
} from "@/state/adaptiveSessionPersistence";

const historyStore = createAdaptiveSessionHistoryStore();
const OUTCOMES = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
] as const;
const DURATIONS = [10, 20, 30, 45, 60, 90] as const;

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AdaptiveSessionPlayerScreen() {
  const params = useLocalSearchParams<{
    duration?: string;
    outcomeId?: string;
    start?: string;
  }>();
  const { controller, snapshot } = useAudioSession();
  const recordedPlan = useRef<string | null>(null);
  const [historyState, setHistoryState] = useState<{
    outcome: ConsumerOutcomeId;
    recentWorkIds: string[];
    error: string | null;
  } | null>(null);
  const qaAvailable = isAdaptivePlaybackAvailable();
  const outcome = OUTCOMES.includes(params.outcomeId as ConsumerOutcomeId)
    ? (params.outcomeId as ConsumerOutcomeId)
    : null;
  const parsedDuration = Number(params.duration);
  const duration = DURATIONS.includes(parsedDuration as SessionDurationMinutes)
    ? (parsedDuration as SessionDurationMinutes)
    : null;
  const seed = useMemo(
    () =>
      outcome && duration
        ? createConsumerSessionSeed({
            outcome,
            durationMinutes: duration,
            mode: "sound-only",
          })
        : null,
    [duration, outcome],
  );
  useEffect(() => {
    let mounted = true;
    if (!qaAvailable || !outcome) return;
    void historyStore
      .load()
      .then((history) => {
        if (mounted) {
          setHistoryState({
            outcome,
            recentWorkIds: recentWorkIdsForOutcome(history, outcome),
            error: null,
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setHistoryState({
            outcome,
            recentWorkIds: [],
            error: "Saved session history could not be read.",
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [outcome, qaAvailable]);
  const currentHistory =
    outcome && historyState?.outcome === outcome ? historyState : null;
  const recentWorkIds = useMemo(
    () =>
      qaAvailable ? (currentHistory?.recentWorkIds ?? null) : ([] as string[]),
    [currentHistory, qaAvailable],
  );
  const historyError = qaAvailable ? (currentHistory?.error ?? null) : null;
  const result = useMemo(() => {
    if (recentWorkIds === null) {
      return { program: null, error: null };
    }
    if (!qaAvailable) {
      return {
        program: null,
        error: "Session playback is in production on this device.",
      };
    }
    if (historyError) return { program: null, error: historyError };
    if (!outcome || !duration || !seed) {
      return { program: null, error: "This session request is not available." };
    }
    try {
      return {
        program: createAdaptiveSessionProgram({
          outcome,
          durationMinutes: duration,
          mode: "sound-only",
          seed,
          recentWorkIds,
          allowProvisionalMetadata: true,
        }),
        error: null,
      };
    } catch (error) {
      return {
        program: null,
        error: error instanceof Error ? error.message : "Session unavailable.",
      };
    }
  }, [duration, historyError, outcome, qaAvailable, recentWorkIds, seed]);

  useEffect(() => {
    if (!result.program) return;
    const program = result.program;
    void (async () => {
      await controller.loadAdaptiveSession(program);
      if (params.start === "1") await controller.play();
      if (
        controller.getSnapshot().status === "playing" &&
        recordedPlan.current !== program.plan.id
      ) {
        recordedPlan.current = program.plan.id;
        await historyStore.recordStart(
          {
            outcome: program.plan.outcome,
            durationMinutes: program.plan.requestedDurationMinutes,
            mode: "sound-only",
          },
          program.plan,
        );
      }
    })();
  }, [controller, params.start, result.program]);

  if (recentWorkIds === null) {
    return (
      <EditorialScreen>
        <EditorialHeader label="SESSION" showBack />
        <Text accessibilityRole="header" style={styles.title}>
          Preparing your session…
        </Text>
      </EditorialScreen>
    );
  }

  if (!outcome || !duration || !result.program) {
    return (
      <EditorialScreen>
        <EditorialHeader label="SESSION" showBack />
        <Text accessibilityRole="header" style={styles.title}>
          Session unavailable.
        </Text>
        <Text accessibilityRole="alert" style={styles.error}>
          {result.error}
        </Text>
      </EditorialScreen>
    );
  }

  const program = result.program;
  const elapsedSeconds = Math.max(
    0,
    program.plan.totalDurationSeconds - snapshot.remainingMs / 1000,
  );
  const currentSegment =
    [...program.plan.segments]
      .reverse()
      .find(
        (segment) =>
          elapsedSeconds >= segment.startSeconds &&
          elapsedSeconds < segment.endSeconds,
      ) ?? program.plan.segments[0];
  const isPlaying = snapshot.status === "playing";
  const canPlay = snapshot.status === "ready" || snapshot.status === "paused";
  const canStop = snapshot.status === "playing" || snapshot.status === "paused";
  const policy = getSessionPolicy(outcome);

  return (
    <EditorialScreen>
      <EditorialHeader label={`${outcome.toUpperCase()} SESSION`} showBack />
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={OUTCOME_ARTWORK[outcome]}
        style={styles.artwork}
      />
      <Text style={styles.kicker}>SOUND ONLY · {duration} MIN</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {policy.startLabel}
      </Text>
      <Text style={styles.review}>PREVIEW MODE · LISTENING REVIEW PENDING</Text>
      <Text
        accessibilityLabel={`${formatRemaining(snapshot.remainingMs)} remaining`}
        style={styles.timer}
      >
        {formatRemaining(snapshot.remainingMs)}
      </Text>
      <View style={styles.nowPanel}>
        <Text style={styles.nowLabel}>
          {currentSegment.phase.toUpperCase()}
        </Text>
        <Text style={styles.nowTitle}>{currentSegment.title}</Text>
      </View>
      {snapshot.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {snapshot.error}
        </Text>
      ) : null}
      <View style={styles.transport}>
        <Pressable
          accessibilityLabel="Stop"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStop }}
          disabled={!canStop}
          onPress={() => void controller.stop()}
          style={[styles.secondaryButton, !canStop && styles.disabled]}
        >
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isPlaying && !canPlay }}
          disabled={!isPlaying && !canPlay}
          onPress={() =>
            void (isPlaying ? controller.pause() : controller.play())
          }
          style={[
            styles.primaryButton,
            !isPlaying && !canPlay && styles.disabled,
          ]}
          testID="adaptive-play-pause"
        >
          <Text style={styles.primaryText}>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>
        One work at a time. The next passage is prepared quietly, then the
        session closes at the time you chose.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  artwork: { height: 200, width: "100%" },
  kicker: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
    marginTop: spacing.lg,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 43,
    marginTop: spacing.sm,
  },
  review: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.55,
    marginTop: spacing.sm,
  },
  timer: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 58,
    lineHeight: 64,
    marginTop: spacing.xl,
  },
  nowPanel: {
    borderLeftColor: editorial.jade,
    borderLeftWidth: 2,
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  nowLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  nowTitle: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    marginTop: 3,
  },
  transport: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  secondaryButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: editorial.ink,
    flex: 2,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  secondaryText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  disabled: { opacity: 0.42 },
  note: {
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
});

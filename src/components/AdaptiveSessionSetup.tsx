import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OfflinePackageStatus } from "./OfflinePackageStatus";
import { SessionDurationPicker } from "./SessionDurationPicker";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import type {
  SessionDurationMinutes,
  SessionMode,
} from "@/domain/sessions/types";
import {
  createAdaptiveSessionHistoryStore,
  recentWorkIdsForOutcome,
} from "@/state/adaptiveSessionPersistence";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

const historyStore = createAdaptiveSessionHistoryStore();

export function AdaptiveSessionSetup({
  outcome,
  qaAvailable = isAdaptivePlaybackAvailable(),
}: {
  outcome: ConsumerOutcomeId;
  qaAvailable?: boolean;
}) {
  const router = useRouter();
  const policy = getSessionPolicy(outcome);
  const [duration, setDuration] = useState<SessionDurationMinutes>(
    policy.defaultDuration,
  );
  const [mode, setMode] = useState<SessionMode>("sound-only");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [historyState, setHistoryState] = useState<{
    outcome: ConsumerOutcomeId;
    recentWorkIds: string[];
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!qaAvailable) return;
    let mounted = true;
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
    historyState?.outcome === outcome ? historyState : null;
  const recentWorkIds = useMemo(
    () =>
      qaAvailable ? (currentHistory?.recentWorkIds ?? null) : ([] as string[]),
    [currentHistory, qaAvailable],
  );
  const historyError = qaAvailable ? (currentHistory?.error ?? null) : null;
  const planningError = useMemo(() => {
    if (!qaAvailable || recentWorkIds === null) return null;
    if (historyError) return historyError;
    try {
      createAdaptiveSessionProgram({
        outcome,
        durationMinutes: duration,
        mode: "sound-only",
        seed: `setup-${outcome}-${duration}`,
        recentWorkIds,
        allowProvisionalMetadata: true,
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Session unavailable.";
    }
  }, [duration, historyError, outcome, qaAvailable, recentWorkIds]);
  const guidedUnavailable = mode === "guided";
  const canStart =
    qaAvailable &&
    recentWorkIds !== null &&
    !guidedUnavailable &&
    !planningError;

  function start(): void {
    if (!canStart) return;
    router.push(
      `/adaptive-session/${outcome}?duration=${duration}&start=1` as Href,
    );
  }

  return (
    <View style={styles.root} testID="adaptive-session-setup">
      <Text style={styles.step}>01 / CHOOSE A DURATION</Text>
      <SessionDurationPicker
        onChange={setDuration}
        options={policy.durations}
        selected={duration}
      />
      <Text style={styles.preparation}>{policy.preparationLabel}</Text>

      <Pressable
        accessibilityLabel={customizeOpen ? "Close customize" : "Customize"}
        accessibilityRole="button"
        accessibilityState={{ expanded: customizeOpen }}
        onPress={() => setCustomizeOpen((value) => !value)}
        style={styles.customizeButton}
      >
        <Text style={styles.customizeText}>
          {customizeOpen ? "CLOSE CUSTOMIZE" : "CUSTOMIZE"}
        </Text>
        <Text style={styles.customizeMark}>{customizeOpen ? "−" : "+"}</Text>
      </Pressable>

      {customizeOpen ? (
        <View style={styles.customizePanel} testID="session-customize-panel">
          <Text style={styles.step}>MODE</Text>
          <View
            accessibilityLabel="Session mode"
            accessibilityRole="radiogroup"
            style={styles.modeRow}
          >
            <ModeButton
              label="Sound only"
              onPress={() => setMode("sound-only")}
              selected={mode === "sound-only"}
            />
            <ModeButton
              label="Guided"
              onPress={() => setMode("guided")}
              selected={mode === "guided"}
            />
          </View>
          {guidedUnavailable ? (
            <View accessibilityRole="alert" style={styles.guidedPanel}>
              <Text style={styles.voiceLabel}>VOICE</Text>
              <Text style={styles.guidedTitle}>
                RECORDED VOICES · IN PRODUCTION
              </Text>
              <Text style={styles.guidedBody}>
                Voice choice will appear here when real recordings are ready. No
                synthetic or placeholder voice is offered.
              </Text>
            </View>
          ) : null}
          <OfflinePackageStatus />
        </View>
      ) : null}

      {planningError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {planningError}
        </Text>
      ) : null}
      {!qaAvailable ? (
        <Text style={styles.notice}>
          PHONE SESSION PLAYBACK · IN PRODUCTION
        </Text>
      ) : (
        <Text style={styles.notice}>
          PREVIEW MODE · LISTENING REVIEW PENDING
        </Text>
      )}
      <Pressable
        accessibilityHint={
          guidedUnavailable
            ? "Recorded voices are in production"
            : !qaAvailable
              ? "Phone session playback is in production"
              : (planningError ?? "Starts the prepared sound-only session")
        }
        accessibilityLabel={policy.startLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canStart }}
        disabled={!canStart}
        onPress={start}
        style={[styles.startButton, !canStart && styles.disabled]}
        testID="start-adaptive-session"
      >
        <Text style={styles.startText}>{policy.startLabel}</Text>
        <Text style={styles.startArrow}>→</Text>
      </Pressable>
    </View>
  );
}

function ModeButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.modeButton, selected && styles.modeButtonSelected]}
    >
      <Text style={styles.modeText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "rgba(248, 242, 232, 0.88)",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  step: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  preparation: {
    color: editorial.inkMuted,
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  customizeButton: {
    alignItems: "center",
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    minHeight: 48,
  },
  customizeText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  customizeMark: { color: editorial.gold, fontSize: 22 },
  customizePanel: { paddingBottom: spacing.md, paddingTop: spacing.md },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modeButton: {
    alignItems: "center",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  modeButtonSelected: {
    backgroundColor: "#E2E6DF",
    borderColor: editorial.jade,
  },
  modeText: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  guidedPanel: {
    borderLeftColor: editorial.gold,
    borderLeftWidth: 2,
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  guidedTitle: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
  },
  voiceLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.9,
    marginBottom: spacing.xs,
  },
  guidedBody: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  notice: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.55,
    marginTop: spacing.lg,
  },
  startButton: {
    alignItems: "center",
    backgroundColor: editorial.ink,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
  },
  startText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  startArrow: { color: editorial.paperLight, fontSize: 22 },
  disabled: { opacity: 0.42 },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});

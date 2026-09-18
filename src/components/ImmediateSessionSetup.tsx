import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { PlaybackCancelledError } from "@/audio/AudioSessionController";
import { consumerPlaybackError } from "@/audio/consumerPlaybackError";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import {
  chooseAutomaticWork,
  previousListeningWorkId,
} from "@/content/automaticListening";
import { loadLastListening } from "@/state/lastListeningPersistence";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";
import {
  createSingleTrackProgram,
  type ConsumerAudioWork,
} from "@/domain/audio/consumerTypes";
import { soundFamilyFor } from "@/content/soundFamilies";
import type {
  AdaptiveSessionProgram,
  NatureAmbienceFamily,
  SessionDurationMinutes,
} from "@/domain/sessions/types";
import {
  consumerSelectionUrl,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import { SessionDurationPicker } from "./SessionDurationPicker";
import { NatureAmbienceChoice } from "./NatureAmbienceChoice";
import { TransportSymbol } from "./PlaybackTransport";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import {
  CurrentActivityChoice,
  useCurrentActivity,
} from "./CurrentActivityChoice";

export type ListeningNatureFactory = (
  work: ConsumerAudioWork,
  outcome: ConsumerOutcomeId,
  duration: SessionDurationMinutes,
  family: NatureAmbienceFamily | null,
) => AdaptiveSessionProgram;

export function ImmediateSessionSetup({
  outcome,
  createNatureProgram,
}: {
  outcome: ConsumerOutcomeId;
  createNatureProgram?: ListeningNatureFactory;
}) {
  const router = useRouter();
  const { controller } = useAudioSession();
  const policy = getSessionPolicy(outcome);
  const [duration, setDuration] = useState(policy.defaultDuration);
  const [timerOpen, setTimerOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [newSession, setNewSession] = useState(false);
  const currentActivity = useCurrentActivity(outcome);
  const [error, setError] = useState<string | null>(null);
  const [nature, setNature] = useState<NatureAmbienceFamily | null>(null);
  const [selectionAttempt, setSelectionAttempt] = useState(0);
  const [work, setWork] = useState<ConsumerAudioWork | null>(null);
  useEffect(() => {
    let cancelled = false;
    const sample = Math.random();
    void loadLastListening()
      .catch(() => null)
      .then((saved) => {
        if (!cancelled)
          setWork(
            chooseAutomaticWork(
              outcome,
              sample,
              previousListeningWorkId(controller.getConsumerSelection(), saved),
            ),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [controller, outcome]);
  const natureAvailable = Boolean(
    createNatureProgram && work && soundFamilyFor(work) === "music",
  );
  const candidate = useMemo<{
    selection: ConsumerSelection | null;
    error: string | null;
  }>(() => {
    // Retry a failed factory without choosing another recording.
    void selectionAttempt;
    if (!work) return { selection: null, error: null };
    try {
      const selection: ConsumerSelection =
        createNatureProgram && natureAvailable
          ? {
              kind: "adaptive",
              program: createNatureProgram(work, outcome, duration, nature),
              request: {
                listeningWorkId: work.id,
                includeNatureBed: nature !== null,
                outcome,
                durationMinutes: duration,
                mode: "sound-only",
                soundKind: "music",
                natureFamily: nature ?? "rain",
              },
            }
          : {
              kind: "single",
              program: createSingleTrackProgram(work, outcome),
              outcome,
              durationMinutes: duration,
            };
      return { selection, error: null };
    } catch (reason) {
      return {
        selection: null,
        error:
          reason instanceof Error
            ? reason.message
            : "Could not prepare the selected ambience. Please retry.",
      };
    }
  }, [
    work,
    outcome,
    duration,
    nature,
    natureAvailable,
    createNatureProgram,
    selectionAttempt,
  ]);
  const selection = candidate.selection;
  const prepared = usePreparedSelection(
    selection,
    !currentActivity || newSession,
  );
  const failure = error ?? candidate.error ?? prepared.error;
  function start() {
    if (!selection || !prepared.ready || starting) return;
    setStarting(true);
    setError(null);
    void controller
      .startSelectionFromUserGesture(selection)
      .then(() => {
        setNewSession(false);
        router.push(consumerSelectionUrl(selection) as Href);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof PlaybackCancelledError))
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not start. Please retry.",
          );
      })
      .finally(() => setStarting(false));
  }
  if (currentActivity && !newSession)
    return (
      <CurrentActivityChoice
        selection={currentActivity}
        onNew={() => setNewSession(true)}
      />
    );
  return (
    <View testID="immediate-session-setup">
      <Text style={styles.note}>Press Play. Leave the phone behind.</Text>
      {controller.getConsumerSelection() &&
      ["playing", "paused", "preparing", "fadingOut"].includes(
        controller.getSnapshot().status,
      ) ? (
        <Text style={styles.note}>
          Starting here replaces your current session.
        </Text>
      ) : null}
      {natureAvailable ? (
        <NatureAmbienceChoice
          value={nature}
          disabled={starting}
          disabledMessage="Starting your session…"
          onChange={(family) => {
            if (starting) return;
            setError(null);
            setNature(family);
          }}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={policy.startLabel}
        accessibilityState={{
          disabled: !prepared.ready || starting,
          busy: starting,
        }}
        disabled={!prepared.ready || starting}
        onPress={start}
        style={({ pressed }) => [
          styles.primary,
          (!prepared.ready || starting) && styles.disabled,
          pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
        ]}
        testID="start-immediate-session"
      >
        {starting ? (
          <ActivityIndicator color={editorial.paperLight} />
        ) : (
          <TransportSymbol kind="play" light />
        )}
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {failure
          ? "Could not load. Please retry."
          : !work
            ? "No sound available for this activity."
            : starting
              ? "Starting…"
              : prepared.ready
                ? `${duration} min · Ready`
                : "Preparing your sound…"}
      </Text>
      {failure ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>
            {consumerPlaybackError(failure)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              if (candidate.error)
                setSelectionAttempt((attempt) => attempt + 1);
              prepared.retry();
            }}
            style={styles.disclosure}
          >
            <Text style={styles.note}>Retry loading</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: timerOpen, disabled: starting }}
        disabled={starting}
        onPress={() => setTimerOpen(!timerOpen)}
        style={styles.disclosure}
      >
        <Text style={styles.note}>
          {timerOpen ? "Close timer −" : `Timer · ${duration} min +`}
        </Text>
      </Pressable>
      {timerOpen ? (
        <SessionDurationPicker
          options={policy.durations}
          selected={duration}
          disabled={starting}
          onChange={(value) => {
            if (starting) return;
            setError(null);
            setDuration(value);
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  note: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
  },
  primary: {
    backgroundColor: editorial.ink,
    height: 68,
    width: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 19,
  },
  status: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 12,
  },
  disclosure: {
    minHeight: 48,
    justifyContent: "center",
    marginTop: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.line,
  },
  disabled: { opacity: 0.5 },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 8,
  },
});

import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SessionDurationPicker } from "./SessionDurationPicker";
import { DownloadControl } from "./DownloadControl";
import { useAudioSession } from "@/audio/AudioProvider";
import { PlaybackCancelledError } from "@/audio/AudioSessionController";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import { getSessionPolicy } from "@/content/sessionPolicies";
import { getPlayableWorksForOutcome } from "@/content/consumerCatalog";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { getNatureSessionFeasibility } from "@/domain/sessions/natureSessionFeasibility";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  consumerSelectionUrl,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import type {
  NatureAmbienceFamily,
  SessionDurationMinutes,
} from "@/domain/sessions/types";
import {
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  recentWorkIdsForSession,
} from "@/state/adaptiveSessionPersistence";
import {
  isAdaptivePlaybackAvailable,
  isPwaWebSurface,
} from "@/domain/sessions/playbackAvailability";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

const historyStore = createAdaptiveSessionHistoryStore();
export function AdaptiveSessionSetup({
  outcome,
  qaAvailable = isAdaptivePlaybackAvailable(),
  duration: suppliedDuration,
  onDurationChange,
}: {
  outcome: ConsumerOutcomeId;
  qaAvailable?: boolean;
  duration?: SessionDurationMinutes;
  onDurationChange?: (value: SessionDurationMinutes) => void;
}) {
  const router = useRouter();
  const { controller, snapshot } = useAudioSession();
  const policy = getSessionPolicy(outcome);
  const [localDuration, setLocalDuration] = useState(policy.defaultDuration);
  const duration = suppliedDuration ?? localDuration;
  const [family, setFamily] = useState<NatureAmbienceFamily>(
    outcome === "sleep" || outcome === "focus" ? "rain" : "sea",
  );
  const [customize, setCustomize] = useState(false);
  const [recent, setRecent] = useState<string[] | null>(null);
  const [nonce] = useState(() => Date.now());
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void historyStore
      .load()
      .then((history) => {
        if (live)
          setRecent(recentWorkIdsForSession(history, outcome, "nature"));
      })
      .catch(() => {
        if (live) setRecent([]);
      });
    return () => {
      live = false;
    };
  }, [outcome]);
  const feasibility = useMemo(
    () =>
      qaAvailable
        ? getNatureSessionFeasibility({
            outcome,
            durationMinutes: duration,
            allowProvisionalMetadata: true,
          })
        : [],
    [outcome, duration, qaAvailable],
  );
  const availableFamily =
    feasibility.find(
      (entry) => entry.natureFamily === family && entry.available,
    )?.natureFamily ??
    feasibility.find((entry) => entry.available)?.natureFamily;
  const selection = useMemo<ConsumerSelection | null>(() => {
    if (recent === null) return null;
    if (availableFamily) {
      const request = {
        outcome,
        durationMinutes: duration,
        mode: "sound-only" as const,
        soundKind: "nature" as const,
        natureFamily: availableFamily,
      };
      try {
        return {
          kind: "adaptive",
          request,
          program: createAdaptiveSessionProgram({
            ...request,
            seed: createConsumerSessionSeed(request, nonce),
            recentWorkIds: recent,
            allowProvisionalMetadata: true,
          }),
        };
      } catch {
        /* Offer a real autonomous work; never invent a transition. */
      }
    }
    const work = getPlayableWorksForOutcome(outcome)[0];
    return work
      ? {
          kind: "single",
          program: createSingleTrackProgram(work, outcome),
          outcome,
          durationMinutes: duration,
        }
      : null;
  }, [outcome, duration, availableFamily, recent, nonce]);
  const prepared = usePreparedSelection(selection);
  const title =
    selection?.kind === "adaptive"
      ? selection.request.natureFamily === "sea"
        ? "Ocean waves"
        : "Rain"
      : selection?.program.work.title;
  function changeDuration(value: SessionDurationMinutes) {
    setError(null);
    setLocalDuration(value);
    onDurationChange?.(value);
  }
  function start() {
    if (!selection || !prepared.ready || starting) return;
    setStarting(true);
    setError(null);
    const operation = controller.startSelectionFromUserGesture(selection);
    void operation
      .then(() => router.push(consumerSelectionUrl(selection) as Href))
      .catch((reason: unknown) => {
        if (!(reason instanceof PlaybackCancelledError))
          setError(
            reason instanceof Error
              ? reason.message
              : "The sound did not start. Please retry.",
          );
        prepared.retry();
      })
      .finally(() => setStarting(false));
  }
  const busy = starting || snapshot.status === "preparing";
  return (
    <View testID="adaptive-session-setup">
      <Text style={styles.label}>HOW LONG DO YOU HAVE?</Text>
      <SessionDurationPicker
        options={policy.durations}
        selected={duration}
        onChange={changeDuration}
      />
      <Text style={styles.proposal}>{title ?? "Sound unavailable"}</Text>
      <Text style={styles.body}>
        {selection?.kind === "single"
          ? "One complete sound, for your chosen time."
          : "An evolving nature session. Sounds change gently as you listen."}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: customize }}
        onPress={() => setCustomize(!customize)}
        style={styles.disclosure}
      >
        <Text style={styles.disclosureTitle}>
          {customize ? "Close session options −" : "Personalize your session +"}
        </Text>
        <Text style={styles.body}>
          Choose your sounds and see your session.
        </Text>
      </Pressable>
      {customize ? (
        <View style={styles.customize}>
          <Text style={styles.label}>YOUR SOUNDS</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Natural sound"
            style={styles.row}
          >
            {feasibility.map((entry) => (
              <Pressable
                key={entry.natureFamily}
                accessibilityRole="radio"
                aria-checked={availableFamily === entry.natureFamily}
                accessibilityLabel={
                  entry.natureFamily === "sea" ? "Ocean waves" : "Rain"
                }
                accessibilityState={{
                  checked: availableFamily === entry.natureFamily,
                  disabled: !entry.available,
                }}
                disabled={!entry.available}
                onPress={() => {
                  setError(null);
                  setFamily(entry.natureFamily);
                }}
                style={[
                  styles.option,
                  availableFamily === entry.natureFamily && styles.selected,
                  !entry.available && styles.disabled,
                ]}
              >
                <Text style={styles.body}>
                  {entry.natureFamily === "sea" ? "Ocean waves" : "Rain"}
                  {!entry.available ? " · Unavailable at this duration" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
          {selection?.kind === "adaptive" ? (
            <View testID="session-journey-preview" style={styles.journey}>
              <Text style={styles.label}>YOUR SESSION · {duration} MIN</Text>
              {selection.program.plan.segments
                .filter((segment) => (segment.lane ?? "primary") === "primary")
                .map((segment, index) => (
                  <Text key={`${segment.workId}:${index}`} style={styles.body}>
                    {index + 1}.{" "}
                    {
                      selection.program.works.find(
                        ({ id }) => id === segment.workId,
                      )?.title
                    }
                  </Text>
                ))}
              <Text style={styles.body}>
                One sound flows gently into the next.
              </Text>
            </View>
          ) : null}
          <Text style={styles.body}>Guided · IN PRODUCTION</Text>
          <Text style={styles.body}>
            Voice choices will appear when real guided recordings are available.
          </Text>
          <Text style={styles.body}>
            Musical sessions · IN PRODUCTION. Complete musical works are
            available below.
          </Text>
          {isPwaWebSurface() ? (
            <DownloadControl />
          ) : (
            <Text style={styles.body}>
              Offline downloads · IN PRODUCTION on this device.
            </Text>
          )}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={policy.startLabel}
        accessibilityState={{ disabled: !prepared.ready || busy, busy }}
        disabled={!prepared.ready || busy}
        onPress={start}
        style={[styles.primary, (!prepared.ready || busy) && styles.disabled]}
        testID="start-adaptive-session"
      >
        <Text style={styles.primaryText}>
          {starting ? "Starting…" : policy.startLabel}
        </Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {error || prepared.error
          ? "Could not load this sound."
          : starting
            ? "Preparing sound…"
            : prepared.ready
              ? `${duration} min · Ready`
              : "Loading sound…"}
      </Text>
      {error || prepared.error ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>
            {error ?? prepared.error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              prepared.retry();
            }}
            style={styles.option}
          >
            <Text style={styles.body}>Retry loading</Text>
          </Pressable>
          <Text style={styles.body}>
            You can also choose another sound below.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  label: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    marginTop: 16,
  },
  proposal: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 27,
    marginTop: 18,
  },
  body: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  primary: {
    backgroundColor: editorial.ink,
    minHeight: 56,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  primaryText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    textAlign: "center",
  },
  status: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 8,
  },
  disclosure: {
    minHeight: 64,
    justifyContent: "center",
    marginTop: 18,
    borderWidth: 1,
    borderColor: editorial.lineStrong,
    backgroundColor: "#E3EAE2",
    padding: 12,
    gap: 4,
  },
  disclosureTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: editorial.ink,
  },
  journey: {
    gap: 8,
    borderLeftWidth: 2,
    borderColor: editorial.jade,
    paddingLeft: 12,
  },
  customize: { gap: 12, borderTopWidth: 1, borderColor: editorial.line },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: editorial.lineStrong,
    padding: 12,
    minHeight: 48,
    justifyContent: "center",
    flexShrink: 1,
  },
  selected: { backgroundColor: "#DCE5DD", borderColor: editorial.jade },
  disabled: { opacity: 0.55 },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
});

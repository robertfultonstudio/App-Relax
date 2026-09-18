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
import { soundFamilyFor } from "@/content/soundFamilies";
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
  CreateAdaptiveSessionInput,
  AdaptiveSessionProgram,
} from "@/domain/sessions/types";
import {
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  recentWorkIdsForSession,
} from "@/state/adaptiveSessionPersistence";
import {
  isAdaptivePlaybackAvailable,
  isPwaWebSurface,
  isNativeCatalogPreview,
} from "@/domain/sessions/playbackAvailability";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { NatureAmbienceChoice } from "./NatureAmbienceChoice";
import {
  CurrentActivityChoice,
  useCurrentActivity,
} from "./CurrentActivityChoice";

const historyStore = createAdaptiveSessionHistoryStore();
export function AdaptiveSessionSetup({
  outcome,
  qaAvailable = isAdaptivePlaybackAvailable(),
  duration: suppliedDuration,
  onDurationChange,
  reviewProgramFactory,
  completePractice = false,
}: {
  outcome: ConsumerOutcomeId;
  qaAvailable?: boolean;
  duration?: SessionDurationMinutes;
  onDurationChange?: (value: SessionDurationMinutes) => void;
  completePractice?: boolean;
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
}) {
  const router = useRouter();
  const { controller, snapshot } = useAudioSession();
  const policy = getSessionPolicy(outcome);
  const [localDuration, setLocalDuration] = useState(policy.defaultDuration);
  const duration = suppliedDuration ?? localDuration;
  const music = getPlayableWorksForOutcome(outcome).filter(
    (work) => soundFamilyFor(work) === "music",
  );
  const featuredMusic = music[0];
  const [soundChoice, setSoundChoice] = useState<
    "music" | NatureAmbienceFamily
  >(
    featuredMusic
      ? "music"
      : outcome === "sleep" || outcome === "focus"
        ? "rain"
        : "sea",
  );
  const [customize, setCustomize] = useState(false);
  const [ambience, setAmbience] = useState<NatureAmbienceFamily | null>(null);
  const [recent, setRecent] = useState<string[] | null>(null);
  const [nonce] = useState(() => Date.now());
  const [starting, setStarting] = useState(false);
  const [newSession, setNewSession] = useState(false);
  const currentActivity = useCurrentActivity(outcome);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void historyStore
      .load()
      .then((history) => {
        if (live)
          setRecent(
            recentWorkIdsForSession(
              history,
              outcome,
              soundChoice === "music" ? "music" : "nature",
            ),
          );
      })
      .catch(() => {
        if (live) setRecent([]);
      });
    return () => {
      live = false;
    };
  }, [outcome, soundChoice]);
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
  const availableFamily = feasibility.find(
    (entry) => entry.natureFamily === soundChoice && entry.available,
  )?.natureFamily;
  const musicSelection = useMemo<ConsumerSelection | null>(
    () =>
      featuredMusic
        ? {
            kind: "single",
            program: createSingleTrackProgram(featuredMusic, outcome),
            outcome,
            durationMinutes: duration,
          }
        : null,
    [featuredMusic, outcome, duration],
  );
  const selection = useMemo<ConsumerSelection | null>(() => {
    if (soundChoice === "music") {
      if (completePractice && (!reviewProgramFactory || !qaAvailable))
        return null;
      if (!reviewProgramFactory) return musicSelection;
      if (recent === null) return null;
      const request = {
        outcome,
        durationMinutes: duration,
        mode: "sound-only" as const,
        soundKind: "music" as const,
        natureFamily: ambience ?? "sea",
        includeNatureBed: ambience !== null,
      };
      try {
        return {
          kind: "adaptive",
          request,
          program: reviewProgramFactory({
            ...request,
            seed: createConsumerSessionSeed(request, nonce),
            recentWorkIds: recent,
            allowProvisionalMetadata: true,
            includeNatureBed: ambience !== null,
          }),
        };
      } catch {
        return null;
      }
    }
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
        /* Fail closed: never substitute another sound or invent a transition. */
      }
    }
    // A selected wave/rain session must never silently turn into music.
    if (qaAvailable) return null;
    const work = getPlayableWorksForOutcome(outcome)[0];
    return work
      ? {
          kind: "single",
          program: createSingleTrackProgram(work, outcome),
          outcome,
          durationMinutes: duration,
        }
      : null;
  }, [
    outcome,
    duration,
    availableFamily,
    recent,
    nonce,
    soundChoice,
    musicSelection,
    qaAvailable,
    reviewProgramFactory,
    completePractice,
    ambience,
  ]);
  const prepared = usePreparedSelection(
    selection,
    !currentActivity || newSession,
  );
  const title =
    selection?.kind === "adaptive"
      ? selection.request.soundKind === "music"
        ? "Music · evolving session"
        : selection.request.natureFamily === "sea"
          ? "Ocean waves"
          : "Rain"
      : selection
        ? "Music"
        : null;
  function changeDuration(value: SessionDurationMinutes) {
    if (starting) return;
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
      .then(() => {
        setNewSession(false);
        router.push(consumerSelectionUrl(selection) as Href);
      })
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
  if (currentActivity && !newSession)
    return (
      <CurrentActivityChoice
        selection={currentActivity}
        onNew={() => setNewSession(true)}
      />
    );
  return (
    <View testID="adaptive-session-setup">
      <Text style={styles.label}>HOW LONG DO YOU HAVE?</Text>
      <SessionDurationPicker
        options={
          completePractice
            ? reviewProgramFactory
              ? [30, 45, 60, 90]
              : [30, 45, 60]
            : policy.durations
        }
        selected={duration}
        disabled={busy}
        onChange={changeDuration}
      />
      {completePractice && reviewProgramFactory && (
        <NatureAmbienceChoice
          value={ambience}
          onChange={setAmbience}
          disabled={starting}
        />
      )}
      {!completePractice && (
        <>
          <Text style={styles.label}>CHOOSE YOUR SOUND</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Choose your sound"
            style={styles.row}
          >
            {[
              ...(featuredMusic
                ? [{ id: "music" as const, label: "Music", available: true }]
                : []),
              ...feasibility.map((entry) => ({
                id: entry.natureFamily,
                label: entry.natureFamily === "sea" ? "Ocean waves" : "Rain",
                available: entry.available,
              })),
            ].map((choice) => (
              <Pressable
                key={choice.id}
                accessibilityRole="radio"
                accessibilityLabel={choice.label}
                aria-checked={soundChoice === choice.id}
                accessibilityState={{
                  checked: soundChoice === choice.id,
                  disabled: !choice.available || busy,
                }}
                disabled={!choice.available || busy}
                onPress={() => {
                  if (busy) return;
                  setError(null);
                  setSoundChoice(choice.id);
                }}
                style={[
                  styles.option,
                  soundChoice === choice.id && styles.selected,
                  !choice.available && styles.disabled,
                ]}
              >
                <Text style={styles.body}>
                  {choice.label}
                  {!choice.available ? " · Unavailable" : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {!completePractice && (
        <>
          <Text style={styles.proposal}>{title ?? "Sound unavailable"}</Text>
          <Text style={styles.body}>
            {selection?.kind === "single"
              ? "One complete sound repeats for your chosen time."
              : selection?.kind === "adaptive" &&
                  selection.request.soundKind === "music"
                ? "A sequence of complete musical pieces, with slow changes. Transition listening review required."
                : soundChoice === "music" && reviewProgramFactory
                  ? outcome === "yoga"
                    ? "Whole-track music review: choose 30, 45 or 60 minutes. Other lengths need an editorial arrangement."
                    : "Musical transitions for this activity still need review. No repeated single track is presented as an evolving session."
                  : availableFamily === "sea"
                    ? "Ocean recordings change gently as you listen."
                    : availableFamily === "rain"
                      ? "Rain recordings change gently as you listen."
                      : "This sound is unavailable at this duration. Choose Music or another sound."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: customize }}
            onPress={() => setCustomize(!customize)}
            style={styles.disclosure}
          >
            <Text style={styles.disclosureTitle}>
              {customize
                ? "Close session options −"
                : "Personalize your session +"}
            </Text>
            <Text style={styles.body}>
              Choose your sounds and see your session.
            </Text>
          </Pressable>
          {customize ? (
            <View style={styles.customize}>
              {selection?.kind === "adaptive" ? (
                <View testID="session-journey-preview" style={styles.journey}>
                  <Text style={styles.label}>
                    YOUR SESSION · {duration} MIN
                  </Text>
                  {selection.program.plan.segments
                    .filter(
                      (segment) => (segment.lane ?? "primary") === "primary",
                    )
                    .map((segment, index) => (
                      <Text
                        key={`${segment.workId}:${index}`}
                        style={styles.body}
                      >
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
                Voice choices will appear when real guided recordings are
                available.
              </Text>
              <Text style={styles.body}>
                Musical transitions remain subject to listening review.
              </Text>
              {isPwaWebSurface() && soundChoice === "rain" ? (
                <DownloadControl />
              ) : (
                <Text style={styles.body}>
                  {isNativeCatalogPreview()
                    ? "These recordings are imported on this phone for offline listening."
                    : "Offline downloads for this selection are not available in this review."}
                </Text>
              )}
            </View>
          ) : null}
        </>
      )}
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
              : !selection && recent !== null
                ? "No session is available for this selection."
                : "Loading sound…"}
      </Text>
      {completePractice &&
        !isNativeCatalogPreview() &&
        reviewProgramFactory &&
        selection?.kind === "adaptive" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${duration}-minute session and development player`}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={() =>
              router.push(`${consumerSelectionUrl(selection)}&review=1` as Href)
            }
            style={styles.disclosure}
            testID="open-complete-practice-review"
          >
            <Text style={styles.disclosureTitle}>
              Session & development player →
            </Text>
            <Text style={styles.body}>
              {duration} min ·{" "}
              {
                selection.program.plan.segments.filter(
                  (s) => (s.lane ?? "primary") === "primary",
                ).length
              }{" "}
              music works · loop points & joins
            </Text>
            {duration === 90 && (
              <Text style={styles.body}>
                Two middle passages repeat in full to extend the practice.
                Review their loop points before approval.
              </Text>
            )}
          </Pressable>
        )}
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
            Return Home to choose another activity.
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

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { PlaybackCancelledError } from "@/audio/AudioSessionController";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import { ConsumerPlaybackSurface } from "@/components/ConsumerPlaybackSurface";
import { PlaybackTransport } from "@/components/PlaybackTransport";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { SessionNatureControl } from "@/components/SessionNatureControl";
import { NatureAmbienceChoice } from "@/components/NatureAmbienceChoice";
import {
  getSessionPolicy,
  sessionContextTitle,
} from "@/content/sessionPolicies";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";
import type {
  AdaptiveSessionProgram,
  NatureAmbienceFamily,
  SessionDurationMinutes,
  SessionSoundKind,
  CreateAdaptiveSessionInput,
} from "@/domain/sessions/types";
import type { ConsumerSelection } from "@/domain/audio/consumerSelection";
import type { ReviewTransport } from "@/domain/audio/reviewTransport";
import {
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  recentWorkIdsForSession,
} from "@/state/adaptiveSessionPersistence";

import { platformReviewProgramFactory } from "@/domain/sessions/platformSessionFactories";
const historyStore = createAdaptiveSessionHistoryStore();
export default function AdaptiveSessionPlayerScreen({
  renderReviewControls,
  reviewProgramFactory = platformReviewProgramFactory,
  hidePersistentTransport = false,
}: {
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
  renderReviewControls?: (
    program: AdaptiveSessionProgram,
    matching: boolean,
    onVariant: (program: AdaptiveSessionProgram) => void,
    transport: ReviewTransport,
  ) => ReactNode;
  hidePersistentTransport?: boolean;
} = {}) {
  const params = useLocalSearchParams<{
    outcomeId?: string;
    duration?: string;
    sound?: string;
    nature?: string;
  }>();
  const router = useRouter();
  const { controller, snapshot } = useAudioSession();
  const active = controller.getConsumerSelection();
  const outcome = CONSUMER_OUTCOMES.some(({ id }) => id === params.outcomeId)
    ? (params.outcomeId as ConsumerOutcomeId)
    : null;
  const duration = Number(params.duration) as SessionDurationMinutes;
  const sound =
    params.sound === "music" || params.sound === "nature"
      ? (params.sound as SessionSoundKind)
      : null;
  const family =
    params.nature === undefined ||
    params.nature === "sea" ||
    params.nature === "off"
      ? "sea"
      : params.nature === "rain"
        ? "rain"
        : null;
  const valid =
    outcome &&
    sound &&
    family &&
    getSessionPolicy(outcome).durations.includes(duration);
  const current =
    active?.kind === "adaptive" &&
    active.request.outcome === outcome &&
    active.request.durationMinutes === duration &&
    active.request.soundKind === sound &&
    (active.request.natureFamily === family ||
      (snapshot.status === "playing" &&
        snapshot.sessionPlanId === active.program.plan.id)) &&
    (sound !== "music" ||
      Boolean(
        active.program.plan.natureMix &&
        active.program.plan.natureMix.enabled !== false,
      ) === (params.nature !== "off" && params.nature !== undefined))
      ? active
      : null;
  const [recent, setRecent] = useState<string[] | null>(null);
  const [nonce] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [changingNature, setChangingNature] = useState(false);
  const [natureChangeError, setNatureChangeError] = useState<string | null>(
    null,
  );
  const [reviewSelection, setReviewSelection] =
    useState<ConsumerSelection | null>(null);
  useEffect(() => {
    let live = true;
    void historyStore
      .load()
      .then((history) => {
        if (live)
          setRecent(
            outcome && sound
              ? recentWorkIdsForSession(history, outcome, sound)
              : [],
          );
      })
      .catch(() => {
        if (live) setRecent([]);
      });
    return () => {
      live = false;
    };
  }, [outcome, sound]);
  const result = useMemo<{
    selection: ConsumerSelection | null;
    error: string | null;
  }>(() => {
    if (
      reviewSelection?.kind === "adaptive" &&
      reviewSelection.request.outcome === outcome &&
      reviewSelection.request.durationMinutes === duration &&
      reviewSelection.request.soundKind === sound &&
      reviewSelection.request.natureFamily === family
    )
      return { selection: reviewSelection, error: null };
    if (current) return { selection: current, error: null };
    if (!valid || !outcome || !sound || !family)
      return {
        selection: null,
        error: "This session is unavailable. Choose another duration or sound.",
      };
    if (!isAdaptivePlaybackAvailable())
      return {
        selection: null,
        error:
          "Sessions are in production on this device. Choose one available sound.",
      };
    if (recent === null) return { selection: null, error: null };
    const request = {
      outcome,
      durationMinutes: duration,
      mode: "sound-only" as const,
      soundKind: sound,
      natureFamily: family as NatureAmbienceFamily,
      includeNatureBed:
        sound === "music" &&
        params.nature !== "off" &&
        params.nature !== undefined,
    };
    try {
      return {
        selection: {
          kind: "adaptive",
          request,
          program: (reviewProgramFactory ?? createAdaptiveSessionProgram)({
            ...request,
            seed: createConsumerSessionSeed(request, nonce),
            recentWorkIds: recent,
            allowProvisionalMetadata: true,
            includeNatureBed:
              sound === "music" &&
              params.nature !== "off" &&
              params.nature !== undefined,
          }),
        },
        error: null,
      };
    } catch {
      return {
        selection: null,
        error:
          "No compatible session is available at this duration. Choose one complete sound or another duration.",
      };
    }
  }, [
    current,
    valid,
    outcome,
    sound,
    family,
    duration,
    recent,
    nonce,
    reviewSelection,
    reviewProgramFactory,
    params.nature,
  ]);
  const selection = result.selection;
  const matching =
    selection?.kind === "adaptive" &&
    selection.program.plan.id === snapshot.sessionPlanId;
  const needsPreparation = !matching || snapshot.status === "error";
  const otherSessionActive = Boolean(
    !matching &&
    active &&
    ["playing", "paused", "fadingOut", "preparing", "error"].includes(
      snapshot.status,
    ),
  );
  const prepared = usePreparedSelection(selection, needsPreparation);
  const program = selection?.kind === "adaptive" ? selection.program : null;
  const playing =
    matching &&
    (snapshot.status === "playing" || snapshot.status === "fadingOut");
  const busy = matching && snapshot.status === "preparing";
  const ready = needsPreparation
    ? prepared.ready
    : ["ready", "paused", "completed"].includes(snapshot.status);
  const visibleError =
    error ??
    result.error ??
    prepared.error ??
    (matching ? snapshot.error : null);
  const status = visibleError
    ? "Could not play"
    : busy
      ? "Preparing sound…"
      : playing
        ? snapshot.status === "fadingOut"
          ? "Finishing"
          : "Playing"
        : matching && snapshot.status === "completed"
          ? "Completed"
          : matching && snapshot.status === "paused"
            ? "Paused"
            : ready
              ? "Ready"
              : "Loading sound…";
  function playPause() {
    if (!selection) return;
    setError(null);
    const action = playing
      ? controller.pause()
      : needsPreparation
        ? controller.startSelectionFromUserGesture(selection)
        : controller.playFromUserGesture();
    void action.catch((reason: unknown) => {
      if (reason instanceof PlaybackCancelledError) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not start. Retry loading.",
      );
    });
  }
  return (
    <EditorialScreen
      footer={
        !hidePersistentTransport &&
        !otherSessionActive && (
          <PlaybackTransport
            fixedFooter
            canPlay={Boolean(program && ready)}
            canStop={
              matching && (playing || busy || snapshot.status === "paused")
            }
            isPlaying={playing}
            busy={busy}
            onPlayPause={playPause}
            onStop={() => void controller.stop().catch(() => undefined)}
            playPauseTestID="adaptive-play-pause"
          />
        )
      }
    >
      <EditorialHeader label={outcome?.toUpperCase() ?? "SESSION"} showBack />
      <ConsumerPlaybackSurface
        hideTransport={!otherSessionActive}
        previewTransport={otherSessionActive}
        canPlay={Boolean(program && ready)}
        canStop={matching && (playing || busy || snapshot.status === "paused")}
        contextLabel=""
        error={visibleError}
        isPlaying={playing}
        status={status}
        note="Your session keeps playing while you browse. Return using the current-session bar."
        onPlayPause={playPause}
        onStop={() => void controller.stop().catch(() => undefined)}
        onRetry={() => {
          setError(null);
          prepared.retry();
        }}
        onVolumeChange={(value) => void controller.setVolume(value)}
        volumeDisabled={!matching || busy}
        outcome={outcome ?? "relax"}
        remainingMs={
          matching
            ? snapshot.remainingMs
            : Number.isFinite(duration)
              ? duration * 60000
              : 0
        }
        title={
          outcome
            ? sessionContextTitle(
                outcome,
                Boolean(reviewProgramFactory) && sound === "music",
              )
            : "Session unavailable"
        }
        variant="session"
        volume={snapshot.volume}
        playPauseTestID="adaptive-play-pause"
        options={
          <>
            {reviewProgramFactory && sound === "music" && (
              <NatureAmbienceChoice
                value={
                  program?.plan.natureMix?.enabled === false
                    ? null
                    : (program?.plan.natureMix?.selectedFamily ?? null)
                }
                changing={changingNature}
                onCancel={() => controller.cancelNatureFamilyChange()}
                disabled={
                  matching &&
                  ["playing", "paused", "fadingOut", "preparing"].includes(
                    snapshot.status,
                  ) &&
                  !(
                    snapshot.status === "playing" &&
                    controller.canChangeNatureFamily?.()
                  )
                }
                onChange={(next) => {
                  if (
                    matching &&
                    snapshot.status === "playing" &&
                    program?.plan.natureMix
                  ) {
                    setChangingNature(true);
                    setNatureChangeError(null);
                    void controller
                      .changeNatureFamily(next)
                      .then((updated) => {
                        if (selection?.kind === "adaptive")
                          setReviewSelection({
                            ...selection,
                            program: updated,
                            request: {
                              ...selection.request,
                              natureFamily:
                                next ?? updated.plan.natureMix!.selectedFamily,
                              includeNatureBed: next !== null,
                            },
                          });
                        router.setParams({ nature: next ?? "off" });
                      })
                      .catch((reason) => {
                        const actual = controller.getConsumerSelection();
                        if (
                          actual?.kind === "adaptive" &&
                          actual.program.plan.id === program.plan.id
                        ) {
                          setReviewSelection(actual);
                          router.setParams({
                            nature:
                              actual.program.plan.natureMix?.enabled === false
                                ? "off"
                                : (actual.program.plan.natureMix
                                    ?.selectedFamily ?? "off"),
                          });
                        }
                        if (!(reason instanceof PlaybackCancelledError))
                          setNatureChangeError(
                            reason instanceof Error
                              ? reason.message
                              : "The ambience could not be changed. Music continues.",
                          );
                      })
                      .finally(() => setChangingNature(false));
                    return;
                  }
                  setReviewSelection(null);
                  router.replace(
                    `/adaptive-session/${outcome}?duration=${duration}&sound=music&nature=${next ?? "off"}` as Href,
                  );
                }}
              />
            )}
            {natureChangeError && (
              <Text accessibilityLiveRegion="polite">{natureChangeError}</Text>
            )}
            {program?.plan.natureMix &&
            program.plan.natureMix.enabled !== false ? (
              <SessionNatureControl
                family={program.plan.natureMix.selectedFamily}
                familyDisabled
                hideFamilyChoice
                level={
                  snapshot.natureMixLevel ?? program.plan.natureMix.initialLevel
                }
                onFamilyChange={() => undefined}
                onLevelChange={(level) =>
                  void controller.setNatureMixLevel(level)
                }
                title={
                  program.plan.natureMix.selectedFamily === "rain"
                    ? "Rain"
                    : "Ocean waves"
                }
                volumeDisabled={!matching || busy}
              />
            ) : null}
          </>
        }
      />
      {program &&
        renderReviewControls?.(
          program,
          matching,
          (next) => {
            if (selection?.kind === "adaptive")
              setReviewSelection({ ...selection, program: next });
          },
          {
            canPlay: Boolean(program && ready),
            canStop:
              matching && (playing || busy || snapshot.status === "paused"),
            playing,
            busy,
            status,
            onPlayPause: playPause,
            onStop: () => controller.stop(),
          },
        )}
      {visibleError ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/outcome/${outcome ?? "relax"}` as Href)}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text>Choose another sound or duration</Text>
        </Pressable>
      ) : null}
    </EditorialScreen>
  );
}

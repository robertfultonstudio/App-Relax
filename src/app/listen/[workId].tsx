import { type ReactNode, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { PlaybackCancelledError } from "@/audio/AudioSessionController";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import { ConsumerDurationOptions } from "@/components/ConsumerDurationOptions";
import { ConsumerPlaybackSurface } from "@/components/ConsumerPlaybackSurface";
import { DownloadControl } from "@/components/DownloadControl";
import { PlaybackTransport } from "@/components/PlaybackTransport";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import {
  getConsumerWork,
  isPlayableWork,
  isVisibleConsumerWork,
} from "@/content/consumerCatalog";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import {
  getSessionPolicy,
  sessionContextTitle,
} from "@/content/sessionPolicies";
import {
  createSingleTrackProgram,
  type ConsumerAudioWork,
} from "@/domain/audio/consumerTypes";
import {
  consumerSelectionKey,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import {
  isPwaWebSurface,
  isNativeCatalogPreview,
} from "@/domain/sessions/playbackAvailability";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { NatureAmbienceChoice } from "@/components/NatureAmbienceChoice";
import { SessionNatureControl } from "@/components/SessionNatureControl";
import { soundFamilyFor } from "@/content/soundFamilies";
import { platformNatureProgramFactory } from "@/domain/sessions/platformSessionFactories";
import type {
  SessionDurationMinutes,
  AdaptiveSessionProgram,
  NatureAmbienceFamily,
} from "@/domain/sessions/types";

type PlayerExtensions = {
  createNatureProgram?: (
    work: ConsumerAudioWork,
    outcome: ConsumerOutcomeId,
    duration: SessionDurationMinutes,
    family: NatureAmbienceFamily,
  ) => AdaptiveSessionProgram;
  renderNatureReview?: (
    program: AdaptiveSessionProgram,
    matching: boolean,
    onVariant: (program: AdaptiveSessionProgram) => void,
  ) => ReactNode;
  renderReviewControls?: (
    work: ConsumerAudioWork,
    matching: boolean,
    elapsedSeconds: number,
    error: string | null,
  ) => ReactNode;
};
export default function ConsumerPlayerScreen({
  renderReviewControls,
  createNatureProgram = platformNatureProgramFactory,
  renderNatureReview,
}: PlayerExtensions = {}) {
  const params = useLocalSearchParams<{
    workId: string;
    outcome?: string;
    duration?: string;
    nature?: string;
  }>();
  return (
    <Player
      key={`${params.workId}:${params.outcome ?? ""}:${params.duration ?? ""}:${params.nature ?? ""}`}
      {...params}
      renderReviewControls={renderReviewControls}
      createNatureProgram={createNatureProgram}
      renderNatureReview={renderNatureReview}
    />
  );
}
function Player({
  workId,
  outcome: outcomeParam,
  duration: durationParam,
  renderReviewControls,
  createNatureProgram,
  renderNatureReview,
  nature: natureParam,
}: {
  workId: string;
  outcome?: string;
  duration?: string;
  nature?: string;
} & PlayerExtensions) {
  const router = useRouter();
  const resolved = getConsumerWork(workId);
  const work =
    resolved &&
    (resolved.primaryOutcome !== null || isNativeCatalogPreview()) &&
    isVisibleConsumerWork(resolved) &&
    isPlayableWork(resolved)
      ? resolved
      : null;
  const { controller, snapshot } = useAudioSession();
  const active = controller.getConsumerSelection();
  const activeSameWork =
    active?.kind === "single"
      ? active.program.work.id === workId
      : active?.program.plan.listeningWorkId === workId;
  const activeOutcome =
    active?.kind === "single" ? active.outcome : active?.request.outcome;
  const outcome = CONSUMER_OUTCOMES.some(({ id }) => id === outcomeParam)
    ? (outcomeParam as ConsumerOutcomeId)
    : ((activeSameWork ? activeOutcome : undefined) ??
      work?.primaryOutcome ??
      "relax");
  const policy = getSessionPolicy(outcome);
  const requested = Number(durationParam) as SessionDurationMinutes;
  const [duration, setDuration] = useState<SessionDurationMinutes>(
    policy.durations.includes(requested)
      ? requested
      : active && activeSameWork
        ? active.kind === "single"
          ? active.durationMinutes
          : active.request.durationMinutes
        : policy.defaultDuration,
  );
  const [error, setError] = useState<string | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [nature, setNature] = useState<NatureAmbienceFamily | null>(() =>
    natureParam === "sea" || natureParam === "rain"
      ? natureParam
      : natureParam === "off"
        ? null
        : active?.kind === "adaptive" &&
            active.program.plan.listeningWorkId === workId
          ? (active.program.plan.natureMix?.selectedFamily ?? null)
          : null,
  );
  const [variant, setVariant] = useState<AdaptiveSessionProgram | null>(null);
  const [selectionAttempt, setSelectionAttempt] = useState(0);
  const natureAvailable = Boolean(
    createNatureProgram && work && soundFamilyFor(work) === "music",
  );
  const candidate = useMemo<{
    selection: ConsumerSelection | null;
    error: string | null;
  }>(() => {
    void selectionAttempt;
    try {
      const selection: ConsumerSelection | null = work
        ? nature && createNatureProgram && natureAvailable
          ? {
              kind: "adaptive",
              program:
                variant ?? createNatureProgram(work, outcome, duration, nature),
              request: {
                listeningWorkId: work.id,
                includeNatureBed: true,
                outcome,
                durationMinutes: duration,
                mode: "sound-only",
                soundKind: "music",
                natureFamily: nature,
              },
            }
          : {
              kind: "single",
              program: createSingleTrackProgram(work, outcome),
              outcome,
              durationMinutes: duration,
            }
        : null;
      return { selection, error: null };
    } catch (reason) {
      return {
        selection: null,
        error:
          reason instanceof Error
            ? reason.message
            : "Could not prepare this session.",
      };
    }
  }, [
    work,
    outcome,
    duration,
    nature,
    natureAvailable,
    createNatureProgram,
    variant,
    selectionAttempt,
  ]);
  const selection = candidate.selection;
  const matching = Boolean(
    selection &&
    active &&
    consumerSelectionKey(selection) === consumerSelectionKey(active),
  );
  const needsPreparation = !matching || snapshot.status === "error";
  const otherSessionActive = Boolean(
    !matching &&
    active &&
    ["playing", "paused", "fadingOut", "preparing", "error"].includes(
      snapshot.status,
    ),
  );
  const prepared = usePreparedSelection(selection, needsPreparation);
  const playing =
    matching &&
    (snapshot.status === "playing" || snapshot.status === "fadingOut");
  const busy = matching && snapshot.status === "preparing";
  const ready = needsPreparation
    ? prepared.ready
    : ["ready", "paused", "completed"].includes(snapshot.status);
  const visibleError =
    error ??
    candidate.error ??
    prepared.error ??
    (matching ? snapshot.error : null);
  const status = visibleError
    ? "Could not play"
    : busy
      ? "Preparing sound…"
      : matching
        ? {
            playing: "Playing",
            fadingOut: "Finishing",
            paused: "Paused",
            completed: "Completed",
            ready: "Ready",
            loading: "Loading sound…",
            idle: "Ready",
            preparing: "Preparing sound…",
            error: "Could not play",
          }[snapshot.status]
        : prepared.ready
          ? "Ready"
          : "Loading sound…";
  function playPause() {
    setError(null);
    if (!selection) return;
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
          : "Could not play. Retry loading.",
      );
    });
  }
  return (
    <EditorialScreen
      footer={
        !otherSessionActive && (
          <PlaybackTransport
            fixedFooter
            canPlay={Boolean(work && ready)}
            canStop={
              matching && (playing || busy || snapshot.status === "paused")
            }
            isPlaying={playing}
            busy={busy}
            onPlayPause={playPause}
            onStop={() => void controller.stop().catch(() => undefined)}
            playPauseTestID="consumer-play-pause"
          />
        )
      }
    >
      <EditorialHeader label={outcome.toUpperCase()} showBack />
      <ConsumerPlaybackSurface
        hideTransport={!otherSessionActive}
        previewTransport={otherSessionActive}
        canPlay={Boolean(work && ready)}
        canStop={matching && (playing || busy || snapshot.status === "paused")}
        contextLabel=""
        isPlaying={playing}
        status={work ? status : "Unavailable"}
        error={visibleError}
        onRetry={() => {
          setError(null);
          if (candidate.error) setSelectionAttempt((value) => value + 1);
          prepared.retry();
        }}
        note={
          work
            ? "One complete sound repeats for the time you choose."
            : "Return Home and choose an activity."
        }
        onPlayPause={playPause}
        onStop={() => void controller.stop().catch(() => undefined)}
        onVolumeChange={(value) => void controller.setVolume(value)}
        volumeDisabled={!matching || busy}
        outcome={outcome}
        remainingMs={matching ? snapshot.remainingMs : duration * 60000}
        title={work ? sessionContextTitle(outcome) : "Sound unavailable"}
        volume={snapshot.volume}
        playPauseTestID="consumer-play-pause"
        options={
          work ? (
            <>
              {natureAvailable && (
                <NatureAmbienceChoice
                  value={nature}
                  disabled={
                    matching &&
                    ["playing", "paused", "fadingOut", "preparing"].includes(
                      snapshot.status,
                    )
                  }
                  onChange={(value) => {
                    setVariant(null);
                    setNature(value);
                    router.setParams({ nature: value ?? "off" });
                  }}
                />
              )}
              {selection?.kind === "adaptive" &&
                selection.program.plan.natureMix && (
                  <SessionNatureControl
                    family={selection.program.plan.natureMix.selectedFamily}
                    familyDisabled
                    hideFamilyChoice
                    title={nature === "rain" ? "Rain" : "Ocean waves"}
                    level={
                      matching
                        ? (snapshot.natureMixLevel ?? 0.5)
                        : selection.program.plan.natureMix.initialLevel
                    }
                    onFamilyChange={() => undefined}
                    onLevelChange={(value) =>
                      void controller.setNatureMixLevel(value)
                    }
                    volumeDisabled={!matching || busy}
                  />
                )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: timerOpen }}
                onPress={() => setTimerOpen(!timerOpen)}
                style={{ minHeight: 48, justifyContent: "center" }}
              >
                <Text
                  style={{
                    color: editorial.inkMuted,
                    fontFamily: fonts.sans,
                    fontSize: 15,
                  }}
                >
                  {timerOpen ? "Close timer −" : `Timer · ${duration} min +`}
                </Text>
              </Pressable>
              {timerOpen && (
                <ConsumerDurationOptions
                  disabled={playing || busy}
                  options={policy.durations}
                  selectedMinutes={duration}
                  onSelect={(value) => {
                    setVariant(null);
                    setDuration(value as SessionDurationMinutes);
                    router.setParams({ duration: String(value), outcome });
                  }}
                />
              )}
            </>
          ) : null
        }
      />
      {selection?.kind === "adaptive"
        ? renderNatureReview?.(selection.program, matching, setVariant)
        : work &&
          renderReviewControls?.(
            work,
            matching,
            matching
              ? Math.max(0, duration * 60 - snapshot.remainingMs / 1000)
              : 0,
            visibleError,
          )}
      {work && isPwaWebSurface() && work.sourceKind === "file" ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: offlineOpen }}
            onPress={() => setOfflineOpen(!offlineOpen)}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Text
              style={{
                color: editorial.inkMuted,
                fontFamily: fonts.sans,
                fontSize: 15,
              }}
            >
              {offlineOpen ? "Close offline options −" : "Offline options +"}
            </Text>
          </Pressable>
          {offlineOpen && <DownloadControl workId={work.id} />}
        </>
      ) : null}
    </EditorialScreen>
  );
}

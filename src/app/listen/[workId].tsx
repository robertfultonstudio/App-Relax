import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
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
import { getSessionPolicy } from "@/content/sessionPolicies";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  consumerSelectionKey,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import type { SessionDurationMinutes } from "@/domain/sessions/types";
import { isPwaWebSurface } from "@/domain/sessions/playbackAvailability";

export default function ConsumerPlayerScreen() {
  const params = useLocalSearchParams<{
    workId: string;
    outcome?: string;
    duration?: string;
  }>();
  return (
    <Player
      key={`${params.workId}:${params.outcome ?? ""}:${params.duration ?? ""}`}
      {...params}
    />
  );
}
function Player({
  workId,
  outcome: outcomeParam,
  duration: durationParam,
}: {
  workId: string;
  outcome?: string;
  duration?: string;
}) {
  const resolved = getConsumerWork(workId);
  const work =
    resolved && isVisibleConsumerWork(resolved) && isPlayableWork(resolved)
      ? resolved
      : null;
  const outcome = CONSUMER_OUTCOMES.some(({ id }) => id === outcomeParam)
    ? (outcomeParam as ConsumerOutcomeId)
    : (work?.primaryOutcome ?? "relax");
  const policy = getSessionPolicy(outcome);
  const requested = Number(durationParam) as SessionDurationMinutes;
  const { controller, snapshot } = useAudioSession();
  const active = controller.getConsumerSelection();
  const [duration, setDuration] = useState<SessionDurationMinutes>(
    policy.durations.includes(requested)
      ? requested
      : active?.kind === "single" && active.program.work.id === workId
        ? active.durationMinutes
        : policy.defaultDuration,
  );
  const [error, setError] = useState<string | null>(null);
  const selection = useMemo<ConsumerSelection | null>(
    () =>
      work
        ? {
            kind: "single",
            program: createSingleTrackProgram(work, outcome),
            outcome,
            durationMinutes: duration,
          }
        : null,
    [work, outcome, duration],
  );
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
    error ?? prepared.error ?? (matching ? snapshot.error : null);
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
        contextLabel={outcome.toUpperCase()}
        isPlaying={playing}
        status={work ? status : "Unavailable"}
        error={visibleError}
        onRetry={() => {
          setError(null);
          prepared.retry();
        }}
        note={
          work
            ? "One complete sound repeats for the time you choose."
            : "Return to Sounds and choose an available work."
        }
        onPlayPause={playPause}
        onStop={() => void controller.stop().catch(() => undefined)}
        onVolumeChange={(value) => void controller.setVolume(value)}
        volumeDisabled={!matching || busy}
        outcome={outcome}
        remainingMs={matching ? snapshot.remainingMs : duration * 60000}
        title={work?.title ?? "Sound unavailable"}
        volume={snapshot.volume}
        playPauseTestID="consumer-play-pause"
        options={
          work ? (
            <ConsumerDurationOptions
              disabled={playing || busy}
              options={policy.durations}
              selectedMinutes={duration}
              onSelect={(value) => setDuration(value as SessionDurationMinutes)}
            />
          ) : null
        }
      />
      {work && isPwaWebSurface() && work.sourceKind === "file" ? (
        <DownloadControl workId={work.id} />
      ) : null}
    </EditorialScreen>
  );
}

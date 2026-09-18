import {
  type Href,
  useGlobalSearchParams,
  usePathname,
  useRouter,
} from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioSession } from "@/audio/AudioProvider";
import { consumerSelectionUrl } from "@/domain/audio/consumerSelection";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { formatPlaybackTime } from "./ConsumerPlaybackSurface";
import { PlaybackTransport } from "./PlaybackTransport";
import { sessionContextTitle } from "@/content/sessionPolicies";
import { isPwaWebSurface } from "@/domain/sessions/playbackAvailability";

export function CurrentSessionBar({
  showReviewCopy = true,
}: {
  showReviewCopy?: boolean;
} = {}) {
  const { controller, snapshot } = useAudioSession();
  const router = useRouter();
  const path = usePathname();
  const params = useGlobalSearchParams<{
    duration?: string;
    outcome?: string;
    sound?: string;
    nature?: string;
  }>();
  const selection = controller.getConsumerSelection();
  if (
    !selection ||
    !["playing", "paused", "fadingOut", "preparing", "error"].includes(
      snapshot.status,
    )
  )
    return null;
  const url = consumerSelectionUrl(selection);
  const hasSessionReview =
    isPwaWebSurface() &&
    selection.kind === "adaptive" &&
    !selection.program.plan.listeningWorkId;
  const playerUrl =
    hasSessionReview && showReviewCopy ? `${url}&review=1` : url;
  const sameDetails =
    selection.kind === "single"
      ? (params.outcome ?? selection.outcome) === selection.outcome &&
        Number(params.duration ?? selection.durationMinutes) ===
          selection.durationMinutes &&
        (params.nature ?? "off") === "off"
      : selection.program.plan.listeningWorkId
        ? (params.outcome ?? selection.request.outcome) ===
            selection.request.outcome &&
          Number(params.duration ?? selection.request.durationMinutes) ===
            selection.request.durationMinutes &&
          (params.nature ??
            (selection.program.plan.natureMix?.enabled === false
              ? "off"
              : selection.program.plan.natureMix?.selectedFamily)) ===
            (selection.program.plan.natureMix?.enabled === false
              ? "off"
              : selection.program.plan.natureMix?.selectedFamily)
        : Number(params.duration) === selection.request.durationMinutes &&
          params.sound === selection.request.soundKind &&
          (params.nature ?? "sea") ===
            (selection.request.soundKind === "music" &&
            (!selection.program.plan.natureMix ||
              selection.program.plan.natureMix.enabled === false)
              ? "off"
              : selection.request.natureFamily);
  if (path === url.split("?")[0] && sameDetails) return null;
  const playing =
    snapshot.status === "playing" || snapshot.status === "fadingOut";
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={styles.bar}
      accessibilityLabel="Current session"
      testID="current-session-bar"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to current session"
        onPress={() => router.push(playerUrl as Href)}
        style={styles.return}
      >
        <Text style={styles.title}>
          {sessionContextTitle(
            selection.kind === "single"
              ? selection.outcome
              : selection.request.outcome,
            selection.kind === "adaptive" &&
              !selection.program.plan.listeningWorkId,
          )}
        </Text>
        <Text style={styles.detail}>
          {snapshot.status === "paused" ? "Paused · " : ""}
          {formatPlaybackTime(snapshot.remainingMs)} left ·{" "}
          {hasSessionReview && showReviewCopy
            ? `${selection.request.durationMinutes} min · Player & review →`
            : "Return →"}
          {snapshot.status === "error" ? " · Playback needs attention" : ""}
        </Text>
      </Pressable>
      <PlaybackTransport
        canPlay={snapshot.status !== "preparing"}
        canStop
        isPlaying={playing}
        busy={snapshot.status === "preparing"}
        primaryLabel={
          snapshot.status === "error"
            ? "Retry"
            : snapshot.status === "paused"
              ? "Resume"
              : undefined
        }
        playPauseAccessibilityLabel={
          snapshot.status === "error"
            ? "Review playback error"
            : playing
              ? "Pause current session"
              : "Resume current session"
        }
        onPlayPause={() =>
          snapshot.status === "error"
            ? router.push(url as Href)
            : void (
                playing ? controller.pause() : controller.playFromUserGesture()
              ).catch(() => undefined)
        }
        stopAccessibilityLabel="Stop current session"
        onStop={() => void controller.stop().catch(() => undefined)}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "column",
    gap: 8,
    borderTopWidth: 1,
    borderColor: editorial.lineStrong,
    backgroundColor: editorial.paperLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  return: { minHeight: 44, justifyContent: "center" },
  control: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontFamily: fonts.serif, fontSize: 18, color: editorial.ink },
  detail: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: editorial.inkMuted,
  },
});

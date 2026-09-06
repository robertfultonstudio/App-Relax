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

export function CurrentSessionBar() {
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
  const sameDetails =
    selection.kind === "single"
      ? (params.outcome ?? selection.program.work.primaryOutcome) ===
          selection.outcome &&
        Number(params.duration ?? selection.durationMinutes) ===
          selection.durationMinutes
      : Number(params.duration) === selection.request.durationMinutes &&
        params.sound === selection.request.soundKind &&
        (params.nature ?? "sea") === selection.request.natureFamily;
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
        onPress={() => router.push(url as Href)}
        style={styles.return}
      >
        <Text style={styles.title}>
          {selection.kind === "single"
            ? selection.program.work.title
            : `${selection.request.outcome} session`}
        </Text>
        <Text style={styles.detail}>
          {formatPlaybackTime(snapshot.remainingMs)} · Return →
          {snapshot.status === "error" ? " · Playback needs attention" : ""}
        </Text>
      </Pressable>
      <PlaybackTransport
        canPlay={snapshot.status !== "preparing"}
        canStop
        isPlaying={playing}
        busy={snapshot.status === "preparing"}
        primaryLabel={snapshot.status === "error" ? "Retry" : undefined}
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

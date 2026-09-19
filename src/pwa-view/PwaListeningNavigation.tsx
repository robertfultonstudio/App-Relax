import { useAudioSession } from "@/audio/AudioProvider";
import type { PlaybackStatus } from "@/domain/audio/types";
import { PwaBottomNavigation } from "./PwaBottomNavigation";

const HIDDEN_DURING_LISTENING = new Set<PlaybackStatus>([
  "preparing",
  "playing",
  "paused",
  "fadingOut",
  "completed",
]);

export function isPwaNavigationHidden(status: PlaybackStatus): boolean {
  return HIDDEN_DURING_LISTENING.has(status);
}

export function PwaListeningNavigation() {
  const { snapshot } = useAudioSession();
  return isPwaNavigationHidden(snapshot.status) ? null : (
    <PwaBottomNavigation />
  );
}

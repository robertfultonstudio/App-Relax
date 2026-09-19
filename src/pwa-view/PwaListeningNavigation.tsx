import { useAudioSession } from "@/audio/AudioProvider";
import type { PlaybackStatus } from "@/domain/audio/types";
import { usePathname } from "expo-router";
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

export function isPwaListeningRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/listen/") || pathname.startsWith("/adaptive-session/")
  );
}

export function PwaListeningNavigation() {
  const { snapshot } = useAudioSession();
  const pathname = usePathname();
  return isPwaListeningRoute(pathname) ||
    isPwaNavigationHidden(snapshot.status) ? null : (
    <PwaBottomNavigation />
  );
}

import { useRef, useState } from "react";
import { type Href, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import type { ConsumerOutcomeId } from "@/content/productShell";
import {
  consumerSelectionUrl,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { formatPlaybackTime } from "./ConsumerPlaybackSurface";

export function useCurrentActivity(outcome: ConsumerOutcomeId) {
  const { controller, snapshot } = useAudioSession();
  const current = controller.getConsumerSelection();
  const ongoing = [
    "playing",
    "paused",
    "fadingOut",
    "preparing",
    "error",
  ].includes(snapshot.status);
  const currentOutcome =
    current?.kind === "single" ? current.outcome : current?.request.outcome;
  // Returning to the same activity never implicitly replaces its active form.
  return ongoing && currentOutcome === outcome ? current : null;
}

export function CurrentActivityChoice({
  selection,
  onNew,
}: {
  selection: ConsumerSelection;
  onNew: () => void;
}) {
  const { controller, snapshot } = useAudioSession();
  const router = useRouter();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const paused = snapshot.status === "paused";
  const label = paused ? "Resume your session" : "Return to your session";
  function returnToSession() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const operation = paused
      ? controller.playFromUserGesture()
      : Promise.resolve();
    void operation
      .then(() => router.push(consumerSelectionUrl(selection) as Href))
      .catch(() =>
        setError("Could not resume. Open the current player or retry."),
      )
      .finally(() => {
        pending.current = false;
        setBusy(false);
      });
  }
  return (
    <View>
      <Text
        style={{
          color: editorial.inkMuted,
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 24,
        }}
      >
        {formatPlaybackTime(snapshot.remainingMs)} remaining ·{" "}
        {paused ? "Paused" : "Current session"}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={returnToSession}
        style={{
          minHeight: 56,
          backgroundColor: editorial.ink,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        <Text
          style={{
            color: editorial.paperLight,
            fontFamily: fonts.sansSemiBold,
            fontSize: 18,
          }}
        >
          {busy ? "Opening…" : label}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onNew}
        style={{ minHeight: 52, justifyContent: "center" }}
      >
        <Text
          style={{
            color: editorial.inkMuted,
            fontFamily: fonts.sans,
            fontSize: 15,
          }}
        >
          Prepare a new session →
        </Text>
      </Pressable>
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

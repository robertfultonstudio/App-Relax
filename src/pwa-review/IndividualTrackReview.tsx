import { type Href, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import { soundFamilyFor } from "@/content/soundFamilies";
import { REVIEW_REVISION } from "@/content/reviewRevision";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { isPwaWebSurface } from "@/domain/sessions/playbackAvailability";
import { reviewTime } from "./reviewTimeline";
import { pwaDeliveryFilename } from "./pwaDeliveryFilename";

/** File-only inventory of the same delivered works, never a second catalogue. */
export const LOOP_REVIEW_WORKS = CONSUMER_AUDIO_WORKS.filter(
  (work) =>
    work.sourceKind === "file" &&
    work.deliveryScope !== "local-only" &&
    work.availability === "local-preview-file",
);

export function IndividualTrackReviewLink() {
  const router = useRouter();
  if (!isPwaWebSurface()) return null;
  return (
    <Pressable
      accessibilityRole="link"
      style={styles.link}
      onPress={() => router.push("/loop-review" as Href)}
    >
      <Text style={styles.linkText}>Individual tracks · loop tests →</Text>
    </Pressable>
  );
}

export function IndividualTrackReview() {
  const router = useRouter();
  const { controller } = useAudioSession();
  const [opening, setOpening] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  if (!isPwaWebSurface()) return null;
  const groups = [
    {
      title: "Respiro Hatha 1",
      works: LOOP_REVIEW_WORKS.filter((w) => w.cycle),
    },
    {
      title: "Music",
      works: LOOP_REVIEW_WORKS.filter(
        (w) => !w.cycle && soundFamilyFor(w) === "music",
      ),
    },
    {
      title: "Natural sounds",
      works: LOOP_REVIEW_WORKS.filter((w) => soundFamilyFor(w) !== "music"),
    },
  ];
  async function openTrack(id: string) {
    if (pending.current) return;
    pending.current = true;
    setOpening(true);
    setError("");
    try {
      // An explicit isolated test replaces the current session, never mixes it.
      await controller.stop();
      router.push(`/listen/${id}?review=1&isolated=1` as Href);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not stop the current session. Retry.",
      );
    } finally {
      pending.current = false;
      setOpening(false);
    }
  }
  return (
    <EditorialScreen>
      <EditorialHeader label="DEVELOPMENT REVIEW" showBack />
      <Text accessibilityRole="header" style={styles.title}>
        Individual loop tests
      </Text>
      <Text style={styles.body}>
        {LOOP_REVIEW_WORKS.length} separate recordings. Opening a test stops the
        current session. Press Play, then Last 5 seconds to hear the file return
        to its beginning.
      </Text>
      <Text style={styles.body}>
        One file only: no added ambience or session transition. Listen for a
        click, silence or a change in level at the return. A moving counter is
        not listening approval.
      </Text>
      <Text style={styles.body}>{REVIEW_REVISION}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.body}>
          {error}
        </Text>
      ) : null}
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text accessibilityRole="header" style={styles.section}>
            {group.title} · {group.works.length}
          </Text>
          {group.works.map((work) => (
            <Pressable
              key={work.id}
              accessibilityRole="button"
              accessibilityLabel={`Test loop: ${work.title}`}
              accessibilityState={{ disabled: opening }}
              disabled={opening}
              onPress={() => void openTrack(work.id)}
              style={styles.track}
            >
              <Text style={styles.trackTitle}>{work.title}</Text>
              <Text style={styles.body}>
                File length {reviewTime(work.durationSeconds)} · Test loop →
              </Text>
              <Text style={styles.filename}>{pwaDeliveryFilename(work)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Text style={styles.body}>
        Noise generators are continuous synthesis, not recorded files with an
        end-to-start seam.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 44,
  },
  body: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  filename: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
    flexShrink: 1,
  },
  group: { marginTop: 32 },
  section: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 32,
  },
  track: {
    minHeight: 64,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.lineStrong,
  },
  trackTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 23,
    lineHeight: 29,
  },
  link: { minHeight: 52, justifyContent: "center", paddingVertical: 12 },
  linkText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
});

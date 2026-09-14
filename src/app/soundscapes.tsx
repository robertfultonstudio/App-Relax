import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { ProductTabBar } from "@/components/ProductTabBar";
import {
  getVisibleConsumerWorks,
  isPlayableWork,
} from "@/content/consumerCatalog";
import { soundFamilyFor } from "@/content/soundFamilies";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { isNativeCatalogPreview } from "@/domain/sessions/playbackAvailability";

const FAMILIES = [
  { id: "music", label: "Music" },
  { id: "sea", label: "Sea" },
  { id: "rain", label: "Rain" },
  { id: "stream", label: "Stream" },
  { id: "noise", label: "Noise" },
  { id: "air", label: "Air" },
  { id: "unclassified-nature", label: "Natural textures · local review" },
] as const;
type FamilyId = (typeof FAMILIES)[number]["id"];

export default function SoundscapesScreen({
  musicOnly = false,
  reviewLabel,
  onUnclassifiedWorkSelect,
}: {
  musicOnly?: boolean;
  reviewLabel?: string;
  onUnclassifiedWorkSelect?: (workId: string) => void;
} = {}) {
  const router = useRouter();
  const [expandedFamily, setExpandedFamily] = useState<FamilyId | null>(
    musicOnly ? "music" : null,
  );
  const visibleWorks = getVisibleConsumerWorks().filter(
    (work) =>
      work.listeningStatus !== "REJECTED — REPLACEMENT REQUIRED" &&
      (work.primaryOutcome !== null ||
        Boolean(onUnclassifiedWorkSelect) ||
        isNativeCatalogPreview()),
  );
  const families = FAMILIES.map((family) => ({
    ...family,
    works: visibleWorks
      .filter((work) => soundFamilyFor(work) === family.id)
      .sort(
        (a, b) =>
          (a.cycle?.structuralOrder ?? 100) - (b.cycle?.structuralOrder ?? 100),
      ),
  })).filter(({ works }) => works.length > 0);
  const selected = families.find(({ id }) => id === expandedFamily);

  return (
    <EditorialScreen
      footer={<ProductTabBar activeTab="soundscapes" />}
      tone="sky"
    >
      <EditorialHeader
        actionLabel="Settings"
        label={musicOnly ? "MUSIC" : "SOUNDS"}
        onAction={() => router.push("/settings" as Href)}
      />
      <Text accessibilityRole="header" style={styles.title}>
        {musicOnly ? "Your music." : "Find your sound."}
      </Text>
      <Text style={styles.intro}>
        {musicOnly
          ? `${selected?.works.length ?? 0} musical works. Open a track, then press Play.`
          : "Open a family, choose a sound, then set your listening time."}
      </Text>
      {reviewLabel ? (
        <Text style={styles.count} testID="music-review-version">
          {reviewLabel}
        </Text>
      ) : null}

      {!musicOnly ? (
        <View
          accessibilityLabel="Sound families"
          style={styles.index}
          testID="sound-family-index"
        >
          {families.map((family) => {
            const expanded = family.id === expandedFamily;
            return (
              <Pressable
                key={family.id}
                accessibilityRole="button"
                accessibilityLabel={`${family.label}, ${family.works.length} ${family.works.length === 1 ? "sound" : "sounds"}`}
                accessibilityHint={
                  expanded
                    ? "Closes this family"
                    : "Shows sounds in this family"
                }
                accessibilityState={{ expanded }}
                aria-expanded={expanded}
                aria-controls={
                  expanded ? `sound-family-${family.id}` : undefined
                }
                onPress={() => setExpandedFamily(expanded ? null : family.id)}
                style={({ pressed }) => [
                  styles.family,
                  expanded && styles.selectedFamily,
                  pressed && styles.pressed,
                ]}
                testID={`sound-family-toggle-${family.id}`}
              >
                <View style={styles.familyCopy}>
                  <Text style={styles.familyLabel}>{family.label}</Text>
                  <Text style={styles.count}>
                    {family.works.length}{" "}
                    {family.works.length === 1 ? "sound" : "sounds"}
                  </Text>
                </View>
                <Text accessible={false} style={styles.mark}>
                  {expanded ? "−" : "+"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selected ? (
        <View
          accessibilityLabel={`${selected.label} sounds`}
          nativeID={`sound-family-${selected.id}`}
          style={styles.collection}
          testID={`soundscape-collection-${selected.id}`}
        >
          {!musicOnly ? (
            <Text accessibilityRole="header" style={styles.collectionTitle}>
              {selected.label}
            </Text>
          ) : null}
          {selected.works.some(
            (work) => work.cycle?.id === "respiro-hatha-1",
          ) ? (
            <Text style={styles.intro}>Respiro Hatha 1 · 8 music tracks</Text>
          ) : null}
          {selected.works.map((work) => {
            const available = isPlayableWork(work);
            return (
              <Pressable
                key={work.id}
                accessibilityRole="button"
                accessibilityLabel={`${work.title}. ${available ? "Choose listening time" : "Not available on this device"}.`}
                accessibilityState={{ disabled: !available }}
                disabled={!available}
                onPress={() =>
                  work.primaryOutcome === null && !isNativeCatalogPreview()
                    ? onUnclassifiedWorkSelect?.(work.id)
                    : router.push(`/listen/${work.id}` as Href)
                }
                style={({ pressed }) => [
                  styles.work,
                  pressed && styles.pressed,
                ]}
                testID={`consumer-work-${work.id}`}
              >
                <View style={styles.workCopy}>
                  <Text style={styles.workTitle}>{work.title}</Text>
                  <Text style={styles.workNote}>
                    {!available
                      ? "Not available on this device"
                      : work.cycle
                        ? `Respiro Hatha 1 · ${String(work.cycle.structuralOrder).padStart(2, "0")} / 08 · Choose duration`
                        : work.sourceKind === "generated-noise"
                          ? "Continuous sound · Choose duration"
                          : work.primaryOutcome === null
                            ? "Local review only · classification and listening pending"
                            : "Choose duration"}
                  </Text>
                </View>
                {available ? (
                  <Text accessible={false} style={styles.mark}>
                    →
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 40,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  index: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  family: {
    width: "48%",
    minHeight: 76,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopColor: editorial.lineStrong,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedFamily: { backgroundColor: editorial.paperDeep },
  familyCopy: { flex: 1, paddingRight: spacing.xs },
  familyLabel: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 30,
  },
  count: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  mark: { color: editorial.ink, fontSize: 22 },
  collection: { marginTop: spacing.lg },
  collectionTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  work: {
    minHeight: 76,
    paddingVertical: spacing.md,
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workCopy: { flex: 1, paddingRight: spacing.md },
  workTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 23,
    lineHeight: 28,
  },
  workNote: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  pressed: { backgroundColor: editorial.paperDeep },
});

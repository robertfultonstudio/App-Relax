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
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

const FAMILIES = [
  { id: "sea", label: "Sea" },
  { id: "rain", label: "Rain" },
  { id: "stream", label: "Stream" },
  { id: "music", label: "Music" },
  { id: "noise", label: "Noise" },
  { id: "air", label: "Air" },
] as const;
type FamilyId = (typeof FAMILIES)[number]["id"];

function familyFor(work: ConsumerAudioWork): FamilyId {
  if (work.sourceKind === "generated-noise") return "noise";
  if (work.familyId.startsWith("field-sea-")) return "sea";
  if (work.familyId.startsWith("field-rain-")) return "rain";
  if (work.familyId.startsWith("field-stream-") || work.id === "deep-river")
    return "stream";
  if (
    work.collectionIds.includes("elemental-air") ||
    work.collectionIds.includes("esoteric-series")
  )
    return "air";
  return "music";
}

export default function SoundscapesScreen() {
  const router = useRouter();
  const [expandedFamily, setExpandedFamily] = useState<FamilyId | null>(null);
  const visibleWorks = getVisibleConsumerWorks().filter(
    (work) => work.listeningStatus !== "REJECTED — REPLACEMENT REQUIRED",
  );
  const families = FAMILIES.map((family) => ({
    ...family,
    works: visibleWorks.filter((work) => familyFor(work) === family.id),
  })).filter(({ works }) => works.length > 0);
  const selected = families.find(({ id }) => id === expandedFamily);

  return (
    <EditorialScreen
      footer={<ProductTabBar activeTab="soundscapes" />}
      tone="sky"
    >
      <EditorialHeader
        actionLabel="Settings"
        label="SOUNDS"
        onAction={() => router.push("/settings" as Href)}
      />
      <Text accessibilityRole="header" style={styles.title}>
        Find your sound.
      </Text>
      <Text style={styles.intro}>
        Open a family, choose a sound, then set your listening time.
      </Text>

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
                expanded ? "Closes this family" : "Shows sounds in this family"
              }
              accessibilityState={{ expanded }}
              aria-expanded={expanded}
              aria-controls={expanded ? `sound-family-${family.id}` : undefined}
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

      {selected ? (
        <View
          accessibilityLabel={`${selected.label} sounds`}
          nativeID={`sound-family-${selected.id}`}
          style={styles.collection}
          testID={`soundscape-collection-${selected.id}`}
        >
          <Text accessibilityRole="header" style={styles.collectionTitle}>
            {selected.label}
          </Text>
          {selected.works.map((work) => {
            const available = isPlayableWork(work);
            return (
              <Pressable
                key={work.id}
                accessibilityRole="button"
                accessibilityLabel={`${work.title}. ${available ? "Choose listening time" : "Not available on this device"}.`}
                accessibilityState={{ disabled: !available }}
                disabled={!available}
                onPress={() => router.push(`/listen/${work.id}` as Href)}
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
                      : work.sourceKind === "generated-noise"
                        ? "Continuous sound · Choose duration"
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

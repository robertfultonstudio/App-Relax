import { type Href, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { ProductTabBar } from "@/components/ProductTabBar";
import { ConsumerWorkCard } from "@/components/ConsumerWorkCard";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import { editorial } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

export default function SoundscapesScreen() {
  const router = useRouter();
  const cosmicWorks = CONSUMER_AUDIO_WORKS.filter((work) =>
    work.collectionIds.includes("cosmic-zen-ambient"),
  );
  const stillwaterHalo = cosmicWorks.find(
    (work) => work.id === "stillwater-halo",
  );
  const orderedCosmicWorks = cosmicWorks.filter(
    (work) => work.id !== "stillwater-halo",
  );
  if (stillwaterHalo) orderedCosmicWorks.push(stillwaterHalo);

  const collections = [
    {
      id: "cosmic-zen-ambient",
      label: "COSMIC / ZEN AMBIENT",
      works: orderedCosmicWorks,
    },
    {
      id: "standalone-works",
      label: "STANDALONE WORKS",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.collectionIds.includes("standalone-works"),
      ),
    },
    {
      id: "noise-colours",
      label: "NOISE COLOURS",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.collectionIds.includes("noise-colours"),
      ),
    },
    {
      id: "elemental-rain",
      label: "ELEMENTAL WORLDS · RAIN",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.familyId.startsWith("field-rain-"),
      ),
    },
    {
      id: "elemental-stream",
      label: "ELEMENTAL WORLDS · STREAM",
      works: CONSUMER_AUDIO_WORKS.filter(
        (work) =>
          work.familyId.startsWith("field-stream-") || work.id === "deep-river",
      ),
    },
    {
      id: "elemental-sea",
      label: "ELEMENTAL WORLDS · SEA",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.familyId.startsWith("field-sea-"),
      ),
    },
    {
      id: "elemental-air",
      label: "ELEMENTAL WORLDS · AIR",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.collectionIds.includes("elemental-air"),
      ),
    },
    {
      id: "esoteric-series",
      label: "ESOTERIC SERIES · AIR",
      works: CONSUMER_AUDIO_WORKS.filter((work) =>
        work.collectionIds.includes("esoteric-series"),
      ),
    },
  ] as const;
  return (
    <EditorialScreen
      footer={<ProductTabBar activeTab="soundscapes" />}
      tone="sky"
    >
      <EditorialHeader
        actionLabel="Settings"
        label="SOUNDSCAPES"
        onAction={() => router.push("/settings" as Href)}
      />
      <Text style={styles.kicker}>SOUNDSCAPES</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Where would you like to go?
      </Text>
      <Text style={styles.intro}>
        Complete works, curated as destinations rather than layers.
      </Text>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.editorialArtwork}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="cover"
          source={OUTCOME_ARTWORK.meditation}
          style={styles.editorialArtworkImage}
          testID="soundscapes-editorial-artwork"
        />
      </View>
      <Text style={styles.artworkCaption}>
        IMAGE STUDY 01 / A LISTENING FIELD
      </Text>

      <View accessibilityLabel="Soundscape collections" style={styles.list}>
        {collections.map((collection) => (
          <View
            key={collection.id}
            style={styles.collection}
            testID={`soundscape-collection-${collection.id}`}
          >
            <Text style={styles.collectionLabel}>{collection.label}</Text>
            {collection.works.map((work) => (
              <ConsumerWorkCard
                key={work.id}
                onPress={() => router.push(`/listen/${work.id}` as Href)}
                work={work}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Approved works are available in this localhost listening preview. Noise
        colours are generated on demand; the mobile delivery package remains a
        separate release gate.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 43,
    lineHeight: 46,
    marginTop: spacing.sm,
    maxWidth: 350,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  list: { marginTop: spacing.xl },
  collection: { marginBottom: spacing.xl },
  collectionLabel: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.3,
    marginBottom: spacing.md,
  },
  editorialArtwork: {
    height: 190,
    overflow: "hidden",
    marginTop: spacing.xl,
  },
  editorialArtworkImage: { height: "100%", width: "100%" },
  artworkCaption: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    marginTop: spacing.sm,
    textAlign: "right",
  },
  note: {
    color: editorial.inkFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.line,
    paddingTop: spacing.md,
  },
});

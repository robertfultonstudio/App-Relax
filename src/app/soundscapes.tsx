import { type Href, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { ProductTabBar } from "@/components/ProductTabBar";
import { ProductionCard } from "@/components/ProductionCard";
import { SOUNDSCAPE_COLLECTIONS } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

export default function SoundscapesScreen() {
  const router = useRouter();
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
        Future listening works, curated as destinations rather than utilities.
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
        IMAGE STUDY 01 / A FUTURE LISTENING FIELD
      </Text>

      <View
        accessibilityLabel="Planned soundscape collections"
        style={styles.list}
      >
        {SOUNDSCAPE_COLLECTIONS.map((collection) => (
          <ProductionCard key={collection.id} {...collection} />
        ))}
      </View>
      <Text style={styles.note}>
        Every collection is in production. No soundscape audio is published.
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

import { type Href, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { CategoryCard } from "@/components/CategoryCard";
import { TopBar } from "@/components/TopBar";
import { CATEGORIES } from "@/domain/catalog";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <AmbientScreen>
      <TopBar
        actionLabel="Settings"
        onAction={() => router.push("/settings" as Href)}
      />
      <Text style={styles.kicker}>YOUR EVENING, HELD GENTLY</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Make space{`\n`}for quiet.
      </Text>
      <Text style={styles.intro}>
        Layered sound rituals for sleep, calm, focus and meditation.
      </Text>

      <Pressable
        accessibilityHint="Open the Deep Sleep 432 player"
        accessibilityRole="button"
        onPress={() => router.push("/session/deep-sleep-432" as Href)}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[
            "rgba(142, 168, 200, 0.42)",
            "rgba(155, 138, 175, 0.13)",
            "#162023",
          ]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>TONIGHT&apos;S RITUAL</Text>
          <View style={styles.placeholderBadge}>
            <Text style={styles.placeholderText}>EARLY ACCESS</Text>
          </View>
        </View>
        <View style={styles.moon}>
          <View style={styles.moonCutout} />
        </View>
        <Text style={styles.heroTitle}>Deep Sleep 432</Text>
        <Text style={styles.heroMeta}>
          3 layers · binaural 3.5 Hz · brown noise
        </Text>
        <View style={styles.heroAction}>
          <Text style={styles.heroActionText}>Begin session</Text>
          <Text style={styles.heroArrow}>→</Text>
        </View>
      </Pressable>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Choose a space</Text>
        <Text style={styles.sectionMeta}>4 intentions</Text>
      </View>
      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <CategoryCard
            category={category}
            key={category.id}
            onPress={() => router.push(`/category/${category.id}` as Href)}
          />
        ))}
      </View>
      <Text style={styles.footerNote}>
        Sound for atmosphere and personal ritual. No medical or therapeutic
        claims.
      </Text>
    </AmbientScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.moon,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 47,
    lineHeight: 51,
    letterSpacing: -1.2,
    marginTop: spacing.sm,
  },
  intro: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  hero: {
    minHeight: 314,
    marginTop: spacing.xl,
    borderRadius: 32,
    padding: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(216, 203, 231, 0.22)",
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
  placeholderBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(11, 17, 20, 0.35)",
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  moon: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    right: -8,
    top: 70,
    backgroundColor: "rgba(243, 233, 216, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(243, 233, 216, 0.32)",
  },
  moonCutout: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    left: 30,
    top: -8,
    backgroundColor: "#253237",
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 32,
    marginTop: 136,
  },
  heroMeta: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 7,
  },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  heroActionText: {
    color: colors.moon,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "700",
  },
  heroArrow: { color: colors.moon, fontSize: 22 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 24 },
  sectionMeta: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  footerNote: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xl,
    textAlign: "center",
  },
});

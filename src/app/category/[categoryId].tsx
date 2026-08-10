import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { TopBar } from "@/components/TopBar";
import { getCategory } from "@/domain/catalog";
import { getPresetsForGoal } from "@/presets/presetRegistry";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const category = getCategory(categoryId);

  if (!category) {
    return (
      <AmbientScreen>
        <TopBar showBack />
        <Text style={styles.title}>This space is not available.</Text>
      </AmbientScreen>
    );
  }

  const presets = getPresetsForGoal(category.id);
  return (
    <AmbientScreen>
      <TopBar label={category.eyebrow} showBack />
      <View style={[styles.glyphRing, { borderColor: category.accent }]}>
        <Text style={[styles.glyph, { color: category.accent }]}>
          {category.glyph}
        </Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {category.title}
      </Text>
      <Text style={styles.description}>{category.description}</Text>

      <Text style={styles.sectionLabel}>AVAILABLE RITUALS</Text>
      {presets.length > 0 ? (
        presets.map((preset) => (
          <Pressable
            accessibilityHint={`Open ${preset.title}`}
            accessibilityRole="button"
            key={preset.id}
            onPress={() => router.push(`/session/${preset.id}` as Href)}
            style={({ pressed }) => [styles.session, pressed && styles.pressed]}
          >
            <View style={styles.sessionMoon}>
              <View style={styles.sessionMoonCutout} />
            </View>
            <View style={styles.sessionBody}>
              <Text style={styles.sessionTitle}>{preset.title}</Text>
              <Text style={styles.sessionSubtitle}>{preset.subtitle}</Text>
              <Text style={styles.sessionMeta}>
                {preset.durationOptionsMinutes.join(" / ")} min ·{" "}
                {preset.beatHz} Hz beat
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>◌</Text>
          <Text style={styles.emptyTitle}>This collection is still quiet.</Text>
          <Text style={styles.emptyBody}>
            The first technical slice stays intentionally focused on one Sleep
            ritual.
          </Text>
        </View>
      )}
    </AmbientScreen>
  );
}

const styles = StyleSheet.create({
  glyphRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 33 },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 44,
    marginTop: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  sectionLabel: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "700",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  session: {
    minHeight: 128,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    padding: spacing.md,
  },
  sessionMoon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(142, 168, 200, 0.26)",
    overflow: "hidden",
  },
  sessionMoonCutout: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    top: -6,
    left: 18,
    backgroundColor: colors.surface,
  },
  sessionBody: { flex: 1, marginLeft: spacing.md },
  sessionTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 21 },
  sessionSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 4,
  },
  sessionMeta: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    marginTop: 9,
  },
  arrow: { color: colors.moon, fontSize: 20, marginLeft: spacing.sm },
  pressed: { opacity: 0.68, transform: [{ scale: 0.99 }] },
  empty: {
    alignItems: "center",
    paddingVertical: 54,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.surfaceLine,
  },
  emptyGlyph: { color: colors.textFaint, fontSize: 38 },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 21,
    marginTop: spacing.md,
  },
  emptyBody: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Category } from "@/domain/catalog";
import { colors, fonts, radii, spacing } from "@/design/theme";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <Pressable
      accessibilityHint={`Open ${category.title} sessions`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.glyphRing, { borderColor: category.accent }]}>
        <Text style={[styles.glyph, { color: category.accent }]}>
          {category.glyph}
        </Text>
      </View>
      <Text style={styles.eyebrow}>{category.eyebrow}</Text>
      <Text style={styles.title}>{category.title}</Text>
      <Text style={styles.description}>{category.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 202,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  glyphRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  glyph: { fontSize: 24, lineHeight: 28 },
  eyebrow: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 24,
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
});

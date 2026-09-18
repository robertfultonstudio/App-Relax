import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { ProductionCard } from "@/components/ProductionCard";
import { TopBar } from "@/components/TopBar";
import { getRitualForGoal, requireRitualTheme } from "@/content/rituals";
import { getCategory } from "@/domain/catalog";
import { colors, fonts, spacing } from "@/design/theme";

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = getCategory(categoryId);
  const ritual = category ? getRitualForGoal(category.id) : undefined;

  if (!category || !ritual) {
    return (
      <AmbientScreen>
        <TopBar showBack />
        <Text style={styles.title}>This space is not available.</Text>
      </AmbientScreen>
    );
  }

  const theme = requireRitualTheme(ritual.themeId);
  return (
    <AmbientScreen theme={theme}>
      <TopBar label={`${category.title.toUpperCase()} RITUAL`} showBack />
      <Text style={[styles.kicker, { color: theme.palette.accent }]}>
        ONE SPACE
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {category.title}, without the noise.
      </Text>
      <Text style={styles.description}>
        This route remains available for direct links. The main experience
        starts from the four rituals on Home.
      </Text>

      <ProductionCard
        accent={theme.palette.accent}
        cosmic={ritual.id === "aquarian-sky"}
        description={ritual.shortDescription}
        id={ritual.id}
        label={ritual.goal.toUpperCase()}
        meta="No audio available yet"
        title={ritual.title}
        wash={theme.palette.accent}
      />
    </AmbientScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 42,
    lineHeight: 46,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    maxWidth: 330,
  },
});

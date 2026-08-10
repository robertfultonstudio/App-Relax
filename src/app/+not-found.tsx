import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <AmbientScreen>
      <Text style={styles.glyph}>◌</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Nothing is sounding here.
      </Text>
      <Text style={styles.body}>This route is outside the first ritual.</Text>
      <Pressable
        onPress={() => router.replace("/" as Href)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Return home</Text>
      </Pressable>
    </AmbientScreen>
  );
}

const styles = StyleSheet.create({
  glyph: { color: colors.moon, fontSize: 52, marginTop: 100 },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 34,
    marginTop: spacing.lg,
  },
  body: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  button: {
    alignSelf: "flex-start",
    minHeight: 48,
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  buttonText: { color: colors.background, fontWeight: "800" },
});

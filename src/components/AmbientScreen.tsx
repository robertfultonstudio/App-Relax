import type { PropsWithChildren, ReactNode, RefObject } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RitualTheme } from "@/content/rituals";
import { colors, spacing } from "@/design/theme";

interface AmbientScreenProps extends PropsWithChildren {
  celestial?: boolean;
  footer?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
  theme?: RitualTheme;
  washColors?: readonly [string, string];
}

export function AmbientScreen({
  celestial = false,
  children,
  footer,
  scrollRef,
  scrollProps,
  theme,
  washColors,
}: AmbientScreenProps) {
  const background = theme?.palette.background ?? colors.background;
  const ambient = theme?.palette.surface ?? "#172324";
  const primaryWash = washColors?.[0] ?? theme?.palette.accent ?? colors.moss;
  const secondaryWash = washColors?.[1] ?? theme?.palette.muted ?? colors.dusk;
  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <LinearGradient
        colors={[ambient, background, "#080C11"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[styles.wash, styles.washTop, { backgroundColor: primaryWash }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.wash,
          styles.washBottom,
          { backgroundColor: secondaryWash },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.brushLine, { backgroundColor: primaryWash }]}
      />
      {celestial ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.lightPoint, styles.lightPointOne]} />
          <View style={[styles.lightPoint, styles.lightPointTwo]} />
          <View style={[styles.lightPoint, styles.lightPointThree]} />
          <View style={[styles.lightPoint, styles.lightPointFour]} />
          <View style={[styles.lightPoint, styles.lightPointFive]} />
        </View>
      ) : null}
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          {...scrollProps}
          contentContainerStyle={styles.content}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 56,
  },
  wash: {
    position: "absolute",
    width: 330,
    height: 138,
    borderRadius: 52,
    opacity: 0.1,
  },
  washTop: {
    right: -118,
    top: 24,
    transform: [{ rotate: "-16deg" }],
  },
  washBottom: {
    width: 390,
    height: 120,
    left: -184,
    bottom: 118,
    opacity: 0.08,
    transform: [{ rotate: "12deg" }],
  },
  brushLine: {
    position: "absolute",
    width: 180,
    height: 2,
    right: -22,
    top: 186,
    borderRadius: 2,
    opacity: 0.14,
    transform: [{ rotate: "-14deg" }],
  },
  lightPoint: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#EFD7A2",
    opacity: 0.5,
  },
  lightPointOne: { right: 54, top: 122 },
  lightPointTwo: { right: 118, top: 214, width: 2, height: 2 },
  lightPointThree: { left: 68, top: 276, opacity: 0.34 },
  lightPointFour: { right: 36, top: 402, opacity: 0.28 },
  lightPointFive: { left: 42, bottom: 174, width: 2, height: 2 },
});

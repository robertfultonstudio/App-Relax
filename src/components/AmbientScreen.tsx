import type { PropsWithChildren, ReactNode, RefObject } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/design/theme";

interface AmbientScreenProps extends PropsWithChildren {
  footer?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
}

export function AmbientScreen({
  children,
  footer,
  scrollRef,
  scrollProps,
}: AmbientScreenProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#172324", colors.background, "#0C1117"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.orb, styles.orbTop]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbBottom]} />
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
  orb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.11,
  },
  orbTop: {
    backgroundColor: colors.moss,
    right: -140,
    top: -60,
  },
  orbBottom: {
    backgroundColor: colors.dusk,
    left: -170,
    bottom: 40,
  },
});

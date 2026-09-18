import type { PropsWithChildren, ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { editorial } from "@/design/editorialTheme";

interface EditorialScreenProps extends PropsWithChildren {
  backgroundArtwork?: ImageSourcePropType;
  backgroundArtworkTestID?: string;
  footer?: ReactNode;
  tone?: "paper" | "sky";
  painted?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
}

export function EditorialScreen({
  backgroundArtwork,
  backgroundArtworkTestID,
  children,
  footer,
  tone = "paper",
  painted = false,
  contentStyle,
  scrollEnabled = true,
}: EditorialScreenProps) {
  const gradient = backgroundArtwork
    ? ([
        "rgba(248, 242, 232, 0.01)",
        "rgba(242, 233, 218, 0.08)",
        "rgba(231, 217, 197, 0.38)",
      ] as const)
    : tone === "sky"
      ? (["#EEE7E3", editorial.paper, "#E8E0D3"] as const)
      : ([editorial.paperLight, editorial.paper, editorial.paperDeep] as const);

  return (
    <View style={styles.root}>
      {backgroundArtwork && !painted ? (
        <Image
          accessibilityElementsHidden
          accessibilityIgnoresInvertColors
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          resizeMode="cover"
          source={backgroundArtwork}
          style={[styles.backgroundArtwork, painted && styles.paintedArtwork]}
          testID={backgroundArtworkTestID}
        />
      ) : null}
      {!painted && (
        <LinearGradient
          colors={gradient}
          locations={[0, 0.64, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {!painted && <View pointerEvents="none" style={styles.marginRule} />}
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            painted && styles.paintedContent,
            contentStyle,
          ]}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
        >
          {backgroundArtwork && painted ? (
            <Image
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              resizeMode="cover"
              source={backgroundArtwork}
              style={[styles.backgroundArtwork, styles.paintedArtwork]}
              testID={backgroundArtworkTestID}
            />
          ) : null}
          {children}
        </ScrollView>
        {footer}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: editorial.paper },
  paintedArtwork: {
    height: 844,
    bottom: undefined,
    maxWidth: 430,
    alignSelf: "center",
    left: undefined,
    right: undefined,
  },
  paintedContent: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingBottom: 20,
  },
  backgroundArtwork: {
    position: "absolute",
    bottom: 0,
    height: "100%",
    left: 0,
    right: 0,
    top: 0,
    width: "100%",
  },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 56,
  },
  marginRule: {
    position: "absolute",
    bottom: 0,
    left: 15,
    top: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(118, 93, 43, 0.16)",
  },
});

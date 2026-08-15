import type { PropsWithChildren, ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import type { ImageSourcePropType } from "react-native";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { editorial } from "@/design/editorialTheme";

interface EditorialScreenProps extends PropsWithChildren {
  backgroundArtwork?: ImageSourcePropType;
  backgroundArtworkTestID?: string;
  footer?: ReactNode;
  tone?: "paper" | "sky";
}

export function EditorialScreen({
  backgroundArtwork,
  backgroundArtworkTestID,
  children,
  footer,
  tone = "paper",
}: EditorialScreenProps) {
  const gradient = backgroundArtwork
    ? ([
        "rgba(248, 242, 232, 0.02)",
        "rgba(242, 233, 218, 0.12)",
        "rgba(231, 217, 197, 0.56)",
      ] as const)
    : tone === "sky"
      ? (["#EEE7E3", editorial.paper, "#E8E0D3"] as const)
      : ([editorial.paperLight, editorial.paper, editorial.paperDeep] as const);

  return (
    <View style={styles.root}>
      {backgroundArtwork ? (
        <Image
          accessibilityElementsHidden
          accessibilityIgnoresInvertColors
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          resizeMode="cover"
          source={backgroundArtwork}
          style={styles.backgroundArtwork}
          testID={backgroundArtworkTestID}
        />
      ) : null}
      <LinearGradient
        colors={gradient}
        locations={[0, 0.64, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.marginRule} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
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
  root: { flex: 1, backgroundColor: editorial.paper },
  backgroundArtwork: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 72,
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

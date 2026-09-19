import { Image, type ImageSourcePropType, StyleSheet } from "react-native";

export function FullBleedArtwork({
  source,
  testID,
}: {
  source: ImageSourcePropType;
  testID: string;
}) {
  return (
    <Image
      accessible={false}
      accessibilityElementsHidden
      accessibilityIgnoresInvertColors
      importantForAccessibility="no-hide-descendants"
      resizeMode="cover"
      source={source}
      style={styles.artwork}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  artwork: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%",
  },
});

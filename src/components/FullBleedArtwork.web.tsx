import { Asset } from "expo-asset";
import type { ImageSourcePropType } from "react-native";

export function FullBleedArtwork({
  source,
  testID,
}: {
  source: ImageSourcePropType;
  testID: string;
}) {
  const uri = Asset.fromModule(
    source as number | string | { uri: string; width: number; height: number },
  ).uri;

  return (
    <img
      alt=""
      aria-hidden="true"
      data-testid={testID}
      draggable={false}
      src={uri}
      style={{
        display: "block",
        height: "100%",
        inset: 0,
        objectFit: "cover",
        objectPosition: "center",
        pointerEvents: "none",
        position: "absolute",
        userSelect: "none",
        width: "100%",
      }}
    />
  );
}

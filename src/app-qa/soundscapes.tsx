import { type Href, useRouter } from "expo-router";
import SoundscapesScreen from "../app/soundscapes";

export default function QaSoundscapesScreen() {
  const router = useRouter();
  return (
    <SoundscapesScreen
      onUnclassifiedWorkSelect={(workId) =>
        router.push(`/qa-workbench?workId=${workId}` as Href)
      }
    />
  );
}

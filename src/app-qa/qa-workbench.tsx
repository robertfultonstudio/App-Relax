import { useLocalSearchParams } from "expo-router";
import AdaptiveQaWorkbench from "../qa/AdaptiveQaWorkbench";

export default function QaWorkbenchRoute() {
  const { workId } = useLocalSearchParams<{ workId?: string }>();
  return (
    <AdaptiveQaWorkbench
      key={workId ?? "default"}
      initialSingleWorkId={workId}
    />
  );
}

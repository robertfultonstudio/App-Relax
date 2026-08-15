import type { ImageSourcePropType } from "react-native";
import type { ConsumerOutcomeId } from "@/content/productShell";

export const OUTCOME_ARTWORK: Readonly<
  Record<ConsumerOutcomeId, ImageSourcePropType>
> = {
  yoga: require("../../assets/images/outcomes/yoga.jpg"),
  massage: require("../../assets/images/outcomes/massage.jpg"),
  relax: require("../../assets/images/outcomes/relax.jpg"),
  meditation: require("../../assets/images/outcomes/meditation.jpg"),
  sleep: require("../../assets/images/outcomes/sleep.jpg"),
  focus: require("../../assets/images/outcomes/focus.jpg"),
};

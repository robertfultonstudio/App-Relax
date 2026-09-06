import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";

export { default } from "../../app/adaptive-session/[outcomeId]";

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}

import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";

export { default } from "../../app/outcome/[outcomeId]";

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}

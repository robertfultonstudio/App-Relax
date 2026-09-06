import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";

export { default } from "../../app/listen/[workId]";

export function generateStaticParams() {
  return getPwaWorkStaticParams();
}

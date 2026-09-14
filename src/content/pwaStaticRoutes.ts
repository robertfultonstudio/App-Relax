import { CONSUMER_AUDIO_WORKS } from "./consumerCatalog";
import { CONSUMER_OUTCOMES } from "./productShell";

export function getPwaOutcomeStaticParams(): { outcomeId: string }[] {
  return CONSUMER_OUTCOMES.map(({ id }) => ({ outcomeId: id }));
}

export function getPwaWorkStaticParams(): { workId: string }[] {
  return CONSUMER_AUDIO_WORKS.filter(
    (work) =>
      work.deliveryScope !== "local-only" &&
      (work.availability === "local-preview-file" ||
        work.availability === "generated-runtime"),
  ).map(({ id }) => ({ workId: id }));
}

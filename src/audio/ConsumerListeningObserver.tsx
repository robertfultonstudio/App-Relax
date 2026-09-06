import { useEffect } from "react";
import { useAudioSession } from "./AudioProvider";
import { createAdaptiveSessionHistoryStore } from "@/state/adaptiveSessionPersistence";
import { saveLastListening } from "@/state/lastListeningPersistence";

const history = createAdaptiveSessionHistoryStore();
/** Lives with the controller, not the player route: navigation cannot lose history. */
export function ConsumerListeningObserver() {
  const { controller } = useAudioSession();
  useEffect(() => {
    let lastRun = -1;
    let heard = new Set<string>();
    let chain = Promise.resolve();
    return controller.subscribe((snapshot) => {
      const selection = controller.getConsumerSelection();
      if (
        !selection ||
        (snapshot.status !== "playing" && snapshot.status !== "fadingOut")
      )
        return;
      const run = controller.getListeningRun();
      const newRun = run !== lastRun;
      if (newRun) {
        lastRun = run;
        heard = new Set();
      }
      if (selection.kind === "single") {
        if (newRun)
          chain = chain
            .then(() =>
              saveLastListening({
                kind: "single",
                workId: selection.program.work.id,
                outcome: selection.outcome,
                durationMinutes:
                  snapshot.selectedDurationMinutes as typeof selection.durationMinutes,
              }),
            )
            .catch(() => undefined);
        return;
      }
      const elapsed =
        selection.program.plan.totalDurationSeconds -
        snapshot.remainingMs / 1000;
      const ids = selection.program.plan.segments
        .filter(
          (segment) =>
            (segment.lane ?? "primary") === "primary" &&
            elapsed >= segment.startSeconds &&
            elapsed < segment.endSeconds,
        )
        .map(({ workId }) => workId);
      const changed = ids.some((id) => !heard.has(id));
      ids.forEach((id) => heard.add(id));
      const heardIds = [...heard];
      if (newRun || changed)
        chain = chain
          .then(async () => {
            if (newRun)
              await saveLastListening({
                kind: "adaptive",
                request: selection.request,
              });
            await history.recordHeard(
              selection.request,
              selection.program.plan,
              heardIds,
            );
          })
          .catch(() => undefined);
    });
  }, [controller]);
  return null;
}

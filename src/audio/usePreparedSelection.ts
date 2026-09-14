import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAudioSession } from "./AudioProvider";
import type { ConsumerSelection } from "@/domain/audio/consumerSelection";

/** No route effect loads the active driver: candidates stay silent until Start. */
export function usePreparedSelection(
  selection: ConsumerSelection | null,
  enabled = true,
) {
  const { controller } = useAudioSession();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    selection: ConsumerSelection | null;
    ready: boolean;
    error: string | null;
  }>({ selection: null, ready: false, error: null });
  useFocusEffect(
    useCallback(() => {
      // This retry nonce intentionally restarts preparation on the focused route.
      void attempt;
      if (!selection || !enabled) return;
      let live = true;
      setState({ selection, ready: false, error: null });
      void controller
        .prepareSelection(selection)
        .then(() => {
          if (live) setState({ selection, ready: true, error: null });
        })
        .catch((error: unknown) => {
          if (live)
            setState({
              selection,
              ready: false,
              error:
                error instanceof Error
                  ? error.message
                  : "The sound could not load. Retry when connected.",
            });
        });
      return () => {
        live = false;
        controller.cancelPreparedSelection(selection);
      };
    }, [controller, selection, enabled, attempt]),
  );
  return {
    ready: enabled && state.selection === selection && state.ready,
    error: state.selection === selection ? state.error : null,
    retry: () => {
      setState({ selection: null, ready: false, error: null });
      setAttempt((value) => value + 1);
    },
  };
}

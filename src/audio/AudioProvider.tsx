import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { AudioSessionController } from "./AudioSessionController";
import { ReactNativeAudioDriver } from "./reactNativeAudioApi/ReactNativeAudioDriver";
import { createPlayerPreferencesStore } from "@/state/playerPersistence";

const AudioControllerContext = createContext<AudioSessionController | null>(
  null,
);

export function AudioProvider({ children }: PropsWithChildren) {
  const [controller] = useState(
    () =>
      new AudioSessionController(
        new ReactNativeAudioDriver(),
        createPlayerPreferencesStore(),
      ),
  );

  useEffect(() => {
    controller.activate();
    void controller.hydrate();
    return () => {
      void controller.dispose();
    };
  }, [controller]);

  return (
    <AudioControllerContext.Provider value={controller}>
      {children}
    </AudioControllerContext.Provider>
  );
}

export function useAudioSession() {
  const controller = useContext(AudioControllerContext);
  if (!controller) {
    throw new Error("useAudioSession must be used inside AudioProvider.");
  }
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return { controller, snapshot };
}

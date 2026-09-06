import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { AudioGraphDriver } from "./AudioGraphDriver";
import { AudioSessionController } from "./AudioSessionController";
import { createPlayerPreferencesStore } from "@/state/playerPersistence";
import { createConsumerPlayerPreferencesStore } from "@/state/consumerPlayerPersistence";
import { ConsumerListeningObserver } from "./ConsumerListeningObserver";

const AudioControllerContext = createContext<AudioSessionController | null>(
  null,
);

export function AudioProvider({
  children,
  createDriver,
}: PropsWithChildren<{ createDriver: () => AudioGraphDriver }>) {
  const [controller] = useState(
    () =>
      new AudioSessionController(
        createDriver(),
        createPlayerPreferencesStore(),
        undefined,
        createConsumerPlayerPreferencesStore(),
        createDriver,
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
      <ConsumerListeningObserver />
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

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

export type PwaViewMode = "workbench" | "consumer-preview";

type PwaViewContextValue = {
  viewMode: PwaViewMode;
  technicalBusy: boolean;
  setTechnicalBusy: (busy: boolean) => void;
  showConsumerPreview: () => void;
  showWorkbench: () => void;
};

const PwaViewContext = createContext<PwaViewContextValue | null>(null);

/** PWA_DUAL_VIEW_SENTINEL — this provider must never enter consumer exports. */
export function PwaViewProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { review } = useGlobalSearchParams<{ review?: string }>();
  const [viewMode, setViewMode] = useState<PwaViewMode>(() =>
    review === "0" ? "consumer-preview" : "workbench",
  );
  const [technicalBusy, setTechnicalBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const lastExplicitReview = useRef(
    review === "0" || review === "1" ? review : null,
  );

  useEffect(() => {
    const normalized = review === "0" ? "0" : "1";
    if (lastExplicitReview.current === normalized) return;
    lastExplicitReview.current = normalized;
    setViewMode(normalized === "0" ? "consumer-preview" : "workbench");
  }, [review]);

  const focus = useCallback((selector: string) => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }, []);

  const changeView = useCallback(
    (next: PwaViewMode) => {
      if (next === viewMode || technicalBusy) return;
      setViewMode(next);
      const nextReview = next === "consumer-preview" ? "0" : "1";
      lastExplicitReview.current = nextReview;
      router.setParams({ review: nextReview });
      if (next === "consumer-preview") {
        setAnnouncement("Anteprima utente attiva");
        focus('[data-testid="consumer-screen-title"], [role="heading"]');
      } else {
        setAnnouncement("Workbench sviluppatore attivo");
        focus('[data-testid="workbench-title"]');
      }
    },
    [focus, router, technicalBusy, viewMode],
  );

  const value = useMemo<PwaViewContextValue>(
    () => ({
      viewMode,
      technicalBusy,
      setTechnicalBusy,
      showConsumerPreview: () => changeView("consumer-preview"),
      showWorkbench: () => changeView("workbench"),
    }),
    [changeView, technicalBusy, viewMode],
  );

  return (
    <PwaViewContext.Provider value={value}>
      <View style={styles.root} testID="pwa-dual-view-root">
        {children}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        aria-live="polite"
        style={styles.srOnly}
        testID="pwa-view-announcement"
      >
        {announcement}
      </Text>
    </PwaViewContext.Provider>
  );
}

export function usePwaView() {
  const context = useContext(PwaViewContext);
  if (!context)
    throw new Error("usePwaView must be used inside PwaViewProvider.");
  return context;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
});

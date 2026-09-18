import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { View } from "react-native";
import {
  PlaybackTransport,
  type PlaybackTransportProps,
} from "@/components/PlaybackTransport";
import { editorial } from "@/design/editorialTheme";

const FALLBACK_NAV_HEIGHT = 58;
const FALLBACK_DOCK_HEIGHT = 125;

export function PwaConsumerTransportDock(props: PlaybackTransportProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(FALLBACK_NAV_HEIGHT);
  const [dockHeight, setDockHeight] = useState(FALLBACK_DOCK_HEIGHT);

  useEffect(() => {
    const navigation = document.querySelector<HTMLElement>(
      '[data-testid="pwa-bottom-navigation"]',
    );
    const measure = () => {
      if (navigation) setNavHeight(navigation.getBoundingClientRect().height);
      if (dockRef.current)
        setDockHeight(dockRef.current.getBoundingClientRect().height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (navigation) observer.observe(navigation);
    if (dockRef.current) observer.observe(dockRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const dock = (
    <div
      aria-label="Listening transport"
      data-testid="consumer-transport-dock"
      ref={dockRef}
      style={{
        position: "fixed",
        bottom: navHeight,
        left: 0,
        right: 0,
        zIndex: 35,
        background: editorial.paperDeep,
        borderTop: `1px solid ${editorial.lineStrong}`,
        padding: "8px 18px",
      }}
    >
      <PlaybackTransport {...props} />
    </div>
  );

  return (
    <>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ height: dockHeight, flexShrink: 0 }}
        testID="consumer-transport-spacer"
      />
      {typeof document !== "undefined" && document.body?.nodeType === 1
        ? createPortal(dock, document.body)
        : dock}
    </>
  );
}

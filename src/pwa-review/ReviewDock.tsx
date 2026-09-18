import { Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { PwaReviewScrubber } from "./PwaReviewScrubber";

/** PWA-only shelf attached visually to the existing persistent playback footer. */
export function ReviewDock({
  position,
  duration,
  enabled,
  playing,
  readPosition,
  onSeek,
  actions,
  status,
}: {
  position: number;
  duration: number;
  enabled: boolean;
  playing: boolean;
  readPosition?: () => number | null;
  onSeek: (seconds: number) => void | Promise<void>;
  actions: {
    label: string;
    short: string;
    disabled?: boolean;
    active?: boolean;
    run: () => void;
  }[];
  status: string;
}) {
  const [footerHeight, setFooterHeight] = useState(72);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const footer = document.querySelector(
      '[data-testid="fixed-player-controls"]',
    );
    if (!footer) return;
    const measure = () =>
      setFooterHeight(footer.getBoundingClientRect().height);
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(footer);
    return () => observer?.disconnect();
  }, []);
  const dock = (
    <div
      data-testid="review-dock"
      aria-label="Development transport"
      style={{
        position: "fixed",
        bottom: footerHeight,
        left: 0,
        right: 0,
        zIndex: 40,
        background: editorial.paperLight,
        borderTop: `1px solid ${editorial.line}`,
        padding: "8px 18px 0",
        boxShadow: "0 -4px 16px rgba(26,39,35,0.06)",
      }}
    >
      <Text
        accessibilityLiveRegion="polite"
        numberOfLines={1}
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 12,
          color: editorial.ink,
        }}
      >
        {status}
      </Text>
      <PwaReviewScrubber
        duration={duration}
        position={position}
        disabled={!enabled}
        playing={playing}
        readPosition={readPosition}
        onSeek={onSeek}
        label="Review transport position"
        positionLabel="Position"
      />
      <View style={{ flexDirection: "row", gap: 4 }}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{
              disabled: !enabled || action.disabled,
              selected: action.active,
            }}
            disabled={!enabled || action.disabled}
            onPress={action.run}
            style={{
              flex: 1,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              borderBottomWidth: action.active ? 2 : 0,
              borderColor: editorial.ink,
              opacity: !enabled || action.disabled ? 0.4 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: 14,
                color: editorial.ink,
                textAlign: "center",
              }}
            >
              {action.short}
            </Text>
          </Pressable>
        ))}
      </View>
    </div>
  );
  // A transformed Router/ScrollView ancestor can make fixed positioning local
  // to the scroller. Portal only this PWA shelf to the real viewport instead.
  return typeof document !== "undefined" && document.body?.nodeType === 1
    ? createPortal(dock, document.body)
    : dock;
}

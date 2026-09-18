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
  canPlay,
  canStop,
  onPlayPause,
  onStop,
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
  canPlay: boolean;
  canStop: boolean;
  onPlayPause: () => void;
  onStop: () => void;
}) {
  const [footerHeight, setFooterHeight] = useState(58);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const footer = document.querySelector(
      '[data-testid="pwa-bottom-navigation"]',
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
        padding: "8px 12px 6px",
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
        {actions.slice(0, 1).map((action) => (
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
        <DockButton
          label={playing ? "Pause review" : "Play review"}
          short={playing ? "Pause" : "Play"}
          disabled={!canPlay}
          onPress={onPlayPause}
          dominant
        />
        <DockButton
          label="Stop review"
          short="Stop"
          disabled={!canStop}
          onPress={onStop}
        />
        {actions.slice(1, 2).map((action) => (
          <DockButton
            key={action.label}
            label={action.label}
            short={action.short}
            disabled={!enabled || action.disabled}
            active={action.active}
            onPress={action.run}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {actions.slice(2).map((action) => (
          <DockButton
            key={action.label}
            label={action.label}
            short={action.short}
            disabled={!enabled || action.disabled}
            active={action.active}
            onPress={action.run}
          />
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

function DockButton({
  label,
  short,
  disabled = false,
  active = false,
  dominant = false,
  onPress,
}: {
  label: string;
  short: string;
  disabled?: boolean;
  active?: boolean;
  dominant?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: dominant ? 1.25 : 1,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
        borderTopWidth: active || dominant ? 2 : 0,
        borderColor: active ? editorial.jade : editorial.lavender,
        opacity: disabled ? 0.48 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 13,
          color: editorial.ink,
          textAlign: "center",
        }}
      >
        {short}
      </Text>
    </Pressable>
  );
}

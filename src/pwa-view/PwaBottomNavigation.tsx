import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { usePwaView } from "./PwaViewProvider";

const destinations = [
  { id: "home", label: "Home", route: "/moments" },
  { id: "hatha", label: "Hatha", route: "/yoga" },
  { id: "settings", label: "Settings", route: "/settings" },
] as const;
export const PWA_HOME_LONG_PRESS_MS = 1200;
export const PWA_HOME_MOVE_TOLERANCE_PX = 10;

export function exceedsHomeLongPressTolerance(
  start: { x: number; y: number },
  current: { x: number; y: number },
) {
  return (
    Math.hypot(current.x - start.x, current.y - start.y) >
    PWA_HOME_MOVE_TOLERANCE_PX
  );
}

export function isWorkbenchKeyboardShortcut(event: {
  altKey?: boolean;
  shiftKey?: boolean;
  key?: string;
  repeat?: boolean;
}) {
  return Boolean(
    event.altKey && event.shiftKey && event.key === "Enter" && !event.repeat,
  );
}

export function PwaBottomNavigation() {
  const path = usePathname();
  const router = useRouter();
  const { viewMode, showWorkbench } = usePwaView();
  const suppressNextPress = useRef(false);
  const gestureCancelled = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const homeLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useMemo(() => {
    if (path === "/settings") return "settings";
    if (
      path === "/yoga" ||
      path === "/outcome/yoga" ||
      path === "/adaptive-session/yoga"
    )
      return "hatha";
    return "home";
  }, [path]);

  const cancelHomeGesture = useCallback(() => {
    if (homeLongPressTimer.current !== null) {
      clearTimeout(homeLongPressTimer.current);
      homeLongPressTimer.current = null;
    }
    gestureCancelled.current = true;
    startPoint.current = null;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const openFromKeyboard = (event: KeyboardEvent) => {
      if (!isWorkbenchKeyboardShortcut(event)) return;
      event.preventDefault();
      showWorkbench();
    };
    window.addEventListener("keydown", openFromKeyboard, true);
    window.addEventListener("scroll", cancelHomeGesture, true);
    return () => {
      window.removeEventListener("keydown", openFromKeyboard, true);
      window.removeEventListener("scroll", cancelHomeGesture, true);
      cancelHomeGesture();
    };
  }, [cancelHomeGesture, showWorkbench]);

  const keyboardProps =
    Platform.OS === "web"
      ? ({
          onKeyDown: (event: {
            altKey?: boolean;
            shiftKey?: boolean;
            key?: string;
            repeat?: boolean;
            preventDefault?: () => void;
          }) => {
            if (isWorkbenchKeyboardShortcut(event)) {
              event.preventDefault?.();
              showWorkbench();
            }
          },
          onContextMenu: (event: { preventDefault?: () => void }) => {
            if (viewMode === "consumer-preview") event.preventDefault?.();
          },
          onPointerDownCapture: (event: {
            isPrimary?: boolean;
            clientX?: number;
            clientY?: number;
          }) => {
            if (event.isPrimary === false) {
              cancelHomeGesture();
              return;
            }
            cancelHomeGesture();
            gestureCancelled.current = false;
            startPoint.current = {
              x: event.clientX ?? 0,
              y: event.clientY ?? 0,
            };
            if (viewMode === "consumer-preview") {
              homeLongPressTimer.current = setTimeout(() => {
                homeLongPressTimer.current = null;
                if (gestureCancelled.current) return;
                suppressNextPress.current = true;
                showWorkbench();
              }, PWA_HOME_LONG_PRESS_MS);
            }
          },
          onPointerMoveCapture: (event: {
            clientX?: number;
            clientY?: number;
          }) => {
            const start = startPoint.current;
            if (
              start &&
              exceedsHomeLongPressTolerance(start, {
                x: event.clientX ?? start.x,
                y: event.clientY ?? start.y,
              })
            )
              cancelHomeGesture();
          },
          onBlur: cancelHomeGesture,
          onPointerCancelCapture: cancelHomeGesture,
          onPointerUpCapture: () => {
            if (homeLongPressTimer.current !== null) {
              clearTimeout(homeLongPressTimer.current);
              homeLongPressTimer.current = null;
            }
            startPoint.current = null;
          },
        } as object)
      : {};

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View
        accessibilityLabel="Primary navigation"
        accessibilityRole="tablist"
        style={styles.bar}
        testID="pwa-bottom-navigation"
      >
        {destinations.map((destination) => {
          const selected = destination.id === active;
          const home = destination.id === "home";
          const webSelectionProps =
            Platform.OS === "web"
              ? ({
                  "aria-current": selected ? "page" : undefined,
                  "aria-selected": selected,
                  tabIndex: selected ? 0 : -1,
                } as object)
              : {};
          return (
            <Pressable
              {...(home ? keyboardProps : {})}
              {...webSelectionProps}
              accessibilityActions={
                home
                  ? [
                      {
                        name: "openWorkbench",
                        label: "Apri Workbench sviluppatore",
                      },
                    ]
                  : undefined
              }
              accessibilityLabel={destination.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              delayLongPress={PWA_HOME_LONG_PRESS_MS}
              hitSlop={4}
              key={destination.id}
              onAccessibilityAction={
                home
                  ? (event) => {
                      if (event.nativeEvent.actionName === "openWorkbench") {
                        showWorkbench();
                      }
                    }
                  : undefined
              }
              onLongPress={
                home && viewMode === "consumer-preview" && Platform.OS !== "web"
                  ? () => {
                      if (gestureCancelled.current) return;
                      suppressNextPress.current = true;
                      showWorkbench();
                    }
                  : undefined
              }
              onPress={() => {
                if (suppressNextPress.current) {
                  suppressNextPress.current = false;
                  return;
                }
                router.replace(destination.route as Href);
                if (
                  destination.id === "home" &&
                  typeof document !== "undefined"
                )
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                      const title = document.querySelector<HTMLElement>(
                        '[data-testid="consumer-screen-title"]',
                      );
                      title?.setAttribute("tabindex", "-1");
                      title?.focus({ preventScroll: true });
                    }),
                  );
              }}
              pressRetentionOffset={10}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
              testID={`pwa-tab-${destination.id}`}
            >
              <View
                accessible={false}
                style={styles.iconFrame}
                testID={`pwa-tab-icon-${destination.id}`}
              >
                {destination.id === "home" ? (
                  <View accessible={false} style={styles.house}>
                    <View
                      style={[
                        styles.houseRoof,
                        selected && styles.selectedBorder,
                      ]}
                    />
                    <View
                      style={[
                        styles.houseBody,
                        selected && styles.selectedBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.houseDoor,
                          selected && styles.selectedFill,
                        ]}
                      />
                    </View>
                  </View>
                ) : destination.id === "hatha" ? (
                  <View accessible={false} style={styles.hathaFigure}>
                    <View
                      style={[
                        styles.hathaHead,
                        selected && styles.selectedBorder,
                      ]}
                    />
                    <View
                      style={[
                        styles.hathaTorso,
                        selected && styles.selectedFill,
                      ]}
                    />
                    <View
                      style={[
                        styles.hathaArmLeft,
                        selected && styles.selectedFill,
                      ]}
                    />
                    <View
                      style={[
                        styles.hathaArmRight,
                        selected && styles.selectedFill,
                      ]}
                    />
                    <View
                      style={[
                        styles.hathaLegLeft,
                        selected && styles.selectedBorder,
                      ]}
                    />
                    <View
                      style={[
                        styles.hathaLegRight,
                        selected && styles.selectedBorder,
                      ]}
                    />
                  </View>
                ) : (
                  <View accessible={false} style={styles.settingsGear}>
                    <View
                      style={[
                        styles.gearToothVertical,
                        selected && styles.selectedFill,
                      ]}
                    />
                    <View
                      style={[
                        styles.gearToothHorizontal,
                        selected && styles.selectedFill,
                      ]}
                    />
                    <View
                      style={[
                        styles.gearRing,
                        selected && styles.selectedBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.gearCenter,
                          selected && styles.selectedFill,
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {destination.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "rgba(248,244,236,0.985)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.lineStrong,
  },
  bar: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderTopWidth: 2,
    borderTopColor: "transparent",
  },
  selected: {
    borderTopColor: editorial.jade,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  iconFrame: {
    width: 30,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  selectedBorder: { borderColor: editorial.jade },
  selectedFill: { backgroundColor: editorial.jade },
  house: { width: 23, height: 22, alignItems: "center" },
  houseRoof: {
    width: 14,
    height: 14,
    borderColor: editorial.ink,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  houseBody: {
    width: 17,
    height: 12,
    borderColor: editorial.ink,
    borderWidth: 2,
    borderTopWidth: 0,
    marginTop: -7,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  houseDoor: {
    width: 4,
    height: 6,
    backgroundColor: editorial.ink,
  },
  hathaFigure: {
    width: 27,
    height: 24,
    alignItems: "center",
    position: "relative",
  },
  hathaHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: editorial.ink,
  },
  hathaTorso: {
    position: "absolute",
    top: 8,
    width: 2,
    height: 8,
    backgroundColor: editorial.ink,
  },
  hathaArmLeft: {
    position: "absolute",
    top: 10,
    left: 7,
    width: 9,
    height: 2,
    backgroundColor: editorial.ink,
    transform: [{ rotate: "-25deg" }],
  },
  hathaArmRight: {
    position: "absolute",
    top: 10,
    right: 7,
    width: 9,
    height: 2,
    backgroundColor: editorial.ink,
    transform: [{ rotate: "25deg" }],
  },
  hathaLegLeft: {
    position: "absolute",
    bottom: 1,
    left: 3,
    width: 13,
    height: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: editorial.ink,
    borderBottomLeftRadius: 8,
    transform: [{ rotate: "-9deg" }],
  },
  hathaLegRight: {
    position: "absolute",
    bottom: 1,
    right: 3,
    width: 13,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: editorial.ink,
    borderBottomRightRadius: 8,
    transform: [{ rotate: "9deg" }],
  },
  settingsGear: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gearToothVertical: {
    position: "absolute",
    width: 6,
    height: 23,
    backgroundColor: editorial.ink,
    borderRadius: 1,
  },
  gearToothHorizontal: {
    position: "absolute",
    width: 23,
    height: 6,
    backgroundColor: editorial.ink,
    borderRadius: 1,
  },
  gearRing: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: editorial.ink,
    backgroundColor: "rgb(248,244,236)",
    alignItems: "center",
    justifyContent: "center",
  },
  gearCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: editorial.ink,
  },
  label: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  labelSelected: { color: editorial.jade },
});

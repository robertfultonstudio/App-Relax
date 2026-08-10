import { Platform } from "react-native";

export const colors = {
  background: "#0B1114",
  backgroundSoft: "#10191B",
  surface: "#162023",
  surfaceRaised: "#1C292B",
  surfaceLine: "rgba(240, 230, 211, 0.12)",
  text: "#F3E9D8",
  textMuted: "#AEBAB3",
  textFaint: "#71807A",
  moss: "#91B7A3",
  moon: "#D4B97C",
  dusk: "#9B8AAF",
  blue: "#8EA8C8",
  danger: "#D79283",
  black: "#050808",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const fonts = {
  sans: Platform.select({
    ios: "Avenir Next",
    android: "sans-serif",
    default: "System",
  }),
  serif: Platform.select({
    ios: "New York",
    android: "serif",
    default: "Georgia",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

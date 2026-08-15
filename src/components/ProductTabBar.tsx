import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRODUCT_TABS, type ProductTabId } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export function ProductTabBar({ activeTab }: { activeTab: ProductTabId }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View accessibilityLabel="Primary navigation" style={styles.bar}>
        {PRODUCT_TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => router.replace(tab.route as Href)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              testID={`product-tab-${tab.id}`}
            >
              <View
                accessibilityElementsHidden
                style={[styles.stroke, selected && styles.strokeSelected]}
              />
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {tab.label}
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
    backgroundColor: editorial.paperLight,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.lineStrong,
  },
  bar: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: spacing.sm,
    paddingTop: 3,
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  stroke: {
    width: 18,
    height: 1,
    backgroundColor: "transparent",
  },
  strokeSelected: { backgroundColor: editorial.gold },
  label: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  labelSelected: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
  },
  pressed: {
    backgroundColor: editorial.paperDeep,
    transform: [{ translateY: 1 }],
  },
});

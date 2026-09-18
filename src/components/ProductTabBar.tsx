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
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                pressed && styles.pressed,
              ]}
              testID={`product-tab-${tab.id}`}
            >
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
    borderTopWidth: 1,
    borderTopColor: "#81796D",
  },
  bar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 10,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#81796D",
    borderBottomWidth: 3,
    borderBottomColor: "#81796D",
  },
  tabSelected: {
    backgroundColor: "#D8E3DC",
    borderColor: "#405B54",
    borderBottomColor: "#405B54",
  },
  label: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    letterSpacing: 0,
    textTransform: "capitalize",
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

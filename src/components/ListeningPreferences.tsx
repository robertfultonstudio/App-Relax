import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

/** Deliberately secondary: Settings, then this disclosure, then the catalogue. */
export function ListeningPreferences() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.row}
      >
        <Text style={styles.title}>
          {open ? "Listening preferences −" : "Listening preferences +"}
        </Text>
      </Pressable>
      {open ? (
        <>
          <Text style={styles.body}>
            Your activity chooses the sound for you. Selecting a particular
            recording is optional.
          </Text>
          <Pressable
            accessibilityRole="link"
            style={styles.row}
            onPress={() => router.push("/soundscapes" as Href)}
          >
            <Text style={styles.body}>Choose a recording manually →</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.line,
  },
  row: { minHeight: 52, justifyContent: "center", paddingVertical: 12 },
  title: { color: editorial.ink, fontFamily: fonts.serif, fontSize: 21 },
  body: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
  },
});

import { useEffect, useState } from "react";
import { type Href, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { M6_PLAYER_PAINTING } from "@/design/shellArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import {
  completeWelcome,
  loadWelcomeCompleted,
} from "@/state/welcomePersistence";

/** First-run entrance only. Returning visitors are redirected before any
 * promotional copy is mounted, so the landing cannot flash on screen. */
export default function WelcomeScreen() {
  const router = useRouter();
  const [resolved, setResolved] = useState(false);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void loadWelcomeCompleted()
      .then((completed) => {
        if (!live) return;
        if (completed) router.replace("/moments" as Href);
        else setResolved(true);
      })
      .catch(() => {
        if (live) setResolved(true);
      });
    return () => {
      live = false;
    };
  }, [router]);

  function enter() {
    if (entering) return;
    setEntering(true);
    setError(null);
    void completeWelcome()
      .then(() => router.replace("/moments" as Href))
      .catch(() => {
        setEntering(false);
        setError("Non è stato possibile salvare l’ingresso. Riprova.");
      });
  }

  if (!resolved) {
    return (
      <View
        accessibilityLabel="Apertura App Relax"
        style={styles.guard}
        testID="welcome-entry-guard"
      />
    );
  }

  return (
    <View style={styles.screen} testID="welcome-screen">
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        source={M6_PLAYER_PAINTING}
        resizeMode="cover"
        style={styles.painting}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(247,241,228,0.3)",
          "rgba(247,241,228,0)",
          "rgba(247,241,228,0.96)",
        ]}
        locations={[0, 0.48, 0.92]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.masthead}>
            <Text style={styles.brand}>App Relax</Text>
            <Text style={styles.aside}>A little space for you</Text>
          </View>
          <View style={styles.openSpace} accessible={false} />
          <View style={styles.invitation}>
            <Text accessibilityRole="header" style={styles.title}>
              Make room{"\n"}for quiet.
            </Text>
            <Text style={styles.description}>
              Sound for the moment you need. Nothing to keep up with.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scegli il tuo momento"
              accessibilityHint="Apre le attività e l’esperienza di ascolto"
              accessibilityState={{ busy: entering, disabled: entering }}
              disabled={entering}
              onPress={enter}
              style={({ pressed }) => [styles.enter, pressed && styles.pressed]}
              testID="welcome-enter"
            >
              <Text style={styles.enterText}>
                {entering ? "Apertura…" : "Scegli il tuo momento"}
              </Text>
              <View accessible={false} style={styles.arrow}>
                <View style={styles.arrowHead} />
              </View>
            </Pressable>
            <Text style={styles.footnote}>
              Press Play. Leave the phone behind.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  guard: { flex: 1, backgroundColor: editorial.paper },
  screen: { flex: 1, backgroundColor: editorial.paper },
  painting: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%",
  },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 24,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  masthead: { gap: 8 },
  brand: { fontFamily: fonts.serif, color: editorial.ink, fontSize: 25 },
  aside: { fontFamily: fonts.sans, fontSize: 13, color: editorial.inkMuted },
  openSpace: { flex: 1, minHeight: 150 },
  invitation: { gap: 20 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: editorial.ink,
  },
  description: {
    maxWidth: 280,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: editorial.inkMuted,
  },
  enter: {
    minHeight: 56,
    alignSelf: "flex-start",
    paddingRight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 14,
  },
  pressed: { opacity: 0.72 },
  enterText: {
    fontFamily: fonts.sansSemiBold,
    color: editorial.ink,
    fontSize: 17,
    flexShrink: 1,
  },
  arrow: {
    width: 25,
    height: 1,
    backgroundColor: editorial.ink,
    marginRight: 2,
  },
  arrowHead: {
    position: "absolute",
    right: 0,
    top: -4,
    width: 9,
    height: 9,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: editorial.ink,
    transform: [{ rotate: "45deg" }],
  },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: editorial.inkMuted,
  },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
});

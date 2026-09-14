import {
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { Directory, File } from "expo-file-system";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getNativeCatalog } from "@/offline/nativeCatalogRuntime";
import { isNativeCatalogPreview } from "@/domain/sessions/playbackAvailability";
import { EditorialScreen } from "./EditorialScreen";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

export function NativeCatalogGate({ children }: PropsWithChildren) {
  return isNativeCatalogPreview() ? (
    <VerifiedGate>{children}</VerifiedGate>
  ) : (
    children
  );
}
function VerifiedGate({ children }: PropsWithChildren) {
  const store = getNativeCatalog();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const [pickerBusy, setPickerBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void store.initialize().catch(() => {});
  }, [store]);
  if (state.initialized && state.ready === state.total && !state.busy)
    return children;
  const importing = state.busy || pickerBusy;
  async function selectFolder() {
    if (importing) return;
    setPickerBusy(true);
    setError(null);
    try {
      await store.initialize();
      const directory = await Directory.pickDirectoryAsync();
      const entries = directory
        .list()
        .filter((entry): entry is File => entry instanceof File);
      await store.importSources(
        entries.map((file) => ({ filename: file.name, uri: file.uri })),
      );
    } catch (failure) {
      const message =
        failure instanceof Error
          ? failure.message
          : "Could not open this folder.";
      setError(
        /cancel/i.test(message)
          ? "No folder selected. Your verified recordings are kept."
          : message,
      );
    } finally {
      setPickerBusy(false);
    }
  }
  return (
    <EditorialScreen>
      <Text style={styles.eyebrow}>APP RELAX · ANDROID TEST</Text>
      <Text style={styles.title}>Bring your sounds with you.</Text>
      <Text style={styles.body}>
        One-time setup. Copy the supplied AppRelaxAudio folder to your phone,
        then select it below. Music, complete Hatha practices and natural sounds
        will play offline.
      </Text>
      <Text style={styles.body}>
        Keep this app open during the import. The original folder stays
        untouched. No account or subscription.
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {state.ready} / {state.total} recordings verified ·{" "}
        {(state.checkedBytes / 1e9).toFixed(2)} /{" "}
        {(state.totalBytes / 1e9).toFixed(2)} GB
      </Text>
      {state.busy ? (
        <Text style={styles.body}>
          Copying and checking audio… This first import can take several
          minutes. Playback will use the verified copy without repeating this
          full check.
        </Text>
      ) : null}
      {error || state.error ? (
        <Text accessibilityRole="alert" style={styles.body}>
          {error ?? state.error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Import audio folder"
        accessibilityState={{ disabled: importing }}
        disabled={importing}
        onPress={() => void selectFolder()}
        style={[styles.button, importing && styles.disabled]}
      >
        <Text style={styles.buttonText}>
          {importing
            ? "Preparing your sounds…"
            : state.ready
              ? "Continue audio import"
              : "Import audio folder"}
        </Text>
      </Pressable>
      {state.busy ? (
        <Pressable
          accessibilityRole="button"
          onPress={store.cancel}
          style={styles.secondary}
        >
          <Text style={styles.body}>Cancel after the current copy</Text>
        </Pressable>
      ) : null}
    </EditorialScreen>
  );
}
export function NativeCatalogInfo() {
  return isNativeCatalogPreview() ? <CatalogInfo /> : null;
}
function CatalogInfo() {
  const store = getNativeCatalog();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return (
    <View style={styles.secondary}>
      <Text style={styles.body}>
        Audio on this phone · {state.ready}/{state.total} imported recordings,
        plus built-in sounds. No connection needed after setup.
      </Text>
      <Text style={styles.body}>
        Internal test version. Guided voice is not recorded yet. Musical joins
        and background playback still need your device test.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  eyebrow: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    marginTop: 24,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 36,
    marginVertical: 20,
  },
  body: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  status: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    marginVertical: 20,
  },
  button: {
    minHeight: 60,
    backgroundColor: editorial.ink,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  buttonText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  secondary: { minHeight: 52, paddingVertical: 16 },
  disabled: { opacity: 0.55 },
});

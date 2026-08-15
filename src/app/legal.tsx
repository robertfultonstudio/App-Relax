import { StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { TopBar } from "@/components/TopBar";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function LegalScreen() {
  return (
    <AmbientScreen>
      <TopBar label="LEGAL" showBack />
      <Text accessibilityRole="header" style={styles.title}>
        A clear listening note.
      </Text>
      <Text style={styles.intro}>
        Ritual Audio is building consumer rituals, yoga journeys and soundscapes
        for personal atmosphere. Those sections contain no playable audio yet.
      </Text>

      <View style={styles.card}>
        <Section title="No health claims">
          The app does not diagnose, treat, cure or prevent any condition.
          Frequency, tuning, binaural and noise labels describe sound-design
          choices, not proven health outcomes.
        </Section>
        <Section title="Technical Audio Test">
          Moon Current, the 432 Hz tuning label and the three ATP01 WAV files
          belong only to engine validation. They are outside the consumer
          catalogue.
        </Section>
        <Section title="Listen safely" last>
          Keep volume comfortable. Do not use sound sessions when full attention
          is required, such as while driving or operating equipment.
        </Section>
      </View>

      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderTitle}>ANDROID EVIDENCE SO FAR</Text>
        <Text style={styles.placeholderText}>
          A previous APK was installed, opened and produced sound on a real
          Android phone. Bluetooth, background, lock screen, interruptions,
          battery, long listening and sound quality remain untested.
        </Text>
      </View>
      <Text style={styles.reviewNote}>
        Final privacy, terms and store copy remain subject to product and legal
        review before public release.
      </Text>
    </AmbientScreen>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.section, last && styles.lastSection]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
  },
  intro: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  section: {
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceLine,
  },
  lastSection: { borderBottomWidth: 0 },
  sectionTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 20 },
  sectionText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  placeholderBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(142, 168, 200, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(142, 168, 200, 0.28)",
  },
  placeholderTitle: {
    color: colors.blue,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  placeholderText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  reviewNote: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export default function LegalScreen() {
  return (
    <EditorialScreen>
      <EditorialHeader label="LEGAL" showBack />
      <Text accessibilityRole="header" style={styles.title}>
        A clear listening note.
      </Text>
      <Text style={styles.intro}>
        App Relax offers music and nature for personal listening. Keep the
        volume comfortable and stop whenever listening feels tiring.
      </Text>

      <View style={styles.sections}>
        <Section title="No health claims">
          The app does not diagnose, treat, cure or prevent any condition.
          Sound-design labels are not medical or scientific claims.
        </Section>
        <Section title="Listening availability">
          Check the availability shown for each sound. Listening without an
          internet connection requires the sound to be saved on this device.
        </Section>
        <Section title="Listen safely" last>
          Do not use sound sessions when full attention is required, such as
          while driving or operating equipment.
        </Section>
      </View>
      <Text style={styles.reviewNote}>
        This private preview is not a medical service. Privacy information and
        terms will be provided before a public release.
      </Text>
    </EditorialScreen>
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
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  sections: {
    borderTopColor: editorial.lineStrong,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
  },
  section: {
    borderBottomColor: editorial.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
  },
  lastSection: { borderBottomWidth: 0 },
  sectionTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 22,
  },
  sectionText: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  reviewNote: {
    color: editorial.inkFaint,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xl,
  },
});

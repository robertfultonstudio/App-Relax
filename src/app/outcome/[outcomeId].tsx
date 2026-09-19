import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import {
  ImmediateSessionSetup,
  type ListeningNatureFactory,
} from "@/components/ImmediateSessionSetup";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { C3_PLAYER_FULL_BLEED } from "@/design/shellArtwork";
import { FullBleedArtwork } from "@/components/FullBleedArtwork";
import {
  platformReviewProgramFactory,
  platformNatureProgramFactory,
} from "@/domain/sessions/platformSessionFactories";
import type {
  SessionDurationMinutes,
  CreateAdaptiveSessionInput,
  AdaptiveSessionProgram,
} from "@/domain/sessions/types";

type ReviewFactory = (
  input: CreateAdaptiveSessionInput,
) => AdaptiveSessionProgram;
export default function OutcomeSessionScreen({
  reviewProgramFactory = platformReviewProgramFactory,
  createNatureProgram = platformNatureProgramFactory,
  showDevelopmentLink = true,
  immersiveYoga = false,
}: {
  reviewProgramFactory?: ReviewFactory;
  createNatureProgram?: ListeningNatureFactory;
  showDevelopmentLink?: boolean;
  immersiveYoga?: boolean;
} = {}) {
  const { outcomeId, practice, nature } = useLocalSearchParams<{
    outcomeId: string;
    practice?: string;
    nature?: string;
  }>();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId);
  const completePractice = outcomeId === "yoga" && practice === "complete";
  if (outcome && immersiveYoga && !completePractice) {
    return (
      <ImmersiveOutcomeContent
        createNatureProgram={createNatureProgram}
        initialNature={nature === "rain" || nature === "sea" ? nature : null}
        outcomeId={outcome.id}
      />
    );
  }
  return outcome ? (
    <OutcomeContent
      key={outcome.id + ":" + completePractice}
      outcomeId={outcome.id}
      completePractice={completePractice}
      reviewProgramFactory={reviewProgramFactory}
      createNatureProgram={createNatureProgram}
      showDevelopmentLink={showDevelopmentLink}
    />
  ) : (
    <EditorialScreen>
      <EditorialHeader label="HOME" showBack />
      <Text accessibilityRole="alert">
        This session is unavailable. Choose another need from Home.
      </Text>
    </EditorialScreen>
  );
}

const IMMERSIVE_OUTCOME_COPY: Readonly<
  Record<ConsumerOutcomeId, { title: string; subtitle: string }>
> = {
  meditation: {
    title: "Ritorna al respiro.",
    subtitle: "Lascia spazio a ciò che c’è.",
  },
  yoga: {
    title: "Un respiro alla volta.",
    subtitle: "La natura ti renderà consapevole.",
  },
  massage: {
    title: "Lascia andare il peso.",
    subtitle: "Il suono prepara lo spazio.",
  },
  relax: {
    title: "Ora puoi rallentare.",
    subtitle: "Non c’è nulla da inseguire.",
  },
  sleep: {
    title: "La sera può cominciare.",
    subtitle: "Il resto può aspettare.",
  },
  focus: {
    title: "Una cosa alla volta.",
    subtitle: "Il rumore rimane fuori.",
  },
};

function ImmersiveOutcomeContent({
  createNatureProgram,
  initialNature,
  outcomeId,
}: {
  createNatureProgram?: ListeningNatureFactory;
  initialNature: "rain" | "sea" | null;
  outcomeId: ConsumerOutcomeId;
}) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const large = width >= 420 || height >= 900;
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId)!;
  const copy = IMMERSIVE_OUTCOME_COPY[outcomeId];
  return (
    <View
      style={styles.immersiveRoot}
      testID={`${outcomeId}-atmospheric-screen`}
    >
      <FullBleedArtwork
        source={
          outcomeId === "yoga"
            ? C3_PLAYER_FULL_BLEED
            : OUTCOME_ARTWORK[outcomeId]
        }
        testID={`${outcomeId}-full-bleed-artwork`}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(244,238,230,0.18)",
          "rgba(244,238,230,0.02)",
          "rgba(244,238,230,0.5)",
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.immersiveContent,
            large && styles.immersiveContentLarge,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel="Torna alla Home"
            accessibilityRole="button"
            onPress={() => router.replace("/moments" as Href)}
            style={({ pressed }) => [
              styles.immersiveBack,
              pressed && styles.immersivePressed,
            ]}
          >
            <Text accessible={false} style={styles.immersiveBackText}>
              ‹
            </Text>
          </Pressable>
          <Text
            style={[
              styles.immersiveEyebrow,
              large && styles.immersiveEyebrowLarge,
            ]}
          >
            {outcome.functionLabel}
          </Text>
          <Text
            accessibilityRole="header"
            nativeID="consumer-screen-title"
            style={[styles.immersiveTitle, large && styles.immersiveTitleLarge]}
            testID="consumer-screen-title"
          >
            {copy.title}
          </Text>
          <Text style={styles.immersiveSubtitle}>{copy.subtitle}</Text>
          <View style={styles.immersiveSpacer} />
          <ImmediateSessionSetup
            atmospheric
            createNatureProgram={createNatureProgram}
            initialNature={initialNature}
            outcome={outcomeId}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
function OutcomeContent({
  outcomeId,
  completePractice,
  reviewProgramFactory,
  createNatureProgram,
  showDevelopmentLink,
}: {
  outcomeId: ConsumerOutcomeId;
  completePractice: boolean;
  reviewProgramFactory?: ReviewFactory;
  createNatureProgram?: ListeningNatureFactory;
  showDevelopmentLink: boolean;
}) {
  const router = useRouter();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId)!;
  const [duration, setDuration] = useState<SessionDurationMinutes>(30);
  return (
    <EditorialScreen>
      <EditorialHeader label={outcome.functionLabel} showBack />
      <Image
        accessible={false}
        resizeMode="cover"
        source={OUTCOME_ARTWORK[outcome.id]}
        style={styles.artwork}
      />
      <Text
        accessibilityRole="header"
        nativeID="consumer-screen-title"
        style={styles.title}
        testID="consumer-screen-title"
      >
        {completePractice ? "Your complete Hatha practice" : outcome.cta}
      </Text>
      {completePractice ? (
        <>
          <Text style={styles.note}>
            A complete musical journey for your practice. No spoken guidance.
          </Text>
          <AdaptiveSessionSetup
            outcome="yoga"
            duration={duration}
            onDurationChange={setDuration}
            reviewProgramFactory={reviewProgramFactory}
            completePractice
            showDevelopmentLink={showDevelopmentLink}
          />
        </>
      ) : (
        <ImmediateSessionSetup
          outcome={outcomeId}
          createNatureProgram={createNatureProgram}
        />
      )}
      {outcomeId === "yoga" ? (
        <Pressable
          accessibilityRole="link"
          style={styles.secondary}
          onPress={() =>
            router.push(
              (completePractice
                ? "/outcome/yoga"
                : "/outcome/yoga?practice=complete") as Href,
            )
          }
        >
          <Text style={styles.note}>
            {completePractice
              ? "Simple yoga listening →"
              : "Complete Hatha practice →"}
          </Text>
        </Pressable>
      ) : null}
    </EditorialScreen>
  );
}
const styles = StyleSheet.create({
  immersiveRoot: {
    backgroundColor: "#F4EEE6",
    flex: 1,
    overflow: "hidden",
  },
  safeArea: { flex: 1 },
  immersiveContent: {
    flexGrow: 1,
    paddingBottom: 88,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  immersiveContentLarge: { paddingHorizontal: 28, paddingTop: 8 },
  immersiveBack: {
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 48,
    width: 48,
  },
  immersiveBackText: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
  },
  immersiveEyebrow: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
    marginTop: 40,
  },
  immersiveEyebrowLarge: { marginTop: 48 },
  immersiveTitle: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 40,
    letterSpacing: -1.1,
    lineHeight: 44,
    marginTop: 14,
    maxWidth: 320,
  },
  immersiveTitleLarge: {
    fontSize: 44,
    lineHeight: 48,
    marginTop: 16,
    maxWidth: 360,
  },
  immersiveSubtitle: {
    color: "#29353B",
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 280,
  },
  immersiveSpacer: { flex: 1, minHeight: 300 },
  immersivePressed: { backgroundColor: "rgba(32,56,77,0.06)" },
  artwork: { height: 216, width: "100%" },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 14,
    marginBottom: 8,
  },
  note: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  secondary: {
    minHeight: 52,
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.line,
    marginTop: 32,
  },
});

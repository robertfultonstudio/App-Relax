import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
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
}: {
  reviewProgramFactory?: ReviewFactory;
  createNatureProgram?: ListeningNatureFactory;
} = {}) {
  const { outcomeId, practice } = useLocalSearchParams<{
    outcomeId: string;
    practice?: string;
  }>();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId);
  const completePractice = outcomeId === "yoga" && practice === "complete";
  return outcome ? (
    <OutcomeContent
      key={outcome.id + ":" + completePractice}
      outcomeId={outcome.id}
      completePractice={completePractice}
      reviewProgramFactory={reviewProgramFactory}
      createNatureProgram={createNatureProgram}
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
function OutcomeContent({
  outcomeId,
  completePractice,
  reviewProgramFactory,
  createNatureProgram,
}: {
  outcomeId: ConsumerOutcomeId;
  completePractice: boolean;
  reviewProgramFactory?: ReviewFactory;
  createNatureProgram?: ListeningNatureFactory;
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
      <Text accessibilityRole="header" style={styles.title}>
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
  artwork: { height: 154, width: "100%" },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 22,
    marginBottom: 12,
  },
  note: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
  },
  secondary: {
    minHeight: 52,
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: editorial.line,
    marginTop: 32,
  },
});

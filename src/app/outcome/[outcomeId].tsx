import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";
import { getWorksForOutcome, isPlayableWork } from "@/content/consumerCatalog";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import type { SessionDurationMinutes } from "@/domain/sessions/types";

export default function OutcomeSessionScreen() {
  const { outcomeId } = useLocalSearchParams<{ outcomeId: string }>();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId);
  return outcome ? (
    <OutcomeContent key={outcome.id} outcomeId={outcome.id} />
  ) : (
    <EditorialScreen>
      <EditorialHeader label="HOME" showBack />
      <Text accessibilityRole="alert">
        This session is unavailable. Choose another need from Home.
      </Text>
    </EditorialScreen>
  );
}
function OutcomeContent({ outcomeId }: { outcomeId: ConsumerOutcomeId }) {
  const router = useRouter();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId)!;
  const [duration, setDuration] = useState<SessionDurationMinutes>(
    getSessionPolicy(outcomeId).defaultDuration,
  );
  const [all, setAll] = useState(false);
  const works = getWorksForOutcome(outcomeId).filter(isPlayableWork);
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
        {outcome.cta}
      </Text>
      <AdaptiveSessionSetup
        outcome={outcomeId}
        duration={duration}
        onDurationChange={setDuration}
      />
      <View
        style={styles.library}
        accessibilityLabel={`${outcome.functionLabel} sound library`}
        testID="outcome-sound-library"
      >
        <Text accessibilityRole="header" style={styles.subtitle}>
          Or choose one sound
        </Text>
        {(all ? works : works.slice(0, 2)).map((work) => (
          <Pressable
            key={work.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${work.title}, ${duration} minutes for ${outcomeId}`}
            onPress={() =>
              router.push(
                `/listen/${work.id}?outcome=${outcomeId}&duration=${duration}` as Href,
              )
            }
            style={styles.work}
            testID={`consumer-work-${work.id}`}
          >
            <Text style={styles.workTitle}>{work.title}</Text>
            <Text style={styles.body}>{duration} min →</Text>
          </Pressable>
        ))}
        {works.length > 2 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: all }}
            onPress={() => setAll(!all)}
            style={styles.work}
          >
            <Text style={styles.body}>
              {all ? "Show fewer sounds" : `View all ${works.length} sounds`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </EditorialScreen>
  );
}
const styles = StyleSheet.create({
  artwork: { height: 108, width: "100%" },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    marginTop: 14,
  },
  library: {
    borderTopWidth: 1,
    borderColor: editorial.line,
    marginTop: 18,
    paddingTop: 14,
  },
  subtitle: { color: editorial.ink, fontFamily: fonts.serif, fontSize: 25 },
  work: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    borderBottomWidth: 1,
    borderColor: editorial.line,
    paddingVertical: 10,
  },
  workTitle: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    flexShrink: 1,
  },
  body: { color: editorial.inkMuted, fontFamily: fonts.sans, fontSize: 14 },
});

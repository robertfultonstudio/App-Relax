import { useCallback, useMemo, useRef, useState } from "react";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { usePreparedSelection } from "@/audio/usePreparedSelection";
import { getConsumerWork, isPlayableWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  consumerSelectionUrl,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import {
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  recentWorkIdsForSession,
} from "@/state/adaptiveSessionPersistence";
import {
  loadLastListening,
  type LastListening,
} from "@/state/lastListeningPersistence";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import type {
  CreateAdaptiveSessionInput,
  AdaptiveSessionProgram,
} from "@/domain/sessions/types";

export function LastListeningAction({
  reviewProgramFactory,
}: {
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
} = {}) {
  const router = useRouter();
  const { controller } = useAudioSession();
  const [saved, setSaved] = useState<{
    listening: LastListening;
    recent: string[];
    nonce: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pending = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void Promise.all([
        loadLastListening(),
        createAdaptiveSessionHistoryStore().load(),
      ])
        .then(([listening, history]) => {
          if (live)
            setSaved(
              listening
                ? {
                    listening,
                    recent:
                      listening.kind === "adaptive"
                        ? recentWorkIdsForSession(
                            history,
                            listening.request.outcome,
                            listening.request.soundKind,
                          )
                        : [],
                    nonce: Date.now(),
                  }
                : null,
            );
        })
        .catch(() => {
          if (live) setSaved(null);
        });
      return () => {
        live = false;
      };
    }, []),
  );
  const selection = useMemo<ConsumerSelection | null>(() => {
    if (!saved) return null;
    const last = saved.listening;
    if (last.kind === "single") {
      const work = getConsumerWork(last.workId);
      return work && isPlayableWork(work)
        ? {
            kind: "single",
            program: createSingleTrackProgram(work, last.outcome),
            outcome: last.outcome,
            durationMinutes: last.durationMinutes,
          }
        : null;
    }
    try {
      return {
        kind: "adaptive",
        request: last.request,
        program: (reviewProgramFactory ?? createAdaptiveSessionProgram)({
          ...last.request,
          seed: createConsumerSessionSeed(last.request, saved.nonce),
          recentWorkIds: saved.recent,
          allowProvisionalMetadata: true,
        }),
      };
    } catch {
      return null;
    }
  }, [saved, reviewProgramFactory]);
  const prepared = usePreparedSelection(selection);
  if (!saved || !selection) return null;
  const duration =
    selection.kind === "single"
      ? selection.durationMinutes
      : selection.request.durationMinutes;
  const title =
    selection.kind === "single"
      ? selection.outcome
      : `${selection.request.soundKind === "music" ? "Music" : selection.request.natureFamily === "rain" ? "Rain" : "Ocean waves"} · ${selection.request.outcome}`;
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderColor: editorial.lineStrong,
        marginVertical: 10,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play your last session"
        accessibilityState={{
          disabled: !prepared.ready || starting,
          busy: starting,
        }}
        disabled={!prepared.ready || starting}
        onPress={() => {
          if (pending.current || !prepared.ready) return;
          pending.current = true;
          setStarting(true);
          setError(null);
          void controller
            .startSelectionFromUserGesture(selection)
            .then(() => router.push(consumerSelectionUrl(selection) as Href))
            .catch(() => {
              setError("Could not start. Retry or choose a need below.");
              prepared.retry();
            })
            .finally(() => {
              pending.current = false;
              setStarting(false);
            });
        }}
        style={{ minHeight: 56, justifyContent: "center" }}
      >
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: 23,
            color: editorial.ink,
          }}
        >
          {starting ? "Starting…" : "Play your last session →"}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: editorial.inkMuted,
          }}
        >
          {title} · {duration} min{prepared.ready ? "" : " · Loading…"}
        </Text>
      </Pressable>
      {error || prepared.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(null);
            prepared.retry();
          }}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text accessibilityRole="alert">
            {error ?? "Could not load your last session."} Retry loading
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

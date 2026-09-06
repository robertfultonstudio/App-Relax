import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { ConsumerDurationOptions } from "@/components/ConsumerDurationOptions";
import { ConsumerPlaybackSurface } from "@/components/ConsumerPlaybackSurface";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { SessionNatureControl } from "@/components/SessionNatureControl";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  createAdaptiveSessionProgram,
  overrideTransition,
} from "@/domain/sessions/continuumPlanner";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";
import type {
  AdaptiveSessionProgram,
  NatureAmbienceFamily,
  TransitionCurve,
} from "@/domain/sessions/types";
import {
  auditPlanAccelerated,
  createTransitionAudition,
} from "@/domain/sessions/workbench";
import { OUTCOME_EDITORIAL_SURFACE, editorial } from "@/design/editorialTheme";
import { RITUALS_HOME_BACKGROUND } from "@/design/shellArtwork";
import { fonts, spacing } from "@/design/theme";
import {
  createQaWorkbenchDraftStore,
  DEFAULT_QA_WORKBENCH_DRAFT,
  type QaWorkbenchDraft,
} from "@/qa/qaWorkbenchPersistence";
import {
  createQaPairProgram,
  QA_CATALOG,
  qaPairCompatibility,
  type QaCatalogEntry,
  type QaCatalogReadiness,
} from "@/qa/qaCatalog";
import { QaFileScrubber } from "@/qa/QaFileScrubber";
import { QaTimelineScrubber } from "@/qa/QaTimelineScrubber";

const workbenchStore = createQaWorkbenchDraftStore();
const OUTCOMES: readonly ConsumerOutcomeId[] = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
];
const QA_SENTINEL = "AUDIO QA WORKBENCH · DEVELOPMENT ONLY";
const DEFAULT_OUTGOING = "field-sea-003-open-tide";
const DEFAULT_INCOMING = "field-sea-001-tidal-breath";
const QA_COUNTS = {
  all: QA_CATALOG.length,
  playable: QA_CATALOG.filter(({ playable }) => playable).length,
  transitionReady: QA_CATALOG.filter(
    ({ readiness }) => readiness === "transition-ready",
  ).length,
  singleOnly: QA_CATALOG.filter(({ readiness }) => readiness === "single-only")
    .length,
  rejected: QA_CATALOG.filter(({ readiness }) => readiness === "rejected")
    .length,
};

type WorkbenchMode = "single" | "transition" | "session";
type PairSlot = "outgoing" | "incoming";
type CatalogFilter = "all" | QaCatalogReadiness;

function displayTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function metric(value: number | null, unit: string): string {
  return value === null ? "NOT AVAILABLE" : `${value.toFixed(2)} ${unit}`;
}

function buildSessionProgram(draft: QaWorkbenchDraft): AdaptiveSessionProgram {
  return createAdaptiveSessionProgram({
    outcome: draft.outcome,
    durationMinutes: draft.durationMinutes,
    mode: "sound-only",
    soundKind: "nature",
    seed: draft.seed,
    allowProvisionalMetadata: true,
  });
}

export default function AdaptiveQaWorkbench({
  localPlaybackAvailable = isAdaptivePlaybackAvailable(),
}: {
  localPlaybackAvailable?: boolean;
} = {}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const { controller, snapshot } = useAudioSession();
  const [draft, setDraft] = useState(DEFAULT_QA_WORKBENCH_DRAFT);
  const [sessionBaseProgram, setSessionBaseProgram] = useState(() =>
    buildSessionProgram(DEFAULT_QA_WORKBENCH_DRAFT),
  );
  const [sessionProgram, setSessionProgram] = useState(() =>
    buildSessionProgram(DEFAULT_QA_WORKBENCH_DRAFT),
  );
  const [pairBaseProgram, setPairBaseProgram] = useState(() =>
    createQaPairProgram({
      outgoingWorkId: DEFAULT_OUTGOING,
      incomingWorkId: DEFAULT_INCOMING,
      outcome: DEFAULT_QA_WORKBENCH_DRAFT.outcome,
      durationMinutes: DEFAULT_QA_WORKBENCH_DRAFT.durationMinutes,
      crossfadeSeconds: DEFAULT_QA_WORKBENCH_DRAFT.aDurationSeconds,
      curve: DEFAULT_QA_WORKBENCH_DRAFT.aCurve,
      natureFamily: "sea",
    }),
  );
  const [pairProgram, setPairProgram] = useState(pairBaseProgram);
  const [mode, setMode] = useState<WorkbenchMode>("session");
  const [selectedTransition, setSelectedTransition] = useState(0);
  const [cursorSeconds, setCursorSeconds] = useState(0);
  const [auditMessage, setAuditMessage] = useState("NOT RUN");
  const [operation, setOperation] = useState(
    "Choose a mode. The upper player is the consumer view.",
  );
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [pairSlot, setPairSlot] = useState<PairSlot>("outgoing");
  const [outgoingWorkId, setOutgoingWorkId] = useState(DEFAULT_OUTGOING);
  const [incomingWorkId, setIncomingWorkId] = useState(DEFAULT_INCOMING);
  const [singleWorkId, setSingleWorkId] = useState(DEFAULT_OUTGOING);
  const [singleDurationMinutes, setSingleDurationMinutes] = useState(30);
  const [singlePositionSeconds, setSinglePositionSeconds] = useState(0);
  const [natureFamily, setNatureFamily] = useState<NatureAmbienceFamily>("sea");
  const [busy, setBusy] = useState(false);
  const operationGeneration = useRef(0);
  const singlePositionRef = useRef(0);
  const singlePlaybackAnchor = useRef<{
    positionSeconds: number;
    remainingMs: number;
  } | null>(null);

  const program = mode === "transition" ? pairProgram : sessionProgram;
  const baseProgram =
    mode === "transition" ? pairBaseProgram : sessionBaseProgram;

  const pairCompatibility = useMemo(
    () =>
      qaPairCompatibility(outgoingWorkId, incomingWorkId, {
        durationMinutes: draft.durationMinutes,
        crossfadeSeconds: draft.aDurationSeconds,
      }),
    [
      draft.aDurationSeconds,
      draft.durationMinutes,
      incomingWorkId,
      outgoingWorkId,
    ],
  );
  const visibleCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return QA_CATALOG.filter(
      (entry) =>
        (catalogFilter === "all" || entry.readiness === catalogFilter) &&
        (!query ||
          entry.work.title.toLowerCase().includes(query) ||
          entry.work.id.toLowerCase().includes(query) ||
          entry.work.primaryOutcome.toLowerCase().includes(query) ||
          entry.work.collectionIds.some((id) => id.includes(query))),
    );
  }, [catalogFilter, catalogQuery]);
  const singleEntry =
    QA_CATALOG.find((entry) => entry.work.id === singleWorkId) ?? QA_CATALOG[0];
  const transition = program.plan.transitions[selectedTransition];
  const outgoingSegment = transition
    ? program.plan.segments.find(
        ({ index }) => index === transition.outgoingSegmentIndex,
      )
    : program.plan.segments[0];
  const incomingSegment = transition
    ? program.plan.segments.find(
        ({ index }) => index === transition.incomingSegmentIndex,
      )
    : program.plan.segments[1];
  const outgoing = program.works.find(
    ({ id }) => id === outgoingSegment?.workId,
  );
  const incoming = program.works.find(
    ({ id }) => id === incomingSegment?.workId,
  );
  const adaptiveLoaded = snapshot.sessionPlanId === program.plan.id;
  const singleLoaded = snapshot.workId === singleEntry.work.id;
  const adaptivePosition = adaptiveLoaded
    ? program.plan.totalDurationSeconds - snapshot.remainingMs / 1000
    : cursorSeconds;
  const currentSegment =
    [...program.plan.segments]
      .filter((segment) => (segment.lane ?? "primary") === "primary")
      .reverse()
      .find(
        (segment) =>
          adaptivePosition >= segment.startSeconds &&
          adaptivePosition < segment.endSeconds,
      ) ?? program.plan.segments[0];
  const currentNatureSegment = [...program.plan.segments]
    .filter((segment) => segment.lane === "nature")
    .reverse()
    .find(
      (segment) =>
        adaptivePosition >= segment.startSeconds &&
        adaptivePosition < segment.endSeconds,
    );
  const currentPhase =
    program.plan.phases.find(
      (phase) =>
        adaptivePosition >= phase.startSeconds &&
        adaptivePosition < phase.endSeconds,
    ) ?? program.plan.phases.at(-1);
  const isPlaying = snapshot.status === "playing";
  const previewIsPlaying =
    isPlaying && (mode === "single" ? singleLoaded : adaptiveLoaded);
  const previewOutcome =
    mode === "single" ? singleEntry.work.primaryOutcome : program.plan.outcome;
  const previewRemainingMs =
    mode === "single"
      ? singleLoaded
        ? snapshot.remainingMs
        : singleDurationMinutes * 60_000
      : adaptiveLoaded
        ? snapshot.remainingMs
        : (program.plan.totalDurationSeconds - cursorSeconds) * 1000;
  const relevantLoaded = mode === "single" ? singleLoaded : adaptiveLoaded;
  const previewCanPlay =
    !busy &&
    localPlaybackAvailable &&
    (mode !== "single" || singleEntry.playable) &&
    (!relevantLoaded ||
      snapshot.status === "ready" ||
      snapshot.status === "paused");
  const previewCanStop =
    !busy &&
    relevantLoaded &&
    (snapshot.status === "playing" ||
      snapshot.status === "paused" ||
      snapshot.status === "fadingOut");
  const previewCanAdjustVolume =
    !busy &&
    localPlaybackAvailable &&
    relevantLoaded &&
    ["ready", "playing", "paused", "fadingOut"].includes(snapshot.status);
  const previewCanAdjustNature =
    previewCanAdjustVolume && program.plan.natureMix !== undefined;
  const selectedSingleDurationMinutes = singleLoaded
    ? snapshot.selectedDurationMinutes
    : singleDurationMinutes;
  const singleTimerLocked =
    busy ||
    (singleLoaded &&
      (snapshot.status === "playing" || snapshot.status === "fadingOut"));

  useEffect(() => {
    if (
      mode !== "single" ||
      !singleLoaded ||
      !previewIsPlaying ||
      singleEntry.work.sourceKind !== "file"
    ) {
      return;
    }
    const anchor = singlePlaybackAnchor.current;
    if (!anchor) return;
    const position =
      (anchor.positionSeconds +
        Math.max(0, anchor.remainingMs - snapshot.remainingMs) / 1000) %
      singleEntry.work.durationSeconds;
    singlePositionRef.current = position;
    setSinglePositionSeconds(position);
  }, [
    mode,
    previewIsPlaying,
    singleEntry.work,
    singleLoaded,
    snapshot.remainingMs,
  ]);

  function patchDraft(patch: Partial<QaWorkbenchDraft>): void {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function setSinglePosition(positionSeconds: number): void {
    singlePositionRef.current = positionSeconds;
    setSinglePositionSeconds(positionSeconds);
  }

  function currentSinglePosition(): number {
    return singlePositionRef.current;
  }

  function finishOperation(generation: number): void {
    if (operationGeneration.current === generation) setBusy(false);
  }

  function requireReadySnapshot(context: string) {
    const current = controller.getSnapshot();
    if (
      current.status !== "ready" &&
      current.status !== "paused" &&
      current.status !== "playing"
    ) {
      throw new Error(current.error ?? `${context} did not become ready.`);
    }
    return current;
  }

  function requirePlayingSnapshot(context: string) {
    const current = controller.getSnapshot();
    if (current.status !== "playing") {
      throw new Error(current.error ?? `${context} did not start playback.`);
    }
    return current;
  }

  async function switchMode(nextMode: WorkbenchMode): Promise<void> {
    if (nextMode === mode) return;
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      await controller.stop();
      if (operationGeneration.current !== generation) return;
      singlePlaybackAnchor.current = null;
      setCursorSeconds(0);
      setSelectedTransition(0);
      setMode(nextMode);
      setOperation(
        nextMode === "single"
          ? "Single mode: every playable catalog item can be reviewed and scrubbed."
          : nextMode === "transition"
            ? "Transition mode: choose outgoing and incoming works directly."
            : "Session mode: deterministic four-part consumer plan.",
      );
    } finally {
      finishOperation(generation);
    }
  }

  async function installProgram(
    next: AdaptiveSessionProgram,
    targetMode: "session" | "transition",
    message: string,
  ): Promise<void> {
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      await controller.stop();
      if (operationGeneration.current !== generation) return;
      singlePlaybackAnchor.current = null;
      if (targetMode === "session") {
        setSessionBaseProgram(next);
        setSessionProgram(next);
      } else {
        setPairBaseProgram(next);
        setPairProgram(next);
      }
      setMode(targetMode);
      setSelectedTransition(0);
      setCursorSeconds(0);
      setAuditMessage("NOT RUN");
      setOperation(message);
    } finally {
      finishOperation(generation);
    }
  }

  function rebuild(nextDraft = draft): void {
    try {
      const next = buildSessionProgram(nextDraft);
      void installProgram(next, "session", `Rebuilt ${next.plan.id}.`);
    } catch (error) {
      setOperation(error instanceof Error ? error.message : "Planning failed.");
    }
  }

  function buildPair(): void {
    try {
      const next = createQaPairProgram({
        outgoingWorkId,
        incomingWorkId,
        outcome: draft.outcome,
        durationMinutes: draft.durationMinutes,
        crossfadeSeconds: draft.aDurationSeconds,
        curve: draft.aCurve,
        natureFamily,
      });
      void installProgram(
        next,
        "transition",
        `Direct pair ready: ${next.works[0].title} to ${next.works[1].title}.`,
      );
    } catch (error) {
      setOperation(
        error instanceof Error ? error.message : "Pair could not be built.",
      );
    }
  }

  function changeNatureFamily(nextFamily: NatureAmbienceFamily): void {
    setNatureFamily(nextFamily);
    if (mode !== "transition" || !program.plan.natureMix) return;
    try {
      const next = createQaPairProgram({
        outgoingWorkId,
        incomingWorkId,
        outcome: draft.outcome,
        durationMinutes: draft.durationMinutes,
        crossfadeSeconds: draft.aDurationSeconds,
        curve: draft.aCurve,
        natureFamily: nextFamily,
      });
      void installProgram(
        next,
        "transition",
        `${nextFamily === "sea" ? "Ocean waves" : "Rain"} selected for the session.`,
      );
    } catch (error) {
      setOperation(
        error instanceof Error
          ? error.message
          : "Natural ambience could not be changed.",
      );
    }
  }

  async function loadSaved(): Promise<void> {
    const saved = await workbenchStore.load();
    if (!saved) {
      setOperation("No valid saved QA draft.");
      return;
    }
    setDraft(saved);
    try {
      const next = buildSessionProgram(saved);
      await installProgram(
        next,
        "session",
        "Saved seed and QA controls restored.",
      );
    } catch (error) {
      setOperation(error instanceof Error ? error.message : "Planning failed.");
    }
  }

  async function playSingle(entry: QaCatalogEntry): Promise<void> {
    if (!localPlaybackAvailable) {
      setOperation(
        "Complete-catalog playback is available only in the authorized local browser Review surface.",
      );
      return;
    }
    if (!entry.playable) {
      setOperation(`${entry.work.title} is rejected and cannot be played.`);
      return;
    }
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      await controller.stop();
      if (operationGeneration.current !== generation) return;
      setSingleWorkId(entry.work.id);
      setMode("single");
      setSinglePosition(0);
      singlePlaybackAnchor.current = null;
      await controller.loadProgram(createSingleTrackProgram(entry.work));
      if (operationGeneration.current !== generation) return;
      requireReadySnapshot(entry.work.title);
      await controller.setTimer(singleDurationMinutes);
      if (operationGeneration.current !== generation) return;
      await controller.play();
      const playingSnapshot = requirePlayingSnapshot(entry.work.title);
      if (entry.work.sourceKind === "file") {
        singlePlaybackAnchor.current = {
          positionSeconds: 0,
          remainingMs: playingSnapshot.remainingMs,
        };
      }
      setOperation(`Playing ${entry.work.title} as the consumer hears it.`);
    } catch (error) {
      setOperation(
        error instanceof Error ? error.message : "Single work could not start.",
      );
    } finally {
      finishOperation(generation);
    }
  }

  async function playFromPreview(): Promise<void> {
    if (!localPlaybackAvailable) {
      setOperation(
        "This QA playback path is available only in the authorized local Review browser.",
      );
      return;
    }
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      if (previewIsPlaying) {
        const position = currentSinglePosition();
        await controller.pause();
        if (operationGeneration.current !== generation) return;
        if (mode === "single") setSinglePosition(position);
        singlePlaybackAnchor.current = null;
        setOperation("Playback paused.");
        return;
      }
      if (mode === "single") {
        if (!singleLoaded) {
          await controller.loadProgram(
            createSingleTrackProgram(singleEntry.work),
          );
          if (operationGeneration.current !== generation) return;
          requireReadySnapshot(singleEntry.work.title);
          await controller.setTimer(singleDurationMinutes);
        }
        if (singleEntry.work.sourceKind === "file") {
          await controller.seekSingleTrack(singlePositionRef.current);
        }
      } else if (!adaptiveLoaded) {
        await controller.loadAdaptiveSession(program);
        if (operationGeneration.current !== generation) return;
        requireReadySnapshot(program.plan.id);
        await controller.configureAdaptiveAudition(null);
        if (cursorSeconds > 0) {
          await controller.seekAdaptiveSession(
            Math.min(program.plan.totalDurationSeconds - 0.001, cursorSeconds),
          );
        }
      }
      if (operationGeneration.current !== generation) return;
      await controller.play();
      const playingSnapshot = requirePlayingSnapshot(
        mode === "single" ? singleEntry.work.title : program.plan.id,
      );
      if (mode === "single" && singleEntry.work.sourceKind === "file") {
        singlePlaybackAnchor.current = {
          positionSeconds: singlePositionRef.current,
          remainingMs: playingSnapshot.remainingMs,
        };
      }
      setOperation("Playback started from the consumer control.");
    } catch (error) {
      setOperation(
        error instanceof Error ? error.message : "Playback could not start.",
      );
    } finally {
      finishOperation(generation);
    }
  }

  async function stopPreview(): Promise<void> {
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      await controller.stop();
      if (operationGeneration.current !== generation) return;
      singlePlaybackAnchor.current = null;
      if (mode === "single") setSinglePosition(0);
      else setCursorSeconds(0);
      setOperation("Playback stopped and returned to the beginning.");
    } finally {
      finishOperation(generation);
    }
  }

  async function seekTo(targetSeconds: number): Promise<boolean> {
    if (!localPlaybackAvailable) {
      setOperation("Session seeking is available only in local Review.");
      return false;
    }
    const target = Math.min(
      program.plan.totalDurationSeconds - 0.001,
      Math.max(0, targetSeconds),
    );
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      if (controller.getSnapshot().sessionPlanId !== program.plan.id) {
        await controller.loadAdaptiveSession(program);
        if (operationGeneration.current !== generation) return false;
        requireReadySnapshot(program.plan.id);
      }
      if (operationGeneration.current !== generation) return false;
      await controller.configureAdaptiveAudition(null);
      await controller.seekAdaptiveSession(target);
      if (operationGeneration.current !== generation) return false;
      setCursorSeconds(target);
      setOperation(`Session position moved to ${displayTime(target)}.`);
      return true;
    } catch (error) {
      if (operationGeneration.current === generation) {
        setOperation(
          error instanceof Error
            ? error.message
            : "Seek could not be completed.",
        );
      }
      return false;
    } finally {
      finishOperation(generation);
    }
  }

  async function seekSingleTo(targetSeconds: number): Promise<boolean> {
    if (!localPlaybackAvailable) {
      setOperation("File seeking is available only in local Review.");
      return false;
    }
    if (singleEntry.work.sourceKind !== "file") return false;
    const target = Math.min(
      singleEntry.work.durationSeconds - 0.001,
      Math.max(0, targetSeconds),
    );
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      if (!singleLoaded) {
        await controller.loadProgram(
          createSingleTrackProgram(singleEntry.work),
        );
        if (operationGeneration.current !== generation) return false;
        requireReadySnapshot(singleEntry.work.title);
        await controller.setTimer(singleDurationMinutes);
      }
      if (operationGeneration.current !== generation) return false;
      await controller.seekSingleTrack(target);
      if (operationGeneration.current !== generation) return false;
      setSinglePosition(target);
      if (previewIsPlaying) {
        singlePlaybackAnchor.current = {
          positionSeconds: target,
          remainingMs: controller.getSnapshot().remainingMs,
        };
      }
      setOperation(
        `${singleEntry.work.title} file position moved to ${displayTime(target)}.`,
      );
      return true;
    } catch (error) {
      if (operationGeneration.current === generation) {
        setOperation(
          error instanceof Error
            ? error.message
            : "File seek could not be completed.",
        );
      }
      return false;
    } finally {
      finishOperation(generation);
    }
  }

  async function applyVariant(
    label: "A" | "B",
    durationSeconds: number,
    curve: TransitionCurve,
  ): Promise<void> {
    if (!localPlaybackAvailable) {
      setOperation("Transition audition is available only in local Review.");
      return;
    }
    const generation = ++operationGeneration.current;
    setBusy(true);
    try {
      await controller.stop();
      if (operationGeneration.current !== generation) return;
      const variant = overrideTransition(
        baseProgram,
        selectedTransition,
        durationSeconds,
        curve,
      );
      const nextAudition = createTransitionAudition(
        variant.plan,
        selectedTransition,
        draft.loopWindowSeconds,
        draft.auditionMode,
      );
      if (mode === "transition") setPairProgram(variant);
      else setSessionProgram(variant);
      await controller.loadAdaptiveSession(variant);
      if (operationGeneration.current !== generation) return;
      requireReadySnapshot(variant.plan.id);
      await controller.configureAdaptiveAudition(nextAudition);
      await controller.seekAdaptiveSession(nextAudition.startSeconds);
      if (operationGeneration.current !== generation) return;
      setCursorSeconds(nextAudition.startSeconds);
      await controller.play();
      requirePlayingSnapshot(variant.plan.id);
      setOperation(
        `Audition ${label}: ${durationSeconds}s ${curve}, ${draft.auditionMode}.`,
      );
    } catch (error) {
      setOperation(
        error instanceof Error ? error.message : "Audition could not start.",
      );
    } finally {
      finishOperation(generation);
    }
  }

  async function selectTransition(index: number): Promise<void> {
    const previous = selectedTransition;
    const next = Math.max(
      0,
      Math.min(program.plan.transitions.length - 1, index),
    );
    setSelectedTransition(next);
    patchDraft({ transitionIndex: next });
    const target = createTransitionAudition(
      program.plan,
      next,
      draft.loopWindowSeconds,
      draft.auditionMode,
    ).startSeconds;
    if (!(await seekTo(target))) {
      setSelectedTransition(previous);
      patchDraft({ transitionIndex: previous });
    }
  }

  function assignPair(entry: QaCatalogEntry): void {
    if (!entry.transitionProfile) {
      setOperation(`${entry.work.title} is single-only; it cannot crossfade.`);
      return;
    }
    if (pairSlot === "outgoing") {
      setOutgoingWorkId(entry.work.id);
      setPairSlot("incoming");
      setOperation(`${entry.work.title} selected as outgoing.`);
    } else {
      setIncomingWorkId(entry.work.id);
      setPairSlot("outgoing");
      setOperation(`${entry.work.title} selected as incoming.`);
    }
  }

  function inspectPairSource(workId: string): void {
    const entry = QA_CATALOG.find(({ work }) => work.id === workId);
    if (!entry?.playable) {
      setOperation("That source cannot be opened in local playback.");
      return;
    }
    void playSingle(entry);
  }

  const runAudit = (): void => {
    const result = auditPlanAccelerated(program);
    setAuditMessage(
      `${result.pass ? "PASS" : "FAIL"} · exact end ${result.exactEnd ? "yes" : "no"} · gaps ${result.noGap ? "none" : "found"} · max sources ${result.maxConcurrentSources} · ${result.inspectedIntervals} exact intervals`,
    );
  };

  return (
    <EditorialScreen backgroundArtwork={RITUALS_HOME_BACKGROUND}>
      <View style={styles.page} testID="qa-workbench">
        <Text style={styles.sentinel}>{QA_SENTINEL}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Hear exactly what the user hears.
        </Text>
        <Text style={styles.intro}>
          The player below is the same component and controls used by the
          consumer app. QA adds the complete catalog, direct transition choice
          and precise session or file seeking.
        </Text>
        {!localPlaybackAvailable ? (
          <Text accessibilityRole="alert" style={styles.error}>
            LOCAL REVIEW WEB ONLY · the complete external catalog and adaptive
            playback are not available in the native development build.
          </Text>
        ) : null}

        <View style={styles.modeRow}>
          {(["single", "transition", "session"] as const).map((value) => (
            <ModeChoice
              disabled={busy}
              key={value}
              label={
                value === "single"
                  ? "SINGLE WORK"
                  : value === "transition"
                    ? "DIRECT TRANSITION"
                    : "FULL SESSION"
              }
              onPress={() => void switchMode(value)}
              selected={mode === value}
            />
          ))}
        </View>

        <View style={[styles.workspace, isWide && styles.workspaceWide]}>
          <View
            style={[styles.consumerColumn, isWide && styles.consumerColumnWide]}
          >
            <Text style={styles.columnLabel}>EXACT CONSUMER VIEW</Text>
            <View
              style={[
                styles.consumerFrame,
                { backgroundColor: OUTCOME_EDITORIAL_SURFACE[previewOutcome] },
              ]}
            >
              <EditorialHeader
                label={
                  mode === "single"
                    ? previewOutcome.toUpperCase()
                    : `${previewOutcome.toUpperCase()} SESSION`
                }
                showBack
              />
              <ConsumerPlaybackSurface
                canPlay={previewCanPlay}
                canStop={previewCanStop}
                contextLabel={
                  mode === "single"
                    ? `${singleEntry.work.primaryOutcome.toUpperCase()} · SINGLE WORK`
                    : `${program.plan.natureMix ? "MUSIC + NATURE" : "NATURAL SOUNDS"} · SOUND ONLY · ${program.plan.requestedDurationMinutes} MIN`
                }
                currentLabel={
                  mode === "single"
                    ? undefined
                    : (currentPhase?.id ?? currentSegment.phase).toUpperCase()
                }
                currentTitle={
                  mode === "single" ? undefined : currentSegment.title
                }
                error={relevantLoaded ? snapshot.error : null}
                gateLabel={
                  mode === "single" &&
                  singleEntry.work.listeningStatus ===
                    "APPROVED — LISTENING PASSED"
                    ? null
                    : "PREVIEW MODE · LISTENING REVIEW PENDING"
                }
                isPlaying={previewIsPlaying}
                note={
                  mode === "single"
                    ? singleEntry.work.sourceKind === "generated-noise"
                      ? "A continuous sound created when you press play."
                      : "One complete work continues without interruption."
                    : program.plan.natureMix
                      ? "Music and natural atmosphere move together, then the session closes at the time you chose."
                      : "The natural atmosphere changes gradually, then the session closes at the time you chose."
                }
                onPlayPause={() => void playFromPreview()}
                onStop={() => void stopPreview()}
                onVolumeChange={(volume) => void controller.setVolume(volume)}
                options={
                  mode === "single" ? (
                    <ConsumerDurationOptions
                      disabled={singleTimerLocked}
                      onSelect={(minutes) => {
                        setSingleDurationMinutes(minutes);
                        if (singleLoaded) void controller.setTimer(minutes);
                      }}
                      options={
                        createSingleTrackProgram(singleEntry.work)
                          .durationOptionsMinutes
                      }
                      selectedMinutes={selectedSingleDurationMinutes}
                    />
                  ) : program.plan.natureMix && currentNatureSegment ? (
                    <SessionNatureControl
                      family={program.plan.natureMix.selectedFamily}
                      familyDisabled={busy}
                      level={
                        snapshot.natureMixLevel ??
                        program.plan.natureMix.initialLevel
                      }
                      onFamilyChange={changeNatureFamily}
                      onLevelChange={(level) =>
                        void controller.setNatureMixLevel(level, 1800)
                      }
                      title={currentNatureSegment.title}
                      volumeDisabled={!previewCanAdjustNature}
                    />
                  ) : undefined
                }
                outcome={previewOutcome}
                playPauseTestID="qa-consumer-play-pause"
                remainingMs={previewRemainingMs}
                title={
                  mode === "single"
                    ? singleEntry.work.title
                    : getSessionPolicy(program.plan.outcome).startLabel
                }
                variant={mode === "single" ? "single" : "session"}
                volume={relevantLoaded ? snapshot.volume : 0.8}
                volumeDisabled={!previewCanAdjustVolume}
              />
            </View>
          </View>

          <View style={styles.controlColumn}>
            {mode === "single" && singleEntry.work.sourceKind === "file" ? (
              <Section title="FILE POSITION · CLICK OR DRAG">
                <Text style={styles.meta}>
                  {singleEntry.work.title} · source file ·{" "}
                  {displayTime(singleEntry.work.durationSeconds)}
                </Text>
                <QaFileScrubber
                  durationSeconds={singleEntry.work.durationSeconds}
                  onSeek={seekSingleTo}
                  positionSeconds={singlePositionSeconds}
                  title={singleEntry.work.title}
                />
              </Section>
            ) : null}

            {mode === "single" &&
            singleEntry.work.sourceKind === "generated-noise" ? (
              <Section title="CONTINUOUS GENERATOR">
                <Text style={styles.sectionLead}>
                  This sound is generated continuously and has no source file
                  position to scrub.
                </Text>
              </Section>
            ) : null}

            {mode === "session" ? (
              <Section title="SESSION PLAN">
                <Text style={styles.label}>INTENT</Text>
                <View style={styles.wrap}>
                  {OUTCOMES.map((outcome) => (
                    <Choice
                      key={outcome}
                      label={outcome.toUpperCase()}
                      onPress={() => {
                        const policy = getSessionPolicy(outcome);
                        patchDraft({
                          outcome,
                          durationMinutes: policy.defaultDuration,
                          transitionIndex: 0,
                        });
                      }}
                      selected={draft.outcome === outcome}
                    />
                  ))}
                </View>
                <Text style={styles.label}>DURATION</Text>
                <View style={styles.wrap}>
                  {getSessionPolicy(draft.outcome).durations.map((duration) => (
                    <Choice
                      key={duration}
                      label={`${duration} MIN`}
                      onPress={() => patchDraft({ durationMinutes: duration })}
                      selected={draft.durationMinutes === duration}
                    />
                  ))}
                </View>
                <Text style={styles.label}>REPRODUCIBLE SEED</Text>
                <TextInput
                  accessibilityLabel="Reproducible QA seed"
                  autoCapitalize="none"
                  onChangeText={(seed) => patchDraft({ seed })}
                  style={styles.input}
                  value={draft.seed}
                />
                <View style={styles.actions}>
                  <Action label="REBUILD" onPress={() => rebuild()} />
                  <Action
                    label="SAVE"
                    onPress={() =>
                      void workbenchStore
                        .save({ ...draft, transitionIndex: selectedTransition })
                        .then(() => setOperation("QA draft saved locally."))
                    }
                  />
                  <Action label="LOAD" onPress={() => void loadSaved()} />
                </View>
              </Section>
            ) : null}

            {mode === "transition" ? (
              <Section title="DIRECT A → B TRANSITION">
                <Text style={styles.sectionLead}>
                  Pick any two of the {QA_COUNTS.transitionReady}{" "}
                  transition-ready works. Incompatible handoffs stay blocked
                  instead of being played by accident.
                </Text>
                <View style={styles.pairSlots}>
                  <PairSlotButton
                    active={pairSlot === "outgoing"}
                    label="OUTGOING / A"
                    onPress={() => setPairSlot("outgoing")}
                    title={
                      QA_CATALOG.find(({ work }) => work.id === outgoingWorkId)
                        ?.work.title ?? outgoingWorkId
                    }
                  />
                  <PairSlotButton
                    active={pairSlot === "incoming"}
                    label="INCOMING / B"
                    onPress={() => setPairSlot("incoming")}
                    title={
                      QA_CATALOG.find(({ work }) => work.id === incomingWorkId)
                        ?.work.title ?? incomingWorkId
                    }
                  />
                </View>
                <Text style={styles.label}>QA WINDOW</Text>
                <View style={styles.wrap}>
                  {getSessionPolicy(draft.outcome).durations.map((duration) => (
                    <Choice
                      key={duration}
                      label={`${duration} MIN`}
                      onPress={() => patchDraft({ durationMinutes: duration })}
                      selected={draft.durationMinutes === duration}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.compatibility,
                    !pairCompatibility.compatible && styles.blocked,
                  ]}
                >
                  {pairCompatibility.compatible
                    ? "COMPATIBLE · SAFE BOUNDARY FITS · READY TO BUILD"
                    : "BLOCKED · CHANGE PAIR OR QA WINDOW"}
                </Text>
                {!pairCompatibility.compatible
                  ? pairCompatibility.audit
                      .filter((line) => line.startsWith("BLOCK"))
                      .map((line) => (
                        <Text key={line} style={styles.auditLine}>
                          {line}
                        </Text>
                      ))
                  : null}
                <Action
                  disabled={busy || !pairCompatibility.compatible}
                  label="BUILD DIRECT TRANSITION"
                  onPress={buildPair}
                />
              </Section>
            ) : null}

            {mode !== "single" ? (
              <Section title="SESSION POSITION · CLICK OR DRAG">
                <Text style={styles.meta}>
                  {program.plan.id} · {program.plan.totalDurationSeconds / 60}{" "}
                  MIN · exact end
                </Text>
                <QaTimelineScrubber
                  onSeek={seekTo}
                  plan={program.plan}
                  positionSeconds={adaptivePosition}
                />
                <View style={styles.actions}>
                  <Action
                    disabled={selectedTransition === 0}
                    label="← PREVIOUS CHANGE"
                    onPress={() =>
                      void selectTransition(selectedTransition - 1)
                    }
                  />
                  <Action
                    disabled={
                      selectedTransition === program.plan.transitions.length - 1
                    }
                    label="NEXT CHANGE →"
                    onPress={() =>
                      void selectTransition(selectedTransition + 1)
                    }
                  />
                </View>
              </Section>
            ) : null}

            {mode !== "single" &&
            transition &&
            outgoingSegment &&
            incomingSegment &&
            outgoing &&
            incoming ? (
              <Section
                title={`${transition.lane === "nature" ? "NATURAL AMBIENCE" : "MUSIC"} CHANGE ${selectedTransition + 1}`}
              >
                <Text style={styles.transitionTitle}>
                  {outgoing.title} → {incoming.title}
                </Text>
                <Text style={styles.meta}>
                  SESSION {displayTime(transition.startSeconds)} →{" "}
                  {displayTime(transition.endSeconds)}
                </Text>
                <View style={styles.sourcePositions}>
                  <Metric
                    label="OUTGOING FILE"
                    value={`${displayTime(outgoingSegment.sourceEntrySeconds)} → ${displayTime(outgoingSegment.sourceExitSeconds)}`}
                  />
                  <Metric
                    label="INCOMING FILE"
                    value={`${displayTime(incomingSegment.sourceEntrySeconds)} → ${displayTime(incomingSegment.sourceExitSeconds)}`}
                  />
                </View>
                <Text style={styles.label}>INSPECT EACH COMPLETE FILE</Text>
                <Text style={styles.sectionLead}>
                  Open A or B in the same consumer player to seek anywhere in
                  that source file. Returning to Direct Transition preserves
                  this pair.
                </Text>
                <View style={styles.actions}>
                  <Action
                    label="OPEN A FILE + SCRUB"
                    onPress={() => inspectPairSource(outgoing.id)}
                  />
                  <Action
                    label="OPEN B FILE + SCRUB"
                    onPress={() => inspectPairSource(incoming.id)}
                  />
                </View>
                <Text style={styles.label}>LOOP WINDOW</Text>
                <View style={styles.wrap}>
                  {([30, 60] as const).map((seconds) => (
                    <Choice
                      key={seconds}
                      label={`± ${seconds} SEC`}
                      onPress={() => patchDraft({ loopWindowSeconds: seconds })}
                      selected={draft.loopWindowSeconds === seconds}
                    />
                  ))}
                </View>
                <Text style={styles.label}>LISTEN</Text>
                <View style={styles.wrap}>
                  {(["outgoing", "incoming", "both"] as const).map(
                    (auditionMode) => (
                      <Choice
                        key={auditionMode}
                        label={auditionMode.toUpperCase()}
                        onPress={() => patchDraft({ auditionMode })}
                        selected={draft.auditionMode === auditionMode}
                      />
                    ),
                  )}
                </View>
                <View style={styles.comparison}>
                  <Variant
                    curve={draft.aCurve}
                    duration={draft.aDurationSeconds}
                    label="A"
                    onCurve={(aCurve) => patchDraft({ aCurve })}
                    onDuration={(aDurationSeconds) =>
                      patchDraft({ aDurationSeconds })
                    }
                    onPlay={() =>
                      void applyVariant(
                        "A",
                        draft.aDurationSeconds,
                        draft.aCurve,
                      )
                    }
                    playbackDisabled={!localPlaybackAvailable}
                  />
                  <Variant
                    curve={draft.bCurve}
                    duration={draft.bDurationSeconds}
                    label="B"
                    onCurve={(bCurve) => patchDraft({ bCurve })}
                    onDuration={(bDurationSeconds) =>
                      patchDraft({ bDurationSeconds })
                    }
                    onPlay={() =>
                      void applyVariant(
                        "B",
                        draft.bDurationSeconds,
                        draft.bCurve,
                      )
                    }
                    playbackDisabled={!localPlaybackAvailable}
                  />
                </View>
              </Section>
            ) : null}

            {mode !== "single" && transition && outgoing && incoming ? (
              <Section title="MEASUREMENTS / RULE AUDIT">
                <View style={styles.metrics}>
                  <Metric
                    label="OUTGOING LUFS"
                    value={metric(outgoing.measuredLufs, "LUFS")}
                  />
                  <Metric
                    label="INCOMING LUFS"
                    value={metric(incoming.measuredLufs, "LUFS")}
                  />
                  <Metric
                    label="UNTRIMMED PEAK"
                    value={metric(transition.untrimmedPeakDbtp, "dBTP")}
                  />
                  <Metric
                    label="STATIC TRIM"
                    value={metric(transition.transitionTrimDb, "dB")}
                  />
                  <Metric
                    label="POST-TRIM RISK"
                    value={metric(transition.clippingRiskDbtp, "dBTP")}
                  />
                </View>
                {transition.ruleAudit.map((line) => (
                  <Text key={line} style={styles.auditLine}>
                    {line}
                  </Text>
                ))}
                <Text style={styles.review}>
                  {program.plan.metadataReviewStatus}
                </Text>
                <Text style={styles.review}>{transition.reviewStatus}</Text>
                <Action label="RUN ACCELERATED PLAN QA" onPress={runAudit} />
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.auditResult}
                >
                  {auditMessage}
                </Text>
              </Section>
            ) : null}
          </View>
        </View>

        <Section title="ALL AUDIO MATERIAL">
          <Text style={styles.catalogCount}>
            {QA_COUNTS.all} ITEMS · {QA_COUNTS.playable} PLAYABLE IN LOCAL
            REVIEW · {QA_COUNTS.transitionReady} TRANSITION-READY
          </Text>
          <Text style={styles.sectionLead}>
            Every catalog item is visible here. Soft Air remains present but
            blocked because it was rejected at the listening gate.
          </Text>
          <TextInput
            accessibilityLabel="Search all audio material"
            onChangeText={setCatalogQuery}
            placeholder="Search title, outcome or collection"
            placeholderTextColor={editorial.inkFaint}
            style={styles.input}
            value={catalogQuery}
          />
          <View style={styles.wrap}>
            {(
              [
                ["all", `ALL ${QA_COUNTS.all}`],
                ["transition-ready", `TRANSITION ${QA_COUNTS.transitionReady}`],
                ["single-only", `SINGLE ONLY ${QA_COUNTS.singleOnly}`],
                ["rejected", `REJECTED ${QA_COUNTS.rejected}`],
              ] as const
            ).map(([value, label]) => (
              <Choice
                key={value}
                label={label}
                onPress={() => setCatalogFilter(value)}
                selected={catalogFilter === value}
              />
            ))}
          </View>
          <Text style={styles.catalogHint}>
            {mode === "transition"
              ? `SELECTING ${pairSlot.toUpperCase()} · choose SET A/B below`
              : "PLAY SOLO opens the same consumer player above"}
          </Text>
          <View style={styles.catalog}>
            {visibleCatalog.map((entry, index) => (
              <CatalogRow
                assignPair={() => assignPair(entry)}
                entry={entry}
                index={index + 1}
                key={entry.work.id}
                onPlay={() => void playSingle(entry)}
                pairMode={mode === "transition"}
                pairSlot={pairSlot}
                playbackEnabled={localPlaybackAvailable}
                selected={
                  (mode === "single" && singleWorkId === entry.work.id) ||
                  (mode === "transition" &&
                    (outgoingWorkId === entry.work.id ||
                      incomingWorkId === entry.work.id))
                }
              />
            ))}
          </View>
        </Section>

        <Text accessibilityLiveRegion="polite" style={styles.operation}>
          {operation}
        </Text>
        {relevantLoaded && snapshot.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            AUDIO ERROR · {snapshot.error}
          </Text>
        ) : null}
      </View>
    </EditorialScreen>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ModeChoice({
  disabled,
  label,
  onPress,
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.modeChoice,
        selected && styles.modeChoiceSelected,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Choice({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function Action({
  accessibilityLabel,
  disabled = false,
  label,
  onPress,
}: {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled && styles.disabled]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function PairSlotButton({
  active,
  label,
  onPress,
  title,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.pairSlot, active && styles.pairSlotActive]}
    >
      <Text style={styles.pairSlotLabel}>{label}</Text>
      <Text style={styles.pairSlotTitle}>{title}</Text>
    </Pressable>
  );
}

function Variant({
  curve,
  duration,
  label,
  onCurve,
  onDuration,
  onPlay,
  playbackDisabled,
}: {
  curve: TransitionCurve;
  duration: number;
  label: "A" | "B";
  onCurve: (value: TransitionCurve) => void;
  onDuration: (value: number) => void;
  onPlay: () => void;
  playbackDisabled: boolean;
}) {
  return (
    <View style={styles.variant}>
      <Text style={styles.variantTitle}>VERSION {label}</Text>
      <Text style={styles.label}>DURATION</Text>
      <View style={styles.wrap}>
        {[60, 90, 120, 180, 240].map((value) => (
          <Choice
            key={value}
            label={`${value} SEC`}
            onPress={() => onDuration(value)}
            selected={duration === value}
          />
        ))}
      </View>
      <Text style={styles.label}>CURVE</Text>
      <View style={styles.wrap}>
        {(["equal-power", "linear"] as const).map((value) => (
          <Choice
            key={value}
            label={value.toUpperCase()}
            onPress={() => onCurve(value)}
            selected={curve === value}
          />
        ))}
      </View>
      <Action
        disabled={playbackDisabled}
        label={`AUDITION ${label}`}
        onPress={onPlay}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function CatalogRow({
  assignPair,
  entry,
  index,
  onPlay,
  pairMode,
  pairSlot,
  playbackEnabled,
  selected,
}: {
  assignPair: () => void;
  entry: QaCatalogEntry;
  index: number;
  onPlay: () => void;
  pairMode: boolean;
  pairSlot: PairSlot;
  playbackEnabled: boolean;
  selected: boolean;
}) {
  return (
    <View style={[styles.catalogRow, selected && styles.catalogRowSelected]}>
      <Text style={styles.catalogIndex}>{String(index).padStart(2, "0")}</Text>
      <View style={styles.catalogCopy}>
        <Text style={styles.catalogTitle}>{entry.work.title}</Text>
        <Text style={styles.catalogMeta}>
          {entry.work.primaryOutcome.toUpperCase()} ·{" "}
          {entry.work.sourceKind === "file" ? "FILE" : "GENERATED NOISE"} ·{" "}
          {entry.readiness.replaceAll("-", " ").toUpperCase()}
        </Text>
      </View>
      <View style={styles.catalogActions}>
        {pairMode ? (
          <Action
            accessibilityLabel={`Set ${entry.work.title} as ${pairSlot}`}
            disabled={!entry.transitionProfile}
            label={`SET ${pairSlot === "outgoing" ? "A" : "B"}`}
            onPress={assignPair}
          />
        ) : null}
        <Action
          accessibilityLabel={`Play ${entry.work.title} solo`}
          disabled={!entry.playable || !playbackEnabled}
          label="PLAY SOLO"
          onPress={onPlay}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignSelf: "center",
    gap: spacing.xl,
    maxWidth: 1500,
    width: "100%",
  },
  sentinel: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 48,
    lineHeight: 51,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 780,
  },
  modeRow: {
    borderBottomColor: editorial.lineStrong,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modeChoice: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 3,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  modeChoiceSelected: { borderBottomColor: editorial.jade },
  modeText: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  modeTextSelected: { color: editorial.ink },
  workspace: { gap: spacing.xl },
  workspaceWide: { alignItems: "flex-start", flexDirection: "row" },
  consumerColumn: { maxWidth: 460, minWidth: 0, width: "100%" },
  consumerColumnWide: { flexBasis: 410, flexGrow: 0, flexShrink: 0 },
  controlColumn: { flex: 1, gap: spacing.lg, minWidth: 0 },
  columnLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  consumerFrame: {
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  section: {
    backgroundColor: "rgba(248, 242, 232, 0.88)",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  sectionLead: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.9,
    marginTop: spacing.xs,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: {
    alignItems: "center",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 82,
    paddingHorizontal: spacing.md,
  },
  choiceSelected: {
    backgroundColor: "#DDE5E0",
    borderColor: editorial.jade,
  },
  choiceText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.45,
  },
  input: {
    backgroundColor: "rgba(248, 242, 232, 0.7)",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: {
    alignItems: "center",
    backgroundColor: "rgba(231, 217, 197, 0.54)",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.55,
  },
  disabled: { opacity: 0.36 },
  meta: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
  },
  pairSlots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  pairSlot: {
    borderColor: editorial.line,
    borderLeftWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 84,
    minWidth: 210,
    padding: spacing.md,
  },
  pairSlotActive: {
    backgroundColor: "#E1E9E5",
    borderLeftColor: editorial.jade,
  },
  pairSlotLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  pairSlotTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 23,
    marginTop: spacing.xs,
  },
  compatibility: {
    color: editorial.jade,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  blocked: { color: editorial.rose },
  transitionTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
  },
  sourcePositions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  comparison: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  variant: {
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.sm,
    minWidth: 270,
    padding: spacing.md,
  },
  variantTitle: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    backgroundColor: "rgba(231, 217, 197, 0.52)",
    flexGrow: 1,
    minWidth: 145,
    padding: spacing.md,
  },
  metricLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  metricValue: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  auditLine: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  review: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  auditResult: {
    color: editorial.jade,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  catalogCount: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
  },
  catalogHint: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.75,
  },
  catalog: {
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  catalogRow: {
    alignItems: "center",
    borderBottomColor: editorial.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    minHeight: 76,
    paddingVertical: spacing.sm,
  },
  catalogRowSelected: { backgroundColor: "rgba(221, 229, 224, 0.72)" },
  catalogIndex: {
    color: editorial.inkFaint,
    fontFamily: fonts.serif,
    fontSize: 18,
    width: 32,
  },
  catalogCopy: { flex: 1, minWidth: 210 },
  catalogTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 21,
  },
  catalogMeta: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.45,
    lineHeight: 16,
    marginTop: 2,
  },
  catalogActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  operation: {
    borderLeftColor: editorial.gold,
    borderLeftWidth: 2,
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: spacing.md,
  },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
  },
});

export { QA_SENTINEL };

import { useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type { ConsumerOutcomeId } from "@/content/productShell";
import {
  createAdaptiveSessionProgram,
  overrideTransition,
} from "@/domain/sessions/continuumPlanner";
import type {
  AdaptiveSessionProgram,
  TransitionCurve,
} from "@/domain/sessions/types";
import {
  auditPlanAccelerated,
  createTransitionAudition,
} from "@/domain/sessions/workbench";
import {
  createQaWorkbenchDraftStore,
  DEFAULT_QA_WORKBENCH_DRAFT,
  type QaWorkbenchDraft,
} from "@/qa/qaWorkbenchPersistence";

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

function displayTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function metric(value: number | null, unit: string): string {
  return value === null ? "NOT AVAILABLE" : `${value.toFixed(2)} ${unit}`;
}

function buildProgram(draft: QaWorkbenchDraft): AdaptiveSessionProgram {
  return createAdaptiveSessionProgram({
    outcome: draft.outcome,
    durationMinutes: draft.durationMinutes,
    mode: "sound-only",
    seed: draft.seed,
    allowProvisionalMetadata: true,
  });
}

export default function AdaptiveQaWorkbench() {
  const { controller, snapshot } = useAudioSession();
  const [draft, setDraft] = useState(DEFAULT_QA_WORKBENCH_DRAFT);
  const [program, setProgram] = useState(() =>
    buildProgram(DEFAULT_QA_WORKBENCH_DRAFT),
  );
  const [selectedTransition, setSelectedTransition] = useState(0);
  const [timelineWidth, setTimelineWidth] = useState(1);
  const [cursorSeconds, setCursorSeconds] = useState(0);
  const [auditMessage, setAuditMessage] = useState("NOT RUN");
  const [operation, setOperation] = useState("Plan ready for local QA.");

  const transition = program.plan.transitions[selectedTransition];
  const outgoing = program.works[transition.outgoingSegmentIndex];
  const incoming = program.works[transition.incomingSegmentIndex];
  const playbackPosition =
    snapshot.sessionPlanId === program.plan.id
      ? program.plan.totalDurationSeconds - snapshot.remainingMs / 1000
      : cursorSeconds;

  function patchDraft(patch: Partial<QaWorkbenchDraft>): void {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function rebuild(nextDraft = draft): void {
    try {
      const next = buildProgram(nextDraft);
      setProgram(next);
      setSelectedTransition(
        Math.max(
          0,
          Math.min(next.plan.transitions.length - 1, nextDraft.transitionIndex),
        ),
      );
      setCursorSeconds(0);
      setAuditMessage("NOT RUN");
      setOperation(`Rebuilt ${next.plan.id}.`);
    } catch (error) {
      setOperation(error instanceof Error ? error.message : "Planning failed.");
    }
  }

  async function loadSaved(): Promise<void> {
    const saved = await workbenchStore.load();
    if (!saved) {
      setOperation("No valid saved QA draft.");
      return;
    }
    setDraft(saved);
    rebuild(saved);
    setOperation("Saved seed and QA controls restored.");
  }

  async function applyVariant(
    label: "A" | "B",
    durationSeconds: number,
    curve: TransitionCurve,
  ): Promise<void> {
    try {
      const variant = overrideTransition(
        buildProgram(draft),
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
      setProgram(variant);
      setCursorSeconds(nextAudition.startSeconds);
      await controller.loadAdaptiveSession(variant);
      await controller.configureAdaptiveAudition(nextAudition);
      await controller.seekAdaptiveSession(nextAudition.startSeconds);
      await controller.play();
      setOperation(
        `Audition ${label}: ${durationSeconds}s ${curve}, ${draft.auditionMode}.`,
      );
    } catch (error) {
      setOperation(
        error instanceof Error ? error.message : "Audition could not start.",
      );
    }
  }

  async function selectTransition(index: number): Promise<void> {
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
    setCursorSeconds(target);
    if (snapshot.sessionPlanId === program.plan.id) {
      await controller.configureAdaptiveAudition(
        createTransitionAudition(
          program.plan,
          next,
          draft.loopWindowSeconds,
          draft.auditionMode,
        ),
      );
      await controller.seekAdaptiveSession(target);
    }
  }

  async function scrub(event: GestureResponderEvent): Promise<void> {
    const fraction = Math.min(
      1,
      Math.max(0, event.nativeEvent.locationX / timelineWidth),
    );
    const target = fraction * program.plan.totalDurationSeconds;
    setCursorSeconds(target);
    if (snapshot.sessionPlanId === program.plan.id) {
      await controller.seekAdaptiveSession(
        Math.min(program.plan.totalDurationSeconds - 0.001, target),
      );
    }
  }

  const runAudit = (): void => {
    const result = auditPlanAccelerated(program);
    setAuditMessage(
      `${result.pass ? "PASS" : "FAIL"} · exact end ${result.exactEnd ? "yes" : "no"} · gaps ${result.noGap ? "none" : "found"} · max sources ${result.maxConcurrentSources} · ${result.inspectedIntervals} exact intervals`,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.page} testID="qa-workbench">
      <Text style={styles.sentinel}>{QA_SENTINEL}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Adaptive Sessions
      </Text>
      <Text style={styles.warning}>
        Internal browser preview. Musical transitions remain provisional until
        each handoff is approved by listening.
      </Text>

      <Section title="PLAN">
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

      <Section title="SESSION TIMELINE / SCRUBBER">
        <Text style={styles.meta}>
          {program.plan.id} · {program.plan.totalDurationSeconds / 60} MIN · 48
          kHz frames · exact end
        </Text>
        <Pressable
          accessibilityActions={[
            { name: "decrement", label: "Back ten seconds" },
            { name: "increment", label: "Forward ten seconds" },
          ]}
          accessibilityLabel="Full session scrubber"
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: 0,
            max: Math.round(program.plan.totalDurationSeconds),
            now: Math.round(playbackPosition),
          }}
          onAccessibilityAction={(event) => {
            const delta =
              event.nativeEvent.actionName === "increment" ? 10 : -10;
            const target = Math.min(
              program.plan.totalDurationSeconds - 0.001,
              Math.max(0, playbackPosition + delta),
            );
            setCursorSeconds(target);
            if (snapshot.sessionPlanId === program.plan.id) {
              void controller.seekAdaptiveSession(target);
            }
          }}
          onLayout={(event: LayoutChangeEvent) =>
            setTimelineWidth(Math.max(1, event.nativeEvent.layout.width))
          }
          onPress={(event) => void scrub(event)}
          style={styles.timeline}
        >
          {program.plan.phases.map((phase) => (
            <View
              key={phase.id}
              style={[
                styles.phase,
                {
                  flex: phase.endFrame - phase.startFrame,
                  backgroundColor: PHASE_COLOURS[phase.id],
                },
              ]}
            >
              <Text style={styles.phaseText}>{phase.id.toUpperCase()}</Text>
            </View>
          ))}
          {program.plan.transitions.flatMap((item) => [
            <Marker
              key={`start-${item.index}`}
              colour="#F7B267"
              label={`T${item.index + 1} start`}
              left={
                (item.startSeconds / program.plan.totalDurationSeconds) * 100
              }
            />,
            <Marker
              key={`end-${item.index}`}
              colour="#F4845F"
              label={`T${item.index + 1} end`}
              left={(item.endSeconds / program.plan.totalDurationSeconds) * 100}
            />,
          ])}
          <View
            pointerEvents="none"
            style={[
              styles.cursor,
              {
                left: `${Math.min(99.6, (playbackPosition / program.plan.totalDurationSeconds) * 100)}%`,
              },
            ]}
          />
        </Pressable>
        <Text style={styles.position}>
          {displayTime(playbackPosition)} /{" "}
          {displayTime(program.plan.totalDurationSeconds)}
        </Text>
        <View style={styles.actions}>
          <Action
            disabled={selectedTransition === 0}
            label="← PREVIOUS CHANGE"
            onPress={() => void selectTransition(selectedTransition - 1)}
          />
          <Action
            disabled={
              selectedTransition === program.plan.transitions.length - 1
            }
            label="NEXT CHANGE →"
            onPress={() => void selectTransition(selectedTransition + 1)}
          />
        </View>
      </Section>

      <Section title={`TRANSITION ${selectedTransition + 1}`}>
        <Text style={styles.transitionTitle}>
          {outgoing.title} → {incoming.title}
        </Text>
        <Text style={styles.meta}>
          ENTRY {displayTime(transition.startSeconds)} · EXIT{" "}
          {displayTime(transition.endSeconds)}
        </Text>
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
          {(["outgoing", "incoming", "both"] as const).map((mode) => (
            <Choice
              key={mode}
              label={mode.toUpperCase()}
              onPress={() => patchDraft({ auditionMode: mode })}
              selected={draft.auditionMode === mode}
            />
          ))}
        </View>
        <View style={styles.comparison}>
          <Variant
            curve={draft.aCurve}
            duration={draft.aDurationSeconds}
            label="A"
            onCurve={(aCurve) => patchDraft({ aCurve })}
            onDuration={(aDurationSeconds) => patchDraft({ aDurationSeconds })}
            onPlay={() =>
              void applyVariant("A", draft.aDurationSeconds, draft.aCurve)
            }
          />
          <Variant
            curve={draft.bCurve}
            duration={draft.bDurationSeconds}
            label="B"
            onCurve={(bCurve) => patchDraft({ bCurve })}
            onDuration={(bDurationSeconds) => patchDraft({ bDurationSeconds })}
            onPlay={() =>
              void applyVariant("B", draft.bDurationSeconds, draft.bCurve)
            }
          />
        </View>
        <View style={styles.actions}>
          <Action label="PAUSE" onPress={() => void controller.pause()} />
          <Action label="STOP" onPress={() => void controller.stop()} />
        </View>
      </Section>

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
        {program.plan.segments.flatMap((segment) =>
          segment.phaseRuleAudit.map((line) => (
            <Text key={`${segment.index}-${line}`} style={styles.auditLine}>
              {line}
            </Text>
          )),
        )}
        <Text style={styles.review}>{program.plan.metadataReviewStatus}</Text>
        <Text style={styles.review}>{transition.reviewStatus}</Text>
        <Action label="RUN ACCELERATED PLAN QA" onPress={runAudit} />
        <Text accessibilityLiveRegion="polite" style={styles.auditResult}>
          {auditMessage}
        </Text>
        <Pressable
          accessibilityHint="No preview exporter is connected"
          accessibilityLabel="Export preview not available"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={[styles.action, styles.disabled]}
        >
          <Text style={styles.actionText}>EXPORT PREVIEW · NOT AVAILABLE</Text>
        </Pressable>
      </Section>

      <Text accessibilityLiveRegion="polite" style={styles.operation}>
        {operation}
      </Text>
      {snapshot.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          AUDIO ERROR · {snapshot.error}
        </Text>
      ) : null}
    </ScrollView>
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
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
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

function Variant({
  curve,
  duration,
  label,
  onCurve,
  onDuration,
  onPlay,
}: {
  curve: TransitionCurve;
  duration: number;
  label: "A" | "B";
  onCurve: (value: TransitionCurve) => void;
  onDuration: (value: number) => void;
  onPlay: () => void;
}) {
  return (
    <View style={styles.variant}>
      <Text style={styles.variantTitle}>VERSION {label}</Text>
      <Text style={styles.label}>DURATION</Text>
      <View style={styles.wrap}>
        {[8, 12, 20].map((value) => (
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
      <Action label={`AUDITION ${label}`} onPress={onPlay} />
    </View>
  );
}

function Marker({
  colour,
  label,
  left,
}: {
  colour: string;
  label: string;
  left: number;
}) {
  return (
    <View
      accessibilityLabel={label}
      pointerEvents="none"
      style={[styles.marker, { backgroundColor: colour, left: `${left}%` }]}
    />
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

const PHASE_COLOURS = {
  arrival: "#294B59",
  flow: "#356A73",
  deepening: "#504E78",
  return: "#6F6A4C",
} as const;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0B1114",
    gap: 18,
    minHeight: "100%",
    padding: 24,
  },
  sentinel: {
    color: "#F7B267",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
  },
  title: { color: "#F3E9D8", fontSize: 38, fontWeight: "600" },
  warning: { color: "#AEBAB3", fontSize: 14, lineHeight: 21, maxWidth: 760 },
  section: {
    backgroundColor: "#121C20",
    borderColor: "#314047",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: "#8EA8C8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  label: {
    color: "#71807A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 4,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    alignItems: "center",
    borderColor: "#435159",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 82,
    paddingHorizontal: 12,
  },
  choiceSelected: { backgroundColor: "#294B59", borderColor: "#8EA8C8" },
  choiceText: {
    color: "#F3E9D8",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: "#091014",
    borderColor: "#435159",
    borderWidth: 1,
    color: "#F3E9D8",
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    alignItems: "center",
    backgroundColor: "#223039",
    borderColor: "#52636D",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionText: {
    color: "#F3E9D8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
  },
  disabled: { opacity: 0.36 },
  meta: { color: "#AEBAB3", fontSize: 12, lineHeight: 18 },
  timeline: {
    flexDirection: "row",
    height: 78,
    overflow: "hidden",
    position: "relative",
  },
  phase: { alignItems: "center", justifyContent: "center" },
  phaseText: {
    color: "#F3E9D8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  marker: { bottom: 0, position: "absolute", top: 0, width: 2 },
  cursor: {
    backgroundColor: "#FFFFFF",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 3,
  },
  position: { color: "#F3E9D8", fontSize: 13, fontVariant: ["tabular-nums"] },
  transitionTitle: { color: "#F3E9D8", fontSize: 23, fontWeight: "600" },
  comparison: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  variant: {
    borderColor: "#314047",
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 280,
    padding: 14,
  },
  variantTitle: {
    color: "#D4B97C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { backgroundColor: "#091014", minWidth: 150, padding: 12 },
  metricLabel: {
    color: "#71807A",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  metricValue: {
    color: "#F3E9D8",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
  },
  auditLine: { color: "#AEBAB3", fontSize: 12, lineHeight: 18 },
  review: {
    color: "#F7B267",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.55,
  },
  auditResult: { color: "#91B7A3", fontSize: 12, lineHeight: 18 },
  operation: { color: "#D4B97C", fontSize: 12, lineHeight: 18 },
  error: { color: "#D79283", fontSize: 12, lineHeight: 18 },
});

export { QA_SENTINEL };

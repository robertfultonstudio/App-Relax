import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type {
  AdaptiveSessionProgram,
  TransitionCurve,
} from "@/domain/sessions/types";
import { overrideTransition } from "@/domain/sessions/continuumPlanner";
import {
  auditPlanAccelerated,
  createTransitionAudition,
  type AuditionMode,
} from "@/domain/sessions/workbench";
import { isPwaWebSurface } from "@/domain/sessions/playbackAvailability";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { REVIEW_REVISION } from "@/content/reviewRevision";
import { PwaReviewTimeline } from "./PwaReviewTimeline";
import { reviewTime } from "./reviewTimeline";
import { IndividualTrackReviewLink } from "./IndividualTrackReview";
import { pwaDeliveryFilename } from "./pwaDeliveryFilename";
import { reviewReadSummary } from "./PwaReadProbe";

type Target =
  | {
      kind: "single";
      work: ConsumerAudioWork;
      matching: boolean;
      elapsedSeconds: number;
      error?: string | null;
    }
  | {
      kind: "adaptive";
      program: AdaptiveSessionProgram;
      matching: boolean;
      onVariant: (program: AdaptiveSessionProgram) => void;
    };
const time = (n: number) =>
  `${Math.floor(Math.max(0, n) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, n) % 60)
    .toString()
    .padStart(2, "0")}`;
export const clampReviewPosition = (value: number, duration: number) =>
  Math.max(0, Math.min(duration - 0.001, Number.isFinite(value) ? value : 0));

/** Imported only by the private PWA route root; never by native/consumer routes. */
export function PwaPlayerReviewControls({
  target,
  initiallyOpen = false,
}: {
  target: Target;
  initiallyOpen?: boolean;
}) {
  if (!isPwaWebSurface()) return null;
  return <ReviewPanel target={target} initiallyOpen={initiallyOpen} />;
}

function ReviewPanel({
  target,
  initiallyOpen,
}: {
  target: Target;
  initiallyOpen: boolean;
}) {
  const { controller, snapshot } = useAudioSession();
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => {
    if (initiallyOpen && typeof document !== "undefined")
      document
        .getElementById("development-player")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [initiallyOpen]);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [warmResult, setWarmResult] = useState<{
    key: string;
    text: string;
  } | null>(null);
  const [anchor, setAnchor] = useState({
    offset: 0,
    run: controller.getListeningRun(),
  });
  const offset =
    anchor.run === controller.getListeningRun() ? anchor.offset : 0;
  const [selected, setSelected] = useState(0);
  const [windowSeconds, setWindowSeconds] = useState<30 | 60>(30);
  const [mode, setMode] = useState<AuditionMode>("both");
  const [loop, setLoop] = useState(false);
  const [durationB, setDurationB] = useState(240);
  const [curveB, setCurveB] = useState<TransitionCurve>("equal-power");
  const [base] = useState(target.kind === "adaptive" ? target.program : null);
  const program = target.kind === "adaptive" ? target.program : null;
  const duration =
    program?.plan.totalDurationSeconds ??
    (target.kind === "single" ? target.work.durationSeconds : 0);
  const sourceFile =
    target.kind !== "single" || target.work.sourceKind === "file";
  const elapsed =
    target.kind === "single"
      ? target.elapsedSeconds
      : target.matching
        ? duration - snapshot.remainingMs / 1000
        : 0;
  const position =
    sourceFile &&
    duration > 0 &&
    target.matching &&
    ["playing", "paused"].includes(snapshot.status)
      ? target.kind === "single"
        ? (((elapsed + offset) % duration) + duration) % duration
        : Math.max(0, elapsed)
      : 0;
  const enabled =
    target.matching &&
    ["playing", "paused"].includes(snapshot.status) &&
    !busy &&
    sourceFile;
  const transition = program?.plan.transitions[selected];
  const nextTestTransition =
    program?.plan.transitions[
      selected +
        (transition &&
        position >= Math.max(0, transition.startSeconds - windowSeconds) - 0.01
          ? 1
          : 0)
    ];
  const warmAt =
    target.kind === "single"
      ? Math.max(0, duration - 5)
      : nextTestTransition
        ? Math.max(0, nextTestTransition.startSeconds - windowSeconds)
        : null;
  const reviewIdentity =
    target.kind === "single" ? target.work.id : target.program.plan.id;
  const warmKey = `${reviewIdentity}:${controller.getListeningRun()}:${warmAt}`;
  const warmMessage =
    !open || !target.matching || !sourceFile || busy || warmAt === null
      ? ""
      : snapshot.status !== "paused"
        ? "Pause to prepare the next quick test. Playback has priority."
        : warmResult?.key === warmKey
          ? warmResult.text
          : `Preparing test at ${time(warmAt)}…`;
  useEffect(() => {
    if (!open || !target.matching || !sourceFile || busy || warmAt === null) {
      return;
    }
    if (snapshot.status !== "paused") {
      return;
    }
    const abort = new AbortController();
    let active = true;
    void controller
      .prepareReviewSeek(warmAt, abort.signal)
      .then((ready) => {
        if (active)
          setWarmResult({
            key: warmKey,
            text: ready
              ? `Test at ${time(warmAt)}: network windows prepared or already available offline. Up to 8 MiB extra, no full-file download.`
              : `Test at ${time(warmAt)} may still need network. Normal seek remains available.`,
          });
      })
      .catch(() => {
        if (active)
          setWarmResult({
            key: warmKey,
            text: "Quick-test preparation stopped. Normal seek remains available.",
          });
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [
    controller,
    open,
    target.matching,
    sourceFile,
    busy,
    warmAt,
    snapshot.status,
    warmKey,
  ]);
  const audit = program ? auditPlanAccelerated(program) : null;
  useEffect(
    () => () => {
      void controller.configureAdaptiveAudition(null).catch(() => undefined);
    },
    [controller],
  );

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Review action failed. Stop and retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function seek(value: number) {
    if (!enabled) return;
    const at = clampReviewPosition(value, duration);
    void run(async () => {
      const began = performance.now();
      const readsBefore = controller.getReviewReadMetrics();
      if (target.kind === "single") {
        await controller.seekSingleTrack(at);
        setAnchor({
          offset:
            at -
            target.elapsedSeconds -
            (snapshot.remainingMs - controller.getSnapshot().remainingMs) /
              1000,
          run: controller.getListeningRun(),
        });
      } else {
        setLoop(false);
        await controller.seekAdaptiveSession(at, true);
      }
      setMessage(
        `Position ${time(at)} · seek ready in ${Math.round(performance.now() - began)} ms (audio clock lead ≤ 60 ms).` +
          reviewReadSummary(readsBefore, controller.getReviewReadMetrics()),
      );
    });
  }
  function chooseTransition(index: number) {
    if (!program || !enabled) return;
    const next = Math.max(
      0,
      Math.min(program.plan.transitions.length - 1, index),
    );
    const item = program.plan.transitions[next];
    if (!item) return;
    setSelected(next);
    seek(Math.max(0, item.startSeconds - windowSeconds));
  }
  function audition(nextMode: AuditionMode, nextWindow: 30 | 60) {
    if (!program || !transition || !enabled) return;
    void run(async () => {
      const window = createTransitionAudition(
        program.plan,
        selected,
        nextWindow,
        nextMode,
      );
      await controller.configureAdaptiveAudition(window);
      setMode(nextMode);
      setWindowSeconds(nextWindow);
      setLoop(true);
      setMessage(
        `Loop ${time(window.startSeconds)}–${time(window.endSeconds)} · ${nextMode}. Press Play if paused.`,
      );
    });
  }
  function prepareVariant(which: "A" | "B") {
    if (target.kind !== "adaptive" || !base || busy) return;
    void run(async () => {
      if (
        which === "B" &&
        (base.plan.endingStrategy === "source-file-boundary-review-only" ||
          base.plan.endingStrategy === "extended-loop-boundary-review-only")
      )
        throw new Error(
          "This whole-file review keeps exact source boundaries. Changing one fade would cut or repeat music; use transition seek and outgoing/incoming audition instead.",
        );
      const next =
        which === "A"
          ? base
          : overrideTransition(base, selected, durationB, curveB);
      if (!auditPlanAccelerated(next).pass)
        throw new Error("Variant rejected: timeline or overlap safety failed.");
      await controller.configureAdaptiveAudition(null);
      await controller.stop();
      setLoop(false);
      target.onVariant(next);
      setMessage(
        `Variant ${which} prepared. Press Play, then Jump to change. No listening approval implied.`,
      );
    });
  }
  return (
    <View
      nativeID="development-player"
      style={styles.panel}
      testID="private-player-review"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Development review controls"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.headingButton}
      >
        <Text style={styles.heading}>
          DEVELOPMENT REVIEW {open ? "−" : "+"}
        </Text>
      </Pressable>
      {!open && (
        <Text style={styles.small}>
          Loop points · all playlist joins · seek & audition
        </Text>
      )}
      {open && (
        <View style={styles.content}>
          <Text style={styles.text}>
            Private test controls · not part of the released app.
          </Text>
          <Text style={styles.text}>{REVIEW_REVISION}</Text>
          <IndividualTrackReviewLink />
          {warmMessage ? (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              {warmMessage}
            </Text>
          ) : null}
          {(target.kind === "single" ? target.error : snapshot.error) ? (
            <Text selectable style={styles.text}>
              Technical detail:{" "}
              {target.kind === "single" ? target.error : snapshot.error}
            </Text>
          ) : null}
          {program?.plan.endingStrategy ===
            "extended-loop-boundary-review-only" && (
            <Text style={styles.text}>
              90-minute review · eight music works in order. Two middle passages
              play twice in full; their loop points are marked below. Loop and
              transition listening approval is pending.
            </Text>
          )}
          {target.kind === "single" ? (
            <Text style={styles.text} testID="review-source-file">
              {target.matching ? "Active track" : "Selected track"}:{" "}
              {target.work.title}
              {"\n"}
              {target.work.localPreviewFilename ??
                target.work.sourceFilename ??
                "Generated sound"}
              {sourceFile
                ? `\nOnline lossless file: ${pwaDeliveryFilename(target.work)}\nA verified saved copy may play offline instead; its PCM is unchanged.`
                : ""}
            </Text>
          ) : null}
          {!enabled && (
            <Text style={styles.text}>
              {busy
                ? "Applying…"
                : sourceFile
                  ? "Press Play once to load this sound, then pause or seek freely."
                  : "This generator has no file position or recorded loop boundary."}
            </Text>
          )}
          {sourceFile && (
            <>
              <ReviewRange
                duration={duration}
                position={position}
                disabled={!enabled}
                onSeek={seek}
              />
              <Text style={styles.text}>
                {target.kind === "single"
                  ? "File position"
                  : "Session position"}{" "}
                · {time(position)} / {time(duration)}
              </Text>
              <View style={styles.row}>
                {
                  <ReviewButton
                    key={"Back 30 seconds"}
                    label={"Back 30 seconds"}
                    onPress={() => seek(position - 30)}
                    disabled={!enabled}
                    active={false}
                  />
                }
                {
                  <ReviewButton
                    key={"Forward 30 seconds"}
                    label={"Forward 30 seconds"}
                    onPress={() => seek(position + 30)}
                    disabled={!enabled}
                    active={false}
                  />
                }
                {target.kind === "single" && (
                  <ReviewButton
                    label="Last 5 seconds · loop test"
                    onPress={() => seek(duration - 5)}
                    disabled={!enabled}
                    active={false}
                  />
                )}
                {target.kind === "single" && (
                  <ReviewButton
                    key={"Last 15 seconds · loop test"}
                    label={"Last 15 seconds · loop test"}
                    onPress={() => seek(duration - 15)}
                    disabled={!enabled}
                    active={false}
                  />
                )}
              </View>
            </>
          )}
          {target.kind === "single" && sourceFile && (
            <View style={styles.row}>
              <ReviewButton
                label="Source entry · 00:00"
                onPress={() => seek(0)}
                disabled={!enabled}
                active={false}
              />
              <ReviewButton
                label={`Source loop seam · ${reviewTime(duration)} → 00:00`}
                onPress={() => seek(duration - 15)}
                disabled={!enabled}
                active={false}
              />
            </View>
          )}
          {target.kind === "single" && (
            <Text style={styles.text}>
              {target.work.cycle
                ? "Hatha loop test: this file repeats alone, independently of complete-practice transitions."
                : "One recording repeats. Complete Hatha practice has a separate transition review."}
              {sourceFile
                ? " Play once → Pause → Last 5 seconds → Play. Judge only the return to 00:00, not the repositioning pause. No crossfade or added ambience masks this source seam. The 15-second option gives more context. Repeat with the same button; no automatic listening verdict."
                : ""}
            </Text>
          )}
          {program && transition && (
            <>
              <Text style={styles.heading}>
                CHANGE {selected + 1} / {program.plan.transitions.length} ·{" "}
                {transition.lane === "nature" ? "AMBIENCE" : "SOUND"}
              </Text>
              <Text style={styles.text}>
                {
                  program.works.find(
                    (w) =>
                      w.id ===
                      program.plan.segments.find(
                        (s) => s.index === transition.outgoingSegmentIndex,
                      )?.workId,
                  )?.title
                }{" "}
                →{" "}
                {
                  program.works.find(
                    (w) =>
                      w.id ===
                      program.plan.segments.find(
                        (s) => s.index === transition.incomingSegmentIndex,
                      )?.workId,
                  )?.title
                }
              </Text>
              <Text style={styles.text}>
                Start {time(transition.startSeconds)} · End{" "}
                {time(transition.endSeconds)} · {transition.durationSeconds}s ·{" "}
                {transition.curve}
              </Text>
              <View style={styles.row}>
                {
                  <ReviewButton
                    key={"Previous change"}
                    label={"Previous change"}
                    onPress={() => chooseTransition(selected - 1)}
                    disabled={!enabled || selected === 0}
                    active={false}
                  />
                }
                {
                  <ReviewButton
                    key={"Jump to change"}
                    label={"Jump to change"}
                    onPress={() => chooseTransition(selected)}
                    disabled={!enabled}
                    active={false}
                  />
                }
                {
                  <ReviewButton
                    key={"Next change"}
                    label={"Next change"}
                    onPress={() => chooseTransition(selected + 1)}
                    disabled={
                      !enabled ||
                      selected === program.plan.transitions.length - 1
                    }
                    active={false}
                  />
                }
              </View>
              <View style={styles.row}>
                {
                  <ReviewButton
                    key={"Loop ±30 seconds"}
                    label={"Loop ±30 seconds"}
                    onPress={() => audition(mode, 30)}
                    disabled={!enabled}
                    active={loop && windowSeconds === 30}
                  />
                }
                {
                  <ReviewButton
                    key={"Loop ±60 seconds"}
                    label={"Loop ±60 seconds"}
                    onPress={() => audition(mode, 60)}
                    disabled={!enabled}
                    active={loop && windowSeconds === 60}
                  />
                }
                {
                  <ReviewButton
                    key={"Exit loop"}
                    label={"Exit loop"}
                    onPress={() => {
                      void run(async () => {
                        await controller.configureAdaptiveAudition(null);
                        setLoop(false);
                      });
                    }}
                    disabled={!enabled || !loop}
                    active={false}
                  />
                }
              </View>
              <View style={styles.row}>
                {(["outgoing", "incoming", "both"] as const).map((value) => (
                  <ReviewButton
                    key={`Hear ${value}`}
                    label={`Hear ${value}`}
                    onPress={() => audition(value, windowSeconds)}
                    disabled={!enabled}
                    active={mode === value}
                  />
                ))}
              </View>
              {program.plan.endingStrategy !==
                "source-file-boundary-review-only" &&
              program.plan.endingStrategy !==
                "extended-loop-boundary-review-only" ? (
                <>
                  <Text style={styles.heading}>
                    A / B · CHANGE DURATION & CURVE
                  </Text>
                  <View style={styles.row}>
                    {[60, 120, 180, 240, 300].map((value) => (
                      <ReviewButton
                        key={`${value} seconds`}
                        label={`${value} seconds`}
                        onPress={() => setDurationB(value)}
                        disabled={busy}
                        active={durationB === value}
                      />
                    ))}
                  </View>
                  <View style={styles.row}>
                    {(["equal-power", "linear"] as const).map((value) => (
                      <ReviewButton
                        key={value}
                        label={value}
                        onPress={() => setCurveB(value)}
                        disabled={busy}
                        active={curveB === value}
                      />
                    ))}
                  </View>
                  <View style={styles.row}>
                    {
                      <ReviewButton
                        key={"Restore A"}
                        label={"Restore A"}
                        onPress={() => prepareVariant("A")}
                        disabled={busy}
                        active={false}
                      />
                    }
                    {
                      <ReviewButton
                        key={"Prepare B"}
                        label={"Prepare B"}
                        onPress={() => prepareVariant("B")}
                        disabled={busy}
                        active={false}
                      />
                    }
                  </View>
                  <Text style={styles.text}>
                    Changing variant stops playback. Press Play deliberately to
                    begin the new variant.
                  </Text>
                </>
              ) : (
                <Text style={styles.text}>
                  Whole-file review: fade durations preserve complete tracks and
                  the selected session length. Use seek and outgoing/incoming
                  audition to review each change. Musical approval is still
                  required.
                </Text>
              )}
              <Text style={styles.text}>
                Conservative overlap peak:{" "}
                {transition.clippingRiskDbtp?.toFixed(1) ?? "unknown"} dBTP ·
                not a live meter. Accelerated plan check:{" "}
                {audit?.pass ? "PASS" : "FAIL"}.
              </Text>
              <Text style={styles.text}>
                Rule: {transition.ruleAudit.join(" · ")}
              </Text>
              <Text style={styles.small} selectable>
                Seed: {program.plan.seed}
              </Text>
            </>
          )}
          {message && (
            <Text accessibilityLiveRegion="polite" style={styles.text}>
              {message}
            </Text>
          )}
          {program && (
            <PwaReviewTimeline
              program={program}
              disabled={!enabled}
              position={position}
              onSeek={seek}
              onTransition={chooseTransition}
            />
          )}
        </View>
      )}
    </View>
  );
}

function ReviewButton({
  label,
  onPress,
  disabled,
  active,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  active: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        active && styles.active,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function ReviewRange({
  duration,
  position,
  disabled,
  onSeek,
}: {
  duration: number;
  position: number;
  disabled: boolean;
  onSeek: (n: number) => void;
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const dragging = useRef(false);
  const commit = (event: SyntheticEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    setPreview(null);
    onSeek(value);
  };
  return (
    <input
      aria-label="Review position"
      type="range"
      min={0}
      max={Math.max(0, duration - 0.001)}
      step={0.1}
      value={preview ?? position}
      disabled={disabled}
      onPointerDown={() => {
        dragging.current = true;
        setPreview(position);
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        dragging.current = false;
        commit(event);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setPreview(null);
      }}
      onChange={(event) => {
        // Keyboard / VoiceOver value changes have no pointer-up event.
        if (dragging.current) setPreview(Number(event.currentTarget.value));
        else commit(event);
      }}
      style={{
        width: "100%",
        minHeight: 48,
        accentColor: editorial.ink,
        margin: 0,
      }}
    />
  );
}
const styles = StyleSheet.create({
  panel: {
    borderTopWidth: 1,
    borderColor: editorial.line,
    marginTop: 24,
    paddingTop: 8,
  },
  headingButton: { minHeight: 48, justifyContent: "center" },
  heading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: editorial.ink,
  },
  content: { gap: 12 },
  text: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: editorial.ink,
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 18,
    color: editorial.ink,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: editorial.line,
    justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.sans, fontSize: 13, color: editorial.ink },
  active: { backgroundColor: "#C8DDD5" },
  disabled: { opacity: 0.45 },
});

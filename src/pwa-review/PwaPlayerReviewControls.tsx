import { useEffect, useMemo, useRef, useState } from "react";
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
import { reviewTime, reviewMarkers } from "./reviewTimeline";
import { ReviewDock } from "./ReviewDock";
import { IndividualTrackReviewLink } from "./IndividualTrackReview";
import { pwaDeliveryFilename } from "./pwaDeliveryFilename";
import { reviewReadSummary } from "./PwaReadProbe";
import { PwaReviewScrubber } from "./PwaReviewScrubber";

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
const time = reviewTime;
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
  const { controller } = useAudioSession();
  const [variantOrigin, setVariantOrigin] = useState<{
    id: string;
    base: AdaptiveSessionProgram;
  } | null>(null);
  const identity =
    target.kind === "single" ? target.work.id : target.program.plan.id;
  useEffect(() => {
    if (isPwaWebSurface() && initiallyOpen && typeof document !== "undefined")
      document
        .getElementById("development-player")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [initiallyOpen, identity]);
  if (!isPwaWebSurface()) return null;
  const base =
    target.kind === "adaptive"
      ? variantOrigin?.id === identity
        ? variantOrigin.base
        : target.program
      : null;
  const reviewTarget: Target =
    target.kind === "adaptive" && base
      ? {
          ...target,
          onVariant(next) {
            setVariantOrigin({ id: next.plan.id, base });
            target.onVariant(next);
          },
        }
      : target;
  return (
    <ReviewPanel
      key={`${identity}:${target.kind === "adaptive" ? (target.program.plan.natureMix?.enabled === false ? "off" : (target.program.plan.natureMix?.selectedFamily ?? "off")) : "single"}:${controller.getListeningRun()}`}
      target={reviewTarget}
      initiallyOpen={initiallyOpen}
      base={base}
    />
  );
}

type ReviewCommand = {
  label: string;
  action: () => Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
};

function ReviewPanel({
  target,
  initiallyOpen,
  base,
}: {
  target: Target;
  initiallyOpen: boolean;
  base: AdaptiveSessionProgram | null;
}) {
  const { controller, snapshot } = useAudioSession();
  const [open, setOpen] = useState(initiallyOpen);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  // At most one operation in flight and one latest intention. Never send a
  // backlog of obsolete decoder seeks, and never silently drop the last tap.
  const pendingCommand = useRef<ReviewCommand | null>(null);
  const activeCommand = useRef<ReviewCommand | null>(null);
  const mounted = useRef(true);
  const requestedPosition = useRef<number | null>(null);
  const requestedTransition = useRef(0);
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
  const auditionState = useRef({
    selected: 0,
    windowSeconds: 30 as 30 | 60,
    mode: "both" as AuditionMode,
    loop: false,
  });
  const [durationB, setDurationB] = useState(240);
  const [curveB, setCurveB] = useState<TransitionCurve>("equal-power");
  const sourceProgram = target.kind === "adaptive" ? target.program : null;
  const program = useMemo(
    () =>
      sourceProgram?.plan.natureMix?.enabled === false
        ? {
            ...sourceProgram,
            plan: {
              ...sourceProgram.plan,
              segments: sourceProgram.plan.segments.filter(
                (s) => s.lane !== "nature",
              ),
              transitions: sourceProgram.plan.transitions.filter(
                (t) => t.lane !== "nature",
              ),
            },
          }
        : sourceProgram,
    [sourceProgram],
  );
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
    sourceFile;
  const transition = program?.plan.transitions[selected];
  const markers = useMemo(
    () => (program ? reviewMarkers(program) : []),
    [program],
  );
  const previousPoint = [...markers]
    .reverse()
    .find((m) => m.seconds < position - 0.1);
  const nextPoint = markers.find((m) => m.seconds > position + 0.1);
  useEffect(() => {
    if (enabled) return;
    const cancelled = new Error(
      "Review cancelled because playback stopped or changed.",
    );
    pendingCommand.current?.reject(cancelled);
    pendingCommand.current = null;
    activeCommand.current?.reject(cancelled);
  }, [enabled]);
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
        ? nextTestTransition.startSeconds
        : null;
  const reviewIdentity =
    target.kind === "single" ? target.work.id : target.program.plan.id;
  const warmKey = `${reviewIdentity}:${controller.getListeningRun()}:${warmAt}`;
  const warmMessage =
    !open || !target.matching || !sourceFile || busy || warmAt === null
      ? ""
      : snapshot.status !== "paused"
        ? "You can seek during playback. Pause is optional for preparing the next test."
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
  const audit = useMemo(
    () => (program ? auditPlanAccelerated(program) : null),
    [program],
  );
  useEffect(() => {
    mounted.current = true;
    const run = controller.getListeningRun();
    return () => {
      mounted.current = false;
      pendingCommand.current?.resolve();
      pendingCommand.current = null;
      if (controller.getListeningRun() === run)
        void controller.configureAdaptiveAudition(null).catch(() => undefined);
    };
  }, [controller]);

  function run(
    action: () => Promise<void>,
    label = "Applying review setting…",
  ): Promise<void> {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    const completion = new Promise<void>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    // Buttons need no Promise consumer; the scrubber awaits this same result
    // to roll back its optimistic position on a decoder failure.
    void completion.catch(() => undefined);
    const submitted = { action, label, resolve, reject };
    if (lock.current) {
      // The decoder may finish its in-flight seek, but a thumb waiting for
      // that superseded target must not remain pinned there after a button
      // chooses another point.
      activeCommand.current?.reject(
        new Error("Review request superseded by a newer command."),
      );
      pendingCommand.current?.reject(
        new Error("Review request superseded by a newer command."),
      );
      pendingCommand.current = submitted;
      setMessage(`${label} Latest request queued; no repeated backlog.`);
      return completion;
    }
    lock.current = true;
    setBusy(true);
    void drain(submitted);
    return completion;
  }

  async function drain(submitted: ReviewCommand) {
    try {
      let command: ReviewCommand | null = submitted;
      while (command && mounted.current) {
        activeCommand.current = command;
        setMessage(command.label);
        try {
          await command.action();
          command.resolve();
        } catch (error) {
          command.reject(error);
          if (mounted.current)
            setMessage(
              error instanceof Error
                ? error.message
                : "Review action failed. Stop and retry.",
            );
          pendingCommand.current?.reject(error);
          pendingCommand.current = null;
          requestedTransition.current = auditionState.current.selected;
          break;
        }
        command = pendingCommand.current;
        pendingCommand.current = null;
      }
    } finally {
      lock.current = false;
      activeCommand.current = null;
      requestedPosition.current = null;
      requestedTransition.current = auditionState.current.selected;
      if (mounted.current) setBusy(false);
    }
  }
  function seek(value: number, transitionIndex?: number) {
    if (!enabled) return;
    const at = clampReviewPosition(value, duration);
    requestedPosition.current = at;
    return run(
      async () => {
        const began = performance.now();
        const readsBefore = controller.getReviewReadMetrics();
        if (target.kind === "single") {
          await controller.seekSingleTrack(at);
          if (!mounted.current) return;
          setAnchor({
            offset:
              at -
              target.elapsedSeconds -
              (snapshot.remainingMs - controller.getSnapshot().remainingMs) /
                1000,
            run: controller.getListeningRun(),
          });
        } else {
          await controller.seekAdaptiveSession(at, true);
          if (!mounted.current) return;
          setLoop(false);
          setMode("both");
          auditionState.current.loop = false;
          auditionState.current.mode = "both";
          const nextJoin =
            program?.plan.transitions.findIndex((t) => t.endSeconds >= at) ??
            -1;
          const resolvedTransition =
            transitionIndex ??
            (nextJoin >= 0
              ? nextJoin
              : Math.max(0, (program?.plan.transitions.length ?? 1) - 1));
          if (program?.plan.transitions.length) {
            setSelected(resolvedTransition);
            auditionState.current.selected = resolvedTransition;
          }
        }
        setMessage(
          `Ready at ${time(at)} · seek ${Math.round(performance.now() - began)} ms.` +
            reviewReadSummary(readsBefore, controller.getReviewReadMetrics()),
        );
      },
      `Loading the point ${time(at)}…`,
    );
  }
  function chooseTransition(
    index: number,
    point: "start" | "end" | "preview" = "start",
  ) {
    if (!program || !enabled) return;
    const next = Math.max(
      0,
      Math.min(program.plan.transitions.length - 1, index),
    );
    const item = program.plan.transitions[next];
    if (!item) return;
    requestedTransition.current = next;
    seek(
      point === "end"
        ? item.endSeconds
        : Math.max(0, item.startSeconds - (point === "preview" ? 30 : 0)),
      next,
    );
  }
  function audition(nextWindow: 30 | 60) {
    if (!program || !transition || !enabled) return;
    void run(
      async () => {
        const nextMode = auditionState.current.mode;
        const window = createTransitionAudition(
          program.plan,
          auditionState.current.selected,
          nextWindow,
          nextMode,
        );
        await controller.configureAdaptiveAudition(window);
        if (!mounted.current) return;
        setMode(nextMode);
        setWindowSeconds(nextWindow);
        setLoop(true);
        auditionState.current = {
          ...auditionState.current,
          mode: nextMode,
          windowSeconds: nextWindow,
          loop: true,
        };
        setMessage(
          `Loop ready ${time(window.startSeconds)}–${time(window.endSeconds)} · ${nextMode}. Press Play if paused.`,
        );
      },
      `Loading loop around change ${selected + 1}…`,
    );
  }
  function chooseMode(nextMode: AuditionMode) {
    if (!program || !transition || !enabled) return;
    return run(async () => {
      const state = auditionState.current;
      const window = createTransitionAudition(
        program.plan,
        state.selected,
        state.windowSeconds,
        nextMode,
      );
      await controller.configureAdaptiveAudition(window, {
        preservePosition: true,
        loop: state.loop,
      });
      if (!mounted.current) return;
      setMode(nextMode);
      auditionState.current.mode = nextMode;
      setMessage(
        `Hearing ${nextMode} · change ${state.selected + 1}. Position and ${state.loop ? "loop" : "continuous playback"} unchanged.`,
      );
    }, `Changing audition to ${nextMode}…`);
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
          Loop points · all session joins · seek & audition
        </Text>
      )}
      {open && (
        <View style={styles.content}>
          <IndividualTrackReviewLink />
          {program && (
            <PwaReviewTimeline
              program={program}
              disabled={!enabled}
              position={position}
              onSeek={seek}
              onTransition={chooseTransition}
              playing={snapshot.status === "playing"}
              readPosition={controller.getAdaptiveReviewPosition}
            />
          )}
          <ReviewDock
            position={position}
            duration={duration}
            enabled={enabled}
            playing={snapshot.status === "playing"}
            readPosition={
              program ? controller.getAdaptiveReviewPosition : undefined
            }
            onSeek={seek}
            status={`${busy ? "Loading point…" : snapshot.status} · ${loop ? "Review loop" : "Continuous"}${transition ? ` · Change ${selected + 1}/${program!.plan.transitions.length}` : " · Individual track"}`}
            actions={[
              {
                label: "Dock previous marker",
                short: "Previous",
                disabled: !previousPoint,
                run: () => previousPoint && seek(previousPoint.seconds),
              },
              {
                label: "Dock next marker",
                short: "Next",
                disabled: !nextPoint,
                run: () => nextPoint && seek(nextPoint.seconds),
              },
              {
                label: "Dock transition start",
                short: "Join start",
                disabled: !transition,
                run: () => chooseTransition(selected, "start"),
              },
              {
                label: "Dock transition end",
                short: "Join end",
                disabled: !transition,
                run: () => chooseTransition(selected, "end"),
              },
              {
                label: "Dock review loop",
                short: !program ? "Test seam" : loop ? "Exit loop" : "Loop",
                active: loop,
                run: () => {
                  if (!program) {
                    void seek(Math.max(0, duration - 5));
                    return;
                  }
                  if (!loop) {
                    audition(30);
                    return;
                  }
                  void run(async () => {
                    await controller.configureAdaptiveAudition(null);
                    setLoop(false);
                    setMode("both");
                    auditionState.current.loop = false;
                    auditionState.current.mode = "both";
                  });
                },
              },
            ]}
          />
          <details>
            <summary
              style={{
                fontSize: 15,
                fontFamily: fonts.sansSemiBold,
                padding: "14px 0",
                cursor: "pointer",
                color: editorial.ink,
              }}
            >
              <Text style={styles.text}>
                Audition, source details & diagnostics
              </Text>
            </summary>
            <Text style={styles.text}>
              Private test controls · not part of the released app.
            </Text>
            <Text style={styles.text}>{REVIEW_REVISION}</Text>
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
                90-minute review · eight music works in order. Two middle
                passages play twice in full; their loop points are marked below.
                Loop and transition listening approval is pending.
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
                {sourceFile
                  ? "Press Play once to load this sound, then pause or seek freely."
                  : "This generator has no file position or recorded loop boundary."}
              </Text>
            )}
            {sourceFile && (
              <>
                {message ? (
                  <Text accessibilityLiveRegion="polite" style={styles.text}>
                    {message}
                  </Text>
                ) : null}
                {target.kind === "single" && (
                  <PwaReviewScrubber
                    duration={duration}
                    position={position}
                    disabled={!enabled}
                    onSeek={seek}
                  />
                )}
                {target.kind === "single" && (
                  <Text style={styles.text}>
                    File position · {time(position)} / {time(duration)}
                  </Text>
                )}
                <View style={styles.row}>
                  {
                    <ReviewButton
                      key={"Back 30 seconds"}
                      label={"Back 30 seconds"}
                      onPress={() =>
                        seek((requestedPosition.current ?? position) - 30)
                      }
                      disabled={!enabled}
                      active={false}
                    />
                  }
                  {
                    <ReviewButton
                      key={"Forward 30 seconds"}
                      label={"Forward 30 seconds"}
                      onPress={() =>
                        seek((requestedPosition.current ?? position) + 30)
                      }
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
                  label={`Preview source loop · 15 seconds before ${reviewTime(duration)} → 00:00`}
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
                  SELECTED CHANGE {selected + 1} /{" "}
                  {program.plan.transitions.length} ·{" "}
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
                  {time(transition.endSeconds)} ·{" "}
                  {transition.durationSeconds.toFixed(2)}s · {transition.curve}
                </Text>
                <Text style={styles.small}>
                  Jump lands exactly at the start. Preview includes 30 seconds
                  before it; loop repeats the complete fade plus its margins.
                </Text>
                <View style={styles.row}>
                  {
                    <ReviewButton
                      key={"Previous change"}
                      label={"Previous change"}
                      onPress={() =>
                        chooseTransition(requestedTransition.current - 1)
                      }
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
                      onPress={() =>
                        chooseTransition(requestedTransition.current + 1)
                      }
                      disabled={
                        !enabled ||
                        selected === program.plan.transitions.length - 1
                      }
                      active={false}
                    />
                  }
                </View>
                <View style={styles.row}>
                  <ReviewButton
                    label="Preview change · 30 seconds before"
                    onPress={() => chooseTransition(selected, "preview")}
                    disabled={!enabled}
                    active={false}
                  />
                  <ReviewButton
                    label="Jump to change end"
                    onPress={() => chooseTransition(selected, "end")}
                    disabled={!enabled}
                    active={false}
                  />
                </View>
                <View style={styles.row}>
                  {
                    <ReviewButton
                      key={"Loop ±30 seconds"}
                      label={"Loop ±30 seconds"}
                      onPress={() => audition(30)}
                      disabled={!enabled}
                      active={loop && windowSeconds === 30}
                    />
                  }
                  {
                    <ReviewButton
                      key={"Loop ±60 seconds"}
                      label={"Loop ±60 seconds"}
                      onPress={() => audition(60)}
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
                          if (!mounted.current) return;
                          setLoop(false);
                          setMode("both");
                          auditionState.current.loop = false;
                          auditionState.current.mode = "both";
                          setMessage(
                            "Loop off · hearing both. Position unchanged.",
                          );
                        });
                      }}
                      disabled={!enabled || (!loop && mode === "both")}
                      active={false}
                    />
                  }
                </View>
                <View style={styles.row}>
                  {(["outgoing", "incoming", "both"] as const).map((value) => (
                    <ReviewButton
                      key={`Hear ${value}`}
                      label={`Hear ${value}`}
                      onPress={() => chooseMode(value)}
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
                      Changing variant stops playback. Press Play deliberately
                      to begin the new variant.
                    </Text>
                  </>
                ) : (
                  <Text style={styles.text}>
                    Whole-file review: fade durations preserve complete tracks
                    and the selected session length. Use seek and
                    outgoing/incoming audition to review each change. Musical
                    approval is still required.
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
          </details>
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
      onPress={() => {
        onPress();
      }}
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

const styles = StyleSheet.create({
  panel: {
    paddingBottom: 200,
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

# D-107 — adjacent timeline transport and lower review overhead

14 September 2026. Robert requests the slider immediately below the stepped
source diagram, a playhead that follows dragging and playback, smoother review
controls and lower audio-loading latency. This is a private-PWA change only.

## Scope and existing work

[F] Canonical HEAD is 53b506b. The 31 uncommitted D-106 paths were inspected and
preserved; no new canonical commit, staging, GitHub push, audio upload, APK/EAS,
dependency install, service, access-policy change or protected Strategy edit.

## Implementation

- [F] Each music/nature diagram now owns its adjacent seek control. Diagram,
  thumb and timestamp use one local preview value through drag, asynchronous
  seek and rollback. A gesture submits one actual seek on release.
- [F] The controller exposes a read-only actual adaptive-driver position.
  The visible transport samples it at no more than 30fps; it does not invent
  elapsed time or alter audio scheduling. Hidden/offscreen transports stop
  sampling; Pause/unmount cleans up. Reduce Motion keeps 500ms updates.
- [F] Source bars and detailed marker lists are memoized separately from the
  moving playhead; plan audit is recomputed only when the program changes.
- [F] Concurrent FLAC index consumers share one verified request. Cancellation
  is per consumer; the request is aborted only when all consumers leave.
  Abandoned completions cannot poison the cache or remove a newer request.
  Existing index/range cache limits are unchanged. Distinct cold sources still
  require their own index/header/PCM requests; this is not zero-latency delivery.
- [U] Lower rendering overhead is an implementation fact, not a measured
  iPhone frame-rate, battery or perceived-latency claim.

## Verification

[F] Fresh regression: 97 suites / 730 tests PASS, including 294 audio tests
in 26 suites. Lint, typecheck, targeted Prettier, asset safety, project config,
QA/PWA boundary and git diff whitespace checks PASS. Credential-signature scan:
483 source/test/doc/export text files, zero matches; this is a scoped scan.
No new dependency. D-106 Doctor/native export evidence is historical and was
not rerun or relabelled as D-107 device evidence.

[F] Fresh web export `dist/pwa-d107`: 184 files, 12,455,723 bytes, no audio.
Precache: 161 files / 8,375,135 bytes, revision
`4637f06758a4dd0393bfaab2ecbd7db9dafe2e8d72a225c16e74f425eda02904`.
PWA validator PASS. Existing hosting tests 17/17 and isolated site build PASS.

[F] Codex in-app browser, local static server: visible PLAYER-REVIEW.26,
Hatha 90 min + Rain Playing. Real pointer drag to 44:52.10 shows the line and
thumb together while seeking; measured seek 252ms in that local run. DOM
confirms the slider immediately follows the overview; subsequent actual-clock
position 2705s / line 50.0933%, Pause holds, resumed position advances to
2738.8s / line 50.7191%. Screenshots inspected at mobile width 401px. Native
browser range has a 48px touch target. This is not an iPhone finger test.
Local playback stopped and temporary static server shut down.

## Private publication

[F] Isolated Sites source `2999ae4604c62e3d91b687f88a0a51fce26bd413` pushed
only to the existing Sites repository. Saved version 37; 184 static resources.
Worker, audio catalog, AUDIO binding, closed import endpoint and audience
unchanged. No GitHub push or canonical commit. The prior generated public
directory is recoverable in `/tmp/app-relax-d107-site-backup.xmGkcy/public`.

[F] Deployment `appgdep_6aa7c4e7252481919747173efeedd258` succeeded
2026-09-14 09:57:07 UTC, environment revision 6. Fresh access read: owner,
one allowed user, zero groups/external visitors, unchanged policy revision 1.
All 184 hosted resources match the export: 105 byte-identical assets and
79 HTML documents with only the known platform Cloudflare script insertion.

[F] Hosted Codex browser: PLAYER-REVIEW.26, Hatha 90 min + Rain Playing.
Actual pointer drag to 44:52.10 moves the line and thumb together immediately;
audio seek completes in 1054ms (2 source opens, 3 HTTP range attempts, zero
range-memory hits). Advancing position 2708.6s / line 50.1591%; slider is the
diagram's immediate next sibling. Desktop screenshots visibly confirm
alignment and unchanged paper interface. Cold latency therefore remains
nonzero; local and hosted timings are not interchangeable or a benchmark of
the same cache state. A subsequent small keyboard seek while Paused to
45:08.80 completed in 23ms with no source opens, PCM reads or HTTP requests.
This is a warm nearby seek, not evidence that every transition is that fast.
Playback stopped after verification. No phone listening claim.

## Completion audit — published revision frozen for the phone test

[F] Follow-up goal audit rechecked the current worktree (35 uncommitted
paths, nothing staged), canonical HEAD 53b506b and live Sites37 owner-only.
The preceding goal turn made progress: D-107 was implemented, tested and
published; it was not a completed phone-acceptance gate.

[F] Additional live check on PLAYER-REVIEW.26: Hatha90 Rain → Ocean waves
→ Rain remains Playing, with main volume 80% and ambience 50%. Pause and
Loop ±30 prepare the exact first-change window 05:22.79–08:15.75. Exiting
that window keeps position 05:22.79 and disables Exit loop. Stop finishes
the test. No new deployment, source change, audio upload or running local
server was needed for this audit.

[F] The retained test report explicitly covers gesture preview/rollback,
pointer/touch cancellation, keyboard/VoiceOver commands, hidden/Reduce Motion
clock updates, shared-index cancellation/integrity/retry, full entry fade
after readiness and exact join/preview/window separation. Unit coverage is
not substituted for an actual iPhone touch or listening run.

[U] Full objective completion is not proved. The remaining acceptance gate
is the user's iPhone test of PLAYER-REVIEW.26: perceived fade, loop/join
continuity, finger responsiveness and acceptable cold-start/seek latency.
The observed 1054ms cold seek does not prove near-zero latency. Background,
offline reopen and prolonged device playback are not newly certified.
No further speculative change is justified while awaiting this feedback.

[U] iPhone listening, perceived responsiveness, low-end-device CPU/battery,
background and actual cold-network latency: NON DETERMINATO — EVIDENZA
INSUFFICIENTE until a new phone test. No promise of zero network latency.

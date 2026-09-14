# D-105 — Private PWA updater, visible review and iPhone Play

14 September 2026 · `PLAYER-REVIEW.23`.

## Report and scope

[F] Robert reported no audible playback and no visible development timeline
on the phone. His screenshot contains the updater error
`Cannot update a null/nonexistent service worker registration`.
The browser test in Codex, including Play, was explicitly authorized.
This fixes the existing owner-only PWA; no APK/EAS, audio import, new service,
access change, canonical app commit or push is included.

## Diagnosis and changes

- [F] On the exact private hostname the shell deliberately unregisters the
  root service worker. The update page instead registered it then called
  `update()`, racing another open app tab. The private update path now only
  retires an existing same-origin root registration, tolerates concurrent
  retirement and opens Home online. Other-host update behavior is preserved.
  No cache, OPFS audio, storage or settings are deleted.
- [F] Review was closed on ordinary Play; the nature-mixed player also
  ignored the explicit `review=1` parameter. Private single and adaptive
  players now open their review panel by default, including Rain/Ocean.
  Explicit `review=0` remains respected, including in-place query changes.
  Native consumer navigation is unchanged.
- [F] Existing production logs show authenticated iPhone requests around
  01:20–01:21 UTC receiving music and Rain byte ranges with HTTP 206. This
  does not prove audible playback, but does not support missing audio as
  the explanation for this incident.
- [I] Missing iOS playback-category selection can explain silence despite
  advancing Web Audio in silent mode. Play now feature-detects and requests
  `navigator.audioSession.type = "playback"` synchronously, before context
  creation/resume. An unavailable or throwing optional API cannot block Play.
  No microphone, dummy sound, codec change or master modification is used.

Primary evidence: [WebKit developer explanation for iOS 17+](https://bugs.webkit.org/show_bug.cgi?id=237322#c6)
and the [W3C Audio Session draft](https://www.w3.org/TR/audio-session/).
[U] The user's ringer mode and whether the phone timer advanced have not been
confirmed. The iPhone silence cause and the success of this fix on that
device remain `NON DETERMINATO — EVIDENZA INSUFFICIENTE` until re-tested.

## Local evidence

- [F] Node 22.23.1; no global/system installation.
- [F] TypeScript and ESLint: PASS. Targeted Prettier: PASS.
- [F] Final Jest: 91 suites, 667 tests PASS; `dist/d105-jest-final.json`.
  New coverage includes private update retirement/no registration,
  concurrent retirement, foreign scope rejection, non-destructive fallback,
  playback category ordering/idempotence/failure and review visibility.
- [F] Site Worker tests: 17/17 PASS; build stages 184 static files.
- [F] Asset safety: PASS, 537 repository files. Credential-signature scan:
  PASS, 612 source/test/export text files, zero matches. This is a scoped
  signature check, not a claim that automated scanning proves all security.
- [F] Export `dist/pwa-d105-final`: 184 files, 12,431,319 bytes; 53 player
  routes; no audio, Audio Test or dark QA Workbench. Precache: 161 files,
  8,350,731 bytes, revision
  `3ff5a18b29e80f5a1853ecc234781a39b1ba7b3cd9b1508ffd515fb4a6f6c350`.
- [F] Exact JS: `entry-cb2efda46b4d3ad0b183ef187db3d3a5.js`.
- [F] Browser local final export: Hatha90 + Ocean reaches Playing;
  development panel already open, eight music sources, seven music joins,
  two disclosed music loops, seven natural sources/six natural joins.
  Pause → first music join seeks to 352.8 seconds; Play advances to 375.3;
  Stop succeeds. No browser warning/error recorded in that test.
- [F] First local port retained an older service-worker shell; this was
  detected by the visible revision and retested on a fresh loopback origin.
  Old failing expectations/results were corrected and rerun, not hidden.

## Publication provenance

[F] Existing 45 hosted FLAC files remain unchanged, 2,371,806,490 bytes.
37 have prior listening approval; eight Hatha files remain listening-pending
in private review. Field Ambience and Night Birds remain local-only.
The audio Worker, catalog, private binding and access policy are unchanged.

[F] Isolated Site source commit:
`9f736d35e00ed31e722b8ab0f9bf997bf55b1e67`
(`Fix private review update and expose player controls`).
Source push completed before save. Site version 34:
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_97e3b95ef4d48191b2b1ea76dbd27817`.
Packaged artifact: 186 files, 12,636,160 bytes,
SHA-256 `e9be841feecc82778d0b8aa3c75e95b4dd8825dc9cd4df5f0fa71b34fa1ed669`.

[F] Deployment `appgdep_6aa751b881fc81918f0779aa2aba3078` succeeded at
01:46:16 UTC. Owner-only access retained (one owner, no groups/visitors),
environment revision 6 unchanged. Existing URL:
`https://app-relax-private-review.robfulton.chatgpt.site`.

[F] Remote static comparison: 79 HTML current markers, 105 exact byte-matched
assets PASS. Anonymous catalog access remains HTTP 401. No identity headers
were fabricated to access audio; audio smoke used the authorized signed-in
Codex browser. This static check did not download the full catalog.

[F] Published browser smoke: update page button reaches Home with revision
`.23` and no service-worker error. Hatha90+Ocean reaches Playing, exposes the
complete timeline by default (8 music sources and 13 total joins), and uses
a running 48 kHz stereo Web Audio context with connected source nodes.
Pause → Jump to change reaches 322.8 seconds (30 seconds before the first
music join); Play resumes and advances to 344.3. Stop succeeds. These values
demonstrate control flow, not a measured speaker output or musical approval.

[F] Individual loop review lists all 45 delivered files. Cedar Current opens
with the panel expanded and without autoplay; Play → Pause → Last 5 seconds
shows source position 02:45/02:50, and Play resumes. A scrubber refers to source
time here, while the Hatha scrubber refers to the 90-minute session.

[F] After resuming at 02:45 the source wraps and advances to 00:24, still
Playing. Direct slider input then reaches 02:00 while paused. The UI tool
reports an immediate value mismatch because the seek is asynchronous; the
subsequent accessibility snapshot proves slider120 and 02:00. No retry or
app-state injection is used. First remote near-end seek: 1015ms (two HTTP
ranges); slider seek: 513ms (one range). Near-zero uncached network latency
is therefore not established. No console warning/error in these smoke tests.

## Workspace handoff

[F] D-105 app edits: `AGENTS.md`, `STATO.md`, `docs/DECISIONS.md`, this report;
`public-pwa/update.html`, `public-pwa/pwa-update.js`;
`src/content/reviewRevision.ts`, the two private `listen`/`adaptive-session`
route wrappers, `src/audio/web/WebAudioDriver.ts` and the new
`requestPlaybackAudioSession.ts`; tests `pwaUpdate`, `PlaybackAudioSession`,
`WebAudioDriver`, `individualTrackReview`, `pwaContract`.

[F] The canonical worktree was already extensively dirty. Its final total
is 100 modified tracked paths and 99 untracked entries, index empty;
these totals include previous milestones, not just D-105. HEAD remains
`6549f0117f2d7623fe20816cbf2c687385af6b8d`. No canonical commit/push or
unrelated staging. The isolated Site checkout is clean after its publication.
Protected strategy directories were not touched.

[F] Local static preview stopped normally; port8096 has no listener.
Browser audio stopped; private Home is left open for Robert. No emulator,
Metro, ADB or native build was started for D-105. Targeted formatting and
`git diff --check` PASS after documentation updates.

## Remaining device gate

[U] iPhone audible playback, silent-switch behavior, perceptually seamless
loops, background/lock-screen, Bluetooth, battery and long-run performance
are not certified by tests or a browser timer. Robert must re-test Play,
individual loop seams and session transitions on his physical phone.

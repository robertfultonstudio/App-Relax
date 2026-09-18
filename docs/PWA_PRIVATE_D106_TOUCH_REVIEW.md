# D-106 — touch, exact review transport and live ambience

14 September 2026. Private review correction after Robert's negative iPhone
test of PLAYER-REVIEW.23. Browser controls and timing are not a substitute
for a new listening/touch test on his phone.

## Baseline protected first

[F] The user's first-action instruction was completed before implementation:
local commit `53b506b8bc65284dff4c66eb0c53d60893f83c40`,
`chore: checkpoint audio review and Android preview before touch fixes`.
The selective commit contains 273 verified app/config/test/document paths;
no audio, APK, private credentials or protected Strategy work. The canonical
checkout was clean immediately afterwards. No GitHub push.

[F] Baseline gates: 91 suites / 667 tests, TypeScript, ESLint, Prettier,
asset/config validators, scoped credential-signature scan and independent
staging audit PASS. This is a recovery checkpoint, not approval of the bugs
reported by Robert.

## Confirmed causes and corrections

- [F] Clocked PWA entry fade was capped at 80 ms. It now respects the program
  envelope (Hatha: 3 seconds; single work: 2 seconds), beginning only after
  the source is ready. Faster readiness does not mean removing the fade.
- [F] Audition mode and Exit rebuilt media/clock. A separate 20 ms audition
  gain now changes the listening side without rebuilding decks, seeking or
  replacing musical envelopes. Repeat boundary has its own cancellable timer.
- [F] During an engine audition loop, the controller used a continuously
  advancing wall-clock deadline. It now reads the actual adaptive position
  for this explicit QA repeat only; Exit reanchors the ordinary deadline.
  Consumer absolute timing remains unchanged. Stop cancels an unresolved
  adaptive seek/window preparation without waiting for the network timeout.
- [F] The slider retains a local draft through drag and asynchronous seek,
  commits once on release, handles pointer/touch/keyboard change paths and
  superseded requests. Timer rerenders cannot pull it back under the finger.
  The latest intention replaces pending work; no unbounded seek backlog.
- [F] Jump, entry, exit and loop markers now mean their exact displayed time.
  Preview lead-ins are separate, explicitly labelled actions. Selected join
  changes only after successful positioning; timestamps use centiseconds.
- [F] Live Rain/Ocean changes preserve the music plan, seed, volume, listening
  run and deadline. A separate four-second linear nature fade avoids existing
  transition windows; preparation is cancellable outside the transport queue.
  A current planned transition can deliberately delay the change. The UI says
  so and provides Cancel; Stop does not wait for source loading. Off remains
  available before playback, and volume/mute remain available during it.
- [F] Hatha90 can change from a larger Rain family to Ocean without duplicate
  recordings: only the nature schedule is rebuilt, old callbacks invalidated,
  and future nature callbacks rescheduled. Primary segment references/times
  remain unchanged. Metadata commit remains synchronized even if Stop occurs
  during post-commit cleanup. Stale preparation cannot resurrect a decoder.

## Evidence while integrating

[F] Root audio changes initially passed all 91 suites / 672 tests. Review
UI/scrubber/marker integration passed 41 targeted tests. Additional timer,
Stop cancellation, StrictMode and live-family regressions are consolidated
in the final verification below; these intermediate totals are not that run.

[F] Local browser on the new export: actual pointer drag reached 31:40.30
in 211 ms; exact Jump reached 05:52.79 in 164 ms. Hear incoming continued
from the current time instead of restarting. These are loopback timings,
not a claim of equal latency on a remote iPhone connection.

[F] An older localhost service-worker shell initially showed .23. The normal
update page opened the new .24 without deleting saved audio/settings. Browser
touch-event injection is not supported here: pointer drag is real browser
evidence; touch event tests remain automated component evidence only.

## Final verification and publication

[F] Full regression: **95 suites / 716 tests PASS**, including25 audio suites /
284 audio tests. JSON evidence: `dist/d106-final-jest-green.json`.
The earlier consolidated run failed UI02 explicit Off after route changes;
the route state was corrected without reintroducing live remounts. The failed
run remains in `dist/d106-final-jest.json`; no failing expectation was removed.
ESLint, TypeScript and changed-file Prettier PASS. Expo Doctor20/20 and
Expo install check PASS. Asset safety, ritual artwork, placeholder, ATP01,
consumer/Hatha audio hashes, configuration and QA/PWA boundary validators PASS.
Credential-signature scan:523 app/docs/test/PWA text files, zero matches;
this scoped scan is not a claim of a universal secret audit. Dependency audit
passes with the two previously accepted image-size residuals only.

[F] Fresh native consumer exports through the project scripts: iOS49 files /
162797989 bytes, Android53 files /163954750 bytes; exactly the3 authorized
ATP01 assets (155520132 bytes), no localhost catalog. These are static exports,
not native builds or device proof. No EAS archive/build/upload was requested.

[F] Final PWA export `dist/pwa-d106-final-green`:184 files /12451750 bytes,
53 prepared player routes, no audio bytes. Shell precache161 files /8371162
bytes, revision `6582017203a009f6c7e877d54f6c3f8eb951260b209a1cce84931b520ba93bd9`.
Bundle `entry-59662ddf66f4f44fe7ed5d2cadff03bf.js`.

[F] Browser verification on the integrated implementation: Hatha90 continued
Playing through Ocean→Rain→Ocean with unchanged seed and80%/50% volumes.
Exact Jump05:52.79 took113ms. Pointer drag05:07.76→40:54.50 took181ms.
Loop±30 explicitly positioned05:22.79–08:15.75; Exit at05:37.55 continued
from that point, hearing both. These are observed loopback results, not
remote-phone responsiveness or audible-quality approval.

[F] Sites35 / PLAYER-REVIEW.24 published03:48:50 UTC. Owner-only policy
revision1 and environment6 preserved. Source checkout commit
`6037eb509b8676682ecaadff745c0931eaa7c94d`; deployment
`appgdep_6aa76e947a9c8191b6295a0260efb260`. Hosting17/17 tests PASS.
Only generated shell files and the isolated Site README changed; worker,
45 remote FLAC, private storage binding and import closure stayed unchanged.
No canonical GitHub push or second canonical commit. Prior generated shell
is recoverable in `/tmp/app-relax-d106-site-backup.a4n0By/public`.

### Hosted check caught an additional timing defect

[F] All105 non-HTML assets match exact bytes. All79 HTML preserve the full
original content, with only the hosting platform's injected Cloudflare
script. The initial raw HTML byte comparison intentionally failed; inspection
confirmed this insertion rather than stale app code. No security script was
removed from the deployed/browser response.

[F] Signed-in hosted Play reached Playing with the complete .24 review.
An uncached exact Jump took1172ms, so near-zero cold-network latency is not
claimed. Hosted Rain→Ocean failed alignment while the original music/Rain
continued: the present-time positioning loop could not catch a moving audio
clock when remote reads exceeded its100ms limit. A follow-up correction is
required before delivering live ambience as working online.

### Follow-up .25: fixed future anchor and foreground reuse

[F] The additional full run passes **96 suites /720 tests**, including26
audio suites /288 tests (`dist/d106-final-25-jest.json`). TypeScript, ESLint,
changed-source Prettier and diff-check PASS. New tests model200ms seek plus
200ms runway, common future offset/playAt/fade timing, and deadline failure
with the old gain unchanged. Existing audition gain and musical envelopes
remain separate. The metadata/driver commit still occurs after the fade.

[F] A second hosted .24 paused Jump took2711ms (4 HTTP attempts /3 memory
hits). The cache only retained foreground metadata headers, not audio ranges.
The correction reuses verified foreground ranges in the same8MiB retained
LRU, maximum4MiB per range. No whole-file caching or memory-budget increase.
This is not an8MiB total-RAM claim: bounded transient byte copies and existing
PCM buffers remain. Eviction and uncached sources can still require network.

[F] .25 export `dist/pwa-d106-final-25`:184 files /12452459 bytes,53 prepared
player routes, zero audio bytes. Precache161 files /8371871 bytes, revision
`f95bb48b0f7108079af4d21ab7da2a4ff991d176b66a6cfa6e0f163631c3740a`.
Bundle `entry-e3076af133a0a3b5c63e19e9c675017e.js`. Hosting17/17 tests PASS.
Native static exports and Doctor above precede this web-only follow-up;
neither is a new native build or proof of phone behavior.

[F] Sites36 published04:11:31 UTC, deployment
`appgdep_6aa773e3d70881919a84f70eb29e2677`, isolated source
`b5850c1ed9a14687c42fc55aa73e61a7b3d997a5`. Owner-only policy revision1,
environment6 and45 remote audio objects unchanged. Only README and generated
shell changed in the isolated hosting checkout; canonical HEAD remains53b506b.

[F] Hosted .25 browser proof: Play reached Playing; Rain→Ocean→Rain completed
while the Hatha90 session continued,80% main /50% ambience unchanged. The
music remains the same eight-work program. The replacement Rain schedule
uses seven unique nature works after the Ocean-family rebuild; changing
ambience does not promise the original nature ordering back.

[F] Exact Jump05:52.79 took729ms initially; after a forward30s move, returning
to the same point took109ms and0 network attempts/0 PCM reads. Actual pointer
drag05:52.79→39:51.20 succeeded in2944ms, with4 HTTP attempts and3 newly opened
sources: cold remote seeking is still a performance residual, not near-zero.
Loop±30 prepared05:22.79–08:15.75. Hear incoming continued at05:35, Exit restored
both at05:42 without repositioning. These are browser state/timing checks;
they do not assert an audible seamless join or an iPhone finger test.

[F] Post-deployment inspection:184/184 resources matched (105 byte-exact
non-HTML;79 HTML with original content intact plus only platform-injected
Cloudflare script). Final asset-safety545 files PASS. Additional scoped
credential-signature scan392 source/test/docs/PWA text files: zero matches.
Screenshots of the actual hosted transport were emitted in the task.

[F] Canonical diff:24 modified tracked paths plus7 new paths, nothing staged;
all belong to D-106 source, regression tests and three status/decision docs.
Protected Strategy paths unchanged. Isolated Site checkout clean after
publication. Local server on8096 stopped and port verified free; no emulator,
Metro, test runner or native build left running by D-106.
.24 shell backup: `/tmp/app-relax-d106-site25-backup.SeFnme/public`.

## Device gate

[U] New iPhone touch behavior, audible fade, precise loop/crossfade listening,
background, lock-screen, battery and Bluetooth remain
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` pending the physical-phone test.
No new audio, APK/EAS build, system install or paid resource is part of D-106.

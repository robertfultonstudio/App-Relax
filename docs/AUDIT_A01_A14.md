# A01–A14 — Implementation and evidence matrix

Current checkpoint (6 September, D-068): PWA A01-A14.5 / Sites version 6
is published; D-067 records its exact remote evidence. The additional 56 → 52
transport adjustment is local only. The evidence paragraphs below describe
their original revisions, not new phone or native approvals. The local
checkpoint has 62 suites / 400 tests passing; the newly identified inactive
native two-lane gain mismatch is recorded in `A01_NATIVE_GATE.md`.

Status: local software/export checks completed; private revision A01-A14.3 published as version 4. The user reports successful online iPhone playback on the previous revision. New controls/latency need retest. Remote offline reopening previously FAILED in the integrated browser; its cause is undetermined. Native, offline, endurance and editorial gates below remain open. Earlier screenshots and coordinates refer to A01-A14.1, not the enlarged controls.
Baseline: `72346a089fca9d9235b1788acceab6eb0dcd455c`; pre-existing uncommitted work preserved in `tmp/audit-a01-a14-baseline`.

## Follow-up 6 September: phone controls and personalization

[F] Shared Stop-left / Play-Pause-right transport with 25–30px geometric
symbols, 80px minimum targets and a fixed footer, including safe-area inset.
The current-session bar preserves this order while browsing. Another sound's
preview has one contextual Play button rather than a second fixed transport.
Home links stay unchanged. The prominent personalization action exposes the
actual ordered nature plan, not an invented musical session.

[F] Typed explicit cancellation removes repeated Stop teardown during pending
Play. Tests defer Stop/Dispose completion: one cleanup, no premature Ready/Idle,
no late confirmation, no error or successful navigation for cancelled Start.
No editorial fade or WebKit confirmation barrier was shortened. The native
late-start race is preexisting and explicitly retained as a native gate.

[F] Final 61 suites / 382 tests; audio 128/128; typecheck, lint, scoped format,
asset/audio/config/security checks PASS (only the two accepted image-size
advisories). Doctor 20/20 and Expo install-check PASS. Clean iOS export49 files
/ 162,641,722 bytes; Android53 / 163,797,610; each exactly the three ATP WAVs
155,520,132 bytes. An interrupted iOS export was rejected, then rerun cleanly.
Web consumer/QA boundaries pass. Simulated EAS archive149 files159,970,431 bytes,
without localhost catalog or secrets. PWA111 files7,419,834 bytes, no audio.
Version4 deployment succeeded with unchanged owner-only access and AUDIO.

[U] No new runtime screenshot: the prior error-tab browser-policy block was
not bypassed. New UI, measured latency, private offline reopening and the
remaining native/device gates are not promoted from software tests. Ask the
user to compare controls on iPhone and select/review new musical pairings.
Evidence: `dist/a01-a14-gates/phone-controls-final-state.json` and per-gate logs.

| ID  | Correction                                                            | Software evidence                                                                                                     | Remaining gate                                                                        |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A01 | Native adaptive streaming driver with verified source leases          | Separate driver and unit tests integrated; see A01_NATIVE_GATE.md                                                     | Concrete native storage wiring, compatible native build and physical device           |
| A02 | Selective offline download, integrity, progress, cancel/retry/removal | OPFS/SHA-256, resolver leases and UI integrated; localhost offline reopen/Play passed; private remote download passed | Private remote offline reopening failed; iPhone persistence and large-file tests open |
| A03 | Recent history is a preference, not a dead end                        | 35 feasible nature combinations × 20 restarts; heard-only observer/store and UI tests green                           | Human musical curation remains separate                                               |
| A04 | Compact artwork-led Home and duration-first setup                     | Six Home actions visible at CSS 390×844; all primary Start buttons end above y=527                                    | Human visual/usability approval                                                       |
| A05 | Start actually starts; browsing does not interrupt playback           | 12 atomic-selection tests; real Begin meditation starts playback once and opens the playing screen                    | iPhone gesture/decoder test                                                           |
| A06 | Preserve outcome and selected duration for single works               | Moonlit Keys, Massage 90 minutes: Ready 90:00, Play 89:49; regression tests green                                     | Device test                                                                           |
| A07 | Persistent current-session transport                                  | Browser navigation preserves playing timer; Return/Pause/Stop available; route/config identity tests                  | Device/background test                                                                |
| A08 | Honest loading/preparing/error and retry                              | 15-second bounded preparation/confirmation, cancellation, stale-generation cleanup and retry tests                    | Network/mobile endurance beyond local tests                                           |
| A09 | Checked radio state, large targets, focus and readable text           | Real aria-checked and ArrowRight focus/selection; reflow 320×568 and 200% text; header wrapping corrected             | VoiceOver/TalkBack and human reading test                                             |
| A10 | Last successful single/adaptive listening, no consumer seed replay    | Reload shows Quiet Weather · 10 min; no first-use dead CTA; store/observer tests green                                | Cross-device history is intentionally absent                                          |
| A11 | Compact family index, Home/Sounds destinations                        | 6 families, 45 visible works; Rain expands to all 11 works; no duplicate Yoga tab                                     | Human discovery test                                                                  |
| A12 | Consistent App Relax branding and consumer copy                       | Manifest, native config, title and Settings agree; private A01-A14.1 verified; no consumer Audio Test link            | Human review                                                                          |
| A13 | Honest musical-session boundaries and future Hatha contracts          | Phase/window contracts and fixtures integrated, no approved pair added                                                | Human musical curation; not a software approval                                       |
| A14 | Completed remains at zero; Stop works during fade                     | 8 completion/Stop/stale-command regressions integrated and green                                                      | Native/device final long-run                                                          |

## Browser evidence — 5 September 2026

[F] Codex in-app browser, localhost:8095, explicit CSS viewport 390×844;
temporary 320×568 and doubled computed text-size probes. No emulator or Metro.
The browser's existing 170% zoom was measured and compensated for; screenshot
raster dimensions are not the CSS viewport. Screenshots are under
`dist/a01-a14-screenshots/`, including before/after Home, setup, player, Sounds,
Settings/offline, current session and reflow checks.

[F] Duration radio ArrowRight moves focus and `aria-checked` from 20 to 30.
One Begin meditation tap confirms playback and opens the playing screen;
29:57 remains, then navigation preserves the current-session bar at 29:45.
The single-work Massage route retains 90 minutes rather than reverting to 30.
No new selection is started merely by visiting a route.

[F] Rain starter: 16,622,588 bytes downloaded and verified. Network disabled
for the test tab; navigation to about:blank destroys the app page, then the
Quiet Weather route reopens from the shell cache. Play succeeds and timer
advances from 10:00 to 09:18. Network restored afterward. This is page closure
and reopening in the same browser/profile, not a browser-process restart or
an iPhone installed-PWA test. Remove/Undo passes without permanent deletion.

[F] A cached previous revision was observed. Closing its page allowed the
waiting service worker to activate without forced takeover or reload during
playback. The new revision exposes `A01-A14.1` in Settings and HTML metadata.

[F] Private version 3: 68 HTML routes and 43 non-HTML assets verified;
37 existing audio files total 2,657,446,897 bytes, with matching HEAD size,
stored SHA-256 and first/last ranges through the authenticated browser.
Meditation starts with one tap, timer advances 19:57 → 18:20, then Stop.
Screenshots: `live-home-390.png` and `live-playing-390.png`.

[F] Remote offline test: the 16,622,588-byte Rain starter reports
Downloaded and verified. After disabling network for the test tab, leaving
the page and reopening the private URL fails (`ERR_INTERNET_DISCONNECTED`).
The browser error page is outside the automation URL policy; further page
inspection and automated tab cleanup are blocked, and no bypass is attempted.
The browser viewport override was reset, but removal of the test tab's
network/device overrides could not be confirmed. Close that failed test tab
manually. The computer network configuration and hosted deployment were not
changed. [U] Root cause and private installed-PWA offline reopening:
NON DETERMINATO — EVIDENZA INSUFFICIENTE. The localhost success above must not
be reported as remote/offline/iPhone success.

## Local verification and packaging

### Follow-up: separate app-shell readiness (A01-A14.2)

[F] A read-only lifecycle review found a real coverage gap: an OPFS audio
download could be verified while service-worker registration/activation was
still pending or had failed. The original tests invoked install/fetch directly
and did not verify registration → ready → controller. This is a proven
software gap, not proof of the cause of the private reopen failure.

[F] Added bounded registration/ready checks, exact same-origin worker identity,
a complete-shell cache handshake and explicit first-install/waiting-update
reopening instructions. No automatic reload, skipWaiting or clients.claim.
Settings says Saved sounds; audio verification never substitutes for app
readiness. Missing storage/cache, registration rejection and timeout fail
closed; Check offline readiness retries without removing audio.

[F] Full rerun: 60 suites / 377 tests, zero failures; TypeScript, lint and
scoped formatting pass. Evidence: `dist/a01-a14-jest-shell-readiness.json`.
[U] The specific private-hosted offline reopening still requires a fresh
allowed browser/device test; the blocked error tab was not bypassed.
Lifecycle reference: [W3C Service Workers](https://www.w3.org/TR/service-workers/#serviceworkercontainer-ready).

[F] Runtime Node 22.23.1 / pnpm 11.16.0. Expo Doctor required corrective
patches Expo 57.0.20 and Router 57.0.19; official package metadata was checked,
then only these direct dependencies and their lockfile resolutions were
updated using the existing project-local store. RN 0.86.3 and RNAA 0.13.2
remain unchanged. No system/global install.

[F] Evidence logs: `dist/a01-a14-gates/`; full Jest JSON:
`dist/a01-a14-jest-final.json`: 59 suites / 369 tests / zero failures,
including 127 audio tests. TypeScript, lint, scoped formatting, canonical
ATP/placeholder/consumer validators, artwork/safety/config/QA boundaries,
Expo Doctor 20/20, Expo install check and HTTP server tests pass. Security
policy passes with only the two previously accepted image-size advisories;
it does not claim zero vulnerabilities.

[F] Native exports contain only three authorized ATP WAV files (155,520,132
audio bytes). They are Metro artifacts, not native builds. The local
`.easignore` archive simulation is explicitly not an EAS upload or build.
The first PWA validator failure remains in `exports.json` as historical
evidence; a clean export resolved cross-surface Metro cache residue, and
`pwa-validator-final.log` records the passing final artifact (111 files,
7,286,699 bytes, zero audio). Detailed final Git status, checkpoint delta,
screen hashes and archive inventory: `dist/a01-a14-gates/final-state.json`.

## Private-update cost and access preflight

[F] Existing Site read-only check: active; caller owner; custom access with
one allowed account, no guests or groups. Same AUDIO binding and unchanged
37 objects; no audio re-upload or new service. Official pricing checked on
5 September: Sites is included in eligible plans during public beta.
[Pricing](https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost).

[I] Updating only this existing private shell remains within that included
service. Stop before any upgrade, credit purchase, new billed binding or
payment request. This is not a claim of unlimited usage or a zero-cost Codex
subscription, and the source does not supply an individual future invoice.

[F] Deployment `appgdep_6a9c2e5f3f8081918d569ed24f7e2f57` succeeded,
environment revision 2. Isolated Sites source commit:
`c0e50acd6157c83548443591e240b1358aa62e3e`.
Only the existing private Site was updated; no canonical commit/push,
audio upload, EAS, purchase or new service. Preview server 8095 is stopped;
no emulator or Metro was started for these tests.

## Explicit limits

[F] Meditation 10 min cannot currently form a four-work sea session without overlapping transitions. Meditation rain has too few compatible works. The UI must offer an autonomous work at the chosen duration; no arbitrary pairing or invented marker is allowed.

[F] Existing approved audio remains read-only and outside Git, shell, APK and EAS. No new source audio, normalization, voice or consumer mixer is introduced.

[U] Physical iPhone/native playback, background, lock screen, interruptions, battery, prolonged decoder use and listening quality: NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## Human test protocol (to run after software verification)

On iPhone: open the owner-private link using the authorized account; choose a need, optionally change duration, Start once. Verify audible output, pause, browse Sounds, return to current session, Stop. Download only the small Rain starter explicitly, wait for verified completion, close the app, disconnect and reopen, then play the downloaded sound. Reconnect and test retry. Record iOS/browser/version, errors, choice time separately from loading time, and whether the app was in foreground.

## Follow-on study — proposal, not results

Eight consenting participants, 7–14 days; no recruitment or messages sent. Observe first use and repeat use, successful start, time choosing versus time loading, retrieval of last/current session, unavailable/offline states and comfort with controls. Internal proposed thresholds: 7/8 start within 30 seconds, 7/8 retrieve within 15 seconds. No retention, willingness-to-pay or clinical conclusion may be inferred from this plan.

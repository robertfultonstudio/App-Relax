# App Relax PWA redesign — design QA

Candidate: `PWA-DUAL-VIEW.1-REDESIGN-LOCAL` · app `1.1.0`
Date: 2026-09-18
Scope: private owner-only PWA. This report does not certify native, store, listening, rights, or physical-device behavior.

## Visual verdict

`READY FOR A-D / A-T RECHECK` for the frozen local PWA candidate.

- [F] Home is a mobile-first 2×3 activity grid at 390×844 and 430×932. At 844×390 it becomes a bounded 3×2 grid.
- [F] Persistent Home, Hatha, and Settings navigation uses original React Native vector marks: a house, a seated Hatha figure, and a gear. No raster crop or filled tab rectangle is used.
- [F] Every navigation target is 58 px high. Exactly one tab exposes selected/current state and roving `tabIndex=0`; the selected hairline and mark use restrained jade.
- [F] Hatha remains selected on `/yoga`, `/outcome/yoga`, and `/adaptive-session/yoga`, including the complete-practice redirect.
- [F] Consumer player uses the approved player painting, function-first title, timer, 48 px main-volume control, and one dominant Play action.
- [F] The consumer transport is persistent in a 126 px shelf directly above navigation. Its spacer reduces the scroll viewport so content ends one pixel before the shelf.
- [F] At top, midpoint, and maximum scroll for 390×844, 430×932, and 844×390, Play remains fully visible, visible control/shelf intersections are zero, and navigation touches but never overlaps the shelf.
- [F] `review=0` removes Workbench DOM and technical transport. Workbench keeps one fixed technical transport and an explicit “Vedi come utente” action.
- [F] Keyboard focus has a two-pixel jade outline; reduced-motion removes tile entrance animation.

## Interaction and accessibility evidence

- [F] Short Home activation navigates Home; the rendered web control fires Workbench at exactly 1,200 ms and not at 1,199 ms.
- [F] Movement beyond 10 px, scroll, secondary pointer, blur, pointer cancellation, and unmount cancel the owner gesture without navigation.
- [F] `Alt+Shift+Enter` and the custom accessibility action provide non-pointer entry to Workbench.
- [F] View switching updates the query without remounting the audio provider or player and moves focus to the destination heading.
- [F] Preview/Undo/Reset now retain one transaction identity across plan rerenders. A definitive successful Stop restores the baseline; a failed Stop preserves the provisional variant for Retry; a new run restores the baseline.
- [F] The stateful review test records no implicit prepare, start, play, or seek during Preview/Undo/Reset/Stop cleanup.
- [F] Full functional suite: 107 suites, 800 tests, all passing. Tooling suite: 65 tests, 63 passing and two documented fixture skips.

## Responsive screenshots inspected after paint

- `evidence/after-r5/welcome-final-r5-390x844.png`
- `evidence/after-r5/home-final-r5-390x844.png`
- `evidence/after-r5/home-final-r5-430x932.png`
- `evidence/after-r5/home-final-r5-844x390.png`
- `evidence/after-r5/meditation-final-r5-390x844.png`
- `evidence/after-r5/hatha-final-r5-390x844.png`
- `evidence/after-r5/settings-final-r5-390x844.png`
- `evidence/after-r5/player-consumer-{top,mid,max}-r5-390x844.png`
- `evidence/after-r5/player-consumer-{top,mid,max}-r5-430x932.png`
- `evidence/after-r5/player-consumer-{top,mid,max}-r5-844x390.png`
- `evidence/after-r5/player-workbench-final-r5-390x844.png`

All files were captured from the exported PWA at exact viewport dimensions after fonts and images settled. The r5 geometry receipt reports a reserved scroll boundary, fully visible Play at all nine scroll/viewport checkpoints, 48 px minimum control height, 58 px navigation targets, zero undersized consumer targets, zero visible transport intersections, and zero technical DOM nodes in consumer view. The Meditation capture visibly contains Home, Hatha, and Settings.

## Success-readiness boundary

| Lane                                                   | Verdict                                  | Evidence boundary                                                                                                                    |
| ------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Promise and first useful outcome                       | READY FOR CONTROLLED TEST                | Activity → player → one Play is implemented; audible start still needs the authenticated remote and user gesture.                    |
| Experience and accessibility                           | READY FOR INDEPENDENT RECHECK            | Component, DOM, focus, keyboard, gesture-cancel, exact viewport, semantic tabs, and before/after navigation evidence is present.      |
| Technical reliability                                  | READY FOR CONTROLLED TEST                | 800 functional tests, 308 audio tests, tooling, validators, Doctor 20/20, and consumer/QA/native/PWA export boundaries pass.          |
| Human listening and physical iPhone                    | NON DETERMINATO — EVIDENZA INSUFFICIENTE | No local screenshot, test suite, or export proves listening quality, Bluetooth, lock screen, battery, or standalone iPhone behavior. |
| Rights, market preference, retention, economics, store | NON DETERMINATO — EVIDENZA INSUFFICIENTE | Outside this bounded PWA redesign milestone.                                                                                         |

Strongest verified value: the activity choice, adult vector navigation, and player are immediate and coherent while the technical Workbench remains available on the same session. Largest unresolved risk: authenticated remote audio and standalone iPhone behavior still require C6 delivery verification and a physical user test.

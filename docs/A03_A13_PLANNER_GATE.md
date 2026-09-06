# A03 / A13 — Planner and future editorial contracts

5 September 2026. Local source/test evidence only. D-060 authorizes recent
listening as a preference; no catalogue or musical approvals are changed.

## A03 implementation

- Recent IDs are newest-first, capped at 12 as before. An occurrence contributes
  a recency-weighted score; lower scores are preferred, with seeded stable
  tie-breaking. Recent works remain eligible when safe alternatives run out.
- Work ID and editorial `familyId` remain unique within a session. The selected
  nature family (`sea` or `rain`) is deliberately preserved throughout; it is
  distinct from the per-recording `familyId` uniqueness constraint.
- Eligibility, intent, metadata review/explicit QA opt-in, listening approval,
  source frame integrity, ALL-OF transitions, phase constraints, peak metrics and
  editorial endings remain hard gates. There is no random fallback.
- Sequence search now validates an entire timeline before accepting it. Safe
  entries/exits are searched deterministically, nearest the requested phase
  boundary first. Backtracking uses existing markers only and prevents adjacent
  transitions on the same lane from overlapping (three simultaneous sources).
- `getNatureSessionFeasibility` in `natureSessionFeasibility.ts` constructs real
  plans at empty history for the requested outcome/duration and both nature
  families. It accepts explicit source availability and metadata policy; it
  returns `natureFamily`, `available` and `reasonCode`. This is not a decoder,
  delivery, native, offline or listening check.

### Current source-backed matrix

This matrix uses the existing explicit provisional-metadata preview opt-in,
not a new editorial approval. Without that opt-in, current inferred profiles
remain unavailable by default.

| Outcome    | Sea                         | Rain                        |
| ---------- | --------------------------- | --------------------------- |
| Meditation | 20 / 30 / 45 / 60 / 90      | None                        |
| Yoga       | 20 / 30 / 45 / 60 / 90      | None                        |
| Massage    | 30 / 45 / 60 / 90           | None                        |
| Relax      | 10 / 20 / 30 / 45 / 60 / 90 | 10 / 20 / 30 / 45 / 60 / 90 |
| Sleep      | None                        | 30 / 45 / 60 / 90           |
| Focus      | None                        | 20 / 30 / 45 / 60 / 90      |

[F] 35 executable combinations of the 60 outcome/duration/family possibilities.
Each is exercised through ten full-history restarts and ten rapid-abandon
restarts (only the opening work enters simulated history). Identical input is
replanned to assert determinism; work/family uniqueness, selected nature
family, phase and transition constraints, non-overlapping transitions and
exact target frames are checked each time.

[F] Meditation 10 / Sea cannot fit four distinct works using the current safe
loop boundaries and 90-second nature transitions without three-source overlap.
The old greedy planner could emit overlapping transitions. This configuration
now fails closed; neither history nor a different seed can make it valid.
The UI must not publish it as an executable adaptive choice. Autonomous works
can still preserve a ten-minute listening duration. Other unavailable family
choices lack a complete compatible sequence already at empty history.

[U] These tests simulate history input. Actual started-work history events,
navigation/reopen behavior and UI filtering are verified by their owning
controller/state/UI tests, not by this pure planner test.

## A13 optional future contract

- `SessionIntentPhasePolicy` is optional, bound to one outcome, and requires an
  explicit `editorially-reviewed` status. Four ordered phase rules declare
  weights, functional roles, energy/density ranges and allowed melodic presence.
  A quiet role may accept density/energy 1. No yoga name or filename infers this
  policy; provisional profiles cannot use it even with the existing QA opt-in.
- Absent a supplied policy, legacy phase weights 16/38/30/16 and placement rules
  remain unchanged. No Hatha timing or C-major assumption is applied to the
  catalogue. The current two-work music pair planner is not silently converted
  into a new four-work musical catalogue.
- Optional `transitionWindows` declare full pre-exit/post-entry intervals,
  boundary, compatibility key and review status. Unwrapped source coordinates
  may cross a loop seam only with explicit `includesLoopBoundary: true`.
  Both profiles and both windows must be reviewed, share a compatibility key,
  and cover the actual selected boundaries. Musical windows cover at least
  180 seconds even for a shorter technical audition; longer overlaps require
  correspondingly longer reviewed intervals.
- The 180-second default musical crossfade remains unchanged. Marker-only
  metadata retains its legacy QA behavior when neither profile declares the
  new contract. Supplying only one side, partial coverage, unreviewed windows,
  mismatched keys or an unreviewed wrap fails closed.
- Window compatibility never approves a musical direction. The real app's
  approved pairing list remains empty and all real music requests still fail
  closed across every supported outcome/duration. Eclipse Veil and Stillwater
  Halo are not reintroduced. Positive future music tests use explicit synthetic
  fixtures and a test-only mocked direction, not app works or catalogue edits.

[U] Future music, actual harmonic content and reverberation tails, source-loop
quality, directional listening approval, Hatha suitability and physical-device
behavior remain `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Verification and integration boundary

Node 22.23.1; isolated worktree and Jest cache under `tmp/jest-cache`. No
installation, native/cloud build, commit, push, Sites operation or audio byte
change. Integrate only the explicitly listed planner/type/helper/test/doc files;
other pre-existing worktree changes belong to the protected snapshot.

Tests: `continuumPlanner.test.ts`, `natureSessionFeasibility.test.ts`,
`futureMusicContract.test.ts`; regression includes Workbench, QA catalogue,
adaptive controller and Web playback. Final command results are delivered with
the handoff rather than inferred from file existence.

[F] Full Jest run: **42 suites / 217 tests passed**. TypeScript `--noEmit
--incremental false`, scoped ESLint, formatting and tracked-file whitespace
checks passed. These are local checks, not a physical listening or release gate.

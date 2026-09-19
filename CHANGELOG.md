# Changelog

All notable changes to App Relax are recorded here. The format follows Keep a
Changelog and production versions follow Semantic Versioning.

## [Unreleased]

### Added

- Production CI/CD architecture, ratcheted quality gates, deterministic release
  metadata, and production EAS profiles.

## [1.1.0] - 2026-09-18

### Added

- Private PWA dual view with a consumer listening surface and a separate
  technical Workbench on the same route, provider, controller, and session.
- Persistent consumer navigation, deterministic artwork crops, and the
  authenticated same-origin audio worker contract for the existing Sites
  project.

### Changed

- The private PWA now opens the Workbench by default while `review=0` forces
  the consumer view without remounting playback state.
- Service-worker precaching now excludes internal Expo Router artifacts and
  canonicalizes clean-route cache keys.

## [1.0.4] - 2026-09-14

### Added

- Internal Android consumer APK for physical-device testing, with the verified
  private audio import kit.

### Changed

- Reduced the Android package size while preserving the approved consumer audio
  boundary.

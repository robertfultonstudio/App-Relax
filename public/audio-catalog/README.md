# Local listening catalog

This directory is the on-demand audio source for the localhost preview. Its
WAV and FLAC files are intentionally ignored by Git because the complete local
catalog is about 2.6 GiB and several works exceed GitHub's normal file limit.

- 13 WAV files come unchanged from `APP_READY_AUDIO_01/audio`. Eclypsis /
  Eclipse Veil and Nirvana Waves / Stillwater Halo are intentionally absent
  after their listening removals; no consumer starter FLAC remains bundled.
- 24 FLAC files come unchanged from
  `APP_READY_AUDIO_02_ELEMENTAL_WATER_AIR/APP_DELIVERY_FLAC`.
- `Soft Air` is deliberately absent because it was rejected after listening.

The web player requests one file only when its work is opened. These files are
not part of the native mobile package; mobile asset delivery remains a separate
release decision.

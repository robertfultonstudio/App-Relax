# App Relax PWA FLAC worker: third-party notices

## Distribution scope

This directory accompanies `public-pwa/flac-decoder.worker.min.js`. That worker is
built from the public `FLACDecoder` export and calls `decodeFrames`; it is not the
pre-minified upstream bundle. App Relax builds it with esbuild 0.28.2, with normal
minification enabled and property mangling disabled.

The final esbuild metafile and `dist/flac-worker/build.json` are the authoritative
record of the modules and byte contributions in a particular build. This notice does
not by itself establish license compliance.

## Components present in the worker

### @wasm-audio-decoders/flac 0.2.11

- License declared by package metadata: MIT.
- Author: Ethan Halsall.
- Source repository: <https://github.com/eshaz/wasm-audio-decoders>
- npm source commit: `11530fe7d1ed6d78e6b968297e7f858c322704d2`.
- npm integrity:
  `sha512-bbSGuDDxY89CrS7FYc2cBBfvtgk3EY9As8dVe8PFIgX7ECd/wefdi8UbGlvcdQZczRwE500KBt4cqf/+mMVsfw==`.
- License text: `LICENSES/MIT-wasm-audio-decoders.txt`.

The package includes an embedded libFLAC WebAssembly binary. The corresponding FLAC
submodule revision recorded by the package source commit is
`1507800de4b70e21be71f38caa0d9079d0bc6e45`.

### @wasm-audio-decoders/common 9.0.7

- License declared by package metadata: MIT.
- Source repository: <https://github.com/eshaz/wasm-audio-decoders>.
- npm integrity:
  `sha512-WRaUuWSKV7pkttBygml/a6dIEpatq2nnZGFIoPTc5yPLkxL6Wk4YaslPM98OPQvWacvNZ+Py9xROGDtrFBDzag==`.
- License text: `LICENSES/MIT-wasm-audio-decoders.txt`.

The common package includes an altered/inlined WebAssembly build of Mark Adler's
`puff`; its distribution terms are reproduced in `LICENSES/Zlib-puff.txt`.

### codec-parser 2.5.0

- License: LGPL-3.0-or-later.
- Author: Ethan Halsall.
- Source repository: <https://github.com/eshaz/codec-parser/tree/v2.5.0>.
- npm integrity:
  `sha512-Ru9t80fV8B0ZiixQl8xhMTLru+dzuis/KQld32/x5T/+3LwZb0/YvQdSKytX9JqCnRdiupvAvyYJINKrXieziQ==`.
- Complete LGPL and incorporated GPL texts:
  `LICENSES/LGPL-3.0-or-later.txt` and `LICENSES/GPL-3.0.txt`.
- Exact npm source archive: `source/codec-parser-2.5.0.tgz`.

The public FLAC wrapper retains codec-parser in the statically bundled worker. The
source archive and `SOURCE_AND_RELINK.md` are supplied as a candidate source/rebuild
mechanism. The party distributing the worker must assess the obligations applicable
to its exact form of conveyance.

### simple-yenc 1.0.4

- License: MIT.
- Copyright 2021-2023 Ethan Halsall.
- Source repository: <https://github.com/eshaz/simple-yenc/tree/v1.0.4>.
- npm integrity:
  `sha512-5gvxpSd79e9a3V4QDYUqnqxeD4HGlhCakVpb6gMnDD7lexJggSBJRBO5h52y/iJrdXRilX9UCuDaIJhSWm5OWw==`.
- License text: `LICENSES/MIT-wasm-audio-decoders.txt`.

### @eshaz/web-worker 1.2.2

- License: Apache-2.0.
- Copyright 2020 Google LLC.
- Source repository: <https://github.com/eshaz/web-worker/tree/v1.2.2>.
- npm integrity:
  `sha512-WxXiHFmD9u/owrzempiDlBB1ZYqiLnm9s6aPc8AlFQalq2tKmqdmMr9GXOupDgzXtqnBipj8Un0gkIm7Sjf8mw==`.
- License text: `LICENSES/Apache-2.0.txt`.

### libFLAC

- License: Xiph.Org three-clause BSD license.
- Copyright (C) 2000-2009 Josh Coalson.
- Copyright (C) 2011-2025 Xiph.Org Foundation.
- Exact source revision:
  <https://github.com/xiph/flac/tree/1507800de4b70e21be71f38caa0d9079d0bc6e45>.
- License text: `LICENSES/BSD-3-Clause-libFLAC.txt`.

### puff

- License: zlib license.
- Copyright (C) 2002-2013 Mark Adler.
- Source: <https://github.com/madler/zlib/tree/master/contrib/puff>.
- License text: `LICENSES/Zlib-puff.txt`.

## Build-only tool

esbuild 0.28.2 is used only to construct the worker and is not linked into the
runtime artifact. Its package metadata declares MIT and npm integrity
`sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==`.

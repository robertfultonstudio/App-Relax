# App Relax PWA FLAC worker: source and rebuild information

This document describes the candidate source/rebuild mechanism for the minified
browser worker. It is technical distribution information, not a conclusion that any
particular distribution satisfies LGPL, GPL, or other legal requirements.

## Corresponding App Relax source paths

The worker-side integration source in the project is:

- `src/pwa-review/flac/create-flac-frame-decoder.ts`
- `src/pwa-review/flac/flac-decoder-protocol.ts`
- `src/pwa-review/flac/flac-decoder.worker.ts`
- `scripts/build-pwa-flac-worker.mjs`

The build script writes `flac-decoder.worker.min.js` to the requested output
directory, defaulting to `public-pwa/`, and records its esbuild metafile, size,
SHA-256 and `propertyMangling: false` in `dist/flac-worker/build.json`.

## Exact source package

`source/codec-parser-2.5.0.tgz` is the npm source archive for the LGPL component:

- version: 2.5.0
- files: 35
- unpacked source-file bytes verified locally: 156,571
- npm SHA-1: `213f224dcf029854682a532a41d2d433ddda4d3e`
- local SHA-256:
  `37cfcc258a77800d370b841e33cf19a18a3be6a990c0d1332ea3e01cb4ac4272`
- npm integrity:
  `sha512-Ru9t80fV8B0ZiixQl8xhMTLru+dzuis/KQld32/x5T/+3LwZb0/YvQdSKytX9JqCnRdiupvAvyYJINKrXieziQ==`.

The archive contains 35 regular JavaScript/TypeScript declaration, documentation and
license files only. Local validation found no symlink, absolute or parent-traversal
path, or audio file/type. The packaged source is unmodified by App Relax.

## Rebuild with the shipped source version

The four App Relax integration files listed above are also supplied in this
directory under `application/`, retaining their relative paths with an added
`.txt` suffix. Copy them into a separate project with that suffix removed.
Provide a package manifest with the exact two devDependencies below and keep
the resolved dependency lockfile. The worker source is replaceable; this
private review does not require a signature or prohibit debugging a modified
LGPL component. The source archive and all license notices accompany it.

From the project root, after the repository's approved pnpm installation and
lockfile gates have succeeded:

```sh
node scripts/build-pwa-flac-worker.mjs
```

The build requires the exact devDependencies `@wasm-audio-decoders/flac@0.2.11` and
`esbuild@0.28.2`. It imports the public FLAC package export, bundles source modules,
minifies without property mangling and does not use the upstream pre-minified file.

## Relink with a recipient-modified codec-parser

1. Unpack `source/codec-parser-2.5.0.tgz` into a separate working directory.
2. Modify that codec-parser source as desired.
3. Use pnpm's documented local patch/override mechanism to make the project's
   transitive `codec-parser@2.5.0` resolve to the modified source. Preserve a lockfile
   or patch record that identifies the selected source; do not rewrite the upstream
   FLAC decoder merely to hide `errors` or other property names.
4. Run `node scripts/build-pwa-flac-worker.mjs <output-directory>`.
5. Inspect `dist/flac-worker/build.json` to confirm the new worker's SHA-256,
   `propertyMangling: false`, dependency inputs and byte contributions.
6. Run the project's FLAC worker tests and browser gate before using the rebuilt
   artifact. Native playback remains outside this worker's scope.

Because the output is one statically bundled and minified worker, the distributor
must determine whether this source-plus-rebuild mechanism and the materials actually
provided to recipients meet the requirements applicable to its Combined Work and
delivery method.

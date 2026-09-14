// Isolated decoder feasibility check. Never modifies audio or installs anything.
// node this-file <node_modules> <flac-file> <output-directory> [canonical-wav]
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  createReadStream,
  readFileSync,
  openSync,
  closeSync,
  readSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const [modules, input, destination, wavInput] = process.argv.slice(2);
assert(
  modules && input && destination,
  "Expected modules, FLAC and output directory",
);
assert.equal(
  JSON.parse(
    readFileSync(
      join(resolve(modules), "@wasm-audio-decoders/flac/package.json"),
    ),
  ).version,
  "0.2.11",
  "Revalidate a changed decoder version",
);
const { FLACDecoder } = await import(
  pathToFileURL(join(resolve(modules), "@wasm-audio-decoders/flac/index.js"))
);
const { default: CodecParser } = await import(
  pathToFileURL(join(resolve(modules), "codec-parser/index.js"))
);
const file = resolve(input),
  output = resolve(destination);
assert(
  !output.startsWith(resolve("public/audio-catalog")),
  "Read-only catalog",
);
const fd = openSync(file, "r");
const size = statSync(file).size;
function read(offset, length) {
  const b = Buffer.alloc(length);
  assert.equal(readSync(fd, b, 0, length, offset), length, "Truncated source");
  return b;
}
const header = read(0, Math.min(size, 65536));
assert.equal(header.subarray(0, 4).toString(), "fLaC");
let dataOffset = 4,
  streamInfo;
for (;;) {
  const type = header[dataOffset],
    n = header.readUIntBE(dataOffset + 1, 3);
  assert(
    dataOffset + n + 4 <= header.length,
    "Metadata exceeds bounded header probe",
  );
  if ((type & 127) === 0)
    streamInfo = header.subarray(dataOffset + 4, dataOffset + 4 + n);
  dataOffset += n + 4;
  if (type & 128) break;
}
assert.equal(streamInfo?.length, 34);
const packed = streamInfo.readBigUInt64BE(10);
const sampleRate = Number(packed >> 44n);
const channels = Number((packed >> 41n) & 7n) + 1;
const bitDepth = Number((packed >> 36n) & 31n) + 1;
const totalFrames = Number(packed & 0xfffffffffn);
assert.equal(sampleRate, 48000);
assert.equal(channels, 2);
assert.equal(bitDepth, 24);
const expectedMd5 = streamInfo.subarray(18).toString("hex");
assert.notEqual(expectedMd5, "0".repeat(32), "No authoritative PCM MD5");
const baselineWindows = [
  0,
  12345,
  Math.floor(totalFrames / 2) + 17,
  totalFrames - 8 * 48000,
  totalFrames - 1,
].map((start) => ({
  start,
  count: Math.min(8 * 48000, totalFrames - start),
  hash: createHash("sha256"),
}));

function pcm(decoded) {
  assert.deepEqual(decoded.errors, [], "Decoder reported corrupt/skipped data");
  assert.equal(decoded.channelData.length, 2);
  assert.equal(decoded.sampleRate, 48000);
  assert.equal(decoded.bitDepth, 24);
  const b = Buffer.alloc(decoded.samplesDecoded * 6);
  for (let i = 0; i < decoded.samplesDecoded; i++)
    for (let c = 0; c < 2; c++) {
      // This wrapper divides PCM24 by 0x7fffff, unlike Web Audio's canonical
      // signed PCM scaling by 0x800000. Recover the integer; the complete-stream
      // MD5 and independent canonical WAV windows must prove exact recovery.
      const value = Math.round(decoded.channelData[c][i] * 8388607);
      assert(Number.isInteger(value) && value >= -8388608 && value <= 8388607);
      b.writeIntLE(value, i * 6 + c * 3, 3);
    }
  return b;
}
const beforeRss = process.memoryUsage().rss;
let maxRss = beforeRss,
  framePosition = 0,
  bytePosition = dataOffset;
const index = [];
const decoder = new FLACDecoder();
await decoder.ready;
const parser = new CodecParser("audio/flac", {
  enableFrameCRC32: false,
  enableLogging: false,
});
const baselineHash = createHash("md5");
const sourceHash = createHash("sha256");
const started = performance.now();
async function accept(frames) {
  if (!frames.length) return;
  const batchStart = framePosition;
  for (const frame of frames) {
    const length = frame.data.length;
    assert(
      read(bytePosition, length).equals(Buffer.from(frame.data)),
      "Skipped or reordered FLAC bytes",
    );
    assert.equal(frame.header.sampleRate, 48000);
    assert.equal(frame.header.bitDepth, 24);
    index.push([framePosition, bytePosition, length, frame.samples]);
    framePosition += frame.samples;
    bytePosition += length;
  }
  const decodedPcm = pcm(await decoder.decodeFrames(frames.map((f) => f.data)));
  baselineHash.update(decodedPcm);
  for (const w of baselineWindows) {
    const lo = Math.max(w.start, batchStart),
      hi = Math.min(w.start + w.count, framePosition);
    if (hi > lo)
      w.hash.update(
        decodedPcm.subarray((lo - batchStart) * 6, (hi - batchStart) * 6),
      );
  }
  maxRss = Math.max(maxRss, process.memoryUsage().rss);
}
try {
  for await (const chunk of createReadStream(file, { highWaterMark: 65536 })) {
    sourceHash.update(chunk);
    await accept([...parser.parseChunk(chunk)]);
  }
  await accept([...parser.flush()]);
  assert.equal(framePosition, totalFrames);
  assert.equal(bytePosition, size);
  const actualMd5 = baselineHash.digest("hex");
  assert.equal(
    actualMd5,
    expectedMd5,
    "Decoded PCM is not identical to FLAC master",
  );

  let wavFd, wavOffset;
  if (wavInput) {
    wavFd = openSync(resolve(wavInput), "r");
    const h = Buffer.alloc(65536);
    readSync(wavFd, h);
    for (let p = 12; p + 8 < h.length;) {
      const n = h.readUInt32LE(p + 4);
      if (h.toString("ascii", p, p + 4) === "data") {
        wavOffset = p + 8;
        assert.equal(n, totalFrames * 6);
        break;
      }
      p += 8 + n + (n % 2);
    }
    assert(wavOffset !== undefined);
  }
  const windows = [];
  for (const baseline of baselineWindows) {
    const { start, count } = baseline;
    const entries = index.filter(
      (e) => e[0] + e[3] > start && e[0] < start + count,
    );
    assert(entries.length);
    const lo = entries[0][1],
      last = entries.at(-1),
      hi = last[1] + last[2];
    const bytes = read(lo, hi - lo);
    await decoder.reset();
    const t = performance.now();
    const decoded = pcm(
      await decoder.decodeFrames(
        entries.map((e) => bytes.subarray(e[1] - lo, e[1] - lo + e[2])),
      ),
    );
    const window = decoded.subarray(
      (start - entries[0][0]) * 6,
      (start - entries[0][0] + count) * 6,
    );
    assert.equal(window.length, count * 6);
    const windowHash = createHash("sha256").update(window).digest("hex");
    assert.equal(
      windowHash,
      baseline.hash.digest("hex"),
      "Random seek differs from verified full PCM stream",
    );
    if (wavFd !== undefined) {
      const canonical = Buffer.alloc(window.length);
      assert.equal(
        readSync(wavFd, canonical, 0, canonical.length, wavOffset + start * 6),
        canonical.length,
      );
      assert(
        window.equals(canonical),
        "Random window differs from canonical WAV",
      );
    }
    windows.push({
      startFrame: start,
      frames: count,
      range: [lo, hi - 1],
      compressedBytes: bytes.length,
      decodedPcmBytes: decoded.length,
      decodeMs: performance.now() - t,
      sha256: windowHash,
      verifiedFullStreamIdentity: true,
      wavIdentity: wavFd !== undefined,
    });
  }
  if (wavFd !== undefined) closeSync(wavFd);
  // Reuse one instance and alternate end/start frames; prove decoder resets do
  // not leave stale samples. This is NOT an audio scheduler/listening test.
  const edgeEntries = [index.at(-1), index[0]],
    edgeHashes = [];
  let maximumEdgeDecodeMs = 0;
  for (let run = 0; run < 100; run++) {
    const e = edgeEntries[run % 2];
    await decoder.reset();
    const t = performance.now();
    const b = pcm(await decoder.decodeFrames([read(e[1], e[2])]));
    const hash = createHash("sha256").update(b).digest("hex");
    if (run < 2) edgeHashes.push(hash);
    else assert.equal(hash, edgeHashes[run % 2]);
    maximumEdgeDecodeMs = Math.max(maximumEdgeDecodeMs, performance.now() - t);
    maxRss = Math.max(maxRss, process.memoryUsage().rss);
  }
  const report = {
    status:
      "LOCAL DECODER PASS — NOT APP INTEGRATED OR PHONE/LISTENING VALIDATED",
    decoder: "@wasm-audio-decoders/flac@0.2.11",
    normalization:
      "Wrapper uses 0x7fffff divisor; reconstruct PCM24 integers before Web Audio normalization",
    file: basename(file),
    bytes: size,
    flacSha256: sourceHash.digest("hex"),
    sampleRate,
    channels,
    bitDepth,
    totalFrames,
    dataOffset,
    flacFrames: index.length,
    masterPcmMd5: actualMd5,
    fullDecodePcmIdentity: true,
    windows,
    alternatingEdgeDecodes: 100,
    maximumEdgeDecodeMs,
    elapsedMs: performance.now() - started,
    processRssBefore: beforeRss,
    processRssMaximum: maxRss,
    memoryScope:
      "Node process including parser/index; not browser decoder-only or iPhone RAM",
  };
  mkdirSync(output, { recursive: true });
  writeFileSync(
    join(output, basename(file) + ".index.json"),
    JSON.stringify({
      version: 1,
      file: basename(file),
      bytes: size,
      totalFrames,
      sampleRate,
      channels,
      bitDepth,
      entries: index,
    }),
  );
  writeFileSync(
    join(output, basename(file) + ".report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
} finally {
  decoder.free();
  closeSync(fd);
}

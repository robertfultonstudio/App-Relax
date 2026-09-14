import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { createDecoder } from "../../dist/flac-worker/client.mjs";

class FakeWorker {
  onmessage = null;
  onerror = null;
  onmessageerror = null;
  posted = [];
  terminated = 0;
  postMessage(message, transfer) {
    this.posted.push({ message, transfer });
  }
  terminate() {
    this.terminated += 1;
  }
}

const decodedResponse = (request, overrides = {}) => ({
  protocol: request.protocol,
  kind: "decoded",
  id: request.id,
  errors: [],
  channelData: [new Float32Array([0.25]), new Float32Array([-0.25])],
  samplesDecoded: 1,
  sampleRate: 48_000,
  bitDepth: 24,
  ...overrides,
});

test("transfers owned frame buffers and resolves only the matching response", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const controller = new AbortController();
  const promise = decoder.decode(
    [new Uint8Array([1, 2, 3])],
    controller.signal,
  );
  assert.equal(worker.posted.length, 1);
  const request = worker.posted[0].message;
  assert.equal(worker.posted[0].transfer.length, 1);
  worker.onmessage({ data: decodedResponse(request) });
  const result = await promise;
  assert.equal(result.sampleRate, 48_000);
  assert.equal(result.channelData.length, 2);
  decoder.close();
  assert.equal(worker.terminated, 1);
});

test("wrong response ID fails closed", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const promise = decoder.decode(
    [new Uint8Array([1])],
    new AbortController().signal,
  );
  const request = worker.posted[0].message;
  worker.onmessage({
    data: decodedResponse(request, { id: `${request.id}-wrong` }),
  });
  await assert.rejects(promise, /protocol or request ID validation/);
  assert.equal(worker.terminated, 1);
});

test("malformed matching response fails closed", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const promise = decoder.decode(
    [new Uint8Array([1])],
    new AbortController().signal,
  );
  const request = worker.posted[0].message;
  worker.onmessage({
    data: { protocol: request.protocol, kind: "decoded", id: request.id },
  });
  await assert.rejects(promise, /protocol or request ID validation/);
  assert.equal(worker.terminated, 1);
});

test("abort terminates immediately, rejects pending, and ignores late responses", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const controller = new AbortController();
  const promise = decoder.decode([new Uint8Array([1])], controller.signal);
  const request = worker.posted[0].message;
  controller.abort();
  assert.equal(worker.terminated, 1);
  await assert.rejects(promise, (error) => error?.name === "AbortError");
  worker.onmessage?.({ data: decodedResponse(request) });
  await assert.rejects(
    decoder.decode([new Uint8Array([2])], new AbortController().signal),
    /closed/,
  );
});

test("close rejects pending and prevents subsequent decode", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const pending = decoder.decode(
    [new Uint8Array([1])],
    new AbortController().signal,
  );
  decoder.close();
  assert.equal(worker.terminated, 1);
  await assert.rejects(pending, (error) => error?.name === "AbortError");
  await assert.rejects(
    decoder.decode([new Uint8Array([2])], new AbortController().signal),
    /closed/,
  );
});

test("rejects concurrent work and a batch over 4 MiB", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const pending = decoder.decode(
    [new Uint8Array([1])],
    new AbortController().signal,
  );
  await assert.rejects(
    decoder.decode([new Uint8Array([2])], new AbortController().signal),
    /already in progress/,
  );
  decoder.close();
  await assert.rejects(pending);

  const secondWorker = new FakeWorker();
  const second = createDecoder({
    workerFactory: () => secondWorker,
    timeoutMs: 2_000,
  });
  await assert.rejects(
    second.decode(
      [new Uint8Array(4 * 1024 * 1024 + 1)],
      new AbortController().signal,
    ),
    /4 MiB/,
  );
  second.close();
});

test("copies only a sliced frame instead of transferring its larger backing buffer", async () => {
  const worker = new FakeWorker();
  const decoder = createDecoder({
    workerFactory: () => worker,
    timeoutMs: 2_000,
  });
  const rangeBuffer = new Uint8Array(1024);
  const frame = rangeBuffer.subarray(100, 140);
  const pending = decoder.decode([frame], new AbortController().signal);
  assert.equal(worker.posted[0].transfer[0].byteLength, 40);
  assert.notEqual(worker.posted[0].transfer[0], rangeBuffer.buffer);
  decoder.close();
  await assert.rejects(pending);
});

async function compiledWorkerHarness() {
  const source = await readFile(
    new URL("../../public-pwa/flac-decoder.worker.min.js", import.meta.url),
    "utf8",
  );
  const messages = [];
  let decoderInitializations = 0;
  const observedWasm = Object.create(WebAssembly);
  observedWasm.instantiate = async (...args) => {
    const result = await WebAssembly.instantiate(...args);
    const instance = result.instance ?? result;
    // The pinned package also instantiates its small 'puff' decompressor.
    // Count only libFLAC instances, leaving real Wasm execution untouched.
    if (!("puff" in instance.exports)) decoderInitializations++;
    return result;
  };
  const workerScope = {
    close() {},
    postMessage(message) {
      messages.push(message);
    },
  };
  vm.runInNewContext(source, {
    self: workerScope,
    Worker: class WorkerStub {},
    console: { error() {}, log() {} },
    WebAssembly: observedWasm,
    TextDecoder,
    Uint8Array,
    Uint32Array,
    Float32Array,
    DataView,
    WeakMap,
    Map,
    Set,
    Promise,
    String,
    Object,
    Array,
    Number,
    Error,
    TypeError,
    RangeError,
    BigInt64Array,
    BigUint64Array,
    setTimeout,
    clearTimeout,
    performance,
  });
  return {
    workerScope,
    messages,
    initializations: () => decoderInitializations,
  };
}

test("fresh built worker initializes libFLAC once and resets every later independent batch", async () => {
  const { workerScope, messages, initializations } =
    await compiledWorkerHarness();
  const invalidFlacFrame = new Uint8Array([0xff, 0xf8, 0, 0, 0, 0, 0, 0]);
  for (const [index, id] of ["worker:test:1", "worker:test:2"].entries()) {
    await workerScope.onmessage({
      data: {
        protocol: "app-relax-flac-frames-v1",
        kind: "decode",
        id,
        frames: [invalidFlacFrame],
      },
    });
    assert.equal(
      initializations(),
      index + 1,
      "No redundant reset before first decode",
    );
  }
  assert.equal(messages.length, 2);
  for (const [index, message] of messages.entries()) {
    assert.equal(message.kind, "decoded");
    assert.equal(message.id, `worker:test:${index + 1}`);
    assert.equal(message.errors.length, 1);
    assert.equal(message.errors[0].frameNumber, 0);
    assert.equal(message.errors[0].inputBytes, 0);
    assert.equal(message.samplesDecoded, 0);
  }
});

test("a rejected oversized batch does not consume the fresh decoder state", async () => {
  const { workerScope, messages, initializations } =
    await compiledWorkerHarness();
  await workerScope.onmessage({
    data: {
      protocol: "app-relax-flac-frames-v1",
      kind: "decode",
      id: "worker:oversized:1",
      frames: [new Uint8Array(4 * 1024 * 1024 + 1)],
    },
  });
  assert.equal(messages[0].kind, "decode-error");
  assert.match(messages[0].error.message, /4 MiB/);
  await workerScope.onmessage({
    data: {
      protocol: "app-relax-flac-frames-v1",
      kind: "decode",
      id: "worker:after-rejection:2",
      frames: [new Uint8Array([0xff, 0xf8, 0, 0, 0, 0, 0, 0])],
    },
  });
  assert.equal(initializations(), 1);
  assert.equal(messages[1].kind, "decoded");
  assert.equal(messages[1].errors[0].frameNumber, 0);
});

test("a concurrent request cannot trigger a second initialization during startup", async () => {
  const { workerScope, messages, initializations } =
    await compiledWorkerHarness();
  const request = (id) => ({
    data: {
      protocol: "app-relax-flac-frames-v1",
      kind: "decode",
      id,
      frames: [new Uint8Array([0xff, 0xf8, 0, 0, 0, 0, 0, 0])],
    },
  });
  const first = workerScope.onmessage(request("worker:concurrent:1"));
  await workerScope.onmessage(request("worker:concurrent:2"));
  await first;
  assert.equal(initializations(), 1);
  assert.equal(messages[0].kind, "decode-error");
  assert.match(messages[0].error.message, /already processing/);
  assert.equal(messages[1].id, "worker:concurrent:1");
  await workerScope.onmessage(request("worker:concurrent:3"));
  assert.equal(initializations(), 2);
  assert.equal(messages[2].id, "worker:concurrent:3");
  assert.equal(messages[2].errors[0].frameNumber, 0);
});

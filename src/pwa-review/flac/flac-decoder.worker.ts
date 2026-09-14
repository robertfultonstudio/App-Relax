import { FLACDecoder } from "@wasm-audio-decoders/flac";

import {
  FLAC_DECODER_PROTOCOL,
  MAX_FLAC_BATCH_BYTES,
  type FlacDecodeFailure,
  type FlacDecodeRequest,
  type FlacDecodeSuccess,
} from "./flac-decoder-protocol";

// Local port shape avoids adding WebWorker globals to the React Native TS root.
const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onmessageerror: (() => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  close(): void;
};
const decoder = new FLACDecoder();
let busy = false;
let needsReset = false;

const isRequestId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 8 &&
  value.length <= 160 &&
  /^[a-zA-Z0-9:._-]+$/.test(value);

const isDecodeRequest = (value: unknown): value is FlacDecodeRequest => {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<FlacDecodeRequest>;
  return (
    request.protocol === FLAC_DECODER_PROTOCOL &&
    request.kind === "decode" &&
    isRequestId(request.id) &&
    Array.isArray(request.frames) &&
    request.frames.length > 0 &&
    request.frames.every((frame) => frame instanceof Uint8Array)
  );
};

const serializeError = (error: unknown) => ({
  name: error instanceof Error ? error.name : "Error",
  message: error instanceof Error ? error.message : String(error),
});

const postFailure = (id: string, error: unknown) => {
  const response: FlacDecodeFailure = {
    protocol: FLAC_DECODER_PROTOCOL,
    kind: "decode-error",
    id,
    error: serializeError(error),
  };
  workerScope.postMessage(response);
};

workerScope.onmessage = async (event: MessageEvent<unknown>) => {
  if (!isDecodeRequest(event.data)) {
    workerScope.close();
    return;
  }

  const { id, frames } = event.data;
  if (busy) {
    postFailure(
      id,
      new Error("FLAC decoder worker is already processing a batch"),
    );
    return;
  }

  const batchBytes = frames.reduce(
    (total, frame) => total + frame.byteLength,
    0,
  );
  if (!Number.isSafeInteger(batchBytes) || batchBytes > MAX_FLAC_BATCH_BYTES) {
    postFailure(id, new RangeError("FLAC frame batch exceeds the 4 MiB limit"));
    return;
  }

  busy = true;
  try {
    await decoder.ready;
    // ready already gives the first batch a clean libFLAC instance. Reset only
    // between independent batches, including after an earlier failed decode.
    if (needsReset) await decoder.reset();
    needsReset = true;
    const decoded = await decoder.decodeFrames(frames);
    if (
      !decoded ||
      !Array.isArray(decoded.errors) ||
      !Array.isArray(decoded.channelData) ||
      !decoded.channelData.every(
        (channel) => channel instanceof Float32Array,
      ) ||
      !Number.isSafeInteger(decoded.samplesDecoded) ||
      !Number.isSafeInteger(decoded.sampleRate) ||
      !Number.isSafeInteger(decoded.bitDepth)
    ) {
      throw new TypeError("FLAC decoder returned an invalid result shape");
    }

    const response: FlacDecodeSuccess = {
      protocol: FLAC_DECODER_PROTOCOL,
      kind: "decoded",
      id,
      errors: decoded.errors,
      channelData: decoded.channelData,
      samplesDecoded: decoded.samplesDecoded,
      sampleRate: decoded.sampleRate,
      bitDepth: decoded.bitDepth,
    };
    const transfers = decoded.channelData.map((channel) => channel.buffer);
    workerScope.postMessage(response, transfers);
  } catch (error) {
    postFailure(id, error);
  } finally {
    busy = false;
  }
};

workerScope.onmessageerror = () => workerScope.close();

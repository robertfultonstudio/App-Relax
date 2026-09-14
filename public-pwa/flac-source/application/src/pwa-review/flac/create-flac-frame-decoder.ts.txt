import {
  DEFAULT_FLAC_DECODE_TIMEOUT_MS,
  FLAC_DECODER_PROTOCOL,
  MAX_FLAC_BATCH_BYTES,
  type FlacDecodedAudio,
  type FlacDecodeRequest,
  type FlacDecodeResponse,
} from "./flac-decoder-protocol";

export type FlacFrameDecoder = {
  decode(frames: Uint8Array[], signal: AbortSignal): Promise<FlacDecodedAudio>;
  close(): void;
};

export type FlacWorkerLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
  terminate(): void;
};

export type CreateFlacFrameDecoderOptions = {
  workerUrl?: string | URL;
  timeoutMs?: number;
  workerFactory?: () => FlacWorkerLike;
};

const DEFAULT_WORKER_URL = "/flac-decoder.worker.min.js";

const makeAbortError = (message = "FLAC decode aborted") => {
  if (typeof DOMException === "function") {
    return new DOMException(message, "AbortError");
  }
  const error = new Error(message);
  error.name = "AbortError";
  return error;
};

const copyOnlyWhenNeeded = (frames: Uint8Array[]) => {
  const seen = new Set<ArrayBuffer>();
  const transferableFrames: Uint8Array[] = [];
  const transfers: ArrayBuffer[] = [];

  for (const frame of frames) {
    const canTransferWholeBuffer =
      frame.buffer instanceof ArrayBuffer &&
      frame.byteOffset === 0 &&
      frame.byteLength === frame.buffer.byteLength &&
      !seen.has(frame.buffer);
    const transferable = canTransferWholeBuffer
      ? frame
      : Uint8Array.from(frame);
    const buffer = transferable.buffer as ArrayBuffer;
    seen.add(buffer);
    transferableFrames.push(transferable);
    transfers.push(buffer);
  }

  return { frames: transferableFrames, transfers };
};

const isResponse = (
  value: unknown,
  expectedId: string,
): value is FlacDecodeResponse => {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<FlacDecodeResponse>;
  if (
    response.protocol !== FLAC_DECODER_PROTOCOL ||
    response.id !== expectedId
  ) {
    return false;
  }
  if (response.kind === "decode-error") {
    return (
      !!response.error &&
      typeof response.error.name === "string" &&
      typeof response.error.message === "string"
    );
  }
  return (
    response.kind === "decoded" &&
    Array.isArray(response.errors) &&
    Array.isArray(response.channelData) &&
    response.channelData.every((channel) => channel instanceof Float32Array) &&
    Number.isSafeInteger(response.samplesDecoded) &&
    Number.isSafeInteger(response.sampleRate) &&
    Number.isSafeInteger(response.bitDepth)
  );
};

export const createDecoder = (
  options: CreateFlacFrameDecoderOptions = {},
): FlacFrameDecoder => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_FLAC_DECODE_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 60_000) {
    throw new RangeError(
      "FLAC worker timeout must be between 1000 and 60000 ms",
    );
  }

  const workerFactory =
    options.workerFactory ??
    (() =>
      new Worker(options.workerUrl ?? DEFAULT_WORKER_URL, {
        name: "app-relax-flac-decoder",
      }));
  const worker = workerFactory();

  let closed = false;
  let counter = 0;
  let pending:
    | {
        id: string;
        reject: (reason: unknown) => void;
        timer: ReturnType<typeof setTimeout>;
        signal: AbortSignal;
        onAbort: () => void;
      }
    | undefined;

  const clearPending = () => {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.signal.removeEventListener("abort", pending.onAbort);
    pending = undefined;
  };

  const terminate = (reason?: unknown) => {
    if (closed) return;
    closed = true;
    worker.terminate();
    const active = pending;
    clearPending();
    active?.reject(reason ?? makeAbortError("FLAC decoder closed"));
  };

  worker.onerror = (event) => {
    event.preventDefault?.();
    terminate(new Error(event.message || "FLAC worker failed"));
  };
  worker.onmessageerror = () =>
    terminate(new Error("FLAC worker returned an unreadable message"));

  return {
    decode(frames, signal) {
      if (closed) return Promise.reject(new Error("FLAC decoder is closed"));
      if (pending)
        return Promise.reject(new Error("FLAC decode is already in progress"));
      if (signal.aborted) {
        terminate(makeAbortError());
        return Promise.reject(makeAbortError());
      }
      if (!Array.isArray(frames) || frames.length === 0) {
        return Promise.reject(
          new TypeError("At least one FLAC frame is required"),
        );
      }
      if (!frames.every((frame) => frame instanceof Uint8Array)) {
        return Promise.reject(
          new TypeError("Every FLAC frame must be a Uint8Array"),
        );
      }
      const batchBytes = frames.reduce(
        (total, frame) => total + frame.byteLength,
        0,
      );
      if (
        !Number.isSafeInteger(batchBytes) ||
        batchBytes > MAX_FLAC_BATCH_BYTES
      ) {
        return Promise.reject(
          new RangeError("FLAC frame batch exceeds the 4 MiB limit"),
        );
      }

      // A decoder owns a dedicated Worker channel, so a per-channel monotonic ID
      // is sufficient to reject stale or mismatched replies without requiring a
      // secure-context crypto API on the explicitly authorized HTTP LAN preview.
      const id = `flac:req:${++counter}`;
      const payload = copyOnlyWhenNeeded(frames);
      return new Promise<FlacDecodedAudio>((resolve, reject) => {
        const onAbort = () => terminate(makeAbortError());
        const timer = setTimeout(
          () =>
            terminate(new Error(`FLAC worker timed out after ${timeoutMs} ms`)),
          timeoutMs,
        );
        pending = { id, reject, timer, signal, onAbort };
        signal.addEventListener("abort", onAbort, { once: true });
        worker.onmessage = (event) => {
          if (closed || !pending) return;
          if (!isResponse(event.data, pending.id)) {
            terminate(
              new Error(
                "FLAC worker response failed protocol or request ID validation",
              ),
            );
            return;
          }
          const response = event.data;
          clearPending();
          if (response.kind === "decode-error") {
            const error = new Error(response.error.message);
            error.name = response.error.name;
            reject(error);
            return;
          }
          resolve({
            errors: response.errors,
            channelData: response.channelData,
            samplesDecoded: response.samplesDecoded,
            sampleRate: response.sampleRate,
            bitDepth: response.bitDepth,
          });
        };
        try {
          const request: FlacDecodeRequest = {
            protocol: FLAC_DECODER_PROTOCOL,
            kind: "decode",
            id,
            frames: payload.frames,
          };
          worker.postMessage(request, payload.transfers);
        } catch (error) {
          terminate(error);
        }
      });
    },
    close() {
      terminate();
    },
  };
};

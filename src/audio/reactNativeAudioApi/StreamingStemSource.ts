import type {
  AudioContext,
  AudioTagHandle,
  MediaElementAudioSourceNode,
} from "react-native-audio-api";

export type NativeFileSourceNode = NonNullable<
  ReturnType<AudioContext["context"]["createFileSource"]>
>;

export interface StreamingStemSource {
  source: NativeFileSourceNode;
  output: MediaElementAudioSourceNode;
}

const SEEK_CONFIRMATION_SECONDS = 0.1;
const SEEK_CONFIRMATION_TIMEOUT_MS = 5000;

type InternalAudioTagHandle = AudioTagHandle & {
  getFileSourceNode: () => NativeFileSourceNode;
};

function resolveLocalFilePath(uri: string): string {
  if (!/^file:\/\/\/(?!\/)/.test(uri) || /[?#\u0000]/.test(uri)) {
    throw new Error("Native streaming requires an absolute local file URI.");
  }
  const stripped = uri.startsWith("file://")
    ? uri.slice("file://".length)
    : uri;
  try {
    const decoded = decodeURIComponent(stripped);
    if (decoded.startsWith("//") || /[\u0000-\u001f]/.test(decoded)) {
      throw new Error("Invalid native local file path.");
    }
    return decoded;
  } catch {
    throw new Error("Invalid native local file URI encoding.");
  }
}

function createInternalHandle(
  context: AudioContext,
  source: NativeFileSourceNode,
): InternalAudioTagHandle {
  return {
    play: () => source.start(context.currentTime),
    pause: () => source.pause(),
    seekToTime: (seconds) => source.seekToTime(seconds),
    setVolume: (volume) => {
      source.volume = volume;
    },
    setMuted: (muted) => {
      source.volume = muted ? 0 : 1;
    },
    setPlaybackRate: (playbackRate) => {
      source.playbackRate = playbackRate;
    },
    getFileSourceNode: () => source,
  };
}

export function createStreamingStemSource(
  context: AudioContext,
  localUri: string,
): StreamingStemSource {
  const source = context.context.createFileSource({
    source: resolveLocalFilePath(localUri),
    loop: true,
    volume: 1,
    playbackRate: 1,
    preservesPitch: true,
  });
  if (!source) {
    throw new Error("The native audio file source is unavailable.");
  }

  // RNAA 0.13.2 auto-routes a raw file source to the destination on start.
  // Binding it first as a media element prevents that bypass of our gain graph.
  try {
    const output = context.createMediaElementSource(
      createInternalHandle(context, source),
    );
    return { source, output };
  } catch (error) {
    try {
      source.pause();
    } catch {
      /* Continue cleanup. */
    }
    try {
      source.stop(0);
    } catch {
      /* Continue cleanup. */
    }
    try {
      source.disconnect();
    } catch {
      /* Continue cleanup. */
    }
    throw error;
  }
}

export function stopStreamingStemSource(runtime: StreamingStemSource): void {
  // Pause first: releasing the media-element binding can otherwise auto-route
  // a still-running raw RNAA file source straight to the destination.
  try {
    runtime.source.pause();
  } catch {
    // Continue all cleanup attempts even after a native exception.
  }
  try {
    runtime.source.stop(0);
  } catch {
    // A source that never started or already stopped is already silent.
  }
  try {
    runtime.output.disconnect();
  } catch {
    // A disconnected output is already clean.
  }
  try {
    runtime.source.disconnect();
  } catch {
    // The routed raw source normally has no direct graph connection.
  }
}

async function waitForStreamingPosition(
  source: NativeFileSourceNode,
  positionSeconds: number,
  expectedDurationSeconds: number,
  toleranceSeconds: number,
  allowLoopWrap: boolean,
  deadline: number,
  signal: AbortSignal,
  recovery: { remaining: number },
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    const abort = () =>
      finish(new Error("Native source preparation cancelled."));
    const poll = () => {
      try {
        const current = source.currentTime;
        const progress = allowLoopWrap
          ? (current - positionSeconds + expectedDurationSeconds) %
            expectedDurationSeconds
          : current - positionSeconds;
        if (
          Number.isFinite(progress) &&
          progress > 0 &&
          progress <= toleranceSeconds
        ) {
          finish();
        } else if (
          Number.isFinite(progress) &&
          progress > toleranceSeconds &&
          recovery.remaining > 0 &&
          Date.now() < deadline
        ) {
          // A live decoder can pass the strict window while the JS thread is
          // busy. Re-seek once, without extending either tolerance or deadline.
          recovery.remaining -= 1;
          source.seekToTime(positionSeconds);
          timer = setTimeout(poll, 10);
        } else if (Date.now() >= deadline) {
          finish(
            new Error("Native decoder did not confirm the requested position."),
          );
        } else {
          timer = setTimeout(poll, 10);
        }
      } catch (error) {
        finish(
          error instanceof Error
            ? error
            : new Error("Native decoder position failed."),
        );
      }
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else poll();
  });
}

/** RNAA 0.13.2 has an asynchronous seek but no seeked/error acknowledgement.
 * Decode behind a zero-gain graph and observe real position progress before
 * exposing it. This 100 ms software tolerance is NOT sample-accurate seek QA.
 */
export async function prepareStreamingFilePosition(
  context: AudioContext,
  runtime: StreamingStemSource,
  positionSeconds: number,
  expectedDurationSeconds: number,
  signal: AbortSignal,
): Promise<void> {
  const source = runtime.source;
  if (
    !Number.isFinite(source.duration) ||
    Math.abs(source.duration - expectedDurationSeconds) > 0.1 ||
    expectedDurationSeconds <= 0 ||
    !Number.isFinite(positionSeconds) ||
    positionSeconds < 0 ||
    positionSeconds >= expectedDurationSeconds
  ) {
    throw new Error(
      "Native decoder duration or requested position is invalid.",
    );
  }
  if (signal.aborted) throw new Error("Native source preparation cancelled.");
  source.start(context.currentTime);
  const toleranceSeconds = Math.min(
    SEEK_CONFIRMATION_SECONDS,
    expectedDurationSeconds / 4,
  );
  const deadline = Date.now() + SEEK_CONFIRMATION_TIMEOUT_MS;
  const recovery = { remaining: 1 };
  try {
    if (positionSeconds >= expectedDurationSeconds - toleranceSeconds) {
      // At the end of a loop, an untouched decoder at zero looks identical to
      // a completed seek that has already wrapped. First confirm an unambiguous
      // pre-roll seek; only then may the requested seek be confirmed over wrap.
      const probePosition = positionSeconds - toleranceSeconds * 2;
      source.seekToTime(probePosition);
      await waitForStreamingPosition(
        source,
        probePosition,
        expectedDurationSeconds,
        toleranceSeconds,
        false,
        deadline,
        signal,
        recovery,
      );
      source.seekToTime(positionSeconds);
      await waitForStreamingPosition(
        source,
        positionSeconds,
        expectedDurationSeconds,
        toleranceSeconds,
        true,
        deadline,
        signal,
        recovery,
      );
    } else {
      source.seekToTime(positionSeconds);
      await waitForStreamingPosition(
        source,
        positionSeconds,
        expectedDurationSeconds,
        toleranceSeconds,
        false,
        deadline,
        signal,
        recovery,
      );
    }
  } finally {
    source.pause();
  }
}

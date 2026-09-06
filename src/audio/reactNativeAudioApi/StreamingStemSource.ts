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
  source.seekToTime(positionSeconds);
  await new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + 5000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      try {
        source.pause();
        if (error) reject(error);
        else resolve();
      } catch (pauseError) {
        reject(pauseError);
      }
    };
    const abort = () =>
      finish(new Error("Native source preparation cancelled."));
    const poll = () => {
      try {
        const progress =
          (source.currentTime - positionSeconds + expectedDurationSeconds) %
          expectedDurationSeconds;
        if (Number.isFinite(progress) && progress > 0 && progress <= 0.1) {
          finish();
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
    poll();
  });
}

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
  const stripped = uri.startsWith("file://")
    ? uri.slice("file://".length)
    : uri;
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
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
  const output = context.createMediaElementSource(
    createInternalHandle(context, source),
  );
  return { source, output };
}

export function stopStreamingStemSource(runtime: StreamingStemSource): void {
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

export const FLAC_DECODER_PROTOCOL = "app-relax-flac-frames-v1" as const;
export const MAX_FLAC_BATCH_BYTES = 4 * 1024 * 1024;
export const DEFAULT_FLAC_DECODE_TIMEOUT_MS = 15_000;

export type FlacDecodedAudio = {
  errors: unknown[];
  channelData: Float32Array[];
  samplesDecoded: number;
  sampleRate: number;
  bitDepth: number;
};

export type FlacDecodeRequest = {
  protocol: typeof FLAC_DECODER_PROTOCOL;
  kind: "decode";
  id: string;
  frames: Uint8Array[];
};

export type FlacDecodeSuccess = FlacDecodedAudio & {
  protocol: typeof FLAC_DECODER_PROTOCOL;
  kind: "decoded";
  id: string;
};

export type FlacDecodeFailure = {
  protocol: typeof FLAC_DECODER_PROTOCOL;
  kind: "decode-error";
  id: string;
  error: {
    name: string;
    message: string;
  };
};

export type FlacDecodeResponse = FlacDecodeSuccess | FlacDecodeFailure;

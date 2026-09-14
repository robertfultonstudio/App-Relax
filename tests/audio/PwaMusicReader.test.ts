import { createPwaPcmReaderFactory } from "@/pwa-review/createPwaPcmReader";
import { FlacWindowReader } from "@/audio/web/FlacWindowReader";
import { getConsumerWork } from "@/content/consumerCatalog";
import registry from "@/pwa-review/flacIndexManifest.json";
jest.mock("@/audio/web/FlacWindowReader", () => ({
  FlacWindowReader: jest.fn(),
}));
jest.mock("@/pwa-review/flac/create-flac-frame-decoder", () => ({
  createDecoder: jest.fn(),
}));

it("reads online music as verified FLAC but preserves verified offline WAV decoding", () => {
  const work = getConsumerWork("distant-garden")!;
  const entry = registry.files.find(
    (f) =>
      "sourceFilename" in f && f.sourceFilename === work.localPreviewFilename,
  )!;
  const factory = createPwaPcmReaderFactory();
  factory(`/audio-catalog/${entry.filename}`, work);
  expect(FlacWindowReader).toHaveBeenLastCalledWith(
    expect.any(Function),
    expect.any(Function),
    expect.any(Function),
    { sha256: entry.sourceSha256, verifiedBlob: false },
  );
  expect(factory("blob:verified-offline-wav", work)).toBeNull();
});

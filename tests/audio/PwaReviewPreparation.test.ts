import { createPwaPcmReaderFactory } from "@/pwa-review/createPwaPcmReader";
import { PwaFlacIndexStore } from "@/pwa-review/PwaFlacIndexStore";
import { PwaReviewRangeCache } from "@/pwa-review/PwaReviewRangeCache";
import { reviewStartupRanges } from "@/pwa-review/reviewStartupRanges";
import { getConsumerWork } from "@/content/consumerCatalog";
import type { FlacFrameIndex } from "@/audio/web/FlacWindowReader";

jest.mock("@/pwa-review/flac/create-flac-frame-decoder", () => ({
  createDecoder: jest.fn(),
}));
jest.mock("@/pwa-review/reviewStartupRanges", () => ({
  reviewStartupRanges: jest.fn(() => []),
}));
afterEach(() => jest.restoreAllMocks());

it("prepares online music even when the accompanying rain is a verified offline lease", async () => {
  const get = jest
    .spyOn(PwaFlacIndexStore.prototype, "get")
    .mockResolvedValue({} as FlacFrameIndex);
  const prepare = jest
    .spyOn(PwaReviewRangeCache.prototype, "prepare")
    .mockResolvedValue(true);
  const range = {
    url: "/music.flac",
    sha256: "a".repeat(64),
    start: 0,
    end: 41,
    total: 100,
  };
  jest.mocked(reviewStartupRanges).mockReturnValueOnce([range]);
  const music = getConsumerWork("respiro-hatha-1-01")!;
  const rain = getConsumerWork("field-rain-008-sheltered-rain")!;
  const factory = createPwaPcmReaderFactory();
  const signal = new AbortController().signal;
  await expect(
    factory.prepareReview!(
      [
        { url: "/music.flac", work: music, positionSeconds: 322.78 },
        { url: "blob:verified-rain", work: rain, positionSeconds: 14.78 },
      ],
      signal,
    ),
  ).resolves.toBe(true);
  expect(get).toHaveBeenCalledTimes(1);
  expect(prepare).toHaveBeenCalledWith([range], signal);
});

it("does not copy or download existing offline bytes and rejects cancelled preparation", async () => {
  const get = jest.spyOn(PwaFlacIndexStore.prototype, "get");
  const prepare = jest.spyOn(PwaReviewRangeCache.prototype, "prepare");
  const factory = createPwaPcmReaderFactory();
  const abort = new AbortController();
  const target = [
    {
      url: "blob:verified-rain",
      work: getConsumerWork("field-rain-008-sheltered-rain")!,
      positionSeconds: 14,
    },
  ];
  await expect(factory.prepareReview!(target, abort.signal)).resolves.toBe(
    true,
  );
  expect(get).not.toHaveBeenCalled();
  expect(prepare).not.toHaveBeenCalled();
  abort.abort();
  await expect(factory.prepareReview!(target, abort.signal)).resolves.toBe(
    false,
  );
});

import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";

describe("adaptive preview availability", () => {
  it("allows only a non-production web loopback host", () => {
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "development",
        hostname: "localhost",
      }),
    ).toBe(true);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "production",
        hostname: "localhost",
      }),
    ).toBe(false);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "development",
        hostname: "example.com",
      }),
    ).toBe(false);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "android",
        nodeEnv: "development",
        hostname: "localhost",
      }),
    ).toBe(false);
  });
});

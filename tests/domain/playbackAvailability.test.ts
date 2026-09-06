import {
  isAdaptivePlaybackAvailable,
  isAuthorizedWebPreviewHost,
  isLoopbackWebPreviewHost,
} from "@/domain/sessions/playbackAvailability";

describe("adaptive preview availability", () => {
  it("allows only a non-production web loopback host", () => {
    expect(isLoopbackWebPreviewHost("localhost")).toBe(true);
    expect(isLoopbackWebPreviewHost("127.0.0.1")).toBe(true);
    expect(isLoopbackWebPreviewHost("192.168.1.5")).toBe(false);
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

  it("allows only the exact opted-in private LAN host in development", () => {
    expect(isAuthorizedWebPreviewHost("192.168.1.5", undefined)).toBe(false);
    expect(isAuthorizedWebPreviewHost("192.168.1.5", "192.168.1.5")).toBe(true);
    expect(isAuthorizedWebPreviewHost("10.0.0.8", "10.0.0.8")).toBe(true);
    expect(isAuthorizedWebPreviewHost("172.31.4.9", "172.31.4.9")).toBe(true);
    expect(isAuthorizedWebPreviewHost("192.168.1.6", "192.168.1.5")).toBe(
      false,
    );
    expect(isAuthorizedWebPreviewHost("8.8.8.8", "8.8.8.8")).toBe(false);
    expect(isAuthorizedWebPreviewHost("169.254.1.2", "169.254.1.2")).toBe(
      false,
    );
    expect(isAuthorizedWebPreviewHost("100.64.1.2", "100.64.1.2")).toBe(false);
    expect(isAuthorizedWebPreviewHost("example.com", "example.com")).toBe(
      false,
    );
    expect(isAuthorizedWebPreviewHost("192.168.1", "192.168.1")).toBe(false);

    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "development",
        hostname: "192.168.1.5",
        lanPreviewHost: "192.168.1.5",
      }),
    ).toBe(true);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "production",
        hostname: "192.168.1.5",
        lanPreviewHost: "192.168.1.5",
      }),
    ).toBe(false);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "test",
        hostname: "192.168.1.5",
        lanPreviewHost: "192.168.1.5",
      }),
    ).toBe(false);
  });

  it("allows production playback only for the explicit same-origin PWA contract", () => {
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "production",
        hostname: "ritual.example",
        pwaAudioDelivery: "same-origin",
        secureContext: true,
      }),
    ).toBe(true);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "production",
        hostname: "ritual.example",
        pwaAudioDelivery: "same-origin",
        secureContext: false,
      }),
    ).toBe(false);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "web",
        nodeEnv: "production",
        hostname: "ritual.example",
        pwaAudioDelivery: "remote",
        secureContext: true,
      }),
    ).toBe(false);
    expect(
      isAdaptivePlaybackAvailable({
        platform: "ios",
        nodeEnv: "production",
        hostname: "ritual.example",
        pwaAudioDelivery: "same-origin",
        secureContext: true,
      }),
    ).toBe(false);
  });
});

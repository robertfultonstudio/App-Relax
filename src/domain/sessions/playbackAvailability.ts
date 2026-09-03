import { Platform } from "react-native";

export interface AdaptivePlaybackEnvironment {
  platform: string;
  nodeEnv: string | undefined;
  hostname: string | undefined;
}

export function isAdaptivePlaybackAvailable(
  environment: AdaptivePlaybackEnvironment = {
    platform: Platform.OS,
    nodeEnv: process.env.NODE_ENV,
    hostname: globalThis.location?.hostname,
  },
): boolean {
  return (
    environment.platform === "web" &&
    environment.nodeEnv !== "production" &&
    (environment.hostname === "localhost" ||
      environment.hostname === "127.0.0.1")
  );
}

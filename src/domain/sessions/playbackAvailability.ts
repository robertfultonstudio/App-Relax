import { Platform } from "react-native";

export interface AdaptivePlaybackEnvironment {
  platform: string;
  nodeEnv: string | undefined;
  hostname: string | undefined;
  lanPreviewHost?: string;
  pwaAudioDelivery?: string;
  secureContext?: boolean;
  nativePreview?: string;
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

export function isAuthorizedWebPreviewHost(
  hostname: string | undefined,
  lanPreviewHost: string | undefined,
): boolean {
  if (isLoopbackWebPreviewHost(hostname)) return true;
  return (
    typeof hostname === "string" &&
    hostname === lanPreviewHost &&
    isPrivateIpv4(hostname)
  );
}

export function isLoopbackWebPreviewHost(
  hostname: string | undefined,
): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isAdaptivePlaybackAvailable(
  environment: AdaptivePlaybackEnvironment = {
    platform: Platform.OS,
    nodeEnv: process.env.NODE_ENV,
    hostname: globalThis.location?.hostname,
    lanPreviewHost: process.env.EXPO_PUBLIC_APP_RELAX_LAN_PREVIEW_HOST,
    pwaAudioDelivery: process.env.EXPO_PUBLIC_APP_RELAX_PWA_AUDIO,
    secureContext: globalThis.isSecureContext,
    nativePreview: process.env.EXPO_PUBLIC_APP_RELAX_NATIVE_PREVIEW,
  },
): boolean {
  if (environment.platform === "android" && environment.nativePreview === "1")
    return true;
  const loopback = isLoopbackWebPreviewHost(environment.hostname);
  const pwaDeliveryAvailable =
    environment.pwaAudioDelivery === "same-origin" &&
    environment.secureContext !== false;
  return (
    environment.platform === "web" &&
    (pwaDeliveryAvailable ||
      (environment.nodeEnv !== "production" &&
        (loopback ||
          (environment.nodeEnv === "development" &&
            isAuthorizedWebPreviewHost(
              environment.hostname,
              environment.lanPreviewHost,
            )))))
  );
}

export function isPwaWebSurface(): boolean {
  return process.env.EXPO_PUBLIC_APP_RELAX_PWA === "1";
}

export function isNativeCatalogPreview(): boolean {
  return (
    Platform.OS === "android" &&
    process.env.EXPO_PUBLIC_APP_RELAX_NATIVE_PREVIEW === "1"
  );
}

import type { StemAssetKey } from "@/domain/audio/types";

interface StemAssetDescriptor {
  moduleId: number;
  md5: string;
}

export const STEM_ASSETS: Readonly<Record<StemAssetKey, StemAssetDescriptor>> =
  {
    sleepDrone001: {
      moduleId: require("../../../assets/audio/test-pack-01/SLEEP_DRONE_001.wav"),
      md5: "09ddf1890d655b15a766390577083cd8",
    },
    sleepAmbience001: {
      moduleId: require("../../../assets/audio/test-pack-01/SLEEP_AMBIENCE_001.wav"),
      md5: "f02f1520f3a85da202be924cacf2c6b3",
    },
    sleepTexture001: {
      moduleId: require("../../../assets/audio/test-pack-01/SLEEP_TEXTURE_001.wav"),
      md5: "5f329ed5a1fee0f2cecf732da6e214d0",
    },
  };

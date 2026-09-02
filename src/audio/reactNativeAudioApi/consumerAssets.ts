import { STEM_ASSETS } from "./stemAssets";

interface ConsumerAssetDescriptor {
  moduleId: number;
  md5: string;
}

export const CONSUMER_ASSETS: Readonly<
  Partial<Record<string, ConsumerAssetDescriptor>>
> = {
  eclypsis001: {
    // Metro assets require a static module id; the file hash is checked at load.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    moduleId: require("../../../assets/audio/consumer-starter/SOUNDSCAPE_ECLYPSIS_001_EMINOR_48K24_LOOP.flac"),
    md5: "a51b90331c21ed5e783ddf4d201f8d31",
  },
  sleepDrone001: STEM_ASSETS.sleepDrone001,
  sleepAmbience001: STEM_ASSETS.sleepAmbience001,
  sleepTexture001: STEM_ASSETS.sleepTexture001,
};

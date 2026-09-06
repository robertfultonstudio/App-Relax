import { STEM_ASSETS } from "./stemAssets";

interface ConsumerAssetDescriptor {
  moduleId: number;
  md5: string;
}

export const CONSUMER_ASSETS: Readonly<
  Partial<Record<string, ConsumerAssetDescriptor>>
> = {
  sleepDrone001: STEM_ASSETS.sleepDrone001,
  sleepAmbience001: STEM_ASSETS.sleepAmbience001,
};

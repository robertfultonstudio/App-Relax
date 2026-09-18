import SoundscapesScreen from "../app/soundscapes";
import { REVIEW_REVISION } from "@/content/reviewRevision";

/** A real music-only catalog, using the same works, navigation and player. */
export default function MusicLibrary() {
  return (
    <SoundscapesScreen footer={null} musicOnly reviewLabel={REVIEW_REVISION} />
  );
}

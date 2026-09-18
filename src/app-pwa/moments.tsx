import MomentsScreen from "@/screens/MomentsScreen";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
export default function PwaMoments() {
  return <MomentsScreen reviewProgramFactory={createWholeFileReviewProgram} />;
}

import HomeScreen from "../app/index";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
export default function PwaHome() {
  return <HomeScreen reviewProgramFactory={createWholeFileReviewProgram} />;
}

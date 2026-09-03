import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render } from "@testing-library/react-native";
import AdaptiveQaWorkbench, { QA_SENTINEL } from "@/qa/AdaptiveQaWorkbench";

const projectRoot = join(__dirname, "..", "..");
const mockController = {
  loadAdaptiveSession: jest.fn(async () => {}),
  configureAdaptiveAudition: jest.fn(async () => {}),
  seekAdaptiveSession: jest.fn(async () => {}),
  play: jest.fn(async () => {}),
  pause: jest.fn(async () => {}),
  stop: jest.fn(async () => {}),
};

jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => ({
    controller: mockController,
    snapshot: {
      sessionPlanId: null,
      remainingMs: 0,
      error: null,
    },
  }),
}));

describe("QA Workbench boundary", () => {
  it("uses a separate router root and is excluded from the EAS archive", () => {
    const config = readFileSync(join(projectRoot, "app.config.js"), "utf8");
    const ignore = readFileSync(join(projectRoot, ".easignore"), "utf8");
    expect(config).toContain('"src/app-qa"');
    expect(config).toContain('"src/app"');
    expect(ignore).toContain("/src/app-qa/");
    expect(ignore).toContain("/src/qa/");
    expect(readdirSync(join(projectRoot, "src", "app"))).not.toContain(
      "qa-workbench.tsx",
    );
    expect(
      readFileSync(join(projectRoot, "src", "app", "index.tsx"), "utf8"),
    ).not.toContain("qa-workbench");
  });

  it("renders timeline, transition controls, metrics and accelerated QA", async () => {
    const screen = await render(<AdaptiveQaWorkbench />);
    expect(screen.getByText(QA_SENTINEL)).toBeTruthy();
    expect(screen.getByLabelText("Full session scrubber")).toBeTruthy();
    expect(screen.getByText("VERSION A")).toBeTruthy();
    expect(screen.getByText("VERSION B")).toBeTruthy();
    expect(screen.getByText("OUTGOING LUFS")).toBeTruthy();
    expect(screen.getByText("POST-TRIM RISK")).toBeTruthy();
    await fireEvent.press(screen.getByText("RUN ACCELERATED PLAN QA"));
    expect(screen.getByText(/^PASS · exact end yes/)).toBeTruthy();
    expect(screen.getByText("EXPORT PREVIEW · NOT AVAILABLE")).toBeTruthy();
  });
});

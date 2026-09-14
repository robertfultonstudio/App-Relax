import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";
import LegalScreen from "@/app/legal";
import PwaLegalScreen from "@/app-pwa/legal";
import PwaSettingsScreen from "@/app-pwa/settings";
import { editorial } from "@/design/editorialTheme";
import { PWA_SHELL_BOOTSTRAP } from "@/pwa-review/pwaShellBootstrap";

const mockDownloadControl = () => (
  <Text testID="download-control">Offline starter control</Text>
);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => false,
  }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
// A02 owns this control; its implementation lives in the integration checkout.
jest.mock(
  "@/components/DownloadControl",
  () => ({
    DownloadControl: () => mockDownloadControl(),
  }),
  { virtual: true },
);

describe("coherent consumer information", () => {
  it("shares one paper Legal screen without obsolete no-audio or native QA claims", async () => {
    expect(PwaLegalScreen).toBe(LegalScreen);
    const screen = await render(<LegalScreen />);
    const intro = screen.getByText(/App Relax offers music and nature/);
    expect(StyleSheet.flatten(intro.props.style).color).toBe(
      editorial.inkMuted,
    );
    expect(screen.getByText("Listen safely")).toBeTruthy();
    expect(
      screen.queryByText(
        /Ritual Audio|no playable audio|Technical Audio Test|ANDROID EVIDENCE/,
      ),
    ).toBeNull();
  });

  it("places the explicit starter download in Settings without fake offline availability", async () => {
    const screen = await render(<PwaSettingsScreen />);
    expect(screen.getByTestId("download-control")).toBeTruthy();
    expect(screen.getByText("Saved sounds")).toBeTruthy();
    expect(
      screen.queryByText(
        /audio bypasses|Offline fallback|Interface notice only/,
      ),
    ).toBeNull();
  });

  it("uses App Relax install metadata and the host-scoped shell bootstrap", () => {
    const root = join(__dirname, "..", "..");
    const manifest = JSON.parse(
      readFileSync(join(root, "public-pwa/manifest.webmanifest"), "utf8"),
    );
    expect(manifest).toMatchObject({
      name: "App Relax",
      short_name: "App Relax",
      start_url: "/",
      scope: "/",
    });
    const html = readFileSync(join(root, "src/app-pwa/+html.tsx"), "utf8");
    expect(html).toContain("__html: PWA_SHELL_BOOTSTRAP");
    expect(html).toContain(
      'content="App Relax" name="apple-mobile-web-app-title"',
    );
    expect(PWA_SHELL_BOOTSTRAP).toContain(
      'navigator.serviceWorker.register("/sw.js", { scope: "/" })',
    );
  });
});

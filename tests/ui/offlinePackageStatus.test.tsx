import { render } from "@testing-library/react-native";
import { OfflinePackageStatus } from "@/components/OfflinePackageStatus";

describe("OfflinePackageStatus", () => {
  it("shows an honest package contract without enabling nonexistent delivery", async () => {
    const screen = await render(<OfflinePackageStatus />);
    expect(screen.getByText("OFFLINE SESSIONS")).toBeTruthy();
    expect(screen.getByText("IN PRODUCTION")).toBeTruthy();
    expect(screen.getByText(/Offline listening is in production/)).toBeTruthy();
    expect(screen.getByText(/PLANNED WATER PACK · 177.6 MB/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

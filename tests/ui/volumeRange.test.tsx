import { fireEvent, render } from "@testing-library/react-native";
import { VolumeRange } from "@/components/VolumeRange";

describe("consumer volume range", () => {
  it("maps native touches to a bounded volume without audio access", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <VolumeRange label="Main volume" value={0.8} onChange={onChange} />,
    );
    const range = screen.getByRole("adjustable", { name: "Main volume" });
    await fireEvent(range, "layout", {
      nativeEvent: { layout: { width: 200 } },
    });
    await fireEvent(range, "responderGrant", {
      nativeEvent: { locationX: 50 },
    });
    expect(onChange).toHaveBeenLastCalledWith(0.25);
    await fireEvent(range, "responderMove", {
      nativeEvent: { locationX: 250 },
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
    await fireEvent(range, "responderMove", {
      nativeEvent: { locationX: -10 },
    });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
  it("supports screen-reader increments and ignores disabled interaction", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <VolumeRange label="Ambience" value={0.5} onChange={onChange} />,
    );
    await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).toHaveBeenLastCalledWith(0.55);
    await screen.rerender(
      <VolumeRange label="Ambience" value={0.5} disabled onChange={onChange} />,
    );
    onChange.mockClear();
    await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});

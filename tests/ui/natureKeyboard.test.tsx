import { fireEvent, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import { NatureAmbienceChoice } from "@/components/NatureAmbienceChoice";

it("UI07 moves and focuses the rain radio with ArrowRight, ignores arrows while disabled", async () => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  try {
    const change = jest.fn();
    const focus = [jest.fn(), jest.fn(), jest.fn()];
    const event = {
      key: "ArrowRight",
      preventDefault: jest.fn(),
      currentTarget: {
        closest: () => ({
          querySelectorAll: () => focus.map((f) => ({ focus: f })),
        }),
      },
    };
    const screen = await render(
      <NatureAmbienceChoice value={null} onChange={change} />,
    );
    await fireEvent(
      screen.getByRole("radio", { name: "Ambience Off" }),
      "keyDown",
      event,
    );
    expect(change).toHaveBeenLastCalledWith("rain");
    expect(focus[1]).toHaveBeenCalled();
    for (const key of [" ", "Enter"]) {
      await fireEvent(
        screen.getByRole("radio", { name: "Ambience Ocean waves" }),
        "keyDown",
        { ...event, key },
      );
      expect(change).toHaveBeenLastCalledWith("sea");
      expect(focus[2]).toHaveBeenCalled();
    }
    await screen.rerender(
      <NatureAmbienceChoice value="rain" onChange={change} disabled />,
    );
    change.mockClear();
    await fireEvent(
      screen.getByRole("radio", { name: "Ambience Rain" }),
      "keyDown",
      event,
    );
    await fireEvent.press(
      screen.getByRole("radio", { name: "Ambience Ocean waves" }),
    );
    expect(change).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: previous,
    });
  }
});

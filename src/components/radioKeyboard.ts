import { Platform } from "react-native";

/** Standard arrow/Home/End interaction for RN Web radio groups; native uses accessibility actions. */
export function radioKeyboard<T>(
  options: readonly T[],
  selected: T,
  onChange: (value: T) => void,
) {
  if (Platform.OS !== "web") return {};
  return {
    onKeyDown: (event: {
      key: string;
      preventDefault(): void;
      currentTarget: HTMLElement;
    }) => {
      const index = options.indexOf(selected);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : event.key === "ArrowRight" || event.key === "ArrowDown"
              ? (index + 1) % options.length
              : event.key === "ArrowLeft" || event.key === "ArrowUp"
                ? (index - 1 + options.length) % options.length
                : -1;
      if (next < 0) return;
      event.preventDefault();
      onChange(options[next]);
      const group = event.currentTarget.closest('[role="radiogroup"]');
      const radios = group?.querySelectorAll<HTMLElement>(
        '[role="radio"]:not([aria-disabled="true"])',
      );
      radios?.[next]?.focus();
    },
  };
}

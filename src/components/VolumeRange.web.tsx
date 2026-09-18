import { editorial } from "@/design/editorialTheme";
import type { VolumeRangeProps } from "./VolumeRange";
export function VolumeRange({
  label,
  value,
  disabled = false,
  onChange,
}: VolumeRangeProps) {
  return (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value) / 100)}
      style={{
        flex: 1,
        minWidth: 0,
        height: 44,
        margin: 0,
        accentColor: editorial.lavender,
        touchAction: "none",
      }}
    />
  );
}

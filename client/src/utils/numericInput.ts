import { formatNumber } from "@/lib/utils";

// Amount fields are bound one-way (`:value="formatted…"` + `@input="…"`) and clamp the typed
// number into a valid range. Vue only touches the DOM when the bound value changes, so a second
// out-of-range entry produces the same clamped model value, no re-render happens, and the raw
// text the user typed stays on screen while the result reflects the clamped number. Writing the
// display value back on every accepted keystroke keeps the field and the result in agreement.

export type NumericInputElement = { value: string };

export function syncInputDisplay(
  element: NumericInputElement | null | undefined,
  display: string
): void {
  if (!element) return;
  if (element.value === display) return;
  element.value = display;
}

// Digit-only money fields (comma formatted). Returns null for an empty field so the caller can
// leave the model untouched while the user clears and retypes.
export function readClampedNumber(
  element: NumericInputElement,
  clamp: (value: number) => number,
  format: (value: number) => string = formatNumber
): number | null {
  const raw = element.value.replace(/[^0-9]/g, "");
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  const clamped = clamp(parsed);
  syncInputDisplay(element, format(clamped));
  return clamped;
}

// `type="number"` fields (person counts, years, days). The raw value is shown unformatted.
export function readClampedInteger(
  element: NumericInputElement,
  clamp: (value: number) => number
): number | null {
  const parsed = Number.parseInt(element.value, 10);
  if (!Number.isFinite(parsed)) return null;
  const clamped = clamp(parsed);
  syncInputDisplay(element, String(clamped));
  return clamped;
}

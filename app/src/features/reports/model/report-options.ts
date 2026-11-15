export const UNKNOWN_INFORMATION = "No se sabe";

export const INFORMATION_OPTIONS = [
  { value: "Conocida", label: "Conocida" },
  { value: UNKNOWN_INFORMATION, label: "Se desconoce" },
] as const;

// Accept the label stored by older forms without treating other modes as unknown.
export function normalizeInformationMode(value: string): string {
  return value === "Se desconoce" ? UNKNOWN_INFORMATION : value;
}

export function isUnknownInformation(value: string): boolean {
  return normalizeInformationMode(value) === UNKNOWN_INFORMATION;
}

export function informationModeLabel(value: string): string {
  const normalized = normalizeInformationMode(value);
  return (
    INFORMATION_OPTIONS.find((option) => option.value === normalized)?.label ?? value
  );
}

import { Choices, Field } from "@/shared/components/form-controls";
import type { Report } from "../model/report-draft";
import {
  INFORMATION_OPTIONS,
  informationModeLabel,
  normalizeInformationMode,
} from "../model/report-options";

export type ReportStepProps = {
  report: Report;
  errors: Record<string, string>;
  onUpdate: <K extends keyof Report>(key: K, value: Report[K]) => void;
};

type TextKey = {
  [K in keyof Report]: Report[K] extends string ? K : never;
}[keyof Report];
const informationLabels = INFORMATION_OPTIONS.map((option) => option.label);

// The existing field bindings are shared by the four editable steps.
export function createReportFields({
  report: r,
  errors,
  onUpdate: update,
}: ReportStepProps) {
  function field(
    key: TextKey,
    label: string,
    multiline = false,
    keyboardType:
      | "default"
      | "number-pad"
      | "decimal-pad"
      | "email-address"
      | "phone-pad" = "default",
  ) {

    return (
      <Field
        key={key}
        fieldId={key}
        label={label}
        value={r[key]}
        onChangeText={(value) =>
          update(key, value)
        }
        error={errors[key]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={
          keyboardType === "email-address"
            ? "none"
            : "sentences"
        }
      />
    );

  }
  function choose(key: TextKey, label: string, options: readonly string[]) {
    return (
      <Choices
        label={label}
        options={options}
        value={r[key]}
        onChange={(value) => update(key, value)}
      />
    );
  }
  function chooseInformation(
    key: "ageMode" | "dateMode" | "timeMode",
    label: string,
  ) {
    return (
      <Choices
        label={label}
        options={informationLabels}
        value={informationModeLabel(r[key])}
        onChange={(label) => update(key, normalizeInformationMode(label))}
      />
    );
  }
  return { field, choose, chooseInformation };
}

import { LocalPhotoPicker } from "@/shared/components/local-photo-picker";
import { isUnknownInformation } from "../model/report-options";
import { createReportFields, type ReportStepProps } from "./report-step-fields";

type Props = ReportStepProps;

export function ReportIdentificationStep(props: Props) {
  const { report: r, onUpdate: update } = props;
  const { field, choose, chooseInformation } = createReportFields(props);
  return (
    <>
      {field("firstName", "Nombre de la persona reportada *")}
      {field("lastName", "Apellidos")}
      {chooseInformation("ageMode", "Edad")}
      {!isUnknownInformation(r.ageMode) &&
        field("age", "Edad en años *", false, "number-pad")}
      {choose("sex", "Sexo", [
        "Mujer",
        "Hombre",
        "No se sabe",
      ])}
      <LocalPhotoPicker
        label="Foto de la persona reportada"
        uri={r.photo}
        onChange={(photo) => update("photo", photo)}
        allowCapture
      />
    </>
  );
}

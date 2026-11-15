import { Action, Choices, formStyles as s } from "@/shared/components/form-controls";
import { Text } from "react-native";
import { isUnknownInformation } from "../model/report-options";
import { createReportFields, type ReportStepProps } from "./report-step-fields";

type Props = ReportStepProps & { onPickLocation: () => void };

export function ReportLocationStep(props: Props) {
  const { report: r, errors, onUpdate: update } = props;
  const { field, choose, chooseInformation } = createReportFields(props);
  const coordinateText = r.coordinate ? "Elegida en el mapa" : "Sin seleccionar";
  return (
    <>
      {chooseInformation("dateMode", "Fecha de última vez vista")}
      {!isUnknownInformation(r.dateMode) &&
        field("date", "Fecha * · AAAA-MM-DD")}
      {chooseInformation("timeMode", "Hora de última vez vista")}
      {!isUnknownInformation(r.timeMode) &&
        field("time", "Hora * · HH:MM (24 horas)")}
      {choose("locationKind", "Qué representa el punto del mapa", [
        "Última vez vista",
        "Ubicación inferida",
        "Avistamiento",
      ])}
      <Text selectable style={s.body}>
        Ubicación: {coordinateText}
      </Text>
      {errors.coordinate && (
        <Text accessibilityRole="alert" style={s.error}>
          {errors.coordinate}
        </Text>
      )}
      <Action
        secondary
        label={
          r.coordinate
            ? "Corregir ubicación en el mapa"
            : "Elegir ubicación en el mapa"
        }
        onPress={props.onPickLocation}
      />
      <Text style={s.body}>
        Escribe la dirección si la conoces. No se obtiene automáticamente
        del punto elegido.
      </Text>
      {field("state", "Estado · Opcional")}
      {field("municipality", "Municipio · Opcional")}
      {field("locality", "Localidad o colonia · Opcional")}
      {field("reference", "Dirección o referencia · Opcional", true)}
      {field("story", "Relato breve de lo ocurrido *", true)}
      <Choices
        label="¿Tienes información de vehículos o personas involucradas?"
        options={["No / No se sabe", "Sí"]}
        value={r.involved ? "Sí" : "No / No se sabe"}
        onChange={(value) => update("involved", value === "Sí")}
      />
      {r.involved &&
        field(
          "involvement",
          "Información que conoces · Opcional (personas, placas, modelo)",
          true,
        )}
    </>
  );
}

import { Action, Field, formStyles as s } from "@/shared/components/form-controls";
import { Text, View } from "react-native";
import type { Mark } from "../model/report-draft";
import { createReportFields, type ReportStepProps } from "./report-step-fields";

type Props = ReportStepProps & {
  onAddMark: () => void;
  onRemoveMark: (id: number) => void;
  onUpdateMark: (id: number, key: Exclude<keyof Mark, "id">, value: string) => void;
};

export function ReportDescriptionStep(props: Props) {
  const { report: r } = props;
  const { field, choose } = createReportFields(props);
  return (
    <>
      <Text style={s.body}>
        La descripción es opcional. Deja en blanco lo que no sepas.
      </Text>
      {field("height", "Estatura", false, "decimal-pad")}
      {choose("heightUnit", "Unidad de estatura", ["cm", "m"])}
      {field("build", "Complexión")}
      {field("skin", "Color de piel")}
      {field("hair", "Color y características del cabello")}
      <Text accessibilityRole="header" style={s.heading}>
        Señas particulares
      </Text>
      {r.marks.map((mark, index) => (
        <View key={mark.id} style={s.card}>
          <Text style={s.label}>Seña {index + 1}</Text>
          {(["type", "area", "description"] as const).map((key, i) => (
            <Field
              key={key}
              label={
                [
                  "Tipo (tatuaje, cicatriz, lunar u otro)",
                  "Zona corporal y lado",
                  "Descripción",
                ][i]
              }
              value={mark[key]}
              multiline={key === "description"}
              onChangeText={(value) => props.onUpdateMark(mark.id, key, value)}
            />
          ))}
          <Action
            secondary
            label={`Quitar seña ${index + 1}`}
            onPress={() => props.onRemoveMark(mark.id)}
          />
        </View>
      ))}
      <Action
        secondary
        label="Añadir seña particular"
        onPress={props.onAddMark}
      />
      {field("clothes", "Ropa que llevaba", true)}
      {field("shoes", "Calzado", true)}
    </>
  );
}

import { Action, useFormStyles } from "@/shared/components/form-controls";
import { Text } from "react-native";
import { createReportFields, type ReportStepProps } from "./report-step-fields";

type Props = ReportStepProps & { onUseProfile: () => void };

export function ReportContactStep(props: Props) {
  const s = useFormStyles();
  const { field, choose } = createReportFields(props);
  return (
    <>
      <Text style={s.body}>
        Datos de contacto. Puedes editarlos aquí sin cambiar tu perfil.
      </Text>
      <Action
        secondary
        label="Usar datos del perfil local"
        onPress={props.onUseProfile}
      />
      {field("reporterName", "Nombre completo de quien reporta *")}
      <Text style={s.body}>
        Indica al menos un correo o teléfono válido.
      </Text>
      {field("reporterEmail", "Correo de contacto", false, "email-address")}
      {field("reporterPhone", "Teléfono de contacto", false, "phone-pad")}
      {choose("relationship", "Relación con la persona reportada", [
        "Familiar",
        "Amistad",
        "Conocido/a",
        "Otra",
        "Prefiero no indicar",
      ])}
      {field("reporterAddress", "Domicilio de contacto · Opcional", true)}
      {field("reporterSocial", "Redes sociales de contacto · Opcional")}
    </>
  );
}

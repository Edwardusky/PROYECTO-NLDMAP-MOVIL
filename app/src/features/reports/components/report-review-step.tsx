import { Action, useFormStyles} from "@/shared/components/form-controls";
import { Image, Text, View } from "react-native";
import {
  informationModeLabel,
  isUnknownInformation,
} from "../model/report-options";
import type { Report } from "../model/report-draft";

type Props = {
  report: Report;
  onEdit: (index: number) => void;
  onSubmit: () => void;
};

export function ReportReviewStep(props: Props) {
  const s = useFormStyles();
  const { report: r, onEdit: edit, onSubmit: submit } = props;
  function summary(label: string, value: string) {
    return (
      <Text style={s.body}>
        {label}: {value.trim() || "No indicado"}
      </Text>
    );
  }
  const coordinateText = r.coordinate
    ? "Elegida en el mapa"
    : "Sin seleccionar";
  return (
    <>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Persona reportada
        </Text>
        {summary(
          "Nombre",
          [r.firstName, r.lastName].filter(Boolean).join(" "),
        )}
        {summary(
          "Edad",
          isUnknownInformation(r.ageMode)
            ? informationModeLabel(r.ageMode)
            : `${r.age} años · ${r.ageMode}`,
        )}
        {summary("Sexo", r.sex)}
        {r.photo ? (
          <Image
            source={{ uri: r.photo }}
            accessibilityLabel="Foto de la persona reportada, vista previa"
            style={{ width: "100%", height: 160 }}
            resizeMode="contain"
          />
        ) : (
          summary("Foto", "Sin foto")
        )}
        <Action
          secondary
          label="Editar identificación"
          onPress={() => edit(0)}
        />
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Descripción
        </Text>
        {summary("Estatura", r.height ? `${r.height} ${r.heightUnit}` : "")}
        {summary("Complexión", r.build)}
        {summary("Piel", r.skin)}
        {summary("Cabello", r.hair)}
        {r.marks.length
          ? r.marks.map((mark, i) => (
            <Text key={mark.id} style={s.body}>
              Seña {i + 1}: {mark.type || "Tipo no indicado"} ·{" "}
              {mark.area || "Zona no indicada"} ·{" "}
              {mark.description || "Sin descripción"}
            </Text>
          ))
          : summary("Señas", "No indicadas")}
        {summary("Ropa", r.clothes)}
        {summary("Calzado", r.shoes)}
        <Action
          secondary
          label="Editar descripción"
          onPress={() => edit(1)}
        />
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Hechos y ubicación
        </Text>
        {summary(
          "Fecha",
          isUnknownInformation(r.dateMode)
            ? informationModeLabel(r.dateMode)
            : `${r.date} · ${r.dateMode}`,
        )}
        {summary(
          "Hora",
          isUnknownInformation(r.timeMode)
            ? informationModeLabel(r.timeMode)
            : `${r.time} · ${r.timeMode}`,
        )}
        {summary("Tipo de ubicación", r.locationKind)}
        {summary("Ubicación", coordinateText)}
        {summary("Estado", r.state)}
        {summary("Municipio", r.municipality)}
        {summary("Localidad", r.locality)}
        {summary("Referencia", r.reference)}
        {summary("Relato", r.story)}
        {summary(
          "Personas o vehículos involucrados",
          r.involved ? r.involvement : "No / No se sabe",
        )}
        <Action
          secondary
          label="Editar hechos y ubicación"
          onPress={() => edit(2)}
        />
      </View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Contacto de quien reporta
        </Text>
        {summary("Nombre", r.reporterName)}
        {summary("Correo", r.reporterEmail)}
        {summary("Teléfono", r.reporterPhone)}
        {summary("Relación", r.relationship)}
        {summary("Domicilio", r.reporterAddress)}
        {summary("Redes", r.reporterSocial)}
        <Action secondary label="Editar contacto" onPress={() => edit(3)} />
      </View>
      <Text style={s.body}>
        Los datos de contacto servirían para gestionar el reporte y no
        formarían parte de una ficha pública. Una eventual publicación de
        información de la persona buscada requeriría una decisión aparte.
        Esta vista previa no envía ni publica datos.
      </Text>
      <Text style={s.body}>
        NLDMAP no registra denuncias oficiales, no inicia una búsqueda de
        autoridad y no está conectado al RNPDNO.
      </Text>
      <Action label="Enviar reporte" onPress={submit} />
    </>
  );
}

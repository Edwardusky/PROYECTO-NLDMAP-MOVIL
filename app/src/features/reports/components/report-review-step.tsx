import { Action, useFormStyles } from "@/shared/components/form-controls";
import { Image, Text, View } from "react-native";
import {
  skinToneLabel,
} from "../model/report-appearance-options";
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
          "Nombre completo",
          [
            r.firstName,
            r.paternalSurname,
            r.maternalSurname,
          ]
            .filter(Boolean)
            .join(" "),
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

        {summary(
          "Estatura",
          r.height
            ? `${r.height} ${r.heightUnit}${r.heightApproximate
              ? " (aproximada)"
              : ""
            }`
            : ""
        )}

        {summary("Complexión", r.build)}

        {summary("Tono de piel", skinToneLabel(r.skin))}

        {summary(
          "Cabello",
          [
            r.hairColor,
            r.hairDescription,
          ]
            .filter(Boolean)
            .join(" · ") || r.hair
        )}

        {r.marks.length
          ? r.marks.map((mark, i) => (
            <Text key={mark.id} style={s.body}>
              Seña {i + 1}: {mark.type || "Tipo no indicado"} ·{" "}
              {mark.area || "Zona no indicada"} ·{" "}
              {mark.description || "Sin descripción"}
            </Text>
          ))
          : summary("Señas", "No indicadas")}

        {summary(
          "Ropa",
          r.clothesUnknown
            ? "Se desconoce"
            : r.clothes
        )}

        {summary(
          "Calzado",
          r.shoesUnknown
            ? "Se desconoce"
            : r.shoes
        )}

        {summary(
          "Descripción identificativa",
          r.identifyingDescription ?? ""
        )}

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
        {summary(
          "Tipo de ubicación",
          r.locationKind === "Ubicación inferida"
            ? "Lugar probable (no confirmado)"
            : r.locationKind === "Última vez vista"
              ? "Último lugar donde fue vista"
              : r.locationKind
        )}
        {summary(
          "Precisión del punto",
          r.locationPrecision ?? ""
        )}
        {summary("Ubicación", coordinateText)}
        {summary("Estado", r.state)}
        {summary("Municipio", r.municipality)}
        {summary("Localidad", r.locality)}
        {summary("Referencia", r.reference)}
        {summary("Relato", r.story)}
        {summary(
          "Vehículo relacionado",
          r.vehicle
            ? [
              r.vehicle.brand,
              r.vehicle.model,
              r.vehicle.color,
              r.vehicle.plate
                ? `Placas: ${r.vehicle.plate}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ")
            : "No agregado"
        )}
        {summary(
          "Persona posiblemente relacionada",
          r.involvedPerson
            ? [
              r.involvedPerson.name,
              r.involvedPerson.description,
            ]
              .filter(Boolean)
              .join(" · ")
            : "No agregada"
        )}

        {r.involved && !!r.involvement?.trim() && (
          summary(
            "Información anterior pendiente de clasificar",
            r.involvement
          )
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

      <Action label="Enviar reporte" onPress={submit} />
    </>
  );
}


import { Text, View } from "react-native";

import {
  Choices,
  Field,
  useFormStyles,
} from "@/shared/components/form-controls";

import { LocalPhotoPicker } from "@/shared/components/local-photo-picker";

import type { ReportStepProps } from "./report-step-fields";

import {
  informationModeLabel,
  isUnknownInformation,
  normalizeInformationMode,
} from "../model/report-options";

export function ReportIdentificationStep({
  report: r,
  errors,
  onUpdate,
}: ReportStepProps) {
  const s = useFormStyles();

  const unknownSurnames =
    r.surnamesUnknown === true;

  return (
    <>
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Datos personales
        </Text>

        <Text style={s.body}>
          Escribe los datos tal como los conoces.
          No inventes información para completar
          los campos.
        </Text>

        <Field
          label="Nombre(s) · Obligatorio"
          placeholder="Ej. María Fernanda"
          value={r.firstName}
          onChangeText={(value) =>
            onUpdate("firstName", value)
          }
          error={errors.firstName}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={s.label}>
          Apellidos
        </Text>

        <Text style={s.body}>
          Indica el apellido paterno, materno
          o ambos. Si no conoces ninguno,
          selecciona esa opción.
        </Text>

        <Field
          label="Apellido paterno · Opcional individualmente"
          placeholder="Primer apellido"
          value={r.paternalSurname ?? ""}
          onChangeText={(value) =>
            onUpdate("paternalSurname", value)
          }
          editable={!unknownSurnames}
          error={errors.paternalSurname}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Field
          label="Apellido materno · Opcional individualmente"
          placeholder="Segundo apellido"
          value={r.maternalSurname ?? ""}
          onChangeText={(value) =>
            onUpdate("maternalSurname", value)
          }
          editable={!unknownSurnames}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Choices
          label="¿Se desconocen ambos apellidos?"
          options={["No", "Sí"]}
          value={unknownSurnames ? "Sí" : "No"}
          onChange={(value) =>
            onUpdate(
              "surnamesUnknown",
              value === "Sí"
            )
          }
        />

        {!!r.lastName?.trim() &&
          !r.paternalSurname?.trim() &&
          !r.maternalSurname?.trim() && (
            <Text style={s.body}>
              Apellidos guardados anteriormente:
              {" "}{r.lastName}.
              Sepáralos en los campos nuevos
              o indica que los desconoces.
            </Text>
          )}
      </View>

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Edad y sexo
        </Text>

        <Text style={s.body}>
          Estos datos ayudan a identificar a
          la persona. Puedes indicar una edad
          aproximada o que la desconoces.
        </Text>

        <Choices
          label="Información sobre la edad"
          options={[
            "Conocida",
            "Aproximada",
            "Se desconoce",
          ]}
          value={informationModeLabel(r.ageMode)}
          onChange={(value) =>
            onUpdate(
              "ageMode",
              normalizeInformationMode(value)
            )
          }
        />

        {!isUnknownInformation(r.ageMode) && (
          <Field
            label={
              r.ageMode === "Aproximada"
                ? "Edad aproximada en años · Obligatoria"
                : "Edad en años · Obligatoria"
            }
            placeholder="Ej. 28"
            keyboardType="number-pad"
            value={r.age}
            onChangeText={(value) =>
              onUpdate("age", value)
            }
            error={errors.age}
          />
        )}

        <Choices
          label="Sexo · Opcional"
          options={[
            "Mujer",
            "Hombre",
            "No se sabe",
          ]}
          value={r.sex}
          onChange={(value) =>
            onUpdate("sex", value)
          }
        />
      </View>

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Fotografía principal
        </Text>

        <Text style={s.body}>
          Adjunta una fotografía que permita
          identificar a la persona.
          Formatos admitidos: JPG, JPEG o PNG.
          Tamaño máximo: 5 MB.
        </Text>

        <LocalPhotoPicker
          label="Fotografía de la persona"
          uri={r.photo}
          onChange={(photo) =>
            onUpdate("photo", photo)
          }
          allowCapture
          required
          validationError={errors.photo}
        />
      </View>
    </>
  );
}

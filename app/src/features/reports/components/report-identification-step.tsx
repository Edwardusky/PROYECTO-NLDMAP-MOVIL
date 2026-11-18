import { Text, View } from "react-native";

import {
  Choices,
  Field,
  FormErrorTarget,
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

  return (
    <>
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Datos personales
        </Text>

        <Field
          fieldId="firstName"
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

        <Field
          fieldId="paternalSurname"
          label="Apellido paterno · Obligatorio"
          placeholder="Ej. García"
          value={r.paternalSurname}
          onChangeText={(value) =>
            onUpdate("paternalSurname", value)
          }
          error={errors.paternalSurname}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Field
          fieldId="maternalSurname"
          label="Apellido materno · Obligatorio"
          placeholder="Ej. López"
          value={r.maternalSurname}
          onChangeText={(value) =>
            onUpdate("maternalSurname", value)
          }
          error={errors.maternalSurname}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Edad y sexo
        </Text>

        <Text style={s.body}>
          Indica la edad conocida o aproximada.
          Si no la conoces, selecciona
          «Se desconoce».
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
            fieldId="age"
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
          fieldId="sex"
          label="Sexo · Obligatorio"
          options={[
            "Mujer",
            "Hombre",
          ]}
          value={r.sex}
          onChange={(value) =>
            onUpdate("sex", value)
          }
        />

        {errors.sex && (
          <Text
            accessibilityRole="alert"
            style={s.error}
          >
            {errors.sex}
          </Text>
        )}

      </View>

      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Fotografía principal
        </Text>

        <Text style={s.body}>
          Adjunta una fotografía nítida que
          permita identificar a la persona.
          Formatos admitidos: JPG, JPEG o PNG.
          Tamaño máximo: 5 MB.
        </Text>


        <FormErrorTarget id="photo">
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
        </FormErrorTarget>

      </View>
    </>
  );
}

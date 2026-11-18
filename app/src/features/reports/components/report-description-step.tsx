
import { Text, View } from "react-native";

import {
  Action,
  Choices,
  Field,
  FormErrorTarget,
  useFormStyles,
} from "@/shared/components/form-controls";

import type { Mark } from "../model/report-draft";

import {
  BODY_REGION_OPTIONS,
  COMPLEXION_OPTIONS,
  HAIR_COLOR_OPTIONS,
  MARK_TYPE_OPTIONS,
} from "../model/report-appearance-options";

import type { ReportStepProps } from "./report-step-fields";

import { ReportOptionPicker } from "./report-option-picker";
import { ReportSkinTonePicker } from "./report-skin-tone-picker";

type Props = ReportStepProps & {
  onAddMark: () => void;
  onRemoveMark: (id: number) => void;
  onUpdateMark: (
    id: number,
    key: Exclude<keyof Mark, "id">,
    value: string
  ) => void;
};

export function ReportDescriptionStep({
  report: r,
  errors,
  onUpdate: update,
  onAddMark,
  onRemoveMark,
  onUpdateMark,
}: Props) {
  const s = useFormStyles();

  return (
    <>
      {/* ESTATURA Y COMPLEXIÓN */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Estatura y complexión
        </Text>


        <Field
          fieldId="height"
          label="Estatura en centímetros (cm) · Opcional"
          placeholder="Ej. 170"
          keyboardType="number-pad"
          maxLength={3}
          value={r.height}
          onChangeText={(value) => {
            update("height", value.replace(/\D/g, ""));

            // Si procede de un borrador antiguo,
            // cualquier nueva edición ya se expresa en cm.
            if (r.heightUnit !== "cm") {
              update("heightUnit", "cm");
            }
          }}
          error={errors.height}
        />

        <Text style={s.body}>
          Introduce solamente el número en centímetros,
          sin escribir la unidad.
        </Text>

        {!!r.height.trim() && (
          <Choices
            label="¿La estatura es aproximada?"
            options={["No", "Sí"]}
            value={
              r.heightApproximate ? "Sí" : "No"
            }
            onChange={(value) =>
              update(
                "heightApproximate",
                value === "Sí"
              )
            }
          />
        )}

        <ReportOptionPicker
          label="Complexión · Opcional"
          value={r.build}
          options={COMPLEXION_OPTIONS}
          onChange={(value) =>
            update("build", value)
          }
        />

        <Text style={s.body}>
          Elige la complexión que mejor recuerdes.
        </Text>
      </View>

      {/* PIEL */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Tono de piel
        </Text>

        <ReportSkinTonePicker
          value={r.skin}
          onChange={(value) =>
            update("skin", value)
          }
        />
      </View>

      {/* CABELLO */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Cabello
        </Text>

        <Text style={s.body}>
          Registra por separado el color
          y las características del cabello.
          Ambos campos son opcionales.
        </Text>

        <ReportOptionPicker
          label="Color de cabello · Opcional"
          value={r.hairColor ?? ""}
          options={HAIR_COLOR_OPTIONS}
          onChange={(value) =>
            update("hairColor", value)
          }
        />

        <Field
          label="Características del cabello · Opcional"
          placeholder={
            "Ej. Largo, ondulado y recogido en coleta"
          }
          value={r.hairDescription ?? ""}
          multiline
          maxLength={500}
          onChangeText={(value) =>
            update("hairDescription", value)
          }
        />

        <Text style={s.body}>
          Puedes describir longitud, textura,
          peinado, flequillo, entradas o tintes.
        </Text>

        {!!r.hair?.trim() &&
          !r.hairColor?.trim() &&
          !r.hairDescription?.trim() && (
            <Text style={s.body}>
              Descripción guardada anteriormente:
              {" "}{r.hair}.
              Puedes conservarla o trasladarla
              a los campos nuevos.
            </Text>
          )}
      </View>

      {/* SEÑAS PARTICULARES */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Señas particulares
        </Text>

        <Text style={s.body}>
          Registra tatuajes, cicatrices, lunares,
          manchas, quemaduras u otras marcas
          distintivas que ayuden a reconocer
          a la persona.
        </Text>

        <Text style={s.body}>
          Añade una tarjeta por cada seña.
          En cada una deberás seleccionar su tipo
          y la zona corporal donde se encuentra.
          La descripción adicional es opcional.
        </Text>

        {r.marks.map((mark, index) => {
          const typeError =
            errors[`marks.${mark.id}.type`];

          const areaError =
            errors[`marks.${mark.id}.area`];

          return (
            <View key={mark.id} style={s.card}>
              <Text style={s.label}>
                Seña {index + 1}
              </Text>


              <FormErrorTarget id={`marks.${mark.id}.type`}>
                <ReportOptionPicker
                  label="Tipo de seña · Obligatorio"
                  value={mark.type}
                  options={MARK_TYPE_OPTIONS}
                  optional={false}
                  error={typeError}
                  onChange={(value) =>
                    onUpdateMark(
                      mark.id,
                      "type",
                      value
                    )
                  }
                />
              </FormErrorTarget>



              <FormErrorTarget id={`marks.${mark.id}.area`}>
                <ReportOptionPicker
                  label="Zona corporal · Obligatoria"
                  value={mark.area}
                  options={BODY_REGION_OPTIONS}
                  optional={false}
                  error={areaError}
                  onChange={(value) =>
                    onUpdateMark(
                      mark.id,
                      "area",
                      value
                    )
                  }
                />
              </FormErrorTarget>


              <Field
                label="Descripción de la seña · Opcional"
                placeholder={
                  "Ej. Cicatriz lineal de 4 cm en el antebrazo"
                }
                value={mark.description}
                multiline
                maxLength={500}
                onChangeText={(value) =>
                  onUpdateMark(
                    mark.id,
                    "description",
                    value
                  )
                }
              />

              <Text style={s.body}>
                Describe forma, tamaño, color,
                ubicación más precisa o algún
                símbolo reconocible. No repitas
                solamente el tipo de seña.
              </Text>

              <Action
                secondary
                label={`Quitar seña ${index + 1}`}
                onPress={() =>
                  onRemoveMark(mark.id)
                }
              />
            </View>
          );
        })}

        <Action
          secondary
          label="Añadir seña particular"
          onPress={onAddMark}
        />
      </View>

      {/* VESTIMENTA */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Vestimenta de la última vez que se vio
        </Text>

        <Text style={s.body}>
          Describe la ropa y el calzado que llevaba
          la persona la última vez que fue vista.
          Estos datos pueden ayudar a reconocerla.
        </Text>

        <Choices
          label="¿Conoces la ropa que llevaba?"
          options={["Sí", "No se sabe"]}
          value={
            r.clothesUnknown
              ? "No se sabe"
              : "Sí"
          }
          onChange={(value) =>
            update(
              "clothesUnknown",
              value === "No se sabe"
            )
          }
        />

        {!r.clothesUnknown && (
          <>
            <Field
              fieldId="clothes"
              label="Ropa que llevaba · Obligatoria"
              placeholder={
                "Ej. Sudadera roja, pantalón de mezclilla azul"
              }
              value={r.clothes}
              multiline
              maxLength={1000}
              onChangeText={(value) =>
                update("clothes", value)
              }
              error={errors.clothes}
            />

            <Text style={s.body}>
              Incluye prendas, colores, estampados,
              accesorios o características visibles.
              No necesitas conocer la marca.
            </Text>
          </>
        )}

        <Choices
          label="¿Conoces el calzado que llevaba?"
          options={["Sí", "No se sabe"]}
          value={
            r.shoesUnknown
              ? "No se sabe"
              : "Sí"
          }
          onChange={(value) =>
            update(
              "shoesUnknown",
              value === "No se sabe"
            )
          }
        />

        {!r.shoesUnknown && (
          <>
            <Field
              fieldId="shoes"
              label="Calzado · Obligatorio"
              placeholder={
                "Ej. Tenis blancos con detalles negros"
              }
              value={r.shoes}
              multiline
              maxLength={500}
              onChangeText={(value) =>
                update("shoes", value)
              }
              error={errors.shoes}
            />

            <Text style={s.body}>
              Describe tipo, color y detalles
              distinguibles. Por ejemplo:
              tenis, botas, sandalias o zapatos.
            </Text>
          </>
        )}
      </View>

      {/* DESCRIPCIÓN IDENTIFICATIVA */}
      <View style={s.card}>
        <Text
          accessibilityRole="header"
          style={s.heading}
        >
          Descripción identificativa
        </Text>

        <Text style={s.body}>
          Resume los rasgos que podrían ayudar
          a reconocer a la persona. Incluye
          información que no hayas especificado
          en los campos anteriores.
        </Text>

        <Field
          fieldId="identifyingDescription"
          label="Descripción identificativa · Obligatoria"
          placeholder={
            "Ej. Usa lentes de armazón negro, tiene barba corta y camina con una ligera cojera"
          }
          value={r.identifyingDescription ?? ""}
          multiline
          maxLength={1500}
          onChangeText={(value) =>
            update(
              "identifyingDescription",
              value
            )
          }
          error={errors.identifyingDescription}
        />
      </View>
    </>
  );
}

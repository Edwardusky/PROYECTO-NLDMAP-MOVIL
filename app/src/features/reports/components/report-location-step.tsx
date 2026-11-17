
import { useState } from "react";
import { Platform, Text, View } from "react-native";

import {
  Action,
  Choices,
  Field,
  useFormStyles,
} from "@/shared/components/form-controls";

import {
  loadLocation,
} from "@/shared/native/native-features";

import {
  informationModeLabel,
  isUnknownInformation,
  normalizeInformationMode,
} from "../model/report-options";

import type {
  ReportInvolvedPerson,
  ReportVehicle,
} from "../model/report-draft";

import type {
  ReportStepProps,
} from "./report-step-fields";

import {
  ReportDateTimeField,
} from "./report-date-time-field";

type Props = ReportStepProps & {
  onPickLocation: () => void;
};

const dateTimeModes = [
  "Conocida",
  "Aproximada",
  "Se desconoce",
];

const emptyVehicle: ReportVehicle = {
  brand: "",
  model: "",
  color: "",
  plate: "",
};

const emptyPerson: ReportInvolvedPerson = {
  name: "",
  description: "",
};

type AddressSuggestion = {
  coordinateKey: string;
  state: string;
  municipality: string;
};

export function ReportLocationStep({
  report: r,
  errors,
  onUpdate: update,
  onPickLocation,
}: Props) {
  const s = useFormStyles();

  const [lookingUpAddress, setLookingUpAddress] =
    useState(false);

  const [addressError, setAddressError] =
    useState<string | null>(null);

  const [addressSuggestion, setAddressSuggestion] =
    useState<AddressSuggestion | null>(null);

  const coordinateKey = r.coordinate?.join(",") ?? "";

  const suggestion =
    addressSuggestion?.coordinateKey === coordinateKey
      ? addressSuggestion
      : null;

  const locationLabel =
    r.locationKind === "Ubicación inferida"
      ? "Lugar probable (no confirmado)"
      : r.locationKind === "Última vez vista"
        ? "Último lugar donde fue vista"
        : "";

  async function suggestAddress() {
    if (!r.coordinate || lookingUpAddress) return;

    const coordinate = [...r.coordinate];
    const key = coordinate.join(",");

    setLookingUpAddress(true);
    setAddressError(null);
    setAddressSuggestion(null);

    try {
      const Location = await loadLocation();

      if (Platform.OS === "android") {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          setAddressError(
            "No se concedió permiso para consultar la dirección. " +
            "Puedes escribir el estado y municipio manualmente."
          );
          return;
        }
      }

      const addresses =
        await Location.reverseGeocodeAsync({
          longitude: coordinate[0],
          latitude: coordinate[1],
        });

      const address = addresses[0];

      if (!address) {
        setAddressError(
          "No se encontró una dirección para ese punto. " +
          "Introduce los datos manualmente."
        );
        return;
      }

      const suggestedState =
        address.region?.trim() ?? "";

      const suggestedMunicipality =
        address.subregion?.trim() ||
        address.city?.trim() ||
        "";

      if (!suggestedState && !suggestedMunicipality) {
        setAddressError(
          "No se pudieron identificar las divisiones administrativas. " +
          "Escribe el estado y municipio manualmente."
        );
        return;
      }

      setAddressSuggestion({
        coordinateKey: key,
        state: suggestedState,
        municipality: suggestedMunicipality,
      });
    } catch {
      setAddressError(
        "No fue posible consultar la dirección del punto. " +
        "Puedes completar los campos manualmente."
      );
    } finally {
      setLookingUpAddress(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;

    // Solo completar los campos que estén vacíos.
    if (!r.state.trim() && suggestion.state) {
      update("state", suggestion.state);
    }

    if (
      !r.municipality.trim() &&
      suggestion.municipality
    ) {
      update("municipality", suggestion.municipality);
    }

    setAddressSuggestion(null);
  }

  function updateVehicle(
    key: keyof ReportVehicle,
    value: string
  ) {
    update("vehicle", {
      ...(r.vehicle ?? emptyVehicle),
      [key]: value,
    });
  }

  function updatePerson(
    key: keyof ReportInvolvedPerson,
    value: string
  ) {
    update("involvedPerson", {
      ...(r.involvedPerson ?? emptyPerson),
      [key]: value,
    });
  }

  return (
    <>
      {/* FECHA Y HORA */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Última vez que se vio a la persona
        </Text>


        <Choices
          label="Fecha de última vez vista"
          options={dateTimeModes}
          value={informationModeLabel(r.dateMode)}
          onChange={(value) =>
            update(
              "dateMode",
              normalizeInformationMode(value)
            )
          }
        />

        {!isUnknownInformation(r.dateMode) && (
          <ReportDateTimeField
            label="Seleccionar fecha"
            mode="date"
            value={r.date}
            onChange={(value) => update("date", value)}
            error={errors.date}
          />
        )}

        {errors.dateMode && (
          <Text accessibilityRole="alert" style={s.error}>
            {errors.dateMode}
          </Text>
        )}

        <Choices
          label="Hora de última vez vista"
          options={dateTimeModes}
          value={informationModeLabel(r.timeMode)}
          onChange={(value) =>
            update(
              "timeMode",
              normalizeInformationMode(value)
            )
          }
        />

        {!isUnknownInformation(r.timeMode) && (
          <ReportDateTimeField
            label="Seleccionar hora"
            mode="time"
            value={r.time}
            onChange={(value) => update("time", value)}
            error={errors.time}
          />
        )}

        {errors.timeMode && (
          <Text accessibilityRole="alert" style={s.error}>
            {errors.timeMode}
          </Text>
        )}

        {(r.dateMode === "Aproximada" ||
          r.timeMode === "Aproximada") && (
          <Text style={s.body}>
            Las fechas y horas aproximadas son
            estimaciones; no se presentarán como
            información confirmada.
          </Text>
        )}
      </View>

      {/* LUGAR */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Lugar relacionado con los hechos
        </Text>

        <Text style={s.body}>
          Elige qué representa el punto del mapa.
        </Text>

        <Choices
          label="¿Qué representa el lugar marcado? · Obligatorio"
          options={[
            "Último lugar donde fue vista",
            "Lugar probable (no confirmado)",
          ]}
          value={locationLabel}
          onChange={(value) => {
            const inferred =
              value === "Lugar probable (no confirmado)";

            update(
              "locationKind",
              inferred
                ? "Ubicación inferida"
                : "Última vez vista"
            );

            if (inferred) {
              update(
                "locationPrecision",
                "Aproximada"
              );
            }
          }}
        />

        <Text style={s.body}>
          «Último lugar donde fue vista» indica un
          sitio conocido por el reportante.
          «Lugar probable» indica una zona deducida
          a partir de indicios y todavía no confirmada.
        </Text>

        {errors.locationKind && (
          <Text accessibilityRole="alert" style={s.error}>
            {errors.locationKind}
          </Text>
        )}

        <Choices
          label="Precisión del punto · Obligatoria"
          options={["Conocida", "Aproximada"]}
          value={r.locationPrecision ?? ""}
          onChange={(value) =>
            update("locationPrecision", value)
          }
        />

        <Text style={s.body}>
          Elige «Conocida» si el punto representa
          el lugar específico. Elige «Aproximada»
          si solo puedes señalar una zona cercana.
        </Text>

        {errors.locationPrecision && (
          <Text accessibilityRole="alert" style={s.error}>
            {errors.locationPrecision}
          </Text>
        )}

        <Text selectable style={s.body}>
          {r.coordinate
            ? `Punto confirmado: ${r.coordinate[1].toFixed(5)}, ${r.coordinate[0].toFixed(5)}`
            : "Todavía no has confirmado un punto."}
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
              : "Seleccionar punto en el mapa"
          }
          onPress={onPickLocation}
        />
      </View>

      {/* DIRECCIÓN */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Dirección del lugar seleccionado
        </Text>

        <Text style={s.body}>
          Estos datos describen dónde ocurrió
          el hecho, no dónde nació o vive la persona.
          Puedes completarlos manualmente.
        </Text>

        <Action
          secondary
          label={
            lookingUpAddress
              ? "Consultando dirección..."
              : "Sugerir estado y municipio desde el mapa"
          }
          disabled={!r.coordinate || lookingUpAddress}
          onPress={() => {
            void suggestAddress();
          }}
        />

        {suggestion && (
          <View style={s.card}>
            <Text style={s.body}>
              Dirección sugerida:
            </Text>

            <Text style={s.label}>
              Estado: {suggestion.state || "Sin dato"}
            </Text>

            <Text style={s.label}>
              Municipio: {suggestion.municipality || "Sin dato"}
            </Text>

            <Text style={s.body}>
              La sugerencia puede contener errores.
              Revisa los nombres antes de continuar.
            </Text>

            <Action
              secondary
              label="Rellenar los campos vacíos"
              onPress={applySuggestion}
            />
          </View>
        )}

        {!!addressError && (
          <Text
            accessibilityRole="alert"
            style={s.error}
          >
            {addressError}
          </Text>
        )}

        <Field
          label="Estado del lugar · Opcional"
          placeholder="Ej. Tlaxcala"
          value={r.state}
          onChangeText={(value) =>
            update("state", value)
          }
        />

        <Field
          label="Municipio del lugar · Opcional"
          placeholder="Ej. Apizaco"
          value={r.municipality}
          onChangeText={(value) =>
            update("municipality", value)
          }
        />

        <Field
          label="Localidad o colonia · Opcional"
          placeholder="Ej. Centro"
          value={r.locality}
          onChangeText={(value) =>
            update("locality", value)
          }
        />

        <Field
          label="Calle, dirección o referencia · Opcional"
          placeholder={
            "Ej. Cerca del mercado municipal, frente a una farmacia"
          }
          value={r.reference}
          onChangeText={(value) =>
            update("reference", value)
          }
          multiline
          maxLength={1000}
        />
      </View>

      {/* RELATO */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Relato de los hechos
        </Text>

        <Text style={s.body}>
          Describe cuándo se tuvo el último contacto,
          dónde se encontraba la persona y qué ocurrió
          después.
        </Text>

        <Field
          label="Descripción de lo ocurrido · Obligatoria"
          placeholder={
            "Ej. Salió de su domicilio por la mañana y se perdió comunicación con ella durante el trayecto..."
          }
          value={r.story}
          onChangeText={(value) =>
            update("story", value)
          }
          multiline
          maxLength={5000}
          error={errors.story}
        />
      </View>

      {/* VEHÍCULO */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Vehículo relacionado
        </Text>

        <Text style={s.body}>
          Si tienes información sobre un vehículo
          relacionado con los hechos, puedes añadirla.
          No es necesario conocer marca, modelo
          ni placas para completar otros datos.
        </Text>

        <Choices
          label="¿Deseas agregar un vehículo? · Opcional"
          options={["No agregar", "Agregar vehículo"]}
          value={
            r.vehicle
              ? "Agregar vehículo"
              : "No agregar"
          }
          onChange={(value) =>
            update(
              "vehicle",
              value === "Agregar vehículo"
                ? r.vehicle ?? { ...emptyVehicle }
                : null
            )
          }
        />

        {r.vehicle && (
          <>
            <Field
              label="Marca · Opcional"
              placeholder="Ej. Nissan"
              value={r.vehicle.brand}
              maxLength={80}
              onChangeText={(value) =>
                updateVehicle("brand", value)
              }
            />

            <Field
              label="Modelo · Opcional"
              placeholder="Ej. Versa"
              value={r.vehicle.model}
              maxLength={100}
              onChangeText={(value) =>
                updateVehicle("model", value)
              }
            />

            <Field
              label="Color · Opcional"
              placeholder="Ej. Gris oscuro"
              value={r.vehicle.color}
              maxLength={60}
              onChangeText={(value) =>
                updateVehicle("color", value)
              }
            />

            <Field
              label="Placas o matrícula · Opcional"
              placeholder="Ej. ABC123A"
              value={r.vehicle.plate}
              autoCapitalize="characters"
              maxLength={30}
              onChangeText={(value) =>
                updateVehicle(
                  "plate",
                  value.toUpperCase()
                )
              }
            />

            {!!errors.vehicle && (
              <Text
                accessibilityRole="alert"
                style={s.error}
              >
                {errors.vehicle}
              </Text>
            )}
          </>
        )}
      </View>

      {/* PERSONA INVOLUCRADA */}
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>
          Persona posiblemente relacionada
        </Text>

        <Text style={s.body}>
          Registra a una persona relacionada con
          los hechos únicamente si cuentas con
          información pertinente. Puedes describir
          sus características aunque no conozcas
          su nombre.
        </Text>

        <Choices
          label="¿Deseas agregar una persona? · Opcional"
          options={["No agregar", "Agregar persona"]}
          value={
            r.involvedPerson
              ? "Agregar persona"
              : "No agregar"
          }
          onChange={(value) =>
            update(
              "involvedPerson",
              value === "Agregar persona"
                ? r.involvedPerson ?? { ...emptyPerson }
                : null
            )
          }
        />

        {r.involvedPerson && (
          <>
            <Field
              label="Nombre de la persona · Opcional"
              placeholder="Nombre o identificación conocida"
              value={r.involvedPerson.name}
              maxLength={200}
              onChangeText={(value) =>
                updatePerson("name", value)
              }
            />

            <Field
              label="Descripción · Opcional"
              placeholder={
                "Ej. Persona adulta con chamarra negra, vista en el lugar de los hechos"
              }
              value={r.involvedPerson.description}
              multiline
              maxLength={2000}
              onChangeText={(value) =>
                updatePerson("description", value)
              }
            />

            {!!errors.involvedPerson && (
              <Text
                accessibilityRole="alert"
                style={s.error}
              >
                {errors.involvedPerson}
              </Text>
            )}
          </>
        )}

        <Text style={s.body}>
          Registrar una persona en este apartado
          no significa atribuirle responsabilidad.
          La información deberá revisarse antes
          de cualquier posible difusión.
        </Text>
      </View>

      {/* DATOS ANTERIORES */}
      {r.involved && !!r.involvement?.trim() && (
        <View style={s.card}>
          <Text accessibilityRole="header" style={s.heading}>
            Información de un borrador anterior
          </Text>

          <Text selectable style={s.body}>
            {r.involvement}
          </Text>

          <Text style={s.body}>
            Esta información se capturó en el
            formulario anterior. Revísala y
            distribúyela entre vehículo y persona
            posiblemente relacionada, si corresponde.
            No se ha dividido automáticamente.
          </Text>
        </View>
      )}
    </>
  );
}

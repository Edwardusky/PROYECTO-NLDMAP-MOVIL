import { useCallback, useEffect, useState } from "react";
import { BackHandler, Image, Text, View } from "react-native";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  Action,
  Choices,
  Field,
  FormScreen,
  formStyles as s,
} from "@/components/form-controls";
import { LocalPhotoPicker } from "@/components/local-photo-picker";
import { useLocalDraft } from "@/state/local-draft-context";
import {
  coordinateValid,
  reportErrors,
  seedReport,
  type Report,
} from "@/data/local-draft";

const sections = [
  "Identificación",
  "Descripción",
  "Última vez vista y hechos",
  "Quien reporta",
  "Revisión",
];
type TextKey = {
  [K in keyof Report]: Report[K] extends string ? K : never;
}[keyof Report];
const unknown = ["Conocida", "Aproximada", "No se sabe"];

export default function CreateReportScreen() {
  const {
    report: r,
    setReport,
    profile,
    step,
    setStep,
    setPicking,
    setEditingLocation,
  } = useLocalDraft();
  const params = useLocalSearchParams<{
    longitude?: string;
    latitude?: string;
  }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    setReport((current) => {
      const seeded = seedReport(current, profile);
      if (
        seeded.coordinate ||
        !params.longitude?.trim() ||
        !params.latitude?.trim()
      )
        return seeded;
      const coordinate: [number, number] = [
        Number(params.longitude),
        Number(params.latitude),
      ];
      return coordinateValid(coordinate) ? { ...seeded, coordinate } : seeded;
    });
  }, [params.longitude, params.latitude, profile, setReport]);
  const back = useCallback(() => {
    setNotice(null);
    setErrors({});
    if (step > 0) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [step, setStep]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          back();
          return true;
        },
      );
      return () => subscription.remove();
    }, [back]),
  );
  function update<K extends keyof Report>(key: K, value: Report[K]) {
    setReport((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setNotice(null);
  }
  function field(
    key: TextKey,
    label: string,
    multiline = false,
    keyboardType:
      | "default"
      | "number-pad"
      | "decimal-pad"
      | "email-address"
      | "phone-pad" = "default",
  ) {
    return (
      <Field
        key={key}
        label={label}
        value={r[key]}
        onChangeText={(value) => update(key, value)}
        error={errors[key]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
      />
    );
  }
  function choose(key: TextKey, label: string, options: readonly string[]) {
    return (
      <Choices
        label={label}
        options={options}
        value={r[key]}
        onChange={(value) => update(key, value)}
      />
    );
  }
  function next() {
    const nextErrors = reportErrors(r, step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice("Revisa los campos indicados antes de continuar.");
      return;
    }
    setNotice(null);
    setStep(step + 1);
  }
  function submit() {
    for (let index = 0; index < 4; index++) {
      const nextErrors = reportErrors(r, index);
      if (Object.keys(nextErrors).length) {
        setStep(index);
        setErrors(nextErrors);
        setNotice("Revisa los campos indicados.");
        return;
      }
    }
    setNotice("Función no disponible. No se enviaron datos.");
  }
  function edit(index: number) {
    setStep(index);
    setErrors({});
    setNotice(null);
  }
  function summary(label: string, value: string) {
    return (
      <Text style={s.body}>
        {label}: {value.trim() || "No indicado"}
      </Text>
    );
  }
  const coordinateText = r.coordinate
    ? `${r.coordinate[1].toFixed(6)}, ${r.coordinate[0].toFixed(6)}`
    : "Sin seleccionar";
  return (
    <FormScreen key={step}>
      <Stack.Screen
        options={{
          headerLeft: () => <Action secondary label="Atrás" onPress={back} />,
        }}
      />
      <Text accessibilityRole="header" style={s.title}>
        {step + 1} de 5 · {sections[step]}
      </Text>
      <Text style={s.body}>
        Completa solo lo que sabes. Los campos con * son necesarios para revisar
        este borrador.
      </Text>
      {notice && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={s.body}
        >
          {notice}
        </Text>
      )}
      {step === 0 && (
        <>
          {field("firstName", "Nombre de la persona buscada *")}
          {field("lastName", "Apellidos · Opcional")}
          {choose("ageMode", "Edad", unknown)}
          {r.ageMode !== "No se sabe" &&
            field("age", "Edad en años *", false, "number-pad")}
          {choose("sex", "Sexo", [
            "Mujer",
            "Hombre",
            "Intersexual",
            "No se sabe",
          ])}
          <LocalPhotoPicker
            label="Foto de la persona buscada"
            uri={r.photo}
            onChange={(photo) => update("photo", photo)}
          />
        </>
      )}
      {step === 1 && (
        <>
          <Text style={s.body}>
            Todos los datos de descripción son opcionales. Deja vacío lo que no
            sepas.
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
                  onChangeText={(value) =>
                    update(
                      "marks",
                      r.marks.map((item) =>
                        item.id === mark.id ? { ...item, [key]: value } : item,
                      ),
                    )
                  }
                />
              ))}
              <Action
                secondary
                label={`Quitar seña ${index + 1}`}
                onPress={() =>
                  update(
                    "marks",
                    r.marks.filter((item) => item.id !== mark.id),
                  )
                }
              />
            </View>
          ))}
          <Action
            secondary
            label="Añadir seña particular"
            onPress={() =>
              update("marks", [
                ...r.marks,
                {
                  id: Math.max(0, ...r.marks.map((mark) => mark.id)) + 1,
                  type: "",
                  area: "",
                  description: "",
                },
              ])
            }
          />
          {field("clothes", "Ropa que llevaba", true)}
          {field("shoes", "Calzado", true)}
        </>
      )}
      {step === 2 && (
        <>
          {choose("dateMode", "Fecha de última vez vista", unknown)}
          {r.dateMode !== "No se sabe" && field("date", "Fecha * · AAAA-MM-DD")}
          {choose("timeMode", "Hora de última vez vista", unknown)}
          {r.timeMode !== "No se sabe" &&
            field("time", "Hora * · HH:MM (24 horas)")}
          {choose("locationKind", "Qué representa el punto del mapa", [
            "Última vez vista",
            "Ubicación inferida",
            "Avistamiento",
          ])}
          <Text selectable style={s.body}>
            Ubicación confirmada (latitud, longitud): {coordinateText}
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
            onPress={() => {
              setEditingLocation(true);
              setPicking(true);
              router.navigate("/");
            }}
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
      )}
      {step === 3 && (
        <>
          <Text style={s.body}>
            Contacto privado para gestionar el reporte. Puedes corregirlo aquí
            sin cambiar tu perfil.
          </Text>
          <Action
            secondary
            label="Usar datos del perfil local"
            onPress={() => {
              const seeded = seedReport({ ...r, started: false }, profile);
              setReport(seeded);
              setErrors({});
              setNotice(
                "Datos del perfil copiados al borrador. Puedes corregirlos.",
              );
            }}
          />
          {field("reporterName", "Nombre completo de quien reporta *")}
          <Text style={s.body}>
            Indica al menos un correo o teléfono válido.
          </Text>
          {field("reporterEmail", "Correo de contacto", false, "email-address")}
          {field("reporterPhone", "Teléfono de contacto", false, "phone-pad")}
          {choose("relationship", "Relación con la persona buscada", [
            "Familiar",
            "Amistad",
            "Conocido/a",
            "Otra",
            "Prefiero no indicar",
          ])}
          {field("reporterAddress", "Domicilio de contacto · Opcional", true)}
          {field("reporterSocial", "Redes sociales de contacto · Opcional")}
        </>
      )}
      {step === 4 && (
        <>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.heading}>
              Persona buscada
            </Text>
            {summary(
              "Nombre",
              [r.firstName, r.lastName].filter(Boolean).join(" "),
            )}
            {summary(
              "Edad",
              r.ageMode === "No se sabe"
                ? r.ageMode
                : `${r.age} años · ${r.ageMode}`,
            )}
            {summary("Sexo", r.sex)}
            {r.photo ? (
              <Image
                source={{ uri: r.photo }}
                accessibilityLabel="Foto de la persona buscada, vista previa"
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
              Última vez vista y hechos
            </Text>
            {summary(
              "Fecha",
              r.dateMode === "No se sabe"
                ? r.dateMode
                : `${r.date} · ${r.dateMode}`,
            )}
            {summary(
              "Hora",
              r.timeMode === "No se sabe"
                ? r.timeMode
                : `${r.time} · ${r.timeMode}`,
            )}
            {summary("Tipo de ubicación", r.locationKind)}
            {summary("Latitud, longitud", coordinateText)}
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
              Contacto privado de quien reporta
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
      )}
      {step < 4 && (
        <Action
          label={step === 3 ? "Revisar borrador" : "Continuar"}
          onPress={next}
        />
      )}
      {notice && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={s.body}
        >
          {notice}
        </Text>
      )}
      <Action
        secondary
        label={step ? "Paso anterior" : "Volver al mapa"}
        onPress={back}
      />
    </FormScreen>
  );
}

import type { Profile } from "@/features/profile/model/profile";
import { emailValid, phoneValid } from "../../../shared/validation/contact";
import {
  isUnknownInformation,
  normalizeInformationMode,
  UNKNOWN_INFORMATION,
} from "./report-options";

export type Mark = {
  id: number;
  type: string;
  area: string;
  description: string;
};
export type ReportVehicle = {
  brand: string;
  model: string;
  color: string;
  plate: string;
};

export type ReportInvolvedPerson = {
  name: string;
  description: string;
};

export type Report = {
  started: boolean;
  firstName: string;
  // Campos nuevos de identificación.
  paternalSurname: string;
  maternalSurname: string;
  // Campo heredado de borradores anteriores.
  // Lo conservamos temporalmente para no perder información.
  lastName: string;
  ageMode: string;
  age: string;
  sex: string;
  photo: string | null;

  height: string;
  heightUnit: string; // Compatibilidad con borradores anteriores.
  heightApproximate: boolean;

  build: string;
  skin: string;

  // hair se conserva para borradores anteriores.
  hair: string;
  hairColor: string;
  hairDescription: string;

  marks: Mark[];

  clothes: string;
  clothesUnknown: boolean;

  shoes: string;
  shoesUnknown: boolean;

  identifyingDescription: string;

  dateMode: string;
  date: string;
  timeMode: string;
  time: string;
  locationKind: string;
  locationPrecision: string;
  coordinate: [number, number] | null;
  state: string;
  municipality: string;
  locality: string;
  reference: string;
  story: string;
  involved: boolean;
  involvement: string;
  vehicle: ReportVehicle | null;
  involvedPerson: ReportInvolvedPerson | null;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  relationship: string;
  reporterAddress: string;
  reporterSocial: string;
};
export const emptyReport: Report = {
  started: false,
  firstName: "",
  paternalSurname: "",
  maternalSurname: "",
  lastName: "",
  ageMode: UNKNOWN_INFORMATION,
  age: "",
  sex: "",
  photo: null,

  height: "",
  heightUnit: "cm",
  heightApproximate: false,

  build: "",
  skin: "",

  hair: "",
  hairColor: "",
  hairDescription: "",

  marks: [],

  clothes: "",
  clothesUnknown: false,

  shoes: "",
  shoesUnknown: false,

  identifyingDescription: "",

  dateMode: UNKNOWN_INFORMATION,
  date: "",
  timeMode: UNKNOWN_INFORMATION,
  time: "",
  locationKind: "Última vez vista",
  locationPrecision: "",
  coordinate: null,
  state: "",
  municipality: "",
  locality: "",
  reference: "",
  story: "",
  involved: false,
  involvement: "",
  vehicle: null,
  involvedPerson: null,
  reporterName: "",
  reporterEmail: "",
  reporterPhone: "",
  relationship: "Prefiero no indicar",
  reporterAddress: "",
  reporterSocial: "",
};
export const coordinateValid = (point: [number, number] | null) =>
  !!point &&
  point.every(Number.isFinite) &&
  Math.abs(point[0]) <= 180 &&
  Math.abs(point[1]) <= 90;
export function seedReport(report: Report, profile: Profile): Report {

  const ageMode = normalizeInformationMode(report.ageMode);
  const dateMode = normalizeInformationMode(report.dateMode);
  const timeMode = normalizeInformationMode(report.timeMode);

  let height = report.height;
  let heightUnit = report.heightUnit;

  // Migrar una estatura antigua expresada en metros.
  if (heightUnit === "m") {
    if (!height.trim()) {
      heightUnit = "cm";
    } else {
      const meters = Number(
        height.replace(",", ".")
      );

      if (
        Number.isFinite(meters) &&
        meters > 0 &&
        meters <= 3
      ) {
        height = String(Math.round(meters * 100));
        heightUnit = "cm";
      }
    }
  }

  if (
    ageMode !== report.ageMode ||
    dateMode !== report.dateMode ||
    timeMode !== report.timeMode ||
    height !== report.height ||
    heightUnit !== report.heightUnit
  ) {
    report = {
      ...report,
      ageMode,
      dateMode,
      timeMode,
      height,
      heightUnit,
    };
  }

  return report.started
    ? report
    : {
      ...report,
      started: true,
      reporterName: [profile.firstName.trim(), profile.lastName.trim()]
        .filter(Boolean)
        .join(" "),
      reporterEmail: profile.email,
      reporterPhone: profile.phone,
      reporterAddress: [
        profile.street,
        profile.locality,
        profile.municipality,
        profile.state,
        profile.postalCode,
        profile.reference,
      ]
        .filter((value) => value.trim())
        .join(", "),
      reporterSocial: profile.social,
    };
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function reportErrors(
  report: Report,
  step: number,
): Record<string, string> {
  const errors: Record<string, string> = {};


  if (step === 0) {
    if (!report.firstName.trim()) {
      errors.firstName =
        "El nombre de la persona es obligatorio.";
    }

    if (!report.paternalSurname?.trim()) {
      errors.paternalSurname =
        "El apellido paterno es obligatorio.";
    }

    if (!report.maternalSurname?.trim()) {
      errors.maternalSurname =
        "El apellido materno es obligatorio.";
    }

    if (
      !isUnknownInformation(report.ageMode) &&
      (
        !/^\d{1,3}$/.test(report.age) ||
        Number(report.age) > 120
      )
    ) {
      errors.age =
        "Introduce una edad entre 0 y 120 años o selecciona Se desconoce.";
    }

    if (
      report.sex !== "Mujer" &&
      report.sex !== "Hombre"
    ) {
      errors.sex =
        "Selecciona el sexo de la persona reportada.";
    }

    if (!report.photo) {
      errors.photo =
        "Agrega una fotografía principal para continuar.";
    }
  }


  if (step === 1) {
    // 1. Estatura opcional, exclusivamente en cm
    // para los datos nuevos.
    if (report.height.trim()) {
      const raw = report.height.trim();

      const cm =
        report.heightUnit === "m"
          ? Number(raw.replace(",", ".")) * 100
          : Number(raw);

      const formatValid =
        report.heightUnit === "m" ||
        /^\d{2,3}$/.test(raw);

      if (
        !Number.isFinite(cm) ||
        !formatValid ||
        cm < 30 ||
        cm > 300
      ) {
        errors.height =
          "Introduce una estatura entre 30 y 300 cm.";
      }
    }

    // 2. Cada seña añadida necesita tipo y zona.
    for (const mark of report.marks) {
      if (!mark.type.trim()) {
        errors[`marks.${mark.id}.type`] =
          "Selecciona el tipo de seña.";
      }

      if (!mark.area.trim()) {
        errors[`marks.${mark.id}.area`] =
          "Selecciona la zona corporal.";
      }
    }

    // 3. La ropa requiere descripción o
    // una indicación explícita de desconocimiento.
    if (
      !report.clothesUnknown &&
      !report.clothes.trim()
    ) {
      errors.clothes =
        "Describe la ropa que llevaba o indica que se desconoce.";
    }

    // 4. Mismo criterio para el calzado.
    if (
      !report.shoesUnknown &&
      !report.shoes.trim()
    ) {
      errors.shoes =
        "Describe el calzado o indica que se desconoce.";
    }

    // 5. Descripción identificativa obligatoria.
    if (
      !report.identifyingDescription?.trim()
    ) {
      errors.identifyingDescription =
        "Escribe una descripción que ayude a identificar a la persona.";
    }
  }


  if (step === 2) {
    // FECHA
    if (!isUnknownInformation(report.dateMode)) {
      if (
        report.dateMode !== "Conocida" &&
        report.dateMode !== "Aproximada"
      ) {
        errors.dateMode =
          "Indica si la fecha es conocida, aproximada o desconocida.";
      } else if (!validDate(report.date)) {
        errors.date =
          "Selecciona una fecha válida en el calendario.";
      } else {
        const today = new Date();
        const localToday = [
          today.getFullYear(),
          String(today.getMonth() + 1).padStart(2, "0"),
          String(today.getDate()).padStart(2, "0"),
        ].join("-");

        if (report.date > localToday) {
          errors.date =
            "La última vez que se vio a la persona no puede estar en el futuro.";
        }
      }
    }

    // HORA
    if (!isUnknownInformation(report.timeMode)) {
      if (
        report.timeMode !== "Conocida" &&
        report.timeMode !== "Aproximada"
      ) {
        errors.timeMode =
          "Indica si la hora es conocida, aproximada o desconocida.";
      } else if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(report.time)
      ) {
        errors.time =
          "Selecciona una hora válida en el reloj.";
      }
    }

    // SIGNIFICADO DEL PUNTO
    if (
      report.locationKind !== "Última vez vista" &&
      report.locationKind !== "Ubicación inferida"
    ) {
      errors.locationKind =
        "Selecciona qué representa el lugar marcado.";
    }

    // PRECISIÓN DE LA UBICACIÓN
    if (
      report.locationPrecision !== "Conocida" &&
      report.locationPrecision !== "Aproximada"
    ) {
      errors.locationPrecision =
        "Indica si el punto es conocido o aproximado.";
    }

    if (
      report.locationKind === "Ubicación inferida" &&
      report.locationPrecision === "Conocida"
    ) {
      errors.locationPrecision =
        "Un lugar probable no confirmado debe marcarse como aproximado.";
    }

    // COORDENADAS
    if (!coordinateValid(report.coordinate)) {
      errors.coordinate =
        "Selecciona y confirma el punto en el mapa.";
    }

    // RELATO
    if (!report.story.trim()) {
      errors.story =
        "Describe lo ocurrido y la información conocida.";
    }

    // VEHÍCULO OPCIONAL
    if (report.vehicle) {
      const vehicle = report.vehicle;

      const hasVehicleDetail = [
        vehicle.brand,
        vehicle.model,
        vehicle.color,
        vehicle.plate,
      ].some((value) => value.trim().length > 0);

      if (!hasVehicleDetail) {
        errors.vehicle =
          "Proporciona al menos un dato del vehículo o quita este apartado.";
      }
    }

    // PERSONA RELACIONADA OPCIONAL
    if (report.involvedPerson) {
      const person = report.involvedPerson;

      if (
        !person.name.trim() &&
        !person.description.trim()
      ) {
        errors.involvedPerson =
          "Proporciona un nombre o una descripción de la persona.";
      }
    }
  }

  if (step === 3) {
    if (!report.reporterName.trim())
      errors.reporterName = "Escribe el nombre de quien reporta.";
    if (!report.reporterEmail.trim() && !report.reporterPhone.trim())
      errors.reporterEmail =
        "Indica al menos un correo o teléfono de contacto.";
    if (report.reporterEmail.trim() && !emailValid(report.reporterEmail))
      errors.reporterEmail = "Escribe un correo válido.";
    if (report.reporterPhone.trim() && !phoneValid(report.reporterPhone))
      errors.reporterPhone = "Escribe un teléfono válido de 7 a 15 dígitos.";
  }
  return errors;
}

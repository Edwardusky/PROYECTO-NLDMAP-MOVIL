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
export type Report = {
  started: boolean;
  firstName: string;
  // Campos nuevos de identificación.
  paternalSurname: string;
  maternalSurname: string;
  surnamesUnknown: boolean;
  // Campo heredado de borradores anteriores.
  // Lo conservamos temporalmente para no perder información.
  lastName: string;
  ageMode: string;
  age: string;
  sex: string;
  photo: string | null;
  height: string;
  heightUnit: string;
  build: string;
  skin: string;
  hair: string;
  marks: Mark[];
  clothes: string;
  shoes: string;
  dateMode: string;
  date: string;
  timeMode: string;
  time: string;
  locationKind: string;
  coordinate: [number, number] | null;
  state: string;
  municipality: string;
  locality: string;
  reference: string;
  story: string;
  involved: boolean;
  involvement: string;
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
  surnamesUnknown: false,
  lastName: "",
  ageMode: UNKNOWN_INFORMATION,
  age: "",
  sex: "No se sabe",
  photo: null,
  height: "",
  heightUnit: "cm",
  build: "",
  skin: "",
  hair: "",
  marks: [],
  clothes: "",
  shoes: "",
  dateMode: UNKNOWN_INFORMATION,
  date: "",
  timeMode: UNKNOWN_INFORMATION,
  time: "",
  locationKind: "Última vez vista",
  coordinate: null,
  state: "",
  municipality: "",
  locality: "",
  reference: "",
  story: "",
  involved: false,
  involvement: "",
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
  if (
    ageMode !== report.ageMode ||
    dateMode !== report.dateMode ||
    timeMode !== report.timeMode
  ) {
    report = { ...report, ageMode, dateMode, timeMode };
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
        "Escribe el nombre o nombres de la persona reportada.";
    }

    const hasSurname =
      !!report.paternalSurname?.trim() ||
      !!report.maternalSurname?.trim();

    if (!report.surnamesUnknown && !hasSurname) {
      errors.paternalSurname =
        "Indica al menos un apellido o selecciona que ambos se desconocen.";
    }

    if (
      !isUnknownInformation(report.ageMode) &&
      (
        !/^\d{1,3}$/.test(report.age) ||
        Number(report.age) > 120
      )
    ) {
      errors.age =
        "Introduce una edad de 0 a 120 años o selecciona Se desconoce.";
    }

    if (!report.photo) {
      errors.photo =
        "Agrega una fotografía principal para continuar.";
    }
  }

  if (step === 1 && report.height.trim()) {
    const value = Number(report.height.replace(",", "."));
    const cm = report.heightUnit === "m" ? value * 100 : value;
    if (!Number.isFinite(cm) || cm <= 0 || cm > 300)
      errors.height =
        "Revisa la estatura y la unidad; también puedes dejarla vacía.";
  }
  if (step === 2) {
    if (!coordinateValid(report.coordinate))
      errors.coordinate = "Selecciona y confirma una ubicación en el mapa.";
    if (!isUnknownInformation(report.dateMode) && !validDate(report.date))
      errors.date = "Usa una fecha válida: AAAA-MM-DD.";
    if (
      !isUnknownInformation(report.timeMode) &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(report.time)
    )
      errors.time = "Usa una hora válida: HH:MM (24 horas).";
    if (!report.story.trim()) errors.story = "Describe brevemente lo ocurrido.";
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


export const COMPLEXION_OPTIONS = [
  "Delgada",
  "Media",
  "Robusta",
  "Atlética",
] as const;

export const HAIR_COLOR_OPTIONS = [
  "Negro",
  "Castaño oscuro",
  "Castaño claro",
  "Rubio",
  "Pelirrojo",
  "Canoso",
  "Blanco",
  "Teñido de otro color",
  "Otro",
] as const;

export const MARK_TYPE_OPTIONS = [
  "Cicatriz",
  "Tatuaje",
  "Lunar",
  "Mancha",
  "Quemadura",
  "Perforación o piercing",
  "Otra seña",
] as const;

export const BODY_REGION_OPTIONS = [
  "Cabeza",
  "Rostro",
  "Cuello",
  "Pecho",
  "Abdomen",
  "Espalda",
  "Brazo derecho",
  "Brazo izquierdo",
  "Mano derecha",
  "Mano izquierda",
  "Pierna derecha",
  "Pierna izquierda",
  "Pie derecho",
  "Pie izquierdo",
  "Otra zona",
] as const;

export const MONK_SKIN_TONES = [
  { id: "MST-01", hex: "#F6EDE4", number: "01" },
  { id: "MST-02", hex: "#F3E7DB", number: "02" },
  { id: "MST-03", hex: "#F7EAD0", number: "03" },
  { id: "MST-04", hex: "#EADABA", number: "04" },
  { id: "MST-05", hex: "#D7BD96", number: "05" },
  { id: "MST-06", hex: "#A07E56", number: "06" },
  { id: "MST-07", hex: "#825C43", number: "07" },
  { id: "MST-08", hex: "#604134", number: "08" },
  { id: "MST-09", hex: "#3A312A", number: "09" },
  { id: "MST-10", hex: "#292420", number: "10" },
] as const;

export function skinToneLabel(value: string): string {
  if (!value.trim()) return "No indicado";

  const tone = MONK_SKIN_TONES.find(
    (item) => item.id === value
  );

  return tone
    ? `Monk ${tone.number}`
    : value; // Compatibilidad con borradores anteriores.
}

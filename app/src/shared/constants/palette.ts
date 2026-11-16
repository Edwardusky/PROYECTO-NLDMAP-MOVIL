
/**
 * Paletas de colores de NLDMAP.
 *
 * Los nombres representan funciones visuales,
 * no colores específicos.
 */

export const lightPalette = {
  surface: "#F7F9F6",
  surfaceAlt: "#E8EEE7",
  paper: "#FFFFFF",
  userLocation: "#1877F2",
  text: "#173D3A",
  muted: "#52675E",

  action: "#173D3A",
  onAction: "#FFFFFF",

  border: "#718278",
  divider: "#D8E1D9",
  error: "#A32929",

  searching: "#654DA4",
  located: "#246D59",
  sighting: "#215F8A",
  draft: "#875619",

  overlay: "#00000066",
  mapPlaceholder: "#DDE9E5",

  mapMarkerText: "#FFFFFF",
  mapMarkerOutline: "#FFFFFF",

  
} as const;

export type Palette = {
  [K in keyof typeof lightPalette]: string;
};

export const darkPalette: Palette = {
  surface: "#101B1A",
  surfaceAlt: "#1C302D",
  paper: "#253D39",
  userLocation: "#4EA7FF",
  text: "#F2F7F4",
  muted: "#B3C8BD",

  action: "#66BBAA",
  onAction: "#0B201C",

  border: "#65867C",
  divider: "#335149",
  error: "#FF8D8D",

  searching: "#C4ADFF",
  located: "#63D5AD",
  sighting: "#78C4F0",
  draft: "#F2BF72",

  overlay: "#00000099",
  mapPlaceholder: "#1D302D",

  mapMarkerText: "#FFFFFF",
  mapMarkerOutline: "#FFFFFF",
};

/**
 * Compatibilidad temporal con componentes
 * que todavía no utilizan useAppTheme().
 *
 * Eliminar esta exportación al completar
 * la migración de todos los componentes.
 */
export const palette = lightPalette;

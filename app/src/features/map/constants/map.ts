import type { LngLat } from "@maplibre/maplibre-react-native";

// Vista inicial aproximada de Tlaxcala.
export const INITIAL_VIEW = {
  center: [-98.17, 19.42] as LngLat,
  zoom: 8.5,
};

// Estilo cartográfico para pruebas de desarrollo.
export const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";
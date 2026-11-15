
import type { LngLat } from "@maplibre/maplibre-react-native";

// Vista inicial aproximada de Tlaxcala.
export const INITIAL_VIEW = {
  center: [-98.17, 19.42] as LngLat,
  zoom: 8.5,
};

// Mapa claro.
export const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

// Mapa oscuro.
export const MAP_STYLE_DARK =
  "https://tiles.openfreemap.org/styles/dark";

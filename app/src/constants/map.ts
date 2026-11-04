import type { LngLat } from '@maplibre/maplibre-react-native';

// Camera framing only, approximately central Tlaxcala; never a device location or report.
export const INITIAL_VIEW = { center: [-98.17, 19.42] as LngLat, zoom: 8.5 };
export const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
export const CASE_STATUSES = ['En búsqueda', 'Localizados'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

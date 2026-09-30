import type { LngLat } from '@maplibre/maplibre-react-native';
import type { CaseStatus } from '@/constants/map';

export type DemoCase = {
  id: string;
  name: string;
  age: number;
  status: CaseStatus;
  municipality: string;
  date: string;
  coordinates: LngLat;
};

// UI fixtures only. Never merge this source with API reports or the user's draft.
// All names, ages, dates and locations below describe fictional demonstration cases.
export const DEMO_CASES: DemoCase[] = [
  { id: 'demo-alfa', name: 'Persona ficticia Alfa', age: 28, status: 'En búsqueda',
    municipality: 'Tlaxcala', date: '2026-09-01', coordinates: [-98.24, 19.32] },
  { id: 'demo-beta', name: 'Persona ficticia Beta', age: 41, status: 'Localizados',
    municipality: 'Apizaco', date: '2026-09-02', coordinates: [-98.14, 19.41] },
  { id: 'demo-gamma', name: 'Persona ficticia Gamma', age: 35, status: 'En búsqueda',
    municipality: 'Chiautempan', date: '2026-09-03', coordinates: [-98.18, 19.31] },
];

import type { CaseStatus } from '@/features/reports/model/case-status';

// Fields used by the map, independent of demo fixtures and native imports.
export type MapCase = {
  id: string;
  name: string;
  age: number;
  status: CaseStatus;
  coordinates: [number, number];
};

export function filterCases<T extends MapCase>(cases: T[], statuses: CaseStatus[]) {
  return cases.filter(item => statuses.includes(item.status));
}
export function casesAtPoint<T extends MapCase>(cases: T[], point: [number, number] | null) {
  return cases.filter(item => point && item.coordinates[0] === point[0] && item.coordinates[1] === point[1]);
}
// A shared label at exact coincidences does not merge IDs or move coordinates.
export function pointStatusLabel(cases: MapCase[], point: [number, number]) {
  const entries = casesAtPoint(cases, point);
  return [entries.some(item => item.status === 'En búsqueda') ? 'B' : '', entries.some(item => item.status === 'Localizados') ? 'L' : ''].filter(Boolean).join('/');
}

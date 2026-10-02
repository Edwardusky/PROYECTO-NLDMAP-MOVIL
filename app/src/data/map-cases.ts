import type { DemoCase } from './demo-cases';
import type { CaseStatus } from '@/constants/map';

export function filterCases(cases: DemoCase[], statuses: CaseStatus[]) {
  return cases.filter(item => statuses.includes(item.status));
}
export function casesAtPoint(cases: DemoCase[], point: [number, number] | null) {
  return cases.filter(item => point && item.coordinates[0] === point[0] && item.coordinates[1] === point[1]);
}
// A shared label at exact coincidences does not merge IDs or move coordinates.
export function pointStatusLabel(cases: DemoCase[], point: [number, number]) {
  const entries = casesAtPoint(cases, point);
  return [entries.some(item => item.status === 'En búsqueda') ? 'B' : '', entries.some(item => item.status === 'Localizados') ? 'L' : ''].filter(Boolean).join('/');
}

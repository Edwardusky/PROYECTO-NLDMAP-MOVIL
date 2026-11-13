export const CASE_STATUSES = ['En búsqueda', 'Localizados'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

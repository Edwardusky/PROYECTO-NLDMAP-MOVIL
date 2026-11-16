
export type MapSheetIndex = 0 | 1 | 2;

/**
 * Calcula las alturas del panel utilizando
 * la altura disponible del mapa.
 *
 * 0: Compacto
 * 1: Intermedio
 * 2: Expandido
 */
export function getMapSheetSnapPoints(
  viewportHeight: number
): [number, number, number] {
  const available = Math.max(
    180,
    Math.floor(viewportHeight)
  );

  const compact = Math.min(
    132,
    Math.max(124, Math.round(available * 0.27))
  );

  const medium = Math.min(
    available - 14,
    Math.max(
      compact + 42,
      Math.round(available * 0.52)
    )
  );

  const expanded = Math.min(
    available,
    Math.max(
      medium + 24,
      Math.round(available * 0.86)
    )
  );

  return [compact, medium, expanded];
}

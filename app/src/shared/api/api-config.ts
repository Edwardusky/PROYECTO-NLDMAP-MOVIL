
/**
 * Configuración central de conexión con
 * el backend de NLDMAP.
 */

const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredUrl) {
  throw new Error(
    "Falta configurar EXPO_PUBLIC_API_URL."
  );
}

/**
 * URL base del servidor.
 *
 * Ejemplo:
 * https://busquedatlaxcala.app
 */
export const API_URL =
  configuredUrl.replace(/\/+$/, "");

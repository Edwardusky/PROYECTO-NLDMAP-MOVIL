
import { API_URL } from "@/shared/api/api-config";

export type RegisterAccountRequest = {
  displayName: string;
  email: string;
  password: string;
};

/**
 * Registra un usuario utilizando
 * ASP.NET Core Identity.
 *
 * Respuesta exitosa:
 * HTTP 201 Created (sin cuerpo).
 */
export async function registrarCuenta(
  data: RegisterAccountRequest
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/mobile/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: data.displayName.trim(),
          email: data.email.trim(),
          password: data.password,
        }),
      }
    );
  } catch {
    throw new Error(
      "No fue posible conectar con el servidor. " +
      "Comprueba tu conexión a Internet."
    );
  }

  if (response.status === 201) {
    // El backend devuelve el cuerpo vacío.
    return;
  }

  if (response.status === 400) {
    throw new Error(
      "No se pudo crear la cuenta. Revisa el correo " +
      "y los requisitos de la contraseña."
    );
  }

  if (response.status === 429) {
    throw new Error(
      "Demasiados intentos. Espera un momento " +
      "antes de volver a intentarlo."
    );
  }

  if (response.status >= 500) {
    throw new Error(
      "El servidor presenta un problema temporal. " +
      "Inténtalo más tarde."
    );
  }

  throw new Error(
    `No se pudo crear la cuenta (${response.status}).`
  );
}

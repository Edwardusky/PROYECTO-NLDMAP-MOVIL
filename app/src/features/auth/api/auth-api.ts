
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

export type AuthTokens = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
};

export type MobileProfile = {
  id: string;
  email: string | null;
  displayName: string;
};

/**
 * Inicia sesión mediante ASP.NET Core Identity.
 */
export async function iniciarSesion(
  email: string,
  password: string
): Promise<AuthTokens> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/mobile/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      }
    );
  } catch {
    throw new Error(
      "No fue posible conectar con el servidor."
    );
  }

  if (response.status === 401) {
    throw new Error(
      "Correo o contraseña incorrectos."
    );
  }

  if (response.status === 429) {
    throw new Error(
      "Demasiados intentos. Inténtalo más tarde."
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status >= 500
        ? "El servidor presenta un problema temporal."
        : "No fue posible iniciar sesión."
    );
  }

  const data = (await response.json()) as
    Partial<AuthTokens>;

  if (
    typeof data.accessToken !== "string" ||
    !data.accessToken ||
    typeof data.refreshToken !== "string" ||
    typeof data.expiresIn !== "number"
  ) {
    throw new Error(
      "El servidor devolvió una sesión incompleta."
    );
  }

  return {
    tokenType: data.tokenType ?? "Bearer",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

/**
 * Recupera la identidad autenticada.
 */
export async function obtenerPerfil(
  accessToken: string
): Promise<MobileProfile> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/mobile/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch {
    throw new Error(
      "No fue posible consultar el perfil. " +
      "Comprueba tu conexión."
    );
  }

  if (response.status === 401) {
    throw new Error(
      "La sesión no es válida o ha expirado."
    );
  }

  if (!response.ok) {
    throw new Error(
      "No fue posible recuperar el perfil."
    );
  }

  return response.json() as Promise<MobileProfile>;
}

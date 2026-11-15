
import { emailValid } from "../../../shared/validation/contact";

export type Field =
  | "firstName"
  | "paternalSurname"
  | "maternalSurname"
  | "email"
  | "password"
  | "confirmPassword";

export type Values = Record<Field, string>;
export type Errors = Partial<Record<Field, string>>;

export function validateAuth(
  values: Values,
  registering: boolean,
): Errors {
  const errors: Errors = {};

  if (!values.email.trim()) {
    errors.email = "Escribe tu correo electrónico.";
  } else if (!emailValid(values.email)) {
    errors.email = "Escribe un correo válido.";
  }

  if (!values.password) {
    errors.password = "Escribe tu contraseña.";
  }

  if (registering) {
    if (!values.firstName.trim()) {
      errors.firstName = "Escribe tus nombres.";
    }

    if (!values.paternalSurname.trim()) {
      errors.paternalSurname =
        "Escribe tu apellido paterno.";
    }

    // El apellido materno es opcional según HU-01.

    if (!values.confirmPassword) {
      errors.confirmPassword =
        "Confirma tu contraseña.";
    } else if (
      values.password &&
      values.confirmPassword !== values.password
    ) {
      errors.confirmPassword =
        "Las contraseñas no coinciden.";
    }
  }

  return errors;
}

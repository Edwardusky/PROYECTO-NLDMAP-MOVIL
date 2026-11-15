import { emailValid } from "../../../shared/validation/contact";

export type Field = "email" | "firstName" | "lastName" | "password";
export type Values = Record<Field, string>;
export type Errors = Partial<Record<Field, string>>;

export function validateAuth(values: Values, registering: boolean): Errors {
  const errors: Errors = {};
  if (!values.email.trim()) errors.email = "Escribe tu correo.";
  else if (!emailValid(values.email))
    errors.email = "Escribe un correo válido.";
  if (registering && !values.firstName.trim())
    errors.firstName = "Escribe tu nombre.";
  if (registering && !values.lastName.trim())
    errors.lastName = "Escribe tus apellidos.";
  // No password policy exists yet. Do not trim or impose length/complexity rules.
  if (!values.password) errors.password = "Escribe tu contraseña.";
  return errors;
}


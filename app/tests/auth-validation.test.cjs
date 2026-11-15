
const test = require("node:test");
const assert = require("node:assert/strict");

require("./register-typescript.cjs");

const {
  validateAuth,
} = require("../src/features/auth/model/auth-validation.ts");

const valid = () => ({
  firstName: "María Fernanda",
  paternalSurname: "Hernández",
  maternalSurname: "",
  email: "persona@example.com",
  password: "prueba",
  confirmPassword: "prueba",
});

test("el registro acepta un apellido materno vacío", () => {
  assert.deepEqual(validateAuth(valid(), true), {});
});

test("los nombres son obligatorios al registrar", () => {
  const values = {
    ...valid(),
    firstName: "  ",
  };

  assert.equal(
    validateAuth(values, true).firstName,
    "Escribe tus nombres.",
  );
});

test("el apellido paterno es obligatorio", () => {
  const values = {
    ...valid(),
    paternalSurname: "",
  };

  assert.equal(
    validateAuth(values, true).paternalSurname,
    "Escribe tu apellido paterno.",
  );
});

test("el correo es obligatorio y debe ser válido", () => {
  const empty = {
    ...valid(),
    email: "",
  };

  const invalid = {
    ...valid(),
    email: "correo-invalido",
  };

  assert.equal(
    validateAuth(empty, true).email,
    "Escribe tu correo electrónico.",
  );

  assert.equal(
    validateAuth(invalid, true).email,
    "Escribe un correo válido.",
  );
});

test("se acepta el formato de correo previamente permitido", () => {
  for (const email of [
    "persona@example.com",
    "  persona+alias@example.com  ",
    "PERSONA@EXAMPLE.COM",
    "a@b.c",
  ]) {
    assert.deepEqual(
      validateAuth({ ...valid(), email }, true),
      {},
    );
  }
});

test("la confirmación de contraseña es obligatoria", () => {
  const values = {
    ...valid(),
    confirmPassword: "",
  };

  assert.equal(
    validateAuth(values, true).confirmPassword,
    "Confirma tu contraseña.",
  );
});

test("las contraseñas deben coincidir", () => {
  const values = {
    ...valid(),
    confirmPassword: "diferente",
  };

  assert.equal(
    validateAuth(values, true).confirmPassword,
    "Las contraseñas no coinciden.",
  );
});

test("la contraseña sigue siendo obligatoria", () => {
  const values = {
    ...valid(),
    password: "",
  };

  assert.equal(
    validateAuth(values, true).password,
    "Escribe tu contraseña.",
  );
});

test("el acceso no exige campos de registro", () => {
  const values = {
    ...valid(),
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    confirmPassword: "",
  };

  assert.deepEqual(
    validateAuth(values, false),
    {},
  );
});

test("se mantienen las reglas actuales de contraseña", () => {
  for (const password of ["x", " ", "clave"]) {
    const values = {
      ...valid(),
      password,
      confirmPassword: password,
    };

    assert.deepEqual(
      validateAuth(values, true),
      {},
    );
  }
});

test("la validación no modifica los datos originales", () => {
  const values = valid();
  const snapshot = { ...values };

  validateAuth(values, true);

  assert.deepEqual(values, snapshot);
});

test("cada validación devuelve errores independientes", () => {
  const invalid = validateAuth(
    { ...valid(), email: "invalido" },
    true,
  );

  const correct = validateAuth(valid(), true);

  assert.deepEqual(correct, {});
  assert.notStrictEqual(invalid, correct);
});

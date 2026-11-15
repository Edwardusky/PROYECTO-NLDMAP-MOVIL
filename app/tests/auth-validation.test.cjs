const test = require("node:test");
const assert = require("node:assert/strict");
require("./register-typescript.cjs");
const { validateAuth } = require("../src/features/auth/model/auth-validation.ts");
const valid = () => ({ email: "persona@example.com", firstName: "Nombre", lastName: "Apellido", password: "x" });

test("auth distinguishes an empty email from an invalid supplied email", () => {
  for (const email of ["", " ", "\n\t"]) {
    assert.deepEqual(validateAuth({ ...valid(), email }, false), { email: "Escribe tu correo." });
  }
  for (const email of ["persona", "persona@", "@example.com", "persona@example", "per sona@example.com", "persona@@example.com"]) {
    assert.deepEqual(validateAuth({ ...valid(), email }, false), { email: "Escribe un correo válido." });
  }
});

test("auth accepts the existing email syntax and outer whitespace without mutating input", () => {
  for (const email of ["persona@example.com", "  persona+alias@example.com  ", "PERSONA@EXAMPLE.COM", "a@b.c"]) {
    const values = { ...valid(), email };
    const before = { ...values };
    assert.deepEqual(validateAuth(values, false), {});
    assert.deepEqual(values, before);
  }
});

test("sign in requires only email and password, not registration names", () => {
  assert.deepEqual(validateAuth({ ...valid(), firstName: "", lastName: "" }, false), {});
  assert.deepEqual(validateAuth({ email: "", firstName: "", lastName: "", password: "" }, false), {
    email: "Escribe tu correo.", password: "Escribe tu contraseña.",
  });
});

test("registration requires both names after trimming and retains every field error", () => {
  assert.deepEqual(validateAuth({ email: "", firstName: " \n", lastName: "\t", password: "" }, true), {
    email: "Escribe tu correo.", firstName: "Escribe tu nombre.",
    lastName: "Escribe tus apellidos.", password: "Escribe tu contraseña.",
  });
  assert.deepEqual(validateAuth({ ...valid(), firstName: "" }, true), { firstName: "Escribe tu nombre." });
  assert.deepEqual(validateAuth({ ...valid(), lastName: "" }, true), { lastName: "Escribe tus apellidos." });
});

test("registration accepts personal names without introducing character or length policies", () => {
  for (const name of ["A", "  María José  ", "O'Connor", "李", "123"]) {
    const values = { ...valid(), firstName: name, lastName: name };
    assert.deepEqual(validateAuth(values, true), {});
    assert.equal(values.firstName, name);
    assert.equal(values.lastName, name);
  }
});

test("password rules remain presence-only in both modes, including whitespace and short passwords", () => {
  for (const registering of [false, true]) {
    assert.deepEqual(validateAuth({ ...valid(), password: "" }, registering), { password: "Escribe tu contraseña." });
    for (const password of ["x", " ", "\t\n", "  contraseña  "]) {
      const values = { ...valid(), password };
      assert.deepEqual(validateAuth(values, registering), {});
      assert.equal(values.password, password);
    }
  }
});

test("valid login and registration return independent error objects without retaining prior errors", () => {
  const invalid = validateAuth({ ...valid(), email: "incorrecto" }, false);
  for (const registering of [false, true]) {
    const result = validateAuth(valid(), registering);
    assert.deepEqual(result, {});
    assert.notStrictEqual(result, invalid);
  }
  assert.deepEqual(invalid, { email: "Escribe un correo válido." });
});

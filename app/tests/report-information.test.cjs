const test = require("node:test");
const assert = require("node:assert/strict");
require("./register-typescript.cjs");
const {
  INFORMATION_OPTIONS,
  UNKNOWN_INFORMATION,
  informationModeLabel,
  isUnknownInformation,
  normalizeInformationMode,
} = require("../src/features/reports/model/report-options.ts");
const {
  emptyReport,
  seedReport,
  reportErrors,
} = require("../src/features/reports/model/report-draft.ts");
const { emptyProfile } = require("../src/features/profile/model/profile.ts");

const draft = () => ({
  ...emptyReport,
  firstName: "Ejemplo",
  coordinate: [-98.2, 19.4],
  story: "Relato",
  reporterName: "Contacto",
  reporterEmail: "contacto@example.com",
});

test("visible information options round-trip to canonical values and back", () => {
  assert.deepEqual(INFORMATION_OPTIONS, [
    { value: "Conocida", label: "Conocida" },
    { value: "No se sabe", label: "Se desconoce" },
  ]);
  for (const option of INFORMATION_OPTIONS) {
    assert.equal(normalizeInformationMode(option.label), option.value);
    assert.equal(informationModeLabel(option.value), option.label);
    assert.equal(informationModeLabel(normalizeInformationMode(option.label)), option.label);
  }
});

test("both unknown spellings have the same meaning and review label", () => {
  for (const mode of ["No se sabe", "Se desconoce"]) {
    assert.equal(normalizeInformationMode(mode), UNKNOWN_INFORMATION);
    assert.equal(isUnknownInformation(mode), true);
    assert.equal(informationModeLabel(mode), "Se desconoce");
  }
  for (const mode of ["Conocida", "Aproximada", "", "Otro valor"]) {
    assert.equal(isUnknownInformation(mode), false);
    assert.equal(normalizeInformationMode(mode), mode);
    assert.equal(informationModeLabel(mode), mode);
  }
});

test("unknown age, date and time do not require values in canonical or legacy drafts", () => {
  for (const mode of ["No se sabe", "Se desconoce"]) {
    const report = { ...draft(), ageMode: mode, dateMode: mode, timeMode: mode };
    for (let step = 0; step < 4; step++) {
      assert.deepEqual(reportErrors(report, step), {});
    }
  }
});

test("known age keeps required, integer and range validation", () => {
  for (const age of ["", "-1", "121", "1.5", "abc"]) {
    assert.ok(reportErrors({ ...draft(), ageMode: "Conocida", age }, 0).age, age);
  }
  for (const age of ["0", "28", "120"]) {
    assert.deepEqual(reportErrors({ ...draft(), ageMode: "Conocida", age }, 0), {});
  }
  assert.ok(reportErrors({ ...draft(), ageMode: "Otro valor" }, 0).age);
});

test("known date and time retain independent calendar and format checks", () => {
  for (const date of ["", "2026-02-30", "2025-02-29", "2026-13-01"]) {
    assert.ok(reportErrors({ ...draft(), dateMode: "Conocida", date }, 2).date, date);
  }
  for (const time of ["", "24:00", "12:60", "9:30"]) {
    assert.ok(reportErrors({ ...draft(), timeMode: "Conocida", time }, 2).time, time);
  }
  assert.deepEqual(reportErrors({
    ...draft(), dateMode: "Conocida", date: "2024-02-29",
    timeMode: "Conocida", time: "23:59",
  }, 2), {});
  const mixed = reportErrors({ ...draft(), dateMode: "Se desconoce", timeMode: "Conocida" }, 2);
  assert.equal(mixed.date, undefined);
  assert.ok(mixed.time);
  const otherMixed = reportErrors({ ...draft(), dateMode: "Conocida", timeMode: "Se desconoce" }, 2);
  assert.ok(otherMixed.date);
  assert.equal(otherMixed.time, undefined);
});

test("initial and seeded drafts use canonical modes without changing their labels", () => {
  const profile = { ...emptyProfile, firstName: "Nombre", email: "perfil@example.com" };
  const seeded = seedReport(emptyReport, profile);
  for (const key of ["ageMode", "dateMode", "timeMode"]) {
    assert.equal(emptyReport[key], "No se sabe");
    assert.equal(seeded[key], "No se sabe");
    assert.equal(informationModeLabel(seeded[key]), "Se desconoce");
  }
  assert.equal(seeded.started, true);
  assert.equal(seeded.reporterName, "Nombre");
  assert.equal(seeded.reporterEmail, profile.email);
  assert.equal(emptyReport.started, false);
  assert.equal(emptyReport.reporterEmail, "");
});

test("seeding migrates only legacy modes and preserves started draft data and identity thereafter", () => {
  const legacy = {
    ...draft(), started: true,
    ageMode: "Se desconoce", age: "35",
    dateMode: "Se desconoce", date: "2026-09-01",
    timeMode: "Se desconoce", time: "10:30",
    photo: "file:///photo.jpg", marks: [{ id: 1, type: "Cicatriz", area: "Brazo", description: "Ejemplo" }],
  };
  const migrated = seedReport(legacy, { ...emptyProfile, firstName: "No sobrescribir" });
  assert.deepEqual(migrated, {
    ...legacy, ageMode: "No se sabe", dateMode: "No se sabe", timeMode: "No se sabe",
  });
  assert.equal(legacy.ageMode, "Se desconoce");
  assert.strictEqual(migrated.coordinate, legacy.coordinate);
  assert.strictEqual(migrated.marks, legacy.marks);
  assert.strictEqual(seedReport(migrated, emptyProfile), migrated);
  const known = { ...draft(), started: true, ageMode: "Conocida", dateMode: "Aproximada" };
  assert.strictEqual(seedReport(known, emptyProfile), known);
});

test("unstarted legacy draft migrates modes while still seeding contact exactly once", () => {
  const legacy = { ...emptyReport, ageMode: "Se desconoce", dateMode: "Conocida", date: "2026-09-01" };
  const seeded = seedReport(legacy, { ...emptyProfile, firstName: "Contacto" });
  assert.equal(seeded.ageMode, "No se sabe");
  assert.equal(seeded.dateMode, "Conocida");
  assert.equal(seeded.date, legacy.date);
  assert.equal(seeded.reporterName, "Contacto");
  assert.strictEqual(seedReport(seeded, { ...emptyProfile, firstName: "Otro" }), seeded);
});

test("unknown modes do not bypass identification, description, location or contact rules", () => {
  const invalid = {
    ...emptyReport, height: "400", reporterEmail: "inválido", reporterPhone: "abc",
  };
  const legacy = { ...invalid, ageMode: "Se desconoce", dateMode: "Se desconoce", timeMode: "Se desconoce" };
  for (let step = 0; step < 4; step++) {
    assert.deepEqual(reportErrors(legacy, step), reportErrors(invalid, step));
  }
  assert.ok(reportErrors(legacy, 0).firstName);
  assert.ok(reportErrors(legacy, 1).height);
  assert.ok(reportErrors(legacy, 2).coordinate);
  assert.ok(reportErrors(legacy, 2).story);
  const contact = reportErrors(legacy, 3);
  assert.ok(contact.reporterName);
  assert.ok(contact.reporterEmail);
  assert.ok(contact.reporterPhone);
});

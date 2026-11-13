const test = require("node:test");
const assert = require("node:assert/strict");
require("./register-typescript.cjs");
const { emptyProfile } = require("../src/features/profile/model/profile.ts");
const {
  emptyReport,
  seedReport,
  reportErrors,
  validDate,
  coordinateValid,
} = require("../src/features/reports/model/report-draft.ts");
const { locateOnce } = require("../src/features/map/utils/device-location.ts");
const {
  filterCases,
  casesAtPoint,
  pointStatusLabel,
} = require("../src/features/map/utils/map-cases.ts");
const {
  DEMO_CASES,
} = require("../src/features/reports/fixtures/demo-cases.ts");
const { palette: c } = require("../src/shared/constants/palette.ts");
const draft = () => ({
  ...emptyReport,
  firstName: "Ejemplo",
  coordinate: [-98.2, 19.4],
  story: "Relato de prueba",
  reporterName: "Contacto de prueba",
  reporterEmail: "prueba@example.com",
});

test("minimal draft accepts unknown age, date and time, with no photo or physical description", () => {
  for (let step = 0; step < 4; step++)
    assert.deepEqual(reportErrors(draft(), step), {});
});
test("missing required fields and invalid known values remain actionable", () => {
  assert.ok(reportErrors(emptyReport, 0).firstName);
  assert.ok(reportErrors(emptyReport, 2).coordinate);
  assert.ok(reportErrors(emptyReport, 2).story);
  assert.ok(reportErrors(emptyReport, 3).reporterName);
  assert.ok(reportErrors(emptyReport, 3).reporterEmail);
  assert.ok(
    reportErrors({ ...draft(), ageMode: "Aproximada", age: "-1" }, 0).age,
  );
  assert.ok(
    reportErrors({ ...draft(), ageMode: "Conocida", age: "121" }, 0).age,
  );
  assert.ok(
    reportErrors({ ...draft(), timeMode: "Conocida", time: "25:70" }, 2).time,
  );
  assert.ok(
    reportErrors({ ...draft(), dateMode: "Conocida", date: "2026-02-30" }, 2)
      .date,
  );
  assert.ok(
    reportErrors({ ...draft(), height: "180", heightUnit: "m" }, 1).height,
  );
  assert.deepEqual(
    reportErrors({ ...draft(), height: "1,80", heightUnit: "m" }, 1),
    {},
  );
});
test("dates validate actual calendar days and leap years", () => {
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2025-02-29"), false);
  assert.equal(validDate("2026-13-01"), false);
});
test("one valid phone is sufficient; malformed supplied contact is not accepted", () => {
  assert.deepEqual(
    reportErrors(
      { ...draft(), reporterEmail: "", reporterPhone: "+52 246 123 4567" },
      3,
    ),
    {},
  );
  assert.ok(
    reportErrors(
      { ...draft(), reporterEmail: "bad", reporterPhone: "+52 246 123 4567" },
      3,
    ).reporterEmail,
  );
  assert.ok(
    reportErrors({ ...draft(), reporterPhone: "abc1234567" }, 3).reporterPhone,
  );
});
test("seeding is one-time: report corrections, steps and confirmed location are not overwritten by profile changes", () => {
  const profile = {
    ...emptyProfile,
    firstName: "Nombre",
    lastName: "Apellido",
    email: "a@example.com",
    municipality: "Apizaco",
  };
  const seeded = seedReport(emptyReport, profile);
  assert.equal(seeded.reporterName, "Nombre Apellido");
  assert.equal(seeded.reporterAddress, "Apizaco");
  const corrected = {
    ...seeded,
    reporterName: "Otro contacto",
    coordinate: [-98.1, 19.4],
    story: "Texto conservado",
  };
  assert.strictEqual(
    seedReport(corrected, { ...profile, firstName: "Cambio" }),
    corrected,
  );
  assert.equal(emptyReport.reporterName, "");
});
test("coordinate validation rejects nonfinite and out-of-range coordinates", () => {
  assert.equal(coordinateValid([0, 0]), true);
  assert.equal(coordinateValid([181, 0]), false);
  assert.equal(coordinateValid([0, 91]), false);
  assert.equal(coordinateValid([NaN, 0]), false);
});
test("independent filters retain exact coincidences and report identifiers", () => {
  const point = DEMO_CASES[0].coordinates;
  assert.equal(filterCases(DEMO_CASES, []).length, 0);
  const searching = filterCases(DEMO_CASES, ["En búsqueda"]);
  const located = filterCases(DEMO_CASES, ["Localizados"]);
  assert.equal(searching.length, 2);
  assert.equal(located.length, 2);
  assert.deepEqual(
    casesAtPoint(DEMO_CASES, point).map((item) => item.id),
    ["demo-alfa", "demo-delta"],
  );
  assert.deepEqual(
    casesAtPoint(searching, point).map((item) => item.id),
    ["demo-alfa"],
  );
  assert.equal(pointStatusLabel(DEMO_CASES, point), "B/L");
  assert.equal(pointStatusLabel(located, point), "L");
  assert.equal(casesAtPoint(DEMO_CASES, [-98.24001, 19.32]).length, 0);
});
function port(overrides = {}) {
  const calls = [];
  const api = {
    permissions: async () => {
      calls.push("permissions");
      return { granted: true, canAskAgain: true };
    },
    request: async () => {
      calls.push("request");
      return { granted: true, canAskAgain: true };
    },
    services: async () => {
      calls.push("services");
      return true;
    },
    position: async () => {
      calls.push("position");
      return { coords: { longitude: -98.2, latitude: 19.4, accuracy: 30 } };
    },
    ...overrides,
  };
  return { api, calls };
}
test("granted foreground permission obtains exactly one real position", async () => {
  const { api, calls } = port();
  const result = await locateOnce(api, () => true);
  assert.deepEqual(calls, ["permissions", "services", "position"]);
  assert.deepEqual(result, {
    kind: "position",
    coordinate: [-98.2, 19.4],
    accuracy: 30,
    approximate: false,
  });
});
test("requestable permission is requested once", async () => {
  const { api, calls } = port({
    permissions: async () => ({ granted: false, canAskAgain: true }),
  });
  assert.equal((await locateOnce(api, () => true)).kind, "position");
  assert.deepEqual(calls, ["request", "services", "position"]);
});
test("denial stops before services and position, settings offered only if blocked", async () => {
  for (const canAskAgain of [true, false]) {
    const denied = { granted: false, canAskAgain };
    const { api, calls } = port({
      permissions: async () => denied,
      request: async () => denied,
    });
    assert.deepEqual(await locateOnce(api, () => true), {
      kind: "denied",
      settings: !canAskAgain,
    });
    assert.deepEqual(calls, []);
  }
});
test("disabled services avoid fetching position", async () => {
  const { api, calls } = port({ services: async () => false });
  assert.deepEqual(await locateOnce(api, () => true), { kind: "services" });
  assert.ok(!calls.includes("position"));
});
test("coarse, reduced and unknown accuracy are described as approximate", async () => {
  for (const permission of [
    { android: { accuracy: "coarse" } },
    { ios: { accuracy: "reduced" } },
  ]) {
    const { api } = port({
      permissions: async () => ({
        granted: true,
        canAskAgain: true,
        ...permission,
      }),
    });
    assert.equal((await locateOnce(api, () => true)).approximate, true);
  }
  const { api } = port({
    position: async () => ({
      coords: { longitude: 0, latitude: 0, accuracy: null },
    }),
  });
  assert.equal((await locateOnce(api, () => true)).approximate, true);
});
test("late position is ignored after blur or timeout", async () => {
  let active = true;
  const { api } = port({
    position: async () => {
      active = false;
      return { coords: { longitude: 0, latitude: 0, accuracy: 5 } };
    },
  });
  assert.deepEqual(await locateOnce(api, () => active), { kind: "cancelled" });
});
test("polar position reports display limitation; invalid and failed positions are errors", async () => {
  const { api } = port({
    position: async () => ({
      coords: { longitude: 0, latitude: 89, accuracy: 10 },
    }),
  });
  assert.deepEqual(await locateOnce(api, () => true), { kind: "outside" });
  const invalid = port({
    position: async () => ({
      coords: { longitude: NaN, latitude: 0, accuracy: 10 },
    }),
  }).api;
  await assert.rejects(() => locateOnce(invalid, () => true));
  const failed = port({
    position: async () => {
      throw Error("No signal");
    },
  }).api;
  await assert.rejects(() => locateOnce(failed, () => true));
});
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test("semantic text and component boundaries meet target contrast on app surfaces", () => {
  for (const surface of ["surface", "surfaceAlt", "paper"]) {
    for (const text of [
      "text",
      "muted",
      "error",
      "searching",
      "located",
      "sighting",
      "draft",
    ])
      assert.ok(contrast(c[text], c[surface]) >= 4.5, `${text}/${surface}`);
    assert.ok(contrast(c.border, c[surface]) >= 3);
  }
  assert.ok(contrast(c.onAction, c.action) >= 4.5);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
require("./register-typescript.cjs");
const { emptyReport } = require("../src/features/reports/model/report-draft.ts");
const { emptyProfile } = require("../src/features/profile/model/profile.ts");
const { DEMO_CASES } = require("../src/features/reports/fixtures/demo-cases.ts");
const { filterCases } = require("../src/features/map/utils/map-cases.ts");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

// Execute the real hook and effect cleanups with deterministic dependencies and
// controllable native promises. This does not mount React or a native map.
function selection({ report = { ...emptyReport, started: true, photo: "file:///photo.jpg", story: "Conservar" }, editing = false, picking = true } = {}) {
  const draft = { report, picking, editingLocation: editing, step: 2 };
  const navigation = [], flies = [], jumps = [], calls = [];
  const slots = [];
  let cursor = 0, dirty = false, pending = [], active = true, back, onPosition;
  let visible = DEMO_CASES;
  let result;
  const location = { loading: false, message: null, settings: false, locate() {}, openSettings() {} };
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { value: initial };
      return [slots[i].value, value => {
        const next = typeof value === "function" ? value(slots[i].value) : value;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
      }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useCallback(callback, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: callback, deps };
      return slots[i].value;
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const previous = slots[i];
        slots[i] = { deps };
        pending.push(() => { previous?.cleanup?.(); slots[i].cleanup = effect(); });
      }
    },
  };
  const exports = {};
  const file = path.join(__dirname, "../src/features/map/hooks/use-map-selection.ts");
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const update = key => value => { draft[key] = typeof value === "function" ? value(draft[key]) : value; dirty = true; };
  const setReport = update("report"), setPicking = update("picking"), setEditingLocation = update("editingLocation");
  const localRequire = name => {
    if (name === "react") return react;
    if (name === "react-native") return { BackHandler: { addEventListener(event, handler) {
      assert.equal(event, "hardwareBackPress"); back = handler;
      return { remove() { if (back === handler) back = undefined; } };
    } } };
    if (name === "expo-router") return {
      router: { navigate: route => navigation.push(route) },
      useFocusEffect: callback => react.useEffect(callback, [callback]),
    };
    if (name.endsWith("profile-context")) return { useProfile: () => ({ profile: emptyProfile }) };
    if (name.endsWith("report-draft-context")) return { useReportDraft: () => ({ ...draft, setReport, setPicking, setEditingLocation }) };
    if (name.endsWith("use-device-location")) return { useDeviceLocation: callback => { onPosition = callback; return location; } };
    const resolved = name.startsWith("@/") ? path.join(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(file), name);
    return require(resolved + ".ts");
  };
  vm.runInThisContext(`(function(require,exports){${outputText}\n})`, { filename: file })(localRequire, exports);
  function render() {
    assert.ok(active);
    let turns = 0;
    do {
      assert.ok(turns++ < 15, "effects should settle");
      cursor = 0; dirty = false; pending = [];
      result = exports.useMapSelection(visible);
      pending.forEach(run => run());
    } while (dirty);
    return result;
  }
  render();
  const native = {
    unproject(point) { calls.push(point); return Promise.resolve([-98, 19]); },
    project() { return Promise.resolve([100, 120]); },
  };
  result.mapRef.current = native;
  result.cameraRef.current = { flyTo: value => flies.push(value), jumpTo: value => jumps.push(value) };
  result.resizeViewport(400, 600);
  result.onDidFinishLoadingMap();
  render();
  return {
    draft, native, calls, navigation, flies, jumps, location, render,
    get current() { return result; },
    locate(point, approximate) { onPosition(point, approximate); },
    back() { assert.ok(back); return back(); },
    filter(statuses) { visible = filterCases(DEMO_CASES, statuses); return render(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); active = false; },
  };
}

test("confirmation reads measured viewport center, wraps longitude and preserves the entire draft", async () => {
  for (const [longitude, expected] of [[540, -180], [-541, 179], [181, -179], [-98, -98]]) {
    const s = selection();
    const before = s.draft.report;
    s.native.unproject = point => { s.calls.push(point); return Promise.resolve([longitude, 19.5]); };
    await s.current.confirmLocation();
    assert.deepEqual(s.calls, [[200, 300]]);
    assert.deepEqual(s.draft.report, { ...before, coordinate: [expected, 19.5] });
    assert.equal(s.draft.step, 2);
    assert.equal(s.draft.picking, false);
    assert.equal(s.draft.editingLocation, false);
    assert.deepEqual(s.navigation, ["/create-report"]);
    s.unmount();
  }
});

test("synchronous double confirmation has one native request and one draft commit", async () => {
  const s = selection(), response = deferred();
  s.native.unproject = point => { s.calls.push(point); return response.promise; };
  const first = s.current.confirmLocation();
  await s.current.confirmLocation();
  assert.equal(s.calls.length, 1);
  assert.equal(s.render().confirming, true);
  response.resolve([-98, 19]); await first;
  assert.equal(s.navigation.length, 1);
  assert.equal(s.render().confirming, false);
});

test("confirmation merges into the current draft without losing changes made during unproject", async () => {
  const s = selection(), response = deferred();
  s.native.unproject = () => response.promise;
  const confirm = s.current.confirmLocation();
  const current = {
    ...s.draft.report,
    story: "Corrección durante la espera",
    reporterName: "Contacto editado",
    photo: "file:///replacement.jpg",
  };
  s.draft.report = current;
  response.resolve([-98.2, 19.4]); await confirm;
  assert.deepEqual(s.draft.report, { ...current, coordinate: s.draft.report.coordinate });
  // Preserve the existing modulo normalization, including floating-point precision.
  assert.ok(Math.abs(s.draft.report.coordinate[0] - (-98.2)) < 1e-10);
  assert.equal(s.draft.report.coordinate[1], 19.4);
  assert.equal(s.draft.step, 2);
});

test("cancel invalidates pending confirmation and editing cancellation returns without changing the draft", async () => {
  for (const editing of [false, true]) {
    const s = selection({ editing }), response = deferred(), before = s.draft.report;
    s.native.unproject = () => response.promise;
    const confirm = s.current.confirmLocation();
    s.current.cancelSelection(); s.render();
    response.resolve([-99, 20]); await confirm;
    assert.strictEqual(s.draft.report, before);
    assert.equal(s.draft.picking, false);
    assert.equal(s.current.confirming, false);
    assert.deepEqual(s.navigation, editing ? ["/create-report"] : []);
  }
});

test("camera motion, resize, map failure and unmount discard late native coordinates", async () => {
  for (const action of [s => s.current.onRegionWillChange(), s => s.current.resizeViewport(500, 700), s => s.current.onDidFailLoadingMap(), s => s.unmount()]) {
    const s = selection(), response = deferred(), before = s.draft.report;
    s.native.unproject = () => response.promise;
    const confirm = s.current.confirmLocation();
    action(s); response.resolve([-99, 20]); await confirm;
    assert.strictEqual(s.draft.report, before);
    assert.deepEqual(s.navigation, []);
  }
});

test("old completion cannot unlock a newer pending confirmation after cancellation and restart", async () => {
  const s = selection(), old = deferred(), latest = deferred();
  s.native.unproject = () => old.promise;
  const first = s.current.confirmLocation();
  s.current.cancelSelection(); s.render();
  s.current.startSelection(); s.render();
  s.native.unproject = () => latest.promise;
  const second = s.current.confirmLocation(); s.render();
  old.resolve([-100, 20]); await first;
  assert.equal(s.render().confirming, true);
  assert.equal(s.draft.report.coordinate, null);
  latest.resolve([-98, 19]); await second;
  assert.deepEqual(s.draft.report.coordinate, [-98, 19]);
  assert.deepEqual(s.navigation, ["/create-report"]);
});

test("invalid and failed native coordinates preserve draft and permit retry", async () => {
  for (const value of [[NaN, 19], [0, Infinity], [Infinity, 19], [0, 91], [0, -91], new Error("native failure")]) {
    const s = selection(), before = s.draft.report;
    s.native.unproject = () => value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
    await s.current.confirmLocation();
    assert.strictEqual(s.draft.report, before);
    assert.deepEqual(s.navigation, []);
    assert.equal(s.render().selectionError, "No se pudo obtener la ubicación. Inténtalo de nuevo.");
    assert.equal(s.current.confirming, false);
    s.native.unproject = () => Promise.resolve([-98, 19]);
    await s.current.confirmLocation();
    assert.deepEqual(s.draft.report.coordinate, [-98, 19]);
  }
});

test("confirmation is blocked until map, viewport, movement and device loading allow it", async () => {
  for (const block of [s => { s.location.loading = true; }, s => s.current.onRegionWillChange(), s => s.current.onDidFailLoadingMap(), s => s.current.resizeViewport(0, 0), s => { s.current.mapRef.current = null; }, s => s.current.cancelSelection()]) {
    const s = selection(); block(s); s.render();
    await s.current.confirmLocation();
    assert.deepEqual(s.calls, []);
    assert.deepEqual(s.navigation, []);
  }
});

test("device location only flies camera with existing zooms and invalidates pending confirmation", async () => {
  for (const approximate of [false, true]) {
    const s = selection(), pending = deferred(), before = s.draft.report;
    s.native.unproject = () => pending.promise;
    const confirm = s.current.confirmLocation();
    s.locate([-98.4, 19.3], approximate);
    assert.deepEqual(s.flies, [{ center: [-98.4, 19.3], zoom: approximate ? 11 : 14, duration: 700 }]);
    assert.equal(s.render().moving, true);
    pending.resolve([-99, 20]); await confirm;
    assert.strictEqual(s.draft.report, before);
    assert.deepEqual(s.navigation, []);
  }
});

test("editing centers existing coordinate and Android back cancels while retaining step and photos", () => {
  const report = { ...emptyReport, started: true, coordinate: [-98.2, 19.4], photo: "file:///photo.jpg" };
  const s = selection({ report, editing: true });
  assert.deepEqual(s.jumps, [{ center: report.coordinate, zoom: 14 }]);
  assert.equal(s.back(), true);
  s.render();
  assert.strictEqual(s.draft.report, report);
  assert.equal(s.draft.step, 2);
  assert.equal(s.draft.picking, false);
  assert.deepEqual(s.navigation, ["/create-report"]);
});

test("late projections after another selection, motion, filters or resize cannot place a stale popup", async () => {
  const s = selection({ picking: false }), old = deferred(), latest = deferred();
  s.native.project = () => old.promise;
  s.current.setSelection(DEMO_CASES[0].coordinates); s.render();
  assert.deepEqual(s.current.selectedCases.map(item => item.id), ["demo-alfa", "demo-delta"]);
  s.native.project = () => latest.promise;
  s.current.setSelection(DEMO_CASES[1].coordinates); s.render();
  latest.resolve([250, 200]); await settle(); s.render();
  assert.deepEqual(s.current.point, [250, 200]);
  old.resolve([5, 5]); await settle(); s.render();
  assert.deepEqual(s.current.point, [250, 200]);
  for (const invalidate of [s => s.current.onRegionWillChange(), s => s.filter([]), s => s.current.resizeViewport(450, 650)]) {
    const response = deferred();
    s.filter(["En búsqueda", "Localizados"]);
    s.current.onRegionDidChange();
    s.native.project = () => response.promise;
    s.current.setSelection([...DEMO_CASES[0].coordinates]); s.render();
    // A resize may immediately request a fresh projection; it must have its
    // own response rather than sharing the deferred result being invalidated.
    s.native.project = () => Promise.resolve([300, 300]);
    invalidate(s); s.render();
    response.resolve([1, 1]); await settle(); s.render();
    assert.notDeepEqual(s.current.point, [1, 1]);
  }
});

test("a rejected stale projection cannot erase a newer popup, and a current failure clears it", async () => {
  const s = selection({ picking: false }), old = deferred(), current = deferred();
  s.native.project = () => old.promise;
  s.current.setSelection(DEMO_CASES[0].coordinates); s.render();
  s.native.project = () => current.promise;
  s.current.setSelection(DEMO_CASES[1].coordinates); s.render();
  current.resolve([240, 180]); await settle(); s.render();
  old.reject(new Error("late rejection")); await settle(); s.render();
  assert.deepEqual(s.current.point, [240, 180]);
  s.native.project = () => Promise.reject(new Error("current failure"));
  s.current.onRegionDidChange(); s.render();
  await settle(); s.render();
  assert.equal(s.current.point, null);
});

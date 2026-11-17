const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
require("./register-typescript.cjs");
const { emptyReport } = require("../src/features/reports/model/report-draft.ts");
const { emptyProfile } = require("../src/features/profile/model/profile.ts");

// Execute the real screen, steps and handlers. Only hooks, navigation and native
// leaves are substituted; this is not a native renderer or a React lifecycle test.
function form({ report = emptyReport, step = 0, profile = emptyProfile, params = {} } = {}) {
  const state = { report, step, picking: false, editingLocation: false };
  const slots = [];
  let cursor = 0;
  let effects = [];
  let focus;
  let hardwareBack;
  let removed = false;
  const navigation = [];
  const cache = new Map();
  const controls = Object.fromEntries(["Action", "Choices", "Field", "FormScreen"].map(name => [name, name]));
  controls.formStyles = {};
  controls.useFormStyles = () => ({});
  const set = key => value => { state[key] = typeof value === "function" ? value(state[key]) : value; };
  const draft = {
    setReport: set("report"), setStep: set("step"),
    setPicking: set("picking"), setEditingLocation: set("editingLocation"),
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      fileName: file,
    });
    const localRequire = name => {
      if (name === "@expo/vector-icons/Ionicons") {
        return { default: "Ionicons" };
      }

      if (name === "@/shared/theme/app-theme-context") {
        return {
          useAppTheme: () => ({
            colors: {},
          }),
        };
      }
      if (name === "react/jsx-runtime") return require(name);
      if (name === "react") return {
        useCallback: callback => callback,
        useMemo: callback => callback(),
        useEffect: effect => effects.push(effect),
        useState: initial => {
          const index = cursor++;
          if (!(index in slots)) slots[index] = initial;
          return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
        },
      };
      if (name === "react-native") return {
        Text: "Text", View: "View", Image: "Image",
        BackHandler: {
          addEventListener: (event, callback) => {
            assert.equal(event, "hardwareBackPress");
            hardwareBack = callback;
            return { remove: () => { removed = true; } };
          }
        },
      };
      if (name === "expo-router") return {
        Stack: { Screen: "Stack.Screen" },
        useFocusEffect: callback => { focus = callback; },
        useLocalSearchParams: () => params,
        router: {
          canGoBack: () => false,
          back: () => navigation.push(["back"]),
          navigate: route => navigation.push(["navigate", route]),
          replace: route => navigation.push(["replace", route]),
        },
      };
      if (name.endsWith("report-option-picker")) {
        return {
          ReportOptionPicker: "ReportOptionPicker",
        };
      }

      if (name.endsWith("report-skin-tone-picker")) {
        return {
          ReportSkinTonePicker: "ReportSkinTonePicker",
        };
      }
      if (name.endsWith("report-date-time-field")) {
        return {
          ReportDateTimeField: "ReportDateTimeField",
        };
      }

      if (name === "@/shared/native/native-features") {
        return {
          loadLocation: async () => {
            throw new Error(
              "La geocodificación nativa no debe ejecutarse en esta prueba."
            );
          },
        };
      }

      if (name === "@/shared/components/form-controls") return controls;
      if (name === "@/shared/components/local-photo-picker") return { LocalPhotoPicker: "LocalPhotoPicker" };
      if (name.endsWith("profile-context")) return { useProfile: () => ({ profile }) };
      if (name.endsWith("report-draft-context")) return { useReportDraft: () => ({ ...state, ...draft }) };
      const base = name.startsWith("@/")
        ? path.join(__dirname, "../src", name.slice(2))
        : path.resolve(path.dirname(file), name);
      const resolved = [base + ".ts", base + ".tsx"].find(candidate => fs.existsSync(candidate));
      if (!resolved) throw new Error(`Unexpected dependency ${name}`);
      return resolved.endsWith(".tsx") ? load(resolved) : require(resolved);
    };
    vm.runInThisContext(`(function(require, exports) {${outputText}\n})`, { filename: file })(localRequire, exports);
    return exports;
  }
  const Screen = load(path.join(__dirname, "../src/features/reports/screens/create-report-screen.tsx")).default;
  function expand(node) {
    if (Array.isArray(node)) return node.flatMap(expand);
    if (node == null || typeof node === "boolean") return [];
    if (typeof node !== "object") return [node];
    if (typeof node.type === "function") return expand(node.type(node.props));
    return [{ ...node, props: { ...node.props, children: expand(node.props.children) } }];
  }
  return {
    state, navigation,
    render() { cursor = 0; effects = []; return expand(Screen()); },
    initialize() { effects.forEach(effect => effect()); },
    focus() { return focus(); },
    back() { return hardwareBack(); },
    get removed() { return removed; },
  };
}
function nodes(tree) {
  return tree.flatMap(node => typeof node === "object" ? [node, ...nodes(node.props.children)] : []);
}
function find(tree, type, label) {
  const node = nodes(tree).find(node => node.type === type && (label === undefined || node.props.label === label));
  assert.ok(node, `${type}: ${label}`);
  return node.props;
}
function text(tree) {
  return tree.map(node => typeof node === "object" ? text(node.props.children) : String(node)).join("");
}

const valid = () => ({
  ...emptyReport,
  started: true,

  firstName: "Persona",
  paternalSurname: "García",
  maternalSurname: "López",
  sex: "Mujer",

  photo: "file:///persona.jpg",
  locationPrecision: "Conocida",
  coordinate: [-98.2, 19.4],
  story: "Relato",

  reporterName: "Contacto",
  reporterEmail: "contacto@example.com",
  clothes: "Sudadera roja",
  shoes: "Tenis blancos",
  identifyingDescription: "Usa lentes de armazón negro",
});




test("identification binds fields, photo and canonical choices while preserving the draft across steps", () => {
  const f = form({ report: valid() });

  let tree = f.render();

  // Editar los nombres.
  find(
    tree,
    "Field",
    "Nombre(s) · Obligatorio"
  ).onChangeText("Nombre editado");

  // Conservar la fotografía.
  find(
    tree,
    "LocalPhotoPicker"
  ).onChange("file:///persona.jpg");

  tree = f.render();

  assert.equal(
    find(tree, "Field", "Nombre(s) · Obligatorio").value,
    "Nombre editado"
  );

  assert.equal(
    find(tree, "LocalPhotoPicker").uri,
    "file:///persona.jpg"
  );

  // La edad inicia como desconocida.
  assert.equal(
    find(tree, "Choices", "Información sobre la edad").value,
    "Se desconoce"
  );

  // Indicar que la edad es conocida.
  find(
    tree,
    "Choices",
    "Información sobre la edad"
  ).onChange("Conocida");

  tree = f.render();

  // Intentar avanzar sin capturar la edad.
  find(tree, "Action", "Continuar").onPress();

  tree = f.render();

  // Debe permanecer en identificación.
  assert.equal(f.state.step, 0);

  assert.ok(
    find(
      tree,
      "Field",
      "Edad en años · Obligatoria"
    ).error
  );

  // Capturar una edad válida.
  find(
    tree,
    "Field",
    "Edad en años · Obligatoria"
  ).onChangeText("28");

  find(
    f.render(),
    "Action",
    "Continuar"
  ).onPress();

  // Ahora debe avanzar a descripción.
  assert.equal(f.state.step, 1);

  // Regresar a identificación.
  find(
    f.render(),
    "Action",
    "Paso anterior"
  ).onPress();

  tree = f.render();

  assert.equal(f.state.step, 0);

  // Verificar que no se perdieron los datos.
  assert.equal(
    find(
      tree,
      "Field",
      "Edad en años · Obligatoria"
    ).value,
    "28"
  );

  assert.equal(
    find(
      tree,
      "Field",
      "Apellido paterno · Obligatorio"
    ).value,
    "García"
  );

  assert.equal(
    find(
      tree,
      "Field",
      "Apellido materno · Obligatorio"
    ).value,
    "López"
  );

  assert.equal(
    find(tree, "LocalPhotoPicker").uri,
    "file:///persona.jpg"
  );

  // Volver a indicar que la edad se desconoce.
  find(
    tree,
    "Choices",
    "Información sobre la edad"
  ).onChange("Se desconoce");

  assert.equal(
    f.state.report.ageMode,
    "No se sabe"
  );

  // El valor anterior se conserva en el borrador,
  // aunque el campo deja de mostrarse.
  assert.equal(f.state.report.age, "28");

  assert.ok(
    !nodes(f.render()).some(
      node =>
        node.props.label === "Edad en años · Obligatoria"
    )
  );
});


test("identification requires both separate surnames", () => {
  const f = form({ report: valid() });

  let tree = f.render();

  // Confirmar que la opción antigua ya no existe
  // mientras estamos en el paso de identificación.
  assert.ok(
    !nodes(tree).some(
      node =>
        node.props.label ===
        "¿Se desconocen ambos apellidos?"
    )
  );

  // Vaciar los dos apellidos.
  find(
    tree,
    "Field",
    "Apellido paterno · Obligatorio"
  ).onChangeText("");

  find(
    f.render(),
    "Field",
    "Apellido materno · Obligatorio"
  ).onChangeText("");

  // Intentar avanzar.
  find(
    f.render(),
    "Action",
    "Continuar"
  ).onPress();

  // Debe permanecer en la sección 1.
  assert.equal(f.state.step, 0);

  tree = f.render();

  // Ambos campos deben presentar errores.
  assert.ok(
    find(
      tree,
      "Field",
      "Apellido paterno · Obligatorio"
    ).error
  );

  assert.ok(
    find(
      tree,
      "Field",
      "Apellido materno · Obligatorio"
    ).error
  );

  // Completar únicamente el paterno.
  find(
    tree,
    "Field",
    "Apellido paterno · Obligatorio"
  ).onChangeText("García");

  find(
    f.render(),
    "Action",
    "Continuar"
  ).onPress();

  // Sigue faltando el materno.
  assert.equal(f.state.step, 0);

  // Completar el materno.
  find(
    f.render(),
    "Field",
    "Apellido materno · Obligatorio"
  ).onChangeText("López");

  // Ahora sí debe avanzar.
  find(
    f.render(),
    "Action",
    "Continuar"
  ).onPress();

  assert.equal(f.state.step, 1);

  // Comprobar que ambos valores se guardaron.
  assert.equal(
    f.state.report.paternalSurname,
    "García"
  );

  assert.equal(
    f.state.report.maternalSurname,
    "López"
  );


});


test("identification requires Mujer or Hombre", () => {
  const f = form({
    report: {
      ...valid(),
      sex: "",
    },
  });

  let tree = f.render();

  const sexField = find(
    tree,
    "Choices",
    "Sexo · Obligatorio"
  );

  // Solo se muestran dos opciones.
  assert.deepEqual(
    Array.from(sexField.options),
    ["Mujer", "Hombre"]
  );

  // No hay una opción seleccionada inicialmente.
  assert.equal(sexField.value, "");

  // Intentar avanzar sin seleccionar.
  find(tree, "Action", "Continuar").onPress();

  assert.equal(f.state.step, 0);

  tree = f.render();

  // Debe mostrarse un error.
  assert.ok(
    nodes(tree).some(
      node =>
        node.props.accessibilityRole === "alert"
    )
  );

  // Elegir una opción válida.
  find(
    tree,
    "Choices",
    "Sexo · Obligatorio"
  ).onChange("Mujer");

  find(
    f.render(),
    "Action",
    "Continuar"
  ).onPress();

  // Ahora puede pasar a la sección 2.
  assert.equal(f.state.step, 1);
  assert.equal(f.state.report.sex, "Mujer");
});

test("description uses mobile selectors and preserves physical data and marks", () => {
  const mark = {
    id: 7,
    type: "Tatuaje",
    area: "Brazo derecho",
    description: "Estrella",
  };

  const f = form({
    report: {
      ...valid(),
      marks: [mark],
    },
    step: 1,
  });

  let tree = f.render();

  // Estatura: solo centímetros.
  find(
    tree,
    "Field",
    "Estatura en centímetros (cm) · Opcional"
  ).onChangeText("180");

  assert.equal(f.state.report.height, "180");

  // Indicar estatura aproximada.
  find(
    f.render(),
    "Choices",
    "¿La estatura es aproximada?"
  ).onChange("Sí");

  assert.equal(
    f.state.report.heightApproximate,
    true
  );

  // Selector de complexión.
  find(
    f.render(),
    "ReportOptionPicker",
    "Complexión · Opcional"
  ).onChange("Media");

  assert.equal(f.state.report.build, "Media");

  // Selector visual de tono de piel.
  find(
    f.render(),
    "ReportSkinTonePicker"
  ).onChange("MST-05");

  assert.equal(f.state.report.skin, "MST-05");

  // Color de cabello mediante catálogo.
  find(
    f.render(),
    "ReportOptionPicker",
    "Color de cabello · Opcional"
  ).onChange("Negro");

  // Descripción libre del cabello.
  find(
    f.render(),
    "Field",
    "Características del cabello · Opcional"
  ).onChangeText("Corto y ondulado");

  assert.equal(f.state.report.hairColor, "Negro");
  assert.equal(
    f.state.report.hairDescription,
    "Corto y ondulado"
  );

  // Añadir una segunda seña.
  find(
    f.render(),
    "Action",
    "Añadir seña particular"
  ).onPress();

  assert.deepEqual(
    f.state.report.marks.map((m) => m.id),
    [7, 8]
  );

  tree = f.render();

  // Seleccionar el tipo de la segunda seña.
  const typePickers = nodes(tree).filter(
    (node) =>
      node.type === "ReportOptionPicker" &&
      node.props.label ===
      "Tipo de seña · Obligatorio"
  );

  assert.equal(typePickers.length, 2);

  typePickers[1].props.onChange("Cicatriz");

  // Seleccionar la región de la segunda seña.
  tree = f.render();

  const areaPickers = nodes(tree).filter(
    (node) =>
      node.type === "ReportOptionPicker" &&
      node.props.label ===
      "Zona corporal · Obligatoria"
  );

  areaPickers[1].props.onChange("Pierna izquierda");

  assert.equal(
    f.state.report.marks[1].type,
    "Cicatriz"
  );

  assert.equal(
    f.state.report.marks[1].area,
    "Pierna izquierda"
  );

  // La primera seña debe permanecer intacta.
  assert.strictEqual(
    f.state.report.marks[0],
    mark
  );

  // Eliminar la primera seña.
  find(
    f.render(),
    "Action",
    "Quitar seña 1"
  ).onPress();

  assert.deepEqual(
    f.state.report.marks.map((m) => m.id),
    [8]
  );

  // Los demás datos se conservan.
  assert.equal(f.state.report.height, "180");
  assert.equal(f.state.report.build, "Media");
  assert.equal(f.state.report.skin, "MST-05");

  assert.equal(
    f.state.report.coordinate[0],
    -98.2
  );
});

test("location captures dates, point meaning, vehicle and person separately", () => {
  const f = form({
    report: valid(),
    step: 2,
  });

  let tree = f.render();

  // Por defecto se pueden desconocer fecha y hora.
  assert.equal(
    find(
      tree,
      "Choices",
      "Fecha de última vez vista"
    ).value,
    "Se desconoce"
  );

  assert.equal(
    find(
      tree,
      "Choices",
      "Hora de última vez vista"
    ).value,
    "Se desconoce"
  );

  // Capturar una fecha aproximada.
  find(
    tree,
    "Choices",
    "Fecha de última vez vista"
  ).onChange("Aproximada");

  tree = f.render();

  find(
    tree,
    "ReportDateTimeField",
    "Seleccionar fecha"
  ).onChange("2026-09-01");

  assert.equal(
    f.state.report.dateMode,
    "Aproximada"
  );

  assert.equal(
    f.state.report.date,
    "2026-09-01"
  );

  // Capturar una hora conocida.
  find(
    f.render(),
    "Choices",
    "Hora de última vez vista"
  ).onChange("Conocida");

  find(
    f.render(),
    "ReportDateTimeField",
    "Seleccionar hora"
  ).onChange("15:30");

  assert.equal(f.state.report.time, "15:30");

  // Indicar que el lugar es probable.
  find(
    f.render(),
    "Choices",
    "¿Qué representa el lugar marcado? · Obligatorio"
  ).onChange("Lugar probable (no confirmado)");

  assert.equal(
    f.state.report.locationKind,
    "Ubicación inferida"
  );

  assert.equal(
    f.state.report.locationPrecision,
    "Aproximada"
  );

  // Agregar vehículo independientemente.
  find(
    f.render(),
    "Choices",
    "¿Deseas agregar un vehículo? · Opcional"
  ).onChange("Agregar vehículo");

  find(
    f.render(),
    "Field",
    "Color · Opcional"
  ).onChangeText("Azul");

  assert.equal(
    f.state.report.vehicle.color,
    "Azul"
  );

  // Agregar persona independientemente.
  find(
    f.render(),
    "Choices",
    "¿Deseas agregar una persona? · Opcional"
  ).onChange("Agregar persona");

  find(
    f.render(),
    "Field",
    "Descripción · Opcional"
  ).onChangeText("Persona con chamarra negra");

  assert.equal(
    f.state.report.involvedPerson.description,
    "Persona con chamarra negra"
  );

  // Volver al mapa sin perder los datos.
  const before = f.state.report;

  find(
    f.render(),
    "Action",
    "Corregir ubicación en el mapa"
  ).onPress();

  assert.equal(f.state.picking, true);
  assert.equal(f.state.editingLocation, true);

  assert.deepEqual(
    f.navigation,
    [["navigate", "/"]]
  );

  assert.equal(f.state.step, 2);
  assert.strictEqual(f.state.report, before);
});



test("initialization accepts valid coordinate params once and preserves edited contact until explicit profile copy", () => {
  const profile = { ...emptyProfile, firstName: "Perfil", email: "perfil@example.com" };
  const f = form({ profile, params: { longitude: "-98.3", latitude: "19.5" }, step: 3 });
  f.render(); f.initialize();
  assert.deepEqual(f.state.report.coordinate, [-98.3, 19.5]);
  assert.equal(f.state.report.reporterName, "Perfil");
  find(f.render(), "Field", "Nombre completo de quien reporta *").onChangeText("Manual");
  profile.firstName = "Perfil cambiado";
  f.render(); f.initialize();
  assert.equal(f.state.report.reporterName, "Manual");
  find(f.render(), "Action", "Usar datos del perfil local").onPress();
  assert.equal(f.state.report.reporterName, "Perfil cambiado");
  assert.deepEqual(f.state.report.coordinate, [-98.3, 19.5]);
  const alerts = nodes(f.render()).filter(node => node.props.accessibilityLiveRegion === "polite");
  assert.equal(alerts.length, 1);
  const invalid = form({ params: { longitude: "181", latitude: "19" } });
  invalid.render(); invalid.initialize();
  assert.equal(invalid.state.report.coordinate, null);
});

test("review includes all captured data and photo, and each edit action returns to its section", () => {
  const report = {
    ...valid(), ageMode: "Conocida", age: "28", sex: "Mujer",
    photo: "file:///persona.jpg", height: "180", heightUnit: "cm", build: "Delgada",
    skin: "Morena", hair: "Negro", clothes: "Camisa", shoes: "Botas",
    marks: [{ id: 4, type: "Tatuaje", area: "Brazo", description: "Estrella" }],
    dateMode: "Conocida", date: "2026-09-01", timeMode: "Conocida", time: "12:30",
    locationKind: "Ubicación inferida", state: "Tlaxcala", municipality: "Apizaco",
    locality: "Centro", reference: "Parque", involved: true, involvement: "Vehículo azul",
    reporterPhone: "1234567890", relationship: "Familiar", reporterAddress: "Domicilio", reporterSocial: "Red social",
  };
  const f = form({ report, step: 4 });
  const tree = f.render();
  const content = text(tree);
  for (const value of ["Persona García López", "28 años", "Mujer", "180 cm", "Delgada", "Morena", "Negro", "Camisa", "Botas", "Tatuaje", "Brazo", "Estrella", "2026-09-01", "12:30", "Lugar probable (no confirmado)", "Elegida en el mapa", "Tlaxcala", "Apizaco", "Centro", "Parque", "Relato", "Vehículo azul", "Contacto", "contacto@example.com", "1234567890", "Familiar", "Domicilio", "Red social", "no envía ni publica datos", "no está conectado al RNPDNO"]) {
    assert.ok(content.includes(value), value);
  }
  assert.equal(find(tree, "Image").source.uri, report.photo);
  ["Editar identificación", "Editar descripción", "Editar hechos y ubicación", "Editar contacto"].forEach((label, index) => {
    find(tree, "Action", label).onPress();
    assert.equal(f.state.step, index);
    assert.strictEqual(f.state.report, report);
  });
  const legacy = form({ report: { ...valid(), ageMode: "Se desconoce", dateMode: "Se desconoce", timeMode: "Se desconoce" }, step: 4 });
  const unknown = text(legacy.render());
  assert.ok(unknown.includes("Edad: Se desconoce"));
  assert.ok(unknown.includes("Fecha: Se desconoce"));
  assert.ok(unknown.includes("Hora: Se desconoce"));
});

test("final validation returns to the first invalid stage and valid submit stays demonstrative with one notice", () => {
  for (const [patch, step] of [[{ firstName: "" }, 0], [{ height: "400" }, 1], [{ coordinate: null }, 2], [{ reporterEmail: "" }, 3]]) {
    const f = form({ report: { ...valid(), ...patch }, step: 4 });
    find(f.render(), "Action", "Enviar reporte").onPress();
    assert.equal(f.state.step, step);
  }
  const f = form({ report: valid(), step: 4 });
  find(f.render(), "Action", "Enviar reporte").onPress();
  const tree = f.render();
  assert.equal(f.state.step, 4);
  assert.deepEqual(f.navigation, []);
  assert.equal(nodes(tree).filter(node => node.props.accessibilityLiveRegion === "polite").length, 1);
  assert.ok(text(tree).includes("Campos comprobados. No se enviaron datos."));
});

test("Android back callback preserves data, steps back and removes its listener", () => {
  const report = valid();
  const f = form({ report, step: 2 });
  f.render();
  const cleanup = f.focus();
  assert.equal(f.back(), true);
  assert.equal(f.state.step, 1);
  assert.strictEqual(f.state.report, report);
  cleanup();
  assert.equal(f.removed, true);
  f.state.step = 0;
  f.render(); f.focus(); f.back();
  assert.deepEqual(f.navigation, [["replace", "/"]]);
});


test("report screen provides a five-step progress header", () => {
  const f = form({ report: valid() });

  const first = f.render();

  const firstScreen = nodes(first).find(
    (node) => node.type === "FormScreen"
  );

  assert.ok(firstScreen);
  assert.equal(firstScreen.props.header.props.step, 0);

  assert.equal(
    firstScreen.props.header.props.sections.length,
    5
  );

  find(first, "Action", "Continuar").onPress();

  assert.equal(f.state.step, 1);

  const second = f.render();

  const secondScreen = nodes(second).find(
    (node) => node.type === "FormScreen"
  );

  assert.equal(
    secondScreen.props.header.props.step,
    1
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
require("./register-typescript.cjs");
const { DEMO_CASES } = require("../src/features/reports/fixtures/demo-cases.ts");
const { casesAtPoint, filterCases } = require("../src/features/map/utils/map-cases.ts");

// Inspect actual JSX props and invoke actual handlers without loading native UI.
function load(name) {
  const file = path.join(__dirname, "../src/features/map/components", name + ".tsx");
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  });
  const localRequire = specifier => {
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (
      specifier ===
      "@/shared/theme/app-theme-context"
    ) {
      const { lightPalette } = require(
        "../src/shared/constants/palette.ts"
      );

      return {
        useAppTheme: () => ({
          colors: lightPalette,
          mode: "light",
          isDark: false,
          toggleTheme() { },
          setMode() { },
        }),
      };
    }
    if (specifier === "react-native") return {
      Text: "Text",
      View: "View",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      FlatList: "FlatList",
      Modal: "Modal",
      StyleSheet: {
        create: (styles) => styles,
        absoluteFill: { position: "absolute" },
      },
    };
    if (specifier === "@maplibre/maplibre-react-native") return { GeoJSONSource: "GeoJSONSource", Layer: "Layer" };
    if (specifier === "@expo/vector-icons/Ionicons") return { default: "Ionicons" };
    if (specifier === "./map-selection-popup") return { MapSelectionPopup: "MapSelectionPopup" };
    if (specifier === "react-native-safe-area-context") {
      return {
        SafeAreaProvider: "SafeAreaProvider",
        SafeAreaView: "SafeAreaView",
      };
    }

    if (specifier === "@/shared/components/close-button") {
      return {
        CloseButton: "CloseButton",
      };
    }
    const base = specifier.startsWith("@/") ? path.join(__dirname, "../src", specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
    return require(base + ".ts");
  };
  vm.runInThisContext(`(function(require,exports){${outputText}\n})`, { filename: file })(localRequire, exports);
  return Object.values(exports)[0];
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (node == null || typeof node === "boolean") return "";
  return typeof node === "object" ? text(node.props.children) : String(node);
}
function button(tree, label) {
  const node = nodes(tree).find(node => node.type === "Pressable" && (node.props.accessibilityLabel === label || text(node) === label));
  assert.ok(node, label);
  return node.props;
}

test("case layers retain IDs, coordinates, exact coincidence labels and marker selection by report ID", () => {
  const Layers = load("map-case-layers");
  let selected = null, stopped = false;
  const source = Layers({ visibleCases: DEMO_CASES, selecting: false, onSelect: point => { selected = point; } });
  assert.equal(source.props.id, "demo-cases");
  assert.deepEqual(source.props.data.features.map(item => item.id), DEMO_CASES.map(item => item.id));
  source.props.data.features.forEach((feature, index) => {
    assert.strictEqual(feature.geometry.coordinates, DEMO_CASES[index].coordinates);
    assert.equal(feature.properties.status, DEMO_CASES[index].status);
  });
  assert.deepEqual(source.props.data.features.map(item => item.properties.label), ["B/L", "L", "B", "B/L"]);
  const layers = nodes(source).filter(node => node.type === "Layer");
  assert.deepEqual(layers.map(node => node.props.id), ["demo-points", "demo-status-labels"]);
  source.props.onPress({ stopPropagation() { stopped = true; }, nativeEvent: { features: [{ properties: { id: "demo-delta" } }] } });
  assert.equal(stopped, true);
  assert.strictEqual(selected, DEMO_CASES[3].coordinates);
  const selecting = Layers({ visibleCases: DEMO_CASES, selecting: true, onSelect() { assert.fail("selection disabled"); } });
  assert.equal(selecting.props.onPress, undefined);
  assert.equal(nodes(selecting).find(node => node.props.id === "demo-points").props.paint["circle-opacity"], 0.35);
  const filtered = Layers({ visibleCases: filterCases(DEMO_CASES, ["Localizados"]), selecting: false, onSelect() { } });
  assert.deepEqual(filtered.props.data.features.map(item => item.properties.label), ["L", "L"]);
});




test("toolbar exposes compact filters and list buttons", () => {
  const Toolbar = load("map-toolbar");

  const calls = [];

  const props = {
    height: 600,
    panel: null,
    caseCount: 2,
    listOpen: false,
    onOpen: (panel) => calls.push(panel),
    onOpenList: () => calls.push("list"),
  };

  const tree = Toolbar(props);

  assert.equal(tree.type, "View");

  // Sin desplazamiento interno.
  assert.equal(
    nodes(tree).some(
      (node) => node.type === "ScrollView"
    ),
    false
  );

  const controls = nodes(tree).filter(
    (node) => node.type === "Pressable"
  );

  assert.equal(controls.length, 2);

  button(
    tree,
    "Filtros de reportes. 2 de 2 estados seleccionados. Abrir filtros"
  ).onPress();

  button(
    tree,
    "Ver lista de reportes visibles"
  ).onPress();

  assert.deepEqual(calls, ["filters", "list"]);

  const listButton = button(
    tree,
    "Ver lista de reportes visibles"
  );

  const buttonStyles = listButton.style({
    pressed: false,
  });

  assert.equal(buttonStyles[0].width, 80);
  assert.equal(buttonStyles[0].minHeight, 64);

  // La barra se mantiene sobre la atribución.
  assert.equal(tree.props.style[0].bottom, 64);

  // El diseño compacto es horizontal.
  const compact = Toolbar({
    ...props,
    height: 240,
  });

  assert.equal(
    compact.props.style[1].flexDirection,
    "row"
  );
});


test("report list respects filtered cases and opens exact IDs", () => {
  const ReportList = load("map-report-list");
  const opened = [];

  const visibleCases = filterCases(
    DEMO_CASES,
    ["En búsqueda"]
  );

  const tree = ReportList({
    visible: true,
    cases: visibleCases,
    onClose: () => { },
    onOpenReport: (id) => opened.push(id),
  });

  assert.equal(tree.props.visible, true);

  const list = nodes(tree).find(
    (node) => node.type === "FlatList"
  );

  assert.ok(list);

  // Solo debe recibir los casos filtrados.
  assert.deepEqual(
    list.props.data.map((item) => item.id),
    ["demo-alfa", "demo-gamma"]
  );

  // Abrir un elemento conserva su ID.
  const firstItem = list.props.renderItem({
    item: visibleCases[0],
  });

  button(
    firstItem,
    "Ver detalle del reporte de Persona ficticia Alfa"
  ).onPress();

  assert.deepEqual(opened, ["demo-alfa"]);

  // También debe admitir cero resultados.
  const emptyTree = ReportList({
    visible: true,
    cases: [],
    onClose: () => { },
    onOpenReport: () => { },
  });

  const emptyList = nodes(emptyTree).find(
    (node) => node.type === "FlatList"
  );

  assert.equal(emptyList.props.data.length, 0);

  assert.ok(
    text(emptyList.props.ListEmptyComponent).includes(
      "No hay reportes visibles"
    )
  );
});


test("popup keeps independent coincident reports and forwards the exact report ID", () => {
  const Popup = load("map-report-popup"), opened = [];
  let closed = false;
  const tree = Popup({ point: [100, 120], viewport: { width: 400, height: 600 }, selectedCases: casesAtPoint(DEMO_CASES, DEMO_CASES[0].coordinates), onClose() { closed = true; }, onOpenReport: id => opened.push(id) });
  assert.equal(tree.props.title, "2 reportes en esta ubicación");
  assert.ok(text(tree).includes("Persona ficticia Alfa"));
  assert.ok(text(tree).includes("Persona ficticia Delta"));
  button(tree, "Ver detalle del reporte de Persona ficticia Alfa").onPress();
  button(tree, "Ver detalle del reporte de Persona ficticia Delta").onPress();
  assert.deepEqual(opened, ["demo-alfa", "demo-delta"]);
  tree.props.onClose(); assert.equal(closed, true);
});

test("footer keeps confirmation guards, messages and all draft/device callbacks", () => {
  const Footer = load("map-footer"), calls = [];
  const props = {
    deviceLocation: { loading: false, message: "Ubicación aproximada", settings: true, locate: () => calls.push("locate"), openSettings: () => calls.push("settings") },
    mapReady: true, confirming: false, moving: false, mapFailed: false, selecting: true,
    selectionError: null, hasCaseStatuses: true, visibleCount: 4, reportStarted: true,
    onConfirm: () => calls.push("confirm"), onCancel: () => calls.push("cancel"),
    onStart: () => calls.push("start"), onContinue: () => calls.push("continue"),
    onDiscard: () => calls.push("discard"),
  };
  const tree = Footer(props);
  assert.equal(button(tree, "Confirmar ubicación").disabled, false);
  assert.ok(text(tree).includes("Ubicación aproximada"));
  button(tree, "Mi ubicación. Centrar mapa").onPress();
  button(tree, "Abrir Ajustes de ubicación").onPress();
  button(tree, "Confirmar ubicación").onPress(); button(tree, "Cancelar").onPress();
  const browse = Footer({ ...props, selecting: false });
  button(browse, "Elegir ubicación del borrador").onPress();
  button(browse, "Continuar borrador temporal").onPress();
  button(browse, "Descartar borrador temporal").onPress();
  assert.deepEqual(calls, ["locate", "settings", "confirm", "cancel", "start", "continue", "discard"]);
  // NUEVA PRUEBA:
  // No debe aparecer "Descartar borrador"
  // cuando todavía no existe un borrador activo.
  const withoutDraft = Footer({
    ...props,
    selecting: false,
    reportStarted: false,
  });

  assert.equal(
    nodes(withoutDraft).some(
      (node) =>
        node.props?.accessibilityLabel ===
        "Descartar borrador temporal"
    ),
    false
  );

  for (const patch of [{ moving: true }, { confirming: true }, { mapReady: false }, { deviceLocation: { ...props.deviceLocation, loading: true } }]) {
    assert.equal(button(Footer({ ...props, ...patch }), "Confirmar ubicación").disabled, true);
  }
  const errors = text(Footer({ ...props, mapFailed: true, hasCaseStatuses: false, selectionError: "No se pudo obtener la ubicación. Inténtalo de nuevo." }));
  assert.ok(errors.includes("No se pudo cargar el mapa."));
  assert.ok(errors.includes("No hay estados de seguimiento seleccionados."));
  assert.ok(errors.includes("No se pudo obtener la ubicación."));
});

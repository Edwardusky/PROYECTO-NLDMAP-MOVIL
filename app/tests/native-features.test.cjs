const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the actual loader with an isolated native registry; no native packages
// are evaluated in Node and no files in node_modules are patched.
function environment({
  os = "android",
  available = [],
  failImport = false,
} = {}) {
  const calls = [];
  const location = { getCurrentPositionAsync() {} };
  const picker = { launchImageLibraryAsync() {} };
  const exports = {};
  const source = fs.readFileSync(
    path.join(__dirname, "../src/shared/native/native-features.ts"),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const importFailure = new Error("Unexpected package initialization error");
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "react-native") return { Platform: { OS: os } };
      if (name === "expo")
        return {
          requireOptionalNativeModule(moduleName) {
            calls.push(`check:${moduleName}`);
            return available.includes(moduleName) ? {} : null;
          },
        };
      calls.push(`import:${name}`);
      if (failImport) throw importFailure;
      if (name === "expo-location") return location;
      if (name === "expo-image-picker") return picker;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { exports, calls, location, picker, importFailure };
}

test("loading route dependencies does not touch either native feature", () => {
  assert.deepEqual(environment().calls, []);
});
for (const [method, nativeName, packageName] of [
  ["loadLocation", "ExpoLocation", "expo-location"],
  ["loadImagePicker", "ExponentImagePicker", "expo-image-picker"],
]) {
  test(`${nativeName} missing: explicit build error before package evaluation; retry is safe`, async () => {
    const env = environment();
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(
        env.exports[method](),
        (error) =>
          error instanceof env.exports.MissingNativeFeatureError &&
          error.message.includes(nativeName) &&
          error.message.includes("development build"),
      );
    }
    assert.deepEqual(env.calls, [`check:${nativeName}`, `check:${nativeName}`]);
  });
  test(`${nativeName} present: loads the real package interface`, async () => {
    const env = environment({ available: [nativeName] });
    const result = await env.exports[method]();
    assert.deepEqual(env.calls, [
      `check:${nativeName}`,
      `import:${packageName}`,
    ]);
    const property =
      method === "loadLocation"
        ? "getCurrentPositionAsync"
        : "launchImageLibraryAsync";
    assert.equal(
      result[property],
      (method === "loadLocation" ? env.location : env.picker)[property],
    );
  });
  test(`${nativeName}: unexpected load errors are not misclassified as missing native modules`, async () => {
    const env = environment({ available: [nativeName], failImport: true });
    await assert.rejects(
      env.exports[method](),
      (error) => error === env.importFailure,
    );
  });
}
test("web implementations do not require the Android/iOS registry", async () => {
  const env = environment({ os: "web" });
  await env.exports.loadLocation();
  await env.exports.loadImagePicker();
  assert.deepEqual(env.calls, [
    "import:expo-location",
    "import:expo-image-picker",
  ]);
});
test("route-facing modules keep native feature imports out of module initialization", () => {
  for (const file of [
    "../src/features/map/hooks/use-device-location.ts",
    "../src/shared/components/local-photo-picker.tsx",
  ]) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(path.join(__dirname, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const eager = source.statements
      .filter(ts.isImportDeclaration)
      .filter(
        (node) =>
          ["expo-location", "expo-image-picker"].includes(
            node.moduleSpecifier.text,
          ) && !node.importClause?.isTypeOnly,
      );
    assert.equal(eager.length, 0, file);
  }
});

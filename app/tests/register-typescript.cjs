const { registerHooks } = require('node:module');
const { extname } = require('node:path');

// Node's type stripping needs explicit extensions for imports between TS files.
// Keep the app's extensionless imports and resolve them only in the test runner.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith('.ts') && specifier.startsWith('.') && !extname(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

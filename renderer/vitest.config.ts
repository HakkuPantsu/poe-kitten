import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* Aliases are declared explicitly rather than via `vite-tsconfig-paths`.
   The plugin caches tsconfig reads and warned that Vite now resolves tsconfig
   paths natively, which left `@/...` unresolved in the test runner. Explicit
   aliases are unambiguous and cheap. */
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    includeSource: ["src/**/*.{js,ts}"],
    globals: true,
    setupFiles: ["./specs/vitest.setup.ts"],
    /* `specs/_deferred` holds suites for modules the beta rebuild deletes —
       see the README there. They are excluded until each feature is ported. */
    exclude: ["**/node_modules/**", "**/dist/**", "specs/_deferred/**"],
    coverage: {
      exclude: ["*.vue"],
    },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  resolve: {
    alias: [
      { find: /^@\/assets\/data\/en/, replacement: r("./src/parser/en") },
      { find: /^@\//, replacement: r("./src/") },
      { find: /^@specs\//, replacement: r("./specs/") },
      { find: /^@ipc\//, replacement: r("../ipc/") },
    ],
  },
});

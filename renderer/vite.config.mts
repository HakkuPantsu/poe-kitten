import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// @tailwindcss/postcss is wired up via the "postcss" field in package.json,
// so that <style> blocks in .vue files are processed too (the Vite plugin
// only handles plain .css files).

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "webview",
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ipc": path.resolve(__dirname, "./src/../../ipc"),
      "@specs": path.resolve(__dirname, "./specs"),
    },
    extensions: [".ts", ".js", ".vue", ".json"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  server: {
    proxy: {
      "^/(config|uploads|proxy)": { target: "http://127.0.0.1:8584" },
      "/events": { ws: true, target: "http://127.0.0.1:8584" },
    },
  },
});

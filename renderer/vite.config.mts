import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/* Beta configures two builds:
   - default  -> the Electron overlay renderer (relative base, dist/)
   - MOCKUP=1 -> a static mockup bundle the user can open in a browser */
const isMockup = process.env.MOCKUP === "1";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@ipc": fileURLToPath(new URL("../ipc", import.meta.url)),
    },
  },
  base: "./",
  build: {
    outDir: isMockup ? "mockup-dist" : "dist",
    emptyOutDir: true,
    target: "chrome120",
    sourcemap: !isMockup,
    rollupOptions: isMockup
      ? { input: fileURLToPath(new URL("./mockup.html", import.meta.url)) }
      : {},
  },
});

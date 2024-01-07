import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    proxy: {
      "^/api/": {
        target: "http://127.0.0.1:3000",
      },
    },
  },
  optimizeDeps: {
    exclude: ["vuetify"],
  },
  plugins: [
    vue(),
    vuetify(),
    Components({
      dts: "./types/components.d.ts",
      types: [],
    }),
    AutoImport({
      imports: ["vue", "vue-router", "vue-i18n"],
      dirs: ["./src/stores", "./src/composables"],
      dts: "./types/composables.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

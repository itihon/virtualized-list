import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  build: {
    copyPublicDir: false,
    emptyOutDir: true,
    minify: "terser",
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["layout-virtual", "vue"],
    },
    terserOptions: {
      mangle: {
        properties: {
          keep_quoted: true,
          regex: /^_/,
        },
      },
    },
  },
  plugins: [vue()],
});

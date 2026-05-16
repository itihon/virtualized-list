import { resolve } from "node:path";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

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
    terserOptions: {
      mangle: {
        properties: {
          keep_quoted: true,
          regex: /^_/,
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  plugins: [cssInjectedByJsPlugin()],
});

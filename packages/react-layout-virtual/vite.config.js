import { resolve } from "node:path";
import { defineConfig } from "vite";

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
      external: ["layout-virtual", "react", "react-dom"],
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
});

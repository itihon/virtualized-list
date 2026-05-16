import { resolve } from "node:path";
import { defineConfig } from "vite";

export function definePackageConfig({ packageDir, plugins = [], external = [] }) {
  return defineConfig({
    build: {
      copyPublicDir: false,
      emptyOutDir: true,
      minify: "terser",
      lib: {
        entry: resolve(packageDir, "src/index.ts"),
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        external,
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
    plugins,
  });
}

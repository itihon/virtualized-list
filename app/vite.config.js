import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const root = import.meta.dirname;

export default defineConfig(({ mode }) => {
  if (mode === "development") {
    return {
      root: "./src/",
      server: {
        host: "0.0.0.0",
      },
      plugins: [vue()],
    };
  } else {
    console.log('building app workspace...');

    return {
      root: "src",
      plugins: [vue()],
      build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
          input: {
            index: resolve(root, "src/index.html"),
            vanilla: resolve(root, "src/vanilla/index.html"),
            react: resolve(root, "src/react/index.html"),
            vue: resolve(root, "src/vue/index.html"),
            angular: resolve(root, "src/angular/index.html"),
          },
        },
      },
    };
  }
});

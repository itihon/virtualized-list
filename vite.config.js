import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (mode === 'development') {
    return {
      root: './cypress/e2e/',
      // dev specific config
    };
  } else {
    return {
      // build specific config
      build: {
        copyPublicDir: false,
        lib: {
          formats: ['es'],
          entry: './src/index.ts',
          fileName: 'index',
        },
        emptyOutDir: true,
      },
      plugins: [cssInjectedByJsPlugin()],
    };
  }
});
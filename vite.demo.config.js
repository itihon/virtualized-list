import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (mode === 'DEMO_DEV') {
    return {
      // dev specific config
      server: {
        host: '0.0.0.0',
      },
      root: './demo/src/',
    };
  } else if (mode === 'DEMO_BUILD') {
    return {
      // build specific config
      build: {
        copyPublicDir: false,
        lib: {
          formats: ['es'],
          entry: './demo/src/index.ts',
          fileName: 'index',
        },
        outDir: './demo/dist/',
        emptyOutDir: true,
      },
      plugins: [cssInjectedByJsPlugin()],
    };
  }
});
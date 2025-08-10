import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (mode === 'DEMO_DEV') {
    return {
      // dev specific config
      server: {
        host: '0.0.0.0',
      },
      root: './demo/src/',
    };
  } else if (command === 'build' && mode === 'DEMO_BUILD') {
    return {
      // build specific config
      build: {
        rollupOptions: {
          input: {
            main: './demo/src/index.html',
          },
        },
        outDir: './demo/dist/',
        emptyOutDir: true,
      },
    };
  }
});
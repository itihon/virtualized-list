import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  return {
    css: {
      modules: {
        generateScopedName: '[local]',
      },
    },
    root: './tests/manual/',
    server: {
      host: '0.0.0.0',
    },
  };
});
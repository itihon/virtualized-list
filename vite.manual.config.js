import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  return {
    root: './cypress/manual/',
    server: {
      host: '0.0.0.0',
    },
  };
});
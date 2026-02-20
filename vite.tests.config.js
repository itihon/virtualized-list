import { defineConfig } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  return {
    root: './tests/fixtures/',
    server: {
      host: '0.0.0.0',
    },
  };
});
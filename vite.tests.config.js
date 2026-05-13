import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'

const fixture = (path) => new URL(`./tests/fixtures/${path}`, import.meta.url).pathname;
const src = (path) => new URL(`./src/${path}`, import.meta.url).pathname;

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (mode === 'development') {
    return {
      css: {
        modules: {
          generateScopedName: '[local]',
        },
      },
      root: './tests/fixtures/',
      server: {
        host: '0.0.0.0',
      },
      plugins: [vue()],
    };
  }
  else {
    return {
      // build specific config
      root: './tests/fixtures/',
      resolve: {
        alias: {
          './DOMConstructor': src('Renderer/DOMConstructor.ts'),
        },
      },
      plugins: [vue()],
      build: {
        outDir: '../../dist/fixtures',
        copyPublicDir: false,
        rollupOptions: {
          input: {
            index: fixture('index.html'),
            scrollableContainer: fixture('scrollable-container.html'),
            fixedListLayout: fixture('VirtualizedList/FixedListLayout/index.html'),
            dynamicListLayout: fixture('VirtualizedList/DynamicListLayout/index.html'),
            unknownScrollHeight: fixture('VirtualizedList/DynamicListLayout/unknown-scroll-height.html'),
            react: fixture('VirtualizedList/React/index.html'),
            vue: fixture('VirtualizedList/Vue/index.html'),
            angular: fixture('VirtualizedList/Angular/index.html'),
          },
        },
        emptyOutDir: true,
      },
    };
  }
});

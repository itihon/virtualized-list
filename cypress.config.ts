import { defineConfig } from "cypress";
import vitePreprocessor from 'cypress-vite';

export default defineConfig({
  e2e: {
    testIsolation: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on(
        'file:preprocessor', 
        vitePreprocessor({ 
          configFile: './vite.config.js', 
          mode: 'development', 
        }),
      );
    },
  },
});

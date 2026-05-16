import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { definePackageConfig } from "../../vite.package.config.js";

export default definePackageConfig({
  packageDir: import.meta.dirname,
  plugins: [cssInjectedByJsPlugin()],
});

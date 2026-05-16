import { definePackageConfig } from "../../vite.package.config.js";

export default definePackageConfig({
  packageDir: import.meta.dirname,
  external: ["layout-virtual", "react", "react-dom"],
});

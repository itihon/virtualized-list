import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import headers from "eslint-plugin-headers";
import { defineConfig } from "eslint/config";

const files = [
  "src/**/*.{js,mjs,cjs,ts,mts,cts}",
  "test/**/*.{js,mjs,cjs,ts,mts,cts}",
];

export default defineConfig([
  { 
    files, 
    plugins: { js, headers }, 
    rules: {
      "headers/header-format": [
        "error",
        {
          source: "string",
          content: "(fileoverview)\n(license)\n(author)",
          patterns: {
            fileoverview: {
              pattern: "@fileoverview .{5,}",
            },
            license: {
              pattern: "@license MIT",
            },
            author: {
              pattern: "@author .{2,}",
            },
          },
        },
      ],
    },
  extends: ["js/recommended"],  
  },
  { files, languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended.map(cfg => ({ ...cfg, files })),
  {
    rules: {
      "@typescript-eslint/no-this-alias": "off"
    }
  },
  {
  }
]);

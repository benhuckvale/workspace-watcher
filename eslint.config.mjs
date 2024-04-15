import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {
      languageOptions: {
          globals: {
              ...globals.browser,
              exports: "readonly",
              require: "readonly",
              module: "readonly"
          }
      }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // The React Compiler rules arrived with eslint-plugin-react-hooks 7 and
      // flag about 30 places in components that work today. They are warnings
      // so they stay visible without blocking CI; fix them when touching the
      // file, then promote each rule to "error" once its count is zero.
      "react-hooks/error-boundaries": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-verify/**",
    "out/**",
    "build/**",
    "coverage/**",
    "dbBackup/**",
    "public/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

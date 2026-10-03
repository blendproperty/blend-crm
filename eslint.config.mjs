import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["vendor/braces/**/*.js"],
    rules: {
      // Preserve the upstream Node 8 CommonJS API; permit only its existing imports.
      "@typescript-eslint/no-require-imports": ["error", { allow: ["^fill-range$", "^\\./(?:lib/)?(?:stringify|compile|expand|parse|utils|constants)$"] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

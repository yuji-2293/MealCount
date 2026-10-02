import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "apps/api/drizzle/**",
      "**/.wrangler/**",
    ],
  },
  // api lint設定
  {
    files: ["apps/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  // web lint設定
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
);

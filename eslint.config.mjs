import js from "@eslint/js";
import { defineConfig} from "eslint/config";
import tseslint from "typescript-eslint";
import queryPlugin from "@tanstack/eslint-plugin-query";
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
    files: ["apps/api/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
        parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
  // web lint設定
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      queryPlugin.configs.recommended
    ],
    languageOptions: {
      globals: globals.browser,
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
    },
  },
);

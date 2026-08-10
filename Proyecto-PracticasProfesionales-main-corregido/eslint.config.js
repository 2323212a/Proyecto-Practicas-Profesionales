import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // These React Compiler rules reject ordinary initial data-loading effects.
      // The application is not compiled with the React Compiler, so the runtime-safe
      // Hooks rules remain enabled while compiler-only restrictions are disabled.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Existing view code still has a few loosely typed API error/card helpers.
      // Keep these visible without making production builds fail.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: {
      // shadcn-style component modules intentionally export variants and helpers.
      'react-refresh/only-export-components': 'off',
    },
  },
])

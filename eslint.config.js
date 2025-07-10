import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // Angular globals
        computed: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ===== VERY GENTLE RULES - MINIMAL WARNINGS =====
      // Only the most basic TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      
      // Basic JavaScript rules - very minimal
      'no-debugger': 'warn',
      'no-unreachable': 'warn',
      
      // ===== EVERYTHING ELSE DISABLED =====
      // Turn off ALL other rules to avoid noise
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-const': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '.angular/**',
      '*.js',
      '*.mjs',
      'server.ts',
      'src/scheduler/**', // Skip scheduler files (they have lots of Node.js code)
      'src/scraping-configs/**', // Skip scraping configs
      'src/testing/**', // Skip test files
      '**/*.spec.ts', // Skip all spec files
    ],
  },
];
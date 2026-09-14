import jest from 'eslint-plugin-jest';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { importX } from 'eslint-plugin-import-x';
import * as eslintImportResolverTypescript from 'eslint-import-resolver-typescript';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import json from 'eslint-plugin-json';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import html from 'eslint-plugin-html';
import tseslint from 'typescript-eslint';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import {
  configs as airbnbConfigs,
  plugins as airbnbPlugins,
} from 'eslint-config-airbnb-extended';
import { rules as prettierConfigRules } from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores([
    '**/*/coverage/*',
    '**/.build',
    '**/node_modules',
    '**/dist',
    '**/test-results',
    '**/playwright-report*',
    'eslint.config.mjs',
  ]),

  //imports
  importX.flatConfigs.recommended,
  { rules: { ...airbnbPlugins.importX.rules } },

  // js
  js.configs.recommended,
  airbnbPlugins.stylistic,
  airbnbConfigs.base.recommended,

  // ts
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  airbnbConfigs.base.typescript,
  airbnbPlugins.typescriptEslint,

  {
    ignores: ['**/*.json'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['**/*.json'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    settings: {
      'import-x/resolver-next': [
        eslintImportResolverTypescript.createTypeScriptImportResolver({
          project: [
            'src/lambdas/*/tsconfig.json',
            'src/utils/tsconfig.json',
            'packages/*/tsconfig.json',
          ],
        }),
      ],
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        2,
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': 0,
    },
  },

  // unicorn
  unicorn.configs['recommended'],
  {
    rules: {
      'unicorn/prevent-abbreviations': 0,
      'unicorn/filename-case': [
        2,
        {
          case: 'kebabCase',
          ignore: ['.tsx'],
        },
      ],
      'unicorn/no-null': 0,
      'unicorn/prefer-module': 0,
      'unicorn/import-style': [
        2,
        {
          styles: {
            path: {
              named: true,
            },
          },
        },
      ],
    },
  },

  // react
  react.configs.flat.recommended,
  airbnbConfigs.react.recommended,
  airbnbConfigs.react.typescript,
  airbnbPlugins.react,
  airbnbPlugins.reactHooks,
  airbnbPlugins.reactA11y,

  // jest
  jest.configs['flat/recommended'],

  // prettier
  prettierRecommended,
  { rules: { ...prettierConfigRules, 'prettier/prettier': ['error', { singleQuote: true }] } },

  // jsxA11y
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // security
  security.configs.recommended,

  // sonar
  sonarjs.configs.recommended,

  // html
  {
    files: ['**/*.html'],
    plugins: { html },
  },

  // json
  {
    files: ['**/*.json'],
    ...json.configs['recommended'],
  },

  // destructure sorting
  {
    name: 'eslint-plugin-sort-destructure-keys',
    plugins: {
      'sort-destructure-keys': sortDestructureKeys,
    },
    rules: {
      'sort-destructure-keys/sort-destructure-keys': 2,
    },
  },

  // imports
  {
    rules: {
      'sort-imports': [
        2,
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import-x/extensions': 0,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import-x/no-unresolved': 0, // trust the typescript compiler to catch unresolved imports
    },
  },
  {
    files: ['tests/test-team/**'],
    rules: {
      'import-x/no-extraneous-dependencies': [
        2,
        {
          devDependencies: true,
        },
      ],
    },
  },
  {
    files: ['**/utils/**', 'tests/test-team/**'],
    rules: {
      'import-x/prefer-default-export': 0,
    },
  },
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 2,
    },
  },
  {
    files: ['src/utils/**', '**/jest.config.ts', 'packages/**'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 0,
      'import-x/no-relative-packages': 0,
    },
  },
  {
    files: ['tests/pact-tests/**'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 0,
    },
  },
  {
    files: ['scripts/**'],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: true },
      ],
    },
  },

  // test files - allow 'as any' for explicit type coercion in mocks
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 0,
    },
  },

  // misc rule overrides
  {
    rules: {
      'no-restricted-syntax': 0,
      'no-underscore-dangle': 0,
      'no-await-in-loop': 0,
      'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
      'unicorn/prefer-top-level-await': 0, // top level await is not available in commonjs
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/no-process-exit': 'off',
      'import-x/prefer-default-export': 'off'
    },
  },
]);

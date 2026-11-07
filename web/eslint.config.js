import js from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const featureByIndexOnly = {
  regex: '^@/features/[^/]+/(?!counseling$).+',
  message: 'Import another feature only through its public API, for example "@/features/catalog".',
};
const noAppFromBelow = {
  regex: '^@/app(/|$)',
  message: 'Only the app shell may depend on @/app.',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'scripts/*.mjs', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      react: { version: 'detect' },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: './tsconfig.app.json' }),
        createNodeResolver(),
      ],
    },
    rules: {
      'react/no-danger': 'error',
      'react/prop-types': 'off',
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'no-restricted-imports': ['error', { patterns: [featureByIndexOnly] }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            featureByIndexOnly,
            noAppFromBelow,
            {
              regex: '^\\.\\./\\.\\./',
              message:
                'Do not reach into another feature with a relative path. Use "@/features/<name>".',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noAppFromBelow,
            { regex: '^@/features(/|$)', message: 'shared must not depend on any feature.' },
            { regex: '(^|/)features/', message: 'shared must not depend on any feature.' },
          ],
        },
      ],
    },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['eslint.config.js'],
    rules: { 'import-x/no-named-as-default-member': 'off' },
  },
  {
    // react-three-fiber elements take three.js props (position, args, intensity) that the DOM rule does not know.
    files: ['src/**/*3D.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },
  {
    // The intro film is a build-time Remotion project; it may reach into feature internals
    // that have no CSS, because the app's public APIs pull in CSS modules webpack cannot load.
    files: ['video/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-imports': 'off' },
  },
);

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'legacy-content/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { rules: { 'no-console': ['error', { allow: ['warn', 'error'] }] } },
  {
    files: ['scripts/**'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', document: 'readonly', window: 'readonly', setTimeout: 'readonly' } },
    rules: { 'no-console': 'off' },
  },
];

import eslint from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'artifacts/**', 'reports/**', 'screenshots/**'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  {
    files: ['src/app/store/cocktail.store.ts'], // Ajusta la ruta exacta
    rules: {
      // Desactiva la regla completamente para este archivo
      'max-lines-per-function': 'off',

      // Opcional: Aumenta el límite solo para este archivo
      // "max-lines-per-function": ["error", { "max": 40 }]
    },
  },
  {
    files: ['**/*.spec.ts', '**/karma.conf.js'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
);

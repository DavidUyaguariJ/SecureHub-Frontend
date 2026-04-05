// eslint.config.js

const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');
const tseslint = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      }
    },
    plugins: {
      '@angular-eslint': angular,
      '@typescript-eslint': tseslint,
      'unused-imports': unusedImports
    },
    rules: {

      'no-debugger': 'error',
      'no-alert': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'unused-imports/no-unused-imports': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-unneeded-ternary': 'error',
      'no-redeclare': 'error',

      'no-var': 'error',
      'prefer-const': 'error',
      'no-shadow': 'error',

      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      'max-lines': ['warn', 300],
      'max-lines-per-function': ['warn', 50],
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],

      'no-console': ['warn', { allow: ['warn', 'error'] }],

      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case'
        }
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase'
        }
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/use-lifecycle-interface': 'error',
      'no-duplicate-case': 'error'
    }
  },

  {
    files: ['**/*.html'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: angularTemplateParser
    },
    plugins: {
      '@angular-eslint/template': angularTemplate
    },
    rules: {
      '@angular-eslint/template/no-negated-async': 'error'
    }
  }
];

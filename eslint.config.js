// @ts-check
// eslint configuration
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const hooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  {
    // Global configuration
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        browser: 'readonly',
        node: 'readonly',
        es2020: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'import': importPlugin
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Import
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }],
      'import/no-cycle': 'error',
      'import/no-unresolved': 'error',
      
      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-duplicate-imports': 'error'
    }
  },
  {
    // Test files configuration
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    // JavaScript files configuration
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
];
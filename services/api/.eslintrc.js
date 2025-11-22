module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {
        // TypeScript Quality Rules (gradually enabling)
        '@typescript-eslint/no-explicit-any': 'warn', // Changed from 'off' to 'warn'
        '@typescript-eslint/no-unused-vars': ['warn', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],

        // Console Usage Rules
        'no-console': ['error', {
            allow: ['error'] // Only allow console.error for critical startup failures
        }],

        // Import and Code Quality
        'import/order': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        'no-case-declares': 'off',
        'no-prototype-builtins': 'off',
        'import/no-unresolved': 'off',
        'import/no-named-as-default': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-var-requires': 'off'
    },
    ignorePatterns: [
        'src/config/*',
        'src/controllers/*',
        'src/tests/*',
        'src/utils/*'
    ],
    settings: {
        'import/resolver': {
            typescript: {
                project: './tsconfig.json'
            }
        }
    }
};
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.app.json',
    sourceType: 'module',
    ecmaVersion: 10,
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  ignorePatterns: [
    '.eslintrc.js',
    'src/index.d.ts',
    'scripts/db-migrations/archived/**',
    '*.spec.ts',
    '*.config.js',
    'jest.config.ts',
  ], // !!! new and important part !!!
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/promise-function-async': ['error'],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
    '@typescript-eslint/semi': ['error'],
    '@typescript-eslint/member-delimiter-style': ['error'],
    '@typescript-eslint/unbound-method': 'error',

    // note you must disable the base rule as it can report incorrect errors
    'keyword-spacing': 'off',
    '@typescript-eslint/keyword-spacing': ['error'],

    // Set these rules to warning to avoid too much code boilerplate
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/prefer-regexp-exec': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'warn',
    '@typescript-eslint/prefer-ts-expect-error': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    'space-infix-ops': 'off',
    'key-spacing': ['error', { mode: 'strict' }],
    'space-in-parens': ['error', 'never'],
    '@typescript-eslint/space-infix-ops': ['error', { int32Hint: false }],
    'no-multi-spaces': 'error',
    '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
  },
  overrides: [
    {
      files: ['**/*.spec.ts'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        // you should turn the original rule off *only* for test files
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
  ],
};

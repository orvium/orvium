module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['tsconfig.*?.json'],
        createDefaultProgram: true,
      },
      extends: [
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
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
        quotes: [
          'error',
          'single',
          {
            allowTemplateLiterals: true,
            avoidEscape: true,
          },
        ],
        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': ['error'],
        'key-spacing': [
          'error',
          {
            mode: 'strict',
          },
        ],
        'space-in-parens': ['error', 'never'],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/typedef': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/member-delimiter-style': ['error'],
        '@typescript-eslint/restrict-plus-operands': 'error',
        'no-multi-spaces': 'error',
        'space-infix-ops': 'off',
        '@typescript-eslint/space-infix-ops': [
          'error',
          {
            int32Hint: false,
          },
        ],
        '@angular-eslint/use-lifecycle-interface': 'error',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'variableLike',
            format: ['camelCase', 'UPPER_CASE'],
          },
        ],
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: {
              arguments: false,
            },
          },
        ],
        '@typescript-eslint/no-unnecessary-condition': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-extraneous-class': [
          'error',
          {
            allowWithDecorator: true,
          },
        ],
        '@typescript-eslint/no-confusing-void-expression': [
          'error',
          {
            ignoreArrowShorthand: true,
          },
        ],
        '@typescript-eslint/prefer-nullish-coalescing': [
          'warn',
          {
            ignorePrimitives: { string: true },
          },
        ],
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/restrict-template-expressions': 'warn',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/dot-notation': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
        '@typescript-eslint/only-throw-error': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn',
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
    },
    {
      files: ['*.html'],
      extends: [
        'plugin:@angular-eslint/template/all',
        'plugin:@angular-eslint/template/accessibility',
      ],
      rules: {
        '@angular-eslint/template/no-duplicate-attributes': 'error',
        '@angular-eslint/template/i18n': 'off',
        '@angular-eslint/template/cyclomatic-complexity': 'off',
        '@angular-eslint/template/use-track-by-function': 'warn',
        '@angular-eslint/template/no-call-expression': 'warn',
        '@angular-eslint/template/no-any': 'warn',
        '@angular-eslint/template/no-interpolation-in-attributes': 'warn',
        '@angular-eslint/template/prefer-ngsrc': 'warn',
        '@angular-eslint/template/no-inline-styles': 'warn',
        'max-len': [
          'error',
          {
            code: 160,
          },
        ],
      },
    },
  ],
};

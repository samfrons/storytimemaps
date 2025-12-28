module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // Hydration-specific rules for React components
        'no-restricted-syntax': [
          'warn',
          {
            selector:
              "ConditionalExpression[test.type='BinaryExpression'][test.left.type='UnaryExpression'][test.left.operator='typeof'][test.left.argument.name='window']",
            message:
              'Avoid typeof window checks in render. Use useEffect or a client-only wrapper instead.',
          },
          {
            selector: "ConditionalExpression[test.callee.object.name='localStorage']",
            message:
              'localStorage access can cause hydration mismatches. Use a state variable with useEffect instead.',
          },
        ],
      },
    },
  ],
}

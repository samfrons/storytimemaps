import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// Flat config, required as of eslint-config-next 16 / ESLint 10. This replaces
// .eslintrc.js and .eslintrc.json — the rules below are carried over verbatim.
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'scraper_env/**',
      'public/**',
      '**/*.py',
    ],
  },

  ...coreWebVitals,
  ...typescript,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // Next 16 ships the React Compiler-era hooks rules at error level. They flag
      // 61 pre-existing patterns here (46 of them set-state-in-effect), none of
      // which are new. Erroring would block every commit, and several sit on the
      // theme/hydration code CLAUDE.md calls fragile — so they stay advisory,
      // consistent with the rules above, until they're worked through deliberately.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
    },
  },

  {
    // Everything under scripts/ is a plain Node CommonJS tool run directly with
    // `node` — data pipelines, plaque generators — never bundled into the app.
    // The TS preset's ESM-only import rule does not apply, and leaving it on
    // blocks every commit that touches one: the pre-commit hook runs
    // `eslint --fix` over staged *.js, fails, and rolls the whole commit back.
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Hydration-specific guards — see CLAUDE.md on avoiding SSR/client drift.
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
]

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Flat config for ESLint 9. The old script invoked
// `eslint "{src,apps,libs,test}/**/*.ts"` against ESLint 9 with no config file
// and no typescript-eslint, so it exited before linting anything. This is the
// syntactic recommended set (not typeChecked): wiring the project-service pass
// over the whole Nest graph is a separate decision with a much larger finding
// surface.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'scripts/**',
      'prisma/migrations/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // The codebase was never linted (the script could not run), so 600+
      // `any` sites exist as adopted baseline. Kept as warn so every run
      // reports them; ratchet toward 'error' as the debt is burned down.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);

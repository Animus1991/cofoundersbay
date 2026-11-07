import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

// Same rule sets as the retired `next lint` (.eslintrc.json):
// next/core-web-vitals + next/typescript. The lint script targets src/,
// matching the directories `next lint` covered.
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'next-env.d.ts',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    // Next 16 brought the React Compiler's rules as errors. They describe what
    // the compiler could not optimise, not what is broken, and the app does not
    // use the compiler, so they stay visible as warnings. rules-of-hooks is not
    // among them: it found a real crash in VentureReadinessCard.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
  {
    // Test helpers intentionally deal in opaque payloads (mocked API shapes,
    // vi.mock prop bags). The rule stays enforced in shipped code.
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;

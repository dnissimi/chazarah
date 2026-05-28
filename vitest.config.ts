import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // Sandcastle creates throwaway git worktrees under .sandcastle/worktrees/
    // during a run; without excluding them vitest discovers and double-runs
    // their copies of the test suite.
    exclude: [...configDefaults.exclude, '.sandcastle/**'],
  },
});

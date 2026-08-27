import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/utils/**/*', 'src/components/**/*', 'src/managers/**/*', 'src/constants/**/*'],
      exclude: ['**/*.d.ts', 'src/types/**', 'src/edited_packages/**'],
    },
  },
});

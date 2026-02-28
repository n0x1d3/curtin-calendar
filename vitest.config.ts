import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/format/formatData.ts', 'src/utils/format/getDates.ts'],
      reporter: ['text'],
      thresholds: {
        perFile: true,
        lines: 80,
        functions: 80,
      },
    },
  },
});

import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        environment: 'node',
        include: ['**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: './coverage',
            include: ['lib/**/*.ts', '*.ts'],
            exclude: [
                'lib/types.ts',
                '**/*.d.ts',
                '**/*.test.ts',
                'dist/**',
                'scripts/**',
                'vitest.config.ts',
            ],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
        testTimeout: 5000,
        hookTimeout: 5000,
    },
});

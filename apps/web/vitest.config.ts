import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      SESSION_SECRET: 'test-session-secret-for-unit-tests-only-0123456789',
      CSRF_SECRET: 'test-csrf-secret-for-unit-tests-only-9876543210',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

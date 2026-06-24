import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node', // Use jsdom if testing React components later
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    include: ['tslib'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress the tslib resolution warning from react-remove-scroll
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.exporter?.includes('tslib')) {
          return;
        }
        warn(warning);
      },
    },
  },
})

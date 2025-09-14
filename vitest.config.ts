/// <reference types="vitest" />
import path from 'path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup/testSetup.ts'],
    include: [
      './src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Separate test environments for different test types
    workspace: [
      {
        test: {
          name: 'unit',
          include: ['./src/**/*.test.{ts,tsx}'],
          exclude: ['./src/__tests__/integration/**', './src/__tests__/accessibility/**']
        }
      },
      {
        test: {
          name: 'integration',
          include: ['./src/__tests__/integration/**/*.test.{ts,tsx}']
        }
      },
      {
        test: {
          name: 'accessibility',
          include: ['./src/__tests__/accessibility/**/*.test.{ts,tsx}']
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
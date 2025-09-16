import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Dine-Serve-Hub E2E Testing
 * Comprehensive test configuration for multi-tenant restaurant management system
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Global test timeout */
  timeout: 30 * 1000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://100.92.188.34:8080',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all actions */
    actionTimeout: 15 * 1000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30 * 1000,
  },

  /* Configure global setup and teardown */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional features for testing
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against tablet viewports */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },

    /* Test with different user roles */
    {
      name: 'SuperAdmin Tests',
      testMatch: '**/01-authentication.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'Tenant Admin Tests', 
      testMatch: ['**/02-tenant-management.spec.ts', '**/03-branch-management.spec.ts', '**/04-user-management.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'Order Workflow Tests',
      testMatch: '**/05-order-workflow.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'Performance Tests',
      testMatch: '**/06-performance-accessibility.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize for performance testing
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
    },

    /* Accessibility testing with specific configurations */
    {
      name: 'Accessibility Tests',
      testMatch: '**/06-performance-accessibility.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility features
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--enable-features=ForcedColors'
          ]
        }
      },
    },

    /* Cross-browser compatibility tests */
    {
      name: 'Cross-browser - Core Features',
      testMatch: ['**/01-authentication.spec.ts', '**/02-tenant-management.spec.ts'],
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  /* Test output directories */
  outputDir: 'test-results/artifacts',
  
  /* Configure test result directories */
  testResultsDir: 'test-results',

  /* Web Server configuration for local testing */
  webServer: process.env.CI ? undefined : [
    {
      command: 'cd backend && npm run dev',
      port: 5000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev:frontend',
      port: 8080, 
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    }
  ],

  /* Metadata for test reporting */
  metadata: {
    'Test Environment': process.env.NODE_ENV || 'test',
    'Application': 'Dine-Serve-Hub',
    'Version': process.env.npm_package_version || '1.0.0',
    'Test Suite': 'E2E Automation',
  },
});
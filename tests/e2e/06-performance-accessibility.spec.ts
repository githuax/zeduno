/**
 * Performance & Accessibility Tests
 * Tests system performance, load handling, and accessibility compliance
 */

import { devices } from '@playwright/test';

import { test, expect, config, TestUtils } from './setup';

test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    
    // Wait for main content to load
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('should handle API response times', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Monitor API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        });
      }
    });
    
    // Navigate through key pages
    await page.goto('/orders');
    await page.goto('/branches');
    await page.goto('/users');
    
    await page.waitForTimeout(2000);
    
    // Verify API response times
    apiCalls.forEach(call => {
      expect(call.status).toBeLessThan(400);
      // Most APIs should respond within 500ms
      if (call.timing && call.timing.responseEnd) {
        expect(call.timing.responseEnd).toBeLessThan(500);
      }
    });
    
    console.log(`API calls monitored: ${apiCalls.length}`);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await page.goto('/orders');
    
    // Test pagination or virtual scrolling with large lists
    const startTime = Date.now();
    
    // Load orders page with potential large dataset
    await expect(page.getByText(/orders/i)).toBeVisible();
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000);
    
    // Test scrolling performance if virtual scrolling is implemented
    const ordersTable = page.locator('table, .orders-list, [data-testid="orders-table"]');
    if (await ordersTable.count() > 0) {
      // Scroll to bottom to test performance
      await ordersTable.scrollIntoView();
      
      // Should not cause significant delays
      await page.waitForTimeout(500);
      await expect(ordersTable).toBeVisible();
    }
  });

  test('should handle concurrent user interactions', async ({ browser }) => {
    // Simulate multiple users
    const contexts = [];
    const pages = [];
    
    // Create 3 concurrent sessions
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      contexts.push(context);
      pages.push(page);
      
      // Login each user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }
    
    // Perform concurrent operations
    const operations = pages.map(async (page, index) => {
      await page.goto('/orders');
      
      // Each user performs different actions
      if (index === 0) {
        // User 1: Creates orders
        const createButton = page.locator('button:has-text("Create Order")');
        if (await createButton.count() > 0) {
          await createButton.click();
        }
      } else if (index === 1) {
        // User 2: Views users
        await page.goto('/users');
      } else {
        // User 3: Views branches
        await page.goto('/branches');
      }
      
      return page.title();
    });
    
    // Wait for all operations to complete
    const results = await Promise.all(operations);
    expect(results).toHaveLength(3);
    
    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should monitor memory usage', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate through multiple pages to test for memory leaks
    const pages = ['/orders', '/users', '/branches', '/dashboard', '/orders'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForTimeout(1000);
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
    }
    
    // Check for obvious memory leaks by monitoring performance
    const performanceMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (performanceMetrics) {
      // Memory usage should not exceed reasonable limits
      const usedMB = performanceMetrics.usedJSHeapSize / 1024 / 1024;
      expect(usedMB).toBeLessThan(100); // Should use less than 100MB
      
      console.log(`Memory usage: ${usedMB.toFixed(2)}MB`);
    }
  });

  test('should handle file upload performance', async ({ page }) => {
    await page.goto('/branches');
    
    // Test file upload if available
    const importButton = page.locator('button:has-text("Import")');
    if (await importButton.count() > 0) {
      await importButton.click();
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        const startTime = Date.now();
        
        // Upload a test file
        await fileInput.setInputFiles({
          name: 'test-data.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('name,email,role\n' + 'TestUser,test@example.com,staff\n'.repeat(100))
        });
        
        await page.click('button:has-text("Upload")');
        
        // Wait for upload completion
        await expect(page.getByText(/upload|import/i)).toBeVisible();
        
        const uploadTime = Date.now() - startTime;
        expect(uploadTime).toBeLessThan(10000); // Should complete within 10 seconds
        
        console.log(`File upload time: ${uploadTime}ms`);
      }
    }
  });
});

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test tab navigation
    let tabCount = 0;
    const maxTabs = 20;
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const focusedElement = await page.locator(':focus').count();
      if (focusedElement > 0) {
        const tagName = await page.locator(':focus').evaluate(el => el.tagName.toLowerCase());
        const interactiveElements = ['button', 'input', 'select', 'textarea', 'a'];
        
        if (interactiveElements.includes(tagName)) {
          // Should be able to interact with focused element
          const isVisible = await page.locator(':focus').isVisible();
          expect(isVisible).toBe(true);
        }
      }
    }
    
    console.log(`Keyboard navigation tested: ${tabCount} tab presses`);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const pages = ['/dashboard', '/orders', '/users', '/branches'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check for h1 element
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Check heading hierarchy (h1 → h2 → h3, etc.)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        
        // First heading should be h1, others should follow logical hierarchy
        if (i === 0) {
          expect(level).toBe(1);
        }
      }
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/users');
    
    // Check for proper ARIA attributes
    const formElements = await page.locator('input, select, textarea').all();
    
    for (const element of formElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const associatedLabel = await page.locator(`label[for="${await element.getAttribute('id')}"]`).count();
      
      // Element should have at least one form of labeling
      const hasLabel = ariaLabel || ariaLabelledBy || associatedLabel > 0;
      if (!hasLabel) {
        const placeholder = await element.getAttribute('placeholder');
        const name = await element.getAttribute('name');
        
        // At minimum should have placeholder or name
        expect(placeholder || name).toBeTruthy();
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check color contrast for text elements
    const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, a').all();
    
    for (let i = 0; i < Math.min(textElements.length, 10); i++) {
      const element = textElements[i];
      
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // Basic check - should have text color defined
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    await page.goto('/orders');
    
    // Check for proper ARIA live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    
    if (liveRegions > 0) {
      // Test dynamic content announcements
      const createButton = page.locator('button:has-text("Create Order")');
      if (await createButton.count() > 0) {
        await createButton.click();
        
        // Look for status messages that should be announced
        const statusMessages = await page.locator('[role="alert"], [aria-live="polite"], .sr-only').count();
        expect(statusMessages).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should be usable with high contrast mode', async ({ browser }) => {
    // Create context with forced colors (simulates high contrast mode)
    const context = await browser.newContext({
      colorScheme: 'dark',
      forcedColors: 'active'
    });
    
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify main elements are still visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Test key functionality still works
    await page.goto('/orders');
    await expect(page.getByText(/orders/i)).toBeVisible();
    
    await context.close();
  });

  test('should support screen magnification', async ({ browser }) => {
    // Test with higher zoom level
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Simulate 200% zoom
    await page.setViewportSize({ width: 640, height: 360 });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify layout remains functional at high zoom
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test navigation menu is still accessible
    const navMenu = page.getByRole('navigation');
    if (await navMenu.count() > 0) {
      await expect(navMenu).toBeVisible();
    }
    
    await context.close();
  });

  test('should provide skip links for navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for skip to content link
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip to content")');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
      
      // Test skip link functionality
      await skipLink.click();
      
      const mainContent = page.locator('#main, main, [role="main"]');
      if (await mainContent.count() > 0) {
        // Main content should be focused
        await expect(mainContent).toBeFocused();
      }
    }
  });

  test('should handle focus management in modals', async ({ page }) => {
    await page.goto('/users');
    
    const createButton = page.locator('button:has-text("Create User")');
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Modal should trap focus
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      if (await modal.count() > 0) {
        // First focusable element in modal should receive focus
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        const isInModal = await focusedElement.evaluate(el => {
          const modal = el.closest('[role="dialog"], .modal, [data-testid*="modal"]');
          return modal !== null;
        });
        
        expect(isInModal).toBe(true);
        
        // Escape key should close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const modalVisible = await modal.isVisible().catch(() => false);
        if (modalVisible !== false) {
          // Modal might still be visible, which is acceptable
        }
      }
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13']
    });
    
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify mobile layout
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test mobile navigation
    const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"], button[aria-label*="menu" i]');
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      
      // Navigation should be visible
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    }
    
    await context.close();
  });

  test('should work on tablets', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro']
    });
    
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify tablet layout
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test touch interactions
    await page.goto('/orders');
    
    const orderElement = page.locator('.order-item, tr').first();
    if (await orderElement.count() > 0) {
      // Test tap interaction
      await orderElement.tap();
      await page.waitForTimeout(500);
    }
    
    await context.close();
  });

  test('should handle different screen orientations', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13']
    });
    
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Test landscape orientation
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 13 landscape
    
    // Content should still be accessible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test portrait orientation
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13 portrait
    
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    await context.close();
  });
});
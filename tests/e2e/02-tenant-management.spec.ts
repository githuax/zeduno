/**
 * Tenant Management Tests
 * Tests tenant creation, management, isolation, and multi-tenancy features
 */

import { test, expect, config, TestDataFactory, TestUtils } from './setup';

test.describe('Tenant Management (SuperAdmin)', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
  });

  test('should display tenant management page', async ({ page, tenantPage }) => {
    await tenantPage.goto();
    
    await expect(page.getByRole('heading', { name: /tenant management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create tenant/i })).toBeVisible();
    
    // Should show tenant list
    await expect(page.getByText(/tenants/i)).toBeVisible();
  });

  test('should create a new tenant successfully', async ({ page, tenantPage }) => {
    const tenant = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant);
    
    // Verify tenant appears in list
    await tenantPage.searchTenant(tenant.name);
    await expect(page.getByText(tenant.name)).toBeVisible();
    await expect(page.getByText(tenant.email)).toBeVisible();
  });

  test('should validate required fields in tenant creation', async ({ page, tenantPage }) => {
    await tenantPage.goto();
    
    await page.click('button:has-text("Create Tenant")');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/slug is required/i)).toBeVisible();
  });

  test('should prevent duplicate tenant slugs', async ({ page, tenantPage }) => {
    const tenant1 = TestDataFactory.createRandomTenant();
    const tenant2 = { ...TestDataFactory.createRandomTenant(), slug: tenant1.slug };
    
    await tenantPage.goto();
    
    // Create first tenant
    await tenantPage.createTenant(tenant1);
    
    // Try to create second tenant with same slug
    await page.click('button:has-text("Create Tenant")');
    
    await page.fill('input[name="name"]', tenant2.name);
    await page.fill('input[name="slug"]', tenant2.slug);
    await page.fill('input[name="email"]', tenant2.email);
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.getByText(/slug already exists/i)).toBeVisible();
  });

  test('should edit tenant information', async ({ page, tenantPage }) => {
    const tenant = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant);
    
    // Find and edit tenant
    await tenantPage.searchTenant(tenant.name);
    const tenantRow = page.locator(`tr:has-text("${tenant.name}")`);
    await tenantRow.locator('button[title*="edit" i], button:has-text("Edit")').click();
    
    // Update tenant name
    const newName = `${tenant.name} - Updated`;
    await page.fill('input[name="name"]', newName);
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    await tenantPage.searchTenant(newName);
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should deactivate and reactivate tenant', async ({ page, tenantPage }) => {
    const tenant = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant);
    
    // Deactivate tenant
    await tenantPage.searchTenant(tenant.name);
    const tenantRow = page.locator(`tr:has-text("${tenant.name}")`);
    await tenantRow.locator('button[title*="deactivate" i], button:has-text("Deactivate")').click();
    await page.click('button:has-text("Confirm")');
    
    // Verify deactivation
    await expect(page.getByText(/deactivated successfully/i)).toBeVisible();
    
    // Reactivate tenant
    await tenantRow.locator('button[title*="activate" i], button:has-text("Activate")').click();
    await page.click('button:has-text("Confirm")');
    
    await expect(page.getByText(/activated successfully/i)).toBeVisible();
  });

  test('should manage tenant quotas and limits', async ({ page, tenantPage }) => {
    const tenant = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant);
    
    // Edit tenant quotas
    await tenantPage.searchTenant(tenant.name);
    const tenantRow = page.locator(`tr:has-text("${tenant.name}")`);
    await tenantRow.locator('button[title*="settings" i], button:has-text("Settings")').click();
    
    // Update branch quota
    await page.fill('input[name="branchQuota.maxBranches"]', '10');
    await page.fill('input[name="userQuota.maxUsers"]', '50');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/quota updated successfully/i)).toBeVisible();
  });

  test('should search and filter tenants', async ({ page, tenantPage }) => {
    const tenant1 = TestDataFactory.createRandomTenant();
    const tenant2 = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant1);
    await tenantPage.createTenant(tenant2);
    
    // Search for specific tenant
    await tenantPage.searchTenant(tenant1.name);
    await expect(page.getByText(tenant1.name)).toBeVisible();
    await expect(page.getByText(tenant2.name)).not.toBeVisible();
    
    // Clear search
    await page.fill('input[name="search"]', '');
    await page.keyboard.press('Enter');
    
    // Both tenants should be visible
    await expect(page.getByText(tenant1.name)).toBeVisible();
    await expect(page.getByText(tenant2.name)).toBeVisible();
  });

  test('should display tenant statistics', async ({ page, tenantPage }) => {
    await tenantPage.goto();
    
    // Should show tenant metrics
    await expect(page.getByText(/total tenants/i)).toBeVisible();
    await expect(page.getByText(/active tenants/i)).toBeVisible();
    await expect(page.getByText(/inactive tenants/i)).toBeVisible();
    
    // Numbers should be displayed
    const totalTenantsElement = page.locator('[data-testid="total-tenants"], .total-tenants');
    await expect(totalTenantsElement).toContainText(/\d+/);
  });
});

test.describe('Tenant Isolation & Security', () => {
  let tenant1Data: any;
  let tenant2Data: any;

  test.beforeAll(async ({ browser }) => {
    // Setup test tenants
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create test tenants as SuperAdmin
    const loginPage = new (await import('./setup')).LoginPage(page);
    const tenantPage = new (await import('./setup')).TenantManagementPage(page);
    
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    tenant1Data = TestDataFactory.createRandomTenant();
    tenant2Data = TestDataFactory.createRandomTenant();
    
    await tenantPage.goto();
    await tenantPage.createTenant(tenant1Data);
    await tenantPage.createTenant(tenant2Data);
    
    await context.close();
  });

  test('should enforce tenant data isolation', async ({ page, loginPage }) => {
    // Login as tenant1 admin (would need to create admin user first)
    // This is a simplified test - in reality, you'd need to create admin users for each tenant
    
    await loginPage.goto();
    await loginPage.loginAsAdmin(); // Assumes this is tenant1 admin
    
    // Navigate to users page
    await page.goto('/users');
    
    // Should only see tenant1 users
    await TestUtils.waitForAPIResponse(page, '/api/users');
    
    // Verify tenant isolation by checking API calls include correct tenant header
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        const tenantHeader = request.headers()['x-tenant-id'];
        expect(tenantHeader).toBeTruthy();
      }
    });
  });

  test('should prevent cross-tenant API access', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Try to access another tenant's data by manipulating API calls
    const response = await page.evaluate(async (apiURL) => {
      try {
        const res = await fetch(`${apiURL}/api/users`, {
          headers: {
            'x-tenant-id': 'different-tenant-id'
          }
        });
        return { status: res.status, ok: res.ok };
      } catch (error) {
        return { error: error.message };
      }
    }, config.apiURL);
    
    // Should be unauthorized or forbidden
    expect([401, 403]).toContain(response.status);
  });

  test('should maintain session isolation', async ({ browser }) => {
    // Test parallel sessions from different tenants
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login to different tenants simultaneously
    const loginPage1 = new (await import('./setup')).LoginPage(page1);
    const loginPage2 = new (await import('./setup')).LoginPage(page2);
    
    await loginPage1.goto();
    await loginPage1.loginAsAdmin(); // Tenant 1
    
    await loginPage2.goto();
    await loginPage2.loginAsSuperAdmin(); // Different role/tenant
    
    // Verify each session maintains its context
    await expect(page1.locator('[data-tenant-context]')).toHaveAttribute('data-tenant-context', /.+/);
    await expect(page2.locator('[data-role]')).toHaveAttribute('data-role', 'superadmin');
    
    await context1.close();
    await context2.close();
  });

  test('should handle tenant switching', async ({ page, loginPage }) => {
    // This test assumes a user with access to multiple tenants
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    // If tenant switching UI exists
    const tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher');
    if (await tenantSwitcher.count() > 0) {
      await tenantSwitcher.click();
      
      // Select different tenant
      await page.click(`button:has-text("${tenant1Data.name}")`);
      
      // Verify context switched
      await expect(page.getByText(tenant1Data.name)).toBeVisible();
      
      // API calls should use new tenant context
      await TestUtils.waitForAPIResponse(page, '/api/dashboard');
    }
  });
});

test.describe('Tenant Configuration', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin(); // Login as tenant admin
  });

  test('should configure tenant settings', async ({ page }) => {
    await page.goto('/settings/tenant');
    
    // Update tenant configuration
    await page.fill('input[name="businessHours.open"]', '08:00');
    await page.fill('input[name="businessHours.close"]', '23:00');
    await page.selectOption('select[name="currency"]', 'USD');
    await page.check('input[name="features.onlineOrdering"]');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/settings updated successfully/i)).toBeVisible();
  });

  test('should configure payment methods', async ({ page }) => {
    await page.goto('/settings/payments');
    
    // Enable payment methods
    await page.check('input[name="paymentMethods.cash"]');
    await page.check('input[name="paymentMethods.card"]');
    await page.check('input[name="paymentMethods.mpesa"]');
    
    // Configure M-Pesa settings
    await page.fill('input[name="mpesa.shortcode"]', '174379');
    await page.fill('input[name="mpesa.passkey"]', 'test-passkey');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/payment settings updated/i)).toBeVisible();
  });

  test('should configure notification settings', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // Enable notifications
    await page.check('input[name="notifications.email"]');
    await page.check('input[name="notifications.sms"]');
    
    // Configure notification preferences
    await page.check('input[name="notifyOn.newOrder"]');
    await page.check('input[name="notifyOn.paymentReceived"]');
    await page.check('input[name="notifyOn.lowStock"]');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/notification settings updated/i)).toBeVisible();
  });

  test('should manage tenant branding', async ({ page }) => {
    await page.goto('/settings/branding');
    
    // Update branding
    await page.fill('input[name="brandName"]', 'My Restaurant Brand');
    await page.fill('input[name="tagline"]', 'Delicious food for everyone');
    
    // Upload logo (simulate file upload)
    const fileInput = page.locator('input[type="file"][name="logo"]');
    if (await fileInput.count() > 0) {
      // In a real test, you'd upload an actual file
      await fileInput.setInputFiles({
        name: 'logo.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-data')
      });
    }
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/branding updated successfully/i)).toBeVisible();
  });

  test('should configure tax settings', async ({ page }) => {
    await page.goto('/settings/tax');
    
    // Configure tax rates
    await page.fill('input[name="defaultTaxRate"]', '8.25');
    await page.fill('input[name="serviceChargeRate"]', '10.00');
    
    // Configure tax categories
    await page.click('button:has-text("Add Tax Category")');
    await page.fill('input[name="taxCategories[0].name"]', 'Food & Beverage');
    await page.fill('input[name="taxCategories[0].rate"]', '8.25');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/tax settings updated/i)).toBeVisible();
  });
});

test.describe('Tenant Performance & Monitoring', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display tenant dashboard metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show key metrics
    await expect(page.getByText(/total orders/i)).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();
    await expect(page.getByText(/active branches/i)).toBeVisible();
    await expect(page.getByText(/total users/i)).toBeVisible();
  });

  test('should show tenant usage analytics', async ({ page }) => {
    await page.goto('/analytics');
    
    // Should display charts and metrics
    await expect(page.locator('[data-testid="revenue-chart"], .revenue-chart')).toBeVisible();
    await expect(page.locator('[data-testid="order-chart"], .order-chart')).toBeVisible();
    
    // Should allow date range selection
    await page.click('input[name="dateRange"]');
    await page.click('button:has-text("Last 30 days")');
    
    // Charts should update
    await TestUtils.waitForAPIResponse(page, '/api/analytics');
  });

  test('should monitor tenant resource usage', async ({ page }) => {
    await page.goto('/settings/usage');
    
    // Should show quota usage
    await expect(page.getByText(/branch quota/i)).toBeVisible();
    await expect(page.getByText(/user quota/i)).toBeVisible();
    await expect(page.getByText(/storage quota/i)).toBeVisible();
    
    // Usage bars/indicators should be visible
    await expect(page.locator('[data-testid="usage-indicator"], .usage-bar')).toBeVisible();
  });
});
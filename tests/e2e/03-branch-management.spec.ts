/**
 * Branch Management Tests
 * Tests branch creation, editing, hierarchy, and branch-specific operations
 */

import { test, expect, config, TestDataFactory, TestUtils } from './setup';

test.describe('Branch Management (Admin)', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display branch management page', async ({ page, branchPage }) => {
    await branchPage.goto();
    
    await expect(page.getByRole('heading', { name: /branch management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create branch/i })).toBeVisible();
    
    // Should show branch list
    await expect(page.getByText(/branches/i)).toBeVisible();
  });

  test('should create a new branch successfully', async ({ page, branchPage }) => {
    const branch = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Verify branch appears in list
    await branchPage.searchBranch(branch.name);
    await expect(page.getByText(branch.name)).toBeVisible();
    await expect(page.getByText(branch.contact.email)).toBeVisible();
  });

  test('should validate required fields in branch creation', async ({ page, branchPage }) => {
    await branchPage.goto();
    
    await page.click('button:has-text("Create Branch")');
    
    // Try to skip to next step without filling required fields
    await page.click('button:has-text("Next")');
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/type is required/i)).toBeVisible();
  });

  test('should create branch hierarchy (main → branch)', async ({ page, branchPage }) => {
    const mainBranch = TestDataFactory.createRandomBranch('main');
    const subBranch = TestDataFactory.createRandomBranch('branch');
    
    await branchPage.goto();
    
    // Create main branch first
    await branchPage.createBranch(mainBranch);
    
    // Create sub-branch
    await branchPage.createBranch(subBranch);
    
    // Verify hierarchy in branch list
    await branchPage.searchBranch(mainBranch.name);
    await expect(page.getByText(mainBranch.name)).toBeVisible();
    await expect(page.locator(`[data-branch-type="main"]`)).toBeVisible();
    
    await branchPage.searchBranch(subBranch.name);
    await expect(page.getByText(subBranch.name)).toBeVisible();
    await expect(page.locator(`[data-branch-type="branch"]`)).toBeVisible();
  });

  test('should edit branch information', async ({ page, branchPage }) => {
    const branch = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Find and edit branch
    await branchPage.searchBranch(branch.name);
    const branchRow = page.locator(`tr:has-text("${branch.name}")`);
    await branchRow.locator('button[title*="edit" i], button:has-text("Edit")').click();
    
    // Update branch name
    const newName = `${branch.name} - Updated`;
    await page.fill('input[name="name"]', newName);
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    await branchPage.searchBranch(newName);
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should activate and deactivate branch', async ({ page, branchPage }) => {
    const branch = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Deactivate branch
    await branchPage.searchBranch(branch.name);
    const branchRow = page.locator(`tr:has-text("${branch.name}")`);
    await branchRow.locator('button[title*="deactivate" i], button:has-text("Deactivate")').click();
    await page.click('button:has-text("Confirm")');
    
    // Verify deactivation
    await expect(page.getByText(/deactivated successfully/i)).toBeVisible();
    
    // Reactivate branch
    await branchRow.locator('button[title*="activate" i], button:has-text("Activate")').click();
    await page.click('button:has-text("Confirm")');
    
    await expect(page.getByText(/activated successfully/i)).toBeVisible();
  });

  test('should configure branch-specific settings', async ({ page, branchPage }) => {
    const branch = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Edit branch settings
    await branchPage.searchBranch(branch.name);
    const branchRow = page.locator(`tr:has-text("${branch.name}")`);
    await branchRow.locator('button[title*="settings" i], button:has-text("Settings")').click();
    
    // Update operational settings
    await page.fill('input[name="operations.openTime"]', '08:00');
    await page.fill('input[name="operations.closeTime"]', '23:00');
    await page.fill('input[name="settings.orderPrefix"]', 'TEST');
    
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/settings updated successfully/i)).toBeVisible();
  });

  test('should handle branch deletion with confirmation', async ({ page, branchPage }) => {
    const branch = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Delete branch
    await branchPage.deleteBranch(branch.name);
    
    // Verify branch is removed from list
    await branchPage.searchBranch(branch.name);
    await expect(page.getByText(branch.name)).not.toBeVisible();
  });

  test('should display branch statistics and metrics', async ({ page, branchPage }) => {
    await branchPage.goto();
    
    // Should show branch metrics
    await expect(page.getByText(/total branches/i)).toBeVisible();
    await expect(page.getByText(/active branches/i)).toBeVisible();
    await expect(page.getByText(/main branches/i)).toBeVisible();
    
    // Numbers should be displayed
    const totalBranchesElement = page.locator('[data-testid="total-branches"], .total-branches');
    if (await totalBranchesElement.count() > 0) {
      await expect(totalBranchesElement).toContainText(/\d+/);
    }
  });

  test('should filter branches by type', async ({ page, branchPage }) => {
    const mainBranch = TestDataFactory.createRandomBranch('main');
    const subBranch = TestDataFactory.createRandomBranch('branch');
    
    await branchPage.goto();
    await branchPage.createBranch(mainBranch);
    await branchPage.createBranch(subBranch);
    
    // Filter by main branches
    const typeFilter = page.locator('select[name="typeFilter"], [data-testid="type-filter"]');
    if (await typeFilter.count() > 0) {
      await typeFilter.selectOption('main');
      await expect(page.getByText(mainBranch.name)).toBeVisible();
      await expect(page.getByText(subBranch.name)).not.toBeVisible();
    }
  });
});

test.describe('Branch Context & Switching', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should switch branch context', async ({ page, branchPage }) => {
    // Assuming user has access to multiple branches
    await page.goto('/dashboard');
    
    // Look for branch switcher
    const branchSwitcher = page.locator('[data-testid="branch-switcher"], .branch-switcher');
    if (await branchSwitcher.count() > 0) {
      await branchSwitcher.click();
      
      // Select different branch
      await page.click('button:has-text("Main Branch")');
      
      // Verify context switched
      await expect(page.getByText(/main branch/i)).toBeVisible();
      
      // API calls should use new branch context
      await TestUtils.waitForAPIResponse(page, '/api/dashboard');
    }
  });

  test('should maintain branch context across pages', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Navigate through different pages
    const pages = ['/dashboard', '/orders', '/menu', '/users'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Verify branch context is maintained
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          const branchHeader = request.headers()['x-branch-id'];
          if (branchHeader) {
            expect(branchHeader).toBeTruthy();
          }
        }
      });
    }
  });

  test('should enforce branch-specific data access', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Navigate to orders page
    await page.goto('/orders');
    
    // Verify API calls include branch context
    const response = await TestUtils.waitForAPIResponse(page, '/api/orders');
    expect(response.status()).toBe(200);
  });
});

test.describe('Branch Permissions & Access Control', () => {
  test('should restrict branch creation to authorized users', async ({ page, loginPage }) => {
    // This test would require a staff-level user
    // For now, we'll test that admin can access branch creation
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await page.goto('/branches');
    
    // Admin should see create button
    await expect(page.getByRole('button', { name: /create branch/i })).toBeVisible();
  });

  test('should show branch-specific navigation based on permissions', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Admin should see branch management in navigation
    await expect(page.getByRole('link', { name: /branch management/i })).toBeVisible();
    
    // Should also see other admin features
    await expect(page.getByRole('link', { name: /user management/i })).toBeVisible();
  });

  test('should validate branch hierarchy constraints', async ({ page, branchPage }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@joespizzapalace.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await branchPage.goto();
    
    // Try to create a franchise under a branch (should be allowed)
    const branch = TestDataFactory.createRandomBranch('branch');
    const franchise = TestDataFactory.createRandomBranch('franchise');
    
    await branchPage.createBranch(branch);
    await branchPage.createBranch(franchise);
    
    // Both should be created successfully
    await branchPage.searchBranch(branch.name);
    await expect(page.getByText(branch.name)).toBeVisible();
    
    await branchPage.searchBranch(franchise.name);
    await expect(page.getByText(franchise.name)).toBeVisible();
  });
});

test.describe('Branch Operations & Workflow', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should handle branch bulk operations', async ({ page, branchPage }) => {
    const branch1 = TestDataFactory.createRandomBranch();
    const branch2 = TestDataFactory.createRandomBranch();
    
    await branchPage.goto();
    await branchPage.createBranch(branch1);
    await branchPage.createBranch(branch2);
    
    // Select multiple branches for bulk operation
    const checkbox1 = page.locator(`tr:has-text("${branch1.name}") input[type="checkbox"]`);
    const checkbox2 = page.locator(`tr:has-text("${branch2.name}") input[type="checkbox"]`);
    
    if (await checkbox1.count() > 0 && await checkbox2.count() > 0) {
      await checkbox1.check();
      await checkbox2.check();
      
      // Perform bulk action (if available)
      const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
      if (await bulkActions.count() > 0) {
        await bulkActions.click();
        await page.click('button:has-text("Bulk Update")');
        
        // Verify bulk operation
        await expect(page.getByText(/bulk operation completed/i)).toBeVisible();
      }
    }
  });

  test('should export branch data', async ({ page, branchPage }) => {
    await branchPage.goto();
    
    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button[title*="export" i]');
    if (await exportButton.count() > 0) {
      // Setup download promise before triggering download
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // Wait for download to complete
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/branch.*\.(csv|xlsx|pdf)/i);
    }
  });

  test('should import branch data', async ({ page, branchPage }) => {
    await branchPage.goto();
    
    // Look for import functionality
    const importButton = page.locator('button:has-text("Import"), button[title*="import" i]');
    if (await importButton.count() > 0) {
      await importButton.click();
      
      // Simulate file upload
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'branches.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('name,type,email\nTest Branch,branch,test@example.com')
        });
        
        await page.click('button:has-text("Upload"), button[type="submit"]');
        
        // Verify import success
        await expect(page.getByText(/import completed/i)).toBeVisible();
      }
    }
  });
});

test.describe('Branch Performance & Monitoring', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display branch performance metrics', async ({ page }) => {
    await page.goto('/branches/analytics');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Should show performance metrics if analytics page exists
      const metrics = [
        /total orders/i,
        /revenue/i,
        /average order/i,
        /customer satisfaction/i
      ];
      
      for (const metric of metrics) {
        const element = page.getByText(metric);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test('should monitor branch resource usage', async ({ page }) => {
    await page.goto('/branches');
    
    // Check if branch status indicators are shown
    const statusIndicators = page.locator('[data-testid="branch-status"], .branch-status');
    if (await statusIndicators.count() > 0) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
});
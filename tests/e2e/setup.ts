/**
 * Dine-Serve-Hub E2E Testing Setup
 * Comprehensive test configuration for multi-tenant restaurant management system
 */

import { test as base, expect, devices } from '@playwright/test';
import { Page, BrowserContext, Locator } from '@playwright/test';

// Test configuration constants
export const config = {
  baseURL: process.env.BASE_URL || 'http://100.92.188.34:8080',
  apiURL: process.env.API_URL || 'http://100.92.188.34:5000',
  timeout: 30000,
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
  headless: process.env.HEADLESS !== 'false',
};

// Test data interfaces
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'manager' | 'staff';
  tenantId?: string;
  branchId?: string;
}

export interface TestTenant {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  businessType: string;
}

export interface TestBranch {
  name: string;
  type: 'main' | 'branch' | 'franchise';
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  settings: {
    orderPrefix: string;
  };
}

// Test data factory
export class TestDataFactory {
  static createRandomUser(role: TestUser['role'] = 'admin'): TestUser {
    const timestamp = Date.now();
    return {
      email: `test.${role}.${timestamp}@example.com`,
      password: 'TestPassword123!',
      firstName: `Test${role.charAt(0).toUpperCase() + role.slice(1)}`,
      lastName: `User${timestamp}`,
      role,
    };
  }

  static createRandomTenant(): TestTenant {
    const timestamp = Date.now();
    return {
      name: `Test Restaurant ${timestamp}`,
      slug: `test-restaurant-${timestamp}`,
      email: `restaurant${timestamp}@example.com`,
      phone: '+1-555-0199',
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        city: 'Test City',
        state: 'TX',
        postalCode: '12345',
        country: 'United States',
      },
      currency: 'USD',
      businessType: 'restaurant',
    };
  }

  static createRandomBranch(type: TestBranch['type'] = 'branch'): TestBranch {
    const timestamp = Date.now();
    return {
      name: `Test ${type} ${timestamp}`,
      type,
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Branch Avenue`,
        city: 'Branch City',
        state: 'CA',
        postalCode: '54321',
        country: 'United States',
      },
      contact: {
        phone: '+1-555-0188',
        email: `branch${timestamp}@example.com`,
      },
      settings: {
        orderPrefix: `BR${timestamp.toString().slice(-3)}`,
      },
    };
  }
}

// Page Object Model classes
export class LoginPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await expect(this.page).toHaveTitle(/Login/i);
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for login to complete
    await this.page.waitForURL('**/dashboard', { timeout: config.timeout });
  }

  async loginAsSuperAdmin() {
    // Use existing superadmin credentials
    await this.login('superadmin@system.com', 'admin123');
  }

  async loginAsAdmin() {
    // Use existing admin credentials
    await this.login('admin@joespizzapalace.com', 'admin123');
  }
}

export class TenantManagementPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/superadmin/tenants');
    await expect(this.page.getByRole('heading', { name: /tenant management/i })).toBeVisible();
  }

  async createTenant(tenant: TestTenant) {
    await this.page.click('button:has-text("Create Tenant"), button:has-text("Add Tenant")');
    
    // Fill tenant form
    await this.page.fill('input[name="name"]', tenant.name);
    await this.page.fill('input[name="slug"]', tenant.slug);
    await this.page.fill('input[name="email"]', tenant.email);
    await this.page.fill('input[name="phone"]', tenant.phone);
    await this.page.fill('input[name="address.street"]', tenant.address.street);
    await this.page.fill('input[name="address.city"]', tenant.address.city);
    await this.page.fill('input[name="address.state"]', tenant.address.state);
    await this.page.fill('input[name="address.postalCode"]', tenant.address.postalCode);
    await this.page.fill('input[name="address.country"]', tenant.address.country);
    
    await this.page.click('button[type="submit"], button:has-text("Create")');
    
    // Wait for success message or redirect
    await expect(this.page.getByText(/tenant created successfully/i)).toBeVisible({ timeout: config.timeout });
  }

  async searchTenant(name: string) {
    await this.page.fill('input[placeholder*="search" i], input[name="search"]', name);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results
    await this.page.waitForTimeout(1000);
  }

  async deleteTenant(tenantName: string) {
    await this.searchTenant(tenantName);
    
    // Find and click delete button for the tenant
    const tenantRow = this.page.locator(`tr:has-text("${tenantName}")`);
    await tenantRow.locator('button[title*="delete" i], button:has([data-testid*="delete"])').click();
    
    // Confirm deletion
    await this.page.click('button:has-text("Delete"), button:has-text("Confirm")');
    
    // Wait for deletion confirmation
    await expect(this.page.getByText(/tenant deleted successfully/i)).toBeVisible({ timeout: config.timeout });
  }
}

export class UserManagementPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/users');
    await expect(this.page.getByRole('heading', { name: /user management/i })).toBeVisible();
  }

  async createUser(user: TestUser) {
    await this.page.click('button:has-text("Create User"), button:has-text("Add User")');
    
    // Fill user form
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="firstName"]', user.firstName);
    await this.page.fill('input[name="lastName"]', user.lastName);
    await this.page.fill('input[name="password"]', user.password);
    
    // Select role
    await this.page.click('select[name="role"]');
    await this.page.selectOption('select[name="role"]', user.role);
    
    await this.page.click('button[type="submit"], button:has-text("Create")');
    
    // Wait for success message
    await expect(this.page.getByText(/user created successfully/i)).toBeVisible({ timeout: config.timeout });
  }

  async searchUser(email: string) {
    await this.page.fill('input[placeholder*="search" i], input[name="search"]', email);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async assignUserToBranch(userEmail: string, branchName: string) {
    await this.searchUser(userEmail);
    
    const userRow = this.page.locator(`tr:has-text("${userEmail}")`);
    await userRow.locator('button[title*="assign" i], button:has-text("Assign")').click();
    
    // Select branch
    await this.page.click('select[name="branchId"]');
    await this.page.selectOption('select[name="branchId"]', { label: branchName });
    
    await this.page.click('button:has-text("Assign"), button[type="submit"]');
    
    // Wait for success message
    await expect(this.page.getByText(/user assigned successfully/i)).toBeVisible({ timeout: config.timeout });
  }
}

export class BranchManagementPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/branches');
    await expect(this.page.getByRole('heading', { name: /branch management/i })).toBeVisible();
  }

  async createBranch(branch: TestBranch) {
    await this.page.click('button:has-text("Create Branch"), button:has-text("Add Branch")');
    
    // Navigate through wizard steps
    await this.fillBasicInformation(branch);
    await this.page.click('button:has-text("Next")');
    
    await this.fillLocationContact(branch);
    await this.page.click('button:has-text("Next")');
    
    await this.fillOperations();
    await this.page.click('button:has-text("Next")');
    
    await this.fillFinancial();
    await this.page.click('button:has-text("Next")');
    
    await this.fillAdditionalSettings(branch);
    
    // Submit the form
    await this.page.click('button:has-text("Create Branch"), button[type="submit"]');
    
    // Wait for success message
    await expect(this.page.getByText(/branch created successfully/i)).toBeVisible({ timeout: config.timeout });
  }

  private async fillBasicInformation(branch: TestBranch) {
    await this.page.fill('input[name="name"]', branch.name);
    await this.page.selectOption('select[name="type"]', branch.type);
  }

  private async fillLocationContact(branch: TestBranch) {
    await this.page.fill('input[name="address.street"]', branch.address.street);
    await this.page.fill('input[name="address.city"]', branch.address.city);
    await this.page.fill('input[name="address.state"]', branch.address.state);
    await this.page.fill('input[name="address.postalCode"]', branch.address.postalCode);
    await this.page.fill('input[name="address.country"]', branch.address.country);
    await this.page.fill('input[name="contact.phone"]', branch.contact.phone);
    await this.page.fill('input[name="contact.email"]', branch.contact.email);
  }

  private async fillOperations() {
    // Use default operation hours (should be pre-filled)
    const openTime = this.page.locator('input[name="operations.openTime"]');
    const closeTime = this.page.locator('input[name="operations.closeTime"]');
    
    if (await openTime.inputValue() === '') {
      await openTime.fill('09:00');
    }
    if (await closeTime.inputValue() === '') {
      await closeTime.fill('22:00');
    }
  }

  private async fillFinancial() {
    // Select USD currency (should be default)
    const currency = this.page.locator('select[name="financial.currency"]');
    if (await currency.inputValue() !== 'USD') {
      await currency.selectOption('USD');
    }
  }

  private async fillAdditionalSettings(branch: TestBranch) {
    await this.page.fill('input[name="settings.orderPrefix"]', branch.settings.orderPrefix);
  }

  async searchBranch(name: string) {
    await this.page.fill('input[placeholder*="search" i], input[name="search"]', name);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async deleteBranch(branchName: string) {
    await this.searchBranch(branchName);
    
    const branchRow = this.page.locator(`tr:has-text("${branchName}")`);
    await branchRow.locator('button[title*="delete" i], button:has([data-testid*="delete"])').click();
    
    // Confirm deletion
    await this.page.click('button:has-text("Delete"), button:has-text("Confirm")');
    
    // Wait for deletion confirmation
    await expect(this.page.getByText(/branch deleted successfully/i)).toBeVisible({ timeout: config.timeout });
  }
}

// Enhanced test fixture with utilities
export const test = base.extend<{
  loginPage: LoginPage;
  tenantPage: TenantManagementPage;
  userPage: UserManagementPage;
  branchPage: BranchManagementPage;
  authenticatedContext: BrowserContext;
  superAdminContext: BrowserContext;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  tenantPage: async ({ page }, use) => {
    await use(new TenantManagementPage(page));
  },
  
  userPage: async ({ page }, use) => {
    await use(new UserManagementPage(page));
  },
  
  branchPage: async ({ page }, use) => {
    await use(new BranchManagementPage(page));
  },
  
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as admin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await use(context);
    await context.close();
  },
  
  superAdminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as superadmin
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    await use(context);
    await context.close();
  },
});

// Utility functions
export class TestUtils {
  static async waitForAPIResponse(page: Page, endpoint: string, timeout = config.timeout) {
    return await page.waitForResponse(
      response => response.url().includes(endpoint) && response.status() === 200,
      { timeout }
    );
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `tests/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  static async checkAccessibility(page: Page) {
    // Basic accessibility checks
    const missingAlt = await page.locator('img:not([alt])').count();
    const missingLabels = await page.locator('input:not([aria-label]):not([placeholder])').count();
    
    return {
      missingAltText: missingAlt,
      missingLabels: missingLabels,
      hasSkipLink: await page.locator('a[href="#main"], a:has-text("Skip to content")').count() > 0,
    };
  }

  static generateTestReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return {
      timestamp,
      testRun: `e2e-test-${timestamp}`,
      environment: process.env.NODE_ENV || 'test',
      baseURL: config.baseURL,
    };
  }
}

export { expect };
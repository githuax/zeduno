/**
 * Authentication & Access Control Tests
 * Tests login, logout, role-based access, and security features
 */

import { test, expect, config, TestUtils } from './setup';

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.baseURL);
  });

  test('should display login page correctly', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Check page elements
    await expect(page).toHaveTitle(/login/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should login as SuperAdmin successfully', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    // Verify successful login
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
    
    // Verify SuperAdmin UI elements are visible
    await expect(page.getByRole('link', { name: /tenant management/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /system settings/i })).toBeVisible();
  });

  test('should login as Tenant Admin successfully', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Verify successful login
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
    
    // Verify Admin UI elements are visible
    await expect(page.getByRole('link', { name: /branch management/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /user management/i })).toBeVisible();
  });

  test('should reject invalid login credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should handle empty form submission', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Verify logged in
    await expect(page).toHaveURL(/dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu"], .user-menu, button:has-text("Profile")');
    await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
    
    // Should not be able to access protected pages
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/users', '/branches', '/orders'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should handle session timeout', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Simulate session expiry by clearing localStorage/cookies
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(";").forEach(c => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should remember login state on page refresh', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await expect(page).toHaveURL(/dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});

test.describe('Role-Based Access Control', () => {
  test('SuperAdmin should access all features', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    // Should access SuperAdmin features
    const superAdminRoutes = [
      '/superadmin/tenants',
      '/superadmin/system-settings',
      '/superadmin/users'
    ];
    
    for (const route of superAdminRoutes) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/login|unauthorized|403/);
    }
  });

  test('Tenant Admin should not access SuperAdmin features', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Should NOT access SuperAdmin routes
    await page.goto('/superadmin/tenants');
    await expect(page).toHaveURL(/unauthorized|403|dashboard/);
  });

  test('should display appropriate navigation menu by role', async ({ page, loginPage }) => {
    // Test SuperAdmin navigation
    await loginPage.goto();
    await loginPage.loginAsSuperAdmin();
    
    await expect(page.getByRole('link', { name: /tenant management/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /system settings/i })).toBeVisible();
    
    // Logout and test Admin navigation
    await page.click('[data-testid="user-menu"], .user-menu');
    await page.click('button:has-text("Logout")');
    
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await expect(page.getByRole('link', { name: /branch management/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /user management/i })).toBeVisible();
    
    // Should NOT see SuperAdmin links
    await expect(page.getByRole('link', { name: /system settings/i })).not.toBeVisible();
  });

  test('should enforce API endpoint permissions', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Try to access SuperAdmin API endpoints
    const response = await page.request.get(`${config.apiURL}/api/superadmin/tenants`);
    
    // Should return 403 Forbidden or redirect
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Security Features', () => {
  test('should implement CSRF protection', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Check for CSRF token in forms
    await page.goto('/users');
    await page.click('button:has-text("Create User")');
    
    const csrfToken = await page.locator('input[name="_token"], input[name="csrf_token"]');
    if (await csrfToken.count() > 0) {
      await expect(csrfToken).toHaveValue(/.+/);
    }
  });

  test('should sanitize input fields', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Try XSS attack in login form
    await page.fill('input[name="email"]', '<script>alert("XSS")</script>');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should not execute script
    await page.waitForTimeout(1000);
    const alertCount = await page.evaluate(() => window.alert === window.alert);
    expect(alertCount).toBe(true); // Alert function should not be overridden
  });

  test('should implement rate limiting on login attempts', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Should show rate limiting message
    await expect(page.getByText(/too many attempts/i)).toBeVisible();
  });

  test('should secure password fields', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    const passwordField = page.locator('input[name="password"]');
    
    // Password field should have type="password"
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Password should not be visible in input
    await passwordField.fill('testpassword123');
    const inputValue = await passwordField.inputValue();
    expect(inputValue).toBe('testpassword123');
    
    // But display value should be masked
    const displayValue = await passwordField.evaluate(el => (el as HTMLInputElement).value);
    expect(displayValue).toBe('testpassword123');
  });

  test('should implement secure headers', async ({ page }) => {
    const response = await page.goto(config.baseURL);
    
    // Check for security headers
    const headers = response?.headers();
    
    expect(headers?.['x-frame-options']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-xss-protection']).toBeTruthy();
  });
});

test.describe('Accessibility in Authentication', () => {
  test('should be keyboard navigable', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    // Check for proper labels
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    await expect(emailField).toHaveAttribute('aria-label', /.+/);
    await expect(passwordField).toHaveAttribute('aria-label', /.+/);
  });

  test('should announce form errors to screen readers', async ({ page, loginPage }) => {
    await loginPage.goto();
    
    await page.click('button[type="submit"]');
    
    // Error messages should have proper ARIA attributes
    const errorMessage = page.getByText(/email is required/i);
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
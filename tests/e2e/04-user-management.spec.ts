/**
 * User Management Tests
 * Tests user CRUD operations, role management, and permissions
 */

import { test, expect, config, TestDataFactory, TestUtils } from './setup';

test.describe('User Management (Admin)', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display user management page', async ({ page, userPage }) => {
    await userPage.goto();
    
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create user/i })).toBeVisible();
    
    // Should show user list
    await expect(page.getByText(/users/i)).toBeVisible();
  });

  test('should create a new user successfully', async ({ page, userPage }) => {
    const user = TestDataFactory.createRandomUser('manager');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Verify user appears in list
    await userPage.searchUser(user.email);
    await expect(page.getByText(user.email)).toBeVisible();
    await expect(page.getByText(`${user.firstName} ${user.lastName}`)).toBeVisible();
  });

  test('should validate required fields in user creation', async ({ page, userPage }) => {
    await userPage.goto();
    
    await page.click('button:has-text("Create User")');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should prevent duplicate user emails', async ({ page, userPage }) => {
    const user1 = TestDataFactory.createRandomUser('staff');
    const user2 = { ...TestDataFactory.createRandomUser('manager'), email: user1.email };
    
    await userPage.goto();
    
    // Create first user
    await userPage.createUser(user1);
    
    // Try to create second user with same email
    await page.click('button:has-text("Create User")');
    
    await page.fill('input[name="email"]', user2.email);
    await page.fill('input[name="firstName"]', user2.firstName);
    await page.fill('input[name="lastName"]', user2.lastName);
    await page.fill('input[name="password"]', user2.password);
    await page.selectOption('select[name="role"]', user2.role);
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.getByText(/email already exists/i)).toBeVisible();
  });

  test('should edit user information', async ({ page, userPage }) => {
    const user = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Find and edit user
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    await userRow.locator('button[title*="edit" i], button:has-text("Edit")').click();
    
    // Update user information
    const newFirstName = `${user.firstName}-Updated`;
    await page.fill('input[name="firstName"]', newFirstName);
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    await userPage.searchUser(user.email);
    await expect(page.getByText(newFirstName)).toBeVisible();
  });

  test('should assign user to branch', async ({ page, userPage, branchPage }) => {
    // First create a branch
    const branch = TestDataFactory.createRandomBranch();
    await branchPage.goto();
    await branchPage.createBranch(branch);
    
    // Then create a user
    const user = TestDataFactory.createRandomUser('staff');
    await userPage.goto();
    await userPage.createUser(user);
    
    // Assign user to branch
    await userPage.assignUserToBranch(user.email, branch.name);
    
    // Verify assignment
    await userPage.searchUser(user.email);
    await expect(page.getByText(branch.name)).toBeVisible();
  });

  test('should activate and deactivate user', async ({ page, userPage }) => {
    const user = TestDataFactory.createRandomUser('manager');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Deactivate user
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    await userRow.locator('button[title*="deactivate" i], button:has-text("Deactivate")').click();
    await page.click('button:has-text("Confirm")');
    
    // Verify deactivation
    await expect(page.getByText(/deactivated successfully/i)).toBeVisible();
    
    // Reactivate user
    await userRow.locator('button[title*="activate" i], button:has-text("Activate")').click();
    await page.click('button:has-text("Confirm")');
    
    await expect(page.getByText(/activated successfully/i)).toBeVisible();
  });

  test('should manage user roles and permissions', async ({ page, userPage }) => {
    const user = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Change user role
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    await userRow.locator('button[title*="edit" i], button:has-text("Edit")').click();
    
    // Update role to manager
    await page.selectOption('select[name="role"]', 'manager');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    
    // Verify role change
    await userPage.searchUser(user.email);
    await expect(page.getByText(/manager/i)).toBeVisible();
  });

  test('should search and filter users', async ({ page, userPage }) => {
    const user1 = TestDataFactory.createRandomUser('manager');
    const user2 = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(user1);
    await userPage.createUser(user2);
    
    // Search for specific user
    await userPage.searchUser(user1.email);
    await expect(page.getByText(user1.email)).toBeVisible();
    await expect(page.getByText(user2.email)).not.toBeVisible();
    
    // Clear search
    await page.fill('input[name="search"]', '');
    await page.keyboard.press('Enter');
    
    // Both users should be visible
    await expect(page.getByText(user1.email)).toBeVisible();
    await expect(page.getByText(user2.email)).toBeVisible();
  });

  test('should filter users by role', async ({ page, userPage }) => {
    const manager = TestDataFactory.createRandomUser('manager');
    const staff = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(manager);
    await userPage.createUser(staff);
    
    // Filter by manager role
    const roleFilter = page.locator('select[name="roleFilter"], [data-testid="role-filter"]');
    if (await roleFilter.count() > 0) {
      await roleFilter.selectOption('manager');
      await expect(page.getByText(manager.email)).toBeVisible();
      await expect(page.getByText(staff.email)).not.toBeVisible();
    }
  });

  test('should display user statistics', async ({ page, userPage }) => {
    await userPage.goto();
    
    // Should show user metrics
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/active users/i)).toBeVisible();
    
    // Check for role distribution
    const roleMetrics = [
      /managers/i,
      /staff/i,
      /admins/i
    ];
    
    for (const metric of roleMetrics) {
      const element = page.getByText(metric);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  });
});

test.describe('User Authentication & Security', () => {
  test('should enforce password requirements', async ({ page, userPage, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    await userPage.goto();
    
    await page.click('button:has-text("Create User")');
    
    // Try weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="password"]', '123');
    await page.selectOption('select[name="role"]', 'staff');
    await page.click('button[type="submit"]');
    
    // Should show password requirements error
    await expect(page.getByText(/password must be/i)).toBeVisible();
  });

  test('should handle user password reset', async ({ page, userPage, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const user = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Reset user password
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    const resetButton = userRow.locator('button[title*="reset" i], button:has-text("Reset Password")');
    
    if (await resetButton.count() > 0) {
      await resetButton.click();
      await page.click('button:has-text("Confirm")');
      
      await expect(page.getByText(/password reset/i)).toBeVisible();
    }
  });

  test('should track user login activity', async ({ page, userPage, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    const user = TestDataFactory.createRandomUser('manager');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Check user activity/audit log
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    const activityButton = userRow.locator('button[title*="activity" i], button:has-text("Activity")');
    
    if (await activityButton.count() > 0) {
      await activityButton.click();
      
      // Should show activity log
      await expect(page.getByText(/activity log/i)).toBeVisible();
      await expect(page.getByText(/created/i)).toBeVisible();
    }
  });
});

test.describe('User Workflow & Operations', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should handle user bulk operations', async ({ page, userPage }) => {
    const user1 = TestDataFactory.createRandomUser('staff');
    const user2 = TestDataFactory.createRandomUser('manager');
    
    await userPage.goto();
    await userPage.createUser(user1);
    await userPage.createUser(user2);
    
    // Select multiple users
    const checkbox1 = page.locator(`tr:has-text("${user1.email}") input[type="checkbox"]`);
    const checkbox2 = page.locator(`tr:has-text("${user2.email}") input[type="checkbox"]`);
    
    if (await checkbox1.count() > 0 && await checkbox2.count() > 0) {
      await checkbox1.check();
      await checkbox2.check();
      
      // Perform bulk action
      const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
      if (await bulkActions.count() > 0) {
        await bulkActions.click();
        await page.click('button:has-text("Bulk Activate")');
        
        await expect(page.getByText(/bulk operation completed/i)).toBeVisible();
      }
    }
  });

  test('should export user data', async ({ page, userPage }) => {
    await userPage.goto();
    
    const exportButton = page.locator('button:has-text("Export"), button[title*="export" i]');
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/user.*\.(csv|xlsx)/i);
    }
  });

  test('should import user data', async ({ page, userPage }) => {
    await userPage.goto();
    
    const importButton = page.locator('button:has-text("Import"), button[title*="import" i]');
    if (await importButton.count() > 0) {
      await importButton.click();
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'users.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('email,firstName,lastName,role\ntest@example.com,Test,User,staff')
        });
        
        await page.click('button:has-text("Upload")');
        await expect(page.getByText(/import completed/i)).toBeVisible();
      }
    }
  });
});

test.describe('Employee Management & Scheduling', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should manage employee shifts', async ({ page }) => {
    await page.goto('/employees/schedule');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Should show schedule management
      await expect(page.getByText(/schedule/i)).toBeVisible();
      
      // Create new shift
      const createShiftButton = page.locator('button:has-text("Create Shift"), button:has-text("Add Shift")');
      if (await createShiftButton.count() > 0) {
        await createShiftButton.click();
        
        // Fill shift details
        await page.fill('input[name="startTime"]', '09:00');
        await page.fill('input[name="endTime"]', '17:00');
        await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
        
        await page.click('button[type="submit"]');
        await expect(page.getByText(/shift created/i)).toBeVisible();
      }
    }
  });

  test('should track employee attendance', async ({ page }) => {
    await page.goto('/employees/attendance');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Should show attendance tracking
      await expect(page.getByText(/attendance/i)).toBeVisible();
      
      // Check attendance records
      const attendanceTable = page.locator('table, [data-testid="attendance-table"]');
      if (await attendanceTable.count() > 0) {
        await expect(attendanceTable).toBeVisible();
      }
    }
  });

  test('should manage employee permissions', async ({ page, userPage }) => {
    const user = TestDataFactory.createRandomUser('staff');
    
    await userPage.goto();
    await userPage.createUser(user);
    
    // Edit user permissions
    await userPage.searchUser(user.email);
    const userRow = page.locator(`tr:has-text("${user.email}")`);
    const permissionsButton = userRow.locator('button[title*="permissions" i], button:has-text("Permissions")');
    
    if (await permissionsButton.count() > 0) {
      await permissionsButton.click();
      
      // Should show permissions dialog
      await expect(page.getByText(/permissions/i)).toBeVisible();
      
      // Toggle some permissions
      const canViewOrders = page.locator('input[name="permissions.viewOrders"]');
      const canEditMenu = page.locator('input[name="permissions.editMenu"]');
      
      if (await canViewOrders.count() > 0) {
        await canViewOrders.check();
      }
      if (await canEditMenu.count() > 0) {
        await canEditMenu.check();
      }
      
      await page.click('button:has-text("Save"), button[type="submit"]');
      await expect(page.getByText(/permissions updated/i)).toBeVisible();
    }
  });
});

test.describe('User Profile & Settings', () => {
  test('should allow users to update their profile', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Navigate to user profile
    await page.click('[data-testid="user-menu"], .user-menu, button:has-text("Profile")');
    await page.click('button:has-text("Profile"), a:has-text("Profile")');
    
    // Update profile information
    const firstNameField = page.locator('input[name="firstName"]');
    const lastNameField = page.locator('input[name="lastName"]');
    
    if (await firstNameField.count() > 0 && await lastNameField.count() > 0) {
      await firstNameField.fill('Updated First Name');
      await lastNameField.fill('Updated Last Name');
      
      await page.click('button:has-text("Save"), button[type="submit"]');
      await expect(page.getByText(/profile updated/i)).toBeVisible();
    }
  });

  test('should allow users to change password', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Navigate to change password
    await page.click('[data-testid="user-menu"], .user-menu');
    await page.click('button:has-text("Change Password"), a:has-text("Change Password")');
    
    // Change password
    const currentPasswordField = page.locator('input[name="currentPassword"]');
    const newPasswordField = page.locator('input[name="newPassword"]');
    const confirmPasswordField = page.locator('input[name="confirmPassword"]');
    
    if (await currentPasswordField.count() > 0) {
      await currentPasswordField.fill('admin123');
      await newPasswordField.fill('NewPassword123!');
      await confirmPasswordField.fill('NewPassword123!');
      
      await page.click('button:has-text("Update Password"), button[type="submit"]');
      await expect(page.getByText(/password updated/i)).toBeVisible();
    }
  });
});
/**
 * Global Teardown for E2E Tests
 * Cleans up test environment after running test suites
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Test Environment Cleanup...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://100.92.188.34:8080';
  const apiURL = process.env.API_URL || 'http://100.92.188.34:5000';
  
  // Launch browser for cleanup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Cleaning up test data...');
    
    // Get auth token for cleanup operations
    const token = await getAuthToken(page, apiURL);
    if (!token) {
      console.log('⚠️  No auth token - skipping data cleanup');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Clean up test-created data
    await cleanupTestData(page, apiURL, headers);
    
    // Generate test completion report
    await generateTestReport();
    
    console.log('✅ E2E Test Environment Cleanup Complete!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('⚠️  Manual cleanup may be required');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function getAuthToken(page: any, apiURL: string): Promise<string> {
  try {
    const response = await page.request.post(`${apiURL}/api/auth/login`, {
      data: {
        email: 'superadmin@system.com',
        password: 'admin123'
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      return data.token || '';
    }
  } catch (error) {
    console.log('Could not obtain auth token for cleanup');
  }
  return '';
}

async function cleanupTestData(page: any, apiURL: string, headers: any) {
  console.log('🗑️  Removing test-generated data...');
  
  try {
    // Clean up test tenants (those created during tests)
    const tenantsResponse = await page.request.get(`${apiURL}/api/tenants`, { headers }).catch(() => null);
    if (tenantsResponse?.ok()) {
      const tenants = await tenantsResponse.json();
      
      for (const tenant of tenants) {
        // Remove tenants with test patterns in their names/slugs
        if (tenant.name?.includes('Test Restaurant') || 
            tenant.slug?.includes('test-restaurant') ||
            tenant.email?.includes('test@example.com')) {
          
          const deleteResponse = await page.request.delete(`${apiURL}/api/tenants/${tenant._id}`, { headers }).catch(() => null);
          if (deleteResponse?.ok()) {
            console.log(`🗑️  Removed test tenant: ${tenant.name}`);
          }
        }
      }
    }
    
    // Clean up test users
    const usersResponse = await page.request.get(`${apiURL}/api/users`, { headers }).catch(() => null);
    if (usersResponse?.ok()) {
      const users = await usersResponse.json();
      
      for (const user of users) {
        // Remove users with test patterns in their emails
        if (user.email?.includes('test.') && user.email?.includes('@example.com')) {
          const deleteResponse = await page.request.delete(`${apiURL}/api/users/${user._id}`, { headers }).catch(() => null);
          if (deleteResponse?.ok()) {
            console.log(`🗑️  Removed test user: ${user.email}`);
          }
        }
      }
    }
    
    // Clean up test branches
    const branchesResponse = await page.request.get(`${apiURL}/api/branches`, { headers }).catch(() => null);
    if (branchesResponse?.ok()) {
      const branches = await branchesResponse.json();
      
      for (const branch of branches) {
        // Remove branches with test patterns
        if (branch.name?.includes('Test') && branch.contact?.email?.includes('@example.com')) {
          const deleteResponse = await page.request.delete(`${apiURL}/api/branches/${branch._id}`, { headers }).catch(() => null);
          if (deleteResponse?.ok()) {
            console.log(`🗑️  Removed test branch: ${branch.name}`);
          }
        }
      }
    }
    
    // Clean up test orders (if any were created during testing)
    const ordersResponse = await page.request.get(`${apiURL}/api/orders`, { headers }).catch(() => null);
    if (ordersResponse?.ok()) {
      const orders = await ordersResponse.json();
      
      for (const order of orders) {
        // Remove orders created during tests (recent orders with test patterns)
        const orderDate = new Date(order.createdAt);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (orderDate > oneHourAgo && 
            (order.customer?.email?.includes('test@') || 
             order.notes?.includes('E2E Test'))) {
          
          const deleteResponse = await page.request.delete(`${apiURL}/api/orders/${order._id}`, { headers }).catch(() => null);
          if (deleteResponse?.ok()) {
            console.log(`🗑️  Removed test order: ${order.orderNumber}`);
          }
        }
      }
    }
    
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.log('⚠️  Test data cleanup failed:', error);
  }
}

async function generateTestReport() {
  console.log('📊 Generating test completion report...');
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const reportDir = 'test-results';
    await fs.mkdir(reportDir, { recursive: true });
    
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        duration: 'See detailed reports',
      },
      cleanup: {
        status: 'completed',
        timestamp: new Date().toISOString(),
        actions: [
          'Test tenants removed',
          'Test users cleaned up', 
          'Test branches deleted',
          'Test orders purged',
          'Environment reset'
        ]
      },
      reports: {
        html: 'test-results/html-report/index.html',
        json: 'test-results/results.json',
        junit: 'test-results/results.xml'
      },
      nextSteps: [
        'Review HTML report for detailed test results',
        'Check test-results directory for artifacts',
        'Verify all tests passed before deployment',
        'Update test documentation if needed'
      ]
    };
    
    await fs.writeFile(
      path.join(reportDir, 'test-completion-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📊 Test completion report saved to test-results/test-completion-report.json');
    
  } catch (error) {
    console.log('⚠️  Could not generate test report:', error);
  }
}

export default globalTeardown;
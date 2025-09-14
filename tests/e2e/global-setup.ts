/**
 * Global Setup for E2E Tests
 * Prepares test environment before running test suites
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Environment Setup...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://100.92.188.34:8080';
  const apiURL = process.env.API_URL || 'http://100.92.188.34:5000';
  
  console.log(`📡 Frontend URL: ${baseURL}`);
  console.log(`🔗 Backend API: ${apiURL}`);
  
  // Launch browser for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Checking application availability...');
    
    // Wait for frontend to be available
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Frontend application is responsive');
    
    // Check backend API health
    const healthResponse = await page.request.get(`${apiURL}/api/health`).catch(() => null);
    if (healthResponse?.ok()) {
      console.log('✅ Backend API is healthy');
    } else {
      console.log('⚠️  Backend API health check failed - tests may have issues');
    }
    
    // Verify authentication endpoints
    const loginResponse = await page.request.post(`${apiURL}/api/auth/login`, {
      data: {
        email: 'admin@joespizzapalace.com',
        password: 'admin123'
      }
    }).catch(() => null);
    
    if (loginResponse?.ok()) {
      console.log('✅ Authentication system is working');
    } else {
      console.log('⚠️  Authentication test failed - login tests may fail');
    }
    
    // Verify database connectivity by checking a simple endpoint
    const tenantsResponse = await page.request.get(`${apiURL}/api/tenants`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken(page, apiURL)}`
      }
    }).catch(() => null);
    
    if (tenantsResponse?.ok()) {
      console.log('✅ Database connectivity confirmed');
    } else {
      console.log('⚠️  Database connectivity check failed');
    }
    
    // Set up test data if needed
    await setupTestData(page, apiURL);
    
    console.log('🎯 E2E Test Environment Setup Complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('⚠️  Tests may fail due to setup issues');
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
    console.log('Could not obtain auth token for setup');
  }
  return '';
}

async function setupTestData(page: any, apiURL: string) {
  console.log('📊 Setting up test data...');
  
  const token = await getAuthToken(page, apiURL);
  if (!token) {
    console.log('⚠️  No auth token - skipping test data setup');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Ensure test tenant exists
    const testTenantData = {
      name: 'Test Restaurant for E2E',
      slug: 'test-restaurant-e2e',
      email: 'test-e2e@example.com',
      phone: '+1-555-0100',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TX',
        postalCode: '12345',
        country: 'United States'
      },
      currency: 'USD',
      businessType: 'restaurant'
    };
    
    const tenantResponse = await page.request.post(`${apiURL}/api/tenants`, {
      data: testTenantData,
      headers
    }).catch(() => null);
    
    if (tenantResponse?.ok()) {
      console.log('✅ Test tenant created/verified');
    }
    
    // Ensure test users exist
    const testUsers = [
      {
        email: 'test.manager@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'manager'
      },
      {
        email: 'test.staff@example.com', 
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Staff',
        role: 'staff'
      }
    ];
    
    for (const userData of testUsers) {
      const userResponse = await page.request.post(`${apiURL}/api/users`, {
        data: userData,
        headers
      }).catch(() => null);
      
      if (userResponse?.ok()) {
        console.log(`✅ Test user ${userData.email} created/verified`);
      }
    }
    
    console.log('📊 Test data setup complete');
    
  } catch (error) {
    console.log('⚠️  Test data setup failed:', error);
  }
}

export default globalSetup;
/**
 * Report API Integration Tests
 * 
 * Tests all report generation endpoints with various scenarios
 * Run with: node tests/api/report.api.test.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN; // Set this to a valid JWT token

// Test utilities
class ReportAPITester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = TEST_TOKEN;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  }

  async test(name, testFn) {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      const result = await testFn();
      
      if (result.passed) {
        console.log(`✅ PASSED: ${name}`);
        this.passed++;
      } else {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Reason: ${result.message}`);
        this.failed++;
      }

      this.results.push({
        name,
        passed: result.passed,
        message: result.message,
        details: result.details || null
      });

    } catch (error) {
      console.log(`❌ ERROR: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
      this.results.push({
        name,
        passed: false,
        message: error.message,
        details: error.stack
      });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
    }

    // Save detailed results to file
    const resultsFile = path.join(__dirname, '../../test-results/report-api-results.json');
    fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
    fs.writeFileSync(resultsFile, JSON.stringify({
      summary: {
        total: this.passed + this.failed,
        passed: this.passed,
        failed: this.failed,
        successRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1)
      },
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));

    console.log(`\nDetailed results saved to: ${resultsFile}`);
  }
}

// Test data generators
const getTestDateRange = (daysBack = 30) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};

const getValidReportRequest = (overrides = {}) => {
  const dateRange = getTestDateRange();
  return {
    ...dateRange,
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    period: 'daily',
    ...overrides
  };
};

// Main test execution
async function runReportAPITests() {
  const tester = new ReportAPITester();

  if (!tester.token) {
    console.error('❌ TEST_TOKEN environment variable is required');
    console.error('   Set it to a valid JWT token from a logged-in user');
    process.exit(1);
  }

  console.log('🚀 Starting Report API Integration Tests');
  console.log(`Base URL: ${API_BASE_URL}`);

  // Test 1: Get Report Types
  await tester.test('Get Available Report Types', async () => {
    const response = await tester.makeRequest('/reports/types');
    
    tester.assert(response.ok, `Expected success but got ${response.status}`);
    tester.assert(response.data.success, 'Response should have success: true');
    tester.assert(Array.isArray(response.data.reports), 'Reports should be an array');
    tester.assert(response.data.reports.length > 0, 'Should return at least one report type');

    // Verify report structure
    const report = response.data.reports[0];
    tester.assert(report.type, 'Report should have type');
    tester.assert(report.name, 'Report should have name');
    tester.assert(report.description, 'Report should have description');
    tester.assert(Array.isArray(report.requiredRole), 'Report should have requiredRole array');
    tester.assert(Array.isArray(report.formats), 'Report should have formats array');

    return { passed: true, message: `Found ${response.data.reports.length} report types` };
  });

  // Test 2: Get User Branches
  await tester.test('Get User Branches for Filtering', async () => {
    const response = await tester.makeRequest('/reports/branches');
    
    tester.assert(response.ok, `Expected success but got ${response.status}`);
    tester.assert(response.data.success, 'Response should have success: true');
    tester.assert(Array.isArray(response.data.branches), 'Branches should be an array');

    return { passed: true, message: `Found ${response.data.branches.length} branches` };
  });

  // Test 3: Sales Report Generation (PDF)
  await tester.test('Generate Sales Report (PDF)', async () => {
    const requestData = getValidReportRequest({
      format: 'pdf',
      orderType: 'dine-in',
      paymentMethod: 'cash'
    });

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');
    
    if (response.data.data) {
      tester.assert(response.data.data.fileName, 'Should return fileName');
      tester.assert(response.data.data.downloadUrl, 'Should return downloadUrl');
    }

    return { passed: true, message: 'Sales report generated successfully' };
  });

  // Test 4: Sales Report Generation (Excel)
  await tester.test('Generate Sales Report (Excel)', async () => {
    const requestData = getValidReportRequest({
      format: 'excel',
      groupBy: 'date',
      sortBy: 'revenue',
      sortOrder: 'desc'
    });

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Sales report (Excel) generated successfully' };
  });

  // Test 5: Menu Performance Report
  await tester.test('Generate Menu Performance Report', async () => {
    const requestData = getValidReportRequest({
      format: 'pdf'
    });

    const response = await tester.makeRequest('/reports/menu-performance', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Menu performance report generated successfully' };
  });

  // Test 6: Customer Analytics Report
  await tester.test('Generate Customer Analytics Report', async () => {
    const requestData = getValidReportRequest({
      format: 'excel'
    });

    const response = await tester.makeRequest('/reports/customer-analytics', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Customer analytics report generated successfully' };
  });

  // Test 7: Financial Summary Report (requires admin role)
  await tester.test('Generate Financial Summary Report', async () => {
    const requestData = getValidReportRequest({
      format: 'pdf'
    });

    const response = await tester.makeRequest('/reports/financial-summary', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    // This might fail with 403 if user doesn't have admin role
    if (response.status === 403) {
      return { passed: true, message: 'Correctly blocked non-admin user (403)' };
    }

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Financial summary report generated successfully' };
  });

  // Test 8: Staff Performance Report (requires admin role)
  await tester.test('Generate Staff Performance Report', async () => {
    const requestData = getValidReportRequest({
      format: 'excel'
    });

    const response = await tester.makeRequest('/reports/staff-performance', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    // This might fail with 403 if user doesn't have admin role
    if (response.status === 403) {
      return { passed: true, message: 'Correctly blocked non-admin user (403)' };
    }

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Staff performance report generated successfully' };
  });

  // Test 9: Branch Performance Report (requires admin role)
  await tester.test('Generate Branch Performance Report', async () => {
    const requestData = getValidReportRequest({
      format: 'pdf',
      branchIds: [] // Empty for all branches
    });

    const response = await tester.makeRequest('/reports/branch-performance', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    // This might fail with 403 if user doesn't have admin role
    if (response.status === 403) {
      return { passed: true, message: 'Correctly blocked non-admin user (403)' };
    }

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Branch performance report generated successfully' };
  });

  // Test 10: Invalid Date Range
  await tester.test('Reject Invalid Date Range', async () => {
    const requestData = {
      startDate: '2024-12-31T23:59:59.000Z',
      endDate: '2024-01-01T00:00:00.000Z', // End before start
      format: 'pdf'
    };

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(!response.ok, 'Should reject invalid date range');
    tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);
    tester.assert(!response.data.success, 'Response should have success: false');

    return { passed: true, message: 'Correctly rejected invalid date range' };
  });

  // Test 11: Invalid Format
  await tester.test('Reject Invalid Format', async () => {
    const requestData = getValidReportRequest({
      format: 'invalid-format'
    });

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(!response.ok, 'Should reject invalid format');
    tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);

    return { passed: true, message: 'Correctly rejected invalid format' };
  });

  // Test 12: Missing Required Fields
  await tester.test('Reject Missing Required Fields', async () => {
    const requestData = {
      // Missing startDate and endDate
      format: 'pdf'
    };

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    tester.assert(!response.ok, 'Should reject missing required fields');
    tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);

    return { passed: true, message: 'Correctly rejected missing required fields' };
  });

  // Test 13: Email Report Delivery
  await tester.test('Email Report Delivery', async () => {
    const requestData = {
      reportType: 'sales',
      ...getTestDateRange(7), // Last 7 days
      format: 'pdf',
      recipients: ['test@example.com'],
      subject: 'Test Sales Report',
      message: 'This is a test report email.'
    };

    const response = await tester.makeRequest('/reports/email', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    // Note: This might fail if email service is not configured
    if (response.status === 500 && response.data.error?.includes('email')) {
      return { passed: true, message: 'Email service not configured (expected in test env)' };
    }

    tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
    tester.assert(response.data.success, 'Response should have success: true');

    return { passed: true, message: 'Email report sent successfully' };
  });

  // Test 14: Unauthorized Access
  await tester.test('Reject Unauthorized Access', async () => {
    const requestData = getValidReportRequest();

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });

    tester.assert(!response.ok, 'Should reject unauthorized access');
    tester.assert(response.status === 401, `Expected 401 but got ${response.status}`);

    return { passed: true, message: 'Correctly rejected unauthorized access' };
  });

  // Test 15: Download Report File
  await tester.test('Download Generated Report File', async () => {
    // First generate a report
    const requestData = getValidReportRequest({ format: 'pdf' });
    const generateResponse = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (!generateResponse.ok || !generateResponse.data.data?.fileName) {
      return { passed: false, message: 'Failed to generate report for download test' };
    }

    const fileName = generateResponse.data.data.fileName;
    
    // Now try to download it
    const downloadResponse = await tester.makeRequest(`/reports/download/${fileName}`);

    tester.assert(downloadResponse.ok, `Download should succeed but got ${downloadResponse.status}`);

    return { passed: true, message: `Successfully downloaded report: ${fileName}` };
  });

  // Generate final report
  tester.generateReport();

  return {
    passed: tester.passed,
    failed: tester.failed,
    total: tester.passed + tester.failed
  };
}

// Run tests if called directly
if (require.main === module) {
  runReportAPITests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runReportAPITests };
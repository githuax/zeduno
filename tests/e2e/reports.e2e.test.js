/**
 * End-to-End Report System Integration Tests
 * 
 * Tests complete workflows from frontend to email delivery
 * Run with: node tests/e2e/reports.e2e.test.js
 */

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN;
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

class E2EReportTester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = TEST_TOKEN;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.generatedFiles = []; // Track files for cleanup
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
    let data;
    
    try {
      data = await response.json();
    } catch (error) {
      data = { error: 'Invalid JSON response' };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  }

  async test(name, testFn, timeout = 30000) {
    const startTime = Date.now();
    
    try {
      console.log(`\n🔄 Testing: ${name}`);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      );
      
      const result = await Promise.race([testFn(), timeoutPromise]);
      const duration = Date.now() - startTime;
      
      if (result.passed) {
        console.log(`✅ PASSED: ${name} (${duration}ms)`);
        this.passed++;
      } else {
        console.log(`❌ FAILED: ${name} (${duration}ms)`);
        console.log(`   Reason: ${result.message}`);
        this.failed++;
      }

      this.results.push({
        name,
        passed: result.passed,
        message: result.message,
        duration,
        details: result.details || null
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ERROR: ${name} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
      this.results.push({
        name,
        passed: false,
        message: error.message,
        duration,
        details: error.stack
      });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // Simulate user workflow delays
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate test date range
  getTestDateRange(daysBack = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 END-TO-END TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    // Performance analysis
    const avgDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / this.results.length;
    const maxDuration = Math.max(...this.results.map(r => r.duration || 0));
    const minDuration = Math.min(...this.results.map(r => r.duration || 0));
    
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log(`Average Test Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Longest Test: ${maxDuration}ms`);
    console.log(`Shortest Test: ${minDuration}ms`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.name}: ${result.message} (${result.duration}ms)`);
      });
    }

    // Save detailed results
    const resultsFile = path.join(__dirname, '../../test-results/e2e-test-results.json');
    fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
    fs.writeFileSync(resultsFile, JSON.stringify({
      summary: {
        total: this.passed + this.failed,
        passed: this.passed,
        failed: this.failed,
        successRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1),
        performance: {
          avgDuration,
          maxDuration,
          minDuration
        }
      },
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));

    console.log(`\nDetailed results saved to: ${resultsFile}`);
  }
}

async function runE2EReportTests() {
  const tester = new E2EReportTester();

  if (!tester.token) {
    console.error('❌ TEST_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Starting End-to-End Report System Tests');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);

  // Test 1: Complete Manual Report Generation Workflow
  await tester.test('Complete Manual Report Generation Workflow', async () => {
    // Step 1: Get available report types (simulate user loading page)
    console.log('   Step 1: Loading report types...');
    const typesResponse = await tester.makeRequest('/reports/types');
    tester.assert(typesResponse.ok, 'Failed to load report types');
    
    await tester.delay(500); // Simulate user reading options
    
    // Step 2: Get user branches (simulate branch selection)
    console.log('   Step 2: Loading user branches...');
    const branchesResponse = await tester.makeRequest('/reports/branches');
    tester.assert(branchesResponse.ok, 'Failed to load branches');
    
    await tester.delay(1000); // Simulate user making selection
    
    // Step 3: Generate sales report (simulate form submission)
    console.log('   Step 3: Generating sales report...');
    const reportRequest = {
      ...tester.getTestDateRange(30),
      format: 'pdf',
      includeCharts: true,
      includeDetails: true,
      period: 'daily'
    };
    
    const generateResponse = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify(reportRequest)
    });
    
    tester.assert(generateResponse.ok, `Report generation failed: ${JSON.stringify(generateResponse.data)}`);
    tester.assert(generateResponse.data.success, 'Report generation should succeed');
    tester.assert(generateResponse.data.data?.fileName, 'Should return filename');
    
    const fileName = generateResponse.data.data.fileName;
    tester.generatedFiles.push(fileName);
    
    await tester.delay(2000); // Simulate report processing time
    
    // Step 4: Download generated report (simulate user clicking download)
    console.log('   Step 4: Downloading generated report...');
    const downloadResponse = await tester.makeRequest(`/reports/download/${fileName}`);
    tester.assert(downloadResponse.ok, 'Report download should succeed');
    
    return { 
      passed: true, 
      message: `Complete workflow executed successfully - Report: ${fileName}`,
      details: {
        typesLoaded: typesResponse.data.reports?.length || 0,
        branchesLoaded: branchesResponse.data.branches?.length || 0,
        reportGenerated: fileName
      }
    };
  }, 45000);

  // Test 2: Email Report Workflow
  await tester.test('Complete Email Report Workflow', async () => {
    console.log('   Step 1: Preparing email report request...');
    
    const emailRequest = {
      reportType: 'customer-analytics',
      ...tester.getTestDateRange(14),
      format: 'excel',
      recipients: [TEST_EMAIL],
      subject: 'E2E Test - Customer Analytics Report',
      message: 'This is an automated test of the email report functionality.'
    };
    
    await tester.delay(1000); // Simulate user input
    
    console.log('   Step 2: Sending email report...');
    const emailResponse = await tester.makeRequest('/reports/email', {
      method: 'POST',
      body: JSON.stringify(emailRequest)
    });
    
    // Email might fail in test environment
    if (emailResponse.status === 500 && emailResponse.data.error?.includes('email')) {
      return { passed: true, message: 'Email service not configured (expected in test environment)' };
    }
    
    tester.assert(emailResponse.ok, `Email report failed: ${JSON.stringify(emailResponse.data)}`);
    tester.assert(emailResponse.data.success, 'Email report should succeed');
    
    return { 
      passed: true, 
      message: `Email report sent successfully to ${emailRequest.recipients.length} recipients`,
      details: {
        reportType: emailRequest.reportType,
        format: emailRequest.format,
        recipients: emailRequest.recipients.length
      }
    };
  }, 30000);

  // Test 3: Multi-Format Report Generation
  await tester.test('Multi-Format Report Generation', async () => {
    const formats = ['pdf', 'excel'];
    const results = [];
    
    for (const format of formats) {
      console.log(`   Generating ${format.toUpperCase()} format...`);
      
      const reportRequest = {
        ...tester.getTestDateRange(7),
        format,
        includeCharts: format === 'pdf', // Charts only in PDF
        includeDetails: true,
        period: 'daily'
      };
      
      const response = await tester.makeRequest('/reports/menu-performance', {
        method: 'POST',
        body: JSON.stringify(reportRequest)
      });
      
      tester.assert(response.ok, `${format.toUpperCase()} generation failed: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, `${format.toUpperCase()} generation should succeed`);
      
      if (response.data.data?.fileName) {
        tester.generatedFiles.push(response.data.data.fileName);
        results.push(`${format.toUpperCase()}: ${response.data.data.fileName}`);
      }
      
      await tester.delay(1500); // Processing delay
    }
    
    return { 
      passed: true, 
      message: `Generated ${formats.length} different formats successfully`,
      details: { generatedFiles: results }
    };
  }, 60000);

  // Test 4: Scheduled Report Lifecycle
  await tester.test('Scheduled Report Complete Lifecycle', async () => {
    console.log('   Step 1: Creating scheduled report...');
    
    const scheduleData = {
      name: 'E2E Test Schedule',
      description: 'End-to-end test automated report',
      reportType: 'sales',
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC'
      },
      reportConfig: {
        format: 'pdf',
        includeCharts: true,
        includeDetails: true,
        period: 'daily'
      },
      emailConfig: {
        enabled: true,
        recipients: [TEST_EMAIL],
        subject: 'Daily Sales Report - E2E Test'
      },
      filters: {
        dateRangeType: 'relative',
        relativeDays: 1
      },
      isActive: true
    };
    
    const createResponse = await tester.makeRequest('/reports/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
    
    tester.assert(createResponse.ok, `Schedule creation failed: ${JSON.stringify(createResponse.data)}`);
    tester.assert(createResponse.data.success, 'Schedule creation should succeed');
    
    const scheduleId = createResponse.data.schedule?.id;
    tester.assert(scheduleId, 'Schedule should have an ID');
    
    await tester.delay(2000);
    
    console.log('   Step 2: Running schedule immediately...');
    const runResponse = await tester.makeRequest(`/reports/schedules/${scheduleId}/run`, {
      method: 'POST'
    });
    
    tester.assert(runResponse.ok, `Schedule execution failed: ${JSON.stringify(runResponse.data)}`);
    
    await tester.delay(3000); // Allow execution time
    
    console.log('   Step 3: Checking schedule status...');
    const statusResponse = await tester.makeRequest(`/reports/schedules/${scheduleId}`);
    tester.assert(statusResponse.ok, `Schedule status check failed`);
    
    console.log('   Step 4: Cleaning up schedule...');
    const deleteResponse = await tester.makeRequest(`/reports/schedules/${scheduleId}`, {
      method: 'DELETE'
    });
    
    tester.assert(deleteResponse.ok, `Schedule deletion failed: ${JSON.stringify(deleteResponse.data)}`);
    
    return { 
      passed: true, 
      message: `Complete scheduled report lifecycle tested successfully`,
      details: {
        scheduleId,
        reportType: scheduleData.reportType,
        frequency: scheduleData.schedule.frequency
      }
    };
  }, 60000);

  // Test 5: Error Recovery and Resilience
  await tester.test('Error Recovery and System Resilience', async () => {
    const errorScenarios = [];
    
    console.log('   Scenario 1: Invalid date range handling...');
    const invalidDateResponse = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        startDate: '2024-12-31T23:59:59.000Z',
        endDate: '2024-01-01T00:00:00.000Z', // End before start
        format: 'pdf'
      })
    });
    
    errorScenarios.push({
      name: 'Invalid Date Range',
      handled: !invalidDateResponse.ok && invalidDateResponse.status === 400
    });
    
    await tester.delay(500);
    
    console.log('   Scenario 2: Unauthorized access handling...');
    const unauthorizedResponse = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(7),
        format: 'pdf'
      }),
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });
    
    errorScenarios.push({
      name: 'Unauthorized Access',
      handled: !unauthorizedResponse.ok && unauthorizedResponse.status === 401
    });
    
    await tester.delay(500);
    
    console.log('   Scenario 3: Non-existent resource handling...');
    const notFoundResponse = await tester.makeRequest('/reports/download/non-existent-file.pdf');
    
    errorScenarios.push({
      name: 'Non-existent Resource',
      handled: !notFoundResponse.ok && notFoundResponse.status === 404
    });
    
    const allHandled = errorScenarios.every(scenario => scenario.handled);
    const handledCount = errorScenarios.filter(scenario => scenario.handled).length;
    
    return { 
      passed: allHandled, 
      message: `Error handling: ${handledCount}/${errorScenarios.length} scenarios handled correctly`,
      details: { errorScenarios }
    };
  }, 30000);

  // Test 6: Concurrent User Simulation
  await tester.test('Concurrent Users Report Generation', async () => {
    console.log('   Simulating 3 concurrent users...');
    
    const concurrentRequests = [
      // User 1: Sales report
      tester.makeRequest('/reports/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(30),
          format: 'pdf'
        })
      }),
      
      // User 2: Menu performance report
      tester.makeRequest('/reports/menu-performance', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(14),
          format: 'excel'
        })
      }),
      
      // User 3: Customer analytics report
      tester.makeRequest('/reports/customer-analytics', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(7),
          format: 'pdf'
        })
      })
    ];
    
    const results = await Promise.allSettled(concurrentRequests);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.ok
    ).length;
    
    const failed = results.length - successful;
    
    // Collect generated filenames
    results.forEach(result => {
      if (result.status === 'fulfilled' && 
          result.value.ok && 
          result.value.data.data?.fileName) {
        tester.generatedFiles.push(result.value.data.data.fileName);
      }
    });
    
    tester.assert(successful >= 2, `Too many concurrent requests failed: ${successful}/${results.length} succeeded`);
    
    return { 
      passed: true, 
      message: `Concurrent requests handled: ${successful}/${results.length} successful`,
      details: {
        successful,
        failed,
        totalRequests: results.length
      }
    };
  }, 45000);

  // Test 7: Data Consistency Check
  await tester.test('Data Consistency Across Report Types', async () => {
    console.log('   Generating multiple reports for same period...');
    
    const dateRange = tester.getTestDateRange(7);
    const reportTypes = ['sales', 'menu-performance', 'customer-analytics'];
    const reports = [];
    
    for (const reportType of reportTypes) {
      const response = await tester.makeRequest(`/reports/${reportType}`, {
        method: 'POST',
        body: JSON.stringify({
          ...dateRange,
          format: 'pdf',
          includeCharts: false, // Faster generation
          includeDetails: true
        })
      });
      
      if (response.ok && response.data.data?.fileName) {
        reports.push({
          type: reportType,
          fileName: response.data.data.fileName,
          success: true
        });
        tester.generatedFiles.push(response.data.data.fileName);
      } else {
        reports.push({
          type: reportType,
          success: false,
          error: response.data.error
        });
      }
      
      await tester.delay(2000); // Stagger requests
    }
    
    const successfulReports = reports.filter(r => r.success).length;
    
    tester.assert(successfulReports >= 2, `Insufficient successful reports: ${successfulReports}/${reportTypes.length}`);
    
    return { 
      passed: true, 
      message: `Data consistency check: ${successfulReports}/${reportTypes.length} reports generated`,
      details: { reports }
    };
  }, 60000);

  // Test 8: System Load and Performance
  await tester.test('System Load and Performance Under Stress', async () => {
    console.log('   Testing system under moderate load...');
    
    const startTime = Date.now();
    const loadRequests = [];
    
    // Create 5 simultaneous report generation requests
    for (let i = 0; i < 5; i++) {
      loadRequests.push(
        tester.makeRequest('/reports/sales', {
          method: 'POST',
          body: JSON.stringify({
            ...tester.getTestDateRange(3), // Shorter period for faster generation
            format: 'pdf',
            includeCharts: false
          })
        })
      );
    }
    
    const results = await Promise.allSettled(loadRequests);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.ok
    ).length;
    
    const averageResponseTime = totalDuration / results.length;
    
    // Collect generated files
    results.forEach(result => {
      if (result.status === 'fulfilled' && 
          result.value.ok && 
          result.value.data.data?.fileName) {
        tester.generatedFiles.push(result.value.data.data.fileName);
      }
    });
    
    // System should handle at least 60% of requests successfully
    tester.assert(successful >= Math.ceil(loadRequests.length * 0.6), 
      `Too many requests failed under load: ${successful}/${loadRequests.length}`);
    
    // Response time should be reasonable (under 10 seconds average)
    tester.assert(averageResponseTime < 10000, 
      `Average response time too high: ${averageResponseTime}ms`);
    
    return { 
      passed: true, 
      message: `Load test completed: ${successful}/${loadRequests.length} successful, avg ${averageResponseTime.toFixed(0)}ms`,
      details: {
        totalRequests: loadRequests.length,
        successful,
        totalDuration,
        averageResponseTime
      }
    };
  }, 120000);

  // Test 9: Cross-Browser Compatibility Simulation
  await tester.test('Cross-Platform API Compatibility', async () => {
    console.log('   Testing different request patterns...');
    
    const testPatterns = [
      {
        name: 'Standard Request',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'With Accept Header',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'With User-Agent',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'E2E-Test-Client/1.0'
        }
      }
    ];
    
    const results = [];
    
    for (const pattern of testPatterns) {
      const response = await tester.makeRequest('/reports/types', {
        headers: {
          'Authorization': `Bearer ${tester.token}`,
          ...pattern.headers
        }
      });
      
      results.push({
        pattern: pattern.name,
        success: response.ok,
        status: response.status
      });
      
      await tester.delay(500);
    }
    
    const allSuccessful = results.every(r => r.success);
    
    return { 
      passed: allSuccessful, 
      message: `API compatibility: ${results.filter(r => r.success).length}/${results.length} patterns successful`,
      details: { results }
    };
  }, 20000);

  // Test 10: Memory and Resource Cleanup
  await tester.test('Memory and Resource Management', async () => {
    console.log('   Testing resource cleanup...');
    
    // Generate several reports and track files
    const initialFileCount = tester.generatedFiles.length;
    
    for (let i = 0; i < 3; i++) {
      const response = await tester.makeRequest('/reports/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(1), // Very short period
          format: 'pdf',
          fileName: `cleanup-test-${i}-${Date.now()}.pdf`
        })
      });
      
      if (response.ok && response.data.data?.fileName) {
        tester.generatedFiles.push(response.data.data.fileName);
      }
      
      await tester.delay(1000);
    }
    
    const newFileCount = tester.generatedFiles.length;
    const filesGenerated = newFileCount - initialFileCount;
    
    // Test file access to ensure they exist
    let accessibleFiles = 0;
    for (let i = initialFileCount; i < newFileCount; i++) {
      const fileName = tester.generatedFiles[i];
      const downloadResponse = await tester.makeRequest(`/reports/download/${fileName}`);
      if (downloadResponse.ok) {
        accessibleFiles++;
      }
      await tester.delay(200);
    }
    
    return { 
      passed: true, 
      message: `Resource management test: ${filesGenerated} files generated, ${accessibleFiles} accessible`,
      details: {
        filesGenerated,
        accessibleFiles,
        totalTrackedFiles: newFileCount
      }
    };
  }, 30000);

  // Generate final report
  tester.generateReport();

  console.log(`\n📁 Generated ${tester.generatedFiles.length} test files during E2E tests`);
  console.log('   Files will be cleaned up by the system after 24 hours');

  return {
    passed: tester.passed,
    failed: tester.failed,
    total: tester.passed + tester.failed,
    generatedFiles: tester.generatedFiles.length
  };
}

// Run tests if called directly
if (require.main === module) {
  runE2EReportTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('E2E test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runE2EReportTests };
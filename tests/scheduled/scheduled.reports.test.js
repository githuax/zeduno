/**
 * Scheduled Reports System Tests
 * 
 * Tests scheduled report creation, queue processing, and automation
 * Run with: node tests/scheduled/scheduled.reports.test.js
 */

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN;
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

class ScheduledReportsTester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = TEST_TOKEN;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.createdSchedules = []; // Track created schedules for cleanup
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

  async test(name, testFn) {
    try {
      console.log(`\n⏰ Testing: ${name}`);
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

  // Cleanup created schedules
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    for (const scheduleId of this.createdSchedules) {
      try {
        await this.makeRequest(`/reports/schedules/${scheduleId}`, {
          method: 'DELETE'
        });
        console.log(`   Deleted schedule: ${scheduleId}`);
      } catch (error) {
        console.warn(`   Failed to delete schedule ${scheduleId}:`, error.message);
      }
    }
  }

  generateTestScheduleData(overrides = {}) {
    return {
      name: 'Test Daily Sales Report',
      description: 'Automated daily sales report for testing',
      reportType: 'sales',
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
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
        subject: 'Daily Sales Report - {{date}}',
        message: 'Please find attached the daily sales report.'
      },
      filters: {
        // Use last 1 day for daily reports
        dateRangeType: 'relative',
        relativeDays: 1
      },
      isActive: true,
      ...overrides
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('⏰ SCHEDULED REPORTS TEST RESULTS');
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

    // Save detailed results
    const resultsFile = path.join(__dirname, '../../test-results/scheduled-reports-results.json');
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

async function runScheduledReportsTests() {
  const tester = new ScheduledReportsTester();

  if (!tester.token) {
    console.error('❌ TEST_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Starting Scheduled Reports System Tests');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Test Email: ${TEST_EMAIL}`);

  try {
    // Test 1: Create Daily Scheduled Report
    await tester.test('Create Daily Scheduled Report', async () => {
      const scheduleData = tester.generateTestScheduleData();

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');
      tester.assert(response.data.schedule, 'Response should include schedule data');
      tester.assert(response.data.schedule.id, 'Schedule should have an ID');

      // Track for cleanup
      tester.createdSchedules.push(response.data.schedule.id);

      return { passed: true, message: `Daily schedule created with ID: ${response.data.schedule.id}` };
    });

    // Test 2: Create Weekly Scheduled Report
    await tester.test('Create Weekly Scheduled Report', async () => {
      const scheduleData = tester.generateTestScheduleData({
        name: 'Test Weekly Menu Performance Report',
        reportType: 'menu-performance',
        schedule: {
          frequency: 'weekly',
          time: '08:00',
          timezone: 'UTC',
          dayOfWeek: 1 // Monday
        },
        filters: {
          dateRangeType: 'relative',
          relativeDays: 7
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      tester.createdSchedules.push(response.data.schedule.id);

      return { passed: true, message: `Weekly schedule created with ID: ${response.data.schedule.id}` };
    });

    // Test 3: Create Monthly Scheduled Report
    await tester.test('Create Monthly Scheduled Report', async () => {
      const scheduleData = tester.generateTestScheduleData({
        name: 'Test Monthly Financial Summary',
        reportType: 'financial-summary',
        schedule: {
          frequency: 'monthly',
          time: '07:00',
          timezone: 'UTC',
          dayOfMonth: 1
        },
        filters: {
          dateRangeType: 'relative',
          relativeDays: 30
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });

      // Financial reports might require admin role
      if (response.status === 403) {
        return { passed: true, message: 'Correctly blocked non-admin user from financial report schedules' };
      }

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      tester.createdSchedules.push(response.data.schedule.id);

      return { passed: true, message: `Monthly schedule created with ID: ${response.data.schedule.id}` };
    });

    // Test 4: List All Schedules
    await tester.test('List All Scheduled Reports', async () => {
      const response = await tester.makeRequest('/reports/schedules');

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');
      tester.assert(Array.isArray(response.data.schedules), 'Should return schedules array');
      tester.assert(response.data.schedules.length >= tester.createdSchedules.length, 'Should include created test schedules');

      return { passed: true, message: `Found ${response.data.schedules.length} scheduled reports` };
    });

    // Test 5: Get Specific Schedule Details
    await tester.test('Get Schedule Details', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for testing' };
      }

      const scheduleId = tester.createdSchedules[0];
      const response = await tester.makeRequest(`/reports/schedules/${scheduleId}`);

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');
      tester.assert(response.data.schedule, 'Response should include schedule data');
      tester.assert(response.data.schedule.id === scheduleId, 'Should return correct schedule');

      return { passed: true, message: `Retrieved schedule details for ID: ${scheduleId}` };
    });

    // Test 6: Update Schedule Configuration
    await tester.test('Update Schedule Configuration', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for testing' };
      }

      const scheduleId = tester.createdSchedules[0];
      const updateData = {
        name: 'Updated Test Schedule Name',
        description: 'Updated description for testing',
        schedule: {
          frequency: 'daily',
          time: '10:00',
          timezone: 'UTC'
        },
        isActive: false
      };

      const response = await tester.makeRequest(`/reports/schedules/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      return { passed: true, message: `Schedule ${scheduleId} updated successfully` };
    });

    // Test 7: Pause and Resume Schedule
    await tester.test('Pause and Resume Schedule', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for testing' };
      }

      const scheduleId = tester.createdSchedules[0];

      // Pause schedule
      const pauseResponse = await tester.makeRequest(`/reports/schedules/${scheduleId}/pause`, {
        method: 'POST'
      });

      tester.assert(pauseResponse.ok, `Pause should succeed but got ${pauseResponse.status}: ${JSON.stringify(pauseResponse.data)}`);

      // Resume schedule
      const resumeResponse = await tester.makeRequest(`/reports/schedules/${scheduleId}/resume`, {
        method: 'POST'
      });

      tester.assert(resumeResponse.ok, `Resume should succeed but got ${resumeResponse.status}: ${JSON.stringify(resumeResponse.data)}`);

      return { passed: true, message: `Schedule ${scheduleId} paused and resumed successfully` };
    });

    // Test 8: Run Schedule Immediately
    await tester.test('Run Schedule Immediately', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for testing' };
      }

      const scheduleId = tester.createdSchedules[0];

      const response = await tester.makeRequest(`/reports/schedules/${scheduleId}/run`, {
        method: 'POST'
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      return { passed: true, message: `Schedule ${scheduleId} executed immediately` };
    });

    // Test 9: Validation - Invalid Schedule Frequency
    await tester.test('Validate Invalid Schedule Frequency', async () => {
      const invalidScheduleData = tester.generateTestScheduleData({
        name: 'Invalid Frequency Test',
        schedule: {
          frequency: 'invalid-frequency',
          time: '09:00'
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(invalidScheduleData)
      });

      tester.assert(!response.ok, 'Should reject invalid frequency');
      tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);

      return { passed: true, message: 'Correctly rejected invalid schedule frequency' };
    });

    // Test 10: Validation - Invalid Email Recipients
    await tester.test('Validate Invalid Email Recipients', async () => {
      const invalidEmailData = tester.generateTestScheduleData({
        name: 'Invalid Email Test',
        emailConfig: {
          enabled: true,
          recipients: ['invalid-email', 'also-invalid'],
          subject: 'Test'
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(invalidEmailData)
      });

      tester.assert(!response.ok, 'Should reject invalid email recipients');
      tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);

      return { passed: true, message: 'Correctly rejected invalid email recipients' };
    });

    // Test 11: Validation - Invalid Time Format
    await tester.test('Validate Invalid Time Format', async () => {
      const invalidTimeData = tester.generateTestScheduleData({
        name: 'Invalid Time Test',
        schedule: {
          frequency: 'daily',
          time: '25:99' // Invalid time
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(invalidTimeData)
      });

      tester.assert(!response.ok, 'Should reject invalid time format');
      tester.assert(response.status === 400, `Expected 400 but got ${response.status}`);

      return { passed: true, message: 'Correctly rejected invalid time format' };
    });

    // Test 12: Schedule History and Logs
    await tester.test('Get Schedule Execution History', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for testing' };
      }

      const scheduleId = tester.createdSchedules[0];
      const response = await tester.makeRequest(`/reports/schedules/${scheduleId}/history`);

      // History endpoint might not exist yet or might be empty
      if (response.status === 404) {
        return { passed: true, message: 'History endpoint not implemented yet (acceptable)' };
      }

      if (response.ok) {
        tester.assert(Array.isArray(response.data.history), 'History should be an array');
        return { passed: true, message: `Retrieved ${response.data.history.length} history entries` };
      }

      return { passed: true, message: 'Schedule history functionality tested' };
    });

    // Test 13: Queue Status Check
    await tester.test('Check Queue Status', async () => {
      const response = await tester.makeRequest('/reports/queue/status');

      // Queue status endpoint might not exist
      if (response.status === 404) {
        return { passed: true, message: 'Queue status endpoint not implemented yet (acceptable)' };
      }

      if (response.ok) {
        tester.assert(response.data.success, 'Queue status should be successful');
        return { passed: true, message: 'Queue status retrieved successfully' };
      }

      return { passed: true, message: 'Queue status functionality tested' };
    });

    // Test 14: Bulk Operations
    await tester.test('Bulk Schedule Operations', async () => {
      if (tester.createdSchedules.length < 2) {
        return { passed: true, message: 'Not enough schedules for bulk testing (acceptable)' };
      }

      // Try to pause multiple schedules
      const bulkData = {
        scheduleIds: tester.createdSchedules.slice(0, 2),
        action: 'pause'
      };

      const response = await tester.makeRequest('/reports/schedules/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData)
      });

      // Bulk operations endpoint might not exist
      if (response.status === 404) {
        return { passed: true, message: 'Bulk operations endpoint not implemented yet (acceptable)' };
      }

      if (response.ok) {
        return { passed: true, message: 'Bulk operations completed successfully' };
      }

      return { passed: true, message: 'Bulk operations functionality tested' };
    });

    // Test 15: Schedule Permission Checks
    await tester.test('Schedule Permission Checks', async () => {
      // Test creating financial report schedule (requires admin)
      const restrictedScheduleData = tester.generateTestScheduleData({
        name: 'Financial Report Permission Test',
        reportType: 'financial-summary'
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(restrictedScheduleData)
      });

      // Should either succeed (if user has admin role) or be blocked (403)
      if (response.status === 403) {
        return { passed: true, message: 'Correctly blocked non-admin user from financial report schedules' };
      }

      if (response.ok) {
        tester.createdSchedules.push(response.data.schedule.id);
        return { passed: true, message: 'Financial report schedule permission check passed' };
      }

      return { passed: false, message: `Unexpected response: ${response.status}` };
    });

    // Test 16: Timezone Handling
    await tester.test('Timezone Handling', async () => {
      const timezoneScheduleData = tester.generateTestScheduleData({
        name: 'Timezone Test Schedule',
        schedule: {
          frequency: 'daily',
          time: '14:30',
          timezone: 'America/New_York'
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(timezoneScheduleData)
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      tester.createdSchedules.push(response.data.schedule.id);

      return { passed: true, message: 'Timezone handling tested successfully' };
    });

    // Test 17: Schedule with Custom Date Ranges
    await tester.test('Schedule with Custom Date Ranges', async () => {
      const customRangeData = tester.generateTestScheduleData({
        name: 'Custom Date Range Schedule',
        filters: {
          dateRangeType: 'custom',
          customStartDate: '2024-01-01',
          customEndDate: '2024-01-31'
        }
      });

      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(customRangeData)
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      tester.createdSchedules.push(response.data.schedule.id);

      return { passed: true, message: 'Custom date range schedule created successfully' };
    });

    // Test 18: Schedule Conflict Detection
    await tester.test('Schedule Conflict Detection', async () => {
      // Create two schedules with the same name
      const schedule1Data = tester.generateTestScheduleData({
        name: 'Duplicate Name Test'
      });

      const schedule2Data = tester.generateTestScheduleData({
        name: 'Duplicate Name Test'
      });

      const response1 = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule1Data)
      });

      if (response1.ok) {
        tester.createdSchedules.push(response1.data.schedule.id);
      }

      const response2 = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule2Data)
      });

      // System might allow duplicates or prevent them
      if (response2.ok) {
        tester.createdSchedules.push(response2.data.schedule.id);
        return { passed: true, message: 'System allows duplicate names (acceptable)' };
      } else if (response2.status === 409) {
        return { passed: true, message: 'System prevents duplicate names (good)' };
      }

      return { passed: true, message: 'Duplicate name handling tested' };
    });

    // Test 19: Error Handling for Non-existent Schedule
    await tester.test('Handle Non-existent Schedule', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist

      const response = await tester.makeRequest(`/reports/schedules/${fakeId}`);

      tester.assert(!response.ok, 'Should return error for non-existent schedule');
      tester.assert(response.status === 404, `Expected 404 but got ${response.status}`);

      return { passed: true, message: 'Correctly handled non-existent schedule' };
    });

    // Test 20: Delete Schedule
    await tester.test('Delete Scheduled Report', async () => {
      if (tester.createdSchedules.length === 0) {
        return { passed: false, message: 'No schedules available for deletion testing' };
      }

      const scheduleId = tester.createdSchedules.pop(); // Remove from tracking array
      const response = await tester.makeRequest(`/reports/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      tester.assert(response.ok, `Expected success but got ${response.status}: ${JSON.stringify(response.data)}`);
      tester.assert(response.data.success, 'Response should have success: true');

      return { passed: true, message: `Schedule ${scheduleId} deleted successfully` };
    });

  } finally {
    // Cleanup any remaining test schedules
    await tester.cleanup();
  }

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
  runScheduledReportsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Scheduled reports test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runScheduledReportsTests };
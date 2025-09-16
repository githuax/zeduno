// Utility for testing report integration
import { mapTemplateToReportType, buildReportRequest } from '@/hooks/useReports';

// Test the mapping function
export const testReportMapping = () => {
  const testCases = [
    { input: 'daily-sales', expected: 'sales' },
    { input: 'customer-analytics', expected: 'customer-analytics' },
    { input: 'operational-summary', expected: 'staff-performance' },
    { input: 'financial-overview', expected: 'financial-summary' },
    { input: 'inventory-report', expected: 'menu-performance' },
    { input: 'custom-report', expected: 'sales' },
    { input: 'unknown-template', expected: 'sales' },
  ];

  const results = testCases.map(test => ({
    ...test,
    actual: mapTemplateToReportType(test.input),
    passed: mapTemplateToReportType(test.input) === test.expected
  }));

  console.log('Report mapping test results:', results);
  return results.every(result => result.passed);
};

// Test the request builder
export const testRequestBuilder = () => {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const dateRange = { from: lastWeek, to: now };
  const request = buildReportRequest(
    'daily-sales',
    dateRange,
    'pdf',
    ['Revenue', 'Orders Count'],
    'branch-123'
  );

  const expectedStructure = {
    startDate: expect.any(String),
    endDate: expect.any(String),
    format: 'pdf',
    branchId: 'branch-123',
    includeCharts: true,
    includeDetails: true,
    period: 'daily'
  };

  console.log('Built request:', request);
  
  // Basic validation
  const isValid = 
    request.format === 'pdf' &&
    request.branchId === 'branch-123' &&
    request.includeCharts === true &&
    request.includeDetails === true &&
    request.period === 'daily' &&
    typeof request.startDate === 'string' &&
    typeof request.endDate === 'string';

  console.log('Request builder test passed:', isValid);
  return isValid;
};

// Run all tests
export const runReportTests = () => {
  console.log('Running report integration tests...');
  
  const mappingPassed = testReportMapping();
  const builderPassed = testRequestBuilder();
  
  const allPassed = mappingPassed && builderPassed;
  
  console.log('All tests passed:', allPassed);
  return allPassed;
};
/**
 * Performance and Load Testing for Report System
 * 
 * Tests system performance under various load conditions
 * Run with: node tests/performance/performance.test.js
 */

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN;
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

class PerformanceTester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = TEST_TOKEN;
    this.results = [];
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      memoryUsage: [],
      concurrency: []
    };
  }

  async makeRequest(endpoint, options = {}) {
    const startTime = performance.now();
    
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    let response, data, error;
    try {
      response = await fetch(url, { ...defaultOptions, ...options });
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Invalid JSON response' };
      }
    } catch (e) {
      error = e;
      response = { status: 0, ok: false };
      data = { error: e.message };
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      status: response.status,
      ok: response.ok,
      data,
      duration,
      error,
      timestamp: Date.now()
    };
  }

  async performanceTest(name, testFn, iterations = 5) {
    console.log(`\n⚡ Performance Test: ${name}`);
    console.log(`   Running ${iterations} iterations...`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      console.log(`   Iteration ${i + 1}/${iterations}...`);
      
      try {
        const result = await testFn(i);
        results.push(result);
        
        if (result.duration) {
          this.metrics.responseTime.push(result.duration);
        }
        
        // Brief delay between iterations
        await this.delay(500);
        
      } catch (error) {
        console.error(`   Iteration ${i + 1} failed:`, error.message);
        results.push({ error: error.message, duration: 0 });
      }
    }

    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => !r.error).length;
    const failed = results.length - successful;
    const avgDuration = results
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / Math.max(successful, 1);
    const throughput = (successful / totalTime) * 1000; // requests per second

    const summary = {
      name,
      iterations,
      successful,
      failed,
      errorRate: (failed / iterations) * 100,
      avgResponseTime: avgDuration,
      minResponseTime: Math.min(...results.filter(r => r.duration > 0).map(r => r.duration)),
      maxResponseTime: Math.max(...results.filter(r => r.duration > 0).map(r => r.duration)),
      throughput,
      totalTime
    };

    console.log(`   ✅ Completed: ${successful}/${iterations} successful`);
    console.log(`   📊 Avg Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   🚀 Throughput: ${throughput.toFixed(2)} req/sec`);

    this.results.push(summary);
    return summary;
  }

  async loadTest(name, testFn, concurrency = 5, duration = 30000) {
    console.log(`\n🏋️ Load Test: ${name}`);
    console.log(`   Concurrency: ${concurrency}, Duration: ${duration}ms`);

    const workers = [];
    const results = [];
    const startTime = Date.now();
    let running = true;

    // Stop the test after specified duration
    setTimeout(() => { running = false; }, duration);

    // Create worker promises
    for (let i = 0; i < concurrency; i++) {
      workers.push(this.loadWorker(i, testFn, results, () => running));
    }

    // Wait for all workers to complete
    await Promise.allSettled(workers);

    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.ok).length;
    const failed = results.length - successful;
    const avgResponseTime = results
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / Math.max(successful, 1);
    const throughput = (successful / totalTime) * 1000;

    const summary = {
      name,
      type: 'load',
      concurrency,
      duration: totalTime,
      totalRequests: results.length,
      successful,
      failed,
      errorRate: (failed / results.length) * 100,
      avgResponseTime,
      throughput,
      requestsPerSecond: results.length / (totalTime / 1000)
    };

    console.log(`   ✅ Completed: ${successful}/${results.length} successful`);
    console.log(`   📊 Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   🚀 Throughput: ${throughput.toFixed(2)} req/sec`);
    console.log(`   ⚠️ Error Rate: ${summary.errorRate.toFixed(2)}%`);

    this.results.push(summary);
    return summary;
  }

  async loadWorker(workerId, testFn, results, isRunning) {
    while (isRunning()) {
      try {
        const result = await testFn(workerId);
        results.push(result);
        
        // Small delay to prevent overwhelming the server
        await this.delay(Math.random() * 100 + 50);
        
      } catch (error) {
        results.push({ 
          ok: false, 
          error: error.message, 
          duration: 0,
          workerId 
        });
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
    console.log('⚡ PERFORMANCE TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Overall metrics
    const allResponseTimes = this.metrics.responseTime;
    const avgResponseTime = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
    const p95ResponseTime = this.calculatePercentile(allResponseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(allResponseTimes, 99);

    console.log(`📊 OVERALL METRICS:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Average Response Time: ${avgResponseTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`   95th Percentile: ${p95ResponseTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`   99th Percentile: ${p99ResponseTime?.toFixed(2) || 'N/A'}ms`);

    console.log(`\n📈 INDIVIDUAL TEST RESULTS:`);
    this.results.forEach(result => {
      const passedSymbol = result.errorRate < 5 ? '✅' : result.errorRate < 20 ? '⚠️' : '❌';
      console.log(`   ${passedSymbol} ${result.name}`);
      console.log(`      Response Time: ${result.avgResponseTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`      Error Rate: ${result.errorRate?.toFixed(2) || 'N/A'}%`);
      console.log(`      Throughput: ${result.throughput?.toFixed(2) || 'N/A'} req/sec`);
    });

    // Performance benchmarks
    console.log(`\n🎯 PERFORMANCE BENCHMARKS:`);
    const benchmarks = this.evaluatePerformance();
    Object.entries(benchmarks).forEach(([metric, result]) => {
      const symbol = result.passed ? '✅' : '⚠️';
      console.log(`   ${symbol} ${metric}: ${result.message}`);
    });

    // Save detailed results
    const resultsFile = path.join(__dirname, '../../test-results/performance-results.json');
    fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
    fs.writeFileSync(resultsFile, JSON.stringify({
      summary: {
        totalTests: this.results.length,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        benchmarks
      },
      timestamp: new Date().toISOString(),
      individualResults: this.results,
      rawMetrics: this.metrics
    }, null, 2));

    console.log(`\nDetailed results saved to: ${resultsFile}`);
  }

  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  evaluatePerformance() {
    const avgResponseTime = this.metrics.responseTime.reduce((sum, time) => sum + time, 0) / this.metrics.responseTime.length;
    const p95ResponseTime = this.calculatePercentile(this.metrics.responseTime, 95);
    const avgErrorRate = this.results.reduce((sum, r) => sum + (r.errorRate || 0), 0) / this.results.length;

    return {
      'Response Time (Average)': {
        passed: avgResponseTime < 5000, // Under 5 seconds
        message: `${avgResponseTime?.toFixed(2) || 'N/A'}ms (target: <5000ms)`
      },
      'Response Time (95th Percentile)': {
        passed: p95ResponseTime < 10000, // Under 10 seconds
        message: `${p95ResponseTime?.toFixed(2) || 'N/A'}ms (target: <10000ms)`
      },
      'Error Rate': {
        passed: avgErrorRate < 5, // Under 5%
        message: `${avgErrorRate?.toFixed(2) || 'N/A'}% (target: <5%)`
      },
      'System Stability': {
        passed: this.results.every(r => r.successful > 0),
        message: this.results.every(r => r.successful > 0) ? 'All tests had successful requests' : 'Some tests failed completely'
      }
    };
  }
}

async function runPerformanceTests() {
  const tester = new PerformanceTester();

  if (!tester.token) {
    console.error('❌ TEST_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Starting Performance and Load Tests');
  console.log(`Base URL: ${API_BASE_URL}`);

  // Performance Test 1: Single Report Generation
  await tester.performanceTest('Single Report Generation', async (iteration) => {
    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(3), // Short period for speed
        format: 'pdf',
        includeCharts: false, // Faster generation
        includeDetails: true
      })
    });

    return {
      success: response.ok,
      duration: response.duration,
      status: response.status,
      iteration
    };
  }, 10);

  // Performance Test 2: Different Report Types
  await tester.performanceTest('Different Report Types Performance', async (iteration) => {
    const reportTypes = ['sales', 'menu-performance', 'customer-analytics'];
    const reportType = reportTypes[iteration % reportTypes.length];

    const response = await tester.makeRequest(`/reports/${reportType}`, {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(7),
        format: 'pdf',
        includeCharts: false
      })
    });

    return {
      success: response.ok,
      duration: response.duration,
      status: response.status,
      reportType,
      iteration
    };
  }, 12);

  // Performance Test 3: Different Formats
  await tester.performanceTest('Format Generation Performance', async (iteration) => {
    const formats = ['pdf', 'excel'];
    const format = formats[iteration % formats.length];

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(5),
        format,
        includeCharts: format === 'pdf', // Only charts in PDF
        includeDetails: true
      })
    });

    return {
      success: response.ok,
      duration: response.duration,
      status: response.status,
      format,
      iteration
    };
  }, 8);

  // Performance Test 4: Large Date Ranges
  await tester.performanceTest('Large Date Range Performance', async (iteration) => {
    const dateRanges = [7, 30, 90, 365]; // Days
    const days = dateRanges[iteration % dateRanges.length];

    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(days),
        format: 'pdf',
        includeCharts: false,
        includeDetails: false // Minimal details for large ranges
      })
    });

    return {
      success: response.ok,
      duration: response.duration,
      status: response.status,
      dateRangeDays: days,
      iteration
    };
  }, 8);

  // Load Test 1: Low Concurrency
  await tester.loadTest('Low Concurrency Load', async (workerId) => {
    return await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(3),
        format: 'pdf',
        includeCharts: false
      })
    });
  }, 3, 20000); // 3 concurrent users for 20 seconds

  // Load Test 2: Medium Concurrency
  await tester.loadTest('Medium Concurrency Load', async (workerId) => {
    return await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(1), // Very short period
        format: 'pdf',
        includeCharts: false
      })
    });
  }, 5, 30000); // 5 concurrent users for 30 seconds

  // Load Test 3: High Concurrency
  await tester.loadTest('High Concurrency Load', async (workerId) => {
    return await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(1),
        format: 'pdf',
        includeCharts: false,
        includeDetails: false
      })
    });
  }, 10, 25000); // 10 concurrent users for 25 seconds

  // Load Test 4: API Endpoints
  await tester.loadTest('API Endpoints Load', async (workerId) => {
    const endpoints = ['/reports/types', '/reports/branches'];
    const endpoint = endpoints[workerId % endpoints.length];
    
    return await tester.makeRequest(endpoint);
  }, 8, 15000); // 8 concurrent users for 15 seconds

  // Load Test 5: Mixed Operations
  await tester.loadTest('Mixed Operations Load', async (workerId) => {
    const operations = [
      // Get report types (fast)
      () => tester.makeRequest('/reports/types'),
      
      // Get branches (fast)
      () => tester.makeRequest('/reports/branches'),
      
      // Generate small report (medium)
      () => tester.makeRequest('/reports/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(1),
          format: 'pdf',
          includeCharts: false,
          includeDetails: false
        })
      })
    ];

    const operation = operations[workerId % operations.length];
    return await operation();
  }, 6, 30000); // 6 concurrent users for 30 seconds

  // Stress Test: Peak Load Simulation
  console.log('\n🔥 Stress Test: Peak Load Simulation');
  console.log('   This test simulates peak usage with burst requests');
  
  const stressResults = [];
  
  // Burst 1: Sudden spike
  console.log('   Burst 1: Sudden spike (15 concurrent requests)');
  const burst1Promises = [];
  for (let i = 0; i < 15; i++) {
    burst1Promises.push(
      tester.makeRequest('/reports/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...tester.getTestDateRange(1),
          format: 'pdf',
          includeCharts: false
        })
      })
    );
  }
  
  const burst1Results = await Promise.allSettled(burst1Promises);
  const burst1Success = burst1Results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  stressResults.push({ name: 'Burst 1', total: 15, successful: burst1Success });
  
  await tester.delay(5000); // Cool down
  
  // Burst 2: Sustained load
  console.log('   Burst 2: Sustained load (10 requests over 10 seconds)');
  const burst2Results = [];
  for (let i = 0; i < 10; i++) {
    const result = await tester.makeRequest('/reports/menu-performance', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(2),
        format: 'excel'
      })
    });
    burst2Results.push(result);
    await tester.delay(1000);
  }
  
  const burst2Success = burst2Results.filter(r => r.ok).length;
  stressResults.push({ name: 'Burst 2', total: 10, successful: burst2Success });

  console.log(`   🔥 Stress Test Results:`);
  stressResults.forEach(result => {
    const successRate = (result.successful / result.total) * 100;
    const symbol = successRate >= 80 ? '✅' : successRate >= 60 ? '⚠️' : '❌';
    console.log(`      ${symbol} ${result.name}: ${result.successful}/${result.total} (${successRate.toFixed(1)}%)`);
  });

  // Memory and Resource Test
  console.log('\n💾 Memory and Resource Test');
  console.log('   Testing resource usage with multiple large reports');
  
  const resourceTestStart = Date.now();
  const largeReports = [];
  
  for (let i = 0; i < 5; i++) {
    console.log(`   Generating large report ${i + 1}/5...`);
    
    const result = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...tester.getTestDateRange(180), // 6 months
        format: 'pdf',
        includeCharts: true, // More resource intensive
        includeDetails: true
      })
    });
    
    largeReports.push({
      success: result.ok,
      duration: result.duration,
      status: result.status,
      reportNumber: i + 1
    });
    
    // Brief pause between large reports
    await tester.delay(3000);
  }
  
  const resourceTestDuration = Date.now() - resourceTestStart;
  const resourceSuccessful = largeReports.filter(r => r.success).length;
  const avgResourceDuration = largeReports
    .filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / resourceSuccessful;

  console.log(`   💾 Resource Test Results:`);
  console.log(`      Successful: ${resourceSuccessful}/5`);
  console.log(`      Average Duration: ${avgResourceDuration?.toFixed(2) || 'N/A'}ms`);
  console.log(`      Total Test Time: ${resourceTestDuration}ms`);

  // Generate final performance report
  tester.generateReport();

  const overallSuccess = tester.results.every(r => (r.errorRate || 0) < 20);
  
  return {
    success: overallSuccess,
    totalTests: tester.results.length,
    results: tester.results
  };
}

// Run tests if called directly
if (require.main === module) {
  runPerformanceTests().then(results => {
    console.log(`\n🎯 Performance Testing Complete: ${results.success ? 'PASSED' : 'NEEDS ATTENTION'}`);
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('Performance test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTests };
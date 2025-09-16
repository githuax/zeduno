/**
 * Comprehensive Test Runner for Report System
 * 
 * Runs all test suites and generates consolidated report
 * Run with: node tests/run-all-tests.js
 */

const path = require('path');
const fs = require('fs');

// Import all test suites
const { runReportAPITests } = require('./api/report.api.test.js');
const { runEmailDeliveryTests } = require('./email/email.delivery.test.js');
const { runHandlebarsTemplateTests } = require('./templates/handlebars.template.test.js');
const { runScheduledReportsTests } = require('./scheduled/scheduled.reports.test.js');
const { runE2EReportTests } = require('./e2e/reports.e2e.test.js');
const { runPerformanceTests } = require('./performance/performance.test.js');
const { runSecurityTests } = require('./security/security.test.js');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      suites: [],
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalDuration: 0,
        vulnerabilities: 0,
        securityScore: 100
      },
      startTime: Date.now(),
      endTime: null
    };

    this.testSuites = [
      {
        name: 'API Tests',
        description: 'Tests all report generation API endpoints',
        runner: runReportAPITests,
        enabled: true,
        timeout: 300000 // 5 minutes
      },
      {
        name: 'Template Tests',
        description: 'Tests Handlebars templates with various data scenarios',
        runner: runHandlebarsTemplateTests,
        enabled: true,
        timeout: 180000 // 3 minutes
      },
      {
        name: 'Email Delivery Tests',
        description: 'Tests email templates and delivery functionality',
        runner: runEmailDeliveryTests,
        enabled: true,
        timeout: 240000 // 4 minutes
      },
      {
        name: 'Scheduled Reports Tests',
        description: 'Tests scheduled report creation and queue functionality',
        runner: runScheduledReportsTests,
        enabled: true,
        timeout: 300000 // 5 minutes
      },
      {
        name: 'End-to-End Tests',
        description: 'Tests complete workflows from frontend to backend',
        runner: runE2EReportTests,
        enabled: true,
        timeout: 600000 // 10 minutes
      },
      {
        name: 'Performance Tests',
        description: 'Tests system performance under various load conditions',
        runner: runPerformanceTests,
        enabled: process.env.RUN_PERFORMANCE_TESTS !== 'false',
        timeout: 900000 // 15 minutes
      },
      {
        name: 'Security Tests',
        description: 'Tests security vulnerabilities and access controls',
        runner: runSecurityTests,
        enabled: true,
        timeout: 300000 // 5 minutes
      }
    ];
  }

  async runTestSuite(suite) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 RUNNING TEST SUITE: ${suite.name.toUpperCase()}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`⏰ Timeout: ${(suite.timeout / 1000).toFixed(0)}s`);
    console.log(`${'='.repeat(80)}`);

    const startTime = Date.now();
    let result;

    try {
      // Run test suite with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test suite timeout')), suite.timeout)
      );

      result = await Promise.race([
        suite.runner(),
        timeoutPromise
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const suiteResult = {
        name: suite.name,
        description: suite.description,
        passed: (result.failed || 0) === 0,
        totalTests: result.total || (result.passed + result.failed),
        passedTests: result.passed || 0,
        failedTests: result.failed || 0,
        duration,
        vulnerabilities: result.vulnerabilities || 0,
        securityScore: result.securityScore || null,
        details: result,
        error: null
      };

      console.log(`\n✅ ${suite.name} completed in ${duration}ms`);
      console.log(`   Tests: ${suiteResult.passedTests}/${suiteResult.totalTests} passed`);
      
      if (suiteResult.vulnerabilities > 0) {
        console.log(`   Security: ${suiteResult.vulnerabilities} vulnerabilities found`);
      }

      return suiteResult;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`\n❌ ${suite.name} failed: ${error.message}`);

      return {
        name: suite.name,
        description: suite.description,
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        duration,
        vulnerabilities: 0,
        securityScore: null,
        details: null,
        error: error.message
      };
    }
  }

  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE REPORT SYSTEM TESTING');
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🎯 Running ${this.testSuites.filter(s => s.enabled).length} test suites`);

    // Environment checks
    if (!process.env.TEST_TOKEN) {
      console.error('❌ TEST_TOKEN environment variable is required');
      console.error('   Please set a valid JWT token for testing');
      process.exit(1);
    }

    console.log(`🌐 API Base URL: ${process.env.API_BASE_URL || 'http://localhost:3001/api'}`);
    console.log(`📧 Test Email: ${process.env.TEST_EMAIL || 'test@example.com'}`);

    // Run each enabled test suite
    for (const suite of this.testSuites) {
      if (!suite.enabled) {
        console.log(`\n⏭️ Skipping ${suite.name} (disabled)`);
        continue;
      }

      const result = await this.runTestSuite(suite);
      this.results.suites.push(result);

      // Update summary statistics
      this.results.summary.totalSuites++;
      this.results.summary.totalTests += result.totalTests;
      this.results.summary.totalPassed += result.passedTests;
      this.results.summary.totalFailed += result.failedTests;
      this.results.summary.totalDuration += result.duration;
      this.results.summary.vulnerabilities += result.vulnerabilities;

      if (result.passed) {
        this.results.summary.passedSuites++;
      } else {
        this.results.summary.failedSuites++;
      }

      // Brief pause between test suites
      await this.delay(2000);
    }

    this.results.endTime = Date.now();
    this.generateFinalReport();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateFinalReport() {
    const totalDuration = this.results.endTime - this.results.startTime;
    const summary = this.results.summary;

    console.log('\n' + '='.repeat(100));
    console.log('🏆 COMPREHENSIVE REPORT SYSTEM TEST RESULTS');
    console.log('='.repeat(100));

    console.log(`📊 OVERALL SUMMARY:`);
    console.log(`   Total Test Suites: ${summary.totalSuites}`);
    console.log(`   Passed Suites: ${summary.passedSuites} ✅`);
    console.log(`   Failed Suites: ${summary.failedSuites} ${summary.failedSuites > 0 ? '❌' : ''}`);
    console.log(`   Suite Success Rate: ${((summary.passedSuites / summary.totalSuites) * 100).toFixed(1)}%`);
    console.log(`   \n   Total Individual Tests: ${summary.totalTests}`);
    console.log(`   Passed Tests: ${summary.totalPassed} ✅`);
    console.log(`   Failed Tests: ${summary.totalFailed} ${summary.totalFailed > 0 ? '❌' : ''}`);
    console.log(`   Test Success Rate: ${summary.totalTests > 0 ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : 0}%`);

    console.log(`\n⏱️ TIMING:`);
    console.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   Average Suite Duration: ${(summary.totalDuration / summary.totalSuites / 1000).toFixed(2)}s`);

    // Security summary
    if (summary.vulnerabilities > 0) {
      console.log(`\n🔒 SECURITY:`);
      console.log(`   Vulnerabilities Found: ${summary.vulnerabilities} 🚨`);
      
      const securitySuites = this.results.suites.filter(s => s.securityScore !== null);
      if (securitySuites.length > 0) {
        const avgSecurityScore = securitySuites.reduce((sum, s) => sum + s.securityScore, 0) / securitySuites.length;
        console.log(`   Security Score: ${avgSecurityScore.toFixed(1)}/100`);
      }
    } else {
      console.log(`\n🔒 SECURITY: ✅ No vulnerabilities detected`);
    }

    // Individual suite results
    console.log(`\n📋 SUITE RESULTS:`);
    this.results.suites.forEach(suite => {
      const status = suite.passed ? '✅' : '❌';
      const duration = (suite.duration / 1000).toFixed(2);
      const successRate = suite.totalTests > 0 ? 
        `(${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%)` : '';
      
      console.log(`   ${status} ${suite.name}: ${suite.passedTests}/${suite.totalTests} ${successRate} - ${duration}s`);
      
      if (suite.error) {
        console.log(`      Error: ${suite.error}`);
      }
      
      if (suite.vulnerabilities > 0) {
        console.log(`      Security: ${suite.vulnerabilities} vulnerabilities`);
      }
    });

    // Recommendations
    console.log(`\n📝 RECOMMENDATIONS:`);
    const failedSuites = this.results.suites.filter(s => !s.passed);
    
    if (failedSuites.length === 0) {
      console.log(`   🎉 All test suites passed! The report system is production-ready.`);
    } else {
      console.log(`   🔧 Address failing test suites before production deployment:`);
      failedSuites.forEach(suite => {
        console.log(`      • ${suite.name}: ${suite.failedTests} failing tests`);
      });
    }

    if (summary.vulnerabilities > 0) {
      console.log(`   🛡️ Resolve ${summary.vulnerabilities} security vulnerabilities before production`);
    }

    // Production readiness assessment
    console.log(`\n🚀 PRODUCTION READINESS:`);
    const isProductionReady = this.assessProductionReadiness();
    console.log(`   Status: ${isProductionReady.ready ? '✅ READY' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`   Score: ${isProductionReady.score}/100`);
    
    if (!isProductionReady.ready) {
      console.log(`   Issues to resolve:`);
      isProductionReady.issues.forEach(issue => {
        console.log(`      • ${issue}`);
      });
    }

    // Save comprehensive results
    this.saveResults();

    console.log(`\n📁 Detailed results saved to: ./test-results/comprehensive-test-results.json`);
    console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(100));
  }

  assessProductionReadiness() {
    const issues = [];
    let score = 100;

    // Critical failures
    const criticalSuites = ['API Tests', 'Security Tests', 'Template Tests'];
    const failedCritical = this.results.suites.filter(s => 
      criticalSuites.includes(s.name) && !s.passed
    );
    
    if (failedCritical.length > 0) {
      issues.push(`${failedCritical.length} critical test suite(s) failing`);
      score -= failedCritical.length * 25;
    }

    // Security vulnerabilities
    if (this.results.summary.vulnerabilities > 0) {
      issues.push(`${this.results.summary.vulnerabilities} security vulnerabilities`);
      score -= Math.min(this.results.summary.vulnerabilities * 5, 30);
    }

    // Performance issues
    const performanceSuite = this.results.suites.find(s => s.name === 'Performance Tests');
    if (performanceSuite && !performanceSuite.passed) {
      issues.push('Performance tests failing');
      score -= 15;
    }

    // Overall test failure rate
    const failureRate = this.results.summary.totalFailed / this.results.summary.totalTests;
    if (failureRate > 0.1) { // More than 10% failure rate
      issues.push(`High test failure rate: ${(failureRate * 100).toFixed(1)}%`);
      score -= Math.min((failureRate - 0.1) * 100, 20);
    }

    return {
      ready: score >= 80 && issues.length === 0,
      score: Math.max(0, score),
      issues
    };
  }

  saveResults() {
    const resultsDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save comprehensive results
    const resultsFile = path.join(resultsDir, 'comprehensive-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      ...this.results,
      productionReadiness: this.assessProductionReadiness(),
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        testRunner: 'comprehensive-test-runner',
        version: '1.0.0'
      }
    }, null, 2));

    // Generate HTML report
    this.generateHTMLReport(resultsDir);

    // Generate summary report
    this.generateSummaryReport(resultsDir);
  }

  generateHTMLReport(resultsDir) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Report System Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .stats { display: flex; gap: 20px; margin: 10px 0; }
        .stat { background: #f9f9f9; padding: 10px; border-radius: 4px; flex: 1; }
        .vulnerabilities { color: #f44336; font-weight: bold; }
        .security-score { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Report System Test Results</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="stats">
            <div class="stat">
                <strong>Total Suites:</strong> ${this.results.summary.totalSuites}
            </div>
            <div class="stat">
                <strong>Passed:</strong> ${this.results.summary.passedSuites} ✅
            </div>
            <div class="stat">
                <strong>Failed:</strong> ${this.results.summary.failedSuites} ${this.results.summary.failedSuites > 0 ? '❌' : ''}
            </div>
            <div class="stat">
                <strong>Success Rate:</strong> ${((this.results.summary.passedSuites / this.results.summary.totalSuites) * 100).toFixed(1)}%
            </div>
        </div>
    </div>

    ${this.results.suites.map(suite => `
        <div class="suite ${suite.passed ? 'passed' : 'failed'}">
            <h3>${suite.passed ? '✅' : '❌'} ${suite.name}</h3>
            <p>${suite.description}</p>
            <div class="stats">
                <div class="stat">
                    <strong>Tests:</strong> ${suite.passedTests}/${suite.totalTests}
                </div>
                <div class="stat">
                    <strong>Duration:</strong> ${(suite.duration / 1000).toFixed(2)}s
                </div>
                ${suite.vulnerabilities > 0 ? `
                <div class="stat vulnerabilities">
                    <strong>Vulnerabilities:</strong> ${suite.vulnerabilities}
                </div>
                ` : ''}
                ${suite.securityScore !== null ? `
                <div class="stat security-score">
                    <strong>Security Score:</strong> ${suite.securityScore}/100
                </div>
                ` : ''}
            </div>
            ${suite.error ? `<p><strong>Error:</strong> ${suite.error}</p>` : ''}
        </div>
    `).join('')}

    <div class="suite">
        <h3>🚀 Production Readiness</h3>
        ${(() => {
          const readiness = this.assessProductionReadiness();
          return `
            <p><strong>Status:</strong> ${readiness.ready ? '✅ READY' : '⚠️ NEEDS ATTENTION'}</p>
            <p><strong>Score:</strong> ${readiness.score}/100</p>
            ${readiness.issues.length > 0 ? `
              <p><strong>Issues to resolve:</strong></p>
              <ul>
                ${readiness.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            ` : ''}
          `;
        })()}
    </div>
</body>
</html>
    `;

    fs.writeFileSync(path.join(resultsDir, 'test-report.html'), htmlContent);
  }

  generateSummaryReport(resultsDir) {
    const readiness = this.assessProductionReadiness();
    
    const summary = `# Report System Test Summary

## Overall Results
- **Total Test Suites:** ${this.results.summary.totalSuites}
- **Passed Suites:** ${this.results.summary.passedSuites} ✅
- **Failed Suites:** ${this.results.summary.failedSuites} ${this.results.summary.failedSuites > 0 ? '❌' : ''}
- **Suite Success Rate:** ${((this.results.summary.passedSuites / this.results.summary.totalSuites) * 100).toFixed(1)}%

## Individual Tests
- **Total Tests:** ${this.results.summary.totalTests}
- **Passed Tests:** ${this.results.summary.totalPassed} ✅
- **Failed Tests:** ${this.results.summary.totalFailed} ${this.results.summary.totalFailed > 0 ? '❌' : ''}
- **Test Success Rate:** ${this.results.summary.totalTests > 0 ? ((this.results.summary.totalPassed / this.results.summary.totalTests) * 100).toFixed(1) : 0}%

## Security
${this.results.summary.vulnerabilities > 0 ? `
- **Vulnerabilities Found:** ${this.results.summary.vulnerabilities} 🚨
` : '- **Security Status:** ✅ No vulnerabilities detected'}

## Performance
- **Total Duration:** ${((this.results.endTime - this.results.startTime) / 1000).toFixed(2)}s
- **Average Suite Duration:** ${(this.results.summary.totalDuration / this.results.summary.totalSuites / 1000).toFixed(2)}s

## Production Readiness
- **Status:** ${readiness.ready ? '✅ READY' : '⚠️ NEEDS ATTENTION'}
- **Score:** ${readiness.score}/100

${readiness.issues.length > 0 ? `
### Issues to Resolve:
${readiness.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Test Suite Details
${this.results.suites.map(suite => `
### ${suite.name}
- **Status:** ${suite.passed ? '✅ PASSED' : '❌ FAILED'}
- **Tests:** ${suite.passedTests}/${suite.totalTests}
- **Duration:** ${(suite.duration / 1000).toFixed(2)}s
${suite.vulnerabilities > 0 ? `- **Vulnerabilities:** ${suite.vulnerabilities}\n` : ''}${suite.error ? `- **Error:** ${suite.error}\n` : ''}
`).join('')}

---
Generated: ${new Date().toLocaleString()}
`;

    fs.writeFileSync(path.join(resultsDir, 'test-summary.md'), summary);
  }
}

// Run all tests if called directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  
  runner.runAllTests().then(() => {
    const readiness = runner.assessProductionReadiness();
    process.exit(readiness.ready ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { ComprehensiveTestRunner };
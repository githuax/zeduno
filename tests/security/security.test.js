/**
 * Security and Error Handling Tests for Report System
 * 
 * Tests security vulnerabilities, access controls, and error scenarios
 * Run with: node tests/security/security.test.js
 */

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN;
const INVALID_TOKEN = 'invalid.jwt.token.here';
const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

class SecurityTester {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = TEST_TOKEN;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.vulnerabilities = [];
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, options);
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
      console.log(`\n🔒 Testing: ${name}`);
      const result = await testFn();
      
      if (result.passed) {
        console.log(`✅ PASSED: ${name}`);
        this.passed++;
      } else {
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Reason: ${result.message}`);
        this.failed++;
        
        if (result.isVulnerability) {
          this.vulnerabilities.push({
            name,
            severity: result.severity || 'medium',
            description: result.message,
            recommendation: result.recommendation
          });
        }
      }

      this.results.push({
        name,
        passed: result.passed,
        message: result.message,
        severity: result.severity,
        isVulnerability: result.isVulnerability || false,
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
    console.log('🔒 SECURITY TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 SECURITY VULNERABILITIES FOUND:');
      this.vulnerabilities.forEach(vuln => {
        const severityColor = {
          low: '🟡',
          medium: '🟠', 
          high: '🔴',
          critical: '⚫'
        }[vuln.severity] || '🟠';
        
        console.log(`   ${severityColor} ${vuln.severity.toUpperCase()}: ${vuln.name}`);
        console.log(`      Description: ${vuln.description}`);
        if (vuln.recommendation) {
          console.log(`      Recommendation: ${vuln.recommendation}`);
        }
      });
    } else {
      console.log('\n✅ No security vulnerabilities detected');
    }

    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed && !r.isVulnerability).forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
    }

    // Save detailed results
    const resultsFile = path.join(__dirname, '../../test-results/security-test-results.json');
    fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
    fs.writeFileSync(resultsFile, JSON.stringify({
      summary: {
        total: this.passed + this.failed,
        passed: this.passed,
        failed: this.failed,
        successRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(1),
        vulnerabilities: this.vulnerabilities.length
      },
      vulnerabilities: this.vulnerabilities,
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));

    console.log(`\nDetailed results saved to: ${resultsFile}`);
  }
}

async function runSecurityTests() {
  const tester = new SecurityTester();

  if (!tester.token) {
    console.error('❌ TEST_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Starting Security and Error Handling Tests');
  console.log(`Base URL: ${API_BASE_URL}`);

  // Test 1: Authentication - No Token
  await tester.test('Authentication: No Token Provided', async () => {
    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'pdf'
      })
    });

    if (response.status === 401) {
      return { passed: true, message: 'Correctly rejected request without authentication token' };
    } else {
      return { 
        passed: false, 
        message: `Should return 401 but got ${response.status}`,
        isVulnerability: true,
        severity: 'high',
        recommendation: 'Implement proper authentication middleware'
      };
    }
  });

  // Test 2: Authentication - Invalid Token
  await tester.test('Authentication: Invalid Token', async () => {
    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INVALID_TOKEN}`
      },
      body: JSON.stringify({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'pdf'
      })
    });

    if (response.status === 401) {
      return { passed: true, message: 'Correctly rejected invalid authentication token' };
    } else {
      return { 
        passed: false, 
        message: `Should return 401 but got ${response.status}`,
        isVulnerability: true,
        severity: 'high',
        recommendation: 'Validate JWT tokens properly'
      };
    }
  });

  // Test 3: Authorization - Role-Based Access Control (Financial Reports)
  await tester.test('Authorization: Financial Report Access Control', async () => {
    const response = await tester.makeRequest('/reports/financial-summary', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tester.token}`
      },
      body: JSON.stringify({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'pdf'
      })
    });

    // Financial reports should either succeed (if user has proper role) or be blocked (403)
    if (response.status === 403) {
      return { passed: true, message: 'Correctly blocked non-admin user from financial reports' };
    } else if (response.ok) {
      return { passed: true, message: 'User has proper role for financial reports' };
    } else {
      return { 
        passed: false, 
        message: `Unexpected response: ${response.status}`,
        details: response.data
      };
    }
  });

  // Test 4: SQL Injection - Report Filters
  await tester.test('SQL Injection: Report Filter Parameters', async () => {
    const maliciousPayloads = [
      "'; DROP TABLE orders; --",
      "1' OR '1'='1",
      "admin'; UPDATE users SET role='admin' WHERE id=1; --",
      "1' UNION SELECT * FROM users WHERE '1'='1"
    ];

    for (const payload of maliciousPayloads) {
      const response = await tester.makeRequest('/reports/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tester.token}`
        },
        body: JSON.stringify({
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.000Z',
          format: 'pdf',
          branchId: payload // Inject SQL in branchId
        })
      });

      // Should either return validation error or sanitize input
      if (response.status === 200 && response.data.success) {
        return { 
          passed: false, 
          message: `SQL injection payload accepted: ${payload}`,
          isVulnerability: true,
          severity: 'critical',
          recommendation: 'Implement input sanitization and parameterized queries'
        };
      }
    }

    return { passed: true, message: 'SQL injection payloads properly rejected/sanitized' };
  });

  // Test 5: XSS - Template Injection
  await tester.test('XSS: Template Data Injection', async () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(1)">',
      '{{constructor.constructor("alert(1)")()}}'
    ];

    // Test via email subject and message fields
    for (const payload of xssPayloads) {
      const response = await tester.makeRequest('/reports/email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tester.token}`
        },
        body: JSON.stringify({
          reportType: 'sales',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.000Z',
          format: 'pdf',
          recipients: ['test@example.com'],
          subject: payload,
          message: `Test message with payload: ${payload}`
        })
      });

      // Should either fail validation or sanitize the input
      if (response.status === 200 && response.data.success) {
        return { 
          passed: false, 
          message: `XSS payload accepted in email fields: ${payload}`,
          isVulnerability: true,
          severity: 'high',
          recommendation: 'Implement XSS protection and input sanitization'
        };
      }
    }

    return { passed: true, message: 'XSS payloads properly rejected/sanitized' };
  });

  // Test 6: Path Traversal - File Download
  await tester.test('Path Traversal: File Download Attack', async () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    for (const payload of pathTraversalPayloads) {
      const response = await tester.makeRequest(`/reports/download/${payload}`, {
        headers: { 'Authorization': `Bearer ${tester.token}` }
      });

      // Should return 400 (bad request) or 404 (not found), not 200
      if (response.status === 200) {
        return { 
          passed: false, 
          message: `Path traversal attack succeeded: ${payload}`,
          isVulnerability: true,
          severity: 'critical',
          recommendation: 'Implement proper file path validation and sanitization'
        };
      }
    }

    return { passed: true, message: 'Path traversal attacks properly blocked' };
  });

  // Test 7: Input Validation - Malformed Data
  await tester.test('Input Validation: Malformed Request Data', async () => {
    const malformedRequests = [
      // Invalid date formats
      {
        startDate: 'not-a-date',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'pdf'
      },
      // Invalid format
      {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'invalid-format'
      },
      // Extremely large values
      {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.000Z',
        format: 'pdf',
        includeCharts: 'A'.repeat(10000)
      }
    ];

    for (const request of malformedRequests) {
      const response = await tester.makeRequest('/reports/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tester.token}`
        },
        body: JSON.stringify(request)
      });

      // Should return validation error (400)
      if (response.status === 200) {
        return { 
          passed: false, 
          message: `Malformed request was accepted: ${JSON.stringify(request)}`,
          isVulnerability: true,
          severity: 'medium',
          recommendation: 'Implement comprehensive input validation'
        };
      }
    }

    return { passed: true, message: 'Malformed requests properly rejected' };
  });

  // Test 8: Rate Limiting
  await tester.test('Rate Limiting: Rapid Request Protection', async () => {
    const rapidRequests = [];
    
    // Send 20 requests in rapid succession
    for (let i = 0; i < 20; i++) {
      rapidRequests.push(
        tester.makeRequest('/reports/types', {
          headers: { 'Authorization': `Bearer ${tester.token}` }
        })
      );
    }

    const results = await Promise.allSettled(rapidRequests);
    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    ).length;
    const rateLimited = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    ).length;

    if (rateLimited > 0) {
      return { passed: true, message: `Rate limiting active: ${rateLimited}/${results.length} requests limited` };
    } else if (successful === results.length) {
      return { 
        passed: false, 
        message: `No rate limiting detected: all ${successful} requests succeeded`,
        isVulnerability: true,
        severity: 'medium',
        recommendation: 'Implement rate limiting to prevent DoS attacks'
      };
    } else {
      return { passed: true, message: 'Some form of request limiting detected' };
    }
  });

  // Test 9: IDOR - Insecure Direct Object Reference
  await tester.test('IDOR: Insecure Direct Object Reference', async () => {
    // Try to access reports with different tenant/user IDs
    const potentialIds = [
      '000000000000000000000001',
      '000000000000000000000002',
      '507f1f77bcf86cd799439011',
      'admin',
      '1',
      '../admin'
    ];

    for (const id of potentialIds) {
      const response = await tester.makeRequest(`/reports/schedules/${id}`, {
        headers: { 'Authorization': `Bearer ${tester.token}` }
      });

      // Should return 404 or 403, not 200 with data
      if (response.status === 200 && response.data.success) {
        return { 
          passed: false, 
          message: `Possible IDOR vulnerability: accessed resource with ID ${id}`,
          isVulnerability: true,
          severity: 'high',
          recommendation: 'Implement proper authorization checks for all resources'
        };
      }
    }

    return { passed: true, message: 'IDOR attacks properly blocked' };
  });

  // Test 10: Information Disclosure - Error Messages
  await tester.test('Information Disclosure: Verbose Error Messages', async () => {
    // Try to trigger detailed error messages
    const response = await tester.makeRequest('/reports/non-existent-endpoint', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tester.token}`
      },
      body: JSON.stringify({ malformed: true })
    });

    // Check if error message reveals sensitive information
    const errorMsg = JSON.stringify(response.data).toLowerCase();
    const sensitiveKeywords = [
      'database',
      'connection string',
      'password',
      'secret',
      'stack trace',
      'file path',
      'internal error'
    ];

    const foundKeywords = sensitiveKeywords.filter(keyword => 
      errorMsg.includes(keyword)
    );

    if (foundKeywords.length > 0) {
      return { 
        passed: false, 
        message: `Error message reveals sensitive information: ${foundKeywords.join(', ')}`,
        isVulnerability: true,
        severity: 'medium',
        recommendation: 'Sanitize error messages to hide sensitive system information'
      };
    } else {
      return { passed: true, message: 'Error messages do not reveal sensitive information' };
    }
  });

  // Test 11: CORS - Cross-Origin Resource Sharing
  await tester.test('CORS: Cross-Origin Request Policy', async () => {
    const response = await tester.makeRequest('/reports/types', {
      headers: { 
        'Authorization': `Bearer ${tester.token}`,
        'Origin': 'https://malicious-site.com'
      }
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader === '*') {
      return { 
        passed: false, 
        message: 'CORS policy allows all origins (*)',
        isVulnerability: true,
        severity: 'medium',
        recommendation: 'Restrict CORS to specific trusted origins'
      };
    } else {
      return { passed: true, message: 'CORS policy is restrictive' };
    }
  });

  // Test 12: Email Injection
  await tester.test('Email Injection: Header Injection Attack', async () => {
    const injectionPayloads = [
      'test@example.com\nBcc: attacker@evil.com',
      'test@example.com\r\nSubject: Injected Subject',
      'test@example.com%0ABcc:attacker@evil.com',
      'test@example.com\nContent-Type: text/html\n\n<script>alert(1)</script>'
    ];

    for (const payload of injectionPayloads) {
      const response = await tester.makeRequest('/reports/email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tester.token}`
        },
        body: JSON.stringify({
          reportType: 'sales',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.000Z',
          format: 'pdf',
          recipients: [payload]
        })
      });

      // Should reject malformed email addresses
      if (response.status === 200 && response.data.success) {
        return { 
          passed: false, 
          message: `Email injection payload accepted: ${payload}`,
          isVulnerability: true,
          severity: 'high',
          recommendation: 'Implement strict email address validation'
        };
      }
    }

    return { passed: true, message: 'Email injection payloads properly rejected' };
  });

  // Test 13: Resource Exhaustion - Large Payloads
  await tester.test('Resource Exhaustion: Large Payload Handling', async () => {
    const largePayload = {
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T23:59:59.000Z',
      format: 'pdf',
      recipients: Array(1000).fill('test@example.com'), // 1000 recipients
      subject: 'A'.repeat(10000), // Very long subject
      message: 'B'.repeat(50000)  // Very long message
    };

    const response = await tester.makeRequest('/reports/email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tester.token}`
      },
      body: JSON.stringify(largePayload)
    });

    // Should reject overly large payloads
    if (response.status === 200 && response.data.success) {
      return { 
        passed: false, 
        message: 'Large payload was accepted without limits',
        isVulnerability: true,
        severity: 'medium',
        recommendation: 'Implement payload size limits and validation'
      };
    } else {
      return { passed: true, message: 'Large payload properly rejected' };
    }
  });

  // Test 14: Insecure File Handling
  await tester.test('Insecure File Handling: Temporary File Security', async () => {
    // Generate a report and check file handling
    const response = await tester.makeRequest('/reports/sales', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tester.token}`
      },
      body: JSON.stringify({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-07T23:59:59.000Z',
        format: 'pdf',
        fileName: '../../../sensitive-file.pdf' // Path traversal attempt
      })
    });

    if (response.ok && response.data.data?.fileName) {
      const fileName = response.data.data.fileName;
      
      // Check if the filename contains path traversal elements
      if (fileName.includes('../') || fileName.includes('..\\')) {
        return { 
          passed: false, 
          message: 'File path traversal in generated filename',
          isVulnerability: true,
          severity: 'high',
          recommendation: 'Sanitize file names and use secure file handling'
        };
      }
    }

    return { passed: true, message: 'File handling appears secure' };
  });

  // Test 15: Business Logic Bypass
  await tester.test('Business Logic: Permission Bypass Attempts', async () => {
    // Try to create a scheduled report for a restricted report type using manipulated requests
    const bypassAttempts = [
      {
        name: 'Role Escalation via Report Type',
        data: {
          reportType: 'financial-summary',
          userRole: 'admin', // Attempting to set role in request
          schedule: { frequency: 'daily', time: '09:00' },
          emailConfig: { enabled: true, recipients: ['test@example.com'] }
        }
      },
      {
        name: 'Tenant ID Manipulation',
        data: {
          reportType: 'sales',
          tenantId: '000000000000000000000001', // Attempting to set tenant ID
          schedule: { frequency: 'daily', time: '09:00' },
          emailConfig: { enabled: true, recipients: ['test@example.com'] }
        }
      }
    ];

    for (const attempt of bypassAttempts) {
      const response = await tester.makeRequest('/reports/schedules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tester.token}`
        },
        body: JSON.stringify(attempt.data)
      });

      // Should not allow role/tenant manipulation
      if (response.status === 200 && response.data.success) {
        // Check if the created schedule actually uses the manipulated data
        if (response.data.schedule) {
          return { 
            passed: false, 
            message: `Business logic bypass successful: ${attempt.name}`,
            isVulnerability: true,
            severity: 'critical',
            recommendation: 'Implement server-side validation for all business logic'
          };
        }
      }
    }

    return { passed: true, message: 'Business logic bypass attempts properly blocked' };
  });

  // Generate final security report
  tester.generateReport();

  const hasVulnerabilities = tester.vulnerabilities.length > 0;
  const criticalVulns = tester.vulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = tester.vulnerabilities.filter(v => v.severity === 'high').length;

  console.log('\n🛡️ SECURITY ASSESSMENT SUMMARY:');
  if (hasVulnerabilities) {
    console.log(`   🚨 ${tester.vulnerabilities.length} vulnerabilities found`);
    console.log(`   ⚫ Critical: ${criticalVulns}`);
    console.log(`   🔴 High: ${highVulns}`);
    console.log(`   🟠 Medium: ${tester.vulnerabilities.filter(v => v.severity === 'medium').length}`);
    console.log(`   🟡 Low: ${tester.vulnerabilities.filter(v => v.severity === 'low').length}`);
  } else {
    console.log('   ✅ No vulnerabilities detected');
  }

  return {
    passed: tester.passed,
    failed: tester.failed,
    total: tester.passed + tester.failed,
    vulnerabilities: tester.vulnerabilities.length,
    criticalVulns,
    highVulns,
    securityScore: Math.max(0, 100 - (criticalVulns * 30 + highVulns * 15 + (tester.vulnerabilities.length - criticalVulns - highVulns) * 5))
  };
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests().then(results => {
    const isSecure = results.criticalVulns === 0 && results.highVulns < 2;
    console.log(`\n🛡️ Security Assessment: ${isSecure ? 'ACCEPTABLE' : 'NEEDS ATTENTION'}`);
    console.log(`Security Score: ${results.securityScore}/100`);
    
    process.exit(results.criticalVulns > 0 ? 2 : results.highVulns > 2 ? 1 : 0);
  }).catch(error => {
    console.error('Security test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };
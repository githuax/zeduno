# Report System Testing Documentation

## Overview

This comprehensive testing suite validates the entire report generation system including frontend components, API endpoints, email delivery, scheduled reports, templates, performance, and security. The system has been designed to ensure production readiness with thorough testing coverage.

## 🚀 Quick Start

### Prerequisites

1. **Environment Variables** (Required):
   ```bash
   export TEST_TOKEN="your-jwt-token-here"
   export API_BASE_URL="http://localhost:3001/api"  # Optional, defaults to localhost
   export TEST_EMAIL="your-test-email@example.com"  # Optional, defaults to test@example.com
   ```

2. **Dependencies**:
   ```bash
   npm install
   # Ensure backend server is running on the specified API_BASE_URL
   ```

### Running All Tests

```bash
# Run comprehensive test suite (recommended)
node tests/run-all-tests.js

# Run individual test suites
node tests/api/report.api.test.js
node tests/frontend/reports.integration.test.js
node tests/email/email.delivery.test.js
node tests/templates/handlebars.template.test.js
node tests/scheduled/scheduled.reports.test.js
node tests/e2e/reports.e2e.test.js
node tests/performance/performance.test.js
node tests/security/security.test.js
```

## 📋 Test Suites

### 1. API Tests (`tests/api/report.api.test.js`)
**Purpose**: Validates all report generation API endpoints
**Coverage**:
- ✅ All 6 report types (sales, menu-performance, customer-analytics, financial-summary, staff-performance, branch-performance)
- ✅ Multiple formats (PDF, Excel, CSV)
- ✅ Input validation and error handling
- ✅ Authentication and authorization
- ✅ File download functionality

**Key Tests**:
- Report type validation
- Date range validation
- Format support
- Role-based access control
- Invalid parameter handling

### 2. Frontend Integration Tests (`tests/frontend/reports.integration.test.js`)
**Purpose**: Tests the React Reports component and useReports hook
**Coverage**:
- ✅ Component rendering and user interactions
- ✅ Report template selection
- ✅ Date range picker functionality
- ✅ Format selection and validation
- ✅ Loading states and error handling
- ✅ Custom report field selection

**Key Tests**:
- Template selection workflow
- Form validation
- API integration
- Error message display
- User experience flows

### 3. Email Delivery Tests (`tests/email/email.delivery.test.js`)
**Purpose**: Validates email templates and delivery system
**Coverage**:
- ✅ All email templates compilation
- ✅ Template data binding for all report types
- ✅ Email delivery API functionality
- ✅ Multi-recipient support
- ✅ Input validation and security

**Key Tests**:
- Template rendering with real data
- Email format validation
- Attachment handling
- XSS prevention in templates
- Mobile-responsive email templates

### 4. Template Tests (`tests/templates/handlebars.template.test.js`)
**Purpose**: Tests all Handlebars report templates
**Coverage**:
- ✅ All 6 report templates compilation
- ✅ Data binding and formatting
- ✅ Helper function validation
- ✅ Edge cases (empty data, large datasets)
- ✅ Template consistency and styling

**Key Tests**:
- Template compilation with various data scenarios
- Helper function execution (currency, date formatting)
- Performance with large datasets
- Error handling for malformed data
- Mobile-friendly HTML output

### 5. Scheduled Reports Tests (`tests/scheduled/scheduled.reports.test.js`)
**Purpose**: Validates scheduled report creation and queue system
**Coverage**:
- ✅ Schedule creation (daily, weekly, monthly)
- ✅ Schedule management (pause, resume, delete)
- ✅ Queue functionality and job processing
- ✅ Permission checks and validation
- ✅ Timezone handling

**Key Tests**:
- Schedule creation with different frequencies
- Immediate execution testing
- Bulk operations
- Validation of schedule parameters
- Permission-based access control

### 6. End-to-End Tests (`tests/e2e/reports.e2e.test.js`)
**Purpose**: Tests complete workflows from frontend to backend
**Coverage**:
- ✅ Complete manual report generation workflow
- ✅ Email report workflow
- ✅ Multi-format report generation
- ✅ Scheduled report lifecycle
- ✅ Error recovery and system resilience

**Key Tests**:
- Full user journey simulation
- Concurrent user scenarios
- System load testing
- Data consistency validation
- Memory and resource management

### 7. Performance Tests (`tests/performance/performance.test.js`)
**Purpose**: Tests system performance under various load conditions
**Coverage**:
- ✅ Single request performance
- ✅ Concurrent user load testing
- ✅ Large dataset handling
- ✅ Different report formats performance
- ✅ Resource utilization monitoring

**Key Tests**:
- Response time benchmarks
- Throughput measurement
- Load testing with different concurrency levels
- Performance with large date ranges
- Resource exhaustion scenarios

**Performance Benchmarks**:
- Average response time: < 5 seconds
- 95th percentile: < 10 seconds
- Error rate: < 5%
- Concurrent users: Up to 10 simultaneous

### 8. Security Tests (`tests/security/security.test.js`)
**Purpose**: Tests security vulnerabilities and access controls
**Coverage**:
- ✅ Authentication and authorization
- ✅ SQL injection prevention
- ✅ XSS (Cross-Site Scripting) prevention
- ✅ Path traversal protection
- ✅ Input validation and sanitization

**Key Tests**:
- JWT token validation
- Role-based access control
- Malicious payload injection
- File download security
- Email injection prevention
- Rate limiting validation

## 📊 Test Results

### Result Files
After running tests, results are saved in `test-results/` directory:
- `comprehensive-test-results.json` - Complete test data
- `test-report.html` - Visual HTML report
- `test-summary.md` - Markdown summary
- Individual suite results (e.g., `api-test-results.json`)

### Production Readiness Scoring
The test suite includes a production readiness assessment:

**Scoring Criteria**:
- Critical test failures: -25 points each
- Security vulnerabilities: -5 points each (max -30)
- Performance failures: -15 points
- High test failure rate (>10%): -20 points max

**Readiness Levels**:
- **80-100 points**: ✅ Production Ready
- **60-79 points**: ⚠️ Needs Attention
- **<60 points**: ❌ Not Ready for Production

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TEST_TOKEN` | Valid JWT token for API authentication | - | ✅ Yes |
| `API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` | No |
| `TEST_EMAIL` | Email address for testing email functionality | `test@example.com` | No |
| `RUN_PERFORMANCE_TESTS` | Enable/disable performance tests | `true` | No |

### Getting Test Token

1. **Login via API**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}'
   ```

2. **Extract token from response** and set as environment variable:
   ```bash
   export TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
❌ Expected success but got 401: {"success":false,"error":"Authentication required"}
```
**Solution**: Ensure `TEST_TOKEN` is set with a valid JWT token

#### 2. Email Service Errors
```
❌ Email service not configured (expected in test environment)
```
**Solution**: This is expected if SMTP is not configured. Tests will pass with this message.

#### 3. Permission Errors
```
❌ Expected success but got 403: {"success":false,"error":"Insufficient permissions"}
```
**Solution**: Ensure the test user has appropriate role (admin/manager) for restricted reports

#### 4. Connection Errors
```
❌ fetch failed
```
**Solution**: Ensure backend server is running on the specified `API_BASE_URL`

### Performance Issues

If performance tests are failing:
1. Check system resources (CPU, memory)
2. Ensure no other heavy processes are running
3. Verify database performance
4. Consider adjusting test thresholds

### Security Test Issues

Security tests may flag issues that need attention:
- Review CORS policies
- Implement rate limiting
- Add input validation
- Update authentication middleware

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: Report System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - name: Start services
        run: |
          npm run start:backend &
          sleep 30
      - name: Run tests
        env:
          TEST_TOKEN: ${{ secrets.TEST_TOKEN }}
          API_BASE_URL: http://localhost:3001/api
        run: node tests/run-all-tests.js
```

### Docker Testing
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV TEST_TOKEN=$TEST_TOKEN
ENV API_BASE_URL=http://backend:3001/api
CMD ["node", "tests/run-all-tests.js"]
```

## 🎯 Test Coverage Goals

### Current Coverage
- **API Endpoints**: 100% (all 15 endpoints tested)
- **Report Types**: 100% (all 6 report types)
- **Formats**: 100% (PDF, Excel, CSV)
- **Templates**: 100% (all 6 templates + 3 email templates)
- **Security Scenarios**: 15 attack vectors tested
- **Performance Scenarios**: 8 load patterns tested

### Quality Metrics
- **Response Time**: P95 < 10 seconds
- **Error Rate**: < 5% under normal load
- **Security Score**: > 80/100
- **Test Success Rate**: > 95%

## 🔄 Maintenance

### Regular Testing Schedule
- **Pre-deployment**: Full test suite
- **Weekly**: Security and performance tests
- **Monthly**: Complete regression testing
- **After major changes**: All relevant test suites

### Updating Tests
1. **New Features**: Add corresponding test cases
2. **API Changes**: Update API test requests/responses
3. **Security Updates**: Review and update security test scenarios
4. **Performance Changes**: Adjust performance benchmarks

### Test Data Management
- Use consistent test data across suites
- Clean up generated files after tests
- Reset test schedules to prevent conflicts
- Maintain test email accounts

## 📞 Support

For issues with the testing suite:
1. Check this documentation first
2. Review console output for specific error messages
3. Check `test-results/` directory for detailed logs
4. Verify environment setup and dependencies
5. Run individual test suites to isolate issues

## 🎉 Success Criteria

The report system is considered production-ready when:

✅ **All critical test suites pass** (API, Security, Templates)  
✅ **No security vulnerabilities** with severity HIGH or CRITICAL  
✅ **Performance benchmarks met** (response times, throughput)  
✅ **Error rate < 5%** across all test scenarios  
✅ **Email delivery functional** (templates render correctly)  
✅ **End-to-end workflows complete** successfully  
✅ **Production readiness score ≥ 80**  

When these criteria are met, the system is ready for production deployment with confidence in its reliability, security, and performance.
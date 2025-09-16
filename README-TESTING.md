# 🧪 Dine-Serve-Hub E2E Testing Guide

## 🎯 **Overview**

Comprehensive end-to-end testing suite for the multi-tenant restaurant management system using Playwright framework.

---

## 📁 **Test Structure**

```
tests/e2e/
├── setup.ts                      # Test configuration & Page Object Models
├── global-setup.ts              # Environment preparation
├── global-teardown.ts           # Cleanup after tests
├── test-plan.md                 # Complete testing scope
├── 01-authentication.spec.ts     # Login, logout, role-based access
├── 02-tenant-management.spec.ts  # Tenant CRUD, isolation, settings
├── 03-branch-management.spec.ts  # Branch operations, hierarchy
├── 04-user-management.spec.ts    # User CRUD, roles, permissions
├── 05-order-workflow.spec.ts     # Order processing, payments
└── 06-performance-accessibility.spec.ts # Performance & a11y testing
```

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
npm run playwright:install
```

### **2. Run All Tests**
```bash
npm run test:e2e
```

### **3. Run Specific Test Suite**
```bash
npm run test:e2e:auth          # Authentication tests
npm run test:e2e:tenants       # Tenant management tests  
npm run test:e2e:branches      # Branch management tests
npm run test:e2e:users         # User management tests
npm run test:e2e:orders        # Order workflow tests
npm run test:e2e:performance   # Performance & accessibility
```

### **4. Interactive Testing**
```bash
npm run test:e2e:ui            # Playwright UI mode
npm run test:e2e:debug         # Debug mode
npm run test:e2e:headed        # See browser actions
```

---

## 🌐 **Cross-Browser Testing**

```bash
npm run test:e2e:chromium      # Chrome/Edge testing
npm run test:e2e:firefox       # Firefox testing  
npm run test:e2e:webkit        # Safari testing
npm run test:e2e:mobile        # Mobile device testing
```

---

## 📊 **Test Reports**

### **View HTML Report**
```bash
npm run test:e2e:report
```

### **Report Locations**
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Results**: `test-results/results.json` 
- **JUnit XML**: `test-results/results.xml`
- **Completion Report**: `test-results/test-completion-report.json`

---

## 🏗️ **Test Configuration**

### **Environment Variables**
```bash
# Frontend URL (default: http://100.92.188.34:8080)
BASE_URL=http://localhost:8080

# Backend API URL (default: http://100.92.188.34:5000)  
API_URL=http://localhost:5000

# Test environment
NODE_ENV=test

# Browser settings
HEADLESS=false        # Show browser during testing
SLOW_MO=1000         # Slow down actions (ms)
```

### **Test Credentials**
- **SuperAdmin**: `superadmin@system.com` / `admin123`
- **Admin**: `admin@joespizzapalace.com` / `admin123`

---

## 📋 **Test Coverage**

### **🔐 Authentication & Security**
- ✅ Login/logout functionality
- ✅ Role-based access control
- ✅ Session management
- ✅ Security headers validation
- ✅ Input sanitization
- ✅ Rate limiting

### **🏢 Multi-Tenant System** 
- ✅ Tenant creation & management
- ✅ Data isolation between tenants
- ✅ Tenant-specific configurations
- ✅ Subscription & quota management
- ✅ Cross-tenant security

### **🏪 Branch Management**
- ✅ Branch CRUD operations
- ✅ Hierarchy (main → branch → franchise)
- ✅ Branch switching & context
- ✅ Branch-specific settings
- ✅ Multi-branch operations

### **👥 User Management**
- ✅ User CRUD operations
- ✅ Role assignment & permissions
- ✅ User-branch assignments
- ✅ Employee scheduling
- ✅ Profile management

### **📋 Order Processing**
- ✅ Order creation & modification
- ✅ Status workflow management
- ✅ Payment processing (cash, card, M-Pesa)
- ✅ Kitchen display integration
- ✅ Receipt generation

### **⚡ Performance & Accessibility**
- ✅ Page load time validation (<3s)
- ✅ API response time monitoring (<500ms)
- ✅ Memory usage tracking
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ WCAG 2.1 compliance
- ✅ Mobile responsiveness

---

## 🎪 **Test Scenarios**

### **Complete User Journeys**
1. **SuperAdmin Workflow**: Login → Tenant Management → System Settings
2. **Admin Workflow**: Login → Branch Setup → User Management → Daily Operations
3. **Staff Workflow**: Login → Order Processing → Payment → Kitchen Operations
4. **Customer Journey**: Menu Browse → Order → Payment → Receipt

### **Business Operations**
1. **Daily Operations**: Staff Clock-in → Inventory Check → Order Processing → Reports
2. **Multi-Branch Setup**: Main Branch → Sub-branches → Settings Inheritance
3. **Peak Hour Simulation**: Concurrent Orders → Kitchen Management → Payment Processing

---

## 🔧 **Debugging & Troubleshooting**

### **Common Issues**

**Test Timeout**
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000  # 60 seconds
```

**Element Not Found**
```bash
# Use debug mode to inspect elements
npm run test:e2e:debug
```

**Authentication Failures**
- Verify backend server is running (`npm run dev:backend`)
- Check test credentials in global-setup.ts
- Ensure database connectivity

**Network Issues**
- Confirm frontend/backend URLs in environment variables
- Check firewall settings for test ports
- Verify API endpoints are accessible

### **Debug Tools**

```bash
# Step through tests interactively
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed

# Generate trace files for failed tests
npm run test:e2e -- --trace on
```

---

## 📈 **Performance Benchmarks**

### **Acceptable Limits**
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Memory Usage**: < 100MB
- **File Upload**: < 10 seconds

### **Performance Monitoring**
- Real-time API response tracking
- Memory usage validation
- Network request optimization
- Concurrent user simulation (up to 3 users)

---

## ♿ **Accessibility Standards**

### **WCAG 2.1 Compliance**
- **Level A**: Basic accessibility
- **Level AA**: Standard accessibility (target)
- **Level AAA**: Enhanced accessibility

### **Testing Coverage**
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements
- Color contrast ratios
- Focus indicators
- Alternative text for images
- Form labels and instructions

---

## 📱 **Mobile Testing**

### **Supported Devices**
- **iPhone 13**: Portrait/landscape testing
- **iPad Pro**: Tablet layout validation  
- **Pixel 5**: Android mobile testing

### **Responsive Breakpoints**
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

---

## 🚦 **CI/CD Integration**

### **GitHub Actions**
```yaml
- name: Run E2E Tests
  run: |
    npm install
    npm run playwright:install
    npm run test:e2e
```

### **Test Results in CI**
- HTML reports uploaded as artifacts
- JUnit XML for test result integration
- Failure screenshots and videos
- Performance metrics tracking

---

## 🎯 **Best Practices**

### **Writing Tests**
1. Use Page Object Model patterns
2. Implement proper wait strategies
3. Clean up test data after each test
4. Use descriptive test names
5. Add proper error handling

### **Test Data Management**
1. Generate dynamic test data
2. Isolate test environments
3. Clean up after test runs
4. Use realistic test scenarios
5. Avoid hard-coded values

### **Performance Optimization**
1. Run tests in parallel when possible
2. Use efficient selectors
3. Minimize unnecessary waits
4. Optimize test data setup
5. Reuse browser contexts

---

## 🔗 **Related Documentation**

- **[Test Plan](tests/e2e/test-plan.md)**: Complete testing scope
- **[Playwright Config](playwright.config.ts)**: Framework configuration
- **[Setup Guide](tests/e2e/setup.ts)**: Page Object Models
- **[Package Scripts](package.json)**: Available test commands

---

## 📞 **Support**

For questions or issues with the testing framework:

1. Check the **[Test Plan](tests/e2e/test-plan.md)** for coverage details
2. Review **[Playwright Documentation](https://playwright.dev/)**
3. Check browser console for runtime errors
4. Verify backend logs for API issues
5. Create an issue with test failure details

---

**Happy Testing! 🚀**
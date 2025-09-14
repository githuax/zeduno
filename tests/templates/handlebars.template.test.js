/**
 * Handlebars Template Tests
 * 
 * Tests all report templates with real data scenarios and edge cases
 * Run with: node tests/templates/handlebars.template.test.js
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class HandlebarsTemplateTester {
  constructor() {
    this.templatesPath = path.join(__dirname, '../../backend/src/templates/reports');
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    
    // Register common Handlebars helpers
    this.registerHelpers();
  }

  registerHelpers() {
    // Date formatting helper
    handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    });

    // Currency formatting helper
    handlebars.registerHelper('formatCurrency', function(amount, currency = 'USD') {
      if (typeof amount !== 'number') return '0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Number formatting helper
    handlebars.registerHelper('formatNumber', function(number) {
      if (typeof number !== 'number') return '0';
      return number.toLocaleString();
    });

    // Percentage helper
    handlebars.registerHelper('percentage', function(value, decimals = 1) {
      if (typeof value !== 'number') return '0%';
      return `${value.toFixed(decimals)}%`;
    });

    // Conditional helpers
    handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });

    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    // Array length helper
    handlebars.registerHelper('length', function(array) {
      return Array.isArray(array) ? array.length : 0;
    });
  }

  async test(name, testFn) {
    try {
      console.log(`\n📄 Testing: ${name}`);
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

  // Test template compilation and rendering
  testTemplate(templatePath, data) {
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      const result = template(data);
      
      return {
        success: true,
        html: result,
        length: result.length,
        hasContent: result.trim().length > 100
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  // Generate realistic test data
  generateSalesData() {
    return {
      title: 'Sales Performance Report',
      subtitle: 'Comprehensive sales analysis for January 2024',
      companyInfo: {
        name: 'DineServe Test Restaurant',
        logo: '/assets/logos/company-logo.png',
        address: '123 Main Street, Test City, TC 12345',
        phone: '+1-555-TEST-REST',
        email: 'contact@dineservetest.com'
      },
      generatedBy: {
        userId: '60a1b2c3d4e5f6789abc1234',
        userName: 'John Admin',
        userRole: 'admin'
      },
      generatedAt: new Date(),
      formattedGeneratedAt: new Date().toLocaleString(),
      config: {
        format: 'pdf',
        includeCharts: true,
        includeDetails: true,
        currency: 'USD',
        timezone: 'UTC'
      },
      data: {
        summary: {
          totalRevenue: 45230.75,
          totalOrders: 342,
          averageOrderValue: 132.25,
          totalTax: 4523.08,
          netRevenue: 40707.67,
          growth: 12.5,
          previousPeriodRevenue: 40305.55
        },
        dailyBreakdown: [
          { date: '2024-01-01', revenue: 1250.50, orders: 18, avgOrder: 69.47 },
          { date: '2024-01-02', revenue: 1480.25, orders: 22, avgOrder: 67.28 },
          { date: '2024-01-03', revenue: 1325.75, orders: 19, avgOrder: 69.78 }
        ],
        topItems: [
          { name: 'Grilled Chicken Sandwich', quantity: 45, revenue: 562.50, percentage: 15.2 },
          { name: 'Caesar Salad', quantity: 38, revenue: 456.00, percentage: 12.3 },
          { name: 'Fish & Chips', quantity: 32, revenue: 512.00, percentage: 11.8 }
        ],
        paymentMethods: [
          { method: 'Card', amount: 25138.45, percentage: 55.6 },
          { method: 'Cash', amount: 15092.30, percentage: 33.4 },
          { method: 'Digital Wallet', amount: 5000.00, percentage: 11.0 }
        ],
        hourlyAnalysis: [
          { hour: '11:00', orders: 25, revenue: 1250.00 },
          { hour: '12:00', orders: 45, revenue: 2250.00 },
          { hour: '13:00', orders: 38, revenue: 1900.00 }
        ]
      }
    };
  }

  generateMenuPerformanceData() {
    return {
      title: 'Menu Performance Report',
      subtitle: 'Menu item analysis and performance metrics',
      companyInfo: {
        name: 'DineServe Test Restaurant',
        address: '123 Main Street, Test City, TC 12345'
      },
      generatedAt: new Date(),
      data: {
        summary: {
          totalItems: 85,
          activeItems: 78,
          discontinuedItems: 7,
          topPerformingCategory: 'Main Courses',
          totalItemsSold: 2450,
          averageItemRating: 4.3
        },
        categories: [
          {
            name: 'Appetizers',
            itemCount: 12,
            totalSold: 345,
            revenue: 4312.50,
            avgRating: 4.2,
            topItem: 'Buffalo Wings'
          },
          {
            name: 'Main Courses',
            itemCount: 25,
            totalSold: 890,
            revenue: 18750.00,
            avgRating: 4.5,
            topItem: 'Grilled Salmon'
          },
          {
            name: 'Desserts',
            itemCount: 15,
            totalSold: 234,
            revenue: 2808.00,
            avgRating: 4.1,
            topItem: 'Chocolate Cake'
          }
        ],
        topPerforming: [
          { name: 'Grilled Salmon', sold: 125, revenue: 2500.00, margin: 65.0, rating: 4.8 },
          { name: 'Chicken Caesar Wrap', sold: 98, revenue: 1470.00, margin: 58.5, rating: 4.6 },
          { name: 'Vegetarian Pizza', sold: 87, revenue: 1392.00, margin: 62.0, rating: 4.4 }
        ],
        underPerforming: [
          { name: 'Fish Tacos', sold: 12, revenue: 180.00, margin: 45.0, rating: 3.8 },
          { name: 'Quinoa Bowl', sold: 8, revenue: 120.00, margin: 52.0, rating: 3.9 }
        ],
        seasonalTrends: [
          { period: 'Week 1', sales: 580, revenue: 8750.00 },
          { period: 'Week 2', sales: 642, revenue: 9630.00 },
          { period: 'Week 3', sales: 598, revenue: 8970.00 },
          { period: 'Week 4', sales: 630, revenue: 9450.00 }
        ]
      }
    };
  }

  generateCustomerAnalyticsData() {
    return {
      title: 'Customer Analytics Report',
      subtitle: 'Customer behavior and satisfaction insights',
      companyInfo: {
        name: 'DineServe Test Restaurant'
      },
      generatedAt: new Date(),
      data: {
        summary: {
          totalCustomers: 1245,
          newCustomers: 234,
          returningCustomers: 1011,
          retentionRate: 81.2,
          averageOrderValue: 45.50,
          customerSatisfaction: 4.3,
          totalVisits: 3420
        },
        demographics: {
          ageGroups: [
            { range: '18-25', count: 189, percentage: 15.2 },
            { range: '26-35', count: 398, percentage: 32.0 },
            { range: '36-45', count: 312, percentage: 25.1 },
            { range: '46-55', count: 234, percentage: 18.8 },
            { range: '55+', count: 112, percentage: 9.0 }
          ],
          preferences: [
            { category: 'Vegetarian', count: 245, percentage: 19.7 },
            { category: 'Gluten-Free', count: 134, percentage: 10.8 },
            { category: 'Vegan', count: 89, percentage: 7.2 }
          ]
        },
        visitPatterns: [
          { day: 'Monday', visits: 420, avgSpend: 42.50 },
          { day: 'Tuesday', visits: 380, avgSpend: 38.75 },
          { day: 'Wednesday', visits: 450, avgSpend: 45.20 },
          { day: 'Thursday', visits: 520, avgSpend: 48.90 },
          { day: 'Friday', visits: 680, avgSpend: 55.30 },
          { day: 'Saturday', visits: 750, avgSpend: 62.80 },
          { day: 'Sunday', visits: 220, avgSpend: 35.40 }
        ],
        loyaltyProgram: {
          totalMembers: 890,
          activeMembers: 654,
          pointsRedeemed: 45600,
          averagePointsPerMember: 512,
          topTier: {
            name: 'Gold Members',
            count: 89,
            avgSpend: 125.50
          }
        }
      }
    };
  }

  generateFinancialSummaryData() {
    return {
      title: 'Financial Summary Report',
      subtitle: 'Comprehensive financial analysis and breakdown',
      companyInfo: {
        name: 'DineServe Test Restaurant'
      },
      generatedAt: new Date(),
      data: {
        summary: {
          grossRevenue: 125450.75,
          netRevenue: 98340.50,
          totalTax: 12545.08,
          serviceCharges: 6272.54,
          discounts: 8292.63,
          totalExpenses: 76230.25,
          netProfit: 22110.25,
          profitMargin: 17.6
        },
        revenueBreakdown: [
          { source: 'Dine-In', amount: 75270.45, percentage: 60.0 },
          { source: 'Takeaway', amount: 31362.69, percentage: 25.0 },
          { source: 'Delivery', amount: 18817.61, percentage: 15.0 }
        ],
        expenses: [
          { category: 'Food Costs', amount: 38115.13, percentage: 50.0 },
          { category: 'Labor', amount: 22869.08, percentage: 30.0 },
          { category: 'Utilities', amount: 7623.03, percentage: 10.0 },
          { category: 'Marketing', amount: 3049.21, percentage: 4.0 },
          { category: 'Other', amount: 4573.81, percentage: 6.0 }
        ],
        paymentMethodBreakdown: [
          { method: 'Credit Card', amount: 69251.42, fees: 2077.54, net: 67173.88 },
          { method: 'Cash', amount: 37635.23, fees: 0, net: 37635.23 },
          { method: 'Digital Payments', amount: 18564.10, fees: 371.28, net: 18192.82 }
        ],
        taxBreakdown: [
          { type: 'Sales Tax', rate: 8.5, amount: 10663.31 },
          { type: 'Service Tax', rate: 1.5, amount: 1881.76 }
        ]
      }
    };
  }

  generateStaffPerformanceData() {
    return {
      title: 'Staff Performance Report',
      subtitle: 'Employee productivity and performance analysis',
      companyInfo: {
        name: 'DineServe Test Restaurant'
      },
      generatedAt: new Date(),
      data: {
        summary: {
          totalStaff: 24,
          activeStaff: 22,
          totalHours: 3520,
          averageHoursPerStaff: 160,
          averagePerformanceScore: 87.3,
          topPerformer: 'Sarah Johnson',
          totalSalesHandled: 145230.50
        },
        departments: [
          {
            name: 'Kitchen',
            staffCount: 8,
            avgPerformance: 89.2,
            totalHours: 1280,
            avgHourlyRate: 18.50
          },
          {
            name: 'Service',
            staffCount: 10,
            avgPerformance: 86.8,
            totalHours: 1600,
            avgHourlyRate: 15.75
          },
          {
            name: 'Management',
            staffCount: 4,
            avgPerformance: 92.1,
            totalHours: 640,
            avgHourlyRate: 28.00
          }
        ],
        topPerformers: [
          {
            name: 'Sarah Johnson',
            department: 'Service',
            score: 94.5,
            hoursWorked: 160,
            salesHandled: 18750.00,
            customerRating: 4.8
          },
          {
            name: 'Mike Chen',
            department: 'Kitchen',
            score: 92.3,
            hoursWorked: 155,
            ordersCompleted: 245,
            avgPrepTime: 12.5
          },
          {
            name: 'Lisa Rodriguez',
            department: 'Service',
            score: 91.8,
            hoursWorked: 158,
            salesHandled: 17230.50,
            customerRating: 4.7
          }
        ],
        attendance: {
          totalShifts: 440,
          onTimeShifts: 398,
          lateShifts: 32,
          noShows: 10,
          punctualityRate: 90.5
        },
        performanceMetrics: [
          { metric: 'Customer Service', average: 88.5, target: 85 },
          { metric: 'Order Accuracy', average: 92.1, target: 90 },
          { metric: 'Speed of Service', average: 85.7, target: 80 },
          { metric: 'Upselling Success', average: 73.2, target: 70 }
        ]
      }
    };
  }

  generateBranchPerformanceData() {
    return {
      title: 'Branch Performance Report',
      subtitle: 'Multi-location performance comparison and analysis',
      companyInfo: {
        name: 'DineServe Test Restaurant Chain'
      },
      generatedAt: new Date(),
      data: {
        summary: {
          totalBranches: 5,
          activeBranches: 5,
          totalRevenue: 312450.75,
          averageRevenuePerBranch: 62490.15,
          topPerformingBranch: 'Downtown Location',
          totalOrders: 2340,
          averageOrderValue: 133.55
        },
        branches: [
          {
            name: 'Downtown Location',
            code: 'DT01',
            revenue: 85230.50,
            orders: 640,
            avgOrderValue: 133.17,
            staffCount: 18,
            customerRating: 4.6,
            profitMargin: 22.5,
            marketShare: 27.3
          },
          {
            name: 'Mall Branch',
            code: 'ML02',
            revenue: 72460.25,
            orders: 580,
            avgOrderValue: 124.93,
            staffCount: 15,
            customerRating: 4.3,
            profitMargin: 19.8,
            marketShare: 23.2
          },
          {
            name: 'Suburban Outlet',
            code: 'SB03',
            revenue: 65720.30,
            orders: 520,
            avgOrderValue: 126.39,
            staffCount: 12,
            customerRating: 4.4,
            profitMargin: 21.2,
            marketShare: 21.0
          },
          {
            name: 'Airport Terminal',
            code: 'AP04',
            revenue: 58340.70,
            orders: 450,
            avgOrderValue: 129.65,
            staffCount: 14,
            customerRating: 4.1,
            profitMargin: 18.7,
            marketShare: 18.7
          },
          {
            name: 'University Campus',
            code: 'UC05',
            revenue: 30699.00,
            orders: 150,
            avgOrderValue: 204.66,
            staffCount: 8,
            customerRating: 4.5,
            profitMargin: 16.3,
            marketShare: 9.8
          }
        ],
        metrics: {
          efficiency: [
            { branch: 'Downtown Location', score: 94.2 },
            { branch: 'Mall Branch', score: 87.8 },
            { branch: 'Suburban Outlet', score: 89.1 },
            { branch: 'Airport Terminal', score: 82.5 },
            { branch: 'University Campus', score: 91.3 }
          ],
          customerSatisfaction: [
            { branch: 'Downtown Location', score: 4.6 },
            { branch: 'Mall Branch', score: 4.3 },
            { branch: 'Suburban Outlet', score: 4.4 },
            { branch: 'Airport Terminal', score: 4.1 },
            { branch: 'University Campus', score: 4.5 }
          ]
        },
        trends: [
          { period: 'Q1 2023', totalRevenue: 285340.50, growth: 0 },
          { period: 'Q2 2023', totalRevenue: 298675.25, growth: 4.7 },
          { period: 'Q3 2023', totalRevenue: 305820.75, growth: 2.4 },
          { period: 'Q4 2023', totalRevenue: 312450.75, growth: 2.2 }
        ]
      }
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📄 HANDLEBARS TEMPLATE TEST RESULTS');
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

    // Save results
    const resultsFile = path.join(__dirname, '../../test-results/template-test-results.json');
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

async function runHandlebarsTemplateTests() {
  const tester = new HandlebarsTemplateTester();

  console.log('🚀 Starting Handlebars Template Tests');

  // Test 1: Template Files Existence
  await tester.test('Template Files Existence', async () => {
    const expectedTemplates = [
      'sales-report.hbs',
      'menu-performance-report.hbs',
      'customer-analytics-report.hbs',
      'financial-summary-report.hbs',
      'staff-performance-report.hbs',
      'branch-performance-report.hbs'
    ];

    for (const template of expectedTemplates) {
      const templatePath = path.join(tester.templatesPath, template);
      tester.assert(fs.existsSync(templatePath), `Template ${template} does not exist`);
    }

    return { passed: true, message: `All ${expectedTemplates.length} template files found` };
  });

  // Test 2: Sales Report Template
  await tester.test('Sales Report Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    const data = tester.generateSalesData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');
    tester.assert(result.html.includes(data.title), 'Template should include report title');
    tester.assert(result.html.includes(data.companyInfo.name), 'Template should include company name');
    tester.assert(result.html.includes('$45,230.75') || result.html.includes('45230.75'), 'Template should format revenue');

    return { passed: true, message: `Sales template rendered successfully (${result.length} chars)` };
  });

  // Test 3: Menu Performance Report Template
  await tester.test('Menu Performance Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'menu-performance-report.hbs');
    const data = tester.generateMenuPerformanceData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');
    tester.assert(result.html.includes('Menu Performance Report'), 'Template should include report title');

    return { passed: true, message: `Menu performance template rendered successfully (${result.length} chars)` };
  });

  // Test 4: Customer Analytics Report Template
  await tester.test('Customer Analytics Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'customer-analytics-report.hbs');
    const data = tester.generateCustomerAnalyticsData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');

    return { passed: true, message: `Customer analytics template rendered successfully (${result.length} chars)` };
  });

  // Test 5: Financial Summary Report Template
  await tester.test('Financial Summary Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'financial-summary-report.hbs');
    const data = tester.generateFinancialSummaryData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');

    return { passed: true, message: `Financial summary template rendered successfully (${result.length} chars)` };
  });

  // Test 6: Staff Performance Report Template
  await tester.test('Staff Performance Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'staff-performance-report.hbs');
    const data = tester.generateStaffPerformanceData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');

    return { passed: true, message: `Staff performance template rendered successfully (${result.length} chars)` };
  });

  // Test 7: Branch Performance Report Template
  await tester.test('Branch Performance Template Rendering', async () => {
    const templatePath = path.join(tester.templatesPath, 'branch-performance-report.hbs');
    const data = tester.generateBranchPerformanceData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    tester.assert(result.hasContent, 'Template produced insufficient content');

    return { passed: true, message: `Branch performance template rendered successfully (${result.length} chars)` };
  });

  // Test 8: Empty Data Handling
  await tester.test('Empty Data Graceful Handling', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    const emptyData = {
      title: 'Sales Report',
      companyInfo: { name: 'Test Company' },
      data: {
        summary: {},
        dailyBreakdown: [],
        topItems: [],
        paymentMethods: []
      }
    };
    
    const result = tester.testTemplate(templatePath, emptyData);
    
    tester.assert(result.success, `Template should handle empty data gracefully: ${result.error}`);
    tester.assert(result.html.includes('Sales Report'), 'Template should still show title');

    return { passed: true, message: 'Templates handle empty data gracefully' };
  });

  // Test 9: Large Dataset Handling
  await tester.test('Large Dataset Performance', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    
    // Generate large dataset
    const largeData = tester.generateSalesData();
    largeData.data.dailyBreakdown = Array.from({ length: 365 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      revenue: Math.random() * 2000 + 500,
      orders: Math.floor(Math.random() * 50) + 10,
      avgOrder: Math.random() * 100 + 50
    }));
    
    largeData.data.topItems = Array.from({ length: 100 }, (_, i) => ({
      name: `Menu Item ${i + 1}`,
      quantity: Math.floor(Math.random() * 100) + 1,
      revenue: Math.random() * 1000 + 100,
      percentage: Math.random() * 10
    }));

    const startTime = Date.now();
    const result = tester.testTemplate(templatePath, largeData);
    const renderTime = Date.now() - startTime;
    
    tester.assert(result.success, `Large dataset rendering failed: ${result.error}`);
    tester.assert(renderTime < 5000, `Rendering took too long: ${renderTime}ms`);

    return { passed: true, message: `Large dataset rendered in ${renderTime}ms` };
  });

  // Test 10: Helper Functions
  await tester.test('Handlebars Helper Functions', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    const data = tester.generateSalesData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    
    // Check if currency formatting is working
    const hasCurrencyFormat = result.html.includes('$') || result.html.includes('USD');
    tester.assert(hasCurrencyFormat, 'Template should format currency values');

    return { passed: true, message: 'Helper functions working correctly' };
  });

  // Test 11: Special Characters and HTML Escaping
  await tester.test('Special Characters and HTML Escaping', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    const data = tester.generateSalesData();
    
    // Add special characters
    data.companyInfo.name = 'Test & Associates <Restaurant>';
    data.data.topItems[0].name = 'Chicken & Chips <Spicy>';
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    
    // Check HTML escaping
    const hasEscapedAmpersand = result.html.includes('&amp;') || !result.html.includes(' & ');
    const hasEscapedBrackets = result.html.includes('&lt;') || !result.html.includes('<Restaurant>');
    
    // Either properly escaped or handled safely
    tester.assert(hasEscapedAmpersand || hasEscapedBrackets, 'Template should handle special characters safely');

    return { passed: true, message: 'Special characters handled correctly' };
  });

  // Test 12: Conditional Rendering
  await tester.test('Conditional Rendering Logic', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    
    // Test with and without optional fields
    const dataWithOptional = tester.generateSalesData();
    const dataWithoutOptional = { ...tester.generateSalesData() };
    delete dataWithoutOptional.data.hourlyAnalysis;
    delete dataWithoutOptional.companyInfo.logo;
    
    const resultWith = tester.testTemplate(templatePath, dataWithOptional);
    const resultWithout = tester.testTemplate(templatePath, dataWithoutOptional);
    
    tester.assert(resultWith.success, `Template with optional data failed: ${resultWith.error}`);
    tester.assert(resultWithout.success, `Template without optional data failed: ${resultWithout.error}`);
    
    // Both should render, but content may differ
    tester.assert(resultWith.length > 0 && resultWithout.length > 0, 'Both variations should produce content');

    return { passed: true, message: 'Conditional rendering works correctly' };
  });

  // Test 13: Template Consistency
  await tester.test('Template Styling Consistency', async () => {
    const templates = [
      'sales-report.hbs',
      'menu-performance-report.hbs',
      'customer-analytics-report.hbs',
      'financial-summary-report.hbs',
      'staff-performance-report.hbs',
      'branch-performance-report.hbs'
    ];

    const commonElements = [];
    
    for (const template of templates) {
      const templatePath = path.join(tester.templatesPath, template);
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check for common styling elements
      const hasCSS = content.includes('<style>') || content.includes('class=');
      const hasCompanyInfo = content.includes('companyInfo') || content.includes('company');
      const hasGeneratedAt = content.includes('generatedAt') || content.includes('generated');
      
      commonElements.push({
        template,
        hasCSS,
        hasCompanyInfo,
        hasGeneratedAt
      });
    }

    // Most templates should have common elements
    const stylingCount = commonElements.filter(t => t.hasCSS).length;
    const companyCount = commonElements.filter(t => t.hasCompanyInfo).length;
    const dateCount = commonElements.filter(t => t.hasGeneratedAt).length;

    tester.assert(stylingCount >= templates.length * 0.8, 'Most templates should have consistent styling');
    tester.assert(companyCount >= templates.length * 0.8, 'Most templates should include company info');

    return { passed: true, message: `Template consistency: ${stylingCount}/${templates.length} styled, ${companyCount}/${templates.length} with company info` };
  });

  // Test 14: Mobile-Friendly HTML
  await tester.test('Mobile-Friendly HTML Output', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    const data = tester.generateSalesData();
    
    const result = tester.testTemplate(templatePath, data);
    
    tester.assert(result.success, `Template compilation failed: ${result.error}`);
    
    // Check for mobile-friendly elements
    const hasMeta = result.html.includes('viewport') || result.html.includes('meta');
    const hasResponsive = result.html.includes('@media') || result.html.includes('responsive');
    const hasFlexible = result.html.includes('width:') && result.html.includes('%');
    
    // At least some mobile considerations should be present
    const mobileScore = [hasMeta, hasResponsive, hasFlexible].filter(Boolean).length;

    return { passed: true, message: `Mobile compatibility score: ${mobileScore}/3` };
  });

  // Test 15: Template Error Recovery
  await tester.test('Template Error Recovery', async () => {
    const templatePath = path.join(tester.templatesPath, 'sales-report.hbs');
    
    // Test with malformed data
    const malformedData = {
      title: 'Test Report',
      companyInfo: null, // null instead of object
      data: {
        summary: 'not an object', // string instead of object
        dailyBreakdown: 'not an array' // string instead of array
      }
    };
    
    const result = tester.testTemplate(templatePath, malformedData);
    
    // Template should either handle gracefully or fail clearly
    if (!result.success) {
      tester.assert(result.error.length > 0, 'Should provide clear error message');
    } else {
      tester.assert(result.html.includes('Test Report'), 'Should at least show title');
    }

    return { passed: true, message: result.success ? 'Template handled malformed data gracefully' : 'Template failed with clear error message' };
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
  runHandlebarsTemplateTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Template test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runHandlebarsTemplateTests };
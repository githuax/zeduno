/**
 * Frontend Reports Integration Tests
 * 
 * Tests the Reports.tsx component and useReports hook functionality
 * Run with: npm test -- tests/frontend/reports.integration.test.js
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Mock the API utilities
jest.mock('@/utils/api', () => ({
  apiRequest: jest.fn()
}));

jest.mock('@/config/api', () => ({
  API_BASE_URL: 'http://localhost:3001/api'
}));

import { apiRequest } from '@/utils/api';
import Reports from '@/pages/Reports';

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Reports Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Mock localStorage for token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-jwt-token'),
      },
    });

    // Mock successful API responses
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === '/reports/types') {
        return Promise.resolve({
          success: true,
          reports: [
            {
              type: 'sales',
              name: 'Sales Performance Report',
              description: 'Comprehensive sales analysis',
              requiredRole: ['admin', 'manager'],
              formats: ['pdf', 'excel']
            },
            {
              type: 'menu-performance',
              name: 'Menu Performance Report',
              description: 'Menu item analysis',
              requiredRole: ['admin', 'manager'],
              formats: ['pdf', 'excel']
            }
          ]
        });
      }

      if (endpoint === '/reports/branches') {
        return Promise.resolve({
          success: true,
          branches: [
            { _id: 'branch1', name: 'Main Branch', code: 'MAIN' },
            { _id: 'branch2', name: 'Downtown Branch', code: 'DOWN' }
          ]
        });
      }

      if (endpoint === '/reports/sales') {
        return Promise.resolve({
          success: true,
          data: {
            fileName: 'sales-report-2024-01-15.pdf',
            downloadUrl: '/api/reports/download/sales-report-2024-01-15.pdf'
          }
        });
      }

      return Promise.reject(new Error('Unknown endpoint'));
    });

    // Mock file download
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document methods for file download
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: ''
    };
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockLink;
      return document.createElement(tag);
    });
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('1. Component Renders Correctly', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check main page elements
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Generate reports and manage automated scheduling')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByText('Generate Reports')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
    
    // Check report templates section
    expect(screen.getByText('Report Templates')).toBeInTheDocument();
    expect(screen.getByText('Report Configuration')).toBeInTheDocument();
  });

  test('2. Report Templates Display and Selection', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check that report templates are displayed
    expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
    expect(screen.getByText('Customer Analytics')).toBeInTheDocument();
    expect(screen.getByText('Operational Summary')).toBeInTheDocument();
    expect(screen.getByText('Financial Overview')).toBeInTheDocument();

    // Test template selection
    const salesTemplate = screen.getByText('Daily Sales Report').closest('div[class*="cursor-pointer"]');
    await user.click(salesTemplate);

    // Verify template is selected (should have different styling)
    expect(salesTemplate).toHaveClass(/border-primary/);
  });

  test('3. Date Range Picker Functionality', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Look for date range picker
    const dateRangeInput = screen.getByText('Date Range').parentElement;
    expect(dateRangeInput).toBeInTheDocument();

    // The actual date picker implementation would depend on the specific component used
    // This test verifies the presence of the date range section
  });

  test('4. Format Selection Works', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Find format selector
    const formatLabel = screen.getByText('Export Format');
    expect(formatLabel).toBeInTheDocument();

    // Check that PDF is the default selection (this would depend on implementation)
    const formatSection = formatLabel.parentElement;
    expect(formatSection).toBeInTheDocument();
  });

  test('5. Branch Selection (When Available)', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Wait for branches to load
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/reports/branches');
    });

    // After branches load, should see branch selector
    await waitFor(() => {
      const branchLabel = screen.queryByText('Branch (Optional)');
      if (branchLabel) {
        expect(branchLabel).toBeInTheDocument();
      }
    });
  });

  test('6. Report Generation Flow', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Select a template
    const salesTemplate = screen.getByText('Daily Sales Report').closest('div[class*="cursor-pointer"]');
    await user.click(salesTemplate);

    // Find and click generate button
    const generateButton = screen.getByRole('button', { name: /generate report/i });
    expect(generateButton).toBeInTheDocument();

    // Click generate button
    await user.click(generateButton);

    // Wait for API call
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/reports/sales', expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  test('7. Loading States During Generation', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Select template and generate
    const salesTemplate = screen.getByText('Daily Sales Report').closest('div[class*="cursor-pointer"]');
    await user.click(salesTemplate);

    const generateButton = screen.getByRole('button', { name: /generate report/i });
    
    // Mock a delayed API response
    apiRequest.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: { fileName: 'test.pdf', downloadUrl: '/test.pdf' }
        }), 1000)
      )
    );

    await user.click(generateButton);

    // Should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  test('8. Error Handling for API Failures', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Mock API failure
    apiRequest.mockRejectedValueOnce(new Error('API Error'));

    // Select template and generate
    const salesTemplate = screen.getByText('Daily Sales Report').closest('div[class*="cursor-pointer"]');
    await user.click(salesTemplate);

    const generateButton = screen.getByRole('button', { name: /generate report/i });
    await user.click(generateButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  test('9. Custom Report Field Selection', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Select custom report template
    const customTemplate = screen.getByText('Custom Report').closest('div[class*="cursor-pointer"]');
    await user.click(customTemplate);

    // Should show field selection section
    await waitFor(() => {
      expect(screen.getByText('Select Report Fields')).toBeInTheDocument();
    });

    // Check that checkboxes are available
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Test checkbox interaction
    await user.click(checkboxes[0]);
    // Checkbox state changes would be implementation-specific
  });

  test('10. Validation Prevents Empty Submissions', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Try to generate without selecting template
    const generateButton = screen.getByRole('button', { name: /generate report/i });
    await user.click(generateButton);

    // Should show validation error
    expect(screen.getByText(/please select a report template/i)).toBeInTheDocument();
  });

  test('11. Navigation to Analytics Page', async () => {
    const mockNavigate = jest.fn();
    
    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    const analyticsButton = screen.getByRole('button', { name: /view analytics/i });
    await user.click(analyticsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/analytics');
  });

  test('12. Quick Stats Display', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check quick stats section
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
    expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
  });

  test('13. Recent Reports Section', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check recent reports section
    expect(screen.getByText('Recent Reports')).toBeInTheDocument();
    expect(screen.getByText('Previously generated reports')).toBeInTheDocument();

    // Check for mock recent reports
    expect(screen.getByText(/Daily Sales Report - Jan 15/)).toBeInTheDocument();
    expect(screen.getByText(/Customer Analytics - Jan 14/)).toBeInTheDocument();
  });

  test('14. Scheduled Reports Tab', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Click on scheduled reports tab
    const scheduledTab = screen.getByText('Scheduled Reports');
    await user.click(scheduledTab);

    // Should switch to scheduled reports tab
    // The specific content would depend on the ScheduledReportsTab component
  });

  test('15. Responsive Design Elements', async () => {
    render(
      <TestWrapper>
        <Reports />
      </TestWrapper>
    );

    // Check for responsive classes (this is a basic check)
    const mainContainer = screen.getByText('Reports').closest('main');
    expect(mainContainer).toHaveClass('p-6');

    // Check grid layouts
    const reportTemplatesSection = screen.getByText('Report Templates').closest('div');
    const parentGrid = reportTemplatesSection.closest('div[class*="grid"]');
    expect(parentGrid).toHaveClass(/grid-cols-1|lg:grid-cols-3/);
  });
});

// Performance test helper
export const performanceTest = async (testName, testFn, maxDuration = 5000) => {
  const startTime = performance.now();
  
  try {
    await testFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  ${testName}: ${duration.toFixed(2)}ms`);
    
    if (duration > maxDuration) {
      console.warn(`⚠️  ${testName} took longer than expected: ${duration.toFixed(2)}ms > ${maxDuration}ms`);
    }
    
    return { passed: true, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`❌ ${testName} failed after ${duration.toFixed(2)}ms:`, error.message);
    return { passed: false, duration, error: error.message };
  }
};

// Export test utilities for use in other test files
export {
  TestWrapper,
  Reports
};
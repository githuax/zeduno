/**
 * Test Setup and Configuration
 * Global test environment setup for branch management testing suite
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Service Worker setup
import { branchMockServer } from '@/__tests__/mocks/branchMockApi';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window.location
delete window.location;
window.location = {
  ...window.location,
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn().mockReturnValue('mocked-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

// Setup MSW before all tests
beforeAll(() => {
  branchMockServer.listen();
});

// Clean up after each test
afterEach(() => {
  cleanup();
  branchMockServer.resetHandlers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear storage mocks
  localStorageMock.clear.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  
  sessionStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
});

// Clean up after all tests
afterAll(() => {
  branchMockServer.close();
});

// Global test utilities
export const testUtils = {
  // Wait for async operations
  waitForAsyncOperations: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Mock console methods to avoid noise in tests
  mockConsole: () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    
    return {
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  },
  
  // Create mock timers
  useFakeTimers: () => {
    vi.useFakeTimers();
    return {
      restore: () => vi.useRealTimers(),
      advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
      runAllTimers: () => vi.runAllTimers()
    };
  },
  
  // Mock fetch globally
  mockFetch: (mockImplementation?: any) => {
    const originalFetch = global.fetch;
    global.fetch = mockImplementation || vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    });
    
    return {
      restore: () => {
        global.fetch = originalFetch;
      }
    };
  }
};

// Custom matchers for better assertions
export const customMatchers = {
  // Check if element has loading state
  toHaveLoadingState: (received: Element) => {
    const hasLoadingClass = received.classList.contains('animate-pulse') ||
                           received.classList.contains('loading') ||
                           received.hasAttribute('aria-busy');
    
    return {
      message: () => `Expected element ${hasLoadingState ? 'not ' : ''}to have loading state`,
      pass: hasLoadingClass
    };
  },
  
  // Check if element is accessible
  toBeAccessible: (received: Element) => {
    const hasAriaLabel = received.hasAttribute('aria-label') ||
                        received.hasAttribute('aria-labelledby') ||
                        received.hasAttribute('aria-describedby');
    
    const isFocusable = received.hasAttribute('tabindex') ||
                       ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(received.tagName);
    
    const isAccessible = hasAriaLabel || !isFocusable;
    
    return {
      message: () => `Expected element ${isAccessible ? 'not ' : ''}to be accessible`,
      pass: isAccessible
    };
  }
};

// Error boundary for tests
export class TestErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return <div data-testid="error-boundary">Something went wrong.</div>;
    }

    return (this.props as any).children;
  }
}

// Test data factories
export const createTestBranch = (overrides = {}) => ({
  _id: 'test-branch-1',
  tenantId: 'test-tenant',
  name: 'Test Branch',
  code: 'TB001',
  type: 'branch' as const,
  status: 'active' as const,
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'Test Country'
  },
  contact: {
    phone: '+1-555-0123',
    email: 'test@example.com',
    managerName: 'Test Manager'
  },
  operations: {
    openTime: '09:00',
    closeTime: '21:00',
    timezone: 'UTC',
    daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    seatingCapacity: 50
  },
  financial: {
    currency: 'USD',
    taxRate: 8.5,
    tipEnabled: true,
    paymentMethods: ['cash', 'card']
  },
  inventory: {
    trackInventory: true,
    lowStockAlertEnabled: true,
    autoReorderEnabled: false
  },
  menuConfig: {
    inheritFromParent: false,
    customPricing: true
  },
  staffing: {
    maxStaff: 15,
    currentStaff: 8,
    roles: ['manager', 'server', 'cook']
  },
  metrics: {
    avgOrderValue: 35.50,
    totalOrders: 1000,
    totalRevenue: 35500,
    lastUpdated: new Date().toISOString()
  },
  integrations: {
    onlineOrderingEnabled: true
  },
  settings: {
    orderPrefix: 'TB',
    orderNumberSequence: 1001
  },
  isActive: true,
  createdBy: 'test-admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-1',
  tenantId: 'test-tenant',
  role: 'admin' as const,
  assignedBranches: ['test-branch-1', 'test-branch-2'],
  currentBranch: 'test-branch-1',
  ...overrides
});

// Common test scenarios
export const testScenarios = {
  // Standard admin user with full permissions
  adminUser: () => createTestUser({ role: 'admin' }),
  
  // Regular user with limited permissions
  regularUser: () => createTestUser({ 
    role: 'user',
    assignedBranches: ['test-branch-1']
  }),
  
  // Superadmin with system-wide access
  superadminUser: () => createTestUser({ role: 'superadmin' }),
  
  // User with no branch assignments
  unassignedUser: () => createTestUser({ 
    assignedBranches: [],
    currentBranch: undefined
  }),
  
  // High-performing branch
  highPerformingBranch: () => createTestBranch({
    metrics: {
      avgOrderValue: 75.50,
      totalOrders: 5000,
      totalRevenue: 377500,
      lastUpdated: new Date().toISOString()
    }
  }),
  
  // Inactive branch
  inactiveBranch: () => createTestBranch({
    status: 'inactive',
    metrics: {
      avgOrderValue: 25.00,
      totalOrders: 100,
      totalRevenue: 2500,
      lastUpdated: new Date().toISOString()
    }
  })
};

// Test environment configuration
export const testConfig = {
  // Default query client options for tests
  queryClientOptions: {
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  },
  
  // Mock API delays (in milliseconds)
  apiDelay: {
    fast: 0,
    normal: 100,
    slow: 1000,
  },
  
  // Test timeouts
  timeout: {
    short: 1000,
    medium: 5000,
    long: 10000,
  }
};

export default testUtils;
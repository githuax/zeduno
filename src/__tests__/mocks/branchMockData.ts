/**
 * Branch Management Mock Data Generators
 * Utilities for generating realistic test data for branch management system
 */

import { 
  Branch, 
  BranchHierarchy, 
  CreateBranchData, 
  UpdateBranchData,
  BranchFilters,
  BranchApiResponse,
  BranchMetricsApiResponse,
  ConsolidatedMetrics,
  BranchMetrics
} from '@/types/branch.types';

// Utility functions for generating random data
const randomId = () => Math.random().toString(36).substr(2, 9);
const randomChoice = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomBoolean = () => Math.random() < 0.5;

// Static data arrays
const branchTypes = ['main', 'branch', 'franchise'] as const;
const branchStatuses = ['active', 'inactive', 'suspended'] as const;
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
const paymentMethods = ['cash', 'card', 'mobile', 'check'];
const timezones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo'
];

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const cities = [
  { name: 'New York', state: 'NY', country: 'USA' },
  { name: 'Los Angeles', state: 'CA', country: 'USA' },
  { name: 'Chicago', state: 'IL', country: 'USA' },
  { name: 'Houston', state: 'TX', country: 'USA' },
  { name: 'Phoenix', state: 'AZ', country: 'USA' },
  { name: 'Philadelphia', state: 'PA', country: 'USA' },
  { name: 'San Antonio', state: 'TX', country: 'USA' },
  { name: 'San Diego', state: 'CA', country: 'USA' },
  { name: 'Dallas', state: 'TX', country: 'USA' },
  { name: 'San Jose', state: 'CA', country: 'USA' }
];

const streetNames = [
  'Main Street', 'Oak Avenue', 'Park Boulevard', 'First Street', 'Second Avenue',
  'Maple Drive', 'Cedar Lane', 'Pine Road', 'Broadway', 'Market Street',
  'Washington Avenue', 'Lincoln Boulevard', 'Jackson Street', 'Madison Avenue'
];

const managerFirstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Patricia'];
const managerLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const roles = ['manager', 'assistant_manager', 'server', 'cook', 'cashier', 'host', 'bartender', 'cleaner'];

/**
 * Generate a mock branch with realistic data
 */
export const createMockBranch = (overrides: Partial<Branch> = {}): Branch => {
  const id = overrides._id || randomId();
  const city = randomChoice(cities);
  const branchType = randomChoice(branchTypes);
  const status = randomChoice(branchStatuses);
  const currency = randomChoice(currencies);
  
  // Generate branch name based on location and type
  const branchName = overrides.name || (
    branchType === 'main' ? `${city.name} Main Branch` : 
    branchType === 'franchise' ? `${city.name} Franchise` :
    `${city.name} ${randomChoice(['Downtown', 'Uptown', 'West', 'East', 'North', 'South'])} Branch`
  );

  // Generate branch code
  const branchCode = overrides.code || `${city.name.substring(0, 2).toUpperCase()}${randomNumber(100, 999)}`;

  // Generate manager info
  const managerFirstName = randomChoice(managerFirstNames);
  const managerLastName = randomChoice(managerLastNames);
  const managerName = `${managerFirstName} ${managerLastName}`;

  // Generate realistic metrics based on branch type and status
  const baseOrderCount = branchType === 'main' ? 2000 : branchType === 'branch' ? 1200 : 800;
  const statusMultiplier = status === 'active' ? 1 : status === 'inactive' ? 0.3 : 0.1;
  const totalOrders = Math.floor(baseOrderCount * statusMultiplier * randomFloat(0.7, 1.3));
  const avgOrderValue = randomFloat(15, 75);
  const totalRevenue = totalOrders * avgOrderValue;

  const branch: Branch = {
    _id: id,
    tenantId: overrides.tenantId || 'tenant123',
    name: branchName,
    code: branchCode,
    type: branchType,
    status: status,
    parentBranchId: overrides.parentBranchId || (branchType !== 'main' ? randomId() : undefined),
    address: {
      street: `${randomNumber(100, 9999)} ${randomChoice(streetNames)}`,
      city: city.name,
      state: city.state,
      postalCode: randomNumber(10000, 99999).toString(),
      country: city.country,
      ...overrides.address
    },
    contact: {
      phone: `+1-${randomNumber(100, 999)}-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
      email: `${branchCode.toLowerCase()}@example.com`,
      managerName: managerName,
      managerPhone: `+1-${randomNumber(100, 999)}-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
      ...overrides.contact
    },
    operations: {
      openTime: `${randomNumber(6, 9).toString().padStart(2, '0')}:00`,
      closeTime: `${randomNumber(20, 23).toString().padStart(2, '0')}:00`,
      timezone: randomChoice(timezones),
      daysOpen: randomBoolean() 
        ? daysOfWeek.slice(0, 6) // Monday to Saturday
        : daysOfWeek, // All days
      seatingCapacity: randomNumber(20, 150),
      deliveryRadius: randomNumber(3, 15),
      ...overrides.operations
    },
    financial: {
      currency: currency,
      taxRate: randomFloat(5, 12),
      serviceChargeRate: randomBoolean() ? randomFloat(10, 20) : undefined,
      tipEnabled: randomBoolean(),
      paymentMethods: randomChoice([
        ['cash', 'card'],
        ['cash', 'card', 'mobile'],
        ['card', 'mobile'],
        paymentMethods
      ]),
      ...overrides.financial
    },
    inventory: {
      trackInventory: randomBoolean(),
      lowStockAlertEnabled: randomBoolean(),
      autoReorderEnabled: randomBoolean(),
      ...overrides.inventory
    },
    menuConfig: {
      inheritFromParent: branchType !== 'main' && randomBoolean(),
      customPricing: randomBoolean(),
      ...overrides.menuConfig
    },
    staffing: {
      maxStaff: randomNumber(5, 30),
      currentStaff: randomNumber(3, 25),
      roles: randomChoice([
        roles.slice(0, 3),
        roles.slice(0, 5),
        roles
      ]),
      ...overrides.staffing
    },
    metrics: {
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      lastUpdated: new Date().toISOString(),
      ...overrides.metrics
    },
    integrations: {
      onlineOrderingEnabled: randomBoolean(),
      deliveryEnabled: randomBoolean(),
      loyaltyProgramEnabled: randomBoolean(),
      ...overrides.integrations
    },
    settings: {
      orderPrefix: branchCode.substring(0, 2),
      orderNumberSequence: randomNumber(1000, 9999),
      theme: randomChoice(['default', 'dark', 'blue', 'green']),
      logoUrl: randomBoolean() ? `https://example.com/logos/${id}.png` : undefined,
      ...overrides.settings
    },
    isActive: status === 'active',
    createdBy: overrides.createdBy || 'admin123',
    createdAt: overrides.createdAt || new Date(Date.now() - randomNumber(1, 365) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    ...overrides
  };

  return branch;
};

/**
 * Generate multiple mock branches
 */
export const createMockBranches = (count: number = 5, overrides: Partial<Branch>[] = []): Branch[] => {
  const branches: Branch[] = [];
  
  for (let i = 0; i < count; i++) {
    const override = overrides[i] || {};
    branches.push(createMockBranch(override));
  }

  return branches;
};

/**
 * Generate a branch hierarchy with parent-child relationships
 */
export const createMockBranchHierarchy = (depth: number = 2): BranchHierarchy[] => {
  const mainBranch = createMockBranch({ type: 'main', parentBranchId: undefined });
  
  const buildHierarchy = (parent: Branch, currentDepth: number): BranchHierarchy => {
    const children: BranchHierarchy[] = [];
    
    if (currentDepth > 0) {
      const childCount = randomNumber(1, 4);
      for (let i = 0; i < childCount; i++) {
        const childBranch = createMockBranch({
          type: 'branch',
          parentBranchId: parent._id,
          name: `${parent.name} - Branch ${i + 1}`
        });
        
        children.push(buildHierarchy(childBranch, currentDepth - 1));
      }
    }
    
    return {
      ...parent,
      children
    };
  };

  return [buildHierarchy(mainBranch, depth)];
};

/**
 * Generate branch metrics data
 */
export const createMockBranchMetrics = (overrides: Partial<BranchMetrics> = {}): BranchMetrics => {
  const totalOrders = randomNumber(500, 3000);
  const avgOrderValue = randomFloat(20, 80);
  const totalRevenue = totalOrders * avgOrderValue;
  const totalItems = totalOrders * randomNumber(1, 5);

  // Generate daily metrics for the last 30 days
  const dailyMetrics = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOrders = randomNumber(Math.floor(totalOrders / 40), Math.floor(totalOrders / 20));
    const dayRevenue = dayOrders * (avgOrderValue * randomFloat(0.8, 1.2));
    
    dailyMetrics.push({
      _id: date.toISOString().split('T')[0],
      date: date.toISOString(),
      orders: dayOrders,
      revenue: parseFloat(dayRevenue.toFixed(2)),
      avgOrderValue: parseFloat((dayRevenue / dayOrders).toFixed(2)),
      customers: randomNumber(Math.floor(dayOrders * 0.7), dayOrders),
      items: dayOrders * randomNumber(1, 4)
    });
  }

  return {
    summary: {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      totalItems,
      totalCustomers: randomNumber(Math.floor(totalOrders * 0.6), Math.floor(totalOrders * 0.9)),
      period: {
        startDate: dailyMetrics[0].date,
        endDate: dailyMetrics[dailyMetrics.length - 1].date
      }
    },
    daily: dailyMetrics,
    hourly: [], // Could be expanded if needed
    categories: [], // Could be expanded if needed
    ...overrides
  };
};

/**
 * Generate consolidated metrics for multiple branches
 */
export const createMockConsolidatedMetrics = (branches: Branch[]): ConsolidatedMetrics => {
  const branchMetrics = branches.map(branch => {
    const orders = branch.metrics.totalOrders;
    const revenue = branch.metrics.totalRevenue;
    const avgOrderValue = branch.metrics.avgOrderValue;

    return {
      branchId: branch._id,
      branchName: branch.name,
      branchCode: branch.code,
      branchType: branch.type,
      branchStatus: branch.status,
      orders,
      revenue,
      avgOrderValue,
      currency: branch.financial.currency
    };
  });

  const totals = branchMetrics.reduce((acc, branch) => ({
    totalOrders: acc.totalOrders + branch.orders,
    totalRevenue: acc.totalRevenue + branch.revenue,
    totalBranches: acc.totalBranches + 1,
    avgRevenuePerBranch: 0, // Will be calculated below
    avgOrdersPerBranch: 0, // Will be calculated below
    avgOrderValue: 0 // Will be calculated below
  }), {
    totalOrders: 0,
    totalRevenue: 0,
    totalBranches: 0,
    avgRevenuePerBranch: 0,
    avgOrdersPerBranch: 0,
    avgOrderValue: 0
  });

  totals.avgRevenuePerBranch = totals.totalRevenue / totals.totalBranches;
  totals.avgOrdersPerBranch = totals.totalOrders / totals.totalBranches;
  totals.avgOrderValue = totals.totalRevenue / totals.totalOrders;

  return {
    totals,
    branches: branchMetrics,
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }
  };
};

/**
 * Generate CreateBranchData for testing
 */
export const createMockCreateBranchData = (overrides: Partial<CreateBranchData> = {}): CreateBranchData => {
  const city = randomChoice(cities);
  const branchType = overrides.type || randomChoice(['branch', 'franchise']);
  
  return {
    name: `New ${city.name} Branch`,
    type: branchType,
    parentBranchId: branchType !== 'main' ? randomId() : undefined,
    address: {
      street: `${randomNumber(100, 999)} ${randomChoice(streetNames)}`,
      city: city.name,
      state: city.state,
      postalCode: randomNumber(10000, 99999).toString(),
      country: city.country
    },
    contact: {
      phone: `+1-${randomNumber(100, 999)}-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
      email: `new.branch@example.com`,
      managerName: `${randomChoice(managerFirstNames)} ${randomChoice(managerLastNames)}`
    },
    operations: {
      openTime: '08:00',
      closeTime: '22:00',
      timezone: randomChoice(timezones),
      daysOpen: daysOfWeek.slice(0, 6),
      seatingCapacity: randomNumber(30, 80)
    },
    financial: {
      currency: randomChoice(currencies),
      taxRate: 8.5,
      tipEnabled: true,
      paymentMethods: ['cash', 'card']
    },
    inventory: {
      trackInventory: true,
      lowStockAlertEnabled: true,
      autoReorderEnabled: false
    },
    staffing: {
      maxStaff: randomNumber(10, 25),
      roles: ['manager', 'server', 'cook']
    },
    integrations: {
      onlineOrderingEnabled: true
    },
    settings: {
      orderPrefix: city.name.substring(0, 2).toUpperCase(),
      theme: 'default'
    },
    ...overrides
  };
};

/**
 * Generate UpdateBranchData for testing
 */
export const createMockUpdateBranchData = (overrides: Partial<UpdateBranchData> = {}): UpdateBranchData => {
  return {
    name: `Updated Branch ${randomNumber(1, 100)}`,
    status: randomChoice(['active', 'inactive', 'suspended']),
    contact: {
      managerName: `${randomChoice(managerFirstNames)} ${randomChoice(managerLastNames)}`
    },
    operations: {
      seatingCapacity: randomNumber(20, 100)
    },
    ...overrides
  };
};

/**
 * Generate API response wrapper
 */
export const createMockApiResponse = <T>(data: T, success: boolean = true): BranchApiResponse<T> => {
  return {
    success,
    data: success ? data : undefined,
    error: success ? undefined : 'Mock API error',
    message: success ? 'Operation successful' : 'Operation failed',
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate realistic error responses
 */
export const createMockErrorResponse = (error: string): BranchApiResponse<never> => {
  return {
    success: false,
    error,
    message: 'Operation failed',
    timestamp: new Date().toISOString()
  };
};

/**
 * Common error scenarios for testing
 */
export const mockErrorScenarios = {
  notFound: () => createMockErrorResponse('Branch not found'),
  unauthorized: () => createMockErrorResponse('Unauthorized access'),
  validationError: () => createMockErrorResponse('Validation failed: Missing required fields'),
  serverError: () => createMockErrorResponse('Internal server error'),
  networkError: () => createMockErrorResponse('Network connection failed'),
  quotaExceeded: () => createMockErrorResponse('Branch quota exceeded for this tenant'),
  invalidData: () => createMockErrorResponse('Invalid branch data provided'),
  duplicateCode: () => createMockErrorResponse('Branch code already exists'),
  parentNotFound: () => createMockErrorResponse('Parent branch not found'),
  hasChildBranches: () => createMockErrorResponse('Cannot delete branch with active child branches'),
  hasActiveOrders: () => createMockErrorResponse('Cannot delete branch with active orders')
};

/**
 * Preset branch configurations for common test scenarios
 */
export const branchPresets = {
  mainBranch: () => createMockBranch({
    type: 'main',
    status: 'active',
    parentBranchId: undefined,
    name: 'Main Branch'
  }),
  
  activeBranch: () => createMockBranch({
    type: 'branch',
    status: 'active'
  }),
  
  inactiveBranch: () => createMockBranch({
    type: 'branch',
    status: 'inactive'
  }),
  
  suspendedBranch: () => createMockBranch({
    type: 'branch',
    status: 'suspended'
  }),
  
  franchiseBranch: () => createMockBranch({
    type: 'franchise',
    status: 'active'
  }),
  
  highPerformingBranch: () => createMockBranch({
    metrics: {
      totalOrders: 5000,
      totalRevenue: 250000,
      avgOrderValue: 50,
      lastUpdated: new Date().toISOString()
    }
  }),
  
  newBranch: () => createMockBranch({
    createdAt: new Date().toISOString(),
    metrics: {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      lastUpdated: new Date().toISOString()
    }
  })
};

/**
 * Generate test user data for branch access testing
 */
export const createMockUser = (overrides: any = {}) => ({
  id: randomId(),
  tenantId: 'tenant123',
  role: 'admin' as const,
  assignedBranches: [randomId(), randomId()],
  currentBranch: randomId(),
  ...overrides
});

/**
 * Generate filter scenarios for testing
 */
export const filterScenarios = {
  activeOnly: (): BranchFilters => ({ status: 'active' }),
  branchesOnly: (): BranchFilters => ({ type: 'branch' }),
  searchQuery: (): BranchFilters => ({ search: 'downtown' }),
  combinedFilter: (): BranchFilters => ({ 
    status: 'active', 
    type: 'branch', 
    search: 'main' 
  }),
  includeInactive: (): BranchFilters => ({ includeInactive: true })
};
/**
 * Branch Management Mock API Setup using MSW (Mock Service Worker)
 * Provides realistic API mocking for branch management endpoints
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import {
  Branch,
  BranchHierarchy,
  CreateBranchData,
  UpdateBranchData,
  BranchFilters,
  BranchApiResponse
} from '@/types/branch.types';

import {
  createMockBranch,
  createMockBranches,
  createMockBranchHierarchy,
  createMockBranchMetrics,
  createMockConsolidatedMetrics,
  createMockApiResponse,
  mockErrorScenarios,
  branchPresets
} from './branchMockData';

// In-memory store for mock data
class MockBranchStore {
  private branches: Branch[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create some default branches for testing
    this.branches = [
      branchPresets.mainBranch(),
      branchPresets.activeBranch(),
      branchPresets.inactiveBranch(),
      branchPresets.franchiseBranch(),
      branchPresets.highPerformingBranch()
    ];
  }

  getAllBranches(filters?: BranchFilters): Branch[] {
    let filtered = [...this.branches];

    // Apply filters
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(branch => branch.status === filters.status);
      }

      if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(branch => branch.type === filters.type);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(branch =>
          branch.name.toLowerCase().includes(searchTerm) ||
          branch.code.toLowerCase().includes(searchTerm) ||
          branch.contact.email.toLowerCase().includes(searchTerm) ||
          branch.address.city.toLowerCase().includes(searchTerm) ||
          branch.address.state.toLowerCase().includes(searchTerm)
        );
      }

      if (!filters.includeInactive) {
        filtered = filtered.filter(branch => branch.status !== 'inactive');
      }
    }

    return filtered;
  }

  getBranchById(id: string): Branch | undefined {
    return this.branches.find(branch => branch._id === id);
  }

  createBranch(data: CreateBranchData): Branch {
    const newBranch = createMockBranch({
      _id: `branch_${this.nextId++}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.branches.push(newBranch);
    return newBranch;
  }

  updateBranch(id: string, data: UpdateBranchData): Branch | undefined {
    const branchIndex = this.branches.findIndex(branch => branch._id === id);
    if (branchIndex === -1) return undefined;

    const updatedBranch = {
      ...this.branches[branchIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.branches[branchIndex] = updatedBranch;
    return updatedBranch;
  }

  deleteBranch(id: string): boolean {
    const branchIndex = this.branches.findIndex(branch => branch._id === id);
    if (branchIndex === -1) return false;

    // Check for child branches
    const hasChildren = this.branches.some(branch => branch.parentBranchId === id);
    if (hasChildren) {
      throw new Error('Cannot delete branch with active child branches');
    }

    this.branches.splice(branchIndex, 1);
    return true;
  }

  cloneBranch(sourceId: string, data: CreateBranchData): Branch | undefined {
    const sourceBranch = this.getBranchById(sourceId);
    if (!sourceBranch) return undefined;

    const clonedBranch = createMockBranch({
      _id: `branch_${this.nextId++}`,
      ...sourceBranch,
      ...data,
      _id: `branch_${this.nextId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.branches.push(clonedBranch);
    return clonedBranch;
  }

  getBranchHierarchy(): BranchHierarchy[] {
    // Build hierarchy from flat structure
    const branchMap = new Map<string, BranchHierarchy>();
    const rootBranches: BranchHierarchy[] = [];

    // Initialize all branches with empty children arrays
    this.branches.forEach(branch => {
      branchMap.set(branch._id, { ...branch, children: [] });
    });

    // Build parent-child relationships
    this.branches.forEach(branch => {
      const hierarchyBranch = branchMap.get(branch._id)!;
      
      if (branch.parentBranchId && branchMap.has(branch.parentBranchId)) {
        const parent = branchMap.get(branch.parentBranchId)!;
        parent.children.push(hierarchyBranch);
      } else {
        rootBranches.push(hierarchyBranch);
      }
    });

    return rootBranches;
  }

  assignUserToBranch(branchId: string, userId: string): boolean {
    // Mock implementation - just verify branch exists
    return this.getBranchById(branchId) !== undefined;
  }

  removeUserFromBranch(branchId: string, userId: string): boolean {
    // Mock implementation - just verify branch exists
    return this.getBranchById(branchId) !== undefined;
  }

  switchBranch(branchId: string): string | undefined {
    const branch = this.getBranchById(branchId);
    return branch ? branchId : undefined;
  }

  updateMultipleBranches(updates: Array<{ branchId: string; data: UpdateBranchData }>): Branch[] {
    const updatedBranches: Branch[] = [];

    updates.forEach(({ branchId, data }) => {
      const updated = this.updateBranch(branchId, data);
      if (updated) {
        updatedBranches.push(updated);
      }
    });

    return updatedBranches;
  }

  reset() {
    this.branches = [];
    this.nextId = 1;
    this.initializeDefaultData();
  }
}

// Global store instance
const mockStore = new MockBranchStore();

// Configuration for different test scenarios
interface MockConfig {
  simulateDelay?: boolean;
  delayMs?: number;
  simulateErrors?: boolean;
  errorRate?: number; // 0-1
  networkError?: boolean;
}

let currentConfig: MockConfig = {
  simulateDelay: false,
  delayMs: 100,
  simulateErrors: false,
  errorRate: 0.1,
  networkError: false
};

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldSimulateError = (): boolean => {
  return currentConfig.simulateErrors && Math.random() < (currentConfig.errorRate || 0.1);
};

const simulateNetworkDelay = async () => {
  if (currentConfig.simulateDelay) {
    await delay(currentConfig.delayMs || 100);
  }
};

const handleRequest = async (handler: () => any) => {
  await simulateNetworkDelay();

  if (currentConfig.networkError) {
    return HttpResponse.error();
  }

  if (shouldSimulateError()) {
    return HttpResponse.json(
      mockErrorScenarios.serverError(),
      { status: 500 }
    );
  }

  try {
    const result = await handler();
    return HttpResponse.json(createMockApiResponse(result));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return HttpResponse.json(
      createMockApiResponse(null, false),
      { status: 400 }
    );
  }
};

// API route handlers
const branchHandlers = [
  // GET /api/branches - Get all branches with optional filtering
  http.get('/api/branches', async ({ request }) => {
    return handleRequest(() => {
      const url = new URL(request.url);
      const filters: BranchFilters = {};

      // Parse query parameters
      const status = url.searchParams.get('status');
      const type = url.searchParams.get('type');
      const search = url.searchParams.get('search');
      const includeInactive = url.searchParams.get('includeInactive') === 'true';

      if (status) filters.status = status as any;
      if (type) filters.type = type as any;
      if (search) filters.search = search;
      if (includeInactive) filters.includeInactive = true;

      return mockStore.getAllBranches(filters);
    });
  }),

  // GET /api/branches/hierarchy - Get branch hierarchy
  http.get('/api/branches/hierarchy', () => {
    return handleRequest(() => {
      return mockStore.getBranchHierarchy();
    });
  }),

  // GET /api/branches/:id - Get specific branch
  http.get('/api/branches/:id', ({ params }) => {
    return handleRequest(() => {
      const { id } = params;
      const branch = mockStore.getBranchById(id as string);
      
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      return branch;
    });
  }),

  // POST /api/branches - Create new branch
  http.post('/api/branches', async ({ request }) => {
    return handleRequest(async () => {
      const data = await request.json() as CreateBranchData;
      
      // Validate required fields
      if (!data.name || !data.type) {
        throw new Error('Name and type are required');
      }

      // Check for duplicate codes if provided
      if (data.code) {
        const existing = mockStore.getAllBranches().find(b => b.code === data.code);
        if (existing) {
          throw new Error('Branch code already exists');
        }
      }

      return mockStore.createBranch(data);
    });
  }),

  // PUT /api/branches/:id - Update branch
  http.put('/api/branches/:id', async ({ params, request }) => {
    return handleRequest(async () => {
      const { id } = params;
      const data = await request.json() as UpdateBranchData;
      
      const updated = mockStore.updateBranch(id as string, data);
      if (!updated) {
        throw new Error('Branch not found');
      }
      
      return updated;
    });
  }),

  // DELETE /api/branches/:id - Delete branch
  http.delete('/api/branches/:id', ({ params }) => {
    return handleRequest(() => {
      const { id } = params;
      const deleted = mockStore.deleteBranch(id as string);
      
      if (!deleted) {
        throw new Error('Branch not found');
      }
      
      return { success: true };
    });
  }),

  // POST /api/branches/:id/clone - Clone branch
  http.post('/api/branches/:sourceId/clone', async ({ params, request }) => {
    return handleRequest(async () => {
      const { sourceId } = params;
      const data = await request.json() as CreateBranchData;
      
      const cloned = mockStore.cloneBranch(sourceId as string, data);
      if (!cloned) {
        throw new Error('Source branch not found');
      }
      
      return cloned;
    });
  }),

  // POST /api/branches/:id/assign - Assign user to branch
  http.post('/api/branches/:branchId/assign', async ({ params, request }) => {
    return handleRequest(async () => {
      const { branchId } = params;
      const { userId } = await request.json() as { userId: string };
      
      const success = mockStore.assignUserToBranch(branchId as string, userId);
      if (!success) {
        throw new Error('Branch not found');
      }
      
      return { success: true };
    });
  }),

  // DELETE /api/branches/:branchId/users/:userId - Remove user from branch
  http.delete('/api/branches/:branchId/users/:userId', ({ params }) => {
    return handleRequest(() => {
      const { branchId, userId } = params;
      
      const success = mockStore.removeUserFromBranch(branchId as string, userId as string);
      if (!success) {
        throw new Error('Branch not found');
      }
      
      return { success: true };
    });
  }),

  // POST /api/branches/switch - Switch current branch
  http.post('/api/branches/switch', async ({ request }) => {
    return handleRequest(async () => {
      const { branchId } = await request.json() as { branchId: string };
      
      const currentBranch = mockStore.switchBranch(branchId);
      if (!currentBranch) {
        throw new Error('Branch not found');
      }
      
      return { currentBranch };
    });
  }),

  // GET /api/branches/:id/metrics - Get branch metrics
  http.get('/api/branches/:id/metrics', ({ params, request }) => {
    return handleRequest(() => {
      const { id } = params;
      const branch = mockStore.getBranchById(id as string);
      
      if (!branch) {
        throw new Error('Branch not found');
      }

      const url = new URL(request.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      
      return createMockBranchMetrics();
    });
  }),

  // GET /api/branches/metrics/consolidated - Get consolidated metrics
  http.get('/api/branches/metrics/consolidated', ({ request }) => {
    return handleRequest(() => {
      const branches = mockStore.getAllBranches();
      return createMockConsolidatedMetrics(branches);
    });
  }),

  // PUT /api/branches/bulk - Update multiple branches
  http.put('/api/branches/bulk', async ({ request }) => {
    return handleRequest(async () => {
      const updates = await request.json() as Array<{ branchId: string; data: UpdateBranchData }>;
      return mockStore.updateMultipleBranches(updates);
    });
  })
];

// Create MSW server
export const branchMockServer = setupServer(...branchHandlers);

// Configuration functions for tests
export const configureMockApi = (config: Partial<MockConfig>) => {
  currentConfig = { ...currentConfig, ...config };
};

export const resetMockApi = () => {
  currentConfig = {
    simulateDelay: false,
    delayMs: 100,
    simulateErrors: false,
    errorRate: 0.1,
    networkError: false
  };
  mockStore.reset();
};

// Helper functions for tests
export const getMockStore = () => mockStore;

export const seedMockData = (branches: Branch[]) => {
  mockStore.reset();
  branches.forEach(branch => {
    mockStore.createBranch({
      name: branch.name,
      type: branch.type,
      parentBranchId: branch.parentBranchId,
      address: branch.address,
      contact: branch.contact,
      operations: branch.operations,
      financial: branch.financial,
      inventory: branch.inventory,
      staffing: branch.staffing,
      integrations: branch.integrations,
      settings: branch.settings
    });
  });
};

// Pre-configured test scenarios
export const testScenarios = {
  // Normal operation with realistic delays
  normal: () => configureMockApi({
    simulateDelay: true,
    delayMs: 50,
    simulateErrors: false,
    networkError: false
  }),

  // Slow network conditions
  slowNetwork: () => configureMockApi({
    simulateDelay: true,
    delayMs: 2000,
    simulateErrors: false,
    networkError: false
  }),

  // Intermittent errors
  unreliable: () => configureMockApi({
    simulateDelay: true,
    delayMs: 100,
    simulateErrors: true,
    errorRate: 0.3,
    networkError: false
  }),

  // Complete network failure
  offline: () => configureMockApi({
    simulateDelay: false,
    delayMs: 0,
    simulateErrors: false,
    networkError: true
  }),

  // High error rate for error handling testing
  errorProne: () => configureMockApi({
    simulateDelay: false,
    delayMs: 0,
    simulateErrors: true,
    errorRate: 0.8,
    networkError: false
  }),

  // Fast, reliable for unit tests
  instant: () => configureMockApi({
    simulateDelay: false,
    delayMs: 0,
    simulateErrors: false,
    networkError: false
  })
};

// Specific error scenario handlers
export const mockSpecificErrors = {
  branchNotFound: (branchId: string) => {
    branchHandlers.push(
      http.get(`/api/branches/${branchId}`, () => {
        return HttpResponse.json(
          mockErrorScenarios.notFound(),
          { status: 404 }
        );
      })
    );
  },

  unauthorized: () => {
    branchHandlers.push(
      http.get('/api/branches', () => {
        return HttpResponse.json(
          mockErrorScenarios.unauthorized(),
          { status: 401 }
        );
      })
    );
  },

  validationError: () => {
    branchHandlers.push(
      http.post('/api/branches', () => {
        return HttpResponse.json(
          mockErrorScenarios.validationError(),
          { status: 400 }
        );
      })
    );
  }
};

export default branchMockServer;
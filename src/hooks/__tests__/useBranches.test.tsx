/**
 * Branch Management Hooks Unit Tests
 * Comprehensive test suite for useBranches and related hooks
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';

import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useBranchHierarchy, useBranch, useBranchMetrics, useConsolidatedMetrics, useBatchBranchOperations } from '@/hooks/useBranches';
import { BranchService } from '@/services/branch.service';
import {
  Branch,
  BranchHierarchy,
  CreateBranchData,
  UpdateBranchData,
  BranchFilters
} from '@/types/branch.types';

// Mock dependencies
vi.mock('@/services/branch.service');
vi.mock('@/contexts/AuthContext');

const mockBranchService = vi.mocked(BranchService);
const mockUseAuth = vi.mocked(useAuth);

// Mock data
const mockUser = {
  id: 'user123',
  tenantId: 'tenant123',
  role: 'admin' as const,
  assignedBranches: ['branch1', 'branch2', 'branch3'],
  currentBranch: 'branch1'
};

const mockBranch: Branch = {
  _id: 'branch1',
  tenantId: 'tenant123',
  name: 'Main Branch',
  code: 'MB001',
  type: 'main',
  status: 'active',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA'
  },
  contact: {
    phone: '+1-555-0123',
    email: 'main@example.com',
    managerName: 'John Manager'
  },
  operations: {
    openTime: '08:00',
    closeTime: '22:00',
    timezone: 'America/New_York',
    daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
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
    totalOrders: 1250,
    totalRevenue: 44375.00,
    lastUpdated: '2024-01-15T10:00:00.000Z'
  },
  integrations: {
    onlineOrderingEnabled: true
  },
  settings: {
    orderPrefix: 'MB',
    orderNumberSequence: 1001,
    logoUrl: 'https://example.com/logo.png'
  },
  isActive: true,
  createdBy: 'admin123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z'
};

const mockBranches: Branch[] = [
  mockBranch,
  {
    ...mockBranch,
    _id: 'branch2',
    name: 'Downtown Branch',
    code: 'DB001',
    type: 'branch',
    status: 'active'
  },
  {
    ...mockBranch,
    _id: 'branch3',
    name: 'Airport Branch',
    code: 'AB001',
    type: 'branch',
    status: 'inactive'
  }
];

const mockHierarchy: BranchHierarchy[] = [
  {
    ...mockBranch,
    children: [
      { ...mockBranches[1], children: [] },
      { ...mockBranches[2], children: [] }
    ]
  }
];

const mockMetrics = {
  summary: {
    totalOrders: 1000,
    totalRevenue: 50000,
    avgOrderValue: 50,
    totalItems: 2500
  },
  daily: [
    { _id: '2024-01-01', orders: 50, revenue: 2500 },
    { _id: '2024-01-02', orders: 45, revenue: 2250 }
  ]
};

const mockConsolidatedMetrics = {
  totals: {
    totalOrders: 5000,
    totalRevenue: 250000,
    totalBranches: 3,
    avgRevenuePerBranch: 83333,
    avgOrdersPerBranch: 1667
  },
  branches: [
    {
      branchId: 'branch1',
      branchName: 'Main Branch',
      branchCode: 'MB001',
      orders: 2000,
      revenue: 100000,
      avgOrderValue: 50
    }
  ]
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBranches Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockBranchService.getBranches.mockResolvedValue(mockBranches);
    mockBranchService.createBranch.mockResolvedValue(mockBranch);
    mockBranchService.updateBranch.mockResolvedValue(mockBranch);
    mockBranchService.deleteBranch.mockResolvedValue();
    mockBranchService.cloneBranch.mockResolvedValue(mockBranch);
    mockBranchService.switchBranch.mockResolvedValue('branch2');
    mockBranchService.assignUserToBranch.mockResolvedValue();
    mockBranchService.removeUserFromBranch.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State and Data Fetching', () => {
    it('should initialize with empty branches when loading', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.branches).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should fetch branches successfully', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.branches).toEqual(mockBranches);
      expect(result.current.error).toBe(null);
      expect(mockBranchService.getBranches).toHaveBeenCalledTimes(1);
    });

    it('should apply filters to the query', async () => {
      const filters: BranchFilters = { status: 'active', type: 'branch' };
      const { result } = renderHook(() => useBranches(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockBranchService.getBranches).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch branches');
      mockBranchService.getBranches.mockRejectedValue(error);

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.branches).toEqual([]);
    });

    it('should not fetch when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      renderHook(() => useBranches(), { wrapper });

      expect(mockBranchService.getBranches).not.toHaveBeenCalled();
    });
  });

  describe('Current Branch Management', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, currentBranch: 'branch1' } 
      });
    });

    it('should return current branch', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentBranch).toEqual(mockBranch);
    });

    it('should return undefined when no current branch is set', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, currentBranch: undefined } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentBranch).toBeUndefined();
    });

    it('should return undefined when current branch is not found', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, currentBranch: 'nonexistent' } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentBranch).toBeUndefined();
    });
  });

  describe('User Assigned Branches', () => {
    it('should return all branches for admin users', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'admin' } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userAssignedBranches).toEqual(mockBranches);
    });

    it('should return all branches for superadmin users', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'superadmin' } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userAssignedBranches).toEqual(mockBranches);
    });

    it('should return only assigned branches for regular users', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user', 
          assignedBranches: ['branch1', 'branch2']
        } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userAssignedBranches).toEqual([
        mockBranches[0],
        mockBranches[1]
      ]);
    });

    it('should return empty array when user has no assigned branches', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user', 
          assignedBranches: []
        } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userAssignedBranches).toEqual([]);
    });
  });

  describe('Permission Helpers', () => {
    it('should allow admin to access any branch', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'admin' } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserAccessBranch('any-branch-id')).toBe(true);
    });

    it('should allow superadmin to access any branch', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'superadmin' } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserAccessBranch('any-branch-id')).toBe(true);
    });

    it('should restrict regular users to assigned branches', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user', 
          assignedBranches: ['branch1']
        } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserAccessBranch('branch1')).toBe(true);
      expect(result.current.canUserAccessBranch('branch2')).toBe(false);
    });

    it('should return false when no user is authenticated', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserAccessBranch('branch1')).toBe(false);
    });

    it('should determine branch switching capability', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user', 
          assignedBranches: ['branch1', 'branch2']
        } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserSwitchBranches()).toBe(true);
    });

    it('should not allow switching when user has only one branch', async () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user', 
          assignedBranches: ['branch1']
        } 
      });

      const { result } = renderHook(() => useBranches(), { wrapper });

      expect(result.current.canUserSwitchBranches()).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    describe('Create Branch', () => {
      it('should create branch successfully', async () => {
        const createData: CreateBranchData = {
          name: 'New Branch',
          type: 'branch',
          address: {
            street: '456 Oak St',
            city: 'Boston',
            state: 'MA',
            postalCode: '02101',
            country: 'USA'
          },
          contact: {
            phone: '+1-555-0456',
            email: 'boston@example.com'
          }
        };

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.createBranch(createData);
        });

        expect(mockBranchService.createBranch).toHaveBeenCalledWith(createData);
        expect(result.current.isCreating).toBe(false);
      });

      it('should handle create errors', async () => {
        const error = new Error('Failed to create branch');
        mockBranchService.createBranch.mockRejectedValue(error);

        const createData: CreateBranchData = {
          name: 'New Branch',
          type: 'branch',
          address: {
            street: '456 Oak St',
            city: 'Boston',
            state: 'MA',
            postalCode: '02101',
            country: 'USA'
          },
          contact: {
            phone: '+1-555-0456',
            email: 'boston@example.com'
          }
        };

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await expect(async () => {
          await act(async () => {
            await result.current.createBranch(createData);
          });
        }).rejects.toThrow('Failed to create branch');
      });
    });

    describe('Update Branch', () => {
      it('should update branch successfully', async () => {
        const updateData: UpdateBranchData = { name: 'Updated Name' };

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.updateBranch({ branchId: 'branch1', data: updateData });
        });

        expect(mockBranchService.updateBranch).toHaveBeenCalledWith('branch1', updateData);
      });

      it('should handle update errors', async () => {
        const error = new Error('Failed to update branch');
        mockBranchService.updateBranch.mockRejectedValue(error);

        const updateData: UpdateBranchData = { name: 'Updated Name' };

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await expect(async () => {
          await act(async () => {
            await result.current.updateBranch({ branchId: 'branch1', data: updateData });
          });
        }).rejects.toThrow('Failed to update branch');
      });
    });

    describe('Delete Branch', () => {
      it('should delete branch successfully', async () => {
        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.deleteBranch('branch1');
        });

        expect(mockBranchService.deleteBranch).toHaveBeenCalledWith('branch1');
      });

      it('should handle delete errors', async () => {
        const error = new Error('Failed to delete branch');
        mockBranchService.deleteBranch.mockRejectedValue(error);

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await expect(async () => {
          await act(async () => {
            await result.current.deleteBranch('branch1');
          });
        }).rejects.toThrow('Failed to delete branch');
      });
    });

    describe('Clone Branch', () => {
      it('should clone branch successfully', async () => {
        const cloneData: CreateBranchData = {
          name: 'Cloned Branch',
          type: 'branch',
          address: mockBranch.address,
          contact: mockBranch.contact
        };

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.cloneBranch({ sourceBranchId: 'branch1', data: cloneData });
        });

        expect(mockBranchService.cloneBranch).toHaveBeenCalledWith('branch1', cloneData);
      });
    });

    describe('Switch Branch', () => {
      it('should switch branch successfully', async () => {
        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.switchBranch('branch2');
        });

        expect(mockBranchService.switchBranch).toHaveBeenCalledWith('branch2');
      });

      it('should update localStorage on successful switch', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
        getItemSpy.mockReturnValue(JSON.stringify(mockUser));

        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.switchBranch('branch2');
        });

        expect(setItemSpy).toHaveBeenCalledWith(
          'user',
          JSON.stringify({ ...mockUser, currentBranch: 'branch2' })
        );

        setItemSpy.mockRestore();
        getItemSpy.mockRestore();
      });
    });

    describe('User Assignment', () => {
      it('should assign user to branch successfully', async () => {
        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.assignUserToBranch({ branchId: 'branch1', userId: 'user123' });
        });

        expect(mockBranchService.assignUserToBranch).toHaveBeenCalledWith('branch1', 'user123');
      });

      it('should remove user from branch successfully', async () => {
        const { result } = renderHook(() => useBranches(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.removeUserFromBranch({ branchId: 'branch1', userId: 'user123' });
        });

        expect(mockBranchService.removeUserFromBranch).toHaveBeenCalledWith('branch1', 'user123');
      });
    });
  });

  describe('Utility Functions', () => {
    it('should return active branches', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeBranches = result.current.getActiveBranches();
      expect(activeBranches).toHaveLength(2);
      expect(activeBranches.every(branch => branch.status === 'active')).toBe(true);
    });

    it('should return branches by type', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mainBranches = result.current.getBranchesByType('main');
      expect(mainBranches).toHaveLength(1);
      expect(mainBranches[0].type).toBe('main');

      const regularBranches = result.current.getBranchesByType('branch');
      expect(regularBranches).toHaveLength(2);
      expect(regularBranches.every(branch => branch.type === 'branch')).toBe(true);
    });
  });

  describe('Mutation States', () => {
    it('should track loading states correctly', async () => {
      let createResolver: (value: Branch) => void;
      const createPromise = new Promise<Branch>((resolve) => {
        createResolver = resolve;
      });
      mockBranchService.createBranch.mockReturnValue(createPromise);

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createData: CreateBranchData = {
        name: 'New Branch',
        type: 'branch',
        address: mockBranch.address,
        contact: mockBranch.contact
      };

      // Start create operation
      act(() => {
        result.current.createBranch(createData);
      });

      // Should be in creating state
      expect(result.current.isCreating).toBe(true);

      // Resolve the promise
      act(() => {
        createResolver!(mockBranch);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors correctly', async () => {
      const authError = new Error('Unauthorized');
      mockBranchService.getBranches.mockRejectedValue(authError);

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(authError);
    });

    it('should handle network errors correctly', async () => {
      const networkError = new Error('Network error');
      mockBranchService.getBranches.mockRejectedValue(networkError);

      const { result } = renderHook(() => useBranches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(networkError);
    });
  });
});

describe('useBranchHierarchy Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockBranchService.getBranchHierarchy.mockResolvedValue(mockHierarchy);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch branch hierarchy successfully', async () => {
    const { result } = renderHook(() => useBranchHierarchy(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockHierarchy);
    expect(mockBranchService.getBranchHierarchy).toHaveBeenCalledTimes(1);
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderHook(() => useBranchHierarchy(), { wrapper });

    expect(mockBranchService.getBranchHierarchy).not.toHaveBeenCalled();
  });

  it('should handle hierarchy fetch errors', async () => {
    const error = new Error('Failed to fetch hierarchy');
    mockBranchService.getBranchHierarchy.mockRejectedValue(error);

    const { result } = renderHook(() => useBranchHierarchy(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(error);
  });
});

describe('useBranch Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockBranchService.getBranchById.mockResolvedValue(mockBranch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single branch successfully', async () => {
    const { result } = renderHook(() => useBranch('branch1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBranch);
    expect(mockBranchService.getBranchById).toHaveBeenCalledWith('branch1');
  });

  it('should not fetch when branchId is empty', () => {
    renderHook(() => useBranch(''), { wrapper });

    expect(mockBranchService.getBranchById).not.toHaveBeenCalled();
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderHook(() => useBranch('branch1'), { wrapper });

    expect(mockBranchService.getBranchById).not.toHaveBeenCalled();
  });
});

describe('useBranchMetrics Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockBranchService.getBranchMetrics.mockResolvedValue(mockMetrics);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch branch metrics successfully', async () => {
    const { result } = renderHook(() => useBranchMetrics('branch1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockMetrics);
    expect(mockBranchService.getBranchMetrics).toHaveBeenCalledWith('branch1', undefined, undefined);
  });

  it('should fetch metrics with date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const { result } = renderHook(() => useBranchMetrics('branch1', startDate, endDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockBranchService.getBranchMetrics).toHaveBeenCalledWith('branch1', startDate, endDate);
  });

  it('should not fetch when branchId is empty', () => {
    renderHook(() => useBranchMetrics(''), { wrapper });

    expect(mockBranchService.getBranchMetrics).not.toHaveBeenCalled();
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderHook(() => useBranchMetrics('branch1'), { wrapper });

    expect(mockBranchService.getBranchMetrics).not.toHaveBeenCalled();
  });
});

describe('useConsolidatedMetrics Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockBranchService.getConsolidatedMetrics.mockResolvedValue(mockConsolidatedMetrics);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch consolidated metrics successfully', async () => {
    const { result } = renderHook(() => useConsolidatedMetrics(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockConsolidatedMetrics);
    expect(mockBranchService.getConsolidatedMetrics).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should fetch metrics with date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const { result } = renderHook(() => useConsolidatedMetrics(startDate, endDate), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockBranchService.getConsolidatedMetrics).toHaveBeenCalledWith(startDate, endDate);
  });

  it('should not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderHook(() => useConsolidatedMetrics(), { wrapper });

    expect(mockBranchService.getConsolidatedMetrics).not.toHaveBeenCalled();
  });
});

describe('useBatchBranchOperations Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
    mockBranchService.updateMultipleBranches.mockResolvedValue([mockBranch]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update multiple branches successfully', async () => {
    const { result } = renderHook(() => useBatchBranchOperations(), { wrapper });

    const updates = [
      { branchId: 'branch1', data: { name: 'Updated Branch 1' } },
      { branchId: 'branch2', data: { name: 'Updated Branch 2' } }
    ];

    await act(async () => {
      await result.current.updateMultipleBranches(updates);
    });

    expect(mockBranchService.updateMultipleBranches).toHaveBeenCalledWith(updates);
  });

  it('should handle batch update errors', async () => {
    const error = new Error('Batch update failed');
    mockBranchService.updateMultipleBranches.mockRejectedValue(error);

    const { result } = renderHook(() => useBatchBranchOperations(), { wrapper });

    const updates = [
      { branchId: 'branch1', data: { name: 'Updated Branch 1' } }
    ];

    await expect(async () => {
      await act(async () => {
        await result.current.updateMultipleBranches(updates);
      });
    }).rejects.toThrow('Batch update failed');
  });

  it('should track batch update loading state', async () => {
    let updateResolver: (value: Branch[]) => void;
    const updatePromise = new Promise<Branch[]>((resolve) => {
      updateResolver = resolve;
    });
    mockBranchService.updateMultipleBranches.mockReturnValue(updatePromise);

    const { result } = renderHook(() => useBatchBranchOperations(), { wrapper });

    const updates = [
      { branchId: 'branch1', data: { name: 'Updated Branch 1' } }
    ];

    // Start update operation
    act(() => {
      result.current.updateMultipleBranches(updates);
    });

    // Should be in updating state
    expect(result.current.isUpdatingMultiple).toBe(true);

    // Resolve the promise
    act(() => {
      updateResolver!([mockBranch]);
    });

    await waitFor(() => {
      expect(result.current.isUpdatingMultiple).toBe(false);
    });
  });
});
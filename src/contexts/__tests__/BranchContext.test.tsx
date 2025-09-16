/**
 * Branch Context Unit Tests
 * Comprehensive test suite for BranchProvider and related context hooks
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor, act, screen } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useAuth } from '@/contexts/AuthContext';
import { 
  BranchProvider, 
  useBranchContext, 
  useFilteredBranches,
  useActiveBranches,
  useBranchesByType,
  useCanManageBranches,
  useUserBranches,
  useCanSwitchBranches,
  withBranchContext
} from '@/contexts/BranchContext';
import { useBranches, useBranchHierarchy } from '@/hooks/useBranches';
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
vi.mock('@/hooks/useBranches');

const mockBranchService = vi.mocked(BranchService);
const mockUseAuth = vi.mocked(useAuth);
const mockUseBranches = vi.mocked(useBranches);
const mockUseBranchHierarchy = vi.mocked(useBranchHierarchy);

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

// Create test wrapper with QueryClient
const createWrapper = (defaultFilters?: BranchFilters) => {
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
    <QueryClientProvider client={queryClient}>
      <BranchProvider defaultFilters={defaultFilters}>
        {children}
      </BranchProvider>
    </QueryClientProvider>
  );
};

// Mock branch hook return values
const createMockBranchesHook = (overrides = {}) => ({
  branches: mockBranches,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  currentBranch: mockBranches[0],
  userAssignedBranches: mockBranches,
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deleteBranch: vi.fn(),
  cloneBranch: vi.fn(),
  switchBranch: vi.fn(),
  assignUserToBranch: vi.fn(),
  removeUserFromBranch: vi.fn(),
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isCloning: false,
  isSwitching: false,
  isAssigning: false,
  isRemoving: false,
  canUserAccessBranch: vi.fn().mockReturnValue(true),
  canUserSwitchBranches: vi.fn().mockReturnValue(true),
  getActiveBranches: vi.fn().mockReturnValue(mockBranches.filter(b => b.status === 'active')),
  getBranchesByType: vi.fn().mockImplementation((type) => 
    mockBranches.filter(b => b.type === type)
  ),
  ...overrides
});

const createMockHierarchyHook = (overrides = {}) => ({
  data: mockHierarchy,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides
});

describe('BranchContext', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseBranches.mockReturnValue(createMockBranchesHook());
    mockUseBranchHierarchy.mockReturnValue(createMockHierarchyHook());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BranchProvider', () => {
    it('should provide branch context to children', () => {
      const TestComponent = () => {
        const context = useBranchContext();
        return <div data-testid="context-data">{JSON.stringify({
          branchCount: context.branches.length,
          hasCurrentBranch: !!context.currentBranch,
          loading: context.loading
        })}</div>;
      };

      render(
        <QueryClientProvider client={new QueryClient()}>
          <BranchProvider>
            <TestComponent />
          </BranchProvider>
        </QueryClientProvider>
      );

      const contextData = JSON.parse(screen.getByTestId('context-data').textContent!);
      expect(contextData.branchCount).toBe(3);
      expect(contextData.hasCurrentBranch).toBe(true);
      expect(contextData.loading).toBe(false);
    });

    it('should pass default filters to useBranches hook', () => {
      const defaultFilters: BranchFilters = { status: 'active', type: 'branch' };
      
      const TestComponent = () => {
        useBranchContext();
        return <div>Test</div>;
      };

      render(
        <QueryClientProvider client={new QueryClient()}>
          <BranchProvider defaultFilters={defaultFilters}>
            <TestComponent />
          </BranchProvider>
        </QueryClientProvider>
      );

      expect(mockUseBranches).toHaveBeenCalledWith(defaultFilters);
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useBranchContext();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useBranchContext must be used within a BranchProvider');
    });
  });

  describe('Context State Management', () => {
    it('should provide current branch from hook data', () => {
      const mockHook = createMockBranchesHook({
        currentBranch: mockBranches[1]
      });
      mockUseBranches.mockReturnValue(mockHook);

      const { result } = renderHook(() => useBranchContext(), {
        wrapper: createWrapper()
      });

      expect(result.current.currentBranch).toEqual(mockBranches[1]);
    });

    it('should provide branches list', () => {
      const { result } = renderHook(() => useBranchContext(), {
        wrapper: createWrapper()
      });

      expect(result.current.branches).toEqual(mockBranches);
    });

    it('should provide loading state', () => {
      const mockHook = createMockBranchesHook({ isLoading: true });
      const mockHierarchyHook = createMockHierarchyHook({ isLoading: true });
      
      mockUseBranches.mockReturnValue(mockHook);
      mockUseBranchHierarchy.mockReturnValue(mockHierarchyHook);

      const { result } = renderHook(() => useBranchContext(), {
        wrapper: createWrapper()
      });

      expect(result.current.loading).toBe(true);
    });

    it('should provide error state', () => {
      const error = new Error('Failed to load branches');
      const mockHook = createMockBranchesHook({ error });
      mockUseBranches.mockReturnValue(mockHook);

      const { result } = renderHook(() => useBranchContext(), {
        wrapper: createWrapper()
      });

      expect(result.current.error).toBe('Failed to load branches');
    });
  });

  describe('Context Actions', () => {
    let mockQueryClient: any;

    beforeEach(() => {
      mockQueryClient = {
        invalidateQueries: vi.fn(),
        removeQueries: vi.fn(),
        setQueryData: vi.fn(),
      };
    });

    describe('createBranch', () => {
      it('should create branch and invalidate hierarchy', async () => {
        const createBranchMock = vi.fn().mockResolvedValue(mockBranch);
        const mockHook = createMockBranchesHook({
          createBranch: createBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        // Mock QueryClient
        vi.mock('@tanstack/react-query', async () => {
          const actual = await vi.importActual('@tanstack/react-query');
          return {
            ...actual,
            useQueryClient: () => mockQueryClient
          };
        });

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const createData: CreateBranchData = {
          name: 'New Branch',
          type: 'branch',
          address: mockBranch.address,
          contact: mockBranch.contact
        };

        await act(async () => {
          await result.current.createBranch(createData);
        });

        expect(createBranchMock).toHaveBeenCalledWith(createData);
      });

      it('should handle create errors', async () => {
        const error = new Error('Failed to create branch');
        const createBranchMock = vi.fn().mockRejectedValue(error);
        const mockHook = createMockBranchesHook({
          createBranch: createBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const createData: CreateBranchData = {
          name: 'New Branch',
          type: 'branch',
          address: mockBranch.address,
          contact: mockBranch.contact
        };

        await expect(async () => {
          await act(async () => {
            await result.current.createBranch(createData);
          });
        }).rejects.toThrow('Failed to create branch');
      });
    });

    describe('updateBranch', () => {
      it('should update branch successfully', async () => {
        const updateBranchMock = vi.fn().mockResolvedValue(mockBranch);
        const mockHook = createMockBranchesHook({
          updateBranch: updateBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const updateData: UpdateBranchData = { name: 'Updated Branch' };

        await act(async () => {
          await result.current.updateBranch('branch1', updateData);
        });

        expect(updateBranchMock).toHaveBeenCalledWith({ 
          branchId: 'branch1', 
          data: updateData 
        });
      });

      it('should handle update errors', async () => {
        const error = new Error('Failed to update branch');
        const updateBranchMock = vi.fn().mockRejectedValue(error);
        const mockHook = createMockBranchesHook({
          updateBranch: updateBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const updateData: UpdateBranchData = { name: 'Updated Branch' };

        await expect(async () => {
          await act(async () => {
            await result.current.updateBranch('branch1', updateData);
          });
        }).rejects.toThrow('Failed to update branch');
      });
    });

    describe('deleteBranch', () => {
      it('should delete branch successfully', async () => {
        const deleteBranchMock = vi.fn().mockResolvedValue(undefined);
        const mockHook = createMockBranchesHook({
          deleteBranch: deleteBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.deleteBranch('branch1');
        });

        expect(deleteBranchMock).toHaveBeenCalledWith('branch1');
      });

      it('should switch to another branch when deleting current branch', async () => {
        const deleteBranchMock = vi.fn().mockResolvedValue(undefined);
        const switchBranchMock = vi.fn().mockResolvedValue('branch2');
        
        mockUseAuth.mockReturnValue({ 
          user: { ...mockUser, currentBranch: 'branch1' }
        });
        
        const mockHook = createMockBranchesHook({
          branches: mockBranches,
          deleteBranch: deleteBranchMock,
          switchBranch: switchBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.deleteBranch('branch1');
        });

        expect(deleteBranchMock).toHaveBeenCalledWith('branch1');
        expect(switchBranchMock).toHaveBeenCalledWith('branch2');
      });

      it('should handle delete errors', async () => {
        const error = new Error('Failed to delete branch');
        const deleteBranchMock = vi.fn().mockRejectedValue(error);
        const mockHook = createMockBranchesHook({
          deleteBranch: deleteBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await expect(async () => {
          await act(async () => {
            await result.current.deleteBranch('branch1');
          });
        }).rejects.toThrow('Failed to delete branch');
      });
    });

    describe('cloneBranch', () => {
      it('should clone branch successfully', async () => {
        const cloneBranchMock = vi.fn().mockResolvedValue(mockBranch);
        const mockHook = createMockBranchesHook({
          cloneBranch: cloneBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const cloneData: CreateBranchData = {
          name: 'Cloned Branch',
          type: 'branch',
          address: mockBranch.address,
          contact: mockBranch.contact
        };

        await act(async () => {
          await result.current.cloneBranch('branch1', cloneData);
        });

        expect(cloneBranchMock).toHaveBeenCalledWith({
          sourceBranchId: 'branch1',
          data: cloneData
        });
      });
    });

    describe('switchBranch', () => {
      it('should switch branch and emit custom event', async () => {
        const switchBranchMock = vi.fn().mockResolvedValue('branch2');
        const mockHook = createMockBranchesHook({
          branches: mockBranches,
          switchBranch: switchBranchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        // Mock window.dispatchEvent
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.switchBranch('branch2');
        });

        expect(switchBranchMock).toHaveBeenCalledWith('branch2');
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'branchSwitched',
            detail: {
              branchId: 'branch2',
              branch: mockBranches[1]
            }
          })
        );

        dispatchEventSpy.mockRestore();
      });
    });

    describe('assignUserToBranch', () => {
      it('should assign user to branch successfully', async () => {
        const assignUserMock = vi.fn().mockResolvedValue(undefined);
        const mockHook = createMockBranchesHook({
          assignUserToBranch: assignUserMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.assignUserToBranch('user123', 'branch1');
        });

        expect(assignUserMock).toHaveBeenCalledWith({
          userId: 'user123',
          branchId: 'branch1'
        });
      });
    });

    describe('removeUserFromBranch', () => {
      it('should remove user from branch successfully', async () => {
        const removeUserMock = vi.fn().mockResolvedValue(undefined);
        const mockHook = createMockBranchesHook({
          removeUserFromBranch: removeUserMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.removeUserFromBranch('user123', 'branch1');
        });

        expect(removeUserMock).toHaveBeenCalledWith({
          userId: 'user123',
          branchId: 'branch1'
        });
      });
    });

    describe('fetchBranches', () => {
      it('should refetch branches data', async () => {
        const refetchMock = vi.fn().mockResolvedValue(undefined);
        const mockHook = createMockBranchesHook({
          refetch: refetchMock
        });
        mockUseBranches.mockReturnValue(mockHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        await act(async () => {
          await result.current.fetchBranches();
        });

        expect(refetchMock).toHaveBeenCalled();
      });
    });

    describe('fetchBranchHierarchy', () => {
      it('should refetch hierarchy data', async () => {
        const refetchMock = vi.fn().mockResolvedValue({ data: mockHierarchy });
        const mockHierarchyHook = createMockHierarchyHook({
          refetch: refetchMock
        });
        mockUseBranchHierarchy.mockReturnValue(mockHierarchyHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const hierarchyResult = await act(async () => {
          return await result.current.fetchBranchHierarchy();
        });

        expect(refetchMock).toHaveBeenCalled();
        expect(hierarchyResult).toEqual(mockHierarchy);
      });

      it('should return empty array on hierarchy fetch error', async () => {
        const refetchMock = vi.fn().mockRejectedValue(new Error('Fetch failed'));
        const mockHierarchyHook = createMockHierarchyHook({
          refetch: refetchMock
        });
        mockUseBranchHierarchy.mockReturnValue(mockHierarchyHook);

        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        const hierarchyResult = await act(async () => {
          return await result.current.fetchBranchHierarchy();
        });

        expect(hierarchyResult).toEqual([]);
      });
    });

    describe('fetchBranchMetrics', () => {
      it('should throw error suggesting to use hook directly', async () => {
        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        expect(() => {
          result.current.fetchBranchMetrics('branch1');
        }).toThrow('Use useBranchMetrics hook directly for metrics');
      });
    });

    describe('fetchConsolidatedMetrics', () => {
      it('should throw error suggesting to use hook directly', async () => {
        const { result } = renderHook(() => useBranchContext(), {
          wrapper: createWrapper()
        });

        expect(() => {
          result.current.fetchConsolidatedMetrics();
        }).toThrow('Use useConsolidatedMetrics hook directly for consolidated metrics');
      });
    });
  });

  describe('Auto-refresh Effect', () => {
    it('should refetch branches when user changes', async () => {
      const refetchMock = vi.fn();
      const mockHook = createMockBranchesHook({
        refetch: refetchMock
      });
      mockUseBranches.mockReturnValue(mockHook);

      const { rerender } = renderHook(() => useBranchContext(), {
        wrapper: createWrapper()
      });

      // Change user
      const newUser = { ...mockUser, id: 'newUser' };
      mockUseAuth.mockReturnValue({ user: newUser });

      rerender();

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalled();
      });
    });
  });
});

describe('Utility Hooks', () => {
  const wrapper = createWrapper();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseBranches.mockReturnValue(createMockBranchesHook());
    mockUseBranchHierarchy.mockReturnValue(createMockHierarchyHook());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useFilteredBranches', () => {
    it('should filter branches by provided function', () => {
      const filter = (branch: Branch) => branch.status === 'active';
      
      const { result } = renderHook(() => useFilteredBranches(filter), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current.every(branch => branch.status === 'active')).toBe(true);
    });

    it('should memoize filtered results', () => {
      const filter = vi.fn((branch: Branch) => branch.status === 'active');
      
      const { result, rerender } = renderHook(() => useFilteredBranches(filter), { wrapper });

      const firstResult = result.current;
      
      // Rerender with same filter
      rerender();
      
      expect(result.current).toBe(firstResult);
    });
  });

  describe('useActiveBranches', () => {
    it('should return only active branches', () => {
      const { result } = renderHook(() => useActiveBranches(), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current.every(branch => branch.status === 'active')).toBe(true);
    });
  });

  describe('useBranchesByType', () => {
    it('should return branches of specified type', () => {
      const { result } = renderHook(() => useBranchesByType('branch'), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current.every(branch => branch.type === 'branch')).toBe(true);
    });

    it('should return main branches', () => {
      const { result } = renderHook(() => useBranchesByType('main'), { wrapper });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].type).toBe('main');
    });
  });

  describe('useCanManageBranches', () => {
    it('should return true for admin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'admin' }
      });

      const { result } = renderHook(() => useCanManageBranches(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return true for superadmin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'superadmin' }
      });

      const { result } = renderHook(() => useCanManageBranches(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return false for regular users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'user' }
      });

      const { result } = renderHook(() => useCanManageBranches(), { wrapper });

      expect(result.current).toBe(false);
    });

    it('should return false when no user', () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useCanManageBranches(), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  describe('useUserBranches', () => {
    it('should return all branches for admin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'admin' }
      });

      const { result } = renderHook(() => useUserBranches(), { wrapper });

      expect(result.current).toEqual(mockBranches);
    });

    it('should return all branches for superadmin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'superadmin' }
      });

      const { result } = renderHook(() => useUserBranches(), { wrapper });

      expect(result.current).toEqual(mockBranches);
    });

    it('should return only assigned branches for regular users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user',
          assignedBranches: ['branch1', 'branch2']
        }
      });

      const { result } = renderHook(() => useUserBranches(), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current.map(b => b._id)).toEqual(['branch1', 'branch2']);
    });

    it('should return empty array when no user', () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useUserBranches(), { wrapper });

      expect(result.current).toEqual([]);
    });

    it('should return empty array when no branches', () => {
      mockUseBranches.mockReturnValue(createMockBranchesHook({
        branches: []
      }));

      const { result } = renderHook(() => useUserBranches(), { wrapper });

      expect(result.current).toEqual([]);
    });
  });

  describe('useCanSwitchBranches', () => {
    it('should return true for admin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'admin' }
      });

      const { result } = renderHook(() => useCanSwitchBranches(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return true for superadmin users', () => {
      mockUseAuth.mockReturnValue({ 
        user: { ...mockUser, role: 'superadmin' }
      });

      const { result } = renderHook(() => useCanSwitchBranches(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return true when user has multiple assigned branches', () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user',
          assignedBranches: ['branch1', 'branch2']
        }
      });

      const { result } = renderHook(() => useCanSwitchBranches(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('should return false when user has only one assigned branch', () => {
      mockUseAuth.mockReturnValue({ 
        user: { 
          ...mockUser, 
          role: 'user',
          assignedBranches: ['branch1']
        }
      });

      const { result } = renderHook(() => useCanSwitchBranches(), { wrapper });

      expect(result.current).toBe(false);
    });

    it('should return false when no user', () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useCanSwitchBranches(), { wrapper });

      expect(result.current).toBe(false);
    });
  });
});

describe('withBranchContext HOC', () => {
  it('should wrap component with BranchProvider', () => {
    const TestComponent = () => {
      const { branches } = useBranchContext();
      return <div data-testid="branch-count">{branches.length}</div>;
    };

    const WrappedComponent = withBranchContext(TestComponent);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <WrappedComponent />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('branch-count')).toHaveTextContent('3');
  });

  it('should preserve component props', () => {
    interface TestProps {
      testProp: string;
    }

    const TestComponent = ({ testProp }: TestProps) => {
      return <div data-testid="test-prop">{testProp}</div>;
    };

    const WrappedComponent = withBranchContext(TestComponent);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <WrappedComponent testProp="test-value" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('test-prop')).toHaveTextContent('test-value');
  });
});
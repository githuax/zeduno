/**
 * Branch Service Unit Tests
 * Comprehensive test suite for branch service API operations
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';

import { BranchService } from '@/services/branch.service';
import { 
  Branch, 
  CreateBranchData, 
  UpdateBranchData, 
  BranchFilters,
  BranchApiResponse,
  BranchMetricsApiResponse
} from '@/types/branch.types';

// Mock the API config
vi.mock('@/config/api', () => ({
  getApiUrl: vi.fn((endpoint: string) => `http://localhost:3000/api/${endpoint}`)
}));

// Mock fetch globally
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('BranchService', () => {
  const mockBranch: Branch = {
    _id: '64a7c9e123456789abcdef01',
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

  const mockResponse = (data: any, status: number = 200, ok: boolean = true): Response => {
    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(data)
    } as unknown as Response;
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Set up default auth
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ 
      tenantId: 'tenant123', 
      role: 'admin' 
    }));

    // Reset fetch mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication and Headers', () => {
    it('should include authorization header with regular token', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    it('should prefer superadmin token over regular token', async () => {
      localStorage.setItem('superadmin_token', 'superadmin-token');
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer superadmin-token'
          })
        })
      );
    });

    it('should include tenant ID header when available', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-ID': 'tenant123'
          })
        })
      );
    });

    it('should handle missing user data gracefully', async () => {
      localStorage.removeItem('user');
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-Tenant-ID': expect.any(String)
          })
        })
      );
    });
  });

  describe('getBranches', () => {
    it('should fetch all branches successfully', async () => {
      const mockData = [mockBranch];
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: mockData }));

      const result = await BranchService.getBranches();

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({ method: undefined })
      );
    });

    it('should apply filters correctly', async () => {
      const filters: BranchFilters = {
        status: 'active',
        type: 'branch',
        search: 'main',
        includeInactive: true
      };

      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches?includeInactive=true&status=active&type=branch&search=main',
        expect.any(Object)
      );
    });

    it('should handle empty response data', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: null }));

      const result = await BranchService.getBranches();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Server error' }, 500, false));

      await expect(BranchService.getBranches()).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(BranchService.getBranches()).rejects.toThrow('Network error');
    });
  });

  describe('getBranchHierarchy', () => {
    it('should fetch branch hierarchy successfully', async () => {
      const hierarchyData = [{ ...mockBranch, children: [] }];
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: hierarchyData 
      }));

      const result = await BranchService.getBranchHierarchy();

      expect(result).toEqual(hierarchyData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/hierarchy',
        expect.any(Object)
      );
    });

    it('should handle empty hierarchy', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: null }));

      const result = await BranchService.getBranchHierarchy();

      expect(result).toEqual([]);
    });
  });

  describe('getBranchById', () => {
    it('should fetch single branch successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: mockBranch 
      }));

      const result = await BranchService.getBranchById('64a7c9e123456789abcdef01');

      expect(result).toEqual(mockBranch);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/64a7c9e123456789abcdef01',
        expect.any(Object)
      );
    });

    it('should throw error for invalid branch ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Branch not found' 
      }));

      await expect(BranchService.getBranchById('invalid')).rejects.toThrow('Branch not found');
    });

    it('should throw error for array response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: [mockBranch] 
      }));

      await expect(BranchService.getBranchById('test')).rejects.toThrow('Branch not found');
    });
  });

  describe('createBranch', () => {
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

    it('should create branch successfully', async () => {
      const newBranch = { ...mockBranch, ...createData, _id: 'new-branch-id' };
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: newBranch 
      }));

      const result = await BranchService.createBranch(createData);

      expect(result).toEqual(newBranch);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData)
        })
      );
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Branch quota exceeded' 
      }));

      await expect(BranchService.createBranch(createData)).rejects.toThrow('Branch quota exceeded');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...createData, name: '' } as CreateBranchData;
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Name is required' 
      }));

      await expect(BranchService.createBranch(invalidData)).rejects.toThrow('Name is required');
    });
  });

  describe('updateBranch', () => {
    const updateData: UpdateBranchData = {
      name: 'Updated Branch Name',
      status: 'inactive'
    };

    it('should update branch successfully', async () => {
      const updatedBranch = { ...mockBranch, ...updateData };
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: updatedBranch 
      }));

      const result = await BranchService.updateBranch('branch-id', updateData);

      expect(result).toEqual(updatedBranch);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/branch-id',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Branch not found' 
      }));

      await expect(BranchService.updateBranch('invalid', updateData)).rejects.toThrow('Branch not found');
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      await expect(BranchService.deleteBranch('branch-id')).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/branch-id',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle deletion errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Cannot delete branch with active orders' 
      }));

      await expect(BranchService.deleteBranch('branch-id'))
        .rejects.toThrow('Cannot delete branch with active orders');
    });

    it('should handle branches with child branches', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Cannot delete branch with active child branches' 
      }));

      await expect(BranchService.deleteBranch('parent-branch'))
        .rejects.toThrow('Cannot delete branch with active child branches');
    });
  });

  describe('cloneBranch', () => {
    const cloneData: CreateBranchData = {
      name: 'Cloned Branch',
      type: 'branch',
      address: {
        street: '789 Pine St',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'USA'
      },
      contact: {
        phone: '+1-555-0789',
        email: 'chicago@example.com'
      }
    };

    it('should clone branch successfully', async () => {
      const clonedBranch = { ...mockBranch, ...cloneData, _id: 'cloned-branch-id' };
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        data: clonedBranch 
      }));

      const result = await BranchService.cloneBranch('source-branch-id', cloneData);

      expect(result).toEqual(clonedBranch);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/source-branch-id/clone',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(cloneData)
        })
      );
    });

    it('should handle clone errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'Source branch not found' 
      }));

      await expect(BranchService.cloneBranch('invalid', cloneData))
        .rejects.toThrow('Source branch not found');
    });
  });

  describe('User Assignment Operations', () => {
    describe('assignUserToBranch', () => {
      it('should assign user to branch successfully', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await expect(BranchService.assignUserToBranch('branch-id', 'user-id'))
          .resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/branches/branch-id/assign',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ userId: 'user-id' })
          })
        );
      });

      it('should handle assignment errors', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: false, 
          error: 'User not found' 
        }));

        await expect(BranchService.assignUserToBranch('branch-id', 'invalid-user'))
          .rejects.toThrow('User not found');
      });
    });

    describe('removeUserFromBranch', () => {
      it('should remove user from branch successfully', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

        await expect(BranchService.removeUserFromBranch('branch-id', 'user-id'))
          .resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/branches/branch-id/users/user-id',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      it('should handle removal errors', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: false, 
          error: 'User not assigned to this branch' 
        }));

        await expect(BranchService.removeUserFromBranch('branch-id', 'user-id'))
          .rejects.toThrow('User not assigned to this branch');
      });
    });
  });

  describe('switchBranch', () => {
    it('should switch branch successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: true, 
        currentBranch: 'new-branch-id' 
      }));

      const result = await BranchService.switchBranch('new-branch-id');

      expect(result).toBe('new-branch-id');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches/switch',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ branchId: 'new-branch-id' })
        })
      );
    });

    it('should handle switch errors', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ 
        success: false, 
        error: 'User not authorized to switch branches' 
      }));

      await expect(BranchService.switchBranch('unauthorized-branch'))
        .rejects.toThrow('User not authorized to switch branches');
    });

    it('should return fallback branch ID when currentBranch not provided', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await BranchService.switchBranch('fallback-branch');

      expect(result).toBe('fallback-branch');
    });
  });

  describe('Metrics Operations', () => {
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

    describe('getBranchMetrics', () => {
      it('should fetch branch metrics successfully', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockMetrics 
        }));

        const result = await BranchService.getBranchMetrics('branch-id');

        expect(result).toEqual(mockMetrics);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/branches/branch-id/metrics',
          expect.any(Object)
        );
      });

      it('should include date range in query parameters', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockMetrics 
        }));

        await BranchService.getBranchMetrics('branch-id', startDate, endDate);

        expect(mockFetch).toHaveBeenCalledWith(
          `http://localhost:3000/api/branches/branch-id/metrics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          expect.any(Object)
        );
      });

      it('should handle metrics errors', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: false, 
          error: 'Branch metrics not available' 
        }));

        await expect(BranchService.getBranchMetrics('invalid-branch'))
          .rejects.toThrow('Branch metrics not available');
      });
    });

    describe('getConsolidatedMetrics', () => {
      const mockConsolidated = {
        totals: {
          totalOrders: 5000,
          totalRevenue: 250000,
          totalBranches: 5,
          avgRevenuePerBranch: 50000,
          avgOrdersPerBranch: 1000
        },
        branches: [
          {
            branchId: 'branch1',
            branchName: 'Branch 1',
            branchCode: 'B1',
            orders: 1000,
            revenue: 50000,
            avgOrderValue: 50
          }
        ]
      };

      it('should fetch consolidated metrics successfully', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockConsolidated 
        }));

        const result = await BranchService.getConsolidatedMetrics();

        expect(result).toEqual(mockConsolidated);
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/branches/metrics/consolidated',
          expect.any(Object)
        );
      });

      it('should include date range in query parameters', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        
        mockFetch.mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockConsolidated 
        }));

        await BranchService.getConsolidatedMetrics(startDate, endDate);

        expect(mockFetch).toHaveBeenCalledWith(
          `http://localhost:3000/api/branches/metrics/consolidated?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          expect.any(Object)
        );
      });
    });
  });

  describe('Batch Operations', () => {
    it('should update multiple branches successfully', async () => {
      const updates = [
        { branchId: 'branch1', data: { name: 'Updated Branch 1' } },
        { branchId: 'branch2', data: { name: 'Updated Branch 2' } }
      ];

      const mockUpdatedBranches = [
        { ...mockBranch, _id: 'branch1', name: 'Updated Branch 1' },
        { ...mockBranch, _id: 'branch2', name: 'Updated Branch 2' }
      ];

      mockFetch
        .mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockUpdatedBranches[0] 
        }))
        .mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: mockUpdatedBranches[1] 
        }));

      const result = await BranchService.updateMultipleBranches(updates);

      expect(result).toEqual(mockUpdatedBranches);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch operations', async () => {
      const updates = [
        { branchId: 'branch1', data: { name: 'Updated Branch 1' } },
        { branchId: 'invalid', data: { name: 'Updated Branch 2' } }
      ];

      mockFetch
        .mockResolvedValueOnce(mockResponse({ 
          success: true, 
          data: { ...mockBranch, name: 'Updated Branch 1' }
        }))
        .mockResolvedValueOnce(mockResponse({ 
          success: false, 
          error: 'Branch not found' 
        }));

      await expect(BranchService.updateMultipleBranches(updates))
        .rejects.toThrow('Branch not found');
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse({ success: true, data: [mockBranch] }));
    });

    it('should get branches by type', async () => {
      await BranchService.getBranchesByType('main');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches?type=main',
        expect.any(Object)
      );
    });

    it('should get active branches only', async () => {
      await BranchService.getActiveBranches();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches?status=active',
        expect.any(Object)
      );
    });

    it('should search branches by term', async () => {
      await BranchService.searchBranches('main');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches?search=main',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle non-JSON responses', async () => {
      const textResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: vi.fn().mockRejectedValue(new Error('Not JSON'))
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(textResponse);

      const result = await BranchService.getBranches();

      expect(result).toEqual([]);
    });

    it('should handle malformed JSON responses', async () => {
      const response = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new Error('Malformed JSON'))
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(response);

      await expect(BranchService.getBranches()).rejects.toThrow('Malformed JSON');
    });

    it('should handle HTTP error responses with JSON error', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ error: 'Invalid request data' })
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(errorResponse);

      await expect(BranchService.getBranches()).rejects.toThrow('Invalid request data');
    });

    it('should handle HTTP error responses without JSON', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: vi.fn().mockRejectedValue(new Error('Not JSON'))
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(errorResponse);

      await expect(BranchService.getBranches()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle malformed user data in localStorage', async () => {
      localStorage.setItem('user', 'invalid-json');
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      // Should not throw, but should log warning
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await BranchService.getBranches();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse user data for tenant context:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters object', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches({});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.any(Object)
      );
    });

    it('should handle filters with undefined values', async () => {
      const filters: BranchFilters = {
        status: undefined,
        type: 'branch',
        search: undefined
      };

      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches?type=branch',
        expect.any(Object)
      );
    });

    it('should handle empty string filters', async () => {
      const filters: BranchFilters = {
        search: ''
      };

      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: [] }));

      await BranchService.getBranches(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/branches',
        expect.any(Object)
      );
    });
  });
});
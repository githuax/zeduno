import { 
  Branch, 
  BranchHierarchy, 
  BranchMetrics, 
  ConsolidatedMetrics,
  CreateBranchData, 
  UpdateBranchData, 
  BranchFilters,
  BranchApiResponse,
  BranchMetricsApiResponse
} from '@/types/branch.types';
import { apiRequest } from '@/utils/api';

const BASE_URL = '/branches';

export const branchApi = {
  // Get all branches for the current tenant
  async fetchBranches(filters?: BranchFilters): Promise<Branch[]> {
    const params = new URLSearchParams();
    
    if (filters?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    
    const response = await apiRequest<BranchApiResponse>(url);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get branch hierarchy
  async fetchBranchHierarchy(): Promise<BranchHierarchy[]> {
    const response = await apiRequest<{ success: boolean; data: BranchHierarchy[] }>(`${BASE_URL}/hierarchy`);
    return response.data || [];
  },

  // Get single branch by ID
  async fetchBranchById(branchId: string): Promise<Branch> {
    const response = await apiRequest<BranchApiResponse>(`${BASE_URL}/${branchId}`);
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error('Branch not found');
    }
    return response.data;
  },

  // Create new branch
  async createBranch(data: CreateBranchData): Promise<Branch> {
    const response = await apiRequest<BranchApiResponse>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to create branch');
    }
    return response.data;
  },

  // Update branch
  async updateBranch(branchId: string, data: UpdateBranchData): Promise<Branch> {
    const response = await apiRequest<BranchApiResponse>(`${BASE_URL}/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to update branch');
    }
    return response.data;
  },

  // Delete branch (soft delete)
  async deleteBranch(branchId: string): Promise<void> {
    const response = await apiRequest<{ success: boolean; message?: string; error?: string }>(
      `${BASE_URL}/${branchId}`, 
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete branch');
    }
  },

  // Clone branch
  async cloneBranch(sourceBranchId: string, data: CreateBranchData): Promise<Branch> {
    const response = await apiRequest<BranchApiResponse>(`${BASE_URL}/${sourceBranchId}/clone`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to clone branch');
    }
    return response.data;
  },

  // User-Branch Management
  async assignUserToBranch(branchId: string, userId: string): Promise<void> {
    const response = await apiRequest<{ success: boolean; error?: string }>(
      `${BASE_URL}/${branchId}/users`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to assign user to branch');
    }
  },

  async removeUserFromBranch(branchId: string, userId: string): Promise<void> {
    const response = await apiRequest<{ success: boolean; error?: string }>(
      `${BASE_URL}/${branchId}/users/${userId}`,
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove user from branch');
    }
  },

  // Switch current branch for authenticated user
  async switchBranch(branchId: string): Promise<void> {
    const response = await apiRequest<{ 
      success: boolean; 
      currentBranch?: string; 
      error?: string 
    }>(`${BASE_URL}/switch`, {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to switch branch');
    }
  },

  // Metrics
  async fetchBranchMetrics(
    branchId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<BranchMetrics> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${BASE_URL}/${branchId}/metrics?${queryString}`
      : `${BASE_URL}/${branchId}/metrics`;
    
    const response = await apiRequest<BranchMetricsApiResponse>(url);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch branch metrics');
    }
    
    return response.data as BranchMetrics;
  },

  async fetchConsolidatedMetrics(
    startDate?: Date, 
    endDate?: Date
  ): Promise<ConsolidatedMetrics> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${BASE_URL}/metrics/consolidated?${queryString}`
      : `${BASE_URL}/metrics/consolidated`;
    
    const response = await apiRequest<BranchMetricsApiResponse>(url);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consolidated metrics');
    }
    
    return response.data as ConsolidatedMetrics;
  },
};

export default branchApi;